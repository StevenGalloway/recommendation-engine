import type { Anime } from "./types";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

const DEFAULT_TIMEOUT_MS = 10_000;

async function fetchWithTimeout(
  url: string,
  options: RequestInit = {}
): Promise<Response> {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), DEFAULT_TIMEOUT_MS);
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } finally {
    clearTimeout(id);
  }
}

async function fetchWithRetry(
  url: string,
  options: RequestInit = {},
  retries = 1
): Promise<Response> {
  try {
    return await fetchWithTimeout(url, options);
  } catch (err) {
    // Retry once on network errors (not on abort/timeout — those are intentional)
    if (retries > 0 && !(err instanceof DOMException && err.name === "AbortError")) {
      return fetchWithRetry(url, options, retries - 1);
    }
    throw err;
  }
}

export async function getRecommendations(
  query: string,
  limit: number = 10
): Promise<Anime[]> {
  const response = await fetchWithRetry(`${API_BASE_URL}/v1/recommend`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query, limit }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: "Request failed" }));
    throw new Error(error.detail || "Failed to get recommendations");
  }

  return response.json();
}

export async function getAnimeDetails(animeId: number): Promise<Anime> {
  const response = await fetchWithRetry(`${API_BASE_URL}/v1/anime/${animeId}`);

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: "Request failed" }));
    throw new Error(error.detail || "Failed to get anime details");
  }

  return response.json();
}

export async function getGenres(): Promise<{ genres: string[] }> {
  const response = await fetchWithRetry(`${API_BASE_URL}/v1/genres`);

  if (!response.ok) {
    throw new Error("Failed to get genres");
  }

  return response.json();
}

export async function checkHealth(): Promise<{ status: string; version: string }> {
  const response = await fetchWithTimeout(`${API_BASE_URL}/v1/health`);
  if (!response.ok) throw new Error("Health check failed");
  return response.json();
}
