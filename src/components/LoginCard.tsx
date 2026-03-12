import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Eye, EyeOff, KeyRound, Lock, RefreshCcw, Shield, ShieldCheck, User } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { useTranslation } from "react-i18next";

import { useLoginCardModel } from "./login-card/hooks/useLoginCardModel";

const LoginCard = () => {
  const { t } = useTranslation(["auth", "common"]);
  const {
    code,
    cooldown,
    email,
    emailOk,
    handleSendCode,
    handleSubmit,
    isLoading,
    isSendingCode,
    locationState,
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
  } = useLoginCardModel();

  return (
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

        <div className="mb-8 text-center">
          <motion.h1
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.4 }}
            className="text-2xl font-semibold text-primary md:text-3xl"
          >
            {t("common:app_name")}
          </motion.h1>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.28, duration: 0.35 }}
            className="mt-2 text-sm text-muted-foreground"
          >
            {t("login.subtitle")}
          </motion.p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3, duration: 0.4 }}
            className="mt-6 mb-5"
          >
            <div className="relative">
              <div className="absolute top-1/2 left-4 -translate-y-1/2 text-muted-foreground">
                <User size={18} />
              </div>
              <Input
                type="email"
                placeholder={t("login.email_placeholder")}
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className="h-12 bg-input pl-11 border-border/50 transition-all duration-300 focus:border-primary"
                autoComplete="email"
              />
            </div>
            {email.length > 0 && !emailOk ? <p className="mt-2 text-xs text-destructive/90">{t("login.email_invalid")}</p> : null}
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4, duration: 0.4 }}
            className="mb-5"
          >
            <div className="relative">
              <div className="absolute top-1/2 left-4 -translate-y-1/2 text-muted-foreground">
                <Lock size={18} />
              </div>
              <Input
                type={showPassword ? "text" : "password"}
                placeholder={t("login.password_placeholder")}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="h-12 bg-input pl-11 pr-11 border-border/50 transition-all duration-300 focus:border-primary"
                autoComplete="current-password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute top-1/2 right-4 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground"
                aria-label={showPassword ? t("login.hide_password") : t("login.show_password")}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            {loginMode === "password" && password.length > 0 && !passwordOk ? (
              <p className="mt-2 text-xs text-muted-foreground">{t("login.password_length_hint")}</p>
            ) : null}
          </motion.div>

          {loginMode === "otp" ? (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
              className="space-y-4 pt-1"
            >
              <div className="flex items-center gap-3">
                <div className="relative flex-1">
                  <div className="absolute top-1/2 left-4 -translate-y-1/2 text-muted-foreground">
                    <KeyRound size={18} />
                  </div>
                  <Input
                    type="text"
                    placeholder={t("login.code_placeholder")}
                    value={code}
                    onChange={(event) => setCode(event.target.value.replace(/\D/g, "").slice(0, 4))}
                    className="h-12 bg-input pl-11 border-border/50 focus:border-primary"
                    inputMode="numeric"
                  />
                </div>
                <Button
                  type="button"
                  variant="outline"
                  className="h-12 min-w-[100px] border-border/50 transition-colors hover:bg-secondary/20"
                  onClick={handleSendCode}
                  disabled={!emailOk || cooldown > 0 || isSendingCode}
                >
                  {isSendingCode ? <RefreshCcw size={16} className="animate-spin" /> : cooldown > 0 ? `${cooldown}s` : t("login.get_code")}
                </Button>
              </div>
              <p className="text-center text-xs text-muted-foreground/80">{t("login.enter_code_hint")}</p>
            </motion.div>
          ) : null}

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5, duration: 0.4 }}
            className="flex items-center justify-between"
          >
            <div className="flex items-center space-x-2">
              <Checkbox id="remember" checked={rememberMe} onCheckedChange={(checked) => setRememberMe(checked as boolean)} />
              <label htmlFor="remember" className="cursor-pointer select-none text-sm text-muted-foreground">
                {t("login.remember_me")}
              </label>
            </div>

            <div className="flex items-center gap-4">
              <Link to="/forgot-password" state={locationState} className="text-xs text-muted-foreground transition-colors hover:text-primary">
                {t("login.forgot_password")}
              </Link>
              <button
                type="button"
                onClick={toggleLoginMode}
                className="inline-flex items-center gap-1 text-xs text-muted-foreground transition-colors hover:text-primary"
              >
                <Shield size={12} />
                {loginMode === "password" ? t("login.mode_otp_subtle") : t("login.mode_password_subtle")}
              </button>
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6, duration: 0.4 }}>
            <Button
              type="submit"
              className="w-full h-12 gradient-primary text-base font-medium text-primary-foreground shadow-button transition-all duration-300 hover:scale-[1.02] hover:shadow-lg"
              disabled={isLoading}
            >
              {isLoading ? (
                <div className="flex items-center gap-2">
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground/30 border-t-primary-foreground" />
                  {t("login.logging_in")}
                </div>
              ) : (
                t("login.submit")
              )}
            </Button>
          </motion.div>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.7, duration: 0.4 }}
            className="text-center text-sm text-muted-foreground"
          >
            {t("login.no_account")}
            <Link to="/register" state={locationState} className="ml-1 text-primary transition-colors hover:text-primary-light">
              {t("login.register_link")}
            </Link>
          </motion.p>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.78, duration: 0.35 }}
            className="pt-6 mt-4 border-t border-border/30 text-center"
          >
            <div className="flex flex-wrap items-center justify-center gap-1.5 leading-relaxed text-xs text-muted-foreground">
              <ShieldCheck className="h-3.5 w-3.5 shrink-0 text-primary/60" />
              <span>{t("login.agreement_prefix")}</span>
              <div className="inline-flex gap-1">
                <Link to="/terms" state={locationState} className="text-primary transition-colors hover:text-primary/80 hover:underline">
                  {t("login.terms")}
                </Link>
                <span>{t("common:and")}</span>
                <Link to="/privacy" state={locationState} className="text-primary transition-colors hover:text-primary/80 hover:underline">
                  {t("login.privacy")}
                </Link>
              </div>
            </div>
          </motion.div>
        </form>
      </div>
    </motion.div>
  );
};

export default LoginCard;
