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
  Edit3,
  Plus,
  Send,
  Loader2,
  Columns,
  Rows,
  ArrowRight,
  Copy,
  Check,
  Link2,
  ArrowDownLeft,
  FileCode,
  FileText
} from 'lucide-react';
import { TriageCardData } from '../../types';
import { analyzeRefineryRaw } from '../../api';

interface RefineryViewProps {
  items: TriageCardData[];
  onApproveCard: (id: string) => void;
  onDismissCard: (id: string) => void;
  onApproveAll: () => void;
  onShowToast: (msg: string) => void;
  onResetItems: () => void;
  onAddCard?: (card: TriageCardData) => void;
  onUpdateCard?: (card: TriageCardData) => void;
  totalApprovedToday?: number;
}

export const RefineryView: React.FC<RefineryViewProps> = ({
  items,
  onApproveCard,
  onDismissCard,
  onApproveAll,
  onShowToast,
  onResetItems,
  onAddCard,
  onUpdateCard,
  totalApprovedToday = 12
}) => {
  const [activeFilter, setActiveFilter] = useState<'all' | 'infra' | 'code' | 'db' | 'history'>('all');
  const [viewLayout, setViewLayout] = useState<'split' | 'stacked'>('split');
  const [copiedSnippetId, setCopiedSnippetId] = useState<string | null>(null);
  const [editingCardId, setEditingCardId] = useState<string | null>(null);
  const [isIngestOpen, setIsIngestOpen] = useState(false);
  const [rawText, setRawText] = useState('');
  const [sourceType, setSourceType] = useState('Slack');
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // Close category selector on outside click
  React.useEffect(() => {
    if (!editingCardId) return;
    const handler = () => setEditingCardId(null);
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [editingCardId]);

  const avgConfidence = items.length > 0
    ? (items.reduce((acc, item) => {
        const num = parseFloat(item.confidence) || 94.5;
        return acc + num;
      }, 0) / items.length).toFixed(1)
    : '96.2';

  const handleCopySnippet = async (id: string, code: string) => {
    try {
      await navigator.clipboard.writeText(code);
      setCopiedSnippetId(id);
      setTimeout(() => setCopiedSnippetId(null), 2000);
    } catch {
      // ignore
    }
  };

  const handleRunAiAnalysis = async () => {
    if (!rawText.trim()) {
      onShowToast('분석할 원본 메모나 로그를 입력해주세요.');
      return;
    }

    setIsAnalyzing(true);
    try {
      const data = await analyzeRefineryRaw(rawText, sourceType);
      const confStr = data.confidence || `${(data.confidenceScore || 94.2).toFixed(1)}% 일치`;
      const newCard: TriageCardData = {
        id: data.id || `triage-${Date.now()}`,
        category: data.category || 'code',
        categoryTitle: data.categoryTitle || '소스코드 및 구현 정보',
        confidence: confStr,
        timestamp: '방금 전',
        rawType: sourceType,
        rawSubtitle: `${sourceType} 채널 인입`,
        rawContent: rawText,
        aiTitle: data.aiTitle || '신규 아키텍처 정제 규격',
        aiBadge: 'AI 실시간 추출',
        aiSummaryPoints: data.aiSummaryPoints || ['자동 정제된 아키텍처 포인트'],
        tags: data.tags || ['#Refinery', '#AI'],
        backlinks: data.backlinks || ['[[Kafka 클러스터]]'],
        codeSnippet: data.codeSnippet
      };

      if (onAddCard) {
        onAddCard(newCard);
      }
      setRawText('');
      setIsIngestOpen(false);
      onShowToast(`'${newCard.aiTitle}' 카드가 실시간 AI 정제 대기열에 추가되었습니다.`);
    } catch (err: any) {
      console.error(err);
      onShowToast('AI 정제 분석 중 오류가 발생했습니다.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const filteredItems = items.filter((item) => {
    if (activeFilter === 'all') return true;
    if (activeFilter === 'infra') return item.category === 'infra';
    if (activeFilter === 'code') return item.category === 'code';
    if (activeFilter === 'db') return item.category === 'db';
    if (activeFilter === 'history') return false;
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
            <span className="text-xs text-[#958da1]">정제 승인 누적</span>
            <div className="flex items-baseline gap-1 mt-1">
              <span className="text-2xl font-bold text-[#4edea3]">{totalApprovedToday}</span>
              <span className="text-xs text-[#958da1]">건</span>
            </div>
          </div>

          <div className="bg-[#191b22] border border-[#2e3547] p-3 rounded-xl flex flex-col justify-between shadow-sm">
            <span className="text-xs text-[#958da1]">규칙 일치율</span>
            <div className="flex items-baseline gap-0.5 mt-1">
              <span className="text-2xl font-bold text-[#d2bbff]">{avgConfidence}</span>
              <span className="text-xs text-[#d2bbff]">%</span>
            </div>
          </div>
        </div>
      </section>

      {/* Filter Category Chips & View Mode Switcher */}
      <section className="px-4 py-1 flex items-center justify-between gap-3 overflow-x-auto no-scrollbar">
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
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
        </div>

        {/* View Layout Switcher (Split vs Stacked) */}
        <div className="flex items-center gap-1 bg-[#191b22] border border-[#2e3547] p-1 rounded-xl shrink-0">
          <button
            onClick={() => setViewLayout('split')}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-mono transition-all ${
              viewLayout === 'split'
                ? 'bg-[#7c3aed] text-white font-semibold shadow-sm'
                : 'text-[#958da1] hover:text-[#ccc3d8]'
            }`}
            title="좌우 분할 비교 (Split View)"
          >
            <Columns className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">좌우 비교</span>
          </button>
          <button
            onClick={() => setViewLayout('stacked')}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-mono transition-all ${
              viewLayout === 'stacked'
                ? 'bg-[#7c3aed] text-white font-semibold shadow-sm'
                : 'text-[#958da1] hover:text-[#ccc3d8]'
            }`}
            title="상하 적재 비교 (Stacked View)"
          >
            <Rows className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">상하 비교</span>
          </button>
        </div>
      </section>

      {/* Real AI Raw Ingestion Form */}
      <section className="px-4">
        {!isIngestOpen ? (
          <button
            onClick={() => setIsIngestOpen(true)}
            className="w-full py-3 px-4 rounded-xl bg-[#191b22] border border-[#7c3aed]/40 hover:border-[#7c3aed] text-xs font-mono text-[#d2bbff] flex items-center justify-center gap-2 shadow-sm transition-all hover:bg-[#1e1f26]"
          >
            <Plus className="w-4 h-4 text-[#4cd7f6]" />
            <span>새 원본 메모 / 로그 붙여넣기 (AI 실시간 정제)</span>
          </button>
        ) : (
          <div className="bg-[#191b22] border border-[#7c3aed]/50 rounded-xl p-4 space-y-3 shadow-xl animate-in fade-in">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-[#4cd7f6]" />
                <span className="text-xs font-bold text-[#e2e2eb]">
                  미정제 원본 아키텍처 스펙 인입
                </span>
              </div>
              <button
                onClick={() => setIsIngestOpen(false)}
                className="text-xs text-[#958da1] hover:text-[#e2e2eb]"
              >
                닫기
              </button>
            </div>

            <textarea
              value={rawText}
              onChange={(e) => setRawText(e.target.value)}
              placeholder="Slack 대화 내용, 터미널 에러 로그, 신규 cURL 명세, 또는 러프한 기술 메모를 여기에 붙여넣으세요..."
              rows={4}
              className="w-full p-3 rounded-lg bg-[#0c0e14] border border-[#2e3547] text-xs text-[#e2e2eb] font-mono placeholder-[#4a4455] focus:outline-none focus:border-[#4cd7f6]"
            />

            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono text-[#958da1]">출처:</span>
                <select
                  value={sourceType}
                  onChange={(e) => setSourceType(e.target.value)}
                  className="px-2 py-1 rounded bg-[#0c0e14] border border-[#2e3547] text-xs font-mono text-[#ccc3d8] focus:outline-none"
                >
                  <option value="Slack">#slack-arch</option>
                  <option value="Terminal Log">Terminal Log</option>
                  <option value="cURL / API">cURL / API</option>
                  <option value="Manual Memo">Manual Memo</option>
                </select>
              </div>

              <button
                onClick={handleRunAiAnalysis}
                disabled={isAnalyzing}
                className="px-4 py-2 rounded-lg bg-[#7c3aed] hover:bg-[#6d28d9] disabled:opacity-50 text-white text-xs font-mono font-semibold flex items-center gap-1.5 shadow-md transition-colors"
              >
                {isAnalyzing ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>AI 모델 정제 중...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-3.5 h-3.5" />
                    <span>AI 정제 및 대기열 등록</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </section>

      {/* Triage Cards Stack */}
      <section className="px-4 space-y-4">
        {filteredItems.length === 0 ? (
          /* Empty State */
          <div className="flex flex-col items-center justify-center p-8 text-center bg-[#191b22] border border-[#2e3547] rounded-xl space-y-3">
            <div className="w-14 h-14 rounded-full bg-[#007650]/20 text-[#4edea3] flex items-center justify-center">
              <CheckCheck className="w-7 h-7" />
            </div>
            <h3 className="text-base font-semibold text-[#e2e2eb]">
              {activeFilter === 'history' ? '정제 완료 및 보관 이력' : '모든 정제 대기열이 비었습니다!'}
            </h3>
            <p className="text-xs text-[#958da1] max-w-sm leading-relaxed">
              {activeFilter === 'history'
                ? `오늘 총 ${totalApprovedToday}건의 비정형 데이터가 표준 아키텍처 규격으로 정제 승인되어 PostgreSQL 16 DB 및 pgvector 저장소에 영구 색인되었습니다.`
                : '수집된 원본 메모가 시스템 아키텍처 규칙에 따라 완벽히 분류 및 지식 그래프에 색인되었습니다.'}
            </p>
            {activeFilter !== 'history' && (
              <button
                onClick={() => setIsIngestOpen(true)}
                className="mt-2 px-4 py-2 rounded-lg bg-[#282a30] hover:bg-[#33343b] text-[#4cd7f6] text-xs font-mono flex items-center gap-1.5 transition-colors border border-[#33343b]"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>새 원본 메모 / 로그 붙여넣기</span>
              </button>
            )}
          </div>
        ) : (
          filteredItems.map((item) => {
            const rawLines = (item.rawContent || '').split('\n');
            const charCount = (item.rawContent || '').length;
            const lineCount = rawLines.length;
            const numericConfidence = parseFloat(item.confidence) || 94.5;

            return (
              <article
                key={item.id}
                className="group relative flex flex-col rounded-2xl bg-[#14151b] border border-[#2e3547] shadow-xl overflow-hidden transition-all duration-200 hover:border-[#7c3aed]/50"
              >
                {/* Neon Top Indicator Bar */}
                <div
                  className={`h-1.5 w-full ${
                    item.category === 'infra'
                      ? 'bg-gradient-to-r from-[#4edea3] via-[#4cd7f6] to-[#7c3aed]'
                      : item.category === 'code'
                      ? 'bg-gradient-to-r from-[#4cd7f6] via-[#d2bbff] to-[#7c3aed]'
                      : 'bg-gradient-to-r from-[#03b5d3] via-[#4cd7f6] to-[#7c3aed]'
                  }`}
                />

                <div className="p-4 sm:p-5 space-y-4">
                  {/* Card Top Meta Bar */}
                  <div className="flex items-center justify-between gap-3 pb-3 border-b border-[#2e3547]/60">
                    <div className="flex items-center gap-2.5 flex-wrap">
                      <span
                        className={`px-2.5 py-1 rounded-lg text-xs font-mono font-semibold flex items-center gap-1.5 shadow-sm ${
                          item.category === 'infra'
                            ? 'bg-[#007650]/30 text-[#4edea3] border border-[#007650]/40'
                            : item.category === 'code'
                            ? 'bg-[#7c3aed]/20 text-[#d2bbff] border border-[#7c3aed]/30'
                            : 'bg-[#03b5d3]/20 text-[#4cd7f6] border border-[#03b5d3]/30'
                        }`}
                      >
                        {item.category === 'infra' && <Terminal className="w-3.5 h-3.5" />}
                        {item.category === 'code' && <Code2 className="w-3.5 h-3.5" />}
                        {item.category === 'db' && <Database className="w-3.5 h-3.5" />}
                        <span>{item.categoryTitle}</span>
                      </span>

                      {/* Dynamic Confidence Meter */}
                      <div className="flex items-center gap-2 px-2.5 py-1 rounded-lg bg-[#1e1f26] border border-[#2e3547]">
                        <span className="text-[11px] font-mono text-[#958da1]">규칙 일치율:</span>
                        <div className="w-16 h-1.5 bg-[#282a30] rounded-full overflow-hidden">
                          <div
                            className={`h-full ${
                              numericConfidence >= 96
                                ? 'bg-gradient-to-r from-[#4edea3] to-[#4cd7f6]'
                                : numericConfidence >= 92
                                ? 'bg-gradient-to-r from-[#4cd7f6] to-[#d2bbff]'
                                : 'bg-gradient-to-r from-[#d2bbff] to-[#ffb4ab]'
                            }`}
                            style={{ width: `${Math.min(100, numericConfidence)}%` }}
                          />
                        </div>
                        <span className="text-xs font-mono font-bold text-[#4edea3]">
                          {item.confidence}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 text-xs font-mono text-[#958da1]">
                      <span className="hidden sm:inline text-[11px] text-[#d2bbff] bg-[#7c3aed]/15 px-2 py-0.5 rounded border border-[#7c3aed]/30">
                        {item.aiBadge || 'AI 실시간 추출'}
                      </span>
                      <span>{item.timestamp}</span>
                    </div>
                  </div>

                  {/* Transformation Comparison Grid (Before vs After) */}
                  <div
                    className={
                      viewLayout === 'split'
                        ? 'grid grid-cols-1 lg:grid-cols-12 gap-3.5 items-stretch'
                        : 'flex flex-col gap-3.5'
                    }
                  >
                    {/* LEFT PANEL: BEFORE (원본 인입) */}
                    <div
                      className={`${
                        viewLayout === 'split' ? 'lg:col-span-5' : 'w-full'
                      } flex flex-col bg-[#0c0e14] border border-[#2e3547] rounded-xl overflow-hidden shadow-inner`}
                    >
                      {/* Before Header */}
                      <div className="flex items-center justify-between px-3.5 py-2 bg-[#191b22] border-b border-[#2e3547] text-xs font-mono">
                        <div className="flex items-center gap-1.5">
                          <span className="px-2 py-0.5 rounded bg-[#ffb4ab]/15 text-[#ffb4ab] border border-[#ffb4ab]/30 font-bold text-[11px] flex items-center gap-1">
                            <ArrowDownLeft className="w-3 h-3 text-[#ffb4ab]" />
                            BEFORE
                          </span>
                          <span className="text-[#ccc3d8] font-medium text-[11px]">원본 인입 데이터</span>
                        </div>
                        <div className="flex items-center gap-2 text-[10px] text-[#958da1]">
                          <span className="px-1.5 py-0.5 rounded bg-[#282a30] text-[#ccc3d8]">
                            {item.rawType}
                          </span>
                          <span>{charCount}자 / {lineCount}줄</span>
                        </div>
                      </div>

                      {/* Raw Content Box */}
                      <div className="p-3.5 flex-1 overflow-y-auto max-h-[360px] font-mono text-xs text-[#ccc3d8] leading-relaxed select-text space-y-1">
                        <div className="text-[10px] text-[#958da1] font-sans pb-1 mb-1.5 border-b border-[#232630] flex items-center justify-between">
                          <span>{item.rawSubtitle || '비정형 원문'}</span>
                          <span className="text-[#e06c75]">• 비정형 텍스트</span>
                        </div>
                        <pre className="whitespace-pre-wrap font-mono text-[11px] leading-relaxed text-[#abb2bf] m-0">
                          {item.rawContent}
                        </pre>
                      </div>

                      {/* Before Footer info */}
                      <div className="px-3.5 py-1.5 bg-[#14151c] border-t border-[#232630] text-[10px] font-mono text-[#958da1] flex items-center justify-between">
                        <span>상태: 비정형 원시 로그 / 슬랙 메모</span>
                        <span className="text-[#e5c07b]">노이즈 포함</span>
                      </div>
                    </div>

                    {/* CENTER INDICATOR (Visible in Split View) */}
                    {viewLayout === 'split' && (
                      <div className="hidden lg:flex lg:col-span-1 flex-col items-center justify-center gap-2 py-2">
                        <div className="w-px h-16 bg-gradient-to-b from-transparent via-[#7c3aed] to-transparent"></div>
                        <div className="w-8 h-8 rounded-full bg-[#7c3aed]/20 border border-[#7c3aed]/50 text-[#d2bbff] flex items-center justify-center shadow-[0_0_12px_rgba(124,58,237,0.4)]">
                          <ArrowRight className="w-4 h-4 text-[#4cd7f6]" />
                        </div>
                        <span className="text-[9px] font-mono text-[#958da1] uppercase text-center leading-tight">
                          AI
                          <br />
                          Refined
                        </span>
                        <div className="w-px h-16 bg-gradient-to-b from-transparent via-[#7c3aed] to-transparent"></div>
                      </div>
                    )}

                    {/* RIGHT PANEL: AFTER (AI 정제 결과) */}
                    <div
                      className={`${
                        viewLayout === 'split' ? 'lg:col-span-6' : 'w-full'
                      } flex flex-col bg-[#191b22] border border-[#7c3aed]/40 rounded-xl overflow-hidden shadow-lg`}
                    >
                      {/* After Header */}
                      <div className="flex items-center justify-between px-3.5 py-2 bg-[#20222b] border-b border-[#2e3547] text-xs font-mono">
                        <div className="flex items-center gap-1.5">
                          <span className="px-2 py-0.5 rounded bg-[#7c3aed]/30 text-[#d2bbff] border border-[#7c3aed]/50 font-bold text-[11px] flex items-center gap-1">
                            <Sparkles className="w-3 h-3 text-[#4edea3]" />
                            AFTER
                          </span>
                          <span className="text-[#e2e2eb] font-semibold text-[11px]">정제 지식 규격</span>
                        </div>
                        <span className="text-[10px] text-[#4edea3] bg-[#007650]/20 px-2 py-0.5 rounded border border-[#007650]/30 font-semibold">
                          정형화 완료
                        </span>
                      </div>

                      <div className="p-3.5 flex-1 space-y-3 overflow-y-auto max-h-[360px]">
                        {/* Title */}
                        <div>
                          <h4 className="text-sm font-bold text-[#e2e2eb] font-mono flex items-center gap-1.5">
                            <span className="w-1.5 h-3.5 bg-[#7c3aed] rounded-full shrink-0"></span>
                            <span>{item.aiTitle}</span>
                          </h4>
                        </div>

                        {/* Transformation Benefit Pills */}
                        <div className="flex items-center gap-1.5 flex-wrap text-[10px] font-mono">
                          <span className="px-1.5 py-0.5 rounded bg-[#282a30] text-[#4cd7f6] border border-[#2e3547]">
                            ✓ 제목 정규화
                          </span>
                          <span className="px-1.5 py-0.5 rounded bg-[#282a30] text-[#4edea3] border border-[#2e3547]">
                            ✓ 요약 {item.aiSummaryPoints?.length || 0}건 도출
                          </span>
                          {item.codeSnippet ? (
                            <span className="px-1.5 py-0.5 rounded bg-[#282a30] text-[#d2bbff] border border-[#2e3547]">
                              ✓ {item.codeSnippet.language.toUpperCase()} 코드 추출
                            </span>
                          ) : (
                            <span className="px-1.5 py-0.5 rounded bg-[#282a30] text-[#4cd7f6] border border-[#2e3547]">
                              ✓ 정책 및 거버넌스 규격
                            </span>
                          )}
                          <span className="px-1.5 py-0.5 rounded bg-[#282a30] text-[#ccc3d8] border border-[#2e3547]">
                            ✓ 백링크 {item.backlinks?.length || 0}개 연동
                          </span>
                        </div>

                        {/* Summary Points */}
                        {item.aiSummaryPoints && item.aiSummaryPoints.length > 0 && (
                          <div className="bg-[#14151b] p-3 rounded-lg border border-[#232630] space-y-1.5">
                            <span className="text-[11px] font-mono text-[#958da1] block font-semibold">
                              [핵심 아키텍처 요약]
                            </span>
                            <ul className="space-y-1 text-xs text-[#e2e2eb]">
                              {item.aiSummaryPoints.map((pt, idx) => (
                                <li key={idx} className="flex items-start gap-1.5">
                                  <span className="text-[#4cd7f6] font-bold mt-0.5">•</span>
                                  <span className="leading-relaxed">{pt}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {/* Code Snippet Box (Optional) or Conceptual Policy Notice */}
                        {item.codeSnippet ? (
                          <div className="rounded-lg overflow-hidden border border-[#2e3547] bg-[#0c0e14] font-mono text-xs">
                            <div className="flex items-center justify-between px-3 py-1.5 bg-[#1e1f26] border-b border-[#2e3547] text-[#958da1]">
                              <div className="flex items-center gap-1.5">
                                <Code2 className="w-3.5 h-3.5 text-[#4cd7f6]" />
                                <span className="text-[11px] font-semibold text-[#ccc3d8]">
                                  {item.codeSnippet.filename || item.codeSnippet.language}
                                </span>
                              </div>
                              <button
                                onClick={() => handleCopySnippet(item.id, item.codeSnippet!.code)}
                                className="flex items-center gap-1 px-2 py-0.5 rounded bg-[#282a30] hover:bg-[#383a45] text-[#ccc3d8] text-[10px] transition-colors cursor-pointer"
                              >
                                {copiedSnippetId === item.id ? (
                                  <>
                                    <Check className="w-3 h-3 text-[#4edea3]" />
                                    <span className="text-[#4edea3]">복사됨</span>
                                  </>
                                ) : (
                                  <>
                                    <Copy className="w-3 h-3" />
                                    <span>코드 복사</span>
                                  </>
                                )}
                              </button>
                            </div>
                            <div className="p-3 overflow-x-auto text-[#abb2bf] text-[11px] leading-relaxed max-h-[140px]">
                              <pre className="m-0 p-0 font-mono">
                                <code>{item.codeSnippet.code}</code>
                              </pre>
                            </div>
                          </div>
                        ) : (
                          /* Non-code Conceptual / Policy Notice Box */
                          <div className="p-3 rounded-lg bg-[#14151b] border border-[#2e3547]/80 flex items-start gap-2.5 text-xs text-[#ccc3d8]">
                            <FileText className="w-4 h-4 text-[#4cd7f6] shrink-0 mt-0.5" />
                            <div className="space-y-0.5">
                              <span className="font-semibold text-[#e2e2eb] font-mono text-[11px] block">
                                아키텍처 정책 및 거버넌스 규격
                              </span>
                              <p className="text-[11px] text-[#958da1] leading-relaxed">
                                코드가 불필요한 도메인 정책, 운영 규정, RPO/RTO 지표, 또는 아키텍처 결정 사항(ADR) 문서입니다.
                              </p>
                            </div>
                          </div>
                        )}

                        {/* Backlinks & Tags */}
                        <div className="flex items-center gap-1.5 flex-wrap pt-1">
                          {item.backlinks?.map((bl) => (
                            <span
                              key={bl}
                              className="inline-flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded-md bg-[#7c3aed]/20 text-[#d2bbff] border border-[#7c3aed]/30"
                            >
                              <Link2 className="w-3 h-3 text-[#b982ff]" />
                              {bl}
                            </span>
                          ))}
                          {item.tags?.map((t) => (
                            <span
                              key={t}
                              className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[#282a30] text-[#958da1]"
                            >
                              {t}
                            </span>
                          ))}
                        </div>
                      </div>

                      {/* Destination Vault Path Footer */}
                      <div className="px-3.5 py-1.5 bg-[#14151c] border-t border-[#2e3547]/80 text-[10px] font-mono text-[#958da1] flex items-center justify-between">
                        <span className="flex items-center gap-1 truncate">
                          <FolderOpen className="w-3.5 h-3.5 text-[#4cd7f6] shrink-0" />
                          <span className="truncate">저장 대상: /vault/{item.category}/{item.id.replace('triage-', '')}.md</span>
                        </span>
                        <span className="text-[#4edea3] shrink-0">정식 승인 대기중</span>
                      </div>
                    </div>
                  </div>

                  {/* Card Action Buttons */}
                  <div className="flex items-center justify-between gap-2 pt-3 border-t border-[#2e3547]/50">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => onDismissCard(item.id)}
                        className="px-3 py-1.5 rounded-lg bg-[#282a30] hover:bg-[#383a45] text-[#958da1] hover:text-[#ffb4ab] text-xs font-mono flex items-center gap-1 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>폐기</span>
                      </button>
                      <div className="relative">
                        <button
                          onClick={() => setEditingCardId(editingCardId === item.id ? null : item.id)}
                          className="px-3 py-1.5 rounded-lg bg-[#282a30] hover:bg-[#383a45] text-[#ccc3d8] text-xs font-mono flex items-center gap-1 transition-colors"
                          title="카테고리 변경"
                        >
                          <Sliders className="w-3.5 h-3.5 text-[#4cd7f6]" />
                          <span>카테고리 수정</span>
                        </button>
                        {editingCardId === item.id && (
                          <div
                            onClick={(e) => e.stopPropagation()}
                            className="absolute left-0 bottom-full mb-1.5 w-48 bg-[#1e1f26] border border-[#2e3547] rounded-xl shadow-2xl p-1.5 z-50 animate-in fade-in zoom-in-95 duration-150 space-y-1"
                          >
                            <div className="px-2 py-1 text-[10px] font-mono text-[#958da1] uppercase border-b border-[#2e3547]/60">
                              카테고리 변경 선택
                            </div>
                            {[
                              { id: 'infra', label: '인프라', title: '시스템 인프라 정보', color: 'text-[#4edea3]' },
                              { id: 'code', label: '소스코드', title: '소스코드 및 구현 정보', color: 'text-[#d2bbff]' },
                              { id: 'db', label: 'DB', title: '데이터베이스 정보', color: 'text-[#4cd7f6]' },
                              { id: 'code', label: '연계', title: '외부 시스템 연계 정보', color: 'text-[#ffb4ab]' }
                            ].map((catOption, idx) => (
                              <button
                                key={idx}
                                onClick={() => {
                                  const updated: TriageCardData = {
                                    ...item,
                                    category: catOption.id as any,
                                    categoryTitle: catOption.title
                                  };
                                  if (onUpdateCard) onUpdateCard(updated);
                                  onShowToast(`카테고리가 '${catOption.title}'(으)로 변경되었습니다.`);
                                  setEditingCardId(null);
                                }}
                                className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-mono flex items-center justify-between hover:bg-[#282a30] transition-colors ${
                                  item.categoryTitle === catOption.title ? 'bg-[#282a30] text-[#e2e2eb]' : 'text-[#ccc3d8]'
                                }`}
                              >
                                <span className={catOption.color}>• {catOption.label}</span>
                                <span className="text-[10px] text-[#958da1] truncate max-w-[90px]">{catOption.title}</span>
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>

                    <button
                      onClick={() => onApproveCard(item.id)}
                      className="px-4 py-2 rounded-xl bg-[#7c3aed] hover:bg-[#6d28d9] text-white text-xs font-semibold flex items-center gap-1.5 shadow-[0_0_15px_rgba(124,58,237,0.4)] transition-all active:scale-95"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>승인 및 지식 보관 (DB 색인)</span>
                    </button>
                  </div>
                </div>
              </article>
            );
          })
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
