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
        const response = await apiClient.get(`/getClient/${clientId}`)
        if (response.error) {
          setError(response.error)
        } else {
          setClient(response.data)
          calculateMonths(response.data)
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
    const response = await apiClient.post(`/addPayment/${clientId}`, result.data)

    if (response.error) {
      setPaymentError(response.error)
      setPaymentLoading(false)
      return
    }

    setPayments([...payments, response.data])
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
        <div className="bg-red-950 border border-red-700 rounded-md p-4">
          <p className="text-red-400">Error: {error || 'Cliente no encontrado'}</p>
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
        <div className="bg-gray-900 rounded-lg border border-gray-700 p-6">
          <h2 className="text-2xl font-bold text-white mb-4">{client.name}</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-400">WhatsApp</p>
              <p className="text-lg font-medium text-white">{client.whatsapp}</p>
            </div>
            <div>
              <p className="text-sm text-gray-400">Monto Total</p>
              <p className="text-lg font-medium text-white">${client.amount.toLocaleString()}</p>
            </div>
            <div>
              <p className="text-sm text-gray-400">Fecha de Entrada</p>
              <p className="text-lg font-medium text-white">{new Date(client.entryDate).toLocaleDateString()}</p>
            </div>
            <div>
              <p className="text-sm text-gray-400">Fecha de Vencimiento</p>
              <p className="text-lg font-medium text-white">{new Date(client.dueDate).toLocaleDateString()}</p>
            </div>
            <div>
              <p className="text-sm text-gray-400">Total Pagado</p>
              <p className="text-lg font-medium text-green-400">${totalPaid.toLocaleString()}</p>
            </div>
            <div>
              <p className="text-sm text-gray-400">Monto Restante</p>
              <p className={`text-lg font-medium ${remainingAmount > 0 ? 'text-red-400' : 'text-green-400'}`}>
                ${remainingAmount.toLocaleString()}
              </p>
            </div>
          </div>
          {client.observations && (
            <div className="mt-4 pt-4 border-t border-gray-700">
              <p className="text-sm text-gray-400">Observaciones</p>
              <p className="text-gray-300">{client.observations}</p>
            </div>
          )}
        </div>

        <div className="bg-gray-900 rounded-lg border border-gray-700 p-6">
          <h3 className="text-xl font-bold text-white mb-4">Estado de Vencimiento</h3>
          <div className={`p-4 rounded-md ${isOverdue ? 'bg-red-950 border border-red-700' : 'bg-blue-950 border border-blue-700'}`}>
            {isOverdue ? (
              <p className="text-red-400 font-semibold">
                ⚠️ Vencido hace {Math.abs(monthsDue)} mes(es)
              </p>
            ) : (
              <p className="text-blue-400 font-semibold">
                ✓ Vence en {monthsDue} mes(es)
              </p>
            )}
          </div>
        </div>

        <div className="bg-gray-900 rounded-lg border border-gray-700 p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-bold text-white">Meses y Pagos</h3>
            <button
              onClick={() => setOpenPaymentModal(true)}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
            >
              Agregar Pago
            </button>
          </div>
          {months.length > 0 ? (
            <div className="space-y-3">
              {months.map((month) => (
                <div key={month.monthKey} className={`p-4 rounded-lg border-2 flex justify-between items-center transition-all ${
                  month.isPaid
                    ? 'bg-green-950 border-green-700'
                    : month.isOverdue
                    ? 'bg-red-950 border-red-700'
                    : 'bg-blue-950 border-blue-700'
                }`}>
                  <div>
                    <p className="font-semibold text-white">{month.displayText}</p>
                    <p className="text-sm text-gray-300 mt-1">${client?.amount.toLocaleString()}</p>
                  </div>
                  <div className="text-right">
                    {month.isPaid ? (
                      <span className="text-green-400 font-bold">✓ Pagado</span>
                    ) : month.isOverdue ? (
                      <span className="text-red-400 font-bold">⚠️ Vencido</span>
                    ) : (
                      <span className="text-blue-400 font-bold">◆ Pendiente</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-400">No hay meses calculados</p>
          )}
        </div>

        <div className="bg-gray-900 rounded-lg border border-gray-700 p-6">
          <h3 className="text-xl font-bold text-white mb-4">Historial de Pagos</h3>
          {payments.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-700">
                    <th className="text-left py-2 px-2 text-gray-300">Fecha</th>
                    <th className="text-left py-2 px-2 text-gray-300">Monto</th>
                  </tr>
                </thead>
                <tbody>
                  {payments.map((payment) => (
                    <tr key={payment._id} className="border-b border-gray-700 hover:bg-gray-800">
                      <td className="py-2 px-2 text-gray-200">{new Date(payment.date).toLocaleDateString()}</td>
                      <td className="py-2 px-2 font-medium text-green-400">${payment.amount.toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-gray-400">No hay pagos registrados</p>
          )}
        </div>

        {openPaymentModal && (
          <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
            <div className="bg-gray-900 rounded-lg shadow-xl p-6 max-w-md w-full border border-gray-700">
              <h2 className="text-2xl font-bold text-white mb-2">Agregar Pago</h2>
              <p className="text-sm text-gray-400 mb-6">
                Ingresa los datos del pago para <strong className="text-white">{client.name}</strong>.
              </p>
              <form onSubmit={handleSubmitPayment} className="space-y-4">
                <div>
                  <label htmlFor="monthDate" className="block text-sm font-semibold text-gray-200 mb-2">
                    Mes a Pagar
                  </label>
                  <select
                    id="monthDate"
                    name="monthDate"
                    className="w-full px-3 py-2 border border-gray-600 rounded-lg bg-gray-800 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent font-medium"
                  >
                    <option value="">Selecciona un mes</option>
                    {months.map((month) => (
                      <option key={month.monthKey} value={month.monthKey} disabled={month.isPaid}>
                        {month.displayText} {month.isPaid ? '(Pagado)' : ''}
                      </option>
                    ))}
                  </select>
                  {fieldErrors.monthDate && (
                    <p className="text-xs text-red-400 mt-1">{fieldErrors.monthDate}</p>
                  )}
                </div>
                <div>
                  <label htmlFor="amount" className="block text-sm font-semibold text-gray-200 mb-2">
                    Monto
                  </label>
                  <Input id="amount" name="amount" type="number" step="0.01" placeholder={`${client?.amount || 0}`} defaultValue={client?.amount || ''} className="bg-gray-800 border-gray-600 text-white" />
                  {fieldErrors.amount && (
                    <p className="text-xs text-red-400 mt-1">{fieldErrors.amount}</p>
                  )}
                </div>
                <div>
                  <label htmlFor="date" className="block text-sm font-semibold text-gray-200 mb-2">
                    Fecha del Pago
                  </label>
                  <Input id="date" name="date" type="date" className="bg-gray-800 border-gray-600 text-white" />
                  {fieldErrors.date && (
                    <p className="text-xs text-red-400 mt-1">{fieldErrors.date}</p>
                  )}
                </div>
                {paymentError && (
                  <div className="text-sm text-red-400 bg-red-950 p-3 rounded border border-red-700">
                    {paymentError}
                  </div>
                )}
                <div className="flex gap-2 justify-end pt-6">
                  <button
                    type="button"
                    onClick={() => setOpenPaymentModal(false)}
                    disabled={paymentLoading}
                    className="px-4 py-2 text-gray-200 bg-gray-700 rounded-lg hover:bg-gray-600 transition-colors font-medium disabled:opacity-50"
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
