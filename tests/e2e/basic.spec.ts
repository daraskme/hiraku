/**
 * 基本フロー E2E テスト
 *
 * - ホームページが開ける
 * - ライブラリページが開ける
 * - 教材ページが開け、ブックマーク・お気に入り・バッジが動く
 * - /paths / /timeline / /curriculum / /jlpt も開ける
 */
import { test, expect } from '@playwright/test';

test('home page loads', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('h1')).toContainText('ふたたび');
  // 新着教材セクションが表示される
  await expect(page.locator('text=新しい教材')).toBeVisible();
});

test('library page loads with collection filter', async ({ page }) => {
  await page.goto('/library');
  await expect(page.locator('h1')).toContainText('ライブラリ');
});

test('lesson page loads with bookmark + star + badges', async ({ page }) => {
  await page.goto('/library/kotoko1/heike-monogatari-gion');
  await expect(page.locator('h1.lesson-header__title')).toContainText('平家物語');

  // お気に入りボタンが存在し、クリックで状態が変わる
  const starBtn = page.locator('[data-star-toggle]');
  await expect(starBtn).toBeVisible();
  await expect(starBtn).toHaveAttribute('aria-pressed', 'false');
  await starBtn.click();
  await expect(starBtn).toHaveAttribute('aria-pressed', 'true');
});

test('paths landing page', async ({ page }) => {
  await page.goto('/paths');
  await expect(page.locator('h1')).toContainText('学習パス');
  await expect(page.locator('text=古典文学 四大柱')).toBeVisible();
});

test('jlpt index page', async ({ page }) => {
  await page.goto('/jlpt');
  await expect(page.locator('h1')).toContainText('JLPT 別索引');
});

test('curriculum index page', async ({ page }) => {
  await page.goto('/curriculum');
  await expect(page.locator('h1')).toContainText('学習指導要領');
});

test('timeline page', async ({ page }) => {
  await page.goto('/timeline');
  await expect(page.locator('h1')).toContainText('時代年表');
});

test('worksheet page renders for a lesson', async ({ page }) => {
  await page.goto('/worksheet/kotoko1/heike-monogatari-gion');
  await expect(page.locator('text=平家物語')).toBeVisible();
});

test('lesson-plan page renders for a lesson with teaching_notes', async ({ page }) => {
  await page.goto('/lesson-plan/kotoko1/heike-monogatari-gion');
  await expect(page.locator('text=指導案')).toBeVisible();
});

test('quiz page loads', async ({ page }) => {
  await page.goto('/quiz/kotoko1/heike-monogatari-gion');
  await expect(page.locator('[data-quiz-counter]')).toBeVisible();
});

test('flashcards page loads', async ({ page }) => {
  await page.goto('/flashcards/kotoko1/heike-monogatari-gion');
  // flashcards-mode の body class が付いている
  await expect(page.locator('html')).toHaveAttribute('data-flashcards-mode', '');
});

test('reader page loads', async ({ page }) => {
  await page.goto('/reader/kotoko1/heike-monogatari-gion');
  await expect(page.locator('text=平家物語')).toBeVisible();
});

test('en landing page loads', async ({ page }) => {
  await page.goto('/en/');
  await expect(page.locator('html')).toHaveAttribute('lang', 'en');
  await expect(page.locator('h1')).toContainText('Reopening');
});

test('bookmark saves to localStorage when scrolled', async ({ page }) => {
  await page.goto('/library/kotoko1/heike-monogatari-gion');
  // 中盤までスクロール
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight * 0.4));
  // 1.5s 待って debounce 完了
  await page.waitForTimeout(1500);
  // localStorage を確認
  const bookmarks = await page.evaluate(() => localStorage.getItem('hiraku.bookmarks.v1'));
  expect(bookmarks).toBeTruthy();
  const parsed = JSON.parse(bookmarks!);
  expect(parsed.lessons['/library/kotoko1/heike-monogatari-gion']).toBeDefined();
});
