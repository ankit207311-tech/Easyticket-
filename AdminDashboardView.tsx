import React, { useMemo, useState } from 'react';
import { User } from 'firebase/auth';
import {
  Bus,
  CheckCircle,
  Download,
  Lock,
  LogIn,
  Plus,
  QrCode,
  Save,
  Settings,
  ShieldAlert,
  Trash2,
  Unlock,
  Users,
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import {
  AppConfig,
  Booking,
  BookingStatus,
  BusRoute,
  BusStatus,
  SeatLock,
  SeatUiModel,
} from '../types/bus';
import { buildSeatLayout, getTravelDateOptions } from '../lib/defaults';
import { downloadPassengerManifestPdf } from '../lib/pdfManifest';
import { SeatMap } from './SeatMap';

interface AdminDashboardViewProps {
  user: User | null;
  isAdmin: boolean;
  buses: BusRoute[];
  allBookings: Booking[];
  seatLocks: SeatLock[];
  selectedDate: string;
  onSelectDate: (iso: string) => void;
  appConfig: AppConfig;
  onSignIn: () => void;
  onUpdateBookingStatus: (booking: Booking, status: BookingStatus) => Promise<void>;
  onBlockSeat: (busId: string, date: string, seatNumber: string) => Promise<void>;
  onReleaseSeat: (busId: string, date: string, seatNumber: string) => Promise<void>;
  onSaveBus: (bus: BusRoute) => Promise<void>;
  onDeleteBus: (busId: string) => Promise<void>;
  onSaveConfig: (config: AppConfig) => Promise<void>;
  onSeedDefaults: () => Promise<void>;
}

type AdminTab = 'MANIFEST' | 'SEATS' | 'FLEET' | 'SETTINGS';

export const AdminDashboardView: React.FC<AdminDashboardViewProps> = ({
  user,
  isAdmin,
  buses,
  allBookings,
  seatLocks,
  selectedDate,
  onSelectDate,
  appConfig,
  onSignIn,
  onUpdateBookingStatus,
  onBlockSeat,
  onReleaseSeat,
  onSaveBus,
  onDeleteBus,
  onSaveConfig,
  onSeedDefaults,
}) => {
  const [adminTab, setAdminTab] = useState<AdminTab>('MANIFEST');
  const [selectedBusId, setSelectedBusId] = useState<string>(buses[0]?.id || 'BUS_VI_01');
  const [editingBus, setEditingBus] = useState<BusRoute | null>(null);
  const [configDraft, setConfigDraft] = useState<AppConfig>(appConfig);
  const [busyMessage, setBusyMessage] = useState<string>('');

  const dateOptions = useMemo(() => getTravelDateOptions(7), []);
  const activeBusId = buses.some((b) => b.id === selectedBusId)
    ? selectedBusId
    : buses[0]?.id || '';
  const selectedBus = buses.find((b) => b.id === activeBusId) || buses[0];

  const busBookings = useMemo(() => {
    return allBookings.filter(
      (b) => (!activeBusId || b.busId === activeBusId) && b.travelDate === selectedDate
    );
  }, [allBookings, activeBusId, selectedDate]);

  const busSeatLocks = useMemo(() => {
    return seatLocks.filter(
      (l) => l.busId === activeBusId && l.travelDate === selectedDate
    );
  }, [seatLocks, activeBusId, selectedDate]);

  const seatModels = useMemo(() => {
    return buildSeatLayout(busSeatLocks, selectedBus?.totalSeats || 32);
  }, [busSeatLocks, selectedBus?.totalSeats]);

  if (!user) {
    return (
      <div className="mx-auto max-w-lg rounded-3xl border border-slate-200 bg-white p-6 text-center shadow-sm">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-navy-900 text-white">
          <ShieldAlert className="h-7 w-7 text-brand-400" />
        </div>
        <h2 className="mt-4 text-lg font-extrabold text-slate-900">
          Mahaveer Travels Staff & Admin Panel
        </h2>
        <p className="mt-1.5 text-sm text-slate-600">
          Sign in with an authorized Mahaveer Travels Google account to manage buses, block or release seats, update UPI QR details, and download PDF passenger lists.
        </p>
        <button
          type="button"
          onClick={onSignIn}
          className="mt-5 inline-flex min-h-[46px] items-center gap-2 rounded-xl bg-navy-900 px-6 py-2.5 text-sm font-bold text-white shadow transition hover:bg-slate-800"
        >
          <LogIn className="h-4 w-4" />
          Staff Google Sign-In
        </button>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="mx-auto max-w-lg rounded-3xl border border-amber-200 bg-amber-50 p-6 text-center">
        <ShieldAlert className="mx-auto h-10 w-10 text-amber-600" />
        <h2 className="mt-3 text-lg font-extrabold text-slate-900">
          Admin Access Restricted
        </h2>
        <p className="mt-1.5 text-sm text-slate-700">
          Signed in as <span className="font-semibold">{user.email}</span>. Only authorized Mahaveer Travels staff/admin accounts can modify schedules, UPI QR settings, or view all passenger manifests.
        </p>
      </div>
    );
  }

  const handleToggleAdminSeat = async (seat: SeatUiModel) => {
    if (!selectedBus) return;
    setBusyMessage(`Updating seat ${seat.seatNumber}...`);
    try {
      if (seat.isBooked) {
        await onReleaseSeat(selectedBus.id, selectedDate, seat.seatNumber);
      } else {
        await onBlockSeat(selectedBus.id, selectedDate, seat.seatNumber);
      }
    } finally {
      setBusyMessage('');
    }
  };

  const handleNewBus = () => {
    setEditingBus({
      id: `BUS_${Date.now().toString().slice(-4)}`,
      busNumber: 'MP-40-PA-2143',
      operatorName: 'Mahaveer Travels, Vidisha',
      fromCity: 'Vidisha',
      toCity: 'Indore',
      departureTime: '06:30 AM',
      arrivalTime: '11:30 AM',
      duration: '5h 00m',
      fare: 400,
      busType: 'AC Seater Deluxe',
      totalSeats: 32,
      status: 'ON_TIME',
      amenities: 'AC Seater Deluxe, Pushback Seats, USB Charging',
      pickupPoints: 'Mahaveer Travels Office (Vidisha Bus Stand), Sanchi Bypass',
      dropPoints: 'Dewas Naka, Vijay Nagar Square, Sarwate Bus Stand Indore',
      isMorningBus: true,
      isActive: true,
    });
  };

  const activeCount = busBookings.filter((b) => b.bookingStatus !== 'CANCELLED').length;
  const bookedSeatsCount = busBookings
    .filter((b) => b.bookingStatus !== 'CANCELLED')
    .reduce((sum, b) => sum + b.seatNumbers.length, 0);

  return (
    <div className="space-y-4">
      {/* Header & Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-navy-900 p-4 text-white">
        <div>
          <h2 className="text-lg font-extrabold">Admin & Staff Operations</h2>
          <p className="text-xs text-slate-300">
            Signed in as {user.email} {busyMessage ? `• ${busyMessage}` : ''}
          </p>
        </div>

        <button
          type="button"
          onClick={onSeedDefaults}
          className="rounded-xl border border-slate-700 bg-slate-800 px-3 py-2 text-xs font-bold text-slate-200 hover:bg-slate-700"
        >
          Sync Default Fleet
        </button>
      </div>

      {/* Sub-navigation */}
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {[
          { id: 'MANIFEST' as AdminTab, label: 'Bookings & PDF', icon: Users },
          { id: 'SEATS' as AdminTab, label: 'Live Seat Block', icon: Lock },
          { id: 'FLEET' as AdminTab, label: 'Bus Fleet', icon: Bus },
          { id: 'SETTINGS' as AdminTab, label: 'UPI QR & Info', icon: Settings },
        ].map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => {
                setAdminTab(item.id);
                if (item.id === 'SETTINGS') setConfigDraft(appConfig);
              }}
              className={`flex min-h-[44px] items-center justify-center gap-2 rounded-xl border px-3 py-2 text-xs font-bold transition ${
                adminTab === item.id
                  ? 'border-brand-600 bg-brand-600 text-white shadow-sm'
                  : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
              }`}
            >
              <Icon className="h-4 w-4" />
              {item.label}
            </button>
          );
        })}
      </div>

      {/* Bus & Date Filter Bar for Manifest & Seat Manager */}
      {(adminTab === 'MANIFEST' || adminTab === 'SEATS') && (
        <div className="grid grid-cols-1 gap-3 rounded-2xl border border-slate-200 bg-white p-4 sm:grid-cols-3">
          <div>
            <label className="mb-1 block text-xs font-bold text-slate-600">
              Select Bus Schedule
            </label>
            <select
              value={activeBusId}
              onChange={(e) => setSelectedBusId(e.target.value)}
              className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-xs font-semibold"
            >
              {buses.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.fromCity} → {b.toCity} ({b.departureTime}) • {b.busNumber}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1 block text-xs font-bold text-slate-600">
              Travel Date
            </label>
            <select
              value={selectedDate}
              onChange={(e) => onSelectDate(e.target.value)}
              className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-xs font-semibold"
            >
              {dateOptions.map((d) => (
                <option key={d.isoDate} value={d.isoDate}>
                  {d.shortLabel} ({d.isoDate})
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-end">
            {selectedBus && (
              <button
                type="button"
                onClick={() =>
                  downloadPassengerManifestPdf(selectedBus, busBookings, selectedDate)
                }
                className="flex min-h-[42px] w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 text-xs font-bold text-white shadow hover:bg-emerald-500"
              >
                <Download className="h-4 w-4" />
                Download PDF Passenger List
              </button>
            )}
          </div>
        </div>
      )}

      {/* TAB 1: MANIFEST & BOOKINGS */}
      {adminTab === 'MANIFEST' && (
        <div className="space-y-3">
          <div className="grid grid-cols-3 gap-2">
            <div className="rounded-2xl border border-slate-200 bg-white p-3">
              <p className="text-[11px] font-semibold text-slate-500">Active Bookings</p>
              <p className="text-xl font-extrabold text-slate-900">{activeCount}</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-3">
              <p className="text-[11px] font-semibold text-slate-500">Seats Booked</p>
              <p className="text-xl font-extrabold text-brand-600">
                {bookedSeatsCount}/{selectedBus?.totalSeats || 32}
              </p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-3">
              <p className="text-[11px] font-semibold text-slate-500">Total Records</p>
              <p className="text-xl font-extrabold text-slate-900">{busBookings.length}</p>
            </div>
          </div>

          {busBookings.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-500">
              No passenger bookings for this bus on {selectedDate}.
            </div>
          ) : (
            <div className="space-y-2.5">
              {busBookings.map((b) => (
                <div
                  key={b.bookingId || b.id}
                  className="flex flex-col justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-4 sm:flex-row sm:items-center"
                >
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-xs font-bold text-brand-600">
                        {b.bookingId}
                      </span>
                      <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-bold text-slate-700">
                        Seats: {b.seatNumbers.join(', ')}
                      </span>
                      <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[11px] font-bold text-amber-700">
                        {b.bookingStatus}
                      </span>
                    </div>
                    <p className="text-sm font-bold text-slate-900">
                      {b.passengerName} ({b.passengerGender}) •{' '}
                      <a
                        href={`tel:${b.passengerPhone}`}
                        className="font-mono text-brand-700 underline"
                      >
                        {b.passengerPhone}
                      </a>
                    </p>
                    <p className="text-xs text-slate-500">
                      {b.pickupPoint} → {b.dropPoint} • ₹{Math.round(b.totalAmount)} (
                      {b.paymentMethod})
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {b.bookingStatus === 'CONFIRMED' && (
                      <button
                        type="button"
                        onClick={() => onUpdateBookingStatus(b, 'CHECKED_IN')}
                        className="inline-flex min-h-[38px] items-center gap-1 rounded-xl bg-sky-600 px-3 text-xs font-bold text-white hover:bg-sky-500"
                      >
                        <CheckCircle className="h-3.5 w-3.5" />
                        Check In
                      </button>
                    )}
                    {b.bookingStatus !== 'CANCELLED' && (
                      <button
                        type="button"
                        onClick={() => onUpdateBookingStatus(b, 'CANCELLED')}
                        className="inline-flex min-h-[38px] items-center gap-1 rounded-xl bg-rose-50 px-3 text-xs font-bold text-rose-700 hover:bg-rose-100"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        Cancel & Free Seat
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: LIVE SEAT BLOCK / RELEASE */}
      {adminTab === 'SEATS' && (
        <div className="space-y-3">
          <div className="flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-2.5 text-xs font-semibold text-amber-800">
            <Unlock className="h-4 w-4 shrink-0" />
            Tap any vacant seat to block it for counter booking, or tap any booked/blocked seat to release it live.
          </div>
          <SeatMap
            seats={seatModels}
            selectedSeats={[]}
            onToggleSeat={handleToggleAdminSeat}
            adminMode
          />
        </div>
      )}

      {/* TAB 3: BUS FLEET */}
      {adminTab === 'FLEET' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-extrabold text-slate-900">
              Manage Vidisha – Indore Buses ({buses.length})
            </h3>
            <button
              type="button"
              onClick={handleNewBus}
              className="inline-flex min-h-[40px] items-center gap-1.5 rounded-xl bg-brand-600 px-3.5 text-xs font-bold text-white hover:bg-brand-500"
            >
              <Plus className="h-4 w-4" />
              Add Bus
            </button>
          </div>

          {editingBus && (
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                await onSaveBus(editingBus);
                setEditingBus(null);
              }}
              className="space-y-3 rounded-2xl border-2 border-brand-200 bg-white p-4 shadow-sm"
            >
              <h4 className="text-sm font-extrabold text-slate-900">
                Save Bus Schedule ({editingBus.id})
              </h4>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                <input
                  required
                  value={editingBus.busNumber}
                  onChange={(e) =>
                    setEditingBus({ ...editingBus, busNumber: e.target.value })
                  }
                  placeholder="Bus Number (MP-40-PA-2141)"
                  className="rounded-xl border border-slate-300 px-3 py-2 text-xs font-semibold"
                />
                <input
                  required
                  value={editingBus.fromCity}
                  onChange={(e) =>
                    setEditingBus({ ...editingBus, fromCity: e.target.value })
                  }
                  placeholder="From City"
                  className="rounded-xl border border-slate-300 px-3 py-2 text-xs font-semibold"
                />
                <input
                  required
                  value={editingBus.toCity}
                  onChange={(e) =>
                    setEditingBus({ ...editingBus, toCity: e.target.value })
                  }
                  placeholder="To City"
                  className="rounded-xl border border-slate-300 px-3 py-2 text-xs font-semibold"
                />
                <input
                  required
                  value={editingBus.departureTime}
                  onChange={(e) =>
                    setEditingBus({ ...editingBus, departureTime: e.target.value })
                  }
                  placeholder="Departure (06:30 AM)"
                  className="rounded-xl border border-slate-300 px-3 py-2 text-xs font-semibold"
                />
                <input
                  required
                  value={editingBus.arrivalTime}
                  onChange={(e) =>
                    setEditingBus({ ...editingBus, arrivalTime: e.target.value })
                  }
                  placeholder="Arrival (11:30 AM)"
                  className="rounded-xl border border-slate-300 px-3 py-2 text-xs font-semibold"
                />
                <input
                  required
                  type="number"
                  min={50}
                  value={editingBus.fare}
                  onChange={(e) =>
                    setEditingBus({ ...editingBus, fare: Number(e.target.value) })
                  }
                  placeholder="Fare (Rs.)"
                  className="rounded-xl border border-slate-300 px-3 py-2 text-xs font-semibold"
                />
                <select
                  value={editingBus.status}
                  onChange={(e) =>
                    setEditingBus({
                      ...editingBus,
                      status: e.target.value as BusStatus,
                    })
                  }
                  className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-semibold"
                >
                  <option value="ON_TIME">ON_TIME</option>
                  <option value="BOARDING">BOARDING</option>
                  <option value="DELAYED">DELAYED</option>
                  <option value="DEPARTED">DEPARTED</option>
                </select>
                <label className="flex items-center gap-2 text-xs font-bold text-slate-700">
                  <input
                    type="checkbox"
                    checked={editingBus.isActive}
                    onChange={(e) =>
                      setEditingBus({ ...editingBus, isActive: e.target.checked })
                    }
                  />
                  Active for Passengers
                </label>
              </div>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <input
                  required
                  value={editingBus.pickupPoints}
                  onChange={(e) =>
                    setEditingBus({ ...editingBus, pickupPoints: e.target.value })
                  }
                  placeholder="Pickup points (comma separated)"
                  className="rounded-xl border border-slate-300 px-3 py-2 text-xs"
                />
                <input
                  required
                  value={editingBus.dropPoints}
                  onChange={(e) =>
                    setEditingBus({ ...editingBus, dropPoints: e.target.value })
                  }
                  placeholder="Drop points (comma separated)"
                  className="rounded-xl border border-slate-300 px-3 py-2 text-xs"
                />
              </div>
              <div className="flex gap-2">
                <button
                  type="submit"
                  className="inline-flex min-h-[40px] items-center gap-1.5 rounded-xl bg-brand-600 px-4 text-xs font-bold text-white"
                >
                  <Save className="h-3.5 w-3.5" />
                  Save Schedule
                </button>
                <button
                  type="button"
                  onClick={() => setEditingBus(null)}
                  className="min-h-[40px] rounded-xl border border-slate-300 px-4 text-xs font-bold text-slate-700"
                >
                  Cancel
                </button>
              </div>
            </form>
          )}

          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            {buses.map((b) => (
              <div
                key={b.id}
                className="flex items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-4"
              >
                <div>
                  <p className="text-sm font-extrabold text-slate-900">
                    {b.fromCity} → {b.toCity} ({b.departureTime})
                  </p>
                  <p className="text-xs text-slate-500">
                    {b.busNumber} • ₹{b.fare} • {b.status} •{' '}
                    {b.isActive ? 'Visible' : 'Hidden'}
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setEditingBus(b)}
                    className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-50"
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => onDeleteBus(b.id)}
                    className="rounded-lg bg-rose-50 px-2.5 py-1.5 text-xs font-bold text-rose-700 hover:bg-rose-100"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 4: UPI QR & APP SETTINGS */}
      {adminTab === 'SETTINGS' && (
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            await onSaveConfig(configDraft);
          }}
          className="grid grid-cols-1 gap-4 rounded-2xl border border-slate-200 bg-white p-5 md:grid-cols-3"
        >
          <div className="space-y-3 md:col-span-2">
            <h3 className="text-base font-extrabold text-slate-900">
              Payment UPI QR & Helpline Settings
            </h3>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-xs font-bold text-slate-600">
                  Merchant UPI ID
                </label>
                <input
                  required
                  value={configDraft.upiId}
                  onChange={(e) =>
                    setConfigDraft({ ...configDraft, upiId: e.target.value })
                  }
                  className="w-full rounded-xl border border-slate-300 px-3 py-2.5 font-mono text-xs font-semibold"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-bold text-slate-600">
                  Helpline Phone
                </label>
                <input
                  required
                  value={configDraft.supportPhone}
                  onChange={(e) =>
                    setConfigDraft({ ...configDraft, supportPhone: e.target.value })
                  }
                  className="w-full rounded-xl border border-slate-300 px-3 py-2.5 font-mono text-xs font-semibold"
                />
              </div>
            </div>

            <div>
              <label className="mb-1 block text-xs font-bold text-slate-600">
                Merchant Name
              </label>
              <input
                required
                value={configDraft.merchantName}
                onChange={(e) =>
                  setConfigDraft({ ...configDraft, merchantName: e.target.value })
                }
                className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-xs font-semibold"
              />
            </div>

            <div>
              <label className="mb-1 block text-xs font-bold text-slate-600">
                Passenger Announcement Banner
              </label>
              <textarea
                rows={2}
                value={configDraft.announcement}
                onChange={(e) =>
                  setConfigDraft({ ...configDraft, announcement: e.target.value })
                }
                className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs"
              />
            </div>

            <div className="flex flex-wrap gap-4 pt-1 text-xs font-bold text-slate-700">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={configDraft.isQrPaymentEnabled}
                  onChange={(e) =>
                    setConfigDraft({
                      ...configDraft,
                      isQrPaymentEnabled: e.target.checked,
                    })
                  }
                />
                Enable UPI QR Payment
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={configDraft.isCardPaymentEnabled}
                  onChange={(e) =>
                    setConfigDraft({
                      ...configDraft,
                      isCardPaymentEnabled: e.target.checked,
                    })
                  }
                />
                Enable Card Payment
              </label>
            </div>

            <button
              type="submit"
              className="inline-flex min-h-[44px] items-center gap-2 rounded-xl bg-brand-600 px-5 text-xs font-bold text-white shadow hover:bg-brand-500"
            >
              <Save className="h-4 w-4" />
              Save UPI & Helpline Config
            </button>
          </div>

          <div className="flex flex-col items-center justify-center rounded-2xl border border-slate-200 bg-slate-50 p-4 text-center">
            <QrCode className="mb-2 h-5 w-5 text-brand-600" />
            <p className="mb-2 text-xs font-bold text-slate-700">Live UPI QR Preview</p>
            <div className="rounded-xl bg-white p-2.5 shadow-sm">
              <QRCodeSVG
                value={`upi://pay?pa=${encodeURIComponent(configDraft.upiId)}&pn=${encodeURIComponent(
                  configDraft.merchantName
                )}&cu=INR`}
                size={130}
              />
            </div>
            <p className="mt-2 font-mono text-xs font-semibold text-slate-600">
              {configDraft.upiId}
            </p>
          </div>
        </form>
      )}
    </div>
  );
};
