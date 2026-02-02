
# Policy Builder Integration Setup

This guide explains how to connect the frontend policy builder to the backend API.

## Prerequisites

1. **Docker Desktop**: Must be installed and running
2. **Backend API running**: The agentic-commerce backend runs in Docker on `http://localhost:3000`
3. **JWT Token**: You need a JWT token from the backend for authentication

## Important: Docker Setup

The backend runs in Docker, but the frontend connects to `http://localhost:3000` just like normal. Docker maps the container's port 3000 to your host's port 3000, so no special configuration is needed.

## Setup Steps

### 1. Ensure Docker is Running

**macOS:**
- Open Docker Desktop from Applications
- Wait for the whale icon to appear in the menu bar
- The icon should show "Docker Desktop is running"

**Check Docker status:**
```bash
docker ps
# Should show running containers, not an error
```

If you see "Cannot connect to the Docker daemon", Docker Desktop is not running.

### 2. Start the Backend (Docker)

```bash
cd /Users/cyrus19901/Repository/agentic-commerce

# Start development containers
make dev

# Or manually:
docker compose -f docker-compose.dev.yml up -d
```

**Wait for containers to start**, then verify:
```bash
# Check container status
make status
# Or: docker compose -f docker-compose.dev.yml ps

# View logs to ensure it started correctly
make dev-logs
# Or: docker compose -f docker-compose.dev.yml logs -f api
```

You should see: `✓ API Server running on port 3000`

### 3. Setup Database

```bash
cd /Users/cyrus19901/Repository/agentic-commerce
make db-setup
```

This creates the database tables and default policies.

### 4. Generate JWT Token

**Important**: Token generation must run inside the Docker container:

```bash
cd /Users/cyrus19901/Repository/agentic-commerce

# Using Makefile (recommended):
make generate-token USER=user-123

# Or manually:
docker compose -f docker-compose.dev.yml exec api npm run generate-token user-123
```

**Copy the generated token** - you'll need it for the frontend. It will look like:
```
Token: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### 5. Backend Environment File Location

The backend `.env` file is located at:
```
/Users/cyrus19901/Repository/agentic-commerce/.env
```

**Note**: This file is gitignored. If it doesn't exist, Docker Compose will use default values from `docker-compose.dev.yml`.

**To create/update the backend `.env` file:**
```bash
cd /Users/cyrus19901/Repository/agentic-commerce

# Create .env file (if it doesn't exist)
cat > .env << EOF
JWT_SECRET=your-secret-key-change-in-production
PORT=3000
DATABASE_URL=./data/shopping.db
ALLOWED_ORIGINS=https://chat.openai.com,https://chatgpt.com
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
ETSY_API_KEY=
EOF
```

**Important**: If you change `JWT_SECRET` in `.env`, you'll need to:
1. Restart the Docker container: `make restart` or `docker compose -f docker-compose.dev.yml restart`
2. Regenerate your JWT token (step 4)

### 6. Configure Frontend Environment

Create a `.env.local` file in the frontend project:

```bash
cd /Users/cyrus19901/Repository/gordon-fe-policy
```

Create `.env.local`:

```env
NEXT_PUBLIC_API_URL=http://localhost:3000
NEXT_PUBLIC_API_TOKEN=your-jwt-token-here
```

**Replace `your-jwt-token-here`** with the token from step 4.

**Note**: Even though the backend runs in Docker, the frontend connects to `http://localhost:3000` because Docker maps the container port to your host port.

### 7. Start the Frontend

```bash
cd /Users/cyrus19901/Repository/gordon-fe-policy
npm install  # If not already done
npm run dev
```

The frontend will be available at `http://localhost:3001` (or the port Next.js assigns).

## Usage

1. **View Policies**: Navigate to the "Policy Builder" tab (or "find-deals" in the navigation)
2. **Create Policy**: Click "New" to create a new policy
3. **Edit Policy**: Select an existing policy from the dropdown
4. **Save Policy**: Click "Save workflow" to save changes
5. **Test Policy**: Use the "Test with sample purchase" button in the sidebar to test policies

## Policy Types Supported

The frontend policy builder supports creating these backend policy types:

- **Budget Limits**: Set monthly/weekly/daily spending limits
- **Transaction Limits**: Set maximum amount per transaction
- **Merchant Controls**: Allow or block specific merchants
- **Category Controls**: Allow or block product categories

## Testing with ChatGPT

1. Make sure both backend and frontend are running
2. Create/update policies in the frontend
3. Test policies in ChatGPT using the configured GPT
4. Policies are enforced in real-time when ChatGPT makes purchase attempts

## Troubleshooting

### "Failed to load policies"
- Check that the backend is running on `http://localhost:3000`
- Verify the JWT token in `.env.local` is correct
- Check browser console for detailed error messages

### "Failed to save policy"
- Ensure the backend API is accessible
- Check that the policy ID doesn't conflict with existing policies
- Verify the policy structure matches backend requirements

### CORS Errors
- The backend should allow requests from `http://localhost:3001` (or your frontend port)
- Check backend CORS configuration in `packages/api/src/index.ts`

## API Endpoints Used

- `GET /api/policies` - List all policies
- `GET /api/policies/:id` - Get specific policy
- `POST /api/policies` - Create new policy
- `PUT /api/policies/:id` - Update policy
- `DELETE /api/policies/:id` - Delete policy
- `POST /api/policy/check` - Test policy with sample purchase
- `POST /api/policy/spending` - Get spending summary
