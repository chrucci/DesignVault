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
import { Package, Plus, Search } from 'lucide-react';

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

  const EmptyState = ({ message }: { message: string }) => (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="rounded-full bg-muted p-5 mb-4">
        <Package className="h-10 w-10 text-muted-foreground" />
      </div>
      <p className="text-muted-foreground max-w-sm">{message}</p>
    </div>
  );

  const ProductGrid = ({ items }: { items: Product[] }) => (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mt-4">
      {items.map((product) => (
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
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Products</h1>
          <p className="text-muted-foreground mt-1">
            {products.length} {products.length === 1 ? 'product' : 'products'} in your collection
          </p>
        </div>
        <Button onClick={() => setShowCreateDialog(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          Add Product
        </Button>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search products..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      <Tabs defaultValue="all" onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="all">All Products</TabsTrigger>
          <TabsTrigger value="inbox">Inbox</TabsTrigger>
        </TabsList>

        <TabsContent value="all">
          {loading ? (
            <p className="text-muted-foreground py-8 text-center">Loading...</p>
          ) : filteredProducts.length === 0 ? (
            <EmptyState
              message={
                search
                  ? 'No products match your search.'
                  : 'No products yet. Use the Chrome extension to clip products from supplier websites.'
              }
            />
          ) : (
            <ProductGrid items={filteredProducts} />
          )}
        </TabsContent>

        <TabsContent value="inbox">
          {loading ? (
            <p className="text-muted-foreground py-8 text-center">Loading...</p>
          ) : filteredProducts.length === 0 ? (
            <EmptyState
              message={
                search
                  ? 'No unassigned products match your search.'
                  : 'No unassigned products. All products have been added to rooms.'
              }
            />
          ) : (
            <ProductGrid items={filteredProducts} />
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
