import React, { useState } from 'react';
import {
  Layers,
  RotateCcw,
  Sparkles,
  AlertTriangle,
  FolderOpen,
  Folder,
  ChevronDown,
  ChevronRight,
  Database,
  ExternalLink,
  Plus,
  Filter,
  Check,
  Code2,
  Lock,
  Link as LinkIcon
} from 'lucide-react';

interface HierarchyViewProps {
  onOpenDocument: (noteId: string) => void;
  onShowToast: (msg: string) => void;
}

export const HierarchyView: React.FC<HierarchyViewProps> = ({
  onOpenDocument,
  onShowToast
}) => {
  const [isAllCollapsed, setIsAllCollapsed] = useState(false);
  const [selectedDepth, setSelectedDepth] = useState<string>('all');
  const [orphanResolved, setOrphanResolved] = useState(false);

  // Expand/collapse states for nodes
  const [l1Open, setL1Open] = useState(true);
  const [l2Open, setL2Open] = useState(true);
  const [dbL1Open, setDbL1Open] = useState(false);
  const [infraL1Open, setInfraL1Open] = useState(false);

  const handleToggleAll = () => {
    const newState = !isAllCollapsed;
    setIsAllCollapsed(newState);
    setL1Open(!newState);
    setL2Open(!newState);
    setDbL1Open(!newState);
    setInfraL1Open(!newState);
    onShowToast(newState ? '모든 계층 트리가 접혔습니다.' : '모든 계층 트리가 펼쳐졌습니다.');
  };

  const handleAutoPlaceOrphans = () => {
    setOrphanResolved(true);
    onShowToast('고립된 2건의 노드가 AI 아키텍처 규칙에 따라 L4 리소스로 자동 배치되었습니다.');
  };

  return (
    <div className="flex flex-col w-full pb-28 space-y-5 animate-in fade-in duration-200">
      {/* Top Architecture Meta Bar */}
      <section className="px-4 pt-4 space-y-2">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded bg-[#7c3aed]/20 text-[#d2bbff] text-[11px] font-mono tracking-wide">
              DEPTH ARCHITECTURE
            </span>
            <div className="w-1.5 h-1.5 rounded-full bg-[#4cd7f6] animate-pulse"></div>
            <span className="text-[11px] font-mono text-[#958da1]">v2.4.0-indexed</span>
          </div>

          <div className="flex items-center gap-1.5 bg-[#191b22] border border-[#2e3547] px-2 py-1 rounded-lg text-xs font-mono">
            <span className="text-[#4cd7f6]">MAX</span>
            <span className="text-[#e2e2eb] font-semibold">Level 4</span>
          </div>
        </div>

        <div className="flex items-baseline justify-between">
          <h1 className="text-xl sm:text-2xl font-bold text-[#e2e2eb] tracking-tight">
            지식 계층 구조 <span className="text-[#958da1] font-normal text-sm font-mono ml-1">148 Nodes</span>
          </h1>
          <span className="text-xs font-mono text-[#4edea3] flex items-center gap-1">
            <RotateCcw className="w-3 h-3 animate-spin text-[#4edea3]" /> 실시간 동기화됨
          </span>
        </div>
      </section>

      {/* Visual Depth Distribution Map */}
      <section className="px-4">
        <div className="bg-[#191b22] border border-[#2e3547] rounded-xl p-4 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono text-[#ccc3d8] flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-[#4cd7f6]" />
              계층별 지식 밀도 분포
            </span>
            <span className="text-[11px] font-mono text-[#958da1]">총 148개 노드 색인</span>
          </div>

          {/* Segmented Gradient Stack Bar */}
          <div className="w-full h-2 rounded-full bg-[#33343b] flex overflow-hidden gap-0.5">
            <div className="h-full bg-[#d2bbff]" style={{ width: '14%' }} title="L1 루트 도메인 (4개)"></div>
            <div className="h-full bg-[#4cd7f6]" style={{ width: '22%' }} title="L2 서브시스템 (14개)"></div>
            <div className="h-full bg-[#4edea3]" style={{ width: '34%' }} title="L3 아키텍처 모듈 (38개)"></div>
            <div className="h-full bg-[#03b5d3]" style={{ width: '30%' }} title="L4 원자 리소스 (92개)"></div>
          </div>

          {/* Legend Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 text-center">
            <div className="bg-[#1e1f26] rounded-lg p-2 flex flex-col items-center">
              <span className="text-xs font-bold text-[#d2bbff]">L1 루트</span>
              <span className="text-[11px] font-mono text-[#e2e2eb]">4 도메인</span>
            </div>
            <div className="bg-[#1e1f26] rounded-lg p-2 flex flex-col items-center">
              <span className="text-xs font-bold text-[#4cd7f6]">L2 시스템</span>
              <span className="text-[11px] font-mono text-[#e2e2eb]">14 서브</span>
            </div>
            <div className="bg-[#1e1f26] rounded-lg p-2 flex flex-col items-center">
              <span className="text-xs font-bold text-[#4edea3]">L3 모듈</span>
              <span className="text-[11px] font-mono text-[#e2e2eb]">38 모듈</span>
            </div>
            <div className="bg-[#1e1f26] rounded-lg p-2 flex flex-col items-center">
              <span className="text-xs font-bold text-[#acedff]">L4 리소스</span>
              <span className="text-[11px] font-mono text-[#e2e2eb]">92 엔티티</span>
            </div>
          </div>
        </div>
      </section>

      {/* Filter Chips & Action Bar */}
      <section className="px-4 space-y-2.5">
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1">
          {[
            { id: 'all', label: '전체 계층', count: '148', color: 'bg-[#7c3aed]' },
            { id: 'l1', label: 'L1 도메인', dot: 'bg-[#d2bbff]' },
            { id: 'l2', label: 'L2 시스템', dot: 'bg-[#4cd7f6]' },
            { id: 'l3', label: 'L3 컴포넌트', dot: 'bg-[#4edea3]' },
            { id: 'l4', label: 'L4 상세/코드', dot: 'bg-[#03b5d3]' }
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setSelectedDepth(item.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono shrink-0 flex items-center gap-1.5 transition-all ${
                selectedDepth === item.id
                  ? 'bg-[#7c3aed] text-white font-medium shadow-sm'
                  : 'bg-[#191b22] text-[#ccc3d8] hover:bg-[#1e1f26] border border-[#2e3547]'
              }`}
            >
              {item.dot && <span className={`w-2 h-2 rounded-full ${item.dot}`}></span>}
              <span>{item.label}</span>
              {item.count && (
                <span className="px-1 rounded bg-white/20 text-[10px]">{item.count}</span>
              )}
            </button>
          ))}
        </div>

        <div className="flex items-center justify-between px-3 py-2 bg-[#191b22] border border-[#2e3547] rounded-lg text-xs font-mono text-[#958da1]">
          <div className="flex items-center gap-3">
            <button
              onClick={handleToggleAll}
              className="flex items-center gap-1 hover:text-[#e2e2eb] transition-colors"
            >
              {isAllCollapsed ? <ChevronRight className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
              <span>{isAllCollapsed ? '모두 펼치기' : '모두 접기'}</span>
            </button>
            <span className="text-[#4a4455]">|</span>
            <button
              onClick={() => onShowToast('현재 L1-L4 필터가 적용 중입니다.')}
              className="flex items-center gap-1 hover:text-[#e2e2eb] transition-colors"
            >
              <Filter className="w-3.5 h-3.5" />
              <span>선택 필터</span>
            </button>
          </div>

          <button
            onClick={() => onShowToast('AI가 노드 간 의존성을 분석하여 계층 구조를 최적화했습니다.')}
            className="flex items-center gap-1 px-2 py-1 rounded bg-[#282a30] hover:bg-[#33343b] text-[#4cd7f6] transition-colors"
          >
            <Sparkles className="w-3 h-3 text-[#d2bbff]" />
            <span>AI 계층 재정렬</span>
          </button>
        </div>
      </section>

      {/* Orphan Node Alert Banner */}
      {!orphanResolved && (
        <section className="px-4">
          <div className="bg-[#191b22] border border-[#03b5d3]/40 rounded-xl p-3 flex items-center justify-between gap-3 relative overflow-hidden">
            <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#03b5d3]"></div>
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-lg bg-[#03b5d3]/20 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-4 h-4 text-[#4cd7f6]" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-[#e2e2eb] truncate">
                    고립된 노드 2건 발견
                  </span>
                  <span className="px-1.5 py-0.2 rounded bg-[#282a30] text-[#958da1] text-[10px] font-mono">
                    Orphan
                  </span>
                </div>
                <p className="text-[11px] text-[#ccc3d8] truncate">
                  부모 Depth가 누락된 문서를 AI가 추론하여 배치할 수 있습니다.
                </p>
              </div>
            </div>

            <button
              onClick={handleAutoPlaceOrphans}
              className="px-3 py-1.5 rounded-lg bg-[#03b5d3] hover:bg-[#4cd7f6] text-[#001f26] text-xs font-bold shrink-0 transition-colors shadow-sm"
            >
              AI 자동배치
            </button>
          </div>
        </section>
      )}

      {/* Depth Knowledge Tree Section */}
      <section className="px-4 space-y-3">
        <div className="flex items-center justify-between px-1">
          <span className="text-xs font-mono text-[#958da1] font-semibold tracking-wider">
            DEPTH HIERARCHY TREE
          </span>
          <span className="text-xs font-mono text-[#958da1]">4 Domains / 148 Nodes</span>
        </div>

        {/* ROOT NODE 1: 결제 & 트랜잭션 서비스 (Expanded) */}
        <div className="rounded-xl bg-[#191b22] border border-[#2e3547] overflow-hidden shadow-md">
          {/* L1 Header */}
          <div
            onClick={() => setL1Open(!l1Open)}
            className="flex items-center justify-between p-3.5 cursor-pointer bg-[#1e1f26]/80 hover:bg-[#282a30] transition-colors"
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <button className="text-[#958da1]">
                {l1Open ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
              </button>
              <div className="w-6 h-6 rounded bg-[#7c3aed]/20 text-[#d2bbff] flex items-center justify-center shrink-0">
                <FolderOpen className="w-3.5 h-3.5" />
              </div>
              <span className="text-sm font-semibold text-[#e2e2eb] truncate">
                결제 &amp; 트랜잭션 서비스
              </span>
              <span className="px-1.5 py-0.5 rounded bg-[#7c3aed]/20 text-[#d2bbff] font-mono text-[10px] shrink-0">
                L1
              </span>
            </div>
            <div className="flex items-center gap-2 shrink-0 text-xs font-mono text-[#958da1]">
              <span>48 docs</span>
            </div>
          </div>

          {/* L2 Subtree Area */}
          {l1Open && (
            <div className="pl-5 pr-3 pb-3 pt-1 flex flex-col relative">
              {/* Indent Guide */}
              <div className="absolute left-7 top-0 bottom-3 w-px bg-[#2e3547]"></div>

              {/* LEVEL 2: 주문 및 결제 코디네이터 */}
              <div className="relative pl-6 pt-2 flex flex-col gap-2">
                <div className="p-3 rounded-lg bg-[#1e1f26]/60 border border-[#2e3547] space-y-2.5">
                  <div
                    onClick={() => setL2Open(!l2Open)}
                    className="flex items-center justify-between cursor-pointer"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      {l2Open ? <ChevronDown className="w-3.5 h-3.5 text-[#4cd7f6]" /> : <ChevronRight className="w-3.5 h-3.5 text-[#4cd7f6]" />}
                      <span className="text-xs font-semibold text-[#e2e2eb] truncate">
                        주문 및 결제 코디네이터
                      </span>
                      <span className="px-1.5 py-0.2 rounded bg-[#4cd7f6]/15 text-[#4cd7f6] font-mono text-[10px]">
                        L2
                      </span>
                    </div>
                    <span className="text-[11px] font-mono text-[#958da1]">3 모듈</span>
                  </div>

                  {/* LEVEL 3: 분산 트랜잭션 Saga 패턴 (Selected L3 Node) */}
                  {l2Open && (
                    <div className="relative pl-4 space-y-2 pt-1">
                      <div className="p-3 rounded-lg bg-[#282a30] border border-[#7c3aed]/50 relative overflow-hidden shadow-sm ring-1 ring-[#7c3aed]/40">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-start gap-2 min-w-0">
                            <span className="text-[#4edea3] mt-0.5">📄</span>
                            <div className="min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="text-xs font-bold text-[#e2e2eb] truncate">
                                  분산 트랜잭션 Saga 패턴 구현체
                                </span>
                                <span className="px-1.5 py-0.2 rounded bg-[#007650]/30 text-[#4edea3] font-mono text-[10px]">
                                  L3
                                </span>
                              </div>
                              <p className="text-[11px] text-[#ccc3d8] line-clamp-1 mt-0.5">
                                보상 트랜잭션 오케스트레이션 및 상태 머신 롤백 워크플로우
                              </p>
                            </div>
                          </div>
                          <span className="w-2 h-2 rounded-full bg-[#4cd7f6] shadow-[0_0_6px_rgba(76,215,246,0.8)] mt-1 shrink-0"></span>
                        </div>

                        {/* Tech Attributes */}
                        <div className="flex items-center gap-2 mt-2 pt-2 border-t border-[#33343b] text-[10px] font-mono text-[#958da1]">
                          <span className="text-[#4edea3]">🔗 7 Backlinks</span>
                          <span>•</span>
                          <span className="text-[#d2bbff]">Kotlin 1.9</span>
                          <span>•</span>
                          <span className="text-[#4edea3] flex items-center gap-0.5">
                            <Check className="w-3 h-3" /> AI 정제완료
                          </span>
                        </div>

                        {/* LEVEL 4: Atomic Resources (Leaf Nodes) */}
                        <div className="mt-3 pt-2 border-t border-[#33343b] space-y-1.5">
                          <div className="flex items-center justify-between text-[11px] font-mono">
                            <span className="text-[#4cd7f6] font-semibold tracking-wider">
                              DEPTH 4 : ATOMIC RESOURCES
                            </span>
                            <span className="text-[#958da1]">3 leaf nodes</span>
                          </div>

                          {/* L4 Leaf 1 */}
                          <div
                            onClick={() => onShowToast('POST /v2/payments/webhook 규격 상세로 이동')}
                            className="flex items-center justify-between p-2 rounded bg-[#191b22] hover:bg-[#0c0e14] border border-[#2e3547] cursor-pointer transition-colors group"
                          >
                            <div className="flex items-center gap-2 min-w-0">
                              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[#007650]/30 text-[#4edea3] font-bold">
                                POST
                              </span>
                              <span className="text-xs font-mono text-[#e2e2eb] truncate">
                                /v2/payments/webhook
                              </span>
                              <span className="px-1 rounded bg-[#282a30] text-[#958da1] text-[9px] font-mono">
                                L4
                              </span>
                            </div>
                            <LinkIcon className="w-3.5 h-3.5 text-[#958da1] group-hover:text-[#4cd7f6]" />
                          </div>

                          {/* L4 Leaf 2 */}
                          <div
                            onClick={() => onShowToast('OrderSagaCoordinator.kt 소스코드 열람')}
                            className="flex items-center justify-between p-2 rounded bg-[#191b22] hover:bg-[#0c0e14] border border-[#2e3547] cursor-pointer transition-colors group"
                          >
                            <div className="flex items-center gap-2 min-w-0">
                              <Code2 className="w-3.5 h-3.5 text-[#d2bbff]" />
                              <span className="text-xs font-mono text-[#e2e2eb] truncate">
                                OrderSagaCoordinator.kt
                              </span>
                              <span className="px-1 rounded bg-[#282a30] text-[#958da1] text-[9px] font-mono">
                                L4
                              </span>
                            </div>
                            <span className="text-[10px] font-mono text-[#958da1]">214 loc</span>
                          </div>

                          {/* L4 Leaf 3 */}
                          <div
                            onClick={() => onShowToast('Redlock 분산락 스펙 상세 열람')}
                            className="flex items-center justify-between p-2 rounded bg-[#191b22] hover:bg-[#0c0e14] border border-[#2e3547] cursor-pointer transition-colors group"
                          >
                            <div className="flex items-center gap-2 min-w-0">
                              <Lock className="w-3.5 h-3.5 text-[#4cd7f6]" />
                              <span className="text-xs text-[#e2e2eb] truncate">
                                주문 트랜잭션 Redlock 분산락 패턴
                              </span>
                              <span className="px-1 rounded bg-[#282a30] text-[#958da1] text-[9px] font-mono">
                                L4
                              </span>
                            </div>
                            <span className="text-[10px] font-mono text-[#4edea3]">TTL 3000ms</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* L2 Item 2: 정산 & 배치 엔진 */}
                <div
                  onClick={() => onShowToast('정산 & 배치 엔진 하위 모듈 12건이 정렬되었습니다.')}
                  className="p-2.5 rounded-lg bg-[#1e1f26]/40 hover:bg-[#282a30] border border-[#2e3547] flex items-center justify-between cursor-pointer transition-colors"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <ChevronRight className="w-3.5 h-3.5 text-[#958da1]" />
                    <span className="text-xs text-[#e2e2eb] truncate">정산 &amp; 배치 엔진 (v1.8)</span>
                    <span className="px-1.5 py-0.2 rounded bg-[#4cd7f6]/10 text-[#4cd7f6] font-mono text-[10px]">
                      L2
                    </span>
                  </div>
                  <span className="text-[11px] font-mono text-[#958da1]">12 docs</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ROOT NODE 2: 플랫폼 코어 인프라 (Collapsed L1) */}
        <div className="rounded-xl bg-[#191b22] border border-[#2e3547] overflow-hidden">
          <div
            onClick={() => setInfraL1Open(!infraL1Open)}
            className="flex items-center justify-between p-3.5 cursor-pointer hover:bg-[#1e1f26] transition-colors"
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <button className="text-[#958da1]">
                {infraL1Open ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
              </button>
              <div className="w-6 h-6 rounded bg-[#7c3aed]/20 text-[#d2bbff] flex items-center justify-center shrink-0">
                <Folder className="w-3.5 h-3.5" />
              </div>
              <span className="text-sm font-semibold text-[#e2e2eb] truncate">
                플랫폼 코어 인프라
              </span>
              <span className="px-1.5 py-0.5 rounded bg-[#7c3aed]/20 text-[#d2bbff] font-mono text-[10px] shrink-0">
                L1
              </span>
            </div>
            <div className="flex items-center gap-2 shrink-0 text-xs font-mono text-[#958da1]">
              <span>32 docs</span>
              <span className="px-1.5 py-0.5 rounded bg-[#282a30] text-[#4edea3] text-[10px]">
                k8s/mesh
              </span>
            </div>
          </div>
        </div>

        {/* ROOT NODE 3: 데이터 거버넌스 & DB 클러스터 */}
        <div className="rounded-xl bg-[#191b22] border border-[#2e3547] overflow-hidden">
          <div
            onClick={() => setDbL1Open(!dbL1Open)}
            className="flex items-center justify-between p-3.5 cursor-pointer hover:bg-[#1e1f26] transition-colors"
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <button className="text-[#958da1]">
                {dbL1Open ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
              </button>
              <div className="w-6 h-6 rounded bg-[#7c3aed]/20 text-[#d2bbff] flex items-center justify-center shrink-0">
                <Database className="w-3.5 h-3.5" />
              </div>
              <span className="text-sm font-semibold text-[#e2e2eb] truncate">
                데이터 거버넌스 &amp; DB 클러스터
              </span>
              <span className="px-1.5 py-0.5 rounded bg-[#7c3aed]/20 text-[#d2bbff] font-mono text-[10px] shrink-0">
                L1
              </span>
            </div>
            <div className="flex items-center gap-2 shrink-0 text-xs font-mono text-[#958da1]">
              <span>24 docs</span>
            </div>
          </div>
          {dbL1Open && (
            <div className="pl-8 pr-4 pb-3 pt-1">
              <div
                onClick={() => onShowToast('PostgreSQL 커넥션 풀 튜닝 가이드로 이동')}
                className="p-2.5 rounded-lg bg-[#1e1f26] hover:bg-[#282a30] border border-[#2e3547] flex items-center justify-between cursor-pointer text-xs"
              >
                <div className="flex items-center gap-2">
                  <span className="text-[#4cd7f6]">⚡</span>
                  <span className="text-[#e2e2eb]">PostgreSQL 16 커넥션 풀 &amp; 튜닝</span>
                </div>
                <span className="font-mono text-[#958da1]">PgBouncer</span>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Floating Bottom Inspector Bar */}
      <div className="fixed bottom-16 sm:bottom-4 inset-x-0 z-30 px-4 pointer-events-none">
        <div className="max-w-2xl mx-auto pointer-events-auto bg-[#282a30]/95 backdrop-blur-lg border border-[#33343b] rounded-xl p-3 shadow-2xl space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-xs font-mono text-[#958da1] overflow-x-auto no-scrollbar">
              <span className="text-[#d2bbff]">결제 서비스</span>
              <span>&gt;</span>
              <span className="text-[#4cd7f6]">주문 코디네이터</span>
              <span>&gt;</span>
              <span className="text-[#4edea3]">Saga 패턴</span>
              <span>&gt;</span>
              <span className="text-[#e2e2eb] font-semibold">/webhook</span>
            </div>
            <span className="px-1.5 py-0.5 rounded bg-[#7c3aed] text-white text-[10px] font-mono font-bold shrink-0">
              Selected L4
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => onOpenDocument('note-saga')}
              className="flex-1 py-2 px-3 rounded-lg bg-[#7c3aed] hover:bg-[#6d28d9] text-white font-medium text-xs flex items-center justify-center gap-1.5 transition-all shadow-sm"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>문서 상세 열기</span>
            </button>
            <button
              onClick={() => onShowToast('새로운 하위 엔티티 생성 창이 준비되었습니다.')}
              className="py-2 px-3 rounded-lg bg-[#191b22] hover:bg-[#1e1f26] border border-[#33343b] text-[#e2e2eb] text-xs font-mono flex items-center gap-1 transition-colors"
            >
              <Plus className="w-3.5 h-3.5 text-[#4cd7f6]" />
              <span>하위 노드 추가</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
