import { useEffect, useState } from "react";

const CACHE_KEY = "markups:github-stars:v1";
const CACHE_MAX_AGE = 6 * 60 * 60 * 1000;

export type StarState = {
  status: "loading" | "loaded" | "unavailable";
  count: number | null;
};

type CachedStars = { count: number; savedAt: number };

export function useGithubStars(): StarState {
  const [state, setState] = useState<StarState>({ status: "loading", count: null });

  useEffect(() => {
    const controller = new AbortController();

    try {
      const cached = sessionStorage.getItem(CACHE_KEY);
      if (cached) {
        const parsed = JSON.parse(cached) as CachedStars;
        if (
          typeof parsed.count === "number" &&
          Number.isFinite(parsed.count) &&
          Date.now() - parsed.savedAt < CACHE_MAX_AGE
        ) {
          setState({ status: "loaded", count: parsed.count });
          return () => controller.abort();
        }
      }
    } catch {
      // Storage can be unavailable; the network request remains the source of truth.
    }

    fetch("https://api.github.com/repos/Nir-Bhay/markups", {
      headers: { Accept: "application/vnd.github+json" },
      signal: controller.signal,
    })
      .then((response) => {
        if (!response.ok) throw new Error("Repository details unavailable");
        return response.json() as Promise<{ stargazers_count?: unknown }>;
      })
      .then((repository) => {
        if (typeof repository.stargazers_count !== "number") {
          throw new Error("Star count unavailable");
        }
        const count = repository.stargazers_count;
        setState({ status: "loaded", count });
        try {
          sessionStorage.setItem(CACHE_KEY, JSON.stringify({ count, savedAt: Date.now() }));
        } catch {
          // A live value is still useful when storage is blocked.
        }
      })
      .catch((error: unknown) => {
        if (error instanceof DOMException && error.name === "AbortError") return;
        setState({ status: "unavailable", count: null });
      });

    return () => controller.abort();
  }, []);

  return state;
}
