import express from 'express';
import dotenv from 'dotenv';
import { connectDb } from './config/db.js';
import chatRoutes from './routes/chat.js';
import cors from "cors"

dotenv.config();

const app = express();
const port = process.env.PORT;

app.use(express.json());
app.use(cors());

app.use("/api/v1", chatRoutes);

app.listen(port, async () => {
    console.log(`Server is running on port ${port}`);
    await connectDb();
})