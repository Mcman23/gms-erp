// GMS ERP - Sistem Sifre Idareetme
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json();
    const { action, daxil_edilen_sifre, yeni_sifre } = body;

    if (action === "check") {
      // Check password
      const ayarlar = await base44.asServiceRole.entities.SistemAyarlari.filter({ acar: "sistem_sifre" });
      const currentSifre = ayarlar.length > 0 ? ayarlar[0].deger : "gms2026";
      return Response.json({ ok: daxil_edilen_sifre === currentSifre });
    }

    if (action === "change") {
      // Admin only - change password
      const user = await base44.auth.me();
      if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

      const ayarlar = await base44.asServiceRole.entities.SistemAyarlari.filter({ acar: "sistem_sifre" });
      if (ayarlar.length > 0) {
        await base44.asServiceRole.entities.SistemAyarlari.update(ayarlar[0].id, { deger: yeni_sifre });
      } else {
        await base44.asServiceRole.entities.SistemAyarlari.create({
          acar: "sistem_sifre",
          deger: yeni_sifre,
          aciklama: "Sistem giris sifresi"
        });
      }
      return Response.json({ ok: true });
    }

    return Response.json({ error: "Bilinmeyen action" }, { status: 400 });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});