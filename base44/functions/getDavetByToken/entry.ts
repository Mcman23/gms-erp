import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const body = await req.json();
    const { token } = body;

    if (!token) {
      return Response.json({ error: 'Token tələb olunur' }, { status: 400 });
    }

    const base44 = createClientFromRequest(req);

    // Service role ilə bütün qeydləri al, token uyğunluğunu yoxla
    const allRecords = await base44.asServiceRole.entities.DavetEdilmisIstifadeci.list();
    const davet = allRecords.find(r => r.davet_token === token);

    if (!davet) {
      return Response.json({ error: 'not_found' }, { status: 404 });
    }

    return Response.json({ davet });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});