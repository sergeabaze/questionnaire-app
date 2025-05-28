import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import { Questionnaire } from "../models/questionnaire";
import { cosmosDBService } from "../services/cosmosDBService";

export async function saveQuestionnaire(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
    try {
        // Vérifier si la requête contient un corps
        const questionnaire = await request.json() as Questionnaire;
        
        if (!questionnaire) {
            return {
                status: 400,
                body: "Le corps de la requête est requis"
            };
        }

        // Valider les champs requis
        if (!questionnaire.userId || !questionnaire.consommationDrogues || !questionnaire.consommationAlcool) {
            return {
                status: 400,
                body: "Les champs userId, consommationDrogues et consommationAlcool sont requis"
            };
        }

        // Ajouter la date de création
        questionnaire.dateCreation = new Date();
        
        // Générer un ID unique si non fourni
        if (!questionnaire.id) {
            questionnaire.id = Date.now().toString();
        }

        // Sauvegarder dans Cosmos DB
        const savedQuestionnaire = await cosmosDBService.saveQuestionnaire(questionnaire);

        return {
            status: 201,
            jsonBody: savedQuestionnaire
        };
    } catch (error) {
        context.log('Erreur lors de la sauvegarde du questionnaire:', error instanceof Error ? error.message : String(error));
        return {
            status: 500,
            body: "Une erreur est survenue lors de la sauvegarde du questionnaire"
        };
    }
};

app.http('saveQuestionnaire', {
    methods: ['GET', 'POST'],
    authLevel: 'anonymous',
    handler: saveQuestionnaire
});
