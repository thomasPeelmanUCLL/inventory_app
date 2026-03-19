import database from './database';

export abstract class BaseRepository<T, U> {
    protected abstract entityName: string;
    protected abstract fromPrisma(prismaEntity: U): T;
    protected abstract getEntityId(entity: T): number;

    protected async findMany(options: any = {}): Promise<T[]> {
        try {
            const prismaEntities = await (database as any)[this.entityName].findMany(options);
            return prismaEntities.map((prismaEntity: U) => this.fromPrisma(prismaEntity));
        } catch (error) {
            console.error(error);
            throw new Error('Database error. See server log for details.');
        }
    }

    protected async findUnique(options: any): Promise<T | null> {
        try {
            const prismaEntity = await (database as any)[this.entityName].findUnique(options);
            return prismaEntity ? this.fromPrisma(prismaEntity) : null;
        } catch (error) {
            console.error(error);
            throw new Error('Database error. See server log for details.');
        }
    }

    protected async create(data: any, options: any = {}): Promise<T> {
        try {
            const createOptions = { data, ...options };
            const prismaEntity = await (database as any)[this.entityName].create(createOptions);
            return this.fromPrisma(prismaEntity);
        } catch (error) {
            console.error(error);
            throw new Error('Database error. See server log for details.');
        }
    }

    protected async update(entity: T, data: any, options: any = {}): Promise<T | null> {
        try {
            const updateOptions = {
                where: { id: this.getEntityId(entity) },
                data,
                ...options,
            };
            const prismaEntity = await (database as any)[this.entityName].update(updateOptions);
            return this.fromPrisma(prismaEntity);
        } catch (error) {
            console.error(error);
            throw new Error('Database error. See server log for details.');
        }
    }

    protected async delete(id: number): Promise<void> {
        try {
            await (database as any)[this.entityName].delete({
                where: { id },
            });
        } catch (error) {
            console.error(error);
            throw new Error('Database error. See server log for details.');
        }
    }
}
