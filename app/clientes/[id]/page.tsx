"use client"

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import { AppShell } from "@/components/app-shell"
import { Button } from "@/components/ui/button"
import { apiClient } from "@/lib/api-client"

interface Payment {
  _id: string
  clientId: string
  amount: number
  date: string
  createdAt: string
}

interface Client {
  _id: string
  name: string
  whatsapp: string
  entryDate: string
  dueDate: string
  amount: number
  observations: string
  createdAt: string
  updatedAt: string
  __v: number
}

export default function ClientDetailsPage() {
  const params = useParams()
  const clientId = params.id as string
  const [client, setClient] = useState<Client | null>(null)
  const [payments, setPayments] = useState<Payment[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchClientData = async () => {
      try {
        setLoading(true)
        const response = await apiClient.get(`/getClient/${clientId}`)
        if (response.error) {
          setError(response.error)
        } else {
          setClient(response.data)
        }

        const paymentsResponse = await apiClient.get(`/getPayments/${clientId}`)
        if (!paymentsResponse.error) {
          setPayments(paymentsResponse.data || [])
        }
      } catch (err) {
        setError('Error al cargar los detalles del cliente')
        console.error(err)
      } finally {
        setLoading(false)
      }
    }

    fetchClientData()
  }, [clientId])

  if (loading) {
    return (
      <AppShell title="Detalles del Cliente">
        <div className="flex justify-center items-center h-64">
          <p className="text-gray-600">Cargando detalles...</p>
        </div>
      </AppShell>
    )
  }

  if (error || !client) {
    return (
      <AppShell title="Detalles del Cliente">
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <p className="text-red-600">Error: {error || 'Cliente no encontrado'}</p>
        </div>
      </AppShell>
    )
  }

  const dueDate = new Date(client.dueDate)
  const today = new Date()
  const monthsDue = Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24 * 30))
  const isOverdue = monthsDue < 0
  const totalPaid = payments.reduce((sum, payment) => sum + payment.amount, 0)
  const remainingAmount = client.amount - totalPaid

  return (
    <AppShell title={`${client.name} - Detalles`}>
      <div className="space-y-6">
        <div className="bg-white rounded-lg border p-6">
          <h2 className="text-2xl font-bold mb-4">{client.name}</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-600">WhatsApp</p>
              <p className="text-lg font-medium">{client.whatsapp}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Monto Total</p>
              <p className="text-lg font-medium">${client.amount.toLocaleString()}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Fecha de Entrada</p>
              <p className="text-lg font-medium">{new Date(client.entryDate).toLocaleDateString()}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Fecha de Vencimiento</p>
              <p className="text-lg font-medium">{new Date(client.dueDate).toLocaleDateString()}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Total Pagado</p>
              <p className="text-lg font-medium text-green-600">${totalPaid.toLocaleString()}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Monto Restante</p>
              <p className={`text-lg font-medium ${remainingAmount > 0 ? 'text-red-600' : 'text-green-600'}`}>
                ${remainingAmount.toLocaleString()}
              </p>
            </div>
          </div>
          {client.observations && (
            <div className="mt-4 pt-4 border-t">
              <p className="text-sm text-gray-600">Observaciones</p>
              <p className="text-gray-800">{client.observations}</p>
            </div>
          )}
        </div>

        <div className="bg-white rounded-lg border p-6">
          <h3 className="text-xl font-bold mb-4">Estado de Vencimiento</h3>
          <div className={`p-4 rounded-md ${isOverdue ? 'bg-red-50 border border-red-200' : 'bg-blue-50 border border-blue-200'}`}>
            {isOverdue ? (
              <p className="text-red-700 font-semibold">
                ⚠️ Vencido hace {Math.abs(monthsDue)} mes(es)
              </p>
            ) : (
              <p className="text-blue-700 font-semibold">
                ✓ Vence en {monthsDue} mes(es)
              </p>
            )}
          </div>
        </div>

        <div className="bg-white rounded-lg border p-6">
          <h3 className="text-xl font-bold mb-4">Últimos Pagos</h3>
          {payments.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2 px-2">Fecha</th>
                    <th className="text-left py-2 px-2">Monto</th>
                  </tr>
                </thead>
                <tbody>
                  {payments.map((payment) => (
                    <tr key={payment._id} className="border-b hover:bg-gray-50">
                      <td className="py-2 px-2">{new Date(payment.date).toLocaleDateString()}</td>
                      <td className="py-2 px-2 font-medium text-green-600">${payment.amount.toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-gray-600">No hay pagos registrados</p>
          )}
        </div>

        <div className="flex gap-2">
          <a
            href="/clientes"
            className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors"
          >
            Volver a Clientes
          </a>
        </div>
      </div>
    </AppShell>
  )
}
