# Vercel 모바일 테스트 배포 가이드

덕이 킨더 바움 어린이집 앱을 **휴대폰에서 바로 열 수 있는 테스트 URL**로 배포하는 방법입니다.

---

## 배포 전 로컬 확인

```bash
npm install
npm run db:migrate
npm run db:seed
npm run build
npm run start
```

`npm run build` 가 오류 없이 끝나면 Vercel 배포 준비가 된 상태입니다.

---

## 1단계 — GitHub에 코드 올리기

1. [GitHub](https://github.com)에서 새 저장소 생성
2. 프로젝트 폴더에서:

```bash
git init
git add .
git commit -m "Prepare Vercel mobile deploy"
git branch -M main
git remote add origin https://github.com/YOUR_ID/haengbok-buja-daycare.git
git push -u origin main
```

> `.env` 파일은 올라가지 않습니다 (`.gitignore` 처리됨).

---

## 2단계 — Turso DB 만들기 (Vercel용 클라우드 DB)

로컬 SQLite(`dev.db`)는 Vercel 서버에서 **저장이 되지 않습니다**.  
무료 **Turso** DB를 사용합니다 (SQLite 호환, 기존 마이그레이션 그대로 사용).

1. [turso.tech](https://turso.tech) 가입
2. Turso CLI 설치 (Windows PowerShell):

```powershell
irm get.turso.tech/install.ps1 | iex
turso auth login
```

3. DB 생성:

```bash
turso db create haengbok-daycare-demo
turso db show haengbok-daycare-demo --url
turso db tokens create haengbok-daycare-demo
```

4. 출력된 값 메모:
   - `libsql://....turso.io` → `TURSO_DATABASE_URL`
   - 토큰 → `TURSO_AUTH_TOKEN`
   - `DATABASE_URL` = `libsql://....turso.io?authToken=토큰` (마이그레이션용)

5. 로컬에서 DB 초기화 (최초 1회):

```bash
# PowerShell — 환경변수 설정 후
$env:DATABASE_URL="libsql://....turso.io?authToken=YOUR_TOKEN"
$env:TURSO_DATABASE_URL="libsql://....turso.io"
$env:TURSO_AUTH_TOKEN="YOUR_TOKEN"
npx prisma migrate deploy
npm run db:seed
```

---

## 3단계 — Vercel 프로젝트 생성

1. [vercel.com](https://vercel.com) 로그인
2. **Add New → Project**
3. GitHub 저장소 `haengbok-buja-daycare` 선택
4. Framework: **Next.js** (자동 감지)
5. **Environment Variables** 추가:

| 이름 | 값 | 환경 |
|------|-----|------|
| `DATABASE_URL` | `libsql://....?authToken=...` | Production, Preview |
| `TURSO_DATABASE_URL` | `libsql://....turso.io` | Production, Preview |
| `TURSO_AUTH_TOKEN` | Turso 토큰 | Production, Preview |
| `AUTH_SECRET` | 32자 이상 랜덤 문자열 | Production, Preview |

6. **Deploy** 클릭

빌드 명령 (자동): `prisma generate && prisma migrate deploy && next build`

---

## 4단계 — 휴대폰 테스트 링크

배포 완료 후 Vercel이 `https://프로젝트명.vercel.app` URL을 줍니다.

### 바로 입장 (원터치)

| 역할 | 링크 | 설명 |
|------|------|------|
| **학부모** | `https://YOUR-APP.vercel.app/login/parent` | 김하늘 통장·미션 |
| **교사** | `https://YOUR-APP.vercel.app/login/teacher` | 반·원아·미션 적립 |
| **원장** | `https://YOUR-APP.vercel.app/login/director` | 전체 현황 |
| **홈** | `https://YOUR-APP.vercel.app/` | 역할 선택 |

카카오톡·문자로 위 링크를 보내면 선생님·학부모가 **비밀번호 없이** 바로 테스트할 수 있습니다.

---

## 5단계 — 모바일 점검 체크리스트

각 역할로 휴대폰에서 아래를 확인하세요.

### 학부모 (`/login/parent`)

- [ ] **미션 자동 적립** — 통장 → 오늘의 미션 터치 → +금액 적립
- [ ] **적립 내역** — 통장 기록 목록 표시
- [ ] **적립/잔액** — 적립하기, 잔액 즉시 변경
- [ ] **새로고침 후 유지** — 브라우저 새로고침 후 잔액·기록 유지 (기기 localStorage)

### 교사 (`/login/teacher`)

- [ ] **반 관리** — 반 추가·수정·삭제
- [ ] **원아 관리** — 원아 추가·사진 변경
- [ ] **미션 적립** — 원아 선택 → 칭찬 칩 터치
- [ ] **모바일 터치** — 버튼·칩 눌림 반응 자연스러움

### 원장 (`/login/director`)

- [ ] **대시보드** — 원아·적립 통계 표시
- [ ] **모바일 레이아웃** — 화면 잘림 없음

---

## 데이터 저장 위치 (중요)

| 데이터 | 저장 위치 | 새로고침 |
|--------|-----------|----------|
| 통장 적립·미션 | **휴대폰 브라우저 localStorage** | 같은 기기·브라우저에서 유지 |
| 원아·칭찬·로그인 | **Turso DB (서버)** | 모든 기기에서 공유 |
| 반 목록 (교사) | **localStorage** | 같은 기기에서 유지 |

> 통장 금액은 **기기별**로 저장됩니다. 다른 폰에서 같은 금액을 보려면 같은 기기를 사용하거나, 추후 서버 동기화가 필요합니다.

---

## 문제 해결

### 빌드 실패: `AUTH_SECRET is not set`
→ Vercel Environment Variables에 `AUTH_SECRET` 추가 후 Redeploy

### 빌드 실패: `migrate deploy` 오류
→ `DATABASE_URL`에 `?authToken=` 포함 여부 확인

### 로그인 후 빈 화면 / 데이터 없음
→ Turso DB에 시드 미실행. 로컬에서 2단계 5번(`db:seed`) 재실행

### Prisma adapter 오류
→ `TURSO_DATABASE_URL` + `TURSO_AUTH_TOKEN` 둘 다 설정 확인

---

## 재배포

GitHub에 push하면 Vercel이 자동 재배포합니다.

```bash
git add .
git commit -m "Update feature"
git push
```

Vercel 대시보드 → **Deployments** → 최신 배포 URL 확인
