'use client';

import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { createClient } from '@/lib/supabase/client';

interface Product {
  id: string;
  name: string;
  brand?: string;
}

interface RoomProduct {
  id: string;
  product_id: string;
  quantity: number;
  notes: string | null;
  product: Product;
}

interface RoomProductListProps {
  roomId: string;
  projectId: string;
}

export function RoomProductList({ roomId, projectId: _projectId }: RoomProductListProps) {
  const [roomProducts, setRoomProducts] = React.useState<RoomProduct[]>([]);
  const [searchOpen, setSearchOpen] = React.useState(false);
  const [searchQuery, setSearchQuery] = React.useState('');
  const [searchResults, setSearchResults] = React.useState<Product[]>([]);
  const [quantities, setQuantities] = React.useState<Record<string, string>>({});
  const [savedQuantities, setSavedQuantities] = React.useState<Record<string, number>>({});

  const fetchRoomProducts = React.useCallback(async () => {
    const supabase = createClient();
    const { data } = await supabase
      .from('room_products')
      .select('id, product_id, quantity, notes, product:products(id, name, brand)')
      .eq('room_id', roomId)
      .order('sort_order', { ascending: true });

    if (data) {
      const mapped = data.map((rp: Record<string, unknown>) => ({
        id: rp.id as string,
        product_id: rp.product_id as string,
        quantity: rp.quantity as number,
        notes: rp.notes as string | null,
        product: rp.product as Product,
      }));
      setRoomProducts(mapped);
      const qtyMap: Record<string, string> = {};
      const savedMap: Record<string, number> = {};
      mapped.forEach((rp) => {
        qtyMap[rp.id] = String(rp.quantity);
        savedMap[rp.id] = rp.quantity;
      });
      setQuantities(qtyMap);
      setSavedQuantities(savedMap);
    }
  }, [roomId]);

  React.useEffect(() => {
    fetchRoomProducts();
  }, [fetchRoomProducts]);

  const searchProducts = React.useCallback(async (query: string) => {
    const supabase = createClient();
    let q = supabase.from('products').select('id, name, brand').limit(20);
    if (query) {
      q = q.ilike('name', `%${query}%`);
    }
    const { data } = await q;
    if (data) setSearchResults(data);
  }, []);

  React.useEffect(() => {
    if (searchOpen) {
      searchProducts(searchQuery);
    }
  }, [searchOpen, searchQuery, searchProducts]);

  const assignProduct = async (productId: string) => {
    const supabase = createClient();
    await supabase.from('room_products').insert({
      room_id: roomId,
      product_id: productId,
      quantity: 1,
    });
    setSearchOpen(false);
    setSearchQuery('');
    await fetchRoomProducts();
  };

  const updateQuantity = async (roomProductId: string, quantity: number) => {
    const supabase = createClient();
    await supabase.from('room_products').update({ quantity }).eq('id', roomProductId);
    setSavedQuantities((prev) => ({ ...prev, [roomProductId]: quantity }));
  };

  const removeProduct = async (roomProductId: string) => {
    const supabase = createClient();
    await supabase.from('room_products').delete().eq('id', roomProductId);
    setRoomProducts((prev) => prev.filter((rp) => rp.id !== roomProductId));
  };

  return (
    <div data-testid="room-products" className="space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-medium">Products</h4>
        <Button variant="outline" size="sm" onClick={() => setSearchOpen(true)}>
          Assign Product
        </Button>
      </div>

      {roomProducts.length === 0 && (
        <p className="text-sm text-muted-foreground">No products assigned.</p>
      )}

      {roomProducts.map((rp) => (
        <div key={rp.id} className="group flex items-center gap-3 rounded-md border p-3">
          <div className="flex-1">
            <span className="text-sm font-medium">{rp.product.name}</span>
            {savedQuantities[rp.id] && savedQuantities[rp.id] > 1 && (
              <span className="ml-2 text-sm text-muted-foreground">
                {'\u00d7'} {savedQuantities[rp.id]}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Label htmlFor={`qty-${rp.id}`} className="sr-only">
              Quantity
            </Label>
            <Input
              id={`qty-${rp.id}`}
              aria-label="Quantity"
              type="number"
              min="1"
              className="w-16 h-8 text-sm"
              value={quantities[rp.id] ?? String(rp.quantity)}
              onChange={(e) =>
                setQuantities((prev) => ({
                  ...prev,
                  [rp.id]: e.target.value,
                }))
              }
              onKeyDown={async (e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  const qty = parseInt(quantities[rp.id] || '1', 10);
                  if (qty > 0) {
                    await updateQuantity(rp.id, qty);
                  }
                }
              }}
            />
            <Button
              variant="ghost"
              size="sm"
              className="opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={() => removeProduct(rp.id)}
            >
              Remove
            </Button>
          </div>
        </div>
      ))}

      <Dialog open={searchOpen} onOpenChange={setSearchOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Assign Product</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Input
              placeholder="Search products"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <div className="max-h-60 overflow-y-auto space-y-1">
              {searchResults.map((product) => (
                <button
                  key={product.id}
                  className="w-full text-left px-3 py-2 text-sm rounded-md hover:bg-accent transition-colors"
                  onClick={() => assignProduct(product.id)}
                >
                  {product.name}
                  {product.brand && (
                    <span className="ml-2 text-muted-foreground">{product.brand}</span>
                  )}
                </button>
              ))}
              {searchResults.length === 0 && (
                <p className="text-sm text-muted-foreground px-3 py-2">No products found.</p>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
