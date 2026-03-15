import crypto from 'crypto';

interface CustomerDetails {
    firstName: string;
    email: string;
    phone: string;
}

interface ItemDetail {
    id: string;
    name: string;
    price: number;
    quantity: number;
}

interface MidtransTransactionParams {
    orderId: string;
    amount: number;
    customerDetails: CustomerDetails;
    itemDetails: ItemDetail[];
}

interface MidtransResponse {
    token: string;
    redirect_url: string;
    transaction_id: string;
}

export async function createMidtransTransaction(
    params: MidtransTransactionParams
): Promise<MidtransResponse> {
    try {
        const { orderId, amount, customerDetails, itemDetails } = params;

        // midtrans server key (dari .env)
        const serverKey = process.env.MIDTRANS_SERVER_KEY!;
        const isProduction = process.env.MIDTRANS_IS_PRODUCTION === 'true';

        const baseUrl = isProduction
            ? 'https://app.midtrans.com/snap/v1/transactions'
            : 'https://app.sandbox.midtrans.com/snap/v1/transactions';

        const transactionData = {
            transaction_details: {
                order_id: orderId,
                gross_amount: amount,
            },
            customer_details: {
                first_name: customerDetails.firstName,
                email: customerDetails.email,
                phone: customerDetails.phone,
            },
            item_details: itemDetails,
            callbacks: {
                finish: `${process.env.FRONTEND_URL}/billing/payment/success`,
                error: `${process.env.FRONTEND_URL}/billing/payment/error`,
                pending: `${process.env.FRONTEND_URL}/billing/payment/pending`,
            },

            ...(process.env.BACKEND_URL && {
                notification_url: `${process.env.BACKEND_URL}/api/webhooks/midtrans`,
            }),
        };

        // create header otorisasi
        const authHeader = Buffer.from(serverKey + ':').toString('base64');

        const response = await fetch(baseUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Basic ${authHeader}`,
            },
            body: JSON.stringify(transactionData),
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(`Midtrans API error: ${JSON.stringify(errorData)}`);
        }

        const data = await response.json();

        return {
            token: data.token,
            redirect_url: data.redirect_url,
            transaction_id: orderId,
        };
    } catch (error) {
        console.error('Error creating Midtrans transaction:', error);
        throw new Error('Failed to create payment transaction');
    }
}

// verifikasi sign notifikasi dari midtrans
export function verifyMidtransSignature(
    orderId: string,
    statusCode: string,
    grossAmount: string
): string {
    const serverKey = process.env.MIDTRANS_SERVER_KEY!;
    const signatureKey = orderId + statusCode + grossAmount + serverKey;

    return crypto
        .createHash('sha512')
        .update(signatureKey)
        .digest('hex');
}

// mengecek apakah notifikasi dari midtrans valid atau tidak
export function isValidMidtransNotification(
    orderId: string,
    statusCode: string,
    grossAmount: string,
    signatureKey: string
): boolean {
    const calculatedSignature = verifyMidtransSignature(orderId, statusCode, grossAmount);
    return calculatedSignature === signatureKey;
}