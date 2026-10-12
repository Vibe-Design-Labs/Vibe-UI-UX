import {locale,t} from './i18n.js';
export const componentWords={
 title:['组件代码','Component code','コンポーネントコード','컴포넌트 코드','Komponentencode'],
 target:['使用方式','Use in','利用先','사용 방식','Verwendung'],
 web:['独立 Web 示例','Standalone Web example','独立 Web デモ','독립 Web 예제','Eigenständiges Web-Beispiel'],
 react:['React 组件','React component','React コンポーネント','React 컴포넌트','React-Komponente'],
 video:['视频工程（Remotion）','Video project (Remotion)','動画プロジェクト（Remotion）','영상 프로젝트 (Remotion)','Videoprojekt (Remotion)'],
 download:['下载代码包','Download code package','コードをダウンロード','코드 패키지 다운로드','Codepaket herunterladen'],
 open:['打开独立示例 ↗','Open standalone example ↗','独立デモを開く ↗','독립 예제 열기 ↗','Eigenständiges Beispiel öffnen ↗'],
 unsupported:['此效果尚无独立组件实现，暂不提供代码导出。','This effect has no independent component implementation yet.','この効果の独立コンポーネントは未実装です。','이 효과의 독립 컴포넌트는 아직 없습니다.','Für diesen Effekt fehlt noch eine eigenständige Komponente.'],
 supported:['预览与导出复用同一实现，保留当前参数。','Preview and export share the implementation and current parameters.','プレビューと出力は同じ実装と現在の値を使います。','미리보기와 내보내기는 같은 구현과 현재 값을 사용합니다.','Vorschau und Export teilen Implementierung und aktuelle Parameter.'],
 conflict:['请先确认调参冲突，再导出代码。','Confirm parameter conflicts before exporting code.','値の競合を確認してから出力してください。','매개변수 충돌을 확인한 후 내보내세요.','Parameterkonflikte vor dem Export bestätigen.'],
 busy:['正在整理代码包…','Preparing code package…','コードを準備中…','코드 패키지 준비 중…','Codepaket wird vorbereitet…'],
 failed:['代码包整理失败，请重试。','Could not prepare the code package. Please retry.','コードを準備できませんでした。再試行してください。','코드 패키지를 준비하지 못했습니다. 다시 시도하세요.','Codepaket konnte nicht erstellt werden. Bitte erneut versuchen.'],
 exampleTitle:['让感觉，成为实现。','Let the feeling take shape.','感覚を、実装へ。','느낌을 구현으로.','Aus Gefühl wird Umsetzung.'],
 exampleBody:['同一组参数，同一份效果。试着交互，也可以拖动时间轴看演示脚本。','One set of parameters, one implementation. Interact or scrub the scripted timeline.','同じ値と同じ実装。操作したり、デモの時間を動かせます。','같은 값과 같은 구현. 직접 조작하거나 데모 타임라인을 움직이세요.','Ein Parametersatz, eine Implementierung. Interagieren oder die Demo-Zeitleiste bewegen.'],
 timeline:['演示脚本时间轴','Scripted demo timeline','デモの時間軸','데모 타임라인','Demo-Zeitleiste'],
 play:['返回实时交互','Return to interaction','操作に戻る','실시간 조작으로 돌아가기','Zur Interaktion zurück'],
 backend:['灯光渲染','Light renderer','光の描画','빛 렌더러','Lichtrenderer'],
 fallback:['CSS 近似回退','Approximate CSS fallback','CSS による近似','CSS 근사 대체','CSS-Näherung'],
};
const languages=['zh-CN','en','ja','ko','de'];
export const componentText=key=>componentWords[key]?.[languages.indexOf(locale)]||key;
export const effectLabels=()=>({title:t('cardTitle'),body:t('cardBody'),button:t('start'),rows:[t('tab1'),t('tab2'),t('tab3')]});
