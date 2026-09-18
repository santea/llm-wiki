import {
  Workspace,
  ClassificationRule,
  NoteItem,
  GraphNode,
  GraphLink,
  TriageCardData,
  HierarchyNode,
  SystemNotification
} from '../types';
import {
  SYSTEM_ARCHITECTURE_DESIGN_NOTE,
  ARCHITECTURE_GRAPH_NODE,
  ARCHITECTURE_GRAPH_LINKS
} from './architectureDesignNote';

export const INITIAL_WORKSPACES: Workspace[] = [
  {
    id: 'ws-1',
    name: '플랫폼 엔지니어링 스페이스',
    icon: '🚀',
    path: '/core/infra-mesh',
    docCount: 28,
    nodeCount: 142,
    syncPercent: 98,
    statusColor: '#4cd7f6'
  },
  {
    id: 'ws-2',
    name: '코어 결제 시스템 API',
    icon: '⚡',
    path: '/services/payment-v2',
    docCount: 14,
    nodeCount: 89,
    syncPercent: 94,
    statusColor: '#d2bbff'
  },
  {
    id: 'ws-3',
    name: 'K8s 클라우드 인프라',
    icon: '📦',
    path: '/manifests/argocd',
    docCount: 36,
    nodeCount: 81,
    syncPercent: 100,
    statusColor: '#4edea3'
  }
];

export const INITIAL_RULES: ClassificationRule[] = [
  {
    id: 'rule-1',
    name: '시스템 인프라 정보',
    nameEn: 'System Infrastructure',
    level: 'High',
    color: '#4edea3',
    icon: 'cloud',
    enabled: true,
    tags: ['#K8s', '#AWS', '#Terraform', '#네트워크토폴로지', '#서버사양'],
    detectionLogic: 'IP 주소, 클라우드 리소스 ARN, Docker/K8s 매니페스트 감지 시 인프라 문서로 자동 승격 및 보안 등급 지정'
  },
  {
    id: 'rule-2',
    name: '소스코드 및 구현 정보',
    nameEn: 'Source Code & Implementation',
    level: 'Standard',
    color: '#d2bbff',
    icon: 'code',
    enabled: true,
    tags: ['#Backend', '#Spring', '#Python', '#API함수', '#알고리즘'],
    detectionLogic: '코드 블록 3줄 이상, 함수 시그니처, Git 커밋/PR 링크 포함 시 자동 코드 스니펫화 및 언어별 구문 분석'
  },
  {
    id: 'rule-3',
    name: '데이터베이스 정보',
    nameEn: 'Database & Architecture',
    level: 'High',
    color: '#4cd7f6',
    icon: 'database',
    enabled: true,
    tags: ['#PostgreSQL', '#Redis', '#ERD', '#인덱스최적화', '#마이그레이션'],
    detectionLogic: 'DDL/DML 쿼리문, 테이블 스키마 정의, 릴레이션 관계도 감지 시 DB 레퍼런스 노트로 분기'
  },
  {
    id: 'rule-4',
    name: '업무 및 시스템 흐름',
    nameEn: 'Business & System Workflow',
    level: 'Medium',
    color: '#acedff',
    icon: 'account_tree',
    enabled: true,
    tags: ['#시퀀스다이어그램', '#주문결제흐름', '#승인프로세스', '#SOP'],
    detectionLogic: '단계별 번호 목록(Step 1..), Mermaid 시퀀스, 사용자 유저저니 묘사 시 워크플로우 문서로 통합'
  },
  {
    id: 'rule-5',
    name: '외부 시스템 연계 정보',
    nameEn: 'External Integrations & APIs',
    level: 'Standard',
    color: '#4cd7f6',
    icon: 'cable',
    enabled: true,
    tags: ['#PG사인증', '#웹훅', '#3rdParty', '#OAuth', '#공공데이터연계'],
    detectionLogic: '외부 엔드포인트 URL, 인증 헤더, 연동 규격서, 웹훅 페이로드 스펙 감지 시 연계 인터페이스 카테고리로 정리'
  }
];

export const INITIAL_NOTES: NoteItem[] = [
  SYSTEM_ARCHITECTURE_DESIGN_NOTE,
  {
    id: 'note-saga',
    title: '분산 주문 트랜잭션 Saga 패턴 구현체',
    category: '소스코드',
    categoryFull: '소스코드 및 구현 정보',
    updatedAt: '3분 전',
    statusBadge: 'AI 정제 완료',
    badgeType: 'ai-refined',
    excerpt: 'Saga 패턴은 각 서비스의 로컬 트랜잭션을 순차적으로 트리거하며, 실패 시 보상 트랜잭션(Compensating Transaction)을 발행하여 데이터 일관성을 유지합니다.',
    tags: ['#Spring', '#Backend', '#Kafka'],
    wordCount: 1248,
    charCount: 4819,
    readTime: '3분 읽기',
    backlinksCount: 7,
    author: 'Platform Architect',
    connectedNodes: ['[[결제 모듈 v2]]', '[[주문 서비스 ERD]]', '[[Kafka 클러스터]]'],
    codeSnippet: {
      filename: 'OrderSagaCoordinator.kt',
      language: 'Kotlin',
      code: `class OrderSagaCoordinator(
    private val kafkaTemplate: KafkaTemplate<String, SagaPayload>,
    private val stateStore: OrderStateRepository
) {
    suspend fun execute(order: OrderAggregate): SagaResult {
        val context = stateStore.initStep(order.id)
        // 1단계: 재고 예약 발행
        return runCatching {
            kafkaTemplate.send("inventory.reserve", order.toPayload()).await()
            stateStore.markProgress(context.id, Step.INVENTORY_PENDING)
        }.getOrElse { ex ->
            // 보상 트랜잭션 호출
            compensate(order.id, ex)
        }
    }
}`
    },
    isPinned: true
  },
  {
    id: 'note-db-tuning',
    title: 'PostgreSQL 16 커넥션 풀 튜닝 가이드',
    category: 'DB',
    categoryFull: '데이터베이스 정보',
    updatedAt: '28분 전 수정',
    statusBadge: 'AI 자동정제됨',
    badgeType: 'ai-refined',
    excerpt: 'PgBouncer 트랜잭션 풀링 모드 적용 시 준비된 구문(Prepared Statements) 누수 문제 해결 및 max_connections 파라미터 메모리 최적화 공식 정리.',
    tags: ['#pgbouncer', '#db-perf', '#postgresql'],
    wordCount: 1842,
    charCount: 6200,
    readTime: '4분 읽기',
    backlinksCount: 8,
    author: 'DBA Lead'
  },
  {
    id: 'note-webhook-spec',
    title: '카카오페이 웹훅 연동 규격서 & 재시도 백오프',
    category: '연계',
    categoryFull: '외부 시스템 연계 정보',
    updatedAt: '2시간 전',
    statusBadge: '스펙 추출완료',
    badgeType: 'spec-done',
    excerpt: 'HMAC-SHA256 서명 검증 로직 구현체 첨부. 멱등성 보장을 위한 Idempotency-Key 헤더 캐싱 TTL 정책 및 500 에러 처리 파이프라인.',
    tags: ['#webhook', '#payment-gateway', '#kakaopay'],
    wordCount: 920,
    charCount: 3100,
    readTime: '2분 읽기',
    backlinksCount: 5,
    author: 'Payment Squad'
  },
  {
    id: 'note-eks-terraform',
    title: 'Terraform AWS EKS 모듈 v5.2 업그레이드 체크리스트',
    category: '인프라',
    categoryFull: '시스템 인프라 정보',
    updatedAt: '어제 오후 04:20',
    statusBadge: '수동 승인됨',
    badgeType: 'manual',
    excerpt: 'Karpenter v0.34 노드풀 리소스 스키마 마이그레이션 변경점. IRSA(IAM Roles for Service Accounts) 권한 자동 주입 시 보안 그룹 변경 체크.',
    tags: ['#eks', '#terraform', '#aws', '#karpenter'],
    wordCount: 2410,
    charCount: 8400,
    readTime: '5분 읽기',
    backlinksCount: 14,
    author: 'Infra SRE'
  },
  {
    id: 'note-redlock',
    title: '주문 트랜잭션 Redlock 분산락 패턴 설계 & 장애 복구',
    category: '소스코드',
    categoryFull: '소스코드 및 구현 정보',
    updatedAt: '2일 전',
    statusBadge: 'AI 구조화',
    badgeType: 'ai-structured',
    excerpt: 'Redis 다중 인스턴스 합의 알고리즘(Redlock)을 통한 동시 결제 멱등 레이스 컨디션 방지. 클락 드리프트(Clock drift) 허용 오차 계산식.',
    tags: ['#redis', '#distributed-lock', '#concurrency'],
    wordCount: 3150,
    charCount: 10200,
    readTime: '7분 읽기',
    backlinksCount: 19,
    author: 'Platform Architect'
  }
];

export const INITIAL_GRAPH_NODES: GraphNode[] = [
  ARCHITECTURE_GRAPH_NODE,
  {
    id: 'center',
    label: '결제 트랜잭션 엔진',
    sublabel: 'SELECTED NODE',
    category: 'code',
    x: 200,
    y: 200,
    radius: 20,
    isCenter: true,
    depth: 1,
    metrics: 'v2.4.1-rc • 7 Backlinks'
  },
  {
    id: 'kafka',
    label: 'Kafka 클러스터',
    category: 'infra',
    x: 110,
    y: 135,
    radius: 14,
    depth: 2,
    metrics: 'Event Stream'
  },
  {
    id: 'rds',
    label: 'AWS RDS',
    category: 'db',
    x: 310,
    y: 270,
    radius: 14,
    depth: 2,
    metrics: 'Primary DB'
  },
  {
    id: 'toss',
    label: '토스페이먼츠 API',
    category: 'external',
    x: 320,
    y: 128,
    radius: 13,
    depth: 2,
    metrics: 'PG Webhook'
  },
  {
    id: 'k8s-pod',
    label: 'K8s Core Pod',
    category: 'infra',
    x: 145,
    y: 285,
    radius: 11,
    depth: 2,
    metrics: 'Workload Pod'
  },
  {
    id: 'redis',
    label: 'Redis 캐시',
    category: 'db',
    x: 230,
    y: 330,
    radius: 10,
    depth: 2,
    metrics: 'Cluster Cache'
  },
  {
    id: 'sop',
    label: 'SOP 취소흐름',
    category: 'workflow',
    x: 70,
    y: 230,
    radius: 10,
    depth: 2,
    metrics: 'Rollback Flow'
  },
  {
    id: 'settlement',
    label: '정산 배치 v1',
    category: 'workflow',
    x: 260,
    y: 75,
    radius: 10,
    depth: 2,
    metrics: 'Nightly Batch'
  }
];

export const INITIAL_GRAPH_LINKS: GraphLink[] = [
  ...ARCHITECTURE_GRAPH_LINKS,
  { source: 'center', target: 'kafka', label: 'Produce Event', gradient: 'url(#edge-code-infra)' },
  { source: 'center', target: 'rds', label: 'State Commit', gradient: 'url(#edge-code-db)' },
  { source: 'center', target: 'toss', label: 'Webhook Call', gradient: 'url(#edge-code-ext)' },
  { source: 'center', target: 'k8s-pod', label: 'Host' },
  { source: 'center', target: 'redis', label: 'Lock & Cache', style: 'dashed' },
  { source: 'center', target: 'sop', label: 'Compensate' },
  { source: 'center', target: 'settlement', label: 'Batch Source' }
];

export const INITIAL_TRIAGE_ITEMS: TriageCardData[] = [
  {
    id: 'card-1',
    category: 'infra',
    categoryTitle: '시스템 인프라 High',
    confidence: '99.1%',
    timestamp: '12분 전 인입',
    rawType: '클립보드 메모',
    rawSubtitle: 'Quick Memo #104',
    rawContent: '"aws eks fargate 메모리 릭 발생 시 프로파일링 팁 cgroup v2 기반 jvm maxrampercentage 옵션 검증 필요. /sys/fs/cgroup/memory.current 실측 및 heapdump s3 덤프 스크립트 실행권한 확인요망"',
    aiTitle: 'AI 정제 결과 (3줄 요약)',
    aiBadge: '지식 그래프 매핑',
    aiSummaryPoints: [
      '원인 분석: AWS EKS Fargate 환경 cgroup v2 적용에 따른 JVM 메모리 메트릭 착오 감지',
      '해결 방안: JVM MaxRAMPercentage 플래그 보정 및 memory.current 기반 릭 추적',
      '자동화 파이프라인: Fargate 태스크 내 S3 덤프 덤프 스크립트 IAM 정책(PutObject) 추가 권고'
    ],
    tags: ['#AWS', '#EKS', '#MemoryProfiling', '#CgroupV2'],
    targetPath: '인프라 트러블슈팅/Kubernetes/EKS-Profiling.md'
  },
  {
    id: 'card-2',
    category: 'code',
    categoryTitle: '외부 시스템 연계 Standard',
    confidence: '97.8%',
    timestamp: '35분 전 슬랙 인입',
    rawType: 'Slack 스레드 캡처 (#payment-core)',
    rawSubtitle: 'Thread #491',
    rawContent: '"PG사 결제 웹훅 타임아웃 5초 재시도 규격: 1차 실패 시 exponential backoff(1m, 5m, 15m). 웹훅 수신 엔드포인트 /v2/payments/webhook 에서 200 OK 지연 방지를 위해 즉시 Redis 큐 적재 후 비동기 워커 위임 필수"',
    aiTitle: '파싱된 엔드포인트 규격',
    aiBadge: '아키텍처 룰 연동됨',
    endpointSpec: {
      endpoint: 'POST /v2/payments/webhook',
      timeout: '5,000ms (엄격 준수)',
      retry: 'Exponential [1m, 5m, 15m]'
    },
    backlinks: ['[[결제 연동 규격]]', '[[Redis 멱등성 큐]]'],
    tags: ['#webhook', '#payment', '#redis', '#retry'],
    targetPath: '인터페이스/결제/PG-Webhook-Spec.md'
  },
  {
    id: 'card-3',
    category: 'db',
    categoryTitle: '데이터베이스 High',
    confidence: '인덱스 최적화 제안',
    timestamp: '1시간 전',
    rawType: 'PostgreSQL 쿼리 로그',
    rawSubtitle: 'Slow Query 1.42s',
    rawContent: `SELECT o.id, o.amount FROM orders o 
WHERE o.status = 'COMPLETED' 
  AND o.created_at >= NOW() - INTERVAL '30 days'
ORDER BY o.created_at DESC;`,
    aiTitle: 'AI 인덱스 생성 추천',
    aiBadge: '스캔 효율 94% 개선',
    sqlRecommendation: {
      query: 'orders 복합 인덱스 부재로 인한 Sequential Scan 발생',
      performance: '스캔 효율 94% 개선 (Index Only Scan 유도)',
      indexDdl: `CREATE INDEX idx_orders_status_created 
ON orders (status, created_at DESC) 
INCLUDE (amount);`
    },
    tags: ['#postgresql', '#indexing', '#slowquery'],
    targetPath: 'DB/튜닝/Order-Index-Optimization.md'
  }
];

export const INITIAL_HIERARCHY_TREE: HierarchyNode = {
  id: 'root-1',
  level: 'L1',
  title: '결제 & 트랜잭션 서비스',
  icon: 'folder_open',
  docCount: '48 docs',
  children: [
    {
      id: 'sub-order-coord',
      level: 'L2',
      title: '주문 및 결제 코디네이터',
      icon: 'account_tree',
      docCount: '3 모듈',
      children: [
        {
          id: 'mod-saga',
          level: 'L3',
          title: '분산 트랜잭션 Saga 패턴 구현체',
          icon: 'description',
          description: '보상 트랜잭션 오케스트레이션 및 상태 머신 롤백 워크플로우',
          badge: 'AI 정제완료',
          attributes: ['7 Backlinks', 'Kotlin 1.9', 'AI 정제완료'],
          children: [
            {
              id: 'leaf-webhook',
              level: 'L4',
              title: '/v2/payments/webhook',
              icon: 'link',
              badge: 'POST',
              description: 'PG 웹훅 수신 원자 엔드포인트'
            },
            {
              id: 'leaf-coord-kt',
              level: 'L4',
              title: 'OrderSagaCoordinator.kt',
              icon: 'data_object',
              description: '오케스트레이터 코어 로직',
              badge: '214 loc'
            },
            {
              id: 'leaf-redlock',
              level: 'L4',
              title: '주문 트랜잭션 Redlock 분산락 패턴',
              icon: 'lock',
              description: '동시성 멱등 제어',
              badge: 'TTL 3000ms'
            }
          ]
        }
      ]
    },
    {
      id: 'sub-settlement',
      level: 'L2',
      title: '정산 & 배치 엔진 (v1.8)',
      icon: 'cached',
      docCount: '12 docs'
    }
  ]
};

export const INITIAL_NOTIFICATIONS: SystemNotification[] = [
  {
    id: 'notif-1',
    title: 'AI 룰셋 v2.4 자동 동기화 완료',
    description: '사내 인프라 IP 마스킹 규칙이 활성화되어 3건의 노트에 실시간 적용되었습니다.',
    time: '5분 전',
    type: 'success',
    read: false
  },
  {
    id: 'notif-2',
    title: '고립된 노드 2건 감지됨',
    description: '상위 Depth 부모가 지정되지 않은 임시 스니펫이 발견되었습니다.',
    time: '24분 전',
    type: 'warning',
    read: false
  },
  {
    id: 'notif-3',
    title: '그래프 클러스터 재정렬 완료',
    description: '결제 트랜잭션 엔진 중심 7개 백링크 연관도가 98%로 갱신되었습니다.',
    time: '1시간 전',
    type: 'info',
    read: true
  }
];

// Aliases
export const workspaces = INITIAL_WORKSPACES;
export const mockRules = INITIAL_RULES;
export const mockNotes = INITIAL_NOTES;
export const mockGraphNodes = INITIAL_GRAPH_NODES;
export const mockGraphLinks = INITIAL_GRAPH_LINKS;
export const mockTriageCards = INITIAL_TRIAGE_ITEMS;

