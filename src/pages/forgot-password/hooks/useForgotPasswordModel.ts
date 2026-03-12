import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

import { authApi } from "@/api";
import type { ApiError } from "@/api/contracts";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "react-i18next";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function useForgotPasswordModel() {
  const location = useLocation();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { t } = useTranslation(["auth", "common"]);

  const [email, setEmail] = useState("");
  const [step, setStep] = useState<"email" | "reset">("email");
  const [code, setCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [resendLeft, setResendLeft] = useState(0);

  const canResend = useMemo(() => resendLeft <= 0 && !isLoading, [resendLeft, isLoading]);

  useEffect(() => {
    if (resendLeft <= 0) {
      return undefined;
    }

    const timer = window.setInterval(() => setResendLeft((seconds) => Math.max(0, seconds - 1)), 1000);
    return () => window.clearInterval(timer);
  }, [resendLeft]);

  const handleSendCode = async (event?: React.FormEvent) => {
    event?.preventDefault();

    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      toast({ title: t("common:error"), description: t("errors.input_required"), variant: "destructive" });
      return;
    }
    if (!EMAIL_RE.test(trimmedEmail)) {
      toast({ title: t("common:error"), description: t("errors.email_format"), variant: "destructive" });
      return;
    }

    setIsLoading(true);
    try {
      await authApi.forgotPassword({ email: trimmedEmail });
      toast({
        title: t("errors.code_sent"),
        description: t("errors.code_sent_desc", { email: trimmedEmail }),
      });
      setStep("reset");
      setResendLeft(60);
    } catch (error: unknown) {
      const apiError = error as Partial<ApiError>;
      toast({
        title: t("errors.send_failed"),
        description: apiError.message || t("errors.operation_failed"),
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = async (event: React.FormEvent) => {
    event.preventDefault();

    const trimmedEmail = email.trim();
    if (!trimmedEmail || !EMAIL_RE.test(trimmedEmail)) {
      toast({ title: t("common:error"), description: t("errors.email_format"), variant: "destructive" });
      return;
    }
    if (!code || code.length !== 6) {
      toast({ title: t("common:error"), description: t("errors.code_length"), variant: "destructive" });
      return;
    }
    if (!newPassword || newPassword.length < 6) {
      toast({ title: t("common:error"), description: t("errors.password_length"), variant: "destructive" });
      return;
    }

    setIsLoading(true);
    try {
      await authApi.resetPassword({ email: trimmedEmail, code, new_password: newPassword });
      toast({ title: t("errors.reset_success"), description: t("errors.reset_success") });
      navigate("/login", { state: location.state });
    } catch (error: unknown) {
      const apiError = error as Partial<ApiError>;
      toast({
        title: t("errors.reset_failed"),
        description: apiError.message || t("errors.code_invalid"),
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return {
    canResend,
    code,
    email,
    handleReset,
    handleSendCode,
    isLoading,
    locationState: location.state,
    newPassword,
    resendLeft,
    setCode,
    setEmail,
    setNewPassword,
    setStep,
    step,
  };
}

export { useForgotPasswordModel };
