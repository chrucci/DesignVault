'use client';

import * as React from 'react';
import { createClient } from '@/lib/supabase/client';
import type { ProductFormValues } from '@design-vault/shared';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ProductForm } from '@/components/product-form';
import { ProductCard } from '@/components/product-card';

interface Product {
  id: string;
  name: string;
  brand: string | null;
  retail_price: number | null;
  wholesale_price: number | null;
  markup_percent: number | null;
  product_images: { id: string; image_url: string; is_primary: boolean }[];
  room_products: { id: string }[];
}

export default function ProductsPage() {
  const [products, setProducts] = React.useState<Product[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [search, setSearch] = React.useState('');
  const [showCreateDialog, setShowCreateDialog] = React.useState(false);
  const [activeTab, setActiveTab] = React.useState('all');

  const supabase = React.useMemo(() => createClient(), []);

  const fetchProducts = React.useCallback(async () => {
    const { data, error } = await supabase
      .from('products')
      .select('*, product_images(id, image_url, is_primary), room_products(id)')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching products:', error);
      return;
    }

    setProducts(data || []);
    setLoading(false);
  }, [supabase]);

  React.useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const handleCreateProduct = async (formData: ProductFormValues) => {
    const insertData: Record<string, unknown> = { ...formData };
    // Remove empty strings for URL fields
    if (!insertData.source_url) delete insertData.source_url;
    if (!insertData.spec_url) delete insertData.spec_url;

    const { error } = await supabase.from('products').insert(insertData).select().single();

    if (error) {
      console.error('Error creating product:', error);
      return;
    }

    setShowCreateDialog(false);
    await fetchProducts();
  };

  const filteredProducts = React.useMemo(() => {
    let result = products;

    // Filter by search
    if (search) {
      const lower = search.toLowerCase();
      result = result.filter((p) => p.name.toLowerCase().includes(lower));
    }

    // Filter by tab
    if (activeTab === 'inbox') {
      result = result.filter((p) => !p.room_products || p.room_products.length === 0);
    }

    return result;
  }, [products, search, activeTab]);

  const getPrimaryImageUrl = (product: Product): string | null => {
    if (!product.product_images || product.product_images.length === 0) return null;
    const primary = product.product_images.find((img) => img.is_primary);
    return primary?.image_url || product.product_images[0]?.image_url || null;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Products</h1>
        <Button onClick={() => setShowCreateDialog(true)}>Add Product</Button>
      </div>

      <Input
        placeholder="Search"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="max-w-sm"
      />

      <Tabs defaultValue="all" onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="all">All Products</TabsTrigger>
          <TabsTrigger value="inbox">Inbox</TabsTrigger>
        </TabsList>

        <TabsContent value="all">
          {loading ? (
            <p className="text-muted-foreground">Loading...</p>
          ) : filteredProducts.length === 0 ? (
            <p className="text-muted-foreground py-8 text-center">No products yet</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {filteredProducts.map((product) => (
                <ProductCard
                  key={product.id}
                  id={product.id}
                  name={product.name}
                  brand={product.brand}
                  retail_price={product.retail_price}
                  primary_image_url={getPrimaryImageUrl(product)}
                />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="inbox">
          {loading ? (
            <p className="text-muted-foreground">Loading...</p>
          ) : filteredProducts.length === 0 ? (
            <p className="text-muted-foreground py-8 text-center">No products yet</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {filteredProducts.map((product) => (
                <ProductCard
                  key={product.id}
                  id={product.id}
                  name={product.name}
                  brand={product.brand}
                  retail_price={product.retail_price}
                  primary_image_url={getPrimaryImageUrl(product)}
                />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Product</DialogTitle>
          </DialogHeader>
          <ProductForm onSubmit={handleCreateProduct} onCancel={() => setShowCreateDialog(false)} />
        </DialogContent>
      </Dialog>
    </div>
  );
}
