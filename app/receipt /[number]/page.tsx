
"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { supabase } from "@/lib/supabase";

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
  created_at: string;
};

export default function ShipmentReceiptPage() {
  const params = useParams<{ number: string }>();
  const trackingNumber = decodeURIComponent(params.number);

  const [shipment, setShipment] = useState<Shipment | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadShipment() {
      setLoading(true);
      setError("");

      const { data, error } = await supabase
        .from("shipments")
        .select(
          "id, tracking_number, sender_name, receiver_name, recipient, origin, destination, estimated_delivery, status, current_location, created_at"
        )
        .eq("tracking_number", trackingNumber)
        .maybeSingle();

      if (error) {
        setError("Unable to load this shipment receipt.");
      } else if (!data) {
        setError("No shipment was found for this tracking number.");
      } else {
        setShipment(data as Shipment);
      }

      setLoading(false);
    }

    if (trackingNumber) {
      loadShipment();
    }
  }, [trackingNumber]);

  const trackingUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/?number=${encodeURIComponent(trackingNumber)}`
      : "";

  if (loading) {
    return <main style={styles.message}>Loading shipment receipt...</main>;
  }

  if (error || !shipment) {
    return (
      <main style={styles.message}>
        <h2>Receipt unavailable</h2>
        <p>{error || "Shipment not found."}</p>
        <a href="/" style={styles.link}>Return to tracking</a>
      </main>
    );
  }

  return (
    <main style={styles.page}>
      <div style={styles.actions} className="no-print">
        <a href="/" style={styles.back}>← Track another shipment</a>
        <button onClick={() => window.print()} style={styles.button}>
          Print / Save as PDF
        </button>
      </div>

      <article style={styles.receipt}>
        <header style={styles.header}>
          <div>
            <div style={styles.brand}>BESTWAY <span>LOGISTICS</span></div>
            <p style={styles.tagline}>Reliable delivery. Every mile.</p>
          </div>
          <div style={styles.receiptLabel}>
            SHIPMENT
            <br />
            RECEIPT
          </div>
        </header>

        <section style={styles.trackingBox}>
          <div>
            <div style={styles.muted}>TRACKING NUMBER</div>
            <div style={styles.trackingNumber}>{shipment.tracking_number}</div>
            <div style={styles.status}>
              {shipment.status.replace(/[-_]/g, " ")}
            </div>
          </div>

          {trackingUrl && (
            <img
              src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(trackingUrl)}`}
              alt="Scan to open shipment tracking"
              width="120"
              height="120"
              style={styles.qr}
            />
          )}
        </section>

        <section style={styles.section}>
          <h3 style={styles.sectionTitle}>SHIPMENT DETAILS</h3>
          <div style={styles.grid}>
            <Detail label="Sender" value={shipment.sender_name || "Not provided"} />
            <Detail
              label="Recipient"
              value={shipment.receiver_name || shipment.recipient || "Not provided"}
            />
            <Detail label="Origin" value={shipment.origin} />
            <Detail label="Destination" value={shipment.destination} />
            <Detail
              label="Current Location"
              value={shipment.current_location || "Not updated"}
            />
            <Detail
              label="Estimated Delivery"
              value={formatDate(shipment.estimated_delivery)}
            />
            <Detail
              label="Shipment Created"
              value={formatDate(shipment.created_at)}
            />
            <Detail label="Reference" value={shipment.tracking_number} />
          </div>
        </section>

        <footer style={styles.footer}>
          <strong>Thank you for choosing Bestway Logistics.</strong>
          <p>
            Scan the QR code to open the shipment tracking page.
          </p>
          <p style={styles.disclaimer}>
            This document confirms shipment details. It is not proof of payment.
          </p>
          <a href={trackingUrl} style={styles.link} className="no-print">
            Open tracking page
          </a>
        </footer>
      </article>

      <style jsx global>{`
        body {
          margin: 0;
          background: #f0f4f8;
          font-family: Arial, Helvetica, sans-serif;
        }
        @media print {
          body {
            background: white !important;
          }
          .no-print {
            display: none !important;
          }
          main {
            padding: 0 !important;
          }
          article {
            box-shadow: none !important;
            border: none !important;
            max-width: 100% !important;
          }
          @page {
            size: A4;
            margin: 15mm;
          }
        }
      `}</style>
    </main>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div style={styles.detail}>
      <div style={styles.muted}>{label}</div>
      <div style={styles.value}>{value}</div>
    </div>
  );
}

function formatDate(value: string | null) {
  if (!value) return "Not provided";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return date.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

const styles: Record<string, React.CSSProperties> = {
  page: {
    minHeight: "100vh",
    padding: "24px 16px 48px",
    background: "#f0f4f8",
    color: "#17243b",
  },
  actions: {
    maxWidth: "760px",
    margin: "0 auto 18px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "12px",
    flexWrap: "wrap",
  },
  back: {
    color: "#173e78",
    textDecoration: "none",
    fontSize: "14px",
  },
  button: {
    border: 0,
    borderRadius: "8px",
    background: "#1769e0",
    color: "white",
    padding: "12px 16px",
    fontWeight: 700,
    cursor: "pointer",
  },
  receipt: {
    maxWidth: "760px",
    margin: "0 auto",
    background: "white",
    border: "1px solid #dce4ee",
    borderRadius: "14px",
    overflow: "hidden",
    boxShadow: "0 12px 36px rgba(20, 40, 70, 0.08)",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "16px",
    padding: "26px",
    borderBottom: "3px solid #1769e0",
  },
  brand: {
    fontSize: "22px",
    fontWeight: 900,
    letterSpacing: "1px",
    color: "#10264a",
  },
  tagline: {
    margin: "6px 0 0",
    fontSize: "12px",
    color: "#66758b",
  },
  receiptLabel: {
    textAlign: "right",
    color: "#1769e0",
    fontSize: "14px",
    lineHeight: 1.5,
    fontWeight: 800,
    letterSpacing: "1px",
  },
  trackingBox: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "20px",
    padding: "24px 26px",
    background: "#f5f8fd",
    borderBottom: "1px solid #e3eaf3",
  },
  muted: {
    fontSize: "10px",
    fontWeight: 800,
    letterSpacing: "1px",
    color: "#75839a",
    textTransform: "uppercase",
    marginBottom: "7px",
  },
  trackingNumber: {
    fontSize: "23px",
    fontWeight: 900,
    color: "#10264a",
    overflowWrap: "anywhere",
  },
  status: {
    display: "inline-block",
    marginTop: "10px",
    padding: "6px 10px",
    borderRadius: "20px",
    background: "#e3edff",
    color: "#174e9b",
    fontSize: "12px",
    fontWeight: 700,
    textTransform: "capitalize",
  },
  qr: {
    width: "120px",
    height: "120px",
    objectFit: "contain",
    flexShrink: 0,
  },
  section: {
    padding: "24px 26px",
  },
  sectionTitle: {
    margin: "0 0 18px",
    color: "#173e78",
    fontSize: "12px",
    letterSpacing: "1px",
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
    gap: "22px 18px",
  },
  detail: {
    minWidth: 0,
    overflowWrap: "anywhere",
  },
  value: {
    fontSize: "14px",
    fontWeight: 600,
    lineHeight: 1.5,
    color: "#25344c",
  },
  footer: {
    borderTop: "1px solid #e3eaf3",
    padding: "22px 26px",
    textAlign: "center",
    fontSize: "13px",
    color: "#53647c",
  },
  disclaimer: {
    fontSize: "11px",
    color: "#7b8798",
    marginTop: "14px",
  },
  link: {
    color: "#1769e0",
    textDecoration: "none",
    fontWeight: 700,
  },
  message: {
    padding: "60px 20px",
    textAlign: "center",
    fontFamily: "Arial, sans-serif",
    color: "#17243b",
  },
};
