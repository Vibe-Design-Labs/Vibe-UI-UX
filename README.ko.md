# IntentKit / 意译

[中文](README.md) · [English](README.en.md) · [日本語](README.ja.md) · [한국어](README.ko.md) · [Deutsch](README.de.md)

**“이런 느낌이면 좋겠어”를 눈으로 확인하고 조정하며 코딩 도우미에게 전달할 수 있는 디자인 설명으로.**

[홈페이지](https://vibe-design-labs.github.io/Vibe-UI-UX/) · [작업대 체험](https://vibe-design-labs.github.io/Vibe-UI-UX/studio.html) · [변경 기록](CHANGELOG.md)

**v0.4.1.1.1 · 75 디자인 항목 · 16 제어된 미리보기 템플릿 · 5 로컬 레시피 유형 · MIT + OFL**

[![실제 작업대 녹화: 나뭇잎 커서, 따뜻한 스포트라이트, 클릭 파동, 순차 등장](docs/media/effects.gif)](https://vibe-design-labs.github.io/Vibe-UI-UX/studio.html?item=custom-cursor)

프로젝트의 실제 렌더러를 녹화했습니다. AI 생성 이미지가 아닙니다. GIF는 녹화본이며 [온라인 작업대](https://vibe-design-labs.github.io/Vibe-UI-UX/studio.html)에서 직접 조작하고 값을 조정할 수 있습니다. 시스템의 동작 줄이기 설정도 반영합니다.

## IntentKit 소개

Vibe coding에서 느낌을 정확히 전달하는 일은 생각보다 어렵습니다. “더 가볍게”는 호버 상승일까요, 크기 변화일까요, 여백일까요? IntentKit은 일상 표현을 UI/UX 용어, 별칭, 예시와 구체적인 매개변수에 연결해 디자이너, 개발자, 입문자가 같은 결과를 이해하도록 돕습니다.

Design Compiler의 흐름은 **일상 표현 → 수정 가능한 의도 이해(Design IR) → 검증된 레시피 → 실제 미리보기 → 디자인 설명 / Agent 설명 / JSON**입니다. 디자인 제안을 확인하는 도구이며 전체 페이지 생성이나 모델이 출력한 임의 코드 실행은 지원하지 않습니다.

| 기능 | 현재 지원 |
| --- | --- |
| 용어 라이브러리 | 75개 항목, 정리된 별칭, 정의, 사용 조건, 출처 검색 |
| 효과 작업대 | 16개 템플릿, 검증된 값 조정, 설명, JSON, 단일 효과 공유 링크 |
| Design Compiler | 가벼운 상승, 따뜻한 빛과 상승, 누름 피드백, 순차 등장, 클릭 파동 5종 |
| 커서 | 8가지 모양; 색, 크기, 따라가기, 클릭 반응과 별도의 조명 설정 |
| 언어 | 중국어·영어·일본어·한국어·독일어 인터페이스. 위 링크로 README 언어 전환 |
| 선택적 AI | 개인 TokenDance 연결을 통한 의도 분석 및 기존 효과 추천 |

## 처음에는 키 없이 체험

1. [작업대](https://vibe-design-labs.github.io/Vibe-UI-UX/studio.html)를 열고 오른쪽 위에서 한국어를 선택합니다.
2. 로컬 예시 중 살짝 떠오르는 카드를 선택합니다. 직접 입력하고 ‘이해하고 생성’을 눌러도 됩니다. 키가 없으면 로컬 규칙을 사용합니다.
3. 이해 결과를 확인하고 편집 항목을 펼쳐 대상, 트리거, 강도를 수정합니다. 기본값과 추론은 사용자가 명시한 의도와 따로 표시합니다.
4. 카드에 마우스를 올리고 오른쪽 값을 조정합니다. 미리보기, 설명, 레시피는 같은 최종 값을 사용합니다. 의도와 충돌하면 경고를 확인한 뒤 현재 값을 적용할지 명시적으로 결정합니다.
5. 컴파일 결과의 **Agent 설명**을 코딩 도우미에게 전달하거나 **컴파일 JSON**을 내보냅니다. 기존 오른쪽 JSON 버튼은 별도의 **단일 효과 JSON**입니다.

용어 검색은 왼쪽에서 `frosted glass`, `backdrop-filter` 등의 별칭으로 가능합니다. **75개 항목에 모두 전용 미리보기가 있는 것은 아닙니다.** 새 항목 50개에는 전용 렌더러가 없으며 일반적인 개념 예시임을 화면에 표시합니다.

![Design Compiler 작업대: 의도 이해, 실제 미리보기, 값과 Agent 설명](docs/media/studio.png)

## AI가 필요할 때 TokenDance 연결

1. TokenDance 연결 버튼을 누릅니다. 공개 모델 목록만 불러오는 단계에서는 모델을 호출하지 않습니다.
2. 승인 팝업으로 새 키를 만들거나 [TokenDance 키 관리](https://tokendance.space/keys)의 기존 키를 입력합니다. 승인은 사용자가 확인한 뒤 키를 생성합니다.
3. 대화 프로토콜을 지원하는 모델을 선택하고 ‘현재 페이지에만 저장’을 누릅니다. 목록 실패 시 공식 모델 ID를 직접 입력할 수 있습니다.
4. 키 설정 후 ‘효과 찾기’ 또는 ‘이해하고 생성’을 직접 눌러야 모델을 호출합니다. 사용료는 TokenDance에서 청구합니다. 로컬 예시 5개는 연결 후에도 모델을 호출하지 않습니다.
5. 키 삭제로 연결을 해제합니다. **키는 페이지 메모리에만 있으며 새로고침 시 삭제됩니다.** 계정 시스템이 없고 키를 localStorage, sessionStorage, 저장소, GitHub Secrets에 저장하지 않습니다. 언어 설정은 저장할 수 있습니다.

Pages는 브라우저에서 TokenDance에 직접 연결하고 로컬 서버 버전은 현재 인스턴스를 경유합니다. 신뢰할 수 있는 환경에서만 키를 입력하세요. 분석 실패 시 로컬 규칙으로 돌아가며 유료 요청을 자동 재시도하지 않습니다. 실제 키를 사용한 유료 전체 흐름 검증은 아직 완료되지 않았습니다. [연결과 검증 범위](docs/TOKENDANCE.md)(중국어).

## Fork를 로컬에서 실행

**Node.js 20 이상**이 필요합니다. 콘텐츠 확인과 소스 압축에는 **Python 3**도 사용합니다. npm 의존성이 없어 npm install이 필요 없으며 시작할 때 키도 필요 없습니다.

```sh
git clone https://github.com/Vibe-Design-Labs/Vibe-UI-UX.git
cd Vibe-UI-UX
npm run dev
```

[http://localhost:4173/studio.html](http://localhost:4173/studio.html)을 엽니다. Fork 사용 시 clone URL을 자신의 저장소로 바꾸세요. 소스 수정 후 서버를 종료하고 다시 시작하면 재빌드합니다.

정적 버전 확인 및 실행:

```sh
npm test
npm run check:content
npm run check:docs
python scripts/package-source.py
npm run build:pages
npm run preview:pages
```

정적 미리보기: [http://localhost:4174/Vibe-UI-UX/](http://localhost:4174/Vibe-UI-UX/). 배포 출력은 `dist/pages/`입니다. python이 없는 환경에서는 python3를 사용하세요. 이 과정은 모델을 호출하지 않습니다.

## 자신의 GitHub Pages에 배포

1. Fork한 저장소에서 Actions를 활성화합니다.
2. **Settings → Pages → Source → GitHub Actions**를 선택합니다.
3. **Actions → Deploy GitHub Pages → Run workflow**로 최초 배포를 실행합니다.
4. 성공 후 Pages 설정 또는 배포 출력의 실제 주소를 사용합니다. 이후 main으로 push하면 자동 업데이트됩니다.

상대 경로를 사용해 Fork와 저장소 하위 경로를 지원합니다. **모델 키나 GitHub Secret을 설정할 필요가 없습니다.** 사용자가 자신의 TokenDance를 연결합니다. [전체 배포 안내](docs/GITHUB_PAGES.md)(중국어).

## 항목·레시피·효과 관리

파일을 읽고 쓸 수 있는 AI에 [관리 skill](skills/ui-ux-content-maintainer/SKILL.md)을 전달하거나 직접 편집합니다. 기존 템플릿은 `content/items/`에 JSON을 추가합니다. 새 렌더러는 등록 정보와 렌더러도 수정해야 합니다. [레시피 관리](skills/ui-ux-content-maintainer/references/compiler-recipes.md)를 참고하세요.

`npm run check:content`, `npm test`, `npm run check:docs`를 실행하고 필요한 경우 [폰트 서브셋](docs/FONTS.md), 압축 파일, Pages를 재생성합니다. 스크립트는 GPT 키나 모델 한도를 사용하지 않습니다. 다른 AI 자체의 비용은 별도입니다. [관리 절차](docs/CONTENT_MAINTENANCE.md)(중국어).

| 위치 | 역할 |
| --- | --- |
| `content/items/` | 용어, 별칭, 번역, 출처, 검토 상태 |
| `previews/registry.json` + `public/previews.js` | 매개변수 규약과 렌더러 |
| `compiler/` + `public/compiler-*.js` | IR, 5개 언어 표현, 레시피, 검증, 컴파일 UI |
| `public/` | 정적 웹, 작업대, 번역, TokenDance 연결 |
| `server/worker.js` | 선택적 로컬 중계. Pages에는 불필요 |
| `.github/workflows/pages.yml` | 확인, 압축, 빌드, 배포 |

## 현재 제한

- 항목 본문은 주로 중국어와 영어 초안입니다. 일본어·한국어·독일어 본문은 영어로 명시적으로 대체합니다. 5개 언어 UI와 5개 언어 지식의 검토 완료는 다릅니다.
- 로컬 규칙은 레시피 5종만 다룹니다. 모호하거나 지원하지 않는 요구는 미해결 항목으로 표시합니다. 템플릿 조합, 스프링, 문장 속 정확한 숫자의 자동 적용은 아직 없습니다.
- 구조 검증은 사실과 번역의 인증이 아닙니다. 초안이 남아 엄격한 공개 검토는 아직 통과하지 않습니다. 읽지 못한 위챗 기사 본문을 읽은 출처로 꾸미지 않았습니다.
- 미리보기는 개념 예시이며 실제 데이터를 저장하지 않습니다. 구현 전 내보낸 결과를 확인하세요. 동작 줄이기, 터치, 키보드에 맞는 인터랙션을 유지합니다.

[컴파일러 구조](docs/DESIGN_COMPILER.md) · [새 항목 50개와 출처](docs/CONTENT_EXPANSION_2026-10-07.md) · [배포 확인](docs/RELEASE_0.4.1.1.1.md) · [5단계 버전 규칙](docs/VERSIONING.md)(상세 문서는 중국어).

## 라이선스와 감사

앱 코드는 [MIT](LICENSE)입니다. Ma Shan Zheng, LXGW WenKai, Caveat 글꼴은 **SIL OFL 1.1**이며 고지와 생성 절차는 [글꼴 안내](docs/FONTS.md)에 있습니다. README 화면과 녹화는 실제 프로젝트 화면입니다.

초기 인터랙션 방향은 Hyperknow, 종이·먹·주홍·손글씨 분위기는 사용자 참고 이미지에서 출발했습니다. 배치와 코드는 직접 작성했고 참고 사이트의 이미지, 상표, 컴포넌트 소스를 재사용하지 않았습니다. 출처, 번역, 재현 가능한 효과, 오류 제안은 [Issues](https://github.com/Vibe-Design-Labs/Vibe-UI-UX/issues)에 남겨주세요.
