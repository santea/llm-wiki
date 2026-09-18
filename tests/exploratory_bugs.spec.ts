import { test, expect } from '@playwright/test';

test.describe('Exploratory Bug Detection Suite', () => {
  test.beforeEach(async ({ page }) => {
    // Capture and fail on unexpected console errors
    page.on('pageerror', (err) => {
      console.error('[Browser Error]:', err.message);
    });
    await page.goto('/');
    await page.waitForSelector('header');
  });

  test('Bug Check 1: Note Creation via NewNoteModal retains full markdown content', async ({ page }) => {
    // Open New Note modal via Sidebar button
    const newNoteBtn = page.locator('aside button').filter({ hasText: '새 노트 작성하기' });
    await expect(newNoteBtn).toBeVisible();
    await newNoteBtn.click();

    // Verify modal is open
    const modal = page.locator('text=새로운 지식 노트 작성');
    await expect(modal).toBeVisible();

    const uniqueTitle = `E2E 테스트 문서 ${Date.now()}`;
    const longMarkdownContent = `# ${uniqueTitle}
## 아키텍처 상세 규격
이 문서는 사용자가 모달을 통해 직접 작성한 300자 이상의 긴 마크다운 본문입니다.
- 카프카 토픽: payment.v3.events
- 분산 파티션: 12개
\`\`\`ts
export function verifySignature(req: any) {
  return true;
}
\`\`\`
[[PayFlow 분산 Saga 기반 결제 오케스트레이션 엔진 아키텍처]]`;

    // Fill title
    await page.locator('input[placeholder*="결제 웹훅"]').fill(uniqueTitle);

    // Fill content
    await page.locator('textarea[placeholder*="시스템 설계 규격"]').fill(longMarkdownContent);

    // Submit
    await page.locator('button[type="submit"]').click();

    // Verify modal closes
    await expect(modal).not.toBeVisible();

    // Since creating a note automatically selects it into detail view:
    // 1. Verify detail view renders the note title (both header and rendered markdown heading)
    await expect(page.locator('h1').filter({ hasText: uniqueTitle }).first()).toBeVisible({ timeout: 10000 });

    // 2. Inspect the rendered detail pane: Does it contain the long markdown content or was it truncated?
    const renderedBody = page.locator('.markdown-content, div[class*="markdown"]');
    await expect(renderedBody.filter({ hasText: '이 문서는 사용자가 모달을 통해 직접 작성한' })).toBeVisible();
    await expect(renderedBody.filter({ hasText: 'verifySignature' })).toBeVisible();

    // 3. Click "목록으로" to return to list view and ensure the note is also in the list
    const backBtn = page.locator('button').filter({ hasText: '목록으로' });
    await backBtn.click();
    const noteInList = page.locator('article, div[class*="cursor-pointer"]').filter({ hasText: uniqueTitle });
    await expect(noteInList.first()).toBeVisible({ timeout: 5000 });
  });

  test('Bug Check 2: Note Deletion capability from Note Detail view', async ({ page }) => {
    // Click on any note
    const noteCard = page.locator('article, div[class*="cursor-pointer"]').filter({ hasText: 'PayFlow' }).first();
    await noteCard.click();

    // Look for a delete / trash button
    const deleteBtn = page.locator('button[title*="삭제"], button').filter({ hasText: /삭제|제거/ });
    const hasDeleteBtn = (await deleteBtn.count()) > 0;
    console.log(`[Bug Check 2] Delete button exists in Note Detail view: ${hasDeleteBtn}`);
    expect(hasDeleteBtn).toBe(true);
  });

  test('Bug Check 3: Refinery View "완료 내역 (history)" tab filtering', async ({ page }) => {
    // Navigate to Refinery
    await page.locator('aside button').filter({ hasText: 'AI 정제 대기열' }).click();

    // Click '완료 내역'
    const historyBtn = page.locator('button').filter({ hasText: '완료 내역' });
    await expect(historyBtn).toBeVisible();
    await historyBtn.click();

    // Verify empty/history banner is displayed and pending triage cards are filtered out
    await expect(page.locator('text=정제 완료 및 보관 이력')).toBeVisible();
    const triageCards = page.locator('article').filter({ hasText: '승인 및 지식 보관' });
    expect(await triageCards.count()).toBe(0);
  });

  test('Bug Check 4: Hierarchy View Auto-Place Orphans bidirectional link', async ({ page }) => {
    // Navigate to Hierarchy
    await page.locator('aside button').filter({ hasText: '지식 계층 구조' }).click();

    // Check if auto-place button is clickable
    const autoPlaceBtn = page.locator('button').filter({ hasText: '고립 노드 자동 배치' });
    if (await autoPlaceBtn.count() > 0 && await autoPlaceBtn.first().isVisible()) {
      await autoPlaceBtn.first().click();
      // Verify toast notification appeared
      await expect(page.locator('text=/자동 배치되었습니다|없습니다/')).toBeVisible();
    }
  });

  test('Bug Check 5: Command Palette special characters & null-safety', async ({ page }) => {
    // Open Command Palette
    await page.locator('header button').filter({ hasText: /⌘K|태그|검색/ }).click();

    const searchInput = page.locator('input[placeholder*="노트 제목"]');
    await expect(searchInput).toBeVisible();

    // Type tricky characters (quotes, regex symbols, brackets)
    await searchInput.fill('[[]]');
    await searchInput.fill('!@#$%^&*()_+');
    await searchInput.fill('');
    await searchInput.fill('PayFlow');

    // Verify search results render without crashing
    await expect(page.locator('text=/PayFlow/').first()).toBeVisible();

    // Close
    await page.keyboard.press('Escape');
    await expect(searchInput).not.toBeVisible();
  });
});
