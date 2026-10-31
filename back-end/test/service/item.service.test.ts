import { Prisma } from '@prisma/client';
import itemService from '../../service/item.service';
import itemDB from '../../repository/item.db';
import { Item } from '../../model/item';
import { itemToDTO } from '../../dto/item.dto';

jest.mock('../../repository/item.db', () => ({
    __esModule: true,
    default: {
        getAllItems: jest.fn(),
        getItemById: jest.fn(),
        getItemsByInventoryId: jest.fn(),
        getItemsByInventoryIds: jest.fn(),
        createItem: jest.fn(),
        updateItem: jest.fn(),
        deleteItem: jest.fn(),
    },
}));

const createItemModel = (overrides: Partial<ConstructorParameters<typeof Item>[0]> = {}) =>
    new Item({
        id: 1,
        name: 'Chocolate Bar',
        description: 'Milk chocolate',
        buyPrice: new Prisma.Decimal('1.20'),
        quantity: 10,
        buyedAt: new Date('2026-01-01T00:00:00.000Z'),
        inventoryId: 5,
        websiteCategory: 'Snacks',
        websiteEmoji: '🍫',
        websiteSortOrder: 3,
        memberPrice: new Prisma.Decimal('1.50'),
        nonMemberPrice: new Prisma.Decimal('2.00'),
        publishedToWebsite: true,
        ...overrides,
    });

describe('item.service website catalogue fields', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('persists catalogue fields on create', async () => {
        (itemDB.createItem as jest.Mock).mockResolvedValue(createItemModel());

        await itemService.createItem({
            name: 'Chocolate Bar',
            description: 'Milk chocolate',
            buyPrice: 1.2,
            quantity: 10,
            inventoryId: 5,
            websiteCategory: '  Snacks  ',
            websiteEmoji: '🍫',
            websiteSortOrder: 3,
            memberPrice: 1.5,
            nonMemberPrice: 2,
            publishedToWebsite: true,
        });

        const persistedItem = (itemDB.createItem as jest.Mock).mock.calls[0][0] as Item;
        expect(persistedItem.getWebsiteCategory()).toBe('Snacks');
        expect(persistedItem.getWebsiteEmoji()).toBe('🍫');
        expect(persistedItem.getWebsiteSortOrder()).toBe(3);
        expect(persistedItem.getMemberPrice()?.toString()).toBe('1.5');
        expect(persistedItem.getNonMemberPrice()?.toString()).toBe('2');
        expect(persistedItem.getPublishedToWebsite()).toBe(true);
    });

    it('rejects publishing when required website fields are missing', async () => {
        await expect(
            itemService.createItem({
                name: 'Chocolate Bar',
                description: 'Milk chocolate',
                buyPrice: 1.2,
                quantity: 10,
                inventoryId: 5,
                websiteCategory: ' ',
                publishedToWebsite: true,
            }),
        ).rejects.toThrow('Website category is required when publishing an item');
    });

    it('preserves existing website values when update omits them', async () => {
        const existing = createItemModel();
        const updated = createItemModel({ name: 'Dark Chocolate' });
        (itemDB.getItemById as jest.Mock).mockResolvedValue(existing);
        (itemDB.updateItem as jest.Mock).mockResolvedValue(updated);

        await itemService.updateItem({ id: 1, name: 'Dark Chocolate' });

        const persistedItem = (itemDB.updateItem as jest.Mock).mock.calls[0][0] as Item;
        expect(persistedItem.getWebsiteCategory()).toBe('Snacks');
        expect(persistedItem.getWebsiteEmoji()).toBe('🍫');
        expect(persistedItem.getMemberPrice()?.toString()).toBe('1.5');
        expect(persistedItem.getNonMemberPrice()?.toString()).toBe('2');
        expect(persistedItem.getPublishedToWebsite()).toBe(true);
    });

    it('allows unpublishing and intentionally clearing optional website fields', async () => {
        const existing = createItemModel();
        const updated = createItemModel({
            publishedToWebsite: false,
            websiteCategory: null,
            websiteEmoji: null,
            memberPrice: null,
            nonMemberPrice: null,
        });
        (itemDB.getItemById as jest.Mock).mockResolvedValue(existing);
        (itemDB.updateItem as jest.Mock).mockResolvedValue(updated);

        await itemService.updateItem({
            id: 1,
            publishedToWebsite: false,
            websiteCategory: null,
            websiteEmoji: null,
            memberPrice: null,
            nonMemberPrice: null,
        });

        const persistedItem = (itemDB.updateItem as jest.Mock).mock.calls[0][0] as Item;
        expect(persistedItem.getPublishedToWebsite()).toBe(false);
        expect(persistedItem.getWebsiteCategory()).toBeNull();
        expect(persistedItem.getWebsiteEmoji()).toBeNull();
        expect(persistedItem.getMemberPrice()).toBeNull();
        expect(persistedItem.getNonMemberPrice()).toBeNull();
    });

    it('returns website fields in DTO responses for round-trip persistence', () => {
        const dto = itemToDTO(createItemModel());
        expect(dto.websiteCategory).toBe('Snacks');
        expect(dto.websiteEmoji).toBe('🍫');
        expect(dto.websiteSortOrder).toBe(3);
        expect(dto.memberPrice).toBe('1.5');
        expect(dto.nonMemberPrice).toBe('2');
        expect(dto.publishedToWebsite).toBe(true);
    });
});
