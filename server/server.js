const dotenv = require("dotenv");
const mongoose = require("mongoose");
const { createApp } = require("./app");

dotenv.config();

const app = createApp();
const PORT = process.env.PORT || 5000;

async function startServer() {
    if (!process.env.MONGODB_URI) {
        throw new Error("MONGODB_URI is missing. Add it to server/.env before starting the backend.");
    }

    if (!process.env.JWT_SECRET) {
        throw new Error("JWT_SECRET is missing. Add it to server/.env before starting the backend.");
    }

    await mongoose.connect(process.env.MONGODB_URI);
    console.log("MongoDB connected");

    app.listen(PORT, () => {
        console.log(`Server listening on port ${PORT}`);
    });
}

startServer().catch((error) => {
    console.error("Failed to start server:", error.message);
    process.exit(1);
});

module.exports = {
    app,
    startServer
};
