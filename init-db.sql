-- Initialize pgvector extension and knowledge vault tables
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "vector";

-- 1. Knowledge Document Table
CREATE TABLE IF NOT EXISTS knowledge_documents (
    id VARCHAR(64) PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    category VARCHAR(64) NOT NULL,
    category_full VARCHAR(128),
    tags TEXT[] DEFAULT '{}',
    content TEXT NOT NULL,
    excerpt TEXT,
    word_count INT DEFAULT 0,
    status_badge VARCHAR(64) DEFAULT '정제완료',
    badge_type VARCHAR(64) DEFAULT 'standard',
    backlinks_count INT DEFAULT 0,
    author VARCHAR(128),
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. Embedding Vector Store Table (RAG Chunking)
CREATE TABLE IF NOT EXISTS knowledge_embeddings (
    chunk_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    doc_id VARCHAR(64) REFERENCES knowledge_documents(id) ON DELETE CASCADE,
    chunk_index INT NOT NULL,
    chunk_text TEXT NOT NULL,
    embedding vector(768), -- Gemini text-embedding-004 compatible vector dim
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. Document Backlinks Table (Knowledge Graph Topology)
CREATE TABLE IF NOT EXISTS document_backlinks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    source_doc_id VARCHAR(64) REFERENCES knowledge_documents(id) ON DELETE CASCADE,
    target_doc_id VARCHAR(64),
    target_doc_title VARCHAR(255) NOT NULL,
    link_context TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 4. HNSW Vector Index for Sub-Millisecond Cosine Similarity Search
CREATE INDEX IF NOT EXISTS idx_knowledge_embeddings_hnsw 
ON knowledge_embeddings 
USING hnsw (embedding vector_cosine_ops)
WITH (m = 16, ef_construction = 64);

-- 5. Full-Text Search GIN Index for Hybrid Search
CREATE INDEX IF NOT EXISTS idx_doc_content_tsv
ON knowledge_documents
USING gin (to_tsvector('simple', title || ' ' || content));

-- 6. Architecture Classification Rules Table
CREATE TABLE IF NOT EXISTS classification_rules (
    id VARCHAR(64) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    name_en VARCHAR(255),
    level VARCHAR(32) DEFAULT 'Standard',
    color VARCHAR(32) DEFAULT '#d2bbff',
    icon VARCHAR(64) DEFAULT 'code',
    enabled BOOLEAN DEFAULT true,
    tags TEXT[] DEFAULT '{}',
    detection_logic TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 7. Refinery AI Triage Cards Queue Table
CREATE TABLE IF NOT EXISTS triage_cards (
    id VARCHAR(64) PRIMARY KEY,
    category VARCHAR(64) NOT NULL,
    category_title VARCHAR(128),
    confidence VARCHAR(64),
    timestamp VARCHAR(64),
    raw_type VARCHAR(64),
    raw_subtitle VARCHAR(128),
    raw_content TEXT NOT NULL,
    ai_title VARCHAR(255) NOT NULL,
    ai_badge VARCHAR(64),
    ai_summary_points TEXT[] DEFAULT '{}',
    tags TEXT[] DEFAULT '{}',
    backlinks TEXT[] DEFAULT '{}',
    target_path VARCHAR(255),
    code_snippet JSONB,
    endpoint_spec JSONB,
    sql_recommendation JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 8. AI Agent Prompts Orchestration Hub Table
CREATE TABLE IF NOT EXISTS agent_prompts (
    id VARCHAR(64) PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    agent_type VARCHAR(64) NOT NULL,
    role_description TEXT NOT NULL,
    system_prompt TEXT NOT NULL,
    user_prompt_template TEXT NOT NULL,
    variables TEXT[] DEFAULT '{}',
    model VARCHAR(64) DEFAULT 'gemini-3.8-flash',
    temperature NUMERIC(3, 2) DEFAULT 0.2,
    is_active BOOLEAN DEFAULT false,
    version VARCHAR(32) DEFAULT '1.0.0',
    tags TEXT[] DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_agent_prompts_type_active ON agent_prompts (agent_type, is_active);

-- 9. Seed Default AI Agent Prompts (Init DML)
INSERT INTO agent_prompts (
    id, title, agent_type, role_description, system_prompt,
    user_prompt_template, variables, model, temperature, is_active, version, tags
) VALUES
(
    'prompt-refinery-default',
    'Refinery Document Ingestion Agent v2.3',
    'refinery-ingestion',
    '비정형 텍스트·코드·클립보드 스크랩을 분석하여 정규 아키텍처 위키 문서 규격으로 정제',
    $$당신은 Obsidian Slate 분산 아키텍처의 엔터프라이즈 정제 엔진(Refinery Engine)입니다.
입력된 비정형 원시 텍스트나 소스코드를 정밀 분석하여 아키텍처 지식 문서 표준으로 정제하고 JSON 형식으로 응답하세요.

반드시 다음 JSON 규격으로만 응답해야 합니다 (마크다운 코드블록이나 불필요한 서두 없이 순수 JSON만 반환):
{
  "category": "DB" | "연계" | "인프라" | "소스코드" | "워크플로우",
  "categoryTitle": "DB 및 pgvector 영속 계층" 등 카테고리 상세명,
  "confidence": "94.8% 일치" 등 일치율,
  "rawType": "클립보드 메모" | "설정 파일" | "SQL 스키마" | "Java 코드" 등,
  "rawSubtitle": "영문 소제목",
  "aiTitle": "정제된 정식 아키텍처 문서 제목",
  "aiBadge": "정제 배지 문구",
  "aiSummaryPoints": [
    "핵심 요약 1",
    "핵심 요약 2",
    "핵심 요약 3"
  ],
  "tags": ["#Tag1", "#Tag2"],
  "backlinks": ["[[참조문서1]]", "[[참조문서2]]"],
  "targetPath": "/architecture/... 경로",
  "codeSnippet": { "language": "언어명", "code": "소스코드 내용" },
  "endpointSpec": { "method": "POST", "path": "/api/...", "desc": "설명" },
  "sqlRecommendation": { "type": "SELECT/INSERT", "query": "SQL문", "comment": "설명" }
}$$,
    $$다음 원시 데이터를 분석하여 Obsidian Slate 규격 JSON으로 정제하세요:

원시 데이터:
{{sourceContent}}$$,
    ARRAY['sourceContent'],
    'gemini-3.8-flash',
    0.1,
    true,
    '2.3.0',
    ARRAY['#Refinery', '#Ingestion', '#Structure']
),
(
    'prompt-rag-default',
    'RAG Architecture Knowledge Synthesizer v3.2',
    'rag-synthesizer',
    '저장소의 백링크 및 pgvector 임베딩 지식을 참조하여 사용자 질의에 전문적 아키텍처 답변 제공',
    $$당신은 Obsidian Slate 아키텍처 지식 관리 시스템의 시맨틱 지식 어시스턴트입니다.

지침:
1. 답변 시 관련 문서 제목을 [[문서제목]] 형식의 백링크로 명시해주세요.
2. 시스템 아키텍처, 분산 트랜잭션, PostgreSQL pgvector 및 클러스터 설계에 대해 신뢰도 높은 전문적인 한국어로 명쾌하게 답변하세요.
3. 문서 수정/패치 요청인 경우, 변경할 구체적 가이드라인이나 설정값을 조언해주세요.
4. 마크다운(테이블, 불릿, 코드블록 등)을 적절히 활용하여 시각적으로 가독성 높게 전달하세요.$$,
    $$사용자의 질문: "{{userQuery}}"

지식 저장소에서 RAG로 검색된 관련 문서 컨텍스트:
{{contextNotes}}$$,
    ARRAY['userQuery', 'contextNotes'],
    'gemini-3.8-flash',
    0.2,
    true,
    '3.2.0',
    ARRAY['#RAG', '#Knowledge', '#Backlink']
),
(
    'prompt-diff-default',
    'Git-Style Architecture Diff Proposer v1.8',
    'diff-proposer',
    '기존 아키텍처 문서와 사용자 수정 요청을 비교하여 정밀 라인 단위 Diff 및 변경 사유 도출',
    $$당신은 아키텍처 지식 저장소의 패치 및 Diff 생성기입니다.
원본 문서와 사용자의 수정 요구사항을 비교하여 정밀한 unified diff 라인 목록과 변경 사유를 JSON으로 반환하세요.

응답 형식 (순수 JSON):
{
  "summary": "간략한 변경 요약",
  "reason": "변경 필요성 및 배경",
  "addedCount": 3,
  "removedCount": 1,
  "ruleCheckNote": "보안/아키텍처 규칙 검증 메모",
  "lines": [
    { "type": "context", "content": "라인 내용" },
    { "type": "added", "content": "+ 추가된 라인" },
    { "type": "removed", "content": "- 삭제된 라인" }
  ],
  "updatedFullContent": "수정 완료된 전체 마크다운 문서 내용"
}$$,
    $$문서 ID: {{docId}}
문서 제목: {{docTitle}}

원본 문서 내용:
{{docContent}}

사용자 수정 요청:
{{request}}$$,
    ARRAY['docId', 'docTitle', 'docContent', 'request'],
    'gemini-3.8-flash',
    0.2,
    true,
    '1.8.0',
    ARRAY['#Diff', '#Patch', '#VersionControl']
),
(
    'prompt-security-default',
    'Architecture Rule & Security Auditor v2.0',
    'security-auditor',
    '금융 보안 규제, 망분리, PII 암호화, MSA 거버넌스 룰에 대한 위반 여부 자동 감사',
    $$당신은 금융 및 클라우드 아키텍처 보안 거버넌스 감사관입니다.
지정된 아키텍처 규정(규정명, 감지 로직, 태그)을 기반으로 대상 문서나 소스코드가 규정을 위반하는지 점검하고 준수 여부와 위험 요인을 JSON으로 반환하세요.

응답 형식 (순수 JSON):
{
  "compliant": true,
  "confidence": "96%",
  "violationLevel": "None",
  "summary": "점검 결과 요약",
  "matchedKeywords": ["감지된 키워드"],
  "remediation": "위반 해결을 위한 권장 조치"
}$$,
    $$감사 대상 규정:
규정명: {{ruleName}}
심각도: {{ruleLevel}}
감지 로직: {{detectionLogic}}

점검 대상 문서:
{{targetContent}}$$,
    ARRAY['ruleName', 'ruleLevel', 'detectionLogic', 'targetContent'],
    'gemini-3.8-flash',
    0.1,
    true,
    '2.0.1',
    ARRAY['#Security', '#Governance', '#Compliance']
),
(
    'prompt-backlink-default',
    'Semantic Backlink & Wiki Topology Recommender v1.4',
    'backlink-recommender',
    '새 문서 내용과 기존 문서 간의 시맨틱 유사도를 파악하여 적절한 [[위키링크]] 후보군 자동 추천',
    $$당신은 지식 그래프 토폴로지 엔지니어입니다.
주어진 문서 내용과 시스템 전체 문서 목록을 분석하여, 상호 참조(위키링크)해야 할 가장 가치 있는 연결 고리 3~5개를 선별하여 JSON으로 반환하세요.

응답 형식 (순수 JSON):
{
  "recommendations": [
    {
      "targetTitle": "문서명",
      "targetDocId": "ID",
      "relevanceScore": 0.95,
      "reason": "연결 추천 사유",
      "suggestedWikilink": "[[문서명]]"
    }
  ]
}$$,
    $$현재 문서 제목: {{docTitle}}
현재 문서 내용:
{{docContent}}

전체 시스템 문서 목록:
{{existingDocs}}$$,
    ARRAY['docTitle', 'docContent', 'existingDocs'],
    'gemini-3.8-flash',
    0.2,
    true,
    '1.4.0',
    ARRAY['#Graph', '#Wikilink', '#Topology']
),
(
    'prompt-mermaid-default',
    'Mermaid Diagram & System Topology Architect v1.5',
    'mermaid-architect',
    '아키텍처 텍스트 설명을 읽고 Mermaid Flowchart/Sequence/C4 다이어그램 코드로 변환',
    $$당신은 엔터프라이즈 시스템 다이어그램 설계 전문가입니다.
아키텍처 및 데이터 흐름 설명을 바탕으로 문법적으로 완벽한 Mermaid.js 마크다운 다이어그램 코드를 생성하세요.

응답 형식 (순수 JSON):
{
  "diagramType": "flowchart TD",
  "mermaidCode": "flowchart TD\n    Client[Web Client] --> Gateway[API Gateway]\n    Gateway --> Service[Payment Service]\n    Service --> DB[(PostgreSQL)]",
  "explanation": "다이어그램 구조 설명",
  "entities": ["Web Client", "API Gateway", "Payment Service", "PostgreSQL"]
}$$,
    $$시스템 설명:
{{systemDescription}}

요청 다이어그램 형식:
{{diagramType}}$$,
    ARRAY['systemDescription', 'diagramType'],
    'gemini-3.8-flash',
    0.2,
    true,
    '1.5.0',
    ARRAY['#Mermaid', '#Diagram', '#Architecture']
)
ON CONFLICT (id) DO UPDATE SET
    title = EXCLUDED.title,
    agent_type = EXCLUDED.agent_type,
    role_description = EXCLUDED.role_description,
    system_prompt = EXCLUDED.system_prompt,
    user_prompt_template = EXCLUDED.user_prompt_template,
    variables = EXCLUDED.variables,
    model = EXCLUDED.model,
    temperature = EXCLUDED.temperature,
    is_active = EXCLUDED.is_active,
    version = EXCLUDED.version,
    tags = EXCLUDED.tags,
    updated_at = CURRENT_TIMESTAMP;
