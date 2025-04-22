import { Image } from '../model/image';
import { ImageInput } from '../types';

import imagesDb from '../repository/images.db';

const getAllImages = async (): Promise<Image[]> => imagesDb.getAllImages();

const getImageByUrl = async ({ url }: { url: string }): Promise<Image | null> => {
    const image = await imagesDb.getImageByUrl({ url });
    if (!image) {
        throw new Error(`Image with URL "${url}" does not exist.`);
    }
    return image;
};

const createImage = async ({ url, details }: ImageInput): Promise<Image> => {
    const existingImage = await imagesDb.getImageByUrl({ url });

    if (existingImage) {
        throw new Error(`Image with URL ${url} is already registered.`);
    }

    const image = new Image({ url, details });
    return await imagesDb.createImage(image);
};

export default { getAllImages, getImageByUrl, createImage };
