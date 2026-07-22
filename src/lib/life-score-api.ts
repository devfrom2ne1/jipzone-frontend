import { queryOptions } from "@tanstack/react-query";

export const DEFAULT_LIFE_SCORE_RADIUS_METER = 1000;

export type LifeScoreCategoryKey = "mart" | "daiso" | "oliveYoung";

export type LifeScoreStore = {
  name: string;
  grade: string;
  baseScore: number;
  distanceMeter: number;
  distanceFactor: number;
  calculatedScore: number;
  isRepresentative: boolean;
  address: string;
  latitude: number;
  longitude: number;
};

export type LifeScoreCategoryDetail = {
  categoryScore: number;
  maxScore: number;
  evaluationSummary: string;
  stores: LifeScoreStore[];
};

export type LifeScoreData = {
  totalScore: number;
  summary: {
    martScore: number;
    daisoScore: number;
    oliveYoungScore: number;
  };
  categories: Record<LifeScoreCategoryKey, LifeScoreCategoryDetail>;
};

export type LifeScoreResponse = {
  status: number;
  message: string;
  data: LifeScoreData;
};

export type LifeScoreRequest = {
  lat: number;
  lng: number;
  radiusMeter?: number;
};

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL ?? "").replace(/\/$/, "");

export async function fetchLifeScore(
  request: LifeScoreRequest,
  signal?: AbortSignal,
): Promise<LifeScoreData> {
  const params = new URLSearchParams({
    lat: String(request.lat),
    lng: String(request.lng),
    radiusMeter: String(request.radiusMeter ?? DEFAULT_LIFE_SCORE_RADIUS_METER),
  });
  const response = await fetch(`${API_BASE_URL}/api/life-score?${params}`, { signal });

  if (!response.ok) {
    let message = "주거 편의성 점수를 불러오지 못했어요.";
    try {
      const body = (await response.json()) as { message?: string };
      if (body.message) message = body.message;
    } catch {
      // The backend may return an empty or non-JSON error response.
    }
    throw new Error(message);
  }

  const result = (await response.json()) as LifeScoreResponse;
  if (!result.data) throw new Error(result.message || "주거 편의성 데이터가 없어요.");
  return result.data;
}

export function lifeScoreQueryOptions(request: LifeScoreRequest) {
  const radiusMeter = request.radiusMeter ?? DEFAULT_LIFE_SCORE_RADIUS_METER;
  return queryOptions({
    queryKey: ["life-score", request.lat, request.lng, radiusMeter],
    queryFn: ({ signal }) => fetchLifeScore({ ...request, radiusMeter }, signal),
    staleTime: 5 * 60 * 1000,
    retry: 1,
  });
}
