import { useCallback, useEffect, useMemo, useState } from "react"
import { Link } from "react-router-dom"
import {
  Crown,
  Loader2,
  Medal,
  Sparkles,
  Trophy,
  UserPlus,
  Users,
} from "lucide-react"
import { useAuth } from "../../context/AuthContext"
import { vleAuthFetch } from "../../api/roleAuth"

function initials(name, fallback = "V") {
  const parts = String(name || "")
    .trim()
    .split(/\s+/)
    .filter(Boolean)
  if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase()
  return (parts[0]?.[0] || fallback).toUpperCase()
}

function rankLabel(rank) {
  if (rank === 1) return "1st"
  if (rank === 2) return "2nd"
  if (rank === 3) return "3rd"
  return `#${rank}`
}

const PODIUM = {
  1: {
    ring: "ring-amber-300/80",
    bg: "bg-gradient-to-b from-amber-50 to-white",
    badge: "bg-amber-100 text-amber-800",
    icon: Crown,
    iconClass: "text-amber-500",
    height: "pt-2 pb-5",
    scale: "scale-105",
  },
  2: {
    ring: "ring-slate-300/80",
    bg: "bg-gradient-to-b from-slate-50 to-white",
    badge: "bg-slate-100 text-slate-700",
    icon: Medal,
    iconClass: "text-slate-500",
    height: "pt-6 pb-4",
    scale: "",
  },
  3: {
    ring: "ring-orange-300/80",
    bg: "bg-gradient-to-b from-orange-50 to-white",
    badge: "bg-orange-100 text-orange-800",
    icon: Medal,
    iconClass: "text-orange-600",
    height: "pt-8 pb-3",
    scale: "",
  },
}

function PodiumCard({ entry }) {
  const style = PODIUM[entry.rank]
  if (!style) return null
  const Icon = style.icon
  return (
    <div
      className={`flex flex-1 flex-col items-center rounded-2xl border border-[#D2DEFF] p-3 text-center shadow-sm ring-2 ${style.ring} ${style.bg} ${style.height} ${style.scale} ${entry.isMe ? "shadow-md" : ""}`}
    >
      <div className={`mb-2 inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold ${style.badge}`}>
        <Icon size={12} className={style.iconClass} />
        {rankLabel(entry.rank)}
      </div>
      <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-[#1C39BB] text-sm font-bold text-white">
        {initials(entry.name)}
      </div>
      <p className="line-clamp-1 w-full text-sm font-semibold text-setu-charcoal">
        {entry.name}
        {entry.isMe && (
          <span className="ml-1 text-xs font-medium text-[#1C39BB]">(You)</span>
        )}
      </p>
      <p className="mt-0.5 text-xs text-setu-muted">{entry.vlePublicId}</p>
      <p className="mt-2 text-lg font-bold text-[#1C39BB]">{entry.usersRegistered}</p>
      <p className="text-[10px] uppercase tracking-wide text-setu-muted">users</p>
    </div>
  )
}

function LeaderboardRow({ entry }) {
  const isTop = entry.rank <= 3
  return (
    <li
      className={`flex items-center gap-3 rounded-xl px-3 py-3 transition-colors ${
        entry.isMe
          ? "border border-[#1C39BB]/30 bg-[#EEF3FF]/80"
          : "hover:bg-[#F7FAFF]"
      }`}
    >
      <div
        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-bold ${
          isTop
            ? "bg-[#1C39BB] text-white"
            : "border border-[#D2DEFF] bg-white text-setu-charcoal"
        }`}
      >
        {entry.rank}
      </div>
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#D2DEFF]/50 text-xs font-semibold text-[#1C39BB]">
        {initials(entry.name)}
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate font-medium text-setu-charcoal">
          {entry.name}
          {entry.isMe && (
            <span className="ml-2 rounded-full bg-[#1C39BB] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white">
              You
            </span>
          )}
        </p>
        <p className="truncate text-xs text-setu-muted">{entry.vlePublicId}</p>
      </div>
      <div className="shrink-0 text-right">
        <p className="text-lg font-semibold text-setu-charcoal">{entry.usersRegistered}</p>
        <p className="text-[10px] uppercase tracking-wide text-setu-muted">registered</p>
      </div>
    </li>
  )
}

export default function VleLeaderboardPage() {
  const { session } = useAuth()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [leaderboard, setLeaderboard] = useState([])
  const [myRank, setMyRank] = useState(null)
  const [totalVles, setTotalVles] = useState(0)

  const load = useCallback(async () => {
    if (!session?.token) return
    setLoading(true)
    setError("")
    try {
      const data = await vleAuthFetch("/dashboard/leaderboard?limit=50", {
        token: session.token,
        refreshToken: session.refreshToken,
      })
      setLeaderboard(data?.leaderboard || [])
      setMyRank(data?.myRank || null)
      setTotalVles(data?.totalVles || 0)
    } catch (err) {
      setError(err.message || "Could not load leaderboard.")
    } finally {
      setLoading(false)
    }
  }, [session?.token, session?.refreshToken])

  useEffect(() => {
    load()
  }, [load])

  const topThree = useMemo(
    () => leaderboard.filter((e) => e.rank <= 3).sort((a, b) => a.rank - b.rank),
    [leaderboard],
  )
  const rest = useMemo(() => leaderboard.filter((e) => e.rank > 3), [leaderboard])
  const myRankOutsideTop = myRank && !leaderboard.some((entry) => entry.isMe)
  const leaderCount = leaderboard[0]?.usersRegistered ?? 0

  return (
    <div className="page-safe-bottom mx-auto max-w-2xl px-4 py-6 app-safe-x sm:py-8">
        <div className="relative mb-6 overflow-hidden rounded-3xl border border-[#D2DEFF] bg-gradient-to-br from-[#1C39BB] via-[#243ea8] to-[#152d8a] p-6 text-white shadow-lg">
          <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-white/10 blur-2xl" />
          <div className="absolute -bottom-10 -left-6 h-28 w-28 rounded-full bg-white/5 blur-xl" />
          <div className="relative">
            <div className="flex items-center gap-2 text-white/85">
              <Trophy size={20} />
              <span className="text-sm font-semibold tracking-wide">VLE Leaderboard</span>
            </div>
            <h1 className="mt-2 font-serif text-3xl leading-tight">Who registers the most users?</h1>
            <p className="mt-2 max-w-md text-sm text-white/80">
              Rankings are based on total users registered by each VLE. Register more to climb the board.
            </p>
            <div className="mt-4 inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1.5 text-xs font-medium backdrop-blur-sm">
              <Users size={14} />
              {totalVles} active VLE{totalVles === 1 ? "" : "s"}
            </div>
          </div>
        </div>

        {myRank && (
          <div className="mb-5 rounded-2xl border-2 border-[#1C39BB] bg-white p-4 shadow-sm">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#1C39BB] text-sm font-bold text-white">
                  {initials(myRank.name)}
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-[#1C39BB]">
                    Your position
                  </p>
                  <p className="font-semibold text-setu-charcoal">{myRank.name}</p>
                  <p className="text-xs text-setu-muted">{myRank.vlePublicId}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-3xl font-bold leading-none text-[#1C39BB]">
                  {rankLabel(myRank.rank)}
                </p>
                <p className="mt-1 text-sm text-setu-muted">
                  {myRank.usersRegistered} user{myRank.usersRegistered === 1 ? "" : "s"}
                </p>
              </div>
            </div>
            {leaderCount > myRank.usersRegistered && (
              <p className="mt-3 flex items-center gap-1.5 rounded-xl bg-[#F7FAFF] px-3 py-2 text-xs text-setu-muted">
                <Sparkles size={14} className="shrink-0 text-[#1C39BB]" />
                Register {leaderCount - myRank.usersRegistered + 1} more user
                {leaderCount - myRank.usersRegistered + 1 === 1 ? "" : "s"} to reach #1
              </p>
            )}
            {myRank.rank === 1 && myRank.usersRegistered > 0 && (
              <p className="mt-3 flex items-center gap-1.5 rounded-xl bg-amber-50 px-3 py-2 text-xs font-medium text-amber-800">
                <Crown size={14} className="shrink-0" />
                You&apos;re at the top — keep it up!
              </p>
            )}
          </div>
        )}

        <div className="rounded-2xl border border-[#D2DEFF] bg-white p-5 shadow-sm">
          {loading && (
            <div className="space-y-3 py-6">
              <div className="mx-auto h-4 w-32 animate-pulse rounded bg-[#EEF3FF]" />
              <div className="h-24 animate-pulse rounded-2xl bg-[#F7FAFF]" />
              <div className="h-14 animate-pulse rounded-xl bg-[#F7FAFF]" />
              <div className="h-14 animate-pulse rounded-xl bg-[#F7FAFF]" />
            </div>
          )}

          {error && (
            <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>
          )}

          {!loading && !error && leaderboard.length === 0 && (
            <div className="py-10 text-center">
              <Trophy className="mx-auto mb-3 text-[#D2DEFF]" size={40} />
              <p className="font-medium text-setu-charcoal">No rankings yet</p>
              <p className="mt-1 text-sm text-setu-muted">
                Be the first VLE to register a user and claim #1.
              </p>
              <Link
                to="/vle/register-user"
                className="mt-4 inline-flex items-center gap-2 rounded-full bg-[#1C39BB] px-5 py-2.5 text-sm font-semibold text-white"
              >
                <UserPlus size={16} />
                Register your first user
              </Link>
            </div>
          )}

          {!loading && !error && topThree.length > 0 && (
            <div className="mb-6">
              <p className="mb-3 text-center text-xs font-semibold uppercase tracking-wider text-setu-muted">
                Top performers
              </p>
              <div className="flex items-end justify-center gap-2 sm:gap-3">
                {[2, 1, 3].map((rank) => {
                  const entry = topThree.find((e) => e.rank === rank)
                  if (!entry) return <div key={rank} className="flex-1" />
                  return <PodiumCard key={entry.vlePublicId} entry={entry} />
                })}
              </div>
            </div>
          )}

          {!loading && !error && rest.length > 0 && (
            <>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-setu-muted">
                All rankings
              </p>
              <ul className="space-y-1">
                {rest.map((entry) => (
                  <LeaderboardRow key={entry.vlePublicId} entry={entry} />
                ))}
              </ul>
            </>
          )}

          {!loading && !error && leaderboard.length > 0 && leaderboard.length <= 3 && rest.length === 0 && (
            <p className="mt-2 text-center text-xs text-setu-muted">
              More VLEs will appear here as they register users.
            </p>
          )}

          {myRankOutsideTop && (
            <div className="mt-5 border-t border-[#EEF3FF] pt-4">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-setu-muted">
                Your position (outside top {leaderboard.length})
              </p>
              <LeaderboardRow entry={myRank} />
            </div>
          )}
        </div>
    </div>
  )
}
