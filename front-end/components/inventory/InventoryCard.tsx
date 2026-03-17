import { useRouter } from 'next/router';
import { Inventory } from '@types';

type InventoryCardProps = {
    inventory: Inventory;
    currentUserId?: string;
    onDelete: (id: number) => void;
};

export default function InventoryCard({ inventory, currentUserId, onDelete }: InventoryCardProps) {
    const router = useRouter();
    const role = inventory.users?.find(u => u.user.id === currentUserId)?.role || 'viewer';
    const isOwner = role === 'owner';

    return (
        <div className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow p-6">
            <div className="flex justify-between items-start mb-4">
                <div className="flex-1">
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">{inventory.name}</h3>
                    <p className="text-gray-600 text-sm mb-3">{inventory.description}</p>
                    <span className={`inline-block px-3 py-1 text-xs font-medium rounded-full ${
                        role === 'owner' ? 'bg-purple-100 text-purple-800' :
                        role === 'editor' ? 'bg-blue-100 text-blue-800' :
                        'bg-gray-100 text-gray-800'
                    }`}>
                        {role.charAt(0).toUpperCase() + role.slice(1)}
                    </span>
                </div>
            </div>
            <div className="flex gap-2">
                <button
                    onClick={() => router.push(`/Inventory/${inventory.id}`)}
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                    View
                </button>
                {isOwner && inventory.id && (
                    <button
                        onClick={() => onDelete(inventory.id!)}
                        className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                    >
                        Delete
                    </button>
                )}
            </div>
        </div>
    );
}
