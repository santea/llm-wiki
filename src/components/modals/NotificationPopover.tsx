import React from 'react';
import { Bell, Check, Sparkles, AlertCircle, X } from 'lucide-react';
import { SystemNotification } from '../../types';

interface NotificationPopoverProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectAction: (type: string) => void;
  notifications?: SystemNotification[];
  onMarkAllRead?: () => void;
}

export const NotificationPopover: React.FC<NotificationPopoverProps> = ({
  isOpen,
  onClose,
  onSelectAction,
  notifications = [],
  onMarkAllRead
}) => {
  if (!isOpen) return null;

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
        {notifications.length === 0 ? (
          <div className="p-6 text-center text-xs text-[#958da1]">
            새로운 시스템 알림이 없습니다.
          </div>
        ) : (
          notifications.map((n) => (
            <div
              key={n.id}
              onClick={() => {
                if (n.actionTab) {
                  onSelectAction(n.actionTab);
                } else {
                  onSelectAction(n.type);
                }
                onClose();
              }}
              className="p-3 hover:bg-[#282a30] transition-colors cursor-pointer flex items-start gap-2.5"
            >
              <div
                className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${
                  !n.read ? 'bg-[#4cd7f6] animate-pulse shadow-[0_0_6px_rgba(76,215,246,0.8)]' : 'bg-[#4a4455]'
                }`}
              />
              <div className="flex flex-col min-w-0 flex-1">
                <span className={`text-xs truncate ${!n.read ? 'font-semibold text-[#e2e2eb]' : 'text-[#ccc3d8]'}`}>
                  {n.title}
                </span>
                <p className="text-[11px] text-[#958da1] leading-tight mt-0.5 line-clamp-2">
                  {n.description || (n as any).desc}
                </p>
                <span className="text-[10px] font-mono text-[#958da1] mt-1">{n.time}</span>
              </div>
            </div>
          ))
        )}
      </div>

      <div className="px-3 py-2 bg-[#0c0e14] border-t border-[#2e3547] flex justify-between items-center text-[11px] font-mono text-[#958da1]">
        <button
          onClick={() => {
            if (onMarkAllRead) onMarkAllRead();
            onClose();
          }}
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
