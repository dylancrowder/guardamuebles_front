"use client"

import { useEffect, useMemo, useState } from "react"
import { CalendarDays, ChevronLeft, ChevronRight, MapPin, Pencil, Phone, Plus, Trash2, X } from "lucide-react"
import { AppShell } from "@/components/app-shell"
import { apiClient } from "@/lib/api-client"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

type Trip = {
  id: string
  whatsapp: string
  origin: string
  destination: string
  date: string
  time: string
  description?: string
}

type TripPayload = Omit<Trip, "id">

const TRIPS_ENDPOINT = "/api/ventas"
const weekDays = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"]

function formatDateKey(date: Date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, "0")
  const day = String(date.getDate()).padStart(2, "0")
  return `${year}-${month}-${day}`
}

function parseDateKey(dateKey: string) {
  const [year, month, day] = dateKey.split("-").map(Number)
  return new Date(year, month - 1, day)
}

function formatMonth(date: Date) {
  return new Intl.DateTimeFormat("es-AR", {
    month: "long",
    year: "numeric",
  }).format(date)
}

function formatLongDate(dateKey: string) {
  return new Intl.DateTimeFormat("es-AR", {
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(parseDateKey(dateKey))
}

function getCalendarDays(month: Date) {
  const firstDay = new Date(month.getFullYear(), month.getMonth(), 1)
  const start = new Date(firstDay)
  start.setDate(firstDay.getDate() - firstDay.getDay())

  return Array.from({ length: 42 }, (_, index) => {
    const date = new Date(start)
    date.setDate(start.getDate() + index)
    return date
  })
}

export default function VentasPage() {
  const todayKey = formatDateKey(new Date())
  const [month, setMonth] = useState(() => new Date())
  const [selectedDate, setSelectedDate] = useState(todayKey)
  const [trips, setTrips] = useState<Trip[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingTripId, setEditingTripId] = useState<string | null>(null)
  const [form, setForm] = useState({
    whatsapp: "",
    origin: "",
    destination: "",
    date: todayKey,
    time: "09:00",
    description: "",
  })

  async function loadTrips() {
    setIsLoading(true)
    setError(null)
    const response = await apiClient.get<Trip[]>(TRIPS_ENDPOINT)
    if (response.error) {
      setError(response.error)
    } else {
      setTrips(response.data ?? [])
    }
    setIsLoading(false)
  }

  useEffect(() => {
    void loadTrips()
  }, [])

  const calendarDays = useMemo(() => getCalendarDays(month), [month])
  const selectedTrips = useMemo(
    () => trips.filter((trip) => trip.date === selectedDate).sort((a, b) => a.time.localeCompare(b.time)),
    [selectedDate, trips],
  )
  const monthTrips = useMemo(
    () => trips.filter((trip) => {
      const date = parseDateKey(trip.date)
      return date.getMonth() === month.getMonth() && date.getFullYear() === month.getFullYear()
    }),
    [month, trips],
  )

  function changeMonth(offset: number) {
    setMonth((currentMonth) => new Date(currentMonth.getFullYear(), currentMonth.getMonth() + offset, 1))
  }

  function selectDate(date: Date) {
    const dateKey = formatDateKey(date)
    setSelectedDate(dateKey)
    setForm((currentForm) => ({ ...currentForm, date: dateKey }))
  }

  function openNewTrip() {
    setEditingTripId(null)
    setForm({
      whatsapp: "",
      origin: "",
      destination: "",
      date: selectedDate,
      time: "09:00",
      description: "",
    })
    setIsFormOpen(true)
  }

  function openEditTrip(trip: Trip) {
    setEditingTripId(trip.id)
    setForm({
      whatsapp: trip.whatsapp,
      origin: trip.origin,
      destination: trip.destination,
      date: trip.date,
      time: trip.time,
      description: trip.description ?? "",
    })
    setIsFormOpen(true)
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setIsSaving(true)
    setError(null)
    const payload: TripPayload = form
    const response = editingTripId
      ? await apiClient.put<Trip>(`${TRIPS_ENDPOINT}/${editingTripId}`, payload)
      : await apiClient.post<Trip>(TRIPS_ENDPOINT, payload)

    if (response.error) {
      setError(response.error)
    } else {
      await loadTrips()
      setSelectedDate(form.date)
      setMonth(parseDateKey(form.date))
      setEditingTripId(null)
      setIsFormOpen(false)
    }
    setIsSaving(false)
  }

  async function deleteTrip(tripId: string) {
    setError(null)
    const response = await apiClient.delete(`${TRIPS_ENDPOINT}/${tripId}`)
    if (response.error) {
      setError(response.error)
    } else {
      setTrips((currentTrips) => currentTrips.filter((trip) => trip.id !== tripId))
    }
  }

  const allTrips=[...trips].sort((a,b)=>a.date===b.date?a.time.localeCompare(b.time):a.date.localeCompare(b.date));

return (
    <AppShell title="Ventas">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6">
        <section className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <p className="mb-1 text-sm font-medium text-blue-400">Agenda de mudanzas</p>
            <h2 className="text-2xl font-semibold tracking-tight text-white">Organizador de viajes</h2>
            <p className="mt-1 text-sm text-gray-400">Planifica los turnos de retiro y entrega de cada día.</p>
          </div>
          <Button onClick={openNewTrip} className="gap-2 bg-blue-600 text-white hover:bg-blue-700">
            <Plus className="h-4 w-4" />
            Nuevo turno
          </Button>
        </section>

        {error && (
          <div className="rounded-lg border border-red-800 bg-red-950/30 px-4 py-3 text-sm text-red-400" role="alert">
            {error}
          </div>
        )}

        {isLoading ? (
          <Card className="border-gray-700 bg-gray-900">
            <CardContent className="flex min-h-48 items-center justify-center text-sm text-gray-400">
              Cargando turnos...
            </CardContent>
          </Card>
        ) : (
        <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
          <Card className="border-gray-700 bg-gray-900">
            <CardHeader className="flex flex-row items-center justify-between gap-4 border-b border-gray-800">
              <div className="flex items-center gap-3">
                <CalendarDays className="h-5 w-5 text-blue-400" />
                <CardTitle className="capitalize text-lg text-white">{formatMonth(month)}</CardTitle>
                {monthTrips.length > 0 && <Badge variant="secondary">{monthTrips.length} viajes</Badge>}
              </div>
              <div className="flex items-center gap-1">
                <Button variant="ghost" size="icon" onClick={() => changeMonth(-1)} aria-label="Mes anterior">
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="sm" onClick={() => { setMonth(new Date()); setSelectedDate(todayKey) }}>
                  Hoy
                </Button>
                <Button variant="ghost" size="icon" onClick={() => changeMonth(1)} aria-label="Mes siguiente">
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-3 sm:p-5">
              <div className="grid grid-cols-7 border-b border-gray-800 pb-2">
                {weekDays.map((day) => (
                  <div key={day} className="text-center text-xs font-medium uppercase tracking-wide text-gray-500">
                    {day}
                  </div>
                ))}
              </div>
              <div className="mt-2 grid grid-cols-7 gap-1">
                {calendarDays.map((date) => {
                  const dateKey = formatDateKey(date)
                  const dayTrips = trips.filter((trip) => trip.date === dateKey)
                  const isCurrentMonth = date.getMonth() === month.getMonth()
                  const isSelected = dateKey === selectedDate
                  const isToday = dateKey === todayKey

                  return (
                    <button
                      key={dateKey}
                      type="button"
                      onClick={() => selectDate(date)}
                      className={`min-h-20 rounded-lg border p-2 text-left transition-colors sm:min-h-24 ${
                        isSelected ? "border-blue-500 bg-blue-500/10" : "border-transparent hover:border-gray-700 hover:bg-gray-800"
                      } ${!isCurrentMonth ? "opacity-40" : ""}`}
                    >
                      <span className={`inline-flex h-7 w-7 items-center justify-center rounded-full text-sm ${
                        isToday ? "bg-blue-600 font-semibold text-white" : "text-gray-300"
                      }`}>
                        {date.getDate()}
                      </span>
                      <div className="mt-2 space-y-1">
                        {dayTrips.slice(0, 2).map((trip) => (
                          <div key={trip.id} className="truncate rounded bg-blue-500/20 px-1.5 py-0.5 text-[10px] text-blue-200">
                            {trip.time} · {trip.destination}
                          </div>
                        ))}
                        {dayTrips.length > 2 && <p className="px-1 text-[10px] text-gray-500">+{dayTrips.length - 2} más</p>}
                      </div>
                    </button>
                  )
                })}
              </div>
            </CardContent>
          </Card>

          <Card className="border-gray-700 bg-gray-900">
            <CardHeader className="flex flex-row items-start justify-between gap-4">
              <div>
                <CardTitle className="capitalize text-lg text-white">{formatLongDate(selectedDate)}</CardTitle>
                <p className="mt-1 text-sm text-gray-400">{selectedTrips.length} {selectedTrips.length === 1 ? "turno agendado" : "turnos agendados"}</p>
              </div>
              <Button variant="ghost" size="icon" onClick={openNewTrip} aria-label="Agregar turno">
                <Plus className="h-4 w-4" />
              </Button>
            </CardHeader>
            <CardContent className="space-y-3">
              {selectedTrips.length === 0 ? (
                <div className="rounded-lg border border-dashed border-gray-700 px-4 py-8 text-center">
                  <CalendarDays className="mx-auto mb-3 h-8 w-8 text-gray-600" />
                  <p className="text-sm text-gray-400">No hay viajes para este día.</p>
                  <Button variant="link" onClick={openNewTrip} className="mt-1 text-blue-400">Agendar un turno</Button>
                </div>
              ) : (
                selectedTrips.map((trip) => (
                  <div key={trip.id} className="rounded-lg border border-gray-700 bg-gray-800/60 p-4">
                    <div className="mb-3 flex items-start justify-between gap-3">
                      <p className="text-lg font-semibold text-white">{trip.time}</p>
                      <div className="flex items-center gap-1">
                        <Button variant="ghost" size="icon" onClick={() => openEditTrip(trip)} aria-label="Editar turno" className="h-8 w-8 text-gray-400 hover:text-blue-400">
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => deleteTrip(trip.id)} aria-label="Eliminar turno" className="h-8 w-8 text-gray-400 hover:text-red-400">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    <div className="space-y-2 text-sm">
                      <p className="flex gap-2 text-gray-300"><Phone className="mt-0.5 h-4 w-4 shrink-0 text-blue-400" /><a href={`https://wa.me/${trip.whatsapp.replace(/\D/g, "")}`} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline">{trip.whatsapp}</a></p>
                      <p className="flex gap-2 text-gray-300"><MapPin className="mt-0.5 h-4 w-4 shrink-0 text-green-400" /><span><strong className="font-medium text-gray-400">Origen:</strong> {trip.origin}</span></p>
                      <p className="flex gap-2 text-gray-300"><MapPin className="mt-0.5 h-4 w-4 shrink-0 text-orange-400" /><span><strong className="font-medium text-gray-400">Destino:</strong> {trip.destination}</span></p>
                      {trip.description && <p className="text-sm text-gray-400"><strong className="font-medium text-gray-500">Descripción:</strong> {trip.description}</p>}
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>
        )}

        <Card className="border-gray-700 bg-gray-900"><CardHeader><CardTitle className="text-white">Todos los turnos</CardTitle></CardHeader><CardContent className="space-y-3">{allTrips.map(trip=><div key={trip.id} className="rounded-lg border border-gray-700 p-3"><div className="font-semibold text-white">{trip.date} {trip.time}</div><a href={`https://wa.me/${trip.whatsapp.replace(/\D/g,"")}`} target="_blank" className="text-blue-400">{trip.whatsapp}</a><div>{trip.origin} → {trip.destination}</div>{trip.description&&<div className="text-gray-400">{trip.description}</div>}</div>)}</CardContent></Card>{isFormOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" role="dialog" aria-modal="true" aria-labelledby="new-trip-title">
            <Card className="w-full max-w-lg border-gray-700 bg-gray-900">
              <CardHeader className="flex flex-row items-center justify-between gap-4">
                <div>
                  <CardTitle id="new-trip-title" className="text-xl text-white">{editingTripId ? "Editar turno" : "Nuevo turno"}</CardTitle>
                  <p className="mt-1 text-sm text-gray-400">Completa los datos del viaje.</p>
                </div>
                <Button variant="ghost" size="icon" onClick={() => setIsFormOpen(false)} aria-label="Cerrar formulario">
                  <X className="h-4 w-4" />
                </Button>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2 sm:col-span-2">
                      <Label htmlFor="trip-whatsapp" className="text-gray-300">Número de WhatsApp</Label>
                      <Input id="trip-whatsapp" type="tel" required value={form.whatsapp} onChange={(event) => setForm({ ...form, whatsapp: event.target.value })} placeholder="+54 9 11 5555 5555" className="border-gray-600 bg-gray-800 text-white" />
                    </div>
                    <div className="space-y-2 sm:col-span-2">
                      <Label htmlFor="trip-origin" className="text-gray-300">Dirección de origen</Label>
                      <Input id="trip-origin" required value={form.origin} onChange={(event) => setForm({ ...form, origin: event.target.value })} placeholder="Lugar de retiro" className="border-gray-600 bg-gray-800 text-white" />
                    </div>
                    <div className="space-y-2 sm:col-span-2">
                      <Label htmlFor="trip-destination" className="text-gray-300">Dirección de destino</Label>
                      <Input id="trip-destination" required value={form.destination} onChange={(event) => setForm({ ...form, destination: event.target.value })} placeholder="Lugar de entrega" className="border-gray-600 bg-gray-800 text-white" />
                    </div>
                    <div className="space-y-2 sm:col-span-2">
                      <Label htmlFor="trip-description" className="text-gray-300">Descripción</Label>
                      <Input id="trip-description" value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} placeholder="Detalles del turno" className="border-gray-600 bg-gray-800 text-white" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="trip-date" className="text-gray-300">Fecha</Label>
                      <Input id="trip-date" type="date" required value={form.date} onChange={(event) => setForm({ ...form, date: event.target.value })} className="border-gray-600 bg-gray-800 text-white" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="trip-time" className="text-gray-300">Hora</Label>
                      <Input id="trip-time" type="time" required value={form.time} onChange={(event) => setForm({ ...form, time: event.target.value })} className="border-gray-600 bg-gray-800 text-white" />
                    </div>
                  </div>
                  <div className="flex justify-end gap-3 pt-2">
                    <Button type="button" variant="outline" onClick={() => setIsFormOpen(false)} disabled={isSaving}>Cancelar</Button>
                    <Button type="submit" disabled={isSaving} className="bg-blue-600 text-white hover:bg-blue-700">{isSaving ? "Guardando..." : editingTripId ? "Guardar cambios" : "Guardar turno"}</Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </AppShell>
  )
}
