import dotenv from "dotenv";
dotenv.config();

import connectDB from "./db/index.js";
import { app } from "./app.js";

const PORT = process.env.PORT || 8080;

connectDB()
    .then(() => {
        app.listen(PORT, "0.0.0.0", () => {
            console.log(`\n⚙️  Server is running at port : ${PORT}`);
            console.log(`🔗 Local URL: http://127.0.0.1:${PORT}`);
        });
    })
    .catch((err) => {
        console.log("MongoDB connection failed !!! ", err);
    });
