import React, { useState } from 'react';
import { Terminal, X, CheckCircle2, Sparkles, Loader2, ShieldCheck } from 'lucide-react';
import { testRulesInSandbox } from '../../api';

interface SandboxTestModalProps {
  isOpen: boolean;
  onClose: () => void;
  onShowToast: (msg: string) => void;
}

export const SandboxTestModal: React.FC<SandboxTestModalProps> = ({
  isOpen,
  onClose,
  onShowToast
}) => {
  const [testText, setTestText] = useState(
    'AWS EKS 클러스터 IP: 10.0.4.12에 ingress-nginx 설정 후 POST /api/v1/auth 라우팅 구성 완료함.'
  );
  const [isSimulating, setIsSimulating] = useState(false);
  const [result, setResult] = useState<{
    categories: string[];
    guidelineAction: string;
    securityNotices?: string[];
    maskedOutput: string;
  }>({
    categories: ['시스템 인프라 정보', '외부 시스템 연계 정보'],
    guidelineAction: '사내 IP 마스킹 처리 실행 (10.0.4.12 → [IP MASKED])',
    securityNotices: ['내부 IP가 마스킹되었습니다.'],
    maskedOutput: 'AWS EKS 클러스터 IP: [IP MASKED]에 ingress-nginx 설정 후 POST /api/v1/auth 라우팅 구성 완료함.'
  });

  if (!isOpen) return null;

  const handleSimulate = async () => {
    if (!testText.trim()) {
      onShowToast('테스트할 텍스트를 입력해주세요.');
      return;
    }

    setIsSimulating(true);
    try {
      const data = await testRulesInSandbox(testText);
      setResult({
        categories: data.categories || ['시스템 인프라 정보'],
        guidelineAction: data.guidelineAction || '표준 아키텍처 규격 준수 확인',
        securityNotices: data.securityNotices || [],
        maskedOutput: data.maskedOutput || testText
      });
      onShowToast('AI 실시간 규칙 판정이 완료되었습니다.');
    } catch (err: any) {
      console.error(err);
      onShowToast('규칙 판정 중 오류가 발생했습니다.');
    } finally {
      setIsSimulating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0c0e14]/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-[#191b22] border border-[#2e3547] w-full max-w-md rounded-xl p-5 shadow-2xl space-y-4 animate-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Terminal className="w-5 h-5 text-[#4cd7f6]" />
            <h4 className="text-sm font-semibold text-[#e2e2eb]">분류 룰 샌드박스 테스트</h4>
          </div>
          <button
            onClick={onClose}
            className="text-[#958da1] hover:text-[#e2e2eb] transition-colors p-1"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Input Text Box */}
        <div className="space-y-1.5">
          <label className="text-xs font-mono text-[#958da1]">테스트할 노트 텍스트 입력</label>
          <textarea
            value={testText}
            onChange={(e) => setTestText(e.target.value)}
            rows={3}
            className="w-full bg-[#0c0e14] border border-[#2e3547] rounded-lg p-2.5 font-mono text-xs text-[#e2e2eb] outline-none focus:border-[#7c3aed]"
          />
          <div className="flex justify-end">
            <button
              onClick={handleSimulate}
              disabled={isSimulating}
              className="flex items-center gap-1 px-2.5 py-1 rounded bg-[#282a30] hover:bg-[#33343b] text-[#4cd7f6] text-xs font-mono transition-colors"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>{isSimulating ? '시뮬레이션 중...' : '다시 판정하기'}</span>
            </button>
          </div>
        </div>

        {/* AI Result Card */}
        <div className="bg-[#1e1f26] border border-[#7c3aed]/40 p-3.5 rounded-lg space-y-2">
          <span className="text-xs font-mono font-semibold text-[#4edea3] flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-[#4edea3]" />
            AI 판정 결과 (예상)
          </span>

          <div className="text-xs text-[#e2e2eb]">
            카테고리:{' '}
            {result.categories.map((c, i) => (
              <strong key={c} className="text-[#4cd7f6]">
                {c}
                {i < result.categories.length - 1 ? ' & ' : ''}
              </strong>
            ))}{' '}
            복합 감지됨
          </div>

          <div className="text-[11px] font-mono text-[#ccc3d8] bg-[#0c0e14] p-2 rounded">
            {result.guidelineAction}
          </div>

          {result.securityNotices && result.securityNotices.length > 0 && (
            <div className="space-y-1 bg-[#241a0e] border border-[#f59e0b]/30 p-2 rounded text-[11px] text-[#f59e0b]">
              <span className="font-semibold flex items-center gap-1 font-mono">
                <ShieldCheck className="w-3 h-3" /> 보안 점검 권고:
              </span>
              <ul className="list-disc list-inside space-y-0.5 text-[10px] text-[#ccc3d8]">
                {result.securityNotices.map((sn, idx) => (
                  <li key={idx}>{sn}</li>
                ))}
              </ul>
            </div>
          )}

          <div className="space-y-1">
            <span className="text-[10px] font-mono text-[#958da1]">마스킹 적용 후 본문:</span>
            <div className="text-xs font-mono text-[#4edea3] bg-[#0c0e14] p-2 rounded">
              {result.maskedOutput}
            </div>
          </div>
        </div>

        <button
          onClick={onClose}
          className="w-full bg-[#7c3aed] hover:bg-[#6d28d9] text-white font-medium text-xs py-2.5 rounded-lg shadow-md transition-all active:scale-98"
        >
          확인 완료
        </button>
      </div>
    </div>
  );
};
