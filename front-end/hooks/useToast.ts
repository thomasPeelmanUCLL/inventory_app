import { useState } from 'react';

export type ToastState = { message: string; type: 'success' | 'error' } | null;

export function useToast() {
    const [toast, setToast] = useState<ToastState>(null);

    const showToast = (message: string, type: 'success' | 'error' = 'success') => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 3000);
    };

    return { toast, showToast };
}
