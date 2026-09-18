import React, { useState, useEffect, useMemo } from 'react';
import {
  Sparkles,
  Bot,
  ShieldCheck,
  Network,
  Cpu,
  Plus,
  Save,
  CheckCircle2,
  Trash2,
  Copy,
  Check,
  Play,
  Loader2,
  Sliders,
  RefreshCw,
  Clock,
  Terminal,
  FileCode,
  Tag,
  HelpCircle
} from 'lucide-react';
import { AgentPrompt, AgentType } from '../../types';
import {
  fetchAgentPromptsFromApi,
  saveAgentPromptInApi,
  activateAgentPromptInApi,
  deleteAgentPromptFromApi,
  testRunAgentPromptInApi,
  TestRunPromptResult
} from '../../api';
import { MarkdownRenderer } from './MarkdownRenderer';

interface AgentPromptsViewProps {
  onNotify?: (message: string, type?: 'info' | 'success' | 'warning' | 'error') => void;
}

const AGENT_CONFIGS: Record<AgentType, { name: string; nameEn: string; icon: any; color: string; bgColor: string; description: string }> = {
  'refinery-ingestion': {
    name: '정제소 인제스천 엔진',
    nameEn: 'Refinery Ingestion',
    icon: Sparkles,
    color: '#4cd7f6',
    bgColor: 'bg-[#002f3d]/60',
    description: '비정형 텍스트, 소스코드, 로그 스크랩을 표준 아키텍처 지식 카드로 자동 정제'
  },
  'rag-synthesizer': {
    name: 'RAG 지식 어시스턴트',
    nameEn: 'RAG Synthesizer',
    icon: Bot,
    color: '#76ffc2',
    bgColor: 'bg-[#003d27]/60',
    description: 'pgvector 임베딩과 문서 백링크를 결합하여 사용자 질문에 심층 아키텍처 답변 제공'
  },
  'diff-proposer': {
    name: 'Diff 생성 및 패치기',
    nameEn: 'Diff Proposer',
    icon: FileCode,
    color: '#d2bbff',
    bgColor: 'bg-[#311f5e]/60',
    description: '기존 아키텍처 문서와 사용자 수정 요구사항을 분석하여 Git 스타일 Diff 및 패치 생성'
  },
  'security-auditor': {
    name: '보안 & 아키텍처 감사관',
    nameEn: 'Security Auditor',
    icon: ShieldCheck,
    color: '#ffb4ab',
    bgColor: 'bg-[#410002]/60',
    description: '금융 규제, 망분리, PII 마스킹, MSA 통신 보안 룰 준수 여부 자동 검증'
  },
  'backlink-recommender': {
    name: '시맨틱 백링크 추천기',
    nameEn: 'Backlink Recommender',
    icon: Network,
    color: '#f6c177',
    bgColor: 'bg-[#3e2c14]/60',
    description: '문서 내용 간 시맨틱 연관성을 계산하여 가치 있는 [[위키링크]] 토폴로지 추천'
  },
  'mermaid-architect': {
    name: '다이어그램 아키텍트',
    nameEn: 'Mermaid Architect',
    icon: Cpu,
    color: '#eb6f92',
    bgColor: 'bg-[#421526]/60',
    description: '아키텍처 명세 및 이벤트 흐름을 Mermaid.js 다이어그램 코드로 실시간 시각화'
  }
};

const DEFAULT_VARIABLE_PRESETS: Record<string, string> = {
  sourceContent: `[오후 2:15] 플랫폼팀 김수석: 결제 승인 완료 이벤트가 분산 Kafka 토픽 'payment.approved.v2'로 발행되는데, 파티션 키가 order_id로 되어있어 단일 사용자 기준 멱등성 검증 시 파티션 쏠림 현상이 발생합니다. 파티션 키를 user_hash로 변경하고 Idempotency-Key 캐싱 TTL을 600초로 상향해야 합니다.`,
  userQuery: `PostgreSQL pgvector에서 HNSW 인덱스의 m과 ef_construction 최적 설정값과 검색 튜닝 파라미터를 알려줘.`,
  contextNotes: `[문서: pgvector 인덱스 최적화] 카테고리: DB | 태그: #pgvector, #PostgreSQL, #HNSW | 요약: pgvector HNSW 인덱스는 m=16, ef_construction=64 기본값으로 생성되며, 실시간 쿼리 시 ef_search=40 설정을 권장합니다.`,
  docId: `doc-payment-v2`,
  docTitle: `결제 승인 분산 파이프라인 명세`,
  docContent: `# 결제 승인 분산 파이프라인 명세\n\n## 개요\n결제 승인 이벤트를 Kafka 토픽에 발행하여 비동기 처리합니다.\n\n## Kafka 설정\n- 토픽명: payment.approved.v2\n- 파티션: 6개`,
  request: `Kafka 파티션 키를 user_hash로 수정하고, 멱등성 검증 Redis TTL 600초 설정을 명세에 추가해줘.`,
  ruleName: `내부 인프라 IP 및 토큰 마스킹 규정`,
  ruleLevel: `High`,
  detectionLogic: `IPv4 사설 대역(10.x, 172.16.x, 192.168.x) 및 Bearer 토큰 평문 노출 금지`,
  targetContent: `curl -H "Authorization: Bearer sec_tok_991823" http://10.240.12.88:8080/api/v1/payment/verify`,
  systemDescription: `웹 클라이언트가 API Gateway로 결제 요청을 보내고, API Gateway는 Payment Service로 라우팅합니다. Payment Service는 Redis에 분산 락을 획득한 후 PostgreSQL에 거래 내역을 저장하고 Kafka로 승인 이벤트를 발행합니다.`,
  diagramType: `flowchart TD`,
  existingDocs: `- [[결제 분산 트랜잭션 Saga 오케스트레이터]]\n- [[PostgreSQL pgvector 지식 저장소]]\n- [[Kafka 이벤트 스트리밍 클러스터]]\n- [[Redis 분산 캐시 & 토큰 저장소]]`
};

export const AgentPromptsView: React.FC<AgentPromptsViewProps> = ({ onNotify }) => {
  const [prompts, setPrompts] = useState<AgentPrompt[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedAgentType, setSelectedAgentType] = useState<AgentType | 'all'>('all');
  const [selectedPromptId, setSelectedPromptId] = useState<string | null>(null);

  // Edit form state
  const [formData, setFormData] = useState<Partial<AgentPrompt>>({
    title: '',
    agentType: 'refinery-ingestion',
    roleDescription: '',
    systemPrompt: '',
    userPromptTemplate: '',
    variables: [],
    model: 'gpt-4o-mini',
    temperature: 0.2,
    isActive: false,
    version: '1.0.0',
    tags: []
  });

  // Sandbox state
  const [sandboxVariables, setSandboxVariables] = useState<Record<string, string>>({});
  const [testResult, setTestResult] = useState<TestRunPromptResult | null>(null);
  const [testingPrompt, setTestingPrompt] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [tagInput, setTagInput] = useState('');

  // Load prompts from DB
  const loadPrompts = async () => {
    setLoading(true);
    try {
      const data = await fetchAgentPromptsFromApi();
      setPrompts(data);
      if (data.length > 0 && !selectedPromptId) {
        setSelectedPromptId(data[0].id);
        populateFormData(data[0]);
      }
    } catch (err: any) {
      onNotify?.(`프롬프트 목록 조회 실패: ${err.message}`, 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPrompts();
  }, []);

  // When selected prompt changes, update form
  const populateFormData = (prompt: AgentPrompt) => {
    setFormData({ ...prompt });
    // Initialize sandbox variables based on prompt variables
    const vars = prompt.variables || [];
    const newVars: Record<string, string> = {};
    for (const v of vars) {
      newVars[v] = sandboxVariables[v] || DEFAULT_VARIABLE_PRESETS[v] || `[${v} 샘플 값]`;
    }
    setSandboxVariables(newVars);
    setTestResult(null);
  };

  const handleSelectPrompt = (prompt: AgentPrompt) => {
    setSelectedPromptId(prompt.id);
    populateFormData(prompt);
  };

  // Filtered prompts
  const filteredPrompts = useMemo(() => {
    if (selectedAgentType === 'all') return prompts;
    return prompts.filter((p) => p.agentType === selectedAgentType);
  }, [prompts, selectedAgentType]);

  // Detected variables from userPromptTemplate ({{varName}})
  const detectedVariables = useMemo(() => {
    const text = formData.userPromptTemplate || '';
    const regex = /\{\{([a-zA-Z0-9_-]+)\}\}/g;
    const found = new Set<string>();
    let m;
    while ((m = regex.exec(text)) !== null) {
      if (m[1]) found.add(m[1]);
    }
    return Array.from(found);
  }, [formData.userPromptTemplate]);

  // Sync detected variables to formData and sandboxVariables
  useEffect(() => {
    setFormData((prev) => ({ ...prev, variables: detectedVariables }));
    setSandboxVariables((prev) => {
      const next = { ...prev };
      for (const v of detectedVariables) {
        if (!next[v]) {
          next[v] = DEFAULT_VARIABLE_PRESETS[v] || '';
        }
      }
      return next;
    });
  }, [detectedVariables]);

  // Handle Save
  const handleSave = async () => {
    if (!formData.title?.trim()) {
      onNotify?.('프롬프트 제목을 입력해주세요.', 'warning');
      return;
    }
    try {
      const payload: Partial<AgentPrompt> = {
        ...formData,
        id: selectedPromptId || undefined,
        variables: detectedVariables
      };
      const saved = await saveAgentPromptInApi(payload);
      onNotify?.(`"${saved.title}" 프롬프트가 성공적으로 저장되었습니다.`, 'success');
      await loadPrompts();
      setSelectedPromptId(saved.id);
      populateFormData(saved);
    } catch (err: any) {
      onNotify?.(`저장 실패: ${err.message}`, 'error');
    }
  };

  // Handle Activate
  const handleActivate = async () => {
    if (!selectedPromptId || !formData.agentType) return;
    try {
      await activateAgentPromptInApi(selectedPromptId, formData.agentType as AgentType);
      onNotify?.(`프롬프트가 ${AGENT_CONFIGS[formData.agentType as AgentType]?.name || formData.agentType} 운영 엔진으로 활성화되었습니다!`, 'success');
      await loadPrompts();
      setFormData((prev) => ({ ...prev, isActive: true }));
    } catch (err: any) {
      onNotify?.(`활성화 실패: ${err.message}`, 'error');
    }
  };

  // Handle Delete
  const handleDelete = async () => {
    if (!selectedPromptId) return;
    if (!window.confirm('선택한 프롬프트를 영구 삭제하시겠습니까?')) return;
    try {
      await deleteAgentPromptFromApi(selectedPromptId);
      onNotify?.('프롬프트가 삭제되었습니다.', 'info');
      setSelectedPromptId(null);
      await loadPrompts();
    } catch (err: any) {
      onNotify?.(`삭제 실패: ${err.message}`, 'error');
    }
  };

  // Handle Duplicate
  const handleDuplicate = () => {
    const newId = `prompt-${Date.now()}`;
    const duplicatePrompt: Partial<AgentPrompt> = {
      ...formData,
      id: newId,
      title: `${formData.title} (사본)`,
      version: `${formData.version || '1.0.0'}-copy`,
      isActive: false
    };
    setSelectedPromptId(null);
    setFormData(duplicatePrompt);
    onNotify?.('새 프롬프트 사본이 편집기에 로드되었습니다. [저장]을 눌러 등록하세요.', 'info');
  };

  // Handle Create New
  const handleCreateNew = () => {
    const currentAgent = selectedAgentType === 'all' ? 'refinery-ingestion' : selectedAgentType;
    setSelectedPromptId(null);
    setFormData({
      id: `prompt-${Date.now()}`,
      title: `신규 ${AGENT_CONFIGS[currentAgent].name} 프롬프트`,
      agentType: currentAgent,
      roleDescription: AGENT_CONFIGS[currentAgent].description,
      systemPrompt: `당신은 Obsidian Slate 지식 관리 시스템의 ${AGENT_CONFIGS[currentAgent].name}입니다.`,
      userPromptTemplate: `요청 사항:\n{{userQuery}}`,
      variables: ['userQuery'],
      model: 'gpt-4o-mini',
      temperature: 0.2,
      isActive: false,
      version: '1.0.0',
      tags: ['#CustomPrompt']
    });
    setTestResult(null);
  };

  // Handle Run Test
  const handleRunTest = async () => {
    setTestingPrompt(true);
    try {
      const result = await testRunAgentPromptInApi({
        systemPrompt: formData.systemPrompt || '',
        userPromptTemplate: formData.userPromptTemplate || '',
        variables: sandboxVariables,
        model: formData.model || 'gpt-4o-mini',
        temperature: formData.temperature ?? 0.2
      });
      setTestResult(result);
      if (result.isRateLimit) {
        onNotify?.('LLM API Quota 제한으로 시뮬레이션 결과가 제공되었습니다.', 'warning');
      } else if (result.success) {
        onNotify?.(`테스트 완료 (${result.latencyMs}ms 소요)`, 'success');
      }
    } catch (err: any) {
      onNotify?.(`테스트 실행 오류: ${err.message}`, 'error');
    } finally {
      setTestingPrompt(false);
    }
  };

  // Copy output
  const handleCopyOutput = async () => {
    if (!testResult?.outputText) return;
    try {
      await navigator.clipboard.writeText(testResult.outputText);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    } catch {
      // fallback
    }
  };

  // Tag addition
  const handleAddTag = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && tagInput.trim()) {
      e.preventDefault();
      const cleanTag = tagInput.trim().startsWith('#') ? tagInput.trim() : `#${tagInput.trim()}`;
      const currentTags = formData.tags || [];
      if (!currentTags.includes(cleanTag)) {
        setFormData({ ...formData, tags: [...currentTags, cleanTag] });
      }
      setTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setFormData({
      ...formData,
      tags: (formData.tags || []).filter((t) => t !== tagToRemove)
    });
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-[#0c0e14] text-[#e2e2eb] overflow-hidden">
      {/* Top Header */}
      <header className="px-6 py-4 bg-[#111319] border-b border-[#1f2432] flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#7c3aed]/30 to-[#4cd7f6]/30 border border-[#7c3aed]/40 flex items-center justify-center p-2 shadow-lg shadow-[#7c3aed]/10">
            <Sliders className="w-6 h-6 text-[#7c3aed]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-semibold tracking-tight text-white">AI 에이전트 프롬프트 허브</h1>
              <span className="px-2 py-0.5 text-[10px] font-mono rounded-full bg-[#7c3aed]/20 text-[#d2bbff] border border-[#7c3aed]/40">
                PROMPT ORCHESTRATOR v2.0
              </span>
            </div>
            <p className="text-xs text-[#8e95aa] mt-0.5">
              지식 정제소, RAG 시맨틱 챗봇, Diff 패치, 보안 규칙 엔진 등 6종 핵심 AI 에이전트 프롬프트 핫스와핑 & 실시간 샌드박스
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <div className="hidden sm:flex items-center gap-3 mr-2 px-3 py-1.5 rounded-lg bg-[#161922] border border-[#232938] text-xs font-mono">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-[#4cd7f6] animate-pulse"></span>
              <span className="text-[#8e95aa]">총 프롬프트:</span>
              <span className="font-semibold text-white">{prompts.length}개</span>
            </div>
            <div className="w-px h-3 bg-[#2b3245]"></div>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-[#4edea3]"></span>
              <span className="text-[#8e95aa]">운영 활성화:</span>
              <span className="font-semibold text-[#4edea3]">
                {prompts.filter((p) => p.isActive).length}개 에이전트
              </span>
            </div>
          </div>

          <button
            onClick={loadPrompts}
            title="새로고침"
            className="p-2 text-[#8e95aa] hover:text-white hover:bg-[#1f2432] rounded-lg transition-colors border border-transparent hover:border-[#2a3142] cursor-pointer"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-[#4cd7f6]' : ''}`} />
          </button>

          <button
            onClick={handleCreateNew}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-white bg-[#7c3aed] hover:bg-[#6d28d9] rounded-lg transition-all shadow-md shadow-[#7c3aed]/20 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>새 프롬프트 등록</span>
          </button>
        </div>
      </header>

      {/* Agent Category Filter Bar */}
      <div className="px-6 py-2.5 bg-[#141720] border-b border-[#1f2432] flex items-center gap-2 overflow-x-auto no-scrollbar shrink-0">
        <button
          onClick={() => setSelectedAgentType('all')}
          className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all shrink-0 flex items-center gap-1.5 cursor-pointer ${
            selectedAgentType === 'all'
              ? 'bg-[#7c3aed] text-white shadow-sm'
              : 'bg-[#1a1d28] text-[#8e95aa] hover:text-[#d1d5db] hover:bg-[#222736]'
          }`}
        >
          <span>전체 에이전트</span>
          <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-black/30 font-mono">
            {prompts.length}
          </span>
        </button>

        {(Object.keys(AGENT_CONFIGS) as AgentType[]).map((type) => {
          const cfg = AGENT_CONFIGS[type];
          const Icon = cfg.icon;
          const count = prompts.filter((p) => p.agentType === type).length;
          const activePrompt = prompts.find((p) => p.agentType === type && p.isActive);
          const isSelected = selectedAgentType === type;

          return (
            <button
              key={type}
              onClick={() => setSelectedAgentType(type)}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all shrink-0 flex items-center gap-1.5 cursor-pointer ${
                isSelected
                  ? 'bg-[#1f2432] text-white border border-[#7c3aed]/60 shadow-sm'
                  : 'bg-[#1a1d28] text-[#8e95aa] hover:text-[#d1d5db] hover:bg-[#222736] border border-transparent'
              }`}
            >
              <Icon className="w-3.5 h-3.5" style={{ color: cfg.color }} />
              <span>{cfg.name}</span>
              {activePrompt && (
                <span className="w-1.5 h-1.5 rounded-full bg-[#4edea3]" title="운영 활성 프롬프트 보유"></span>
              )}
              <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-black/30 font-mono text-[#a0a5b8]">
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Main Dual-Pane Body */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Pane: Prompt Cards & Editor Form */}
        <div className="w-1/2 flex flex-col border-r border-[#1f2432] bg-[#0f1117] overflow-hidden">
          {/* Subheader: Prompt Selector Dropdown */}
          <div className="p-3 border-b border-[#1f2432] bg-[#141722] flex items-center justify-between gap-3 shrink-0">
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <span className="text-xs font-mono text-[#8e95aa] uppercase tracking-wider shrink-0">
                선택 프롬프트:
              </span>
              <select
                value={selectedPromptId || ''}
                onChange={(e) => {
                  const found = prompts.find((p) => p.id === e.target.value);
                  if (found) handleSelectPrompt(found);
                }}
                className="flex-1 bg-[#1a1d29] border border-[#2a3144] rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-[#7c3aed] truncate cursor-pointer font-medium"
              >
                {filteredPrompts.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.isActive ? '● [운영중] ' : '○ '}
                    {p.title} ({p.version}) - {AGENT_CONFIGS[p.agentType]?.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              {formData.isActive ? (
                <span className="flex items-center gap-1 px-2 py-1 text-[11px] font-medium rounded-md bg-[#003d27] text-[#4edea3] border border-[#007650]">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  운영 반영중
                </span>
              ) : (
                <button
                  onClick={handleActivate}
                  disabled={!selectedPromptId}
                  className="flex items-center gap-1 px-2.5 py-1 text-[11px] font-medium rounded-md bg-[#1f2432] text-[#d2bbff] hover:bg-[#7c3aed] hover:text-white border border-[#7c3aed]/40 transition-colors disabled:opacity-50 cursor-pointer"
                  title="이 버전을 실제 시스템 파이프라인의 활성 프롬프트로 지정"
                >
                  <Check className="w-3 h-3" />
                  운영에 활성화
                </button>
              )}
            </div>
          </div>

          {/* Form Content Area */}
          <div className="flex-1 overflow-y-auto p-5 space-y-4 text-xs">
            {/* Title & Agent Type Row */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="md:col-span-2 space-y-1">
                <label className="text-[11px] font-semibold text-[#8e95aa] uppercase tracking-wider">
                  프롬프트 제목
                </label>
                <input
                  type="text"
                  value={formData.title || ''}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="예: Refinery Ingestion Agent v2.4 (고신뢰도 모드)"
                  className="w-full bg-[#161922] border border-[#232938] rounded-lg px-3 py-2 text-white placeholder-[#535b70] focus:outline-none focus:border-[#7c3aed] text-xs"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-[#8e95aa] uppercase tracking-wider">
                  에이전트 타입
                </label>
                <select
                  value={formData.agentType || 'refinery-ingestion'}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      agentType: e.target.value as AgentType,
                      roleDescription: AGENT_CONFIGS[e.target.value as AgentType]?.description || ''
                    })
                  }
                  className="w-full bg-[#161922] border border-[#232938] rounded-lg px-2.5 py-2 text-white focus:outline-none focus:border-[#7c3aed] text-xs cursor-pointer"
                >
                  {(Object.keys(AGENT_CONFIGS) as AgentType[]).map((t) => (
                    <option key={t} value={t}>
                      {AGENT_CONFIGS[t].name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Role Description */}
            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-[#8e95aa] uppercase tracking-wider">
                에이전트 역할 및 목적 설명
              </label>
              <input
                type="text"
                value={formData.roleDescription || ''}
                onChange={(e) => setFormData({ ...formData, roleDescription: e.target.value })}
                placeholder="에이전트의 구체적 임무 요약"
                className="w-full bg-[#161922] border border-[#232938] rounded-lg px-3 py-2 text-white placeholder-[#535b70] focus:outline-none focus:border-[#7c3aed] text-xs"
              />
            </div>

            {/* Model & Hyperparameters Row */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 p-3 rounded-xl bg-[#141722] border border-[#1f2536]">
              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-[#8e95aa] flex items-center gap-1">
                  <Bot className="w-3.5 h-3.5 text-[#4cd7f6]" />
                  적용 AI 모델
                </label>
                <div className="relative">
                  <input
                    type="text"
                    list="model-presets"
                    value={formData.model || 'gpt-4o-mini'}
                    onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                    placeholder="예: gpt-4o-mini, llama3, custom-model"
                    className="w-full bg-[#1a1d29] border border-[#262c3e] rounded-lg px-2.5 py-1.5 text-white focus:outline-none focus:border-[#7c3aed] text-xs font-mono"
                  />
                  <datalist id="model-presets">
                    <option value="gpt-4o-mini">gpt-4o-mini (OpenAI Fast)</option>
                    <option value="gpt-4o">gpt-4o (OpenAI High Intelligence)</option>
                    <option value="deepseek-chat">deepseek-chat (DeepSeek-V3)</option>
                    <option value="claude-3-5-sonnet">claude-3-5-sonnet (Proxy / OpenRouter)</option>
                    <option value="llama-3.3-70b">llama-3.3-70b (vLLM / Ollama)</option>
                    <option value="qwen-2.5-coder">qwen-2.5-coder (vLLM / Ollama)</option>
                    <option value="gemini-3.8-flash">gemini-3.8-flash (Gemini Fallback)</option>
                  </datalist>
                </div>
              </div>

              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-semibold text-[#8e95aa] flex items-center gap-1">
                    <Sliders className="w-3.5 h-3.5 text-[#7c3aed]" />
                    Temperature
                  </label>
                  <span className="font-mono text-[#d2bbff] text-[11px] font-bold">
                    {formData.temperature ?? 0.2}
                  </span>
                </div>
                <input
                  type="range"
                  min="0.0"
                  max="1.0"
                  step="0.05"
                  value={formData.temperature ?? 0.2}
                  onChange={(e) => setFormData({ ...formData, temperature: parseFloat(e.target.value) })}
                  className="w-full accent-[#7c3aed] cursor-pointer mt-1"
                />
                <div className="flex justify-between text-[9px] text-[#6b7280]">
                  <span>0.0 (정밀)</span>
                  <span>1.0 (창의적)</span>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-[#8e95aa] flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-[#4edea3]" />
                  프롬프트 버전
                </label>
                <input
                  type="text"
                  value={formData.version || '1.0.0'}
                  onChange={(e) => setFormData({ ...formData, version: e.target.value })}
                  className="w-full bg-[#1a1d29] border border-[#262c3e] rounded-lg px-2.5 py-1.5 text-white text-xs font-mono focus:outline-none focus:border-[#7c3aed]"
                />
              </div>
            </div>

            {/* System Prompt */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-[11px] font-semibold text-[#4cd7f6] uppercase tracking-wider flex items-center gap-1.5">
                  <Terminal className="w-3.5 h-3.5" />
                  시스템 프롬프트 (System Prompt)
                </label>
                <span className="text-[10px] text-[#6b7280] font-mono">
                  {(formData.systemPrompt || '').length} 자
                </span>
              </div>
              <textarea
                rows={9}
                value={formData.systemPrompt || ''}
                onChange={(e) => setFormData({ ...formData, systemPrompt: e.target.value })}
                placeholder="에이전트의 역할, 분석 기준, 출력 JSON 규격 지시문 등을 상세히 작성합니다."
                className="w-full bg-[#090b10] border border-[#1e2333] rounded-lg p-3 text-[#dcdfe7] font-mono text-xs leading-relaxed focus:outline-none focus:border-[#4cd7f6] focus:ring-1 focus:ring-[#4cd7f6]/20 resize-y"
              />
            </div>

            {/* User Prompt Template with dynamic variables */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-[11px] font-semibold text-[#d2bbff] uppercase tracking-wider flex items-center gap-1.5">
                  <FileCode className="w-3.5 h-3.5" />
                  사용자 프롬프트 템플릿 (User Prompt Template)
                </label>
                <div className="flex items-center gap-1 text-[10px] text-[#8e95aa]">
                  <HelpCircle className="w-3 h-3" />
                  <span>변수는 </span>
                  <code className="bg-[#1f2432] text-[#4cd7f6] px-1 py-0.2 rounded font-mono">
                    {`{{변수명}}`}
                  </code>
                  <span> 형식으로 자동 감지</span>
                </div>
              </div>
              <textarea
                rows={5}
                value={formData.userPromptTemplate || ''}
                onChange={(e) => setFormData({ ...formData, userPromptTemplate: e.target.value })}
                placeholder="예: 다음 소스코드를 분석하여 {{sourceContent}} 규격을 반환하세요."
                className="w-full bg-[#090b10] border border-[#1e2333] rounded-lg p-3 text-[#dcdfe7] font-mono text-xs leading-relaxed focus:outline-none focus:border-[#7c3aed] focus:ring-1 focus:ring-[#7c3aed]/20 resize-y"
              />

              {/* Detected Variable Chips */}
              <div className="flex items-center flex-wrap gap-1.5 pt-1">
                <span className="text-[10px] text-[#71788e] font-mono">감지된 변수 ({detectedVariables.length}):</span>
                {detectedVariables.length === 0 ? (
                  <span className="text-[10px] text-[#555d73] italic">감지된 템플릿 변수가 없습니다.</span>
                ) : (
                  detectedVariables.map((v) => (
                    <span
                      key={v}
                      className="px-2 py-0.5 rounded bg-[#7c3aed]/15 text-[#d2bbff] border border-[#7c3aed]/30 text-[10px] font-mono font-medium"
                    >
                      {`{{${v}}}`}
                    </span>
                  ))
                )}
              </div>
            </div>

            {/* Tags */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold text-[#8e95aa] uppercase tracking-wider flex items-center gap-1">
                <Tag className="w-3.5 h-3.5" />
                분류 태그 (엔터로 추가)
              </label>
              <div className="flex flex-wrap items-center gap-1.5 p-2 rounded-lg bg-[#161922] border border-[#232938]">
                {(formData.tags || []).map((t) => (
                  <span
                    key={t}
                    className="flex items-center gap-1 px-2 py-0.5 rounded bg-[#1f2432] text-[#4cd7f6] text-[11px] font-mono border border-[#2e374c]"
                  >
                    {t}
                    <button
                      onClick={() => handleRemoveTag(t)}
                      className="text-[#727a8e] hover:text-red-400 ml-0.5 cursor-pointer"
                    >
                      ×
                    </button>
                  </span>
                ))}
                <input
                  type="text"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={handleAddTag}
                  placeholder="#태그 입력 후 Enter"
                  className="bg-transparent border-none text-xs text-white placeholder-[#555d73] focus:outline-none min-w-[120px]"
                />
              </div>
            </div>
          </div>

          {/* Form Action Footer */}
          <div className="p-3 bg-[#111319] border-t border-[#1f2432] flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2">
              <button
                onClick={handleDelete}
                disabled={!selectedPromptId}
                className="flex items-center gap-1 px-2.5 py-1.5 text-xs text-[#ffb4ab] hover:bg-[#410002]/40 rounded-lg transition-colors border border-transparent hover:border-[#93000a]/50 disabled:opacity-40 cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>삭제</span>
              </button>
              <button
                onClick={handleDuplicate}
                className="flex items-center gap-1 px-2.5 py-1.5 text-xs text-[#8e95aa] hover:text-white hover:bg-[#1f2432] rounded-lg transition-colors border border-[#252b3b] cursor-pointer"
              >
                <Copy className="w-3.5 h-3.5" />
                <span>사본 복제</span>
              </button>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleSave}
                className="flex items-center gap-1.5 px-4 py-1.5 text-xs font-medium text-white bg-[#7c3aed] hover:bg-[#6d28d9] rounded-lg transition-all shadow-md shadow-[#7c3aed]/20 cursor-pointer"
              >
                <Save className="w-3.5 h-3.5" />
                <span>프롬프트 저장</span>
              </button>
            </div>
          </div>
        </div>

        {/* Right Pane: Live Variable Sandbox & Test Execution */}
        <div className="w-1/2 flex flex-col bg-[#0b0d13] overflow-hidden">
          {/* Sandbox Header */}
          <div className="p-3 border-b border-[#1f2432] bg-[#12151f] flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-lg bg-[#4cd7f6]/20 border border-[#4cd7f6]/40 flex items-center justify-center">
                <Play className="w-3 h-3 text-[#4cd7f6]" />
              </div>
              <span className="text-xs font-semibold text-white">실시간 AI 테스트 샌드박스</span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#1f2432] text-[#8e95aa]">
                {formData.model || 'gpt-4o-mini'}
              </span>
            </div>

            <button
              onClick={handleRunTest}
              disabled={testingPrompt}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-[#0c0e14] bg-[#4cd7f6] hover:bg-[#3ec4e0] rounded-lg transition-all shadow-md shadow-[#4cd7f6]/20 cursor-pointer disabled:opacity-50"
            >
              {testingPrompt ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>AI 실행 중...</span>
                </>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>실시간 AI 실행 테스트</span>
                </>
              )}
            </button>
          </div>

          {/* Sandbox Body: Split into Variable Inputs & Test Results */}
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Top half: Dynamic Variable Inputs */}
            <div className="h-2/5 p-4 border-b border-[#1f2432] bg-[#0e1017] overflow-y-auto space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-[11px] font-semibold text-[#8e95aa] uppercase tracking-wider flex items-center gap-1.5">
                  <Sliders className="w-3.5 h-3.5 text-[#4cd7f6]" />
                  테스트 변수 주입 (Variables Injection)
                </h4>
                <button
                  onClick={() => {
                    const reset: Record<string, string> = {};
                    for (const v of detectedVariables) {
                      reset[v] = DEFAULT_VARIABLE_PRESETS[v] || '';
                    }
                    setSandboxVariables(reset);
                    onNotify?.('변수 기본 프리셋이 적용되었습니다.', 'info');
                  }}
                  className="text-[10px] text-[#4cd7f6] hover:underline cursor-pointer"
                >
                  기본 샘플값 채우기
                </button>
              </div>

              {detectedVariables.length === 0 ? (
                <div className="p-4 rounded-lg bg-[#141722] border border-[#202636] text-center text-xs text-[#71788e]">
                  현재 템플릿에 등록된 변수가 없습니다. 좌측 사용자 템플릿에{' '}
                  <code className="text-[#d2bbff]">{`{{변수명}}`}</code>을 입력하면 입력창이 자동 생성됩니다.
                </div>
              ) : (
                <div className="space-y-2.5">
                  {detectedVariables.map((varName) => (
                    <div key={varName} className="space-y-1">
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="font-mono text-[#d2bbff] font-medium">{`{{${varName}}}`}</span>
                        <span className="text-[10px] text-[#6b7280]">
                          {(sandboxVariables[varName] || '').length}자
                        </span>
                      </div>
                      <textarea
                        rows={2}
                        value={sandboxVariables[varName] || ''}
                        onChange={(e) =>
                          setSandboxVariables({ ...sandboxVariables, [varName]: e.target.value })
                        }
                        placeholder={`{{${varName}}} 에 주입할 텍스트 입력`}
                        className="w-full bg-[#141722] border border-[#202636] rounded-lg p-2 text-xs font-mono text-[#dcdfe7] placeholder-[#4f566b] focus:outline-none focus:border-[#4cd7f6]"
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Bottom half: Test Output View */}
            <div className="h-3/5 flex flex-col bg-[#0b0d13] overflow-hidden">
              {/* Output Header */}
              <div className="px-4 py-2 border-b border-[#1f2432] bg-[#12151f] flex items-center justify-between shrink-0">
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-semibold text-[#8e95aa] uppercase tracking-wider">
                    실행 결과 (AI Response)
                  </span>
                  {testResult && (
                    <div className="flex items-center gap-1.5">
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-[#4edea3]/10 text-[#4edea3] border border-[#4edea3]/30">
                        {testResult.latencyMs}ms
                      </span>
                      {testResult.isRateLimit ? (
                        <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-[#ffb4ab]/10 text-[#ffb4ab] border border-[#ffb4ab]/30">
                          Quota Fallback
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-[#4cd7f6]/10 text-[#4cd7f6] border border-[#4cd7f6]/30">
                          {testResult.model}
                        </span>
                      )}
                    </div>
                  )}
                </div>

                {testResult?.outputText && (
                  <button
                    onClick={handleCopyOutput}
                    className="flex items-center gap-1 text-[11px] text-[#8e95aa] hover:text-white px-2 py-1 rounded hover:bg-[#1f2432] transition-colors cursor-pointer"
                  >
                    {isCopied ? <Check className="w-3 h-3 text-[#4edea3]" /> : <Copy className="w-3 h-3" />}
                    <span>{isCopied ? '복사완료' : '결과 복사'}</span>
                  </button>
                )}
              </div>

              {/* Output Content */}
              <div className="flex-1 p-4 overflow-y-auto font-mono text-xs leading-relaxed text-[#dcdfe7]">
                {testingPrompt ? (
                  <div className="h-full flex flex-col items-center justify-center text-center space-y-3 text-[#71788e]">
                    <Loader2 className="w-8 h-8 animate-spin text-[#4cd7f6]" />
                    <p className="text-xs text-[#a0a5b8]">
                      AI 모델({formData.model || 'gpt-4o-mini'})에 프롬프트 전송 및 답변 생성 중...
                    </p>
                  </div>
                ) : testResult ? (
                  <div className="prose prose-invert max-w-none text-xs">
                    <MarkdownRenderer content={testResult.outputText} />
                  </div>
                ) : (
                  <div className="h-full flex flex-col items-center justify-center text-center space-y-2 text-[#555d73]">
                    <Bot className="w-10 h-10 stroke-[1.2] text-[#252b3b]" />
                    <p className="text-xs">상단의 [실시간 AI 실행 테스트] 버튼을 클릭하여</p>
                    <p className="text-[11px] text-[#42485a]">
                      현재 편집 중인 프롬프트와 변수 조합의 실제 AI 응답을 즉시 검증하세요.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
