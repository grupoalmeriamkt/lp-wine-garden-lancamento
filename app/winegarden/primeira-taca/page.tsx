"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import Header from "@/components/Header";
import Hero from "@/components/Hero";
import Concept from "@/components/Concept";
import GlassChoice from "@/components/GlassChoice";
import HowItWorks from "@/components/HowItWorks";
import LeadForm from "@/components/LeadForm";
import Sponsors from "@/components/Sponsors";
import Rules from "@/components/Rules";
import Location from "@/components/Location";
import Closing from "@/components/Closing";
import Footer from "@/components/Footer";
import VoucherCard from "@/components/VoucherCard";
import MotionLayer from "@/components/MotionLayer";
import MobileCtaBar from "@/components/MobileCtaBar";
import { GlassId } from "@/lib/glasses";
import { ScrollTrigger } from "@/lib/gsap";
import { captureUtms, track } from "@/lib/tracking";
import type { CreateVoucherResult } from "@/lib/types";

export default function Page() {
  const [glass, setGlass] = useState<GlassId | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [result, setResult] = useState<CreateVoucherResult | null>(null);

  const choiceRef = useRef<HTMLDivElement | null>(null);
  const formRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    captureUtms();
    track("lp_view");
  }, []);

  // Recalculate scroll positions when the form is injected into the flow.
  useEffect(() => {
    if (showForm) {
      const t = setTimeout(() => ScrollTrigger.refresh(), 120);
      return () => clearTimeout(t);
    }
  }, [showForm]);

  const scrollTo = (el: HTMLElement | null) =>
    el?.scrollIntoView({ behavior: "smooth", block: "start" });

  const goToChoice = useCallback(() => scrollTo(choiceRef.current), []);

  const confirmGlass = useCallback(() => {
    if (!glass) return;
    setShowForm(true);
    // wait for form to mount before scrolling
    requestAnimationFrame(() => setTimeout(() => scrollTo(formRef.current), 60));
  }, [glass]);

  return (
    <main>
      <MotionLayer />
      <Header />
      <Hero onCta={goToChoice} />
      <Concept />

      <div ref={choiceRef}>
        <GlassChoice selected={glass} onSelect={setGlass} onConfirm={confirmGlass} />
      </div>

      <HowItWorks />

      {showForm && glass && (
        <div ref={formRef}>
          <LeadForm glass={glass} onSuccess={setResult} />
        </div>
      )}

      <Sponsors />
      <Rules />
      <Location />
      <Closing onCta={goToChoice} />
      <Footer />

      <MobileCtaBar onCta={goToChoice} />

      {result && (
        <VoucherCard result={result} onClose={() => setResult(null)} />
      )}
    </main>
  );
}
