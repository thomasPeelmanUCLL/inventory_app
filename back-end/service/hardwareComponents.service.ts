import { HardwareComponent } from '../model/hardwareComponent';
import hardwareComponentDB from '../repository/hardwareComponent.db';
import { HardwareComponentInput } from '../types';

const getAllHardwareComponents = async (): Promise<HardwareComponent[]> =>
    hardwareComponentDB.getAllHardwareComponents();

const getHardwareComponentByName = async ({
    name,
}: {
    name: string;
}): Promise<HardwareComponent | null> => {
    const hardwareComponent = await hardwareComponentDB.getHardwareComponentByName({ name });
    if (!hardwareComponent) {
        throw new Error(`Hardware component with name: ${name} does not exist.`);
    }
    return hardwareComponent;
};

const createHardwareComponent = async ({
    name,
    details,
    price,
}: HardwareComponentInput): Promise<HardwareComponent> => {
    const existingHardwareComponent = await hardwareComponentDB.getHardwareComponentByName({
        name,
    });

    if (existingHardwareComponent) {
        throw new Error(`Hardware component with name ${name} is already registered.`);
    }

    const hardwareComponent = new HardwareComponent({ name, details, price });
    return await hardwareComponentDB.createHardwareComponent(hardwareComponent);
};

export default { getAllHardwareComponents, getHardwareComponentByName, createHardwareComponent };
