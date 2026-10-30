import type { Metadata } from 'next';import './globals.css';
export const metadata:Metadata={title:'1099 Time Track | Contractor Operations',description:'Contractor time, approvals and financial operations'};
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="en"><body>{children}</body></html>}
