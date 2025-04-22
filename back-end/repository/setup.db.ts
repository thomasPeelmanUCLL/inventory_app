import { Setup } from '../model/setup';
import database from './database';
import { Setup as SetupPrisma } from '@prisma/client';
import { HardwareComponent } from '../model/hardwareComponent';
import { Image } from '../model/image';

const getAllSetups = async (params?: {
    skip?: number;
    take?: number;
    orderBy?: {
        field: 'lastUpdated' | 'id';
        direction: 'asc' | 'desc';
    };
}): Promise<Setup[]> => {
    try {
        const setupsPrisma = await database.setup.findMany({
            skip: params?.skip,
            take: params?.take,
            orderBy: params?.orderBy
                ? {
                      [params.orderBy.field]: params.orderBy.direction,
                  }
                : undefined,
            include: {
                owner: true,
                hardwareComponents: true,
                images: true,
                comments: true,
            },
        });
        return setupsPrisma.map(Setup.from);
    } catch (error) {
        console.error(error);
        throw new Error('Database error. See server log for details.');
    }
};

const getSetupById = async ({ id }: { id: number }): Promise<Setup | null> => {
    try {
        const setupPrisma = await database.setup.findUnique({
            where: { id },
            include: {
                owner: true,
                hardwareComponents: true,
                images: true,
                comments: true,
            },
        });
        return setupPrisma ? Setup.from(setupPrisma) : null;
    } catch (error) {
        console.error(error);
        throw new Error('Database error. See server log for details.');
    }
};

const getSetupsByOwnerId = async ({ ownerId }: { ownerId: number }): Promise<Setup[]> => {
    try {
        const setupsPrisma = await database.setup.findMany({
            where: { ownerId },
            include: {
                owner: true,
                hardwareComponents: true,
                images: true,
                comments: true,
            },
        });
        return setupsPrisma.map(Setup.from);
    } catch (error) {
        console.error(error);
        throw new Error('Database error. See server log for details.');
    }
};

const createSetup = async (setup: Setup): Promise<Setup> => {
    try {
        const setupPrisma = await database.setup.create({
            data: {
                ownerId: setup.getOwnerId(),
                details: setup.getDetails(),
                lastUpdated: setup.getLastUpdated(),
                hardwareComponents: {
                    connect: setup.getHardwareComponents().map((component) => ({
                        id: component.getId(),
                    })),
                },
                images: {
                    connect: setup.getImages().map((image) => ({
                        id: image.getId(),
                    })),
                },
            },
            include: {
                owner: true,
                hardwareComponents: true,
                images: true,
                comments: true,
            },
        });
        return Setup.from(setupPrisma);
    } catch (error) {
        console.error(error);
        throw new Error('Database error. See server log for details.');
    }
};

const deleteSetup = async ({ id }: { id: number }): Promise<void> => {
    try {
        await database.setup.delete({
            where: { id },
        });
    } catch (error) {
        console.error(error);
        throw new Error('Database error. See server log for details.');
    }
};

const addHardwareComponent = async ({
    setupId,
    componentId,
}: {
    setupId: number;
    componentId: number;
}): Promise<Setup> => {
    try {
        const setupPrisma = await database.setup.update({
            where: { id: setupId },
            data: {
                hardwareComponents: {
                    connect: { id: componentId },
                },
            },
            include: {
                owner: true,
                hardwareComponents: true,
                images: true,
                comments: true,
            },
        });
        return Setup.from(setupPrisma);
    } catch (error) {
        console.error(error);
        throw new Error('Database error. See server log for details.');
    }
};

const removeHardwareComponent = async ({
    setupId,
    componentId,
}: {
    setupId: number;
    componentId: number;
}): Promise<Setup> => {
    try {
        const setupPrisma = await database.setup.update({
            where: { id: setupId },
            data: {
                hardwareComponents: {
                    disconnect: { id: componentId },
                },
            },
            include: {
                owner: true,
                hardwareComponents: true,
                images: true,
                comments: true,
            },
        });
        return Setup.from(setupPrisma);
    } catch (error) {
        console.error(error);
        throw new Error('Database error. See server log for details.');
    }
};

const addImage = async ({
    setupId,
    imageId,
}: {
    setupId: number;
    imageId: number;
}): Promise<Setup> => {
    try {
        const setupPrisma = await database.setup.update({
            where: { id: setupId },
            data: {
                images: {
                    connect: { id: imageId },
                },
            },
            include: {
                owner: true,
                hardwareComponents: true,
                images: true,
                comments: true,
            },
        });
        return Setup.from(setupPrisma);
    } catch (error) {
        console.error(error);
        throw new Error('Database error. See server log for details.');
    }
};

const removeImage = async ({
    setupId,
    imageId,
}: {
    setupId: number;
    imageId: number;
}): Promise<Setup> => {
    try {
        const setupPrisma = await database.setup.update({
            where: { id: setupId },
            data: {
                images: {
                    disconnect: { id: imageId },
                },
            },
            include: {
                owner: true,
                hardwareComponents: true,
                images: true,
                comments: true,
            },
        });
        return Setup.from(setupPrisma);
    } catch (error) {
        console.error(error);
        throw new Error('Database error. See server log for details.');
    }
};

const updateSetup = async (setup: Setup): Promise<Setup> => {
    try {
        const setupPrisma = await database.setup.update({
            where: { id: setup.getId() },
            data: {
                details: setup.getDetails(),
                lastUpdated: setup.getLastUpdated(),
            },
            include: {
                owner: true,
                hardwareComponents: true,
                images: true,
                comments: true,
            },
        });
        return Setup.from(setupPrisma);
    } catch (error) {
        console.error(error);
        throw new Error('Database error. See server log for details.');
    }
};

const updateSetupHardwareComponents = async (
    setupId: number,
    hardwareComponents: HardwareComponent[]
): Promise<void> => {
    try {
        // First, disconnect all existing components
        await database.setup.update({
            where: { id: setupId },
            data: {
                hardwareComponents: {
                    disconnect: await database.hardwareComponent.findMany({
                        where: { setups: { some: { id: setupId } } },
                        select: { id: true },
                    }),
                },
            },
        });

        // Then, connect the new components
        await database.setup.update({
            where: { id: setupId },
            data: {
                hardwareComponents: {
                    connect: hardwareComponents.map((component) => ({
                        id: component.getId(),
                    })),
                },
            },
        });
    } catch (error) {
        console.error(error);
        throw new Error('Database error. See server log for details.');
    }
};

const updateSetupImages = async (setupId: number, images: Image[]): Promise<void> => {
    try {
        // First, disconnect all existing images
        await database.setup.update({
            where: { id: setupId },
            data: {
                images: {
                    disconnect: await database.image.findMany({
                        where: { setups: { some: { id: setupId } } },
                        select: { id: true },
                    }),
                },
            },
        });

        // Then, connect the new images
        await database.setup.update({
            where: { id: setupId },
            data: {
                images: {
                    connect: images.map((image) => ({
                        id: image.getId(),
                    })),
                },
            },
        });
    } catch (error) {
        console.error(error);
        throw new Error('Database error. See server log for details.');
    }
};

export default {
    getAllSetups,
    getSetupById,
    getSetupsByOwnerId,
    createSetup,
    updateSetup,
    deleteSetup,
    addHardwareComponent,
    removeHardwareComponent,
    addImage,
    removeImage,
    updateSetupHardwareComponents,
    updateSetupImages,
};
