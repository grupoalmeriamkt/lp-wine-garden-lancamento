"use client";
import { useEffect, useState } from "react";
import { track } from "@/lib/tracking";

/** App-like sticky action bar shown on mobile after the hero scrolls away. */
export default function MobileCtaBar({
  onCta,
  hidden = false,
}: {
  onCta: () => void;
  hidden?: boolean;
}) {
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (hidden) {
      setShow(false);
      return;
    }
    const onScroll = () => setShow(window.scrollY > window.innerHeight * 0.7);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [hidden]);

  if (hidden) return null;

  return (
    <div className={`mobile-cta ${show ? "show" : ""}`} aria-hidden={!show}>
      <div className="mobile-cta__inner">
        <div className="mobile-cta__text">
          <span className="mono-label" style={{ color: "var(--bege)" }}>
            Nova fase · Brasília
          </span>
          <strong>Sua primeira taça é cortesia</strong>
        </div>
        <button
          className="btn btn--light"
          onClick={() => {
            track("hero_cta_click", { placement: "mobile_bar" });
            onCta();
          }}
        >
          Escolher →
        </button>
      </div>
    </div>
  );
}
