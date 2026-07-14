"use client";
import { useRef } from "react";
import Reveal from "./Reveal";
import { Selo, Taca, RouteLine } from "./Decor";
import { track } from "@/lib/tracking";
import { gsap, useGSAP } from "@/lib/gsap";

export default function Hero({ onCta }: { onCta: () => void }) {
  const root = useRef<HTMLElement | null>(null);

  useGSAP(
    () => {
      const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      const logo = root.current?.querySelector(".hero-logo");
      if (!logo || reduce) return;
      gsap.fromTo(
        logo,
        { opacity: 0, y: -24, scale: 0.9, filter: "blur(6px)" },
        {
          opacity: 1,
          y: 0,
          scale: 1,
          filter: "blur(0px)",
          duration: 1.2,
          ease: "power3.out",
          delay: 0.1,
        }
      );
    },
    { scope: root }
  );

  return (
    <section ref={root} className="section hero-section">
      <Selo
        country="Franca"
        size={98}
        className="wg-float hero-decor hero-decor--hide-mobile"
        data-parallax="-32"
        style={{ position: "absolute", top: 128, left: "6%", transform: "rotate(-9deg)" }}
      />
      <Selo
        country="Italia"
        size={82}
        className="wg-float hero-decor"
        data-parallax="26"
        style={{ position: "absolute", bottom: 96, right: "8%", transform: "rotate(7deg)" }}
      />
      <Taca
        src="/brand/elementos/taca-uva.svg"
        size={158}
        className="wg-float hero-decor hero-decor--hide-mobile"
        data-parallax="-18"
        style={{ position: "absolute", bottom: 30, left: "9%" }}
      />
      <Selo
        country="Portugal"
        size={64}
        className="wg-float hero-decor hero-decor--extra"
        data-parallax="40"
        style={{ position: "absolute", top: 230, right: "16%", transform: "rotate(-5deg)" }}
      />

      <div className="container center hero-inner">
        {/* Imposing logo */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/brand/logo/wg-horizontal-granada-fundotransp.svg"
          alt="Wine Garden"
          className="hero-logo"
        />

        <Reveal delay={420}>
          <div className="eyebrow hero-eyebrow">Brasília · Reabertura</div>
        </Reveal>

        <Reveal delay={500}>
          <h1 className="display hero-title">
            O Wine Garden
            <br />
            está de volta.
          </h1>
        </Reveal>

        <Reveal delay={580}>
          <p className="h-emocional italic hero-subtitle">
            A primeira taça da nova fase é sua.
          </p>
        </Reveal>

        <Reveal delay={660}>
          <div className="hero-route">
            <RouteLine />
          </div>
        </Reveal>

        <Reveal delay={720}>
          <p className="body hero-lead">
            Um convite especial para brindar o retorno do Wine Garden com uma nova
            carta de mais de 40 rótulos, novos sabores e uma nova forma de viver o
            vinho em Brasília.
          </p>
        </Reveal>

        <Reveal delay={780}>
          <div className="hero-cta">
            <button
              className="btn"
              onClick={() => {
                track("hero_cta_click");
                onCta();
              }}
            >
              Escolher minha taça →
            </button>
            <p className="tiny muted hero-sponsors">
              Oferecimento Cartões Caixa, Visa e Elo.
            </p>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
