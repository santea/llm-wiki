import React, { useState, useMemo } from 'react';
import {
  Search,
  Sparkles,
  Zap,
  Mic,
  Code2,
  Camera,
  Layers,
  ArrowRight,
  Pin,
  Clock,
  Link as LinkIcon,
  Link2,
  BookOpen,
  FileCode,
  Copy,
  Check,
  RotateCcw,
  Share2,
  Workflow,
  ListTree,
  Lightbulb,
  Plus,
  ArrowLeft,
  MoreHorizontal,
  Database,
  Server,
  Edit3,
  Save,
  X
} from 'lucide-react';
import { NoteItem, Workspace } from '../../types';
import { ArchitectureDiagram } from './ArchitectureDiagram';

interface NotesViewProps {
  notes: NoteItem[];
  selectedNoteId: string | null;
  onSelectNote: (id: string | null) => void;
  onAddNote: (note: Partial<NoteItem>) => void;
  onUpdateNote?: (note: NoteItem, toastMsg?: string) => void;
  onShowToast: (msg: string) => void;
  activeWorkspace: Workspace;
}

export const NotesView: React.FC<NotesViewProps> = ({
  notes,
  selectedNoteId,
  onSelectNote,
  onAddNote,
  onUpdateNote,
  onShowToast,
  activeWorkspace
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTag, setActiveTag] = useState<string | null>(null);
  const [quickCaptureText, setQuickCaptureText] = useState('');
  const [isCapturing, setIsCapturing] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const [backlinkAdded, setBacklinkAdded] = useState(false);
  const [isReRefining, setIsReRefining] = useState(false);
  const [isEditingContent, setIsEditingContent] = useState(false);
  const [editContentText, setEditContentText] = useState('');
  const [editTitleText, setEditTitleText] = useState('');

  // If a note is selected, render the Detailed Note View (Image 7)
  const activeNote = notes.find((n) => n.id === selectedNoteId);

  // 1. Calculate Unlinked Mentions: Other documents mentioned in this document's text or vice-versa without [[link]]
  const unlinkedMentions = useMemo(() => {
    if (!activeNote) return [];
    const currentText = (activeNote.content || activeNote.excerpt || '').toLowerCase();
    const connectedTitles = (activeNote.connectedNodes || []).map((t) =>
      t.replace(/\[\[|\]\]/g, '').trim().toLowerCase()
    );

    return notes.filter((n) => {
      if (n.id === activeNote.id) return false;
      const targetTitle = n.title.toLowerCase();
      // Check if target title already in connected nodes
      if (connectedTitles.includes(targetTitle)) return false;

      // Check if title is mentioned in current document text
      const isMentionedInCurrent = currentText.includes(targetTitle);
      // Or current note's title is mentioned in other note's text without link
      const otherText = (n.content || n.excerpt || '').toLowerCase();
      const isCurrentMentionedInOther = otherText.includes(activeNote.title.toLowerCase());

      return isMentionedInCurrent || isCurrentMentionedInOther;
    });
  }, [activeNote, notes]);

  // 2. Calculate AI Semantic Recommendations based on shared tags, tech keywords and similarity
  const semanticRecommendations = useMemo(() => {
    if (!activeNote) return [];
    const connectedTitles = (activeNote.connectedNodes || []).map((t) =>
      t.replace(/\[\[|\]\]/g, '').trim().toLowerCase()
    );
    const currentTags = (activeNote.tags || []).map((t) => t.toLowerCase().replace('#', ''));

    return notes
      .filter((n) => {
        if (n.id === activeNote.id) return false;
        const targetTitle = n.title.toLowerCase();
        if (connectedTitles.includes(targetTitle)) return false;
        return true;
      })
      .map((n) => {
        const otherTags = (n.tags || []).map((t) => t.toLowerCase().replace('#', ''));
        const sharedTags = currentTags.filter((t) => otherTags.includes(t));
        const sameCategory = n.category === activeNote.category;
        // Calculate similarity score
        const score = Math.min(99, 68 + sharedTags.length * 10 + (sameCategory ? 15 : 0));
        return { note: n, score, sharedTags };
      })
      .filter((item) => item.score >= 70)
      .sort((a, b) => b.score - a.score)
      .slice(0, 3);
  }, [activeNote, notes]);

  // Quick capture submission handler
  const handleQuickCapture = () => {
    if (!quickCaptureText.trim()) {
      onShowToast('내용을 먼저 입력해주세요!');
      return;
    }
    setIsCapturing(true);
    setTimeout(() => {
      // Auto classify based on keywords
      const text = quickCaptureText;
      let category: NoteItem['category'] = '소스코드';
      let categoryFull = '소스코드 및 구현 정보';
      let tags = ['#AI정제', '#스니펫'];

      if (text.includes('DB') || text.includes('SQL') || text.includes('쿼리') || text.includes('인덱스')) {
        category = 'DB';
        categoryFull = '데이터베이스 정보';
        tags = ['#database', '#tuning', '#query'];
      } else if (text.includes('K8s') || text.includes('AWS') || text.includes('인프라') || text.includes('EKS')) {
        category = '인프라';
        categoryFull = '시스템 인프라 정보';
        tags = ['#infra', '#k8s', '#aws'];
      } else if (text.includes('API') || text.includes('웹훅') || text.includes('연동') || text.includes('PG')) {
        category = '연계';
        categoryFull = '외부 시스템 연계 정보';
        tags = ['#api', '#webhook', '#integration'];
      }

      onAddNote({
        title: text.slice(0, 32) + (text.length > 32 ? '...' : ''),
        category,
        categoryFull,
        excerpt: text,
        tags,
        wordCount: text.split(' ').length + 80,
        backlinksCount: 1,
        statusBadge: 'AI 자동정제됨',
        badgeType: 'ai-refined'
      });

      setQuickCaptureText('');
      setIsCapturing(false);
      onShowToast('메모가 AI 분석을 통해 자동 분류되어 추가되었습니다!');
    }, 1000);
  };

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(true);
    onShowToast('코드가 클립보드에 복사되었습니다.');
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleAddBacklink = () => {
    setBacklinkAdded(true);
    onShowToast('[[주문 서비스 ERD]]와 양방향 백링크가 연결되었습니다.');
  };

  const handleReRefine = () => {
    setIsReRefining(true);
    setTimeout(() => {
      setIsReRefining(false);
      onShowToast('AI 지식 그래프 및 메타데이터가 최신 규격으로 재정제되었습니다.');
    }, 1200);
  };

  // Filter notes
  const filteredNotes = notes.filter((n) => {
    const matchesSearch =
      n.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      n.excerpt.toLowerCase().includes(searchQuery.toLowerCase()) ||
      n.tags.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesTag = activeTag ? n.tags.includes(activeTag) : true;
    return matchesSearch && matchesTag;
  });

  /* -------------------------------------------------------------
     VIEW 1: DETAILED NOTE EDITOR VIEW (Image 7)
  ------------------------------------------------------------- */
  if (activeNote) {
    return (
      <div className="flex flex-col w-full max-w-4xl mx-auto pb-24 animate-in fade-in duration-200">
        {/* Top Navigation & Status Bar */}
        <div className="flex flex-col gap-2 p-4 bg-[#0c0e14]/60 border-b border-[#1f2432] rounded-b-xl">
          <div className="flex items-center justify-between text-xs text-[#958da1]">
            <div className="flex items-center gap-2">
              <button
                onClick={() => onSelectNote(null)}
                className="flex items-center gap-1 text-[#4cd7f6] hover:text-[#acedff] font-medium transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>목록으로</span>
              </button>
              <span className="text-[#4a4455]">•</span>
              <span className="truncate">{activeWorkspace.name}</span>
              <span className="text-[#4a4455]">&gt;</span>
              <span className="text-[#4cd7f6] font-medium truncate">{activeNote.categoryFull}</span>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <span className="flex items-center gap-1 px-2 py-0.5 rounded bg-[#007650]/20 text-[#4edea3] font-mono text-[11px]">
                <span className="w-1.5 h-1.5 rounded-full bg-[#4edea3] animate-pulse"></span>
                {activeNote.statusBadge}
              </span>
              <span className="text-[#958da1] text-[11px] font-mono">{activeNote.updatedAt}</span>
            </div>
          </div>

          {/* Editable Title Row */}
          <div className="flex items-start justify-between gap-3 mt-1">
            {isEditingContent ? (
              <input
                type="text"
                value={editTitleText}
                onChange={(e) => setEditTitleText(e.target.value)}
                className="text-2xl font-bold text-[#e2e2eb] tracking-tight leading-snug flex-1 bg-[#1e1f26] border border-[#7c3aed] rounded-lg px-3 py-1 focus:outline-none focus:ring-1 focus:ring-[#7c3aed]"
                placeholder="문서 제목을 입력하세요"
              />
            ) : (
              <h1 className="text-2xl font-bold text-[#e2e2eb] tracking-tight leading-snug flex-1">
                {activeNote.title}
              </h1>
            )}
            <div className="flex items-center gap-1.5">
              {!isEditingContent ? (
                <button
                  onClick={() => {
                    setIsEditingContent(true);
                    setEditTitleText(activeNote.title);
                    setEditContentText(activeNote.content || activeNote.excerpt);
                  }}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#282a30] hover:bg-[#33343b] text-[#4cd7f6] text-xs font-mono transition-colors"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>직접 편집</span>
                </button>
              ) : (
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => {
                      if (onUpdateNote) {
                        const updated: NoteItem = {
                          ...activeNote,
                          title: editTitleText.trim() || activeNote.title,
                          content: editContentText,
                          excerpt: editContentText.slice(0, 150) + '...',
                          updatedAt: '방금 전 (사용자 직접 수정)',
                          statusBadge: '수정 완료',
                          wordCount: editContentText.split(/\s+/).filter(Boolean).length
                        };
                        onUpdateNote(updated);
                      }
                      setIsEditingContent(false);
                      onShowToast('문서 내용이 성공적으로 저장 및 갱신되었습니다.');
                    }}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[#007650] hover:bg-[#008f62] text-white text-xs font-mono font-medium transition-colors shadow-sm"
                  >
                    <Save className="w-3.5 h-3.5" />
                    <span>저장</span>
                  </button>
                  <button
                    onClick={() => setIsEditingContent(false)}
                    className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-[#282a30] hover:bg-[#33343b] text-[#958da1] hover:text-[#e2e2eb] text-xs font-mono transition-colors"
                  >
                    <X className="w-3.5 h-3.5" />
                    <span>취소</span>
                  </button>
                </div>
              )}
              <button className="p-2 rounded-lg bg-[#282a30] hover:bg-[#33343b] text-[#ccc3d8] transition-colors">
                <MoreHorizontal className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* AI Quick Action Floating Toolbar */}
        <div className="sticky top-14 z-20 px-4 py-2 bg-[#111319]/95 backdrop-blur-md border-b border-[#1f2432] shadow-md">
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-0.5">
            <button
              onClick={() => onShowToast('AI 요약: Saga 패턴으로 분산 트랜잭션 롤백 및 상태 보상 메커니즘을 정의함.')}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#7c3aed] text-white text-xs font-medium shadow-sm hover:bg-[#6d28d9] transition-transform active:scale-95 shrink-0"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>AI 요약</span>
            </button>
            <button
              onClick={() => onShowToast('2개의 연관 문서와 자동 양방향 링크가 등록되었습니다.')}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#282a30] hover:bg-[#33343b] text-[#4cd7f6] text-xs font-mono shrink-0 transition-transform active:scale-95"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>자동 양방향 링크</span>
            </button>
            <button
              onClick={() => onShowToast('아래 Mermaid 다이어그램이 최신 플로우로 재생성되었습니다.')}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#282a30] hover:bg-[#33343b] text-[#ccc3d8] text-xs font-mono shrink-0 transition-transform active:scale-95"
            >
              <Workflow className="w-3.5 h-3.5" />
              <span>다이어그램 생성</span>
            </button>
            <button
              onClick={() => onShowToast('목차 구조가 문서 상단에 정리되었습니다.')}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#282a30] hover:bg-[#33343b] text-[#ccc3d8] text-xs font-mono shrink-0 transition-transform active:scale-95"
            >
              <ListTree className="w-3.5 h-3.5" />
              <span>표/목차 정리</span>
            </button>
          </div>
        </div>

        {/* Content Body Canvas */}
        <div className="p-4 sm:p-6 space-y-6">
          {/* Bento: Meta Properties */}
          <div className="p-3.5 rounded-xl bg-[#191b22] border border-[#2e3547] space-y-2.5">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs text-[#958da1]">
              <div className="flex items-center gap-2">
                <span className="w-16 shrink-0">작성자</span>
                <div className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-[#1e1f26] text-[#e2e2eb] font-mono">
                  <span className="w-3.5 h-3.5 rounded-full bg-[#7c3aed] text-white flex items-center justify-center text-[9px]">
                    P
                  </span>
                  <span>{activeNote.author || 'Platform Architect'}</span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="w-16 shrink-0">태그</span>
                <div className="flex flex-wrap gap-1">
                  {activeNote.tags.map((t) => (
                    <span
                      key={t}
                      className="px-2 py-0.5 rounded bg-[#282a30] text-[#d2bbff] font-mono text-[11px]"
                    >
                      {t}
                    </span>
                  ))}
                </div>
              </div>

              <div className="flex items-start gap-2">
                <span className="w-16 shrink-0 mt-0.5">연계 노드</span>
                <div className="flex flex-wrap items-center gap-1.5 flex-1">
                  {(activeNote.connectedNodes && activeNote.connectedNodes.length > 0
                    ? activeNote.connectedNodes
                    : ['[[결제 모듈 v2]]']
                  ).map((node) => (
                    <div
                      key={node}
                      onClick={() => onShowToast(`백링크 노드 ${node} 연결 탐색`)}
                      className="flex items-center gap-1 px-2 py-0.5 rounded bg-[#1e1f26] text-[#4cd7f6] font-mono text-[11px] cursor-pointer hover:bg-[#282a30] hover:text-[#acedff] transition-colors border border-[#2e3547]"
                    >
                      <LinkIcon className="w-3 h-3" />
                      <span>{node}</span>
                    </div>
                  ))}
                  <button
                    onClick={handleAddBacklink}
                    className="flex items-center gap-1 px-2 py-0.5 rounded bg-[#282a30] hover:bg-[#33343b] text-[#ccc3d8] hover:text-white font-mono text-[11px] transition-colors"
                  >
                    <Plus className="w-3 h-3 text-[#4edea3]" />
                    <span>노드 추가</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Smart Connection Hub: Alternative Ways of Connecting Notes */}
          <div className="rounded-xl bg-[#191b22] border border-[#2e3547] p-4 space-y-4 shadow-md">
            <div className="flex items-center justify-between pb-2 border-b border-[#2e3547]/60">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-[#7c3aed]" />
                <h3 className="text-xs font-mono font-semibold uppercase tracking-wider text-[#e2e2eb]">
                  스마트 지식 연결 허브 (Smart Connection Hub)
                </h3>
              </div>
              <span className="text-[10px] font-mono text-[#958da1]">
                수동 타이핑 외 2가지 자동 연결 지원
              </span>
            </div>

            {/* Sub-section 1: AI Semantic Similarity Auto-Links */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-xs font-mono text-[#4edea3]">
                  <Zap className="w-3.5 h-3.5" />
                  <span className="font-semibold">1. AI 임베딩 시맨틱 추천 연결 (Semantic Links)</span>
                </div>
                <span className="text-[11px] font-mono text-[#958da1]">기술 스택 & 맥락 기반</span>
              </div>

              {semanticRecommendations.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {semanticRecommendations.map(({ note: rNote, score, sharedTags }) => (
                    <div
                      key={rNote.id}
                      className="flex items-center justify-between p-2.5 rounded-lg bg-[#14151b] border border-[#2e3547] hover:border-[#4edea3]/40 transition-colors"
                    >
                      <div className="min-w-0 flex-1 mr-2">
                        <div className="flex items-center gap-1.5">
                          <span
                            onClick={() => onSelectNote(rNote.id)}
                            className="text-xs font-medium text-[#e2e2eb] hover:text-[#4edea3] cursor-pointer truncate font-mono"
                          >
                            [[{rNote.title}]]
                          </span>
                          <span className="px-1.5 py-0.2 rounded text-[10px] font-mono bg-[#007650]/20 text-[#4edea3] shrink-0 border border-[#007650]/40">
                            {score}% 유사
                          </span>
                        </div>
                        <div className="text-[10px] text-[#958da1] truncate mt-0.5">
                          {sharedTags.length > 0
                            ? `공유: ${sharedTags.map((t) => `#${t}`).join(' ')}`
                            : `도메인: ${rNote.categoryFull}`}
                        </div>
                      </div>
                      <button
                        onClick={() => {
                          const newLink = `[[${rNote.title}]]`;
                          const updatedNodes = [...(activeNote.connectedNodes || []), newLink];
                          if (onUpdateNote) {
                            onUpdateNote(
                              {
                                ...activeNote,
                                connectedNodes: updatedNodes,
                                backlinksCount: updatedNodes.length
                              },
                              `'${rNote.title}' 문서가 AI 시맨틱 백링크로 즉시 연결되었습니다.`
                            );
                          }
                        }}
                        className="flex items-center gap-1 px-2 py-1 rounded bg-[#282a30] hover:bg-[#383a45] text-[#4edea3] text-[11px] font-mono transition-colors shrink-0"
                      >
                        <Plus className="w-3 h-3" />
                        <span>원클릭 연결</span>
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-2.5 rounded-lg bg-[#14151b] border border-[#232630] text-xs font-mono text-[#958da1]">
                  현재 문서와 연관된 모든 고유사도 문서가 이미 연결되어 있습니다.
                </div>
              )}
            </div>

            {/* Sub-section 2: Unlinked Mentions Detection */}
            <div className="space-y-2 pt-2 border-t border-[#2e3547]/50">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-xs font-mono text-[#e0b6ff]">
                  <Link2 className="w-3.5 h-3.5" />
                  <span className="font-semibold">2. 언링크드 멘션 탐지 (Unlinked Mentions)</span>
                </div>
                <span className="px-1.5 py-0.5 rounded-full text-[10px] font-mono bg-[#282a30] text-[#ccc3d8]">
                  {unlinkedMentions.length}건 감지됨
                </span>
              </div>

              {unlinkedMentions.length > 0 ? (
                <div className="space-y-1.5">
                  {unlinkedMentions.map((uNote) => (
                    <div
                      key={uNote.id}
                      className="flex items-center justify-between p-2 rounded-lg bg-[#14151b] border border-[#232630] text-xs font-mono"
                    >
                      <div className="min-w-0 flex-1 mr-2">
                        <div className="flex items-center gap-2">
                          <span
                            onClick={() => onSelectNote(uNote.id)}
                            className="text-[#e2e2eb] hover:text-[#e0b6ff] cursor-pointer font-medium truncate"
                          >
                            {uNote.title}
                          </span>
                          <span className="text-[10px] text-[#958da1]">
                            본문 내 일반 텍스트로 언급됨
                          </span>
                        </div>
                      </div>
                      <button
                        onClick={() => {
                          const newLink = `[[${uNote.title}]]`;
                          const updatedNodes = [...(activeNote.connectedNodes || []), newLink];
                          if (onUpdateNote) {
                            onUpdateNote(
                              {
                                ...activeNote,
                                connectedNodes: updatedNodes,
                                backlinksCount: updatedNodes.length
                              },
                              `'${uNote.title}' 멘션이 정식 백링크로 승격되었습니다.`
                            );
                          }
                        }}
                        className="flex items-center gap-1 px-2.5 py-1 rounded bg-[#282a30] hover:bg-[#383a45] text-[#e0b6ff] text-[11px] font-mono transition-colors shrink-0"
                      >
                        <Link2 className="w-3 h-3" />
                        <span>백링크로 승격</span>
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-2.5 rounded-lg bg-[#14151b] border border-[#232630] text-xs font-mono text-[#958da1]">
                  본문 내에 `[[ ]]` 없이 언급된 미연결 문서가 없습니다. (모든 키워드 정합성 일치)
                </div>
              )}
            </div>
          </div>

          {/* Context Markdown Text Block / Direct Editor */}
          {isEditingContent ? (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs font-mono text-[#958da1]">
                <span className="flex items-center gap-1.5 text-[#4cd7f6]">
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>마크다운 본문 편집 모드 (Markdown & SQL Supported)</span>
                </span>
                <span>{editContentText.length} 자</span>
              </div>
              <textarea
                value={editContentText}
                onChange={(e) => setEditContentText(e.target.value)}
                rows={16}
                className="w-full p-4 rounded-xl bg-[#0c0e14] border border-[#7c3aed] text-xs font-mono text-[#e2e2eb] leading-relaxed focus:outline-none focus:ring-1 focus:ring-[#7c3aed] resize-y"
                placeholder="마크다운 형식으로 내용을 입력하세요 (예: # 제목, [[백링크]], 코드 블록 등)"
              />
            </div>
          ) : activeNote.content ? (
            <div className="space-y-4">
              <div className="p-4 sm:p-5 rounded-xl bg-[#0c0e14] border border-[#2e3547] text-xs font-mono text-[#e2e2eb] whitespace-pre-wrap leading-relaxed overflow-x-auto max-h-[480px]">
                {activeNote.content}
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <h2 className="text-lg font-semibold text-[#e2e2eb] flex items-center gap-2">
                <span className="text-[#7c3aed]">#</span> {activeNote.title}
              </h2>
              <p className="text-sm text-[#ccc3d8] leading-relaxed">
                {activeNote.excerpt}
              </p>
            </div>
          )}

          {/* Code Block with Syntax Highlighting & Line numbers */}
          {activeNote.codeSnippet && (
            <div className="rounded-xl overflow-hidden bg-[#0c0e14] border border-[#2e3547] shadow-lg">
              {/* Header */}
              <div className="flex items-center justify-between px-3.5 py-2 bg-[#282a30] border-b border-[#33343b]">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#ffb4ab]"></span>
                  <span className="w-2.5 h-2.5 rounded-full bg-[#4cd7f6]"></span>
                  <span className="w-2.5 h-2.5 rounded-full bg-[#4edea3]"></span>
                  <span className="text-xs font-mono font-medium text-[#e2e2eb] ml-1">
                    {activeNote.codeSnippet.filename}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-mono text-[#958da1]">
                    {activeNote.codeSnippet.language}
                  </span>
                  <button
                    onClick={() => handleCopyCode(activeNote.codeSnippet!.code)}
                    className="flex items-center gap-1 px-2 py-1 rounded bg-[#1e1f26] hover:bg-[#33343b] text-[#ccc3d8] text-xs transition-colors"
                    title="코드 복사"
                  >
                    {copiedCode ? <Check className="w-3.5 h-3.5 text-[#4edea3]" /> : <Copy className="w-3.5 h-3.5" />}
                    <span className="text-[11px]">{copiedCode ? '복사됨' : '복사'}</span>
                  </button>
                </div>
              </div>

              {/* Code lines */}
              <div className="p-4 font-mono text-xs leading-relaxed overflow-x-auto text-[#e2e2eb]">
                <pre className="m-0 p-0">
                  <code>{activeNote.codeSnippet.code}</code>
                </pre>
              </div>
            </div>
          )}

          {/* Architecture Topology Diagram or Saga Flowchart */}
          {activeNote.id === 'note-sys-arch-spec' || activeNote.category === 'DB' ? (
            <ArchitectureDiagram />
          ) : (
            <div className="p-4 rounded-xl bg-[#191b22] border border-[#2e3547] space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Workflow className="w-4 h-4 text-[#4edea3]" />
                  <span className="text-sm font-medium text-[#e2e2eb]">Saga Orchestrator Workflow</span>
                </div>
                <span className="text-[11px] font-mono text-[#958da1]">Interactive Flow (Mermaid-v11)</span>
              </div>

              {/* Visual SVG Diagram */}
              <div className="w-full bg-[#0c0e14] rounded-lg p-3 flex justify-center overflow-x-auto">
                <svg
                  className="w-full max-w-[360px] h-[140px]"
                  viewBox="0 0 340 130"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  {/* Step 1: Order Initiated */}
                  <rect x="10" y="45" width="85" height="40" rx="6" fill="#1e1f26" stroke="#2e3547" />
                  <text x="52" y="65" fill="#e2e2eb" fontFamily="JetBrains Mono" fontSize="10" fontWeight="500" textAnchor="middle">
                    주문 요청
                  </text>
                  <text x="52" y="77" fill="#958da1" fontFamily="JetBrains Mono" fontSize="8" textAnchor="middle">
                    Order Initiated
                  </text>

                  {/* Arrow 1 to 2 */}
                  <path d="M95 65 H125" stroke="#7c3aed" strokeWidth="2" strokeLinecap="round" />
                  <polygon points="125,62 131,65 125,68" fill="#7c3aed" />

                  {/* Step 2: Saga Coordinator */}
                  <rect x="131" y="38" width="96" height="54" rx="6" fill="#282a30" stroke="#7c3aed" />
                  <rect x="133" y="40" width="92" height="50" rx="4" fill="#191b22" />
                  <text x="179" y="60" fill="#4cd7f6" fontFamily="JetBrains Mono" fontSize="10" fontWeight="600" textAnchor="middle">
                    Saga Coordinator
                  </text>
                  <text x="179" y="73" fill="#4edea3" fontFamily="JetBrains Mono" fontSize="8" textAnchor="middle">
                    Orchestration
                  </text>
                  <circle cx="179" cy="83" r="2.5" fill="#4edea3" />

                  {/* Arrow to Step 3 */}
                  <path d="M227 55 Q245 55 245 35 H255" fill="none" stroke="#4cd7f6" strokeWidth="1.5" strokeDasharray="3 3" />
                  <polygon points="255,32 260,35 255,38" fill="#4cd7f6" />

                  {/* Arrow to Step 4 */}
                  <path d="M227 75 Q245 75 245 95 H255" fill="none" stroke="#ffb4ab" strokeWidth="1.5" />
                  <polygon points="255,92 260,95 255,98" fill="#ffb4ab" />

                  {/* Step 3: Success Target */}
                  <rect x="260" y="15" width="70" height="36" rx="5" fill="#1e1f26" stroke="#4edea3" strokeWidth="0.8" />
                  <text x="295" y="33" fill="#4edea3" fontFamily="JetBrains Mono" fontSize="9" textAnchor="middle">
                    결제/재고 확정
                  </text>
                  <text x="295" y="43" fill="#958da1" fontFamily="JetBrains Mono" fontSize="7" textAnchor="middle">
                    Commit Event
                  </text>

                  {/* Step 4: Compensation Target */}
                  <rect x="260" y="78" width="70" height="36" rx="5" fill="#1e1f26" stroke="#ffb4ab" strokeWidth="0.8" />
                  <text x="295" y="96" fill="#ffb4ab" fontFamily="JetBrains Mono" fontSize="9" textAnchor="middle">
                    보상 롤백
                  </text>
                  <text x="295" y="106" fill="#958da1" fontFamily="JetBrains Mono" fontSize="7" textAnchor="middle">
                    Rollback Trigger
                  </text>
                </svg>
              </div>
            </div>
          )}
        </div>

        {/* Bottom Floating Stats & AI Re-refine Bar */}
        <div className="sticky bottom-4 z-30 px-4 mt-6 pointer-events-none">
          <div className="max-w-2xl mx-auto pointer-events-auto flex items-center justify-between gap-3 p-2.5 rounded-xl bg-[#282a30]/95 backdrop-blur-lg border border-[#33343b] shadow-2xl">
            <div className="flex items-center gap-3 px-2 text-xs font-mono text-[#ccc3d8]">
              <div>
                <span className="text-[#958da1]">단어: </span>
                <span className="text-[#e2e2eb] font-semibold">{activeNote.wordCount}</span>
              </div>
              <div>
                <span className="text-[#958da1]">자수: </span>
                <span className="text-[#e2e2eb] font-semibold">{activeNote.charCount || 4819}</span>
              </div>
              <div className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-[#4cd7f6]" />
                <span className="text-[#e2e2eb]">{activeNote.readTime || '3분 읽기'}</span>
              </div>
            </div>

            <button
              onClick={handleReRefine}
              disabled={isReRefining}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#7c3aed] hover:bg-[#6d28d9] text-white text-xs font-medium shadow-md transition-transform active:scale-95 disabled:opacity-50"
            >
              <RotateCcw className={`w-3.5 h-3.5 ${isReRefining ? 'animate-spin' : ''}`} />
              <span>{isReRefining ? '재정제 중...' : 'AI 재정제 요청'}</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  /* -------------------------------------------------------------
     VIEW 2: NOTES DASHBOARD & REPOSITORY (Image 5)
  ------------------------------------------------------------- */
  return (
    <div className="flex flex-col w-full pb-24 space-y-6">
      {/* Ambient Gradient Glow Banner */}
      <div className="relative p-4 sm:p-6 bg-gradient-to-b from-[#191b22] to-[#111319] border-b border-[#1f2432] space-y-4 overflow-hidden">
        <div className="absolute -top-16 -right-12 w-64 h-64 bg-[#7c3aed]/15 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute top-24 -left-16 w-52 h-52 bg-[#4cd7f6]/10 rounded-full blur-2xl pointer-events-none"></div>

        {/* Search & Command Input */}
        <div className="relative z-10 w-full">
          <div className="w-full bg-[#191b22] border border-[#2e3547] rounded-xl p-2.5 flex items-center gap-2.5 focus-within:border-[#4cd7f6] transition-colors shadow-md">
            <Search className="w-4 h-4 text-[#4cd7f6] ml-1 shrink-0" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="#태그, @멘션 검색, AI 자연어 탐색 지원..."
              className="bg-transparent border-none outline-none text-xs sm:text-sm text-[#e2e2eb] placeholder:text-[#958da1] w-full min-w-0"
            />
            <kbd className="px-1.5 py-0.5 rounded bg-[#282a30] text-[#958da1] text-[10px] font-mono shrink-0">
              ⌘K
            </kbd>
          </div>

          {/* Quick Filter Pills */}
          <div className="flex items-center gap-1.5 mt-2.5 overflow-x-auto no-scrollbar py-0.5">
            {[
              { label: '#인프라', color: 'text-[#d2bbff]' },
              { label: '#DB설계', color: 'text-[#4cd7f6]' },
              { label: '@배포로그', color: 'text-[#4edea3]' },
              { label: '✨미분류 정제', color: 'text-[#ccc3d8]' }
            ].map((pill) => (
              <button
                key={pill.label}
                onClick={() => {
                  if (activeTag === pill.label) {
                    setActiveTag(null);
                  } else {
                    setActiveTag(pill.label);
                  }
                }}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-full border text-xs font-mono transition-colors shrink-0 ${
                  activeTag === pill.label
                    ? 'bg-[#7c3aed] text-white border-[#7c3aed]'
                    : `bg-[#1e1f26] border-[#2e3547] ${pill.color} hover:bg-[#282a30]`
                }`}
              >
                <span>{pill.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Omni Quick Capture Slate (Living Markdown Input) */}
        <div className="relative z-10 w-full bg-[#1e1f26] border border-[#2e3547] rounded-xl p-4 flex flex-col gap-2.5 shadow-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#4edea3] animate-pulse shadow-[0_0_8px_rgba(78,222,163,0.8)]"></span>
              <span className="text-xs font-mono uppercase tracking-wider text-[#ccc3d8]">
                Omni Quick Capture
              </span>
            </div>
            <span className="text-[11px] font-mono text-[#4cd7f6] flex items-center gap-1">
              <Zap className="w-3 h-3" /> AI 자동 노드 연결
            </span>
          </div>

          <textarea
            value={quickCaptureText}
            onChange={(e) => setQuickCaptureText(e.target.value)}
            rows={2}
            placeholder="날것의 생각이나 코드를 입력하세요... AI가 자동 분류합니다."
            className="w-full bg-[#191b22] border border-[#2e3547]/80 rounded-lg p-3 text-xs sm:text-sm text-[#e2e2eb] placeholder:text-[#958da1] outline-none resize-none focus:border-[#7c3aed] transition-colors"
          />

          <div className="flex items-center justify-between pt-1">
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => onShowToast('음성 캡처 모드가 대기 중입니다.')}
                className="w-8 h-8 rounded-lg bg-[#191b22] hover:bg-[#282a30] text-[#958da1] hover:text-[#4cd7f6] flex items-center justify-center transition-colors"
                title="음성 메모 녹음"
              >
                <Mic className="w-4 h-4" />
              </button>
              <button
                onClick={() => onShowToast('코드 스니펫 서식이 삽입되었습니다.')}
                className="w-8 h-8 rounded-lg bg-[#191b22] hover:bg-[#282a30] text-[#958da1] hover:text-[#d2bbff] flex items-center justify-center transition-colors"
                title="스니펫 추가"
              >
                <Code2 className="w-4 h-4" />
              </button>
              <button
                onClick={() => onShowToast('스크린샷 캡처 도구가 활성화되었습니다.')}
                className="w-8 h-8 rounded-lg bg-[#191b22] hover:bg-[#282a30] text-[#958da1] hover:text-[#4edea3] flex items-center justify-center transition-colors"
                title="사진/다이어그램 캡처"
              >
                <Camera className="w-4 h-4" />
              </button>
            </div>

            <button
              onClick={handleQuickCapture}
              disabled={isCapturing}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-[#7c3aed] hover:bg-[#6d28d9] text-white text-xs font-semibold shadow-md active:scale-95 transition-all disabled:opacity-50 cursor-pointer"
            >
              <Sparkles className={`w-3.5 h-3.5 ${isCapturing ? 'animate-spin' : ''}`} />
              <span>{isCapturing ? '정제중...' : '정제 저장'}</span>
            </button>
          </div>
        </div>

        {/* Telemetry Metrics Widget (3 Cards) */}
        <div className="relative z-10 grid grid-cols-3 gap-2.5">
          <div className="bg-[#191b22] border border-[#2e3547] rounded-xl p-3 flex flex-col justify-between shadow-sm">
            <div className="flex items-center justify-between">
              <Clock className="w-4 h-4 text-[#4cd7f6]" />
              <span className="text-[10px] font-mono text-[#03b5d3] bg-[#282a30] px-1 py-0.5 rounded">
                +12m
              </span>
            </div>
            <div className="mt-2">
              <div className="text-xl sm:text-2xl font-bold text-[#e2e2eb]">
                48<span className="text-xs text-[#958da1] font-normal ml-0.5">개</span>
              </div>
              <p className="text-[11px] text-[#958da1] mt-0.5 truncate">최근 동기화 노트</p>
            </div>
          </div>

          <div className="bg-[#191b22] border border-[#2e3547] rounded-xl p-3 flex flex-col justify-between shadow-sm">
            <div className="flex items-center justify-between">
              <Sparkles className="w-4 h-4 text-[#d2bbff]" />
              <span className="text-[10px] font-mono text-[#4edea3] bg-[#282a30] px-1 py-0.5 rounded">
                오늘
              </span>
            </div>
            <div className="mt-2">
              <div className="text-xl sm:text-2xl font-bold text-[#d2bbff]">
                14<span className="text-xs text-[#958da1] font-normal ml-0.5">건</span>
              </div>
              <p className="text-[11px] text-[#958da1] mt-0.5 truncate">AI 자동 정제 완료</p>
            </div>
          </div>

          <div className="bg-[#191b22] border border-[#2e3547] rounded-xl p-3 flex flex-col justify-between shadow-sm">
            <div className="flex items-center justify-between">
              <Layers className="w-4 h-4 text-[#4edea3]" />
              <span className="text-[10px] font-mono text-[#d2bbff] bg-[#282a30] px-1 py-0.5 rounded">
                실시간
              </span>
            </div>
            <div className="mt-2">
              <div className="text-xl sm:text-2xl font-bold text-[#e2e2eb]">
                312<span className="text-xs text-[#958da1] font-normal ml-0.5">개</span>
              </div>
              <p className="text-[11px] text-[#958da1] mt-0.5 truncate">지식망 연결 노드</p>
            </div>
          </div>
        </div>
      </div>

      {/* Pinned Knowledge Spaces Carousel */}
      <section className="px-4 sm:px-6 space-y-2.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Pin className="w-4 h-4 text-[#d2bbff]" />
            <h2 className="text-sm font-semibold text-[#e2e2eb]">고정 및 활성 스페이스</h2>
          </div>
          <span className="text-xs font-mono text-[#958da1]">3개 고정됨</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {[
            {
              icon: '🚀',
              name: '플랫폼 엔지니어링',
              path: '/core/infra-mesh',
              docs: 28,
              nodes: 142,
              sync: '98% 동기화',
              dotColor: 'bg-[#4cd7f6]'
            },
            {
              icon: '⚡',
              name: '코어 결제 시스템 API',
              path: '/services/payment-v2',
              docs: 14,
              nodes: 89,
              sync: '정제 검토중',
              dotColor: 'bg-[#d2bbff]'
            },
            {
              icon: '📦',
              name: 'K8s 클라우드 인프라',
              path: '/manifests/argocd',
              docs: 36,
              nodes: 81,
              sync: '최신 상태',
              dotColor: 'bg-[#4edea3]'
            }
          ].map((sp) => (
            <div
              key={sp.name}
              className="bg-[#191b22] hover:bg-[#1e1f26] border border-[#2e3547] rounded-xl p-3 flex flex-col justify-between shadow-md cursor-pointer transition-all group"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-lg">{sp.icon}</span>
                  <div className="flex flex-col">
                    <span className="text-xs font-semibold text-[#e2e2eb] group-hover:text-[#4cd7f6] transition-colors">
                      {sp.name}
                    </span>
                    <span className="text-[10px] font-mono text-[#958da1]">{sp.path}</span>
                  </div>
                </div>
                <span className={`w-2 h-2 rounded-full ${sp.dotColor} shadow-[0_0_6px_rgba(76,215,246,0.6)]`}></span>
              </div>
              <div className="mt-3 flex items-center justify-between pt-2 border-t border-[#2e3547]/50 text-[10px] font-mono">
                <div className="flex items-center gap-1.5">
                  <span className="px-1.5 py-0.5 rounded bg-[#282a30] text-[#4cd7f6]">문서 {sp.docs}</span>
                  <span className="px-1.5 py-0.5 rounded bg-[#282a30] text-[#4edea3]">노드 {sp.nodes}</span>
                </div>
                <span className="text-[#958da1]">{sp.sync}</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Recent Notes Stream */}
      <section className="px-4 sm:px-6 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-[#4cd7f6]" />
            <h2 className="text-sm font-semibold text-[#e2e2eb]">최근 업데이트된 지식</h2>
          </div>
          <button
            onClick={() => onShowToast('전체 48건의 지식 목록을 갱신했습니다.')}
            className="text-xs font-mono text-[#958da1] hover:text-[#d2bbff] transition-colors flex items-center gap-0.5"
          >
            <span>전체보기</span>
            <ArrowRight className="w-3 h-3" />
          </button>
        </div>

        <div className="space-y-3">
          {filteredNotes.map((note) => (
            <article
              key={note.id}
              onClick={() => onSelectNote(note.id)}
              className="w-full bg-[#191b22] hover:bg-[#1e1f26] border border-[#2e3547] rounded-xl p-4 shadow-md flex flex-col gap-2.5 transition-all cursor-pointer group"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded bg-[#282a30] text-[#4cd7f6] text-[11px] font-mono font-semibold uppercase">
                    {note.category}
                  </span>
                  <span className="text-[11px] font-mono text-[#958da1]">{note.updatedAt}</span>
                </div>

                <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#7c3aed]/20 text-[#d2bbff] text-[11px] font-mono shadow-[0_0_12px_rgba(210,187,255,0.15)]">
                  <Sparkles className="w-3 h-3" />
                  <span>{note.statusBadge}</span>
                </div>
              </div>

              <div className="flex flex-col">
                <h3 className="text-sm font-semibold text-[#e2e2eb] group-hover:text-[#4cd7f6] transition-colors">
                  {note.title}
                </h3>
                <p className="text-xs text-[#958da1] mt-1 line-clamp-2 leading-relaxed">
                  {note.excerpt}
                </p>
              </div>

              <div className="flex items-center justify-between pt-1 border-t border-[#2e3547]/50">
                <div className="flex items-center gap-1.5 flex-wrap">
                  {note.tags.map((t) => (
                    <span
                      key={t}
                      className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[#282a30] text-[#ccc3d8]"
                    >
                      {t}
                    </span>
                  ))}
                </div>

                <div className="flex items-center gap-3 text-[11px] font-mono text-[#958da1]">
                  <span className="flex items-center gap-1">
                    <BookOpen className="w-3.5 h-3.5" />
                    {note.wordCount.toLocaleString()}단어
                  </span>
                  <span className="flex items-center gap-1 text-[#d2bbff]">
                    <LinkIcon className="w-3.5 h-3.5" />
                    {note.backlinksCount} 역링크
                  </span>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
};
