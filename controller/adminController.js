const { db, transactions_db } = require('../connection');
const tokenGenerator = require('../middleware/appTokenGenerator');
const tokenValidator = require('../middleware/appTokenValidator');
const fs = require('fs');
const rn = require('random-number');
const validator = require('validator');
const mailer = require('../Mailer/adminAppUser.js');
const { log } = require('console');
const { param } = require('../routes/userApp');
 module.exports = {



    createAdminAppUsers : [tokenValidator, async (req, res) => {

         //USER tresspassing leds to ban.
         if(req.body.authorization_tier == "USER")
         {
            res.status(403).send({"error" : "You are blocked from further access"});
         }
         else{
        if(req.authorization_tier == "SUPER"){
            if(req.body.userEmail == undefined ||
                !validator.isEmail(req.body.userEmail) ||
                req.body.name == undefined ||
                req.body.phoneNumber == undefined ||
                req.body.role == undefined ||
                ((req.body.role == "DEPTHEAD" || req.body.role == "FACCOORD" || req.body.role == "STDCOORD") && req.body.departmentAbbr == undefined)
                )
                {
                    res.status(400).send({error : "Please Check Guys...."});
                }
                else{
                    const gn = rn.generator({
                        min: 100000,
                        max: 999999,
                        integer: true
                    });
                    
                    const userName = `${req.body.role}_${gn()}`;
                    const password = Math.random().toString(36).slice(2) + Math.random().toString(36).toUpperCase().slice(2);
                    var department = "";
                    if(req.body.departmentAbbr == undefined)
                    {
                        department = null;
                    }
                    else{
                        department = req.body.departmentAbbr;
                    }
                    const db_connection = await db.promise().getConnection();
                    try{
                        var date_time = new Date().toISOString().slice(0, 19).replace('T', ' ')
                        await db_connection.query("lock tables EventManager write");
                        const [result] = await db_connection.query(`insert into EventManager (userName,userEmail,name,password,timeStamp,phoneNumber,role) values (?,?,?,?,?,?,?)`, [userName, req.body.userEmail, req.body.name, password, date_time, req.body.phoneNumber, req.body.role]);
                        await db_connection.query("unlock tables");
                        mailer(req.body.name, req.body.userEmail, userName, password);
                        res.status(201).send({"status" : "Done..."});
                    }
                    catch(err){
                        const now = new Date();
                        now.setUTCHours(now.getUTCHours() + 5);
                        now.setUTCMinutes(now.getUTCMinutes() + 30);
                        const istTime = now.toISOString().slice(0, 19).replace('T', ' ');
                        fs.appendFile('ErrorLogs/errorLogs.txt', istTime+"\n", (err)=>{});
                        fs.appendFile('ErrorLogs/errorLogs.txt', err.toString()+"\n\n", (err)=>{});
                        res.status(500).send({"Error" : err});
                    }
                    finally{
                        await db_connection.release();
                    }
                }
        }
        else{
            res.status(401).send({"error" : "You have no rights to be here!"})
        }
    }
    }],






    getUserDetails : [tokenValidator, async (req,res) => {
       
        //Accessible to everyone except USER. USER tresspassing leds to ban.
        if(req.body.authorization_tier == "USER")
        {
            res.status(403).send({"error" : "You are blocked from further access"});
        }

         //SUPER Access
         //ADMIN Access
         //EWHEAD Access
         //DEPTHEAD Access
         //STDCOORD Access
         //FACCOORD Access
        else if(req.body.authorization_tier == "ADMIN" || req.body.authorization_tier == "SUPER" || req.body.authorization_tier == "EWHEAD" || req.body.authorization_tier == "DEPTHEAD" || req.body.authorization_tier == "STDCOORD" || req.body.authorization_tier == "FACCOORD"){


        if(req.body.userName == undefined)
        {
            res.status(400).send({error : "We are one step ahead! Try harder!"});
        }
        else{
         let sql_q = `select * from EventManager where userName = ?`;
         const db_connection = await db.promise().getConnection();
         try{
            await db_connection.query("lock tables eventmanager read");
            const [result] = await db_connection.query(sql_q, [req.body.userName]);
            await db_connection.query("unlock tables");
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
    }
    }
    ],



     getEventDetails : [tokenValidator, async(req, res) => {
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
         else if(req.body.authorization_tier == "ADMIN" || req.body.authorization_tier == "SUPER" || req.body.authorization_tier == "EWHEAD" || req.body.authorization_tier == "DEPTHEAD" || req.body.authorization_tier == "STDCOORD" || req.body.authorization_tier == "FACCOORD"){
       
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
                sql_q = `select * from EventData where departmentAbbr = (select departmentAbbr from eventManager where userName = ?) and date = ?`;
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




     createEvent : [tokenValidator, async  (req, res) => {

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
            var result = [];
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
                }
                else if(req.body.authorization_tier == "DEPTHEAD" &&
                req.body.corncUserEmail != undefined &&
                validator.isEmail(req.body.corncUserEmail))
                
                
                {
                    [result] = await db_connection.query(sql_q, [req.body.eventName,req.body.eventOrWorkshop,req.body.technical,req.body.groupOrIndividual,req.body.minCount, req.body.maxCount, req.body.description, req.body.url, req.body.corncUserEmail,req.body.date,req.body.eventTime,req.body.venue,req.body.fees,req.body.totalNumberOfSeats,0,istTime,req.body.refundable,req.body.departmentAbbr]);

                }

                else if(req.body.corncUserEmail != undefined &&
                    validator.isEmail(req.body.corncUserEmail) &&
                        req.body.corncDepartmentAbbr != undefined
                        )
                {
                    [result] = await db_connection.query(sql_q, [req.body.eventName,req.body.eventOrWorkshop,req.body.technical,req.body.groupOrIndividual,req.body.minCount, req.body.maxCount, req.body.description, req.body.url, req.body.corncUserEmail,req.body.date,req.body.eventTime,req.body.venue,req.body.fees,req.body.totalNumberOfSeats,0,istTime,req.body.refundable,req.body.corncDepartmentAbbr]);
                    console.log(result);
                }
               
                
                
                
                
                await db_connection.query("unlock tables");
                
                if(result.affectedRows == 1)
                {
                    res.status(201).send({result : "Data Inserted Succesfully"});
                }
                else{
                    res.status(404).send({"error" : "no data inserted"});
                }
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





     adminLogin : async (req, res) => {
       
        if(req.body.userName == undefined || req.body.password == undefined)
        {
            res.status(400).send({error : "We are one step ahead! Try harder!"});
        }
        else{
        let sql_q = `select * from EventManager where userName = ? and password = ?`
            const db_connection = await db.promise().getConnection();
            try{
                await db_connection.query("lock tables eventmanager read");
                const [result] = await db_connection.query(sql_q, [req.body.userName, req.body.password]);
                await db_connection.query("unlock tables");
                if(result.length == 0)
                {
                    res.status(404).send({error : "User not found"})
                }
                else{
                   
                    const token = await tokenGenerator({
                        userName : req.body.userName,
                        userEmail : result[0].userEmail,
                        name : result[0].name,
                        managerPhoneNumber : result[0].phoneNumber,
                        role : result[0].role,
                        departmentAbbr : result[0].departmentAbbr
                    });
                    res.json({
                        
                            userName : result[0].userName,
                            fullName : result[0].name,
                            phoneNumber : result[0].phoneNumber,
                            role : result[0].role,
                            SECRET_TOKEN : token,
                            department : result[0].departmentAbbr
                        
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



    registeredUsers : [tokenValidator, async (req,res) => {

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



    updateEventData : [tokenValidator,  async (req, res) => {

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
        //FACCOOD Access
        else if(req.body.authorization_tier == "SUPER" || req.body.authorization_tier == "ADMIN" || req.body.authorization_tier == "EWHEAD" || req.body.authorization_tier == "DEPTHEAD" || req.body.authorization_tier == "STDCOORD" || req.body.authorization_tier == "FACCOORD"){
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
                const [result] = await db_connection.query(`update EventData set eventName = ?, groupOrIndividual = ?,minCount = ?, maxCount = ?, description = ?, date = ?, eventTime = ?, venue = ?, fees = ?, totalNumberOfSeats = ?, refundable = ?, departmentAbbr = ? where eventId = ? and userEmail = ?`,[req.body.eventName,req.body.groupOrIndividual, req.body.minCount, req.body.maxCount, req.body.description,req.body.eventDate,req.body.eventTime,req.body.venue,req.body.fees,req.body.totalNumberOfSeats,req.body.refundable,req.body.departmentAbbr,req.body.eventId,req.body.userEmail]);
                await db_connection.query('unlock tables');
                if(result.affectedRows == 0)
                {
                    res.status(400).send({"error" : "Error in data"});
                }
                else{
                res.status(200).send({result : "Updated Succesfully"});
                }}

           
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




    verifyUser : [tokenValidator,async (req,res) => {
        //USER tresspassing leds to ban.
        if(req.body.authorization_tier == "USER")
        {
           res.status(404).send({"error" : "no data found"});
        }
        else{

        if(req.authorization_tier == "SECURITY")
        {
        
        if(req.params.userEmail == undefined) {
            res.sendStatus(400).send("URL not found")
        }
        const db_connection = await db.promise().getConnection();
        let sql_q = `select * from userData where userEmail = ?`;

        try {
            var a = null;
            await db_connection.query('lock tables userdata read');
            const [result] = await db_connection.query(sql_q,[req.params.userEmail]);
            await db_connection.query('unlock tables');
            if(result.length == 0) {
                res.send("Error");
            }
            else {
                
                var entry;
                let sql_entry = `select inside from visitsdata where userEmail = ? order by visit_id desc LIMIT 1;`;
                await db_connection.query('lock tables visitsdata')
                const [result1] = await db_connection.query(sql_entry,[req.params.userEmail]);
                await db_connection.query('unlock tables');
                    if(result1.length == 0) {
                        console.log(err);
                    }
                    else {
                    
                             entry = result_entry;
                     
                            let sql2 = `insert into visitsdata values(?,?,?,?)`;
        
                            var today = new Date();
                            var date = today.getFullYear()+'-'+(today.getMonth()+1)+'-'+today.getDate();
                            var time = today.getHours() + ":" + today.getMinutes() + ":" + today.getSeconds();
                            var dateTime = date+' '+time;
                            var inside = 1;
                
               
                            if(entry.length == 0) {
                                inside = 1;
                            }
                            else {
                    
                                inside = 1 - entry[0]["inside"]
                                var params;
                                if(inside == 1) {
                                    params = [req.params.userEmail,dateTime,null,inside];
                                }
                                 else {
                                    params = [req.params.userEmail,null,dateTime,inside];
                                    }
                                await db_connection.query('lock tables visitsdata');
                                const [result3] = await db_connection.query(sql2,params);
                                await db_connection.query('unlock tables');
                    
                                if(result3.affectedRows == 0) {
                                    console.log(err);
                                    res.send([])
                                }
                                else {
                        
                                    res.send(result);
                                }
                            }

                        }
                
                
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
                res.status(500).send({error : "Query Error"})
            }

            finally{
                await db_connection.release();
            } 
        }
        else{
            res.status(401).send({"error" : "You have no rights to be here!"})
        } 
    }  
        
    }],





getAllEvents : [tokenValidator, async (req, res) => {

    //USER tresspassing leds to ban.
    if(req.body.authorization_tier == "USER")
    {
       res.status(404).send({"error" : "no data found"});
    }

    //SUPER Access
    //ADMIN Access
    else if(req.body.authorization_tier == "SUPER" || req.body.authorization_tier == "ADMIN"){

    let db_connection = await db.promise().getConnection();
    try{
        await db_connection.query('lock tables eventdata');
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

getEventsByDept : [tokenValidator, async (req,res) => {

        //USER tresspassing leds to ban.
        if(req.body.authorization_tier == "USER")
        {
           res.status(404).send({"error" : "no data found"});
        }

        //SUPER Access
        //ADMIN Access
        else if(req.body.authorization_tier == "SUPER" || req.body.authorization_tier == "ADMIN"){

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

        finally {
            await db_connection.release()
        }
    }
    }
],

getEventsByDate : [tokenValidator,async (req,res) => {
        //USER tresspassing leds to ban.
        if(req.body.authorization_tier == "USER")
        {
           res.status(404).send({"error" : "no data found"});
        }

        //ADMIN Access
        //SUPER Access
        else if(req.body.authorization_tier == "SUPER" || req.body.authorization_tier == "ADMIN"){
        
        let db_connection = await db.promise().getConnection();
        try{
            await db_connection.query('lock tables evetdata read');
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

getTotalFee : [tokenValidator,async (req,res) => {

        //USER tresspassing leds to ban.
        if(req.body.authorization_tier == "USER")
        {
           res.status(404).send({"error" : "no data found"});
        }
        //ADMIN Access
        //SUPER Access
        else if(req.body.authorization_tier == "SUPER" || req.body.authorization_tier == "ADMIN"){

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
    }
],

getTotalRegs : [tokenValidator,async (req,res) => {
        //USER tresspassing leds to ban.
        if(req.body.authorization_tier == "USER")
        {
           res.status(404).send({"error" : "no data found"});
        }
        //ADMIN Access
        //SUPER Access
        else if(req.body.authorization_tier == "SUPER" || req.body.authorization_tier == "ADMIN"){

        if(req.body.eventName == undefined && req.body.dept == undefined) {
            res.send("No data sent in post")
        }
        else {
        let db_connection = await db.promise().getConnection();
        try {
            
            if(req.body.dept == undefined) {
                command = `select noOfRegistrations from eventdata where eventName = ?`;
            }
            else if(req.body.evetName == undefined) {
                command = `select sum(noOfRegistrations) as DEPT_REGISTRATIONS from eventdata group by departmentAbbr having departmentAbbr = ?`
            }
            let parameter = (req.body.dept == undefined) ? [req.body.eventName] : [req.body.dept];
            await db_connection.query("lock tables eventData read");
            let command = "";
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
],


getTotalRevenue : [tokenValidator, async (req, res) => {
    //USER tresspassing leds to ban.
    if(req.body.authorization_tier == "USER")
    {
       res.status(404).send({"error" : "no data found"});
    }
    //ADMIN Access
    //SUPER Access
    else if(req.body.authorization_tier == "SUPER" || req.body.authorization_tier == "ADMIN"){
    var searchString = "";
   if(req.body.authorization_tier == "ADMIN"){
    searchString = "select eventData.eventId, eventData.eventName, noOfRegistrations, departmentName, sum(fees) as revenue from registeredEvents left join eventData on eventData.eventId = registeredEvents.eventId  left join departmentData on eventData.departmentAbbr = departmentData.departmentAbbr group by eventData.eventId"
    
   }
   if(req.body.authorization_tier== "DEPTHEAD")
   {
    searchString = "select eventData.eventId, eventData.eventName, noOfRegistrations,totalNumberOfSeats, departmentData.departmentAbbr, departmentName, sum(fees) as revenue from registeredEvents left join eventData on eventData.eventId = registeredEvents.eventId  left join departmentData on eventData.departmentAbbr = departmentData.departmentAbbr group by eventData.eventId having departmentAbbr = ?"
   }

    const db_connection = await db.promise().getConnection();
    try{
        await db_connection.query('lock tables registeredEvents read, eventData read, departmentData read');
        const [result] = await db_connection.query(searchString, [req.body.departmentAbbr]);
        await db_connection.query('unlock tables');
        res.send(result);
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


deleteEvent : [tokenValidator, async(req, res) => {
    //USER tresspassing leds to ban.
    if(req.body.authorization_tier == "USER")
    {
       res.status(404).send({"error" : "no data found"});
    }
    //ADMIN Access
    //SUPER Access
    //EWHEAD Access
    //DEPTHEAD Access
    //FACCOORD Access
    else if(req.body.authorization_tier == "SUPER" || req.body.authorization_tier == "ADMIN" || req.body.authorization_tier == "EWHEAD" || req.body.authorization_tier == "DEPTHEAD" ){
    if(req.body.eventId == undefined ||
        req.body.userEmail == undefined ||
        !validator.isEmail(req.body.userEmail))
        {
            res.status(400).send({error : "We are one step ahead! Try harder!"});
        }
        else{
    const db_connection = await db.promise().getConnection();
    try{
        await db_connection.query("lock tables eventData write");
        const [result] = await db_connection.query('delete from eventData where eventId = ? and userEmail = ?', [req.body.eventId, req.body.userEmail]);
        await db_connection.query("unlock tables");
        if(result.affectedRows == 0)
        {
            res.status(404).send({"error" : "no data found"});
        }
        else{
            res.status(200).send({"message" : "deleted succesfully"});
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
}
}],

 
addStudentCoordinator : [tokenValidator, async(req, res) => {
    //USER tresspassing leds to ban.
    if(req.body.authorization_tier == "USER")
    {
       res.status(404).send({"error" : "no data found"});
    }
    //ADMIN Access
    //SUPER Access
    else if(req.body.authorization_tier == "SUPER" || req.body.authorization_tier == "ADMIN"){
    if(req.body.userEmail == undefined ||
        !validator.isEmail(req.body.userEmail) ||
        req.body.studentCoordinatorEmail == undefined ||
        !validator.isEmail(req.body.studentCoordinatorEmail ||
        req.body.studentCoordName == undefined ||
        req.body.studentCoordPhone == undefined ||
        (!req.body.studentCoordinatorEmail.includes("@cb.amrita.edu") && req.body.studentCoordinatorEmail.includes("@cb.students.amrita.edu"))
        )
        )
        {
            res.status(400).send({error : "We are one step ahead! Try harder!"});
        }
        else{
            const db_connection = await db.promise().getConnection();
            try{
                await db_connection.query("lock tables eventData read");
                const [result] = await db_connection.query("select eventId, departmentAbbr from eventData where eventManagerEmail = ?", [req.body.userEmail]);
                await db_connection.query("unlock tables");
                const gn = rn.generator({
                    min: 100000,
                    max: 999999,
                    integer: true
                });
                const now = new Date();
                now.setUTCHours(now.getUTCHours() + 5);
                now.setUTCMinutes(now.getUTCMinutes() + 30);
                const istTime = now.toISOString().slice(0, 19).replace('T', ' ');
                const userName = `STUDENTCOORD_${gn()}`;
                const password = Math.random().toString(36).slice(2) + Math.random().toString(36).toUpperCase().slice(2);
                await db_connection.query("lock tables eventManager read");
                const [result1] = await db_connection.query('select * from eventManager where userEmail = ?', [req.body.studentCoordinatorEmail]);
                await db_connection.query("unlock tables");
                if(result1.length == 0){
                await db_connection.query("lock tables eventManager write");
                const [result2] = await db_connection.query('insert into eventManager (userName, userEmail, name, password, timeStamp, phoneNumber, role, departmentAbbr) values (?, ?, ?, ?, ?, ?, ?, ?)', [userName, req.body.studentCoordinatorEmail, req.body.studentCoordName, password, istTime, req.body.studentCoordPhone, 'STDCOORD', result[0].departmentAbbr]);
                await db_connection.query("unlock tables");
                await db_connection.query("lock tables StudentCoordinator write");
                const [result3] = await db_connection.query("insert into StudentCoordinator (faculty, student, eventId) values (?, ?, ?)", [req.body.userEmail, req.body.studentCoordinatorEmail,result[0].eventId]);
                await db_connection.query("unlock tables");   
                mailer(req.body.name, req.body.userEmail, userName, password); 
                res.status(201).send({"message" : "Done Succesfully"});
            }
                else{
                    res.status(409).send({"error" : "data already exists"});
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
    }
        
}]



    
}

