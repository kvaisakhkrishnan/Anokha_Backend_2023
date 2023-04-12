

var request = require("request");
const axios = require('axios');
const querystring = require('querystring');

const config = require("../config.js.example");


const options = {
    headers: {
        'Content-Type': 'application/json',
        
    }
};



var vendor_token;
axios.post("https://amritawallet.cb.amrita.edu/api/auth/login", {
    username: config.ewallet_username,
    password: config.password
    }
    )
    .then((response) => {
        vendor_token = response.data.token;
      
    });


axios.post("https://amritawallet.cb.amrita.edu/api/v2/card/transfer",{
    fromCardNo:"CB.EN.U4CSE20159",pin:"2682",toCardNo:"AWESHOP0094",amount:"1.00",orderDetails:","
    },
    {headers : {
        'authorization' : vendor_token
    }}
    ).then((response) => {
        console.log(response.data);
    })





   /* const postData = querystring.stringify({
        username: "eventide2023",
        password:"Eventide#123"
 


req.write(JSON.stringify(postbody));
req.end()
*/
