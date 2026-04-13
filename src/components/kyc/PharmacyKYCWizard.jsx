import { useState } from "react";
import { useLocation } from "../../context/LocationContext";
import {
  FaUser, FaIdCard, FaStore, FaFileAlt, FaUserMd,
  FaChevronRight, FaChevronLeft, FaCheckCircle, FaLocationArrow,
  FaClock, FaPercent
} from "react-icons/fa";
import { MdLocalPharmacy } from "react-icons/md";
import {
  StepBar, PhotoUpload, WizardSection, KInput, Err, BankDetailsBlock
} from "./KYCShared";

const PharmacyKYCWizard = ({ onComplete }) => {
  const { nearestArea, getGeoAddress, fastDetectLocation } = useLocation();
  const [step, setStep] = useState(0);
  const [errors, setErrors] = useState({});

  // Step 0 — Personal + Govt ID
  const [name, setName] = useState("");
  const [idType, setIdType] = useState("aadhaar");
  const [idNumber, setIdNumber] = useState("");
  const [idPhoto, setIdPhoto] = useState(null);

  // Step 1 — Store Details + Drug Licence
  const [storeName, setStoreName] = useState("");
  const [storeArea, setStoreArea] = useState("");
  const [storeCity, setStoreCity] = useState("");
  const [storeState, setStoreState] = useState("");
  const [storePincode, setStorePincode] = useState("");
  const [storePhoto, setStorePhoto] = useState(null);
  const [drugLicRetail, setDrugLicRetail] = useState("");
  const [drugLicWholesale, setDrugLicWholesale] = useState("");
  const [drugLicAuthority, setDrugLicAuthority] = useState("");
  const [drugLicIssueDate, setDrugLicIssueDate] = useState("");
  const [drugLicExpiry, setDrugLicExpiry] = useState("");
  const [drugLicCert, setDrugLicCert] = useState(null);
  const [locDetecting, setLocDetecting] = useState(false);

  // Step 2 — Pharmacist Registration
  const [pharmacistName, setPharmacistName] = useState("");
  const [pharmacyCouncil, setPharmacyCouncil] = useState("");
  const [pharmacistRegNum, setPharmacistRegNum] = useState("");
  const [pharmacistQual, setPharmacistQual] = useState("");
  const [pharmacistCert, setPharmacistCert] = useState(null);
  const [openFrom, setOpenFrom] = useState("09:00");
  const [openTo, setOpenTo] = useState("21:00");
  const [openDays, setOpenDays] = useState("Mon–Sat");

  // Step 3 — Bank + GST
  const [gstNumber, setGstNumber] = useState("");
  const [bank, setBank] = useState({ accountHolder: "", bankName: "", accountNumber: "", ifsc: "", cancelledCheque: null });
  const setB = (k, v) => setBank(prev => ({ ...prev, [k]: v }));

  const STEPS = ["Personal & ID", "Store & Licence", "Pharmacist", "Bank & GST"];

  const validate = () => {
    const e = {};
    if (step === 0) {
      if (!name.trim()) e.name = "Name is required";
      if (!idNumber.trim()) e.idNumber = "ID number required";
      if (idType === "aadhaar" && !/^\d{12}$/.test(idNumber.trim())) e.idNumber = "Aadhaar must be 12 digits";
      if (idType === "pan" && !/^[A-Z]{5}[0-9]{4}[A-Z]$/i.test(idNumber.trim())) e.idNumber = "Invalid PAN format";
      if (!idPhoto) e.idPhoto = "ID proof photo required";
    }
    if (step === 1) {
      if (!storeName.trim()) e.storeName = "Store name required";
      if (!storeArea.trim()) e.storeArea = "Area required";
      if (!storeCity.trim()) e.storeCity = "City required";
      if (!storeState.trim()) e.storeState = "State required";
      if (!storePincode.trim() || !/^\d{6}$/.test(storePincode.trim())) e.storePincode = "Valid 6-digit pincode required";
      if (!drugLicRetail.trim()) e.drugLicRetail = "Retail drug licence number required";
      if (!drugLicAuthority.trim()) e.drugLicAuthority = "Issuing authority required";
      if (!drugLicIssueDate) e.drugLicIssueDate = "Issue date required";
      if (!drugLicExpiry) e.drugLicExpiry = "Expiry date required";
      if (!drugLicCert) e.drugLicCert = "Drug licence certificate required";
    }
    if (step === 2) {
      if (!pharmacistName.trim()) e.pharmacistName = "Pharmacist name required";
      if (!pharmacyCouncil.trim()) e.pharmacyCouncil = "State pharmacy council required";
      if (!pharmacistRegNum.trim()) e.pharmacistRegNum = "Pharmacist reg. number required";
      if (!pharmacistQual.trim()) e.pharmacistQual = "Qualification required";
      if (!pharmacistCert) e.pharmacistCert = "Pharmacist certificate required";
    }
    if (step === 3) {
      if (!bank.accountHolder.trim()) e.bankAccHolder = "Account holder name required";
      if (!bank.bankName.trim()) e.bankBankName = "Bank name required";
      if (!bank.accountNumber.trim()) e.bankAccNum = "Account number required";
      if (!bank.ifsc.trim() || !/^[A-Z]{4}0[A-Z0-9]{6}$/i.test(bank.ifsc.trim())) e.bankIfsc = "Valid IFSC code required";
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const next = () => { if (validate()) setStep(s => Math.min(s + 1, 3)); };
  const prev = () => { setErrors({}); setStep(s => Math.max(s - 1, 0)); };

  const detectLocation = () => {
    setLocDetecting(true);
    fastDetectLocation((loc) => {
      if (loc) {
        if (loc.area) setStoreArea(loc.area);
        if (loc.city) setStoreCity(loc.city);
        if (loc.state) setStoreState(loc.state);
        if (loc.pincode) setStorePincode(loc.pincode);
      }
      setLocDetecting(false);
    });
  };

  const handleFinish = () => {
    if (!validate()) return;
    onComplete({
      name,
      idType, idNumber, idPhoto,
      storeName, storeArea, storeCity, storeState, storePincode, storePhoto,
      fullAddress: `${storeArea}, ${storeCity}, ${storeState} - ${storePincode}`,
      location: `${storeArea}, ${storeCity}`,
      clinicName: storeName,
      drugLicRetail, drugLicWholesale, drugLicAuthority, drugLicIssueDate, drugLicExpiry, drugLicCert,
      pharmacistName, pharmacyCouncil, pharmacistRegNum, pharmacistQual, pharmacistCert,
      openFrom, openTo, openDays,
      storeTimings: `${openFrom}–${openTo}, ${openDays}`,
      gstNumber,
      bank,
    });
  };

  return (
    <div className="border border-green-100 bg-green-50/30 rounded-2xl p-5 mt-3">
      <StepBar step={step} total={4} labels={STEPS} />

      {/* Step 0 — Personal + Govt ID */}
      {step === 0 && (
        <div className="space-y-3">
          <WizardSection emoji="👤" title="Personal & Government ID" />
          <div>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400"><FaUser /></span>
              <input value={name} onChange={e => setName(e.target.value)} placeholder="Full Name *"
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-400 text-gray-700 bg-white" />
            </div>
            <Err msg={errors.name} />
          </div>

          <div className="flex gap-2">
            {[{ val: "aadhaar", label: "Aadhaar" }, { val: "pan", label: "PAN Card" }].map(({ val, label }) => (
              <button key={val} type="button" onClick={() => { setIdType(val); setIdNumber(""); }}
                className={`flex-1 py-2.5 rounded-lg border text-sm font-semibold transition
                  ${idType === val ? "bg-green-600 text-white border-green-600" : "bg-white text-gray-600 border-gray-300"}`}>
                {label}
              </button>
            ))}
          </div>

          <div>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400"><FaIdCard /></span>
              <input value={idNumber} onChange={e => setIdNumber(e.target.value)}
                placeholder={idType === "aadhaar" ? "12-digit Aadhaar Number *" : "PAN Number *"}
                maxLength={idType === "aadhaar" ? 12 : 10}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-400 text-gray-700 bg-white" />
            </div>
            <Err msg={errors.idNumber} />
          </div>

          <PhotoUpload label={`${idType === "aadhaar" ? "Aadhaar" : "PAN"} Card Photo / Scan`} required
            preview={idPhoto} onFile={(b64) => setIdPhoto(b64)} accept="image/*,.pdf" hint="JPG/PNG/PDF" />
          <Err msg={errors.idPhoto} />
        </div>
      )}

      {/* Step 1 — Store + Drug Licence */}
      {step === 1 && (
        <div className="space-y-3">
          <WizardSection emoji="🏪" title="Medical Store & Drug Licence" />

          <div>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400"><MdLocalPharmacy /></span>
              <input value={storeName} onChange={e => setStoreName(e.target.value)} placeholder="Medical Store Name *"
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-400 text-gray-700 bg-white" />
            </div>
            <Err msg={errors.storeName} />
          </div>

          <button type="button" onClick={detectLocation} disabled={locDetecting}
            className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-lg border text-sm font-semibold transition
              ${locDetecting ? "bg-green-50 border-green-200 text-green-400 cursor-wait" : "bg-green-600 text-white hover:bg-green-700"}`}>
            {locDetecting
              ? <><svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" /></svg> Detecting...</>
              : <><FaLocationArrow /> Auto-detect Store Address (GPS)</>}
          </button>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <input value={storeArea} onChange={e => setStoreArea(e.target.value)} placeholder="Area / Locality *"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-400 text-gray-700 bg-white" />
              <Err msg={errors.storeArea} />
            </div>
            <div>
              <input value={storeCity} onChange={e => setStoreCity(e.target.value)} placeholder="City *"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-400 text-gray-700 bg-white" />
              <Err msg={errors.storeCity} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <input value={storeState} onChange={e => setStoreState(e.target.value)} placeholder="State *"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-400 text-gray-700 bg-white" />
              <Err msg={errors.storeState} />
            </div>
            <div>
              <input value={storePincode} onChange={e => setStorePincode(e.target.value)} placeholder="Pincode *" maxLength={6}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-400 text-gray-700 bg-white" />
              <Err msg={errors.storePincode} />
            </div>
          </div>

          <PhotoUpload label="Store Photo (optional)" preview={storePhoto}
            onFile={(b64) => setStorePhoto(b64)} hint="JPG / PNG" />

          <div className="border-t border-gray-100 pt-3">
            <WizardSection emoji="📄" title="Drug Licence Details" />
            <div className="space-y-3">
              <div>
                <input value={drugLicRetail} onChange={e => setDrugLicRetail(e.target.value)}
                  placeholder="Retail Drug Licence Number *"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-400 text-gray-700 bg-white" />
                <Err msg={errors.drugLicRetail} />
              </div>
              <div>
                <input value={drugLicWholesale} onChange={e => setDrugLicWholesale(e.target.value)}
                  placeholder="Wholesale Drug Licence Number (optional)"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-400 text-gray-700 bg-white" />
              </div>
              <div>
                <input value={drugLicAuthority} onChange={e => setDrugLicAuthority(e.target.value)}
                  placeholder="Issuing Authority *"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-400 text-gray-700 bg-white" />
                <Err msg={errors.drugLicAuthority} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-gray-600 block mb-1">Issue Date *</label>
                  <input type="date" value={drugLicIssueDate} onChange={e => setDrugLicIssueDate(e.target.value)}
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-400 text-gray-700 bg-white text-sm" />
                  <Err msg={errors.drugLicIssueDate} />
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-600 block mb-1">Expiry Date *</label>
                  <input type="date" value={drugLicExpiry} onChange={e => setDrugLicExpiry(e.target.value)}
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-400 text-gray-700 bg-white text-sm" />
                  <Err msg={errors.drugLicExpiry} />
                </div>
              </div>
              <PhotoUpload label="Drug Licence Certificate" required preview={drugLicCert}
                onFile={(b64) => setDrugLicCert(b64)} accept="image/*,.pdf" hint="PDF or Image" />
              <Err msg={errors.drugLicCert} />
            </div>
          </div>
        </div>
      )}

      {/* Step 2 — Pharmacist Registration */}
      {step === 2 && (
        <div className="space-y-3">
          <WizardSection emoji="💊" title="Registered Pharmacist Details" />

          <div>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400"><FaUserMd /></span>
              <input value={pharmacistName} onChange={e => setPharmacistName(e.target.value)}
                placeholder="Registered Pharmacist Full Name *"
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-400 text-gray-700 bg-white" />
            </div>
            <Err msg={errors.pharmacistName} />
          </div>

          <div>
            <input value={pharmacyCouncil} onChange={e => setPharmacyCouncil(e.target.value)}
              placeholder="State Pharmacy Council Name *"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-400 text-gray-700 bg-white" />
            <Err msg={errors.pharmacyCouncil} />
          </div>

          <div>
            <input value={pharmacistRegNum} onChange={e => setPharmacistRegNum(e.target.value)}
              placeholder="Pharmacist Registration Number *"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-400 text-gray-700 bg-white" />
            <Err msg={errors.pharmacistRegNum} />
          </div>

          <div>
            <select value={pharmacistQual} onChange={e => setPharmacistQual(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-400 text-gray-700 bg-white">
              <option value="">Select Qualification *</option>
              {["D.Pharm (Diploma in Pharmacy)", "B.Pharm (Bachelor of Pharmacy)",
                "M.Pharm (Master of Pharmacy)", "Pharm.D (Doctor of Pharmacy)", "Other"].map(q =>
                <option key={q}>{q}</option>)}
            </select>
            <Err msg={errors.pharmacistQual} />
          </div>

          <PhotoUpload label="Pharmacist Certificate" required preview={pharmacistCert}
            onFile={(b64) => setPharmacistCert(b64)} accept="image/*,.pdf" hint="PDF or Image" />
          <Err msg={errors.pharmacistCert} />

          <div className="border-t border-gray-100 pt-3">
            <WizardSection emoji="🕐" title="Store Opening Timings" />
            <div className="flex gap-3 items-center">
              <input type="time" value={openFrom} onChange={e => setOpenFrom(e.target.value)}
                className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-400 text-gray-700 bg-white" />
              <span className="text-gray-400 font-semibold">to</span>
              <input type="time" value={openTo} onChange={e => setOpenTo(e.target.value)}
                className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-400 text-gray-700 bg-white" />
            </div>
            <div className="mt-2">
              <select value={openDays} onChange={e => setOpenDays(e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-400 text-sm text-gray-700 bg-white">
                {["Mon–Sat", "Mon–Sun (All Days)", "Mon–Fri", "Tue–Sun"].map(d => <option key={d}>{d}</option>)}
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Step 3 — Bank + GST */}
      {step === 3 && (
        <div className="space-y-3">
          <BankDetailsBlock data={bank} onChange={setB}
            errors={{ accountHolder: errors.bankAccHolder, bankName: errors.bankBankName, accountNumber: errors.bankAccNum, ifsc: errors.bankIfsc }} />

          <div className="border-t border-gray-100 pt-3">
            <WizardSection emoji="📋" title="GST Details (optional)" />
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400"><FaPercent /></span>
              <input value={gstNumber} onChange={e => setGstNumber(e.target.value.toUpperCase())}
                placeholder="GST Number (e.g. 27AAPFU0939F1ZV)"
                maxLength={15}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-400 text-gray-700 bg-white" />
            </div>
          </div>
        </div>
      )}

      {/* Navigation */}
      <div className="flex gap-3 mt-5">
        {step > 0 && (
          <button type="button" onClick={prev}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-gray-300 text-gray-600 font-semibold text-sm hover:bg-gray-50 transition">
            <FaChevronLeft /> Back
          </button>
        )}
        {step < 3 ? (
          <button type="button" onClick={next}
            className="flex-1 flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white font-bold py-2.5 rounded-xl transition text-sm shadow-sm">
            Next <FaChevronRight />
          </button>
        ) : (
          <button type="button" onClick={handleFinish}
            className="flex-1 flex items-center justify-center gap-2 bg-green-700 hover:bg-green-800 text-white font-bold py-2.5 rounded-xl transition text-sm shadow-sm">
            <FaCheckCircle /> Submit KYC
          </button>
        )}
      </div>
    </div>
  );
};

export default PharmacyKYCWizard;
