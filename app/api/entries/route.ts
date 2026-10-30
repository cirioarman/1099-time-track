import { NextRequest,NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { currentUser } from '@/lib/auth';
import { entryScope } from '@/lib/access';
import { durationHours,billableHours,money } from '@/lib/finance';
import { fail,unexpected } from '@/lib/http';
const input=z.object({schoolOrDistrict:z.string().min(1).max(150),category:z.string().min(1).max(100),subCategoryKey:z.string().max(100).optional(),startTime:z.string().datetime(),endTime:z.string().datetime(),description:z.string().max(2000).default(''),mileageMiles:z.number().min(0).max(10000).default(0),isManualEntry:z.boolean().default(true)});
export async function GET(){const u=await currentUser();if(!u)return fail('Unauthorized',401);const rows=await db.timeEntry.findMany({where:entryScope(u),orderBy:{startTime:'desc'},take:500});return NextResponse.json(rows);}
export async function POST(req:NextRequest){try{const u=await currentUser();if(!u)return fail('Unauthorized',401);if(u.role==='SCHOOL')return fail('School accounts cannot submit contractor time',403);
 const parsed=input.safeParse(await req.json());if(!parsed.success)return fail(parsed.error.issues.map(x=>x.message).join('; '));const x=parsed.data;
 const school=await db.school.findFirst({where:{name:x.schoolOrDistrict,isActive:true}});if(!school)return fail('Select an active school');
 const category=await db.category.findFirst({where:{key:x.category,isActive:true}});if(!category)return fail('Select an active category');
 const start=new Date(x.startTime),end=new Date(x.endTime);const duration=durationHours(start,end),billable=billableHours(duration);
 const mileageRate=await db.mileageRate.findFirst({orderBy:{createdAt:'desc'}});
 const row=await db.timeEntry.create({data:{userId:u.id,contractorName:u.displayName,schoolOrDistrict:school.name,category:category.key,subCategoryKey:x.subCategoryKey,startTime:start,endTime:end,durationHours:duration,billableHours:billable,hourlyRate:category.hourlyRate,billingRate:category.billingRate,description:x.description,mileageMiles:x.mileageMiles,mileageReimbursement:money(x.mileageMiles*Number(mileageRate?.ratePerMile??0.76)),isManualEntry:x.isManualEntry}});
 await db.auditEvent.create({data:{actorId:u.id,action:'CREATE',entity:'TimeEntry',entityId:row.id}});
 return NextResponse.json(row,{status:201});}catch(e){if(e instanceof Error&&e.message.startsWith('Duration'))return fail(e.message);return unexpected(e);}}
