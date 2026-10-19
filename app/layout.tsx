import './globals.css'
import Link from 'next/link'

export const metadata = {
title: 'Bestway Logistics — Shipment Tracking',
description:
'Track your Bestway Logistics shipment and follow delivery progress online.',
}

export default function RootLayout({
children,
}: {
children: React.ReactNode
}) {
return (
<html lang="en">
<body>
<header className="top">
<Link
className="brand"
href="/"
aria-label="Bestway Logistics home"
>
<span className="brand-mark" aria-hidden="true">
B
</span>

        <span className="brand-name">
          BESTWAY
          <span className="brand-subtitle">LOGISTICS</span>
        </span>
      </Link>

      <nav className="site-navigation" aria-label="Main navigation">
        <Link className="nav-link nav-track" href="/">
          Track Shipment
        </Link>

        <Link className="nav-admin" href="/admin/login">
          Admin Login
        </Link>
      </nav>
    </header>

    {children}

    <footer className="site-footer">
      <span>© 2026 Bestway Logistics</span>
      <span>Moving shipments. Connecting destinations.</span>
    </footer>
  </body>
</html>

)
}