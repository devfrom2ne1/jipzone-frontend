import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useId, useRef, useState } from "react";
import { Search, Building2, Loader2 } from "lucide-react";
import { MobileFrame } from "@/components/MobileFrame";
import { BottomNav } from "@/components/BottomNav";
import type { AddressSearchApiResult, ApartmentSearchResult } from "@/lib/apartment-search";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "집세권 · 집값보다 생활을 기준으로" },
      {
        name: "description",
        content: "아파트명이나 주소를 입력하면 주변 생활시설까지 도보 시간을 분석해드려요.",
      },
      { property: "og:title", content: "집세권 · 집값보다 생활을 기준으로" },
      {
        property: "og:description",
        content: "아파트명이나 주소를 입력하면 주변 생활시설까지 도보 시간을 분석해드려요.",
      },
    ],
  }),
  component: Home,
});

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL ?? "").replace(/\/$/, "");

function Home() {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<ApartmentSearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const listboxId = useId();
  const searchAreaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const trimmedQuery = query.trim();
    if (!trimmedQuery) {
      setSuggestions([]);
      setIsLoading(false);
      setError("");
      setIsOpen(false);
      setActiveIndex(-1);
      return;
    }

    setSuggestions([]);
    setActiveIndex(-1);
    setIsLoading(true);
    setError("");
    setIsOpen(true);

    const controller = new AbortController();
    const timeout = window.setTimeout(async () => {
      try {
        const response = await fetch(
          `${API_BASE_URL}/api/v1/addresses/search?query=${encodeURIComponent(trimmedQuery)}`,
          { signal: controller.signal },
        );
        if (!response.ok) throw new Error("검색 요청에 실패했습니다.");

        const data = (await response.json()) as AddressSearchApiResult[];
        const results = data
          .map((result) => ({
            id: `${result.longitude}-${result.latitude}`,
            name: result.place_name ?? result.placeName ?? "",
            address:
              result.road_address_name ??
              result.roadAddressName ??
              result.address_name ??
              result.addressName ??
              result.address ??
              "",
            longitude: String(result.longitude),
            latitude: String(result.latitude),
          }))
          .filter((result) => result.name && result.address);
        setSuggestions(results);
        setActiveIndex(results.length > 0 ? 0 : -1);
      } catch (requestError) {
        if (requestError instanceof DOMException && requestError.name === "AbortError") return;
        setSuggestions([]);
        setActiveIndex(-1);
        setError(
          requestError instanceof Error
            ? requestError.message
            : "검색 결과를 불러오지 못했어요. 잠시 후 다시 시도해주세요.",
        );
      } finally {
        if (!controller.signal.aborted) setIsLoading(false);
      }
    }, 250);

    return () => {
      window.clearTimeout(timeout);
      controller.abort();
    };
  }, [query]);

  const goAnalyze = (apartment: ApartmentSearchResult) => {
    navigate({
      to: "/analyze",
      search: {
        apartmentName: apartment.name,
        address: apartment.address,
        lat: apartment.latitude,
        lng: apartment.longitude,
        facilities: "subway,daiso,oliveyoung,mart",
        source: "home",
      },
    });
  };

  const submitSearch = () => {
    const pick = suggestions[activeIndex] ?? suggestions[0];
    if (pick) goAnalyze(pick);
  };

  return (
    <MobileFrame>
      {/* Brand */}
      <div className="px-5 pt-14 pb-4">
        <div className="text-[15px] font-bold tracking-tight">집세권</div>
        <div className="text-[12px] text-muted-foreground mt-0.5">집값보다 생활을 기준으로.</div>
      </div>

      <div className="px-5 pt-6">
        <h1 className="text-[26px] font-bold leading-[1.35] tracking-tight">
          궁금한 집의 생활권을
          <br />
          바로 확인해보세요
        </h1>
        <p className="mt-3 text-[13px] text-muted-foreground leading-relaxed">
          아파트명이나 주소를 입력하면
          <br />
          주변 생활시설까지 걸리는 시간을 분석해드려요.
        </p>

        <div className="mt-6" ref={searchAreaRef}>
          <div className="relative">
            <Search
              size={18}
              className="absolute left-5 top-1/2 -translate-y-1/2 text-muted-foreground"
              strokeWidth={2}
            />
            <input
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setIsOpen(Boolean(e.target.value.trim()));
              }}
              onFocus={() => {
                if (query.trim()) setIsOpen(true);
              }}
              onBlur={(e) => {
                if (!searchAreaRef.current?.contains(e.relatedTarget)) setIsOpen(false);
              }}
              onKeyDown={(e) => {
                if (e.key === "ArrowDown" && suggestions.length > 0) {
                  e.preventDefault();
                  setIsOpen(true);
                  setActiveIndex((index) => (index + 1) % suggestions.length);
                } else if (e.key === "ArrowUp" && suggestions.length > 0) {
                  e.preventDefault();
                  setIsOpen(true);
                  setActiveIndex((index) => (index <= 0 ? suggestions.length - 1 : index - 1));
                } else if (e.key === "Enter") {
                  e.preventDefault();
                  submitSearch();
                } else if (e.key === "Escape") {
                  setIsOpen(false);
                }
              }}
              role="combobox"
              aria-autocomplete="list"
              aria-expanded={isOpen}
              aria-controls={listboxId}
              aria-activedescendant={
                isOpen && activeIndex >= 0
                  ? `${listboxId}-option-${suggestions[activeIndex]?.id}`
                  : undefined
              }
              placeholder="아파트명 또는 주소를 입력하세요"
              className="w-full h-16 pl-12 pr-5 rounded-2xl bg-card border border-border text-[15px] font-medium placeholder:text-muted-foreground focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
            />
            {isLoading && (
              <Loader2
                size={17}
                className="absolute right-5 top-1/2 -translate-y-1/2 animate-spin text-muted-foreground"
                aria-label="검색 중"
              />
            )}
          </div>

          {isOpen && query.trim() && (
            <div
              id={listboxId}
              role="listbox"
              className="mt-2 bg-card border border-border rounded-2xl overflow-hidden"
            >
              {!isLoading && !error && suggestions.length === 0 && (
                <div className="px-4 py-4 text-[13px] text-muted-foreground">
                  일치하는 아파트가 없어요.
                </div>
              )}
              {error && (
                <div className="px-4 py-4 text-[13px] text-destructive" role="alert">
                  {error}
                </div>
              )}
              {suggestions.map((suggestion, index) => (
                <button
                  id={`${listboxId}-option-${suggestion.id}`}
                  role="option"
                  aria-selected={index === activeIndex}
                  key={suggestion.id}
                  onMouseDown={(e) => e.preventDefault()}
                  onMouseEnter={() => setActiveIndex(index)}
                  onClick={() => goAnalyze(suggestion)}
                  className={
                    "w-full flex items-center gap-3 px-4 py-3.5 text-left border-b border-border last:border-b-0 " +
                    (index === activeIndex ? "bg-muted/60" : "hover:bg-muted/60")
                  }
                >
                  <div className="w-9 h-9 rounded-xl bg-muted flex items-center justify-center shrink-0">
                    <Building2 size={16} strokeWidth={1.8} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-[14px] font-semibold truncate">{suggestion.name}</div>
                    <div className="text-[12px] text-muted-foreground truncate">
                      {suggestion.address}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}

          {!query.trim() && (
            <div className="mt-3 flex flex-wrap gap-2">
              <span className="text-[11px] text-muted-foreground py-1">예시</span>
              {["마포래미안푸르지오", "서울 마포구 마포대로 195"].map((ex) => (
                <button
                  key={ex}
                  onClick={() => setQuery(ex)}
                  className="text-[12px] px-3 py-1 rounded-full bg-muted text-muted-foreground"
                >
                  {ex}
                </button>
              ))}
            </div>
          )}

          <button
            onClick={submitSearch}
            disabled={suggestions.length === 0 || isLoading}
            className="mt-5 w-full h-14 rounded-2xl bg-primary text-primary-foreground font-semibold text-[16px] disabled:opacity-40"
          >
            생활권 분석하기
          </button>
        </div>
      </div>

      <BottomNav />
    </MobileFrame>
  );
}
