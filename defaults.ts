import { AppConfig, BusRoute, SeatLock, SeatUiModel, TravelDateOption } from '../types/bus';

export const BOOTSTRAP_ADMIN_EMAIL = 'ankit207311@gmail.com';
export const PRIMARY_CONFIG_ID = 'PRIMARY_CONFIG';
export const MAHAVEER_HELPLINE = '9302182141';
export const LADIES_QUOTA_SEATS = new Set(['1A', '1B', '2A', '2B']);

export const DEFAULT_APP_CONFIG: AppConfig = {
  id: PRIMARY_CONFIG_ID,
  upiId: '9302182141@upi',
  merchantName: 'Mahaveer Travels, Vidisha',
  supportPhone: '9302182141',
  supportEmail: 'mahaveertravels.vidisha@gmail.com',
  announcement:
    'Daily AC Seater Deluxe (Vidisha – Indore – Vidisha). Pink seats (1A, 1B, 2A, 2B) reserved for ladies. Helpline: 9302182141',
  isCardPaymentEnabled: true,
  isQrPaymentEnabled: true,
};

export const DEFAULT_BUSES: BusRoute[] = [
  {
    id: 'BUS_VI_01',
    busNumber: 'MP-40-PA-2141',
    operatorName: 'Mahaveer Travels, Vidisha',
    fromCity: 'Vidisha',
    toCity: 'Indore',
    departureTime: '06:30 AM',
    arrivalTime: '11:30 AM',
    duration: '5h 00m',
    fare: 380,
    busType: 'AC Seater Deluxe',
    totalSeats: 32,
    status: 'ON_TIME',
    amenities: 'AC Seater Deluxe, Pushback Seats, USB Charging, Mineral Water, Live Seat Sync',
    pickupPoints: 'Mahaveer Travels Office (Vidisha Bus Stand), Mandi Bambora Road, Sanchi Bypass',
    dropPoints: 'Dewas Naka, Vijay Nagar Square, Radisson Square, Sarwate Bus Stand Indore',
    isMorningBus: true,
    isActive: true,
  },
  {
    id: 'BUS_IV_01',
    busNumber: 'MP-40-PA-2141',
    operatorName: 'Mahaveer Travels, Vidisha',
    fromCity: 'Indore',
    toCity: 'Vidisha',
    departureTime: '04:30 PM',
    arrivalTime: '09:30 PM',
    duration: '5h 00m',
    fare: 380,
    busType: 'AC Seater Deluxe',
    totalSeats: 32,
    status: 'BOARDING',
    amenities: 'AC Seater Deluxe, Pushback Seats, USB Charging, Mineral Water, Live Seat Sync',
    pickupPoints: 'Sarwate Bus Stand Indore, Vijay Nagar Bus Depot, Dewas Bypass',
    dropPoints: 'Sanchi Bypass, Mandi Bambora Road, Vidisha Main Bus Stand',
    isMorningBus: false,
    isActive: true,
  },
  {
    id: 'BUS_VI_02',
    busNumber: 'MP-40-PA-2142',
    operatorName: 'Mahaveer Travels, Vidisha',
    fromCity: 'Vidisha',
    toCity: 'Indore',
    departureTime: '05:00 PM',
    arrivalTime: '10:00 PM',
    duration: '5h 00m',
    fare: 420,
    busType: 'AC Seater Deluxe',
    totalSeats: 32,
    status: 'ON_TIME',
    amenities: 'AC Seater Deluxe, Reclining Seats, Reading Lamp, Charging Port, Water Bottle',
    pickupPoints: 'Mahaveer Travels Office (Vidisha Bus Stand), Ahmedpur Chouraha, Sanchi Bypass',
    dropPoints: 'Dewas Bypass, Radisson Square, Sarwate Bus Stand Indore',
    isMorningBus: false,
    isActive: true,
  },
  {
    id: 'BUS_IV_02',
    busNumber: 'MP-40-PA-2142',
    operatorName: 'Mahaveer Travels, Vidisha',
    fromCity: 'Indore',
    toCity: 'Vidisha',
    departureTime: '08:00 AM',
    arrivalTime: '01:00 PM',
    duration: '5h 00m',
    fare: 420,
    busType: 'AC Seater Deluxe',
    totalSeats: 32,
    status: 'ON_TIME',
    amenities: 'AC Seater Deluxe, Reclining Seats, Reading Lamp, Charging Port, Water Bottle',
    pickupPoints: 'Sarwate Bus Stand Indore, Radisson Square, Dewas Toll',
    dropPoints: 'Sanchi Road, Vidisha Railway Station Link, Vidisha Main Bus Stand',
    isMorningBus: true,
    isActive: true,
  },
];

export function buildSeatLayout(locks: SeatLock[], totalSeats = 32): SeatUiModel[] {
  const lockMap = new Map(locks.map((lock) => [lock.seatNumber, lock]));
  const cols = ['A', 'B', 'C', 'D'];
  const rows = Math.max(8, Math.floor(totalSeats / 4));
  const seats: SeatUiModel[] = [];

  for (let row = 1; row <= rows; row++) {
    for (const col of cols) {
      const seatNumber = `${row}${col}`;
      const lock = lockMap.get(seatNumber);
      seats.push({
        seatNumber,
        isLadiesSeat: LADIES_QUOTA_SEATS.has(seatNumber),
        isBooked: Boolean(lock),
        bookedGender: lock?.gender,
        bookedByUserId: lock?.bookedByUserId,
        bookingId: lock?.bookingId,
      });
    }
  }
  return seats;
}

export function getTravelDateOptions(days = 7): TravelDateOption[] {
  const options: TravelDateOption[] = [];
  const base = new Date();
  const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  for (let i = 0; i < days; i++) {
    const d = new Date(base.getFullYear(), base.getMonth(), base.getDate() + i);
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    const isoDate = `${yyyy}-${mm}-${dd}`;
    const shortLabel = i === 0 ? 'Today' : i === 1 ? 'Tomorrow' : `${weekdays[d.getDay()]}`;
    const subLabel = `${dd} ${months[d.getMonth()]}`;
    options.push({ isoDate, shortLabel, subLabel });
  }
  return options;
}

export function splitPoints(csv: string): string[] {
  return csv
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
}
