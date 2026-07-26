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
