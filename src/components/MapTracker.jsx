import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix for default marker icons in Leaflet + React
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
    iconUrl: icon,
    shadowUrl: iconShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41]
});
L.Marker.prototype.options.icon = DefaultIcon;

// Custom Icons
const riderIcon = L.divIcon({
  html: `<div style="font-size: 24px;">🛵</div>`,
  className: 'custom-div-icon',
  iconSize: [30, 30],
  iconAnchor: [15, 15]
});

const storeIcon = L.divIcon({
  html: `<div style="font-size: 24px;">🏥</div>`,
  className: 'custom-div-icon',
  iconSize: [30, 30],
  iconAnchor: [15, 15]
});

const customerIcon = L.divIcon({
  html: `<div style="font-size: 24px;">📍</div>`,
  className: 'custom-div-icon',
  iconSize: [30, 30],
  iconAnchor: [15, 15]
});

// Component to handle auto-fitting the map to show all markers
const FitBounds = ({ points }) => {
  const map = useMap();
  useEffect(() => {
    if (points && points.length > 0) {
      const validPoints = points.filter(p => p && p[0] && p[1]);
      if (validPoints.length > 0) {
        map.fitBounds(validPoints, { padding: [50, 50] });
      }
    }
  }, [points, map]);
  return null;
};

const MapTracker = ({ pickup, delivery, riderPos }) => {
  const [currentRiderPos, setCurrentRiderPos] = useState(riderPos || null);

  // If riderPos is not provided (e.g. for the rider themselves), we track live
  useEffect(() => {
    if (!riderPos) {
      if ("geolocation" in navigator) {
        const watchId = navigator.geolocation.watchPosition(
          (pos) => {
            setCurrentRiderPos([pos.coords.latitude, pos.coords.longitude]);
          },
          (err) => console.error("MapTracker Geolocation Error:", err),
          { enableHighAccuracy: true }
        );
        return () => navigator.geolocation.clearWatch(watchId);
      }
    } else {
      setCurrentRiderPos(riderPos);
    }
  }, [riderPos]);

  // Default fallback center (Lucknow Hazratganj) if no points available
  const defaultCenter = [26.8467, 80.9462];
  
  const points = [
    pickup && pickup[0] ? pickup : null,
    delivery && delivery[0] ? delivery : null,
    currentRiderPos && currentRiderPos[0] ? currentRiderPos : null
  ].filter(Boolean);

  return (
    <div className="w-full h-[400px] rounded-2xl overflow-hidden border border-gray-200 shadow-inner bg-gray-50">
      <MapContainer 
        center={points[0] || defaultCenter} 
        zoom={13} 
        style={{ height: '100%', width: '100%' }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        {pickup && pickup[0] && (
          <Marker position={pickup} icon={storeIcon}>
            <Popup><p className="font-bold">Pickup: Pharmacy</p></Popup>
          </Marker>
        )}

        {delivery && delivery[0] && (
          <Marker position={delivery} icon={customerIcon}>
            <Popup><p className="font-bold">Drop: Customer Address</p></Popup>
          </Marker>
        )}

        {currentRiderPos && currentRiderPos[0] && (
          <Marker position={currentRiderPos} icon={riderIcon}>
            <Popup><p className="font-bold">Delivery Boy (Live)</p></Popup>
          </Marker>
        )}

        <FitBounds points={points} />
      </MapContainer>
    </div>
  );
};

export default MapTracker;
