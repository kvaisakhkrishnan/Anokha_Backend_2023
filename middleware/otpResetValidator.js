const paseto = require('paseto');
const { V4: { verify } } = paseto;
const fs = require('fs');
const secret_key = "23c8fd997d4f2142521da409b876e0488257541076a92f981849ce69ee35e48ac5780d00a456b87dcbbc7b6038d878206565994a7b28e868b373544881541e237a8aa48654b099cebbca4c865d80b866400e2ed7682cfdca2f508ca4f50328055647a9e34741e16f6dab5c220a223d3d048f86254f94e44db2b5823d1c9241b3c9024252721c47bbd7f706673db5ec76311e17db6ca46e9568472264d0bfd64f21ba56e449c9fab92bf2756d077eebd7d0dda8342da869dc829c7a1db5eacabf74c9a1825485afd8f41e8b501e6cbf850c8ae7358c1354215dfd575d3ee5d71fbacafab9851b737fde54d92ec0e45fbfc7493ee3ca2e77e3550ced0b4b861e5546ac9507e850b876da2dfd889dde4a1cad0f11ffa10e9542878cc13b4fb2194d5d4a6b775741bb8e385eb4e379d349190b57eb1935acc7e3eed3e0cbc5a036b5";
async function tokenValidator(req, res, next){
    
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
        if(payload["secret_key"] == secret_key)
        {
            req.body.userEmail = payload["userEmail"];
            next();
        }
        
       
    }
    catch(error)
    {
        res.status(401).send({"error" : "Unauthorized access"});
        return;
    }

    
    
    

}
module.exports = tokenValidator;
