import { describe, it, expect } from 'vitest';
import { renderToString } from 'react-dom/server';
import React from 'react';
import { MoodBoardTemplate } from '@/pdf-templates/mood-board';
import type { MoodBoardProps } from '@/pdf-templates/mood-board';
import type { Product, ProductImage, Project, Room, RoomProduct } from '@design-vault/shared';

function makeProduct(overrides: Partial<Product> = {}): Product {
  return {
    id: 'prod-1',
    name: 'Modern Sofa',
    brand: 'West Elm',
    model_sku: 'WE-5678',
    source_url: null,
    wholesale_price: 1200,
    markup_percent: 50,
    retail_price: 1800,
    dimensions_width: '84"',
    dimensions_depth: '36"',
    dimensions_height: '33"',
    dimensions_text: null,
    materials: 'Linen',
    color: 'Oatmeal',
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
    image_url: 'https://example.com/sofa.jpg',
    is_primary: true,
    sort_order: 0,
    created_at: '2024-01-01T00:00:00Z',
    ...overrides,
  };
}

function makeProject(overrides: Partial<Project> = {}): Project {
  return {
    id: 'proj-1',
    name: 'Harbor View Residence',
    client_name: 'John Doe',
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
    name: 'Living Room',
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

function renderTemplate(props: Partial<MoodBoardProps> = {}): string {
  const defaults: MoodBoardProps = {
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

  return renderToString(React.createElement(MoodBoardTemplate, { ...defaults, ...props }));
}

describe('MoodBoardTemplate', () => {
  it('renders the cover page with project name', () => {
    const html = renderTemplate();
    expect(html).toContain('Harbor View Residence');
    expect(html).toContain('data-testid="cover-page"');
  });

  it('renders the cover page with "Design Mood Board" text', () => {
    const html = renderTemplate();
    expect(html).toContain('Design Mood Board');
  });

  it('renders business name on cover page', () => {
    const html = renderTemplate({
      businessInfo: {
        id: 'bi-1',
        business_name: 'Deborah Lynn Designs',
        contact_name: null,
        phone: null,
        email: null,
        address: null,
        logo_url: null,
        updated_at: '2024-01-01T00:00:00Z',
      },
    });
    expect(html).toContain('Deborah Lynn Designs');
  });

  it('renders default business name when businessInfo is null', () => {
    const html = renderTemplate({ businessInfo: null });
    expect(html).toContain('Deborah Lynn Designs');
  });

  it('renders product names', () => {
    const html = renderTemplate();
    expect(html).toContain('Modern Sofa');
  });

  it('renders product images', () => {
    const html = renderTemplate();
    expect(html).toContain('https://example.com/sofa.jpg');
  });

  it('does NOT contain wholesale prices', () => {
    const html = renderTemplate();
    // wholesale_price is 1200 — should not appear
    expect(html).not.toContain('1,200');
    expect(html).not.toContain('wholesale');
  });

  it('renders retail price in hero layout', () => {
    const html = renderTemplate({
      layouts: { 'prod-1': 'hero' },
    });
    // retail_price is 1800 -> $1,800.00
    expect(html).toContain('$1,800.00');
  });

  it('renders products in grid layout by default', () => {
    const html = renderTemplate({
      rooms: [
        {
          room: makeRoom(),
          products: [
            {
              roomProduct: makeRoomProduct(),
              product: makeProduct({ id: 'p1', name: 'Chair A' }),
              images: [makeImage()],
            },
            {
              roomProduct: makeRoomProduct({ id: 'rp-2', product_id: 'p2' }),
              product: makeProduct({ id: 'p2', name: 'Chair B' }),
              images: [makeImage({ id: 'img-2', product_id: 'p2' })],
            },
          ],
        },
      ],
    });
    expect(html).toContain('Chair A');
    expect(html).toContain('Chair B');
  });

  it('renders materials and color for products', () => {
    const html = renderTemplate({
      layouts: { 'prod-1': 'hero' },
    });
    expect(html).toContain('Linen');
    expect(html).toContain('Oatmeal');
  });
});
