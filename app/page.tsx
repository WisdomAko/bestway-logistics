
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

function formatDeliveryDate(date: string | null) {
  if (!date) return 'Not yet available';

  const parsed = new Date(`${date.slice(0, 10)}T12:00:00`);

  if (Number.isNaN(parsed.getTime())) {
    return date;
  }

  return parsed.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
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

    const trackingNumber = number.trim();

    if (!trackingNumber) {
      setMessage('Please enter your tracking number.');
      return;
    }

    setLoading(true);
    setMessage('');
    setShipment(null);

    try {
      const { data, error } = await supabase
        .from('shipments')
        .select(
          'tracking_number, recipient, origin, destination, status, current_location, estimated_delivery'
        )
        .eq('tracking_number', trackingNumber)
        .maybeSingle();

      if (error) {
        setMessage(
          'Unable to track your shipment right now. Please try again.'
        );
        return;
      }

      if (!data) {
        setMessage(
          'No shipment found with that tracking number. Please check it and try again.'
        );
        return;
      }

      setShipment(data as Shipment);
    } catch {
      setMessage(
        'A connection problem occurred. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  }

  const currentStage = shipment
    ? getStageIndex(shipment.status)
    : -1;

  const stageIsDelivered = currentStage === 3;

  return (
    <main className="tracking-page">
      <section className="tracking-hero">
        <span className="tracking-eyebrow">
          BESTWAY LOGISTICS
        </span>

        <h1>Track Your Shipment</h1>

        <p className="tracking-intro">
          Follow your delivery from dispatch to destination.
          Enter your tracking number below for the latest update.
        </p>

        <form
          className="tracking-search"
          onSubmit={trackShipment}
        >
          <div className="tracking-input-wrap">
            <label htmlFor="tracking-number">
              Tracking number
            </label>

            <input
              id="tracking-number"
              name="number"
              type="text"
              value={number}
              onChange={(e) => setNumber(e.target.value)}
              placeholder="e.g. BW100005"
              autoComplete="off"
              required
            />
          </div>

          <button
            className="button tracking-submit"
            type="submit"
            disabled={loading}
          >
            {loading ? 'Searching...' : 'Track Shipment'}
          </button>
        </form>

        {message && (
          <p
            className="tracking-message"
            role="status"
          >
            {message}
          </p>
        )}
      </section>

      {shipment && (
        <section className="shipment-result">
          <div className="shipment-result-header">
            <div>
              <span className="tracking-eyebrow">
                SHIPMENT INFORMATION
              </span>

              <h2>Shipment Details</h2>

              <p className="shipment-reference">
                Tracking number: {shipment.tracking_number}
              </p>
            </div>

            <span
              className={`shipment-status ${
                stageIsDelivered ? 'status-delivered' : ''
              }`}
            >
              <span className="status-indicator" />
              {shipment.status}
            </span>
          </div>

          <section className="shipment-progress-section">
            <h3>Shipment Progress</h3>

            <p className="muted">
              Track each stage of your delivery.
            </p>

            <div className="shipment-progress">
              {shipmentStages.map((stage, index) => {
                const completed =
                  currentStage >= 0 && index < currentStage;

                const active = index === currentStage;

                const delivered =
                  stageIsDelivered && index === 3;

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
              <p className="muted tracking-stage-note">
                Your shipment status has not yet been mapped
                to one of the four progress stages.
              </p>
            )}
          </section>

          <div className="shipment-info-grid">
            <div className="shipment-info-item">
              <span className="shipment-info-label">
                Recipient
              </span>
              <span className="shipment-info-value">
                {shipment.recipient || 'Not available'}
              </span>
            </div>

            <div className="shipment-info-item">
              <span className="shipment-info-label">
                Current Location
              </span>
              <span className="shipment-info-value">
                {shipment.current_location || 'Not yet updated'}
              </span>
            </div>

            <div className="shipment-info-item">
              <span className="shipment-info-label">
                Origin
              </span>
              <span className="shipment-info-value">
                {shipment.origin || 'Not available'}
              </span>
            </div>

            <div className="shipment-info-item">
              <span className="shipment-info-label">
                Destination
              </span>
              <span className="shipment-info-value">
                {shipment.destination || 'Not available'}
              </span>
            </div>

            <div className="shipment-info-item shipment-delivery-item">
              <span className="shipment-info-label">
                Estimated Delivery
              </span>
              <span className="shipment-info-value">
                {formatDeliveryDate(shipment.estimated_delivery)}
              </span>
            </div>
          </div>

          <p className="shipment-disclaimer">
            Delivery dates are estimates and may change as your
            shipment progresses.
          </p>
        </section>
        )}

  <section className="services-section">
    <div className="services-heading">
      <span className="tracking-eyebrow">WHAT WE OFFER</span>
      <h2>Shipping Solutions for Every Journey</h2>
      <p>
        Reliable logistics solutions designed to move your
        shipments safely and efficiently.
      </p>
    </div>

    <div className="services-grid">
      <article className="service-card">
        <div className="service-icon" aria-hidden="true">✈</div>
        <h3>Air Freight</h3>
        <p>
          Fast shipping solutions for time-sensitive
          international deliveries.
        </p>
      </article>

      <article className="service-card">
        <div className="service-icon" aria-hidden="true">🚢</div>
        <h3>Sea Freight</h3>
        <p>
          Practical shipping solutions for larger cargo
          and international freight.
        </p>
      </article>

      <article className="service-card">
        <div className="service-icon" aria-hidden="true">🚚</div>
        <h3>Road Transport</h3>
        <p>
          Dependable ground transportation for shipments
          moving between destinations.
        </p>
      </article>
    </div>
    
      </section>

      <section className="why-section">
        <div className="why-heading">
          <span className="tracking-eyebrow">WHY BESTWAY</span>
          <h2>Why Choose Bestway Logistics?</h2>
          <p>
            We make shipping simpler with dependable service,
            careful handling, and shipment visibility.
          </p>
        </div>

        <div className="why-grid">
          <article className="why-card">
            <div className="why-icon" aria-hidden="true">🛡️</div>
            <h3>Reliable &amp; Secure</h3>
            <p>
              We prioritize careful handling and dependable
              service throughout your shipment journey.
            </p>
          </article>

          <article className="why-card">
            <div className="why-icon" aria-hidden="true">🌍</div>
            <h3>Connecting Destinations</h3>
            <p>
              Logistics solutions designed to connect shipments
              with destinations across the world.
            </p>
          </article>

          <article className="why-card">
            <div className="why-icon" aria-hidden="true">📦</div>
            <h3>Shipment Visibility</h3>
            <p>
              Track your shipment online and follow its progress
              through the available tracking updates.
            </p>
          </article>
        </div>
      </section>
      
      <section className="contact-section">
        <div className="contact-content">
          <span className="tracking-eyebrow">GET IN TOUCH</span>
          <h2>Let's Move Your Shipment</h2>
          <p>
            Have a shipping question or need help with a delivery?
            Contact our team and we'll be happy to assist.
          </p>

          <a
            className="contact-email"
            href="mailto:bestwaylogistics000@gmail.com"
          >
            <span className="contact-email-icon" aria-hidden="true">
              ✉
            </span>
            <span className="contact-email-text">
              <span className="contact-email-label">Email Us</span>
              <span className="contact-email-address">
                bestwaylogistics000@gmail.com
              </span>
            </span>
            <span className="contact-email-arrow" aria-hidden="true">
              →
            </span>
          </a>
        </div>
      </section>

    </main>
  );
}
