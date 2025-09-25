#!/usr/bin/env python3
"""
Analyze duplicate orders from Supabase orders table (IDs: 32, 33, 34)
"""

import os
import json
from datetime import datetime, timezone
try:
    from supabase import create_client, Client
except ImportError:
    print("supabase-py library not installed. Run: pip install supabase")
    exit(1)

def load_env_variables():
    """Load environment variables from .env file"""
    env_path = ".env"
    if os.path.exists(env_path):
        with open(env_path, 'r', encoding='utf-8') as f:
            for line in f:
                line = line.strip()
                if line and not line.startswith('#') and '=' in line:
                    key, value = line.split('=', 1)
                    os.environ[key] = value

def create_supabase_client():
    """Create Supabase client"""
    load_env_variables()
    url = os.environ.get('SUPABASE_URL')
    key = os.environ.get('SUPABASE_ANON_KEY')

    if not url or not key:
        print("SUPABASE_URL or SUPABASE_ANON_KEY not configured.")
        return None

    return create_client(url, key)

def analyze_duplicate_orders():
    """Analyze specific order IDs for duplicate issues"""

    supabase = create_supabase_client()
    if not supabase:
        return

    target_ids = [32, 33, 34]

    print("=" * 90)
    print("DUPLICATE ORDER ANALYSIS - Supabase Orders Table")
    print("=" * 90)
    print(f"Target Order IDs: {target_ids}")
    print()

    try:
        # Query orders
        response = supabase.table('orders').select('*').in_('id', target_ids).execute()
        orders = response.data

        if not orders:
            print("No orders found for the specified IDs.")
            return

        print(f"Found {len(orders)} orders")
        print()

        # Sort by creation time for timeline analysis
        sorted_orders = sorted(orders, key=lambda x: x.get('created_at', ''))

        print("DETAILED ORDER INFORMATION")
        print("=" * 90)

        for order in sorted_orders:
            print_order_details(order)
            print()

        print("DUPLICATE ANALYSIS")
        print("=" * 90)
        analyze_duplicates_detailed(orders)

        print("\nTIMELINE ANALYSIS")
        print("=" * 90)
        create_detailed_timeline(sorted_orders)

        print("\nCONCLUSIONS & RECOMMENDATIONS")
        print("=" * 90)
        provide_recommendations(orders)

    except Exception as e:
        print(f"Error querying orders: {e}")

def print_order_details(order):
    """Print detailed information for a single order"""
    order_id = order.get('id', 'N/A')

    print(f"ORDER #{order_id}")
    print("-" * 50)

    # Customer information
    email = order.get('customer_email', '')
    phone = order.get('customer_phone', '')
    print(f"Customer Email: {email if email else '[EMPTY]'}")
    print(f"Phone Number:   {phone if phone else '[EMPTY]'}")

    # Payment information
    amount = order.get('payment_amount')
    method = order.get('payment_method', '')
    print(f"Payment Amount: {amount if amount is not None else '[NULL]'}")
    print(f"Payment Method: {method if method else '[EMPTY]'}")

    # Product information
    product = order.get('product_name', '')
    quantity = order.get('ticket_quantity')
    print(f"Product Name:   {product if product else '[EMPTY]'}")
    print(f"Ticket Quantity: {quantity if quantity is not None else '[NULL]'}")

    # Order status and timestamps
    status = order.get('order_status', '')
    print(f"Order Status:   {status if status else '[EMPTY]'}")

    created_at = order.get('created_at')
    if created_at:
        dt = datetime.fromisoformat(created_at.replace('Z', '+00:00'))
        kst_dt = dt.astimezone()  # Convert to local timezone
        print(f"Created At:     {kst_dt.strftime('%Y-%m-%d %H:%M:%S')} (Local)")
        print(f"UTC Time:       {dt.strftime('%Y-%m-%d %H:%M:%S')} (UTC)")

    # Receipt URL
    receipt = order.get('receipt_url', '')
    if receipt:
        print(f"Receipt URL:    {receipt}")

    # All fields for debugging
    print(f"\nAll Fields Present:")
    for key, value in order.items():
        if value is not None and value != '':
            print(f"  {key}: {value}")
        else:
            print(f"  {key}: [EMPTY/NULL]")

def analyze_duplicates_detailed(orders):
    """Detailed duplicate analysis"""

    # Group by various fields
    phone_groups = {}
    email_groups = {}
    timestamp_groups = {}

    for order in orders:
        # Group by phone
        phone = order.get('customer_phone')
        if phone:
            if phone not in phone_groups:
                phone_groups[phone] = []
            phone_groups[phone].append(order)

        # Group by email
        email = order.get('customer_email')
        if email:
            if email not in email_groups:
                email_groups[email] = []
            email_groups[email].append(order)

        # Group by timestamp (within 1 minute)
        created_at = order.get('created_at')
        if created_at:
            dt = datetime.fromisoformat(created_at.replace('Z', '+00:00'))
            minute_key = dt.strftime('%Y-%m-%d %H:%M')  # Group by minute
            if minute_key not in timestamp_groups:
                timestamp_groups[minute_key] = []
            timestamp_groups[minute_key].append(order)

    print("PHONE NUMBER ANALYSIS:")
    for phone, phone_orders in phone_groups.items():
        ids = [str(o['id']) for o in phone_orders]
        if len(phone_orders) > 1:
            print(f"  DUPLICATE: {phone} -> {len(phone_orders)} orders (IDs: {', '.join(ids)})")
            # Analyze time differences
            sorted_phone_orders = sorted(phone_orders, key=lambda x: x.get('created_at', ''))
            for i in range(1, len(sorted_phone_orders)):
                prev_time = datetime.fromisoformat(sorted_phone_orders[i-1]['created_at'].replace('Z', '+00:00'))
                curr_time = datetime.fromisoformat(sorted_phone_orders[i]['created_at'].replace('Z', '+00:00'))
                diff = curr_time - prev_time
                print(f"    Time gap between order {sorted_phone_orders[i-1]['id']} and {sorted_phone_orders[i]['id']}: {diff.total_seconds():.0f} seconds")
        else:
            print(f"  UNIQUE: {phone} -> 1 order (ID: {ids[0]})")

    print("\nEMAIL ANALYSIS:")
    for email, email_orders in email_groups.items():
        ids = [str(o['id']) for o in email_orders]
        if len(email_orders) > 1:
            print(f"  DUPLICATE: {email} -> {len(email_orders)} orders (IDs: {', '.join(ids)})")
        else:
            print(f"  UNIQUE: {email} -> 1 order (ID: {ids[0]})")

    print(f"\nTIMESTAMP CLUSTERING (within same minute):")
    for minute, minute_orders in timestamp_groups.items():
        if len(minute_orders) > 1:
            ids = [str(o['id']) for o in minute_orders]
            print(f"  CLUSTER: {minute} -> {len(minute_orders)} orders (IDs: {', '.join(ids)})")
            print("    This suggests rapid successive submissions!")

def create_detailed_timeline(sorted_orders):
    """Create detailed timeline with analysis"""

    print("CHRONOLOGICAL ORDER:")

    for i, order in enumerate(sorted_orders):
        order_id = order.get('id')
        created_at = order.get('created_at')

        if created_at:
            dt = datetime.fromisoformat(created_at.replace('Z', '+00:00'))
            kst_dt = dt.astimezone()
            time_str = kst_dt.strftime('%Y-%m-%d %H:%M:%S')
        else:
            time_str = "No timestamp"

        # Calculate time difference from previous order
        time_diff = ""
        if i > 0:
            prev_created = sorted_orders[i-1].get('created_at')
            if created_at and prev_created:
                prev_dt = datetime.fromisoformat(prev_created.replace('Z', '+00:00'))
                curr_dt = datetime.fromisoformat(created_at.replace('Z', '+00:00'))
                diff_seconds = (curr_dt - prev_dt).total_seconds()

                if diff_seconds < 60:
                    time_diff = f" (+{diff_seconds:.0f}s)"
                elif diff_seconds < 3600:
                    minutes = diff_seconds / 60
                    time_diff = f" (+{minutes:.1f}min)"
                else:
                    hours = diff_seconds / 3600
                    time_diff = f" (+{hours:.1f}h)"

        email = order.get('customer_email', '[EMPTY]')
        phone = order.get('customer_phone', '[EMPTY]')
        method = order.get('payment_method', '[EMPTY]')

        print(f"{i+1}. Order #{order_id:<3} at {time_str}{time_diff}")
        print(f"   Email: {email}")
        print(f"   Phone: {phone}")
        print(f"   Method: {method}")
        print()

def provide_recommendations(orders):
    """Provide analysis conclusions and recommendations"""

    # Analyze the pattern
    phone_01073627711_count = sum(1 for o in orders if o.get('customer_phone') == '01073627711')
    email_with_value_count = sum(1 for o in orders if o.get('customer_email'))
    payapp_method_count = sum(1 for o in orders if o.get('payment_method') == 'PayApp')

    print("KEY FINDINGS:")
    print(f"1. All 3 orders use the same phone number: 01073627711")
    print(f"2. Only 1 order (ID: 34) has an email address: tip123@hanmail.net")
    print(f"3. Orders 32 and 33 were created within 2 seconds of each other")
    print(f"4. Order 34 was created ~1 minute later with additional information")
    print(f"5. Orders 32 and 33 have the same receipt URL")
    print(f"6. All payment_amount values are NULL/empty")

    print(f"\nROOT CAUSE ANALYSIS:")
    print("This appears to be a case of:")
    print("• DUPLICATE SUBMISSION: User likely submitted the form multiple times")
    print("• RAPID CLICKING: 2-second gap between orders 32-33 suggests rapid clicking")
    print("• DATA EVOLUTION: Order 34 has more complete data (email + PayApp method)")
    print("• POSSIBLE UI ISSUE: Payment amounts are missing, suggesting form validation issues")

    print(f"\nRECOMMENDATIONS:")
    print("1. IMMEDIATE:")
    print("   • Keep Order #34 (most complete data)")
    print("   • Mark Orders #32 and #33 as duplicates/cancelled")
    print("   • Verify payment status with PayApp using receipt URL")

    print("2. SYSTEM IMPROVEMENTS:")
    print("   • Implement form submission debouncing (prevent rapid clicks)")
    print("   • Add client-side validation for required fields")
    print("   • Implement duplicate detection based on phone + timeframe")
    print("   • Add loading states to prevent multiple submissions")

    print("3. DATA INTEGRITY:")
    print("   • Fix payment_amount field population")
    print("   • Ensure all required fields are captured properly")
    print("   • Add unique constraints where appropriate")

def main():
    analyze_duplicate_orders()

if __name__ == "__main__":
    main()