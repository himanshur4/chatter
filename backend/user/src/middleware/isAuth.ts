import type { User } from "@prisma/client"
import {type NextFunction, type Request, type Response } from "express"
import jwt from "jsonwebtoken";
import prisma from "../config/db.js";

export interface AuthenticatedRequest extends Request{
    user?:User;
}

export const isAuth=async(req:AuthenticatedRequest,res:Response,next:NextFunction):Promise<void>=>{
    try {
        const authHeader=req.headers.authorization;
        if(!authHeader || !authHeader.startsWith("Bearer ")){
            res.status(401).json({message:"Not authorized, no token provided"});
            return;
        }

        const token=authHeader.split(" ")[1] as string;

        const decoded=jwt.verify(token,process.env.JWT_SECRET as string) as unknown as {userId:string};

        const user=await prisma.user.findUnique({
            where:{
                id:decoded.userId
            }
        })
        if(!user){
            res.status(401).json({
                message:"Not authorized, user not found"
            });
            return;
        }

        req.user=user;
        next();

    } catch (error) {
        res.status(401).json({
            message:"Not authorized, invalid or expired token"
        })
    }
}