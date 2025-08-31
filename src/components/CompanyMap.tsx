import React, { useEffect } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

const CompanyMap: React.FC = () => {
  useEffect(() => {
    // Initialize the map
    const map = L.map('map').setView([10.9765451, 76.2213794], 18);

    // Add OpenStreetMap tiles
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(map);

    // Add a marker for the company location
    L.marker([10.9765451, 76.2213794]).addTo(map)
      .bindPopup('Hirush Global LLP')
      .openPopup();

    // Add a circle with a 20-meter radius
    L.circle([10.9765451, 76.2213794], {
      color: 'blue',
      fillColor: '#add8e6',
      fillOpacity: 0.5,
      radius: 20,
    }).addTo(map);
  }, []);

  return <div id="map" style={{ height: '500px', width: '100%' }}></div>;
};

export default CompanyMap;
