const express = require("express");
const cors = require("cors");
const authRoutes = require("./routes/authRoutes");
const taskRoutes = require("./routes/taskRoutes");

function createApp() {
    const app = express();
    const clientOrigin = process.env.CLIENT_ORIGIN || "*";

    app.use(
        cors({
            origin: clientOrigin === "*" ? true : clientOrigin
        })
    );
    app.use(express.json());

    app.get("/api/health", (req, res) => {
        res.json({
            success: true,
            message: "Server is running."
        });
    });

    app.use("/api/auth", authRoutes);
    app.use("/api/tasks", taskRoutes);

    app.use((req, res) => {
        res.status(404).json({
            success: false,
            message: "Route not found."
        });
    });

    return app;
}

module.exports = {
    createApp
};
