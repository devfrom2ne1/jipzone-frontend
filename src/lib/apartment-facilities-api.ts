import { queryOptions } from "@tanstack/react-query";
import type { FacilityKey } from "@/lib/apartments-data";

export const DEFAULT_FACILITIES: FacilityKey[] = ["subway", "daiso", "oliveyoung", "mart"];

export type ApartmentFacilitiesRequest = {
  apartmentName: string;
  address: string;
  latitude: string;
  longitude: string;
  facilities: FacilityKey[];
};

export type ApartmentFacility = {
  category: FacilityKey;
  name: string;
  walkMinutes: number;
};

export type ApartmentFacilitiesResponse = {
  apartmentName: string;
  address: string;
  walkingSummary: string;
  score: number;
  facilities: ApartmentFacility[];
};

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL ?? "").replace(/\/$/, "");

export async function fetchApartmentFacilities(
  request: ApartmentFacilitiesRequest,
  signal?: AbortSignal,
): Promise<ApartmentFacilitiesResponse> {
  const params = new URLSearchParams({
    apartmentName: request.apartmentName,
    address: request.address,
    lat: request.latitude,
    lng: request.longitude,
    facilities: request.facilities.join(","),
  });

  const response = await fetch(`${API_BASE_URL}/api/apartment/facilities?${params}`, { signal });

  if (!response.ok) {
    let message = "주변 시설 정보를 불러오지 못했어요.";
    try {
      const body = (await response.json()) as { message?: string };
      if (body.message) message = body.message;
    } catch {
      // The backend may return an empty or non-JSON error response.
    }
    throw new Error(message);
  }

  return (await response.json()) as ApartmentFacilitiesResponse;
}

export function apartmentFacilitiesQueryOptions(request: ApartmentFacilitiesRequest) {
  return queryOptions({
    queryKey: [
      "apartment-facilities",
      request.apartmentName,
      request.address,
      request.latitude,
      request.longitude,
      request.facilities.join(","),
    ],
    queryFn: ({ signal }) => fetchApartmentFacilities(request, signal),
    staleTime: 5 * 60 * 1000,
    retry: 1,
  });
}
