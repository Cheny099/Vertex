import ParticleBackground from '@/components/ParticleBackground';
import { AboutSection } from './components/AboutSection';
import { FloatingNavbar } from './components/FloatingNavbar';
import { HeroSection } from './components/HeroSection';
import { HotStrategiesSection } from './components/HotStrategiesSection';
import { LandingFooter } from './components/LandingFooter';
import { useLandingPageModel } from './hooks/useLandingPageModel';

export default function LandingPage() {
  const {
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
    isAuthenticated,
    isHotLoading,
    isScrolled,
    rotateX,
    rotateY,
    t,
    toggleLanguage,
  } = useLandingPageModel();

  return (
    <div className="relative min-h-screen overflow-hidden font-sans selection:bg-primary/20 bg-noise" onMouseMove={handleMouseMove} onMouseLeave={handleMouseLeave}>
      <div className="fixed inset-0 bg-background" />
      <div className="fixed inset-0" style={{ background: 'var(--gradient-background)' }} />
      <div className="fixed top-[-20%] left-[-10%] w-[600px] h-[600px] rounded-full bg-blue-500/10 blur-[120px] mix-blend-screen animate-pulse-soft pointer-events-none" />
      <div className="fixed bottom-[-10%] right-[-5%] w-[700px] h-[700px] rounded-full bg-violet-500/10 blur-[120px] mix-blend-screen animate-pulse-soft pointer-events-none" style={{ animationDelay: '2s' }} />

      <ParticleBackground />

      <div className="relative z-10 flex flex-col min-h-screen">
        <FloatingNavbar
          isAuthenticated={isAuthenticated}
          isScrolled={isScrolled}
          onGoDashboard={goDashboard}
          onGoLogin={goLogin}
          onGoRegister={goRegister}
          onToggleLanguage={toggleLanguage}
          t={t}
        />

        <main className="flex-1 flex flex-col">
          <HeroSection
            curveData={curveData}
            heroOpacity={heroOpacity}
            heroScale={heroScale}
            isAuthenticated={isAuthenticated}
            onGoDashboard={goDashboard}
            onGoRegister={goRegister}
            onGoStrategies={goStrategies}
            rotateX={rotateX}
            rotateY={rotateY}
            t={t}
          />

          <HotStrategiesSection
            hotStrategies={hotStrategies}
            isLoading={isHotLoading}
            onGoStrategies={goStrategies}
            onOpenStrategy={goStrategyDetail}
            t={t}
          />

          <AboutSection t={t} />
          <LandingFooter t={t} />
        </main>
      </div>
    </div>
  );
}
