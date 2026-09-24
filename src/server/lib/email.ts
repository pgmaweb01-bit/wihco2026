import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

const FROM_EMAIL = "WIHCN CON III <tickets@conference-wihcn.xyz>";

export interface SendConfirmationParams {
  to: string;
  attendeeName: string;
  attendeeId: string;
  ticketUrl: string;
  qrCodeUrl: string;
}

export async function sendConfirmationEmail(
  params: SendConfirmationParams
): Promise<void> {
  const qrCodeUrl = params.qrCodeUrl;

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { font-family: 'Montserrat', Arial, sans-serif; background: #f5f5f5; margin: 0; padding: 0; }
    .container { max-width: 600px; margin: 0 auto; background: #ffffff; }
    .header { background: #082266; padding: 40px 30px; text-align: center; }
    .header h1 { color: #ffffff; font-size: 24px; margin: 0; letter-spacing: 2px; }
    .header p { color: #61CE70; font-size: 14px; margin: 8px 0 0; letter-spacing: 1px; }
    .content { padding: 30px; }
    .content h2 { color: #082266; font-size: 20px; margin: 0 0 20px; }
    .detail-row { padding: 12px 0; border-bottom: 1px solid #eee; }
    .detail-label { font-size: 11px; text-transform: uppercase; letter-spacing: 1px; color: #888; }
    .detail-value { font-size: 16px; color: #333; margin-top: 4px; font-weight: 600; }
    .qr-box { text-align: center; margin: 20px 0; padding: 20px; border: 1px solid #eee; border-radius: 12px; background: #fdfdfd; }
    .qr-box img { width: 220px; height: 220px; }
    .cta-btn { display: inline-block; background: #082266; color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 600; font-size: 14px; letter-spacing: 1px; margin: 20px 0; }
    .footer { background: #f9f9f9; padding: 20px 30px; text-align: center; font-size: 12px; color: #888; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>WIHCN CON III</h1>
      <p>BEYOND LEADERSHIP</p>
    </div>
    <div class="content">
      <h2>Registration Confirmed</h2>
      <p style="color: #555; line-height: 1.6;">Your registration for WIHCN CON III has been confirmed. Below are your details:</p>

      <div class="detail-row">
        <div class="detail-label">Attendee Name</div>
        <div class="detail-value">${params.attendeeName}</div>
      </div>
      <div class="detail-row">
        <div class="detail-label">Attendee ID</div>
        <div class="detail-value">${params.attendeeId}</div>
      </div>
      <div class="detail-row">
        <div class="detail-label">Event Date</div>
        <div class="detail-value">Friday, 30 October 2026</div>
      </div>
      <div class="detail-row">
        <div class="detail-label">Venue</div>
        <div class="detail-value">Harbour Point, Lagos</div>
      </div>

      <p style="color: #555; line-height: 1.6; margin-top: 20px;">Present this QR code at check-in to gain entry:</p>
      <div class="qr-box">
        <img src="${qrCodeUrl}" alt="Your unique entry QR code" />
      </div>
      <p style="color: #555; line-height: 1.6;">You can also view your ticket online:</p>
      <a href="${params.ticketUrl}" class="cta-btn">VIEW MY TICKET</a>
    </div>
    <div class="footer">
      <p>WIHCN CON III — Beyond Leadership</p>
      <p>Building Legacy &amp; Advancing Innovation</p>
      <p>30 October 2026 · Harbour Point, Lagos</p>
      <p style="margin-top: 10px;">#WIHCNCON3</p>
    </div>
  </div>
</body>
</html>`;

  const text = `WIHCN CON III — Beyond Leadership

Dear ${params.attendeeName},

Your registration for WIHCN CON III has been confirmed.

Attendee Name: ${params.attendeeName}
Attendee ID: ${params.attendeeId}
Event Date: Friday, 30 October 2026
Venue: Harbour Point, Lagos

Your ticket and QR code are ready. View your ticket online:
${params.ticketUrl}

WIHCN CON III - Beyond Leadership
Building Legacy & Advancing Innovation
30 October 2026 - Harbour Point, Lagos
#WIHCNCON3`;

  await resend.emails.send({
    from: FROM_EMAIL,
    to: params.to,
    subject: `Registration Confirmed — WIHCN CON III | ${params.attendeeId}`,
    html,
    text,
  });
}

export async function sendResendTicketEmail(
  params: SendConfirmationParams
): Promise<void> {
  const qrCodeUrl = params.qrCodeUrl;

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { font-family: 'Montserrat', Arial, sans-serif; background: #f5f5f5; margin: 0; padding: 0; }
    .container { max-width: 600px; margin: 0 auto; background: #ffffff; }
    .header { background: #082266; padding: 40px 30px; text-align: center; }
    .header h1 { color: #ffffff; font-size: 24px; margin: 0; letter-spacing: 2px; }
    .header p { color: #61CE70; font-size: 14px; margin: 8px 0 0; letter-spacing: 1px; }
    .content { padding: 30px; }
    .content h2 { color: #082266; font-size: 20px; margin: 0 0 20px; }
    .detail-row { padding: 12px 0; border-bottom: 1px solid #eee; }
    .detail-label { font-size: 11px; text-transform: uppercase; letter-spacing: 1px; color: #888; }
    .detail-value { font-size: 16px; color: #333; margin-top: 4px; font-weight: 600; }
    .qr-box { text-align: center; margin: 20px 0; padding: 20px; border: 1px solid #eee; border-radius: 12px; background: #fdfdfd; }
    .qr-box img { width: 220px; height: 220px; }
    .cta-btn { display: inline-block; background: #082266; color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 600; font-size: 14px; letter-spacing: 1px; margin: 20px 0; }
    .footer { background: #f9f9f9; padding: 20px 30px; text-align: center; font-size: 12px; color: #888; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>WIHCN CON III</h1>
      <p>BEYOND LEADERSHIP</p>
    </div>
    <div class="content">
      <h2>Your Ticket</h2>
      <p style="color: #555; line-height: 1.6;">Here is your ticket for WIHCN CON III:</p>

      <div class="detail-row">
        <div class="detail-label">Attendee Name</div>
        <div class="detail-value">${params.attendeeName}</div>
      </div>
      <div class="detail-row">
        <div class="detail-label">Attendee ID</div>
        <div class="detail-value">${params.attendeeId}</div>
      </div>

      <p style="color: #555; line-height: 1.6; margin-top: 20px;">Present this QR code at check-in to gain entry:</p>
      <div class="qr-box">
        <img src="${qrCodeUrl}" alt="Your unique entry QR code" />
      </div>
      <a href="${params.ticketUrl}" class="cta-btn">VIEW MY TICKET</a>
    </div>
    <div class="footer">
      <p>WIHCN CON III — Beyond Leadership</p>
      <p>30 October 2026 · Harbour Point, Lagos</p>
    </div>
  </div>
</body>
</html>`;

  const text = `WIHCN CON III — Beyond Leadership

Dear ${params.attendeeName},

Here is your ticket for WIHCN CON III.

Attendee Name: ${params.attendeeName}
Attendee ID: ${params.attendeeId}
Event Date: Friday, 30 October 2026
Venue: Harbour Point, Lagos

Your ticket and QR code are ready. View your ticket online:
${params.ticketUrl}

WIHCN CON III - Beyond Leadership
30 October 2026 - Harbour Point, Lagos
#WIHCNCON3`;

  await resend.emails.send({
    from: FROM_EMAIL,
    to: params.to,
    subject: `Your Ticket — WIHCN CON III | ${params.attendeeId}`,
    html,
    text,
  });
}