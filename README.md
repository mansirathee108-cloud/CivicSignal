# CivicSignal frontend (prototype v2)

    npm install
    npm run dev

Demo logins: citizen@civic.com / password, admin@civic.com / password (or use the buttons on /login).

## Routes
Public: / , /report , /track?id=CS-2026-1048 , /about , /login , /signup
Admin (/admin): index (overview), complaints, complaints/:id, map, insights, departments, reports, settings

## Connecting the backend
All data goes through `src/services/api.js` (the only file that touches storage for complaints).
Replace each function body with a fetch/Supabase call returning the same shapes:
listComplaints, getComplaint, createComplaint, confirmClassification, assignDepartment, setStatus, addNote, mergeDuplicate, dismissDuplicate.
The AI call to replace is `classify()` in `src/utils/mockAI.js` (-> POST /api/ai/classify).
Auth is localStorage only (`src/utils/authStorage.js`) - swap for Supabase Auth.
Taxonomy/departments live in `src/data/taxonomy.js`. Seed data: `src/data/seed.js` (126 complaints, "Reset sample data" in Settings).

All AI outputs are simulated and labelled as prototype output.
