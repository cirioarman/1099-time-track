import { currentUser } from '@/lib/auth';import { redirect } from 'next/navigation';
export default async function Home(){const u=await currentUser();redirect(u?'/dashboard':'/login');}
