import React, { useState, useMemo } from 'react';
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
  Link as LinkIcon,
  Server,
  Workflow,
  FileText
} from 'lucide-react';
import { NoteItem } from '../../types';

interface HierarchyViewProps {
  notes?: NoteItem[];
  onOpenDocument: (noteId: string) => void;
  onUpdateNote?: (note: NoteItem, toastMsg?: string) => void;
  onShowToast: (msg: string) => void;
}

export const HierarchyView: React.FC<HierarchyViewProps> = ({
  notes = [],
  onOpenDocument,
  onUpdateNote,
  onShowToast
}) => {
  const [isAllCollapsed, setIsAllCollapsed] = useState(false);
  const [selectedDepth, setSelectedDepth] = useState<string>('all');
  const [openCategories, setOpenCategories] = useState<Record<string, boolean>>({
    '인프라': true,
    'DB': true,
    '소스코드': true,
    '연계': true,
    '워크플로우': true
  });

  const toggleCategory = (cat: string) => {
    setOpenCategories((prev) => ({ ...prev, [cat]: !prev[cat] }));
  };

  const handleToggleAll = () => {
    const newState = !isAllCollapsed;
    setIsAllCollapsed(newState);
    const updated: Record<string, boolean> = {};
    Object.keys(openCategories).forEach((k) => (updated[k] = !newState));
    setOpenCategories(updated);
    onShowToast(newState ? '모든 계층 트리가 접혔습니다.' : '모든 계층 트리가 펼쳐졌습니다.');
  };

  // Group real notes by category
  const categoriesMap = useMemo(() => {
    const map: Record<string, NoteItem[]> = {
      'DB': [],
      '소스코드': [],
      '인프라': [],
      '연계': [],
      '워크플로우': []
    };

    notes.forEach((n) => {
      if (map[n.category]) {
        map[n.category].push(n);
      } else {
        map['소스코드'].push(n);
      }
    });

    return map;
  }, [notes]);

  // Identify true orphan notes: 0 backlinks and not mentioned in any other note
  const orphanNotes = useMemo(() => {
    if (notes.length <= 1) return [];

    return notes.filter((candidate) => {
      const titleClean = candidate.title.toLowerCase();
      // Check if any other note references candidate
      const isReferenced = notes.some((other) => {
        if (other.id === candidate.id) return false;
        const links = (other.connectedNodes || []).map((t) =>
          t.replace(/\[\[|\]\]/g, '').trim().toLowerCase()
        );
        if (links.includes(titleClean)) return true;
        const content = (other.content || other.excerpt || '').toLowerCase();
        return content.includes(titleClean);
      });

      const hasOutgoingLinks = (candidate.connectedNodes || []).length > 0;
      return !isReferenced && !hasOutgoingLinks;
    });
  }, [notes]);

  // Real Auto Place Orphans
  const handleAutoPlaceOrphans = () => {
    if (orphanNotes.length === 0) {
      onShowToast('현재 배치할 고립 노드가 없습니다.');
      return;
    }

    let placedCount = 0;
    orphanNotes.forEach((orphan) => {
      // Find candidate parent note in the same category
      const parent = notes.find((n) => n.id !== orphan.id && n.category === orphan.category) || notes[0];
      if (parent && onUpdateNote) {
        const cleanTitle = orphan.title;
        const existing = parent.connectedNodes || [];
        if (!existing.some((t) => t.replace(/\[\[|\]\]/g, '').trim().toLowerCase() === cleanTitle.toLowerCase())) {
          const updatedParent: NoteItem = {
            ...parent,
            connectedNodes: [...existing, `[[${cleanTitle}]]`],
            backlinksCount: (parent.backlinksCount || 0) + 1
          };
          onUpdateNote(updatedParent);
          placedCount++;
        }
      }
    });

    onShowToast(`고립된 ${orphanNotes.length}건의 노드가 상위 카테고리 시스템에 자동 배치되었습니다.`);
  };

  const totalCount = notes.length;

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
            <span className="text-[11px] font-mono text-[#958da1]">PostgreSQL Live Tree</span>
          </div>

          <div className="flex items-center gap-1.5 bg-[#191b22] border border-[#2e3547] px-2 py-1 rounded-lg text-xs font-mono">
            <span className="text-[#4cd7f6]">MAX</span>
            <span className="text-[#e2e2eb] font-semibold">Level 4</span>
          </div>
        </div>

        <div className="flex items-baseline justify-between">
          <h1 className="text-xl sm:text-2xl font-bold text-[#e2e2eb] tracking-tight">
            지식 계층 구조 <span className="text-[#958da1] font-normal text-sm font-mono ml-1">{totalCount} Nodes</span>
          </h1>
          <span className="text-xs font-mono text-[#4edea3] flex items-center gap-1">
            <RotateCcw className="w-3 h-3 text-[#4edea3]" /> 실시간 DB 색인됨
          </span>
        </div>
      </section>

      {/* Visual Depth Distribution Map */}
      <section className="px-4">
        <div className="bg-[#191b22] border border-[#2e3547] rounded-xl p-4 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono text-[#ccc3d8] flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-[#4cd7f6]" />
              도메인별 지식 밀도 분포
            </span>
            <span className="text-[11px] font-mono text-[#958da1]">총 {totalCount}개 문서 적재</span>
          </div>

          {/* Segmented Gradient Stack Bar */}
          <div className="w-full h-2 rounded-full bg-[#33343b] flex overflow-hidden gap-0.5">
            <div
              className="h-full bg-[#4edea3]"
              style={{ width: `${Math.max(10, (categoriesMap['DB'].length / Math.max(1, totalCount)) * 100)}%` }}
              title="DB"
            ></div>
            <div
              className="h-full bg-[#4cd7f6]"
              style={{ width: `${Math.max(10, (categoriesMap['소스코드'].length / Math.max(1, totalCount)) * 100)}%` }}
              title="소스코드"
            ></div>
            <div
              className="h-full bg-[#d2bbff]"
              style={{ width: `${Math.max(10, (categoriesMap['인프라'].length / Math.max(1, totalCount)) * 100)}%` }}
              title="인프라"
            ></div>
            <div
              className="h-full bg-[#ffb4ab]"
              style={{ width: `${Math.max(10, (categoriesMap['연계'].length / Math.max(1, totalCount)) * 100)}%` }}
              title="연계"
            ></div>
          </div>

          {/* Legend Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 text-center">
            <div className="bg-[#1e1f26] rounded-lg p-2 flex flex-col items-center">
              <span className="text-xs font-bold text-[#4edea3]">데이터베이스</span>
              <span className="text-[11px] font-mono text-[#e2e2eb]">{categoriesMap['DB'].length} 문서</span>
            </div>
            <div className="bg-[#1e1f26] rounded-lg p-2 flex flex-col items-center">
              <span className="text-xs font-bold text-[#4cd7f6]">소스코드 & 구현</span>
              <span className="text-[11px] font-mono text-[#e2e2eb]">{categoriesMap['소스코드'].length} 문서</span>
            </div>
            <div className="bg-[#1e1f26] rounded-lg p-2 flex flex-col items-center">
              <span className="text-xs font-bold text-[#d2bbff]">클라우드 인프라</span>
              <span className="text-[11px] font-mono text-[#e2e2eb]">{categoriesMap['인프라'].length} 문서</span>
            </div>
            <div className="bg-[#1e1f26] rounded-lg p-2 flex flex-col items-center">
              <span className="text-xs font-bold text-[#ffb4ab]">외부 연계 & API</span>
              <span className="text-[11px] font-mono text-[#e2e2eb]">{categoriesMap['연계'].length} 문서</span>
            </div>
          </div>
        </div>
      </section>

      {/* Filter Chips & Action Bar */}
      <section className="px-4 space-y-2.5">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1">
            {[
              { id: 'all', label: '전체 계층' },
              { id: 'db', label: 'DB 도메인', dot: 'bg-[#4edea3]' },
              { id: 'code', label: '소스코드', dot: 'bg-[#4cd7f6]' },
              { id: 'infra', label: '인프라', dot: 'bg-[#d2bbff]' },
              { id: 'external', label: '연계', dot: 'bg-[#ffb4ab]' }
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
              </button>
            ))}
          </div>

          <button
            onClick={handleToggleAll}
            className="px-2.5 py-1.5 rounded-lg bg-[#191b22] border border-[#2e3547] text-xs font-mono text-[#ccc3d8] hover:text-[#e2e2eb] shrink-0"
          >
            {isAllCollapsed ? '모두 펼치기' : '모두 접기'}
          </button>
        </div>
      </section>

      {/* Orphan Detection Alert Banner */}
      {orphanNotes.length > 0 && (
        <section className="px-4">
          <div className="bg-[#241a0e] border border-[#f59e0b]/40 rounded-xl p-3.5 flex items-center justify-between gap-3 shadow-md">
            <div className="flex items-center gap-2.5 min-w-0">
              <AlertTriangle className="w-5 h-5 text-[#f59e0b] shrink-0 animate-bounce" />
              <div className="flex flex-col min-w-0">
                <span className="text-xs font-bold text-[#f59e0b]">
                  고립된 노드 {orphanNotes.length}건 감지됨
                </span>
                <span className="text-[11px] text-[#ccc3d8] truncate">
                  백링크가 연결되지 않은 문서: {orphanNotes.map((o) => o.title).join(', ')}
                </span>
              </div>
            </div>
            <button
              onClick={handleAutoPlaceOrphans}
              className="px-3 py-1.5 rounded-lg bg-[#f59e0b] hover:bg-[#d97706] text-[#001f26] text-xs font-bold font-mono shrink-0 shadow-sm transition-colors"
            >
              자동 배치 실행
            </button>
          </div>
        </section>
      )}

      {/* Main Dynamic Tree Container */}
      <section className="px-4 space-y-4">
        {Object.entries(categoriesMap).map(([categoryName, catNotes]) => {
          if (catNotes.length === 0) return null;
          if (selectedDepth === 'db' && categoryName !== 'DB') return null;
          if (selectedDepth === 'code' && categoryName !== '소스코드') return null;
          if (selectedDepth === 'infra' && categoryName !== '인프라') return null;
          if (selectedDepth === 'external' && categoryName !== '연계') return null;

          const isOpen = Boolean(openCategories[categoryName]);
          const catColor =
            categoryName === 'DB'
              ? '#4edea3'
              : categoryName === '인프라'
              ? '#d2bbff'
              : categoryName === '연계'
              ? '#ffb4ab'
              : '#4cd7f6';

          return (
            <div key={categoryName} className="bg-[#191b22] border border-[#2e3547] rounded-xl p-3.5 shadow-sm space-y-3">
              {/* Category Level L1 Header */}
              <div
                onClick={() => toggleCategory(categoryName)}
                className="flex items-center justify-between cursor-pointer hover:opacity-90 transition-opacity"
              >
                <div className="flex items-center gap-2">
                  {isOpen ? (
                    <ChevronDown className="w-4 h-4 text-[#958da1]" />
                  ) : (
                    <ChevronRight className="w-4 h-4 text-[#958da1]" />
                  )}
                  <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: catColor }}></div>
                  <span className="text-sm font-bold text-[#e2e2eb]">
                    L1. {categoryName} 도메인
                  </span>
                  <span className="px-1.5 py-0.2 rounded-full bg-[#1e1f26] border border-[#2e3547] text-[10px] font-mono text-[#958da1]">
                    {catNotes.length}개 문서
                  </span>
                </div>
              </div>

              {/* Sub-tree L2 & L3 Notes */}
              {isOpen && (
                <div className="pl-5 border-l border-[#2e3547] space-y-2 pt-1">
                  {catNotes.map((note) => (
                    <div
                      key={note.id}
                      className="p-2.5 rounded-lg bg-[#111319] border border-[#2e3547] hover:border-[#4cd7f6]/50 transition-all flex flex-col gap-1.5"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div
                          onClick={() => onOpenDocument(note.id)}
                          className="flex items-center gap-2 cursor-pointer min-w-0"
                        >
                          <FileText className="w-3.5 h-3.5 text-[#4cd7f6] shrink-0" />
                          <span className="text-xs font-semibold text-[#e2e2eb] truncate hover:text-[#4cd7f6]">
                            {note.title}
                          </span>
                          {note.isPinned && (
                            <span className="px-1.5 py-0.2 rounded bg-[#7c3aed]/20 text-[#d2bbff] text-[9px] font-mono border border-[#7c3aed]/40">
                              CORE
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <span className="text-[10px] font-mono text-[#4edea3] flex items-center gap-1">
                            <LinkIcon className="w-3 h-3" /> {note.backlinksCount} 백링크
                          </span>
                          <button
                            onClick={() => onOpenDocument(note.id)}
                            className="p-1 rounded hover:bg-[#282a30] text-[#958da1] hover:text-[#e2e2eb]"
                          >
                            <ExternalLink className="w-3 h-3" />
                          </button>
                        </div>
                      </div>

                      <p className="text-[11px] text-[#958da1] line-clamp-2 leading-relaxed">
                        {note.excerpt}
                      </p>

                      {/* Connected Sub-nodes tags */}
                      {note.connectedNodes && note.connectedNodes.length > 0 && (
                        <div className="flex flex-wrap gap-1 pt-1">
                          {note.connectedNodes.slice(0, 4).map((link, lidx) => (
                            <span
                              key={lidx}
                              className="px-1.5 py-0.2 rounded bg-[#1e1f26] text-[#ccc3d8] font-mono text-[9px] border border-[#2e3547]"
                            >
                              {link}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </section>
    </div>
  );
};
