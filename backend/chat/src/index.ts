import express from 'express';
import dotenv from 'dotenv';
import { connectDb } from './config/db.js';
import chatRoutes from './routes/chat.js';
import cors from "cors"
import { app ,server} from './config/socket.js';

dotenv.config();

const port = process.env.PORT;

app.use(express.json());
app.use(cors());

app.use("/api/v1", chatRoutes);

// Used by Docker to check the container is alive (see HEALTHCHECK in the Dockerfile)
app.get("/health", (_req, res) => {
    res.json({ status: "ok" });
});

server.listen(port, async () => {
    console.log(`Server is running on port ${port}`);
    await connectDb();
})