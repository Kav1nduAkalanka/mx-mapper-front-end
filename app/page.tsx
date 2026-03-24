"use client";

import { useState, useRef, useCallback } from "react";

// ── Types ──────────────────────────────────────────────────────────────────────
interface MatchResult {
  id: string;
  title: string;
  description: string;
  score: number;
  sem_score: number;
  hist_score: number;
  past_activities: string[];
}

// ── Config ─────────────────────────────────────────────────────────────────────
// Replace with your actual Hugging Face Space URL after deployment
const API_BASE = process.env.NEXT_PUBLIC_API_URL || "https://YOUR-HF-USERNAME-mx-mapper-api.hf.space";

// ── Score ring component ───────────────────────────────────────────────────────
function ScoreRing({ score, size = 64 }: { score: number; size?: number }) {
  const radius = (size - 8) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - score * circumference;
  const color = score > 0.75 ? "#7c6af7" : score > 0.5 ? "#4ecdc4" : "#94a3b8";

  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="rotate-[-90deg]">
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="#1e2535" strokeWidth={4} />
        <circle
          cx={size / 2} cy={size / 2} r={radius} fill="none"
          stroke={color} strokeWidth={4}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          style={{ transition: "stroke-dashoffset 1s ease" }}
        />
      </svg>
      <span className="absolute text-sm font-bold font-mono" style={{ color }}>
        {Math.round(score * 100)}%
      </span>
    </div>
  );
}

// ── Progress bar ───────────────────────────────────────────────────────────────
function ProgressBar({ value, color, loading }: { value: number; color: "violet" | "teal"; loading?: boolean }) {
  const bg = color === "violet" ? "#7c6af7" : "#4ecdc4";
  const track = color === "violet" ? "rgba(124,106,247,0.12)" : "rgba(78,205,196,0.12)";
  const shimmerClass = loading ? (color === "violet" ? "shimmer-bar" : "shimmer-bar-teal") : "";

  return (
    <div className="h-1.5 rounded-full w-full overflow-hidden" style={{ background: track }}>
      <div
        className={`h-full rounded-full transition-all duration-1000 ease-out ${shimmerClass}`}
        style={{ width: loading ? "100%" : `${value * 100}%`, background: loading ? undefined : bg }}
      />
    </div>
  );
}

// ── Result Card ────────────────────────────────────────────────────────────────
function ResultCard({ match, index }: { match: MatchResult; index: number }) {
  const [expanded, setExpanded] = useState(false);
  const rankColors = ["#7c6af7", "#4ecdc4", "#94a3b8"];
  const rankColor = rankColors[index] || "#94a3b8";

  return (
    <div
      className="card-enter rounded-2xl border overflow-hidden"
      style={{
        background: "linear-gradient(135deg, #161b27 0%, #131720 100%)",
        borderColor: index === 0 ? "rgba(124,106,247,0.3)" : "#1e2535",
        boxShadow: index === 0 ? "0 0 40px rgba(124,106,247,0.08)" : "none",
      }}
    >
      {/* Card header */}
      <div className="flex items-start gap-4 p-5">
        {/* Rank badge */}
        <div
          className="flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold font-mono"
          style={{ background: `${rankColor}18`, color: rankColor, border: `1px solid ${rankColor}30` }}
        >
          #{index + 1}
        </div>

        {/* Title & ID */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <span
              className="text-xs font-mono font-medium px-2 py-0.5 rounded"
              style={{ background: `${rankColor}15`, color: rankColor }}
            >
              {match.id}
            </span>
          </div>
          <h3
            className="font-display font-bold text-base leading-snug"
            style={{ color: "#e2e8f0", letterSpacing: "-0.01em" }}
          >
            {match.title}
          </h3>
        </div>

        {/* Score ring */}
        <div className="flex-shrink-0">
          <ScoreRing score={match.score} size={60} />
        </div>
      </div>

      {/* Score bars */}
      <div className="px-5 pb-4 space-y-3">
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-500 font-medium">Semantic match</span>
            <span className="text-xs font-mono font-medium text-violet-400">
              {Math.round(match.sem_score * 100)}%
            </span>
          </div>
          <ProgressBar value={match.sem_score} color="violet" />
        </div>

        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-500 font-medium">Historical match</span>
            <span className="text-xs font-mono font-medium" style={{ color: "#4ecdc4" }}>
              {Math.round(match.hist_score * 100)}%
            </span>
          </div>
          <ProgressBar value={match.hist_score} color="teal" />
        </div>
      </div>

      {/* Description toggle */}
      <div className="border-t px-5 py-3" style={{ borderColor: "#1e2535" }}>
        <button
          onClick={() => setExpanded(!expanded)}
          className="flex items-center gap-2 text-xs text-slate-500 hover:text-slate-300 transition-colors w-full"
        >
          <svg
            width="12" height="12" viewBox="0 0 12 12" fill="none"
            className={`transition-transform duration-200 ${expanded ? "rotate-180" : ""}`}
          >
            <path d="M2 4l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          {expanded ? "Hide" : "View"} standard criteria
        </button>

        {expanded && (
          <div className="mt-3 text-xs text-slate-400 leading-relaxed space-y-1">
            {match.description.split("\n").filter(Boolean).map((line, i) => (
              <p key={i}>{line.replace(/^✓/, "").trim()}</p>
            ))}
          </div>
        )}
      </div>

      {/* Past activities */}
      {match.past_activities.length > 0 && (
        <div className="border-t px-5 py-3" style={{ borderColor: "#1e2535" }}>
          <p className="text-xs text-slate-600 mb-2 font-medium">Previously mapped to this standard:</p>
          <div className="flex flex-wrap gap-1.5">
            {match.past_activities.map((act, i) => (
              <span
                key={i}
                className="text-xs px-2 py-1 rounded-md font-medium truncate max-w-[180px]"
                style={{ background: "rgba(78,205,196,0.08)", color: "#4ecdc4", border: "1px solid rgba(78,205,196,0.15)" }}
                title={act}
              >
                {act.length > 32 ? act.slice(0, 32) + "…" : act}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Skeleton card ──────────────────────────────────────────────────────────────
function SkeletonCard() {
  return (
    <div className="rounded-2xl border p-5 space-y-4 animate-pulse" style={{ background: "#161b27", borderColor: "#1e2535" }}>
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg" style={{ background: "#1e2535" }} />
        <div className="flex-1 space-y-2">
          <div className="h-3 rounded w-1/4" style={{ background: "#1e2535" }} />
          <div className="h-4 rounded w-2/3" style={{ background: "#1e2535" }} />
        </div>
        <div className="w-14 h-14 rounded-full" style={{ background: "#1e2535" }} />
      </div>
      <div className="space-y-2">
        <div className="h-1.5 rounded-full w-full" style={{ background: "#1e2535" }} />
        <div className="h-1.5 rounded-full w-full" style={{ background: "#1e2535" }} />
      </div>
    </div>
  );
}

// ── Main page ──────────────────────────────────────────────────────────────────
export default function Home() {
  const [activity, setActivity] = useState("");
  const [results, setResults] = useState<MatchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleMap = useCallback(async () => {
    if (!activity.trim() || loading) return;

    setLoading(true);
    setError(null);
    setHasSearched(true);

    try {
      const res = await fetch(`${API_BASE}/map`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ activity: activity.trim(), top_k: 3 }),
      });

      if (!res.ok) throw new Error(`API error: ${res.status}`);
      const data = await res.json();

      if (data.error) throw new Error(data.error);
      setResults(data.results || []);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message.includes("fetch") ? "Could not reach the API. Make sure the Hugging Face Space is running." : err.message);
      } else {
        setError("An unknown error occurred.");
      }
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, [activity, loading]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleMap();
    }
  };

  const exampleActivities = [
    "We ran LBMs with the team this month",
    "Conducted onboarding sessions for 5 new members",
    "Organized a team building event at the park",
    "Set up personal development plans with all members",
  ];

  return (
    <main className="min-h-screen grid-bg relative" style={{ background: "#0f1117" }}>
      {/* Ambient glow */}
      <div
        className="fixed top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] pointer-events-none"
        style={{ background: "radial-gradient(ellipse at center, rgba(124,106,247,0.08) 0%, transparent 70%)" }}
      />

      <div className="relative z-10 max-w-2xl mx-auto px-4 py-12">
        {/* Header */}
        <div className="mb-10">
          <div className="flex items-center gap-2 mb-3">
            <div
              className="text-xs font-mono font-medium px-2.5 py-1 rounded-full"
              style={{ background: "rgba(124,106,247,0.12)", color: "#7c6af7", border: "1px solid rgba(124,106,247,0.2)" }}
            >
              AIESEC TM Tool
            </div>
            <div
              className="text-xs font-mono font-medium px-2.5 py-1 rounded-full flex items-center gap-1"
              style={{ background: "rgba(78,205,196,0.08)", color: "#4ecdc4", border: "1px solid rgba(78,205,196,0.15)" }}
            >
            </div>
          </div>

          <h1
            className="font-display text-4xl font-extrabold mb-2 leading-tight"
            style={{
              background: "linear-gradient(135deg, #e2e8f0 0%, rgba(124,106,247,0.9) 50%, #4ecdc4 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}
          >
            MX Standards Mapper
          </h1>
          <p className="text-slate-500 text-sm leading-relaxed">
            Describe a member experience activity and the AI will identify the most relevant MX Standards using semantic and historical analysis.
          </p>
        </div>

        {/* Input */}
        <div
          className="rounded-2xl border p-1 mb-4 transition-all duration-300"
          style={{
            background: "#161b27",
            borderColor: activity ? "rgba(124,106,247,0.4)" : "#1e2535",
            boxShadow: activity ? "0 0 0 3px rgba(124,106,247,0.06)" : "none",
          }}
        >
          <textarea
            ref={textareaRef}
            value={activity}
            onChange={(e) => setActivity(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Describe your MX activity... (e.g. We conducted LBMs and set personal development goals with each team member)"
            rows={4}
            className="w-full bg-transparent text-sm text-slate-200 placeholder-slate-600 resize-none p-4 font-body leading-relaxed"
            style={{ fontFamily: "'DM Sans', sans-serif" }}
          />

          <div className="flex items-center justify-between px-4 pb-3">
            <span className="text-xs text-slate-600 font-mono">
              {activity.length > 0 ? `${activity.length} chars` : "Enter to submit · Shift+Enter for newline"}
            </span>
            <button
              onClick={handleMap}
              disabled={!activity.trim() || loading}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed"
              style={{
                background: activity.trim() && !loading
                  ? "linear-gradient(135deg, #7c6af7, #6b58e6)"
                  : "#1e2535",
                color: activity.trim() && !loading ? "#fff" : "#475569",
                boxShadow: activity.trim() && !loading ? "0 4px 14px rgba(124,106,247,0.3)" : "none",
              }}
            >
              {loading ? (
                <>
                  <svg className="animate-spin w-3.5 h-3.5" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Mapping…
                </>
              ) : (
                <>
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                    <path d="M1 7h12M8 3l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  Map to Standards
                </>
              )}
            </button>
          </div>
        </div>

        {/* Example chips */}
        {!hasSearched && (
          <div className="mb-8">
            <p className="text-xs text-slate-600 mb-2 font-medium">Try an example:</p>
            <div className="flex flex-wrap gap-2">
              {exampleActivities.map((ex, i) => (
                <button
                  key={i}
                  onClick={() => { setActivity(ex); textareaRef.current?.focus(); }}
                  className="text-xs px-3 py-1.5 rounded-lg transition-all duration-150 hover:text-slate-300 text-left"
                  style={{
                    background: "#161b27",
                    border: "1px solid #1e2535",
                    color: "#64748b",
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(124,106,247,0.3)";
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLButtonElement).style.borderColor = "#1e2535";
                  }}
                >
                  {ex}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Error */}
        {error && (
          <div
            className="rounded-xl p-4 mb-6 flex items-start gap-3"
            style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)" }}
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="mt-0.5 flex-shrink-0">
              <circle cx="8" cy="8" r="7" stroke="#ef4444" strokeWidth="1.5" />
              <path d="M8 5v3.5M8 11h.01" stroke="#ef4444" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
            <div>
              <p className="text-sm font-medium text-red-400 mb-0.5">Connection error</p>
              <p className="text-xs text-red-400/70">{error}</p>
            </div>
          </div>
        )}

        {/* Results */}
        {loading && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-1 h-4 rounded-full animate-pulse" style={{ background: "#7c6af7" }} />
              <span className="text-xs text-slate-500 font-medium">Analyzing activity…</span>
            </div>
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </div>
        )}

        {!loading && results.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-5">
              <div className="w-1 h-4 rounded-full" style={{ background: "#7c6af7" }} />
              <span className="text-xs text-slate-500 font-medium">
                Top {results.length} matching standards
              </span>
            </div>
            {results.map((match, i) => (
              <ResultCard key={match.id} match={match} index={i} />
            ))}
          </div>
        )}

        {!loading && hasSearched && results.length === 0 && !error && (
          <div className="text-center py-12">
            <div className="text-3xl mb-3">🔍</div>
            <p className="text-slate-500 text-sm">No matches found. Try describing the activity differently.</p>
          </div>
        )}

        {/* Footer */}
        <div className="mt-16 pt-6 border-t text-center" style={{ borderColor: "#1e2535" }}>
          <p className="text-xs text-slate-700">
            AIESEC in CS · MX Standards Mapper 
          </p>
        </div>
      </div>
    </main>
  );
}
