import Link from 'next/link';
import ItemCard from './ItemCard';

type Item = {
    id: number;
    name: string;
    description: string;
    price: number;
    quantity: number;
    buyedAt?: string;
    createdAt: string;
};

type Props = {
    items: Item[];
    inventoryId: number;
    canEdit: boolean;
    onItemClick: (item: Item) => void;
};

const ItemsGrid = ({ items, inventoryId, canEdit, onItemClick }: Props) => {
    if (items.length === 0) {
        return (
            <div className="text-center py-12 bg-white rounded-lg border-2 border-dashed border-gray-300">
                <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                </svg>
                <h3 className="mt-2 text-sm font-medium text-gray-900">No items</h3>
                <p className="mt-1 text-sm text-gray-500">Get started by adding items to your inventory.</p>
                {canEdit && (
                    <Link href={`/Inventory/${inventoryId}/add`}>
                        <button className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                            Add Item
                        </button>
                    </Link>
                )}
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {items.map((item) => (
                <ItemCard key={item.id} item={item} onClick={onItemClick} />
            ))}
        </div>
    );
};

export default ItemsGrid;
