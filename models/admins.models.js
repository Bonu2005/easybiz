const otp = require("otplib");
const prisma = require("../database/config.db")
const banValidation = require("../validations/ban.validation");
const activateValidation = require("../validations/activate.validation");
const DeviceDetektor = require("device-detector-js");
otp.totp.options = { step: 120, digits: 6 };

class Admins {
    constructor() {
        this.deviceDetector = new DeviceDetektor()
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

    async deleteUser(req, res) {
        try {
            const { email } = req.body
            const find_email = await prisma.users.findFirst({ where: { email } })
            if (!find_email) {
                return res.status(404).json({ message: "User with this email not found " })
            }
            const del = await prisma.users.delete({ where: { email } })
            console.log("User deleted");
            return res.status(200).json({ message: "User deleted succesfully" })

        } catch (error) {
            console.error('Error delete User:', error);
            return res.status(500).json({ message: 'Server error' });
        }
    }

}
module.exports = new Admins();