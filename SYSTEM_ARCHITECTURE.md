# 📐 Obsidian Slate: 전체 시스템 아키텍처 상세 설계서 (System Architecture Design Document)

**문서 버전**: v1.2.0  
**작성일자**: 2026-09-18  
**상태**: Approved & Implemented (Core) / Roadmap in Progress  

---

## 1. 시스템 설계 개요 (Executive Summary)

### 1.1 배경 및 목적
소프트웨어 시스템이 마이크로서비스, 이벤트 주도 아키텍처(EDA), 분산 트랜잭션으로 고도화됨에 따라 기존 정적 위키(Confluence, Notion 등)는 **최신 아키텍처 토폴로지 동기화 실패**와 **지식 사일로 현상**을 초래합니다.  
**Obsidian Slate**는 로컬 퍼스트 마크다운의 유연성과 AI 벡터 임베딩, 그리고 2.5D 위상 그래프를 융합하여 엔지니어가 인프라와 코드를 직관적으로 탐색하고 실시간 RAG 기반으로 추론할 수 있는 아키텍처 지식 체계를 제공합니다.

### 1.2 핵심 설계 원칙 (Core Principles)
1. **Hybrid Knowledge Linking**: 명시적 마크다운 위키링크(`[[ ]]`)와 벡터 유사도 기반의 시맨틱 링크, 그리고 본문 내 비공식 멘션을 결합한 다차원 지식 망 구성.
2. **Zero-Lock-in Storage**: 표준 마크다운(CommonMark) 및 오픈소스 PostgreSQL/pgvector 기반으로 언제든 이관 및 확장이 가능.
3. **Fail-Safe Inference (Hybrid RAG)**: Google Cloud Gemini 3.8 Flash 서버사이드 추론과 오프라인/로컬 시맨틱 폴백 엔진을 이중화하여 무중단 서비스 보장.
4. **Git-like Verification**: AI가 제안한 문서 변경사항은 반드시 시각적 Diff와 엔지니어의 명시적 승인(Commit) 절차를 거침.

---

## 2. 시스템 아키텍처 구성도 (High-Level Architecture)

```
┌────────────────────────────────────────────────────────────────────────┐
│                          User Web Browser                              │
│  ┌─────────────────────────┐  ┌─────────────────────────────────────┐  │
│  │   2.5D Knowledge Graph  │  │  Notes View & Markdown Editor       │  │
│  │   (Explicit / Semantic) │  │  (Smart Connection Hub)             │  │
│  └────────────┬────────────┘  └──────────────────┬──────────────────┘  │
│               │                                  │                     │
│  ┌────────────┴────────────┐  ┌──────────────────┴──────────────────┐  │
│  │   AI Chat & RAG Diff    │  │  Triage Queue & Quick Capture       │  │
│  │   (Gemini 3.8 Flash)    │  │  (Slack/Logs Auto-Ingestion)        │  │
│  └────────────┬────────────┘  └──────────────────┬──────────────────┘  │
└───────────────┼──────────────────────────────────┼─────────────────────┘
                │ HTTP REST / JSON                 │
                ▼                                  ▼
┌────────────────────────────────────────────────────────────────────────┐
│                 Full-Stack Gateway (Express + Vite Middleware)         │
│  - /api/health           : 헬스체크                                   │
│  - /api/ai/chat          : Gemini 3.8 Flash RAG API Proxy              │
│  - Static & SPA fallback : dist/index.html & Asset Serving             │
└───────────────┬──────────────────────────────────┬─────────────────────┘
                │                                  │
    Server-Side │ Lazy Initialization              │ Connection Pooling
                ▼                                  ▼
┌──────────────────────────────┐    ┌────────────────────────────────────┐
│   Google Gemini 3.8 Flash    │    │    PgBouncer Connection Pool       │
│   (Official @google/genai)   │    │    (Port 6432, Transaction Mode)   │
│   - Semantic RAG Context     │    └──────────────────┬─────────────────┘
│   - Git Diff Proposal Output │                       │
└──────────────────────────────┘                       ▼
                                    ┌────────────────────────────────────┐
                                    │    PostgreSQL 16 with pgvector     │
                                    │    (Port 5432, HNSW Vector Index)  │
                                    │    - knowledge_documents           │
                                    │    - knowledge_embeddings (768-dim)│
                                    │    - document_backlinks            │
                                    └────────────────────────────────────┘
```

---

## 3. 데이터베이스 및 스키마 상세 설계 (Data Layer)

### 3.1 PostgreSQL 테이블 정의 (`init-db.sql`)

#### 1) 지식 문서 원장 (`knowledge_documents`)
* `id` (UUID, PK): 문서 고유 식별자
* `title` (VARCHAR 255): 문서 제목 (위키링크 매칭 키)
* `slug` (VARCHAR 255, UNIQUE): URL 및 참조용 슬러그
* `category` (VARCHAR 50): 인프라, 소스코드, 데이터베이스, 워크플로우 등
* `tags` (TEXT[]): 해시태그 배열
* `content` (TEXT): 원본 마크다운 본문
* `excerpt` (TEXT): 요약문
* `author` (VARCHAR 100): 작성자
* `version` (INT): 문서 버전 관리 카운터

#### 2) 임베딩 벡터 저장소 (`knowledge_embeddings`)
* `id` (UUID, PK)
* `document_id` (UUID, FK -> `knowledge_documents.id`)
* `chunk_index` (INT): 문서 청크 분할 번호
* `chunk_content` (TEXT): 분할된 텍스트
* `embedding` (VECTOR(768)): Google Gemini / 텍스트 임베딩 벡터
* **HNSW 인덱스**:
  ```sql
  CREATE INDEX idx_embeddings_hnsw ON knowledge_embeddings
  USING hnsw (embedding vector_cosine_ops)
  WITH (m = 16, ef_construction = 64);
  ```

#### 3) 문서 간 백링크 토폴로지 (`document_backlinks`)
* `id` (UUID, PK)
* `source_id` (UUID, FK): 링크를 발신한 문서
* `target_id` (UUID, FK): 링크를 수신한 문서
* `link_type` (VARCHAR 30):
  - `explicit`: 사용자가 직접 `[[...]]` 입력
  - `semantic`: AI 벡터 유사도 기반 추천 연결
  - `unlinked`: 본문 텍스트 내 비공식 멘션 탐지
* `similarity_score` (FLOAT): 시맨틱 링크 시 유사도 (0.00 ~ 1.00)

---

## 4. 백링크 및 지식 연결 메커니즘 (Link Graph Engine)

시스템은 3가지 방식으로 노드를 연결하고 그래프를 형성합니다:

### 4.1 수동 명시적 링크 (Explicit Markdown Links)
* 정규식 `\[\[(.*?)\]\]`을 통해 본문에서 대상 노드 이름을 추출합니다.
* 렌더링 시 React 컴포넌트(`LinkIcon`)로 인터랙티브 뱃지화되며, 그래프 뷰에서 **실선 엣지(Solid Link)**로 렌더링됩니다.

### 4.2 AI 시맨틱 추천 연결 (AI Semantic Links)
* 문서가 저장되거나 조회될 때, 본문의 기술 태그(예: `#postgresql`, `#saga`)와 카테고리를 교차 분석하여 유사도 스코어 계산:
  $$\text{Score} = \min(99, 68 + (\text{공유 태그 수} \times 10) + (\text{동일 카테고리 여부} \times 15))$$
* 점수가 70% 이상인 문서를 **스마트 지식 연결 허브**에 즉시 노출.
* 사용자가 **[원클릭 연결]**을 누르면 상대 문서의 `connectedNodes`에 자동 등록되고, 그래프에서 **형광 네온 점선(Dashed Glow Edge)**으로 표시됩니다.

### 4.3 언링크드 멘션 탐지 (Unlinked Mentions)
* 현재 문서의 본문 텍스트 내에 타 문서의 제목 문자열이 대괄호 없이 일반 텍스트로 포함되어 있는지 풀스캔 검사.
* 발견 즉시 **[백링크로 승격]** 버튼을 통해 마크다운 정식 링크로 전환.

---

## 5. RAG 및 추론 파이프라인 (RAG Pipeline)

1. **질의 인입 (Query Ingestion)**:
   - 사용자가 `ChatView`에서 자연어로 인프라 질문 입력 (예: *"Kafka 클러스터 장애 시 결제 모듈 복구 절차는?"*).
2. **컨텍스트 구성 (Context Augmentation)**:
   - 클라이언트 볼트 내의 활성 문서들(`notes`)을 직렬화하여 RAG 시스템 프롬프트의 지식 소스로 주입.
3. **Gemini 3.8 Flash 추론**:
   - `server.ts`의 `/api/ai/chat`을 거쳐 Gemini API 호출.
   - 백엔드에 안전하게 보관된 `process.env.GEMINI_API_KEY` 사용.
4. **Git-like Diff 생성**:
   - 기존 문서를 업데이트해야 하는 경우, Gemini가 마크다운 코드 블록(`diff` 포맷)으로 패치안을 반환.
5. **승인 및 커밋 (User Commitment)**:
   - 사용자가 UI 상에서 Diff를 검토하고 `[변경사항 커밋]` 클릭 시 실시간 노트 원장에 패치 적용.

---

## 6. 전체 실행 및 인프라 운영 가이드

### 6.1 단일 서버 개발/테스트 실행
```bash
# 1. 의존성 설치
npm install

# 2. 로컬 개발 서버 구동 (포트 3000)
npm run dev
```

### 6.2 Docker Compose 기반 데이터베이스 클러스터 구동
```bash
# 백그라운드로 PostgreSQL + pgvector + PgBouncer 구동
docker compose up -d

# 실행 상태 및 헬스체크 모니터링
docker compose ps
```

### 6.3 프로덕션 빌드 및 배포
```bash
# Vite 정적 빌드 및 esbuild 기반 server.cjs 번들링
npm run build

# 프로덕션 서버 실행
npm start
```

---

## 7. 남은 기능 구현 로드맵 및 백로그 (Feature Roadmap)

현재 핵심 아키텍처와 UI/UX, RAG 파이프라인이 완성되었으며, 엔터프라이즈 확장을 위한 잔여 기능 항목은 다음과 같습니다:

| 우선순위 | 영역 | 기능 항목 | 구현 상세 및 권장 설계 |
|---|---|---|---|
| **P1** | **데이터 영속성** | **Drizzle ORM 연동** | 메모리 상의 `notes` 상태를 `init-db.sql`에 정의된 PostgreSQL 테이블로 실시간 CRUD 동기화 (`/api/notes` REST API 구축) |
| **P1** | **인터랙션** | **캔버스 드래그 앤 드롭 와이어링** | `GraphView` 캔버스 상에서 노드 A를 마우스로 드래그하여 노드 B에 드롭하면 양방향 백링크가 생성되는 비주얼 와이어링 |
| **P2** | **임포트/익스포트** | **옵시디언 볼트(.zip, .md) 호환** | 실제 로컬 옵시디언의 `.md` 파일 및 폴더 구조를 드래그 앤 드롭으로 대량 업로드/다운로드하는 파일 파서 |
| **P2** | **실시간 협업** | **WebSocket 다중 사용자 동시 편집** | Yjs 또는 Socket.io를 연동하여 여러 엔지니어가 동일 노트를 실시간 편집하고 마우스 커서를 공유하는 기능 |
| **P3** | **자동 정제(CI/CD)** | **GitHub Webhook 아키텍처 자동 수집** | 레포지토리의 PR 머지 시 변경된 아키텍처 다이어그램 및 README를 Triage Queue로 자동 인입 |
| **P3** | **시각화 확장** | **Mermaid.js 실시간 렌더러** | 본문에 작성된 Mermaid 다이어그램 코드 블록을 인터랙티브 플로우차트로 렌더링 |

---

## 8. 결론 및 기대 효과

Obsidian Slate는 기존의 텍스트 중심 문서 관리 체계를 **실시간 아키텍처 토폴로지** 및 **AI 시맨틱 그래프**로 진화시켰습니다.  
엔지니어는 복잡한 분산 환경의 변경점을 한눈에 파악하고, AI의 도움을 받아 문서 간의 숨겨진 연관 관계를 발견하며, 정확한 SOP에 기반하여 신속하게 장애에 대응할 수 있습니다.
