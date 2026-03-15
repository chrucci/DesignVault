"use client"

import Link from "next/link"
import { Card, CardContent } from "@/components/ui/card"

interface ProductCardProps {
  id: string
  name: string
  brand?: string | null
  retail_price?: number | null
  primary_image_url?: string | null
}

function formatPrice(price: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(price)
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
      <Card className="overflow-hidden hover:shadow-md transition-shadow cursor-pointer">
        {primary_image_url && (
          <div className="aspect-square relative bg-muted">
            <img
              src={primary_image_url}
              alt={name}
              className="object-cover w-full h-full"
            />
          </div>
        )}
        <CardContent className="p-4">
          <h3 className="font-medium truncate">{name}</h3>
          {brand && (
            <p className="text-sm text-muted-foreground truncate">{brand}</p>
          )}
          {retail_price != null && (
            <p className="text-sm font-semibold mt-1">
              {formatPrice(retail_price)}
            </p>
          )}
        </CardContent>
      </Card>
    </Link>
  )
}
