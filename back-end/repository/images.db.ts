import { Image } from '../model/image';
import { Image as ImagePrisma } from '@prisma/client';
import database from './database';

const getById = async ({ id }: { id: number }): Promise<Image | null> => {
    try {
        const imagePrisma = await database.image.findUnique({
            where: { id },
        });

        return imagePrisma ? Image.from(imagePrisma) : null;
    } catch (error) {
        console.error(error);
        throw new Error('Database error. See server log for details.');
    }
};

const getAllImages = async (): Promise<Image[]> => {
    try {
        const imagesPrisma = await database.image.findMany();
        return imagesPrisma.map((imagePrisma) => Image.from(imagePrisma));
    } catch (error) {
        console.error(error);
        throw new Error('Database error. See server log for details.');
    }
};

const getImageByUrl = async ({ url }: { url: string }): Promise<Image | null> => {
    try {
        const imagePrisma = await database.image.findFirst({
            where: { url },
        });

        return imagePrisma ? Image.from(imagePrisma) : null;
    } catch (error) {
        console.error(error);
        throw new Error('Database error. See server log for details.');
    }
};

const createImage = async (image: Image): Promise<Image> => {
    try {
        const imagePrisma = await database.image.create({
            data: {
                url: image.getUrl(),
                details: image.getDetails(),
            },
        });
        return Image.from(imagePrisma);
    } catch (error) {
        console.error(error);
        throw new Error('Database error. See server log for details.');
    }
};

export default { getAllImages, getImageByUrl, getById, createImage };
