const nodemailer = require("nodemailer");

const otp_mailer = async (options, res, otp) => {
  
    const { to, subject } = options;
    const settings = {
        from: "sardorsamurai@gmail.com",
        to,
        subject,
        html: otp.digit
    }

    const parameters = {
        host: "smtp.gmail.com",
        port: 465,
        secure: true,
        auth: {
            user: "sardorsamurai@gmail.com",
            pass: "intuenofxagqghtw"
        }
    }

    const transporter = await nodemailer.createTransport(parameters);

    return await transporter.sendMail(settings)
        .then(response => {
            if (response.rejected.length !== 0) {
                return res.status(403).json({ error: "Handler error!" })
            } else {
                return res.status(200).json({ message: "Message sent!", otp })
            }
        })

}

module.exports = otp_mailer;