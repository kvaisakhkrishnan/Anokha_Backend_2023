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
                const [result] = await db_connection.query(sql_q, [req.body.userName, req.body.password]);
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
                        role : result[0].role
                    });
                    res.json({
                        
                            userName : result[0].userName,
                            fullName : result[0].name,
                            phoneNumber : result[0].phoneNumber,
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
    }
}