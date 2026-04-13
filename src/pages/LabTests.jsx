import { useState, useEffect } from "react";
import { useAppointment } from "../context/AppointmentContext";
import { useAuth } from "../context/AuthContext";
import { useLocation } from "../context/LocationContext";
import {
  FaFlask, FaMapMarkerAlt, FaTimes, FaCheck,
  FaCalendarAlt, FaVial, FaStar, FaArrowRight,
  FaPlus, FaMinus, FaBolt, FaChevronLeft,
  FaUniversity
} from "react-icons/fa";
import { GiTestTubes } from "react-icons/gi";
import PaymentPanel from "../components/PaymentPanel";

/* ════════════════════════════════════════════════════════
   AREAS for GPS snap (same as OrderModal)
════════════════════════════════════════════════════════ */
const AREAS = [
  { name: "Hazratganj",   lat: 26.8467, lng: 80.9462 },
  { name: "Gomti Nagar",  lat: 26.8574, lng: 81.0054 },
  { name: "Alambagh",     lat: 26.8006, lng: 80.9191 },
  { name: "Indira Nagar", lat: 26.8713, lng: 80.9955 },
  { name: "Chowk",        lat: 26.8697, lng: 80.9124 },
  { name: "Aminabad",     lat: 26.8488, lng: 80.9329 },
  { name: "Kapoorthala",  lat: 26.8577, lng: 80.9800 },
  { name: "Mahanagar",    lat: 26.8716, lng: 80.9564 },
  { name: "Jankipuram",   lat: 26.9124, lng: 80.9740 },
  { name: "Telibagh",     lat: 26.7900, lng: 80.9990 },
];
// nearestArea helper now handled by LocationContext


/* ════════════════════════════════════════════════════════
   BOOK TEST MODAL — Instant vs Scheduled + Pick from list
════════════════════════════════════════════════════════ */
const BookTestModal = ({ lab, onClose }) => {
  const { bookAppointment, getLabTestsByLab, fetchLabTestsByLab, labTests, fetchLabSlots } = useAppointment();
  const { autoDetectLocation, detecting, nearestArea } = useLocation();

  useEffect(() => {
    if (lab?.email) fetchLabTestsByLab(lab.email);
  }, [lab?.email]);
  const { user } = useAuth();
  const [submitted, setSubmitted] = useState(false);

  // Constants & Derived State (Define before hooks use them)
  const today = new Date().toISOString().split("T")[0];
  const CENTER_VISIT_CATEGORIES = ["MRI", "X-Ray", "CT Scan", "Ultrasound", "ECG / Echo"];
  const timeSlots = ["7:00 AM","8:00 AM","9:00 AM","10:00 AM","11:00 AM","12:00 PM","2:00 PM","3:00 PM","4:00 PM","5:00 PM"];

  // Contact
  const [name, setName] = useState(user?.name || "");
  const [phone, setPhone] = useState(user?.phone || "");
  const [email, setEmail] = useState(user?.email || "");
  const [dob, setDob] = useState(user?.dob || "");

  // Delivery / Schedule
  const [bookingMode, setBookingMode] = useState("instant");  // "instant" | "scheduled"
  const [deliveryDate, setDeliveryDate] = useState("");
  const [deliveryTime, setDeliveryTime] = useState("");
  const [homeCollection, setHomeCollection] = useState(false);
  const [address, setAddress] = useState("");
  const [detectErr, setDetectErr] = useState("");

  // Slots for Center Visit
  const [availableSlots, setAvailableSlots] = useState([]);
  const [fetchingSlots, setFetchingSlots] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState("");
  const [slotErr, setSlotErr] = useState("");

  // Test selection
  const labTestsList = getLabTestsByLab(lab.email);
  const hasListedTests = labTestsList.length > 0;
  const [selectMode, setSelectMode] = useState(true);
  const [selectedTests, setSelectedTests] = useState({});
  const [manualReason, setManualReason] = useState("");

  const [errors, setErrors] = useState({});
  const [payStep, setPayStep] = useState(false);
  const [paying, setPaying] = useState(false);

  // Logic Helpers
  const chosenTests = labTestsList.filter(t => selectedTests[t._id || t.id] > 0);
  const isCenterVisit = chosenTests.some(t => 
    t.requiresCenterVisit || CENTER_VISIT_CATEGORIES.includes(t.category)
  );

  // Force Scheduled Mode if Center Visit is required
  useEffect(() => {
    if (isCenterVisit && bookingMode === "instant") {
      setBookingMode("scheduled");
      if (!deliveryDate) setDeliveryDate(today);
    }
  }, [isCenterVisit, bookingMode, deliveryDate, today]);

  const inc = (id) => setSelectedTests(p => ({ ...p, [id]: (p[id] || 0) + 1 }));
  const dec = (id) => setSelectedTests(p => {
    const q = (p[id] || 0) - 1;
    if (q <= 0) { const n = { ...p }; delete n[id]; return n; }
    return { ...p, [id]: q };
  });
  
  const chosenSummary = chosenTests.map(t => `${t.name}${selectedTests[t._id || t.id] > 1 ? ` x${selectedTests[t._id || t.id]}` : ""}`).join(", ");
  
  // Calculate Base Price
  const basePrice = chosenTests.reduce((s, t) => s + t.price * selectedTests[t._id || t.id], 0);
  
  // Calculate Collection Charge (Take the highest among selected tests)
  const collectionCharge = homeCollection ? Math.max(...chosenTests.map(t => t.homeCollectionCharge || 0), 0) : 0;
  
  const totalPrice = basePrice + collectionCharge;

  // GPS Detection logic upgraded
  const detectAddress = () => {
    autoDetectLocation();
  };

  // Global location sync
  const { location: globalLoc } = useLocation();
  useEffect(() => {
    if (globalLoc?.area) {
      setAddress(globalLoc.area);
    }
  }, [globalLoc]);

  // Fetch slots when center visit is needed and date changes
  useEffect(() => {
    if (isCenterVisit && deliveryDate) {
      setFetchingSlots(true);
      setSlotErr("");
      fetchLabSlots(lab.email, deliveryDate).then(data => {
        setAvailableSlots(data.slots || []);
        if (data.slots?.length === 0) {
          setSlotErr(data.message || "No slots available for this day.");
        }
        setFetchingSlots(false);
      }).catch(err => {
        setSlotErr("Error fetching slots.");
        setFetchingSlots(false);
      });
    }
  }, [isCenterVisit, deliveryDate, lab.email]);


  const validate = () => {
    const e = {};
    if (!name.trim()) e.name = "Name is required";
    if (!/^[6-9]\d{9}$/.test(phone)) e.phone = "Enter valid 10-digit number";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) e.email = "Valid email required";
    if (bookingMode === "scheduled") {
      if (!deliveryDate) e.date = "Select date";
      if (!deliveryTime && !isCenterVisit) e.time = "Select time slot";
    }
    if (homeCollection && !address.trim() && !isCenterVisit) e.address = "Enter delivery address for home collection";
    if (isCenterVisit && !selectedSlot) e.slot = "Select a laboratory visit slot";
    if (selectMode && hasListedTests && chosenTests.length === 0) e.tests = "Select at least one test";
    if ((!selectMode || !hasListedTests) && manualReason.trim().length < 3) e.reason = "Please describe the tests needed";
    return e;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setPayStep(true);   // go to payment step
  };

  const onPay = async ({ method, detail }) => {
    setPaying(true);
    try {
      const reason = selectMode && hasListedTests ? `Tests: ${chosenSummary}` : manualReason;
      const res = await bookAppointment({
        name, phone, email, dob,
        reason,
        deliveryAddress: homeCollection ? address : "",
        homeCollection,
        deliveryMode: bookingMode,
        appointmentDate: bookingMode === "instant" ? today : deliveryDate,
        appointmentTime: bookingMode === "instant" ? "ASAP" : (isCenterVisit ? selectedSlot : deliveryTime),
        selectedTests: chosenTests.map(t => ({ id: t._id || t.id, name: t.name, qty: selectedTests[t._id || t.id], price: t.price })),
        patientEmail: user?.email || email,
        partnerEmail: lab.email,
        partnerRole: "lab",
        labName: lab.name || lab.clinicName,
        location: lab.location,
        paymentMethod: method,
        paymentDetail: detail,
        paymentStatus: "paid",
        amount: totalPrice,
        fees: basePrice,
        homeCollectionCharge: collectionCharge,
        isPackage: chosenTests.some(t => t.isPackage),
        isCenterVisit // Flag for backend slot management
      });

      if (res) {
        setSubmitted(res); // Store full response to show token
      }
    } catch (err) {
      alert("Booking failed: " + err.message);
    }
    setPaying(false);
  };


  const inp = (hasErr) =>
    `w-full px-3.5 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 transition bg-gray-50
     ${hasErr ? "border-red-400 focus:ring-red-200" : "border-gray-200 focus:ring-cyan-300 focus:border-transparent"}`;

  const modeBtn = (isActive, onClick, icon, label, sub) => (
    <button type="button" onClick={onClick}
      className={`flex-1 flex flex-col items-center gap-1 py-3 px-2 rounded-xl border-2 transition text-center
        ${isActive ? "border-cyan-500 bg-cyan-50 text-cyan-700" : "border-gray-200 bg-white text-gray-500 hover:border-cyan-300"}`}>
      <span className="text-lg">{icon}</span>
      <span className="text-xs font-bold">{label}</span>
      {sub && <span className="text-[10px] text-gray-400 leading-tight">{sub}</span>}
    </button>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm px-3 py-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[96vh] overflow-y-auto">
        {/* Header */}
        <div className="bg-gradient-to-r from-cyan-600 to-cyan-500 rounded-t-2xl p-5 flex items-start justify-between sticky top-0 z-10">
          <div>
            <h2 className="text-white text-lg font-bold">Book Lab Test</h2>
            <p className="text-cyan-100 text-sm mt-0.5">{lab.name || lab.clinicName}</p>
            <p className="text-cyan-200 text-xs mt-1 flex items-center gap-1"><FaMapMarkerAlt /> {lab.location}</p>
          </div>
          <button onClick={onClose} className="text-white/80 hover:text-white hover:bg-white/20 rounded-full p-1.5 transition">
            <FaTimes className="text-lg" />
          </button>
        </div>

        {submitted ? (
          <div className="p-8 text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <FaCheck className="text-2xl text-green-600" />
            </div>
            <h3 className="text-xl font-bold text-gray-800 mb-2">Booking Confirmed! 🎉</h3>
            <p className="text-gray-500 text-sm mb-1">
              Payment received · Test at <strong>{lab.name || lab.clinicName}</strong> is{" "}
              <span className="text-yellow-600 font-semibold">Pending</span>.
            </p>
            <p className="text-gray-400 text-xs mb-6">
              {isCenterVisit 
                ? (
                  <div className="bg-purple-50 border border-purple-100 p-3 rounded-xl mb-4 text-purple-700 font-bold space-y-1">
                    <p className="text-xs uppercase tracking-widest text-purple-400">Your Appointment Token</p>
                    <p className="text-2xl font-black">{submitted?.tokenNumber || "Generating..."}</p>
                    <p className="text-[10px] opacity-70">Please show this at the lab counter on {deliveryDate} at {selectedSlot}.</p>
                  </div>
                )
                : (bookingMode === "instant" ? "⚡ Lab will send someone shortly (20-40 min)." : `📅 Scheduled for ${deliveryDate} at ${deliveryTime}.`)}
            </p>
            <button onClick={onClose} className="bg-cyan-600 text-white px-8 py-2.5 rounded-xl font-bold hover:bg-cyan-700 transition">Done</button>
          </div>
        ) : payStep ? (
          <div className="p-5">
            <button type="button" onClick={() => setPayStep(false)}
              className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 mb-4 font-medium">
              <FaChevronLeft className="text-xs" /> Back to Details
            </button>
            <PaymentPanel amount={totalPrice} onPay={onPay} processing={paying}
              label={`Pay ₹${totalPrice} · Confirm Test Booking`} />
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-5 space-y-5" noValidate>

            {/* Contact */}
            <div className="space-y-3">
              <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">Contact Details</p>
              <input placeholder="Full Name *" className={inp(errors.name)} value={name}
                onChange={e => { setName(e.target.value); setErrors(p => ({ ...p, name: "" })); }} />
              {errors.name && <p className="text-red-500 text-xs">{errors.name}</p>}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <input placeholder="Phone *" className={inp(errors.phone)} value={phone}
                    onChange={e => { setPhone(e.target.value); setErrors(p => ({ ...p, phone: "" })); }} />
                  {errors.phone && <p className="text-red-500 text-xs mt-1">{errors.phone}</p>}
                </div>
                <div>
                  <input placeholder="Email *" className={inp(errors.email)} value={email}
                    onChange={e => { setEmail(e.target.value); setErrors(p => ({ ...p, email: "" })); }} />
                  {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
                </div>
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500 mb-1 block">Date of Birth</label>
                <input type="date" className={inp(false)} max={today} value={dob}
                  onChange={e => setDob(e.target.value)} />
              </div>
            </div>

            {/* Booking Mode */}
            <div>
              <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Booking Type</p>
              <div className="flex gap-3 mb-3">
                {modeBtn(bookingMode === "instant" && !isCenterVisit, () => !isCenterVisit && setBookingMode("instant"), <FaBolt />, "Instant Test", isCenterVisit ? "Not for center visits" : "20-40 min pickup")}
                {modeBtn(bookingMode === "scheduled", () => setBookingMode("scheduled"), <FaCalendarAlt />, "Scheduled", isCenterVisit ? "Laboratory Visit" : "Pick date & time")}
              </div>

              {isCenterVisit && (
                 <div className="bg-purple-50 border border-purple-100 rounded-xl px-4 py-2.5 flex items-center gap-3 mb-3 animate-in fade-in slide-in-from-top-1">
                   <FaUniversity className="text-purple-600 text-lg flex-shrink-0" />
                   <p className="text-[10px] leading-tight font-bold text-purple-700">
                     Note: Selected tests (e.g. Ultrasound/MRI) require specialized equipment at the laboratory center. 
                     <span className="block mt-0.5 text-purple-500 opacity-80 underline italic">Instant home collection is disabled for these tests.</span>
                   </p>
                 </div>
              )}

              {bookingMode === "instant" && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-xl px-4 py-3 text-xs text-yellow-700 flex items-center gap-2">
                  <FaBolt className="text-yellow-500 flex-shrink-0" />
                  Lab will dispatch a sample collector to you within <strong>20–40 minutes</strong> of accepting.
                </div>
              )}

              {bookingMode === "scheduled" && (
                <div className={`grid ${isCenterVisit ? "grid-cols-1" : "grid-cols-2"} gap-3 transition-all`}>
                  <div>
                    <label className="text-xs text-gray-500 font-semibold mb-1 block">Scheduled Date *</label>
                    <input type="date" min={today} className={inp(errors.date)} value={deliveryDate}
                      onChange={e => { setDeliveryDate(e.target.value); setErrors(p => ({ ...p, date: "" })); }} />
                    {errors.date && <p className="text-red-500 text-xs mt-1">{errors.date}</p>}
                  </div>
                  {!isCenterVisit && (
                    <div>
                      <label className="text-xs text-gray-500 font-semibold mb-1 block">Time Slot *</label>
                      <select className={inp(errors.time)} value={deliveryTime}
                        onChange={e => { setDeliveryTime(e.target.value); setErrors(p => ({ ...p, time: "" })); }}>
                        <option value="">Select slot</option>
                        {timeSlots.map((t, idx) => <option key={`${t}-${idx}`} value={t}>{t}</option>)}
                      </select>
                      {errors.time && <p className="text-red-500 text-xs mt-1">{errors.time}</p>}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Home Collection */}
            <div>
              <label className="flex items-center gap-3 cursor-pointer bg-cyan-50 border border-cyan-100 rounded-xl p-3 hover:border-cyan-300 transition">
                <input type="checkbox" className="w-4 h-4 accent-cyan-600" checked={homeCollection}
                  onChange={e => { setHomeCollection(e.target.checked); if (!e.target.checked) setAddress(""); }} />
                <span className="text-sm text-cyan-700 font-medium">Request Home Sample Collection</span>
              </label>
              {homeCollection && (
                <div className="mt-2 space-y-2">
                  <textarea rows={2} placeholder="Enter your full address *"
                    className={`${inp(errors.address)} resize-none`} value={address}
                    onChange={e => { setAddress(e.target.value); setErrors(p => ({ ...p, address: "" })); }} />
                  <button type="button" onClick={detectAddress} disabled={detecting}
                    className={`w-full flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-bold border transition
                      ${detecting ? "bg-blue-50 text-blue-400 border-blue-200 cursor-wait" : "bg-blue-600 text-white border-blue-600 hover:bg-blue-700"}`}>
                    {detecting
                      ? <><svg className="animate-spin h-3.5 w-3.5" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" /></svg> Detecting…</>
                      : <>📍 Auto-detect My Location</>}
                  </button>
                  {detectErr && <p className="text-red-500 text-xs">{detectErr}</p>}
                  {errors.address && <p className="text-red-500 text-xs">{errors.address}</p>}
                </div>
              )}
            </div>

            {/* Tests */}
            <div>
              <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Tests Required</p>

              {hasListedTests && (
                <div className="flex gap-2 mb-3">
                  <button type="button" onClick={() => setSelectMode(true)}
                    className={`flex-1 py-2 rounded-xl text-xs font-bold border transition ${selectMode ? "bg-cyan-600 text-white border-cyan-600" : "bg-white text-gray-500 border-gray-200 hover:border-cyan-300"}`}>
                    🧪 Pick from List
                  </button>
                  <button type="button" onClick={() => setSelectMode(false)}
                    className={`flex-1 py-2 rounded-xl text-xs font-bold border transition ${!selectMode ? "bg-cyan-600 text-white border-cyan-600" : "bg-white text-gray-500 border-gray-200 hover:border-cyan-300"}`}>
                    ✏️ Type Manually
                  </button>
                </div>
              )}

              {selectMode && hasListedTests ? (
                <div>
                  <div className="max-h-48 overflow-y-auto space-y-2 pr-1">
                    {labTestsList.map((t, idx) => (
                      <div key={t._id || t.id || idx} className="flex items-center gap-3 bg-gray-50 border border-gray-100 rounded-xl p-3 hover:border-cyan-200 transition">
                        <div className="w-9 h-9 rounded-lg bg-cyan-100 flex items-center justify-center text-cyan-500 flex-shrink-0">
                          <GiTestTubes />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-bold text-gray-800 truncate flex items-center gap-2">
                             {t.name}
                             {(t.requiresCenterVisit || CENTER_VISIT_CATEGORIES.includes(t.category)) && (
                               <span className="text-[9px] bg-purple-100 text-purple-600 px-1.5 py-0.5 rounded font-black uppercase">🏥 Center Visit</span>
                             )}
                          </p>
                          <p className="text-xs text-gray-500">{t.category} · ₹{t.price} · {t.turnaround}</p>
                        </div>
                        <div className="flex items-center gap-1.5 flex-shrink-0">
                          {selectedTests[t._id || t.id] > 0 ? (
                            <>
                              <button type="button" onClick={() => dec(t._id || t.id)}
                                className="w-6 h-6 bg-red-100 text-red-600 rounded-full flex items-center justify-center hover:bg-red-200 transition">
                                <FaMinus className="text-[10px]" />
                              </button>
                              <span className="w-4 text-center text-sm font-bold">{selectedTests[t._id || t.id]}</span>
                              <button type="button" onClick={() => inc(t._id || t.id)}
                                className="w-6 h-6 bg-cyan-100 text-cyan-700 rounded-full flex items-center justify-center hover:bg-cyan-200 transition">
                                <FaPlus className="text-[10px]" />
                              </button>
                            </>
                          ) : (
                            <button type="button" onClick={() => inc(t._id || t.id)}
                              className="w-6 h-6 bg-cyan-600 text-white rounded-full flex items-center justify-center hover:bg-cyan-700 transition">
                              <FaPlus className="text-[10px]" />
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                  {chosenTests.length > 0 && (
                    <div className="mt-2 bg-cyan-50 border border-cyan-200 rounded-xl px-4 py-3 text-xs text-cyan-700 space-y-1 shadow-sm">
                      <div className="flex justify-between">
                        <span><strong>Selected Tests:</strong> {chosenSummary}</span>
                        <span className="font-bold">₹{basePrice}</span>
                      </div>
                      {homeCollection && collectionCharge > 0 && (
                        <div className="flex justify-between text-orange-600 font-medium">
                          <span>Home Collection Charge</span>
                          <span>+ ₹{collectionCharge}</span>
                        </div>
                      )}
                      <div className="border-t border-cyan-200 pt-1 mt-1 flex justify-between text-sm font-black text-cyan-900">
                        <span>Total Payable</span>
                        <span>₹{totalPrice}</span>
                      </div>
                    </div>
                  )}
                  {errors.tests && <p className="text-red-500 text-xs mt-1">{errors.tests}</p>}
                  {isCenterVisit && (
                    <div className="mt-4 p-4 bg-purple-50 border border-purple-100 rounded-xl space-y-3">
                      <p className="text-[10px] font-black text-purple-600 uppercase tracking-widest flex items-center gap-2">
                        <FaUniversity /> Laboratory Visit Slot Required
                      </p>
                      <div>
                        <label className="text-[10px] font-bold text-gray-500 mb-1 block uppercase">Select Visit Time *</label>
                        <div className="grid grid-cols-2 gap-2 max-h-32 overflow-y-auto">
                          {fetchingSlots ? (
                            <div className="col-span-2 py-4 text-center text-gray-400 text-xs animate-pulse">Checking availability...</div>
                          ) : availableSlots.length > 0 ? (
                            availableSlots.map(s => (
                              <button
                                key={s.time}
                                type="button"
                                disabled={!s.available}
                                onClick={() => setSelectedSlot(s.time)}
                                className={`py-2 rounded-lg text-xs font-bold transition border
                                  ${selectedSlot === s.time ? "bg-purple-600 text-white border-purple-600" : (s.available ? "bg-white text-gray-600 border-gray-100 hover:border-purple-300" : "bg-gray-50 text-gray-300 border-gray-50 cursor-not-allowed")}`}
                              >
                                {s.time} {!s.available && "(Full)"}
                              </button>
                            ))
                          ) : (
                            <div className="col-span-2 py-4 text-center text-gray-400 text-xs italic">
                              {deliveryDate ? (slotErr || "No slots available for this day.") : "Select a date first."}
                            </div>
                          )}
                        </div>
                        {errors.slot && <p className="text-red-500 text-[10px] font-bold mt-1">{errors.slot}</p>}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div>
                  <textarea rows={3} placeholder="e.g. Blood Sugar Fasting, CBC, Thyroid T3T4TSH..."
                    className={`${inp(errors.reason)} resize-none`} value={manualReason}
                    onChange={e => { setManualReason(e.target.value); setErrors(p => ({ ...p, reason: "" })); }} />
                  {errors.reason && <p className="text-red-500 text-xs mt-1">{errors.reason}</p>}
                </div>
              )}
            </div>

            {/* Submit */}
            <button type="submit"
              className="w-full bg-cyan-600 hover:bg-cyan-700 text-white font-bold py-3.5 rounded-xl shadow-lg shadow-cyan-100 transition flex items-center justify-center gap-2 text-sm">
              <FaCalendarAlt />
              {bookingMode === "instant" ? "⚡ Book Instant Test (20-40 min)" : "📅 Schedule Test Booking"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

/* ════════════════════════════════════════════════════════
   MAIN LAB TESTS PAGE
════════════════════════════════════════════════════════ */
const LabTests = () => {
  const { getPartnersByRole, getLabTestsByLab } = useAppointment();
  const { location } = useLocation();
  const [selectedLab, setSelectedLab] = useState(null);
  const [labs, setLabs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    getPartnersByRole("lab").then((data) => {
      setLabs(Array.isArray(data) ? data : []);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);
  const filtered = labs.filter((lab) => {
    if (!location?.area || location.area === "All Areas") return true;
    return lab.location?.includes(location.area);
  });

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-2">Lab Tests & Diagnostics</h1>
        <p className="text-gray-500 mb-8">
          Available labs in <span className="font-semibold text-cyan-600">{location?.area || "your area"}</span>
        </p>

        {loading ? (
          <div className="text-center py-20">
            <div className="w-12 h-12 border-4 border-cyan-200 border-t-cyan-600 rounded-full animate-spin mx-auto mb-3" />
            <p className="text-gray-400">Loading labs...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-xl shadow-sm">
            <FaVial className="text-5xl text-gray-300 mx-auto mb-3" />
            <h3 className="text-xl text-gray-500 font-semibold">No labs registered yet</h3>
            <p className="text-gray-400 mt-1">Diagnostic labs will appear here after they sign up on D2D Pharma.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map((lab) => {
              const tests = getLabTestsByLab(lab.email);
              return (
                <div key={lab.email} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-lg transition group flex flex-col">
                  <div className="relative h-36 bg-gradient-to-br from-cyan-100 to-cyan-50 flex items-center justify-center">
                    <div className="w-20 h-20 rounded-full bg-cyan-600 flex items-center justify-center text-white text-3xl font-bold shadow-lg overflow-hidden border-2 border-white">
                      {lab.profilePhoto ? (
                        <img src={lab.profilePhoto} alt={lab.name} className="w-full h-full object-cover" />
                      ) : (
                        lab.name?.charAt(0) || "L"
                      )}
                    </div>
                    <div className="absolute top-3 right-3 bg-white/90 px-2.5 py-1 rounded-lg text-xs font-bold flex items-center gap-1 shadow">
                      <FaStar className="text-yellow-400" /> {lab.rating?.toFixed(1) || "5.0"}
                    </div>
                    <div className="absolute bottom-2 left-3 bg-green-500/90 text-white text-xs font-bold px-2 py-0.5 rounded-lg flex items-center gap-1">
                      ⚡ Instant Available
                    </div>
                    {tests.length > 0 && (
                      <div className="absolute bottom-2 right-3 bg-cyan-600/90 text-white text-xs font-bold px-2 py-0.5 rounded-lg">
                        {tests.length} Tests
                      </div>
                    )}
                  </div>

                  <div className="p-5 flex-1 flex flex-col">
                    <h3 className="text-lg font-bold text-gray-800 group-hover:text-cyan-600 transition-colors">{lab.name}</h3>
                    {lab.specialty && <p className="text-cyan-600 text-sm font-medium mt-0.5">{lab.specialty}</p>}
                    <div className="mt-3 space-y-1.5 text-sm text-gray-500 flex-1">
                      {lab.location && (
                        <p className="flex items-center gap-2"><FaMapMarkerAlt className="text-gray-400 flex-shrink-0" /> {lab.location}</p>
                      )}
                    </div>

                    {tests.length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-1.5">
                        {tests.slice(0, 3).map((t, idx) => (
                          <span key={t.id || t._id || idx} className="bg-cyan-50 text-cyan-700 text-[11px] font-semibold px-2 py-0.5 rounded-full border border-cyan-100">
                            {t.name}
                          </span>
                        ))}
                        {tests.length > 3 && <span className="bg-gray-100 text-gray-500 text-[11px] font-semibold px-2 py-0.5 rounded-full">+{tests.length - 3} more</span>}
                      </div>
                    )}

                    <div className="border-t border-gray-100 pt-4 mt-4">
                      <button onClick={() => setSelectedLab(lab)}
                        className="w-full bg-cyan-600 hover:bg-cyan-700 text-white text-sm font-bold px-4 py-2.5 rounded-xl transition flex items-center justify-center gap-2 shadow-md shadow-cyan-200">
                        Book Test <FaArrowRight className="text-xs" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {selectedLab && <BookTestModal lab={selectedLab} onClose={() => setSelectedLab(null)} />}
    </div>
  );
};

export default LabTests;
