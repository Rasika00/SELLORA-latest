import { useState, useRef, useEffect } from "react";
import { 
  Bot, 
  Send, 
  X, 
  Minimize2, 
  RotateCcw, 
  ShoppingCart, 
  ArrowRight, 
  ChevronRight,
  Settings,
  Key,
  Info,
  Zap,
  MessageSquare,
  Phone,
  ExternalLink,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Sparkles,
  Compass,
  Scale,
  ShieldCheck,
  CreditCard,
  Laptop,
  HelpCircle,
  Award
} from "lucide-react";
import { Link } from "@tanstack/react-router";
import { products, type Product } from "@/data/products";
import { useCart } from "@/context/CartContext";

type Message = {
  id: string;
  sender: "user" | "bot";
  text: string;
  timestamp: string;
  suggestedProducts?: Product[];
  actionLinks?: { label: string; url: string; isRoute?: boolean; isExternal?: boolean }[];
  showContactOptions?: boolean;
};

const SUGGESTION_CHIPS = [
  "🗺️ Take a Website Tour",
  "🎯 Help me choose a laptop",
  "⚔️ Showdown Compare Arena",
  "🎮 Best laptop for Gaming",
  "🎬 Best for 4K/8K Video Editing",
  "🚀 Best for Blender 3D & CAD",
  "💰 Laptops under Rs 350,000",
  "🛡️ 3-Year Warranty & Shipping",
  "💳 Payment & 5% Bank Discount",
  "📞 Chat with Engineer on WhatsApp"
];

// Full catalog context for AI
const CATALOG_CONTEXT = products.map(p => 
  `[Model: ${p.name} | ID: ${p.id} | Category: ${p.category} | Processor: ${p.processor} | CPU: ${p.cpu} | RAM: ${p.ram} | GPU: ${p.gpu} | Price: Rs ${p.price.toLocaleString()} (${p.priceUsd || ''}) | Display: ${p.display || 'N/A'} | Battery & Weight: ${p.batteryWeight || 'N/A'} | Benchmark Score: ${p.detailedSpecs?.benchmarkScore || 'N/A'} | Cooling: ${p.detailedSpecs?.cooling || 'N/A'} | Highlight: ${p.specialHighlight || 'N/A'}]`
).join("\n");

const SYSTEM_PROMPT = `You are "Sellora AI", the warm, super-friendly, and ultra-knowledgeable official digital concierge for SELLORA (a premier high-performance workstation & laptop marketplace).

### YOUR PERSONALITY & TONE:
- Be cheerful, polite, welcoming, and enthusiastically helpful!
- Use friendly emojis (✨, 🚀, 💻, 🛡️, ⚡, 🎮, 🎯) to make responses lively and easy to read.
- Address the user kindly and make them feel supported every step of the way.
- Always provide clear, well-structured answers with bullet points and bold highlights.

### COMPREHENSIVE SELLORA WEBSITE KNOWLEDGE BASE:

1. **WHAT IS SELLORA?**
   - Sellora is a specialized platform offering the world's most powerful creator, workstation, and gaming laptops.
   - Every unit is zero-bloatware, hand-calibrated (100% DCI-P3 displays), and protected by an industry-leading 3-Year Global Priority Replacement Warranty.

2. **MAIN WEBSITE SECTIONS & NAVIGATION:**
   - **Laptop Catalog** (\`/#products\`): Complete collection of flagship laptops with live search, filters (All, Gaming, Workstation, Ultrabook), sorting, and instant cart additions.
   - **Showdown Arena (3-Way Comparison)** (\`/compare\`): Interactive 3-way side-by-side comparison tool comparing specs, CPU/GPU, displays, thermals, and benchmark scores in real time.
   - **Creator & Partner Ecosystem** (\`/#creator\`): Strategic partnerships with industry leaders Apple, Dell Technologies, and Lenovo.
   - **Silicon & Thermal Tech Architecture** (\`/#features\`): Explains Vapor Chamber cooling, DDR5 6000MHz low-latency RAM, PCIe 5.0 SSDs (up to 12,000 MB/s), CNC aluminum unibody chassis, 99.9Wh flight-max batteries, and ISV certifications (Autodesk, Adobe, Epic Games).
   - **Orbital ProCare Support** (\`/#support\`): 24/7 direct video/terminal access to hardware engineers, Driver & BIOS Vault for studio drivers, and 45 global service hubs.
   - **Checkout & Ordering** (\`/checkout\`): Fast, streamlined checkout with delivery options, instant 5% bank discount calculator, and 0% EMI options.
   - **Admin Command Center** (\`/admin\`): Real-time administrative dashboard for inventory management, real-time analytics, order logs, and telemetry.
   - **Account Sign In** (\`/login\`): Secure terminal login for customers and staff.

3. **CUSTOMER POLICIES & ADVANTAGES:**
   - **3-Year Global Priority Replacement Warranty**: In case of any hardware fault, units are replaced within 24–48 hours with zero repair downtime.
   - **14-Day Hassle-Free Test Drive**: Full return/exchange window with 0% restocking fee.
   - **Express Shipping**: Domestic Express (24–48h with live GPS tracking) & Global Priority Shipping (3–5 business days) inside shock-absorbing vacuum flight cases.
   - **Payment Methods**: Visa, MasterCard, American Express, Direct Bank Transfer (gives an automatic **5% Instant Discount**), and 0% interest monthly installments up to 24 months.
   - **Student & Corporate Discounts**: Educational discounts (additional 5-8% off) and corporate bulk quotes available via WhatsApp.
   - **Direct Contact**: WhatsApp hotline \`+94 77 123 4567\`, Phone \`+94 11 234 5678\`, 24/7 engineer concierge.

4. **CURRENT SELLORA PRODUCT INVENTORY:**
${CATALOG_CONTEXT}

### INSTRUCTIONS:
- Whenever a user asks for recommendations, ask friendly follow-up questions about their workload or budget if needed, and recommend the best matching models from the inventory.
- Include relevant page routes or features (like Showdown Arena \`/compare\` or Support \`/#support\`).
- Stay positive, concise, structured, and warm!`;

export function AiChatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [geminiApiKey, setGeminiApiKey] = useState(() => {
    if (typeof window !== "undefined") {
      const local = localStorage.getItem("sellora_gemini_key");
      if (local && local.trim()) return local.trim();
    }
    return ((import.meta as any).env?.VITE_GEMINI_API_KEY || "").trim();
  });
  const [tempApiKey, setTempApiKey] = useState(geminiApiKey);
  const [testingKey, setTestingKey] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome-1",
      sender: "bot",
      text: "👋 **Hello and welcome to Sellora!** ✨\n\nI'm **Sellora AI**, your personal hardware advisor & website guide. I'm here to make exploring our store effortless and fun!\n\nFeel free to ask me about:\n• 💻 **Laptop recommendations** for gaming, 3D, coding, or video editing\n• ⚔️ **Comparing models** in our Showdown Arena\n• 🛡️ **3-Year Warranty & Express Shipping**\n• 💰 **Prices, discounts & 0% installments**\n• 🗺️ **A quick tour of the website!**\n\nHow can I help you today? 😊",
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      actionLinks: [
        { label: "🗺️ Website Tour", url: "#tour", isRoute: false },
        { label: "⚔️ Showdown Arena", url: "/compare", isRoute: true },
        { label: "💻 View Laptops", url: "/#products", isRoute: false }
      ]
    }
  ]);

  const { addToCart } = useCart();
  const chatEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto scroll to bottom
  useEffect(() => {
    if (isOpen && !isMinimized) {
      chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isTyping, isOpen, isMinimized]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen && !isMinimized && !showSettings) {
      setTimeout(() => inputRef.current?.focus(), 150);
    }
  }, [isOpen, isMinimized, showSettings]);

  // Candidate models to try in priority order
  const GEMINI_MODELS = [
    "gemini-2.0-flash",
    "gemini-1.5-flash",
    "gemini-2.5-flash",
    "gemini-1.5-pro"
  ];

  // Test Gemini API Key across candidate models
  const handleTestKey = async () => {
    const key = tempApiKey.trim();
    if (!key) {
      setTestResult({ success: false, message: "Please enter a valid Gemini API key first (starts with 'AIzaSy...')." });
      return;
    }

    setTestingKey(true);
    setTestResult(null);

    let lastError = "";
    for (const model of GEMINI_MODELS) {
      try {
        const res = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              contents: [{ role: "user", parts: [{ text: "Hello" }] }]
            })
          }
        );

        if (res.ok) {
          setTestResult({ 
            success: true, 
            message: `✅ Connected successfully to Google Gemini (${model})!` 
          });
          setTestingKey(false);
          return;
        } else {
          const errorData = await res.json().catch(() => ({}));
          lastError = errorData?.error?.message || `HTTP ${res.status}: ${res.statusText}`;
        }
      } catch (err: any) {
        lastError = err?.message || "Network / CORS connection error";
      }
    }

    setTestResult({ 
      success: false, 
      message: `❌ Connection failed: ${lastError || "Invalid API Key or Network Block"}` 
    });
    setTestingKey(false);
  };

  // Save or clear API key
  const saveApiKey = (keyToSave: string) => {
    const trimmed = keyToSave.trim();
    if (trimmed) {
      if (typeof window !== "undefined") {
        localStorage.setItem("sellora_gemini_key", trimmed);
      }
      setGeminiApiKey(trimmed);
      setTempApiKey(trimmed);
    } else {
      if (typeof window !== "undefined") {
        localStorage.removeItem("sellora_gemini_key");
      }
      const envKey = (import.meta as any).env?.VITE_GEMINI_API_KEY?.trim() || "";
      setGeminiApiKey(envKey);
      setTempApiKey(envKey);
    }
    setShowSettings(false);
  };

  // Google Gemini API Engine with auto-fallback across models
  const callGeminiApi = async (userPrompt: string, history: Message[]): Promise<string> => {
    const key = geminiApiKey.trim() || (import.meta as any).env?.VITE_GEMINI_API_KEY?.trim() || "";
    if (!key) throw new Error("No Gemini API key configured. Click ⚙️ in the chat header or set VITE_GEMINI_API_KEY in .env.");

    const conversationTurns: { role: "user" | "model"; parts: { text: string }[] }[] = [];
    let expectedRole: "user" | "model" = "user";
    
    for (const m of history.slice(-8)) {
      const role = m.sender === "user" ? "user" : "model";
      if (role === expectedRole && m.text.trim()) {
        conversationTurns.push({
          role: role,
          parts: [{ text: m.text.trim() }]
        });
        expectedRole = expectedRole === "user" ? "model" : "user";
      }
    }

    if (expectedRole === "model" && conversationTurns.length > 0) {
      conversationTurns.pop();
    }
    conversationTurns.push({
      role: "user",
      parts: [{ text: userPrompt }]
    });

    let lastError = "";

    for (const model of GEMINI_MODELS) {
      try {
        const response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              system_instruction: {
                parts: [{ text: SYSTEM_PROMPT }]
              },
              contents: conversationTurns,
              generationConfig: {
                temperature: 0.7,
                maxOutputTokens: 1000
              }
            })
          }
        );

        if (response.ok) {
          const data = await response.json();
          const reply = data.candidates?.[0]?.content?.parts?.[0]?.text;
          if (reply) return reply;
        } else {
          const err = await response.json().catch(() => ({}));
          lastError = err?.error?.message || `HTTP ${response.status}`;
        }
      } catch (err: any) {
        lastError = err?.message || "Network Error";
      }
    }

    throw new Error(lastError || "All Gemini endpoints failed to respond.");
  };

  // High-Accuracy Deep Semantic Answering Engine (Comprehensive Local Engine)
  const processAccurateAnswer = (query: string): { 
    reply: string; 
    matchedProducts?: Product[]; 
    actionLinks?: { label: string; url: string; isRoute?: boolean }[]; 
    showContact?: boolean 
  } => {
    const q = query.toLowerCase().trim();

    // 0. Website Tour / What is Sellora / Navigation
    if (q.includes("tour") || q.includes("what is sellora") || q.includes("about website") || q.includes("how website works") || q.includes("explore")) {
      return {
        reply: `🌟 **Welcome to the Sellora Tour! Here is everything on our platform:**\n\n` +
          `1. 💻 **Laptop Catalog** (\`/#products\`): Browse top-rated gaming rigs, workstation beasts, and sleek ultrabooks with live stock and filters.\n` +
          `2. ⚔️ **Showdown Arena** (\`/compare\`): Compare up to 3 laptops side-by-side with CPU/GPU benchmarks, display specs, and battery ratings.\n` +
          `3. 🏢 **Brand Ecosystem** (\`/#creator\`): Discover our official hardware partnerships with Apple, Dell Technologies, and Lenovo.\n` +
          `4. ⚡ **Tech Architecture** (\`/#features\`): Discover our vapor-chamber thermals, DDR5 6000MHz speeds, and aerospace chassis.\n` +
          `5. 🛡️ **Orbital ProCare** (\`/#support\`): 3-Year Global Priority Replacement Warranty, driver vaults, and 24/7 engineer support.\n` +
          `6. 🛡️ **Admin Command** (\`/admin\`): Central control center for catalog inventory and system metrics.\n\n` +
          `What area would you like to explore first?`,
        actionLinks: [
          { label: "⚔️ Launch Showdown Arena", url: "/compare", isRoute: true },
          { label: "💻 Explore Catalog", url: "/#products" },
          { label: "🛡️ Support & Warranty", url: "/#support" }
        ]
      };
    }

    // 1. Direct Comparison requests ("Compare A vs B" or "Is A better than B")
    const mentionedModels = products.filter(p => {
      const parts = p.name.toLowerCase().split(" ").filter(w => w.length > 2);
      return parts.some(part => q.includes(part));
    });

    if (mentionedModels.length >= 2 || (q.includes("vs") || q.includes("compare") || q.includes("better than")) && mentionedModels.length >= 1) {
      const p1 = mentionedModels[0];
      const p2 = mentionedModels[1] || products.find(p => p.id !== p1.id && (p.category === p1.category || p.price > 300000)) || products[1];

      return {
        reply: `⚔️ **Showdown Comparison: ${p1.name} vs ${p2.name}**\n\n` +
          `✨ **1. ${p1.name}** (Rs ${p1.price.toLocaleString()})\n` +
          `• **Processor**: ${p1.cpu} (${p1.processor})\n` +
          `• **Graphics**: ${p1.gpu}\n` +
          `• **RAM & Storage**: ${p1.ram}\n` +
          `• **Display**: ${p1.display || 'Pro High-Refresh Panel'}\n` +
          `• **Benchmark**: **${p1.detailedSpecs?.benchmarkScore || '9,400'} pts**\n\n` +
          `✨ **2. ${p2.name}** (Rs ${p2.price.toLocaleString()})\n` +
          `• **Processor**: ${p2.cpu} (${p2.processor})\n` +
          `• **Graphics**: ${p2.gpu}\n` +
          `• **RAM & Storage**: ${p2.ram}\n` +
          `• **Display**: ${p2.display || 'Pro High-Refresh Panel'}\n` +
          `• **Benchmark**: **${p2.detailedSpecs?.benchmarkScore || '9,500'} pts**\n\n` +
          `🎯 **Recommendation**: Pick **${p1.name}** if you want *${p1.badge}*, or choose **${p2.name}** for *${p2.specialHighlight || 'maximum workstation throughput'}*!`,
        matchedProducts: [p1, p2],
        actionLinks: [
          { label: "⚔️ Open 3-Way Showdown Arena", url: "/compare", isRoute: true }
        ]
      };
    }

    // 2. Specific Laptop Details (Single model match)
    if (mentionedModels.length === 1) {
      const p = mentionedModels[0];
      return {
        reply: `🔍 **Official Technical Specifications for ${p.name}**:\n\n` +
          `• **Badge / Class**: ${p.badge} (${p.category})\n` +
          `• **Processor**: ${p.cpu} (${p.processor})\n` +
          `• **GPU**: ${p.gpu}\n` +
          `• **RAM**: ${p.ram} Ultra-Low Latency\n` +
          `• **Display**: ${p.display || 'Factory Color-Calibrated Panel'}\n` +
          `• **Battery & Weight**: ${p.batteryWeight || 'High-capacity flight battery'}\n` +
          `• **Cooling & Chassis**: ${p.detailedSpecs?.cooling || 'Liquid Vapor Chamber'} | ${p.detailedSpecs?.chassis || 'CNC Machined Aluminum'}\n` +
          `• **Benchmark Score**: **${p.detailedSpecs?.benchmarkScore || '9,500+'} pts**\n` +
          `• **Price**: **Rs ${p.price.toLocaleString()}** (${p.priceUsd || ''})\n\n` +
          `✨ *Special Feature*: ${p.specialHighlight || 'Zero thermal throttling under sustained heavy loads.'}`,
        matchedProducts: [p],
        actionLinks: [
          { label: `View ${p.name}`, url: `/product/${p.id}`, isRoute: true },
          { label: "⚔️ Compare in Showdown", url: "/compare", isRoute: true }
        ]
      };
    }

    // 3. Help Choose / Recommendation Wizard
    if (q.includes("help me choose") || q.includes("recommend") || q.includes("which should i buy") || q.includes("suggest") || q.includes("guide")) {
      return {
        reply: `🎯 **I would love to help you find the perfect machine!**\n\n` +
          `To give you the exact best recommendation, tell me:\n` +
          `1. 🎮 **Primary Use**: Gaming, 3D/Blender, 4K Video Editing, Software Development, or General Work?\n` +
          `2. 💰 **Budget Range**: e.g., Under Rs 250,000, Rs 350,000, or Flagship (Rs 450,000+)?\n` +
          `3. ✈️ **Portability**: Do you prefer an ultra-thin laptop (like MacBook Pro / Zephyrus) or a desktop-replacement titan (MSI Titan / Razer Blade 18)?\n\n` +
          `Here are 3 top picks across different workflows:`,
        matchedProducts: [products[0], products[1], products[2]],
        actionLinks: [
          { label: "⚔️ Compare Top 3 in Arena", url: "/compare", isRoute: true },
          { label: "💻 View Full Catalog", url: "/#products" }
        ]
      };
    }

    // 4. Asking about specific GPUs
    if (q.includes("4090") || q.includes("4080") || q.includes("4070") || q.includes("ada") || q.includes("rtx")) {
      const targetGpu = q.includes("4090") ? "4090" : q.includes("4080") ? "4080" : q.includes("4070") ? "4070" : q.includes("ada") ? "Ada" : "RTX";
      const gpuMatches = products.filter(p => p.gpu.toLowerCase().includes(targetGpu.toLowerCase()));
      if (gpuMatches.length > 0) {
        return {
          reply: `⚡ **Laptops powered by ${targetGpu.toUpperCase()} Graphics**:\n\n` +
            gpuMatches.map(p => `• **${p.name}** — **Rs ${p.price.toLocaleString()}**\n   GPU: ${p.gpu} | CPU: ${p.cpu} | RAM: ${p.ram}`).join("\n\n") +
            `\n\nEvery GPU is paired with unlocked power limits and liquid vapor chambers for zero thermal throttling!`,
          matchedProducts: gpuMatches.slice(0, 3),
          actionLinks: [{ label: "⚔️ Compare in Showdown", url: "/compare", isRoute: true }]
        };
      }
    }

    // 5. Asking about RAM capacity
    if (q.includes("128gb") || q.includes("64gb") || q.includes("32gb") || q.includes("ram")) {
      const ramTarget = q.includes("128gb") ? "128GB" : q.includes("64gb") ? "64GB" : q.includes("32gb") ? "32GB" : "";
      const ramMatches = ramTarget ? products.filter(p => p.ram.toLowerCase().includes(ramTarget.toLowerCase())) : products.filter(p => p.ram.includes("64GB") || p.ram.includes("128GB"));
      if (ramMatches.length > 0) {
        return {
          reply: `🧠 **Laptops with ${ramTarget || 'High-Capacity'} DDR5 RAM**:\n\n` +
            ramMatches.map(p => `• **${p.name}** — **${p.ram}** (Rs ${p.price.toLocaleString()})\n   CPU: ${p.cpu} | GPU: ${p.gpu}`).join("\n\n") +
            `\n\nIdeal for huge 3D CAD scenes, virtualization, and complex 8K multitrack workflows.`,
          matchedProducts: ramMatches.slice(0, 3),
          actionLinks: [{ label: "Explore Workstations", url: "/#workstation" }]
        };
      }
    }

    // 6. Asking for Budget / Price limits
    const priceMatch = q.match(/(under|below|less than|around|within|budget of|max)?\s*(?:rs\.?|lkr)?\s*(\d+[\d,]*)(k|000)?/i);
    if (priceMatch || q.includes("cheap") || q.includes("lowest price") || q.includes("affordable") || q.includes("budget")) {
      let limit = 600000;
      if (priceMatch) {
        let val = parseInt(priceMatch[2].replace(/,/g, ''), 10);
        if (priceMatch[3]?.toLowerCase() === 'k') val *= 1000;
        if (val > 10000) limit = val;
      }
      
      const affordable = [...products].filter(p => p.price <= limit).sort((a, b) => a.price - b.price).slice(0, 3);
      if (affordable.length > 0) {
        return {
          reply: `💰 **Best High-Performance Laptops ${limit < 600000 ? `under Rs ${limit.toLocaleString()}` : 'by Value'}**:\n\n` +
            affordable.map((p, idx) => `${idx + 1}. **${p.name}** — **Rs ${p.price.toLocaleString()}**\n   • Processor: ${p.cpu}\n   • GPU: ${p.gpu}\n   • RAM: ${p.ram}`).join("\n\n") +
            `\n\n💡 *Tip: Pay via Direct Bank Transfer during checkout to save an instant 5%!*`,
          matchedProducts: affordable,
          actionLinks: [{ label: "💻 View All in Catalog", url: "/#products" }]
        };
      }
    }

    // 7. Best for Gaming
    if (q.includes("gaming") || q.includes("game") || q.includes("fps") || q.includes("cyberpunk") || q.includes("steam") || q.includes("esports")) {
      const topGaming = products.filter(p => p.category === "Gaming" || p.gpu.includes("4090") || p.gpu.includes("4080")).slice(0, 3);
      return {
        reply: `🎮 **Top Flagship Gaming Weapons on Sellora**:\n\n` +
          `1. 🏆 **MSI Titan 18 HX** (Rs 499,900) — Core i9 14900HX, RTX 4090 (16GB), 128GB RAM, 4K Mini-LED 120Hz display.\n` +
          `2. ⚡ **Razer Blade 18** (Rs 399,900) — Core i9 14900HX, RTX 4090, 64GB RAM, 300Hz QHD+ Mini-LED.\n` +
          `3. 🔥 **Asus ROG Strix SCAR 16** (Rs 319,900) — Core i9 14900HX, RTX 4080, 32GB RAM, 240Hz Nebula HDR.\n\n` +
          `All feature ultra-responsive keyboards, high-refresh panels, and zero thermal throttling!`,
        matchedProducts: topGaming,
        actionLinks: [{ label: "⚔️ Compare Gaming Rigs", url: "/compare", isRoute: true }]
      };
    }

    // 8. Best for 3D Rendering, Blender, CAD
    if (q.includes("3d") || q.includes("blender") || q.includes("render") || q.includes("cad") || q.includes("solidworks") || q.includes("maya") || q.includes("unreal")) {
      const top3D = products.filter(p => p.category === "Workstation" || p.ram.includes("128GB") || p.ram.includes("64GB")).slice(0, 3);
      return {
        reply: `🚀 **Top Workstations for 3D Modeling, Blender & Unreal Engine**:\n\n` +
          `• 🛡️ **Lenovo ThinkPad P16** (Rs 459,900): 128GB ECC DDR5 RAM, NVIDIA RTX 5000 Ada (16GB VRAM), ISV certified for Blender, Maya, AutoCAD & Unreal Engine.\n` +
          `• ⚡ **HP ZBook Fury 16** (Rs 389,900): Core i9 13950HX, 64GB DDR5, RTX 4000 Ada (12GB), 100% DCI-P3 DreamColor display.\n` +
          `• 👑 **MSI Titan 18 HX** (Rs 499,900): 128GB DDR5, RTX 4090 (16GB), 18-inch 4K Mini-LED workspace.`,
        matchedProducts: top3D,
        actionLinks: [{ label: "Explore Workstations", url: "/#workstation" }]
      };
    }

    // 9. Best for Video Editing
    if (q.includes("video") || q.includes("editing") || q.includes("premiere") || q.includes("davinci") || q.includes("after effects") || q.includes("youtube") || q.includes("creator")) {
      const topVideo = products.filter(p => p.category === "Ultrabook" || p.processor === "Apple M Max" || p.badgeColor === "purple").slice(0, 3);
      return {
        reply: `🎬 **Best Creator Laptops for 4K/8K Video Editing (Premiere Pro & DaVinci Resolve)**:\n\n` +
          `• 🍏 **MacBook Pro 16 (M3 Max)** (Rs 349,900): Dedicated ProRes encode/decode engines, Liquid Retina XDR (1,600 nits peak), 48GB unified memory (400GB/s bandwidth).\n` +
          `• 💎 **Dell XPS 14** (Rs 199,900): Core Ultra 9 185H, 3.2K OLED 120Hz display (100% DCI-P3 calibrated unibody).\n` +
          `• ⚡ **Razer Blade 18** (Rs 399,900): 18-inch Mini-LED 300Hz display with RTX 4090 VRAM for smooth multi-cam 8K RAW scrubbing.`,
        matchedProducts: topVideo,
        actionLinks: [{ label: "Creator Ecosystem", url: "/#creator" }]
      };
    }

    // 10. Best Battery Life / Portability
    if (q.includes("battery") || q.includes("weight") || q.includes("portable") || q.includes("travel") || q.includes("lightweight")) {
      const batteryKings = products.filter(p => p.category === "Ultrabook" || p.batteryWeight?.includes("100Wh")).slice(0, 3);
      return {
        reply: `🔋 **Battery Life & Portability Champions**:\n\n` +
          `1. 🥇 **MacBook Pro 16 (M3 Max)**: Up to **22 hours battery life** (100Wh flight-maximum capacity) with 100% full performance even on battery!\n` +
          `2. 🥈 **Dell XPS 14**: 1.68 kg ultra-thin CNC aluminum unibody with 69.5Wh battery and fast Type-C PD charging.\n` +
          `3. 🥉 **Asus ROG Zephyrus G14**: Only 1.50 kg with a 73Wh battery and gorgeous OLED panel.`,
        matchedProducts: batteryKings,
        actionLinks: [{ label: "⚔️ Compare Portability", url: "/compare", isRoute: true }]
      };
    }

    // 11. Warranty, Shipping, Payment, Return
    if (q.includes("warranty") || q.includes("guarantee") || q.includes("replace") || q.includes("broken") || q.includes("repair")) {
      return {
        reply: `🛡️ **Sellora 3-Year Global Priority Replacement Warranty**:\n\n` +
          `• Every single laptop sold comes with **3 full years of global priority replacement coverage**.\n` +
          `• If any hardware fault occurs, our certified engineering team replaces the unit within **24–48 hours** with zero downtime!\n` +
          `• Includes free thermal paste servicing and full coverage for CPU, GPU, Display, and Motherboard.`,
        actionLinks: [{ label: "Orbital ProCare Support", url: "/#support" }]
      };
    }

    if (q.includes("shipping") || q.includes("delivery") || q.includes("ship") || q.includes("courier") || q.includes("how long")) {
      return {
        reply: `📦 **Shipping & Delivery Timelines**:\n\n` +
          `• 🚚 **Domestic Express Delivery**: 24 – 48 Hours with live GPS tracking straight to your doorstep.\n` +
          `• ✈️ **Global Priority Shipping**: 3 – 5 Business Days worldwide.\n` +
          `• 🛡️ **Vacuum Flight Cases**: All rigs are shipped in shock-absorbing, anti-static flight cases for 100% safe transit.`,
        actionLinks: [{ label: "Support Center", url: "/#support" }]
      };
    }

    if (q.includes("discount") || q.includes("payment") || q.includes("installment") || q.includes("emi") || q.includes("bank") || q.includes("card")) {
      return {
        reply: `💳 **Payment Options & Exclusive Discounts**:\n\n` +
          `• 🏦 **Direct Bank Transfer**: Automatic **5% Instant Discount** applied at checkout!\n` +
          `• 💳 **Credit & Debit Cards**: Visa, MasterCard, and American Express with 3D Secure.\n` +
          `• 📅 **0% Interest Installments**: Flexible monthly plans up to 24 months.\n` +
          `• 🎓 **Student & Corporate Discounts**: Reach out via WhatsApp for verified educational and enterprise quotations!`,
        showContact: true,
        actionLinks: [{ label: "🛒 Go to Checkout", url: "/checkout", isRoute: true }]
      };
    }

    if (q.includes("return") || q.includes("refund") || q.includes("exchange") || q.includes("policy")) {
      return {
        reply: `🔄 **14-Day Test Drive & Return Policy**:\n\n` +
          `• You have **14 full days** from delivery to test your machine under your real workflow.\n` +
          `• If you are not 100% satisfied, return it for an exchange or full refund with **zero restocking fee**.\n` +
          `• Units must be in original condition with all accessories and flight packaging.`,
        actionLinks: [{ label: "Support Portal", url: "/#support" }]
      };
    }

    if (q.includes("whatsapp") || q.includes("phone") || q.includes("call") || q.includes("contact") || q.includes("human") || q.includes("agent") || q.includes("support")) {
      return {
        reply: `📞 **Sellora Direct Concierge Channels**:\n\nConnect with our senior hardware engineers directly for custom inquiries, order updates, or consultations:`,
        showContact: true,
        actionLinks: [{ label: "Support Section", url: "/#support" }]
      };
    }

    // 12. Benchmark Scores
    if (q.includes("fastest") || q.includes("benchmark") || q.includes("most powerful") || q.includes("top performance") || q.includes("score")) {
      const topScorer = [...products].sort((a, b) => (b.detailedSpecs?.benchmarkScore || 0) - (a.detailedSpecs?.benchmarkScore || 0)).slice(0, 3);
      return {
        reply: `🏆 **Top Benchmarking Powerhouses on Sellora**:\n\n` +
          `1. 🥇 **MSI Titan 18 HX** — **9,850 pts** (Core i9 14900HX, RTX 4090, 128GB RAM)\n` +
          `2. 🥈 **MacBook Pro 16 (M3 Max)** — **9,800 pts** (16-Core CPU, 40-Core GPU, 48GB Unified RAM)\n` +
          `3. 🥉 **Razer Blade 18** — **9,750 pts** (Core i9 14900HX, RTX 4090 16GB, 64GB RAM)`,
        matchedProducts: topScorer,
        actionLinks: [{ label: "⚔️ Launch Showdown Arena", url: "/compare", isRoute: true }]
      };
    }

    // 13. Friendly Greetings
    if (q === "hi" || q === "hello" || q === "hey" || q.startsWith("hi ") || q.startsWith("hello ") || q.startsWith("hey ")) {
      return {
        reply: `👋 **Hello there! Welcome to Sellora!** ✨\n\nHow can I help you today? Here are a few things you can ask me:\n• *"Which laptop has the highest benchmark score?"*\n• *"Compare Razer Blade 18 vs MacBook Pro 16"*\n• *"What is the best laptop for Blender 3D?"*\n• *"Show laptops under Rs 350,000"*\n• *"Explain the 3-Year Warranty policy"*`
      };
    }

    // 14. Dynamic Fallback
    return {
      reply: `💡 **Here is what I found regarding "${query}"**:\n\n` +
        `Our store features enterprise workstations and enthusiast gaming laptops equipped with up to 128GB DDR5 RAM, NVIDIA RTX 4090 & Ada GPUs, and 300Hz displays.\n\n` +
        `Would you like to explore by **workload** (Gaming / 3D / Video / Coding), **budget**, or compare specific models in the Showdown Arena?`,
      matchedProducts: products.slice(0, 2),
      actionLinks: [
        { label: "💻 View All Laptops", url: "/#products" },
        { label: "⚔️ Showdown Arena", url: "/compare", isRoute: true }
      ]
    };
  };

  const handleSend = async (textToSend?: string) => {
    const query = (textToSend || input).trim();
    if (!query || isTyping) return;

    const userMsg: Message = {
      id: `user-${Date.now()}`,
      sender: "user",
      text: query,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMsg]);
    setInput("");
    setIsTyping(true);

    try {
      if (geminiApiKey.trim()) {
        const aiResponseText = await callGeminiApi(query, messages);
        const mentionedProducts = products.filter(p => aiResponseText.toLowerCase().includes(p.name.toLowerCase())).slice(0, 2);

        const botMsg: Message = {
          id: `bot-${Date.now()}`,
          sender: "bot",
          text: aiResponseText,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          suggestedProducts: mentionedProducts.length ? mentionedProducts : undefined,
          actionLinks: [
            { label: "💻 View Catalog", url: "/#products" },
            { label: "⚔️ Showdown Arena", url: "/compare", isRoute: true }
          ]
        };
        setMessages(prev => [...prev, botMsg]);
      } else {
        await new Promise(r => setTimeout(r, 350));
        const result = processAccurateAnswer(query);

        const botMsg: Message = {
          id: `bot-${Date.now()}`,
          sender: "bot",
          text: result.reply,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          suggestedProducts: result.matchedProducts,
          actionLinks: result.actionLinks,
          showContactOptions: result.showContact
        };
        setMessages(prev => [...prev, botMsg]);
      }
    } catch (err: any) {
      console.warn("API fallback to local engine:", err);
      const fallback = processAccurateAnswer(query);
      const botMsg: Message = {
        id: `bot-${Date.now()}`,
        sender: "bot",
        text: fallback.reply,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        suggestedProducts: fallback.matchedProducts,
        actionLinks: fallback.actionLinks,
        showContactOptions: fallback.showContact
      };
      setMessages(prev => [...prev, botMsg]);
    } finally {
      setIsTyping(false);
    }
  };

  const resetChat = () => {
    setMessages([
      {
        id: "welcome-reset",
        sender: "bot",
        text: "⚡ **Sellora AI Hub Reset** ✨\n\nI'm ready for your next question! Ask me about laptop specs, 3-way comparisons, budget recommendations, or website features.",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        actionLinks: [
          { label: "🗺️ Website Tour", url: "#tour", isRoute: false },
          { label: "⚔️ Showdown Arena", url: "/compare", isRoute: true }
        ]
      }
    ]);
  };

  return (
    <>
      {/* Floating Trigger Button (Icon-only) */}
      {!isOpen && (
        <div className="fixed bottom-6 right-6 z-50 animate-fade-up">
          <button
            onClick={() => { setIsOpen(true); setIsMinimized(false); }}
            className="group relative flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-tr from-neon-cyan via-neon-blue to-neon-purple p-0.5 shadow-neon-cyan transition-all duration-300 hover:scale-110 active:scale-95"
            aria-label="Open Sellora AI Chatbot"
            title="Open Sellora AI Chat"
          >
            <div className="relative flex h-full w-full items-center justify-center rounded-full bg-[#0B0F19] text-neon-cyan transition-colors group-hover:bg-black">
              <Bot className="h-6 w-6 transition-transform duration-300 group-hover:scale-110" />
              <span className="absolute top-2 right-2 h-2.5 w-2.5 rounded-full bg-neon-cyan shadow-neon-cyan animate-ping" />
              <span className="absolute top-2 right-2 h-2.5 w-2.5 rounded-full bg-neon-cyan border-2 border-[#0B0F19]" />
            </div>
          </button>
        </div>
      )}

      {/* Main Chat Window (Compact Size) */}
      {isOpen && (
        <div 
          className={`fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-50 flex flex-col rounded-2xl border border-glass-border bg-[#0B0F19]/95 backdrop-blur-2xl shadow-[0_0_40px_oklch(0_0_0/0.85)] transition-all duration-300 ${
            isMinimized 
              ? "h-14 w-72 sm:w-80 overflow-hidden" 
              : "h-[500px] sm:h-[530px] max-h-[84vh] w-[calc(100vw-32px)] sm:w-[370px] md:w-[390px]"
          }`}
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-glass-border bg-black/50 px-4 py-3 backdrop-blur-md shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="relative flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-neon-cyan/20 to-neon-purple/20 border border-neon-cyan/50 text-neon-cyan shadow-[0_0_15px_oklch(0.78_0.18_200/0.25)]">
                <Bot className="h-4 w-4" />
                <span className="absolute bottom-0 right-0 h-2 w-2 rounded-full bg-neon-cyan border-2 border-background" />
              </div>
              
              <div>
                <div className="flex items-center gap-1.5">
                  <h3 className="font-display text-xs font-black tracking-wide text-foreground">
                    SELLORA AI
                  </h3>
                  <span className="rounded-full px-1.5 py-0.2 text-[8px] font-mono font-bold bg-neon-cyan/15 text-neon-cyan border border-neon-cyan/30">
                    ONLINE
                  </span>
                </div>
                <p className="text-[10px] text-muted-foreground">
                  Hardware &amp; Site Guide
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={() => {
                  setShowSettings(!showSettings);
                  setTestResult(null);
                }}
                className={`rounded-lg p-1.5 transition-colors ${
                  showSettings ? "bg-neon-cyan/20 text-neon-cyan" : "text-muted-foreground hover:bg-white/10 hover:text-foreground"
                }`}
                title="AI Settings"
              >
                <Settings className="h-3.5 w-3.5" />
              </button>
              <button
                onClick={resetChat}
                className="rounded-lg p-1.5 text-muted-foreground hover:bg-white/10 hover:text-foreground transition-colors"
                title="Reset Conversation"
              >
                <RotateCcw className="h-3.5 w-3.5" />
              </button>
              <button
                onClick={() => setIsMinimized(!isMinimized)}
                className="rounded-lg p-1.5 text-muted-foreground hover:bg-white/10 hover:text-foreground transition-colors"
                title={isMinimized ? "Expand" : "Minimize"}
              >
                <Minimize2 className="h-3.5 w-3.5" />
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="rounded-lg p-1.5 text-muted-foreground hover:bg-white/10 hover:text-red-400 transition-colors"
                title="Close"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>

          {/* Settings Modal */}
          {showSettings && !isMinimized && (
            <div className="flex-1 p-4 overflow-y-auto space-y-3.5 text-xs animate-fade-up">
              <div className="flex items-center gap-2 border-b border-glass-border pb-2.5">
                <Key className="h-3.5 w-3.5 text-neon-cyan" />
                <h4 className="font-display text-xs font-bold text-foreground">API Settings</h4>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="font-mono text-[10px] font-bold text-neon-cyan">
                    API KEY
                  </label>
                  <a
                    href="https://aistudio.google.com/app/apikey"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[9px] text-neon-cyan hover:underline flex items-center gap-1 font-mono"
                  >
                    Get Key <ExternalLink className="h-2.5 w-2.5" />
                  </a>
                </div>
                <input
                  type="password"
                  value={tempApiKey}
                  onChange={(e) => {
                    setTempApiKey(e.target.value);
                    setTestResult(null);
                  }}
                  placeholder="Paste API Key here..."
                  className="w-full rounded-xl border border-glass-border bg-white/5 px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground/40 focus:border-neon-cyan focus:outline-none"
                />

                {/* Test Connection Button */}
                <div className="pt-0.5">
                  <button
                    type="button"
                    onClick={handleTestKey}
                    disabled={testingKey || !tempApiKey.trim()}
                    className="w-full inline-flex items-center justify-center gap-1.5 rounded-xl bg-white/10 hover:bg-white/15 border border-white/20 px-3 py-1.5 text-xs font-bold text-foreground transition-all disabled:opacity-40"
                  >
                    {testingKey ? (
                      <>
                        <Loader2 className="h-3 w-3 animate-spin text-neon-cyan" />
                        <span>Verifying...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="h-3 w-3 text-neon-cyan" />
                        <span>Test Connection</span>
                      </>
                    )}
                  </button>
                </div>

                {/* Test Result Message */}
                {testResult && (
                  <div className={`p-2.5 rounded-xl border text-[10px] leading-relaxed flex items-start gap-1.5 ${
                    testResult.success 
                      ? "bg-emerald-950/40 border-emerald-500/40 text-emerald-300" 
                      : "bg-red-950/40 border-red-500/40 text-red-300"
                  }`}>
                    {testResult.success ? <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 shrink-0 mt-0.5" /> : <AlertCircle className="h-3.5 w-3.5 text-red-400 shrink-0 mt-0.5" />}
                    <span>{testResult.message}</span>
                  </div>
                )}
              </div>

              <div className="flex gap-2 pt-2 border-t border-glass-border">
                <button
                  onClick={() => saveApiKey(tempApiKey)}
                  className="flex-1 rounded-xl bg-neon-cyan text-black font-bold py-2 hover:opacity-90 transition-all text-xs"
                >
                  Save
                </button>
                {geminiApiKey && (
                  <button
                    onClick={() => {
                      setTempApiKey("");
                      saveApiKey("");
                    }}
                    className="rounded-xl border border-red-500/40 bg-red-500/10 text-red-400 px-3 py-2 hover:bg-red-500 hover:text-white transition-all text-xs font-bold"
                  >
                    Clear
                  </button>
                )}
                <button
                  onClick={() => setShowSettings(false)}
                  className="rounded-xl border border-glass-border bg-white/5 text-muted-foreground px-3 py-2 hover:bg-white/10 hover:text-foreground transition-all text-xs"
                >
                  Close
                </button>
              </div>
            </div>
          )}

          {!isMinimized && !showSettings && (
            <>
              {/* Message List */}
              <div className="flex-1 overflow-y-auto p-3.5 sm:p-4 space-y-3 text-xs sm:text-sm selection:bg-neon-cyan/30">
                {messages.map((m) => {
                  const isUser = m.sender === "user";

                  return (
                    <div
                      key={m.id}
                      className={`flex gap-2 ${isUser ? "justify-end" : "justify-start"} animate-fade-up`}
                    >
                      {!isUser && (
                        <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-neon-cyan/10 border border-neon-cyan/40 text-neon-cyan mt-0.5">
                          <Bot className="h-3.5 w-3.5" />
                        </div>
                      )}

                      <div className={`flex flex-col max-w-[88%] ${isUser ? "items-end" : "items-start"}`}>
                        <div
                          className={`rounded-2xl px-3.5 py-2.5 leading-relaxed ${
                            isUser
                              ? "bg-gradient-to-r from-neon-cyan via-neon-blue to-neon-purple text-black font-medium rounded-tr-sm shadow-neon-cyan"
                              : "bg-white/[0.06] border border-glass-border text-foreground/90 backdrop-blur-md rounded-tl-sm shadow-md"
                          }`}
                        >
                          <div className="whitespace-pre-wrap">
                            {m.text.split("\n").map((line, idx) => (
                              <p key={idx} className={idx > 0 ? "mt-1.5" : ""}>
                                {line.split(/(\*\*.*?\*\*)/).map((part, pIdx) => {
                                  if (part.startsWith("**") && part.endsWith("**")) {
                                    return (
                                      <strong key={pIdx} className={isUser ? "font-black" : "font-bold text-neon-cyan"}>
                                        {part.slice(2, -2)}
                                      </strong>
                                    );
                                  }
                                  return part;
                                })}
                              </p>
                            ))}
                          </div>

                          {/* Direct Contact Options */}
                          {m.showContactOptions && (
                            <div className="mt-3.5 space-y-2 border-t border-white/10 pt-3">
                              <p className="text-[11px] font-bold text-foreground">Direct Support Channels:</p>
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                <a
                                  href={`https://wa.me/94771234567?text=${encodeURIComponent("Hi Sellora Team, I'm on your website and would like assistance choosing a laptop.")}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="flex items-center justify-center gap-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-2 px-3 text-xs shadow-md transition-all hover:scale-[1.02]"
                                >
                                  <MessageSquare className="h-3.5 w-3.5" />
                                  <span>Chat on WhatsApp</span>
                                  <ExternalLink className="h-3 w-3 ml-auto opacity-70" />
                                </a>

                                <a
                                  href="tel:+94112345678"
                                  className="flex items-center justify-center gap-1.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-foreground font-bold py-2 px-3 text-xs transition-all hover:scale-[1.02]"
                                >
                                  <Phone className="h-3.5 w-3.5 text-neon-cyan" />
                                  <span>Direct Call</span>
                                </a>
                              </div>
                            </div>
                          )}

                          {/* Embedded Product Cards inside Messages */}
                          {m.suggestedProducts && m.suggestedProducts.length > 0 && (
                            <div className="mt-3 space-y-2 w-full">
                              {m.suggestedProducts.map((prod) => (
                                <div
                                  key={prod.id}
                                  className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5 rounded-xl bg-black/70 border border-glass-border p-2 transition-all hover:border-neon-cyan/50"
                                >
                                  <div className="flex items-center gap-2 min-w-0">
                                    <img
                                      src={prod.img}
                                      alt={prod.name}
                                      className="h-10 w-10 rounded-lg bg-black object-cover shrink-0 border border-white/10"
                                    />
                                    <div className="min-w-0 flex flex-col">
                                      <span className="font-display text-xs font-bold text-white truncate">
                                        {prod.name}
                                      </span>
                                      <span className="text-[10px] text-muted-foreground">
                                        {prod.cpu} · {prod.ram}
                                      </span>
                                      <span className="font-display text-xs font-extrabold text-neon-cyan">
                                        Rs {prod.price.toLocaleString()}
                                      </span>
                                    </div>
                                  </div>

                                  <div className="flex items-center gap-1.5 self-end sm:self-center shrink-0">
                                    <button
                                      onClick={() => addToCart(prod)}
                                      className="inline-flex items-center gap-1 rounded-lg bg-neon-cyan/20 border border-neon-cyan/50 px-2 py-1 text-[10px] font-bold text-neon-cyan hover:bg-neon-cyan hover:text-black transition-all"
                                      title="Add to Cart"
                                    >
                                      <ShoppingCart className="h-3 w-3" />
                                      <span>Add</span>
                                    </button>
                                    <Link
                                      to="/product/$productId"
                                      params={{ productId: prod.id }}
                                      onClick={() => setIsOpen(false)}
                                      className="inline-flex items-center gap-1 rounded-lg bg-white/10 border border-white/20 px-2 py-1 text-[10px] font-bold text-foreground hover:bg-white/20 transition-all"
                                    >
                                      <span>View</span>
                                      <ArrowRight className="h-3 w-3" />
                                    </Link>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}

                          {/* Action Links */}
                          {m.actionLinks && m.actionLinks.length > 0 && (
                            <div className="mt-2.5 flex flex-wrap gap-1.5 border-t border-white/10 pt-2">
                              {m.actionLinks.map((action, aIdx) => {
                                if (action.url === "#tour") {
                                  return (
                                    <button
                                      key={aIdx}
                                      onClick={() => handleSend("Take a Website Tour")}
                                      className="inline-flex items-center gap-1 rounded-full bg-neon-purple/20 border border-neon-purple/50 px-2.5 py-0.5 text-[10px] font-mono font-bold text-neon-purple hover:bg-neon-purple hover:text-white transition-all"
                                    >
                                      <Compass className="h-3 w-3" />
                                      <span>{action.label}</span>
                                    </button>
                                  );
                                }

                                return action.isRoute ? (
                                  <Link
                                    key={aIdx}
                                    to={action.url as any}
                                    onClick={() => setIsOpen(false)}
                                    className="inline-flex items-center gap-1 rounded-full bg-neon-cyan/15 border border-neon-cyan/40 px-2.5 py-0.5 text-[10px] font-mono font-bold text-neon-cyan hover:bg-neon-cyan hover:text-black transition-all"
                                  >
                                    <span>{action.label}</span>
                                    <ChevronRight className="h-3 w-3" />
                                  </Link>
                                ) : (
                                  <a
                                    key={aIdx}
                                    href={action.url}
                                    onClick={() => setIsOpen(false)}
                                    className="inline-flex items-center gap-1 rounded-full bg-white/10 border border-white/20 px-2.5 py-0.5 text-[10px] font-mono font-bold text-foreground hover:bg-white/20 transition-all"
                                  >
                                    <span>{action.label}</span>
                                    <ChevronRight className="h-3 w-3" />
                                  </a>
                                );
                              })}
                            </div>
                          )}
                        </div>
                        <span className="mt-0.5 text-[9px] text-muted-foreground/60 px-1 font-mono">{m.timestamp}</span>
                      </div>
                    </div>
                  );
                })}

                {/* Typing Indicator */}
                {isTyping && (
                  <div className="flex gap-2 justify-start animate-fade-up">
                    <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-neon-cyan/10 border border-neon-cyan/40 text-neon-cyan">
                      <Bot className="h-3.5 w-3.5 animate-bounce" />
                    </div>
                    <div className="rounded-2xl rounded-tl-sm bg-white/[0.06] border border-glass-border px-3 py-2 flex items-center gap-1.5 text-muted-foreground">
                      <span className="h-1.5 w-1.5 rounded-full bg-neon-cyan animate-pulse" />
                      <span className="h-1.5 w-1.5 rounded-full bg-neon-cyan animate-pulse [animation-delay:0.2s]" />
                      <span className="h-1.5 w-1.5 rounded-full bg-neon-cyan animate-pulse [animation-delay:0.4s]" />
                      <span className="ml-1 text-xs font-mono text-neon-cyan">
                        Thinking...
                      </span>
                    </div>
                  </div>
                )}
                <div ref={chatEndRef} />
              </div>

              {/* Quick Suggestion Chips */}
              <div className="border-t border-glass-border/60 bg-black/30 px-3 py-2 shrink-0 overflow-x-auto [scrollbar-width:none]">
                <div className="flex gap-1.5 w-max">
                  {SUGGESTION_CHIPS.map((chip, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleSend(chip)}
                      disabled={isTyping}
                      className="rounded-full border border-glass-border bg-white/[0.03] px-2.5 py-1 text-[10px] text-muted-foreground transition-all hover:border-neon-cyan hover:bg-neon-cyan/10 hover:text-neon-cyan shrink-0 font-medium"
                    >
                      {chip}
                    </button>
                  ))}
                </div>
              </div>

              {/* Chat Input Bar */}
              <div className="border-t border-glass-border bg-black/50 p-2.5 sm:p-3 shrink-0">
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleSend();
                  }}
                  className="flex items-center gap-2"
                >
                  <input
                    ref={inputRef}
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Ask a question..."
                    className="flex-1 rounded-xl border border-glass-border bg-white/5 px-3.5 py-2 text-xs text-foreground placeholder:text-muted-foreground/60 focus:border-neon-cyan focus:outline-none focus:ring-1 focus:ring-neon-cyan transition-all"
                  />
                  <button
                    type="submit"
                    disabled={!input.trim() || isTyping}
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-r from-neon-cyan to-neon-purple text-black font-bold shadow-neon-cyan hover:scale-105 transition-all disabled:opacity-40 disabled:hover:scale-100"
                    title="Send message"
                  >
                    <Send className="h-3.5 w-3.5" />
                  </button>
                </form>
              </div>
            </>
          )}
        </div>
      )}
    </>
  );
}
