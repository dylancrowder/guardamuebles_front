# Instrucciones para crear los endpoints de finanzas

## Objetivo
Crear una API REST para manejar movimientos financieros del negocio, con ingresos y egresos, categorías, historial y resúmenes mensuales.

## Entidad principal
Movimiento financiero

```json
{
  "id": "string",
  "type": "ingreso | egreso",
  "category": "guardamuebles | viaje | varios | empleados | combustible | gastos varios | materiales | publicidad",
  "amount": 2500,
  "date": "2026-10-09",
  "description": "Pago de reserva de guardamuebles",
  "createdAt": 1760000000000
}
```

### Reglas
- `type` es obligatorio.
- `amount` debe ser número positivo mayor a 0.
- `date` debe venir en formato ISO `YYYY-MM-DD`.
- `description` es opcional, si viene vacío guardar `""`.
- `category` depende del tipo:
  - ingresos: `guardamuebles`, `viaje`, `varios`
  - egresos: `empleados`, `combustible`, `gastos varios`, `materiales`, `publicidad`
- `createdAt` es timestamp de creación.

## Endpoints requeridos

### 1) Obtener todos los movimientos
GET `/api/finanzas`

Respuesta:

```json
[
  {
    "id": "1",
    "type": "ingreso",
    "category": "guardamuebles",
    "amount": 15000,
    "date": "2026-10-05",
    "description": "Cobro de alquiler",
    "createdAt": 1760000000000
  }
]
```

### 2) Crear un movimiento
POST `/api/finanzas`

Body:

```json
{
  "type": "egreso",
  "category": "combustible",
  "amount": 3200,
  "date": "2026-10-09",
  "description": "Nafta del viaje"
}
```

Respuesta esperada:

```json
{
  "id": "nuevo-id",
  "type": "egreso",
  "category": "combustible",
  "amount": 3200,
  "date": "2026-10-09",
  "description": "Nafta del viaje",
  "createdAt": 1760000000000
}
```

### 3) Actualizar un movimiento
PUT `/api/finanzas/:id`

Body: mismo formato que POST, pero con campos actuales.

Respuesta: el movimiento actualizado.

### 4) Eliminar un movimiento
DELETE `/api/finanzas/:id`

Respuesta esperada:

```json
{
  "success": true,
  "id": "xxx"
}
```

## Resúmenes necesarios

### 5) Resumen general
GET `/api/finanzas/resumen`

Debe devolver:

```json
{
  "ingresos": 65000,
  "egresos": 23000,
  "total": 42000
}
```

### 6) Resumen mensual
GET `/api/finanzas/resumen?month=2026-10`

Respuesta esperada:

```json
{
  "month": "2026-10",
  "ingresos": 65000,
  "egresos": 23000,
  "total": 42000
}
```

### 7) Resumen por categoría
GET `/api/finanzas/categorias?month=2026-10`

Respuesta:

```json
[
  { "category": "guardamuebles", "total": 40000 },
  { "category": "viaje", "total": 25000 },
  { "category": "empleados", "total": 15000 },
  { "category": "combustible", "total": 8000 }
]
```

## Recomendación de validación
- No permitir `type=ingreso` con categoría de egreso.
- No permitir `type=egreso` con categoría de ingreso.
- Validar que `amount` sea numérico y positivo.
- Validar `date` y `createdAt`.
- En caso de error, responder con status HTTP correcto:
  - 400: datos inválidos
  - 404: movimiento no encontrado
  - 500: error interno

## Ejemplo de estructura de respuesta de error

```json
{
  "message": "El monto debe ser mayor a 0"
}
```

## Consideraciones para el frontend
El frontend ya espera este formato:

- `type` = `ingreso` o `egreso`
- `category` = categoría actual según el tipo
- `amount` = número
- `date` = `YYYY-MM-DD`
- `description` = string opcional

No agregar campos extras que el frontend no use, salvo que sea necesario para el backend.

## Importante
Si el backend usa base de datos, las tablas recomendadas son:
- `finance_movements` con campos: `id`, `type`, `category`, `amount`, `date`, `description`, `created_at`

No inventar más endpoints de los necesarios.
Solo implementar los que el frontend requiere para esta funcionalidad.
