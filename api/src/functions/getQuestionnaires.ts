import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import { cosmosDBService } from "../services/cosmosDBService";

export async function getQuestionnaires(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
    try {
        // Récupérer l'ID de l'utilisateur depuis les paramètres de requête
        const userId = request.query.get('userId');

        if (!userId) {
            return {
                status: 400,
                body: "Le paramètre userId est requis"
            };
        }

        // Récupérer les questionnaires de l'utilisateur
        const questionnaires = await cosmosDBService.getQuestionnairesByUser(userId);

        return {
            status: 200,
            jsonBody: questionnaires
        };
    } catch (error) {
        context.log('Erreur lors de la récupération des questionnaires:', error instanceof Error ? error.message : String(error));
        return {
            status: 500,
            body: "Une erreur est survenue lors de la récupération des questionnaires"
        };
    }
}
