"use client";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Label } from "../ui/label";

interface Payment {
  _id: string;
  period: string;
  amount: number;
  paymentDate: string;
}

interface Props {
  payments: Payment[];
}

export function ClientPaymentSection({ payments }: Props) {
  return (
   <Card>
  <CardHeader>
    <div className="flex items-center justify-between">
      <CardTitle>Pagos</CardTitle>
      <Badge>{payments.length} pagos</Badge>
    </div>
  </CardHeader>

  <Separator />

  <CardContent className="pt-6">
    <div className="grid gap-6">
      {payments.map((payment) => (
        <div key={payment._id} className="grid gap-6 md:grid-cols-3">
          <div>
            <Label>Período</Label>
            <p className="mt-1 text-sm text-muted-foreground">
              {payment.period}
            </p>
          </div>

          <div>
            <Label>Fecha de pago</Label>
            <p className="mt-1 text-sm text-muted-foreground">
              {new Date(payment.paymentDate).toLocaleDateString("es-AR")}
            </p>
          </div>

          <div>
            <Label>Monto</Label>
            <p className="mt-1 text-sm text-muted-foreground">
              ${payment.amount.toLocaleString("es-AR")}
            </p>
          </div>

          <Separator className="md:col-span-3" />
        </div>
      ))}
    </div>
  </CardContent>
</Card>
  );
}