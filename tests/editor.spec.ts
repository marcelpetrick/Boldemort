import { expect, test } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { readFile } from 'node:fs/promises';

test.beforeEach(async ({ page }) => {
  await page.goto('./');
  await expect(page.getByRole('textbox', { name: 'Your draft' })).toBeVisible();
});
test('formats selection, combines styles, and restores exact Markdown and edits', async ({
  page,
}) => {
  const draft = page.getByRole('textbox', { name: 'Your draft' });
  await page.getByRole('button', { name: 'Markdown', exact: true }).click();
  await draft.fill('Hello.\n\n# Topic\n\n[Source](https://example.com)');
  await draft.evaluate((el) =>
    (el as HTMLTextAreaElement).setSelectionRange(0, 5),
  );
  await page.getByRole('button', { name: 'Bold', exact: true }).click();
  await expect(draft).toHaveValue(/^\*\*Hello\*\*\./u);
  await page.getByRole('button', { name: 'Italic', exact: true }).click();
  await expect(draft).toHaveValue(/^\*\*\*Hello\*\*\*\./u);
  await page.getByRole('button', { name: 'Unicode', exact: true }).click();
  await expect(draft).toHaveValue(/^𝑯𝒆𝒍𝒍𝒐\.\n\n# Topic/u);
  await expect(page.getByRole('status')).toContainText('Complex Markdown');
  await draft.press('Control+End');
  await draft.press('End');
  await draft.press('Enter');
  await draft.pressSequentially('More');
  await page.getByRole('button', { name: 'Markdown', exact: true }).click();
  await expect(draft).toHaveValue(
    '***Hello***.\n\n# Topic\n\n[Source](https://example.com)\nMore',
  );
  await draft.press('Control+z');
  await expect(draft).toHaveValue(/^𝑯𝒆𝒍𝒍𝒐/u);
  await draft.press('Control+Shift+z');
  await expect(draft).toHaveValue(/^\*\*\*Hello/u);
});

test('arms Markdown typing, handles composition, and keeps manual drafts', async ({
  page,
}) => {
  const draft = page.locator('#editor');
  await page.getByRole('button', { name: 'Markdown', exact: true }).click();
  await page.getByRole('button', { name: 'Bold', exact: true }).click();
  await draft.pressSequentially('one two');
  await expect(draft).toHaveValue('**one two**');
  await page.getByRole('button', { name: 'Bold', exact: true }).click();
  await draft.pressSequentially(' three');
  await expect(draft).toHaveValue('**one two** three');
  await draft.evaluate((element) => {
    const editor = element as HTMLTextAreaElement;
    editor.dispatchEvent(
      new CompositionEvent('compositionstart', { bubbles: true }),
    );
    editor.value += ' 日本語';
    editor.dispatchEvent(
      new InputEvent('input', { bubbles: true, isComposing: true }),
    );
    editor.dispatchEvent(
      new CompositionEvent('compositionend', { bubbles: true, data: '日本語' }),
    );
  });
  await expect(draft).toHaveValue('**one two** three 日本語');
  await page.getByRole('button', { name: 'Clear draft' }).click();
  await page.getByRole('button', { name: 'Cancel' }).click();
  await expect(draft).toHaveValue(/日本語/u);
  await page.getByRole('button', { name: 'Clear draft' }).click();
  await page
    .getByRole('dialog')
    .getByRole('button', { name: 'Clear draft' })
    .click();
  await expect(draft).toHaveValue('');
  await page.getByRole('button', { name: 'Undo' }).click();
  await expect(draft).toHaveValue(/日本語/u);
  await page.reload();
  await expect(draft).toHaveValue('');
});

test('copies either representation and exports UTF-8', async ({ page }) => {
  const draft = page.locator('#editor');
  await page.evaluate(() => {
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: {
        writeText: (text: string) => {
          document.body.dataset.clipboard = text;
          return Promise.resolve();
        },
      },
    });
  });
  await draft.fill('𝐇𝐞𝐥𝐥𝐨 👩🏽‍💻');
  await page.locator('#output').selectOption('markdown');
  await page.getByRole('button', { name: 'Copy all' }).click();
  await expect(page.locator('body')).toHaveAttribute(
    'data-clipboard',
    '**Hello** 👩🏽‍💻',
  );
  const downloadReady = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Export' }).click();
  const download = await downloadReady;
  expect(download.suggestedFilename()).toBe('boldemort-draft.md');
  expect(await readFile(await download.path(), 'utf8')).toBe('**Hello** 👩🏽‍💻');
  await page.locator('#output').selectOption('unicode');
  await page.getByRole('button', { name: 'Copy all' }).click();
  await expect(page.locator('body')).toHaveAttribute(
    'data-clipboard',
    '𝐇𝐞𝐥𝐥𝐨 👩🏽‍💻',
  );
  await page.evaluate(() => {
    Object.defineProperty(navigator, 'clipboard', { value: undefined });
  });
  await page.getByRole('button', { name: 'Copy all' }).click();
  await expect(
    page.getByRole('dialog', { name: 'Copy manually' }),
  ).toBeVisible();
  await expect(page.locator('#manual-output')).toHaveText('𝐇𝐞𝐥𝐥𝐨 👩🏽‍💻');
  await expect(draft).toHaveValue('𝐇𝐞𝐥𝐥𝐨 👩🏽‍💻');
});

test('calculates metrics and output limits and exposes advisory diagnostics', async ({
  page,
}) => {
  await page.getByRole('button', { name: 'Markdown', exact: true }).click();
  const draft = page.locator('#editor');
  await draft.fill('One. Two three. Four five six.');
  await expect(page.locator('#words')).toHaveText('6');
  await expect(page.locator('#average')).toHaveText('2');
  await expect(page.locator('#median')).toHaveText('2');
  await page.locator('#destination').selectOption('note');
  await draft.fill('𝑨'.repeat(110));
  await expect(page.locator('#limit')).toContainText('20 over');
  await draft.fill('Opening.\n\n```js\nconst answer = 42;');
  await page.getByText('Writing hints').click();
  await expect(page.getByRole('button', { name: /^Line 3/ })).toBeVisible();
  await page.getByRole('button', { name: /^Line 3/ }).click();
  await expect(draft).toBeFocused();
  await expect(page.locator('.flagged')).toHaveCount(1);
});

test('staged help, localization, dark theme, responsive reflow and accessibility', async ({
  page,
}) => {
  await page.setViewportSize({ width: 800, height: 600 });
  await page.clock.install();
  await page.getByRole('button', { name: 'Bold', exact: true }).hover();
  await expect(page.getByRole('tooltip')).toHaveText('Toggle bold.');
  await page.clock.fastForward(3950);
  await expect(page.getByRole('tooltip')).not.toContainText('Ctrl');
  await page.clock.fastForward(75);
  await expect(page.getByRole('tooltip')).toContainText('Ctrl');
  await page.keyboard.press('Escape');
  await expect(page.getByRole('tooltip')).toBeHidden();
  await page.locator('#language').selectOption('de');
  await expect(
    page.getByRole('textbox', { name: 'Dein Entwurf' }),
  ).toBeVisible();
  await page.locator('#theme').selectOption('dark');
  await expect(page.locator('html')).toHaveCSS('color-scheme', 'dark');
  await page.setViewportSize({ width: 320, height: 240 });
  expect(
    await page.evaluate(() => document.documentElement.scrollWidth),
  ).toBeLessThanOrEqual(320);
  await expect(
    page.getByRole('button', { name: 'Alles kopieren' }),
  ).toBeVisible();
  const { violations } = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
    .analyze();
  expect(violations).toEqual([]);
});
