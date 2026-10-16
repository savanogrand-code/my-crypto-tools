import React from 'react';
import { RiskLevel, Approval } from '@/types';
import { getRiskBadgeStyles, getRiskExplanation } from '@/lib/risk';
import { Tooltip } from '@/components/ui/Tooltip';

interface RiskBadgeProps {
  level: RiskLevel;
  approval?: Approval;
}

export const RiskBadge: React.FC<RiskBadgeProps> = ({ level, approval }) => {
  const styles = getRiskBadgeStyles(level);
  const explanation = approval
    ? getRiskExplanation(approval)
    : `${level} risk allowance. Review contract permissions carefully.`;

  return (
    <Tooltip content={explanation}>
      <span
        className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border ${styles.bg} ${styles.text} ${styles.border} cursor-help transition-transform hover:scale-105`}
      >
        {styles.pulse && (
          <span className="w-1.5 h-1.5 rounded-full bg-rose-500 mr-1.5 animate-ping" />
        )}
        {level}
      </span>
    </Tooltip>
  );
};
