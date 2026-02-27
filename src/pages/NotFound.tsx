import { useLocation, useNavigate, Link } from "react-router-dom";
import { useEffect } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, AlertCircle, Home, UserPlus, FileText, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import ParticleBackground from "@/components/ParticleBackground";

import { useTranslation } from 'react-i18next';

const NotFound = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { t } = useTranslation('common');

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="relative min-h-screen overflow-hidden">
      <div className="fixed inset-0" style={{ background: "var(--gradient-background)" }} />
      <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[680px] h-[680px] rounded-full bg-primary/5 blur-3xl animate-pulse-glow pointer-events-none" />
      <ParticleBackground />

      <div className="relative z-10 min-h-screen flex items-center justify-center p-6">
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center w-full max-w-md"
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.15, type: "spring" }}
            className="w-24 h-24 mx-auto mb-6 rounded-full bg-primary/10 flex items-center justify-center"
          >
            <AlertCircle className="w-12 h-12 text-primary" />
          </motion.div>

          <motion.h1
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.25 }}
            className="text-6xl font-bold text-primary mb-3"
          >
            404
          </motion.h1>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.35 }}
          >
            <h2 className="text-xl font-semibold mb-2">{t('not_found.title')}</h2>
            <p className="text-muted-foreground mb-4">
              {t('not_found.desc')}
            </p>
            <p className="text-sm text-muted-foreground/70 mb-8 font-mono break-all">
              {location.pathname}
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.45 }}
            className="flex flex-col gap-3"
          >
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button variant="outline" onClick={() => navigate(-1)} className="border-border/60">
                <ArrowLeft className="w-4 h-4 mr-2" />
                {t('not_found.back')}
              </Button>
              <Button className="gradient-primary" onClick={() => navigate("/")}>
                <Home className="w-4 h-4 mr-2" />
                {t('not_found.home')}
              </Button>
              <Button variant="outline" onClick={() => navigate("/login")} className="border-border/60">
                <UserPlus className="w-4 h-4 mr-2" />
                {t('not_found.login')}
              </Button>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link to="/register" className="w-full sm:w-auto">
                <Button variant="outline" className="w-full border-border/60">
                  <UserPlus className="w-4 h-4 mr-2" />
                  {t('not_found.register')}
                </Button>
              </Link>

              <Link to="/terms" className="w-full sm:w-auto">
                <Button variant="outline" className="w-full border-border/60">
                  <FileText className="w-4 h-4 mr-2" />
                  {t('not_found.terms')}
                </Button>
              </Link>

              <Link to="/privacy" className="w-full sm:w-auto">
                <Button variant="outline" className="w-full border-border/60">
                  <Shield className="w-4 h-4 mr-2" />
                  {t('not_found.privacy')}
                </Button>
              </Link>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
            className="mt-10 text-4xl"
          >
            🐼
          </motion.div>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.9 }}
            className="text-sm text-muted-foreground mt-2"
          >
            {t('not_found.mascot_lost')}
          </motion.p>
        </motion.div>
      </div>
    </div>
  );
};

export default NotFound;
