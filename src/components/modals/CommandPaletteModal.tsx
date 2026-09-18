import React, { useState, useEffect } from 'react';
import { Search, FileText, Network, Layers, Sparkles, GitBranch, X, ArrowRight, Bot, Sliders } from 'lucide-react';
import { TabType, NoteItem } from '../../types';

interface CommandPaletteModalProps {
  isOpen: boolean;
  onClose: () => void;
  notes: NoteItem[];
  onSelectNote: (id: string) => void;
  onSelectTab: (tab: TabType) => void;
  onOpenSandbox: () => void;
  onOpenNewNote: () => void;
}

export const CommandPaletteModal: React.FC<CommandPaletteModalProps> = ({
  isOpen,
  onClose,
  notes,
  onSelectNote,
  onSelectTab,
  onOpenSandbox,
  onOpenNewNote
}) => {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);

  const quickActions = [
    {
      id: 'act-chat',
      label: 'AI 지식 어시스턴트 (RAG 대화 & 검색)',
      sublabel: '문서 검색, 시맨틱 요약, 실시간 업데이트(Diff)',
      icon: Bot,
      color: 'text-[#4cd7f6]',
      action: () => {
        onClose();
        onSelectTab('chat');
      }
    },
    {
      id: 'act-new-note',
      label: '새 노트 작성하기',
      sublabel: '마크다운 에디터 & AI 정제',
      icon: FileText,
      color: 'text-[#d2bbff]',
      action: () => {
        onClose();
        onOpenNewNote();
      }
    },
    {
      id: 'act-graph',
      label: '지식 그래프 열기',
      sublabel: `${notes.length}개 노드 양방향 클러스터 탐색`,
      icon: Network,
      color: 'text-[#4cd7f6]',
      action: () => {
        onClose();
        onSelectTab('graph');
      }
    },
    {
      id: 'act-hierarchy',
      label: '지식 계층 구조 (L1-L4) 탐색',
      sublabel: '도메인/서브시스템 트리 탐색',
      icon: Layers,
      color: 'text-[#4edea3]',
      action: () => {
        onClose();
        onSelectTab('hierarchy');
      }
    },
    {
      id: 'act-refinery',
      label: 'AI 정제 대기열 확인',
      sublabel: '미분류 메모 및 스펙 승인/폐기',
      icon: Sparkles,
      color: 'text-[#acedff]',
      action: () => {
        onClose();
        onSelectTab('refinery');
      }
    },
    {
      id: 'act-sandbox',
      label: '분류 룰 샌드박스 시뮬레이션',
      sublabel: '실시간 가이드라인 적용 검증',
      icon: GitBranch,
      color: 'text-[#ffb4ab]',
      action: () => {
        onClose();
        onOpenSandbox();
      }
    },
    {
      id: 'act-prompts',
      label: 'AI 에이전트 프롬프트 허브',
      sublabel: '6종 코어 AI 에이전트 프롬프트 관리 & 실시간 샌드박스',
      icon: Sliders,
      color: 'text-[#d2bbff]',
      action: () => {
        onClose();
        onSelectTab('prompts');
      }
    }
  ];

  const matchedNotes = notes.filter(
    (n) =>
      n.title.toLowerCase().includes(query.toLowerCase()) ||
      n.excerpt.toLowerCase().includes(query.toLowerCase()) ||
      n.tags.some((t) => t.toLowerCase().includes(query.toLowerCase()))
  );

  const filteredQuickActions = query.trim()
    ? quickActions.filter(
        (a) =>
          a.label.toLowerCase().includes(query.toLowerCase()) ||
          a.sublabel.toLowerCase().includes(query.toLowerCase())
      )
    : quickActions;

  // Flatten items for keyboard navigation
  const allItems: Array<
    | { type: 'action'; id: string; action: () => void }
    | { type: 'note'; id: string; note: NoteItem }
  > = [
    ...filteredQuickActions.map((a) => ({ type: 'action' as const, id: a.id, action: a.action })),
    ...matchedNotes.map((n) => ({ type: 'note' as const, id: n.id, note: n }))
  ];

  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        if (isOpen) onClose();
        return;
      }
      if (e.key === 'Escape' && isOpen) {
        onClose();
        return;
      }
      if (!isOpen || allItems.length === 0) return;

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev + 1) % allItems.length);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev - 1 + allItems.length) % allItems.length);
      } else if (e.key === 'Enter') {
        e.preventDefault();
        const selected = allItems[selectedIndex];
        if (selected) {
          if (selected.type === 'action') {
            selected.action();
          } else {
            onClose();
            onSelectNote(selected.note.id);
            onSelectTab('notes');
          }
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose, allItems, selectedIndex, onSelectNote, onSelectTab]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-16 sm:pt-24 px-4 bg-[#0c0e14]/80 backdrop-blur-md animate-in fade-in duration-150">
      <div className="bg-[#191b22] border border-[#2e3547] w-full max-w-xl rounded-xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150">
        {/* Search Input Bar */}
        <div className="flex items-center gap-3 px-4 py-3.5 border-b border-[#2e3547] bg-[#1e1f26]">
          <Search className="w-5 h-5 text-[#4cd7f6] shrink-0" />
          <input
            autoFocus
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="노트 제목, 코드 스니펫, #태그, 또는 커맨드 검색..."
            className="w-full bg-transparent border-none outline-none text-sm text-[#e2e2eb] placeholder:text-[#958da1]"
          />
          <button
            onClick={onClose}
            className="text-[#958da1] hover:text-[#e2e2eb] p-1 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Results List */}
        <div className="max-h-[380px] overflow-y-auto p-2 space-y-4 no-scrollbar">
          {/* Quick Actions */}
          {filteredQuickActions.length > 0 && (
            <div className="space-y-1">
              <div className="px-2 py-1 text-[11px] font-mono text-[#958da1] uppercase">
                빠른 실행
              </div>
              {filteredQuickActions.map((act, idx) => {
                const Icon = act.icon;
                const isSelected = selectedIndex === idx;
                return (
                  <button
                    key={act.id}
                    onClick={act.action}
                    onMouseEnter={() => setSelectedIndex(idx)}
                    className={`w-full flex items-center justify-between p-2 rounded-lg text-left transition-colors group ${
                      isSelected
                        ? 'bg-[#282a30] border border-[#7c3aed]/50 text-[#e2e2eb]'
                        : 'hover:bg-[#282a30] text-[#ccc3d8]'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <Icon className={`w-4 h-4 ${act.color}`} />
                      <div className="flex flex-col">
                        <span className="text-xs font-semibold text-[#e2e2eb] group-hover:text-[#4cd7f6] transition-colors">
                          {act.label}
                        </span>
                        <span className="text-[10px] text-[#958da1] font-mono">{act.sublabel}</span>
                      </div>
                    </div>
                    <ArrowRight className="w-3.5 h-3.5 text-[#958da1] group-hover:text-[#e2e2eb]" />
                  </button>
                );
              })}
            </div>
          )}

          {/* Notes Matching */}
          {matchedNotes.length > 0 && (
            <div className="space-y-1 pt-2 border-t border-[#2e3547]">
              <div className="px-2 py-1 text-[11px] font-mono text-[#958da1] uppercase flex items-center justify-between">
                <span>매칭된 지식 노트</span>
                <span>{matchedNotes.length}개</span>
              </div>
              {matchedNotes.map((note, nIdx) => {
                const itemIndex = filteredQuickActions.length + nIdx;
                const isSelected = selectedIndex === itemIndex;
                return (
                  <button
                    key={note.id}
                    onClick={() => {
                      onClose();
                      onSelectNote(note.id);
                      onSelectTab('notes');
                    }}
                    onMouseEnter={() => setSelectedIndex(itemIndex)}
                    className={`w-full flex items-center justify-between p-2.5 rounded-lg text-left transition-colors group ${
                      isSelected
                        ? 'bg-[#282a30] border border-[#4cd7f6]/50 text-[#e2e2eb]'
                        : 'hover:bg-[#282a30] text-[#ccc3d8]'
                    }`}
                  >
                    <div className="flex flex-col min-w-0 flex-1 pr-2">
                      <div className="flex items-center gap-2">
                        <span className="px-1.5 py-0.2 rounded bg-[#191b22] text-[#4cd7f6] text-[10px] font-mono">
                          {note.category}
                        </span>
                        <span className="text-xs font-semibold text-[#e2e2eb] group-hover:text-[#4cd7f6] truncate">
                          {note.title}
                        </span>
                      </div>
                      <span className="text-[11px] text-[#958da1] truncate mt-0.5">{note.excerpt}</span>
                    </div>
                    <span className="text-[10px] font-mono text-[#d2bbff] shrink-0">
                      {note.tags[0]}
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-4 py-2 bg-[#0c0e14] border-t border-[#2e3547] flex items-center justify-between text-[11px] font-mono text-[#958da1]">
          <span className="text-[#4edea3]">탐색: ↑ ↓ 선택 / Enter 실행 (현재 {selectedIndex + 1}/{allItems.length || 1})</span>
          <kbd className="px-1.5 py-0.5 rounded bg-[#1e1f26] border border-[#2e3547] text-[10px]">
            ESC 닫기
          </kbd>
        </div>
      </div>
    </div>
  );
};
