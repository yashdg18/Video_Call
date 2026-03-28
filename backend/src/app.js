import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, "../.env") });

import express from "express";
import { createServer } from "node:http";
import mongoose from "mongoose";
import { connectToSocket } from "./controllers/socketManager.js";
import cors from "cors";
import userRoutes from "./routes/users.routes.js";

const app = express();
const server = createServer(app);
const io = connectToSocket(server);

const PORT = process.env.PORT || 8000;
const MONGODB_URI = process.env.MONGODB_URI;

// ✅ CORS fix — allow your Render frontend
app.use(cors({
    origin: [
        "https://video-call-frontend-zqah.onrender.com",
        "http://localhost:3000"
    ],
    methods: ["GET", "POST"],
    credentials: true
}));

app.use(express.json({ limit: "40kb" }));
app.use(express.urlencoded({ limit: "40kb", extended: true }));

app.use("/api/v1/users", userRoutes);

app.get("/", (req, res) => {
    res.json({ message: "Video Meet API is running!" });
});

const start = async () => {
    try {
        // ✅ On Render, MONGODB_URI comes from environment variables (not .env file)
        const uri = MONGODB_URI || process.env.MONGODB_URI;
        if (!uri) {
            throw new Error("MONGODB_URI is not defined");
        }
        const connectionDb = await mongoose.connect(uri);
        console.log(`✅ MongoDB Connected: ${connectionDb.connection.host}`);
        server.listen(PORT, () => {
            console.log(`🚀 Server listening on port ${PORT}`);
        });
    } catch (error) {
        console.error("❌ Failed to start server:", error.message);
        process.exit(1);
    }
};

start();
