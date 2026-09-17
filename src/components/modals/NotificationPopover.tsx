import React from 'react';
import { Bell, Check, Sparkles, AlertCircle, X } from 'lucide-react';

interface NotificationPopoverProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectAction: (type: string) => void;
}

export const NotificationPopover: React.FC<NotificationPopoverProps> = ({
  isOpen,
  onClose,
  onSelectAction
}) => {
  if (!isOpen) return null;

  const notifications = [
    {
      id: '1',
      title: 'AI 정제 대기열 인입 (3건)',
      desc: '클립보드 및 Slack 스레드에서 새로운 원본 메모가 인입되었습니다.',
      time: '12분 전',
      type: 'refinery',
      unread: true
    },
    {
      id: '2',
      title: '고립된 노드 2건 자동 감지',
      desc: '부모 Depth가 비어 있는 문서를 AI가 L4 리소스로 추천 배치했습니다.',
      time: '35분 전',
      type: 'hierarchy',
      unread: true
    },
    {
      id: '3',
      title: '지식 그래프 312개 양방향 링크 색인 완료',
      desc: '[[분산 트랜잭션 Saga 패턴]] 중심 클러스터가 갱신되었습니다.',
      time: '1시간 전',
      type: 'graph',
      unread: false
    }
  ];

  return (
    <div className="absolute right-0 top-12 z-50 w-80 sm:w-96 bg-[#191b22] border border-[#2e3547] rounded-xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
      <div className="flex items-center justify-between px-4 py-3 border-b border-[#2e3547] bg-[#1e1f26]">
        <div className="flex items-center gap-2">
          <Bell className="w-4 h-4 text-[#4cd7f6]" />
          <span className="text-xs font-semibold text-[#e2e2eb]">알림 및 시스템 상태</span>
        </div>
        <button onClick={onClose} className="text-[#958da1] hover:text-[#e2e2eb]">
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="divide-y divide-[#2e3547]/50 max-h-72 overflow-y-auto no-scrollbar">
        {notifications.map((n) => (
          <div
            key={n.id}
            onClick={() => {
              onSelectAction(n.type);
              onClose();
            }}
            className="p-3 hover:bg-[#282a30] transition-colors cursor-pointer flex items-start gap-2.5"
          >
            <div className="w-2 h-2 rounded-full bg-[#4cd7f6] mt-1.5 shrink-0" />
            <div className="flex flex-col min-w-0 flex-1">
              <span className="text-xs font-semibold text-[#e2e2eb] truncate">{n.title}</span>
              <p className="text-[11px] text-[#ccc3d8] leading-tight mt-0.5 line-clamp-2">
                {n.desc}
              </p>
              <span className="text-[10px] font-mono text-[#958da1] mt-1">{n.time}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="px-3 py-2 bg-[#0c0e14] border-t border-[#2e3547] flex justify-between items-center text-[11px] font-mono text-[#958da1]">
        <button
          onClick={onClose}
          className="hover:text-[#e2e2eb] transition-colors"
        >
          모두 읽음 처리
        </button>
        <span className="text-[#4edea3] flex items-center gap-1">
          <Check className="w-3 h-3" /> 시스템 정상
        </span>
      </div>
    </div>
  );
};
