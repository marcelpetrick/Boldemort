// SPDX-License-Identifier: GPL-3.0-or-later
import { explanation, type Help, type Locale } from './i18n.ts';

export function installTooltips(tooltip: HTMLElement, locale: () => Locale) {
  let target: HTMLElement | undefined;
  let pointer: HTMLElement | undefined;
  let focus: HTMLElement | undefined;
  let dismissed: HTMLElement | undefined;
  let timer = 0;
  let pointerSuppressed = false;
  function resolve(node: EventTarget | null) {
    if (!(node instanceof Element)) return;
    if (tooltip.contains(node)) return target;
    return node.closest<HTMLElement>('[data-help]') ?? undefined;
  }
  function position() {
    if (!target || tooltip.hidden) return;
    const bounds = target.getBoundingClientRect();
    const rect = tooltip.getBoundingClientRect();
    const left = Math.max(
      8,
      Math.min(bounds.left, innerWidth - rect.width - 8),
    );
    const below = bounds.bottom + 7;
    const top =
      below + rect.height + 8 <= innerHeight
        ? below
        : Math.max(8, bounds.top - rect.height - 7);
    tooltip.dataset.side = top === below ? 'bottom' : 'top';
    tooltip.style.left = left + 'px';
    tooltip.style.top = top + 'px';
  }
  function hide() {
    clearTimeout(timer);
    if (target?.getAttribute('aria-describedby') === tooltip.id)
      target.removeAttribute('aria-describedby');
    target = undefined;
    tooltip.hidden = true;
  }
  function show() {
    const next = pointer ?? focus;
    if (next === target || next === dismissed) return;
    hide();
    if (!next) return;
    target = next;
    const container = next.closest('dialog') ?? document.body;
    container.append(tooltip);
    const content = explanation(locale(), next.dataset.help as Help);
    tooltip.textContent = content.short;
    tooltip.hidden = false;
    next.setAttribute('aria-describedby', tooltip.id);
    position();
    timer = window.setTimeout(() => {
      tooltip.textContent = content.short + ' ' + content.long;
      position();
    }, 4000);
  }
  document.addEventListener('pointerover', (event) => {
    if (event.pointerType === 'touch' || pointerSuppressed) return;
    const next = resolve(event.target);
    if (pointer !== next) dismissed = undefined;
    pointer = next;
    show();
  });
  document.addEventListener('pointerout', (event) => {
    if (event.pointerType === 'touch' || pointerSuppressed) return;
    pointer = resolve(event.relatedTarget);
    show();
  });
  document.addEventListener('pointermove', (event) => {
    if (!pointerSuppressed || event.pointerType === 'touch') return;
    pointerSuppressed = false;
    dismissed = undefined;
    pointer = resolve(event.target);
    show();
  });
  document.addEventListener('focusin', (event) => {
    const next = resolve(event.target);
    focus = next?.matches(':focus-visible') ? next : undefined;
    show();
  });
  document.addEventListener('focusout', () => {
    focus = undefined;
    show();
  });
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && target) {
      dismissed = target;
      pointer = undefined;
      pointerSuppressed = true;
      hide();
    }
  });
  document.addEventListener('pointerdown', () => {
    dismissed = target;
    hide();
  });
  addEventListener('resize', position);
  addEventListener('scroll', position, true);
  return () => {
    dismissed = target;
    hide();
  };
}
