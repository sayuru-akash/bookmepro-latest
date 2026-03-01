// lib/location.js

// Extract IP from request headers (supports Next.js middleware or API route)
function getIP(request) {
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0].trim();
  return ip;
}

// Get country code (e.g., 'US', 'IN') from IP using a free API
export async function getCountryFromIP(request) {
  const ip = getIP(request);

  // Fallback IP for local development
  const ipToLookup = ip === '::1' || ip === '127.0.0.1' ? '8.8.8.8' : ip;

  if (!ipToLookup) {
    return 'DEFAULT'; // fallback if IP is undefined
  }

  // Helper to fetch with timeout (3 seconds)
  const fetchWithTimeout = async (url) => {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), 3000);
    try {
      const response = await fetch(url, { signal: controller.signal });
      clearTimeout(id);
      return response;
    } catch (error) {
      clearTimeout(id);
      throw error;
    }
  };

  try {
    // Primary: ipapi.co
    const response = await fetchWithTimeout(`https://ipapi.co/${ipToLookup}/json/`);
    if (response.ok) {
      const data = await response.json();
      if (data.error) throw new Error('API Error');
      return (
        data.country_code ||
        data.country ||
        data.countryCode ||
        'DEFAULT'
      );
    }
    throw new Error('Primary API failed');
  } catch (error) {
    // console.warn('Primary IP lookup failed, trying backup...');
    try {
      // Backup: ipwho.is (Free, HTTPS)
      const response = await fetchWithTimeout(`https://ipwho.is/${ipToLookup}`);
      if (response.ok) {
        const data = await response.json();
        if (!data.success) throw new Error('Backup API Error');
        return data.country_code || 'DEFAULT';
      }
    } catch (backupError) {
      console.error('IP Geolocation failed:', backupError.message);
      return 'DEFAULT'; // fallback on error
    }
  }
  return 'DEFAULT';
}
