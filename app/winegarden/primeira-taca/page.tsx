"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import Header from "@/components/Header";
import Hero from "@/components/Hero";
import Concept from "@/components/Concept";
import GlassChoice from "@/components/GlassChoice";
import HowItWorks from "@/components/HowItWorks";
import LeadForm from "@/components/LeadForm";
import Sponsors from "@/components/Sponsors";
import Location from "@/components/Location";
import Closing from "@/components/Closing";
import Footer from "@/components/Footer";
import VoucherCard from "@/components/VoucherCard";
import SubmitLoader from "@/components/SubmitLoader";
import SubmitError from "@/components/SubmitError";
import MotionLayer from "@/components/MotionLayer";
import MobileCtaBar from "@/components/MobileCtaBar";
import { GlassId } from "@/lib/glasses";
import { ScrollTrigger } from "@/lib/gsap";
import { captureUtms, track } from "@/lib/tracking";
import type { CreateVoucherResult } from "@/lib/types";

type PageView = "landing" | "loading" | "voucher" | "error";

export default function Page() {
  const [glass, setGlass] = useState<GlassId | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [view, setView] = useState<PageView>("landing");
  const [result, setResult] = useState<CreateVoucherResult | null>(null);
  const [submitError, setSubmitError] = useState("");

  const choiceRef = useRef<HTMLDivElement | null>(null);
  const formRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    captureUtms();
    track("lp_view");
  }, []);

  useEffect(() => {
    if (!showForm) return;
    const t = window.setTimeout(() => {
      scrollTo(formRef.current ?? document.getElementById("cadastro"));
      ScrollTrigger.refresh();
    }, 120);
    return () => window.clearTimeout(t);
  }, [showForm]);

  useEffect(() => {
    if (view === "voucher") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, [view]);

  useEffect(() => {
    const lock = view === "loading" || view === "voucher" || view === "error";
    if (lock) {
      document.body.classList.add("overlay-open");
      document.body.style.overflow = "hidden";
      return;
    }
    document.body.classList.remove("overlay-open");
    document.body.style.overflow = "";
  }, [view]);

  const scrollTo = (el: HTMLElement | null) =>
    el?.scrollIntoView({ behavior: "smooth", block: "start" });

  const goToChoice = useCallback(() => scrollTo(choiceRef.current), []);

  const confirmGlass = useCallback((id: GlassId) => {
    setGlass(id);
    if (showForm) {
      scrollTo(formRef.current ?? document.getElementById("cadastro"));
      return;
    }
    setShowForm(true);
  }, [showForm]);

  const handleSubmitStart = useCallback(() => {
    setSubmitError("");
    setView("loading");
  }, []);

  const handleSuccess = useCallback((data: CreateVoucherResult) => {
    setResult(data);
    setView("voucher");
  }, []);

  const handleError = useCallback((message: string) => {
    setSubmitError(message);
    setView("error");
  }, []);

  const handleRetrySubmit = useCallback(() => {
    setSubmitError("");
    setView("landing");
    requestAnimationFrame(() => scrollTo(formRef.current));
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
      <Location />
      <Closing onCta={goToChoice} />
      <Footer />

      <MobileCtaBar onCta={goToChoice} hidden={view !== "landing"} />

      {view === "loading" && <SubmitLoader />}

      {view === "error" && (
        <SubmitError message={submitError} onRetry={handleRetrySubmit} />
      )}

      {view === "voucher" && result && (
        <VoucherCard result={result} onClose={handleCloseVoucher} />
      )}
    </main>
  );
}
