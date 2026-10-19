'use client';

import { useState } from 'react';
import Link from 'next/link';
import { supabase } from '../lib/supabase';

type Shipment = {
  tracking_number: string;
  recipient: string;
  origin: string;
  destination: string;
  status: string;
  current_location: string | null;
  estimated_delivery: string | null;
};

export default function Home() {
  const [number, setNumber] = useState('');
  const [shipment, setShipment] = useState<Shipment | null>(null);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  async function trackShipment(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    setShipment(null);

    const { data, error } = await supabase
      .from('shipments')
      .select(
        'tracking_number, recipient, origin, destination, status, current_location, estimated_delivery'
      )
      .eq('tracking_number', number.trim())
      .maybeSingle();

    setLoading(false);

    if (error) {
      setMessage('Unable to track shipment right now. Please try again.');
      return;
    }

    if (!data) {
      setMessage('No shipment found with that tracking number.');
      return;
    }

    setShipment(data as Shipment);
  }

  return (
    <main>
      <div className="panel">
        <h1>Track Your Shipment</h1>

        <p className="muted">
          Enter your tracking number to see your shipment status.
        </p>

        <form onSubmit={trackShipment}>
          <input
            name="number"
            value={number}
            onChange={(e) => setNumber(e.target.value)}
            placeholder="Enter tracking number"
            required
          />

          <button className="button" type="submit" disabled={loading}>
            {loading ? 'Tracking...' : 'Track Shipment'}
          </button>
        </form>

        {message && <p className="mt-4">{message}</p>}

        {shipment && (
          <div className="panel mt-6">
            <h2>Shipment Details</h2>
            <p><strong>Tracking Number:</strong> {shipment.tracking_number}</p>
            <p><strong>Recipient:</strong> {shipment.recipient}</p>
            <p><strong>Origin:</strong> {shipment.origin}</p>
            <p><strong>Destination:</strong> {shipment.destination}</p>
            <p><strong>Current Location:</strong> {shipment.current_location || 'Not yet updated'}</p>
            <p><strong>Status:</strong> {shipment.status}</p>
            <p>
              <strong>Estimated Delivery:</strong>{' '}
              {shipment.estimated_delivery
                ? shipment.estimated_delivery
                : 'Not yet available'}
            </p>
          </div>
        )}

      </div>
    </main>
  );
}