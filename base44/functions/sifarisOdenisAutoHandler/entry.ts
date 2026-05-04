import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

// Bu funksiya Sifaris entity automation tərəfindən çağrılır
// Payload: { event, data (yeni), old_data (köhnə) }
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json();

    const { data: sifaris, old_data } = body;

    if (!sifaris || !old_data) {
      return Response.json({ message: 'Data yoxdur' });
    }

    const yeniStatus = sifaris.odenis_statusu;
    const kohneStatus = old_data.odenis_statusu;

    // Status dəyişməyibsə heç nə etmə
    if (yeniStatus === kohneStatus) {
      return Response.json({ message: 'Ödəniş statusu dəyişməyib' });
    }

    // Yalnız "Ödənilib" və ya "Qismən ödənilib" üçün kassa girişi yarat
    if (yeniStatus !== 'Ödənilib' && yeniStatus !== 'Qismən ödənilib') {
      return Response.json({ message: 'Kassa əməliyyatı tələb olunmur' });
    }

    const sifaris_id = sifaris.id;

    // Aktiv kassaları al
    const kassalar = await base44.asServiceRole.entities.Kassa.filter({ status: 'Aktiv' });
    if (!kassalar || kassalar.length === 0) {
      return Response.json({ error: 'Aktiv kassa tapılmadı' }, { status: 404 });
    }
    const kassa = kassalar[0];

    // Bu sifariş üçün mövcud kassa girişlərini al
    const movcudlar = await base44.asServiceRole.entities.KassaEmeliyyati.filter({ sifaris_id });
    const xidmetOdenisleri = (movcudlar || []).filter(e => e.tip === 'Mədaxil' && e.kateqoriya === 'Xidmət ödənişi');

    if (yeniStatus === 'Ödənilib') {
      // Tam ödəniş: artıq ödənilənin üstündən qalanı yaz
      const artiqOdenilen = xidmetOdenisleri.reduce((s, e) => s + (e.mebleg || 0), 0);
      const tamMebleg = sifaris.umumi_mebleg || sifaris.qiymet || 0;
      const qalan = tamMebleg - artiqOdenilen;

      if (qalan <= 0) {
        return Response.json({ message: 'Bu sifariş artıq tam ödənilib' });
      }

      await base44.asServiceRole.entities.KassaEmeliyyati.create({
        kassa_id: kassa.id,
        tip: 'Mədaxil',
        kateqoriya: 'Xidmət ödənişi',
        mebleg: qalan,
        valyuta: 'AZN',
        odenis_metodu: 'Nağd',
        tarix: new Date().toISOString(),
        sifaris_id,
        musteri_id: sifaris.musteri_id || '',
        aciklama: `Sifariş ödənişi (tam): ${sifaris.sifaris_no || sifaris_id} — ${sifaris.musteri_adi || ''}`,
        qebz_nomresi: sifaris.sifaris_no || '',
        status: 'Təsdiqləndi',
      });

      await base44.asServiceRole.entities.Kassa.update(kassa.id, { balans: (kassa.balans || 0) + qalan });
      await base44.asServiceRole.entities.Sifaris.update(sifaris_id, { odenilmis_mebleg: tamMebleg });

      await base44.asServiceRole.entities.JurnalQeydi.create({
        jurnal_no: `J-${Date.now().toString().slice(-6)}`,
        tarix: new Date().toISOString().slice(0, 10),
        aciklama: `Sifariş tam ödənişi: ${sifaris.sifaris_no || sifaris_id} — ${sifaris.musteri_adi || ''}`,
        debet_hesab: '1010', kredit_hesab: '4010',
        debet_mebleg: qalan, kredit_mebleg: qalan,
        edv_mebleg: 0, istinad_id: sifaris_id, istinad_tipi: 'Sifariş', status: 'Təsdiqləndi',
      }).catch(() => null);

      return Response.json({ success: true, mebleg: qalan, tip: 'tam' });
    }

    // Qismən ödəniş: yeni odenilmis_mebleg dəyəri köhnədən böyükdürsə, fərqi kassa-ya yaz
    if (yeniStatus === 'Qismən ödənilib') {
      const kohneOdenilmis = parseFloat(old_data.odenilmis_mebleg) || 0;
      const yeniOdenilmis = parseFloat(sifaris.odenilmis_mebleg) || 0;
      const ferg = yeniOdenilmis - kohneOdenilmis;

      // Əgər frontend artıq odenilmis_mebleg-i yeniləyibsə — fərqi kassa-ya yaz
      // Əgər fərq 0-dırsa (status dəyişib amma məbləğ hələ yenilənməyib) — skip
      if (ferg <= 0) {
        return Response.json({ message: 'Ödəniş məbləğ fərqi yoxdur, kassa yazılmadı' });
      }

      await base44.asServiceRole.entities.KassaEmeliyyati.create({
        kassa_id: kassa.id,
        tip: 'Mədaxil',
        kateqoriya: 'Xidmət ödənişi',
        mebleg: ferg,
        valyuta: 'AZN',
        odenis_metodu: 'Nağd',
        tarix: new Date().toISOString(),
        sifaris_id,
        musteri_id: sifaris.musteri_id || '',
        aciklama: `Sifariş ödənişi (qismən): ${sifaris.sifaris_no || sifaris_id} — ${sifaris.musteri_adi || ''}`,
        qebz_nomresi: sifaris.sifaris_no || '',
        status: 'Təsdiqləndi',
      });

      await base44.asServiceRole.entities.Kassa.update(kassa.id, { balans: (kassa.balans || 0) + ferg });

      await base44.asServiceRole.entities.JurnalQeydi.create({
        jurnal_no: `J-${Date.now().toString().slice(-6)}`,
        tarix: new Date().toISOString().slice(0, 10),
        aciklama: `Sifariş qismən ödənişi: ${sifaris.sifaris_no || sifaris_id} — ${sifaris.musteri_adi || ''}`,
        debet_hesab: '1010', kredit_hesab: '4010',
        debet_mebleg: ferg, kredit_mebleg: ferg,
        edv_mebleg: 0, istinad_id: sifaris_id, istinad_tipi: 'Sifariş', status: 'Təsdiqləndi',
      }).catch(() => null);

      return Response.json({ success: true, mebleg: ferg, tip: 'qismen' });
    }

    return Response.json({ message: 'İşlənmədi' });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});