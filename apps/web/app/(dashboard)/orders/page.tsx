'use client';

import * as React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { createClient } from '@/lib/supabase/client';

interface OrderItem {
  id: string;
  name: string;
  source_url: string | null;
  quantity: number;
  wholesale_price: number | null;
  domain: string;
}

export default function OrdersPage() {
  const [items, setItems] = React.useState<OrderItem[]>([]);
  const [checked, setChecked] = React.useState<Record<string, boolean>>({});

  React.useEffect(() => {
    const supabase = createClient();

    supabase
      .from('room_products')
      .select(
        'id, quantity, product:products(id, name, source_url, wholesale_price), room:rooms(project:projects(status))',
      )
      .then(({ data }) => {
        if (!data) return;
        const orderItems: OrderItem[] = [];
        for (const rp of data as Record<string, unknown>[]) {
          const product = rp.product as Record<string, unknown> | null;
          const room = rp.room as Record<string, unknown> | null;
          const project = room?.project as Record<string, unknown> | null;
          if (project?.status !== 'active' || !product) continue;
          let domain = 'other';
          try {
            if (product.source_url) {
              domain = new URL(product.source_url as string).hostname;
            }
          } catch {}
          orderItems.push({
            id: rp.id as string,
            name: product.name as string,
            source_url: product.source_url as string | null,
            quantity: rp.quantity as number,
            wholesale_price: product.wholesale_price as number | null,
            domain,
          });
        }
        setItems(orderItems);
      });
  }, []);

  const grouped = items.reduce<Record<string, OrderItem[]>>((acc, item) => {
    if (!acc[item.domain]) acc[item.domain] = [];
    acc[item.domain].push(item);
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Quick Orders</h1>

      {Object.keys(grouped).length === 0 && (
        <p className="text-muted-foreground">No items to order.</p>
      )}

      {Object.entries(grouped).map(([domain, domainItems]) => (
        <Card key={domain}>
          <CardHeader>
            <CardTitle>{domain}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {domainItems.map((item) => (
                <div key={item.id} className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={checked[item.id] ?? false}
                    onChange={(e) =>
                      setChecked((prev) => ({
                        ...prev,
                        [item.id]: e.target.checked,
                      }))
                    }
                  />
                  <span className="flex-1 text-sm">{item.name}</span>
                  {item.source_url && (
                    <a
                      href={item.source_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-blue-600 hover:underline"
                    >
                      Link
                    </a>
                  )}
                  <span className="text-sm text-muted-foreground">Qty: {item.quantity}</span>
                  {item.wholesale_price != null && (
                    <span className="text-sm font-medium">${item.wholesale_price.toFixed(2)}</span>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
