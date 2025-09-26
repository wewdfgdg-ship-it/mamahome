const { createClient } = require('@supabase/supabase-js');

// Supabase configuration from config.js
const SUPABASE_CONFIG = {
    SUPABASE_URL: 'https://glvbvrujursqvqryokzm.supabase.co',
    SUPABASE_ANON_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdsdmJ2cnVqdXJzcXZxcnlva3ptIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTgwODQ5MTcsImV4cCI6MjA3MzY2MDkxN30.jtP3w5pgecw-77_R1yvW4zrwedgcbroH3guez7wOPnQ'
};

const supabaseClient = createClient(SUPABASE_CONFIG.SUPABASE_URL, SUPABASE_CONFIG.SUPABASE_ANON_KEY);

async function debugPayAppReceipts() {
    console.log('=== PayApp Receipt URL Debug Analysis ===\n');

    try {
        // 1. Query ALL payapp_payments records
        console.log('1. Querying payapp_payments table...');
        const { data: payappData, error: payappError } = await supabaseClient
            .from('payapp_payments')
            .select('*')
            .order('created_at', { ascending: false });

        if (payappError) {
            console.error('PayApp query error:', payappError);
            return;
        }

        console.log(`Found ${payappData.length} PayApp payment records\n`);

        // 2. Query ALL orders records
        console.log('2. Querying orders table...');
        const { data: ordersData, error: ordersError } = await supabaseClient
            .from('orders')
            .select('*')
            .order('created_at', { ascending: false });

        if (ordersError) {
            console.error('Orders query error:', ordersError);
            return;
        }

        console.log(`Found ${ordersData.length} order records\n`);

        // 3. Analyze phone number formats
        console.log('3. Phone Number Format Analysis:');
        console.log('='.repeat(50));

        console.log('\n📱 PayApp Payments - recvphone formats:');
        const payappPhones = new Set();
        payappData.forEach((payment, index) => {
            if (payment.recvphone) {
                payappPhones.add(payment.recvphone);
                console.log(`${index + 1}. ${payment.recvphone} (order_id: ${payment.order_id}, mul_no: ${payment.mul_no})`);
            }
        });

        console.log(`\n📱 Orders - customer_phone formats:`);
        const orderPhones = new Set();
        ordersData.forEach((order, index) => {
            if (order.customer_phone) {
                orderPhones.add(order.customer_phone);
                console.log(`${index + 1}. ${order.customer_phone} (order_number: ${order.order_number}, business_name: ${order.business_name})`);
            }
        });

        // 4. Compare matching records
        console.log('\n4. Phone Number Matching Analysis:');
        console.log('='.repeat(50));

        let exactMatches = 0;
        let possibleMatches = [];

        ordersData.forEach(order => {
            const orderPhone = order.customer_phone;
            if (!orderPhone) return;

            // Check for exact matches
            const exactMatch = payappData.find(payment => payment.recvphone === orderPhone);
            if (exactMatch) {
                exactMatches++;
                console.log(`✅ EXACT MATCH: ${orderPhone}`);
                console.log(`   Order: ${order.order_number} (${order.business_name} - ${order.package_name})`);
                console.log(`   PayApp: order_id=${exactMatch.order_id}, mul_no=${exactMatch.mul_no}, receipt_url=${exactMatch.receipt_url}`);
            } else {
                // Check for possible format variations
                const cleanOrderPhone = orderPhone.replace(/-/g, ''); // Remove dashes
                const possibleMatch = payappData.find(payment => {
                    const cleanPayappPhone = payment.recvphone ? payment.recvphone.replace(/-/g, '') : '';
                    return cleanPayappPhone === cleanOrderPhone;
                });

                if (possibleMatch) {
                    possibleMatches.push({
                        order: order,
                        payapp: possibleMatch,
                        orderPhone: orderPhone,
                        payappPhone: possibleMatch.recvphone
                    });
                }
            }
        });

        console.log(`\n📊 Summary: ${exactMatches} exact matches found`);

        if (possibleMatches.length > 0) {
            console.log(`\n⚠️ Possible format mismatches (${possibleMatches.length}):`);
            possibleMatches.forEach(match => {
                console.log(`   Order phone: "${match.orderPhone}" vs PayApp phone: "${match.payappPhone}"`);
                console.log(`   Order: ${match.order.order_number} vs PayApp: order_id=${match.payapp.order_id}`);
            });
        }

        // 5. Examine receipt URLs and payurl data
        console.log('\n5. Receipt URLs Analysis:');
        console.log('='.repeat(50));

        payappData.forEach((payment, index) => {
            console.log(`\nPayApp Record ${index + 1}:`);
            console.log(`  recvphone: ${payment.recvphone}`);
            console.log(`  order_id: ${payment.order_id}`);
            console.log(`  mul_no: ${payment.mul_no}`);
            console.log(`  receipt_url: ${payment.receipt_url || 'NULL'}`);
            console.log(`  payurl: ${payment.payurl || 'NULL'}`);
            console.log(`  created_at: ${payment.created_at}`);
        });

        // 6. Check for any orders without PayApp matches
        console.log('\n6. Orders WITHOUT PayApp matches:');
        console.log('='.repeat(50));

        ordersData.forEach(order => {
            const orderPhone = order.customer_phone;
            if (!orderPhone) {
                console.log(`❌ Order ${order.order_number}: NO phone number`);
                return;
            }

            const hasMatch = payappData.some(payment => payment.recvphone === orderPhone);
            if (!hasMatch) {
                console.log(`❌ Order ${order.order_number}: Phone ${orderPhone} - No PayApp match`);
                console.log(`   Business: ${order.business_name}, Package: ${order.package_name}`);
            }
        });

    } catch (error) {
        console.error('Error during analysis:', error);
    }
}

// Run the analysis
debugPayAppReceipts();