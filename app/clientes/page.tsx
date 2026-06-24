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
  const [deletingId, setDeletingId] = useState<string | null>(null)

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

    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500))

    // Mock new client
    const mockNewClient: Client = {
      _id: Date.now().toString(),
      name: result.data.name,
      whatsapp: result.data.whatsapp,
      amount: result.data.amount,
      observations: result.data.observations,
      entryDate: result.data.entryDate,
      dueDate: new Date(new Date(result.data.entryDate).getTime() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      __v: 0,
    }

    setClients([...clients, mockNewClient])
    setOpen(false)
    setLoading(false)
  }

  const handleDeleteClient = async (id: string) => {
    if (!confirm('¿Estás seguro que deseas eliminar este cliente?')) {
      return
    }

    setDeletingId(id)
    const response = await apiClient.delete(`/deleteClient/${id}`)

    if (response.error) {
      setError(response.error)
    } else {
      setClients((prevClients) => prevClients.filter((client) => client._id !== id))
    }
    setDeletingId(null)
  }

  return (<>
    <div className="flex justify-end mb-6">
      <button
        onClick={() => setOpen(true)}
        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold"
      >
        + Agregar cliente
      </button>
    </div>

    {open && (
      <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-xl p-6 max-w-md w-full">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Agregar nuevo cliente</h2>
          <p className="text-sm text-gray-600 mb-6">
            Ingresa los datos del cliente. Haz clic en guardar cuando termines.
          </p>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="name" className="block text-sm font-semibold text-gray-800 mb-2">
                Nombre
              </label>
              <Input id="name" name="name" placeholder="Nombre del cliente" className="bg-gray-50 border-gray-300" />
              {fieldErrors.name && (
                <p className="text-xs text-red-600 mt-1">{fieldErrors.name}</p>
              )}
            </div>
            <div>
              <label htmlFor="whatsapp" className="block text-sm font-semibold text-gray-800 mb-2">
                WhatsApp
              </label>
              <Input id="whatsapp" name="whatsapp" placeholder="Número de WhatsApp" className="bg-gray-50 border-gray-300" />
              {fieldErrors.whatsapp && (
                <p className="text-xs text-red-600 mt-1">{fieldErrors.whatsapp}</p>
              )}
            </div>
            <div>
              <label htmlFor="amount" className="block text-sm font-semibold text-gray-800 mb-2">
                Monto Mensual
              </label>
              <Input id="amount" name="amount" type="number" placeholder="Monto" className="bg-gray-50 border-gray-300" />
              {fieldErrors.amount && (
                <p className="text-xs text-red-600 mt-1">{fieldErrors.amount}</p>
              )}
            </div>
            <div>
              <label htmlFor="entryDate" className="block text-sm font-semibold text-gray-800 mb-2">
                Fecha de Entrada
              </label>
              <Input id="entryDate" name="entryDate" type="date" className="bg-gray-50 border-gray-300" />
              {fieldErrors.entryDate && (
                <p className="text-xs text-red-600 mt-1">{fieldErrors.entryDate}</p>
              )}
            </div>
            <div>
              <label htmlFor="observations" className="block text-sm font-semibold text-gray-800 mb-2">
                Observaciones
              </label>
              <Input id="observations" name="observations" placeholder="Observaciones" className="bg-gray-50 border-gray-300" />
            </div>
            {error && (
              <div className="text-sm text-red-700 bg-red-50 p-3 rounded border border-red-200">
                {error}
              </div>
            )}
            <div className="flex gap-2 justify-end pt-6">
              <button
                type="button"
                onClick={() => setOpen(false)}
                disabled={loading}
                className="px-4 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors font-medium disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-2 text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50"
              >
                {loading ? 'Guardando...' : 'Guardar cliente'}
              </button>
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

const createColumns = (
  onDelete: (id: string) => void,
  sortOrder: 'asc' | 'desc' | null,
  onSort: (order: 'asc' | 'desc' | null) => void
): ColumnDef<Client>[] => [
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
    header: ({ column }) => (
      <button
        onClick={() => {
          if (sortOrder === 'asc') {
            onSort('desc')
          } else if (sortOrder === 'desc') {
            onSort(null)
          } else {
            onSort('asc')
          }
        }}
        className="flex items-center gap-2 cursor-pointer hover:text-gray-700"
      >
        Fecha de Vencimiento
        <span className="text-xs">
          {sortOrder === 'asc' ? '↑' : sortOrder === 'desc' ? '↓' : '↕'}
        </span>
      </button>
    ),
    cell: ({ row }) => {
      const date = new Date(row.getValue("dueDate") as string)
      return date.toLocaleDateString()
    },
  },
  {
    accessorKey: "actions",
    header: "Acciones",
    cell: ({ row }) => (
      <div className="flex gap-2">
        <a
          href={`/clientes/${row.original._id}`}
          className="px-3 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
        >
          Ver más
        </a>
        <button
          onClick={() => onDelete(row.original._id)}
          className="px-3 py-2 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium"
        >
          Eliminar
        </button>
      </div>
    ),
  },
]

export default function CustomerPage() {
  const [clients, setClients] = useState<Client[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc' | null>(null)

  const sortByDate = (order: 'asc' | 'desc' | null) => {
    setSortOrder(order)
    if (order === null) {
      return
    }

    const sorted = [...clients].sort((a, b) => {
      const dateA = new Date(a.dueDate).getTime()
      const dateB = new Date(b.dueDate).getTime()
      return order === 'asc' ? dateA - dateB : dateB - dateA
    })
    setClients(sorted)
  }

  useEffect(() => {
    const fetchClients = async () => {
      try {
        setLoading(true)

        // Mock data
        const mockClients: Client[] = [
          {
            _id: "6a3c0ba2738bc57a04a3f466",
            name: "movibox",
            whatsapp: "3434343434",
            entryDate: "2026-06-25T00:00:00.000+00:00",
            dueDate: "2026-07-25T00:00:00.000+00:00",
            amount: 89,
            observations: "nh",
            createdAt: "2026-06-24T16:53:54.462+00:00",
            updatedAt: "2026-06-24T16:53:54.462+00:00",
            __v: 0,
          },
          {
            _id: "6a3c0e8e738bc57a04a3f467",
            name: "juan rodriguez",
            whatsapp: "43434343",
            entryDate: "2026-06-10T00:00:00.000+00:00",
            dueDate: "2026-07-10T00:00:00.000+00:00",
            amount: 3434,
            observations: "",
            createdAt: "2026-06-24T17:06:22.457+00:00",
            updatedAt: "2026-06-24T17:06:22.457+00:00",
            __v: 0,
          },
        ]

        setClients(mockClients)
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

  const totalAmount = clients.reduce((sum, client) => sum + client.amount, 0)

  return (
    <AppShell title="Clientes">
      <DataTable
        columns={createColumns(handleDeleteClient, sortOrder, sortByDate)}
        data={clients}
      />
      <div className="mt-8 p-6 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border border-green-200">
        <p className="text-lg font-semibold text-gray-900">
          Total ganado:
          <span className="ml-2 text-2xl font-bold text-green-700">${totalAmount.toLocaleString()}</span>
        </p>
      </div>
    </AppShell>
  )

  function handleDeleteClient(id: string) {
    if (!confirm('¿Estás seguro que deseas eliminar este cliente?')) {
      return
    }

    // Mock delete
    setClients((prevClients) => prevClients.filter((client) => client._id !== id))
  }
}
