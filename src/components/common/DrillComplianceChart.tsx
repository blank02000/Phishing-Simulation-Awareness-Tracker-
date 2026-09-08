import React, { useMemo } from 'react';
import {
  ResponsiveContainer,
  ComposedChart,
  Area,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { DrillRecord, CustomerComplianceSummary } from '../../types';
import { computeDrillStatus, formatDisplayDate, formatSimulationMonthWindow } from '../../utils/drillCalculator';
import { CheckCircle2, AlertTriangle, Clock, ShieldCheck, TrendingUp, Calendar } from 'lucide-react';

interface DrillComplianceChartProps {
  drills: DrillRecord[];
  compliance: CustomerComplianceSummary;
  selectedYear: number;
  availableYears?: number[];
  onSelectYear?: (year: number) => void;
  referenceDate: string;
  dueSoonDays: number;
}

export const DrillComplianceChart: React.FC<DrillComplianceChartProps> = ({
  drills,
  compliance,
  selectedYear,
  availableYears,
  onSelectYear,
  referenceDate,
  dueSoonDays,
}) => {
  const totalRequirement = compliance.annualRequirement || drills.length || 4;
  const completedCount = compliance.completedCount || 0;
  const completionPercentage = Math.min(100, Math.round((completedCount / totalRequirement) * 100));

  // Sort drills by drillNumber
  const sortedDrills = useMemo(() => {
    return [...drills].sort((a, b) => a.drillNumber - b.drillNumber);
  }, [drills]);

  // Build timeline progression data for ComposedChart
  const progressionData = useMemo(() => {
    let runningCompleted = 0;

    return sortedDrills.map((drill, index) => {
      const status = computeDrillStatus(drill, referenceDate, dueSoonDays);
      const isDone = status === 'Completed' || status === 'Completed Late';
      if (isDone) {
        runningCompleted += 1;
      }

      const targetBenchmarkPct = Math.round(((index + 1) / totalRequirement) * 100);
      const cumulativeActualPct = Math.round((runningCompleted / totalRequirement) * 100);

      // Status-based score for visual bar representation
      let statusWeight = 0;
      let statusColor = '#94a3b8'; // upcoming slate
      if (status === 'Completed') {
        statusWeight = 100;
        statusColor = '#10b981'; // emerald-500
      } else if (status === 'Completed Late') {
        statusWeight = 100;
        statusColor = '#059669'; // emerald-600
      } else if (status === 'Overdue') {
        statusWeight = 30;
        statusColor = '#f43f5e'; // rose-500
      } else if (status === 'Due Soon') {
        statusWeight = 60;
        statusColor = '#f59e0b'; // amber-500
      } else {
        statusWeight = 15;
        statusColor = '#3b82f6'; // blue-500
      }

      return {
        key: `drill-${drill.drillNumber}`,
        drillNumber: drill.drillNumber,
        label: `Drill #${drill.drillNumber}`,
        quarterLabel: `Q${drill.drillNumber}`,
        title: drill.title,
        plannedDate: drill.plannedDate,
        actualDate: drill.actualCompletionDate,
        window: formatSimulationMonthWindow(drill.plannedDate, 'months'),
        status,
        isCompleted: isDone,
        targetBenchmarkPct,
        cumulativeActualPct,
        statusWeight,
        statusColor,
        clickRate: drill.clickRate,
        reportingRate: drill.reportingRate,
      };
    });
  }, [sortedDrills, totalRequirement, referenceDate, dueSoonDays]);

  // Breakdown data for the donut chart
  const donutData = useMemo(() => {
    const items = [
      { name: 'Completed on Time', value: compliance.completedOnTimeCount, color: '#10b981' },
      { name: 'Completed Late', value: compliance.completedLateCount, color: '#059669' },
      { name: 'Due Soon', value: compliance.dueSoonCount, color: '#f59e0b' },
      { name: 'Overdue', value: compliance.overdueCount, color: '#f43f5e' },
      { name: 'Upcoming', value: compliance.upcomingCount, color: '#94a3b8' },
    ].filter((item) => item.value > 0);

    if (items.length === 0) {
      return [{ name: 'No Drills', value: 1, color: '#e2e8f0' }];
    }
    return items;
  }, [compliance]);

  // Status diagnostics
  const isFullyCompliant = completedCount >= totalRequirement && compliance.overdueCount === 0;
  const hasOverdue = compliance.overdueCount > 0;
  const hasDueSoon = compliance.dueSoonCount > 0;

  let pacingLabel = 'On Track';
  let pacingColorClass = 'text-emerald-700 bg-emerald-50 border-emerald-200';
  let pacingMessage = `Achieved ${completedCount} of ${totalRequirement} required simulations. Pace aligns with annual compliance targets.`;

  if (isFullyCompliant) {
    pacingLabel = '100% Compliant';
    pacingColorClass = 'text-emerald-700 bg-emerald-50 border-emerald-200';
    pacingMessage = `Annual cybersecurity compliance requirements fully fulfilled for ${selectedYear}.`;
  } else if (hasOverdue) {
    pacingLabel = 'Compliance Risk';
    pacingColorClass = 'text-rose-700 bg-rose-50 border-rose-200';
    pacingMessage = `${compliance.overdueCount} simulation${compliance.overdueCount > 1 ? 's are' : ' is'} overdue. Action needed to avoid audit non-compliance.`;
  } else if (hasDueSoon) {
    pacingLabel = 'Action Due Soon';
    pacingColorClass = 'text-amber-800 bg-amber-50 border-amber-200';
    pacingMessage = `${compliance.dueSoonCount} simulation window is approaching. Review launch readiness.`;
  }

  return (
    <div
      id="drill-compliance-visualization"
      className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden"
    >
      {/* Header bar */}
      <div className="px-5 py-4 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3 bg-slate-50/50">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-blue-50 text-blue-600 rounded-lg border border-blue-100">
            <TrendingUp className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <span>{selectedYear} Annual Compliance & Completion Tracker</span>
              <span className={`px-2 py-0.5 rounded-md text-[11px] font-bold border ${pacingColorClass}`}>
                {pacingLabel}
              </span>
            </h3>
            <p className="text-xs text-slate-500">
              Drill execution pacing and cumulative compliance tracking for CS Managers
            </p>
          </div>
        </div>

        {/* Quick stat chips & year selector */}
        <div className="flex items-center gap-2 flex-wrap text-xs">
          {availableYears && availableYears.length > 1 && onSelectYear && (
            <div className="flex items-center gap-1 bg-slate-200/80 p-0.5 rounded-lg text-xs mr-1">
              {availableYears.map((yr) => (
                <button
                  key={yr}
                  type="button"
                  onClick={() => onSelectYear(yr)}
                  className={`px-2 py-0.5 rounded-md text-xs font-semibold transition-all ${
                    selectedYear === yr
                      ? 'bg-white text-blue-600 shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {yr}
                </button>
              ))}
            </div>
          )}

          <div className="flex items-center gap-1.5 px-2.5 py-1 bg-white rounded-lg border border-slate-200 font-medium text-slate-700">
            <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
            <span>Target: <strong>{totalRequirement} drills/yr</strong></span>
          </div>
          <div className="flex items-center gap-1.5 px-2.5 py-1 bg-white rounded-lg border border-slate-200 font-medium text-slate-700">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            <span>Completed: <strong className="text-emerald-700">{completedCount}/{totalRequirement}</strong></span>
          </div>
        </div>
      </div>

      {/* Main Visuals Grid */}
      <div className="p-5 grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Donut Gauge of Annual Completion Rate (4 Cols) */}
        <div className="lg:col-span-4 flex flex-col justify-between p-4 rounded-xl bg-slate-50/70 border border-slate-200/80">
          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Overall Completion
              </span>
              <span className="text-xs font-bold text-blue-600">
                {completedCount} of {totalRequirement} Done
              </span>
            </div>
            <p className="text-[11px] text-slate-500">
              Annual requirement fulfillment progress
            </p>
          </div>

          {/* Recharts Donut */}
          <div className="relative h-44 w-full my-2 flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={donutData}
                  cx="50%"
                  cy="50%"
                  innerRadius={52}
                  outerRadius={72}
                  paddingAngle={3}
                  dataKey="value"
                  stroke="none"
                >
                  {donutData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(val: any, name: any) => [`${val} Drill(s)`, name]}
                  contentStyle={{
                    backgroundColor: '#ffffff',
                    border: '1px solid #e2e8f0',
                    borderRadius: '8px',
                    fontSize: '12px',
                    boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)',
                  }}
                />
              </PieChart>
            </ResponsiveContainer>

            {/* Centered Stat Label */}
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-3xl font-extrabold text-slate-900 tracking-tight">
                {completionPercentage}%
              </span>
              <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
                Compliant
              </span>
            </div>
          </div>

          {/* Donut Legend */}
          <div className="grid grid-cols-2 gap-x-2 gap-y-1.5 pt-2 border-t border-slate-200/80 text-[11px]">
            <div className="flex items-center gap-1.5 text-slate-600">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shrink-0"></span>
              <span>Completed ({completedCount})</span>
            </div>
            {compliance.overdueCount > 0 && (
              <div className="flex items-center gap-1.5 text-rose-600 font-semibold">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500 shrink-0"></span>
                <span>Overdue ({compliance.overdueCount})</span>
              </div>
            )}
            {compliance.dueSoonCount > 0 && (
              <div className="flex items-center gap-1.5 text-amber-600 font-semibold">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500 shrink-0"></span>
                <span>Due Soon ({compliance.dueSoonCount})</span>
              </div>
            )}
            <div className="flex items-center gap-1.5 text-slate-500">
              <span className="w-2.5 h-2.5 rounded-full bg-slate-400 shrink-0"></span>
              <span>Upcoming ({compliance.upcomingCount})</span>
            </div>
          </div>
        </div>

        {/* Right: Progression Line & Target Benchmark Chart (8 Cols) */}
        <div className="lg:col-span-8 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <div>
              <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                Cumulative Drill Completion Pacing
              </span>
              <p className="text-[11px] text-slate-500">
                Compares actual completion trajectory against the scheduled quarterly compliance pacing line
              </p>
            </div>

            {/* Chart Legend */}
            <div className="flex items-center gap-3 text-xs">
              <div className="flex items-center gap-1.5 text-slate-600">
                <span className="w-3 h-1 bg-emerald-500 rounded"></span>
                <span className="font-medium text-[11px]">Actual Completion %</span>
              </div>
              <div className="flex items-center gap-1.5 text-slate-500">
                <span className="w-3 h-0.5 border-t border-dashed border-slate-400"></span>
                <span className="font-medium text-[11px]">Scheduled Target</span>
              </div>
            </div>
          </div>

          {/* Recharts ComposedChart */}
          <div className="h-52 w-full pt-2">
            {progressionData.length === 0 ? (
              <div className="h-full flex items-center justify-center text-xs text-slate-400">
                No scheduled drills found for {selectedYear}
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart
                  data={progressionData}
                  margin={{ top: 10, right: 15, left: -20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                  <XAxis
                    dataKey="label"
                    tick={{ fontSize: 11, fill: '#64748b' }}
                    axisLine={{ stroke: '#e2e8f0' }}
                    tickLine={false}
                  />
                  <YAxis
                    domain={[0, 100]}
                    ticks={[0, 25, 50, 75, 100]}
                    tickFormatter={(v) => `${v}%`}
                    tick={{ fontSize: 10, fill: '#94a3b8' }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip
                    content={({ active, payload }) => {
                      if (!active || !payload || !payload.length) return null;
                      const data = payload[0].payload;
                      return (
                        <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-md text-xs space-y-1.5 min-w-[200px]">
                          <div className="flex items-center justify-between gap-2 border-b border-slate-100 pb-1">
                            <span className="font-bold text-slate-900">{data.title}</span>
                            <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                              data.isCompleted ? 'bg-emerald-100 text-emerald-800' :
                              data.status === 'Overdue' ? 'bg-rose-100 text-rose-800' :
                              data.status === 'Due Soon' ? 'bg-amber-100 text-amber-800' :
                              'bg-slate-100 text-slate-700'
                            }`}>
                              {data.status}
                            </span>
                          </div>
                          <div className="text-slate-600 text-[11px] space-y-0.5">
                            <div>Campaign Window: <strong>{data.window}</strong></div>
                            <div>Planned Target: <strong>{formatDisplayDate(data.plannedDate)}</strong></div>
                            {data.actualDate && (
                              <div>Actual Completion: <strong className="text-emerald-600">{formatDisplayDate(data.actualDate)}</strong></div>
                            )}
                            <div className="pt-1 mt-1 border-t border-slate-100 flex items-center justify-between text-slate-800">
                              <span>Cumulative Completed:</span>
                              <span className="font-bold text-emerald-600">{data.cumulativeActualPct}%</span>
                            </div>
                            <div className="flex items-center justify-between text-slate-500">
                              <span>Quarterly Benchmark:</span>
                              <span className="font-medium">{data.targetBenchmarkPct}%</span>
                            </div>
                          </div>
                        </div>
                      );
                    }}
                  />
                  {/* Scheduled Target Benchmark Line */}
                  <Line
                    type="monotone"
                    dataKey="targetBenchmarkPct"
                    stroke="#94a3b8"
                    strokeWidth={2}
                    strokeDasharray="4 4"
                    dot={{ r: 3, fill: '#94a3b8' }}
                    isAnimationActive={false}
                  />
                  {/* Actual Cumulative Completion Area & Line */}
                  <Area
                    type="monotone"
                    dataKey="cumulativeActualPct"
                    stroke="#10b981"
                    strokeWidth={2.5}
                    fill="#10b981"
                    fillOpacity={0.12}
                    dot={{ r: 4, fill: '#10b981', stroke: '#ffffff', strokeWidth: 2 }}
                    activeDot={{ r: 6, fill: '#059669', stroke: '#ffffff', strokeWidth: 2 }}
                  />
                </ComposedChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* Drill milestone tags */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-3 border-t border-slate-100">
            {progressionData.map((d) => (
              <div
                key={d.key}
                className={`p-2 rounded-lg border text-xs transition-colors ${
                  d.isCompleted
                    ? 'bg-emerald-50/50 border-emerald-200/80 text-emerald-900'
                    : d.status === 'Overdue'
                    ? 'bg-rose-50/50 border-rose-200 text-rose-900'
                    : d.status === 'Due Soon'
                    ? 'bg-amber-50/50 border-amber-200 text-amber-900'
                    : 'bg-slate-50 border-slate-200 text-slate-600'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-[11px]">{d.label}</span>
                  <span className="text-[10px] font-semibold">{d.window}</span>
                </div>
                <div className="mt-1 flex items-center justify-between text-[10px]">
                  <span className="font-medium truncate">{d.status}</span>
                  {d.isCompleted ? (
                    <CheckCircle2 className="w-3 h-3 text-emerald-600 shrink-0" />
                  ) : d.status === 'Overdue' ? (
                    <AlertTriangle className="w-3 h-3 text-rose-500 shrink-0" />
                  ) : (
                    <Clock className="w-3 h-3 text-slate-400 shrink-0" />
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* CS Manager Diagnostic Banner */}
      <div className="px-5 py-3 bg-slate-50 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
        <div className="flex items-center gap-2 text-slate-700">
          <span className="font-bold text-slate-900">CSM Insights:</span>
          <span>{pacingMessage}</span>
        </div>
        <div className="text-slate-500 font-medium text-[11px]">
          Target: 1 simulation per quarter (100% compliance by Year-End)
        </div>
      </div>
    </div>
  );
};
