
'use client';

import { useEffect, useMemo, useState } from 'react';
import { supabase } from '../../lib/supabase';

type Shipment = {
  id: string;
  tracking_number: string;
  sender_name: string | null;
  receiver_name: string | null;
  recipient?: string | null;
  recipient_email?: string | null;
  origin: string;
  destination: string;
  estimated_delivery: string | null;
  status: string;
  current_location: string | null;
  created_at: string;
};

const shipmentStatuses = [
  'Pending',
  'Processing',
  'In Transit',
  'Out for Delivery',
  'Delivered',
];

async function recordShipmentEvent(
  shipmentId: string,
  status: string,
  location: string | null,
  description: string
) {
  const { error } = await supabase.from('shipment_events').insert({
    shipment_id: shipmentId,
    status,
    location,
    description,
    event_time: new Date().toISOString(),
  });

  if (error) {
    throw new Error(error.message);
  }
}

export default function AdminDashboard() {
  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [trackingNumber, setTrackingNumber] = useState('');
  const [senderName, setSenderName] = useState('');
  const [receiverName, setReceiverName] = useState('');
  const [recipientEmail, setRecipientEmail] = useState('');
  const [origin, setOrigin] = useState('');
  const [destination, setDestination] = useState('');
  const [location, setLocation] = useState('');
  const [estimatedDelivery, setEstimatedDelivery] = useState('');
  const [status, setStatus] = useState('Pending');

  const [statusDrafts, setStatusDrafts] = useState<Record<string, string>>({});
  const [locationDrafts, setLocationDrafts] = useState<Record<string, string>>({});
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [message, setMessage] = useState('Loading shipments...');
  const [loading, setLoading] = useState(false);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  async function loadShipments() {
    const { data, error } = await supabase
      .from('shipments')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      setMessage('Could not load shipments: ' + error.message);
      return;
    }

    const rows = (data ?? []) as Shipment[];
    setShipments(rows);

    setStatusDrafts((previous) => {
      const next = { ...previous };
      for (const shipment of rows) {
        if (!(shipment.id in next)) next[shipment.id] = shipment.status;
      }
      return next;
    });

    setLocationDrafts((previous) => {
      const next = { ...previous };
      for (const shipment of rows) {
        if (!(shipment.id in next)) {
          next[shipment.id] = shipment.current_location || '';
        }
      }
      return next;
    });

    setMessage('');
  }

  useEffect(() => {
    async function checkAdmin() {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        window.location.href = '/admin/login';
        return;
      }

      await loadShipments();
    }

    checkAdmin();
  }, []);

  const filteredShipments = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();

    return shipments.filter((shipment) => {
      const matchesSearch =
        !query ||
        [
          shipment.tracking_number,
          shipment.sender_name,
          shipment.receiver_name,
          shipment.recipient,
          shipment.recipient_email,
          shipment.origin,
          shipment.destination,
          shipment.current_location,
        ].some((value) => (value ?? '').toLowerCase().includes(query));

      const matchesStatus =
        statusFilter === 'All' ||
        shipment.status.toLowerCase() === statusFilter.toLowerCase();

      return matchesSearch && matchesStatus;
    });
  }, [shipments, searchTerm, statusFilter]);

  async function addShipment(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    const { data, error } = await supabase
      .from('shipments')
      .insert({
        tracking_number: trackingNumber.trim(),
        sender_name: senderName.trim(),
        receiver_name: receiverName.trim(),
        recipient: receiverName.trim(),
        recipient_email: recipientEmail.trim() || null,
        origin: origin.trim(),
        destination: destination.trim(),
        estimated_delivery: estimatedDelivery || null,
        status,
        current_location: location.trim(),
      })
      .select()
      .single();

    if (error || !data) {
      setLoading(false);
      setMessage(
        'Could not add shipment: ' +
          (error?.message || 'No shipment returned.')
      );
      return;
    }

    let successMessage = 'Shipment added and initial activity recorded.';

    try {
      await recordShipmentEvent(
        data.id,
        status,
        location.trim(),
        `Shipment created for delivery from ${origin.trim()} to ${destination.trim()}.`
      );
    } catch (eventError) {
      const details =
        eventError instanceof Error ? eventError.message : 'Unknown error';

      successMessage =
        `Shipment was created, but its activity could not be recorded: ${details}.`;
    }

    setTrackingNumber('');
    setSenderName('');
    setReceiverName('');
    setRecipientEmail('');
    setLocation('');
    setOrigin('');
    setDestination('');
    setEstimatedDelivery('');
    setStatus('Pending');
    await loadShipments();
    setMessage(successMessage);
    setLoading(false);
  }

  async function saveShipmentUpdate(shipment: Shipment) {
    const nextStatus = statusDrafts[shipment.id] ?? shipment.status;
    const nextLocation = (
      locationDrafts[shipment.id] ?? shipment.current_location ?? ''
    ).trim();

    const oldLocation = (shipment.current_location || '').trim();
    const statusChanged = nextStatus !== shipment.status;
    const locationChanged = nextLocation !== oldLocation;

    if (!statusChanged && !locationChanged) {
      setMessage('No status or location changes to save.');
      return;
    }

    setSavingId(shipment.id);
    setMessage('');

    const { error } = await supabase
      .from('shipments')
      .update({
        status: nextStatus,
        current_location: nextLocation,
      })
      .eq('id', shipment.id);

    if (error) {
      setSavingId(null);
      setMessage('Could not update shipment: ' + error.message);
      return;
    }

    const changes: string[] = [];

    if (statusChanged) {
      changes.push(
        `Status changed from ${shipment.status} to ${nextStatus}`
      );
    }

    if (locationChanged) {
      changes.push(
        `Location changed from ${oldLocation || 'Unknown'} to ${nextLocation || 'Unknown'}`
      );
    }

    let resultMessage =
      'Shipment updated and one activity entry recorded.';

    try {
      await recordShipmentEvent(
        shipment.id,
        nextStatus,
        nextLocation || null,
        changes.join('. ') + '.'
      );
    } catch (eventError) {
      const details =
        eventError instanceof Error ? eventError.message : 'Unknown error';

      resultMessage =
        `Shipment updated, but its activity entry failed: ${details}.`;
    }

if (statusChanged) {
  if (!shipment.recipient_email?.trim()) {
    resultMessage +=
      ' No email sent: recipient email is missing.';
  } else {
    try {
      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession();

      if (sessionError || !session?.access_token) {
        throw new Error('Admin session could not be verified.');
      }

      const response = await fetch(
        '/api/notifications/shipment-status',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({
            recipientEmail: shipment.recipient_email.trim(),
            trackingNumber: shipment.tracking_number,
            status: nextStatus,
            currentLocation: nextLocation,
            destination: shipment.destination,
            estimatedDelivery: shipment.estimated_delivery || '',
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(
          errorData?.error || 'Email notification failed.'
        );
      }

      resultMessage += ' Customer notification request accepted.';
    } catch (emailError) {
      const details =
        emailError instanceof Error
          ? emailError.message
          : 'Unknown email error';

      resultMessage += ` Customer email failed: ${details}.`;
    }
  }
}
    await loadShipments();
    setSavingId(null);
    setMessage(resultMessage);
  }

  async function editShipment(shipment: Shipment) {
    const newDestination = prompt(
      'Enter the new destination:',
      shipment.destination
    );

    if (newDestination === null || !newDestination.trim()) return;

    const newEstimatedDelivery = prompt(
      'Enter estimated delivery date (YYYY-MM-DD), or leave blank:',
      shipment.estimated_delivery || ''
    );

    if (newEstimatedDelivery === null) return;

    const destinationChanged =
      newDestination.trim() !== shipment.destination;

    const newDate = newEstimatedDelivery.trim() || null;
    const dateChanged = newDate !== shipment.estimated_delivery;

    if (!destinationChanged && !dateChanged) {
      setMessage('No destination or delivery date changes to save.');
      return;
    }

    const { error } = await supabase
      .from('shipments')
      .update({
        destination: newDestination.trim(),
        estimated_delivery: newDate,
      })
      .eq('id', shipment.id);

    if (error) {
      setMessage('Could not edit shipment: ' + error.message);
      return;
    }

    if (destinationChanged) {
      try {
        await recordShipmentEvent(
          shipment.id,
          shipment.status,
          shipment.current_location,
          `Destination changed from ${shipment.destination} to ${newDestination.trim()}.`
        );
      } catch (eventError) {
        const details =
          eventError instanceof Error ? eventError.message : 'Unknown error';

        await loadShipments();
        setMessage(
          `Shipment details updated, but activity recording failed: ${details}.`
        );
        return;
      }
    }

    await loadShipments();
    setMessage('Shipment details updated successfully.');
  }

  async function deleteShipment(shipment: Shipment) {
    const confirmed = window.confirm(
      `Delete shipment ${shipment.tracking_number} permanently? This cannot be undone.`
    );

    if (!confirmed) return;

    setDeletingId(shipment.id);
    setMessage('');

    const { error } = await supabase
      .from('shipments')
      .delete()
      .eq('id', shipment.id);

    setDeletingId(null);

    if (error) {
      setMessage('Could not delete shipment: ' + error.message);
      return;
    }

    setStatusDrafts((previous) => {
      const next = { ...previous };
      delete next[shipment.id];
      return next;
    });

    setLocationDrafts((previous) => {
      const next = { ...previous };
      delete next[shipment.id];
      return next;
    });

    await loadShipments();
    setMessage(`Shipment ${shipment.tracking_number} deleted successfully.`);
  }

  return (
    <main className="min-h-screen p-6">
      <div className="panel w-full max-w-3xl mx-auto">
        <h1>Bestway Logistics Dashboard</h1>
        <p className="muted">
          Add shipments and update their status and location together.
        </p>

        <form onSubmit={addShipment} className="mt-6 flex flex-col gap-3">
          <label htmlFor="tracking">Tracking number</label>
          <input
            id="tracking"
            value={trackingNumber}
            onChange={(e) => setTrackingNumber(e.target.value)}
            placeholder="e.g. BW100001"
            required
          />

          <label htmlFor="sender">Sender name</label>
          <input
            id="sender"
            value={senderName}
            onChange={(e) => setSenderName(e.target.value)}
            placeholder="Sender name"
            required
          />

          <label htmlFor="receiver">Receiver name</label>
          <input
            id="receiver"
            value={receiverName}
            onChange={(e) => setReceiverName(e.target.value)}
            placeholder="Receiver name"
            required
          />

          <label htmlFor="recipientEmail">Recipient email address</label>
          <input
            id="recipientEmail"
            type="email"
            value={recipientEmail}
            onChange={(e) => setRecipientEmail(e.target.value)}
            placeholder="customer@example.com"
            autoComplete="email"
          />
          <p className="muted">
            Add an email address so shipment status notifications can be sent
            when email delivery is configured.
          </p>

          <label htmlFor="origin">Origin</label>
          <input
            id="origin"
            value={origin}
            onChange={(e) => setOrigin(e.target.value)}
            placeholder="e.g. Lagos, Nigeria"
            required
          />

          <label htmlFor="destination">Destination</label>
          <input
            id="destination"
            value={destination}
            onChange={(e) => setDestination(e.target.value)}
            placeholder="e.g. New York, USA"
            required
          />

          <label htmlFor="location">Current location</label>
          <input
            id="location"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="e.g. London, UK"
            required
          />

          <label htmlFor="estimatedDelivery">Estimated Delivery Date</label>
          <input
            type="date"
            id="estimatedDelivery"
            value={estimatedDelivery}
            onChange={(e) => setEstimatedDelivery(e.target.value)}
          />

          <label htmlFor="status">Shipment status</label>
          <select
            id="status"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
          >
            {shipmentStatuses.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>

          <button className="button mt-3" type="submit" disabled={loading}>
            {loading ? 'Adding...' : 'Add Shipment'}
          </button>
        </form>

        {message && (
          <p className="mt-4" role="status" aria-live="polite">
            {message}
          </p>
        )}

        <section className="mt-8">
          <h2>Find Shipments</h2>
          <p className="muted">
            Search by tracking number, sender, recipient, email, origin,
            destination, or current location.
          </p>

          <label htmlFor="shipment-search">Search shipments</label>
          <input
            id="shipment-search"
            type="search"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="e.g. BW100005 or customer@example.com"
          />

          <label htmlFor="status-filter" className="block mt-4">
            Filter by status
          </label>
          <select
            id="status-filter"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="All">All statuses</option>
            {shipmentStatuses.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>

          <p className="mt-4" aria-live="polite">
            Showing <strong>{filteredShipments.length}</strong> of{' '}
            <strong>{shipments.length}</strong> shipments
          </p>
        </section>

        <h2 className="mt-8">All Shipments ({shipments.length})</h2>

        {filteredShipments.length === 0 ? (
          <div className="panel mt-4">
            <p>No shipments match your search or selected status.</p>
            <button
              type="button"
              className="button mt-3"
              onClick={() => {
                setSearchTerm('');
                setStatusFilter('All');
              }}
            >
              Clear Search and Filters
            </button>
          </div>
        ) : (
          filteredShipments.map((shipment) => (
            <div key={shipment.id} className="panel mt-4">
              <p>
                <strong>Tracking:</strong> {shipment.tracking_number}
              </p>
              <p>
                <strong>Sender:</strong>{' '}
                {shipment.sender_name || 'Not available'}
              </p>
              <p>
                <strong>Receiver:</strong>{' '}
                {shipment.receiver_name ||
                  shipment.recipient ||
                  'Not available'}
              </p>
              <p>
                <strong>Recipient Email:</strong>{' '}
                {shipment.recipient_email || 'Not provided'}
              </p>
              <p>
                <strong>Origin:</strong> {shipment.origin}
              </p>
              <p>
                <strong>Destination:</strong> {shipment.destination}
              </p>
              <p>
                <strong>Current Location:</strong>{' '}
                {shipment.current_location || 'Not yet updated'}
              </p>
              <p>
                <strong>Estimated Delivery:</strong>{' '}
                {shipment.estimated_delivery
                  ? new Date(
                      `${shipment.estimated_delivery.slice(0, 10)}T12:00:00`
                    ).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })
                  : 'Not yet scheduled'}
              </p>
              <p>
                <strong>Status:</strong> {shipment.status}
              </p>

              <div className="mt-4">
                <h3>Update Status &amp; Location</h3>
                <p className="muted">
                  Choose the new status and current location, then save both
                  changes together. One activity entry will describe the
                  changes.
                </p>

                <label htmlFor={`status-${shipment.id}`}>
                  New shipment status
                </label>
                <select
                  id={`status-${shipment.id}`}
                  value={statusDrafts[shipment.id] ?? shipment.status}
                  onChange={(e) =>
                    setStatusDrafts((previous) => ({
                      ...previous,
                      [shipment.id]: e.target.value,
                    }))
                  }
                >
                  {shipmentStatuses.map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
                </select>

                <label
                  htmlFor={`location-${shipment.id}`}
                  className="block mt-3"
                >
                  Current location
                </label>
                <input
                  id={`location-${shipment.id}`}
                  value={
                    locationDrafts[shipment.id] ??
                    shipment.current_location ??
                    ''
                  }
                  onChange={(e) =>
                    setLocationDrafts((previous) => ({
                      ...previous,
                      [shipment.id]: e.target.value,
                    }))
                  }
                  placeholder="Enter current shipment location"
                />

                <button
                  type="button"
                  className="button mt-3"
                  disabled={savingId === shipment.id}
                  onClick={() => saveShipmentUpdate(shipment)}
                >
                  {savingId === shipment.id
                    ? 'Saving Update...'
                    : 'Save Status & Location'}
                </button>
              </div>

              <div className="mt-3 flex flex-wrap gap-2">
                <button
                  type="button"
                  className="button"
                  onClick={() => editShipment(shipment)}
                >
                  Edit Destination / Delivery Date
                </button>

                <button
                  type="button"
                  className="button"
                  style={{ backgroundColor: '#b91c1c' }}
                  disabled={deletingId === shipment.id}
                  onClick={() => deleteShipment(shipment)}
                >
                  {deletingId === shipment.id
                    ? 'Deleting...'
                    : 'Delete Shipment'}
                </button>
              </div>
            </div>
          ))
        )}

        <p className="mt-6">
          <a href="/">Back to shipment tracking</a>
        </p>
      </div>
    </main>
  );
}
