const express = require("express");
const {
    getTasks,
    createTask,
    updateTask,
    deleteTask
} = require("../controllers/taskController");
const { requireAuth } = require("../middleware/authMiddleware");

const router = express.Router();

router.use(requireAuth);
router.get("/", getTasks);
router.post("/", createTask);
router.put("/:id", updateTask);
router.delete("/:id", deleteTask);

module.exports = router;
