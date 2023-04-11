const { db, transactions_db } = require('../connection');
const fs = require('fs');
const axios = require('axios');
const crypto = require('crypto');
const querystring = require('querystring');

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

            //console.log(transactionSet);

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
            console.log(response.data);
             for (individualTransaction in response.data.transaction_details)
             {
                if(response.data.transaction_details[individualTransaction].status == 'failure')
                {
                       
                }
                else if(response.data.transaction_details[individualTransaction].status == 'success')
                {
                    const amount = response.data.transaction_details[individualTransaction].amt;
                    const db_connection = await transactions_db.promise().getConnection();
                    try{
                        await db_connection.query('lock tables transactions write');
                        const [result] = await db_connection.query('update transactions set transactionStatus = "SUCCESS" where transactiondId = ? and amount = ?', [individualTransaction, amount]);
                        await db_connection.query('unlock tables');

                        if(result.affectedRows == 0)
                        {
                            await db_connection.query('lock tables transactions write');
                            const [result] = await db_connection.query('update transactions set transactionStatus = "MALPERROR" where transactiondId = ?', [individualTransaction]);
                            await db_connection.query('unlock tables');
                        }
                        else{

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
