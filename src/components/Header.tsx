import React from 'react';
import {
  Search,
  Sliders,
  Monitor,
  Smartphone,
  ChevronDown,
  Check,
  Zap,
  PanelLeft,
  Bot,
  FolderArchive
} from 'lucide-react';
import { Workspace, ViewMode, SystemNotification } from '../types';

export interface HeaderProps {
  workspaces: Workspace[];
  activeWorkspace: Workspace;
  onSelectWorkspace: (ws: Workspace) => void;
  viewMode: ViewMode;
  onToggleViewMode: (mode: ViewMode) => void;
  onOpenCommandPalette: () => void;
  notifications: SystemNotification[];
  onOpenNotifications: () => void;
  unreadNotifsCount: number;
  isOpenSidebar?: boolean;
  onToggleSidebar?: () => void;
  onOpenChat?: () => void;
  onOpenVaultModal?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  workspaces,
  activeWorkspace,
  onSelectWorkspace,
  viewMode,
  onToggleViewMode,
  onOpenCommandPalette,
  onOpenNotifications,
  unreadNotifsCount,
  isOpenSidebar = true,
  onToggleSidebar,
  onOpenChat,
  onOpenVaultModal
}) => {
  const [dropdownOpen, setDropdownOpen] = React.useState(false);
  const [profileOpen, setProfileOpen] = React.useState(false);
  const [toolsOpen, setToolsOpen] = React.useState(false);

  return (
    <header className="h-14 w-full shrink-0 z-30 bg-[#111319]/95 backdrop-blur-xl border-b border-[#1f2432] shadow-[0_1px_8px_rgba(0,0,0,0.35)] relative">
      <div className="h-14 px-3 sm:px-4 lg:px-6 flex items-center justify-between gap-2 sm:gap-3">
        {/* Left: Sidebar Toggle & Workspace Selector */}
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          {onToggleSidebar && viewMode === 'desktop' && (
            <button
              onClick={onToggleSidebar}
              className={`p-1.5 sm:p-2 rounded-lg border transition-all ${
                isOpenSidebar
                  ? 'bg-[#1e1f26] text-[#4cd7f6] border-[#7c3aed]/50 hover:bg-[#282a30]'
                  : 'bg-[#191b22] text-[#ccc3d8] border-[#2e3547] hover:text-[#e2e2eb] hover:bg-[#1e1f26]'
              }`}
              title={isOpenSidebar ? '사이드바 접기 (Ctrl+\\)' : '사이드바 펼치기 (Ctrl+\\)'}
              aria-label="사이드바 토글"
            >
              <PanelLeft className="w-4 h-4" />
            </button>
          )}

          <div className="relative">
            <button
              onClick={() => {
                setDropdownOpen(!dropdownOpen);
                setProfileOpen(false);
                setToolsOpen(false);
              }}
              className="flex items-center gap-2 bg-[#191b22] hover:bg-[#1e1f26] border border-[#2e3547]/80 px-2.5 py-1.5 rounded-lg text-left transition-all min-h-[36px] max-w-[200px] sm:max-w-[240px] lg:max-w-[280px]"
            >
              <span className="text-base">{activeWorkspace.icon}</span>
              <div className="flex flex-col min-w-0 flex-1">
                <span className="text-sm font-semibold text-[#e2e2eb] truncate">
                  {activeWorkspace.name}
                </span>
                <span className="text-[10px] text-[#958da1] font-mono truncate hidden sm:block">
                  {activeWorkspace.path}
                </span>
              </div>
              <ChevronDown className={`w-3.5 h-3.5 text-[#958da1] transition-transform ${dropdownOpen ? 'rotate-180' : ''}`} />
            </button>

            {dropdownOpen && (
              <div className="absolute top-full left-0 mt-1.5 w-72 bg-[#1e1f26] border border-[#2e3547] rounded-xl shadow-2xl p-1.5 space-y-1 z-50 animate-in fade-in zoom-in-95 duration-150">
                <div className="px-2 py-1 text-[11px] font-mono text-[#958da1] uppercase">
                  스페이스 전환
                </div>
                {workspaces.map((ws) => (
                  <button
                    key={ws.id}
                    onClick={() => {
                      onSelectWorkspace(ws);
                      setDropdownOpen(false);
                    }}
                    className={`w-full text-left px-2.5 py-2 rounded-lg flex items-center justify-between transition-colors ${
                      ws.id === activeWorkspace.id
                        ? 'bg-[#282a30] text-[#e2e2eb]'
                        : 'text-[#ccc3d8] hover:bg-[#191b22] hover:text-[#e2e2eb]'
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-base">{ws.icon}</span>
                      <div className="flex flex-col min-w-0">
                        <span className="text-xs font-medium truncate">{ws.name}</span>
                        <span className="text-[10px] text-[#958da1] font-mono truncate">{ws.path}</span>
                      </div>
                    </div>
                    {ws.id === activeWorkspace.id && (
                      <Check className="w-4 h-4 text-[#4edea3] shrink-0" />
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Engine Status pill */}
          <div className="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#007650]/20 border border-[#007650]/40 text-[#4edea3] text-xs font-mono">
            <span className="w-1.5 h-1.5 rounded-full bg-[#4edea3] animate-pulse"></span>
            <span>v2.4 룰셋 활성</span>
          </div>
        </div>

        {/* Center: Command Palette Trigger */}
        <div className="flex-1 max-w-md hidden md:block">
          <button
            onClick={onOpenCommandPalette}
            className="w-full bg-[#191b22] hover:bg-[#1e1f26] border border-[#2e3547] rounded-xl px-3 py-1.5 flex items-center justify-between text-xs text-[#958da1] transition-colors group"
          >
            <div className="flex items-center gap-2">
              <Search className="w-3.5 h-3.5 text-[#4cd7f6] group-hover:text-[#eaddff] transition-colors" />
              <span className="font-normal text-[#ccc3d8]/80 truncate">
                #태그, @멘션 검색, AI 자연어 탐색 지원...
              </span>
            </div>
            <kbd className="px-1.5 py-0.5 rounded bg-[#282a30] border border-[#33343b] text-[#958da1] font-mono text-[10px]">
              ⌘K
            </kbd>
          </button>
        </div>

        {/* Right: Actions, View Mode Toggle, Notifications & Profile */}
        <div className="flex items-center gap-2">
          {/* AI Assistant Quick Nav */}
          {onOpenChat && (
            <button
              onClick={onOpenChat}
              title="AI 지식 어시스턴트 열기"
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-[#7c3aed]/20 hover:bg-[#7c3aed]/30 border border-[#7c3aed]/50 text-[#d2bbff] text-xs font-mono transition-all"
            >
              <Bot className="w-3.5 h-3.5 text-[#4cd7f6]" />
              <span className="hidden md:inline font-sans font-medium">AI 어시스턴트</span>
              <span className="w-1.5 h-1.5 rounded-full bg-[#4edea3] animate-pulse"></span>
            </button>
          )}

          {/* Vault Import / Export Button */}
          {onOpenVaultModal && (
            <button
              onClick={onOpenVaultModal}
              title="옵시디언 마크다운 볼트 가져오기 / 내보내기"
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-[#191b22] hover:bg-[#1e1f26] border border-[#2e3547] text-[#ccc3d8] hover:text-[#e2e2eb] text-xs font-mono transition-all"
            >
              <FolderArchive className="w-3.5 h-3.5 text-[#4cd7f6]" />
              <span className="hidden lg:inline">볼트 입출력</span>
            </button>
          )}

          {/* PC Desktop vs Mobile View Switcher */}
          <div className="flex items-center p-0.5 rounded-lg bg-[#191b22] border border-[#2e3547] text-xs">
            <button
              onClick={() => onToggleViewMode('desktop')}
              title="PC 데스크톱 풀화면 모드"
              className={`flex items-center gap-1 px-2 py-1 rounded-md transition-all ${
                viewMode === 'desktop'
                  ? 'bg-[#7c3aed] text-white font-medium shadow-sm'
                  : 'text-[#958da1] hover:text-[#e2e2eb]'
              }`}
            >
              <Monitor className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">PC 뷰</span>
            </button>
            <button
              onClick={() => onToggleViewMode('mobile')}
              title="모바일 뷰 프레임 모드"
              className={`flex items-center gap-1 px-2 py-1 rounded-md transition-all ${
                viewMode === 'mobile'
                  ? 'bg-[#7c3aed] text-white font-medium shadow-sm'
                  : 'text-[#958da1] hover:text-[#e2e2eb]'
              }`}
            >
              <Smartphone className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">모바일</span>
            </button>
          </div>

          {/* Quick Search on mobile */}
          <button
            onClick={onOpenCommandPalette}
            className="md:hidden w-9 h-9 flex items-center justify-center rounded-lg bg-[#191b22] border border-[#2e3547] text-[#ccc3d8] hover:text-[#e2e2eb]"
          >
            <Search className="w-4 h-4" />
          </button>

          {/* Notifications button */}
          <button
            onClick={onOpenNotifications}
            className="relative w-9 h-9 flex items-center justify-center rounded-lg bg-[#191b22] hover:bg-[#1e1f26] border border-[#2e3547] text-[#ccc3d8] hover:text-[#e2e2eb] transition-colors"
            title="알림 및 시스템 텔레메트리"
          >
            <Zap className="w-4 h-4 text-[#4cd7f6]" />
            {unreadNotifsCount > 0 && (
              <span className="absolute top-1.5 right-1.5 flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#4edea3] opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-[#4edea3]"></span>
              </span>
            )}
          </button>

          {/* Quick Tools & Settings Dropdown */}
          <div className="relative">
            <button
              onClick={() => {
                setToolsOpen(!toolsOpen);
                setProfileOpen(false);
                setDropdownOpen(false);
              }}
              className={`w-9 h-9 flex items-center justify-center rounded-lg border transition-colors ${
                toolsOpen
                  ? 'bg-[#282a30] text-[#4cd7f6] border-[#4cd7f6]/50'
                  : 'bg-[#191b22] hover:bg-[#1e1f26] border-[#2e3547] text-[#ccc3d8] hover:text-[#e2e2eb]'
              }`}
              title="설정 및 도구 메뉴"
            >
              <Sliders className="w-4 h-4 text-[#4cd7f6]" />
            </button>

            {toolsOpen && (
              <div className="absolute right-0 top-full mt-1.5 w-60 bg-[#1e1f26] border border-[#2e3547] rounded-xl shadow-2xl p-2 space-y-1.5 z-50 animate-in fade-in zoom-in-95 duration-150">
                <div className="px-2 py-1 text-[10px] font-mono text-[#958da1] uppercase border-b border-[#2e3547]">
                  빠른 설정 & 도구
                </div>
                <button
                  onClick={() => {
                    setToolsOpen(false);
                    onOpenCommandPalette();
                  }}
                  className="w-full text-left px-2.5 py-1.5 rounded-lg flex items-center justify-between text-xs text-[#ccc3d8] hover:bg-[#282a30] hover:text-[#e2e2eb] transition-colors"
                >
                  <span className="flex items-center gap-2">
                    <Search className="w-3.5 h-3.5 text-[#4cd7f6]" />
                    커맨드 팔레트
                  </span>
                  <kbd className="text-[10px] font-mono text-[#958da1] bg-[#191b22] px-1 py-0.5 rounded">⌘K</kbd>
                </button>
                {onOpenVaultModal && (
                  <button
                    onClick={() => {
                      setToolsOpen(false);
                      onOpenVaultModal();
                    }}
                    className="w-full text-left px-2.5 py-1.5 rounded-lg flex items-center gap-2 text-xs text-[#ccc3d8] hover:bg-[#282a30] hover:text-[#e2e2eb] transition-colors"
                  >
                    <FolderArchive className="w-3.5 h-3.5 text-[#d2bbff]" />
                    <span>볼트 가져오기 / 내보내기</span>
                  </button>
                )}
                <div className="px-2 py-1 text-[10px] font-mono text-[#958da1] border-t border-[#2e3547] flex justify-between">
                  <span>뷰 모드</span>
                  <span className="text-[#4edea3] font-semibold">{viewMode === 'desktop' ? 'PC 데스크톱' : '모바일 프레임'}</span>
                </div>
              </div>
            )}
          </div>

          {/* User Profile Avatar with Dropdown */}
          <div className="relative">
            <button
              onClick={() => {
                setProfileOpen(!profileOpen);
                setToolsOpen(false);
                setDropdownOpen(false);
              }}
              className="w-8 h-8 rounded-full bg-[#7c3aed] text-white flex items-center justify-center text-xs font-semibold shadow-md ml-1 ring-1 ring-[#d2bbff]/30 hover:opacity-90 active:scale-95 transition-all cursor-pointer"
              title="사용자 프로필 및 시스템 세션 정보"
            >
              P
            </button>

            {profileOpen && (
              <div className="absolute right-0 top-full mt-1.5 w-64 bg-[#1e1f26] border border-[#2e3547] rounded-xl shadow-2xl p-3 space-y-2.5 z-50 animate-in fade-in zoom-in-95 duration-150">
                <div className="flex items-center gap-2.5 pb-2 border-b border-[#2e3547]">
                  <div className="w-9 h-9 rounded-full bg-[#7c3aed] text-white flex items-center justify-center font-bold text-sm">
                    P
                  </div>
                  <div className="flex flex-col min-w-0">
                    <span className="text-xs font-bold text-[#e2e2eb]">Platform Architect</span>
                    <span className="text-[10px] text-[#4edea3] font-mono">System Admin (Active)</span>
                  </div>
                </div>

                <div className="space-y-1 text-[11px] font-mono text-[#958da1]">
                  <div className="flex justify-between">
                    <span>DB 세션:</span>
                    <span className="text-[#e2e2eb]">PostgreSQL 16</span>
                  </div>
                  <div className="flex justify-between">
                    <span>벡터 인덱스:</span>
                    <span className="text-[#4cd7f6]">pgvector 768d</span>
                  </div>
                  <div className="flex justify-between">
                    <span>단축키 탐색:</span>
                    <span className="text-[#d2bbff]">⌘K / ⌘\</span>
                  </div>
                </div>

                <div className="pt-1 border-t border-[#2e3547]">
                  <button
                    onClick={() => {
                      setProfileOpen(false);
                      onOpenCommandPalette();
                    }}
                    className="w-full py-1.5 rounded-lg bg-[#282a30] hover:bg-[#33343b] text-[#ccc3d8] hover:text-white text-xs text-center font-mono transition-colors"
                  >
                    커맨드 단축키 안내 ⌘K
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
