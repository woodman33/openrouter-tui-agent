import { describe, it, expect } from 'vitest';
import { parseWttrJson, wxSheetLine, wxLightLine } from '../src/utils/weather.js';

const SAMPLE = JSON.stringify({
  current_condition: [{ temp_C: '20', humidity: '61', windspeedKmph: '12', weatherDesc: [{ value: 'Partly cloudy' }] }],
  weather: [{ maxtempC: '24', mintempC: '12', astronomy: [{ sunrise: '05:51 AM', sunset: '08:26 PM' }] }]
});

describe('wttr.in call-sheet weather', () => {
  it('parses conditions + astronomy from format=j1', () => {
    const w = parseWttrJson(SAMPLE, 'ridge lookout')!;
    expect(w.tempC).toBe('20');
    expect(w.hiC).toBe('24');
    expect(w.loC).toBe('12');
    expect(w.sunrise).toBe('05:51 AM');
    expect(w.sunset).toBe('08:26 PM');
  });

  it('renders sheet + light lines', () => {
    const w = parseWttrJson(SAMPLE, 'ridge lookout')!;
    expect(wxSheetLine(w)).toContain('24/12C');
    expect(wxSheetLine(w)).toContain('partly cloudy');
    expect(wxLightLine(w)).toContain('sunrise 05:51 AM');
  });

  it('tolerates garbage', () => {
    expect(parseWttrJson('not json', 'x')).toBeNull();
  });
});
