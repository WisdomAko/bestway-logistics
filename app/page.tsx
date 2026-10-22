
'use client';

import { useState } from 'react';
import { supabase } from '../lib/supabase';

type Shipment = {
  id: string;
  tracking_number: string;
  recipient: string | null;
  origin: string;
  destination: string;
  status: string;
  current_location: string | null;
  estimated_delivery: string | null;
};

type ShipmentEvent = {
  id: string;
  shipment_id: string;
  status: string;
  location: string | null;
  description: string | null;
  event_time: string;
};

const shipmentStages = [
  'Shipment Received',
  'In Transit',
  'Out for Delivery',
  'Delivered',
];

function getStageIndex(status: string): number {
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

  if (Number.isNaN(parsed.getTime())) return date;

  return parsed.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

function formatEventDate(date: string) {
  const parsed = new Date(date);

  if (Number.isNaN(parsed.getTime())) return date;

  return parsed.toLocaleString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

function getStatusMessage(status: string) {
  const normalized = status.toLowerCase().trim();

  if (normalized === 'delivered') {
    return 'Your shipment has been delivered.';
  }

  if (
    normalized.includes('out for delivery') ||
    normalized.includes('out-for-delivery')
  ) {
    return 'Your shipment is on its way to the recipient.';
  }

  if (
    normalized.includes('in transit') ||
    normalized.includes('in-transit') ||
    normalized.includes('shipped') ||
    normalized.includes('on the way')
  ) {
    return 'Your shipment is moving toward its destination.';
  }

  if (
    normalized.includes('processing') ||
    normalized.includes('pending')
  ) {
    return 'Your shipment is being prepared for its journey.';
  }

  if (normalized.includes('received')) {
    return 'Your shipment has been received.';
  }

  return 'Check the shipment details below for the latest recorded update.';
}

export default function Home() {
  const [number, setNumber] = useState('');
  const [shipment, setShipment] = useState<Shipment | null>(null);
  const [events, setEvents] = useState<ShipmentEvent[]>([]);
  const [message, setMessage] = useState('');
  const [historyMessage, setHistoryMessage] = useState('');
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
    setHistoryMessage('');
    setShipment(null);
    setEvents([]);

    try {
      const { data, error } = await supabase
        .from('shipments')
        .select(
          'id, tracking_number, recipient, origin, destination, status, current_location, estimated_delivery'
        )
        .eq('tracking_number', trackingNumber)
        .maybeSingle();

      if (error) {
        console.error('Shipment lookup error:', error.message);
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

      const foundShipment = data as Shipment;
      setShipment(foundShipment);

      const { data: eventData, error: eventError } = await supabase
        .from('shipment_events')
        .select(
          'id, shipment_id, status, location, description, event_time'
        )
        .eq('shipment_id', foundShipment.id)
        .order('event_time', { ascending: false });

      if (eventError) {
        console.error(
          'Shipment history error:',
          eventError.message
        );
        setHistoryMessage(
          'Shipment details are available, but the activity history could not be loaded.'
        );
      } else {
        setEvents((eventData ?? []) as ShipmentEvent[]);

        if (!eventData || eventData.length === 0) {
          setHistoryMessage(
            'No activity history has been recorded for this shipment yet.'
          );
        }
      }
    } catch (error) {
      console.error('Tracking connection error:', error);
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
          BESTWAY LOGISTICS · LOGISTICS WITHOUT BOUNDARIES
        </span>
<div className="hero-logistics-visual">
  <div className="hero-visual-glow" />

  <div className="hero-visual-label">
    <span className="hero-visual-dot" />
    GLOBAL FREIGHT NETWORK
  </div>

  <div className="hero-visual-grid">
    <div className="hero-visual-item hero-air">
      <span className="hero-visual-icon">✈</span>
      <span>AIR FREIGHT</span>
    </div>

    <div className="hero-visual-item hero-sea">
      <span className="hero-visual-icon">🚢</span>
      <span>SEA FREIGHT</span>
    </div>

    <div className="hero-visual-item hero-road">
      <span className="hero-visual-icon">🚚</span>
      <span>ROAD TRANSPORT</span>
    </div>
  </div>

  <div className="hero-visual-footer">
    <span>CONNECTED WORLDWIDE</span>
    <span>● LIVE TRACKING</span>
  </div>
</div>
        <h1>
          Your Shipment.
          <span className="hero-highlight">
            {' '}Our Commitment.
          </span>
        </h1>

        <p className="tracking-intro">
          Shipping with confidence starts with knowing where
          your cargo is. Track your shipment, follow its progress,
          and stay informed throughout your delivery journey.
        </p>

        <div className="hero-trust-points">
          <span>✓ Reliable Service</span>
          <span>✓ Shipment Visibility</span>
          <span>✓ Global Connections</span>
        </div>

        <div className="hero-tracking-label">
          <h2>Track Your Shipment</h2>
          <p>
            Enter your unique tracking number to see your
            shipment status and latest recorded updates.
          </p>
        </div>

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
              aria-describedby="tracking-help"
            />

            <span id="tracking-help" className="muted">
              Enter the tracking number provided by Bestway
              Logistics.
            </span>
          </div>

          <button
            className="button tracking-submit"
            type="submit"
            disabled={loading}
          >
            {loading ? 'Searching...' : 'Track Shipment →'}
          </button>
        </form>

        {message && (
          <p className="tracking-message" role="alert">
            {message}
          </p>
        )}
      </section>

      {shipment && (
        <section className="shipment-result" aria-live="polite">
          <div className="shipment-result-header">
            <div>
              <span className="tracking-eyebrow">
                YOUR DELIVERY AT A GLANCE
              </span>

              <h2>Shipment Overview</h2>

              <p className="shipment-reference">
                Tracking number:{' '}
                <strong>{shipment.tracking_number}</strong>
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

          <div className="shipment-route-summary">
            <div className="shipment-route-point">
              <span className="shipment-info-label">
                SHIP FROM
              </span>
              <strong>{shipment.origin || 'Not available'}</strong>
            </div>

            <div
              className="shipment-route-connector"
              aria-hidden="true"
            >
              <span>→</span>
            </div>

            <div className="shipment-route-point">
              <span className="shipment-info-label">
                SHIP TO
              </span>
              <strong>
                {shipment.destination || 'Not available'}
              </strong>
            </div>
          </div>

          <section className="shipment-progress-section">
            <div className="progress-heading">
              <div>
                <span className="tracking-eyebrow">
                  DELIVERY JOURNEY
                </span>

                <h3>Shipment Progress</h3>

                <p className="muted">
                  Follow your shipment through every stage.
                </p>
              </div>

              <div className="progress-count">
                {currentStage >= 0
                  ? `${currentStage + 1} of 4`
                  : 'Pending'}
              </div>
            </div>

            <div className="shipment-timeline">
              {shipmentStages.map((stage, index) => {
                const completed =
                  currentStage >= 0 && index < currentStage;

                const active = index === currentStage;

                const isComplete =
                  completed ||
                  (stageIsDelivered && index === 3);

                return (
                  <div
                    key={stage}
                    className={`timeline-step ${
                      isComplete
                        ? 'timeline-completed'
                        : active
                        ? 'timeline-active'
                        : 'timeline-pending'
                    }`}
                  >
                    <div className="timeline-marker-wrap">
                      <div className="timeline-marker">
                        {isComplete ? '✓' : index + 1}
                      </div>

                      {index < shipmentStages.length - 1 && (
                        <div className="timeline-connector" />
                      )}
                    </div>

                    <div className="timeline-content">
                      <h4>{stage}</h4>

                      <p>
                        {isComplete
                          ? 'Stage completed'
                          : active
                          ? 'Current shipment status'
                          : 'Awaiting completion'}
                      </p>
                    </div>

                    {active && (
                      <span className="timeline-current-label">
                        CURRENT
                      </span>
                    )}
                  </div>
                );
              })}
            </div>

            {currentStage === -1 && (
              <p className="muted tracking-stage-note">
                Your shipment has a recorded status that is not
                yet mapped to a progress stage. See the status
                and activity history for the latest information.
              </p>
            )}

            <div className="shipment-status-summary">
              <strong>Latest status: {shipment.status}</strong>
              <p>{getStatusMessage(shipment.status)}</p>
            </div>
          </section>

          <section
            className="shipment-info-grid"
            aria-label="Shipment details"
          >
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
                {formatDeliveryDate(
                  shipment.estimated_delivery
                )}
              </span>
            </div>
          </section>

          <p className="shipment-disclaimer">
            Estimated delivery dates are provided for guidance
            and may change as your shipment progresses.
          </p>

          <section
            className="activity-history-section"
            aria-labelledby="activity-history-heading"
          >
            <div className="progress-heading">
              <div>
                <span className="tracking-eyebrow">
                  SHIPMENT UPDATES
                </span>

                <h3 id="activity-history-heading">
                  Shipment Activity History
                </h3>

                <p className="muted">
                  Review the recorded updates throughout your
                  shipment journey, starting with the latest.
                </p>
              </div>
            </div>

            {historyMessage && (
              <p className="muted" role="status">
                {historyMessage}
              </p>
            )}

            {events.length > 0 && (
              <div className="activity-timeline">
                {events.map((event, index) => (
                  <article
                    key={event.id}
                    className="activity-event"
                  >
                    <div className="activity-marker-column">
                      <span
                        className={`activity-marker ${
                          index === 0
                            ? 'activity-marker-latest'
                            : ''
                        }`}
                      >
                        {index === 0 ? '●' : '✓'}
                      </span>

                      {index < events.length - 1 && (
                        <span className="activity-connector" />
                      )}
                    </div>

                    <div className="activity-event-content">
                      <h4>{event.status}</h4>

                      <p className="activity-event-date">
                        {formatEventDate(event.event_time)}
                      </p>

                      {event.location && (
                        <p className="activity-event-location">
                          <strong>Location:</strong>{' '}
                          {event.location}
                        </p>
                      )}

                      {event.description && (
                        <p className="activity-event-description">
                          {event.description}
                        </p>
                      )}
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>

          <div className="shipment-help">
            <h3>Need help with this shipment?</h3>
            <p>
              If you have questions about your delivery, our team
              is available to assist.
            </p>

            <a
              className="button"
              href="mailto:bestwaylogistics000@gmail.com"
            >
              Contact Support
            </a>
          </div>
        </section>
      )}

      <section className="services-section">
        <div className="services-heading">
          <span className="tracking-eyebrow">
            WHAT WE OFFER
          </span>

          <h2>Shipping Solutions for Every Journey</h2>

          <p>
            Reliable logistics solutions designed to move your
            shipments safely and efficiently.
          </p>
        </div>

        <div className="services-grid">
          <article className="service-card">
            <div className="service-icon" aria-hidden="true">
              ✈
            </div>

            <h3>Air Freight</h3>

            <p>
              Fast shipping solutions for time-sensitive
              international deliveries.
            </p>
          </article>

          <article className="service-card">
            <div className="service-icon" aria-hidden="true">
              🚢
            </div>

            <h3>Sea Freight</h3>

            <p>
              Practical shipping solutions for larger cargo
              and international freight.
            </p>
          </article>

          <article className="service-card">
            <div className="service-icon" aria-hidden="true">
              🚚
            </div>

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
          <span className="tracking-eyebrow">
            WHY BESTWAY
          </span>

          <h2>Why Choose Bestway Logistics?</h2>

          <p>
            We make shipping simpler with dependable service,
            careful handling, and shipment visibility.
          </p>
        </div>

        <div className="why-grid">
          <article className="why-card">
            <div className="why-icon" aria-hidden="true">
              🛡️
            </div>

            <h3>Reliable &amp; Secure</h3>

            <p>
              We prioritize careful handling and dependable
              service throughout your shipment journey.
            </p>
          </article>

          <article className="why-card">
            <div className="why-icon" aria-hidden="true">
              🌍
            </div>

            <h3>Connecting Destinations</h3>

            <p>
              Logistics solutions designed to connect shipments
              with destinations across the world.
            </p>
          </article>

          <article className="why-card">
            <div className="why-icon" aria-hidden="true">
              📦
            </div>

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
          <span className="tracking-eyebrow">
            GET IN TOUCH
          </span>

          <h2>Let&apos;s Move Your Shipment</h2>

          <p>
            Have a shipping question or need help with a delivery?
            Contact our team and we&apos;ll be happy to assist.
          </p>

          <a
            className="contact-email"
            href="mailto:bestwaylogistics000@gmail.com"
          >
            <span
              className="contact-email-icon"
              aria-hidden="true"
            >
              ✉
            </span>

            <span className="contact-email-text">
              <span className="contact-email-label">
                Email Us
              </span>

              <span className="contact-email-address">
                bestwaylogistics000@gmail.com
              </span>
            </span>

            <span
              className="contact-email-arrow"
              aria-hidden="true"
            >
              →
            </span>
          </a>
        </div>
      </section>
    </main>
  );
}
