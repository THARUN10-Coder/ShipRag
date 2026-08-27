import {
  CopilotMessage,
  Citation,
  RetrievedChunk,
  RepositoryFileNode,
} from "@/types/copilot";

export const MOCK_FILE_TREES: Record<string, RepositoryFileNode[]> = {
  "ecommerce-platform": [
    {
      id: "f-src",
      name: "src",
      path: "src",
      type: "folder",
      children: [
        {
          id: "f-api",
          name: "api",
          path: "src/api",
          type: "folder",
          children: [
            { id: "f-routes", name: "routes.ts", path: "src/api/routes.ts", type: "file" },
            { id: "f-graphql", name: "schema.graphql", path: "src/api/schema.graphql", type: "file" },
          ],
        },
        {
          id: "f-auth",
          name: "auth",
          path: "src/auth",
          type: "folder",
          children: [
            { id: "f-mid", name: "middleware.py", path: "src/auth/middleware.py", type: "file" },
            { id: "f-srv", name: "service.py", path: "src/auth/service.py", type: "file" },
          ],
        },
        {
          id: "f-services",
          name: "services",
          path: "src/services",
          type: "folder",
          children: [
            { id: "f-cart", name: "cart.ts", path: "src/services/cart.ts", type: "file" },
            { id: "f-checkout", name: "checkout.ts", path: "src/services/checkout.ts", type: "file" },
          ],
        },
        {
          id: "f-db",
          name: "database",
          path: "src/database",
          type: "folder",
          children: [
            { id: "f-client", name: "client.ts", path: "src/database/client.ts", type: "file" },
          ],
        },
      ],
    },
    {
      id: "f-docs",
      name: "docs",
      path: "docs",
      type: "folder",
      children: [
        { id: "f-doc-auth", name: "authentication.md", path: "docs/authentication.md", type: "file" },
        { id: "f-doc-arch", name: "architecture.md", path: "docs/architecture.md", type: "file" },
      ],
    },
    { id: "f-readme", name: "README.md", path: "README.md", type: "file" },
    { id: "f-package", name: "package.json", path: "package.json", type: "file" },
  ],
  "payment-service": [
    {
      id: "p-src",
      name: "src",
      path: "src",
      type: "folder",
      children: [
        {
          id: "p-auth",
          name: "auth",
          path: "src/auth",
          type: "folder",
          children: [
            { id: "p-hmac", name: "hmac.py", path: "src/auth/hmac.py", type: "file" },
            { id: "p-token", name: "token.py", path: "src/auth/token.py", type: "file" },
          ],
        },
        {
          id: "p-gateway",
          name: "gateways",
          path: "src/gateways",
          type: "folder",
          children: [
            { id: "p-stripe", name: "stripe.py", path: "src/gateways/stripe.py", type: "file" },
            { id: "p-paypal", name: "paypal.py", path: "src/gateways/paypal.py", type: "file" },
          ],
        },
      ],
    },
    { id: "p-docker", name: "docker-compose.yml", path: "docker-compose.yml", type: "file" },
    { id: "p-reqs", name: "requirements.txt", path: "requirements.txt", type: "file" },
  ],
};

export const DEFAULT_FILE_TREE: RepositoryFileNode[] = [
  {
    id: "d-src",
    name: "src",
    path: "src",
    type: "folder",
    children: [
      { id: "d-main", name: "main.py", path: "src/main.py", type: "file" },
      { id: "d-middleware", name: "middleware.py", path: "src/middleware.py", type: "file" },
      { id: "d-routes", name: "routes.py", path: "src/routes.py", type: "file" },
    ],
  },
  {
    id: "d-docs",
    name: "docs",
    path: "docs",
    type: "folder",
    children: [
      { id: "d-arch", name: "architecture.md", path: "docs/architecture.md", type: "file" },
      { id: "d-setup", name: "setup.md", path: "docs/setup.md", type: "file" },
    ],
  },
  { id: "d-readme", name: "README.md", path: "README.md", type: "file" },
];

export const INITIAL_COPILOT_MESSAGES: CopilotMessage[] = [
  {
    id: "msg-1",
    role: "user",
    content: "Explain how authentication works in this repository.",
    timestamp: "10:42 AM",
    contextScope: "ecommerce-platform",
    mode: "explain",
  },
  {
    id: "msg-2",
    role: "assistant",
    content: `Authentication is handled through three main layers:

1. **Request Middleware**: Validates the incoming JWT signature and decodes session claims (\`auth/middleware.py\`).
2. **Authentication Service**: Decodes cryptographic HMAC hashes and verifies user permissions against the tenant ledger (\`services/auth.py\`).
3. **Protected Routes**: Handlers receive the authenticated user context object directly in the request state.

\`\`\`mermaid
flowchart LR
    A[Incoming Request] --> B[Auth Middleware]
    B --> C[Token Validation]
    C --> D[User Context]
    D --> E[Protected Route]
\`\`\`

The middleware is the primary enforcement point ensuring zero-trust verification before route handlers execute.`,
    timestamp: "10:42 AM",
    contextScope: "ecommerce-platform",
    mode: "explain",
    grounding: {
      score: 96,
      sourcesUsed: 3,
      verifiedClaims: 18,
      unsupportedClaims: 0,
    },
    pipelineStages: {
      dense: true,
      bm25: true,
      hybridRanking: true,
      contextSynthesis: true,
      groundedResponse: true,
    },
    citations: [
      {
        id: "cit-1",
        repo: "ecommerce-platform",
        branch: "main",
        file: "src/auth/middleware.py",
        startLine: 42,
        endLine: 67,
        relevance: 96,
        retrievalType: "Dense + BM25",
        codeSnippet: `42  def authenticate(request):\n43      token = extract_token(request)\n44      user = validate_token(token)\n45      request.state.user = user\n46      return user`,
      },
      {
        id: "cit-2",
        repo: "ecommerce-platform",
        branch: "main",
        file: "src/services/auth.py",
        startLine: 82,
        endLine: 101,
        relevance: 93,
        retrievalType: "Dense + BM25",
        codeSnippet: `82  def validate_token(token: str) -> dict:\n83      try:\n84          return jwt.decode(token, SECRET_KEY, algorithms=["HS256"])\n85      except jwt.InvalidTokenError:\n86          raise AuthException("Expired or invalid JWT")`,
      },
      {
        id: "cit-3",
        repo: "ecommerce-platform",
        branch: "main",
        file: "src/api/routes.py",
        startLine: 24,
        endLine: 41,
        relevance: 89,
        retrievalType: "BM25",
        codeSnippet: `24  @router.get("/protected/checkout")\n25  async def checkout_handler(req: Request, user = Depends(authenticate)):\n26      return {"status": "ok", "user_id": user["id"]}`,
      },
    ],
    retrievedChunks: [
      {
        id: "chk-1",
        repo: "ecommerce-platform",
        file: "src/auth/middleware.py",
        lineRange: "42-67",
        relevance: 96,
        method: "Hybrid",
        preview: "def authenticate(request): token = extract_token(request) validate_token(token)...",
      },
      {
        id: "chk-2",
        repo: "ecommerce-platform",
        file: "src/services/auth.py",
        lineRange: "82-101",
        relevance: 93,
        method: "Dense",
        preview: "def validate_token(token: str): return jwt.decode(token, SECRET_KEY)...",
      },
      {
        id: "chk-3",
        repo: "ecommerce-platform",
        file: "src/api/routes.py",
        lineRange: "24-41",
        relevance: 89,
        method: "BM25",
        preview: "@router.get('/protected/checkout') async def checkout_handler(req: Request)...",
      },
      {
        id: "chk-4",
        repo: "ecommerce-platform",
        file: "docs/authentication.md",
        lineRange: "18-45",
        relevance: 88,
        method: "Dense",
        preview: "SHIPRAG authentication architecture relies on stateless JSON Web Tokens...",
      },
      {
        id: "chk-5",
        repo: "ecommerce-platform",
        file: "src/database/client.ts",
        lineRange: "12-30",
        relevance: 84,
        method: "Dense",
        preview: "export const db = createClient({ connectionString: env.DATABASE_URL })...",
      },
      {
        id: "chk-6",
        repo: "ecommerce-platform",
        file: "package.json",
        lineRange: "1-25",
        relevance: 81,
        method: "BM25",
        preview: '"dependencies": { "jsonwebtoken": "^9.0.0", "bcryptjs": "^2.4.3" }...',
      },
    ],
  },
];
