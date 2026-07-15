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

      // Idle float estilo SommaDay: bob vertical + leve rotação (translateY + rotate),
      // ease-in-out ~4s. Sem sway horizontal — movimento limpo (intensidade +1 degrau).
      gsap.utils.toArray<HTMLElement>(".wg-float").forEach((el, i) => {
        const yAmp = mobile ? 10 + (i % 3) * 4 : 16 + (i % 3) * 5; // ~16–26px
        const rAmp = mobile ? 2.5 : 4 + (i % 2); // ±4–5deg

        // vertical bob
        gsap.to(el, {
          y: `+=${yAmp}`,
          duration: 4 + (i % 4) * 0.4,
          ease: "sine.inOut",
          yoyo: true,
          repeat: -1,
          delay: (i % 6) * 0.3,
        });
        // gentle rock (leve rotação, como o SommaDay)
        gsap.to(el, {
          rotation: `+=${i % 2 === 0 ? rAmp : -rAmp}`,
          transformOrigin: "50% 50%",
          duration: 4.5 + (i % 3) * 0.6,
          ease: "sine.inOut",
          yoyo: true,
          repeat: -1,
          delay: (i % 4) * 0.4,
        });
      });

      // ---------- Scroll parallax (drift as you scroll) ----------
      if (!mobile) {
        const PARALLAX_GAIN = 1.3; // +30% de deslocamento
        gsap.utils.toArray<HTMLElement>("[data-parallax]").forEach((el) => {
          const travel = parseFloat(el.dataset.parallax || "0") * PARALLAX_GAIN;
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
