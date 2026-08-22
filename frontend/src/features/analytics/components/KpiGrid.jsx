import { Users, CalendarCheck, Video, Clock, ClipboardCheck, Trophy } from "lucide-react";
import StatCard from "../../dashboard/components/StatCard/StatCard";
import { KpiCardSkeleton } from "./Skeletons";

const ICONS = {
  totalStudents: Users,
  avgAttendance: CalendarCheck,
  totalSessions: Video,
  avgSessionDuration: Clock,
  quizParticipation: ClipboardCheck,
  avgQuizScore: Trophy,
};

const COLORS = {
  totalStudents: "bg-blue-soft",
  avgAttendance: "bg-green-soft",
  totalSessions: "bg-purple-soft",
  avgSessionDuration: "bg-orange-soft",
  quizParticipation: "bg-blue-soft",
  avgQuizScore: "bg-green-soft",
};

const KpiGrid = ({ kpis, loading }) => {
  if (loading || !kpis) {
    return (
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <KpiCardSkeleton key={i} />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {kpis.map((kpi) => {
        const Icon = ICONS[kpi.key] || Users;
        return (
          <StatCard
            key={kpi.key}
            icon={<Icon />}
            label={kpi.label}
            value={`${kpi.value}${kpi.unit || ""}`}
            colorClass={COLORS[kpi.key] || "bg-blue-soft"}
            description={kpi.description}
            trend={kpi.trend}
            trendDirection={kpi.trendDirection}
            tooltip={kpi.tooltip}
          />
        );
      })}
    </div>
  );
};

export default KpiGrid;
