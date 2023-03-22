const express = require('express')
const createTables = require('./Relations/createRelations');
const dropTables = require('./Relations/dropRelations');
const createTransactionTable = require('./Relations/createTransactionsTable')
const dropTransactionTable = require('./Relations/dropTransactionsTable')
const cluster = require('cluster');
const { pid } = require('process');
const numCPUs = require('os').cpus().length;
const {db, transactions_db} = require('./connection');
const insertDummyData = require('./SampleData/dummyData');
const server = express();
const port = 3000;
const userAppRouter = require('./routes/userApp');
const adminAppRouter = require('./routes/adminApp');


    
const initialize = () => {
    //Drop command. Please be carefull!!
    dropTables(db);
    dropTransactionTable(transactions_db);
    //Creating tables. Please be careful!
    createTables(db);  
    createTransactionTable(transactions_db); 
    //Inserting Sample Data. Please be careful!
    insertDummyData(db, transactions_db);
}


    //Please be careful. Dont run this command if you have data in backend.
    //initialize();
    
    server.use(express.json());
    
     //Routes
    server.use('/userApp', userAppRouter);
    server.use('/adminApp', adminAppRouter);

    //Thread listening on port PORT
    server.listen(port,  (err) => {
        if(err){
            console.log("Error starting server");
        }
        else{
            console.log(`Process ${pid} listening on port ${port}`)
        }
    })

    
    
   

    
   
  



