import jwt from "jsonwebtoken";
import jwksClient from "jwks-rsa";

const client = jwksClient({
  jwksUri: process.env.JWT_JWKS_URI!,
});

function getKey(header: any, callback: any) {
  client.getSigningKey(header.kid, (err: Error | null, key: any) => {
    const signingKey = key?.getPublicKey();
    callback(null, signingKey);
  });
}

export function verifyJwt(token: string): Promise<any> {
  return new Promise((resolve, reject) => {
    jwt.verify(
      token,
      getKey,
      {
        issuer: process.env.JWT_ISSUER,
        audience: process.env.JWT_AUDIENCE,
      },
      (err: Error | null, decoded: any) => {
        if (err) reject(err);
        else resolve(decoded);
      }
    );
  });
}
