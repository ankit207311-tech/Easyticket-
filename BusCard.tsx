import React from 'react';
import { ArrowRight, BusFront, Clock, MapPin, Snowflake, Users } from 'lucide-react';
import { BusRoute } from '../types/bus';

interface BusCardProps {
  bus: BusRoute;
  availableSeats: number;
  isLiveSynced: boolean;
  onSelectSeats: (bus: BusRoute) => void;
}

const statusColors: Record<string, string> = {
  ON_TIME: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  BOARDING: 'bg-amber-50 text-amber-700 border-amber-200',
  DELAYED: 'bg-rose-50 text-rose-700 border-rose-200',
  DEPARTED: 'bg-slate-100 text-slate-600 border-slate-200',
};

export const BusCard: React.FC<BusCardProps> = ({
  bus,
  availableSeats,
  isLiveSynced,
  onSelectSeats,
}) => {
  const soldOut = isLiveSynced && availableSeats <= 0;

  return (
    <article className="group rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:border-brand-300 hover:shadow-md sm:p-5">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="flex items-center gap-2.5">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
            <BusFront className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900 sm:text-base">
              {bus.operatorName}
            </h3>
            <p className="text-xs font-medium text-slate-500">
              {bus.busType} • <span className="font-mono">{bus.busNumber}</span>
            </p>
          </div>
        </div>

        <span
          className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide ${
            statusColors[bus.status] || statusColors.ON_TIME
          }`}
        >
          {bus.status.replace('_', ' ')}
        </span>
      </div>

      {/* Timings & Route */}
      <div className="mt-4 grid grid-cols-3 items-center gap-2 rounded-xl bg-slate-50 p-3">
        <div>
          <p className="text-base font-extrabold text-slate-900 sm:text-lg">
            {bus.departureTime}
          </p>
          <p className="flex items-center gap-1 text-xs font-semibold text-slate-600">
            <MapPin className="h-3.5 w-3.5 text-brand-600" />
            {bus.fromCity}
          </p>
        </div>

        <div className="flex flex-col items-center text-center">
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-500">
            <Clock className="h-3 w-3" />
            {bus.duration}
          </span>
          <div className="my-1 flex w-full items-center gap-1">
            <span className="h-1.5 w-1.5 rounded-full bg-slate-400" />
            <span className="h-0.5 flex-1 bg-slate-300" />
            <ArrowRight className="h-3.5 w-3.5 text-brand-600" />
          </div>
          <span className="text-[10px] font-medium text-slate-400">Daily AC</span>
        </div>

        <div className="text-right">
          <p className="text-base font-extrabold text-slate-900 sm:text-lg">
            {bus.arrivalTime}
          </p>
          <p className="text-xs font-semibold text-slate-600">{bus.toCity}</p>
        </div>
      </div>

      {/* Amenities */}
      <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-slate-500">
        <span className="inline-flex items-center gap-1 rounded-md bg-sky-50 px-2 py-0.5 font-medium text-sky-700">
          <Snowflake className="h-3.5 w-3.5" />
          AC Seater Deluxe
        </span>
        <span className="inline-flex items-center gap-1 rounded-md bg-pink-50 px-2 py-0.5 font-medium text-pink-700">
          Pink Ladies Quota (1A–2B)
        </span>
      </div>

      {/* Footer CTA */}
      <div className="mt-4 flex items-center justify-between gap-3 border-t border-slate-100 pt-3">
        <div>
          <p className="text-lg font-extrabold text-slate-900">
            ₹{Math.round(bus.fare)}
            <span className="text-xs font-medium text-slate-500"> / seat</span>
          </p>
          <p
            className={`flex items-center gap-1 text-xs font-semibold ${
              soldOut
                ? 'text-rose-600'
                : availableSeats <= 8
                  ? 'text-amber-600'
                  : 'text-emerald-600'
            }`}
          >
            <Users className="h-3.5 w-3.5" />
            {isLiveSynced
              ? `${availableSeats} of ${bus.totalSeats} seats left`
              : `${bus.totalSeats} total seats (Sign in for live count)`}
          </p>
        </div>

        <button
          type="button"
          disabled={soldOut}
          onClick={() => onSelectSeats(bus)}
          className="min-h-[44px] rounded-xl bg-brand-600 px-4 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-brand-500 active:scale-[0.98] disabled:cursor-not-allowed disabled:bg-slate-300"
        >
          {soldOut ? 'Sold Out' : 'Select Seats'}
        </button>
      </div>
    </article>
  );
};
