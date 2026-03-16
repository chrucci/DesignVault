'use client';

import * as React from 'react';
import { useParams, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { type ProductFormValues } from '@design-vault/shared';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogAction,
  AlertDialogCancel,
} from '@/components/ui/alert-dialog';
import { ProductForm } from '@/components/product-form';
import { ProductImageGallery } from '@/components/product-image-gallery';

interface Product {
  id: string;
  name: string;
  brand: string | null;
  model_sku: string | null;
  source_url: string | null;
  wholesale_price: number | null;
  markup_percent: number | null;
  retail_price: number | null;
  dimensions_width: string | null;
  dimensions_depth: string | null;
  dimensions_height: string | null;
  dimensions_text: string | null;
  materials: string | null;
  color: string | null;
  stock_status: string | null;
  shipping_cost: number | null;
  notes: string | null;
  install_notes: string | null;
  spec_url: string | null;
  created_at: string | null;
  updated_at: string | null;
}

interface ProductImage {
  id: string;
  product_id: string;
  image_url: string;
  is_primary: boolean;
  sort_order: number;
}

function formatPrice(price: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(price);
}

export default function ProductDetailPage() {
  const params = useParams();
  const router = useRouter();
  const productId = params.id as string;

  const [product, setProduct] = React.useState<Product | null>(null);
  const [images, setImages] = React.useState<ProductImage[]>([]);
  const [editing, setEditing] = React.useState(false);
  const [loading, setLoading] = React.useState(true);
  const [showDeleteDialog, setShowDeleteDialog] = React.useState(false);

  const supabase = React.useMemo(() => createClient(), []);

  const fetchProduct = React.useCallback(async () => {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('id', productId)
      .single();

    if (error) {
      console.error('Error fetching product:', error);
      setLoading(false);
      return;
    }

    setProduct(data);

    const { data: imgData } = await supabase
      .from('product_images')
      .select('*')
      .eq('product_id', productId)
      .order('sort_order', { ascending: true });

    setImages(imgData || []);
    setLoading(false);
  }, [supabase, productId]);

  React.useEffect(() => {
    fetchProduct();
  }, [fetchProduct]);

  const handleUpdate = async (formData: ProductFormValues) => {
    const updateData: Record<string, unknown> = { ...formData };
    // Remove empty strings for URL fields
    if (!updateData.source_url) delete updateData.source_url;
    if (!updateData.spec_url) delete updateData.spec_url;

    const { data, error } = await supabase
      .from('products')
      .update(updateData)
      .eq('id', productId)
      .select()
      .single();

    if (error) {
      console.error('Error updating product:', error);
      return;
    }

    setProduct(data);
    setEditing(false);
  };

  const handleDelete = async () => {
    // Delete images first
    await supabase.from('product_images').delete().eq('product_id', productId);

    const { error } = await supabase.from('products').delete().eq('id', productId);

    if (error) {
      console.error('Error deleting product:', error);
      return;
    }

    router.push('/products');
  };

  if (loading) {
    return <p className="text-muted-foreground">Loading...</p>;
  }

  if (!product) {
    return <p className="text-muted-foreground">Product not found</p>;
  }

  if (editing) {
    return (
      <div className="max-w-2xl space-y-6">
        <h1 className="text-3xl font-bold">Edit Product</h1>
        <ProductForm
          initialData={{
            name: product.name,
            brand: product.brand || '',
            model_sku: product.model_sku || '',
            source_url: product.source_url || '',
            wholesale_price: product.wholesale_price ?? undefined,
            markup_percent: product.markup_percent ?? 55,
            dimensions_width: product.dimensions_width || '',
            dimensions_depth: product.dimensions_depth || '',
            dimensions_height: product.dimensions_height || '',
            dimensions_text: product.dimensions_text || '',
            materials: product.materials || '',
            color: product.color || '',
            stock_status:
              (product.stock_status as 'in_stock' | 'out_of_stock' | 'special_order' | 'unknown') ||
              'unknown',
            shipping_cost: product.shipping_cost ?? 0,
            notes: product.notes || '',
            install_notes: product.install_notes || '',
            spec_url: product.spec_url || '',
          }}
          onSubmit={handleUpdate}
          onCancel={() => setEditing(false)}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">{product.name}</h1>
        <div className="flex gap-2">
          <Button onClick={() => setEditing(true)}>Edit</Button>
          <Button variant="destructive" onClick={() => setShowDeleteDialog(true)}>
            Delete
          </Button>
          <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete Product</AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure you want to delete this product? This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleDelete}>Confirm</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="space-y-4">
          {product.brand && (
            <div>
              <span className="text-sm text-muted-foreground">Brand</span>
              <p className="font-medium">{product.brand}</p>
            </div>
          )}

          {product.model_sku && (
            <div>
              <span className="text-sm text-muted-foreground">Model/SKU</span>
              <p className="font-medium">{product.model_sku}</p>
            </div>
          )}

          <div className="flex gap-8">
            {product.wholesale_price != null && (
              <div>
                <span className="text-sm text-muted-foreground">Wholesale Price</span>
                <p className="font-medium">{formatPrice(product.wholesale_price)}</p>
              </div>
            )}

            {product.markup_percent != null && (
              <div>
                <span className="text-sm text-muted-foreground">Markup</span>
                <p className="font-medium">{product.markup_percent}%</p>
              </div>
            )}

            {product.retail_price != null && (
              <div>
                <span className="text-sm text-muted-foreground">Retail Price</span>
                <p className="font-semibold text-lg">{formatPrice(product.retail_price)}</p>
              </div>
            )}
          </div>

          {product.stock_status && product.stock_status !== 'unknown' && (
            <div>
              <span className="text-sm text-muted-foreground">Stock Status</span>
              <p>
                <Badge variant="secondary">{product.stock_status.replace('_', ' ')}</Badge>
              </p>
            </div>
          )}

          {product.materials && (
            <div>
              <span className="text-sm text-muted-foreground">Materials</span>
              <p className="font-medium">{product.materials}</p>
            </div>
          )}

          {product.color && (
            <div>
              <span className="text-sm text-muted-foreground">Color</span>
              <p className="font-medium">{product.color}</p>
            </div>
          )}

          {(product.dimensions_width ||
            product.dimensions_depth ||
            product.dimensions_height ||
            product.dimensions_text) && (
            <div>
              <span className="text-sm text-muted-foreground">Dimensions</span>
              {product.dimensions_text ? (
                <p className="font-medium">{product.dimensions_text}</p>
              ) : (
                <p className="font-medium">
                  {[product.dimensions_width, product.dimensions_depth, product.dimensions_height]
                    .filter(Boolean)
                    .join(' x ')}
                </p>
              )}
            </div>
          )}

          {product.notes && (
            <div>
              <span className="text-sm text-muted-foreground">Notes</span>
              <p className="font-medium">{product.notes}</p>
            </div>
          )}

          {product.install_notes && (
            <div>
              <span className="text-sm text-muted-foreground">Install Notes</span>
              <p className="font-medium">{product.install_notes}</p>
            </div>
          )}

          {product.source_url && (
            <div>
              <span className="text-sm text-muted-foreground">Source</span>
              <p>
                <a
                  href={product.source_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary underline"
                >
                  {product.source_url}
                </a>
              </p>
            </div>
          )}

          {product.spec_url && (
            <div>
              <span className="text-sm text-muted-foreground">Spec Sheet</span>
              <p>
                <a
                  href={product.spec_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary underline"
                >
                  {product.spec_url}
                </a>
              </p>
            </div>
          )}
        </div>

        <div>
          <h2 className="text-lg font-semibold mb-4">Images</h2>
          <Separator className="mb-4" />
          <ProductImageGallery
            productId={productId}
            productName={product.name}
            images={images}
            onImagesChange={setImages}
          />
        </div>
      </div>
    </div>
  );
}
