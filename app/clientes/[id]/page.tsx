"use client";

import { AppShell } from "@/components/app-shell";
import { useEffect, useState } from "react";
import { apiClient } from "@/lib/api-client";
import { useParams } from "next/navigation";

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

export default function ClientDetailsPage() {
  const params = useParams();
  const id = params.id;

  const [client, setClient] = useState<ClientPaymentDetailResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
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

    if (id) {
      fetchClient();
    }
  }, [id]);

  return (
    <AppShell title="Detalle del Cliente">
      {loading && <p>Cargando...</p>}

      {error && <p>{error}</p>}

      {!loading && !error && client && (
        <>
          <h1>{client.client.name}</h1>

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
            {new Date(client.account.nextDueDate).toLocaleDateString("es-AR")}
          </p>

          <p>
            <strong>Días restantes:</strong>{" "}
            {client.account.daysRemaining}
          </p>

          <p>
            <strong>Observaciones:</strong>{" "}
            {client.client.observations || "-"}
          </p>

          <hr />

          <h2>Historial de pagos</h2>

          {client.history.length === 0 ? (
            <p>No hay pagos registrados.</p>
          ) : (
            client.history.map((payment) => (
              <div key={payment.period}>
                <p>
                  <strong>Período:</strong> {payment.period}
                </p>

                <p>
                  <strong>Estado:</strong>{" "}
                  {payment.status === "PAID" ? "Pagado" : "Pendiente"}
                </p>

                <p>
                  <strong>Fecha de pago:</strong>{" "}
                  {payment.paymentDate
                    ? new Date(payment.paymentDate).toLocaleDateString("es-AR")
                    : "-"}
                </p>

                <p>
                  <strong>Monto:</strong> $
                  {payment.amount.toLocaleString("es-AR")}
                </p>

                <hr />
              </div>
            ))
          )}
        </>
      )}
    </AppShell>
  );
}