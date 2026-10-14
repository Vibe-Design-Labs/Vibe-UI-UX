import {runConnectionCheck} from './connection-check-core.js';
const languages=['zh-CN','en','ja','ko','de'],words={
 title:['无需密钥的连接检查','Connection check without a key','キー不要の接続確認','키 없이 연결 확인','Verbindung ohne Schlüssel prüfen'],
 intro:['在当前浏览器检查公开模型目录，以及接口是否拒绝未认证的空请求。不会请求生成效果。','Check the public catalog and whether the API rejects an empty unauthenticated request in this browser. No effect generation.','このブラウザで公開モデル一覧と未認証の空リクエストへの応答を確認します。エフェクトは生成しません。','현재 브라우저에서 공개 모델 목록과 미인증 빈 요청 응답을 확인합니다. 효과를 생성하지 않습니다.','Öffentlichen Katalog und Ablehnung einer leeren Anfrage ohne Anmeldung in diesem Browser prüfen. Keine Effektgenerierung.'],
 scope:['检查通过只说明这些匿名接口可访问，不能确认此前的请求来源、实际模型或计费。','A passing check only confirms these anonymous API responses, not the source, model or billing of a previous call.','確認できるのは匿名APIの応答だけです。以前の呼び出し元、実モデル、料金は確認できません。','익명 API 응답만 확인합니다. 이전 호출의 출처·실제 모델·과금은 확인하지 못합니다.','Prüft nur diese anonymen API-Antworten, nicht Herkunft, Modell oder Kosten eines früheren Aufrufs.'],
 run:['开始检查（不调用模型）','Run check (no model call)','確認する（モデル呼出なし）','검사 시작(모델 호출 없음)','Prüfen (kein Modellaufruf)'],
 cancel:['停止检查','Cancel check','確認を中止','검사 중지','Prüfung abbrechen'],
 copy:['复制检查结果','Copy check results','結果をコピー','결과 복사','Ergebnis kopieren'],
 idle:['无需填写密钥，点击开始检查即可。','No key needed. Click Run check.','キーは不要です。確認ボタンを押してください。','키 입력 없이 검사 시작을 누르세요.','Kein Schlüssel nötig. Prüfung starten.'],
 working:['正在检查匿名接口…','Checking anonymous API responses…','匿名APIを確認中…','익명 API 확인 중…','Anonyme API-Antworten werden geprüft…'],
 done:['检查结束，请复制下方结果回传。','Check complete. Copy the report below.','確認終了。下の結果をコピーしてください。','검사 완료. 아래 결과를 복사하세요.','Prüfung beendet. Bericht unten kopieren.'],
 stopped:['检查已停止，已收到的结果保留。','Check cancelled; received results preserved.','確認を中止。受信済みの結果は保持します。','검사 중지됨. 수신 결과는 유지합니다.','Abgebrochen; empfangene Ergebnisse bleiben erhalten.'],
 failed:['检查未完成，可稍后重新进行匿名检查。','Check incomplete. You can repeat this anonymous check later.','確認が完了しませんでした。後で匿名確認を再実行できます。','검사 미완료. 나중에 익명 검사를 다시 할 수 있습니다.','Prüfung unvollständig. Anonyme Prüfung später erneut möglich.'],
 catalog:['公开模型目录','Public model catalog','公開モデル一覧','공개 모델 목록','Öffentlicher Modellkatalog'],
 auth:['无密钥空请求','Empty request without a key','キーなしの空リクエスト','키 없는 빈 요청','Leere Anfrage ohne Schlüssel'],
 expected:['预期：401 未认证','Expected: 401 Unauthorized','期待値：401 未認証','예상: 401 미인증','Erwartet: 401 ohne Anmeldung'],
 k3:['目录包含 Kimi K3','Catalog includes Kimi K3','一覧にKimi K3あり','목록에 Kimi K3 있음','Katalog enthält Kimi K3'],
 missing:['目录未确认 Kimi K3','Kimi K3 not confirmed in catalog','一覧のKimi K3は未確認','목록의 Kimi K3 미확인','Kimi K3 im Katalog nicht bestätigt'],
 unexpected:['异常：空请求未被正常拒绝，不能据此确认模型执行。','Unexpected response to the empty request; this does not confirm model execution.','空リクエストへの応答が想定外です。モデル実行を確認できません。','빈 요청의 응답이 예상과 다릅니다. 모델 실행을 확인할 수 없습니다.','Unerwartete Antwort auf die leere Anfrage; bestätigt keine Modellausführung.'],
 unavailable:['当前浏览器无法读取预期响应，可能是网络、跨域或访问拒绝。','This browser could not read the expected response: network, CORS or access rejection may apply.','期待した応答を読み取れません。ネットワーク、CORS、アクセス拒否の可能性があります。','예상 응답을 읽을 수 없습니다. 네트워크·CORS·접근 거부 가능성이 있습니다.','Erwartete Antwort nicht lesbar: Netzwerk, CORS oder Zugriff abgelehnt.'],
 report:['可复制的脱敏检查报告','Sanitized report to copy','コピー用の匿名化レポート','복사 가능한 비밀정보 제외 보고서','Bereinigter Bericht zum Kopieren'],
 privacy:['报告仅含接口地址、状态、目录是否包含 K3 和响应元数据。URL 不保留查询或凭据；不读取密钥，不读取其他页面或浏览记录。','Report contains endpoint URLs, status, K3 availability and response metadata. No URL queries or credentials, keys, other pages or browsing history are read.','レポートはAPIのURL、状態、K3の有無、応答情報のみです。URLのクエリや認証情報、キー、他のページ、閲覧履歴は読み取りません。','보고서는 API 주소·상태·K3 포함 여부·응답 정보만 담습니다. URL 쿼리·인증정보·키·다른 페이지·방문 기록을 읽지 않습니다.','Bericht enthält API-Adressen, Status, K3-Verfügbarkeit und Antwortmetadaten. Keine URL-Abfragen, Zugangsdaten, Schlüssel, anderen Seiten oder Browserverläufe werden gelesen.'],
 back:['返回工作台','Return to studio','スタジオに戻る','작업대로 돌아가기','Zum Studio'],
 copied:['已复制，可粘贴回聊天。','Copied. Paste into the chat.','コピーしました。チャットに貼り付けてください。','복사됨. 채팅에 붙여 넣으세요.','Kopiert. In den Chat einfügen.'],
 copyFailed:['浏览器未允许自动复制。请选中下方报告手动复制。','Automatic copy unavailable. Select the report below and copy manually.','自動コピーできません。下のレポートを選択して手動コピーしてください。','자동 복사를 사용할 수 없습니다. 아래 보고서를 선택해 수동 복사하세요.','Automatisches Kopieren nicht verfügbar. Bericht unten auswählen und manuell kopieren.']
};
const $=id=>document.getElementById(id),preferred=new URL(location.href).searchParams.get('lang');let language=languages.includes(preferred)?preferred:'zh-CN',report=null,active=null,state='idle';$('language').value=language;
const text=key=>words[key][languages.indexOf(language)];
function render(){
 document.documentElement.lang=language;for(const key of ['title','intro','scope','run','cancel','copy','privacy','back'])$(key).textContent=text(key);$('report-label').textContent=text('report');$('status').textContent=text(state);$('run').disabled=!!active;$('cancel').disabled=!active;$('copy').disabled=!report;$('results').replaceChildren();
 for(const item of report?.checks||[]){const p=document.createElement('p'),catalog=item.test==='public-model-catalog';p.textContent=(catalog?text('catalog'):text('auth'))+' · HTTP '+(item.httpStatus??'—')+' · '+(catalog?item.outcome==='catalog-readable'?(item.kimiK3Available?text('k3'):text('missing')):text('unavailable'):item.outcome==='authentication-required'?text('expected'):item.outcome==='unexpected-success'?text('unexpected'):text('unavailable'));p.dataset.warning=String(catalog?item.outcome!=='catalog-readable':item.outcome!=='authentication-required');$('results').append(p);}
 $('report').value=report?JSON.stringify(report,null,2):'';
}
$('language').addEventListener('change',event=>{language=event.target.value;render();});
$('run').addEventListener('click',async()=>{
 if(active)return;const controller=new AbortController();active=controller;report=null;state='working';$('copy-status').textContent='';render();const timer=setTimeout(()=>controller.abort(),30000);
 try{const response=await fetch(new URL('./version.json',import.meta.url),{signal:controller.signal,credentials:'omit',cache:'no-store'}),metadata=response.ok?await response.json():null;report=await runConnectionCheck({signal:controller.signal,pageURL:location.href,version:metadata?.version});state=report.cancelled?'stopped':'done';}catch{state=controller.signal.aborted?'stopped':'failed';}
 finally{clearTimeout(timer);active=null;render();}
});
$('cancel').addEventListener('click',()=>active?.abort());
$('copy').addEventListener('click',async()=>{if(!report)return;try{await navigator.clipboard.writeText(JSON.stringify(report,null,2));$('copy-status').textContent=text('copied');}catch{$('copy-status').textContent=text('copyFailed');$('report').focus();$('report').select();}});
addEventListener('pagehide',()=>active?.abort());render();
