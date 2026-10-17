"use client"

import { useState } from "react"
import { DatabaseBackup, Download } from "lucide-react"
import { AppShell } from "@/components/app-shell"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { apiClient } from "@/lib/api-client"

type BackupRecord = Record<string, unknown>

function asRecords(value: unknown): BackupRecord[] | null {
  if (
    !Array.isArray(value) ||
    !value.every((item) => Boolean(item) && typeof item === "object" && !Array.isArray(item))
  ) {
    return null
  }
  return value as BackupRecord[]
}

function getClients(value: unknown): BackupRecord[] | null {
  const directClients = asRecords(value)
  if (directClients) return directClients

  if (value && typeof value === "object" && "clients" in value) {
    return asRecords(value.clients)
  }

  return null
}

function getPaymentCount(value: unknown) {
  if (Array.isArray(value)) return value.length
  if (value && typeof value === "object" && "payments" in value && Array.isArray(value.payments)) {
    return value.payments.length
  }
  return 0
}

export default function ConfiguracionPage() {
  const [isExporting, setIsExporting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  async function downloadBackup() {
    setIsExporting(true)
    setError(null)
    setSuccess(null)

    try {
      const [clientsResponse, tripsResponse, financeResponse] = await Promise.all([
        apiClient.get<unknown>("/api/clients/getAllInfo"),
        apiClient.get<unknown>("/api/ventas"),
        apiClient.get<unknown>("/api/finanzas"),
      ])

      const clients = clientsResponse.status === 404 && !clientsResponse.data
        ? []
        : getClients(clientsResponse.data)
      const trips = asRecords(tripsResponse.data)
      const financeEntries = asRecords(financeResponse.data)

      if (clientsResponse.error && !(clientsResponse.status === 404 && !clientsResponse.data)) {
        throw new Error(`No se pudieron obtener los clientes: ${clientsResponse.error}`)
      }
      if (tripsResponse.error) {
        throw new Error(`No se pudieron obtener los viajes: ${tripsResponse.error}`)
      }
      if (financeResponse.error) {
        throw new Error(`No se pudieron obtener las finanzas: ${financeResponse.error}`)
      }
      if (!clients || !trips || !financeEntries) {
        throw new Error("La API devolvió un formato inesperado. No se descargó el respaldo.")
      }

      const clientRecords = await Promise.all(clients.map(async (client) => {
        const clientId = client._id ?? client.id
        if (typeof clientId !== "string" || !clientId) {
          throw new Error("Hay un cliente sin identificador y no se pudo respaldar su información completa.")
        }

        const [detailsResponse, paymentsResponse] = await Promise.all([
          apiClient.get<unknown>(`/api/payments/getPaymentInfo/${encodeURIComponent(clientId)}`),
          apiClient.get<unknown>(`/api/payments/getPayments/${encodeURIComponent(clientId)}`),
        ])
        if (detailsResponse.error) {
          throw new Error(`No se pudo obtener la cuenta de ${String(client.name ?? clientId)}: ${detailsResponse.error}`)
        }
        if (paymentsResponse.error) {
          throw new Error(`No se pudieron obtener los pagos de ${String(client.name ?? clientId)}: ${paymentsResponse.error}`)
        }

        return {
          clientId,
          clientName: client.name ?? "",
          accountDetails: detailsResponse.data,
          paymentRecords: paymentsResponse.data,
        }
      }))

      const backup = {
        application: "Sistema de Gestión",
        generatedAt: new Date().toISOString(),
        guardamuebles: {
          clients: clientsResponse.data ?? [],
          clientRecords,
        },
        viajes: tripsResponse.data,
        finanzas: financeResponse.data,
      }
      const blob = new Blob([JSON.stringify(backup, null, 2)], { type: "application/json" })
      const downloadUrl = URL.createObjectURL(blob)
      const link = document.createElement("a")
      const date = new Date().toISOString().slice(0, 10)
      link.href = downloadUrl
      link.download = `respaldo-guardamuebles-${date}.json`
      link.click()
      URL.revokeObjectURL(downloadUrl)

      const paymentCount = clientRecords.reduce((total, item) => total + getPaymentCount(item.paymentRecords), 0)
      setSuccess(`Respaldo descargado: ${clients.length} clientes, ${paymentCount} pagos, ${trips.length} viajes y ${financeEntries.length} movimientos.`)
    } catch (backupError) {
      setError(backupError instanceof Error ? backupError.message : "No se pudo generar el respaldo.")
    } finally {
      setIsExporting(false)
    }
  }

  return (
    <AppShell title="Respaldo de datos">
      <div className="mx-auto w-full max-w-3xl">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DatabaseBackup className="h-5 w-5" />
              Respaldo completo
            </CardTitle>
            <CardDescription>
              Descarga en un solo archivo JSON los clientes, sus pagos, los viajes y los movimientos financieros.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button onClick={downloadBackup} disabled={isExporting} className="gap-2">
              <Download className="h-4 w-4" />
              {isExporting ? "Preparando respaldo..." : "Descargar todos los datos"}
            </Button>
            {error && <p role="alert" className="text-sm text-red-600">{error}</p>}
            {success && <p role="status" className="text-sm text-emerald-600">{success}</p>}
          </CardContent>
        </Card>
      </div>
    </AppShell>
  )
}
