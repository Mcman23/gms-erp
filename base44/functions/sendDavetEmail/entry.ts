import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

function buildMimeMessage({ to, subject, htmlBody, fromName }) {
  const boundary = "boundary_" + Math.random().toString(36).slice(2);
  const encodeBase64Url = (str) => btoa(unescape(encodeURIComponent(str))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

  // RFC 2047 encode subject for non-ASCII
  const encodedSubject = `=?UTF-8?B?${encodeBase64Url(subject)}?=`;
  const fromLine = fromName ? `${fromName} <me>` : "me";

  const mime = [
    `From: ${fromLine}`,
    `To: ${to}`,
    `Subject: ${encodedSubject}`,
    `MIME-Version: 1.0`,
    `Content-Type: multipart/alternative; boundary="${boundary}"`,
    ``,
    `--${boundary}`,
    `Content-Type: text/html; charset=UTF-8`,
    `Content-Transfer-Encoding: base64`,
    ``,
    encodeBase64Url(htmlBody),
    ``,
    `--${boundary}--`,
  ].join("\r\n");

  return btoa(unescape(encodeURIComponent(mime))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { to, subject, htmlBody, fromName } = await req.json();

    if (!to || !subject || !htmlBody) {
      return Response.json({ error: "to, subject, htmlBody tələb olunur" }, { status: 400 });
    }

    const { accessToken } = await base44.asServiceRole.connectors.getConnection("gmail");

    const raw = buildMimeMessage({ to, subject, htmlBody, fromName: fromName || "GMS ERP Sistemi" });

    const res = await fetch("https://gmail.googleapis.com/gmail/v1/users/me/messages/send", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ raw }),
    });

    if (!res.ok) {
      const err = await res.text();
      return Response.json({ error: "Gmail xətası: " + err }, { status: 500 });
    }

    return Response.json({ success: true });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});