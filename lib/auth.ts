import { cookies } from 'next/headers';
import { SignJWT, jwtVerify } from 'jose';
import { db } from '@/lib/db';
const key = () => { const secret = process.env.SESSION_SECRET; if (!secret || secret.length < 32) throw new Error('SESSION_SECRET must contain at least 32 characters'); return new TextEncoder().encode(secret); };
export async function createSession(userId: string) {
 const token = await new SignJWT({sub:userId}).setProtectedHeader({alg:'HS256'}).setIssuedAt().setExpirationTime('7d').sign(key());
 (await cookies()).set('session',token,{httpOnly:true,secure:process.env.NODE_ENV==='production',sameSite:'lax',path:'/',maxAge:604800});
}
export async function currentUser() {
 try { const token=(await cookies()).get('session')?.value; if (!token) return null;
 const {payload}=await jwtVerify(token,key()); if (typeof payload.sub !== 'string') return null;
 return await db.user.findUnique({where:{id:payload.sub},select:{id:true,email:true,displayName:true,jobTitle:true,role:true,schoolName:true}});
 } catch {return null;}
}
export async function clearSession(){(await cookies()).delete('session');}
