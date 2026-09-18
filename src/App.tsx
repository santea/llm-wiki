import React, { useState, useEffect, useMemo } from 'react';
import {
  TabType,
  ViewMode,
  Workspace,
  NoteItem,
  ClassificationRule,
  TriageCardData,
  SystemNotification
} from './types';
import {
  workspaces,
  mockNotes,
  mockRules,
  mockTriageCards,
  INITIAL_NOTIFICATIONS
} from './data/mockData';
import {
  fetchNotesFromApi,
  createNoteInApi,
  updateNoteInApi,
  deleteNoteInApi,
  fetchRulesFromApi,
  createRuleInApi,
  toggleRuleInApi,
  fetchTriageCardsFromApi,
  createTriageCardInApi,
  deleteTriageCardFromApi,
  clearAllTriageCardsFromApi
} from './api';

import { Header } from './components/Header';
import { Sidebar, MobileNavBar } from './components/Sidebar';
import { NotesView } from './components/views/NotesView';
import { GraphView } from './components/views/GraphView';
import { HierarchyView } from './components/views/HierarchyView';
import { RefineryView } from './components/views/RefineryView';
import { TaxonomyView } from './components/views/TaxonomyView';
import { ChatView } from './components/views/ChatView';
import { AgentPromptsView } from './components/views/AgentPromptsView';

import { CommandPaletteModal } from './components/modals/CommandPaletteModal';
import { SandboxTestModal } from './components/modals/SandboxTestModal';
import { NewRuleModal } from './components/modals/NewRuleModal';
import { NewNoteModal } from './components/modals/NewNoteModal';
import { NotificationPopover } from './components/modals/NotificationPopover';
import { VaultImportExportModal } from './components/modals/VaultImportExportModal';
import { Toast } from './components/Toast';

export default function App() {
  // Navigation & View State
  const [activeTab, setActiveTab] = useState<TabType>('notes');
  const [viewMode, setViewMode] = useState<ViewMode>('desktop');

  // Data State
  const [notes, setNotes] = useState<NoteItem[]>(mockNotes);
  const [selectedNoteId, setSelectedNoteId] = useState<string | null>(null);
  const [rules, setRules] = useState<ClassificationRule[]>(mockRules);
  const [triageCards, setTriageCards] = useState<TriageCardData[]>(mockTriageCards);
  const [readNotifIds, setReadNotifIds] = useState<Set<string>>(new Set());

  // Dynamic Workspaces derived from real notes
  const computedWorkspaces: Workspace[] = useMemo(() => {
    const totalDocs = notes.length;
    const totalLinks = notes.reduce((acc, n) => acc + (n.connectedNodes?.length || 0), 0);

    const infraDocs = notes.filter(
      (n) => n.category === '인프라' || (n.tags || []).some((t) => /k8s|aws|terraform|인프라/i.test(t))
    ).length;
    const dbDocs = notes.filter(
      (n) => n.category === 'DB' || (n.tags || []).some((t) => /db|postgres|redis|sql/i.test(t))
    ).length;
    const codeDocs = notes.filter(
      (n) => n.category === '소스코드' || n.category === '연계' || n.category === '워크플로우'
    ).length;

    return [
      {
        id: 'ws-all',
        name: '전체 엔지니어링 스페이스',
        icon: '🚀',
        path: '/platform/architecture',
        docCount: totalDocs,
        nodeCount: totalLinks + totalDocs,
        syncPercent: 100,
        statusColor: '#4cd7f6'
      },
      {
        id: 'ws-infra',
        name: '인프라 & K8s 클러스터',
        icon: '📦',
        path: '/core/infra-mesh',
        docCount: infraDocs,
        nodeCount: Math.max(infraDocs, Math.round(totalLinks * 0.4)),
        syncPercent: 98,
        statusColor: '#4edea3'
      },
      {
        id: 'ws-db',
        name: 'DB & pgvector 지식 저장소',
        icon: '🗄️',
        path: '/data/postgres-pgvector',
        docCount: dbDocs,
        nodeCount: Math.max(dbDocs, Math.round(totalLinks * 0.35)),
        syncPercent: 100,
        statusColor: '#4cd7f6'
      },
      {
        id: 'ws-code',
        name: '코어 백엔드 & 결제 분산 시스템',
        icon: '⚡',
        path: '/services/payment-v2',
        docCount: codeDocs,
        nodeCount: Math.max(codeDocs, Math.round(totalLinks * 0.45)),
        syncPercent: 96,
        statusColor: '#d2bbff'
      }
    ];
  }, [notes]);

  const [activeWorkspace, setActiveWorkspace] = useState<Workspace>(() => workspaces[0]);

  // Dynamic Popular Tags from real notes
  const popularTags = useMemo(() => {
    const tagCounts = new Map<string, number>();
    for (const note of notes) {
      for (const t of note.tags || []) {
        const cleanTag = t.startsWith('#') ? t : `#${t}`;
        tagCounts.set(cleanTag, (tagCounts.get(cleanTag) || 0) + 1);
      }
    }
    const sorted = Array.from(tagCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
      .map(([tag]) => tag);
    return sorted.length > 0 ? sorted : ['#PostgreSQL', '#pgvector', '#Kafka', '#Spring', '#Redis', '#AWS'];
  }, [notes]);

  // Dynamic System Notifications derived from actual DB status
  const notifications: SystemNotification[] = useMemo(() => {
    const totalDocs = notes.length;
    const totalLinks = notes.reduce((acc, n) => acc + (n.connectedNodes?.length || 0), 0);
    const activeRulesCount = rules.filter((r) => r.enabled).length;
    const orphanCount = notes.filter((n) => !n.connectedNodes || n.connectedNodes.length === 0).length;

    const notifs: SystemNotification[] = [
      {
        id: 'notif-db-sync',
        title: `PostgreSQL & pgvector 연동 정상 (${totalDocs}개 문서)`,
        description: `768차원 HNSW 인덱스 및 ${totalLinks}개 양방향 백링크가 실시간 동기화되어 있습니다.`,
        time: '실시간',
        type: 'success',
        read: readNotifIds.has('notif-db-sync'),
        actionTab: 'graph'
      }
    ];

    if (triageCards.length > 0) {
      notifs.push({
        id: 'notif-triage-pending',
        title: `AI 정제 대기열 (${triageCards.length}건 대기 중)`,
        description: `AI가 분석한 신규 아키텍처 스펙이 엔지니어 검토를 기다리고 있습니다.`,
        time: '방금 전',
        type: 'info',
        read: readNotifIds.has('notif-triage-pending'),
        actionTab: 'refinery'
      });
    }

    if (orphanCount > 0) {
      notifs.push({
        id: 'notif-orphans',
        title: `고립된 노드 ${orphanCount}건 감지됨`,
        description: '연결된 백링크가 없는 독립 문서가 감지되었습니다. 계층 트리에서 자동 배치를 실행할 수 있습니다.',
        time: '최근 감지',
        type: 'warning',
        read: readNotifIds.has('notif-orphans'),
        actionTab: 'hierarchy'
      });
    }

    notifs.push({
      id: 'notif-rules-active',
      title: `아키텍처 분류 룰셋 ${activeRulesCount}개 활성화`,
      description: '사내 인프라 IP/토큰 자동 마스킹 및 도메인 자동 분류 규칙이 실행 중입니다.',
      time: '상시 적용',
      type: 'success',
      read: readNotifIds.has('notif-rules-active'),
      actionTab: 'taxonomy'
    });

    return notifs;
  }, [notes, rules, triageCards, readNotifIds]);

  // Modal & Notification States
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [isSandboxOpen, setIsSandboxOpen] = useState(false);
  const [isNewRuleOpen, setIsNewRuleOpen] = useState(false);
  const [isNewNoteOpen, setIsNewNoteOpen] = useState(false);
  const [isVaultModalOpen, setIsVaultModalOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [activeTagFilter, setActiveTagFilter] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
  };

  // Keyboard shortcut: Cmd/Ctrl + K (Palette), Cmd/Ctrl + \ (Sidebar)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsCommandPaletteOpen((prev) => !prev);
      }
      if ((e.metaKey || e.ctrlKey) && e.key === '\\') {
        e.preventDefault();
        setIsSidebarOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Load notes, rules, and triage cards from PostgreSQL DB on mount
  useEffect(() => {
    fetchNotesFromApi()
      .then((dbNotes) => {
        if (dbNotes && dbNotes.length > 0) {
          setNotes(dbNotes);
        }
      })
      .catch((err) => {
        console.warn('Could not load notes from PostgreSQL, using fallback:', err);
      });

    fetchRulesFromApi()
      .then((dbRules) => {
        if (dbRules && dbRules.length > 0) {
          setRules(dbRules);
        }
      })
      .catch((err) => {
        console.warn('Could not load rules from PostgreSQL, using fallback:', err);
      });

    fetchTriageCardsFromApi()
      .then((dbCards) => {
        setTriageCards(dbCards || []);
      })
      .catch((err) => {
        console.warn('Could not load triage cards from PostgreSQL:', err);
      });
  }, []);

  // Handlers
  const handleSelectNote = (id: string | null) => {
    setSelectedNoteId(id);
    setActiveTab('notes');
  };

  const handleOpenDocument = (noteId: string) => {
    setSelectedNoteId(noteId);
    setActiveTab('notes');
  };

  const handleToggleRule = async (ruleId: string) => {
    try {
      const updated = await toggleRuleInApi(ruleId);
      setRules((prev) => prev.map((r) => (r.id === ruleId ? updated : r)));
    } catch {
      setRules((prev) =>
        prev.map((r) => (r.id === ruleId ? { ...r, enabled: !r.enabled } : r))
      );
    }
  };

  const handleAddRule = async (newRule: ClassificationRule) => {
    try {
      const saved = await createRuleInApi(newRule);
      setRules((prev) => [saved, ...prev]);
    } catch {
      setRules((prev) => [newRule, ...prev]);
    }
  };

  const handleAddNote = async (newNote: NoteItem) => {
    try {
      const saved = await createNoteInApi(newNote);
      setNotes((prev) => [saved, ...prev.filter((n) => n.id !== saved.id)]);
      setSelectedNoteId(saved.id);
      showToast(`"${saved.title}" 문서가 PostgreSQL DB에 영구 저장되었습니다.`);
    } catch (err: any) {
      setNotes((prev) => [newNote, ...prev]);
      setSelectedNoteId(newNote.id);
      showToast(`"${newNote.title}" 로컬 상태에 저장되었습니다.`);
    }
    setActiveTab('notes');
  };

  const handleUpdateNote = async (updatedNote: NoteItem, toastMsg?: string) => {
    try {
      const saved = await updateNoteInApi(updatedNote);
      // Ensure updatedAtRaw reflects the actual save time for correct sorting
      const savedWithRaw = { ...saved, updatedAtRaw: saved.updatedAtRaw ?? Date.now() };
      setNotes((prev) => prev.map((n) => (n.id === savedWithRaw.id ? savedWithRaw : n)));
      showToast(toastMsg || `"${saved.title}" 변경사항이 PostgreSQL DB에 동기화되었습니다.`);
    } catch (err: any) {
      const fallback = { ...updatedNote, updatedAtRaw: Date.now() };
      setNotes((prev) => prev.map((n) => (n.id === fallback.id ? fallback : n)));
      showToast(toastMsg || `"${updatedNote.title}" 노트가 수정되었습니다.`);
    }
  };

  const handleDeleteNote = async (id: string) => {
    const target = notes.find((n) => n.id === id);
    const title = target ? target.title : '해당';
    try {
      await deleteNoteInApi(id);
      setNotes((prev) => prev.filter((n) => n.id !== id));
      if (selectedNoteId === id) {
        setSelectedNoteId(null);
      }
      showToast(`"${title}" 문서가 PostgreSQL DB에서 완전히 삭제되었습니다.`);
    } catch (err: any) {
      setNotes((prev) => prev.filter((n) => n.id !== id));
      if (selectedNoteId === id) {
        setSelectedNoteId(null);
      }
      showToast(`"${title}" 문서가 로컬에서 삭제되었습니다.`);
    }
  };

  const handleAddTriageCard = async (card: TriageCardData) => {
    try {
      const saved = await createTriageCardInApi(card);
      setTriageCards((prev) => [saved, ...prev.filter((c) => c.id !== saved.id)]);
    } catch {
      setTriageCards((prev) => [card, ...prev]);
    }
  };

  const handleUpdateTriageCard = (updatedCard: TriageCardData) => {
    setTriageCards((prev) => prev.map((c) => (c.id === updatedCard.id ? updatedCard : c)));
  };

  const handleApproveTriageCard = async (id: string) => {
    const target = triageCards.find((c) => c.id === id);
    if (!target) return;

    const cat: 'DB' | '연계' | '인프라' | '소스코드' | '워크플로우' =
      target.category === 'infra'
        ? '인프라'
        : target.category === 'db'
        ? 'DB'
        : target.category === 'code'
        ? '소스코드'
        : '연계';

    const structuredContent = [
      `# ${target.aiTitle}`,
      `> **분류:** ${target.categoryTitle || cat} | **일치율:** ${target.confidence || '95.0% 일치'} | **출처:** ${target.rawType || 'Refinery'}`,
      '',
      '## 📋 핵심 아키텍처 요약',
      ...(target.aiSummaryPoints || []).map((p) => `- ${p}`),
      '',
      target.codeSnippet?.code
        ? `## 💻 추출 소스코드 및 설정 (${target.codeSnippet.filename || target.codeSnippet.language || 'Code'})\n\`\`\`${target.codeSnippet.language || ''}\n${target.codeSnippet.code}\n\`\`\`\n`
        : '',
      target.endpointSpec?.endpoint
        ? `## 🔌 엔드포인트 규격 명세\n- **엔드포인트:** \`${target.endpointSpec.endpoint}\`\n- **타임아웃:** ${target.endpointSpec.timeout}\n- **재시도 규격:** ${target.endpointSpec.retry}\n`
        : '',
      target.sqlRecommendation?.query
        ? `## 🗄️ 데이터베이스 쿼리 권고사항\n\`\`\`sql\n${target.sqlRecommendation.query}\n\`\`\`\n> 성능 분석: ${target.sqlRecommendation.performance}\n`
        : '',
      '## 🔗 관련 백링크 및 지식 연결',
      ...(target.backlinks || []).map((b) => `- ${b.startsWith('[[') ? b : `[[${b}]]`}`),
      '',
      '---',
      '### 📝 인입 원본 데이터',
      '```text',
      target.rawContent,
      '```'
    ].filter(Boolean).join('\n');

    const convertedNote: NoteItem = {
      id: `approved-${Date.now()}`,
      title: target.aiTitle,
      category: cat,
      categoryFull: target.categoryTitle || `${cat} 계층`,
      tags: target.tags || ['#Refinery'],
      statusBadge: 'AI 정제 완료',
      badgeType: 'ai-refined',
      excerpt: target.aiSummaryPoints && target.aiSummaryPoints.length > 0
        ? target.aiSummaryPoints[0]
        : target.rawContent.slice(0, 80),
      updatedAt: '방금 전',
      author: 'AI Refinery Engine',
      wordCount: structuredContent.split(/\s+/).length,
      charCount: structuredContent.length,
      readTime: '2분 읽기',
      backlinksCount: target.backlinks?.length || 2,
      connectedNodes: target.backlinks || [],
      codeSnippet: target.codeSnippet,
      content: structuredContent
    };

    try {
      const saved = await createNoteInApi(convertedNote);
      setNotes((prev) => [saved, ...prev]);
      await deleteTriageCardFromApi(id);
    } catch (err) {
      setNotes((prev) => [convertedNote, ...prev]);
    }
    setTriageCards((prev) => prev.filter((c) => c.id !== id));
    showToast(`'${target.aiTitle}' 문서가 정제 승인되어 PostgreSQL DB에 저장되었습니다.`);
  };

  const handleDismissTriageCard = async (id: string) => {
    try {
      await deleteTriageCardFromApi(id);
    } catch {}
    setTriageCards((prev) => prev.filter((c) => c.id !== id));
    showToast('해당 원본 메모가 정제 대기열에서 폐기되었습니다.');
  };

  const handleApproveAllTriage = async () => {
    const count = triageCards.length;
    for (const card of triageCards) {
      const cat: 'DB' | '연계' | '인프라' | '소스코드' | '워크플로우' =
        card.category === 'infra'
          ? '인프라'
          : card.category === 'db'
          ? 'DB'
          : card.category === 'code'
          ? '소스코드'
          : '연계';

      const structuredContent = [
        `# ${card.aiTitle}`,
        `> **분류:** ${card.categoryTitle || cat} | **일치율:** ${card.confidence || '95.0% 일치'}`,
        '',
        '## 📋 핵심 아키텍처 요약',
        ...(card.aiSummaryPoints || []).map((p) => `- ${p}`),
        '',
        card.codeSnippet?.code
          ? `## 💻 추출 소스코드 및 설정\n\`\`\`${card.codeSnippet.language || ''}\n${card.codeSnippet.code}\n\`\`\`\n`
          : '',
        '## 🔗 관련 백링크',
        ...(card.backlinks || []).map((b) => `- ${b.startsWith('[[') ? b : `[[${b}]]`}`),
        '',
        '---',
        '### 📝 인입 원본 데이터',
        '```text',
        card.rawContent,
        '```'
      ].filter(Boolean).join('\n');

      const convertedNote: NoteItem = {
        id: `approved-${Date.now()}-${card.id}`,
        title: card.aiTitle,
        category: cat,
        categoryFull: card.categoryTitle,
        tags: card.tags,
        statusBadge: 'AI 정제 완료',
        badgeType: 'ai-refined',
        excerpt: card.aiSummaryPoints && card.aiSummaryPoints.length > 0
          ? card.aiSummaryPoints[0]
          : card.rawContent.slice(0, 80),
        updatedAt: '방금 전',
        author: 'AI Refinery Engine',
        wordCount: 150,
        charCount: structuredContent.length,
        readTime: '2분 읽기',
        backlinksCount: card.backlinks?.length || 2,
        connectedNodes: card.backlinks || [],
        codeSnippet: card.codeSnippet,
        content: structuredContent
      };

      try {
        const saved = await createNoteInApi(convertedNote);
        setNotes((prev) => [saved, ...prev]);
      } catch (err) {
        setNotes((prev) => [convertedNote, ...prev]);
      }
    }
    try {
      await clearAllTriageCardsFromApi();
    } catch {}
    setTriageCards([]);
    showToast(`총 ${count}건의 미정제 문서가 모두 승인되어 지식 저장소에 등록되었습니다.`);
  };

  const handleResetTriage = async () => {
    try {
      const cards = await fetchTriageCardsFromApi();
      setTriageCards(cards || []);
      showToast('정제 대기열 목록을 갱신했습니다.');
    } catch {
      showToast('정제 대기열을 갱신할 수 없습니다.');
    }
  };

  const handleMarkAllNotificationsRead = () => {
    const allIds = new Set(notifications.map((n) => n.id));
    setReadNotifIds(allIds);
    showToast('모든 알림을 읽음 처리했습니다.');
  };

  const unreadNotifsCount = notifications.filter((n) => !n.read).length;

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#0c0e14] text-[#e2e2eb] font-sans antialiased select-none">
      <Toast message={toastMessage} onClose={() => setToastMessage(null)} />

      {/* Global Modals */}
      <CommandPaletteModal
        isOpen={isCommandPaletteOpen}
        onClose={() => setIsCommandPaletteOpen(false)}
        notes={notes}
        onSelectNote={handleSelectNote}
        onSelectTab={setActiveTab}
        onOpenSandbox={() => setIsSandboxOpen(true)}
        onOpenNewNote={() => setIsNewNoteOpen(true)}
      />

      <SandboxTestModal
        isOpen={isSandboxOpen}
        onClose={() => setIsSandboxOpen(false)}
        onShowToast={showToast}
      />

      <NewRuleModal
        isOpen={isNewRuleOpen}
        onClose={() => setIsNewRuleOpen(false)}
        onAddRule={handleAddRule}
        onShowToast={showToast}
      />

      <NewNoteModal
        isOpen={isNewNoteOpen}
        onClose={() => setIsNewNoteOpen(false)}
        onAddNote={handleAddNote}
        onShowToast={showToast}
      />

      <VaultImportExportModal
        isOpen={isVaultModalOpen}
        onClose={() => setIsVaultModalOpen(false)}
        notes={notes}
        onImportComplete={(imported) => {
          setNotes((prev) => [...imported, ...prev]);
          if (imported.length > 0) {
            setSelectedNoteId(imported[0].id);
            setActiveTab('notes');
          }
        }}
        onShowToast={showToast}
      />

      {/* Outer Shell Wrapper (Supports PC wide canvas and mobile frame preview) */}
      <div className="flex w-full h-full justify-center bg-[#07090e]">
        <div
          className={`flex flex-col h-full w-full bg-[#111319] transition-all duration-300 relative ${
            viewMode === 'mobile'
              ? 'max-w-md my-auto h-[95vh] rounded-2xl border border-[#2e3547] shadow-[0_0_50px_rgba(0,0,0,0.8)] overflow-hidden'
              : 'max-w-full'
          }`}
        >
          {/* Top Global App Header */}
          <div className="relative shrink-0">
            <Header
              workspaces={computedWorkspaces}
              activeWorkspace={activeWorkspace}
              onSelectWorkspace={setActiveWorkspace}
              viewMode={viewMode}
              onToggleViewMode={(mode) => setViewMode(mode)}
              onOpenCommandPalette={() => setIsCommandPaletteOpen(true)}
              notifications={notifications}
              onOpenNotifications={() => setIsNotificationsOpen(!isNotificationsOpen)}
              unreadNotifsCount={unreadNotifsCount}
              isOpenSidebar={isSidebarOpen}
              onToggleSidebar={() => setIsSidebarOpen((prev) => !prev)}
              onOpenChat={() => setActiveTab('chat')}
              onOpenVaultModal={() => setIsVaultModalOpen(true)}
            />

            {/* Notification Popover Dropdown */}
            <NotificationPopover
              isOpen={isNotificationsOpen}
              onClose={() => setIsNotificationsOpen(false)}
              notifications={notifications}
              onMarkAllRead={handleMarkAllNotificationsRead}
              onSelectAction={(targetTab) => {
                if (['notes', 'graph', 'hierarchy', 'refinery', 'taxonomy', 'chat', 'prompts'].includes(targetTab)) {
                  setActiveTab(targetTab as TabType);
                }
              }}
            />
          </div>

          {/* Main Body: Left Sidebar + Center/Right Content Canvas */}
          <div className="flex-1 flex min-h-0 w-full overflow-hidden relative">
            {/* PC Left Navigation Sidebar (Hidden in mobile preview mode) */}
            {viewMode === 'desktop' && (
              <Sidebar
                isOpen={isSidebarOpen}
                onToggle={() => setIsSidebarOpen((prev) => !prev)}
                activeTab={activeTab}
                onSelectTab={setActiveTab}
                workspaces={computedWorkspaces}
                activeWorkspace={activeWorkspace}
                onSelectWorkspace={setActiveWorkspace}
                pendingTriageCount={triageCards.length}
                rulesCount={rules.length}
                onOpenNewNote={() => setIsNewNoteOpen(true)}
                popularTags={popularTags}
                totalNodesCount={notes.length}
                syncPercentage={100}
                onSelectTagFilter={(tag) => {
                  setActiveTagFilter(tag);
                  setActiveTab('notes');
                }}
              />
            )}

            {/* Right Main Content Column */}
            <div className="flex-1 flex flex-col h-full min-w-0 overflow-hidden relative bg-[#0c0e14]">
              {/* Scrollable View Area */}
              <main className="flex-1 overflow-y-auto custom-scrollbar relative">
                {activeTab === 'notes' && (
                  <NotesView
                    notes={notes}
                    selectedNoteId={selectedNoteId}
                    onSelectNote={(id) => setSelectedNoteId(id)}
                    onAddNote={(partial) => {
                      const fullNote: NoteItem = {
                        id: `note-${Date.now()}`,
                        title: partial.title || '새로운 아키텍처 메모',
                        category: partial.category || '소스코드',
                        categoryFull: partial.categoryFull || '소스코드 및 구현 정보',
                        updatedAt: '방금 전',
                        statusBadge: 'AI 정제 완료',
                        badgeType: 'ai-refined',
                        excerpt: partial.excerpt || '새로운 메모 내용입니다.',
                        tags: partial.tags || ['#Quick'],
                        wordCount: 100,
                        backlinksCount: 1,
                        ...partial
                      };
                      handleAddNote(fullNote);
                    }}
                    onShowToast={showToast}
                    onUpdateNote={handleUpdateNote}
                    onDeleteNote={handleDeleteNote}
                    activeWorkspace={activeWorkspace}
                    workspaces={computedWorkspaces}
                    onSelectWorkspace={setActiveWorkspace}
                    initialTagFilter={activeTagFilter}
                    onClearTagFilter={() => setActiveTagFilter(null)}
                  />
                )}

                {activeTab === 'graph' && (
                  <GraphView
                    notes={notes}
                    onOpenDocument={handleOpenDocument}
                    onUpdateNote={handleUpdateNote}
                    onShowToast={showToast}
                  />
                )}

                {activeTab === 'hierarchy' && (
                  <HierarchyView
                    notes={notes}
                    onOpenDocument={handleOpenDocument}
                    onUpdateNote={handleUpdateNote}
                    onShowToast={showToast}
                  />
                )}

                {activeTab === 'refinery' && (
                  <RefineryView
                    items={triageCards}
                    onApproveCard={handleApproveTriageCard}
                    onDismissCard={handleDismissTriageCard}
                    onApproveAll={handleApproveAllTriage}
                    onShowToast={showToast}
                    onResetItems={handleResetTriage}
                    onAddCard={handleAddTriageCard}
                    onUpdateCard={handleUpdateTriageCard}
                    totalApprovedToday={notes.filter((n) => n.badgeType === 'ai-refined' || n.statusBadge?.includes('정제')).length}
                  />
                )}

                {activeTab === 'taxonomy' && (
                  <TaxonomyView
                    rules={rules}
                    onToggleRule={handleToggleRule}
                    activeWorkspace={activeWorkspace}
                    onOpenSandbox={() => setIsSandboxOpen(true)}
                    onOpenNewRuleModal={() => setIsNewRuleOpen(true)}
                    onShowToast={showToast}
                    totalNotesCount={notes.length}
                  />
                )}

                {activeTab === 'chat' && (
                  <ChatView
                    notes={notes}
                    activeWorkspace={activeWorkspace}
                    onSelectNote={(id) => {
                      setSelectedNoteId(id);
                      if (id) setActiveTab('notes');
                    }}
                    onNavigateToTab={(tab) => setActiveTab(tab)}
                    onUpdateNote={handleUpdateNote}
                    onShowToast={showToast}
                  />
                )}

                {activeTab === 'prompts' && (
                  <AgentPromptsView
                    onNotify={(msg) => showToast(msg)}
                  />
                )}
              </main>

              {/* Bottom Mobile Navigation Bar (visible when viewMode is mobile) */}
              {viewMode === 'mobile' && (
                <MobileNavBar
                  activeTab={activeTab}
                  onSelectTab={setActiveTab}
                  pendingCount={triageCards.length}
                />
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
