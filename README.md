# Copilote Fiche Enquette Project Setup

This document describes how to set up and run the "copilteficheenquette" project, which includes a frontend Static Web App and a backend API using Azure Functions.

## Prerequisites

1.  **Node.js and npm:** Ensure you have Node.js installed, which includes npm (Node Package Manager). You can download it from [nodejs.org](https://nodejs.org/).
2.  **Azure Functions Core Tools:** This is required to run the Azure Functions API locally. Install it globally if you haven't already:
    ```bash
    npm install -g azure-functions-core-tools@4
    ```
3.  **Azure Static Web Apps CLI (SWA CLI):** This is useful for running the frontend and backend together locally. Install it globally if you haven't already:
    ```bash
    npm install -g @azure/static-web-apps-cli
    ```

## Setup and Installation

1.  **Clone the repository:**
    ```bash
    git clone [repository_url]
    cd [repository_directory_name] # e.g., copilteficheenquette
    ```

2.  **Install root dependencies:**
    Navigate to the project's root directory and run:
    ```bash
    npm install
    ```

3.  **Install API dependencies:**
    Navigate to the `api` directory and run:
    ```bash
    cd api
    npm install
    cd ..
    ```

4.  **Build the API:**
    The API is written in TypeScript and needs to be compiled.
    ```bash
    cd api
    npm run build
    cd ..
    ```
    Alternatively, from the root directory, you can often use `npm run build:api` if defined in the root `package.json`.

## Running Locally

You can run the frontend and API separately, or use the SWA CLI to run them together. The SWA CLI is generally recommended for a development experience closer to the deployed environment.

**Option 1: Using Azure Static Web Apps CLI (Recommended)**

1.  From the project root directory, start the SWA CLI. This command will typically serve the frontend from the root and look for the API in the `api` folder. It will also automatically use the API development server URL.
    ```bash
    swa start --api-location ./api
    ```
    Or, if your API is already built and you want to point to its running instance (e.g., from `func start`):
    ```bash
    # First, start the API in one terminal:
    # cd api && func start --port 7071
    # (Note: the original README used 7072, default is often 7071 for func start)

    # Then, in another terminal, from the project root:
    # swa start --api-devserver-url http://localhost:7071
    # (Adjust port if your API runs on a different one)
    ```

    The SWA CLI will output the URL for the Static Web App (e.g., `http://localhost:4280`). The API will be available under `/api` relative to that URL.

**Option 2: Running API and Frontend Separately**

1.  **Start the API server:**
    Navigate to the `api` directory and start the Azure Functions host:
    ```bash
    cd api
    func start
    ```
    Take note of the port the API server is running on (e.g., `http://localhost:7071`).

2.  **Serve the frontend:**
    For the frontend (HTML, JS, CSS files in the root), you can use a simple HTTP server. If you have `serve` installed (from `npm install -g serve` or as a dev dependency):
    ```bash
    serve .
    ```
    Or use any other local web server. The frontend will likely be available at a URL like `http://localhost:5000` (the port depends on the server used).

    *Important*: If running separately, ensure your frontend's `config.js` (or API calls) correctly target the API URL (e.g., `http://localhost:7071/api`). The SWA CLI handles this proxying automatically.

## Expected Endpoints (when running with SWA CLI)

*   **Static Web App (Frontend):** `http://localhost:4280` (or as indicated by `swa start`)
*   **API Server:** Proxied under `http://localhost:4280/api` (e.g., `http://localhost:4280/api/getQuestionnaires`)

Refer to `staticwebapp.config.json` for routing rules and `swa-cli.config.json` (if present) for SWA CLI specific configurations.
The `azure.yaml` file describes the services for Azure deployment.
