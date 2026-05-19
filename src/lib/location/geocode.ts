export interface GeocodeResult {
  district: string;
  address: string;
}

export async function reverseGeocode(lat: number, lng: number): Promise<GeocodeResult> {
  const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&addressdetails=1&accept-language=ko`;

  const response = await fetch(url, {
    headers: { 'User-Agent': 'mygoods-app/1.0 (contact@mygoods.app)' },
  });

  if (!response.ok) {
    throw new Error('역지오코딩 실패');
  }

  const data = await response.json();
  const addr = data.address || {};

  const district =
    addr.suburb ||
    addr.neighbourhood ||
    addr.quarter ||
    addr.city_district ||
    addr.town ||
    addr.village ||
    addr.city ||
    '알 수 없는 위치';

  const address = data.display_name || '';

  return { district, address };
}
