# JourniTag

A monorepo project with separate frontend and backend applications.

## Project Structure

```
JourniTag/
├── backend/           # Python Flask backend
│   ├── app/          # Application code
│   ├── bin/          # Executable scripts
│   ├── sql/          # Database schemas and data
│   └── requirements.txt
├── frontend/         # TypeScript React + Vite frontend
│   ├── src/          # Source code
│   ├── public/       # Static assets
│   └── package.json
├── run-backend.sh    # Script to run backend
└── run-frontend.sh   # Script to run frontend
```

## Getting Started

### Backend Setup

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```

2. Create a Python virtual environment:
   ```bash
   python3 -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

4. Create the database:
   ```bash
   ./bin/JourniTagDB create
   ```

5. Run the backend server:
   ```bash
   ./bin/JourniTagRun
   ```
   Or from the project root:
   ```bash
   ./run-backend.sh
   ```

   The backend will be available at `http://localhost:8000`

### Frontend Setup

1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```

2. Install dependencies (already done):
   ```bash
   npm install
   ```

3. Run the development server:
   ```bash
   npm run dev
   ```
   Or from the project root:
   ```bash
   ./run-frontend.sh
   ```

   The frontend will be available at `http://localhost:5173`

## Development

### Backend

- **Database management:**
  - Create: `cd backend && ./bin/JourniTagDB create`
  - Reset: `cd backend && ./bin/JourniTagDB reset`
  - Destroy: `cd backend && ./bin/JourniTagDB destroy`

### Frontend

- **Development:** `npm run dev`
- **Build:** `npm run build`
- **Preview:** `npm run preview`
- **Type check:** `npx tsc --noEmit`

## Running Both Services

To run the full stack application:

1. In one terminal, start the backend:
   ```bash
   ./run-backend.sh
   ```

2. In another terminal, start the frontend:
   ```bash
   ./run-frontend.sh
   ```
