import React, { useState, useMemo, useRef } from 'react';
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
  Tag,
  Share2,
  Check
} from 'lucide-react';
import { GraphNode, GraphLink, NoteItem } from '../../types';

interface GraphViewProps {
  nodes?: GraphNode[];
  links?: GraphLink[];
  notes?: NoteItem[];
  onOpenDocument: (noteId: string) => void;
  onUpdateNote?: (note: NoteItem, toastMsg?: string) => void;
  onShowToast: (msg: string) => void;
}

export const GraphView: React.FC<GraphViewProps> = ({
  notes = [],
  onOpenDocument,
  onUpdateNote,
  onShowToast
}) => {
  const [selectedNodeId, setSelectedNodeId] = useState<string>('');
  const [is3D, setIs3D] = useState(false);
  const [tilt, setTilt] = useState<{ rx: number; ry: number }>({ rx: 25, ry: 0 });
  const [zoomLevel, setZoomLevel] = useState(1.0);
  const [depthLevel, setDepthLevel] = useState(2);
  const [activeCategoryFilter, setActiveCategoryFilter] = useState<string | null>(null);
  const [connectionMode, setConnectionMode] = useState<'all' | 'explicit' | 'semantic' | 'cluster'>('all');
  const [inspectorTab, setInspectorTab] = useState<'backlinks' | 'semantic' | 'unlinked'>('backlinks');
  const [bookmarkedIds, setBookmarkedIds] = useState<Set<string>>(() => {
    try {
      return new Set(JSON.parse(localStorage.getItem('bookmarked_note_ids') || '[]'));
    } catch {
      return new Set();
    }
  });

  // Drag-to-Link wiring state
  const [dragSourceId, setDragSourceId] = useState<string | null>(null);
  const [dragPos, setDragPos] = useState<{ x: number; y: number } | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  // Determine center note
  const centerNote = useMemo(() => {
    if (notes.length === 0) return null;
    if (selectedNodeId) {
      const found = notes.find((n) => n.id === selectedNodeId);
      if (found) return found;
    }
    return notes.find((n) => n.isPinned) || notes[0];
  }, [notes, selectedNodeId]);

  // Set initial selectedNodeId if empty
  React.useEffect(() => {
    if (!selectedNodeId && centerNote) {
      setSelectedNodeId(centerNote.id);
    }
  }, [centerNote, selectedNodeId]);

  // Dynamic layout: calculate positions for all notes in a 2.5D radial topology
  const dynamicGraph = useMemo(() => {
    if (notes.length === 0) {
      return { nodes: [], links: [], semanticLinks: [] };
    }

    const cId = centerNote ? centerNote.id : notes[0].id;
    const centerPos = { x: 200, y: 200 };

    // Separate center note, direct neighbors, and outer notes
    const otherNotes = notes.filter((n) => n.id !== cId);
    const count = otherNotes.length;

    const graphNodes: (GraphNode & { note: NoteItem })[] = [];

    // Add center node
    const cNote = notes.find((n) => n.id === cId) || notes[0];
    const getCat = (cat: string): 'infra' | 'code' | 'db' | 'workflow' | 'external' => {
      if (cat === '인프라') return 'infra';
      if (cat === 'DB') return 'db';
      if (cat === '소스코드') return 'code';
      if (cat === '연계') return 'external';
      return 'workflow';
    };

    graphNodes.push({
      id: cNote.id,
      label: cNote.title,
      sublabel: 'SELECTED NODE',
      category: getCat(cNote.category),
      x: centerPos.x,
      y: centerPos.y,
      radius: 20,
      isCenter: true,
      noteId: cNote.id,
      note: cNote
    });

    // Arrange other nodes evenly in orbits
    otherNotes.forEach((n, idx) => {
      const angle = (idx / Math.max(1, count)) * 2 * Math.PI - Math.PI / 2;
      // Stagger radius slightly for organic visual feel
      const baseRadius = idx % 2 === 0 ? 115 : 145;
      const x = Math.round(centerPos.x + baseRadius * Math.cos(angle));
      const y = Math.round(centerPos.y + baseRadius * Math.sin(angle));

      graphNodes.push({
        id: n.id,
        label: n.title,
        sublabel: n.categoryFull,
        category: getCat(n.category),
        x: Math.max(45, Math.min(355, x)),
        y: Math.max(45, Math.min(355, y)),
        radius: 14,
        isCenter: false,
        noteId: n.id,
        note: n
      });
    });

    // Build explicit links based on connectedNodes or content wikilinks
    const explicitLinks: { source: string; target: string; sx: number; sy: number; tx: number; ty: number }[] = [];
    const semanticLinks: { source: string; target: string; sx: number; sy: number; tx: number; ty: number; score: number }[] = [];

    const nodeMap = new Map(graphNodes.map((gn) => [gn.id, gn]));
    const titleMap = new Map(graphNodes.map((gn) => [gn.label.trim().toLowerCase(), gn]));

    notes.forEach((sourceNote) => {
      const sourceNode = nodeMap.get(sourceNote.id);
      if (!sourceNode) return;

      const rawLinks = (sourceNote.connectedNodes || []).map((t) =>
        t.replace(/\[\[|\]\]/g, '').trim().toLowerCase()
      );

      rawLinks.forEach((targetTitle) => {
        const targetNode = titleMap.get(targetTitle);
        if (targetNode && targetNode.id !== sourceNode.id) {
          explicitLinks.push({
            source: sourceNode.id,
            target: targetNode.id,
            sx: sourceNode.x,
            sy: sourceNode.y,
            tx: targetNode.x,
            ty: targetNode.y
          });
        }
      });

      // Find semantic links based on shared tags
      const sourceTags = (sourceNote.tags || []).map((t) => t.toLowerCase().replace('#', ''));
      notes.forEach((targetNote) => {
        if (targetNote.id <= sourceNote.id) return; // avoid duplicate pairs
        const targetNode = nodeMap.get(targetNote.id);
        if (!targetNode) return;

        const targetTags = (targetNote.tags || []).map((t) => t.toLowerCase().replace('#', ''));
        const shared = sourceTags.filter((t) => targetTags.includes(t));
        if (shared.length >= 1) {
          const score = Math.min(99, 70 + shared.length * 10);
          semanticLinks.push({
            source: sourceNode.id,
            target: targetNode.id,
            sx: sourceNode.x,
            sy: sourceNode.y,
            tx: targetNode.x,
            ty: targetNode.y,
            score
          });
        }
      });
    });

    // Filter by depthLevel (1 = 1-hop direct neighbors, 2 = 2-hop, 3 = all)
    let filteredNodes = graphNodes;
    let filteredExplicit = explicitLinks;
    let filteredSemantic = semanticLinks;

    if (depthLevel < 3 && cId) {
      const hops = new Map<string, number>();
      hops.set(cId, 0);
      const queue: string[] = [cId];

      const adj = new Map<string, Set<string>>();
      notes.forEach((n) => adj.set(n.id, new Set()));
      explicitLinks.forEach((l) => {
        adj.get(l.source)?.add(l.target);
        adj.get(l.target)?.add(l.source);
      });
      semanticLinks.forEach((l) => {
        adj.get(l.source)?.add(l.target);
        adj.get(l.target)?.add(l.source);
      });

      while (queue.length > 0) {
        const curr = queue.shift()!;
        const currDist = hops.get(curr)!;
        if (currDist < depthLevel) {
          adj.get(curr)?.forEach((nbr) => {
            if (!hops.has(nbr)) {
              hops.set(nbr, currDist + 1);
              queue.push(nbr);
            }
          });
        }
      }

      filteredNodes = graphNodes.filter((gn) => hops.has(gn.id));
      const allowedIds = new Set(filteredNodes.map((n) => n.id));
      filteredExplicit = explicitLinks.filter(
        (l) => allowedIds.has(l.source) && allowedIds.has(l.target)
      );
      filteredSemantic = semanticLinks.filter(
        (l) => allowedIds.has(l.source) && allowedIds.has(l.target)
      );
    }

    return { nodes: filteredNodes, links: filteredExplicit, semanticLinks: filteredSemantic };
  }, [notes, centerNote, depthLevel]);

  const activeNote = centerNote;

  // Real Backlinks for the selected note
  const dynamicBacklinks = useMemo(() => {
    if (!activeNote) return [];
    const activeTitle = activeNote.title.toLowerCase();

    return notes
      .filter((n) => {
        if (n.id === activeNote.id) return false;
        const links = (n.connectedNodes || []).map((t) => t.replace(/\[\[|\]\]/g, '').trim().toLowerCase());
        const hasLink = links.includes(activeTitle);
        const inContent = (n.content || '').toLowerCase().includes(`[[${activeTitle}]]`);
        return hasLink || inContent;
      })
      .map((n) => ({
        id: n.id,
        title: `[[${n.title}]]`,
        category: n.categoryFull,
        tag: n.tags[0] || n.category,
        dotColor:
          n.category === 'DB'
            ? 'bg-[#4edea3]'
            : n.category === '인프라'
            ? 'bg-[#d2bbff]'
            : n.category === '연계'
            ? 'bg-[#ffb4ab]'
            : 'bg-[#4cd7f6]'
      }));
  }, [activeNote, notes]);

  // Real Semantic Recommendations for the selected note
  const dynamicSemanticTies = useMemo(() => {
    if (!activeNote) return [];
    const currentTags = (activeNote.tags || []).map((t) => t.toLowerCase().replace('#', ''));
    const connectedTitles = (activeNote.connectedNodes || []).map((t) =>
      t.replace(/\[\[|\]\]/g, '').trim().toLowerCase()
    );

    return notes
      .filter((n) => {
        if (n.id === activeNote.id) return false;
        if (connectedTitles.includes(n.title.toLowerCase())) return false;
        return true;
      })
      .map((n) => {
        const otherTags = (n.tags || []).map((t) => t.toLowerCase().replace('#', ''));
        const shared = currentTags.filter((t) => otherTags.includes(t));
        const sameCategory = n.category === activeNote.category;
        const score = Math.min(98, 65 + shared.length * 12 + (sameCategory ? 15 : 0));
        return {
          id: n.id,
          note: n,
          title: `[[${n.title}]]`,
          category: n.category,
          similarity: `${score}% 일치`,
          reason: shared.length > 0 ? `공유 태그: #${shared.join(', #')}` : `${n.categoryFull} 연관 아키텍처`
        };
      })
      .filter((item) => parseInt(item.similarity) >= 70)
      .sort((a, b) => parseInt(b.similarity) - parseInt(a.similarity))
      .slice(0, 4);
  }, [activeNote, notes]);

  // Real Unlinked Mentions for the selected note
  const dynamicUnlinkedMentions = useMemo(() => {
    if (!activeNote) return [];
    const activeTitle = activeNote.title.toLowerCase();
    const connectedTitles = (activeNote.connectedNodes || []).map((t) =>
      t.replace(/\[\[|\]\]/g, '').trim().toLowerCase()
    );

    return notes
      .filter((n) => {
        if (n.id === activeNote.id) return false;
        if (connectedTitles.includes(n.title.toLowerCase())) return false;
        const contentLower = (n.content || n.excerpt || '').toLowerCase();
        // Mentioned without [[ ]]
        return contentLower.includes(activeTitle) && !contentLower.includes(`[[${activeTitle}]]`);
      })
      .map((n) => {
        const content = n.content || n.excerpt || '';
        const idx = content.toLowerCase().indexOf(activeTitle);
        const snippet = content.slice(Math.max(0, idx - 20), Math.min(content.length, idx + activeTitle.length + 25));
        return {
          id: n.id,
          docTitle: n.title,
          snippet: `...${snippet}...`,
          targetLink: `[[${activeNote.title}]]`
        };
      });
  }, [activeNote, notes]);

  // Connect link helper
  const handleConnectNodes = (sourceNote: NoteItem, targetNoteTitle: string) => {
    if (!onUpdateNote) return;
    const cleanTitle = targetNoteTitle.replace(/\[\[|\]\]/g, '').trim();
    const existing = sourceNote.connectedNodes || [];
    if (existing.some((t) => t.replace(/\[\[|\]\]/g, '').trim().toLowerCase() === cleanTitle.toLowerCase())) {
      onShowToast('이미 연결되어 있는 노드입니다.');
      return;
    }

    const updatedNote: NoteItem = {
      ...sourceNote,
      connectedNodes: [...existing, `[[${cleanTitle}]]`],
      backlinksCount: (sourceNote.backlinksCount || 0) + 1,
      content: sourceNote.content ? `${sourceNote.content}\n\n- 연관 참조: [[${cleanTitle}]]` : sourceNote.content
    };

    onUpdateNote(updatedNote, `"${sourceNote.title}"와 "${cleanTitle}" 간에 백링크가 연결되었습니다.`);
  };

  // Drag-to-Link wiring handlers
  const handleStartWireDrag = (nodeId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setDragSourceId(nodeId);
    if (svgRef.current) {
      const rect = svgRef.current.getBoundingClientRect();
      const scaleX = 400 / rect.width;
      const scaleY = 400 / rect.height;
      setDragPos({
        x: (e.clientX - rect.left) * scaleX,
        y: (e.clientY - rect.top) * scaleY
      });
    }
  };

  const handleSvgMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    if (!svgRef.current) return;
    const rect = svgRef.current.getBoundingClientRect();

    if (is3D) {
      const mouseNormX = (e.clientX - rect.left) / rect.width - 0.5;
      const mouseNormY = (e.clientY - rect.top) / rect.height - 0.5;
      setTilt({
        rx: Math.round(25 - mouseNormY * 24),
        ry: Math.round(mouseNormX * 30)
      });
    }

    if (dragSourceId) {
      const scaleX = 400 / rect.width;
      const scaleY = 400 / rect.height;
      setDragPos({
        x: (e.clientX - rect.left) * scaleX,
        y: (e.clientY - rect.top) * scaleY
      });
    }
  };

  const handleSvgMouseUp = () => {
    setDragSourceId(null);
    setDragPos(null);
  };

  const handleNodeDrop = (targetNodeId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!dragSourceId || dragSourceId === targetNodeId) {
      setDragSourceId(null);
      setDragPos(null);
      return;
    }

    const sNote = notes.find((n) => n.id === dragSourceId);
    const tNote = notes.find((n) => n.id === targetNodeId);

    if (sNote && tNote) {
      handleConnectNodes(sNote, tNote.title);
    }
    setDragSourceId(null);
    setDragPos(null);
  };

  const handleZoomIn = () => setZoomLevel((prev) => Math.min(prev + 0.15, 1.8));
  const handleZoomOut = () => setZoomLevel((prev) => Math.max(prev - 0.15, 0.7));

  const handleResetCluster = () => {
    setZoomLevel(1.0);
    setIs3D(false);
    if (notes.length > 0) {
      setSelectedNodeId(notes[0].id);
    }
    onShowToast('그래프 중심 클러스터가 재정렬되었습니다.');
  };

  const dragSourceNode = dragSourceId ? dynamicGraph.nodes.find((n) => n.id === dragSourceId) : null;

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
              <span className="text-sm font-semibold text-[#e2e2eb]">지식 그래프 토폴로지</span>
              <span className="px-1.5 py-0.5 rounded-full bg-[#03b5d3]/20 border border-[#03b5d3]/40 text-[#4cd7f6] font-mono text-[10px]">
                {notes.length}개 노드 연동
              </span>
            </div>
            <span className="text-[11px] text-[#958da1]">
              PostgreSQL 실시간 백링크 & 시맨틱 위상망 (드래그하여 와이어 연결)
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleResetCluster}
            className="p-1.5 rounded-lg bg-[#191b22] border border-[#2e3547] text-[#ccc3d8] hover:text-[#e2e2eb] hover:bg-[#1e1f26] transition-colors"
            title="그래프 초기화"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Filter Chips Bar */}
      <div className="px-4 py-2 bg-[#111319] border-b border-[#1f2432] flex items-center justify-between gap-2 overflow-x-auto no-scrollbar z-10">
        <div className="flex items-center gap-1.5 shrink-0">
          {[
            { id: 'all', label: '모든 연결' },
            { id: 'explicit', label: '명시적 백링크' },
            { id: 'semantic', label: 'AI 시맨틱 추천' },
            { id: 'cluster', label: '태그 클러스터' }
          ].map((mode) => (
            <button
              key={mode.id}
              onClick={() => setConnectionMode(mode.id as any)}
              className={`px-2.5 py-1 rounded-lg text-xs font-mono transition-all ${
                connectionMode === mode.id
                  ? 'bg-[#7c3aed] text-white shadow-[0_0_10px_rgba(124,58,237,0.4)]'
                  : 'bg-[#191b22] text-[#958da1] hover:text-[#e2e2eb] border border-[#2e3547]'
              }`}
            >
              {mode.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-1 shrink-0">
          {[
            { id: 'code', label: '소스코드', color: '#4cd7f6' },
            { id: 'db', label: '데이터베이스', color: '#4edea3' },
            { id: 'infra', label: '인프라', color: '#d2bbff' },
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
              <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: cat.color }}></span>
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

        {/* Drag Guide Hint */}
        {dragSourceId && (
          <div className="absolute top-3 left-1/2 -translate-x-1/2 z-30 px-3 py-1 rounded-full bg-[#7c3aed] text-white text-xs font-mono shadow-lg animate-bounce">
            연결할 대상 노드 위로 마우스를 놓아 백링크를 생성하세요
          </div>
        )}

        {/* SVG Canvas */}
        <svg
          ref={svgRef}
          className="w-full h-full cursor-grab active:cursor-grabbing transition-transform duration-300 ease-out"
          style={{
            transform: is3D
              ? `perspective(700px) rotateX(${tilt.rx}deg) rotateY(${tilt.ry}deg) scale(${zoomLevel})`
              : `scale(${zoomLevel})`
          }}
          viewBox="0 0 400 400"
          onMouseMove={handleSvgMouseMove}
          onMouseUp={handleSvgMouseUp}
        >
          <defs>
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

          {/* Background Grid Orbit Rings */}
          <g opacity="0.15" stroke="#7c3aed" fill="none">
            <circle cx="200" cy="200" r="80" strokeDasharray="3,3" />
            <circle cx="200" cy="200" r="140" strokeDasharray="4,4" />
          </g>

          {/* Explicit Backlinks (Solid Lines) */}
          {(connectionMode === 'all' || connectionMode === 'explicit') && (
            <g strokeLinecap="round">
              {dynamicGraph.links.map((link, idx) => (
                <line
                  key={`explicit-${idx}`}
                  x1={link.sx}
                  y1={link.sy}
                  x2={link.tx}
                  y2={link.ty}
                  stroke="#4cd7f6"
                  strokeWidth="2"
                  opacity="0.85"
                />
              ))}
            </g>
          )}

          {/* AI Semantic Recommended Links (Dashed Green Lines with Glow) */}
          {(connectionMode === 'all' || connectionMode === 'semantic') && (
            <g strokeLinecap="round">
              {dynamicGraph.semanticLinks.map((slink, idx) => {
                const midX = (slink.sx + slink.tx) / 2;
                const midY = (slink.sy + slink.ty) / 2;
                return (
                  <g key={`semantic-${idx}`}>
                    <line
                      x1={slink.sx}
                      y1={slink.sy}
                      x2={slink.tx}
                      y2={slink.ty}
                      stroke="#4edea3"
                      strokeWidth="1.6"
                      strokeDasharray="4,3"
                      opacity="0.8"
                      filter="url(#glow-green)"
                    />
                    <rect
                      x={midX - 22}
                      y={midY - 7}
                      width="44"
                      height="14"
                      rx="3"
                      fill="#0c0e14"
                      stroke="#4edea3"
                      strokeWidth="0.6"
                    />
                    <text
                      x={midX}
                      y={midY + 3}
                      fill="#4edea3"
                      fontFamily="JetBrains Mono"
                      fontSize="7"
                      textAnchor="middle"
                      fontWeight="bold"
                    >
                      {slink.score}% 시맨틱
                    </text>
                  </g>
                );
              })}
            </g>
          )}

          {/* Active Interactive Drag-to-Link Wire Line */}
          {dragSourceNode && dragPos && (
            <path
              d={`M ${dragSourceNode.x} ${dragSourceNode.y} Q ${(dragSourceNode.x + dragPos.x) / 2} ${
                (dragSourceNode.y + dragPos.y) / 2 - 25
              } ${dragPos.x} ${dragPos.y}`}
              fill="none"
              stroke="#4cd7f6"
              strokeWidth="2.5"
              strokeDasharray="6,4"
              className="animate-pulse"
              filter="url(#glow-cyan)"
            />
          )}

          {/* Dynamic SVG Nodes */}
          {dynamicGraph.nodes.map((node) => {
            const isSelected = node.id === selectedNodeId;
            const nodeColor =
              node.category === 'db'
                ? '#4edea3'
                : node.category === 'infra'
                ? '#d2bbff'
                : node.category === 'external'
                ? '#ffb4ab'
                : '#4cd7f6';

            return (
              <g
                key={node.id}
                className="cursor-pointer group"
                transform={`translate(${node.x}, ${node.y})`}
                onClick={() => {
                  setSelectedNodeId(node.id);
                  onShowToast(`'${node.label}' 노드가 선택되었습니다.`);
                }}
                onMouseUp={(e) => handleNodeDrop(node.id, e)}
              >
                {/* Node Ring Halo */}
                {isSelected && (
                  <circle
                    r={node.radius + 12}
                    fill="none"
                    stroke={nodeColor}
                    strokeWidth="1.5"
                    opacity="0.4"
                    className="animate-ping"
                    style={{ animationDuration: '3s' }}
                  />
                )}

                <circle
                  r={node.radius + 6}
                  fill={nodeColor}
                  fillOpacity={isSelected ? 0.2 : 0.08}
                />
                <circle
                  r={node.radius}
                  fill="#191b22"
                  stroke={nodeColor}
                  strokeWidth={isSelected ? 2.5 : 1.5}
                />
                <circle
                  r={Math.max(4, node.radius - 8)}
                  fill={nodeColor}
                  filter={isSelected ? 'url(#glow-cyan)' : undefined}
                  opacity={isSelected ? 1 : 0.8}
                />

                {/* Wire Drag Handle (Small Outer Ring) */}
                <circle
                  r="6"
                  cx={node.radius + 2}
                  cy={-node.radius - 2}
                  fill="#7c3aed"
                  stroke="#ffffff"
                  strokeWidth="1"
                  className="opacity-0 group-hover:opacity-100 transition-opacity cursor-crosshair"
                  onMouseDown={(e) => handleStartWireDrag(node.id, e)}
                >
                  <title>드래그하여 다른 노드와 백링크 연결</title>
                </circle>

                {/* Node Label Text */}
                <text
                  x="0"
                  y={-node.radius - 8}
                  textAnchor="middle"
                  fill={isSelected ? '#ffffff' : '#ccc3d8'}
                  fontFamily="JetBrains Mono"
                  fontSize="9"
                  fontWeight={isSelected ? 'bold' : 'normal'}
                >
                  {node.label.length > 14 ? `${node.label.slice(0, 13)}…` : node.label}
                </text>

                {isSelected && (
                  <text
                    x="0"
                    y={node.radius + 14}
                    textAnchor="middle"
                    fill={nodeColor}
                    fontFamily="JetBrains Mono"
                    fontSize="7"
                    fontWeight="600"
                  >
                    SELECTED
                  </text>
                )}
              </g>
            );
          })}
        </svg>

        {/* Floating Controls Toolbar */}
        <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between pointer-events-auto">
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

          <div className="flex items-center gap-1 p-0.5 rounded-lg bg-[#191b22]/90 backdrop-blur-md border border-[#2e3547] shadow-md">
            <button
              onClick={() => setDepthLevel((prev) => (prev === 3 ? 1 : prev + 1))}
              className="flex items-center px-2 py-1 gap-1 text-[#958da1] hover:text-[#4cd7f6] text-xs font-mono"
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

          <div className="text-xs font-mono text-[#958da1] bg-[#191b22]/90 px-3 py-1.5 rounded-lg border border-[#2e3547]">
            💡 노드 우상단 점을 드래그하여 다른 노드와 와이어링
          </div>
        </div>
      </div>

      {/* Bottom Sliding Inspector Sheet */}
      {activeNote && (
        <div className="w-full bg-[#191b22] border-t border-[#2e3547] px-4 pt-3 pb-6 shadow-2xl relative z-20">
          <div className="w-10 h-1 bg-[#33343b] rounded-full mx-auto mb-3"></div>

          {/* Inspector Header */}
          <div className="flex items-start justify-between gap-3 mb-3">
            <div className="flex flex-col min-w-0">
              <div className="flex items-center gap-2 mb-0.5">
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-[#4cd7f6]/15 text-[#4cd7f6] font-mono text-[11px]">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#4cd7f6]"></span>
                  {activeNote.categoryFull || activeNote.category}
                </span>
                <span className="text-[11px] font-mono text-[#958da1]">
                  {activeNote.readTime || '3분 읽기'} • {activeNote.wordCount}단어
                </span>
              </div>
              <h2 className="text-xl font-bold text-[#e2e2eb] tracking-tight truncate">
                {activeNote.title}
              </h2>
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              <button
                onClick={() => {
                  if (!activeNote) return;
                  const isCurrently = bookmarkedIds.has(activeNote.id);
                  setBookmarkedIds((prev) => {
                    const next = new Set(prev);
                    if (isCurrently) next.delete(activeNote.id);
                    else next.add(activeNote.id);
                    try {
                      localStorage.setItem('bookmarked_note_ids', JSON.stringify([...next]));
                    } catch {}
                    return next;
                  });
                  onShowToast(
                    isCurrently
                      ? `'${activeNote.title}' 북마크가 해제되었습니다.`
                      : `'${activeNote.title}' 노드가 북마크에 저장되었습니다.`
                  );
                }}
                className={`w-8 h-8 rounded-lg border border-[#2e3547] flex items-center justify-center transition-colors ${
                  activeNote && bookmarkedIds.has(activeNote.id)
                    ? 'bg-[#7c3aed] text-white'
                    : 'bg-[#1e1f26] text-[#958da1] hover:text-[#e2e2eb]'
                }`}
                title={activeNote && bookmarkedIds.has(activeNote.id) ? '북마크 해제' : '노드 북마크'}
              >
                <Bookmark className="w-4 h-4" />
              </button>
              <button
                onClick={() => onOpenDocument(activeNote.id)}
                className="w-8 h-8 rounded-lg bg-[#1e1f26] border border-[#2e3547] flex items-center justify-center text-[#958da1] hover:text-[#e2e2eb] hover:bg-[#282a30] transition-colors"
                title="문서 열기"
              >
                <ExternalLink className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Inspector Tabs */}
          <div className="flex items-center border-b border-[#2e3547] mb-3">
            <button
              onClick={() => setInspectorTab('backlinks')}
              className={`flex items-center gap-1.5 pb-2 px-3 text-xs font-mono border-b-2 transition-all ${
                inspectorTab === 'backlinks'
                  ? 'border-[#4cd7f6] text-[#4cd7f6] font-semibold'
                  : 'border-transparent text-[#958da1] hover:text-[#e2e2eb]'
              }`}
            >
              <Link2 className="w-3.5 h-3.5" />
              <span>백링크 ({dynamicBacklinks.length})</span>
            </button>
            <button
              onClick={() => setInspectorTab('semantic')}
              className={`flex items-center gap-1.5 pb-2 px-3 text-xs font-mono border-b-2 transition-all ${
                inspectorTab === 'semantic'
                  ? 'border-[#4edea3] text-[#4edea3] font-semibold'
                  : 'border-transparent text-[#958da1] hover:text-[#e2e2eb]'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>AI 시맨틱 추천 ({dynamicSemanticTies.length})</span>
            </button>
            <button
              onClick={() => setInspectorTab('unlinked')}
              className={`flex items-center gap-1.5 pb-2 px-3 text-xs font-mono border-b-2 transition-all ${
                inspectorTab === 'unlinked'
                  ? 'border-[#acedff] text-[#acedff] font-semibold'
                  : 'border-transparent text-[#958da1] hover:text-[#e2e2eb]'
              }`}
            >
              <Tag className="w-3.5 h-3.5" />
              <span>언링크드 멘션 ({dynamicUnlinkedMentions.length})</span>
            </button>
          </div>

          {/* Tab 1: Backlinks */}
          {inspectorTab === 'backlinks' && (
            <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
              {dynamicBacklinks.length === 0 ? (
                <div className="py-6 text-center text-xs font-mono text-[#958da1]">
                  이 노드를 참조하는 다른 백링크가 없습니다. 상단 점을 드래그하여 새 링크를 연결하세요.
                </div>
              ) : (
                dynamicBacklinks.map((link) => (
                  <div
                    key={link.id}
                    onClick={() => onOpenDocument(link.id)}
                    className="flex items-center justify-between p-2.5 rounded-lg bg-[#111319] border border-[#2e3547] hover:border-[#4cd7f6]/50 cursor-pointer transition-all"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span className={`w-2 h-2 rounded-full shrink-0 ${link.dotColor}`}></span>
                      <span className="text-xs font-medium text-[#e2e2eb] truncate font-mono">
                        {link.title}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-[10px] font-mono text-[#958da1]">{link.tag}</span>
                      <ChevronRight className="w-3.5 h-3.5 text-[#958da1]" />
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* Tab 2: AI Semantic Suggestions */}
          {inspectorTab === 'semantic' && (
            <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
              {dynamicSemanticTies.length === 0 ? (
                <div className="py-6 text-center text-xs font-mono text-[#958da1]">
                  추천 가능한 시맨틱 연관 문서가 없습니다.
                </div>
              ) : (
                dynamicSemanticTies.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between p-2.5 rounded-lg bg-[#111319] border border-[#4edea3]/30 hover:border-[#4edea3] transition-all"
                  >
                    <div className="flex flex-col min-w-0 pr-2">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-medium text-[#4edea3] font-mono truncate">
                          {item.title}
                        </span>
                        <span className="px-1.5 py-0.2 rounded bg-[#007650]/20 text-[#4edea3] font-mono text-[9px] border border-[#007650]/40">
                          {item.similarity}
                        </span>
                      </div>
                      <span className="text-[11px] text-[#958da1] truncate mt-0.5">{item.reason}</span>
                    </div>
                    <button
                      onClick={() => handleConnectNodes(activeNote, item.note.title)}
                      className="px-2 py-1 rounded bg-[#1e1f26] border border-[#4edea3]/40 text-[#4edea3] hover:bg-[#4edea3] hover:text-[#001f26] text-xs font-mono shrink-0 transition-colors"
                    >
                      연결
                    </button>
                  </div>
                ))
              )}
            </div>
          )}

          {/* Tab 3: Unlinked Mentions */}
          {inspectorTab === 'unlinked' && (
            <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
              {dynamicUnlinkedMentions.length === 0 ? (
                <div className="py-6 text-center text-xs font-mono text-[#958da1]">
                  본문 텍스트 내 비공식 멘션이 감지되지 않았습니다.
                </div>
              ) : (
                dynamicUnlinkedMentions.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between p-2.5 rounded-lg bg-[#111319] border border-[#2e3547] hover:border-[#acedff]/50 transition-all"
                  >
                    <div className="flex flex-col min-w-0 pr-2">
                      <span className="text-xs font-medium text-[#e2e2eb]">{item.docTitle}</span>
                      <span className="text-[11px] text-[#958da1] truncate mt-0.5">{item.snippet}</span>
                    </div>
                    <button
                      onClick={() => {
                        const targetDoc = notes.find((n) => n.id === item.id);
                        if (targetDoc) {
                          handleConnectNodes(targetDoc, activeNote.title);
                        }
                      }}
                      className="px-2 py-1 rounded bg-[#1e1f26] border border-[#acedff]/40 text-[#acedff] hover:bg-[#acedff] hover:text-[#001f26] text-xs font-mono shrink-0 transition-colors"
                    >
                      백링크로 승격
                    </button>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
