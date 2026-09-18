import { test, expect } from '@playwright/test';

test.describe('Obsidian Slate E2E UI Test Suite', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to local dev server
    await page.goto('/');
    // Wait for the app to hydrate and initial notes to load
    await page.waitForSelector('header');
    await page.waitForSelector('aside');
  });

  test('01. Application Header & Sidebar Navigation Rendering', async ({ page }) => {
    // Check workspace selector dropdown button in header
    const workspaceBtn = page.locator('header button').filter({ hasText: /스페이스|엔지니어링/ });
    await expect(workspaceBtn.first()).toBeVisible();

    // Check all 7 navigation tabs in Sidebar
    const navItems = [
      '노트 & 에디터',
      'AI 지식 어시스턴트',
      '지식 그래프',
      '지식 계층 구조',
      'AI 정제 대기열',
      '분류 카테고리 & 룰',
      '에이전트 프롬프트 허브'
    ];

    for (const item of navItems) {
      const tabLocator = page.locator('aside button').filter({ hasText: item });
      await expect(tabLocator.first()).toBeVisible();
    }
  });

  test('02. Notes Repository: Note Selection & Markdown Rendering', async ({ page }) => {
    // Ensure we are on Notes tab
    await page.locator('aside button').filter({ hasText: '노트 & 에디터' }).click();

    // Wait for notes list to appear
    const noteItems = page.locator('article, div[class*="cursor-pointer"]').filter({ hasText: 'PayFlow' });
    await expect(noteItems.first()).toBeVisible({ timeout: 10000 });

    // Click the first PayFlow note
    await noteItems.first().click();

    // Verify note detail pane displays markdown content and title
    const mainContent = page.locator('main, section').filter({ hasText: 'PayFlow' });
    await expect(mainContent.first()).toBeVisible();

    // Check tags / backlinks presence
    const tagElements = page.locator('span').filter({ hasText: '#' });
    await expect(tagElements.first()).toBeVisible();
  });

  test('03. AI Knowledge Assistant (RAG Chat) Query & Response', async ({ page }) => {
    // Navigate to Chat tab
    await page.locator('aside button').filter({ hasText: 'AI 지식 어시스턴트' }).click();

    // Verify chat UI components
    const inputArea = page.locator('textarea[placeholder*="지식 검색, 질문"]');
    await expect(inputArea).toBeVisible({ timeout: 10000 });

    // Type a query
    await inputArea.fill('PayFlow 결제 코어 아키텍처 요약해줘');

    // Click send or press Enter
    await inputArea.press('Enter');

    // Verify user message appeared in chat history
    const userMsg = page.locator('div').filter({ hasText: 'PayFlow 결제 코어 아키텍처 요약해줘' });
    await expect(userMsg.first()).toBeVisible();

    // Wait for AI response message to arrive (either streaming or fallback)
    const assistantMsg = page.locator('div').filter({ hasText: 'PayFlow' });
    await expect(assistantMsg.first()).toBeVisible({ timeout: 20000 });
  });

  test('04. Knowledge Graph View: SVG Canvas & Topology Rendering', async ({ page }) => {
    // Navigate to Graph tab
    await page.locator('aside button').filter({ hasText: '지식 그래프' }).click();

    // Check SVG container is present
    const svgCanvas = page.locator('svg');
    await expect(svgCanvas.first()).toBeVisible({ timeout: 10000 });

    // Verify graph node elements (circles or groups) exist
    const graphNodes = page.locator('svg circle, svg g.cursor-pointer');
    const count = await graphNodes.count();
    expect(count).toBeGreaterThan(0);
  });

  test('05. Knowledge Hierarchy View: Depth Architecture (L1-L4)', async ({ page }) => {
    // Navigate to Hierarchy tab
    await page.locator('aside button').filter({ hasText: '지식 계층 구조' }).click();

    // Verify hierarchical categories are displayed
    const categoryHeadings = page.locator('text=/인프라|DB|소스코드|연계|워크플로우/');
    await expect(categoryHeadings.first()).toBeVisible({ timeout: 10000 });
  });

  test('06. AI Refinery Engine Queue: Triage Cards & View Modes', async ({ page }) => {
    // Navigate to Refinery tab
    await page.locator('aside button').filter({ hasText: 'AI 정제 대기열' }).click();

    // Verify Refinery header stats
    await expect(page.locator('text=Refinery Engine').first()).toBeVisible({ timeout: 10000 });

    // Verify confidence metric pill or percentage
    const confidenceMetric = page.locator('text=/%|일치율/');
    await expect(confidenceMetric.first()).toBeVisible();

    // Verify triage cards list
    const triageCards = page.locator('article, div[class*="rounded-xl"]').filter({ hasText: /일치|승인|제외/ });
    await expect(triageCards.first()).toBeVisible();

    // Check Split View vs Stacked View layout toggle
    const splitBtn = page.locator('button[title*="좌우"], button').filter({ hasText: /좌우|분할/ });
    if (await splitBtn.count() > 0) {
      await splitBtn.first().click();
    }
  });

  test('07. Taxonomy & Architecture Security Sandbox Modal', async ({ page }) => {
    // Navigate to Taxonomy tab
    await page.locator('aside button').filter({ hasText: '분류 카테고리 & 룰' }).click();

    // Verify rule list is displayed
    await expect(page.locator('text=분류 카테고리 & 가이드라인')).toBeVisible({ timeout: 10000 });

    // Click "룰 시뮬레이션" button to open sandbox modal
    const sandboxBtn = page.locator('button').filter({ hasText: '룰 시뮬레이션' });
    await expect(sandboxBtn).toBeVisible();
    await sandboxBtn.click();

    // Verify modal is open
    const modalTitle = page.locator('text=분류 룰 샌드박스 테스트');
    await expect(modalTitle).toBeVisible();

    // Run simulation inside modal
    const runSimBtn = page.locator('div.fixed button').filter({ hasText: '다시 판정하기' });
    await runSimBtn.click();

    // Verify result card
    await expect(page.locator('text=AI 판정 결과')).toBeVisible({ timeout: 10000 });

    // Close modal
    const closeBtn = page.locator('div.fixed button:has(svg.lucide-x)').first();
    await closeBtn.click();
    await expect(modalTitle).not.toBeVisible();
  });

  test('08. Agent Prompt Orchestrator: Presets & Live Sandbox Run', async ({ page }) => {
    // Navigate to Prompts tab
    await page.locator('aside button').filter({ hasText: '에이전트 프롬프트 허브' }).click();

    // Verify orchestrator view header
    await expect(page.locator('text=AI 에이전트 프롬프트 허브').first()).toBeVisible({ timeout: 10000 });

    // Verify category filter is visible
    const categoryFilter = page.locator('text=전체 에이전트');
    await expect(categoryFilter).toBeVisible();

    // Check prompt select dropdown
    const promptSelect = page.locator('select').first();
    await expect(promptSelect).toBeVisible();

    // Select a prompt in dropdown
    await promptSelect.selectOption({ index: 1 });

    // Check that right pane shows "실시간 AI 테스트 샌드박스"
    await expect(page.locator('text=실시간 AI 테스트 샌드박스')).toBeVisible();

    // Click "실시간 AI 실행 테스트"
    const testRunBtn = page.locator('button').filter({ hasText: '실시간 AI 실행 테스트' });
    await expect(testRunBtn).toBeVisible();
    await testRunBtn.click();

    // Wait for test execution result or status badge to appear
    const resultIndicator = page.locator('text=/실행 완료|토큰|테스트 결과|Unified Diff|코드|결과/i');
    await expect(resultIndicator.first()).toBeVisible({ timeout: 15000 });
  });

  test('09. Command Palette (Cmd+K) Modal & Quick Jump', async ({ page }) => {
    // Open Command Palette via Header button
    const searchTrigger = page.locator('header button').filter({ hasText: /⌘K|태그|검색/ });
    await searchTrigger.click();

    // Verify Command Palette modal is open
    const searchInput = page.locator('input[placeholder*="노트 제목"]');
    await expect(searchInput).toBeVisible();

    // Type "프롬프트"
    await searchInput.fill('프롬프트');

    // Click the quick action
    const promptAction = page.locator('button').filter({ hasText: 'AI 에이전트 프롬프트 허브' });
    await expect(promptAction).toBeVisible();
    await promptAction.click();

    // Check modal closed and active tab navigated to prompts
    await expect(searchInput).not.toBeVisible();
    await expect(page.locator('text=AI 에이전트 프롬프트 허브').first()).toBeVisible();
  });

  test('10. Obsidian Vault Import/Export Modal', async ({ page }) => {
    // Click "볼트 입출력" in header
    const vaultBtn = page.locator('header button').filter({ hasText: '볼트 입출력' });
    await expect(vaultBtn).toBeVisible();
    await vaultBtn.click();

    // Verify modal content
    const vaultModalTitle = page.locator('text=옵시디언 마크다운 볼트 가져오기 / 내보내기');
    await expect(vaultModalTitle).toBeVisible();

    // Switch to export tab
    const exportTabBtn = page.locator('div.fixed button').filter({ hasText: '볼트 내보내기' });
    await exportTabBtn.click();

    // Check export buttons exist
    const exportMdBtn = page.locator('button').filter({ hasText: /통합 마크다운|번들 마크다운/ });
    await expect(exportMdBtn).toBeVisible();

    // Close modal
    const closeBtn = page.locator('div.fixed button:has(svg.lucide-x)').first();
    await closeBtn.click();
    await expect(vaultModalTitle).not.toBeVisible();
  });
});
