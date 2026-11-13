import React from 'react';
import { SeatUiModel } from '../types/bus';

interface SeatMapProps {
  seats: SeatUiModel[];
  selectedSeats: string[];
  onToggleSeat: (seat: SeatUiModel) => void;
  adminMode?: boolean;
}

export const SeatMap: React.FC<SeatMapProps> = ({
  seats,
  selectedSeats,
  onToggleSeat,
  adminMode = false,
}) => {
  const rows: SeatUiModel[][] = [];
  for (let i = 0; i < seats.length; i += 4) {
    rows.push(seats.slice(i, i + 4));
  }

  const getSeatStyles = (seat: SeatUiModel, isSelected: boolean): string => {
    if (seat.isBooked) {
      if (seat.bookingId === 'ADMIN_BLOCK') {
        return 'border-slate-400 bg-slate-300 text-slate-700';
      }
      if (seat.bookedGender === 'FEMALE' || seat.isLadiesSeat) {
        return 'border-pink-300 bg-pink-200 text-pink-900';
      }
      return 'border-slate-300 bg-slate-200 text-slate-500';
    }
    if (isSelected) {
      return 'border-brand-700 bg-brand-600 text-white shadow-md ring-2 ring-brand-300';
    }
    if (seat.isLadiesSeat) {
      return 'border-pink-400 bg-pink-50 text-pink-700 hover:bg-pink-100';
    }
    return 'border-emerald-400 bg-emerald-50 text-emerald-800 hover:bg-emerald-100';
  };

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
      {/* Legend */}
      <div className="mb-4 flex flex-wrap items-center gap-3 border-b border-slate-100 pb-3 text-xs font-medium text-slate-600">
        <span className="inline-flex items-center gap-1.5">
          <span className="h-4 w-4 rounded border border-emerald-400 bg-emerald-50" />
          Vacant
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="h-4 w-4 rounded border border-pink-400 bg-pink-50" />
          Ladies (1A–2B)
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="h-4 w-4 rounded border border-brand-700 bg-brand-600" />
          Selected
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="h-4 w-4 rounded border border-slate-300 bg-slate-200" />
          Booked / Blocked
        </span>
      </div>

      {/* Bus Front / Driver Indicator */}
      <div className="mx-auto max-w-xs rounded-2xl border-2 border-slate-200 bg-slate-50/60 p-4">
        <div className="mb-4 flex items-center justify-between border-b border-dashed border-slate-300 pb-3">
          <span className="rounded-md bg-slate-200 px-2 py-1 text-[11px] font-bold uppercase tracking-wider text-slate-600">
            Entry Door
          </span>
          <div className="flex items-center gap-1.5 rounded-lg bg-navy-900 px-2.5 py-1 text-[11px] font-bold text-white">
            <span className="inline-block h-2 w-2 rounded-full bg-brand-500" />
            Driver
          </div>
        </div>

        {/* 2x2 Seat Grid */}
        <div className="space-y-2.5">
          {rows.map((rowSeats, rowIndex) => {
            const left = rowSeats.slice(0, 2);
            const right = rowSeats.slice(2, 4);
            return (
              <div key={rowIndex} className="grid grid-cols-5 items-center gap-2">
                {left.map((seat) => {
                  const selected = selectedSeats.includes(seat.seatNumber);
                  const disabled = !adminMode && seat.isBooked;
                  return (
                    <button
                      key={seat.seatNumber}
                      type="button"
                      disabled={disabled}
                      onClick={() => onToggleSeat(seat)}
                      title={
                        seat.isBooked
                          ? `${seat.seatNumber} (${seat.bookingId === 'ADMIN_BLOCK' ? 'Admin Blocked' : 'Booked'})`
                          : `${seat.seatNumber}${seat.isLadiesSeat ? ' - Ladies Quota' : ''}`
                      }
                      className={`flex min-h-[44px] flex-col items-center justify-center rounded-xl border-2 text-xs font-bold transition active:scale-95 disabled:cursor-not-allowed ${getSeatStyles(
                        seat,
                        selected
                      )}`}
                    >
                      <span>{seat.seatNumber}</span>
                      <span className="text-[9px] font-semibold opacity-80">
                        {seat.isBooked
                          ? seat.bookingId === 'ADMIN_BLOCK'
                            ? 'BLK'
                            : 'BKD'
                          : seat.isLadiesSeat
                            ? 'LDY'
                            : 'AVL'}
                      </span>
                    </button>
                  );
                })}

                {/* Center Aisle */}
                <div className="text-center text-[10px] font-bold text-slate-300">
                  R{rowIndex + 1}
                </div>

                {right.map((seat) => {
                  const selected = selectedSeats.includes(seat.seatNumber);
                  const disabled = !adminMode && seat.isBooked;
                  return (
                    <button
                      key={seat.seatNumber}
                      type="button"
                      disabled={disabled}
                      onClick={() => onToggleSeat(seat)}
                      title={
                        seat.isBooked
                          ? `${seat.seatNumber} (${seat.bookingId === 'ADMIN_BLOCK' ? 'Admin Blocked' : 'Booked'})`
                          : `${seat.seatNumber}${seat.isLadiesSeat ? ' - Ladies Quota' : ''}`
                      }
                      className={`flex min-h-[44px] flex-col items-center justify-center rounded-xl border-2 text-xs font-bold transition active:scale-95 disabled:cursor-not-allowed ${getSeatStyles(
                        seat,
                        selected
                      )}`}
                    >
                      <span>{seat.seatNumber}</span>
                      <span className="text-[9px] font-semibold opacity-80">
                        {seat.isBooked
                          ? seat.bookingId === 'ADMIN_BLOCK'
                            ? 'BLK'
                            : 'BKD'
                          : seat.isLadiesSeat
                            ? 'LDY'
                            : 'AVL'}
                      </span>
                    </button>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
