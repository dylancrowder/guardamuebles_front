"use client";

import { AppShell } from "@/components/app-shell";
import { useEffect, useState } from "react";
import { apiClient } from "@/lib/api-client";
import { useParams } from "next/navigation";
import { z } from "zod";

interface Client {
  _id: string;
  name: string;
  whatsapp: string;
  entryDate: string;
  amount: number;
  observations: string;
  createdAt: string;
  updatedAt: string;
  __v: number;
}

type AccountStatus = "CURRENT" | "PENDING" | "OVERDUE";

interface Account {
  status: AccountStatus;
  lastPaidPeriod: string | null;
  nextDuePeriod: string;
  nextDueDate: string;
  daysRemaining: number;
  daysOverdue: number;
  monthsOwed: number;
  totalDebt: number;
  pendingPeriods: string[];
}

type PaymentStatus = "PAID" | "PENDING";

interface PaymentHistory {
  period: string;
  status: PaymentStatus;
  paymentDate: string | null;
  amount: number;
}

interface ClientPaymentDetailResponse {
  client: Client;
  account: Account;
  history: PaymentHistory[];
}

function PaymentCard({
  payment,
  clientId,
  clientAmount,
  onPaymentSuccess,
}: {
  payment: PaymentHistory;
  clientId: string;
  clientAmount: number;
  onPaymentSuccess?: () => void;
}) {
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handlePayment = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const paymentData = {
      amount: clientAmount,
      period: payment.period,
      paymentDate: new Date().toISOString(),
      description: formData.get("description") as string,
    };

    try {
      const response = await apiClient.post(
        `/api/payments/${clientId}`,
        paymentData
      );

      if (response.error) {
        setError(response.error);
      } else {
        setShowPaymentForm(false);
        if (onPaymentSuccess) {
          onPaymentSuccess();
        }
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Error al procesar el pago"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="border rounded-lg p-4 mb-4 shadow-sm">
        <p>
          <strong>Período:</strong> {payment.period}
        </p>

        <p>
          <strong>Estado:</strong>{" "}
          <span
            className={`font-semibold ${
              payment.status === "PAID" ? "text-green-600" : "text-red-600"
            }`}
          >
            {payment.status === "PAID" ? "Pagado" : "Pendiente"}
          </span>
        </p>

        {payment.status === "PAID" && (
          <p>
            <strong>Fecha de pago:</strong>{" "}
            {payment.paymentDate
              ? new Date(payment.paymentDate).toLocaleDateString("es-AR")
              : "-"}
          </p>
        )}

        <p>
          <strong>Monto:</strong> $
          {payment.amount.toLocaleString("es-AR")}
        </p>

        {payment.status === "PENDING" && (
          <button
            onClick={() => setShowPaymentForm(true)}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            Pagar
          </button>
        )}
      </div>

      {showPaymentForm && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
          <div className="bg-gray-900 rounded-lg shadow-xl p-6 max-w-md w-full border border-gray-700">
            <h3 className="text-xl font-bold text-white mb-4">
              Pagar período {payment.period}
            </h3>
            <form onSubmit={handlePayment} className="space-y-4">
              <div>
                <label
                  htmlFor="amount"
                  className="block text-sm font-semibold text-gray-200 mb-2"
                >
                  Monto
                </label>
                <div className="bg-gray-800 border border-gray-600 rounded-lg px-4 py-2 text-white">
                  ${clientAmount.toLocaleString("es-AR")}
                </div>
              </div>
              <div>
                <label
                  htmlFor="period"
                  className="block text-sm font-semibold text-gray-200 mb-2"
                >
                  Período
                </label>
                <div className="bg-gray-800 border border-gray-600 rounded-lg px-4 py-2 text-white">
                  {payment.period}
                </div>
              </div>
              <div>
                <label
                  htmlFor="description"
                  className="block text-sm font-semibold text-gray-200 mb-2"
                >
                  Descripción
                </label>
                <input
                  id="description"
                  name="description"
                  placeholder="Ej: Pago mensual de junio 2026"
                  className="w-full bg-gray-800 border border-gray-600 rounded-lg px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
                  defaultValue={`Pago mensual de ${payment.period}`}
                />
              </div>
              {error && (
                <div className="text-sm text-red-400 bg-red-950 p-3 rounded border border-red-700">
                  {error}
                </div>
              )}
              <div className="flex gap-2 justify-end pt-4">
                <button
                  type="button"
                  onClick={() => setShowPaymentForm(false)}
                  disabled={loading}
                  className="px-4 py-2 text-gray-200 bg-gray-700 rounded-lg hover:bg-gray-600 transition-colors font-medium disabled:opacity-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50"
                >
                  {loading ? "Procesando..." : "Confirmar pago"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

export default function ClientDetailsPage() {
  const params = useParams();
  const id = params.id;

  const [client, setClient] = useState<ClientPaymentDetailResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchClient = async () => {
    try {
      setLoading(true);

      const response = await apiClient.get(
        `/api/payments/getPaymentInfo/${id}`
      );

      if (response.error) {
        setError(response.error);
      } else {
        setClient(response.data as ClientPaymentDetailResponse);
      }
    } catch (err) {
      console.error(err);
      setError("Error al cargar el cliente");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) {
      fetchClient();
    }
  }, [id]);

  const pendingPayments =
    client?.history.filter((payment) => payment.status === "PENDING") ?? [];

  const paidPayments =
    client?.history.filter((payment) => payment.status === "PAID") ?? [];

  return (
    <AppShell title="Detalle del Cliente">
      {loading && <p>Cargando...</p>}

      {error && <p className="text-red-600">{error}</p>}

      {!loading && !error && client && (
        <div className="space-y-8">
          {/* Información del cliente */}
          <div className="border rounded-lg p-6 shadow-sm">
            <h1 className="text-3xl font-bold mb-4">
              {client.client.name}
            </h1>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <p>
                <strong>Estado:</strong> {client.account.status}
              </p>

              <p>
                <strong>WhatsApp:</strong> {client.client.whatsapp}
              </p>

              <p>
                <strong>Fecha de ingreso:</strong>{" "}
                {new Date(client.client.entryDate).toLocaleDateString("es-AR")}
              </p>

              <p>
                <strong>Mensualidad:</strong> $
                {client.client.amount.toLocaleString("es-AR")}
              </p>

              <p>
                <strong>Próximo vencimiento:</strong>{" "}
                {new Date(
                  client.account.nextDueDate
                ).toLocaleDateString("es-AR")}
              </p>

              <p>
                <strong>Días restantes:</strong>{" "}
                {client.account.daysRemaining}
              </p>

              <p>
                <strong>Meses adeudados:</strong>{" "}
                {client.account.monthsOwed}
              </p>

              <p>
                <strong>Deuda total:</strong> $
                {client.account.totalDebt.toLocaleString("es-AR")}
              </p>
            </div>

            <div className="mt-4">
              <strong>Observaciones:</strong>
              <p>{client.client.observations || "-"}</p>
            </div>
          </div>

          {/* Pagos pendientes */}
          <div className="border rounded-lg p-6 shadow-sm">
            <h2 className="text-2xl font-semibold mb-4 text-red-600">
              Pagos pendientes ({pendingPayments.length})
            </h2>

            {pendingPayments.length === 0 ? (
              <p>No hay pagos pendientes.</p>
            ) : (
              pendingPayments.map((payment) => (
                <PaymentCard
                  key={payment.period}
                  payment={payment}
                  clientId={client.client._id}
                  clientAmount={client.client.amount}
                  onPaymentSuccess={fetchClient}
                />
              ))
            )}
          </div>

          {/* Pagos realizados */}
          <div className="border rounded-lg p-6 shadow-sm">
            <h2 className="text-2xl font-semibold mb-4 text-green-600">
              Pagos realizados ({paidPayments.length})
            </h2>

            {paidPayments.length === 0 ? (
              <p>No hay pagos registrados.</p>
            ) : (
              paidPayments.map((payment) => (
                <PaymentCard
                  key={payment.period}
                  payment={payment}
                />
              ))
            )}
          </div>
        </div>
      )}
    </AppShell>
  );
}
