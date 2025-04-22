import { Image as ImagePrisma } from '@prisma/client';

export class Image {
    private id?: number;
    private url: string;
    private details: string;

    constructor(image: { id?: number; url: string; details: string }) {
        this.validate(image);
        this.id = image.id;
        this.url = image.url;
        this.details = image.details;
    }

    // Add getId method
    getId(): number | undefined {
        return this.id;
    }

    // GETTERS

    getUrl(): string {
        return this.url;
    }

    getDetails(): string {
        return this.details;
    }

    validate(image: { url: string; details: string }): void {
        if (!image.url || !image.details) {
            throw new Error('URL and details are required');
        }
        if (typeof image.url !== 'string' || typeof image.details !== 'string') {
            throw new Error('Invalid data type: URL and details must be strings');
        }
    }

    // SETTERS
    setUrl(url: string): void {
        this.url = url;
    }

    setDetails(details: string): void {
        this.details = details;
    }

    equals(image: Image): boolean {
        return this.url === image.getUrl() && this.details === image.getDetails();
    }

    static from({ id, url, details }: ImagePrisma): Image {
        return new Image({
            id,
            url,
            details,
        });
    }
}
