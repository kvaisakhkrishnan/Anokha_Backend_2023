const { db, transactions_db } = require('../connection');

const webtokenGenerator = require('../middleware/webTokenGenerator');
const webtokenValidator = require('../middleware/webTokenValidator');
const otpTokenGenerator = require('../middleware/otpTokenGenerator.js');
const otpTokenValidator = require('../middleware/otpTokenValidator');
const randonNumberGenerator = require('../OTPGenerator/otp');
const mailer = require('../Mailer/otpGenerator');
const welcomeMailer = require('../Mailer/welcomeMailer');
const validator = require('validator');
const fs = require('fs');

module.exports = {
    adminLogin : async (req, res) => {
       

        if(req.body.userName == undefined || req.body.password == undefined)
        {
            res.status(400).send({error : "We are one step ahead! Try harder!"});
        }
        else{
        let sql_q = `select * from EventManager where userName = ? and password = ?`
            const db_connection = await db.promise().getConnection();
            try{
                await db_connection.query('lock tables eventmanager read');
                const [result] = await db_connection.query(sql_q, [req.body.userName, req.body.password]);
                await db_connection.query('unlock tables');
                if(result.length == 0)
                {
                    res.status(404).send({error : "User not found"})
                }
                else{

                    const token = await webtokenGenerator({
                        userName : result.userName,
                        userEmail : result.userEmail,
                        name : result.name,
                        managerPhoneNumber : result.phoneNumber,
                        role : result[0].role,
                        department : result[0].departmentAbbr
                    });
                    res.json({
                        
                            userName : result[0].userName,
                            fullName : result[0].name,
                            phoneNumber : result[0].phoneNumber,
                            role : result[0].role,
                            SECRET_TOKEN : token
                        
                    });
                
                }
            }
            
            catch(err){
                console.log(err);
                const now = new Date();
                now.setUTCHours(now.getUTCHours() + 5);
                now.setUTCMinutes(now.getUTCMinutes() + 30);
                const istTime = now.toISOString().slice(0, 19).replace('T', ' ');
                fs.appendFile('ErrorLogs/errorLogs.txt', istTime+"\n", (err)=>{});
                fs.appendFile('ErrorLogs/errorLogs.txt', err.toString()+"\n\n", (err)=>{});
                res.status(500).send({"Error" : "Contact DB Admin if you see this message"});
            }
            finally{
                await db_connection.release();
            }
        
    }

    },

    createEvent : [webtokenValidator, async  (req, res) => {

        //USER tresspassing leds to ban.
        if(req.body.authorization_tier == "USER")
        {
           res.status(404).send({"error" : "no data found"});
        }

        //SUPER Access
        //ADMIN Access
        //EWHEAD Access
        //DEPTHEAD Access
        //FACCOORD Access
        else if(req.body.authorization_tier == "ADMIN" || req.body.authorization_tier == "SUPER" || req.body.authorization_tier == "EWHEAD" || req.body.authorization_tier == "DEPTHEAD" || req.body.authorization_tier == "FACCOORD"){
            
        if(req.body.eventName == undefined ||
            req.body.eventOrWorkshop == undefined ||
            req.body.description == undefined ||
            req.body.userEmail == undefined ||
            req.body.date == undefined ||
            req.body.eventTime == undefined ||
            req.body.venue == undefined ||
            req.body.fees == undefined ||
            req.body.totalNumberOfSeats == undefined ||
            req.body.departmentAbbr == undefined ||
            req.body.refundable == undefined ||
            req.body.groupOrIndividual == undefined ||
            req.body.minCount == undefined ||
            req.body.maxCount == undefined ||
            req.body.technical == undefined ||
            req.body.url == undefined
        )
        {
            console.log(req.body);

           
            res.status(400).send({error : "We are one step ahead! Try harder!"});
        }
        else if((req.body.groupOrIndividual == 0 && (req.body.maxCount != 1 || req.body.maxCount != 1 ))|| req.body.minCount > req.body.maxCount)
        {
            res.status(400).send({"error" : "ANOKHAERRCODEUNDEFINEDPARAMETERS"});
        }
        else{
            const db_connection = await db.promise().getConnection();
            try{
                
                const now = new Date();
                now.setUTCHours(now.getUTCHours() + 5);
                now.setUTCMinutes(now.getUTCMinutes() + 30);
                const istTime = now.toISOString().slice(0, 19).replace('T', ' ');
                await db_connection.query("lock tables eventData write");
                let sql_q = `insert into EventData (eventName, eventOrWorkshop,technical, groupOrIndividual, minCount, maxCount, description, url, userEmail, date, eventTime, venue, fees, totalNumberOfSeats, noOfRegistrations, timeStamp, refundable, departmentAbbr) values (?, ?,?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?,?, ?)`;
                
                if(req.body.authorization_tier == "FACCOORD")
                {
                    const [result] = await db_connection.query(sql_q, [req.body.eventName,req.body.eventOrWorkshop,req.body.technical,req.body.groupOrIndividual,req.body.minCount, req.body.maxCount, req.body.description, req.body.url, req.body.userEmail,req.body.date,req.body.eventTime,req.body.venue,req.body.fees,req.body.totalNumberOfSeats,0,istTime,req.body.refundable,req.body.departmentAbbr]);
                    if(result.affectedRows == 1)
                    {
                        res.status(201).send({result : "Data Inserted Succesfully"});
                    }
                    else{
                        res.status(404).send({"error" : "no data inserted"});
                    }
                
                }
                else if(req.body.authorization_tier == "DEPTHEAD" &&
                req.body.corncUserEmail != undefined &&
                validator.isEmail(req.body.corncUserEmail))
                
                
                {
                    [result] = await db_connection.query(sql_q, [req.body.eventName,req.body.eventOrWorkshop,req.body.technical,req.body.groupOrIndividual,req.body.minCount, req.body.maxCount, req.body.description, req.body.url, req.body.corncUserEmail,req.body.date,req.body.eventTime,req.body.venue,req.body.fees,req.body.totalNumberOfSeats,0,istTime,req.body.refundable,req.body.departmentAbbr]);
                    if(result.affectedRows == 1)
                    {
                        res.status(201).send({result : "Data Inserted Succesfully"});
                    }
                    else{
                        res.status(404).send({"error" : "no data inserted"});
                    }
                }

                else if(req.body.corncUserEmail != undefined &&
                    validator.isEmail(req.body.corncUserEmail) &&
                        req.body.corncDepartmentAbbr != undefined
                        )
                {
                    [result] = await db_connection.query(sql_q, [req.body.eventName,req.body.eventOrWorkshop,req.body.technical,req.body.groupOrIndividual,req.body.minCount, req.body.maxCount, req.body.description, req.body.url, req.body.corncUserEmail,req.body.date,req.body.eventTime,req.body.venue,req.body.fees,req.body.totalNumberOfSeats,0,istTime,req.body.refundable,req.body.corncDepartmentAbbr]);
                    if(result.affectedRows == 1)
                    {
                        res.status(201).send({result : "Data Inserted Succesfully"});
                    }
                    else{
                        res.status(404).send({"error" : "no data inserted"});
                    }
                }
               
                
                
                
                
                await db_connection.query("unlock tables");
                
               
            }
        
            catch(err)
            {
                console.log(err);
                if(err.errno = 1452)
                {

                    res.status(400).send({error : "Foreign Key Constraint Error"});
                }
                else{
                    const now = new Date();
                    now.setUTCHours(now.getUTCHours() + 5);
                    now.setUTCMinutes(now.getUTCMinutes() + 30);
                    const istTime = now.toISOString().slice(0, 19).replace('T', ' ');
                    fs.appendFile('ErrorLogs/errorLogs.txt', istTime+"\n", (err)=>{});
                    fs.appendFile('ErrorLogs/errorLogs.txt', err.toString()+"\n\n", (err)=>{});
                    res.status(500).send({"Error" : "Contact DB Admin if you see this message"});
                }
            }
           finally{
            await db_connection.release();
           }
        }
    }
     }],

     getUserDetails : [webtokenValidator, async (req,res) => {
        //USER tresspassing leds to ban.
        if(req.body.authorization_tier == "USER")
        {
           res.status(444).send({"error" : "You are blocked from further access"});
        }
        //SUPER Access
        //ADMIN Access
        else if(req.body.authorization_tier == "ADMIN" || req.body.authorization_tier == "SUPER" ){
        if(req.authorization_tier == "ADMIN"){

        if(req.body.userName == undefined)
        {
            res.status(400).send({error : "We are one step ahead! Try harder!"});
        }
        else{
            
         let sql_q = `select * from EventManager where userName = ?`;
         
         const db_connection = await db.promise().getConnection();
         try{
            await db_connection.query('lock tables eventmanager read');
            const [result] = await db_connection.query(sql_q, [req.body.userName]);
            await db_connection.query('unlock tables');
            if(result.length == 0)
            {
                res.status(404).send({"error" : "no data found"});
            }
            else{
                res.status(200).send({
                    userName: result[0].userName,
                    userEmail:  result[0].userEmail,
                    name:  result[0].name,
                    phoneNumber:  result[0].phoneNumber,
                    role:  result[0].role
                });
            }
         }
         catch(err)
         {
            const now = new Date();
            now.setUTCHours(now.getUTCHours() + 5);
            now.setUTCMinutes(now.getUTCMinutes() + 30);
            const istTime = now.toISOString().slice(0, 19).replace('T', ' ');
            fs.appendFile('ErrorLogs/errorLogs.txt', istTime+"\n", (err)=>{});
            fs.appendFile('ErrorLogs/errorLogs.txt', err.toString()+"\n\n", (err)=>{});
            res.status(500).send({"Error" : "Contact DB Admin if you see this message"});
         }
         finally{
            await db_connection.release();
         }
        }
    }else{
        res.status(401).send({"error" : "You have no rights to be here!"})
    }
    }
     }],

     
     getEventDetails : [webtokenValidator, async(req, res) => {
        //USER tresspassing leds to ban.
        if(req.body.authorization_tier == "USER")
        {
           res.status(404).send({"error" : "no data found"});
        }

        //SUPER Access
        //ADMIN Access
        //EWHEAD Access
        //DEPTHEAD Access
        //STDCOORD Access
        //FACCOORD Access
        else if(req.body.authorization_tier == "ADMIN" || req.body.authorization_tier == "SUPER" || req.body.authorization_tier == "EWHEAD"  || req.body.authorization_tier == "DEPTHEAD" || req.body.authorization_tier == "STDCOORD" || req.body.authorization_tier == "FACCOORD"){
      
       var sql_q = "";
       parameters = []
       
       if(req.body.eventDate == undefined && req.body.userName != undefined)
       {
           
           if(req.body.authorization_tier == "FACCOORD")
           {
               sql_q = `select * from EventData where userEmail = (select userEmail from eventManager where userName = ?)`;
               parameters = [req.body.userName]
           }
           else if(req.body.authorization_tier == "STDCOORD")
           {
               sql_q = `select * from EventData where eventId = (select eventId from StudentCoordinator left join eventManager on eventManager.student = StudentCoordinator.userEmail where userName = ?)`;
               parameters = [req.body.userName]
           }
           else if(req.body.authorization_tier == "DEPTHEAD")
           {
               sql_q = `select * from EventData where departmentAbbr = (select departmentAbbr from eventManager where userName = ?)`;
               parameters = [req.body.userName]
           }
           else{
               sql_q = `select * from EventData`;
               parameters = []
           }
           
       }
       else if (req.body.userName != undefined){

           if(req.body.authorization_tier == "FACCOORD")
           {
               sql_q = `select * from EventData where userEmail = (select userEmail from eventManager where userName = ?) and date = ?`;
               parameters = [req.body.userName,req.body.eventDate]
           }
           else if(req.body.authorization_tier == "STDCOORD")
           {
               sql_q = `select * from EventData where eventId = (select eventId from StudentCoordinator left join eventManager on eventManager.student = StudentCoordinator.userEmail where userName = ?) and date = ?`;
               parameters = [req.body.userName,req.body.eventDate]
           }
           else if(req.body.authorization_tier == "DEPTHEAD")
           {
               sql_q = `select * from EventData where departmentAbbr = (select departmentAbbr  from eventManager where userName = ?) and date = ?`;
               parameters = [req.body.userName,req.body.eventDate]
           }
           else{
               sql_q = `select * from EventData and date = ?`;
               parameters = [req.body.eventDate]
           }

          
       }
       else{
           res.status(400).send({error : "We are one step ahead! Try harder!"});
       }
      
       const db_connection = await db.promise().getConnection();
       try{
           await db_connection.query("lock tables eventdata read, eventManager read, StudentCoordinator read");
           const [result] = await db_connection.query(sql_q, parameters);
           await db_connection.query("unlock tables");
           if(result.length == 0)
           {
               res.status(404).send({"error" : "no data found"});
           }
           else{
               res.status(200).send(result);
           }
       }
       catch(err)
        {
           console.log(err);
           const now = new Date();
           now.setUTCHours(now.getUTCHours() + 5);
           now.setUTCMinutes(now.getUTCMinutes() + 30);
           const istTime = now.toISOString().slice(0, 19).replace('T', ' ');
           fs.appendFile('ErrorLogs/errorLogs.txt', istTime+"\n", (err)=>{});
           fs.appendFile('ErrorLogs/errorLogs.txt', err.toString()+"\n\n", (err)=>{});
           res.status(500).send({"Error" : "Contact DB Admin if you see this message"});
        }
        finally{
           await db_connection.release();
        }
      
       }
       
    }],

    registeredUsers : [webtokenValidator, async (req,res) => {

        //USER tresspassing leds to ban.
        if(req.body.authorization_tier == "USER")
        {
           res.status(404).send({"error" : "no data found"});
        }

        //SUPER Access
        //ADMIN Access
        //EWHEAD Access
        //DEPTHEAD Access
        //FACCOORD Access
        else if(req.body.authorization_tier == "SUPER" || req.body.authorization_tier == "ADMIN"  || req.body.authorization_tier == "EWHEAD"  || req.body.authorization_tier == "DEPTHEAD" || req.body.authorization_tier == "FACCOORD"){

        if(req.params.eventId == undefined)

        {
            res.status(400).send({error : "We are one step ahead! Try harder!"});
        }
        else{
        var sql = "";
        var params = [];

        if(req.body.authorization_tier == "FACCOORD")
        {
            sql = `select * from userData where userEmail in (select userEmail from registeredevents where eventId in (select eventId from eventData where userEmail = ? and eventId = ?));`
            params = [req.body.userEmail, req.params.eventId]
        }

        else if(req.body.authorization_tier == "DEPTHEAD")
        {
            sql = `select * from userData where userEmail in (select userEmail from registeredevents where eventId in (select eventId from eventData where departmentAbbr = ? and eventId = ?));`
            params = [req.body.departmentAbbr, req.param.eventId]
        }
        else{
            sql = `select * from userData where userEmail in (select userEmail from registeredevents where eventId = ?)`;
            params = [req.params.eventId];
        }

        const db_connection = await db.promise().getConnection();
        try{
            await db_connection.query("lock tables userData read, registeredevents read, eventdata read")
            const [result] = await db_connection.query(sql, params);
            await db_connection.query("unlock tables")
            res.status(200).send(result);
        }
        catch(err)
        {
            const now = new Date();
            now.setUTCHours(now.getUTCHours() + 5);
            now.setUTCMinutes(now.getUTCMinutes() + 30);
            const istTime = now.toISOString().slice(0, 19).replace('T', ' ');
            fs.appendFile('ErrorLogs/errorLogs.txt', istTime+"\n", (err)=>{});
            fs.appendFile('ErrorLogs/errorLogs.txt', err.toString()+"\n\n", (err)=>{});
            res.status(500).send({"Error" : "Contact DB Admin if you see this message"});
        }
        finally{
            await db_connection.release();
        }
        
    }
    
    }
    }],

    updateEventData : [webtokenValidator,  async (req, res) => {

        //USER tresspassing leds to ban.
        if(req.body.authorization_tier == "USER")
        {
           res.status(404).send({"error" : "no data found"});
        }

        //SUPER Access
        //ADMIN Access
        //EWHEAD Access
        //DEPTHEAD Access
        //FACCOOD Access
        else if(req.body.authorization_tier == "SUPER" || req.body.authorization_tier == "ADMIN" || req.body.authorization_tier == "EWHEAD" || req.body.authorization_tier == "DEPTHEAD" || req.body.authorization_tier == "FACCOORD"){
        if(req.body.eventName == undefined ||
            req.body.eventOrWorkshop == undefined ||
            req.body.description == undefined ||
            req.body.userName == undefined ||
            req.body.eventDate == undefined ||
            req.body.eventTime == undefined ||
            req.body.venue == undefined ||
            req.body.fees == undefined ||
            req.body.totalNumberOfSeats == undefined ||
             
            req.body.refundable == undefined ||
            req.body.eventId == undefined ||
            validator.isEmpty(req.body.eventName) ||
        validator.isEmpty(req.body.description) ||
        validator.isEmpty(req.body.eventDate) ||
        validator.isEmpty(req.body.eventTime) ||
        validator.isEmpty(req.body.venue) ||
        
        req.body.groupOrIndividual == undefined ||
        req.body.maxCount == undefined ||
        req.body.minCount == undefined ||
        req.body.userEmail == undefined 
        )
        {
            console.log(req.body.userName);
            console.log(req.body.userEmail);
            
            res.status(400).send({error : "We are one step ahead! Try harder!"});
        }
        else if((req.body.groupOrIndividual == 0 && (req.body.maxCount != 1 || req.body.maxCount != 1 ))|| req.body.minCount > req.body.maxCount)
        {
            res.status(400).send({"error" : "ANOKHAERRCODEUNDEFINEDPARAMETERS"});
        }
        else{
            const db_connection = await db.promise().getConnection();
            try{
                
                await db_connection.query('lock tables eventData write');

                if(req.body.authorization_tier == "FACCOORD")
                {
                    const [result] = await db_connection.query(`update EventData set eventName = ?, groupOrIndividual = ?,minCount = ?, maxCount = ?, description = ?, date = ?, eventTime = ?, venue = ?, fees = ?, totalNumberOfSeats = ?, refundable = ?, departmentAbbr = ? where eventId = ? and userEmail = ?`,[req.body.eventName,req.body.groupOrIndividual, req.body.minCount, req.body.maxCount, req.body.description,req.body.eventDate,req.body.eventTime,req.body.venue,req.body.fees,req.body.totalNumberOfSeats,req.body.refundable,req.body.departmentAbbr,req.body.eventId,req.body.userEmail]);
                    if(result.affectedRows == 0)
                    {
                        res.status(400).send({"error" : "Error in data"});
                    }
                    else{
                    res.status(200).send({result : "Updated Succesfully"});
                    }
                }
                else if(req.body.authorization_tier == "DEPTHEAD" && req.body.corncUserEmail != undefined && validator.isEmail(req.body.corncUserEmail))
                {
                    const [result] = await db_connection.query(`update EventData set eventName = ?, groupOrIndividual = ?,minCount = ?, maxCount = ?, description = ?, date = ?, eventTime = ?, venue = ?, fees = ?, totalNumberOfSeats = ?, refundable = ?, departmentAbbr = ?, userEmail = ? where eventId = ? and departmentAbbr = ?`,[req.body.eventName,req.body.groupOrIndividual, req.body.minCount, req.body.maxCount, req.body.description,req.body.eventDate,req.body.eventTime,req.body.venue,req.body.fees,req.body.totalNumberOfSeats,req.body.refundable,req.body.departmentAbbr,req.body.corncUserEmail,req.body.eventId,req.body.departmentAbbr]);
                    if(result.affectedRows == 0)
                    {
                        res.status(400).send({"error" : "Error in data"});
                    }
                    else{
                    res.status(200).send({result : "Updated Succesfully"});
                    }
                }
                else if(req.body.corncUserEmail != undefined && validator.isEmail(req.body.corncUserEmail) && req.body.corncDepartmentAbbr != undefined)
                {
                    const [result] = await db_connection.query(`update EventData set eventName = ?, groupOrIndividual = ?,minCount = ?, maxCount = ?, description = ?, date = ?, eventTime = ?, venue = ?, fees = ?, totalNumberOfSeats = ?, refundable = ?, departmentAbbr = ?, userEmail = ? where eventId = ?`,[req.body.eventName,req.body.groupOrIndividual, req.body.minCount, req.body.maxCount, req.body.description,req.body.eventDate,req.body.eventTime,req.body.venue,req.body.fees,req.body.totalNumberOfSeats,req.body.refundable,req.body.corncDepartmentAbbr,req.body.corncUserEmail,req.body.eventId]);
                    if(result.affectedRows == 0)
                    {
                        res.status(400).send({"error" : "Error in data"});
                    }
                    else{
                    res.status(200).send({result : "Updated Succesfully"});
                    }
                }


                await db_connection.query('unlock tables');
               }

           
            catch(err)
            {
                console.log(err);
                const now = new Date();
                now.setUTCHours(now.getUTCHours() + 5);
                now.setUTCMinutes(now.getUTCMinutes() + 30);
                const istTime = now.toISOString().slice(0, 19).replace('T', ' ');
                fs.appendFile('ErrorLogs/errorLogs.txt', istTime+"\n", (err)=>{});
                fs.appendFile('ErrorLogs/errorLogs.txt', err.toString()+"\n\n", (err)=>{});
                res.status(500).send({error : "Query Error"})
            }
            finally{
                await db_connection.release();
            }
        }
        
    }
    }],


    getAllEvents : [webtokenValidator, async (req, res) => {
        //USER tresspassing leds to ban.
        if(req.body.authorization_tier == "USER")
        {
           res.status(444).send({"error" : "You are blocked from further access"});
        }
        //SUPER Access
        //ADMIN Access
        else if(req.body.authorization_tier == "ADMIN" || req.body.authorization_tier == "SUPER"){
        let db_connection = await db.promise().getConnection();
        try{
            await db_connection.query('lock tables eventdata read');
            const [result] = await db_connection.query(`select * from EventData`);
            await db_connection.query('unlock tables');
            res.status(200).send(result);
        }
        catch(err)
        {
            console.log(err);
            const now = new Date();
            now.setUTCHours(now.getUTCHours() + 5);
            now.setUTCMinutes(now.getUTCMinutes() + 30);
            const istTime = now.toISOString().slice(0, 19).replace('T', ' ');
            fs.appendFile('ErrorLogs/errorLogs.txt', istTime+"\n", (err)=>{});
            fs.appendFile('ErrorLogs/errorLogs.txt', err.toString()+"\n\n", (err)=>{});
            res.status(500).send({"Error" : "Contact DB Admin if you see this message"});
    
        }
        finally{
            await db_connection.release();
        }
    }
    }],

    getEventsByDept : [webtokenValidator,async (req,res) => {
        //USER tresspassing leds to ban.
        if(req.body.authorization_tier == "USER")
        {
           res.status(444).send({"error" : "You are blocked from further access"});
        }
        //SUPER Access
        //ADMIN Access
        else if(req.body.authorization_tier == "ADMIN" || req.body.authorization_tier == "SUPER"){
            let db_connection = await db.promise().getConnection();
            try{
                await db_connection.query('lock tables eventdata read');
                const [result] = await db_connection.query(`select * from EventData where departmentAbbr = ?`,[req.params.dept]);
                await db_connection.query('unlock tables');
                res.status(200).send(result);
            }
    
            catch(err) {
                console.log(err);
                const now = new Date();
                now.setUTCHours(now.getUTCHours() + 5);
                now.setUTCMinutes(now.getUTCMinutes() + 30);
                const istTime = now.toISOString().slice(0, 19).replace('T', ' ');
                fs.appendFile('ErrorLogs/errorLogs.txt', istTime+"\n", (err)=>{});
                fs.appendFile('ErrorLogs/errorLogs.txt', err.toString()+"\n\n", (err)=>{});
                res.status(500).send({"Error" : "Contact DB Admin if you see this message"});
            }
        }
    }
    ],

    getEventsByDate : [webtokenValidator,async (req,res) => {
            //USER tresspassing leds to ban.
         if(req.body.authorization_tier == "USER")
         {
            res.status(444).send({"error" : "You are blocked from further access"});
         }
         //SUPER Access
        //ADMIN Access
        else if(req.body.authorization_tier == "ADMIN" || req.body.authorization_tier == "SUPER"){
            let db_connection = await db.promise().getConnection();
            try{
                await db_connection.query('lock tables eventdata read');
                const [result] = await db_connection.query(`select * from EventData where date = ?`,[req.params.date]);
                await db_connection.query('unlock tables');
                res.status(200).send(result);
            }
    
            catch(err) {
                console.log(err);
                const now = new Date();
                now.setUTCHours(now.getUTCHours() + 5);
                now.setUTCMinutes(now.getUTCMinutes() + 30);
                const istTime = now.toISOString().slice(0, 19).replace('T', ' ');
                fs.appendFile('ErrorLogs/errorLogs.txt', istTime+"\n", (err)=>{});
                fs.appendFile('ErrorLogs/errorLogs.txt', err.toString()+"\n\n", (err)=>{});
                res.status(500).send({"Error" : "Contact DB Admin if you see this message"});
            }
            
            finally {
                await db_connection.release()
            }
    
        }
    }
    ],

    getTotalFee : [webtokenValidator,async (req,res) => {
        //USER tresspassing leds to ban.
        if(req.body.authorization_tier == "USER")
        {
           res.status(444).send({"error" : "You are blocked from further access"});
        }
        //SUPER Access
        //ADMIN Access
        else if(req.body.authorization_tier == "ADMIN" || req.body.authorization_tier == "SUPER"){
            if(req.body.eventName == undefined && req.body.dept == undefined) {
                res.send("No data passed in body to post")
            }
            else {
            let db_connection = await db.promise().getConnection();
            try {
               
    
                let command = "";
                if(req.body.dept == undefined) {
                    command = `select sum(fees) as EVENT_SUM from eventdata group by eventName having eventName = ?`;
                }
    
                else if(req.body.eventName == undefined) {
                    command = `select sum(fees) as DEPT_SUM from eventdata group by departmentAbbr having departmentAbbr = ?`;
                }
    
                let parameter = (req.body.eventName == undefined)? [req.body.dept] : [req.body.eventName];
                await db_connection.query('lock tables eventdata read');
                const [result] = await db_connection.query(command,parameter)
                await db_connection.query("unlock tables");
                res.status(200).send(result);
    
            }
            catch(err) {
                console.log(err);
                const now = new Date();
                now.setUTCHours(now.getUTCHours() + 5);
                now.setUTCMinutes(now.getUTCMinutes() + 30);
                const istTime = now.toISOString().slice(0, 19).replace('T', ' ');
                fs.appendFile('ErrorLogs/errorLogs.txt', istTime+"\n", (err)=>{});
                fs.appendFile('ErrorLogs/errorLogs.txt', err.toString()+"\n\n", (err)=>{});
                res.status(500).send({"Error" : "Contact DB Admin if you see this message"});
            }

            finally {
                await db_connection.release()
            }
        }
        }
    }
    ],

    getTotalRegs : [webtokenValidator,async (req,res) => {
        //USER tresspassing leds to ban.
        if(req.body.authorization_tier == "USER")
        {
           res.status(444).send({"error" : "You are blocked from further access"});
        }
        //SUPER Access
        //ADMIN Access
        else if(req.body.authorization_tier == "ADMIN" || req.body.authorization_tier == "SUPER"){
    
            if(req.body.eventName == undefined && req.body.dept == undefined) {
                res.send("No data sent in post")
            }
            else {
            let db_connection = await db.promise().getConnection();
            try {
                
                let command = "";
                if(req.body.dept == undefined) {
                    command = `select noOfRegistrations from eventdata where eventName = ?`;
                }
                else if(req.body.evetName == undefined) {
                    command = `select sum(noOfRegistrations) as DEPT_REGISTRATIONS from eventdata group by departmentAbbr having departmentAbbr = ?`
                }
                let parameter = (req.body.dept == undefined) ? [req.body.eventName] : [req.body.dept];
                await db_connection.query('lock tables eventdata');
                const [result] = await db_connection.query(command,parameter);
                await db_connection.query("unlock tables")
    
                res.status(200).send(result);
                
    
            }
    
            catch(err) {
                console.log(err);
                const now = new Date();
                now.setUTCHours(now.getUTCHours() + 5);
                now.setUTCMinutes(now.getUTCMinutes() + 30);
                const istTime = now.toISOString().slice(0, 19).replace('T', ' ');
                fs.appendFile('ErrorLogs/errorLogs.txt', istTime+"\n", (err)=>{});
                fs.appendFile('ErrorLogs/errorLogs.txt', err.toString()+"\n\n", (err)=>{});
                res.status(500).send({"Error" : "Contact DB Admin if you see this message"});
            }

            finally {
                await db_connection.release()
            }
            }
        }
    }
    ]
    

}