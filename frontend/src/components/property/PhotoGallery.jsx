import React, { useState } from 'react';
import { FiChevronLeft, FiChevronRight, FiX, FiGrid } from 'react-icons/fi';

/**
 * Responsive PhotoGallery with Lightbox modal
 *
 * @param {Object} props
 * @param {Array<{url: string, publicId?: string}|string>} props.images - Array of image objects or URLs
 * @param {string} [props.title] - Property title for alt tags
 */
export default function PhotoGallery({ images = [], title = 'Property Image' }) {
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);

  // Normalize images to array of string URLs
  const normalizedImages = (images || []).map((img) =>
    typeof img === 'string' ? img : img?.url || 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1200&q=80'
  );

  const fallbackImage =
    'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1200&q=80';
  const displayImages = normalizedImages.length > 0 ? normalizedImages : [fallbackImage];

  const mainImage = displayImages[0];
  const thumbnails = displayImages.slice(1, 5);

  const openLightbox = (index) => {
    setCurrentIndex(index);
    setLightboxOpen(true);
  };

  const nextImage = (e) => {
    e?.stopPropagation();
    setCurrentIndex((prev) => (prev + 1) % displayImages.length);
  };

  const prevImage = (e) => {
    e?.stopPropagation();
    setCurrentIndex((prev) => (prev - 1 + displayImages.length) % displayImages.length);
  };

  return (
    <div className="relative">
      {/* Photo Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-2 sm:gap-3 rounded-2xl overflow-hidden max-h-[500px]">
        {/* Main hero image */}
        <div
          className={`relative cursor-pointer overflow-hidden group ${
            thumbnails.length > 0 ? 'md:col-span-2 md:row-span-2' : 'col-span-full'
          }`}
          onClick={() => openLightbox(0)}
        >
          <img
            src={mainImage}
            alt={`${title} - Main`}
            className="w-full h-full object-cover min-h-[300px] sm:min-h-[420px] group-hover:scale-105 transition-transform duration-500"
          />
          <div className="absolute inset-0 bg-black/10 group-hover:bg-black/0 transition-colors" />
        </div>

        {/* Thumbnails grid */}
        {thumbnails.map((imgUrl, idx) => (
          <div
            key={idx}
            className="relative hidden md:block cursor-pointer overflow-hidden group h-[200px]"
            onClick={() => openLightbox(idx + 1)}
          >
            <img
              src={imgUrl}
              alt={`${title} - Thumbnail ${idx + 1}`}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            />
            <div className="absolute inset-0 bg-black/10 group-hover:bg-black/0 transition-colors" />
          </div>
        ))}
      </div>

      {/* Show all photos button */}
      <button
        type="button"
        onClick={() => openLightbox(0)}
        className="absolute bottom-4 right-4 z-10 flex items-center space-x-2 px-4 py-2 bg-white/90 hover:bg-white text-gray-900 font-semibold rounded-xl text-xs sm:text-sm shadow-md backdrop-blur-sm transition-all hover:scale-105"
      >
        <FiGrid className="w-4 h-4" />
        <span>Show all {displayImages.length} photos</span>
      </button>

      {/* Lightbox Modal */}
      {lightboxOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/95 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in"
          onClick={() => setLightboxOpen(false)}
        >
          {/* Close button */}
          <button
            type="button"
            onClick={() => setLightboxOpen(false)}
            className="absolute top-5 right-5 p-2 rounded-full bg-white/10 text-white hover:bg-white/20 transition-all z-20"
            aria-label="Close Lightbox"
          >
            <FiX className="w-6 h-6" />
          </button>

          {/* Counter */}
          <div className="absolute top-5 left-5 text-white/80 text-sm font-medium z-20">
            {currentIndex + 1} / {displayImages.length}
          </div>

          {/* Navigation Prev */}
          {displayImages.length > 1 && (
            <button
              type="button"
              onClick={prevImage}
              className="absolute left-4 p-3 rounded-full bg-white/10 text-white hover:bg-white/20 hover:scale-110 transition-all z-20"
              aria-label="Previous image"
            >
              <FiChevronLeft className="w-6 h-6" />
            </button>
          )}

          {/* Active Image */}
          <div
            className="max-w-5xl max-h-[85vh] flex items-center justify-center p-2"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={displayImages[currentIndex]}
              alt={`${title} - Full size`}
              className="max-w-full max-h-[82vh] object-contain rounded-xl shadow-2xl"
            />
          </div>

          {/* Navigation Next */}
          {displayImages.length > 1 && (
            <button
              type="button"
              onClick={nextImage}
              className="absolute right-4 p-3 rounded-full bg-white/10 text-white hover:bg-white/20 hover:scale-110 transition-all z-20"
              aria-label="Next image"
            >
              <FiChevronRight className="w-6 h-6" />
            </button>
          )}
        </div>
      )}
    </div>
  );
}
