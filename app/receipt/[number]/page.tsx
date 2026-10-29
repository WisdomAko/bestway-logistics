
"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { supabase } from "../../../lib/supabase";

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
  const [issuedDate, setIssuedDate] = useState("");

  useEffect(() => {
    setIssuedDate(formatDate(new Date().toISOString()));

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
    } else {
      setError("A tracking number is required.");
      setLoading(false);
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
        <a href="/" style={styles.back}>
          ← Track another shipment
        </a>

        <button
          onClick={() => window.print()}
          style={styles.button}
        >
          Print / Save as PDF
        </button>
      </div>

      <article style={styles.receipt}>
        <header style={styles.header}>
          <div style={styles.brandGroup}>
            <div style={styles.logoMark}>B</div>
            <div>
              <div style={styles.brand}>BESTWAY</div>
              <div style={styles.brandSubtitle}>LOGISTICS</div>
              <p style={styles.tagline}>
                LOGISTICS WITHOUT BOUNDARIES
              </p>
            </div>
          </div>

          <div style={styles.receiptHeading}>
            <span style={styles.receiptHeadingSmall}>SHIPMENT</span>
            <strong>RECEIPT</strong>
            <span style={styles.issuedDate}>
              ISSUED {issuedDate || "—"}
            </span>
          </div>
        </header>

        <section style={styles.receiptBar}>
          <div>
            <div style={styles.barLabel}>RECEIPT REFERENCE</div>
            <div style={styles.receiptNumber}>
              {shipment.tracking_number}
            </div>
          </div>

          <div style={styles.barDivider} />

          <div style={styles.statusBlock}>
            <span style={styles.statusDot} />
            <div>
              <strong style={styles.statusTitle}>
                {shipment.status.replace(/[-_]/g, " ")}
              </strong>
              <span style={styles.statusCaption}>
                Latest recorded shipment status
              </span>
            </div>
          </div>
        </section>

        <section style={styles.trackingSection}>
          <div style={styles.trackingDetails}>
            <div style={styles.eyebrow}>TRACKING NUMBER</div>
            <div style={styles.trackingNumber}>
              {shipment.tracking_number}
            </div>

            <div style={styles.barcode} aria-label="Tracking reference barcode">
              {Array.from({ length: 42 }, (_, i) => (
                <span
                  key={i}
                  style={{
                    ...styles.bar,
                    width: i % 5 === 0 ? "4px" : i % 3 === 0 ? "2px" : "3px",
                    marginRight: i % 4 === 0 ? "2px" : "1px",
                  }}
                />
              ))}
            </div>

            <div style={styles.barcodeText}>
              {shipment.tracking_number}
            </div>
          </div>

          <div style={styles.qrPanel}>
            {trackingUrl && (
              <img
                src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(trackingUrl)}`}
                alt="QR code for shipment tracking"
                width="132"
                height="132"
                style={styles.qr}
              />
            )}
            <strong style={styles.qrTitle}>SCAN TO TRACK</strong>
            <span style={styles.qrCaption}>
              Scan to open the shipment tracking page.
            </span>
          </div>
        </section>

        <section style={styles.peopleGrid}>
          <div style={styles.infoPanel}>
            <div style={styles.panelHeading}>
              <span style={styles.panelIcon}>01</span>
              <h2 style={styles.panelTitle}>SHIPPER / SENDER</h2>
            </div>
            <div style={styles.personName}>
              {shipment.sender_name || "Not provided"}
            </div>
            <Detail
              label="ORIGIN"
              value={shipment.origin || "Not provided"}
            />
          </div>

          <div style={styles.infoPanel}>
            <div style={styles.panelHeading}>
              <span style={styles.panelIcon}>02</span>
              <h2 style={styles.panelTitle}>RECIPIENT</h2>
            </div>
            <div style={styles.personName}>
              {shipment.receiver_name || shipment.recipient || "Not provided"}
            </div>
            <Detail
              label="DESTINATION"
              value={shipment.destination || "Not provided"}
            />
          </div>
        </section>

        <section style={styles.routeSection}>
          <div style={styles.routePoint}>
            <span style={styles.routeLabel}>ORIGIN</span>
            <strong>{shipment.origin || "Not provided"}</strong>
          </div>

          <div style={styles.routeArrow} aria-hidden="true">→</div>

          <div style={styles.routePoint}>
            <span style={styles.routeLabel}>DESTINATION</span>
            <strong>{shipment.destination || "Not provided"}</strong>
          </div>
        </section>

        <section style={styles.detailsSection}>
          <div style={styles.sectionHeading}>
            <div style={styles.sectionIcon}>▣</div>
            <div>
              <h2 style={styles.sectionTitle}>SHIPMENT DETAILS</h2>
              <p style={styles.sectionSubtitle}>
                Recorded information for this shipment
              </p>
            </div>
          </div>

          <div style={styles.detailsGrid}>
            <Detail
              label="TRACKING REFERENCE"
              value={shipment.tracking_number}
            />
            <Detail
              label="CURRENT STATUS"
              value={shipment.status.replace(/[-_]/g, " ")}
            />
            <Detail
              label="CURRENT LOCATION"
              value={shipment.current_location || "Not yet updated"}
            />
            <Detail
              label="ESTIMATED DELIVERY DATE"
              value={formatDate(shipment.estimated_delivery)}
            />
            <Detail
              label="DATE SHIPMENT CREATED"
              value={formatDate(shipment.created_at)}
            />
            <Detail
              label="DATE RECEIPT ISSUED"
              value={issuedDate || "—"}
            />
          </div>
        </section>

        <section style={styles.notice}>
          <strong>IMPORTANT INFORMATION</strong>
          <p>
            Estimated delivery dates are provided for guidance and may
            change as the shipment progresses. Please use the tracking
            number or QR code to check the latest recorded status.
          </p>
        </section>

        <footer style={styles.footer}>
          <div style={styles.footerBrand}>
  <div style={styles.footerLogo}>B</div>

  <div style={styles.footerBrandText}>
    <strong>BESTWAY LOGISTICS</strong>
    <span>LOGISTICS WITHOUT BOUNDARIES</span>
  </div>
</div>

          <div style={styles.footerMessage}>
            <strong>Thank you for choosing Bestway Logistics.</strong>
            <p>Reliable service. Shipment visibility. Global connections.</p>
          </div>

          <p style={styles.disclaimer}>
            This document confirms recorded shipment details. It is not
            proof of payment.
          </p>

          <a
            href={trackingUrl}
            style={styles.link}
            className="no-print"
          >
            Open tracking page
          </a>
        </footer>
      </article>

      <style jsx global>{`
        * {
          box-sizing: border-box;
        }

        body {
          margin: 0;
          background: #edf2f9;
          font-family: Arial, Helvetica, sans-serif;
        }

        @media (max-width: 520px) {
          .receipt-people {
            grid-template-columns: 1fr;
          }
        }



@media print {
  html,
  body {
    background: #ffffff !important;
    color: #142849 !important;
    color-scheme: light !important;
    margin: 0 !important;
    -webkit-print-color-adjust: economy !important;
    print-color-adjust: economy !important;
  }

  .no-print {
    display: none !important;
  }

  main {
    background: #ffffff !important;
    color: #142849 !important;
    padding: 0 !important;
    min-height: 0 !important;
  }

  article {
    width: 100% !important;
    max-width: 100% !important;
    margin: 0 !important;
    background: #ffffff !important;
    color: #142849 !important;
    border: 1px solid #dce5f1 !important;
    border-radius: 0 !important;
    box-shadow: none !important;
    font-size: 9px !important;
  }

  article header,
  article section,
  article footer {
    padding: 8px 12px !important;
    break-inside: avoid;
    page-break-inside: avoid;
  }

  article header,
  article .trackingSection {
    background: #ffffff !important;
  }

  article h2,
  article h3,
  article p {
    margin-top: 3px !important;
    margin-bottom: 3px !important;
  }

  article img {
    width: 85px !important;
    height: 85px !important;
  }

  article footer {
    padding: 6px 10px !important;
    break-inside: avoid;
    page-break-inside: avoid;
  }

  article footer p {
    margin: 3px 0 !important;
  }

  @page {
    size: A4;
    margin: 5mm;
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
    <div style={styles.detail}>
      <div style={styles.detailLabel}>{label}</div>
      <div style={styles.detailValue}>{value}</div>
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
    background: "#edf2f9",
    color: "#142849",
  },
  actions: {
    maxWidth: "850px",
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
    fontWeight: 600,
  },
  button: {
    border: 0,
    borderRadius: "8px",
    background: "#1769e0",
    color: "#fff",
    padding: "13px 17px",
    fontWeight: 800,
    cursor: "pointer",
  },
  receipt: {
    maxWidth: "850px",
    margin: "0 auto",
    background: "#fff",
    border: "1px solid #dce5f1",
    borderRadius: "14px",
    overflow: "hidden",
    boxShadow: "0 14px 40px rgba(17, 39, 75, 0.10)",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "18px",
    padding: "28px",
    background: "#fff",
    borderBottom: "4px solid #1769e0",
    flexWrap: "wrap",
  },
  brandGroup: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
  },
  logoMark: {
    width: "54px",
    height: "54px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "#123fae",
    color: "#fff",
    borderRadius: "12px",
    fontSize: "34px",
    fontWeight: 900,
    fontStyle: "italic",
  },
  brand: {
    fontSize: "27px",
    lineHeight: 1,
    fontWeight: 900,
    letterSpacing: "-0.7px",
    color: "#10264a",
  },
  brandSubtitle: {
    fontSize: "13px",
    letterSpacing: "5px",
    fontWeight: 800,
    color: "#1769e0",
    marginTop: "5px",
  },
  tagline: {
    margin: "9px 0 0",
    fontSize: "9px",
    letterSpacing: "2px",
    fontWeight: 800,
    color: "#62738d",
  },
  receiptHeading: {
    display: "flex",
    flexDirection: "column",
    alignItems: "flex-end",
    gap: "4px",
    color: "#1769e0",
  },
  receiptHeadingSmall: {
    fontSize: "12px",
    fontWeight: 800,
    letterSpacing: "2px",
  },
  issuedDate: {
    fontSize: "10px",
    color: "#6c7a90",
    marginTop: "7px",
    textAlign: "right",
  },
  receiptBar: {
    display: "flex",
    alignItems: "center",
    gap: "22px",
    padding: "22px 28px",
    background: "#071d3b",
    color: "#fff",
    flexWrap: "wrap",
  },
  barLabel: {
    fontSize: "10px",
    fontWeight: 800,
    letterSpacing: "1.5px",
    color: "#8ec5ff",
    marginBottom: "7px",
  },
  receiptNumber: {
    fontSize: "22px",
    fontWeight: 900,
    overflowWrap: "anywhere",
  },
  barDivider: {
    width: "1px",
    height: "52px",
    background: "#49617f",
  },
  statusBlock: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    marginLeft: "auto",
  },
  statusDot: {
    width: "12px",
    height: "12px",
    borderRadius: "50%",
    background: "#42d7ad",
    flexShrink: 0,
  },
  statusTitle: {
    display: "block",
    color: "#6fe3be",
    fontSize: "14px",
    textTransform: "capitalize",
    overflowWrap: "anywhere",
  },
  statusCaption: {
    display: "block",
    color: "#c4d2e6",
    fontSize: "10px",
    marginTop: "5px",
  },
  trackingSection: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "24px",
    padding: "28px",
    background: "#f0f6ff",
    borderBottom: "1px solid #dbe6f5",
    flexWrap: "wrap",
  },
  trackingDetails: {
    flex: "1 1 240px",
    minWidth: 0,
  },
  eyebrow: {
    fontSize: "11px",
    fontWeight: 900,
    letterSpacing: "1.5px",
    color: "#496181",
    marginBottom: "9px",
  },
  trackingNumber: {
    fontSize: "clamp(25px, 5vw, 39px)",
    fontWeight: 900,
    letterSpacing: "-0.7px",
    color: "#081b3b",
    overflowWrap: "anywhere",
  },
  barcode: {
    display: "flex",
    alignItems: "stretch",
    height: "42px",
    marginTop: "14px",
    maxWidth: "300px",
    overflow: "hidden",
  },
  bar: {
    display: "inline-block",
    height: "100%",
    background: "#07172d",
    flexShrink: 0,
  },
  barcodeText: {
    fontSize: "11px",
    letterSpacing: "3px",
    color: "#263c5c",
    marginTop: "5px",
  },
  qrPanel: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "8px",
    width: "180px",
    padding: "12px",
    background: "#fff",
    border: "1px solid #dce6f4",
    borderRadius: "10px",
    flexShrink: 0,
  },
  qr: {
    display: "block",
    width: "132px",
    height: "132px",
    objectFit: "contain",
  },
  qrTitle: {
    color: "#12366a",
    fontSize: "12px",
    letterSpacing: "0.5px",
  },
  qrCaption: {
    fontSize: "10px",
    lineHeight: 1.5,
    color: "#6c7b91",
    textAlign: "center",
  },
  peopleGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
    gap: "0",
    borderBottom: "1px solid #dce6f4",
  },
  infoPanel: {
    padding: "24px 26px",
    minWidth: 0,
  },
  panelHeading: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    marginBottom: "18px",
  },
  panelIcon: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    width: "30px",
    height: "30px",
    borderRadius: "8px",
    background: "#e8f1ff",
    color: "#1769e0",
    fontSize: "10px",
    fontWeight: 900,
    flexShrink: 0,
  },
  panelTitle: {
    fontSize: "12px",
    letterSpacing: "1px",
    margin: 0,
    color: "#173e78",
  },
  personName: {
    fontSize: "19px",
    fontWeight: 800,
    lineHeight: 1.4,
    color: "#10264a",
    marginBottom: "20px",
    overflowWrap: "anywhere",
  },
  routeSection: {
    display: "grid",
    gridTemplateColumns: "1fr auto 1fr",
    alignItems: "center",
    gap: "16px",
    padding: "20px 26px",
    background: "#eaf3ff",
    borderBottom: "1px solid #dce6f4",
  },
  routePoint: {
    display: "flex",
    flexDirection: "column",
    gap: "6px",
    minWidth: 0,
  },
  routeLabel: {
    fontSize: "10px",
    fontWeight: 900,
    letterSpacing: "1px",
    color: "#5b7190",
  },
  routeArrow: {
    color: "#1769e0",
    fontSize: "27px",
    fontWeight: 900,
  },
  detailsSection: {
    padding: "26px",
  },
  sectionHeading: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    marginBottom: "24px",
  },
  sectionIcon: {
    width: "38px",
    height: "38px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "#e8f1ff",
    color: "#1769e0",
    borderRadius: "9px",
    fontSize: "24px",
  },
  sectionTitle: {
    margin: 0,
    fontSize: "13px",
    fontWeight: 900,
    letterSpacing: "1px",
    color: "#12366a",
  },
  sectionSubtitle: {
    margin: "5px 0 0",
    fontSize: "11px",
    color: "#6c7b91",
  },
  detailsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
    gap: "25px 22px",
  },
  detail: {
    minWidth: 0,
    overflowWrap: "anywhere",
  },
  detailLabel: {
    fontSize: "10px",
    fontWeight: 900,
    letterSpacing: "0.9px",
    color: "#72819a",
    marginBottom: "8px",
  },
  detailValue: {
    fontSize: "14px",
    fontWeight: 700,
    lineHeight: 1.5,
    color: "#1c304d",
    textTransform: "capitalize",
    overflowWrap: "anywhere",
  },
  notice: {
    margin: "0 26px 26px",
    padding: "17px 19px",
    background: "#f1f6fd",
    borderLeft: "4px solid #1769e0",
    borderRadius: "4px",
    color: "#354b69",
  },
  footer: {
    borderTop: "1px solid #dce6f4",
    padding: "23px 26px",
    background: "#f7faff",
    textAlign: "center",
    color: "#52647e",
  },
  footerBrand: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "10px",
    marginBottom: "20px",
    textAlign: "left",
  },
    footerBrandText: {
    display: "flex",
    flexDirection: "column",
    gap: "3px",
    lineHeight: 1.5,
  },
  footerLogo: {
    width: "39px",
    height: "39px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "#123fae",
    borderRadius: "9px",
    color: "#fff",
    fontWeight: 900,
    fontSize: "25px",
    fontStyle: "italic",
  },
  footerMessage: {
    borderTop: "1px solid #dce6f4",
    paddingTop: "18px",
    fontSize: "14px",
    color: "#173e78",
  },
  disclaimer: {
    fontSize: "10px",
    lineHeight: 1.6,
    color: "#77869b",
    margin: "17px 0",
  },
  link: {
    color: "#1769e0",
    textDecoration: "none",
    fontWeight: 800,
  },
  message: {
    padding: "60px 20px",
    textAlign: "center",
    fontFamily: "Arial, sans-serif",
    color: "#17243b",
  },
};
