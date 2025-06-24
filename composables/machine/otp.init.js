const nodemailer = require("nodemailer");

const otp_mailer = async (options, res, otp) => {
    const { to, subject } = options;

    const settings = {
        from: "sardorsamurai@gmail.com",
        to,
        subject,
        html: otp?.digit 
        ? `<html>
              <body style="font-family: Arial, sans-serif; padding: 20px; background-color: #f4f4f4;">
                  <div style="max-width: 600px; margin: auto; background-color: #ffffff; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); padding: 30px;">
                      <h2 style="color: #333; text-align: center;">Ваш OTP код</h2>
                      <p style="font-size: 18px; color: #555;">Для завершения процесса, используйте следующий одноразовый пароль:</p>
                      <div style="text-align: center; font-size: 24px; font-weight: bold; padding: 15px; background-color: #007bff; color: white; border-radius: 5px; width: 100px; margin: 20px auto;">
                          ${otp.digit}
                      </div>
                      <p style="color: #777; text-align: center;">Этот код действителен в течение 10 минут.</p>
                  </div>
              </body>
            </html>`
        : otp,  
    };

    const parameters = {
        host: "smtp.gmail.com",
        port: 465,
        secure: true,
        auth: {
            user: "sardorsamurai@gmail.com",
            pass: "intuenofxagqghtw"
        }
    };

    const transporter = await nodemailer.createTransport(parameters);

    try {
        const response = await transporter.sendMail(settings);
        return {
            success: response.rejected.length === 0,
            rejected: response.rejected,
            otp,
        };
    } catch (error) {
        return {
            success: false,
            error,
        };
    }
};

module.exports = otp_mailer;
