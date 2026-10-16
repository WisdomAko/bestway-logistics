import Link from 'next/link'

export default function Home() {
  return (
    <main>
      <div className="panel">
        <h1>Track Your Shipment</h1>
        <p className="muted">
          Enter your tracking number to see your shipment status.
        </p>

        <form action="/track">
          <input
            name="number"
            placeholder="Enter tracking number"
            required
          />
          <button className="button" type="submit">
            Track Shipment
          </button>
        </form>

        <Link href="/admin/login" className="button">
          Admin Login
        </Link>
      </div>
    </main>
  )
}