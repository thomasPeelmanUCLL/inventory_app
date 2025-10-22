import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import InventoryService from '../../services/InventoryService';
import Link from 'next/link';

interface Inventory {
  id: number;
  name: string;
  description: string;
  items?: any[];
}

export default function InventoryPage() {
  const [inventories, setInventories] = useState<Inventory[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const fetchInventories = async () => {
      try {
        setLoading(true);
        const data = await InventoryService.getAllInventories();
        if ('error' in data) {
          setError(data.error as string);
        } else {
          setInventories(data);
        }
      } catch (err) {
        setError('Failed to fetch inventories');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchInventories();
  }, []);

  const handleDelete = async (id: number) => {
    if (window.confirm('Are you sure you want to delete this inventory?')) {
      try {
        await InventoryService.deleteInventory(id);
        setInventories(inventories.filter(inventory => inventory.id !== id));
      } catch (err) {
        setError('Failed to delete inventory');
        console.error(err);
      }
    }
  };

  if (loading) {
    return <div className="container mx-auto p-4">Loading...</div>;
  }

  if (error) {
    return <div className="container mx-auto p-4 text-red-500">Error: {error}</div>;
  }

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Inventory Management</h1>
        <Link href="/Inventory/create" className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded">
          Add New Inventory
        </Link>
      </div>

      {inventories.length === 0 ? (
        <p>No inventories found. Create one to get started.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {inventories.map((inventory) => (
            <div key={inventory.id} className="border rounded-lg p-4 shadow-md">
              <h2 className="text-xl font-semibold mb-2">{inventory.name}</h2>
              <p className="text-gray-600 mb-4">{inventory.description}</p>
              <p className="text-sm text-gray-500 mb-4">
                Items: {inventory.items ? inventory.items.length : 0}
              </p>
              <div className="flex justify-end space-x-2">
                <Link href={`/Inventory/${inventory.id}`} className="text-blue-500 hover:text-blue-700">
                  View
                </Link>
                <Link href={`/Inventory/edit/${inventory.id}`} className="text-green-500 hover:text-green-700">
                  Edit
                </Link>
                <button
                  onClick={() => handleDelete(inventory.id)}
                  className="text-red-500 hover:text-red-700"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
