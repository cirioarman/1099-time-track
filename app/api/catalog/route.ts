import { NextResponse } from 'next/server';
import { currentUser } from '@/lib/auth';
import { db } from '@/lib/db';
import { fail } from '@/lib/http';
export async function GET(){if(!await currentUser())return fail('Unauthorized',401);const [schools,categories,subCategories,mileageRate]=await Promise.all([db.school.findMany({where:{isActive:true},orderBy:{name:'asc'}}),db.category.findMany({where:{isActive:true},orderBy:{name:'asc'}}),db.subCategory.findMany({where:{isActive:true},orderBy:{name:'asc'}}),db.mileageRate.findFirst({orderBy:{createdAt:'desc'}})]);return NextResponse.json({schools,categories,subCategories,mileageRate});}
