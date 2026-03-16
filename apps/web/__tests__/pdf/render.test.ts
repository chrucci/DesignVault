import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock puppeteer — vi.mock is hoisted, so use vi.hoisted for shared refs
const { mockPdf, mockSetContent, mockClose, mockNewPage, mockLaunch } = vi.hoisted(() => {
  const mockPdf = vi.fn().mockResolvedValue(Buffer.from('fake-pdf-content'));
  const mockSetContent = vi.fn().mockResolvedValue(undefined);
  const mockClose = vi.fn().mockResolvedValue(undefined);
  const mockNewPage = vi.fn().mockResolvedValue({
    setContent: mockSetContent,
    pdf: mockPdf,
  });
  const mockLaunch = vi.fn().mockResolvedValue({
    newPage: mockNewPage,
    close: mockClose,
  });
  return { mockPdf, mockSetContent, mockClose, mockNewPage, mockLaunch };
});

vi.mock('puppeteer', () => ({
  default: {
    launch: mockLaunch,
  },
}));

import { renderPdf } from '@/lib/pdf/render';

describe('renderPdf', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Re-set default resolved values after clearAllMocks
    mockPdf.mockResolvedValue(Buffer.from('fake-pdf-content'));
    mockSetContent.mockResolvedValue(undefined);
    mockClose.mockResolvedValue(undefined);
    mockNewPage.mockResolvedValue({
      setContent: mockSetContent,
      pdf: mockPdf,
    });
    mockLaunch.mockResolvedValue({
      newPage: mockNewPage,
      close: mockClose,
    });
  });

  it('launches Puppeteer, sets content, generates PDF, and closes browser', async () => {
    const html = '<html><body><h1>Test</h1></body></html>';
    const result = await renderPdf({ html });

    expect(mockLaunch).toHaveBeenCalledOnce();
    expect(mockNewPage).toHaveBeenCalledOnce();
    expect(mockSetContent).toHaveBeenCalledWith(html, { waitUntil: 'networkidle0' });
    expect(mockPdf).toHaveBeenCalledOnce();
    expect(mockClose).toHaveBeenCalledOnce();
    expect(result).toBeInstanceOf(Buffer);
  });

  it('passes default page size of 8.5in x 11in', async () => {
    await renderPdf({ html: '<html></html>' });

    expect(mockPdf).toHaveBeenCalledWith(
      expect.objectContaining({
        width: '8.5in',
        height: '11in',
        landscape: false,
        printBackground: true,
      }),
    );
  });

  it('accepts custom page size and landscape option', async () => {
    await renderPdf({
      html: '<html></html>',
      width: '1440px',
      height: '810px',
      landscape: true,
    });

    expect(mockPdf).toHaveBeenCalledWith(
      expect.objectContaining({
        width: '1440px',
        height: '810px',
        landscape: true,
      }),
    );
  });

  it('closes browser even if setContent throws', async () => {
    mockSetContent.mockRejectedValueOnce(new Error('Content error'));

    await expect(renderPdf({ html: '<html></html>' })).rejects.toThrow('Content error');
    expect(mockClose).toHaveBeenCalledOnce();
  });

  it('closes browser even if pdf generation throws', async () => {
    mockPdf.mockRejectedValueOnce(new Error('PDF error'));

    await expect(renderPdf({ html: '<html></html>' })).rejects.toThrow('PDF error');
    expect(mockClose).toHaveBeenCalledOnce();
  });

  it('uses PUPPETEER_EXECUTABLE_PATH env var when set', async () => {
    const originalEnv = process.env.PUPPETEER_EXECUTABLE_PATH;
    process.env.PUPPETEER_EXECUTABLE_PATH = '/custom/chromium';

    await renderPdf({ html: '<html></html>' });

    expect(mockLaunch).toHaveBeenCalledWith(
      expect.objectContaining({
        executablePath: '/custom/chromium',
      }),
    );

    if (originalEnv === undefined) {
      delete process.env.PUPPETEER_EXECUTABLE_PATH;
    } else {
      process.env.PUPPETEER_EXECUTABLE_PATH = originalEnv;
    }
  });

  it('launches with --no-sandbox flag for Docker compatibility', async () => {
    await renderPdf({ html: '<html></html>' });

    expect(mockLaunch).toHaveBeenCalledWith(
      expect.objectContaining({
        args: expect.arrayContaining(['--no-sandbox']),
      }),
    );
  });
});
