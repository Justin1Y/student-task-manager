const mongoose = require("mongoose");
const Task = require("../models/Task");

function normalizeTask(task) {
    return {
        id: String(task._id),
        tenantId: String(task.tenantId),
        createdBy: String(task.createdBy),
        title: task.title,
        description: task.description,
        priority: task.priority,
        status: task.status,
        date: task.date,
        createdAt: task.createdAt,
        updatedAt: task.updatedAt
    };
}

async function getTasks(req, res) {
    try {
        const tasks = await Task.find({ tenantId: req.user.tenantId }).sort({ date: 1, createdAt: -1 });

        return res.json({
            success: true,
            data: tasks.map(normalizeTask)
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Failed to fetch tasks."
        });
    }
}

async function createTask(req, res) {
    try {
        const { title, description = "", priority = "medium", status = "pending", date } = req.body;

        if (!title || !date) {
            return res.status(400).json({
                success: false,
                message: "title and date are required."
            });
        }

        const task = await Task.create({
            tenantId: req.user.tenantId,
            createdBy: req.user.id,
            title: title.trim(),
            description: description.trim(),
            priority,
            status,
            date
        });

        return res.status(201).json({
            success: true,
            data: normalizeTask(task)
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Failed to create task."
        });
    }
}

async function updateTask(req, res) {
    try {
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                success: false,
                message: "Invalid task id."
            });
        }

        const updates = {};
        const allowedFields = ["title", "description", "priority", "status", "date"];

        allowedFields.forEach((field) => {
            if (req.body[field] !== undefined) {
                updates[field] = typeof req.body[field] === "string" ? req.body[field].trim() : req.body[field];
            }
        });

        if (updates.title === "") {
            return res.status(400).json({
                success: false,
                message: "title cannot be empty."
            });
        }

        const task = await Task.findOneAndUpdate(
            { _id: id, tenantId: req.user.tenantId },
            updates,
            { returnDocument: "after", runValidators: true }
        );

        if (!task) {
            return res.status(404).json({
                success: false,
                message: "Task not found."
            });
        }

        return res.json({
            success: true,
            data: normalizeTask(task)
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Failed to update task."
        });
    }
}

async function deleteTask(req, res) {
    try {
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                success: false,
                message: "Invalid task id."
            });
        }

        const task = await Task.findOneAndDelete({
            _id: id,
            tenantId: req.user.tenantId
        });

        if (!task) {
            return res.status(404).json({
                success: false,
                message: "Task not found."
            });
        }

        return res.json({
            success: true,
            message: "Task deleted successfully."
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Failed to delete task."
        });
    }
}

module.exports = {
    getTasks,
    createTask,
    updateTask,
    deleteTask
};
