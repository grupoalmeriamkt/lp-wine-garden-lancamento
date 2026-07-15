import { NextResponse } from "next/server";
import { emailStatusByCodes, listLeadsWithVouchers } from "@/lib/store";
import { glassLabel } from "@/lib/glasses";

export const runtime = "nodejs";

function csvCell(v: unknown): string {
  let s = v == null ? "" : String(v);
  if (/^[=+\-@]/.test(s)) s = "'" + s;
  return /[",\n;]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export async function GET() {
  const rows = await listLeadsWithVouchers();
  const codes = rows.map((r) => r.voucher?.voucher_code).filter(Boolean) as string[];
  const status = await emailStatusByCodes(codes);

  const header = [
    "Nome", "Telefone", "Email", "CPF", "Taca", "Codigo",
    "StatusVoucher", "StatusEmail", "EnviadoEm", "AbertoEm", "CriadoEm",
  ];
  const lines = [header.join(";")];
  for (const { lead, voucher } of rows) {
    const st = voucher ? status[voucher.voucher_code] : undefined;
    lines.push(
      [
        lead.name, lead.phone, lead.email, lead.cpf,
        glassLabel(lead.selected_glass),
        voucher?.voucher_code ?? "",
        voucher?.status ?? "",
        st?.stage ?? "none",
        st?.sentAt ?? "",
        st?.openedAt ?? "",
        lead.created_at,
      ]
        .map(csvCell)
        .join(";")
    );
  }
  return new NextResponse("﻿" + lines.join("\n"), {
    headers: {
      "content-type": "text/csv; charset=utf-8",
      "content-disposition": 'attachment; filename="inscritos-winegarden.csv"',
    },
  });
}
