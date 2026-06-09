import axios from "axios";
import prisma from "../config/db.js";
import TryCatch from "../config/TryCatch.js";
import type { AuthenticatedRequest } from "../middlewares/isAuth.js";

export const createNewChat = TryCatch(async (req: AuthenticatedRequest, res) => {
    const userId = req.user?.id as string;
    const { otherUserId } = req.body

    if (!otherUserId) {
        res.status(400).json({
            message: "Other userId is required"
        });
        return;
    }
    const potentialChats = await prisma.chat.findMany({
        where: {
            users: {
                hasEvery: [userId, otherUserId]
            }
        }
    });

    const existingChat = potentialChats.find(chat => chat.users.length === 2)

    if (existingChat) {
        res.status(200).json({
            message: "Chat already exists",
            chatId: existingChat.id,
        });
        return;
    }

    const newChat = await prisma.chat.create({
        data: {
            users: [userId, otherUserId]
        }
    })
    res.status(201).json({
        message: "New chat created",
        chatId: newChat.id
    })
});

export const getAllChats = TryCatch(async (req: AuthenticatedRequest, res) => {
    const userId = req.user?.id;

    if (!userId) {
        res.status(400).json({
            message: "UserId missing",
        });
        return;
    }

    const chats = await prisma.chat.findMany({
        where: {
            users: {
                has: userId
            }
        },
        orderBy: {
            updatedAt: "desc"
        }
    });

    const chatDataWithDetails = Promise.all(
        chats.map(async (chat) => {
            const otherUserId = chat.users.find((id) => id !== userId);
            let otherUserData = null;

            if (otherUserId) {
                try {
                    const response = await axios.get(`${process.env.USER_SERVICE}/api/v1/user/${otherUserId}`);

                    if (response.data && response.data.user) {
                        otherUserData = {
                            id: response.data.user.id,
                            name: response.data.user.name,
                        }
                    }
                } catch (error) {
                    console.error(`Failed to fetch user data for ID ${otherUserId}:`, error);
                }
            }

            const unseenCount = await prisma.message.count({
                where: {
                    chatId: chat.id,
                    sender: otherUserId as string,
                    seen: false
                }
            })

            return {
                id: chat.id,
                users: chat.users,
                latestMessage: chat.latestMessage,
                latestSender: chat.latestSender,
                updatedAt: chat.updatedAt,
                otherUser: otherUserData,
                unseenCount: unseenCount

            }
        })

    );
    res.status(200).json({
        success: true,
        chats: chatDataWithDetails
    })
})