import { NextResponse } from 'next/server';

/**
 * Deliberately a pass-through.
 *
 * Session tokens live in `localStorage` (see `store/auth.store.ts`), which the
 * edge runtime cannot read — so any check here would be theatre. Once tokens
 * are also written to cookies, this is where the real guard goes.
 */
export function middleware() {
  return NextResponse.next();
}

export const config = {
  matcher: ['/auth/:path*', '/dashboard/:path*'],
};
