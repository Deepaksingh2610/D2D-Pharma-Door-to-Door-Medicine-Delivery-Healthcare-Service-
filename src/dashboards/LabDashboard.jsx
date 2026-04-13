import { useState, useRef, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { useAppointment } from "../context/AppointmentContext";
import { useNavigate } from "react-router-dom";
import { useLocation } from "../context/LocationContext";
import {
  FaFlask, FaMoneyCheckAlt, FaChartPie, FaCog, FaSignOutAlt,
  FaCheck, FaTimes, FaPlus, FaTrash, FaTag, FaRupeeSign,
  FaClock, FaFilePdf, FaUpload, FaBell, FaVial,
  FaCreditCard, FaMobileAlt, FaUniversity, FaMoneyBillWave, FaPhone, FaEnvelope,
  FaFolderOpen, FaCheckCircle, FaChartLine, FaDownload, FaMicroscope, FaTruck, FaMapMarkerAlt,
  FaUserEdit, FaExclamationTriangle, FaCamera, FaPhoneAlt, FaClipboardList, FaLocationArrow,
  FaSearch
} from "react-icons/fa";
import { MdDashboard, MdBiotech } from "react-icons/md";
import { GiTestTubes } from "react-icons/gi";

/* ── Payment badge ── */
const PayBadge = ({ method }) => {
  const icon = method === "card" ? <FaCreditCard /> : method === "netbanking" ? <FaUniversity /> : method === "cod" ? <FaMoneyBillWave /> : <FaMobileAlt />;
  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-cyan-50 text-cyan-700 rounded-full text-xs font-bold">
      {icon} {method?.toUpperCase()}
    </span>
  );
};

// Standardized nearestArea imported via useLocation()

/* ═══════════════════════════════════════════════════
   LAB TEST CATEGORIES
═══════════════════════════════════════════════════ */
const LAB_CATEGORIES = [
  "Blood Test", "Urine / Stool Test", "X-Ray", "MRI", "CT Scan",
  "Ultrasound", "ECG / Echo", "Thyroid Profile", "Liver Function Test",
  "Kidney Function Test", "Lipid Profile", "Full Body Checkup",
  "Diabetes Panel", "COVID / Viral Panel", "Hormone Test", "Others"
];

const TEST_DATA_MAP = {
  "Blood Test": [
    { name: "CBC (Complete Blood Count)", price: 350, turnaround: "Same Day" },
    { name: "HbA1c (Diabetes Control)", price: 450, turnaround: "Same Day" },
    { name: "Blood Sugar Fasting", price: 100, turnaround: "Same Day" },
    { name: "Blood Sugar PP", price: 100, turnaround: "Same Day" },
    { name: "Iron Profile", price: 800, turnaround: "Next Day" },
    { name: "Vitamin D (25-OH)", price: 1200, turnaround: "Next Day" },
    { name: "Vitamin B12", price: 900, turnaround: "Next Day" },
    { name: "CRP (C-Reactive Protein)", price: 400, turnaround: "Same Day" }
  ],
  "Urine / Stool Test": [
    { name: "Urine Routine & Microscopy", price: 200, turnaround: "Same Day" },
    { name: "Urine Culture & Sensitivity", price: 600, turnaround: "2 Days" },
    { name: "Stool Routine", price: 250, turnaround: "Same Day" }
  ],
  "Thyroid Profile": [
    { name: "Thyroid Profile (T3, T4, TSH)", price: 550, turnaround: "Same Day" },
    { name: "TSH Only", price: 250, turnaround: "Same Day" }
  ],
  "Liver Function Test": [
    { name: "LFT (Liver Function Test)", price: 700, turnaround: "Same Day" },
    { name: "Albumin", price: 200, turnaround: "Same Day" },
    { name: "Bilirubin Profile", price: 300, turnaround: "Same Day" }
  ],
  "Kidney Function Test": [
    { name: "KFT (Kidney Function Test)", price: 750, turnaround: "Same Day" },
    { name: "Creatinine", price: 200, turnaround: "Same Day" },
    { name: "Uric Acid", price: 200, turnaround: "Same Day" }
  ],
  "Lipid Profile": [
    { name: "Lipid Profile", price: 600, turnaround: "Same Day" },
    { name: "Cholesterol", price: 200, turnaround: "Same Day" }
  ],
  "Full Body Checkup": [
    { name: "Basic Health Package", price: 1500, turnaround: "Next Day" },
    { name: "Executive Health Checkup", price: 3500, turnaround: "Next Day" },
    { name: "Senior Citizen Package", price: 2500, turnaround: "Next Day" }
  ],
  "Diabetes Panel": [
    { name: "Diabetes Basic (F+PP+HbA1c)", price: 600, turnaround: "Same Day" },
    { name: "Diabetes Comprehensive", price: 1800, turnaround: "Next Day" }
  ],
  "ECG / Echo": [
    { name: "ECG", price: 300, turnaround: "Same Day" },
    { name: "2D Echo", price: 1800, turnaround: "Same Day" },
    { name: "TMT (Stress Test)", price: 1500, turnaround: "Same Day" }
  ]
};

/* ═══════════════════════════════════════════════════
   ADD LAB TEST FORM (Enhanced Professional Version)
   Optimized for < 10 sec entry
═══════════════════════════════════════════════════ */
const AddLabTestForm = ({ labEmail, labName, onAdded, allTests, editingTest, onCancelEdit }) => {
  const { addLabTest, updateLabTest } = useAppointment();
  const [form, setForm] = useState({ 
    name: "", category: "", price: "", 
    turnaround: "Same Day", homeCollection: true, 
    homeCollectionCharge: 0, isPackage: false, packageTests: [],
    requiresCenterVisit: false
  });

  // Sync with editingTest
  useEffect(() => {
    if (editingTest) {
      setForm({
        name: editingTest.name,
        category: editingTest.category,
        price: editingTest.price,
        turnaround: editingTest.turnaround || "Same Day",
        homeCollection: editingTest.homeCollection ?? true,
        homeCollectionCharge: editingTest.homeCollectionCharge || 0,
        isPackage: editingTest.isPackage || false,
        packageTests: editingTest.packageTests || [],
        requiresCenterVisit: editingTest.requiresCenterVisit || false
      });
    }
  }, [editingTest]);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [showPackageBuilder, setShowPackageBuilder] = useState(false);

  // Auto-fill logic
  useEffect(() => {
    if (form.category && form.name) {
      const suggestions = TEST_DATA_MAP[form.category] || [];
      const match = suggestions.find(s => s.name === form.name);
      if (match) {
        setForm(p => ({ ...p, price: match.price, turnaround: match.turnaround }));
      }
    }
  }, [form.name, form.category]);

  const validate = () => {
    const e = {};
    if (!form.name.trim()) e.name = "Test name is required";
    if (!form.category) e.category = "Select a category";
    if (!form.price || isNaN(form.price) || Number(form.price) < 0) e.price = "Enter valid price";
    if (form.isPackage && form.packageTests.length < 2) e.package = "Packages need at least 2 tests";
    return e;
  };

  const handleSubmit = async (ev) => {
    ev.preventDefault();
    const e = validate();
    if (Object.keys(e).length) { setErrors(e); return; }
    setSaving(true);
    try {
      if (editingTest) {
        await updateLabTest(editingTest._id || editingTest.id, {
          ...form,
          price: Number(form.price),
          homeCollectionCharge: Number(form.homeCollectionCharge)
        });
        onCancelEdit();
      } else {
        await addLabTest({
          labEmail, labName,
          ...form,
          price: Number(form.price),
          homeCollectionCharge: Number(form.homeCollectionCharge)
        });
      }
      setForm({ 
        name: "", category: "", price: "", 
        turnaround: "Same Day", homeCollection: true, 
        homeCollectionCharge: 0, isPackage: false, packageTests: [],
        requiresCenterVisit: false
      });
      setErrors({});
      setShowPackageBuilder(false);
      onAdded();
    } catch (err) {
      alert("Failed to save test: " + err.message);
    }
    setSaving(false);
  };

  const selectSuggested = (test) => {
    setForm(p => ({ ...p, name: test.name, price: test.price, turnaround: test.turnaround }));
  };

  const quickPopulate = (name, category) => {
    const list = TEST_DATA_MAP[category] || [];
    const test = list.find(t => t.name.includes(name)) || { name, price: 500, turnaround: "Same Day" };
    setForm({ 
      ...form, 
      category, 
      name: test.name, 
      price: test.price, 
      turnaround: test.turnaround 
    });
  };

  const inp = (hasErr) =>
    `w-full px-4 py-2.5 border rounded-xl text-sm focus:outline-none focus:ring-2 transition bg-gray-50
     ${hasErr ? "border-red-400 focus:ring-red-200" : "border-gray-200 focus:ring-cyan-400 focus:border-transparent"}`;

  return (
    <div className="space-y-6">
      {/* Quick Add Buttons */}
      <div className="flex flex-wrap gap-2">
        {[
          { l: "CBC", c: "Blood Test" },
          { l: "Lipid", c: "Lipid Profile" },
          { l: "LFT", c: "Liver Function Test" },
          { l: "KFT", c: "Kidney Function Test" },
          { l: "Thyroid", c: "Thyroid Profile" },
          { l: "HbA1c", c: "Blood Test" },
          { l: "ECG", c: "ECG / Echo" }
        ].map(btn => (
          <button key={btn.l} type="button" onClick={() => quickPopulate(btn.l, btn.c)}
            className="px-4 py-2 bg-white border border-gray-200 rounded-xl text-xs font-bold text-gray-600 hover:border-cyan-500 hover:text-cyan-600 transition shadow-sm">
            + {btn.l}
          </button>
        ))}
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-3xl border border-gray-100 shadow-sm p-8 space-y-6">
        <div className="flex items-center justify-between border-b border-gray-50 pb-4">
          <h3 className="text-lg font-black text-gray-800 flex items-center gap-2">
            <FaFlask className="text-cyan-600" /> {editingTest ? "Update Lab Test" : "Test Management"}
          </h3>
          <div className="flex gap-2">
            {editingTest && (
              <button type="button" onClick={onCancelEdit}
                className="px-4 py-2 bg-gray-100 text-gray-500 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-gray-200 transition">
                Cancel Edit
              </button>
            )}
            <button type="button" onClick={() => { setForm(p => ({ ...p, isPackage: !p.isPackage })); setShowPackageBuilder(!form.isPackage); }}
              className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition
                ${form.isPackage ? "bg-purple-600 text-white shadow-lg" : "bg-purple-50 text-purple-600 hover:bg-purple-100"}`}>
              {form.isPackage ? "✓ Package Mode" : "Bundle Package"}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Category */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Category</label>
            <div className="relative">
              <FaTag className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
              <select className={`${inp(errors.category)} pl-11`} value={form.category}
                onChange={e => setForm(p => ({ ...p, category: e.target.value }))}>
                <option value="">Select category</option>
                {LAB_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            {errors.category && <p className="text-red-500 text-[10px] font-bold px-1">{errors.category}</p>}
          </div>

          {/* Test Name Dropdown/Input */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Test Name</label>
            <div className="relative">
              <GiTestTubes className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
              {form.category && TEST_DATA_MAP[form.category] ? (
                 <select className={`${inp(errors.name)} pl-11`} value={form.name}
                   onChange={e => setForm(p => ({ ...p, name: e.target.value }))}>
                   <option value="">Select popular test...</option>
                   {TEST_DATA_MAP[form.category].map(t => <option key={t.name} value={t.name}>{t.name}</option>)}
                   <option value="custom">-- Custom Name --</option>
                 </select>
              ) : (
                <input type="text" placeholder="Enter test name..." className={`${inp(errors.name)} pl-11`} value={form.name}
                  onChange={e => setForm(p => ({ ...p, name: e.target.value }))} />
              )}
              {form.name === "custom" && (
                <input type="text" placeholder="Type custom test name..." className={`${inp(errors.name)} mt-2`} autoFocus
                  onChange={e => setForm(p => ({ ...p, name: e.target.value }))} />
              )}
            </div>
            {errors.name && <p className="text-red-500 text-[10px] font-bold px-1">{errors.name}</p>}
          </div>
        </div>

        {/* Package Builder UI */}
        {showPackageBuilder && (
          <div className="bg-purple-50 rounded-2xl p-5 border border-purple-100 space-y-4 animate-in slide-in-from-top-2">
            <label className="text-[10px] font-black text-purple-400 uppercase tracking-widest">Select Tests for Package</label>
            <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto pr-2">
              {allTests.filter(t => !t.isPackage).map(t => (
                <button key={t._id} type="button"
                  onClick={() => {
                    const exists = form.packageTests.includes(t.name);
                    setForm(p => ({ 
                      ...p, 
                      packageTests: exists ? p.packageTests.filter(n => n !== t.name) : [...p.packageTests, t.name]
                    }));
                  }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5
                    ${form.packageTests.includes(t.name) ? "bg-purple-600 text-white" : "bg-white text-purple-600 border border-purple-200"}`}>
                  {form.packageTests.includes(t.name) && <FaCheck />} {t.name}
                </button>
              ))}
            </div>
            {errors.package && <p className="text-red-500 text-[10px] font-bold">{errors.package}</p>}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Price */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Base Test Price (₹) *</label>
            <div className="relative group">
              <FaRupeeSign className="absolute left-4 top-1/2 -translate-y-1/2 text-cyan-500 transition-transform group-focus-within:scale-110" />
              <input 
                type="number" 
                className={`${inp(errors.price)} pl-11 py-4 font-bold text-gray-800 focus:ring-4 focus:ring-cyan-50`} 
                placeholder="e.g. 500"
                value={form.price}
                onChange={e => setForm(p => ({ ...p, price: e.target.value }))} 
              />
            </div>
          </div>

          {/* Turnaround */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Turnaround</label>
            <select className={inp(false)} value={form.turnaround}
              onChange={e => setForm(p => ({ ...p, turnaround: e.target.value }))}>
              <option>Same Day</option>
              <option>Next Day</option>
              <option>2 Days</option>
              <option>3 Days</option>
              <option>5 Days</option>
            </select>
          </div>

          {/* Center Visit Toggle */}
          <div className="flex flex-col justify-end">
            <button type="button" onClick={() => setForm(p => ({ ...p, requiresCenterVisit: !p.requiresCenterVisit, homeCollection: !p.requiresCenterVisit ? p.homeCollection : false }))}
              className={`flex items-center gap-3 px-5 py-2.5 rounded-xl border transition h-full font-bold text-sm
                ${form.requiresCenterVisit ? "bg-purple-50 border-purple-200 text-purple-700" : "bg-gray-50 border-gray-200 text-gray-400"}`}>
              {form.requiresCenterVisit ? <FaUniversity className="text-purple-600" /> : <div className="w-4 h-4 border-2 border-gray-300 rounded" />} 
              Center Visit Required
            </button>
          </div>
        </div>

        {!form.requiresCenterVisit && (
          <div className="flex flex-col justify-end mt-4">
             <button type="button" onClick={() => setForm(p => ({ ...p, homeCollection: !p.homeCollection }))}
              className={`flex items-center gap-3 px-5 py-2.5 rounded-xl border transition h-full font-bold text-sm inline-flex w-fit
                ${form.homeCollection ? "bg-green-50 border-green-200 text-green-700" : "bg-gray-50 border-gray-200 text-gray-400"}`}>
              {form.homeCollection ? <FaTruck className="text-green-600" /> : <div className="w-4 h-4 border-2 border-gray-300 rounded" />} 
              Home Collection Available
            </button>
          </div>
        )}


        {form.homeCollection && (
          <div className="bg-orange-50/50 border border-orange-100 p-6 rounded-3xl animate-in fade-in space-y-4 shadow-sm">
             <div className="flex items-center justify-between mb-2">
                <h4 className="text-xs font-black text-orange-600 uppercase tracking-widest flex items-center gap-2">
                  <FaTruck /> Home Collection Charges
                </h4>
                <p className="text-[10px] text-orange-400 font-bold italic">This will be added to the test price</p>
             </div>
             
             <div className="flex items-center gap-6">
               <div className="flex-1 space-y-2">
                 <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Collection Fee (₹)</label>
                 <div className="relative group">
                    <FaRupeeSign className="absolute left-4 top-1/2 -translate-y-1/2 text-orange-400 transition-transform group-focus-within:scale-110" />
                    <input 
                      type="number" 
                      className="w-full bg-white border border-orange-200 rounded-2xl px-11 py-4 text-sm font-bold text-orange-700 focus:outline-none focus:ring-4 focus:ring-orange-100 transition shadow-inner" 
                      placeholder="e.g. 150"
                      value={form.homeCollectionCharge} 
                      onChange={e => setForm(p => ({ ...p, homeCollectionCharge: e.target.value }))} 
                    />
                 </div>
               </div>

               <div className="w-px h-12 bg-orange-200/50 hidden md:block" />

               <div className="text-right min-w-[140px]">
                 <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest leading-none mb-1">Total Patient Payable</p>
                 <div className="flex flex-col items-end group">
                    <div className="relative">
                      <span className="absolute left-0 top-1/2 -translate-y-1/2 text-3xl font-black text-orange-600">₹</span>
                      <input 
                        type="number" 
                        className="bg-transparent text-3xl font-black text-orange-600 text-right w-32 focus:outline-none focus:border-b-2 focus:border-orange-400 appearance-none pl-6 cursor-edit"
                        value={Number(form.price || 0) + Number(form.homeCollectionCharge || 0)}
                        onChange={(e) => {
                          const total = Number(e.target.value);
                          // Adjust the base price so the sum matches the new total
                          const newPrice = total - Number(form.homeCollectionCharge || 0);
                          setForm(p => ({ ...p, price: newPrice > 0 ? newPrice : 0 }));
                        }}
                      />
                    </div>
                    <p className="text-[9px] text-orange-400 font-bold mt-1">(₹{form.price} + ₹{form.homeCollectionCharge})</p>
                 </div>
               </div>
             </div>
          </div>
        )}

        <button type="submit" disabled={saving}
          className="w-full bg-cyan-600 hover:bg-cyan-700 active:scale-[0.98] text-white font-black py-4 rounded-2xl shadow-xl shadow-cyan-100 transition flex items-center justify-center gap-3 disabled:opacity-60 uppercase tracking-widest">
          {saving ? "SAVING TEST..." : <><FaPlus /> {editingTest ? "UPDATE TEST DETAILS" : "ADD TEST TO INVENTORY"}</>}
        </button>
      </form>
    </div>
  );
};

/* ═══════════════════════════════════════════════════
   BOOKING CARD — with Sample Collected + Report Upload
═══════════════════════════════════════════════════ */
const BookingCard = ({ appt, onAccept, onReject, onSampleCollected, onReportUpload, getReportByAppointment }) => {
  const [uploading, setUploading] = useState(false);
  const [notifying, setNotifying] = useState(false);
  const fileRef = useRef();
  const report = getReportByAppointment(appt._id || appt.id);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (!file.type.includes("pdf") && !file.type.includes("image")) {
      alert("Please upload a PDF or image file"); return;
    }
    if (file.size > 10 * 1024 * 1024) { alert("Max file size is 10MB"); return; }
    setUploading(true);
    const reader = new FileReader();
    reader.onload = (ev) => {
      onReportUpload(appt._id || appt.id, ev.target.result, file.name);
      setUploading(false);
    };
    reader.readAsDataURL(file);
  };

  const handleSampleCollect = () => {
    setNotifying(true);
    setTimeout(() => { onSampleCollected(appt._id || appt.id); setNotifying(false); }, 500);
  };

  const isInstant = appt.deliveryMode === "instant" || appt.appointmentTime === "ASAP";

  return (
    <div className="flex flex-col p-4 rounded-xl border border-gray-100 hover:border-cyan-200 hover:shadow-sm transition bg-gray-50/50 gap-3">
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 rounded-full bg-cyan-100 flex items-center justify-center text-cyan-700 font-bold text-sm flex-shrink-0">
            {appt.name?.charAt(0)}
          </div>
          <div>
            <h4 className="font-bold text-gray-800 text-sm flex items-center gap-2">
              {appt.name}
              {isInstant && <span className="text-[10px] bg-yellow-100 text-yellow-700 px-1.5 py-0.5 rounded font-bold">⚡ Instant</span>}
            </h4>
            <p className="text-xs text-gray-500 mt-0.5">{appt.phone} • {appt.email}</p>
            <p className="text-xs text-gray-500 mt-0.5">
              📅 {appt.appointmentDate}{" "}
              {appt.appointmentTime !== "ASAP" && `at ${appt.appointmentTime}`}
              {appt.isCenterVisit && <span className="ml-2 inline-flex items-center gap-1 bg-purple-100 text-purple-700 px-2 py-0.5 rounded-md font-bold text-[9px] uppercase tracking-tighter">🏥 Center Visit</span>}
            </p>
            {appt.tokenNumber && (
               <p className="text-[10px] font-black text-cyan-600 bg-cyan-50 border border-cyan-100 px-2 py-0.5 rounded-md inline-block mt-1 uppercase tracking-widest">
                 🎟️ {appt.tokenNumber}
               </p>
            )}
            <p className="text-xs text-gray-400 mt-1 italic">Tests: {appt.reason}</p>
            {appt.deliveryAddress && <p className="text-xs text-gray-400 mt-0.5">📍 {appt.deliveryAddress}</p>}
          </div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          {appt.status === "pending" ? (
            <>
              <button onClick={onAccept} className="flex items-center gap-1 bg-green-600 hover:bg-green-700 text-white text-xs px-3 py-1.5 rounded-lg transition font-medium">
                <FaCheck /> Accept
              </button>
              <button onClick={onReject} className="flex items-center gap-1 bg-red-500 hover:bg-red-600 text-white text-xs px-3 py-1.5 rounded-lg transition font-medium">
                <FaTimes /> Reject
              </button>
            </>
          ) : (
            <span className={`px-3 py-1.5 rounded-full text-xs font-bold ${appt.status === "accepted" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-600"}`}>
              {appt.status === "accepted" ? "✓ Confirmed" : "✗ Rejected"}
            </span>
          )}
        </div>
      </div>

      {/* Actions for accepted appointments */}
      {appt.status === "accepted" && (
        <div className="flex flex-wrap gap-2 pt-2 border-t border-gray-100">
          {/* Sample Collected */}
          {!appt.sampleCollected ? (
            <button onClick={handleSampleCollect} disabled={notifying}
              className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs px-3 py-2 rounded-lg font-semibold transition disabled:opacity-60">
              {notifying
                ? <svg className="animate-spin h-3 w-3" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" /></svg>
                : <FaBell />}
              Notify: Sample Collected
            </button>
          ) : (
            <span className="flex items-center gap-1.5 bg-blue-100 text-blue-700 text-xs px-3 py-2 rounded-lg font-semibold">
              <FaCheck /> Sample Collected ✓
            </span>
          )}

          {/* Upload Report */}
          {!report ? (
            <>
              <button onClick={() => fileRef.current?.click()} disabled={uploading}
                className="flex items-center gap-1.5 bg-purple-600 hover:bg-purple-700 text-white text-xs px-3 py-2 rounded-lg font-semibold transition disabled:opacity-60">
                {uploading
                  ? <svg className="animate-spin h-3 w-3" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" /></svg>
                  : <FaUpload />}
                Upload Report (PDF/Image)
              </button>
              <input ref={fileRef} type="file" accept=".pdf,image/*" className="hidden" onChange={handleFileChange} />
            </>
          ) : (
            <span className="flex items-center gap-1.5 bg-purple-100 text-purple-700 text-xs px-3 py-2 rounded-lg font-semibold">
              <FaFilePdf /> Report Uploaded ✓
              <span className="text-[10px] text-purple-400 ml-1">({report.fileName})</span>
            </span>
          )}
        </div>
      )}
    </div>
  );
};

/* ═══════════════════════════════════════════════════
   TEST CARD (Enhanced inventory list)
═══════════════════════════════════════════════════ */
const LabTestCard = ({ test, onDelete, onEdit }) => (
  <div className="group relative flex flex-col p-5 bg-white border border-gray-100 rounded-3xl hover:border-cyan-200 hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
    <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
      <button onClick={() => onEdit(test)}
        className="text-gray-400 hover:text-cyan-600 hover:bg-cyan-50 p-2 rounded-xl transition-colors" title="Edit">
        <FaUserEdit className="text-sm" />
      </button>
      <button onClick={() => onDelete(test._id || test.id)}
        className="text-gray-300 hover:text-red-500 hover:bg-red-50 p-2 rounded-xl transition-colors" title="Remove">
        <FaTrash className="text-sm" />
      </button>
    </div>
    
    <div className="flex items-start justify-between mb-3">
      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-xl shadow-sm
        ${test.isPackage ? "bg-purple-50 text-purple-600 border border-purple-100" : "bg-cyan-50 text-cyan-600 border border-cyan-100"}`}>
        {test.isPackage ? <FaFolderOpen /> : <GiTestTubes />}
      </div>
    </div>
    
    <div className="space-y-1">
      <h4 className="font-black text-gray-800 text-sm line-clamp-1">{test.name}</h4>
      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter">{test.category}</p>
    </div>

    <div className="mt-4 pt-4 border-t border-gray-50 flex items-center justify-between">
      <div className="flex flex-col">
        <p className="text-lg font-black text-gray-900 leading-none">₹{test.price}</p>
        <p className="text-[9px] text-gray-400 font-medium mt-1 flex items-center gap-1">
          <FaClock className="text-[8px]" /> {test.turnaround}
        </p>
      </div>
      <div className="flex gap-1.5">
        {test.requiresCenterVisit && (
          <span className="bg-purple-50 text-purple-600 text-[9px] font-black px-2 py-1 rounded-lg uppercase tracking-tighter shadow-sm shadow-purple-100/50">
            Center Visit (Slot) ✓
          </span>
        )}
        {test.homeCollection && (
          <span className="bg-emerald-50 text-emerald-600 text-[9px] font-black px-2 py-1 rounded-lg uppercase tracking-tighter shadow-sm shadow-emerald-100/50">
            Home ✓
          </span>
        )}
        {test.isPackage && (
          <span className="bg-purple-100 text-purple-700 text-[9px] font-black px-2 py-1 rounded-lg uppercase tracking-tighter">
            Pkg
          </span>
        )}
      </div>
    </div>

    {test.isPackage && test.packageTests?.length > 0 && (
      <div className="mt-3 flex flex-wrap gap-1">
        {test.packageTests.slice(0, 3).map(n => (
          <span key={n} className="text-[8px] bg-gray-50 text-gray-400 px-1.5 py-0.5 rounded border border-gray-100 font-medium">
            {n}
          </span>
        ))}
        {test.packageTests.length > 3 && <span className="text-[8px] text-gray-300 font-bold">+{test.packageTests.length - 3}</span>}
      </div>
    )}
  </div>
);

/* ═══════════════════════════════════════════════════
   BULK UPLOAD MODAL
═══════════════════════════════════════════════════ */
const BulkUploadModal = ({ labEmail, labName, onComplete, onClose }) => {
  const { bulkAddLabTests } = useAppointment();
  const [csvData, setCsvData] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (!file.name.endsWith(".csv")) { setError("Please upload a .csv file"); return; }

    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target.result;
      const lines = text.split("\n").filter(l => l.trim());
      const headers = lines[0].split(",").map(h => h.trim().toLowerCase());
      
      const tests = lines.slice(1).map(line => {
        const values = line.split(",").map(v => v.trim());
        const t = {};
        headers.forEach((h, i) => {
          if (h.includes("name")) t.name = values[i];
          if (h.includes("category")) t.category = values[i];
          if (h.includes("price")) t.price = Number(values[i]);
          if (h.includes("turnaround")) t.turnaround = values[i];
          if (h.includes("collection") && h.includes("available")) t.homeCollection = values[i]?.toLowerCase() === "true" || values[i] === "1";
          if (h.includes("charge")) t.homeCollectionCharge = Number(values[i] || 0);
        });
        return t;
      }).filter(t => t.name && t.price);
      
      setCsvData(tests);
      setError("");
    };
    reader.readAsText(file);
  };

  const confirmUpload = async () => {
    if (!csvData) return;
    setUploading(true);
    try {
      await bulkAddLabTests({ labEmail, labName, tests: csvData });
      onComplete();
      onClose();
    } catch (err) { setError("Upload failed: " + err.message); }
    setUploading(false);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl animate-in zoom-in-95">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-black text-gray-800">Bulk CSV Upload</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><FaTimes /></button>
        </div>
        
        <div className="mb-6 space-y-4">
          <div className="bg-gray-50 border-2 border-dashed border-gray-200 rounded-2xl p-8 text-center cursor-pointer hover:border-cyan-400 hover:bg-cyan-50/30 transition"
               onClick={() => document.getElementById("csvFile")?.click()}>
            <FaUpload className="text-3xl text-gray-300 mx-auto mb-3" />
            <p className="text-sm font-bold text-gray-600">Click to upload CSV</p>
            <p className="text-[10px] text-gray-400 mt-1">Format: Name, Category, Price, Turnaround, Home Collection Available</p>
          </div>
          <input id="csvFile" type="file" accept=".csv" className="hidden" onChange={handleFileUpload} />
          
          {error && <p className="text-xs text-red-500 font-bold bg-red-50 p-3 rounded-xl border border-red-100">{error}</p>}
          
          {csvData && (
            <div className="bg-emerald-50 text-emerald-700 p-4 rounded-2xl border border-emerald-100">
              <p className="text-xs font-bold flex items-center gap-2">
                <FaCheck /> {csvData.length} tests parsed successfully
              </p>
            </div>
          )}
        </div>

        <div className="flex gap-3">
          <button onClick={confirmUpload} disabled={!csvData || uploading}
            className="flex-1 bg-cyan-600 text-white py-3.5 rounded-2xl font-black shadow-lg shadow-cyan-100 hover:bg-cyan-700 transition disabled:opacity-50">
            {uploading ? "UPLOADING..." : "IMPORT ALL TESTS"}
          </button>
          <button onClick={onClose} className="px-6 py-3.5 bg-gray-100 text-gray-500 rounded-2xl font-bold hover:bg-gray-200 transition">Cancel</button>
        </div>
      </div>
    </div>
  );
};

/* ═══════════════════════════════════════════════════
   SIDEBAR
═══════════════════════════════════════════════════ */
const SidebarItem = ({ icon, label, active, onClick }) => (
  <div onClick={onClick} className={`flex items-center gap-3 px-4 py-3 rounded-lg cursor-pointer transition-all duration-200 group ${active ? "bg-white/10 text-white shadow-inner" : "text-cyan-100 hover:bg-cyan-500 hover:text-white"}`}>
    <span className={`text-lg ${active ? "opacity-100" : "opacity-80 group-hover:opacity-100"}`}>{icon}</span>
    <span className="font-medium">{label}</span>
  </div>
);

const StatCard = ({ icon, title, count, subtitle, color, bg }) => (
  <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4 hover:shadow-md transition">
    <div className={`w-14 h-14 rounded-full flex items-center justify-center text-xl ${bg} ${color}`}>{icon}</div>
    <div>
      <h3 className="text-2xl font-bold text-gray-800">{count}</h3>
      <p className="text-sm font-medium text-gray-500">{title}</p>
      <p className="text-xs text-gray-400 mt-0.5">{subtitle}</p>
    </div>
  </div>
);

/* ── Pending Approval Screen ── */
const PendingApprovalScreen = ({ role, onLogout, status }) => {
  const isRejected = status === "rejected";
  
  return (
    <div className={`min-h-screen bg-gradient-to-br flex flex-col items-center justify-center p-6 ${isRejected ? "from-red-50 to-orange-100" : "from-cyan-50 to-blue-100"}`}>
      <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-10 max-w-md w-full text-center">
        <div className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-5 ${isRejected ? "bg-red-100" : "bg-yellow-100"}`}>
          {isRejected ? <FaTimes className="text-red-500 text-3xl" /> : <FaClock className="text-yellow-500 text-3xl" />}
        </div>
        <h2 className={`text-2xl font-bold mb-2 ${isRejected ? "text-red-600" : "text-gray-800"}`}>
          {isRejected ? "Application Rejected" : "Approval Pending"}
        </h2>
        <p className="text-gray-500 mb-1">Your <strong>{role}</strong> account has been registered.</p>
        
        {isRejected ? (
          <>
            <p className="text-gray-500 mb-6">Unfortunately, your profile registry has been <span className="text-red-600 font-semibold">Rejected</span> by the admin team after review.</p>
            <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-800 font-medium mb-6 text-left">
              📩 Please contact support at <strong>d2dpharma247@gmail.com</strong> if you believe this is a mistake or to request a re-review.
            </div>
          </>
        ) : (
          <>
            <p className="text-gray-500 mb-6">Please wait for the <span className="text-cyan-600 font-semibold">D2D Pharma Admin</span> to review and approve your profile before you can access the dashboard.</p>
            <div className="bg-yellow-50 border border-yellow-200 rounded-xl px-4 py-3 text-sm text-yellow-800 font-medium mb-6">
              ⏳ Approval usually takes a few hours during working hours.
            </div>
          </>
        )}
        
        <button onClick={onLogout} className="flex items-center gap-2 mx-auto bg-gray-100 hover:bg-gray-200 text-gray-700 px-5 py-2.5 rounded-xl text-sm font-semibold transition">
          <FaSignOutAlt /> Logout
        </button>
      </div>
    </div>
  );
};

/* ═══════════════════════════════════════════════════
   MAIN LAB DASHBOARD
═══════════════════════════════════════════════════ */
const LabDashboard = () => {
  const { user, logout, updateProfile, getAccountStatus } = useAuth();
  const {
    getPartnerAppointments, updateAppointmentStatus,
    getLabTestsByLab, deleteLabTest,
    markSampleCollected, uploadReport, getReportByAppointment, submitComplaint,
    registerPartner, fetchPartnerAppointments, fetchLabTestsByLab, fetchNotifications
  } = useAppointment();
  const { nearestArea } = useLocation();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("bookings");
  const [searchQuery, setSearchQuery] = useState("");
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [editingTest, setEditingTest] = useState(null);
  const [availability, setAvailability] = useState(null);
  const [savingAvailability, setSavingAvailability] = useState(false);
  const { fetchLabAvailability, saveLabAvailability } = useAppointment();

  // Profile Edit State
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    phone: user?.phone || "",
    location: user?.location || "",
    bankName: user?.bankName || user?.bank?.bankName || "",
    accountNum: user?.accountNum || user?.bank?.accountNumber || "",
    ifsc: user?.ifsc || user?.bank?.ifsc || ""
  });

  // Complaint State
  const [complaintForm, setComplaintForm] = useState({ reason: "", email: user?.email || "" });
  const [complaintStatus, setComplaintStatus] = useState("");

  // Location detection state
  const [detecting, setDetecting] = useState(false);
  const [detectErr, setDetectErr] = useState("");

  // Sync Edit Form with User Data
  useEffect(() => {
    if (user) {
      setEditForm({
        phone: user.phone || "",
        location: user.location || "",
        bankName: user.bankName || user.bank?.bankName || "",
        accountNum: user.accountNum || user.bank?.accountNumber || "",
        ifsc: user.ifsc || user.bank?.ifsc || ""
      });
      setComplaintForm(prev => ({ ...prev, email: user.email || "" }));
      // Fetch from DB on mount
      fetchPartnerAppointments(user.email);
      fetchLabTestsByLab(user.email);
      fetchNotifications(user.email);
      fetchLabAvailability(user.email).then(setAvailability);
    }
  }, [user?.email]);

  const detectAddress = () => {
    setDetecting(true); setDetectErr("");
    if (!navigator.geolocation) { setDetectErr("Geolocation not supported"); setDetecting(false); return; }
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        const area = nearestArea(coords.latitude, coords.longitude);
        setEditForm(prev => ({ ...prev, location: `${area}` }));
        setDetecting(false);
      },
      () => { setDetectErr("Could not detect. Please enter manually."); setDetecting(false); },
      { timeout: 8000 }
    );
  };

  const [, setTs] = useState(0);

  const handleLogout = () => { logout(); navigate("/login"); };

  // ── Approval Gate ──
  const accountStatus = getAccountStatus();
  if (accountStatus !== "approved") {
    return <PendingApprovalScreen role="Lab" onLogout={handleLogout} status={accountStatus} />;
  }

  const appointments = getPartnerAppointments(user?.email || "");
  const pending = appointments.filter(a => a.status === "pending");
  const confirmed = appointments.filter(a => a.status === "accepted");
  const samplesCollected = appointments.filter(a => a.sampleCollected === true);
  const reportsUploaded = appointments.filter(a => a.reportUploaded === true);
  const paidBookings = appointments.filter(a => a.paymentStatus === "paid");
  const totalEarned = paidBookings.reduce((sum, a) => sum + (Number(a.amount) || 0), 0);
  const myTests = getLabTestsByLab(user?.email || "");

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    updateProfile(editForm);
    setIsEditing(false);
  };

  const handleComplaintSubmit = async (e) => {
    e.preventDefault();
    setComplaintStatus("submitting");
    try {
      await submitComplaint(complaintForm.email, complaintForm.reason);
      setComplaintStatus("success");
      setComplaintForm({ reason: "", email: user?.email || "" });
    } catch (error) {
      setComplaintStatus("error");
      console.error("Error submitting complaint:", error);
    }
    setTimeout(() => setComplaintStatus(""), 3000);
  };

  return (
    <div className="min-h-screen flex bg-gray-50 text-gray-800 font-sans">
      {/* SIDEBAR */}
      <aside className="w-64 bg-cyan-600 text-white flex flex-col fixed h-full shadow-xl z-20">
        <div className="px-6 py-6 border-b border-cyan-500/50 flex items-center gap-3">
          <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center text-cyan-600 font-bold text-lg">D</div>
          <span className="text-xl font-bold tracking-wide">D2D Pharma</span>
        </div>
        <nav className="flex-1 px-4 py-6 space-y-2">
          <SidebarItem icon={<MdDashboard />} label="Dashboard" active={false} onClick={() => {}} />
          <SidebarItem icon={<FaClipboardList />} label="Bookings" active={activeTab === "bookings"} onClick={() => setActiveTab("bookings")} />
          <SidebarItem icon={<FaFlask />} label="My Tests" active={activeTab === "tests"} onClick={() => setActiveTab("tests")} />
          <SidebarItem icon={<FaClock />} label="Availability" active={activeTab === "availability"} onClick={() => setActiveTab("availability")} />
          <SidebarItem icon={<FaRupeeSign />} label="Earnings" active={activeTab === "earnings"} onClick={() => setActiveTab("earnings")} />
          <SidebarItem icon={<FaUserEdit />} label="Profile" active={activeTab === "profile"} onClick={() => setActiveTab("profile")} />
          <SidebarItem icon={<FaExclamationTriangle />} label="Support" active={activeTab === "support"} onClick={() => setActiveTab("support")} />
        </nav>
        <div className="p-4 border-t border-cyan-500/50">
          <button onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-red-500/90 transition text-sm font-medium">
            <FaSignOutAlt /> Logout
          </button>
        </div>
      </aside>

      {/* MAIN */}
      <main className="flex-1 ml-64 p-8 overflow-y-auto">
        <header className="flex justify-between items-start mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">
              Welcome, <span className="text-cyan-600">{user?.name || "Lab Partner"}</span>
            </h1>
            <p className="text-gray-500 mt-1">Manage test bookings, send reports, and update your catalogue.</p>
          </div>
          <div onClick={() => setActiveTab("profile")} className="flex items-center gap-3 bg-white px-4 py-2 rounded-lg shadow-sm border border-gray-100 cursor-pointer hover:border-blue-200 transition">
             <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold overflow-hidden">
               {user?.profilePhoto ? <img src={user.profilePhoto} alt="p" className="w-full h-full object-cover" /> : <FaMicroscope />}
             </div>
             <div>
               <p className="text-xs text-gray-400 font-bold uppercase">Lab Technician</p>
               <p className="text-sm font-semibold">{user?.name}</p>
             </div>
          </div>
        </header>

        {/* STATS */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <StatCard icon={<FaFlask />}       title="Total Bookings"     count={appointments.length}       subtitle="All time"               color="text-cyan-600"   bg="bg-cyan-50" />
          <StatCard icon={<FaVial />}        title="Samples Collected"  count={samplesCollected.length}   subtitle="Sample collection done" color="text-blue-600"   bg="bg-blue-50" />
          <StatCard icon={<FaFilePdf />}     title="Reports Uploaded"   count={reportsUploaded.length}    subtitle="Reports sent to users"  color="text-purple-600" bg="bg-purple-50" />
          <StatCard icon={<FaRupeeSign />}   title="Total Earned"       count={`₹${totalEarned.toLocaleString("en-IN")}`} subtitle="From paid bookings" color="text-emerald-600" bg="bg-emerald-50" />
        </div>

        {/* TABS */}
        <div className="flex gap-2 mb-6">
          <button onClick={() => setActiveTab("bookings")}
            className={`px-5 py-2 rounded-xl text-sm font-bold transition ${activeTab === "bookings" ? "bg-cyan-600 text-white shadow-md" : "bg-white text-gray-600 border border-gray-200 hover:border-cyan-400"}`}>
            🧪 Bookings {pending.length > 0 && <span className="ml-1 bg-red-500 text-white text-[10px] px-1.5 rounded-full">{pending.length}</span>}
          </button>
          <button onClick={() => setActiveTab("tests")}
            className={`px-5 py-2 rounded-xl text-sm font-bold transition ${activeTab === "tests" ? "bg-cyan-600 text-white shadow-md" : "bg-white text-gray-600 border border-gray-200 hover:border-cyan-400"}`}>
            📋 My Tests
          </button>
          <button onClick={() => setActiveTab("earnings")}
            className={`px-5 py-2 rounded-xl text-sm font-bold transition ${activeTab === "earnings" ? "bg-cyan-600 text-white shadow-md" : "bg-white text-gray-600 border border-gray-200 hover:border-cyan-400"}`}>
            💰 Earnings
          </button>
          <button onClick={() => setActiveTab("availability")}
            className={`px-5 py-2 rounded-xl text-sm font-bold transition ${activeTab === "availability" ? "bg-cyan-600 text-white shadow-md" : "bg-white text-gray-600 border border-gray-200 hover:border-cyan-400"}`}>
            ⏰ Availability
          </button>
        </div>

        {/* ─── BOOKINGS TAB ─── */}
        {activeTab === "bookings" && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            {/* Legend */}
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-bold text-gray-800">Test Booking Requests</h2>
              <span className="text-sm text-gray-400">{appointments.length} total</span>
            </div>
            <div className="flex flex-wrap gap-3 mb-5 text-xs">
              <span className="bg-blue-50 text-blue-600 border border-blue-100 px-3 py-1.5 rounded-lg font-medium">🔵 "Notify: Sample Collected" → Patient gets notification</span>
              <span className="bg-purple-50 text-purple-600 border border-purple-100 px-3 py-1.5 rounded-lg font-medium">🟣 "Upload Report" → Patient can download from Profile</span>
            </div>

            {appointments.length === 0 ? (
              <div className="text-center py-12 text-gray-400">
                <FaFlask className="text-4xl mx-auto mb-3 text-gray-300" />
                <p className="font-medium">No test bookings yet.</p>
                <p className="text-sm mt-1">Patients will appear here after they book a test with you.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {appointments.map(appt => (
                  <BookingCard key={appt._id || appt.id} appt={appt}
                    onAccept={() => updateAppointmentStatus(appt._id || appt.id, "accepted")}
                    onReject={() => updateAppointmentStatus(appt._id || appt.id, "rejected")}
                    onSampleCollected={markSampleCollected}
                    onReportUpload={uploadReport}
                    getReportByAppointment={getReportByAppointment}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* ─── MY TESTS TAB ─── */}
        {activeTab === "tests" && (
          <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 items-start">
            {/* Left Column: Entry Form */}
            <div className="xl:col-span-7">
              <AddLabTestForm
                labEmail={user?.email || ""}
                labName={user?.name || ""}
                onAdded={() => { setTs(Date.now()); }}
                allTests={myTests}
                editingTest={editingTest}
                onCancelEdit={() => setEditingTest(null)}
              />
            </div>

            {/* Right Column: List & Actions */}
            <div className="xl:col-span-5 space-y-6">
              <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6 overflow-hidden">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="text-base font-black text-gray-800">Test Inventory</h3>
                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">{myTests.length} Items Listed</p>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => setShowBulkModal(true)}
                       className="p-3 bg-cyan-50 text-cyan-600 rounded-2xl border border-cyan-100 hover:bg-cyan-100 transition shadow-sm" title="Bulk Upload CSV">
                       <FaUpload className="text-sm" />
                    </button>
                  </div>
                </div>

                {/* Search Bar */}
                <div className="relative mb-6">
                  <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-xs" />
                  <input 
                    type="text" 
                    placeholder="Search test by name..." 
                    className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-11 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-400 transition"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>

                {myTests.length === 0 ? (
                  <div className="text-center py-20 text-gray-400">
                    <div className="w-16 h-16 bg-gray-50 rounded-3xl flex items-center justify-center mx-auto mb-4 border border-gray-100">
                      <GiTestTubes className="text-3xl text-gray-200" />
                    </div>
                    <p className="font-black text-xs uppercase tracking-widest">Inventory Empty</p>
                    <p className="text-[10px] mt-1">Start adding tests to build your catalogue.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-h-[700px] overflow-y-auto pr-2 pb-4">
                    {myTests
                      .filter(t => t.name.toLowerCase().includes(searchQuery.toLowerCase()))
                      .map(test => (
                        <LabTestCard 
                          key={test._id || test.id} 
                          test={test} 
                          onDelete={deleteLabTest} 
                          onEdit={setEditingTest}
                        />
                      ))}
                  </div>
                )}
              </div>
            </div>
            
            {showBulkModal && (
              <BulkUploadModal 
                labEmail={user?.email || ""} 
                labName={user?.name || ""} 
                onComplete={() => { setTs(Date.now()); }}
                onClose={() => setShowBulkModal(false)} 
              />
            )}
          </div>
        )}

        {/* ─── EARNINGS / PAYMENTS TAB ─── */}
        {activeTab === "earnings" && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            {/* Summary bar */}
            <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
              <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                <FaRupeeSign className="text-emerald-600" /> Payments & Earnings
              </h2>
              <div className="flex gap-3">
                <div className="bg-emerald-50 border border-emerald-100 rounded-xl px-4 py-2 text-center">
                  <p className="text-xs text-emerald-600 font-semibold uppercase">Total Earned</p>
                  <p className="text-xl font-bold text-emerald-700">₹{totalEarned.toLocaleString("en-IN")}</p>
                </div>
                <div className="bg-cyan-50 border border-cyan-100 rounded-xl px-4 py-2 text-center">
                  <p className="text-xs text-cyan-600 font-semibold uppercase">Paid Bookings</p>
                  <p className="text-xl font-bold text-cyan-700">{paidBookings.length}</p>
                </div>
              </div>
            </div>

            {paidBookings.length === 0 ? (
              <div className="text-center py-16 text-gray-400">
                <FaRupeeSign className="text-5xl mx-auto mb-3 text-gray-200" />
                <p className="font-semibold text-base">No earnings yet.</p>
                <p className="text-sm mt-1">Earnings appear after patients pay for test bookings.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-xs text-gray-400 uppercase tracking-widest border-b border-gray-100">
                      <th className="text-left pb-3 font-semibold">Patient</th>
                      <th className="text-left pb-3 font-semibold">Phone</th>
                      <th className="text-left pb-3 font-semibold">Date</th>
                      <th className="text-left pb-3 font-semibold">Tests Booked</th>
                      <th className="text-left pb-3 font-semibold">Collection</th>
                      <th className="text-left pb-3 font-semibold">Payment Via</th>
                      <th className="text-right pb-3 font-semibold">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {paidBookings.slice().reverse().map(a => (
                      <tr key={a._id || a.id} className="hover:bg-gray-50 transition">
                        <td className="py-3.5">
                          <p className="font-semibold text-gray-800">{a.name}</p>
                          <p className="text-xs text-gray-400">{a.email || a.patientEmail || "—"}</p>
                        </td>
                        <td className="py-3.5 text-gray-600 text-xs">{a.phone || "—"}</td>
                        <td className="py-3.5 text-gray-500 text-xs whitespace-nowrap">
                          {a.appointmentDate}<br/>{a.appointmentTime}
                        </td>
                        <td className="py-3.5 text-gray-500 text-xs max-w-[180px]">
                          <span className="line-clamp-2">{Array.isArray(a.tests) ? a.tests.join(", ") : (a.reason || "—")}</span>
                        </td>
                        <td className="py-3.5">
                          <span className={`px-2 py-1 rounded-full text-[10px] font-bold ${a.homeCollection ? "bg-green-50 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                            {a.homeCollection ? "🏠 Home" : "🏥 Centre"}
                          </span>
                        </td>
                        <td className="py-3.5"><PayBadge method={a.paymentMethod} /></td>
                        <td className="py-3.5 text-right font-bold text-emerald-700 text-base">₹{Number(a.amount || 0).toLocaleString("en-IN")}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="border-t-2 border-gray-200">
                      <td colSpan={6} className="pt-3 font-bold text-gray-600 text-sm">Total</td>
                      <td className="pt-3 text-right font-bold text-emerald-700 text-lg">₹{totalEarned.toLocaleString("en-IN")}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            )}
          </div>
        )}

        {/* ─── PROFILE TAB ─── */}
        {activeTab === "profile" && (
          <div className="max-w-4xl space-y-6 animate-in fade-in slide-in-from-bottom-4">
            <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="h-32 bg-gradient-to-r from-blue-700 to-indigo-800 relative">
                <div className="absolute -bottom-12 left-8 p-1 bg-white rounded-3xl shadow-lg border border-gray-50">
                   <div className="w-24 h-24 bg-blue-50 rounded-2xl flex items-center justify-center text-3xl text-blue-600 overflow-hidden border border-blue-100">
                    {user?.profilePhoto ? <img src={user.profilePhoto} alt="profile" className="w-full h-full object-cover" /> : <FaMicroscope />}
                   </div>
                   <button 
                    onClick={() => {
                      const input = document.createElement("input"); input.type = "file"; input.accept = "image/*";
                      input.onchange = (e) => {
                        const file = e.target.files[0];
                        if (file) {
                          const reader = new FileReader();
                          reader.onload = (ev) => updateProfile({ profilePhoto: ev.target.result });
                          reader.readAsDataURL(file);
                        }
                      };
                      input.click();
                    }}
                    className="absolute bottom-1 right-1 bg-blue-700 text-white p-2 rounded-xl border-4 border-white shadow-md hover:scale-110 transition"
                   >
                     <FaCamera className="text-sm" />
                   </button>
                </div>
              </div>
              
              <div className="pt-16 pb-8 px-8 flex justify-between items-end flex-wrap gap-4">
                <div>
                  <h2 className="text-2xl font-black text-gray-800 flex items-center gap-2">
                    {user?.name}
                    <span className="bg-blue-100 text-blue-700 text-[10px] px-2 py-0.5 rounded-full uppercase tracking-tighter">Verified Lab</span>
                  </h2>
                  <p className="text-gray-500 font-medium">{user?.specialty || "Lab Diagnostics"} • {user?.email}</p>
                </div>
                {!isEditing && (
                  <button onClick={() => setIsEditing(true)} className="flex items-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-700 px-6 py-2.5 rounded-2xl font-bold text-sm transition">
                    <FaUserEdit /> Edit Lab Details
                  </button>
                )}
              </div>

              <div className="p-8 border-t border-gray-50 bg-gray-50/30">
                {isEditing ? (
                  <form onSubmit={(e) => { 
                    e.preventDefault(); 
                    updateProfile(editForm); 
                    registerPartner({ ...user, ...editForm }); // Sync full profile
                    setIsEditing(false); 
                  }} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-gray-400 uppercase tracking-widest px-1">Lab Location / Address</label>
                        <div className="relative group">
                          <input 
                            type="text"
                            value={editForm.location}
                            onChange={e => setEditForm({...editForm, location: e.target.value})}
                            className="w-full bg-white border border-gray-200 rounded-2xl px-5 py-4 focus:outline-none focus:ring-2 focus:ring-blue-500 transition shadow-sm pr-14"
                            placeholder="e.g. Apex Diagnostics, Gomti Nagar"
                          />
                          <button
                            type="button"
                            onClick={detectAddress}
                            disabled={detecting}
                            className={`absolute right-3 top-1/2 -translate-y-1/2 p-2.5 rounded-xl transition ${detecting ? "text-blue-400 cursor-wait" : "text-blue-600 hover:bg-blue-50"}`}
                            title="Auto-detect location"
                          >
                            <FaLocationArrow className={detecting ? "animate-pulse" : ""} />
                          </button>
                        </div>
                        {detectErr && <p className="text-[10px] text-red-500 font-bold px-1">{detectErr}</p>}
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-gray-400 uppercase tracking-widest px-1">Phone Number</label>
                        <input 
                          type="text"
                          value={editForm.phone}
                          onChange={e => setEditForm({...editForm, phone: e.target.value})}
                          className="w-full bg-white border border-gray-200 rounded-2xl px-5 py-4 focus:outline-none focus:ring-2 focus:ring-blue-500 transition shadow-sm"
                        />
                      </div>
                    </div>

                    <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm space-y-4">
                      <h4 className="font-bold text-gray-800 flex items-center gap-2 border-b border-gray-50 pb-3 mb-2">
                        <FaUniversity className="text-blue-700" /> Settlement Account Details
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <input placeholder="Bank Name" className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-3" value={editForm.bankName} onChange={e => setEditForm({...editForm, bankName: e.target.value})} />
                        <input placeholder="IFSC Code" className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-3" value={editForm.ifsc} onChange={e => setEditForm({...editForm, ifsc: e.target.value})} />
                        <input placeholder="Account Number" className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 md:col-span-2" value={editForm.accountNum} onChange={e => setEditForm({...editForm, accountNum: e.target.value})} />
                      </div>
                    </div>

                    <div className="flex gap-4 pt-4 border-t border-gray-100">
                      <button type="submit" className="flex-1 bg-blue-700 text-white py-4 rounded-2xl font-bold shadow-lg shadow-blue-200 hover:bg-blue-800 transition">Save Changes</button>
                      <button type="button" onClick={() => setIsEditing(false)} className="px-8 py-4 bg-gray-100 text-gray-500 rounded-2xl font-bold hover:bg-gray-200 transition">Cancel</button>
                    </div>
                  </form>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                    <div className="group">
                      <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-1.5 flex items-center gap-2">
                        <FaMapMarkerAlt className="text-red-500" /> Lab Address
                      </p>
                      <p className="text-sm font-bold text-gray-700 leading-relaxed">{user?.location || "Not set"}</p>
                    </div>
                    <div className="group">
                      <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-1.5 flex items-center gap-2">
                        <FaPhoneAlt className="text-green-500" /> Contact Number
                      </p>
                      <p className="text-sm font-bold text-gray-700">{user?.phone || "Not set"}</p>
                    </div>
                    <div className="sm:col-span-2 bg-white p-6 rounded-3xl border border-blue-50 flex items-center gap-5 shadow-sm">
                       <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-700">
                         <FaUniversity className="text-xl" />
                       </div>
                       <div>
                         <p className="text-xs font-black text-gray-400 uppercase tracking-widest mb-1">Bank Settlement Account</p>
                         <p className="text-sm font-bold text-gray-700 italic">
                           {user?.bankName ? `${user.bankName} (AC: ****${user.accountNum?.slice(-4)})` : "Bank details not configured"}
                         </p>
                       </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ─── AVAILABILITY TAB ─── */}
        {activeTab === "availability" && availability && (
          <div className="max-w-4xl space-y-6 animate-in fade-in slide-in-from-bottom-4">
             <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8 space-y-8">
                <div className="flex items-center justify-between border-b border-gray-50 pb-6">
                   <div>
                      <h2 className="text-2xl font-black text-gray-800 tracking-tight">Center Slot Availability</h2>
                      <p className="text-gray-500 font-medium mt-1">Manage tests that require a center visit (X-Ray, MRI, etc.)</p>
                   </div>
                   <button 
                     onClick={async () => {
                        setSavingAvailability(true);
                        await saveLabAvailability(availability);
                        setSavingAvailability(false);
                        alert("Availability saved successfully!");
                     }}
                     disabled={savingAvailability}
                     className="bg-cyan-600 hover:bg-cyan-700 text-white px-8 py-3 rounded-2xl font-black shadow-lg shadow-cyan-100 transition flex items-center gap-2"
                   >
                     {savingAvailability ? <FaClock className="animate-spin" /> : <FaCheck />} SAVE SETTINGS
                   </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                   {/* Days Selection */}
                   <div className="space-y-4">
                      <h3 className="text-sm font-black text-gray-400 uppercase tracking-[0.2em] flex items-center gap-2">
                        <FaClipboardList className="text-cyan-600" /> Working Days
                      </h3>
                      <div className="flex flex-wrap gap-2">
                        {["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"].map(day => (
                          <button
                            key={day}
                            onClick={() => {
                              const days = availability.availableDays.includes(day)
                                ? availability.availableDays.filter(d => d !== day)
                                : [...availability.availableDays, day];
                              setAvailability({ ...availability, availableDays: days });
                            }}
                            className={`px-4 py-2 rounded-xl text-xs font-bold transition border
                              ${availability.availableDays.includes(day) 
                                ? "bg-cyan-600 text-white border-cyan-600 shadow-md" 
                                : "bg-white text-gray-500 border-gray-200 hover:border-cyan-400"}`}
                          >
                            {day}
                          </button>
                        ))}
                      </div>
                   </div>

                   {/* Slot Config */}
                   <div className="space-y-4 text-right">
                      <h3 className="text-sm font-black text-gray-400 uppercase tracking-[0.2em] flex items-center gap-2 justify-end">
                        Capacity & Duration <FaChartLine className="text-cyan-600" />
                      </h3>
                      <div className="flex items-center gap-4 justify-end">
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-gray-400 uppercase">Min per Slot</label>
                          <select 
                            className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-2 text-sm font-bold"
                            value={availability.slotDuration}
                            onChange={e => setAvailability({ ...availability, slotDuration: Number(e.target.value) })}
                          >
                            <option value={15}>15 Mins</option>
                            <option value={30}>30 Mins</option>
                            <option value={60}>60 Mins</option>
                          </select>
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-gray-400 uppercase">People per Slot</label>
                          <input 
                            type="number"
                            className="w-20 bg-gray-50 border border-gray-200 rounded-xl px-4 py-2 text-sm font-bold text-center"
                            value={availability.capacityPerSlot}
                            onChange={e => setAvailability({ ...availability, capacityPerSlot: Number(e.target.value) })}
                          />
                        </div>
                      </div>
                   </div>
                </div>

                {/* Timing Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6 border-t border-gray-50">
                   {/* Morning */}
                   <div className={`p-6 rounded-3xl border transition ${availability.morning.active ? "bg-blue-50/50 border-blue-100" : "bg-gray-50/50 border-gray-100 opacity-60"}`}>
                      <div className="flex items-center justify-between mb-4">
                        <h4 className="font-black text-blue-700 flex items-center gap-2">☀️ Morning Shift</h4>
                        <button 
                          onClick={() => setAvailability({ ...availability, morning: { ...availability.morning, active: !availability.morning.active } })}
                          className={`w-12 h-6 rounded-full relative transition ${availability.morning.active ? "bg-blue-600" : "bg-gray-300"}`}
                        >
                          <div className={`w-4 h-4 bg-white rounded-full absolute top-1 transition-all ${availability.morning.active ? "right-1" : "left-1"}`} />
                        </button>
                      </div>
                      <div className="flex gap-4">
                        <div className="flex-1 space-y-1">
                          <p className="text-[10px] font-bold text-gray-400 uppercase">Start Time</p>
                          <input type="time" className="w-full bg-white border border-blue-100 rounded-xl px-4 py-2 text-sm" value={availability.morning.start} onChange={e => setAvailability({...availability, morning: {...availability.morning, start: e.target.value}})} />
                        </div>
                        <div className="flex-1 space-y-1">
                          <p className="text-[10px] font-bold text-gray-400 uppercase">End Time</p>
                          <input type="time" className="w-full bg-white border border-blue-100 rounded-xl px-4 py-2 text-sm" value={availability.morning.end} onChange={e => setAvailability({...availability, morning: {...availability.morning, end: e.target.value}})} />
                        </div>
                      </div>
                   </div>

                   {/* Evening */}
                   <div className={`p-6 rounded-3xl border transition ${availability.evening.active ? "bg-indigo-50/50 border-indigo-100" : "bg-gray-50/50 border-gray-100 opacity-60"}`}>
                      <div className="flex items-center justify-between mb-4">
                        <h4 className="font-black text-indigo-700 flex items-center gap-2">🌙 Evening Shift</h4>
                        <button 
                          onClick={() => setAvailability({ ...availability, evening: { ...availability.evening, active: !availability.evening.active } })}
                          className={`w-12 h-6 rounded-full relative transition ${availability.evening.active ? "bg-indigo-600" : "bg-gray-300"}`}
                        >
                          <div className={`w-4 h-4 bg-white rounded-full absolute top-1 transition-all ${availability.evening.active ? "right-1" : "left-1"}`} />
                        </button>
                      </div>
                      <div className="flex gap-4">
                        <div className="flex-1 space-y-1">
                          <p className="text-[10px] font-bold text-gray-400 uppercase">Start Time</p>
                          <input type="time" className="w-full bg-white border border-indigo-100 rounded-xl px-4 py-2 text-sm" value={availability.evening.start} onChange={e => setAvailability({...availability, evening: {...availability.evening, start: e.target.value}})} />
                        </div>
                        <div className="flex-1 space-y-1">
                          <p className="text-[10px] font-bold text-gray-400 uppercase">End Time</p>
                          <input type="time" className="w-full bg-white border border-indigo-100 rounded-xl px-4 py-2 text-sm" value={availability.evening.end} onChange={e => setAvailability({...availability, evening: {...availability.evening, end: e.target.value}})} />
                        </div>
                      </div>
                   </div>
                </div>
             </div>
          </div>
        )}
        {activeTab === "support" && (
          <div className="max-w-3xl animate-in fade-in slide-in-from-bottom-4">
            <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-10">
              <div className="flex items-center gap-4 mb-10">
                <div className="w-16 h-16 bg-red-50 text-red-500 rounded-3xl flex items-center justify-center text-3xl shadow-sm border border-red-100">
                  <FaExclamationTriangle />
                </div>
                <div>
                  <h2 className="text-2xl font-black text-gray-800 tracking-tight">Lab Support</h2>
                  <p className="text-gray-500 font-medium">Flag issues or request assistance from the admin team.</p>
                </div>
              </div>

              {complaintStatus && (
                <div className="bg-green-50 border border-green-100 text-green-700 p-5 rounded-2xl mb-8 text-sm font-bold flex items-center gap-3 animate-in zoom-in-95">
                  <FaCheckCircle className="text-xl" /> {complaintStatus}
                </div>
              )}

              <form onSubmit={(e) => {
                e.preventDefault();
                submitComplaint({ ...complaintForm, userType: "Lab", name: user?.name });
                setComplaintStatus("Support ticket raised! Admin will respond via notification shortly.");
                setComplaintForm({ ...complaintForm, reason: "" });
                setTimeout(() => setComplaintStatus(""), 5000);
              }} className="space-y-6">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-gray-700 px-1">Describe the Issue</label>
                  <textarea 
                    value={complaintForm.reason}
                    onChange={e => setComplaintForm({...complaintForm, reason: e.target.value})}
                    placeholder="e.g. Booking #889 report upload failed, technician app issue, billing query, etc."
                    className="w-full bg-gray-50 border border-gray-100 rounded-3xl px-6 py-5 min-h-[180px] focus:outline-none focus:ring-2 focus:ring-blue-500 transition shadow-inner"
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-bold text-gray-700 px-1">Reply Email</label>
                  <input type="email" value={complaintForm.email} className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-6 py-4 focus:outline-none transition shadow-inner text-gray-400" readOnly />
                </div>

                <button type="submit" className="w-full bg-blue-800 text-white py-5 rounded-3xl font-bold text-lg hover:bg-blue-900 transition shadow-2xl shadow-blue-200 flex items-center justify-center gap-3">
                  <FaEnvelope className="text-blue-300" /> Raise Support Ticket
                </button>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default LabDashboard;
