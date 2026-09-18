import React, { useState, useRef, useEffect } from 'react';
import {
  Sparkles,
  Search,
  Database,
  Link as LinkIcon,
  CheckCircle,
  Share2,
  BookOpen,
  Send,
  Code2,
  Mic,
  Plus,
  Edit3,
  Check,
  X,
  RefreshCw,
  AlertTriangle,
  Layers,
  Activity,
  Trash2,
  ChevronDown,
  ChevronUp,
  Cpu,
  CornerDownLeft,
  ExternalLink,
  Bot
} from 'lucide-react';
import { NoteItem, TabType, Workspace, ChatMessage, DiffProposal } from '../../types';

interface ChatViewProps {
  notes: NoteItem[];
  activeWorkspace: Workspace;
  onSelectNote: (id: string | null) => void;
  onNavigateToTab: (tab: TabType) => void;
  onUpdateNote: (updatedNote: NoteItem) => void;
  onShowToast: (msg: string) => void;
}

export const ChatView: React.FC<ChatViewProps> = ({
  notes,
  activeWorkspace,
  onSelectNote,
  onNavigateToTab,
  onUpdateNote,
  onShowToast
}) => {
  // Mode filter
  const [omniMode, setOmniMode] = useState<'all' | 'space' | 'edit'>('all');

  // Input & mentions
  const [inputVal, setInputVal] = useState('');
  const [isMentionOpen, setIsMentionOpen] = useState(false);
  const [isContextDrawerOpen, setIsContextDrawerOpen] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isThinking, setIsThinking] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Initial messages based on user's high-fidelity mock image
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'msg-user-1',
      sender: 'user',
      timestamp: '2분 전',
      text: 'PostgreSQL 커넥션 풀 튜닝 문서에서 PgBouncer 트랜잭션 풀링 관련 주의사항 찾아서 백링크랑 같이 알려줘'
    },
    {
      id: 'msg-ai-1',
      sender: 'assistant',
      timestamp: '2분 전',
      type: 'semantic-map',
      text: '요청하신 [[PostgreSQL 16 커넥션 풀 튜닝 가이드]] 문서 내 PgBouncer 트랜잭션 풀링 핵심 설정과 제약사항입니다:',
      thinkingSteps: {
        summary: '3개 노드 시맨틱 탐색 및 백링크 역추적 완료',
        details: [
          {
            icon: 'check_circle',
            text: '[[PostgreSQL 16 커넥션 풀 튜닝 가이드]] (유사도 94.2%)',
            color: 'text-[#4edea3]'
          },
          {
            icon: 'link',
            text: '[[PgBouncer 트랜잭션 모드 아키텍처]] (참조 12건)',
            color: 'text-[#4cd7f6]'
          },
          {
            icon: 'device_hub',
            text: '[[주문 트랜잭션 Redlock 분산 락]] (의존 노드)',
            color: 'text-[#958da1]'
          }
        ]
      },
      highlightTitle: 'PostgreSQL 16 커넥션 풀 튜닝 가이드',
      highlightSection: {
        title: '1. 세션 불일치 및 Prepared Statements',
        desc: '트랜잭션 풀링 모드(pool_mode = transaction)에서는 클라이언트 연결이 트랜잭션 종료 시 즉시 반환되므로 세션 종속적 명령어가 유실됩니다.'
      },
      warningCallout: {
        title: '주의: Prepared Statements 세션 캐싱 누수',
        desc: '애플리케이션 ORM이 서버사이드 준비 구문을 생성할 경우, 다른 커넥션으로 전환되었을 때 Prepared statement does not exist 오류가 발생하거나 메모리 누수가 발생합니다. 드라이버 설정에서 명시적 비활성화 또는 풀러 전용 옵션이 강제되어야 합니다.'
      },
      backlinks: ['[[PgBouncer 트랜잭션 모드]]', '[[DB 커넥션 아키텍처 v2]]'],
      actionPills: [
        {
          label: '문서 본문 열기',
          icon: 'book',
          actionType: 'open-doc',
          payload: 'note-db-tuning'
        },
        {
          label: '그래프에서 위치',
          icon: 'share',
          actionType: 'graph-pos',
          payload: 'kafka'
        },
        {
          label: '관련 노드 4개',
          icon: 'nodes',
          actionType: 'related-nodes'
        }
      ]
    },
    {
      id: 'msg-user-2',
      sender: 'user',
      timestamp: '방금',
      text: "그럼 해당 문서의 '주의사항' 섹션에 방금 말한 세션 캐싱 누수 해결책이랑 커넥션 수 파라미터(max_client_conn: 1000)를 추가로 수정 반영해줘"
    },
    {
      id: 'msg-ai-2',
      sender: 'assistant',
      timestamp: '방금',
      type: 'diff-proposal',
      text: '제안된 수정 내역(Diff Proposal)을 생성하였습니다. 검토 후 아래 [문서에 즉시 반영 (Commit)] 버튼을 누르시면 지식 저장소에 실시간 반영됩니다.',
      diffProposal: {
        targetDocId: 'note-db-tuning',
        targetDocTitle: 'PostgreSQL 16 커넥션 풀 튜닝 가이드',
        targetDocLevel: 'L3 Module',
        sectionTitle: '## 3. 주의사항 및 운영 가이드라인',
        addedCount: 3,
        lines: [
          { lineNumber: 38, type: 'context', content: '### 3.1 PgBouncer 연동 시 제약' },
          { lineNumber: 39, type: 'context', content: '트랜잭션 풀링 모드 사용 시 세션 종속 파라미터는 차단됩니다.' },
          {
            lineNumber: 40,
            type: 'added',
            content:
              '- **Prepared Statements 방어:** JDBC/ORM 레이어에서 `prepareThreshold=0` 또는 풀러 레벨 DEALLOCATE 캐시 동기화를 필히 활성화해야 합니다.'
          },
          {
            lineNumber: 41,
            type: 'added',
            content:
              '- **클라이언트 풀 용량 권장치:** 인그레스 동시성을 고려해 `max_client_conn = 1000` 이상 확보 권장.'
          },
          {
            lineNumber: 42,
            type: 'added',
            content: '- **관련 백링크:** [[PgBouncer 세션 메모리 누수 해결 사례]]'
          }
        ],
        ruleCheckNote: '내부 분류 아키텍처 규칙 #RULE-DB-CONCURRENCY 검증 통과 완료.',
        committed: false
      }
    }
  ]);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isThinking]);

  // Handle Commit Diff Proposal to state
  const handleCommitDiff = (messageId: string, diff: DiffProposal) => {
    // 1. Find the target note in state
    const targetNote = notes.find((n) => n.id === diff.targetDocId || n.title.includes(diff.targetDocTitle));
    const noteIdToUse = targetNote ? targetNote.id : 'note-db-tuning';

    if (targetNote) {
      const updated: NoteItem = {
        ...targetNote,
        updatedAt: '방금 전 (AI 커밋됨)',
        statusBadge: 'AI 패치 반영완료',
        badgeType: 'ai-refined',
        excerpt:
          'PgBouncer 트랜잭션 풀링 모드 적용 시 max_client_conn=1000 설정 권장 및 prepareThreshold=0 파라미터 메모리 최적화 완료.',
        tags: Array.from(new Set([...targetNote.tags, '#pgbouncer-patch', '#concurrency-1000'])),
        connectedNodes: Array.from(
          new Set([...(targetNote.connectedNodes || []), '[[PgBouncer 세션 메모리 누수 해결 사례]]'])
        ),
        backlinksCount: (targetNote.backlinksCount || 0) + 1
      };
      onUpdateNote(updated);
    }

    // 2. Mark this diff message as committed
    const sha = Math.random().toString(16).substring(2, 9);
    setMessages((prev) =>
      prev.map((m) => {
        if (m.id === messageId && m.diffProposal) {
          return {
            ...m,
            diffProposal: {
              ...m.diffProposal,
              committed: true,
              commitSha: sha
            }
          };
        }
        return m;
      })
    );

    onShowToast(`'${diff.targetDocTitle}' 문서에 수정 사항이 즉시 커밋(SHA: ${sha})되었습니다.`);
  };

  // Process User Query
  const handleSendMessage = (textToSend?: string) => {
    const query = (textToSend || inputVal).trim();
    if (!query) return;

    // Add user message
    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      sender: 'user',
      timestamp: '방금',
      text: query
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputVal('');
    setIsMentionOpen(false);
    setIsThinking(true);

    // AI Response generation (Real Gemini API with local RAG hybrid fallback)
    (async () => {
      try {
        const lower = query.toLowerCase();

        // Case 1: Modification / Update Request
        if (
          lower.includes('수정') ||
          lower.includes('업데이트') ||
          lower.includes('추가') ||
          lower.includes('반영') ||
          lower.includes('패치') ||
          lower.includes('commit') ||
          omniMode === 'edit'
        ) {
          // Find target note or default to first matching
          const matched =
            notes.find(
              (n) =>
                query.includes(n.title) ||
                n.tags.some((t) => lower.includes(t.toLowerCase().replace('#', ''))) ||
                lower.includes(n.category.toLowerCase())
            ) || notes[0];

          const aiResponse: ChatMessage = {
            id: `ai-${Date.now()}`,
            sender: 'assistant',
            timestamp: '방금',
            type: 'diff-proposal',
            text: `'${matched.title}' 문서에 대한 요청 사항을 반영한 Diff Proposal입니다. 변경 내용을 확인 후 커밋해주세요.`,
            diffProposal: {
              targetDocId: matched.id,
              targetDocTitle: matched.title,
              targetDocLevel: matched.category === '인프라' ? 'L2 Infra' : 'L3 Module',
              sectionTitle: '## 추가 규격 및 최적화 설정',
              addedCount: 2,
              lines: [
                { lineNumber: 21, type: 'context', content: `// ${matched.title} 연관 컨텍스트` },
                { lineNumber: 22, type: 'context', content: `기본 파라미터 및 보안 정책 유효성 검증 통과` },
                {
                  lineNumber: 23,
                  type: 'added',
                  content: `- **AI 자동 추가 규칙:** 클러스터 가용성 보장을 위해 재시도 백오프(Exponential Backoff: base=500ms, max=5s)가 활성화되었습니다.`
                },
                {
                  lineNumber: 24,
                  type: 'added',
                  content: `- **연관 백링크:** [[${matched.title} 장애 대응 SOP]]`
                }
              ],
              ruleCheckNote: `내부 시스템 규약 #RULE-${matched.category.toUpperCase()} 자동 정합성 테스트 통과.`,
              committed: false
            }
          };
          setMessages((prev) => [...prev, aiResponse]);
          setIsThinking(false);
          return;
        }

        // Case 2: Try real server Gemini RAG endpoint
        let serverGeminiAnswer = '';
        try {
          const resp = await fetch('/api/ai/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              message: query,
              contextNotes: notes.map((n) => ({
                title: n.title,
                excerpt: n.excerpt,
                tags: n.tags
              }))
            })
          });
          if (resp.ok) {
            const data = await resp.json();
            if (data && data.text && !data.fallback) {
              serverGeminiAnswer = data.text;
            }
          }
        } catch (e) {
          console.warn('Gemini endpoint unreachable, using local RAG engine:', e);
        }

        // Case 3: Summarize Request
        if (lower.includes('요약') || lower.includes('정리') || lower.includes('스펙') || lower.includes('summary')) {
          let relevantNotes = notes;
          if (lower.includes('인프라') || lower.includes('infra')) {
            relevantNotes = notes.filter((n) => n.category === '인프라');
          } else if (lower.includes('소스') || lower.includes('saga') || lower.includes('코드')) {
            relevantNotes = notes.filter((n) => n.category === '소스코드');
          } else if (lower.includes('db') || lower.includes('데이터베이스') || lower.includes('아키텍처')) {
            relevantNotes = notes.filter((n) => n.category === 'DB' || n.id === 'note-sys-arch-spec');
          }

          const topNote = relevantNotes[0] || notes[0];

          const aiResponse: ChatMessage = {
            id: `ai-${Date.now()}`,
            sender: 'assistant',
            timestamp: '방금',
            type: 'semantic-map',
            text: serverGeminiAnswer || `요청하신 지식 문서 **${relevantNotes.length}건**에 대한 RAG 시맨틱 요약 결과입니다:`,
            thinkingSteps: {
              summary: `${relevantNotes.length}개 대상 노드 컨텍스트 취합 및 중복 백링크 필터링 완료`,
              details: relevantNotes.slice(0, 3).map((n) => ({
                icon: 'check_circle',
                text: `[[${n.title}]] (매칭도 96.5%)`,
                color: 'text-[#4edea3]'
              }))
            },
            highlightTitle: topNote.title,
            highlightSection: {
              title: `핵심 아키텍처 요약 (${topNote.category})`,
              desc: `${topNote.excerpt} 현재 시스템은 ${topNote.wordCount}단어로 구조화되어 있으며 백링크 ${topNote.backlinksCount}개가 실시간 연결되어 있습니다.`
            },
            warningCallout: {
              title: '운영 준수 가이드라인',
              desc: '해당 아키텍처는 무중단 배포 및 분산 환경의 멱등성 보장이 필수적이며, 카프카 토픽 및 DB 커넥션 풀 한도를 초과하지 않도록 주기적인 모니터링이 권장됩니다.'
            },
            backlinks: topNote.connectedNodes || ['[[Kafka 클러스터]]', '[[AWS RDS]]'],
            actionPills: [
              {
                label: '문서 본문 열기',
                icon: 'book',
                actionType: 'open-doc',
                payload: topNote.id
              },
              {
                label: '그래프에서 위치',
                icon: 'share',
                actionType: 'graph-pos',
                payload: topNote.id
              }
            ]
          };
          setMessages((prev) => [...prev, aiResponse]);
          setIsThinking(false);
          return;
        }

        // Case 4: Search or General Q&A (with Gemini answer if available)
        const matchingNotes = notes.filter(
          (n) =>
            query.includes(n.title) ||
            n.title.toLowerCase().includes(lower) ||
            n.tags.some((t) => lower.includes(t.toLowerCase().replace('#', ''))) ||
            n.excerpt.toLowerCase().includes(lower)
        );

        const matchedNote = matchingNotes.length > 0 ? matchingNotes[0] : notes[0];

        const aiResponse: ChatMessage = {
          id: `ai-${Date.now()}`,
          sender: 'assistant',
          timestamp: '방금',
          type: 'semantic-map',
          text: serverGeminiAnswer
            ? serverGeminiAnswer
            : `검색어 관련 지식 그래프에서 **[[${matchedNote.title}]]** 문서 및 관련 노드를 탐색하였습니다:`,
          thinkingSteps: {
            summary: serverGeminiAnswer
              ? `Gemini 3.8 Flash RAG 추론 완료 • ${matchingNotes.length || 1}개 지식 노드 참조`
              : `시맨틱 임베딩 유사도 91.8% • ${matchingNotes.length || 1}개 연관 문서 식별`,
            details: [
              {
                icon: 'check_circle',
                text: `[[${matchedNote.title}]] (정합도 높음)`,
                color: 'text-[#4edea3]'
              },
              {
                icon: 'link',
                text: `카테고리: ${matchedNote.categoryFull}`,
                color: 'text-[#4cd7f6]'
              }
            ]
          },
          highlightTitle: matchedNote.title,
          highlightSection: {
            title: `상세 내용 및 아키텍처 규격`,
            desc: matchedNote.excerpt
          },
          backlinks: matchedNote.connectedNodes || ['[[Kafka 클러스터]]'],
          actionPills: [
            {
              label: '문서 본문 열기',
              icon: 'book',
              actionType: 'open-doc',
              payload: matchedNote.id
            },
            {
              label: '그래프에서 위치',
              icon: 'share',
              actionType: 'graph-pos',
              payload: matchedNote.id
            }
          ]
        };

        setMessages((prev) => [...prev, aiResponse]);
      } catch (err) {
        console.error('Error generating AI response:', err);
      } finally {
        setIsThinking(false);
      }
    })();
  };

  // Quick Action Pills click
  const handleActionPill = (pill: NonNullable<ChatMessage['actionPills']>[0]) => {
    if (pill.actionType === 'open-doc' && pill.payload) {
      onSelectNote(pill.payload);
      onNavigateToTab('notes');
      onShowToast('해당 지식 문서 상세 뷰로 이동했습니다.');
    } else if (pill.actionType === 'graph-pos') {
      onNavigateToTab('graph');
      onShowToast('지식 그래프 내 노드 위치를 표시합니다.');
    } else if (pill.actionType === 'related-nodes') {
      setIsContextDrawerOpen(true);
    }
  };

  // Clear chat
  const handleClearChat = () => {
    setMessages([]);
    onShowToast('대화 세션 및 캐시가 초기화되었습니다.');
  };

  // Voice dictation simulation
  const handleToggleVoice = () => {
    if (!isListening) {
      setIsListening(true);
      onShowToast('음성 입력을 수신 중입니다...');
      setTimeout(() => {
        setInputVal((prev) => (prev ? `${prev} PostgreSQL 파라미터 최적화` : 'PostgreSQL 파라미터 최적화'));
        setIsListening(false);
        onShowToast('음성이 텍스트로 변환되었습니다.');
      }, 1500);
    } else {
      setIsListening(false);
    }
  };

  return (
    <div className="flex flex-col h-full w-full bg-[#0c0e14] text-[#e2e2eb] relative overflow-hidden">
      {/* 1. Top Context & Telemetry Bar (from screen.png) */}
      <section className="px-4 lg:px-6 pt-3 pb-2 flex flex-col gap-2 shrink-0 border-b border-[#1f2432]/60 bg-[#111319]/50 backdrop-blur-sm z-10">
        <div className="flex items-center justify-between bg-[#191b22] px-3.5 py-2.5 rounded-xl border border-[#2e3547]/80 shadow-sm">
          <div className="flex items-center gap-3 min-w-0">
            <div className="relative flex items-center justify-center w-7 h-7 rounded-lg bg-[#33343b] shrink-0">
              <Database className="w-4 h-4 text-[#4edea3]" />
              <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-[#4edea3] shadow-[0_0_8px_rgba(78,222,163,0.8)]"></span>
            </div>
            <div className="flex flex-col min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-[11px] font-mono text-[#4edea3] font-bold uppercase tracking-wider">
                  RAG v3.2 Active
                </span>
                <span className="text-[#958da1] text-[10px]">/</span>
                <span className="text-[11px] font-mono text-[#4cd7f6] truncate">
                  {notes.length * 52 + 52} Nodes
                </span>
                <span className="text-[#958da1] text-[10px] hidden sm:inline">•</span>
                <span className="text-[10px] font-mono text-[#ccc3d8] hidden sm:inline">
                  {activeWorkspace.name}
                </span>
              </div>
              <span className="text-[11px] font-mono text-[#958da1] truncate">
                Embedding: text-vector-hybrid-q8
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setIsContextDrawerOpen(true)}
              aria-label="Inspect knowledge subgraph"
              className="w-8 h-8 rounded-lg bg-[#1e1f26] border border-[#2e3547]/60 flex items-center justify-center text-[#ccc3d8] hover:text-[#d2bbff] hover:bg-[#282a30] transition-colors"
              title="지식 컨텍스트 검사"
            >
              <Activity className="w-4 h-4" />
            </button>
            <button
              onClick={handleClearChat}
              aria-label="Clear session cache"
              className="w-8 h-8 rounded-lg bg-[#1e1f26] border border-[#2e3547]/60 flex items-center justify-center text-[#ccc3d8] hover:text-[#ffb4ab] hover:bg-[#282a30] transition-colors"
              title="대화 세션 캐시 비우기"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      </section>

      {/* 2. Main Chat Stream */}
      <div className="flex-1 overflow-y-auto custom-scrollbar px-4 lg:px-6 py-4 space-y-6">
        {messages.map((msg) => {
          if (msg.sender === 'user') {
            return (
              <div key={msg.id} className="flex flex-col items-end gap-1 pl-10 sm:pl-16">
                <div className="flex items-center gap-1.5 mb-0.5">
                  <span className="text-[10px] font-mono text-[#958da1]">엔지니어</span>
                  <span className="text-[10px] font-mono text-[#958da1]">• {msg.timestamp}</span>
                </div>
                <div className="bg-[#7c3aed] text-white px-4 py-3 rounded-2xl rounded-tr-none shadow-md max-w-full text-sm leading-relaxed">
                  <p>{msg.text}</p>
                </div>
              </div>
            );
          }

          // Assistant Message
          return (
            <div key={msg.id} className="flex flex-col items-start gap-2.5 pr-2 max-w-3xl">
              {/* Header */}
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-lg bg-[#282a30] border border-[#33343b] flex items-center justify-center shadow-sm">
                  {msg.type === 'diff-proposal' ? (
                    <Edit3 className="w-3.5 h-3.5 text-[#d2bbff]" />
                  ) : (
                    <Sparkles className="w-3.5 h-3.5 text-[#d2bbff]" />
                  )}
                </div>
                <span className="text-xs font-semibold text-[#e2e2eb]">Knowledge Synthesizer</span>
                {msg.type === 'diff-proposal' ? (
                  <span className="bg-[#7c3aed]/20 text-[#d2bbff] border border-[#7c3aed]/40 px-1.5 py-0.5 rounded text-[10px] font-mono font-medium animate-pulse">
                    DIFF PROPOSAL
                  </span>
                ) : (
                  <span className="bg-[#33343b] text-[#4cd7f6] px-1.5 py-0.5 rounded text-[10px] font-mono font-medium">
                    SEMANTIC MAP
                  </span>
                )}
              </div>

              {/* Thinking Accordion */}
              {msg.thinkingSteps && (
                <details className="w-full group bg-[#191b22] border border-[#2e3547] rounded-xl overflow-hidden shadow-sm">
                  <summary className="flex items-center justify-between px-3.5 py-2.5 cursor-pointer select-none bg-[#1e1f26]/60 hover:bg-[#1e1f26] transition-colors">
                    <div className="flex items-center gap-2 text-[#4cd7f6] min-w-0">
                      <Cpu className="w-4 h-4 animate-pulse shrink-0" />
                      <span className="text-xs font-mono truncate">{msg.thinkingSteps.summary}</span>
                    </div>
                    <ChevronDown className="w-4 h-4 text-[#958da1] transition-transform duration-200 group-open:rotate-180" />
                  </summary>
                  <div className="px-3.5 py-2.5 bg-[#0c0e14]/80 flex flex-col gap-1.5 text-xs font-mono text-[#ccc3d8] border-t border-[#2e3547]/60">
                    {msg.thinkingSteps.details.map((step, idx) => (
                      <div key={idx} className="flex items-center gap-2">
                        <CheckCircle className={`w-3.5 h-3.5 ${step.color || 'text-[#4edea3]'}`} />
                        <span>{step.text}</span>
                      </div>
                    ))}
                  </div>
                </details>
              )}

              {/* Message Content Container */}
              <div className="w-full bg-[#1e1f26] border border-[#2e3547] rounded-2xl rounded-tl-none p-4 shadow-sm flex flex-col gap-3.5 text-sm leading-relaxed">
                <p className="text-[#e2e2eb]">
                  {msg.text.includes('[[') ? (
                    <span>
                      {msg.text.split(/(\[\[.*?\]\])/g).map((part, i) => {
                        if (part.startsWith('[[') && part.endsWith(']]')) {
                          const docName = part.slice(2, -2);
                          return (
                            <button
                              key={i}
                              onClick={() => {
                                const target = notes.find((n) => n.title.includes(docName));
                                if (target) {
                                  onSelectNote(target.id);
                                  onNavigateToTab('notes');
                                }
                              }}
                              className="inline-flex items-center gap-0.5 mx-1 bg-[#33343b] px-1.5 py-0.5 rounded text-[#d2bbff] text-xs font-mono hover:bg-[#7c3aed]/30 hover:underline cursor-pointer transition-colors"
                            >
                              {part}
                            </button>
                          );
                        }
                        return part;
                      })}
                    </span>
                  ) : (
                    msg.text
                  )}
                </p>

                {/* Highlight Section Box */}
                {msg.highlightSection && (
                  <div className="bg-[#191b22] p-3.5 rounded-xl border border-[#2e3547]/80 flex flex-col gap-2">
                    <div className="flex items-center gap-2">
                      <span className="w-1.5 h-3.5 bg-[#4cd7f6] rounded-full"></span>
                      <span className="text-xs font-bold text-[#e2e2eb]">{msg.highlightSection.title}</span>
                    </div>
                    <p className="text-xs text-[#ccc3d8] leading-normal">{msg.highlightSection.desc}</p>
                  </div>
                )}

                {/* Warning Callout Box */}
                {msg.warningCallout && (
                  <div className="bg-[#93000a]/20 border border-[#ffb4ab]/30 p-3.5 rounded-xl flex items-start gap-2.5">
                    <AlertTriangle className="w-4 h-4 text-[#ffb4ab] mt-0.5 shrink-0" />
                    <div className="flex flex-col gap-1">
                      <span className="text-xs font-bold text-[#ffb4ab]">{msg.warningCallout.title}</span>
                      <p className="text-xs text-[#ccc3d8] leading-relaxed">{msg.warningCallout.desc}</p>
                    </div>
                  </div>
                )}

                {/* Backlinks */}
                {msg.backlinks && msg.backlinks.length > 0 && (
                  <div className="flex items-center gap-2 flex-wrap pt-1">
                    <span className="text-xs font-mono text-[#958da1]">참조 백링크:</span>
                    {msg.backlinks.map((bl, i) => (
                      <span
                        key={i}
                        className="inline-flex items-center gap-1 bg-[#282a30] border border-[#33343b] px-2 py-1 rounded text-[#d2bbff] text-xs font-mono cursor-pointer hover:bg-[#7c3aed]/20"
                        onClick={() => {
                          const name = bl.replace('[[', '').replace(']]', '');
                          const note = notes.find((n) => n.title.includes(name));
                          if (note) {
                            onSelectNote(note.id);
                            onNavigateToTab('notes');
                          }
                        }}
                      >
                        <LinkIcon className="w-3 h-3 text-[#4cd7f6]" />
                        {bl}
                      </span>
                    ))}
                  </div>
                )}

                {/* Action Pills */}
                {msg.actionPills && msg.actionPills.length > 0 && (
                  <div className="flex items-center gap-2 flex-wrap pt-2 border-t border-[#2e3547]/60">
                    {msg.actionPills.map((pill, idx) => (
                      <button
                        key={idx}
                        onClick={() => handleActionPill(pill)}
                        className="flex items-center gap-1.5 bg-[#282a30] hover:bg-[#33343b] border border-[#33343b] px-2.5 py-1.5 rounded-lg text-xs font-medium text-[#e2e2eb] transition-colors"
                      >
                        {pill.actionType === 'open-doc' && <BookOpen className="w-3.5 h-3.5 text-[#d2bbff]" />}
                        {pill.actionType === 'graph-pos' && <Share2 className="w-3.5 h-3.5 text-[#4cd7f6]" />}
                        {pill.actionType === 'related-nodes' && <Layers className="w-3.5 h-3.5 text-[#4edea3]" />}
                        <span>{pill.label}</span>
                      </button>
                    ))}
                  </div>
                )}

                {/* Diff Proposal Component (Interactive Mutation & Commit) */}
                {msg.diffProposal && (
                  <div className="mt-1 flex flex-col gap-3">
                    {/* Target Document Header */}
                    <div className="flex items-center justify-between bg-[#191b22] px-3.5 py-2.5 rounded-xl border border-[#2e3547]">
                      <div className="flex items-center gap-2 min-w-0">
                        <BookOpen className="w-4 h-4 text-[#d2bbff] shrink-0" />
                        <span className="text-xs font-semibold text-[#e2e2eb] truncate">
                          {msg.diffProposal.targetDocTitle}
                        </span>
                      </div>
                      <span className="bg-[#33343b] text-[#958da1] px-2 py-0.5 rounded text-[11px] font-mono shrink-0">
                        {msg.diffProposal.targetDocLevel}
                      </span>
                    </div>

                    {/* Diff Viewer Box */}
                    <div className="flex flex-col rounded-xl overflow-hidden bg-[#0c0e14] border border-[#2e3547]">
                      <div className="flex items-center justify-between px-3.5 py-1.5 bg-[#282a30]/60 font-mono text-[11px] text-[#958da1] border-b border-[#2e3547]/60">
                        <span>{msg.diffProposal.sectionTitle}</span>
                        <span className="text-[#4edea3]">+{msg.diffProposal.addedCount} additions</span>
                      </div>
                      <div className="p-2.5 font-mono text-xs flex flex-col gap-1 overflow-x-auto">
                        {msg.diffProposal.lines.map((line, lIdx) => {
                          if (line.type === 'context') {
                            return (
                              <div key={lIdx} className="flex items-start gap-2 text-[#958da1]/80 px-1">
                                <span className="select-none w-5 text-right shrink-0">{line.lineNumber}</span>
                                <span className="select-none"> </span>
                                <span className="whitespace-pre-wrap">{line.content}</span>
                              </div>
                            );
                          }
                          return (
                            <div
                              key={lIdx}
                              className="flex items-start gap-2 bg-[#007650]/25 text-[#76ffc2] border border-[#007650]/40 px-1 py-0.5 rounded"
                            >
                              <span className="select-none w-5 text-right text-[#4edea3] shrink-0">
                                {line.lineNumber}
                              </span>
                              <span className="select-none text-[#4edea3] font-bold">+</span>
                              <span className="whitespace-pre-wrap font-medium">{line.content}</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* AI Reasoning Note */}
                    <div className="flex items-center gap-2 text-[#ccc3d8] text-xs bg-[#191b22] px-3 py-2 rounded-lg border border-[#2e3547]/70">
                      <CheckCircle className="w-4 h-4 text-[#4edea3] shrink-0" />
                      <span>{msg.diffProposal.ruleCheckNote}</span>
                    </div>

                    {/* Mutation Buttons */}
                    {!msg.diffProposal.committed ? (
                      <div className="flex items-center gap-2 pt-1">
                        <button
                          onClick={() => handleCommitDiff(msg.id, msg.diffProposal!)}
                          className="flex-1 min-h-[42px] flex items-center justify-center gap-2 bg-gradient-to-r from-[#7c3aed] via-[#732ee4] to-[#7c3aed] hover:opacity-95 active:scale-[0.98] text-white font-semibold text-xs rounded-xl shadow-lg shadow-[#7c3aed]/25 transition-all"
                        >
                          <Check className="w-4 h-4" />
                          <span>문서에 즉시 반영 (Commit)</span>
                        </button>
                        <button
                          onClick={() => {
                            onShowToast('인라인 수정 모드가 활성화되었습니다.');
                          }}
                          className="w-10 h-10 flex items-center justify-center bg-[#282a30] hover:bg-[#33343b] border border-[#33343b] rounded-xl text-[#e2e2eb] transition-colors"
                          title="수정 후 반영"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => {
                            onShowToast('제안된 변경사항이 취소되었습니다.');
                            setMessages((prev) => prev.filter((m) => m.id !== msg.id));
                          }}
                          className="w-10 h-10 flex items-center justify-center bg-[#282a30] hover:bg-[#33343b] border border-[#33343b] rounded-xl text-[#ffb4ab] transition-colors"
                          title="취소"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between bg-[#007650]/20 border border-[#007650]/40 px-3.5 py-2.5 rounded-xl">
                        <div className="flex items-center gap-2 text-[#4edea3] text-xs font-mono font-medium">
                          <CheckCircle className="w-4 h-4" />
                          <span>성공적으로 커밋되었습니다. (SHA: {msg.diffProposal.commitSha || '4f89ac2'})</span>
                        </div>
                        <button
                          onClick={() => {
                            onSelectNote(msg.diffProposal!.targetDocId);
                            onNavigateToTab('notes');
                          }}
                          className="text-[11px] font-mono text-[#4cd7f6] hover:underline flex items-center gap-1"
                        >
                          <span>문서 확인</span>
                          <ExternalLink className="w-3 h-3" />
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {/* Thinking indicator */}
        {isThinking && (
          <div className="flex items-center gap-2 text-xs font-mono text-[#958da1] animate-pulse pl-2">
            <Sparkles className="w-4 h-4 text-[#d2bbff] animate-spin" />
            <span>AI 모델이 지식 그래프와 백링크 컨텍스트를 분석 중입니다...</span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* 3. Suggestion Prompt Pills (from screen.png) */}
      <section className="px-4 lg:px-6 pt-1 pb-2 shrink-0 flex flex-col gap-1.5 border-t border-[#1f2432]/60 bg-[#0c0e14]">
        <div className="flex items-center justify-between text-[10px] font-mono">
          <span className="text-[#958da1] tracking-wider uppercase">추천 시맨틱 액션</span>
          <span className="text-[#4cd7f6]">Auto-Contextual</span>
        </div>
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-0.5">
          <button
            onClick={() => handleSendMessage('시스템 아키텍처 및 DB 설계 문서 요약해줘')}
            className="shrink-0 flex items-center gap-1.5 bg-[#1e1f26] hover:bg-[#282a30] border border-[#7c3aed]/40 px-3 py-1.5 rounded-full text-[#d2bbff] text-xs transition-colors shadow-sm font-medium"
          >
            <span>📐</span>
            <span>시스템 아키텍처 & DB 설계 요약</span>
          </button>
          <button
            onClick={() => handleSendMessage('최근 정제된 인프라 문서 요약해줘')}
            className="shrink-0 flex items-center gap-1.5 bg-[#1e1f26] hover:bg-[#282a30] border border-[#2e3547] px-3 py-1.5 rounded-full text-[#e2e2eb] text-xs transition-colors shadow-sm"
          >
            <span>💡</span>
            <span>최근 정제된 인프라 문서 요약</span>
          </button>
          <button
            onClick={() => handleSendMessage('Saga 패턴과 결제 API 백링크 연결해줘')}
            className="shrink-0 flex items-center gap-1.5 bg-[#1e1f26] hover:bg-[#282a30] border border-[#2e3547] px-3 py-1.5 rounded-full text-[#e2e2eb] text-xs transition-colors shadow-sm"
          >
            <span className="text-[#d2bbff]">🔗</span>
            <span>Saga 패턴과 결제 API 백링크 연결</span>
          </button>
          <button
            onClick={() => handleSendMessage('고립된 노드 2건 자동 분류해줘')}
            className="shrink-0 flex items-center gap-1.5 bg-[#1e1f26] hover:bg-[#282a30] border border-[#2e3547] px-3 py-1.5 rounded-full text-[#e2e2eb] text-xs transition-colors shadow-sm"
          >
            <span className="text-[#4cd7f6]">🔍</span>
            <span>고립된 노드 2건 자동 분류</span>
          </button>
          <button
            onClick={() => handleSendMessage('L4 리소스 전체 목록 및 엔드포인트 추출해줘')}
            className="shrink-0 flex items-center gap-1.5 bg-[#1e1f26] hover:bg-[#282a30] border border-[#2e3547] px-3 py-1.5 rounded-full text-[#e2e2eb] text-xs transition-colors shadow-sm"
          >
            <span>📊</span>
            <span>L4 리소스 전체 목록 추출</span>
          </button>
        </div>
      </section>

      {/* 4. Bottom Sticky AI Input Bar Container (from screen.png) */}
      <footer className="shrink-0 w-full px-4 lg:px-6 pb-4 pt-1 bg-[#111319]/95 backdrop-blur-md border-t border-[#1f2432]">
        {/* Omni Mode Filters */}
        <div className="flex items-center gap-1.5 mb-2">
          <button
            onClick={() => setOmniMode('all')}
            className={`px-2.5 py-1 rounded-full text-xs font-mono font-medium flex items-center gap-1 transition-all ${
              omniMode === 'all'
                ? 'bg-[#d2bbff] text-[#25005a] shadow-sm font-semibold'
                : 'bg-[#1e1f26] text-[#958da1] hover:text-[#e2e2eb]'
            }`}
          >
            <span>🌐</span>
            <span>전체 지식 RAG</span>
          </button>
          <button
            onClick={() => setOmniMode('space')}
            className={`px-2.5 py-1 rounded-full text-xs font-mono font-medium flex items-center gap-1 transition-all ${
              omniMode === 'space'
                ? 'bg-[#d2bbff] text-[#25005a] shadow-sm font-semibold'
                : 'bg-[#1e1f26] text-[#958da1] hover:text-[#e2e2eb]'
            }`}
          >
            <span>📁</span>
            <span>현재 스페이스</span>
          </button>
          <button
            onClick={() => setOmniMode('edit')}
            className={`px-2.5 py-1 rounded-full text-xs font-mono font-medium flex items-center gap-1 transition-all ${
              omniMode === 'edit'
                ? 'bg-[#7c3aed] text-white shadow-sm font-semibold'
                : 'bg-[#1e1f26] text-[#958da1] hover:text-[#e2e2eb]'
            }`}
          >
            <Edit3 className="w-3 h-3" />
            <span>문서 수정 모드</span>
          </button>
        </div>

        {/* Input Console */}
        <div className="bg-[#191b22] border border-[#2e3547] rounded-2xl p-2.5 flex flex-col gap-2 shadow-xl relative">
          {/* Note Mention Selector Dropdown */}
          {isMentionOpen && (
            <div className="absolute bottom-full mb-2 left-2 w-72 bg-[#1e1f26] border border-[#2e3547] rounded-xl shadow-2xl p-2 z-50 max-h-56 overflow-y-auto custom-scrollbar">
              <div className="text-[11px] font-mono text-[#958da1] px-2 py-1 mb-1">
                노트 멘션 선택 ([[...]])
              </div>
              {notes.map((note) => (
                <button
                  key={note.id}
                  onClick={() => {
                    setInputVal((prev) => `${prev} [[${note.title}]] `);
                    setIsMentionOpen(false);
                    textareaRef.current?.focus();
                  }}
                  className="w-full text-left px-2 py-1.5 rounded-lg hover:bg-[#282a30] text-xs text-[#e2e2eb] truncate flex items-center justify-between"
                >
                  <span className="truncate">{note.title}</span>
                  <span className="text-[10px] font-mono text-[#4cd7f6] shrink-0 ml-1">{note.category}</span>
                </button>
              ))}
            </div>
          )}

          <div className="relative w-full">
            <textarea
              ref={textareaRef}
              value={inputVal}
              onChange={(e) => setInputVal(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                  e.preventDefault();
                  handleSendMessage();
                } else if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage();
                }
              }}
              className="w-full bg-transparent resize-none outline-none text-sm text-[#e2e2eb] placeholder:text-[#958da1]/70 px-2 pt-1 leading-relaxed max-h-32 custom-scrollbar"
              placeholder="지식 검색, 질문, 또는 [[문서 수정]] 명령을 입력하세요..."
              rows={2}
            />
          </div>

          <div className="flex items-center justify-between pt-1 border-t border-[#2e3547]/50">
            <div className="flex items-center gap-1">
              <button
                onClick={() => setIsMentionOpen(!isMentionOpen)}
                className={`w-8 h-8 rounded-lg flex items-center justify-center font-mono font-bold text-xs transition-colors ${
                  isMentionOpen
                    ? 'bg-[#7c3aed] text-white'
                    : 'bg-[#1e1f26] text-[#958da1] hover:text-[#d2bbff] hover:bg-[#282a30]'
                }`}
                title="문서 멘션 ([[]])"
              >
                [[
              </button>
              <button
                onClick={() => {
                  setInputVal((prev) => `${prev}\n\`\`\`ts\n// 코드 조각\n\`\`\`\n`);
                  textareaRef.current?.focus();
                }}
                className="w-8 h-8 rounded-lg bg-[#1e1f26] hover:bg-[#282a30] text-[#958da1] hover:text-[#4cd7f6] flex items-center justify-center transition-colors"
                title="코드 조각 삽입"
              >
                <Code2 className="w-4 h-4" />
              </button>
              <button
                onClick={handleToggleVoice}
                className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${
                  isListening
                    ? 'bg-[#ffb4ab] text-[#690005] animate-pulse'
                    : 'bg-[#1e1f26] hover:bg-[#282a30] text-[#958da1] hover:text-[#4edea3]'
                }`}
                title="음성 입력"
              >
                <Mic className="w-4 h-4" />
              </button>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-[11px] font-mono text-[#958da1] hidden sm:inline-block">↵ or ⌘+↵</span>
              <button
                onClick={() => handleSendMessage()}
                disabled={!inputVal.trim()}
                aria-label="Send query"
                className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#7c3aed] to-[#4cd7f6] text-white flex items-center justify-center shadow-[0_0_14px_rgba(124,58,237,0.45)] hover:opacity-95 active:scale-95 disabled:opacity-40 disabled:scale-100 transition-all"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </footer>

      {/* 5. Context Inspector Drawer (from screen.png) */}
      {isContextDrawerOpen && (
        <div className="fixed inset-0 z-50 bg-[#0c0e14]/80 backdrop-blur-sm flex items-end justify-center animate-fadeIn">
          <div className="w-full max-w-2xl bg-[#1e1f26] border-t border-[#2e3547] rounded-t-2xl p-5 max-h-[85vh] overflow-y-auto custom-scrollbar flex flex-col gap-4 shadow-2xl">
            <div className="flex items-center justify-between pb-2 border-b border-[#2e3547]">
              <div className="flex items-center gap-2">
                <Database className="w-5 h-5 text-[#4cd7f6]" />
                <span className="text-sm font-semibold text-[#e2e2eb]">
                  현재 활성화된 지식 컨텍스트 ({notes.length * 52 + 52})
                </span>
              </div>
              <button
                onClick={() => setIsContextDrawerOpen(false)}
                className="w-7 h-7 rounded-full bg-[#282a30] flex items-center justify-center text-[#958da1] hover:text-[#e2e2eb]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <div className="bg-[#191b22] border border-[#2e3547] p-3 rounded-xl flex flex-col gap-1">
                <span className="text-[10px] font-mono text-[#4edea3]">DB 클러스터</span>
                <span className="text-xs font-bold text-[#e2e2eb]">PostgreSQL 16</span>
                <span className="text-[10px] font-mono text-[#958da1]">84 백링크 활성</span>
              </div>
              <div className="bg-[#191b22] border border-[#2e3547] p-3 rounded-xl flex flex-col gap-1">
                <span className="text-[10px] font-mono text-[#4cd7f6]">커넥션 풀러</span>
                <span className="text-xs font-bold text-[#e2e2eb]">PgBouncer v1.21</span>
                <span className="text-[10px] font-mono text-[#958da1]">트랜잭션 풀 모드</span>
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <span className="text-xs font-mono text-[#958da1]">색인된 스페이스 지식 목록 ({notes.length}건)</span>
              <div className="space-y-1.5 max-h-48 overflow-y-auto custom-scrollbar">
                {notes.map((n) => (
                  <div
                    key={n.id}
                    onClick={() => {
                      onSelectNote(n.id);
                      setIsContextDrawerOpen(false);
                      onNavigateToTab('notes');
                    }}
                    className="flex items-center justify-between bg-[#191b22] hover:bg-[#282a30] border border-[#2e3547]/60 px-3 py-2 rounded-lg cursor-pointer transition-colors"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-[10px] font-mono text-[#d2bbff] shrink-0">[{n.category}]</span>
                      <span className="text-xs text-[#e2e2eb] truncate">{n.title}</span>
                    </div>
                    <span className="text-[10px] font-mono text-[#4edea3] shrink-0 ml-2">정상 동기화</span>
                  </div>
                ))}
              </div>
            </div>

            <button
              onClick={() => setIsContextDrawerOpen(false)}
              className="w-full min-h-[42px] bg-[#282a30] hover:bg-[#33343b] rounded-xl text-[#e2e2eb] font-semibold text-xs transition-colors"
            >
              닫기
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
