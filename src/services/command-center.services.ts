import { useQuery } from '@tanstack/react-query';

import type { CommandCenterResult, CommandCenterSnapshot } from '@/interfaces/command-center';
import type { IResponse, RequestError } from '@/interfaces/IAxios';
import { COMMAND_CENTER_SAMPLE } from '@/services/command-center.sample';
import { http } from '@/services/base';

/** The one endpoint behind the command centre. See `interfaces/command-center.ts`. */
const COMMAND_CENTER_URL = 'operations/command-center';

/**
 * Reads `message` off the API error envelope.
 *
 * Duplicates the one line `errorMessageOf` does in `query-state.tsx` rather
 * than importing it: that module is a `'use client'` component, and pulling it
 * in here would put UI in the service layer's import graph.
 */
function reasonOf(error: unknown, fallback: string): string {
  if (typeof error === 'string') return error;
  return (error as Partial<RequestError> | null)?.message ?? fallback;
}

export const commandCenterKeys = {
  all: ['command-center'] as const,
  snapshot: () => [...commandCenterKeys.all, 'snapshot'] as const,
};

/**
 * Fetches the snapshot, falling back to the fixture rather than throwing.
 *
 * The fallback is a deliberate exception to how every other service behaves —
 * elsewhere a failed call surfaces as an error state and the operator retries.
 * Here the endpoint does not exist yet, so failing would leave the console's
 * front page permanently broken while the modules behind it get built.
 *
 * What it does *not* do is pretend. The result carries `source`, and the header
 * renders a "sample data" pill off it, so nobody mistakes the fixture for the
 * platform's real position. When the endpoint ships, this function starts
 * returning `live` with no change to any component.
 *
 * Note this resolves instead of rejecting, which means React Query sees a
 * success: `isError` stays false and `retry` never fires. That is intended — a
 * retry would only re-discover the same missing route. Check `source`, not
 * `isError`, to know whether the numbers are real.
 */
async function fetchCommandCenter(): Promise<CommandCenterResult> {
  try {
    const response = await http.get<IResponse<CommandCenterSnapshot>>({
      url: COMMAND_CENTER_URL,
    });

    return { snapshot: response.data, source: 'live' };
  } catch (error) {
    const fallbackReason = reasonOf(error, 'The command centre endpoint is unavailable.');

    // Loud in development, silent in production: an operator can already see
    // the pill, and the console noise would be per-mount.
    if (process.env.NODE_ENV !== 'production') {
      console.warn(`[command-center] falling back to sample data — ${fallbackReason}`);
    }

    return { snapshot: COMMAND_CENTER_SAMPLE, source: 'sample', fallbackReason };
  }
}

export function useCommandCenter(options?: { enabled?: boolean }) {
  return useQuery<CommandCenterResult>({
    queryKey: commandCenterKeys.snapshot(),
    enabled: options?.enabled ?? true,
    queryFn: fetchCommandCenter,
  });
}
