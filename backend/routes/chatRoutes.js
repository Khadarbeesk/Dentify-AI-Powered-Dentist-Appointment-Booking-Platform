const router = require("express").Router();

const auth = require("../middleware/auth");
const { chatWithAI } = require("../controllers/chatControllers");

// Only authenticated users can use this chatbot.
router.post("/", auth, chatWithAI);

module.exports = router;