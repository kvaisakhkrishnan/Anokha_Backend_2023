const { db, transactions_db } = require('../connection');
const fs = require('fs');
const axios = require('axios');
const crypto = require('crypto');
const querystring = require('querystring');
var CRC32 = require("crc-32");


const checkPaymentStatus = async () => {
    const db_connection = await transactions_db.promise().getConnection();
    try {
        await db_connection.query('lock tables transactions read');
        const [result] = await db_connection.query('select * from transactions where transactionStatus = "INITIATED"');
        await db_connection.query('unlock tables');
        if (result.length == 0) {



        } else {
            var txidCollab = "";

            for (var transactiondata of result) {
                txidCollab += transactiondata.transactionId + "|";
            }

            var transactionSet = txidCollab.substring(0, txidCollab.length - 1);

            const key = "ypfBaj";
            const salt = "aG3tGzBZ";
            const text = key + "|" + 'verify_payment' + "|" + transactionSet + "|" + salt;
            const hash = crypto.createHash('sha512');
            hash.update(text);
            hashedData = hash.digest('hex');

            const postData = querystring.stringify({
                key: key,
                command: 'verify_payment',
                var1: transactionSet,
                hash: hashedData
            });

            const options = {
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                    'Content-Length': postData.length
                }
            };

            const response = await axios.post('https://info.payu.in/merchant/postservice?form=2', postData, options);
             for (individualTransaction in response.data.transaction_details)
             {
                if(response.data.transaction_details[individualTransaction].status == 'failure')
                {
                       const db_connection = await transactions_db.promise().getConnection();
                       try{
                            await db_connection.query('lock tables transactions write');
                            const [result] = await db_connection.query('update transactions set transactionStatus = "FAILURE" where transactionId = ?', [response.data.transaction_details[individualTransaction].txnid]);
                            await db_connection.query('unlock tables');
                       }
                       catch(err) {
                        console.log(err);
                        const now = new Date();
                        now.setUTCHours(now.getUTCHours() + 5);
                        now.setUTCMinutes(now.getUTCMinutes() + 30);
                        const istTime = now.toISOString().slice(0, 19).replace('T', ' ');
                        fs.appendFile('ErrorLogs/errorLogs.txt', istTime+"\n", (err)=>{});
                        fs.appendFile('ErrorLogs/errorLogs.txt', err.toString()+"\n\n", (err)=>{});
                        console.log("Contact DB Admin if you see this message");
                    }
        
                    finally {
                        await db_connection.release()
                    }

                }
                else if(response.data.transaction_details[individualTransaction].status == 'success')
                {
                    const amount = response.data.transaction_details[individualTransaction].amt;
                    const db_connection = await transactions_db.promise().getConnection();
                    try{
                        await db_connection.query('lock tables transactions write');
                        const [result] = await db_connection.query('update transactions set transactionStatus = "SUCCESS" where transactionId = ? and amount = ?', [response.data.transaction_details[individualTransaction].txnid, amount]);
                        
                        await db_connection.query('unlock tables');
                        
                        if(result.affectedRows == 0)
                        {
                            await db_connection.query('lock tables transactions write');
                            const [result] = await db_connection.query('update transactions set transactionStatus = "MALPERROR" where transactionId = ?', [response.data.transaction_details[individualTransaction].txnid]);
                            await db_connection.query('unlock tables');
                        }
                        else{
                            await db_connection.query('lock tables transactions read');
                            const [output] = await db_connection.query('select * from transactions where transactionId = ?', [response.data.transaction_details[individualTransaction].txnid])
                            await db_connection.query('unlock tables');


                   
                          

                            if(output[0].productId == "PASSPORT")
                            {
                                const conn = await db.promise().getConnection();
                                try{
                                    await conn.query('lock tables userData write');
                                    const [passport] = await conn.query('select * from userData where userEmail = ?', [output[0].userEmail]);
                                    var passportId = "";
                                   
                                    passportId = "A23E" + CRC32.str([output[0].userEmail]);
                                    

                                    const [fin] = await conn.query("update userData set passportId = ?, activePasspor = ? where userEmail = ?", [passportId, 1, [output[0].userEmail]]);
                                    await conn.query('unlock tables');
                                }
                                catch(err) {
                                    console.log(err);
                                    const now = new Date();
                                    now.setUTCHours(now.getUTCHours() + 5);
                                    now.setUTCMinutes(now.getUTCMinutes() + 30);
                                    const istTime = now.toISOString().slice(0, 19).replace('T', ' ');
                                    fs.appendFile('ErrorLogs/errorLogs.txt', istTime+"\n", (err)=>{});
                                    fs.appendFile('ErrorLogs/errorLogs.txt', err.toString()+"\n\n", (err)=>{});
                                    console.log("Contact DB Admin if you see this message");
                                }
                    
                                finally {
                                    await conn.release()
                                }
                            }
                            else{
                               
                                var eventId = output[0].productId.substring(1);
                                const conn = await db.promise().getConnection();
                                try{
                                    console.log("THIS");
                                    const now = new Date();
                                    now.setUTCHours(now.getUTCHours() + 5);
                                    now.setUTCMinutes(now.getUTCMinutes() + 30);
                                    const istTime = now.toISOString().slice(0, 19).replace('T', ' ');
                                    await conn.query('lock tables registeredEvents write');
                                    const [out] = await conn.query('insert into registeredEvents (userEmail, eventId, timeStamp, refundRequested) values (?,?,?,?)', [output[0].userEmail, eventId, istTime, 0])
                                    await conn.query('unlock tables');
                                    await conn.query('lock tables eventData write');
                                    const [out2] = await conn.query('update eventData set noOfRegistrations = noOfRegistrations + 1 where eventId = ?', [eventId]);
                                    await conn.query('unlock tables');
                                }
                                catch(err) {
                                    console.log(err);
                                    const now = new Date();
                                    now.setUTCHours(now.getUTCHours() + 5);
                                    now.setUTCMinutes(now.getUTCMinutes() + 30);
                                    const istTime = now.toISOString().slice(0, 19).replace('T', ' ');
                                    fs.appendFile('ErrorLogs/errorLogs.txt', istTime+"\n", (err)=>{});
                                    fs.appendFile('ErrorLogs/errorLogs.txt', err.toString()+"\n\n", (err)=>{});
                                    console.log("Contact DB Admin if you see this message");
                                }
                    
                                finally {
                                    await conn.release()
                                }

                            }
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
                        console.log("Contact DB Admin if you see this message");
                    }
        
                    finally {
                        await db_connection.release()
                    }
                }
                else{

                }

             }
            
            

        }

    } catch (err) {
        console.log("Error");
        const now = new Date();
        now.setUTCHours(now.getUTCHours() + 5);
        now.setUTCMinutes(now.getUTCMinutes() + 30);
        const istTime = now.toISOString().slice(0, 19).replace('T', ' ');
        fs.appendFile('ErrorLogs/errorLogs.txt', istTime + "\n", (err) => { });
        fs.appendFile('ErrorLogs/errorLogs.txt', err.toString() + "\n\n", (err) => { });
    } finally {
        await db_connection.release();
    }
}

module.exports = checkPaymentStatus;
