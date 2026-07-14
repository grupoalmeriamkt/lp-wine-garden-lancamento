import { VENUE } from "@/lib/config";

export default function Footer() {
  return (
    <footer className="site-footer">
      <div className="container">
        <div className="footer-brand">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/brand/logo/wg-horizontal-bege-fundotransp.svg"
            alt="Wine Garden"
            className="footer-logo"
          />
        </div>

        <nav className="footer-links" aria-label="Redes e localização">
          <a href={VENUE.instagram} target="_blank" rel="noopener noreferrer">Instagram</a>
          <a href={VENUE.whatsapp} target="_blank" rel="noopener noreferrer">WhatsApp</a>
          <a href={VENUE.mapsUrl} target="_blank" rel="noopener noreferrer">Maps</a>
        </nav>

        <hr className="dotted" style={{ borderTopColor: "rgba(199,174,154,0.35)", margin: "28px 0" }} />

        <div className="footer-bottom">
          <p className="tiny" style={{ color: "rgba(199,174,154,0.85)" }}>
            {VENUE.address}
          </p>
          <p className="tiny" style={{ color: "rgba(199,174,154,0.6)", maxWidth: 640 }}>
            Campanha “A primeira taça da nova fase”. Convite individual e
            intransferível, válido para maiores de 18 anos, por tempo limitado e
            sujeito à disponibilidade de rótulos. Não cumulativo com outras
            cortesias. Oferecimento Caixa, apoio Visa e Elo. Beba com
            moderação.
          </p>
          <p className="tiny" style={{ color: "rgba(199,174,154,0.5)" }}>
            © {new Date().getFullYear()} Wine Garden · Brasília
          </p>
        </div>
      </div>
    </footer>
  );
}
