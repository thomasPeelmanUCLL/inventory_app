import { Item } from '@types';

type Props = {
    item: Item;
    onClick: (item: Item) => void;
};

const ItemCard = ({ item, onClick }: Props) => {
    return (
        <div
            onClick={() => onClick(item)}
            className="bg-white rounded-lg shadow-md p-4 cursor-pointer hover:shadow-lg transition-shadow"
        >
            <h3 className="text-lg font-semibold mb-2">{item.name}</h3>
            <p className="text-gray-600 text-sm mb-4">{item.description}</p>
            <div className="flex justify-between items-center">
                <span className="text-green-600 font-bold text-xl">
                    ${Number(item.buyPrice).toFixed(2)}
                </span>
                <span className="text-gray-500 text-sm">
                    Qty: {item.quantity}
                </span>
            </div>
        </div>
    );
};

export default ItemCard;
