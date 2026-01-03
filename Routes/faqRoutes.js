const express = require("express");
const faqController = require("../Controllers/faqController");
const verifyToken = require("../Middleware/verifyToken");
const router = express.Router();


router.post("/faqs", verifyToken,faqController.viewFaqs);
router.post("/add-faq", verifyToken, faqController.addFaq);
router.post("/edit-faq/:id", verifyToken, faqController.editFaq);
router.post("/delete-faq/:id", verifyToken, faqController.deleteFaq);

module.exports = router;