/**
 * @anchor-id FORGOT_PASSWORD_PAGE
 * @module-type page
 * @disposable false
 * @description 忘记密码/重置密码页面 - 对接真实后端
 */

import { useEffect, useMemo, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Mail, ArrowLeft, Lock, KeyRound, RefreshCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import ParticleBackground from "@/components/ParticleBackground";
import { authApi } from "@/api";
import { useTranslation } from "react-i18next";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const ForgotPassword = () => {
  // Step 1: Email
  const [email, setEmail] = useState("");

  // Step 2: Reset
  const [step, setStep] = useState<"email" | "reset">("email");
  const [code, setCode] = useState("");
  const [newPassword, setNewPassword] = useState("");

  const [isLoading, setIsLoading] = useState(false);
  const [resendLeft, setResendLeft] = useState(0); // seconds
  const { toast } = useToast();
  const navigate = useNavigate();
  const { t } = useTranslation(['auth', 'common']);

  const canResend = useMemo(() => resendLeft <= 0 && !isLoading, [resendLeft, isLoading]);

  useEffect(() => {
    if (resendLeft <= 0) return;
    const t = setInterval(() => setResendLeft((s) => Math.max(0, s - 1)), 1000);
    return () => clearInterval(t);
  }, [resendLeft]);

  const handleSendCode = async (e?: React.FormEvent) => {
    e?.preventDefault();

    const trimmed = (email || "").trim();
    if (!trimmed) {
      toast({ title: t('common:error'), description: t('errors.input_required'), variant: "destructive" });
      return;
    }
    if (!EMAIL_RE.test(trimmed)) {
      toast({ title: t('common:error'), description: t('errors.email_format'), variant: "destructive" });
      return;
    }

    setIsLoading(true);
    try {
      await authApi.forgotPassword({ email: trimmed });
      toast({
        title: t('errors.code_sent'),
        description: t('errors.code_sent_desc', { email: trimmed }), // Actually auth.json doesn't have {{email}} in code_sent_desc in my previous step? Oh wait, I added it in the replace call.
      });
      setStep("reset");
      setResendLeft(60);
    } catch (error: any) {
      toast({
        title: t('errors.send_failed'),
        description: error.message || t('errors.operation_failed'),
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();

    const trimmed = (email || "").trim();
    if (!trimmed || !EMAIL_RE.test(trimmed)) {
      toast({ title: t('common:error'), description: t('auth.errors.email_format'), variant: "destructive" });
      return;
    }

    if (!code || code.length !== 6) {
      toast({ title: t('common:error'), description: t('auth.errors.code_length'), variant: "destructive" });
      return;
    }

    if (!newPassword || newPassword.length < 8) {
      toast({ title: t('common:error'), description: t('auth.errors.password_length'), variant: "destructive" });
      return;
    }

    setIsLoading(true);
    try {
      await authApi.resetPassword({ email: trimmed, code, new_password: newPassword });
      toast({
        title: t('auth.errors.reset_success'),
        description: t('auth.errors.reset_success'), // Reusing key for description or leave empty.
      });
      navigate("/");
    } catch (error: any) {
      toast({
        title: t('auth.errors.reset_failed'),
        description: error.message || t('auth.errors.code_invalid'),
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen overflow-hidden">
      <div className="fixed inset-0" style={{ background: "var(--gradient-background)" }} />
      <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-primary/5 blur-3xl animate-pulse-glow pointer-events-none" />
      <ParticleBackground />

      <div className="relative z-10 min-h-screen flex items-center justify-center px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="relative w-full max-w-md mx-4"
        >
          <div className="relative bg-card rounded-2xl shadow-card p-8 md:p-10 overflow-hidden">
            <div className="absolute left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-primary to-transparent scanner-line opacity-60" />
            <div className="absolute top-4 left-4 w-3 h-3 border-l-2 border-t-2 border-primary/40 rounded-tl-sm" />
            <div className="absolute top-4 right-4 w-3 h-3 border-r-2 border-t-2 border-primary/40 rounded-tr-sm" />
            <div className="absolute bottom-4 left-4 w-3 h-3 border-l-2 border-b-2 border-primary/40 rounded-bl-sm" />
            <div className="absolute bottom-4 right-4 w-3 h-3 border-r-2 border-b-2 border-primary/40 rounded-br-sm" />

            <Link
              to="/"
              className="absolute top-4 left-4 text-muted-foreground hover:text-foreground transition-colors z-10"
            >
              <ArrowLeft size={20} />
            </Link>

            <div className="text-center mb-8 pt-4">
              <h1 className="text-2xl font-semibold text-primary">
                {step === "email" ? t('forgot_password.title') : t('forgot_password.reset_title')}
              </h1>
              <p className="text-sm text-muted-foreground mt-2">
                {step === "email"
                  ? t('forgot_password.subtitle_email')
                  : t('forgot_password.subtitle_reset')}
              </p>
            </div>

            {step === "email" ? (
              <form onSubmit={handleSendCode} className="space-y-5">
                <div className="relative">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground">
                    <Mail size={18} />
                  </div>
                  <Input
                    type="email"
                    placeholder={t('forgot_password.email_placeholder')}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-11 h-12 bg-input border-border/50 focus:border-primary transition-all duration-300"
                    autoComplete="email"
                  />
                </div>

                <Button
                  type="submit"
                  className="w-full h-12 gradient-primary text-primary-foreground font-medium text-base shadow-button hover:shadow-lg transition-all duration-300 hover:scale-[1.02]"
                  disabled={isLoading}
                >
                  {isLoading ? t('forgot_password.sending') : t('forgot_password.send_code')}
                </Button>
              </form>
            ) : (
              <form onSubmit={handleReset} className="space-y-5">
                <div className="p-3 bg-secondary/20 rounded-lg mb-4 text-center">
                  <p className="text-sm text-muted-foreground">
                    {t('forgot_password.code_sent_to')} <span className="text-primary">{email}</span>
                  </p>
                  <div className="mt-2 flex items-center justify-center gap-3">
                    <button
                      type="button"
                      onClick={() => setStep("email")}
                      className="text-xs text-muted-foreground hover:underline"
                    >
                      {t('forgot_password.change_email')}
                    </button>

                    <button
                      type="button"
                      onClick={() => canResend && handleSendCode()}
                      disabled={!canResend}
                      className="text-xs text-muted-foreground hover:underline disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center gap-1"
                    >
                      <RefreshCcw size={12} />
                      {resendLeft > 0 ? t('register.resend_cooldown', { s: resendLeft }) : t('register.resend')}
                    </button>
                  </div>
                </div>

                <div className="relative">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground">
                    <KeyRound size={18} />
                  </div>
                  <Input
                    type="text"
                    placeholder={t('forgot_password.code_placeholder')}
                    value={code}
                    onChange={(e) => {
                      const onlyNum = e.target.value.replace(/\D/g, "").slice(0, 6);
                      setCode(onlyNum);
                    }}
                    className="pl-11 h-12 bg-input border-border/50 focus:border-primary"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                  />
                </div>

                <div className="relative">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground">
                    <Lock size={18} />
                  </div>
                  <Input
                    type="password"
                    placeholder={t('forgot_password.new_password_placeholder')}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="pl-11 h-12 bg-input border-border/50 focus:border-primary"
                    autoComplete="new-password"
                  />
                </div>

                <Button
                  type="submit"
                  className="w-full h-12 gradient-primary text-primary-foreground font-medium text-base shadow-button hover:shadow-lg transition-all duration-300 hover:scale-[1.02]"
                  disabled={isLoading}
                >
                  {isLoading ? t('forgot_password.resetting') : t('forgot_password.confirm_reset')}
                </Button>
              </form>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default ForgotPassword;
