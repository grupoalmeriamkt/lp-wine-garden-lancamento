import { CAMPAIGN } from "@/lib/config";

export default function CampaignPeriodCallout({
  variant = "default",
}: {
  variant?: "default" | "voucher";
}) {
  return (
    <div
      className={`campaign-period${variant === "voucher" ? " campaign-period--voucher" : ""}`}
      role="note"
    >
      <span className="campaign-period__eyebrow">Período da cortesia</span>
      <p className="campaign-period__title">
        De {CAMPAIGN.courtesyPeriod.label}
      </p>
      <p className="campaign-period__copy">
        Utilize seu convite nesse período para brindar a primeira taça da nova fase.
      </p>
    </div>
  );
}
