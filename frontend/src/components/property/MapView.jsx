import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { FiMapPin } from 'react-icons/fi';

/**
 * Custom modern Emerald Marker Icon using Leaflet divIcon
 */
const emeraldMarkerIcon = L.divIcon({
  className: 'custom-map-marker',
  html: `
    <div style="
      background: #059669;
      width: 34px;
      height: 34px;
      border-radius: 50% 50% 50% 0;
      transform: rotate(-45deg);
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 4px 10px rgba(0,0,0,0.3);
      border: 2px solid #ffffff;
    ">
      <div style="
        width: 12px;
        height: 12px;
        background: #ffffff;
        border-radius: 50%;
        transform: rotate(45deg);
      "></div>
    </div>
  `,
  iconSize: [34, 34],
  iconAnchor: [17, 34],
  popupAnchor: [0, -34],
});

/**
 * MapView component using React Leaflet
 *
 * @param {Object} props
 * @param {Object|Array} [props.coordinates] - GeoJSON { coordinates: [lng, lat] } or [lat, lng]
 * @param {string} props.title - Property title
 * @param {string} [props.address] - Location address / city
 * @param {number} [props.zoom=14] - Map zoom level
 */
export default function MapView({ coordinates, title = 'Property', address = '', zoom = 14 }) {
  let lat = null;
  let lng = null;

  if (coordinates) {
    if (Array.isArray(coordinates) && coordinates.length === 2) {
      // Direct array [lat, lng]
      lat = coordinates[0];
      lng = coordinates[1];
    } else if (coordinates.coordinates && Array.isArray(coordinates.coordinates)) {
      // GeoJSON Point format: [longitude, latitude]
      lng = coordinates.coordinates[0];
      lat = coordinates.coordinates[1];
    } else if (coordinates.lat && coordinates.lng) {
      lat = coordinates.lat;
      lng = coordinates.lng;
    }
  }

  // Gracefully handle missing or invalid coordinates
  const hasValidCoords =
    typeof lat === 'number' &&
    typeof lng === 'number' &&
    !isNaN(lat) &&
    !isNaN(lng) &&
    (lat !== 0 || lng !== 0);

  if (!hasValidCoords) {
    return (
      <div className="w-full h-72 rounded-2xl bg-gray-100 border border-gray-200 flex flex-col items-center justify-center text-gray-500 p-6 text-center">
        <FiMapPin className="w-8 h-8 text-gray-400 mb-2" />
        <p className="font-semibold text-gray-700">Map location not specified</p>
        {address && <p className="text-xs text-gray-500 mt-1 max-w-sm">{address}</p>}
      </div>
    );
  }

  const position = [lat, lng];

  return (
    <div className="w-full h-80 sm:h-96 rounded-2xl overflow-hidden border border-gray-200 shadow-sm relative z-0">
      <MapContainer
        center={position}
        zoom={zoom}
        scrollWheelZoom={false}
        className="w-full h-full"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <Marker position={position} icon={emeraldMarkerIcon}>
          <Popup>
            <div className="p-1">
              <h5 className="font-bold text-gray-900 text-sm">{title}</h5>
              {address && <p className="text-xs text-gray-600 mt-0.5">{address}</p>}
            </div>
          </Popup>
        </Marker>
      </MapContainer>
    </div>
  );
}
