'use client';

import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';

type Shipment = {
  id: string;
  tracking_number: string;
  sender_name: string | null;
  receiver_name: string | null;
  origin: string;
destination: string;
estimated_delivery: string | null;
  status: string;
  current_location: string | null;
  created_at: string;
};

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
  const [message, setMessage] = useState('Loading shipments...');
  const [loading, setLoading] = useState(false);

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
    const { data: { session } } =
      await supabase.auth.getSession();

    if (!session) {
      window.location.href = '/admin/login';
      return;
    }

    await loadShipments();
  }

  checkAdmin();
}, []);


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
  const newEstimatedDelivery = prompt(
  'Enter the estimated delivery date (YYYY-MM-DD):',
  shipment.estimated_delivery || ''
);

  if (newLocation === null || !newLocation.trim()) {
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
            <option>Pending</option>
            <option>Processing</option>
            <option>In Transit</option>
            <option>Out for Delivery</option>
            <option>Delivered</option>
          </select>

          <button className="button mt-3" type="submit" disabled={loading}>
            {loading ? 'Adding...' : 'Add Shipment'}
          </button>
        </form>

        {message && <p className="mt-4">{message}</p>}

        <h2 className="mt-8">All Shipments ({shipments.length})</h2>

        {shipments.map((shipment) => (
          <div key={shipment.id} className="panel mt-4">
            <p><strong>Tracking:</strong> {shipment.tracking_number}</p>
            <p><strong>Sender:</strong> {shipment.sender_name}</p>
            <p><strong>Receiver:</strong> {shipment.receiver_name}</p>
            <p><strong>Origin:</strong> {shipment.origin}</p>
<p><strong>Destination:</strong> {shipment.destination}</p>
<p><strong>Current Location:</strong> {shipment.current_location}</p>

<p>
  <strong>Estimated Delivery:</strong>{' '}
  {shipment.estimated_delivery
    ? new Date(shipment.estimated_delivery).toLocaleDateString()
    : 'Not yet scheduled'}
</p>

            <p><strong>Status:</strong> {shipment.status}</p>

            <label htmlFor={`status-${shipment.id}`}>Update status</label>
            <select
              id={`status-${shipment.id}`}
              value={shipment.status}
              onChange={(e) =>
                updateShipment(shipment.id, e.target.value)
              }
            >
              <option>Pending</option>
              <option>Processing</option>
              <option>In Transit</option>
              <option>Out for Delivery</option>
              <option>Delivered</option>
            </select>
            <button
  type="button"
  className="button mt-3"
  onClick={() => editShipment(shipment)}
>
  Edit Shipment
</button>
          </div>
        ))}

        <p className="mt-6">
          <a href="/">Back to shipment tracking</a>
        </p>
      </div>
    </main>
  );
}