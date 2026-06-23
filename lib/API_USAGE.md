# Guía de uso del Cliente API

## Configuración

El cliente API está centralizado en `lib/api-client.ts` y configurado en `lib/api-config.ts`.

### Variables de entorno
En tu `.env.local`:
```
NEXT_PUBLIC_API_URL=http://localhost:3000/api
```

## Uso básico

### Opción 1: Usar `apiClient` directamente (Client Components)

```typescript
import { apiClient } from '@/lib/api-client'

interface User {
  id: string
  name: string
}

// GET
const response = await apiClient.get<User[]>('/users')
if (response.error) {
  console.error(response.error)
} else {
  console.log(response.data)
}

// POST
const createResponse = await apiClient.post<User>('/users', {
  name: 'Juan',
  email: 'juan@example.com',
})

// PUT
const updateResponse = await apiClient.put<User>('/users/1', {
  name: 'Juan Updated',
})

// DELETE
const deleteResponse = await apiClient.delete<void>('/users/1')
```

### Opción 2: Usar el hook `useApi` (Client Components)

```typescript
import { useApi } from '@/hooks/use-api'

export function MyComponent() {
  const api = useApi<User[]>()

  const handleFetch = async () => {
    const result = await api.get('/users')
    if (result.success) {
      console.log(result.data)
    }
  }

  return (
    <>
      <button onClick={handleFetch} disabled={api.loading}>
        {api.loading ? 'Cargando...' : 'Cargar usuarios'}
      </button>
      {api.error && <p>{api.error}</p>}
      {api.data && <pre>{JSON.stringify(api.data)}</pre>}
    </>
  )
}
```

### Opción 3: En Server Components

```typescript
import { apiClient } from '@/lib/api-client'

export default async function Page() {
  const response = await apiClient.get<User[]>('/users')

  if (response.error) {
    return <div>Error: {response.error}</div>
  }

  return <div>{/* Renderizar datos */}</div>
}
```

## Métodos disponibles

- `apiClient.get<T>(endpoint)` - GET request
- `apiClient.post<T>(endpoint, body)` - POST request
- `apiClient.put<T>(endpoint, body)` - PUT request
- `apiClient.delete<T>(endpoint)` - DELETE request
- `apiClient.patch<T>(endpoint, body)` - PATCH request

Todos retornan: `Promise<ApiResponse<T>>`

## Estructura de respuesta

```typescript
interface ApiResponse<T> {
  data?: T        // Los datos retornados por la API
  error?: string  // Mensaje de error (si existe)
  status: number  // Código HTTP
}
```

## Ejemplo: Crear un cliente específico (Recomendado para proyectos grandes)

```typescript
// lib/api/clients.ts
import { apiClient } from '@/lib/api-client'

export interface Client {
  id: string
  name: string
  whatsapp: string
  amount: number
}

export const clientsApi = {
  getAll: () => apiClient.get<Client[]>('/clients'),
  getById: (id: string) => apiClient.get<Client>(`/clients/${id}`),
  create: (data: Omit<Client, 'id'>) => apiClient.post<Client>('/clients', data),
  update: (id: string, data: Partial<Client>) => 
    apiClient.put<Client>(`/clients/${id}`, data),
  delete: (id: string) => apiClient.delete<void>(`/clients/${id}`),
}
```

Uso en componente:
```typescript
import { clientsApi } from '@/lib/api/clients'

const response = await clientsApi.create({
  name: 'Juan',
  whatsapp: '1234567890',
  amount: 100,
})
```
