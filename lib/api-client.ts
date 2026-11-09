import { API_BASE_URL } from './api-config'

export interface ApiResponse<T> {
  data?: T
  error?: string
  status: number
}

export interface ApiError {
  message: string
  status: number
}

function getErrorMessage(value: unknown): string | undefined {
  if (typeof value === 'string' && value.trim()) {
    return value
  }

  if (value && typeof value === 'object') {
    const errorData = value as Record<string, unknown>
    return getErrorMessage(errorData.message) ??
      getErrorMessage(errorData.error) ??
      getErrorMessage(errorData.details)
  }

  return undefined
}

class ApiClient {
  private baseURL: string

  constructor(baseURL: string) {
    this.baseURL = baseURL
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const url = `${this.baseURL}${endpoint}`

    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          ...(options.body instanceof FormData ? {} : { 'Content-Type': 'application/json' }),
          ...options.headers,
        },
      })

      const responseText = await response.text()
      let data: unknown
      try {
        data = responseText ? JSON.parse(responseText) : undefined
      } catch {
        data = undefined
      }

      if (!response.ok) {
        return {
          error: getErrorMessage(data) || 'Error en la petición',
          status: response.status,
        }
      }

      return {
        data: data as T | undefined,
        status: response.status,
      }
    } catch (error) {
      return {
        error: error instanceof Error ? error.message : 'Error desconocido',
        status: 500,
      }
    }
  }

  async get<T>(endpoint: string): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'GET',
    })
  }

  async post<T>(endpoint: string, body?: unknown): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: body ? JSON.stringify(body) : undefined,
    })
  }

  async upload<T>(endpoint: string, body: FormData): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: 'POST', body })
  }

  async put<T>(endpoint: string, body?: unknown): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: body ? JSON.stringify(body) : undefined,
    })
  }

  async delete<T>(endpoint: string): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'DELETE',
    })
  }

  async patch<T>(endpoint: string, body?: unknown): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'PATCH',
      body: body ? JSON.stringify(body) : undefined,
    })
  }
}

export const apiClient = new ApiClient(API_BASE_URL)
