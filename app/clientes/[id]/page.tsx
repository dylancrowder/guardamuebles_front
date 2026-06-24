"use client"

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import { z } from "zod"
import { AppShell } from "@/components/app-shell"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { apiClient } from "@/lib/api-client"

const paymentSchema = z.object({
  amount: z.number().positive("El monto debe ser positivo"),
  date: z.string().min(1, "La fecha es requerida"),
  monthDate: z.string().min(1, "Debes seleccionar un mes"),
})

interface Month {
  date: Date
  monthKey: string
  displayText: string
  isPaid: boolean
  isOverdue: boolean
}

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
  const [openPaymentModal, setOpenPaymentModal] = useState(false)
  const [paymentLoading, setPaymentLoading] = useState(false)
  const [paymentError, setPaymentError] = useState<string | null>(null)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [months, setMonths] = useState<Month[]>([])

  useEffect(() => {
    const fetchClientData = async () => {
      try {
        setLoading(true)

        // Mock data
        const mockClient: Client = {
          _id: clientId,
          name: "movibox",
          whatsapp: "3434343434",
          entryDate: "2026-06-25T00:00:00.000+00:00",
          dueDate: "2026-07-25T00:00:00.000+00:00",
          amount: 89,
          observations: "nh",
          createdAt: "2026-06-24T16:53:54.462+00:00",
          updatedAt: "2026-06-24T16:53:54.462+00:00",
          __v: 0,
        }

        const mockPayments: Payment[] = [
          {
            _id: "1",
            clientId: clientId,
            amount: 89,
            date: "2026-06-25T10:00:00.000+00:00",
            createdAt: "2026-06-25T10:00:00.000+00:00",
          },
        ]

        setClient(mockClient)
        calculateMonths(mockClient)
        setPayments(mockPayments)
      } catch (err) {
        setError('Error al cargar los detalles del cliente')
        console.error(err)
      } finally {
        setLoading(false)
      }
    }

    fetchClientData()
  }, [clientId])

  const calculateMonths = (clientData: Client) => {
    const entryDate = new Date(clientData.entryDate)
    const today = new Date()
    const calculatedMonths: Month[] = []

    let currentDate = new Date(entryDate.getFullYear(), entryDate.getMonth(), 1)

    while (currentDate <= today) {
      const nextMonthStart = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1)
      const monthKey = currentDate.toISOString().split('T')[0]
      const displayText = currentDate.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })

      const isPaid = payments.some((p) => {
        const paymentDate = new Date(p.date)
        return paymentDate.getFullYear() === currentDate.getFullYear() &&
               paymentDate.getMonth() === currentDate.getMonth()
      })

      const isOverdue = currentDate < today

      calculatedMonths.push({
        date: currentDate,
        monthKey,
        displayText: displayText.charAt(0).toUpperCase() + displayText.slice(1),
        isPaid,
        isOverdue,
      })

      currentDate = nextMonthStart
    }

    setMonths(calculatedMonths)
  }

  useEffect(() => {
    if (client) {
      calculateMonths(client)
    }
  }, [payments])

  const handleSubmitPayment = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setPaymentError(null)
    setFieldErrors({})

    const formData = new FormData(e.currentTarget)
    const paymentData = {
      amount: formData.get('amount') ? parseFloat(formData.get('amount') as string) : 0,
      date: formData.get('date') as string,
      monthDate: formData.get('monthDate') as string,
    }

    const result = paymentSchema.safeParse(paymentData)

    if (!result.success) {
      const errors: Record<string, string> = {}
      result.error.issues.forEach((err) => {
        const field = err.path[0]
        if (typeof field === 'string') {
          errors[field] = err.message
        }
      })
      setFieldErrors(errors)
      return
    }

    setPaymentLoading(true)

    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500))

    // Mock successful response
    const mockNewPayment: Payment = {
      _id: Date.now().toString(),
      clientId: clientId,
      amount: result.data.amount,
      date: result.data.date,
      createdAt: new Date().toISOString(),
    }

    setPayments([...payments, mockNewPayment])
    setOpenPaymentModal(false)
    setPaymentLoading(false)
    e.currentTarget.reset()
  }

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
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-bold">Meses y Pagos</h3>
            <button
              onClick={() => setOpenPaymentModal(true)}
              className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
            >
              Agregar Pago
            </button>
          </div>
          {months.length > 0 ? (
            <div className="space-y-3">
              {months.map((month) => (
                <div key={month.monthKey} className={`p-4 rounded-lg border-2 flex justify-between items-center transition-all ${
                  month.isPaid
                    ? 'bg-green-50 border-green-300'
                    : month.isOverdue
                    ? 'bg-red-50 border-red-300'
                    : 'bg-blue-50 border-blue-300'
                }`}>
                  <div>
                    <p className="font-semibold text-gray-900">{month.displayText}</p>
                    <p className="text-sm text-gray-700 mt-1">${client?.amount.toLocaleString()}</p>
                  </div>
                  <div className="text-right">
                    {month.isPaid ? (
                      <span className="text-green-700 font-bold">✓ Pagado</span>
                    ) : month.isOverdue ? (
                      <span className="text-red-700 font-bold">⚠️ Vencido</span>
                    ) : (
                      <span className="text-blue-700 font-bold">◆ Pendiente</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-600">No hay meses calculados</p>
          )}
        </div>

        <div className="bg-white rounded-lg border p-6">
          <h3 className="text-xl font-bold mb-4">Historial de Pagos</h3>
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

        {openPaymentModal && (
          <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg shadow-xl p-6 max-w-md w-full">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Agregar Pago</h2>
              <p className="text-sm text-gray-600 mb-6">
                Ingresa los datos del pago para <strong>{client.name}</strong>.
              </p>
              <form onSubmit={handleSubmitPayment} className="space-y-4">
                <div>
                  <label htmlFor="monthDate" className="block text-sm font-semibold text-gray-800 mb-2">
                    Mes a Pagar
                  </label>
                  <select
                    id="monthDate"
                    name="monthDate"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent font-medium"
                  >
                    <option value="">Selecciona un mes</option>
                    {months.map((month) => (
                      <option key={month.monthKey} value={month.monthKey} disabled={month.isPaid}>
                        {month.displayText} {month.isPaid ? '(Pagado)' : ''}
                      </option>
                    ))}
                  </select>
                  {fieldErrors.monthDate && (
                    <p className="text-xs text-red-600 mt-1">{fieldErrors.monthDate}</p>
                  )}
                </div>
                <div>
                  <label htmlFor="amount" className="block text-sm font-semibold text-gray-800 mb-2">
                    Monto
                  </label>
                  <Input id="amount" name="amount" type="number" step="0.01" placeholder={`${client?.amount || 0}`} defaultValue={client?.amount || ''} className="bg-gray-50 border-gray-300" />
                  {fieldErrors.amount && (
                    <p className="text-xs text-red-600 mt-1">{fieldErrors.amount}</p>
                  )}
                </div>
                <div>
                  <label htmlFor="date" className="block text-sm font-semibold text-gray-800 mb-2">
                    Fecha del Pago
                  </label>
                  <Input id="date" name="date" type="date" className="bg-gray-50 border-gray-300" />
                  {fieldErrors.date && (
                    <p className="text-xs text-red-600 mt-1">{fieldErrors.date}</p>
                  )}
                </div>
                {paymentError && (
                  <div className="text-sm text-red-700 bg-red-50 p-3 rounded border border-red-200">
                    {paymentError}
                  </div>
                )}
                <div className="flex gap-2 justify-end pt-6">
                  <button
                    type="button"
                    onClick={() => setOpenPaymentModal(false)}
                    disabled={paymentLoading}
                    className="px-4 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors font-medium disabled:opacity-50"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={paymentLoading}
                    className="px-4 py-2 text-white bg-green-600 rounded-lg hover:bg-green-700 transition-colors font-medium disabled:opacity-50"
                  >
                    {paymentLoading ? 'Guardando...' : 'Guardar Pago'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        <div className="flex gap-2 pt-4">
          <a
            href="/clientes"
            className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors font-medium"
          >
            ← Volver a Clientes
          </a>
        </div>
      </div>
    </AppShell>
  )
}
