const mailer = require('nodemailer');
const fs = require('fs');
const otpMailer = (fullName, userEmail, userName, password) => {
  var transporter = mailer.createTransport({
    service: 'hotmail',
    auth: {
      user: 'anokha@cb.amrita.edu',
      pass: ''
    }
});


const data = fs.readFileSync('htmlDocuments/accountCreated.html').toString();
const finaldata = data.replace('%= username %', userName).replace('%= password %', password).replace('%= name %', fullName);

  
var mailOptions = {
  from: {
    name : "Anokha 2023",
    address : 'anokha@cb.amrita.edu'
  },
  to: userEmail,
  subject: 'Anokha 2023 Account Created',
  html: finaldata
}

    
  
 
    
    
    
      transporter.sendMail(mailOptions, function(error, info){});
}
module.exports = otpMailer;
