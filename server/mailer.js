import nodemailer from "nodemailer"

function getTransporter() {
  const port = Number(process.env.SMTP_PORT) || 465

  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port,
    secure: process.env.SMTP_SECURE !== "false",
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  })
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;")
}

export async function sendContactEmail({ name, email, subject, message }) {
  const transporter = getTransporter()
  const to = process.env.CONTACT_TO_EMAIL || "support@setuai.com"
  const from = process.env.SMTP_FROM || process.env.SMTP_USER
  const siteName = process.env.SITE_NAME || "SETU"

  const safeName = escapeHtml(name)
  const safeEmail = escapeHtml(email)
  const safeSubject = escapeHtml(subject)
  const safeMessage = escapeHtml(message).replaceAll("\n", "<br>")

  const inquiryHtml = `
    <div style="font-family: Arial, sans-serif; color: #2a2826; line-height: 1.6; max-width: 640px;">
      <h2 style="color: #3f4a54; margin-bottom: 8px;">New website inquiry</h2>
      <p style="margin-top: 0; color: #6b6560;">A visitor submitted the contact form on ${siteName}.</p>
      <table style="width: 100%; border-collapse: collapse; margin-top: 20px;">
        <tr><td style="padding: 8px 0; font-weight: 600; width: 120px;">Name</td><td style="padding: 8px 0;">${safeName}</td></tr>
        <tr><td style="padding: 8px 0; font-weight: 600;">Email</td><td style="padding: 8px 0;"><a href="mailto:${safeEmail}">${safeEmail}</a></td></tr>
        <tr><td style="padding: 8px 0; font-weight: 600;">Subject</td><td style="padding: 8px 0;">${safeSubject}</td></tr>
      </table>
      <div style="margin-top: 20px; padding: 16px; background: #f3f0eb; border-radius: 12px;">
        <p style="margin: 0 0 8px; font-weight: 600;">Message</p>
        <p style="margin: 0;">${safeMessage}</p>
      </div>
    </div>
  `

  await transporter.sendMail({
    from,
    to,
    replyTo: email,
    subject: `[SETU Website] ${subject}`,
    html: inquiryHtml,
    text: [
      "New website inquiry",
      "",
      `Name: ${name}`,
      `Email: ${email}`,
      `Subject: ${subject}`,
      "",
      "Message:",
      message,
    ].join("\n"),
  })

  if (process.env.SEND_USER_CONFIRMATION === "true") {
    await transporter.sendMail({
      from,
      to: email,
      subject: `We received your message — ${siteName}`,
      html: `
        <div style="font-family: Arial, sans-serif; color: #2a2826; line-height: 1.6; max-width: 640px;">
          <h2 style="color: #3f4a54;">Thank you, ${safeName}</h2>
          <p>We have received your inquiry and our team will get back to you shortly.</p>
          <p style="margin-top: 20px; color: #6b6560;">Subject: <strong>${safeSubject}</strong></p>
        </div>
      `,
      text: `Thank you, ${name}. We received your inquiry about "${subject}" and will get back to you shortly.`,
    })
  }
}
