'use client';

import { Laptop, LogOut, Moon, Sun } from 'lucide-react';
import Link from 'next/link';
import { useTheme } from 'next-themes';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { operatorLabel } from '@/helpers/session';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/store/auth.store';

const THEMES = [
  { value: 'system', label: 'System', icon: Laptop },
  { value: 'light', label: 'Light', icon: Sun },
  { value: 'dark', label: 'Dark', icon: Moon },
] as const;

/** One read-only fact about the session. */
function Row({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="border-border/60 flex items-baseline justify-between gap-4 border-b py-2.5 last:border-b-0">
      <dt className="text-muted-foreground text-[12px]">{label}</dt>
      <dd className={cn('truncate text-[12.5px] font-medium', mono && 'trade-code')}>{value}</dd>
    </div>
  );
}

/**
 * Operator settings.
 *
 * Everything here is either local to the browser (theme) or already in the
 * session store (the account facts) — nothing fetches. That isn't a placeholder
 * for a settings API: a staff token can't read `GET me/`, which is
 * CONSUMER-scoped, so there is no profile to load or edit. The one thing this
 * page can genuinely *change* server-side is session lifetime, which is why
 * sign-out lives here too.
 */
export function SettingsView() {
  const { theme, setTheme } = useTheme();

  const user = useAuthStore((state) => state.user);
  const auth = useAuthStore((state) => state.auth);
  const hydrated = useAuthStore((state) => state.hydrated);

  const label = operatorLabel(user, auth);

  return (
    <div className="max-w-2xl space-y-5">
      <div className="space-y-1">
        <h1 className="text-xl font-semibold">Settings</h1>
        <p className="text-muted-foreground text-[12.5px] leading-relaxed">
          Preferences for this browser, and what the console knows about your session.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-[13.5px]">Appearance</CardTitle>
          <CardDescription className="text-[12px]">
            Stored in this browser only — it follows the device, not the account.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* `theme` is undefined until next-themes reads the stored preference,
              so the selected state can't be rendered on the server. */}
          <div className="flex flex-wrap gap-2" role="group" aria-label="Theme">
            {THEMES.map((option) => {
              const selected = theme === option.value;

              return (
                <Button
                  key={option.value}
                  variant={selected ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setTheme(option.value)}
                  aria-pressed={selected}
                >
                  <option.icon className="size-3.5" aria-hidden />
                  {option.label}
                </Button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-[13.5px]">Account</CardTitle>
          <CardDescription className="text-[12px]">
            Read-only. Staff records are changed by an administrator, not from the console.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {hydrated ? (
            <dl>
              <Row label="Signed in as" value={label ?? '—'} />
              <Row label="Email" value={auth?.email ?? '—'} />
              <Row label="Username" value={user?.username ?? 'Not set'} />
              <Row label="Public ID" value={user?.publicId ?? '—'} mono />
              <Row label="User ID" value={user?.userId ?? '—'} mono />
              <div className="border-border/60 flex items-center justify-between gap-4 border-b py-2.5 last:border-b-0">
                <dt className="text-muted-foreground text-[12px]">Status</dt>
                <dd className="flex items-center gap-1.5">
                  <Badge variant={user?.status === 'ACTIVE' ? 'default' : 'secondary'}>
                    {user?.status ?? 'Unknown'}
                  </Badge>
                  <Badge variant="outline">{user?.verificationLevel ?? 'Unknown'}</Badge>
                </dd>
              </div>
            </dl>
          ) : (
            <p className="text-muted-foreground text-[12.5px]">Restoring session…</p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-[13.5px]">Sessions</CardTitle>
          <CardDescription className="text-[12px]">
            Signing out revokes the session server-side and clears it from this device.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          {/* Both are links into the logout page, which owns the ordering:
              revoke, then tear down local state, then leave. */}
          <Button variant="outline" size="sm" asChild>
            <Link href="/logout">
              <LogOut className="size-3.5" aria-hidden />
              Sign out
            </Link>
          </Button>
          <Button variant="outline" size="sm" asChild>
            <Link href="/logout?scope=all">
              <LogOut className="size-3.5" aria-hidden />
              Sign out everywhere
            </Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
