const express = require('express');
const router = express.Router();
const adminWebController = require('../controller/adminWebController');

router.post("/login", adminWebController.adminLogin);
module.exports = router;

