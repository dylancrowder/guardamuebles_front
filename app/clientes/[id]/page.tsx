"use client";

import { AppShell } from "@/components/app-shell";
import { ClientPhotos } from "@/components/client-photos";
import { useEffect, useState } from "react";
import { apiClient } from "@/lib/api-client";
import { useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { CalendarPlus, Pencil, Trash2 } from "lucide-react";

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
  box?: string | string[];
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

interface PaymentRecord {
  _id: string;
  amount: number;
  period: string;
  paymentDate: string;
  description?: unknown;
}

interface PaymentListResponse {
  payments: PaymentRecord[];
  pagination?: unknown;
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
  const [paymentDate, setPaymentDate] = useState(getTodayDate());

  const handlePayment = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const paymentData = {
      amount: clientAmount,
      period: payment.period,
      paymentDate,
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
              <DialogTrigger>
                <Button variant="default" size="sm" className="bg-green-600 hover:bg-green-700 text-white">
                  Pagar
                </Button>
              </DialogTrigger>
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
                    <Label htmlFor="paymentDate" className="text-gray-300">Fecha de pago</Label>
                    <Input
                      id="paymentDate"
                      type="date"
                      required
                      value={paymentDate}
                      onChange={(e) => setPaymentDate(e.target.value)}
                      className="bg-gray-800 border-gray-600 text-white"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description" className="text-gray-300">Descripción</Label>
                    <Input
                      id="description"
                      placeholder="Descripción del pago"
                      maxLength={300}
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

function getTodayDate() {
  const date = new Date();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${date.getFullYear()}-${month}-${day}`;
}

function RegisterMultiplePaymentsDialog({
  pendingPeriods,
  paidPeriods,
  clientId,
  clientAmount,
  onPaymentSuccess,
}: {
  pendingPeriods: string[];
  paidPeriods: string[];
  clientId: string;
  clientAmount: number;
  onPaymentSuccess: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [selectedPeriods, setSelectedPeriods] = useState<string[]>([]);
  const [additionalPeriods, setAdditionalPeriods] = useState<string[]>([]);
  const [periodToAdd, setPeriodToAdd] = useState(getTodayDate().slice(0, 7));
  const [amount, setAmount] = useState(String(clientAmount));
  const [paymentDate, setPaymentDate] = useState(getTodayDate());
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const currentMonth = getTodayDate().slice(0, 7);
  const availablePeriods = [...new Set([...pendingPeriods, currentMonth, ...additionalPeriods])]
    .filter((period) => !paidPeriods.includes(period))
    .sort();

  const togglePeriod = (period: string) => {
    setSelectedPeriods((current) =>
      current.includes(period)
        ? current.filter((item) => item !== period)
        : [...current, period]
    );
  };

  const addPeriod = () => {
    setError(null);
    if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(periodToAdd)) {
      setError("Selecciona un período válido.");
      return;
    }
    if (paidPeriods.includes(periodToAdd)) {
      setError("Ese período ya está pagado.");
      return;
    }
    if (periodToAdd < currentMonth && !pendingPeriods.includes(periodToAdd)) {
      setError("Solo puedes agregar meses adeudados anteriores al mes actual.");
      return;
    }

    if (!availablePeriods.includes(periodToAdd)) {
      setAdditionalPeriods((current) => [...current, periodToAdd]);
    }
    setSelectedPeriods((current) =>
      current.includes(periodToAdd) ? current : [...current, periodToAdd]
    );
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    const uniquePeriods = [...new Set(selectedPeriods)];
    const numericAmount = Number(amount);
    if (!Number.isFinite(numericAmount) || numericAmount <= 0 || uniquePeriods.length === 0) {
      setError("Ingresa un monto válido y selecciona al menos un período.");
      return;
    }
    if (uniquePeriods.some((period) => paidPeriods.includes(period))) {
      setError("La selección contiene un período que ya está pagado. Actualiza el historial e inténtalo nuevamente.");
      return;
    }

    setLoading(true);
    const response = await apiClient.post<PaymentRecord | PaymentRecord[]>(
      `/api/payments/addPayment/${clientId}`,
      { amount: numericAmount, periods: uniquePeriods, paymentDate, description }
    );

    if (response.error) {
      setError(response.error);
      setLoading(false);
      return;
    }

    setLoading(false);
    setOpen(false);
    setSelectedPeriods([]);
    onPaymentSuccess();
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger>
        <Button type="button" variant="outline" className="border-gray-600 bg-gray-800 text-gray-100 hover:bg-gray-700">
          <CalendarPlus aria-hidden="true" />
          Pagar varios meses
        </Button>
      </DialogTrigger>
      <DialogContent className="border-gray-700 bg-gray-900">
        <DialogHeader>
          <DialogTitle className="text-white">Registrar varios meses</DialogTitle>
          <DialogDescription className="text-gray-400">
            El importe indicado se aplica a cada período seleccionado.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <fieldset className="max-h-48 space-y-2 overflow-y-auto rounded-md border border-gray-700 p-3">
            <legend className="px-1 text-sm text-gray-300">Meses sin pagar</legend>
            {availablePeriods.length === 0 && (
              <p className="text-sm text-gray-400">Agrega un mes actual o futuro para continuar.</p>
            )}
            {availablePeriods.map((period) => (
              <label key={period} className="flex cursor-pointer items-center gap-3 text-sm text-gray-100">
                <input
                  type="checkbox"
                  checked={selectedPeriods.includes(period)}
                  onChange={() => togglePeriod(period)}
                  className="size-4 accent-blue-500"
                />
                {period}
              </label>
            ))}
          </fieldset>
          <div className="flex items-end gap-2">
            <div className="min-w-0 flex-1 space-y-2">
              <Label htmlFor="multiple-payment-period" className="text-gray-300">Agregar mes futuro</Label>
              <Input
                id="multiple-payment-period"
                type="month"
                min={currentMonth}
                value={periodToAdd}
                onChange={(event) => setPeriodToAdd(event.target.value)}
                className="border-gray-600 bg-gray-800 text-white"
              />
            </div>
            <Button type="button" variant="outline" onClick={addPeriod}>
              Agregar
            </Button>
          </div>
          <div className="space-y-2">
            <Label htmlFor="multiple-payment-amount" className="text-gray-300">Monto por mes</Label>
            <Input
              id="multiple-payment-amount"
              type="number"
              min="0.01"
              step="0.01"
              required
              value={amount}
              onChange={(event) => setAmount(event.target.value)}
              className="border-gray-600 bg-gray-800 text-white"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="multiple-payment-date" className="text-gray-300">Fecha de pago</Label>
            <Input
              id="multiple-payment-date"
              type="date"
              required
              value={paymentDate}
              onChange={(event) => setPaymentDate(event.target.value)}
              className="border-gray-600 bg-gray-800 text-white"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="multiple-payment-description" className="text-gray-300">Descripción</Label>
            <Input
              id="multiple-payment-description"
              maxLength={300}
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              className="border-gray-600 bg-gray-800 text-white"
            />
          </div>
          {error && <p role="alert" className="text-sm text-red-400">{error}</p>}
          <DialogFooter>
            <Button type="button" variant="outline" disabled={loading} onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading || selectedPeriods.length === 0}>
              {loading ? "Procesando..." : `Registrar ${selectedPeriods.length} períodos`}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function PaidPaymentCard({
  payment,
  onPaymentUpdated,
}: {
  payment: PaymentRecord;
  onPaymentUpdated: () => void;
}) {
  const currentDescription = typeof payment.description === "string" ? payment.description : "";
  const [open, setOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [amount, setAmount] = useState(String(payment.amount));
  const [period, setPeriod] = useState(payment.period);
  const [paymentDate, setPaymentDate] = useState(payment.paymentDate?.slice(0, 10) ?? "");
  const [description, setDescription] = useState(currentDescription);

  const handleUpdate = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    const numericAmount = Number(amount);
    if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
      setError("El monto debe ser un número válido mayor a 0.");
      return;
    }

    const changes: Partial<Pick<PaymentRecord, "amount" | "period" | "paymentDate" | "description">> = {};
    if (numericAmount !== payment.amount) changes.amount = numericAmount;
    if (period !== payment.period) changes.period = period;
    if (paymentDate !== payment.paymentDate?.slice(0, 10)) changes.paymentDate = paymentDate;
    if (description !== currentDescription) changes.description = description;
    if (Object.keys(changes).length === 0) {
      setOpen(false);
      return;
    }

    setLoading(true);
    const response = await apiClient.put(
      `/api/payments/updatePayment/${payment._id}`,
      changes
    );
    setLoading(false);

    if (response.error) {
      setError(response.error);
      return;
    }

    setOpen(false);
    onPaymentUpdated();
  };

  const handleDelete = async () => {
    setError(null);
    setLoading(true);
    const response = await apiClient.delete(`/api/payments/deletePayment/${payment._id}`);
    setLoading(false);

    if (response.error) {
      setError(response.error);
      return;
    }
    setDeleteDialogOpen(false);
    onPaymentUpdated();
  };

  return (
    <Card className="border-gray-700 bg-gray-900">
      <CardHeader>
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3 className="text-base font-semibold text-white">Período: {payment.period}</h3>
            <p className="mt-1 text-sm text-green-400">Pagado</p>
          </div>
          <div className="flex items-center gap-2">
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger>
                <Button type="button" variant="outline" size="icon" aria-label={`Editar pago ${payment.period}`} title="Editar pago">
                  <Pencil aria-hidden="true" />
                </Button>
              </DialogTrigger>
              <DialogContent className="border-gray-700 bg-gray-900">
                <DialogHeader>
                  <DialogTitle className="text-white">Editar pago de {payment.period}</DialogTitle>
                  <DialogDescription className="text-gray-400">Modifica los campos necesarios.</DialogDescription>
                </DialogHeader>
                <form onSubmit={handleUpdate} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor={`edit-amount-${payment._id}`} className="text-gray-300">Monto</Label>
                    <Input id={`edit-amount-${payment._id}`} type="number" min="0.01" step="0.01" required value={amount} onChange={(event) => setAmount(event.target.value)} className="border-gray-600 bg-gray-800 text-white" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor={`edit-period-${payment._id}`} className="text-gray-300">Período</Label>
                    <Input id={`edit-period-${payment._id}`} type="month" required value={period} onChange={(event) => setPeriod(event.target.value)} className="border-gray-600 bg-gray-800 text-white" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor={`edit-date-${payment._id}`} className="text-gray-300">Fecha de pago</Label>
                    <Input id={`edit-date-${payment._id}`} type="date" required value={paymentDate} onChange={(event) => setPaymentDate(event.target.value)} className="border-gray-600 bg-gray-800 text-white" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor={`edit-description-${payment._id}`} className="text-gray-300">Descripción</Label>
                    <Input id={`edit-description-${payment._id}`} maxLength={300} value={description} onChange={(event) => setDescription(event.target.value)} className="border-gray-600 bg-gray-800 text-white" />
                  </div>
                  {error && <p role="alert" className="text-sm text-red-400">{error}</p>}
                  <DialogFooter>
                    <Button type="button" variant="outline" disabled={loading} onClick={() => setOpen(false)}>Cancelar</Button>
                    <Button type="submit" disabled={loading}>{loading ? "Guardando..." : "Guardar cambios"}</Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
            <Button type="button" variant="ghost" size="icon" aria-label={`Eliminar pago ${payment.period}`} title="Eliminar pago" disabled={loading} onClick={() => { setError(null); setDeleteDialogOpen(true); }} className="h-8 w-8 text-gray-400 hover:bg-red-950/40 hover:text-red-400">
              <Trash2 className="h-4 w-4" aria-hidden="true" />
            </Button>
            <Dialog
              open={deleteDialogOpen}
              onOpenChange={(nextOpen) => {
                if (!loading) {
                  setDeleteDialogOpen(nextOpen);
                  if (!nextOpen) setError(null);
                }
              }}
            >
              <DialogContent className="border-gray-700 bg-gray-900">
                <DialogHeader>
                  <DialogTitle className="text-white">Eliminar pago</DialogTitle>
                  <DialogDescription className="text-gray-400">
                    ¿Confirmas que deseas eliminar el pago de {payment.period}? Esta acción no se puede deshacer.
                  </DialogDescription>
                </DialogHeader>
                {error && <p role="alert" className="text-sm text-red-400">{error}</p>}
                <DialogFooter>
                  <Button type="button" variant="outline" disabled={loading} onClick={() => setDeleteDialogOpen(false)}>
                    Cancelar
                  </Button>
                  <Button type="button" variant="destructive" disabled={loading} onClick={handleDelete}>
                    {loading ? "Eliminando..." : "Eliminar pago"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        <p className="text-sm text-gray-300"><strong className="text-gray-100">Fecha de pago:</strong> {payment.paymentDate ? new Date(payment.paymentDate).toLocaleDateString() : "-"}</p>
        <p className="text-sm text-gray-300"><strong className="text-gray-100">Monto:</strong> ${payment.amount.toLocaleString()}</p>
        {currentDescription && <p className="text-sm text-gray-300"><strong className="text-gray-100">Descripción:</strong> {currentDescription}</p>}
        {error && <p role="alert" className="text-sm text-red-400">{error}</p>}
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

const getBoxValues = (box?: string | string[]) => {
  if (!box) {
    return []
  }

  if (Array.isArray(box)) {
    return box.map((item) => String(item).trim()).filter(Boolean)
  }

  return String(box)
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean)
}

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
    box: Array.isArray(client.box)
      ? client.box.map((item) => String(item).trim()).filter(Boolean)
      : client.box
      ? client.box
          .toString()
          .split(',')
          .map((item) => item.trim())
          .filter(Boolean)
      : [],
    boxInput: '',
  });

  const parseBoxInput = (input: string) =>
    input
      .split(',')
      .map((value) => value.trim())
      .filter(Boolean)

  const parseExistingBoxValue = (value: string | string[]) =>
    Array.isArray(value)
      ? value.map((item) => String(item).trim()).filter(Boolean)
      : parseBoxInput(String(value))

  const handleAddBox = () => {
    const values = parseBoxInput(formData.boxInput)
    if (values.length === 0) {
      return
    }

    setFormData((prev) => ({
      ...prev,
      box: [...new Set([...parseExistingBoxValue(prev.box), ...values])],
      boxInput: '',
    }))
  }

  const handleRemoveBox = (value: string) => {
    setFormData((prev) => ({
      ...prev,
      box: parseExistingBoxValue(prev.box).filter((boxValue) => boxValue !== value),
    }))
  }

  const normalizeBoxValue = (value: string | string[]) => {
    if (Array.isArray(value)) {
      return value.map((item) => String(item).trim()).filter(Boolean)
    }
    return String(value)
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean)
  }

  const createBoxPayload = (value: string | string[]) => {
    const boxes = normalizeBoxValue(value)
    if (boxes.length === 0) {
      return ''
    }
    return boxes.join(', ')
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const amount = Number(formData.amount)
    if (Number.isNaN(amount) || amount <= 0) {
      setError('El monto debe ser un número válido mayor a 0.')
      setLoading(false)
      return
    }

    if (!formData.entryDate) {
      setError('La fecha de entrada es requerida.')
      setLoading(false)
      return
    }

    try {
      const boxPayload = createBoxPayload(formData.box)
      const updateData: Record<string, unknown> = {
        name: formData.name,
        whatsapp: formData.whatsapp,
        amount,
        entryDate: new Date(formData.entryDate).toISOString(),
        observations: formData.observations,
      }

      if (boxPayload) {
        updateData.box = boxPayload
      }

      const response = await apiClient.put(`/api/clients/${client._id}`, updateData)

      if (response.error) {
        setError(response.error)
      } else {
        setOpen(false)
        onUpdate()
      }
    } catch (err) {
      console.error('Update client error:', err)
      setError(err instanceof Error ? err.message : 'Error al actualizar el cliente')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger>
        <Button variant="outline" size="sm" className="text-gray-300 bg-gray-800 border-gray-600 hover:bg-gray-700">
          Editar
        </Button>
      </DialogTrigger>
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
            <div className="col-span-2">
              <Label htmlFor="boxInput" className="text-gray-300">Box</Label>
              <div className="flex gap-2">
                <Input
                  id="boxInput"
                  value={formData.boxInput}
                  onChange={(e) => setFormData({ ...formData, boxInput: e.target.value })}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault()
                      handleAddBox()
                    }
                  }}
                  placeholder="Ej: 12 o 12, 13, 14"
                  className="bg-gray-800 border-gray-600 text-white"
                />
                <Button type="button" onClick={handleAddBox} className="bg-blue-600 text-white hover:bg-blue-700">
                  Agregar
                </Button>
              </div>
              <p className="text-xs text-gray-400 mt-2">Puedes agregar uno o varios boxes; se guardará como valor único o como lista.</p>
              {Array.isArray(formData.box) && formData.box.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {formData.box.map((boxValue) => (
                    <span key={boxValue} className="inline-flex items-center gap-2 rounded-full bg-blue-700 px-3 py-1 text-xs text-white">
                      {boxValue}
                      <button
                        type="button"
                        onClick={() => handleRemoveBox(boxValue)}
                        className="text-white/70 hover:text-white"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              )}
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

export default function ClientDetailsPage() {
  const params = useParams();
  const id = params.id;

  const [client, setClient] = useState<ClientPaymentDetailResponse | null>(null);
  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  const [paymentsError, setPaymentsError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchClient = async () => {
    try {
      setLoading(true);
      setError(null);
      setPaymentsError(null);

      const [clientResponse, paymentsResponse] = await Promise.all([
        apiClient.get<ClientPaymentDetailResponse>(`/api/payments/getPaymentInfo/${id}`),
        apiClient.get<PaymentListResponse>(`/api/payments/getPayments/${id}`),
      ]);

      if (clientResponse.error) {
        setError(clientResponse.error);
        return;
      }

      setClient(clientResponse.data as ClientPaymentDetailResponse);
      if (paymentsResponse.error) {
        setPaymentsError(paymentsResponse.error);
        setPayments([]);
      } else {
        const paymentData = paymentsResponse.data as PaymentListResponse | PaymentRecord[] | undefined;
        setPayments(Array.isArray(paymentData) ? paymentData : paymentData?.payments ?? []);
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
  const pendingPeriods = [...new Set(pendingPayments.map((payment) => payment.period))];

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
                  <div className="mt-1 flex flex-wrap gap-2">
                    {getBoxValues(client.client.box).length > 0 ? (
                      getBoxValues(client.client.box).map((boxValue) => (
                        <span key={boxValue} className="inline-flex items-center rounded-full bg-blue-700 px-3 py-1 text-xs font-medium text-white">
                          {boxValue}
                        </span>
                      ))
                    ) : (
                      <span className="font-medium text-gray-100">-</span>
                    )}
                  </div>
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

          <ClientPhotos key={client.client._id} clientId={client.client._id} />

          {/* Pagos pendientes */}
          <div>
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-2xl font-semibold text-red-400 flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10"></circle>
                  <polyline points="12 6 12 12 16 14"></polyline>
                  <line x1="12" y1="2" x2="12" y2="22"></line>
                </svg>
                Pagos pendientes ({pendingPayments.length})
              </h2>
              <RegisterMultiplePaymentsDialog
                pendingPeriods={pendingPeriods}
                paidPeriods={payments.map((payment) => payment.period)}
                clientId={client.client._id}
                clientAmount={client.client.amount}
                onPaymentSuccess={fetchClient}
              />
            </div>

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
              Pagos realizados ({payments.length})
            </h2>

            {paymentsError && (
              <p role="alert" className="mb-4 rounded-md border border-red-800 bg-red-950/30 p-3 text-sm text-red-400">
                No se pudo cargar el historial de pagos: {paymentsError}
              </p>
            )}

            {payments.length === 0 ? (
              <Card className="border-gray-700 bg-gray-900">
                <CardContent className="pt-6">
                  <p className="text-gray-400">{paymentsError ? "El historial no está disponible." : "No hay pagos registrados."}</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {payments.map((payment) => (
                  <PaidPaymentCard
                    key={payment._id}
                    payment={payment}
                    onPaymentUpdated={fetchClient}
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
