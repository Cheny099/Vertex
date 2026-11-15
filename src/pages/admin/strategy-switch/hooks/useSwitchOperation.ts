import { useEffect, useRef, useState } from 'react';
import { z } from 'zod';
import { useAuth } from '@/hooks/use-auth';

type SwitchRequest<Form> = Form & { request_id: string; reason: string };
type Options<Form, Preview, Result> = {
  kind: 'single' | 'bulk';
  initialForm: Form;
  schema: z.ZodType<Form>;
  reason: string;
  preview: (form: Form) => Promise<Preview>;
  execute: (request: SwitchRequest<Form>) => Promise<Result>;
  onSuccess: (result: Result) => void;
  onError: (error: unknown) => void;
  invalidFormMessage: string;
  storageErrorMessage: string;
};

/** One lifecycle for both switch flows: preview snapshot, immutable request, and receipt.
 * The tab-local journal is scoped by user and survives remount/reload. Retrying a request
 * whose response was lost must use the same ID AND body, including its original reason.
 */
export function useSwitchOperation<Form extends object, Preview, Result>(options: Options<Form, Preview, Result>) {
  const { user } = useAuth();
  const storageKey = `vertex_switch_v1:${encodeURIComponent(user?.id ?? '')}:${options.kind}`;
  const requestSchema = options.schema.and(z.object({ request_id: z.string().uuid(), reason: z.string() }));
  const [saved] = useState(() => {
    const requests: Record<string, SwitchRequest<Form>> = {};
    let form = options.initialForm;
    try {
      const raw = JSON.parse(sessionStorage.getItem(storageKey) ?? 'null');
      const decodedForm = options.schema.safeParse(raw?.lastForm);
      if (decodedForm.success) form = decodedForm.data;
      if (raw?.requests && typeof raw.requests === 'object') {
        for (const [key, value] of Object.entries(raw.requests)) {
          const decoded = requestSchema.safeParse(value);
          if (decoded.success && JSON.stringify(options.schema.parse(decoded.data)) === key) requests[key] = decoded.data;
        }
      }
    } catch { /* No valid journal yet. A failed write must still block execution below. */ }
    return { form, requests };
  });
  const [form, setForm] = useState(saved.form);
  const formRef = useRef(form);
  const [journal, setJournal] = useState(saved.requests);
  const requests = useRef(journal);
  const revision = useRef(0);
  const mounted = useRef(false);
  const inFlight = useRef(false);
  const [previewData, setPreviewData] = useState<Preview>();
  const previewKey = useRef<string>();
  const [previewPending, setPreviewPending] = useState(false);
  const [result, setResult] = useState<Result>();
  const resultRef = useRef<Result>();
  const [executePending, setExecutePending] = useState(false);

  useEffect(() => {
    mounted.current = true;
    return () => { mounted.current = false; revision.current += 1; };
  }, []);

  const parseForm = () => {
    const parsed = options.schema.safeParse(formRef.current);
    if (!user || !parsed.success) {
      options.onError(new Error(options.invalidFormMessage));
      return null;
    }
    return parsed.data;
  };

  const patchForm = (patch: Partial<Form>) => {
    if (inFlight.current) return;
    const next = { ...formRef.current, ...patch };
    if (JSON.stringify(next) === JSON.stringify(formRef.current)) return;
    formRef.current = next;
    revision.current += 1;
    previewKey.current = undefined;
    setForm(next);
    setPreviewData(undefined);
    setPreviewPending(false);
    setResult(undefined);
    resultRef.current = undefined;
  };

  const preview = async () => {
    if (inFlight.current) return;
    const snapshot = parseForm();
    if (!snapshot) return;
    const current = ++revision.current;
    previewKey.current = undefined;
    setPreviewData(undefined);
    setPreviewPending(true);
    try {
      const data = await options.preview(snapshot);
      if (!mounted.current || current !== revision.current) return;
      previewKey.current = JSON.stringify(snapshot);
      setPreviewData(data);
    } catch (error) {
      if (mounted.current && current === revision.current) options.onError(error);
    } finally {
      if (mounted.current && current === revision.current) setPreviewPending(false);
    }
  };

  const save = (snapshot: Form, next: Record<string, SwitchRequest<Form>>) => {
    try {
      sessionStorage.setItem(storageKey, JSON.stringify({ lastForm: snapshot, requests: next }));
    } catch {
      throw new Error(options.storageErrorMessage);
    }
    requests.current = next;
    setJournal(next);
  };

  const execute = async () => {
    if (inFlight.current || resultRef.current !== undefined) return;
    const snapshot = parseForm();
    if (!snapshot) return;
    const key = JSON.stringify(snapshot);
    // A previously submitted request is recovery, not a new action requiring a new preview.
    if (!requests.current[key] && previewKey.current !== key) return;
    inFlight.current = true;
    setExecutePending(true);
    revision.current += 1;
    setPreviewPending(false);
    try {
      const request = requests.current[key] ?? { ...snapshot, request_id: crypto.randomUUID(), reason: options.reason };
      save(snapshot, { ...requests.current, [key]: request });
      const response = await options.execute({ ...request });
      if (!mounted.current) return;
      resultRef.current = response;
      setResult(response);
      options.onSuccess(response);
    } catch (error) {
      if (mounted.current) options.onError(error);
    } finally {
      inFlight.current = false;
      if (mounted.current) setExecutePending(false);
    }
  };

  // Called only after the server reports a terminal run/campaign. A failed HTTP request
  // is NOT evidence that nothing executed, so it cannot implicitly discard the saved ID.
  const startNew = () => {
    if (inFlight.current || resultRef.current === undefined) return;
    const snapshot = parseForm();
    if (!snapshot) return;
    const next = { ...requests.current };
    delete next[JSON.stringify(snapshot)];
    try { save(snapshot, next); } catch (error) { options.onError(error); return; }
    revision.current += 1;
    previewKey.current = undefined;
    setPreviewData(undefined);
    setPreviewPending(false);
    setResult(undefined);
    resultRef.current = undefined;
  };

  const parsed = options.schema.safeParse(form);
  const key = parsed.success ? JSON.stringify(parsed.data) : '';
  const hasSubmitted = !!journal[key];
  return {
    form, patchForm, preview, execute, startNew, result, previewData, previewPending, executePending,
    hasSubmitted,
    canExecute: !!user && !executePending && result === undefined && !!key && (hasSubmitted || previewKey.current === key),
  };
}
