import { useState, useRef, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { useAppointment } from "../context/AppointmentContext";
import { useNavigate } from "react-router-dom";
import { useLocation } from "../context/LocationContext";
import {
  FaBoxOpen, FaClipboardList, FaCog, FaMoneyBillWave,
  FaPills, FaChartLine, FaSignOutAlt, FaCheck, FaTimes,
  FaPlus, FaTrash, FaImage, FaTag, FaRupeeSign, FaTruck, FaBell,
  FaEye, FaFilePdf, FaDownload, FaClock, FaStore,
  FaCreditCard, FaMobileAlt, FaUniversity, FaPhone, FaEnvelope, FaMapMarkerAlt,
  FaUserEdit, FaExclamationTriangle, FaCamera, FaCheckCircle, FaPhoneAlt, FaLocationArrow
} from "react-icons/fa";
import { MdDashboard, MdInventory } from "react-icons/md";

/* ── Payment badge (shared) ── */
const PayBadge = ({ method }) => {
  const icon = method === "card" ? <FaCreditCard /> : method === "netbanking" ? <FaUniversity /> : method === "cod" ? <FaMoneyBillWave /> : <FaMobileAlt />;
  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-emerald-50 text-emerald-700 rounded-full text-xs font-bold">
      {icon} {method?.toUpperCase()}
    </span>
  );
};

// Standardized nearestArea imported via useLocation()


/* ══════════════════════════════════════════════
   ADD MEDICINE FORM
══════════════════════════════════════════════ */
/* ══════════════════════════════════════════════
   ADD MEDICINE FORM
   (Now accepts onBulkClick)
══════════════════════════════════════════════ */
const AddMedicineForm = ({ storeEmail, storeName, onAdded, onBulkClick }) => {
  const { addMedicine } = useAppointment();
  const [form, setForm] = useState({ 
    name: "", type: "Tablet", price: "", stock: "100", image: "",
    imageURL: "", companyName: "", expiryDate: "", discount: "", gst: "" 
  });
  const [preview, setPreview] = useState(null);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const fileRef = useRef();

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) { setErrors(prev => ({ ...prev, image: "Image must be under 2MB" })); return; }
    const reader = new FileReader();
    reader.onload = (ev) => {
      setPreview(ev.target.result);
      setForm(prev => ({ ...prev, image: ev.target.result }));
      setErrors(prev => ({ ...prev, image: "" }));
    };
    reader.readAsDataURL(file);
  };

  const validate = () => {
    const e = {};
    if (!form.name.trim()) e.name = "Medicine name is required";
    if (!form.price || isNaN(form.price) || Number(form.price) <= 0) e.price = "Enter a valid price";
    return e;
  };

  const handleSubmit = (ev) => {
    ev.preventDefault();
    const e = validate();
    if (Object.keys(e).length) { setErrors(e); return; }
    setSaving(true);
    setTimeout(() => {
      addMedicine({
        storeEmail,
        storeName,
        name: form.name.trim(),
        type: form.type,
        price: Number(form.price),
        stock: Number(form.stock),
        image: form.image || "",
        imageURL: form.imageURL,
        companyName: form.companyName,
        expiryDate: form.expiryDate,
        discount: Number(form.discount || 0),
        gst: Number(form.gst || 0),
      });
      setForm({ 
        name: "", type: "Tablet", price: "", stock: "100", image: "",
        imageURL: "", companyName: "", expiryDate: "", discount: "", gst: "" 
      });
      setPreview(null);
      if (fileRef.current) fileRef.current.value = "";
      setErrors({});
      setSaving(false);
      onAdded();
    }, 400);
  };

  const inp = (hasErr) =>
    `w-full px-4 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 transition-all bg-gray-50
     ${hasErr ? "border-red-400 focus:ring-red-200" : "border-gray-300 focus:ring-green-400 focus:border-transparent"}`;

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-base font-bold text-gray-700 flex items-center gap-2">
          <FaPlus className="text-green-600" /> Add New Medicine
        </h3>
        <button 
          type="button"
          onClick={() => onBulkClick && onBulkClick()}
          className="text-xs font-bold text-green-600 hover:text-green-700 flex items-center gap-1.5 bg-green-50 px-2.5 py-1.5 rounded-lg border border-green-100 transition"
        >
          <FaFilePdf className="text-sm" /> Bulk Upload
        </button>
      </div>

      {/* Name & Company */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1 block">Medicine Name *</label>
          <div className="relative">
            <FaPills className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input type="text" placeholder="e.g. Paracetamol" className={`${inp(errors.name)} pl-10`}
              value={form.name} onChange={e => { setForm(p => ({ ...p, name: e.target.value })); setErrors(p => ({ ...p, name: "" })); }} />
          </div>
          {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
        </div>
        <div>
          <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1 block">Company Name</label>
          <div className="relative">
            <FaStore className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input type="text" placeholder="e.g. GlaxoSmithKline" className={`${inp(false)} pl-10`}
              value={form.companyName} onChange={e => setForm(p => ({ ...p, companyName: e.target.value }))} />
          </div>
        </div>
      </div>

      {/* Type & Price & Stock */}
      <div className="grid grid-cols-3 gap-3">
        <div>
          <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1 block">Type</label>
          <div className="relative">
            <FaTag className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <select className={`${inp(false)} pl-10`} value={form.type} onChange={e => setForm(p => ({ ...p, type: e.target.value }))}>
              {["Tablet","Capsule","Syrup","Injection","Ointment","Drops","Inhaler","Powder","Gel","Others"].map(t => (
                <option key={t}>{t}</option>
              ))}
            </select>
          </div>
        </div>
        <div>
          <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1 block">Price (₹) *</label>
          <div className="relative">
            <FaRupeeSign className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input type="number" min="1" placeholder="120" className={`${inp(errors.price)} pl-10`}
              value={form.price} onChange={e => { setForm(p => ({ ...p, price: e.target.value })); setErrors(p => ({ ...p, price: "" })); }} />
          </div>
          {errors.price && <p className="text-red-500 text-xs mt-1">{errors.price}</p>}
        </div>
        <div>
          <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1 block">Stock *</label>
          <div className="relative">
            <FaBoxOpen className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input type="number" min="0" className={`${inp(false)} pl-10`}
              value={form.stock} onChange={e => setForm(p => ({ ...p, stock: e.target.value }))} />
          </div>
        </div>
      </div>

      {/* Expiry & Discount & GST */}
      <div className="grid grid-cols-3 gap-3">
        <div>
          <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1 block">Expiry Date</label>
          <div className="relative">
            <FaClock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input type="text" placeholder="MM/YY" className={`${inp(false)} pl-10`}
              value={form.expiryDate} onChange={e => setForm(p => ({ ...p, expiryDate: e.target.value }))} />
          </div>
        </div>
        <div>
          <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1 block">Discount (%)</label>
          <div className="relative">
            <FaTag className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input type="number" placeholder="5" className={`${inp(false)} pl-10`}
              value={form.discount} onChange={e => setForm(p => ({ ...p, discount: e.target.value }))} />
          </div>
        </div>
        <div>
          <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1 block">GST (%)</label>
          <div className="relative">
            <FaMoneyBillWave className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input type="number" placeholder="12" className={`${inp(false)} pl-10`}
              value={form.gst} onChange={e => setForm(p => ({ ...p, gst: e.target.value }))} />
          </div>
        </div>
      </div>

      {/* Image URL fallback */}
      <div>
        <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1 block">Or Image URL</label>
        <div className="relative">
          <FaImage className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input type="text" placeholder="https://example.com/image.png" className={`${inp(false)} pl-10`}
            value={form.imageURL} onChange={e => setForm(p => ({ ...p, imageURL: e.target.value }))} />
        </div>
      </div>

      {/* Image Upload */}
      <div>
        <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1 block">Product Image <span className="text-gray-400 font-normal">(optional, max 2MB)</span></label>
        <div
          onClick={() => fileRef.current?.click()}
          className="flex items-center gap-3 border-2 border-dashed border-gray-200 rounded-xl p-3 cursor-pointer hover:border-green-400 hover:bg-green-50/30 transition"
        >
          {preview ? (
            <img src={preview} alt="preview" className="w-14 h-14 rounded-lg object-cover flex-shrink-0 border border-gray-200" />
          ) : (
            <div className="w-14 h-14 rounded-lg bg-gray-100 flex items-center justify-center text-gray-400 flex-shrink-0">
              <FaImage className="text-2xl" />
            </div>
          )}
          <div>
            <p className="text-sm font-medium text-gray-700">{preview ? "Change image" : "Click to upload image"}</p>
            <p className="text-xs text-gray-400">JPG, PNG, WEBP</p>
          </div>
        </div>
        <input type="file" accept="image/*" ref={fileRef} onChange={handleImageChange} className="hidden" />
        {errors.image && <p className="text-red-500 text-xs mt-1">{errors.image}</p>}
      </div>

      <button type="submit" disabled={saving}
        className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 rounded-xl shadow-lg shadow-green-100 transition flex items-center justify-center gap-2 disabled:opacity-60">
        {saving ? (
          <><svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" /></svg> Adding…</>
        ) : (
          <><FaPlus /> Add Medicine</>
        )}
      </button>
    </form>
  );
};

/* ══════════════════════════════════════════════
   MEDICINE CARD (dashboard inventory list)
══════════════════════════════════════════════ */
const MedicineCard = ({ med, onDelete }) => (
  <div className="flex items-center gap-4 bg-gray-50 border border-gray-100 rounded-xl p-3 hover:border-green-200 transition">
    {med.imageURL || med.image ? (
      <img src={med.imageURL || med.image} alt={med.name} className="w-14 h-14 rounded-lg object-cover border border-gray-200 flex-shrink-0" />
    ) : (
      <div className="w-14 h-14 rounded-lg bg-green-100 flex items-center justify-center text-green-600 flex-shrink-0">
        <FaPills className="text-2xl" />
      </div>
    )}
    <div className="flex-1 min-w-0">
      <p className="font-bold text-gray-800 text-sm truncate">{med.name}</p>
      {med.companyName && <p className="text-[10px] text-gray-400 font-bold truncate uppercase tracking-tight">{med.companyName}</p>}
      <div className="flex items-center gap-2 mt-0.5">
          <span className="text-[10px] bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded font-bold uppercase">{med.type}</span>
          <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${med.stock > 10 ? "bg-green-100 text-green-600" : "bg-red-100 text-red-600"}`}>
            Stock: {med.stock}
          </span>
          {med.expiryDate && <span className="text-[10px] bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded font-bold">Exp: {med.expiryDate}</span>}
      </div>
      <p className="text-green-700 font-bold text-sm mt-1">
        ₹{med.price}
        {med.discount > 0 && <span className="ml-2 text-[10px] bg-orange-100 text-orange-600 px-1.5 py-0.5 rounded-full">-{med.discount}% OFF</span>}
      </p>
    </div>
    <button onClick={() => onDelete(med._id || med.id)}
      className="text-red-400 hover:text-red-600 hover:bg-red-50 p-2 rounded-lg transition flex-shrink-0" title="Remove">
      <FaTrash />
    </button>
  </div>
);

/* ══════════════════════════════════════════════
   PRESCRIPTION VIEWER MODAL
   (Fixed: Missing component added to prevent crash)
══════════════════════════════════════════════ */
const PrescriptionViewer = ({ prescription, onClose }) => {
  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-300">
      <div className="relative bg-white w-full max-w-3xl rounded-3xl overflow-hidden shadow-2xl animate-in zoom-in-95 duration-300">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-gray-50 border-b border-gray-100">
          <h3 className="font-black text-gray-800 flex items-center gap-2">
            <FaEye className="text-blue-600" /> Patient Prescription
          </h3>
          <button onClick={onClose} className="p-2 hover:bg-gray-200 rounded-xl transition text-gray-400 hover:text-red-500">
            <FaTimes />
          </button>
        </div>
        
        {/* Content */}
        <div className="p-8 flex flex-col items-center justify-center bg-gray-100 min-h-[400px] max-h-[80vh] overflow-y-auto">
          {prescription ? (
            <img 
              src={prescription} 
              alt="Prescription" 
              className="max-w-full h-auto rounded-xl shadow-xl transition hover:scale-[1.02]" 
              onError={(e) => {
                e.target.style.display = 'none';
                e.target.nextSibling.style.display = 'block';
              }}
            />
          ) : (
            <div className="text-center py-20">
              <FaImage className="text-5xl text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 font-bold">No prescription image found.</p>
            </div>
          )}
          <div style={{ display: 'none' }} className="text-center py-20 bg-white p-10 rounded-3xl shadow-sm border border-gray-100">
            <FaExclamationTriangle className="text-5xl text-red-400 mx-auto mb-4" />
            <p className="text-gray-800 font-bold">Error loading prescription image.</p>
            <p className="text-sm text-gray-400 mt-2">The image link may be invalid or expired.</p>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 bg-white border-t border-gray-100 flex justify-center">
          <button onClick={onClose} className="px-8 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-2xl font-bold transition">
            Close Viewer
          </button>
        </div>
      </div>
    </div>
  );
};

/* ══════════════════════════════════════════════
   BULK UPLOAD MODAL
   (CSV support: Name, Price, Category, Unit, Stock)
══════════════════════════════════════════════ */
const BulkUploadModal = ({ storeEmail, storeName, onClose, onAdded }) => {
  const { bulkAddMedicines } = useAppointment();
  const [file, setFile] = useState(null);
  const [parsedData, setParsedData] = useState([]);
  const [errors, setErrors] = useState(null);
  const [uploading, setUploading] = useState(false);

  const downloadSample = () => {
    const csvContent = "data:text/csv;charset=utf-8,Name,Price,Category,Description,Unit,Stock,CompanyName,ExpiryDate,Discount,GST,ImageURL\nParacetamol 500mg,20,Tablet,Pain relief,Strip,100,GSK,12/25,5,12,https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?q=80&w=200\nCough Syrup,120,Syrup,Cough relief,Bottle,30,Dabur,10/25,10,18,";
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "sample_medicines.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleFileChange = (e) => {
    const f = e.target.files[0];
    if (!f) return;
    if (!f.name.toLowerCase().endsWith(".csv")) { setErrors("Please select a valid .csv file"); return; }
    
    setFile(f);
    setErrors(null);
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        let text = ev.target.result;
        // Remove BOM if present
        if (text.charCodeAt(0) === 0xFEFF) text = text.slice(1);

        const lines = text.split(/\r?\n/).filter(line => line.trim() !== "");
        if (lines.length < 2) throw new Error("CSV file is empty or missing data rows");

        // Detect delimiter (comma or semicolon)
        const firstLine = lines[0];
        const delimiter = firstLine.includes(";") && !firstLine.includes(",") ? ";" : ",";
        
        const headers = lines[0].split(delimiter).map(h => h.trim().toLowerCase());
        
        const results = lines.slice(1).map((line, lineIdx) => {
          // Robust split that handles quotes if possible (basic version)
          const values = line.split(delimiter).map(v => v.trim().replace(/^"|"$/g, ''));
          const obj = {};
          
          headers.forEach((h, i) => {
            const val = values[i];
            if (!val && val !== 0) return;

            // Map common synonyms for headers
            if (h === "name" || h === "medicine" || h === "item" || h === "drug" || h.includes("med name")) {
              obj.name = val;
            } else if (h === "price" || h === "rate" || h === "mrp") {
              obj.price = Number(val.replace(/[^0-9.]/g, ""));
            } else if (h === "category" || h === "type" || h === "group") {
              obj.category = val;
            } else if (h === "stock" || h === "qty" || h === "quantity") {
              obj.stock = Number(val.replace(/[^0-9]/g, ""));
            } else if (h === "unit" || h === "pack") {
              obj.unit = val;
            } else if (h === "description" || h === "notes") {
              obj.description = val;
            } else if (h === "manufacturer" || h === "brand" || h === "company" || h === "companyname") {
              obj.companyName = val;
              obj.manufacturer = val;
            } else if (h === "expiry" || h === "expirydate" || h === "exp") {
              obj.expiryDate = val;
            } else if (h === "discount" || h === "off") {
              obj.discount = Number(val.replace(/[^0-9.]/g, ""));
            } else if (h === "gst" || h === "tax") {
              obj.gst = Number(val.replace(/[^0-9.]/g, ""));
            } else if (h === "imageurl" || h === "img" || h === "url") {
              obj.imageURL = val;
            }
          });

          return obj;
        }).filter(m => m.name && !isNaN(m.price));
        
        if (results.length === 0) {
          throw new Error("No valid medicines found. Ensure columns like 'Name' and 'Price' exist.");
        }
        setParsedData(results);
      } catch (err) {
        setErrors(err.message || "Failed to parse CSV file");
        setFile(null);
        setParsedData([]);
      }
    };
    reader.readAsText(f);
  };

  const handleUpload = async () => {
    if (parsedData.length === 0) return;
    setUploading(true);
    try {
      await bulkAddMedicines({ storeEmail, storeName, medicines: parsedData });
      onAdded();
      onClose();
    } catch (err) {
      setErrors("Upload failed. Please try again.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="p-6 bg-green-600 text-white flex justify-between items-center">
          <div>
            <h2 className="text-xl font-bold flex items-center gap-2">
              <FaFilePdf className="text-green-200" /> Bulk Medicine Upload
            </h2>
            <p className="text-xs text-green-100 mt-1">Upload CSV or Excel-compatible list</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-xl transition"><FaTimes /></button>
        </div>

        <div className="p-8 space-y-6">
          {!file ? (
            <div className="border-3 border-dashed border-gray-100 rounded-3xl p-10 flex flex-col items-center justify-center gap-4 hover:border-green-300 hover:bg-green-50/30 transition-all group cursor-pointer"
                 onClick={() => document.getElementById("csv-file").click()}>
              <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center text-green-500 text-4xl group-hover:scale-110 transition-transform">
                <FaDownload className="animate-bounce" />
              </div>
              <div className="text-center">
                <p className="text-lg font-bold text-gray-700">Drop your CSV file here</p>
                <p className="text-sm text-gray-400">or click to browse your files</p>
              </div>
              <button onClick={(e) => { e.stopPropagation(); downloadSample(); }} className="mt-2 text-xs font-bold text-green-600 flex items-center gap-2 hover:underline">
                <FaDownload /> Download Sample Template
              </button>
              <input id="csv-file" type="file" accept=".csv" className="hidden" onChange={handleFileChange} />
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex justify-between items-center bg-gray-50 p-4 rounded-2xl border border-gray-100">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center text-green-600 font-bold text-xl"><FaCheck /></div>
                  <div>
                    <p className="font-bold text-gray-800">{file.name}</p>
                    <p className="text-xs text-gray-400">{parsedData.length} medicines found</p>
                  </div>
                </div>
                <button onClick={() => { setFile(null); setParsedData([]); }} className="text-red-500 text-xs font-bold hover:underline">Remove</button>
              </div>

              {parsedData.length > 0 && (
                <div className="max-h-48 overflow-y-auto border border-gray-100 rounded-2xl">
                  <table className="w-full text-xs">
                    <thead className="bg-gray-50 sticky top-0">
                      <tr className="text-gray-400 uppercase font-black tracking-tighter">
                        <th className="p-3 text-left">Name</th>
                        <th className="p-3 text-left">Price</th>
                        <th className="p-3 text-left">Type</th>
                        <th className="p-3 text-left">Exp</th>
                        <th className="p-3 text-left">Disc%</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {parsedData.slice(0, 10).map((m, idx) => (
                        <tr key={idx} className="text-gray-600">
                          <td className="p-3 font-bold">{m.name}</td>
                          <td className="p-3">₹{m.price}</td>
                          <td className="p-3">{m.category || m.type}</td>
                          <td className="p-3">{m.expiryDate || "—"}</td>
                          <td className="p-3 text-green-600 font-bold">{m.discount}%</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
              {parsedData.length > 10 && <p className="text-center text-[10px] text-gray-400">... and {parsedData.length - 10} more medicines</p>}
            </div>
          )}

          {errors && <div className="bg-red-50 border border-red-100 text-red-600 p-4 rounded-2xl text-xs font-bold flex items-center gap-2"><FaExclamationTriangle /> {errors}</div>}

          <div className="flex gap-4">
            <button onClick={onClose} className="flex-1 py-4 bg-gray-100 text-gray-500 rounded-2xl font-bold hover:bg-gray-200 transition">Cancel</button>
            <button
              onClick={handleUpload}
              disabled={!file || parsedData.length === 0 || uploading}
              className="flex-[2] bg-green-600 text-white py-4 rounded-2xl font-bold shadow-lg shadow-green-200 hover:bg-green-700 transition disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {uploading ? "Uploading..." : `Upload ${parsedData.length} Medicines`}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const OrderCard = ({ order, onAccept, onReject, onDispatch }) => {
  const [dispatching, setDispatching] = useState(false);
  const [showPrescription, setShowPrescription] = useState(false);

  const handleDispatch = () => {
    setDispatching(true);
    setTimeout(() => { onDispatch(order._id || order.id); setDispatching(false); }, 400);
  };

  const hasPrescription = !!(order.prescriptionUrl || order.prescription);

  const isInstant = order.deliveryMode === "instant";

  return (
    <>
    {showPrescription && (
      <PrescriptionViewer
        prescription={order.prescriptionUrl || order.prescription}
        onClose={() => setShowPrescription(false)}
      />
    )}
    <div className="flex flex-col p-4 rounded-xl border border-gray-100 hover:border-green-200 hover:shadow-sm transition bg-gray-50/50 gap-3">
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
        <div className="flex items-start gap-4 flex-1">
          <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center text-green-700 font-bold text-sm flex-shrink-0">
            {(order.customerName || order.name)?.charAt(0)}
          </div>
          <div className="flex-1">
            <h4 className="font-bold text-gray-800 text-sm flex items-center gap-2">
              {order.customerName || order.name}
              {isInstant && <span className="text-[10px] bg-yellow-100 text-yellow-700 px-1.5 py-0.5 rounded font-bold">⚡ Instant</span>}
            </h4>
            <p className="text-xs text-gray-500 mt-0.5">{order.customerPhone || order.phone} • {order.patientEmail || order.email}</p>
            <p className="text-xs text-gray-500 mt-0.5">
              📅 {order.appointmentDate || order.date}
              {order.appointmentTime && order.appointmentTime !== "ASAP" ? ` at ${order.appointmentTime}` : isInstant ? " — ASAP" : ""}
            </p>
            {order.deliveryAddress && <p className="text-xs text-gray-400 mt-0.5 font-medium">📍 {order.deliveryAddress}</p>}
            
            {/* ITEM LIST - THIS WAS MISSING */}
            {order.items && order.items.length > 0 && (
              <div className="mt-3 bg-white/60 rounded-lg p-3 border border-gray-100">
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Order Items:</p>
                <div className="space-y-2">
                  {order.items.map((item, idx) => (
                    <div key={idx} className="flex justify-between items-center text-xs">
                      <span className="font-bold text-gray-700">{item.name} <span className="text-gray-400 font-normal">x {item.quantity}</span></span>
                      <span className="text-green-600 font-bold">₹{(item.price * item.quantity).toFixed(2)}</span>
                    </div>
                  ))}
                </div>
                <div className="mt-2 pt-2 border-t border-gray-100 flex justify-between items-center bg-transparent">
                   <p className="text-[10px] text-gray-400 italic truncate max-w-[150px]">{order.reason}</p>
                   <p className="text-xs font-black text-gray-800 uppercase">Total: ₹{order.totalAmount || order.amount}</p>
                </div>
              </div>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          {order.status === "placed" || order.status === "pending" ? (
            <>
              <button onClick={onAccept} className="flex items-center gap-1 bg-green-600 hover:bg-green-700 text-white text-xs px-3 py-1.5 rounded-lg transition font-medium">
                <FaCheck /> Accept
              </button>
              <button onClick={onReject} className="flex items-center gap-1 bg-red-500 hover:bg-red-600 text-white text-xs px-3 py-1.5 rounded-lg transition font-medium">
                <FaTimes /> Reject
              </button>
            </>
          ) : (
            <span className={`px-3 py-1.5 rounded-full text-xs font-bold ${
              order.status === "confirmed" || order.status === "accepted" || order.status === "dispatched" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-600"
            }`}>
              {order.status === "confirmed" || order.status === "accepted" || order.status === "dispatched" ? "✓ Accepted" : "✗ Rejected"}
            </span>
          )}
        </div>
      </div>

      {/* Prescription + Dispatch actions row */}
      <div className="flex flex-wrap gap-2 pt-2 border-t border-gray-100">
        {/* View Prescription — always visible if present */}
        {hasPrescription && (
          <button onClick={() => setShowPrescription(true)}
            className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs px-3 py-2 rounded-lg font-semibold transition shadow-sm">
            <FaEye /> View Prescription
          </button>
        )}

        {/* Dispatch — visible after accepting */}
        {(order.status === "confirmed" || order.status === "accepted") && (
          !order.dispatched && order.status !== "dispatched" ? (
            <button onClick={handleDispatch} disabled={dispatching}
              className="flex items-center gap-1.5 bg-orange-500 hover:bg-orange-600 text-white text-xs px-3 py-2 rounded-lg font-semibold transition disabled:opacity-60">
              {dispatching
                ? <svg className="animate-spin h-3 w-3" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" /></svg>
                : <FaTruck />}
              Mark as Dispatched
            </button>
          ) : (
            <span className="flex items-center gap-1.5 bg-orange-100 text-orange-700 text-xs px-3 py-2 rounded-lg font-semibold">
              <FaTruck /> Dispatched ✓
            </span>
          )
        )}
      </div>
    </div>
    </>
  );
};

/* ══════════════════════════════════════════════
   SIDEBAR HELPERS
══════════════════════════════════════════════ */
const SidebarItem = ({ icon, label, active, onClick }) => (
  <div onClick={onClick} className={`flex items-center gap-3 px-4 py-3 rounded-lg cursor-pointer transition-all duration-200 group ${active ? "bg-white/10 text-white shadow-inner" : "text-green-100 hover:bg-green-500 hover:text-white"}`}>
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
    <div className={`min-h-screen bg-gradient-to-br flex flex-col items-center justify-center p-6 ${isRejected ? "from-red-50 to-orange-100" : "from-green-50 to-emerald-100"}`}>
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
            <p className="text-gray-500 mb-6">Please wait for the <span className="text-emerald-600 font-semibold">D2D Pharma Admin</span> to review and approve your profile before you can access the dashboard.</p>
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

/* ══════════════════════════════════════════════
   MAIN PHARMACY DASHBOARD
══════════════════════════════════════════════ */
const PharmacyDashboard = () => {
  const { user, logout, updateProfile, getAccountStatus } = useAuth();
  const { 
    getPartnerAppointments, updateAppointmentStatus, getMedicinesByStore, 
    deleteMedicine, markOrderDispatched, registerPartner,
    fetchPartnerAppointments, fetchMedicinesByStore, fetchNotifications,
    orders, fetchStoreOrders, updateOrderStatus, submitComplaint
  } = useAppointment();
  const { nearestArea } = useLocation();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("orders");
  const [addedTs, setAddedTs] = useState(0);

  // Profile Edit State
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    phone: user?.phone || "",
    location: user?.location || "",
    bankName: user?.bankName || user?.bank?.bankName || "",
    accountNum: user?.accountNum || user?.bank?.accountNumber || "",
    ifsc: user?.ifsc || user?.bank?.ifsc || "",
    latitude: user?.latitude || null,
    longitude: user?.longitude || null
  });

  const [showBulkUpload, setShowBulkUpload] = useState(false);

  // Complaint State
  const [complaintForm, setComplaintForm] = useState({ reason: "", email: user?.email || "" });
  const [complaintStatus, setComplaintStatus] = useState("");

  // Location detection state
  const [detecting, setDetecting] = useState(false);
  const [detectErr, setDetectErr] = useState("");

  // Sync Edit Form with User Data + fetch DB on mount
  useEffect(() => {
    if (user) {
      setEditForm({
        phone: user.phone || "",
        location: user.location || "",
        bankName: user.bankName || user.bank?.bankName || "",
        accountNum: user.accountNum || user.bank?.accountNumber || "",
        ifsc: user.ifsc || user.bank?.ifsc || "",
        latitude: user.latitude || null,
        longitude: user.longitude || null
      });
      setComplaintForm(prev => ({ ...prev, email: user.email || "" }));
      // Load from DB
      fetchStoreOrders(user.email);
      fetchMedicinesByStore(user.email);
      fetchNotifications(user.email);
    }
  }, [user?.email]);

  // Auto-refresh orders every 30 seconds so new customer orders appear live
  useEffect(() => {
    if (!user?.email) return;
    const interval = setInterval(() => {
      fetchStoreOrders(user.email);
    }, 30000);
    return () => clearInterval(interval);
  }, [user?.email]);

  const detectAddress = () => {
    setDetecting(true); setDetectErr("");
    if (!navigator.geolocation) { setDetectErr("Geolocation not supported"); setDetecting(false); return; }
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        const area = nearestArea(coords.latitude, coords.longitude);
        setEditForm(prev => ({ 
          ...prev, 
          location: `${area}`,
          latitude: coords.latitude,
          longitude: coords.longitude
        }));
        setDetecting(false);
      },
      () => { setDetectErr("Could not detect. Please enter manually."); setDetecting(false); },
      { timeout: 8000 }
    );
  };

  const handleLogout = () => { logout(); navigate("/login"); };

  // ── Approval Gate ──
  const accountStatus = getAccountStatus();
  if (accountStatus !== "approved") {
    return <PendingApprovalScreen role="Pharmacy" onLogout={handleLogout} status={accountStatus} />;
  }

  const myOrders = orders.filter(o => o.storeEmail === user?.email);
  const pending = myOrders.filter((o) => o.status === "placed");
  const accepted = myOrders.filter((o) => o.status === "confirmed");
  const dispatched = myOrders.filter((o) => o.status === "dispatched");
  const totalEarned = myOrders.filter(o => o.paymentStatus === "paid").reduce((sum, o) => sum + (o.totalAmount || 0), 0);
  const myMedicines = getMedicinesByStore(user?.email || "");

  return (
    <div className="min-h-screen flex bg-gray-50 text-gray-800 font-sans">
      {/* SIDEBAR */}
      <aside className="w-64 bg-green-600 text-white flex flex-col fixed h-full shadow-xl z-20">
        <div className="px-6 py-6 border-b border-green-500/50 flex items-center gap-3">
          <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center text-green-600 font-bold text-lg">D</div>
          <span className="text-xl font-bold tracking-wide">D2D Pharma</span>
        </div>
        <nav className="flex-1 px-4 py-6 space-y-2">
          <SidebarItem icon={<MdDashboard />} label="Dashboard" active={false} onClick={() => {}} />
          <SidebarItem icon={<FaClipboardList />} label="Orders" active={activeTab === "orders"} onClick={() => setActiveTab("orders")} />
          <SidebarItem icon={<MdInventory />} label="My Medicines" active={activeTab === "inventory"} onClick={() => setActiveTab("inventory")} />
          <SidebarItem icon={<FaMoneyBillWave />} label="Payments" active={activeTab === "earnings"} onClick={() => setActiveTab("earnings")} />
          <SidebarItem icon={<FaUserEdit />} label="Profile" active={activeTab === "profile"} onClick={() => setActiveTab("profile")} />
          <SidebarItem icon={<FaExclamationTriangle />} label="Support" active={activeTab === "support"} onClick={() => setActiveTab("support")} />
        </nav>
        <div className="p-4 border-t border-green-500/50">
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
              Welcome, <span className="text-green-600">{user?.name || "Pharmacy"}</span>
            </h1>
            <p className="text-gray-500 mt-1">Manage your orders and medicine inventory.</p>
          </div>
          <div onClick={() => setActiveTab("profile")} className="flex items-center gap-3 bg-white px-4 py-2 rounded-lg shadow-sm border border-gray-100 cursor-pointer hover:border-green-200 transition">
            <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center text-green-700 font-bold overflow-hidden">
               {user?.profilePhoto ? <img src={user.profilePhoto} alt="p" className="w-full h-full object-cover" /> : user?.name?.charAt(0)}
            </div>
            <div>
              <p className="text-xs text-gray-400 font-bold uppercase">Licensed Pharmacy</p>
              <p className="text-sm font-semibold">{user?.name}</p>
            </div>
          </div>
        </header>

        {/* STATS */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <StatCard icon={<FaClipboardList />}  title="Total Orders"     count={myOrders.length}  subtitle="All time"              color="text-green-600"  bg="bg-green-50" />
          <StatCard icon={<FaTruck />}           title="Delivered"        count={dispatched.length}    subtitle="Dispatched orders"    color="text-orange-500" bg="bg-orange-50" />
          <StatCard icon={<FaBoxOpen />}         title="Accepted"         count={accepted.length}      subtitle="Confirmed orders"     color="text-blue-600"   bg="bg-blue-50" />
          <StatCard icon={<FaRupeeSign />}       title="Total Earned"     count={`₹${totalEarned.toLocaleString("en-IN")}`} subtitle="From paid orders" color="text-emerald-600" bg="bg-emerald-50" />
          <div onClick={() => { setActiveTab("inventory"); setShowBulkUpload(true); }}
               className="bg-green-600 text-white rounded-2xl p-4 shadow-lg shadow-green-200 cursor-pointer hover:bg-green-700 transition flex items-center gap-4 border border-green-500 overflow-hidden relative group">
            <div className="absolute right-[-10%] top-[-10%] text-white/10 text-6xl group-hover:scale-125 transition-transform"><FaPills /></div>
            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center text-2xl"><FaPlus /></div>
            <div>
              <p className="text-xs font-bold text-white/80 uppercase tracking-widest">Quick Manage</p>
              <h4 className="text-lg font-black leading-tight">Bulk Upload<br/>Medicines</h4>
            </div>
          </div>
        </div>

        {/* TAB SWITCHER */}
        <div className="flex gap-2 mb-6">
          <button onClick={() => setActiveTab("orders")}
            className={`px-5 py-2 rounded-xl text-sm font-bold transition ${activeTab === "orders" ? "bg-green-600 text-white shadow-md" : "bg-white text-gray-600 border border-gray-200 hover:border-green-400"}`}>
            📦 Orders {pending.length > 0 && <span className="ml-1 bg-red-500 text-white text-[10px] px-1.5 rounded-full">{pending.length}</span>}
          </button>
          <button onClick={() => setActiveTab("inventory")}
            className={`px-5 py-2 rounded-xl text-sm font-bold transition ${activeTab === "inventory" ? "bg-green-600 text-white shadow-md" : "bg-white text-gray-600 border border-gray-200 hover:border-green-400"}`}>
            💊 Medicines
          </button>
          <button onClick={() => setActiveTab("earnings")}
            className={`px-5 py-2 rounded-xl text-sm font-bold transition ${activeTab === "earnings" ? "bg-green-600 text-white shadow-md" : "bg-white text-gray-600 border border-gray-200 hover:border-green-400"}`}>
            💰 Earnings
          </button>
        </div>

        {/* ─── ORDERS TAB ─── */}
        {activeTab === "orders" && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-bold text-gray-800">Customer Orders / Requests</h2>
              <div className="flex items-center gap-3">
                <span className="text-sm text-gray-400">{myOrders.length} total</span>
                <button 
                  onClick={() => fetchStoreOrders(user.email)}
                  className="text-xs bg-green-50 text-green-700 font-bold px-3 py-1.5 rounded-lg hover:bg-green-100 transition flex items-center gap-1"
                >
                  🔄 Refresh
                </button>
              </div>
            </div>
            {myOrders.length === 0 ? (
              <div className="text-center py-12 text-gray-400">
                <FaClipboardList className="text-4xl mx-auto mb-3 text-gray-300" />
                <p className="font-medium">No orders yet.</p>
                <p className="text-sm mt-1">Customer orders will appear here once they place a request.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {myOrders.map((order) => (
                  <OrderCard key={order._id || order.id} order={order}
                    onAccept={() => updateOrderStatus(order._id || order.id, "confirmed")}
                    onReject={() => updateOrderStatus(order._id || order.id, "cancelled")}
                    onDispatch={() => updateOrderStatus(order._id || order.id, "dispatched")} />
                ))}
              </div>
            )}
          </div>
        )}

        {showBulkUpload && (
          <BulkUploadModal
            storeEmail={user.email}
            storeName={user.name}
            onClose={() => setShowBulkUpload(false)}
            onAdded={() => setAddedTs(Date.now())}
          />
        )}

        {/* ─── MEDICINE INVENTORY TAB ─── */}
        {activeTab === "inventory" && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Add Form */}
            <AddMedicineForm
              storeEmail={user?.email || ""}
              storeName={user?.name || ""}
              onAdded={() => setAddedTs(Date.now())}
              onBulkClick={() => setShowBulkUpload(true)}
            />

            {/* Medicine List */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-base font-bold text-gray-700 flex items-center gap-2">
                  <FaPills className="text-green-600" /> Your Medicines
                </h3>
                <div className="flex items-center gap-2">
                  <button onClick={() => setShowBulkUpload(true)} className="flex items-center gap-2 bg-green-50 hover:bg-green-100 text-green-700 px-3 py-1.5 rounded-lg text-xs font-bold transition border border-green-100">
                    <FaFilePdf className="text-sm" /> Bulk Upload
                  </button>
                  <span className="text-xs text-gray-400 font-semibold bg-gray-100 px-2 py-1 rounded-full">{myMedicines.length} listed</span>
                </div>
              </div>

              {myMedicines.length === 0 ? (
                <div className="text-center py-12 text-gray-400">
                  <FaPills className="text-4xl mx-auto mb-3 text-gray-200" />
                  <p className="font-medium text-sm">No medicines added yet.</p>
                  <p className="text-xs mt-1">Add medicines using the form on the left.</p>
                </div>
              ) : (
                <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
                  {myMedicines.map((med) => (
                    <MedicineCard key={med._id || med.id} med={med} onDelete={deleteMedicine} />
                  ))}
                </div>
              )}
            </div>
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
                <div className="bg-blue-50 border border-blue-100 rounded-xl px-4 py-2 text-center">
                  <p className="text-xs text-blue-600 font-semibold uppercase">Paid Orders</p>
                  <p className="text-xl font-bold text-blue-700">{myOrders.filter(o => o.paymentStatus === "paid").length}</p>
                </div>
              </div>
            </div>

            {myOrders.filter(o => o.paymentStatus === "paid").length === 0 ? (
              <div className="text-center py-16 text-gray-400">
                <FaRupeeSign className="text-5xl mx-auto mb-3 text-gray-200" />
                <p className="font-semibold text-base">No earnings yet.</p>
                <p className="text-sm mt-1">Earnings will appear here after customers pay for their orders.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-xs text-gray-400 uppercase tracking-widest border-b border-gray-100">
                      <th className="text-left pb-3 font-semibold">Customer</th>
                      <th className="text-left pb-3 font-semibold">Phone</th>
                      <th className="text-left pb-3 font-semibold">Delivery Address</th>
                      <th className="text-left pb-3 font-semibold">Items Ordered</th>
                      <th className="text-left pb-3 font-semibold">Date</th>
                      <th className="text-left pb-3 font-semibold">Payment Via</th>
                      <th className="text-right pb-3 font-semibold">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {myOrders.filter(o => o.paymentStatus === "paid").slice().reverse().map(o => (
                      <tr key={o._id || o.id} className="hover:bg-gray-50 transition">
                        <td className="py-3.5">
                          <p className="font-semibold text-gray-800">{o.customerName || "—"}</p>
                          <p className="text-xs text-gray-400">{o.patientEmail || "—"}</p>
                        </td>
                        <td className="py-3.5 text-gray-600 text-xs">{o.customerPhone || "—"}</td>
                        <td className="py-3.5 text-gray-500 text-xs max-w-[140px]">
                          <span className="line-clamp-2">{o.deliveryAddress || "—"}</span>
                        </td>
                        <td className="py-3.5 text-gray-500 text-xs max-w-[180px]">
                          <span className="line-clamp-1">{o.items?.map(i => `${i.name} x${i.quantity}`).join(", ")}</span>
                        </td>
                        <td className="py-3.5 text-gray-500 text-xs whitespace-nowrap">
                            {new Date(o.createdAt).toLocaleDateString("en-IN")}<br/>
                            {new Date(o.createdAt).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}
                        </td>
                        <td className="py-3.5"><PayBadge method={o.paymentMethod} /></td>
                        <td className="py-3.5 text-right font-bold text-emerald-700 text-base">₹{Number(o.totalAmount || 0).toLocaleString("en-IN")}</td>
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
              <div className="h-32 bg-gradient-to-r from-green-600 to-emerald-700 relative">
                <div className="absolute -bottom-12 left-8 p-1 bg-white rounded-3xl shadow-lg border border-gray-50">
                   <div className="w-24 h-24 bg-green-50 rounded-2xl flex items-center justify-center text-3xl text-green-600 overflow-hidden border border-green-100">
                    {user?.profilePhoto ? <img src={user.profilePhoto} alt="profile" className="w-full h-full object-cover" /> : <FaBoxOpen />}
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
                    className="absolute bottom-1 right-1 bg-green-600 text-white p-2 rounded-xl border-4 border-white shadow-md hover:scale-110 transition"
                   >
                     <FaCamera className="text-sm" />
                   </button>
                </div>
              </div>
              
              <div className="pt-16 pb-8 px-8 flex justify-between items-end flex-wrap gap-4">
                <div>
                  <h2 className="text-2xl font-black text-gray-800 flex items-center gap-2">
                    {user?.name}
                    <span className="bg-green-100 text-green-700 text-[10px] px-2 py-0.5 rounded-full uppercase tracking-tighter">Verified Pharmacy</span>
                  </h2>
                  <p className="text-gray-500 font-medium">Store Owner • {user?.email}</p>
                </div>
                {!isEditing && (
                  <button onClick={() => setIsEditing(true)} className="flex items-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-700 px-6 py-2.5 rounded-2xl font-bold text-sm transition">
                    <FaUserEdit /> Edit Store Details
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
                        <label className="text-xs font-bold text-gray-400 uppercase tracking-widest px-1">Location / Store Address</label>
                        <div className="relative group">
                          <input 
                            type="text"
                            value={editForm.location}
                            onChange={e => setEditForm({...editForm, location: e.target.value})}
                            className="w-full bg-white border border-gray-200 rounded-2xl px-5 py-4 focus:outline-none focus:ring-2 focus:ring-green-500 transition shadow-sm pr-14"
                            placeholder="e.g. Health Mart, Hazratganj"
                          />
                          <button
                            type="button"
                            onClick={detectAddress}
                            disabled={detecting}
                            className={`absolute right-3 top-1/2 -translate-y-1/2 p-2.5 rounded-xl transition ${detecting ? "text-green-400 cursor-wait" : "text-green-600 hover:bg-green-50"}`}
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
                          className="w-full bg-white border border-gray-200 rounded-2xl px-5 py-4 focus:outline-none focus:ring-2 focus:ring-green-500 transition shadow-sm"
                        />
                      </div>
                    </div>

                    <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm space-y-4">
                      <h4 className="font-bold text-gray-800 flex items-center gap-2 border-b border-gray-50 pb-3 mb-2">
                        <FaUniversity className="text-green-600" /> Settlement Account Details
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <input placeholder="Bank Name" className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-3" value={editForm.bankName} onChange={e => setEditForm({...editForm, bankName: e.target.value})} />
                        <input placeholder="IFSC Code" className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-3" value={editForm.ifsc} onChange={e => setEditForm({...editForm, ifsc: e.target.value})} />
                        <input placeholder="Account Number" className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 md:col-span-2" value={editForm.accountNum} onChange={e => setEditForm({...editForm, accountNum: e.target.value})} />
                      </div>
                    </div>

                    <div className="flex gap-4 pt-4 border-t border-gray-100">
                      <button type="submit" className="flex-1 bg-green-600 text-white py-4 rounded-2xl font-bold shadow-lg shadow-green-200 hover:bg-green-700 transition">Save Changes</button>
                      <button type="button" onClick={() => setIsEditing(false)} className="px-8 py-4 bg-gray-100 text-gray-500 rounded-2xl font-bold hover:bg-gray-200 transition">Cancel</button>
                    </div>
                  </form>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                    <div className="group">
                      <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-1.5 flex items-center gap-2">
                        <FaMapMarkerAlt className="text-red-500" /> Store Address
                      </p>
                      <p className="text-sm font-bold text-gray-700 leading-relaxed">{user?.location || "Not set"}</p>
                    </div>
                    <div className="group">
                      <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-1.5 flex items-center gap-2">
                        <FaPhoneAlt className="text-green-500" /> Contact Number
                      </p>
                      <p className="text-sm font-bold text-gray-700">{user?.phone || "Not set"}</p>
                    </div>
                    <div className="sm:col-span-2 bg-white p-6 rounded-3xl border border-green-50 flex items-center gap-5 shadow-sm">
                       <div className="w-12 h-12 bg-green-50 rounded-2xl flex items-center justify-center text-green-600">
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

        {/* ─── SUPPORT TAB ─── */}
        {activeTab === "support" && (
          <div className="max-w-3xl animate-in fade-in slide-in-from-bottom-4">
            <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-10">
              <div className="flex items-center gap-4 mb-10">
                <div className="w-16 h-16 bg-red-50 text-red-500 rounded-3xl flex items-center justify-center text-3xl shadow-sm border border-red-100">
                  <FaExclamationTriangle />
                </div>
                <div>
                  <h2 className="text-2xl font-black text-gray-800 tracking-tight">Pharmacy Support</h2>
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
                submitComplaint({ ...complaintForm, userType: "Pharmacy", name: user?.name });
                setComplaintStatus("Support ticket raised! Admin will respond via notification shortly.");
                setComplaintForm({ ...complaintForm, reason: "" });
                setTimeout(() => setComplaintStatus(""), 5000);
              }} className="space-y-6">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-gray-700 px-1">Describe the Issue</label>
                  <textarea 
                    value={complaintForm.reason}
                    onChange={e => setComplaintForm({...complaintForm, reason: e.target.value})}
                    placeholder="e.g. Order #567 payment pending, delivery rider issue, update store details, etc."
                    className="w-full bg-gray-50 border border-gray-100 rounded-3xl px-6 py-5 min-h-[180px] focus:outline-none focus:ring-2 focus:ring-green-500 transition shadow-inner"
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-bold text-gray-700 px-1">Reply Email</label>
                  <input type="email" value={complaintForm.email} className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-6 py-4 focus:outline-none transition shadow-inner text-gray-400" readOnly />
                </div>

                <button type="submit" className="w-full bg-green-700 text-white py-5 rounded-3xl font-bold text-lg hover:bg-green-800 transition shadow-2xl shadow-green-200 flex items-center justify-center gap-3">
                  <FaEnvelope className="text-green-300" /> Raise Support Ticket
                </button>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default PharmacyDashboard;

