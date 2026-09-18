import React, { useState } from 'react';
import {
  Network,
  RotateCcw,
  Plus,
  Minus,
  Sliders,
  Bookmark,
  ExternalLink,
  Sparkles,
  Link2,
  ChevronRight,
  FileText,
  Layers,
  Zap,
  Tag
} from 'lucide-react';
import { GraphNode, GraphLink, NoteItem } from '../../types';

interface GraphViewProps {
  nodes: GraphNode[];
  links: GraphLink[];
  notes?: NoteItem[];
  onOpenDocument: (noteId: string) => void;
  onUpdateNote?: (note: NoteItem, toastMsg?: string) => void;
  onShowToast: (msg: string) => void;
}

export const GraphView: React.FC<GraphViewProps> = ({
  nodes,
  links,
  notes = [],
  onOpenDocument,
  onUpdateNote,
  onShowToast
}) => {
  const [selectedNodeId, setSelectedNodeId] = useState<string>('center');
  const [is3D, setIs3D] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(1.0);
  const [depthLevel, setDepthLevel] = useState(2);
  const [activeCategoryFilter, setActiveCategoryFilter] = useState<string | null>(null);
  const [connectionMode, setConnectionMode] = useState<'all' | 'explicit' | 'semantic' | 'cluster'>('all');
  const [inspectorTab, setInspectorTab] = useState<'backlinks' | 'semantic' | 'unlinked'>('backlinks');
  const [isBookmarked, setIsBookmarked] = useState(false);

  const selectedNode = nodes.find((n) => n.id === selectedNodeId) || nodes[0];

  const handleZoomIn = () => {
    setZoomLevel((prev) => Math.min(prev + 0.15, 1.8));
  };

  const handleZoomOut = () => {
    setZoomLevel((prev) => Math.max(prev - 0.15, 0.7));
  };

  const handleResetCluster = () => {
    setZoomLevel(1.0);
    setIs3D(false);
    setSelectedNodeId('center');
    onShowToast('그래프 중심 클러스터가 재정렬되었습니다.');
  };

  // Connected backlinks data
  const backlinks = [
    {
      id: 'node-sys-arch-spec',
      title: '[[시스템 아키텍처 & DB 설계]]',
      category: 'DB & RAG',
      tag: 'Core Spec',
      dotColor: 'bg-[#d2bbff]'
    },
    {
      id: 'rds',
      title: '[[AWS RDS]]',
      category: '데이터베이스',
      tag: 'Primary DB',
      dotColor: 'bg-[#4edea3]'
    },
    {
      id: 'kafka',
      title: '[[Kafka 클러스터]]',
      category: '인프라',
      tag: 'Event Stream',
      dotColor: 'bg-[#d2bbff]'
    },
    {
      id: 'toss',
      title: '[[토스페이먼츠 API]]',
      category: '외부 연계',
      tag: 'PG 연동',
      dotColor: 'bg-[#ffb4ab]'
    }
  ];

  // AI Semantic Recommended Links for Graph
  const semanticTies = [
    {
      id: 'sem-1',
      title: '[[분산 트랜잭션 코디네이터]]',
      category: '인프라',
      similarity: '96% 일치',
      reason: 'Saga 패턴 보상 트랜잭션 의존성'
    },
    {
      id: 'sem-2',
      title: '[[주문 결제 웹훅 처리기]]',
      category: '연계',
      similarity: '91% 일치',
      reason: '토스페이먼츠 비동기 이벤트 핸들링'
    },
    {
      id: 'sem-3',
      title: '[[PostgreSQL 인덱스 튜닝]]',
      category: 'DB',
      similarity: '87% 일치',
      reason: '주문 테이블 쿼리 지연 최적화'
    }
  ];

  // Unlinked mentions in other docs
  const graphUnlinkedMentions = [
    {
      id: 'unlinked-1',
      docTitle: '배포 파이프라인 v2 가이드',
      snippet: '...해당 서비스는 주문 모듈 v2의 상태 전이를 감지하여...',
      targetLink: '[[주문 모듈 v2]]'
    },
    {
      id: 'unlinked-2',
      docTitle: '장애 대응 SOP (결제 지연)',
      snippet: '...Kafka 클러스터 랙 발생 시 결제 모듈의 타임아웃 설정을...',
      targetLink: '[[Kafka 클러스터]]'
    }
  ];

  return (
    <div className="flex flex-col w-full pb-24 select-none relative overflow-hidden animate-in fade-in duration-200">
      {/* Top Header Bar */}
      <div className="px-4 py-3 bg-[#0c0e14]/70 border-b border-[#1f2432] flex items-center justify-between z-20">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-[#191b22] border border-[#2e3547] text-[#4cd7f6] flex items-center justify-center">
            <Network className="w-4 h-4" />
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-[#e2e2eb]">지식 그래프</span>
              <span className="px-1.5 py-0.5 rounded-full bg-[#03b5d3]/20 border border-[#03b5d3]/40 text-[#4cd7f6] font-mono text-[10px]">
                LIVE
              </span>
            </div>
            <span className="text-[11px] font-mono text-[#958da1]">
              148개 노드 • 312개 양방향 링크
            </span>
          </div>
        </div>

        <button
          onClick={handleResetCluster}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#191b22] hover:bg-[#282a30] border border-[#2e3547] text-xs font-mono text-[#ccc3d8] transition-colors shadow-sm"
        >
          <RotateCcw className="w-3.5 h-3.5 text-[#d2bbff]" />
          <span>중심 재정렬</span>
        </button>
      </div>

      {/* Category Legend & Connection Mode Bar */}
      <div className="px-4 py-2 bg-[#111319] border-b border-[#1f2432] flex flex-wrap items-center justify-between gap-2 z-10">
        {/* Connection Mode Pill Selector */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
          <span className="text-[11px] font-mono text-[#958da1] mr-1 flex items-center gap-1">
            <Layers className="w-3 h-3 text-[#4cd7f6]" /> 연결 방식:
          </span>
          {[
            { id: 'all', label: '모든 연결' },
            { id: 'explicit', label: '📌 명시적 백링크' },
            { id: 'semantic', label: '🧠 AI 시맨틱 추천' },
            { id: 'cluster', label: '🏷️ 태그 클러스터' }
          ].map((mode) => (
            <button
              key={mode.id}
              onClick={() => {
                setConnectionMode(mode.id as any);
                onShowToast(`그래프 연결 모드: ${mode.label}(으)로 필터링`);
              }}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-mono transition-all shrink-0 ${
                connectionMode === mode.id
                  ? 'bg-[#7c3aed] text-white font-medium shadow-sm'
                  : 'bg-[#191b22] text-[#958da1] hover:text-[#e2e2eb] border border-[#2e3547]'
              }`}
            >
              <span>{mode.label}</span>
            </button>
          ))}
        </div>

        {/* Category Filters */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
          {[
            { id: 'infra', label: '인프라', color: '#d2bbff' },
            { id: 'code', label: '소스코드', color: '#4cd7f6' },
            { id: 'db', label: '데이터베이스', color: '#4edea3' },
            { id: 'workflow', label: '워크플로우', color: '#acedff' },
            { id: 'external', label: '외부 연계', color: '#ffb4ab' }
          ].map((cat) => (
            <button
              key={cat.id}
              onClick={() => {
                setActiveCategoryFilter(activeCategoryFilter === cat.id ? null : cat.id);
              }}
              className={`flex items-center gap-1.5 px-2 py-0.5 rounded-full border text-[11px] font-mono transition-all shrink-0 ${
                activeCategoryFilter === cat.id
                  ? 'bg-[#282a30] text-[#e2e2eb] border-[#e2e2eb]'
                  : 'bg-[#191b22] text-[#ccc3d8] border-[#2e3547] hover:bg-[#1e1f26]'
              }`}
            >
              <span
                className="w-1.5 h-1.5 rounded-full shadow-sm"
                style={{ backgroundColor: cat.color }}
              ></span>
              <span>{cat.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Main Interactive Graph Canvas Container */}
      <div className="relative w-full h-[450px] sm:h-[500px] bg-[#0c0e14] overflow-hidden">
        {/* Ambient Radial Glows */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(124,58,237,0.18)_0%,transparent_50%)] pointer-events-none"></div>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_75%_35%,rgba(76,215,246,0.12)_0%,transparent_40%)] pointer-events-none"></div>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_65%,rgba(78,222,163,0.1)_0%,transparent_45%)] pointer-events-none"></div>

        {/* SVG Canvas */}
        <svg
          className="w-full h-full cursor-grab active:cursor-grabbing transition-transform duration-300 ease-out"
          style={{
            transform: is3D
              ? `perspective(600px) rotateX(25deg) scale(${zoomLevel})`
              : `scale(${zoomLevel})`
          }}
          viewBox="0 0 400 400"
        >
          <defs>
            <linearGradient id="edge-code-db" x1="50%" y1="50%" x2="78%" y2="68%">
              <stop offset="0%" stopColor="#4cd7f6" stopOpacity="0.8" />
              <stop offset="100%" stopColor="#4edea3" stopOpacity="0.8" />
            </linearGradient>
            <linearGradient id="edge-code-infra" x1="50%" y1="50%" x2="28%" y2="34%">
              <stop offset="0%" stopColor="#4cd7f6" stopOpacity="0.85" />
              <stop offset="100%" stopColor="#d2bbff" stopOpacity="0.85" />
            </linearGradient>
            <linearGradient id="edge-code-ext" x1="50%" y1="50%" x2="80%" y2="32%">
              <stop offset="0%" stopColor="#4cd7f6" stopOpacity="0.9" />
              <stop offset="100%" stopColor="#ffb4ab" stopOpacity="0.9" />
            </linearGradient>

            <filter id="glow-cyan" x="-30%" y="-30%" width="160%" height="160%">
              <feGaussianBlur stdDeviation="3.5" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
            <filter id="glow-violet" x="-30%" y="-30%" width="160%" height="160%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
            <filter id="glow-green" x="-30%" y="-30%" width="160%" height="160%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* Background Tag Cluster Mesh */}
          {(connectionMode === 'all' || connectionMode === 'cluster') && (
            <g opacity="0.45" stroke="#2e3547" strokeDasharray="3,3" strokeWidth="0.8">
              <line x1="110" y1="135" x2="60" y2="210" />
              <line x1="60" y1="210" x2="135" y2="295" />
              <line x1="310" y1="270" x2="330" y2="185" />
              <line x1="320" y1="128" x2="275" y2="85" />
              <line x1="110" y1="135" x2="180" y2="70" />
            </g>
          )}

          {/* Explicit User Backlinks (Solid Lines) */}
          {(connectionMode === 'all' || connectionMode === 'explicit') && (
            <g strokeLinecap="round">
              <line x1="200" y1="200" x2="110" y2="135" stroke="url(#edge-code-infra)" strokeWidth="2.4" opacity="0.95" />
              <line x1="200" y1="200" x2="145" y2="285" stroke="url(#edge-code-infra)" strokeWidth="2" opacity="0.85" />
              <line x1="200" y1="200" x2="310" y2="270" stroke="url(#edge-code-db)" strokeWidth="2.4" opacity="0.95" />
              <line x1="200" y1="200" x2="320" y2="128" stroke="url(#edge-code-ext)" strokeWidth="2.4" opacity="0.95" />
              <line x1="200" y1="200" x2="70" y2="230" stroke="#acedff" strokeWidth="1.8" opacity="0.75" />
              <line x1="200" y1="200" x2="260" y2="75" stroke="#acedff" strokeWidth="1.8" opacity="0.75" />
              <line x1="200" y1="200" x2="190" y2="60" stroke="#d2bbff" strokeWidth="2.2" strokeDasharray="4,2" opacity="0.95" />
            </g>
          )}

          {/* AI Semantic Similarity Links (Dashed Neon Green/Cyan with similarity tags) */}
          {(connectionMode === 'all' || connectionMode === 'semantic') && (
            <g strokeLinecap="round">
              {/* Semantic link 1: DB Spec <-> RDS */}
              <line x1="190" y1="60" x2="310" y2="270" stroke="#4edea3" strokeWidth="2" strokeDasharray="5,4" opacity="0.9" filter="url(#glow-green)" />
              <rect x="236" y="152" width="48" height="15" rx="3" fill="#0c0e14" stroke="#4edea3" strokeWidth="0.8" />
              <text x="260" y="163" fill="#4edea3" fontFamily="JetBrains Mono" fontSize="8" textAnchor="middle" fontWeight="bold">
                96% 시맨틱
              </text>

              {/* Semantic link 2: Kafka <-> Toss API */}
              <line x1="110" y1="135" x2="320" y2="128" stroke="#4cd7f6" strokeWidth="1.8" strokeDasharray="4,4" opacity="0.85" filter="url(#glow-cyan)" />
              <rect x="200" y="122" width="46" height="15" rx="3" fill="#0c0e14" stroke="#4cd7f6" strokeWidth="0.8" />
              <text x="223" y="133" fill="#4cd7f6" fontFamily="JetBrains Mono" fontSize="8" textAnchor="middle" fontWeight="bold">
                91% 시맨틱
              </text>

              {/* Semantic link 3: Center <-> Workflow */}
              <line x1="200" y1="200" x2="230" y2="330" stroke="#4edea3" strokeWidth="1.8" strokeDasharray="4,3" opacity="0.85" />
              <rect x="204" y="258" width="46" height="15" rx="3" fill="#0c0e14" stroke="#4edea3" strokeWidth="0.8" />
              <text x="227" y="269" fill="#4edea3" fontFamily="JetBrains Mono" fontSize="8" textAnchor="middle">
                87% 시맨틱
              </text>
            </g>
          )}

          {/* Outer Connected Nodes */}
          {/* System Architecture & DB Spec */}
          <g
            className="cursor-pointer group"
            transform="translate(190,60)"
            onClick={() => {
              setSelectedNodeId('node-sys-arch-spec');
              onShowToast('시스템 아키텍처 & DB 설계 노드가 선택되었습니다.');
            }}
          >
            <circle r="15" fill="#191b22" stroke="#7c3aed" strokeWidth="1.5" />
            <circle r="10" fill="#d2bbff" filter="url(#glow-violet)" opacity="0.95" />
            <circle r="4" fill="#25005a" />
            <text x="0" y="-18" textAnchor="middle" fill="#d2bbff" fontFamily="JetBrains Mono" fontSize="10" fontWeight="600">
              시스템 아키텍처 & DB
            </text>
          </g>

          {/* AWS RDS */}
          <g
            className="cursor-pointer group"
            transform="translate(310,270)"
            onClick={() => {
              setSelectedNodeId('rds');
              onShowToast('AWS RDS 노드가 선택되었습니다.');
            }}
          >
            <circle r="14" fill="#191b22" stroke="#2e3547" />
            <circle r="9" fill="#4edea3" filter="url(#glow-cyan)" opacity="0.9" />
            <circle r="4" fill="#0c0e14" />
            <text x="0" y="24" textAnchor="middle" fill="#e2e2eb" fontFamily="JetBrains Mono" fontSize="10">
              AWS RDS
            </text>
          </g>

          {/* Kafka */}
          <g
            className="cursor-pointer group"
            transform="translate(110,135)"
            onClick={() => {
              setSelectedNodeId('kafka');
              onShowToast('Kafka 클러스터 노드가 선택되었습니다.');
            }}
          >
            <circle r="15" fill="#191b22" stroke="#2e3547" />
            <circle r="10" fill="#d2bbff" filter="url(#glow-violet)" opacity="0.9" />
            <circle r="4.5" fill="#25005a" />
            <text x="0" y="-18" textAnchor="middle" fill="#e2e2eb" fontFamily="JetBrains Mono" fontSize="10">
              Kafka 클러스터
            </text>
          </g>

          {/* Toss Payments */}
          <g
            className="cursor-pointer group"
            transform="translate(320,128)"
            onClick={() => {
              setSelectedNodeId('toss');
              onShowToast('토스페이먼츠 API 노드가 선택되었습니다.');
            }}
          >
            <circle r="13" fill="#191b22" stroke="#2e3547" />
            <circle r="8.5" fill="#ffb4ab" opacity="0.95" />
            <circle r="4" fill="#690005" />
            <text x="0" y="-16" textAnchor="middle" fill="#e2e2eb" fontFamily="JetBrains Mono" fontSize="10">
              토스페이먼츠 API
            </text>
          </g>

          {/* K8s Pod */}
          <g
            className="cursor-pointer group"
            transform="translate(145,285)"
            onClick={() => setSelectedNodeId('k8s-pod')}
          >
            <circle r="11" fill="#191b22" stroke="#2e3547" />
            <circle r="7" fill="#d2bbff" opacity="0.85" />
            <text x="0" y="20" textAnchor="middle" fill="#ccc3d8" fontFamily="JetBrains Mono" fontSize="9">
              K8s Core Pod
            </text>
          </g>

          {/* Redis Cache */}
          <g
            className="cursor-pointer group"
            transform="translate(230,330)"
            onClick={() => setSelectedNodeId('redis')}
          >
            <circle r="10" fill="#191b22" stroke="#2e3547" />
            <circle r="6" fill="#4edea3" opacity="0.85" />
            <text x="0" y="18" textAnchor="middle" fill="#ccc3d8" fontFamily="JetBrains Mono" fontSize="9">
              Redis 캐시
            </text>
          </g>

          {/* SOP 취소흐름 */}
          <g
            className="cursor-pointer group"
            transform="translate(70,230)"
            onClick={() => setSelectedNodeId('sop')}
          >
            <circle r="10" fill="#191b22" stroke="#2e3547" />
            <circle r="6.5" fill="#acedff" opacity="0.85" />
            <text x="0" y="18" textAnchor="middle" fill="#ccc3d8" fontFamily="JetBrains Mono" fontSize="9">
              SOP 취소흐름
            </text>
          </g>

          {/* 정산 배치 v1 */}
          <g
            className="cursor-pointer group"
            transform="translate(260,75)"
            onClick={() => setSelectedNodeId('settlement')}
          >
            <circle r="10" fill="#191b22" stroke="#2e3547" />
            <circle r="6.5" fill="#acedff" opacity="0.85" />
            <text x="0" y="-14" textAnchor="middle" fill="#ccc3d8" fontFamily="JetBrains Mono" fontSize="9">
              정산 배치 v1
            </text>
          </g>

          {/* Dimmed peripheral nodes */}
          <circle cx="60" cy="210" r="4.5" fill="#958da1" opacity="0.5" />
          <circle cx="180" cy="70" r="4" fill="#958da1" opacity="0.4" />
          <circle cx="275" cy="85" r="5" fill="#958da1" opacity="0.5" />
          <circle cx="330" cy="185" r="4" fill="#958da1" opacity="0.35" />

          {/* Center Selected Node: 결제 트랜잭션 엔진 */}
          <g
            id="center-node"
            transform="translate(200,200)"
            className="cursor-pointer"
            onClick={() => setSelectedNodeId('center')}
          >
            {/* Ripple Pulse Rings */}
            <circle
              r="34"
              fill="none"
              stroke="#4cd7f6"
              strokeWidth="1"
              opacity="0.3"
              className="animate-ping"
              style={{ animationDuration: '3s' }}
            />
            <circle r="26" fill="#4cd7f6" fillOpacity="0.12" />
            <circle r="20" fill="#191b22" stroke="#4cd7f6" strokeWidth="1.5" />
            <circle r="13" fill="#4cd7f6" filter="url(#glow-cyan)" />
            <circle r="6" fill="#003640" />
            <text
              x="0"
              y="-32"
              textAnchor="middle"
              fill="#acedff"
              fontFamily="JetBrains Mono"
              fontSize="11"
              fontWeight="600"
            >
              결제 트랜잭션 엔진
            </text>
            <text
              x="0"
              y="38"
              textAnchor="middle"
              fill="#4cd7f6"
              fontFamily="JetBrains Mono"
              fontSize="9"
              fontWeight="500"
            >
              SELECTED NODE
            </text>
          </g>
        </svg>

        {/* Floating Controls Toolbar */}
        <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between pointer-events-auto">
          {/* 2D / 3D Mode Toggle */}
          <div className="flex items-center p-0.5 rounded-lg bg-[#191b22]/90 backdrop-blur-md border border-[#2e3547] shadow-md">
            <button
              onClick={() => setIs3D(false)}
              className={`px-2.5 py-1 rounded text-xs font-mono font-medium transition-colors ${
                !is3D ? 'bg-[#4cd7f6] text-[#001f26] font-bold' : 'text-[#958da1] hover:text-[#e2e2eb]'
              }`}
            >
              2D
            </button>
            <button
              onClick={() => setIs3D(true)}
              className={`px-2.5 py-1 rounded text-xs font-mono font-medium transition-colors ${
                is3D ? 'bg-[#4cd7f6] text-[#001f26] font-bold' : 'text-[#958da1] hover:text-[#e2e2eb]'
              }`}
            >
              3D
            </button>
          </div>

          {/* Depth and Zoom Controls */}
          <div className="flex items-center gap-1 p-0.5 rounded-lg bg-[#191b22]/90 backdrop-blur-md border border-[#2e3547] shadow-md">
            <button
              onClick={() => setDepthLevel((prev) => (prev === 3 ? 1 : prev + 1))}
              className="flex items-center px-2 py-1 gap-1 text-[#958da1] hover:text-[#4cd7f6] text-xs font-mono"
              title="검색 Depth 변경"
            >
              <Layers className="w-3.5 h-3.5" />
              <span>D:{depthLevel}</span>
            </button>
            <div className="h-3 w-px bg-[#2e3547]"></div>
            <button
              onClick={handleZoomIn}
              className="w-7 h-7 flex items-center justify-center rounded hover:bg-[#282a30] text-[#e2e2eb]"
              title="확대"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={handleZoomOut}
              className="w-7 h-7 flex items-center justify-center rounded hover:bg-[#282a30] text-[#e2e2eb]"
              title="축소"
            >
              <Minus className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Filter Trigger */}
          <button
            onClick={() => onShowToast('현재 카테고리 필터가 정상 적용되어 있습니다.')}
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[#191b22]/90 backdrop-blur-md border border-[#2e3547] text-xs font-mono text-[#e2e2eb] shadow-md hover:bg-[#282a30]"
          >
            <Sliders className="w-3.5 h-3.5 text-[#d2bbff]" />
            <span>필터</span>
          </button>
        </div>
      </div>

      {/* Bottom Sliding Inspector Sheet (Obsidian Mobile / PC Rail Style) */}
      <div className="w-full bg-[#191b22] border-t border-[#2e3547] px-4 pt-3 pb-6 shadow-2xl relative z-20">
        {/* Grab Handle */}
        <div className="w-10 h-1 bg-[#33343b] rounded-full mx-auto mb-3"></div>

        {/* Inspector Header */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex flex-col min-w-0">
            <div className="flex items-center gap-2 mb-0.5">
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-[#4cd7f6]/15 text-[#4cd7f6] font-mono text-[11px]">
                <span className="w-1.5 h-1.5 rounded-full bg-[#4cd7f6]"></span>
                {selectedNode.category || '지식 노드'}
              </span>
              <span className="text-[11px] font-mono text-[#958da1]">
                {selectedNode.id === 'node-sys-arch-spec' ? 'v1.0-RAG' : 'v2.4.1-rc'}
              </span>
            </div>
            <h2 className="text-xl font-bold text-[#e2e2eb] tracking-tight truncate">
              {selectedNode.label}
            </h2>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <button
              onClick={() => {
                setIsBookmarked(!isBookmarked);
                onShowToast(isBookmarked ? '북마크가 해제되었습니다.' : '노드가 북마크되었습니다.');
              }}
              className={`w-8 h-8 rounded-lg border border-[#2e3547] flex items-center justify-center transition-colors ${
                isBookmarked ? 'bg-[#7c3aed] text-white' : 'bg-[#1e1f26] text-[#958da1] hover:text-[#e2e2eb]'
              }`}
            >
              <Bookmark className="w-4 h-4" />
            </button>
            <button
              onClick={() => onOpenDocument(selectedNode.noteId || (selectedNode.id === 'node-sys-arch-spec' ? 'note-sys-arch-spec' : 'note-saga'))}
              className="w-8 h-8 rounded-lg bg-[#1e1f26] border border-[#2e3547] flex items-center justify-center text-[#958da1] hover:text-[#e2e2eb] hover:bg-[#282a30] transition-colors"
              title="문서 열기"
            >
              <ExternalLink className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* AI Telemetry Context Insight */}
        <div className="p-3.5 rounded-xl bg-[#1e1f26] border border-[#2e3547] mb-3.5 shadow-sm">
          <div className="flex items-center justify-between mb-1.5">
            <div className="flex items-center gap-1.5 text-[#d2bbff]">
              <Sparkles className="w-4 h-4" />
              <span className="text-xs font-mono font-medium">AI 그래프 통찰</span>
            </div>
            <span className="text-[11px] font-mono text-[#4edea3]">신뢰도 98%</span>
          </div>
          <p className="text-xs text-[#ccc3d8] leading-relaxed">
            최근 3일간 인프라 변경(v2.4)과 가장 강하게 결합된 핵심 노드입니다.{' '}
            <span className="text-[#4cd7f6] font-mono">#Kafka-v3</span> 마이그레이션 시 2개의
            종속 백엔드 워크플로우 재검증이 권장됩니다.
          </p>
        </div>

        {/* Connection Inspector Tabs */}
        <div className="space-y-2 mb-4">
          <div className="flex items-center gap-2 border-b border-[#2e3547] pb-1.5 overflow-x-auto no-scrollbar">
            <button
              onClick={() => setInspectorTab('backlinks')}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-mono transition-colors shrink-0 ${
                inspectorTab === 'backlinks'
                  ? 'bg-[#282a30] text-[#e2e2eb] font-semibold border border-[#3e4559]'
                  : 'text-[#958da1] hover:text-[#ccc3d8]'
              }`}
            >
              <Link2 className="w-3.5 h-3.5 text-[#4cd7f6]" />
              <span>연결된 백링크 ({backlinks.length})</span>
            </button>
            <button
              onClick={() => setInspectorTab('semantic')}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-mono transition-colors shrink-0 ${
                inspectorTab === 'semantic'
                  ? 'bg-[#282a30] text-[#4edea3] font-semibold border border-[#007650]/50'
                  : 'text-[#958da1] hover:text-[#4edea3]'
              }`}
            >
              <Zap className="w-3.5 h-3.5 text-[#4edea3]" />
              <span>AI 시맨틱 추천 ({semanticTies.length})</span>
            </button>
            <button
              onClick={() => setInspectorTab('unlinked')}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-mono transition-colors shrink-0 ${
                inspectorTab === 'unlinked'
                  ? 'bg-[#282a30] text-[#d2bbff] font-semibold border border-[#7c3aed]/50'
                  : 'text-[#958da1] hover:text-[#d2bbff]'
              }`}
            >
              <Tag className="w-3.5 h-3.5 text-[#d2bbff]" />
              <span>언링크드 멘션 ({graphUnlinkedMentions.length})</span>
            </button>
          </div>

          {/* Tab 1: Connected Backlinks */}
          {inspectorTab === 'backlinks' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
              {backlinks.map((b) => (
                <div
                  key={b.id}
                  onClick={() => {
                    setSelectedNodeId(b.id);
                    onShowToast(`${b.title} 노드로 초점이 이동되었습니다.`);
                  }}
                  className="flex items-center justify-between p-2.5 rounded-lg bg-[#1e1f26] hover:bg-[#282a30] border border-[#2e3547] transition-colors cursor-pointer group"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span className={`w-2 h-2 rounded-full ${b.dotColor} shrink-0`}></span>
                    <span className="text-xs font-mono text-[#e2e2eb] truncate">{b.title}</span>
                  </div>
                  <div className="flex items-center gap-1 text-[#958da1] group-hover:text-[#e2e2eb] shrink-0 text-[10px] font-mono">
                    <span>{b.tag}</span>
                    <ChevronRight className="w-3 h-3" />
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Tab 2: AI Semantic Recommended Ties */}
          {inspectorTab === 'semantic' && (
            <div className="space-y-2">
              <div className="text-[11px] font-mono text-[#958da1] flex items-center justify-between">
                <span>벡터 유사도 기반 추천 연결 (사용자가 직접 타이핑하지 않아도 AI가 탐지)</span>
                <span className="text-[#4edea3]">HNSW 코사인 유사도</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                {semanticTies.map((s) => (
                  <div
                    key={s.id}
                    className="flex flex-col justify-between p-2.5 rounded-lg bg-[#14151b] border border-[#2e3547] hover:border-[#4edea3]/40 transition-colors"
                  >
                    <div>
                      <div className="flex items-center justify-between gap-1 mb-1">
                        <span className="text-xs font-mono text-[#e2e2eb] font-semibold truncate">
                          {s.title}
                        </span>
                        <span className="px-1.5 py-0.2 rounded text-[10px] font-mono bg-[#007650]/20 text-[#4edea3] shrink-0 border border-[#007650]/40">
                          {s.similarity}
                        </span>
                      </div>
                      <p className="text-[10px] text-[#958da1] line-clamp-2 leading-relaxed mb-2">
                        {s.reason}
                      </p>
                    </div>
                    <button
                      onClick={() => {
                        onShowToast(`'${s.title}' 문서가 AI 시맨틱 연결로 그래프에 바인딩되었습니다.`);
                      }}
                      className="flex items-center justify-center gap-1 w-full py-1 rounded bg-[#282a30] hover:bg-[#33343b] text-[#4edea3] text-[11px] font-mono font-medium transition-colors"
                    >
                      <Plus className="w-3 h-3" />
                      <span>원클릭 연결</span>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Tab 3: Unlinked Mentions */}
          {inspectorTab === 'unlinked' && (
            <div className="space-y-2">
              <div className="text-[11px] font-mono text-[#958da1]">
                다른 문서 본문에서 [[...]] 없이 언급된 비공식 참조 목록
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {graphUnlinkedMentions.map((u) => (
                  <div
                    key={u.id}
                    className="flex items-center justify-between p-2.5 rounded-lg bg-[#14151b] border border-[#232630] text-xs font-mono"
                  >
                    <div className="min-w-0 flex-1 mr-2">
                      <div className="text-[#d2bbff] font-semibold truncate">{u.docTitle}</div>
                      <p className="text-[10px] text-[#958da1] truncate mt-0.5">{u.snippet}</p>
                    </div>
                    <button
                      onClick={() => {
                        onShowToast(`'${u.targetLink}' 키워드가 정식 백링크로 승격되어 연결되었습니다.`);
                      }}
                      className="px-2.5 py-1 rounded bg-[#282a30] hover:bg-[#383a45] text-[#d2bbff] text-[10px] font-mono transition-colors shrink-0 flex items-center gap-1"
                    >
                      <Link2 className="w-3 h-3" />
                      <span>백링크 승격</span>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Primary Action Buttons */}
        <div className="grid grid-cols-2 gap-3 pt-1">
          <button
            onClick={() => onOpenDocument(selectedNode?.noteId || 'note-saga')}
            className="flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg bg-[#7c3aed] hover:bg-[#6d28d9] text-white font-semibold text-xs transition-all shadow-md active:scale-98"
          >
            <FileText className="w-4 h-4" />
            <span>문서 열기</span>
          </button>
          <button
            onClick={() => onShowToast('링크 관계 편집 창이 열렸습니다.')}
            className="flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg bg-[#282a30] hover:bg-[#33343b] text-[#e2e2eb] font-semibold text-xs transition-all active:scale-98 border border-[#33343b]"
          >
            <Link2 className="w-4 h-4 text-[#4cd7f6]" />
            <span>링크 관계 편집</span>
          </button>
        </div>
      </div>
    </div>
  );
};
