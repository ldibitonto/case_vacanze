import { readFile } from "fs/promises";
import path from "path";
import { Resend } from "resend";

// Invio email di conferma prenotazione via Resend (https://resend.com).
// Senza RESEND_API_KEY configurata in .env, l'email viene solo loggata in
// console invece di essere inviata: comodo in sviluppo, non blocca il flusso
// di prenotazione se la chiave non è ancora stata impostata.
const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

export type BookingConfirmationEmailParams = {
  to: string;
  guestName: string;
  bookingId: string;
  propertyName: string;
  propertyImage: string;
  checkIn: string; // già formattata per la persona, es. "12 agosto 2026"
  checkOut: string;
  totalPrice: number;
  currency: string;
};

const IMAGE_CID = "property-photo";

function buildHtml(params: BookingConfirmationEmailParams & { imageSrc: string }) {
  const {
    guestName,
    bookingId,
    propertyName,
    imageSrc,
    checkIn,
    checkOut,
    totalPrice,
    currency,
  } = params;

  // Layout a tabelle ("bulletproof"), non div con margin:0 auto: è la
  // tecnica standard per le email perché molti client (Outlook in testa,
  // ma anche diversi client mobile) ignorano o interpretano male sia
  // margin:auto che box-sizing su un div, con il risultato che il blocco
  // centrale non risultava centrato ma spostato verso un lato. La cella
  // <td align="center"> usa l'attributo HTML (non CSS) per il centraggio,
  // supportato ovunque, e il padding vive tutto su celle di tabella invece
  // che su div con una larghezza massima fissa.
  return `
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background: #f0f9ff;">
    <tr>
      <td align="center" style="padding: 24px 16px;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width: 480px; font-family: -apple-system, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
          <tr>
            <td style="background: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 8px 24px rgba(2, 132, 199, 0.15);">
              <img src="${imageSrc}" alt="${propertyName}" width="480" height="220" style="width: 100%; max-width: 100%; height: 220px; object-fit: cover; object-position: center; display: block;" />
              <div style="padding: 28px 28px 32px;">
                <p style="font-size: 12px; font-weight: 700; letter-spacing: 0.04em; text-transform: uppercase; color: #0284c7; margin: 0 0 6px;">
                  Prenotazione confermata
                </p>
                <h1 style="font-size: 20px; margin: 0 0 18px; color: #0c4a6e;">${propertyName}</h1>

                <p style="font-size: 14px; color: #334155; margin: 0 0 4px;">Ciao ${guestName || "ospite"},</p>
                <p style="font-size: 14px; color: #334155; line-height: 1.6; margin: 0 0 20px;">
                  il pagamento è andato a buon fine e la tua prenotazione è confermata. Ecco il riepilogo:
                </p>

                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border-collapse: collapse; margin-bottom: 24px;">
                  <tr>
                    <td style="padding: 10px 0; border-top: 1px solid #e2e8f0; font-size: 13px; color: #64748b;">Numero prenotazione</td>
                    <td style="padding: 10px 0; border-top: 1px solid #e2e8f0; font-size: 13px; color: #0c4a6e; text-align: right; font-weight: 600;">${bookingId}</td>
                  </tr>
                  <tr>
                    <td style="padding: 10px 0; border-top: 1px solid #e2e8f0; font-size: 13px; color: #64748b;">Check-in</td>
                    <td style="padding: 10px 0; border-top: 1px solid #e2e8f0; font-size: 13px; color: #0c4a6e; text-align: right;">${checkIn}</td>
                  </tr>
                  <tr>
                    <td style="padding: 10px 0; border-top: 1px solid #e2e8f0; font-size: 13px; color: #64748b;">Check-out</td>
                    <td style="padding: 10px 0; border-top: 1px solid #e2e8f0; font-size: 13px; color: #0c4a6e; text-align: right;">${checkOut}</td>
                  </tr>
                  <tr>
                    <td style="padding: 10px 0; border-top: 1px solid #e2e8f0; font-size: 13px; color: #64748b; font-weight: 700;">Totale pagato</td>
                    <td style="padding: 10px 0; border-top: 1px solid #e2e8f0; font-size: 15px; color: #0c4a6e; text-align: right; font-weight: 800;">${totalPrice.toFixed(2)} ${currency}</td>
                  </tr>
                </table>

                <p style="font-size: 14px; color: #334155; line-height: 1.6; margin: 0;">
                  Grazie per aver scelto casa vacanze per il tuo prossimo soggiorno. Prepara le valigie:
                  non vediamo l'ora di darti il benvenuto.
                </p>
                <p style="font-size: 14px; color: #0284c7; font-weight: 700; margin: 18px 0 0;">
                  A presto, e buon viaggio!
                </p>
              </div>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>`;
}

export type ReviewRequestEmailParams = {
  to: string;
  guestName: string;
  propertyName: string;
  checkIn: string; // già formattata, es. "12 agosto 2026"
  checkOut: string;
  reviewUrl: string;
};

function buildReviewRequestHtml(params: ReviewRequestEmailParams) {
  const { guestName, propertyName, checkIn, checkOut, reviewUrl } = params;

  // Vedi buildHtml() sopra per il perché del layout a tabelle invece che
  // div con margin:0 auto (centraggio inaffidabile in molti client email).
  return `
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background: #f0f9ff;">
    <tr>
      <td align="center" style="padding: 24px 16px;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width: 480px; font-family: -apple-system, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
          <tr>
            <td style="background: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 8px 24px rgba(2, 132, 199, 0.15);">
              <div style="padding: 32px 28px;">
                <p style="font-size: 12px; font-weight: 700; letter-spacing: 0.04em; text-transform: uppercase; color: #0284c7; margin: 0 0 6px;">
                  Com'è andato il tuo soggiorno?
                </p>
                <h1 style="font-size: 20px; margin: 0 0 18px; color: #0c4a6e;">${propertyName}</h1>

                <p style="font-size: 14px; color: #334155; margin: 0 0 4px;">Ciao ${guestName || "ospite"},</p>
                <p style="font-size: 14px; color: #334155; line-height: 1.6; margin: 0 0 20px;">
                  speriamo tu ti sia trovato bene durante il soggiorno dal ${checkIn} al ${checkOut}.
                  Ci farebbe piacere leggere la tua opinione: bastano un paio di minuti e aiuta molto
                  i prossimi ospiti a scegliere.
                </p>

                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin: 28px 0;">
                  <tr>
                    <td align="center">
                      <a href="${reviewUrl}" style="display: inline-block; background: linear-gradient(135deg, #38bdf8, #0284c7); color: #ffffff; text-decoration: none; font-weight: 700; font-size: 14px; padding: 14px 28px; border-radius: 999px;">
                        Scrivi la tua recensione
                      </a>
                    </td>
                  </tr>
                </table>

                <p style="font-size: 12.5px; color: #94a3b8; line-height: 1.6; margin: 0;">
                  Se il bottone non funziona, copia e incolla questo link nel browser:<br />
                  <a href="${reviewUrl}" style="color: #0284c7;">${reviewUrl}</a>
                </p>

                <p style="font-size: 14px; color: #0284c7; font-weight: 700; margin: 24px 0 0;">
                  Grazie ancora per averci scelto!
                </p>
              </div>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>`;
}

export async function sendReviewRequestEmail(params: ReviewRequestEmailParams) {
  if (!resend) {
    console.warn(
      `[email] RESEND_API_KEY non configurata: email di richiesta recensione per "${params.to}" non inviata (solo log).`
    );
    return { sent: false as const, reason: "missing_api_key" as const };
  }

  const from = process.env.EMAIL_FROM || "Case Vacanze <onboarding@resend.dev>";

  try {
    const result = await resend.emails.send({
      from,
      to: params.to,
      subject: `Com'è andato il tuo soggiorno a ${params.propertyName}?`,
      html: buildReviewRequestHtml(params),
    });

    if (result.error) {
      console.error("[email] Resend ha rifiutato l'invio della richiesta recensione:", result.error);
      return { sent: false as const, reason: "send_error" as const };
    }

    return { sent: true as const, id: result.data?.id };
  } catch (err) {
    console.error("[email] Errore invio email richiesta recensione:", err);
    return { sent: false as const, reason: "send_error" as const };
  }
}

export async function sendBookingConfirmationEmail(params: BookingConfirmationEmailParams) {
  if (!resend) {
    console.warn(
      `[email] RESEND_API_KEY non configurata: email di conferma per la prenotazione ${params.bookingId} non inviata (solo log). Vedi .env.example.`
    );
    return { sent: false as const, reason: "missing_api_key" as const };
  }

  const from = process.env.EMAIL_FROM || "Case Vacanze <onboarding@resend.dev>";

  // Le foto caricate da /admin/properties sono salvate in locale
  // (public/uploads/...) e servite come URL relativo: utile nel sito, ma
  // inutilizzabile in un'email, perché il client di posta non ha modo di
  // sapere "il tuo sito" e in più, finché il progetto gira solo su
  // localhost, nessun server esterno potrebbe comunque raggiungerlo.
  // Soluzione: leggiamo il file dal disco e lo alleghiamo all'email come
  // immagine inline (content-id), così i byte viaggiano con l'email stessa
  // e il client la mostra senza dover scaricare nulla da internet.
  // Le foto demo (URL esterni tipo picsum.photos) restano invece linkate
  // direttamente, perché quelle sono già pubblicamente raggiungibili.
  let imageSrc = params.propertyImage;
  let attachments: { filename: string; content: Buffer; contentId: string }[] | undefined;

  if (params.propertyImage.startsWith("/uploads/")) {
    try {
      const filePath = path.join(process.cwd(), "public", params.propertyImage);
      const content = await readFile(filePath);
      const filename = path.basename(params.propertyImage);
      attachments = [{ filename, content, contentId: IMAGE_CID }];
      imageSrc = `cid:${IMAGE_CID}`;
    } catch (err) {
      console.warn(
        `[email] Impossibile leggere la foto locale "${params.propertyImage}", la email partirà senza immagine:`,
        err
      );
      imageSrc = "";
    }
  }

  try {
    const result = await resend.emails.send({
      from,
      to: params.to,
      subject: `Prenotazione confermata — ${params.propertyName}`,
      html: buildHtml({ ...params, imageSrc }),
      attachments,
    });

    if (result.error) {
      console.error("[email] Resend ha rifiutato l'invio:", result.error);
      return { sent: false as const, reason: "send_error" as const };
    }

    return { sent: true as const, id: result.data?.id };
  } catch (err) {
    console.error("[email] Errore invio email di conferma:", err);
    return { sent: false as const, reason: "send_error" as const };
  }
}

export type GuestLoginEmailParams = {
  to: string;
  loginUrl: string;
};

function buildGuestLoginHtml(params: GuestLoginEmailParams) {
  const { loginUrl } = params;

  // Vedi buildHtml() sopra per il perché del layout a tabelle invece che
  // div con margin:0 auto (centraggio inaffidabile in molti client email).
  return `
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background: #f0f9ff;">
    <tr>
      <td align="center" style="padding: 24px 16px;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width: 480px; font-family: -apple-system, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
          <tr>
            <td style="background: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 8px 24px rgba(2, 132, 199, 0.15);">
              <div style="padding: 32px 28px;">
                <p style="font-size: 12px; font-weight: 700; letter-spacing: 0.04em; text-transform: uppercase; color: #0284c7; margin: 0 0 6px;">
                  Il tuo link di accesso
                </p>
                <h1 style="font-size: 20px; margin: 0 0 18px; color: #0c4a6e;">Accedi a Case Vacanze</h1>

                <p style="font-size: 14px; color: #334155; line-height: 1.6; margin: 0 0 20px;">
                  Clicca il pulsante qui sotto per accedere: il link è valido per 30 minuti e può
                  essere usato una sola volta.
                </p>

                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin: 28px 0;">
                  <tr>
                    <td align="center">
                      <a href="${loginUrl}" style="display: inline-block; background: linear-gradient(135deg, #38bdf8, #0284c7); color: #ffffff; text-decoration: none; font-weight: 700; font-size: 14px; padding: 14px 28px; border-radius: 999px;">
                        Accedi
                      </a>
                    </td>
                  </tr>
                </table>

                <p style="font-size: 12.5px; color: #94a3b8; line-height: 1.6; margin: 0;">
                  Se il bottone non funziona, copia e incolla questo link nel browser:<br />
                  <a href="${loginUrl}" style="color: #0284c7;">${loginUrl}</a>
                </p>

                <p style="font-size: 12.5px; color: #94a3b8; line-height: 1.6; margin: 18px 0 0;">
                  Se non hai richiesto tu questo accesso, ignora pure questa email.
                </p>
              </div>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>`;
}

export async function sendGuestLoginEmail(params: GuestLoginEmailParams) {
  if (!resend) {
    console.warn(
      `[email] RESEND_API_KEY non configurata: link di accesso per "${params.to}" non inviato (solo log). Link: ${params.loginUrl}`
    );
    return { sent: false as const, reason: "missing_api_key" as const };
  }

  const from = process.env.EMAIL_FROM || "Case Vacanze <onboarding@resend.dev>";

  try {
    const result = await resend.emails.send({
      from,
      to: params.to,
      subject: "Il tuo link di accesso a Case Vacanze",
      html: buildGuestLoginHtml(params),
    });

    if (result.error) {
      console.error("[email] Resend ha rifiutato l'invio del link di accesso:", result.error);
      return { sent: false as const, reason: "send_error" as const };
    }

    return { sent: true as const, id: result.data?.id };
  } catch (err) {
    console.error("[email] Errore invio email di accesso:", err);
    return { sent: false as const, reason: "send_error" as const };
  }
}
