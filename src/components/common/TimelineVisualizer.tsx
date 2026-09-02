import React from 'react';
import { DrillRecord } from '../../types';
import {
  formatDisplayDate,
  formatMonthShort,
  computeDrillStatus,
} from '../../utils/drillCalculator';
import { CheckCircle2, Clock, Calendar, AlertTriangle, PlayCircle, ChevronRight } from 'lucide-react';

interface TimelineVisualizerProps {
  drills: DrillRecord[];
  referenceDate?: string;
  onSelectDrill?: (drill: DrillRecord) => void;
  onMarkComplete?: (drill: DrillRecord) => void;
  selectedDrillId?: string;
}

export const TimelineVisualizer: React.FC<TimelineVisualizerProps> = ({
  drills,
  referenceDate,
  onSelectDrill,
  onMarkComplete,
  selectedDrillId,
}) => {
  const sortedDrills = [...drills].sort((a, b) => a.drillNumber - b.drillNumber);

  return (
    <div className="w-full space-y-3" id="annual-timeline-container">
      {/* Legend Bar */}
      <div className="flex items-center justify-between text-xs font-medium text-slate-500 pb-2 border-b border-slate-100">
        <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
          Drill Milestones
        </div>
        <div className="flex flex-wrap items-center gap-4 text-xs font-medium text-slate-500">
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
            <span>Completed</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-blue-500"></div>
            <span>Upcoming / Next</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-amber-500"></div>
            <span>Due Soon</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-rose-500"></div>
            <span>Overdue</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-slate-300"></div>
            <span>Planned</span>
          </div>
        </div>
      </div>

      {/* Grid of Milestone Cards (Professional Polish Architecture) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-1">
        {sortedDrills.map((drill, idx) => {
          const status = computeDrillStatus(drill, referenceDate);
          const isCompleted = status === 'Completed' || status === 'Completed Late';
          const isSelected = selectedDrillId === drill.id;

          // Card styles based on status
          let cardStyle =
            'bg-slate-50 border-slate-200 border-l-4 border-l-slate-300 opacity-80 hover:opacity-100';
          let tagStyle = 'bg-slate-200 text-slate-700';
          let quarterLabel = `Q${idx + 1} • Drill 0${drill.drillNumber}`;
          let statusText = 'PLANNED';
          let statusColor = 'text-slate-500';

          if (status === 'Completed') {
            cardStyle =
              'bg-emerald-50/80 border-emerald-100 border-l-4 border-l-emerald-500 shadow-2xs';
            tagStyle = 'bg-emerald-100 text-emerald-800';
            statusText = 'COMPLETED';
            statusColor = 'text-emerald-700';
          } else if (status === 'Completed Late') {
            cardStyle =
              'bg-emerald-50/70 border-amber-200 border-l-4 border-l-amber-500 shadow-2xs';
            tagStyle = 'bg-amber-100 text-amber-800';
            statusText = 'COMPLETED LATE';
            statusColor = 'text-amber-700';
          } else if (status === 'Due Soon') {
            cardStyle =
              'bg-amber-50/80 border-amber-200 border-l-4 border-l-amber-500 shadow-sm';
            tagStyle = 'bg-amber-100 text-amber-900';
            statusText = 'DUE SOON';
            statusColor = 'text-amber-800';
          } else if (status === 'Overdue') {
            cardStyle =
              'bg-rose-50/90 border-rose-200 border-l-4 border-l-rose-500 shadow-sm';
            tagStyle = 'bg-rose-100 text-rose-800';
            statusText = 'OVERDUE';
            statusColor = 'text-rose-700';
          } else if (status === 'Upcoming') {
            cardStyle =
              'bg-blue-50/90 border-blue-100 border-l-4 border-l-blue-500 shadow-sm';
            tagStyle = 'bg-blue-100 text-blue-800';
            statusText = 'UPCOMING';
            statusColor = 'text-blue-700';
          }

          return (
            <div
              key={drill.id}
              id={`timeline-card-${drill.id}`}
              onClick={() => onSelectDrill?.(drill)}
              className={`p-4 rounded-xl border flex flex-col justify-between transition-all cursor-pointer ${cardStyle} ${
                isSelected ? 'ring-2 ring-blue-600 ring-offset-1 shadow-md' : 'hover:shadow-md'
              }`}
            >
              <div>
                {/* Header row */}
                <div className="flex justify-between items-start mb-2.5">
                  <span className={`text-[10px] font-bold uppercase tracking-wider ${statusColor}`}>
                    {quarterLabel}
                  </span>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider ${tagStyle}`}
                  >
                    {formatMonthShort(drill.plannedDate)} {drill.plannedDate.substring(8, 10)}
                  </span>
                </div>

                {/* Drill Title & Subtitle */}
                <h4 className="font-bold text-slate-800 text-sm leading-snug line-clamp-1">
                  {drill.title}
                </h4>
                <p className="text-slate-500 text-xs mt-1 line-clamp-1">
                  {drill.campaignName || drill.drillType || 'Cyber Awareness Simulation'}
                </p>
              </div>

              {/* Card Footer */}
              <div className="mt-4 pt-3 border-t border-black/5 flex justify-between items-center">
                <span className={`text-[10px] font-bold uppercase tracking-wider ${statusColor}`}>
                  {statusText}
                </span>

                <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                  {!isCompleted && onMarkComplete ? (
                    <button
                      type="button"
                      onClick={() => onMarkComplete(drill)}
                      className="px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-[10px] font-bold uppercase tracking-wider shadow-2xs transition-colors flex items-center gap-1"
                    >
                      <PlayCircle className="w-3 h-3" /> Execute
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => onSelectDrill?.(drill)}
                      className="text-slate-400 hover:text-slate-700 text-xs p-1"
                      title="Inspect drill details"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

