/* Decorative brand elements — selos, taças, mapas e linhas pontilhadas. */

const SELOS = [
  "Franca",
  "Italia",
  "Espanha",
  "Portugal",
  "Argentina",
  "Chile",
  "Brasil",
  "EUA",
];

export function Selo({
  country,
  size = 84,
  className = "",
  style,
  ...rest
}: {
  country: string;
  size?: number;
  className?: string;
  style?: React.CSSProperties;
} & Record<string, unknown>) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={`/brand/elementos/selo-${country}.svg`}
      alt=""
      aria-hidden
      width={size}
      height={size}
      className={className}
      style={{ display: "block", ...style }}
      {...rest}
    />
  );
}

export function Taca({
  src = "/brand/elementos/taca-granada.svg",
  size = 120,
  className = "",
  style,
  ...rest
}: {
  src?: string;
  size?: number;
  className?: string;
  style?: React.CSSProperties;
} & Record<string, unknown>) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt=""
      aria-hidden
      height={size}
      className={className}
      style={{ display: "block", ...style }}
      {...rest}
    />
  );
}

export function Mapa({
  country,
  width = 160,
  className = "",
  style,
  ...rest
}: {
  country: string;
  width?: number;
  className?: string;
  style?: React.CSSProperties;
} & Record<string, unknown>) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={`/brand/elementos/mapa-${country}.svg`}
      alt=""
      aria-hidden
      width={width}
      className={className}
      style={{ display: "block", ...style }}
      {...rest}
    />
  );
}

/** Horizontal dashed route line with a small stamp at each end. */
export function RouteLine({ className = "" }: { className?: string }) {
  return (
    <div
      className={className}
      style={{ display: "flex", alignItems: "center", gap: 14, width: "100%" }}
      aria-hidden
    >
      <span style={{ width: 7, height: 7, borderRadius: 999, background: "var(--uva)" }} />
      <hr className="dotted" style={{ flex: 1 }} />
      <span
        style={{
          width: 7,
          height: 7,
          borderRadius: 999,
          border: "1.5px solid var(--uva)",
        }}
      />
    </div>
  );
}

export function SeloStrip({ opacity = 0.9 }: { opacity?: number }) {
  return (
    <div
      aria-hidden
      style={{
        display: "flex",
        flexWrap: "wrap",
        gap: 26,
        justifyContent: "center",
        alignItems: "center",
        opacity,
      }}
    >
      {SELOS.map((c) => (
        <Selo key={c} country={c} size={66} />
      ))}
    </div>
  );
}

export { SELOS };
