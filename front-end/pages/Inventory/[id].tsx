import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import InventoryService from '../../services/InventoryService';
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

export default function InventoryDetail() {
  const [inventory, setInventory] = useState<Inventory | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const { id } = router.query;

  useEffect(() => {
    if (id) {
      fetchInventory(Number(id));
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

  if (error) {
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
        </div>

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
