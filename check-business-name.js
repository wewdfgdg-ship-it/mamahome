const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://glvbvrujursqvqryokzm.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdsdmJ2cnVqdXJzcXZxcnlva3ptIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTgwODQ5MTcsImV4cCI6MjA3MzY2MDkxN30.jtP3w5pgecw-77_R1yvW4zrwedgcbroH3guez7wOPnQ';
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkBusinessName() {
    console.log('Orders 테이블의 business_name 확인 중...\n');

    const { data, error } = await supabase
        .from('orders')
        .select('order_number, customer_name, business_name, industry_type, package_name')
        .order('created_at', { ascending: false })
        .limit(5);

    if (error) {
        console.error('Error:', error);
        return;
    }

    console.log('최근 5개 주문:');
    console.log('====================');
    data.forEach(order => {
        console.log(`주문번호: ${order.order_number}`);
        console.log(`고객명: ${order.customer_name || 'null'}`);
        console.log(`매장명: ${order.business_name || 'null'}`);
        console.log(`업종: ${order.industry_type || 'null'}`);
        console.log(`패키지: ${order.package_name || 'null'}`);
        console.log('--------------------');
    });
}

checkBusinessName();
