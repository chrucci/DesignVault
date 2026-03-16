'use client';

import * as React from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { createClient } from '@/lib/supabase/client';
import { ArrowLeft, FileText, Receipt, Image, Download, RefreshCw } from 'lucide-react';

interface DocumentRecord {
  id: string;
  doc_type: string;
  doc_url: string;
  invoice_number: string | null;
  total: number | null;
  created_at: string;
}

interface TaxRate {
  id: string;
  state: string;
  rate: number;
}

interface Project {
  id: string;
  name: string;
}

function docTypeLabel(docType: string): string {
  switch (docType) {
    case 'spec_sheet':
      return 'Spec Sheet';
    case 'invoice':
      return 'Invoice';
    case 'mood_board':
      return 'Mood Board';
    default:
      return docType;
  }
}

function docTypeIcon(docType: string) {
  switch (docType) {
    case 'spec_sheet':
      return <FileText className="h-4 w-4" />;
    case 'invoice':
      return <Receipt className="h-4 w-4" />;
    case 'mood_board':
      return <Image className="h-4 w-4" />;
    default:
      return <FileText className="h-4 w-4" />;
  }
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
}

export default function DocumentsPage() {
  const params = useParams();
  const projectId = params.id as string;

  const [project, setProject] = React.useState<Project | null>(null);
  const [documents, setDocuments] = React.useState<DocumentRecord[]>([]);
  const [taxRates, setTaxRates] = React.useState<TaxRate[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [generating, setGenerating] = React.useState<string | null>(null);

  // Invoice options
  const [taxState, setTaxState] = React.useState<string>('');
  const [shippingTotal, setShippingTotal] = React.useState<string>('0');

  const fetchData = React.useCallback(async () => {
    const supabase = createClient();

    const [projectRes, docsRes, taxRes] = await Promise.all([
      supabase.from('projects').select('id, name').eq('id', projectId).single(),
      supabase
        .from('documents')
        .select('id, doc_type, doc_url, invoice_number, total, created_at')
        .eq('project_id', projectId)
        .order('created_at', { ascending: false }),
      supabase.from('tax_rates').select('id, state, rate').order('state'),
    ]);

    if (projectRes.data) setProject(projectRes.data);
    if (docsRes.data) setDocuments(docsRes.data);
    if (taxRes.data) {
      setTaxRates(taxRes.data);
      if (taxRes.data.length > 0 && !taxState) {
        setTaxState(taxRes.data[0].state);
      }
    }
    setLoading(false);
  }, [projectId, taxState]);

  React.useEffect(() => {
    fetchData();
  }, [fetchData]);

  const generatePdf = async (docType: 'spec_sheet' | 'invoice' | 'mood_board') => {
    setGenerating(docType);

    try {
      let url: string;
      let requestBody: Record<string, unknown> = { project_id: projectId };

      switch (docType) {
        case 'spec_sheet':
          url = '/api/pdf/spec-sheet';
          break;
        case 'invoice': {
          url = '/api/pdf/invoice';
          const selectedTaxRate = taxRates.find((r) => r.state === taxState);
          requestBody = {
            ...requestBody,
            tax_state: taxState,
            tax_rate: selectedTaxRate?.rate ?? 0,
            shipping_total: parseFloat(shippingTotal) || 0,
          };
          break;
        }
        case 'mood_board':
          url = '/api/pdf/mood-board';
          break;
      }

      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.error || 'PDF generation failed');
      }

      // Download the PDF
      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = downloadUrl;
      const contentDisposition = response.headers.get('Content-Disposition');
      const fileNameMatch = contentDisposition?.match(/filename="(.+?)"/);
      a.download = fileNameMatch?.[1] || `${docType}-${Date.now()}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(downloadUrl);

      // Refresh document list
      await fetchData();
    } catch (error) {
      console.error(`Failed to generate ${docType}:`, error);
      alert(
        `Failed to generate ${docTypeLabel(docType)}: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    } finally {
      setGenerating(null);
    }
  };

  if (loading) {
    return <div className="p-6 text-muted-foreground">Loading...</div>;
  }

  return (
    <div className="space-y-8">
      {/* Back nav */}
      <Link
        href={`/projects/${projectId}`}
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Project
      </Link>

      <div>
        <h1 className="text-3xl font-bold tracking-tight">{project?.name} — Documents</h1>
        <p className="text-muted-foreground mt-1">Generate and manage project documents</p>
      </div>

      {/* Generate section */}
      <div className="grid gap-4 md:grid-cols-3">
        {/* Spec Sheet */}
        <Card className="p-6 space-y-4">
          <div className="flex items-start gap-3">
            <div className="rounded-lg bg-sky-50 p-2.5">
              <FileText className="h-5 w-5 text-sky-600" />
            </div>
            <div>
              <h3 className="font-semibold text-lg">Spec Sheet</h3>
              <p className="text-sm text-muted-foreground">
                Product specifications grouped by room. No prices shown.
              </p>
            </div>
          </div>
          <Button
            className="w-full"
            onClick={() => generatePdf('spec_sheet')}
            disabled={generating !== null}
          >
            {generating === 'spec_sheet' ? 'Generating...' : 'Generate Spec Sheet'}
          </Button>
        </Card>

        {/* Invoice */}
        <Card className="p-6 space-y-4">
          <div className="flex items-start gap-3">
            <div className="rounded-lg bg-emerald-50 p-2.5">
              <Receipt className="h-5 w-5 text-emerald-600" />
            </div>
            <div>
              <h3 className="font-semibold text-lg">Invoice</h3>
              <p className="text-sm text-muted-foreground">
                Client invoice with retail prices, tax, and shipping.
              </p>
            </div>
          </div>
          <div className="space-y-3">
            <div>
              <Label htmlFor="tax-state">Tax State</Label>
              <Select id="tax-state" value={taxState} onValueChange={setTaxState}>
                <option value="">Select state</option>
                {taxRates.map((rate) => (
                  <option key={rate.id} value={rate.state}>
                    {rate.state} ({rate.rate}%)
                  </option>
                ))}
              </Select>
            </div>
            <div>
              <Label htmlFor="shipping">Shipping Total</Label>
              <Input
                id="shipping"
                type="number"
                min="0"
                step="0.01"
                value={shippingTotal}
                onChange={(e) => setShippingTotal(e.target.value)}
                placeholder="0.00"
              />
            </div>
          </div>
          <Button
            className="w-full"
            onClick={() => generatePdf('invoice')}
            disabled={generating !== null}
          >
            {generating === 'invoice' ? 'Generating...' : 'Generate Invoice'}
          </Button>
        </Card>

        {/* Mood Board */}
        <Card className="p-6 space-y-4">
          <div className="flex items-start gap-3">
            <div className="rounded-lg bg-amber-50 p-2.5">
              <Image className="h-5 w-5 text-amber-600" />
            </div>
            <div>
              <h3 className="font-semibold text-lg">Mood Board</h3>
              <p className="text-sm text-muted-foreground">
                Visual presentation of products in a landscape format.
              </p>
            </div>
          </div>
          <Button
            className="w-full"
            onClick={() => generatePdf('mood_board')}
            disabled={generating !== null}
          >
            {generating === 'mood_board' ? 'Generating...' : 'Generate Mood Board'}
          </Button>
        </Card>
      </div>

      {/* Previous documents */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Generated Documents</h2>
        {documents.length === 0 ? (
          <Card className="p-8">
            <div className="flex flex-col items-center text-center">
              <div className="rounded-full bg-muted p-4 mb-3">
                <FileText className="h-8 w-8 text-muted-foreground" />
              </div>
              <p className="text-muted-foreground">
                No documents generated yet. Use the cards above to create one.
              </p>
            </div>
          </Card>
        ) : (
          <div className="space-y-2">
            {documents.map((doc) => (
              <Card key={doc.id} className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <span className="text-muted-foreground">{docTypeIcon(doc.doc_type)}</span>
                  <span className="font-medium">{docTypeLabel(doc.doc_type)}</span>
                  {doc.invoice_number && (
                    <span className="text-sm text-muted-foreground">#{doc.invoice_number}</span>
                  )}
                  {doc.total != null && (
                    <span className="text-sm text-muted-foreground">
                      {formatCurrency(doc.total)}
                    </span>
                  )}
                  <span className="text-sm text-muted-foreground">
                    {formatDate(doc.created_at)}
                  </span>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" asChild className="gap-1.5">
                    <a href={doc.doc_url} target="_blank" rel="noopener noreferrer" download>
                      <Download className="h-3.5 w-3.5" />
                      Download
                    </a>
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-1.5"
                    onClick={() =>
                      generatePdf(doc.doc_type as 'spec_sheet' | 'invoice' | 'mood_board')
                    }
                    disabled={generating !== null}
                  >
                    <RefreshCw className="h-3.5 w-3.5" />
                    Regenerate
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
