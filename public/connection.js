import {t} from './i18n.js';
import {notify} from './motion.js';
import {applicationURL, validKey, validModel, loadModels, beginAuthorization, authorizationCode, exchangeAuthorization} from './tokendance.js';

export function setupTokenDanceConnection({mode, onCredentials}) {
  const $ = id => document.getElementById(id), dialog = $('connection');
  const appURL = applicationURL(import.meta.url);
  let key = '', model = '', models = null, modelsController = null, modelsStatus = 'modelsIdle', auth = null, authStatus = 'authorizationHelp';
  function refreshLocale() {
    $('connect').textContent = t(key ? 'connected' : 'connect');
    const note = document.querySelector('.dialog-note');
    note.removeAttribute('data-i18n');
    note.textContent = t('connectionNote') + ' ' + t(mode === 'direct' ? 'connectionDirect' : 'connectionRelay');
    $('models-status').textContent = t(modelsStatus) + (modelsStatus === 'modelsLoaded' ? ' · ' + models.length : '');
    $('authorization-status').textContent = t(authStatus);
    $('authorize-key').disabled = !!auth;
  }
  function cancelAuthorization() {
    if (!auth) return;
    const current = auth; auth = null;
    current.controller.abort(); clearInterval(current.timer); current.verifier = ''; current.state = '';
    try { current.popup.close(); } catch {}
    authStatus = 'authorizationHelp'; refreshLocale();
  }
  async function refreshModels() {
    modelsController?.abort();
    const controller = modelsController = new AbortController(), timeout = setTimeout(() => controller.abort(), 15000);
    modelsStatus = 'modelsLoading'; $('refresh-models').disabled = true; refreshLocale();
    try {
      const value = await loadModels({mode, signal: controller.signal});
      if (modelsController !== controller || controller.signal.aborted) return;
      models = value; $('model-options').replaceChildren(...models.map(model => {
        const option = document.createElement('option'); option.value = model.id; option.label = model.name; return option;
      }));
      modelsStatus = 'modelsLoaded';
    } catch { if (modelsController === controller) modelsStatus = 'modelsFailed'; }
    finally { clearTimeout(timeout); if (modelsController === controller) { modelsController = null; $('refresh-models').disabled = false; refreshLocale(); } }
  }
  $('connect').addEventListener('click', () => {
    authStatus = 'authorizationHelp'; refreshLocale();
    dialog.showModal(); $('api-key').value = key; $('model').value = model;
    if (!models && !modelsController) refreshModels();
  });
  $('close-dialog').addEventListener('click', () => dialog.close());
  dialog.addEventListener('click', event => {
    if (event.target !== dialog) return;
    const r = dialog.getBoundingClientRect();
    if (event.clientX < r.left || event.clientX > r.right || event.clientY < r.top || event.clientY > r.bottom) dialog.close();
  });
  $('refresh-models').addEventListener('click', refreshModels);
  $('authorize-key').addEventListener('click', async () => {
    cancelAuthorization();
    // Open synchronously from a click. A popup keeps the PKCE verifier in this page's memory.
    const popup = window.open('about:blank', '_blank', 'popup,width=640,height=780');
    if (!popup) { authStatus = 'authorizationBlocked'; refreshLocale(); return; }
    const current = auth = {popup, controller: new AbortController(), verifier: '', state: '', deadline: Date.now() + 600000};
    authStatus = 'authorizationWaiting'; refreshLocale();
    try {
      const flow = await beginAuthorization({callbackURL: new URL('./authorize.html', import.meta.url).href, appURL});
      if (auth !== current) return;
      current.verifier = flow.verifier; current.state = flow.state;
      popup.location.replace(flow.url);
      current.timer = setInterval(() => {
        if (popup.closed || Date.now() >= current.deadline) {
          const expired = Date.now() >= current.deadline;
          cancelAuthorization(); authStatus = expired ? 'authorizationExpired' : 'authorizationCancelled'; refreshLocale();
        }
      }, 500);
    } catch { if (auth === current) { cancelAuthorization(); authStatus = 'authorizationFailed'; refreshLocale(); } }
  });
  addEventListener('message', async event => {
    if (!auth?.state || auth.exchanging || Date.now() >= auth.deadline) return;
    const code = authorizationCode(event, {origin: location.origin, popup: auth.popup, state: auth.state});
    if (!code) return;
    const current = auth; current.exchanging = true; clearInterval(current.timer);
    authStatus = 'authorizationExchanging'; refreshLocale();
    const timeout = setTimeout(() => current.controller.abort(), 25000);
    try {
      const value = await exchangeAuthorization({code, verifier: current.verifier, mode, signal: current.controller.signal});
      if (auth !== current || current.controller.signal.aborted) return;
      $('api-key').value = value;
      cancelAuthorization(); authStatus = 'authorizationReady'; refreshLocale();
    } catch { if (auth === current) { cancelAuthorization(); authStatus = 'authorizationFailed'; refreshLocale(); } }
    finally { clearTimeout(timeout); }
  });
  $('save-key').addEventListener('click', () => {
    const k = $('api-key').value.trim(), m = $('model').value.trim();
    if (!validKey(k) || !validModel(m)) return notify(t('invalidKey'));
    if (models && !models.some(item => item.id === m)) return notify(t('modelUnsupported'));
    cancelAuthorization(); key = k; model = m; $('api-key').value = ''; onCredentials({key, model});
    refreshLocale(); dialog.close(); notify(t('keySaved'));
  });
  $('forget-key').addEventListener('click', () => {
    cancelAuthorization(); key = ''; model = ''; $('api-key').value = ''; $('model').value = '';
    onCredentials({key, model}); refreshLocale(); dialog.close(); notify(t('keyForgotten'));
  });
  dialog.addEventListener('close', () => { cancelAuthorization(); $('api-key').value = ''; });
  addEventListener('pagehide', () => {
    cancelAuthorization(); modelsController?.abort(); key = ''; model = ''; $('api-key').value = ''; onCredentials({key, model});
  });
  refreshLocale();
  return {refreshLocale, appURL};
}
