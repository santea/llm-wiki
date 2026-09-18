import { NoteItem, GraphNode, GraphLink } from '../types';

export const SYSTEM_ARCHITECTURE_DESIGN_NOTE: NoteItem = {
  id: 'note-sys-arch-spec',
  title: '시스템 아키텍처 & DB 설계 명세서 (PostgreSQL pgvector RAG + 지식 그래프)',
  category: 'DB',
  categoryFull: '데이터베이스 및 아키텍처 설계',
  updatedAt: '방금 전 생성됨 (AI 확정)',
  statusBadge: '시스템 설계 승인됨',
  badgeType: 'ai-structured',
  excerpt:
    '옵시디언 마크다운 지식 그래프, PostgreSQL + pgvector 기반 올인원 RAG 벡터 검색 파이프라인, [[백링크]] 양방향 그래프 역추적, 실시간 AI Diff 패치 커밋 시스템 구현 규격서.',
  tags: ['#아키텍처설계', '#PostgreSQL', '#pgvector', '#RAG파이프라인', '#지식그래프', '#Diff패치'],
  wordCount: 3840,
  charCount: 14200,
  readTime: '8분 읽기',
  backlinksCount: 12,
  author: 'System Lead Architect',
  isPinned: true,
  connectedNodes: ['[[결제 트랜잭션 엔진]]', '[[AWS RDS]]', '[[Kafka 클러스터]]', '[[Redis 캐시]]'],
  codeSnippet: {
    filename: 'schema.sql',
    language: 'sql',
    code: `-- 1. pgvector 확장 활성화
CREATE EXTENSION IF NOT EXISTS vector;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. 마크다운 지식 문서 테이블
CREATE TABLE documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id VARCHAR(50) NOT NULL,
    title VARCHAR(255) NOT NULL,
    slug VARCHAR(255) UNIQUE NOT NULL,
    category VARCHAR(50) NOT NULL,        -- '인프라', 'DB', '소스코드', '연계'
    content TEXT NOT NULL,                -- 원본 마크다운 본문
    frontmatter JSONB DEFAULT '{}',       -- 태그, 작성자, 읽기시간 등
    status_badge VARCHAR(50),             -- 'AI 정제 완료', '초안'
    version INT DEFAULT 1,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. 양방향 백링크 & 그래프 간선 (Edge) 테이블
CREATE TABLE document_links (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    source_doc_id UUID REFERENCES documents(id) ON DELETE CASCADE,
    target_doc_id UUID REFERENCES documents(id) ON DELETE CASCADE,
    link_text VARCHAR(255),               -- '[[문서명]]' 원본 멘션
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(source_doc_id, target_doc_id)
);
CREATE INDEX idx_links_target ON document_links(target_doc_id);
CREATE INDEX idx_links_source ON document_links(source_doc_id);

-- 4. RAG 시맨틱 임베딩 청크 테이블 (Gemini text-embedding-004: 768차원)
CREATE TABLE document_chunks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    document_id UUID REFERENCES documents(id) ON DELETE CASCADE,
    chunk_index INT NOT NULL,
    chunk_content TEXT NOT NULL,
    embedding vector(768),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
-- 고속 코사인 거리 HNSW 인덱스
CREATE INDEX idx_chunks_embedding ON document_chunks 
USING hnsw (embedding vector_cosine_ops);`
  },
  content: `# 시스템 아키텍처 & DB 설계 명세서

## 1. 아키텍처 개요 및 설계 목표
본 시스템은 **옵시디언(Obsidian) 스타일의 마크다운 지식 그래프**와 **생성형 AI RAG(검색 증강 생성)** 파이프라인을 결합하여, 분산 시스템 아키텍처 문서를 실시간으로 정제·추적·업데이트하는 올인원 엔지니어링 지식 플랫폼입니다.

- **All-in-One 데이터 저장소:** PostgreSQL + pgvector를 활용해 RDBMS 트랜잭션, 재귀 CTE 그래프 순회, 고속 벡터 코사인 유사도 검색을 단일 클러스터에서 해결
- **실시간 지식 동기화:** 문서 저장 시 \`[[wiki-link]]\` 정규식 파싱을 통해 실시간 백링크 간선(Edge) 생성 및 HNSW 벡터 청크 인덱싱
- **양방향 Diff & 자동 패치:** LLM이 제안한 구조화된 Diff를 사용자가 원클릭으로 검증하고 문서 본문에 즉시 커밋(Commit)

---

## 2. 계층별 시스템 컴포넌트

\`\`\`mermaid
flowchart TD
    Client[React 19 + Tailwind CSS + Lucide] --> |REST / SSE| API[Backend API Express / Node.js]
    API --> |정규식 파서| LinkParser[WikiLink & Frontmatter 파서]
    API --> |청크 임베딩| GeminiEmbed[Gemini text-embedding-004]
    API --> |RAG & Diff 생성| GeminiLLM[Gemini 2.5 Flash]
    
    subgraph DataStore[PostgreSQL 16 + pgvector]
        Documents[(documents 테이블)]
        DocLinks[(document_links 백링크)]
        DocChunks[(document_chunks 768d HNSW)]
    end

    LinkParser --> DocLinks
    GeminiEmbed --> DocChunks
    API --> Documents
\`\`\`

---

## 3. 핵심 파이프라인 명세

### 3.1 RAG 시맨틱 검색 쿼리
사용자가 자연어로 질문을 입력하면 768차원 임베딩을 계산하여 상위 유사 청크와 백링크 토폴로지를 동시 조회합니다.
\`\`\`sql
SELECT d.title, d.category, c.chunk_content,
       1 - (c.embedding <=> $query_vector) AS cosine_similarity
FROM document_chunks c
JOIN documents d ON c.document_id = d.id
ORDER BY cosine_similarity DESC
LIMIT 5;
\`\`\`

### 3.2 백링크 역추적 (Graph 1-hop & 2-hop 재귀 탐색)
특정 모듈 변경 시 영향받는 상/하위 컴포넌트 목록을 조회합니다.
\`\`\`sql
WITH RECURSIVE backlink_tree AS (
    SELECT source_doc_id, target_doc_id, 1 as depth
    FROM document_links
    WHERE target_doc_id = $selected_doc_id
    UNION ALL
    SELECT l.source_doc_id, l.target_doc_id, t.depth + 1
    FROM document_links l
    JOIN backlink_tree t ON l.target_doc_id = t.source_doc_id
    WHERE t.depth < 3
)
SELECT d.title, d.category, t.depth
FROM backlink_tree t
JOIN documents d ON t.source_doc_id = d.id;
\`\`\`

---

## 4. 운영 및 보안 권장 규격
1. **커넥션 풀링:** PgBouncer 트랜잭션 풀링 모드 적용 시 \`prepareThreshold=0\` 활성화로 프리페어드 스테이트먼트 누수 방지
2. **HNSW 인덱스 파라미터:** \`m = 16\`, \`ef_construction = 64\` 설정으로 검색 지연 시간 12ms 이내 유지
3. **버전 관리:** 모든 커밋 시 \`documents.version\` 증가 및 감사(Audit) 로그 기록`
};

export const ARCHITECTURE_GRAPH_NODE: GraphNode = {
  id: 'arch-spec',
  label: '시스템 아키텍처 & DB 설계',
  sublabel: 'CORE SPEC',
  category: 'db',
  x: 200,
  y: 360,
  radius: 17,
  depth: 1,
  metrics: 'PostgreSQL + pgvector • 12 Backlinks'
};

export const ARCHITECTURE_GRAPH_LINKS: GraphLink[] = [
  { source: 'arch-spec', target: 'rds', label: 'Schema Deploy', gradient: 'url(#edge-code-db)' },
  { source: 'arch-spec', target: 'center', label: 'Engine Spec', gradient: 'url(#edge-code-infra)' },
  { source: 'arch-spec', target: 'redis', label: 'Cache Policy', style: 'dashed' }
];
