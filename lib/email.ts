import { Resend } from 'resend'

const FROM = 'BidVip <onboarding@resend.dev>'

export async function sendEmail(to: string, subject: string, html: string) {
  const resend = new Resend(process.env.RESEND_API_KEY!)
  await resend.emails.send({ from: FROM, to, subject, html })
}

export function bidEmail(projektNev: string, osszeg: number) {
  return {
    subject: `New bid on your project: ${projektNev}`,
    html: `
      <p>Hi,</p>
      <p>Someone placed a <strong>€${osszeg.toLocaleString()}</strong> bid on your project <strong>${projektNev}</strong> on BidVip.</p>
      <p>Log in to your dashboard to see the latest bids.</p>
      <p>— BidVip Team</p>
    `,
  }
}

export function approvalEmail(projektNev: string) {
  return {
    subject: `Your project is live: ${projektNev}`,
    html: `
      <p>Hi,</p>
      <p>Great news — your project <strong>${projektNev}</strong> has been reviewed and is now live on the BidVip marketplace!</p>
      <p>Buyers can now discover and bid on it.</p>
      <p>— BidVip Team</p>
    `,
  }
}

export function rejectionEmail(projektNev: string) {
  return {
    subject: `Update on your project: ${projektNev}`,
    html: `
      <p>Hi,</p>
      <p>Unfortunately your project <strong>${projektNev}</strong> did not meet our listing requirements and was not approved.</p>
      <p>You are welcome to submit a revised version with more detail.</p>
      <p>— BidVip Team</p>
    `,
  }
}

export function purchaseSellerEmail(projektNev: string, osszeg: number, vevoEmail: string) {
  return {
    subject: `Your project was sold: ${projektNev}`,
    html: `
      <p>Hi,</p>
      <p>Congratulations! Your project <strong>${projektNev}</strong> was purchased for <strong>€${osszeg.toLocaleString()}</strong>.</p>
      <p>The buyer's email: <strong>${vevoEmail}</strong></p>
      <p>Please get in touch with them to arrange the handover.</p>
      <p>— BidVip Team</p>
    `,
  }
}

export function purchaseBuyerEmail(projektNev: string, osszeg: number) {
  return {
    subject: `Purchase confirmed: ${projektNev}`,
    html: `
      <p>Hi,</p>
      <p>Your purchase of <strong>${projektNev}</strong> for <strong>€${osszeg.toLocaleString()}</strong> is confirmed.</p>
      <p>The seller will contact you shortly to arrange the handover.</p>
      <p>— BidVip Team</p>
    `,
  }
}

export function auctionWinnerEmail(projektNev: string, osszeg: number, paymentUrl: string) {
  return {
    subject: `You won the auction: ${projektNev}`,
    html: `
      <p>Hi,</p>
      <p>Congratulations — you placed the winning bid on <strong>${projektNev}</strong> for <strong>€${osszeg.toLocaleString()}</strong>!</p>
      <p>To receive the full project details and files, complete your payment:</p>
      <p><a href="${paymentUrl}" style="background:#7c3aed;color:white;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:bold;">Pay Now →</a></p>
      <p style="color:#888;font-size:12px;">This payment link expires in 24 hours. If you have any questions, reply to this email.</p>
      <p>— BidVip Team</p>
    `,
  }
}

export function purchaseBuyerDetailedEmail(projektNev: string, reszletesLeiras: string, fajlok: Array<{nev: string; url: string; tipus: string}>) {
  const fajlListHTML = fajlok.length > 0
    ? `<h3>Files & Documents</h3><ul>${fajlok.map(f => `<li><a href="${f.url}">${f.nev}</a></li>`).join('')}</ul>`
    : ''
  return {
    subject: `Project unlocked: ${projektNev}`,
    html: `
      <p>Hi,</p>
      <p>Your payment was confirmed. Here are the full details for <strong>${projektNev}</strong>:</p>
      <hr/>
      <h3>Full Description</h3>
      <p style="white-space:pre-wrap">${reszletesLeiras}</p>
      ${fajlListHTML}
      <hr/>
      <p>The seller has been notified of your purchase and will reach out to arrange the handover.</p>
      <p>— BidVip Team</p>
    `,
  }
}
