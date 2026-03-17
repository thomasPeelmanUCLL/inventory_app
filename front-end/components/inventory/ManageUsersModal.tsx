import { useState, useEffect } from 'react';
import { getInventoryUsers, addUserToInventory, removeUserFromInventory, getAllUsers } from '../../lib/api';
import { useSession } from '../../lib/auth-client';

type InventoryUser = {
    id: number;
    userId: string;
    role: string;
    user: {
        id: string;
        name: string;
        email: string;
    };
};

type User = {
    id: string;
    name: string;
    email: string;
};

type Props = {
    inventoryId: number;
    isOwner: boolean;
    onClose: () => void;
};

const ManageUsersModal = ({ inventoryId, isOwner, onClose }: Props) => {
    const { data: session } = useSession();
    const [inventoryUsers, setInventoryUsers] = useState<InventoryUser[]>([]);
    const [allUsers, setAllUsers] = useState<User[]>([]);
    const [showAddUser, setShowAddUser] = useState(false);
    const [selectedUserEmail, setSelectedUserEmail] = useState('');
    const [selectedRole, setSelectedRole] = useState('viewer');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [removeConfirm, setRemoveConfirm] = useState<string | null>(null);

    useEffect(() => {
        fetchData();
    }, [inventoryId]);

    const fetchData = async () => {
        try {
            const [users, allUsersData] = await Promise.all([
                getInventoryUsers(inventoryId),
                getAllUsers(),
            ]);
            setInventoryUsers(users);
            setAllUsers(allUsersData);
            setError('');
        } catch (error) {
            console.error('Error fetching data:', error);
            setError('Failed to load users');
        } finally {
            setLoading(false);
        }
    };

    const handleAddUser = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedUserEmail) {
            setError('Please select a user');
            return;
        }
        try {
            await addUserToInventory(inventoryId, { email: selectedUserEmail, role: selectedRole });
            setShowAddUser(false);
            setSelectedUserEmail('');
            setSelectedRole('viewer');
            setError('');
            await fetchData();
        } catch (error: any) {
            setError(error.message || 'Failed to add user');
        }
    };

    const handleRemoveUser = async (userId: string) => {
        try {
            await removeUserFromInventory(inventoryId, userId);
            setError('');
            setRemoveConfirm(null);
            await fetchData();
        } catch (error: any) {
            setError(error.message || 'Failed to remove user');
            setRemoveConfirm(null);
        }
    };

    const availableUsers = allUsers.filter(
        (user) => !inventoryUsers.some((iu) => iu.userId === user.id)
    );

    const getRoleBadge = (role: string) => {
        const colors = {
            owner: 'bg-purple-100 text-purple-800',
            editor: 'bg-blue-100 text-blue-800',
            viewer: 'bg-gray-100 text-gray-800',
        };
        return colors[role as keyof typeof colors] || colors.viewer;
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            {/* Remove confirm dialog */}
            {removeConfirm !== null && (
                <div className="fixed inset-0 bg-black bg-opacity-50 z-60 flex items-center justify-center">
                    <div className="bg-white rounded-lg p-6 max-w-sm w-full mx-4 shadow-xl">
                        <h3 className="text-lg font-bold mb-2">Remove user?</h3>
                        <p className="text-gray-600 mb-6">They will lose access to this inventory.</p>
                        <div className="flex gap-3 justify-end">
                            <button onClick={() => setRemoveConfirm(null)}
                                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200">
                                Cancel
                            </button>
                            <button onClick={() => handleRemoveUser(removeConfirm)}
                                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700">
                                Remove
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto m-4">
                <div className="p-6 border-b border-gray-200 flex justify-between items-center sticky top-0 bg-white">
                    <h2 className="text-2xl font-bold text-gray-900">Manage Access</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl">×</button>
                </div>

                <div className="p-6 space-y-6">
                    {error && (
                        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                            {error}
                        </div>
                    )}

                    {loading ? (
                        <div className="text-center py-8"><div className="text-gray-500">Loading...</div></div>
                    ) : (
                        <>
                            <div>
                                <h3 className="text-lg font-semibold text-gray-900 mb-4">Current Users</h3>
                                <div className="space-y-3">
                                    {inventoryUsers.map((iu) => (
                                        <div key={iu.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                                            <div className="flex-1">
                                                <div className="font-medium text-gray-900">{iu.user.name}</div>
                                                <div className="text-sm text-gray-500">{iu.user.email}</div>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <span className={`px-3 py-1 rounded-full text-sm font-medium ${getRoleBadge(iu.role)}`}>
                                                    {iu.role}
                                                </span>
                                                {isOwner && iu.userId !== session?.user.id && iu.role !== 'owner' && (
                                                    <button
                                                        onClick={() => setRemoveConfirm(iu.userId)}
                                                        className="px-3 py-1 text-sm text-red-600 hover:text-red-800"
                                                    >
                                                        Remove
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {isOwner && (
                                <div>
                                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Add User</h3>
                                    {!showAddUser ? (
                                        <button
                                            onClick={() => setShowAddUser(true)}
                                            className="w-full px-4 py-2 border-2 border-dashed border-gray-300 text-gray-600 rounded-lg hover:border-blue-500 hover:text-blue-500 transition-colors"
                                        >
                                            + Add User
                                        </button>
                                    ) : (
                                        <form onSubmit={handleAddUser} className="space-y-4">
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-2">Select User</label>
                                                <select
                                                    value={selectedUserEmail}
                                                    onChange={(e) => setSelectedUserEmail(e.target.value)}
                                                    required
                                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                                >
                                                    <option value="">Choose a user...</option>
                                                    {availableUsers.map((user) => (
                                                        <option key={user.id} value={user.email}>
                                                            {user.name} ({user.email})
                                                        </option>
                                                    ))}
                                                </select>
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-2">Role</label>
                                                <select
                                                    value={selectedRole}
                                                    onChange={(e) => setSelectedRole(e.target.value)}
                                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                                >
                                                    <option value="viewer">Viewer (Read only)</option>
                                                    <option value="editor">Editor (Can edit)</option>
                                                    <option value="owner">Owner (Full control)</option>
                                                </select>
                                            </div>
                                            <div className="flex gap-3">
                                                <button type="button"
                                                    onClick={() => { setShowAddUser(false); setSelectedUserEmail(''); setSelectedRole('viewer'); setError(''); }}
                                                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50">
                                                    Cancel
                                                </button>
                                                <button type="submit"
                                                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                                                    Add User
                                                </button>
                                            </div>
                                        </form>
                                    )}
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ManageUsersModal;
