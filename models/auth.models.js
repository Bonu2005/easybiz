const otp = require("otplib");
const otp_mailer = require("../composables/machine/otp.init");
const prisma = require("../database/config.db")
const bcrypt = require("bcrypt")
const TokenService = require("../composables/machine/token.init");
const stringToHash = require("../composables/utils/hash.init");
const userValidation = require("../validations/user.validation");
const {isStrongPassword} = require("../validations/password.validation");
const DeviceDetektor = require("device-detector-js");
const classifyDevice = require("../composables/utils/classifyDevice.init");
const {validateEmail} = require("../validations/password.validation");

otp.totp.options = { step: 120, digits: 6 };

class Auth {
    constructor() {
        this.deviceDetector = new DeviceDetektor()
    }

    async signup(req, res) {
       
        let { username, email, password, roleId, telegram, facebook, instagram } = req.body;
        console.log(req.body);
        
        const emailValidation = validateEmail(email);

        if (!emailValidation.isValid) {
            return res.status(400).json({
                message: "Email недействителен.",
                errors: emailValidation.errors
            });
        }

        
    
        
        if (!isStrongPassword(password)) {
            console.log(1);
            
            return res.status(400).json({ message: "Password should have minimum one UpperCase one LowerCase and Number and without anyother symbols" })
        }
        let { error } = userValidation(req.body);

        if (error) {
            return res.status(400).json({ message: error.message });
        }



        try {
            let exist_role = await prisma.role.findUnique({ where: { id: roleId } })
            let exist_user = await prisma.users.findFirst({
                where: {
                    email
                }
            });
            if (!exist_role) {
                return res.status(404).json({ message: "Role with this id  not found." });
            }
            if (exist_user) {
                return res.status(400).json({ message: "User with this email already exists." });
            }

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


            let hash_pass = await bcrypt.hash(password, 10);
            await prisma.users.create({ data: { username, email, password: hash_pass, roleId: exist_role.id, telegram, facebook, instagram } });
            return res.status(200).json({ message: "Verify your account", data: { username, email } });
        } catch (error) {
            console.error("Sign Up error:", error);
            return res.status(500).json({ message: "Unexpected error. Please try again later." });
        }
    }

    async send_otp(req, res) {
        try {
            const { to, subject } = req.body;

            if (!to || !subject) {
                return res.status(400).json({ message: "Email and subject are required!" });
            }

            const user = await prisma.users.findUnique({ where: { email: to } });

            if (!user) {
                return res.status(404).json({ message: "User with this email not found" });
            }

            const existingOtp = await prisma.email_verification.findFirst({
                where: {
                    email: to,
                    expiresAt: { gt: new Date() },
                },
                orderBy: { createdAt: 'desc' }
            });

            if (existingOtp) {
                return res.status(429).json({
                    message: "OTP already sent recently. Please wait until it expires.",
                    expiresAt: existingOtp.expiresAt,
                });
            }

            await prisma.email_verification.deleteMany({
                where: { email: to }
            });


            otp.totp.options = {
                step: 180,
                window: [1, 0],
            };

            const secret = stringToHash(to);
            const otpCode = otp.totp.generate(secret);
            const expiresInSeconds = otp.totp.options.step || 180;
            const expiresAt = new Date(Date.now() + expiresInSeconds * 1000);


            await prisma.email_verification.create({
                data: {
                    userId: user.id,
                    email: to,
                    secret,
                    expiresAt: expiresAt,
                }
            });

            const parameters = {
                digit: otpCode,
                expires_at: expiresInSeconds,
            };

            const result = await otp_mailer({ to, subject }, res, parameters);

            if (result.success) {
                return res.status(200).json({ message: "OTP sent successfully", otp: parameters });
            } else {
                return res.status(500).json({ message: "Failed to send OTP", error: result.error || result.rejected });
            }

        } catch (error) {
            console.error("Send OTP error:", error);
            return res.status(500).json({ message: "Unexpected error. Please try again later." });
        }
    }

    async verify_otp(req, res) {
        try {
            const { otp_code, email } = req.body;

            if (!otp_code || !email) {
                return res.status(400).json({ message: "OTP code and email are required" });
            }

            const user = await prisma.users.findUnique({ where: { email } });

            if (!user) {
                return res.status(404).json({ message: "User with this email not found" });
            }

            const otpRequest = await prisma.email_verification.findFirst({
                where: {
                    email,
                    expiresAt: { gt: new Date() }
                },
                orderBy: { createdAt: 'desc' }
            });

            if (!otpRequest) {
                return res.status(400).json({ message: "No active OTP found or OTP expired" });
            }


            const isValid = otp.totp.check(otp_code, otpRequest.secret);

            if (!isValid) {
                return res.status(400).json({ message: "Invalid OTP code" });
            }

            await prisma.users.update({
                where: { email },
                data: { status: "ACTIVE" }
            });

            await prisma.email_verification.delete({
                where: { id: otpRequest.id }
            });

            return res.status(200).json({ message: "Account successfully activated" });

        } catch (error) {
            console.error("Verify OTP error:", error);
            return res.status(500).json({ message: "Unexpected error. Please try again later." });
        }
    }

    async signin(req, res) {
        try {
            const { email, password } = req.body;

            const user = await prisma.users.findUnique({ where: { email ,status:"ACTIVE"} });
            if (!user) {
                return res.status(404).json({ message: "User with this email not found" });
            }

            const isPasswordCorrect = await bcrypt.compare(password, user.password);
            if (!isPasswordCorrect) {
                return res.status(403).json({ message: "Invalid credentials" });
            }

            const loginTime = new Date();
            const useragent = req.headers["user-agent"];
            const device = this.deviceDetector.parse(useragent);

            const deviceType = device.device?.type || 'Unknown device';
            const deviceShort = `${device.device?.type || 'Unknown device'}, ${device.device?.brand || 'Unknown brand'}, ${device.os?.name || 'Unknown OS'}, ${device.client?.name || 'Unknown browser'}`;
            const deviceDescription = `${deviceShort}, logged: ${loginTime.toLocaleString()}`;



            const deviceGroup = classifyDevice(deviceType);

            let session = await prisma.sessions.findFirst({
                where: {
                    userId: user.id,
                    ip: req.ip
                }
            });

            if (!session || !session.info.startsWith(deviceShort)) {
                session = await prisma.sessions.create({
                    data: {
                        ip: req.ip,
                        userId: user.id,
                        location: req.body.location || null,
                        info: deviceDescription,
                        deviceType: device.device?.type || 'Unknown device',
                        deviceGroup: deviceGroup,
                        browser: device.client?.name || 'Unknown browser',
                    }
                });
            }

            const role = await prisma.role.findUnique({ where: { id: user.roleId } });
            if (!role) {
                return res.status(404).json({ message: "Role not found" });
            }

            const payload = {
                id: user.id,
                status: user.status,
                role: role.name,
                sessionId: session.id,
            };

            const access_token = TokenService.generate_access_token(payload);
            const refresh_token = TokenService.generate_refresh_token(payload);

            res.cookie("refresh_token", refresh_token, {
                httpOnly: true,
                maxAge: 129600000
            });

            return res.status(200).json({
                message: "Successfully login!",
                accessToken: access_token
            });
        } catch (error) {
            console.error("Sign In error:", error);
            return res.status(500).json({ message: "Unexpected error. Please try again later." });
        }
    }


    async refresh_token(req, res) {
        try {
            let user = req.user
            let updateUser = await prisma.users.update({ where: { id: user.id }, data: { was_online: new Date() } })
            if (!updateUser) {
                return new UnauthorizedException('Unauthorized');
            }
            const payload = {
                id: user.id,
                status: user.status,
                role: user.role
            };

            const access_token = TokenService.generate_access_token(payload);
            return res.status(200).json({ access_token, updateUser })
        } catch (error) {
            console.error("Refresh token error:", error);
            return res.status(500).json({ message: "Unexpected error. Please try again later." });
        }

    }

}
module.exports = new Auth();