import { ReactNode, useState } from 'react';
import Link from 'next/link';
import Header from '../layout/Header';
import InventoryHeader from './InventoryHeader';
import ManageUsersModal from './ManageUsersModal';
import LoadingScreen from '../common/LoadingScreen';
import ErrorScreen from '../common/ErrorScreen';
import Toast from '../common/Toast';
import { ToastState } from '../../hooks/useToast';
import { InventoryPage } from '../../hooks/useInventoryPage';
import { Inventory } from '@types';

type Props = {
    page: InventoryPage;
    activeTab: 'overview' | 'add' | 'manage' | 'history';
    toast?: ToastState;
    /** Rendered only once the inventory is loaded. */
    children: (inventory: Inventory) => ReactNode;
};

/** Shell of the /inventory/[id]/* pages: header, loading/error states, tabs and the members modal. */
export default function InventoryPageLayout({ page, activeTab, toast = null, children }: Props) {
    const [showManageUsers, setShowManageUsers] = useState(false);
    const { inventory, inventoryId, isLoading, error, reload, role, canEdit, isOwner } = page;

    let body: ReactNode;
    if (isLoading) body = <LoadingScreen />;
    else if (error) body = <ErrorScreen message={error} onRetry={reload} />;
    else if (!inventory || !inventoryId) body = <ErrorScreen message="Inventory not found" />;
    else {
        body = (
            <div className="container mx-auto px-4 py-8">
                <Link href="/inventory" className="text-blue-600 hover:text-blue-800 mb-4 inline-block">
                    ← Back to Inventories
                </Link>

                <InventoryHeader
                    inventory={inventory}
                    role={role}
                    canEdit={canEdit}
                    isOwner={isOwner}
                    activeTab={activeTab}
                    onManageUsers={() => setShowManageUsers(true)}
                />

                {children(inventory)}

                {showManageUsers && (
                    <ManageUsersModal
                        inventoryId={inventoryId}
                        isOwner={isOwner}
                        onClose={() => {
                            setShowManageUsers(false);
                            void reload();
                        }}
                    />
                )}
            </div>
        );
    }

    return (
        <>
            <Header />
            <Toast toast={toast} />
            {body}
        </>
    );
}
