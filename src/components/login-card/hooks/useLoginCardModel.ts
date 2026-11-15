import { useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

import { authApi } from "@/api";
import type { ApiError } from "@/api/contracts";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import type { User as AppUser } from "@/types";
import type { LoginAttempt } from '@/contexts/auth-context';
import { useTranslation } from "react-i18next";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function normalizeErrorMessage(err: unknown): string {
  const message = String((err as Partial<ApiError>)?.message || "");

  if (message.includes("Unauthorized") || message.includes("401")) return "errors.invalid_email_password";
  if (message.includes("403")) return "errors.email_not_verified";
  if (message.includes("429") || message.includes("Too many login attempts")) return "errors.too_many_requests";
  if (message.includes("500")) return "errors.server_busy";
  if (message.includes("Incorrect email or password") || message.includes("Invalid credentials")) return "errors.invalid_email_password";
  if (message.includes("Email not verified")) return "errors.register_needed";
  if (message.includes("Invalid code")) return "errors.code_invalid";
  if (message.includes("Too many incorrect codes")) return "errors.too_many_requests";

  return message || "errors.login_failed";
}

function useLoginCardModel() {
  const { toast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const { beginLogin } = useAuth();
  const { t } = useTranslation(["auth", "common"]);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [loginMode, setLoginMode] = useState<"password" | "otp">("password");
  const [code, setCode] = useState("");
  const [cooldown, setCooldown] = useState(0);
  const [isSendingCode, setIsSendingCode] = useState(false);
  const activeAttempt = useRef<LoginAttempt | null>(null);

  // Invalidation is required even when an adapter/mock ignores AbortSignal.
  useEffect(() => () => {
    const attempt = activeAttempt.current;
    activeAttempt.current = null;
    attempt?.cancel();
  }, []);

  useEffect(() => {
    if (cooldown <= 0) {
      return undefined;
    }

    const intervalId = window.setInterval(() => setCooldown((seconds) => Math.max(0, seconds - 1)), 1000);
    return () => window.clearInterval(intervalId);
  }, [cooldown]);

  const emailOk = useMemo(() => EMAIL_RE.test(email.trim()), [email]);
  const passwordOk = useMemo(() => password.length >= 6, [password]);

  const handleSendCode = async () => {
    if (!emailOk) {
      toast({ title: t("common:error"), description: t("errors.email_format"), variant: "destructive" });
      return;
    }

    setIsSendingCode(true);
    try {
      await authApi.sendLoginCode({ email: email.trim() });
      setCooldown(60);
      toast({
        title: t("errors.code_sent"),
        description: t("errors.code_sent_desc", { email: email.trim() }),
      });
    } catch (error: unknown) {
      const errorKeyOrMessage = normalizeErrorMessage(error);
      toast({
        title: t("errors.send_failed"),
        description: errorKeyOrMessage.startsWith("errors.") ? t(errorKeyOrMessage) : errorKeyOrMessage,
        variant: "destructive",
      });
    } finally {
      setIsSendingCode(false);
    }
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (activeAttempt.current?.isCurrent()) return;

    const trimmedEmail = email.trim();
    if (!trimmedEmail || !password) {
      toast({ title: t("common:error"), description: t("errors.input_required"), variant: "destructive" });
      return;
    }
    if (!emailOk) {
      toast({ title: t("common:error"), description: t("errors.email_format"), variant: "destructive" });
      return;
    }
    if (!passwordOk) {
      toast({ title: t("common:error"), description: t("errors.password_length"), variant: "destructive" });
      return;
    }

    if (loginMode === 'otp' && (!code || code.length !== 4)) {
      toast({ title: t('common:error'), description: t('login.enter_code_hint'), variant: 'destructive' });
      return;
    }
    const attempt = beginLogin();
    activeAttempt.current = attempt;
    const onAbort = () => {
      if (activeAttempt.current === attempt) setIsLoading(false);
    };
    attempt.signal.addEventListener('abort', onAbort, { once: true });
    setIsLoading(true);
    try {
      let accessToken = "";

      if (loginMode === "password") {
        const response = await authApi.login({
          username: trimmedEmail,
          password,
        }, attempt.signal);
        accessToken = response.access_token;
      } else {
        const response = await authApi.loginWithCode({
          email: trimmedEmail,
          password,
          code,
        }, attempt.signal);
        accessToken = response.access_token;
      }

      if (!attempt.isCurrent()) return;
      const user = await authApi.getProfile(accessToken, attempt.signal);
      const mappedUser: AppUser = {
        ...user,
        id: String(user.id),
        username: user.full_name || user.email.split("@")[0],
      };
      if (!attempt.complete(mappedUser, accessToken, rememberMe)) return;

      toast({
        title: t("errors.login_success"),
        description: t("errors.welcome_back", { name: user.full_name || user.email.split("@")[0] }),
      });

      const from = (location.state as { from?: { pathname?: string; search?: string; hash?: string } } | null)?.from;
      const redirectTo = from?.pathname ? `${from.pathname}${from.search || ""}${from.hash || ""}` : "/dashboard";
      navigate(redirectTo, { replace: true });
    } catch (error: unknown) {
      if (!attempt.isCurrent()) return;
      const errorKeyOrMessage = normalizeErrorMessage(error);
      toast({
        title: t("common:error"),
        description: errorKeyOrMessage.startsWith("errors.") ? t(errorKeyOrMessage) : errorKeyOrMessage,
        variant: "destructive",
      });
    } finally {
      attempt.signal.removeEventListener('abort', onAbort);
      if (activeAttempt.current === attempt) {
        activeAttempt.current = null;
        setIsLoading(false);
      }
      attempt.cancel();
    }
  };

  const toggleLoginMode = () => {
    activeAttempt.current?.cancel();
    setLoginMode((mode) => (mode === "password" ? "otp" : "password"));
  };

  return {
    code,
    cooldown,
    email,
    emailOk,
    handleSendCode,
    handleSubmit,
    isLoading,
    isSendingCode,
    locationState: location.state,
    loginMode,
    password,
    passwordOk,
    rememberMe,
    setCode,
    setEmail,
    setPassword,
    setRememberMe,
    setShowPassword,
    showPassword,
    toggleLoginMode,
  };
}

export { useLoginCardModel };
