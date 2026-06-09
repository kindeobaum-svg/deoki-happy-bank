# 덕이킨더바움 행복부자 통장

덕이킨더바움 행복부자 통장 앱의 최소 Python/SQLite 백엔드입니다.

## 주요 기능

- 매일 오전 2시 반복 미션 자동 재생성
- 완료한 반복 미션은 다음날 새 `pending` 미션으로 자동 초기화
- 원장, 교사, 학부모 역할 분리
- 원장은 모든 반과 모든 아이 조회 가능
- 교사는 배정된 반의 아이와 미션만 조회/완료 가능
- 학부모는 연결된 아이와 미션만 조회/완료 가능

## 실행

외부 의존성이 없으며 Python 3.12 이상에서 실행됩니다.

```bash
python3 -m happy_bank.server --host 0.0.0.0 --port 8000
```

서버가 시작되면 데모 데이터가 자동으로 생성되고, 백그라운드 스케줄러가 매일
`Asia/Seoul` 기준 오전 2시에 롤오버를 실행합니다. 앱 시작 시 이미 오전 2시가
지난 경우에는 그날의 롤오버를 한 번 보정 실행합니다.

## API 예시

모든 조회 API는 `user_id`를 기준으로 역할 범위를 적용합니다.

```bash
# 원장: 모든 반 조회
curl 'http://127.0.0.1:8000/api/classes?user_id=1'

# 교사: 배정 반 아이만 조회
curl 'http://127.0.0.1:8000/api/children?user_id=2'

# 학부모: 연결 아이 미션만 조회
curl 'http://127.0.0.1:8000/api/missions?user_id=4&date=2026-06-09'

# 원장 전용 수동 롤오버
curl -X POST 'http://127.0.0.1:8000/api/admin/rollover' \
  -H 'Content-Type: application/json' \
  -d '{"user_id": 1, "date": "2026-06-09"}'
```

## 테스트

```bash
python3 -m unittest discover
```
