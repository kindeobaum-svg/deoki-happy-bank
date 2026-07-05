# 행복부자 어린이집

**행복부자 프로젝트** — 아이들이 직접 **적립하기** 버튼을 누르며 행복 나무를 키우는 따뜻한 어린이집 앱입니다.

## 기능

- **역할별 로그인**: 학부모 / 교사 / 원장 / 원아
- **원장 관리자**: 전체 원아·적립 현황, 통장 관리
- **행복 적립 통장**: 아이별 통장번호, 적립 내역, 잔액 조회
- **원아 모드**: 적립하기, 나무 성장
- **푸시 알림 · PWA** 지원

## 실행 방법

```bash
npm install
npm run db:migrate
npm run db:seed
npm run dev
```

로컬 빌드 확인:

```bash
npm run build:local
```

## 모바일 테스트 배포 (Vercel)

휴대폰에서 접속 가능한 테스트 URL을 만들려면 **[DEPLOY-VERCEL.md](./DEPLOY-VERCEL.md)** 를 참고하세요.

| 역할 | 테스트 URL |
|------|------------|
| 학부모 | `/login/parent` |
| 교사 | `/login/teacher` |
| 원장 | `/login/director` |

## 로그인 (비밀번호: `1234`)

| 역할 | URL | 이메일 |
|------|-----|--------|
| 학부모 | `/login/parent` | `parent@haengbok.local` |
| 교사 | `/login/teacher` | `teacher@haengbok.local` |
| 원장 | `/login/director` | `director@haengbok.local` |
| 원아 | `/login/child` | `child@haengbok.local` |

## 주요 기능

- **출석 관리**: 출석 / 지각 / 결석 (교사) + 학부모 푸시
- **오늘의 칭찬**: 교사 칭찬 기록 → 학부모 알림
- **푸시 알림**: 출석·칭찬·적립·공지
- **초록색 따뜻한 UI**: 그라데이션·카드 디자인

## 주요 페이지

- `/admin` — 원장 관리자 대시보드
- `/passbook` — 아이별 행복 적립 통장
- `/child` — 원아 적립하기
- `/parent` — 학부모 현황
- `/teacher` — 교사 관리
