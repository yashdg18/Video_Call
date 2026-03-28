const { Router } = require("express");
const { addToHistory, getUserHistory, login, register } = require("../controllers/user.controller");

const router = Router();

router.post("/login",           login);
router.post("/register",        register);
router.post("/add_to_activity", addToHistory);
router.get("/get_all_activity", getUserHistory);

module.exports = router;
