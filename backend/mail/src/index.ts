import express from 'express';
import dotenv from 'dotenv';
import { startSendOtpConsumer } from './consumer.js';

dotenv.config();

const app=express();
const PORT=process.env.PORT||5001;

// Used by Docker to check the container is alive (see HEALTHCHECK in the Dockerfile)
app.get("/health",(_req,res)=>{
    res.json({status:"ok"});
});

startSendOtpConsumer();
app.listen(PORT,()=>{
    console.log(`Server is running on port ${PORT}`)
});

