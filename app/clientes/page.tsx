"use client"

import { useState, useEffect } from "react"
import { z } from "zod"
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table"

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { AppShell } from "@/components/app-shell"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { apiClient } from "@/lib/api-client"

const clientFormSchema = z.object({
  name: z.string().min(1, "El nombre es requerido"),
  whatsapp: z.string().min(1, "El número de WhatsApp es requerido"),
  amount: z.number().positive("El monto debe ser un número positivo"),
  observations: z.string().optional().default(""),
  entryDate: z.string().min(1, "La fecha de entrada es requerida"),
})

type ClientFormData = z.infer<typeof clientFormSchema>

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[]
  data: TData[]
}

function DataTable<TData, TValue>({
  columns,
  data,
}: DataTableProps<TData, TValue>) {
  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
  })

  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError(null)
    setFieldErrors({})

    const formData = new FormData(e.currentTarget)
    const formDataObj = {
      name: formData.get('name') as string,
      whatsapp: formData.get('whatsapp') as string,
      amount: formData.get('amount') ? parseFloat(formData.get('amount') as string) : 0,
      entryDate: formData.get('entryDate') as string,
      observations: formData.get('observations') as string,
    }

    const result = clientFormSchema.safeParse(formDataObj)

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

    setLoading(true)

    const response = await apiClient.post('/addNewClient', result.data)

    if (response.error) {
      setError(response.error)
      setLoading(false)
      return
    }

    setOpen(false)
    setLoading(false)
  }

  return (<>
    <div className="flex justify-end my-4">
      <Button onClick={() => setOpen(true)}>Agregar cliente</Button>
    </div>

    {open && (
      <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center">
        <div className="bg-black rounded-lg shadow-lg p-6 max-w-sm w-full mx-4">
          <h2 className="text-lg font-semibold mb-2">Agregar nuevo cliente</h2>
          <p className="text-sm text-gray-600 mb-4">
            Ingresa los datos del cliente. Haz clic en guardar cuando termines.
          </p>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="name" className="block text-sm font-medium mb-1">
                Nombre
              </label>
              <Input id="name" name="name" placeholder="Nombre del cliente" />
              {fieldErrors.name && (
                <p className="text-xs text-red-600 mt-1">{fieldErrors.name}</p>
              )}
            </div>
            <div>
              <label htmlFor="whatsapp" className="block text-sm font-medium mb-1">
                WhatsApp
              </label>
              <Input id="whatsapp" name="whatsapp" placeholder="Número de WhatsApp" />
              {fieldErrors.whatsapp && (
                <p className="text-xs text-red-600 mt-1">{fieldErrors.whatsapp}</p>
              )}
            </div>
            <div>
              <label htmlFor="amount" className="block text-sm font-medium mb-1">
                Monto
              </label>
              <Input id="amount" name="amount" type="number" placeholder="Monto" />
              {fieldErrors.amount && (
                <p className="text-xs text-red-600 mt-1">{fieldErrors.amount}</p>
              )}
            </div>
            <div>
              <label htmlFor="entryDate" className="block text-sm font-medium mb-1">
                Fecha de Entrada
              </label>
              <Input id="entryDate" name="entryDate" type="date" />
              {fieldErrors.entryDate && (
                <p className="text-xs text-red-600 mt-1">{fieldErrors.entryDate}</p>
              )}
            </div>
            <div>
              <label htmlFor="observations" className="block text-sm font-medium mb-1">
                Observaciones
              </label>
              <Input id="observations" name="observations" placeholder="Observaciones" />
            </div>
            {error && (
              <div className="text-sm text-red-600 bg-red-50 p-2 rounded">
                {error}
              </div>
            )}
            <div className="flex gap-2 justify-end pt-4">
              <Button
                variant="outline"
                type="button"
                onClick={() => setOpen(false)}
                disabled={loading}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? 'Guardando...' : 'Guardar cliente'}
              </Button>
            </div>
          </form>
        </div>
      </div>
    )}

    <div className="overflow-hidden rounded-md border">
      <Table>
        <TableHeader>
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow key={headerGroup.id}>
              {headerGroup.headers.map((header) => {
                return (
                  <TableHead key={header.id}>
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                        header.column.columnDef.header,
                        header.getContext()
                      )}
                  </TableHead>
                )
              })}
            </TableRow>
          ))}
        </TableHeader>
        <TableBody>
          {table.getRowModel().rows?.length ? (
            table.getRowModel().rows.map((row) => (
              <TableRow
                key={row.id}
                data-state={row.getIsSelected() && "selected"}
              >
                {row.getVisibleCells().map((cell) => (
                  <TableCell key={cell.id}>
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </TableCell>
                ))}
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={columns.length} className="h-24 text-center">
                No results.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  </>)
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

const columns: ColumnDef<Client>[] = [
  {
    accessorKey: "name",
    header: "Nombre",
  },
  {
    accessorKey: "whatsapp",
    header: "Whatsapp",
  },
  {
    accessorKey: "amount",
    header: "Monto",
  },
  {
    accessorKey: "entryDate",
    header: "Fecha de Entrada",
    cell: ({ row }) => {
      const date = new Date(row.getValue("entryDate") as string)
      return date.toLocaleDateString()
    },
  },
  {
    accessorKey: "dueDate",
    header: "Fecha de Vencimiento",
    cell: ({ row }) => {
      const date = new Date(row.getValue("dueDate") as string)
      return date.toLocaleDateString()
    },
  },
]

export default function CustomerPage() {
  const [clients, setClients] = useState<Client[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchClients = async () => {
      try {
        setLoading(true)
        const response = await apiClient.get('/getAllClients')
        if (response.error) {
          setError(response.error)
        } else {
          setClients(response.data || [])
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

  if (loading) {
    return (
      <AppShell title="Clientes">
        <div className="flex justify-center items-center h-64">
          <p className="text-gray-600">Cargando clientes...</p>
        </div>
      </AppShell>
    )
  }

  if (error) {
    return (
      <AppShell title="Clientes">
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <p className="text-red-600">Error: {error}</p>
        </div>
      </AppShell>
    )
  }

  return (
    <AppShell title="Clientes">
      <DataTable columns={columns} data={clients} />
    </AppShell>
  )
}
