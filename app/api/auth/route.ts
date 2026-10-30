import { NextRequest, NextResponse } from 'next/server';
import { compare, hash } from 'bcryptjs';
import { z } from 'zod';
import { db } from '@/lib/db';
import { currentUser, createSession, clearSession } from '@/lib/auth';
import { fail,unexpected } from '@/lib/http';
const credentials=z.object({email:z.string().email(),password:z.string().min(10).max(128)});
export async function GET(){return NextResponse.json({user:await currentUser()});}
export async function POST(req:NextRequest){try{
 const body=await req.json();const action=body.action;
 if(action==='logout'){await clearSession();return NextResponse.json({ok:true});}
 const parsed=credentials.safeParse(body);if(!parsed.success)return fail('Valid email and password (minimum 10 characters) required');
 const email=parsed.data.email.toLowerCase().trim();
 if(action==='register'){
 const count=await db.user.count(); // First user bootstraps admin; subsequent registrations are contractors.
 const name=z.string().min(2).max(100).safeParse(body.displayName);if(!name.success)return fail('Display name required');
 const user=await db.user.create({data:{email,passwordHash:await hash(parsed.data.password,12),displayName:name.data,role:count===0?'ADMIN':'CONTRACTOR'}}).catch(()=>null);
 if(!user)return fail('Email is already registered',409);
 await createSession(user.id);return NextResponse.json({ok:true});
 }
 if(action==='login'){
 const user=await db.user.findUnique({where:{email}});
 if(!user||!(await compare(parsed.data.password,user.passwordHash)))return fail('Invalid credentials',401);
 await createSession(user.id);return NextResponse.json({ok:true});
 }
 return fail('Unknown action');
 }catch(e){return unexpected(e);}}
