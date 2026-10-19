
'use client';

import { useState } from 'react';
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
    normalized.includes('pending') ||
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

  async function trackShipment(
    e: React.FormEvent<HTMLFormElement>
  ) {
    e.preventDefault();

    setLoading(true);
    setMessage('');
    setShipment(null);

    try {
      const { data, error } = await supabase
        .from('shipments')
        .select(
          'tracking_number, recipient, origin, destination, status, current_location, estimated_delivery'
        )
        .eq('tracking_number', number.trim())
        .maybeSingle();

      if (error) {
        setMessage(
          'Unable to track shipment right now. Please try again.'
        );
        return;
      }

      if (!data) {
        setMessage(
          'No shipment found with that tracking number.'
        );
        return;
      }

      setShipment(data as Shipment);
    } catch {
      setMessage(
        'Unable to track shipment right now. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  }

  const currentStage = shipment
    ? getStageIndex(shipment.status)
    : -1;

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

          <button
            className="button"
            type="submit"
            disabled={loading}
          >
            {loading ? 'Tracking...' : 'Track Shipment'}
          </button>
        </form>

        {message && (
          <p className="error mt-4" role="status">
            {message}
          </p>
        )}

        {shipment && (
          <div className="panel mt-6">
            <h2>Shipment Details</h2>

            <section className="mt-6">
              <h3>Shipment Progress</h3>

              <div className="shipment-progress">
                {shipmentStages.map((stage, index) => {
                  const completed =
                    currentStage >= 0 &&
                    index < currentStage;

                  const active = index === currentStage;

                  const delivered =
                    currentStage === 3 && index === 3;

                  const completedOrDelivered =
                    completed || delivered;

                  return (
                    <div
                      key={stage}
                      className={`shipment-step ${
                        completedOrDelivered
                          ? 'completed'
                          : active
                          ? 'active'
                          : ''
                      }`}
                    >
                      <div className="shipment-step-circle">
                        {completedOrDelivered
                          ? '✓'
                          : index + 1}
                      </div>

                      <div className="shipment-step-title">
                        {stage}
                      </div>

                      <div className="shipment-step-description">
                        {completedOrDelivered
                          ? 'Completed'
                          : active
                          ? 'Current stage'
                          : 'Pending'}
                      </div>
                    </div>
                  );
                })}
              </div>

              {currentStage === -1 && (
                <p className="muted mt-4">
                  Your shipment has a status update, but it
                  does not yet match a progress stage.
                </p>
              )}
            </section>

            <div className="mt-6 space-y-3">
              <p>
                <strong>Tracking Number:</strong>{' '}
                {shipment.tracking_number}
              </p>

              <p>
                <strong>Recipient:</strong>{' '}
                {shipment.recipient}
              </p>

              <p>
                <strong>Origin:</strong>{' '}
                {shipment.origin}
              </p>

              <p>
                <strong>Destination:</strong>{' '}
                {shipment.destination}
              </p>

              <p>
                <strong>Current Location:</strong>{' '}
                {shipment.current_location ||
                  'Not yet updated'}
              </p>

              <p>
                <strong>Status:</strong>{' '}
                {shipment.status}
              </p>

              <p>
                <strong>Estimated Delivery:</strong>{' '}
                {shipment.estimated_delivery ||
                  'Not yet available'}
              </p>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
