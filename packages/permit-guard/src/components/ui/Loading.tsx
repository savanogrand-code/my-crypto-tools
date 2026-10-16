import React from 'react';

export const TableSkeleton: React.FC = () => {
  return (
    <div className="w-full space-y-3">
      {[...Array(5)].map((_, i) => (
        <div
          key={i}
          className="h-16 w-full bg-slate-900/60 border border-slate-800/60 rounded-xl animate-pulse flex items-center px-4 justify-between"
        >
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-full bg-slate-800" />
            <div className="space-y-1.5">
              <div className="w-24 h-4 bg-slate-800 rounded" />
              <div className="w-16 h-3 bg-slate-800/60 rounded" />
            </div>
          </div>
          <div className="w-32 h-4 bg-slate-800 rounded hidden md:block" />
          <div className="w-20 h-4 bg-slate-800 rounded hidden sm:block" />
          <div className="w-16 h-6 bg-slate-800 rounded-full" />
          <div className="w-20 h-8 bg-slate-800 rounded-lg" />
        </div>
      ))}
    </div>
  );
};

export const SummarySkeleton: React.FC = () => {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 w-full animate-pulse">
      {[...Array(4)].map((_, i) => (
        <div key={i} className="h-24 bg-slate-900/70 border border-slate-800/60 rounded-xl p-4" />
      ))}
    </div>
  );
};
