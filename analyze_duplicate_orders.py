#!/usr/bin/env python3
"""
Supabase orders 테이블에서 32, 33, 34번 행을 조회하여 중복 주문 문제 분석
"""

import os
import json
from datetime import datetime, timezone
import pandas as pd
try:
    from supabase import create_client, Client
except ImportError:
    print("supabase-py 라이브러리가 설치되지 않았습니다.")
    print("설치 명령어: pip install supabase")
    exit(1)

def load_env_variables():
    """환경변수 로드"""
    env_path = ".env"
    if os.path.exists(env_path):
        with open(env_path, 'r', encoding='utf-8') as f:
            for line in f:
                line = line.strip()
                if line and not line.startswith('#') and '=' in line:
                    key, value = line.split('=', 1)
                    os.environ[key] = value

def create_supabase_client():
    """Supabase 클라이언트 생성"""
    load_env_variables()

    url = os.environ.get('SUPABASE_URL')
    key = os.environ.get('SUPABASE_ANON_KEY')

    if not url or not key:
        print("SUPABASE_URL 또는 SUPABASE_ANON_KEY가 설정되지 않았습니다.")
        return None

    return create_client(url, key)

def analyze_orders(supabase: Client, order_ids: list):
    """특정 주문 ID들을 조회하고 분석"""

    print("=" * 80)
    print("Supabase Orders 테이블 중복 주문 분석")
    print("=" * 80)

    # 주문 조회
    try:
        response = supabase.table('orders').select('*').in_('id', order_ids).execute()
        orders = response.data

        print(f"\n조회된 주문 수: {len(orders)}개")

        if not orders:
            print("해당 ID들로 주문을 찾을 수 없습니다.")
            return

        # 주문별 상세 정보 출력
        print("\n" + "=" * 80)
        print("주문별 상세 정보")
        print("=" * 80)

        for i, order in enumerate(orders):
            print(f"\n주문 #{order['id']} ({i+1}/{len(orders)})")
            print("-" * 50)

            # 기본 정보
            print(f"이메일: {order.get('customer_email', 'N/A')}")
            print(f"전화번호: {order.get('customer_phone', 'N/A')}")
            print(f"결제 금액: {order.get('payment_amount', 'N/A')}원")
            print(f"상품명: {order.get('product_name', 'N/A')}")

            # 시간 정보
            created_at = order.get('created_at')
            if created_at:
                # ISO 형식 시간을 한국시간으로 변환
                dt = datetime.fromisoformat(created_at.replace('Z', '+00:00'))
                kst_time = dt.astimezone(timezone(offset=datetime.now().astimezone().utcoffset()))
                print(f"생성 시간: {kst_time.strftime('%Y-%m-%d %H:%M:%S')} (KST)")

            # 추가 정보들
            print(f"결제 방법: {order.get('payment_method', 'N/A')}")
            print(f"주문 상태: {order.get('order_status', 'N/A')}")
            print(f"티켓 수량: {order.get('ticket_quantity', 'N/A')}")

            # receipt_url이 있으면 출력
            if order.get('receipt_url'):
                print(f"영수증 URL: {order.get('receipt_url')}")

        # 중복 분석
        print("\n" + "=" * 80)
        print("중복 주문 분석")
        print("=" * 80)

        analyze_duplicates(orders)

        # 시간 순서대로 정렬하여 타임라인 생성
        print("\n" + "=" * 80)
        print("주문 타임라인 (시간순)")
        print("=" * 80)

        create_timeline(orders)

    except Exception as e:
        print(f"주문 조회 중 오류 발생: {e}")

def analyze_duplicates(orders):
    """중복 주문 패턴 분석"""

    # 이메일별 그룹화
    email_groups = {}
    phone_groups = {}
    amount_groups = {}

    for order in orders:
        email = order.get('customer_email')
        phone = order.get('customer_phone')
        amount = order.get('payment_amount')

        if email:
            if email not in email_groups:
                email_groups[email] = []
            email_groups[email].append(order)

        if phone:
            if phone not in phone_groups:
                phone_groups[phone] = []
            phone_groups[phone].append(order)

        if amount:
            if amount not in amount_groups:
                amount_groups[amount] = []
            amount_groups[amount].append(order)

    # 중복 이메일 체크
    print("\n이메일별 분석:")
    for email, group_orders in email_groups.items():
        if len(group_orders) > 1:
            ids = [str(order['id']) for order in group_orders]
            print(f"  [중복] {email}: {len(group_orders)}개 주문 (ID: {', '.join(ids)})")
        else:
            print(f"  [정상] {email}: 1개 주문 (ID: {group_orders[0]['id']})")

    # 중복 전화번호 체크
    print("\n전화번호별 분석:")
    for phone, group_orders in phone_groups.items():
        if len(group_orders) > 1:
            ids = [str(order['id']) for order in group_orders]
            print(f"  [중복] {phone}: {len(group_orders)}개 주문 (ID: {', '.join(ids)})")
        else:
            print(f"  [정상] {phone}: 1개 주문 (ID: {group_orders[0]['id']})")

    # 중복 결제금액 체크
    print("\n결제금액별 분석:")
    for amount, group_orders in amount_groups.items():
        if len(group_orders) > 1:
            ids = [str(order['id']) for order in group_orders]
            print(f"  [중복] {amount}원: {len(group_orders)}개 주문 (ID: {', '.join(ids)})")
        else:
            print(f"  [정상] {amount}원: 1개 주문 (ID: {group_orders[0]['id']})")

def create_timeline(orders):
    """주문 타임라인 생성"""

    # 시간순으로 정렬
    sorted_orders = sorted(orders, key=lambda x: x.get('created_at', ''))

    for i, order in enumerate(sorted_orders):
        created_at = order.get('created_at')
        if created_at:
            dt = datetime.fromisoformat(created_at.replace('Z', '+00:00'))
            kst_time = dt.astimezone(timezone(offset=datetime.now().astimezone().utcoffset()))
            time_str = kst_time.strftime('%Y-%m-%d %H:%M:%S')
        else:
            time_str = "시간 정보 없음"

        # 이전 주문과의 시간 차이 계산
        time_diff = ""
        if i > 0:
            prev_order = sorted_orders[i-1]
            if created_at and prev_order.get('created_at'):
                prev_dt = datetime.fromisoformat(prev_order.get('created_at').replace('Z', '+00:00'))
                curr_dt = datetime.fromisoformat(created_at.replace('Z', '+00:00'))
                diff = curr_dt - prev_dt
                total_seconds = diff.total_seconds()

                if total_seconds < 60:
                    time_diff = f" (+{int(total_seconds)}초)"
                elif total_seconds < 3600:
                    time_diff = f" (+{int(total_seconds//60)}분 {int(total_seconds%60)}초)"
                else:
                    hours = int(total_seconds // 3600)
                    minutes = int((total_seconds % 3600) // 60)
                    time_diff = f" (+{hours}시간 {minutes}분)"

        print(f"{i+1}. [ID:{order['id']:2d}] {time_str}{time_diff}")
        print(f"    이메일: {order.get('customer_email', 'N/A')}")
        print(f"    금액: {order.get('payment_amount', 'N/A')}원")
        print()

def main():
    """메인 함수"""

    # Supabase 클라이언트 생성
    supabase = create_supabase_client()
    if not supabase:
        return

    # 분석할 주문 ID들
    target_order_ids = [32, 33, 34]

    print(f"분석 대상 주문 ID: {target_order_ids}")

    # 주문 분석 실행
    analyze_orders(supabase, target_order_ids)

    print("\n" + "=" * 80)
    print("분석 완료")
    print("=" * 80)

if __name__ == "__main__":
    main()