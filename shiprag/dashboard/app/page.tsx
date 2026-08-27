"use client";

import { Navbar } from "@/components/landing/navbar";
import { Hero } from "@/components/landing/hero";
import { ProductPreview } from "@/components/landing/product-preview";
import { Features } from "@/components/landing/features";
import { HowItWorks } from "@/components/landing/how-it-works";
import { Architecture } from "@/components/landing/architecture";
import { CTA } from "@/components/landing/cta";
import { Footer } from "@/components/landing/footer";


export default function LandingPage() {
  return (
    <main className="min-h-screen bg-[#030712] text-foreground flex flex-col">
      <Navbar />
      <Hero />
      <ProductPreview />
      <Features />
      <HowItWorks />
      <Architecture />
      <CTA />
      <Footer />
    </main>
  );
}
