import React, { useState, useEffect } from 'react';
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
  mockGraphNodes,
  mockGraphLinks,
  mockRules,
  mockTriageCards,
  INITIAL_NOTIFICATIONS
} from './data/mockData';

import { Header } from './components/Header';
import { Sidebar, MobileNavBar } from './components/Sidebar';
import { NotesView } from './components/views/NotesView';
import { GraphView } from './components/views/GraphView';
import { HierarchyView } from './components/views/HierarchyView';
import { RefineryView } from './components/views/RefineryView';
import { TaxonomyView } from './components/views/TaxonomyView';
import { ChatView } from './components/views/ChatView';

import { CommandPaletteModal } from './components/modals/CommandPaletteModal';
import { SandboxTestModal } from './components/modals/SandboxTestModal';
import { NewRuleModal } from './components/modals/NewRuleModal';
import { NewNoteModal } from './components/modals/NewNoteModal';
import { NotificationPopover } from './components/modals/NotificationPopover';
import { Toast } from './components/Toast';

export default function App() {
  // Navigation & View State
  const [activeTab, setActiveTab] = useState<TabType>('notes');
  const [viewMode, setViewMode] = useState<ViewMode>('desktop');
  const [activeWorkspace, setActiveWorkspace] = useState<Workspace>(workspaces[0]);

  // Data State
  const [notes, setNotes] = useState<NoteItem[]>(mockNotes);
  const [selectedNoteId, setSelectedNoteId] = useState<string | null>(null);
  const [rules, setRules] = useState<ClassificationRule[]>(mockRules);
  const [triageCards, setTriageCards] = useState<TriageCardData[]>(mockTriageCards);
  const [notifications, setNotifications] = useState<SystemNotification[]>(INITIAL_NOTIFICATIONS);

  // Modal & Notification States
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [isSandboxOpen, setIsSandboxOpen] = useState(false);
  const [isNewRuleOpen, setIsNewRuleOpen] = useState(false);
  const [isNewNoteOpen, setIsNewNoteOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

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

  // Handlers
  const handleSelectNote = (id: string | null) => {
    setSelectedNoteId(id);
    setActiveTab('notes');
  };

  const handleOpenDocument = (noteId: string) => {
    setSelectedNoteId(noteId);
    setActiveTab('notes');
  };

  const handleToggleRule = (ruleId: string) => {
    setRules((prev) =>
      prev.map((r) => (r.id === ruleId ? { ...r, enabled: !r.enabled } : r))
    );
  };

  const handleAddRule = (newRule: ClassificationRule) => {
    setRules((prev) => [newRule, ...prev]);
  };

  const handleAddNote = (newNote: NoteItem) => {
    setNotes((prev) => [newNote, ...prev]);
    setSelectedNoteId(newNote.id);
    setActiveTab('notes');
  };

  const handleUpdateNote = (updatedNote: NoteItem) => {
    setNotes((prev) => prev.map((n) => (n.id === updatedNote.id ? updatedNote : n)));
    showToast(`"${updatedNote.title}" 노트가 AI 제안에 따라 성공적으로 패치 및 커밋되었습니다.`);
  };

  const handleApproveTriageCard = (id: string) => {
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

    const convertedNote: NoteItem = {
      id: `approved-${Date.now()}`,
      title: target.aiTitle,
      category: cat,
      categoryFull: target.categoryTitle,
      tags: target.tags,
      statusBadge: 'AI 정제 완료',
      badgeType: 'ai-refined',
      excerpt: target.aiSummaryPoints
        ? target.aiSummaryPoints[0]
        : target.endpointSpec?.endpoint || target.rawContent.slice(0, 80),
      updatedAt: '방금 전',
      author: 'AI Refinery v3.4',
      wordCount: 150,
      charCount: 650,
      readTime: '2분 읽기',
      backlinksCount: target.backlinks?.length || 2,
      connectedNodes: target.backlinks || ['[[Kafka 클러스터]]'],
      codeSnippet: {
        filename: 'RefinedSpec.md',
        language: 'Markdown',
        code: target.rawContent
      }
    };

    setNotes((prev) => [convertedNote, ...prev]);
    setTriageCards((prev) => prev.filter((c) => c.id !== id));
    showToast(`'${target.aiTitle}' 문서가 지식 저장소에 정제 승인되었습니다.`);
  };

  const handleDismissTriageCard = (id: string) => {
    setTriageCards((prev) => prev.filter((c) => c.id !== id));
    showToast('해당 원본 메모가 정제 대기열에서 폐기되었습니다.');
  };

  const handleApproveAllTriage = () => {
    const count = triageCards.length;
    triageCards.forEach((card) => {
      const cat: 'DB' | '연계' | '인프라' | '소스코드' | '워크플로우' =
        card.category === 'infra'
          ? '인프라'
          : card.category === 'db'
          ? 'DB'
          : card.category === 'code'
          ? '소스코드'
          : '연계';

      const convertedNote: NoteItem = {
        id: `approved-${Date.now()}-${card.id}`,
        title: card.aiTitle,
        category: cat,
        categoryFull: card.categoryTitle,
        tags: card.tags,
        statusBadge: 'AI 정제 완료',
        badgeType: 'ai-refined',
        excerpt: card.aiSummaryPoints
          ? card.aiSummaryPoints[0]
          : card.rawContent.slice(0, 80),
        updatedAt: '방금 전',
        author: 'AI Refinery v3.4',
        wordCount: 120,
        charCount: 500,
        readTime: '1분 읽기',
        backlinksCount: 2,
        connectedNodes: ['[[Kafka 클러스터]]']
      };
      setNotes((prev) => [convertedNote, ...prev]);
    });
    setTriageCards([]);
    showToast(`${count}건의 모든 원본 메모가 자동 승인 및 지식화되었습니다.`);
  };

  const handleResetTriage = () => {
    setTriageCards(mockTriageCards);
    showToast('새로운 원본 메모들이 정제 대기열에 인입되었습니다.');
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
              workspaces={workspaces}
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
            />

            {/* Notification Popover Dropdown */}
            <NotificationPopover
              isOpen={isNotificationsOpen}
              onClose={() => setIsNotificationsOpen(false)}
              onSelectAction={(type) => {
                if (type === 'refinery') setActiveTab('refinery');
                else if (type === 'hierarchy') setActiveTab('hierarchy');
                else if (type === 'graph') setActiveTab('graph');
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
                workspaces={workspaces}
                activeWorkspace={activeWorkspace}
                onSelectWorkspace={setActiveWorkspace}
                pendingTriageCount={triageCards.length}
                onOpenNewNote={() => setIsNewNoteOpen(true)}
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
                    activeWorkspace={activeWorkspace}
                  />
                )}

                {activeTab === 'graph' && (
                  <GraphView
                    nodes={mockGraphNodes}
                    links={mockGraphLinks}
                    onOpenDocument={handleOpenDocument}
                    onShowToast={showToast}
                  />
                )}

                {activeTab === 'hierarchy' && (
                  <HierarchyView
                    onOpenDocument={handleOpenDocument}
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
