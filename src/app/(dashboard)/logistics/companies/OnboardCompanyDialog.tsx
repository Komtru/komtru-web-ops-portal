'use client';

import { useState } from 'react';
import { Building2, Plus, Sparkles, UserCheck, Clock } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useCustomToast } from '@/hooks/useCustomToast';
import { errorMessageOf } from '@/components/general/query-state';
import { useOnboardLogisticsCompany } from '@/services/logistics.services';
import type { OnboardCompanyResponse } from '@/interfaces/logistics';

export function OnboardCompanyDialog() {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [channel, setChannel] = useState<'EMAIL' | 'PHONE'>('EMAIL');
  const [pocValue, setPocValue] = useState('');
  const [successResult, setSuccessResult] = useState<OnboardCompanyResponse | null>(null);

  const { showToast } = useCustomToast();
  const onboard = useOnboardLogisticsCompany();

  const canSubmit = name.trim().length >= 2 && pocValue.trim().length >= 3 && !onboard.isPending;

  const reset = () => {
    setName('');
    setPocValue('');
    setSuccessResult(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;

    onboard.mutate(
      {
        name: name.trim(),
        initialPoc: {
          ...(channel === 'EMAIL' ? { email: pocValue.trim() } : { phone: pocValue.trim() }),
        },
      },
      {
        onSuccess: (result) => {
          setSuccessResult(result);
          showToast({
            title: 'Company onboarded',
            description: `${result.company.name} was successfully created.`,
            type: 'success',
          });
        },
        onError: (err) => {
          showToast({
            title: 'Onboarding failed',
            description: errorMessageOf(err),
            type: 'error',
          });
        },
      },
    );
  };

  const handleClose = () => {
    setOpen(false);
    reset();
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) reset();
      }}
    >
      <DialogTrigger asChild>
        <Button size="sm" className="gap-2">
          <Plus className="size-4" aria-hidden />
          Onboard Company
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        {successResult ? (
          <div className="space-y-4 py-2">
            <DialogHeader>
              <div className="flex items-center gap-2 text-emerald-500">
                <Sparkles className="size-5" />
                <DialogTitle>Onboarding Successful</DialogTitle>
              </div>
              <DialogDescription>
                Company <span className="font-semibold text-foreground">{successResult.company.name}</span> has been created.
              </DialogDescription>
            </DialogHeader>

            {successResult.poc.outcome === 'LINKED' ? (
              <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/10 p-4 text-sm space-y-2">
                <div className="flex items-center gap-2 font-medium text-emerald-600 dark:text-emerald-400">
                  <UserCheck className="size-4" />
                  Account Linked (Active)
                </div>
                <p className="text-muted-foreground text-xs leading-relaxed">
                  The initial Point of Contact was matched to an existing account. The user has been assigned the <strong>ADMIN</strong> role and can log in to the logistics portal right now.
                </p>
              </div>
            ) : (
              <div className="rounded-lg border border-amber-500/20 bg-amber-500/10 p-4 text-sm space-y-2">
                <div className="flex items-center gap-2 font-medium text-amber-600 dark:text-amber-400">
                  <Clock className="size-4" />
                  Pending Registration
                </div>
                <p className="text-muted-foreground text-xs leading-relaxed">
                  No existing account was found for this contact. A pending invitation was created. Once they complete standard registration on Komtru with this contact, their logistics access will activate automatically.
                </p>
              </div>
            )}

            <DialogFooter className="pt-2">
              <Button onClick={handleClose} className="w-full">
                Done
              </Button>
            </DialogFooter>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Building2 className="size-5 text-muted-foreground" />
                Onboard Logistics Company
              </DialogTitle>
              <DialogDescription>
                Register a courier partner and assign their initial administrator.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-3">
              <div className="space-y-1.5">
                <Label htmlFor="company-name">Company Name</Label>
                <Input
                  id="company-name"
                  placeholder="e.g. GIG Logistics, DHL Express"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  disabled={onboard.isPending}
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label>POC Contact Channel</Label>
                <RadioGroup
                  value={channel}
                  onValueChange={(val: 'EMAIL' | 'PHONE') => {
                    setChannel(val);
                    setPocValue('');
                  }}
                  className="flex gap-4 pt-1"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="EMAIL" id="ch-email" />
                    <Label htmlFor="ch-email" className="font-normal cursor-pointer">
                      Email Address
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="PHONE" id="ch-phone" />
                    <Label htmlFor="ch-phone" className="font-normal cursor-pointer">
                      Phone Number
                    </Label>
                  </div>
                </RadioGroup>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="poc-value">
                  {channel === 'EMAIL' ? 'POC Email' : 'POC Phone (E.164 format)'}
                </Label>
                <Input
                  id="poc-value"
                  type={channel === 'EMAIL' ? 'email' : 'tel'}
                  placeholder={channel === 'EMAIL' ? 'admin@courier.com' : '+2348012345678'}
                  value={pocValue}
                  onChange={(e) => setPocValue(e.target.value)}
                  disabled={onboard.isPending}
                  required
                />
              </div>
            </div>

            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" onClick={handleClose} disabled={onboard.isPending}>
                Cancel
              </Button>
              <Button type="submit" disabled={!canSubmit}>
                {onboard.isPending ? 'Onboarding...' : 'Onboard Company'}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
