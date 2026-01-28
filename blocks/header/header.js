import { getMetadata } from '../../scripts/aem.js';
import { loadFragment } from '../fragment/fragment.js';

/**
 * loads and decorates the header
 * @param {Element} block The header block element
 */
export default async function decorate(block) {
  // 1) Load header as fragment (same pattern as footer)
  const headerMeta = getMetadata('header');
  const headerPath = headerMeta ? new URL(headerMeta, window.location).pathname : '/header';
  const fragment = await loadFragment(headerPath);

  // 2) Replace block contents with fragment DOM
  block.textContent = '';
  const headerRoot = document.createElement('div');
  while (fragment.firstElementChild) headerRoot.append(fragment.firstElementChild);
  block.append(headerRoot);

  // 3) Enhance behavior (no jQuery; accessible vanilla JS)
  initHeaderInteractions(headerRoot);
}

/**
 * Wire up mobile menu toggle & 'Worldwide' dropdown with ARIA
 * @param {HTMLElement} root
 */
function initHeaderInteractions(root) {
  // --- Mobile nav toggle ---
  const mobileToggle = root.querySelector('.mobile-toggle');
  const mobileNav = root.querySelector('#mobile-nav');

  const setMobileNav = (open) => {
    if (!mobileToggle || !mobileNav) return;
    mobileToggle.setAttribute('aria-expanded', String(open));
    mobileToggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    mobileNav.hidden = !open;
    // trap focus in mobile nav (lightweight)
    if (open) {
      const focusable = mobileNav.querySelector('a, button, [tabindex]:not([tabindex="-1"])');
      focusable && focusable.focus({ preventScroll: true });
    }
  };

  mobileToggle?.addEventListener('click', () => {
    const open = mobileToggle.getAttribute('aria-expanded') === 'true';
    setMobileNav(!open);
  });

  // Close mobile nav when resizing up
  let lastWidth = window.innerWidth;
  window.addEventListener('resize', () => {
    const w = window.innerWidth;
    if (lastWidth <= 992 && w > 992) setMobileNav(false);
    lastWidth = w;
  });

  // --- Desktop 'Worldwide' dropdown ---
  const trigger = root.querySelector('.submenu-trigger');
  const submenu = root.querySelector('#worldwide-menu');

  const openSubmenu = () => {
    if (!trigger || !submenu) return;
    trigger.setAttribute('aria-expanded', 'true');
    submenu.dataset.open = 'true';
    const firstItem = submenu.querySelector('a, button');
    firstItem && firstItem.focus({ preventScroll: true });
  };
  const closeSubmenu = () => {
    if (!trigger || !submenu) return;
    trigger.setAttribute('aria-expanded', 'false');
    delete submenu.dataset.open;
  };

  trigger?.addEventListener('click', (e) => {
    e.stopPropagation();
    const isOpen = trigger.getAttribute('aria-expanded') === 'true';
    isOpen ? closeSubmenu() : openSubmenu();
  });

  // Close on outside click
  document.addEventListener('click', (e) => {
    if (!submenu?.dataset.open) return;
    const withinMenu = submenu.contains(e.target);
    const withinTrigger = trigger.contains(e.target);
    if (!withinMenu && !withinTrigger) closeSubmenu();
  });

  // Close on Escape key
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && submenu?.dataset.open) {
      closeSubmenu();
      trigger.focus();
    }
  });
}
