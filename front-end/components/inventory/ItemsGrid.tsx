import Link from 'next/link';
import ItemCard from './ItemCard';
import { Item } from '@types';  // Import from types instead

type Props = {
    items: Item[];
    onItemClick: (item: Item) => void;
};

const ItemsGrid = ({ items, onItemClick }: Props) => {
    if (items.length === 0) {
        return (
            <div className="text-center py-12 text-gray-500">
                <p>No items available</p>
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {items.map((item) => (
                <ItemCard
                    key={item.id}
                    item={item}
                    onClick={onItemClick}
                />
            ))}
        </div>
    );
};

export default ItemsGrid;
