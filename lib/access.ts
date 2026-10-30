import type { Role } from '@prisma/client';
export type Principal={id:string;role:Role;schoolName:string|null};
export function canReadEntry(u:Principal,e:{userId:string;schoolOrDistrict:string}){return u.role==='ADMIN'||e.userId===u.id||(u.role==='SCHOOL'&&!!u.schoolName&&e.schoolOrDistrict===u.schoolName);}
export function canReview(u:Principal,e:{schoolOrDistrict:string}){return u.role==='ADMIN'||(u.role==='SCHOOL'&&!!u.schoolName&&e.schoolOrDistrict===u.schoolName);}
export function entryScope(u:Principal){return u.role==='ADMIN'?{}:u.role==='SCHOOL'?{schoolOrDistrict:u.schoolName??'__none__'}:{userId:u.id};}
