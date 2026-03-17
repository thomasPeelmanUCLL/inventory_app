import { useRouter } from 'next/router';

export default function CreateInventoryPage() {
    const router = useRouter();
    router.replace('/inventory');
    return null;
}
