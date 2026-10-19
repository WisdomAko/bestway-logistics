
'use client';

import { useEffect, useMemo, useState } from 'react';
import { supabase } from '../../lib/supabase';

type Shipment = {
  id: string;
  tracking_number: string;
  sender_name: string | null;
  receiver_name: string | null;
  recipient?: string | null;
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

export default function AdminDashboard() {
  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [trackingNumber, setTrackingNumber] = useState('');
  const [senderName, setSenderName] = useState('');
  const [receiverName, setReceiverName] = useState('');
  const [origin, setOrigin] = useState('');
  const [destination, setDestination] = useState('');
  const [location, setLocation] = useState('');
  const [estimatedDelivery, setEstimatedDelivery] = useState('');
  const [status, setStatus] = useState('Pending');

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');

  const [message, setMessage] = useState('Loading shipments...');
  const [loading, setLoading] = useState(false);
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

    setShipments((data ?? []) as Shipment[]);
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
          shipment.origin,
          shipment.destination,
          shipment.current_location,
        ].some((value) =>
          (value ?? '').toLowerCase().includes(query)
        );

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

    const { error } = await supabase.from('shipments').insert({
      tracking_number: trackingNumber.trim(),
      sender_name: senderName.trim(),
      receiver_name: receiverName.trim(),
      recipient: receiverName.trim(),
      origin: origin.trim(),
      destination: destination.trim(),
      estimated_delivery: estimatedDelivery || null,
      status,
      current_location: location.trim(),
    });

    setLoading(false);

    if (error) {
      setMessage('Could not add shipment: ' + error.message);
      return;
    }

    setTrackingNumber('');
    setSenderName('');
    setReceiverName('');
    setLocation('');
    setOrigin('');
    setDestination('');
    setEstimatedDelivery('');
    setStatus('Pending');
    setMessage('Shipment added successfully.');
    await loadShipments();
  }

  async function updateShipment(id: string, nextStatus: string) {
    const { error } = await supabase
      .from('shipments')
      .update({ status: nextStatus })
      .eq('id', id);

    if (error) {
      setMessage('Could not update shipment: ' + error.message);
      return;
    }

    setMessage('Shipment status updated.');
    await loadShipments();
  }

  async function editShipment(shipment: Shipment) {
    const newDestination = prompt(
      'Enter the new destination:',
      shipment.destination
    );

    if (newDestination === null || !newDestination.trim()) {
      return;
    }

    const newLocation = prompt(
      'Enter the current location:',
      shipment.current_location || ''
    );

    if (newLocation === null || !newLocation.trim()) {
      return;
    }

    const newEstimatedDelivery = prompt(
      'Enter estimated delivery date (YYYY-MM-DD), or leave blank:',
      shipment.estimated_delivery || ''
    );

    if (newEstimatedDelivery === null) {
      return;
    }

    const { error } = await supabase
      .from('shipments')
      .update({
        destination: newDestination.trim(),
        current_location: newLocation.trim(),
        estimated_delivery: newEstimatedDelivery.trim() || null,
      })
      .eq('id', shipment.id);

    if (error) {
      setMessage('Could not edit shipment: ' + error.message);
      return;
    }

    setMessage('Shipment details updated successfully.');
    await loadShipments();
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

    setMessage(
      `Shipment ${shipment.tracking_number} deleted successfully.`
    );

    await loadShipments();
  }

  return (
    <main className="min-h-screen p-6">
      <div className="panel w-full max-w-3xl mx-auto">
        <h1>Bestway Logistics Dashboard</h1>
        <p className="muted">Add and manage customer shipments.</p>

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
              <option key={item}>{item}</option>
            ))}
          </select>

          <button className="button mt-3" type="submit" disabled={loading}>
            {loading ? 'Adding...' : 'Add Shipment'}
          </button>
        </form>

        {message && (
          <p className="mt-4" role="status">
            {message}
          </p>
        )}

        <section className="mt-8">
          <h2>Find Shipments</h2>
          <p className="muted">
            Search by tracking number, sender, recipient, origin,
            destination, or current location.
          </p>

          <label htmlFor="shipment-search">Search shipments</label>
          <input
            id="shipment-search"
            type="search"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="e.g. BW100005 or New York"
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
            <p>
              No shipments match your search or selected status.
            </p>
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
                <strong>Sender:</strong> {shipment.sender_name || 'Not available'}
              </p>
              <p>
                <strong>Receiver:</strong>{' '}
                {shipment.receiver_name || shipment.recipient || 'Not available'}
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

              <label htmlFor={`status-${shipment.id}`}>
                Update status
              </label>
              <select
                id={`status-${shipment.id}`}
                value={shipment.status}
                onChange={(e) =>
                  updateShipment(shipment.id, e.target.value)
                }
              >
                {shipmentStatuses.map((item) => (
                  <option key={item}>{item}</option>
                ))}
              </select>

              <div className="mt-3 flex flex-wrap gap-2">
                <button
                  type="button"
                  className="button"
                  onClick={() => editShipment(shipment)}
                >
                  Edit Shipment
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
