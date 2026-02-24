import { useMemo, useState } from "react";
import { useNavigate, Link, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { User, Lock, Eye, EyeOff, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { authApi } from "@/api";
import { useAuth } from "@/contexts/AuthContext";
import { useTranslation } from "react-i18next";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const TOKEN_KEY = "auth_token";

function normalizeErrorMessage(err: any): string {
  const msg = String(err?.message || "");

  if (msg.includes("Unauthorized") || msg.includes("401")) return "errors.invalid_email_password";
  if (msg.includes("403")) return "errors.email_not_verified";
  if (msg.includes("429")) return "errors.too_many_requests";
  if (msg.includes("500")) return "errors.server_busy";

  if (msg.includes("Incorrect email or password")) return "errors.invalid_email_password";
  if (msg.includes("Email not verified")) return "errors.register_needed";

  // Retain original message if no match, or return default key
  return msg || "errors.login_failed";
}

const LoginCard = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true); // 默认记住，更符合产品习惯
  const [isLoading, setIsLoading] = useState(false);

  const { toast } = useToast();
  const navigate = useNavigate();
  const location = useLocation(); // ✅ 新增：用于读取 from
  const { login } = useAuth();
  const { t } = useTranslation(['auth', 'common']);

  const emailOk = useMemo(() => EMAIL_RE.test((email || "").trim()), [email]);
  const passwordOk = useMemo(() => (password || "").length >= 6, [password]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const trimmedEmail = (email || "").trim();

    if (!trimmedEmail || !password) {
      toast({
        title: t('common:error'),
        description: t('errors.input_required'),
        variant: "destructive",
      });
      return;
    }

    if (!emailOk) {
      toast({
        title: t('common:error'),
        description: t('errors.email_format'),
        variant: "destructive",
      });
      return;
    }

    // 这里不强制，但给一个更像产品的提示（你也可以改成强制 >= 8）
    if (!passwordOk) {
      toast({
        title: t('common:error'),
        description: t('errors.password_length'),
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      // 1) OAuth2PasswordRequestForm：字段名仍然叫 username
      const { access_token } = await authApi.login({
        username: trimmedEmail,
        password,
      });

      // 2) 记住我：决定存 localStorage 还是 sessionStorage
      // - rememberMe=true: 关闭浏览器也保持登录
      // - rememberMe=false: 仅本次会话有效
      const storage = rememberMe ? localStorage : sessionStorage;
      storage.setItem(TOKEN_KEY, access_token);

      // 为了兼容你 API client 目前从 localStorage 读 token，
      // 如果 rememberMe=false 但你仍想临时登录生效，则也写一份到 localStorage
      //（否则 request() 取不到 token 会 401）
      if (!rememberMe) {
        localStorage.setItem(TOKEN_KEY, access_token);
      }

      // 3) 获取用户信息
      const user = await authApi.getProfile();

      // 4) 更新 Context（保持你原逻辑）
      login(
        {
          ...user,
          username: user.full_name || user.email.split("@")[0],
        } as any,
        access_token
      );

      toast({
        title: t('errors.login_success'),
        description: t('errors.welcome_back', { name: user.full_name || user.email.split("@")[0] }),
      });

      const from = (location.state as any)?.from;
      const redirectTo =
        from?.pathname
          ? `${from.pathname}${from.search || ""}${from.hash || ""}`
          : "/dashboard";

      navigate(redirectTo, { replace: true });

    } catch (error: any) {
      const errorKeyOrMsg = normalizeErrorMessage(error);
      // Simple heuristic: if it contains spaces it's likely a raw message, otherwise try valid keys
      // Better: check if translation exists, but keep simple.
      // If normalizeErrorMessage returns a key (starts with 'errors.'), translate it.
      const description = errorKeyOrMsg.startsWith('errors.')
        ? t(errorKeyOrMsg)
        : errorKeyOrMsg;

      toast({
        title: t('common:error'),
        description: description,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };



  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="relative w-full max-w-md mx-4"
    >
      <div className="relative bg-card rounded-2xl shadow-card p-8 md:p-10 overflow-hidden">
        {/* Scanner Effect */}
        <div className="absolute left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-primary to-transparent scanner-line opacity-60" />

        {/* Corner decorations */}
        <div className="absolute top-4 left-4 w-3 h-3 border-l-2 border-t-2 border-primary/40 rounded-tl-sm" />
        <div className="absolute top-4 right-4 w-3 h-3 border-r-2 border-t-2 border-primary/40 rounded-tr-sm" />
        <div className="absolute bottom-4 left-4 w-3 h-3 border-l-2 border-b-2 border-primary/40 rounded-bl-sm" />
        <div className="absolute bottom-4 right-4 w-3 h-3 border-r-2 border-b-2 border-primary/40 rounded-br-sm" />

        {/* Header */}
        <div className="text-center mb-8">
          <motion.h1
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.4 }}
            className="text-2xl md:text-3xl font-semibold text-primary"
          >
            {t('common:app_name')}
          </motion.h1>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.28, duration: 0.35 }}
            className="text-sm text-muted-foreground mt-2"
          >
            {t('login.subtitle')}
          </motion.p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Email */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3, duration: 0.4 }}
          >
            <div className="relative">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground">
                <User size={18} />
              </div>
              <Input
                type="email"
                placeholder={t('login.email_placeholder')}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="pl-11 h-12 bg-input border-border/50 focus:border-primary transition-all duration-300"
                autoComplete="email"
              />
            </div>
            {email.length > 0 && !emailOk && (
              <p className="mt-2 text-xs text-destructive/90">{t('login.email_invalid')}</p>
            )}
          </motion.div>

          {/* Password */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4, duration: 0.4 }}
          >
            <div className="relative">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground">
                <Lock size={18} />
              </div>
              <Input
                type={showPassword ? "text" : "password"}
                placeholder={t('login.password_placeholder')}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="pl-11 pr-11 h-12 bg-input border-border/50 focus:border-primary transition-all duration-300"
                autoComplete="current-password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                aria-label={showPassword ? t('login.hide_password') : t('login.show_password')}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>

            {password.length > 0 && !passwordOk && (
              <p className="mt-2 text-xs text-muted-foreground">{t('login.password_length_hint')}</p>
            )}
          </motion.div>

          {/* Remember & Forgot */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5, duration: 0.4 }}
            className="flex items-center justify-between"
          >
            <div className="flex items-center space-x-2">
              <Checkbox
                id="remember"
                checked={rememberMe}
                onCheckedChange={(checked) => setRememberMe(checked as boolean)}
              />
              <label htmlFor="remember" className="text-sm text-muted-foreground cursor-pointer select-none">
                {t('login.remember_me')}
              </label>
            </div>

            <Link to="/forgot-password" className="text-sm text-primary hover:text-primary-light transition-colors">
              {t('login.forgot_password')}
            </Link>
          </motion.div>

          {/* Login Button */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.4 }}
          >
            <Button
              type="submit"
              className="w-full h-12 gradient-primary text-primary-foreground font-medium text-base shadow-button hover:shadow-lg transition-all duration-300 hover:scale-[1.02]"
              disabled={isLoading}
            >
              {isLoading ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                  {t('login.logging_in')}
                </div>
              ) : (
                t('login.submit')
              )}
            </Button>
          </motion.div>

          {/* Register Link */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.7, duration: 0.4 }}
            className="text-center text-sm text-muted-foreground"
          >
            {t('login.no_account')}
            <Link to="/register" className="text-primary hover:text-primary-light transition-colors ml-1">
              {t('login.register_link')}
            </Link>
          </motion.p>

          {/* Terms & Privacy */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.78, duration: 0.35 }}
            className="pt-6 mt-4 border-t border-border/30 text-center"
          >
            <div className="flex items-center justify-center gap-1.5 text-xs text-muted-foreground flex-wrap leading-relaxed">
              <ShieldCheck className="w-3.5 h-3.5 text-primary/60 shrink-0" />
              <span>{t('login.agreement_prefix')}</span>
              <div className="inline-flex gap-1">
                <Link to="/terms" className="text-primary hover:underline hover:text-primary/80 transition-colors">
                  {t('login.terms')}
                </Link>
                <span>{t('common:and')}</span>
                <Link to="/privacy" className="text-primary hover:underline hover:text-primary/80 transition-colors">
                  {t('login.privacy')}
                </Link>
              </div>
            </div>
          </motion.div>


        </form>
      </div>
    </motion.div >
  );
};

export default LoginCard;
