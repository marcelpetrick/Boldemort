import { expect, test } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { readFile, writeFile } from 'node:fs/promises';
import { draftKey, draftPreferenceKey } from '../src/draft.ts';

test.afterEach(async ({ page }, info) => {
  if (process.env.BOLD_COVERAGE !== '1') return;
  const counters = await page.evaluate(() =>
    Reflect.get(window, '__coverage__'),
  );
  if (!counters)
    throw new Error('Coverage build did not expose browser counters.');
  await writeFile(info.outputPath('istanbul.json'), JSON.stringify(counters));
});

test.beforeEach(async ({ page }) => {
  await page.goto('./');
  await expect(page.locator('#editor')).toBeVisible();
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
});

test('saves the exact draft and editing mode across reload and a new tab', async ({
  page,
  context,
}) => {
  const draft = page.locator('#editor');
  await expect(
    page.getByRole('checkbox', { name: 'Save draft locally' }),
  ).toBeChecked();
  await page.getByRole('button', { name: 'Markdown', exact: true }).click();
  await draft.fill('__Hello__, [source](https://example.com)\n\n- Item\n');
  await page.getByRole('button', { name: 'Unicode', exact: true }).click();
  await draft.press('Control+End');
  await draft.pressSequentially('More');
  const unicode = await draft.inputValue();
  await page.reload();
  await expect(draft).toHaveValue(unicode);
  await expect(page.getByRole('button', { name: 'Undo' })).toHaveAttribute(
    'aria-disabled',
    'true',
  );
  const url = page.url();
  // Keep the fixture page open for the browser coverage hook.
  const writer = await context.newPage();
  await writer.goto(url);
  await writer.locator('#editor').press('End');
  await writer.locator('#editor').pressSequentially(' text');
  await writer.close();
  const reopened = await context.newPage();
  await reopened.goto(url);
  await expect(
    reopened.getByRole('button', { name: 'Unicode', exact: true }),
  ).toHaveAttribute('aria-pressed', 'true');
  await expect(reopened.locator('#editor')).toHaveValue(unicode + ' text');
  await reopened.getByRole('button', { name: 'Markdown', exact: true }).click();
  await expect(reopened.locator('#editor')).toHaveValue(
    '__Hello__, [source](https://example.com)\n\n- Item\nMore text',
  );
  await reopened.reload();
  await expect(
    reopened.getByRole('button', { name: 'Markdown', exact: true }),
  ).toHaveAttribute('aria-pressed', 'true');
  await expect(reopened.locator('#editor')).toHaveValue(
    '__Hello__, [source](https://example.com)\n\n- Item\nMore text',
  );
});

test('turning off saving removes the browser copy and keeps the open draft', async ({
  page,
  context,
}) => {
  const editor = page.locator('#editor');
  const saving = page.getByRole('checkbox', { name: 'Save draft locally' });
  await editor.fill('Saved text');
  const other = await context.newPage();
  await other.goto(page.url());
  await expect(other.locator('#editor')).toHaveValue('Saved text');
  await saving.uncheck();
  await expect(editor).toHaveValue('Saved text');
  await expect(
    other.getByRole('checkbox', { name: 'Save draft locally' }),
  ).not.toBeChecked();
  await other.locator('#editor').fill('Still open');
  await editor.fill('Current tab only');
  await other.reload();
  await expect(other.locator('#editor')).toHaveValue('');
  await expect(
    other.getByRole('checkbox', { name: 'Save draft locally' }),
  ).not.toBeChecked();
  await saving.check();
  await other.reload();
  await expect(saving).toBeChecked();
  await expect(other.locator('#editor')).toHaveValue('Current tab only');
  await other.locator('#editor').fill('Saved at the new location');
  await expect(saving).toBeChecked();
});

for (const reenable of [false, true]) {
  test(`an edit already in flight cannot republish a retired draft (reenable=${String(reenable)})`, async ({
    page,
    context,
  }) => {
    const writer = page;
    const toggler = await context.newPage();
    await toggler.goto(page.url());
    await writer.locator('#editor').fill('Originally saved');
    let resume!: () => void;
    const resumed = new Promise<void>((resolve) => {
      resume = resolve;
    });
    const reading = writer.waitForRequest('**/pause-draft-write');
    await writer.route('**/pause-draft-write', async (route) => {
      await resumed;
      await route.fulfill({ status: 204 });
    });
    await writer.evaluate((key) => {
      const storage = window.localStorage;
      let paused = false;
      Object.defineProperty(window, 'localStorage', {
        value: {
          getItem: storage.getItem.bind(storage),
          setItem(name: string, value: string) {
            if (!paused && name === key && value.includes('Racing edit')) {
              paused = true;
              // Hold the actual write, after the location has been selected.
              const gate = new XMLHttpRequest();
              gate.open('GET', './pause-draft-write', false);
              gate.send();
            }
            storage.setItem(name, value);
          },
          removeItem: storage.removeItem.bind(storage),
        },
      });
    }, draftKey);
    const writing = writer.locator('#editor').fill('Racing edit');
    await reading;
    const saving = toggler.getByRole('checkbox', {
      name: 'Save draft locally',
    });
    try {
      await saving.uncheck();
      if (reenable) {
        await saving.check();
        await toggler.locator('#editor').fill('Replacement draft');
      } else {
        // The writer must be able to clean up even if the other tab has closed.
        await toggler.close();
      }
    } finally {
      resume();
    }
    await writing;
    const writerSaving = writer.getByRole('checkbox', {
      name: 'Save draft locally',
    });
    await expect(writerSaving).toBeChecked({ checked: reenable });
    await expect
      .poll(() => page.evaluate((key) => localStorage.getItem(key), draftKey))
      .toBe(null);
    const reader = await context.newPage();
    await reader.goto(page.url());
    await expect(reader.locator('#editor')).toHaveValue(
      reenable ? 'Replacement draft' : '',
    );
    await expect(
      reader.getByRole('checkbox', { name: 'Save draft locally' }),
    ).toBeChecked({ checked: reenable });
  });
}

test('rechecks the storage preference after a write before storage events arrive', async ({
  page,
}) => {
  await page.evaluate(
    ([draft, preference]) => {
      const storage = window.localStorage;
      Object.defineProperty(window, 'localStorage', {
        value: {
          getItem: storage.getItem.bind(storage),
          setItem(key: string, value: string) {
            storage.setItem(key, value);
            if (key === draft) storage.setItem(preference, '!');
          },
          removeItem: storage.removeItem.bind(storage),
        },
      });
    },
    [draftKey, draftPreferenceKey] as const,
  );
  await page.locator('#editor').fill('Uncommitted tab edit');
  await expect(
    page.getByRole('checkbox', { name: 'Save draft locally' }),
  ).not.toBeChecked();
  await expect(
    page.evaluate((key) => localStorage.getItem(key), draftKey),
  ).resolves.toBe(null);
  await page.locator('#editor').dispatchEvent('input');
  await expect(
    page.evaluate((key) => localStorage.getItem(key), draftKey),
  ).resolves.toBe(null);
});

test('an empty tab changing mode leaves the saved draft intact', async ({
  page,
  context,
}) => {
  const writer = await context.newPage();
  await writer.goto(page.url());
  await writer.locator('#editor').fill('Saved in another tab');
  await page.getByRole('button', { name: 'Markdown', exact: true }).click();
  await page.getByRole('button', { name: 'Undo' }).click();
  await writer.reload();
  await expect(writer.locator('#editor')).toHaveValue('Saved in another tab');
});

test('clearing a draft clears the saved copy and undo can save it again', async ({
  page,
  context,
}) => {
  const draft = page.locator('#editor');
  await draft.fill('Keep me');
  const clear = page.getByRole('button', { name: 'Clear draft' });
  await clear.click();
  await page
    .getByRole('dialog')
    .getByRole('button', { name: 'Clear draft' })
    .click();
  await expect(draft).toHaveValue('');
  const reader = await context.newPage();
  await reader.goto(page.url());
  await expect(reader.locator('#editor')).toHaveValue('');
  await page.getByRole('button', { name: 'Undo' }).click();
  await reader.reload();
  await expect(reader.locator('#editor')).toHaveValue('Keep me');
  await page.getByRole('button', { name: 'Redo' }).click();
  await reader.reload();
  await expect(reader.locator('#editor')).toHaveValue('');
});

test('uses the current storage preference before another tab receives the event', async ({
  page,
}) => {
  const draft = page.locator('#editor');
  const saving = page.getByRole('checkbox', { name: 'Save draft locally' });
  await page.evaluate((key) => localStorage.setItem(key, 'off'), draftKey);
  await expect(saving).toBeChecked();
  await draft.fill('Current tab only');
  await expect(saving).not.toBeChecked();
  await expect(draft).toHaveValue('Current tab only');
  await expect(
    page.evaluate((key) => localStorage.getItem(key), draftKey),
  ).resolves.toBe('off');
  await saving.check();
  await expect(draft).toHaveValue('Current tab only');
  await page.evaluate(() => {
    localStorage.clear();
    window.dispatchEvent(new StorageEvent('storage', { key: null }));
  });
  await expect(saving).toBeChecked();
  await page.evaluate((key) => {
    localStorage.setItem(key, 'off');
    window.dispatchEvent(new StorageEvent('storage', { key: 'unrelated' }));
  }, draftKey);
  await expect(saving).toBeChecked();
  await page.evaluate(
    ([draft, preference]) => {
      localStorage.removeItem(draft);
      localStorage.setItem(preference, '!');
    },
    [draftKey, draftPreferenceKey] as const,
  );
  await draft.fill('Another edit');
  await expect(saving).not.toBeChecked();
  await expect(draft).toHaveValue('Another edit');
});

test('ignores damaged data and recovers when storage can be written again', async ({
  page,
}) => {
  const draft = page.locator('#editor');
  await page.evaluate((key) => localStorage.setItem(key, '{'), draftKey);
  await page.reload();
  await expect(draft).toHaveValue('');
  await page.evaluate(() => {
    const storage = window.localStorage;
    Object.defineProperty(window, 'localStorage', {
      configurable: true,
      value: {
        getItem: storage.getItem.bind(storage),
        setItem() {
          throw new DOMException('Full', 'QuotaExceededError');
        },
      },
    });
    window.addEventListener(
      'restore-storage',
      () => {
        Object.defineProperty(window, 'localStorage', { value: storage });
      },
      { once: true },
    );
  });
  await draft.fill('Keep editing');
  await expect(
    page.getByText('Local draft storage is unavailable.'),
  ).toBeVisible();
  await expect(draft).toHaveValue('Keep editing');
  await page.evaluate(() => {
    window.dispatchEvent(new Event('restore-storage'));
  });
  await draft.pressSequentially('!');
  await expect(
    page.getByText('Local draft storage is unavailable.'),
  ).toBeHidden();
  await page.reload();
  await expect(draft).toHaveValue('Keep editing!');
});

test('editing and export work when the browser blocks storage', async ({
  page,
}) => {
  await page.addInitScript(() => {
    Object.defineProperty(window, 'localStorage', {
      get() {
        throw new DOMException('Blocked', 'SecurityError');
      },
    });
  });
  await page.reload();
  const draft = page.locator('#editor');
  await expect(draft).toHaveValue('');
  await expect(
    page.getByText('Local draft storage is unavailable.'),
  ).toBeVisible();
  await draft.fill('Still here');
  const downloadReady = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Export' }).click();
  expect(await readFile((await (await downloadReady).path())!, 'utf8')).toBe(
    'Still here',
  );
});

test('shows that a rejected storage change can leave an older draft', async ({
  page,
  context,
}) => {
  const draft = page.locator('#editor');
  const saving = page.getByRole('checkbox', { name: 'Save draft locally' });
  await draft.fill('Saved draft');
  await page.evaluate(() => {
    const storage = window.localStorage;
    function fail() {
      throw new DOMException('Blocked', 'SecurityError');
    }
    Object.defineProperty(window, 'localStorage', {
      configurable: true,
      value: {
        getItem: storage.getItem.bind(storage),
        setItem: fail,
        removeItem: fail,
      },
    });
    window.addEventListener(
      'restore-storage',
      () => {
        Object.defineProperty(window, 'localStorage', { value: storage });
      },
      { once: true },
    );
  });
  await saving.click();
  await expect(saving).toBeChecked();
  await expect(
    page.getByText('Could not change local draft saving.'),
  ).toBeVisible();
  await expect(draft).toHaveValue('Saved draft');

  await page.getByRole('button', { name: 'Clear draft' }).click();
  await page
    .getByRole('dialog')
    .getByRole('button', { name: 'Clear draft' })
    .click();
  await expect(draft).toHaveValue('');
  await expect(
    page.getByText('Could not delete the locally saved draft.'),
  ).toBeVisible();
  const reopened = await context.newPage();
  await reopened.goto(page.url());
  await expect(reopened.locator('#editor')).toHaveValue('Saved draft');

  await page.evaluate(() => {
    window.dispatchEvent(new Event('restore-storage'));
  });
  await saving.uncheck();
  await expect(page.locator('#storage-warning')).toBeHidden();
  await reopened.reload();
  await expect(reopened.locator('#editor')).toHaveValue('');
});

for (const operation of ['setItem', 'removeItem'] as const) {
  test(`keeps the committed draft preference when ${operation} fails`, async ({
    page,
    context,
  }) => {
    const saving = page.getByRole('checkbox', { name: 'Save draft locally' });
    await page.locator('#editor').fill('Saved draft');
    await page.evaluate((method) => {
      const storage = window.localStorage;
      Object.defineProperty(window, 'localStorage', {
        value: {
          getItem: storage.getItem.bind(storage),
          setItem: storage.setItem.bind(storage),
          removeItem: storage.removeItem.bind(storage),
          [method]() {
            throw new DOMException('Blocked', 'SecurityError');
          },
        },
      });
    }, operation);
    await saving.click();
    const keptSaving = operation === 'setItem';
    await expect(saving).toBeChecked({ checked: keptSaving });
    await expect(page.locator('#storage-warning')).toContainText(
      keptSaving
        ? 'Could not change local draft saving.'
        : 'The browser could not delete the older copy.',
    );
    const reopened = await context.newPage();
    await reopened.goto(page.url());
    await expect(reopened.locator('#editor')).toHaveValue(
      keptSaving ? 'Saved draft' : '',
    );
  });
}

test('retries a failed snapshot deletion before enabling saving again', async ({
  page,
}) => {
  const saving = page.getByRole('checkbox', { name: 'Save draft locally' });
  await page.locator('#editor').fill('Draft awaiting deletion');
  await page.evaluate(() => {
    const storage = window.localStorage;
    let rejected = false;
    Object.defineProperty(window, 'localStorage', {
      value: {
        getItem: storage.getItem.bind(storage),
        setItem: storage.setItem.bind(storage),
        removeItem(key: string) {
          if (!rejected) {
            rejected = true;
            throw new DOMException('Blocked', 'SecurityError');
          }
          storage.removeItem(key);
        },
      },
    });
  });
  await saving.uncheck();
  const legacyCopy = () =>
    page.evaluate((key) => localStorage.getItem(key), draftKey);
  await expect(legacyCopy()).resolves.toContain('Draft awaiting deletion');
  await saving.check();
  await expect(legacyCopy()).resolves.toBe(null);
});

test('describes local draft saving on keyboard focus and label hover', async ({
  page,
}) => {
  const saving = page.getByRole('checkbox', { name: 'Save draft locally' });
  await page.locator('#theme').focus();
  await page.keyboard.press('Tab');
  await page.keyboard.press('Tab');
  await expect(saving).toBeFocused();
  const description = 'Save your draft in this browser.';
  await expect(saving).toHaveAccessibleDescription(description);
  await page.keyboard.press('Tab');
  await page.getByText('Save draft locally', { exact: true }).hover();
  await expect(page.getByRole('tooltip')).toHaveText(description);
});

test('keeps the same words selected when switching between editor modes', async ({
  page,
}) => {
  const editor = page.locator('#editor');
  const markdown = page.getByRole('button', { name: 'Markdown', exact: true });
  await markdown.click();
  await editor.fill('**Hello world**');
  await editor.evaluate((element) =>
    (element as HTMLTextAreaElement).setSelectionRange(2, 7),
  );
  await page.getByRole('button', { name: 'Unicode', exact: true }).click();
  const selected = () =>
    editor.evaluate((element) => {
      const input = element as HTMLTextAreaElement;
      return input.value.slice(input.selectionStart, input.selectionEnd);
    });
  await expect.poll(selected).toBe('𝐇𝐞𝐥𝐥𝐨');
  await markdown.click();
  await expect.poll(selected).toBe('Hello');
});

test('formats text inside nested list items in both modes', async ({
  page,
}) => {
  const editor = page.locator('#editor');
  const bold = page.getByRole('button', { name: 'Bold', exact: true });
  const select = (start: number, end: number) =>
    editor.evaluate(
      (element, [from, to]) =>
        (element as HTMLTextAreaElement).setSelectionRange(from!, to!),
      [start, end],
    );
  await page.getByRole('button', { name: 'Markdown', exact: true }).click();
  const draft = '- Agenda\n    - Andre Braun\n- Coffee';
  await editor.fill(draft);
  await select(15, 26);
  await bold.click();
  await expect(editor).toHaveValue('- Agenda\n    - **Andre Braun**\n- Coffee');
  await expect(page.getByText('Formatting was skipped')).toBeHidden();
  await page.getByRole('button', { name: 'Unicode', exact: true }).click();
  await expect(editor).toHaveValue('- Agenda\n    - 𝐀𝐧𝐝𝐫𝐞 𝐁𝐫𝐚𝐮𝐧\n- Coffee');
  await select(2, 8);
  await bold.click();
  await expect(editor).toHaveValue('- 𝐀𝐠𝐞𝐧𝐝𝐚\n    - 𝐀𝐧𝐝𝐫𝐞 𝐁𝐫𝐚𝐮𝐧\n- Coffee');
  await page.getByRole('button', { name: 'Markdown', exact: true }).click();
  await expect(editor).toHaveValue(
    '- **Agenda**\n    - **Andre Braun**\n- Coffee',
  );
});

test('keeps literal punctuation and reports the whole Markdown selection as bold', async ({
  page,
}) => {
  const editor = page.locator('#editor');
  const bold = page.getByRole('button', { name: 'Bold', exact: true });
  await page.getByRole('button', { name: 'Markdown', exact: true }).click();
  await editor.fill('**word_**\n\n**second**');
  await editor.press('Control+a');
  await expect(bold).toHaveAttribute('aria-pressed', 'true');
  await bold.click();
  await expect(editor).toHaveValue('word_\n\nsecond');
  await expect(bold).toHaveAttribute('aria-pressed', 'false');
});

test('formats an entire mixed draft and toggles randomized text back to Latin', async ({
  page,
}) => {
  await page.evaluate(() => {
    Math.random = () => 0;
  });
  const editor = page.locator('#editor');
  const random = page.getByRole('button', { name: 'Random font' });
  const bold = page.getByRole('button', { name: 'Bold', exact: true });
  const source = 'Ab͟\n\n`Code` 2';
  await editor.fill(source);
  await editor.press('Control+a');
  await random.click();
  await expect(editor).toHaveValue('𝖠𝖻͟\n\n`Code` 𝟤');
  await expect(random).toHaveAttribute('aria-pressed', 'true');
  await expect(page.getByRole('status')).toContainText(
    'Protected Markdown syntax',
  );
  await expect(page.getByRole('status')).toHaveCSS('font-weight', '700');
  await random.click();
  await expect(editor).toHaveValue(source);
  await expect(random).toHaveAttribute('aria-pressed', 'false');
  await bold.click();
  await expect(editor).toHaveValue('𝐀𝐛͟\n\n`Code` 𝟐');
  await expect(bold).toHaveAttribute('aria-pressed', 'true');
  await bold.click();
  await expect(editor).toHaveValue(source);
  await expect(bold).toHaveAttribute('aria-pressed', 'false');
  await page.getByRole('button', { name: 'Markdown', exact: true }).click();
  await editor.fill(
    'First paragraph.\n\n`code` and [link](https://example.com).',
  );
  await editor.press('Control+a');
  await bold.click();
  await expect(editor).toHaveValue(
    '**First paragraph.**\n\n`code` **and** [link](https://example.com).',
  );
  await bold.click();
  await expect(editor).toHaveValue(
    'First paragraph.\n\n`code` and [link](https://example.com).',
  );
  const tools = page.locator('.draft-tools');
  await expect(
    tools.getByRole('button', { name: 'Help', exact: true }),
  ).toBeVisible();
  await expect(
    tools.getByRole('button', { name: 'Clear draft', exact: true }),
  ).toBeVisible();
});

test('armed bold preserves a previous bold-italic span', async ({ page }) => {
  const editor = page.locator('#editor');
  await page.getByRole('button', { name: 'Markdown', exact: true }).click();
  await editor.fill('***one*** ');
  await page.getByRole('button', { name: 'Bold', exact: true }).click();
  await editor.pressSequentially('!two');
  await expect(editor).toHaveValue('***one*** **!two**');
  await editor.fill('');
  await editor.pressSequentially('!');
  await page.getByRole('button', { name: 'Bold', exact: true }).click();
  await editor.pressSequentially('plain');
  await expect(editor).toHaveValue('**!**plain');
});

for (const { label, text, caret, markdown, unicode } of [
  {
    label: 'continues inside nested underline and bold',
    text: '<u>**one**</u>',
    caret: 8,
    markdown: '<u>**onexy**</u>',
    unicode: '𝐨͟𝐧͟𝐞͟𝐱͟𝐲͟',
  },
  {
    label: 'prepends to the adjacent bold span',
    text: '**one**',
    caret: 0,
    markdown: '**xyone**',
    unicode: '𝐱𝐲𝐨𝐧𝐞',
  },
]) {
  test(`armed bold ${label}`, async ({ page }) => {
    const editor = page.locator('#editor');
    await page.getByRole('button', { name: 'Markdown', exact: true }).click();
    await editor.fill(text);
    await editor.evaluate((element, point) => {
      (element as HTMLTextAreaElement).setSelectionRange(point, point);
    }, caret);
    await page.getByRole('button', { name: 'Bold', exact: true }).click();
    await editor.pressSequentially('xy');
    await expect(editor).toHaveValue(markdown);
    await page.getByRole('button', { name: 'Unicode', exact: true }).click();
    await expect(editor).toHaveValue(unicode);
  });
}

test('offers underline, strikethrough and bullet shortcuts in both modes', async ({
  page,
}) => {
  const editor = page.locator('#editor');
  const markdown = page.getByRole('button', { name: 'Markdown', exact: true });
  await markdown.click();
  await editor.fill('one two\nthree');
  await editor.evaluate((element) =>
    (element as HTMLTextAreaElement).setSelectionRange(0, 3),
  );
  await editor.press('Control+u');
  await expect(editor).toHaveValue('<u>one</u> two\nthree');
  await editor.evaluate((element) =>
    (element as HTMLTextAreaElement).setSelectionRange(11, 14),
  );
  await editor.press('Control+Shift+X');
  await expect(editor).toHaveValue('<u>one</u> ~~two~~\nthree');
  await editor.press('Control+a');
  await editor.press('Control+Shift+Digit8');
  await expect(editor).toHaveValue('- <u>one</u> ~~two~~\n- three');
  await page.getByRole('button', { name: 'Unicode', exact: true }).click();
  await editor.evaluate((element) =>
    (element as HTMLTextAreaElement).setSelectionRange(2, 3),
  );
  await editor.press('Control+u');
  await editor.press('Control+u');
  await page.getByRole('button', { name: 'Markdown', exact: true }).click();
  await expect(editor).toHaveValue('- <u>one</u> ~~two~~\n- three');
  expect(page.context().pages()).toHaveLength(1);
  await expect(
    page.getByRole('button', { name: 'Strikethrough', exact: true }),
  ).toHaveAttribute('aria-keyshortcuts', 'Control+Shift+X Meta+Shift+X');
});

test('keyboard formatting, protected syntax, bullets and native history events', async ({
  page,
}) => {
  const draft = page.locator('#editor');
  const markdown = page.getByRole('button', { name: 'Markdown', exact: true });
  await markdown.click();
  await markdown.click();
  await draft.press('Control+b');
  await draft.pressSequentially('bold');
  await draft.press('Control+b');
  await expect(draft).toHaveJSProperty('selectionStart', 8);
  await draft.fill('`literal`');
  await draft.press('Control+a');
  await draft.press('Control+i');
  await expect(draft).toHaveValue('`literal`');
  await expect(page.getByRole('status')).toContainText('Markdown syntax');
  await draft.fill('one\ntwo');
  await draft.press('Control+a');
  await page.getByRole('button', { name: 'Bulleted list' }).click();
  await expect(draft).toHaveValue('- one\n- two');
  await draft.evaluate((element) => {
    element.dispatchEvent(
      new InputEvent('beforeinput', {
        inputType: 'historyUndo',
        cancelable: true,
        bubbles: true,
      }),
    );
  });
  await expect(draft).toHaveValue('one\ntwo');
  await page.getByRole('button', { name: 'Redo' }).click();
  await expect(draft).toHaveValue('- one\n- two');
});

test('keeps diagnostics accessible during edits, scrolling and offline use', async ({
  page,
  context,
}) => {
  const draft = page.locator('#editor');
  await draft.fill('Opening.\n\n~~~js\ncode');
  await page.getByText('Writing hints').click();
  await expect(page.locator('#warning-list')).toContainText(
    'Markdown · Line 3',
  );
  await page.getByRole('button', { name: 'Markdown', exact: true }).click();
  await expect(page.getByRole('button', { name: /^Line 3/ })).toBeVisible();
  await page.getByRole('button', { name: /^Line 3/ }).focus();
  await page.locator('#destination').selectOption('article');
  await draft.click();
  await context.setOffline(true);
  await draft.fill('line\n'.repeat(1601));
  await expect(page.locator('#line-markers')).toBeEmpty();
  await draft.evaluate((element) => {
    element.scrollTop = 100;
  });
  await draft.press('End');
  await draft.pressSequentially('kept');
  await expect(draft).toHaveValue(/kept/u);
  await expect(page.locator('#limit')).toContainText('125,000');
});

test('opens full help and keeps UTF-8 exports available', async ({ page }) => {
  await page.getByRole('button', { name: 'Help', exact: true }).click();
  const dialog = page.getByRole('dialog', { name: 'Help' });
  await expect(dialog).toContainText('Mathematical Unicode');
  await expect(dialog).toContainText('Marcel Petrick <mail@marcelpetrick.it>');
  await expect(dialog).toContainText('Built with AI assistance.');
  await expect(dialog).toContainText('Toggle underline (Ctrl+U).');
  await dialog.getByRole('button', { name: 'Close' }).click();
  await page.locator('#editor').fill('Ää');
  const pending = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Export' }).click();
  const download = await pending;
  expect(download.suggestedFilename()).toBe('boldemort-draft.txt');
  expect(await readFile(await download.path(), 'utf8')).toBe('Ää');
  await page.clock.install();
  await page.clock.fastForward(1250);
});

test('explains when a style cannot change the selected characters', async ({
  page,
}) => {
  const editor = page.locator('#editor');
  await page.getByRole('button', { name: 'Unicode', exact: true }).click();
  await editor.fill('?!');
  await editor.press('Control+a');
  await editor.press('Control+b');
  await expect(editor).toHaveValue('?!');
  await expect(page.getByRole('status')).toContainText(
    'This style does not change the selected characters.',
  );
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
  await page.evaluate(() => {
    const revoke = URL.revokeObjectURL.bind(URL);
    URL.revokeObjectURL = (url: string) => {
      document.body.dataset.revoked = url;
      revoke(url);
    };
  });
  const downloadReady = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Export' }).click();
  const download = await downloadReady;
  expect(download.suggestedFilename()).toBe('boldemort-draft.md');
  expect(await readFile(await download.path(), 'utf8')).toBe('**Hello** 👩🏽‍💻');
  // The temporary download URL is released after the browser starts saving.
  await expect(page.locator('body')).toHaveAttribute('data-revoked', /^blob:/);
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
  const clockStart = new Date();
  await page.clock.install({ time: clockStart });
  await page.clock.pauseAt(new Date(clockStart.getTime() + 1000));
  await page
    .getByRole('button', { name: 'Bold', exact: true })
    .hover({ force: true });
  await expect(page.getByRole('tooltip')).toHaveText('Toggle bold (Ctrl+B).');
  await page.clock.runFor(3999);
  await expect(page.getByRole('tooltip')).toHaveText('Toggle bold (Ctrl+B).');
  await page.clock.runFor(1);
  await expect(page.getByRole('tooltip')).toContainText('Ctrl');
  await page.getByRole('tooltip').hover({ force: true });
  await expect(page.getByRole('tooltip')).toContainText('Ctrl');
  await page.keyboard.press('Escape');
  await expect(page.getByRole('tooltip')).toBeHidden();
  await page.clock.resume();
  await page.getByRole('button', { name: 'Italic', exact: true }).hover();
  await expect(page.getByRole('tooltip')).toHaveText('Toggle italic (Ctrl+I).');
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

test('pastes and edits an article-length draft without truncating it', async ({
  page,
}) => {
  const draft = page.locator('#editor');
  await page.locator('#destination').selectOption('article');
  await draft.focus();
  const size = 125_000;
  await draft.evaluate((element, targetSize) => {
    const sentence = 'A sentence contains five words.\r\n\r\n';
    const text = sentence
      .replace(/\r/gu, '')
      .repeat(Math.ceil(targetSize / (sentence.length - 2)))
      .slice(0, targetSize);
    const data = new DataTransfer();
    data.setData('text/plain', text.replace(/\n/gu, '\r\n'));
    const paste = new ClipboardEvent('paste', {
      clipboardData: data,
      bubbles: true,
      cancelable: true,
    });
    Object.defineProperty(paste, 'clipboardData', { value: data });
    element.dispatchEvent(paste);
  }, size);
  await expect(draft).toHaveJSProperty('textLength', size);
  await draft.press('End');
  await draft.pressSequentially('!');
  await expect(draft).toHaveJSProperty('textLength', size + 1);
  await expect(page.locator('#limit')).toContainText('125,001 / 125,000');
});

test('copies the selected Unicode line variants and links to project and tests', async ({
  page,
}) => {
  await expect(
    page.getByRole('link', { name: 'Marcel Petrick' }),
  ).toHaveAttribute('href', 'mailto:mail@marcelpetrick.it');
  await expect(
    page.getByRole('link', { name: 'GitHub project' }),
  ).toHaveAttribute('href', 'https://github.com/marcelpetrick/Boldemort');
  await expect(
    page.getByRole('link', { name: 'CI and test results' }),
  ).toHaveAttribute('href', /actions\/workflows\/ci.yml$/u);
  await expect(page.locator('.introduction')).toHaveAttribute('open', '');
  await expect(page.locator('.introduction')).toContainText('plain-text email');
  await expect(page.locator('.introduction li')).toHaveCount(3);
  await page.locator('#language').selectOption('de');
  await expect(
    page.getByText('Was Boldemort kann', { exact: true }),
  ).toBeVisible();
  await page.locator('#language').selectOption('en');

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
  const draft = page.locator('#editor');
  await expect(draft).toHaveCSS('font-family', /system-ui/u);
  await page.locator('#strike-style').selectOption('tilde');
  await draft.fill('a b');
  await draft.press('Control+a');
  await page
    .getByRole('button', { name: 'Strikethrough', exact: true })
    .click();
  await expect(draft).toHaveValue('a̴ ̴b̴');
  await page.getByRole('button', { name: 'Copy all' }).click();
  await expect(page.locator('body')).toHaveAttribute('data-clipboard', 'a̴ ̴b̴');
  await page.getByRole('button', { name: 'Markdown', exact: true }).click();
  await expect(draft).toHaveValue('~~a b~~');
  await expect(draft).toHaveCSS('font-family', /ui-monospace/u);

  await page.locator('#underline-style').selectOption('double');
  await draft.fill('<u>a b</u>');
  await page.getByRole('button', { name: 'Unicode', exact: true }).click();
  await expect(draft).toHaveValue('a̳ ̳b̳');
});

test('keeps a typed space outside Markdown formatting when turning it off', async ({
  page,
}) => {
  const draft = page.locator('#editor');
  await page.getByRole('button', { name: 'Markdown', exact: true }).click();
  const bold = page.getByRole('button', { name: 'Bold', exact: true });
  await bold.click();
  await draft.pressSequentially('one ');
  await expect(draft).toHaveValue('**one** ');
  await bold.click();
  await draft.pressSequentially('two');
  await expect(draft).toHaveValue('**one** two');
});

test('offers random Unicode lettering, an overview above the draft, and a Bavarian theme', async ({
  page,
}) => {
  const draft = page.locator('#editor');
  const overview = page.locator('.introduction');
  await expect(overview.locator('p')).toBeVisible();
  const overviewBox = await overview.boundingBox();
  const draftBox = await draft.boundingBox();
  expect(overviewBox!.y + overviewBox!.height).toBeLessThan(draftBox!.y);
  await overview.locator('summary').click();
  await expect(overview.locator('p')).toBeHidden();

  await page.evaluate(() => {
    Math.random = () => 0;
  });
  const random = page.getByRole('button', { name: 'Random font' });
  await draft.fill('Ab 2 👩🏽‍💻');
  await draft.press('Control+a');
  await random.click();
  await expect(draft).toHaveValue('𝖠𝖻 𝟤 👩🏽‍💻');
  await page.getByRole('button', { name: 'Undo' }).click();
  await expect(draft).toHaveValue('Ab 2 👩🏽‍💻');
  await draft.fill('`code`');
  await draft.press('Control+a');
  await random.click();
  await expect(draft).toHaveValue('`code`');
  await expect(page.getByRole('status')).toContainText('Markdown syntax');
  await draft.fill('');
  await random.click();
  await expect(random).toHaveAttribute('aria-pressed', 'true');
  await draft.pressSequentially('Az');
  await expect(draft).toHaveValue('𝖠𝗓');
  await random.click();
  await draft.pressSequentially('!');
  await expect(draft).toHaveValue(/^𝖠.+!$/u);
  await page.getByRole('button', { name: 'Markdown', exact: true }).click();
  await expect(random).toHaveAttribute('aria-disabled', 'true');
  await random.click({ force: true });
  await expect(draft).toHaveValue(/^𝖠.+!$/u);

  await page.locator('#theme').selectOption('bavarian');
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'bavarian');
  await expect(page.locator('html')).toHaveCSS('color-scheme', 'light');
  const { violations } = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
    .analyze();
  expect(violations).toEqual([]);
  await page.locator('#language').selectOption('de');
  await expect(
    page.getByRole('button', { name: 'Zufallsschrift' }),
  ).toBeVisible();
  await expect(page.locator('#theme option:checked')).toHaveText('Bayerisch');
});

test('handles undo limits, armed Unicode typing and composition guards', async ({
  page,
}) => {
  const editor = page.locator('#editor');
  const bold = page.getByRole('button', { name: 'Bold', exact: true });
  await editor.press('Control+z');
  await expect(editor).toHaveValue('');
  await page.getByRole('button', { name: 'Unicode', exact: true }).click();
  await editor.press('Control+b');
  await expect(bold).toHaveAttribute('aria-pressed', 'true');
  await editor.pressSequentially('a');
  await editor.press('Enter');
  await editor.evaluate((element) =>
    element.dispatchEvent(
      new InputEvent('beforeinput', {
        inputType: 'insertText',
        cancelable: true,
        bubbles: true,
      }),
    ),
  );
  await expect(editor).toHaveValue('𝐚\n');
  await editor.press('Control+b');
  await expect(bold).toHaveAttribute('aria-pressed', 'false');
  await editor.press('Control+z');
  await expect(editor).toHaveValue('𝐚');
  await editor.evaluate((element) =>
    element.dispatchEvent(
      new InputEvent('beforeinput', {
        inputType: 'historyRedo',
        cancelable: true,
        bubbles: true,
      }),
    ),
  );
  await expect(editor).toHaveValue('𝐚\n');
  // Events during IME composition are left to the browser.
  const handled = await editor.evaluate((element) => {
    const input = element as HTMLTextAreaElement;
    input.dispatchEvent(new CompositionEvent('compositionstart'));
    const before = new InputEvent('beforeinput', {
      inputType: 'historyUndo',
      cancelable: true,
      bubbles: true,
    });
    input.dispatchEvent(before);
    const data = new DataTransfer();
    data.setData('text/plain', 'x'.repeat(10_001));
    const paste = new ClipboardEvent('paste', {
      clipboardData: data,
      cancelable: true,
      bubbles: true,
    });
    input.dispatchEvent(paste);
    input.dispatchEvent(new Event('select'));
    input.dispatchEvent(new CompositionEvent('compositionend'));
    return before.defaultPrevented || paste.defaultPrevented;
  });
  expect(handled).toBe(false);
  await expect(editor).toHaveValue('𝐚\n');
});

test('reports near limits, literal output, long-draft diagnostics and empty clears', async ({
  page,
}) => {
  const editor = page.locator('#editor');
  await page.locator('#destination').selectOption('note');
  await page.getByRole('button', { name: 'Clear draft' }).click();
  await expect(page.locator('dialog[open]')).toHaveCount(0);
  await editor.fill('a'.repeat(185));
  await expect(page.locator('#limit')).toContainText('Near the limit');
  await page.getByRole('button', { name: 'Markdown', exact: true }).click();
  await editor.fill('| A |\n| - |\n| 1 |');
  await page.locator('#output').selectOption('unicode');
  await expect(page.getByRole('status')).toContainText(
    'Complex Markdown stays literal',
  );
  // Very long drafts skip the line gutter, so jumps use the line height.
  await editor.fill('line\n'.repeat(1700) + '```js\ncode');
  await page.getByText('Writing hints').click();
  await page.getByRole('button', { name: /^Line 1,701 / }).click();
  await expect(editor).toBeFocused();
  expect(await editor.evaluate((element) => element.scrollTop)).toBeGreaterThan(
    0,
  );
});

test('moves hints between controls and hides them when the pointer leaves', async ({
  page,
}) => {
  const tooltip = page.getByRole('tooltip');
  await page.getByRole('button', { name: 'Bold', exact: true }).hover();
  await expect(tooltip).toHaveText('Toggle bold (Ctrl+B).');
  await page.getByRole('button', { name: 'Italic', exact: true }).hover();
  await expect(tooltip).toHaveText('Toggle italic (Ctrl+I).');
  await page.locator('h1').hover();
  await expect(tooltip).toBeHidden();
  // Clicking dismisses the hint until the pointer moves to another control.
  const bold = page.getByRole('button', { name: 'Bold', exact: true });
  await bold.click();
  await expect(tooltip).toBeHidden();
  await page.getByRole('button', { name: 'Italic', exact: true }).hover();
  await expect(tooltip).toHaveText('Toggle italic (Ctrl+I).');
  await bold.hover();
  await expect(tooltip).toHaveText('Toggle bold (Ctrl+B).');
});

test.describe('with a German browser', () => {
  test.use({ locale: 'de-DE' });
  test('starts in German', async ({ page }) => {
    await expect(
      page.getByRole('textbox', { name: 'Dein Entwurf' }),
    ).toBeVisible();
  });
});
