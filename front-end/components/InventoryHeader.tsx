import Link from 'next/link';

type Inventory = {
    id: number;
    name: string;
    description: string;
    items: any[];
    users?: Array<{
        role: string;
        user: {
            id: string;
            name: string;
            email: string;
        };
    }>;
};

type Props = {
    inventory: Inventory;
    role: string;
    canEdit: boolean;
    isOwner: boolean;
    activeTab: 'overview' | 'add' | 'manage' | 'sell' | 'history';
    onManageUsers: () => void;
};

const InventoryHeader = ({ inventory, role, canEdit, isOwner, activeTab, onManageUsers }: Props) => {
    return (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
            <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">{inventory.name}</h1>
                    <p className="text-gray-600 mb-4">{inventory.description}</p>
                    <div className="flex items-center gap-6 text-sm text-gray-600">
            <span className="flex items-center gap-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
                {inventory.users?.length || 0} users
            </span>
                        <span className="flex items-center gap-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
                            {inventory.items.length} items
            </span>
                        <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-semibold">
              {role}
            </span>
                    </div>
                </div>
                <div className="flex gap-2">
                    {isOwner && (
                        <button
                            onClick={onManageUsers}
                            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors flex items-center gap-2 shadow-sm"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                            </svg>
                            Manage Users
                        </button>
                    )}
                    {canEdit && (
                        <Link href={`/Inventory/${inventory.id}/add`}>
                            <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 shadow-sm">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                </svg>
                                Add Item
                            </button>
                        </Link>
                    )}
                </div>
            </div>

            {/* Tab Navigation */}
            <div className="border-t border-gray-200 -mx-6 px-6 pt-4">
                <nav className="flex space-x-8">
                    <Link href={`/Inventory/${inventory.id}`}>
                        <button
                            className={`border-b-2 pb-3 px-1 font-medium text-sm transition-colors ${
                                activeTab === 'overview'
                                    ? 'border-blue-500 text-blue-600'
                                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                            }`}
                        >
                            Overview
                        </button>
                    </Link>
                    {canEdit && (
                        <Link href={`/Inventory/${inventory.id}/add`}>
                            <button
                                className={`border-b-2 pb-3 px-1 font-medium text-sm transition-colors ${
                                    activeTab === 'add'
                                        ? 'border-blue-500 text-blue-600'
                                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                }`}
                            >
                                Add Items
                            </button>
                        </Link>
                    )}
                    {canEdit && (
                        <Link href={`/Inventory/${inventory.id}/manage`}>
                            <button
                                className={`border-b-2 pb-3 px-1 font-medium text-sm transition-colors ${
                                    activeTab === 'manage'
                                        ? 'border-blue-500 text-blue-600'
                                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                }`}
                            >
                                Manage Items
                            </button>
                        </Link>
                    )}
                    <Link href={`/Inventory/${inventory.id}/sell`}>
                        <button
                            className={`border-b-2 pb-3 px-1 font-medium text-sm transition-colors ${
                                activeTab === 'sell'
                                    ? 'border-blue-500 text-blue-600'
                                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                            }`}
                        >
                            Sell Items
                        </button>
                    </Link>
                    <Link href={`/Inventory/${inventory.id}/history`}>
                        <button
                            className={`border-b-2 pb-3 px-1 font-medium text-sm transition-colors ${
                                activeTab === 'history'
                                    ? 'border-blue-500 text-blue-600'
                                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                            }`}
                        >
                            Sales History
                        </button>
                    </Link>
                </nav>
            </div>
        </div>
    );
};

export default InventoryHeader;
