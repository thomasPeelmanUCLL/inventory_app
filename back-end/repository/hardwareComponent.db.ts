import { HardwareComponent } from '../model/hardwareComponent';
import { HardwareComponent as HardwareComponentPrisma } from '@prisma/client';

import database from './database';

const getAllHardwareComponents = async (): Promise<HardwareComponent[]> => {
    try {
        const hardwareComponentsPrisma = await database.hardwareComponent.findMany();
        return hardwareComponentsPrisma.map((hardwareComponentPrisma) =>
            HardwareComponent.from(hardwareComponentPrisma)
        );
    } catch (error) {
        console.error(error);
        throw new Error('Database error. See server log for details.');
    }
};

const getById = async ({ id }: { id: number }): Promise<HardwareComponent | null> => {
    try {
        const hardwareComponentPrisma = await database.hardwareComponent.findUnique({
            where: { id },
        });

        return hardwareComponentPrisma ? HardwareComponent.from(hardwareComponentPrisma) : null;
    } catch (error) {
        console.error(error);
        throw new Error('Database error. See server log for details.');
    }
};

const getHardwareComponentByName = async ({
    name,
}: {
    name: string;
}): Promise<HardwareComponent | null> => {
    try {
        const hardwareComponentPrisma = await database.hardwareComponent.findFirst({
            where: { name },
        });

        return hardwareComponentPrisma ? HardwareComponent.from(hardwareComponentPrisma) : null;
    } catch (error) {
        console.error(error);
        throw new Error('Database error. See server log for details.');
    }
};

const createHardwareComponent = async (
    hardwareComponent: HardwareComponent
): Promise<HardwareComponent> => {
    try {
        const hardwareComponentPrisma = await database.hardwareComponent.create({
            data: {
                name: hardwareComponent.getName(),
                details: hardwareComponent.getDetails(),
                price: hardwareComponent.getPrice(),
            },
        });
        return HardwareComponent.from(hardwareComponentPrisma);
    } catch (error) {
        console.error(error);
        throw new Error('Database error. See server log for details.');
    }
};

export default {
    getAllHardwareComponents,
    getById,
    getHardwareComponentByName,
    createHardwareComponent,
};
