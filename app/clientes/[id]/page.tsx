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

//hola
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
  box?: string;
  contractUrl?: string;
  contractPublicId?: string;
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
  const statusColor = isPaid ? "text-green-400" : "text-red-400";
  const statusText = isPaid ? "Pagado" : "Pendiente";

  return (
    <Card className="mb-4 border-gray-700 bg-gray-900">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h3 className="text-base font-semibold text-white">Período: {payment.period}</h3>
            <p className={`mt-1 text-sm ${statusColor}`}>
              {statusText}
            </p>
          </div>
          {!isPaid && (
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger
                render={
                  <Button variant="default" size="sm" className="bg-green-600 hover:bg-green-700 text-white">
                    Pagar
                  </Button>
                }
              />
              <DialogContent className="bg-gray-900 border-gray-700">
                <DialogHeader>
                  <DialogTitle className="text-white">Pagar período {payment.period}</DialogTitle>
                  <DialogDescription className="text-gray-400">
                    Ingresa los detalles del pago para completar la transacción.
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handlePayment} className="space-y-5">
                  <div className="space-y-2">
                    <Label htmlFor="amount" className="text-gray-300">Monto</Label>
                    <Input
                      id="amount"
                      disabled
                      value={`$${clientAmount.toLocaleString()}`}
                      className="bg-gray-800 border-gray-600 text-white"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="period" className="text-gray-300">Período</Label>
                    <Input
                      id="period"
                      disabled
                      value={payment.period}
                      className="bg-gray-800 border-gray-600 text-white"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description" className="text-gray-300">Descripción</Label>
                    <Input
                      id="description"
                      placeholder="Descripción del pago"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      className="bg-gray-800 border-gray-600 text-white"
                    />
                  </div>

                  {error && (
                    <div className="text-sm text-red-400 bg-red-950/30 p-4 rounded-lg border border-red-800 flex items-start gap-2">
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mt-0.5 flex-shrink-0">
                        <circle cx="12" cy="12" r="10"></circle>
                        <line x1="12" y1="8" x2="12" y2="12"></line>
                        <line x1="12" y1="16" x2="12.01" y2="16"></line>
                      </svg>
                      {error}
                    </div>
                  )}

                  <DialogFooter className="pt-4 border-t border-gray-700">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setDialogOpen(false)}
                      disabled={loading}
                      className="text-gray-300 bg-gray-800 border-gray-600 hover:bg-gray-700"
                    >
                      Cancelar
                    </Button>
                    <Button
                      type="submit"
                      disabled={loading}
                      className="bg-blue-600 hover:bg-blue-700 text-white"
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
      <CardContent className="space-y-3">
        {isPaid && payment.paymentDate && (
          <p className="text-sm text-gray-300">
            <strong className="text-gray-100">Fecha de pago:</strong>{" "}
            {new Date(payment.paymentDate).toLocaleDateString()}
          </p>
        )}
        <p className="text-sm text-gray-300">
          <strong className="text-gray-100">Monto:</strong> ${payment.amount.toLocaleString()}
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

function EditClientDialog({ client, onUpdate }: { client: Client; onUpdate: () => void }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: client.name,
    whatsapp: client.whatsapp,
    amount: client.amount,
    entryDate: client.entryDate.split('T')[0],
    observations: client.observations || '',
    box: client.box || '',
  });

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const updateData = {
        name: formData.name,
        whatsapp: formData.whatsapp,
        amount: formData.amount,
        entryDate: new Date(formData.entryDate).toISOString(),
        observations: formData.observations,
        box: formData.box,
      };

      const response = await apiClient.put(`/api/clients/${client._id}`, updateData);

      if (response.error) {
        setError(response.error);
      } else {
        setOpen(false);
        onUpdate();
      }
    } catch (err) {
      setError('Error al actualizar el cliente');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button variant="outline" size="sm" className="text-gray-300 bg-gray-800 border-gray-600 hover:bg-gray-700">
            Editar
          </Button>
        }
      />
      <DialogContent className="bg-gray-900 border-gray-700">
        <DialogHeader>
          <DialogTitle className="text-white">Editar cliente</DialogTitle>
          <DialogDescription className="text-gray-400">
            Actualiza los datos del cliente. Haz clic en guardar cuando termines.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <Label htmlFor="name" className="text-gray-300">Nombre</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
                className="bg-gray-800 border-gray-600 text-white"
              />
            </div>
            <div>
              <Label htmlFor="whatsapp" className="text-gray-300">WhatsApp</Label>
              <Input
                id="whatsapp"
                value={formData.whatsapp}
                onChange={(e) => setFormData({ ...formData, whatsapp: e.target.value })}
                required
                className="bg-gray-800 border-gray-600 text-white"
              />
            </div>
            <div>
              <Label htmlFor="box" className="text-gray-300">Box</Label>
              <Input
                id="box"
                value={formData.box}
                onChange={(e) => setFormData({ ...formData, box: e.target.value })}
                className="bg-gray-800 border-gray-600 text-white"
              />
            </div>
            <div>
              <Label htmlFor="amount" className="text-gray-300">Monto Mensual</Label>
              <Input
                id="amount"
                type="number"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: parseFloat(e.target.value) })}
                required
                className="bg-gray-800 border-gray-600 text-white"
              />
            </div>
            <div>
              <Label htmlFor="entryDate" className="text-gray-300">Fecha de Entrada</Label>
              <Input
                id="entryDate"
                type="date"
                value={formData.entryDate}
                onChange={(e) => setFormData({ ...formData, entryDate: e.target.value })}
                required
                className="bg-gray-800 border-gray-600 text-white"
              />
            </div>
            <div className="col-span-2">
              <Label htmlFor="observations" className="text-gray-300">Observaciones</Label>
              <Input
                id="observations"
                value={formData.observations}
                onChange={(e) => setFormData({ ...formData, observations: e.target.value })}
                className="bg-gray-800 border-gray-600 text-white"
              />
            </div>
          </div>
          {error && (
            <div className="text-sm text-red-400 bg-red-950/30 p-4 rounded-lg border border-red-800 flex items-start gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mt-0.5 flex-shrink-0">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="12" y1="8" x2="12" y2="12"></line>
                <line x1="12" y1="16" x2="12.01" y2="16"></line>
              </svg>
              {error}
            </div>
          )}
          <DialogFooter className="pt-4 border-t border-gray-700">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={loading}
              className="text-gray-300 bg-gray-800 border-gray-600 hover:bg-gray-700"
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={loading} className="bg-blue-600 hover:bg-blue-700 text-white">
              {loading ? 'Guardando...' : 'Guardar cambios'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function ContractCard({
  clientId,
  contractUrl,
  onUploaded,
}: {
  clientId: string;
  contractUrl?: string;
  onUploaded: (client: Client) => void;
}) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] ?? null;
    setError(null);
    setMessage(null);

    if (file && (file.type !== "application/pdf" || !file.name.toLowerCase().endsWith(".pdf"))) {
      setSelectedFile(null);
      setError("Solo se permiten archivos PDF.");
      event.target.value = "";
      return;
    }

    if (file && file.size > 10 * 1024 * 1024) {
      setSelectedFile(null);
      setError("El PDF no puede superar los 10 MB.");
      event.target.value = "";
      return;
    }

    setSelectedFile(file);
  };

  const handleUpload = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!selectedFile) {
      setError("Selecciona un archivo PDF para cargar.");
      return;
    }

    setLoading(true);
    setError(null);
    setMessage(null);

    const formData = new FormData();
    formData.append("contract", selectedFile, selectedFile.name);

    try {
      const response = await apiClient.postFormData<Client>(
        `/api/clients/${clientId}/contract`,
        formData
      );

      if (response.error || !response.data) {
        setError(response.error || "Error al cargar el contrato.");
      } else {
        onUploaded(response.data);
        setMessage("Contrato cargado correctamente.");
        setSelectedFile(null);
        event.currentTarget.reset();
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="border-gray-700 bg-gray-900">
      <CardHeader>
        <CardTitle className="text-xl text-white">Contrato</CardTitle>
        <CardDescription className="text-gray-400">
          Carga y consulta el contrato PDF de este cliente.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <form
          onSubmit={handleUpload}
          encType="multipart/form-data"
          className="flex flex-col gap-3 sm:flex-row sm:items-end"
        >
          <div className="flex-1 space-y-2">
            <Label htmlFor="contract-file" className="text-gray-300">Archivo PDF</Label>
            <input
              id="contract-file"
              name="contract"
              type="file"
              accept="application/pdf,.pdf"
              onChange={handleFileChange}
              disabled={loading}
              className="h-8 w-full min-w-0 rounded-lg border border-gray-600 bg-gray-800 px-2.5 py-1 text-base text-white transition-colors outline-none file:mr-3 file:border-0 file:bg-gray-700 file:px-3 file:py-1 file:text-sm file:text-gray-200 focus-visible:border-blue-500 md:text-sm"
            />
          </div>
          <Button type="submit" disabled={loading || !selectedFile} className="bg-blue-600 hover:bg-blue-700 text-white">
            {loading ? "Cargando..." : "Cargar PDF"}
          </Button>
        </form>

        {selectedFile && <p className="text-sm text-gray-400">Archivo seleccionado: {selectedFile.name}</p>}
        {message && <p className="text-sm text-green-400">{message}</p>}
        {error && <p className="text-sm text-red-400">{error}</p>}

        {contractUrl && (
          <a
            href={contractUrl}
            target="_blank"
            rel="noopener noreferrer"
            download
            className="inline-flex items-center gap-2 text-sm text-blue-400 hover:text-blue-300 transition-colors"
          >
            Ver o descargar contrato actual
          </a>
        )}
      </CardContent>
    </Card>
  );
}

export default function ClientDetailsPage() {
  const params = useParams();
  const id = Array.isArray(params.id) ? params.id[0] : params.id;

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

  if (loading) {
    return (
      <AppShell title="Detalle del Cliente">
        <div className="flex flex-col justify-center items-center h-64 gap-3">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p className="text-gray-400 text-sm">Cargando cliente...</p>
        </div>
      </AppShell>
    )
  }

  if (error) {
    return (
      <AppShell title="Detalle del Cliente">
        <div className="bg-red-950/30 border border-red-800 rounded-lg p-4 flex items-start gap-3">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-red-400 flex-shrink-0 mt-0.5">
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="12" y1="8" x2="12" y2="12"></line>
            <line x1="12" y1="16" x2="12.01" y2="16"></line>
          </svg>
          <div>
            <p className="text-red-400 font-medium">Error</p>
            <p className="text-red-400 text-sm mt-1">{error}</p>
          </div>
        </div>
      </AppShell>
    )
  }

  return (
    <AppShell title="Detalle del Cliente">
      <div className="mb-4">
        <a
          href="/clientes"
          className="inline-flex items-center gap-2 text-sm text-gray-400 hover:text-gray-200 transition-colors"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="19" y1="12" x2="5" y2="12"></line>
            <polyline points="12 19 5 12 12 5"></polyline>
          </svg>
          Volver a clientes
        </a>
      </div>
      {!loading && !error && client && (
        <div className="space-y-8">
          {/* Información del cliente */}
          <Card className="border-gray-700 bg-gray-900">
            <CardHeader>
              <div className="flex items-start justify-between">
                <h1 className="text-3xl font-bold text-white">{client.client.name}</h1>
                <EditClientDialog client={client.client} onUpdate={fetchClient} />
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-400">Estado</p>
                  <p className="font-medium text-gray-100">{client.account.status}</p>
                </div>

                <div>
                  <p className="text-sm text-gray-400">WhatsApp</p>
                  <p className="font-medium text-gray-100">{client.client.whatsapp}</p>
                </div>

                <div>
                  <p className="text-sm text-gray-400">Box</p>
                  <p className="font-medium text-gray-100">{client.client.box || '-'}</p>
                </div>

                <div>
                  <p className="text-sm text-gray-400">Fecha de ingreso</p>
                  <p className="font-medium text-gray-100">
                    {new Date(client.client.entryDate).toLocaleDateString()}
                  </p>
                </div>

                <div>
                  <p className="text-sm text-gray-400">Mensualidad</p>
                  <p className="font-medium text-gray-100">
                    ${client.client.amount.toLocaleString()}
                  </p>
                </div>

                <div>
                  <p className="text-sm text-gray-400">Próximo vencimiento</p>
                  <p className="font-medium text-gray-100">
                    {formatUtcDate(client.account.nextDueDate)}
                  </p>
                </div>

                <div>
                  <p className="text-sm text-gray-400">Días restantes</p>
                  <p className="font-medium text-gray-100">{client.account.daysRemaining}</p>
                </div>

                <div>
                  <p className="text-sm text-gray-400">Meses adeudados</p>
                  <p className="font-medium text-gray-100">{client.account.monthsOwed}</p>
                </div>

                <div>
                  <p className="text-sm text-gray-400">Deuda total</p>
                  <p className="font-medium text-gray-100">
                    ${client.account.totalDebt.toLocaleString()}
                  </p>
                </div>
              </div>

              {client.client.observations && (
                <div>
                  <p className="text-sm text-gray-400 mb-1">Observaciones</p>
                  <p className="text-sm text-gray-300">{client.client.observations}</p>
                </div>
              )}
            </CardContent>
          </Card>

          <ContractCard
            clientId={client.client._id}
            contractUrl={client.client.contractUrl}
            onUploaded={(updatedClient) =>
              setClient((currentClient) =>
                currentClient ? { ...currentClient, client: updatedClient } : currentClient
              )
            }
          />

          {/* Pagos pendientes */}
          <div>
            <h2 className="text-2xl font-semibold mb-4 text-red-400 flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"></circle>
                <polyline points="12 6 12 12 16 14"></polyline>
                <line x1="12" y1="2" x2="12" y2="22"></line>
              </svg>
              Pagos pendientes ({pendingPayments.length})
            </h2>

            {pendingPayments.length === 0 ? (
              <Card className="border-gray-700 bg-gray-900">
                <CardContent className="pt-6">
                  <p className="text-gray-400">No hay pagos pendientes.</p>
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
            <h2 className="text-2xl font-semibold mb-4 text-green-400 flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                <polyline points="22 4 12 14.01 9 11.01"></polyline>
              </svg>
              Pagos realizados ({paidPayments.length})
            </h2>

            {paidPayments.length === 0 ? (
              <Card className="border-gray-700 bg-gray-900">
                <CardContent className="pt-6">
                  <p className="text-gray-400">No hay pagos registrados.</p>
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
