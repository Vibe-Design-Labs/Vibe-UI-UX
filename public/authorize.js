import {applyLocale, t} from './i18n.js';
const query = new URL(location.href).searchParams;
const code = query.get('code'), flow = query.get('flow');
// Discard the one-time code from the address bar before communicating with the opener.
history.replaceState(null, '', location.pathname);
applyLocale();
const status = document.querySelector('#authorization-status');
if (window.opener && code && code.length <= 2048 && /^[a-zA-Z0-9_-]{32}$/.test(flow || '')) {
  window.opener.postMessage({type: 'intentkit-tokendance-code', flow, code}, location.origin);
  status.textContent = t('authorizationReturned');
  // Keep the callback visible; the workbench closes it only after receiving the code.
} else status.textContent = t('authorizationLost');
