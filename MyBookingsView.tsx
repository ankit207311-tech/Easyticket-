import React, { useState } from 'react';
import {
  Calendar,
  LogIn,
  MessageCircle,
  Ticket,
  Trash2,
} from 'lucide-react';
import { User } from 'firebase/auth';
import { Booking } from '../types/bus';
import { buildWhatsAppBookingUrl } from '../lib/whatsapp';

interface MyBookingsViewProps {
  user: User | null;
  bookings: Booking[];
  supportPhone: string;
  onSignIn: () => void;
  onCancelBooking: (booking: Booking) => Promise<void>;
  onOpenTicket: (booking: Booking) => void;
}

const statusBadge: Record<string, string> = {
  CONFIRMED: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  CHECKED_IN: 'bg-sky-50 text-sky-700 border-sky-200',
  CANCELLED: 'bg-rose-50 text-rose-700 border-rose-200',
};

export const MyBookingsView: React.FC<MyBookingsViewProps> = ({
  user,
  bookings,
  supportPhone,
  onSignIn,
  onCancelBooking,
  onOpenTicket,
}) => {
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [filter, setFilter] = useState<'ALL' | 'CONFIRMED' | 'CANCELLED'>('ALL');

  if (!user) {
    return (
      <div className="mx-auto max-w-lg rounded-3xl border border-slate-200 bg-white p-6 text-center shadow-sm">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-50 text-brand-600">
          <Ticket className="h-7 w-7" />
        </div>
        <h2 className="mt-4 text-lg font-extrabold text-slate-900">
          Sign In to View Your Bookings
        </h2>
        <p className="mt-1.5 text-sm text-slate-600">
          Access your confirmed Mahaveer Travels tickets, send WhatsApp confirmations, or cancel seats securely from any device.
        </p>
        <button
          type="button"
          onClick={onSignIn}
          className="mt-5 inline-flex min-h-[46px] items-center gap-2 rounded-xl bg-brand-600 px-6 py-2.5 text-sm font-bold text-white shadow transition hover:bg-brand-500"
        >
          <LogIn className="h-4 w-4" />
          Sign in with Google
        </button>
      </div>
    );
  }

  const filtered = bookings.filter((b) => {
    if (filter === 'ALL') return true;
    if (filter === 'CONFIRMED') return b.bookingStatus !== 'CANCELLED';
    return b.bookingStatus === 'CANCELLED';
  });

  const handleCancel = async (booking: Booking) => {
    const id = booking.bookingId || booking.id;
    if (
      !window.confirm(
        `Cancel booking ${id} for seats ${booking.seatNumbers.join(', ')}? Seats will be released immediately.`
      )
    ) {
      return;
    }
    setCancellingId(id);
    try {
      await onCancelBooking(booking);
    } finally {
      setCancellingId(null);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900">My Bookings</h2>
          <p className="text-xs text-slate-500">
            Synced live for {user.email}
          </p>
        </div>

        <div className="flex gap-1.5 rounded-xl bg-slate-200/70 p-1">
          {(['ALL', 'CONFIRMED', 'CANCELLED'] as const).map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setFilter(tab)}
              className={`rounded-lg px-3 py-1.5 text-xs font-bold transition ${
                filter === tab
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {tab === 'ALL' ? 'All' : tab === 'CONFIRMED' ? 'Active' : 'Cancelled'}
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center">
          <Ticket className="mx-auto h-10 w-10 text-slate-300" />
          <p className="mt-2 text-sm font-bold text-slate-700">No bookings found</p>
          <p className="text-xs text-slate-500">
            Your confirmed Vidisha – Indore tickets will appear here.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {filtered.map((booking) => {
            const id = booking.bookingId || booking.id;
            const isCancelled = booking.bookingStatus === 'CANCELLED';
            return (
              <div
                key={id}
                className="flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="font-mono text-xs font-bold text-brand-600">
                        {id}
                      </span>
                      <h3 className="text-base font-extrabold text-slate-900">
                        {booking.fromCity} → {booking.toCity}
                      </h3>
                    </div>
                    <span
                      className={`rounded-full border px-2.5 py-0.5 text-[11px] font-bold ${
                        statusBadge[booking.bookingStatus] || statusBadge.CONFIRMED
                      }`}
                    >
                      {booking.bookingStatus}
                    </span>
                  </div>

                  <div className="mt-3 grid grid-cols-2 gap-2 rounded-xl bg-slate-50 p-3 text-xs">
                    <div>
                      <p className="text-slate-500">Travel Date</p>
                      <p className="flex items-center gap-1 font-bold text-slate-800">
                        <Calendar className="h-3.5 w-3.5 text-brand-600" />
                        {booking.travelDate} ({booking.departureTime})
                      </p>
                    </div>
                    <div>
                      <p className="text-slate-500">Seats</p>
                      <p className="font-extrabold text-slate-900">
                        {booking.seatNumbers.join(', ')}
                      </p>
                    </div>
                    <div>
                      <p className="text-slate-500">Passenger</p>
                      <p className="font-semibold text-slate-800">
                        {booking.passengerName} ({booking.passengerPhone})
                      </p>
                    </div>
                    <div>
                      <p className="text-slate-500">Fare & Payment</p>
                      <p className="font-bold text-slate-900">
                        ₹{Math.round(booking.totalAmount)} • {booking.paymentMethod}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="mt-4 flex flex-wrap gap-2 border-t border-slate-100 pt-3">
                  <button
                    type="button"
                    onClick={() => onOpenTicket(booking)}
                    className="min-h-[40px] flex-1 rounded-xl border border-slate-300 bg-white px-3 text-xs font-bold text-slate-700 hover:bg-slate-50"
                  >
                    View Ticket / QR
                  </button>

                  {!isCancelled && (
                    <>
                      <a
                        href={buildWhatsAppBookingUrl(booking, supportPhone)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex min-h-[40px] items-center justify-center gap-1.5 rounded-xl bg-emerald-600 px-3 text-xs font-bold text-white hover:bg-emerald-500"
                      >
                        <MessageCircle className="h-3.5 w-3.5" />
                        WhatsApp
                      </a>
                      <button
                        type="button"
                        disabled={cancellingId === id}
                        onClick={() => handleCancel(booking)}
                        className="inline-flex min-h-[40px] items-center justify-center gap-1 rounded-xl bg-rose-50 px-3 text-xs font-bold text-rose-700 hover:bg-rose-100 disabled:opacity-60"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        {cancellingId === id ? 'Cancelling...' : 'Cancel'}
                      </button>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
