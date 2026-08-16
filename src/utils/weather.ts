import { execFileSync } from 'child_process';

// wttr.in — the call sheet's weather + light window, auto-filled.
// No VPN needed for location: wttr.in/<city> IS the spoof. format=j1 gives
// current conditions + astronomy (sunrise/sunset) in one JSON call.

export interface WxReport {
  location: string;
  tempC: string;
  hiC: string;
  loC: string;
  humidity: string;
  windKmph: string;
  desc: string;
  sunrise: string;
  sunset: string;
}

export function parseWttrJson(raw: string, location: string): WxReport | null {
  try {
    const j = JSON.parse(raw);
    const cur = j?.current_condition?.[0] || {};
    const day = j?.weather?.[0] || {};
    const astro = day?.astronomy?.[0] || {};
    return {
      location,
      tempC: cur.temp_C || '?',
      hiC: day.maxtempC || '?',
      loC: day.mintempC || '?',
      humidity: cur.humidity || '?',
      windKmph: cur.windspeedKmph || '?',
      desc: (cur.weatherDesc?.[0]?.value || '').toLowerCase(),
      sunrise: astro.sunrise || '?',
      sunset: astro.sunset || '?'
    };
  } catch {
    return null;
  }
}

export function fetchWx(location: string): WxReport | null {
  try {
    const loc = encodeURIComponent(location.trim());
    const raw = execFileSync('curl', ['-s', '--max-time', '6', `https://wttr.in/${loc}?format=j1`], { encoding: 'utf8', stdio: 'pipe' });
    return parseWttrJson(raw, location.trim());
  } catch {
    return null;
  }
}

export const wxSheetLine = (w: WxReport): string =>
  `${w.hiC}/${w.loC}C · ${w.desc || 'clear'} · humidity ${w.humidity}% · wind ${w.windKmph}km/h`;

export const wxLightLine = (w: WxReport): string =>
  `sunrise ${w.sunrise} · sunset ${w.sunset} · magic hour ≈ ${w.sunset}`;
