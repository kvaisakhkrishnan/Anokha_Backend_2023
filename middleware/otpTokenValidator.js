const paseto = require('paseto');
const { V4: { verify } } = paseto;
const fs = require('fs');
async function tokenValidator(req, res, next){
    if(req.is('json'))
    {
    const tokenHeader = req.headers.authorization;
    const token = tokenHeader && tokenHeader.split(' ')[1];
    if(tokenHeader == null)
    {
        res.status(401).send({"error" : "You need to be way better to access the db..."});
        return;
    }
    const publicKey = fs.readFileSync('./AssymetricKeyPair/public_key.pem');
    try{
        const payload = await verify(token, publicKey);
        req.body.userEmail = payload["userEmail"];
       next();
       
    }
    catch(error)
    {
        res.status(401).send({"error" : "Unauthorized access"});
        return;
    }
}
else{
    res.status(401).send({"error" : "Unauthorized access"});
}
    
    
    

}
module.exports = tokenValidator;
