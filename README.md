# 집세권

집값뿐 아니라 일상생활에 필요한 시설까지 걸어서 얼마나 걸리는지 기준으로 아파트를 찾아보는 모바일 웹 프로토타입입니다.

## 바로 보기

현재 Vercel에 배포되어 있습니다.

**[집세권 웹사이트 열기](https://walkable-jib-zone.vercel.app/)**

## 주요 기능

- 주소 또는 아파트 이름 검색
- 원하는 도보 시간 선택
- 지하철, 다이소, 올리브영, 대형마트 조건 선택
- 조건에 맞는 아파트 목록과 지도 형태 결과 확인
- 아파트별 주변 시설 및 도보 시간 확인

현재 아파트와 주변 시설 정보는 실제 API나 데이터베이스가 아닌 프로젝트 내부의 샘플 데이터입니다.

## 기술 구성

- TypeScript
- React 19
- TanStack Start 및 TanStack Router
- Vite
- Tailwind CSS 4
- Radix UI
- Nitro SSR
- Vercel

## 로컬 실행

Node.js 22가 필요합니다.

```bash
npm install --include=dev
cp .env.example .env.local
npm run dev
```

주소·아파트 자동완성은 `/api/v1/addresses/search?query=` API를 호출합니다. 로컬에서는
Vite가 이 요청을 `http://localhost:8081`로 프록시하므로 백엔드를 8081 포트에 먼저
실행해야 합니다. 운영 빌드는 `.env.production`의 `VITE_API_BASE_URL`을 사용해
`https://jipzone-backend.onrender.com`을 호출합니다. Vercel 환경변수로 같은 키를
설정하면 파일의 값보다 Vercel 설정이 우선합니다.

선택한 아파트의 주변 시설은 `/api/apartment/facilities` API에서 가져옵니다. 아파트명,
주소, 위도, 경도와 선택 시설을 쿼리 파라미터로 전달하며 응답의 생활권 요약, 점수와 시설별
도보 시간을 상세 화면에 표시합니다.

주거 편의성 점수는 `/api/life-score` API에서 가져옵니다. 선택한 아파트의 위도와 경도,
기본 검색 반경 1,000m를 전달하고, 백엔드가 계산한 총점과 카테고리별 점수 및 매장별
산정 근거를 상세 화면에 그대로 표시합니다.

검색에서 선택한 아파트로 상세 화면에 진입하면 이름, 주소, 위도와 경도를 전달해
`/api/apartment/full-view`를 호출합니다. 응답의 기본 정보, 시설 아이콘과 도보 시간,
상대 좌표 기반 생활권 마커를 상세 화면에 표시합니다. 상세 조회는 아파트 ID나 DB에
의존하지 않습니다.

개발 서버가 실행되면 다음 주소로 접속합니다.

```text
http://127.0.0.1:8080
```

## 주요 명령

```bash
npm run dev       # 개발 서버 실행
npm run build     # Vercel용 프로덕션 빌드
npm run preview   # 빌드 결과 미리보기
npm run lint      # 코드 검사
npm run format    # 코드 자동 정리
```

## 주요 폴더

```text
src/routes/         URL별 화면
src/components/     공통 화면 컴포넌트
src/components/ui/  기본 UI 컴포넌트
src/lib/            샘플 데이터와 공통 함수
public/             favicon 등 정적 파일
```

페이지와 폴더 구조, SSR, Vercel 배포, 모바일 앱 출시 방법에 관한 자세한 설명은 [PROJECT_GUIDE.md](./PROJECT_GUIDE.md)에서 확인할 수 있습니다.

## 배포

이 프로젝트는 Nitro의 Vercel preset을 사용합니다.

```text
Root Directory: ./
Framework Preset: Other
Install Command: npm install
Build Command: npm run build
Output Directory: 비워두기
Node.js Version: 22.x
```

GitHub 저장소에 변경 사항을 push하면 연결된 Vercel 프로젝트가 자동으로 다시 배포합니다.
