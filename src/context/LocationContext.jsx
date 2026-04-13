import { createContext, useContext, useState, useCallback, useEffect } from "react";

const LocationContext = createContext();

// All Lucknow areas we support + their approximate lat/lng centres
const LUCKNOW_AREAS = [
  { name: "Hazratganj",    lat: 26.8467, lng: 80.9462 },
  { name: "Gomti Nagar",   lat: 26.8574, lng: 81.0054 },
  { name: "Alambagh",      lat: 26.8006, lng: 80.9191 },
  { name: "Indira Nagar",  lat: 26.8713, lng: 80.9955 },
  { name: "Chowk",         lat: 26.8697, lng: 80.9124 },
  { name: "Aminabad",      lat: 26.8488, lng: 80.9329 },
  { name: "Kapoorthala",   lat: 26.8577, lng: 80.9800 },
  { name: "Mahanagar",     lat: 26.8716, lng: 80.9564 },
  { name: "Jankipuram",    lat: 26.9124, lng: 80.9740 },
  { name: "Telibagh",      lat: 26.7900, lng: 80.9990 },
  { name: "Tiwariganj",    lat: 26.8860, lng: 81.0820 },
];

// Haversine distance in km between two lat/lng points
const distKm = (lat1, lng1, lat2, lng2) => {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
    Math.cos((lat2 * Math.PI) / 180) *
    Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

// Lucknow city bounding box (rough)
const LUCKNOW_BOUNDS = { latMin: 26.70, latMax: 26.98, lngMin: 80.85, lngMax: 81.10 };

export const LocationProvider = ({ children }) => {
  const API = import.meta.env.VITE_API_URL || "http://localhost:8080/api";

  const [location, setLocation] = useState(() => {
    const saved = localStorage.getItem("d2d_location");
    return saved ? JSON.parse(saved) : null;
  });
  const [detecting, setDetecting] = useState(false);
  const [detectError, setDetectError] = useState("");

  const updateLocation = useCallback((loc) => {
    setLocation(loc);
    localStorage.setItem("d2d_location", JSON.stringify(loc));
  }, []);

  // ── IP-based detection (instant, no permission needed) ──
  const ipDetectLocation = useCallback(async () => {
    try {
      const res = await fetch(`${API}/location/detect`);
      if (!res.ok) return null;
      const json = await res.json();
      if (json.success && json.data) {
        const snapped = nearestArea(json.data.lat, json.data.lng);
        const loc = {
          area: snapped || json.data.area || "Lucknow",
          city: json.data.city || "Lucknow",
          state: json.data.state || "Uttar Pradesh",
          pincode: json.data.pincode || "",
          lat: json.data.lat,
          lng: json.data.lng,
          fullAddress: json.data.fullAddress || "",
        };
        updateLocation(loc);
        return loc;
      }
    } catch (err) {
      console.error("IP location detect error:", err);
    }
    return null;
  }, []);

  // Auto-detect on first load if no saved location
  useEffect(() => {
    if (!location) {
      ipDetectLocation();
    }
  }, []);

  // Returns the name of the nearest Lucknow area for given lat/lng
  const nearestArea = useCallback((lat, lng) => {
    let best = null;
    let bestDist = Infinity;
    for (const area of LUCKNOW_AREAS) {
      const d = distKm(lat, lng, area.lat, area.lng);
      if (d < bestDist) { bestDist = d; best = area.name; }
    }
    return best;
  }, []);

  const autoDetectLocation = useCallback(() => {
    setDetecting(true);
    setDetectError("");

    if (!navigator.geolocation) {
      setDetectError("Geolocation not supported by your browser.");
      setDetecting(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async ({ coords }) => {
        const { latitude: lat, longitude: lng } = coords;

        try {
          // Reverse Geocoding using Nominatim (OpenStreetMap)
          const resp = await fetch(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}`, {
            headers: { 'Accept-Language': 'en' }
          });
          const data = await resp.json();
          
          if (!data || !data.address) {
            throw new Error("Could not fetch address details.");
          }

          const { address } = data;
          const road = address.road || address.suburb || address.neighbourhood || "";
          const city = address.city || address.town || address.village || address.state_district || "";
          const state = address.state || "Uttar Pradesh";
          const pincode = address.postcode || "";
          const snappedArea = nearestArea(lat, lng);
          const displayArea = snappedArea || road || address.suburb || "Current Location";

          const newLocation = {
            city,
            area: snappedArea || displayArea, // Prioritize snapped area for filtering
            state,
            pincode,
            road,
            fullAddress: data.display_name,
            lat,
            lng
          };

          updateLocation(newLocation);
          setDetecting(false);
        } catch (error) {
          console.error("Reverse Geocoding Error:", error);
          // Fallback to basic detection if geocoding fails
          const area = nearestArea(lat, lng);
          updateLocation({ area, lat, lng, fullAddress: `${area}` });
          setDetecting(false);
        }
      },
      (err) => {
        if (err.code === 1) {
          setDetectError("Location permission denied. Please allow access or select manually.");
        } else {
          setDetectError("Could not detect location. Please select manually.");
        }
        setDetecting(false);
      },
      { timeout: 10000, maximumAge: 60000 }
    );
  }, [nearestArea]);

  const getGeoAddress = useCallback(async (lat, lng) => {
    try {
      const resp = await fetch(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}`, {
        headers: { 'Accept-Language': 'en' }
      });
      const data = await resp.json();
      if (!data || !data.address) return null;

      const { address } = data;
      return {
        road: address.road || address.suburb || address.neighbourhood || "",
        city: address.city || address.town || address.village || address.state_district || "",
        state: address.state || "",
        pincode: address.postcode || "",
        fullAddress: data.display_name,
        area: address.road || address.suburb || address.neighbourhood || ""
      };
    } catch (error) {
      console.error("getGeoAddress Error:", error);
      return null;
    }
  }, []);

  const fastDetectLocation = useCallback(async (callback) => {
    // 1. Immediate result from cache/state if exists
    if (location) {
      callback(location);
    } else {
      // 2. Try IP detection for a quick first guess
      const ipLoc = await ipDetectLocation();
      if (ipLoc) callback(ipLoc);
    }

    // 3. Refine with GPS in the background
    if (!navigator.geolocation) return;
    
    navigator.geolocation.getCurrentPosition(
      async ({ coords }) => {
        const { latitude: lat, longitude: lng } = coords;
        try {
          const resp = await fetch(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}`, {
            headers: { 'Accept-Language': 'en' }
          });
          const data = await resp.json();
          if (data && data.address) {
            const { address } = data;
            const snappedArea = nearestArea(lat, lng);
            const newLocation = {
              city: address.city || address.town || address.village || "",
              area: snappedArea || address.road || address.suburb || "Current Location",
              state: address.state || "Uttar Pradesh",
              pincode: address.postcode || "",
              fullAddress: data.display_name,
              lat, lng
            };
            updateLocation(newLocation);
            callback(newLocation);
          }
        } catch (e) {
          const area = nearestArea(lat, lng);
          const loc = { area, lat, lng, fullAddress: `${area}` };
          updateLocation(loc);
          callback(loc);
        }
      },
      () => { /* Silent fail for background GPS enrichment */ },
      { timeout: 10000 }
    );
  }, [location, ipDetectLocation, nearestArea, updateLocation]);

  return (
    <LocationContext.Provider value={{ 
      location, 
      updateLocation, 
      autoDetectLocation, 
      fastDetectLocation,
      ipDetectLocation,
      getGeoAddress,
      nearestArea, 
      detecting, 
      detectError, 
      LUCKNOW_AREAS 
    }}>
      {children}
    </LocationContext.Provider>
  );
};

export const useLocation = () => useContext(LocationContext);
