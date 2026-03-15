export interface Plan {
    id: string;
    name: string;
    description?: string;
    price: string;
    billingCycle: 'MONTHLY' | 'YEARLY';
    features: Record<string, any>;
    limits: Record<string, number | string>; 
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
}

export interface Subscription {
    id: string;
    userId?: number;
    organizationId?: string;
    planId: string;
    status: 'ACTIVE' | 'CANCELLED' | 'EXPIRED' | 'TRIAL' | 'PENDING';
    startDate: string;
    endDate?: string;
    autoRenew: boolean;
    lastPaymentDate?: string;
    nextPaymentDate?: string;
    createdAt: string;
    updatedAt: string;

    plan?: {
        name: string;
        price: string;
        limits: Record<string, number | string>;
    };

    planName?: string;
    price?: string;
    projectLimit?: number | string;
    collaboratorLimit?: number | string;
    apiCallLimit?: number | string;
    bandwidthLimit?: number | string;
    mediaAssetLimit?: number | string;
}

export interface BillingAddress {
    id: string;
    userId: number;
    fullName: string;
    email: string;
    country: string;
    city: string;
    zipCode?: string;
    state: string;
    address: string;
    company?: string;
    createdAt: string;
    updatedAt: string;
}

export interface PaymentMethod {
    id: string;
    userId: number;
    type: 'CREDIT_CARD' | 'EWALLET' | 'VIRTUAL_ACCOUNT' | 'RETAIL' | 'PAYLATER' | 'QRIS';
    cardLastFour?: string;
    cardBrand?: string;
    walletProvider?: string;
    walletPhone?: string;
    isDefault: boolean;
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
}

export interface BillingHistory {
    id: string;
    subscriptionId: string;
    invoiceNumber: string;
    planName: string;
    amount: string; 
    status: 'PAID' | 'PENDING' | 'FAILED' | 'REFUNDED';
    paidAt?: string;
    invoiceUrl?: string;
    paymentMethod?: string;
    createdAt: string;
    updatedAt: string;
}

export interface UsageItem {
    used: number;
    limit: number | 'unlimited';
    percentage: number;
    warning: boolean;
}

export interface UsageData {
    bandwidth: UsageItem;
    apiCalls: UsageItem;
    mediaAssets: UsageItem;
    projects: UsageItem;
    collaborators: UsageItem;
}