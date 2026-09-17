import React, { useState } from 'react';
import {
  GitBranch,
  Play,
  Cloud,
  Code2,
  Database,
  Network,
  Cable,
  Edit3,
  ShieldCheck,
  PlusCircle,
  FlaskConical,
  Check,
  Sparkles,
  ChevronDown
} from 'lucide-react';
import { ClassificationRule, Workspace } from '../../types';

interface TaxonomyViewProps {
  rules: ClassificationRule[];
  onToggleRule: (id: string) => void;
  activeWorkspace: Workspace;
  onOpenSandbox: () => void;
  onOpenNewRuleModal: () => void;
  onShowToast: (msg: string) => void;
}

export const TaxonomyView: React.FC<TaxonomyViewProps> = ({
  rules,
  onToggleRule,
  activeWorkspace,
  onOpenSandbox,
  onOpenNewRuleModal,
  onShowToast
}) => {
  const [promptText, setPromptText] = useState(
    '이 공간에서는 사내 인프라 IP 노출 시 즉시 마스킹 처리하고, 소스코드 저장 시 단위 테스트 여부를 체크하여 메타데이터에 기록할 것'
  );
  const [isEditingPrompt, setIsEditingPrompt] = useState(false);

  // Helper to map icon string to lucide icon
  const getRuleIcon = (iconName: string) => {
    switch (iconName) {
      case 'cloud':
        return <Cloud className="w-5 h-5 text-[#4edea3]" />;
      case 'code':
        return <Code2 className="w-5 h-5 text-[#d2bbff]" />;
      case 'database':
        return <Database className="w-5 h-5 text-[#4cd7f6]" />;
      case 'account_tree':
        return <Network className="w-5 h-5 text-[#acedff]" />;
      case 'cable':
      default:
        return <Cable className="w-5 h-5 text-[#4cd7f6]" />;
    }
  };

  const activeRulesCount = rules.filter((r) => r.enabled).length;

  return (
    <div className="flex flex-col w-full pb-24 space-y-6 animate-in fade-in duration-200">
      {/* 1. Top Workspace Context Banner & Telemetry */}
      <section className="px-4 pt-4">
        <div className="bg-[#191b22] border border-[#2e3547] rounded-xl p-4 sm:p-5 shadow-md space-y-4 relative overflow-hidden">
          {/* Ambient Glow */}
          <div className="absolute -right-8 -top-8 w-36 h-36 bg-[#03b5d3]/10 rounded-full blur-2xl pointer-events-none"></div>

          <div className="flex items-center justify-between gap-3 relative z-10">
            <div className="flex items-center gap-2 bg-[#1e1f26] border border-[#2e3547] px-3 py-1.5 rounded-lg text-left flex-1 max-w-sm">
              <span className="text-base">{activeWorkspace.icon}</span>
              <span className="text-xs sm:text-sm font-semibold text-[#e2e2eb] truncate">
                {activeWorkspace.name}
              </span>
            </div>

            <button
              onClick={onOpenSandbox}
              className="flex items-center gap-1.5 bg-[#282a30] hover:bg-[#33343b] text-[#e2e2eb] border border-[#33343b] px-3 py-1.5 rounded-lg text-xs font-mono transition-colors shrink-0 shadow-sm"
            >
              <Play className="w-3.5 h-3.5 text-[#4cd7f6] fill-[#4cd7f6]" />
              <span>룰 시뮬레이션</span>
            </button>
          </div>

          <div className="space-y-1 relative z-10">
            <p className="text-xs text-[#ccc3d8]">AI 자동 분류 및 정제 가이드라인 관리</p>
            <div className="flex items-center gap-2 mt-1">
              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-[#007650]/20 border border-[#007650]/40 text-[#4edea3] font-mono text-xs">
                <span className="w-1.5 h-1.5 rounded-full bg-[#4edea3] animate-pulse"></span>
                Active • v2.4 룰셋 작동 중
              </span>
              <span className="text-[11px] font-mono text-[#958da1]">실시간 자동 동기화</span>
            </div>
          </div>

          {/* Stats Metrics Cards */}
          <div className="grid grid-cols-3 gap-2.5 pt-1">
            <div className="bg-[#1e1f26] border border-[#2e3547] p-3 rounded-lg flex flex-col justify-between">
              <span className="text-[11px] text-[#958da1] font-mono">분류 규칙</span>
              <div className="flex items-baseline gap-1 mt-1">
                <span className="text-lg sm:text-xl font-bold text-[#d2bbff]">
                  {activeRulesCount}
                </span>
                <span className="text-[10px] text-[#958da1]">개 활성</span>
              </div>
            </div>

            <div className="bg-[#1e1f26] border border-[#2e3547] p-3 rounded-lg flex flex-col justify-between">
              <span className="text-[11px] text-[#958da1] font-mono">분류 정확도</span>
              <div className="flex items-baseline gap-0.5 mt-1">
                <span className="text-lg sm:text-xl font-bold text-[#4edea3]">98.4%</span>
              </div>
            </div>

            <div className="bg-[#1e1f26] border border-[#2e3547] p-3 rounded-lg flex flex-col justify-between">
              <span className="text-[11px] text-[#958da1] font-mono">24h 정제 노트</span>
              <div className="flex items-baseline gap-1 mt-1">
                <span className="text-lg sm:text-xl font-bold text-[#4cd7f6]">142</span>
                <span className="text-[10px] text-[#958da1]">건</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. Core Categories & Guidelines List */}
      <section className="px-4 space-y-3">
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-2">
            <GitBranch className="w-4 h-4 text-[#d2bbff]" />
            <h2 className="text-sm font-semibold text-[#e2e2eb]">분류 카테고리 &amp; 가이드라인</h2>
          </div>
          <span className="text-xs font-mono text-[#958da1]">
            {activeRulesCount}개 카테고리 적용됨
          </span>
        </div>

        <div className="space-y-3">
          {rules.map((rule) => (
            <article
              key={rule.id}
              className={`bg-[#191b22] border border-[#2e3547] rounded-xl p-4 shadow-sm space-y-3 relative overflow-hidden transition-all duration-200 ${
                !rule.enabled ? 'opacity-50' : ''
              }`}
            >
              {/* Header */}
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-9 h-9 rounded-lg bg-[#1e1f26] border border-[#2e3547] flex items-center justify-center shrink-0">
                    {getRuleIcon(rule.icon)}
                  </div>
                  <div className="flex flex-col min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-semibold text-[#e2e2eb] truncate">{rule.name}</h3>
                      <span
                        className={`px-1.5 py-0.2 rounded text-[10px] font-mono font-bold ${
                          rule.level === 'High'
                            ? 'bg-[#93000a]/40 text-[#ffb4ab]'
                            : rule.level === 'Standard'
                            ? 'bg-[#282a30] text-[#d2bbff]'
                            : 'bg-[#282a30] text-[#958da1]'
                        }`}
                      >
                        {rule.level}
                      </span>
                    </div>
                    <span className="text-[11px] font-mono text-[#958da1]">{rule.nameEn}</span>
                  </div>
                </div>

                {/* Toggle Switch */}
                <button
                  onClick={() => {
                    onToggleRule(rule.id);
                    onShowToast(`'${rule.name}' 규칙이 ${!rule.enabled ? '활성화' : '비활성화'}되었습니다.`);
                  }}
                  className={`w-10 h-6 rounded-full relative transition-colors focus:outline-none shrink-0 ${
                    rule.enabled ? 'bg-[#7c3aed]' : 'bg-[#282a30]'
                  }`}
                >
                  <span
                    className={`block w-4 h-4 rounded-full bg-white transition-transform absolute top-1 ${
                      rule.enabled ? 'right-1' : 'left-1'
                    }`}
                  ></span>
                </button>
              </div>

              {/* Tags */}
              <div className="flex flex-wrap gap-1">
                {rule.tags.map((tag) => (
                  <span
                    key={tag}
                    className="px-2 py-0.5 bg-[#1e1f26] text-[#ccc3d8] rounded text-[11px] font-mono"
                  >
                    {tag}
                  </span>
                ))}
              </div>

              {/* Detection Logic Box */}
              <div className="bg-[#0c0e14] border border-[#2e3547]/80 p-2.5 rounded-lg flex items-start gap-2 text-xs text-[#ccc3d8]">
                <Sparkles className="w-3.5 h-3.5 text-[#4edea3] mt-0.5 shrink-0" />
                <p className="leading-relaxed font-mono">
                  <span className="text-[#4cd7f6] font-bold">감지 로직: </span>
                  {rule.detectionLogic}
                </p>
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* 3. Space Dedicated AI Guideline Prompt */}
      <section className="px-4 space-y-4">
        <div className="bg-[#191b22] border border-[#2e3547] rounded-xl p-4 sm:p-5 shadow-md space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Edit3 className="w-4 h-4 text-[#d2bbff]" />
              <h3 className="text-sm font-semibold text-[#e2e2eb]">
                공간 전용 AI 가이드라인 프롬프트
              </h3>
            </div>
            <button
              onClick={() => {
                setIsEditingPrompt(!isEditingPrompt);
                if (isEditingPrompt) {
                  onShowToast('가이드라인 프롬프트가 저장되었습니다.');
                }
              }}
              className="text-xs font-mono text-[#4cd7f6] hover:text-[#d2bbff] flex items-center gap-1 transition-colors"
            >
              {isEditingPrompt ? <Check className="w-3.5 h-3.5" /> : <Edit3 className="w-3.5 h-3.5" />}
              <span>{isEditingPrompt ? '저장' : '편집'}</span>
            </button>
          </div>

          <div className="bg-[#0c0e14] border border-[#2e3547] p-3.5 rounded-lg space-y-2">
            <div className="flex items-center gap-1.5 text-xs text-[#958da1] font-mono">
              <ShieldCheck className="w-3.5 h-3.5 text-[#4edea3]" />
              <span>보안 &amp; 정밀 메타데이터 수집 규칙</span>
            </div>

            {isEditingPrompt ? (
              <textarea
                value={promptText}
                onChange={(e) => setPromptText(e.target.value)}
                rows={3}
                className="w-full bg-[#191b22] border border-[#7c3aed] rounded-lg p-2.5 text-xs font-mono text-[#e2e2eb] outline-none"
              />
            ) : (
              <p className="text-xs font-mono text-[#e2e2eb] leading-relaxed">
                “{promptText}”
              </p>
            )}

            <div className="flex items-center justify-between pt-1 text-[10px] font-mono text-[#958da1] border-t border-[#2e3547]/60">
              <span>토큰 사용량: 42 tokens</span>
              <span className="px-2 py-0.5 rounded bg-[#007650]/20 text-[#4edea3]">
                시스템 프롬프트 주입됨
              </span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-2.5">
          <button
            onClick={onOpenNewRuleModal}
            className="flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-[#282a30] hover:bg-[#33343b] text-[#e2e2eb] border border-[#33343b] text-xs font-semibold shadow-sm transition-all active:scale-98"
          >
            <PlusCircle className="w-4 h-4 text-[#d2bbff]" />
            <span>새로운 분류 규칙 추가</span>
          </button>

          <button
            onClick={onOpenSandbox}
            className="flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-[#7c3aed] hover:bg-[#6d28d9] text-white text-xs font-semibold shadow-md transition-all active:scale-98"
          >
            <FlaskConical className="w-4 h-4" />
            <span>가이드라인 즉시 테스트 (샌드박스)</span>
          </button>
        </div>
      </section>
    </div>
  );
};
