# AcademiQ Full Stack (a la medida)

## Requisitos
- Node.js 18/20 (recomendado 20)
- (Opcional) Docker

## Levantar SIN Docker
### Backend
```bash
cd backend
cp .env.example .env
npm install
npm run db:setup
npm run dev
```
API: http://localhost:4000

### Frontend
```bash
cd ../frontend
cp .env.example .env
npm install
npm run dev
```
Web: http://localhost:5173

## Credenciales demo
- Admin: admin@academiq.edu / admin2026
- Teacher: ana.garcia@academiq.edu / Ana2026
- Student: valentina.perez / Valentina2026
