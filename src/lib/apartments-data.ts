export type FacilityKey = "subway" | "daiso" | "oliveyoung" | "mart";

export const FACILITIES: { key: FacilityKey; label: string }[] = [
  { key: "subway", label: "지하철" },
  { key: "daiso", label: "다이소" },
  { key: "oliveyoung", label: "올리브영" },
  { key: "mart", label: "마트" },
];

export const WALKING_TIMES = [5, 10, 15, 20] as const;

export type Apartment = {
  id: string;
  name: string;
  address: string;
  walks: Record<FacilityKey, { name: string; minutes: number }>;
};

export const APARTMENTS: Apartment[] = [
  {
    id: "mapo-raemian",
    name: "마포래미안푸르지오",
    address: "서울 마포구 아현동",
    walks: {
      subway: { name: "애오개역", minutes: 6 },
      daiso: { name: "다이소 공덕점", minutes: 8 },
      oliveyoung: { name: "올리브영 아현역점", minutes: 5 },
      mart: { name: "이마트 마포점", minutes: 13 },
    },
  },
  {
    id: "gongdeok-xi",
    name: "공덕자이",
    address: "서울 마포구 공덕동",
    walks: {
      subway: { name: "공덕역", minutes: 4 },
      daiso: { name: "다이소 공덕점", minutes: 6 },
      oliveyoung: { name: "올리브영 공덕점", minutes: 7 },
      mart: { name: "이마트 마포점", minutes: 10 },
    },
  },
  {
    id: "sinchon-ipark",
    name: "신촌숲아이파크",
    address: "서울 마포구 신수동",
    walks: {
      subway: { name: "광흥창역", minutes: 7 },
      daiso: { name: "다이소 신촌점", minutes: 9 },
      oliveyoung: { name: "올리브영 신촌점", minutes: 11 },
      mart: { name: "홈플러스 합정점", minutes: 12 },
    },
  },
  {
    id: "mapo-prestige",
    name: "마포프레스티지자이",
    address: "서울 마포구 염리동",
    walks: {
      subway: { name: "대흥역", minutes: 5 },
      daiso: { name: "다이소 공덕점", minutes: 10 },
      oliveyoung: { name: "올리브영 이대점", minutes: 9 },
      mart: { name: "이마트 마포점", minutes: 14 },
    },
  },
];

export function maxWalk(a: Apartment, keys: FacilityKey[]) {
  return Math.max(...keys.map((k) => a.walks[k].minutes));
}
