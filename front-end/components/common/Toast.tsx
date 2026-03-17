import { ToastState } from '../../hooks/useToast';

type Props = { toast: ToastState };

export default function Toast({ toast }: Props) {
    if (!toast) return null;
    return (
        <div className={`fixed top-4 right-4 z-50 px-6 py-3 rounded-lg shadow-lg text-white font-medium transition-all ${
            toast.type === 'success' ? 'bg-green-600' : 'bg-red-600'
        }`}>
            {toast.message}
        </div>
    );
}
