import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();
export const connectDb = async () => {
    try {
        await prisma.$connect();
        console.log("Connected to MongoDB via Prisma!");
    }
    catch (error) {
        console.error("Failed to connect to the database:", error);
        process.exit(1);
    }
};
export default prisma;
//# sourceMappingURL=db.js.map