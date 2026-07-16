// Ajuste estes valores com os dados reais da casa antes do go-live.
export const CAMPAIGN = {
  rotulosCount: 50,
  courtesyPeriod: {
    start: "2026-07-31",
    end: "2026-08-07",
    label: "31 de julho a 07 de agosto",
    shortLabel: "31 jul – 07 ago",
  },
} as const;

export const VENUE = {
  name: "Wine Garden",
  address: "Wine Garden — Pontão do Lago Sul, Brasília, DF",
  // Endereço completo exibido na seção de localização.
  addressLines: [
    "Pontão do Lago Sul",
    "SHIS, Lote 24 — Lago Sul",
    "Brasília · DF",
  ],
  hours: "Ter a Dom · a partir das 18h",
  // Coordenadas reais (Izzi Wine Garden — Pontão do Lago Sul).
  lat: -15.8259315,
  lng: -47.8713111,
  mapsUrl: "https://maps.app.goo.gl/r8zjuKdnhuXKfubD8",
  whatsapp: "https://wa.me/5561999999999",
  instagram: "https://instagram.com/winegardenbsb",
  reservationUrl: "https://www.getin.app/brasilia/izzi-wine-garden",
};

export const SPONSORS = {
  caixa: { name: "Cartões Caixa", logo: "/brand/sponsors/caixa.png", height: 30 },
  visa: { name: "Visa", logo: "/brand/sponsors/visa.png", height: 22 },
  elo: { name: "Elo", logo: "/brand/sponsors/elo.png", height: 28 },
} as const;
