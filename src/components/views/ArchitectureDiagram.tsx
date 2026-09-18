import React from 'react';
import { Database, Server, Cpu, GitBranch, ArrowRight, CheckCircle2, Layers } from 'lucide-react';

export const ArchitectureDiagram: React.FC = () => {
  return (
    <div className="p-4 rounded-xl bg-[#191b22] border border-[#2e3547] space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Database className="w-4 h-4 text-[#4cd7f6]" />
          <span className="text-sm font-semibold text-[#e2e2eb]">
            PostgreSQL pgvector RAG & 지식 그래프 아키텍처 토폴로지
          </span>
        </div>
        <span className="text-[11px] font-mono text-[#4edea3] bg-[#007650]/20 px-2 py-0.5 rounded border border-[#007650]/40">
          HNSW 768-dim Ready
        </span>
      </div>

      {/* Visual Component Flow */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
        {/* Tier 1: Client / Web UI */}
        <div className="p-3.5 rounded-lg bg-[#0c0e14] border border-[#2e3547] space-y-2">
          <div className="flex items-center gap-2 text-xs font-mono text-[#4cd7f6]">
            <Server className="w-3.5 h-3.5" />
            <span>1. 클라이언트 계층</span>
          </div>
          <div className="text-xs font-medium text-[#e2e2eb]">Obsidian Style UI</div>
          <p className="text-[11px] text-[#958da1] leading-relaxed">
            마크다운 렌더링, 양방향 백링크 탐색기, 실시간 Diff Proposal 리뷰 &amp; 커밋
          </p>
          <div className="flex flex-wrap gap-1 pt-1">
            <span className="px-1.5 py-0.5 rounded bg-[#1e1f26] text-[10px] font-mono text-[#ccc3d8]">React 19</span>
            <span className="px-1.5 py-0.5 rounded bg-[#1e1f26] text-[10px] font-mono text-[#ccc3d8]">Tailwind CSS</span>
          </div>
        </div>

        {/* Tier 2: API Gateway & RAG Engine */}
        <div className="p-3.5 rounded-lg bg-[#0c0e14] border border-[#7c3aed]/50 space-y-2 relative shadow-[0_0_15px_rgba(124,58,237,0.1)]">
          <div className="flex items-center gap-2 text-xs font-mono text-[#d2bbff]">
            <Cpu className="w-3.5 h-3.5 text-[#7c3aed]" />
            <span>2. RAG 파이프라인</span>
          </div>
          <div className="text-xs font-medium text-[#e2e2eb]">Gemini 2.5 + Embed</div>
          <p className="text-[11px] text-[#958da1] leading-relaxed">
            자연어 쿼리 768d 벡터 변환, 문서 자동 청킹(500토큰), Diff 생성기
          </p>
          <div className="flex flex-wrap gap-1 pt-1">
            <span className="px-1.5 py-0.5 rounded bg-[#282a30] text-[10px] font-mono text-[#d2bbff]">text-embed-004</span>
            <span className="px-1.5 py-0.5 rounded bg-[#282a30] text-[10px] font-mono text-[#d2bbff]">Gemini Flash</span>
          </div>
        </div>

        {/* Tier 3: Core Database (PostgreSQL + pgvector) */}
        <div className="p-3.5 rounded-lg bg-[#0c0e14] border border-[#4edea3]/50 space-y-2 relative shadow-[0_0_15px_rgba(78,222,163,0.1)]">
          <div className="flex items-center gap-2 text-xs font-mono text-[#4edea3]">
            <Database className="w-3.5 h-3.5" />
            <span>3. All-in-One DB</span>
          </div>
          <div className="text-xs font-medium text-[#e2e2eb]">PostgreSQL 16</div>
          <p className="text-[11px] text-[#958da1] leading-relaxed">
            pgvector HNSW 인덱스 코사인 유사도 검색 + 재귀 CTE 그래프 순회
          </p>
          <div className="flex flex-wrap gap-1 pt-1">
            <span className="px-1.5 py-0.5 rounded bg-[#1e1f26] text-[10px] font-mono text-[#4edea3]">documents</span>
            <span className="px-1.5 py-0.5 rounded bg-[#1e1f26] text-[10px] font-mono text-[#4edea3]">document_links</span>
            <span className="px-1.5 py-0.5 rounded bg-[#1e1f26] text-[10px] font-mono text-[#4edea3]">pgvector</span>
          </div>
        </div>

        {/* Tier 4: Cache & Message Broker */}
        <div className="p-3.5 rounded-lg bg-[#0c0e14] border border-[#2e3547] space-y-2">
          <div className="flex items-center gap-2 text-xs font-mono text-[#ffb4ab]">
            <GitBranch className="w-3.5 h-3.5" />
            <span>4. 캐시 &amp; 이벤트</span>
          </div>
          <div className="text-xs font-medium text-[#e2e2eb]">Redis &amp; Kafka</div>
          <p className="text-[11px] text-[#958da1] leading-relaxed">
            임베딩 캐시 TTL, 분산 락(Redlock), 문서 변경 비동기 색인 이벤트 발행
          </p>
          <div className="flex flex-wrap gap-1 pt-1">
            <span className="px-1.5 py-0.5 rounded bg-[#1e1f26] text-[10px] font-mono text-[#ffb4ab]">Redis Cluster</span>
            <span className="px-1.5 py-0.5 rounded bg-[#1e1f26] text-[10px] font-mono text-[#ffb4ab]">Kafka Topic</span>
          </div>
        </div>
      </div>

      {/* SQL & Query Highlights Bento */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
        <div className="p-3 rounded-lg bg-[#0c0e14] border border-[#2e3547] space-y-1.5">
          <div className="flex items-center justify-between text-[11px] font-mono">
            <span className="text-[#4cd7f6] flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3 text-[#4edea3]" />
              RAG 벡터 코사인 검색 (HNSW)
            </span>
            <span className="text-[#958da1]">&lt; 12ms</span>
          </div>
          <code className="block text-[11px] font-mono text-[#ccc3d8] bg-[#191b22] p-2 rounded">
            SELECT title, 1 - (embedding &lt;=&gt; $vector) AS score FROM document_chunks ORDER BY score DESC LIMIT 5;
          </code>
        </div>

        <div className="p-3 rounded-lg bg-[#0c0e14] border border-[#2e3547] space-y-1.5">
          <div className="flex items-center justify-between text-[11px] font-mono">
            <span className="text-[#d2bbff] flex items-center gap-1">
              <Layers className="w-3 h-3 text-[#7c3aed]" />
              백링크 2-Hop 재귀 CTE 탐색
            </span>
            <span className="text-[#958da1]">Graph Topology</span>
          </div>
          <code className="block text-[11px] font-mono text-[#ccc3d8] bg-[#191b22] p-2 rounded">
            WITH RECURSIVE backlink_tree AS (...) SELECT doc_id, depth FROM backlink_tree WHERE depth &lt; 3;
          </code>
        </div>
      </div>
    </div>
  );
};
