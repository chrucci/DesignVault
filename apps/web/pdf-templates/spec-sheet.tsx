import React from 'react';
import type { RoomWithProducts } from '@/lib/pdf/fetch-data';
import type { BusinessInfo, Project, Product, ProductImage } from '@design-vault/shared';

export interface SpecSheetProps {
  project: Project;
  rooms: RoomWithProducts[];
  businessInfo: BusinessInfo | null;
  subtitle?: string;
}

function formatDate(dateStr?: string): string {
  const d = dateStr ? new Date(dateStr) : new Date();
  return d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
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
  return parts.length > 0 ? parts.join(' × ') : null;
}

function ProductCard({
  product,
  images,
  notes,
}: {
  product: Product;
  images: ProductImage[];
  notes: string | null;
}) {
  const imageUrl = getPrimaryImage(images);
  const dimensions = getDimensionsText(product);
  const hasTbd = product.stock_status === 'unknown' && !product.brand;

  const fields: Array<{ label: string; value: string }> = [];
  if (product.brand || product.model_sku) {
    fields.push({
      label: 'BRAND / PRODUCT',
      value: [product.brand, product.model_sku].filter(Boolean).join(' — '),
    });
  }
  if (dimensions) fields.push({ label: 'DIMENSIONS', value: dimensions });
  if (product.color) fields.push({ label: 'COLOR', value: product.color });
  if (product.materials) fields.push({ label: 'MATERIALS', value: product.materials });
  if (notes) fields.push({ label: 'NOTES', value: notes });

  return (
    <div style={{ marginBottom: '20px', pageBreakInside: 'avoid' }}>
      <h4
        style={{
          fontFamily: "'Georgia', serif",
          fontSize: '13px',
          fontWeight: 700,
          margin: '0 0 10px 0',
          color: '#1a1a1a',
        }}
      >
        {product.name}
        {hasTbd && (
          <span style={{ color: '#cc0000', fontWeight: 600, marginLeft: '10px' }}>
            TBD — Selection pending
          </span>
        )}
      </h4>

      <div style={{ display: 'flex', gap: '16px' }}>
        {imageUrl && (
          <div style={{ flexShrink: 0, width: '140px' }}>
            <img
              src={imageUrl}
              alt={product.name}
              style={{
                width: '140px',
                height: '120px',
                objectFit: 'cover',
                borderRadius: '4px',
                border: '1px solid #e5e5e5',
              }}
            />
          </div>
        )}

        <div style={{ flex: 1 }}>
          <table
            style={{
              width: '100%',
              borderCollapse: 'collapse',
              fontSize: '11px',
              fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif",
            }}
          >
            <tbody>
              {fields.map((field, i) => (
                <tr key={i}>
                  <td
                    style={{
                      padding: '3px 10px 3px 0',
                      fontWeight: 600,
                      fontSize: '9px',
                      letterSpacing: '0.5px',
                      textTransform: 'uppercase',
                      color: '#666',
                      verticalAlign: 'top',
                      width: '120px',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {field.label}
                  </td>
                  <td
                    style={{
                      padding: '3px 0',
                      color: '#333',
                      verticalAlign: 'top',
                    }}
                  >
                    {field.value}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Links */}
          <div style={{ marginTop: '6px', fontSize: '10px' }}>
            {product.source_url && (
              <a
                href={product.source_url}
                style={{ color: '#2563eb', textDecoration: 'underline', marginRight: '14px' }}
              >
                Product Page (Vendor)
              </a>
            )}
            {product.spec_url && (
              <a href={product.spec_url} style={{ color: '#2563eb', textDecoration: 'underline' }}>
                Spec Sheet PDF
              </a>
            )}
          </div>
        </div>
      </div>

      {/* Install notes callout */}
      {product.install_notes && (
        <div
          style={{
            marginTop: '10px',
            padding: '10px 14px',
            background: '#fef3c7',
            border: '1px solid #f59e0b',
            borderRadius: '4px',
            fontSize: '11px',
            color: '#92400e',
          }}
          data-testid="install-note"
        >
          <strong>&#9888; INSTALL NOTE:</strong> {product.install_notes}
        </div>
      )}

      {/* Notes callout */}
      {product.notes && (
        <div
          style={{
            marginTop: '8px',
            padding: '8px 14px',
            background: '#f5f5f5',
            borderRadius: '4px',
            fontSize: '11px',
            fontStyle: 'italic',
            color: '#666',
          }}
        >
          {product.notes}
        </div>
      )}
    </div>
  );
}

export function SpecSheetTemplate({ project, rooms, businessInfo, subtitle }: SpecSheetProps) {
  const businessName =
    businessInfo?.business_name || 'Deborah Lynn Designs — Decorating Den Interiors\u00AE';
  const preparedDate = formatDate();

  // Collect all TBD items
  const tbdItems: Array<{ roomName: string; productName: string }> = [];
  for (const { room, products } of rooms) {
    for (const { product } of products) {
      if (product.stock_status === 'unknown' && !product.brand) {
        tbdItems.push({ roomName: room.name, productName: product.name });
      }
    }
  }

  return (
    <html>
      <head>
        <style
          dangerouslySetInnerHTML={{
            __html: `
              @page { margin: 0; size: 8.5in 11in; }
              * { box-sizing: border-box; }
              body {
                margin: 0;
                padding: 0;
                font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
                color: #1a1a1a;
                -webkit-print-color-adjust: exact;
                print-color-adjust: exact;
              }
              .page {
                width: 8.5in;
                min-height: 11in;
                padding: 0.75in 0.85in;
                page-break-after: always;
              }
              .cover-page {
                display: flex;
                flex-direction: column;
                justify-content: center;
                align-items: center;
                text-align: center;
                height: 11in;
                padding: 1.5in;
              }
            `,
          }}
        />
      </head>
      <body>
        {/* Cover page */}
        <div className="cover-page" style={{ pageBreakAfter: 'always' }}>
          <h1
            style={{
              fontFamily: "'Georgia', serif",
              fontSize: '32px',
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '3px',
              margin: '0 0 16px 0',
              color: '#1a1a1a',
            }}
          >
            {project.name}
          </h1>

          <p
            style={{
              fontSize: '14px',
              letterSpacing: '4px',
              textTransform: 'uppercase',
              color: '#666',
              margin: '0 0 32px 0',
            }}
          >
            {subtitle || 'FIXTURE SPECIFICATIONS'}
          </p>

          <div
            style={{
              width: '60px',
              height: '2px',
              background: '#b8860b',
              margin: '0 auto 32px',
            }}
          />

          <p
            style={{
              fontSize: '12px',
              color: '#888',
              lineHeight: '1.6',
            }}
          >
            Prepared by {businessName}
            <br />
            {preparedDate}
          </p>
        </div>

        {/* Content pages */}
        {rooms.map(({ room, products }) => (
          <div key={room.id} className="page">
            {/* Room header */}
            <h2
              style={{
                fontFamily: "'Georgia', serif",
                fontSize: '18px',
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '2px',
                margin: '0 0 6px 0',
                color: '#1a1a1a',
              }}
            >
              {room.name}
            </h2>
            <div
              style={{
                height: '2px',
                background: '#b8860b',
                marginBottom: '24px',
              }}
            />

            {products.map(({ product, images, roomProduct }) => (
              <ProductCard
                key={product.id}
                product={product}
                images={images}
                notes={roomProduct.notes}
              />
            ))}
          </div>
        ))}

        {/* TBD items section */}
        {tbdItems.length > 0 && (
          <div className="page">
            <h2
              style={{
                fontFamily: "'Georgia', serif",
                fontSize: '18px',
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '2px',
                margin: '0 0 6px 0',
                color: '#1a1a1a',
              }}
            >
              Items Still Pending (TBD)
            </h2>
            <div
              style={{
                height: '2px',
                background: '#b8860b',
                marginBottom: '24px',
              }}
            />
            <ul style={{ fontSize: '12px', lineHeight: '1.8' }}>
              {tbdItems.map((item, i) => (
                <li key={i} style={{ color: '#cc0000' }}>
                  {item.roomName}: {item.productName}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Footer on last page */}
        <div
          style={{
            position: 'fixed',
            bottom: '0.5in',
            left: '0.85in',
            right: '0.85in',
            textAlign: 'center',
            fontSize: '9px',
            color: '#999',
            borderTop: '1px solid #ddd',
            paddingTop: '8px',
          }}
        >
          {businessName} | {project.name} | Prepared {preparedDate}
        </div>
      </body>
    </html>
  );
}
