import { Item } from '@types';

export type DefaultSellPrice = {
    finalSellPrice: number;
    priceVariableName?: string;
};

export const getDefaultSellPriceForItem = (item: Item): DefaultSellPrice => {
    const defaultPriceVariable = (item.priceVariables || []).find((priceVariable) => priceVariable.isDefault);

    if (!defaultPriceVariable) {
        return { finalSellPrice: item.buyPrice };
    }

    const finalSellPrice =
        defaultPriceVariable.type === 'PERCENTAGE'
            ? item.buyPrice * (1 + defaultPriceVariable.value / 100)
            : defaultPriceVariable.value;

    return {
        finalSellPrice,
        priceVariableName: defaultPriceVariable.name,
    };
};

