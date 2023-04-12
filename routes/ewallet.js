const express = require('express');
const router = express.Router();

const ewalletController = require('../controller/ewalletController');


router.post('/startPayment',ewalletController.startPayment)

router.post('/verifyOtp',ewalletController.verifyOtp)

module.exports = router
