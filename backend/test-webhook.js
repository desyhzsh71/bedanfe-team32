const crypto = require('crypto');
const https = require('http');

// config
const MIDTRANS_SERVER_KEY = process.env.MIDTRANS_SERVER_KEY ||'Mid-server-A6PwGPAHedOlWdtzVABowiSp';
const order_id = '367bbc00-928e-43a2-a9a6-2423a3d03661'; 
const status_code = '200';
const gross_amount = '100000.00';

const signatureKey = order_id + status_code + gross_amount + MIDTRANS_SERVER_KEY;
const signature = crypto
    .createHash('sha512')
    .update(signatureKey)
    .digest('hex');

const payload = JSON.stringify({
    order_id: order_id,
    transaction_status: 'settlement',
    fraud_status: 'accept',
    status_code: status_code,
    gross_amount: gross_amount,
    signature_key: signature,
    payment_type: 'credit_card',
    transaction_id: 'test-tx-' + Date.now(),
    transaction_time: new Date().toISOString(),
});

console.log('Sending webhook...\n');
console.log(payload);

const options = {
    hostname: 'localhost',
    port: 3000,
    path: '/api/v1/webhooks/midtrans',
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(payload),
    },
};

const req = https.request(options, (res) => {
    let data = '';

    res.on('data', (chunk) => {
        data += chunk;
    });

    res.on('end', () => {
        console.log('\nResponse Status:', res.statusCode);
        console.log('Response Body:', data);
    });
});

req.on('error', (error) => {
    console.error('Error:', error.message);
});

req.write(payload);
req.end();