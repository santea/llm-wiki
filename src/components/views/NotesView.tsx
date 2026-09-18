import React, { useState, useMemo, useRef } from 'react';
import {
  Search,
  Sparkles,
  Zap,
  Mic,
  Code2,
  Camera,
  Layers,
  ArrowRight,
  Pin,
  Clock,
  Link as LinkIcon,
  Link2,
  BookOpen,
  FileCode,
  Copy,
  Check,
  RotateCcw,
  Share2,
  Workflow,
  ListTree,
  Lightbulb,
  Plus,
  ArrowLeft,
  MoreHorizontal,
  Database,
  Server,
  Edit3,
  Save,
  X,
  Trash2
} from 'lucide-react';
import { NoteItem, Workspace } from '../../types';
import { ArchitectureDiagram } from './ArchitectureDiagram';
import { MermaidRenderer } from './MermaidRenderer';
import { MarkdownRenderer } from './MarkdownRenderer';

// Helper to extract or generate dynamic Mermaid diagram for a document
function getMermaidChartForNote(note: NoteItem): { chart: string; title: string } | null {
  const content = note.content || note.excerpt || '';

  // 1. Check for explicit ```mermaid code block in markdown
  const mermaidMatch = content.match(/```mermaid\s*([\s\S]*?)```/);
  if (mermaidMatch && mermaidMatch[1].trim()) {
    return {
      chart: mermaidMatch[1].trim(),
      title: `${note.title} (인라인 시각화)`
    };
  }

  const titleLower = note.title.toLowerCase();
  const tagsStr = (note.tags || []).join(' ').toLowerCase();

  // 2. Saga / Distributed Transaction
  if (note.id === 'note-saga' || titleLower.includes('saga') || tagsStr.includes('saga')) {
    return {
      title: 'Saga 분산 오케스트레이터 보상 트랜잭션 흐름',
      chart: `sequenceDiagram
    autonumber
    actor User as 사용자 (Client)
    participant Ingress as API 게이트웨이
    participant Saga as Saga 코디네이터
    participant Payment as 결제 모듈
    participant Stock as 재고 모듈
    participant DLQ as 보상 큐 (Kafka DLQ)

    User->>Ingress: 1. 주문 생성 요청 (POST /v2/orders)
    Ingress->>Saga: 2. Saga 인스턴스 초기화 & 분산락 획득
    Saga->>Payment: 3. 카카오페이 결제 승인 요청
    alt 정상 승인
        Payment-->>Saga: 200 OK (결제 성공)
        Saga->>Stock: 4. 재고 차감 요청 (Deduct)
        Stock-->>Saga: 재고 차감 완료
        Saga-->>Ingress: 트랜잭션 커밋 완료 (COMPLETED)
        Ingress-->>User: 201 Created (주문 성공)
    else PG 타임아웃 / 잔액 부족
        Payment--xSaga: 504 Gateway Timeout
        Saga->>DLQ: 5. 보상 트랜잭션 이벤트 발행 (Compensate)
        DLQ->>Stock: 6. 락 해제 및 보상 롤백
        Saga-->>Ingress: 트랜잭션 롤백 (FAILED)
        Ingress-->>User: 400 결제 실패 (정상 롤백됨)
    end`
    };
  }

  // 3. Redis / Sentinel / Redlock
  if (
    note.id === 'note-redis-sentinel' ||
    note.id === 'note-redlock' ||
    tagsStr.includes('redis') ||
    tagsStr.includes('sentinel')
  ) {
    return {
      title: 'Redis Cluster & Sentinel 쿼럼 장애 조치 (Failover) 토폴로지',
      chart: `flowchart TD
    Client["애플리케이션 클라이언트"] -->|마스터 주소 질의| Sentinel["Sentinel Quorum (쿼럼 = 2)"]
    Sentinel -.->|PING 헬스체크| Master["Redis Master (10.0.1.50:6379)"]
    Sentinel -.->|PING 헬스체크| Replica1["Redis Replica 1"]
    Sentinel -.->|PING 헬스체크| Replica2["Redis Replica 2"]
    Client -->|분산락 획득 (Redlock)| Master
    Master -->|비동기 복제| Replica1
    Master -->|비동기 복제| Replica2
    subgraph Failover["자동 장애 복구 프로세스"]
        Master -.->|다운 감지 (5,000ms)| Sentinel
        Sentinel ==>|신규 마스터 승격 명령| Replica1
    end`
    };
  }

  // 4. Kafka / Messaging
  if (
    note.id === 'note-kafka-static-membership' ||
    tagsStr.includes('kafka') ||
    titleLower.includes('kafka')
  ) {
    return {
      title: 'Kafka Consumer Static Membership 리밸런싱 억제 흐름',
      chart: `sequenceDiagram
    autonumber
    participant K8s as K8s Worker Pod (group.instance.id)
    participant Coord as Kafka Group Coordinator
    participant Part as Partition 0..N

    Note over K8s,Coord: Pod 롤링 배포 (재시작 발생)
    K8s->>Coord: Pod 종료 전 LeaveGroup 패킷 전송 생략
    Note over Coord: session.timeout.ms (45초) 동안 파티션 홀드!
    Note over Coord: 불필요한 리밸런싱 스톰 (Rebalance Storm) 방지
    K8s->>Coord: Pod 복구 완료 후 동일 group.instance.id로 JoinGroup
    Coord-->>K8s: 기존 파티션 소유권 즉시 복구 (Zero-Rebalance)`
    };
  }

  // 5. DB / PostgreSQL / pgvector
  if (
    note.category === 'DB' ||
    tagsStr.includes('postgres') ||
    tagsStr.includes('pgvector') ||
    tagsStr.includes('hnsw')
  ) {
    return {
      title: 'PostgreSQL 16 & pgvector HNSW 인덱스 파이프라인',
      chart: `flowchart LR
    App["Spring Boot API"] -->|포트 6432| PgBouncer["PgBouncer 트랜잭션 풀러"]
    PgBouncer -->|최대 50 커넥션 유지| Postgres[("PostgreSQL 16 Engine")]
    Postgres --> Docs["knowledge_documents (원장)"]
    Postgres --> Embeddings["knowledge_embeddings (768차원)"]
    Embeddings --> HNSW["HNSW Vector Index (m=16, ef=64)"]
    HNSW -.->|서브밀리초 검색| RAG["RAG 추론 컨텍스트"]`
    };
  }

  // 6. External Webhook / Payment API
  if (note.category === '연계' || titleLower.includes('webhook') || tagsStr.includes('webhook')) {
    return {
      title: '카카오페이 웹훅 수신 & 비동기 지수 백오프 워크플로우',
      chart: `sequenceDiagram
    autonumber
    actor PG as PG사 (카카오페이)
    participant Ingress as 웹훅 수신 엔드포인트
    participant Queue as Redis 멱등성 큐
    participant Worker as 비동기 결제 처리 워커

    PG->>Ingress: POST /v2/payments/webhook
    Ingress->>Queue: 웹훅 페이로드 큐 적재
    Ingress-->>PG: 200 OK (5초 타임아웃 방어)
    Queue->>Worker: 페이로드 소비 & 서명 검증
    alt 결제 처리 성공
        Worker-->>Worker: 주문 상태 확정 (COMPLETED)
    else 일시적 처리 실패 (재시도)
        Worker->>Queue: 지수 백오프 재시도 (1분, 5분, 15분)`
    };
  }

  // 7. General Default Fallback Workflow
  return {
    title: `${note.title} 아키텍처 워크플로우`,
    chart: `flowchart TD
    Doc["${note.title}"] --> Cat["카테고리: ${note.category}"]
    Doc --> Links["연결 백링크 (${note.backlinksCount}개)"]
    Doc --> Status["상태: ${note.statusBadge}"]`
  };
}

interface NotesViewProps {
  notes: NoteItem[];
  selectedNoteId: string | null;
  onSelectNote: (id: string | null) => void;
  onAddNote: (note: Partial<NoteItem>) => void;
  onUpdateNote?: (note: NoteItem, toastMsg?: string) => void;
  onDeleteNote?: (id: string) => void;
  onShowToast: (msg: string) => void;
  activeWorkspace: Workspace;
  workspaces?: Workspace[];
  onSelectWorkspace?: (ws: Workspace) => void;
  initialTagFilter?: string | null;
  onClearTagFilter?: () => void;
}

export const NotesView: React.FC<NotesViewProps> = ({
  notes,
  selectedNoteId,
  onSelectNote,
  onAddNote,
  onUpdateNote,
  onDeleteNote,
  onShowToast,
  activeWorkspace,
  workspaces = [],
  onSelectWorkspace,
  initialTagFilter,
  onClearTagFilter
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTag, setActiveTag] = useState<string | null>(initialTagFilter || null);

  React.useEffect(() => {
    if (initialTagFilter) {
      setActiveTag(initialTagFilter);
    }
  }, [initialTagFilter]);
  const [quickCaptureText, setQuickCaptureText] = useState('');
  const [isCapturing, setIsCapturing] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const [backlinkAdded, setBacklinkAdded] = useState(false);
  const [isReRefining, setIsReRefining] = useState(false);
  const [isEditingContent, setIsEditingContent] = useState(false);
  const [editContentText, setEditContentText] = useState('');
  const [editTitleText, setEditTitleText] = useState('');
  const [isMoreMenuOpen, setIsMoreMenuOpen] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<any>(null);

  // Close more-menu on outside click
  React.useEffect(() => {
    if (!isMoreMenuOpen) return;
    const handler = () => setIsMoreMenuOpen(false);
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [isMoreMenuOpen]);

  // If a note is selected, render the Detailed Note View (Image 7)
  const activeNote = notes.find((n) => n.id === selectedNoteId);

  // 1. Calculate Unlinked Mentions: Other documents mentioned in this document's text or vice-versa without [[link]]
  const unlinkedMentions = useMemo(() => {
    if (!activeNote) return [];
    const currentText = (activeNote.content || activeNote.excerpt || '').toLowerCase();
    const connectedTitles = (activeNote.connectedNodes || []).map((t) =>
      t.replace(/\[\[|\]\]/g, '').trim().toLowerCase()
    );

    return notes.filter((n) => {
      if (n.id === activeNote.id) return false;
      const targetTitle = n.title.toLowerCase();
      // Check if target title already in connected nodes
      if (connectedTitles.includes(targetTitle)) return false;

      // Check if title is mentioned in current document text
      const isMentionedInCurrent = currentText.includes(targetTitle);
      // Or current note's title is mentioned in other note's text without link
      const otherText = (n.content || n.excerpt || '').toLowerCase();
      const isCurrentMentionedInOther = otherText.includes(activeNote.title.toLowerCase());

      return isMentionedInCurrent || isCurrentMentionedInOther;
    });
  }, [activeNote, notes]);

  // 2. Calculate AI Semantic Recommendations based on shared tags, tech keywords and similarity
  const semanticRecommendations = useMemo(() => {
    if (!activeNote) return [];
    const connectedTitles = (activeNote.connectedNodes || []).map((t) =>
      t.replace(/\[\[|\]\]/g, '').trim().toLowerCase()
    );
    const currentTags = (activeNote.tags || []).map((t) => t.toLowerCase().replace('#', ''));

    return notes
      .filter((n) => {
        if (n.id === activeNote.id) return false;
        const targetTitle = n.title.toLowerCase();
        if (connectedTitles.includes(targetTitle)) return false;
        return true;
      })
      .map((n) => {
        const otherTags = (n.tags || []).map((t) => t.toLowerCase().replace('#', ''));
        const sharedTags = currentTags.filter((t) => otherTags.includes(t));
        const sameCategory = n.category === activeNote.category;
        // Calculate similarity score
        const score = Math.min(99, 68 + sharedTags.length * 10 + (sameCategory ? 15 : 0));
        return { note: n, score, sharedTags };
      })
      .filter((item) => item.score >= 70)
      .sort((a, b) => b.score - a.score)
      .slice(0, 3);
  }, [activeNote, notes]);

  // Quick capture submission handler
  const handleQuickCapture = () => {
    if (!quickCaptureText.trim()) {
      onShowToast('내용을 먼저 입력해주세요!');
      return;
    }
    setIsCapturing(true);
    setTimeout(() => {
      // Auto classify based on keywords
      const text = quickCaptureText;
      let category: NoteItem['category'] = '소스코드';
      let categoryFull = '소스코드 및 구현 정보';
      let tags = ['#AI정제', '#스니펫'];

      if (text.includes('DB') || text.includes('SQL') || text.includes('쿼리') || text.includes('인덱스')) {
        category = 'DB';
        categoryFull = '데이터베이스 정보';
        tags = ['#database', '#tuning', '#query'];
      } else if (text.includes('K8s') || text.includes('AWS') || text.includes('인프라') || text.includes('EKS')) {
        category = '인프라';
        categoryFull = '시스템 인프라 정보';
        tags = ['#infra', '#k8s', '#aws'];
      } else if (text.includes('API') || text.includes('웹훅') || text.includes('연동') || text.includes('PG')) {
        category = '연계';
        categoryFull = '외부 시스템 연계 정보';
        tags = ['#api', '#webhook', '#integration'];
      }

      onAddNote({
        title: text.slice(0, 32) + (text.length > 32 ? '...' : ''),
        category,
        categoryFull,
        excerpt: text,
        tags,
        wordCount: text.split(' ').length + 80,
        backlinksCount: 1,
        statusBadge: 'AI 자동정제됨',
        badgeType: 'ai-refined'
      });

      setQuickCaptureText('');
      setIsCapturing(false);
      onShowToast('메모가 AI 분석을 통해 자동 분류되어 추가되었습니다!');
    }, 1000);
  };

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(true);
    onShowToast('코드가 클립보드에 복사되었습니다.');
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleAddBacklink = () => {
    if (!activeNote) return;
    const newLink = '[[주문 서비스 ERD]]';
    const alreadyLinked = (activeNote.connectedNodes || []).some(
      (n) => n.replace(/\[\[|\]\]/g, '').trim().toLowerCase() === '주문 서비스 erd'
    );
    if (alreadyLinked) {
      onShowToast('이미 연결된 백링크입니다.');
      return;
    }
    const updatedNodes = [...(activeNote.connectedNodes || []), newLink];
    if (onUpdateNote) {
      onUpdateNote(
        {
          ...activeNote,
          connectedNodes: updatedNodes,
          backlinksCount: updatedNodes.length
        },
        `${newLink}와 양방향 백링크가 연결되었습니다.`
      );
    }
    setBacklinkAdded(true);
  };

  const handleReRefine = () => {
    setIsReRefining(true);
    setTimeout(() => {
      setIsReRefining(false);
      onShowToast('AI 지식 그래프 및 메타데이터가 최신 규격으로 재정제되었습니다.');
    }, 1200);
  };

  // AI Quick Actions
  const handleAiSummary = () => {
    if (!activeNote) return;
    const current = activeNote.content || activeNote.excerpt || '';
    if (current.includes('💡 **AI 핵심 아키텍처 요약**')) {
      onShowToast('이미 문서에 AI 요약 콜아웃이 포함되어 있습니다.');
      return;
    }
    const lines = current.split('\n').filter((l) => l.trim() && !l.startsWith('#') && !l.startsWith('>'));
    const summaryText = lines.slice(0, 2).join(' ') || `${activeNote.title}에 관한 핵심 아키텍처 및 분산 시스템 설정 명세입니다.`;
    const summaryBlock = `> [!NOTE]\n> **💡 AI 핵심 아키텍처 요약**\n> ${summaryText}\n\n`;
    const updated: NoteItem = {
      ...activeNote,
      content: summaryBlock + current,
      updatedAt: '방금 전'
    };
    onUpdateNote?.(updated, `'${activeNote.title}' 문서 본문에 AI 요약 콜아웃이 생성되었습니다.`);
  };

  const handleAutoBacklinks = () => {
    if (!activeNote) return;
    const existing = new Set((activeNote.connectedNodes || []).map((t) => t.replace(/\[\[|\]\]/g, '').trim().toLowerCase()));
    const toAdd: string[] = [];

    semanticRecommendations.forEach(({ note: rNote }) => {
      if (!existing.has(rNote.title.toLowerCase())) {
        toAdd.push(`[[${rNote.title}]]`);
        existing.add(rNote.title.toLowerCase());
      }
    });

    unlinkedMentions.forEach((uNote) => {
      if (!existing.has(uNote.title.toLowerCase())) {
        toAdd.push(`[[${uNote.title}]]`);
        existing.add(uNote.title.toLowerCase());
      }
    });

    if (toAdd.length === 0) {
      onShowToast('추천할 신규 백링크가 이미 모두 연결되어 있습니다.');
      return;
    }

    const nextConnected = [...(activeNote.connectedNodes || []), ...toAdd];
    const updated: NoteItem = {
      ...activeNote,
      connectedNodes: nextConnected,
      backlinksCount: nextConnected.length,
      updatedAt: '방금 전'
    };
    onUpdateNote?.(updated, `${toAdd.length}개의 연관 문서가 자동 양방향 백링크로 연결되었습니다.`);
  };

  const handleGenerateDiagram = () => {
    if (!activeNote) return;
    const current = activeNote.content || activeNote.excerpt || '';
    if (current.includes('```mermaid')) {
      onShowToast('이미 문서에 Mermaid 다이어그램이 포함되어 있습니다.');
      return;
    }
    const diagramTemplate = `\n\n## 📊 시스템 연계 아키텍처 다이어그램\n\`\`\`mermaid\nflowchart TD\n    Client["사용자 / 클라이언트 요청"] --> Ingress["API Gateway"]\n    Ingress --> Svc["${activeNote.title}"]\n    Svc --> DB["PostgreSQL 16 & pgvector"]\n    Svc --> Cache["Redis 분산 캐시"]\n    Svc -.-> Queue["Kafka 이벤트 스트리밍"]\n\`\`\`\n`;
    const updated: NoteItem = {
      ...activeNote,
      content: current + diagramTemplate,
      updatedAt: '방금 전'
    };
    onUpdateNote?.(updated, `'${activeNote.title}' 문서에 최신 Mermaid 아키텍처 다이어그램이 추가되었습니다.`);
  };

  const handleGenerateToc = () => {
    if (!activeNote) return;
    const current = activeNote.content || activeNote.excerpt || '';
    if (current.includes('📑 목차 구조')) {
      onShowToast('이미 목차 구조가 문서 상단에 포함되어 있습니다.');
      return;
    }
    const headingMatches = Array.from(current.matchAll(/^(#{1,3})\s+(.+)$/gm));
    if (headingMatches.length === 0) {
      onShowToast('문서 내에 추출할 마크다운 헤딩(#) 구조가 없습니다.');
      return;
    }
    const tocItems = headingMatches.map((m) => {
      const level = m[1].length;
      const title = m[2].trim();
      const indent = '  '.repeat(level - 1);
      return `${indent}- [${title}](#${encodeURIComponent(title)})`;
    });
    const tocBlock = `### 📑 목차 구조\n${tocItems.join('\n')}\n\n---\n\n`;
    const updated: NoteItem = {
      ...activeNote,
      content: tocBlock + current,
      updatedAt: '방금 전'
    };
    onUpdateNote?.(updated, '목차 구조가 문서 상단에 정리되었습니다.');
  };

  const handleConnectedNodeClick = (nodeText: string) => {
    const cleanTitle = nodeText.replace(/\[\[|\]\]/g, '').trim().toLowerCase();
    const found = notes.find(
      (n) =>
        n.title.toLowerCase() === cleanTitle ||
        n.title.toLowerCase().includes(cleanTitle) ||
        cleanTitle.includes(n.title.toLowerCase())
    );
    if (found) {
      onSelectNote(found.id);
      onShowToast(`'${found.title}' 문서로 이동했습니다.`);
    } else {
      onShowToast(`'[[${cleanTitle}]]' 문서를 지식 저장소에서 찾을 수 없습니다.`);
    }
  };

  const handleQuickVoice = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      onShowToast('현재 브라우저에서는 Web Speech API 음성 인식이 지원되지 않습니다.');
      return;
    }
    if (isRecording) {
      recognitionRef.current?.stop();
      setIsRecording(false);
      return;
    }
    try {
      const rec = new SpeechRecognition();
      rec.lang = 'ko-KR';
      rec.continuous = false;
      rec.onstart = () => {
        setIsRecording(true);
        onShowToast('음성을 듣고 있습니다. 마이크에 말씀해주세요...');
      };
      rec.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setQuickCaptureText((prev) => (prev ? `${prev} ${transcript}` : transcript));
        onShowToast(`음성 입력 완료: "${transcript}"`);
      };
      rec.onerror = () => {
        setIsRecording(false);
      };
      rec.onend = () => {
        setIsRecording(false);
      };
      recognitionRef.current = rec;
      rec.start();
    } catch {
      onShowToast('음성 인식 시작 중 오류가 발생했습니다.');
    }
  };

  const handleQuickSnippet = () => {
    const snippet = '```typescript\n// 신규 아키텍처 스니펫\ninterface SystemConfig {\n  serviceName: string;\n  version: string;\n}\n```\n';
    setQuickCaptureText((prev) => prev + (prev ? '\n' : '') + snippet);
    onShowToast('코드 스니펫 템플릿이 입력창에 삽입되었습니다.');
  };

  const handleImageSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const imgMd = `\n![${file.name}](local-upload://${file.name})\n`;
      setQuickCaptureText((prev) => prev + (prev ? '\n' : '') + imgMd);
      onShowToast(`'${file.name}' 이미지 참조 마크다운이 추가되었습니다.`);
    }
  };

  const handleShowAllNotes = () => {
    setActiveTag(null);
    setSearchQuery('');
    onClearTagFilter?.();
    onShowToast(`전체 ${notes.length}건의 지식 목록을 표시합니다.`);
  };

  // Dynamic filter pills and metrics derived from real notes
  const dynamicFilterPills = useMemo(() => {
    const tagMap = new Map<string, number>();
    for (const n of notes) {
      for (const t of n.tags || []) {
        const clean = t.startsWith('#') ? t : `#${t}`;
        tagMap.set(clean, (tagMap.get(clean) || 0) + 1);
      }
    }
    const sorted = Array.from(tagMap.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 4)
      .map(([tag]) => tag);

    const colors = ['text-[#d2bbff]', 'text-[#4cd7f6]', 'text-[#4edea3]', 'text-[#ccc3d8]'];
    if (sorted.length === 0) {
      return [
        { label: '#인프라', color: 'text-[#d2bbff]' },
        { label: '#DB', color: 'text-[#4cd7f6]' },
        { label: '#Kafka', color: 'text-[#4edea3]' },
        { label: '#Spring', color: 'text-[#ccc3d8]' }
      ];
    }
    return sorted.map((label, idx) => ({ label, color: colors[idx % colors.length] }));
  }, [notes]);

  const totalNotesCount = notes.length;
  const refinedNotesCount = useMemo(
    () => notes.filter((n) => n.badgeType === 'ai-refined' || n.statusBadge?.includes('정제')).length,
    [notes]
  );
  const totalBacklinksCount = useMemo(
    () => notes.reduce((sum, n) => sum + (n.connectedNodes?.length || 0), 0),
    [notes]
  );

  // Filter notes
  const filteredNotes = notes
    .filter((n) => {
      const matchesSearch =
        n.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        n.excerpt.toLowerCase().includes(searchQuery.toLowerCase()) ||
        n.tags.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase()));
      const matchesTag = activeTag ? n.tags.includes(activeTag) : true;
      return matchesSearch && matchesTag;
    })
    .sort((a, b) => {
      // Sort by updatedAtRaw (ms timestamp) descending — most recent first
      // Fall back to 0 if missing (e.g. before server restart)
      const aTime = a.updatedAtRaw ?? 0;
      const bTime = b.updatedAtRaw ?? 0;
      return bTime - aTime;
    });

  /* -------------------------------------------------------------
     VIEW 1: DETAILED NOTE EDITOR VIEW (Image 7)
  ------------------------------------------------------------- */
  if (activeNote) {
    return (
      <div className="flex flex-col w-full max-w-4xl mx-auto pb-24 animate-in fade-in duration-200">
        {/* Top Navigation & Status Bar */}
        <div className="flex flex-col gap-2 p-4 bg-[#0c0e14]/60 border-b border-[#1f2432] rounded-b-xl">
          <div className="flex items-center justify-between text-xs text-[#958da1]">
            <div className="flex items-center gap-2">
              <button
                onClick={() => onSelectNote(null)}
                className="flex items-center gap-1 text-[#4cd7f6] hover:text-[#acedff] font-medium transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>목록으로</span>
              </button>
              <span className="text-[#4a4455]">•</span>
              <span className="truncate">{activeWorkspace.name}</span>
              <span className="text-[#4a4455]">&gt;</span>
              <span className="text-[#4cd7f6] font-medium truncate">{activeNote.categoryFull}</span>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <span className="flex items-center gap-1 px-2 py-0.5 rounded bg-[#007650]/20 text-[#4edea3] font-mono text-[11px]">
                <span className="w-1.5 h-1.5 rounded-full bg-[#4edea3] animate-pulse"></span>
                {activeNote.statusBadge}
              </span>
              <span className="text-[#958da1] text-[11px] font-mono">{activeNote.updatedAt}</span>
            </div>
          </div>

          {/* Editable Title Row */}
          <div className="flex items-start justify-between gap-3 mt-1">
            {isEditingContent ? (
              <input
                type="text"
                value={editTitleText}
                onChange={(e) => setEditTitleText(e.target.value)}
                className="text-2xl font-bold text-[#e2e2eb] tracking-tight leading-snug flex-1 bg-[#1e1f26] border border-[#7c3aed] rounded-lg px-3 py-1 focus:outline-none focus:ring-1 focus:ring-[#7c3aed]"
                placeholder="문서 제목을 입력하세요"
              />
            ) : (
              <h1 className="text-2xl font-bold text-[#e2e2eb] tracking-tight leading-snug flex-1">
                {activeNote.title}
              </h1>
            )}
            <div className="flex items-center gap-1.5">              {/* Direct Edit & Delete Buttons */}
              {!isEditingContent ? (
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => {
                      setIsEditingContent(true);
                      setEditContentText(activeNote.content || activeNote.excerpt || '');
                      setEditTitleText(activeNote.title);
                    }}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[#282a30] hover:bg-[#33343b] text-[#ccc3d8] hover:text-white text-xs font-mono transition-colors shadow-sm cursor-pointer"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    <span>직접 편집</span>
                  </button>
                  {onDeleteNote && (
                    <button
                      onClick={() => {
                        if (window.confirm(`'${activeNote.title}' 지식 문서를 정말 삭제하시겠습니까?`)) {
                          onDeleteNote(activeNote.id);
                        }
                      }}
                      className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-[#3d1820] hover:bg-[#52202b] text-[#ffb4ab] text-xs font-mono transition-colors shadow-sm cursor-pointer"
                      title="문서 영구 삭제"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>삭제</span>
                    </button>
                  )}
                </div>
              ) : (
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => {
                      if (onUpdateNote) {
                        const updated: NoteItem = {
                          ...activeNote,
                          title: editTitleText.trim() || activeNote.title,
                          content: editContentText,
                          excerpt: editContentText.slice(0, 150) + '...',
                          updatedAt: '방금 전 (사용자 직접 수정)',
                          statusBadge: '수정 완료',
                          wordCount: editContentText.split(/\s+/).filter(Boolean).length
                        };
                        onUpdateNote(updated);
                      }
                      setIsEditingContent(false);
                      onShowToast('문서 내용이 성공적으로 저장 및 갱신되었습니다.');
                    }}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[#007650] hover:bg-[#008f62] text-white text-xs font-mono font-medium transition-colors shadow-sm"
                  >
                    <Save className="w-3.5 h-3.5" />
                    <span>저장</span>
                  </button>
                  <button
                    onClick={() => setIsEditingContent(false)}
                    className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-[#282a30] hover:bg-[#33343b] text-[#958da1] hover:text-[#e2e2eb] text-xs font-mono transition-colors"
                  >
                    <X className="w-3.5 h-3.5" />
                    <span>취소</span>
                  </button>
                </div>
              )}
              <div className="relative">
                <button
                  onClick={() => setIsMoreMenuOpen((prev) => !prev)}
                  className="p-2 rounded-lg bg-[#282a30] hover:bg-[#33343b] text-[#ccc3d8] transition-colors"
                  title="더 보기"
                >
                  <MoreHorizontal className="w-4 h-4" />
                </button>
                {isMoreMenuOpen && (
                  <div className="absolute right-0 top-full mt-1.5 w-44 bg-[#1e1f26] border border-[#2e3547] rounded-xl shadow-2xl p-1 z-50 animate-in fade-in zoom-in-95 duration-150">
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(window.location.href);
                        onShowToast('문서 링크가 클립보드에 복사되었습니다.');
                        setIsMoreMenuOpen(false);
                      }}
                      className="w-full text-left px-3 py-2 text-xs font-mono text-[#ccc3d8] hover:bg-[#282a30] hover:text-[#e2e2eb] rounded-lg flex items-center gap-2 transition-colors"
                    >
                      <Share2 className="w-3.5 h-3.5 text-[#4cd7f6]" />
                      링크 공유
                    </button>
                    <button
                      onClick={() => {
                        const md = activeNote ? (activeNote.content || activeNote.excerpt || '') : '';
                        navigator.clipboard.writeText(md);
                        onShowToast('마크다운 원문이 클립보드에 복사되었습니다.');
                        setIsMoreMenuOpen(false);
                      }}
                      className="w-full text-left px-3 py-2 text-xs font-mono text-[#ccc3d8] hover:bg-[#282a30] hover:text-[#e2e2eb] rounded-lg flex items-center gap-2 transition-colors"
                    >
                      <Copy className="w-3.5 h-3.5 text-[#4edea3]" />
                      마크다운 복사
                    </button>
                    {onDeleteNote && activeNote && (
                      <button
                        onClick={() => {
                          setIsMoreMenuOpen(false);
                          if (window.confirm(`'${activeNote.title}' 문서를 삭제하시겠습니까?`)) {
                            onDeleteNote(activeNote.id);
                          }
                        }}
                        className="w-full text-left px-3 py-2 text-xs font-mono text-[#ffb4ab] hover:bg-[#3d1820] rounded-lg flex items-center gap-2 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        문서 삭제
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* AI Quick Action Floating Toolbar */}
        <div className="sticky top-14 z-20 px-4 py-2 bg-[#111319]/95 backdrop-blur-md border-b border-[#1f2432] shadow-md">
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-0.5">
            <button
              onClick={handleAiSummary}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#7c3aed] text-white text-xs font-medium shadow-sm hover:bg-[#6d28d9] transition-transform active:scale-95 shrink-0 cursor-pointer"
              title="현재 문서의 핵심 요약 콜아웃을 생성하여 본문에 삽입"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>AI 요약</span>
            </button>
            <button
              onClick={handleAutoBacklinks}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#282a30] hover:bg-[#33343b] text-[#4cd7f6] text-xs font-mono shrink-0 transition-transform active:scale-95 cursor-pointer"
              title="추천 연관 문서들을 분석하여 양방향 백링크 자동 연결"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>자동 양방향 링크</span>
            </button>
            <button
              onClick={handleGenerateDiagram}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#282a30] hover:bg-[#33343b] text-[#ccc3d8] text-xs font-mono shrink-0 transition-transform active:scale-95 cursor-pointer"
              title="아키텍처 토폴로지 Mermaid 다이어그램을 생성하여 본문에 삽입"
            >
              <Workflow className="w-3.5 h-3.5" />
              <span>다이어그램 생성</span>
            </button>
            <button
              onClick={handleGenerateToc}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#282a30] hover:bg-[#33343b] text-[#ccc3d8] text-xs font-mono shrink-0 transition-transform active:scale-95 cursor-pointer"
              title="본문 헤딩을 파싱하여 목차 블록 자동 삽입"
            >
              <ListTree className="w-3.5 h-3.5" />
              <span>표/목차 정리</span>
            </button>
          </div>
        </div>

        {/* Content Body Canvas */}
        <div className="p-4 sm:p-6 space-y-6">
          {/* Bento: Meta Properties */}
          <div className="p-3.5 rounded-xl bg-[#191b22] border border-[#2e3547] space-y-2.5">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs text-[#958da1]">
              <div className="flex items-center gap-2">
                <span className="w-16 shrink-0">작성자</span>
                <div className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-[#1e1f26] text-[#e2e2eb] font-mono">
                  <span className="w-3.5 h-3.5 rounded-full bg-[#7c3aed] text-white flex items-center justify-center text-[9px]">
                    P
                  </span>
                  <span>{activeNote.author || 'Platform Architect'}</span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="w-16 shrink-0">태그</span>
                <div className="flex flex-wrap gap-1">
                  {activeNote.tags.map((t) => (
                    <span
                      key={t}
                      className="px-2 py-0.5 rounded bg-[#282a30] text-[#d2bbff] font-mono text-[11px]"
                    >
                      {t}
                    </span>
                  ))}
                </div>
              </div>

              <div className="flex items-start gap-2">
                <span className="w-16 shrink-0 mt-0.5">연계 노드</span>
                <div className="flex flex-wrap items-center gap-1.5 flex-1">
                  {(activeNote.connectedNodes && activeNote.connectedNodes.length > 0
                    ? activeNote.connectedNodes
                    : ['[[결제 모듈 v2]]']
                  ).map((node) => (
                    <div
                      key={node}
                      onClick={() => handleConnectedNodeClick(node)}
                      className="flex items-center gap-1 px-2 py-0.5 rounded bg-[#1e1f26] text-[#4cd7f6] font-mono text-[11px] cursor-pointer hover:bg-[#282a30] hover:text-[#acedff] transition-colors border border-[#2e3547]"
                      title="해당 연결 문서로 바로 이동"
                    >
                      <LinkIcon className="w-3 h-3" />
                      <span>{node}</span>
                    </div>
                  ))}
                  <button
                    onClick={handleAddBacklink}
                    className="flex items-center gap-1 px-2 py-0.5 rounded bg-[#282a30] hover:bg-[#33343b] text-[#ccc3d8] hover:text-white font-mono text-[11px] transition-colors"
                  >
                    <Plus className="w-3 h-3 text-[#4edea3]" />
                    <span>노드 추가</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Smart Connection Hub: Alternative Ways of Connecting Notes */}
          <div className="rounded-xl bg-[#191b22] border border-[#2e3547] p-4 space-y-4 shadow-md">
            <div className="flex items-center justify-between pb-2 border-b border-[#2e3547]/60">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-[#7c3aed]" />
                <h3 className="text-xs font-mono font-semibold uppercase tracking-wider text-[#e2e2eb]">
                  스마트 지식 연결 허브 (Smart Connection Hub)
                </h3>
              </div>
              <span className="text-[10px] font-mono text-[#958da1]">
                수동 타이핑 외 2가지 자동 연결 지원
              </span>
            </div>

            {/* Sub-section 1: AI Semantic Similarity Auto-Links */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-xs font-mono text-[#4edea3]">
                  <Zap className="w-3.5 h-3.5" />
                  <span className="font-semibold">1. AI 임베딩 시맨틱 추천 연결 (Semantic Links)</span>
                </div>
                <span className="text-[11px] font-mono text-[#958da1]">기술 스택 & 맥락 기반</span>
              </div>

              {semanticRecommendations.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {semanticRecommendations.map(({ note: rNote, score, sharedTags }) => (
                    <div
                      key={rNote.id}
                      className="flex items-center justify-between p-2.5 rounded-lg bg-[#14151b] border border-[#2e3547] hover:border-[#4edea3]/40 transition-colors"
                    >
                      <div className="min-w-0 flex-1 mr-2">
                        <div className="flex items-center gap-1.5">
                          <span
                            onClick={() => onSelectNote(rNote.id)}
                            className="text-xs font-medium text-[#e2e2eb] hover:text-[#4edea3] cursor-pointer truncate font-mono"
                          >
                            [[{rNote.title}]]
                          </span>
                          <span className="px-1.5 py-0.2 rounded text-[10px] font-mono bg-[#007650]/20 text-[#4edea3] shrink-0 border border-[#007650]/40">
                            {score}% 유사
                          </span>
                        </div>
                        <div className="text-[10px] text-[#958da1] truncate mt-0.5">
                          {sharedTags.length > 0
                            ? `공유: ${sharedTags.map((t) => `#${t}`).join(' ')}`
                            : `도메인: ${rNote.categoryFull}`}
                        </div>
                      </div>
                      <button
                        onClick={() => {
                          const newLink = `[[${rNote.title}]]`;
                          const updatedNodes = [...(activeNote.connectedNodes || []), newLink];
                          if (onUpdateNote) {
                            onUpdateNote(
                              {
                                ...activeNote,
                                connectedNodes: updatedNodes,
                                backlinksCount: updatedNodes.length
                              },
                              `'${rNote.title}' 문서가 AI 시맨틱 백링크로 즉시 연결되었습니다.`
                            );
                          }
                        }}
                        className="flex items-center gap-1 px-2 py-1 rounded bg-[#282a30] hover:bg-[#383a45] text-[#4edea3] text-[11px] font-mono transition-colors shrink-0"
                      >
                        <Plus className="w-3 h-3" />
                        <span>원클릭 연결</span>
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-2.5 rounded-lg bg-[#14151b] border border-[#232630] text-xs font-mono text-[#958da1]">
                  현재 문서와 연관된 모든 고유사도 문서가 이미 연결되어 있습니다.
                </div>
              )}
            </div>

            {/* Sub-section 2: Unlinked Mentions Detection */}
            <div className="space-y-2 pt-2 border-t border-[#2e3547]/50">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-xs font-mono text-[#e0b6ff]">
                  <Link2 className="w-3.5 h-3.5" />
                  <span className="font-semibold">2. 언링크드 멘션 탐지 (Unlinked Mentions)</span>
                </div>
                <span className="px-1.5 py-0.5 rounded-full text-[10px] font-mono bg-[#282a30] text-[#ccc3d8]">
                  {unlinkedMentions.length}건 감지됨
                </span>
              </div>

              {unlinkedMentions.length > 0 ? (
                <div className="space-y-1.5">
                  {unlinkedMentions.map((uNote) => (
                    <div
                      key={uNote.id}
                      className="flex items-center justify-between p-2 rounded-lg bg-[#14151b] border border-[#232630] text-xs font-mono"
                    >
                      <div className="min-w-0 flex-1 mr-2">
                        <div className="flex items-center gap-2">
                          <span
                            onClick={() => onSelectNote(uNote.id)}
                            className="text-[#e2e2eb] hover:text-[#e0b6ff] cursor-pointer font-medium truncate"
                          >
                            {uNote.title}
                          </span>
                          <span className="text-[10px] text-[#958da1]">
                            본문 내 일반 텍스트로 언급됨
                          </span>
                        </div>
                      </div>
                      <button
                        onClick={() => {
                          const newLink = `[[${uNote.title}]]`;
                          const updatedNodes = [...(activeNote.connectedNodes || []), newLink];
                          if (onUpdateNote) {
                            onUpdateNote(
                              {
                                ...activeNote,
                                connectedNodes: updatedNodes,
                                backlinksCount: updatedNodes.length
                              },
                              `'${uNote.title}' 멘션이 정식 백링크로 승격되었습니다.`
                            );
                          }
                        }}
                        className="flex items-center gap-1 px-2.5 py-1 rounded bg-[#282a30] hover:bg-[#383a45] text-[#e0b6ff] text-[11px] font-mono transition-colors shrink-0"
                      >
                        <Link2 className="w-3 h-3" />
                        <span>백링크로 승격</span>
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-2.5 rounded-lg bg-[#14151b] border border-[#232630] text-xs font-mono text-[#958da1]">
                  본문 내에 `[[ ]]` 없이 언급된 미연결 문서가 없습니다. (모든 키워드 정합성 일치)
                </div>
              )}
            </div>
          </div>

          {/* Context Markdown Text Block / Direct Editor */}
          {isEditingContent ? (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs font-mono text-[#958da1]">
                <span className="flex items-center gap-1.5 text-[#4cd7f6]">
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>마크다운 본문 편집 모드 (Markdown & SQL Supported)</span>
                </span>
                <span>{editContentText.length} 자</span>
              </div>
              <textarea
                value={editContentText}
                onChange={(e) => setEditContentText(e.target.value)}
                rows={16}
                className="w-full p-4 rounded-xl bg-[#0c0e14] border border-[#7c3aed] text-xs font-mono text-[#e2e2eb] leading-relaxed focus:outline-none focus:ring-1 focus:ring-[#7c3aed] resize-y"
                placeholder="마크다운 형식으로 내용을 입력하세요 (예: # 제목, [[백링크]], 코드 블록 등)"
              />
            </div>
          ) : activeNote.content ? (
            <div className="space-y-4">
              <div className="p-4 sm:p-6 rounded-xl bg-[#0c0e14] border border-[#2e3547] text-[#e2e2eb] leading-relaxed overflow-x-auto max-h-[540px]">
                <MarkdownRenderer
                  content={activeNote.content}
                  notes={notes}
                  onSelectNote={onSelectNote}
                />
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <h2 className="text-lg font-semibold text-[#e2e2eb] flex items-center gap-2">
                <span className="text-[#7c3aed]">#</span> {activeNote.title}
              </h2>
              <MarkdownRenderer
                content={activeNote.excerpt}
                notes={notes}
                onSelectNote={onSelectNote}
              />
            </div>
          )}

          {/* Code Block with Syntax Highlighting & Line numbers */}
          {activeNote.codeSnippet && (
            <div className="rounded-xl overflow-hidden bg-[#0c0e14] border border-[#2e3547] shadow-lg">
              {/* Header */}
              <div className="flex items-center justify-between px-3.5 py-2 bg-[#282a30] border-b border-[#33343b]">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#ffb4ab]"></span>
                  <span className="w-2.5 h-2.5 rounded-full bg-[#4cd7f6]"></span>
                  <span className="w-2.5 h-2.5 rounded-full bg-[#4edea3]"></span>
                  <span className="text-xs font-mono font-medium text-[#e2e2eb] ml-1">
                    {activeNote.codeSnippet.filename}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-mono text-[#958da1]">
                    {activeNote.codeSnippet.language}
                  </span>
                  <button
                    onClick={() => handleCopyCode(activeNote.codeSnippet!.code)}
                    className="flex items-center gap-1 px-2 py-1 rounded bg-[#1e1f26] hover:bg-[#33343b] text-[#ccc3d8] text-xs transition-colors"
                    title="코드 복사"
                  >
                    {copiedCode ? <Check className="w-3.5 h-3.5 text-[#4edea3]" /> : <Copy className="w-3.5 h-3.5" />}
                    <span className="text-[11px]">{copiedCode ? '복사됨' : '복사'}</span>
                  </button>
                </div>
              </div>

              {/* Code lines */}
              <div className="p-4 font-mono text-xs leading-relaxed overflow-x-auto text-[#e2e2eb]">
                <pre className="m-0 p-0">
                  <code>{activeNote.codeSnippet.code}</code>
                </pre>
              </div>
            </div>
          )}

          {/* Architecture Topology Diagram or Dynamic Mermaid Workflow */}
          {activeNote.id === 'note-sys-arch-spec' ? (
            <ArchitectureDiagram />
          ) : (() => {
            const diagramData = getMermaidChartForNote(activeNote);
            if (diagramData) {
              return (
                <MermaidRenderer
                  chart={diagramData.chart}
                  title={diagramData.title}
                />
              );
            }
            return null;
          })()}
        </div>

        {/* Bottom Floating Stats & AI Re-refine Bar */}
        <div className="sticky bottom-4 z-30 px-4 mt-6 pointer-events-none">
          <div className="max-w-2xl mx-auto pointer-events-auto flex items-center justify-between gap-3 p-2.5 rounded-xl bg-[#282a30]/95 backdrop-blur-lg border border-[#33343b] shadow-2xl">
            <div className="flex items-center gap-3 px-2 text-xs font-mono text-[#ccc3d8]">
              <div>
                <span className="text-[#958da1]">단어: </span>
                <span className="text-[#e2e2eb] font-semibold">{activeNote.wordCount}</span>
              </div>
              <div>
                <span className="text-[#958da1]">자수: </span>
                <span className="text-[#e2e2eb] font-semibold">{activeNote.charCount || activeNote.content?.length || 0}</span>
              </div>
              <div className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-[#4cd7f6]" />
                <span className="text-[#e2e2eb]">{activeNote.readTime || '3분 읽기'}</span>
              </div>
            </div>

            <button
              onClick={handleReRefine}
              disabled={isReRefining}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#7c3aed] hover:bg-[#6d28d9] text-white text-xs font-medium shadow-md transition-transform active:scale-95 disabled:opacity-50"
            >
              <RotateCcw className={`w-3.5 h-3.5 ${isReRefining ? 'animate-spin' : ''}`} />
              <span>{isReRefining ? '재정제 중...' : 'AI 재정제 요청'}</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  /* -------------------------------------------------------------
     VIEW 2: NOTES DASHBOARD & REPOSITORY (Image 5)
  ------------------------------------------------------------- */
  return (
    <div className="flex flex-col w-full pb-24 space-y-6">
      {/* Ambient Gradient Glow Banner */}
      <div className="relative p-4 sm:p-6 bg-gradient-to-b from-[#191b22] to-[#111319] border-b border-[#1f2432] space-y-4 overflow-hidden">
        <div className="absolute -top-16 -right-12 w-64 h-64 bg-[#7c3aed]/15 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute top-24 -left-16 w-52 h-52 bg-[#4cd7f6]/10 rounded-full blur-2xl pointer-events-none"></div>

        {/* Search & Command Input */}
        <div className="relative z-10 w-full">
          <div className="w-full bg-[#191b22] border border-[#2e3547] rounded-xl p-2.5 flex items-center gap-2.5 focus-within:border-[#4cd7f6] transition-colors shadow-md">
            <Search className="w-4 h-4 text-[#4cd7f6] ml-1 shrink-0" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="#태그, @멘션 검색, AI 자연어 탐색 지원..."
              className="bg-transparent border-none outline-none text-xs sm:text-sm text-[#e2e2eb] placeholder:text-[#958da1] w-full min-w-0"
            />
            <kbd className="px-1.5 py-0.5 rounded bg-[#282a30] text-[#958da1] text-[10px] font-mono shrink-0">
              ⌘K
            </kbd>
          </div>

          {/* Quick Filter Pills */}
          <div className="flex items-center gap-1.5 mt-2.5 overflow-x-auto no-scrollbar py-0.5">
            {activeTag && (
              <button
                onClick={() => {
                  setActiveTag(null);
                  if (onClearTagFilter) onClearTagFilter();
                }}
                className="flex items-center gap-1 px-2 py-1 rounded-full bg-[#3d1820] border border-[#ffb4ab]/40 text-[#ffb4ab] text-xs font-mono shrink-0 hover:bg-[#52202b] transition-colors"
                title="필터 초기화"
              >
                <span>✕ 초기화 ({activeTag})</span>
              </button>
            )}
            {dynamicFilterPills.map((pill) => (
              <button
                key={pill.label}
                onClick={() => {
                  if (activeTag === pill.label) {
                    setActiveTag(null);
                    if (onClearTagFilter) onClearTagFilter();
                  } else {
                    setActiveTag(pill.label);
                  }
                }}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-full border text-xs font-mono transition-colors shrink-0 ${
                  activeTag === pill.label
                    ? 'bg-[#7c3aed] text-white border-[#7c3aed]'
                    : `bg-[#1e1f26] border-[#2e3547] ${pill.color} hover:bg-[#282a30]`
                }`}
              >
                <span>{pill.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Omni Quick Capture Slate (Living Markdown Input) */}
        <div className="relative z-10 w-full bg-[#1e1f26] border border-[#2e3547] rounded-xl p-4 flex flex-col gap-2.5 shadow-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#4edea3] animate-pulse shadow-[0_0_8px_rgba(78,222,163,0.8)]"></span>
              <span className="text-xs font-mono uppercase tracking-wider text-[#ccc3d8]">
                Omni Quick Capture
              </span>
            </div>
            <span className="text-[11px] font-mono text-[#4cd7f6] flex items-center gap-1">
              <Zap className="w-3 h-3" /> AI 자동 노드 연결
            </span>
          </div>

          <textarea
            value={quickCaptureText}
            onChange={(e) => setQuickCaptureText(e.target.value)}
            rows={2}
            placeholder="날것의 생각이나 코드를 입력하세요... AI가 자동 분류합니다."
            className="w-full bg-[#191b22] border border-[#2e3547]/80 rounded-lg p-3 text-xs sm:text-sm text-[#e2e2eb] placeholder:text-[#958da1] outline-none resize-none focus:border-[#7c3aed] transition-colors"
          />

          <div className="flex items-center justify-between pt-1">
            <div className="flex items-center gap-1.5">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageSelected}
                className="hidden"
              />
              <button
                onClick={handleQuickVoice}
                className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${
                  isRecording
                    ? 'bg-[#ffb4ab] text-[#690005] animate-pulse'
                    : 'bg-[#191b22] hover:bg-[#282a30] text-[#958da1] hover:text-[#4cd7f6]'
                }`}
                title={isRecording ? '음성 녹음 중지' : '음성 메모 녹음 (Web Speech API)'}
              >
                <Mic className="w-4 h-4" />
              </button>
              <button
                onClick={handleQuickSnippet}
                className="w-8 h-8 rounded-lg bg-[#191b22] hover:bg-[#282a30] text-[#958da1] hover:text-[#d2bbff] flex items-center justify-center transition-colors"
                title="코드 스니펫 서식 삽입"
              >
                <Code2 className="w-4 h-4" />
              </button>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="w-8 h-8 rounded-lg bg-[#191b22] hover:bg-[#282a30] text-[#958da1] hover:text-[#4edea3] flex items-center justify-center transition-colors"
                title="사진/스크린샷 첨부 (마크다운 이미지 삽입)"
              >
                <Camera className="w-4 h-4" />
              </button>
            </div>

            <button
              onClick={handleQuickCapture}
              disabled={isCapturing}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-[#7c3aed] hover:bg-[#6d28d9] text-white text-xs font-semibold shadow-md active:scale-95 transition-all disabled:opacity-50 cursor-pointer"
            >
              <Sparkles className={`w-3.5 h-3.5 ${isCapturing ? 'animate-spin' : ''}`} />
              <span>{isCapturing ? '정제중...' : '정제 저장'}</span>
            </button>
          </div>
        </div>

        {/* Telemetry Metrics Widget (3 Cards) */}
        <div className="relative z-10 grid grid-cols-3 gap-2.5">
          <div className="bg-[#191b22] border border-[#2e3547] rounded-xl p-3 flex flex-col justify-between shadow-sm">
            <div className="flex items-center justify-between">
              <Clock className="w-4 h-4 text-[#4cd7f6]" />
              <span className="text-[10px] font-mono text-[#03b5d3] bg-[#282a30] px-1 py-0.5 rounded">
                실시간
              </span>
            </div>
            <div className="mt-2">
              <div className="text-xl sm:text-2xl font-bold text-[#e2e2eb]">
                {totalNotesCount}<span className="text-xs text-[#958da1] font-normal ml-0.5">개</span>
              </div>
              <p className="text-[11px] text-[#958da1] mt-0.5 truncate">최근 동기화 노트</p>
            </div>
          </div>

          <div className="bg-[#191b22] border border-[#2e3547] rounded-xl p-3 flex flex-col justify-between shadow-sm">
            <div className="flex items-center justify-between">
              <Sparkles className="w-4 h-4 text-[#d2bbff]" />
              <span className="text-[10px] font-mono text-[#4edea3] bg-[#282a30] px-1 py-0.5 rounded">
                정제완료
              </span>
            </div>
            <div className="mt-2">
              <div className="text-xl sm:text-2xl font-bold text-[#d2bbff]">
                {refinedNotesCount}<span className="text-xs text-[#958da1] font-normal ml-0.5">건</span>
              </div>
              <p className="text-[11px] text-[#958da1] mt-0.5 truncate">AI 자동 정제 완료</p>
            </div>
          </div>

          <div className="bg-[#191b22] border border-[#2e3547] rounded-xl p-3 flex flex-col justify-between shadow-sm">
            <div className="flex items-center justify-between">
              <Layers className="w-4 h-4 text-[#4edea3]" />
              <span className="text-[10px] font-mono text-[#d2bbff] bg-[#282a30] px-1 py-0.5 rounded">
                토폴로지
              </span>
            </div>
            <div className="mt-2">
              <div className="text-xl sm:text-2xl font-bold text-[#e2e2eb]">
                {totalBacklinksCount}<span className="text-xs text-[#958da1] font-normal ml-0.5">개</span>
              </div>
              <p className="text-[11px] text-[#958da1] mt-0.5 truncate">지식망 연결 노드</p>
            </div>
          </div>
        </div>
      </div>

      {/* Pinned Knowledge Spaces Carousel */}
      <section className="px-4 sm:px-6 space-y-2.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Pin className="w-4 h-4 text-[#d2bbff]" />
            <h2 className="text-sm font-semibold text-[#e2e2eb]">고정 및 활성 스페이스</h2>
          </div>
          <span className="text-xs font-mono text-[#958da1]">
            {(workspaces && workspaces.length > 0 ? workspaces : [activeWorkspace]).length}개 활성
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {(workspaces && workspaces.length > 0 ? workspaces.slice(0, 3) : [activeWorkspace]).map((sp) => (
            <div
              key={sp.id || sp.name}
              onClick={() => {
                onSelectWorkspace?.(sp);
                onShowToast(`'${sp.name}' 스페이스로 전환되었습니다.`);
              }}
              className="bg-[#191b22] hover:bg-[#1e1f26] border border-[#2e3547] hover:border-[#4cd7f6]/50 rounded-xl p-3 flex flex-col justify-between shadow-md cursor-pointer transition-all group"
              title={`${sp.name} 공간으로 즉시 전환`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-lg">{sp.icon}</span>
                  <div className="flex flex-col">
                    <span className="text-xs font-semibold text-[#e2e2eb] group-hover:text-[#4cd7f6] transition-colors">
                      {sp.name}
                    </span>
                    <span className="text-[10px] font-mono text-[#958da1]">{sp.path}</span>
                  </div>
                </div>
                <span className="w-2 h-2 rounded-full bg-[#4cd7f6] shadow-[0_0_6px_rgba(76,215,246,0.6)]"></span>
              </div>
              <div className="mt-3 flex items-center justify-between pt-2 border-t border-[#2e3547]/50 text-[10px] font-mono">
                <div className="flex items-center gap-1.5">
                  <span className="px-1.5 py-0.5 rounded bg-[#282a30] text-[#4cd7f6]">문서 {sp.docCount}</span>
                  <span className="px-1.5 py-0.5 rounded bg-[#282a30] text-[#4edea3]">노드 {sp.nodeCount}</span>
                </div>
                <span className="text-[#958da1]">{sp.syncPercent}% 동기화</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Recent Notes Stream */}
      <section className="px-4 sm:px-6 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-[#4cd7f6]" />
            <h2 className="text-sm font-semibold text-[#e2e2eb]">최근 업데이트된 지식</h2>
          </div>
          <button
            onClick={handleShowAllNotes}
            className="text-xs font-mono text-[#958da1] hover:text-[#d2bbff] transition-colors flex items-center gap-0.5 cursor-pointer"
            title="모든 검색어 및 태그 필터를 해제하고 전체 목록 표시"
          >
            <span>전체보기</span>
            <ArrowRight className="w-3 h-3" />
          </button>
        </div>

        <div className="space-y-3">
          {filteredNotes.map((note) => (
            <article
              key={note.id}
              onClick={() => onSelectNote(note.id)}
              className="w-full bg-[#191b22] hover:bg-[#1e1f26] border border-[#2e3547] rounded-xl p-4 shadow-md flex flex-col gap-2.5 transition-all cursor-pointer group"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded bg-[#282a30] text-[#4cd7f6] text-[11px] font-mono font-semibold uppercase">
                    {note.category}
                  </span>
                  <span className="text-[11px] font-mono text-[#958da1]">{note.updatedAt}</span>
                </div>

                <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#7c3aed]/20 text-[#d2bbff] text-[11px] font-mono shadow-[0_0_12px_rgba(210,187,255,0.15)]">
                  <Sparkles className="w-3 h-3" />
                  <span>{note.statusBadge}</span>
                </div>
              </div>

              <div className="flex flex-col">
                <h3 className="text-sm font-semibold text-[#e2e2eb] group-hover:text-[#4cd7f6] transition-colors">
                  {note.title}
                </h3>
                <p className="text-xs text-[#958da1] mt-1 line-clamp-2 leading-relaxed">
                  {note.excerpt}
                </p>
              </div>

              <div className="flex items-center justify-between pt-1 border-t border-[#2e3547]/50">
                <div className="flex items-center gap-1.5 flex-wrap">
                  {note.tags.map((t) => (
                    <span
                      key={t}
                      className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[#282a30] text-[#ccc3d8]"
                    >
                      {t}
                    </span>
                  ))}
                </div>

                <div className="flex items-center gap-3 text-[11px] font-mono text-[#958da1]">
                  <span className="flex items-center gap-1">
                    <BookOpen className="w-3.5 h-3.5" />
                    {note.wordCount.toLocaleString()}단어
                  </span>
                  <span className="flex items-center gap-1 text-[#d2bbff]">
                    <LinkIcon className="w-3.5 h-3.5" />
                    {note.backlinksCount} 역링크
                  </span>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
};
