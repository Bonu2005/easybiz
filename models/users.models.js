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
const getDateRange = require('../composables/utils/statistics_date.helper');
const { da } = require("date-fns/locale");
const classifyDevice = require("../composables/utils/classifyDevice.init");

otp.totp.options = { step: 120, digits: 6 };

class Users {

    constructor() {
        this.deviceDetector = new DeviceDetektor()
    }

    async get_users(req, res) {

        try {
            let find_users_count = await prisma.users.count()
            let find_role = await prisma.role.findFirst({ where: { name: "USER" } })
            console.log(find_role.id);

            let find_users = await prisma.users.findMany({ include: { role: true }, where: { roleId: find_role.id } })
            let total_page = Math.ceil(find_users_count / 20)
            return res.status(200).json({ data: find_users, total_count: find_users_count, total_page })
        } catch (error) {
            console.error("Get users error:", error);
            return res.status(500).json({ message: "Unexpected error. Please try again later." });
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

            const user = await prisma.users.findUnique({ where: { email } });
            if (!user) {
                return res.status(404).json({ message: "User not found" });
            }

            const request = await prisma.reset_Password.findUnique({ where: { email } });
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

            await prisma.reset_Password.delete({ where: { email } });

            return res.status(200).json({ message: "Password successfully reset" });
        } catch (error) {
            console.error("Reset password error:", error);
            return res.status(500).json({ message: "Unexpected error. Please try again later." });
        }
    }


    async ban_user(req, res) {
        try {
            const { error } = banValidation(req.body);
            if (error) {
                return res.status(400).json({ message: error.message });
            }

            const { userId, ban_reason } = req.body;

            const user = await prisma.users.findUnique({ where: { id: userId } });
            if (!user) {
                return res.status(404).json({ message: "User not found" });
            }

            if (user.status === "BANNED") {
                return res.status(403).json({ message: "User is already banned" });
            }

            await prisma.$transaction([
                prisma.ban.create({ data: { userId, ban_reason } }),
                prisma.users.update({ where: { id: userId }, data: { status: "BANNED" } })
            ]);

            return res.status(200).json({ message: "User successfully banned" });

        } catch (error) {
            console.error("Ban error:", error);
            return res.status(500).json({ message: "Unexpected error. Please try again later." });
        }
    }


    async activate_user(req, res) {
        try {
            const { error } = activateValidation(req.body);
            if (error) {
                return res.status(400).json({ message: error.message });
            }

            const { userId } = req.body;

            const user = await prisma.users.findUnique({ where: { id: userId } });
            if (!user) {
                return res.status(404).json({ message: "User not found" });
            }

            if (user.status === "ACTIVE") {
                return res.status(403).json({ message: "User already active" });
            }

            await prisma.$transaction([
                prisma.activation.create({
                    data: {
                        userId,
                        activation_status: "ACTIVE"
                    }
                }),
                prisma.users.update({
                    where: { id: userId },
                    data: { status: "ACTIVE" }
                }),
                prisma.ban.deleteMany({ where: { userId } })
            ]);

            return res.status(200).json({ message: "User successfully activated" });

        } catch (error) {
            console.error("Activation error:", error);
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

    async get_my_data(req, res) {
        let user = req.user;
        try {
            // let session = await checkSession(user.id, req.ip);
            // if (!session) {
            //     return res.status(401).json({ message: "not authorized" })
            // }
            console.log(user);


            let data = await prisma.users.findUnique({
                where: { id: user.id, status: "ACTIVE" },
                include: {
                    Sessions: true,
                    Ban: true,
                    Activation: true
                },
            });
            console.log(data);

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

            console.log(req.body);

            let updated_user = await prisma.users.update({ where: { id: req.user.id }, data: { username, telegram, facebook, instagram } })
            return res.status(200).json({ message: "Username updated succesfully", updated_user })
        } catch (error) {
            console.error("Update user error:", error);
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
        console.log(currentSessionId);

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
            await prisma.users.update({ where: { id: user.id }, data: { status: "PENDING" } })
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
            console.log(1);

            console.log(file.mimetype);
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

    async upload_file_media(req, res) {
        try {
            if (!req.file) {
                return res.status(400).json({ message: "No file uploaded" });
            }

            const fileUrl = `http://localhost:3300/users/file/${req.file.filename}`;
            return res.status(201).json({
                message: "File uploaded successfully",
                mediaUrl: fileUrl
            });
        } catch (err) {
            console.error("Upload error:", err);
            return res.status(500).json({ message: "Server error" });
        }

    }

    async browsers_statistics(req, res) {
        try {
            const range = getDateRange(req.path, req.query);
            const { deviceType } = req.query;
            const allowedTypes = ['MOBILE', 'DESKTOP'];
            if (deviceType && !allowedTypes.includes(deviceType.toUpperCase())) {
                return res.status(400).json({ message: "Invalid deviceType. Use 'MOBILE' or 'DESKTOP'" });
            }

            const baseWhere = {
                user: {
                    role: {
                        name: "USER"
                    }
                }
            };


            const whereClause = {
                ...baseWhere,
                ...(range ? { createdAt: range } : {}),
                ...(deviceType ? { deviceGroup: deviceType.toUpperCase() } : {})
            };
            console.log(whereClause);

            const allSessionsCount = await prisma.sessions.count({ where: whereClause });

            if (allSessionsCount === 0) {
                const fallbackWhere = {
                    user: {
                        role: {
                            name: "USER"
                        }
                    },
                    ...(deviceType ? { deviceGroup: deviceType.toUpperCase() } : {})
                };
                console.log(fallbackWhere);

                const fallbackBrowserStats = await prisma.sessions.groupBy({
                    by: ['browser'],
                    where: fallbackWhere,
                    _count: { browser: true },
                    orderBy: {
                        _count: {
                            browser: 'desc'
                        }
                    }

                });
                console.log(fallbackBrowserStats);

                const total = fallbackBrowserStats.reduce((acc, item) => acc + item._count.browser, 0);

                const fallbackResult = fallbackBrowserStats.map(item => ({
                    browser: item.browser,
                    count: item._count.browser,
                    percentage: Math.floor(((item._count.browser / total) * 100).toFixed(2)) + '%'
                }));

                return res.status(200).json({
                    message: "No data found in the given range. Returning recent stats for users with role USER.",
                    data: fallbackResult
                });
            }

            const browserStats = await prisma.sessions.groupBy({
                by: ['browser'],
                where: whereClause,
                _count: { browser: true }
            });

            const statsWithPercentages = browserStats.map(item => ({
                browser: item.browser,
                count: item._count.browser,
                percentage: Math.floor(((item._count.browser / allSessionsCount) * 100).toFixed(2)) + '%'
            }));

            res.status(200).json(statsWithPercentages);
        } catch (error) {
            console.error('Error Browser Statistic:', error);
            return res.status(500).json({ message: "Unexpected error. Please try again later." });
        }
    }

    async devices_statistics(req, res) {
        try {
            const range = getDateRange(req.path, req.query);
            const { deviceType } = req.query;
            const allowedTypes = ['MOBILE', 'DESKTOP'];
            if (deviceType && !allowedTypes.includes(deviceType.toUpperCase())) {
                return res.status(400).json({ message: "Invalid deviceType. Use 'MOBILE' or 'DESKTOP'" });
            }

            const baseWhere = {
                user: {
                    role: {
                        name: "USER"
                    }
                }
            };


            const whereClause = {
                ...baseWhere,
                ...(range ? { createdAt: range } : {}),
                ...(deviceType ? { deviceGroup: deviceType.toUpperCase() } : {})
            };

            const allSessionsCount = await prisma.sessions.count({ where: whereClause });


            if (allSessionsCount === 0) {
                const fallbackWhere = {
                    ...baseWhere,
                    ...(deviceType ? { deviceGroup: deviceType.toUpperCase() } : {})
                };

                const fallbackStats = await prisma.sessions.groupBy({
                    by: ['deviceType'],
                    where: fallbackWhere,
                    _count: { deviceType: true },
                    orderBy: {
                        _count: {
                            deviceType: 'desc'
                        }
                    }
                });

                const total = fallbackStats.reduce((acc, item) => acc + item._count.deviceType, 0);

                const fallbackResult = fallbackStats.map(item => ({
                    deviceType: item.deviceType,
                    count: item._count.deviceType,
                    percentage: Math.floor(((item._count.deviceType / total) * 100).toFixed(2)) + '%'
                }));

                return res.status(200).json({
                    message: "No data found in the given range. Returning recent stats for users with role USER.",
                    data: fallbackResult
                });
            }


            const devicesStats = await prisma.sessions.groupBy({
                by: ['deviceType'],
                where: whereClause,
                _count: { deviceType: true }
            });

            const statsWithPercentages = devicesStats.map(item => ({
                deviceType: item.deviceType,
                count: item._count.deviceType,
                percentage: Math.floor(((item._count.deviceType / allSessionsCount) * 100).toFixed(2)) + '%'
            }));

            return res.status(200).json(statsWithPercentages);

        } catch (error) {
            console.error('Error Device Statistic:', error);
            return res.status(500).json({ message: "Unexpected error. Please try again later." });
        }
    }

    async user_statistics(req, res) {
        try {
            const range = getDateRange(req.path, req.query);
            const { deviceType } = req.query;


            const allowedTypes = ['MOBILE', 'DESKTOP'];
            if (deviceType && !allowedTypes.includes(deviceType.toUpperCase())) {
                return res.status(400).json({ message: "Invalid deviceType. Use 'MOBILE' or 'DESKTOP'" });
            }

            const baseRoleFilter = {
                status: "ACTIVE",
                role: {
                    name: "USER"
                }
            };

            const where = {
                ...baseRoleFilter,
                ...(range ? { createdAt: range } : {}),
                ...(deviceType ? {
                    Sessions: {
                        some: {
                            deviceGroup: deviceType.toUpperCase()
                        }
                    }
                } : {})
            };

            const count = await prisma.users.count({ where });
            const total_page = Math.ceil(count / 20);


            if (count === 0) {
                const fallbackWhere = {
                    role: {
                        name: "USER"
                    },
                    ...(deviceType ? {
                        Sessions: {
                            some: {
                                deviceGroup: deviceType.toUpperCase()
                            }
                        }
                    } : {})
                };

                const recentUsers = await prisma.users.findMany({
                    where: fallbackWhere,
                    take: 20,
                    orderBy: {
                        createdAt: 'desc'
                    },
                    include: {
                        role: true
                    }
                });

                return res.status(200).json({
                    message: "No statistics found in given range. Returning recent users with role USER.",
                    data: {
                        total_count: 0,
                        total_page: 0,
                        recent_users: recentUsers
                    }
                });
            }

            return res.status(200).json({
                data: {
                    total_count: count,
                    total_page
                }
            });

        } catch (error) {
            console.error('Error User Statistics:', error);
            return res.status(500).json({ message: "Unexpected error. Please try again later." });
        }
    }

    async page_statistics(req, res) {
        try {
            const range = getDateRange(req.path, req.query);

            const whereClause = range ? { createdAt: range } : {};

         
            const allPageNamesRaw = await prisma.viewPages.findMany({
                select: { name: true },
                distinct: ['name'],
            });

            const allPageNames = allPageNamesRaw.map(item => item.name);

            const pageStats = await prisma.viewPages.groupBy({
                by: ['name'],
                where: whereClause,
                _count: { name: true },
            });

   
            const result = allPageNames.map(name => {
                const stat = pageStats.find(p => p.name === name);
                return {
                    name,
                    count: stat?._count.name || 0
                };
            });

            return res.status(200).json(result);
        } catch (error) {
            console.error('Error Page Statistic:', error);
            return res.status(500).json({ message: "Unexpected error. Please try again later." });
        }
    }

    async average_session_time(req, res) {
        try {
            const dateFilter = getDateRange(req.path, req.query);
            const { deviceType } = req.query;

            const allowedTypes = ['MOBILE', 'DESKTOP'];
            if (deviceType && !allowedTypes.includes(deviceType.toUpperCase())) {
                return res.status(400).json({ message: "Invalid deviceType. Use 'MOBILE' or 'DESKTOP'" });
            }

            const baseFilter = {
                NOT: { endDate: null },
                user: {
                    role: {
                        name: 'USER'
                    }
                },
                ...(dateFilter ? { date: dateFilter } : {}),
                ...(deviceType ? { deviceGroup: deviceType.toUpperCase() } : {})
            };

            let sessions = await prisma.sessions.findMany({
                where: baseFilter,
                select: {
                    date: true,
                    endDate: true
                }
            });

            // fallback если не найдено
            if (sessions.length === 0) {
                const fallbackFilter = {
                    NOT: { endDate: null },
                    user: {
                        role: {
                            name: 'USER'
                        }
                    },
                    ...(deviceType ? { deviceGroup: deviceType.toUpperCase() } : {})
                };

                sessions = await prisma.sessions.findMany({
                    where: fallbackFilter,
                    orderBy: {
                        date: 'desc'
                    },
                    take: 20,
                    select: {
                        date: true,
                        endDate: true
                    }
                });

                if (sessions.length === 0) {
                    return res.status(404).json({ message: 'No completed sessions for users with role USER' });
                }
            }

            const totalMs = sessions.reduce((acc, session) => {
                return acc + (new Date(session.endDate).getTime() - new Date(session.date).getTime());
            }, 0);

            const avgMs = totalMs / sessions.length;
            const totalMinutes = Math.floor(avgMs / 60000);
            const hours = Math.floor(totalMinutes / 60);
            const minutes = totalMinutes % 60;

            return res.json({
                averageSessionTime: `${hours}h ${minutes}m`,
                totalSessions: sessions.length,
                fallbackUsed: !!(dateFilter && sessions.length < 20)
            });

        } catch (error) {
            console.error('Error calculating average session time:', error);
            return res.status(500).json({ message: "Unexpected error. Please try again later." });
        }
    }


    async end_time_session(req, res) {
        try {
            const { sessionId, endDate } = req.body;

            if (!sessionId || !endDate) {
                return res.status(400).json({ error: 'Missing sessionId or endDate' });
            }

            const session = await prisma.sessions.findUnique({ where: { id: sessionId } });
            if (!session) return res.status(404).json({ message: 'Session not found' });
            if (session.endDate) return res.status(400).json({ message: 'Session already ended' });

            const end = new Date(endDate);
            const start = new Date(session.date);

            if (end <= start) {
                return res.status(400).json({ message: 'End time must be after start time' });
            }

            const maxSessionDuration = 24 * 60 * 60 * 1000;
            if (end - start > maxSessionDuration) {
                return res.status(400).json({ message: 'Session duration too long' });
            }

            const updated = await prisma.sessions.update({
                where: { id: sessionId },
                data: { endDate: end }
            });

            return res.json({ message: 'Session ended', session: updated });

        } catch (error) {
            console.error('Error ending session:', error);
            return res.status(500).json({ message: "Unexpected error. Please try again later." });
        }
    }

    async logout(req, res) {
        try {
            const sessionId = req.sessionId;
            const userId = req.user.id;

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

    async getLogs(req, res) {
        try {
            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 50;
            const skip = (page - 1) * limit;

            const [logs, totalLogs] = await Promise.all([
                prisma.requestLog.findMany({
                    skip,
                    take: limit,
                    orderBy: { createdAt: 'desc' },
                }),
                prisma.requestLog.count(),
            ]);

            const totalPages = Math.ceil(totalLogs / limit);

            return res.status(200).json({
                success: true,
                data: logs,
                meta: {
                    totalLogs,
                    currentPage: page,
                    totalPages,
                    limitPerPage: limit,
                },
            });
        } catch (error) {
            console.error("Error fetching request logs:", error);
            return res.status(500).json({
                success: false,
                message: "Failed to retrieve logs. Please try again later.",
            });
        }
    }


    async logPageView(req, res) {
        try {
            let { name } = req.body;

            if (!name || typeof name !== 'string') {
                return res.status(400).json({ message: 'Page name is required' });
            }

            name = name.trim().toUpperCase();

            await prisma.viewPages.create({
                data: { name },
            });

            return res.status(201).json({ message: 'Page view logged' });
        } catch (error) {
            console.error('Error logging page view:', error);
            return res.status(500).json({ message: 'Server error' });
        }

    }

}
module.exports = new Users();