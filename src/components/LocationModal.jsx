import { useState, useEffect } from "react";
import { useLocation } from "../context/LocationContext";
import { FaLocationArrow, FaTimes, FaMapMarkerAlt } from "react-icons/fa";

const LocationModal = ({ onClose }) => {
  const { location, updateLocation, autoDetectLocation, detecting, detectError } = useLocation();

  const [area, setArea] = useState(location?.area || "");
  const [city, setCity] = useState(location?.city || "");
  const [state, setState] = useState(location?.state || "");
  const [pincode, setPincode] = useState(location?.pincode || "");

  // Sync fields when autoDetect completes
  useEffect(() => {
    if (location) {
      setArea(location.area || "");
      setCity(location.city || "");
      setState(location.state || "");
      setPincode(location.pincode || "");
    }
  }, [location]);

  const handleSave = () => {
    if (!city.trim()) { alert("City is required"); return; }
    updateLocation({
      area: area.trim(),
      city: city.trim(),
      state: state.trim(),
      pincode: pincode.trim(),
      fullAddress: [area, city, state, pincode].filter(Boolean).join(", "),
    });
    onClose();
  };

  const handleAutoDetect = async () => {
    await autoDetectLocation();
    // Fields will sync via useEffect when location updates
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="bg-blue-600 p-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <FaMapMarkerAlt className="text-white text-xl" />
            <div>
              <h2 className="text-white font-bold text-lg">Set Your Location</h2>
              <p className="text-blue-100 text-xs">We'll show you nearby doctors, labs & medicines</p>
            </div>
          </div>
          <button onClick={onClose} className="text-white/80 hover:text-white transition p-1">
            <FaTimes className="text-lg" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          {/* Auto Detect */}
          <button
            onClick={handleAutoDetect}
            disabled={detecting}
            className={`w-full flex items-center justify-center gap-2 py-3 rounded-xl border-2 font-semibold text-sm transition
              ${detecting
                ? "border-blue-200 bg-blue-50 text-blue-400 cursor-wait"
                : "border-blue-600 bg-blue-600 text-white hover:bg-blue-700"
              }`}
          >
            {detecting ? (
              <>
                <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                </svg>
                Detecting your location...
              </>
            ) : (
              <>
                <FaLocationArrow />
                Auto-Detect My Location (GPS)
              </>
            )}
          </button>

          {detectError && (
            <p className="text-red-500 text-xs text-center bg-red-50 py-2 px-3 rounded-lg">{detectError}</p>
          )}

          {(location?.area || location?.city) && (
            <div className="flex items-center gap-2 text-xs text-green-700 bg-green-50 border border-green-200 px-3 py-2 rounded-lg">
              <FaMapMarkerAlt className="text-green-500 flex-shrink-0" />
              <span className="font-semibold">{[location.area, location.city, location.state, location.pincode].filter(Boolean).join(", ")}</span>
            </div>
          )}

          {/* Divider */}
          <div className="flex items-center gap-3">
            <div className="flex-1 border-t border-gray-200" />
            <span className="text-gray-400 text-xs font-semibold">OR ENTER MANUALLY</span>
            <div className="flex-1 border-t border-gray-200" />
          </div>

          {/* Manual Fields */}
          <div className="space-y-3">
            <div>
              <label className="text-xs font-semibold text-gray-600 mb-1 block">Area / Locality</label>
              <input
                value={area}
                onChange={e => setArea(e.target.value)}
                placeholder="e.g. Hazratganj, Gomti Nagar"
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-gray-600 mb-1 block">City *</label>
                <input
                  value={city}
                  onChange={e => setCity(e.target.value)}
                  placeholder="e.g. Lucknow"
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-600 mb-1 block">State</label>
                <input
                  value={state}
                  onChange={e => setState(e.target.value)}
                  placeholder="e.g. Uttar Pradesh"
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                />
              </div>
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-600 mb-1 block">Pincode</label>
              <input
                value={pincode}
                onChange={e => setPincode(e.target.value)}
                placeholder="6-digit pincode"
                maxLength={6}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
              />
            </div>
          </div>

          {/* Save Button */}
          <button
            onClick={handleSave}
            className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 rounded-xl transition text-sm shadow-sm"
          >
            Save Location
          </button>
        </div>
      </div>
    </div>
  );
};

export default LocationModal;
