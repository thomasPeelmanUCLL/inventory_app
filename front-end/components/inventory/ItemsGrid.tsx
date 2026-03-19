import ItemCard from './ItemCard';
import { Item } from '@types';

type Props = {
    items: Item[];
    canEdit: boolean;
    onSell: (item: Item) => void;
};

const ItemsGrid = ({ items, canEdit, onSell }: Props) => {
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
                <ItemCard key={item.id} item={item} canEdit={canEdit} onSell={onSell} />
            ))}
        </div>
    );
};

export default ItemsGrid;
