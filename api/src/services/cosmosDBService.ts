import { CosmosClient } from '@azure/cosmos';
import { Questionnaire } from '../models/questionnaire';

class CosmosDBService {
    private client: CosmosClient;
    private database: string;
    private container: string;

    constructor() {
        const connectionString = process.env.CosmosDB__ConnectionString;
        if (!connectionString) {
            throw new Error('CosmosDB connection string is not configured');
        }

        this.database = process.env.CosmosDB__DatabaseName || 'db-enquetes';
        this.container = process.env.CosmosDB__ContainerName || 'questionnaires';
        this.client = new CosmosClient(connectionString);
    }    async saveQuestionnaire(questionnaire: Questionnaire): Promise<Questionnaire> {
        const { database } = await this.client.databases.createIfNotExists({ id: this.database });
        const { container } = await database.containers.createIfNotExists({ id: this.container });
        
        const { resource } = await container.items.create(questionnaire);
        return resource as Questionnaire;
    }

    async getQuestionnaire(id: string): Promise<Questionnaire | undefined> {
        const { database } = await this.client.databases.createIfNotExists({ id: this.database });
        const { container } = await database.containers.createIfNotExists({ id: this.container });
        
        const { resource } = await container.item(id, id).read();
        return resource;
    }

    async getQuestionnairesByUser(userId: string): Promise<Questionnaire[]> {
        const { database } = await this.client.databases.createIfNotExists({ id: this.database });
        const { container } = await database.containers.createIfNotExists({ id: this.container });
        
        const querySpec = {
            query: 'SELECT * FROM c WHERE c.userId = @userId',
            parameters: [{ name: '@userId', value: userId }]
        };

        const { resources } = await container.items.query(querySpec).fetchAll();
        return resources;
    }
}

export const cosmosDBService = new CosmosDBService();
