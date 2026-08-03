import { useEffect, useState, useCallback } from 'react';

const FALLBACK_CITY = 'Select City';

export function useLocation() {
  const [city, setCity] = useState(() => localStorage.getItem('userCity') || FALLBACK_CITY);
  const [detecting, setDetecting] = useState(false);
  const [error, setError] = useState(null);

  const detect = useCallback(() => {
    if (!navigator.geolocation) {
      setError('Geolocation not supported by this browser');
      return;
    }
    setDetecting(true);
    setError(null);

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const { latitude, longitude } = pos.coords;
          // Free, no-key reverse geocoding service
          const res = await fetch(
            `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`
          );
          const data = await res.json();
          const detectedCity = data.city || data.locality || data.principalSubdivision || FALLBACK_CITY;
          setCity(detectedCity);
          localStorage.setItem('userCity', detectedCity);
          localStorage.setItem('userLat', String(latitude));
          localStorage.setItem('userLng', String(longitude));
        } catch (e) {
          setError('Could not detect your city');
        } finally {
          setDetecting(false);
        }
      },
      () => {
        setError('Location permission denied');
        setDetecting(false);
      },
      { timeout: 8000 }
    );
  }, []);

  useEffect(() => {
    if (city === FALLBACK_CITY) detect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function setManualCity(name) {
    setCity(name);
    localStorage.setItem('userCity', name);
  }

  return { city, detecting, error, detect, setManualCity };
}
