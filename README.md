# 🌌 Obsidian Slate: AI 기반 아키텍처 지식 관리 & RAG 그래프 시스템
> **Next-Generation Architecture Knowledge Vault & Semantic Topology Graph**

Obsidian Slate는 복잡한 분산 시스템 아키텍처, 인프라 토폴로지, 도메인 소스코드 명세를 **마크다운 위키링크(`[[...]]`)**, **AI 시맨틱 벡터 임베딩(pgvector/HNSW)**, 그리고 **하이브리드 RAG(Gemini 3.8 Flash)**를 결합하여 구조화하고 탐색하는 엔터프라이즈 지식 관리 플랫폼입니다.

---

## 📑 목차
1. [시스템 개요 및 핵심 아키텍처](#1-시스템-개요-및-핵심-아키텍처)
2. [주요 기능 및 다중 지식 연결 방식](#2-주요-기능-및-다중-지식-연결-방식)
3. [프로젝트 디렉토리 구조](#3-프로젝트-디렉토리-구조)
4. [실행 방법 (개발 및 프로덕션 배포)](#4-실행-방법-개발-및-프로덕션-배포)
5. [Docker Compose & PostgreSQL pgvector 클러스터](#5-docker-compose--postgresql-pgvector-클러스터)
6. [환경 변수 가이드](#6-환경-변수-가이드)
7. [남은 기능 로드맵 및 백로그](#7-남은-기능-로드맵-및-백로그)

---

## 1. 시스템 개요 및 핵심 아키텍처

```
[ 클라이언트: React 18 + Tailwind + Lucide Icons + SVG Topology Graph ]
                           │
                 HTTP / REST API
                           ▼
[ 풀스택 Express 서버 (server.ts / Vite Middleware) ]
       │                                     │
       ├─ [ Google Gemini 3.8 Flash SDK ]    └─ [ PostgreSQL 16 + pgvector ]
       │  (RAG 시맨틱 추론, Diff 생성)           │  (HNSW 코사인 인덱스, PgBouncer)
       └─ [ Local RAG Fallback Engine ]      └─ [ Knowledge Tables & Backlinks ]
```

* **Frontend**: React 18, Tailwind CSS, SVG 기반 2.5D 인터랙티브 그래프 캔버스
* **Backend**: Node.js, Express, `@google/genai` (Gemini 3.8 Flash), Vite SPA 미들웨어
* **Vector & Storage**: PostgreSQL 16 with `pgvector` (768차원 임베딩), PgBouncer 커넥션 풀
* **인덱싱 알고리즘**: HNSW Vector Cosine Index (`m=16, ef_construction=64`), PostgreSQL GIN Full-Text Search

---

## 2. 주요 기능 및 다중 지식 연결 방식

### ① 3가지 스마트 지식 연결 (Hybrid Linking)
1. **명시적 위키링크 (Explicit Backlinks)**:
   - 본문 내 `[[문서명]]` 문법 지원, 자동 하이퍼링크 변환 및 그래프 엣지 형성.
2. **AI 시맨틱 추천 연결 (Semantic Links)**:
   - 사용자가 직접 타이핑하지 않아도, 본문의 기술 스택, 태그, 컨텍스트를 분석하여 유사도 70% 이상의 연관 문서를 실시간 감지(`96% 유사` 등)하고 원클릭으로 연결.
3. **언링크드 멘션 탐지 (Unlinked Mentions)**:
   - 대괄호(`[[ ]]`) 없이 일반 텍스트로만 언급된 다른 문서 이름을 자동 추적하여 **[백링크로 승격]** 버튼 제공.

### ② 실시간 마크다운 인라인 에디터
- 문서 상세 화면에서 `[직접 편집]` 버튼을 눌러 제목과 마크다운 본문을 즉시 수정 및 저장.
- 저장 시 단어 수, 타임스탬프, 연계 노드가 즉시 동기화.

### ③ 실시간 RAG 어시스턴트 (ChatView)
- `Gemini 3.8 Flash` 연동을 통해 볼트 내 모든 지식 문서를 컨텍스트로 주입(RAG).
- 문서 업데이트 요청 시 **Git 스타일의 Diff Proposal**을 생성하며, `[변경사항 커밋]` 클릭 시 실제 문서에 자동 패치.

### ④ 2.5D 인터랙티브 지식 그래프 (GraphView)
- 연결 방식 필터: `모든 연결`, `명시적 백링크`, `AI 시맨틱 추천(네온 점선)`, `태그 클러스터`
- 줌 인/아웃, 뎁스 조절(1~3 Depth), 카테고리별 컬러 하이라이팅, 실시간 노드 인스펙터 시트.

---

## 3. 프로젝트 디렉토리 구조

```
├── .env.example              # 필수 및 부가 환경변수 명세
├── docker-compose.yml        # PostgreSQL pgvector 및 PgBouncer 컨테이너 정의
├── init-db.sql               # PostgreSQL 확장 및 HNSW 인덱스 초기화 DDL
├── package.json              # 의존성 및 빌드/실행 스크립트
├── server.ts                 # Express 풀스택 백엔드 및 Gemini RAG 엔드포인트
├── SYSTEM_ARCHITECTURE.md   # 전체 시스템 아키텍처 상세 설계서
├── src/
│   ├── App.tsx               # 루트 애플리케이션 및 전역 상태 관리
│   ├── types.ts              # TypeScript 인터페이스 및 타입 정의
│   ├── main.tsx              # React 진입점
│   ├── index.css             # Tailwind 전역 스타일
│   └── components/
│       ├── layout/
│       │   ├── Header.tsx    # 상단 글로벌 검색 바 및 시스템 상태
│       │   └── Sidebar.tsx   # 좌측 네비게이션 및 워크스페이스 스위처
│       └── views/
│           ├── NotesView.tsx # 마크다운 상세 뷰, 인라인 편집기, 스마트 연결 허브
│           ├── GraphView.tsx # 2.5D 토폴로지 그래프 및 연결 모드 인스펙터
│           ├── ChatView.tsx  # Gemini RAG AI 챗봇 및 Diff Proposal 커밋터
│           ├── TriageQueueView.tsx   # 미정제 문서 AI 승인 대기열
│           └── ArchitectureDiagram.tsx # SVG 아키텍처 다이어그램 컴포넌트
```

---

## 4. 실행 방법 (개발 및 프로덕션 배포)

### 1) 사전 준비
- Node.js 18+ 이상 설치
- (선택) Docker & Docker Compose (PostgreSQL pgvector 구동용)

### 2) 의존성 설치
```bash
npm install
```

### 3) 환경 변수 설정
`.env.example` 파일을 복사하여 `.env` 파일을 생성합니다.
```bash
cp .env.example .env
```
- `GEMINI_API_KEY`: Google AI Studio에서 발급받은 API 키 입력 (미입력 시 내장 로컬 RAG 엔진으로 자동 폴백 동작).

### 4) 개발 모드 실행
```bash
npm run dev
```
- 서버와 Vite 개발 환경이 `http://localhost:3000`에서 실행됩니다.

### 5) 프로덕션 빌드 및 실행
```bash
npm run build
npm start
```
- `dist/` 정적 파일 및 `dist/server.cjs` 단일 번들이 생성되어 고성능으로 기동됩니다.

---

## 5. Docker Compose & PostgreSQL pgvector 클러스터

로컬 환경에 엔터프라이즈 벡터 DB를 가동하려면 다음 명령어를 실행합니다:

```bash
# 1. PostgreSQL 16 + pgvector + PgBouncer 백그라운드 구동
docker compose up -d

# 2. 컨테이너 헬스체크 확인
docker compose ps

# 3. 데이터베이스 접속 테스트 (기본 포트 5432 또는 PgBouncer 6432)
psql -h localhost -p 5432 -U obsidian -d knowledge_vault
```

---

## 6. 환경 변수 가이드

| 변수명 | 필수 여부 | 기본값 | 설명 |
|---|---|---|---|
| `PORT` | 필수 (시스템 고정) | `3000` | 웹 서비스 리스닝 포트 |
| `GEMINI_API_KEY` | 권장 | - | Google Gemini 3.8 Flash API 키 |
| `DATABASE_URL` | 선택 | `postgresql://obsidian:slate_secure_pass@localhost:5432/knowledge_vault` | PostgreSQL 연결 문자열 |
| `POSTGRES_USER` | 선택 | `obsidian` | DB 사용자명 |
| `POSTGRES_PASSWORD`| 선택 | `slate_secure_pass` | DB 암호 |
| `POSTGRES_DB` | 선택 | `knowledge_vault` | 데이터베이스명 |

---

## 7. 남은 기능 로드맵 및 백로그

자세한 아키텍처 설계와 추가 구현 예정 사안은 **`SYSTEM_ARCHITECTURE.md`** 문서를 참조하십시오:
1. **Drizzle ORM 실시간 DB 동기화**: 메모리 상태를 PostgreSQL pgvector 테이블로 양방향 영속화
2. **실시간 캔버스 노드 와이어링 (Drag-to-Link)**: 마우스 드래그를 통한 노드 간 시각적 선 연결
3. **옵시디언 마크다운 파일 양방향 임포트/익스포트 (`.md`, `.zip`)**
4. **WebSocket 기반 다중 사용자 동시 편집 및 커서 공유**
