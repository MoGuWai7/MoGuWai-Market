// GeoIP 조회 — ipapi.co 무료 API, 타임아웃 1500ms, 실패 시 null 반환
export interface GeoInfo {
  country_code: string;
  country_name: string;
  city: string;
}

const LOCAL_IPS = new Set(["127.0.0.1", "::1", "localhost"]);

export async function getGeoInfo(ip: string): Promise<GeoInfo | null> {
  if (!ip || LOCAL_IPS.has(ip)) return null;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 1500);

  try {
    const res = await fetch(`https://ipapi.co/${ip}/json/`, {
      signal: controller.signal,
    });
    if (!res.ok) return null;

    const data = await res.json();
    if (data.error) return null;

    return {
      country_code: data.country_code ?? "",
      country_name: data.country_name ?? "",
      city: data.city ?? "",
    };
  } catch (e) {
    console.error("[geoip] failed:", e);
    return null;
  } finally {
    clearTimeout(timer);
  }
}
