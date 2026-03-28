const { Server } = require("socket.io");

let connections = {};
let messages = {};
let timeOnline = {};

const connectToSocket = (server) => {
    const io = new Server(server, {
        cors: {
            origin: "*",
            methods: ["GET", "POST"],
            allowedHeaders: ["*"],
            credentials: true
        }
    });

    io.on("connection", (socket) => {
        console.log("✅ User Connected:", socket.id);

        // JOIN CALL
        socket.on("join-call", (roomId) => {
            if (!connections[roomId]) {
                connections[roomId] = [];
            }
            connections[roomId].push(socket.id);
            timeOnline[socket.id] = new Date();

            connections[roomId].forEach((id) => {
                io.to(id).emit("user-joined", socket.id, connections[roomId]);
            });

            if (messages[roomId]) {
                messages[roomId].forEach((msg) => {
                    io.to(socket.id).emit("chat-message", msg.data, msg.sender, msg.socketId);
                });
            }
        });

        // SIGNAL (WebRTC)
        socket.on("signal", (toId, message) => {
            io.to(toId).emit("signal", socket.id, message);
        });

        // CHAT MESSAGE
        socket.on("chat-message", (data, sender) => {
            let roomId = null;
            for (const [key, value] of Object.entries(connections)) {
                if (value.includes(socket.id)) {
                    roomId = key;
                    break;
                }
            }
            if (!roomId) return;

            if (!messages[roomId]) messages[roomId] = [];
            messages[roomId].push({ sender, data, socketId: socket.id });

            console.log(`💬 Message in room [${roomId}]: ${sender} → ${data}`);

            connections[roomId].forEach((id) => {
                io.to(id).emit("chat-message", data, sender, socket.id);
            });
        });

        // DISCONNECT
        socket.on("disconnect", () => {
            console.log("❌ User Disconnected:", socket.id);

            const joinTime = timeOnline[socket.id];
            const onlineMs = joinTime ? Math.abs(new Date() - joinTime) : 0;
            delete timeOnline[socket.id];

            for (const [roomId, users] of Object.entries(connections)) {
                if (users.includes(socket.id)) {
                    users.forEach((id) => {
                        if (id !== socket.id) io.to(id).emit("user-left", socket.id);
                    });

                    connections[roomId] = users.filter((id) => id !== socket.id);

                    if (connections[roomId].length === 0) {
                        delete connections[roomId];
                        delete messages[roomId];
                        console.log(`🗑️  Room [${roomId}] deleted (empty)`);
                    }
                    break;
                }
            }
            console.log(`⏱️  User ${socket.id} was online for ${(onlineMs / 1000).toFixed(1)}s`);
        });
    });

    return io;
};

module.exports = { connectToSocket };
