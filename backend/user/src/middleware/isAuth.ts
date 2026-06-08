import type { User } from "@prisma/client";
import type { NextFunction, Request, Response } from "express";
import jwt, { type JwtPayload } from 'jsonwebtoken';
import prisma from "../config/db.js";

export interface AuthenticatedRequest extends Request {
    user?: User;
}

export const isAuth = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            res.status(401).json({
                message: "Unauthorized, Bad request"
            });
            return;
        }

        const token = authHeader.split(" ")[1] as string;

        if (!token) {
            res.status(401).json({
                message: "Unauthorized, please provide a token"
            });
            return;
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as { userId: string }

        const user = await prisma.user.findUnique({
            where: {
                id: decoded.userId
            }
        });

        if (!user) {
            res.status(401).json({
                message: "Unauthorized, user not found"
            });
            return;
        }
        req.user = user;
        next();
    } catch (error) {
        res.status(401).json({
            message: "Please Login - JWT error"
        });
    }
}