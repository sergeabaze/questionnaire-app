import { getQuestionnaires } from './getQuestionnaires'; // Adjust path as necessary
import { cosmosDBService } from '../services/cosmosDBService'; // Adjust path
import { HttpRequest, InvocationContext } from '@azure/functions';

// Mock HttpRequest and InvocationContext
const mockHttpRequest = (query: Record<string, string>, params?: Record<string, string>): HttpRequest => {
    const request = new HttpRequest({
        method: 'GET',
        url: 'http://localhost/api/getQuestionnaires',
        headers: {},
        query: query,
        params: params || {},
        body: undefined, // Corrected: null is not assignable to HttpRequestBodyInit | undefined
        user: null,
    });
    // Mock the .query.get() method
    request.query.get = (key: string) => query[key] || null;
    return request;
};

const mockInvocationContext = (): InvocationContext => {
    return new InvocationContext({
        invocationId: 'test-invocation-id',
        functionName: 'getQuestionnaires',
        log: jest.fn(), // Mock logger
        traceContext: { traceParent: '', tracestate: '', attributes: {} }, // Corrected: traceparent to traceParent
        retryContext: undefined, // Corrected: null to undefined
    });
};

// Mock the cosmosDBService
jest.mock('../services/cosmosDBService', () => ({
    cosmosDBService: {
        getQuestionnairesByUser: jest.fn(),
    },
}));

describe('getQuestionnaires Azure Function', () => {
    let context: InvocationContext;

    beforeEach(() => {
        context = mockInvocationContext();
        // Reset mocks before each test
        (cosmosDBService.getQuestionnairesByUser as jest.Mock).mockReset();
    });

    it('should return 200 with questionnaires if userId is provided and service succeeds', async () => {
        const mockUserId = 'testUser123';
        const mockQuestionnaires = [{ id: 'q1', userId: mockUserId, content: 'Test content' }];
        (cosmosDBService.getQuestionnairesByUser as jest.Mock).mockResolvedValue(mockQuestionnaires);

        const request = mockHttpRequest({ userId: mockUserId });
        const response = await getQuestionnaires(request, context);

        expect(response.status).toBe(200);
        expect(response.jsonBody).toEqual(mockQuestionnaires);
        expect(cosmosDBService.getQuestionnairesByUser).toHaveBeenCalledWith(mockUserId);
        expect(context.log).toHaveBeenCalledTimes(0); // No error logs
    });

    it('should return 400 if userId parameter is missing', async () => {
        const request = mockHttpRequest({}); // No userId
        const response = await getQuestionnaires(request, context);

        expect(response.status).toBe(400);
        expect(response.body).toBe("Le paramètre userId est requis");
        expect(cosmosDBService.getQuestionnairesByUser).not.toHaveBeenCalled();
    });

    it('should return 500 if cosmosDBService throws an error', async () => {
        const mockUserId = 'testUserError';
        const errorMessage = 'Database error';
        (cosmosDBService.getQuestionnairesByUser as jest.Mock).mockRejectedValue(new Error(errorMessage));

        const request = mockHttpRequest({ userId: mockUserId });
        const response = await getQuestionnaires(request, context);

        expect(response.status).toBe(500);
        expect(response.body).toBe("Une erreur est survenue lors de la récupération des questionnaires");
        expect(cosmosDBService.getQuestionnairesByUser).toHaveBeenCalledWith(mockUserId);
        expect(context.log).toHaveBeenCalledWith('Erreur lors de la récupération des questionnaires:', errorMessage);
    });

    it('should return 500 if cosmosDBService throws a non-Error object', async () => {
        const mockUserId = 'testUserNonError';
        const errorObject = { message: 'Something went wrong' };
        (cosmosDBService.getQuestionnairesByUser as jest.Mock).mockRejectedValue(errorObject);

        const request = mockHttpRequest({ userId: mockUserId });
        const response = await getQuestionnaires(request, context);

        expect(response.status).toBe(500);
        expect(response.body).toBe("Une erreur est survenue lors de la récupération des questionnaires");
        expect(context.log).toHaveBeenCalledWith('Erreur lors de la récupération des questionnaires:', String(errorObject));
    });
});
