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
function Sidebar({ profile, level, levelProgress, onLogout }) {
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
        <div className="mt-5 text-left">
          <div className="flex items-center justify-between text-xs text-gray-500 uppercase tracking-wide">
            <span>Level {level}</span>
            <span>{levelProgress}%</span>
          </div>
          <div className="mt-2 h-2 bg-gray-100 rounded-full overflow-hidden">
            <div className="h-full rounded-full bg-teal-500" style={{ width: `${levelProgress}%` }} />
          </div>
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
  const [leaderboard, setLeaderboard] = useState([]);
  const [loadingLeaderboard, setLoadingLeaderboard] = useState(true);
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

  // Load leaderboard highlights
  useEffect(() => {
    setLoadingLeaderboard(true);
    fetch(`${BASE}/api/matching/leaderboard?limit=5`)
      .then((r) => r.json())
      .then((data) => setLeaderboard(Array.isArray(data) ? data : []))
      .catch(() => setLeaderboard([]))
      .finally(() => setLoadingLeaderboard(false));
  }, []);

  const logout = async () => {
    const { getAuth, signOut } = await import("firebase/auth");
    await signOut(getAuth());
    navigate("/login");
  };

  const myTasks = tasks.filter((t) => t.volunteers_assigned?.includes(user?.uid));
  const openTasks = tasks.filter((t) => t.status === "open");
  const activeTasks = myTasks.length;
  const completedTasks = tasks.filter(
    (t) => t.status === "completed" && t.volunteers_assigned?.includes(user?.uid)
  ).length;
  const points = profile?.points ?? 0;
  const level = Math.max(1, Math.min(10, Math.ceil(points / 250) || 1));
  const levelProgress = Math.min(100, Math.round((points / (level * 250 || 250)) * 100));
  const hoursLogged = profile?.hoursLogged ?? Math.max(10, Math.round(activeTasks * 4 + completedTasks * 2));
  const reliability = profile?.reliability_score ? Math.round(profile.reliability_score * 100) : 0;
  const successRate = profile?.success_rate ? Math.round(profile.success_rate * 100) : 0;
  const avgRating = profile?.avg_rating ?? 4.7;
  const filtered = tasks.filter((t) => {
    if (filter === "all") return true;
    if (filter === "open") return t.status === "open";
    if (filter === "mine") return t.volunteers_assigned?.includes(user?.uid);
    return true;
  });

  const recentActivity = profile?.recentActivity?.slice(0, 3) || [
    {
      title: myTasks[0]
        ? `Accepted “${myTasks[0].title}”`
        : "Started a new volunteering journey",
      when: "Today",
    },
    {
      title: openTasks[0]
        ? `Exploring ${openTasks[0].zone_name} opportunities`
        : "Browsing new tasks",
      when: "2 days ago",
    },
    {
      title: `Earned ${points} points so far`, when: "This week",
    },
  ];

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
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} style={{ background: 'transparent', border: '1.5px solid #10b981', borderRadius: '8px', color: '#10b981', cursor: 'pointer', padding: '4px 12px', fontSize: '13px', fontWeight: '600' }}>← Back</button>
          <span className="text-2xl font-black text-teal-600 tracking-tight">PRAHAR</span>
        </div>
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
            <Sidebar profile={profile} level={level} levelProgress={levelProgress} onLogout={logout} />
          </div>

          {/* Main content */}
          <div className="flex-1 min-w-0 space-y-5">
            <div className="rounded-3xl bg-gradient-to-r from-teal-600 via-cyan-600 to-sky-500 p-6 text-white shadow-xl">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-xs uppercase tracking-[0.3em] opacity-80">Volunteer dashboard</p>
                  <h1 className="mt-3 text-3xl font-black tracking-tight">
                    Hi {profile?.fullName?.split(" ")[0] || userProfile?.firstName || "Volunteer"}, ready to make impact?
                  </h1>
                  <p className="mt-3 max-w-2xl text-sm opacity-90">
                    Use the self-learning matching system to find the best tasks, track your performance, and amplify your local impact.
                  </p>
                </div>
                <button onClick={() => navigate("/map")}
                  className="inline-flex items-center justify-center whitespace-nowrap rounded-2xl bg-white px-5 py-2.5 text-sm font-semibold text-teal-700 shadow-sm transition hover:bg-teal-50">
                  Explore community tasks
                </button>
              </div>

              <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                <div className="rounded-3xl bg-white/10 p-4">
                  <p className="text-xs uppercase tracking-[0.3em] opacity-80">Open matches</p>
                  <p className="mt-3 text-3xl font-black">{openTasks.length}</p>
                  <p className="mt-2 text-sm opacity-90">Tasks currently available nearby</p>
                </div>
                <div className="rounded-3xl bg-white/10 p-4">
                  <p className="text-xs uppercase tracking-[0.3em] opacity-80">Your active tasks</p>
                  <p className="mt-3 text-3xl font-black">{activeTasks}</p>
                  <p className="mt-2 text-sm opacity-90">Tasks you’ve joined or accepted</p>
                </div>
                <div className="rounded-3xl bg-white/10 p-4">
                  <p className="text-xs uppercase tracking-[0.3em] opacity-80">Hours volunteered</p>
                  <p className="mt-3 text-3xl font-black">{hoursLogged}</p>
                  <p className="mt-2 text-sm opacity-90">Estimated impact hours</p>
                </div>
                <div className="rounded-3xl bg-white/10 p-4">
                  <p className="text-xs uppercase tracking-[0.3em] opacity-80">Points</p>
                  <p className="mt-3 text-3xl font-black">{points}</p>
                  <p className="mt-2 text-sm opacity-90">Volunteer reward score</p>
                </div>
              </div>
            </div>

            <div className="grid gap-5 lg:grid-cols-[1fr_320px]">
              <div className="space-y-5">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">Recommended tasks</h2>
                    <p className="text-sm text-gray-500">Tasks ranked by your self-learning match score and local impact.</p>
                  </div>
                  <div className="flex gap-2 bg-white border border-gray-100 rounded-full p-1 shadow-sm">
                    {[["all", "All Tasks"], ["open", "Open"], ["mine", "My Tasks"]].map(([v, l]) => (
                      <button key={v} onClick={() => setFilter(v)}
                        className={`px-3 py-1.5 rounded-full text-sm font-semibold transition-all ${
                          filter === v ? "bg-teal-600 text-white shadow" : "text-gray-500 hover:text-gray-700"
                        }`}>
                        {l}
                      </button>
                    ))}
                  </div>
                </div>

                {loadingTasks ? (
                  <div className="text-center py-12 text-gray-400 animate-pulse">Loading tasks…</div>
                ) : filtered.length === 0 ? (
                  <div className="text-center py-12 bg-white rounded-3xl border border-gray-100">
                    <p className="text-gray-500 text-sm">No tasks found. Try another filter or explore more opportunities on the map.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
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

              <aside className="space-y-5">
                <div className="bg-white rounded-3xl border border-gray-100 p-5 shadow-sm">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-xs uppercase tracking-[0.3em] text-gray-500">Performance</p>
                      <h3 className="mt-2 text-lg font-bold text-gray-900">Volunteer insight</h3>
                    </div>
                    <span className="text-xs font-semibold text-teal-700 bg-teal-50 rounded-full px-2.5 py-1">Self-learning</span>
                  </div>

                  <div className="mt-5 space-y-4">
                    <div>
                      <div className="flex items-center justify-between text-sm text-gray-500">
                        <span>Reliability</span>
                        <span>{reliability}%</span>
                      </div>
                      <div className="mt-2 h-2 rounded-full bg-gray-100 overflow-hidden">
                        <div className="h-full rounded-full bg-teal-500" style={{ width: `${reliability}%` }} />
                      </div>
                    </div>
                    <div>
                      <div className="flex items-center justify-between text-sm text-gray-500">
                        <span>Success Rate</span>
                        <span>{successRate}%</span>
                      </div>
                      <div className="mt-2 h-2 rounded-full bg-gray-100 overflow-hidden">
                        <div className="h-full rounded-full bg-cyan-500" style={{ width: `${successRate}%` }} />
                      </div>
                    </div>
                    <div className="bg-slate-50 rounded-3xl p-4 text-sm text-gray-700">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold">Avg. rating</span>
                        <span className="text-teal-700 font-bold">{avgRating.toFixed(1)}</span>
                      </div>
                      <p className="mt-2 text-xs text-gray-500">Based on feedback from completed tasks.</p>
                      <p className="mt-3 text-xs text-gray-500">Completed tasks: {completedTasks}</p>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-3xl border border-gray-100 p-5 shadow-sm">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs uppercase tracking-[0.3em] text-gray-500">Leaderboard</p>
                      <h3 className="mt-2 text-lg font-bold text-gray-900">Top volunteers</h3>
                    </div>
                    <span className="text-xs text-gray-500">Live ranking</span>
                  </div>

                  <div className="mt-4 space-y-3">
                    {loadingLeaderboard ? (
                      <div className="space-y-2">
                        {[...Array(3)].map((_, index) => (
                          <div key={index} className="h-12 rounded-2xl bg-gray-100 animate-pulse" />
                        ))}
                      </div>
                    ) : leaderboard.length > 0 ? (
                      leaderboard.map((vol, index) => (
                        <div key={vol.id || index} className="flex items-center justify-between rounded-2xl border border-gray-100 p-3">
                          <div>
                            <p className="text-sm font-semibold text-gray-900">{vol.full_name || vol.name || `Volunteer ${index + 1}`}</p>
                            <p className="text-xs text-gray-500">Rank {index + 1}</p>
                          </div>
                          <span className="text-sm font-bold text-teal-600">{vol.points ?? vol.score ?? 0} pts</span>
                        </div>
                      ))
                    ) : (
                      <p className="text-sm text-gray-500">No leaderboard results available yet.</p>
                    )}
                  </div>
                </div>

                <div className="bg-white rounded-3xl border border-gray-100 p-5 shadow-sm">
                  <div>
                    <p className="text-xs uppercase tracking-[0.3em] text-gray-500">Recent Activity</p>
                    <h3 className="mt-2 text-lg font-bold text-gray-900">Your latest actions</h3>
                  </div>

                  <div className="mt-4 space-y-3">
                    {recentActivity.map((item, index) => (
                      <div key={index} className="rounded-3xl border border-gray-100 p-4">
                        <div className="flex items-center justify-between gap-4 text-sm text-gray-700">
                          <p>{item.title}</p>
                          <span className="text-xs text-gray-500">{item.when}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </aside>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
