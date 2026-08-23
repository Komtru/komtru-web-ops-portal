'use client';

import { ErrorMessage, Field, Form, Formik } from 'formik';
import { ArrowRight } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect } from 'react';
import * as Yup from 'yup';

import { FloatingLabelInput } from '@/components/forms/floating-label-input';
import { Button } from '@/components/ui/button';
import { REDIRECT_PARAM, safeRedirectPath } from '@/helpers/redirect';
import { useCustomToast } from '@/hooks/useCustomToast';
import { useRequestOtp } from '@/services/auth.services';
import { isAuthenticated, useAuthStore } from '@/store/auth.store';

const schema = Yup.object({
  email: Yup.string().trim().email('Enter a valid work email.').required('Email is required.'),
});

/**
 * Step 1 of sign-in: ask for the operator's email so the API can mail a code.
 *
 * The pending email and the post-login destination travel to step 2 in the URL
 * rather than in a store, so a refresh (or a bookmarked step-2 link) still has
 * everything it needs.
 */
export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { showToast } = useCustomToast();
  const requestOtp = useRequestOtp();

  const redirectTo = safeRedirectPath(searchParams.get(REDIRECT_PARAM));
  const hydrated = useAuthStore((state) => state.hydrated);

  // `services/base.ts` appends this when it ejects a dead session. Staff
  // sessions idle out at 30 minutes and expire absolutely at 8 hours, so
  // landing back here mid-shift is routine and worth explaining.
  const ejected = searchParams.get('reason') === 'session_expired';

  // A live session has no business on the login screen. Gated on `hydrated`
  // because the token lives in localStorage and is absent during SSR.
  useEffect(() => {
    if (hydrated && isAuthenticated()) router.replace(redirectTo);
  }, [hydrated, redirectTo, router]);

  return (
    <div className="space-y-5">
      <div className="space-y-1.5">
        <h2 className="font-display text-base font-semibold">Sign in</h2>
        <p className="text-muted-foreground text-[12.5px] leading-relaxed">
          Enter your Komtru email and we&apos;ll send you a one-time code.
        </p>
      </div>

      {ejected ? (
        <p
          className="border-border bg-secondary/60 text-muted-foreground rounded-lg border p-3 text-[11.5px] leading-relaxed"
          role="status"
        >
          Your session ended and you were signed out. Sign in again to pick up where you left off.
        </p>
      ) : null}

      <Formik
        initialValues={{ email: '' }}
        validationSchema={schema}
        onSubmit={({ email }) => {
          const normalized = email.trim().toLowerCase();

          requestOtp.mutate(
            { email: normalized },
            {
              onSuccess: () => {
                const query = new URLSearchParams({ email: normalized });
                if (redirectTo) query.set(REDIRECT_PARAM, redirectTo);

                router.push(`/verify?${query.toString()}`);
              },
              onError: (error) => {
                showToast({
                  title: "Couldn't send the code",
                  description: error.message,
                  type: 'error',
                });
              },
            },
          );
        }}
      >
        {({ errors, touched, isValid, dirty }) => (
          <Form className="space-y-4" noValidate>
            <div className="space-y-1.5">
              <Field
                as={FloatingLabelInput}
                name="email"
                type="email"
                label="Work email"
                autoComplete="email"
                autoFocus
                required
                invalid={Boolean(touched.email && errors.email)}
              />
              <ErrorMessage
                name="email"
                render={(message) => (
                  <p className="text-komtru-risk text-[11.5px]" role="alert">
                    {message}
                  </p>
                )}
              />
            </div>

            <Button
              type="submit"
              size="xl"
              fullWidth
              disabled={requestOtp.isPending || !(dirty && isValid)}
            >
              {requestOtp.isPending ? 'Sending code…' : 'Send code'}
              {requestOtp.isPending ? null : <ArrowRight aria-hidden />}
            </Button>
          </Form>
        )}
      </Formik>
    </div>
  );
}
