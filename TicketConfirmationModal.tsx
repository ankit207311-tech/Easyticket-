import React from 'react';
import { CheckCircle2, MessageCircle, Printer, X } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { Booking } from '../types/bus';
import { buildWhatsAppBookingUrl } from '../lib/whatsapp';

interface TicketConfirmationModalProps {
  booking: Booking;
  supportPhone: string;
  onClose: () => void;
}

export const TicketConfirmationModal: React.FC<TicketConfirmationModalProps> = ({
  booking,
  supportPhone,
  onClose,
}) => {
  const qrPayload = JSON.stringify({
    bookingId: booking.bookingId,
    bus: booking.busNumber,
    date: booking.travelDate,
    seats: booking.seatNumbers,
    passenger: booking.passengerName,
    phone: booking.passengerPhone,
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-sm">
      <div className="max-h-[92vh] w-full max-w-md overflow-y-auto rounded-3xl bg-white shadow-2xl">
        <div className="flex items-center justify-between bg-emerald-600 px-5 py-4 text-white">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="h-6 w-6" />
            <div>
              <h2 className="text-base font-extrabold">Ticket Confirmed!</h2>
              <p className="font-mono text-xs text-emerald-100">{booking.bookingId}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-white/15 text-white hover:bg-white/25"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-4 p-5">
          <div className="flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 p-3.5">
            <div>
              <p className="text-xs font-semibold uppercase text-slate-500">
                {booking.operatorName}
              </p>
              <p className="text-base font-extrabold text-slate-900">
                {booking.fromCity} → {booking.toCity}
              </p>
              <p className="text-xs font-medium text-slate-600">
                {booking.travelDate} • {booking.departureTime} – {booking.arrivalTime}
              </p>
            </div>
            <div className="rounded-xl bg-white p-1.5 shadow-sm">
              <QRCodeSVG value={qrPayload} size={68} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="rounded-xl bg-slate-50 p-3">
              <p className="text-slate-500">Passenger</p>
              <p className="font-bold text-slate-900">{booking.passengerName}</p>
              <p className="font-mono text-slate-600">{booking.passengerPhone}</p>
            </div>
            <div className="rounded-xl bg-slate-50 p-3">
              <p className="text-slate-500">Seats ({booking.seatNumbers.length})</p>
              <p className="text-sm font-extrabold text-brand-600">
                {booking.seatNumbers.join(', ')}
              </p>
              <p className="font-mono text-slate-600">{booking.busNumber}</p>
            </div>
            <div className="rounded-xl bg-slate-50 p-3">
              <p className="text-slate-500">Pickup</p>
              <p className="font-semibold text-slate-800">{booking.pickupPoint}</p>
            </div>
            <div className="rounded-xl bg-slate-50 p-3">
              <p className="text-slate-500">Amount & Mode</p>
              <p className="font-extrabold text-slate-900">
                ₹{Math.round(booking.totalAmount)} ({booking.paymentMethod})
              </p>
            </div>
          </div>

          <div className="flex flex-col gap-2.5 pt-2 sm:flex-row">
            <a
              href={buildWhatsAppBookingUrl(booking, supportPhone)}
              target="_blank"
              rel="noopener noreferrer"
              className="flex min-h-[46px] flex-1 items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-bold text-white shadow transition hover:bg-emerald-500"
            >
              <MessageCircle className="h-4 w-4" />
              WhatsApp Ticket
            </a>
            <button
              type="button"
              onClick={() => window.print()}
              className="flex min-h-[46px] items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-bold text-slate-700 transition hover:bg-slate-50"
            >
              <Printer className="h-4 w-4" />
              Print
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
