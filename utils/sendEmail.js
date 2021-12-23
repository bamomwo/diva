const nodemailer = require('nodemailer')

const sendEmail = async (options) => {
  // Create a transporter

  const transport = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT,
    auth: {
      user: process.env.SMTP_EMAIL,
      pass: process.env.SMTP_PASSWORD,
    },
  })

  const email = {
    from: `${process.env.FROM_NAME} <${process.env.FROM_EMAIL}>`,
    to: options.email,
    subject: options.subject,
    text: options.message,
  }

  const info = await transport.sendMail(email)

  console.log(`Message Sent ${info.messageId}`)
}

module.exports = sendEmail
