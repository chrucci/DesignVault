import React, { useState, useEffect, useCallback } from 'react';
import { clipProductSchema } from '@design-vault/shared';
import { clipProduct, getProjects, getRooms, type Project, type Room } from '../lib/api';
import ImageThumbnails from './ImageThumbnails';

export default function ClipForm() {
  // Form fields
  const [name, setName] = useState('');
  const [brand, setBrand] = useState('');
  const [modelSku, setModelSku] = useState('');
  const [sourceUrl, setSourceUrl] = useState('');
  const [wholesalePrice, setWholesalePrice] = useState('');
  const [markupPercent, setMarkupPercent] = useState('55');
  const [color, setColor] = useState('');
  const [materials, setMaterials] = useState('');
  const [dimensionsText, setDimensionsText] = useState('');
  const [notes, setNotes] = useState('');
  const [installNotes, setInstallNotes] = useState('');
  const [specUrl, setSpecUrl] = useState('');

  // Images
  const [imageUrls, setImageUrls] = useState<string[]>([]);

  // Project/Room
  const [projects, setProjects] = useState<Project[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [projectId, setProjectId] = useState('');
  const [roomId, setRoomId] = useState('');

  // Status
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);

  // Populate URL and title from active tab
  useEffect(() => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      const tab = tabs[0];
      if (tab?.url) setSourceUrl(tab.url);
      if (tab?.title) setName(tab.title);
    });
  }, []);

  // Fetch projects
  useEffect(() => {
    getProjects()
      .then(setProjects)
      .catch(() => {
        // Projects may not be available yet, that's ok
      });
  }, []);

  // Fetch rooms when project changes
  useEffect(() => {
    if (!projectId) {
      setRooms([]);
      setRoomId('');
      return;
    }
    getRooms(projectId)
      .then(setRooms)
      .catch(() => setRooms([]));
  }, [projectId]);

  // Listen for image selections from content script
  useEffect(() => {
    const listener = (message: { type: string; urls?: string[] }) => {
      if (message.type === 'IMAGES_SELECTED' && message.urls) {
        setImageUrls((prev) => [...prev, ...message.urls!]);
      }
    };
    chrome.runtime.onMessage.addListener(listener);
    return () => chrome.runtime.onMessage.removeListener(listener);
  }, []);

  const handleSelectImages = useCallback(() => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      const tab = tabs[0];
      if (tab?.id) {
        chrome.tabs.sendMessage(tab.id, { type: 'START_IMAGE_SELECTION' });
      }
    });
  }, []);

  const handleRemoveImage = useCallback((index: number) => {
    setImageUrls((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    setStatusMessage(null);

    const formData = {
      name,
      brand: brand || undefined,
      model_sku: modelSku || undefined,
      source_url: sourceUrl || undefined,
      wholesale_price: wholesalePrice ? Number(wholesalePrice) : undefined,
      markup_percent: Number(markupPercent),
      color: color || undefined,
      materials: materials || undefined,
      dimensions_text: dimensionsText || undefined,
      notes: notes || undefined,
      install_notes: installNotes || undefined,
      spec_url: specUrl || undefined,
      image_urls: imageUrls.length > 0 ? imageUrls : undefined,
      project_id: projectId || undefined,
      room_id: roomId || undefined,
    };

    const parsed = clipProductSchema.safeParse(formData);
    if (!parsed.success) {
      const fieldErrors: Record<string, string> = {};
      for (const issue of parsed.error.issues) {
        const field = issue.path.join('.');
        fieldErrors[field] = issue.message;
      }
      setErrors(fieldErrors);
      return;
    }

    setSubmitting(true);
    try {
      await clipProduct(parsed.data);
      setStatusMessage({ type: 'success', text: 'Product saved to Design Vault!' });
      // Reset form
      setName('');
      setBrand('');
      setModelSku('');
      setWholesalePrice('');
      setMarkupPercent('55');
      setColor('');
      setMaterials('');
      setDimensionsText('');
      setNotes('');
      setInstallNotes('');
      setSpecUrl('');
      setImageUrls([]);
      setProjectId('');
      setRoomId('');
      // Re-populate URL from current tab
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        const tab = tabs[0];
        if (tab?.url) setSourceUrl(tab.url);
        if (tab?.title) setName(tab.title);
      });
    } catch (err) {
      setStatusMessage({
        type: 'error',
        text: err instanceof Error ? err.message : 'Failed to save product',
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      {statusMessage && (
        <div
          className={`status-message ${statusMessage.type === 'success' ? 'status-success' : 'status-error'}`}
        >
          {statusMessage.text}
        </div>
      )}

      {/* Images Section */}
      <ImageThumbnails
        images={imageUrls}
        onRemove={handleRemoveImage}
        onSelectImages={handleSelectImages}
      />

      {/* Product Details */}
      <div className="section-title">Product Details</div>

      <div className="form-group">
        <label htmlFor="name">Name *</label>
        <input
          id="name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Product name"
          required
        />
        {errors.name && <div className="form-error">{errors.name}</div>}
      </div>

      <div className="form-group">
        <label htmlFor="brand">Brand</label>
        <input
          id="brand"
          type="text"
          value={brand}
          onChange={(e) => setBrand(e.target.value)}
          placeholder="Manufacturer or brand"
        />
      </div>

      <div className="form-group">
        <label htmlFor="modelSku">Model / SKU</label>
        <input
          id="modelSku"
          type="text"
          value={modelSku}
          onChange={(e) => setModelSku(e.target.value)}
          placeholder="Model number or SKU"
        />
      </div>

      <div className="form-group">
        <label htmlFor="sourceUrl">Source URL</label>
        <input
          id="sourceUrl"
          type="url"
          value={sourceUrl}
          onChange={(e) => setSourceUrl(e.target.value)}
          placeholder="https://..."
        />
        {errors.source_url && <div className="form-error">{errors.source_url}</div>}
      </div>

      {/* Pricing */}
      <div className="section-title">Pricing</div>

      <div className="form-row">
        <div className="form-group">
          <label htmlFor="wholesalePrice">Wholesale Price</label>
          <input
            id="wholesalePrice"
            type="number"
            step="0.01"
            min="0"
            value={wholesalePrice}
            onChange={(e) => setWholesalePrice(e.target.value)}
            placeholder="0.00"
          />
          {errors.wholesale_price && <div className="form-error">{errors.wholesale_price}</div>}
        </div>

        <div className="form-group">
          <label htmlFor="markupPercent">Markup %</label>
          <input
            id="markupPercent"
            type="number"
            step="1"
            min="0"
            max="999"
            value={markupPercent}
            onChange={(e) => setMarkupPercent(e.target.value)}
            placeholder="55"
          />
          {errors.markup_percent && <div className="form-error">{errors.markup_percent}</div>}
        </div>
      </div>

      {wholesalePrice && (
        <div style={{ fontSize: 12, color: '#666', marginBottom: 12, marginTop: -4 }}>
          Retail: ${(Number(wholesalePrice) * (1 + Number(markupPercent) / 100)).toFixed(2)}
        </div>
      )}

      {/* Specifications */}
      <div className="section-title">Specifications</div>

      <div className="form-group">
        <label htmlFor="color">Color</label>
        <input
          id="color"
          type="text"
          value={color}
          onChange={(e) => setColor(e.target.value)}
          placeholder="Color or finish"
        />
      </div>

      <div className="form-group">
        <label htmlFor="materials">Materials</label>
        <input
          id="materials"
          type="text"
          value={materials}
          onChange={(e) => setMaterials(e.target.value)}
          placeholder="Wood, fabric, metal..."
        />
      </div>

      <div className="form-group">
        <label htmlFor="dimensionsText">Dimensions</label>
        <input
          id="dimensionsText"
          type="text"
          value={dimensionsText}
          onChange={(e) => setDimensionsText(e.target.value)}
          placeholder='e.g., 24"W x 36"H x 18"D'
        />
      </div>

      <div className="form-group">
        <label htmlFor="specUrl">Spec Sheet URL</label>
        <input
          id="specUrl"
          type="url"
          value={specUrl}
          onChange={(e) => setSpecUrl(e.target.value)}
          placeholder="https://..."
        />
        {errors.spec_url && <div className="form-error">{errors.spec_url}</div>}
      </div>

      {/* Notes */}
      <div className="section-title">Notes</div>

      <div className="form-group">
        <label htmlFor="notes">Notes</label>
        <textarea
          id="notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="General notes about this product"
        />
      </div>

      <div className="form-group">
        <label htmlFor="installNotes">Install Notes</label>
        <textarea
          id="installNotes"
          value={installNotes}
          onChange={(e) => setInstallNotes(e.target.value)}
          placeholder="Installation requirements or instructions"
        />
      </div>

      {/* Project Assignment */}
      <div className="section-title">Project Assignment (Optional)</div>

      <div className="form-group">
        <label htmlFor="project">Project</label>
        <select id="project" value={projectId} onChange={(e) => setProjectId(e.target.value)}>
          <option value="">-- No project --</option>
          {projects.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
              {p.client_name ? ` (${p.client_name})` : ''}
            </option>
          ))}
        </select>
      </div>

      {projectId && (
        <div className="form-group">
          <label htmlFor="room">Room</label>
          <select id="room" value={roomId} onChange={(e) => setRoomId(e.target.value)}>
            <option value="">-- No room --</option>
            {rooms.map((r) => (
              <option key={r.id} value={r.id}>
                {r.name}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Submit */}
      <button
        type="submit"
        className="btn btn-primary"
        disabled={submitting}
        style={{ marginTop: 16, marginBottom: 24 }}
      >
        {submitting ? 'Saving...' : 'Save to Design Vault'}
      </button>
    </form>
  );
}
