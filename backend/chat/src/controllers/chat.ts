import axios from "axios";
import prisma from "../config/db.js";
import TryCatch from "../config/TryCatch.js";
import type { AuthenticatedRequest } from "../middlewares/isAuth.js";
import { getReceiverSocketId, io } from "../config/socket.js";

export const createNewChat = TryCatch(
  async (req: AuthenticatedRequest, res) => {
    const userId = req.user?.id as string;
    const { otherUserId } = req.body;

    if (!otherUserId) {
      res.status(400).json({
        message: "Other userId is required",
      });
      return;
    }
    const potentialChats = await prisma.chat.findMany({
      where: {
        users: {
          hasEvery: [userId, otherUserId],
        },
      },
    });

    const existingChat = potentialChats.find((chat) => chat.users.length === 2);

    if (existingChat) {
      res.status(200).json({
        message: "Chat already exists",
        chatId: existingChat.id,
      });
      return;
    }

    const newChat = await prisma.chat.create({
      data: {
        users: [userId, otherUserId],
      },
    });
    res.status(201).json({
      message: "New chat created",
      chatId: newChat.id,
    });
  },
);

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
        has: userId,
      },
    },
    orderBy: {
      updatedAt: "desc",
    },
  });

  const chatDataWithDetails = await Promise.all(
    chats.map(async (chat) => {
      const otherUserId = chat.users.find((id) => id !== userId);
      let otherUserData = null;

      if (otherUserId) {
        try {
          const response = await axios.get(
            `${process.env.USER_SERVICE}/api/v1/user/${otherUserId}`,
          );

          if (response.data && response.data.user) {
            otherUserData = {
              id: response.data.user.id,
              name: response.data.user.name,
            };
          }
        } catch (error) {
          console.error(
            `Failed to fetch user data for ID ${otherUserId}:`,
            error,
          );
        }
      }

      const unseenCount = await prisma.message.count({
        where: {
          chatId: chat.id,
          sender: otherUserId as string,
          seen: false,
        },
      });

      return {
        id: chat.id,
        users: chat.users,
        latestMessage: chat.latestMessage,
        latestSender: chat.latestSender,
        updatedAt: chat.updatedAt,
        otherUser: otherUserData,
        unseenCount: unseenCount,
      };
    }),
  );
  res.status(200).json({
    success: true,
    chats: chatDataWithDetails,
  });
});

export const sendMessage = TryCatch(async (req: AuthenticatedRequest, res) => {
  const senderId = req.user?.id as string;
  const { chatId, text } = req.body;
  const imageFile = req.file as any;

  if (!senderId) {
    res.status(401).json({
      message: "Unauthorized: Sender ID required",
    });
    return;
  }

  if (!chatId) {
    res.status(400).json({
      message: "ChatId Required",
    });
    return;
  }
  if (!text && !imageFile) {
    res.status(400).json({
      message: "Either text or image is required",
    });
    return;
  }

  const safeChatId = String(chatId);

  const chat = await prisma.chat.findFirst({
    where: {
      id: safeChatId,
      users: { has: senderId },
    },
  });

  if (!chat) {
    res.status(404).json({
      message: "Chat not found or you are not a participant",
    });
    return;
  }

  const otherUserId = chat.users.find(
    (userId) => userId.toString() !== senderId.toString(),
  );

  if (!otherUserId) {
    res.status(401).json({
      message: "No other user",
    });
    return;
  }

  const isImage = !!imageFile;
  const messageType = isImage ? "image" : "text";
  const latestMessageText = isImage ? "📷 Image" : text;
  const safeText = text ? String(text) : undefined;
  // socket setup
  const receiverSocketId = getReceiverSocketId(otherUserId.toString());
  let isReceiverInChatRoom = false;

  if (receiverSocketId) {
    const receiverSocket = io.sockets.sockets.get(receiverSocketId);
    if (receiverSocket && receiverSocket.rooms.has(safeChatId)) {
      isReceiverInChatRoom = true;
    }
  }

  let savedMessage = await prisma.message.create({
    data: {
      chatId: safeChatId,
      sender: senderId,
      messageType: messageType,
      seen: isReceiverInChatRoom,
      ...(safeText && { text: safeText }),
      ...(isImage && {
        image: {
          url: imageFile.path,
          publicId: imageFile.filename,
        },
      }),
    },
  });

  await prisma.chat.update({
    where: {
      id: safeChatId,
    },
    data: {
      latestMessage: latestMessageText,
      latestSender: senderId,
    },
  });

  if (receiverSocketId) {
    io.to(receiverSocketId).emit("newMessage", savedMessage);
  }

  const senderSocketId = getReceiverSocketId(senderId.toString());
  if (senderSocketId) {
    io.to(senderSocketId).emit("newMessage", savedMessage);
  }

  if (isReceiverInChatRoom && senderSocketId) {
    io.to(senderSocketId).emit("messagesSeen", {
      chatId: safeChatId,
      seenBy: otherUserId,
      messageId: [savedMessage.id],
    });
  }

  res.status(201).json({
    message: savedMessage,
    sender: senderId,
  });
});

export const getMessagesByChat = TryCatch(
  async (req: AuthenticatedRequest, res) => {
    const userId = req.user?.id;
    const { chatId } = req.params;
    if (!userId) {
      res.status(401).json({
        message: "Unauthorized: User ID required",
      });
      return;
    }

    if (!chatId) {
      res.status(400).json({
        message: "ChatId Required",
      });
      return;
    }

    const chat = await prisma.chat.findFirst({
      where: {
        id: chatId as string,
        users: { has: userId },
      },
    });

    if (!chat) {
      res.status(404).json({
        message: "Chat not found or you are not a receipient",
      });
      return;
    }
    const messagesToMarkSeen = await prisma.message.findMany({
      where: {
        chatId: chatId as string,
        sender: { not: userId },
        seen: false,
      },
    });
    await prisma.message.updateMany({
      where: {
        chatId: chatId as string,
        sender: { not: userId },
        seen: false,
      },
      data: {
        seen: true,
        seenAt: new Date(),
      },
    });

    const messages = await prisma.message.findMany({
      where: {
        chatId: chatId as string,
      },
      orderBy: {
        createdAt: "asc",
      },
    });

    const otherUserId = chat.users.find((id) => id !== userId);
    if (!otherUserId) {
      res.status(400).json({
        message: "No other user found in this chat",
      });
      return;
    }
    try {
      const response = await axios.get(
        `${process.env.USER_SERVICE}/api/v1/user/${otherUserId}`,
      );

      if (messagesToMarkSeen.length > 0) {
        const otherUserSocketId = getReceiverSocketId(otherUserId.toString());

        if (otherUserSocketId) {
          io.to(otherUserSocketId).emit("messagesSeen", {
            chatId: chatId,
            seenBy: userId,
            messageIds: messagesToMarkSeen.map((msg) => msg.id),
          });
        }
      }

      res.json({
        messages,
        user: response.data.user,
      });
    } catch (error) {
      console.log(`Failed to fetch user data for ID ${otherUserId}:`, error);
      res.json({
        messages,
        user: { id: otherUserId, name: "Unknown User" },
      });
    }
  },
);
