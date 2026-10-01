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
    id: "cmtvp207t0001vee0mh3v72yv",
    name: "rasika",
    role: "gamer",
    rigModel: "MSI",
    category: "Gaming",
    rating: 5,
    message: "ahhhhh stresss aaaahhahah",
    verifiedPurchase: true,
    date: "Just now",
    likes: 0,
  },
];

