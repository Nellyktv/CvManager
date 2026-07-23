import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT),
  secure: Number(process.env.SMTP_PORT) === 465,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASSWORD,
  },
});

const mailService = {
  async sendActivationMail(email, activationLink) {
    await transporter.sendMail({
      from: process.env.SMTP_USER,
      to: email,
      subject: `Активация аккаунта на ${process.env.API_URL}`,
      html: `
        <div>
          <h1>Для активации перейдите по ссылке</h1>
          <a href="${activationLink}">${activationLink}</a>
        </div>
      `,
    });
  },
};

export default mailService;
