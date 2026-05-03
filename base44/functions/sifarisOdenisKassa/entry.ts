import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { sifaris_id, odenis_statusu, kohne_odenis_statusu, qismen_mebleg } = await req.json();

    if (!sifaris_id) {
      return Response.json({ error: 'sifaris_id tələb olunur' }, { status: 400 });
    }

    // Köhnə status ilə eyni isə heç nə etmə
    if (odenis_statusu === kohne_odenis_statusu) {
      return Response.json({ message: 'Status dəyişməyib' });
    }

    // Yalnız "Ödənilib" və ya "Qismən ödənilib" üçün kassa girişi yarat
    if (odenis_statusu !== 'Ödənilib' && odenis_statusu !== 'Qismən ödənilib') {
      return Response.json({ message: 'Kassa əməliyyatı tələb olunmur' });
    }

    // Sifarişi al
    const sifaris = await base44.asServiceRole.entities.Sifaris.get(sifaris_id);
    if (!sifaris) {
      return Response.json({ error: 'Sifariş tapılmadı' }, { status: 404 });
    }

    // Aktiv kassaları al — birincini default götür
    const kassalar = await base44.asServiceRole.entities.Kassa.filter({ status: 'Aktiv' });
    if (!kassalar || kassalar.length === 0) {
      return Response.json({ error: 'Aktiv kassa tapılmadı' }, { status: 404 });
    }

    const kassa = kassalar[0];
    // Qismən ödənişdə göndərilən məbləği götür
    const mebleg = parseFloat(qismen_mebleg) || 0;
    if (odenis_statusu === 'Qismən ödənilib' && mebleg <= 0) {
      return Response.json({ error: 'Qismən ödəniş məbləği daxil edilməyib' }, { status: 400 });
    }

    // Eyni sifariş üçün artıq kassa girişi var mı?
    const movcut = await base44.asServiceRole.entities.KassaEmeliyyati.filter({ sifaris_id: sifaris_id });
    const movcudlar = movcut ? movcut.filter(e => e.tip === 'Mədaxil' && e.kateqoriya === 'Xidmət ödənişi') : [];

    // Tam ödəniş seçilərsə: əvvəlki qismən ödənişlər qalır, üstəlik tam məbləğin qalan hissəsi girilir
    if (odenis_statusu === 'Ödənilib') {
      const artiqOdenilen = movcudlar.reduce((s, e) => s + (e.mebleg || 0), 0);
      const tamMebleg = sifaris.umumi_mebleg || sifaris.qiymet || 0;
      const qalan = tamMebleg - artiqOdenilen;
      if (qalan <= 0) {
        return Response.json({ message: 'Bu sifariş artıq tam ödənilib' });
      }
      // Yalnız qalan hissəni yaz
      await base44.asServiceRole.entities.KassaEmeliyyati.create({
        kassa_id: kassa.id,
        tip: 'Mədaxil',
        kateqoriya: 'Xidmət ödənişi',
        mebleg: qalan,
        valyuta: 'AZN',
        odenis_metodu: 'Nağd',
        tarix: new Date().toISOString(),
        sifaris_id: sifaris_id,
        musteri_id: sifaris.musteri_id || '',
        aciklama: `Sifariş ödənişi (tam): ${sifaris.sifaris_no || sifaris_id} — ${sifaris.musteri_adi || ''}`,
        qebz_nomresi: sifaris.sifaris_no || '',
        status: 'Təsdiqləndi',
      });
      const yeniBalans = (kassa.balans || 0) + qalan;
      await base44.asServiceRole.entities.Kassa.update(kassa.id, { balans: yeniBalans });
      // Sifariş üzərindəki ödənilmiş məbləği tam yenilə
      await base44.asServiceRole.entities.Sifaris.update(sifaris_id, {
        odenilmis_mebleg: tamMebleg,
      });
      const jurnal_no2 = `J-${Date.now().toString().slice(-6)}`;
      await base44.asServiceRole.entities.JurnalQeydi.create({
        jurnal_no: jurnal_no2,
        tarix: new Date().toISOString().slice(0, 10),
        aciklama: `Sifariş tam ödənişi: ${sifaris.sifaris_no || sifaris_id} — ${sifaris.musteri_adi || ''}`,
        debet_hesab: '1010', kredit_hesab: '4010',
        debet_mebleg: qalan, kredit_mebleg: qalan,
        edv_mebleg: 0, istinad_id: sifaris_id, istinad_tipi: 'Sifariş', status: 'Təsdiqləndi',
      }).catch(() => null);
      return Response.json({ success: true, mebleg: qalan, kassa_ad: kassa.ad });
    }

    // Qismən ödəniş — hər zaman yeni kassa girişi əlavə et

    // Sifariş üzərindəki mövcud ödənilmiş məbləği yenilə
    const artiqQismenOdenilen = movcudlar.reduce((s, e) => s + (e.mebleg || 0), 0);
    const yeniOdenilmisMebleg = artiqQismenOdenilen + mebleg;
    await base44.asServiceRole.entities.Sifaris.update(sifaris_id, {
      odenilmis_mebleg: yeniOdenilmisMebleg,
    });

    // KassaEmeliyyati yarat
    await base44.asServiceRole.entities.KassaEmeliyyati.create({
      kassa_id: kassa.id,
      tip: 'Mədaxil',
      kateqoriya: 'Xidmət ödənişi',
      mebleg: mebleg,
      valyuta: 'AZN',
      odenis_metodu: 'Nağd',
      tarix: new Date().toISOString(),
      sifaris_id: sifaris_id,
      musteri_id: sifaris.musteri_id || '',
      aciklama: `Sifariş ödənişi: ${sifaris.sifaris_no || sifaris_id} — ${sifaris.musteri_adi || ''} (${odenis_statusu})`,
      qebz_nomresi: sifaris.sifaris_no || '',
      status: 'Təsdiqləndi',
    });

    // Kassa balansını yenilə
    const yeniBalans = (kassa.balans || 0) + mebleg;
    await base44.asServiceRole.entities.Kassa.update(kassa.id, { balans: yeniBalans });

    // Maliyyə jurnalına qeyd əlavə et (Gəlirlər hesabı)
    const jurnal_no = `J-${Date.now().toString().slice(-6)}`;
    await base44.asServiceRole.entities.JurnalQeydi.create({
      jurnal_no,
      tarix: new Date().toISOString().slice(0, 10),
      aciklama: `Sifariş ödənişi: ${sifaris.sifaris_no || sifaris_id} — ${sifaris.musteri_adi || ''}`,
      debet_hesab: '1010',
      kredit_hesab: '4010',
      debet_mebleg: mebleg,
      kredit_mebleg: mebleg,
      edv_mebleg: 0,
      istinad_id: sifaris_id,
      istinad_tipi: 'Sifariş',
      status: 'Təsdiqləndi',
    }).catch(() => null);

    return Response.json({ success: true, mebleg, kassa_ad: kassa.ad });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});