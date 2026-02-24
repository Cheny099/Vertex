import ParticleBackground from "@/components/ParticleBackground";
import LoginCard from "@/components/LoginCard";

const Index = () => {
  return (
    <div className="relative min-h-screen overflow-hidden">
      {/* Background gradient */}
      <div className="fixed inset-0" style={{ background: "var(--gradient-background)" }} />

      {/* Ambient glow */}
      <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-primary/5 blur-3xl animate-pulse-glow pointer-events-none" />

      {/* Particles */}
      <ParticleBackground />

      {/* Content */}
      <div className="relative z-10 min-h-screen flex items-center justify-center px-4 py-8">
        <LoginCard />
      </div>
    </div>
  );
};

export default Index;
