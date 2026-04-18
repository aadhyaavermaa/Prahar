import { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import { useNavigate } from "react-router-dom";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../../firebase";

const BASE = "http://localhost:8000";

// ── Skill badge colors ────────────────────────────────────────────────────────
const SKILL_COLORS = [
  "bg-teal-100 text-teal-700", "bg-blue-100 text-blue-700",
  "bg-purple-100 text-purple-700", "bg-amber-100 text-amber-700",
  "bg-rose-100 text-rose-700", "bg-green-100 text-green-700",
];
const skillColor = (i) => SKILL_COLORS[i % SKILL_COLORS.length];

const PRIORITY_STYLE = {
  critical: "bg-red-100 text-red-700",
  high: "bg-orange-100 text-orange-700",
  medium: "bg-yellow-100 text-yellow-700",
  low: "bg-green-100 text-green-700",
};

// ── Task Card ─────────────────────────────────────────────────────────────────
function TaskCard({ task, volunteerId, onAccepted }) {
  const [score, setScore] = useState(null);
  const [loadingScore, setLoadingScore] = useState(false);
  const [accepting, setAccepting] = useState(false);
  const [accepted, setAccepted] = useState(
    task.volunteers_assigned?.includes(volunteerId)
  );

  // Fetch Gemini match score
  useEffect(() => {
    if (!volunteerId) return;
    setLoadingScore(true);
    fetch(`${BASE}/api/match?volunteer_id=${volunteerId}&task_id=${task.id}`)
      .then((r) => r.json())
      .then((d) => setScore(d.score ?? d.match_score ?? null))
      .catch(() => setScore(null))
      .finally(() => setLoadingScore(false));
  }, [task.id, volunteerId]);

  const accept = async () => {
    if (accepted || accepting) return;
    setAccepting(true);
    try {
      await fetch(
        `${BASE}/api/tasks/${task.id}/assign?volunteer_id=${volunteerId}`,
        { method: "POST" }
      );
      setAccepted(true);
      onAccepted && onAccepted(task.id);
    } catch (e) {
      console.error("Accept failed", e);
    } finally {
      setAccepting(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden hover:shadow-md transition-shadow">
      <div className="px-5 py-4">
        {/* Title row */}
        <div className="flex items-start justify-between gap-3 mb-2">
          <h3 className="font-bold text-gray-900 leading-tight">{task.title}</h3>
          <div className="flex items-center gap-1.5 shrink-0">
            <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${PRIORITY_STYLE[task.priority] || "bg-gray-100 text-gray-600"}`}>
              {task.priority}
            </span>
          </div>
        </div>

        {/* Meta */}
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-gray-500 mb-3">
          <span>📍 {task.zone_name}</span>
          <span>📅 {task.date}</span>
          <span>👥 {task.volunteers_assigned?.length ?? 0}/{task.volunteers_needed}</span>
          <span className="text-amber-600 font-semibold">+{task.points_reward} pts</span>
        </div>

        {/* Description */}
        {task.description && (
          <p className="text-sm text-gray-600 mb-3 line-clamp-2">{task.description}</p>
        )}

        {/* Skills */}
        {task.skills_needed?.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-4">
            {task.skills_needed.map((s, i) => (
              <span key={s} className={`px-2 py-0.5 rounded-full text-xs font-medium ${skillColor(i)}`}>{s}</span>
            ))}
          </div>
        )}

        {/* Footer row */}
        <div className="flex items-center justify-between gap-3">
          {/* AI Match Score */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-400">AI Match:</span>
            {loadingScore ? (
              <span className="text-xs text-gray-300 animate-pulse">…</span>
            ) : score !== null ? (
              <div className="flex items-center gap-1">
                <div className="w-16 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                  <div className="h-full bg-teal-500 rounded-full" style={{ width: `${score}%` }} />
                </div>
                <span className="text-xs font-bold text-teal-600">{score}%</span>
              </div>
            ) : (
              <span className="text-xs text-gray-300">—</span>
            )}
          </div>

          {/* Accept Button */}
          <button
            onClick={accept}
            disabled={accepted || accepting || task.status === "completed"}
            className={`px-4 py-1.5 rounded-xl text-sm font-semibold transition-all ${
              accepted
                ? "bg-green-100 text-green-700 cursor-default"
                : accepting
                ? "bg-teal-100 text-teal-500 cursor-wait"
                : task.status === "completed"
                ? "bg-gray-100 text-gray-400 cursor-default"
                : "bg-teal-600 text-white hover:bg-teal-700 shadow-sm"
            }`}>
            {accepted ? "✓ Accepted" : accepting ? "Joining…" : "Accept Task"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Sidebar ───────────────────────────────────────────────────────────────────
function Sidebar({ profile, onLogout }) {
  const badges = profile?.badges || [];
  const points = profile?.points || 0;

  return (
    <div className="space-y-4">
      {/* Profile Card */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm px-5 py-5 text-center">
        <div className="w-16 h-16 rounded-full bg-teal-600 text-white text-2xl font-black flex items-center justify-center mx-auto mb-3">
          {profile?.fullName?.[0] || "V"}
        </div>
        <h2 className="font-bold text-gray-900">{profile?.fullName || "Volunteer"}</h2>
        <p className="text-sm text-gray-500 mt-0.5">{profile?.location || "Delhi"}</p>
        <div className="mt-3 flex justify-center gap-2 flex-wrap">
          {(profile?.causes || []).slice(0, 3).map((c) => (
            <span key={c} className="text-xs bg-teal-50 text-teal-700 px-2 py-0.5 rounded-full font-medium">{c}</span>
          ))}
        </div>
      </div>

      {/* Points */}
      <div className="bg-gradient-to-br from-teal-600 to-cyan-500 rounded-2xl px-5 py-4 text-white shadow-lg">
        <p className="text-xs font-semibold opacity-70 uppercase tracking-wide">Your Points</p>
        <p className="text-4xl font-black mt-1">{points}</p>
        <p className="text-xs opacity-60 mt-1">Keep going! 🌱</p>
      </div>

      {/* Badges */}
      {badges.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm px-5 py-4">
          <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Badges Earned</h3>
          <div className="flex flex-wrap gap-2">
            {badges.map((b) => (
              <span key={b} className="text-xs bg-amber-50 text-amber-700 border border-amber-200 px-2 py-1 rounded-full font-semibold">
                🏅 {b}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Skills */}
      {profile?.skills?.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm px-5 py-4">
          <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Your Skills</h3>
          <div className="flex flex-wrap gap-1.5">
            {profile.skills.map((s, i) => (
              <span key={s} className={`text-xs px-2 py-0.5 rounded-full font-medium ${skillColor(i)}`}>{s}</span>
            ))}
          </div>
        </div>
      )}

      {/* Leaderboard mini */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm px-5 py-4">
        <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">🏆 Top Volunteers</h3>
        {["Priya S. — 980 pts", "Rahul M. — 860 pts", "Sneha K. — 740 pts"].map((e, i) => (
          <div key={i} className="flex items-center gap-2 py-1.5 border-b border-gray-50 last:border-0">
            <span className="text-sm">{["🥇","🥈","🥉"][i]}</span>
            <span className="text-sm text-gray-700">{e}</span>
          </div>
        ))}
      </div>

      <button onClick={onLogout}
        className="w-full py-2.5 rounded-xl border border-gray-200 text-sm text-gray-500 hover:bg-gray-50 transition-all font-medium">
        Logout
      </button>
    </div>
  );
}

// ── Main Dashboard ────────────────────────────────────────────────────────────
export default function VolunteerDashboard() {
  const { user, userProfile, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  const [tasks, setTasks] = useState([]);
  const [loadingTasks, setLoadingTasks] = useState(true);
  const [profile, setProfile] = useState(null);
  const [filter, setFilter] = useState("all");

  // Redirect non-volunteers
  useEffect(() => {
    if (!authLoading && userProfile && userProfile.role !== "volunteer") navigate("/");
  }, [authLoading, userProfile, navigate]);

  // Load Firestore volunteer profile
  useEffect(() => {
    if (!user) return;
    getDoc(doc(db, "volunteers", user.uid))
      .then((snap) => { if (snap.exists()) setProfile(snap.data()); })
      .catch(() => {});
  }, [user]);

  // Load tasks from API
  useEffect(() => {
    setLoadingTasks(true);
    fetch(`${BASE}/api/tasks`)
      .then((r) => r.json())
      .then((data) => setTasks(Array.isArray(data) ? data : []))
      .catch(() => setTasks([]))
      .finally(() => setLoadingTasks(false));
  }, []);

  const logout = async () => {
    const { getAuth, signOut } = await import("firebase/auth");
    await signOut(getAuth());
    navigate("/login");
  };

  const filtered = tasks.filter((t) => {
    if (filter === "all") return true;
    if (filter === "open") return t.status === "open";
    if (filter === "mine") return t.volunteers_assigned?.includes(user?.uid);
    return true;
  });

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="w-8 h-8 border-4 border-teal-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8fafb]">

      {/* Topbar */}
      <header className="bg-white border-b border-gray-100 px-6 py-3 flex items-center justify-between sticky top-0 z-40">
        <span className="text-2xl font-black text-teal-600 tracking-tight">PRAHAR</span>
        <div className="flex items-center gap-3">
          <span className="text-sm font-semibold text-gray-700">
            {profile?.fullName || userProfile?.firstName || "Volunteer"}
          </span>
          <span className="text-xs bg-teal-100 text-teal-700 px-2 py-0.5 rounded-full font-semibold">
            {profile?.points ?? 0} pts
          </span>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
        <div className="flex flex-col lg:flex-row gap-8">

          {/* Sidebar */}
          <div className="lg:w-72 shrink-0">
            <Sidebar profile={profile} onLogout={logout} />
          </div>

          {/* Main content */}
          <div className="flex-1 min-w-0 space-y-5">

            {/* Stats row */}
            <div className="grid grid-cols-3 gap-3">
              {[
                { label: "Open Tasks", value: tasks.filter((t) => t.status === "open").length, icon: "📋" },
                { label: "My Tasks", value: tasks.filter((t) => t.volunteers_assigned?.includes(user?.uid)).length, icon: "✅" },
                { label: "My Points", value: profile?.points ?? 0, icon: "⭐" },
              ].map((s) => (
                <div key={s.label} className="bg-white rounded-2xl border border-gray-100 shadow-sm px-4 py-3 text-center">
                  <div className="text-xl mb-0.5">{s.icon}</div>
                  <div className="text-xl font-black text-teal-600">{s.value}</div>
                  <div className="text-xs text-gray-500">{s.label}</div>
                </div>
              ))}
            </div>

            {/* Filter tabs */}
            <div className="flex gap-1 bg-white border border-gray-100 rounded-xl p-1 shadow-sm w-fit">
              {[["all", "All Tasks"], ["open", "Open"], ["mine", "My Tasks"]].map(([v, l]) => (
                <button key={v} onClick={() => setFilter(v)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-semibold transition-all ${
                    filter === v ? "bg-teal-600 text-white shadow" : "text-gray-500 hover:text-gray-700"
                  }`}>{l}</button>
              ))}
            </div>

            {/* Tasks */}
            {loadingTasks ? (
              <div className="text-center py-12 text-gray-400 animate-pulse">Loading tasks…</div>
            ) : filtered.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-2xl border border-gray-100">
                <p className="text-gray-400 text-sm">No tasks found.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {filtered.map((t) => (
                  <TaskCard
                    key={t.id}
                    task={t}
                    volunteerId={user?.uid}
                    onAccepted={() => {
                      setTasks((prev) =>
                        prev.map((x) =>
                          x.id === t.id
                            ? { ...x, volunteers_assigned: [...(x.volunteers_assigned || []), user.uid] }
                            : x
                        )
                      );
                    }}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
