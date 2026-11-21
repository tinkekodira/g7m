import { t } from '@g7m/i18n';
import { LoadingRegion } from './LoadingRegion.js';

/** Secondary screens retain their text fallback and the same anti-flash delay. */
export function ScreenFallback() {
  return (
    <LoadingRegion label={t().common.loading}>
      <p className="flex min-h-[50vh] items-center justify-center text-sm text-muted">
        {t().common.loading}
      </p>
    </LoadingRegion>
  );
}
