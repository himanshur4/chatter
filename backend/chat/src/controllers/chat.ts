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

    if(existingChat){
        res.status(200).json({
            message:"Chat already exists",
            chatId:existingChat.id,
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
})