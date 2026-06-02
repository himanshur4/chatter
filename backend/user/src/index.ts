import express from 'express';
import dotenv from 'dotenv';
import { connectDb } from './config/db.js';
import { createClient } from 'redis';
import userRoutes from './routes/user.js'
import { connectRabbitMQ } from './config/rabbitmq.js';


dotenv.config();

export const redisClient = createClient({
  url: process.env.REDIS_URL as string,
});
const app = express();
const PORT = process.env.PORT || 5000;

app.use("/api/v1",userRoutes);

redisClient
  .connect()
  .then(() => console.log("connected to redis"))
  .catch(console.error);

app.use(express.json());

app.listen(PORT, async () => {
  console.log(`[User Service] Server is running on port ${PORT}`);
  await connectDb();
  await connectRabbitMQ();
});