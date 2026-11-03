import { FormEvent, useState } from 'react';
import InventoryPageLayout from '@components/inventory/InventoryPageLayout';
import WebsiteCatalogueSection, {
    WebsiteCatalogueFormErrors,
    WebsiteCatalogueFormValues,
} from '@components/inventory/WebsiteCatalogueSection';
import { createItem } from '../../../lib/api';
import { catalogueFormToPayload, emptyCatalogueForm, hasErrors, validateCatalogueForm } from '../../../lib/catalogue';
import { useInventoryPage } from '../../../hooks/useInventoryPage';
import { useToast } from '../../../hooks/useToast';

const emptyItemForm = { name: '', description: '', buyPrice: '', quantity: '', buyedAt: '' };

const inputClass =
    'w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent';
const labelClass = 'block text-sm font-medium text-gray-700 mb-2';

const AddItemPage = () => {
    const page = useInventoryPage();
    const { toast, showToast } = useToast();
    const [itemForm, setItemForm] = useState(emptyItemForm);
    const [catalogue, setCatalogue] = useState<WebsiteCatalogueFormValues>(emptyCatalogueForm);
    const [catalogueErrors, setCatalogueErrors] = useState<WebsiteCatalogueFormErrors>({});

    const setField = (field: keyof typeof emptyItemForm) => (e: { target: { value: string } }) =>
        setItemForm((form) => ({ ...form, [field]: e.target.value }));

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        if (!page.inventoryId) return;

        const errors = validateCatalogueForm(catalogue);
        setCatalogueErrors(errors);
        if (hasErrors(errors)) return;

        try {
            await createItem({
                name: itemForm.name,
                description: itemForm.description,
                buyPrice: parseFloat(itemForm.buyPrice),
                quantity: parseInt(itemForm.quantity, 10),
                buyedAt: itemForm.buyedAt || undefined,
                inventoryId: page.inventoryId,
                ...catalogueFormToPayload(catalogue),
            });
            setItemForm(emptyItemForm);
            setCatalogue(emptyCatalogueForm);
            await page.reload();
            showToast('Item added successfully!');
        } catch (err) {
            showToast((err instanceof Error && err.message) || 'Failed to add item', 'error');
        }
    };

    return (
        <InventoryPageLayout page={page} activeTab="add" toast={toast}>
            {(inventory) =>
                !page.canEdit ? (
                    <div className="text-center text-red-600">
                        You don&apos;t have permission to add items to this inventory.
                    </div>
                ) : (
                    <>
                        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
                            <h2 className="text-2xl font-bold text-gray-900 mb-6">Create New Item</h2>

                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div>
                                    <label className={labelClass}>Item Name *</label>
                                    <input
                                        type="text"
                                        value={itemForm.name}
                                        onChange={setField('name')}
                                        className={inputClass}
                                        placeholder="Enter item name"
                                        required
                                    />
                                </div>

                                <div>
                                    <label className={labelClass}>Description *</label>
                                    <textarea
                                        value={itemForm.description}
                                        onChange={setField('description')}
                                        className={inputClass}
                                        placeholder="Enter item description"
                                        rows={3}
                                        required
                                    />
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className={labelClass}>Buy Price *</label>
                                        <div className="relative">
                                            <span className="absolute left-3 top-2 text-gray-500">€</span>
                                            <input
                                                type="number"
                                                step="0.01"
                                                min="0"
                                                value={itemForm.buyPrice}
                                                onChange={setField('buyPrice')}
                                                className={`${inputClass} pl-8`}
                                                placeholder="0.00"
                                                required
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label className={labelClass}>Quantity *</label>
                                        <input
                                            type="number"
                                            min="0"
                                            step="1"
                                            value={itemForm.quantity}
                                            onChange={setField('quantity')}
                                            className={inputClass}
                                            placeholder="0"
                                            required
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className={labelClass}>Purchase Date (Optional)</label>
                                    <input
                                        type="date"
                                        value={itemForm.buyedAt}
                                        onChange={setField('buyedAt')}
                                        className={inputClass}
                                    />
                                </div>

                                <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
                                    <p className="text-sm text-blue-800">
                                        <strong>Note:</strong> Price variables can be added after creating the
                                        item. Go to the &quot;Manage&quot; tab to configure price variables for
                                        existing items.
                                    </p>
                                </div>

                                <WebsiteCatalogueSection
                                    value={catalogue}
                                    errors={catalogueErrors}
                                    onChange={(field, value) => setCatalogue((form) => ({ ...form, [field]: value }))}
                                />

                                <button
                                    type="submit"
                                    className="w-full bg-blue-600 text-white py-3 px-4 rounded-md hover:bg-blue-700 transition-colors font-medium"
                                >
                                    Add Item
                                </button>
                            </form>
                        </div>

                        <div className="bg-white rounded-lg shadow-md p-6">
                            <h2 className="text-xl font-bold text-gray-900 mb-4">
                                Current Items ({inventory.items?.length || 0})
                            </h2>
                            <div className="space-y-4">
                                {inventory.items?.length ? (
                                    inventory.items.map((item) => (
                                        <div
                                            key={item.id}
                                            className="border border-gray-200 rounded-md p-4 hover:border-blue-400 transition-colors"
                                        >
                                            <h3 className="font-semibold text-lg text-gray-900">{item.name}</h3>
                                            <p className="text-gray-600 text-sm mt-1">{item.description}</p>
                                            <div className="flex gap-4 mt-2 text-sm">
                                                <span className="text-green-600 font-medium">
                                                    €{Number(item.buyPrice ?? 0).toFixed(2)}
                                                </span>
                                                <span className="text-gray-600">Qty: {item.quantity ?? 0}</span>
                                                {item.priceVariables && item.priceVariables.length > 0 && (
                                                    <span className="text-blue-600">
                                                        {item.priceVariables.length} price variable(s)
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="text-center text-gray-500 py-8">
                                        No items yet. Add your first item above!
                                    </div>
                                )}
                            </div>
                        </div>
                    </>
                )
            }
        </InventoryPageLayout>
    );
};

export default AddItemPage;
