import { SoldItem } from '../model/soldItem';
import { SoldItem as SoldItemPrisma, Prisma } from '@prisma/client';
import { BaseRepository } from './base.repository';
import database from "./database";

class SoldItemRepository extends BaseRepository<SoldItem, SoldItemPrisma> {
    protected entityName = 'soldItem';

    protected fromPrisma(prismaEntity: SoldItemPrisma): SoldItem {
        return SoldItem.from(prismaEntity);
    }

    protected getEntityId(entity: SoldItem): number {
        return entity.getId();
    }

    async getAllSoldItems(): Promise<SoldItem[]> {
        return this.findMany({
            include: {
                item: true
            }
        });
    }

    async getSoldItemById({ id }: { id: number }): Promise<SoldItem | null> {
        return this.findUnique({
            where: { id },
            include: {
                item: true
            }
        });
    }

    async getSoldItemsByItemId({ itemId }: { itemId: number }): Promise<SoldItem[]> {
        return this.findMany({
            where: { itemId },
            include: {
                item: true
            },
            orderBy: {
                soldAt: 'desc'
            }
        });
    }

    async getSoldItemsByInventoryId({ inventoryId }: { inventoryId: number }): Promise<SoldItem[]> {
        return this.findMany({
            where: {
                item: {
                    inventoryId: inventoryId,
                },
            },
            include: {
                item: true,
            },
            orderBy: {
                soldAt: 'desc',
            },
        });
    }

    async createSoldItem(soldItem: SoldItem): Promise<SoldItem> {
        const data = {
            itemId: soldItem.getItemId(),
            finalSellPrice: soldItem.getFinalSellPrice(),
            priceVariableName: soldItem.getPriceVariableName(),
            isCustomPrice: soldItem.getIsCustomPrice(),
            payedCash: soldItem.isPayedCash(),
            quantity: soldItem.getQuantity(),
            soldAt: soldItem.getSoldAt(),
        };
        return this.create(data, {
            include: {
                item: true
            }
        });
    }

    // TRANSACTIONAL VERSION: Atomically create sold item and update stock
    async createSoldItemWithStockUpdate(input: {
        itemId: number;
        finalSellPrice: Prisma.Decimal | number;
        priceVariableName?: string | null;
        isCustomPrice?: boolean;
        payedCash?: boolean;
        quantity: number;
        soldAt?: Date;
    }): Promise<SoldItemPrisma> {
        return await database.$transaction(async (tx) => {
            // 1. Check current stock with row-level locking
            const item = await tx.item.findUnique({ 
                where: { id: input.itemId }, 
                select: { id: true, quantity: true, name: true }
            });
            
            if (!item) {
                throw new Error('Item not found');
            }

            if (item.quantity < input.quantity) {
                throw new Error(`Not enough stock available for ${item.name}. Available: ${item.quantity}, Requested: ${input.quantity}`);
            }

            // 2. Update item quantity atomically
            await tx.item.update({
                where: { id: item.id },
                data: { quantity: { decrement: input.quantity } },
            });

            // 3. Create sold item record
            const createdSoldItem = await tx.soldItem.create({
                data: {
                    itemId: input.itemId,
                    finalSellPrice: input.finalSellPrice,
                    quantity: input.quantity,
                    priceVariableName: input.priceVariableName ?? null,
                    isCustomPrice: !!input.isCustomPrice,
                    payedCash: !!input.payedCash,
                    soldAt: input.soldAt ?? new Date(),
                },
                include: {
                    item: true,
                },
            });

            return createdSoldItem;
        }, { timeout: 10000 });
    }

    // TRANSACTIONAL VERSION: Atomically update sold item and adjust stock
    async updateSoldItemWithStockAdjustment(id: number, patch: {
        finalSellPrice?: number | Prisma.Decimal;
        priceVariableName?: string | null;
        isCustomPrice?: boolean;
        payedCash?: boolean;
        quantity?: number;
        soldAt?: Date;
    }): Promise<SoldItemPrisma> {
        return await database.$transaction(async (tx) => {
            // 1. Get existing sold item
            const existing = await tx.soldItem.findUnique({ 
                where: { id },
                include: { item: true }
            });
            
            if (!existing) {
                throw new Error('Sold item not found');
            }

            let quantityDelta = 0;
            if (typeof patch.quantity === 'number' && patch.quantity !== existing.quantity) {
                quantityDelta = existing.quantity - patch.quantity; // positive means return to stock
                
                if (quantityDelta < 0) {
                    // Need more stock - check availability
                    const item = await tx.item.findUnique({ 
                        where: { id: existing.itemId }, 
                        select: { quantity: true, name: true } 
                    });
                    
                    if (!item || item.quantity < Math.abs(quantityDelta)) {
                        throw new Error(`Not enough stock available for ${item?.name || 'item'}. Available: ${item?.quantity || 0}, Additional needed: ${Math.abs(quantityDelta)}`);
                    }
                }
            }

            // 2. Adjust item quantity if changed
            if (quantityDelta !== 0) {
                if (quantityDelta > 0) {
                    // Return stock
                    await tx.item.update({ 
                        where: { id: existing.itemId }, 
                        data: { quantity: { increment: quantityDelta } } 
                    });
                } else {
                    // Take more stock
                    await tx.item.update({ 
                        where: { id: existing.itemId }, 
                        data: { quantity: { decrement: Math.abs(quantityDelta) } } 
                    });
                }
            }

            // 3. Update sold item
            const updated = await tx.soldItem.update({
                where: { id },
                data: {
                    finalSellPrice: patch.finalSellPrice ?? existing.finalSellPrice,
                    priceVariableName: patch.priceVariableName ?? existing.priceVariableName,
                    isCustomPrice: typeof patch.isCustomPrice === 'boolean' ? patch.isCustomPrice : existing.isCustomPrice,
                    payedCash: typeof patch.payedCash === 'boolean' ? patch.payedCash : existing.payedCash,
                    quantity: typeof patch.quantity === 'number' ? patch.quantity : existing.quantity,
                    soldAt: patch.soldAt ?? existing.soldAt,
                },
                include: {
                    item: true,
                },
            });

            return updated;
        }, { timeout: 10000 });
    }

    // TRANSACTIONAL VERSION: Atomically delete sold item and restore stock
    async deleteSoldItemWithStockRestore(id: number): Promise<void> {
        await database.$transaction(async (tx) => {
            // 1. Get existing sold item
            const existing = await tx.soldItem.findUnique({ 
                where: { id },
                select: { itemId: true, quantity: true }
            });
            
            if (!existing) {
                return; // Already deleted
            }

            // 2. Delete sold item record
            await tx.soldItem.delete({ where: { id } });

            // 3. Restore stock to item
            await tx.item.update({
                where: { id: existing.itemId },
                data: { quantity: { increment: existing.quantity } },
            });
        }, { timeout: 10000 });
    }

    async updateSoldItem(soldItem: SoldItem): Promise<SoldItem> {
        const data = {
            finalSellPrice: soldItem.getFinalSellPrice(),
            priceVariableName: soldItem.getPriceVariableName(),
            isCustomPrice: soldItem.getIsCustomPrice(),
            payedCash: soldItem.isPayedCash(),
            quantity: soldItem.getQuantity(),
            soldAt: soldItem.getSoldAt(),
        };

        const result = await this.update(soldItem, data, {
            include: {
                item: true
            }
        });

        if (!result) {
            throw new Error(`Failed to update sold item with ID: ${soldItem.getId()}`);
        }

        return result;
    }

    async deleteSoldItem({ id }: { id: number }): Promise<void> {
        return this.delete(id);
    }

    async getAnalyticsByInventoryId({
                                        inventoryId,
                                        startDate,
                                        endDate
                                    }: {
        inventoryId: number;
        startDate?: Date;
        endDate?: Date;
    }) {
        const dateFilter = startDate && endDate ? {
            soldAt: {
                gte: startDate,
                lte: endDate,
            },
        } : {};

        const soldItems = await database.soldItem.findMany({
            where: {
                item: {
                    inventoryId: inventoryId,
                },
                ...dateFilter,
            },
            include: {
                item: true,
            },
        });

        // Calculate totals with buy price, sell price, and profit
        const totalBuyPrice = soldItems.reduce((sum, soldItem) => {
            return sum + (Number(soldItem.item.buyPrice) * soldItem.quantity);
        }, 0);

        const totalSellPrice = soldItems.reduce((sum, soldItem) => {
            return sum + (Number(soldItem.finalSellPrice) * soldItem.quantity);
        }, 0);

        const totalProfit = totalSellPrice - totalBuyPrice;

        const totalQuantitySold = soldItems.reduce((sum, item) => sum + item.quantity, 0);
        const totalTransactions = soldItems.length;
        const cashTransactions = soldItems.filter(item => item.payedCash).length;
        const nonCashTransactions = totalTransactions - cashTransactions;

        // Top selling items with buy/sell/profit breakdown
        const itemSales = soldItems.reduce((acc, soldItem) => {
            const itemId = soldItem.itemId;
            const sellPrice = Number(soldItem.finalSellPrice);
            const buyPrice = Number(soldItem.item.buyPrice);

            if (!acc[itemId]) {
                acc[itemId] = {
                    itemId,
                    itemName: soldItem.item.name,
                    totalQuantity: 0,
                    totalBuyPrice: 0,
                    totalSellPrice: 0,
                    totalProfit: 0,
                    priceBreakdown: [] as any[],
                };
            }

            acc[itemId].totalQuantity += soldItem.quantity;
            acc[itemId].totalBuyPrice += buyPrice * soldItem.quantity;
            acc[itemId].totalSellPrice += sellPrice * soldItem.quantity;
            acc[itemId].totalProfit = acc[itemId].totalSellPrice - acc[itemId].totalBuyPrice;

            // Add to price breakdown
            const existingPrice = acc[itemId].priceBreakdown.find(
                (p: any) => p.sellPrice === sellPrice && p.priceVariableName === soldItem.priceVariableName
            );

            if (existingPrice) {
                existingPrice.quantity += soldItem.quantity;
                existingPrice.totalBuy += buyPrice * soldItem.quantity;
                existingPrice.totalSell += sellPrice * soldItem.quantity;
                existingPrice.profit = existingPrice.totalSell - existingPrice.totalBuy;
            } else {
                acc[itemId].priceBreakdown.push({
                    sellPrice,
                    priceVariableName: soldItem.priceVariableName,
                    quantity: soldItem.quantity,
                    totalBuy: buyPrice * soldItem.quantity,
                    totalSell: sellPrice * soldItem.quantity,
                    profit: (sellPrice * soldItem.quantity) - (buyPrice * soldItem.quantity),
                });
            }

            return acc;
        }, {} as Record<number, any>);

        const topSellingItems = Object.values(itemSales)
            .map((item: any) => ({
                ...item,
                priceBreakdown: item.priceBreakdown.sort((a: any, b: any) => b.profit - a.profit),
            }))
            .sort((a: any, b: any) => b.totalProfit - a.totalProfit)
            .slice(0, 10);

        // Sales by day with buy/sell/profit breakdown
        const salesByDayMap = soldItems.reduce((acc, soldItem) => {
            const date = soldItem.soldAt.toISOString().split('T')[0];
            const sellPrice = Number(soldItem.finalSellPrice);
            const buyPrice = Number(soldItem.item.buyPrice);

            if (!acc[date]) {
                acc[date] = {
                    date,
                    totalBuyPrice: 0,
                    totalSellPrice: 0,
                    totalProfit: 0,
                    totalQuantity: 0,
                    transactionCount: 0,
                    itemBreakdown: [] as any[],
                };
            }

            acc[date].totalBuyPrice += buyPrice * soldItem.quantity;
            acc[date].totalSellPrice += sellPrice * soldItem.quantity;
            acc[date].totalProfit = acc[date].totalSellPrice - acc[date].totalBuyPrice;
            acc[date].totalQuantity += soldItem.quantity;
            acc[date].transactionCount += 1;

            // Add to item breakdown
            const existingItem = acc[date].itemBreakdown.find(
                (i: any) => i.itemId === soldItem.itemId
            );

            if (existingItem) {
                existingItem.quantity += soldItem.quantity;
                existingItem.buyPrice += buyPrice * soldItem.quantity;
                existingItem.sellPrice += sellPrice * soldItem.quantity;
                existingItem.profit = existingItem.sellPrice - existingItem.buyPrice;
            } else {
                acc[date].itemBreakdown.push({
                    itemId: soldItem.itemId,
                    itemName: soldItem.item.name,
                    quantity: soldItem.quantity,
                    buyPrice: buyPrice * soldItem.quantity,
                    sellPrice: sellPrice * soldItem.quantity,
                    profit: (sellPrice * soldItem.quantity) - (buyPrice * soldItem.quantity),
                });
            }
            return acc;
        }, {} as Record<string, any>);

        const salesByDay = Object.values(salesByDayMap)
            .map((day: any) => ({
                ...day,
                itemBreakdown: day.itemBreakdown.sort((a: any, b: any) => b.profit - a.profit),
            }))
            .sort((a: any, b: any) => a.date.localeCompare(b.date));

        // Payment method breakdown with buy/sell/profit
        const cashSales = soldItems.filter(item => item.payedCash);
        const cashBuyPrice = cashSales.reduce((sum, s) => sum + (Number(s.item.buyPrice) * s.quantity), 0);
        const cashSellPrice = cashSales.reduce((sum, s) => sum + (Number(s.finalSellPrice) * s.quantity), 0);
        const cashProfit = cashSellPrice - cashBuyPrice;

        const nonCashSales = soldItems.filter(item => !item.payedCash);
        const nonCashBuyPrice = nonCashSales.reduce((sum, s) => sum + (Number(s.item.buyPrice) * s.quantity), 0);
        const nonCashSellPrice = nonCashSales.reduce((sum, s) => sum + (Number(s.finalSellPrice) * s.quantity), 0);
        const nonCashProfit = nonCashSellPrice - nonCashBuyPrice;

        // Price variable breakdown with buy/sell/profit
        const priceVariableMap = soldItems.reduce((acc, soldItem) => {
            const varName = soldItem.priceVariableName || 'No Price Variable';
            if (!acc[varName]) {
                acc[varName] = {
                    priceVariableName: varName,
                    count: 0,
                    totalBuyPrice: 0,
                    totalSellPrice: 0,
                    totalProfit: 0,
                };
            }

            acc[varName].count += 1;
            acc[varName].totalBuyPrice += Number(soldItem.item.buyPrice) * soldItem.quantity;
            acc[varName].totalSellPrice += Number(soldItem.finalSellPrice) * soldItem.quantity;
            acc[varName].totalProfit = acc[varName].totalSellPrice - acc[varName].totalBuyPrice;
            return acc;
        }, {} as Record<string, any>);

        const priceVariableBreakdown = Object.values(priceVariableMap);

        return {
            summary: {
                totalBuyPrice,
                totalSellPrice,
                totalProfit,
                totalQuantitySold,
                totalTransactions,
                cashTransactions,
                nonCashTransactions,
            },
            topSellingItems,
            salesByDay,
            paymentMethodBreakdown: {
                cash: { buyPrice: cashBuyPrice, sellPrice: cashSellPrice, profit: cashProfit },
                nonCash: { buyPrice: nonCashBuyPrice, sellPrice: nonCashSellPrice, profit: nonCashProfit },
            },
            priceVariableBreakdown,
        };
    }
}

const soldItemRepository = new SoldItemRepository();
export default {
    getAllSoldItems: soldItemRepository.getAllSoldItems.bind(soldItemRepository),
    getSoldItemById: soldItemRepository.getSoldItemById.bind(soldItemRepository),
    getSoldItemsByItemId: soldItemRepository.getSoldItemsByItemId.bind(soldItemRepository),
    getSoldItemsByInventoryId: soldItemRepository.getSoldItemsByInventoryId.bind(soldItemRepository),
    createSoldItem: soldItemRepository.createSoldItem.bind(soldItemRepository),
    updateSoldItem: soldItemRepository.updateSoldItem.bind(soldItemRepository),
    deleteSoldItem: soldItemRepository.deleteSoldItem.bind(soldItemRepository),
    getAnalyticsByInventoryId: soldItemRepository.getAnalyticsByInventoryId.bind(soldItemRepository),
    // Transactional methods
    createSoldItemWithStockUpdate: soldItemRepository.createSoldItemWithStockUpdate.bind(soldItemRepository),
    updateSoldItemWithStockAdjustment: soldItemRepository.updateSoldItemWithStockAdjustment.bind(soldItemRepository),
    deleteSoldItemWithStockRestore: soldItemRepository.deleteSoldItemWithStockRestore.bind(soldItemRepository),
};
