/**
 * StationDetails Component
 * Rich information panel for selected station - human-centric storytelling
 */

import React, { memo } from 'react';
import { X, ChevronRight, Users, Calendar, BookOpen, Sparkles } from 'lucide-react';
import { LINE_COLORS } from '../../constants/metroConfig';

const StationDetails = memo(function StationDetails({
  station,
  onClose,
  onNavigateToStation
}) {
  if (!station) return null;

  const { narrative = {}, lines = [], population, yearLabel, significance } = station;

  // Human-centric significance badges
  const significanceBadge = {
    hub: { label: 'Major Hub', className: 'bg-purple-900/50 text-purple-300 border-purple-500/50' },
    crisis: { label: 'Crisis Point', className: 'bg-red-900/50 text-red-300 border-red-500/50' },
    major: { label: 'Milestone', className: 'bg-cyan-900/50 text-cyan-300 border-cyan-500/50' },
    current: { label: 'You Are Here', className: 'bg-green-900/50 text-green-300 border-green-500/50 animate-pulse' },
    minor: { label: 'Station', className: 'bg-neutral-800/50 text-neutral-400 border-neutral-600/50' }
  };

  const badge = significanceBadge[significance] || significanceBadge.minor;

  return (
    <aside
      className="w-[420px] bg-gradient-to-b from-neutral-900/98 to-neutral-950/98 backdrop-blur-2xl border-l border-cyan-900/30 p-6 overflow-y-auto"
      role="complementary"
      aria-label={`Details for ${station.name}`}
    >
      {/* Header */}
      <header className="mb-6">
        <div className="flex items-start justify-between gap-4 mb-4">
          <div className="flex-1">
            <span className={`inline-flex items-center px-2.5 py-1 text-xs rounded-full border ${badge.className} mb-3`}>
              {badge.label}
            </span>
            <h2 className="text-2xl font-black text-white leading-tight mb-2">
              {station.name}
            </h2>
            <div className="flex items-center gap-3 text-sm">
              <span className="flex items-center gap-1.5 text-cyan-400">
                <Calendar size={14} />
                {yearLabel}
              </span>
              {population && (
                <span className="flex items-center gap-1.5 text-green-400">
                  <Users size={14} />
                  {population}
                </span>
              )}
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-neutral-500 hover:text-white hover:bg-neutral-800 rounded-lg transition-colors"
            aria-label="Close details panel"
          >
            <X size={20} />
          </button>
        </div>

        {/* Line badges */}
        <div className="flex flex-wrap gap-2">
          {lines.map(line => {
            const colorClasses = {
              'Tech': 'bg-cyan-900/30 border-cyan-700/50 text-cyan-300',
              'Population': 'bg-green-900/30 border-green-700/50 text-green-300',
              'War': 'bg-red-900/30 border-red-700/50 text-red-300',
              'Empire': 'bg-purple-900/30 border-purple-700/50 text-purple-300',
              'Philosophy': 'bg-amber-900/30 border-amber-700/50 text-amber-300'
            };
            return (
              <span
                key={line}
                className={`px-3 py-1 text-xs font-medium rounded-full border ${colorClasses[line] || 'bg-neutral-800 border-neutral-700 text-neutral-300'}`}
                style={{ borderLeftWidth: 3, borderLeftColor: LINE_COLORS[line] }}
              >
                {line}
              </span>
            );
          })}
        </div>
      </header>

      {/* Narrative sections - human storytelling */}
      <div className="space-y-6">
        {/* Visual description */}
        {narrative.visual && (
          <section className="p-4 bg-gradient-to-br from-cyan-900/20 to-purple-900/20 rounded-xl border border-cyan-800/30">
            <h3 className="flex items-center gap-2 text-xs uppercase tracking-widest text-cyan-500 mb-3">
              <Sparkles size={14} />
              The Scene
            </h3>
            <p className="text-neutral-300 leading-relaxed italic">
              "{narrative.visual}"
            </p>
          </section>
        )}

        {/* Atmosphere */}
        {narrative.atmosphere && (
          <section className="p-4 bg-neutral-800/30 rounded-xl border border-neutral-700/30">
            <h3 className="text-xs uppercase tracking-widest text-neutral-500 mb-3">
              Atmosphere
            </h3>
            <p className="text-neutral-400 leading-relaxed">
              {narrative.atmosphere}
            </p>
          </section>
        )}

        {/* Key insight */}
        {narrative.insight && (
          <section className="p-4 bg-gradient-to-br from-amber-900/20 to-orange-900/20 rounded-xl border border-amber-800/30">
            <h3 className="flex items-center gap-2 text-xs uppercase tracking-widest text-amber-500 mb-3">
              <BookOpen size={14} />
              Key Insight
            </h3>
            <p className="text-amber-100/90 leading-relaxed font-medium">
              {narrative.insight}
            </p>
          </section>
        )}

        {/* Full context - expandable */}
        {station.details && (
          <details className="group">
            <summary className="cursor-pointer text-xs uppercase tracking-widest text-neutral-500 mb-3 flex items-center gap-2 hover:text-cyan-400 transition-colors list-none">
              <ChevronRight className="w-4 h-4 transform group-open:rotate-90 transition-transform" />
              <span>Full Context</span>
            </summary>
            <div className="mt-3 p-4 bg-black/30 rounded-lg border border-white/5">
              <p className="text-sm text-neutral-400 leading-relaxed font-mono">
                {station.details}
              </p>
            </div>
          </details>
        )}
      </div>

      {/* Empathetic prompt for reflection */}
      <footer className="mt-8 pt-6 border-t border-neutral-800">
        <p className="text-xs text-neutral-600 italic text-center">
          Every station represents millions of lives and countless stories.
          What would you have experienced standing here in {yearLabel}?
        </p>
      </footer>
    </aside>
  );
});

export default StationDetails;

