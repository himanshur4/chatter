import jwt from 'jsonwebtoken'

const JWT_SECRET=process.env.JWT_SECRET as string;

export const generateToken=(user:any)=>{
    return jwt.sign({user},JWT_SECRET,{expiresIn:"15d"})
}