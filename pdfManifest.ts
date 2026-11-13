import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Booking, BusRoute } from '../types/bus';
import { MAHAVEER_HELPLINE } from './defaults';

export function downloadPassengerManifestPdf(
  bus: BusRoute,
  bookings: Booking[],
  travelDate: string
): void {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

  doc.setFillColor(15, 23, 42);
  doc.rect(0, 0, 210, 32, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text('MAHAVEER TRAVELS, VIDISHA - PASSENGER MANIFEST', 14, 14);

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(
    `Route: ${bus.fromCity} -> ${bus.toCity}  |  Bus: ${bus.busNumber} (${bus.busType})  |  Helpline: ${MAHAVEER_HELPLINE}`,
    14,
    21
  );
  doc.text(
    `Date: ${travelDate}  |  Departure: ${bus.departureTime}  |  Arrival: ${bus.arrivalTime}`,
    14,
    27
  );

  const activeBookings = bookings.filter((b) => b.bookingStatus !== 'CANCELLED');
  const totalSeatsBooked = activeBookings.reduce((sum, b) => sum + b.seatNumbers.length, 0);
  const totalRevenue = activeBookings.reduce((sum, b) => sum + b.totalAmount, 0);

  doc.setTextColor(30, 41, 59);
  doc.setFontSize(10);
  doc.text(
    `Active Bookings: ${activeBookings.length}  |  Booked Seats: ${totalSeatsBooked}/${bus.totalSeats}  |  Total Fare: Rs. ${Math.round(totalRevenue)}`,
    14,
    40
  );

  const rows = bookings.map((b, index) => [
    String(index + 1),
    b.bookingId,
    `${b.passengerName}\n(${b.passengerGender})`,
    b.passengerPhone,
    b.seatNumbers.join(', '),
    `${b.pickupPoint} -> ${b.dropPoint}`,
    `Rs. ${Math.round(b.totalAmount)}\n${b.paymentMethod}`,
    b.bookingStatus,
  ]);

  autoTable(doc, {
    startY: 45,
    head: [['#', 'Booking ID', 'Passenger', 'Mobile', 'Seats', 'Boarding -> Drop', 'Payment', 'Status']],
    body: rows.length > 0 ? rows : [['-', 'No bookings found for this bus and travel date.', '', '', '', '', '', '']],
    styles: { fontSize: 8, cellPadding: 2.5, valign: 'middle' },
    headStyles: { fillColor: [234, 88, 12], textColor: 255, fontStyle: 'bold' },
    alternateRowStyles: { fillColor: [248, 250, 252] },
    margin: { left: 10, right: 10 },
  });

  const safeDate = travelDate.replace(/[^a-zA-Z0-9_-]/g, '');
  doc.save(`Mahaveer_Manifest_${bus.id}_${safeDate}.pdf`);
}
