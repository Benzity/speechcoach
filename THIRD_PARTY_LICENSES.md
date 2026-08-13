# 오픈소스 라이선스 고지

SpeechCoach AI는 아래 오픈소스 소프트웨어를 이용합니다. 각 구성요소의 저작권
고지는 [`NOTICE`](./NOTICE) 파일을, 전체 의존성 목록은 [`sbom/`](./sbom) 디렉터리를
참조하십시오.

## 왜 이 파일이 필요한가

MediaPipe·OpenCV(Apache 2.0), Whisper·FastAPI·React(MIT), librosa(ISC) 등은
**상업적 이용에 제한이 없지만 고지 의무가 있습니다.**

- **Apache License 2.0**: 배포 시 NOTICE 파일의 고지 내용을 포함하고, 원본의
  저작권·특허·상표 고지를 유지해야 합니다.
- **MIT / BSD / ISC**: 저작권 표시와 라이선스 전문을 포함해야 합니다.

고지 의무는 엄밀히는 **"배포(distribute)"** 시점에 발동합니다. 서버에서만 실행하는
SaaS 형태는 배포가 아니라는 해석이 우세하나, 아래 경우에는 명확히 의무가 생깁니다.

1. 실행 파일(EXE·설치 패키지)을 배포할 때
2. 파트너 플랫폼에 SDK·위젯 형태로 삽입할 때
3. 데스크톱·모바일 앱을 출시할 때

또한 제휴 협상 시 상대 법무팀이 **오픈소스 목록(OSS BOM) 제출을 요구하는 경우가
많으므로**, 배포 여부와 무관하게 이 문서와 SBOM을 유지하는 것이 실무상 유리합니다.

## 라이선스 구성 요약

| 라이선스 | 주요 구성요소 | 의무 |
|---|---|---|
| Apache-2.0 | MediaPipe, OpenCV, bcrypt, anthropic-sdk | NOTICE 고지 포함, 변경사항 표시 |
| MIT | faster-whisper, Whisper, FastAPI, React, Vite, Tailwind | 저작권·라이선스 전문 포함 |
| BSD-3-Clause | NumPy, SciPy, uvicorn | 저작권 고지, 이름 사용 제한 |
| ISC | librosa | 저작권 고지 |
| MPL-2.0 | certifi (전이 의존성) | 해당 파일을 **수정한 경우에만** 소스 공개 |

### 카피레프트 검토 결과

현재 애플리케이션 런타임 의존성에는 **GPL/AGPL 계열이 없습니다.** 소스 공개
의무를 유발하는 강한 카피레프트는 확인되지 않았습니다.

`certifi`가 MPL-2.0이지만, MPL은 **파일 단위 카피레프트**라 해당 파일을 수정하지
않는 한 자체 코드를 공개할 의무가 없습니다. 현재 수정하지 않으므로 고지만으로
충분합니다.

> **주의 — 개발 도구는 별개입니다.** 코드 검사에 쓰는 `semgrep`은 LGPL-2.1이지만
> 제품에 포함되어 배포되지 않는 개발 도구이므로 고지 의무가 발생하지 않습니다.
> SBOM을 만들 때 개발 도구가 섞이면 불필요한 라이선스 경보가 발생하므로
> **런타임 의존성만으로 범위를 한정**해야 합니다.

## SBOM (Software Bill of Materials)

| 파일 | 범위 | 포맷 |
|---|---|---|
| `sbom/backend-declared.cdx.json` | 백엔드 선언 의존성 15개 | CycloneDX 1.6 |

### 갱신 방법

선언 의존성 기준 (빠름, 직접 의존성만):

```bash
pip install cyclonedx-bom
# Windows에서 requirements.txt에 한글 주석이 있으면 UTF-8 모드가 필요하다
PYTHONUTF8=1 cyclonedx-py requirements backend/requirements.txt \
  -o sbom/backend-declared.cdx.json --output-format JSON
```

전이 의존성까지 포함한 완전한 SBOM (권장, 파트너 제출용):

```bash
# ⚠️ 개발 도구가 섞이지 않도록 런타임 전용 가상환경에서 생성할 것
py -3.11 -m venv .venv-runtime
.venv-runtime/Scripts/pip install -r backend/requirements.txt
cyclonedx-py environment .venv-runtime \
  -o sbom/backend-full.cdx.json --output-format JSON
```

프론트엔드 (Node 설치 후):

```bash
cd frontend && npm install
npx @cyclonedx/cyclonedx-npm --output-file ../sbom/frontend.cdx.json
```

## 알려진 미비점

- [ ] **`requirements.txt`에 버전이 고정되어 있지 않습니다.** 빌드가 재현되지
      않으며, 상위 버전이 손상되면 그대로 유입됩니다. 운영 배포 전에
      `pip freeze` 기준으로 버전을 고정하는 것을 권장합니다.
- [ ] 프론트엔드 SBOM 미생성 (Node 미설치 환경)
- [ ] `NOTICE`의 저작권자명이 미확정 (`[TODO: 사업자명]`)
- [ ] 각 라이선스 전문(full text) 파일 미포함 — 배포 시점에 추가 필요

## 참고

- [Apache License 2.0](https://www.apache.org/licenses/LICENSE-2.0)
- [MediaPipe LICENSE](https://github.com/google-ai-edge/mediapipe/blob/master/LICENSE)
- [CycloneDX 명세](https://cyclonedx.org/specification/overview/)
