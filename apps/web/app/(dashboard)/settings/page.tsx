'use client';

import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { createClient } from '@/lib/supabase/client';
import { Receipt, Building2, Trash2, Plus } from 'lucide-react';

interface TaxRate {
  id: string;
  state: string;
  rate: number;
}

interface BusinessInfo {
  id: string;
  business_name: string | null;
  contact_name: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
}

export default function SettingsPage() {
  const [taxRates, setTaxRates] = React.useState<TaxRate[]>([]);
  const [newState, setNewState] = React.useState('');
  const [newRate, setNewRate] = React.useState('');
  const [businessInfo, setBusinessInfo] = React.useState<BusinessInfo>({
    id: '',
    business_name: '',
    contact_name: '',
    phone: '',
    email: '',
    address: '',
  });

  React.useEffect(() => {
    const supabase = createClient();

    supabase
      .from('tax_rates')
      .select('*')
      .order('state')
      .then(({ data }) => {
        if (data) setTaxRates(data);
      });

    supabase
      .from('business_info')
      .select('*')
      .limit(1)
      .single()
      .then(({ data }) => {
        if (data) setBusinessInfo(data);
      });
  }, []);

  const addTaxRate = async () => {
    if (!newState || !newRate) return;
    const supabase = createClient();
    const { data } = await supabase
      .from('tax_rates')
      .upsert({ state: newState, rate: parseFloat(newRate) })
      .select()
      .single();
    if (data) {
      setTaxRates((prev) =>
        [...prev.filter((t) => t.state !== newState), data].sort((a, b) =>
          a.state.localeCompare(b.state),
        ),
      );
      setNewState('');
      setNewRate('');
    }
  };

  const deleteTaxRate = async (id: string) => {
    const supabase = createClient();
    await supabase.from('tax_rates').delete().eq('id', id);
    setTaxRates((prev) => prev.filter((t) => t.id !== id));
  };

  const saveBusinessInfo = async () => {
    const supabase = createClient();
    if (businessInfo.id) {
      await supabase
        .from('business_info')
        .update({
          business_name: businessInfo.business_name,
          contact_name: businessInfo.contact_name,
          phone: businessInfo.phone,
          email: businessInfo.email,
          address: businessInfo.address,
        })
        .eq('id', businessInfo.id);
    } else {
      await supabase.from('business_info').insert({
        business_name: businessInfo.business_name,
        contact_name: businessInfo.contact_name,
        phone: businessInfo.phone,
        email: businessInfo.email,
        address: businessInfo.address,
      });
    }
  };

  return (
    <div className="space-y-8 max-w-2xl">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground mt-1">
          Manage your business details and tax configuration
        </p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-amber-50 p-2">
              <Receipt className="h-5 w-5 text-amber-600" />
            </div>
            <div>
              <CardTitle>Tax Rates</CardTitle>
              <CardDescription>
                Configure sales tax rates for each state. These are used when generating invoices.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {taxRates.length > 0 && (
            <div className="space-y-2">
              {taxRates.map((rate) => (
                <div
                  key={rate.id}
                  className="flex items-center gap-4 py-2 px-3 rounded-md bg-muted/50"
                >
                  <span className="w-24 font-medium">{rate.state}</span>
                  <span className="text-muted-foreground">{rate.rate}%</span>
                  <div className="flex-1" />
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => deleteTaxRate(rate.id)}
                    className="text-muted-foreground hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
          <div className="flex items-end gap-2 pt-2">
            <div className="space-y-2">
              <Label htmlFor="new-state">State</Label>
              <Input
                id="new-state"
                value={newState}
                onChange={(e) => setNewState(e.target.value)}
                placeholder="e.g. CT"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="new-rate">Rate (%)</Label>
              <Input
                id="new-rate"
                type="number"
                step="0.01"
                value={newRate}
                onChange={(e) => setNewRate(e.target.value)}
                placeholder="e.g. 6.35"
              />
            </div>
            <Button onClick={addTaxRate} className="gap-2">
              <Plus className="h-4 w-4" />
              Add
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-sky-50 p-2">
              <Building2 className="h-5 w-5 text-sky-600" />
            </div>
            <div>
              <CardTitle>Business Information</CardTitle>
              <CardDescription>
                This information appears on your generated documents like invoices and spec sheets.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="biz-name">Business Name</Label>
            <Input
              id="biz-name"
              value={businessInfo.business_name ?? ''}
              onChange={(e) =>
                setBusinessInfo((prev) => ({
                  ...prev,
                  business_name: e.target.value,
                }))
              }
              placeholder="e.g. Deborah Lynn Designs"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="biz-contact">Contact Name</Label>
            <Input
              id="biz-contact"
              value={businessInfo.contact_name ?? ''}
              onChange={(e) =>
                setBusinessInfo((prev) => ({
                  ...prev,
                  contact_name: e.target.value,
                }))
              }
              placeholder="Your full name"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="biz-phone">Phone</Label>
              <Input
                id="biz-phone"
                value={businessInfo.phone ?? ''}
                onChange={(e) => setBusinessInfo((prev) => ({ ...prev, phone: e.target.value }))}
                placeholder="(555) 123-4567"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="biz-email">Email</Label>
              <Input
                id="biz-email"
                type="email"
                value={businessInfo.email ?? ''}
                onChange={(e) => setBusinessInfo((prev) => ({ ...prev, email: e.target.value }))}
                placeholder="you@example.com"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="biz-address">Address</Label>
            <Input
              id="biz-address"
              value={businessInfo.address ?? ''}
              onChange={(e) =>
                setBusinessInfo((prev) => ({
                  ...prev,
                  address: e.target.value,
                }))
              }
              placeholder="123 Main St, City, State ZIP"
            />
          </div>
          <div className="pt-2">
            <Button onClick={saveBusinessInfo}>Save Business Info</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
