// SPDX-License-Identifier: GPL-3.0-or-later
import type { Draft } from './document.ts';
import { lineMarks } from './unicode.ts';

export const draftKey = 'boldemort:draft:v1';

export function readDraft(raw: string): Draft | undefined {
  let draft: Draft | null;
  try {
    draft = JSON.parse(raw) as Draft | null;
  } catch {
    return;
  }
  if (draft?.mode !== 'markdown' && draft?.mode !== 'unicode') return;
  if (!Array.isArray(draft.pieces)) return;
  if (
    !draft.pieces.every((piece) => {
      if (typeof piece !== 'object' || piece === null) return false;
      return 'text' in piece
        ? typeof piece.text === 'string' && piece.mode === draft.mode
        : typeof piece.markdown === 'string' &&
            typeof piece.unicode === 'string';
    })
  )
    return;
  const { lineStyles } = draft;
  if (
    typeof lineStyles?.underline !== 'string' ||
    !Object.hasOwn(lineMarks.underline, lineStyles.underline) ||
    typeof lineStyles.strike !== 'string' ||
    !Object.hasOwn(lineMarks.strike, lineStyles.strike)
  )
    return;
  return draft;
}
