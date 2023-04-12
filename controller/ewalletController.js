

var request = require("request");
const axios = require('axios');
const querystring = require('querystring');
const mailer = require('nodemailer');

const fs = require('fs');
const config = require("../config.js.example");



var otp;
module.exports = {


    verifyOtp : async (req,res) => {
          var transporter = mailer.createTransport({
    service: 'hotmail',
    auth: {
        user: 'anokha@cb.amrita.edu',
        pass: '@u97*j3P^RG49V'
    }
});

 otp = Math.floor(Math.random() * (999999 - 100000 + 1)) + 100000;
const data = fs.readFileSync('htmlDocuments/otpVerification.html').toString();
const finaldata = data.replace('%= name %', "Student").replace('%= otp %', otp);



var mailOptions = {
    from: {
    
    address : 'anokha@cb.amrita.edu'
  },
    to: req.body.userEmail,
    subject: 'OTP Verification for Eventide 2023',
    html: finaldata
  }
  

  
  
  
    transporter.sendMail(mailOptions, function(error, info){});

    res.send("Otp sent for verification");
    },

    startPayment : async (req,res) => {
        
        if(req.body.user_otp != otp) {
            res.send("Error : Invalid OTP")
        }

        else {
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
    fromCardNo:req.body.userCardNo,pin:req.body.pin,toCardNo:config.toCardNo,amount:"500.00",orderDetails:","
    },
    {headers : {
        'authorization' : vendor_token
    }}
    ).then((response) => {
        res.send(response.data);
        //console.log(response.data);
    },(err) => {
        res.send(err.response.data.message);
        
        
    })


        }
    }
}







/*var vendor_token;
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
    })*/





   /* const postData = querystring.stringify({
        username: "eventide2023",
        password:"Eventide#123"
 


req.write(JSON.stringify(postbody));
req.end()
*/
