const paseto = require('paseto');
const { V4: { sign } } = paseto;
const fs = require('fs');
const secret_key = "23c8fd997d4f2142521da409b876e0488257541076a92f981849ce69ee35e48ac5780d00a456b87dcbbc7b6038d878206565994a7b28e868b373544881541e237a8aa48654b099cebbca4c865d80b866400e2ed7682cfdca2f508ca4f50328055647a9e34741e16f6dab5c220a223d3d048f86254f94e44db2b5823d1c9241b3c9024252721c47bbd7f706673db5ec76311e17db6ca46e9568472264d0bfd64f21ba56e449c9fab92bf2756d077eebd7d0dda8342da869dc829c7a1db5eacabf74c9a1825485afd8f41e8b501e6cbf850c8ae7358c1354215dfd575d3ee5d71fbacafab9851b737fde54d92ec0e45fbfc7493ee3ca2e77e3550ced0b4b861e5546ac9507e850b876da2dfd889dde4a1cad0f11ffa10e9542878cc13b4fb2194d5d4a6b775741bb8e385eb4e379d349190b57eb1935acc7e3eed3e0cbc5a036b5";
async function createToken(data) {

    data.secret_key = secret_key;
    const privateKey = fs.readFileSync('./AssymetricKeyPair/private_key.pem');
    var token = "";
    token = await sign(data, privateKey, { expiresIn: "5 m" });  
    return token;
}
module.exports = createToken;