"use client";
import { useRef } from "react";
import { gsap, useGSAP } from "@/lib/gsap";

/**
 * Global motion layer for decorative elements.
 *
 * Two independent behaviours run on the SAME element without fighting,
 * because each uses a different transform channel:
 *   - Idle floating  → `y` / `x` (px) + `rotation`   (continuous yoyo)
 *   - Scroll parallax→ `yPercent`                     (scrub, scroll-driven)
 *
 * Any element with class `.wg-float` floats forever while the page is still.
 * Add `data-parallax="<n>"` to also drift it on scroll (n = yPercent travel).
 */
export default function MotionLayer() {
  const scope = useRef<HTMLDivElement | null>(null);

  useGSAP(
    () => {
      const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      const mobile = window.matchMedia("(max-width: 820px)").matches;
      if (reduce) return;

      gsap.utils.toArray<HTMLElement>(".wg-float").forEach((el, i) => {
        const yAmp = mobile ? 8 + (i % 3) * 4 : 14 + (i % 3) * 7;
        const xAmp = mobile ? 4 + (i % 4) * 2 : 6 + (i % 4) * 4;
        const rAmp = mobile ? 1.5 + (i % 3) * 0.8 : 2.5 + (i % 3) * 1.5;

        // vertical bob
        gsap.to(el, {
          y: `+=${yAmp}`,
          duration: 3.2 + (i % 5) * 0.5,
          ease: "sine.inOut",
          yoyo: true,
          repeat: -1,
          delay: (i % 6) * 0.3,
        });
        // horizontal sway (different tempo → organic drift)
        gsap.to(el, {
          x: `+=${i % 2 === 0 ? xAmp : -xAmp}`,
          duration: 4.5 + (i % 4) * 0.7,
          ease: "sine.inOut",
          yoyo: true,
          repeat: -1,
          delay: (i % 5) * 0.4,
        });
        // gentle rock
        gsap.to(el, {
          rotation: `+=${i % 2 === 0 ? rAmp : -rAmp}`,
          transformOrigin: "50% 50%",
          duration: 5 + (i % 3) * 0.8,
          ease: "sine.inOut",
          yoyo: true,
          repeat: -1,
          delay: (i % 4) * 0.5,
        });
      });

      // ---------- Scroll parallax (drift as you scroll) ----------
      if (!mobile) {
        gsap.utils.toArray<HTMLElement>("[data-parallax]").forEach((el) => {
          const travel = parseFloat(el.dataset.parallax || "0");
          gsap.to(el, {
            yPercent: travel,
            ease: "none",
            scrollTrigger: {
              trigger: el,
              start: "top bottom",
              end: "bottom top",
              scrub: 1,
            },
          });
        });
      }
    },
    { scope }
  );

  return <div ref={scope} style={{ display: "contents" }} aria-hidden />;
}
