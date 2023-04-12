const express = require('express');
const router = express.Router();
const adminWebController = require('../controller/adminWebController');

router.post("/login", adminWebController.adminLogin);

//create event
router.post("/event/createEvent", adminWebController.createEvent);

//get admin details
router.get("/getAdmin",adminWebController.getUserDetails);

router.post("/getEventDetails", adminWebController.getEventDetails);

router.get('/getRegisteredUsers/:eventId',adminWebController.registeredUsers);

router.post('/events/updateEvent', adminWebController.updateEventData);

router.get('/getAllEvents',adminWebController.getAllEvents);

//get all events by department
router.get('/getEventsByDept/:dept',adminWebController.getEventsByDept)

//get events by date
router.get('/getEventsByDate/:date',adminWebController.getEventsByDate)

//Stats for the admin
router.post('/getStats/totalFee',adminWebController.getTotalFee);

//Stats for total regs
router.post('/getStats/totalRegs',adminWebController.getTotalRegs);



module.exports = router;

