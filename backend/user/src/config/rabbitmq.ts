import amqp from 'amqplib'

export let channel: amqp.Channel;

export const connectRabbitMQ = async () => {
    try {
        // `recovery` makes amqplib retry (with backoff) until RabbitMQ is reachable, and
        // reconnect by itself if the connection drops later (e.g. RabbitMQ restarts)
        const connection= await amqp.connect({
            protocol: "amqp",
            hostname: process.env.Rabbitmq_Host || "host",
            port: 5672,
            username: process.env.Rabbitmq_Username || "user",
            password: process.env.Rabbitmq_password || "password",
        }, {
            recovery: {
                // Runs after every (re)connect: channels don't survive a reconnect, so open a fresh one
                setup: async (model: amqp.ChannelModel) => {
                    channel = await model.createChannel();
                },
            },
        });

        connection.on("disconnect", (error) => console.log("❌ RabbitMQ disconnected, reconnecting:", error.message));
        connection.on("connect", () => console.log("✅ reconnected to rabbitmq"));
        connection.on("error", (error) => console.log("❌ RabbitMQ connection error:", error.message));
        console.log("✅ connected to rabbitmq");
    } catch (error) {
        console.log("❌ Failed to connect to RabbitMQ:", error);
    }
};

export const publishToQueue=async(queueName:string,message:any)=>{
    if(!channel){
        console.log("Rabbitmq channel is not initialized");
        return;    
    }

    await channel.assertQueue(queueName,{durable:true});

    channel.sendToQueue(queueName,Buffer.from(JSON.stringify(message)),{
        persistent:true,
    })
}