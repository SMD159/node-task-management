const express = require("express");
const router = express.Router();
const { ARM } = process.env;

router.use("/users", require("./users"));

module.exports = router;
