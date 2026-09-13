import { products, type Product } from "@/data/products";

export interface SoftwareApp {
  id: string;
  name: string;
  category: "creative" | "dev" | "gaming";
  categoryLabel: string;
  tagline: string;
  badge: string;
  minRamGb: number;
  recRamGb: number;
  minVramGb: number;
  cpuWeight: number; // 0 to 1
  gpuWeight: number; // 0 to 1
  ramWeight: number; // 0 to 1
  tgpSensitivity: number; // 0 to 1
}

export interface HardwareProfile {
  name?: string;
  gpuName: string;
  gpuTier: number; // 1 (iGPU/Entry) to 10 (RTX 4090 / RTX 5000 Ada)
  vramGb: number;
  tgpWattage: number; // e.g. 45 to 175 Watts
  ramGb: number;
  cpuName: string;
  cpuTier: number; // 1 (i5) to 10 (i9 HX / M3 Max)
}

export interface AppEvaluation {
  app: SoftwareApp;
  score: number; // 0 - 100
  status: "flawless" | "smooth" | "playable" | "stutter" | "bottleneck";
  statusBadge: string;
  statusColor: "emerald" | "cyan" | "amber" | "rose";
  headline: string;
  metricLabel: string;
  metricValue: string;
  bottlenecks: string[];
  diagnosis: string;
  advice: string;
}

export interface WorkloadEvaluationResult {
  hardware: HardwareProfile;
  appEvaluations: AppEvaluation[];
  overallScore: number;
  overallTier: string;
  overallSummary: string;
  recommendedLaptops: Product[];
}

export const SOFTWARE_CATALOG: SoftwareApp[] = [
  // Creative & 3D
  {
    id: "premiere-pro",
    name: "Adobe Premiere Pro (4K)",
    category: "creative",
    categoryLabel: "Video Production",
    tagline: "4K Multi-cam scrubbing, Lumetri color & timeline export",
    badge: "RAM & VRAM Heavy",
    minRamGb: 16,
    recRamGb: 32,
    minVramGb: 6,
    cpuWeight: 0.35,
    gpuWeight: 0.35,
    ramWeight: 0.30,
    tgpSensitivity: 0.4,
  },
  {
    id: "blender",
    name: "Blender 3D",
    category: "creative",
    categoryLabel: "3D Animation & VFX",
    tagline: "Cycles OptiX rendering, high-poly sculpting & shading",
    badge: "GPU Compute Heavy",
    minRamGb: 16,
    recRamGb: 32,
    minVramGb: 6,
    cpuWeight: 0.25,
    gpuWeight: 0.55,
    ramWeight: 0.20,
    tgpSensitivity: 0.75,
  },
  {
    id: "davinci-resolve",
    name: "DaVinci Resolve Studio",
    category: "creative",
    categoryLabel: "Color & Post-Production",
    tagline: "Hardware accelerated Fusion nodes, Blackmagic RAW & 4K grade",
    badge: "Heavy GPU Acceleration",
    minRamGb: 16,
    recRamGb: 32,
    minVramGb: 6,
    cpuWeight: 0.25,
    gpuWeight: 0.50,
    ramWeight: 0.25,
    tgpSensitivity: 0.65,
  },
  {
    id: "unreal-engine-5",
    name: "Unreal Engine 5",
    category: "creative",
    categoryLabel: "Realtime 3D & Games",
    tagline: "Lumen GI, Nanite virtual geometry & real-time viewport",
    badge: "Extreme GPU & RAM",
    minRamGb: 16,
    recRamGb: 32,
    minVramGb: 8,
    cpuWeight: 0.30,
    gpuWeight: 0.50,
    ramWeight: 0.20,
    tgpSensitivity: 0.8,
  },
  {
    id: "after-effects",
    name: "Adobe After Effects",
    category: "creative",
    categoryLabel: "Motion Graphics",
    tagline: "Complex composition previews, particle systems & 3D camera",
    badge: "RAM Bound",
    minRamGb: 16,
    recRamGb: 64,
    minVramGb: 4,
    cpuWeight: 0.40,
    gpuWeight: 0.20,
    ramWeight: 0.40,
    tgpSensitivity: 0.3,
  },

  // Engineering & Dev
  {
    id: "docker",
    name: "Docker & Dev Containers",
    category: "dev",
    categoryLabel: "DevOps & Engineering",
    tagline: "Microservices cluster, local Kubernetes, Redis & Postgres",
    badge: "System RAM Dependent",
    minRamGb: 16,
    recRamGb: 32,
    minVramGb: 0,
    cpuWeight: 0.35,
    gpuWeight: 0.05,
    ramWeight: 0.60,
    tgpSensitivity: 0.1,
  },
  {
    id: "autocad-solidworks",
    name: "AutoCAD & SolidWorks",
    category: "dev",
    categoryLabel: "CAD & Structural BIM",
    tagline: "Parametric solid assemblies, OpenGL precision viewports",
    badge: "CPU Single-Core & GPU",
    minRamGb: 16,
    recRamGb: 32,
    minVramGb: 4,
    cpuWeight: 0.50,
    gpuWeight: 0.30,
    ramWeight: 0.20,
    tgpSensitivity: 0.4,
  },
  {
    id: "vscode-fullstack",
    name: "VS Code & Fullstack Dev",
    category: "dev",
    categoryLabel: "Software Engineering",
    tagline: "Next.js Turbo build, Node APIs, Chrome DevTools & simulators",
    badge: "CPU & Memory Focused",
    minRamGb: 8,
    recRamGb: 16,
    minVramGb: 0,
    cpuWeight: 0.50,
    gpuWeight: 0.05,
    ramWeight: 0.45,
    tgpSensitivity: 0.05,
  },
  {
    id: "python-ai-pytorch",
    name: "Python AI & PyTorch",
    category: "dev",
    categoryLabel: "Machine Learning / Data",
    tagline: "Local LLM inference, CUDA tensor compute & Pandas pipelines",
    badge: "CUDA VRAM Critical",
    minRamGb: 16,
    recRamGb: 32,
    minVramGb: 8,
    cpuWeight: 0.25,
    gpuWeight: 0.55,
    ramWeight: 0.20,
    tgpSensitivity: 0.7,
  },

  // AAA & Esports Gaming
  {
    id: "cyberpunk-2077",
    name: "Cyberpunk 2077: Phantom Liberty",
    category: "gaming",
    categoryLabel: "AAA Open-World Ray Tracing",
    tagline: "Night City dense crowds, ray-traced reflections & high TGP load",
    badge: "High TGP & GPU Bound",
    minRamGb: 16,
    recRamGb: 32,
    minVramGb: 6,
    cpuWeight: 0.25,
    gpuWeight: 0.65,
    ramWeight: 0.10,
    tgpSensitivity: 0.9,
  },
  {
    id: "valorant-cs2",
    name: "Valorant & Counter-Strike 2",
    category: "gaming",
    categoryLabel: "Tactical Esports",
    tagline: "High refresh-rate 144Hz-240Hz+ competitive low-latency fragging",
    badge: "High FPS CPU Bound",
    minRamGb: 8,
    recRamGb: 16,
    minVramGb: 4,
    cpuWeight: 0.60,
    gpuWeight: 0.30,
    ramWeight: 0.10,
    tgpSensitivity: 0.4,
  },
  {
    id: "black-myth-wukong",
    name: "Black Myth: Wukong",
    category: "gaming",
    categoryLabel: "Next-Gen Unreal Engine 5",
    tagline: "Cinematic boss fights, dense forest shaders & full TSR/DLSS",
    badge: "High VRAM & GPU",
    minRamGb: 16,
    recRamGb: 32,
    minVramGb: 6,
    cpuWeight: 0.20,
    gpuWeight: 0.70,
    ramWeight: 0.10,
    tgpSensitivity: 0.85,
  },
  {
    id: "warzone",
    name: "Call of Duty: Warzone",
    category: "gaming",
    categoryLabel: "Battle Royale",
    tagline: "Large map asset streaming, fast 100+ FPS gunplay & VRAM cache",
    badge: "VRAM & RAM Demanding",
    minRamGb: 16,
    recRamGb: 32,
    minVramGb: 8,
    cpuWeight: 0.30,
    gpuWeight: 0.50,
    ramWeight: 0.20,
    tgpSensitivity: 0.7,
  },
  {
    id: "elden-ring",
    name: "Elden Ring",
    category: "gaming",
    categoryLabel: "Action RPG",
    tagline: "Seamless Lands Between open world, volumetric lighting at 60 FPS",
    badge: "GPU & Shader Heavy",
    minRamGb: 12,
    recRamGb: 16,
    minVramGb: 4,
    cpuWeight: 0.30,
    gpuWeight: 0.55,
    ramWeight: 0.15,
    tgpSensitivity: 0.6,
  },
];

export const WORKLOAD_PRESETS = [
  {
    id: "creator",
    title: "Content Creator Stack",
    description: "4K YouTube / Reels editing, VFX & 3D artwork",
    appIds: ["premiere-pro", "blender", "davinci-resolve"],
    icon: "Video",
  },
  {
    id: "gamer",
    title: "Hardcore AAA & Esports",
    description: "Ray-traced blockbusters and 240Hz competitive shooters",
    appIds: ["cyberpunk-2077", "valorant-cs2", "black-myth-wukong"],
    icon: "Gamepad2",
  },
  {
    id: "engineering",
    title: "Architect & 3D Engineering",
    description: "BIM models, structural CAD, and Unreal Engine rendering",
    appIds: ["autocad-solidworks", "blender", "unreal-engine-5"],
    icon: "Compass",
  },
  {
    id: "developer",
    title: "Fullstack & DevOps Dev",
    description: "Microservices containers, local AI models & heavy web dev",
    appIds: ["docker", "vscode-fullstack", "python-ai-pytorch"],
    icon: "Terminal",
  },
  {
    id: "hybrid",
    title: "Hybrid Power User",
    description: "Editing 4K footage by day, Cyberpunk Night City by night",
    appIds: ["premiere-pro", "cyberpunk-2077", "docker", "blender"],
    icon: "Zap",
  },
];

// Helper to extract hardware specs from a SELLORA Product
export function extractHardwareProfile(product: Product): HardwareProfile {
  const ramMatch = product.ram.match(/(\d+)\s*GB/i);
  const ramGb = ramMatch ? parseInt(ramMatch[1], 10) : 16;

  const gpuLower = product.gpu.toLowerCase();
  let gpuTier = 4;
  let vramGb = 6;
  let tgpWattage = 75;

  if (gpuLower.includes("4090")) {
    gpuTier = 10;
    vramGb = 16;
    tgpWattage = 175;
  } else if (gpuLower.includes("5000 ada") || gpuLower.includes("4000 ada")) {
    gpuTier = 9.5;
    vramGb = gpuLower.includes("5000") ? 16 : 12;
    tgpWattage = 135;
  } else if (gpuLower.includes("4080")) {
    gpuTier = 8.5;
    vramGb = 12;
    tgpWattage = 150;
  } else if (gpuLower.includes("4070")) {
    gpuTier = 7.5;
    vramGb = 8;
    tgpWattage = 115;
  } else if (gpuLower.includes("4060")) {
    gpuTier = 6.5;
    vramGb = 8;
    tgpWattage = 100;
  } else if (gpuLower.includes("4050")) {
    gpuTier = 5.0;
    vramGb = 6;
    // Check if thin & light chassis (e.g., Dell XPS 14) or thick gaming chassis
    if (product.name.toLowerCase().includes("xps") || product.name.toLowerCase().includes("zenbook")) {
      tgpWattage = 60; // Thin chassis 50-65W
    } else {
      tgpWattage = 75; // Standard 75W TGP
    }
  } else if (gpuLower.includes("apple") || gpuLower.includes("m3") || gpuLower.includes("m2")) {
    gpuTier = 8.5;
    vramGb = ramGb; // Unified memory
    tgpWattage = 65;
  } else if (gpuLower.includes("3050") || gpuLower.includes("2050")) {
    gpuTier = 3.5;
    vramGb = 4;
    tgpWattage = 50;
  } else {
    // Integrated / Arc
    gpuTier = 2.5;
    vramGb = 2;
    tgpWattage = 35;
  }

  // CPU Tier
  const cpuLower = product.cpu.toLowerCase();
  let cpuTier = 6;
  if (cpuLower.includes("14900hx") || cpuLower.includes("13980hx") || cpuLower.includes("13950hx")) {
    cpuTier = 10;
  } else if (cpuLower.includes("m3 max")) {
    cpuTier = 9.8;
  } else if (cpuLower.includes("8945hs") || cpuLower.includes("185h") || cpuLower.includes("7945hx")) {
    cpuTier = 8.5;
  } else if (cpuLower.includes("i9") || cpuLower.includes("ultra 9")) {
    cpuTier = 8.0;
  } else if (cpuLower.includes("i7") || cpuLower.includes("ultra 7") || cpuLower.includes("ryzen 7")) {
    cpuTier = 7.0;
  } else if (cpuLower.includes("i5") || cpuLower.includes("ryzen 5")) {
    cpuTier = 5.0;
  }

  return {
    name: product.name,
    gpuName: product.gpu,
    gpuTier,
    vramGb,
    tgpWattage,
    ramGb,
    cpuName: product.cpu,
    cpuTier,
  };
}

// Evaluate a single software/game against hardware profile
export function evaluateSingleApp(app: SoftwareApp, hw: HardwareProfile): AppEvaluation {
  const bottlenecks: string[] = [];

  // 1. TGP factor: normalized around 100W baseline for desktop replacement vs 45-75W for thin-and-light
  // If TGP is 75W, factor is around 0.88; at 45W it's 0.70; at 140W+ it's 1.05
  const tgpFactor = Math.min(1.15, Math.max(0.55, 0.55 + (hw.tgpWattage / 175) * 0.55));
  const effectiveGpuTier = hw.gpuTier * (1 - app.tgpSensitivity * 0.4 + app.tgpSensitivity * 0.4 * tgpFactor);

  // 2. RAM adequacy (0 to 1)
  let ramScore = 1.0;
  if (hw.ramGb < app.minRamGb) {
    ramScore = 0.45;
    bottlenecks.push(`Requires ${app.minRamGb}GB RAM (Currently ${hw.ramGb}GB)`);
  } else if (hw.ramGb < app.recRamGb) {
    ramScore = 0.75 + ((hw.ramGb - app.minRamGb) / (app.recRamGb - app.minRamGb)) * 0.2;
    if (app.id === "premiere-pro") {
      bottlenecks.push("Stutters during heavy 4K export with multiple video tracks");
    } else if (app.id === "docker") {
      bottlenecks.push("Limited to 5–8 active microservice containers");
    } else if (app.id === "after-effects") {
      bottlenecks.push("Short RAM preview cache length");
    }
  }

  // 3. VRAM adequacy (0 to 1)
  let vramScore = 1.0;
  if (app.minVramGb > 0) {
    if (hw.vramGb < app.minVramGb) {
      vramScore = 0.50;
      bottlenecks.push(`VRAM Limited (${hw.vramGb}GB vs ${app.minVramGb}GB required)`);
    } else if (hw.vramGb === app.minVramGb && app.recRamGb > 16) {
      vramScore = 0.80;
      if (app.id === "cyberpunk-2077") {
        bottlenecks.push("Requires DLSS Frame Gen & Medium/High textures to avoid VRAM overfill");
      } else if (app.id === "blender") {
        bottlenecks.push("Complex Cycles scenes may spill from VRAM into system memory");
      }
    }
  }

  // 4. TGP specific bottleneck check
  if (app.tgpSensitivity >= 0.7 && hw.tgpWattage <= 75 && hw.gpuTier <= 6) {
    bottlenecks.push(`TGP Thermal & Power Cap (${hw.tgpWattage}W limit drops sustained clocks)`);
  }

  // Compute sub scores (0 to 100)
  const gpuNormalized = Math.min(100, (effectiveGpuTier / 10) * 100 * vramScore);
  const cpuNormalized = Math.min(100, (hw.cpuTier / 10) * 100);
  const ramNormalized = Math.min(100, ramScore * 100);

  const rawScore = Math.round(
    gpuNormalized * app.gpuWeight + cpuNormalized * app.cpuWeight + ramNormalized * app.ramWeight
  );

  const finalScore = Math.max(15, Math.min(100, rawScore));

  // Determine status tier & user-friendly headline
  let status: "flawless" | "smooth" | "playable" | "stutter" | "bottleneck";
  let statusBadge: string;
  let statusColor: "emerald" | "cyan" | "amber" | "rose";
  let headline = "";
  let metricLabel = "";
  let metricValue = "";
  let diagnosis = "";
  let advice = "";

  if (finalScore >= 88) {
    status = "flawless";
    statusBadge = "Flawless Performance";
    statusColor = "emerald";
  } else if (finalScore >= 74) {
    status = "smooth";
    statusBadge = "Smooth 60+ FPS / Pro Grade";
    statusColor = "cyan";
  } else if (finalScore >= 58) {
    status = "playable";
    statusBadge = "Playable / Modest Settings";
    statusColor = "amber";
  } else if (finalScore >= 40) {
    status = "stutter";
    statusBadge = "Stutters Under Load";
    statusColor = "amber";
  } else {
    status = "bottleneck";
    statusBadge = "Hardware Bottleneck";
    statusColor = "rose";
  }

  // Generate specialized context per app
  switch (app.id) {
    case "premiere-pro":
      metricLabel = "4K Playback Speed";
      if (finalScore >= 85) {
        headline = "Real-Time 4K Timeline Scrubbing (Full Quality)";
        metricValue = "Full Res 60 FPS";
        diagnosis = `Hardware NVENC/ProRes encoding active with ${hw.ramGb}GB RAM. Effortlessly handles multi-cam 4K ProRes timelines without dropping frames.`;
        advice = "Ready for cinematic documentary & commercial editing.";
      } else if (finalScore >= 68) {
        headline = "Smooth 4K Playback with 1/2 Proxy Option";
        metricValue = "1/2 Res 60 FPS / Full 42 FPS";
        diagnosis = `${hw.gpuName} (${hw.tgpWattage}W TGP) renders standard 4K timelines smoothly, but multi-layer transitions may buffer during export.`;
        advice = hw.ramGb < 32 ? "Upgrade to 32GB RAM to prevent export stutter on heavy projects." : "Enable CUDA GPU acceleration in Project Settings.";
      } else {
        headline = "Stutters During 4K Export & Scrubbing";
        metricValue = "Frequent Frame Drops";
        diagnosis = `Limited by ${hw.ramGb < 16 ? "insufficient RAM" : "GPU VRAM & encoding horsepower"}. Complex effects will cause timeline lag.`;
        advice = "Generate 1080p ProRes Proxies before editing 4K timelines.";
      }
      break;

    case "cyberpunk-2077":
      metricLabel = "Estimated FPS (1080p High)";
      if (finalScore >= 88) {
        headline = "Smooth 85+ FPS with Ray Tracing Ultra";
        metricValue = "85 - 110 FPS";
        diagnosis = `High-power GPU with ${hw.tgpWattage}W TGP provides maximum raster and RT headroom in Night City.`;
        advice = "Max out Ray Tracing Overdrive with DLSS 3 Frame Generation.";
      } else if (finalScore >= 68) {
        headline = hw.tgpWattage <= 75 ? "50-65 FPS (1080p High) / 60+ FPS with DLSS" : "Smooth 60+ FPS High Settings";
        metricValue = hw.tgpWattage <= 75 ? "52 - 64 FPS (DLSS Auto)" : "62 - 78 FPS";
        diagnosis = `${hw.gpuName} with ${hw.tgpWattage}W TGP runs Cyberpunk comfortably at 1080p High. 6GB VRAM requires keeping crowd density at Medium.`;
        advice = "Turn on DLSS Quality + Frame Generation for guaranteed 60+ FPS lock.";
      } else if (finalScore >= 50) {
        headline = "38-48 FPS Native / 55 FPS with FSR/DLSS Balanced";
        metricValue = "42 - 50 FPS";
        diagnosis = `Lower TGP (${hw.tgpWattage}W) and limited VRAM throttle shader clock speeds during open-world combat.`;
        advice = "Lower Volumetric Fog and Screen Space Reflections to Medium.";
      } else {
        headline = "Sub-30 FPS / Heavy Stutters in Combat";
        metricValue = "< 28 FPS";
        diagnosis = "Hardware lacks dedicated shader pipelines or VRAM buffer required for modern AAA rendering.";
        advice = "Drop resolution to 720p with Low settings or consider upgrading.";
      }
      break;

    case "blender":
      metricLabel = "Cycles 1080p Render Time";
      if (finalScore >= 85) {
        headline = "Blazing Fast OptiX / Metal Acceleration";
        metricValue = "~18 sec / frame";
        diagnosis = `Substantial CUDA/Tensor cores and ${hw.tgpWattage}W power delivery shred complex ray-traced scenes in seconds.`;
        advice = "Enable OptiX Denoising in Viewport for instant photorealistic previews.";
      } else if (finalScore >= 65) {
        headline = "Fast Viewport & Responsive Shading";
        metricValue = "~45 sec / frame";
        diagnosis = `${hw.gpuName} handles medium-poly scenes easily. High sample count rendering will warm up the ${hw.tgpWattage}W cooling system.`;
        advice = "Keep Viewport Samples around 32-64 to preserve smooth navigation.";
      } else {
        headline = "Render Delays / High Memory Spillage";
        metricValue = "> 2 min / frame";
        diagnosis = "Low VRAM or integrated GPU causes Cycles to fallback to CPU tile calculation.";
        advice = "Reduce texture resolutions and simplify subdivision modifiers.";
      }
      break;

    case "docker":
      metricLabel = "Concurrent Containers";
      if (finalScore >= 85) {
        headline = "Effortless Microservices & Kubernetes Cluster";
        metricValue = "25+ Containers";
        diagnosis = `${hw.ramGb}GB RAM and high multi-core count provide ample memory pools for databases, caches, and API nodes.`;
        advice = "You can run full production mirrors locally without paging.";
      } else if (finalScore >= 65) {
        headline = "Solid Development Stack (Node + DB + Redis)";
        metricValue = "10 - 15 Containers";
        diagnosis = `${hw.ramGb}GB RAM accommodates a typical fullstack Docker Compose environment smoothly.`;
        advice = "Allocate up to 8GB to WSL2 / Docker Engine settings.";
      } else {
        headline = "Requires 16GB RAM Upgrade (Heavy Disk Swapping)";
        metricValue = "3 - 5 Containers max";
        diagnosis = `${hw.ramGb}GB is insufficient for running modern IDEs, Chrome, and Docker containers simultaneously without severe OS paging.`;
        advice = "Immediate recommendation: Upgrade laptop RAM to 16GB or 32GB.";
      }
      break;

    case "autocad-solidworks":
      metricLabel = "BIM / Assembly Fluidity";
      if (finalScore >= 80) {
        headline = "Silky Smooth 3D CAD Assemblies (5,000+ Parts)";
        metricValue = "60 FPS Viewport";
        diagnosis = `Fast single-core clock speeds from ${hw.cpuName} and dedicated GPU eliminate geometry redraw delays.`;
        advice = "ISV workstation certified grade performance.";
      } else if (finalScore >= 60) {
        headline = "Responsive Part Modeling & Drafting";
        metricValue = "45 - 60 FPS";
        diagnosis = "Great for component design and mid-size architectural floorplans.";
        advice = "Turn off real-time ambient shadows in massive assemblies.";
      } else {
        headline = "Lag During Rotation of Complex Assemblies";
        metricValue = "< 30 FPS Viewport";
        diagnosis = "CPU single-thread bottlenecks and integrated graphics slow down complex vector rendering.";
        advice = "Use lightweight assembly mode in SolidWorks.";
      }
      break;

    case "valorant-cs2":
      metricLabel = "Competitive Framerate";
      if (finalScore >= 80) {
        headline = "Esports God Tier: 240Hz - 360Hz Ready";
        metricValue = "280 - 450+ FPS";
        diagnosis = `${hw.cpuName} single-thread latency is ultra-low, completely unbottlenecking high-refresh displays.`;
        advice = "Enable Reflex Low Latency for sub-5ms input response.";
      } else if (finalScore >= 60) {
        headline = "Smooth 144Hz - 200 FPS Tournament Play";
        metricValue = "160 - 220 FPS";
        diagnosis = "Easily saturates standard 144Hz laptop panels with zero micro-stuttering.";
        advice = "Lock FPS to match your display refresh rate.";
      } else {
        headline = "Playable 60-90 FPS (Minor 1% Low Drops)";
        metricValue = "75 - 110 FPS";
        diagnosis = "Playable for casual matches, but sudden smokes or utility can cause frame dips.";
        advice = "Set material quality and shadows to Low.";
      }
      break;

    default:
      metricLabel = "Overall Efficiency";
      metricValue = `${finalScore}% Capability`;
      if (finalScore >= 80) {
        headline = "Flawless Execution with Headroom to Spare";
        diagnosis = "Hardware exceeds recommended application guidelines.";
        advice = "Ideal configuration for continuous daily production.";
      } else if (finalScore >= 60) {
        headline = "Solid Everyday Performance";
        diagnosis = "Handles mainstream workloads with minor setting adjustments.";
        advice = "Close background processes during intensive tasks.";
      } else {
        headline = "Potential Hardware Bottleneck";
        diagnosis = "Hardware may struggle during sustained peak processing.";
        advice = "Consider hardware with higher TGP or greater RAM allocation.";
      }
      break;
  }

  return {
    app,
    score: finalScore,
    status,
    statusBadge,
    statusColor,
    headline,
    metricLabel,
    metricValue,
    bottlenecks,
    diagnosis,
    advice,
  };
}

// Evaluate multiple apps and calculate composite workload score
export function evaluateWorkload(
  hw: HardwareProfile,
  selectedAppIds: string[]
): WorkloadEvaluationResult {
  const selectedApps = SOFTWARE_CATALOG.filter((app) => selectedAppIds.includes(app.id));

  const appEvaluations = selectedApps.map((app) => evaluateSingleApp(app, hw));

  if (appEvaluations.length === 0) {
    return {
      hardware: hw,
      appEvaluations: [],
      overallScore: 0,
      overallTier: "No Software Selected",
      overallSummary: "Select 1 to 5 applications or games from the catalog above to benchmark against this hardware specification.",
      recommendedLaptops: products.slice(0, 3),
    };
  }

  const totalScore = Math.round(
    appEvaluations.reduce((acc, curr) => acc + curr.score, 0) / appEvaluations.length
  );

  let overallTier = "Solid Workhorse";
  let overallSummary = "Handles your chosen apps with balanced performance.";

  if (totalScore >= 90) {
    overallTier = "Apex Tier Powerhouse";
    overallSummary = "No compromises. Designed for uninterrupted 4K timeline rendering, ray-traced gaming, and heavy workloads simultaneously.";
  } else if (totalScore >= 80) {
    overallTier = "High Performance Pro";
    overallSummary = "Smooth 60+ FPS in games and swift rendering speeds. Easily handles demanding creative and developer stacks.";
  } else if (totalScore >= 65) {
    overallTier = "Capable Mainstream Performer";
    overallSummary = "Good performance for everyday creative and gaming needs. May require DLSS or proxy workflows for maximum fluidity.";
  } else if (totalScore >= 50) {
    overallTier = "Entry Level / Moderate Stutters";
    overallSummary = "Works for basic tasks, but will encounter noticeable thermal, VRAM, or RAM limits during heavy export or modern AAA gaming.";
  } else {
    overallTier = "Hardware Upgrade Recommended";
    overallSummary = "Significant hardware bottlenecks detected for this stack. RAM or GPU upgrade strongly advised.";
  }

  // Find top 3 recommended laptops in SELLORA deck that best suit this selected app stack
  const recommendedLaptops = [...products]
    .map((product) => {
      const productHw = extractHardwareProfile(product);
      const productAppScores = selectedApps.map((a) => evaluateSingleApp(a, productHw).score);
      const avg =
        productAppScores.length > 0
          ? productAppScores.reduce((a, b) => a + b, 0) / productAppScores.length
          : 0;

      return {
        product,
        avgScore: avg,
      };
    })
    .sort((a, b) => b.avgScore - a.avgScore)
    .slice(0, 3)
    .map((item) => item.product);

  return {
    hardware: hw,
    appEvaluations,
    overallScore: totalScore,
    overallTier,
    overallSummary,
    recommendedLaptops,
  };
}
