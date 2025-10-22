import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import InventoryService from '../../services/InventoryService';
import ItemService from '../../services/ItemService';
import Link from 'next/link';

interface Item {
  id: number;
  name: string;
  description: string;
  price: number;
  quantity: number;
}

interface Inventory {
  id: number;
  name: string;
  description: string;
  items: Item[];
}

interface NewItemForm {
  name: string;
  description: string;
  price: number;
  quantity: number;
}

export default function InventoryDetail() {
  const [inventory, setInventory] = useState<Inventory | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [availableItems, setAvailableItems] = useState<Item[]>([]);
  const [selectedItemId, setSelectedItemId] = useState<number | ''>('');
  const [showNewItemForm, setShowNewItemForm] = useState(false);
  const [newItem, setNewItem] = useState<NewItemForm>({
    name: '',
    description: '',
    price: 0,
    quantity: 1
  });
  const [addingItem, setAddingItem] = useState(false);

  const router = useRouter();
  const { id } = router.query;

  useEffect(() => {
    if (id) {
      fetchInventory(Number(id));
      fetchAvailableItems();
    }
  }, [id]);

  const fetchInventory = async (inventoryId: number) => {
    try {
      setLoading(true);
      const data = await InventoryService.getInventoryById(inventoryId);
      setInventory(data);
    } catch (err) {
      if (err instanceof Error) {
        setError(`Failed to load inventory: ${err.message}`);
      } else {
        setError('Failed to load inventory');
      }
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchAvailableItems = async () => {
    try {
      const items = await ItemService.getAllItems();
      if (!('error' in items)) {
        setAvailableItems(items);
      }
    } catch (err) {
      console.error('Error fetching available items:', err);
    }
  };

  const handleAddExistingItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedItemId || !id) return;

    try {
      setAddingItem(true);
      setError(null);
      setSuccess(null);

      await InventoryService.addItemToInventory(Number(id), Number(selectedItemId));

      // Refresh inventory data to show the newly added item
      await fetchInventory(Number(id));
      setSelectedItemId('');
      setSuccess('Item added to inventory successfully!');
    } catch (err) {
      if (err instanceof Error) {
        setError(`Failed to add item to inventory: ${err.message}`);
      } else {
        setError('Failed to add item to inventory');
      }
      console.error(err);
    } finally {
      setAddingItem(false);
    }
  };

  const handleCreateAndAddItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;

    try {
      setAddingItem(true);
      setError(null);
      setSuccess(null);

      // Validate form
      if (!newItem.name.trim()) {
        setError('Item name is required');
        setAddingItem(false);
        return;
      }

      if (!newItem.description.trim()) {
        setError('Item description is required');
        setAddingItem(false);
        return;
      }

      if (newItem.price <= 0) {
        setError('Price must be greater than 0');
        setAddingItem(false);
        return;
      }

      if (newItem.quantity <= 0) {
        setError('Quantity must be greater than 0');
        setAddingItem(false);
        return;
      }

      // Create the item with the inventory ID already set
      const createdItem = await ItemService.createItem({
        ...newItem,
        inventoryId: Number(id)
      });

      // Refresh inventory data to show the newly added item
      await fetchInventory(Number(id));

      // Reset form
      setNewItem({
        name: '',
        description: '',
        price: 0,
        quantity: 1
      });
      setShowNewItemForm(false);
      setSuccess('Item created and added to inventory successfully!');
    } catch (err) {
      if (err instanceof Error) {
        setError(`Failed to create item: ${err.message}`);
      } else {
        setError('Failed to create item');
      }
      console.error(err);
    } finally {
      setAddingItem(false);
    }
  };

  const handleNewItemChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setNewItem(prev => ({
      ...prev,
      [name]: name === 'price' || name === 'quantity' ? Number(value) : value
    }));
  };

  const handleDelete = async () => {
    if (!inventory) return;

    if (window.confirm(`Are you sure you want to delete "${inventory.name}"?`)) {
      try {
        await InventoryService.deleteInventory(inventory.id);
        router.push('/Inventory');
      } catch (err) {
        if (err instanceof Error) {
          setError(`Failed to delete inventory: ${err.message}`);
        } else {
          setError('Failed to delete inventory');
        }
        console.error(err);
      }
    }
  };

  if (loading) {
    return <div className="container mx-auto p-4">Loading inventory data...</div>;
  }

  if (error && !success) {
    return (
      <div className="container mx-auto p-4">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
        <Link href="/Inventory" className="text-blue-500 hover:text-blue-700">
          Back to Inventory List
        </Link>
      </div>
    );
  }

  if (!inventory) {
    return (
      <div className="container mx-auto p-4">
        <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded mb-4">
          Inventory not found
        </div>
        <Link href="/Inventory" className="text-blue-500 hover:text-blue-700">
          Back to Inventory List
        </Link>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">{inventory.name}</h1>
        <div className="space-x-2">
          <Link href="/Inventory" className="text-blue-500 hover:text-blue-700">
            Back to List
          </Link>
          <Link href={`/Inventory/edit/${inventory.id}`} className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded">
            Edit
          </Link>
          <button
            onClick={handleDelete}
            className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded"
          >
            Delete
          </button>
        </div>
      </div>

      <div className="bg-white shadow-md rounded p-6 mb-6">
        <h2 className="text-xl font-semibold mb-2">Details</h2>
        <p className="text-gray-700 mb-4">{inventory.description}</p>
      </div>

      <div className="bg-white shadow-md rounded p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Items</h2>
          <div>
            <button
              onClick={() => setShowNewItemForm(!showNewItemForm)}
              className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded mr-2"
            >
              {showNewItemForm ? 'Cancel' : 'Add New Item'}
            </button>
          </div>
        </div>

        {success && (
          <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
            {success}
          </div>
        )}

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        {/* Form to add existing item to inventory */}
        <div className="mb-6 p-4 border rounded bg-gray-50">
          <h3 className="text-lg font-semibold mb-3">Add Existing Item to Inventory</h3>
          <form onSubmit={handleAddExistingItem} className="flex items-end space-x-2">
            <div className="flex-grow">
              <label htmlFor="itemId" className="block text-gray-700 font-bold mb-2">
                Select Item
              </label>
              <select
                id="itemId"
                value={selectedItemId}
                onChange={(e) => setSelectedItemId(e.target.value ? Number(e.target.value) : '')}
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                disabled={addingItem}
              >
                <option value="">-- Select an item --</option>
                {availableItems
                  .filter(item => !inventory.items.some(invItem => invItem.id === item.id))
                  .map(item => (
                    <option key={item.id} value={item.id}>
                      {item.name} - ${item.price.toFixed(2)}
                    </option>
                  ))}
              </select>
            </div>
            <button
              type="submit"
              className={`bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded ${
                addingItem || !selectedItemId ? 'opacity-50 cursor-not-allowed' : ''
              }`}
              disabled={addingItem || !selectedItemId}
            >
              {addingItem ? 'Adding...' : 'Add to Inventory'}
            </button>
          </form>
        </div>

        {/* Form to create new item and add to inventory */}
        {showNewItemForm && (
          <div className="mb-6 p-4 border rounded bg-gray-50">
            <h3 className="text-lg font-semibold mb-3">Create New Item</h3>
            <form onSubmit={handleCreateAndAddItem}>
              <div className="mb-4">
                <label htmlFor="name" className="block text-gray-700 font-bold mb-2">
                  Name
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={newItem.name}
                  onChange={handleNewItemChange}
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                  placeholder="Enter item name"
                  disabled={addingItem}
                />
              </div>
              <div className="mb-4">
                <label htmlFor="description" className="block text-gray-700 font-bold mb-2">
                  Description
                </label>
                <textarea
                  id="description"
                  name="description"
                  value={newItem.description}
                  onChange={handleNewItemChange}
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                  placeholder="Enter item description"
                  rows={3}
                  disabled={addingItem}
                />
              </div>
              <div className="flex mb-4 space-x-4">
                <div className="w-1/2">
                  <label htmlFor="price" className="block text-gray-700 font-bold mb-2">
                    Price
                  </label>
                  <input
                    type="number"
                    id="price"
                    name="price"
                    value={newItem.price}
                    onChange={handleNewItemChange}
                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                    placeholder="0.00"
                    min="0"
                    step="0.01"
                    disabled={addingItem}
                  />
                </div>
                <div className="w-1/2">
                  <label htmlFor="quantity" className="block text-gray-700 font-bold mb-2">
                    Quantity
                  </label>
                  <input
                    type="number"
                    id="quantity"
                    name="quantity"
                    value={newItem.quantity}
                    onChange={handleNewItemChange}
                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                    placeholder="1"
                    min="1"
                    disabled={addingItem}
                  />
                </div>
              </div>
              <div className="flex justify-end">
                <button
                  type="submit"
                  className={`bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded ${
                    addingItem ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                  disabled={addingItem}
                >
                  {addingItem ? 'Creating...' : 'Create & Add to Inventory'}
                </button>
              </div>
            </form>
          </div>
        )}

        {inventory.items && inventory.items.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white">
              <thead>
                <tr>
                  <th className="py-2 px-4 border-b border-gray-200 bg-gray-50 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Name
                  </th>
                  <th className="py-2 px-4 border-b border-gray-200 bg-gray-50 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Description
                  </th>
                  <th className="py-2 px-4 border-b border-gray-200 bg-gray-50 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Price
                  </th>
                  <th className="py-2 px-4 border-b border-gray-200 bg-gray-50 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Quantity
                  </th>
                </tr>
              </thead>
              <tbody>
                {inventory.items.map((item) => (
                  <tr key={item.id}>
                    <td className="py-2 px-4 border-b border-gray-200">{item.name}</td>
                    <td className="py-2 px-4 border-b border-gray-200">{item.description}</td>
                    <td className="py-2 px-4 border-b border-gray-200">${item.price.toFixed(2)}</td>
                    <td className="py-2 px-4 border-b border-gray-200">{item.quantity}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-gray-500">No items in this inventory.</p>
        )}
      </div>
    </div>
  );
}
