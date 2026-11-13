import React, { useState } from 'react';
import { CreditCard, QrCode, Wallet, X } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { AppConfig, BusRoute, Gender, PaymentMethod } from '../types/bus';
import { splitPoints } from '../lib/defaults';

interface BookingCheckoutModalProps {
  bus: BusRoute;
  travelDate: string;
  selectedSeats: string[];
  appConfig: AppConfig;
  defaultName?: string;
  submitting: boolean;
  onClose: () => void;
  onConfirm: (payload: {
    passengerName: string;
    passengerPhone: string;
    passengerGender: Gender;
    pickupPoint: string;
    dropPoint: string;
    paymentMethod: PaymentMethod;
    paymentReference: string;
  }) => Promise<void>;
}

export const BookingCheckoutModal: React.FC<BookingCheckoutModalProps> = ({
  bus,
  travelDate,
  selectedSeats,
  appConfig,
  defaultName = '',
  submitting,
  onClose,
  onConfirm,
}) => {
  const pickupList = splitPoints(bus.pickupPoints);
  const dropList = splitPoints(bus.dropPoints);

  const [passengerName, setPassengerName] = useState(defaultName);
  const [passengerPhone, setPassengerPhone] = useState('');
  const [passengerGender, setPassengerGender] = useState<Gender>('MALE');
  const [pickupPoint, setPickupPoint] = useState(pickupList[0] || 'Vidisha Bus Stand');
  const [dropPoint, setDropPoint] = useState(dropList[0] || 'Indore Bus Stand');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(
    appConfig.isQrPaymentEnabled
      ? 'UPI_QR'
      : appConfig.isCardPaymentEnabled
        ? 'CARD'
        : 'PAY_ON_BOARD'
  );
  const [upiRef, setUpiRef] = useState('');
  const [cardLast4, setCardLast4] = useState('');
  const [error, setError] = useState('');

  const totalAmount = bus.fare * selectedSeats.length;
  const upiUri = `upi://pay?pa=${encodeURIComponent(appConfig.upiId)}&pn=${encodeURIComponent(
    appConfig.merchantName
  )}&am=${totalAmount.toFixed(2)}&cu=INR&tn=${encodeURIComponent(
    `Mahaveer Bus ${bus.fromCity}-${bus.toCity}`
  )}`;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const cleanName = passengerName.trim();
    const digits = passengerPhone.replace(/\D/g, '');
    if (cleanName.length < 2) {
      setError('Please enter passenger full name.');
      return;
    }
    if (digits.length !== 10) {
      setError('Please enter a valid 10-digit mobile number.');
      return;
    }

    let paymentReference = `CASH-${Date.now().toString().slice(-6)}`;
    if (paymentMethod === 'UPI_QR') {
      paymentReference = upiRef.trim() || `UPI-${Date.now().toString().slice(-6)}`;
    } else if (paymentMethod === 'CARD') {
      const cleanCard = cardLast4.replace(/\D/g, '').slice(-4);
      if (cleanCard.length < 4) {
        setError('Please enter the last 4 digits of your card.');
        return;
      }
      paymentReference = `CARD-${cleanCard}`;
    }

    try {
      await onConfirm({
        passengerName: cleanName,
        passengerPhone: digits,
        passengerGender,
        pickupPoint,
        dropPoint,
        paymentMethod,
        paymentReference,
      });
    } catch (err: unknown) {
      setError((err as Error)?.message || 'Booking failed. Please try again.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/60 p-0 backdrop-blur-sm sm:items-center sm:p-4">
      <div className="max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-t-3xl bg-white p-5 shadow-2xl sm:rounded-3xl sm:p-6">
        <div className="flex items-start justify-between gap-3 border-b border-slate-100 pb-4">
          <div>
            <h2 className="text-lg font-extrabold text-slate-900">
              Passenger & Payment Details
            </h2>
            <p className="text-xs font-medium text-slate-500">
              {bus.fromCity} → {bus.toCity} • {travelDate} • Seats:{' '}
              <span className="font-bold text-brand-600">{selectedSeats.join(', ')}</span>
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-slate-600 hover:bg-slate-200"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          {error && (
            <div className="rounded-xl border border-rose-200 bg-rose-50 px-3.5 py-2.5 text-xs font-semibold text-rose-700">
              {error}
            </div>
          )}

          <div>
            <label className="mb-1 block text-xs font-bold uppercase tracking-wide text-slate-600">
              Passenger Full Name *
            </label>
            <input
              type="text"
              required
              value={passengerName}
              onChange={(e) => setPassengerName(e.target.value)}
              placeholder="e.g. Rajesh Sharma"
              className="w-full rounded-xl border border-slate-300 px-3.5 py-3 text-sm font-medium focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-200"
            />
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-bold uppercase tracking-wide text-slate-600">
                Mobile Number *
              </label>
              <input
                type="tel"
                inputMode="numeric"
                maxLength={10}
                required
                value={passengerPhone}
                onChange={(e) => setPassengerPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                placeholder="10-digit WhatsApp number"
                className="w-full rounded-xl border border-slate-300 px-3.5 py-3 font-mono text-sm font-medium focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-200"
              />
            </div>

            <div>
              <label className="mb-1 block text-xs font-bold uppercase tracking-wide text-slate-600">
                Gender *
              </label>
              <div className="grid grid-cols-3 gap-1.5">
                {(['MALE', 'FEMALE', 'OTHER'] as Gender[]).map((g) => (
                  <button
                    key={g}
                    type="button"
                    onClick={() => setPassengerGender(g)}
                    className={`min-h-[44px] rounded-xl border text-xs font-bold transition ${
                      passengerGender === g
                        ? 'border-brand-600 bg-brand-50 text-brand-700'
                        : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    {g === 'MALE' ? 'Male' : g === 'FEMALE' ? 'Female' : 'Other'}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-bold uppercase tracking-wide text-slate-600">
                Boarding Point
              </label>
              <select
                value={pickupPoint}
                onChange={(e) => setPickupPoint(e.target.value)}
                className="w-full rounded-xl border border-slate-300 bg-white px-3 py-3 text-sm font-medium focus:border-brand-500 focus:outline-none"
              >
                {pickupList.map((pt) => (
                  <option key={pt} value={pt}>
                    {pt}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-bold uppercase tracking-wide text-slate-600">
                Drop Point
              </label>
              <select
                value={dropPoint}
                onChange={(e) => setDropPoint(e.target.value)}
                className="w-full rounded-xl border border-slate-300 bg-white px-3 py-3 text-sm font-medium focus:border-brand-500 focus:outline-none"
              >
                {dropList.map((pt) => (
                  <option key={pt} value={pt}>
                    {pt}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Payment Method */}
          <div>
            <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-slate-600">
              Payment Method
            </label>
            <div className="grid grid-cols-3 gap-2">
              {appConfig.isQrPaymentEnabled && (
                <button
                  type="button"
                  onClick={() => setPaymentMethod('UPI_QR')}
                  className={`flex min-h-[48px] flex-col items-center justify-center gap-1 rounded-xl border p-2 text-xs font-bold ${
                    paymentMethod === 'UPI_QR'
                      ? 'border-brand-600 bg-brand-50 text-brand-700'
                      : 'border-slate-200 text-slate-600'
                  }`}
                >
                  <QrCode className="h-4 w-4" />
                  UPI QR
                </button>
              )}
              {appConfig.isCardPaymentEnabled && (
                <button
                  type="button"
                  onClick={() => setPaymentMethod('CARD')}
                  className={`flex min-h-[48px] flex-col items-center justify-center gap-1 rounded-xl border p-2 text-xs font-bold ${
                    paymentMethod === 'CARD'
                      ? 'border-brand-600 bg-brand-50 text-brand-700'
                      : 'border-slate-200 text-slate-600'
                  }`}
                >
                  <CreditCard className="h-4 w-4" />
                  Card
                </button>
              )}
              <button
                type="button"
                onClick={() => setPaymentMethod('PAY_ON_BOARD')}
                className={`flex min-h-[48px] flex-col items-center justify-center gap-1 rounded-xl border p-2 text-xs font-bold ${
                  paymentMethod === 'PAY_ON_BOARD'
                    ? 'border-brand-600 bg-brand-50 text-brand-700'
                    : 'border-slate-200 text-slate-600'
                }`}
              >
                <Wallet className="h-4 w-4" />
                Pay on Bus
              </button>
            </div>
          </div>

          {paymentMethod === 'UPI_QR' && (
            <div className="flex flex-col items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-center sm:flex-row sm:text-left">
              <div className="rounded-xl bg-white p-2 shadow-sm">
                <QRCodeSVG value={upiUri} size={104} />
              </div>
              <div className="flex-1 space-y-2">
                <p className="text-xs font-bold text-slate-800">
                  Scan & Pay ₹{Math.round(totalAmount)} via UPI
                </p>
                <p className="font-mono text-xs text-slate-600">UPI ID: {appConfig.upiId}</p>
                <input
                  type="text"
                  value={upiRef}
                  onChange={(e) => setUpiRef(e.target.value)}
                  placeholder="Optional UTR / Transaction Ref"
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs focus:border-brand-500 focus:outline-none"
                />
              </div>
            </div>
          )}

          {paymentMethod === 'CARD' && (
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3.5">
              <label className="mb-1 block text-xs font-semibold text-slate-600">
                Card Last 4 Digits (for receipt verification)
              </label>
              <input
                type="text"
                inputMode="numeric"
                maxLength={4}
                value={cardLast4}
                onChange={(e) => setCardLast4(e.target.value.replace(/\D/g, '').slice(0, 4))}
                placeholder="e.g. 4242"
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 font-mono text-sm focus:border-brand-500 focus:outline-none"
              />
            </div>
          )}

          <div className="flex items-center justify-between rounded-xl bg-navy-900 px-4 py-3 text-white">
            <div>
              <p className="text-xs text-slate-300">Total Payable</p>
              <p className="text-xl font-extrabold">₹{Math.round(totalAmount)}</p>
            </div>
            <button
              type="submit"
              disabled={submitting}
              className="min-h-[46px] rounded-xl bg-brand-600 px-5 py-2.5 text-sm font-bold text-white shadow transition hover:bg-brand-500 disabled:opacity-60"
            >
              {submitting ? 'Confirming...' : 'Confirm Booking'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
