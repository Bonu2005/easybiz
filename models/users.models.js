const otp = require("otplib");
const otp_mailer = require("../composables/machine/otp.init");
const prisma = require("../database/config.db")
const bcrypt = require("bcrypt")
const stringToHash = require("../composables/utils/hash.init");
const resetPasswordValidation = require("../validations/resetPassword.validation");
const {isStrongPassword} = require("../validations/password.validation");
const DeviceDetektor = require("device-detector-js");
const checkSession = require("../composables/utils/check_sessions.init");
const updateSelfValidation = require("../validations/updateSelf.validation");

otp.totp.options = { step: 120, digits: 6 };

class Users {
    constructor() {
        this.deviceDetector = new DeviceDetektor()
    }
    async get_my_data(req, res) {
        let user = req.user;
        try {
   
            let data = await prisma.users.findUnique({
                where: { id: user.id, status: "ACTIVE" },
                include: {
                    Sessions: true,
                    Ban: true,
                    Activation: true
                },
            });
    

            if (!data) {
                return res.status(401).json({ message: "not authorized" })
            }
            return res.status(200).json(data);
        } catch (error) {
            console.error("Get my data error:", error);
            return res.status(500).json({ message: "Unexpected error. Please try again later." });
        }
    }

    async update_user(req, res) {
        try {

            let { error } = updateSelfValidation(req.body)
            if (error) {
                return res.status(400).json({ message: error.message });
            }
            let { username, telegram, facebook, instagram } = req.body;
            let mediaConflicts = [];

            if (telegram) {
                const existingTelegram = await prisma.users.findFirst({ where: { telegram } });
                if (existingTelegram) mediaConflicts.push("telegram");
            }

            if (facebook) {
                const existingFacebook = await prisma.users.findFirst({ where: { facebook } });
                if (existingFacebook) mediaConflicts.push("facebook");
            }

            if (instagram) {
                const existingInstagram = await prisma.users.findFirst({ where: { instagram } });
                if (existingInstagram) mediaConflicts.push("instagram");
            }

            if (mediaConflicts.length > 0) {
                return res.status(400).json({
                    message: `User with this ${mediaConflicts.join(", ")} already exists.`,
                });
            }


            let updated_user = await prisma.users.update({ where: { id: req.user.id }, data: { username, telegram, facebook, instagram } })
            return res.status(200).json({ message: "Username updated succesfully", updated_user })
        } catch (error) {
            console.error("Update user error:", error);
            return res.status(500).json({ message: "Unexpected error. Please try again later." });
        }
    }

    async send_otp_reset(req, res) {
        try {
            const { to, subject } = req.body;
            if (!to || !subject) {
                return res.status(403).json({ error: "Email and subject are required!" });
            }

            const find_user = await prisma.users.findUnique({ where: { email: to } });
            if (!find_user) {
                return res.status(404).json({ message: "User not found" });
            }

            const existingRequest = await prisma.reset_Password.findUnique({ where: { email: to } });
            const now = new Date();

            if (existingRequest && now < existingRequest.expiresAt) {
                return res.status(429).json({
                    message: "OTP already sent recently. Please wait until it expires.",
                    expiresAt: existingRequest.expiresAt
                });
            }
            otp.totp.options = {
                step: 300,
                window: [1, 0]
            };
            const secret = stringToHash(to);
            const otp_code = otp.totp.generate(secret);
            const step = otp.totp.options.step || 300;
            const expiresAt = new Date(Date.now() + step * 1000);

            await prisma.reset_Password.upsert({
                where: { email: to },
                update: {
                    secret,
                    expiresAt,
                    otpVerified: false,
                },
                create: {
                    userId: find_user.id,
                    email: to,
                    secret,
                    expiresAt,
                    otpVerified: false,
                }
            });

            const parameters = {
                digit: otp_code,
                expires_at: step,
                secret,
            };

            const result = await otp_mailer({ to, subject }, res, parameters);

            if (result.success) {
                return res.status(200).json({ message: "OTP sent successfully" });
            } else {
                return res.status(500).json({ message: "Failed to send OTP", error: result.error || result.rejected });
            }

        } catch (error) {
            console.error("Send OTP error:", error);
            return res.status(500).json({ message: "Unexpected error. Please try again later." });
        }
    }

    async verify_otp_reset(req, res) {
        try {
            const { otp_code, email } = req.body;

            const user = await prisma.users.findUnique({ where: { email ,status:"ACTIVE"} });
            if (!user) {
                return res.status(404).json({ message: "User not found" });
            }

            const request = await prisma.reset_Password.findFirst({ where: { email } });
            if (!request || new Date() > request.expiresAt) {
                return res.status(400).json({ message: "OTP expired. Please request again." });
            }

            if (request.otpVerified) {
                return res.status(400).json({ message: "OTP already verified." });
            }

            const isValid = otp.totp.check(otp_code, request.secret);
            if (!isValid) {
                return res.status(400).json({ message: "Wrong OTP code" });
            }

            await prisma.reset_Password.update({
                where: { email },
                data: { otpVerified: true }
            });

            return res.status(200).json({ message: "OTP verified. You can now reset your password." });

        } catch (error) {
            console.error("Verify OTP error:", error);
            return res.status(500).json({ message: "Unexpected error. Please try again later." });
        }
    }

    async reset_password(req, res) {
        try {
            const { email, newPassword } = req.body;

            const { error } = resetPasswordValidation(req.body);
            if (error) {
                return res.status(400).json({ message: error.message });
            }

            if (!isStrongPassword(newPassword)) {
                return res.status(400).json({ message: "Password should include uppercase, lowercase and number." });
            }

            const user = await prisma.users.findUnique({ where: { email ,status:"ACTIVE"} });

            if (!user) {
                return res.status(404).json({ message: "User not found" });
            }

            const resetRequest = await prisma.reset_Password.findUnique({ where: { email } });
            if (!resetRequest || !resetRequest.otpVerified || new Date() > resetRequest.expiresAt) {
                return res.status(403).json({ message: "OTP not verified or expired" });
            }

            const hashed = await bcrypt.hash(newPassword, 10);
            await prisma.users.update({
                where: { email },
                data: { password: hashed }
            });

            await prisma.reset_Password.delete({ where: { email } });

            return res.status(200).json({ message: "Password successfully reset" });
        } catch (error) {
            console.error("Reset password error:", error);
            return res.status(500).json({ message: "Unexpected error. Please try again later." });
        }
    }

    async get_my_session(req, res) {
        let user = req.user;
        try {

            let session = await checkSession(user.id, req.ip);
            if (!session) {
                return new UnauthorizedException('Unauthorized');
            }

            let data = await prisma.sessions.findMany({
                where: { userId: user.id }
            });

            return res.status(200).json({ data });
        } catch (error) {
            console.error("My session error:", error);
            return res.status(500).json({ message: "Unexpected error. Please try again later." });
        }
    }

    async del_my_session(req, res) {
        const user = req.user;
        const { id } = req.params;
        const currentSessionId = req.sessionId
        try {
            const session = await prisma.sessions.findUnique({ where: { id } });
            if (!session) {
                return res.status(404).json({ message: "Session not found" });
            }
            if (session.userId !== user.id) {
                return res.status(403).json({ message: "Not authorized to delete this session" });
            }
            if (currentSessionId === session.id) {
                return res.status(400).json({ message: "You cannot delete the session you are currently using" });
            }

            await prisma.sessions.delete({ where: { id } });
            return res.json({ message: "Session deleted" });
        } catch (error) {
            console.error("Del My Session error:", error);
            return res.status(500).json({ message: "Unexpected error. Please try again later." });
        }
    }

    async upload_file(req, res) {
        try {
            const file = req.file;
            const userId = req.user.id;
            const filename = req.file.filename;
            const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
           
            if (!allowedTypes.includes(file.mimetype)) {

                return res.status(400).json({ message: "You can download only images (jpeg, png, webp)" });
            }
            await prisma.users.update({
                where: { id: userId },
                data: { image: filename }
            });

            res.status(201).json({ data: ` http://localhost:3300/users/image/${filename}` });
        } catch (error) {
            console.error('Error Upload File:', error);
            return res.status(500).json({ message: "Unexpected error. Please try again later." });
        }
    }

    async logout(req, res) {
        try {
            const sessionId = req.sessionId;
            res.clearCookie('refresh_token', {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'Strict'
            });


            await prisma.sessions.delete({
                where: { id: sessionId },
            }).catch(err => {

                if (err.code !== 'P2025') {
                    throw err;
                }
            });

            return res.status(200).json({ message: "Logged out successfully" });

        } catch (error) {
            console.error("Logout error:", error);
            return res.status(500).json({ message: "Logout failed. Try again later." });
        }
    }

}
module.exports = new Users();