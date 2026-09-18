/**
 * 🧠 llm-wiki 시스템 자체 문서 AI 정제 적재 스크립트
 *
 * llm-wiki 플랫폼의 핵심 기능을 서술한 원본 문서 10건을
 * 실제 AI Refinery 파이프라인 (/api/refinery/analyze) 을 통해
 * 정제한 후 PostgreSQL 지식 DB에 영구 저장합니다.
 */

const BASE_URL = "http://localhost:3000";

// llm-wiki 시스템 자체 아키텍처를 다루는 원본 문서 10건
const LLM_WIKI_RAW_DOCS = [
  {
    sourceHint: "Architecture Doc / README",
    rawContent: `
# llm-wiki 플랫폼 개요 및 핵심 가치

llm-wiki는 로컬 퍼스트 마크다운 기반의 아키텍처 지식 관리 플랫폼입니다.
소프트웨어 팀의 지식 사일로 문제를 해결하기 위해 설계된 이 시스템은 다음 세 가지 핵심 기능을 결합합니다:

1. PostgreSQL + pgvector: 768차원 HNSW 벡터 인덱스를 활용한 시맨틱 검색
2. Google Gemini AI: 비정형 문서/로그를 구조화된 지식 카드로 자동 정제
3. 2.5D 위상 그래프: 문서 간 백링크([[WikiLink]])와 태그 기반 시각 연결망

기술 스택:
- Frontend: React 18 + TypeScript + Vite + Tailwind CSS
- Backend: Node.js + Express.ts (tsx 런타임)
- DB: PostgreSQL 16 with pgvector extension (Docker)
- AI: @google/genai SDK, Gemini 3.5/3.8 Flash

배포 포트: 3000 (개발 서버는 Vite HMR 미들웨어 포함)
서버 엔트리: server.ts → dist/server.cjs (빌드 후)
    `
  },
  {
    sourceHint: "DB Schema / init-db.sql",
    rawContent: `
-- llm-wiki PostgreSQL 핵심 스키마 설계

-- 1. 지식 문서 원장
CREATE TABLE knowledge_documents (
    id VARCHAR(64) PRIMARY KEY,
    title TEXT NOT NULL,
    category VARCHAR(32) NOT NULL CHECK (category IN ('DB', '연계', '인프라', '소스코드', '워크플로우')),
    category_full TEXT,
    tags TEXT[] DEFAULT '{}',
    content TEXT DEFAULT '',
    excerpt TEXT DEFAULT '',
    status_badge TEXT DEFAULT 'AI 정제 완료',
    badge_type TEXT DEFAULT 'ai-refined',
    author TEXT DEFAULT 'AI',
    word_count INT DEFAULT 0,
    char_count INT DEFAULT 0,
    read_time TEXT DEFAULT '1분 읽기',
    backlinks_count INT DEFAULT 0,
    connected_nodes TEXT[] DEFAULT '{}',
    code_snippet JSONB,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 2. pgvector 임베딩 (768차원 Gemini text-embedding-004 기반)
CREATE TABLE knowledge_embeddings (
    id VARCHAR(64) PRIMARY KEY,
    document_id VARCHAR(64) REFERENCES knowledge_documents(id) ON DELETE CASCADE,
    embedding vector(768),
    chunk_index INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_embeddings_hnsw ON knowledge_embeddings
    USING hnsw (embedding vector_cosine_ops)
    WITH (m = 16, ef_construction = 64);

-- 3. 문서 간 백링크 그래프
CREATE TABLE document_backlinks (
    id SERIAL PRIMARY KEY,
    source_doc_id VARCHAR(64) REFERENCES knowledge_documents(id) ON DELETE CASCADE,
    target_doc_id VARCHAR(64) REFERENCES knowledge_documents(id) ON DELETE CASCADE,
    link_text TEXT,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(source_doc_id, target_doc_id)
);

-- 4. AI 에이전트 프롬프트 관리 테이블
CREATE TABLE agent_prompts (
    id VARCHAR(64) PRIMARY KEY,
    name TEXT NOT NULL,
    agent_type TEXT NOT NULL,
    system_prompt TEXT NOT NULL DEFAULT '',
    user_prompt_template TEXT NOT NULL DEFAULT '',
    model TEXT DEFAULT 'gemini-3.8-flash',
    temperature FLOAT DEFAULT 0.1,
    variables TEXT[] DEFAULT '{}',
    version TEXT DEFAULT 'v1.0',
    is_active BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);
    `
  },
  {
    sourceHint: "Slack #dev-backend / Terminal Log",
    rawContent: `
[2026-09-18 09:12] @suntae -> #dev-backend
서버 부팅 시퀀스 공유합니다.

server.ts 기동 흐름:
1. dotenv 로드 -> GEMINI_API_KEY, DATABASE_URL 주입
2. initDatabaseSchema() 호출:
   - knowledge_documents, knowledge_embeddings, document_backlinks, triage_cards, architecture_rules, agent_prompts 테이블 CREATE IF NOT EXISTS
   - agent_prompts에 6종 기본 프리셋 ON CONFLICT DO UPDATE 시드
3. Vite 미들웨어 마운트 (개발 환경: createViteServer)
4. Express 라우터 등록:
   - GET  /api/health
   - GET  /api/notes         -> getAllNotes()
   - POST /api/notes         -> createNote()
   - PUT  /api/notes/:id     -> updateNote()
   - DELETE /api/notes/:id   -> deleteNote()
   - POST /api/ai/chat       -> Gemini RAG
   - POST /api/ai/diff       -> Git-style Diff 생성
   - POST /api/refinery/analyze -> AI 정제 파이프라인
   - GET/POST/DELETE /api/triage -> 정제 대기열 CRUD
   - GET/POST/PUT/DELETE /api/rules -> 아키텍처 규칙
   - POST /api/rules/test    -> 보안 샌드박스
   - GET/POST/PUT/DELETE/POST(activate) /api/agent-prompts -> 프롬프트 핫스와핑
   - POST /api/notes/import  -> 마크다운 볼트 일괄 적재
5. 포트 3000 리슨 시작

평균 Cold Start: 200ms (DB 커넥션 포함)
HMR 갱신 반응: 50ms
    `
  },
  {
    sourceHint: "Code Review / api.ts",
    rawContent: `
// llm-wiki 프론트엔드 API 클라이언트 (src/api.ts)
// 백엔드 REST 엔드포인트에 대한 타입 안전 래퍼 함수 모음

export async function fetchNotesFromApi(): Promise<NoteItem[]>
export async function createNoteInApi(note: NoteItem): Promise<NoteItem>
export async function updateNoteInApi(id: string, note: Partial<NoteItem>): Promise<NoteItem>
export async function deleteNoteFromApi(id: string): Promise<void>

export async function sendChatMessage(message: string, notes: NoteItem[]): Promise<AIChatResponse>
// -> POST /api/ai/chat { message, context: notes.map(n=>n.title+" "+n.excerpt) }
// 반환: { answer, referencedNotes[], diffProposal? }

export async function requestAIDiff(targetNote: NoteItem, instructions: string): Promise<AIDiffProposal>
// -> POST /api/ai/diff { noteId, noteTitle, noteContent, instructions }
// 반환: { diffLines[{ type: 'context'|'added'|'removed', content }], updatedFullContent }

export async function analyzeForRefinery(rawContent: string, sourceHint?: string): Promise<TriageCard>
// -> POST /api/refinery/analyze { rawContent, sourceHint }
// Gemini AI가 원본 텍스트를 파싱하여 구조화된 지식 카드 반환

export async function importMarkdownFiles(files: { filename: string; content: string }[]): Promise<NoteItem[]>
// -> POST /api/notes/import { files[] }
// 각 파일의 [[WikiLink]] 및 #태그를 자동 파싱하여 DB 적재

export async function fetchAgentPrompts(): Promise<AgentPrompt[]>
export async function activateAgentPrompt(id: string): Promise<void>
// 활성화된 프롬프트는 모든 AI 엔드포인트에 즉시 반영됨

중요: 모든 API 함수는 fetch() 기반이며 BASE_URL은 '' (상대 경로) 사용.
에러 처리: 4xx/5xx 응답 시 throw new Error(await res.text()) 패턴.
    `
  },
  {
    sourceHint: "Architecture Note / AI Refinery Pipeline",
    rawContent: `
# AI 정제 파이프라인 설계 (Refinery Engine)

흐름도:
원본 텍스트 입력 (Slack/Terminal/cURL/메모)
 -> POST /api/refinery/analyze
 -> Gemini AI Prompt (refinery-ingestion 에이전트 프롬프트)
 -> JSON 파싱: { aiTitle, category, tags, aiSummaryPoints, backlinks, confidenceScore 78~99.4, codeSnippet }
 -> TriageCard 생성 -> 대기열(triage_cards) 저장
 -> 사용자 승인 (RefineryView UI)
 -> POST /api/notes -> knowledge_documents 영구 저장
 -> pgvector 임베딩 자동 생성 (768차원)
 -> 백링크 그래프 갱신 (document_backlinks)

폴백 전략:
1차: gemini-3.8-flash (주 모델)
2차: gemini-3.6-flash
3차: gemini-3.5-flash
4차: gemini-flash-latest
최종: 휴리스틱 추출 (정규식 기반 카테고리/태그 분류)

confidenceScore 산출 기준:
- 수치 지표 포함 (TPS, ms, 포트, 버전): +6~10점
- 코드/SQL 포함: +5~8점
- 아키텍처 규칙 명시: +3~5점
- 위키링크 존재: +2~4점
- 기준값 82점 기반 가산

[[Obsidian Slate 아키텍처]] [[pgvector 시맨틱 검색]]
    `
  },
  {
    sourceHint: "Slack #infra / DevOps Chat",
    rawContent: `
[2026-09-16 14:33] @infra-bot -> #infra-alerts
pgvector Docker 컨테이너 설정 공유

컨테이너명: obsidian_slate_postgres
이미지: pgvector/pgvector:pg16
포트 맵핑: 5432:5432
환경변수:
  POSTGRES_USER=obsidian
  POSTGRES_PASSWORD=slate_secure_pass
  POSTGRES_DB=knowledge_vault

볼륨 마운트:
  ./init-db.sql -> /docker-entrypoint-initdb.d/init-db.sql
  pgdata -> /var/lib/postgresql/data

HNSW 인덱스 파라미터:
  m = 16 (최대 이웃 수)
  ef_construction = 64 (빌드 시 탐색 폭)
  ef_search = 40 (쿼리 시 탐색 폭)

pgvector 버전: 0.8.0
현재 상태: documents 34, embeddings 32, backlinks 55
쿼리 지연: 평균 12ms (768차원 Cosine similarity LIMIT 5)

벡터 유사도 검색 쿼리:
SELECT d.id, d.title, d.category, (1 - (e.embedding <=> $1::vector)) AS similarity
FROM knowledge_documents d
JOIN knowledge_embeddings e ON d.id = e.document_id
WHERE (1 - (e.embedding <=> $1::vector)) >= 0.70
ORDER BY similarity DESC LIMIT 5;

[[PostgreSQL pgvector 지식 저장소]] [[지식 그래프 Knowledge Graph]]
    `
  },
  {
    sourceHint: "Code Doc / RefineryView.tsx Component",
    rawContent: `
# AI 정제 대기열 UI (RefineryView.tsx)

핵심 상태:
- triageCards: TriageCard[] - API에서 불러온 정제 대기열 카드 목록
- activeFilter: 'all' | 'pending' | 'history' - 탭 필터
- viewMode: 'split' | 'stacked' - Before/After 비교 레이아웃

Before/After 비교 레이아웃:
- split 모드: 좌(Before 원본) / 우(After 정제 결과) 2열 나란히
- stacked 모드: 상(Before) -> 하(After) 세로 배치

Before 패널 (원본 인입 데이터):
- 소스 앱 배지 (Slack, Terminal, cURL 등)
- 수신 시각, 글자 수, 줄 수 카운터
- 다크 터미널 스타일 텍스트 뷰어

After 패널 (AI 정제 결과):
- aiTitle, category 배지, tags 칩
- aiSummaryPoints 불릿 목록
- backlinks 위키링크 칩
- confidenceScore 게이지 (90+= 초록, 80~90= 노랑, 80미만= 빨강)
- codeSnippet 코드 블록 (null이면 숨김)

승인/반려 액션:
- [승인] -> App.tsx handleApproveTriageCard() -> POST /api/notes (표준 마크다운 변환 저장)
- [반려] -> DELETE /api/triage/:id

history 탭: 미승인 카드 숨김 + totalApprovedToday 배너 표시

[[AI 정제 파이프라인]] [[Obsidian Slate 아키텍처]]
    `
  },
  {
    sourceHint: "Code Doc / AgentPromptsView.tsx",
    rawContent: `
# AI 에이전트 프롬프트 허브 (AgentPromptsView.tsx)

6종 기본 에이전트 프리셋 (DB 자동 시드):

1. refinery-ingestion v2.3
   비정형 텍스트/코드 -> 구조화된 지식 카드 JSON
   Temperature: 0.1

2. rag-synthesizer v3.2
   pgvector 시맨틱 검색 컨텍스트 + 위키링크 참조 합성
   질문-문서 연관도 기반 답변 생성

3. diff-proposer v1.8
   기존 문서 내용 + 수정 지시사항 -> Git Unified Diff
   diffLines: { type: 'context'|'added'|'removed', content }[]

4. security-auditor v2.0
   내부 IP, 토큰, PII 마스킹 + 금융 보안 규제 준수 검사
   5대 아키텍처 규칙 평가 결과 반환

5. backlink-recommender v1.4
   코사인 유사도 기반 연관 문서 추천 (threshold: 0.70 이상)

6. mermaid-architect v1.5
   텍스트 아키텍처 설명 -> Mermaid.js 다이어그램 코드 생성
   지원: flowchart, sequenceDiagram, erDiagram

Hot-swapping:
POST /api/agent-prompts/:id/activate
-> 서버 재시작 없이 해당 에이전트 타입의 활성 프롬프트 즉시 교체
-> 이후 /api/refinery/analyze 등에서 새 프롬프트 적용

UI 구성:
- 좌측: 에이전트 타입 필터, 카드 선택, 모델/Temperature 설정, 프롬프트 에디터
- 우측: 변수 폼 자동 생성({{변수명}} 파싱), 실시간 AI 실행 테스트, 응답 마크다운 렌더링

[[refinery-ingestion 에이전트]] [[AI 정제 파이프라인]]
    `
  },
  {
    sourceHint: "Architecture Doc / Knowledge Graph Design",
    rawContent: `
# 지식 그래프 2.5D 위상망 설계 (GraphView.tsx)

노드 생성:
- knowledge_documents 테이블의 각 문서 = 노드 1개
- 카테고리별 색상: 인프라 #4cd7f6, 소스코드 #7c3aed, DB #4edea3, 연계 #f59e0b

엣지(링크) 생성:
1. 명시적 위키링크: 본문 내 [[문서명]] -> document_backlinks 엔트리
2. 태그 공유: 동일 태그를 가진 문서 간 점선 연결
3. 시맨틱 유사도: pgvector cosine similarity >= 0.75 (추천)

2.5D 좌표 계산:
- 반지름 280px 원형 배치 (카테고리별 섹터 분할)
- 중심 노드 (연결수 5이상) -> 내부 원 배치
- 고립 노드 -> 외부 링 배치 + HierarchyView에서 자동 배치 기능 제공

드래그-투-링크 (Drag to Link):
- 노드 와이어 핸들 드래그 -> SVG Bezier 가이드 라인 실시간 렌더
- 드롭 완료 -> PUT /api/notes/:id (connectedNodes 업데이트)
- document_backlinks 테이블 즉시 갱신

자동 배치 (HierarchyView):
- backlinks_count === 0인 고립 문서 탐지
- [자동 배치 실행] 클릭 -> 같은 카테고리 메인 문서와 백링크 생성
- PUT /api/notes/:id로 영구 저장

[[pgvector 시맨틱 검색]] [[Obsidian Slate 아키텍처]]
    `
  },
  {
    sourceHint: "Playwright E2E Test Documentation",
    rawContent: `
# Playwright E2E 테스트 스위트 (tests/)

구성 파일:
- tests/app.spec.ts: 핵심 UI 흐름 10개 시나리오
- tests/exploratory_bugs.spec.ts: 잠재 버그 탐색 5개 시나리오
- playwright.config.ts: baseURL=http://localhost:3000, timeout=30000ms

playwright.config.ts 설정:
baseURL: http://localhost:3000
timeout: 30000ms
browser: Chromium 헤드리스

app.spec.ts 커버 시나리오 (10개, 100% PASS):
01. 헤더 & 사이드바 네비게이션 렌더링
02. 노트 선택 & 마크다운 렌더링 (react-markdown + remark-gfm)
03. 노트 직접 편집 & 내용 저장
04. AI 챗 어시스턴트 RAG 질의
05. 지식 그래프 SVG 캔버스
06. 계층 구조 L1-L4 트리
07. 분류 규칙 샌드박스 모달
08. 에이전트 프롬프트 허브 & 실시간 AI 실행
09. 커맨드 팔레트 (Cmd+K)
10. 볼트 가져오기/내보내기 모달

exploratory_bugs.spec.ts 발굴 버그 (5개, 100% PASS):
Bug1: NewNoteModal 긴 마크다운 본문 80자 유실 -> content 필드 보존 수정
Bug2: 노트 상세 뷰 삭제 버튼 누락 -> Trash2 버튼 추가
Bug3: Refinery history 탭 필터 오류 -> 미승인 카드 숨김 처리
Bug4: HierarchyView 고립 노드 자동 배치 검증
Bug5: 커맨드 팔레트 특수문자 정규식 안전성

npm 스크립트:
npm run test:e2e -> npx playwright test (15개, Playwright)
npm run test:backend -> tsx scripts/e2e_test_runner.ts (16개 API)

[[llm-wiki 아키텍처]] [[AI 정제 파이프라인]]
    `
  }
];

async function analyzeWithRefinery(doc: { sourceHint: string; rawContent: string }) {
  const res = await fetch(`${BASE_URL}/api/refinery/analyze`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ rawContent: doc.rawContent.trim(), sourceHint: doc.sourceHint })
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}: ${await res.text()}`);
  const json = await res.json();
  return json.data;
}

async function approveToNotes(card: any): Promise<any> {
  const categoryMap: Record<string, { cat: string; full: string }> = {
    infra: { cat: "인프라", full: "시스템 인프라 정보" },
    code: { cat: "소스코드", full: "소스코드 및 구현 정보" },
    db: { cat: "DB", full: "데이터베이스 정보" },
    workflow: { cat: "워크플로우", full: "업무 및 시스템 흐름" },
    integration: { cat: "연계", full: "외부 시스템 연계 정보" },
  };
  const mapped = categoryMap[card.category] || categoryMap["code"];

  const content = `# ${card.aiTitle}

## 📋 핵심 요약
${(card.aiSummaryPoints || []).map((p: string) => `- ${p}`).join("\n")}

${card.codeSnippet ? `## 💻 코드 / 설정

\`\`\`${card.codeSnippet.language || "text"}
${card.codeSnippet.code}
\`\`\`` : ""}

## 🔗 관련 문서
${(card.backlinks || []).join("  ")}

---
*AI 정제 완료 | 일치율: ${card.confidenceScore}% | 출처: ${card.sourceApp}*
`;

  const notePayload = {
    id: `llmwiki-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    title: card.aiTitle,
    category: mapped.cat,
    categoryFull: mapped.full,
    tags: card.tags || ["#llm-wiki", "#Architecture"],
    content,
    excerpt: content.slice(0, 160),
    statusBadge: "AI 정제 완료",
    badgeType: "ai-refined",
    author: "llm-wiki AI",
    wordCount: content.trim().split(/\s+/).length,
    charCount: content.length,
    readTime: `${Math.max(1, Math.round(content.length / 500))}분 읽기`,
    backlinksCount: (card.backlinks || []).length,
    connectedNodes: card.backlinks || [],
    codeSnippet: card.codeSnippet || null,
    updatedAt: "방금 전"
  };

  const res = await fetch(`${BASE_URL}/api/notes`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(notePayload)
  });
  if (!res.ok) throw new Error(`Save failed HTTP ${res.status}: ${await res.text()}`);
  return await res.json();
}

async function main() {
  console.log("=".repeat(60));
  console.log("🧠 llm-wiki 시스템 문서 AI 정제 적재 파이프라인 시작");
  console.log("=".repeat(60));

  let passed = 0;
  let failed = 0;
  const results: any[] = [];

  for (let i = 0; i < LLM_WIKI_RAW_DOCS.length; i++) {
    const doc = LLM_WIKI_RAW_DOCS[i];
    console.log(`\n[${i + 1}/${LLM_WIKI_RAW_DOCS.length}] 출처: ${doc.sourceHint}`);
    console.log("  ⏳ AI 정제 중...");

    try {
      const card = await analyzeWithRefinery(doc);
      console.log(`  ✅ 정제 완료`);
      console.log(`     제목: ${card.aiTitle}`);
      console.log(`     카테고리: ${card.category} | 일치율: ${card.confidenceScore}%`);
      console.log(`     태그: ${(card.tags || []).join(", ")}`);
      console.log(`     코드 스니펫: ${card.codeSnippet ? "있음 (" + card.codeSnippet.language + ")" : "없음"}`);

      const saved = await approveToNotes(card);
      console.log(`  💾 DB 저장 완료 → ID: ${saved.id}`);
      results.push({ sourceHint: doc.sourceHint, title: card.aiTitle, confidenceScore: card.confidenceScore, id: saved.id });
      passed++;
    } catch (err: any) {
      console.error(`  ❌ 실패: ${err.message}`);
      failed++;
    }

    if (i < LLM_WIKI_RAW_DOCS.length - 1) {
      await new Promise(r => setTimeout(r, 1000));
    }
  }

  console.log("\n" + "=".repeat(60));
  console.log(`📊 결과: 성공 ${passed}건 / 실패 ${failed}건 / 전체 ${LLM_WIKI_RAW_DOCS.length}건`);
  console.log("\n📋 정제된 문서 목록:");
  results.forEach((r, i) => {
    console.log(`  ${i + 1}. [${r.confidenceScore}%] ${r.title}`);
  });

  const health = await fetch(`${BASE_URL}/api/health`).then(r => r.json());
  console.log(`\n📈 DB 현황: 문서 ${health.stats.documentsCount}건, 임베딩 ${health.stats.embeddingsCount}건, 백링크 ${health.stats.backlinksCount}건`);
  console.log("=".repeat(60));
}

main().catch(console.error);
