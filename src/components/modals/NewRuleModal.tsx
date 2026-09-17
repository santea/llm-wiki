import React, { useState } from 'react';
import { X, PlusCircle, Sparkles } from 'lucide-react';
import { ClassificationRule } from '../../types';

interface NewRuleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddRule: (rule: ClassificationRule) => void;
  onShowToast: (msg: string) => void;
}

export const NewRuleModal: React.FC<NewRuleModalProps> = ({
  isOpen,
  onClose,
  onAddRule,
  onShowToast
}) => {
  const [name, setName] = useState('');
  const [nameEn, setNameEn] = useState('');
  const [level, setLevel] = useState<'High' | 'Standard' | 'Medium'>('Standard');
  const [tags, setTags] = useState('#보안 #인가 #인증');
  const [detectionLogic, setDetectionLogic] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      onShowToast('규칙 명칭을 입력해주세요.');
      return;
    }

    const tagArray = tags
      .split(' ')
      .map((t) => (t.startsWith('#') ? t : `#${t}`))
      .filter((t) => t.length > 1);

    const newRule: ClassificationRule = {
      id: `rule-${Date.now()}`,
      name: name.trim(),
      nameEn: nameEn.trim() || 'Custom Rule',
      level,
      color: level === 'High' ? '#ffb4ab' : '#d2bbff',
      icon: 'code',
      enabled: true,
      tags: tagArray.length > 0 ? tagArray : ['#Custom'],
      detectionLogic: detectionLogic.trim() || '패턴 매칭 시 해당 카테고리로 자동 분류'
    };

    onAddRule(newRule);
    onShowToast(`'${name}' 새로운 분류 규칙이 추가되었습니다.`);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0c0e14]/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-[#191b22] border border-[#2e3547] w-full max-w-md rounded-xl p-5 shadow-2xl space-y-4 animate-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <PlusCircle className="w-5 h-5 text-[#d2bbff]" />
            <h3 className="text-sm font-semibold text-[#e2e2eb]">새로운 분류 규칙 추가</h3>
          </div>
          <button onClick={onClose} className="text-[#958da1] hover:text-[#e2e2eb]">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="space-y-1">
            <label className="text-xs font-mono text-[#958da1]">규칙 카테고리 명칭 (한글)</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="예: 보안 및 인증 체계"
              className="w-full bg-[#0c0e14] border border-[#2e3547] rounded-lg p-2 text-xs text-[#e2e2eb] outline-none focus:border-[#7c3aed]"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-mono text-[#958da1]">영문 표기</label>
            <input
              type="text"
              value={nameEn}
              onChange={(e) => setNameEn(e.target.value)}
              placeholder="예: Security & Authentication"
              className="w-full bg-[#0c0e14] border border-[#2e3547] rounded-lg p-2 text-xs text-[#e2e2eb] outline-none focus:border-[#7c3aed]"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-mono text-[#958da1]">보안 및 중요도 등급</label>
            <div className="grid grid-cols-3 gap-2">
              {(['High', 'Standard', 'Medium'] as const).map((lvl) => (
                <button
                  type="button"
                  key={lvl}
                  onClick={() => setLevel(lvl)}
                  className={`py-1.5 rounded-lg border text-xs font-mono transition-colors ${
                    level === lvl
                      ? 'bg-[#7c3aed] text-white border-[#7c3aed]'
                      : 'bg-[#0c0e14] text-[#958da1] border-[#2e3547]'
                  }`}
                >
                  {lvl}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-mono text-[#958da1]">대표 태그 (공백 구분)</label>
            <input
              type="text"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              placeholder="#JWT #OAuth2 #보안토큰"
              className="w-full bg-[#0c0e14] border border-[#2e3547] rounded-lg p-2 text-xs text-[#e2e2eb] outline-none focus:border-[#7c3aed]"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-mono text-[#958da1]">AI 감지 로직 조건문</label>
            <textarea
              value={detectionLogic}
              onChange={(e) => setDetectionLogic(e.target.value)}
              rows={2}
              placeholder="JWT 토큰 유효성, 세션 암호화, 인가 헤더 감지 시 보안 카테고리로 분류"
              className="w-full bg-[#0c0e14] border border-[#2e3547] rounded-lg p-2 text-xs text-[#e2e2eb] outline-none focus:border-[#7c3aed]"
            />
          </div>

          <button
            type="submit"
            className="w-full mt-2 py-2.5 rounded-lg bg-[#7c3aed] hover:bg-[#6d28d9] text-white font-semibold text-xs transition-all shadow-md active:scale-98"
          >
            분류 규칙 생성
          </button>
        </form>
      </div>
    </div>
  );
};
