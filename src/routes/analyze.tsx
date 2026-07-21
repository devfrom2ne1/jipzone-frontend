import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { AlertCircle, Check, Loader2 } from "lucide-react";
import { MobileFrame } from "@/components/MobileFrame";
import { BottomNav } from "@/components/BottomNav";
import { apartmentFullViewQueryOptions } from "@/lib/apartment-full-view-api";

type Search = {
  apartmentName: string;
  address: string;
  lat: string;
  lng: string;
  facilities: string;
  source?: "home" | "find";
};

export const Route = createFileRoute("/analyze")({
  validateSearch: (s: Record<string, unknown>): Search => ({
    apartmentName: typeof s.apartmentName === "string" ? s.apartmentName : "",
    address: typeof s.address === "string" ? s.address : "",
    lat: typeof s.lat === "string" ? s.lat : "",
    lng: typeof s.lng === "string" ? s.lng : "",
    facilities: typeof s.facilities === "string" ? s.facilities : "subway,daiso,oliveyoung,mart",
    source: s.source === "find" ? "find" : "home",
  }),
  component: Analyze,
});

const STEPS = ["주소 확인", "주변 시설 검색", "도보 시간 계산", "생활권 분석 완료"];

function Analyze() {
  const { apartmentName, address, lat, lng, facilities, source = "home" } = Route.useSearch();
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const latitude = Number(lat);
  const longitude = Number(lng);
  const missingSelection =
    !apartmentName || !address || !Number.isFinite(latitude) || !Number.isFinite(longitude);
  const selectedApartment = {
    apartmentName,
    address,
    lat: latitude,
    lng: longitude,
  };
  const { data, error, isError, isFetching, refetch } = useQuery({
    ...apartmentFullViewQueryOptions(selectedApartment),
    enabled: !missingSelection,
  });

  useEffect(() => {
    if (!isFetching || missingSelection) return;
    const interval = window.setInterval(() => {
      setStep((current) => Math.min(current + 1, STEPS.length - 1));
    }, 550);
    return () => window.clearInterval(interval);
  }, [isFetching, missingSelection]);

  useEffect(() => {
    if (!data) return;
    setStep(STEPS.length);
    const timeout = window.setTimeout(() => {
      navigate({
        to: "/apartment/$id",
        params: { id: "selected" },
        search: {
          minutes: 15,
          facilities,
          source,
          apartmentName,
          address,
          lat,
          lng,
        },
      });
    }, 450);
    return () => window.clearTimeout(timeout);
  }, [address, apartmentName, data, facilities, lat, lng, navigate, source]);

  return (
    <MobileFrame>
      <div className="min-h-screen flex flex-col px-6 pt-24 pb-16">
        <div className="text-[13px] text-muted-foreground">
          {apartmentName || "선택된 아파트 없음"}
        </div>
        <h1 className="mt-2 text-[24px] font-bold tracking-tight leading-snug">
          생활권을 분석하고 있어요
        </h1>
        <p className="mt-3 text-[14px] text-muted-foreground leading-relaxed">
          주변 지하철, 다이소, 올리브영,
          <br />
          마트까지 걸리는 시간을 확인 중입니다.
        </p>

        <div className="mt-12 space-y-3">
          {STEPS.map((label, i) => {
            const done = i < step;
            const active = i === step;
            return (
              <div
                key={label}
                className={
                  "flex items-center gap-3 rounded-2xl border px-4 py-3.5 transition " +
                  (done
                    ? "bg-accent border-accent"
                    : active
                      ? "bg-card border-primary/40"
                      : "bg-card border-border opacity-50")
                }
              >
                <div className="w-7 h-7 rounded-full flex items-center justify-center shrink-0 bg-background">
                  {done ? (
                    <Check size={14} className="text-primary" strokeWidth={3} />
                  ) : active ? (
                    <Loader2 size={14} className="text-primary animate-spin" strokeWidth={2.5} />
                  ) : (
                    <span className="text-[11px] text-muted-foreground font-semibold">{i + 1}</span>
                  )}
                </div>
                <span
                  className={
                    "text-[14px] " +
                    (done || active ? "font-semibold text-foreground" : "text-muted-foreground")
                  }
                >
                  {label}
                </span>
              </div>
            );
          })}
        </div>

        {(isError || missingSelection) && (
          <div className="mt-6 rounded-2xl border border-destructive/30 bg-destructive/5 px-4 py-4">
            <div className="flex items-start gap-3">
              <AlertCircle size={18} className="mt-0.5 shrink-0 text-destructive" />
              <div className="min-w-0">
                <div className="text-[14px] font-semibold text-destructive">분석하지 못했어요</div>
                <p className="mt-1 text-[12px] leading-relaxed text-muted-foreground">
                  {missingSelection
                    ? "아파트를 다시 검색해서 선택해주세요."
                    : error instanceof Error
                      ? error.message
                      : "잠시 후 다시 시도해주세요."}
                </p>
              </div>
            </div>
            <button
              onClick={() => (missingSelection ? navigate({ to: "/" }) : refetch())}
              className="mt-4 w-full rounded-xl bg-primary py-3 text-[13px] font-semibold text-primary-foreground"
            >
              {missingSelection ? "검색으로 돌아가기" : "다시 시도"}
            </button>
          </div>
        )}
      </div>
      <BottomNav />
    </MobileFrame>
  );
}
