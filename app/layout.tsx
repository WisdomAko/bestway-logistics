import './globals.css'
import Link from 'next/link'

export const metadata={title:'Bestway Logistics — Shipment Tracking',description:'Track your shipment online.'}

export default function RootLayout({children}:{children:React.ReactNode}){
 return <html lang="en"><body><header className="top"><Link className="brand" href="/">Track<span>Flow</span></Link><Link href="/admin/login" className="admin">Admin</Link></header>{children}<footer>© 2026 Bestway Logistics</footer></body></html>
}
