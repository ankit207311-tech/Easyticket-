import { useEffect, useMemo, useState } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import {
  ArrowLeft,
  ArrowLeftRight,
  Calendar,
  LogIn,
  Megaphone,
  Phone,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';
import { auth } from './lib/firebase';
import {
  DEFAULT_APP_CONFIG,
  DEFAULT_BUSES,
  getTravelDateOptions,
  MAHAVEER_HELPLINE,
} from './lib/defaults';
import { buildSeatLayout } from './lib/defaults';
import {
  blockSeatByAdmin,
  cancelBooking,
  checkIsAdmin,
  completeRedirectSignIn,
  createBooking,
  deleteBus,
  releaseSeatLockByAdmin,
  saveAppConfig,
  saveBus,
  seedInitialDataIfAdmin,
  signInWithGoogle,
  signOutUser,
  subscribeActiveBuses,
  subscribeAllBookingsForAdmin,
  subscribeAllBusesForAdmin,
  subscribeAppConfig,
  subscribeMyBookings,
  subscribeSeatLocksForDate,
  updateBookingStatusByAdmin,
} from './services/busService';
import {
  AppConfig,
  Booking,
  BusRoute,
  SeatLock,
  SeatUiModel,
} from './types/bus';
import { AppTab, Navbar } from './components/Navbar';
import { BusCard } from './components/BusCard';
import { SeatMap } from './components/SeatMap';
import { BookingCheckoutModal } from './components/BookingCheckoutModal';
import { TicketConfirmationModal } from './components/TicketConfirmationModal';
import { MyBookingsView } from './components/MyBookingsView';
import { AdminDashboardView } from './components/AdminDashboardView';
import { ShareAppModal } from './components/ShareAppModal';

export function App() {
  const dateOptions = useMemo(() => getTravelDateOptions(7), []);
  const [selectedDate, setSelectedDate] = useState<string>(dateOptions[0].isoDate);
  const [routeFilter, setRouteFilter] = useState<'ALL' | 'V_TO_I' | 'I_TO_V'>('ALL');
  const [activeTab, setActiveTab] = useState<AppTab>('BOOK');

  const [user, setUser] = useState<User | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  const [activeBuses, setActiveBuses] = useState<BusRoute[]>(DEFAULT_BUSES);
  const [adminBuses, setAdminBuses] = useState<BusRoute[]>(DEFAULT_BUSES);
  const [seatLocks, setSeatLocks] = useState<SeatLock[]>([]);
  const [myBookings, setMyBookings] = useState<Booking[]>([]);
  const [allBookings, setAllBookings] = useState<Booking[]>([]);
  const [appConfig, setAppConfig] = useState<AppConfig>(DEFAULT_APP_CONFIG);

  const [seatSelectionBus, setSeatSelectionBus] = useState<BusRoute | null>(null);
  const [selectedSeats, setSelectedSeats] = useState<string[]>([]);
  const [showCheckout, setShowCheckout] = useState(false);
  const [submittingBooking, setSubmittingBooking] = useState(false);
  const [confirmedBooking, setConfirmedBooking] = useState<Booking | null>(null);
  const [showShareModal, setShowShareModal] = useState(false);
  const [toast, setToast] = useState<string>('');

  const showToast = (msg: string) => {
    setToast(msg);
    window.setTimeout(() => setToast(''), 4000);
  };

  useEffect(() => {
    completeRedirectSignIn().catch(() => {});
    const unsub = onAuthStateChanged(auth, async (nextUser) => {
      setUser(nextUser);
      setAuthReady(true);
      if (nextUser) {
        const adminFlag = await checkIsAdmin(nextUser);
        setIsAdmin(adminFlag);
        if (adminFlag) {
          seedInitialDataIfAdmin(nextUser).catch(() => {});
        }
      } else {
        setIsAdmin(false);
        setActiveBuses(DEFAULT_BUSES);
        setSeatLocks([]);
        setMyBookings([]);
        setAllBookings([]);
      }
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    if (!user) return;
    const unsubs = [
      subscribeActiveBuses(
        (list) => setActiveBuses(list.length > 0 ? list : DEFAULT_BUSES),
        (err) => showToast(err.message)
      ),
      subscribeSeatLocksForDate(
        selectedDate,
        (locks) => setSeatLocks(locks),
        (err) => showToast(err.message)
      ),
      subscribeMyBookings(
        user.uid,
        (list) => setMyBookings(list),
        (err) => showToast(err.message)
      ),
      subscribeAppConfig(
        (cfg) => setAppConfig(cfg),
        () => {}
      ),
    ];
    return () => unsubs.forEach((u) => u());
  }, [user, selectedDate]);

  useEffect(() => {
    if (!user || !isAdmin) return;
    const unsubs = [
      subscribeAllBusesForAdmin(
        (list) => setAdminBuses(list),
        (err) => showToast(err.message)
      ),
      subscribeAllBookingsForAdmin(
        (list) => setAllBookings(list),
        (err) => showToast(err.message)
      ),
    ];
    return () => unsubs.forEach((u) => u());
  }, [user, isAdmin]);

  const handleSignIn = async () => {
    try {
      await signInWithGoogle();
    } catch (err: unknown) {
      showToast((err as Error)?.message || 'Google Sign-In cancelled or blocked.');
    }
  };

  const handleOpenBusSeats = (bus: BusRoute) => {
    if (!user) {
      showToast('Please sign in with Google to view live seats and book.');
      handleSignIn();
      return;
    }
    setSeatSelectionBus(bus);
    setSelectedSeats([]);
  };

  const handleToggleSeat = (seat: SeatUiModel) => {
    if (seat.isBooked) return;
    setSelectedSeats((prev) => {
      if (prev.includes(seat.seatNumber)) {
        return prev.filter((s) => s !== seat.seatNumber);
      }
      if (prev.length >= 4) {
        showToast('You can book up to 4 seats per ticket.');
        return prev;
      }
      return [...prev, seat.seatNumber];
    });
  };

  const filteredBuses = useMemo(() => {
    return activeBuses.filter((b) => {
      if (routeFilter === 'V_TO_I') {
        return b.fromCity.toLowerCase().includes('vidisha');
      }
      if (routeFilter === 'I_TO_V') {
        return b.fromCity.toLowerCase().includes('indore');
      }
      return true;
    });
  }, [activeBuses, routeFilter]);

  const seatModelsForSelectedBus = useMemo(() => {
    if (!seatSelectionBus) return [];
    const locks = seatLocks.filter(
      (l) => l.busId === seatSelectionBus.id && l.travelDate === selectedDate
    );
    return buildSeatLayout(locks, seatSelectionBus.totalSeats);
  }, [seatSelectionBus, seatLocks, selectedDate]);

  const helpline = appConfig.supportPhone || MAHAVEER_HELPLINE;

  return (
    <div className="min-h-screen bg-slate-50 pb-24 md:pb-12">
      <Navbar
        activeTab={activeTab}
        onTabChange={(tab) => {
          setActiveTab(tab);
          setSeatSelectionBus(null);
        }}
        user={user}
        isAdmin={isAdmin}
        supportPhone={helpline}
        onSignIn={handleSignIn}
        onSignOut={() => signOutUser()}
        onOpenShare={() => setShowShareModal(true)}
      />

      {toast && (
        <div className="fixed left-1/2 top-20 z-50 w-[92%] max-w-md -translate-x-1/2 rounded-2xl bg-navy-900 px-4 py-3 text-center text-xs font-bold text-white shadow-xl">
          {toast}
        </div>
      )}

      <main className="mx-auto max-w-6xl px-4 pt-5 sm:pt-7">
        {/* BOOKING VIEW */}
        {activeTab === 'BOOK' && !seatSelectionBus && (
          <div className="space-y-5">
            {/* Hero Banner */}
            <section className="overflow-hidden rounded-3xl bg-gradient-to-br from-navy-900 via-slate-900 to-brand-900 p-5 text-white shadow-lg sm:p-7">
              <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
                <div className="space-y-2">
                  <div className="inline-flex items-center gap-1.5 rounded-full bg-brand-600/25 px-3 py-1 text-xs font-bold text-brand-200">
                    <Sparkles className="h-3.5 w-3.5" />
                    Daily AC Seater Deluxe Service
                  </div>
                  <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl">
                    Vidisha ⇄ Indore Bus Booking
                  </h1>
                  <p className="max-w-xl text-xs text-slate-300 sm:text-sm">
                    {appConfig.announcement}
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2.5">
                  <a
                    href={`tel:${helpline}`}
                    className="inline-flex min-h-[44px] items-center gap-2 rounded-xl bg-white/10 px-4 py-2 text-xs font-bold text-white backdrop-blur transition hover:bg-white/20"
                  >
                    <Phone className="h-4 w-4 text-brand-400" />
                    Helpline: {helpline}
                  </a>
                  {!user && authReady && (
                    <button
                      type="button"
                      onClick={handleSignIn}
                      className="inline-flex min-h-[44px] items-center gap-2 rounded-xl bg-brand-600 px-4 py-2 text-xs font-bold text-white shadow transition hover:bg-brand-500"
                    >
                      <LogIn className="h-4 w-4" />
                      Sign In for Live Seats
                    </button>
                  )}
                </div>
              </div>
            </section>

            {/* Announcement / Live Sync Pill */}
            <div className="flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-xs">
              <span className="flex items-center gap-2 font-semibold text-slate-700">
                <Megaphone className="h-4 w-4 text-brand-600" />
                {user
                  ? 'Live Firestore Seat Sync Active — Seats update across all passengers instantly.'
                  : 'Previewing daily schedules. Sign in with Google to view live seat locks and book.'}
              </span>
              {user && (
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 font-bold text-emerald-700">
                  <ShieldCheck className="h-3.5 w-3.5" />
                  Secured Cloud Sync
                </span>
              )}
            </div>

            {/* Route & Date Filters */}
            <section className="space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex gap-1.5 rounded-xl bg-slate-200/70 p-1">
                  {[
                    { id: 'ALL' as const, label: 'All Buses' },
                    { id: 'V_TO_I' as const, label: 'Vidisha → Indore' },
                    { id: 'I_TO_V' as const, label: 'Indore → Vidisha' },
                  ].map((tab) => (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setRouteFilter(tab.id)}
                      className={`inline-flex min-h-[38px] items-center gap-1.5 rounded-lg px-3 text-xs font-bold transition ${
                        routeFilter === tab.id
                          ? 'bg-white text-slate-900 shadow-sm'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      {tab.id === 'ALL' && <ArrowLeftRight className="h-3.5 w-3.5" />}
                      {tab.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Date Strip */}
              <div className="flex gap-2 overflow-x-auto pb-1">
                {dateOptions.map((d) => {
                  const active = d.isoDate === selectedDate;
                  return (
                    <button
                      key={d.isoDate}
                      type="button"
                      onClick={() => setSelectedDate(d.isoDate)}
                      className={`flex min-w-[92px] shrink-0 flex-col items-center rounded-2xl border px-3 py-2.5 transition ${
                        active
                          ? 'border-brand-600 bg-brand-600 text-white shadow-sm'
                          : 'border-slate-200 bg-white text-slate-700 hover:border-brand-300'
                      }`}
                    >
                      <span className="flex items-center gap-1 text-xs font-bold">
                        <Calendar className="h-3 w-3" />
                        {d.shortLabel}
                      </span>
                      <span
                        className={`text-[11px] font-medium ${
                          active ? 'text-brand-100' : 'text-slate-500'
                        }`}
                      >
                        {d.subLabel}
                      </span>
                    </button>
                  );
                })}
              </div>
            </section>

            {/* Bus List */}
            <section className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {filteredBuses.map((bus) => {
                const lockedCount = seatLocks.filter(
                  (l) => l.busId === bus.id && l.travelDate === selectedDate
                ).length;
                const available = Math.max(0, bus.totalSeats - lockedCount);
                return (
                  <BusCard
                    key={bus.id}
                    bus={bus}
                    availableSeats={available}
                    isLiveSynced={Boolean(user)}
                    onSelectSeats={handleOpenBusSeats}
                  />
                );
              })}
            </section>
          </div>
        )}

        {/* SEAT SELECTION VIEW */}
        {activeTab === 'BOOK' && seatSelectionBus && (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setSeatSelectionBus(null);
                    setSelectedSeats([]);
                  }}
                  className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-700 hover:bg-slate-200"
                  aria-label="Back to buses"
                >
                  <ArrowLeft className="h-5 w-5" />
                </button>
                <div>
                  <h2 className="text-base font-extrabold text-slate-900 sm:text-lg">
                    {seatSelectionBus.fromCity} → {seatSelectionBus.toCity}
                  </h2>
                  <p className="text-xs font-medium text-slate-500">
                    {selectedDate} • {seatSelectionBus.departureTime} •{' '}
                    {seatSelectionBus.busNumber} • ₹{seatSelectionBus.fare}/seat
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-5 lg:grid-cols-12">
              <div className="lg:col-span-7">
                <SeatMap
                  seats={seatModelsForSelectedBus}
                  selectedSeats={selectedSeats}
                  onToggleSeat={handleToggleSeat}
                />
              </div>

              <div className="lg:col-span-5">
                <div className="sticky top-24 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                  <h3 className="text-base font-extrabold text-slate-900">
                    Selected Seats Summary
                  </h3>
                  <p className="mt-1 text-xs text-slate-500">
                    Tap vacant green or pink ladies seats to choose up to 4 seats.
                  </p>

                  <div className="mt-4 rounded-xl bg-slate-50 p-4">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium text-slate-600">Seats</span>
                      <span className="font-extrabold text-brand-600">
                        {selectedSeats.length > 0 ? selectedSeats.join(', ') : 'None selected'}
                      </span>
                    </div>
                    <div className="mt-2 flex items-center justify-between text-sm">
                      <span className="font-medium text-slate-600">Total Fare</span>
                      <span className="text-lg font-extrabold text-slate-900">
                        ₹{Math.round(seatSelectionBus.fare * selectedSeats.length)}
                      </span>
                    </div>
                  </div>

                  <button
                    type="button"
                    disabled={selectedSeats.length === 0}
                    onClick={() => setShowCheckout(true)}
                    className="mt-4 min-h-[48px] w-full rounded-xl bg-brand-600 px-4 py-3 text-sm font-bold text-white shadow transition hover:bg-brand-500 disabled:cursor-not-allowed disabled:bg-slate-300"
                  >
                    Continue to Passenger Details
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* MY BOOKINGS VIEW */}
        {activeTab === 'BOOKINGS' && (
          <MyBookingsView
            user={user}
            bookings={myBookings}
            supportPhone={helpline}
            onSignIn={handleSignIn}
            onCancelBooking={async (b) => {
              await cancelBooking(b);
              showToast(`Booking ${b.bookingId} cancelled & seats released.`);
            }}
            onOpenTicket={(b) => setConfirmedBooking(b)}
          />
        )}

        {/* ADMIN DASHBOARD VIEW */}
        {activeTab === 'ADMIN' && (
          <AdminDashboardView
            user={user}
            isAdmin={isAdmin}
            buses={adminBuses.length > 0 ? adminBuses : activeBuses}
            allBookings={allBookings}
            seatLocks={seatLocks}
            selectedDate={selectedDate}
            onSelectDate={setSelectedDate}
            appConfig={appConfig}
            onSignIn={handleSignIn}
            onUpdateBookingStatus={async (b, status) => {
              await updateBookingStatusByAdmin(b, status);
              showToast(`Booking ${b.bookingId} updated to ${status}.`);
            }}
            onBlockSeat={async (busId, date, seat) => {
              await blockSeatByAdmin(busId, date, seat);
              showToast(`Seat ${seat} blocked for ${date}.`);
            }}
            onReleaseSeat={async (busId, date, seat) => {
              await releaseSeatLockByAdmin(busId, date, seat);
              showToast(`Seat ${seat} released.`);
            }}
            onSaveBus={async (bus) => {
              await saveBus(bus);
              showToast(`Bus ${bus.busNumber} saved.`);
            }}
            onDeleteBus={async (busId) => {
              await deleteBus(busId);
              showToast(`Bus ${busId} removed.`);
            }}
            onSaveConfig={async (cfg) => {
              await saveAppConfig(cfg);
              showToast('UPI QR & helpline configuration updated.');
            }}
            onSeedDefaults={async () => {
              await seedInitialDataIfAdmin(user);
              showToast('Default Mahaveer Travels fleet synced.');
            }}
          />
        )}
      </main>

      {showCheckout && seatSelectionBus && (
        <BookingCheckoutModal
          bus={seatSelectionBus}
          travelDate={selectedDate}
          selectedSeats={selectedSeats}
          appConfig={appConfig}
          defaultName={user?.displayName || ''}
          submitting={submittingBooking}
          onClose={() => setShowCheckout(false)}
          onConfirm={async (payload) => {
            setSubmittingBooking(true);
            try {
              const booking = await createBooking({
                bus: seatSelectionBus,
                travelDate: selectedDate,
                passengerName: payload.passengerName,
                passengerPhone: payload.passengerPhone,
                passengerGender: payload.passengerGender,
                selectedSeats,
                paymentMethod: payload.paymentMethod,
                paymentReference: payload.paymentReference,
                pickupPoint: payload.pickupPoint,
                dropPoint: payload.dropPoint,
              });
              setShowCheckout(false);
              setSeatSelectionBus(null);
              setSelectedSeats([]);
              setConfirmedBooking(booking);
              showToast(`Booking ${booking.bookingId} confirmed!`);
            } finally {
              setSubmittingBooking(false);
            }
          }}
        />
      )}

      {confirmedBooking && (
        <TicketConfirmationModal
          booking={confirmedBooking}
          supportPhone={helpline}
          onClose={() => setConfirmedBooking(null)}
        />
      )}

      {showShareModal && (
        <ShareAppModal onClose={() => setShowShareModal(false)} />
      )}
    </div>
  );
}

export default App;
