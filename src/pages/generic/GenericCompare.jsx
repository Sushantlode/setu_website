import { useCallback, useEffect, useMemo, useState } from "react"
import { useNavigate } from "react-router-dom"
import { Loader2, Minus, Plus, Trash2 } from "lucide-react"
import { useAuth } from "../../context/AuthContext"
import { useGenericMedicine } from "../../context/GenericMedicineContext"
import { useToast } from "../../components/ui/Toast"
import {
  brandComparisonAdd,
  brandComparisonProceed,
  brandComparisonRemove,
  brandComparisonSaved,
  brandComparisonSearch,
  brandSearchBrandName,
  brandSearchBrandPrice,
  brandSearchCompany,
  brandSearchPackaging,
  compareBrandLineTotal,
  compareBrandUnitPrice,
  compareGenericLineTotal,
  compareGenericUnitPrice,
  compareItemQty,
  onboardUser,
} from "../../api/generic"
import GenericShell, { GenericPrimaryButton } from "../../components/generic/GenericShell"
import { ACCENT, formatInr } from "../../utils/generic"

function formatCompareInr(value) {
  const n = Number(value)
  if (!Number.isFinite(n)) return "₹0"
  return `₹${n.toLocaleString("en-IN", { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`
}

function flattenDayKeyed(raw) {
  if (!raw || typeof raw !== "object") return []
  const skip = new Set([
    "status",
    "Status",
    "success",
    "Success",
    "message",
    "messages",
    "data",
    "items",
    "list",
    "total_saving_amount",
    "total_saving_per",
    "total_brand_amt",
    "total_generic_amt",
  ])
  const items = []
  for (const [key, value] of Object.entries(raw)) {
    if (skip.has(key)) continue
    if (Array.isArray(value)) {
      items.push(...value.filter((e) => e && typeof e === "object"))
    } else if (value && typeof value === "object") {
      const numeric = Object.keys(value)
        .filter((k) => /^\d+$/.test(k))
        .sort((a, b) => Number(a) - Number(b))
        .map((k) => value[k])
      if (numeric.length) items.push(...numeric)
      else if (value.BrandMedicine || value.CalcItemID) items.push(value)
    }
  }
  return items
}

function parseSaved(raw) {
  if (!raw) return { items: [], summary: null }
  if (Array.isArray(raw)) return { items: raw, summary: null }
  let items = []
  if (Array.isArray(raw.items)) items = raw.items
  else if (Array.isArray(raw.data)) items = raw.data
  else if (Array.isArray(raw.list)) items = raw.list
  else items = flattenDayKeyed(raw)
  const summary = {
    total_saving_amount: raw.total_saving_amount,
    total_saving_per: raw.total_saving_per,
    total_brand_amt: raw.total_brand_amt,
    total_generic_amt: raw.total_generic_amt,
  }
  return { items, summary }
}

export default function GenericCompare() {
  const navigate = useNavigate()
  const { session } = useAuth()
  const toast = useToast()
  const { refreshCart } = useGenericMedicine()
  const [query, setQuery] = useState("")
  const [results, setResults] = useState([])
  const [searching, setSearching] = useState(false)
  const [items, setItems] = useState([])
  const [summary, setSummary] = useState(null)
  const [displayed, setDisplayed] = useState(null)
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState("")
  const [proceeding, setProceeding] = useState(false)
  const [error, setError] = useState("")
  const [qtyModal, setQtyModal] = useState(null)
  const [qty, setQty] = useState(1)

  const loadSaved = useCallback(async () => {
    setLoading(true)
    setError("")
    try {
      // Ensure vendor m_key exists before saved/search calls
      await onboardUser(session)
      const raw = await brandComparisonSaved(session)
      const parsed = parseSaved(raw)
      setItems(parsed.items)
      setSummary(parsed.summary)
      setDisplayed((prev) => {
        if (prev) {
          const still = parsed.items.find(
            (it) => String(it.CalcItemID) === String(prev.CalcItemID),
          )
          if (still) return still
        }
        return parsed.items[parsed.items.length - 1] || null
      })
    } catch (err) {
      // Match RN: failed saved fetch → empty list, not a broken screen
      console.warn("[generic/compare] saved fetch", err)
      setItems([])
      setSummary(null)
      setDisplayed(null)
    } finally {
      setLoading(false)
    }
  }, [session])

  useEffect(() => {
    loadSaved()
  }, [loadSaved])

  useEffect(() => {
    const q = query.trim()
    if (q.length <= 2) {
      setResults([])
      return undefined
    }
    let cancelled = false
    const t = setTimeout(async () => {
      setSearching(true)
      try {
        const list = await brandComparisonSearch(session, q)
        if (!cancelled) setResults(Array.isArray(list) ? list : [])
      } catch {
        if (!cancelled) setResults([])
      } finally {
        if (!cancelled) setSearching(false)
      }
    }, 350)
    return () => {
      cancelled = true
      clearTimeout(t)
    }
  }, [session, query])

  const totals = useMemo(() => {
    if (summary?.total_saving_amount != null) return summary
    let brand = 0
    let generic = 0
    items.forEach((it) => {
      brand += compareBrandLineTotal(it)
      generic += compareGenericLineTotal(it)
    })
    const saving = Math.max(0, brand - generic)
    return {
      total_brand_amt: brand,
      total_generic_amt: generic,
      total_saving_amount: saving,
      total_saving_per: brand > 0 ? Math.round((saving / brand) * 100) : 0,
    }
  }, [items, summary])

  const addSelected = async () => {
    if (!qtyModal) return
    const rowId = qtyModal.MedicineRowID || qtyModal.medicine_row_id
    setBusy(String(rowId))
    try {
      const data = await brandComparisonAdd(session, rowId, qty)
      const updated = Array.isArray(data?.data) ? data.data : null
      if (updated?.length) {
        setItems(updated)
        setSummary({
          total_saving_amount: data.total_saving_amount,
          total_saving_per: data.total_saving_per,
          total_brand_amt: data.total_brand_amt,
          total_generic_amt: data.total_generic_amt,
        })
        const match = updated.find((it) => it.BrandMedicine === qtyModal.BrandName)
        setDisplayed(match || updated[updated.length - 1])
      } else {
        await loadSaved()
      }
      setQtyModal(null)
      setQuery("")
      setResults([])
      toast.success("Added to comparison")
    } catch (err) {
      toast.error(err.message || "Could not add to comparison")
    } finally {
      setBusy("")
    }
  }

  const removeItem = async (calcItemId) => {
    setBusy(String(calcItemId))
    try {
      await brandComparisonRemove(session, calcItemId)
      await loadSaved()
      toast.info("Removed from comparison")
    } catch (err) {
      toast.error(err.message || "Could not remove")
    } finally {
      setBusy("")
    }
  }

  const proceed = async () => {
    setProceeding(true)
    setError("")
    try {
      await brandComparisonProceed(session)
      await refreshCart()
      toast.success("Generics added to cart")
      navigate("/app/generic-medicine/cart")
    } catch (err) {
      const msg = err.message || "Could not add comparison to cart"
      setError(msg)
      toast.error(msg)
    } finally {
      setProceeding(false)
    }
  }

  return (
    <GenericShell title="Branded vs Generic">
      <div className="space-y-4">
        {error && (
          <p className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
        )}

        <div className="relative">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search branded medicine (min 3 letters)"
            className="w-full rounded-2xl border border-teal-100 bg-white px-4 py-3 text-sm outline-none ring-teal-300 focus:ring-2"
          />
          {(searching || results.length > 0) && (
            <div className="absolute z-10 mt-2 max-h-64 w-full overflow-auto rounded-2xl border border-teal-100 bg-white shadow-lg">
              {searching && (
                <p className="flex items-center gap-2 px-4 py-3 text-sm text-setu-muted">
                  <Loader2 className="animate-spin" size={14} /> Searching…
                </p>
              )}
              {results.map((row) => {
                const brand = brandSearchBrandName(row)
                const company = brandSearchCompany(row)
                const pack = brandSearchPackaging(row)
                const price = brandSearchBrandPrice(row)
                return (
                  <button
                    key={row.MedicineRowID || brand}
                    type="button"
                    className="flex w-full items-start justify-between gap-3 px-4 py-3 text-left text-sm hover:bg-teal-50"
                    onClick={() => {
                      setQty(1)
                      setQtyModal(row)
                    }}
                  >
                    <span className="min-w-0">
                      <span className="block font-medium">{brand}</span>
                      {company && (
                        <span className="block text-xs text-setu-muted">{company}</span>
                      )}
                      {pack && (
                        <span className="block text-xs text-setu-muted">{pack}</span>
                      )}
                    </span>
                    {price != null && (
                      <span className="shrink-0 font-semibold" style={{ color: ACCENT }}>
                        {formatInr(price)}
                      </span>
                    )}
                  </button>
                )
              })}
            </div>
          )}
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="animate-spin text-teal-700" />
          </div>
        ) : items.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-teal-200 bg-white p-8 text-center">
            <p className="font-semibold">No medicines in comparison yet</p>
            <p className="mt-1 text-sm text-setu-muted">
              Search a branded medicine above, tap a result, and add it to see the generic
              alternative and savings.
            </p>
          </div>
        ) : (
          <>
            {displayed && (
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-2xl border border-amber-200 bg-amber-50/50 p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-amber-800">
                    Brand
                  </p>
                  <p className="mt-2 font-semibold">{displayed.BrandMedicine}</p>
                  <p className="mt-2 text-lg font-bold">
                    {formatCompareInr(compareBrandLineTotal(displayed))}
                  </p>
                  {compareItemQty(displayed) > 1 && (
                    <p className="mt-1 text-xs text-amber-900/80">
                      {formatCompareInr(compareBrandUnitPrice(displayed))} ×{" "}
                      {compareItemQty(displayed)}
                    </p>
                  )}
                </div>
                <div className="rounded-2xl border border-teal-200 bg-teal-50/60 p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-teal-800">
                    Generic
                  </p>
                  <p className="mt-2 font-semibold">{displayed.GenericMedicine}</p>
                  <p className="mt-2 text-lg font-bold" style={{ color: ACCENT }}>
                    {formatCompareInr(compareGenericLineTotal(displayed))}
                  </p>
                  {compareItemQty(displayed) > 1 && (
                    <p className="mt-1 text-xs text-teal-900/80">
                      {formatCompareInr(compareGenericUnitPrice(displayed))} ×{" "}
                      {compareItemQty(displayed)}
                    </p>
                  )}
                </div>
              </div>
            )}

            {displayed && (
              <div className="rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
                You save{" "}
                <strong>{formatCompareInr(displayed.SavingAmount)}</strong> (
                {displayed.SavingPercent}%)
              </div>
            )}

            <div className="space-y-2">
              {items.map((item) => (
                <div
                  key={item.CalcItemID}
                  className={`flex w-full items-start gap-2 rounded-2xl border bg-white p-2 ${
                    String(displayed?.CalcItemID) === String(item.CalcItemID)
                      ? "border-teal-500"
                      : "border-teal-100"
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => setDisplayed(item)}
                    className="min-w-0 flex-1 rounded-xl p-2 text-left"
                  >
                    <p className="font-semibold line-clamp-1">{item.BrandMedicine}</p>
                    <p className="text-xs text-setu-muted line-clamp-1">
                      → {item.GenericMedicine}
                    </p>
                    <p className="mt-1 text-xs font-semibold text-emerald-700">
                      Save {formatCompareInr(item.SavingAmount)} · {item.SavingPercent}%
                    </p>
                  </button>
                  <button
                    type="button"
                    className="shrink-0 rounded-full p-2 text-red-600 hover:bg-red-50"
                    disabled={busy === String(item.CalcItemID)}
                    onClick={() => removeItem(item.CalcItemID)}
                    aria-label="Remove comparison item"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
            </div>

            <div className="rounded-2xl border border-teal-100 bg-white p-4 text-sm">
              <div className="flex justify-between">
                <span className="text-setu-muted">Brand total</span>
                <span>{formatInr(totals.total_brand_amt)}</span>
              </div>
              <div className="mt-1 flex justify-between">
                <span className="text-setu-muted">Generic total</span>
                <span>{formatInr(totals.total_generic_amt)}</span>
              </div>
              <div className="mt-2 flex justify-between border-t border-teal-50 pt-2 font-semibold text-emerald-700">
                <span>Total savings</span>
                <span>
                  {formatInr(totals.total_saving_amount)} (
                  {totals.total_saving_per}%)
                </span>
              </div>
            </div>

            <GenericPrimaryButton onClick={proceed} disabled={proceeding}>
              {proceeding ? "Adding to cart…" : "Proceed with generics → Cart"}
            </GenericPrimaryButton>
          </>
        )}
      </div>

      {qtyModal && (
        <div className="fixed inset-0 z-40 flex items-end justify-center bg-black/40 p-4 sm:items-center">
          <div className="w-full max-w-md rounded-3xl bg-white p-5 shadow-xl">
            <h3 className="font-display text-xl">Select quantity</h3>
            <p className="mt-1 text-sm text-setu-muted">
              {brandSearchBrandName(qtyModal)}
              {brandSearchPackaging(qtyModal)
                ? ` · ${brandSearchPackaging(qtyModal)}`
                : ""}
            </p>
            {brandSearchCompany(qtyModal) && (
              <p className="text-xs text-setu-muted">{brandSearchCompany(qtyModal)}</p>
            )}
            <div className="mt-4 flex items-center justify-center gap-4">
              <button
                type="button"
                className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-teal-50"
                onClick={() => setQty((q) => Math.max(1, q - 1))}
              >
                <Minus size={16} />
              </button>
              <span className="w-8 text-center text-lg font-semibold">{qty}</span>
              <button
                type="button"
                className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-teal-50"
                onClick={() => setQty((q) => q + 1)}
              >
                <Plus size={16} />
              </button>
            </div>
            <div className="mt-5 flex gap-2">
              <button
                type="button"
                className="flex-1 rounded-2xl border border-teal-200 py-3 text-sm font-semibold"
                onClick={() => setQtyModal(null)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="flex-1 rounded-2xl py-3 text-sm font-semibold text-white"
                style={{ backgroundColor: ACCENT }}
                disabled={!!busy}
                onClick={addSelected}
              >
                {busy ? "Adding…" : "Add"}
              </button>
            </div>
          </div>
        </div>
      )}
    </GenericShell>
  )
}
