const express = require("express");
const verifyToken = require("../Middleware/verifyToken");
const userController = require("../Controllers/userController");

const router = express.Router()


router.post("/user/assigned-cases", verifyToken, userController.assignedCase);
router.post("/user/total-assigned-cases", verifyToken, userController.totalAssignedCases);





module.exports = router;