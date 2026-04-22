# Atelier — Frontend

React + Vite + TypeScript | Deployado en Vercel

---

## Correr localmente

**Requisitos:** Node.js 18+

```bash
npm install
cp .env.example .env.local   # Completar VITE_API_URL
npm run dev                  # Inicia en http://localhost:5173
```

---

## Estructura de branches

```
main        ← Producción. Vercel hace deploy automático desde acá.
  │
develop     ← Integración. Acá se prueban los cambios antes de producción.
  │
feature/X   ← Una branch por feature o fix.
```

### Reglas
- **`main`** — nunca commitear directo acá. Solo llegan PRs desde `develop`.
- **`develop`** — los cambios llegan vía PR desde `feature/*`.
- **`feature/<nombre>`** — se crea desde `develop` y se mergea de vuelta a `develop`.

---

## Flujo de trabajo para hacer un cambio

```bash
# 1. Actualizá develop
git checkout develop
git pull origin develop

# 2. Creá tu branch
git checkout -b feature/nombre-descriptivo

# 3. Hacé tus cambios y commiteá
git add -A
git commit -m "feat: descripción del cambio"

# 4. Pusheá la branch
git push origin feature/nombre-descriptivo

# 5. Abrí un PR en GitHub: feature/* → develop
# 6. Cuando develop está probado → PR: develop → main (dispara deploy)
```

### Convenciones de commits
| Prefijo | Cuándo usarlo |
|---------|---------------|
| `feat:` | Nueva funcionalidad |
| `fix:` | Corrección de bug |
| `chore:` | Tarea técnica (deps, config) |
| `docs:` | Solo documentación |
| `style:` | Cambios de UI/CSS sin lógica |
| `refactor:` | Cambio de código sin cambiar comportamiento |

---

## Variables de entorno

| Variable | Descripción |
|----------|-------------|
| `VITE_API_URL` | URL del backend en Vercel |

> ⚠️ Las variables `VITE_*` se hornean en el bundle al buildear. Si las cambiás en Vercel, hacé un nuevo deploy.

---

## URLs

| Ambiente | URL |
|----------|-----|
| Producción | https://atelier-frontend-nine.vercel.app |
| Backend | https://atelier-backend-git-deploy-juanngzs-projects.vercel.app |

Ver documentación técnica completa en [atelier-backend/DOCUMENTACION.md](https://github.com/juanngz/atelier-backend/blob/main/DOCUMENTACION.md).
