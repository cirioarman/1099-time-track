import { NextRequest,NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { currentUser } from '@/lib/auth';
import { canReadEntry,canReview } from '@/lib/access';
import { fail,unexpected } from '@/lib/http';
export async function PATCH(req:NextRequest,{params}:{params:Promise<{id:string}>}){try{const u=await currentUser();if(!u)return fail('Unauthorized',401);const {id}=await params;const row=await db.timeEntry.findUnique({where:{id}});if(!row||!canReadEntry(u,row))return fail('Not found',404);
 const schema=z.object({approvalStatus:z.enum(['APPROVED','DENIED']).optional(),denialReason:z.string().max(1000).optional(),paymentStatus:z.enum(['PAID','UNPAID']).optional()});const parsed=schema.safeParse(await req.json());if(!parsed.success)return fail('Invalid status update');const x=parsed.data;
 if(x.approvalStatus&&!canReview(u,row))return fail('Only school reviewers or admins can approve entries',403);
 if(x.paymentStatus&&u.role!=='ADMIN')return fail('Only admins can update payment status',403);
 if(x.paymentStatus==='PAID'&&row.approvalStatus!=='APPROVED'&&x.approvalStatus!=='APPROVED')return fail('Entry must be approved before payment');
 if(x.approvalStatus==='DENIED'&&!x.denialReason?.trim())return fail('Denial reason required');
 if(x.approvalStatus==='DENIED'&&row.paymentStatus==='PAID')return fail('Paid entry cannot be denied');
 const updated=await db.$transaction(async tx=>{const v=await tx.timeEntry.update({where:{id},data:{...(x.approvalStatus?{approvalStatus:x.approvalStatus,denialReason:x.approvalStatus==='DENIED'?x.denialReason:null}:{}),...(x.paymentStatus?{paymentStatus:x.paymentStatus}:{})}});await tx.auditEvent.create({data:{actorId:u.id,action:'UPDATE_STATUS',entity:'TimeEntry',entityId:id,detail:x}});return v;});return NextResponse.json(updated);
 }catch(e){return unexpected(e);}}
export async function DELETE(_:NextRequest,{params}:{params:Promise<{id:string}>}){const u=await currentUser();if(!u)return fail('Unauthorized',401);const {id}=await params;const row=await db.timeEntry.findUnique({where:{id}});if(!row)return fail('Not found',404);if(row.userId!==u.id&&u.role!=='ADMIN')return fail('Forbidden',403);if(row.paymentStatus==='PAID')return fail('Paid entries cannot be deleted');await db.$transaction(async tx=>{await tx.timeEntry.delete({where:{id}});await tx.auditEvent.create({data:{actorId:u.id,action:'DELETE',entity:'TimeEntry',entityId:id}})});return NextResponse.json({ok:true});}
