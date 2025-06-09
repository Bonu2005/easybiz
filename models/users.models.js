const otp = require("otplib");
const otp_mailer = require("../composables/machine/otp.init");
const prisma = require("../database/config.db")
const bcrypt = require("bcrypt")
const TokenService = require("../composables/machine/token.init");
const stringToHash = require("../composables/utils/hash.init");
const userValidation = require("../validations/user.validation");
const banValidation = require("../validations/ban.validation");
const activateValidation = require("../validations/activate.validation");
const resetPasswordValidation = require("../validations/resetPassword.validation");
const isStrongPassword = require("../validations/password.validation");
const DeviceDetektor = require("device-detector-js");
const checkSession = require("../composables/utils/check_sessions.init");
const updateSelfValidation = require("../validations/updateSelf.validation");

otp.totp.options = { step: 120, digits: 6 };

class Users {
    constructor() {
        this.deviceDetector = new DeviceDetektor()
    }

    async get_users(req, res) {

        try {
            let find_users_count = await prisma.users.count()
            let find_users = await prisma.users.findMany({ include: { role: true } })
            let total_page = Math.ceil(find_users_count / 20)
            return res.status(200).json({ data: find_users, total_count: find_users_count, total_page })
        } catch (error) {
            return res.status(400).json({ message: "Unexpected error!", error: error.message })
        }
    }

    async signup(req, res) {
        let { error } = userValidation(req.body);

        if (error) {
            return res.status(400).json({ message: error.message });
        }
        let { username, email, password, roleId, telegram, facebook, instagram } = req.body;


        if (!isStrongPassword(password)) {
            return res.status(400).json({ message: "Password should have minimum one UpperCase one LowerCase and Number" })
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
                return res.status(400).json({ message: "User with this email or username already exists." });
            }

            let find_media = await prisma.users.findFirst({
                where: {
                    OR: [
                        { telegram },
                        { facebook },
                        { instagram }
                    ]
                }
            });

            if (find_media) {
                return res.status(400).json({ message: "User with this telegram,facebook or instagram already exists." });
            }

            let hash_pass = bcrypt.hashSync(password, 10);
            await prisma.users.create({ data: { username, email, password: hash_pass, roleId: exist_role.id, telegram, facebook, instagram } });
            return res.status(200).json({ message: "Verify your account", data: { username, email } });
        } catch (error) {
            return res.status(400).json({ message: "Unexpected error!", error: error.message })
        }
    }


    async send_otp(req, res) {
        try {
            const options = {
                to: req.body.to,
                subject: req.body.subject,
            }
            const to = options.to
            for (const key in options) {
                const value = options[key];

                if (!value) return res.status(403).json({ error: `${key} is required!` });
            }
            let exist_user = await prisma.users.findFirst({
                where: { email: to }
            });

            if (!exist_user) {
                return res.status(404).json({ message: "User with this email not found" });
            }

            let secret = `${stringToHash(options.to)}`;

            const otp_code = otp.totp.generate(secret);

            const parameters = {
                digit: otp_code,
                expires_at: otp.totp.options.step,
                secret
            }

            return otp_mailer(options, res, parameters);
        } catch (error) {
            return res.status(400).json({ message: "Unexpected error", error: error.message })
        }

    }

    async verify_otp(req, res) {
        try {
            const { otp_code, email } = req.body
            let exist_user = await prisma.users.findFirst({
                where: { email }
            });

            if (!exist_user) {
                return res.status(404).json({ message: "User with this email not found" });
            }
            const match = otp.totp.check(otp_code, stringToHash(email))
            if (match) {
                await prisma.users.update({ where: { email }, data: { status: "ACTIVE" } })
                return res.status(200).json({ message: "Account successfully activated" })
            }
            return res.status(400).json({ message: "Wrong OTP code" })
        } catch (error) {
            return res.status(400).json({ message: "Unexpected error", error: error.message })
        }
    }

    async signin(req, res) {
        try {
            const { email, password } = req.body;

            const user = await prisma.users.findUnique({ where: { email } });
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

            const deviceShort = `${device.device?.type || 'Unknown device'}, ${device.device?.brand || 'Unknown brand'}, ${device.os?.name || 'Unknown OS'}, ${device.client?.name || 'Unknown browser'}`;
            const deviceDescription = `${deviceShort}, вход: ${loginTime.toLocaleString()}`;
            console.log(1);

            let session = await prisma.sessions.findFirst({
                where: {
                    userId: user.id,
                    ip: req.ip
                }
            });

            if (!session || !session.info.startsWith(deviceShort)) {
                await prisma.sessions.create({
                    data: {
                        ip: req.ip,
                        userId: user.id,
                        location: req.body.location || null,
                        info: deviceDescription,
                        deviceType: device.device?.type || 'Unknown device',
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
                role: role.name
            };

            const access_token = TokenService.generate_access_token(payload);
            const refresh_token = TokenService.generate_refresh_token(payload);

            res.cookie("refresh_token", refresh_token, {
                httpOnly: true,
                maxAge: 129600000 // 1.5 days
            });

            return res.status(200).json({
                message: "Successfully login!",
                accessToken: access_token
            });
        } catch (error) {
            return res.status(400).json({ message: "Unexpected error", error: error.message });
        }
    }

    async ban_user(req, res) {
        try {
            let { error } = banValidation(req.body);

            if (error) {
                return res.status(400).json({ message: error.message });
            }
            const { userId, ban_reason } = req.body
            const find_user = await prisma.users.findUnique({ where: { id: userId } })
            if (!find_user) {
                return res.status(404).json({ message: "User not found" })
            }
            const find_bun_user = await prisma.ban.findFirst({ where: { userId } })
            if (find_bun_user) {
                return res.status(403).json({ message: "User already banned" })
            }

            await prisma.ban.create({ data: { userId, ban_reason } })
            await prisma.users.update({ where: { id: userId }, data: { status: "BANNED" } })
            return res.status(200).json({ message: "User successfully banned" })
        } catch (error) {
            return res.status(400).json({ message: "Unexpected error", error: error.message })
        }

    }

    async activate_user(req, res) {
        try {
            console.log(req.user);

            let { error } = activateValidation(req.body);
            if (error) {
                return res.status(400).json({ message: error.message });
            }
            const { userId } = req.body
            const find_user = await prisma.users.findUnique({ where: { id: userId } })
            if (!find_user) {
                return res.status(404).json({ message: "User not found" })
            }
            const find_active_user = await prisma.activation.findFirst({ where: { userId } })
            if (find_active_user) {
                return res.status(403).json({ message: "User already activated" })
            }
            await prisma.activation.create({ data: { userId, activation_status: "ACTIVE" } })
            await prisma.users.update({ where: { id: userId }, data: { status: "ACTIVE" } })
            return res.status(200).json({ message: "User successfully activated" })
        } catch (error) {
            return res.status(400).json({ message: "Unexpected error", error: error.message })
        }

    }

    async send_otp_reset(req, res) {
        try {
            const options = {
                to: req.body.to,
                subject: req.body.subject,
            };

            for (const key in options) {
                const value = options[key];
                if (!value) return res.status(403).json({ error: `${key} is required!` });
            }

            const to = options.to;

            const find_user = await prisma.users.findUnique({ where: { email: to } });
            if (!find_user) {
                return res.status(404).json({ message: "User not found" });
            }



            const secret = stringToHash(options.to);
            const otp_code = otp.totp.generate(secret);

            const expiresAt = new Date(Date.now() + otp.totp.options.step * 2 * 60 * 1000);

            await prisma.reset_Password.upsert({
                where: { email: options.to },
                update: {
                    expiresAt,
                    otpVerified: false,
                },
                create: {
                    userId: find_user.id,
                    email: options.to,
                    expiresAt,
                    otpVerified: false,
                }
            });

            const parameters = {
                digit: otp_code,
                expires_at: otp.totp.options.step,
                secret,
            };
            return otp_mailer(options, res, parameters);

        } catch (error) {
            return res.status(400).json({ message: "Unexpected error", error: error.message })
        }
    }

    async verify_otp_reset(req, res) {
        try {
            const { otp_code, email } = req.body;
            const user = await prisma.users.findUnique({ where: { email } });

            if (!user) {
                return res.status(404).json({ message: "User not found" });
            }

            const match = otp.totp.check(otp_code, stringToHash(email));
            if (!match) {
                return res.status(400).json({ message: "Wrong OTP code" });
            }

            const request = await prisma.reset_Password.findUnique({ where: { email } });

            if (!request || new Date() > request.expiresAt) {
                return res.status(400).json({ message: "OTP request expired. Please request again." });
            }

            await prisma.reset_Password.update({
                where: { email },
                data: { otpVerified: true }
            });

            return res.status(200).json({ message: "OTP verified. You can now reset your password." });

        } catch (error) {
            return res.status(400).json({ message: "Unexpected error", error: error.message })
        }
    }

    async reset_password(req, res) {
        try {
            const { email, newPassword } = req.body;

            let { error } = resetPasswordValidation(req.body);
            if (error) {
                return res.status(400).json({ message: error.message });
            }
            if (!isStrongPassword(newPassword)) {
                return res.status(400).json({ message: "Password should have min one UpperCase ,one LowerCase and Number" })
            }
            const user = await prisma.users.findUnique({ where: { email } });
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

            await prisma.reset_Password.delete({
                where: { email }
            });

            return res.status(200).json({ message: "Password successfully reset" });

        } catch (error) {
            return res.status(400).json({ message: "Unexpected error", error: error.message })
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
            return res.status(400).json({ message: "Unexpected error", error: error.message })
        }

    }

    async get_my_data(req, res) {
        let user = req.user;
        try {
            let session = await checkSession(user.id, req.ip);
            if (!session) {
                return res.status(401).json({ message: "not authorized" })
            }

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
            return res.status(400).json({ message: "Unexpected error", error: error.message })
        }
    }

    async update_user(req, res) {
        try {

            let { error } = updateSelfValidation(req.body)
            if (error) {
                return res.status(400).json({ message: error.message });
            }
            let { username } = req.body;
            let updated_user = await prisma.users.update({ where: { id: req.user.id }, data: { username } })
            return res.status(200).json({ message: "Username updated succesfully", updated_user })
        } catch (error) {
            return res.status(400).json({ message: "Unexpected error", error: error.message })
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
                where: { userId: user.id },
                include: { user: true }
            });

            return res.status(200).json({ data });
        } catch (error) {
            return res.status(400).json({ message: "Unexpected error", error: error.message })
        }
    }

    async del_my_session(req, res) {
        const user = req.user;
        const { id } = req.params;

        try {
            const session = await prisma.sessions.findUnique({ where: { id } });
            if (!session) {
                return res.status(404).json({ message: "Session not found" });
            }
            if (session.userId !== user.id) {
                return res.status(403).json({ message: "Not authorized to delete this session" });
            }
            await prisma.users.update({ where: { id: user.id }, data: { status: "PENDING" } })
            await prisma.sessions.delete({ where: { id } });
            return res.json({ message: "Session deleted" });
        } catch (error) {
            return res.status(400).json({ message: "Unexpected error", error: error.message });
        }
    }

    async upload_file(req, res) {
        try {
            const userId = req.user.id;
            const filename = req.file.filename;

            await prisma.users.update({
                where: { id: userId },
                data: { image: filename }
            });

            res.status(201).json({ data: ` http://localhost:3300/users/image/${filename}` });
        } catch (error) {
            res.status(500).json({ message: "Error updating image", error: error.message });
        }
    }

    async end_time_session(req, res) {
        const { sessionId, endDate } = req.body;

        if (!sessionId || !endDate) {
            return res.status(400).json({ error: 'Missing sessionId or endDate' });
        }

        let session = await prisma.sessions.findFirst({
            where: {
                id: sessionId
            }
        });

        if (!session) {
            return res.status(404).json({ message: 'SessionId not found' });
        }

        try {
            const updatedSession = await prisma.sessions.update({
                where: { id: sessionId },
                data: { endDate: new Date(endDate) },
            });

            return res.json({ message: 'Session end time updated', updatedSession });
        } catch (error) {
            return res.status(400).json({ message: "Unexpected error", error: error.message });
        }
    }

    async average_session_time(req, res) {
        try {
            const sessions = await prisma.sessions.findMany({
                where: {
                    NOT: {
                        endDate: null
                    }
                },
                select: {
                    date: true,
                    endDate: true
                }
            });

            if (sessions.length === 0) {
                return res.status(404).json({ message: 'No completed sessions found' });
            }

            const totalTimeMs = sessions.reduce((acc, session) => {
                const duration = new Date(session.endDate) - new Date(session.date);
                return acc + duration;
            }, 0);

            const avgTimeMs = totalTimeMs / sessions.length;
            const avgTimeSeconds = Math.floor(avgTimeMs / 1000);

            const hours = Math.floor(avgTimeSeconds / 3600);
            const minutes = Math.floor((avgTimeSeconds % 3600) / 60);

            return res.json({
                averageSiteTime: `${hours}h ${minutes}m`
            });

        } catch (error) {
            return res.status(500).json({
                message: 'Error calculating average session time',
                error: error.message
            });
        }
    }

    async browsers_statistics(req, res) {
        try {
            const allSessionsCount = await prisma.sessions.count();

            const browserStats = await prisma.sessions.groupBy({
                by: ['browser'],
                _count: { browser: true }
            });
            const statsWithPercentages = browserStats.map(item => ({
                browser: item.browser,
                count: item._count.browser,
                percentage: Math.floor(((item._count.browser / allSessionsCount) * 100).toFixed(2)) + '%'
            }));

            res.status(200).json(statsWithPercentages);

        } catch (error) {
            return res.status(400).json({ message: "Unexpected error!", error: error.message })
        }
    }

    async devices_statistics(req, res) {
        try {
            const allSessionsCount = await prisma.sessions.count();

            const devicesStats = await prisma.sessions.groupBy({
                by: ['deviceType'],
                _count: { deviceType: true }
            });
            const statsWithPercentages = devicesStats.map(item => ({
                deviceType: item.deviceType,
                count: item._count.deviceType,
                percentage: Math.floor(((item._count.deviceType / allSessionsCount) * 100).toFixed(2)) + '%'
            }));

            res.status(200).json(statsWithPercentages);

        } catch (error) {
            return res.status(400).json({ message: "Unexpected error!", error: error.message })
        }
    }

    async user_statistics(req, res) {
        try {
            let find_users_count = await prisma.users.count({ where: { status: "ACTIVE" } })

            let total_page = Math.ceil(find_users_count / 20)

            return res.status(200).json({ data: { total_count: find_users_count, total_page } })

        } catch (error) {
            return res.status(400).json({ message: "Unexpected error!", error: error.message })
        }
    }

}
module.exports = new Users();