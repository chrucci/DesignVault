import { describe, it, expect } from 'vitest';
import { renderToString } from 'react-dom/server';
import React from 'react';
import { InvoiceTemplate } from '@/pdf-templates/invoice';
import type { InvoiceProps } from '@/pdf-templates/invoice';
import type {
  Product,
  ProductImage,
  Project,
  Room,
  RoomProduct,
  BusinessInfo,
} from '@design-vault/shared';

function makeProduct(overrides: Partial<Product> = {}): Product {
  return {
    id: 'prod-1',
    name: 'Designer Vanity',
    brand: 'Kohler',
    model_sku: 'K-1234',
    source_url: 'https://example.com/product',
    wholesale_price: 500,
    markup_percent: 50,
    retail_price: 750,
    dimensions_width: '36"',
    dimensions_depth: '22"',
    dimensions_height: '34"',
    dimensions_text: null,
    materials: 'Solid Wood',
    color: 'White',
    stock_status: 'in_stock',
    shipping_cost: 0,
    notes: null,
    install_notes: null,
    spec_url: null,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
    ...overrides,
  };
}

function makeImage(overrides: Partial<ProductImage> = {}): ProductImage {
  return {
    id: 'img-1',
    product_id: 'prod-1',
    image_url: 'https://example.com/image.jpg',
    is_primary: true,
    sort_order: 0,
    created_at: '2024-01-01T00:00:00Z',
    ...overrides,
  };
}

function makeProject(overrides: Partial<Project> = {}): Project {
  return {
    id: 'proj-1',
    name: 'Wotton Lane Project',
    client_name: 'Jane Smith',
    status: 'active',
    notes: null,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
    ...overrides,
  };
}

function makeRoom(overrides: Partial<Room> = {}): Room {
  return {
    id: 'room-1',
    project_id: 'proj-1',
    name: 'Primary Bathroom',
    sort_order: 0,
    created_at: '2024-01-01T00:00:00Z',
    ...overrides,
  };
}

function makeRoomProduct(overrides: Partial<RoomProduct> = {}): RoomProduct {
  return {
    id: 'rp-1',
    room_id: 'room-1',
    product_id: 'prod-1',
    quantity: 2,
    notes: null,
    sort_order: 0,
    created_at: '2024-01-01T00:00:00Z',
    ...overrides,
  };
}

function renderTemplate(props: Partial<InvoiceProps> = {}): string {
  const defaults: InvoiceProps = {
    project: makeProject(),
    rooms: [
      {
        room: makeRoom(),
        products: [
          {
            roomProduct: makeRoomProduct(),
            product: makeProduct(),
            images: [makeImage()],
          },
        ],
      },
    ],
    businessInfo: null,
    invoiceNumber: 'INV-0001',
    taxRate: 6.35,
    taxState: 'CT',
    shippingTotal: 50,
    notes: 'Thank you for your business!',
  };

  return renderToString(React.createElement(InvoiceTemplate, { ...defaults, ...props }));
}

describe('InvoiceTemplate', () => {
  it('renders invoice number and project name', () => {
    const html = renderTemplate();
    expect(html).toContain('INV-0001');
    expect(html).toContain('Wotton Lane Project');
  });

  it('shows retail prices, NOT wholesale prices', () => {
    const html = renderTemplate();
    // Retail price is $750.00 (wholesale $500 * 1.50)
    expect(html).toContain('$750.00');
    // Wholesale price $500 should NOT appear
    // Note: $500.00 would not appear because line total = $750 * 2 = $1,500
    expect(html).not.toContain('wholesale');
  });

  it('calculates line totals correctly (qty * retail)', () => {
    const html = renderTemplate();
    // 2 units * $750 = $1,500.00
    expect(html).toContain('$1,500.00');
  });

  it('calculates tax correctly', () => {
    const html = renderTemplate();
    // Subtotal: $1,500.00 * 6.35% = $95.25
    expect(html).toContain('$95.25');
    // React renderToString inserts comment nodes between interpolated values
    // so "6.35%" becomes "6.35<!-- -->%" — check for the number and state separately
    expect(html).toContain('6.35');
    expect(html).toContain('CT');
  });

  it('shows shipping total', () => {
    const html = renderTemplate();
    expect(html).toContain('$50.00');
    expect(html).toContain('Shipping');
  });

  it('calculates grand total correctly (subtotal + tax + shipping)', () => {
    const html = renderTemplate();
    // $1,500 + $95.25 + $50 = $1,645.25
    expect(html).toContain('$1,645.25');
    expect(html).toContain('Grand Total');
  });

  it('renders client name', () => {
    const html = renderTemplate();
    expect(html).toContain('Jane Smith');
  });

  it('renders notes when provided', () => {
    const html = renderTemplate();
    expect(html).toContain('Thank you for your business!');
  });

  it('renders room grouping when multiple rooms exist', () => {
    const html = renderTemplate({
      rooms: [
        {
          room: makeRoom({ name: 'Kitchen' }),
          products: [
            {
              roomProduct: makeRoomProduct(),
              product: makeProduct({ name: 'Faucet' }),
              images: [],
            },
          ],
        },
        {
          room: makeRoom({ id: 'room-2', name: 'Bathroom' }),
          products: [
            {
              roomProduct: makeRoomProduct({ room_id: 'room-2' }),
              product: makeProduct({ id: 'prod-2', name: 'Vanity' }),
              images: [],
            },
          ],
        },
      ],
    });
    expect(html).toContain('Kitchen');
    expect(html).toContain('Bathroom');
  });

  it('renders business info when provided', () => {
    const html = renderTemplate({
      businessInfo: {
        id: 'bi-1',
        business_name: 'Deborah Lynn Designs',
        contact_name: 'Deborah Lynn',
        phone: '555-1234',
        email: 'deb@example.com',
        address: '123 Main St',
        logo_url: null,
        updated_at: '2024-01-01T00:00:00Z',
      },
    });
    expect(html).toContain('Deborah Lynn Designs');
    expect(html).toContain('555-1234');
    expect(html).toContain('deb@example.com');
    expect(html).toContain('123 Main St');
  });
});
