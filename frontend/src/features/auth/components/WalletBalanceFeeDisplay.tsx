import { useState, useRef, useEffect } from 'react';
import { Info, AlertTriangle, Clock, AlertCircle } from 'lucide-react';
import { useTheme } from '../../../shared/contexts/ThemeContext';
import { SkeletonLoader } from '../../../shared/components/SkeletonLoader';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
export interface WalletBalanceFeeDisplayProps {
  /** Native token balance as a formatted string (e.g. "1,245.80"). Null = not connected. */
  balance: string | null;
  /** Token ticker symbol. Defaults to "XLM". */
  ticker?: string;
  /** USD equivalent of the balance. Null = unavailable. */
  usdEquivalent: number | null;
  /** Estimated network fee as a formatted string. Null = unavailable. */
  estimatedFee: string | null;
  /** USD equivalent of the fee. Null = unavailable. */
  feeUsdEquivalent: number | null;
  /** True while balance/fee data is being fetched. */
  isLoading: boolean;
  /** True if the displayed data may be outdated. */
  isStale: boolean;
  /** Timestamp of last successful fetch. Used for "X ago" tooltip. */
  lastUpdated?: Date | null;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function formatUsd(value: number): string {
  if (value < 0.01) return '< $0.01';
  return `$${value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function timeAgo(date: Date): string {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  return `${hours}h ago`;
}

// ---------------------------------------------------------------------------
// Tooltip
// ---------------------------------------------------------------------------
function InfoTooltip({ content, isDark }: { content: string; isDark: boolean }) {
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const tooltipId = useRef(`tooltip-${Math.random().toString(36).slice(2, 8)}`).current;

  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOpen(false);
        triggerRef.current?.focus();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [open]);

  return (
    <span className="relative inline-flex">
      <button
        ref={triggerRef}
        type="button"
        aria-describedby={open ? tooltipId : undefined}
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
        className={`inline-flex items-center justify-center w-[18px] h-[18px] rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-[#c9983a]/50 ${
          isDark ? 'text-[#8a7e70] hover:text-[#b8a898]' : 'text-[#a8a29e] hover:text-[#78716c]'
        }`}
        aria-label="More information"
      >
        <Info className="w-3.5 h-3.5" />
      </button>
      {open && (
        <span
          id={tooltipId}
          role="tooltip"
          className={`absolute z-50 bottom-full left-1/2 -translate-x-1/2 mb-2 w-[240px] px-3 py-2 rounded-[10px] text-[12px] leading-[1.4] shadow-lg border pointer-events-none animate-in fade-in slide-in-from-bottom-1 ${
            isDark
              ? 'bg-[#2d2820] border-white/10 text-[#d4c5b0]'
              : 'bg-white border-neutral-200 text-[#44403c]'
          }`}
        >
          {content}
          <span
            className={`absolute top-full left-1/2 -translate-x-1/2 w-2 h-2 rotate-45 -mt-1 border-r border-b ${
              isDark ? 'bg-[#2d2820] border-white/10' : 'bg-white border-neutral-200'
            }`}
            aria-hidden="true"
          />
        </span>
      )}
    </span>
  );
}

// ---------------------------------------------------------------------------
// WalletBalanceFeeDisplay
// ---------------------------------------------------------------------------
/**
 * Displays the connected wallet's native token balance with USD equivalent
 * and estimated network transaction fee.
 *
 * States: default, insufficient-balance, loading, stale, fee-unavailable.
 */
export function WalletBalanceFeeDisplay({
  balance,
  ticker = 'XLM',
  usdEquivalent,
  estimatedFee,
  feeUsdEquivalent,
  isLoading,
  isStale,
  lastUpdated,
}: WalletBalanceFeeDisplayProps) {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const insufficientBalance = balance !== null && parseFloat(balance.replace(/,/g, '')) <= 0;
  const feeAvailable = estimatedFee !== null;

  const feeTooltipText =
    'Estimated network fee based on current Stellar base fee. Actual fee may vary.';

  // -----------------------------------------------------------------------
  // Loading state
  // -----------------------------------------------------------------------
  if (isLoading) {
    return (
      <div
        aria-busy="true"
        aria-label="Loading wallet balance"
        className={`mx-6 mb-4 p-4 rounded-[16px] border backdrop-blur-[40px] ${
          isDark
            ? 'bg-white/[0.04] border-white/[0.08]'
            : 'bg-white/[0.25] border-white/30'
        }`}
      >
        <div className="flex items-center gap-3 mb-3">
          <SkeletonLoader variant="circle" className="w-6 h-6 flex-shrink-0" />
          <div className="flex-1 space-y-2">
            <SkeletonLoader className="h-4 w-32" />
            <SkeletonLoader className="h-3 w-20" />
          </div>
        </div>
        <SkeletonLoader className="h-3 w-40" />
      </div>
    );
  }

  // -----------------------------------------------------------------------
  // No balance (not connected) — render nothing
  // -----------------------------------------------------------------------
  if (balance === null) return null;

  // -----------------------------------------------------------------------
  // Default / Insufficient / Stale / Fee-unavailable
  // -----------------------------------------------------------------------
  return (
    <div
      aria-live="polite"
      className={`mx-6 mb-4 p-4 rounded-[16px] border backdrop-blur-[40px] transition-colors ${
        isDark
          ? 'bg-white/[0.04] border-white/[0.08]'
          : 'bg-white/[0.25] border-white/30'
      }`}
    >
      {/* Balance row */}
      <div
        className="flex items-center gap-3 mb-1"
        aria-invalid={insufficientBalance || undefined}
      >
        {/* Token icon */}
        <div
          className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 border ${
            isDark ? 'border-white/10 bg-white/[0.06]' : 'border-neutral-200 bg-neutral-100'
          }`}
        >
          <svg viewBox="0 0 24 24" className="w-4 h-4" aria-hidden="true">
            <circle cx="12" cy="12" r="10" fill="#14b8e6" />
            <text
              x="12"
              y="16"
              textAnchor="middle"
              fontSize="11"
              fontWeight="700"
              fill="white"
              fontFamily="Inter, system-ui, sans-serif"
            >
              S
            </text>
          </svg>
        </div>

        {/* Amount */}
        <div className="flex-1 min-w-0">
          <span
            className={`text-[16px] font-semibold transition-colors ${
              insufficientBalance
                ? isDark
                  ? 'text-[#ef4444]'
                  : 'text-[#dc2626]'
                : isDark
                  ? 'text-[#f5f5f5]'
                  : 'text-[#2d2820]'
            }`}
          >
            {balance}
          </span>
          <span
            className={`ml-1.5 text-[14px] font-medium transition-colors ${
              insufficientBalance
                ? isDark
                  ? 'text-[#ef4444]/70'
                  : 'text-[#dc2626]/70'
                : isDark
                  ? 'text-[#d4d4d4]'
                  : 'text-[#57534e]'
            }`}
          >
            {ticker}
          </span>
          {isStale && (
            <Clock
              className={`inline-block w-3 h-3 ml-1.5 -mt-0.5 ${
                isDark ? 'text-[#f59e0b]' : 'text-[#d97706]'
              }`}
              aria-hidden="true"
            />
          )}
          {insufficientBalance && (
            <AlertTriangle
              className={`inline-block w-3.5 h-3.5 ml-1.5 -mt-0.5 ${
                isDark ? 'text-[#ef4444]' : 'text-[#dc2626]'
              }`}
              aria-hidden="true"
            />
          )}
        </div>
      </div>

      {/* USD equivalent */}
      <div className="flex items-center gap-3 mb-3">
        <div className="w-6 flex-shrink-0" />
        <span
          className={`text-[13px] transition-colors ${
            isDark ? 'text-[#b8a898]' : 'text-[#7a6b5a]'
          }`}
        >
          {usdEquivalent !== null
            ? `≈ ${formatUsd(usdEquivalent)} USD`
            : 'USD equivalent unavailable'}
        </span>
      </div>

      {/* Stale warning */}
      {isStale && (
        <div
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-[8px] text-[12px] mb-3 ${
            isDark
              ? 'bg-[#f59e0b]/[0.08] text-[#f59e0b]'
              : 'bg-[#f59e0b]/[0.10] text-[#d97706]'
          }`}
        >
          <Clock className="w-3 h-3 flex-shrink-0" aria-hidden="true" />
          Balance may be outdated. Pull to refresh.
        </div>
      )}

      {/* Fee row */}
      <div
        className={`flex items-center gap-3 pt-3 border-t ${
          isDark ? 'border-white/[0.06]' : 'border-white/40'
        }`}
      >
        <div className="w-6 flex-shrink-0" />
        <span
          className={`text-[13px] transition-colors ${
            isDark ? 'text-[#8a7e70]' : 'text-[#a8a29e]'
          }`}
        >
          Est. fee
        </span>
        {feeAvailable ? (
          <InfoTooltip content={feeTooltipText} isDark={isDark} />
        ) : (
          <AlertCircle
            className={`w-3.5 h-3.5 ${
              isDark ? 'text-[#8a7e70]' : 'text-[#a8a29e]'
            }`}
            aria-hidden="true"
          />
        )}
        <span
          className={`flex-1 text-right text-[13px] font-mono transition-colors ${
            feeAvailable
              ? isDark
                ? 'text-[#d4d4d4]'
                : 'text-[#44403c]'
              : isDark
                ? 'text-[#6b5d4d] italic'
                : 'text-[#a8a29e] italic'
          }`}
        >
          {feeAvailable ? (
            <>
              {estimatedFee} {ticker}
              {feeUsdEquivalent !== null && (
                <span
                  className={`ml-1.5 font-sans ${
                    isDark ? 'text-[#8a7e70]' : 'text-[#a8a29e]'
                  }`}
                >
                  (≈ {formatUsd(feeUsdEquivalent)})
                </span>
              )}
            </>
          ) : (
            'Fee unavailable'
          )}
        </span>
      </div>
    </div>
  );
}
