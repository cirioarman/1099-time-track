import { NextResponse } from 'next/server';
export const fail=(message:string,status=400)=>NextResponse.json({error:message},{status});
export function unexpected(e:unknown){console.error(e);return fail('Request could not be processed',500);}
