import { Booking } from '../types/bus';
import { MAHAVEER_HELPLINE } from './defaults';

export function formatWhatsAppConfirmationMessage(booking: Booking): string {
  const seats = booking.seatNumbers.join(', ');
  return [
    '*MAHAVEER TRAVELS - EASY TICKET*',
    `Booking ID: *${booking.bookingId}*`,
    `Status: ${booking.bookingStatus}`,
    '------------------------------',
    `Route: ${booking.fromCity} -> ${booking.toCity}`,
    `Date: ${booking.travelDate}`,
    `Timing: ${booking.departureTime} - ${booking.arrivalTime}`,
    `Bus: AC Seater Deluxe (${booking.busNumber})`,
    `Seats: *${seats}*`,
    `Passenger: ${booking.passengerName} (${booking.passengerGender})`,
    `Mobile: ${booking.passengerPhone}`,
    `Pickup: ${booking.pickupPoint}`,
    `Drop: ${booking.dropPoint}`,
    `Amount: Rs. ${Math.round(booking.totalAmount)} (${booking.paymentMethod})`,
    '------------------------------',
    `Helpline: ${MAHAVEER_HELPLINE}`,
  ].join('\n');
}

export function buildWhatsAppBookingUrl(booking: Booking, operatorPhone = MAHAVEER_HELPLINE): string {
  const digits = operatorPhone.replace(/\D/g, '').slice(-10) || MAHAVEER_HELPLINE;
  const text = encodeURIComponent(formatWhatsAppConfirmationMessage(booking));
  return `https://wa.me/91${digits}?text=${text}`;
}

export function buildWhatsAppPassengerUrl(booking: Booking): string {
  const digits = booking.passengerPhone.replace(/\D/g, '').slice(-10);
  const text = encodeURIComponent(formatWhatsAppConfirmationMessage(booking));
  return digits.length === 10
    ? `https://wa.me/91${digits}?text=${text}`
    : `https://wa.me/?text=${text}`;
}

export function buildWhatsAppShareUrl(url: string): string {
  const text = encodeURIComponent(
    `Book Mahaveer Travels Vidisha – Indore – Vidisha AC Seater Deluxe bus tickets online with Easy Ticket:\n${url}\nHelpline: ${MAHAVEER_HELPLINE}`
  );
  return `https://wa.me/?text=${text}`;
}
