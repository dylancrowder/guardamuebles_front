
"use client";

import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { AppShell } from "@/components/app-shell";
import { useEffect, useState } from "react";
import { apiClient } from "@/lib/api-client";
import { useParams } from "next/navigation";


export default function ClientDetailsPage() {




  const params = useParams();
  const id = params.id;

  interface Client {
    _id: string
    name: string
    whatsapp: string
    entryDate: string
    amount: number
    observations: string
    createdAt: string
    updatedAt: string
    __v: number
    estado?: string
  }


  const [client, setClient] = useState<Client | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)


  //efecto para obtener los clientes desde la API
  useEffect(() => {
    const fetchClients = async () => {
      try {
        setLoading(true)
        const response = await apiClient.get(`/api/clients/getClient/${id}`);
        console.log('Response from API:', response)
        if (response.error) {
          setError(response.error)
        } else {

          console.log('Processed clients data:', response.data)

          setClient(response.data as Client)
        }
      } catch (err) {
        setError('Error al cargar los clientes')
        console.error(err)
      } finally {
        setLoading(false)
      }
    }

    fetchClients()
  }, [])




  return (
    <AppShell title="">
      <> <div className="container mx-auto py-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold">Detalle del Cliente</h1>
          <p className="text-muted-foreground">
            Información general y estado de la cuenta.
          </p>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>{client?.name}</CardTitle>
              <Badge>Activo</Badge>
            </div>
          </CardHeader>

          <Separator />

          <CardContent className="pt-6">
            <div className="grid gap-6 md:grid-cols-2">
              <div>
                <Label>Whatsapp</Label>
                <p className="mt-1 text-sm text-muted-foreground">
                  {client?.whatsapp}
                </p>
              </div>

              <div>
                <Label>Fecha de ingreso</Label>
                <p className="mt-1 text-sm text-muted-foreground">
                  {client?.entryDate}
                </p>
              </div>
              <div>
                <Label>Monto</Label>
                <p className="mt-1 text-sm text-muted-foreground">
                  ${client?.amount?.toLocaleString()}
                </p>
              </div>

              <div>
                <Label>Próximo vencimiento</Label>
                <p className="mt-1 text-sm text-muted-foreground">
                  trabajar aca
                </p>
              </div>

              <div>
                <Label>Último pago</Label>
                <p className="mt-1 text-sm text-muted-foreground">
                trabajar aca tambien
                </p>
              </div>

              <div className="md:col-span-2">
                <Label>Observaciones</Label>
                <div className="mt-2 rounded-md border p-3 text-sm text-muted-foreground">
                {client?.observations || "Sin observaciones"}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      </>
    </AppShell>
  )
}
