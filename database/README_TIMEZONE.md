# Supabase에서 한국 시간 표시하기

## 문제
- orders 테이블의 시간이 UTC로 표시됨 (예: 2025-09-23 02:35:16)
- users 테이블은 한국 시간으로 잘 표시됨

## 해결 방법

### 1. SQL Editor에서 fix_orders_timezone.sql 실행
1. Supabase Dashboard 접속
2. SQL Editor 메뉴 클릭
3. `database/fix_orders_timezone.sql` 내용 복사
4. 실행 (Run 버튼 클릭)

### 2. Table Editor에서 직접 한국 시간 보기

#### 방법 A: orders_kst 뷰 사용
1. Table Editor에서 `orders_kst` 뷰 선택
2. `created_at_display` 컬럼이 한국 시간으로 표시됨

#### 방법 B: SQL 쿼리 사용
```sql
SELECT
  order_number as "주문번호",
  customer_name as "고객명",
  TO_CHAR(created_at AT TIME ZONE 'Asia/Seoul', 'YYYY-MM-DD HH24:MI:SS') as "생성시간",
  status as "상태"
FROM orders
ORDER BY created_at DESC;
```

### 3. Table Editor 시간대 설정 변경 (관리자 권한 필요)

1. **Project Settings** → **Database**
2. **Timezone** 설정을 `Asia/Seoul`로 변경
3. 저장 후 새로고침

### 4. 브라우저 확장 프로그램 사용 (임시 방법)

브라우저의 시간대를 한국으로 설정하는 확장 프로그램 사용:
- Chrome: "TimeShift" 또는 "Change Timezone" 확장
- 시간대를 Asia/Seoul로 설정

## 확인 방법

SQL Editor에서 다음 쿼리 실행:
```sql
-- 현재 시간대 확인
SHOW timezone;

-- 한국 시간으로 변환된 데이터 확인
SELECT
  order_number,
  customer_name,
  TO_CHAR(created_at AT TIME ZONE 'Asia/Seoul', 'YYYY-MM-DD HH24:MI:SS') as "한국시간",
  TO_CHAR(created_at, 'YYYY-MM-DD HH24:MI:SS') as "UTC시간"
FROM orders
LIMIT 5;
```

## 영구 해결책

### 옵션 1: Generated Column 사용 (권장)
```sql
ALTER TABLE orders
ADD COLUMN created_at_kst TIMESTAMP GENERATED ALWAYS AS
  (created_at AT TIME ZONE 'Asia/Seoul') STORED;
```

### 옵션 2: Trigger 사용
생성/수정 시 자동으로 한국 시간을 별도 컬럼에 저장

### 옵션 3: View 사용
`orders_kst` 뷰를 생성하여 항상 한국 시간으로 표시

## 주의사항

1. **데이터 저장**: 데이터는 항상 UTC로 저장하는 것이 좋습니다
2. **표시만 변경**: 저장된 데이터를 변경하지 않고 표시만 한국 시간으로
3. **API 응답**: API는 여전히 UTC를 반환하므로 클라이언트에서 변환 필요

## 현재 상태

- ✅ SQL 파일 준비 완료: `database/fix_orders_timezone.sql`
- ⏳ Supabase SQL Editor에서 실행 필요
- ⏳ Table Editor 설정 변경 필요

## users 테이블이 한국 시간으로 보이는 이유

users 테이블은 Supabase Auth가 관리하는 특별한 테이블로, 다음과 같은 이유로 다르게 표시될 수 있습니다:

1. **Auth 설정**: Supabase Auth 설정에서 시간대가 설정됨
2. **메타데이터**: Auth 테이블은 메타데이터에 시간대 정보 포함
3. **뷰어 설정**: Auth 테이블용 별도 뷰어가 시간대 변환 처리

## 추가 도움말

문제가 지속되면:
1. Supabase Support에 문의
2. Project Settings에서 Database Timezone 확인
3. PostgreSQL 버전 및 설정 확인