import { useState } from 'react';
import {
    getPriceVariablesByItemId,
    createPriceVariable,
    updatePriceVariable,
    deletePriceVariable,
} from '../../lib/api';
import { PriceVariable } from '@types';

type PriceVariablesSectionProps = {
    itemId: number;
    canEdit: boolean;
};

export default function PriceVariablesSection({ itemId, canEdit }: PriceVariablesSectionProps) {
    const [variables, setVariables] = useState<PriceVariable[]>([]);
    const [loaded, setLoaded] = useState(false);
    const [showAddForm, setShowAddForm] = useState(false);
    const [editingPV, setEditingPV] = useState<PriceVariable | null>(null);
    const [newPV, setNewPV] = useState({
        name: '',
        value: '',
        type: 'PERCENTAGE' as 'PERCENTAGE' | 'FIXED',
        isDefault: false,
    });

    const load = async () => {
        try {
            const data = await getPriceVariablesByItemId(itemId);
            setVariables(data);
            setLoaded(true);
        } catch {
            setVariables([]);
            setLoaded(true);
        }
    };

    if (!loaded) {
        load();
        return <div className="p-4 text-gray-500">Loading price variables...</div>;
    }

    const handleCreate = async () => {
        if (!newPV.name || !newPV.value) { alert('Please fill in all fields'); return; }
        try {
            await createPriceVariable(itemId, {
                name: newPV.name,
                value: parseFloat(newPV.value),
                type: newPV.type,
                isDefault: newPV.isDefault,
            });
            setNewPV({ name: '', value: '', type: 'PERCENTAGE', isDefault: false });
            setShowAddForm(false);
            const data = await getPriceVariablesByItemId(itemId);
            setVariables(data);
        } catch { alert('Failed to create price variable'); }
    };

    const handleUpdate = async () => {
        if (!editingPV?.id) return;
        try {
            await updatePriceVariable(editingPV.id, {
                name: editingPV.name,
                value: editingPV.value,
                type: editingPV.type,
                isDefault: editingPV.isDefault,
            });
            setEditingPV(null);
            const data = await getPriceVariablesByItemId(itemId);
            setVariables(data);
        } catch { alert('Failed to update price variable'); }
    };

    const handleDelete = async (pvId: number) => {
        if (!confirm('Delete this price variable?')) return;
        try {
            await deletePriceVariable(pvId);
            const data = await getPriceVariablesByItemId(itemId);
            setVariables(data);
        } catch { alert('Failed to delete price variable'); }
    };

    return (
        <div className="p-4 bg-white border-t border-gray-200">
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
                    <div className="grid grid-cols-2 gap-3">
                        <input
                            type="text"
                            placeholder="Name (e.g., Regular Markup)"
                            value={newPV.name}
                            onChange={(e) => setNewPV({ ...newPV, name: e.target.value })}
                            className="px-3 py-2 border border-gray-300 rounded"
                        />
                        <input
                            type="number"
                            step="0.01"
                            placeholder="Value"
                            value={newPV.value}
                            onChange={(e) => setNewPV({ ...newPV, value: e.target.value })}
                            className="px-3 py-2 border border-gray-300 rounded"
                        />
                        <select
                            value={newPV.type}
                            onChange={(e) => setNewPV({ ...newPV, type: e.target.value as 'PERCENTAGE' | 'FIXED' })}
                            className="px-3 py-2 border border-gray-300 rounded"
                        >
                            <option value="PERCENTAGE">Percentage (%)</option>
                            <option value="FIXED">Fixed Amount (€)</option>
                        </select>
                        <label className="flex items-center gap-2">
                            <input
                                type="checkbox"
                                checked={newPV.isDefault}
                                onChange={(e) => setNewPV({ ...newPV, isDefault: e.target.checked })}
                                className="w-4 h-4"
                            />
                            <span>Set as Default</span>
                        </label>
                    </div>
                    <div className="flex gap-2 mt-3">
                        <button onClick={handleCreate} className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700">Create</button>
                        <button
                            onClick={() => { setShowAddForm(false); setNewPV({ name: '', value: '', type: 'PERCENTAGE', isDefault: false }); }}
                            className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            )}

            <div className="space-y-2">
                {variables.length === 0 ? (
                    <div className="text-center text-gray-500 py-4">No price variables yet.</div>
                ) : (
                    variables.map((pv) => (
                        <div key={pv.id} className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                            {editingPV?.id === pv.id ? (
                                <div className="grid grid-cols-4 gap-2">
                                    <input type="text" value={editingPV.name} onChange={(e) => setEditingPV({ ...editingPV, name: e.target.value })} className="px-2 py-1 border border-gray-300 rounded" />
                                    <input type="number" step="0.01" value={editingPV.value} onChange={(e) => setEditingPV({ ...editingPV, value: parseFloat(e.target.value) })} className="px-2 py-1 border border-gray-300 rounded" />
                                    <select value={editingPV.type} onChange={(e) => setEditingPV({ ...editingPV, type: e.target.value as 'PERCENTAGE' | 'FIXED' })} className="px-2 py-1 border border-gray-300 rounded">
                                        <option value="PERCENTAGE">%</option>
                                        <option value="FIXED">€</option>
                                    </select>
                                    <div className="flex gap-2">
                                        <button onClick={handleUpdate} className="px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700">Save</button>
                                        <button onClick={() => setEditingPV(null)} className="px-3 py-1 bg-gray-500 text-white rounded text-sm hover:bg-gray-600">Cancel</button>
                                    </div>
                                </div>
                            ) : (
                                <div className="flex justify-between items-center">
                                    <div className="flex gap-4">
                                        <span className="font-medium">{pv.name}</span>
                                        <span className="text-blue-600">
                                            {pv.type === 'PERCENTAGE' ? `${pv.value}%` : `€${pv.value.toFixed(2)}`}
                                        </span>
                                        {pv.isDefault && (
                                            <span className="px-2 py-0.5 bg-blue-100 text-blue-800 text-xs rounded">Default</span>
                                        )}
                                    </div>
                                    {canEdit && pv.id && (
                                        <div className="flex gap-2">
                                            <button onClick={() => setEditingPV({ ...pv })} className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700">Edit</button>
                                            <button onClick={() => handleDelete(pv.id!)} className="px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700">Delete</button>
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
