import { getDistance } from 'geolib';
import { GeolocationCoords } from '../types';

// Company office location
export const OFFICE_LOCATION: GeolocationCoords = {
  latitude: 10.966880,
  longitude: 76.198195,
};

// Maximum allowed distance from office (in meters)
export const MAX_DISTANCE = 5;

export const getCurrentLocation = (): Promise<GeolocationCoords> => {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation is not supported by this browser.'));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude
        });
      },
      (error) => {
        reject(error);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      }
    );
  });
};

export const isWithinOfficeRadius = (userLocation: GeolocationCoords): boolean => {
  const distance = getDistance(userLocation, OFFICE_LOCATION);
  return distance <= MAX_DISTANCE;
};

export const calculateDistance = (userLocation: GeolocationCoords): number => {
  return getDistance(userLocation, OFFICE_LOCATION);
};