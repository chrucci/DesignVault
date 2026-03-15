"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { createClient } from "@/lib/supabase/client"

interface TaxRate {
  id: string
  state: string
  rate: number
}

interface BusinessInfo {
  id: string
  business_name: string | null
  contact_name: string | null
  phone: string | null
  email: string | null
  address: string | null
}

export default function SettingsPage() {
  const [taxRates, setTaxRates] = React.useState<TaxRate[]>([])
  const [newState, setNewState] = React.useState("")
  const [newRate, setNewRate] = React.useState("")
  const [businessInfo, setBusinessInfo] = React.useState<BusinessInfo>({
    id: "",
    business_name: "",
    contact_name: "",
    phone: "",
    email: "",
    address: "",
  })

  React.useEffect(() => {
    const supabase = createClient()

    supabase
      .from("tax_rates")
      .select("*")
      .order("state")
      .then(({ data }) => {
        if (data) setTaxRates(data)
      })

    supabase
      .from("business_info")
      .select("*")
      .limit(1)
      .single()
      .then(({ data }) => {
        if (data) setBusinessInfo(data)
      })
  }, [])

  const addTaxRate = async () => {
    if (!newState || !newRate) return
    const supabase = createClient()
    const { data } = await supabase
      .from("tax_rates")
      .upsert({ state: newState, rate: parseFloat(newRate) })
      .select()
      .single()
    if (data) {
      setTaxRates((prev) => [...prev.filter((t) => t.state !== newState), data].sort((a, b) => a.state.localeCompare(b.state)))
      setNewState("")
      setNewRate("")
    }
  }

  const deleteTaxRate = async (id: string) => {
    const supabase = createClient()
    await supabase.from("tax_rates").delete().eq("id", id)
    setTaxRates((prev) => prev.filter((t) => t.id !== id))
  }

  const saveBusinessInfo = async () => {
    const supabase = createClient()
    if (businessInfo.id) {
      await supabase
        .from("business_info")
        .update({
          business_name: businessInfo.business_name,
          contact_name: businessInfo.contact_name,
          phone: businessInfo.phone,
          email: businessInfo.email,
          address: businessInfo.address,
        })
        .eq("id", businessInfo.id)
    } else {
      await supabase.from("business_info").insert({
        business_name: businessInfo.business_name,
        contact_name: businessInfo.contact_name,
        phone: businessInfo.phone,
        email: businessInfo.email,
        address: businessInfo.address,
      })
    }
  }

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold">Settings</h1>

      <Card>
        <CardHeader>
          <CardTitle>Tax Rates</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            {taxRates.map((rate) => (
              <div key={rate.id} className="flex items-center gap-4">
                <span className="w-24 font-medium">{rate.state}</span>
                <span>{rate.rate}%</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => deleteTaxRate(rate.id)}
                >
                  Delete
                </Button>
              </div>
            ))}
          </div>
          <div className="flex items-end gap-2">
            <div>
              <Label htmlFor="new-state">State</Label>
              <Input
                id="new-state"
                value={newState}
                onChange={(e) => setNewState(e.target.value)}
                placeholder="CA"
              />
            </div>
            <div>
              <Label htmlFor="new-rate">Rate (%)</Label>
              <Input
                id="new-rate"
                type="number"
                step="0.01"
                value={newRate}
                onChange={(e) => setNewRate(e.target.value)}
                placeholder="8.25"
              />
            </div>
            <Button onClick={addTaxRate}>Add</Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Business Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="biz-name">Business Name</Label>
            <Input
              id="biz-name"
              value={businessInfo.business_name ?? ""}
              onChange={(e) =>
                setBusinessInfo((prev) => ({
                  ...prev,
                  business_name: e.target.value,
                }))
              }
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="biz-contact">Contact Name</Label>
            <Input
              id="biz-contact"
              value={businessInfo.contact_name ?? ""}
              onChange={(e) =>
                setBusinessInfo((prev) => ({
                  ...prev,
                  contact_name: e.target.value,
                }))
              }
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="biz-phone">Phone</Label>
            <Input
              id="biz-phone"
              value={businessInfo.phone ?? ""}
              onChange={(e) =>
                setBusinessInfo((prev) => ({ ...prev, phone: e.target.value }))
              }
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="biz-email">Email</Label>
            <Input
              id="biz-email"
              type="email"
              value={businessInfo.email ?? ""}
              onChange={(e) =>
                setBusinessInfo((prev) => ({ ...prev, email: e.target.value }))
              }
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="biz-address">Address</Label>
            <Input
              id="biz-address"
              value={businessInfo.address ?? ""}
              onChange={(e) =>
                setBusinessInfo((prev) => ({
                  ...prev,
                  address: e.target.value,
                }))
              }
            />
          </div>
          <Button onClick={saveBusinessInfo}>Save</Button>
        </CardContent>
      </Card>
    </div>
  )
}
