import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import InventoryService from '../../../services/InventoryService';
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

  if (error && !inventory) {
    return (
        <div className="container mx-auto p-4">
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
          <Link href="/Inventory" className="text-blue-500 hover:underline">
            Back to Inventory List
          </Link>
        </div>
    );
  }

  if (!inventory) {
    return (
        <div className="container mx-auto p-4">
          <p className="text-gray-600">Inventory not found</p>
          <Link href="/Inventory" className="text-blue-500 hover:underline">
            Back to Inventory List
          </Link>
        </div>
    );
  }

  // Helper function to check if tab is active
  const isActive = (path: string) => {
    return router.pathname === path;
  };

  return (
      <div className="container mx-auto p-4">
        <div className="mb-4">
          <h1 className="text-3xl font-bold mb-4">{inventory.name}</h1>
          <div className="flex gap-2 mb-4">
            <Link
                href="/Inventory"
                className="bg-gray-500 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded"
            >
              Back to List
            </Link>
            <Link
                href={`/Inventory/edit/${inventory.id}`}
                className="bg-yellow-500 hover:bg-yellow-700 text-white font-bold py-2 px-4 rounded"
            >
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

        {/* Navigation Tabs - CHANGED TO LINK COMPONENTS */}
        <div className="mb-6 border-b border-gray-200">
          <nav className="flex gap-4">
            <Link
                href={`/Inventory/${id}`}
                className={`py-2 px-4 border-b-2 font-medium ${
                    isActive('/Inventory/[id]')
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                }`}
            >
              Overview
            </Link>

            <Link
                href={`/Inventory/${id}/add`}
                className={`py-2 px-4 border-b-2 font-medium ${
                    isActive('/Inventory/[id]/add')
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                }`}
            >
              Add Items
            </Link>

            <Link
                href={`/Inventory/${id}/manage`}
                className={`py-2 px-4 border-b-2 font-medium ${
                    isActive('/Inventory/[id]/manage')
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                }`}
            >
              Manage Items
            </Link>

            <Link
                href={`/Inventory/${id}/sell`}
                className={`py-2 px-4 border-b-2 font-medium ${
                    isActive('/Inventory/[id]/sell')
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                }`}
            >
              Sell Items
            </Link>

            <Link
                href={`/Inventory/${id}/history`}
                className={`py-2 px-4 border-b-2 font-medium ${
                    isActive('/Inventory/[id]/history')
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                }`}
            >
              Sales History
            </Link>
          </nav>
        </div>

        <div className="bg-white shadow-md rounded px-8 pt-6 pb-8 mb-4">
          <h2 className="text-xl font-semibold mb-4">Details</h2>
          <p className="text-gray-700 mb-4">{inventory.description}</p>

          <h2 className="text-xl font-semibold mb-4">Items</h2>
          {inventory.items && inventory.items.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="min-w-full bg-white border">
                  <thead className="bg-gray-100">
                  <tr>
                    <th className="py-2 px-4 border-b text-left">Name</th>
                    <th className="py-2 px-4 border-b text-left">Description</th>
                    <th className="py-2 px-4 border-b text-left">Price</th>
                    <th className="py-2 px-4 border-b text-left">Quantity</th>
                  </tr>
                  </thead>
                  <tbody>
                  {inventory.items.map((item) => (
                      <tr key={item.id} className="hover:bg-gray-50">
                        <td className="py-2 px-4 border-b">{item.name}</td>
                        <td className="py-2 px-4 border-b">{item.description}</td>
                        <td className="py-2 px-4 border-b">${item.price.toFixed(2)}</td>
                        <td className="py-2 px-4 border-b">{item.quantity}</td>
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
