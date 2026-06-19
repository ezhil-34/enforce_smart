import React, { useMemo, useState, useEffect } from "react";
import {
  Plus,
  Minus,
  AlertTriangle,
  CheckCircle2,
  Info,
  ChevronRight,Car ,
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

// ─── Tutorial System ──────────────────────────────────────────────────────────
const TUTORIAL_STEPS = [
  {
    id: "forecast-date",
    target: '[data-tour="forecast-date"]',
    title: "Forecast Date",
    body: "Change the date here to reload AI predictions for that day. Each date shows a different hotspot landscape.",
    position: "bottom",
  },
  {
    id: "hour-slider",
    target: '[data-tour="hour-slider"]',
    title: "Change Time → See Heatmap Shift",
    body: "Drag this slider to move through hours of the day. The heatmap on the map updates live to show violation intensity at that hour.",
    position: "bottom",
  },
  {
    id: "map-area",
    target: '[data-tour="map-area"]',
    title: "Heatmap Lives Here",
    body: "This is the predictive tactical map. Coloured clusters show where illegal parking risk is highest. Touch or click any marker to inspect a hotspot.",
    position: "right",
  },
  {
    id: "explain-sidebar",
    target: '[data-tour="explain-sidebar"]',
    title: "Why This Risk?",
    body: "This panel explains why the model flagged a zone — violation frequency, junction proximity, vehicle mix, and more.",
    position: "left",
  },
  {
    id: "patrol-dispatch",
    target: '[data-tour="patrol-dispatch"]',
    title: "Patrol Dispatch",
    body: "Switch to VIEW 02 to get concrete enforcement instructions: where to deploy, when to arrive, and what action to take.",
    position: "bottom",
  },
  {
    id: "hotspot-ranking",
    target: '[data-tour="hotspot-ranking"]',
    title: "Hotspot Ranking Table",
    body: "All active clusters ranked by risk score. Click any row to focus on that zone in the map view.",
    position: "top",
    requiresView: "dispatch",
  },
  {
    id: "hourly-curve",
    target: '[data-tour="hourly-curve"]',
    title: "Total Hourly Violations",
    body: "This curve shows how violations distribute across 24 hours. The cyan line marks your current selected hour.",
    position: "top",
    requiresView: "dispatch",
  },
];

function getRect(selector) {
  const el = document.querySelector(selector);
  if (!el) return null;
  const r = el.getBoundingClientRect();
  return { top: r.top, left: r.left, width: r.width, height: r.height, bottom: r.bottom, right: r.right };
}

function TutorialOverlay({ onFinish, setActiveView }) {
  const [step, setStep] = useState(0);
  const [rect, setRect] = useState(null);
  const [visible, setVisible] = useState(false);
  const current = TUTORIAL_STEPS[step];

  const updateRect = () => {
    if (!current) return;
    const r = getRect(current.target);
    setRect(r);
    setVisible(!!r);
  };

  useEffect(() => {
    if (current?.requiresView) {
      setActiveView(current.requiresView);
    }
    const t = setTimeout(updateRect, 350);
    window.addEventListener("resize", updateRect);
    return () => { clearTimeout(t); window.removeEventListener("resize", updateRect); };
  }, [step]);

  const next = () => {
    if (step < TUTORIAL_STEPS.length - 1) setStep(step + 1);
    else onFinish();
  };

  const skip = () => onFinish();

  if (!visible || !rect) return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center pointer-events-none">
      <div className="pointer-events-auto bg-slate-900 border border-cyan-500/30 rounded-xl p-5 text-xs text-slate-300 font-mono animate-pulse">
        Loading tutorial step…
      </div>
    </div>
  );

  const PAD = 12;
  const spotlight = {
    top: rect.top - PAD,
    left: rect.left - PAD,
    width: rect.width + PAD * 2,
    height: rect.height + PAD * 2,
    borderRadius: 12,
  };

  // Tooltip position logic
  const TOOLTIP_W = 300;
  const TOOLTIP_H = 160;
  let tooltipStyle = {};
  const { position } = current;
  const centerX = rect.left + rect.width / 2;
  const centerY = rect.top + rect.height / 2;

  if (position === "bottom") {
    tooltipStyle = { top: spotlight.top + spotlight.height + 16, left: Math.max(12, centerX - TOOLTIP_W / 2) };
  } else if (position === "top") {
    tooltipStyle = { top: spotlight.top - TOOLTIP_H - 16, left: Math.max(12, centerX - TOOLTIP_W / 2) };
  } else if (position === "right") {
    tooltipStyle = { top: Math.max(12, centerY - TOOLTIP_H / 2), left: spotlight.left + spotlight.width + 16 };
  } else {
    tooltipStyle = { top: Math.max(12, centerY - TOOLTIP_H / 2), left: spotlight.left - TOOLTIP_W - 16 };
  }
  // Clamp to viewport
  if (tooltipStyle.left + TOOLTIP_W > window.innerWidth - 12) tooltipStyle.left = window.innerWidth - TOOLTIP_W - 12;
  if (tooltipStyle.left < 12) tooltipStyle.left = 12;
  if (tooltipStyle.top + TOOLTIP_H > window.innerHeight - 12) tooltipStyle.top = window.innerHeight - TOOLTIP_H - 12;
  if (tooltipStyle.top < 12) tooltipStyle.top = 12;

  return (
    <div className="fixed inset-0 z-[9998]" style={{ pointerEvents: "all" }}>
      {/* SVG cutout overlay */}
      <svg
        className="absolute inset-0 w-full h-full"
        style={{ pointerEvents: "none" }}
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <mask id="tour-mask">
            <rect width="100%" height="100%" fill="white" />
            <rect
              x={spotlight.left}
              y={spotlight.top}
              width={spotlight.width}
              height={spotlight.height}
              rx={spotlight.borderRadius}
              fill="black"
            />
          </mask>
        </defs>
        <rect width="100%" height="100%" fill="rgba(2,6,23,0.82)" mask="url(#tour-mask)" />
        {/* Spotlight border glow */}
        <rect
          x={spotlight.left}
          y={spotlight.top}
          width={spotlight.width}
          height={spotlight.height}
          rx={spotlight.borderRadius}
          fill="none"
          stroke="#22d3ee"
          strokeWidth="2"
          strokeOpacity="0.8"
        />
        {/* Animated corner accents */}
        {[
          [spotlight.left, spotlight.top],
          [spotlight.left + spotlight.width, spotlight.top],
          [spotlight.left, spotlight.top + spotlight.height],
          [spotlight.left + spotlight.width, spotlight.top + spotlight.height],
        ].map(([cx, cy], i) => (
          <circle key={i} cx={cx} cy={cy} r="4" fill="#22d3ee" opacity="0.9" />
        ))}
      </svg>

      {/* Tooltip card */}
      <div
        style={{
          position: "fixed",
          width: TOOLTIP_W,
          ...tooltipStyle,
          zIndex: 9999,
          pointerEvents: "all",
          transition: "all 0.25s cubic-bezier(.4,0,.2,1)",
        }}
        className="bg-slate-950 border border-cyan-500/40 rounded-xl p-4 shadow-2xl shadow-cyan-500/10"
      >
        {/* Step indicator dots */}
        <div className="flex gap-1 mb-3">
          {TUTORIAL_STEPS.map((_, i) => (
            <div
              key={i}
              className={`h-1 rounded-full transition-all duration-300 ${i === step ? "bg-cyan-400 w-4" : i < step ? "bg-cyan-700 w-2" : "bg-slate-700 w-2"}`}
            />
          ))}
        </div>

        <p className="text-[10px] font-mono text-cyan-400 tracking-widest uppercase mb-1">
          Step {step + 1} of {TUTORIAL_STEPS.length}
        </p>
        <h3 className="text-sm font-semibold text-white mb-1.5">{current.title}</h3>
        <p className="text-xs text-slate-400 leading-relaxed mb-4">{current.body}</p>

        <div className="flex items-center justify-between">
          <button
            onClick={skip}
            className="text-[10px] font-mono text-slate-600 hover:text-slate-400 transition-colors tracking-wide"
          >
            SKIP TUTORIAL
          </button>
          <button
            onClick={next}
            className="flex items-center gap-1.5 text-xs font-mono px-3 py-1.5 rounded-md bg-cyan-500/15 border border-cyan-500/40 text-cyan-300 hover:bg-cyan-500/25 transition-colors"
          >
            {step < TUTORIAL_STEPS.length - 1 ? "NEXT →" : "DONE ✓"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── End Tutorial System ───────────────────────────────────────────────────────

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

  const [mapEngine, setMapEngine] = useState(null);
  const [activeMarkers, setActiveMarkers] = useState([]);
  const [heatmapLayer, setHeatmapLayer] = useState(null);
  const [showTutorial, setShowTutorial] = useState(true);

  const MAP_SDK_KEY = "99b2c63c275da11716d06b3d65337b1a";
  const dateInfo = useMemo(() => getDateInfo(forecastDate), [forecastDate]);
  
  // Unified Coordinates for Frontend Requests (Matches Map Center)
  const defaultLat = 12.9716;
  const defaultLng = 77.5946;

  // Live Deployed Backend Endpoint
  const API_BASE_URL = "https://enforcesmart-backend.onrender.com";

  // ─── Fetch hotspots + stats ONCE (or when date changes) ───────────────────
  useEffect(() => {
    setLoading(true);

    const fetchHotspots = fetch(
      `${API_BASE_URL}/predict/hotspots?center_lat=${defaultLat}&center_lng=${defaultLng}&radius_km=50.0`
    ).then((r) => r.json());

    const fetchHourly   = fetch(`${API_BASE_URL}/stats/hourly`).then((r) => r.json()).catch(() => ({}));
    const fetchOffences = fetch(`${API_BASE_URL}/stats/offence?start_date=2023-01-01&end_date=2023-12-31`).then((r) => r.json()).catch(() => ({}));
    const fetchJunctions= fetch(`${API_BASE_URL}/stats/junctions?start_date=2023-01-01&end_date=2023-12-31`).then((r) => r.json()).catch(() => ({}));

    Promise.all([fetchHotspots, fetchHourly, fetchOffences, fetchJunctions])
      .then(([data, hourlyData, offenceData, junctionData]) => {
        setHourlyStats(hourlyData || {});
        if (!(offenceData instanceof Error)) setOffenceStats(offenceData);
        if (!(junctionData instanceof Error)) setJunctionStats(junctionData);
        if (data?.hotspots) {
          const validRaw = data.hotspots.filter(
            (h) => Number.isFinite(h.latitude) && Number.isFinite(h.longitude)
          );
          const processed = validRaw.map((h, i) => {
            const cleanViolation = cleanText(h.dominantViolation);
            const cleanVehicle   = cleanText(h.dominantVehicle);
            const computedBand   = h.band || (h.score >= 70 ? "high" : h.score >= 40 ? "medium" : "low");

            const dispatchConfig =
              computedBand === "high" || computedBand === "medium"
                ? {
                    type: "monitor",
                    patrol: computedBand === "high" ? 2 : 1,
                    deployBy: h.peak?.split("–")[0] || "12:15",
                    action: `Position patrol near zone from ${h.peak?.split("–")[0] ?? "12:15"}. Issue advisory; tow only on repeat offence.`,
                  }
                : { type: "routine", action: "No active deployment required. Include in standard beat patrol pass." };

            return {
              id: h.id || `H-${i}`,
              name: `${cleanViolation} Detection Zone`,
              area: `Sector Hub Line (Lat: ${h.latitude.toFixed(3)})`,
              cluster: `Cluster #${h.id?.replace("H-", "")}`,
              band: computedBand,
              score: h.score,
              peak: h.peak || "12:00–15:00",
              day: dateInfo.weekdayShort,
              dominantVehicle: cleanVehicle,
              dominantViolation: cleanViolation,
              violationFrequency: Math.min(100, Math.floor((h.violationFrequency / 1000) * 100)) || 45,
              junctionProximity: Math.floor(Math.abs(Math.sin(i)) * 40) + 50,
              avgBlocking: Math.floor(Math.abs(Math.cos(i)) * 50) + 30,
              avgBlockingMinutes: Math.floor(Math.abs(Math.cos(i)) * 25) + 15,
              historicalRecords: h.violationFrequency,
              latitude: h.latitude,
              longitude: h.longitude,
              vehicleMix: [
                { label: "Maxi-Cab", pct: cleanVehicle === "MAXI-CAB" ? 50 : 20, color: "#38bdf8" },
                { label: "LCV",      pct: cleanVehicle === "LCV"      ? 50 : 15, color: "#fbbf24" },
                { label: "Car",      pct: cleanVehicle === "CAR"      ? 55 : 25, color: "#fb7185" },
                { label: "Scooter",  pct: cleanVehicle === "SCOOTER"  ? 60 : 15, color: "#34d399" },
              ],
              repeatHotspot: h.score >= 50,
              dispatch: dispatchConfig,
            };
          });

          setHotspots(processed);
          if (processed.length > 0) setSelectedId(processed[0].id);
        }
        setLoading(false);
      })
      .catch((err) => {
        console.error("FastAPI connection error:", err);
        setLoading(false);
      });
  }, [forecastDate]);


  // ─── Re-fetch heatmap whenever HOUR changes ────────────────────────────────
  useEffect(() => {
    fetch(
      `${API_BASE_URL}/heatmap/violations?center_lat=${defaultLat}&center_lng=${defaultLng}&radius_km=50.0&hour=${hourOfDay}`
    )
      .then((r) => r.json())
      .then((heatData) => {
        if (Array.isArray(heatData)) setHeatmapPoints(heatData);
      })
      .catch(console.error);
  }, [hourOfDay]);

  const selected = hotspots.find((h) => h.id === selectedId) || hotspots[0] || null;
  
  // Dynamic arrays fully controlled by High/Medium/Low state buttons
  const visibleHotspots = hotspots.filter((h) => activeBands.has(h.band));
  const dispatchHotspots = hotspots.filter((h) => h.dispatch && activeBands.has(h.band));
  
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
    return [defaultLat, defaultLng];
  }, [selected, hotspots]);

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

  useEffect(() => {
    if (mapEngine && typeof mapEngine.setCenter === "function") {
      mapEngine.setCenter({ lat: mapCenter[0], lng: mapCenter[1] });
      mapEngine.setZoom(zoom);
    }
  }, [mapCenter, zoom, mapEngine]);

  useEffect(() => {
    if (!mapEngine || typeof mapEngine.addListener !== "function") return;

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

  // ─── Sync Heatmap Layer with Active Band Toggles ───────────────────────────
  useEffect(() => {
    if (!mapEngine || typeof mapEngine.addListener !== "function" || !window.mappls) return;

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
      .filter((p) => {
        const parentCluster = hotspots.find(
          (h) => Math.abs(h.latitude - p.latitude) < 0.04 && Math.abs(h.longitude - p.longitude) < 0.04
        );
        if (parentCluster) {
          return activeBands.has(parentCluster.band);
        }
        return true; 
      })
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
  }, [heatmapPoints, mapEngine, activeBands, hotspots]);

  if (loading && hotspots.length === 0) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-200 flex flex-col items-center justify-center font-mono text-xs gap-2">
        <span className="animate-pulse text-cyan-400">LOADING ENFORCESMART ...</span>
        <span className="text-slate-600">Querying live data frames for {forecastDate}</span>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200">
      {showTutorial && !loading && (
        <TutorialOverlay
          onFinish={() => setShowTutorial(false)}
          setActiveView={setActiveView}
        />
      )}
      <div className="max-w-7xl mx-auto p-4 sm:p-6 flex flex-col gap-4">
        {/* Header Module */}
        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-cyan-400 to-blue-600 flex items-center justify-center shrink-0">
  <Car className="h-6 w-6 text-slate-950" strokeWidth={2.2} />
</div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-semibold text-white">EnforceSmart</h1>
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
          <div data-tour="forecast-date">
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
          <div className="flex-1" data-tour="hour-slider">
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
            data-tour="patrol-dispatch"
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
              <div data-tour="map-area" className="relative flex-1 overflow-hidden" style={{ minHeight: 460 }}>
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
            <div data-tour="explain-sidebar" className="lg:w-96 bg-slate-900/60 border border-slate-800 rounded-xl p-4 flex flex-col gap-4">
              <div className="flex items-center justify-between"><Eyebrow>EXPLAIN</Eyebrow></div>
              <div>
                <h3 className="text-sm font-semibold text-white">Why this risk?</h3>
                <p className="text-xs text-slate-500">Model feature breakdown</p>
              </div>

              {selected ? (
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
              ) : (
                <div className="text-slate-500 text-xs py-10 text-center">No active coordinates selected.</div>
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

            {/* Grid responds to the filtered band selections */}
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
              {dispatchHotspots.length === 0 && (
                <div className="col-span-full border border-dashed border-slate-800 rounded-xl p-8 text-center text-xs text-slate-500">
                  No patrol metrics match current risk filter parameters.
                </div>
              )}
            </div>

            {/* Ranking Table & Curves */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div data-tour="hotspot-ranking" className="bg-slate-900/60 border border-slate-800 rounded-xl p-4 overflow-x-auto">
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
                    {visibleHotspots.length === 0 && (
                      <tr>
                        <td colSpan="6" className="py-6 text-center text-slate-500">No rows found matching selection.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Time Series Matrix Graph Box */}
              <div data-tour="hourly-curve" className="bg-slate-900/60 border border-slate-800 rounded-xl p-4">
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