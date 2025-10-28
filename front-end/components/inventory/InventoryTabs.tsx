import Link from 'next/link';
import { useRouter } from 'next/router';

type Props = {
    inventoryId: number;
    currentTab: 'overview' | 'add' | 'manage' | 'sell' | 'history';
};

export default function InventoryTabs({ inventoryId, currentTab }: Props) {
    return (
        <div className="flex gap-4 mb-6 border-b">
            <Link
                href={`/Inventory/${inventoryId}`}
                className={`px-4 py-2 ${currentTab === 'overview' ? 'border-b-2 border-blue-600 font-semibold' : ''}`}
            >
                Overview
            </Link>
            <Link
                href={`/Inventory/${inventoryId}/add`}
                className={`px-4 py-2 ${currentTab === 'add' ? 'border-b-2 border-blue-600 font-semibold' : ''}`}
            >
                Add Items
            </Link>
            <Link
                href={`/Inventory/${inventoryId}/manage`}
                className={`px-4 py-2 ${currentTab === 'manage' ? 'border-b-2 border-blue-600 font-semibold' : ''}`}
            >
                Manage Items
            </Link>
            <Link
                href={`/Inventory/${inventoryId}/history`}
                className={`px-4 py-2 ${currentTab === 'history' ? 'border-b-2 border-blue-600 font-semibold' : ''}`}
            >
                Sales History
            </Link>
        </div>
    );
}
