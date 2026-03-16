import React from 'react';
import type { RoomWithProducts } from '@/lib/pdf/fetch-data';
import type { BusinessInfo, Project } from '@design-vault/shared';

export interface InvoiceProps {
  project: Project;
  rooms: RoomWithProducts[];
  businessInfo: BusinessInfo | null;
  invoiceNumber: string;
  taxRate: number;
  taxState: string;
  shippingTotal: number;
  notes?: string;
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount);
}

function formatDate(dateStr?: string): string {
  const d = dateStr ? new Date(dateStr) : new Date();
  return d.toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
}

export function InvoiceTemplate({
  project,
  rooms,
  businessInfo,
  invoiceNumber,
  taxRate,
  taxState,
  shippingTotal,
  notes,
}: InvoiceProps) {
  const businessName =
    businessInfo?.business_name || 'Deborah Lynn Designs — Decorating Den Interiors\u00AE';

  // Calculate line items from rooms — use RETAIL price only
  type LineItem = {
    name: string;
    description: string;
    qty: number;
    unitPrice: number;
    lineTotal: number;
    roomName: string;
  };

  const lineItems: LineItem[] = [];
  let subtotal = 0;

  for (const { room, products } of rooms) {
    for (const { product, roomProduct } of products) {
      const retailPrice = product.retail_price ?? 0;
      const qty = roomProduct.quantity;
      const lineTotal = retailPrice * qty;
      subtotal += lineTotal;

      lineItems.push({
        name: product.name,
        description: [product.brand, product.model_sku].filter(Boolean).join(' — '),
        qty,
        unitPrice: retailPrice,
        lineTotal,
        roomName: room.name,
      });
    }
  }

  const taxAmount = subtotal * (taxRate / 100);
  const grandTotal = subtotal + taxAmount + shippingTotal;

  // Group by room
  const roomNames = [...new Set(lineItems.map((item) => item.roomName))];

  const thStyle: React.CSSProperties = {
    padding: '8px 10px',
    textAlign: 'left',
    fontSize: '9px',
    fontWeight: 600,
    letterSpacing: '0.5px',
    textTransform: 'uppercase',
    color: '#666',
    borderBottom: '2px solid #b8860b',
  };

  const tdStyle: React.CSSProperties = {
    padding: '8px 10px',
    fontSize: '11px',
    borderBottom: '1px solid #eee',
    verticalAlign: 'top',
  };

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
            `,
          }}
        />
      </head>
      <body>
        <div
          style={{
            width: '8.5in',
            minHeight: '11in',
            padding: '0.75in 0.85in',
          }}
        >
          {/* Header */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              marginBottom: '40px',
            }}
          >
            <div>
              {businessInfo?.logo_url && (
                <img
                  src={businessInfo.logo_url}
                  alt="Logo"
                  style={{ maxHeight: '60px', marginBottom: '10px' }}
                />
              )}
              <h1
                style={{
                  fontFamily: "'Georgia', serif",
                  fontSize: '20px',
                  fontWeight: 700,
                  margin: '0 0 4px 0',
                  color: '#1a1a1a',
                }}
              >
                {businessName}
              </h1>
              {businessInfo?.contact_name && (
                <p style={{ margin: '0', fontSize: '11px', color: '#666' }}>
                  {businessInfo.contact_name}
                </p>
              )}
              {businessInfo?.address && (
                <p style={{ margin: '2px 0 0 0', fontSize: '11px', color: '#666' }}>
                  {businessInfo.address}
                </p>
              )}
              {businessInfo?.phone && (
                <p style={{ margin: '2px 0 0 0', fontSize: '11px', color: '#666' }}>
                  {businessInfo.phone}
                </p>
              )}
              {businessInfo?.email && (
                <p style={{ margin: '2px 0 0 0', fontSize: '11px', color: '#666' }}>
                  {businessInfo.email}
                </p>
              )}
            </div>

            <div style={{ textAlign: 'right' }}>
              <h2
                style={{
                  fontFamily: "'Georgia', serif",
                  fontSize: '28px',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '3px',
                  color: '#b8860b',
                  margin: '0 0 12px 0',
                }}
              >
                Invoice
              </h2>
              <p style={{ margin: '0', fontSize: '12px' }}>
                <strong>Invoice #:</strong> {invoiceNumber}
              </p>
              <p style={{ margin: '4px 0 0 0', fontSize: '12px' }}>
                <strong>Date:</strong> {formatDate()}
              </p>
              <p style={{ margin: '4px 0 0 0', fontSize: '12px' }}>
                <strong>Project:</strong> {project.name}
              </p>
              {project.client_name && (
                <p style={{ margin: '4px 0 0 0', fontSize: '12px' }}>
                  <strong>Client:</strong> {project.client_name}
                </p>
              )}
            </div>
          </div>

          {/* Line items table */}
          <table
            style={{
              width: '100%',
              borderCollapse: 'collapse',
              marginBottom: '30px',
            }}
          >
            <thead>
              <tr>
                <th style={thStyle}>Product</th>
                <th style={thStyle}>Description</th>
                <th style={{ ...thStyle, textAlign: 'center', width: '50px' }}>Qty</th>
                <th style={{ ...thStyle, textAlign: 'right', width: '100px' }}>Unit Price</th>
                <th style={{ ...thStyle, textAlign: 'right', width: '100px' }}>Total</th>
              </tr>
            </thead>
            <tbody>
              {roomNames.map((roomName) => {
                const roomItems = lineItems.filter((item) => item.roomName === roomName);
                return (
                  <React.Fragment key={roomName}>
                    {roomNames.length > 1 && (
                      <tr>
                        <td
                          colSpan={5}
                          style={{
                            padding: '12px 10px 6px',
                            fontSize: '11px',
                            fontWeight: 700,
                            textTransform: 'uppercase',
                            letterSpacing: '1px',
                            color: '#b8860b',
                            borderBottom: '1px solid #eee',
                          }}
                        >
                          {roomName}
                        </td>
                      </tr>
                    )}
                    {roomItems.map((item, i) => (
                      <tr key={`${roomName}-${i}`}>
                        <td style={{ ...tdStyle, fontWeight: 600 }}>{item.name}</td>
                        <td style={{ ...tdStyle, color: '#666' }}>{item.description}</td>
                        <td style={{ ...tdStyle, textAlign: 'center' }}>{item.qty}</td>
                        <td style={{ ...tdStyle, textAlign: 'right' }}>
                          {formatCurrency(item.unitPrice)}
                        </td>
                        <td style={{ ...tdStyle, textAlign: 'right', fontWeight: 600 }}>
                          {formatCurrency(item.lineTotal)}
                        </td>
                      </tr>
                    ))}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>

          {/* Totals */}
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <table style={{ borderCollapse: 'collapse', width: '280px' }}>
              <tbody>
                <tr>
                  <td style={{ padding: '6px 10px', fontSize: '12px', color: '#666' }}>Subtotal</td>
                  <td
                    style={{
                      padding: '6px 10px',
                      fontSize: '12px',
                      textAlign: 'right',
                    }}
                  >
                    {formatCurrency(subtotal)}
                  </td>
                </tr>
                <tr>
                  <td style={{ padding: '6px 10px', fontSize: '12px', color: '#666' }}>
                    Tax ({taxRate}% — {taxState})
                  </td>
                  <td
                    style={{
                      padding: '6px 10px',
                      fontSize: '12px',
                      textAlign: 'right',
                    }}
                  >
                    {formatCurrency(taxAmount)}
                  </td>
                </tr>
                <tr>
                  <td style={{ padding: '6px 10px', fontSize: '12px', color: '#666' }}>Shipping</td>
                  <td
                    style={{
                      padding: '6px 10px',
                      fontSize: '12px',
                      textAlign: 'right',
                    }}
                  >
                    {formatCurrency(shippingTotal)}
                  </td>
                </tr>
                <tr>
                  <td
                    style={{
                      padding: '10px',
                      fontSize: '14px',
                      fontWeight: 700,
                      borderTop: '2px solid #b8860b',
                    }}
                  >
                    Grand Total
                  </td>
                  <td
                    style={{
                      padding: '10px',
                      fontSize: '14px',
                      fontWeight: 700,
                      textAlign: 'right',
                      borderTop: '2px solid #b8860b',
                    }}
                  >
                    {formatCurrency(grandTotal)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Notes */}
          {notes && (
            <div
              style={{
                marginTop: '30px',
                padding: '14px',
                background: '#f9f9f9',
                borderRadius: '4px',
                fontSize: '11px',
                color: '#666',
                fontStyle: 'italic',
              }}
            >
              <strong style={{ fontStyle: 'normal' }}>Notes:</strong> {notes}
            </div>
          )}

          {/* Footer */}
          <div
            style={{
              marginTop: '40px',
              textAlign: 'center',
              fontSize: '9px',
              color: '#999',
              borderTop: '1px solid #ddd',
              paddingTop: '10px',
            }}
          >
            {businessName} | {project.name} | {formatDate()}
          </div>
        </div>
      </body>
    </html>
  );
}
