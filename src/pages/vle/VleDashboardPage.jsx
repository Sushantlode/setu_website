import { useCallback, useEffect, useState } from "react"
import { Link } from "react-router-dom"
import { Loader2, Trophy, Users, Wallet } from "lucide-react"
import { useAuth } from "../../context/AuthContext"
import { vleAuthFetch } from "../../api/roleAuth"

function rankLabel(rank) {
  if (rank === 1) return "1st"
  if (rank === 2) return "2nd"
  if (rank === 3) return "3rd"
  return `#${rank}`
}

export default function VleDashboardPage() {
  const { session } = useAuth()
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState(null)
  const [wallet, setWallet] = useState(null)
  const [users, setUsers] = useState([])
  const [myRank, setMyRank] = useState(null)
  const [error, setError] = useState("")

  const load = useCallback(async () => {
    if (!session?.token) return
    setLoading(true)
    setError("")
    try {
      const [statsData, walletData, usersData, leaderboardData] = await Promise.all([
        vleAuthFetch("/dashboard/stats", { token: session.token, refreshToken: session.refreshToken }),
        vleAuthFetch("/dashboard/wallet/balance", { token: session.token, refreshToken: session.refreshToken }),
        vleAuthFetch("/dashboard/users?limit=10", { token: session.token, refreshToken: session.refreshToken }),
        vleAuthFetch("/dashboard/leaderboard?limit=5", { token: session.token, refreshToken: session.refreshToken }),
      ])
      setStats(statsData)
      setWallet(walletData)
      setUsers(usersData?.users || [])
      setMyRank(leaderboardData?.myRank || null)
    } catch (err) {
      setError(err.message || "Could not load dashboard.")
    } finally {
      setLoading(false)
    }
  }, [session?.token, session?.refreshToken])

  useEffect(() => {
    load()
  }, [load])

  return (
    <div className="page-safe-bottom mx-auto max-w-4xl px-4 py-6 app-safe-x sm:py-8">
        <div className="mb-6">
          <p className="text-sm font-medium text-[#1C39BB]">VLE Dashboard</p>
          <h1 className="font-serif text-2xl text-setu-charcoal">
            Welcome back, {session?.name?.split(" ")[0] || "VLE"}
          </h1>
          {myRank?.rank != null && (
            <p className="mt-1 text-sm text-setu-muted">
              You&apos;re ranked{" "}
              <span className="font-semibold text-[#1C39BB]">{rankLabel(myRank.rank)}</span> on
              the leaderboard
            </p>
          )}
        </div>

        {loading && (
          <div className="flex items-center gap-2 text-setu-muted">
            <Loader2 className="animate-spin" size={18} />
            Loading dashboard…
          </div>
        )}

        {error && (
          <p className="mb-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>
        )}

        {!loading && !error && (
          <>
            <div className="mb-6 grid gap-4 sm:grid-cols-3">
              <div className="rounded-2xl border border-[#D2DEFF] bg-white p-5 shadow-sm">
                <div className="mb-2 flex items-center justify-between">
                  <div className="flex items-center gap-2 text-[#1C39BB]">
                    <Users size={18} />
                    <span className="text-sm font-medium">Users registered</span>
                  </div>
                  {myRank?.rank != null && (
                    <span className="rounded-full bg-[#EEF3FF] px-2 py-0.5 text-xs font-semibold text-[#1C39BB]">
                      Rank {rankLabel(myRank.rank)}
                    </span>
                  )}
                </div>
                <p className="text-3xl font-semibold text-setu-charcoal">
                  {stats?.totalUsersRegistered ?? 0}
                </p>
                <Link
                  to="/vle/leaderboard"
                  className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-[#1C39BB] hover:underline"
                >
                  <Trophy size={14} />
                  View full leaderboard →
                </Link>
              </div>
              <div className="rounded-2xl border border-[#D2DEFF] bg-white p-5 shadow-sm">
                <div className="mb-2 flex items-center justify-between">
                  <div className="flex items-center gap-2 text-[#1C39BB]">
                    <Wallet size={18} />
                    <span className="text-sm font-medium">Wallet balance</span>
                  </div>
                  <Link
                    to="/vle/wallet"
                    className="text-xs font-medium text-[#1C39BB] hover:underline"
                  >
                    Deposit / Withdraw →
                  </Link>
                </div>
                <p className="text-3xl font-semibold text-setu-charcoal">
                  ₹{wallet?.balanceInr ?? 0}
                </p>
              </div>
              <div className="rounded-2xl border border-[#D2DEFF] bg-white p-5 shadow-sm">
                <p className="text-sm font-medium text-[#1C39BB]">Commission earned</p>
                <p className="mt-2 text-3xl font-semibold text-setu-charcoal">
                  ₹{(stats?.totalCommissionEarnedPaise ?? 0) / 100}
                </p>
              </div>
            </div>

            <div className="rounded-2xl border border-[#D2DEFF] bg-white p-5 shadow-sm">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="font-semibold text-setu-charcoal">Recent registrations</h2>
                <Link
                  to="/vle/register-user"
                  className="text-sm font-medium text-[#1C39BB] hover:underline"
                >
                  Register new user →
                </Link>
              </div>
              {users.length === 0 ? (
                <p className="text-sm text-setu-muted">No users registered yet.</p>
              ) : (
                <ul className="divide-y divide-[#EEF3FF]">
                  {users.map((u) => (
                    <li key={u.user_id} className="flex justify-between py-3 text-sm">
                      <span>
                        {u.first_name} {u.last_name} · {u.phone_number}
                      </span>
                      <span className="text-setu-muted">{u.payment_status}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </>
        )}
    </div>
  )
}
