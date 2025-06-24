const prisma = require("../database/config.db")
const otp_mailer = require("../composables/machine/otp.init");
const { ChatStatus } = require("../src/generated/prisma");
const { getIo } = require("../config/socket/channel");
class Chats {
    async start_chat(req, res) {
        const clientId = req.user.id;

        try {
            const existingSession = await prisma.chatSession.findFirst({
                where: {
                    clientId,
                    status: {
                        in: [ChatStatus.ACTIVE, ChatStatus.OPEN],
                    },
                },
            });

            if (existingSession) {
                return res.status(200).json({
                    message: "You already have Active session",
                    session: existingSession,
                });
            }


            const newSession = await prisma.chatSession.create({
                data: {
                    clientId,
                    status: ChatStatus.OPEN,
                },
            });

            res.status(201).json({
                message: "Flow created successfully",
                session: newSession,
            });

        } catch (error) {
            console.error("flow created error:", error);
            res.status(500).json({ message: "Something get wrong please try again" });
        }
    }

    async get_flows(req, res) {
        try {
            const sessions = await prisma.chatSession.findMany({
                where: {
                    status: {
                        in: [ChatStatus.OPEN, ChatStatus.ACTIVE],
                    },
                },
                include: {

                    client: {
                        select: {
                            id: true,
                            username: true,
                            image: true,
                        },
                    },
                    admin: {
                        select: {
                            id: true,
                            username: true,
                        },
                    },
                    messages: {
                        select: {
                            id: true,
                            content: true,
                            senderId: true,
                            createdAt: true
                        },
                        orderBy: {
                            createdAt: "desc",
                        },

                    },



                },
                orderBy: {
                    updatedAt: "desc",
                },
                take: 1
            });

            res.status(200).json(sessions);
        } catch (err) {
            console.error("error to get flows:", err);
            res.status(500).json({ message: "Something get wrong please try again" });
        }
    }

    async connect_chat_session(req, res) {
        const adminId = req.user.id;
        const { sessionId } = req.params;
        console.log(sessionId);


        try {
            const session = await prisma.chatSession.findFirst({
                where: { id: sessionId },
            });

            if (!session) {
                return res.status(404).json({ message: "Flow dont found" });
            }

            if (session.status === "CLOSED") {
                return res.status(400).json({ message: "Flow is already closed" });
            }

            const updated = await prisma.chatSession.update({
                where: { id: sessionId },
                data: {
                    adminId,
                    status: "ACTIVE",
                },
            });

            res.status(200).json({
                message: "Admin connected to chat successfully",
                session: updated,
            });

        } catch (error) {
            console.error("Error to connect admin to chat_session:", error);
          
            res.status(500).json({ message: "Something get wrong please try again" });
        }
    }

    async send_message(req, res) {
        const { sessionId } = req.params;
        const { content } = req.body;
        const senderId = req.user.id;

        if (!content) {
            return res.status(400).json({ message: "Message can not be empty" });
        }

        try {
            const session = await prisma.chatSession.findFirst({
                where: { id: sessionId },
                include: {
                    client: true,
                    admin: true,
                },
            });

            if (!session) {
                return res.status(404).json({ message: "Session not found" });
            }

            const message = await prisma.chatMessage.create({
                data: {
                    sessionId,
                    senderId,
                    content,
                },
            });
            getIo().to(sessionId).emit("new_message", {
                id: message.id,
                sessionId,
                senderId,
                content,
                createdAt: message.createdAt,
            });
            // Если отправитель — админ, отправим письмо клиенту
            if (req.user.role === "ADMIN" && session.client?.email) {
                const clientEmail = session.client.email;
                const subject = "Новый ответ от администратора";
                const text = `
    <html>
    <body style="font-family: Arial, sans-serif; margin: 0; padding: 0; background-color: #f4f4f4;">
        <div style="max-width: 600px; margin: auto; background-color: #ffffff; padding: 40px 20px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
            <h2 style="text-align: center; color: #333;">Здравствуйте, ${session.client.username}!</h2>
            <p style="font-size: 18px; text-align: center; color: #555; ">Мы рады сообщить, что ваш запрос получил ответ от администратора.</p>
            <p style="font-size: 16px; color: #555;">Вот текст ответа:</p>
            <div style="background-color: #f9f9f9; border-left: 4px solid #007bff; padding: 10px 14px; margin: 20px 0; font-size: 16px; color: #333;">
                <p style="font-style: italic;">"${content}"</p>
            </div>
            <p style="font-size: 16px; color: #555;">Если у вас возникнут дополнительные вопросы, не стесняйтесь ответить на это письмо, и мы с радостью вам поможем.</p>
            <p style="font-size: 16px; color: #555;">С уважением,</p>
            <p style="font-size: 16px; font-weight: bold; color: #333;">Поддержка EasyBiz</p>
        </div>
    </body>
</html>

    `;

                const mailResult = await otp_mailer({ to: clientEmail, subject }, res, text);

                if (!mailResult.success) {
                    console.error("Ошибка при отправке письма:", mailResult.error || mailResult.rejected);
                    return res.status(500).json({ message: "Message saved, but failed to send email." });
                }
            }

            return res.status(201).json({
                message: "Message sent successfully",
                data: message,
            });
        } catch (err) {
            console.error("Ошибка при отправке сообщения:", err);
            return res.status(500).json({ message: "Ошибка сервера" });
        }
    }

    async get_messages(req, res) {
        const { sessionId } = req.params;

        try {
            const session = await prisma.chatSession.findFirst({
                where: { id: sessionId },
            });

            if (!session) {
                return res.status(404).json({ message: "Session not found" });
            }

            const messages = await prisma.chatMessage.findMany({
                where: { sessionId },
                orderBy: { createdAt: "asc" },
                include: {
                    sender: {
                        select: {
                            id: true,
                            username: true,
                            role: true,
                            image: true,
                        },
                    },
                },
            });

            res.status(200).json(messages);
        } catch (err) {
            console.error("Error to get messages:", err);
            res.status(500).json({ message: "Something get wrong please try again" });
        }
    }
}

module.exports = new Chats()