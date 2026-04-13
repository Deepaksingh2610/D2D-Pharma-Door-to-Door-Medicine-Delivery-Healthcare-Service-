import  mongoose from "mongoose";
import { DB_NAME } from "../utils/constants.js";

const connectDB = async () => {
    try {
        const baseURI = process.env.MONGODB_URI.endsWith('/') 
            ? process.env.MONGODB_URI.slice(0, -1) 
            : process.env.MONGODB_URI;
            
        const connectionInstance = await mongoose.connect(`${baseURI}/${DB_NAME}`, {
            serverSelectionTimeoutMS: 5000, // 5 seconds timeout
        });
        console.log(`\n✅ MongoDB connected! Host: ${connectionInstance.connection.host}`);
    } catch (error) {
        console.error("\n❌ MongoDB connection error:", error.message);
        if (error.message.includes("ENOTFOUND")) {
            console.error("💡 TIP: Check your internet connection or verify your MongoDB Atlas cluster is active.");
        }
        throw error;    
    }
}

export default connectDB