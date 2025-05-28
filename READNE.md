cd "c:\Users\filss\OneDrive\Documents\projets\CopiloteGitHubTestes\copilteficheenquette" && npm install

cd "c:\Users\filss\OneDrive\Documents\projets\CopiloteGitHubTestes\copilteficheenquette\api" && npm install

npm install -g azure-functions-core-tools@4

cd "c:\Users\filss\OneDrive\Documents\projets\CopiloteGitHubTestes\copilteficheenquette\api" && npm run build

First, let's start both the API and frontend in development mode. We'll start the API server first:
cd "c:\Users\filss\OneDrive\Documents\projets\CopiloteGitHubTestes\copilteficheenquette\api" && func start
Now let's start the Static Web App for the frontend:cd "c:\Users\filss\OneDrive\Documents\projets\CopiloteGitHubTestes\copilteficheenquette" && swa start --api-devserver-url http://localhost:7072

API Server running at http://localhost:7072
Static Web App running at http://localhost:4280