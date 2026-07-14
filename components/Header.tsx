"use client";
import { useEffect, useState } from "react";

export default function Header() {
  const [solid, setSolid] = useState(false);

  useEffect(() => {
    const onScroll = () => setSolid(window.scrollY > window.innerHeight * 0.6);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header className={`site-header ${solid ? "solid" : ""}`}>
      <div className="container" style={{ display: "flex", justifyContent: "center" }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={
            solid
              ? "/brand/logo/wg-horizontal-bege-fundotransp.svg"
              : "/brand/logo/wg-horizontal-granada-fundotransp.svg"
          }
          alt="Wine Garden"
          height={30}
          style={{ height: 30, width: "auto" }}
        />
      </div>
    </header>
  );
}
