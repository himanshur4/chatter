import amqp from 'amqplib';
import { Resend } from 'resend';
import dotenv from 'dotenv';

dotenv.config();

const resend = new Resend(process.env.RESEND_API_KEY || '');

const queueName="send-otp";

// Opens a channel and starts consuming. amqplib re-runs this after every reconnect,
// because channels don't survive a dropped connection.
const consumeOtpQueue=async(connection:amqp.ChannelModel)=>{
    const channel=await connection.createChannel();

    await channel.assertQueue(queueName,{durable:true});

    console.log("✅ Mail service consumer started, listening for otp emails");

    await channel.consume(queueName,async(msg)=>{
        if(msg){
            try {
                const {to,subject,body}=JSON.parse(msg.content.toString())

                await resend.emails.send({
                   from: process.env.RESEND_FROM_EMAIL || '',
                   to,
                   subject,
                   text:body
                });

                console.log(`OTP mail sent to ${to}`);

                channel.ack(msg);
            } catch (error) {
                console.log("Failed to send OTP",error);
            }
        }
    })
}

export const startSendOtpConsumer=async()=>{
    try {
        // `recovery` makes amqplib retry (with backoff) until RabbitMQ is reachable, and
        // reconnect by itself if the connection drops later (e.g. RabbitMQ restarts)
        const connection=await amqp.connect({
            protocol: "amqp",
            hostname: process.env.Rabbitmq_Host || "host",
            port: 5672,
            username: process.env.Rabbitmq_Username || "user",
            password: process.env.Rabbitmq_password || "password",
        },{
            recovery:{setup:consumeOtpQueue},
        });

        connection.on("disconnect",(error)=>console.log("RabbitMQ disconnected, reconnecting...",error.message));
        connection.on("error",(error)=>console.log("RabbitMQ connection error",error.message));
    } catch (error) {
        console.log("Failed to start rabbitmq consumer",error);
    }
}
