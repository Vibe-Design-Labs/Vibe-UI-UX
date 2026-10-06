import {validateSuggestions} from './core.js';
import {tokenDanceEndpoint, officialAppURL, validKey, validModel, boundedJSON, gatewayError, recoveryAction, suggestionBody} from './tokendance.js';
export {tokenDanceEndpoint};
const locales = ['zh-CN', 'en', 'ja', 'ko', 'de'];

export async function requestSuggestions({items, intent, model, locale, key, mode, signal, appURL = officialAppURL}, upstream = fetch) {
  if (!['direct', 'relay'].includes(mode) || !locales.includes(locale) ||
      typeof intent !== 'string' || !intent.trim() || intent.length > 2000 ||
      !validModel(model) || !validKey(key)) throw new Error('input');
  const headers = {'Content-Type': 'application/json'};
  let body, endpoint;
  if (mode === 'direct') {
    endpoint = tokenDanceEndpoint;
    headers.Authorization = 'Bearer ' + key;
    headers['X-App-URL'] = appURL;
    body = suggestionBody(items, {intent, model, locale});
  } else {
    endpoint = new URL('./api/translate', import.meta.url).href;
    headers['X-TokenDance-Key'] = key;
    body = {intent, model, locale};
  }
  let response;
  try {
    response = await upstream(endpoint, {method: 'POST', headers, body: JSON.stringify(body), signal,
      credentials: 'omit', referrerPolicy: 'no-referrer', redirect: 'error', cache: 'no-store'});
  } catch { throw new Error('network'); }
  // Never expose gateway error bodies; they can echo headers or credentials.
  if (!response.ok) {
    if (mode === 'direct') throw gatewayError(response);
    let error;
    try { error = await boundedJSON(response, 8000); } catch { throw new Error('network'); }
    const sanitized = new Error(['auth', 'limit', 'model', 'format', 'input', 'network'].includes(error?.error) ? error.error : 'network');
    sanitized.recovery = recoveryAction(error?.recovery);
    throw sanitized;
  }
  const value = await boundedJSON(response);
  let result = value;
  if (mode === 'direct') {
    let text = value.choices?.[0]?.message?.content;
    if (typeof text !== 'string' || text.length > 10000 || text.includes(key)) throw new Error('format');
    text = text.trim().replace(/^```(?:json)?\s*/, '').replace(/\s*```$/, '');
    try { result = JSON.parse(text); } catch { throw new Error('format'); }
  }
  if (JSON.stringify(result).includes(key)) throw new Error('format');
  try { return validateSuggestions(result, items); } catch { throw new Error('format'); }
}
