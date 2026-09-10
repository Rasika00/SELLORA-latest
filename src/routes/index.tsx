import { createFileRoute } from "@tanstack/react-router";
import { Navbar } from "@/components/site/Navbar";
import { Hero } from "@/components/site/Hero";
import { Features } from "@/components/site/Features";
import { CreatorBuilder } from "@/components/site/CreatorBuilder";
import { ProductGrid } from "@/components/site/ProductGrid";
import { Support } from "@/components/site/Support";
import { FeedbackSection } from "@/components/site/FeedbackSection";
import { Footer } from "@/components/site/Footer";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "SELLORA  Next Gen Computing. Unleashed." },
      { name: "description", content: "Premium high performance laptops for Gaming, Creator, and Workstation. Engineered for the future." },
      { property: "og:title", content: "SELLORA  Next Gen Computing. Unleashed." },
      { property: "og:description", content: "Premium high performance laptops for Gaming, Creator, and Workstation." },
    ],
  }),
  component: Index,
});

function Index() {
  return (
    <main className="relative min-h-screen overflow-x-hidden bg-background text-foreground">
      <Navbar />
      <Hero />
      <CreatorBuilder />
      <ProductGrid />
      <Features />
      <Support />
      <FeedbackSection />
      <Footer />
    </main>
  );
}
