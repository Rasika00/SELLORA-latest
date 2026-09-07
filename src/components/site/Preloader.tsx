import { useEffect, useState, useRef } from "react";

export function Preloader({ onComplete }: { onComplete: () => void }) {
  const [progress, setProgress] = useState(0);
  const [isFadingOut, setIsFadingOut] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Smooth continuous loading progression with ease-out curve
  useEffect(() => {
    let animId: number;
    const startTime = performance.now();
    const duration = 1600; // 1.6s smooth loading sequence

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
          setTimeout(onComplete, 650);
        }, 150);
      }
    };

    animId = requestAnimationFrame(step);
    return () => cancelAnimationFrame(animId);
  }, [onComplete]);

  // Quantum Silicon Matrix & Neural Cyber Mesh Canvas Engine
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let width = 0;
    let height = 0;
    let dpr = Math.min(window.devicePixelRatio || 1, 2);

    const resize = () => {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    resize();
    window.addEventListener("resize", resize);

    // Interactive mouse tracking
    const mouse = {
      x: width / 2,
      y: height / 2,
      targetX: width / 2,
      targetY: height / 2,
    };

    const handleMouseMove = (e: MouseEvent) => {
      mouse.targetX = e.clientX;
      mouse.targetY = e.clientY;
    };
    window.addEventListener("mousemove", handleMouseMove);

    // Quantum Node Particles for Silicon Constellation
    interface NodeParticle {
      x: number;
      y: number;
      vx: number;
      vy: number;
      size: number;
      baseAlpha: number;
      color: string;
      glowColor: string;
      pulsePhase: number;
      pulseSpeed: number;
    }

    const nodeCount = width < 768 ? 45 : 85;
    const nodes: NodeParticle[] = [];

    for (let i = 0; i < nodeCount; i++) {
      const isCyan = Math.random() > 0.45;
      nodes.push({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.6,
        vy: (Math.random() - 0.5) * 0.6 - 0.15,
        size: Math.random() * 2.2 + 1,
        baseAlpha: Math.random() * 0.5 + 0.3,
        color: isCyan ? "rgba(0, 242, 254," : "rgba(189, 0, 255,",
        glowColor: isCyan ? "rgba(0, 242, 254, 0.8)" : "rgba(189, 0, 255, 0.8)",
        pulsePhase: Math.random() * Math.PI * 2,
        pulseSpeed: Math.random() * 0.03 + 0.015,
      });
    }

    // Concentric Quantum Wave Rings
    const rings = [
      { radius: 60, speed: 0.8, maxRadius: 360, alpha: 0.35 },
      { radius: 140, speed: 0.8, maxRadius: 360, alpha: 0.25 },
      { radius: 220, speed: 0.8, maxRadius: 360, alpha: 0.15 },
    ];

    let time = 0;
    let animId: number;

    const render = () => {
      time += 1;

      // Smooth mouse interpolation
      mouse.x += (mouse.targetX - mouse.x) * 0.05;
      mouse.y += (mouse.targetY - mouse.y) * 0.05;

      const mouseOffsetFactorX = (mouse.x / width - 0.5) * 50;
      const mouseOffsetFactorY = (mouse.y / height - 0.5) * 50;

      // Dark Cyber Void Background
      ctx.fillStyle = "#050811";
      ctx.fillRect(0, 0, width, height);

      // 1. Dual Ambient Core Glow
      const centerGlow = ctx.createRadialGradient(
        width / 2 + mouseOffsetFactorX * 0.5,
        height / 2 + mouseOffsetFactorY * 0.5,
        0,
        width / 2,
        height / 2,
        Math.max(width, height) * 0.6
      );
      centerGlow.addColorStop(0, "rgba(0, 242, 254, 0.12)");
      centerGlow.addColorStop(0.3, "rgba(147, 51, 234, 0.08)");
      centerGlow.addColorStop(0.7, "rgba(30, 27, 75, 0.04)");
      centerGlow.addColorStop(1, "rgba(5, 8, 17, 0)");

      ctx.fillStyle = centerGlow;
      ctx.fillRect(0, 0, width, height);

      // 2. Concentric Quantum Resonance Rings
      ctx.save();
      ctx.globalCompositeOperation = "screen";
      rings.forEach((ring) => {
        ring.radius += ring.speed;
        if (ring.radius > ring.maxRadius) {
          ring.radius = 40;
        }

        const ringAlpha = (1 - ring.radius / ring.maxRadius) * ring.alpha;
        ctx.beginPath();
        ctx.ellipse(
          width / 2 + mouseOffsetFactorX * 0.3,
          height / 2 + mouseOffsetFactorY * 0.3,
          ring.radius * 1.6,
          ring.radius * 0.9,
          0,
          0,
          Math.PI * 2
        );
        ctx.strokeStyle = `rgba(0, 242, 254, ${ringAlpha})`;
        ctx.lineWidth = 1.2;
        ctx.shadowColor = "rgba(0, 242, 254, 0.5)";
        ctx.shadowBlur = 10;
        ctx.stroke();
      });
      ctx.restore();

      // 3. Dynamic Undulating Silicon Wave Lattice
      ctx.save();
      ctx.globalCompositeOperation = "screen";

      const waveConfigs = [
        {
          baseY: 0.68,
          amp: 45,
          freq: 0.002,
          speed: 0.015,
          stroke: "rgba(0, 242, 254, 0.35)",
          fill: "rgba(0, 242, 254, 0.04)",
        },
        {
          baseY: 0.72,
          amp: 55,
          freq: 0.0016,
          speed: -0.012,
          stroke: "rgba(189, 0, 255, 0.3)",
          fill: "rgba(189, 0, 255, 0.03)",
        },
        {
          baseY: 0.64,
          amp: 35,
          freq: 0.0025,
          speed: 0.02,
          stroke: "rgba(99, 102, 241, 0.25)",
          fill: "transparent",
        },
      ];

      waveConfigs.forEach((w) => {
        ctx.beginPath();
        const startY = height * w.baseY + mouseOffsetFactorY * 0.4;
        ctx.moveTo(0, startY);

        for (let x = 0; x <= width + 20; x += 10) {
          const y =
            startY +
            Math.sin(x * w.freq + time * w.speed) * w.amp +
            Math.cos(x * w.freq * 0.7 - time * 0.01) * (w.amp * 0.5);
          ctx.lineTo(x, y);
        }

        if (w.fill !== "transparent") {
          ctx.lineTo(width, height);
          ctx.lineTo(0, height);
          ctx.closePath();
          ctx.fillStyle = w.fill;
          ctx.fill();
        }

        ctx.strokeStyle = w.stroke;
        ctx.lineWidth = 1.8;
        ctx.shadowColor = w.stroke;
        ctx.shadowBlur = 12;
        ctx.stroke();
      });

      ctx.restore();

      // 4. Silicon Neural Constellation Nodes & Interconnecting Synapses
      ctx.save();
      ctx.globalCompositeOperation = "lighter";

      // Connect nearby nodes with glowing filaments
      const maxConnectDistance = width < 768 ? 95 : 125;
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const dx = nodes[i].x - nodes[j].x;
          const dy = nodes[i].y - nodes[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < maxConnectDistance) {
            const filamentAlpha = (1 - dist / maxConnectDistance) * 0.25;
            ctx.beginPath();
            ctx.moveTo(nodes[i].x, nodes[i].y);
            ctx.lineTo(nodes[j].x, nodes[j].y);
            ctx.strokeStyle = `rgba(0, 242, 254, ${filamentAlpha})`;
            ctx.lineWidth = 0.9;
            ctx.stroke();
          }
        }
      }

      // Update and draw each particle node
      nodes.forEach((n) => {
        n.x += n.vx;
        n.y += n.vy;
        n.pulsePhase += n.pulseSpeed;

        // Wrap around boundaries
        if (n.x < 0) n.x = width;
        if (n.x > width) n.x = 0;
        if (n.y < 0) n.y = height;
        if (n.y > height) n.y = 0;

        // Subtle interactive mouse repulsion
        const dx = n.x - mouse.x;
        const dy = n.y - mouse.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 140) {
          const force = (1 - dist / 140) * 1.5;
          n.x += (dx / (dist || 1)) * force;
          n.y += (dy / (dist || 1)) * force;
        }

        const alpha = n.baseAlpha * (0.65 + 0.35 * Math.sin(n.pulsePhase));
        ctx.beginPath();
        ctx.arc(n.x, n.y, n.size, 0, Math.PI * 2);
        ctx.fillStyle = `${n.color}${alpha})`;
        ctx.shadowColor = n.glowColor;
        ctx.shadowBlur = 8;
        ctx.fill();
      });

      ctx.restore();

      animId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener("resize", resize);
      window.removeEventListener("mousemove", handleMouseMove);
      cancelAnimationFrame(animId);
    };
  }, []);

  return (
    <div
      className={`fixed inset-0 z-[100] flex flex-col items-center justify-center bg-[#050811] overflow-hidden transition-all duration-700 ease-out ${
        isFadingOut ? "opacity-0 pointer-events-none scale-105" : "opacity-100 scale-100"
      }`}
    >
      {/* Native Quantum Silicon Matrix Canvas */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 z-0 h-full w-full object-cover"
      />

      {/* Atmospheric Vignette Overlay */}
      <div className="absolute inset-0 z-[1] pointer-events-none bg-[radial-gradient(ellipse_at_center,transparent_30%,rgba(5,8,17,0.85)_100%)]" />

      {/* Main Center Loading Content */}
      <div
        className={`relative z-10 flex flex-col items-center justify-center w-full h-full px-6 pointer-events-none select-none transition-all duration-700 ease-out ${
          isFadingOut ? "opacity-0 scale-90 translate-y-2" : "opacity-100 scale-100 translate-y-0"
        }`}
      >
        {/* Floating Minimalist Logo and Progress Line */}
        <div className="flex flex-col items-center gap-10 max-w-[200px] sm:max-w-[240px] w-full animate-fade-up">
          
          {/* Glowing Brand Mark */}
          <div className="relative flex items-center justify-center">
            <div className="absolute -inset-8 rounded-full bg-gradient-to-r from-neon-cyan via-purple-500 to-neon-purple opacity-40 blur-2xl animate-pulse" />
            <img 
              src="/logo.png" 
              alt="SELLORA" 
              className="relative h-24 sm:h-28 w-auto object-contain drop-shadow-[0_0_35px_rgba(0,242,254,0.6)]" 
            />
          </div>

          {/* Minimalist Glowing Dual-Tone Progress Line */}
          <div className="w-full flex flex-col items-center">
            <div className="relative h-[2.5px] w-full overflow-hidden rounded-full bg-white/15 shadow-[0_0_12px_rgba(0,0,0,0.6)]">
              <div
                className="absolute inset-y-0 left-0 bg-gradient-to-r from-neon-cyan via-purple-400 to-white shadow-[0_0_15px_rgba(0,242,254,0.9)] transition-all duration-150 ease-out"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
