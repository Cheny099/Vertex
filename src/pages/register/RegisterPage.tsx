import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import ParticleBackground from "@/components/ParticleBackground";
import { ArrowLeft, Eye, EyeOff, Lock, Mail, Send, ShieldCheck, User } from "lucide-react";
import { useTranslation } from "react-i18next";

import { useRegisterModel } from "./hooks/useRegisterModel";

function RegisterPage() {
  const { t } = useTranslation(["auth", "common"]);
  const {
    agreeTerms,
    canSendCode,
    canSubmit,
    cooldown,
    formData,
    handleSendCode,
    handleSubmit,
    isLoading,
    isSendingCode,
    lastSentEmail,
    locationState,
    normalizedEmail,
    otpRef,
    otpTtlSeconds,
    resendCooldownSeconds,
    setAgreeTerms,
    setFormField,
    setShowPassword,
    showPassword,
    emailOk,
    maskEmail,
  } = useRegisterModel();

  return (
    <div className="relative min-h-screen overflow-hidden">
      <div className="fixed inset-0" style={{ background: "var(--gradient-background)" }} />
      <div className="fixed top-1/2 left-1/2 h-[600px] w-[600px] -translate-x-1/2 -translate-y-1/2 animate-pulse-glow rounded-full bg-primary/5 blur-3xl pointer-events-none" />
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

            <Link to="/login" state={locationState} className="absolute top-4 left-4 z-10 text-muted-foreground transition-colors hover:text-foreground">
              <ArrowLeft size={20} />
            </Link>

            <div className="mb-6 text-center">
              <motion.h1
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2, duration: 0.4 }}
                className="text-2xl font-semibold text-primary md:text-3xl"
              >
                {t("register.title")}
              </motion.h1>
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3, duration: 0.4 }}
                className="mt-2 text-sm text-muted-foreground"
              >
                {t("register.subtitle")}
              </motion.p>
            </div>

            <Alert className="mb-6 border-border/50 bg-background/40">
              <ShieldCheck size={18} />
              <AlertTitle>{t("register.alert_title")}</AlertTitle>
              <AlertDescription>
                <ul className="list-disc space-y-1 pl-4">
                  <li>{t("register.alert_item1", { min: Math.floor(otpTtlSeconds / 60) })}</li>
                  <li>{t("register.alert_item2", { min: Math.floor(resendCooldownSeconds / 60) })}</li>
                  <li>{t("register.alert_item3")}</li>
                </ul>
              </AlertDescription>
            </Alert>

            <form onSubmit={handleSubmit} className="space-y-4">
              <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3, duration: 0.4 }} className="relative">
                <div className="absolute top-1/2 left-4 -translate-y-1/2 text-muted-foreground">
                  <User size={18} />
                </div>
                <Input
                  type="text"
                  placeholder={t("register.username_placeholder")}
                  value={formData.username}
                  onChange={(event) => setFormField("username", event.target.value)}
                  className="h-12 bg-input pl-11 border-border/50 transition-all duration-300 focus:border-primary"
                />
              </motion.div>

              <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.35, duration: 0.4 }} className="relative">
                <div className="absolute top-1/2 left-4 -translate-y-1/2 text-muted-foreground">
                  <Mail size={18} />
                </div>
                <Input
                  type="email"
                  placeholder={t("register.email_placeholder")}
                  value={formData.email}
                  onChange={(event) => setFormField("email", event.target.value)}
                  className="h-12 bg-input pl-11 border-border/50 transition-all duration-300 focus:border-primary"
                />
                {normalizedEmail && !emailOk ? <p className="mt-2 text-xs text-destructive">{t("login.email_invalid")}</p> : null}
              </motion.div>

              <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.38, duration: 0.4 }} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Send size={16} />
                    <span>{t("register.email_code")}</span>
                    {lastSentEmail ? <span className="text-xs">{t("register.code_sent_to", { email: maskEmail(lastSentEmail) })}</span> : null}
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    className="h-9 px-3 border-border/50 transition-all hover:border-primary/50 hover:bg-primary/10 hover:text-primary"
                    onClick={handleSendCode}
                    disabled={!canSendCode}
                  >
                    {isSendingCode
                      ? t("register.sending")
                      : cooldown > 0
                        ? t("register.resend_cooldown", { s: cooldown })
                        : t("register.get_code")}
                  </Button>
                </div>

                <div className="flex items-center justify-center">
                  <InputOTP
                    maxLength={6}
                    value={formData.code}
                    onChange={(value) => setFormField("code", (value || "").replace(/\D/g, ""))}
                    containerClassName="justify-center"
                    inputMode="numeric"
                    pattern="^[0-9]*$"
                    ref={(node) => {
                      const otpNode = node as unknown as { input?: HTMLInputElement | null } | null;
                      otpRef.current = otpNode?.input || null;
                    }}
                  >
                    <InputOTPGroup>
                      <InputOTPSlot index={0} />
                      <InputOTPSlot index={1} />
                      <InputOTPSlot index={2} />
                      <InputOTPSlot index={3} />
                      <InputOTPSlot index={4} />
                      <InputOTPSlot index={5} />
                    </InputOTPGroup>
                  </InputOTP>
                </div>

                <p className="text-center text-xs text-muted-foreground">{t("register.enter_code_hint")}</p>
              </motion.div>

              <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.4, duration: 0.4 }} className="relative">
                <div className="absolute top-1/2 left-4 -translate-y-1/2 text-muted-foreground">
                  <Lock size={18} />
                </div>
                <Input
                  type={showPassword ? "text" : "password"}
                  placeholder={t("register.password_placeholder")}
                  value={formData.password}
                  onChange={(event) => setFormField("password", event.target.value)}
                  className="h-12 bg-input pl-11 pr-11 border-border/50 transition-all duration-300 focus:border-primary"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute top-1/2 right-4 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
                {formData.password.length > 0 && formData.password.length < 6 ? (
                  <p className="mt-2 text-xs text-destructive">{t("login.password_length_hint")}</p>
                ) : null}
              </motion.div>

              <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.45, duration: 0.4 }} className="relative">
                <div className="absolute top-1/2 left-4 -translate-y-1/2 text-muted-foreground">
                  <Lock size={18} />
                </div>
                <Input
                  type="password"
                  placeholder={t("register.confirm_password_placeholder")}
                  value={formData.confirmPassword}
                  onChange={(event) => setFormField("confirmPassword", event.target.value)}
                  className="h-12 bg-input pl-11 border-border/50 transition-all duration-300 focus:border-primary"
                />
              </motion.div>

              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5, duration: 0.4 }} className="flex items-start space-x-2">
                <Checkbox id="terms" checked={agreeTerms} onCheckedChange={(checked) => setAgreeTerms(checked as boolean)} />
                <label htmlFor="terms" className="cursor-pointer select-none text-sm leading-5 text-muted-foreground">
                  {t("register.agree_terms_prefix")}
                  <Link to="/terms" state={locationState} className="text-primary hover:underline">
                    {t("login.terms")}
                  </Link>
                  {t("common:and")}
                  <Link to="/privacy" state={locationState} className="text-primary hover:underline">
                    {t("login.privacy")}
                  </Link>
                </label>
              </motion.div>

              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.55, duration: 0.4 }}>
                <Button
                  type="submit"
                  className="w-full h-12 gradient-primary text-base font-medium text-primary-foreground shadow-button transition-all duration-300 hover:scale-[1.02] hover:shadow-lg"
                  disabled={!canSubmit}
                >
                  {isLoading ? (
                    <div className="flex items-center gap-2">
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground/30 border-t-primary-foreground" />
                      {t("register.registering")}
                    </div>
                  ) : (
                    t("register.submit")
                  )}
                </Button>
              </motion.div>

              <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6, duration: 0.4 }} className="text-center text-sm text-muted-foreground">
                {t("register.has_account")}
                <Link to="/login" state={locationState} className="ml-1 text-primary transition-colors hover:text-primary-light">
                  {t("register.login_link")}
                </Link>
              </motion.p>
            </form>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

export default RegisterPage;
