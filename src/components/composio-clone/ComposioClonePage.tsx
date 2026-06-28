"use client";

import { useEffect, useState } from "react";
import { AntiFraudSection } from "./AntiFraudSection";
import { BranchRiskMapSection } from "./BranchRiskMapSection";
import { FinalCTA } from "./FinalCTA";
import { Footer } from "./Footer";
import { Hero } from "./Hero";
import { HowItWorks } from "./HowItWorks";
import { IikoIntegration } from "./IikoIntegration";
import { Navbar } from "./Navbar";
import { WhyComposioSection } from "./WhyComposioSection";

export function ComposioClonePage() {
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setIsScrolled(window.scrollY > 80);
    const onPointerMove = (event: PointerEvent) => {
      document.documentElement.style.setProperty("--cursor-x", `${event.clientX}px`);
      document.documentElement.style.setProperty("--cursor-y", `${event.clientY}px`);
    };

    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("pointermove", onPointerMove, { passive: true });

    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("pointermove", onPointerMove);
    };
  }, []);

  return (
    <>
      <Navbar isScrolled={isScrolled} />
      <main className="composio-page">
        <Hero />
        <WhyComposioSection />
        <HowItWorks />
        <AntiFraudSection />
        <BranchRiskMapSection />
        <IikoIntegration />
        <FinalCTA />
        <Footer />
      </main>
    </>
  );
}
