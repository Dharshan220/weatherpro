import React, { useEffect, useMemo, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { createRoot } from 'react-dom/client';
import {
  Activity, AlertTriangle, ArrowDownRight, ArrowUpRight, Bell, BrainCircuit,
  Check, ChevronDown, CircleHelp, CloudLightning, Database, Gauge, Globe2,
  Layers3, MapPin, Menu, Minus, Moon, Pause, Play, Plus, Radio, RefreshCw,
  Search, ShieldCheck, SlidersHorizontal, Sparkles, Sun, Thermometer, Timer,
  TriangleAlert, Wifi, X,
} from 'lucide-react';
import './styles.css';

const stationSeed = [
  { id: 'AWS-001', location: 'Chennai North', district: 'Chennai', lat: 13.145, lon: 80.260, base: [32.4, 1007, 71], health: 98, status: 'Normal' },
  { id: 'AWS-002', location: 'Chengalpattu', district: 'Chengalpattu', lat: 12.686, lon: 79.977, base: [32.6, 1006, 70], health: 96, status: 'Normal' },
  { id: 'AWS-003', location: 'Sriperumbudur', district: 'Kanchipuram', lat: 12.967, lon: 79.949, base: [32.3, 1007, 70], health: 94, status: 'Normal' },
  { id: 'AWS-004', location: 'Mahabalipuram', district: 'Chengalpattu', lat: 12.626, lon: 80.172, base: [32.5, 1007, 70], health: 97, status: 'Normal' },
  { id: 'AWS-005', location: 'Tiruvallur', district: 'Tiruvallur', lat: 13.143, lon: 79.908, base: [31.9, 1008, 73], health: 91, status: 'Normal' },
  { id: 'AWS-006', location: 'Kanchipuram', district: 'Kanchipuram', lat: 12.834, lon: 79.703, base: [32.1, 1008, 72], health: 95, status: 'Normal' },
  { id: 'AWS-007', location: 'Vellore', district: 'Vellore', lat: 12.916, lon: 79.132, base: [33.0, 1006, 68], health: 93, status: 'Normal' },
  { id: 'AWS-008', location: 'Arakkonam', district: 'Ranipet', lat: 13.084, lon: 79.671, base: [32.2, 1007, 71], health: 96, status: 'Normal' },
  { id: 'AWS-009', location: 'Puducherry', district: 'Puducherry', lat: 11.941, lon: 79.808, base: [31.8, 1008, 75], health: 90, status: 'Normal' },
  { id: 'AWS-010', location: 'Cuddalore', district: 'Cuddalore', lat: 11.748, lon: 79.771, base: [31.6, 1008, 76], health: 94, status: 'Normal' },
  { id: 'AWS-011', location: 'Villupuram', district: 'Villupuram', lat: 11.940, lon: 79.486, base: [32.0, 1007, 73], health: 92, status: 'Normal' },
  { id: 'AWS-012', location: 'Tiruvannamalai', district: 'Tiruvannamalai', lat: 12.225, lon: 79.074, base: [32.7, 1006, 69], health: 89, status: 'Normal' },
  { id: 'AWS-013', location: 'Salem', district: 'Salem', lat: 11.664, lon: 78.146, base: [31.9, 1009, 66], health: 95, status: 'Normal' },
  { id: 'AWS-014', location: 'Coimbatore', district: 'Coimbatore', lat: 11.016, lon: 76.955, base: [30.8, 1010, 63], health: 97, status: 'Normal' },
  { id: 'AWS-015', location: 'Madurai', district: 'Madurai', lat: 9.925, lon: 78.119, base: [33.4, 1007, 61], health: 88, status: 'Normal' },
  { id: 'AWS-016', location: 'Thanjavur', district: 'Thanjavur', lat: 10.787, lon: 79.138, base: [32.5, 1008, 72], health: 93, status: 'Normal' },
];

const scenarioMeta = {
  normal: { label: 'Normal', tag: 'Baseline', color: 'green' },
  spike: { label: 'Spike Fault', tag: 'Sensor fault', color: 'orange' },
  stuck: { label: 'Stuck Sensor', tag: 'Sensor fault', color: 'orange' },
  drift: { label: 'Gradual Drift', tag: 'Deterioration', color: 'yellow' },
  offset: { label: 'Offset', tag: 'Calibration', color: 'orange' },
  unknown: { label: 'Unknown Anomaly', tag: 'Emerging pattern', color: 'purple' },
  weather: { label: 'Genuine Weather Event', tag: 'Regional event', color: 'blue' },
};

const fmt = (number, digits = 1) => Number(number).toFixed(digits);
const weatherLabel = (code) => ({ 0: 'Clear sky', 1: 'Mainly clear', 2: 'Partly cloudy', 3: 'Overcast', 45: 'Fog', 51: 'Light drizzle', 61: 'Rain', 80: 'Rain showers', 95: 'Thunderstorm' }[code] || 'Live conditions');

function makeReadings(scenario, tick, targetId = 'AWS-003', liveById = {}) {
  const targetIndex = Math.max(0, stationSeed.findIndex((station) => station.id === targetId));
  const wave = Math.sin(tick / 3) * 0.3;
  return stationSeed.map((station, index) => {
    const live = liveById[station.id];
    let [temperature, pressure, humidity] = live ? [live.temperature, live.pressure, live.humidity] : station.base;
    temperature += wave + Math.sin((tick + index) / 5) * 0.16;
    pressure += Math.cos((tick + index) / 4) * 0.7;
    humidity += Math.sin((tick + index) / 4) * 0.8;
    let localScenario = 'normal';
    if (scenario === 'spike' && index === targetIndex) { temperature = 42.1; pressure = 1006.3; humidity = 70.8; localScenario = 'spike'; }
    if (scenario === 'stuck' && index === targetIndex) { temperature = 32.28; pressure = 1007.04; humidity = 70.01; localScenario = 'stuck'; }
    if (scenario === 'drift' && index === targetIndex) { temperature += 1.2 + tick * 0.16; pressure -= 1.6 + tick * 0.2; humidity -= 2.5; localScenario = 'drift'; }
    if (scenario === 'offset' && index === targetIndex) { temperature += 5.4; pressure -= 9; humidity += 8; localScenario = 'offset'; }
    if (scenario === 'unknown' && index === targetIndex) { temperature += 4.8 + Math.sin(tick) * 1.3; pressure -= 4.5; humidity -= 10 + Math.cos(tick) * 2; localScenario = 'unknown'; }
    if (scenario === 'weather') { temperature = 38.4 + index * 0.16 + wave; pressure -= 4 + index * 0.2; humidity -= 8; localScenario = 'weather'; }
    const neighbourDelta = scenario === 'weather' ? 5.8 : (index === targetIndex && scenario !== 'normal' ? Math.abs(temperature - station.base[0]) : 0.3);
    const anomalyScore = scenario === 'normal' ? 0.08 + Math.abs(wave) / 20 : scenario === 'weather' ? 0.45 : index === targetIndex ? Math.min(0.99, 0.72 + neighbourDelta / 25) : 0.12;
    const status = anomalyScore > 0.9 ? 'Critical' : anomalyScore > 0.55 ? 'Warning' : 'Normal';
    return { ...station, temperature, pressure, humidity, timestamp: '14:32:18 IST', anomalyScore, status, localScenario };
  });
}

function analyze(scenario, readings, selectedId = 'AWS-003') {
  const target = readings.find((item) => item.id === selectedId) || readings[2];
  const others = readings.filter((item) => item.id !== target.id);
  const regional = scenario === 'weather';
  const known = ['spike', 'stuck', 'drift', 'offset'].includes(scenario);
  const physicsScore = scenario === 'normal' ? 96 : regional ? 82 : scenario === 'unknown' ? 48 : 57;
  const spatialScore = regional ? 91 : scenario === 'normal' ? 96 : 18;
  const classification = scenario === 'normal' ? 'Normal' : regional ? 'Weather Event' : scenario === 'unknown' ? 'Unknown / Emerging Pattern' : 'Possible Sensor Fault';
  const severity = scenario === 'normal' ? 'LOW' : regional ? 'MEDIUM' : scenario === 'unknown' ? 'HIGH' : 'HIGH';
  const explanation = regional
    ? 'Nearby stations show a similar temperature rise. Spatial consistency indicates a likely genuine regional weather event.'
    : scenario === 'normal'
      ? 'Readings remain within the learned prototype baseline and nearby station spread.'
      : scenario === 'unknown'
        ? 'Anomalous behaviour detected. Pattern does not strongly match predefined spike, stuck, drift or offset faults.'
        : `Only ${target.id} deviates significantly while nearby stations remain normal. Possible sensor anomaly.`;
  const contributions = regional
    ? [['Temperature deviation', 0.27], ['Spatial consistency', 0.39], ['Historical drift', 0.08], ['Humidity consistency', 0.18]]
    : scenario === 'normal'
      ? [['Temperature deviation', 0.08], ['Spatial deviation', 0.04], ['Historical drift', 0.03], ['Humidity consistency', 0.02]]
      : [['Temperature deviation', scenario === 'unknown' ? 0.36 : 0.42], ['Spatial deviation', regional ? 0.09 : 0.31], ['Historical drift', scenario === 'drift' ? 0.38 : 0.18], ['Humidity inconsistency', scenario === 'offset' ? 0.22 : 0.09]];
  return { target, others, regional, known, physicsScore, spatialScore, classification, severity, explanation, contributions };
}

function App() {
  const [scenario, setScenario] = useState('spike');
  const [tick, setTick] = useState(5);
  const [running, setRunning] = useState(true);
  const [selectedId, setSelectedId] = useState('AWS-003');
  const [presentation, setPresentation] = useState(false);
  const [demoOpen, setDemoOpen] = useState(false);
  const [demoStep, setDemoStep] = useState(0);
  const [activeSection, setActiveSection] = useState('command-center');
  const [theme, setTheme] = useState('light');
  const [fontScale, setFontScale] = useState(1);
  const [now, setNow] = useState(() => new Date());
  const [liveWeather, setLiveWeather] = useState(null);
  const [weatherLoading, setWeatherLoading] = useState(false);
  const [weatherError, setWeatherError] = useState('');
  const [placeQuery, setPlaceQuery] = useState('');
  const [placeResults, setPlaceResults] = useState([]);
  const [placeSearching, setPlaceSearching] = useState(false);
  const [placeSearchMessage, setPlaceSearchMessage] = useState('');
  const [selectedPlace, setSelectedPlace] = useState(null);
  const [placeWeather, setPlaceWeather] = useState(null);
  const readings = useMemo(() => makeReadings(scenario, tick, selectedId, liveWeather?.byId || {}), [scenario, tick, selectedId, liveWeather]);
  const analysis = useMemo(() => analyze(scenario, readings, selectedId), [scenario, readings, selectedId]);

  useEffect(() => {
    if (!running) return undefined;
    const timer = setInterval(() => setTick((value) => value + 1), 2800);
    return () => clearInterval(timer);
  }, [running]);

  useEffect(() => {
    if (!demoOpen) return undefined;
    setDemoStep(0);
    const timer = setInterval(() => setDemoStep((value) => Math.min(value + 1, 6)), 720);
    return () => clearInterval(timer);
  }, [demoOpen]);

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    let cancelled = false;
    const loadLiveWeather = async () => {
      setWeatherLoading(true);
      const latitude = stationSeed.map((item) => item.lat).join(',');
      const longitude = stationSeed.map((item) => item.lon).join(',');
      const url = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,relative_humidity_2m,pressure_msl,wind_speed_10m,weather_code&temperature_unit=celsius&timezone=Asia%2FCalcutta`;
      try {
        const response = await fetch(url);
        if (!response.ok) throw new Error(`Weather API returned ${response.status}`);
        const payload = await response.json();
        const locations = Array.isArray(payload) ? payload : [payload];
        const byId = {};
        locations.forEach((location, index) => {
          const current = location.current || {};
          const stationItem = stationSeed[index];
          if (stationItem && Number.isFinite(current.temperature_2m)) byId[stationItem.id] = { temperature: current.temperature_2m, pressure: current.pressure_msl ?? stationItem.base[1], humidity: current.relative_humidity_2m ?? stationItem.base[2], wind: current.wind_speed_10m ?? 0, weatherCode: current.weather_code, timestamp: current.time };
        });
        if (!cancelled && Object.keys(byId).length) { setLiveWeather({ byId, fetchedAt: new Date() }); setWeatherError(''); }
      } catch (error) {
        if (!cancelled) setWeatherError('Live weather unavailable · using simulated data');
      } finally {
        if (!cancelled) setWeatherLoading(false);
      }
    };
    loadLiveWeather();
    const timer = setInterval(loadLiveWeather, 300000);
    return () => { cancelled = true; clearInterval(timer); };
  }, []);

  const counts = {
    healthy: readings.filter((station) => station.status === 'Normal').length,
    warning: readings.filter((station) => station.status === 'Warning').length,
    critical: readings.filter((station) => station.status === 'Critical').length,
  };
  const station = readings.find((item) => item.id === selectedId) || readings[2];
  const alertActive = scenario !== 'normal';
  const timeLabel = now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false, timeZone: 'Asia/Kolkata' });
  const dateLabel = now.toLocaleDateString('en-IN', { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric', timeZone: 'Asia/Kolkata' });
  const dataSourceLabel = liveWeather ? 'Live Weather API' : 'Simulation Fallback';

  const runDemo = () => { setPresentation(false); setScenario('spike'); setRunning(false); setDemoOpen(true); };
  const searchPlaces = async (event) => {
    event?.preventDefault();
    const query = placeQuery.trim().toLowerCase();
    if (query.length < 2) { setPlaceSearchMessage('Type at least 2 characters'); setPlaceResults([]); return; }
    setPlaceSearching(true);
    setPlaceSearchMessage('');
    const localMatches = stationSeed.filter((item) => `${item.location} ${item.district}`.toLowerCase().includes(query)).map((item) => ({ id: item.id, name: item.location, admin1: item.district, country: 'India', country_code: 'IN', latitude: item.lat, longitude: item.lon }));
    try {
      const response = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(placeQuery.trim())}&count=6&language=en&format=json`);
      if (!response.ok) throw new Error('Geocoding request failed');
      const data = await response.json();
      const results = data.results?.length ? data.results : localMatches;
      setPlaceResults(results);
      if (!results.length) setPlaceSearchMessage('No matching places found');
    } catch (error) {
      setPlaceResults(localMatches);
      if (!localMatches.length) setPlaceSearchMessage('Search unavailable. Try Chennai, Salem, Madurai, Coimbatore, or Cuddalore.');
    } finally {
      setPlaceSearching(false);
    }
  };
  const choosePlace = async (place) => {
    setSelectedPlace(place);
    setPlaceResults([]);
    setPlaceSearchMessage('');
    setPlaceQuery(`${place.name}${place.admin1 ? `, ${place.admin1}` : ''}`);
    try {
      const response = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${place.latitude}&longitude=${place.longitude}&current=temperature_2m,relative_humidity_2m,pressure_msl,wind_speed_10m,weather_code&temperature_unit=celsius&timezone=auto`);
      const data = await response.json();
      setPlaceWeather(data.current || null);
    } catch (error) {
      setPlaceWeather(null);
    }
  };
  const goToSection = (sectionId) => {
    setActiveSection(sectionId);
    document.getElementById(sectionId)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <div className={`app-shell ${theme === 'light' ? 'theme-light' : ''}`} style={{ zoom: fontScale }}>
      <aside className="sidebar">
        <div className="brand"><div className="brand-mark"><CloudLightning size={18} /></div><div><strong>SKYGUARD</strong><span>AI / NETWORK OPS</span></div></div>
        <div className="prototype-pill"><span className="pulse-dot" /> Prototype · Simulated AWS Data</div>
        <nav>
          <NavItem icon={<Globe2 size={16} />} label="Command Center" active={activeSection === 'command-center'} onClick={() => goToSection('command-center')} />
          <NavItem icon={<Radio size={16} />} label="Live Stations" active={activeSection === 'live-stations'} onClick={() => goToSection('live-stations')} />
          <NavItem icon={<BrainCircuit size={16} />} label="Anomaly Detection" active={activeSection === 'anomaly-detection'} badge={alertActive ? '1' : undefined} onClick={() => goToSection('anomaly-detection')} />
          <NavItem icon={<Layers3 size={16} />} label="Spatial Validation" active={activeSection === 'spatial-validation'} onClick={() => goToSection('spatial-validation')} />
          <NavItem icon={<Activity size={16} />} label="Sensor Health" active={activeSection === 'sensor-health'} onClick={() => goToSection('sensor-health')} />
          <NavItem icon={<Bell size={16} />} label="Alert Center" active={activeSection === 'alert-center'} badge={alertActive ? '1' : undefined} onClick={() => goToSection('alert-center')} />
        </nav>
        <div className="sidebar-bottom">
          <div className="system-label">SYSTEM STATUS</div>
          <div className="system-row"><span><span className="status-dot green" />Data stream</span><b>LIVE</b></div>
          <div className="system-row"><span><span className="status-dot green" />Inference engine</span><b>READY</b></div>
          <div className="system-row"><span><span className="status-dot yellow" />AWS gateway</span><b>DEMO</b></div>
          <div className="team-block"><div className="team-avatar">NS</div><div><b>Nano Spark</b><span>SIH26073 · Disaster Mgmt</span></div><ChevronDown size={14} /></div>
        </div>
      </aside>

      <main className="main-content">
        <header className="topbar">
          <div className="mobile-title"><Menu size={18} /><strong>SKYGUARD AI</strong></div>
          <div className="breadcrumb"><span>Operations</span><span>/</span><b>Command Center</b></div>
          <div className="top-actions"><div className="live-indicator"><span className="pulse-dot" /> Live Simulation <span className="divider" /> {timeLabel} IST</div><div className="top-search"><form onSubmit={searchPlaces}><Search size={15} /><input value={placeQuery} onChange={(event) => setPlaceQuery(event.target.value)} placeholder="Search city or state" aria-label="Search city or state" /><button type="submit" aria-label="Search place">{placeSearching ? '…' : <Search size={14} />}</button></form>{(placeResults.length > 0 || placeSearchMessage) && <div className="top-search-results">{placeResults.map((place) => <button type="button" key={`${place.id}-${place.latitude}`} onClick={() => choosePlace(place)}><b>{place.name}</b><span>{place.admin1 || place.country} · {place.country_code}</span></button>)}{placeSearchMessage && <span className="search-message">{placeSearchMessage}</span>}</div>}</div><div className="date-chip"><span>{dateLabel}</span><small>INDIA STANDARD TIME</small></div><div className="ui-controls"><button className="icon-button font-button" title="Decrease font size" aria-label="Decrease font size" onClick={() => setFontScale((value) => Math.max(.85, Number((value - .05).toFixed(2))))}><Minus size={13} /></button><span className="font-size-label">A</span><button className="icon-button font-button" title="Increase font size" aria-label="Increase font size" onClick={() => setFontScale((value) => Math.min(1.2, Number((value + .05).toFixed(2))))}><Plus size={13} /></button><button className="icon-button" title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} theme`} aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} theme`} onClick={() => setTheme((value) => value === 'dark' ? 'light' : 'dark')}>{theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}</button></div><button className="icon-button notification-button" title="Notifications" aria-label="Notifications"><Bell size={17} /><i /></button><button className="avatar" title="Nano Spark profile">NS</button></div>
        </header>

        <div className="content-wrap" id="command-center">
          <section className="page-heading">
            <div><div className="eyebrow"><ShieldCheck size={14} /> SELF-AWARE WEATHER OBSERVATION NETWORK</div><h1>Command Center</h1><p>Detect the abnormal. Validate the physical. Explain the unknown.</p></div>
            <div className="heading-actions"><button className="button secondary" onClick={() => setPresentation(true)}><Play size={15} /> Presentation Mode</button><button className="button primary" onClick={runDemo}><Sparkles size={15} /> Run Live Demo</button></div>
          </section>

          <section className="weather-report-grid">
            <div className="panel weather-report-panel"><PanelHeader title="State weather report" kicker="TAMIL NADU · LIVE WEATHER + PLACE ANALYSIS" action={<span className={`weather-api-badge ${liveWeather ? 'connected' : 'fallback'}`}><span className="status-dot" /> {weatherLoading ? 'SYNCING…' : dataSourceLabel}</span>} /><div className="weather-toolbar"><form className="place-search" onSubmit={searchPlaces}><Search size={15} /><input value={placeQuery} onChange={(event) => setPlaceQuery(event.target.value)} placeholder="Search a Tamil Nadu city or district…" aria-label="Search a Tamil Nadu city or district" /><button type="submit">{placeSearching ? 'Searching…' : 'Search place'}</button></form>{placeResults.length > 0 && <div className="place-results">{placeResults.map((place) => <button type="button" key={`${place.id}-${place.latitude}`} onClick={() => choosePlace(place)}><b>{place.name}</b><span>{place.admin1 || place.country} · {place.country_code}</span></button>)}</div>}</div><div className="weather-report-body"><div className="weather-location"><span>{selectedPlace ? `${selectedPlace.name}, ${selectedPlace.admin1 || selectedPlace.country}` : 'Tamil Nadu network'}</span><strong>{placeWeather ? fmt(placeWeather.temperature_2m) : fmt(station.temperature)}<small>°C</small></strong><b>{weatherLabel(placeWeather?.weather_code)} · {placeWeather ? 'Selected place' : station.id}</b></div><div className="weather-stats"><div><span>Pressure</span><b>{fmt(placeWeather?.pressure_msl ?? station.pressure, 0)} <small>hPa</small></b></div><div><span>Humidity</span><b>{fmt(placeWeather?.relative_humidity_2m ?? station.humidity, 0)}<small>%</small></b></div><div><span>Wind</span><b>{fmt(placeWeather?.wind_speed_10m ?? liveWeather?.byId?.[station.id]?.wind ?? 0, 0)}<small>km/h</small></b></div></div><div className="weather-analysis"><BrainCircuit size={16} /><div><b>Weather report analysis</b><span>{analysis.classification === 'Normal' ? 'Conditions are within the prototype baseline.' : `${analysis.classification} · ${analysis.explanation}`}</span></div></div></div>{weatherError && <div className="weather-error"><TriangleAlert size={13} /> {weatherError}</div>}</div>
            <div className="panel station-focus-panel"><PanelHeader title="AWS focus" kicker="SELECTED STATION" action={<span className="soft-badge">{selectedId}</span>} /><div className="station-focus-copy"><span>Run the anomaly story against any station in the network.</span><b>{station.location}</b><small>{station.district} · {fmt(station.temperature)}°C · {fmt(station.humidity, 0)}% humidity</small></div><label className="select-label">CHOOSE AWS STATION<select value={selectedId} onChange={(event) => setSelectedId(event.target.value)}>{stationSeed.map((item) => <option value={item.id} key={item.id}>{item.id} · {item.location}</option>)}</select><ChevronDown size={15} /></label><button className="button primary full" onClick={runDemo}><Play size={15} /> Analyze {selectedId} now</button></div>
          </section>

          <section className="metric-grid">
            <Metric label="Total AWS Stations" value={String(readings.length).padStart(2, '0')} meta="Tamil Nadu pilot network" icon={<Radio size={16} />} tone="blue" />
            <Metric label="Healthy Stations" value={String(counts.healthy).padStart(2, '0')} meta="Within expected range" icon={<Check size={16} />} tone="green" trend="+1.2%" />
            <Metric label="Active Anomalies" value={alertActive ? '01' : '00'} meta={alertActive ? 'Requires investigation' : 'No active alerts'} icon={<TriangleAlert size={16} />} tone={alertActive ? 'orange' : 'green'} trend={alertActive ? 'HIGH' : 'CLEAR'} />
            <Metric label="Sensor Health Score" value={scenario === 'drift' ? '89.4' : '95.2'} meta="Network weighted average" icon={<Gauge size={16} />} tone="purple" trend="+0.8%" />
          </section>

          <section className="hero-grid">
            <div className="panel map-panel"><PanelHeader title="Live station map" kicker="OPENSTREETMAP · SPATIAL NETWORK" action={<button className="tiny-button" onClick={() => setSelectedId('AWS-003')}><RefreshCw size={13} /> Focus AWS-003</button>} /><div className="map-canvas osm-map-shell"><OSMMap readings={readings} selectedId={selectedId} onSelect={setSelectedId} focusLocation={selectedPlace ? [selectedPlace.latitude, selectedPlace.longitude] : null} /><div className="osm-map-badge"><span className="pulse-dot" /> {readings.length} AWS stations online</div><div className="map-legend"><LegendDot tone="green" label="Normal" /><LegendDot tone="orange" label="Warning" /><LegendDot tone="red" label="Critical" /><LegendDot tone="purple" label="Unknown" /></div></div><div className="map-footer"><span><span className="status-dot green" />OpenStreetMap live tiles</span><span>Selected <b>{selectedId}</b></span><span className="data-note"><Database size={13} /> {dataSourceLabel}</span></div></div>
            <div className="panel event-panel" id="anomaly-detection"><PanelHeader title="Current event classification" kicker="DECISION ENGINE" action={<span className={`classification-badge ${analysis.classification === 'Normal' ? 'normal' : analysis.classification.includes('Weather') ? 'weather' : analysis.classification.includes('Unknown') ? 'unknown' : 'fault'}`}>{analysis.classification}</span>} /><div className="event-main"><div className="event-icon"><AlertTriangle size={23} /></div><div><div className="event-station">{analysis.target.id} <span>· {analysis.target.location}</span></div><h2>{analysis.classification === 'Weather Event' ? 'Likely genuine weather event' : analysis.classification === 'Normal' ? 'Network operating normally' : analysis.classification}</h2><p>{analysis.explanation}</p></div></div><div className="decision-line"><div><span>Physics validation</span><strong className={analysis.physicsScore < 70 ? 'orange-text' : 'green-text'}>{analysis.physicsScore}% <small>{analysis.physicsScore < 70 ? 'WARNING' : 'PASSED'}</small></strong></div><div><span>Spatial consistency</span><strong className={analysis.spatialScore < 50 ? 'orange-text' : 'green-text'}>{analysis.spatialScore}% <small>{analysis.spatialScore < 50 ? 'DEVIATION' : 'ALIGNED'}</small></strong></div></div><div className="event-footer"><div className="reason-tags"><button type="button" className="reason-tag ml-tag" onClick={() => goToSection('anomaly-detection')}><BrainCircuit size={13} /> ML anomaly</button><button type="button" className="reason-tag spatial-tag" onClick={() => goToSection('spatial-validation')}><Layers3 size={13} /> Spatial check</button><button type="button" className="reason-tag explain-tag" onClick={() => goToSection('explainability')}><CircleHelp size={13} /> Explainable</button></div><button className="text-button" onClick={() => setSelectedId(analysis.target.id)}>Open analysis <ArrowUpRight size={14} /></button></div></div>
          </section>

          <section className="lower-grid">
            <div className="panel stations-panel" id="live-stations"><PanelHeader title="Live AWS monitoring" kicker="REAL-TIME READINGS" action={<div className="stream-control"><span className="pulse-dot" /> Streaming <button onClick={() => setRunning(!running)}>{running ? <Pause size={12} /> : <Play size={12} />}</button></div>} /><div className="table-wrap"><table><thead><tr><th>Station</th><th>Location</th><th>Temperature</th><th>Pressure</th><th>Humidity</th><th>Health</th><th>Status</th><th /></tr></thead><tbody>{readings.map((item) => <tr key={item.id} className={item.id === selectedId ? 'selected-row' : ''} onClick={() => setSelectedId(item.id)}><td><div className="station-cell"><span className={`station-mini ${item.status.toLowerCase()}`} /><div><b>{item.id}</b><span>{item.timestamp}</span></div></div></td><td>{item.location}</td><td className="reading-value">{fmt(item.temperature)}°<span>C</span></td><td>{fmt(item.pressure, 0)} <span className="unit">hPa</span></td><td>{fmt(item.humidity, 0)}<span className="unit">%</span></td><td><HealthBar value={item.health - (scenario === 'drift' && item.id === 'AWS-003' ? 5 : 0)} /></td><td><StatusPill status={item.status} unknown={item.localScenario === 'unknown'} /></td><td><ArrowUpRight size={14} className="muted-icon" /></td></tr>)}</tbody></table></div><div className="panel-note"><Wifi size={13} /> Data updates every 2.8 seconds · Simulated MQTT stream</div></div>
            <div className="panel simulation-panel"><PanelHeader title="Demo mode" kicker="SCENARIO CONTROL" action={<span className="demo-badge"><Sparkles size={13} /> LIVE DEMO</span>} /><div className="scenario-copy"><h3>Make the network self-aware.</h3><p>Select a station and scenario, then watch the full detection pipeline respond in seconds.</p></div><label className="select-label">FOCUS AWS STATION<select value={selectedId} onChange={(event) => setSelectedId(event.target.value)}>{stationSeed.map((item) => <option value={item.id} key={item.id}>{item.id} · {item.location}</option>)}</select><ChevronDown size={15} /></label><label className="select-label scenario-select">DEMO SCENARIO<select value={scenario} onChange={(event) => { setScenario(event.target.value); if (event.target.value === 'weather') setSelectedId('AWS-001'); }}><option value="normal">Normal Mode</option><option value="spike">Spike Fault</option><option value="stuck">Stuck Sensor</option><option value="drift">Gradual Sensor Drift</option><option value="offset">Offset / Calibration Error</option><option value="unknown">Unknown / Emerging Anomaly</option><option value="weather">Genuine Weather Event</option></select><ChevronDown size={15} /></label><div className="scenario-selected"><span className={`scenario-icon ${scenarioMeta[scenario].color}`}><Activity size={16} /></span><div><b>{scenarioMeta[scenario].label}</b><span>{selectedId} · {scenarioMeta[scenario].tag}</span></div><div className="scenario-live"><span className="pulse-dot" /> LIVE</div></div><button className="button primary full" onClick={runDemo}><Play size={15} /> Run live demo for {selectedId}</button><div className="scenario-foot"><span><Timer size={13} /> Updates every 2.8s</span><span><SlidersHorizontal size={13} /> Prototype engine</span></div></div>
          </section>

          <section className="insight-grid">
            <div className="panel spatial-panel" id="spatial-validation"><PanelHeader title="Spatial cross-validation" kicker="NEIGHBOUR COMPARISON" action={<span className="soft-badge">4 nearby stations</span>} /><div className="spatial-summary"><div className="spatial-score"><span>Spatial validation score</span><strong className={analysis.spatialScore < 50 ? 'orange-text' : 'green-text'}>{analysis.spatialScore}<small>/100</small></strong></div><div className="spatial-verdict"><span className={`verdict-dot ${analysis.spatialScore < 50 ? 'orange' : 'green'}`} /><div><b>{analysis.spatialScore < 50 ? 'Station differs from neighbours' : analysis.regional ? 'Regional pattern confirmed' : 'Nearby stations aligned'}</b><span>{analysis.spatialScore < 50 ? 'Possible sensor fault' : analysis.regional ? 'Likely genuine weather event' : 'No spatial anomaly'}</span></div></div></div><div className="mini-table"><div className="mini-head"><span>STATION</span><span>TEMP</span><span>PRESSURE</span><span>HUMIDITY</span><span>STATUS</span></div>{readings.map((item) => <div className={`mini-row ${item.id === analysis.target.id ? 'focus' : ''}`} key={item.id}><b>{item.id}</b><span>{fmt(item.temperature)}°C</span><span>{fmt(item.pressure, 0)} hPa</span><span>{fmt(item.humidity, 0)}%</span><StatusPill status={item.status} unknown={item.localScenario === 'unknown'} /></div>)}</div><div className="spatial-callout"><Layers3 size={15} /><span>{analysis.explanation}</span></div></div>
            <div className="panel health-panel" id="sensor-health"><PanelHeader title="Sensor health trend" kicker={`${selectedId} · 30 DAY VIEW`} action={<button className="tiny-button">30 days <ChevronDown size={13} /></button>} /><div className="health-top"><div><span>Current health</span><strong>{scenario === 'drift' ? '87.2' : '94.1'}<small>/100</small></strong></div><span className="health-change"><ArrowDownRight size={13} /> -2.8% this month</span></div><HealthChart drift={scenario === 'drift'} /><div className="health-legend"><span><i className="line-purple" /> Sensor health score</span><span><i className="line-dashed" /> Investigation threshold</span></div><div className="health-callout"><TriangleAlert size={14} /><span>{scenario === 'drift' ? 'Possible gradual sensor degradation detected.' : 'No degradation pattern detected in current window.'}</span></div></div>
          </section>

          <section className="bottom-grid">
            <div className="panel explain-panel"><PanelHeader title="Why was this alert generated?" kicker="PROTOTYPE EXPLAINABILITY VISUALIZATION" action={<span className="ai-badge"><BrainCircuit size={13} /> AI INSIGHT</span>} /><div className="explain-content"><div className="explain-copy"><div className="explain-heading"><div className="explain-number">01</div><div><b>Temperature deviation is the strongest signal</b><p>{analysis.regional ? 'All nearby stations rose together, shifting the interpretation toward a regional event.' : 'The current reading sits well outside the station’s expected prototype baseline.'}</p></div></div><div className="contribution-list">{analysis.contributions.map(([label, value]) => <div className="contribution" key={label}><div><span>{label}</span><b>+{value.toFixed(2)}</b></div><div className="contribution-track"><span style={{ width: `${Math.min(value * 180, 100)}%` }} /></div></div>)}</div></div><div className="model-stack"><div className="model-card"><div className="model-icon purple"><BrainCircuit size={18} /></div><span>ML anomaly score</span><strong>{Math.round(analysis.target.anomalyScore * 100)}<small>/100</small></strong><div className="score-track"><span style={{ width: `${analysis.target.anomalyScore * 100}%` }} /></div></div><div className="model-card"><div className="model-icon blue"><Gauge size={18} /></div><span>Physics consistency</span><strong>{analysis.physicsScore}<small>/100</small></strong><div className="score-track blue-track"><span style={{ width: `${analysis.physicsScore}%` }} /></div></div></div></div></div>
            <div className="panel explain-panel" id="explainability"><PanelHeader title="Why was this alert generated?" kicker="PROTOTYPE EXPLAINABILITY VISUALIZATION" action={<span className="ai-badge"><BrainCircuit size={13} /> AI INSIGHT</span>} /><div className="explain-content"><div className="explain-copy"><div className="explain-heading"><div className="explain-number">01</div><div><b>Temperature deviation is the strongest signal</b><p>{analysis.regional ? 'All nearby stations rose together, shifting the interpretation toward a regional event.' : 'The current reading sits well outside the station’s expected prototype baseline.'}</p></div></div><div className="contribution-list">{analysis.contributions.map(([label, value]) => <div className="contribution" key={label}><div><span>{label}</span><b>+{value.toFixed(2)}</b></div><div className="contribution-track"><span style={{ width: `${Math.min(value * 180, 100)}%` }} /></div></div>)}</div></div><div className="model-stack"><div className="model-card"><div className="model-icon purple"><BrainCircuit size={18} /></div><span>ML anomaly score</span><strong>{Math.round(analysis.target.anomalyScore * 100)}<small>/100</small></strong><div className="score-track"><span style={{ width: `${analysis.target.anomalyScore * 100}%` }} /></div></div><div className="model-card"><div className="model-icon blue"><Gauge size={18} /></div><span>Physics consistency</span><strong>{analysis.physicsScore}<small>/100</small></strong><div className="score-track blue-track"><span style={{ width: `${analysis.physicsScore}%` }} /></div></div></div></div></div>
            <div className="panel alerts-panel" id="alert-center"><PanelHeader title="Recent alerts" kicker="ALERT CENTER" action={<button className="text-button">View all <ArrowUpRight size={14} /></button>} /><div className="alert-list">{alertActive ? <AlertItem id="SG-1024" station={analysis.target.id} severity={analysis.severity} title={analysis.classification === 'Weather Event' ? 'Regional weather pattern' : analysis.classification === 'Unknown / Emerging Pattern' ? 'Unknown / emerging anomaly' : 'Possible sensor fault'} time="Just now" /> : <AlertItem id="SG-1023" station="AWS-005" severity="LOW" title="Humidity baseline restored" time="18 min ago" resolved />}</div><div className="alert-footer"><span><span className="status-dot orange" />{alertActive ? '1 open investigation' : 'No open investigations'}</span><span>{alertActive ? 'Recommended: inspect sensor' : 'All clear'}</span></div></div>
          </section>

          <footer className="app-footer"><span>SKYGUARD AI · SIH26073 · Nano Spark</span><span>Prototype environment · Simulated AWS data · v0.1.0</span></footer>
        </div>
      </main>

      {demoOpen && <DemoOverlay step={demoStep} target={analysis.target} readings={readings} close={() => { setDemoOpen(false); setRunning(true); }} />}
      {presentation && <PresentationOverlay analysis={analysis} readings={readings} close={() => setPresentation(false)} runDemo={runDemo} />}
    </div>
  );
}

function NavItem({ icon, label, active, badge, onClick }) { return <button type="button" className={`nav-item ${active ? 'active' : ''}`} aria-current={active ? 'page' : undefined} onClick={onClick}><span>{icon}{label}</span>{badge && <em>{badge}</em>}</button>; }
function Metric({ label, value, meta, icon, tone, trend }) { return <div className="metric-card"><div className={`metric-icon ${tone}`}>{icon}</div><div className="metric-copy"><span>{label}</span><strong>{value}</strong><small>{meta}</small></div>{trend && <div className={`metric-trend ${tone}`}>{trend === 'HIGH' ? <TriangleAlert size={12} /> : <ArrowUpRight size={12} />}{trend}</div>}</div>; }
function PanelHeader({ title, kicker, action }) { return <div className="panel-header"><div><span className="panel-kicker">{kicker}</span><h3>{title}</h3></div>{action}</div>; }
function LegendDot({ tone, label }) { return <span><i className={`legend-dot ${tone}`} />{label}</span>; }
function StatusPill({ status, unknown }) { const label = unknown ? 'Unknown' : status; return <span className={`status-pill ${unknown ? 'unknown' : status.toLowerCase()}`}><i />{label}</span>; }
function HealthBar({ value }) { return <div className="health-bar"><span style={{ width: `${value}%` }} /><b>{value}</b></div>; }
function OSMMap({ readings, selectedId, onSelect, focusLocation }) {
  const containerRef = useRef(null);
  const mapRef = useRef(null);
  const layerRef = useRef(null);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return undefined;
    const map = L.map(containerRef.current, { zoomControl: true, attributionControl: true }).setView([11.45, 78.9], 7);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19, attribution: '© OpenStreetMap contributors' }).addTo(map);
    mapRef.current = map;
    window.setTimeout(() => map.invalidateSize(), 100);
    return () => { map.remove(); mapRef.current = null; };
  }, []);

  useEffect(() => {
    if (!mapRef.current) return;
    if (layerRef.current) layerRef.current.clearLayers();
    const layer = L.layerGroup().addTo(mapRef.current);
    readings.forEach((station) => {
      const isSelected = station.id === selectedId;
      const color = station.localScenario === 'unknown' ? '#8b5cf6' : station.status === 'Critical' ? '#dc4c5c' : station.status === 'Warning' ? '#d58b28' : '#208f6a';
      const marker = L.circleMarker([station.lat, station.lon], { radius: isSelected ? 9 : 6, color: '#ffffff', weight: isSelected ? 3 : 1.5, fillColor: color, fillOpacity: .95 }).addTo(layer);
      marker.bindTooltip(`${station.id} · ${station.location}`, { direction: 'top', offset: [0, -7] });
      marker.bindPopup(`<strong>${station.id}</strong><br/>${station.location}<br/>${fmt(station.temperature)}°C · ${fmt(station.humidity, 0)}% humidity`);
      marker.on('click', () => onSelect(station.id));
    });
    layerRef.current = layer;
  }, [readings, selectedId, onSelect]);

  useEffect(() => {
    if (mapRef.current && focusLocation) mapRef.current.setView(focusLocation, 9, { animate: true });
  }, [focusLocation]);

  return <div className="osm-map-frame"><div ref={containerRef} className="osm-map" aria-label="OpenStreetMap showing simulated Automatic Weather Stations" /><div className="map-zoom-controls" aria-label="Map zoom controls"><button type="button" title="Zoom in" aria-label="Zoom in" onClick={() => mapRef.current?.zoomIn()}><Plus size={16} /></button><button type="button" title="Zoom out" aria-label="Zoom out" onClick={() => mapRef.current?.zoomOut()}><Minus size={16} /></button></div></div>;
}

function StationPin({ station, selected, onClick }) { return <button className={`station-pin ${station.status.toLowerCase()} ${station.localScenario === 'unknown' ? 'unknown' : ''} ${selected ? 'selected' : ''}`} style={{ left: `${((station.lon - 79.84) / 0.5) * 82 + 8}%`, top: `${((13.3 - station.lat) / 0.76) * 76 + 8}%` }} onClick={onClick} title={station.id}><span className="pin-core" /><span className="pin-label">{station.id}</span></button>; }
function HealthChart({ drift }) { const points = drift ? '0,20 25,24 50,30 75,44 100,57 125,60 150,70 175,73 200,81 225,88 250,94 275,102 300,108' : '0,24 25,22 50,28 75,27 100,30 125,25 150,31 175,28 200,30 225,33 250,29 275,31 300,27'; return <div className="health-chart"><svg viewBox="0 0 300 120" preserveAspectRatio="none"><defs><linearGradient id="area" x1="0" x2="0" y1="0" y2="1"><stop offset="0%" stopColor="#9b8cff" stopOpacity=".22" /><stop offset="100%" stopColor="#9b8cff" stopOpacity="0" /></linearGradient></defs><line x1="0" y1="82" x2="300" y2="82" stroke="#f4b554" strokeDasharray="4 4" opacity=".45" /><polyline points={`${points} 300,120 0,120`} fill="url(#area)" stroke="none" /><polyline points={points} fill="none" stroke="#a69aff" strokeWidth="2.4" /></svg><div className="chart-labels"><span>30d ago</span><span>15d</span><span>Today</span></div></div>; }
function AlertItem({ id, station, severity, title, time, resolved }) { return <div className="alert-item"><div className={`alert-severity ${severity.toLowerCase()}`}><AlertTriangle size={15} /></div><div className="alert-copy"><div><b>{title}</b><span className={`severity-text ${severity.toLowerCase()}`}>{severity}</span></div><p>{id} · {station} · {time}</p><small>{resolved ? 'Resolved automatically after readings returned to baseline.' : 'Current reading deviates from historical and spatial behaviour.'}</small></div><span className={`alert-status ${resolved ? 'resolved' : ''}`}>{resolved ? 'RESOLVED' : 'OPEN'}</span></div>; }
function DemoOverlay({ step, target, readings, close }) { const targetReading = readings.find((item) => item.id === target?.id) || target; const nearbyReadings = readings.filter((item) => item.id !== target?.id).slice(0, 4); const steps = ['Normal station readings', `Inject anomaly into ${target?.id || 'selected station'}`, 'ML detects abnormal behaviour', 'Physics validation checks reading', 'Spatial comparison runs', 'Classification: possible sensor fault', 'Explainability + alert generated']; const baselineTemperature = target?.base?.[0] ?? 32.3; const currentTemperature = targetReading?.temperature ?? 42.1; return <div className="overlay"><div className="demo-modal"><div className="modal-top"><div><span className="eyebrow"><Sparkles size={13} /> LIVE DEMONSTRATION</span><h2>SKYGUARD AI is investigating {target?.id || 'selected station'}</h2></div><button className="close-button" onClick={close}><X size={17} /></button></div><div className="demo-visual"><div className="demo-reading"><span>{target?.id || 'AWS'} · {target?.location || 'Selected AWS station'}</span><strong className={step >= 1 ? 'hot' : ''}>{fmt(step >= 1 ? currentTemperature : baselineTemperature)}<small>°C</small></strong><span>Live sensor temperature</span></div><div className="demo-arrow"><ArrowUpRight size={22} /></div><div className="demo-verdict"><div className={`demo-verdict-icon ${step >= 5 ? 'done' : ''}`}>{step >= 5 ? <Check size={22} /> : <Activity size={22} />}</div><span>Current classification</span><b>{step >= 5 ? 'POSSIBLE SENSOR FAULT' : 'ANALYZING…'}</b></div></div><div className="demo-steps">{steps.map((item, index) => <div className={`demo-step ${index < step ? 'done' : ''} ${index === step ? 'current' : ''}`} key={item}><span>{index < step ? <Check size={12} /> : index + 1}</span><b>{item}</b>{index === step && <i className="step-loader" />}</div>)}</div><div className="demo-neighbours"><span>Nearby stations</span><div>{nearbyReadings.map((item) => <b key={item.id}>{fmt(item.temperature)}°</b>)}<small>{nearbyReadings.length} normal</small></div></div><div className="modal-bottom"><span><span className="pulse-dot" /> Running prototype inference pipeline</span><button className="button primary" onClick={close}>{step >= 6 ? 'Open command center' : 'Skip to result'}</button></div></div></div>; }
function PresentationOverlay({ analysis, readings, close, runDemo }) { return <div className="overlay presentation-overlay"><div className="presentation-card"><button className="close-button" onClick={close}><X size={17} /></button><div className="presentation-brand"><div className="brand-mark"><CloudLightning size={22} /></div><div><strong>SKYGUARD AI</strong><span>SELF-AWARE WEATHER OBSERVATION NETWORK</span></div></div><div className="presentation-head"><div><span className="eyebrow">SIH26073 · DISASTER MANAGEMENT</span><h2>Detect the abnormal.<br /><em>Validate the physical.</em></h2><p>AI-assisted anomaly detection for Automatic Weather Stations.</p></div><div className="presentation-kpi"><span>LIVE STATIONS</span><strong>{String(readings.length).padStart(2, '0')}</strong><small><i /> {readings.filter((item) => item.status === 'Normal').length} healthy · {analysis.classification === 'Normal' ? 0 : 1} active anomaly</small></div></div><div className="presentation-event"><div className="presentation-event-title"><span className="event-status-icon"><AlertTriangle size={21} /></span><div><span>CURRENT EVENT · {analysis.target.id}</span><strong>{analysis.classification === 'Weather Event' ? 'Likely Genuine Weather Event' : analysis.classification === 'Normal' ? 'Network Operating Normally' : 'Possible Sensor Fault'}</strong></div><span className="investigation-pill">{analysis.classification === 'Normal' ? 'CLEAR' : 'INVESTIGATION REQUIRED'}</span></div><p>{analysis.explanation}</p><div className="presentation-reasons"><span><BrainCircuit size={14} /> ML anomaly</span><span><Gauge size={14} /> Physics {analysis.physicsScore}%</span><span><Layers3 size={14} /> {analysis.spatialScore < 50 ? 'Spatial deviation' : 'Spatially aligned'}</span></div></div><div className="presentation-pipeline"><span className="pipeline-label">DETECTION PIPELINE</span><div>{['AWS DATA', 'VALIDATION', 'ML ANOMALY', 'SPATIAL CHECK', 'EXPLANATION', 'ALERT'].map((item, i) => <React.Fragment key={item}><b><i>{i + 1}</i>{item}</b>{i < 5 && <ArrowUpRight size={16} />}</React.Fragment>)}</div></div><div className="presentation-foot"><span>Prototype · Simulated AWS data · Nano Spark</span><span>Problem Statement ID: SIH26073</span><button className="button primary" onClick={runDemo}><Play size={14} /> Run Live Demo</button></div></div></div>; }

createRoot(document.getElementById('root')).render(<App />);
