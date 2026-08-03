import { useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

import { authApi } from "@/api";
import type { ApiError } from "@/api/contracts";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "react-i18next";

const OTP_TTL_SECONDS = 300;
const RESEND_COOLDOWN_SECONDS = 60;

type RegisterFormState = {
  username: string;
  email: string;
  password: string;
  code: string;
  confirmPassword: string;
};

function isValidEmail(email: string): boolean {
  const value = email.trim();
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function maskEmail(email: string): string {
  const value = email.trim();
  const at = value.indexOf("@");
  if (at <= 1) {
    return value;
  }

  const name = value.slice(0, at);
  const domain = value.slice(at);
  const head = name.slice(0, 1);
  const tail = name.slice(-1);
  return `${head}${"*".repeat(Math.min(6, Math.max(1, name.length - 2)))}${tail}${domain}`;
}

function humanizeAuthError(err: unknown): string {
  const message = String((err as Partial<ApiError>)?.message || "").trim();
  if (/too many/i.test(message) || /429/.test(message)) return "errors.too_many_requests";
  if (/email already registered/i.test(message)) return "errors.email_exists";
  if (/invalid or expired code/i.test(message)) return "errors.code_invalid";
  if (/could not validate|undeliverable|mx/i.test(message)) return "errors.email_undeliverable";
  if (/API Error 422/i.test(message)) return "errors.invalid_input";
  return message || "errors.operation_failed";
}

function useRegisterModel() {
  const location = useLocation();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { t } = useTranslation(["auth", "common"]);
  const otpRef = useRef<HTMLInputElement | null>(null);
  // Timers that outlive the component: the focus one is harmless after unmount, but the redirect
  // performs a real navigation and would yank the user off whatever they opened in the meantime
  // (the Terms or Privacy link on this very form).
  const pendingTimers = useRef<number[]>([]);
  useEffect(
    () => () => {
      pendingTimers.current.forEach((id) => window.clearTimeout(id));
      pendingTimers.current = [];
    },
    []
  );
  const scheduleTimeout = (fn: () => void, ms: number) => {
    pendingTimers.current.push(window.setTimeout(fn, ms));
  };

  const [formData, setFormData] = useState<RegisterFormState>({
    username: "",
    email: "",
    password: "",
    code: "",
    confirmPassword: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSendingCode, setIsSendingCode] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [lastSentEmail, setLastSentEmail] = useState<string | null>(null);

  const normalizedEmail = useMemo(() => formData.email.trim(), [formData.email]);
  const emailOk = useMemo(() => isValidEmail(normalizedEmail), [normalizedEmail]);

  useEffect(() => {
    if (cooldown <= 0) {
      return undefined;
    }

    const timer = window.setInterval(() => setCooldown((seconds) => Math.max(0, seconds - 1)), 1000);
    return () => window.clearInterval(timer);
  }, [cooldown]);

  useEffect(() => {
    if (!lastSentEmail) {
      return;
    }

    if (normalizedEmail && normalizedEmail !== lastSentEmail) {
      setCooldown(0);
      setLastSentEmail(null);
      setFormData((prev) => ({ ...prev, code: "" }));
    }
  }, [lastSentEmail, normalizedEmail]);

  const canSendCode = emailOk && cooldown === 0 && !isSendingCode;
  const canSubmit =
    emailOk &&
    formData.password.length >= 6 &&
    formData.password === formData.confirmPassword &&
    formData.code.length === 6 &&
    agreeTerms &&
    !isLoading;

  const setFormField = <K extends keyof RegisterFormState>(field: K, value: RegisterFormState[K]) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSendCode = async () => {
    if (!emailOk) {
      toast({ title: t("common:error"), description: t("errors.email_format"), variant: "destructive" });
      return;
    }

    setIsSendingCode(true);
    try {
      await authApi.sendRegisterCode({ email: normalizedEmail });
      setLastSentEmail(normalizedEmail);
      setCooldown(RESEND_COOLDOWN_SECONDS);
      toast({
        title: t("errors.code_sent"),
        description: t("errors.code_sent_desc", { email: maskEmail(normalizedEmail) }),
      });
      scheduleTimeout(() => otpRef.current?.focus(), 200);
    } catch (error: unknown) {
      const errorKey = humanizeAuthError(error);
      toast({
        title: t("errors.send_failed"),
        description: errorKey.startsWith("errors.") ? t(errorKey) : errorKey,
        variant: "destructive",
      });
    } finally {
      setIsSendingCode(false);
    }
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!emailOk) {
      toast({ title: t("common:error"), description: t("errors.email_format"), variant: "destructive" });
      return;
    }
    if (formData.code.length !== 6) {
      toast({ title: t("common:error"), description: t("errors.code_length"), variant: "destructive" });
      return;
    }
    if (formData.password.length < 6) {
      toast({ title: t("common:error"), description: t("errors.password_length"), variant: "destructive" });
      return;
    }
    if (formData.password !== formData.confirmPassword) {
      toast({ title: t("common:error"), description: t("errors.password_mismatch"), variant: "destructive" });
      return;
    }
    if (!agreeTerms) {
      toast({ title: t("common:error"), description: t("errors.agree_terms"), variant: "destructive" });
      return;
    }

    setIsLoading(true);
    try {
      await authApi.register({
        email: normalizedEmail,
        password: formData.password,
        full_name: formData.username.trim() || undefined,
        code: formData.code,
      });

      toast({ title: t("errors.register_success"), description: t("errors.register_success") });
      scheduleTimeout(() => navigate("/login", { state: location.state }), 900);
    } catch (error: unknown) {
      const errorKey = humanizeAuthError(error);
      toast({
        title: t("errors.register_failed"),
        description: errorKey.startsWith("errors.") ? t(errorKey) : errorKey,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return {
    agreeTerms,
    canSendCode,
    canSubmit,
    cooldown,
    emailOk,
    formData,
    handleSendCode,
    handleSubmit,
    isLoading,
    isSendingCode,
    lastSentEmail,
    locationState: location.state,
    normalizedEmail,
    otpRef,
    setAgreeTerms,
    setFormField,
    setShowPassword,
    showPassword,
    otpTtlSeconds: OTP_TTL_SECONDS,
    resendCooldownSeconds: RESEND_COOLDOWN_SECONDS,
    maskEmail,
  };
}

export { useRegisterModel };
