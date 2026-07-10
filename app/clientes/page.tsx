"use client"

import { useState, useEffect } from "react"
import { z } from "zod"
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
  SortingState,
  getSortedRowModel,
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
  onAddClient?: (client: Client) => void
}

function DataTable<TData, TValue>({
  columns,
  data,
  onAddClient,
}: DataTableProps<TData, TValue>) {
  const [sorting, setSorting] = useState<SortingState>([])
  
  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    onSortingChange: setSorting,
    getSortedRowModel: getSortedRowModel(),
    state: {
      sorting,
    },
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

    const response = await apiClient.post('/api/clients', result.data) as { data: Client; error?: string }

    if (response.error) {
      setError(response.error)
      setLoading(false)
      return
    }

    if (onAddClient) {
      onAddClient(response.data)
    }
    setOpen(false)
    setLoading(false)
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
      <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
        <div className="bg-gray-900 rounded-lg shadow-xl p-6 max-w-md w-full border border-gray-700">
          <h2 className="text-2xl font-bold text-white mb-2">Agregar nuevo cliente</h2>
          <p className="text-sm text-gray-400 mb-6">
            Ingresa los datos del cliente. Haz clic en guardar cuando termines.
          </p>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="name" className="block text-sm font-semibold text-gray-200 mb-2">
                Nombre
              </label>
              <Input id="name" name="name" placeholder="Nombre del cliente" className="bg-gray-800 border-gray-600 text-white" />
              {fieldErrors.name && (
                <p className="text-xs text-red-400 mt-1">{fieldErrors.name}</p>
              )}
            </div>
            <div>
              <label htmlFor="whatsapp" className="block text-sm font-semibold text-gray-200 mb-2">
                WhatsApp
              </label>
              <Input id="whatsapp" name="whatsapp" placeholder="Número de WhatsApp" className="bg-gray-800 border-gray-600 text-white" />
              {fieldErrors.whatsapp && (
                <p className="text-xs text-red-400 mt-1">{fieldErrors.whatsapp}</p>
              )}
            </div>
            <div>
              <label htmlFor="amount" className="block text-sm font-semibold text-gray-200 mb-2">
                Monto Mensual
              </label>
              <Input id="amount" name="amount" type="number" placeholder="Monto" className="bg-gray-800 border-gray-600 text-white" />
              {fieldErrors.amount && (
                <p className="text-xs text-red-400 mt-1">{fieldErrors.amount}</p>
              )}
            </div>
            <div>
              <label htmlFor="entryDate" className="block text-sm font-semibold text-gray-200 mb-2">
                Fecha de Entrada
              </label>
              <Input id="entryDate" name="entryDate" type="date" className="bg-gray-800 border-gray-600 text-white" />
              {fieldErrors.entryDate && (
                <p className="text-xs text-red-400 mt-1">{fieldErrors.entryDate}</p>
              )}
            </div>
            <div>
              <label htmlFor="observations" className="block text-sm font-semibold text-gray-200 mb-2">
                Observaciones
              </label>
              <Input id="observations" name="observations" placeholder="Observaciones" className="bg-gray-800 border-gray-600 text-white" />
            </div>
            {error && (
              <div className="text-sm text-red-400 bg-red-950 p-3 rounded border border-red-700">
                {error}
              </div>
            )}
            <div className="flex gap-2 justify-end pt-6">
              <button
                type="button"
                onClick={() => setOpen(false)}
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
                  <TableHead 
                    key={header.id}
                    className={header.column.getCanSort() ? "cursor-pointer hover:bg-gray-800" : ""}
                    onClick={header.column.getToggleSortingHandler()}
                  >
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                        header.column.columnDef.header,
                        header.getContext()
                      )}
                    {header.column.getIsSorted() === 'asc' && (
                      <span className="ml-2">↑</span>
                    )}
                    {header.column.getIsSorted() === 'desc' && (
                      <span className="ml-2">↓</span>
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
  amount: number
  observations: string
  createdAt: string
  updatedAt: string
  __v: number
  estado?: string
  daysRemaining?: number
  nextDueDate?: string
  monthsOwed?: number
}

const createColumns = (
  onDelete: (id: string) => void
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
    accessorKey: "daysRemaining",
    header: "Días Restantes",
    cell: ({ row }) => {
      const days = row.getValue("daysRemaining") as number
      return days !== undefined ? days : '-'
    },
    enableSorting: true,
    sortingFn: (rowA, rowB) => {
      const daysA = rowA.getValue("daysRemaining") as number
      const daysB = rowB.getValue("daysRemaining") as number
      if (daysA === undefined) return 1
      if (daysB === undefined) return -1
      return daysA - daysB
    },
  },
  {
    accessorKey: "nextDueDate",
    header: "Próximo Vencimiento",
    cell: ({ row }) => {
      const date = row.getValue("nextDueDate") as string
      if (!date) return '-'
      return new Date(date).toLocaleDateString()
    },
    enableSorting: true,
    sortingFn: (rowA, rowB) => {
      const dateA = rowA.getValue("nextDueDate") as string
      const dateB = rowB.getValue("nextDueDate") as string
      if (!dateA) return 1
      if (!dateB) return -1
      return new Date(dateA).getTime() - new Date(dateB).getTime()
    },
  },
  {
    accessorKey: "monthsOwed",
    header: "Meses Deudores",
    cell: ({ row }) => {
      const months = row.getValue("monthsOwed") as number
      return months !== undefined ? months : '-'
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

 

  useEffect(() => {
    const fetchClients = async () => {
      try {
        setLoading(true)
        const response = await apiClient.get('/api/clients/getAllInfo')
        console.log('Response from API:', response)
        if (response.error) {
          setError(response.error)
        } else {
          const clientsData = Array.isArray(response.data?.clients) ? response.data.clients : (Array.isArray(response.data) ? response.data : [])
          console.log('Processed clients data:', clientsData)
          setClients(clientsData)
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
        <div className="bg-red-950 border border-red-700 rounded-md p-4">
          <p className="text-red-400">Error: {error}</p>
        </div>
      </AppShell>
    )
  }

  const handleDeleteClient = (id: string) => {
    if (!confirm('¿Estás seguro que deseas eliminar este cliente?')) {
      return
    }

    apiClient.delete(`/api/clients/${id}`).then((response) => {
      if (response.error) {
        setError(response.error)
      } else {
        setClients((prevClients) => prevClients.filter((client) => client._id !== id))
      }
    })
  }

  const columns = createColumns(handleDeleteClient)

  const totalAmount = Array.isArray(clients) ? clients.reduce((sum, client) => sum + client.amount, 0) : 0

  return (
    <AppShell title="Clientes">
      <DataTable
        columns={columns}
        data={clients}
        onAddClient={(newClient) => setClients([...clients, newClient])}
      />
      <div className="mt-8 p-6 bg-gradient-to-r from-green-950 to-emerald-950 rounded-lg border border-green-700">
        <p className="text-lg font-semibold text-gray-200">
          Total ganado:
          <span className="ml-2 text-2xl font-bold text-green-400">${totalAmount.toLocaleString()}</span>
        </p>
      </div>
    </AppShell>
  )
}
