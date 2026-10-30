import { NextRequest,NextResponse } from 'next/server';
import { z } from 'zod';
import { currentUser } from '@/lib/auth';
import { db } from '@/lib/db';
import { fail,unexpected } from '@/lib/http';
const schemas={
 schools:z.object({name:z.string().min(1),type:z.enum(['school','district']).default('school'),parentDistrictId:z.string().optional(),discountPercentage:z.number().min(0).max(100).default(0),isActive:z.boolean().default(true)}),
 categories:z.object({name:z.string().min(1),key:z.string().regex(/^[a-z0-9_]+$/),hourlyRate:z.number().min(0),billingRate:z.number().min(0),description:z.string().default(''),color:z.string().default('#4f46e5'),isActive:z.boolean().default(true)}),
 subcategories:z.object({name:z.string().min(1),key:z.string().regex(/^[a-z0-9_]+$/),isActive:z.boolean().default(true)}),
 mileage:z.object({ratePerMile:z.number().min(0),updatedNote:z.string().default('')}),
 retainers:z.object({contractorName:z.string().min(1),schoolOrDistrict:z.string().min(1),monthlyAmount:z.number().min(0),billingAmount:z.number().min(0).default(0),allocationMarkupPercent:z.number().min(0).default(0),payFrequency:z.enum(['monthly','bi_monthly','quarterly']).default('monthly'),startDate:z.string(),endDate:z.string().nullable().optional(),description:z.string().default(''),isActive:z.boolean().default(true),schoolAllocations:z.array(z.object({school_or_district:z.string(),amount:z.number()})).optional()}),
 revenue:z.object({contractName:z.string().min(1),schoolOrDistrict:z.string().min(1),monthlyRevenue:z.number().min(0),startDate:z.string(),endDate:z.string().nullable().optional(),description:z.string().default(''),isActive:z.boolean().default(true)})
};
type Resource=keyof typeof schemas;
async function getResource(r:Resource){switch(r){case 'schools':return db.school.findMany({orderBy:{name:'asc'}});case 'categories':return db.category.findMany({orderBy:{name:'asc'}});case 'subcategories':return db.subCategory.findMany({orderBy:{name:'asc'}});case 'mileage':return db.mileageRate.findMany({orderBy:{createdAt:'desc'}});case 'retainers':return db.retainerContractor.findMany();case 'revenue':return db.fixedRevenueContract.findMany();}}
export async function GET(_:NextRequest,{params}:{params:Promise<{resource:string}>}){const u=await currentUser();if(!u||u.role!=='ADMIN')return fail('Forbidden',403);const {resource}=await params;if(!(resource in schemas))return fail('Not found',404);return NextResponse.json(await getResource(resource as Resource));}
export async function POST(req:NextRequest,{params}:{params:Promise<{resource:string}>}){try{const u=await currentUser();if(!u||u.role!=='ADMIN')return fail('Forbidden',403);const {resource}=await params;if(!(resource in schemas))return fail('Not found',404);const schema=schemas[resource as Resource];const parsed=schema.safeParse(await req.json());if(!parsed.success)return fail(parsed.error.issues.map(x=>x.message).join('; '));const x=parsed.data;let created;
 switch(resource){
 case 'schools':created=await db.school.create({data:x as z.infer<typeof schemas.schools>});break;
 case 'categories':created=await db.category.create({data:x as z.infer<typeof schemas.categories>});break;
 case 'subcategories':created=await db.subCategory.create({data:x as z.infer<typeof schemas.subcategories>});break;
 case 'mileage':created=await db.mileageRate.create({data:x as z.infer<typeof schemas.mileage>});break;
 case 'retainers':{const a=x as z.infer<typeof schemas.retainers>;created=await db.retainerContractor.create({data:{...a,startDate:new Date(a.startDate),endDate:a.endDate?new Date(a.endDate):null,schoolAllocations:a.schoolAllocations??[]}});break;}
 case 'revenue':{const a=x as z.infer<typeof schemas.revenue>;created=await db.fixedRevenueContract.create({data:{...a,startDate:new Date(a.startDate),endDate:a.endDate?new Date(a.endDate):null}});break;}
 }if(!created)return fail('Unknown resource');await db.auditEvent.create({data:{actorId:u.id,action:'CREATE',entity:resource,entityId:created.id}});return NextResponse.json(created,{status:201});
 }catch(e){return unexpected(e);}}
