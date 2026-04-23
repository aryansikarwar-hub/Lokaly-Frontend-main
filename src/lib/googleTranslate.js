/**
 * Google Translate integration.
 *
 * We embed Google's free `translate_a/element.js` widget (hidden) and flip
 * pages via the `googtrans` cookie. Works on any laptop, no bundled i18n JSON,
 * no server infra, no API key.
 *
 * Usage from UI:
 *   import { setLanguage, getLanguage, SUPPORTED_LANGS } from '../lib/googleTranslate';
 *   setLanguage('hi');   // reloads the page translated to Hindi
 */

export const SUPPORTED_LANGS = [
  { code: 'en', label: 'EN', name: 'English' },
  { code: 'hi', label: 'HI', name: 'हिन्दी' },
  { code: 'ta', label: 'TA', name: 'தமிழ்' },
  { code: 'bn', label: 'BN', name: 'বাংলা' },
  { code: 'gu', label: 'GU', name: 'ગુજરાતી' },
  { code: 'mr', label: 'MR', name: 'मराठी' },
  { code: 'te', label: 'TE', name: 'తెలుగు' },
  { code: 'kn', label: 'KN', name: 'ಕನ್ನಡ' },
  { code: 'ml', label: 'ML', name: 'മലയാളം' },
  { code: 'pa', label: 'PA', name: 'ਪੰਜਾਬੀ' },
  { code: 'or', label: 'OR', name: 'ଓଡ଼ିଆ' },
  { code: 'as', label: 'AS', name: 'অসমীয়া' },
];

const INCLUDED = SUPPORTED_LANGS.map((l) => l.code).join(',');

function domainKey() {
  // Google sets googtrans on both the host and on a leading-dot host. Writing both covers subdomain + apex.
  const host = window.location.hostname;
  const parts = host.split('.');
  if (parts.length <= 1) return host; // localhost
  return '.' + parts.slice(-2).join('.');
}

function setCookie(name, value) {
  const d = domainKey();
  // Root path; no expiry = session cookie (survives until tab close).
  document.cookie = `${name}=${value}; path=/`;
  if (d && d !== window.location.hostname) {
    document.cookie = `${name}=${value}; path=/; domain=${d}`;
  }
}

function clearCookie(name) {
  const past = 'expires=Thu, 01 Jan 1970 00:00:00 GMT';
  const d = domainKey();
  document.cookie = `${name}=; path=/; ${past}`;
  document.cookie = `${name}=; path=/; domain=${d}; ${past}`;
}

function readCookie(name) {
  const m = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]+)`));
  return m ? decodeURIComponent(m[1]) : null;
}

/** Returns the current translate target, defaulting to 'en'. */
export function getLanguage() {
  const cookie = readCookie('googtrans');
  if (!cookie) return 'en';
  // Cookie looks like "/en/hi".
  const parts = cookie.split('/').filter(Boolean);
  return parts[1] || 'en';
}

/** Switches to the given language. Triggers a reload so Google Translate re-renders the tree. */
export function setLanguage(code) {
  if (!code || code === 'en') {
    clearCookie('googtrans');
  } else {
    setCookie('googtrans', `/en/${code}`);
  }
  // Reload so the page re-parses with the new cookie. Smoother than trying to invoke google.translate internals.
  window.location.reload();
}

let _booted = false;

/**
 * Injects the hidden Google Translate element + loader script. Idempotent.
 * Call once from App bootstrap.
 */
export function bootGoogleTranslate() {
  if (_booted || typeof window === 'undefined') return;
  _booted = true;

  // Hidden host container Google writes its <select> into.
  if (!document.getElementById('google_translate_element')) {
    const el = document.createElement('div');
    el.id = 'google_translate_element';
    el.style.cssText = 'position:fixed;opacity:0;pointer-events:none;width:1px;height:1px;overflow:hidden;';
    document.body.appendChild(el);
  }

  // Inject style overrides so the injected banner does not shove the page down or show the tooltip.
  if (!document.getElementById('lokaly-gtranslate-overrides')) {
    const style = document.createElement('style');
    style.id = 'lokaly-gtranslate-overrides';
    style.textContent = `
      .goog-te-banner-frame.skiptranslate { display: none !important; }
      body { top: 0 !important; }
      .goog-tooltip, .goog-tooltip:hover, .goog-text-highlight { display: none !important; box-shadow: none !important; background: transparent !important; }
      #google_translate_element .goog-te-gadget { height: 0; overflow: hidden; font-size: 0; }
    `;
    document.head.appendChild(style);
  }

  window.googleTranslateElementInit = function googleTranslateElementInit() {
    if (!window.google?.translate?.TranslateElement) return;
    try {
      new window.google.translate.TranslateElement(
        {
          pageLanguage: 'en',
          includedLanguages: INCLUDED,
          layout: window.google.translate.TranslateElement.InlineLayout.SIMPLE,
          autoDisplay: false,
        },
        'google_translate_element'
      );
    } catch (_) { /* widget already mounted */ }
  };

  if (!document.querySelector('script[data-gtranslate-loader]')) {
    const s = document.createElement('script');
    s.src = 'https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit';
    s.async = true;
    s.defer = true;
    s.setAttribute('data-gtranslate-loader', 'true');
    // If Google Translate is blocked (prod/other laptop), fail silently.
    s.onerror = () => console.warn('[lokaly] Google Translate blocked or unreachable; staying in English.');
    document.body.appendChild(s);
  }
}
