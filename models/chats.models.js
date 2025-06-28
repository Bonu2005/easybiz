const prisma = require("../database/config.db")
const otp_mailer = require("../composables/machine/otp.init");
const { ChatStatus } = require("../src/generated/prisma");
const { getIo } = require("../config/socket/channel");
const { json } = require("express");
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
                        in: [ChatStatus.OPEN, ChatStatus.ACTIVE, ChatStatus.ARCHIVED, ChatStatus.CLOSED],
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
                take: 20
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
            
            getIo().to(sessionId).emit("admin_connected", {
                sessionId,
                adminId,
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
        const { content, mediaUrl } = req.body;
        const senderId = req.user.id;

        if (!content && !mediaUrl) {
            return res.status(400).json({ message: "Message must have either text or media" });
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

            if (session.status === "CLOSED") {
                return res.status(400).json({ message: "Flow is already closed" });
            }

            const messageCount = await prisma.chatMessage.count({
                where: { sessionId },
            });

            if (req.user.role === "USER" && messageCount >= 1) {
                return res.status(400).json({ message: "You can only send one flow" })
            }

            if (messageCount >= 2) {
                return res.status(403).json({ message: "This session already has two messages." });
            }






            if (req.user.role === "ADMIN" && messageCount === 1) {
                const sessionWithoutAdmin = await prisma.chatSession.findFirst({ where: { id: sessionId, adminId: null } })

                if (sessionWithoutAdmin !== null) {
                    return res.status(400).json({ message: "First You should To connect in this Session" })
                }
                await prisma.chatSession.update({
                    where: { id: sessionId },
                    data: { status: "CLOSED" },
                });
            }


            const message = await prisma.chatMessage.create({
                data: {
                    sessionId,
                    senderId,
                    content,
                    mediaUrl: mediaUrl ? mediaUrl : null,
                },
            });

            getIo().to(sessionId).emit("new_message", {
                id: message.id,
                sessionId,
                senderId,
                content,
                mediaUrl,
                createdAt: message.createdAt,
            });

            if (req.user.role === "USER") {
                getIo().to("admins").emit("client_started_chat", {
                    sessionId,
                    content,
                    mediaUrl,
                    senderId,
                    createdAt: message.createdAt,
                    client: {
                        id: session.client.id,
                        username: session.client.username,
                        email: session.client.email
                    }
                });
            }


            if (req.user.role === "ADMIN" && session.client?.email) {
                const clientEmail = session.client.email;
                const subject = "Новый ответ от администратора";

                const html = `
            <html>
            <body>
                <div style="font-family: Arial; background-color: #fff; padding: 20px;">
                    <h3>Здравствуйте, ${session.client.username}!</h3>
                    <p>Ваш запрос получил ответ от администратора:</p>
                    <blockquote style="border-left: 4px solid #007bff; padding-left: 10px;">
                        ${content ? `"${content}"` : ""}
                        ${mediaUrl ? `<br><img src="https://your-domain.com${mediaUrl}" style="max-width: 100%; margin-top: 10px;">` : ""}
                    </blockquote>
                    <p>Если у вас есть вопросы — просто ответьте.</p>
                    <p>С уважением, команда EasyBiz</p>
                </div>
            </body>
            </html>
            `;

                const mailResult = await otp_mailer({ to: clientEmail, subject }, res, html);

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
            return res.status(500).json({ message: "Server error" });
        }
    }

    async get_messages(req, res) {
        const { sessionId } = req.query;
        console.log(sessionId);

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

    async get_archive_messages(req, res) {
        try {
            let find_archive = await prisma.chatSession.findMany({ where: { status: "ARCHIVED" } })
            return res.status(200).json({ message: find_archive })
        } catch (error) {
            console.error("Error to get messages:", err);
            res.status(500).json({ message: "Something get wrong please try again" });
        }
    }

    async archive_chat_session(req, res) {
        try {
            console.log("hi");

            const { sessionId } = req.params;

            const existing = await prisma.chatSession.findUnique({
                where: { id: sessionId }
            });

            if (!existing) {
                return res.status(404).json({ message: "Chat session not found" });
            }

            // Обновляем статус
            await prisma.chatSession.update({
                where: { id: sessionId },
                data: { status: 'ARCHIVED' }
            });

            return res.status(200).json({ message: "Chat session archived successfully" });

        } catch (error) {
            console.error('Error archiving chat session:', error);
            return res.status(500).json({ message: "Unexpected error. Please try again later." });
        }
    }

    async isReadChat(req, res) {
        const { messageId } = req.params;

        const message = await prisma.chatMessage.findUnique({ where: { id: messageId } });

        if (!message) return res.status(404).json({ message: 'Not found' });

        await prisma.chatMessage.update({
            where: { id: messageId },
            data: { isRead: true }
        });
        return res.status(200).json({ message: "IsRead updated successfully" })
    }

    async addFavorite(req, res) {
        const { messageId } = req.params;


        try {
            const alreadyExists = await prisma.favoriteMessage.findUnique({
                where: { messageId },
            });

            if (alreadyExists) {
                return res.status(400).json({ message: 'Message already in favorites' });
            }

            await prisma.favoriteMessage.create({
                data: { messageId },
            });

            return res.status(201).json({ message: 'Added to favorites' });
        } catch (error) {
            console.error('Add favorite error:', error);
            return res.status(500).json({ message: 'Server error' });
        }
    }

    async removeFavorite(req, res) {
        const { messageId } = req.params;
        try {
            const alreadyExists = await prisma.favoriteMessage.findUnique({
                where: { messageId },
            });

            if (!alreadyExists) {
                return res.status(400).json({ message: 'Message already removed from favorites' });
            }

            await prisma.favoriteMessage.delete({
                where: { messageId },
            });

            return res.status(200).json({ message: 'Removed from favorites' });
        } catch (error) {
            console.error('Remove favorite error:', error);
            return res.status(404).json({ message: 'Favorite not found' });
        }
    }

    async getFavorites(req, res) {
        try {
            const favorites = await prisma.favoriteMessage.findMany({
                include: {
                    message: {
                        include: {
                            session: true,
                            sender: {
                                select: {
                                    id: true,
                                    username: true,
                                },
                            },
                        },
                    },
                },
                orderBy: { createdAt: 'desc' },
            });

            return res.status(200).json(favorites);
        } catch (error) {
            console.error('Get favorites error:', error);
            return res.status(500).json({ message: 'Server error' });
        }
    }

    async getClosedChts(req, res) {
        try {
            let find_closed = await prisma.chatSession.findMany({ where: { status: "CLOSED" } })
            return res.status(200).json({ message: find_closed })
        } catch (error) {
            console.error("Error to get messages:", err);
            res.status(500).json({ message: "Something get wrong please try again" });
        }
    }
}

module.exports = new Chats()