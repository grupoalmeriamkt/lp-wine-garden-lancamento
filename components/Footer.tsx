import { VENUE } from "@/lib/config";

export default function Footer() {
  return (
    <footer style={{ background: "var(--uva)", color: "var(--bege)", padding: "56px 0 40px" }}>
      <div className="container">
        <div className="footer-top">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/brand/logo/wg-horizontal-bege-fundotransp.svg"
            alt="Wine Garden"
            height={36}
            style={{ height: 36 }}
          />
          <nav className="footer-links">
            <a href={VENUE.instagram} target="_blank" rel="noopener noreferrer">Instagram</a>
            <a href={VENUE.whatsapp} target="_blank" rel="noopener noreferrer">WhatsApp</a>
            <a href={VENUE.mapsUrl} target="_blank" rel="noopener noreferrer">Maps</a>
          </nav>
        </div>

        <hr className="dotted" style={{ borderTopColor: "rgba(199,174,154,0.35)", margin: "28px 0" }} />

        <div className="footer-bottom">
          <p className="tiny" style={{ color: "rgba(199,174,154,0.85)" }}>
            {VENUE.address}
          </p>
          <p className="tiny" style={{ color: "rgba(199,174,154,0.6)", maxWidth: 640 }}>
            Campanha “A primeira taça da nova fase”. Convite individual e
            intransferível, válido para maiores de 18 anos, por tempo limitado e
            sujeito à disponibilidade de rótulos. Não cumulativo com outras
            cortesias. Um oferecimento Cartões Caixa, Visa e Elo. Beba com
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
