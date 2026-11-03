import { useState } from 'react';
import PriceVariablesSection from './PriceVariablesSection';
import WebsiteCatalogueSection, {
    WebsiteCatalogueFormErrors,
    WebsiteCatalogueFormValues,
} from './WebsiteCatalogueSection';
import { catalogueFormFromItem, catalogueFormToPayload, hasErrors, validateCatalogueForm } from '../../lib/catalogue';
import { ItemPayload } from '../../lib/api';
import { Item } from '@types';

type BasicFields = { name: string; description: string; buyPrice: string; quantity: string };

type Props = {
    item: Item;
    canEdit: boolean;
    onSave: (patch: Partial<ItemPayload>) => Promise<boolean>;
    onDelete: () => void;
};

const inputClass = 'w-full px-2 py-1 border border-gray-300 rounded';
const buttonClass = 'px-3 py-1 text-white rounded';

/** One item on the manage page: read-only by default, inline editor (with catalogue fields) on Edit. */
export default function ManageItemRow({ item, canEdit, onSave, onDelete }: Props) {
    const [draft, setDraft] = useState<BasicFields | null>(null);
    const [catalogue, setCatalogue] = useState<WebsiteCatalogueFormValues>(() => catalogueFormFromItem(item));
    const [catalogueErrors, setCatalogueErrors] = useState<WebsiteCatalogueFormErrors>({});
    const [showPrices, setShowPrices] = useState(false);

    const startEditing = () => {
        setDraft({
            name: item.name,
            description: item.description,
            buyPrice: String(item.buyPrice ?? 0),
            quantity: String(item.quantity ?? 0),
        });
        setCatalogue(catalogueFormFromItem(item));
        setCatalogueErrors({});
    };

    const save = async () => {
        if (!draft) return;
        const errors = validateCatalogueForm(catalogue);
        setCatalogueErrors(errors);
        if (hasErrors(errors)) return;
        const saved = await onSave({
            name: draft.name,
            description: draft.description,
            buyPrice: parseFloat(draft.buyPrice) || 0,
            quantity: parseInt(draft.quantity, 10) || 0,
            ...catalogueFormToPayload(catalogue),
        });
        if (saved) setDraft(null);
    };

    const cell = (label: string, field: keyof BasicFields, view: React.ReactNode, type = 'text') => (
        <div>
            <div className="text-xs text-gray-500 mb-1">{label}</div>
            {draft ? (
                <input
                    type={type}
                    step={type === 'number' && field === 'buyPrice' ? '0.01' : undefined}
                    value={draft[field]}
                    onChange={(e) => setDraft({ ...draft, [field]: e.target.value })}
                    className={inputClass}
                />
            ) : (
                view
            )}
        </div>
    );

    return (
        <div className="border border-gray-200 rounded-lg overflow-hidden">
            <div className="bg-gray-50 p-4">
                <div className="flex items-center justify-between">
                    <div className="flex-1 grid grid-cols-4 gap-4">
                        {cell(
                            'Name',
                            'name',
                            <div className="font-medium">
                                {item.name}
                                {item.publishedToWebsite && (
                                    <span className="ml-2 inline-flex text-xs px-2 py-0.5 rounded bg-indigo-100 text-indigo-700">
                                        Published
                                    </span>
                                )}
                            </div>,
                        )}
                        {cell('Description', 'description', <div className="text-sm">{item.description}</div>)}
                        {cell(
                            'Buy Price',
                            'buyPrice',
                            <div className="text-green-600 font-medium">€{Number(item.buyPrice || 0).toFixed(2)}</div>,
                            'number',
                        )}
                        {cell('Quantity', 'quantity', <div>{item.quantity}</div>, 'number')}
                    </div>
                    {canEdit && (
                        <div className="ml-4 flex gap-2">
                            {draft ? (
                                <>
                                    <button onClick={save} className={`${buttonClass} bg-green-600 hover:bg-green-700`}>
                                        Save
                                    </button>
                                    <button
                                        onClick={() => setDraft(null)}
                                        className={`${buttonClass} bg-gray-500 hover:bg-gray-600`}
                                    >
                                        Cancel
                                    </button>
                                </>
                            ) : (
                                <>
                                    <button
                                        onClick={startEditing}
                                        className={`${buttonClass} bg-blue-600 hover:bg-blue-700`}
                                    >
                                        Edit
                                    </button>
                                    <button
                                        onClick={() => setShowPrices(!showPrices)}
                                        className={`${buttonClass} bg-purple-600 hover:bg-purple-700`}
                                    >
                                        {showPrices ? '▼' : '▶'} Prices
                                    </button>
                                    <button onClick={onDelete} className={`${buttonClass} bg-red-600 hover:bg-red-700`}>
                                        Delete
                                    </button>
                                </>
                            )}
                        </div>
                    )}
                </div>
            </div>
            {showPrices && item.id && <PriceVariablesSection itemId={item.id} canEdit={canEdit} />}
            {draft && (
                <div className="p-4 border-t border-gray-200">
                    <WebsiteCatalogueSection
                        value={catalogue}
                        errors={catalogueErrors}
                        onChange={(field, value) => setCatalogue((form) => ({ ...form, [field]: value }))}
                    />
                </div>
            )}
        </div>
    );
}
