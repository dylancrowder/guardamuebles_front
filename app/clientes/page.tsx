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
  box: z.string().min(1, "El box es requerido"),
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
      box: formData.get('box') as string,
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
    <div className="flex justify-between items-center mb-6">
      <div className="text-sm text-gray-500">
        {data.length} cliente{data.length !== 1 ? 's' : ''}
      </div>
      <button
        onClick={() => setOpen(true)}
        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all duration-200 font-semibold shadow-md hover:shadow-lg flex items-center gap-2"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="12" y1="5" x2="12" y2="19"></line>
          <line x1="5" y1="12" x2="19" y2="12"></line>
        </svg>
        Agregar cliente
      </button>
    </div>

    {open && (
      <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
        <div className="bg-gray-900 rounded-xl shadow-2xl p-8 max-w-md w-full border border-gray-700 animate-in zoom-in-95 duration-200">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-white mb-2">Agregar nuevo cliente</h2>
            <p className="text-sm text-gray-400">
              Completa el formulario para registrar un nuevo cliente.
            </p>
          </div>
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label htmlFor="name" className="block text-sm font-medium text-gray-300 mb-1.5">
                  Nombre completo
                </label>
                <Input id="name" name="name" placeholder="Ej: Juan Pérez" className="bg-gray-800 border-gray-600 text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
                {fieldErrors.name && (
                  <p className="text-xs text-red-500 mt-1.5 flex items-center gap-1">
                    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="10"></circle>
                      <line x1="12" y1="8" x2="12" y2="12"></line>
                      <line x1="12" y1="16" x2="12.01" y2="16"></line>
                    </svg>
                    {fieldErrors.name}
                  </p>
                )}
              </div>
              <div>
                <label htmlFor="whatsapp" className="block text-sm font-medium text-gray-300 mb-1.5">
                  WhatsApp
                </label>
                <Input id="whatsapp" name="whatsapp" placeholder="Ej: 54911..." className="bg-gray-800 border-gray-600 text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
                {fieldErrors.whatsapp && (
                  <p className="text-xs text-red-500 mt-1.5 flex items-center gap-1">
                    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="10"></circle>
                      <line x1="12" y1="8" x2="12" y2="12"></line>
                      <line x1="12" y1="16" x2="12.01" y2="16"></line>
                    </svg>
                    {fieldErrors.whatsapp}
                  </p>
                )}
              </div>
              <div>
                <label htmlFor="box" className="block text-sm font-medium text-gray-300 mb-1.5">
                  Box
                </label>
                <Input id="box" name="box" placeholder="Ej: A1" className="bg-gray-800 border-gray-600 text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
                {fieldErrors.box && (
                  <p className="text-xs text-red-500 mt-1.5 flex items-center gap-1">
                    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="10"></circle>
                      <line x1="12" y1="8" x2="12" y2="12"></line>
                      <line x1="12" y1="16" x2="12.01" y2="16"></line>
                    </svg>
                    {fieldErrors.box}
                  </p>
                )}
              </div>
              <div>
                <label htmlFor="amount" className="block text-sm font-medium text-gray-300 mb-1.5">
                  Monto mensual
                </label>
                <Input id="amount" name="amount" type="number" placeholder="Ej: 5000" className="bg-gray-800 border-gray-600 text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
                {fieldErrors.amount && (
                  <p className="text-xs text-red-500 mt-1.5 flex items-center gap-1">
                    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="10"></circle>
                      <line x1="12" y1="8" x2="12" y2="12"></line>
                      <line x1="12" y1="16" x2="12.01" y2="16"></line>
                    </svg>
                    {fieldErrors.amount}
                  </p>
                )}
              </div>
              <div>
                <label htmlFor="entryDate" className="block text-sm font-medium text-gray-300 mb-1.5">
                  Fecha de entrada
                </label>
                <Input id="entryDate" name="entryDate" type="date" className="bg-gray-800 border-gray-600 text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
                {fieldErrors.entryDate && (
                  <p className="text-xs text-red-500 mt-1.5 flex items-center gap-1">
                    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="10"></circle>
                      <line x1="12" y1="8" x2="12" y2="12"></line>
                      <line x1="12" y1="16" x2="12.01" y2="16"></line>
                    </svg>
                    {fieldErrors.entryDate}
                  </p>
                )}
              </div>
              <div className="col-span-2">
                <label htmlFor="observations" className="block text-sm font-medium text-gray-300 mb-1.5">
                  Observaciones
                </label>
                <Input id="observations" name="observations" placeholder="Notas adicionales (opcional)" className="bg-gray-800 border-gray-600 text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
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
            <div className="flex gap-3 justify-end pt-4 border-t border-gray-700">
              <button
                type="button"
                onClick={() => setOpen(false)}
                disabled={loading}
                className="px-4 py-2.5 text-gray-300 bg-gray-800 rounded-lg hover:bg-gray-700 transition-all duration-200 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-2.5 text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-all duration-200 font-medium disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-lg flex items-center gap-2"
              >
                {loading ? (
                  <>
                    <svg className="animate-spin" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M21 12a9 9 0 1 1-6.219-8.56"></path>
                    </svg>
                    Guardando...
                  </>
                ) : (
                  <>
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path>
                      <polyline points="17 21 17 13 7 13 7 21"></polyline>
                      <polyline points="7 3 7 8 15 8"></polyline>
                    </svg>
                    Guardar cliente
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    )}

    <div className="rounded-xl border border-gray-700 overflow-hidden shadow-sm">
      <Table>
        <TableHeader className="bg-gray-800/50">
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow key={headerGroup.id}>
              {headerGroup.headers.map((header) => {
                return (
                  <TableHead 
                    key={header.id}
                    className={header.column.getCanSort() ? "cursor-pointer hover:bg-gray-800 transition-colors" : ""}
                    onClick={header.column.getToggleSortingHandler()}
                  >
                    <div className="flex items-center gap-1">
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                      {header.column.getCanSort() && (
                        <span className="text-gray-400">
                          {header.column.getIsSorted() === 'asc' && (
                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <line x1="12" y1="5" x2="12" y2="19"></line>
                              <polyline points="19 12 12 5 5 12"></polyline>
                            </svg>
                          )}
                          {header.column.getIsSorted() === 'desc' && (
                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <line x1="12" y1="5" x2="12" y2="19"></line>
                              <polyline points="5 12 12 19 19 12"></polyline>
                            </svg>
                          )}
                          {header.column.getCanSort() && !header.column.getIsSorted() && (
                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="opacity-30">
                              <line x1="12" y1="5" x2="12" y2="19"></line>
                              <polyline points="19 12 12 5 5 12"></polyline>
                            </svg>
                          )}
                        </span>
                      )}
                    </div>
                  </TableHead>
                )
              })}
            </TableRow>
          ))}
        </TableHeader>
        <TableBody className="divide-y divide-gray-700">
          {table.getRowModel().rows?.length ? (
            table.getRowModel().rows.map((row) => (
              <TableRow
                key={row.id}
                data-state={row.getIsSelected() && "selected"}
                className="hover:bg-gray-800/50 transition-colors"
              >
                {row.getVisibleCells().map((cell) => (
                  <TableCell key={cell.id} className="py-3">
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </TableCell>
                ))}
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={columns.length} className="h-32 text-center text-gray-400">
                <div className="flex flex-col items-center gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="opacity-50">
                    <circle cx="11" cy="11" r="8"></circle>
                    <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                  </svg>
                  <p className="text-sm font-medium">No hay clientes registrados</p>
                  <p className="text-xs opacity-70">Comienza agregando uno nuevo</p>
                </div>
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
  box?: string
}

const createColumns = (
  onDelete: (id: string) => void
): ColumnDef<Client>[] => [
  {
    accessorKey: "box",
    header: "Box",
  },
  {
    accessorKey: "name",
    header: "Nombre",
  },
  {
    accessorKey: "whatsapp",
    header: "Whatsapp",
    cell: ({ row }) => {
      const whatsapp = row.getValue("whatsapp") as string
      const message = "Hola, te recordamos sobre tu pago pendiente. Por favor contactanos para regularizar tu situación."
      const whatsappUrl = `https://wa.me/${whatsapp}?text=${encodeURIComponent(message)}`
      
      return (
        <div className="flex items-center justify-between gap-2">
          <span className="text-gray-100">{whatsapp}</span>
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 transition-all duration-200 shadow-sm hover:shadow-md whitespace-nowrap"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l -.362-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
            </svg>
            Recordar
          </a>
        </div>
      )
    },
  },
  {
    accessorKey: "amount",
    header: "Monto",
    cell: ({ row }) => {
      const amount = row.getValue("amount") as number
      return `$${amount.toLocaleString()}`
    },
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
          className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-all duration-200 shadow-sm hover:shadow-md"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
            <circle cx="12" cy="12" r="3"></circle>
          </svg>
          Ver más
        </a>
        <button
          onClick={() => onDelete(row.original._id)}
          className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition-all duration-200 shadow-sm hover:shadow-md"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="3 6 5 6 21 6"></polyline>
            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
          </svg>
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
        <div className="flex flex-col justify-center items-center h-64 gap-3">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p className="text-gray-400 text-sm">Cargando clientes...</p>
        </div>
      </AppShell>
    )
  }

  if (error) {
    return (
      <AppShell title="Clientes">
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
      <div className="mt-8 p-6 bg-gradient-to-r from-blue-600 to-blue-700 rounded-xl border border-blue-500 shadow-lg">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-blue-100 mb-1">Ingresos mensuales totales</p>
            <p className="text-3xl font-bold text-white">
              ${totalAmount.toLocaleString()}
            </p>
          </div>
          <div className="bg-white/20 rounded-lg p-3">
            <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-white">
              <line x1="12" y1="1" x2="12" y2="23"></line>
              <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
            </svg>
          </div>
        </div>
      </div>
    </AppShell>
  )
}
