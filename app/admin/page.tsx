import { emailStatusByCodes, listLeadsWithVouchers } from "@/lib/store";
import { glassLabel } from "@/lib/glasses";
import AdminTable, { AdminRow } from "./AdminTable";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export default async function AdminPage() {
  const list = await listLeadsWithVouchers();
  const codes = list.map((r) => r.voucher?.voucher_code).filter(Boolean) as string[];
  const status = await emailStatusByCodes(codes);

  const rows: AdminRow[] = list.map(({ lead, voucher }) => ({
    id: lead.id,
    name: lead.name,
    phone: lead.phone,
    email: lead.email,
    cpf: lead.cpf,
    birth_date: lead.birth_date,
    glass: lead.selected_glass,
    glassName: glassLabel(lead.selected_glass),
    code: voucher?.voucher_code ?? null,
    voucherStatus: voucher?.status ?? null,
    email_status: voucher ? status[voucher.voucher_code] ?? { stage: "none" } : { stage: "none" },
    created_at: lead.created_at,
  }));

  return <AdminTable rows={rows} />;
}
