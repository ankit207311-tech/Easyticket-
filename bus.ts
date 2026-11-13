import { Timestamp } from 'firebase/firestore';

export type BusStatus = 'ON_TIME' | 'BOARDING' | 'DELAYED' | 'DEPARTED';
export type Gender = 'FEMALE' | 'MALE' | 'OTHER';
export type PaymentMethod = 'CARD' | 'UPI_QR' | 'PAY_ON_BOARD';
export type BookingStatus = 'CONFIRMED' | 'CHECKED_IN' | 'CANCELLED';

export interface BusRoute {
  id: string;
  busNumber: string;
  operatorName: string;
  fromCity: string;
  toCity: string;
  departureTime: string;
  arrivalTime: string;
  duration: string;
  fare: number;
  busType: string;
  totalSeats: number;
  status: BusStatus;
  amenities: string;
  pickupPoints: string;
  dropPoints: string;
  isMorningBus: boolean;
  isActive: boolean;
  createdAt?: Timestamp | null;
  updatedAt?: Timestamp | null;
}

export interface SeatLock {
  id: string;
  busId: string;
  travelDate: string;
  seatNumber: string;
  isLadiesSeat: boolean;
  bookedByUserId: string;
  bookingId: string;
  gender: Gender;
  status: 'BOOKED';
  createdAt?: Timestamp | null;
  updatedAt?: Timestamp | null;
}

export interface Booking {
  id: string;
  bookingId: string;
  userId: string;
  busId: string;
  busNumber: string;
  operatorName: string;
  fromCity: string;
  toCity: string;
  departureTime: string;
  arrivalTime: string;
  travelDate: string;
  passengerName: string;
  passengerPhone: string;
  passengerGender: Gender;
  seatNumbers: string[];
  totalAmount: number;
  paymentMethod: PaymentMethod;
  paymentReference: string;
  bookingStatus: BookingStatus;
  pickupPoint: string;
  dropPoint: string;
  createdAt?: Timestamp | null;
  updatedAt?: Timestamp | null;
}

export interface AppConfig {
  id: string;
  upiId: string;
  merchantName: string;
  supportPhone: string;
  supportEmail: string;
  announcement: string;
  isCardPaymentEnabled: boolean;
  isQrPaymentEnabled: boolean;
  updatedAt?: Timestamp | null;
}

export interface SeatUiModel {
  seatNumber: string;
  isLadiesSeat: boolean;
  isBooked: boolean;
  bookedGender?: Gender;
  bookedByUserId?: string;
  bookingId?: string;
}

export interface TravelDateOption {
  isoDate: string;
  shortLabel: string;
  subLabel: string;
}
