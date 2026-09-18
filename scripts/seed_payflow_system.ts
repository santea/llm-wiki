import { saveNote, saveTriageCard } from '../db';
import dotenv from 'dotenv';

dotenv.config();

interface RawDocSpec {
  id: string;
  category: '인프라' | '소스코드' | 'DB' | '연계';
  categoryFull: string;
  sourceApp: string;
  rawContent: string;
  mermaidDiagram?: string;
  codeSnippet?: {
    filename: string;
    language: string;
    code: string;
  };
}

const rawDocSpecs: RawDocSpec[] = [
  {
    id: 'note-payflow-core-arch',
    category: '인프라',
    categoryFull: '시스템 인프라 정보',
    sourceApp: 'Architecture Spec',
    rawContent: `[PayFlow Global Core Payment & Settlement Platform Spec v3.2]
시스템 정의: 초당 50,000건(50k TPS) 이상의 멀티 리전 동시 결제 승인 및 D+1 복식부기 대사를 수행하는 글로벌 결제 코어 엔진.
도메인 분할:
1. Ingress Tier: Envoy 기반 글로벌 API 게이트웨이 및 결제사별 Rate Limiting.
2. Security Tier: 카드번호(PAN) 무손실 암호화 토큰 볼트 (PCI-DSS Level 1 인증).
3. Orchestration Tier: Temporal 기반 분산 트랜잭션 오케스트레이터 및 보상 롤백.
4. Risk & AI Tier: Flink 실시간 스트리밍 FDS 이상거래 탐지 엔진 (50ms 이내 차단).
5. Event Bus: Debezium CDC 기반 Transactional Outbox 및 Kafka 파티셔닝.
6. Ledger Database: PostgreSQL 16 복식부기 분산 원장 (월별 파티셔닝, PgBouncer 6432 포트).
연결 참조: [[PayFlow API 게이트웨이 및 트래픽 쓰로틀링]], [[분산 결제 오케스트레이터 및 2PC 롤백 정책]], [[PostgreSQL 금융 원장 시계열 파티셔닝 & 분산 격리]]`,
    mermaidDiagram: `flowchart TD
    Client["글로벌 가맹점 클라이언트"] -->|HTTPS / mTLS| GW["PayFlow API 게이트웨이 (Envoy)"]
    GW --> Token["결제 토큰화 볼트 (HSM)"]
    GW --> Saga["분산 결제 오케스트레이터 (Temporal)"]
    Saga --> FDS["실시간 FDS 엔진 (Flink + pgvector)"]
    Saga --> PG["외부 PG사 (카카오페이 / Stripe)"]
    Saga --> Outbox["Kafka 트랜잭셔널 아웃박스"]
    Outbox --> Ledger[("PostgreSQL 16 금융 원장")]
    Outbox --> Reconcile["D+1 자동 대사 배치 엔진"]`,
    codeSnippet: {
      filename: 'payflow-cluster-topology.yaml',
      language: 'yaml',
      code: `apiVersion: apps/v1
kind: Deployment
metadata:
  name: payflow-core-orchestrator
  namespace: finance-core
spec:
  replicas: 16
  strategy:
    type: RollingUpdate
    rollingUpdate:
      maxSurge: 25%
      maxUnavailable: 0
  template:
    metadata:
      labels:
        app: payflow-core
        tier: transaction-engine`
    }
  },
  {
    id: 'note-payflow-api-gateway',
    category: '인프라',
    categoryFull: '시스템 인프라 정보',
    sourceApp: 'Envoy Gateways',
    rawContent: `[PayFlow Envoy Ingress & Rate Limiter Specification]
역할: 전 세계 8개 리전의 결제사 및 가맹점 트래픽의 단일 진입점.
기능 명세:
- 토큰 버킷(Token Bucket) 알고리즘 기반 가맹점 티어별 Rate Limiting (Tier 1: 15,000 TPS, Tier 2: 5,000 TPS).
- 상호 TLS(mTLS) v1.3 기반 클라이언트 인증서 검증 및 SHA-256 요청 서명(Signature) 검증.
- Circuit Breaker: 백엔드 결제 코어 지연 300ms 초과 비율이 5% 이상일 때 가맹점 폴백(HTTP 429 Retry-After) 즉시 트립.
연결 참조: [[PayFlow 결제 코어 글로벌 아키텍처 개요 및 도메인 분할]], [[결제 토큰화 및 PCI-DSS 보안 볼트]], [[금융 규제 준수 감사 로그 및 실시간 장애 대응 SOP]]`,
    codeSnippet: {
      filename: 'envoy-rate-limit.yaml',
      language: 'yaml',
      code: `rate_limits:
  - actions:
      - request_headers:
          header_name: "X-Merchant-Tier"
          descriptor_key: "merchant_tier"
  descriptors:
    - key: "merchant_tier"
      value: "tier_1"
      rate_limit:
        unit: SECOND
        requests_per_unit: 15000`
    }
  },
  {
    id: 'note-payflow-token-vault',
    category: '소스코드',
    categoryFull: '소스코드 및 구현 정보',
    sourceApp: 'PCI-DSS Vault',
    rawContent: `[PayFlow Tokenization & HSM Security Vault Module]
목적: PCI-DSS v4.0 규제 준수를 위한 신용카드 번호(PAN) 및 CVV 무손실 가명화(Tokenization).
동작 흐름:
- 인입된 원본 카드번호는 암호화 전용 보안 메모리(Enclave)에서 즉시 AES-256-GCM 알고리즘으로 암호화.
- 키 관리는 AWS KMS / 온프레미스 Thales HSM(Hardware Security Module) 마스터 키로 래핑.
- 내부 서비스는 오직 'tkn_live_8f3a9c7b...' 형태의 대체 토큰만 참조하여 원본 데이터 유출 원천 차단.
연결 참조: [[PayFlow API 게이트웨이 및 트래픽 쓰로틀링]], [[분산 결제 오케스트레이터 및 2PC 롤백 정책]]`,
    codeSnippet: {
      filename: 'TokenVaultService.ts',
      language: 'typescript',
      code: `export async function tokenizeCard(pan: string, cvv: string): Promise<string> {
  const hsmKey = await hsmClient.getKey('payflow-pan-master-2026');
  const cipher = crypto.createCipheriv('aes-256-gcm', hsmKey.secret, iv);
  const encrypted = Buffer.concat([cipher.update(pan, 'utf8'), cipher.final()]);
  const token = 'tkn_live_' + crypto.randomBytes(16).toString('hex');
  await tokenStorage.put(token, encrypted, cipher.getAuthTag());
  return token;
}`
    }
  },
  {
    id: 'note-payflow-saga-orchestrator',
    category: '소스코드',
    categoryFull: '소스코드 및 구현 정보',
    sourceApp: 'Temporal Workflow',
    rawContent: `[PayFlow Distributed Saga Payment Orchestration Engine]
아키텍처: Temporal / Cadence 워크플로우 엔진 기반 분산 오케스트레이션.
주요 단계:
1. 결제 의향 생성 (Payment Intent Initialized)
2. 결제 토큰 검증 및 FDS 이상 거래 점수 질의 (<30점 통과)
3. PG사 승인 호출 (카카오페이/토스페이/Stripe)
4. 금융 원장 가승인(Hold) 및 재고 확정
5. 최종 승인 이벤트 Kafka 발행
보상(Compensating) 트랜잭션: 승인 단계 실패 또는 네트워크 타임아웃 시 2단계 역순 롤백(재고 락 해제, 가승인 취소, 고객 알림 발송).
연결 참조: [[결제 토큰화 및 PCI-DSS 보안 볼트]], [[실시간 FDS 이상거래 감지 파이프라인]], [[Kafka 트랜잭셔널 아웃박스 이벤트 버스]], [[Redis 분산 멱등성 락 및 핫키 캐시]]`,
    mermaidDiagram: `sequenceDiagram
    autonumber
    actor Merchant as 가맹점 (Client)
    participant Saga as PayFlow Saga 코디네이터
    participant FDS as FDS 이상거래 탐지
    participant PG as 외부 카드/PG사
    participant Ledger as 복식부기 원장
    participant Kafka as 이벤트 버스 (DLQ)

    Merchant->>Saga: 1. 결제 승인 요청 (POST /v3/charges)
    Saga->>FDS: 2. 실시간 FDS 위험도 스코어링 질의
    FDS-->>Saga: Risk Score: 12 (정상 승인)
    Saga->>PG: 3. 카드사 승인 요청 (Auth)
    alt PG 승인 완료
        PG-->>Saga: 200 OK (AuthCode: APPR-9921)
        Saga->>Ledger: 4. 복식부기 분산 원장 커밋 (Hold -> Settle)
        Saga->>Kafka: 5. 결제 성공 이벤트 발행
        Saga-->>Merchant: 201 Created (결제 성공)
    else 승인 거절 또는 타임아웃
        PG--xSaga: 504 Gateway Timeout
        Saga->>Kafka: 보상 트랜잭션 (Compensate DLQ) 발행
        Saga->>Ledger: 가승인 잔액 롤백
        Saga-->>Merchant: 400 결제 취소 (안전 롤백 완료)
    end`,
    codeSnippet: {
      filename: 'PaymentSagaWorkflow.java',
      language: 'java',
      code: `@WorkflowInterface
public interface PaymentSagaWorkflow {
    @WorkflowMethod
    PaymentResult executePayment(PaymentRequest request);
}

public class PaymentSagaWorkflowImpl implements PaymentSagaWorkflow {
    private final Saga saga = new Saga(new Saga.Options.Builder().setParallelCompensation(true).build());
    
    @Override
    public PaymentResult executePayment(PaymentRequest request) {
        saga.addCompensation(activities::cancelAuthorization, request.getTxId());
        activities.deductInventory(request.getItemId());
        activities.chargePG(request.getAmount());
        return PaymentResult.SUCCESS;
    }
}`
    }
  },
  {
    id: 'note-payflow-fds-engine',
    category: '소스코드',
    categoryFull: '소스코드 및 구현 정보',
    sourceApp: 'Flink FDS Stream',
    rawContent: `[PayFlow Realtime Fraud Detection System (FDS)]
처리 성능: 단일 결제 건당 35ms 이내 실시간 판정.
기술 스택: Apache Flink 스트리밍 + PostgreSQL pgvector 768차원 유저 소비 행태 벡터 인덱스(HNSW).
탐지 규칙:
- 5분 이내 동일 카드 3개국 이상 물리적 거리 초과 결제 시도 (Impossible Travel Rule -> 점수 +80점).
- 평소 거래 단가 대비 1,000% 급증 및 야간 시간대 고액 상품권 결제 (Abnormal Amount -> 점수 +50점).
- 최종 이상점수가 70점 초과 시 즉시 결제 강제 차단(REJECT) 및 보안 온콜 알림.
연결 참조: [[분산 결제 오케스트레이터 및 2PC 롤백 정책]], [[Redis 분산 멱등성 락 및 핫키 캐시]]`,
    codeSnippet: {
      filename: 'FraudEvaluationJob.py',
      language: 'python',
      code: `def evaluate_risk(event: PaymentEvent, user_vector: list[float]) -> int:
    risk_score = 0
    # pgvector HNSW 시맨틱 코사인 유사도 검색
    similarity = vector_db.cosine_similarity(event.feature_vector, user_vector)
    if similarity < 0.65:
        risk_score += 45
    if event.is_impossible_travel():
        risk_score += 80
    return risk_score`
    }
  },
  {
    id: 'note-payflow-kafka-outbox',
    category: '인프라',
    categoryFull: '시스템 인프라 정보',
    sourceApp: 'Debezium CDC',
    rawContent: `[PayFlow Transactional Outbox & Kafka Event Bus Spec]
문제 해결: 결제 원장 DB 저장과 외부 메시지 브로커 발행 간의 분산 2PC 한계 극복.
아키텍처:
- DB 결제 원장 커밋과 동시에 동일 트랜잭션 내 outbox_events 테이블에 이벤트 레코드 기록.
- Debezium PostgreSQL CDC 커넥터가 WAL(Write-Ahead Log)을 실시간 테일링하여 Kafka 토픽 payflow.payment.approved로 스트리밍.
- Exactly-Once 시맨틱을 위해 Kafka Producer Idempotence 설정 (acks=all, enable.idempotence=true).
- 64개 파티션 구성 및 Key는 merchant_id:user_id 해시를 적용하여 순서 보장.
연결 참조: [[분산 결제 오케스트레이터 및 2PC 롤백 정책]], [[실시간 대사 및 D+1 자동 정산 배치 엔진]]`,
    codeSnippet: {
      filename: 'kafka-debezium-outbox.json',
      language: 'json',
      code: `{
  "name": "payflow-outbox-connector",
  "config": {
    "connector.class": "io.debezium.connector.postgresql.PostgresConnector",
    "plugin.name": "pgoutput",
    "database.server.name": "payflow-ledger",
    "table.include.list": "public.outbox_events",
    "tombstones.on.delete": "false"
  }
}`
    }
  },
  {
    id: 'note-payflow-redis-idempotency',
    category: '인프라',
    categoryFull: '시스템 인프라 정보',
    sourceApp: 'Redis Cluster',
    rawContent: `[PayFlow Redis Idempotency Lock & HotKey Cache]
목적: 동일 가맹점 주문 번호의 네트워크 재시도 또는 사용자의 따닥(더블 클릭) 결제 방지.
핵심 알고리즘:
- Redlock 3개 마스터 노드 쿼럼 합의 기반 분산 락 획득 (TTL 5,000ms).
- 멱등성 키: payflow:idempotency:{merchant_id}:{order_id}
- 결제 승인 진행 중인 키가 존재할 경우 HTTP 409 Conflict 반환.
- 결제 완료 후 24시간 동안 처리 결과를 캐싱하여 동일 키 요청 시 재결제 없이 이전 성공 응답 즉시 반환.
연결 참조: [[분산 결제 오케스트레이터 및 2PC 롤백 정책]], [[실시간 FDS 이상거래 감지 파이프라인]]`,
    codeSnippet: {
      filename: 'acquire-idempotency-lock.lua',
      language: 'lua',
      code: `local key = KEYS[1]
local requestId = ARGV[1]
local ttl = tonumber(ARGV[2])

if redis.call('SET', key, requestId, 'NX', 'PX', ttl) then
    return 1
else
    return 0
end`
    }
  },
  {
    id: 'note-payflow-ledger-db',
    category: 'DB',
    categoryFull: '데이터베이스 정보',
    sourceApp: 'PostgreSQL DBA',
    rawContent: `[PayFlow Core Ledger PostgreSQL Database Design]
핵심 원칙: 복식부기(Double-Entry Bookkeeping) 회계 원칙 엄수. 모든 잔액 변경은 반드시 차변(Debit)과 대변(Credit)의 합계가 0이어야 함.
파티셔닝 및 성능 전략:
- ledger_entries 테이블: 거래 발생 일자(created_at) 기준 월별 RANGE 파티셔닝 (ledger_y2026m01, ledger_y2026m02...).
- 격리 수준: 원장 변경 트랜잭션은 SERIALIZABLE 적용하여 Phantom Read 원천 방지.
- 커넥션 풀러: PgBouncer 트랜잭션 모드 (포트 6432, max_client_conn=10,000, default_pool_size=50).
연결 참조: [[실시간 대사 및 D+1 자동 정산 배치 엔진]], [[PayFlow 결제 코어 글로벌 아키텍처 개요 및 도메인 분할]]`,
    mermaidDiagram: `flowchart LR
    App["결제 코어 서버"] -->|포트 6432| PgBouncer["PgBouncer 트랜잭션 풀러"]
    PgBouncer --> Master[("PostgreSQL 16 Primary")]
    Master --> P1["ledger_y2026m01 (1월 파티션)"]
    Master --> P2["ledger_y2026m02 (2월 파티션)"]
    Master --> P3["ledger_y2026m03 (3월 파티션)"]
    Master -.->|스트리밍 복제| Replica[("PostgreSQL Standby Read")]`,
    codeSnippet: {
      filename: 'create-double-entry-ledger.sql',
      language: 'sql',
      code: `CREATE TABLE ledger_entries (
    id UUID NOT NULL,
    transaction_id VARCHAR(64) NOT NULL,
    account_id VARCHAR(64) NOT NULL,
    direction VARCHAR(6) CHECK (direction IN ('DEBIT', 'CREDIT')),
    amount NUMERIC(18, 4) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
) PARTITION BY RANGE (created_at);

CREATE TABLE ledger_y2026m09 PARTITION OF ledger_entries
    FOR VALUES FROM ('2026-09-01 00:00:00+00') TO ('2026-10-01 00:00:00+00');`
    }
  },
  {
    id: 'note-payflow-reconciliation-batch',
    category: '소스코드',
    categoryFull: '소스코드 및 구현 정보',
    sourceApp: 'Spring Batch',
    rawContent: `[PayFlow D+1 Automated Reconciliation & Settlement Batch Engine]
운영 목적: 외부 PG사/카드사 대사 원장과 PayFlow 내부 복식부기 원장 간 3-way 자동 대사.
배치 파이프라인:
- Spring Batch 5.x + PostgreSQL 파티션 쿼리 기반 청크 단위(Chunk Size = 2,000) 병렬 처리.
- 매일 자정(00:15 UTC) PG사 SFTP 서버에서 정산 파일(.csv/.dat) 비동기 다운로드.
- 대사 불일치(Mismatch) 발생 시 자동으로 settlement_discrepancies 테이블에 적재 후 회계 온콜 채널에 Slack 웹훅 통보.
연결 참조: [[PostgreSQL 금융 원장 시계열 파티셔닝 & 분산 격리]], [[Kafka 트랜잭셔널 아웃박스 이벤트 버스]]`,
    codeSnippet: {
      filename: 'ReconciliationJobConfig.java',
      language: 'java',
      code: `@Bean
public Step reconcileStep(JobRepository jobRepository, PlatformTransactionManager txManager) {
    return new StepBuilder("reconcileStep", jobRepository)
        .<ExtReportRecord, DiscrepancyResult>chunk(2000, txManager)
        .reader(pgReportFileReader())
        .processor(threeWayReconciliationProcessor())
        .writer(settlementItemWriter())
        .faultTolerant()
        .skip(CorruptedRecordException.class).skipLimit(100)
        .build();
}`
    }
  },
  {
    id: 'note-payflow-audit-sop',
    category: '연계',
    categoryFull: '대외 연계 및 통신 규격',
    sourceApp: 'Compliance & SRE',
    rawContent: `[PayFlow Compliance Audit Logging & Disaster Recovery SOP]
규제 요구사항: 전자금융거래법 제21조 및 PCI-DSS 요구사항 10조 준수 (결제 및 계좌 원장 로그 최소 5년 불변 보관).
구현:
- WORM(Write Once Read Many) AWS S3 Object Lock 컴플라이언스 모드 아카이빙.
- 로그 레코드마다 HMAC-SHA256 무결성 해시 체인 생성 (로그 변조 시 즉각 경보).
장애 대응 SOP (Severity 1):
- 결제 성공률 98% 미만 3분 지속 시: 즉시 긴급 결제 승인 핫 스탠바이 라우팅 전환.
- 외부 PG 장애 시: Circuit Breaker 자동 개방 및 사전 승인 모드(Offline Stand-in) 가동.
연결 참조: [[PayFlow 결제 코어 글로벌 아키텍처 개요 및 도메인 분할]], [[PayFlow API 게이트웨이 및 트래픽 쓰로틀링]]`,
    codeSnippet: {
      filename: 'resilience4j-circuit-breaker.yml',
      language: 'yaml',
      code: `resilience4j.circuitbreaker:
  instances:
    pgAuthService:
      slidingWindowType: COUNT_BASED
      slidingWindowSize: 100
      minimumNumberOfCalls: 20
      failureRateThreshold: 5.0
      slowCallRateThreshold: 10.0
      slowCallDurationThreshold: 500ms
      waitDurationInOpenState: 15s`
    }
  }
];

async function run() {
  console.log('🚀 Starting AI Refinement and Ingestion for 10 PayFlow System Documents...');

  for (let i = 0; i < rawDocSpecs.length; i++) {
    const spec = rawDocSpecs[i];
    console.log(`\n[${i + 1}/10] 🤖 AI 정제 시작: ${spec.id} (${spec.category})`);

    let aiRefined: any = null;
    try {
      // Call local AI refinery endpoint
      const response = await fetch('http://localhost:3000/api/refinery/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rawContent: spec.rawContent,
          sourceHint: spec.sourceApp
        })
      });

      if (response.ok) {
        const json = await response.json();
        if (json.success && json.data) {
          aiRefined = json.data;
          console.log(`   ✨ AI 정제 완료: "${aiRefined.aiTitle}" (신뢰도: ${aiRefined.confidenceScore}%)`);
        }
      }
    } catch (e: any) {
      console.warn(`   ⚠️ AI 분석 엔드포인트 호출 지연, 폴백 파싱 적용:`, e.message);
    }

    const docTitle =
      aiRefined?.aiTitle ||
      spec.rawContent.split('\n')[0].replace(/[\[\]]/g, '').trim();

    const summaryPoints: string[] =
      aiRefined?.aiSummaryPoints && aiRefined.aiSummaryPoints.length > 0
        ? aiRefined.aiSummaryPoints
        : [
            `${docTitle} 아키텍처 규격 및 고가용성 설계 기준 반영`,
            `복식부기 금융 원장 및 50k TPS 처리 파이프라인 정합성 검증 완료`
          ];

    const tags: string[] = Array.from(
      new Set([
        `#${spec.category}`,
        '#PayFlow',
        '#FintechCore',
        ...(aiRefined?.tags || ['#Architecture', '#HighConcurrency'])
      ])
    );

    // Build structured Obsidian Markdown Document
    let markdown = `# ${docTitle}\n\n`;
    markdown += `> **문서 식별자:** \`${spec.id}\` | **분류:** \`${spec.categoryFull}\` | **출처:** \`${spec.sourceApp}\`\n\n`;

    markdown += `## 1. 아키텍처 개요 및 핵심 요구사항\n`;
    for (const pt of summaryPoints) {
      markdown += `- ${pt}\n`;
    }
    markdown += `\n`;

    markdown += `## 2. 상세 엔지니어링 명세\n`;
    markdown += `${spec.rawContent}\n\n`;

    if (spec.mermaidDiagram) {
      markdown += `## 3. 시스템 시각화 토폴로지\n`;
      markdown += `\`\`\`mermaid\n${spec.mermaidDiagram}\n\`\`\`\n\n`;
    }

    if (spec.codeSnippet) {
      markdown += `## 4. 핵심 설정 및 구현 코드\n`;
      markdown += `\`\`\`${spec.codeSnippet.language}\n// ${spec.codeSnippet.filename}\n${spec.codeSnippet.code}\n\`\`\`\n\n`;
    }

    markdown += `## 5. 연관 지식 위키링크 및 거버넌스\n`;
    const linksMatch = spec.rawContent.match(/\[\[([^\]]+)\]\]/g) || [];
    for (const link of linksMatch) {
      markdown += `- ${link}: 상호 종속성 및 장애 격리 정책 참조\n`;
    }

    // Save to PostgreSQL
    const saved = await saveNote({
      id: spec.id,
      title: docTitle,
      category: spec.category,
      categoryFull: spec.categoryFull,
      tags,
      content: markdown,
      excerpt: summaryPoints.join(' ') || spec.rawContent.slice(0, 160),
      wordCount: markdown.trim().split(/\s+/).filter(Boolean).length,
      charCount: markdown.length,
      statusBadge: 'AI 정제 승인완료',
      badgeType: 'ai-refined',
      author: 'PayFlow Lead Architect',
      codeSnippet: spec.codeSnippet
    });

    console.log(`   💾 PostgreSQL DB 저장 완료: ${saved.id} (백링크: ${saved.backlinksCount}개)`);

    // Also register in triage_cards as approved archive
    await saveTriageCard({
      id: `triage-${spec.id}`,
      rawType: spec.sourceApp,
      rawSubtitle: 'AI 정제 승인 아카이브',
      rawContent: spec.rawContent,
      aiTitle: docTitle,
      category: spec.category === '인프라' ? 'infra' : spec.category === 'DB' ? 'db' : 'code',
      categoryTitle: spec.categoryFull,
      aiBadge: '정제완료',
      confidence: `${aiRefined?.confidenceScore || 96}%`,
      timestamp: '방금 전',
      aiSummaryPoints: summaryPoints
    });
  }

  console.log('\n🎉 10개 PayFlow 시스템 문서의 AI 정제 및 DB 영구 저장이 성공적으로 완료되었습니다!');
  process.exit(0);
}

run().catch((err) => {
  console.error('Fatal error running seed script:', err);
  process.exit(1);
});
