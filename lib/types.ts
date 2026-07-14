export interface LeadInput {
  name: string;
  phone: string;
  birth_date: string; // YYYY-MM-DD
  email?: string | null;
  has_visited_before?: string | null;
  selected_glass: string;
  source?: string | null;
  utm_source?: string | null;
  utm_medium?: string | null;
  utm_campaign?: string | null;
  utm_content?: string | null;
  utm_term?: string | null;
}

export interface Lead extends LeadInput {
  id: string;
  created_at: string;
}

export type VoucherStatus = "active" | "redeemed" | "expired" | "cancelled";

export interface Voucher {
  id: string;
  lead_id: string;
  voucher_code: string;
  qr_payload: string;
  selected_glass: string;
  status: VoucherStatus;
  expires_at: string;
  created_at: string;
  redeemed_at?: string | null;
  redeemed_by?: string | null;
}

export interface CreateVoucherResult {
  voucher: Voucher;
  lead: Lead;
  qrDataUrl: string;
}
