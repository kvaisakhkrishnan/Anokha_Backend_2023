const { db, transactions_db } = require('../connection');
const tokenGenerator = require('../middleware/appTokenGenerator');
const tokenValidator = require('../middleware/appTokenValidator');
const otpTokenGenerator = require('../middleware/otpTokenGenerator.js');
const otpTokenValidator = require('../middleware/otpTokenValidator');
const randonNumberGenerator = require('../OTPGenerator/otp');
const mailer = require('../Mailer/otpGenerator');
const welcomeMailer = require('../Mailer/welcomeMailer');
const resetMailer = require('../Mailer/resetOtp');
const validator = require('validator');
const fs = require('fs');
const crypto = require('crypto');
const request = require('request');
const transactionTokenGenerator = require('../middleware/transactionTokenGenerator');
const transactionTokenVerifier = require('../middleware/transactionTokenVerifier');
module.exports = {




    getUserDetails : [tokenValidator, async (req, res) => {
        if(req.body.userEmail != undefined &&
            validator.isEmail(req.body.userEmail))
         {

        const db_connection = await db.promise().getConnection();
        try{
            await db_connection.query("lock tables userdata read, AnokhaUserData read");
            let sql_q = "select * from AnokhaUserData where userEmail = ?";
            const [results] = await db_connection.query(sql_q, req.body.userEmail);
            await db_connection.query('unlock tables');
            res.status(200).send(results);
        }

        catch (err) {
            const now = new Date();
            now.setUTCHours(now.getUTCHours() + 5);
            now.setUTCMinutes(now.getUTCMinutes() + 30);
            const istTime = now.toISOString().slice(0, 19).replace('T', ' ');
            fs.appendFile('ErrorLogs/errorLogs.txt', istTime+"\n", (err)=>{});
            fs.appendFile('ErrorLogs/errorLogs.txt', err.toString()+"\n\n", (err)=>{});
            res.status(500).send({"Error" : "Contact DB Admin if you see this message"});
          } finally {
            db_connection.release();
          }
        }
        else{
            res.status(400).send({error : "We are one step ahead! Try harder!"});
            return;
            }


    }],





    editUserDetails: [tokenValidator, async (req,res) => {
        if(req.body.fullName == undefined ||
            req.body.password == undefined ||
            req.body.userEmail == undefined ||
            validator.isEmpty(req.body.fullName) ||
            validator.isEmpty(req.body.password) ||
            validator.isEmpty(req.body.userEmail) ||
            !validator.isEmail(req.body.userEmail)
            )
            {
                res.status(400).send({error : "We are one step ahead! Try harder!"});
                return;
            }
            else{
                let sql_q = `Update userData SET fullName = ?,password = ? where userEmail = ?`
                let db_connection = await db.promise().getConnection();
        try{
            
            await db_connection.query('lock tables userdata write');
            const [results] = await db_connection.query(sql_q, [req.body.fullName,req.body.password,req.body.userEmail]); 
            await db_connection.query('unlock tables');
            if(results.affectedRows == 0)
            {
                res.status(400).send({"error" : "no data found. dont play around here..."});
            }
            else{
                res.status(200).send({"result" : "data updated..."});
            }

        }
        catch(err){
            const now = new Date();
            now.setUTCHours(now.getUTCHours() + 5);
            now.setUTCMinutes(now.getUTCMinutes() + 30);
            const istTime = now.toISOString().slice(0, 19).replace('T', ' ');
            fs.appendFile('ErrorLogs/errorLogs.txt', istTime+"\n", (err)=>{});
            fs.appendFile('ErrorLogs/errorLogs.txt', err.toString()+"\n\n", (err)=>{});
            res.status(500).send({"Error" : "Contact DB Admin if you see this message"});
          } finally {
            db_connection.release();
          }
   
    }
    }],








    userLogin : async (req, res) => {
        if(req.body.userEmail != undefined && req.body.password != undefined && !validator.isEmpty(req.body.userEmail) && !validator.isEmpty(req.body.password) && validator.isEmail(req.body.userEmail)){
        
        let db_connection = await db.promise().getConnection();
        try{
            
            let sql_q = `select * from AnokhaCompleteUserData where userEmail = ? and password = ?`;
            await db_connection.query("lock tables AnokhaCompleteUserData read, UserData read, CollegeData read")
            const [result1] = await db_connection.query(sql_q, [req.body.userEmail, req.body.password]);
            await db_connection.query('unlock tables');
            let sql_q2 = `SELECT *, CASE WHEN EXISTS (SELECT 1 FROM starredEvents WHERE starredEvents.eventId = AnokhaEventsAndDepartments.eventId AND starredEvents.userEmail = ?) THEN 1 ELSE 0 END AS isStarred FROM AnokhaEventsAndDepartments`;
            await db_connection.query('lock tables eventdata read, departmentdata read, AnokhaEventsAndDepartments read, starredEvents read');
            const [results] = await db_connection.query(sql_q2, [req.body.userEmail]);
            await db_connection.query('unlock tables');
            var jsonResponse = [];
            if (results.length !== 0) {
                var eventsByDepartment = {};
                var department = "";
                for (const eventData of results) {
                  if (eventData.departmentAbbr === department) {
                    eventsByDepartment.events.push(eventData);
                  } else {
                    if (department !== "") {
                      jsonResponse.push(eventsByDepartment);
                    }
                    eventsByDepartment = {
                      department: eventData.departmentName,
                      events: [eventData]
                    };
                    department = eventData.departmentAbbr;
                  }
                }
                if (department !== "") {
                  jsonResponse.push(eventsByDepartment);
                }
              }
              
          



            if(result1.length == 0)
            {
                res.status(404).send({error : "User not found"});
            }
            else{

                const token = await tokenGenerator({
                    userEmail : result1[0].userEmail,
                    fullName : result1[0].fullName,
                    collegeName : result1[0].collegeName,
                    district : result1[0].district,
                    country : result1[0].country,
                    role : "USER"
                });
                res.json({"userData" : {
                    
                        userEmail : result1[0].userEmail,
                        fullName : result1[0].fullName,
                        activePassport : result1[0].activePassport,
                        isAmritaCBE : result1[0].isAmritaCBE,
                        collegeName : result1[0].collegeName,
                        district : result1[0].district,
                        state : result1[0].state,
                        country : result1[0].country,
                        SECRET_TOKEN : token
                },
                "events" : jsonResponse
                    
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
        finally 
        {
            db_connection.release();
        }   
        }
        else
        {
            res.status(400).send({error : "We are one step ahead! Try harder!"});
            return;
        }
    },




    

    registerUser : async (req, res) =>{


        if(req.body.userEmail == undefined ||
            req.body.fullName == undefined ||
            req.body.password == undefined ||
            req.body.collegeId == undefined ||
            !validator.isEmail(req.body.userEmail))
            
            {
                res.status(400).send({error : "We are one step ahead! Try harder!"});
                return;
            }

            else{
               
                const db_connection = await db.promise().getConnection();
                try{
                    await db_connection.query("lock tables AnokhaUserData read, userData read");
                    const [result] = await db_connection.query("select * from AnokhaUserData where userEmail = ?",[req.body.userEmail] );
                    await db_connection.query("unlock tables");
                    if(result.length != 0)
                    {
                        res.status(409).send({"error" : "user already exists..."});
                        
                    }
                    else{

                        if(req.body.collegeId == 633 || req.body.collegeId == 638 || req.body.collegeId == 641 || req.body.collegeId == 645)
                        {
                            if(req.body.userEmail.includes("@cb.amrita.edu") || req.body.userEmail.includes("@cb.students.amrita.edu"))
                            {
                                //User is from Amrita CBE with Amrita Email
                                //Need tp verify credibility
                            }
                            else
                            {
                                //User claims to be from Amrita CBE
                                //Email is not under Amrita domain
                                //Credibility cannot be verified
                                res.status(400).send({"error" : "invalid email"});
                                return;
                            }
                        }
                        else{
                
                            //User is not from Amrita CBE
                            //Need tp verify credibility of email given
                            
                        }
                        var currentStatus = 0;
                        var isAmrita = 0;
                        if(req.body.collegeId == 633 || req.body.collegeId == 638 || req.body.collegeId == 645)
                        {
                            isAmrita = 1;
                            currentStatus = 1;
                        }

                        const otpGenerated = randonNumberGenerator();
                        const now = new Date();
                        now.setUTCHours(now.getUTCHours() + 5);
                        now.setUTCMinutes(now.getUTCMinutes() + 30);
                        const istTime = now.toISOString().slice(0, 19).replace('T', ' ');

                        await db_connection.query("lock tables otp write");
                        await db_connection.query(`delete from OTP where userEmail = ?`,[req.body.userEmail]);
                        await db_connection.query(`insert into OTP (userEmail, otp, fullName, password, currentStatus, activePassport, isAmritaCBE, collegeId, accountTimeStamp, passportId, passportTimeStamp) values (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,[req.body.userEmail,otpGenerated,req.body.fullName,req.body.password,currentStatus,0,isAmrita,req.body.collegeId,istTime,null,null]);
                        await db_connection.query("unlock tables");
                               
                        const token = await otpTokenGenerator({
                                    userEmail : req.body.userEmail,
                                    fullName : req.body.fullName,
                                    collegeId : req.body.collegeId
                                    
                        });
                                
                        mailer (req.body.fullName, req.body.userEmail, otpGenerated);
                        res.status(200).send({SECRET_TOKEN : token});
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
                    db_connection.release();
                }

               
       
        
    }

        
    },


    verifyOTP :[otpTokenValidator, async (req, res) => {
        if(req.body.userEmail == undefined ||
            req.body.otp == undefined ||
        !validator.isEmail(req.body.userEmail))
        {
            res.status(400).send({error : "We are one step ahead! Try harder!"});
            return;
        }
        else{
        const otp = req.body.otp;
        const userEmail = req.body.userEmail;

        const db_connection = await db.promise().getConnection();
        try{
            await db_connection.query("lock tables otp write, anokhaotp read");
            const [result] = await db_connection.query(`select * from  AnokhaOTP where userEmail = ? and otp = ?`,[userEmail,otp]);
            await db_connection.query("unlock tables");
            console.log(result);
            if(result.length == 1)
                {
                    const now = new Date();
                    now.setUTCHours(now.getUTCHours() + 5);
                    now.setUTCMinutes(now.getUTCMinutes() + 30);
                    const istTime = now.toISOString().slice(0, 19).replace('T', ' ');   
                    await db_connection.query("lock tables UserData write, otp write");
                    db_connection.query(`insert into UserData (userEmail, fullName, password, currentStatus, activePassport, isAmritaCBE, collegeId, accountTimeStamp, passportId, passportTimeStamp) values (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,[result[0].userEmail,result[0].fullName,result[0].password,result[0].currentStatus,0,result[0].isAmritaCBE,result[0].collegeId,istTime,null,null]);
                    db_connection.query(`delete from OTP where userEmail = ?`,[userEmail]);
                    await db_connection.query("unlock tables");
                    welcomeMailer(result[0].fullName, userEmail);
                    res.status(200).send({"result" : "success"})
                }
                else{
                    res.status(400).send({"error" : "Cannot verify please try again"})
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
            db_connection.release();
        } 
    }

    }],



    insertStarredEvent : [
        tokenValidator,
       async (req,res) => {

            if(req.body.userEmail == undefined ||
                req.body.eventId == undefined ||
                !validator.isEmail(req.body.userEmail))
            {
                res.status(400).send({error : "We are one step ahead! Try harder!"});
                return;
            }
            else{

            let sql_q = `insert into starredevents values (?,?)`
            let db_connection = await db.promise().getConnection();
            try{
                await db_connection.query("lock tables starredevents write");
                const [results] = await db_connection.query(sql_q, [req.body.eventId,req.body.userEmail]); 
                await db_connection.query("unlock tables");
                if(results.affectedRows == 0)
                {
                    res.status(400).send({"error" : "no data found. dont play around here..."});
                }
                else{
                    res.status(200).send({"result" : "data updated..."});
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
                db_connection.release();
            }
            }
        }
    ],



    dropStarredEvent : [
        tokenValidator,async (req,res) => {

            if(req.body.userEmail == undefined ||
                req.body.eventId == undefined ||
                !validator.isEmail(req.body.userEmail))
            {
                res.status(400).send({error : "We are one step ahead! Try harder!"});
                return;
            }
            else{

            
            let sql_q = `delete from starredevents where (userEmail = ? and eventId = ?)`;
            let db_connection = await db.promise().getConnection();
            try{
                await db_connection.query("lock tables starredevents write");
                const [results] = await db_connection.query(sql_q, [req.body.userEmail, req.body.eventId]); 
                await db_connection.query("unlock tables");
                if(results.affectedRows == 0)
                {
                    res.status(400).send({"error" : "no data found. dont play around here..."});
                }
                else{
                    res.status(200).send({"result" : "data updated..."});
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
                db_connection.release();
            }
        }
        }
    ],




    getStarredEvents : [tokenValidator, async (req, res) => {

        if(req.body.userEmail == undefined ||
            !validator.isEmail(req.body.userEmail))
        {
            res.status(400).send({error : "We are one step ahead! Try harder!"});
            return;

        }
        else{

            let db_connection = await db.promise().getConnection();
            try{
                await db_connection.query("lock tables AnokhaStarredEventsData read, eventData read, departmentData read");
                const [result] = await db_connection.query(`select * from AnokhaStarredEventsData where userEmail = ?`,[req.body.userEmail]);
                await db_connection.query("unlock tables");
                res.send(result);
            }
            catch(err){
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




    getCrewDetails : 
       async (req,res) => {
            let db_connection = await db.promise().getConnection();
            await db_connection.query("lock tables AnokhaCrewCompleteData read, userdata read, collegedata read");
            let sql_q = `select * from AnokhaCrewCompleteData order by teamId`;
            await db_connection.query("unlock tables");
            var jsonResponse = [];
            try {
             const [results] = await db_connection.query(sql_q);
            var crewByTeam = {};
            var teamName = "";
            results.forEach((crewMember) => {
                if (crewMember.teamName === teamName) {
                crewByTeam.member.push(crewMember);
                } else {
                if (teamName !== "") {
                  jsonResponse.push(crewByTeam);
                }
                  crewByTeam = {
                  teamName: crewMember.teamName,
                  member: [crewMember]
                 };
             teamName = crewMember.teamName;
    }
  });

  // Add the last crewByTeam to jsonResponse
  if (teamName !== "") {
    jsonResponse.push(crewByTeam);
  }

  res.status(200).send(jsonResponse);
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
,



    getAllEvents : [tokenValidator, async (req, res) => {
        let db_connection = await db.promise().getConnection();
        try{
            await db_connection.query("lock tables eventData read");
            const [result] = await db_connection.query(`select * from eventData`);
            await db_connection.query("unlock tables");
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
    }],

    
    





    moveToTransaction : [tokenValidator, async (req, res) => {
        const tokenHeader = req.headers.authorization;
        const token = tokenHeader && tokenHeader.split(' ')[1];
        if(token == null)
        {
            res.status(400).send({error : "We are one step ahead! Try harder!"});
            return;
        }
        const transactionToken = await transactionTokenGenerator({
            SECRET_TOKEN : token
        });
        if(transactionToken == null)
        {
            res.status(400).send({"error" : "Invalid Token"});
            return;
        }
        res.status(200).send({"TRANSACTION_SECRET_TOKEN" : transactionToken});
    }],



    


    



    intiatePay :[transactionTokenVerifier, async (req, res) => {

        if(
            req.body.productId == undefined ||
            (req.body.productId[0] !="E" && req.body.productId[0] !="P") ||
            req.body.firstName == undefined ||
            req.body.userEmail == undefined ||
            !validator.isEmail(req.body.userEmail) ||
            req.body.address == undefined ||
            req.body.city == undefined ||
            req.body.state == undefined ||
            req.body.country == undefined ||
            req.body.zipcode == undefined ||
            req.body.phoneNumber == undefined 
          

            )
            {
                res.status(400).send({"error" : "Wohooooo..! Be careful.... If you are bad, I am your dad!"})
            }
            else{

                
                
                var hashedData;
                var txid;
                var amount;
                var productinfo;
                if(req.body.productId[0] == "E")
                {
                    const db_connection = await db.promise().getConnection();
                try{
                    await db_connection.query("lock tables eventData read");
                    const [result] = await db_connection.query("select * from eventData where eventId = ?", [req.body.productId.substring(1,req.body.productId.length)]);
                    await db_connection.query("unlock tables");
                  
                    if(result.length == 0)
                    {
                        
                        res.status(400).send({"error" : "We are much ahead of you..."});
                        return;
                    }
                    else{
                        txid = "ANOKHA2023" + new Date().getTime();
                        amount = result[0].fees;
                        const key = "Pz9v2c";
                        const salt = "TbxC2ph02lBUbVYwx0fIB50CvqL27pHo";
                        productinfo = req.body.productId;
                        const firstName = req.body.firstName;
                        const userEmail = req.body.userEmail;
                        const phoneNumber = req.body.phoneNumber;
                        const callbackurl = "http://52.66.236.118:3000/userApp/data";
                        const text = key + "|" + txid + "|" + amount + "|" + req.body.productId + "|" + firstName + "|" + userEmail + "|||||||||||" + salt;
                        const hash = crypto.createHash('sha512');
                        hash.update(text);
                        hashedData = hash.digest('hex');

                        
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
                else{
                        txid = "ANOKHA2023" + new Date().getTime();
                        amount = 500;
                        const key = "Pz9v2c";
                        const salt = "TbxC2ph02lBUbVYwx0fIB50CvqL27pHo";
                        productinfo = "PASSPORT";
                        const firstName = req.body.firstName;
                        const userEmail = req.body.userEmail;
                        const phoneNumber = req.body.phoneNumber;
                        const callbackurl = "http://52.66.236.118:3000/userApp/data";
                        const text = key + "|" + txid + "|" + amount + "|" + productinfo + "|" + firstName + "|" + userEmail + "|||||||||||" + salt;
                        const hash = crypto.createHash('sha512');
                        hash.update(text);
                        hashedData = hash.digest('hex');

                }
                const transaction_db_connection = await transactions_db.promise().getConnection(); 
                try{
                      
                    const now = new Date();
                    now.setUTCHours(now.getUTCHours() + 5);
                    now.setUTCMinutes(now.getUTCMinutes() + 30);
                    const istTime = now.toISOString().slice(0, 19).replace('T', ' ');
                    await transaction_db_connection.query("lock tables transactions write");
                    if(req.body.productId[0] == "E")
                    {
                        await transaction_db_connection.query("insert into transactions (transactionId, productId, userEmail, senderName, eventIdOrPassportId, amount, timeStamp, transactionStatus, address, city, state, zipcode, country, phoneNumber) values (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)", [txid, req.body.productId.substring(2,req.body.productId.length), req.body.userEmail, req.body.firstName,'EVENT' , amount, istTime, 'INITIATED', req.body.address, req.body.city, req.body.state, req.body.zipcode, req.body.country, req.body.phoneNumber]);

                    }
                    else{
                        await transaction_db_connection.query("insert into transactions (transactionId, productId, userEmail, senderName, eventIdOrPassportId, amount, timeStamp, transactionStatus, address, city, state, zipcode, country, phoneNumber) values (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)", [txid, productinfo, req.body.userEmail, req.body.firstName, 'PASSPORT', amount, istTime, 'INITIATED', req.body.address, req.body.city, req.body.state, req.body.zipcode, req.body.country, req.body.phoneNumber]);

                    }
                    await transaction_db_connection.query("unlock tables");
                    res.status(201).send({
                        "txid" : txid,
                        "product" : productinfo,
                        "amount" : amount,
                        "hash" : hashedData

                    })

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
                    await transaction_db_connection.release();
                }

                
           
            }

    }],

    forgotPassword : async (req, res) => {
        if(req.body.userEmail == undefined ||
            !validator.isEmail(req.body.userEmail))
            {
                res.status(400).send({"error" : "We are much ahead of you..."});
                return;
            }

        else{
                const db_connection = await db.promise().gerConnection();
                try{
                    await db_connection.query("lock tables user userdata read");
                    const [result] = await db_connection.query("select * from userdata where userEmail = ?", [res.body.userEmail]);
                    await db_connection.query("unlock tables");
                    if(result.length == 0)
                    {
                        res.status(404).send({"error" : "User not found"});
                    }
                    else{
                        const otpGenerated = randonNumberGenerator();
                        await db_connection.query("lock tables ResetOtp write");
                        await db_connection.query("delete from ResetOtp where userEmail = ?", [req.body.userEmail]);
                        await db_connection.query("insert into ResetOtp (userEmail, otp) values(?, ?)", [req.body.userEmail,otpGenerated ]);
                        await db_connection.query("unlock tables");
                        resetMailer(result[0].fullName, res.body.userEmail, otpGenerated);
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
    },



    getCollegeData : async (req, res) => {
        const db_connection = await db.promise().getConnection();
        try{
            await db_connection.query("lock tables CollegeData read");
            const [result] = await db_connection.query("select * from CollegeData");
            await db_connection.query("unlock tables");
            res.send(result);
        }
        catch(err){
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

    }},

    getNextEvent : [tokenValidator, async(req, res) => {
        const db_connection = await db.promise().getConnection();
        try{
            // Get the current date and time
            const currentDate = new Date();

            // Extract hours and minutes from the current date
            const hours = currentDate.getHours();
            const minutes = currentDate.getMinutes();

            // Format the hours and minutes to two digits with leading zeros
        const formattedHours = String(hours).padStart(2, '0');
        const formattedMinutes = String(minutes).padStart(2, '0');

            // Concatenate hours and minutes to create the 24-hour time string
            const currentTime = `${formattedHours}:${formattedMinutes}`;


            const months = [
                "Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
              ];
              
              
              // Get the day, month, and year
              const day = currentDate.getDate();
              const month = months[currentDate.getMonth()];
              const year = currentDate.getFullYear();
              
              // Format the date in "day-MON-year" format
              const formattedDate = `${day}-${month}-${year}`;
              
             
//            const [result] = await db_connection.query("select * from registeredEvents left join eventData on registeredEvents.eventId = eventData.eventId where eventData.eventTime > ? and registeredEvents.userEmail = ? and eventData.date = ? order by eventData.eventTime", [currentTime,req.body.userEmail, formattedDate]);

            await db_connection.query("lock tables registeredEvents read, eventData read");
            const [result] = await db_connection.query("select * from registeredEvents left join eventData on registeredEvents.eventId = eventData.eventId where registeredEvents.userEmail = ?  order by eventData.eventTime", [req.body.userEmail]);
            await db_connection.query("unlock tables");
            if(result.length == 0)
            {
                    res.status(404).send({"error" : "no data found"});
            }
            else{
                res.status(200).send(result);
            }
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
            db_connection.release();
          }
    }],

    myEvents : [tokenValidator, async (req, res) => {
        const db_connection = await db.promise().getConnection();
        try{
            await db_connection.query("lock tables eventData read, registeredEvents read");
            const [result] = await db_connection.query("select * from registeredEvents left join eventData on registeredEvents.eventId = eventData.eventId where registeredEvents.userEmail = ?", [req.body.userEmail]);
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
            db_connection.release();
          }
    }]

    
    
            
            }
        
        
    

   
   



