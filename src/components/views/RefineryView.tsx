import React, { useState } from 'react';
import {
  Sparkles,
  Zap,
  CheckCircle2,
  Trash2,
  Sliders,
  FolderOpen,
  Terminal,
  MessageSquare,
  Code2,
  Database,
  CheckCheck,
  RefreshCw,
  Edit3
} from 'lucide-react';
import { TriageCardData } from '../../types';

interface RefineryViewProps {
  items: TriageCardData[];
  onApproveCard: (id: string) => void;
  onDismissCard: (id: string) => void;
  onApproveAll: () => void;
  onShowToast: (msg: string) => void;
  onResetItems: () => void;
}

export const RefineryView: React.FC<RefineryViewProps> = ({
  items,
  onApproveCard,
  onDismissCard,
  onApproveAll,
  onShowToast,
  onResetItems
}) => {
  const [activeFilter, setActiveFilter] = useState<'all' | 'infra' | 'code' | 'db' | 'history'>('all');

  const filteredItems = items.filter((item) => {
    if (activeFilter === 'all') return true;
    if (activeFilter === 'infra') return item.category === 'infra';
    if (activeFilter === 'code') return item.category === 'code';
    if (activeFilter === 'db') return item.category === 'db';
    return true;
  });

  return (
    <div className="flex flex-col w-full pb-32 space-y-4 animate-in fade-in duration-200">
      {/* Top Ambient Header Stats Banner */}
      <section className="relative px-4 pt-4 pb-2 flex flex-col gap-3 overflow-hidden">
        <div className="absolute -top-16 left-1/2 -translate-x-1/2 w-80 h-32 bg-[#7c3aed]/15 blur-3xl pointer-events-none rounded-full"></div>

        <div className="flex items-center justify-between z-10">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-[#4edea3] animate-pulse shadow-[0_0_8px_rgba(78,222,163,0.8)]"></div>
            <span className="text-xs font-mono font-semibold uppercase tracking-wider text-[#4cd7f6]">
              Refinery Engine v3.4 Active
            </span>
          </div>
          <span className="text-[11px] font-mono text-[#958da1] flex items-center gap-1">
            <Zap className="w-3.5 h-3.5 text-[#4edea3]" />
            실시간 지능형 분석
          </span>
        </div>

        {/* Telemetry Metric Pills Grid */}
        <div className="grid grid-cols-3 gap-2.5 z-10">
          <div className="bg-[#191b22] border border-[#2e3547] p-3 rounded-xl flex flex-col justify-between shadow-sm">
            <span className="text-xs text-[#958da1]">정제 대기</span>
            <div className="flex items-baseline gap-1 mt-1">
              <span className="text-2xl font-bold text-[#4cd7f6]">{items.length}</span>
              <span className="text-xs text-[#958da1]">건</span>
            </div>
          </div>

          <div className="bg-[#191b22] border border-[#2e3547] p-3 rounded-xl flex flex-col justify-between shadow-sm">
            <span className="text-xs text-[#958da1]">자동 승인 (오늘)</span>
            <div className="flex items-baseline gap-1 mt-1">
              <span className="text-2xl font-bold text-[#4edea3]">18</span>
              <span className="text-xs text-[#958da1]">건</span>
            </div>
          </div>

          <div className="bg-[#191b22] border border-[#2e3547] p-3 rounded-xl flex flex-col justify-between shadow-sm">
            <span className="text-xs text-[#958da1]">규칙 일치율</span>
            <div className="flex items-baseline gap-0.5 mt-1">
              <span className="text-2xl font-bold text-[#d2bbff]">98.4</span>
              <span className="text-xs text-[#d2bbff]">%</span>
            </div>
          </div>
        </div>
      </section>

      {/* Filter Category Chips Bar */}
      <section className="px-4 py-1 flex items-center gap-1.5 overflow-x-auto no-scrollbar">
        {[
          { id: 'all' as const, label: '전체 대기', count: items.length },
          { id: 'infra' as const, label: '인프라', count: items.filter((i) => i.category === 'infra').length },
          { id: 'code' as const, label: '코드/연동', count: items.filter((i) => i.category === 'code').length },
          { id: 'db' as const, label: 'DB', count: items.filter((i) => i.category === 'db').length },
          { id: 'history' as const, label: '완료 내역', count: null }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveFilter(tab.id)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-mono shrink-0 transition-all ${
              activeFilter === tab.id
                ? 'bg-[#7c3aed] text-white font-medium shadow-[0_0_12px_rgba(124,58,237,0.3)]'
                : 'bg-[#191b22] text-[#ccc3d8] hover:bg-[#282a30] border border-[#2e3547]'
            }`}
          >
            <span>{tab.label}</span>
            {tab.count !== null && (
              <span className="px-1.5 py-0.2 rounded-full bg-white/20 text-[10px] font-bold">
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </section>

      {/* Triage Cards Stack */}
      <section className="px-4 space-y-4">
        {filteredItems.length === 0 ? (
          /* Empty State */
          <div className="flex flex-col items-center justify-center p-8 text-center bg-[#191b22] border border-[#2e3547] rounded-xl space-y-3">
            <div className="w-14 h-14 rounded-full bg-[#007650]/20 text-[#4edea3] flex items-center justify-center">
              <CheckCheck className="w-7 h-7" />
            </div>
            <h3 className="text-base font-semibold text-[#e2e2eb]">모든 정제 대기열이 비었습니다!</h3>
            <p className="text-xs text-[#958da1] max-w-xs leading-relaxed">
              수집된 원본 메모가 시스템 아키텍처 규칙에 따라 완벽히 분류 및 지식 그래프에 색인되었습니다.
            </p>
            <button
              onClick={onResetItems}
              className="mt-2 px-4 py-2 rounded-lg bg-[#282a30] hover:bg-[#33343b] text-[#4cd7f6] text-xs font-mono flex items-center gap-1.5 transition-colors border border-[#33343b]"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>새로운 원본 메모 스캔</span>
            </button>
          </div>
        ) : (
          filteredItems.map((item) => (
            <article
              key={item.id}
              className="group relative flex flex-col rounded-xl bg-[#191b22] border border-[#2e3547] shadow-md overflow-hidden transition-all duration-200"
            >
              {/* Neon Top Indicator Bar */}
              <div
                className={`h-1 w-full ${
                  item.category === 'infra'
                    ? 'bg-gradient-to-r from-[#4edea3] via-[#4cd7f6] to-[#7c3aed]'
                    : item.category === 'code'
                    ? 'bg-gradient-to-r from-[#4cd7f6] via-[#d2bbff] to-[#7c3aed]'
                    : 'bg-gradient-to-r from-[#03b5d3] via-[#4cd7f6] to-[#7c3aed]'
                }`}
              ></div>

              <div className="p-4 space-y-3.5">
                {/* Header Bar */}
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span
                      className={`px-2.5 py-0.5 rounded-md text-xs font-mono font-semibold flex items-center gap-1 ${
                        item.category === 'infra'
                          ? 'bg-[#007650]/30 text-[#4edea3]'
                          : item.category === 'code'
                          ? 'bg-[#03b5d3]/20 text-[#4cd7f6]'
                          : 'bg-[#03b5d3]/20 text-[#4cd7f6]'
                      }`}
                    >
                      {item.categoryTitle}
                    </span>
                    <span className="px-2 py-0.5 rounded-md bg-[#282a30] text-[#958da1] text-xs font-mono">
                      {item.confidence}
                    </span>
                  </div>
                  <span className="text-xs font-mono text-[#958da1]">{item.timestamp}</span>
                </div>

                {/* Raw Input vs AI Output */}
                <div className="space-y-2.5">
                  {/* User Raw Input */}
                  <div className="bg-[#0c0e14] border border-[#2e3547]/60 p-3 rounded-lg space-y-1">
                    <div className="flex items-center justify-between text-xs text-[#958da1]">
                      <span className="flex items-center gap-1 font-mono">
                        {item.category === 'infra' && <Terminal className="w-3.5 h-3.5" />}
                        {item.category === 'code' && <MessageSquare className="w-3.5 h-3.5" />}
                        {item.category === 'db' && <Code2 className="w-3.5 h-3.5" />}
                        {item.rawType}
                      </span>
                      <span className="text-[10px] font-mono text-[#4a4455]">{item.rawSubtitle}</span>
                    </div>
                    <p className="text-xs font-mono text-[#ccc3d8] leading-relaxed break-words">
                      {item.rawContent}
                    </p>
                  </div>

                  {/* AI Refined Output Card */}
                  <div className="bg-[#1e1f26] border border-[#7c3aed]/30 p-3.5 rounded-lg space-y-2.5 relative">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5 text-[#d2bbff]">
                        <Sparkles className="w-4 h-4" />
                        <span className="text-xs font-mono font-semibold">{item.aiTitle}</span>
                      </div>
                      <span className="text-[11px] font-mono text-[#4cd7f6] bg-[#03b5d3]/10 px-2 py-0.5 rounded">
                        {item.aiBadge}
                      </span>
                    </div>

                    {/* Summary points if infra */}
                    {item.aiSummaryPoints && (
                      <ul className="space-y-1 text-xs text-[#e2e2eb]">
                        {item.aiSummaryPoints.map((pt, idx) => (
                          <li key={idx} className="flex items-start gap-1.5">
                            <span className="text-[#4cd7f6] font-bold text-xs mt-0.5">•</span>
                            <span>{pt}</span>
                          </li>
                        ))}
                      </ul>
                    )}

                    {/* Endpoint spec if code */}
                    {item.endpointSpec && (
                      <div className="bg-[#191b22] border border-[#2e3547] p-2.5 rounded-lg space-y-1 font-mono text-xs">
                        <div className="flex items-center justify-between">
                          <span className="text-[#958da1]">엔드포인트:</span>
                          <span className="text-[#4cd7f6] font-bold">{item.endpointSpec.endpoint}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-[#958da1]">타임아웃 한도:</span>
                          <span className="text-[#ffb4ab]">{item.endpointSpec.timeout}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-[#958da1]">재시도 정책:</span>
                          <span className="text-[#e2e2eb]">{item.endpointSpec.retry}</span>
                        </div>
                      </div>
                    )}

                    {/* SQL recommendation if db */}
                    {item.sqlRecommendation && (
                      <div className="space-y-2 font-mono text-xs">
                        <p className="text-[#4edea3] text-[11px]">{item.sqlRecommendation.performance}</p>
                        <div className="p-2.5 rounded bg-[#0c0e14] text-[#4edea3] overflow-x-auto">
                          <code>{item.sqlRecommendation.indexDdl}</code>
                        </div>
                      </div>
                    )}

                    {/* Tags / Backlinks */}
                    <div className="flex items-center gap-1.5 flex-wrap pt-1">
                      {item.tags.map((tag) => (
                        <span
                          key={tag}
                          className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#282a30] text-[#ccc3d8]"
                        >
                          {tag}
                        </span>
                      ))}
                      {item.backlinks?.map((bl) => (
                        <span
                          key={bl}
                          className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#7c3aed]/20 text-[#d2bbff]"
                        >
                          {bl}
                        </span>
                      ))}
                    </div>

                    {/* Path Target */}
                    <div className="flex items-center gap-1.5 pt-1 text-xs font-mono text-[#958da1] bg-[#191b22] px-2 py-1.5 rounded">
                      <FolderOpen className="w-3.5 h-3.5 shrink-0" />
                      <span className="text-[#958da1] shrink-0">저장 경로:</span>
                      <span className="text-[#e2e2eb] truncate">{item.targetPath}</span>
                    </div>
                  </div>
                </div>

                {/* Footer Action Buttons */}
                <div className="flex items-center justify-between gap-2 pt-1 border-t border-[#2e3547]/50">
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => onDismissCard(item.id)}
                      className="px-3 py-1.5 rounded-lg bg-[#282a30] hover:bg-[#33343b] text-[#958da1] hover:text-[#ffb4ab] text-xs font-mono flex items-center gap-1 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>폐기</span>
                    </button>
                    <button
                      onClick={() => onShowToast('카테고리 수정 창이 열렸습니다.')}
                      className="px-3 py-1.5 rounded-lg bg-[#282a30] hover:bg-[#33343b] text-[#ccc3d8] text-xs font-mono flex items-center gap-1 transition-colors"
                    >
                      <Sliders className="w-3.5 h-3.5" />
                      <span>카테고리</span>
                    </button>
                  </div>

                  <button
                    onClick={() => onApproveCard(item.id)}
                    className="px-4 py-1.5 rounded-lg bg-[#7c3aed] hover:bg-[#6d28d9] text-white text-xs font-semibold flex items-center gap-1.5 shadow-[0_0_12px_rgba(124,58,237,0.35)] transition-all active:scale-95"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>승인 및 지식 보관</span>
                  </button>
                </div>
              </div>
            </article>
          ))
        )}
      </section>

      {/* Sticky Batch Action Footer Bar */}
      {items.length > 0 && (
        <aside className="fixed bottom-16 sm:bottom-4 inset-x-0 z-40 px-4 pointer-events-none">
          <div className="max-w-2xl mx-auto pointer-events-auto bg-[#0c0e14]/95 backdrop-blur-md border border-[#2e3547] rounded-xl p-3 flex items-center justify-between gap-3 shadow-2xl">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-[#7c3aed]/20 text-[#d2bbff] flex items-center justify-center">
                <Sparkles className="w-4 h-4" />
              </div>
              <div className="flex flex-col">
                <span className="text-xs font-semibold text-[#e2e2eb]">
                  선택 {items.length}건 대기 중
                </span>
                <span className="text-[10px] font-mono text-[#958da1]">
                  모든 아키텍처 규칙 검증 완료됨
                </span>
              </div>
            </div>

            <button
              onClick={onApproveAll}
              className="px-4 py-2 rounded-lg bg-[#7c3aed] hover:bg-[#6d28d9] text-white text-xs font-semibold flex items-center gap-1.5 shadow-[0_0_16px_rgba(124,58,237,0.4)] transition-all shrink-0 active:scale-95"
            >
              <CheckCheck className="w-4 h-4" />
              <span>모두 자동 승인 및 지식화</span>
            </button>
          </div>
        </aside>
      )}
    </div>
  );
};
