import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const now = new Date().toISOString();
    const today = now.slice(0, 10);
    const threeDaysLater = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
    const created = [];

    // 1. Yeni sifarişlər (son 30 dəqiqə ərzində yaradılmış)
    const sifarisler = await base44.asServiceRole.entities.Sifaris.filter({ status: "Yeni" }, "-created_date", 20);
    const thirtyMinsAgo = new Date(Date.now() - 30 * 60 * 1000).toISOString();
    for (const s of sifarisler) {
      if (s.created_date > thirtyMinsAgo) {
        const existing = await base44.asServiceRole.entities.Bildiris.filter({ istinad_id: s.id, tip: "Yeni sifariş" }, "-tarix", 1);
        if (existing.length === 0) {
          await base44.asServiceRole.entities.Bildiris.create({
            mesaj: `Yeni sifariş: ${s.musteri_adi || "Müştəri"} — ${s.xidmet_tipi || ""}`,
            tip: "Yeni sifariş",
            prioritet: "Vacib",
            tarix: now,
            istinad_id: s.id,
            istinad_tipi: "Sifariş",
            oxundu: false,
            baglandi: false,
            ses_verildi: false,
          });
          created.push("sifaris:" + s.id);
        }
      }
    }

    // 2. Az qalan anbar malları
    const anbar = await base44.asServiceRole.entities.Anbar.list("-created_date", 200);
    for (const item of anbar) {
      if ((item.miqdar || 0) <= (item.min_miqdar || 5)) {
        const existing = await base44.asServiceRole.entities.Bildiris.filter({ istinad_id: item.id, tip: "Stok xəbərdarlığı" }, "-tarix", 1);
        if (existing.length === 0) {
          await base44.asServiceRole.entities.Bildiris.create({
            mesaj: `Stok azalıb: "${item.ad}" — ${item.miqdar} ${item.vahid || ""} qaldı (min: ${item.min_miqdar})`,
            tip: "Stok xəbərdarlığı",
            prioritet: item.miqdar === 0 ? "Kritik" : "Vacib",
            tarix: now,
            istinad_id: item.id,
            istinad_tipi: "Stok",
            oxundu: false,
            baglandi: false,
            ses_verildi: false,
          });
          created.push("anbar:" + item.id);
        }
      }
    }

    // 3. Yüksək prioritetli şikayətlər
    const sikayetler = await base44.asServiceRole.entities.Sikayet.filter({ status: "Açıq" }, "-created_date", 50);
    for (const s of sikayetler) {
      if (s.prioritet === "Yüksək" || s.prioritet === "Kritik") {
        const existing = await base44.asServiceRole.entities.Bildiris.filter({ istinad_id: s.id, tip: "Sikayet" }, "-tarix", 1);
        if (existing.length === 0) {
          await base44.asServiceRole.entities.Bildiris.create({
            mesaj: `${s.prioritet} prioritetli şikayət: ${s.musteri_adi || ""} — ${s.kateqoriya}`,
            tip: "Sikayet",
            prioritet: s.prioritet === "Kritik" ? "Kritik" : "Vacib",
            tarix: now,
            istinad_id: s.id,
            istinad_tipi: "Sikayet",
            oxundu: false,
            baglandi: false,
            ses_verildi: false,
          });
          created.push("sikayet:" + s.id);
        }
      }
    }

    // 4. Faktura ödəniş müddəti yaxınlaşanlar (3 gün)
    const fakturalar = await base44.asServiceRole.entities.Faktura.list("-created_date", 200);
    for (const f of fakturalar) {
      if (f.odenis_statusu !== "Ödənilib" && f.son_odenis_tarixi && f.son_odenis_tarixi <= threeDaysLater && f.son_odenis_tarixi >= today) {
        const existing = await base44.asServiceRole.entities.Bildiris.filter({ istinad_id: f.id, tip: "Ödəniş" }, "-tarix", 1);
        if (existing.length === 0) {
          await base44.asServiceRole.entities.Bildiris.create({
            mesaj: `Faktura son ödəniş tarixi yaxınlaşır: ${f.faktura_no} — ${f.musteri_adi} (${f.son_odenis_tarixi})`,
            tip: "Ödəniş",
            prioritet: f.son_odenis_tarixi === today ? "Kritik" : "Vacib",
            tarix: now,
            istinad_id: f.id,
            istinad_tipi: "Faktura",
            oxundu: false,
            baglandi: false,
            ses_verildi: false,
          });
          created.push("faktura:" + f.id);
        }
      }
    }

    // 5. Avadanlıq baxım tarixi yaxınlaşanlar
    const avadanliq = await base44.asServiceRole.entities.Avadanliq.list("-created_date", 200);
    for (const a of avadanliq) {
      if (a.novbeti_baxim && a.novbeti_baxim <= threeDaysLater && a.novbeti_baxim >= today) {
        const existing = await base44.asServiceRole.entities.Bildiris.filter({ istinad_id: a.id, tip: "Avadanlıq baxım" }, "-tarix", 1);
        if (existing.length === 0) {
          await base44.asServiceRole.entities.Bildiris.create({
            mesaj: `Avadanlıq baxımı: "${a.ad}" — ${a.novbeti_baxim} tarixinə planlanıb`,
            tip: "Avadanlıq baxım",
            prioritet: a.novbeti_baxim === today ? "Kritik" : "Normal",
            tarix: now,
            istinad_id: a.id,
            istinad_tipi: "Avadanlıq",
            oxundu: false,
            baglandi: false,
            ses_verildi: false,
          });
          created.push("avadanliq:" + a.id);
        }
      }
    }

    return Response.json({ ok: true, created });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});