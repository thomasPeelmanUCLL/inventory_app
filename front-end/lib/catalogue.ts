import type {
    WebsiteCatalogueFormErrors,
    WebsiteCatalogueFormValues,
} from '../components/inventory/WebsiteCatalogueSection';
import type { ItemPayload } from './api';
import { Item } from '@types';

type CatalogueFields = Pick<
    ItemPayload,
    'publishedToWebsite' | 'websiteCategory' | 'websiteEmoji' | 'websiteSortOrder' | 'memberPrice' | 'nonMemberPrice'
>;

export const emptyCatalogueForm: WebsiteCatalogueFormValues = {
    publishedToWebsite: false,
    websiteCategory: '',
    websiteEmoji: '',
    websiteSortOrder: '0',
    memberPrice: '',
    nonMemberPrice: '',
};

const priceToText = (price: number | string | null | undefined) => (price == null ? '' : String(price));

/** Form values (all strings, so half-typed input like "1." survives) for an existing item. */
export const catalogueFormFromItem = (item: Item): WebsiteCatalogueFormValues => ({
    publishedToWebsite: Boolean(item.publishedToWebsite),
    websiteCategory: item.websiteCategory ?? '',
    websiteEmoji: item.websiteEmoji ?? '',
    websiteSortOrder: String(item.websiteSortOrder ?? 0),
    memberPrice: priceToText(item.memberPrice),
    nonMemberPrice: priceToText(item.nonMemberPrice),
});

const isMoney = (value: string) => /^\d+(\.\d{1,2})?$/.test(value);

/** Same rules the backend enforces, so the user sees them next to the fields. Empty means valid. */
export function validateCatalogueForm(form: WebsiteCatalogueFormValues): WebsiteCatalogueFormErrors {
    const errors: WebsiteCatalogueFormErrors = {};
    const publishing = form.publishedToWebsite;

    if (form.websiteSortOrder.trim() && !/^-?\d+$/.test(form.websiteSortOrder.trim())) {
        errors.websiteSortOrder = 'Sort order must be an integer';
    }
    if (publishing && !form.websiteCategory.trim()) {
        errors.websiteCategory = 'Website category is required when publishing';
    }
    const prices = [
        ['memberPrice', 'Member price'],
        ['nonMemberPrice', 'Non-member price'],
    ] as const;
    for (const [field, label] of prices) {
        const value = form[field].trim();
        if (publishing && !value) errors[field] = `${label} is required when publishing`;
        else if (value && !isMoney(value)) errors[field] = `${label} must be a non-negative amount with 2 decimals`;
    }
    return errors;
}

/** Catalogue part of the item payload. Blank text clears the field. */
export const catalogueFormToPayload = (form: WebsiteCatalogueFormValues): CatalogueFields => ({
    publishedToWebsite: form.publishedToWebsite,
    websiteCategory: form.websiteCategory.trim() || null,
    websiteEmoji: form.websiteEmoji.trim() || null,
    websiteSortOrder: form.websiteSortOrder.trim() ? parseInt(form.websiteSortOrder, 10) : 0,
    memberPrice: form.memberPrice.trim() ? parseFloat(form.memberPrice) : null,
    nonMemberPrice: form.nonMemberPrice.trim() ? parseFloat(form.nonMemberPrice) : null,
});

export const hasErrors = (errors: object) => Object.keys(errors).length > 0;
