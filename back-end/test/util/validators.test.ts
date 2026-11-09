import {
    addUserToInventoryInput,
    inventoryUserParams,
    itemInput,
    soldItemInput,
    soldItemUpdateInput,
} from '../../util/validators';

describe('soldItemInput', () => {
    const sale = { itemId: 1, finalSellPrice: 2.5, quantity: 1 };

    it.each(['CASH', 'CARD', 'DRINK_CARD'])('accepts %s as payment method', (paymentMethod) => {
        expect(soldItemInput.parse({ ...sale, paymentMethod })).toMatchObject({ paymentMethod });
    });

    it('rejects an unknown payment method', () => {
        expect(soldItemInput.safeParse({ ...sale, paymentMethod: 'BITCOIN' }).success).toBe(false);
    });

    it.each(['paidCash', 'payedCash', 'paidWithCash'])('maps the old %s flag to CASH or CARD', (field) => {
        expect(soldItemInput.parse({ ...sale, [field]: true })).toMatchObject({ paymentMethod: 'CASH' });
        expect(soldItemInput.parse({ ...sale, [field]: false })).toMatchObject({ paymentMethod: 'CARD' });
    });

    it('defaults to card on create', () => {
        expect(soldItemInput.parse(sale)).toMatchObject({ paymentMethod: 'CARD' });
    });

    it('leaves the payment method untouched on update when it is not sent', () => {
        expect(soldItemUpdateInput.parse({ quantity: 2 })).not.toHaveProperty('paymentMethod');
    });
});

describe('inventoryUserParams', () => {
    it('keeps the userId path param', () => {
        expect(inventoryUserParams.parse({ id: '3', userId: 'ckabc123' })).toEqual({
            id: 3,
            userId: 'ckabc123',
        });
    });
});

describe('addUserToInventoryInput', () => {
    it('accepts an email, which is what the UI sends', () => {
        expect(addUserToInventoryInput.parse({ email: 'a@b.be', role: 'editor' })).toMatchObject({
            email: 'a@b.be',
            role: 'editor',
        });
    });

    it('needs an email or a userId', () => {
        expect(addUserToInventoryInput.safeParse({ role: 'viewer' }).success).toBe(false);
    });
});

describe('itemInput website prices', () => {
    const item = { name: 'Chocolate', description: 'Milk', buyPrice: 1, quantity: 3 };

    it('accepts numeric strings with up to 2 decimals', () => {
        expect(itemInput.parse({ ...item, memberPrice: '1.50' })).toMatchObject({ memberPrice: 1.5 });
    });

    it('rejects more than 2 decimals', () => {
        expect(itemInput.safeParse({ ...item, memberPrice: 1.005 }).success).toBe(false);
    });

    it('requires category and both prices when publishing', () => {
        const result = itemInput.safeParse({ ...item, publishedToWebsite: true });
        expect(result.success).toBe(false);
        if (!result.success) {
            expect(result.error.errors.map((e) => e.path[0]).sort()).toEqual([
                'memberPrice',
                'nonMemberPrice',
                'websiteCategory',
            ]);
        }
    });
});
