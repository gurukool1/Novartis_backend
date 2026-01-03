const express = require("express");
const verifyToken = require("../Middleware/verifyToken");
const formController = require("../Controllers/formController");

const router = express.Router()


router.post("/user/submit-form", verifyToken, formController.submitForm);
router.post("/view-form", verifyToken, formController.viewForm);
router.post("/user/edit-form", verifyToken, formController.editForm);


module.exports = router;
