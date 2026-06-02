import amqp from 'amqplib'
import dotenv from 'dotenv';
dotenv.config();

export let channel: amqp.Channel;

export const connectRabbitMQ = async () => {
    try {
        const connection= await amqp.connect({
            protocol: "amqp",
            hostname: process.env.Rabbitmq_Host || "host",
            port: 5672,
            username: process.env.Rabbitmq_Username || "user",
            password: process.env.Rabbitmq_password || "password",
        });

        channel = await connection.createChannel();
        console.log("✅ connected to rabbitmq");
    } catch (error) {
        console.log("❌ Failed to connect to RabbitMQ:", error);
    }
};

export const publishToQueue=async(queueName:string,message:any)=>{
    if(!channel){
        console.log("Rabbitmq channel if not initialized");
        return;    
    }

    await channel.assertQueue(queueName,{durable:true});

    channel.sendToQueue(queueName,Buffer.from(JSON.stringify(message)),{
        persistent:true,
    })
}