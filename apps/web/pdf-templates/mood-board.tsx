import React from 'react';
import type { RoomWithProducts } from '@/lib/pdf/fetch-data';
import type { BusinessInfo, Project, Product, ProductImage } from '@design-vault/shared';

export interface MoodBoardProps {
  project: Project;
  rooms: RoomWithProducts[];
  businessInfo: BusinessInfo | null;
  /** Map of product_id to layout type. Products not in this map default to 'grid'. */
  layouts?: Record<string, 'hero' | 'grid' | 'collage'>;
}

function getPrimaryImage(images: ProductImage[]): string | null {
  const primary = images.find((img) => img.is_primary);
  return primary?.image_url || images[0]?.image_url || null;
}

function getDimensionsText(product: Product): string | null {
  if (product.dimensions_text) return product.dimensions_text;
  const parts: string[] = [];
  if (product.dimensions_width) parts.push(`W: ${product.dimensions_width}`);
  if (product.dimensions_depth) parts.push(`D: ${product.dimensions_depth}`);
  if (product.dimensions_height) parts.push(`H: ${product.dimensions_height}`);
  return parts.length > 0 ? parts.join(' \u00D7 ') : null;
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount);
}

function HeroLayout({ product, images }: { product: Product; images: ProductImage[] }) {
  const imageUrl = getPrimaryImage(images);
  const dimensions = getDimensionsText(product);

  return (
    <div
      style={{
        width: '1440px',
        height: '810px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#ffffff',
        padding: '60px',
        pageBreakAfter: 'always',
      }}
    >
      <div style={{ display: 'flex', gap: '60px', alignItems: 'center', maxWidth: '1200px' }}>
        {imageUrl && (
          <img
            src={imageUrl}
            alt={product.name}
            style={{
              maxWidth: '600px',
              maxHeight: '500px',
              objectFit: 'contain',
              borderRadius: '8px',
            }}
          />
        )}
        <div style={{ flex: 1, minWidth: '300px' }}>
          <h2
            style={{
              fontFamily: "'Georgia', serif",
              fontSize: '28px',
              fontWeight: 700,
              color: '#3d3d3d',
              margin: '0 0 20px 0',
              letterSpacing: '1px',
            }}
          >
            {product.name}
          </h2>

          <div
            style={{
              fontSize: '11px',
              fontFamily: "'Courier New', monospace",
              letterSpacing: '2px',
              textTransform: 'uppercase',
              color: '#8c8c8c',
              lineHeight: '2.2',
            }}
          >
            {product.brand && <div>BRAND: {product.brand}</div>}
            {dimensions && <div>DIMENSIONS: {dimensions}</div>}
            {product.materials && <div>MATERIAL: {product.materials}</div>}
            {product.color && <div>COLOR: {product.color}</div>}
          </div>

          {product.retail_price != null && product.retail_price > 0 && (
            <div
              style={{
                marginTop: '24px',
                fontSize: '14px',
                color: '#8c8c8c',
                fontFamily: "'Courier New', monospace",
              }}
            >
              {formatCurrency(product.retail_price)}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function GridLayout({
  products,
}: {
  products: Array<{ product: Product; images: ProductImage[] }>;
}) {
  const cols = products.length <= 2 ? 2 : products.length <= 4 ? 2 : 3;

  return (
    <div
      style={{
        width: '1440px',
        height: '810px',
        background: '#ffffff',
        padding: '50px 60px',
        pageBreakAfter: 'always',
      }}
    >
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: '30px',
          justifyContent: 'center',
          alignItems: 'flex-start',
        }}
      >
        {products.map(({ product, images }) => {
          const imageUrl = getPrimaryImage(images);
          const itemWidth = cols === 2 ? '580px' : '380px';
          const imgHeight = cols === 2 ? '320px' : '260px';

          return (
            <div
              key={product.id}
              style={{
                width: itemWidth,
                textAlign: 'center',
              }}
            >
              {imageUrl && (
                <img
                  src={imageUrl}
                  alt={product.name}
                  style={{
                    width: '100%',
                    height: imgHeight,
                    objectFit: 'cover',
                    borderRadius: '6px',
                  }}
                />
              )}
              <h3
                style={{
                  fontFamily: "'Georgia', serif",
                  fontSize: '14px',
                  fontWeight: 600,
                  color: '#3d3d3d',
                  margin: '12px 0 4px 0',
                  letterSpacing: '0.5px',
                }}
              >
                {product.name}
              </h3>
              <p
                style={{
                  fontSize: '10px',
                  fontFamily: "'Courier New', monospace",
                  letterSpacing: '1.5px',
                  textTransform: 'uppercase',
                  color: '#aaa',
                  margin: '0',
                }}
              >
                {[product.materials, product.color].filter(Boolean).join(' | ')}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function CollageLayout({
  products,
}: {
  products: Array<{ product: Product; images: ProductImage[] }>;
}) {
  // Staggered layout positions for up to 6 products
  const positions = [
    { top: '30px', left: '60px', width: '500px', height: '380px', zIndex: 1 },
    { top: '60px', left: '520px', width: '440px', height: '320px', zIndex: 2 },
    { top: '20px', left: '920px', width: '460px', height: '350px', zIndex: 1 },
    { top: '400px', left: '100px', width: '420px', height: '340px', zIndex: 2 },
    { top: '380px', left: '560px', width: '480px', height: '360px', zIndex: 1 },
    { top: '420px', left: '960px', width: '400px', height: '320px', zIndex: 2 },
  ];

  return (
    <div
      style={{
        width: '1440px',
        height: '810px',
        background: '#f8f6f3',
        position: 'relative',
        overflow: 'hidden',
        pageBreakAfter: 'always',
      }}
    >
      {products.slice(0, 6).map(({ product, images }, i) => {
        const imageUrl = getPrimaryImage(images);
        const pos = positions[i];
        if (!imageUrl) return null;

        return (
          <div
            key={product.id}
            style={{
              position: 'absolute',
              top: pos.top,
              left: pos.left,
              width: pos.width,
              zIndex: pos.zIndex,
            }}
          >
            <img
              src={imageUrl}
              alt={product.name}
              style={{
                width: '100%',
                height: pos.height,
                objectFit: 'cover',
                borderRadius: '4px',
                boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
              }}
            />
            <p
              style={{
                fontFamily: "'Georgia', serif",
                fontSize: '11px',
                color: '#8c8c8c',
                margin: '6px 0 0 0',
                letterSpacing: '0.5px',
              }}
            >
              {product.name}
            </p>
          </div>
        );
      })}
    </div>
  );
}

export function MoodBoardTemplate({ project, rooms, businessInfo, layouts = {} }: MoodBoardProps) {
  const businessName =
    businessInfo?.business_name || 'Deborah Lynn Designs — Decorating Den Interiors\u00AE';

  // Flatten all products
  const allProducts = rooms.flatMap(({ products }) =>
    products.map(({ product, images }) => ({ product, images })),
  );

  // Group products by layout type
  const heroProducts = allProducts.filter((p) => layouts[p.product.id] === 'hero');
  const collageProducts = allProducts.filter((p) => layouts[p.product.id] === 'collage');
  const gridProducts = allProducts.filter(
    (p) => !layouts[p.product.id] || layouts[p.product.id] === 'grid',
  );

  // Split grid products into groups of 4
  const gridPages: Array<typeof gridProducts> = [];
  for (let i = 0; i < gridProducts.length; i += 4) {
    gridPages.push(gridProducts.slice(i, i + 4));
  }

  // Split collage products into groups of 6
  const collagePages: Array<typeof collageProducts> = [];
  for (let i = 0; i < collageProducts.length; i += 6) {
    collagePages.push(collageProducts.slice(i, i + 6));
  }

  return (
    <html>
      <head>
        <style
          dangerouslySetInnerHTML={{
            __html: `
              @page { margin: 0; size: 1440px 810px; }
              * { box-sizing: border-box; }
              body {
                margin: 0;
                padding: 0;
                font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
                color: #3d3d3d;
                -webkit-print-color-adjust: exact;
                print-color-adjust: exact;
              }
            `,
          }}
        />
      </head>
      <body>
        {/* Cover page */}
        <div
          data-testid="cover-page"
          style={{
            width: '1440px',
            height: '810px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            background: '#ffffff',
            textAlign: 'center',
            pageBreakAfter: 'always',
          }}
        >
          {businessInfo?.logo_url && (
            <img
              src={businessInfo.logo_url}
              alt="Logo"
              style={{ maxHeight: '60px', marginBottom: '40px' }}
            />
          )}

          <h1
            style={{
              fontFamily: "'Georgia', serif",
              fontSize: '42px',
              fontWeight: 400,
              letterSpacing: '8px',
              textTransform: 'uppercase',
              color: '#3d3d3d',
              margin: '0 0 16px 0',
            }}
          >
            {project.name}
          </h1>

          <div
            style={{
              width: '60px',
              height: '1px',
              background: '#c9b99a',
              margin: '20px auto',
            }}
          />

          <p
            style={{
              fontSize: '14px',
              letterSpacing: '4px',
              textTransform: 'uppercase',
              color: '#aaa',
              margin: '0 0 8px 0',
            }}
          >
            Design Mood Board
          </p>

          <p
            style={{
              fontSize: '11px',
              color: '#bbb',
              margin: '0',
            }}
          >
            {businessName}
          </p>
        </div>

        {/* Hero pages */}
        {heroProducts.map(({ product, images }) => (
          <HeroLayout key={product.id} product={product} images={images} />
        ))}

        {/* Grid pages */}
        {gridPages.map((group, i) => (
          <GridLayout key={`grid-${i}`} products={group} />
        ))}

        {/* Collage pages */}
        {collagePages.map((group, i) => (
          <CollageLayout key={`collage-${i}`} products={group} />
        ))}
      </body>
    </html>
  );
}
