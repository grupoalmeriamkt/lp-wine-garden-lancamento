import { NextRequest, NextResponse } from "next/server";
import { deleteLead, updateLead } from "@/lib/store";
import {
  isValidCpf,
  isValidEmail,
  isValidPhone,
  normalizeCpf,
  normalizePhone,
} from "@/lib/voucher";
import { glassById } from "@/lib/glasses";
import type { Lead } from "@/lib/types";

export const runtime = "nodejs";

const EDITABLE = ["name", "phone", "cpf", "email", "birth_date", "selected_glass", "has_visited_before"] as const;

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await req.json().catch(() => ({}));
  const patch: Partial<Lead> = {};

  for (const key of EDITABLE) {
    if (body[key] === undefined) continue;
    let val = String(body[key]).trim();
    if (key === "phone") {
      if (!isValidPhone(val)) return NextResponse.json({ error: "invalid_phone" }, { status: 422 });
      val = normalizePhone(val);
    }
    if (key === "cpf") {
      if (!isValidCpf(val)) return NextResponse.json({ error: "invalid_cpf" }, { status: 422 });
      val = normalizeCpf(val);
    }
    if (key === "email" && !isValidEmail(val)) return NextResponse.json({ error: "invalid_email" }, { status: 422 });
    if (key === "selected_glass" && !glassById(val)) return NextResponse.json({ error: "invalid_glass" }, { status: 422 });
    (patch as Record<string, unknown>)[key] = val;
  }

  const updated = await updateLead(id, patch);
  if (!updated) return NextResponse.json({ error: "not_found" }, { status: 404 });
  return NextResponse.json({ lead: updated });
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const ok = await deleteLead(id);
  if (!ok) return NextResponse.json({ error: "not_found" }, { status: 404 });
  return NextResponse.json({ ok: true });
}
