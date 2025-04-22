import ImagesService from '../service/Images.service';
import express, { NextFunction, Request, Response } from 'express';
import { ImageInput } from '../types';

const imagesRouter = express.Router();

imagesRouter.get('/', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { image: imageUrl } = req.query; // Query parameter to get image by URL
        if (imageUrl) {
            const image = await ImagesService.getImageByUrl({ url: imageUrl as string });
            res.status(200).json(image);
        } else {
            const images = await ImagesService.getAllImages();
            res.status(200).json(images);
        }
    } catch (error) {
        if (error instanceof Error && error.message.includes('not exist')) {
            res.status(404).json({ message: error.message });
        } else {
            next(error);
        }
    }
});

imagesRouter.get('/:url', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const image = await ImagesService.getImageByUrl({
            url: req.params.url,
        });
        res.status(200).json(image);
    } catch (error) {
        if (error instanceof Error && error.message.includes('not exist')) {
            res.status(404).json({ message: error.message });
        } else {
            next(error);
        }
    }
});

/**
 * @swagger
 * /images:
 *   post:
 *     summary: Create an image
 *     tags:
 *       - Images
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ImageInput'
 *     responses:
 *       200:
 *         description: The created image object
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Image'
 *       400:
 *         description: Bad request
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Invalid input"
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Internal server error"
 */
imagesRouter.post('/', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const imageInput = <ImageInput>req.body;
        const image = await ImagesService.createImage(imageInput);
        res.status(200).json(image);
    } catch (error) {
        next(error);
    }
});

export { imagesRouter };
