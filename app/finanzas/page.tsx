"use client"

import { useEffect, useMemo, useState } from "react"
import {
  ArrowDownCircle,
  ArrowUpCircle,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Plus,
  Trash2,
} from "lucide-react"
import { AppShell } from "@/components/app-shell"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { apiClient } from "@/lib/api-client"

type FinanceType = "ingreso" | "egreso"
type FinanceCategory =
  | "guardamuebles"
  | "viaje"
  | "varios"
  | "empleados"
  | "combustible"
  | "gastos varios"
  | "materiales"
  | "publicidad"

type FinanceEntry = {
  id: string
  type: FinanceType
  category: FinanceCategory
  amount: number
  date: string
  description: string
  createdAt: number
}

type FormState = {
  type: FinanceType
  category: FinanceCategory
  amount: string
  date: string
  description: string
}

const FINANCE_ENDPOINT = "/api/finanzas"
const incomeCategories: FinanceCategory[] = ["guardamuebles", "viaje", "varios"]
const expenseCategories: FinanceCategory[] = [
  "empleados",
  "combustible",
  "gastos varios",
  "materiales",
  "publicidad",
]
const allCategories: FinanceCategory[] = [...incomeCategories, ...expenseCategories]

const categoryLabels: Record<FinanceCategory, string> = {
  guardamuebles: "Guardamuebles",
  viaje: "Viaje",
  varios: "Varios",
  empleados: "Empleados",
  combustible: "Combustible",
  "gastos varios": "Gastos varios",
  materiales: "Materiales",
  publicidad: "Publicidad",
}

const formatter = new Intl.NumberFormat("es-AR", {
  style: "currency",
  currency: "ARS",
})

const today = new Date().toISOString().slice(0, 10)

const emptyForm: FormState = {
  type: "egreso",
  category: "empleados",
  amount: "",
  date: today,
  description: "",
}

function formatDateKey(date: Date) {
  const year = date.getFullYear()
  const month = `${date.getMonth() + 1}`.padStart(2, "0")
  const day = `${date.getDate()}`.padStart(2, "0")
  return `${year}-${month}-${day}`
}

function parseDateKey(dateKey: string) {
  const [year, month, day] = dateKey.split("-").map(Number)
  return new Date(year, month - 1, day)
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

export default function FinanzasPage() {
  const [entries, setEntries] = useState<FinanceEntry[]>([])
  const [form, setForm] = useState<FormState>(emptyForm)
  const [selectedDate, setSelectedDate] = useState(today)
  const [month, setMonth] = useState(() => new Date())
  const [selectedCategory, setSelectedCategory] = useState<FinanceCategory | "todos" | FinanceType>("todos")
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  async function loadEntries() {
    setIsLoading(true)
    setError(null)

    const response = await apiClient.get<FinanceEntry[]>(FINANCE_ENDPOINT)

    if (response.error) {
      setError(response.error)
      setEntries([])
    } else {
      setEntries(response.data ?? [])
    }

    setIsLoading(false)
  }

  useEffect(() => {
    void loadEntries()
  }, [])

  const summary = useMemo(() => {
    const ingresos = entries
      .filter((entry) => entry.type === "ingreso")
      .reduce((sum, entry) => sum + entry.amount, 0)

    const egresos = entries
      .filter((entry) => entry.type === "egreso")
      .reduce((sum, entry) => sum + entry.amount, 0)

    return {
      ingresos,
      egresos,
      total: ingresos - egresos,
    }
  }, [entries])

  const orderedEntries = useMemo(
    () =>
      [...entries].sort(
        (a, b) => b.date.localeCompare(a.date) || b.createdAt - a.createdAt,
      ),
    [entries],
  )

  const calendarDays = useMemo(() => getCalendarDays(month), [month])

  const selectedDateEntries = useMemo(
    () =>
      orderedEntries.filter((entry) => {
        const matchesDate = entry.date === selectedDate

        if (selectedCategory === "todos") return matchesDate
        if (selectedCategory === "ingreso" || selectedCategory === "egreso") {
          return matchesDate && entry.type === selectedCategory
        }

        return matchesDate && entry.category === selectedCategory
      }),
    [orderedEntries, selectedCategory, selectedDate],
  )

  const groupedHistory = useMemo(() => {
    const grouped = new Map<string, FinanceEntry[]>()

    orderedEntries.forEach((entry) => {
      const key = entry.category
      const list = grouped.get(key) ?? []
      list.push(entry)
      grouped.set(key, list)
    })

    return [...grouped.entries()].map(([key, list]) => ({
      key,
      label: categoryLabels[key as FinanceCategory],
      entries: list,
    }))
  }, [orderedEntries])

  function updateForm<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((current) => ({ ...current, [key]: value }))
  }

  function handleTypeChange(nextType: FinanceType) {
    setForm((current) => ({
      ...current,
      type: nextType,
      category:
        nextType === "ingreso"
          ? incomeCategories.includes(current.category as FinanceCategory)
            ? (current.category as FinanceCategory)
            : incomeCategories[0]
          : expenseCategories.includes(current.category as FinanceCategory)
            ? (current.category as FinanceCategory)
            : expenseCategories[0],
    }))
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const amount = Number(form.amount)
    if (!form.date || Number.isNaN(amount) || amount <= 0) {
      return
    }

    const payload = {
      type: form.type,
      category: form.category,
      amount,
      date: form.date,
      description: form.description.trim(),
    }

    const response = await apiClient.post<FinanceEntry>(FINANCE_ENDPOINT, payload)

    if (response.error) {
      setError(response.error)
      return
    }

    setSelectedDate(form.date)
    setMonth(parseDateKey(form.date))
    setForm({ ...emptyForm, date: form.date })
    await loadEntries()
  }

  async function removeEntry(id: string) {
    setError(null)
    const response = await apiClient.delete(`${FINANCE_ENDPOINT}/${id}`)

    if (response.error) {
      setError(response.error)
      return
    }

    setEntries((current) => current.filter((entry) => entry.id !== id))
  }

  const monthName = new Intl.DateTimeFormat("es-AR", {
    month: "long",
    year: "numeric",
  }).format(month)

  const isIncomeCategory = (category: FinanceCategory) => incomeCategories.includes(category)

  const selectedDateSummary = useMemo(() => {
    const ingresos = selectedDateEntries
      .filter((entry) => entry.type === "ingreso")
      .reduce((sum, entry) => sum + entry.amount, 0)

    const egresos = selectedDateEntries
      .filter((entry) => entry.type === "egreso")
      .reduce((sum, entry) => sum + entry.amount, 0)

    return {
      ingresos,
      egresos,
      total: ingresos - egresos,
    }
  }, [selectedDateEntries])

  const monthSummary = useMemo(() => {
    const ingresos = entries
      .filter((entry) => entry.type === "ingreso" && entry.date.startsWith(`${month.getFullYear()}-${String(month.getMonth() + 1).padStart(2, "0")}`))
      .reduce((sum, entry) => sum + entry.amount, 0)

    const egresos = entries
      .filter((entry) => entry.type === "egreso" && entry.date.startsWith(`${month.getFullYear()}-${String(month.getMonth() + 1).padStart(2, "0")}`))
      .reduce((sum, entry) => sum + entry.amount, 0)

    return {
      ingresos,
      egresos,
      total: ingresos - egresos,
    }
  }, [entries, month])

  return (
    <AppShell title="Finanzas">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6">
        <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-sm font-medium text-emerald-500">Control financiero</p>
            <h2 className="text-2xl font-semibold text-foreground">Ingresos y egresos</h2>
          </div>
        </div>

        {error && (
          <div className="rounded-lg border border-red-800 bg-red-950/30 px-4 py-3 text-sm text-red-400" role="alert">
            {error}
          </div>
        )}

        {isLoading ? (
          <Card>
            <CardContent className="py-8 text-center text-sm text-muted-foreground">
              Cargando movimientos...
            </CardContent>
          </Card>
        ) : (
          <>
            <div className="grid gap-4 md:grid-cols-3">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-emerald-600">
                    <ArrowUpCircle className="h-4 w-4" />
                    Entradas
                  </CardTitle>
                  <CardDescription>Total de dinero que entró</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-semibold text-emerald-600">
                    {formatter.format(summary.ingresos)}
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-rose-600">
                    <ArrowDownCircle className="h-4 w-4" />
                    Salidas
                  </CardTitle>
                  <CardDescription>Total de dinero que salió</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-semibold text-rose-600">
                    {formatter.format(summary.egresos)}
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Balance</CardTitle>
                  <CardDescription>Resultado neto actual</CardDescription>
                </CardHeader>
                <CardContent>
                  <p
                    className={`text-2xl font-semibold ${
                      summary.total >= 0 ? "text-emerald-600" : "text-rose-600"
                    }`}
                  >
                    {formatter.format(summary.total)}
                  </p>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Resumen del mes</CardTitle>
                <CardDescription>{monthName}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-3 md:grid-cols-3">
                  <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/5 p-3">
                    <p className="text-xs text-muted-foreground">Ganado</p>
                    <p className="mt-2 text-xl font-semibold text-emerald-600">{formatter.format(monthSummary.ingresos)}</p>
                  </div>
                  <div className="rounded-lg border border-rose-500/30 bg-rose-500/5 p-3">
                    <p className="text-xs text-muted-foreground">Gastado</p>
                    <p className="mt-2 text-xl font-semibold text-rose-600">{formatter.format(monthSummary.egresos)}</p>
                  </div>
                  <div className="rounded-lg border border-border bg-background p-3">
                    <p className="text-xs text-muted-foreground">Neto</p>
                    <p className={`mt-2 text-xl font-semibold ${monthSummary.total >= 0 ? "text-emerald-600" : "text-rose-600"}`}>
                      {formatter.format(monthSummary.total)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="grid gap-6 xl:grid-cols-[1.2fr_1.8fr]">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CalendarDays className="h-4 w-4" />
                    Calendario
                  </CardTitle>
                  <CardDescription>Movimientos por día del mes</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="mb-4 flex items-center justify-between gap-3">
                    <button
                      type="button"
                      className="rounded-md border border-border p-2 transition-colors hover:bg-muted"
                      aria-label="Mes anterior"
                      onClick={() => setMonth((current) => new Date(current.getFullYear(), current.getMonth() - 1, 1))}
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </button>
                    <span className="text-base font-semibold capitalize">{monthName}</span>
                    <button
                      type="button"
                      className="rounded-md border border-border p-2 transition-colors hover:bg-muted"
                      aria-label="Mes siguiente"
                      onClick={() => setMonth((current) => new Date(current.getFullYear(), current.getMonth() + 1, 1))}
                    >
                      <ChevronRight className="h-4 w-4" />
                    </button>
                  </div>

                  <div className="grid grid-cols-7 gap-2 text-center text-xs text-muted-foreground">
                    {['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'].map((day) => (
                      <div key={day} className="py-1 font-medium">
                        {day}
                      </div>
                    ))}
                  </div>

                  <div className="mt-2 grid grid-cols-7 gap-2">
                    {calendarDays.map((date) => {
                      const dateKey = formatDateKey(date)
                      const isCurrentMonth = date.getMonth() === month.getMonth()
                      const isSelected = dateKey === selectedDate
                      const entriesForDay = entries.filter((entry) => entry.date === dateKey)
                      const dayTotal = entriesForDay.reduce(
                        (sum, entry) => sum + (entry.type === "ingreso" ? entry.amount : -entry.amount),
                        0,
                      )

                      return (
                        <button
                          key={dateKey}
                          type="button"
                          onClick={() => setSelectedDate(dateKey)}
                          className={[
                            "min-h-20 rounded-lg border p-1 text-left transition-colors",
                            isCurrentMonth ? "border-border bg-background" : "border-muted bg-muted/20 text-muted-foreground",
                            isSelected ? "border-emerald-500 bg-emerald-500/5" : "",
                          ].join(" ")}
                        >
                          <div className="flex items-center justify-between text-xs">
                            <span className={isSelected ? "font-semibold text-emerald-600" : ""}>{date.getDate()}</span>
                            {entriesForDay.length > 0 && (
                              <span className={`h-2 w-2 rounded-full ${dayTotal >= 0 ? "bg-emerald-500" : "bg-rose-500"}`} />
                            )}
                          </div>

                          {entriesForDay.length > 0 && (
                            <div className={`mt-2 text-[10px] font-medium ${dayTotal >= 0 ? "text-emerald-600" : "text-rose-500"}`}>
                              {dayTotal >= 0 ? "+" : "-"}
                              {formatter.format(Math.abs(dayTotal))}
                            </div>
                          )}
                        </button>
                      )
                    })}
                  </div>

                  <div className="mt-5 rounded-lg border border-border bg-muted/20 p-3">
                    <div className="mb-2 flex items-center justify-between gap-3">
                      <p className="font-medium">Movimientos del día</p>
                      <span className="text-xs text-muted-foreground">
                        {new Date(`${selectedDate}T00:00:00`).toLocaleDateString("es-AR", {
                          day: "2-digit",
                          month: "2-digit",
                          year: "numeric",
                        })}
                      </span>
                    </div>

                    <div className="mb-3 grid grid-cols-3 gap-2 text-xs">
                      <div className="rounded-md border border-emerald-500/30 bg-emerald-500/5 p-2 text-center">
                        <p className="text-muted-foreground">Ganado</p>
                        <p className="mt-1 font-semibold text-emerald-600">{formatter.format(selectedDateSummary.ingresos)}</p>
                      </div>
                      <div className="rounded-md border border-rose-500/30 bg-rose-500/5 p-2 text-center">
                        <p className="text-muted-foreground">Gastado</p>
                        <p className="mt-1 font-semibold text-rose-600">{formatter.format(selectedDateSummary.egresos)}</p>
                      </div>
                      <div className="rounded-md border border-border bg-background p-2 text-center">
                        <p className="text-muted-foreground">Total</p>
                        <p className={`mt-1 font-semibold ${selectedDateSummary.total >= 0 ? "text-emerald-600" : "text-rose-600"}`}>
                          {formatter.format(selectedDateSummary.total)}
                        </p>
                      </div>
                    </div>

                    {selectedDateEntries.length === 0 ? (
                      <p className="text-sm text-muted-foreground">No hay movimientos para esta fecha.</p>
                    ) : (
                      <div className="space-y-2">
                        {selectedDateEntries.map((entry) => (
                          <div
                            key={entry.id}
                            className="flex items-center justify-between gap-3 rounded-md border border-border bg-background px-2 py-2"
                          >
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-medium capitalize">{entry.type}</span>
                                <span
                                  className={[
                                    "rounded px-1.5 py-0.5 text-[10px] uppercase tracking-wide",
                                    isIncomeCategory(entry.category)
                                      ? "bg-emerald-500/10 text-emerald-600"
                                      : "bg-rose-500/10 text-rose-600",
                                  ].join(" ")}
                                >
                                  {categoryLabels[entry.category]}
                                </span>
                              </div>
                              <p className="text-xs text-muted-foreground">
                                {entry.description || "Sin descripción"}
                              </p>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className={entry.type === "ingreso" ? "font-semibold text-emerald-600" : "font-semibold text-rose-600"}>
                                {entry.type === "ingreso" ? "+" : "-"}
                                {formatter.format(entry.amount)}
                              </span>
                              <button
                                type="button"
                                onClick={() => removeEntry(entry.id)}
                                aria-label="Eliminar movimiento del calendario"
                                className="rounded-md p-1 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Plus className="h-4 w-4" />
                      Nuevo movimiento
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <form className="space-y-4" onSubmit={handleSubmit}>
                      <div className="space-y-2">
                        <Label htmlFor="finance-type">Tipo</Label>
                        <select
                          id="finance-type"
                          value={form.type}
                          onChange={(event) => handleTypeChange(event.target.value as FinanceType)}
                          className="h-9 w-full rounded-lg border border-input bg-background px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                        >
                          <option value="ingreso">Ingreso</option>
                          <option value="egreso">Egreso</option>
                        </select>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="finance-category">Categoría</Label>
                        <select
                          id="finance-category"
                          value={form.category}
                          onChange={(event) => updateForm("category", event.target.value as FinanceCategory)}
                          className="h-9 w-full rounded-lg border border-input bg-background px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                        >
                          {(form.type === "ingreso" ? incomeCategories : expenseCategories).map((category) => (
                            <option key={category} value={category}>
                              {categoryLabels[category]}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="finance-amount">Monto</Label>
                        <Input
                          id="finance-amount"
                          type="number"
                          min="0"
                          step="0.01"
                          value={form.amount}
                          onChange={(event) => updateForm("amount", event.target.value)}
                          placeholder="0.00"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="finance-date">Fecha</Label>
                        <Input
                          id="finance-date"
                          type="date"
                          value={form.date}
                          onChange={(event) => updateForm("date", event.target.value)}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="finance-description">Descripción opcional</Label>
                        <textarea
                          id="finance-description"
                          value={form.description}
                          onChange={(event) => updateForm("description", event.target.value)}
                          rows={4}
                          placeholder="Ej: Pago de alquiler, cobro de reserva, compra de materiales..."
                          className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                        />
                      </div>

                      <Button type="submit" className="w-full">
                        Guardar movimiento
                      </Button>
                    </form>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Historial por categoría</CardTitle>
                    <CardDescription>Filtrado y agrupado para revisar cada rubro</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="mb-4 flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => setSelectedCategory("todos")}
                        className={[
                          "rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
                          selectedCategory === "todos"
                            ? "border-emerald-500 bg-emerald-500/10 text-emerald-600"
                            : "border-border bg-background text-muted-foreground hover:bg-muted",
                        ].join(" ")}
                      >
                        Todos
                      </button>
                      <button
                        type="button"
                        onClick={() => setSelectedCategory("ingreso")}
                        className={[
                          "rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
                          selectedCategory === "ingreso"
                            ? "border-emerald-500 bg-emerald-500/10 text-emerald-600"
                            : "border-border bg-background text-muted-foreground hover:bg-muted",
                        ].join(" ")}
                      >
                        Ingresos
                      </button>
                      <button
                        type="button"
                        onClick={() => setSelectedCategory("egreso")}
                        className={[
                          "rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
                          selectedCategory === "egreso"
                            ? "border-rose-500 bg-rose-500/10 text-rose-600"
                            : "border-border bg-background text-muted-foreground hover:bg-muted",
                        ].join(" ")}
                      >
                        Egresos
                      </button>
                      {allCategories.map((category) => (
                        <button
                          key={category}
                          type="button"
                          onClick={() => setSelectedCategory(category)}
                          className={[
                            "rounded-full border px-3 py-1.5 text-xs font-medium capitalize transition-colors",
                            selectedCategory === category
                              ? isIncomeCategory(category)
                                ? "border-emerald-500 bg-emerald-500/10 text-emerald-600"
                                : "border-rose-500 bg-rose-500/10 text-rose-600"
                              : "border-border bg-background text-muted-foreground hover:bg-muted",
                          ].join(" ")}
                        >
                          {categoryLabels[category]}
                        </button>
                      ))}
                    </div>

                    <div className="space-y-4">
                      {groupedHistory.length === 0 ? (
                        <p className="text-sm text-muted-foreground">No hay movimientos para mostrar.</p>
                      ) : (
                        groupedHistory
                          .filter((group) => {
                            if (selectedCategory === "todos") return true
                            if (selectedCategory === "ingreso") return group.entries.some((entry) => entry.type === "ingreso")
                            if (selectedCategory === "egreso") return group.entries.some((entry) => entry.type === "egreso")
                            return group.key === selectedCategory
                          })
                          .map((group) => (
                            <div key={group.key} className="rounded-xl border border-border bg-muted/20 p-3">
                              <div className="mb-3 flex items-center justify-between gap-3">
                                <span className="font-semibold capitalize">{group.label}</span>
                                <span className="text-sm text-muted-foreground">
                                  {group.entries.reduce((sum, entry) => sum + entry.amount, 0).toLocaleString("es-AR", {
                                    style: "currency",
                                    currency: "ARS",
                                  })}
                                </span>
                              </div>

                              <div className="space-y-2">
                                {group.entries.map((entry) => (
                                  <div
                                    key={entry.id}
                                    className="flex items-center justify-between gap-3 rounded-md border border-border bg-background px-2 py-2"
                                  >
                                    <div>
                                      <p className="text-sm font-medium">
                                        {categoryLabels[entry.category]}
                                      </p>
                                      <p className="text-xs text-muted-foreground">
                                        {new Date(`${entry.date}T00:00:00`).toLocaleDateString("es-AR", {
                                          day: "2-digit",
                                          month: "2-digit",
                                          year: "numeric",
                                        })}
                                      </p>
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <span className={entry.type === "ingreso" ? "font-semibold text-emerald-600" : "font-semibold text-rose-600"}>
                                        {entry.type === "ingreso" ? "+" : "-"}
                                        {formatter.format(entry.amount)}
                                      </span>
                                      <button
                                        type="button"
                                        onClick={() => removeEntry(entry.id)}
                                        aria-label="Eliminar movimiento"
                                        className="rounded-md p-1 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                                      >
                                        <Trash2 className="h-3.5 w-3.5" />
                                      </button>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          ))
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </>
        )}
      </div>
    </AppShell>
  )
}

