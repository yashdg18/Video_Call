require("dotenv").config();

const express = require("express");
const { createServer } = require("http");
const mongoose = require("mongoose");
const { connectToSocket } = require("./controllers/socketManager");
const cors = require("cors");
const userRoutes = require("./routes/users.routes");

const app = express();
const server = createServer(app);
const io = connectToSocket(server);

const PORT = process.env.PORT || 8000;
const MONGODB_URI = process.env.MONGODB_URI;

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
        if (!MONGODB_URI) {
            throw new Error("MONGODB_URI is not defined in .env file");
        }
        const connectionDb = await mongoose.connect(MONGODB_URI);
        console.log(`✅ MongoDB Connected: ${connectionDb.connection.host}`);
        server.listen(PORT, () => {
            console.log(`🚀 Server listening on http://localhost:${PORT}`);
        });
    } catch (error) {
        console.error("❌ Failed to start server:", error.message);
        process.exit(1);
    }
};

start();
