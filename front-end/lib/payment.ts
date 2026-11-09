import type { PaymentMethod } from '@types';

type PaymentMethodInfo = {
    label: string;
    emoji: string;
    /** Tailwind classes for the selected button and for badges/cards. */
    selected: string;
    badge: string;
    card: string;
    amount: string;
};

/** Display info for each payment method, in the order they are offered. */
export const PAYMENT_METHODS: Record<PaymentMethod, PaymentMethodInfo> = {
    CASH: {
        label: 'Cash',
        emoji: '💵',
        selected: 'border-green-500 bg-green-50 text-green-700',
        badge: 'bg-green-100 text-green-800',
        card: 'bg-green-50 border-green-200',
        amount: 'text-green-700',
    },
    CARD: {
        label: 'Card',
        emoji: '💳',
        selected: 'border-blue-500 bg-blue-50 text-blue-700',
        badge: 'bg-blue-100 text-blue-800',
        card: 'bg-blue-50 border-blue-200',
        amount: 'text-blue-700',
    },
    DRINK_CARD: {
        label: 'Drinking card',
        emoji: '🍺',
        selected: 'border-amber-500 bg-amber-50 text-amber-700',
        badge: 'bg-amber-100 text-amber-800',
        card: 'bg-amber-50 border-amber-200',
        amount: 'text-amber-700',
    },
};

export const PAYMENT_METHOD_ORDER = Object.keys(PAYMENT_METHODS) as PaymentMethod[];

export const DEFAULT_PAYMENT_METHOD: PaymentMethod = 'CASH';
