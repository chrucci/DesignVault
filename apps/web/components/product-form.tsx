'use client';

import * as React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { productSchema } from '@design-vault/shared';
import type { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';

type FormInput = z.input<typeof productSchema>;
type FormOutput = z.output<typeof productSchema>;

interface ProductFormProps {
  initialData?: Partial<FormInput>;
  onSubmit: (data: FormOutput) => Promise<void> | void;
  onCancel?: () => void;
}

export function ProductForm({ initialData, onSubmit, onCancel }: ProductFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormInput, unknown, FormOutput>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      name: initialData?.name ?? '',
      brand: initialData?.brand ?? '',
      model_sku: initialData?.model_sku ?? '',
      source_url: initialData?.source_url ?? '',
      wholesale_price: initialData?.wholesale_price,
      markup_percent: initialData?.markup_percent ?? 55,
      dimensions_width: initialData?.dimensions_width ?? '',
      dimensions_depth: initialData?.dimensions_depth ?? '',
      dimensions_height: initialData?.dimensions_height ?? '',
      dimensions_text: initialData?.dimensions_text ?? '',
      materials: initialData?.materials ?? '',
      color: initialData?.color ?? '',
      stock_status: initialData?.stock_status ?? 'unknown',
      shipping_cost: initialData?.shipping_cost ?? 0,
      notes: initialData?.notes ?? '',
      install_notes: initialData?.install_notes ?? '',
      spec_url: initialData?.spec_url ?? '',
    },
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Basic Info Section */}
      <div className="space-y-4">
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
          Basic Info
        </h3>
        <div className="space-y-2">
          <Label htmlFor="name">Name</Label>
          <Input id="name" {...register('name')} placeholder="e.g. Kohler Artifacts Faucet" />
          {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="brand">Brand</Label>
            <Input id="brand" {...register('brand')} placeholder="e.g. Kohler" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="model_sku">Model/SKU</Label>
            <Input id="model_sku" {...register('model_sku')} placeholder="e.g. K-72759" />
          </div>
        </div>
      </div>

      <Separator />

      {/* Pricing Section */}
      <div className="space-y-4">
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
          Pricing
        </h3>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="wholesale_price">Wholesale Price</Label>
            <Input
              id="wholesale_price"
              type="number"
              step="0.01"
              {...register('wholesale_price')}
              placeholder="0.00"
            />
            {errors.wholesale_price && (
              <p className="text-sm text-destructive">{errors.wholesale_price.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="markup_percent">Markup %</Label>
            <Input
              id="markup_percent"
              type="number"
              step="0.01"
              {...register('markup_percent')}
              placeholder="55"
            />
            {errors.markup_percent && (
              <p className="text-sm text-destructive">{errors.markup_percent.message}</p>
            )}
          </div>
        </div>
      </div>

      <Separator />

      {/* Specifications Section */}
      <div className="space-y-4">
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
          Specifications
        </h3>
        <div className="grid grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label htmlFor="dimensions_width">Width</Label>
            <Input id="dimensions_width" {...register('dimensions_width')} placeholder='e.g. 24"' />
          </div>
          <div className="space-y-2">
            <Label htmlFor="dimensions_depth">Depth</Label>
            <Input id="dimensions_depth" {...register('dimensions_depth')} placeholder='e.g. 18"' />
          </div>
          <div className="space-y-2">
            <Label htmlFor="dimensions_height">Height</Label>
            <Input
              id="dimensions_height"
              {...register('dimensions_height')}
              placeholder='e.g. 36"'
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="dimensions_text">Dimensions (text)</Label>
          <Input
            id="dimensions_text"
            {...register('dimensions_text')}
            placeholder='e.g. 24" W x 18" D x 36" H'
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="materials">Materials</Label>
            <Input id="materials" {...register('materials')} placeholder="e.g. Brass, Ceramic" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="color">Color</Label>
            <Input id="color" {...register('color')} placeholder="e.g. Brushed Nickel" />
          </div>
        </div>
      </div>

      <Separator />

      {/* Links Section */}
      <div className="space-y-4">
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
          Links
        </h3>
        <div className="space-y-2">
          <Label htmlFor="source_url">Product Page URL</Label>
          <Input
            id="source_url"
            type="url"
            {...register('source_url')}
            placeholder="https://supplier.com/product"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="spec_url">Spec Sheet URL</Label>
          <Input
            id="spec_url"
            type="url"
            {...register('spec_url')}
            placeholder="https://supplier.com/spec.pdf"
          />
        </div>
      </div>

      <Separator />

      {/* Notes Section */}
      <div className="space-y-4">
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
          Notes
        </h3>
        <div className="space-y-2">
          <Label htmlFor="notes">General Notes</Label>
          <Textarea
            id="notes"
            {...register('notes')}
            placeholder="Any notes about this product..."
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="install_notes">Install Notes</Label>
          <Textarea
            id="install_notes"
            {...register('install_notes')}
            placeholder="Special installation instructions..."
          />
        </div>
      </div>

      <Separator />

      {/* Shipping Section */}
      <div className="space-y-4">
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
          Shipping
        </h3>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="stock_status">Stock Status</Label>
            <Select id="stock_status" {...register('stock_status')}>
              <option value="unknown">Unknown</option>
              <option value="in_stock">In Stock</option>
              <option value="out_of_stock">Out of Stock</option>
              <option value="special_order">Special Order</option>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="shipping_cost">Shipping Cost</Label>
            <Input
              id="shipping_cost"
              type="number"
              step="0.01"
              {...register('shipping_cost')}
              placeholder="0.00"
            />
          </div>
        </div>
      </div>

      <div className="flex justify-end gap-2 pt-4">
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
        )}
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Saving...' : 'Save'}
        </Button>
      </div>
    </form>
  );
}
