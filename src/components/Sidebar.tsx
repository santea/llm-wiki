import React from 'react';
import {
  FileText,
  Network,
  Layers,
  Sparkles,
  GitBranch,
  Settings,
  Pin,
  Tag,
  Hash,
  Activity,
  Plus,
  ChevronLeft,
  PanelLeftClose,
  Bot,
  MessageSquare,
  Sliders
} from 'lucide-react';
import { TabType, Workspace } from '../types';

export interface SidebarProps {
  isOpen?: boolean;
  onToggle?: () => void;
  activeTab: TabType;
  onSelectTab: (tab: TabType) => void;
  workspaces: Workspace[];
  activeWorkspace: Workspace;
  onSelectWorkspace: (ws: Workspace) => void;
  pendingTriageCount: number;
  rulesCount?: number;
  onOpenNewNote: () => void;
  popularTags?: string[];
  totalNodesCount?: number;
  syncPercentage?: number;
  onSelectTagFilter?: (tag: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  isOpen = true,
  onToggle,
  activeTab,
  onSelectTab,
  workspaces,
  activeWorkspace,
  onSelectWorkspace,
  pendingTriageCount,
  rulesCount = 5,
  onOpenNewNote,
  popularTags = ['#PostgreSQL', '#pgvector', '#Kafka', '#Spring', '#Redis', '#AWS'],
  totalNodesCount = 12,
  syncPercentage = 100,
  onSelectTagFilter
}) => {
  const navItems = [
    {
      id: 'notes' as TabType,
      label: '노트 & 에디터',
      sublabel: 'Notes Repository',
      icon: FileText,
      badge: null
    },
    {
      id: 'chat' as TabType,
      label: 'AI 지식 어시스턴트',
      sublabel: 'RAG Synthesizer & Chat',
      icon: Bot,
      badge: 'RAG v3.2',
      badgeColor: 'bg-[#007650] text-[#76ffc2]'
    },
    {
      id: 'graph' as TabType,
      label: '지식 그래프',
      sublabel: 'Knowledge Graph',
      icon: Network,
      badge: 'LIVE'
    },
    {
      id: 'hierarchy' as TabType,
      label: '지식 계층 구조',
      sublabel: 'Depth Architecture',
      icon: Layers,
      badge: 'L1-L4'
    },
    {
      id: 'refinery' as TabType,
      label: 'AI 정제 대기열',
      sublabel: 'Refinery Engine',
      icon: Sparkles,
      badge: pendingTriageCount > 0 ? `${pendingTriageCount}건` : null,
      badgeColor: 'bg-[#7c3aed] text-white'
    },
    {
      id: 'taxonomy' as TabType,
      label: '분류 카테고리 & 룰',
      sublabel: 'Taxonomy Rules',
      icon: GitBranch,
      badge: `${rulesCount}개`
    },
    {
      id: 'prompts' as TabType,
      label: '에이전트 프롬프트 허브',
      sublabel: 'Prompt Orchestrator',
      icon: Sliders,
      badge: '6종 AI',
      badgeColor: 'bg-[#7c3aed] text-white'
    }
  ];

  return (
    <aside
      className={`${
        isOpen ? 'w-64 border-r border-[#1f2432]' : 'w-0 border-r-0'
      } shrink-0 h-full bg-[#111319] flex flex-col justify-between select-none transition-all duration-300 ease-in-out overflow-hidden z-20`}
    >
      <div className="w-64 h-full flex flex-col justify-between overflow-y-auto no-scrollbar">
        <div className="p-3 space-y-3">
          {/* Header row with Fold Button */}
          <div className="flex items-center justify-between pb-1 text-[#958da1]">
            <span className="text-[11px] font-mono uppercase tracking-wider flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-[#7c3aed]"></span>
              네비게이션
            </span>
            {onToggle && (
              <button
                onClick={onToggle}
                className="p-1 rounded-md hover:bg-[#1f2432] text-[#958da1] hover:text-[#e2e2eb] transition-colors"
                title="사이드바 접기 (Ctrl+\)"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Quick New Note Button */}
          <button
            onClick={onOpenNewNote}
            className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-lg bg-[#7c3aed] hover:bg-[#6d28d9] text-white font-medium text-xs shadow-md active:scale-98 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>새 노트 작성하기</span>
          </button>

          {/* Main Navigation */}
          <div className="space-y-1">
            <div className="px-2 py-1 text-[11px] font-mono text-[#958da1] uppercase tracking-wider">
              핵심 시스템 뷰
            </div>
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => onSelectTab(item.id)}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-left transition-all ${
                    isActive
                      ? 'bg-[#1e1f26] text-[#e2e2eb] border border-[#7c3aed]/50 shadow-sm'
                      : 'text-[#ccc3d8] hover:bg-[#191b22] hover:text-[#e2e2eb]'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <Icon
                      className={`w-4 h-4 shrink-0 ${
                        isActive ? 'text-[#4cd7f6]' : 'text-[#958da1]'
                      }`}
                    />
                    <div className="flex flex-col min-w-0">
                      <span className="text-xs font-semibold truncate leading-tight">
                        {item.label}
                      </span>
                      <span className="text-[10px] text-[#958da1] font-mono truncate leading-tight">
                        {item.sublabel}
                      </span>
                    </div>
                  </div>

                  {item.badge && (
                    <span
                      className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-medium shrink-0 ${
                        item.badgeColor || 'bg-[#282a30] text-[#4edea3]'
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Pinned Spaces */}
          <div className="space-y-1.5 pt-2 border-t border-[#1f2432]">
            <div className="flex items-center justify-between px-2">
              <span className="text-[11px] font-mono text-[#958da1] uppercase flex items-center gap-1">
                <Pin className="w-3 h-3 text-[#d2bbff]" /> 고정 스페이스
              </span>
              <span className="text-[10px] text-[#958da1] font-mono">3개</span>
            </div>

            <div className="space-y-1">
              {workspaces.map((ws) => (
                <button
                  key={ws.id}
                  onClick={() => onSelectWorkspace(ws)}
                  className={`w-full text-left px-2.5 py-1.5 rounded-lg flex items-center justify-between transition-colors text-xs ${
                    ws.id === activeWorkspace.id
                      ? 'bg-[#1e1f26] text-[#e2e2eb] font-medium'
                      : 'text-[#958da1] hover:text-[#e2e2eb] hover:bg-[#191b22]'
                  }`}
                >
                  <div className="flex items-center gap-1.5 min-w-0">
                    <span>{ws.icon}</span>
                    <span className="truncate">{ws.name}</span>
                  </div>
                  <span className="text-[10px] font-mono text-[#4cd7f6]">{ws.docCount}d</span>
                </button>
              ))}
            </div>
          </div>

          {/* Popular Tags */}
          <div className="space-y-1.5 pt-2 border-t border-[#1f2432]">
            <div className="px-2 text-[11px] font-mono text-[#958da1] uppercase flex items-center gap-1">
              <Tag className="w-3 h-3 text-[#4edea3]" /> 주요 태그
            </div>
            <div className="flex flex-wrap gap-1 px-1">
              {popularTags.map((tag) => (
                <button
                  key={tag}
                  onClick={() => {
                    onSelectTab('notes');
                    if (onSelectTagFilter) onSelectTagFilter(tag);
                  }}
                  className="px-1.5 py-0.5 rounded bg-[#191b22] hover:bg-[#282a30] hover:text-[#d2bbff] text-[10px] font-mono text-[#ccc3d8] cursor-pointer transition-colors"
                  title={`${tag} 태그로 필터링`}
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Footer / Telemetry status */}
        <div className="p-3 border-t border-[#1f2432] bg-[#0c0e14]/50 space-y-2">
          <div className="flex items-center justify-between text-[11px] font-mono text-[#958da1]">
            <span className="flex items-center gap-1.5">
              <Activity className="w-3.5 h-3.5 text-[#4edea3]" />
              엔진 텔레메트리
            </span>
            <span className="text-[#4edea3]">Active</span>
          </div>
          <div className="flex items-center justify-between text-[10px] text-[#958da1]">
            <span>지식망 노드 색인</span>
            <span className="font-mono text-[#e2e2eb]">{totalNodesCount} nodes</span>
          </div>
          <div className="w-full bg-[#191b22] h-1.5 rounded-full overflow-hidden">
            <div
              className="bg-gradient-to-r from-[#7c3aed] to-[#4cd7f6] h-full transition-all duration-500"
              style={{ width: `${Math.min(100, Math.max(10, syncPercentage))}%` }}
            ></div>
          </div>
        </div>
      </div>
    </aside>
  );
};

export const MobileNavBar: React.FC<{
  activeTab: TabType;
  onSelectTab: (tab: TabType) => void;
  pendingCount: number;
}> = ({ activeTab, onSelectTab, pendingCount }) => {
  const tabs = [
    { id: 'notes' as TabType, label: '노트', icon: FileText },
    { id: 'chat' as TabType, label: 'AI대화', icon: Bot },
    { id: 'graph' as TabType, label: '그래프', icon: Network },
    { id: 'hierarchy' as TabType, label: '계층구조', icon: Layers },
    { id: 'refinery' as TabType, label: '정제', icon: Sparkles, badge: pendingCount },
    { id: 'taxonomy' as TabType, label: '규칙', icon: GitBranch },
    { id: 'prompts' as TabType, label: '프롬프트', icon: Sliders }
  ];

  return (
    <nav className="shrink-0 w-full z-40 bg-[#0c0e14]/95 backdrop-blur-xl border-t border-[#1f2432] shadow-[0_-4px_20px_rgba(0,0,0,0.5)]">
      <div className="grid grid-cols-7 items-center h-14 px-0.5">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onSelectTab(tab.id)}
              className={`flex flex-col items-center justify-center gap-0.5 h-12 transition-colors relative ${
                isActive ? 'text-[#d2bbff] font-semibold' : 'text-[#958da1] hover:text-[#e2e2eb]'
              }`}
            >
              <div className="relative">
                <Icon className={`w-4 h-4 ${isActive ? 'text-[#4cd7f6]' : ''}`} />
                {tab.badge && tab.badge > 0 ? (
                  <span className="absolute -top-1 -right-2 px-1 py-0.2 rounded-full bg-[#7c3aed] text-white text-[9px] font-mono font-bold">
                    {tab.badge}
                  </span>
                ) : null}
              </div>
              <span className="text-[10px] font-mono tracking-tight">{tab.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
