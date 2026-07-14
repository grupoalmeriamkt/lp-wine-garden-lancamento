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
import SubmitLoader from "@/components/SubmitLoader";
import MotionLayer from "@/components/MotionLayer";
import MobileCtaBar from "@/components/MobileCtaBar";
import { GlassId } from "@/lib/glasses";
import { ScrollTrigger } from "@/lib/gsap";
import { captureUtms, track } from "@/lib/tracking";
import type { CreateVoucherResult } from "@/lib/types";

type PageView = "landing" | "loading" | "voucher";

export default function Page() {
  const [glass, setGlass] = useState<GlassId | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [view, setView] = useState<PageView>("landing");
  const [result, setResult] = useState<CreateVoucherResult | null>(null);

  const choiceRef = useRef<HTMLDivElement | null>(null);
  const formRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    captureUtms();
    track("lp_view");
  }, []);

  useEffect(() => {
    if (showForm) {
      const t = setTimeout(() => ScrollTrigger.refresh(), 120);
      return () => clearTimeout(t);
    }
  }, [showForm]);

  useEffect(() => {
    if (view === "voucher") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, [view]);

  const scrollTo = (el: HTMLElement | null) =>
    el?.scrollIntoView({ behavior: "smooth", block: "start" });

  const goToChoice = useCallback(() => scrollTo(choiceRef.current), []);

  const confirmGlass = useCallback(() => {
    if (!glass) return;
    setShowForm(true);
    requestAnimationFrame(() => setTimeout(() => scrollTo(formRef.current), 60));
  }, [glass]);

  const handleSubmitStart = useCallback(() => {
    setView("loading");
  }, []);

  const handleSuccess = useCallback((data: CreateVoucherResult) => {
    setResult(data);
    setView("voucher");
  }, []);

  const handleError = useCallback(() => {
    setView("landing");
  }, []);

  const handleCloseVoucher = useCallback(() => {
    setResult(null);
    setView("landing");
  }, []);

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
          <LeadForm
            glass={glass}
            onSubmitStart={handleSubmitStart}
            onSuccess={handleSuccess}
            onError={handleError}
          />
        </div>
      )}

      <Sponsors />
      <Rules />
      <Location />
      <Closing onCta={goToChoice} />
      <Footer />

      <MobileCtaBar onCta={goToChoice} hidden={view !== "landing"} />

      {view === "loading" && <SubmitLoader />}

      {view === "voucher" && result && (
        <VoucherCard result={result} onClose={handleCloseVoucher} />
      )}
    </main>
  );
}
