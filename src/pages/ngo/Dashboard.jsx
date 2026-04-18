import { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import { useNavigate } from "react-router-dom";

const BASE = "http://localhost:8000";

const SKILLS_OPTIONS = [
  "Physical Labor", "Photography", "Medical Aid", "Teaching",
  "Driving", "Cooking", "Tech Skills", "First Aid",
  "Surveying", "Translation", "Fundraising", "Social Media",
];

const PRIORITY_OPTIONS = ["low", "medium", "high", "critical"];

// ── tiny helpers ──────────────────────────────────────────────────────────────
const badge = (status) => {
  const map = {
    open: "bg-emerald-100 text-emerald-800",
    assigned: "bg-blue-100 text-blue-800",
    completed: "bg-gray-100 text-gray-600",
    critical: "bg-red-100 text-red-700",
    high: "bg-orange-100 text-orange-700",
    medium: "bg-yellow-100 text-yellow-700",
    low: "bg-green-100 text-green-700",
    shortage: "bg-red-100 text-red-700",
    surplus: "bg-green-100 text-green-700",
    balanced: "bg-blue-100 text-blue-700",
  };
  return `px-2 py-0.5 rounded-full text-xs font-semibold ${map[status] || "bg-gray-100 text-gray-600"}`;
};

const tierInfo = (points) => {
  if (points >= 800) return { label: "Verified Leader", color: "text-purple-600", icon: "👑" };
  if (points >= 400) return { label: "Impact NGO", color: "text-blue-600", icon: "🌟" };
  return { label: "Active NGO", color: "text-emerald-600", icon: "✅" };
};

// ── Modal: Create Task ────────────────────────────────────────────────────────
function CreateTaskModal({ zones, onClose, onCreated, ngoUid }) {
  const [form, setForm] = useState({
    title: "", description: "", zone: "", skills_needed: [],
    date: "", volunteers_needed: 5, priority: "medium", points_reward: 100,
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const toggle = (skill) =>
    setForm((f) => ({
      ...f,
      skills_needed: f.skills_needed.includes(skill)
        ? f.skills_needed.filter((s) => s !== skill)
        : [...f.skills_needed, skill],
    }));

  const submit = async () => {
    if (!form.title || !form.zone || !form.date) {
      setError("Please fill title, zone and date."); return;
    }
    setSaving(true); setError("");
    try {
      const res = await fetch(`${BASE}/api/tasks`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, created_by: ngoUid,
          volunteers_needed: Number(form.volunteers_needed),
          points_reward: Number(form.points_reward) }),
      });
      if (!res.ok) throw new Error(await res.text());
      const task = await res.json();
      onCreated(task);
    } catch (e) {
      setError(e.message || "Failed to create task.");
    } finally { setSaving(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="text-lg font-bold text-gray-900">Create New Task</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl leading-none">&times;</button>
        </div>
        <div className="px-6 py-4 space-y-4">
          {error && <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{error}</p>}

          <div>
            <label className="label">Task Title *</label>
            <input className="input" placeholder="e.g. Yamuna Ghat Cleanup Drive"
              value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
          </div>

          <div>
            <label className="label">Description</label>
            <textarea className="input h-20 resize-none" placeholder="What volunteers will do..."
              value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Zone *</label>
              <select className="input" value={form.zone} onChange={(e) => setForm({ ...form, zone: e.target.value })}>
                <option value="">Select zone…</option>
                {zones.map((z) => (
                  <option key={z.id} value={z.id}>{z.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Date *</label>
              <input type="date" className="input" value={form.date}
                onChange={(e) => setForm({ ...form, date: e.target.value })} />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="label">Volunteers Needed</label>
              <input type="number" min="1" className="input" value={form.volunteers_needed}
                onChange={(e) => setForm({ ...form, volunteers_needed: e.target.value })} />
            </div>
            <div>
              <label className="label">Priority</label>
              <select className="input" value={form.priority}
                onChange={(e) => setForm({ ...form, priority: e.target.value })}>
                {PRIORITY_OPTIONS.map((p) => <option key={p}>{p}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Points Reward</label>
              <input type="number" min="0" className="input" value={form.points_reward}
                onChange={(e) => setForm({ ...form, points_reward: e.target.value })} />
            </div>
          </div>

          <div>
            <label className="label">Skills Needed</label>
            <div className="flex flex-wrap gap-2 mt-1">
              {SKILLS_OPTIONS.map((s) => (
                <button key={s} type="button"
                  onClick={() => toggle(s)}
                  className={`px-3 py-1 rounded-full text-sm border transition-all ${
                    form.skills_needed.includes(s)
                      ? "bg-teal-600 text-white border-teal-600"
                      : "bg-white text-gray-600 border-gray-300 hover:border-teal-400"
                  }`}>{s}</button>
              ))}
            </div>
          </div>
        </div>
        <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-3">
          <button onClick={onClose} className="px-4 py-2 rounded-lg text-sm text-gray-600 hover:bg-gray-100">Cancel</button>
          <button onClick={submit} disabled={saving}
            className="px-5 py-2 rounded-lg text-sm font-semibold bg-teal-600 text-white hover:bg-teal-700 disabled:opacity-50">
            {saving ? "Creating…" : "Create Task"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Task Card ─────────────────────────────────────────────────────────────────
function TaskCard({ task }) {
  const [open, setOpen] = useState(false);
  const [recs, setRecs] = useState(null);
  const [loading, setLoading] = useState(false);

  const loadRecs = async () => {
    if (recs) { setOpen(!open); return; }
    setOpen(true); setLoading(true);
    try {
      const res = await fetch(`${BASE}/api/tasks/${task.id}/recommendations`);
      const data = await res.json();
      setRecs(data);
    } catch { setRecs([]); }
    finally { setLoading(false); }
  };

  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
      <div className="px-5 py-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-gray-900 truncate">{task.title}</h3>
            <p className="text-sm text-gray-500 mt-0.5">{task.zone_name} · {task.date}</p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <span className={badge(task.priority)}>{task.priority}</span>
            <span className={badge(task.status)}>{task.status}</span>
          </div>
        </div>
        <div className="flex items-center justify-between mt-3">
          <div className="text-sm text-gray-600">
            <span className="font-medium text-teal-700">{task.volunteers_assigned?.length ?? 0}</span>
            <span className="text-gray-400">/{task.volunteers_needed} volunteers</span>
            <span className="ml-3 text-amber-600 font-medium">+{task.points_reward} pts</span>
          </div>
          <button onClick={loadRecs}
            className="text-xs font-medium text-teal-600 hover:underline">
            {open ? "▲ Hide AI Recs" : "▼ AI Recommendations"}
          </button>
        </div>
      </div>

      {open && (
        <div className="border-t border-gray-50 bg-gray-50/60 px-5 py-4">
          {loading ? (
            <p className="text-sm text-gray-400 animate-pulse">Fetching AI recommendations…</p>
          ) : recs && recs.length > 0 ? (
            <div className="space-y-3">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Top Matched Volunteers</p>
              {recs.map((r, i) => (
                <div key={i} className="flex items-start gap-3 bg-white rounded-lg px-4 py-3 border border-gray-100">
                  <div className="w-8 h-8 rounded-full bg-teal-100 flex items-center justify-center text-teal-700 font-bold text-sm shrink-0">
                    {r.volunteer_name?.[0] || "V"}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-medium text-sm text-gray-900">{r.volunteer_name}</span>
                      <span className="text-xs font-bold text-teal-700 bg-teal-50 px-2 py-0.5 rounded-full">
                        {r.score ?? r.match_score ?? "—"}/100
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{r.reasoning}</p>
                    {r.recommended && (
                      <span className="inline-block mt-1 text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-medium">
                        ⭐ Recommended
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-400">No recommendations available yet.</p>
          )}
        </div>
      )}
    </div>
  );
}

// ── Redistribution Panel ──────────────────────────────────────────────────────
function RedistributionPanel() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${BASE}/api/redistribution`)
      .then((r) => r.json()).then(setData).catch(() => setData(null))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p className="text-sm text-gray-400 animate-pulse p-4">Loading redistribution data…</p>;
  if (!data) return <p className="text-sm text-red-500 p-4">Could not load redistribution data.</p>;

  // Accept both array and object with zones key
  const zones = Array.isArray(data) ? data : (data.zones || []);
  const suggestions = data.suggestions || data.transfer_suggestions || [];

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {zones.map((z) => (
          <div key={z.zone_id || z.id} className="bg-white rounded-xl border border-gray-100 px-4 py-3">
            <div className="flex items-center justify-between mb-1">
              <span className="font-medium text-sm text-gray-800 truncate">{z.zone_name || z.name}</span>
              <span className={badge(z.status || (z.volunteer_demand > z.volunteers_available ? "shortage" : "surplus"))}>
                {z.status || (z.volunteer_demand > z.volunteers_available ? "shortage" : "surplus")}
              </span>
            </div>
            <div className="text-xs text-gray-500">
              Demand: <span className="font-semibold text-gray-700">{z.volunteer_demand}</span>
              &nbsp;·&nbsp; Available: <span className="font-semibold text-gray-700">{z.volunteers_available}</span>
            </div>
            {z.message && <p className="text-xs text-gray-400 mt-1 italic">{z.message}</p>}
          </div>
        ))}
      </div>

      {suggestions.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Transfer Suggestions</p>
          <div className="space-y-2">
            {suggestions.map((s, i) => (
              <div key={i} className="flex items-center gap-2 bg-amber-50 border border-amber-100 rounded-lg px-4 py-2 text-sm text-amber-800">
                <span>🔁</span>
                <span>{s.message || s}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Main Dashboard ────────────────────────────────────────────────────────────
export default function NgoDashboard() {
  const { user, userProfile, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  const [zones, setZones] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [ngoData, setNgoData] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [loadingTasks, setLoadingTasks] = useState(true);
  const [activeTab, setActiveTab] = useState("tasks");

  // Redirect if not NGO
  useEffect(() => {
    if (!authLoading && userProfile && userProfile.role !== "ngo") navigate("/");
  }, [authLoading, userProfile, navigate]);

  // Load zones
  useEffect(() => {
    fetch(`${BASE}/api/zones`)
      .then((r) => r.json()).then(setZones).catch(() => {});
  }, []);

  // Load tasks
  const loadTasks = () => {
    setLoadingTasks(true);
    fetch(`${BASE}/api/tasks`)
      .then((r) => r.json())
      .then((all) => {
        // Filter to NGO's own tasks if created_by matches
        const mine = all.filter ? all.filter((t) => !t.created_by || t.created_by === user?.uid) : all;
        setTasks(mine.length ? mine : all);
      })
      .catch(() => setTasks([]))
      .finally(() => setLoadingTasks(false));
  };

  useEffect(() => { if (user) loadTasks(); }, [user]);

  // Fake NGO data from Firestore profile
  useEffect(() => {
    if (userProfile) setNgoData(userProfile);
  }, [userProfile]);

  const totalAssigned = tasks.reduce((s, t) => s + (t.volunteers_assigned?.length ?? 0), 0);
  const ngoPoints = ngoData?.points ?? 0;
  const tier = tierInfo(ngoPoints);

  const logout = async () => {
    const { getAuth, signOut } = await import("firebase/auth");
    await signOut(getAuth());
    navigate("/login");
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="w-8 h-8 border-4 border-teal-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <>
      <style>{`
        .label { display:block; font-size:.75rem; font-weight:600; color:#6b7280; margin-bottom:.25rem; text-transform:uppercase; letter-spacing:.04em; }
        .input { width:100%; border:1px solid #e5e7eb; border-radius:.5rem; padding:.5rem .75rem; font-size:.875rem; color:#111827; outline:none; transition:border-color .15s; background:#fff; }
        .input:focus { border-color:#14b8a6; box-shadow:0 0 0 3px rgba(20,184,166,.1); }
      `}</style>

      <div className="min-h-screen bg-[#f8fafb] font-sans">

        {/* ── Topbar ── */}
        <header className="bg-white border-b border-gray-100 px-6 py-3 flex items-center justify-between sticky top-0 z-40">
          <div className="flex items-center gap-3">
            <span className="text-2xl font-black text-teal-600 tracking-tight">PRAHAR</span>
            <span className="hidden sm:block text-xs text-gray-400 font-medium border-l border-gray-200 pl-3">NGO Command Centre</span>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm font-semibold text-gray-700">
              {ngoData?.ngoName || userProfile?.ngoName || "NGO Dashboard"}
            </span>
            <span className={`text-xs font-bold ${tier.color}`}>{tier.icon} {tier.label}</span>
            <button onClick={logout}
              className="text-xs px-3 py-1.5 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 hover:text-gray-700 transition-all">
              Logout
            </button>
          </div>
        </header>

        <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-8">

          {/* ── Stat Cards ── */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              { label: "Active Tasks", value: tasks.filter((t) => t.status === "open").length, icon: "📋", color: "text-teal-600" },
              { label: "Volunteers Assigned", value: totalAssigned, icon: "👥", color: "text-blue-600" },
              { label: "NGO Points", value: ngoPoints, icon: "⭐", color: "text-amber-500" },
              { label: "Total Tasks", value: tasks.length, icon: "📊", color: "text-purple-600" },
            ].map((s) => (
              <div key={s.label} className="bg-white rounded-2xl border border-gray-100 shadow-sm px-5 py-4">
                <div className="text-2xl mb-1">{s.icon}</div>
                <div className={`text-2xl font-black ${s.color}`}>{s.value}</div>
                <div className="text-xs text-gray-500 font-medium mt-0.5">{s.label}</div>
              </div>
            ))}
          </div>

          {/* ── Points Card ── */}
          <div className="bg-gradient-to-r from-teal-600 to-cyan-500 rounded-2xl px-6 py-5 flex items-center justify-between text-white shadow-lg">
            <div>
              <p className="text-sm font-semibold opacity-80">NGO Impact Score</p>
              <p className="text-4xl font-black mt-1">{ngoPoints} pts</p>
              <p className="text-sm mt-1 opacity-75">{tier.icon} {tier.label} tier</p>
            </div>
            <div className="text-right">
              <p className="text-sm opacity-70">Next tier at</p>
              <p className="text-xl font-bold">{ngoPoints < 400 ? "400" : "800"} pts</p>
              <div className="w-32 h-2 bg-white/30 rounded-full mt-2 overflow-hidden">
                <div className="h-full bg-white rounded-full transition-all"
                  style={{ width: `${Math.min(100, (ngoPoints / (ngoPoints < 400 ? 400 : 800)) * 100)}%` }} />
              </div>
            </div>
          </div>

          {/* ── Tab Nav + Create Button ── */}
          <div className="flex items-center justify-between">
            <div className="flex gap-1 bg-white border border-gray-100 rounded-xl p-1 shadow-sm">
              {["tasks", "redistribution"].map((tab) => (
                <button key={tab} onClick={() => setActiveTab(tab)}
                  className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all capitalize ${
                    activeTab === tab ? "bg-teal-600 text-white shadow" : "text-gray-500 hover:text-gray-700"
                  }`}>
                  {tab === "tasks" ? "📋 Tasks" : "🔁 Redistribution"}
                </button>
              ))}
            </div>
            {activeTab === "tasks" && (
              <button onClick={() => setShowModal(true)}
                className="flex items-center gap-2 px-4 py-2 bg-teal-600 text-white text-sm font-semibold rounded-xl hover:bg-teal-700 shadow transition-all">
                + Create Task
              </button>
            )}
          </div>

          {/* ── Tasks Tab ── */}
          {activeTab === "tasks" && (
            <div className="space-y-3">
              {loadingTasks ? (
                <div className="text-center py-12 text-gray-400 animate-pulse">Loading tasks…</div>
              ) : tasks.length === 0 ? (
                <div className="text-center py-12 bg-white rounded-2xl border border-gray-100">
                  <p className="text-gray-400 text-sm">No tasks yet. Create your first task!</p>
                </div>
              ) : (
                tasks.map((t) => <TaskCard key={t.id} task={t} />)
              )}
            </div>
          )}

          {/* ── Redistribution Tab ── */}
          {activeTab === "redistribution" && (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
              <h2 className="text-base font-bold text-gray-900 mb-4">🔁 Volunteer Redistribution by Zone</h2>
              <RedistributionPanel />
            </div>
          )}

        </main>
      </div>

      {/* ── Create Task Modal ── */}
      {showModal && (
        <CreateTaskModal
          zones={zones}
          ngoUid={user?.uid}
          onClose={() => setShowModal(false)}
          onCreated={(task) => {
            setTasks((prev) => [task, ...prev]);
            setShowModal(false);
          }}
        />
      )}
    </>
  );
}
