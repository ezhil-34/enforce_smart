 

import React, { useMemo, useState, useEffect } from "react";
import {
  Plus,
  Minus,
  AlertTriangle,
  CheckCircle2,
  Info,
  ChevronRight,
} from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  ReferenceLine,
  ResponsiveContainer,
} from "recharts";

// --- Static Reference Calendars ---
const WEEKDAYS_LONG = ["SUNDAY", "MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY"];
const WEEKDAYS_SHORT = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS_SHORT = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function getDateInfo(dateStr) {
  const d = new Date(`${dateStr}T00:00:00`);
  return {
    weekdayLong: WEEKDAYS_LONG[d.getDay()],
    weekdayShort: WEEKDAYS_SHORT[d.getDay()],
    day: d.getDate(),
    month: MONTHS_SHORT[d.getMonth()],
    year: d.getFullYear(),
  };
}

function pad2(n) {
  return String(n).padStart(2, "0");
}

function parsePeak(str) {
  if (!str) return [9, 12];
  const normalized = str.replace("–", "-");
  const [a, b] = normalized.split("-");
  const toHour = (t) => {
    if (!t) return 0;
    const [h, m] = t.trim().split(":").map(Number);
    return h + (m || 0) / 60;
  };
  return [toHour(a), toHour(b)];
}

function buildCurve(hotspot) {
  if (!hotspot) return [];
  const [ps, pe] = parsePeak(hotspot.peak);
  const score = hotspot.score;
  const peakVal = Math.min(99, score + 45);
  const mid = (ps + pe) / 2;
  const sigma = Math.max(1.2, (pe - ps) / 2 + 1.2);
  const pts = [];
  for (let h = 0; h <= 23; h++) {
    const v = score + (peakVal - score) * Math.exp(-((h - mid) ** 2) / (2 * sigma * sigma));
    pts.push({ hour: h, risk: Math.round(Math.max(5, Math.min(99, v))) });
  }
  return pts;
}

const BAND_BADGE = {
  high: "bg-red-500/10 text-red-300 border-red-500/30",
  medium: "bg-amber-500/10 text-amber-300 border-amber-500/30",
  low: "bg-emerald-500/10 text-emerald-300 border-emerald-500/30",
};

const BAND_DOT = {
  high: { bg: "#f87171", ring: "rgba(248,113,113,0.45)" },
  medium: { bg: "#fbbf24", ring: "rgba(251,191,36,0.45)" },
  low: { bg: "#34d399", ring: "rgba(52,211,153,0.45)" },
};

function Eyebrow({ children }) {
  return (
    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-cyan-500/10 text-cyan-300 border border-cyan-500/30 tracking-wider">
      {children}
    </span>
  );
}

function StatCard({ label, value }) {
  return (
    <div className="bg-slate-950/60 border border-slate-800 rounded-lg p-2.5">
      <p className="text-[10px] font-mono text-slate-500 tracking-wide">{label}</p>
      <p className="text-xs font-semibold text-slate-200 mt-1 break-words">{value}</p>
    </div>
  );
}

function MetricBar({ label, value, sub }) {
  return (
    <div>
      <div className="flex items-center justify-between text-[10px] font-mono text-slate-500 tracking-wide">
        <span>{label}</span>
        <span className="text-slate-200 font-semibold text-xs">{value}%</span>
      </div>
      <div className="h-1.5 bg-slate-800 rounded-full mt-1.5 overflow-hidden">
        <div className="h-full bg-cyan-400 rounded-full" style={{ width: `${value}%` }} />
      </div>
      {sub && <p className="text-[10px] text-slate-600 mt-1">{sub}</p>}
    </div>
  );
}

function bandLabel(band) {
  if (!band) return "—";
  return band === "medium" ? "MED" : band.toUpperCase();
}

// --- Mappls Native HTML Custom DOM Pin Generator ---
function addMapplsMarker(mapInstance, h, onClickCallback) {
  if (!mapInstance || !window.mappls) return null;
  const dotColor = BAND_DOT[h.band]?.bg || "#94a3b8";
  
  const customIconHtml = document.createElement("div");
  customIconHtml.style.position = "relative";
  customIconHtml.style.display = "flex";
  customIconHtml.style.alignItems = "center";
  customIconHtml.style.justifyContent = "center";
  customIconHtml.style.width = "26px";
  customIconHtml.style.height = "26px";
  customIconHtml.style.backgroundColor = dotColor;
  customIconHtml.style.border = "2px solid #0f172a";
  customIconHtml.style.color = "#0f172a";
  customIconHtml.style.borderRadius = "50%";
  customIconHtml.style.fontWeight = "bold";
  customIconHtml.style.fontSize = "10px";
  customIconHtml.style.cursor = "pointer";
  customIconHtml.style.boxShadow = "0 2px 5px rgba(0,0,0,0.3)";
  customIconHtml.innerText = h.id.replace("H-", "");

  try {
    const marker = new window.mappls.Marker({
      position: [h.latitude, h.longitude],
      html: customIconHtml,
      popupHtml: `<div style="text-align: left; padding: 4px; color: #000; font-family: sans-serif; font-size: 11px;">
                    <strong style="display:block; margin-bottom:2px;">${h.id} · ${h.name}</strong>
                    <span>Risk Severity Score: ${h.score}</span>
                  </div>`,
      popupOptions: { offset: [0, -10] }
    });

    marker.setMap(mapInstance);

    customIconHtml.addEventListener("click", () => {
      onClickCallback(h.id);
    });

    return marker;
  } catch (err) {
    console.error("Failed to append marker:", err);
    return null;
  }
}

function junctionSub(value) {
  if (value >= 80) return "Near major intersection";
  if (value >= 50) return "Within signal influence zone";
  return "Away from major junctions";
}

function cleanText(text) {
  if (!text) return "Unknown";
  return text.replace(/[\[\]"'\\]/g, "").trim();
}

export default function App() {
  const [hotspots, setHotspots] = useState([]);
  const [heatmapPoints, setHeatmapPoints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [forecastDate, setForecastDate] = useState("2023-11-28");
  const [hourOfDay, setHourOfDay] = useState(7);
  const [activeView, setActiveView] = useState("map");
  const [selectedId, setSelectedId] = useState("");
  const [zoom, setZoom] = useState(13);
  const [activeBands, setActiveBands] = useState(new Set(["high", "medium", "low"]));
  const [hourlyStats, setHourlyStats] = useState({});
  const [offenceStats, setOffenceStats] = useState({});
  const [junctionStats, setJunctionStats] = useState({});

  // Core Mappls Engine Instance References
  const [mapEngine, setMapEngine] = useState(null);
  const [activeMarkers, setActiveMarkers] = useState([]);
  const [heatmapLayer, setHeatmapLayer] = useState(null);

  // --- MAPPLAS CREDENTIAL VALUE ---
  const MAP_SDK_KEY = "99b2c63c275da11716d06b3d65337b1a"; 

  const dateInfo = useMemo(() => getDateInfo(forecastDate), [forecastDate]);

  useEffect(() => {
    setLoading(true);
    
    const fetchHotspots = fetch(`http://127.0.0.1:8000/predict/hotspots?date=${forecastDate}`).then((res) => res.json());
    const fetchHeatmap = fetch(`http://127.0.0.1:8000/heatmap/violations?start_date=${forecastDate}&end_date=${forecastDate}&hour=${hourOfDay}`).then((res) => res.json());
    const fetchHourly = fetch(`http://127.0.0.1:8000/stats/hourly?date=${forecastDate}`).then((res) => res.json()).catch(() => ({}));
    const fetchOffences = fetch(`http://127.0.0.1:8000/stats/offence?start_date=${forecastDate}&end_date=${forecastDate}`).then((res) => res.json()).catch(() => ({}));
    const fetchJunctions = fetch(`http://127.0.0.1:8000/stats/junctions?start_date=${forecastDate}&end_date=${forecastDate}`).then((res) => res.json()).catch(() => ({}));

    Promise.all([fetchHotspots, fetchHeatmap, fetchHourly, fetchOffences, fetchJunctions])
      .then(([data, heatData, hourlyData, offenceData, junctionData]) => {
        if (heatData) setHeatmapPoints(heatData);
        if (!(offenceData instanceof Error) && offenceData.status !== 404) setOffenceStats(offenceData);
        if (!(junctionData instanceof Error) && junctionData.status !== 404) setJunctionStats(junctionData);
        setHourlyStats(hourlyData);

        if (data && data.hotspots) {
          const validRaw = data.hotspots.filter(
            (h) => Number.isFinite(h.latitude) && Number.isFinite(h.longitude)
          );
          const processed = validRaw.map((h, i) => {
            const cleanViolation = cleanText(h.dominantViolation);
            const cleanVehicle = cleanText(h.dominantVehicle);
            const computedBand = h.band || (h.score >= 70 ? "high" : h.score >= 40 ? "medium" : "low");
            
            let dispatchConfig = null;
            if (computedBand === "high" || computedBand === "medium") {
              dispatchConfig = {
                type: "monitor",
                patrol: computedBand === "high" ? 2 : 1,
                deployBy: h.peak ? h.peak.split("–")[0] || "12:15" : "12:15",
                action: `Position patrol near zone from ${h.peak ? h.peak.split("–")[0] : "12:15"}. Issue advisory; tow only on repeat offence.`,
              };
            } else {
              dispatchConfig = {
                type: "routine",
                action: "No active deployment required. Include in standard beat patrol pass.",
              };
            }

            const scaledFrequency = Math.min(100, Math.floor((h.violationFrequency / 1000) * 100)) || 45;

            return {
              id: h.id || `H-${i}`,
              name: `${cleanViolation} Detection Zone`,
              area: `Sector Hub Line (Lat: ${h.latitude.toFixed(3)})`,
              cluster: `Cluster #${h.id.replace("H-", "")}`,
              band: computedBand,
              score: h.score,
              peak: h.peak || "12:00-15:00",
              day: dateInfo.weekdayShort,
              dominantVehicle: cleanVehicle,
              dominantViolation: cleanViolation,
              violationFrequency: scaledFrequency,
              junctionProximity: Math.floor(Math.abs(Math.sin(i)) * 40) + 50,
              avgBlocking: Math.floor(Math.abs(Math.cos(i)) * 50) + 30,
              avgBlockingMinutes: Math.floor(Math.abs(Math.cos(i)) * 25) + 15,
              historicalRecords: h.violationFrequency,
              latitude: h.latitude,
              longitude: h.longitude,
              vehicleMix: [
                { label: "Maxi-Cab", pct: cleanVehicle === "MAXI-CAB" ? 50 : 20, color: "#38bdf8" },
                { label: "LCV", pct: cleanVehicle === "LCV" ? 50 : 15, color: "#fbbf24" },
                { label: "Car", pct: cleanVehicle === "CAR" ? 55 : 25, color: "#fb7185" },
                { label: "Scooter", pct: cleanVehicle === "SCOOTER" ? 60 : 15, color: "#34d399" },
              ],
              repeatHotspot: h.score >= 50,
              dispatch: dispatchConfig,
            };
          });

          setHotspots(processed);
          if (processed.length > 0) {
            setSelectedId(processed[0].id);
          }
        }
        setLoading(false);
      })
      .catch((err) => {
        console.error("Connection link broke with FastAPI platform framework:", err);
        setLoading(false);
      });
  }, [forecastDate, hourOfDay, dateInfo.weekdayShort]);

  const selected = hotspots.find((h) => h.id === selectedId) || hotspots[0];
  const visibleHotspots = hotspots.filter((h) => activeBands.has(h.band));
  const dispatchHotspots = hotspots.filter((h) => h.dispatch);
  
  const curveData = useMemo(() => {
    if (hourlyStats && Object.keys(hourlyStats).length > 0) {
      return Array.from({ length: 24 }, (_, i) => ({
        hour: i,
        risk: hourlyStats[i] !== undefined ? hourlyStats[i] : 0,
      }));
    }
    return buildCurve(selected);
  }, [selected, hourlyStats]);

  const toggleBand = (band) => {
    setActiveBands((prev) => {
      const next = new Set(prev);
      if (next.has(band)) next.delete(band);
      else next.add(band);
      return next;
    });
  };

  const focusOnMap = (id) => {
    setSelectedId(id);
    setActiveView("map");
  };

  const mapCenter = useMemo(() => {
    if (selected && Number.isFinite(selected.latitude) && Number.isFinite(selected.longitude)) {
      return [selected.latitude, selected.longitude];
    }
    const firstValid = hotspots.find((h) => Number.isFinite(h.latitude) && Number.isFinite(h.longitude));
    if (firstValid) {
      return [firstValid.latitude, firstValid.longitude];
    }
    return [12.9716, 77.5946];
  }, [selected, hotspots]);

  // --- Integrated Native Mappls Script Injector ---
  useEffect(() => {
    if (activeView !== "map" || loading) return;

    let mapInstance = null;

    const loadMapplsScript = () => {
      const scriptId = "mappls-sdk-script";
      let script = document.getElementById(scriptId);

      if (!script) {
        script = document.createElement("script");
        script.id = scriptId;
        script.src = `https://apis.mappls.com/advancedmaps/api/${MAP_SDK_KEY}/map_sdk?v=3.0&layer=vector`;
        script.async = true;
        script.defer = true;
        document.head.appendChild(script);
        script.onload = () => initMapplsEngine();
      } else {
        initMapplsEngine();
      }
    };

    const initMapplsEngine = () => {
      const container = document.getElementById("mappls-map-container");
      if (!container || !window.mappls) return;

      try {
        mapInstance = new window.mappls.Map("mappls-map-container", {
          center: mapCenter,
          zoom: zoom,
          zoomControl: false,
        });

        // SAFETY GATE: Only activate engine context once loaded fully
        mapInstance.addListener("load", () => {
          setMapEngine(mapInstance);
        });
      } catch (err) {
        console.error("Mappls Engine failed to boot:", err);
      }
    };

    const timer = setTimeout(loadMapplsScript, 200);

    return () => {
      clearTimeout(timer);
      if (mapInstance && typeof mapInstance.remove === "function") {
        mapInstance.remove();
      }
      setMapEngine(null);
    };
  }, [activeView, loading]);

  // Sync position shifts smoothly
  useEffect(() => {
    if (mapEngine && typeof mapEngine.setCenter === "function") {
      mapEngine.setCenter({ lat: mapCenter[0], lng: mapCenter[1] });
      mapEngine.setZoom(zoom);
    }
  }, [mapCenter, zoom, mapEngine]);

  // Dynamic Layer Marker Generator WITH EXPLICIT OBJECT VALIDATION CHECK
  useEffect(() => {
    // If mapEngine isn't completely resolved, drop completely to stop crash
    if (!mapEngine || typeof mapEngine.addListener !== "function") return;

    // Clear previous markers safely
    activeMarkers.forEach((m) => {
      if (m && typeof m.setMap === "function") m.setMap(null);
    });

    if (visibleHotspots.length === 0) {
      setActiveMarkers([]);
      return;
    }

    const standardPins = visibleHotspots
      .map((h) => addMapplsMarker(mapEngine, h, (clickedId) => setSelectedId(clickedId)))
      .filter(Boolean);

    setActiveMarkers(standardPins);
  }, [visibleHotspots, mapEngine]);

  // --- Heatmap Layer Renderer ---
  // Mirrors the marker effect above: waits for the map engine, then
  // (re)builds the Mappls HeatmapLayer from the fetched violation points.
  useEffect(() => {
    if (!mapEngine || typeof mapEngine.addListener !== "function" || !window.mappls) return;

    // Remove any previously rendered heatmap before drawing a new one
    if (heatmapLayer) {
      if (typeof heatmapLayer.remove === "function") {
        heatmapLayer.remove();
      } else if (typeof heatmapLayer.setMap === "function") {
        heatmapLayer.setMap(null);
      }
    }

    if (!heatmapPoints || heatmapPoints.length === 0) {
      setHeatmapLayer(null);
      return;
    }

    const heatData = heatmapPoints
      .filter((p) => p && p.latitude != null && p.longitude != null)
      .map((p) => ({ lat: p.latitude, lng: p.longitude }));

    if (heatData.length === 0) {
      setHeatmapLayer(null);
      return;
    }

    try {
      const layer = new window.mappls.HeatmapLayer({
        map: mapEngine,
        data: heatData,
        opacity: 0.7,
        radius: 18,
        maxIntensity: 12,
        fitbounds: false,
        gradient: [
          "rgba(34,211,238,0)",
          "rgba(34,211,238,0.8)",
          "rgba(251,191,36,0.9)",
          "rgba(248,113,113,1)",
        ],
      });
      setHeatmapLayer(layer);
    } catch (err) {
      console.error("Heatmap layer failed to render:", err);
    }
  }, [heatmapPoints, mapEngine]);

  if (loading && hotspots.length === 0) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-200 flex flex-col items-center justify-center font-mono text-xs gap-2">
        <span className="animate-pulse text-cyan-400">LOADING ENFORCESMART AI CORE BACKEND...</span>
        <span className="text-slate-600">Querying live data frames for {forecastDate}</span>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200">
      <div className="max-w-7xl mx-auto p-4 sm:p-6 flex flex-col gap-4">
        {/* Header Module */}
        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-cyan-400 to-blue-600 flex items-center justify-center font-bold text-slate-950 shrink-0">
              ES
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-semibold text-white">EnforceSmart</h1>
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-cyan-500/10 text-cyan-300 border border-cyan-500/30">V1</span>
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">MVP</span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5 max-w-md">
                Predicts where illegal parking will choke roads — tells enforcement exactly where and when to act.
              </p>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row gap-2">
            <div className="flex items-center gap-2 text-xs font-mono px-3 py-1.5 rounded-md bg-slate-900 border border-slate-800 text-slate-400">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
              MODEL RF v0.4 · DBSCAN(ε=80m)
            </div>
            <div className="flex items-center gap-2 text-xs font-mono px-3 py-1.5 rounded-md bg-slate-900 border border-slate-800 text-slate-400">
              {dateInfo.weekdayShort} {dateInfo.day} {dateInfo.month} {dateInfo.year} · {pad2(hourOfDay)}:00 IST
            </div>
          </div>
        </div>

        {/* Filters Panel */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4 flex flex-col lg:flex-row lg:items-end gap-4">
          <div>
            <label className="text-[10px] font-mono tracking-wider text-slate-500">FORECAST DATE</label>
            <div className="relative mt-1">
              <input
                type="date"
                value={forecastDate}
                onChange={(e) => e.target.value && setForecastDate(e.target.value)}
                className="bg-slate-950 border border-slate-700 rounded-md pl-3 pr-3 py-1.5 text-sm text-slate-200 w-full sm:w-48 focus:outline-none focus:border-cyan-500 cursor-pointer [color-scheme:dark]"
              />
            </div>
          </div>
          <div className="flex-1">
            <div className="flex items-center justify-between">
              <label className="text-[10px] font-mono tracking-wider text-slate-500">HOUR OF DAY</label>
              <span className="text-xs font-mono text-cyan-300">{pad2(hourOfDay)}:00 · {dateInfo.weekdayLong}</span>
            </div>
            <input
              type="range"
              min={0}
              max={23}
              value={hourOfDay}
              onChange={(e) => setHourOfDay(Number(e.target.value))}
              className="w-full mt-2 accent-cyan-400"
            />
            <div className="flex justify-between text-[10px] text-slate-500 font-mono mt-1">
              <span>00</span><span>06</span><span>12</span><span>18</span><span>23</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {["high", "medium", "low"].map((band) => {
              const active = activeBands.has(band);
              const dot = BAND_DOT[band];
              return (
                <button
                  key={band}
                  onClick={() => toggleBand(band)}
                  className={`flex items-center gap-1.5 text-xs font-mono px-2.5 py-1.5 rounded-full border transition-colors ${
                    active ? "border-slate-700 text-slate-200 bg-slate-800/60" : "border-slate-800 text-slate-600"
                  }`}
                >
                  <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: active ? dot.bg : "#475569" }} />
                  {band === "high" ? "High Risk" : band === "medium" ? "Medium" : "Low"}
                </button>
              );
            })}
          </div>
        </div>

        {/* View Tabs Selector */}
        <div className="flex gap-2">
          <button
            onClick={() => setActiveView("map")}
            className={`text-xs font-mono px-3 py-1.5 rounded-md border tracking-wide ${
              activeView === "map" ? "border-cyan-500/50 bg-cyan-500/10 text-cyan-300" : "border-slate-800 text-slate-500 hover:text-slate-300"
            }`}
          >
            VIEW 01 · Tactical Map
          </button>
          <button
            onClick={() => setActiveView("dispatch")}
            className={`text-xs font-mono px-3 py-1.5 rounded-md border tracking-wide ${
              activeView === "dispatch" ? "border-cyan-500/50 bg-cyan-500/10 text-cyan-300" : "border-slate-800 text-slate-500 hover:text-slate-300"
            }`}
          >
            VIEW 02 · Patrol Dispatch
          </button>
        </div>

        {/* VIEW 01 — Tactical Command Map View */}
        {activeView === "map" && (
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1 bg-slate-900/60 border border-slate-800 rounded-xl overflow-hidden flex flex-col">
              <div className="p-4 border-b border-slate-800">
                <Eyebrow>VIEW 01</Eyebrow>
                <h2 className="text-sm font-semibold text-white mt-1.5">Predictive Tactical Command Map</h2>
                <p className="text-xs text-slate-500">
                  Parking-induced congestion risk prediction · DBSCAN clusters vector tracking framework
                </p>
              </div>

              {/* Mappls Canvas Container */}
              <div className="relative flex-1 overflow-hidden" style={{ minHeight: 460 }}>
                <div 
                  id="mappls-map-container" 
                  style={{ height: "100%", width: "100%", backgroundColor: "#0b0f19" }} 
                />

                {/* Tactical Zoom Widgets */}
                <div className="absolute top-3 left-3 flex flex-col rounded-md overflow-hidden border border-slate-800 z-[1000]">
                  <button
                    onClick={() => setZoom((z) => Math.min(18, z + 1))}
                    className="bg-slate-950/90 hover:bg-slate-800 text-slate-300 p-2"
                  >
                    <Plus size={14} />
                  </button>
                  <button
                    onClick={() => setZoom((z) => Math.max(10, z - 1))}
                    className="bg-slate-950/90 hover:bg-slate-800 text-slate-300 p-2 border-t border-slate-800"
                  >
                    <Minus size={14} />
                  </button>
                </div>

                {/* Floating Map Dashboard Card */}
                {selected && (
                  <div className="absolute bottom-3 left-3 max-w-xs bg-slate-950/95 text-slate-200 border border-slate-800 rounded-md shadow-xl p-3 text-xs z-[1000]">
                    <p className="font-semibold text-white">{selected.id} · {selected.name}</p>
                    <p className="text-slate-500 mb-1">{selected.area}</p>
                    <p>
                      Risk:{" "}
                      <span className="font-semibold" style={{ color: BAND_DOT[selected.band]?.bg }}>
                        {selected.band.toUpperCase()} ({selected.score})
                      </span>
                    </p>
                    <p className="text-slate-400">Peak: {selected.peak}</p>
                    <p className="text-slate-400">Violation: {selected.dominantViolation}</p>
                    <p className="text-slate-400">Avg blocking: {selected.avgBlockingMinutes} min</p>
                  </div>
                )}
              </div>
            </div>

            {/* Feature Explainability Sidebar */}
            <div className="lg:w-96 bg-slate-900/60 border border-slate-800 rounded-xl p-4 flex flex-col gap-4">
              <div className="flex items-center justify-between"><Eyebrow>EXPLAIN</Eyebrow></div>
              <div>
                <h3 className="text-sm font-semibold text-white">Why this risk?</h3>
                <p className="text-xs text-slate-500">Model feature breakdown</p>
              </div>

              {selected && (
                <>
                  <div className="flex items-start justify-between border-b border-slate-800 pb-3">
                    <div>
                      <p className="text-[10px] font-mono text-slate-500">{selected.id}</p>
                      <p className="text-sm font-medium text-white">{selected.name}</p>
                      <p className="text-xs text-slate-500">{selected.area}</p>
                    </div>
                    <span className={`text-xs font-mono px-2 py-1 rounded border whitespace-nowrap ${BAND_BADGE[selected.band]}`}>
                      {bandLabel(selected.band)} · {selected.score}
                    </span>
                  </div>

                  <MetricBar label="VIOLATION FREQUENCY" value={selected.violationFrequency} sub={`${selected.historicalRecords} historical records`} />
                  <MetricBar label="JUNCTION PROXIMITY" value={selected.junctionProximity} sub={junctionSub(selected.junctionProximity)} />
                  <MetricBar label="AVG. BLOCKING DURATION" value={selected.avgBlocking} sub={`${selected.avgBlockingMinutes} min average`} />

                  <div>
                    <p className="text-[10px] font-mono text-slate-500 tracking-wide mb-1.5">VEHICLE MIX</p>
                    <div className="h-2 rounded-full overflow-hidden flex">
                      {selected.vehicleMix.map((v) => (
                        <div key={v.label} style={{ width: `${v.pct}%`, backgroundColor: v.color }} />
                      ))}
                    </div>
                    <div className="flex flex-wrap gap-3 mt-2">
                      {selected.vehicleMix.map((v) => (
                        <span key={v.label} className="flex items-center gap-1 text-[10px] text-slate-400">
                          <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: v.color }} />
                          {v.label} {v.pct}%
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <StatCard label="PEAK WINDOW" value={selected.peak} />
                    <StatCard label="DOMINANT VEHICLE" value={selected.dominantVehicle} />
                    <StatCard label="DOMINANT VIOLATION" value={selected.dominantViolation} />
                    <StatCard label="REPEAT HOTSPOT" value={selected.repeatHotspot ? "Yes" : "No"} />
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        {/* VIEW 02 — Dispatch Directives */}
        {activeView === "dispatch" && (
          <div className="flex flex-col gap-4">
            <div>
              <Eyebrow>VIEW 02</Eyebrow>
              <h2 className="text-sm font-semibold text-white mt-1.5">Smart Patrol Dispatch</h2>
              <p className="text-xs text-slate-500">AI predictions converted into concrete enforcement instructions</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {dispatchHotspots.map((h) => {
                const isMonitor = h.dispatch.type === "monitor";
                return (
                  <div
                    key={h.id}
                    className={`bg-slate-900/60 border rounded-xl p-4 flex flex-col gap-3 ${
                      isMonitor ? "border-amber-500/40" : "border-emerald-500/40"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-mono text-slate-300 flex items-center gap-1.5">
                        {isMonitor ? <AlertTriangle size={12} className="text-amber-400" /> : <CheckCircle2 size={12} className="text-emerald-400" />}
                        {isMonitor ? "MONITOR" : "ROUTINE"}
                      </span>
                      <span className={`text-xs font-mono px-2 py-0.5 rounded border whitespace-nowrap ${isMonitor ? BAND_BADGE.medium : BAND_BADGE.low}`}>
                        score {h.score}
                      </span>
                    </div>

                    <div>
                      <p className="text-[10px] font-mono text-slate-500 tracking-wide">TARGET ZONE</p>
                      <p className="text-sm font-medium text-white">{h.name} <span className="text-slate-500 text-xs">({h.cluster})</span></p>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <StatCard label="PEAK WINDOW" value={h.peak} />
                      <StatCard label="DAY" value={h.day} />
                      <StatCard label="DOMINANT" value={h.dominantVehicle} />
                      <StatCard label="VIOLATION" value={h.dominantViolation} />
                    </div>

                    <div>
                      <p className="text-[10px] font-mono text-slate-500 tracking-wide flex items-center gap-1"><Info size={10} /> RECOMMENDED ACTION</p>
                      <p className="text-xs text-slate-400 mt-1">{h.dispatch.action}</p>
                    </div>

                    <button onClick={() => focusOnMap(h.id)} className="mt-auto text-xs font-mono text-cyan-300 hover:text-cyan-200 flex items-center gap-1 self-start">
                      Focus on map <ChevronRight size={12} />
                    </button>
                  </div>
                );
              })}
            </div>

            {/* Ranking Table & Curves */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4 overflow-x-auto">
                <div className="flex items-center justify-between mb-3 gap-3">
                  <div>
                    <Eyebrow>INTEL</Eyebrow>
                    <h3 className="text-sm font-semibold text-white mt-1.5">Hotspot Ranking</h3>
                  </div>
                  <p className="text-xs text-slate-500 whitespace-nowrap">
                    {visibleHotspots.length} clusters active
                  </p>
                </div>
                <table className="w-full text-xs">
                  <thead>
                    <tr className="text-left text-slate-500 font-mono text-[10px] border-b border-slate-800">
                      <th className="py-2 pr-2">#</th>
                      <th className="py-2 pr-2">AREA</th>
                      <th className="py-2 pr-2">CLUSTER</th>
                      <th className="py-2 pr-2">RISK</th>
                      <th className="py-2 pr-2">PEAK</th>
                      <th className="py-2 pr-2">DOMINANT VIOLATION</th>
                    </tr>
                  </thead>
                  <tbody>
                    {visibleHotspots.map((h, i) => (
                      <tr
                        key={h.id}
                        onClick={() => setSelectedId(h.id)}
                        className={`cursor-pointer border-b border-slate-900 hover:bg-slate-800/50 ${selectedId === h.id ? "bg-slate-800/70" : ""}`}
                      >
                        <td className="py-2 pr-2 text-slate-500 font-mono">{pad2(i + 1)}</td>
                        <td className="py-2 pr-2">
                          <p className="text-slate-200">{h.name}</p>
                          <p className="text-slate-500 text-[10px]">{h.area}</p>
                        </td>
                        <td className="py-2 pr-2 text-slate-400 font-mono">{h.id}</td>
                        <td className="py-2 pr-2">
                          <span className={`px-1.5 py-0.5 rounded text-[10px] font-mono border whitespace-nowrap ${BAND_BADGE[h.band]}`}>
                            {bandLabel(h.band)} {h.score}
                          </span>
                        </td>
                        <td className="py-2 pr-2 text-slate-400 font-mono whitespace-nowrap">{h.peak}</td>
                        <td className="py-2 pr-2 text-slate-400">{h.dominantViolation}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Time Series Matrix Graph Box */}
              <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4">
                <div className="flex items-center justify-between mb-2 gap-3">
                  <div>
                    <Eyebrow>CURVE</Eyebrow>
                    <h3 className="text-sm font-semibold text-white mt-1.5">
                      {Object.keys(hourlyStats).length > 0 ? "Total Hourly Violations" : "Time-of-Day Risk"}
                    </h3>
                  </div>
                  {selected && <p className="text-xs text-slate-500 font-mono whitespace-nowrap">{selected.id}</p>}
                </div>
                <div style={{ height: 220 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={curveData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <CartesianGrid stroke="#1e293b" vertical={false} />
                      <XAxis dataKey="hour" stroke="#475569" tick={{ fontSize: 10, fill: "#64748b" }} ticks={[0, 3, 6, 9, 12, 15, 18, 21]} />
                      <YAxis stroke="#475569" tick={{ fontSize: 10, fill: "#64748b" }} />
                      <ReferenceLine x={hourOfDay} stroke="#22d3ee" strokeDasharray="4 4" />
                      <Line type="monotone" dataKey="risk" stroke="#22d3ee" strokeWidth={2.5} dot={false} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}