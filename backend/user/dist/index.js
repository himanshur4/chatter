import express from 'express';
import dotenv from 'dotenv';
import { connectDb } from './config/db.js';
dotenv.config();
const app = express();
const PORT = process.env.PORT;
app.use(express.json());
app.listen(PORT, async () => {
    console.log(`[User Service] Server is running on port ${PORT}`);
    await connectDb();
});
//# sourceMappingURL=index.js.map