export type TabType = 'notes' | 'graph' | 'hierarchy' | 'refinery' | 'taxonomy' | 'chat' | 'settings';

export type ViewMode = 'desktop' | 'mobile';

export interface Workspace {
  id: string;
  name: string;
  icon: string;
  path: string;
  docCount: number;
  nodeCount: number;
  syncPercent: number;
  statusColor: string;
}

export interface ClassificationRule {
  id: string;
  name: string;
  nameEn: string;
  level: 'High' | 'Standard' | 'Medium';
  color: string;
  icon: string;
  enabled: boolean;
  tags: string[];
  detectionLogic: string;
}

export interface NoteItem {
  id: string;
  title: string;
  category: 'DB' | '연계' | '인프라' | '소스코드' | '워크플로우';
  categoryFull: string;
  updatedAt: string;
  statusBadge: string;
  badgeType: 'ai-refined' | 'spec-done' | 'manual' | 'ai-structured';
  excerpt: string;
  tags: string[];
  wordCount: number;
  charCount?: number;
  readTime?: string;
  backlinksCount: number;
  author?: string;
  codeSnippet?: {
    filename: string;
    language: string;
    code: string;
  };
  connectedNodes?: string[];
  isPinned?: boolean;
}

export interface GraphNode {
  id: string;
  label: string;
  sublabel?: string;
  category: 'infra' | 'code' | 'db' | 'workflow' | 'external';
  x: number;
  y: number;
  radius: number;
  isCenter?: boolean;
  depth?: number;
  metrics?: string;
}

export interface GraphLink {
  source: string;
  target: string;
  label?: string;
  style?: 'solid' | 'dashed';
  gradient?: string;
}

export interface TriageCardData {
  id: string;
  category: 'infra' | 'code' | 'db';
  categoryTitle: string;
  confidence: string;
  timestamp: string;
  rawType: string;
  rawSubtitle: string;
  rawContent: string;
  aiTitle: string;
  aiBadge: string;
  aiSummaryPoints?: string[];
  endpointSpec?: {
    endpoint: string;
    timeout: string;
    retry: string;
  };
  sqlRecommendation?: {
    query: string;
    performance: string;
    indexDdl: string;
  };
  tags: string[];
  backlinks?: string[];
  targetPath: string;
}

export interface HierarchyNode {
  id: string;
  level: 'L1' | 'L2' | 'L3' | 'L4';
  title: string;
  icon: string;
  docCount?: string;
  badge?: string;
  description?: string;
  attributes?: string[];
  children?: HierarchyNode[];
}

export interface SystemNotification {
  id: string;
  title: string;
  description: string;
  time: string;
  type: 'info' | 'success' | 'warning';
  read: boolean;
}

export interface DiffLine {
  lineNumber?: number;
  type: 'context' | 'added' | 'removed';
  content: string;
}

export interface DiffProposal {
  targetDocId: string;
  targetDocTitle: string;
  targetDocLevel: string;
  sectionTitle: string;
  addedCount: number;
  lines: DiffLine[];
  ruleCheckNote: string;
  committed?: boolean;
  commitSha?: string;
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  timestamp: string;
  text: string;
  type?: 'text' | 'semantic-map' | 'diff-proposal';
  thinkingSteps?: {
    summary: string;
    details: {
      icon: string;
      text: string;
      color: string;
    }[];
  };
  highlightTitle?: string;
  highlightSection?: {
    title: string;
    desc: string;
  };
  warningCallout?: {
    title: string;
    desc: string;
  };
  backlinks?: string[];
  actionPills?: {
    label: string;
    icon: string;
    actionType: 'open-doc' | 'graph-pos' | 'related-nodes' | 'summarize';
    payload?: string;
  }[];
  diffProposal?: DiffProposal;
}
