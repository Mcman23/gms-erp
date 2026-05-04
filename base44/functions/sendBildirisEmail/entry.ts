// GMS ERP - Email Bildiris Gondericisi
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json();
    const { bildiris_tip, bildiris_mesaj, istinad_id } = body;

    // Get all active email notification rules matching this type
    const qaydalar = await base44.asServiceRole.entities.EmailBildirisQaydalari.filter({ aktiv: true });
    const matchingQaydalar = qaydalar.filter(q => q.tip === bildiris_tip);

    if (matchingQaydalar.length === 0) {
      return Response.json({ sent: 0, message: "Bu tip ucun aktiv email qaydasi yoxdur" });
    }

    // Collect all unique emails
    const emailSet = new Set();
    for (const q of matchingQaydalar) {
      const emails = (q.email_alicilar || "").split(",").map(e => e.trim()).filter(Boolean);
      emails.forEach(e => emailSet.add(e));
    }

    const emails = [...emailSet];
    if (emails.length === 0) {
      return Response.json({ sent: 0, message: "Alici email tapilmadi" });
    }

    // Send email to each recipient
    let sent = 0;
    for (const to of emails) {
      await base44.asServiceRole.integrations.Core.SendEmail({
        to,
        from_name: "GMS ERP Sistemi",
        subject: `[GMS ERP] ${bildiris_tip}: Yeni Bildiriş`,
        body: `
          <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px;background:#f8fafc;border-radius:8px;">
            <div style="background:#1e40af;color:white;padding:16px 20px;border-radius:6px 6px 0 0;">
              <h2 style="margin:0;font-size:18px;">GMS ERP — ${bildiris_tip}</h2>
            </div>
            <div style="background:white;padding:20px;border-radius:0 0 6px 6px;border:1px solid #e2e8f0;">
              <p style="color:#374151;font-size:14px;line-height:1.6;">${bildiris_mesaj}</p>
              ${istinad_id ? `<p style="color:#6b7280;font-size:12px;">Məlumat ID: ${istinad_id}</p>` : ""}
              <hr style="border:none;border-top:1px solid #e5e7eb;margin:16px 0;" />
              <p style="color:#9ca3af;font-size:12px;">Bu mesaj GMS ERP sistemi tərəfindən avtomatik göndərilmişdir.</p>
            </div>
          </div>
        `
      });
      sent++;
    }

    return Response.json({ sent, emails, message: `${sent} emaile gonderildi` });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});