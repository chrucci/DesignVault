import React from 'react';

interface ImageThumbnailsProps {
  images: string[];
  onRemove: (index: number) => void;
  onSelectImages: () => void;
}

export default function ImageThumbnails({
  images,
  onRemove,
  onSelectImages,
}: ImageThumbnailsProps) {
  return (
    <div className="image-section">
      <div className="section-title">Images</div>

      {images.length > 0 && (
        <div className="image-grid">
          {images.map((url, index) => (
            <div key={`${url}-${index}`} className="image-thumb">
              <img src={url} alt={`Selected ${index + 1}`} />
              <button
                type="button"
                className="remove-btn"
                onClick={() => onRemove(index)}
                title="Remove image"
              >
                &times;
              </button>
            </div>
          ))}
        </div>
      )}

      <button
        type="button"
        className="btn btn-secondary"
        onClick={onSelectImages}
        style={{ marginTop: 8 }}
      >
        {images.length > 0 ? 'Select More Images' : 'Select Images from Page'}
      </button>
    </div>
  );
}
