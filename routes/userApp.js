const express = require('express');
const router = express.Router();
const userController = require('../controller/userController');

router.post('/editUser',userController.editUserDetails);
router.get('/getUser',userController.getUserDetails);
router.post('/login', userController.userLogin);
router.post('/registerUser', userController.registerUser);
router.post('/verifyOTP', userController.verifyOTP);
router.post('/insertStarrs',userController.insertStarredEvent);
router.post('/dropStarrs',userController.dropStarredEvent);
router.get('/getStarredEvents',userController.getStarredEvents);
router.get('/getCrew',userController.getCrewDetails);
router.get('/events/all', userController.getAllEvents);
router.post('/transaction/moveToTransaction', userController.moveToTransaction);


router.post('transaction/initiateTransaction', userController.intiatePay);









module.exports = router;