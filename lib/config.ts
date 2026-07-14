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
  address: "Wine Garden — Brasília, DF",
  // Endereço completo exibido na seção de localização (ajustar com o real).
  addressLines: [
    "Pontão do Lago Sul",
    "SHIS QL 10, Lote 1/30 — Lago Sul",
    "Brasília · DF",
  ],
  hours: "Ter a Dom · a partir das 18h",
  // Coordenadas do mapa (placeholder no Pontão do Lago Sul — ajustar).
  lat: -15.83862,
  lng: -47.87155,
  mapsUrl: "https://maps.google.com/?q=Wine+Garden+Bras%C3%ADlia",
  whatsapp: "https://wa.me/5561999999999",
  instagram: "https://instagram.com/winegardenbsb",
  reservationUrl: "https://wa.me/5561999999999?text=Quero%20reservar%20uma%20mesa%20no%20Wine%20Garden",
};

export const SPONSORS = {
  caixa: { name: "Cartões Caixa", logo: "/brand/sponsors/caixa.svg", height: 30 },
  visa: { name: "Visa", logo: "/brand/sponsors/visa.svg", height: 22 },
  elo: { name: "Elo", logo: "/brand/sponsors/elo.svg", height: 28 },
} as const;
