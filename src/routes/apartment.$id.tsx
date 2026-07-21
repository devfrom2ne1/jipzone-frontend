import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  AlertCircle,
  Bookmark,
  ChevronLeft,
  Loader2,
  Map as MapIcon,
  ShoppingBag,
  Sparkles,
  Store,
  Train,
} from "lucide-react";
import { BottomNav } from "@/components/BottomNav";
import { MobileFrame } from "@/components/MobileFrame";
import {
  apartmentFullViewQueryOptions,
  resolveApiAssetUrl,
  type FullViewFacility,
} from "@/lib/apartment-full-view-api";
import { FACILITIES, type FacilityKey } from "@/lib/apartments-data";

type Search = {
  minutes?: number;
  facilities?: string;
  source?: "home" | "find";
  fromView?: "list" | "map";
  apartmentName?: string;
  address?: string;
  lat?: string;
  lng?: string;
};

export const Route = createFileRoute("/apartment/$id")({
  validateSearch: (search: Record<string, unknown>): Search => ({
    minutes: search.minutes ? Number(search.minutes) : 15,
    facilities:
      typeof search.facilities === "string" ? search.facilities : "subway,daiso,oliveyoung,mart",
    source: search.source === "home" ? "home" : "find",
    fromView: search.fromView === "map" ? "map" : "list",
    apartmentName: typeof search.apartmentName === "string" ? search.apartmentName : undefined,
    address: typeof search.address === "string" ? search.address : undefined,
    lat: typeof search.lat === "string" ? search.lat : undefined,
    lng: typeof search.lng === "string" ? search.lng : undefined,
  }),
  component: Detail,
});

const iconMap: Record<FacilityKey, typeof Train> = {
  subway: Train,
  daiso: ShoppingBag,
  oliveyoung: Sparkles,
  mart: Store,
};

const MARKER_RADIUS_PERCENT = 34;

function FacilityIcon({ facility }: { facility: FullViewFacility }) {
  const [imageFailed, setImageFailed] = useState(false);
  const Icon = iconMap[facility.category];

  if (facility.iconUrl && !imageFailed) {
    return (
      <img
        src={resolveApiAssetUrl(facility.iconUrl)}
        alt=""
        className="h-6 w-6 object-contain"
        onError={() => setImageFailed(true)}
      />
    );
  }

  return <Icon size={20} strokeWidth={1.8} />;
}

function clampRelativePosition(value: number) {
  return Math.max(-1, Math.min(1, value));
}

function Detail() {
  const {
    minutes = 15,
    facilities = "subway,daiso,oliveyoung,mart",
    source = "find",
    fromView = "list",
    apartmentName,
    address,
    lat,
    lng,
  } = Route.useSearch();
  const latitude = Number(lat);
  const longitude = Number(lng);
  const hasSelection = Boolean(
    apartmentName && address && Number.isFinite(latitude) && Number.isFinite(longitude),
  );
  const selectedApartment = {
    apartmentName: apartmentName ?? "",
    address: address ?? "",
    lat: latitude,
    lng: longitude,
  };
  const fullViewQuery = useQuery({
    ...apartmentFullViewQueryOptions(selectedApartment),
    enabled: hasSelection,
  });

  if (!hasSelection) {
    return (
      <MobileFrame>
        <div className="min-h-screen flex flex-col items-center justify-center px-6 text-center">
          <AlertCircle size={30} className="text-muted-foreground" />
          <h1 className="mt-5 text-[20px] font-bold">선택된 아파트 정보가 없어요</h1>
          <p className="mt-2 text-[13px] leading-relaxed text-muted-foreground">
            아파트를 다시 검색하고 목록에서 선택해주세요.
          </p>
          <Link
            to="/"
            className="mt-6 w-full rounded-2xl bg-primary py-4 text-[14px] font-semibold text-center text-primary-foreground"
          >
            검색으로 돌아가기
          </Link>
        </div>
        <BottomNav />
      </MobileFrame>
    );
  }

  if (fullViewQuery.isPending) {
    return (
      <MobileFrame>
        <div className="min-h-screen flex flex-col items-center justify-center px-6 text-center">
          <Loader2 size={28} className="animate-spin text-primary" />
          <h1 className="mt-5 text-[20px] font-bold">아파트 정보를 불러오고 있어요</h1>
          <p className="mt-2 text-[13px] text-muted-foreground">{apartmentName}</p>
        </div>
        <BottomNav />
      </MobileFrame>
    );
  }

  if (fullViewQuery.isError) {
    return (
      <MobileFrame>
        <div className="min-h-screen flex flex-col items-center justify-center px-6 text-center">
          <AlertCircle size={30} className="text-destructive" />
          <h1 className="mt-5 text-[20px] font-bold">상세 정보를 불러오지 못했어요</h1>
          <p className="mt-2 text-[13px] leading-relaxed text-muted-foreground">
            {fullViewQuery.error instanceof Error
              ? fullViewQuery.error.message
              : "잠시 후 다시 시도해주세요."}
          </p>
          <button
            onClick={() => fullViewQuery.refetch()}
            className="mt-6 w-full rounded-2xl bg-primary py-4 text-[14px] font-semibold text-primary-foreground"
          >
            다시 시도
          </button>
          <Link to="/" className="mt-3 text-[13px] text-muted-foreground">
            검색으로 돌아가기
          </Link>
        </div>
        <BottomNav />
      </MobileFrame>
    );
  }

  const fullView = fullViewQuery.data;
  if (!fullView) {
    return (
      <MobileFrame>
        <div className="min-h-screen flex flex-col items-center justify-center px-6 text-center">
          <AlertCircle size={30} className="text-muted-foreground" />
          <h1 className="mt-5 text-[20px] font-bold">상세 정보가 없어요</h1>
          <p className="mt-2 text-[13px] text-muted-foreground">
            해당 아파트의 상세 데이터가 아직 준비되지 않았습니다.
          </p>
          <Link
            to="/"
            className="mt-6 w-full rounded-2xl bg-primary py-4 text-[14px] font-semibold text-center text-primary-foreground"
          >
            검색으로 돌아가기
          </Link>
        </div>
        <BottomNav />
      </MobileFrame>
    );
  }

  return (
    <MobileFrame>
      <div className="sticky top-0 z-20 bg-background/95 backdrop-blur">
        <div className="px-4 pt-12 pb-3 flex items-center">
          {source === "home" ? (
            <Link to="/" className="w-9 h-9 -ml-2 flex items-center justify-center">
              <ChevronLeft size={22} />
            </Link>
          ) : (
            <Link
              to="/results"
              search={{ minutes, facilities, view: fromView }}
              className="w-9 h-9 -ml-2 flex items-center justify-center"
            >
              <ChevronLeft size={22} />
            </Link>
          )}
        </div>
      </div>

      <div className="px-5 pb-48">
        <div className="text-[22px] font-bold tracking-tight">{fullView.apartmentName}</div>
        <div className="text-[13px] text-muted-foreground mt-1">{fullView.address}</div>

        <div className="mt-6 rounded-3xl bg-accent px-5 py-5 flex items-center gap-4">
          <div className="flex-1 min-w-0">
            <div className="text-[11px] font-semibold text-accent-foreground/80">생활권 요약</div>
            <div className="mt-1 text-[15px] font-bold text-accent-foreground leading-snug">
              {fullView.summary}
            </div>
          </div>
          <div className="shrink-0 text-right">
            <div className="text-[10px] text-accent-foreground/70">생활권 점수</div>
            <div className="text-[28px] font-bold leading-none text-accent-foreground">
              {fullView.livingZoneScore}
              <span className="text-[13px] font-semibold ml-0.5">점</span>
            </div>
          </div>
        </div>

        <h2 className="mt-8 text-[18px] font-bold tracking-tight">이 집에서 걸어서</h2>
        <div className="mt-4 space-y-2.5">
          {fullView.facilityList.map((facility) => {
            const label =
              FACILITIES.find((item) => item.key === facility.category)?.label ?? facility.category;
            return (
              <div
                key={`${facility.category}-${facility.name}`}
                className="bg-card border border-border rounded-3xl px-5 py-4 flex items-center gap-4"
              >
                <div className="w-11 h-11 rounded-2xl bg-muted flex items-center justify-center shrink-0">
                  <FacilityIcon facility={facility} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[11px] text-muted-foreground">{label}</div>
                  <div className="text-[14px] font-semibold truncate">{facility.name}</div>
                </div>
                <div className="flex items-baseline gap-1 shrink-0">
                  <span className="text-[11px] text-muted-foreground">걸어서</span>
                  <span className="text-[34px] font-bold leading-none tracking-tight">
                    {facility.walkMinutes}
                  </span>
                  <span className="text-[13px] font-semibold text-muted-foreground">분</span>
                </div>
              </div>
            );
          })}
          {fullView.facilityList.length === 0 && (
            <div className="rounded-3xl border border-dashed border-border px-5 py-8 text-center text-[13px] text-muted-foreground">
              표시할 주변 시설이 없어요.
            </div>
          )}
        </div>

        <div className="mt-8">
          <h3 className="text-[15px] font-bold">생활권 한눈에 보기</h3>
          <p className="text-[12px] text-muted-foreground mt-1">
            가장 바깥 원은 도보 {fullView.maxWalkMinutesConfig}분 기준이에요.
          </p>

          <div className="mt-4 relative aspect-square rounded-3xl border border-border bg-muted/50 overflow-hidden">
            <div
              className="absolute inset-0 opacity-40"
              style={{
                backgroundImage:
                  "linear-gradient(var(--color-border) 1px, transparent 1px), linear-gradient(90deg, var(--color-border) 1px, transparent 1px)",
                backgroundSize: "32px 32px",
              }}
            />
            {[70, 46, 23].map((size, index) => (
              <div
                key={size}
                className={
                  "absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 aspect-square rounded-full border " +
                  (index === 0 ? "bg-primary/10 border-primary/35" : "border-primary/20")
                }
                style={{ width: `${size}%` }}
              />
            ))}
            <div className="absolute left-1/2 top-[13%] -translate-x-1/2 rounded-full bg-card/90 border border-border px-2 py-0.5 text-[9px] font-semibold text-muted-foreground">
              {fullView.maxWalkMinutesConfig}분
            </div>
            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center">
              <div className="w-4 h-4 rounded-full bg-primary ring-4 ring-primary/25" />
              <div className="mt-1.5 text-[10px] font-bold bg-card px-2 py-0.5 rounded-full border border-border whitespace-nowrap">
                {fullView.apartmentName}
              </div>
            </div>
            {fullView.visualizationMarkers.map((marker) => {
              const left =
                50 + clampRelativePosition(marker.relativePosition.x) * MARKER_RADIUS_PERCENT;
              const top =
                50 - clampRelativePosition(marker.relativePosition.y) * MARKER_RADIUS_PERCENT;
              return (
                <div
                  key={`${marker.category}-${marker.name}`}
                  className="absolute flex flex-col items-center -translate-x-1/2 -translate-y-1/2"
                  style={{ left: `${left}%`, top: `${top}%` }}
                >
                  <div className="w-3 h-3 rounded-full bg-foreground" />
                  <div className="mt-1 text-[10px] font-medium bg-card/90 px-1.5 py-0.5 rounded-full border border-border whitespace-nowrap">
                    {marker.name} {marker.walkMinutes}분
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="fixed bottom-20 left-1/2 -translate-x-1/2 w-full max-w-[430px] bg-background/95 backdrop-blur border-t border-border px-5 pt-3 pb-3 z-20">
        <div className="flex gap-2">
          <button className="w-14 h-14 rounded-2xl border border-border flex items-center justify-center">
            <Bookmark size={20} strokeWidth={1.8} />
          </button>
          <Link
            to="/map"
            search={{ minutes, facilities, source, fromView }}
            className="flex-1 h-14 rounded-2xl bg-primary text-primary-foreground font-semibold text-[15px] flex items-center justify-center gap-2"
          >
            <MapIcon size={18} strokeWidth={2} />
            지도에서 보기
          </Link>
        </div>
      </div>

      <BottomNav />
    </MobileFrame>
  );
}
