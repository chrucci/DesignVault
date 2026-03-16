'use client';

import * as React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { createClient } from '@/lib/supabase/client';
import { ShoppingCart, ExternalLink } from 'lucide-react';

interface OrderItem {
  id: string;
  name: string;
  source_url: string | null;
  quantity: number;
  wholesale_price: number | null;
  domain: string;
}

function formatPrice(price: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(price);
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
      <div>
        <div className="flex items-center gap-3">
          <h1 className="text-3xl font-bold tracking-tight">Quick Orders</h1>
          <ShoppingCart className="h-7 w-7 text-muted-foreground" />
        </div>
        <p className="text-muted-foreground mt-1">
          Products from active projects, grouped by supplier for easy ordering
        </p>
      </div>

      {Object.keys(grouped).length === 0 && (
        <Card className="p-8">
          <div className="flex flex-col items-center text-center">
            <div className="rounded-full bg-muted p-4 mb-3">
              <ShoppingCart className="h-8 w-8 text-muted-foreground" />
            </div>
            <p className="text-muted-foreground">
              No items to order. Products from active projects will appear here.
            </p>
          </div>
        </Card>
      )}

      {Object.entries(grouped).map(([domain, domainItems]) => (
        <Card key={domain}>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">{domain}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-1">
              {domainItems.map((item) => (
                <label
                  key={item.id}
                  className="flex items-center gap-3 rounded-md px-3 py-2.5 hover:bg-muted/50 transition-colors cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={checked[item.id] ?? false}
                    onChange={(e) =>
                      setChecked((prev) => ({
                        ...prev,
                        [item.id]: e.target.checked,
                      }))
                    }
                    className="h-4 w-4 rounded border-gray-300 text-primary accent-primary focus:ring-primary/20"
                  />
                  <span
                    className={`flex-1 text-sm font-medium transition-colors ${
                      checked[item.id] ? 'line-through text-muted-foreground' : ''
                    }`}
                  >
                    {item.name}
                  </span>
                  {item.source_url && (
                    <a
                      href={item.source_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-muted-foreground hover:text-primary transition-colors"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <ExternalLink className="h-3.5 w-3.5" />
                    </a>
                  )}
                  <span className="text-xs text-muted-foreground min-w-[3rem] text-right">
                    Qty: {item.quantity}
                  </span>
                  {item.wholesale_price != null && (
                    <span className="text-sm font-medium min-w-[5rem] text-right">
                      {formatPrice(item.wholesale_price)}
                    </span>
                  )}
                </label>
              ))}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
