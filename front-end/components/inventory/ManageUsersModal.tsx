import { useState, useEffect } from 'react';
import { getInventoryUsers, addUserToInventory, removeUserFromInventory, getAllUsers } from '../../lib/api';
import { useSession } from '../../lib/auth-client';
import ConfirmDialog from '../common/ConfirmDialog';

type InventoryUser = {
    id: number;
    userId: string;
    role: string;
    user: { id: string; name: string; email: string };
};

type User = { id: string; name: string; email: string };

type Props = {
    inventoryId: number;
    isOwner: boolean;
    onClose: () => void;
};

const ManageUsersModal = ({ inventoryId, isOwner, onClose }: Props) => {
    const { data: session } = useSession();
    const [inventoryUsers, setInventoryUsers] = useState<InventoryUser[]>([]);
    const [allRegisteredUsers, setAllRegisteredUsers] = useState<User[]>([]);
    const [showAddUserForm, setShowAddUserForm] = useState(false);
    const [selectedUserEmail, setSelectedUserEmail] = useState('');
    const [selectedRole, setSelectedRole] = useState('viewer');
    const [isLoading, setIsLoading] = useState(true);
    const [errorMessage, setErrorMessage] = useState('');
    const [removeConfirmUserId, setRemoveConfirmUserId] = useState<string | null>(null);

    useEffect(() => { loadUsersData(); }, [inventoryId]);

    const loadUsersData = async () => {
        try {
            const [currentInventoryUsers, registeredUsers] = await Promise.all([
                getInventoryUsers(inventoryId),
                getAllUsers(),
            ]);
            setInventoryUsers(currentInventoryUsers);
            setAllRegisteredUsers(registeredUsers);
            setErrorMessage('');
        } catch (err) {
            setErrorMessage('Failed to load users');
        } finally {
            setIsLoading(false);
        }
    };

    const handleAddUser = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedUserEmail) { setErrorMessage('Please select a user'); return; }
        try {
            await addUserToInventory(inventoryId, { email: selectedUserEmail, role: selectedRole });
            setShowAddUserForm(false);
            setSelectedUserEmail('');
            setSelectedRole('viewer');
            setErrorMessage('');
            await loadUsersData();
        } catch (err: any) {
            setErrorMessage(err.message || 'Failed to add user');
        }
    };

    const handleRemoveUser = async (userId: string) => {
        try {
            await removeUserFromInventory(inventoryId, userId);
            setErrorMessage('');
            setRemoveConfirmUserId(null);
            await loadUsersData();
        } catch (err: any) {
            setErrorMessage(err.message || 'Failed to remove user');
            setRemoveConfirmUserId(null);
        }
    };

    const usersNotYetInInventory = allRegisteredUsers.filter(
        registeredUser => !inventoryUsers.some(inventoryUser => inventoryUser.userId === registeredUser.id)
    );

    const getRoleBadgeStyle = (role: string) => {
        const roleStyles = {
            owner: 'bg-purple-100 text-purple-800',
            editor: 'bg-blue-100 text-blue-800',
            viewer: 'bg-gray-100 text-gray-800',
        };
        return roleStyles[role as keyof typeof roleStyles] || roleStyles.viewer;
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            {removeConfirmUserId !== null && (
                <ConfirmDialog
                    title="Remove user?"
                    description="They will lose access to this inventory."
                    confirmLabel="Remove"
                    onConfirm={() => handleRemoveUser(removeConfirmUserId)}
                    onCancel={() => setRemoveConfirmUserId(null)}
                />
            )}

            <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto m-4">
                <div className="p-6 border-b border-gray-200 flex justify-between items-center sticky top-0 bg-white">
                    <h2 className="text-2xl font-bold text-gray-900">Manage Access</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl">×</button>
                </div>

                <div className="p-6 space-y-6">
                    {errorMessage && (
                        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">{errorMessage}</div>
                    )}

                    {isLoading ? (
                        <div className="text-center py-8"><div className="text-gray-500">Loading...</div></div>
                    ) : (
                        <>
                            <div>
                                <h3 className="text-lg font-semibold text-gray-900 mb-4">Current Users</h3>
                                <div className="space-y-3">
                                    {inventoryUsers.map((inventoryUser) => (
                                        <div key={inventoryUser.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                                            <div className="flex-1">
                                                <div className="font-medium text-gray-900">{inventoryUser.user.name}</div>
                                                <div className="text-sm text-gray-500">{inventoryUser.user.email}</div>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <span className={`px-3 py-1 rounded-full text-sm font-medium ${getRoleBadgeStyle(inventoryUser.role)}`}>
                                                    {inventoryUser.role}
                                                </span>
                                                {isOwner && inventoryUser.userId !== session?.user.id && inventoryUser.role !== 'owner' && (
                                                    <button
                                                        onClick={() => setRemoveConfirmUserId(inventoryUser.userId)}
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
                                    {!showAddUserForm ? (
                                        <button
                                            onClick={() => setShowAddUserForm(true)}
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
                                                    {usersNotYetInInventory.map((registeredUser) => (
                                                        <option key={registeredUser.id} value={registeredUser.email}>
                                                            {registeredUser.name} ({registeredUser.email})
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
                                                <button
                                                    type="button"
                                                    onClick={() => { setShowAddUserForm(false); setSelectedUserEmail(''); setSelectedRole('viewer'); setErrorMessage(''); }}
                                                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                                                >
                                                    Cancel
                                                </button>
                                                <button
                                                    type="submit"
                                                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
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
