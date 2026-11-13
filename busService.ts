import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  limit,
  onSnapshot,
  query,
  serverTimestamp,
  setDoc,
  Unsubscribe,
  updateDoc,
  where,
  writeBatch,
} from 'firebase/firestore';
import {
  getRedirectResult,
  signInWithPopup,
  signInWithRedirect,
  signOut,
  User,
} from 'firebase/auth';
import { auth, db, googleProvider } from '../lib/firebase';
import {
  BOOTSTRAP_ADMIN_EMAIL,
  DEFAULT_APP_CONFIG,
  DEFAULT_BUSES,
  LADIES_QUOTA_SEATS,
  PRIMARY_CONFIG_ID,
} from '../lib/defaults';
import {
  AppConfig,
  Booking,
  BookingStatus,
  BusRoute,
  Gender,
  PaymentMethod,
  SeatLock,
} from '../types/bus';

export async function signInWithGoogle(): Promise<User | null> {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    return result.user;
  } catch (err: unknown) {
    const code = (err as { code?: string })?.code ?? '';
    if (
      code === 'auth/popup-blocked' ||
      code === 'auth/operation-not-supported-in-this-environment'
    ) {
      await signInWithRedirect(auth, googleProvider);
      return null;
    }
    throw err;
  }
}

export async function completeRedirectSignIn(): Promise<User | null> {
  const result = await getRedirectResult(auth);
  return result?.user ?? null;
}

export async function signOutUser(): Promise<void> {
  await signOut(auth);
}

export async function checkIsAdmin(user: User | null): Promise<boolean> {
  if (!user) return false;
  if (
    user.email?.toLowerCase() === BOOTSTRAP_ADMIN_EMAIL.toLowerCase() &&
    user.emailVerified
  ) {
    return true;
  }
  try {
    const snap = await getDoc(doc(db, 'admins', user.uid));
    return snap.exists();
  } catch {
    return false;
  }
}

export async function seedInitialDataIfAdmin(user: User | null): Promise<boolean> {
  const isAdmin = await checkIsAdmin(user);
  if (!isAdmin) return false;

  const existingBuses = await getDocs(query(collection(db, 'buses'), limit(1)));
  if (existingBuses.empty) {
    for (const bus of DEFAULT_BUSES) {
      await setDoc(doc(db, 'buses', bus.id), {
        busNumber: bus.busNumber,
        operatorName: bus.operatorName,
        fromCity: bus.fromCity,
        toCity: bus.toCity,
        departureTime: bus.departureTime,
        arrivalTime: bus.arrivalTime,
        duration: bus.duration,
        fare: bus.fare,
        busType: bus.busType,
        totalSeats: bus.totalSeats,
        status: bus.status,
        amenities: bus.amenities,
        pickupPoints: bus.pickupPoints,
        dropPoints: bus.dropPoints,
        isMorningBus: bus.isMorningBus,
        isActive: bus.isActive,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    }
  }

  const configRef = doc(db, 'app_config', PRIMARY_CONFIG_ID);
  const configSnap = await getDoc(configRef);
  if (!configSnap.exists()) {
    await setDoc(configRef, {
      upiId: DEFAULT_APP_CONFIG.upiId,
      merchantName: DEFAULT_APP_CONFIG.merchantName,
      supportPhone: DEFAULT_APP_CONFIG.supportPhone,
      supportEmail: DEFAULT_APP_CONFIG.supportEmail,
      announcement: DEFAULT_APP_CONFIG.announcement,
      isCardPaymentEnabled: DEFAULT_APP_CONFIG.isCardPaymentEnabled,
      isQrPaymentEnabled: DEFAULT_APP_CONFIG.isQrPaymentEnabled,
      updatedAt: serverTimestamp(),
    });
  }

  return true;
}

export function subscribeActiveBuses(
  onData: (buses: BusRoute[]) => void,
  onError: (err: Error) => void
): Unsubscribe {
  const q = query(collection(db, 'buses'), where('isActive', '==', true));
  return onSnapshot(
    q,
    (snapshot) => {
      const buses: BusRoute[] = snapshot.docs.map((d) => ({
        id: d.id,
        ...(d.data() as Omit<BusRoute, 'id'>),
      }));
      buses.sort((a, b) => a.departureTime.localeCompare(b.departureTime));
      onData(buses);
    },
    (err) => onError(err)
  );
}

export function subscribeAllBusesForAdmin(
  onData: (buses: BusRoute[]) => void,
  onError: (err: Error) => void
): Unsubscribe {
  return onSnapshot(
    collection(db, 'buses'),
    (snapshot) => {
      const buses: BusRoute[] = snapshot.docs.map((d) => ({
        id: d.id,
        ...(d.data() as Omit<BusRoute, 'id'>),
      }));
      buses.sort((a, b) => a.id.localeCompare(b.id));
      onData(buses);
    },
    (err) => onError(err)
  );
}

export function subscribeSeatLocksForDate(
  travelDate: string,
  onData: (locks: SeatLock[]) => void,
  onError: (err: Error) => void
): Unsubscribe {
  const q = query(
    collection(db, 'seat_locks'),
    where('travelDate', '==', travelDate),
    where('status', '==', 'BOOKED')
  );
  return onSnapshot(
    q,
    (snapshot) => {
      const locks: SeatLock[] = snapshot.docs.map((d) => ({
        id: d.id,
        ...(d.data() as Omit<SeatLock, 'id'>),
      }));
      onData(locks);
    },
    (err) => onError(err)
  );
}

export function subscribeMyBookings(
  userId: string,
  onData: (bookings: Booking[]) => void,
  onError: (err: Error) => void
): Unsubscribe {
  const q = query(collection(db, 'bookings'), where('userId', '==', userId));
  return onSnapshot(
    q,
    (snapshot) => {
      const list: Booking[] = snapshot.docs.map((d) => ({
        id: d.id,
        ...(d.data() as Omit<Booking, 'id'>),
      }));
      list.sort((a, b) => (b.createdAt?.seconds ?? 0) - (a.createdAt?.seconds ?? 0));
      onData(list);
    },
    (err) => onError(err)
  );
}

export function subscribeAllBookingsForAdmin(
  onData: (bookings: Booking[]) => void,
  onError: (err: Error) => void
): Unsubscribe {
  return onSnapshot(
    collection(db, 'bookings'),
    (snapshot) => {
      const list: Booking[] = snapshot.docs.map((d) => ({
        id: d.id,
        ...(d.data() as Omit<Booking, 'id'>),
      }));
      list.sort((a, b) => (b.createdAt?.seconds ?? 0) - (a.createdAt?.seconds ?? 0));
      onData(list);
    },
    (err) => onError(err)
  );
}

export function subscribeAppConfig(
  onData: (config: AppConfig) => void,
  onError: (err: Error) => void
): Unsubscribe {
  return onSnapshot(
    doc(db, 'app_config', PRIMARY_CONFIG_ID),
    (snap) => {
      if (snap.exists()) {
        onData({
          id: snap.id,
          ...(snap.data() as Omit<AppConfig, 'id'>),
        });
      } else {
        onData(DEFAULT_APP_CONFIG);
      }
    },
    (err) => onError(err)
  );
}

export interface CreateBookingInput {
  bus: BusRoute;
  travelDate: string;
  passengerName: string;
  passengerPhone: string;
  passengerGender: Gender;
  selectedSeats: string[];
  paymentMethod: PaymentMethod;
  paymentReference: string;
  pickupPoint: string;
  dropPoint: string;
}

export async function createBooking(input: CreateBookingInput): Promise<Booking> {
  const user = auth.currentUser;
  if (!user) throw new Error('Please sign in with Google to confirm your booking.');

  const sortedSeats = Array.from(
    new Set(input.selectedSeats.map((s) => s.trim().toUpperCase()))
  ).sort();
  if (sortedSeats.length < 1 || sortedSeats.length > 4) {
    throw new Error('Select between 1 and 4 seats.');
  }

  const cleanName = input.passengerName.trim();
  if (cleanName.length < 2) throw new Error('Enter a valid passenger name.');

  const cleanPhone = input.passengerPhone.replace(/\D/g, '');
  if (cleanPhone.length < 10) throw new Error('Enter a valid 10-digit mobile number.');

  const timeCode = String(Date.now() % 1000000).padStart(6, '0');
  const randCode = Math.floor(100 + Math.random() * 900);
  const bookingId = `MT-${timeCode}-${randCode}`;
  const cleanRef = input.paymentReference.trim() || `REF-${timeCode}`;
  const cleanPickup = input.pickupPoint.trim() || 'Vidisha Bus Stand';
  const cleanDrop = input.dropPoint.trim() || 'Indore Terminal';
  const totalAmount = input.bus.fare * sortedSeats.length;

  const batch = writeBatch(db);
  const bookingRef = doc(db, 'bookings', bookingId);
  batch.set(bookingRef, {
    bookingId,
    userId: user.uid,
    busId: input.bus.id,
    busNumber: input.bus.busNumber,
    operatorName: input.bus.operatorName,
    fromCity: input.bus.fromCity,
    toCity: input.bus.toCity,
    departureTime: input.bus.departureTime,
    arrivalTime: input.bus.arrivalTime,
    travelDate: input.travelDate,
    passengerName: cleanName,
    passengerPhone: cleanPhone,
    passengerGender: input.passengerGender,
    seatNumbers: sortedSeats,
    totalAmount,
    paymentMethod: input.paymentMethod,
    paymentReference: cleanRef,
    bookingStatus: 'CONFIRMED',
    pickupPoint: cleanPickup,
    dropPoint: cleanDrop,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  for (const seat of sortedSeats) {
    const lockId = `${input.bus.id}_${input.travelDate}_${seat}`;
    batch.set(doc(db, 'seat_locks', lockId), {
      busId: input.bus.id,
      travelDate: input.travelDate,
      seatNumber: seat,
      isLadiesSeat: LADIES_QUOTA_SEATS.has(seat),
      bookedByUserId: user.uid,
      bookingId,
      gender: input.passengerGender,
      status: 'BOOKED',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  }

  await batch.commit();

  return {
    id: bookingId,
    bookingId,
    userId: user.uid,
    busId: input.bus.id,
    busNumber: input.bus.busNumber,
    operatorName: input.bus.operatorName,
    fromCity: input.bus.fromCity,
    toCity: input.bus.toCity,
    departureTime: input.bus.departureTime,
    arrivalTime: input.bus.arrivalTime,
    travelDate: input.travelDate,
    passengerName: cleanName,
    passengerPhone: cleanPhone,
    passengerGender: input.passengerGender,
    seatNumbers: sortedSeats,
    totalAmount,
    paymentMethod: input.paymentMethod,
    paymentReference: cleanRef,
    bookingStatus: 'CONFIRMED',
    pickupPoint: cleanPickup,
    dropPoint: cleanDrop,
  };
}

export async function cancelBooking(booking: Booking): Promise<void> {
  if (!auth.currentUser) throw new Error('Sign in required.');
  const bookingId = booking.bookingId || booking.id;
  const batch = writeBatch(db);
  batch.update(doc(db, 'bookings', bookingId), {
    bookingStatus: 'CANCELLED',
    updatedAt: serverTimestamp(),
  });
  for (const seat of booking.seatNumbers) {
    const lockId = `${booking.busId}_${booking.travelDate}_${seat}`;
    batch.delete(doc(db, 'seat_locks', lockId));
  }
  await batch.commit();
}

export async function updateBookingStatusByAdmin(
  booking: Booking,
  newStatus: BookingStatus
): Promise<void> {
  if (newStatus === 'CANCELLED') {
    await cancelBooking(booking);
    return;
  }
  const bookingId = booking.bookingId || booking.id;
  await updateDoc(doc(db, 'bookings', bookingId), {
    bookingStatus: newStatus,
    updatedAt: serverTimestamp(),
  });
}

export async function saveBus(bus: BusRoute): Promise<void> {
  const busId = bus.id.trim() || `BUS_${Date.now() % 100000}`;
  const ref = doc(db, 'buses', busId);
  const existing = await getDoc(ref);
  const commonFields = {
    busNumber: bus.busNumber.trim(),
    operatorName: bus.operatorName.trim() || 'Mahaveer Travels, Vidisha',
    fromCity: bus.fromCity.trim(),
    toCity: bus.toCity.trim(),
    departureTime: bus.departureTime.trim(),
    arrivalTime: bus.arrivalTime.trim(),
    duration: bus.duration.trim() || '5h 00m',
    fare: Number(bus.fare),
    busType: bus.busType.trim() || 'AC Seater Deluxe',
    totalSeats: Number(bus.totalSeats),
    status: bus.status,
    amenities: bus.amenities.trim(),
    pickupPoints: bus.pickupPoints.trim(),
    dropPoints: bus.dropPoints.trim(),
    isMorningBus: bus.isMorningBus,
    isActive: bus.isActive,
    updatedAt: serverTimestamp(),
  };

  if (existing.exists()) {
    await updateDoc(ref, commonFields);
  } else {
    await setDoc(ref, {
      ...commonFields,
      createdAt: serverTimestamp(),
    });
  }
}

export async function deleteBus(busId: string): Promise<void> {
  await deleteDoc(doc(db, 'buses', busId));
}

export async function saveAppConfig(config: AppConfig): Promise<void> {
  await setDoc(doc(db, 'app_config', PRIMARY_CONFIG_ID), {
    upiId: config.upiId.trim(),
    merchantName: config.merchantName.trim(),
    supportPhone: config.supportPhone.trim(),
    supportEmail: config.supportEmail.trim(),
    announcement: config.announcement.trim(),
    isCardPaymentEnabled: config.isCardPaymentEnabled,
    isQrPaymentEnabled: config.isQrPaymentEnabled,
    updatedAt: serverTimestamp(),
  });
}

export async function blockSeatByAdmin(
  busId: string,
  travelDate: string,
  seatNumber: string
): Promise<void> {
  const user = auth.currentUser;
  if (!user) throw new Error('Admin sign in required.');
  const cleanSeat = seatNumber.trim().toUpperCase();
  const lockId = `${busId}_${travelDate}_${cleanSeat}`;
  await setDoc(doc(db, 'seat_locks', lockId), {
    busId,
    travelDate,
    seatNumber: cleanSeat,
    isLadiesSeat: LADIES_QUOTA_SEATS.has(cleanSeat),
    bookedByUserId: user.uid,
    bookingId: 'ADMIN_BLOCK',
    gender: 'OTHER',
    status: 'BOOKED',
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
}

export async function releaseSeatLockByAdmin(
  busId: string,
  travelDate: string,
  seatNumber: string
): Promise<void> {
  const cleanSeat = seatNumber.trim().toUpperCase();
  const lockId = `${busId}_${travelDate}_${cleanSeat}`;
  await deleteDoc(doc(db, 'seat_locks', lockId));
}
