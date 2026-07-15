import { useEffect, useState } from "react"
import { Link, useParams } from "react-router-dom"
import { Heart, Loader2 } from "lucide-react"
import {
  fetchHealthySwaps,
  fetchPublicRecipes,
  fetchRecipe,
  fetchRecipesByMeal,
  fetchSavedRecipes,
  fetchUserPlans,
  fitnessImage,
  patchUserPlanStatus,
  deleteUserPlan,
  saveRecipe,
  unsaveRecipe,
  MEAL_TYPES,
} from "../../api/fitness"
import { FitnessShell } from "./FitnessShell"
import { FitnessGateLoader, useFitnessGate } from "./useFitnessGate"

export default function FitnessRecipes() {
  const { ready, auth } = useFitnessGate()
  const [meal, setMeal] = useState("all")
  const [recipes, setRecipes] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    if (!ready) return
    let cancelled = false
    ;(async () => {
      setLoading(true)
      setError("")
      try {
        const list =
          meal === "all"
            ? await fetchPublicRecipes()
            : await fetchRecipesByMeal(meal)
        if (!cancelled) setRecipes(list)
      } catch (err) {
        if (!cancelled) setError(err.message || "Failed to load recipes")
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [ready, meal, auth])

  if (!ready) {
    return (
      <FitnessShell title="Recipes" backTo="/app/fitness/food" showTabs={false}>
        <FitnessGateLoader />
      </FitnessShell>
    )
  }

  return (
    <FitnessShell
      title="Recipes"
      backTo="/app/fitness/food"
      showTabs={false}
      rightAction={
        <Link to="/app/fitness/recipes/saved" className="text-xs font-semibold text-white">
          Saved
        </Link>
      }
    >
      <div className="-mx-1 mb-4 flex gap-2 overflow-x-auto px-1 pb-1">
        {["all", ...MEAL_TYPES.filter((t) => t !== "snacks"), "snack"].map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setMeal(t === "snack" ? "snacks" : t)}
            className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-semibold capitalize ${
              meal === t || (t === "snack" && meal === "snacks")
                ? "bg-[#10B981] text-white"
                : "bg-white text-[#374151] ring-1 ring-[#E5E7EB]"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-16 text-[#10B981]">
          <Loader2 className="animate-spin" size={28} />
        </div>
      ) : error ? (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {recipes.map((r) => {
            const id = r.id || r.recipe_id
            return (
              <Link
                key={id}
                to={`/app/fitness/recipes/${encodeURIComponent(id)}`}
                className="overflow-hidden rounded-2xl border border-[#E5E7EB] bg-white shadow-sm"
              >
                <img
                  src={fitnessImage(r.image_url || r.image || r.thumbnail)}
                  alt=""
                  className="h-36 w-full object-cover"
                />
                <div className="p-3">
                  <p className="font-semibold text-[#111827]">
                    {r.title || r.name}
                  </p>
                  <p className="mt-0.5 text-xs text-[#6B7280]">
                    {r.calories ? `${Math.round(r.calories)} kcal` : r.meal_type || ""}
                  </p>
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </FitnessShell>
  )
}

export function FitnessRecipeDetail() {
  const { recipeId } = useParams()
  const { ready, auth } = useFitnessGate()
  const [recipe, setRecipe] = useState(null)
  const [saved, setSaved] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    if (!ready || !recipeId) return
    let cancelled = false
    ;(async () => {
      setLoading(true)
      try {
        const [r, savedList] = await Promise.all([
          fetchRecipe(auth, recipeId),
          fetchSavedRecipes(auth).catch(() => []),
        ])
        if (cancelled) return
        setRecipe(r)
        setSaved(
          savedList.some(
            (x) => String(x.id || x.recipe_id) === String(recipeId),
          ),
        )
      } catch (err) {
        if (!cancelled) setError(err.message || "Failed to load recipe")
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [ready, auth, recipeId])

  const toggleSave = async () => {
    try {
      if (saved) await unsaveRecipe(auth, recipeId)
      else await saveRecipe(auth, recipeId)
      setSaved(!saved)
    } catch (err) {
      setError(err.message || "Failed to update saved recipe")
    }
  }

  if (!ready) {
    return (
      <FitnessShell title="Recipe" backTo="/app/fitness/recipes" showTabs={false}>
        <FitnessGateLoader />
      </FitnessShell>
    )
  }

  const title = recipe?.title || recipe?.name || "Recipe"
  const ingredients =
    recipe?.ingredients ||
    recipe?.items ||
    recipe?.ingredient_list ||
    []

  return (
    <FitnessShell
      title={title}
      backTo="/app/fitness/recipes"
      showTabs={false}
      rightAction={
        <button type="button" onClick={toggleSave} className="text-white">
          <Heart size={18} fill={saved ? "white" : "none"} />
        </button>
      }
    >
      {loading ? (
        <div className="flex justify-center py-16 text-[#10B981]">
          <Loader2 className="animate-spin" size={28} />
        </div>
      ) : error && !recipe ? (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
      ) : (
        <div className="space-y-4">
          <img
            src={fitnessImage(recipe?.image_url || recipe?.image)}
            alt=""
            className="w-full rounded-2xl object-cover"
          />
          <div className="rounded-2xl border border-[#E5E7EB] bg-white p-4 shadow-sm">
            <h2 className="text-lg font-semibold text-[#111827]">{title}</h2>
            <p className="mt-2 text-sm text-[#4B5563]">
              {recipe?.description || recipe?.instructions || ""}
            </p>
            {recipe?.calories != null && (
              <p className="mt-2 text-sm font-medium text-[#10B981]">
                {Math.round(Number(recipe.calories))} kcal
              </p>
            )}
          </div>
          {Array.isArray(ingredients) && ingredients.length > 0 && (
            <div className="rounded-2xl border border-[#E5E7EB] bg-white p-4 shadow-sm">
              <h3 className="mb-2 text-sm font-semibold">Ingredients</h3>
              <ul className="list-disc space-y-1 pl-5 text-sm text-[#4B5563]">
                {ingredients.map((ing, i) => (
                  <li key={i}>
                    {typeof ing === "string"
                      ? ing
                      : ing.name || ing.ingredient || JSON.stringify(ing)}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </FitnessShell>
  )
}

export function FitnessSavedRecipes() {
  const { ready, auth } = useFitnessGate()
  const [recipes, setRecipes] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!ready) return
    ;(async () => {
      try {
        setRecipes(await fetchSavedRecipes(auth))
      } finally {
        setLoading(false)
      }
    })()
  }, [ready, auth])

  if (!ready) {
    return (
      <FitnessShell title="Saved recipes" backTo="/app/fitness/recipes" showTabs={false}>
        <FitnessGateLoader />
      </FitnessShell>
    )
  }

  return (
    <FitnessShell title="Saved recipes" backTo="/app/fitness/recipes" showTabs={false}>
      {loading ? (
        <div className="flex justify-center py-16 text-[#10B981]">
          <Loader2 className="animate-spin" size={28} />
        </div>
      ) : recipes.length === 0 ? (
        <p className="text-center text-sm text-[#6B7280]">No saved recipes.</p>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {recipes.map((r) => {
            const id = r.id || r.recipe_id
            return (
              <Link
                key={id}
                to={`/app/fitness/recipes/${encodeURIComponent(id)}`}
                className="overflow-hidden rounded-2xl border border-[#E5E7EB] bg-white"
              >
                <img
                  src={fitnessImage(r.image_url || r.image)}
                  alt=""
                  className="h-32 w-full object-cover"
                />
                <p className="p-3 text-sm font-semibold">{r.title || r.name}</p>
              </Link>
            )
          })}
        </div>
      )}
    </FitnessShell>
  )
}

const SWAP_TABS = ["all", "carbs", "protein", "snacks", "beverages"]

export function FitnessSwaps() {
  const { ready, auth } = useFitnessGate()
  const [tab, setTab] = useState("all")
  const [swaps, setSwaps] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    if (!ready) return
    let cancelled = false
    ;(async () => {
      setLoading(true)
      try {
        const list = await fetchHealthySwaps(auth, tab)
        if (!cancelled) setSwaps(list)
      } catch (err) {
        if (!cancelled) setError(err.message || "Failed to load swaps")
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [ready, auth, tab])

  if (!ready) {
    return (
      <FitnessShell title="Healthy swaps" backTo="/app/fitness/food" showTabs={false}>
        <FitnessGateLoader />
      </FitnessShell>
    )
  }

  return (
    <FitnessShell title="Healthy swaps" backTo="/app/fitness/food" showTabs={false}>
      <div className="mb-4 flex flex-wrap gap-2">
        {SWAP_TABS.map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className={`rounded-full px-3 py-1.5 text-xs font-semibold capitalize ${
              tab === t
                ? "bg-[#10B981] text-white"
                : "bg-white text-[#374151] ring-1 ring-[#E5E7EB]"
            }`}
          >
            {t}
          </button>
        ))}
      </div>
      {loading ? (
        <div className="flex justify-center py-16 text-[#10B981]">
          <Loader2 className="animate-spin" size={28} />
        </div>
      ) : error ? (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
      ) : (
        <ul className="space-y-3">
          {swaps.map((s) => (
            <li
              key={s.id || s.title}
              className="rounded-xl border border-[#E5E7EB] bg-white p-4 shadow-sm"
            >
              <p className="font-semibold text-[#111827]">
                {s.title || s.name || s.swap_title}
              </p>
              <p className="mt-1 text-sm text-[#4B5563]">
                {s.description || s.details || s.healthy_option || ""}
              </p>
              {(s.instead_of || s.replace) && (
                <p className="mt-2 text-xs text-[#6B7280]">
                  Instead of: {s.instead_of || s.replace}
                </p>
              )}
            </li>
          ))}
        </ul>
      )}
    </FitnessShell>
  )
}

export function FitnessPlans() {
  const { ready, auth } = useFitnessGate()
  const [plans, setPlans] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  const load = async () => {
    setLoading(true)
    try {
      setPlans(await fetchUserPlans(auth))
    } catch (err) {
      setError(err.message || "Failed to load plans")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!ready) return
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, auth?.token])

  if (!ready) {
    return (
      <FitnessShell title="My plans" backTo="/app/fitness/food" showTabs={false}>
        <FitnessGateLoader />
      </FitnessShell>
    )
  }

  return (
    <FitnessShell title="My plans" backTo="/app/fitness/food" showTabs={false}>
      {loading ? (
        <div className="flex justify-center py-16 text-[#10B981]">
          <Loader2 className="animate-spin" size={28} />
        </div>
      ) : error ? (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
      ) : plans.length === 0 ? (
        <p className="text-center text-sm text-[#6B7280]">No plans yet.</p>
      ) : (
        <ul className="space-y-3">
          {plans.map((p) => (
            <li
              key={p.id}
              className="rounded-xl border border-[#E5E7EB] bg-white p-4 shadow-sm"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-semibold text-[#111827]">
                    {p.title || p.name || `Plan #${p.id}`}
                  </p>
                  <p className="mt-1 text-xs capitalize text-[#6B7280]">
                    {p.status || "active"}
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={async () => {
                      await patchUserPlanStatus(
                        auth,
                        p.id,
                        p.status === "active" ? "paused" : "active",
                      )
                      await load()
                    }}
                    className="text-xs font-semibold text-[#10B981]"
                  >
                    Toggle
                  </button>
                  <button
                    type="button"
                    onClick={async () => {
                      await deleteUserPlan(auth, p.id)
                      await load()
                    }}
                    className="text-xs font-semibold text-red-600"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </FitnessShell>
  )
}
