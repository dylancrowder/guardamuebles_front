import { useState, useCallback } from 'react'
import { apiClient, ApiResponse } from '@/lib/api-client'

interface UseApiState<T> {
  data: T | null
  loading: boolean
  error: string | null
}

export function useApi<T>() {
  const [state, setState] = useState<UseApiState<T>>({
    data: null,
    loading: false,
    error: null,
  })

  const execute = useCallback(
    async (
      method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH',
      endpoint: string,
      body?: unknown
    ) => {
      setState({ data: null, loading: true, error: null })

      let response: ApiResponse<T>

      switch (method) {
        case 'GET':
          response = await apiClient.get<T>(endpoint)
          break
        case 'POST':
          response = await apiClient.post<T>(endpoint, body)
          break
        case 'PUT':
          response = await apiClient.put<T>(endpoint, body)
          break
        case 'DELETE':
          response = await apiClient.delete<T>(endpoint)
          break
        case 'PATCH':
          response = await apiClient.patch<T>(endpoint, body)
          break
      }

      if (response.error) {
        setState({ data: null, loading: false, error: response.error })
        return { success: false, error: response.error }
      }

      setState({ data: response.data || null, loading: false, error: null })
      return { success: true, data: response.data }
    },
    []
  )

  return {
    ...state,
    get: (endpoint: string) => execute('GET', endpoint),
    post: (endpoint: string, body?: unknown) => execute('POST', endpoint, body),
    put: (endpoint: string, body?: unknown) => execute('PUT', endpoint, body),
    delete: (endpoint: string) => execute('DELETE', endpoint),
    patch: (endpoint: string, body?: unknown) => execute('PATCH', endpoint, body),
  }
}
