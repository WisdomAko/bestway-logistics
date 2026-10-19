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


const shipmentStages = [
  'Shipment Received',
  'In Transit',
  'Out for Delivery',
  'Delivered',
];


function getStageIndex(status: string) {
  const normalized = status.toLowerCase().trim();

  if (normalized === 'delivered') return 3;

  if (
    normalized.includes('out for delivery') ||
    normalized.includes('out-for-delivery')
  ) {
    return 2;
  }

  if (
    normalized.includes('in transit') ||
    normalized.includes('in-transit') ||
    normalized.includes('shipped') ||
    normalized.includes('on the way')
  ) {
    return 1;
  }

  if (
    normalized.includes('received') ||
    normalized.includes('processing') ||
    normalized.includes('picked up')
  ) {
    return 0;
  }

  return -1;
}

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
            

<div className="mt-6">
  <h3>Shipment Progress</h3>

  <div className="mt-5">
    {shipmentStages.map((stage, index) => {
      const currentStage = getStageIndex(shipment.status);
      const completed = currentStage >= index;

      return (
        <div key={stage} className="flex gap-3">
          <div className="flex flex-col items-center">
            <div
              className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full border-2 ${
                completed
                  ? 'border-green-500 bg-green-500 text-white'
                  : 'border-gray-500 text-gray-400'
              }`}
            >
              {completed ? '✓' : index + 1}
            </div>

            {index < shipmentStages.length - 1 && (
              <div
                className={`h-10 w-1 ${
                  currentStage > index
                    ? 'bg-green-500'
                    : 'bg-gray-600'
                }`}
              />
            )}
          </div>

          <div className="pt-1 pb-5">
            <p
              className={
                completed
                  ? 'font-semibold text-white'
                  : 'text-gray-400'
              }
            >
              {stage}
            </p>

            {index === currentStage && (
              <p className="mt-1 text-sm text-blue-400">
                Current stage
              </p>
            )}
          </div>
        </div>
      );
    })}
  </div>
</div>


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