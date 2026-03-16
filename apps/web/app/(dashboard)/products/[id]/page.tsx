'use client';

import * as React from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { type ProductFormValues } from '@design-vault/shared';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
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
import { ArrowLeft, DollarSign, Ruler, LinkIcon, StickyNote } from 'lucide-react';

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

function stockStatusLabel(status: string): string {
  switch (status) {
    case 'in_stock':
      return 'In Stock';
    case 'out_of_stock':
      return 'Out of Stock';
    case 'special_order':
      return 'Special Order';
    default:
      return status;
  }
}

function stockStatusClass(status: string): string {
  switch (status) {
    case 'in_stock':
      return 'bg-emerald-100 text-emerald-800';
    case 'out_of_stock':
      return 'bg-red-100 text-red-800';
    case 'special_order':
      return 'bg-amber-100 text-amber-800';
    default:
      return '';
  }
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
    return <p className="text-muted-foreground p-6">Loading...</p>;
  }

  if (!product) {
    return <p className="text-muted-foreground p-6">Product not found</p>;
  }

  if (editing) {
    return (
      <div className="max-w-2xl space-y-6">
        <Link
          href={`/products/${productId}`}
          onClick={(e) => {
            e.preventDefault();
            setEditing(false);
          }}
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Product
        </Link>
        <h1 className="text-3xl font-bold tracking-tight">Edit Product</h1>
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

  const hasDimensions =
    product.dimensions_width ||
    product.dimensions_depth ||
    product.dimensions_height ||
    product.dimensions_text;
  const hasSpecifications = hasDimensions || product.materials || product.color;
  const hasLinks = product.source_url || product.spec_url;
  const hasNotes = product.notes || product.install_notes;

  return (
    <div className="space-y-6">
      {/* Back nav */}
      <Link
        href="/products"
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Products
      </Link>

      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{product.name}</h1>
          <div className="flex items-center gap-3 mt-2">
            {product.brand && <span className="text-muted-foreground">{product.brand}</span>}
            {product.model_sku && (
              <span className="text-sm text-muted-foreground">SKU: {product.model_sku}</span>
            )}
            {product.stock_status && product.stock_status !== 'unknown' && (
              <Badge className={stockStatusClass(product.stock_status)}>
                {stockStatusLabel(product.stock_status)}
              </Badge>
            )}
          </div>
        </div>
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

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Left column - Image gallery (more prominent) */}
        <div>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Images</CardTitle>
            </CardHeader>
            <CardContent>
              <ProductImageGallery
                productId={productId}
                productName={product.name}
                images={images}
                onImagesChange={setImages}
              />
            </CardContent>
          </Card>
        </div>

        {/* Right column - Product info cards */}
        <div className="space-y-4">
          {/* Pricing Card */}
          {(product.wholesale_price != null || product.retail_price != null) && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                  Pricing
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap items-baseline gap-6">
                  {product.retail_price != null && (
                    <div>
                      <p className="text-xs text-muted-foreground uppercase tracking-wide">
                        Retail
                      </p>
                      <p className="text-2xl font-bold text-emerald-700">
                        {formatPrice(product.retail_price)}
                      </p>
                    </div>
                  )}
                  {product.wholesale_price != null && (
                    <div>
                      <p className="text-xs text-muted-foreground uppercase tracking-wide">
                        Wholesale
                      </p>
                      <p className="text-lg font-medium">{formatPrice(product.wholesale_price)}</p>
                    </div>
                  )}
                  {product.markup_percent != null && (
                    <div>
                      <p className="text-xs text-muted-foreground uppercase tracking-wide">
                        Markup
                      </p>
                      <p className="text-lg font-medium">{product.markup_percent}%</p>
                    </div>
                  )}
                  {product.retail_price != null && product.wholesale_price != null && (
                    <>
                      <div>
                        <p className="text-xs text-muted-foreground uppercase tracking-wide">
                          Gross Profit
                        </p>
                        <p className="text-lg font-medium text-emerald-700">
                          {formatPrice(product.retail_price - product.wholesale_price)}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground uppercase tracking-wide">
                          Margin
                        </p>
                        <p className="text-lg font-medium text-emerald-700">
                          {((1 - product.wholesale_price / product.retail_price) * 100).toFixed(1)}%
                        </p>
                      </div>
                    </>
                  )}
                </div>
                {product.shipping_cost != null && product.shipping_cost > 0 && (
                  <p className="text-sm text-muted-foreground mt-3">
                    Shipping: {formatPrice(product.shipping_cost)}
                  </p>
                )}
              </CardContent>
            </Card>
          )}

          {/* Specifications Card */}
          {hasSpecifications && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Ruler className="h-4 w-4 text-muted-foreground" />
                  Specifications
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {hasDimensions && (
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wide">
                      Dimensions
                    </p>
                    {product.dimensions_text ? (
                      <p className="font-medium">{product.dimensions_text}</p>
                    ) : (
                      <p className="font-medium">
                        {[
                          product.dimensions_width,
                          product.dimensions_depth,
                          product.dimensions_height,
                        ]
                          .filter(Boolean)
                          .join(' x ')}
                      </p>
                    )}
                  </div>
                )}
                {product.materials && (
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wide">
                      Materials
                    </p>
                    <p className="font-medium">{product.materials}</p>
                  </div>
                )}
                {product.color && (
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wide">Color</p>
                    <p className="font-medium">{product.color}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Links Card */}
          {hasLinks && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <LinkIcon className="h-4 w-4 text-muted-foreground" />
                  Links
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {product.source_url && (
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wide">
                      Product Page
                    </p>
                    <a
                      href={product.source_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-primary hover:underline break-all"
                    >
                      {product.source_url}
                    </a>
                  </div>
                )}
                {product.spec_url && (
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wide">
                      Spec Sheet
                    </p>
                    <a
                      href={product.spec_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-primary hover:underline break-all"
                    >
                      {product.spec_url}
                    </a>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Notes Card */}
          {hasNotes && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <StickyNote className="h-4 w-4 text-muted-foreground" />
                  Notes
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {product.notes && (
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wide">
                      General Notes
                    </p>
                    <p className="text-sm whitespace-pre-wrap">{product.notes}</p>
                  </div>
                )}
                {product.install_notes && (
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wide">
                      Install Notes
                    </p>
                    <p className="text-sm whitespace-pre-wrap">{product.install_notes}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
