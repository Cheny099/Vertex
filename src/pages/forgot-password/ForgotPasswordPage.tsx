import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, KeyRound, Lock, Mail, RefreshCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import ParticleBackground from "@/components/ParticleBackground";
import { useTranslation } from "react-i18next";

import { useForgotPasswordModel } from "./hooks/useForgotPasswordModel";

function ForgotPasswordPage() {
  const { t } = useTranslation(["auth", "common"]);
  const {
    canResend,
    code,
    email,
    handleReset,
    handleSendCode,
    isLoading,
    locationState,
    newPassword,
    resendLeft,
    setCode,
    setEmail,
    setNewPassword,
    setStep,
    step,
  } = useForgotPasswordModel();

  return (
    <div className="relative min-h-screen overflow-hidden">
      <div className="fixed inset-0" style={{ background: "var(--gradient-background)" }} />
      <div className="fixed top-1/2 left-1/2 h-[600px] w-[600px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/5 blur-3xl animate-pulse-glow pointer-events-none" />
      <ParticleBackground />

      <div className="relative z-10 min-h-screen flex items-center justify-center px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="relative mx-4 w-full max-w-md"
        >
          <div className="relative overflow-hidden rounded-2xl bg-card p-8 shadow-card md:p-10">
            <div className="absolute left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-primary to-transparent scanner-line opacity-60" />
            <div className="absolute top-4 left-4 h-3 w-3 rounded-tl-sm border-l-2 border-t-2 border-primary/40" />
            <div className="absolute top-4 right-4 h-3 w-3 rounded-tr-sm border-r-2 border-t-2 border-primary/40" />
            <div className="absolute bottom-4 left-4 h-3 w-3 rounded-bl-sm border-l-2 border-b-2 border-primary/40" />
            <div className="absolute right-4 bottom-4 h-3 w-3 rounded-br-sm border-r-2 border-b-2 border-primary/40" />

            <Link
              to="/login"
              state={locationState}
              className="absolute top-4 left-4 z-10 text-muted-foreground transition-colors hover:text-foreground"
            >
              <ArrowLeft size={20} />
            </Link>

            <div className="pt-4 mb-8 text-center">
              <h1 className="text-2xl font-semibold text-primary">
                {step === "email" ? t("forgot_password.title") : t("forgot_password.reset_title")}
              </h1>
              <p className="mt-2 text-sm text-muted-foreground">
                {step === "email" ? t("forgot_password.subtitle_email") : t("forgot_password.subtitle_reset")}
              </p>
            </div>

            {step === "email" ? (
              <form onSubmit={handleSendCode} className="space-y-5">
                <div className="relative">
                  <div className="absolute top-1/2 left-4 -translate-y-1/2 text-muted-foreground">
                    <Mail size={18} />
                  </div>
                  <Input
                    type="email"
                    placeholder={t("forgot_password.email_placeholder")}
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    className="h-12 bg-input pl-11 border-border/50 transition-all duration-300 focus:border-primary"
                    autoComplete="email"
                  />
                </div>

                <Button
                  type="submit"
                  className="w-full h-12 gradient-primary text-base font-medium text-primary-foreground shadow-button transition-all duration-300 hover:scale-[1.02] hover:shadow-lg"
                  disabled={isLoading}
                >
                  {isLoading ? t("forgot_password.sending") : t("forgot_password.send_code")}
                </Button>
              </form>
            ) : (
              <form onSubmit={handleReset} className="space-y-5">
                <div className="mb-4 rounded-lg bg-secondary/20 p-3 text-center">
                  <p className="text-sm text-muted-foreground">
                    {t("forgot_password.code_sent_to")} <span className="text-primary">{email}</span>
                  </p>
                  <div className="mt-2 flex items-center justify-center gap-3">
                    <button type="button" onClick={() => setStep("email")} className="text-xs text-muted-foreground hover:underline">
                      {t("forgot_password.change_email")}
                    </button>

                    <button
                      type="button"
                      onClick={() => canResend && handleSendCode()}
                      disabled={!canResend}
                      className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:underline disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <RefreshCcw size={12} />
                      {resendLeft > 0 ? t("register.resend_cooldown", { s: resendLeft }) : t("register.resend")}
                    </button>
                  </div>
                </div>

                <div className="relative">
                  <div className="absolute top-1/2 left-4 -translate-y-1/2 text-muted-foreground">
                    <KeyRound size={18} />
                  </div>
                  <Input
                    type="text"
                    placeholder={t("forgot_password.code_placeholder")}
                    value={code}
                    onChange={(event) => setCode(event.target.value.replace(/\D/g, "").slice(0, 6))}
                    className="h-12 bg-input pl-11 border-border/50 focus:border-primary"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                  />
                </div>

                <div className="relative">
                  <div className="absolute top-1/2 left-4 -translate-y-1/2 text-muted-foreground">
                    <Lock size={18} />
                  </div>
                  <Input
                    type="password"
                    placeholder={t("forgot_password.new_password_placeholder")}
                    value={newPassword}
                    onChange={(event) => setNewPassword(event.target.value)}
                    className="h-12 bg-input pl-11 border-border/50 focus:border-primary"
                    autoComplete="new-password"
                  />
                </div>

                <Button
                  type="submit"
                  className="w-full h-12 gradient-primary text-base font-medium text-primary-foreground shadow-button transition-all duration-300 hover:scale-[1.02] hover:shadow-lg"
                  disabled={isLoading}
                >
                  {isLoading ? t("forgot_password.resetting") : t("forgot_password.confirm_reset")}
                </Button>
              </form>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
}

export default ForgotPasswordPage;
