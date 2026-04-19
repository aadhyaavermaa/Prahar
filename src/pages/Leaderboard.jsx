import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

const VOLUNTEERS = [
  { rank: 1, name: "Priya S.", points: 980, badge: "River Guardian", avatar: "P", streak: 12, tasks: 24 },
  { rank: 2, name: "Rahul M.", points: 860, badge: "Air Warrior", avatar: "R", streak: 9, tasks: 19 },
  { rank: 3, name: "Sneha K.", points: 740, badge: "Flood Hero", avatar: "S", streak: 7, tasks: 15 },
  { rank: 4, name: "Amit R.", points: 620, badge: null, avatar: "A", streak: 5, tasks: 12 },
  { rank: 5, name: "Arjun T.", points: 540, badge: null, avatar: "A", streak: 4, tasks: 10 },
  { rank: 6, name: "Meera D.", points: 490, badge: null, avatar: "M", streak: 3, tasks: 9 },
  { rank: 7, name: "Karan S.", points: 410, badge: null, avatar: "K", streak: 2, tasks: 8 },
];

const NGOS = [
  { rank: 1, name: "Green Earth Foundation", points: 950, badge: "Impact Leader", tasks: 18, volunteers: 64 },
  { rank: 2, name: "LifeSave Trust", points: 890, badge: "Impact NGO", tasks: 15, volunteers: 55 },
  { rank: 3, name: "Clean Rivers India", points: 820, badge: "Active NGO", tasks: 13, volunteers: 48 },
  { rank: 4, name: "Food For All India", points: 710, badge: null, tasks: 11, volunteers: 39 },
  { rank: 5, name: "Shelter India", points: 650, badge: null, tasks: 9, volunteers: 32 },
  { rank: 6, name: "AirCare Delhi", points: 580, badge: null, tasks: 8, volunteers: 27 },
];

const MEDAL = { 1: "🥇", 2: "🥈", 3: "🥉" };
const MEDAL_BG = {
  1: "bg-gradient-to-br from-amber-50 to-yellow-100 border-amber-200",
  2: "bg-gradient-to-br from-gray-50 to-slate-100 border-slate-200",
  3: "bg-gradient-to-br from-orange-50 to-amber-50 border-orange-200",
};
const AVATAR_COLOR = {
  1: "bg-amber-400 text-white",
  2: "bg-slate-400 text-white",
  3: "bg-orange-400 text-white",
};

function VolRow({ v }) {
  const isTop = v.rank <= 3;
  return (
    <div className={`flex items-center gap-4 px-5 py-4 rounded-2xl border transition-all hover:scale-[1.01] hover:shadow-md ${
      isTop ? MEDAL_BG[v.rank] : "bg-white border-gray-100"
    }`}>
      {/* Rank */}
      <div className="w-8 text-center shrink-0">
        {MEDAL[v.rank] ? (
          <span className="text-2xl">{MEDAL[v.rank]}</span>
        ) : (
          <span className="text-sm font-bold text-gray-400">#{v.rank}</span>
        )}
      </div>

      {/* Avatar */}
      <div className={`w-10 h-10 rounded-full flex items-center justify-center font-black text-lg shrink-0 ${
        isTop ? AVATAR_COLOR[v.rank] : "bg-teal-100 text-teal-700"
      }`}>
        {v.avatar}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-bold text-gray-900">{v.name}</span>
          {v.badge && (
            <span className="text-xs px-2 py-0.5 rounded-full bg-teal-100 text-teal-700 font-semibold">
              🏅 {v.badge}
            </span>
          )}
        </div>
        <div className="text-xs text-gray-500 mt-0.5 flex gap-3">
          <span>🔥 {v.streak}-day streak</span>
          <span>✅ {v.tasks} tasks</span>
        </div>
      </div>

      {/* Points */}
      <div className="text-right shrink-0">
        <div className={`text-xl font-black ${isTop ? "text-amber-600" : "text-teal-600"}`}>
          {v.points}
        </div>
        <div className="text-xs text-gray-400 font-medium">pts</div>
      </div>
    </div>
  );
}

function NgoRow({ n }) {
  const isTop = n.rank <= 3;
  return (
    <div className={`flex items-center gap-4 px-5 py-4 rounded-2xl border transition-all hover:scale-[1.01] hover:shadow-md ${
      isTop ? MEDAL_BG[n.rank] : "bg-white border-gray-100"
    }`}>
      <div className="w-8 text-center shrink-0">
        {MEDAL[n.rank] ? (
          <span className="text-2xl">{MEDAL[n.rank]}</span>
        ) : (
          <span className="text-sm font-bold text-gray-400">#{n.rank}</span>
        )}
      </div>

      <div className={`w-10 h-10 rounded-full flex items-center justify-center font-black text-lg shrink-0 ${
        isTop ? AVATAR_COLOR[n.rank] : "bg-blue-100 text-blue-700"
      }`}>
        {n.name[0]}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-bold text-gray-900">{n.name}</span>
          {n.badge && (
            <span className="text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 font-semibold">
              🏢 {n.badge}
            </span>
          )}
        </div>
        <div className="text-xs text-gray-500 mt-0.5 flex gap-3">
          <span>📋 {n.tasks} tasks</span>
          <span>👥 {n.volunteers} volunteers</span>
        </div>
      </div>

      <div className="text-right shrink-0">
        <div className={`text-xl font-black ${isTop ? "text-amber-600" : "text-blue-600"}`}>
          {n.points}
        </div>
        <div className="text-xs text-gray-400 font-medium">pts</div>
      </div>
    </div>
  );
}

export default function Leaderboard() {
  const [tab, setTab] = useState("volunteers");
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#f8fafb]">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10">

        {/* Header */}
        <div className="text-center mb-8">
          <div className="text-5xl mb-3">🏆</div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tight">Leaderboard</h1>
          <p className="text-gray-500 text-sm mt-1">Top performers making Delhi's future cleaner</p>
        </div>

        {/* Top 3 Podium (visual) */}
        {tab === "volunteers" && (
          <div className="flex items-end justify-center gap-3 mb-8 h-32">
            {/* Silver - rank 2 */}
            <div className="flex flex-col items-center">
              <div className="w-10 h-10 rounded-full bg-slate-400 text-white flex items-center justify-center font-black text-lg mb-1">
                {VOLUNTEERS[1].avatar}
              </div>
              <div className="text-xs font-bold text-gray-600 mb-1">{VOLUNTEERS[1].name}</div>
              <div className="w-20 bg-slate-300 rounded-t-lg flex items-center justify-center h-16 text-white font-black text-lg">
                🥈
              </div>
            </div>
            {/* Gold - rank 1 */}
            <div className="flex flex-col items-center -mb-2">
              <div className="w-12 h-12 rounded-full bg-amber-400 text-white flex items-center justify-center font-black text-xl mb-1 ring-4 ring-amber-200">
                {VOLUNTEERS[0].avatar}
              </div>
              <div className="text-xs font-bold text-gray-700 mb-1">{VOLUNTEERS[0].name}</div>
              <div className="w-24 bg-amber-400 rounded-t-lg flex items-center justify-center h-24 text-white font-black text-2xl">
                🥇
              </div>
            </div>
            {/* Bronze - rank 3 */}
            <div className="flex flex-col items-center">
              <div className="w-10 h-10 rounded-full bg-orange-400 text-white flex items-center justify-center font-black text-lg mb-1">
                {VOLUNTEERS[2].avatar}
              </div>
              <div className="text-xs font-bold text-gray-600 mb-1">{VOLUNTEERS[2].name}</div>
              <div className="w-20 bg-orange-300 rounded-t-lg flex items-center justify-center h-12 text-white font-black text-lg">
                🥉
              </div>
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-1 bg-white border border-gray-100 rounded-xl p-1 shadow-sm mb-6">
          {["volunteers", "ngos"].map((t) => (
            <button key={t} onClick={() => setTab(t)}
              className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all capitalize ${
                tab === t ? "bg-teal-600 text-white shadow" : "text-gray-500 hover:text-gray-700"
              }`}>
              {t === "volunteers" ? "🙋 Volunteers" : "🏢 NGOs"}
            </button>
          ))}
        </div>

        {/* List */}
        <div className="space-y-3">
          {tab === "volunteers"
            ? VOLUNTEERS.map((v) => <VolRow key={v.rank} v={v} />)
            : NGOS.map((n) => <NgoRow key={n.rank} n={n} />)}
        </div>

        {/* Footer note */}
        <p className="text-center text-xs text-gray-400 mt-8">
          Rankings update weekly · Earn points by completing verified tasks
        </p>
      </div>
    </div>
  );
}
