export interface FeedbackItem {
  id: string;
  name: string;
  role: string;
  rigModel: string;
  category: "Gaming" | "Ultrabook" | "Workstation" | "General";
  rating: number; // 1 to 5
  message: string;
  verifiedPurchase: boolean;
  date: string;
  likes: number;
}

export const initialFeedbacks: FeedbackItem[] = [
  {
    id: "fb-1",
    name: "Alex Mercer",
    role: "Competitive FPS Athlete",
    rigModel: "Razer Blade 18 · RTX 4090",
    category: "Gaming",
    rating: 5,
    message:
      "The Razer Blade 18 is an absolute colossus. 300Hz Mini LED panel with 400+ stable FPS in CS2 and Apex Legends. The vapor chamber cooling keeps CPU temps below 78°C under full load.",
    verifiedPurchase: true,
    date: "2 days ago",
    likes: 42,
  },
  {
    id: "fb-2",
    name: "Maya Lin",
    role: "Senior Colorist & VFX Lead",
    rigModel: "MacBook Pro 16 · M3 Max",
    category: "Ultrabook",
    rating: 5,
    message:
      "Color grading 8K ProRes RAW footage in DaVinci Resolve without dropping a single frame on location. The Liquid Retina XDR screen matches our Sony broadcast reference monitor with surgical precision.",
    verifiedPurchase: true,
    date: "4 days ago",
    likes: 38,
  },
  {
    id: "fb-3",
    name: "Dr. Vikram Sen",
    role: "Autonomous Systems Researcher",
    rigModel: "Lenovo ThinkPad P16 · RTX 5000 Ada",
    category: "Workstation",
    rating: 5,
    message:
      "Having 128GB ECC DDR5 and 16GB VRAM on the RTX 5000 Ada lets our team fine-tune vision models locally before deploying to the cluster. Unmatched build rigidity and thermal design.",
    verifiedPurchase: true,
    date: "1 week ago",
    likes: 29,
  },
  {
    id: "fb-4",
    name: "Marcus Zhao",
    role: "Independent Unreal Engine 5 Dev",
    rigModel: "Asus ROG Zephyrus G14 · RTX 4070",
    category: "Gaming",
    rating: 5,
    message:
      "A featherweight 1.5kg machine that handles Lumen raytracing in real-time. The OLED 120Hz display is jaw-dropping and the slash lighting on the lid always gets attention at developer meetups.",
    verifiedPurchase: true,
    date: "2 weeks ago",
    likes: 24,
  },
  {
    id: "fb-5",
    name: "Elena Rostova",
    role: "Architectural Visualizer",
    rigModel: "Dell Precision 7680 · RTX 3500 Ada",
    category: "Workstation",
    rating: 5,
    message:
      "The revolutionary CAMM memory is blazing fast for massive Rhino and 3ds Max scenes. Orbital ProCare courier serviced our thermal paste calibration within 24 hours. Stellar experience.",
    verifiedPurchase: true,
    date: "3 weeks ago",
    likes: 19,
  },
];
