
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
    ? `https://api.qrserver.com/v1/create-qr-code/?size=240x240&margin=8&data=${encodeURIComponent(
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
            color: #142849;
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
            color: #142849;
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
            color: #0759d5;
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
        <header className="topbar">
          <a className="top-brand" href="/" aria-label="Bestway Logistics">
            <span className="brand-mark">B</span>
            <span className="top-brand-text">
              <strong>BESTWAY</strong>
              <span>LOGISTICS</span>
            </span>
          </a>
          <span className="topbar-label">SHIPMENT RECEIPT</span>
        </header>

        <section className="brand-header">
          <div className="brand-main">
            <span className="brand-mark large">B</span>
            <div>
              <h1>BESTWAY</h1>
              <p className="brand-logistics">L O G I S T I C S</p>
              <p className="brand-tagline">LOGISTICS WITHOUT BOUNDARIES</p>
            </div>
          </div>
          <div className="receipt-heading">
            <span>SHIPMENT</span>
            <strong>RECEIPT</strong>
            <small>ISSUED {issuedDate}</small>
          </div>
        </section>

        <section className="reference-band">
          <div>
            <span className="eyebrow light">RECEIPT REFERENCE</span>
            <strong className="reference-number">
              {shipment.tracking_number}
            </strong>
          </div>
          <div className="reference-status">
            <span className="status-dot" />
            <div>
              <strong>{status}</strong>
              <small>Latest recorded shipment status</small>
            </div>
          </div>
        </section>

        <section className="tracking-panel">
          <div className="tracking-code">
            <span className="eyebrow">TRACKING NUMBER</span>
            <strong className="tracking-number">
              {shipment.tracking_number}
            </strong>

            <div className="barcode" aria-label="Decorative barcode">
              {Array.from({ length: 48 }, (_, index) => (
                <span
                  key={index}
                  style={{
                    width: index % 5 === 0 ? '3px' : index % 3 === 0 ? '2px' : '1px',
                  }}
                />
              ))}
            </div>
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

        <section className="route-panel">
          <div className="route-point">
            <span className="eyebrow">ORIGIN</span>
            <strong>{shipment.origin || 'Not provided'}</strong>
          </div>
          <div className="route-arrow" aria-hidden="true">
            →
          </div>
          <div className="route-point">
            <span className="eyebrow">DESTINATION</span>
            <strong>{shipment.destination || 'Not provided'}</strong>
          </div>
        </section>

        <section className="details-panel">
          <div className="section-heading">
            <span className="details-icon">▣</span>
            <div>
              <h2>SHIPMENT DETAILS</h2>
              <p>Recorded information for this shipment</p>
            </div>
          </div>

          <div className="details-grid">
            <Detail
              label="TRACKING REFERENCE"
              value={shipment.tracking_number}
            />
            <Detail label="CURRENT STATUS" value={status} />
            <Detail
              label="CURRENT LOCATION"
              value={shipment.current_location || 'Not yet updated'}
            />
            <Detail
              label="ESTIMATED DELIVERY DATE"
              value={formatDate(shipment.estimated_delivery)}
            />
            <Detail
              label="DATE SHIPMENT CREATED"
              value={formatDate(shipment.created_at)}
            />
            <Detail label="DATE RECEIPT ISSUED" value={issuedDate} />
          </div>
        </section>

        <section className="notice-panel">
          <h2>IMPORTANT INFORMATION</h2>
          <p>
            Estimated delivery dates are provided for guidance and may
            change as the shipment progresses. Please use the tracking
            number or QR code to check the latest recorded status.
          </p>
        </section>

        <footer className="receipt-footer">
          <div className="footer-brand">
            <span className="brand-mark">B</span>
            <div>
              <strong>BESTWAY LOGISTICS</strong>
              <span>LOGISTICS WITHOUT BOUNDARIES</span>
            </div>
          </div>

          <div className="footer-contact">
            <span>✉ bestwaylogistics000@gmail.com</span>
            <span>◎ Online shipment tracking</span>
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
          padding: 24px 16px 40px;
          background: #edf2f9;
          color: #142849;
          font-family: Arial, Helvetica, sans-serif;
          -webkit-print-color-adjust: economy;
print-color-adjust: economy;
        }

        .receipt-actions {
          max-width: 820px;
          margin: 0 auto 18px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
        }

        .receipt-actions a {
          color: #174a8b;
          font-weight: 700;
          text-decoration: none;
        }

        .receipt-actions button {
          border: 0;
          border-radius: 9px;
          padding: 13px 18px;
          background: #064bc1;
          color: #fff;
          font-size: 14px;
          font-weight: 700;
          cursor: pointer;
        }

        .receipt {
          width: 100%;
          max-width: 820px;
          margin: 0 auto;
          overflow: hidden;
          border: 1px solid #d6e0ed;
          border-radius: 14px;
          background: #fff;
          color: #142849;
          box-shadow: 0 10px 32px rgba(15, 40, 75, 0.1);
        }

        .topbar {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 12px;
          padding: 14px 22px;
          background: #030c24;
          color: #fff;
        }

        .top-brand {
          display: flex;
          align-items: center;
          gap: 10px;
          color: #fff;
          text-decoration: none;
        }

        .brand-mark {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          flex: 0 0 auto;
          width: 40px;
          height: 40px;
          border-radius: 10px;
          background: #073ec7;
          color: #fff;
          font-size: 27px;
          font-style: italic;
          font-weight: 900;
        }

        .top-brand-text {
          display: flex;
          flex-direction: column;
          gap: 2px;
          letter-spacing: 1.2px;
        }

        .top-brand-text strong {
          font-size: 15px;
        }

        .top-brand-text span {
          font-size: 10px;
          letter-spacing: 2px;
        }

        .topbar-label {
          font-size: 11px;
          font-weight: 800;
          letter-spacing: 1.3px;
          text-align: right;
        }

        .brand-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 15px;
          padding: 22px 26px;
          border-bottom: 4px solid #145be1;
          background: #fff;
        }

        .brand-main {
          display: flex;
          align-items: center;
          gap: 13px;
        }

        .brand-mark.large {
          width: 56px;
          height: 56px;
          font-size: 38px;
          border-radius: 12px;
        }

        .brand-main h1 {
          margin: 0;
          color: #092652;
          font-size: 28px;
          line-height: 1;
          letter-spacing: -0.8px;
        }

        .brand-logistics {
          margin: 5px 0;
          color: #0752b5;
          font-size: 12px;
          font-weight: 800;
          letter-spacing: 3px;
        }

        .brand-tagline {
          margin: 0;
          color: #586b85;
          font-size: 8px;
          font-weight: 800;
          letter-spacing: 1.6px;
        }

        .receipt-heading {
          display: flex;
          flex-direction: column;
          align-items: flex-end;
          gap: 3px;
          color: #0752b5;
          font-size: 11px;
          letter-spacing: 1.2px;
        }

        .receipt-heading strong {
          font-size: 17px;
        }

        .receipt-heading small {
          margin-top: 5px;
          color: #65748a;
          font-size: 9px;
          letter-spacing: 0;
        }

        .reference-band {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 14px;
          padding: 19px 26px;
          background: #061b43;
          color: #fff;
        }

        .eyebrow {
          display: block;
          color: #536b8b;
          font-size: 9px;
          font-weight: 800;
          letter-spacing: 1.4px;
          line-height: 1.4;
        }

        .eyebrow.light {
          color: #8bbcff;
        }

        .reference-number {
          display: block;
          margin-top: 5px;
          font-size: 24px;
          overflow-wrap: anywhere;
        }

        .reference-status {
          display: flex;
          align-items: center;
          gap: 9px;
        }

        .status-dot {
          width: 10px;
          height: 10px;
          flex: 0 0 auto;
          border-radius: 50%;
          background: #1dc99a;
        }

        .reference-status strong {
          display: block;
          color: #54d9b1;
          font-size: 14px;
        }

        .reference-status small {
          display: block;
          margin-top: 4px;
          color: #d4dfef;
          font-size: 9px;
        }

        .tracking-panel {
          display: grid;
          grid-template-columns: 1fr 150px;
          align-items: center;
          gap: 20px;
          padding: 22px 26px;
          background: #eef5ff;
          border-bottom: 1px solid #d4e2f4;
        }

        .tracking-number {
          display: block;
          margin-top: 6px;
          color: #081d42;
          font-size: clamp(25px, 4vw, 38px);
          letter-spacing: -0.8px;
          overflow-wrap: anywhere;
        }

        .barcode {
          display: flex;
          align-items: stretch;
          height: 36px;
          width: 220px;
          max-width: 100%;
          margin-top: 13px;
          overflow: hidden;
          background: #fff;
        }

        .barcode span {
          flex: 1 0 auto;
          margin-right: 2px;
          background: #071b3e;
        }

        .barcode-label {
          display: block;
          margin-top: 4px;
          color: #536783;
          font-size: 8px;
          letter-spacing: 3px;
          overflow-wrap: anywhere;
        }

        .qr-card {
          padding: 10px;
          border: 1px solid #d6e1ef;
          border-radius: 12px;
          background: #fff;
          text-align: center;
        }

        .qr-card img {
          display: block;
          width: 100%;
          max-width: 120px;
          aspect-ratio: 1;
          object-fit: contain;
          margin: 0 auto 5px;
        }

        .qr-card strong {
          display: block;
          color: #0a2c5b;
          font-size: 10px;
          letter-spacing: 0.8px;
        }

        .qr-card p {
          margin: 5px 0 0;
          color: #64758c;
          font-size: 9px;
          line-height: 1.4;
        }

        .people-panel {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 22px;
          padding: 22px 26px;
          background: #fff;
        }

        .person {
          display: flex;
          align-items: flex-start;
          gap: 10px;
          min-width: 0;
        }

        .number-badge {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 28px;
          height: 28px;
          flex: 0 0 auto;
          border-radius: 7px;
          background: #e6f0ff;
          color: #0752b5;
          font-size: 10px;
          font-weight: 900;
        }

        .person-content {
          min-width: 0;
        }

        .person-name {
          display: block;
          margin-top: 8px;
          color: #102b51;
          font-size: 17px;
          overflow-wrap: anywhere;
        }

        .person-subtext {
          display: block;
          margin-top: 4px;
          color: #78869a;
          font-size: 10px;
        }

        .route-panel {
          display: grid;
          grid-template-columns: 1fr 36px 1fr;
          align-items: center;
          gap: 12px;
          padding: 16px 26px;
          background: #eaf3ff;
          border-top: 1px solid #d8e5f4;
          border-bottom: 1px solid #d8e5f4;
        }

        .route-point {
          min-width: 0;
        }

        .route-point strong {
          display: block;
          margin-top: 5px;
          color: #102b51;
          font-size: 13px;
          line-height: 1.4;
          overflow-wrap: anywhere;
        }

        .route-arrow {
          color: #1261c8;
          font-size: 27px;
          font-weight: 800;
          text-align: center;
        }

        .details-panel {
          padding: 22px 26px;
          background: #fff;
        }

        .section-heading {
          display: flex;
          align-items: center;
          gap: 11px;
          margin-bottom: 20px;
        }

        .details-icon {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 32px;
          height: 32px;
          border-radius: 8px;
          background: #e8f1ff;
          color: #0752b5;
          font-size: 20px;
        }

        .section-heading h2 {
          margin: 0;
          color: #102b51;
          font-size: 14px;
          letter-spacing: 1px;
        }

        .section-heading p {
          margin: 4px 0 0;
          color: #718198;
          font-size: 10px;
        }

        .details-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 18px 28px;
        }

        .detail-label {
          color: #687c97;
          font-size: 9px;
          font-weight: 800;
          letter-spacing: 1px;
        }

        .detail-value {
          margin-top: 5px;
          color: #102b51;
          font-size: 13px;
          font-weight: 700;
          line-height: 1.4;
          overflow-wrap: anywhere;
        }

        .notice-panel {
          margin: 0 26px 22px;
          padding: 15px 18px;
          border-left: 4px solid #1261df;
          border-radius: 5px;
          background: #edf4ff;
        }

        .notice-panel h2 {
          margin: 0 0 7px;
          color: #153b70;
          font-size: 11px;
          letter-spacing: 0.8px;
        }

        .notice-panel p {
          margin: 0;
          color: #3f5572;
          font-size: 10px;
          line-height: 1.5;
        }

        .receipt-footer {
          padding: 20px 26px 18px;
          border-top: 1px solid #d9e3ef;
          background: #f7faff;
        }

        .footer-brand {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
        }

        .footer-brand .brand-mark {
          width: 34px;
          height: 34px;
          font-size: 23px;
          border-radius: 8px;
        }

        .footer-brand div {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .footer-brand strong {
          color: #102b51;
          font-size: 13px;
        }

        .footer-brand div span {
          color: #60738e;
          font-size: 9px;
          letter-spacing: 1px;
        }

        .footer-contact {
          display: flex;
          flex-wrap: wrap;
          justify-content: center;
          gap: 8px 22px;
          margin-top: 15px;
          color: #3e5574;
          font-size: 10px;
        }

        .footer-thanks {
          margin-top: 17px;
          padding-top: 14px;
          border-top: 1px solid #dce5f1;
          text-align: center;
        }

        .footer-thanks strong {
          color: #15365f;
          font-size: 12px;
        }

        .footer-thanks p {
          margin: 6px 0;
          color: #455b78;
          font-size: 10px;
        }

        .footer-thanks small {
          display: block;
          margin-top: 9px;
          color: #7a879a;
          font-size: 8px;
          line-height: 1.4;
        }

        @media (max-width: 520px) {
          .receipt-page {
            padding: 12px 7px 24px;
          }

          .receipt {
            border-radius: 8px;
          }

          .topbar {
            padding: 11px 12px;
          }

          .top-brand-text strong {
            font-size: 12px;
          }

          .top-brand-text span {
            font-size: 8px;
          }

          .topbar-label {
            font-size: 9px;
          }

          .brand-header {
            padding: 16px 13px;
            gap: 8px;
          }

          .brand-mark.large {
            width: 43px;
            height: 43px;
            font-size: 30px;
          }

          .brand-main {
            gap: 8px;
          }

          .brand-main h1 {
            font-size: 21px;
          }

          .brand-logistics {
            font-size: 9px;
            letter-spacing: 2px;
          }

          .brand-tagline {
            font-size: 6px;
            letter-spacing: 0.8px;
          }

          .receipt-heading {
            font-size: 9px;
          }

          .receipt-heading strong {
            font-size: 13px;
          }

          .receipt-heading small {
            font-size: 7px;
          }

          .reference-band {
            padding: 15px 13px;
          }

          .reference-number {
            font-size: 19px;
          }

          .reference-status strong {
            font-size: 12px;
          }

          .reference-status small {
            max-width: 120px;
            font-size: 8px;
          }

          .tracking-panel {
            grid-template-columns: minmax(0, 1fr) 112px;
            gap: 10px;
            padding: 16px 12px;
          }

          .tracking-number {
            font-size: clamp(20px, 6vw, 29px);
          }

          .barcode {
            height: 28px;
          }

          .qr-card {
            padding: 7px;
          }

          .qr-card img {
            max-width: 92px;
          }

          .people-panel {
            gap: 12px;
            padding: 17px 12px;
          }

          .person {
            gap: 7px;
          }

          .number-badge {
            width: 23px;
            height: 23px;
            font-size: 8px;
          }

          .person-name {
            font-size: 14px;
          }

          .route-panel {
            grid-template-columns: minmax(0, 1fr) 22px minmax(0, 1fr);
            gap: 5px;
            padding: 14px 12px;
          }

          .route-point strong {
            font-size: 11px;
          }

          .route-arrow {
            font-size: 21px;
          }

          .details-panel {
            padding: 17px 12px;
          }

          .details-grid {
            gap: 15px 12px;
          }

          .detail-value {
            font-size: 11px;
          }

          .notice-panel {
            margin: 0 12px 16px;
            padding: 12px;
          }

          .receipt-footer {
            padding: 16px 12px;
          }

          .receipt-actions a {
            font-size: 12px;
          }

          .receipt-actions button {
            padding: 11px;
            font-size: 12px;
          }
        }

       


@media print {
  @page {
    size: A4 portrait;
    margin: 8mm;
  }

  :global(html),
  :global(body) {
    margin: 0 !important;
    padding: 0 !important;
    background: #ffffff !important;
    color: #142849 !important;
    color-scheme: light !important;
-webkit-print-color-adjust: economy !important;
print-color-adjust: economy !important;
  }

  .no-print,
  .receipt-actions,
  .topbar {
    display: none !important;
  }

  .receipt-page {
    width: 100% !important;
    min-height: 0 !important;
    margin: 0 !important;
    padding: 0 !important;
    background: #ffffff !important;
    color: #142849 !important;
  }

  .receipt,
  .receipt * {
    box-sizing: border-box !important;
    text-shadow: none !important;
  }

  .receipt {
    width: 100% !important;
    max-width: none !important;
        color-scheme: light !important;
    forced-color-adjust: none !important;
    margin: 0 !important;
    padding: 0 !important;
    overflow: visible !important;
    border: 1px solid #cbd8e8 !important;
    border-radius: 0 !important;
    background: #ffffff !important;
    color: #142849 !important;
    box-shadow: none !important;
    font-family: Arial, Helvetica, sans-serif !important;
    font-size: 10px !important;
  }
  .receipt * {
  forced-color-adjust: none !important;
}

  .receipt .topbar {
    display: none !important;
  }

  .receipt .brand-header,
.receipt .people-panel,
.receipt .details-panel,
.receipt .receipt-footer,
.receipt .tracking-panel,
.receipt .route-panel,
.receipt .notice-panel,
.receipt .qr-card {
  background: #ffffff !important;
  background-color: #ffffff !important;
  color: #142849 !important;
  -webkit-print-color-adjust: exact !important;
print-color-adjust: exact !important;
}

  .receipt .brand-header {
    padding: 7mm 6mm !important;
    border-bottom: 1.2mm solid #145be1 !important;
  }

  .receipt .brand-main h1,
  .receipt .tracking-number,
  .receipt .person-name,
  .receipt .route-point strong,
  .receipt .section-heading h2,
  .receipt .detail-value,
  .receipt .footer-brand strong,
  .receipt .footer-thanks strong {
    color: #142849 !important;
  }

  .receipt .brand-mark {
    background: #073ec7 !important;
    color: #ffffff !important;
    print-color-adjust: exact !important;
    -webkit-print-color-adjust: exact !important;
  }

  .receipt .brand-mark.large {
    width: 14mm !important;
    height: 14mm !important;
    font-size: 27px !important;
  }

  .receipt .brand-main h1 {
    font-size: 23px !important;
  }

  .receipt .brand-logistics {
    color: #0752b5 !important;
    font-size: 9px !important;
  }

  .receipt .brand-tagline,
  .receipt .receipt-heading small {
    color: #526783 !important;
    font-size: 7px !important;
  }

  .receipt .receipt-heading {
    color: #0752b5 !important;
    font-size: 9px !important;
  }

  .receipt .receipt-heading strong {
    font-size: 14px !important;
  }

  .receipt .reference-band {
    padding: 6mm !important;
    background: #061b43 !important;
    color: #ffffff !important;
    print-color-adjust: exact !important;
    -webkit-print-color-adjust: exact !important;
  }

  .receipt .reference-band *,
  .receipt .reference-band .eyebrow,
  .receipt .reference-band .reference-number {
    color: #ffffff !important;
  }

  .receipt .reference-band .eyebrow {
    color: #b8d5ff !important;
  }

  .receipt .reference-band .reference-status strong {
    color: #54d9b1 !important;
    font-size: 11px !important;
  }

  .receipt .reference-band .reference-status small {
    color: #ffffff !important;
    font-size: 7px !important;
  }

  .receipt .tracking-panel {
    display: grid !important;
    grid-template-columns: minmax(0, 1fr) 32mm !important;
    gap: 5mm !important;
    padding: 6mm !important;
    background: #f0f6ff !important;
    color: #142849 !important;
  }

  .receipt .tracking-number {
    font-size: 28px !important;
  }

  .receipt .barcode {
    width: 50mm !important;
    height: 9mm !important;
    margin-top: 3mm !important;
  }

  .receipt .barcode span {
    background: #071b3e !important;
  }

  .receipt .barcode-label {
    color: #455b78 !important;
    font-size: 7px !important;
  }

  .receipt .qr-card {
    padding: 2mm !important;
    border: 1px solid #cbd8e8 !important;
    border-radius: 3mm !important;
    background: #ffffff !important;
    color: #142849 !important;
  }

  .receipt .qr-card img {
    display: block !important;
    width: 25mm !important;
    height: 25mm !important;
    max-width: 25mm !important;
    margin: 0 auto 2mm !important;
    object-fit: contain !important;
  }

  .receipt .qr-card strong {
    color: #0a2c5b !important;
    font-size: 7px !important;
  }

  .receipt .qr-card p {
    color: #455b78 !important;
    font-size: 7px !important;
    line-height: 1.4 !important;
  }

  .receipt .people-panel {
    display: grid !important;
    grid-template-columns: 1fr 1fr !important;
    gap: 6mm !important;
    padding: 6mm !important;
  }

  .receipt .number-badge {
    background: #e6f0ff !important;
    color: #0752b5 !important;
    print-color-adjust: exact !important;
    -webkit-print-color-adjust: exact !important;
  }

  .receipt .person-name {
    margin-top: 2mm !important;
    font-size: 13px !important;
  }

  .receipt .person-subtext,
  .receipt .eyebrow {
    color: #526783 !important;
    font-size: 7px !important;
  }

  .receipt .route-panel {
    display: grid !important;
    grid-template-columns: minmax(0, 1fr) 12mm minmax(0, 1fr) !important;
    gap: 3mm !important;
    padding: 5mm 6mm !important;
    background: #eaf3ff !important;
    color: #142849 !important;
  }

  .receipt .route-point strong {
    font-size: 11px !important;
  }

  .receipt .route-arrow {
    color: #145be1 !important;
    font-size: 23px !important;
  }

  .receipt .details-panel {
    padding: 6mm !important;
  }

  .receipt .section-heading {
    gap: 3mm !important;
    margin-bottom: 5mm !important;
  }

  .receipt .details-icon {
    background: #e8f1ff !important;
    color: #0752b5 !important;
    print-color-adjust: exact !important;
    -webkit-print-color-adjust: exact !important;
  }

  .receipt .section-heading h2 {
    font-size: 12px !important;
  }

  .receipt .section-heading p {
    color: #526783 !important;
    font-size: 8px !important;
  }

  .receipt .details-grid {
    display: grid !important;
    grid-template-columns: 1fr 1fr !important;
    gap: 5mm 7mm !important;
  }

  .receipt .detail-label {
    color: #526783 !important;
    font-size: 7px !important;
    font-weight: 800 !important;
  }

  .receipt .detail-value {
    margin-top: 2mm !important;
    color: #142849 !important;
    font-size: 10px !important;
    line-height: 1.4 !important;
    overflow-wrap: anywhere !important;
  }

  .receipt .notice-panel {
    margin: 0 6mm 5mm !important;
    padding: 4mm !important;
    border-left: 1.2mm solid #1261df !important;
    background: #edf4ff !important;
    color: #142849 !important;
  }

  .receipt .notice-panel h2 {
    color: #153b70 !important;
    font-size: 9px !important;
  }

  .receipt .notice-panel p {
    color: #3f5572 !important;
    font-size: 8px !important;
    line-height: 1.5 !important;
  }

  .receipt .receipt-footer {
    padding: 5mm 6mm !important;
    border-top: 1px solid #d9e3ef !important;
    background: #ffffff !important;
    color: #142849 !important;
  }

  .receipt .footer-brand {
    gap: 3mm !important;
  }

  .receipt .footer-brand .brand-mark {
    width: 9mm !important;
    height: 9mm !important;
    font-size: 16px !important;
  }

  .receipt .footer-brand strong {
    font-size: 9px !important;
  }

  .receipt .footer-brand div span,
  .receipt .footer-contact {
    color: #455b78 !important;
    font-size: 7px !important;
  }

  .receipt .footer-contact {
    gap: 2mm 5mm !important;
    margin-top: 3mm !important;
  }

  .receipt .footer-thanks {
    margin-top: 4mm !important;
    padding-top: 3mm !important;
    border-top: 1px solid #dce5f1 !important;
    text-align: center !important;
  }

  .receipt .footer-thanks strong {
    font-size: 9px !important;
  }

  .receipt .footer-thanks p {
    color: #455b78 !important;
    font-size: 8px !important;
  }

  .receipt .footer-thanks small {
    color: #526783 !important;
    font-size: 7px !important;
  }

  .receipt section {
  break-inside: avoid !important;
  page-break-inside: avoid !important;
}

.receipt footer {
  break-inside: auto !important;
  page-break-inside: auto !important;
}

.receipt,
.receipt-page {
  background: #ffffff !important;
  background-color: #ffffff !important;
  color: #142849 !important;
  min-height: 0 !important;
  height: auto !important;
  padding: 0 !important;
}

.receipt .notice-panel {
  margin-bottom: 4mm !important;
}

.receipt .receipt-footer {
  background: #ffffff !important;
  background-color: #ffffff !important;
  color: #142849 !important;
}
}




      `}</style>
      <style jsx global>{`
  @media print {
    @page {
      size: A4 portrait;
      margin: 8mm;
    }

    html,
    body {
      margin: 0 !important;
      padding: 0 !important;
      background: #fff !important;
      color: #142849 !important;
      color-scheme: light !important;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }

    .receipt-page {
      min-height: 0 !important;
      margin: 0 !important;
      padding: 0 !important;
      background: #fff !important;
      color: #142849 !important;
    }

    .receipt-actions,
    .no-print,
    .receipt .topbar {
      display: none !important;
    }

    .receipt,
    .receipt * {
      box-sizing: border-box !important;
      color-scheme: light !important;
      forced-color-adjust: none !important;
      text-shadow: none !important;
      filter: none !important;
      opacity: 1 !important;
    }

    .receipt {
      width: 100% !important;
      max-width: none !important;
      margin: 0 !important;
      padding: 0 !important;
      overflow: visible !important;
      border: 1px solid #cbd8e8 !important;
      border-radius: 0 !important;
      background: #fff !important;
      color: #142849 !important;
      box-shadow: none !important;
      font-family: Arial, Helvetica, sans-serif !important;
      font-size: 10px !important;
      break-inside: auto !important;
      page-break-inside: auto !important;
    }

    .receipt .brand-header,
    .receipt .people-panel,
    .receipt .details-panel,
    .receipt .receipt-footer,
    .receipt .qr-card {
      background: #fff !important;
      color: #142849 !important;
    }

    .receipt .tracking-panel {
      background: #eef5ff !important;
      color: #142849 !important;
    }

    .receipt .route-panel {
      background: #eaf3ff !important;
      color: #142849 !important;
    }

    .receipt .notice-panel {
      background: #edf4ff !important;
      color: #142849 !important;
    }

    .receipt .reference-band {
      background: #061b43 !important;
      color: #fff !important;
    }

    .receipt .reference-band *,
    .receipt .reference-band .eyebrow {
      color: #fff !important;
    }

    .receipt .reference-band .eyebrow {
      color: #b8d5ff !important;
    }

    .receipt .reference-band .reference-status strong {
      color: #54d9b1 !important;
    }

    .receipt .brand-main h1,
    .receipt .tracking-number,
    .receipt .person-name,
    .receipt .route-point strong,
    .receipt .section-heading h2,
    .receipt .detail-value,
    .receipt .footer-brand strong,
    .receipt .footer-thanks strong {
      color: #142849 !important;
    }

    .receipt .brand-logistics,
    .receipt .receipt-heading {
      color: #0752b5 !important;
    }

    .receipt .brand-tagline,
    .receipt .receipt-heading small,
    .receipt .person-subtext,
    .receipt .eyebrow,
    .receipt .detail-label,
    .receipt .section-heading p,
    .receipt .barcode-label,
    .receipt .footer-contact,
    .receipt .footer-brand div span,
    .receipt .footer-thanks p,
    .receipt .footer-thanks small,
    .receipt .notice-panel p {
      color: #455b78 !important;
    }

    .receipt .notice-panel h2 {
      color: #153b70 !important;
    }

    .receipt .brand-mark {
      background: #073ec7 !important;
      color: #fff !important;
    }

    .receipt .number-badge,
    .receipt .details-icon {
      background: #e6f0ff !important;
      color: #0752b5 !important;
    }

    .receipt .route-arrow {
      color: #145be1 !important;
    }

    .receipt .barcode span {
      background: #071b3e !important;
    }

    .receipt .qr-card {
      border: 1px solid #cbd8e8 !important;
    }

    .receipt .qr-card strong {
      color: #0a2c5b !important;
    }

    .receipt .qr-card p {
      color: #455b78 !important;
    }

    .receipt .brand-header {
      padding: 5mm !important;
    }

    .receipt .reference-band {
      padding: 5mm !important;
    }

    .receipt .tracking-panel {
      padding: 5mm !important;
      gap: 4mm !important;
      grid-template-columns: minmax(0, 1fr) 30mm !important;
    }

    .receipt .tracking-number {
      font-size: 24px !important;
    }

    .receipt .qr-card img {
      width: 23mm !important;
      height: 23mm !important;
      max-width: 23mm !important;
    }

    .receipt .people-panel {
      padding: 5mm !important;
      gap: 5mm !important;
    }

    .receipt .route-panel {
      padding: 4mm 5mm !important;
    }

    .receipt .details-panel {
      padding: 5mm !important;
    }

    .receipt .section-heading {
      margin-bottom: 4mm !important;
    }

    .receipt .details-grid {
      gap: 4mm 5mm !important;
    }

    .receipt .detail-value {
      font-size: 10px !important;
    }

    .receipt .notice-panel {
      margin: 0 5mm 4mm !important;
      padding: 4mm !important;
    }

    .receipt .receipt-footer {
      padding: 4mm 5mm !important;
      background: #fff !important;
      color: #142849 !important;
    }

    .receipt .footer-contact {
      margin-top: 3mm !important;
      gap: 2mm 4mm !important;
    }

    .receipt .footer-thanks {
      margin-top: 3mm !important;
      padding-top: 3mm !important;
    }

    .receipt section {
      break-inside: avoid !important;
      page-break-inside: avoid !important;
    }

    .receipt .receipt-footer {
      break-inside: auto !important;
      page-break-inside: auto !important;
    }
  }
`}</style>

    </main>
  );
}

function Detail({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div>
      <div className="detail-label">{label}</div>
      <div className="detail-value">{value}</div>
    </div>
  );
}
