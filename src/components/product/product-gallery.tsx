"use client";

import { ChevronLeft, ChevronRight, Expand, X } from "lucide-react";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";

import type { ProductImage } from "@/types/catalog";

type ProductGalleryProps = {
  images: ProductImage[];
  productName: string;
  sourceFallback: string;
};

export function ProductGallery({ images, productName, sourceFallback }: ProductGalleryProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const openButtonRef = useRef<HTMLButtonElement>(null);
  const activeImage = images[activeIndex];

  const showImage = (index: number) => {
    setActiveIndex((index + images.length) % images.length);
  };

  const closeLightbox = () => {
    setLightboxOpen(false);
    window.requestAnimationFrame(() => openButtonRef.current?.focus());
  };

  useEffect(() => {
    if (!lightboxOpen) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeButtonRef.current?.focus();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") closeLightbox();
      if (event.key === "ArrowLeft") setActiveIndex((current) => (current - 1 + images.length) % images.length);
      if (event.key === "ArrowRight") setActiveIndex((current) => (current + 1) % images.length);
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [images.length, lightboxOpen]);

  if (!activeImage) return null;

  const sourceLabel = activeImage.kind === "information"
    ? "Informativni prikaz Bistrava"
    : `Fotografija vira: ${activeImage.sourceName ?? sourceFallback}`;

  return (
    <section className="product-gallery" aria-label={`Galerija izdelka ${productName}`}>
      <figure className="product-carousel card">
        <div className="product-carousel-stage">
          <button
            ref={openButtonRef}
            className="product-carousel-open"
            type="button"
            onClick={() => setLightboxOpen(true)}
            aria-label={`Odpri sliko ${activeIndex + 1} izdelka ${productName} čez cel zaslon`}
          >
            <Image
              src={activeImage.url}
              alt={activeImage.altSl}
              fill
              sizes="(max-width: 980px) 100vw, 52vw"
              preload={activeIndex === 0}
            />
            <span><Expand aria-hidden="true" size={18} /> Povečaj</span>
          </button>
          {images.length > 1 ? (
            <>
              <button className="product-carousel-arrow is-previous" type="button" onClick={() => showImage(activeIndex - 1)} aria-label="Prejšnja slika">
                <ChevronLeft aria-hidden="true" />
              </button>
              <button className="product-carousel-arrow is-next" type="button" onClick={() => showImage(activeIndex + 1)} aria-label="Naslednja slika">
                <ChevronRight aria-hidden="true" />
              </button>
            </>
          ) : null}
        </div>
        <figcaption>
          <span>{sourceLabel}</span>
          <strong>{activeIndex + 1} / {images.length}</strong>
        </figcaption>
      </figure>

      {images.length > 1 ? (
        <div className="product-carousel-thumbnails" aria-label="Izberite sliko">
          {images.map((image, index) => (
            <button
              className={index === activeIndex ? "is-active" : ""}
              type="button"
              key={image.url}
              onClick={() => showImage(index)}
              aria-label={`Prikaži sliko ${index + 1} od ${images.length}`}
              aria-current={index === activeIndex ? "true" : undefined}
            >
              <Image src={image.url} alt="" fill sizes="96px" />
            </button>
          ))}
        </div>
      ) : null}

      {lightboxOpen ? (
        <div
          className="product-lightbox"
          role="dialog"
          aria-modal="true"
          aria-label={`Povečana galerija izdelka ${productName}`}
          onMouseDown={(event) => {
            if (event.currentTarget === event.target) closeLightbox();
          }}
        >
          <button ref={closeButtonRef} className="product-lightbox-close" type="button" onClick={closeLightbox} aria-label="Zapri povečano galerijo">
            <X aria-hidden="true" />
          </button>
          <div className="product-lightbox-image">
            <Image src={activeImage.url} alt={activeImage.altSl} fill sizes="100vw" />
          </div>
          {images.length > 1 ? (
            <>
              <button className="product-lightbox-arrow is-previous" type="button" onClick={() => showImage(activeIndex - 1)} aria-label="Prejšnja slika v povečani galeriji">
                <ChevronLeft aria-hidden="true" />
              </button>
              <button className="product-lightbox-arrow is-next" type="button" onClick={() => showImage(activeIndex + 1)} aria-label="Naslednja slika v povečani galeriji">
                <ChevronRight aria-hidden="true" />
              </button>
            </>
          ) : null}
          <p>{activeIndex + 1} / {images.length} · {activeImage.altSl}</p>
        </div>
      ) : null}
    </section>
  );
}
