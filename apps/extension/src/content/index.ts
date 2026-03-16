// Content script for Design Vault Clipper — image selection overlay

let selectionActive = false;
let selectedImages: Set<string> = new Set();
let overlayContainer: HTMLDivElement | null = null;

// Listen for messages from the side panel
chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message.type === 'START_IMAGE_SELECTION') {
    startImageSelection();
    sendResponse({ started: true });
  }
});

function startImageSelection() {
  if (selectionActive) return;
  selectionActive = true;
  selectedImages = new Set();

  // Create overlay container
  overlayContainer = document.createElement('div');
  overlayContainer.id = 'dv-clipper-overlay';
  overlayContainer.className = 'dv-overlay-container';
  document.body.appendChild(overlayContainer);

  // Create floating toolbar
  const toolbar = document.createElement('div');
  toolbar.className = 'dv-toolbar';
  toolbar.innerHTML = `
    <span class="dv-toolbar-title">Select product images</span>
    <span class="dv-toolbar-count">0 selected</span>
    <button class="dv-toolbar-btn dv-btn-done">Done</button>
    <button class="dv-toolbar-btn dv-btn-cancel">Cancel</button>
  `;
  overlayContainer.appendChild(toolbar);

  const countEl = toolbar.querySelector('.dv-toolbar-count') as HTMLSpanElement;
  const doneBtn = toolbar.querySelector('.dv-btn-done') as HTMLButtonElement;
  const cancelBtn = toolbar.querySelector('.dv-btn-cancel') as HTMLButtonElement;

  doneBtn.addEventListener('click', () => {
    finishSelection(true);
  });

  cancelBtn.addEventListener('click', () => {
    finishSelection(false);
  });

  // Find all images on the page that are reasonably sized
  const images = document.querySelectorAll('img');
  images.forEach((img) => {
    if (img.naturalWidth <= 50 || img.naturalHeight <= 50) return;
    if (img.width <= 50 || img.height <= 50) return;
    if (!img.src || img.src.startsWith('data:image/svg')) return;

    // Create selection overlay for this image
    const wrapper = document.createElement('div');
    wrapper.className = 'dv-img-overlay';

    // Position overlay on top of the image
    const rect = img.getBoundingClientRect();
    wrapper.style.position = 'fixed';
    wrapper.style.top = `${rect.top}px`;
    wrapper.style.left = `${rect.left}px`;
    wrapper.style.width = `${rect.width}px`;
    wrapper.style.height = `${rect.height}px`;

    const checkmark = document.createElement('div');
    checkmark.className = 'dv-checkmark';
    checkmark.innerHTML = '&#10003;';
    wrapper.appendChild(checkmark);

    wrapper.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();

      const imgSrc = img.src;
      if (selectedImages.has(imgSrc)) {
        selectedImages.delete(imgSrc);
        wrapper.classList.remove('dv-selected');
      } else {
        selectedImages.add(imgSrc);
        wrapper.classList.add('dv-selected');
      }

      countEl.textContent = `${selectedImages.size} selected`;
    });

    overlayContainer!.appendChild(wrapper);
  });

  // Update overlay positions on scroll
  const updatePositions = () => {
    if (!overlayContainer) return;
    const wrappers = overlayContainer.querySelectorAll('.dv-img-overlay');
    const allImages = document.querySelectorAll('img');
    let wrapperIndex = 0;

    allImages.forEach((img) => {
      if (img.naturalWidth <= 50 || img.naturalHeight <= 50) return;
      if (img.width <= 50 || img.height <= 50) return;
      if (!img.src || img.src.startsWith('data:image/svg')) return;

      const wrapper = wrappers[wrapperIndex];
      if (wrapper) {
        const rect = img.getBoundingClientRect();
        (wrapper as HTMLElement).style.top = `${rect.top}px`;
        (wrapper as HTMLElement).style.left = `${rect.left}px`;
        (wrapper as HTMLElement).style.width = `${rect.width}px`;
        (wrapper as HTMLElement).style.height = `${rect.height}px`;
      }
      wrapperIndex++;
    });
  };

  window.addEventListener('scroll', updatePositions);
  window.addEventListener('resize', updatePositions);

  // Store cleanup refs
  (overlayContainer as HTMLDivElement & { _cleanup?: () => void })._cleanup = () => {
    window.removeEventListener('scroll', updatePositions);
    window.removeEventListener('resize', updatePositions);
  };
}

function finishSelection(confirm: boolean) {
  if (confirm && selectedImages.size > 0) {
    chrome.runtime.sendMessage({
      type: 'IMAGES_SELECTED',
      urls: Array.from(selectedImages),
    });
  }

  // Clean up
  if (overlayContainer) {
    const cleanup = (overlayContainer as HTMLDivElement & { _cleanup?: () => void })._cleanup;
    if (cleanup) cleanup();
    overlayContainer.remove();
    overlayContainer = null;
  }

  selectionActive = false;
  selectedImages = new Set();
}
