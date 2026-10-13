import React from 'react';
import { Bot, CheckCircle2, AlertTriangle } from 'lucide-react';

interface AiModelBadgeProps {
  prediction?: 'fake' | 'genuine' | string | null;
  confidence?: number;
  fakeProbability?: number;
  isExcluded?: boolean;
}

export const AiModelBadge: React.FC<AiModelBadgeProps> = ({
  prediction,
  confidence,
  fakeProbability,
  isExcluded
}) => {
  if (isExcluded) {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-500 border border-slate-200" title="Whitelisted official asset bypasses NLP classification">
        <Bot className="w-3 h-3 text-slate-400" />
        EXCLUDED
      </span>
    );
  }

  if (!prediction) {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium bg-slate-50 text-slate-400 border border-slate-200">
        <Bot className="w-3 h-3 text-slate-300" />
        Pending
      </span>
    );
  }

  const isFake = prediction.toLowerCase() === 'fake';
  const pct = confidence ? Math.round(confidence * 100) : (fakeProbability ? Math.round(fakeProbability * 100) : 50);

  if (isFake) {
    return (
      <span
        className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200 shadow-2xs"
        title={`AI Fake Detection: ${pct}% fake probability`}
      >
        <Bot className="w-3 h-3 text-rose-600" />
        FAKE ({pct}%)
      </span>
    );
  }

  return (
    <span
      className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 shadow-2xs"
      title={`AI Fake Detection: ${pct}% genuine confidence`}
    >
      <Bot className="w-3 h-3 text-emerald-600" />
      GENUINE ({pct}%)
    </span>
  );
};
