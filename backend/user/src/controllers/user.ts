import prisma from "../config/db.js";
import { generateToken } from "../config/generateToken.js";
import { publishToQueue } from "../config/rabbitmq.js";
import TryCatch from "../config/TryCatch.js";
import { redisClient } from "../index.js";

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
    let user=await prisma.user.findUnique({
        where:{
            email:email
        }
    });

    if(!user){
        const name=email.slice(0,8);
        user=await prisma.user.create({
            data:{
                name:name,
                email:email
            }
        })
    }
    const token=generateToken(user);
    res.json({
        message:"User verified",
        user,
        token
    })
});