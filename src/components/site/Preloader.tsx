import { useEffect, useState } from "react";

export function Preloader({ onComplete }: { onComplete: () => void }) {
  const [progress, setProgress] = useState(0);
  const [isFadingOut, setIsFadingOut] = useState(false);

  // Smooth continuous loading progression (~1.5s sequence)
  useEffect(() => {
    let animId: number;
    const startTime = performance.now();
    const duration = 1500; // 1.5s crisp, responsive loading sequence

    const step = (now: number) => {
      const elapsed = now - startTime;
      const t = Math.min(elapsed / duration, 1);
      // Smooth cubic ease-out
      const easeOut = 1 - Math.pow(1 - t, 3);
      const current = Math.min(Math.round(easeOut * 100), 100);
      setProgress(current);

      if (t < 1) {
        animId = requestAnimationFrame(step);
      } else {
        setTimeout(() => {
          setIsFadingOut(true);
          setTimeout(onComplete, 600);
        }, 180);
      }
    };

    animId = requestAnimationFrame(step);
    return () => cancelAnimationFrame(animId);
  }, [onComplete]);

  // Dynamic status text matching high-end laptop boot architecture
  const getStatusText = (val: number) => {
    if (val < 22) return "INITIALIZING HARDWARE CORES...";
    if (val < 48) return "CALIBRATING 240Hz OLED DISPLAY...";
    if (val < 72) return "ENGAGING VAPOR CHAMBER COOLING...";
    if (val < 94) return "SYNCHRONIZING SELLORA MATRIX...";
    return "SYSTEM ONLINE // READY";
  };

  return (
    <div
      className={`fixed inset-0 z-[100] flex flex-col items-center justify-center bg-[#06080F] text-white select-none overflow-hidden transition-all duration-700 ease-out ${
        isFadingOut ? "opacity-0 pointer-events-none scale-105" : "opacity-100 scale-100"
      }`}
    >
      {/* Ambient Radial Lighting matching SELLORA Cyan & Purple Palette */}
      <div className="absolute inset-0 pointer-events-none">
        {/* Core Electric Cyan Halo */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[550px] sm:w-[700px] h-[350px] sm:h-[450px] rounded-full bg-[radial-gradient(circle,oklch(0.85_0.18_200/0.14)_0%,transparent_70%)] blur-3xl animate-pulse" />
        {/* Deep Violet Secondary Halo */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-[45%] w-[400px] sm:w-[500px] h-[260px] sm:h-[320px] rounded-full bg-[radial-gradient(circle,oklch(0.65_0.26_295/0.10)_0%,transparent_75%)] blur-2xl" />
        {/* Subtle Precision Engineering Dot Grid */}
        <div 
          className="absolute inset-0 opacity-[0.06]"
          style={{
            backgroundImage: "radial-gradient(circle, rgba(0, 242, 254, 0.8) 1px, transparent 1px)",
            backgroundSize: "28px 28px",
            maskImage: "radial-gradient(ellipse at center, black 40%, transparent 80%)",
            WebkitMaskImage: "radial-gradient(ellipse at center, black 40%, transparent 80%)"
          }}
        />
      </div>

      {/* Engineering Corner HUD Guides */}
      <div className="absolute top-6 left-8 hidden sm:flex items-center gap-2 font-mono text-[10px] tracking-widest text-white/30 uppercase">
        <span className="text-neon-cyan font-bold">+</span>
        <span>SELLORA HARDWARE LABS</span>
        <span className="text-white/20">|</span>
        <span className="text-neon-cyan/60">SYS.BOOT.2026</span>
      </div>

      <div className="absolute top-6 right-8 hidden sm:flex items-center gap-2 font-mono text-[10px] tracking-widest text-white/30 uppercase">
        <span className="h-1.5 w-1.5 rounded-full bg-neon-cyan animate-ping" />
        <span>RTX AI // 240Hz OLED</span>
      </div>

      <div className="absolute bottom-6 left-8 hidden sm:flex items-center gap-2 font-mono text-[10px] tracking-widest text-white/25 uppercase">
        <span>ARCH: X86-64 / TITANIUM FRAME</span>
      </div>

      <div className="absolute bottom-6 right-8 hidden sm:flex items-center gap-2 font-mono text-[10px] tracking-widest text-white/25 uppercase">
        <span>THERMAL: DUAL-FAN MATRIX</span>
      </div>

      {/* Main Center Stage */}
      <div className="relative z-10 flex flex-col items-center justify-center px-4 max-w-sm sm:max-w-md w-full">
        
        {/* Sleek Laptop Hardware Silhouette */}
        <div className="relative mb-6 sm:mb-8 flex flex-col items-center group">
          
          {/* Ambient Display Glow Behind Screen */}
          <div className="absolute -inset-4 rounded-2xl bg-gradient-to-t from-neon-cyan/25 via-neon-purple/20 to-transparent blur-xl opacity-60 transition-opacity duration-500" />

          {/* Laptop Display (Top Lid) */}
          <div className="relative w-44 sm:w-52 h-28 sm:h-32 rounded-t-xl rounded-b-sm border border-white/20 bg-gradient-to-b from-[#121826] to-[#0A0E17] p-2 shadow-[0_0_30px_rgba(0,242,254,0.18)] flex flex-col items-center justify-center overflow-hidden">
            
            {/* Top Bezel Webcam Notch & Indicator */}
            <div className="absolute top-1 inset-x-0 flex items-center justify-center gap-1">
              <div className="h-1 w-1 rounded-full bg-white/20" />
              <div className="h-1 w-1 rounded-full bg-neon-cyan/80 shadow-[0_0_4px_#00f2fe]" />
            </div>

            {/* Inner OLED Screen Surface */}
            <div className="relative w-full h-full rounded bg-[#030509] border border-white/10 flex flex-col items-center justify-center overflow-hidden">
              
              {/* Screen Laser Scanline Effect */}
              <div 
                className="absolute inset-x-0 h-[2px] bg-gradient-to-r from-transparent via-neon-cyan to-transparent shadow-[0_0_10px_#00f2fe] pointer-events-none opacity-70"
                style={{
                  animation: "scanline 2s ease-in-out infinite",
                }}
              />

              {/* Faint Screen Tech Grid */}
              <div 
                className="absolute inset-0 opacity-[0.08]"
                style={{
                  backgroundImage: "linear-gradient(to right, #00f2fe 1px, transparent 1px), linear-gradient(to bottom, #00f2fe 1px, transparent 1px)",
                  backgroundSize: "12px 12px"
                }}
              />

              {/* Centered SELLORA Brand Logo on Screen */}
              <div className="relative z-10 flex flex-col items-center">
                <img 
                  src="/logo.png" 
                  alt="SELLORA" 
                  className="h-10 sm:h-12 w-auto object-contain drop-shadow-[0_0_16px_rgba(0,242,254,0.7)] transform transition-transform duration-500 hover:scale-105"
                />
              </div>

              {/* Screen Bottom Micro Telemetry Bar */}
              <div className="absolute bottom-1 inset-x-2 flex items-center justify-between text-[7px] font-mono text-white/40">
                <span className="text-neon-cyan">240Hz</span>
                <span className="tracking-tighter">OLED MATRIX</span>
              </div>
            </div>
          </div>

          {/* Precision Hinge Bar */}
          <div className="w-16 sm:w-20 h-1.5 bg-gradient-to-b from-[#1b2233] to-[#0d121c] border-x border-white/20 rounded-b-xs -mt-[1px] z-10" />

          {/* Laptop Lower Deck (Chassis Base) in Perspective */}
          <div className="relative w-56 sm:w-64 h-5 sm:h-6 rounded-b-lg border-x border-b border-white/20 bg-gradient-to-b from-[#141b29] via-[#0d121c] to-[#070a10] shadow-[0_12px_24px_rgba(0,0,0,0.8)] flex flex-col items-center justify-start overflow-hidden -mt-[1px]">
            {/* Keyboard Deck Well Indicator */}
            <div className="w-40 sm:w-48 h-2 rounded-xs bg-[#080b12] border border-white/10 mt-0.5 flex items-center justify-center opacity-60">
              <div className="w-10 h-1 rounded-full bg-white/10" />
            </div>
            
            {/* Front Lip Signature RGB Lightbar (Glows in Cyan & Purple) */}
            <div className="absolute bottom-0 inset-x-4 h-[1.5px] bg-gradient-to-r from-transparent via-neon-cyan to-transparent shadow-[0_0_14px_2px_#00f2fe]" />
          </div>

          {/* Underglow Surface Reflection */}
          <div className="w-48 sm:w-56 h-1 rounded-full bg-neon-cyan/40 blur-sm -mt-0.5" />
        </div>

        {/* Brand Name & Typography */}
        <div className="text-center mb-6">
          <h1 className="font-display font-black text-2xl sm:text-3xl tracking-[0.25em] text-transparent bg-clip-text bg-gradient-to-r from-white via-cyan-100 to-neon-cyan drop-shadow-[0_0_20px_rgba(0,242,254,0.4)]">
            SELLORA
          </h1>
          <p className="font-mono text-[10px] sm:text-[11px] tracking-[0.22em] text-white/50 uppercase mt-1">
            PREMIUM PERFORMANCE COMPUTING
          </p>
        </div>

        {/* High-Precision Telemetry Progress Readout */}
        <div className="w-full flex items-center justify-between text-xs font-mono mb-2 px-1">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-neon-cyan opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-neon-cyan" />
            </span>
            <span className="text-white/70 text-[11px] tracking-wider transition-all duration-300">
              {getStatusText(progress)}
            </span>
          </div>
          <span className="font-bold text-neon-cyan tabular-nums tracking-wider text-xs">
            {progress}%
          </span>
        </div>

        {/* Sleek Minimalist Progress Bar */}
        <div className="w-full relative h-[4px] rounded-full bg-white/10 p-[0.5px] overflow-hidden border border-white/10 shadow-[0_0_12px_rgba(0,0,0,0.5)]">
          <div
            className="h-full rounded-full bg-gradient-to-r from-neon-cyan via-sky-400 to-neon-purple transition-all duration-150 ease-out relative"
            style={{ width: `${progress}%` }}
          >
            {/* Leading Edge Beacon Glow */}
            <div className="absolute right-0 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-white shadow-[0_0_10px_2px_#00f2fe]" />
          </div>
        </div>

        {/* Hardware Specification Badges */}
        <div className="flex items-center justify-center gap-2 sm:gap-3 mt-6">
          <div className="px-2.5 py-1 rounded border border-white/10 bg-white/[0.03] text-[9px] sm:text-[10px] font-mono tracking-widest text-white/40 uppercase">
            GEFORCE RTX
          </div>
          <div className="px-2.5 py-1 rounded border border-neon-cyan/25 bg-neon-cyan/[0.04] text-[9px] sm:text-[10px] font-mono tracking-widest text-neon-cyan/80 uppercase">
            OLED 240Hz
          </div>
          <div className="px-2.5 py-1 rounded border border-white/10 bg-white/[0.03] text-[9px] sm:text-[10px] font-mono tracking-widest text-white/40 uppercase">
            VAPOR CHAMBER
          </div>
        </div>

      </div>

      {/* Global CSS for the Screen Scanline Keyframe */}
      <style>{`
        @keyframes scanline {
          0% {
            top: 0%;
            opacity: 0;
          }
          15% {
            opacity: 0.9;
          }
          85% {
            opacity: 0.9;
          }
          100% {
            top: 96%;
            opacity: 0;
          }
        }
      `}</style>
    </div>
  );
}
