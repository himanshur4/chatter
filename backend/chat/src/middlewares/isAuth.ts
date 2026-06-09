import type { NextFunction, Request, Response } from "express";
import jwt from 'jsonwebtoken';

export interface AuthenticatedRequest extends Request{
    user?:{
        id:string
    }
}

export const isAuth=async(req:AuthenticatedRequest,res:Response,next:NextFunction):Promise<void>=>{
    try {
        const authHeader=req.headers.authorization;

        if(!authHeader || !authHeader.startsWith("Bearer ")){
            res.status(401).json({ message: "Not authorized, no token provided" });
            return;
        }

        const token = authHeader.split(" ")[1] as string;

        if (!token) {
            res.status(401).json({ message: "Not authorized, please provide a token" });
            return;
        }

        const decoded=jwt.verify(token,process.env.JWT_SECRET as string) as {userId:string}

        req.user={
            id:decoded.userId
        }

        next();

    } catch (error) {
        res.status(401).json({
            message: "Please Login - JWT error"
        });
    }
}