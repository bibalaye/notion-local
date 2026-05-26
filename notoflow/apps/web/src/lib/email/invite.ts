"use server";

/**
 * Module d'envoi d'emails d'invitation.
 * Utilise Resend si RESEND_API_KEY est défini, sinon log dans la console (mode dev).
 */

interface InviteEmailOptions {
  to: string;
  inviterName: string;
  workspaceName: string;
  inviteUrl: string;
  role: string;
}

const ROLE_LABELS: Record<string, string> = {
  OWNER: "Propriétaire",
  ADMIN: "Administrateur",
  EDITOR: "Éditeur",
  VIEWER: "Lecteur",
  GUEST: "Invité",
};

export async function sendInviteEmail(options: InviteEmailOptions): Promise<void> {
  const { to, inviterName, workspaceName, inviteUrl, role } = options;
  const roleLabel = ROLE_LABELS[role] || role;

  const apiKey = process.env.RESEND_API_KEY;

  if (!apiKey) {
    // Mode développement — afficher le lien dans la console
    console.log("\n📧 ===== EMAIL D'INVITATION (mode dev) =====");
    console.log(`À : ${to}`);
    console.log(`De : ${inviterName}`);
    console.log(`Espace : ${workspaceName}`);
    console.log(`Rôle : ${roleLabel}`);
    console.log(`Lien d'invitation : ${inviteUrl}`);
    console.log("==========================================\n");
    return;
  }

  // Envoi via Resend
  const { Resend } = await import("resend");
  const resend = new Resend(apiKey);

  const html = buildInviteEmailHtml({ inviterName, workspaceName, inviteUrl, roleLabel });

  await resend.emails.send({
    from: process.env.RESEND_FROM_EMAIL || "NotoFlow <noreply@notoflow.app>",
    to,
    subject: `${inviterName} vous invite à rejoindre "${workspaceName}" sur NotoFlow`,
    html,
  });
}

function buildInviteEmailHtml(opts: {
  inviterName: string;
  workspaceName: string;
  inviteUrl: string;
  roleLabel: string;
}): string {
  const { inviterName, workspaceName, inviteUrl, roleLabel } = opts;

  return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Invitation NotoFlow</title>
</head>
<body style="margin:0;padding:0;background:#0f0f0f;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0f0f0f;padding:40px 20px;">
    <tr>
      <td align="center">
        <table width="520" cellpadding="0" cellspacing="0" style="background:#1a1a1a;border-radius:16px;border:1px solid #2a2a2a;overflow:hidden;">
          <!-- Header -->
          <tr>
            <td style="padding:32px 40px 24px;border-bottom:1px solid #2a2a2a;">
              <div style="display:flex;align-items:center;gap:10px;">
                <span style="font-size:22px;font-weight:800;color:#ffffff;letter-spacing:-0.5px;">
                  Noto<span style="color:#6366f1;">Flow</span>
                </span>
              </div>
            </td>
          </tr>
          <!-- Body -->
          <tr>
            <td style="padding:32px 40px;">
              <h1 style="margin:0 0 8px;font-size:20px;font-weight:700;color:#ffffff;line-height:1.3;">
                Vous avez été invité à rejoindre un espace de travail
              </h1>
              <p style="margin:0 0 24px;font-size:14px;color:#888;line-height:1.6;">
                <strong style="color:#ccc;">${inviterName}</strong> vous invite à rejoindre
                <strong style="color:#ccc;">${workspaceName}</strong> en tant que
                <strong style="color:#6366f1;">${roleLabel}</strong>.
              </p>

              <!-- Workspace card -->
              <div style="background:#111;border:1px solid #2a2a2a;border-radius:12px;padding:20px 24px;margin-bottom:28px;">
                <div style="font-size:11px;font-weight:600;color:#555;text-transform:uppercase;letter-spacing:0.08em;margin-bottom:6px;">
                  Espace de travail
                </div>
                <div style="font-size:16px;font-weight:700;color:#fff;">${workspaceName}</div>
                <div style="margin-top:8px;display:inline-block;background:#6366f1/10;border:1px solid #6366f1/30;border-radius:6px;padding:3px 10px;">
                  <span style="font-size:11px;font-weight:600;color:#818cf8;">${roleLabel}</span>
                </div>
              </div>

              <!-- CTA Button -->
              <a href="${inviteUrl}"
                style="display:block;text-align:center;background:#6366f1;color:#fff;font-size:14px;font-weight:600;text-decoration:none;padding:14px 24px;border-radius:10px;margin-bottom:20px;">
                Accepter l'invitation →
              </a>

              <p style="margin:0;font-size:12px;color:#555;text-align:center;line-height:1.6;">
                Ce lien expire dans <strong style="color:#888;">7 jours</strong>.<br/>
                Si vous n'attendiez pas cette invitation, vous pouvez ignorer cet email.
              </p>
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="padding:20px 40px;border-top:1px solid #2a2a2a;">
              <p style="margin:0;font-size:11px;color:#444;text-align:center;">
                NotoFlow — Votre espace de travail collaboratif
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}
