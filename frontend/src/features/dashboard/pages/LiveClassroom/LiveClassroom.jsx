import React, { useState } from "react";
import {
  GraduationCap,
  Circle,
  Clock,
  BarChart3,
  Dot,
  Bell,
  Settings,
  Pencil,
  Eraser,
  Square,
  Circle as CircleIcon,
  MoveUpRight,
  Type,
  Undo2,
  Redo2,
  Trash2,
  Pipette,
  X,
  MoreVertical,
  Mic,
  MicOff,
  Video,
  Volume2,
  Users,
  MessageSquare,
  ClipboardList,
  Edit3,
  MessageCircle,
  FileText,
  Camera,
  ScreenShare,
  PencilRuler,
  Presentation,
  Vote,
  DoorOpen,
  ThumbsUp,
  Smile,
  Paperclip,
  Send,
  Wifi,
  Rows3,
} from "lucide-react";
 
/* ---------------- Static Data ---------------- */
 
const participantsData = [
  {
    id: 1,
    name: "Sarah Johnson",
    status: "host",
    avatar:
      "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop&crop=faces",
  },
  {
    id: 2,
    name: "Priya Sharma",
    status: "online",
    avatar:
      "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=100&h=100&fit=crop&crop=faces",
    action: "mute",
  },
  {
    id: 3,
    name: "Priya Sharma",
    status: "online",
    avatar:
      "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=100&h=100&fit=crop&crop=faces",
    muted: true,
  },
  {
    id: 4,
    name: "Priya Sharma",
    status: "speaking",
    avatar:
      "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=100&h=100&fit=crop&crop=faces",
    speaking: true,
  },
];
 
const chatMessages = [
  { id: 1, text: "Professional or soon!", time: "12:37 AM", mine: false },
  {
    id: 2,
    text: "Hi, are we meeting your wifi/fine",
    time: "13:51 AM",
    mine: true,
  },
  {
    id: 3,
    text: "Professional conversation and attachments.",
    time: "12:47 AM",
    mine: false,
  },
  { id: 4, text: "Your professional", time: "", mine: true },
];
 
const quizOptions = [
  { id: "a", label: "2c", selected: true },
  { id: "b", label: "2x", selected: false },
  { id: "c", label: "x", selected: true, highlight: true },
  { id: "d", label: "x^2/2", selected: false },
  { id: "e", label: "ln(v)", selected: false },
];
 
/* ---------------- Reusable Pieces ---------------- */
 
const SidebarIcon = ({ Icon, active }) => (
  <button
    className={`flex h-11 w-11 items-center justify-center rounded-xl transition-colors ${
      active ? "bg-indigo-600 text-white" : "text-slate-400 hover:bg-slate-800 hover:text-slate-200"
    }`}
  >
    <Icon size={20} />
  </button>
);
 
const ToolbarButton = ({ Icon, active, colorDot }) => (
  <button
    className={`flex h-9 w-9 items-center justify-center rounded-lg transition-colors ${
      active ? "bg-indigo-600 text-white" : "text-slate-500 hover:bg-slate-100"
    }`}
  >
    {colorDot ? (
      <span
        className="h-5 w-5 rounded-full border border-black/10"
        style={{ backgroundColor: colorDot }}
      />
    ) : (
      <Icon size={18} />
    )}
  </button>
);
 
const BottomControl = ({ Icon, label, active, danger }) => (
  <button
    className={`flex flex-col items-center gap-1 rounded-xl px-4 py-2 text-xs font-medium transition-colors ${
      danger
        ? "bg-red-50 text-red-500 hover:bg-red-100"
        : active
        ? "bg-indigo-600 text-white"
        : "text-slate-600 hover:bg-slate-100"
    }`}
  >
    <span
      className={`flex h-9 w-9 items-center justify-center rounded-full ${
        active ? "bg-indigo-500" : danger ? "bg-red-100" : "bg-slate-100"
      }`}
    >
      <Icon size={17} />
    </span>
    {label}
  </button>
);
 
/* ---------------- Main Component ---------------- */
 
export default function Component() {
  const [rightTab, setRightTab] = useState("participants");
 
  return (
    <div className="flex h-screen w-full flex-col bg-slate-100 font-sans text-slate-800">
      {/* ---------- Top Bar ---------- */}
      <header className="flex items-center justify-between border-b border-slate-200 bg-white px-5 py-3">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <GraduationCap className="text-slate-700" size={26} />
            <h1 className="text-lg font-bold text-slate-800">
              Advanced Mathematics 101
            </h1>
            <span className="ml-2 flex items-center gap-1 rounded-full bg-red-500 px-2.5 py-1 text-xs font-semibold text-white">
              <span className="h-1.5 w-1.5 rounded-full bg-white" />
              LIVE
            </span>
          
 
        <div className="hidden items-center gap-6 text-sm text-slate-500 md:flex">
          <span className="flex items-center gap-1.5">
            <Clock size={15} />
            01:15:30
          </span>
          <span>Date & Time • Wed, 2026, 08:30</span>
          <span className="flex items-center gap-1.5 text-emerald-500">
            <BarChart3 size={15} />
            excellent
          </span>
          <span className="flex items-center gap-1.5 text-red-500">
            <Circle size={9} fill="currentColor" />
            Recording
          </span>
        </div>
        </div>
        </div>
 
        <div className="flex items-center gap-4">
          <Bell className="text-slate-500" size={20} />
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-slate-700">
              Sarah Johnson
            </span>
            <img
              src="https://images.unsplash.com/photo-1517841905240-472988babdf9?w=100&h=100&fit=crop&crop=faces"
              alt="Sarah Johnson"
              className="h-9 w-9 rounded-full object-cover"
            />
          </div>
        </div>
      </header>
 
      {/* ---------- Body ---------- */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left icon rail */}
        <nav className="flex w-16 flex-col items-center gap-3 bg-slate-900 py-4">
          <SidebarIcon Icon={Edit3} active />
          <SidebarIcon Icon={Video} />
          <SidebarIcon Icon={Users} />
          <SidebarIcon Icon={ClipboardList} />
          <SidebarIcon Icon={FileText} />
          <SidebarIcon Icon={MessageCircle} />
          <SidebarIcon Icon={FileText} />
          <SidebarIcon Icon={BarChart3} />
          <div className="mt-auto">
            <SidebarIcon Icon={Settings} />
          </div>
        </nav>
 
        {/* Center + Right */}
        <main className="flex flex-1 gap-4 overflow-hidden p-4">
          {/* Whiteboard column */}
          <section className="flex flex-1 flex-col overflow-hidden rounded-2xl bg-white shadow-sm">
            {/* Toolbar */}
            <div className="flex items-center justify-between border-b border-slate-100 px-4 py-2.5">
              <div className="flex items-center gap-1">
                <ToolbarButton Icon={Pencil} active />
                <ToolbarButton Icon={Eraser} />
                <ToolbarButton Icon={Square} />
                <ToolbarButton Icon={CircleIcon} />
                <ToolbarButton Icon={MoveUpRight} />
                <ToolbarButton Icon={Type} />
                <ToolbarButton colorDot="#22c55e" />
                <ToolbarButton colorDot="#a855f7" />
                <ToolbarButton Icon={Pipette} />
                <ToolbarButton Icon={Undo2} />
                <ToolbarButton Icon={Redo2} />
                <ToolbarButton Icon={Trash2} />
              </div>
            </div>
 
            {/* Whiteboard canvas area */}
            <div className="relative flex-1 overflow-hidden bg-white">
              
              
 
            
 
              {/* ---- Live Quiz Panel overlay ---- */}
              <div className="absolute left-[54%] top-[46%] w-[280px] rounded-2xl border border-slate-200 bg-white p-4 shadow-xl">
                <div className="mb-3 flex items-center justify-between">
                  <h3 className="text-sm font-bold text-slate-800">
                    Live Quiz Panel
                  </h3>
                  <div className="flex items-center gap-2 text-slate-400">
                    <MoreVertical size={16} />
                    <X size={16} />
                  </div>
                </div>
                <p className="mb-3 text-sm text-slate-600">
                  What is the derivative of x^2?
                </p>
 
                <div className="mb-3 grid grid-cols-2 gap-2">
                  {quizOptions.map((opt) => (
                    <label
                      key={opt.id}
                      className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-sm ${
                        opt.highlight
                          ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                          : "border-slate-200 text-slate-600"
                      }`}
                    >
                      <span
                        className={`flex h-4 w-4 items-center justify-center rounded-full border ${
                          opt.selected
                            ? opt.highlight
                              ? "border-emerald-500 bg-emerald-500"
                              : "border-indigo-500 bg-indigo-500"
                            : "border-slate-300"
                        }`}
                      >
                        {opt.selected && (
                          <span className="h-1.5 w-1.5 rounded-full bg-white" />
                        )}
                      </span>
                      {opt.label}
                    </label>
                  ))}
                </div>
 
                <div className="mb-2 h-2 w-full overflow-hidden rounded-full bg-slate-100">
                  <div className="h-full w-3/4 rounded-full bg-emerald-500" />
                </div>
                <div className="mb-3 flex items-center justify-between text-xs text-slate-400">
                  <span />
                  <span>01:33</span>
                </div>
 
                <div className="mb-3 flex items-center gap-2">
                  <button className="flex-1 rounded-lg border border-slate-200 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50">
                    Submit
                  </button>
                  <button className="flex-1 rounded-lg bg-indigo-600 py-2 text-sm font-medium text-white hover:bg-indigo-700">
                    Close Poll
                  </button>
                </div>
 
                <div className="flex items-center justify-between text-xs text-slate-400">
                  <span>Live responses</span>
                  <div className="flex items-center">
                    <div className="flex -space-x-2">
                      <span className="h-5 w-5 rounded-full border-2 border-white bg-indigo-400" />
                      <span className="h-5 w-5 rounded-full border-2 border-white bg-purple-400" />
                      <span className="h-5 w-5 rounded-full border-2 border-white bg-pink-400" />
                    </div>
                    <span className="ml-1">120</span>
                  </div>
                </div>
              </div>
            </div>
          </section>
 
          {/* Right Panel */}
          <aside className="flex w-[340px] flex-shrink-0 flex-col gap-4 overflow-hidden">
            <div className="flex flex-1 flex-col overflow-hidden rounded-2xl bg-white shadow-sm">
              {/* Tabs */}
              <div className="flex border-b border-slate-100">
                <button
                  onClick={() => setRightTab("participants")}
                  className={`flex-1 py-3 text-sm font-semibold ${
                    rightTab === "participants"
                      ? "border-b-2 border-indigo-600 text-indigo-600"
                      : "text-slate-400"
                  }`}
                >
                  Participants
                </button>
                <button
                  onClick={() => setRightTab("chat")}
                  className={`flex-1 py-3 text-sm font-semibold ${
                    rightTab === "chat"
                      ? "border-b-2 border-indigo-600 text-indigo-600"
                      : "text-slate-400"
                  }`}
                >
                  Chat Panel
                </button>
              </div>
 
              {rightTab === "participants" ? (
                <div className="flex-1 overflow-y-auto p-4">
                  <h4 className="mb-3 text-sm font-bold text-slate-800">
                    Participants
                  </h4>
                  <div className="space-y-3">
                    {participantsData.map((p) => (
                      <div
                        key={p.id}
                        className="flex items-center justify-between"
                      >
                        <div className="flex items-center gap-3">
                          <img
                            src={p.avatar}
                            alt={p.name}
                            className="h-10 w-10 rounded-full object-cover"
                          />
                          <div>
                            <p className="text-sm font-medium text-slate-700">
                              {p.name}
                            </p>
                            <p className="flex items-center gap-1 text-xs text-slate-400">
                              {p.status === "host" && (
                                <span className="text-slate-400">Host</span>
                              )}
                              {p.status === "online" && (
                                <>
                                  <Dot className="text-emerald-500" size={14} />
                                  Online
                                </>
                              )}
                              {p.status === "speaking" && (
                                <>
                                  <Dot className="text-emerald-500" size={14} />
                                  Speaking
                                </>
                              )}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {p.id === 1 && (
                            <span className="rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-medium text-white">
                              Manage
                            </span>
                          )}
                          {p.id === 2 && (
                            <span className="rounded-lg bg-red-100 px-3 py-1.5 text-xs font-medium text-red-500">
                              Mute
                            </span>
                          )}
                          {p.muted ? (
                            <MicOff size={16} className="text-red-400" />
                          ) : (
                            <Mic
                              size={16}
                              className={
                                p.speaking ? "text-emerald-500" : "text-slate-400"
                              }
                            />
                          )}
                          <Video size={16} className="text-slate-400" />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="flex flex-1 flex-col overflow-hidden">
                  <h4 className="px-4 pt-4 text-sm font-bold text-slate-800">
                    Chat
                  </h4>
                  <div className="flex-1 space-y-3 overflow-y-auto px-4 py-3">
                    {chatMessages.map((m) => (
                      <div
                        key={m.id}
                        className={`flex flex-col ${
                          m.mine ? "items-end" : "items-start"
                        }`}
                      >
                        <div
                          className={`max-w-[75%] rounded-xl px-3 py-2 text-sm ${
                            m.mine
                              ? "bg-indigo-600 text-white"
                              : "bg-slate-100 text-slate-700"
                          }`}
                        >
                          {m.text}
                        </div>
                        {m.time && (
                          <span className="mt-1 text-[10px] text-slate-400">
                            {m.time}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                  <div className="flex items-center gap-2 border-t border-slate-100 p-3">
                    <Smile size={18} className="text-slate-400" />
                    <input
                      type="text"
                      placeholder="Active message..."
                      className="flex-1 rounded-lg bg-slate-100 px-3 py-2 text-sm text-slate-600 outline-none placeholder:text-slate-400"
                    />
                    <Paperclip size={18} className="text-slate-400" />
                    <button className="rounded-lg bg-indigo-600 px-3 py-2 text-white hover:bg-indigo-700">
                      <Send size={16} />
                    </button>
                  </div>
                </div>
              )}
            </div>
          </aside>
        </main>
      </div>
 
      {/* ---------- Bottom Bar ---------- */}
      <footer className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 bg-white px-5 py-3">
        <div className="flex items-center gap-6">
          <div>
            <p className="flex items-center gap-1.5 text-sm font-medium text-slate-700">
              <Wifi size={15} className="text-emerald-500" />
              Internet Status
            </p>
            <p className="text-xs text-slate-400">Stable, 50 Mbps</p>
          </div>
          <div>
            <p className="text-sm font-medium text-slate-700">Class Code</p>
            <p className="text-xs text-slate-400">XY72AB</p>
          </div>
        </div>
 
        <div className="flex flex-wrap items-center gap-2">
          <BottomControl Icon={Mic} label="Mic" active />
          <BottomControl Icon={Camera} label="Camera" active />
          <BottomControl Icon={ScreenShare} label="Share Screen" />
          <BottomControl Icon={PencilRuler} label="Whiteboard Tools" active />
          <BottomControl Icon={Presentation} label="Present Materials" />
          <BottomControl Icon={Vote} label="Polls / Quiz" />
          <BottomControl Icon={DoorOpen} label="Breakout Rooms" />
          <BottomControl Icon={ThumbsUp} label="Student Feedback" />
          <BottomControl Icon={X} label="End Session for All" danger />
        </div>
      </footer>
    </div>
  );
}