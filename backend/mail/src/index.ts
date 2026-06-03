import express from 'express';
import dotenv from 'dotenv';
import { startSendOtpConsumer } from './consumer.js';

dotenv.config();

const app=express();
const PORT=process.env.PORT||5001;

startSendOtpConsumer();
app.listen(PORT,()=>{
    console.log(`Server is running on port ${PORT}`)
});

