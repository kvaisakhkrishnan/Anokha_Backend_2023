const mailer = require('nodemailer');
const fs = require('fs');
const resetMailer = (fullName, userEmail, otp) => {
  var transporter = mailer.createTransport({
    service: 'hotmail',
    auth: {
        user: 'anokha@cb.amrita.edu',
        pass: ''
    }
});


const data = fs.readFileSync('htmlDocuments/resetOtp.html').toString();
const finaldata = data.replace('%= name %', fullName).replace('%= otp %', otp);

  

    var mailOptions = {
      from: {
        name : "Anokha 2023",
        address : 'anokha@cb.amrita.edu'
      },
      to: userEmail,
      subject: 'Reset Password Verification',
      html: finaldata
    }
    
  
    
    
    
      transporter.sendMail(mailOptions, function(error, info){});
}
module.exports = resetMailer;
