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

export function launchEmail() {
  return {
    subject: `BidVip is live — claim your 50 free tokens`,
    html: `
      <p>Hi,</p>
      <p>You signed up to be notified — and the moment is here. <strong>BidVip is now live!</strong></p>
      <p>BidVip is the marketplace where you develop your startup idea with AI, then auction it to the highest bidder — transparently and securely.</p>
      <p>As one of our early supporters, <strong>you'll receive 50 free tokens</strong> when you create your account (first 2,000 users only).</p>
      <p style="margin:24px 0;">
        <a href="https://bidvip.vercel.app/auth" style="background:#7c3aed;color:white;padding:12px 28px;border-radius:999px;text-decoration:none;font-weight:bold;">Create Your Account →</a>
      </p>
      <p style="color:#888;font-size:12px;">You're receiving this because you signed up for early access at bidvip.vercel.app. <a href="https://bidvip.vercel.app">Unsubscribe</a></p>
      <p>— BidVip Team</p>
    `,
  }
}

export function auctionSellerEmail(projektNev: string, osszeg: number, eladoKap: number) {
  return {
    subject: `Your auction ended: ${projektNev}`,
    html: `
      <p>Hi,</p>
      <p>Your auction for <strong>${projektNev}</strong> has ended with a winning bid of <strong>€${osszeg.toLocaleString()}</strong>.</p>
      <p>The winner is completing their payment now. Once confirmed, you will receive:</p>
      <ul>
        <li>The buyer's contact details</li>
        <li><strong>€${eladoKap.toLocaleString()}</strong> (after BidVip's 10% platform fee)</li>
      </ul>
      <p style="color:#888;font-size:12px;">The platform fee covers secure escrow, AI vetting, and marketplace access.</p>
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
