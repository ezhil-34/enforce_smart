import React, { useMemo, useState } from "react";
import {
  Plus,
  Minus,
  AlertTriangle,
  CheckCircle2,
  Info,
  ChevronRight,
  Calendar,
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

// ---------------------------------------------------------------------------
// Static reference data — mirrors the hotspot set from the source dashboard
// ---------------------------------------------------------------------------

const HOTSPOTS = [
  {
    id: "H-09",
    name: "Forum Mall Approach",
    area: "Hosur Road",
    cluster: "Cluster #9",
    band: "medium",
    score: 61,
    peak: "12:30-22:30",
    day: "Wed",
    dominantVehicle: "Car",
    dominantViolation: "Double parking",
    violationFrequency: 88,
    junctionProximity: 70,
    avgBlocking: 60,
    avgBlockingMinutes: 35,
    historicalRecords: 270,
    vehicleMix: [
      { label: "Maxi-Cab", pct: 30, color: "#38bdf8" },
      { label: "LCV", pct: 18, color: "#fbbf24" },
      { label: "Car", pct: 40, color: "#fb7185" },
      { label: "Two-wheeler", pct: 12, color: "#34d399" },
    ],
    repeatHotspot: true,
    pos: { x: 78, y: 44 },
    dispatch: {
      type: "monitor",
      patrol: 1,
      deployBy: "12:15",
      action:
        "Position 1 patrol officer near Forum Mall Approach from 12:15. Issue advisory; tow only on repeat offence.",
    },
  },
  {
    id: "H-07",
    name: "80 Feet Road, 4th Block",
    area: "Koramangala 4 Blk",
    cluster: "Cluster #7",
    band: "medium",
    score: 59,
    peak: "13:30-22:30",
    day: "Wed",
    dominantVehicle: "Car",
    dominantViolation: "No-parking zone",
    violationFrequency: 80,
    junctionProximity: 58,
    avgBlocking: 52,
    avgBlockingMinutes: 30,
    historicalRecords: 244,
    vehicleMix: [
      { label: "Maxi-Cab", pct: 25, color: "#38bdf8" },
      { label: "LCV", pct: 20, color: "#fbbf24" },
      { label: "Car", pct: 45, color: "#fb7185" },
      { label: "Two-wheeler", pct: 10, color: "#34d399" },
    ],
    repeatHotspot: true,
    pos: { x: 60, y: 28 },
  },
  {
    id: "H-02",
    name: "Madiwala Market Junction",
    area: "Madiwala Sector 1",
    cluster: "Cluster #2",
    band: "medium",
    score: 51,
    peak: "09:30-21:30",
    day: "Wed",
    dominantVehicle: "Two-wheeler",
    dominantViolation: "Wrong side parking",
    violationFrequency: 75,
    junctionProximity: 80,
    avgBlocking: 38,
    avgBlockingMinutes: 18,
    historicalRecords: 228,
    vehicleMix: [
      { label: "Maxi-Cab", pct: 20, color: "#38bdf8" },
      { label: "LCV", pct: 15, color: "#fbbf24" },
      { label: "Car", pct: 30, color: "#fb7185" },
      { label: "Two-wheeler", pct: 35, color: "#34d399" },
    ],
    repeatHotspot: true,
    pos: { x: 17, y: 53 },
  },
  {
    id: "H-04",
    name: "18th Main Road, Koramangala",
    area: "Madiwala Sector 2",
    cluster: "Cluster #4",
    band: "medium",
    score: 41,
    peak: "17:30-20:30",
    day: "Wed",
    dominantVehicle: "Maxi-Cab / Commercial",
    dominantViolation: "Parking near intersection",
    violationFrequency: 99,
    junctionProximity: 92,
    avgBlocking: 70,
    avgBlockingMinutes: 42,
    historicalRecords: 318,
    vehicleMix: [
      { label: "Maxi-Cab", pct: 41, color: "#38bdf8" },
      { label: "LCV", pct: 22, color: "#fbbf24" },
      { label: "Car", pct: 27, color: "#fb7185" },
      { label: "Two-wheeler", pct: 10, color: "#34d399" },
    ],
    repeatHotspot: true,
    pos: { x: 58, y: 60 },
  },
  {
    id: "H-15",
    name: "Jakkasandra Signal",
    area: "Koramangala 1 Blk",
    cluster: "Cluster #15",
    band: "low",
    score: 37,
    peak: "07:30-19:30",
    day: "Wed",
    dominantVehicle: "LCV",
    dominantViolation: "Parking near intersection",
    violationFrequency: 50,
    junctionProximity: 62,
    avgBlocking: 28,
    avgBlockingMinutes: 20,
    historicalRecords: 160,
    vehicleMix: [
      { label: "Maxi-Cab", pct: 15, color: "#38bdf8" },
      { label: "LCV", pct: 35, color: "#fbbf24" },
      { label: "Car", pct: 30, color: "#fb7185" },
      { label: "Two-wheeler", pct: 20, color: "#34d399" },
    ],
    repeatHotspot: false,
    pos: { x: 70, y: 38 },
    dispatch: {
      type: "routine",
      action: "No active deployment required. Include in standard beat patrol pass.",
    },
  },
  {
    id: "H-11",
    name: "Sony World Signal",
    area: "Koramangala 5 Blk",
    cluster: "Cluster #11",
    band: "low",
    score: 29,
    peak: "18:30-21:30",
    day: "Wed",
    dominantVehicle: "Car",
    dominantViolation: "Parking near intersection",
    violationFrequency: 45,
    junctionProximity: 52,
    avgBlocking: 24,
    avgBlockingMinutes: 15,
    historicalRecords: 132,
    vehicleMix: [
      { label: "Maxi-Cab", pct: 20, color: "#38bdf8" },
      { label: "LCV", pct: 15, color: "#fbbf24" },
      { label: "Car", pct: 40, color: "#fb7185" },
      { label: "Two-wheeler", pct: 25, color: "#34d399" },
    ],
    repeatHotspot: false,
    pos: { x: 85, y: 56 },
  },
  {
    id: "H-13",
    name: "BTM 1st Stage Bus Stop",
    area: "BTM Layout",
    cluster: "Cluster #13",
    band: "low",
    score: 28,
    peak: "08:30-20:30",
    day: "Wed",
    dominantVehicle: "Two-wheeler",
    dominantViolation: "Bus-stop obstruction",
    violationFrequency: 40,
    junctionProximity: 33,
    avgBlocking: 20,
    avgBlockingMinutes: 12,
    historicalRecords: 118,
    vehicleMix: [
      { label: "Maxi-Cab", pct: 10, color: "#38bdf8" },
      { label: "LCV", pct: 10, color: "#fbbf24" },
      { label: "Car", pct: 35, color: "#fb7185" },
      { label: "Two-wheeler", pct: 45, color: "#34d399" },
    ],
    repeatHotspot: false,
    pos: { x: 30, y: 80 },
  },
];

const WEEKDAYS_LONG = [
  "SUNDAY",
  "MONDAY",
  "TUESDAY",
  "WEDNESDAY",
  "THURSDAY",
  "FRIDAY",
  "SATURDAY",
];
const WEEKDAYS_SHORT = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS_SHORT = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

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
  const [a, b] = str.split("-");
  const toHour = (t) => {
    const [h, m] = t.trim().split(":").map(Number);
    return h + (m || 0) / 60;
  };
  return [toHour(a), toHour(b)];
}

// Generates a smooth, plausible 24-hour risk curve for a hotspot: flat near
// its baseline score, with a bell-shaped rise centered on its peak window.
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

// ---------------------------------------------------------------------------
// Small shared pieces
// ---------------------------------------------------------------------------

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

// Renamed slightly internally or verified layout flow to avoid duplication rules
function MetricBar({ label, value, sub }) {
  return (
    <div>
      <div className="flex items-center justify-between text-[10px] font-mono text-slate-500 tracking-wide">
        <span>{label}</span>
        <span className="text-slate-200 font-semibold text-xs">{value}</span>
      </div>
      <div className="h-1.5 bg-slate-800 rounded-full mt-1.5 overflow-hidden">
        <div className="h-full bg-cyan-400 rounded-full" style={{ width: `${value}%` }} />
      </div>
      {sub && <p className="text-[10px] text-slate-600 mt-1">{sub}</p>}
    </div>
  );
}

function junctionSub(value) {
  if (value >= 80) return "Near major intersection";
  if (value >= 50) return "Within signal influence zone";
  return "Away from major junctions";
}

// ---------------------------------------------------------------------------
// Main app
// ---------------------------------------------------------------------------

export default function App() {
  const [forecastDate, setForecastDate] = useState("2026-06-03");
  const [hourOfDay, setHourOfDay] = useState(12);
  const [activeView, setActiveView] = useState("map"); // "map" | "dispatch"
  const [selectedId, setSelectedId] = useState("H-04");
  const [zoom, setZoom] = useState(1);
  const [activeBands, setActiveBands] = useState(new Set(["high", "medium", "low"]));

  const selected = HOTSPOTS.find((h) => h.id === selectedId) || HOTSPOTS[0];
  const visibleHotspots = HOTSPOTS.filter((h) => activeBands.has(h.band));
  const dispatchHotspots = HOTSPOTS.filter((h) => h.dispatch);
  const curveData = useMemo(() => buildCurve(selected), [selected]);
  const dateInfo = getDateInfo(forecastDate);

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

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200">
      <div className="max-w-7xl mx-auto p-4 sm:p-6 flex flex-col gap-4">
        {/* ---------------------------------------------------------------- */}
        {/* Header                                                          */}
        {/* ---------------------------------------------------------------- */}
        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-cyan-400 to-blue-600 flex items-center justify-center font-bold text-slate-950 shrink-0">
              ES
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-semibold text-white">EnforceSmart</h1>
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-cyan-500/10 text-cyan-300 border border-cyan-500/30">
                  V1
                </span>
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">
                  MVP
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5 max-w-md">
                Predicts where illegal parking will choke roads — tells enforcement exactly
                where and when to act.
              </p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-2">
            <div className="flex items-center gap-2 text-xs font-mono px-3 py-1.5 rounded-md bg-slate-900 border border-slate-800 text-slate-400">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
              MODEL RF v0.4 · DBSCAN(ε=80m)
            </div>
            <div className="flex items-center gap-2 text-xs font-mono px-3 py-1.5 rounded-md bg-slate-900 border border-slate-800 text-slate-400">
              {dateInfo.weekdayShort} {dateInfo.day} {dateInfo.month} {dateInfo.year} ·{" "}
              {pad2(hourOfDay)}:00 IST
            </div>
          </div>
        </div>

        {/* ---------------------------------------------------------------- */}
        {/* Controls                                                        */}
        {/* ---------------------------------------------------------------- */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4 flex flex-col lg:flex-row lg:items-end gap-4">
          <div>
            <label className="text-[10px] font-mono tracking-wider text-slate-500">
              FORECAST DATE
            </label>
            <div className="relative mt-1">
              <Calendar
                size={14}
                className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-500"
              />
              <input
                type="date"
                value={forecastDate}
                onChange={(e) => setForecastDate(e.target.value)}
                className="bg-slate-950 border border-slate-700 rounded-md pl-8 pr-3 py-1.5 text-sm text-slate-200 w-full sm:w-44 focus:outline-none focus:border-cyan-500"
              />
            </div>
          </div>

          <div className="flex-1">
            <div className="flex items-center justify-between">
              <label className="text-[10px] font-mono tracking-wider text-slate-500">
                HOUR OF DAY
              </label>
              <span className="text-xs font-mono text-cyan-300">
                {pad2(hourOfDay)}:00 · {dateInfo.weekdayLong}
              </span>
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
              <span>00</span>
              <span>06</span>
              <span>12</span>
              <span>18</span>
              <span>23</span>
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
                    active
                      ? "border-slate-700 text-slate-200 bg-slate-800/60"
                      : "border-slate-800 text-slate-600"
                  }`}
                >
                  <span
                    className="h-1.5 w-1.5 rounded-full"
                    style={{ backgroundColor: active ? dot.bg : "#475569" }}
                  />
                  {band === "high" ? "High Risk" : band === "medium" ? "Medium" : "Low"}
                </button>
              );
            })}
          </div>
        </div>

        {/* ---------------------------------------------------------------- */}
        {/* View tabs                                                       */}
        {/* ---------------------------------------------------------------- */}
        <div className="flex gap-2">
          <button
            onClick={() => setActiveView("map")}
            className={`text-xs font-mono px-3 py-1.5 rounded-md border tracking-wide ${
              activeView === "map"
                ? "border-cyan-500/50 bg-cyan-500/10 text-cyan-300"
                : "border-slate-800 text-slate-500 hover:text-slate-300"
            }`}
          >
            VIEW 01 · Tactical Map
          </button>
          <button
            onClick={() => setActiveView("dispatch")}
            className={`text-xs font-mono px-3 py-1.5 rounded-md border tracking-wide ${
              activeView === "dispatch"
                ? "border-cyan-500/50 bg-cyan-500/10 text-cyan-300"
                : "border-slate-800 text-slate-500 hover:text-slate-300"
            }`}
          >
            VIEW 02 · Patrol Dispatch
          </button>
        </div>

        {/* ---------------------------------------------------------------- */}
        {/* VIEW 01 — Predictive Tactical Command Map                       */}
        {/* ---------------------------------------------------------------- */}
        {activeView === "map" && (
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1 bg-slate-900/60 border border-slate-800 rounded-xl overflow-hidden flex flex-col">
              <div className="p-4 border-b border-slate-800">
                <Eyebrow>VIEW 01</Eyebrow>
                <h2 className="text-sm font-semibold text-white mt-1.5">
                  Predictive Tactical Command Map
                </h2>
                <p className="text-xs text-slate-500">
                  Parking-induced congestion risk prediction · DBSCAN hotspots × time-aware risk model
                </p>
              </div>

              <div
                className="relative flex-1 overflow-hidden"
                style={{ minHeight: 440, backgroundColor: "#EFE9DA" }}
              >
                {/* scaled map content */}
                <div
                  className="absolute inset-0"
                  style={{ transform: `scale(${zoom})`, transformOrigin: "center" }}
                >
                  <div
                    className="absolute rounded-full"
                    style={{ top: "4%", left: "2%", width: "34%", height: "26%", backgroundColor: "#BFE3D8" }}
                  />
                  <div
                    className="absolute rounded-3xl"
                    style={{ bottom: "4%", right: "6%", width: "42%", height: "38%", backgroundColor: "#C9E4B0" }}
                  />
                  <div
                    className="absolute rounded-full"
                    style={{ top: "34%", left: "-8%", width: "480px", height: "12px", backgroundColor: "#F3CF8E", transform: "rotate(18deg)" }}
                  />
                  <div
                    className="absolute rounded-full"
                    style={{ top: "58%", left: "-5%", width: "420px", height: "7px", backgroundColor: "#FFFFFF", opacity: 0.85, transform: "rotate(6deg)" }}
                  />
                  <div
                    className="absolute rounded-full"
                    style={{ top: "-5%", left: "52%", width: "6px", height: "340px", backgroundColor: "#FFFFFF", opacity: 0.8, transform: "rotate(8deg)" }}
                  />
                  <div
                    className="absolute rounded-full"
                    style={{ top: "14%", left: "8%", width: "300px", height: "6px", backgroundColor: "#FFFFFF", opacity: 0.7, transform: "rotate(-12deg)" }}
                  />

                  {visibleHotspots.map((h) => {
                    const dot = BAND_DOT[h.band];
                    const isSelected = selectedId === h.id;
                    return (
                      <button
                        key={h.id}
                        onClick={() => setSelectedId(h.id)}
                        className="absolute -translate-x-1/2 -translate-y-1/2 flex items-center justify-center"
                        style={{ top: `${h.pos.y}%`, left: `${h.pos.x}%` }}
                        title={`${h.id} · ${h.name}`}
                      >
                        {isSelected && (
                          <span
                            className="absolute h-8 w-8 rounded-full animate-ping"
                            style={{ backgroundColor: dot.ring }}
                          />
                        )}
                        <span
                          className="relative h-6 w-6 rounded-full border-2 flex items-center justify-center text-[10px] font-bold shadow"
                          style={{ backgroundColor: dot.bg, borderColor: "#0f172a", color: "#0f172a" }}
                        >
                          {h.id.split("-")[1]}
                        </span>
                      </button>
                    );
                  })}
                </div>

                {/* zoom controls */}
                <div className="absolute top-3 left-3 flex flex-col rounded-md overflow-hidden border border-slate-800">
                  <button
                    onClick={() => setZoom((z) => Math.min(1.6, +(z + 0.2).toFixed(2)))}
                    className="bg-slate-950/90 hover:bg-slate-800 text-slate-300 p-1.5"
                  >
                    <Plus size={14} />
                  </button>
                  <button
                    onClick={() => setZoom((z) => Math.max(1, +(z - 0.2).toFixed(2)))}
                    className="bg-slate-950/90 hover:bg-slate-800 text-slate-300 p-1.5 border-t border-slate-800"
                  >
                    <Minus size={14} />
                  </button>
                </div>

                {/* popup */}
                {selected && (
                  <div className="absolute bottom-3 left-3 max-w-xs bg-white text-slate-800 rounded-md shadow-xl p-3 text-xs">
                    <p className="font-semibold text-slate-900">
                      {selected.id} · {selected.name}
                    </p>
                    <p className="text-slate-500 mb-1">{selected.area}</p>
                    <p>
                      Risk:{" "}
                      <span
                        className="font-semibold"
                        style={{ color: BAND_DOT[selected.band].bg }}
                      >
                        {selected.band.toUpperCase()} ({selected.score})
                      </span>
                    </p>
                    <p>Peak: {selected.peak}</p>
                    <p>Violation: {selected.dominantViolation}</p>
                    <p>Avg blocking: {selected.avgBlockingMinutes} min</p>
                  </div>
                )}

                <div className="absolute bottom-2 right-3 text-[10px] text-slate-500/70">
                  Stylized map for illustration
                </div>
              </div>
            </div>

            {/* Explain panel */}
            <div className="lg:w-96 bg-slate-900/60 border border-slate-800 rounded-xl p-4 flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <Eyebrow>EXPLAIN</Eyebrow>
              </div>
              <div>
                <h3 className="text-sm font-semibold text-white">Why this risk?</h3>
                <p className="text-xs text-slate-500">Model feature breakdown</p>
              </div>

              <div className="flex items-start justify-between border-b border-slate-800 pb-3">
                <div>
                  <p className="text-[10px] font-mono text-slate-500">{selected.id}</p>
                  <p className="text-sm font-medium text-white">{selected.name}</p>
                  <p className="text-xs text-slate-500">{selected.area}</p>
                </div>
                <span
                  className={`text-xs font-mono px-2 py-1 rounded border whitespace-nowrap ${BAND_BADGE[selected.band]}`}
                >
                  {selected.band.slice(0, 3).toUpperCase()} · {selected.score}
                </span>
              </div>

              <MetricBar
                label="VIOLATION FREQUENCY"
                value={selected.violationFrequency}
                sub={`${selected.historicalRecords} historical records`}
              />
              <MetricBar
                label="JUNCTION PROXIMITY"
                value={selected.junctionProximity}
                sub={junctionSub(selected.junctionProximity)}
              />
              <MetricBar
                label="AVG. BLOCKING DURATION"
                value={selected.avgBlocking}
                sub={`${selected.avgBlockingMinutes} min average`}
              />

              <div>
                <p className="text-[10px] font-mono text-slate-500 tracking-wide mb-1.5">
                  VEHICLE MIX
                </p>
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
            </div>
          </div>
        )}

        {/* ---------------------------------------------------------------- */}
        {/* VIEW 02 — Smart Patrol Dispatch                                 */}
        {/* ---------------------------------------------------------------- */}
        {activeView === "dispatch" && (
          <div className="flex flex-col gap-4">
            <div>
              <Eyebrow>VIEW 02</Eyebrow>
              <h2 className="text-sm font-semibold text-white mt-1.5">Smart Patrol Dispatch</h2>
              <p className="text-xs text-slate-500">
                AI predictions converted into concrete enforcement instructions
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4 flex flex-col">
                <p className="text-xs font-mono text-red-400 flex items-center gap-1 mb-3">
                  <AlertTriangle size={12} /> HIGH RISK
                </p>
                <p className="text-xs text-slate-500 italic mt-auto">
                  No clusters in this band for the selected window.
                </p>
              </div>

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
                        {isMonitor ? (
                          <AlertTriangle size={12} className="text-amber-400" />
                        ) : (
                          <CheckCircle2 size={12} className="text-emerald-400" />
                        )}
                        {isMonitor ? "MONITOR" : "ROUTINE"}: {h.area.toUpperCase()}
                      </span>
                      <span
                        className={`text-xs font-mono px-2 py-0.5 rounded border whitespace-nowrap ${
                          isMonitor ? BAND_BADGE.medium : BAND_BADGE.low
                        }`}
                      >
                        score {h.score}
                      </span>
                    </div>

                    <div>
                      <p className="text-[10px] font-mono text-slate-500 tracking-wide">
                        TARGET ZONE
                      </p>
                      <p className="text-sm font-medium text-white">
                        {h.name} <span className="text-slate-500 text-xs">({h.cluster})</span>
                      </p>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <StatCard label="PEAK WINDOW" value={h.peak} />
                      <StatCard label="DAY" value={h.day} />
                      <StatCard label="DOMINANT" value={h.dominantVehicle} />
                      <StatCard label="VIOLATION" value={h.dominantViolation} />
                    </div>

                    <div>
                      <p className="text-[10px] font-mono text-slate-500 tracking-wide flex items-center gap-1">
                        <Info size={10} /> RECOMMENDED ACTION
                      </p>
                      <p className="text-xs text-slate-400 mt-1">{h.dispatch.action}</p>
                    </div>

                    {(h.dispatch.patrol || h.dispatch.deployBy) && (
                      <div className="flex items-center gap-2 flex-wrap">
                        {h.dispatch.patrol && (
                          <span className="text-xs font-mono px-2 py-1 rounded-md bg-slate-800 text-slate-300">
                            × {h.dispatch.patrol} Patrol
                          </span>
                        )}
                        {h.dispatch.deployBy && (
                          <span className="text-xs font-mono px-2 py-1 rounded-md bg-slate-800 text-slate-300">
                            Deploy by {h.dispatch.deployBy}
                          </span>
                        )}
                      </div>
                    )}

                    <button
                      onClick={() => focusOnMap(h.id)}
                      className="mt-auto text-xs font-mono text-cyan-300 hover:text-cyan-200 flex items-center gap-1 self-start"
                    >
                      Focus on map <ChevronRight size={12} />
                    </button>
                  </div>
                );
              })}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Ranking table */}
              <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4 overflow-x-auto">
                <div className="flex items-center justify-between mb-3 gap-3">
                  <div>
                    <Eyebrow>INTEL</Eyebrow>
                    <h3 className="text-sm font-semibold text-white mt-1.5">Hotspot Ranking</h3>
                  </div>
                  <p className="text-xs text-slate-500 whitespace-nowrap">
                    {visibleHotspots.length} clusters · ranked for {dateInfo.weekdayShort}{" "}
                    {dateInfo.day} {dateInfo.month} @ {pad2(hourOfDay)}:00
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
                        className={`cursor-pointer border-b border-slate-900 hover:bg-slate-800/50 ${
                          selectedId === h.id ? "bg-slate-800/70" : ""
                        }`}
                      >
                        <td className="py-2 pr-2 text-slate-500 font-mono">{pad2(i + 1)}</td>
                        <td className="py-2 pr-2">
                          <p className="text-slate-200">{h.name}</p>
                          <p className="text-slate-500 text-[10px]">{h.area}</p>
                        </td>
                        <td className="py-2 pr-2 text-slate-400 font-mono">{h.id}</td>
                        <td className="py-2 pr-2">
                          <span
                            className={`px-1.5 py-0.5 rounded text-[10px] font-mono border whitespace-nowrap ${BAND_BADGE[h.band]}`}
                          >
                            {h.band.slice(0, 3).toUpperCase()} {h.score}
                          </span>
                        </td>
                        <td className="py-2 pr-2 text-slate-400 font-mono whitespace-nowrap">
                          {h.peak}
                        </td>
                        <td className="py-2 pr-2 text-slate-400">{h.dominantViolation}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Risk curve */}
              <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4">
                <div className="flex items-center justify-between mb-2 gap-3">
                  <div>
                    <Eyebrow>CURVE</Eyebrow>
                    <h3 className="text-sm font-semibold text-white mt-1.5">
                      Time-of-Day Risk
                    </h3>
                  </div>
                  <p className="text-xs text-slate-500 font-mono whitespace-nowrap">
                    {selected.id} · {selected.name}
                  </p>
                </div>
                <div style={{ height: 220 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={curveData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <CartesianGrid stroke="#1e293b" vertical={false} />
                      <XAxis
                        dataKey="hour"
                        stroke="#475569"
                        tick={{ fontSize: 10, fill: "#64748b" }}
                        ticks={[0, 3, 6, 9, 12, 15, 18, 21]}
                      />
                      <YAxis
                        stroke="#475569"
                        tick={{ fontSize: 10, fill: "#64748b" }}
                        domain={[0, 100]}
                        ticks={[0, 25, 50, 75, 100]}
                      />
                      <ReferenceLine y={40} stroke="#f87171" strokeDasharray="4 4" strokeOpacity={0.6} />
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