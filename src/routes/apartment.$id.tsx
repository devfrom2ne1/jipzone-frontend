import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  AlertCircle,
  ChevronLeft,
  Loader2,
  MapPin,
  ShoppingBag,
  Sparkles,
  Store,
} from "lucide-react";
import { BottomNav } from "@/components/BottomNav";
import { MobileFrame } from "@/components/MobileFrame";
import {
  DEFAULT_LIFE_SCORE_RADIUS_METER,
  lifeScoreQueryOptions,
  type LifeScoreCategoryDetail,
  type LifeScoreCategoryKey,
  type LifeScoreStore,
} from "@/lib/life-score-api";

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

const CATEGORY_CONFIG: {
  key: LifeScoreCategoryKey;
  label: string;
  Icon: typeof Store;
}[] = [
  { key: "mart", label: "마트", Icon: Store },
  { key: "daiso", label: "다이소", Icon: ShoppingBag },
  { key: "oliveYoung", label: "올리브영", Icon: Sparkles },
];

function formatScore(score: number) {
  return Number.isInteger(score) ? String(score) : score.toFixed(1);
}

function getDistanceTone(distanceMeter: number) {
  if (distanceMeter <= 300) {
    return {
      dot: "bg-primary ring-primary/25",
      badge: "bg-accent text-accent-foreground",
      border: "border-primary/35",
    };
  }
  if (distanceMeter <= 500) {
    return {
      dot: "bg-amber-400 ring-amber-400/25",
      badge: "bg-amber-100 text-amber-800",
      border: "border-amber-300",
    };
  }
  if (distanceMeter <= 1000) {
    return {
      dot: "bg-red-500 ring-red-500/20",
      badge: "bg-red-100 text-red-700",
      border: "border-red-300",
    };
  }
  return {
    dot: "bg-gray-400 ring-gray-400/20",
    badge: "bg-gray-100 text-gray-600",
    border: "border-gray-300",
  };
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
  const scoreQuery = useQuery({
    ...lifeScoreQueryOptions({
      lat: latitude,
      lng: longitude,
      radiusMeter: DEFAULT_LIFE_SCORE_RADIUS_METER,
    }),
    enabled: hasSelection,
  });

  if (!hasSelection) {
    return <SelectionMissing />;
  }

  if (scoreQuery.isPending) {
    return (
      <MobileFrame>
        <div className="min-h-screen flex flex-col items-center justify-center px-6 text-center">
          <Loader2 size={28} className="animate-spin text-primary" />
          <h1 className="mt-5 text-[20px] font-bold">주거 편의성을 분석하고 있어요</h1>
          <p className="mt-2 text-[13px] text-muted-foreground">{apartmentName}</p>
        </div>
        <BottomNav />
      </MobileFrame>
    );
  }

  if (scoreQuery.isError) {
    return (
      <MobileFrame>
        <div className="min-h-screen flex flex-col items-center justify-center px-6 text-center">
          <AlertCircle size={30} className="text-destructive" />
          <h1 className="mt-5 text-[20px] font-bold">편의성 점수를 불러오지 못했어요</h1>
          <p className="mt-2 text-[13px] leading-relaxed text-muted-foreground">
            {scoreQuery.error instanceof Error
              ? scoreQuery.error.message
              : "잠시 후 다시 시도해주세요."}
          </p>
          <button
            onClick={() => scoreQuery.refetch()}
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

  const score = scoreQuery.data;
  const allStores = CATEGORY_CONFIG.flatMap(({ key }) =>
    score.categories[key].stores.map((store) => ({ key, store })),
  );
  const summaryScores: Record<LifeScoreCategoryKey, number> = {
    mart: score.summary.martScore,
    daiso: score.summary.daisoScore,
    oliveYoung: score.summary.oliveYoungScore,
  };

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

      <main className="px-5 pb-28">
        <h1 className="text-[22px] font-bold tracking-tight">{apartmentName}</h1>
        <p className="mt-1 text-[13px] text-muted-foreground">{address}</p>

        <section className="mt-6 rounded-3xl bg-accent px-5 py-5 flex items-center gap-4">
          <div className="flex-1 min-w-0">
            <div className="text-[11px] font-semibold text-accent-foreground/80">
              반경 {DEFAULT_LIFE_SCORE_RADIUS_METER.toLocaleString()}m 분석
            </div>
            <div className="mt-1 text-[17px] font-bold text-accent-foreground leading-snug">
              주거 편의성 총점
            </div>
            <p className="mt-1 text-[11px] text-accent-foreground/70">
              마트·다이소·올리브영 접근성을 반영했어요.
            </p>
          </div>
          <div className="shrink-0 text-right">
            <div className="text-[34px] font-bold leading-none text-accent-foreground">
              {formatScore(score.totalScore)}
              <span className="text-[13px] font-semibold ml-0.5">점</span>
            </div>
          </div>
        </section>

        <section className="mt-8">
          <h2 className="text-[18px] font-bold tracking-tight">카테고리별 점수</h2>
          <div className="mt-4 grid grid-cols-3 gap-2">
            {CATEGORY_CONFIG.map(({ key, label, Icon }) => {
              const category = score.categories[key];
              return (
                <div key={key} className="rounded-2xl border border-border bg-card px-3 py-4">
                  <Icon size={17} className="text-primary" strokeWidth={1.8} />
                  <div className="mt-2 text-[11px] text-muted-foreground">{label}</div>
                  <div className="mt-0.5 flex items-baseline gap-0.5">
                    <span className="text-[22px] font-bold tracking-tight">
                      {formatScore(summaryScores[key])}
                    </span>
                    <span className="text-[10px] text-muted-foreground">
                      / {formatScore(category.maxScore)}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        <LifeScoreMap
          apartmentName={apartmentName}
          centerLat={latitude}
          centerLng={longitude}
          stores={allStores}
        />

        <section className="mt-8 space-y-5">
          <h2 className="text-[18px] font-bold tracking-tight">점수 산정 근거</h2>
          {CATEGORY_CONFIG.map(({ key, label, Icon }) => (
            <CategoryCard key={key} label={label} Icon={Icon} detail={score.categories[key]} />
          ))}
        </section>
      </main>

      <BottomNav />
    </MobileFrame>
  );
}

function SelectionMissing() {
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

function CategoryCard({
  label,
  Icon,
  detail,
}: {
  label: string;
  Icon: typeof Store;
  detail: LifeScoreCategoryDetail;
}) {
  return (
    <article className="rounded-3xl border border-border bg-card p-5">
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-2xl bg-muted flex items-center justify-center">
          <Icon size={19} strokeWidth={1.8} />
        </div>
        <div>
          <h3 className="text-[15px] font-bold">{label}</h3>
          <p className="text-[11px] text-muted-foreground">
            {formatScore(detail.categoryScore)} / {formatScore(detail.maxScore)}점
          </p>
        </div>
      </div>
      <p className="mt-4 text-[13px] leading-relaxed text-foreground/80">
        {detail.evaluationSummary}
      </p>

      {detail.stores.length === 0 ? (
        <div className="mt-4 rounded-2xl border border-dashed border-border px-4 py-6 text-center text-[12px] text-muted-foreground">
          반경 내 검색된 매장이 없습니다.
        </div>
      ) : (
        <div className="mt-4 space-y-2.5">
          {detail.stores.map((store) => (
            <StoreRow key={`${store.name}-${store.latitude}-${store.longitude}`} store={store} />
          ))}
        </div>
      )}
    </article>
  );
}

function StoreRow({ store }: { store: LifeScoreStore }) {
  const tone = getDistanceTone(store.distanceMeter);
  return (
    <div className={`rounded-2xl border bg-background px-4 py-3.5 ${tone.border}`}>
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-[13px] font-semibold">{store.name}</span>
            {store.isRepresentative && (
              <span className="rounded-full bg-primary px-2 py-0.5 text-[9px] font-bold text-primary-foreground">
                대표 매장
              </span>
            )}
          </div>
          <p className="mt-1 text-[11px] text-muted-foreground">{store.address}</p>
        </div>
        <span className={`shrink-0 rounded-full px-2 py-1 text-[10px] font-semibold ${tone.badge}`}>
          {store.distanceMeter.toLocaleString()}m
        </span>
      </div>
      <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-muted-foreground">
        <span>
          등급 <strong className="font-semibold text-foreground">{store.grade}</strong>
        </span>
        <span>
          산출 점수{" "}
          <strong className="font-semibold text-foreground">
            {formatScore(store.calculatedScore)}점
          </strong>
        </span>
      </div>
    </div>
  );
}

function LifeScoreMap({
  apartmentName,
  centerLat,
  centerLng,
  stores,
}: {
  apartmentName: string;
  centerLat: number;
  centerLng: number;
  stores: { key: LifeScoreCategoryKey; store: LifeScoreStore }[];
}) {
  return (
    <section id="life-score-map" className="mt-8">
      <h2 className="text-[18px] font-bold tracking-tight">주변 매장 지도</h2>
      <p className="mt-1 text-[12px] text-muted-foreground">
        마커 색상은 아파트에서 매장까지의 거리를 나타내요.
      </p>
      <div className="mt-3 flex flex-wrap gap-2 text-[10px] text-muted-foreground">
        <Legend color="bg-primary" label="300m 이하" />
        <Legend color="bg-amber-400" label="301~500m" />
        <Legend color="bg-red-500" label="501~1,000m" />
        <Legend color="bg-gray-400" label="1,000m 초과" />
      </div>

      <div className="mt-4 relative aspect-square overflow-hidden rounded-3xl border border-border bg-muted/50">
        <div
          className="absolute inset-0 opacity-40"
          style={{
            backgroundImage:
              "linear-gradient(var(--color-border) 1px, transparent 1px), linear-gradient(90deg, var(--color-border) 1px, transparent 1px)",
            backgroundSize: "32px 32px",
          }}
        />
        {[84, 50, 26].map((size) => (
          <div
            key={size}
            className="absolute left-1/2 top-1/2 aspect-square -translate-x-1/2 -translate-y-1/2 rounded-full border border-primary/20"
            style={{ width: `${size}%` }}
          />
        ))}
        <div className="absolute left-1/2 top-1/2 z-10 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center">
          <div className="h-4 w-4 rounded-full bg-foreground ring-4 ring-foreground/15" />
          <div className="mt-1.5 max-w-32 truncate rounded-full border border-border bg-card px-2 py-0.5 text-[9px] font-bold">
            {apartmentName}
          </div>
        </div>

        {stores.map(({ key, store }) => {
          const position = getMarkerPosition(centerLat, centerLng, store);
          const tone = getDistanceTone(store.distanceMeter);
          return (
            <div
              key={`${key}-${store.name}-${store.latitude}-${store.longitude}`}
              className="group absolute z-10 -translate-x-1/2 -translate-y-1/2"
              style={{ left: `${position.left}%`, top: `${position.top}%` }}
              title={`${store.name} · ${store.distanceMeter}m`}
              aria-label={`${store.name}, ${store.distanceMeter}m`}
            >
              <div className={`h-3 w-3 rounded-full ring-4 ${tone.dot}`} />
              {store.isRepresentative && (
                <div className="pointer-events-none absolute bottom-4 left-1/2 hidden -translate-x-1/2 whitespace-nowrap rounded-full border border-border bg-card px-2 py-1 text-[9px] font-semibold shadow-sm group-hover:block">
                  {store.name}
                </div>
              )}
            </div>
          );
        })}

        {stores.length === 0 && (
          <div className="absolute inset-x-4 bottom-5 rounded-2xl bg-card/90 px-4 py-3 text-center text-[12px] text-muted-foreground">
            반경 내 검색된 매장이 없습니다.
          </div>
        )}
      </div>
    </section>
  );
}

function getMarkerPosition(centerLat: number, centerLng: number, store: LifeScoreStore) {
  const metersPerLongitudeDegree = 111_320 * Math.cos((centerLat * Math.PI) / 180);
  const xMeters = (store.longitude - centerLng) * metersPerLongitudeDegree;
  const yMeters = (store.latitude - centerLat) * 111_320;
  const markerRadius = 42;
  const clamp = (value: number) => Math.max(-1, Math.min(1, value));
  return {
    left: 50 + clamp(xMeters / DEFAULT_LIFE_SCORE_RADIUS_METER) * markerRadius,
    top: 50 - clamp(yMeters / DEFAULT_LIFE_SCORE_RADIUS_METER) * markerRadius,
  };
}

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className={`h-2 w-2 rounded-full ${color}`} />
      {label}
    </span>
  );
}
