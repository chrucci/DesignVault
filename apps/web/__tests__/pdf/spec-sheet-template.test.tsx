import { describe, it, expect } from 'vitest';
import { renderToString } from 'react-dom/server';
import React from 'react';
import { SpecSheetTemplate } from '@/pdf-templates/spec-sheet';
import type { SpecSheetProps } from '@/pdf-templates/spec-sheet';
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
    name: 'Test Vanity',
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
    notes: 'Handle with care',
    install_notes: 'Requires custom plumbing hookup',
    spec_url: 'https://example.com/spec.pdf',
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
    quantity: 1,
    notes: null,
    sort_order: 0,
    created_at: '2024-01-01T00:00:00Z',
    ...overrides,
  };
}

function renderTemplate(props: Partial<SpecSheetProps> = {}): string {
  const defaults: SpecSheetProps = {
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
  };

  return renderToString(React.createElement(SpecSheetTemplate, { ...defaults, ...props }));
}

describe('SpecSheetTemplate', () => {
  it('renders the project name on the cover page', () => {
    const html = renderTemplate();
    expect(html).toContain('Wotton Lane Project');
  });

  it('renders room names as section headers', () => {
    const html = renderTemplate({
      rooms: [
        {
          room: makeRoom({ name: 'Social Bathroom' }),
          products: [
            {
              roomProduct: makeRoomProduct(),
              product: makeProduct(),
              images: [makeImage()],
            },
          ],
        },
        {
          room: makeRoom({ id: 'room-2', name: 'Primary Bathroom' }),
          products: [
            {
              roomProduct: makeRoomProduct({ room_id: 'room-2' }),
              product: makeProduct({ id: 'prod-2', name: 'Toilet' }),
              images: [],
            },
          ],
        },
      ],
    });
    expect(html).toContain('Social Bathroom');
    expect(html).toContain('Primary Bathroom');
  });

  it('does NOT contain any dollar amounts or prices', () => {
    const html = renderTemplate();
    // Check there are no dollar signs anywhere
    expect(html).not.toContain('$');
    // Check the wholesale and retail price values don't appear
    expect(html).not.toContain('500');
    expect(html).not.toContain('750');
    expect(html).not.toContain('wholesale');
    expect(html).not.toContain('retail');
  });

  it('renders install notes in a callout', () => {
    const html = renderTemplate();
    expect(html).toContain('INSTALL NOTE');
    expect(html).toContain('Requires custom plumbing hookup');
    expect(html).toContain('data-testid="install-note"');
  });

  it('renders product details (brand, dimensions, color, materials)', () => {
    const html = renderTemplate();
    expect(html).toContain('Kohler');
    expect(html).toContain('K-1234');
    expect(html).toContain('White');
    expect(html).toContain('Solid Wood');
  });

  it('renders product links', () => {
    const html = renderTemplate();
    expect(html).toContain('href="https://example.com/product"');
    expect(html).toContain('Product Page (Vendor)');
    expect(html).toContain('href="https://example.com/spec.pdf"');
    expect(html).toContain('Spec Sheet PDF');
  });

  it('renders TBD items when product has unknown stock and no brand', () => {
    const tbdProduct = makeProduct({
      id: 'prod-tbd',
      name: 'Pending Fixture',
      brand: null,
      stock_status: 'unknown',
    });

    const html = renderTemplate({
      rooms: [
        {
          room: makeRoom(),
          products: [
            {
              roomProduct: makeRoomProduct(),
              product: tbdProduct,
              images: [],
            },
          ],
        },
      ],
    });

    expect(html).toContain('TBD');
    expect(html).toContain('Selection pending');
    expect(html).toContain('Items Still Pending');
  });

  it('renders business name in the footer', () => {
    const html = renderTemplate({
      businessInfo: {
        id: 'bi-1',
        business_name: 'Test Design Studio',
        contact_name: null,
        phone: null,
        email: null,
        address: null,
        logo_url: null,
        updated_at: '2024-01-01T00:00:00Z',
      },
    });
    expect(html).toContain('Test Design Studio');
  });
});
