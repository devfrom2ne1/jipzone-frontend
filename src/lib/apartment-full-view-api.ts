import { queryOptions } from "@tanstack/react-query";
import type { FacilityKey } from "@/lib/apartments-data";

export type LatLng = {
  lat: number;
  lng: number;
};

export type RelativePosition = {
  x: number;
  y: number;
};

export type FullViewFacility = {
  category: FacilityKey;
  name: string;
  walkMinutes: number;
  iconUrl: string | null;
};

export type VisualizationMarker = {
  category: FacilityKey;
  name: string;
  walkMinutes: number;
  relativePosition: RelativePosition;
};

export type ApartmentFullViewResponse = {
  apartmentName: string;
  address: string;
  centerLatLng: LatLng;
  livingZoneScore: number;
  summary: string;
  maxWalkMinutesConfig: number;
  facilityList: FullViewFacility[];
  visualizationMarkers: VisualizationMarker[];
};

export type ApartmentSelection = {
  apartmentName: string;
  address: string;
  lat: number;
  lng: number;
};

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL ?? "").replace(/\/$/, "");

export function resolveApiAssetUrl(path: string) {
  if (/^https?:\/\//.test(path)) return path;
  return `${API_BASE_URL}${path.startsWith("/") ? path : `/${path}`}`;
}

export async function getApartmentFullView(
  apartment: ApartmentSelection,
  signal?: AbortSignal,
): Promise<ApartmentFullViewResponse | null> {
  const params = new URLSearchParams({
    apartmentName: apartment.apartmentName,
    address: apartment.address,
    lat: String(apartment.lat),
    lng: String(apartment.lng),
  });
  const response = await fetch(`${API_BASE_URL}/api/apartment/full-view?${params}`, { signal });

  if (response.status === 204) return null;

  if (!response.ok) {
    let message = "아파트 상세 정보를 불러오지 못했어요.";
    try {
      const body = (await response.json()) as { message?: string };
      if (body.message) message = body.message;
    } catch {
      // The backend may return an empty or non-JSON error response.
    }
    throw new Error(message);
  }

  const data = (await response.json()) as ApartmentFullViewResponse | null;
  return data && typeof data === "object" ? data : null;
}

export function apartmentFullViewQueryOptions(apartment: ApartmentSelection) {
  return queryOptions({
    queryKey: [
      "apartment-full-view",
      apartment.apartmentName,
      apartment.address,
      apartment.lat,
      apartment.lng,
    ],
    queryFn: ({ signal }) => getApartmentFullView(apartment, signal),
    staleTime: 5 * 60 * 1000,
    retry: 1,
  });
}
