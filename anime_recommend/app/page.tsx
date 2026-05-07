"use client";

import { useState, useEffect } from "react";
import { getRecommendations } from "@/lib/api";
import type { Anime } from "@/lib/types";

const GENRE_CHIPS = [
  "Action", "Romance", "Comedy", "Fantasy", "Sci-Fi",
  "Horror", "Sports", "Mystery", "Mecha", "Slice of Life",
  "Psychological", "Historical",
];

const SURPRISE_POOL = [
  "Action", "Romance", "Fantasy", "Sci-Fi", "Comedy", "Mystery",
  "Horror", "Mecha", "Sports", "Psychological", "Historical", "Music",
  "School", "Supernatural", "Adventure", "Drama",
];

const TYPE_FILTERS = ["All", "TV", "Movie", "OVA", "Special"];

const SORT_OPTIONS = [
  { value: "best_match", label: "Best Match" },
  { value: "highest_rated", label: "Highest Rated" },
  { value: "most_popular", label: "Most Popular" },
];

// ── SVG logo mark ─────────────────────────────────────────────────────────────
function LogoMark({ size = 52 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 52 52" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="26" cy="26" r="25" stroke="#6366F1" strokeWidth="1.5" opacity="0.5" />
      <circle cx="26" cy="26" r="19" fill="url(#logoGrad)" />
      <polygon points="21,17 21,35 37,26" fill="white" opacity="0.92" />
      <defs>
        <radialGradient id="logoGrad" cx="38%" cy="38%">
          <stop offset="0%" stopColor="#818CF8" />
          <stop offset="100%" stopColor="#4338CA" />
        </radialGradient>
      </defs>
    </svg>
  );
}

// ── Similarity bar ─────────────────────────────────────────────────────────────
function MatchBar({ score }: { score: number }) {
  const pct = Math.max(Math.round(score * 100), 4);
  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.68rem", color: "#475569", marginBottom: 3 }}>
        <span>Match</span>
        <span>{pct}%</span>
      </div>
      <div style={{ background: "rgba(255,255,255,0.07)", borderRadius: 999, height: 4 }}>
        <div style={{
          width: `${pct}%`, height: "100%", borderRadius: 999,
          background: "linear-gradient(90deg, #6366F1, #06B6D4)",
        }} />
      </div>
    </div>
  );
}

// ── Anime card ─────────────────────────────────────────────────────────────────
function AnimeCard({
  anime,
  isFav,
  isExpanded,
  onToggleFav,
  onToggleExpand,
}: {
  anime: Anime;
  isFav: boolean;
  isExpanded: boolean;
  onToggleFav: () => void;
  onToggleExpand: () => void;
}) {
  const genres = anime.genre.split(",").map(g => g.trim());

  return (
    <div
      className="anime-card"
      onClick={onToggleExpand}
      style={{
        background: "#141824",
        borderRadius: "1rem",
        overflow: "hidden",
        border: isExpanded ? "1.5px solid #6366F1" : "1px solid rgba(255,255,255,0.07)",
        cursor: "pointer",
        boxShadow: isExpanded ? "0 0 28px rgba(99,102,241,0.18)" : "none",
      }}
    >
      {/* Image */}
      <div style={{ position: "relative", height: 220, overflow: "hidden" }}>
        <img
          src={anime.image_url || `https://placehold.co/400x600/141824/6366F1?text=${encodeURIComponent(anime.name.slice(0, 16))}`}
          alt={anime.name}
          style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
          onError={e => {
            (e.target as HTMLImageElement).src =
              `https://placehold.co/400x600/141824/6366F1?text=${encodeURIComponent(anime.name.slice(0, 16))}`;
          }}
        />
        {/* Bottom fade */}
        <div style={{
          position: "absolute", inset: 0,
          background: "linear-gradient(to top, #141824 0%, transparent 55%)",
        }} />

        {/* Rating badge */}
        <div style={{
          position: "absolute", top: 10, right: 10,
          background: "#F59E0B", color: "white",
          borderRadius: 999, padding: "3px 10px",
          fontSize: "0.78rem", fontWeight: 700,
          boxShadow: "0 2px 10px rgba(245,158,11,0.45)",
        }}>
          ★ {anime.rating.toFixed(1)}
        </div>

        {/* Favourite button */}
        <button
          onClick={e => { e.stopPropagation(); onToggleFav(); }}
          title={isFav ? "Remove from list" : "Add to list"}
          style={{
            position: "absolute", top: 10, left: 10,
            background: isFav ? "rgba(245,158,11,0.85)" : "rgba(0,0,0,0.55)",
            border: "none", borderRadius: "50%",
            width: 32, height: 32,
            display: "flex", alignItems: "center", justifyContent: "center",
            cursor: "pointer", fontSize: "0.95rem",
            transition: "transform 0.15s, background 0.15s",
          }}
        >
          {isFav ? "♥" : "♡"}
        </button>

        {/* Type badge */}
        <div style={{
          position: "absolute", bottom: 10, left: 10,
          background: "rgba(99,102,241,0.8)", color: "white",
          borderRadius: 4, padding: "2px 8px",
          fontSize: "0.68rem", fontWeight: 600, letterSpacing: "0.07em",
        }}>
          {anime.type}
        </div>
      </div>

      {/* Body */}
      <div style={{ padding: "0.9rem 1rem 1rem" }}>
        <h3 style={{
          color: "#F1F5F9", fontWeight: 700, fontSize: "0.97rem",
          marginBottom: "0.45rem", lineHeight: 1.35,
          display: "-webkit-box", WebkitLineClamp: 2,
          WebkitBoxOrient: "vertical" as const, overflow: "hidden",
        }}>
          {anime.name}
        </h3>

        {/* Genre chips */}
        <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginBottom: "0.55rem" }}>
          {genres.slice(0, 3).map((g, i) => (
            <span key={i} style={{
              background: "rgba(6,182,212,0.11)",
              border: "1px solid rgba(6,182,212,0.22)",
              color: "#67E8F9", borderRadius: 4,
              padding: "1px 7px", fontSize: "0.66rem", fontWeight: 500,
            }}>
              {g}
            </span>
          ))}
          {genres.length > 3 && (
            <span style={{ color: "#475569", fontSize: "0.66rem", padding: "1px 0" }}>
              +{genres.length - 3}
            </span>
          )}
        </div>

        {/* Stats */}
        <div style={{ display: "flex", gap: 10, fontSize: "0.76rem", color: "#64748B", marginBottom: "0.6rem" }}>
          <span>{anime.episodes > 0 ? `${anime.episodes} eps` : "Ongoing"}</span>
          <span>·</span>
          <span>{(anime.members / 1000).toFixed(0)}K members</span>
        </div>

        <MatchBar score={anime.similarity_score} />

        {/* Expanded panel */}
        {isExpanded && (
          <div className="animate-fade-in" style={{
            marginTop: "0.75rem", paddingTop: "0.75rem",
            borderTop: "1px solid rgba(255,255,255,0.08)",
            fontSize: "0.79rem", color: "#94A3B8",
            display: "flex", flexDirection: "column", gap: 5,
          }}>
            <div>
              <span style={{ color: "#818CF8", fontWeight: 600 }}>All Genres: </span>
              {anime.genre}
            </div>
            <div>
              <span style={{ color: "#818CF8", fontWeight: 600 }}>Rating: </span>
              {anime.rating.toFixed(2)} / 10
            </div>
            <div>
              <span style={{ color: "#818CF8", fontWeight: 600 }}>Community: </span>
              {anime.members.toLocaleString()} members
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Page ───────────────────────────────────────────────────────────────────────
export default function Home() {
  const [query, setQuery] = useState("");
  const [recommendations, setRecommendations] = useState<Anime[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState("");
  const [currentLimit, setCurrentLimit] = useState(10);

  const [favorites, setFavorites] = useState<number[]>([]);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [selectedType, setSelectedType] = useState("All");
  const [sortBy, setSortBy] = useState("best_match");
  const [myListView, setMyListView] = useState(false);
  const [expandedId, setExpandedId] = useState<number | null>(null);

  useEffect(() => {
    try {
      const f = localStorage.getItem("animatch_favorites");
      if (f) setFavorites(JSON.parse(f));
      const r = localStorage.getItem("animatch_recent");
      if (r) setRecentSearches(JSON.parse(r));
    } catch {}
  }, []);

  const toggleFavorite = (id: number) => {
    const updated = favorites.includes(id)
      ? favorites.filter(x => x !== id)
      : [...favorites, id];
    setFavorites(updated);
    localStorage.setItem("animatch_favorites", JSON.stringify(updated));
  };

  const addRecent = (q: string) => {
    const updated = [q, ...recentSearches.filter(s => s !== q)].slice(0, 5);
    setRecentSearches(updated);
    localStorage.setItem("animatch_recent", JSON.stringify(updated));
  };

  const removeRecent = (q: string) => {
    const updated = recentSearches.filter(s => s !== q);
    setRecentSearches(updated);
    localStorage.setItem("animatch_recent", JSON.stringify(updated));
  };

  const fetchRecommendations = async (searchQuery: string, appendMode = false) => {
    if (!searchQuery.trim()) {
      setError("Please enter an anime name or genre");
      return;
    }

    if (appendMode) {
      setLoadingMore(true);
    } else {
      setLoading(true);
      setError("");
      setRecommendations([]);
      setCurrentLimit(10);
      setMyListView(false);
      setExpandedId(null);
      addRecent(searchQuery.trim());
    }

    try {
      const limitToFetch = appendMode ? currentLimit + 6 : 10;
      const data: Anime[] = await getRecommendations(searchQuery, limitToFetch);
      if (appendMode) setCurrentLimit(limitToFetch);
      setRecommendations(data);

      // Progressive image loading via Jikan
      const withImages: Anime[] = [];
      for (let i = 0; i < data.length; i++) {
        const anime = data[i];
        try {
          if (i > 0) await new Promise(r => setTimeout(r, 500));
          const jRes = await fetch(
            `https://api.jikan.moe/v4/anime?q=${encodeURIComponent(anime.name)}&limit=1`,
            { cache: "no-store" }
          );
          if (jRes.ok) {
            const jData = await jRes.json();
            if (jData.data?.length > 0) {
              withImages.push({
                ...anime,
                image_url:
                  jData.data[0].images.jpg.large_image_url ||
                  jData.data[0].images.jpg.image_url,
              });
            } else {
              withImages.push(anime);
            }
          } else {
            withImages.push(anime);
          }
        } catch {
          withImages.push(anime);
        }
        setRecommendations([...withImages, ...data.slice(i + 1)]);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  const handleSearch = () => fetchRecommendations(query);
  const handleSurpriseMe = () => {
    const pick = SURPRISE_POOL[Math.floor(Math.random() * SURPRISE_POOL.length)];
    setQuery(pick);
    fetchRecommendations(pick);
  };

  // Client-side filter + sort
  const displayed = (() => {
    let list = myListView
      ? recommendations.filter(a => favorites.includes(a.anime_id))
      : recommendations;
    if (selectedType !== "All") list = list.filter(a => a.type === selectedType);
    if (sortBy === "highest_rated") list = [...list].sort((a, b) => b.rating - a.rating);
    else if (sortBy === "most_popular") list = [...list].sort((a, b) => b.members - a.members);
    return list;
  })();

  const hasResults = recommendations.length > 0;

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#0A0F1E", color: "#E2E8F0" }}>

      {/* ── Header banner ────────────────────────────────────────────── */}
      <div style={{ position: "relative", height: 260, overflow: "hidden" }}>
        <div style={{
          position: "absolute", inset: 0,
          background: "linear-gradient(135deg, #0D0D2B 0%, #19103f 30%, #0f1c40 60%, #1a0d38 100%)",
        }} />
        {/* Ambient orbs */}
        <div className="animate-orb" style={{
          position: "absolute", top: 20, left: "22%",
          width: 260, height: 260, borderRadius: "50%", opacity: 0.22,
          background: "radial-gradient(circle, #6366F1, transparent)",
          filter: "blur(50px)",
        }} />
        <div style={{
          position: "absolute", top: 0, right: "28%",
          width: 200, height: 200, borderRadius: "50%", opacity: 0.15,
          background: "radial-gradient(circle, #06B6D4, transparent)",
          filter: "blur(55px)",
        }} />
        <div style={{
          position: "absolute", bottom: 10, left: "50%",
          width: 340, height: 120, borderRadius: "50%", opacity: 0.2,
          background: "radial-gradient(circle, #7C3AED, transparent)",
          filter: "blur(35px)",
          transform: "translateX(-50%)",
        }} />
        {/* Fade out */}
        <div style={{
          position: "absolute", inset: 0,
          background: "linear-gradient(to bottom, transparent 35%, #0A0F1E 100%)",
        }} />
      </div>

      {/* ── Main content ─────────────────────────────────────────────── */}
      <div style={{
        position: "relative",
        display: "flex", flexDirection: "column", alignItems: "center",
        padding: "0 1rem", marginTop: -80,
      }}>

        {/* Logo + wordmark */}
        <div style={{ textAlign: "center", marginBottom: "2rem" }}>
          <div style={{ display: "flex", justifyContent: "center", marginBottom: "0.6rem" }}>
            <LogoMark size={54} />
          </div>
          <h1 className="font-oughter" style={{ fontSize: "4.5rem", lineHeight: 1, margin: 0, letterSpacing: "0.04em" }}>
            <span style={{ color: "#818CF8" }}>ANI</span>
            <span style={{ color: "#06B6D4" }}>MATCH</span>
          </h1>
          <p style={{ color: "#64748B", fontSize: "1rem", marginTop: "0.4rem", letterSpacing: "0.18em" }}>
            SEARCH. MATCH. WATCH.
          </p>
        </div>

        {/* ── Search input ────────────────────────────────────────────── */}
        <div className="search-input-wrapper" style={{
          width: "100%", maxWidth: 680,
          marginBottom: "0.85rem",
          background: "rgba(255,255,255,0.035)",
          border: "1.5px solid rgba(99,102,241,0.35)",
          borderRadius: "0.9rem",
          backdropFilter: "blur(12px)",
          transition: "border-color 0.2s, box-shadow 0.2s",
        }}>
          <input
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={e => e.key === "Enter" && handleSearch()}
            placeholder="Search by anime title, genre, or type…"
            disabled={loading}
            style={{
              width: "100%", background: "transparent", border: "none", outline: "none",
              color: "#E2E8F0", fontSize: "1.05rem", padding: "1rem 1.4rem",
              fontFamily: "inherit",
            }}
          />
        </div>

        {/* Recent searches */}
        {recentSearches.length > 0 && !hasResults && !loading && (
          <div style={{ width: "100%", maxWidth: 680, marginBottom: "0.85rem", display: "flex", flexWrap: "wrap", gap: 6, alignItems: "center" }}>
            <span style={{ color: "#475569", fontSize: "0.75rem", marginRight: 2 }}>Recent:</span>
            {recentSearches.map(s => (
              <div key={s} style={{
                display: "flex", alignItems: "center", gap: 4,
                background: "rgba(99,102,241,0.1)",
                border: "1px solid rgba(99,102,241,0.22)",
                borderRadius: 999, padding: "3px 11px",
                fontSize: "0.79rem", color: "#A5B4FC",
              }}>
                <span style={{ cursor: "pointer" }} onClick={() => { setQuery(s); fetchRecommendations(s); }}>{s}</span>
                <span
                  onClick={() => removeRecent(s)}
                  style={{ cursor: "pointer", color: "#6366F1", fontWeight: 700, lineHeight: 1, marginLeft: 2 }}
                >×</span>
              </div>
            ))}
          </div>
        )}

        {/* Genre chips */}
        <div style={{ width: "100%", maxWidth: 680, marginBottom: "1.5rem", display: "flex", flexWrap: "wrap", gap: 7 }}>
          {GENRE_CHIPS.map(g => (
            <button
              key={g}
              onClick={() => { setQuery(g); fetchRecommendations(g); }}
              style={{
                background: query === g ? "rgba(99,102,241,0.28)" : "rgba(255,255,255,0.045)",
                border: query === g ? "1px solid #6366F1" : "1px solid rgba(255,255,255,0.09)",
                borderRadius: 999, color: query === g ? "#A5B4FC" : "#94A3B8",
                fontSize: "0.78rem", padding: "4px 14px", cursor: "pointer",
                transition: "all 0.15s",
              }}
            >
              {g}
            </button>
          ))}
        </div>

        {/* Action buttons */}
        <div style={{ display: "flex", gap: 10, marginBottom: "2rem", flexWrap: "wrap", justifyContent: "center" }}>
          <button
            onClick={handleSearch}
            disabled={loading}
            style={{
              background: "linear-gradient(135deg, #6366F1, #4338CA)",
              color: "white", border: "none", borderRadius: 999,
              padding: "0.72rem 2.4rem", fontWeight: 700, fontSize: "0.97rem",
              cursor: loading ? "not-allowed" : "pointer",
              opacity: loading ? 0.6 : 1,
              boxShadow: "0 4px 18px rgba(99,102,241,0.38)",
              transition: "opacity 0.2s, transform 0.15s",
              letterSpacing: "0.04em",
            }}
          >
            {loading ? "Searching…" : "Find Anime"}
          </button>
          <button
            onClick={handleSurpriseMe}
            disabled={loading}
            style={{
              background: "transparent",
              color: "#06B6D4", border: "1.5px solid #06B6D4",
              borderRadius: 999, padding: "0.72rem 1.8rem",
              fontWeight: 600, fontSize: "0.97rem",
              cursor: loading ? "not-allowed" : "pointer",
              opacity: loading ? 0.6 : 1,
              transition: "all 0.15s",
            }}
          >
            🎲 Surprise Me
          </button>
        </div>

        {/* Error */}
        {error && (
          <div style={{
            width: "100%", maxWidth: 680, marginBottom: "1.25rem",
            background: "rgba(239,68,68,0.12)", border: "1px solid rgba(239,68,68,0.35)",
            borderRadius: "0.75rem", padding: "0.85rem 1.2rem",
            color: "#FCA5A5", fontSize: "0.9rem",
          }}>
            {error}
          </div>
        )}

        {/* ── Results ──────────────────────────────────────────────────── */}
        {hasResults && (
          <div style={{ width: "100%", maxWidth: 1100, marginBottom: "3rem" }}>

            {/* Controls bar */}
            <div style={{
              display: "flex", flexWrap: "wrap", alignItems: "center",
              justifyContent: "space-between", gap: 10, marginBottom: "1.4rem",
            }}>
              <h2 className="font-oughter" style={{ fontSize: "1.5rem", margin: 0, color: "#E2E8F0" }}>
                Recommended Anime
              </h2>

              <div style={{ display: "flex", flexWrap: "wrap", gap: 7, alignItems: "center" }}>
                {/* My List toggle */}
                {favorites.length > 0 && (
                  <button
                    onClick={() => setMyListView(v => !v)}
                    style={{
                      background: myListView ? "rgba(245,158,11,0.18)" : "rgba(255,255,255,0.05)",
                      border: myListView ? "1px solid #F59E0B" : "1px solid rgba(255,255,255,0.09)",
                      color: myListView ? "#F59E0B" : "#94A3B8",
                      borderRadius: 999, padding: "5px 14px",
                      fontSize: "0.78rem", cursor: "pointer",
                    }}
                  >
                    ♥ My List ({favorites.length})
                  </button>
                )}

                {/* Type filter */}
                {TYPE_FILTERS.map(t => (
                  <button
                    key={t}
                    onClick={() => setSelectedType(t)}
                    style={{
                      background: selectedType === t ? "rgba(99,102,241,0.22)" : "rgba(255,255,255,0.04)",
                      border: selectedType === t ? "1px solid #6366F1" : "1px solid rgba(255,255,255,0.08)",
                      color: selectedType === t ? "#A5B4FC" : "#64748B",
                      borderRadius: 999, padding: "5px 12px",
                      fontSize: "0.76rem", cursor: "pointer",
                    }}
                  >
                    {t}
                  </button>
                ))}

                {/* Sort */}
                <select
                  value={sortBy}
                  onChange={e => setSortBy(e.target.value)}
                  style={{
                    background: "#141824", border: "1px solid rgba(255,255,255,0.1)",
                    color: "#94A3B8", borderRadius: "0.5rem",
                    padding: "5px 10px", fontSize: "0.76rem", cursor: "pointer", outline: "none",
                  }}
                >
                  {SORT_OPTIONS.map(o => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Empty my-list state */}
            {myListView && displayed.length === 0 && (
              <p style={{ color: "#475569", textAlign: "center", padding: "2rem 0" }}>
                No saved anime in the current results. Heart a card to add it to your list.
              </p>
            )}

            {/* Card grid */}
            <div style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
              gap: "1.25rem",
            }}>
              {displayed.map(anime => (
                <AnimeCard
                  key={anime.anime_id}
                  anime={anime}
                  isFav={favorites.includes(anime.anime_id)}
                  isExpanded={expandedId === anime.anime_id}
                  onToggleFav={() => toggleFavorite(anime.anime_id)}
                  onToggleExpand={() => setExpandedId(expandedId === anime.anime_id ? null : anime.anime_id)}
                />
              ))}
            </div>

            {/* Load more */}
            {!loading && !myListView && currentLimit < 50 && (
              <div style={{ display: "flex", justifyContent: "center", marginTop: "2rem" }}>
                <button
                  onClick={() => fetchRecommendations(query || recentSearches[0] || "", true)}
                  disabled={loadingMore}
                  style={{
                    background: "transparent",
                    border: "1.5px solid rgba(99,102,241,0.45)",
                    color: "#A5B4FC", borderRadius: 999,
                    padding: "0.7rem 2.5rem",
                    fontWeight: 600, fontSize: "0.9rem",
                    cursor: loadingMore ? "not-allowed" : "pointer",
                    opacity: loadingMore ? 0.6 : 1,
                    transition: "all 0.2s",
                  }}
                >
                  {loadingMore ? "Loading…" : "Load More"}
                </button>
              </div>
            )}
          </div>
        )}

        {/* Loading spinner */}
        {loading && (
          <div style={{ textAlign: "center", padding: "3.5rem 0" }}>
            <div className="animate-spin-custom" style={{
              width: 46, height: 46, margin: "0 auto",
              border: "3px solid rgba(99,102,241,0.18)",
              borderTopColor: "#6366F1", borderRadius: "50%",
            }} />
            <p style={{ color: "#475569", marginTop: "1rem", fontSize: "0.88rem" }}>
              Searching the catalog…
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
