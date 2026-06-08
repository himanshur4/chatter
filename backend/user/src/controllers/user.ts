import prisma from "../config/db.js";
import { generateToken } from "../config/generateToken.js";
import { publishToQueue } from "../config/rabbitmq.js";
import TryCatch from "../config/TryCatch.js";
import { redisClient } from "../index.js";
import type { AuthenticatedRequest } from "../middleware/isAuth.js";

export const loginUser = TryCatch(async (req, res) => {
    const { email } = req.body;

    const rateLimitKey = `otp:ratelimit:${email}`

    const rateLimit = await redisClient.get(rateLimitKey);

    if (rateLimit) {
        res.status(429).json({
            message: "Too many requests, Please wait before requesting new one"
        });
        return;
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    const otpKey = `otp:${email}`

    await redisClient.set(otpKey, otp, {
        EX: 300,
    });

    await redisClient.set(rateLimitKey, "true", {
        EX: 60,
    });

    const message = {
        to: email,
        subject: "Your otp code",
        body: `Your OTP is ${otp}. It is valid for 5 minutes.`
    };

    await publishToQueue("send-otp", message);

    res.status(200).json({
        message: "OTP sent to your mail"
    })
})


export const verifyUser = TryCatch(async (req, res) => {
    const { email, otp: enteredOTP } = req.body;
    if (!email || !enteredOTP) {
        res.status(400).json({
            message: "email and otp required"
        });
        return;
    }
    const otpKey = `otp:${email}`;
    const storedOtp = await redisClient.get(otpKey);
    if (!storedOtp || storedOtp !== enteredOTP) {
        res.status(400).json({
            message: "Invalid or expired OTP",
        });
        return;
    }
    await redisClient.del(otpKey);
    let user = await prisma.user.findUnique({
        where: {
            email: email
        }
    });

    if (!user) {
        const name = email.slice(0, 8);
        user = await prisma.user.create({
            data: {
                name: name,
                email: email
            }
        })
    }
    const token = generateToken(user.id);
    res.json({
        message: "User verified",
        user,
        token
    })
});

export const myProfile = TryCatch(async (req: AuthenticatedRequest, res) => {
    const user = req.user
    res.status(200).json({
        user
    })
});

export const updateName=TryCatch(async(req:AuthenticatedRequest, res)=>{
    const user=req.user;
    const {name}=req.body;
    if(!user){
        res.status(400).json({
            message:"Please login to continue"
        });
        return;
    }
    if(!name || name.trim().length==0){
        res.status(400).json({
            message:"name cannot be empty"
        })
    }
    const updatedUser=await prisma.user.update({
        where:{
            id:user.id
        },
        data:{
            name:name
        }
    });

    const token=generateToken(updatedUser.id);
    
    res.status(200).json({
        updatedUser,
        token
    })

}); 

export const getAUser=TryCatch(async(req,res)=>{
    const userId=req.params.id as string
    const user=await prisma.user.findUnique({
        where:{
            id:userId
        }
    });
    if(!user){
        res.status(404).json({
            message:"User not found"
        });
        return;
    }
    res.status(200).json({
        user
    });
});

export const getAllUsers=TryCatch(async(req:AuthenticatedRequest,res)=>{
    const users=await prisma.user.findMany();
    res.status(200).json({
        users
    });
});
