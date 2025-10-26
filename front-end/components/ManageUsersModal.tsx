import { useState, useEffect } from 'react';
import { getInventoryUsers, addUserToInventory, removeUserFromInventory, getAllUsers } from '../lib/api';
import { useSession } from '../lib/auth-client';

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
    const [selectedUserId, setSelectedUserId] = useState('');
    const [selectedRole, setSelectedRole] = useState('viewer');
    const [loading, setLoading] = useState(true);

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
        } catch (error) {
            console.error('Error fetching data:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleAddUser = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await addUserToInventory(inventoryId, selectedUserId, selectedRole);
            setShowAddUser(false);
            setSelectedUserId('');
            setSelectedRole('viewer');
            fetchData();
        } catch (error) {
            console.error('Error adding user:', error);
            alert('Failed to add user');
        }
    };

    const handleRemoveUser = async (userId: string) => {
        if (!confirm('Are you sure you want to remove this user?')) return;

        try {
            await removeUserFromInventory(inventoryId, userId);
            fetchData();
        } catch (error) {
            console.error('Error removing user:', error);
            alert('Failed to remove user');
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
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-2xl w-full max-h-[80vh] overflow-hidden flex flex-col">
                <div className="p-6 border-b">
                    <div className="flex justify-between items-center">
                        <h2 className="text-2xl font-bold">Manage Access</h2>
                        <button
                            onClick={onClose}
                            className="text-gray-500 hover:text-gray-700 text-2xl"
                        >
                            ×
                        </button>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-6">
                    {loading ? (
                        <div className="text-center py-8">Loading...</div>
                    ) : (
                        <>
                            {/* Current Users */}
                            <div className="mb-6">
                                <h3 className="text-lg font-semibold mb-4">Current Users</h3>
                                <div className="space-y-2">
                                    {inventoryUsers.map((iu) => (
                                        <div
                                            key={iu.id}
                                            className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                                        >
                                            <div className="flex-1">
                                                <div className="font-medium">{iu.user.name}</div>
                                                <div className="text-sm text-gray-500">{iu.user.email}</div>
                                            </div>
                                            <div className="flex items-center gap-3">
                        <span className={`px-3 py-1 text-xs font-medium rounded-full ${getRoleBadge(iu.role)}`}>
                          {iu.role}
                        </span>
                                                {isOwner && iu.userId !== session?.user.id && iu.role !== 'owner' && (
                                                    <button
                                                        onClick={() => handleRemoveUser(iu.userId)}
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

                            {/* Add User */}
                            {isOwner && (
                                <div>
                                    <h3 className="text-lg font-semibold mb-4">Add User</h3>
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
                                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                                    Select User
                                                </label>
                                                <select
                                                    value={selectedUserId}
                                                    onChange={(e) => setSelectedUserId(e.target.value)}
                                                    required
                                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                                >
                                                    <option value="">Choose a user...</option>
                                                    {availableUsers.map((user) => (
                                                        <option key={user.id} value={user.id}>
                                                            {user.name} ({user.email})
                                                        </option>
                                                    ))}
                                                </select>
                                            </div>

                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                                    Role
                                                </label>
                                                <select
                                                    value={selectedRole}
                                                    onChange={(e) => setSelectedRole(e.target.value)}
                                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                                >
                                                    <option value="viewer">Viewer (Read only)</option>
                                                    <option value="editor">Editor (Can edit)</option>
                                                    <option value="owner">Owner (Full control)</option>
                                                </select>
                                            </div>

                                            <div className="flex gap-3">
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        setShowAddUser(false);
                                                        setSelectedUserId('');
                                                        setSelectedRole('viewer');
                                                    }}
                                                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                                                >
                                                    Cancel
                                                </button>
                                                <button
                                                    type="submit"
                                                    disabled={!selectedUserId}
                                                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                                >
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
