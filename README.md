# 행복부자 통장

**좋은 습관을 만들고 행복씨앗을 모으는 앱** — 아이들이 미션을 완료하며 행복숲 통장에 적립하는 어린이집 앱입니다.

## 1차 버전 기능

### 원장
- 반 관리
- 교사 관리
- 전체 아이 보기

### 교사
- 원아 관리
- 학부모 초대
- 미션 관리
- 통장 입금

### 학부모
- 우리 아이 통장 보기
- 오늘 미션 보기
- 미션 완료
- 적립 내역 보기

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

- **미션 적립**: 학부모 미션 완료, 교사 통장 입금
- **행복숲 통장**: 적립 내역·잔액 조회
- **푸시 알림**: 출석·칭찬·적립·공지
- **PWA** 지원

## 주요 페이지

- `/admin` — 원장 관리자 대시보드
- `/passbook` — 아이별 행복숲 통장
- `/parent` — 학부모 홈
- `/teacher` — 교사 관리
