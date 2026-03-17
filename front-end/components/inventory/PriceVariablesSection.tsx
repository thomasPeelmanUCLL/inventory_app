import { useState } from 'react';
import {
    getPriceVariablesByItemId,
    createPriceVariable,
    updatePriceVariable,
    deletePriceVariable,
} from '../../lib/api';
import { PriceVariable } from '@types';
import { useToast } from '../../hooks/useToast';
import Toast from '../common/Toast';
import ConfirmDialog from '../common/ConfirmDialog';

type PriceVariablesSectionProps = {
    itemId: number;
    canEdit: boolean;
};

export default function PriceVariablesSection({ itemId, canEdit }: PriceVariablesSectionProps) {
    const [priceVariables, setPriceVariables] = useState<PriceVariable[]>([]);
    const [isLoaded, setIsLoaded] = useState(false);
    const [showAddForm, setShowAddForm] = useState(false);
    const [priceVariableBeingEdited, setPriceVariableBeingEdited] = useState<PriceVariable | null>(null);
    const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null);
    const [formError, setFormError] = useState<string | null>(null);
    const { toast, showToast } = useToast();
    const [newPriceVariableForm, setNewPriceVariableForm] = useState({
        name: '',
        value: '',
        type: 'PERCENTAGE' as 'PERCENTAGE' | 'FIXED',
        isDefault: false,
    });

    const reloadPriceVariables = async () => {
        const fetchedVariables = await getPriceVariablesByItemId(itemId);
        setPriceVariables(fetchedVariables);
    };

    const loadPriceVariables = async () => {
        try {
            await reloadPriceVariables();
            setIsLoaded(true);
        } catch {
            setPriceVariables([]);
            setIsLoaded(true);
        }
    };

    if (!isLoaded) {
        loadPriceVariables();
        return <div className="p-4 text-gray-500">Loading price variables...</div>;
    }

    const handleCreate = async () => {
        if (!newPriceVariableForm.name || !newPriceVariableForm.value) {
            setFormError('Please fill in all fields');
            return;
        }
        setFormError(null);
        try {
            await createPriceVariable(itemId, {
                name: newPriceVariableForm.name,
                value: parseFloat(newPriceVariableForm.value),
                type: newPriceVariableForm.type,
                isDefault: newPriceVariableForm.isDefault,
            });
            setNewPriceVariableForm({ name: '', value: '', type: 'PERCENTAGE', isDefault: false });
            setShowAddForm(false);
            await reloadPriceVariables();
            showToast('Price variable created');
        } catch (err: any) {
            showToast(err.message || 'Failed to create price variable', 'error');
        }
    };

    const handleUpdate = async () => {
        if (!priceVariableBeingEdited?.id) return;
        try {
            await updatePriceVariable(priceVariableBeingEdited.id, {
                name: priceVariableBeingEdited.name,
                value: priceVariableBeingEdited.value,
                type: priceVariableBeingEdited.type,
                isDefault: priceVariableBeingEdited.isDefault,
            });
            setPriceVariableBeingEdited(null);
            await reloadPriceVariables();
            showToast('Price variable updated');
        } catch (err: any) {
            showToast(err.message || 'Failed to update price variable', 'error');
        }
    };

    const handleDelete = async (priceVariableId: number) => {
        try {
            await deletePriceVariable(priceVariableId);
            setDeleteConfirmId(null);
            await reloadPriceVariables();
            showToast('Price variable deleted');
        } catch (err: any) {
            showToast(err.message || 'Failed to delete price variable', 'error');
            setDeleteConfirmId(null);
        }
    };

    return (
        <div className="p-4 bg-white border-t border-gray-200 relative">
            <Toast toast={toast} />

            {deleteConfirmId !== null && (
                <ConfirmDialog
                    title="Delete price variable?"
                    description="This action cannot be undone."
                    confirmLabel="Delete"
                    onConfirm={() => handleDelete(deleteConfirmId)}
                    onCancel={() => setDeleteConfirmId(null)}
                />
            )}

            <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold">Price Variables</h3>
                {canEdit && (
                    <button
                        onClick={() => setShowAddForm(true)}
                        className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                    >
                        + Add Price Variable
                    </button>
                )}
            </div>

            {showAddForm && (
                <div className="mb-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
                    <h4 className="font-medium mb-3">New Price Variable</h4>
                    {formError && <p className="text-sm text-red-600 mb-3">{formError}</p>}
                    <div className="grid grid-cols-2 gap-3">
                        <input
                            type="text" placeholder="Name (e.g., Regular Markup)"
                            value={newPriceVariableForm.name}
                            onChange={(e) => setNewPriceVariableForm({ ...newPriceVariableForm, name: e.target.value })}
                            className="px-3 py-2 border border-gray-300 rounded"
                        />
                        <input
                            type="number" step="0.01" placeholder="Value"
                            value={newPriceVariableForm.value}
                            onChange={(e) => setNewPriceVariableForm({ ...newPriceVariableForm, value: e.target.value })}
                            className="px-3 py-2 border border-gray-300 rounded"
                        />
                        <select
                            value={newPriceVariableForm.type}
                            onChange={(e) => setNewPriceVariableForm({ ...newPriceVariableForm, type: e.target.value as 'PERCENTAGE' | 'FIXED' })}
                            className="px-3 py-2 border border-gray-300 rounded"
                        >
                            <option value="PERCENTAGE">Percentage (%)</option>
                            <option value="FIXED">Fixed Amount (€)</option>
                        </select>
                        <label className="flex items-center gap-2">
                            <input
                                type="checkbox" checked={newPriceVariableForm.isDefault}
                                onChange={(e) => setNewPriceVariableForm({ ...newPriceVariableForm, isDefault: e.target.checked })}
                                className="w-4 h-4"
                            />
                            <span>Set as Default</span>
                        </label>
                    </div>
                    <div className="flex gap-2 mt-3">
                        <button onClick={handleCreate} className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700">Create</button>
                        <button
                            onClick={() => { setShowAddForm(false); setFormError(null); setNewPriceVariableForm({ name: '', value: '', type: 'PERCENTAGE', isDefault: false }); }}
                            className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            )}

            <div className="space-y-2">
                {priceVariables.length === 0 ? (
                    <div className="text-center text-gray-500 py-4">No price variables yet.</div>
                ) : (
                    priceVariables.map((priceVariable) => (
                        <div key={priceVariable.id} className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                            {priceVariableBeingEdited?.id === priceVariable.id ? (
                                <div className="grid grid-cols-4 gap-2">
                                    <input type="text" value={priceVariableBeingEdited.name}
                                        onChange={(e) => setPriceVariableBeingEdited({ ...priceVariableBeingEdited, name: e.target.value })}
                                        className="px-2 py-1 border border-gray-300 rounded" />
                                    <input type="number" step="0.01" value={priceVariableBeingEdited.value}
                                        onChange={(e) => setPriceVariableBeingEdited({ ...priceVariableBeingEdited, value: parseFloat(e.target.value) })}
                                        className="px-2 py-1 border border-gray-300 rounded" />
                                    <select value={priceVariableBeingEdited.type}
                                        onChange={(e) => setPriceVariableBeingEdited({ ...priceVariableBeingEdited, type: e.target.value as 'PERCENTAGE' | 'FIXED' })}
                                        className="px-2 py-1 border border-gray-300 rounded">
                                        <option value="PERCENTAGE">%</option>
                                        <option value="FIXED">€</option>
                                    </select>
                                    <div className="flex gap-2">
                                        <button onClick={handleUpdate} className="px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700">Save</button>
                                        <button onClick={() => setPriceVariableBeingEdited(null)} className="px-3 py-1 bg-gray-500 text-white rounded text-sm hover:bg-gray-600">Cancel</button>
                                    </div>
                                </div>
                            ) : (
                                <div className="flex justify-between items-center">
                                    <div className="flex gap-4">
                                        <span className="font-medium">{priceVariable.name}</span>
                                        <span className="text-blue-600">
                                            {priceVariable.type === 'PERCENTAGE' ? `${priceVariable.value}%` : `€${priceVariable.value.toFixed(2)}`}
                                        </span>
                                        {priceVariable.isDefault && (
                                            <span className="px-2 py-0.5 bg-blue-100 text-blue-800 text-xs rounded">Default</span>
                                        )}
                                    </div>
                                    {canEdit && priceVariable.id && (
                                        <div className="flex gap-2">
                                            <button onClick={() => setPriceVariableBeingEdited({ ...priceVariable })} className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700">Edit</button>
                                            <button onClick={() => setDeleteConfirmId(priceVariable.id!)} className="px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700">Delete</button>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
