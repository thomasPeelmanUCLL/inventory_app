import React from 'react';

export type WebsiteCatalogueFormValues = {
    publishedToWebsite: boolean;
    websiteCategory: string;
    websiteEmoji: string;
    websiteSortOrder: string;
    memberPrice: string;
    nonMemberPrice: string;
};

export type WebsiteCatalogueFormErrors = Partial<
    Record<Exclude<keyof WebsiteCatalogueFormValues, 'publishedToWebsite'>, string>
>;

type Props = {
    value: WebsiteCatalogueFormValues;
    errors?: WebsiteCatalogueFormErrors;
    onChange: <K extends keyof WebsiteCatalogueFormValues>(
        field: K,
        fieldValue: WebsiteCatalogueFormValues[K],
    ) => void;
};

const WebsiteCatalogueSection = ({ value, errors, onChange }: Props) => {
    return (
        <div className="mt-6 border border-indigo-200 bg-indigo-50 rounded-lg p-4 space-y-4">
            <div>
                <h3 className="text-lg font-semibold text-indigo-900">Website catalogue</h3>
                <p className="text-sm text-indigo-700">
                    Publish this item to the website catalogue with separate member and non-member
                    prices in euros.
                </p>
            </div>

            <label className="flex items-center gap-2 text-sm font-medium text-indigo-900">
                <input
                    type="checkbox"
                    checked={value.publishedToWebsite}
                    onChange={(event) => onChange('publishedToWebsite', event.target.checked)}
                    className="h-4 w-4"
                />
                Published to website
            </label>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Website category {value.publishedToWebsite ? '*' : '(optional)'}
                    </label>
                    <input
                        type="text"
                        value={value.websiteCategory}
                        onChange={(event) => onChange('websiteCategory', event.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md"
                        placeholder="e.g. Snacks"
                    />
                    {errors?.websiteCategory && (
                        <p className="mt-1 text-sm text-red-600">{errors.websiteCategory}</p>
                    )}
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Emoji (optional)
                    </label>
                    <input
                        type="text"
                        value={value.websiteEmoji}
                        onChange={(event) => onChange('websiteEmoji', event.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md"
                        placeholder="e.g. 🍫"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Sort order (integer)
                    </label>
                    <input
                        type="number"
                        step={1}
                        value={value.websiteSortOrder}
                        onChange={(event) => onChange('websiteSortOrder', event.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md"
                        placeholder="0"
                    />
                    {errors?.websiteSortOrder && (
                        <p className="mt-1 text-sm text-red-600">{errors.websiteSortOrder}</p>
                    )}
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Member price (€) {value.publishedToWebsite ? '*' : '(optional)'}
                    </label>
                    <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={value.memberPrice}
                        onChange={(event) => onChange('memberPrice', event.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md"
                        placeholder="0.00"
                    />
                    {errors?.memberPrice && (
                        <p className="mt-1 text-sm text-red-600">{errors.memberPrice}</p>
                    )}
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Non-member price (€) {value.publishedToWebsite ? '*' : '(optional)'}
                    </label>
                    <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={value.nonMemberPrice}
                        onChange={(event) => onChange('nonMemberPrice', event.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md"
                        placeholder="0.00"
                    />
                    {errors?.nonMemberPrice && (
                        <p className="mt-1 text-sm text-red-600">{errors.nonMemberPrice}</p>
                    )}
                </div>
            </div>
        </div>
    );
};

export default WebsiteCatalogueSection;
