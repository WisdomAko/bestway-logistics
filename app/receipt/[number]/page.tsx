'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { supabase } from '../../../lib/supabase';

type Shipment = {
  id: string;
  tracking_number: string;
  sender_name: string | null;
  receiver_name: string | null;
  recipient: string | null;
  origin: string;
  destination: string;
  estimated_delivery: string | null;
  status: string;
  current_location: string | null;
  created_at: string | null;
};

function formatDate(value: string | null) {
  if (!value) return 'Not provided';

  const date = new Date(`${value.slice(0, 10)}T12:00:00`);

  if (Number.isNaN(date.getTime())) return 'Not provided';

  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function formatStatus(status: string) {
  if (!status) return 'Processing';

  return status
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

export default function ReceiptPage() {
  const params = useParams<{ number: string }>();
  const trackingNumber = decodeURIComponent(
    String(params.number || '')
  );

  const [shipment, setShipment] = useState<Shipment | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [receiptDate] = useState(() => new Date());

  useEffect(() => {
    let cancelled = false;

    async function loadShipment() {
      setLoading(true);
      setErrorMessage('');

      const { data, error } = await supabase
        .from('shipments')
        .select(
          'id, tracking_number, sender_name, receiver_name, recipient, origin, destination, estimated_delivery, status, current_location, created_at'
        )
        .eq('tracking_number', trackingNumber)
        .maybeSingle();

      if (cancelled) return;

      if (error || !data) {
        console.error('Receipt shipment lookup:', error?.message);
        setErrorMessage(
          'We could not find a shipment with this tracking number.'
        );
        setShipment(null);
      } else {
        setShipment(data as Shipment);
      }

      setLoading(false);
    }

    if (trackingNumber) {
      void loadShipment();
    } else {
      setErrorMessage('A tracking number is required.');
      setLoading(false);
    }

    return () => {
      cancelled = true;
    };
  }, [trackingNumber]);

  const trackingUrl =
    typeof window !== 'undefined'
      ? `${window.location.origin}/?number=${encodeURIComponent(
          trackingNumber
        )}`
      : '';

  const qrUrl = trackingUrl
    ? `https://api.qrserver.com/v1/create-qr-code/?size=240x240&margin=0&data=${encodeURIComponent(
        trackingUrl
      )}`
    : '';

  if (loading) {
    return (
      <main className="receipt-message">
        <p>Loading your shipment receipt...</p>
        <style jsx>{`
          .receipt-message {
            min-height: 70vh;
            display: grid;
            place-items: center;
            padding: 24px;
            background: #f3f7fc;
            color: #0b1a30;
            font-family: Arial, Helvetica, sans-serif;
          }
        `}</style>
      </main>
    );
  }

  if (!shipment) {
    return (
      <main className="receipt-message">
        <div>
          <h1>Receipt unavailable</h1>
          <p>{errorMessage}</p>
          <a href="/">Return to tracking</a>
        </div>
        <style jsx>{`
          .receipt-message {
            min-height: 70vh;
            display: grid;
            place-items: center;
            padding: 24px;
            background: #f3f7fc;
            color: #0b1a30;
            font-family: Arial, Helvetica, sans-serif;
          }
          .receipt-message div {
            max-width: 440px;
            padding: 28px;
            background: #fff;
            border: 1px solid #dce5f1;
            border-radius: 14px;
          }
          a {
            color: #0d23a0;
            font-weight: 700;
          }
        `}</style>
      </main>
    );
  }

  const sender = shipment.sender_name || 'Not provided';
  const recipient =
    shipment.receiver_name || shipment.recipient || 'Not provided';
  const issuedDate = receiptDate.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
  const status = formatStatus(shipment.status);

  return (
    <main className="receipt-page">
      <div className="receipt-actions no-print">
        <a href="/">← Track another shipment</a>
        <button onClick={() => window.print()}>
          Print / Save as PDF
        </button>
      </div>

      <article className="receipt">
        {/* Main Header */}
        <header className="brand-header">
          <div className="brand-main">
            <svg className="brand-logo-svg" viewBox="0 0 100 100" role="img" aria-label="Bestway Logistics logo">
              <rect x="2" y="2" width="96" height="96" rx="20" fill="#0b1b3d"/>
              <text x="50" y="74" textAnchor="middle" fontFamily="Arial, Helvetica, sans-serif" fontSize="76" fontWeight="900" fontStyle="italic" fill="#ffffff">B</text>
            </svg>
            <div>
              <h1>BESTWAY</h1>
              <p className="brand-logistics">L O G I S T I C S</p>
              <p className="brand-tagline">LOGISTICS WITHOUT BOUNDARIES</p>
            </div>
          </div>
          <div className="receipt-heading">
            <span className="eyebrow-hdr">SHIPMENT</span>
            <h2>RECEIPT</h2>
            <small>ISSUED {issuedDate}</small>
          </div>
        </header>

        {/* Reference Section */}
        <section className="reference-band">
          <div>
            <span className="eyebrow">RECEIPT REFERENCE</span>
            <strong className="reference-number">{shipment.tracking_number}</strong>
          </div>
          <div className="reference-status">
            <strong>{status}</strong>
            <small>Latest recorded shipment status</small>
          </div>
        </section>

        {/* Tracking Code and QR Panel */}
        <section className="tracking-panel">
          <div className="tracking-code">
            <span className="eyebrow">TRACKING NUMBER</span>
            <strong className="tracking-number">{shipment.tracking_number}</strong>

            <svg className="barcode" viewBox="0 0 220 36" role="img" aria-label={`Barcode for shipment ${shipment.tracking_number}`}>
              {Array.from({ length: 52 }, (_, index) => (
                <rect
                  key={index}
                  x={index * 4.2}
                  y="0"
                  width={index % 4 === 0 ? 3.5 : index % 3 === 0 ? 2.8 : 2}
                  height="36"
                  fill="#0b1b3d"
                />
              ))}
            </svg>
            <span className="barcode-label">
              {shipment.tracking_number.split('').join(' ')}
            </span>
          </div>

          <div className="qr-card">
            {qrUrl && (
              <img
                src={qrUrl}
                alt={`QR code for shipment ${shipment.tracking_number}`}
              />
            )}
            <strong>SCAN TO TRACK</strong>
            <p>Scan to open this shipment's tracking page.</p>
          </div>
        </section>

        {/* People Panel (Sender & Recipient) */}
        <section className="people-panel">
          <div className="person">
            <span className="number-badge">01</span>
            <div className="person-content">
              <span className="eyebrow">SHIPPER / SENDER</span>
              <strong className="person-name">{sender}</strong>
              <span className="person-subtext">Shipment sender</span>
            </div>
          </div>

          <div className="person">
            <span className="number-badge">02</span>
            <div className="person-content">
              <span className="eyebrow">RECIPIENT</span>
              <strong className="person-name">{recipient}</strong>
              <span className="person-subtext">Delivery recipient</span>
            </div>
          </div>
        </section>

        {/* Route Panel */}
        <section className="route-panel">
          <div className="route-point">
            <span className="eyebrow">ORIGIN</span>
            <strong>{shipment.origin || 'Not provided'}</strong>
          </div>
          <div className="route-arrow" aria-hidden="true">→</div>
          <div className="route-point">
            <span className="eyebrow">DESTINATION</span>
            <strong>{shipment.destination || 'Not provided'}</strong>
          </div>
        </section>

        {/* Shipment Details Panel */}
        <section className="details-panel">
          <div className="section-heading">
            <div className="details-icon">
              <span className="inner-square" />
            </div>
            <div>
              <h2>SHIPMENT DETAILS</h2>
              <p>Recorded information for this shipment</p>
            </div>
          </div>

          <div className="details-grid">
            <Detail label="TRACKING REFERENCE" value={shipment.tracking_number} />
            <Detail label="CURRENT STATUS" value={status} />
            <Detail label="CURRENT LOCATION" value={shipment.current_location || 'Not yet updated'} />
            <Detail label="ESTIMATED DELIVERY DATE" value={formatDate(shipment.estimated_delivery)} />
            <Detail label="DATE SHIPMENT CREATED" value={formatDate(shipment.created_at)} />
            <Detail label="DATE RECEIPT ISSUED" value={issuedDate} />
          </div>
        </section>

        {/* Notice Panel */}
        <section className="notice-panel">
          <h2>IMPORTANT INFORMATION</h2>
          <p>
            Estimated delivery dates are provided for guidance and may
            change as the shipment progresses. Please use the tracking
            number or QR code to check the latest recorded status.
          </p>
        </section>

        {/* Footer */}
        <footer className="receipt-footer">
          <div className="footer-brand">
            <svg className="brand-logo-svg small" viewBox="0 0 100 100" role="img" aria-label="Bestway Logistics logo">
              <rect x="2" y="2" width="96" height="96" rx="20" fill="#0b1b3d"/>
              <text x="50" y="74" textAnchor="middle" fontFamily="Arial, Helvetica, sans-serif" fontSize="76" fontWeight="900" fontStyle="italic" fill="#ffffff">B</text>
            </svg>
            <div>
              <strong>BESTWAY LOGISTICS</strong>
              <span>LOGISTICS WITHOUT BOUNDARIES</span>
            </div>
          </div>

          <div className="footer-contact">
            <span>✉ bestwaylogistics000@gmail.com</span>
            <span className="contact-divider">|</span>
            <span>🌐 Online shipment tracking</span>
          </div>

          <div className="footer-thanks">
            <strong>Thank you for choosing Bestway Logistics.</strong>
            <p>Reliable service. Shipment visibility. Global connections.</p>
            <small>
              This document confirms recorded shipment details. It is not
              proof of payment.
            </small>
          </div>
        </footer>
      </article>

      <style jsx>{`
        :global(*) {
          box-sizing: border-box;
        }

        .receipt-page {
          min-height: 100vh;
          padding: 30px 16px 40px;
          background: #f1f4f9;
          color: #0b1b3d;
          font-family: Arial, Helvetica, sans-serif;
        }

        .receipt-actions {
          max-width: 680px;
          margin: 0 auto 16px;
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .receipt-actions a {
          color: #0b1b3d;
          font-weight: 700;
          text-decoration: none;
        }

        .receipt-actions button {
          border: 0;
          border-radius: 6px;
          padding: 10px 16px;
          background: #0b1b3d;
          color: #fff;
          font-size: 14px;
          font-weight: 700;
          cursor: pointer;
        }

        /* Container Card */
        .receipt {
          width: 100%;
          max-width: 680px;
          margin: 0 auto;
          background: #fff;
          color: #0b1b3d;
          border: 2px solid #0b1b3d;
          border-radius: 12px;
          overflow: hidden;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.05);
        }

        /* Brand Header */
        .brand-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          padding: 24px 28px 20px;
          border-bottom: 2px solid #0b1b3d;
        }

        .brand-main {
          display: flex;
          align-items: center;
          gap: 16px;
        }

        .brand-logo-svg {
          width: 58px;
          height: 58px;
          flex-shrink: 0;
        }

        .brand-logo-svg.small {
          width: 36px;
          height: 36px;
        }

        .brand-main h1 {
          margin: 0;
          color: #0b1b3d;
          font-size: 26px;
          font-weight: 900;
          letter-spacing: -0.5px;
          line-height: 1;
        }

        .brand-logistics {
          margin: 4px 0 3px;
          color: #0b1b3d;
          font-size: 11px;
          font-weight: 800;
          letter-spacing: 3.5px;
        }

        .brand-tagline {
          margin: 0;
          color: #1a2a4a;
          font-size: 8px;
          font-weight: 700;
          letter-spacing: 1.2px;
        }

        .receipt-heading {
          text-align: right;
        }

        .eyebrow-hdr {
          color: #55627a;
          font-size: 10px;
          font-weight: 600;
          letter-spacing: 1.5px;
        }

        .receipt-heading h2 {
          margin: 2px 0 4px;
          color: #0b1b3d;
          font-size: 20px;
          font-weight: 900;
          letter-spacing: 0.5px;
        }

        .receipt-heading small {
          color: #55627a;
          font-size: 9px;
          font-weight: 600;
        }

        /* Reference Band */
        .reference-band {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 16px 28px;
          border-bottom: 2px solid #0b1b3d;
        }

        .eyebrow {
          display: block;
          color: #55627a;
          font-size: 10px;
          font-weight: 700;
          letter-spacing: 1px;
        }

        .reference-number {
          display: block;
          margin-top: 4px;
          color: #0b1b3d;
          font-size: 24px;
          font-weight: 900;
        }

        .reference-status {
          text-align: right;
        }

        .reference-status strong {
          display: block;
          color: #137e47;
          font-size: 16px;
          font-weight: 800;
        }

        .reference-status small {
          display: block;
          margin-top: 2px;
          color: #55627a;
          font-size: 9px;
        }

        /* Tracking & QR */
        .tracking-panel {
          display: grid;
          grid-template-columns: 1fr 140px;
          gap: 20px;
          padding: 22px 28px;
          border-bottom: 2px solid #0b1b3d;
        }

        .tracking-number {
          display: block;
          margin-top: 4px;
          color: #0b1b3d;
          font-size: 28px;
          font-weight: 900;
        }

        .barcode {
          display: block;
          height: 48px;
          width: 100%;
          max-width: 280px;
          margin-top: 10px;
        }

        .barcode-label {
          display: block;
          margin-top: 6px;
          color: #0b1b3d;
          font-size: 10px;
          font-weight: 700;
          letter-spacing: 4px;
        }

        .qr-card {
          padding: 12px 10px 10px;
          border: 1.5 solid #0b1b3d;
          border-radius: 8px;
          text-align: center;
          outline: 1.5px solid #0b1b3d;
        }

        .qr-card img {
          display: block;
          width: 90px;
          height: 90px;
          margin: 0 auto 8px;
          object-fit: contain;
        }

        .qr-card strong {
          display: block;
          color: #0b1b3d;
          font-size: 10px;
          font-weight: 900;
          letter-spacing: 0.5px;
        }

        .qr-card p {
          margin: 3px 0 0;
          color: #55627a;
          font-size: 8px;
          line-height: 1.3;
        }

        /* People Panel */
        .people-panel {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 20px;
          padding: 20px 28px;
          border-bottom: 2px solid #0b1b3d;
        }

        .person {
          display: flex;
          align-items: flex-start;
          gap: 10px;
        }

        .number-badge {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          color: #124eb8;
          font-size: 13px;
          font-weight: 800;
          margin-top: -1px;
        }

        .person-name {
          display: block;
          margin-top: 4px;
          color: #0b1b3d;
          font-size: 16px;
          font-weight: 800;
        }

        .person-subtext {
          display: block;
          margin-top: 2px;
          color: #6a788e;
          font-size: 10px;
        }

        /* Route Panel */
        .route-panel {
          display: grid;
          grid-template-columns: 1fr auto 1fr;
          align-items: center;
          gap: 16px;
          padding: 18px 28px;
          border-bottom: 2px solid #0b1b3d;
        }

        .route-point strong {
          display: block;
          margin-top: 4px;
          color: #0b1b3d;
          font-size: 15px;
          font-weight: 800;
        }

        .route-arrow {
          color: #124eb8;
          font-size: 22px;
          font-weight: 700;
          padding: 0 10px;
        }

        /* Details Panel */
        .details-panel {
          padding: 22px 28px;
          border-bottom: 2px solid #0b1b3d;
        }

        .section-heading {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-bottom: 18px;
        }

        .details-icon {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 20px;
          height: 20px;
          border: 2px solid #0b1b3d;
          border-radius: 3px;
        }

        .details-icon .inner-square {
          width: 8px;
          height: 8px;
          background: #0b1b3d;
        }

        .section-heading h2 {
          margin: 0;
          color: #0b1b3d;
          font-size: 14px;
          font-weight: 900;
          letter-spacing: 0.5px;
        }

        .section-heading p {
          margin: 1px 0 0;
          color: #6a788e;
          font-size: 10px;
        }

        .details-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px 28px;
        }

        .detail-label {
          color: #55627a;
          font-size: 9px;
          font-weight: 800;
          letter-spacing: 0.5px;
        }

        .detail-value {
          margin-top: 3px;
          color: #0b1b3d;
          font-size: 14px;
          font-weight: 800;
        }

        /* Notice Panel */
        .notice-panel {
          margin: 20px 28px;
          padding: 14px 16px;
          border: 1.5px solid #0b1b3d;
          border-left: 4px solid #124eb8;
          border-radius: 6px;
          background: #fff;
        }

        .notice-panel h2 {
          margin: 0 0 4px;
          color: #0b1b3d;
          font-size: 11px;
          font-weight: 900;
          letter-spacing: 0.5px;
        }

        .notice-panel p {
          margin: 0;
          color: #4a566b;
          font-size: 9.5px;
          line-height: 1.4;
        }

        /* Footer */
        .receipt-footer {
          padding: 20px 28px 22px;
          border-top: 2px solid #0b1b3d;
          background: #fff;
          text-align: center;
        }

        .footer-brand {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
        }

        .footer-brand strong {
          color: #0b1b3d;
          font-size: 14px;
          font-weight: 900;
        }

        .footer-brand span {
          display: block;
          color: #55627a;
          font-size: 8px;
          font-weight: 700;
          letter-spacing: 1.5px;
          margin-top: 1px;
        }

        .footer-contact {
          margin-top: 12px;
          color: #0b1b3d;
          font-size: 10px;
          font-weight: 600;
        }

        .contact-divider {
          margin: 0 8px;
          color: #aaa;
        }

        .footer-thanks {
          margin-top: 14px;
          padding-top: 14px;
          border-top: 1px solid #e1e7f0;
        }

        .footer-thanks strong {
          color: #0b1b3d;
          font-size: 12px;
          font-weight: 800;
        }

        .footer-thanks p {
          margin: 3px 0 0;
          color: #55627a;
          font-size: 10px;
        }

        .footer-thanks small {
          display: block;
          margin-top: 8px;
          color: #7b889d;
          font-size: 8.5px;
        }

        @media (max-width: 580px) {
          .tracking-panel {
            grid-template-columns: 1fr;
          }
          .qr-card {
            display: max-content;
          }
          .people-panel, .details-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>

      <style jsx global>{`
        @media print {
          @page {
            size: A4 portrait;
            margin: 0;
          }

          body {
            background: #fff !important;
            padding: 0 !important;
            margin: 0 !important;
          }

          .no-print {
            display: none !important;
          }

          .receipt-page {
            padding: 0 !important;
            background: #fff !important;
          }

          .receipt {
            border-radius: 0 !important;
            max-width: 100% !important;
            box-shadow: none !important;
          }
        }
      `}</style>
    </main>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="detail-label">{label}</div>
      <div className="detail-value">{value}</div>
    </div>
  );
}
