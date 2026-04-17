import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { sifaris_id, odenis_statusu, kohne_odenis_statusu } = await req.json();

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
    const mebleg = sifaris.umumi_mebleg || sifaris.qiymet || 0;

    // Eyni sifariş üçün artıq kassa girişi var mı?
    const movcut = await base44.asServiceRole.entities.KassaEmeliyyati.filter({ sifaris_id: sifaris_id });
    const artiqVar = movcut && movcut.some(e => e.tip === 'Mədaxil' && e.kateqoriya === 'Xidmət ödənişi');

    if (artiqVar) {
      return Response.json({ message: 'Bu sifariş üçün kassa girişi artıq mövcuddur' });
    }

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
    await base44.asServiceRole.entities.JurnalQeydi.create({
      tarix: new Date().toISOString().slice(0, 10),
      aciklama: `Sifariş ödənişi: ${sifaris.sifaris_no || sifaris_id} — ${sifaris.musteri_adi || ''}`,
      debet_hesab: '1010',   // Kassa/Bank
      kredit_hesab: '4010',  // Xidmət gəlirləri
      mebleg: mebleg,
      istinad_id: sifaris_id,
      istinad_tipi: 'Sifariş',
      status: 'Təsdiqləndi',
    }).catch(() => null); // JurnalQeydi yoxdursa xəta verməsin

    return Response.json({ success: true, mebleg, kassa_ad: kassa.ad });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});