import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Wine Garden — A primeira taça da nova fase é sua",
  description:
    "O Wine Garden está de volta. Um convite especial para brindar o retorno com uma nova carta, novos sabores e uma nova forma de viver o vinho em Brasília.",
  openGraph: {
    title: "O Wine Garden está de volta.",
    description: "A primeira taça da nova fase é sua.",
    type: "website",
  },
};

export const viewport: Viewport = {
  themeColor: "#5b0718",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}
