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
API: http://localhost:3000

### Frontend
```bash
cd ../frontend
cp .env.example .env
npm install
npm run dev
```
Web: http://localhost:5173
