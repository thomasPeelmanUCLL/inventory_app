import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Header from '../../components/header';
import { getMyInventories, createInventory, deleteInventory } from '../../lib/api';
import { useSession } from '../../lib/auth-client';

type Inventory = {
  id: number;
  name: string;
  description: string;
  users?: Array<{
    role: string;
    user: {
      id: string;
      name: string;
      email: string;
    };
  }>;
};

const InventoriesPage = () => {
  const router = useRouter();
  const { data: session } = useSession();
  const [inventories, setInventories] = useState<Inventory[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newInventory, setNewInventory] = useState({ name: '', description: '' });

  useEffect(() => {
    if (session) {
      fetchInventories();
    }
  }, [session]);

  const fetchInventories = async () => {
    try {
      const data = await getMyInventories();
      setInventories(data);
    } catch (error) {
      console.error('Error fetching inventories:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createInventory(newInventory);
      setShowCreateModal(false);
      setNewInventory({ name: '', description: '' });
      fetchInventories();
    } catch (error) {
      console.error('Error creating inventory:', error);
      alert('Failed to create inventory');
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this inventory?')) return;

    try {
      await deleteInventory(id);
      fetchInventories();
    } catch (error) {
      console.error('Error deleting inventory:', error);
      alert('Failed to delete inventory. Only owners can delete.');
    }
  };

  const getUserRole = (inventory: Inventory) => {
    return inventory.users?.find(u => u.user.id === session?.user.id)?.role || 'viewer';
  };

  if (loading) {
    return (
        <div className="min-h-screen bg-gray-50">
          <Header />
          <div className="flex items-center justify-center h-64">
            <div className="text-lg text-gray-600">Loading...</div>
          </div>
        </div>
    );
  }

  return (
      <div className="min-h-screen bg-gray-50">
        <Header />

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-bold text-gray-900">My Inventories</h1>
            <button
                onClick={() => setShowCreateModal(true)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              + New Inventory
            </button>
          </div>

          {inventories.length === 0 ? (
              <div className="bg-white rounded-lg shadow p-12 text-center">
                <p className="text-gray-500 text-lg mb-4">No inventories yet</p>
                <button
                    onClick={() => setShowCreateModal(true)}
                    className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Create Your First Inventory
                </button>
              </div>
          ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {inventories.map((inventory) => {
                  const role = getUserRole(inventory);
                  const isOwner = role === 'owner';

                  return (
                      <div
                          key={inventory.id}
                          className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow p-6"
                      >
                        <div className="flex justify-between items-start mb-4">
                          <div className="flex-1">
                            <h3 className="text-xl font-semibold text-gray-900 mb-2">
                              {inventory.name}
                            </h3>
                            <p className="text-gray-600 text-sm mb-3">
                              {inventory.description}
                            </p>
                            <span className={`inline-block px-3 py-1 text-xs font-medium rounded-full ${
                                role === 'owner' ? 'bg-purple-100 text-purple-800' :
                                    role === 'editor' ? 'bg-blue-100 text-blue-800' :
                                        'bg-gray-100 text-gray-800'
                            }`}>
                        {role.charAt(0).toUpperCase() + role.slice(1)}
                      </span>
                          </div>
                        </div>

                        <div className="flex gap-2">
                          <button
                              onClick={() => router.push(`/Inventory/${inventory.id}`)}
                              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                          >
                            View
                          </button>
                          {isOwner && (
                              <button
                                  onClick={() => handleDelete(inventory.id)}
                                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                              >
                                Delete
                              </button>
                          )}
                        </div>
                      </div>
                  );
                })}
              </div>
          )}
        </main>

        {/* Create Modal */}
        {showCreateModal && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
              <div className="bg-white rounded-lg max-w-md w-full p-6">
                <h2 className="text-2xl font-bold mb-4">Create New Inventory</h2>
                <form onSubmit={handleCreate}>
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Name
                    </label>
                    <input
                        type="text"
                        required
                        value={newInventory.name}
                        onChange={(e) => setNewInventory({ ...newInventory, name: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Description
                    </label>
                    <textarea
                        required
                        value={newInventory.description}
                        onChange={(e) => setNewInventory({ ...newInventory, description: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        rows={3}
                    />
                  </div>
                  <div className="flex gap-3">
                    <button
                        type="button"
                        onClick={() => setShowCreateModal(false)}
                        className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                        type="submit"
                        className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      Create
                    </button>
                  </div>
                </form>
              </div>
            </div>
        )}
      </div>
  );
};

export default InventoriesPage;
