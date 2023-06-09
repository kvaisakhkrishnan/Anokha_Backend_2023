const express = require('express');
const router = express.Router();
const adminController = require('../controller/adminController');



router.get("/getAdmin",adminController.getUserDetails);
router.post("/getEventDetails", adminController.getEventDetails);

    
router.post("/event/createEvent", adminController.createEvent);
router.post("/login", adminController.adminLogin);
router.get('/getRegisteredUsers/:eventId',adminController.registeredUsers);
router.post('/events/updateEvent', adminController.updateEventData);

//get all events for search
router.get('/getAllEvents',adminController.getAllEvents);

//get all events by department
router.get('/getEventsByDept/:dept',adminController.getEventsByDept)

//get events by date
router.get('/getEventsByDate/:date',adminController.getEventsByDate)



//for the security 
router.get('/verifyUser/:userEmail',adminController.verifyUser);


//Stats for the admin
router.post('/getStats/totalFee',adminController.getTotalFee);

//Stats for total regs
router.post('/getStats/totalRegs',adminController.getTotalRegs);


router.get('/getStats/totalRevenue', adminController.getTotalRevenue);

router.post('/event/delete', adminController.deleteEvent);

router.post('/addStudentCoord', adminController.addStudentCoordinator);


//for super users and admin
router.post('/createAdmin', adminController.createAdmin);

router.post('/createAdmin', adminController.createAdmin);


module.exports = router;