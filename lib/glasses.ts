export type GlassId = "espumante" | "branco-rose" | "tinto";

export interface GlassOption {
  id: GlassId;
  name: string;
  tagline: string;
  seloCountry: string; // decorative country stamp
  taca: string; // taça illustration asset
  accent: string; // css var
}

export const GLASSES: GlassOption[] = [
  {
    id: "espumante",
    name: "Espumante",
    tagline: "Para brindar a volta.",
    seloCountry: "Franca",
    taca: "/brand/elementos/taca-uva.svg",
    accent: "var(--oliva)",
  },
  {
    id: "branco-rose",
    name: "Branco ou Rosé",
    tagline: "Para começar com leveza.",
    seloCountry: "Portugal",
    taca: "/brand/elementos/taca-purpura.svg",
    accent: "var(--purpura)",
  },
  {
    id: "tinto",
    name: "Tinto",
    tagline: "Para voltar do jeito clássico.",
    seloCountry: "Argentina",
    taca: "/brand/elementos/taca-granada.svg",
    accent: "var(--granada)",
  },
];

export function glassById(id?: string | null): GlassOption | undefined {
  return GLASSES.find((g) => g.id === id);
}

export function glassLabel(id?: string | null): string {
  return glassById(id)?.name ?? "—";
}
