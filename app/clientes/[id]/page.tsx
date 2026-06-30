"use client";

import { AppShell } from "@/components/app-shell";
import { useEffect, useState } from "react";
import { apiClient } from "@/lib/api-client";
import { useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

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
  const [dialogOpen, setDialogOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [description, setDescription] = useState(`Pago mensual de ${payment.period}`);

  const handlePayment = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const paymentData = {
      amount: clientAmount,
      period: payment.period,
      paymentDate: new Date().toISOString(),
      description: description,
    };

    try {
      const response = await apiClient.post(
        `/api/payments/addPayment/${clientId}`,
        paymentData
      );

      if (response.error) {
        setError(response.error);
      } else {
        setDialogOpen(false);
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

  const isPaid = payment.status === "PAID";
  const statusColor = isPaid ? "text-green-600" : "text-red-600";
  const statusText = isPaid ? "Pagado" : "Pendiente";

  return (
    <Card className="mb-4">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-base">Período: {payment.period}</CardTitle>
            <CardDescription className={`mt-1 ${statusColor}`}>
              {statusText}
            </CardDescription>
          </div>
          {!isPaid && (
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="default" size="sm">
                  Pagar
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Pagar período {payment.period}</DialogTitle>
                  <DialogDescription>
                    Ingresa los detalles del pago para completar la transacción.
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handlePayment} className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="amount">Monto</Label>
                    <Input
                      id="amount"
                      disabled
                      value={`$${clientAmount.toLocaleString("es-AR")}`}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="period">Período</Label>
                    <Input
                      id="period"
                      disabled
                      value={payment.period}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description">Descripción</Label>
                    <Input
                      id="description"
                      placeholder="Descripción del pago"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                    />
                  </div>

                  {error && (
                    <div className="text-sm text-red-600 bg-red-50 p-3 rounded border border-red-200 dark:bg-red-950/20 dark:text-red-400 dark:border-red-900">
                      {error}
                    </div>
                  )}

                  <DialogFooter>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setDialogOpen(false)}
                      disabled={loading}
                    >
                      Cancelar
                    </Button>
                    <Button
                      type="submit"
                      disabled={loading}
                    >
                      {loading ? "Procesando..." : "Confirmar pago"}
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        {isPaid && payment.paymentDate && (
          <p className="text-sm">
            <strong>Fecha de pago:</strong>{" "}
            {new Date(payment.paymentDate).toLocaleDateString("es-AR")}
          </p>
        )}
        <p className="text-sm">
          <strong>Monto:</strong> ${payment.amount.toLocaleString("es-AR")}
        </p>
      </CardContent>
    </Card>
  );


}


const formatUtcDate = (date: string) => {
  const d = new Date(date);

  const day = String(d.getUTCDate()).padStart(2, "0");
  const month = String(d.getUTCMonth() + 1).padStart(2, "0");
  const year = d.getUTCFullYear();

  return `${day}/${month}/${year}`;
};


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
          <Card>
            <CardHeader>
              <CardTitle className="text-3xl">{client.client.name}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Estado</p>
                  <p className="font-medium">{client.account.status}</p>
                </div>

                <div>
                  <p className="text-sm text-muted-foreground">WhatsApp</p>
                  <p className="font-medium">{client.client.whatsapp}</p>
                </div>

                <div>
                  <p className="text-sm text-muted-foreground">Fecha de ingreso</p>
                  <p className="font-medium">
                    {new Date(client.client.entryDate).toLocaleDateString("es-AR")}
                  </p>
                </div>

                <div>
                  <p className="text-sm text-muted-foreground">Mensualidad</p>
                  <p className="font-medium">
                    ${client.client.amount.toLocaleString("es-AR")}
                  </p>
                </div>

                <div>
                  <p className="text-sm text-muted-foreground">Próximo vencimiento</p>
                  <p className="font-medium">
                    {formatUtcDate(client.account.nextDueDate)}
                  </p>
                </div>

                <div>
                  <p className="text-sm text-muted-foreground">Días restantes</p>
                  <p className="font-medium">{client.account.daysRemaining}</p>
                </div>

                <div>
                  <p className="text-sm text-muted-foreground">Meses adeudados</p>
                  <p className="font-medium">{client.account.monthsOwed}</p>
                </div>

                <div>
                  <p className="text-sm text-muted-foreground">Deuda total</p>
                  <p className="font-medium">
                    ${client.account.totalDebt.toLocaleString("es-AR")}
                  </p>
                </div>
              </div>

              {client.client.observations && (
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Observaciones</p>
                  <p className="text-sm">{client.client.observations}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Pagos pendientes */}
          <div>
            <h2 className="text-2xl font-semibold mb-4 text-red-600">
              Pagos pendientes ({pendingPayments.length})
            </h2>

            {pendingPayments.length === 0 ? (
              <Card>
                <CardContent className="pt-6">
                  <p className="text-muted-foreground">No hay pagos pendientes.</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {pendingPayments.map((payment) => (
                  <PaymentCard
                    key={payment.period}
                    payment={payment}
                    clientId={client.client._id}
                    clientAmount={client.client.amount}
                    onPaymentSuccess={fetchClient}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Pagos realizados */}
          <div>
            <h2 className="text-2xl font-semibold mb-4 text-green-600">
              Pagos realizados ({paidPayments.length})
            </h2>

            {paidPayments.length === 0 ? (
              <Card>
                <CardContent className="pt-6">
                  <p className="text-muted-foreground">No hay pagos registrados.</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {paidPayments.map((payment) => (
                  <PaymentCard
                    key={payment.period}
                    payment={payment}
                    clientId={client.client._id}
                    clientAmount={client.client.amount}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </AppShell>
  );
}
