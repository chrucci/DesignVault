'use client';

import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Package } from 'lucide-react';

interface ProductCardProps {
  id: string;
  name: string;
  brand?: string | null;
  retail_price?: number | null;
  primary_image_url?: string | null;
}

function formatPrice(price: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(price);
}

export function ProductCard({
  id,
  name,
  brand,
  retail_price,
  primary_image_url,
}: ProductCardProps) {
  return (
    <Link href={`/products/${id}`}>
      <Card className="overflow-hidden hover:shadow-lg transition-all duration-200 hover:-translate-y-0.5 cursor-pointer group">
        <div className="aspect-square relative bg-muted">
          {primary_image_url ? (
            <img
              src={primary_image_url}
              alt={name}
              className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-200"
            />
          ) : (
            <div className="flex items-center justify-center w-full h-full">
              <Package className="h-12 w-12 text-muted-foreground/40" />
            </div>
          )}
        </div>
        <CardContent className="p-4">
          <h3 className="font-medium truncate" title={name}>
            {name}
          </h3>
          {brand && <p className="text-sm text-muted-foreground truncate">{brand}</p>}
          {retail_price != null && (
            <p className="text-sm font-semibold mt-1.5 text-emerald-700">
              {formatPrice(retail_price)}
            </p>
          )}
        </CardContent>
      </Card>
    </Link>
  );
}
