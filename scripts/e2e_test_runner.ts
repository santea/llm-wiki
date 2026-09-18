import { GoogleGenAI } from '@google/genai';

interface TestStep {
  name: string;
  run: () => Promise<void>;
}

const BASE_URL = 'http://localhost:3000';
let failedCount = 0;
let passedCount = 0;

async function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(`Assertion failed: ${message}`);
  }
}

async function request(path: string, options: RequestInit = {}) {
  const url = `${BASE_URL}${path}`;
  const res = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {})
    }
  });
  const text = await res.text();
  let json: any = null;
  try {
    json = JSON.parse(text);
  } catch {
    // text output
  }
  return { status: res.status, ok: res.ok, json, text };
}

async function runTest(name: string, fn: () => Promise<void>) {
  process.stdout.write(`⏳ [TEST] ${name} ... `);
  const start = Date.now();
  try {
    await fn();
    const duration = Date.now() - start;
    console.log(`✅ PASS (${duration}ms)`);
    passedCount++;
  } catch (err: any) {
    const duration = Date.now() - start;
    console.log(`❌ FAIL (${duration}ms): ${err.message}`);
    failedCount++;
  }
}

async function main() {
  console.log('====================================================');
  console.log('🚀 Obsidian Slate Comprehensive E2E Test Suite');
  console.log('====================================================\n');

  // 1. Health & Database connection
  await runTest('Health Check & DB Connection', async () => {
    const res = await request('/api/health');
    await assert(res.ok, `Health endpoint HTTP ${res.status}`);
    await assert(res.json?.status === 'ok', 'Status is not ok');
    await assert(res.json?.dbConfigured === true, 'Database is not configured');
    await assert(typeof res.json?.llmProvider === 'string', 'Missing llmProvider in health check');
    await assert(typeof res.json?.openAIBaseUrl === 'string', 'Missing openAIBaseUrl in health check');
    await assert(typeof res.json?.stats?.documentsCount === 'number', 'Missing documentsCount in stats');
  });

  // 2. Stats endpoint
  await runTest('System Topology & Embedding Stats', async () => {
    const res = await request('/api/stats');
    await assert(res.ok, `Stats endpoint HTTP ${res.status}`);
    await assert(res.json?.success === true, 'Success is false');
    const { documentsCount, embeddingsCount, backlinksCount } = res.json.stats;
    await assert(documentsCount >= 10, `Expected at least 10 documents, got ${documentsCount}`);
    await assert(embeddingsCount >= 10, `Expected embeddings, got ${embeddingsCount}`);
    await assert(backlinksCount >= 10, `Expected backlinks, got ${backlinksCount}`);
  });

  // 3. Notes CRUD & WikiLink parsing
  let testNoteId = `e2e-note-${Date.now()}`;
  await runTest('Notes API: Create & pgvector indexing', async () => {
    const res = await request('/api/notes', {
      method: 'POST',
      body: JSON.stringify({
        id: testNoteId,
        title: 'E2E 분산 트랜잭션 점검 노트',
        category: '워크플로우',
        tags: ['#E2E', '#Testing', '#Saga'],
        content: '# E2E 분산 트랜잭션\n이 문서는 [[PayFlow 코어 결제]] 및 [[Kafka 클러스터]]를 참조합니다.',
        excerpt: 'E2E 분산 트랜잭션 테스트',
        statusBadge: 'E2E 검증',
        badgeType: 'manual'
      })
    });
    await assert(res.ok, `Create note failed: ${res.status}`);
    await assert(res.json?.success === true, 'Note save unsuccessful');
    await assert(res.json?.note?.id === testNoteId, 'Note ID mismatch');
    await assert(res.json?.note?.connectedNodes?.includes('[[PayFlow 코어 결제]]'), 'Wikilink not extracted');
  });

  await runTest('Notes API: Read List & Single Retrieval', async () => {
    const res = await request('/api/notes');
    await assert(res.ok, 'Failed to fetch notes list');
    const found = res.json?.notes?.find((n: any) => n.id === testNoteId);
    await assert(Boolean(found), `Newly created note ${testNoteId} not found in list`);
    await assert(found.tags.includes('#E2E'), 'Tags not preserved');
  });

  await runTest('Notes API: Update & Content Edit', async () => {
    const res = await request(`/api/notes/${testNoteId}`, {
      method: 'PUT',
      body: JSON.stringify({
        title: 'E2E 분산 트랜잭션 점검 노트 (수정됨)',
        category: '워크플로우',
        tags: ['#E2E', '#Testing', '#Updated'],
        content: '# E2E 분산 트랜잭션 (수정)\n추가 내용 및 [[Redis 분산 캐시]] 연결.',
        excerpt: '수정된 E2E 요약'
      })
    });
    await assert(res.ok, 'Failed to update note');
    await assert(res.json?.note?.title?.includes('(수정됨)'), 'Title was not updated');
    await assert(res.json?.note?.connectedNodes?.includes('[[Redis 분산 캐시]]'), 'Updated wikilink not extracted');
  });

  await runTest('Notes API: Delete Note', async () => {
    const res = await request(`/api/notes/${testNoteId}`, {
      method: 'DELETE'
    });
    await assert(res.ok, 'Failed to delete note');
    await assert(res.json?.success === true, 'Delete return not true');

    // Confirm it is gone
    const listRes = await request('/api/notes');
    const exists = listRes.json?.notes?.some((n: any) => n.id === testNoteId);
    await assert(!exists, 'Note still exists after deletion');
  });

  // 4. Classification Rules CRUD & Sandbox Test
  let testRuleId = `rule-e2e-${Date.now()}`;
  await runTest('Architecture Rules: Create & Toggle', async () => {
    const res = await request('/api/rules', {
      method: 'POST',
      body: JSON.stringify({
        id: testRuleId,
        name: 'E2E 임시 테스트 규정',
        nameEn: 'E2E Temporary Rule',
        level: 'Standard',
        color: '#4cd7f6',
        icon: 'code',
        enabled: true,
        tags: ['#E2E', '#Security'],
        detectionLogic: 'E2E 키워드 감지'
      })
    });
    await assert(res.ok, 'Failed to create rule');
    await assert(res.json?.rule?.id === testRuleId, 'Rule ID mismatch');

    // Toggle off
    const toggleRes = await request(`/api/rules/${testRuleId}/toggle`, { method: 'PUT' });
    await assert(toggleRes.ok, 'Failed to toggle rule');
    await assert(toggleRes.json?.rule?.enabled === false, 'Rule not toggled to false');

    // Delete rule
    const delRes = await request(`/api/rules/${testRuleId}`, { method: 'DELETE' });
    await assert(delRes.ok, 'Failed to delete rule');
  });

  await runTest('Architecture Rules: Security Sandbox Masking & Audit', async () => {
    const rawInput = 'curl -H "Authorization: Bearer my_secret_token_12345" http://192.168.1.105:8080/api/v1/transfer';
    const res = await request('/api/rules/test', {
      method: 'POST',
      body: JSON.stringify({ text: rawInput })
    });
    await assert(res.ok, `Sandbox test failed: ${res.status}`);
    await assert(res.json?.success === true, 'Sandbox test response not success');
    await assert(res.json?.maskedOutput?.includes('[IP MASKED]'), 'IP was not masked');
    await assert(res.json?.maskedOutput?.includes('[TOKEN MASKED]'), 'Token was not masked');
    await assert(Array.isArray(res.json?.categories), 'Categories must be an array');
  });

  // 5. Triage Cards & Refinery Engine
  let testCardId = `card-e2e-${Date.now()}`;
  await runTest('Triage Cards: Create, Read, Delete', async () => {
    const res = await request('/api/triage', {
      method: 'POST',
      body: JSON.stringify({
        id: testCardId,
        category: 'code',
        categoryTitle: '소스코드 및 구현 정보',
        rawContent: 'const paymentRetryLimit = 3;',
        aiTitle: '결제 재시도 설정',
        aiBadge: 'E2E 추출',
        tags: ['#Retry', '#Payment'],
        confidence: '95.2% 일치'
      })
    });
    await assert(res.ok, 'Failed to create triage card');
    await assert(res.json?.card?.id === testCardId, 'Card ID mismatch');

    const delRes = await request(`/api/triage/${testCardId}`, { method: 'DELETE' });
    await assert(delRes.ok, 'Failed to delete triage card');
  });

  await runTest('Refinery Engine: Real-time Ingestion & Analysis', async () => {
    const sampleInput = `[11:00 AM] 결제 게이트웨이 Timeout 에러율이 3.2%로 증가하여 Envoy Proxy의 idle_timeout을 15s로 변경하고 Spring retry backoff를 500ms로 상향했습니다.`;
    const res = await request('/api/refinery/analyze', {
      method: 'POST',
      body: JSON.stringify({ rawContent: sampleInput, sourceHint: 'Slack #payment-alerts' })
    });
    await assert(res.ok, `Refinery analyze failed: ${res.status}`);
    await assert(res.json?.success === true, 'Refinery response not success');
    const data = res.json?.data;
    await assert(Boolean(data?.aiTitle), 'Missing refined aiTitle');
    await assert(Array.isArray(data?.tags), 'Tags must be array');
    await assert(typeof data?.confidenceScore === 'number', 'Missing numeric confidenceScore');
  });

  // 6. AI Agent Prompts Orchestration Hub
  await runTest('Agent Prompts: Seeded 6 Core Presets Verification', async () => {
    const res = await request('/api/agent-prompts');
    await assert(res.ok, 'Failed to fetch agent prompts');
    await assert(res.json?.success === true, 'Agent prompts endpoint not successful');
    await assert(res.json?.count >= 6, `Expected at least 6 agent prompts, got ${res.json?.count}`);

    const types = res.json?.prompts?.map((p: any) => p.agentType);
    const required = [
      'refinery-ingestion',
      'rag-synthesizer',
      'diff-proposer',
      'security-auditor',
      'backlink-recommender',
      'mermaid-architect'
    ];
    for (const reqType of required) {
      await assert(types.includes(reqType), `Missing core agent preset: ${reqType}`);
    }
  });

  let customPromptId = `prompt-e2e-${Date.now()}`;
  await runTest('Agent Prompts: Custom Prompt CRUD & Hot-swapping', async () => {
    // 1. Create custom prompt
    const res = await request('/api/agent-prompts', {
      method: 'POST',
      body: JSON.stringify({
        id: customPromptId,
        title: 'E2E 커스텀 정제소 프롬프트',
        agentType: 'refinery-ingestion',
        roleDescription: 'E2E 테스트 목적의 커스텀 정제 프롬프트',
        systemPrompt: '당신은 E2E 테스트 정제 엔진입니다.',
        userPromptTemplate: '입력: {{sourceContent}}',
        variables: ['sourceContent'],
        model: 'gpt-4o-mini',
        temperature: 0.15,
        isActive: false,
        version: '1.0.0-e2e',
        tags: ['#E2E', '#Custom']
      })
    });
    await assert(res.ok, 'Failed to save custom agent prompt');
    await assert(res.json?.prompt?.id === customPromptId, 'Prompt ID mismatch');

    // 2. Activate it
    const actRes = await request(`/api/agent-prompts/${customPromptId}/activate`, {
      method: 'POST',
      body: JSON.stringify({ agentType: 'refinery-ingestion' })
    });
    await assert(actRes.ok, 'Failed to activate prompt');

    // 3. Verify it is now the active prompt
    const listRes = await request('/api/agent-prompts');
    const activeItem = listRes.json?.prompts?.find((p: any) => p.id === customPromptId);
    await assert(activeItem?.isActive === true, 'Custom prompt was not set to active');

    // Restore default prompt activation
    await request('/api/agent-prompts/prompt-refinery-default/activate', {
      method: 'POST',
      body: JSON.stringify({ agentType: 'refinery-ingestion' })
    });

    // 4. Delete custom prompt
    const delRes = await request(`/api/agent-prompts/${customPromptId}`, { method: 'DELETE' });
    await assert(delRes.ok, 'Failed to delete custom prompt');
  });

  await runTest('Agent Prompts: Live Variable Sandbox Run Endpoint', async () => {
    const res = await request('/api/agent-prompts/test-run', {
      method: 'POST',
      body: JSON.stringify({
        systemPrompt: '당신은 단위 테스트 봇입니다. 입력된 단어를 그대로 대문자로 변환하여 응답하세요.',
        userPromptTemplate: '테스트 단어: {{targetWord}}',
        variables: { targetWord: 'obsidian slate' },
        model: 'gpt-4o-mini',
        temperature: 0.1
      })
    });
    await assert(res.ok, `test-run endpoint returned HTTP ${res.status}`);
    await assert(res.json?.success === true, 'test-run did not succeed');
    await assert(Boolean(res.json?.outputText), 'Missing outputText in test-run');
    await assert(typeof res.json?.latencyMs === 'number', 'Missing latencyMs');
  });

  // 7. AI Diff Proposal
  await runTest('AI Diff Proposal API', async () => {
    const res = await request('/api/ai/diff', {
      method: 'POST',
      body: JSON.stringify({
        docId: 'doc-payment-v2',
        docTitle: '결제 분산 트랜잭션 명세',
        currentContent: '# 결제 분산 트랜잭션 명세\nKafka 기반 이벤트 발행.',
        userRequest: 'Redis Idempotency-Key 검증 단계 추가'
      })
    });
    await assert(res.ok, `ai/diff failed: ${res.status}`);
    await assert(res.json?.success === true, 'ai/diff response not successful');
    const diff = res.json?.diffProposal;
    await assert(Boolean(diff?.updatedFullContent), 'Missing updatedFullContent in diff');
    await assert(Array.isArray(diff?.lines), 'Missing lines in diff proposal');
  });

  // 8. AI RAG Chat Reasoning
  await runTest('AI RAG Chat Reasoning API', async () => {
    const res = await request('/api/ai/chat', {
      method: 'POST',
      body: JSON.stringify({
        message: 'PostgreSQL pgvector 인덱스 추천을 간단히 알려줘',
        contextNotes: [
          { title: 'PostgreSQL pgvector 지식 저장소', excerpt: 'HNSW 인덱스를 사용하며 m=16 설정 권장.' }
        ]
      })
    });
    await assert(res.ok, `ai/chat failed: ${res.status}`);
    await assert(Boolean(res.json?.text), 'ai/chat returned empty text');
  });

  // 9. Client Web Page & Asset Resolution
  await runTest('Client HTML & Bundled JavaScript Chunks Resolution', async () => {
    const res = await request('/');
    await assert(res.ok, 'Root index.html not served');
    await assert(res.text?.includes('<div id="root"></div>'), 'Root container missing in HTML');

    // Extract script src tags from HTML
    const scriptRegex = /<script\s+[^>]*src="([^"]+)"/g;
    const matches = [];
    let m;
    while ((m = scriptRegex.exec(res.text)) !== null) {
      matches.push(m[1]);
    }
    await assert(matches.length > 0, 'No scripts found in index.html');

    for (const scriptUrl of matches) {
      const assetRes = await request(scriptUrl);
      await assert(assetRes.ok, `Client asset ${scriptUrl} failed to load (HTTP ${assetRes.status})`);
      await assert(assetRes.text.length > 0, `Client asset ${scriptUrl} is empty`);
    }
  });

  console.log('\n====================================================');
  console.log(`📊 E2E Test Summary: Total ${passedCount + failedCount} | Passed: ${passedCount} | Failed: ${failedCount}`);
  console.log('====================================================');

  if (failedCount > 0) {
    process.exit(1);
  }
}

main().catch((err) => {
  console.error('Fatal Test Runner Error:', err);
  process.exit(1);
});
