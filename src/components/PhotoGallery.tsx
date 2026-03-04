"use client";

import Image from "next/image";
import { useState, useEffect } from "react";

export const photos = [
  "PXL_20250514_014357199.jpg",
  "PXL_20250514_014359551.jpg",
  "PXL_20250514_014414173.jpg",
  "PXL_20250514_014421279.jpg",
  "PXL_20250514_014456476.jpg",
  "PXL_20250514_014542011.jpg",
  "PXL_20250514_014600874.jpg",
  "PXL_20250514_014612241.jpg",
  "PXL_20250514_014650216.jpg",
  "PXL_20250514_014652440.jpg",
  "PXL_20250514_014654241.jpg",
  "PXL_20250514_014659073.jpg",
  "PXL_20250514_014715265.jpg",
  "PXL_20250514_014728313.jpg",
  "PXL_20250514_014735694.jpg",
  "PXL_20250514_023558358.jpg",
  "PXL_20250514_023607054.jpg",
  "PXL_20250514_023627407.jpg",
  "PXL_20250514_023713619.jpg",
  "PXL_20250514_023729221.jpg",
];

interface PhotoDialogProps {
  open: boolean;
  onClose: () => void;
  initialIndex?: number | null;
}

export default function PhotoDialog({ open, onClose, initialIndex }: PhotoDialogProps) {
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const lightboxOnly = initialIndex != null;

  useEffect(() => {
    if (open && initialIndex != null) {
      setLightboxIndex(initialIndex);
    }
    if (!open) {
      setLightboxIndex(null);
    }
  }, [open, initialIndex]);

  const closeLightbox = () => {
    if (lightboxOnly) {
      onClose();
    } else {
      setLightboxIndex(null);
    }
  };

  if (!open) return null;

  return (
    <>
      {/* All Photos Dialog — hidden when opening directly to a photo */}
      {!lightboxOnly && (
        <div
          className="fixed inset-0 bg-black/80 z-50 overflow-y-auto overflow-x-hidden w-screen"
          onClick={onClose}
        >
          <button
            onClick={onClose}
            className="fixed top-4 right-4 z-[55] text-white hover:text-stone-300 bg-black/60 hover:bg-black/80 w-10 h-10 rounded-full flex items-center justify-center text-2xl leading-none transition-colors"
          >
            &times;
          </button>
          <div
            className="max-w-5xl mx-auto px-4 py-12 box-border"
            style={{ width: "100%" , maxWidth: "min(64rem, 100vw)" }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-white text-xl sm:text-2xl font-bold mb-6">
              All Photos ({photos.length})
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {photos.map((photo, index) => (
                <button
                  key={photo}
                  onClick={() => setLightboxIndex(index)}
                  className="relative aspect-[4/3] overflow-hidden rounded-lg hover:opacity-90 transition-opacity"
                >
                  <Image
                    src={`/images/${photo}`}
                    alt={`Apartment photo ${index + 1}`}
                    fill
                    className="object-cover"
                    sizes="(max-width: 640px) 100vw, 50vw"
                  />
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Lightbox */}
      {lightboxIndex !== null && (
        <div
          className="fixed inset-0 bg-black/90 z-[60] flex items-center justify-center"
          onClick={closeLightbox}
        >
          <button
            className="absolute top-4 right-4 text-white text-3xl hover:text-stone-300 z-10"
            onClick={closeLightbox}
          >
            &times;
          </button>
          <button
            className="absolute left-4 top-1/2 -translate-y-1/2 text-white text-4xl hover:text-stone-300 z-10"
            onClick={(e) => {
              e.stopPropagation();
              setLightboxIndex(
                lightboxIndex > 0 ? lightboxIndex - 1 : photos.length - 1
              );
            }}
          >
            &lsaquo;
          </button>
          <button
            className="absolute right-4 top-1/2 -translate-y-1/2 text-white text-4xl hover:text-stone-300 z-10"
            onClick={(e) => {
              e.stopPropagation();
              setLightboxIndex(
                lightboxIndex < photos.length - 1 ? lightboxIndex + 1 : 0
              );
            }}
          >
            &rsaquo;
          </button>
          <div
            className="relative w-full max-w-4xl h-[80vh] mx-4"
            onClick={(e) => e.stopPropagation()}
          >
            <Image
              src={`/images/${photos[lightboxIndex]}`}
              alt={`Apartment photo ${lightboxIndex + 1}`}
              fill
              className="object-contain"
              sizes="100vw"
              priority
            />
          </div>
          <div className="absolute bottom-4 text-white text-sm">
            {lightboxIndex + 1} / {photos.length}
          </div>
        </div>
      )}
    </>
  );
}
