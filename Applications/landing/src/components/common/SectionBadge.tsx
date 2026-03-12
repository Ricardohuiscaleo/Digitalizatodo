import React from 'react';

interface SectionBadgeProps {
  text: string;
}

const SectionBadge: React.FC<SectionBadgeProps> = ({ text }) => (
  <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-orange-50 border border-orange-100 text-brand-orange text-[11px] font-black tracking-widest uppercase mb-6 shadow-sm">
    <span className="relative flex h-2 w-2">
      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-orange opacity-75"></span>
      <span className="relative inline-flex rounded-full h-2 w-2 bg-brand-orange"></span>
    </span>
    {text}
  </div>
);

export default SectionBadge;
