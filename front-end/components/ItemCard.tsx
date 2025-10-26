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
    item: Item;
    onClick: (item: Item) => void;
};

const ItemCard = ({ item, onClick }: Props) => {
    return (
        <div
            onClick={() => onClick(item)}
            className="bg-white rounded-lg border border-gray-200 p-5 hover:shadow-lg transition-shadow cursor-pointer group"
        >
            <div className="flex justify-between items-start mb-3">
                <h3 className="text-lg font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                    {item.name}
                </h3>
                <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full font-medium">
          Qty: {item.quantity}
        </span>
            </div>
            <p className="text-gray-600 text-sm mb-4 line-clamp-2">{item.description}</p>
            <div className="flex items-center justify-between">
                <span className="text-xl font-bold text-green-600">${item.price.toFixed(2)}</span>
                <span className="text-xs text-gray-500">Click to sell</span>
            </div>
        </div>
    );
};

export default ItemCard;
