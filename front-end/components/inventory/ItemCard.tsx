import { Item } from '@types';
import { getDefaultSellPriceForItem } from '../../lib/pricing';

type Props = {
    item: Item;
    canEdit: boolean;
    onSell: (item: Item) => void;
};

const ItemCard = ({ item, canEdit, onSell }: Props) => {
    const { finalSellPrice } = getDefaultSellPriceForItem(item);

    return (
        <div className="bg-white rounded-lg shadow-md p-4 hover:shadow-lg transition-shadow">
            <h3 className="text-lg font-semibold mb-2">{item.name}</h3>
            <p className="text-gray-600 text-sm mb-4">{item.description}</p>
            <div className="flex justify-between items-center">
                <span className="text-green-600 font-bold text-xl">
                    ${Number(finalSellPrice).toFixed(2)}
                </span>
                <span className="text-gray-500 text-sm">Qty: {item.quantity}</span>
            </div>
            {canEdit && (
                <button
                    onClick={() => onSell(item)}
                    className="mt-3 w-full px-3 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors"
                >
                    Sell
                </button>
            )}
        </div>
    );
};

export default ItemCard;
