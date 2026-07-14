"use client";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

const STEPS = [
  "Validando seus dados",
  "Gerando seu convite",
  "Preparando sua taça",
];

export default function SubmitLoader() {
  const [mounted, setMounted] = useState(false);
  const [step, setStep] = useState(0);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;

    document.body.classList.add("overlay-open");
    document.body.style.overflow = "hidden";
    const timers = [
      setTimeout(() => setStep(1), 1400),
      setTimeout(() => setStep(2), 2800),
    ];

    return () => {
      timers.forEach(clearTimeout);
      document.body.classList.remove("overlay-open");
      document.body.style.overflow = "";
    };
  }, [mounted]);

  if (!mounted) return null;

  return createPortal(
    <div className="submit-loader" role="status" aria-live="polite" aria-busy="true">
      <div className="submit-loader__inner">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/brand/logo/wg-horizontal-bege-fundotransp.svg"
          alt="Wine Garden"
          className="submit-loader__logo"
        />

        <p className="submit-loader__title">Carregando</p>
        <p className="submit-loader__step">{STEPS[step]}</p>

        <div className="submit-loader__track" aria-hidden>
          <div className="submit-loader__bar" />
        </div>

        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/brand/elementos/taca-granada.svg"
          alt=""
          aria-hidden
          className="submit-loader__glass"
        />
      </div>
    </div>,
    document.body
  );
}
