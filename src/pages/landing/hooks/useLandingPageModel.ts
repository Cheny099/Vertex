import { useEffect, useMemo, useState, type MouseEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMotionValue, useScroll, useSpring, useTransform } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { publicApi, type PublicStrategyCard } from '@/api';
import { useAuth } from '@/hooks/use-auth';

export function useLandingPageModel() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const { t, i18n } = useTranslation('landing');
  const { scrollY } = useScroll();
  const [isScrolled, setIsScrolled] = useState(false);

  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const springConfig = { damping: 25, stiffness: 150 };
  const rotateX = useSpring(useTransform(mouseY, [-0.5, 0.5], [5, -5]), springConfig);
  const rotateY = useSpring(useTransform(mouseX, [-0.5, 0.5], [-5, 5]), springConfig);

  const handleMouseMove = (event: MouseEvent<HTMLDivElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const xPct = (event.clientX - rect.left) / rect.width - 0.5;
    const yPct = (event.clientY - rect.top) / rect.height - 0.5;
    mouseX.set(xPct);
    mouseY.set(yPct);
  };

  const handleMouseLeave = () => {
    mouseX.set(0);
    mouseY.set(0);
  };

  useEffect(() => {
    return scrollY.onChange((latest) => {
      setIsScrolled(latest > 50);
    });
  }, [scrollY]);

  const heroOpacity = useTransform(scrollY, [0, 300], [1, 0]);
  const heroScale = useTransform(scrollY, [0, 300], [1, 0.95]);

  const curveData = useMemo(() => {
    const base = [
      1.0, 1.02, 1.015, 1.04, 1.035, 1.06, 1.08, 1.075, 1.1, 1.12,
      1.11, 1.15, 1.18, 1.17, 1.2, 1.22, 1.21, 1.25, 1.28, 1.3,
    ];
    return base.map((nav, index) => {
      const drift = (index / base.length) * 0.03;
      return {
        t: `D${index + 1}`,
        nav,
        p10: nav * (0.98 - drift * 0.3),
        p90: nav * (1.02 + drift * 0.3),
      };
    });
  }, []);

  const { data: hotStrategies = [], isLoading: isHotLoading } = useQuery<PublicStrategyCard[]>({
    queryKey: ['public', 'strategies', 'hot'],
    queryFn: () => publicApi.getHotStrategies(3),
    staleTime: 60 * 1000,
  });

  const goDashboard = () => navigate('/dashboard');
  const goLogin = () => navigate('/login');
  const goRegister = () => navigate('/register');
  const goStrategies = () => navigate('/strategies');
  const goStrategyDetail = (id: number) => navigate(`/strategies/${id}`);
  const toggleLanguage = () => i18n.changeLanguage(i18n.language === 'en' ? 'zh' : 'en');

  return {
    curveData,
    goDashboard,
    goLogin,
    goRegister,
    goStrategies,
    goStrategyDetail,
    handleMouseLeave,
    handleMouseMove,
    heroOpacity,
    heroScale,
    hotStrategies,
    i18n,
    isAuthenticated,
    isHotLoading,
    isScrolled,
    rotateX,
    rotateY,
    t,
    toggleLanguage,
  };
}
