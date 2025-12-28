import Jwt from 'jsonwebtoken';
import 'dotenv/config'
const jwt = Jwt;

export async function verify_password(email: string, password: string) {
  interface VerifyContent { valid?: string; error?: string }

  const response = await fetch("http://users:3000/verify_password", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password })
  });

  if (!response.ok) {
    return { valid: false, error: "Wrong password or email" };
  }

  const data = await response.json() as VerifyContent;

  return {
    valid: !!data.valid, // convert any value in bool value
    error: data.error
  };
}

export async function createTokens(email: string, id: number, token_version: number){
    // creating refresh and access jwt
    const accessTokenSecret = process.env.ACCESS_TOKEN_SECRET;
    const refreshTokenSecret = process.env.REFRESH_TOKEN_SECRET;

    if (!accessTokenSecret || !refreshTokenSecret) {
      console.log('ACCESS_TOKEN_SECRET || REFRESH_TOKEN_SECRET  is not set in environment variables');
      return { error: 'internal error'};
    }
    const accessToken = jwt.sign({ sub: id }, accessTokenSecret, {
      algorithm: 'HS256',
      expiresIn: '5m'
    })
    console.log("token payload", { sub: id , version: token_version})
    const refreshToken = jwt.sign({ sub: id , version: token_version}, refreshTokenSecret, {
      algorithm: 'HS256',
      expiresIn: '7d'
    })
    return {refreshToken, accessToken}
}
//////////////////////////////////////////////
export async function getUserByEmail(email: string){
  const response = await fetch(`http://users:3000/users/search`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email })
    });

    if (!response.ok) {
      // 404 ou 400 → user non trouvé
      return undefined;
    }

    return await response.json();
}

export async function getUserById(id: number){
  const response = await fetch(`http://users:3000/users/${id}`, {
    method: "GET",
    headers: { "Content-Type": "application/json" }
  });

  if (!response.ok) {
    return undefined;
  }

  return await response.json();
}