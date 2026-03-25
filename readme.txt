ARQUITECTURA DEL FRONTEND — GestionLocal
==========================================

Descripción General
-------------------
Aplicación web construida con React + Vite + TypeScript + TailwindCSS.
Se comunica con el backend a través de un proxy en Vite (/api → localhost:4000).
Puerto por defecto: 3000


Estructura de Carpetas
-----------------------
GestionLocal-FrontEnd/
├── public/                 → Archivos estáticos
├── src/
│   ├── main.tsx            → Punto de entrada de React
│   ├── App.tsx             → Layout principal con navegación lateral y routing
│   ├── types.ts            → Interfaces TypeScript compartidas (Product, Transaction, etc.)
│   ├── constants.ts        → Datos estáticos de ejemplo (ya no se usan para las tabs principales)
│   └── pages/
│       ├── Dashboard.tsx   → Panel principal: métricas del día, gráfico de ventas, transacciones recientes
│       ├── Inventory.tsx   → Gestión de inventario: listado, crear producto, modificar, eliminar, agregar stock
│       └── Sales.tsx       → Registro de ventas: formulario de venta, métricas, historial de transacciones
├── index.html              → HTML base
├── vite.config.ts          → Configuración de Vite + proxy a la API
├── package.json
└── tsconfig.json


Páginas y Funcionalidades
--------------------------

Dashboard (/)
  - Ingresos del día, transacciones de hoy, total de productos
  - Gráfico de barras con ventas de los últimos 7 días (Recharts)
  - Últimas 5 transacciones
  - Se nutre del endpoint GET /api/dashboard

Inventory (/inventory)
  - Listado de productos con nombre, categoría, precio y stock
  - Botón "Add New Stock" abre modal con dos modos:
    • Seleccionar producto existente → agregar cantidad al stock
    • "Crear nuevo producto" → formulario completo (nombre, precio, categoría, imagen, stock inicial)
  - Botón "Modify" en cada producto → modal para editar todos los campos o eliminar el producto
  - Se nutre de GET/POST/PUT/DELETE /api/products

Sales (/sales)
  - Formulario para registrar ventas (seleccionar producto, cantidad, cliente)
  - Métricas en tiempo real: ventas del día, ticket promedio, total transacciones
  - Historial de transacciones con estado (PAID, REFUNDED, PENDING)
  - Se nutre de GET/POST /api/sales y GET /api/sales/stats


Cómo Ejecutar
--------------
1. Instalar dependencias:  npm install
2. Iniciar dev server:     npm run dev
3. Asegurarse de que el backend esté corriendo en el puerto 4000

Proxy
------
Vite está configurado para redirigir todas las peticiones /api/* al backend:
  /api/* → http://localhost:4000/api/*

Dependencias Principales
--------------------------
- react / react-dom   → Librería UI
- vite                → Build tool y dev server
- tailwindcss         → Estilos utilitarios
- lucide-react        → Iconografía
- recharts            → Gráficos (Dashboard)
