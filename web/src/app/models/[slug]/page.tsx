'use client';

import { useParams, useRouter, notFound } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { useState } from 'react';
import { ArrowLeft, ArrowRight, Check, ChevronLeft, ChevronRight } from 'lucide-react';
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { getModelBySlug, formatPrice, LexusModel } from '@/lib/lexus-models';
import { cn } from '@/lib/utils';

function ColorSelector({
  colors,
  selected,
  onSelect
}: {
  colors: LexusModel['colors'];
  selected: string;
  onSelect: (name: string) => void;
}) {
  return (
    <div className="flex flex-wrap gap-3">
      {colors.map((color) => (
        <button
          key={color.name}
          onClick={() => onSelect(color.name)}
          className={cn(
            'group relative w-10 h-10 rounded-full border-2 transition-all',
            selected === color.name ? 'border-primary scale-110' : 'border-transparent hover:scale-105'
          )}
          title={color.name}
        >
          <span
            className="block w-full h-full rounded-full"
            style={{ backgroundColor: color.hex }}
          />
          {selected === color.name && (
            <span className="absolute inset-0 flex items-center justify-center">
              <Check className={cn(
                'h-4 w-4',
                color.hex === '#FFFFFF' || color.hex === '#F5F5F5' ? 'text-black' : 'text-white'
              )} />
            </span>
          )}
        </button>
      ))}
    </div>
  );
}

function ImageGallery({ images, modelName }: { images: string[]; modelName: string }) {
  const [currentIndex, setCurrentIndex] = useState(0);

  const goToPrev = () => {
    setCurrentIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
  };

  const goToNext = () => {
    setCurrentIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
  };

  return (
    <div className="relative">
      <div className="relative aspect-[16/9] overflow-hidden bg-gray-100">
        <Image
          src={images[currentIndex]}
          alt={`${modelName} - Image ${currentIndex + 1}`}
          fill
          className="object-cover"
        />
      </div>

      {images.length > 1 && (
        <>
          <button
            onClick={goToPrev}
            className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 bg-white/90 hover:bg-white flex items-center justify-center transition-colors"
          >
            <ChevronLeft className="h-6 w-6" />
          </button>
          <button
            onClick={goToNext}
            className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 bg-white/90 hover:bg-white flex items-center justify-center transition-colors"
          >
            <ChevronRight className="h-6 w-6" />
          </button>

          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
            {images.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentIndex(idx)}
                className={cn(
                  'w-2 h-2 rounded-full transition-colors',
                  idx === currentIndex ? 'bg-white' : 'bg-white/50'
                )}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

export default function ModelDetailPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;

  const model = getModelBySlug(slug);

  const [selectedColor, setSelectedColor] = useState(model?.colors[0]?.name || '');

  if (!model) {
    notFound();
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Header />

      {/* Breadcrumb */}
      <div className="bg-[#f7f7f7] py-4">
        <div className="container mx-auto px-4">
          <nav className="flex items-center text-sm text-muted-foreground">
            <Link href="/" className="hover:text-foreground transition-colors">
              Home
            </Link>
            <span className="mx-2">/</span>
            <Link href="/models" className="hover:text-foreground transition-colors">
              Models
            </Link>
            <span className="mx-2">/</span>
            <span className="text-foreground">{model.name}</span>
          </nav>
        </div>
      </div>

      {/* Hero Section */}
      <section className="relative bg-black">
        <div className="relative h-[60vh] min-h-[500px]">
          <Image
            src={model.heroImage}
            alt={model.name}
            fill
            className="object-cover opacity-90"
            priority
          />
          <div className="hero-overlay absolute inset-0" />
          <div className="absolute inset-0 flex items-end">
            <div className="container mx-auto px-4 pb-16">
              <div className="max-w-2xl text-white">
                <span className="text-xs font-medium tracking-widest uppercase opacity-80 mb-2 block">
                  {model.category}
                </span>
                <h1 className="text-5xl md:text-6xl font-light tracking-tight mb-4 lexus-heading">
                  {model.name}
                </h1>
                <p className="text-xl font-light opacity-90 mb-2">
                  {model.tagline}
                </p>
                <p className="text-2xl font-light">
                  From {formatPrice(model.startingPrice)}
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Quick Actions */}
      <section className="bg-white border-b sticky top-20 z-40">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between py-4">
            <div className="flex items-center gap-6">
              <button
                onClick={() => router.back()}
                className="flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </button>
            </div>
            <div className="flex items-center gap-4">
              <Link
                href="/contact"
                className="lexus-btn lexus-btn-outline text-sm"
              >
                Contact Us
              </Link>
              <Link
                href={`/testdrive?model=${model.id}`}
                className="lexus-btn lexus-btn-primary text-sm"
              >
                Book Test Drive
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Gallery Section */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <ImageGallery images={model.galleryImages} modelName={model.name} />
        </div>
      </section>

      {/* Description & Specs */}
      <section className="py-16 bg-[#f7f7f7]">
        <div className="container mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-16">
            {/* Description */}
            <div>
              <h2 className="text-3xl font-light tracking-tight lexus-heading mb-6">
                Overview
              </h2>
              <p className="text-muted-foreground leading-relaxed mb-8">
                {model.description}
              </p>

              {/* Color Selection */}
              <div className="mt-8">
                <h3 className="text-lg font-medium mb-4">Exterior Colors</h3>
                <ColorSelector
                  colors={model.colors}
                  selected={selectedColor}
                  onSelect={setSelectedColor}
                />
                <p className="text-sm text-muted-foreground mt-3">
                  Selected: {selectedColor}
                </p>
              </div>
            </div>

            {/* Specifications */}
            <div>
              <h2 className="text-3xl font-light tracking-tight lexus-heading mb-6">
                Specifications
              </h2>
              <div className="space-y-6">
                <div className="flex justify-between items-center py-4 border-b">
                  <span className="text-muted-foreground">Engine</span>
                  <span className="font-medium">{model.specs.engine}</span>
                </div>
                <div className="flex justify-between items-center py-4 border-b">
                  <span className="text-muted-foreground">Power</span>
                  <span className="font-medium">{model.specs.power}</span>
                </div>
                <div className="flex justify-between items-center py-4 border-b">
                  <span className="text-muted-foreground">Acceleration</span>
                  <span className="font-medium">{model.specs.acceleration}</span>
                </div>
                {model.specs.fuelEfficiency && (
                  <div className="flex justify-between items-center py-4 border-b">
                    <span className="text-muted-foreground">Fuel Efficiency</span>
                    <span className="font-medium">{model.specs.fuelEfficiency}</span>
                  </div>
                )}
                {model.specs.range && (
                  <div className="flex justify-between items-center py-4 border-b">
                    <span className="text-muted-foreground">Range</span>
                    <span className="font-medium">{model.specs.range}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-light tracking-tight lexus-heading mb-12 text-center">
            Key Features
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-4xl mx-auto">
            {model.features.map((feature, idx) => (
              <div
                key={idx}
                className="flex items-center gap-4 p-6 bg-[#f7f7f7]"
              >
                <div className="w-10 h-10 bg-primary text-primary-foreground rounded-full flex items-center justify-center flex-shrink-0">
                  <Check className="h-5 w-5" />
                </div>
                <span className="text-sm font-medium">{feature}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="py-16 bg-[#1a1a1a] text-white">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-3xl font-light tracking-tight lexus-heading mb-6">
              Price & Finance
            </h2>
            <div className="bg-white/10 p-8 md:p-12 mb-8">
              <p className="text-sm text-gray-400 mb-2">Starting from</p>
              <p className="text-4xl md:text-5xl font-light mb-4">
                {formatPrice(model.startingPrice)}
              </p>
              {model.monthlyPrice && (
                <p className="text-gray-400">
                  or from {formatPrice(model.monthlyPrice)}/month with financing
                </p>
              )}
            </div>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/finance"
                className="lexus-btn border border-white text-white hover:bg-white hover:text-black"
              >
                Calculate Finance
              </Link>
              <Link
                href={`/testdrive?model=${model.id}`}
                className="lexus-btn bg-white text-black hover:bg-gray-100"
              >
                Book Test Drive
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-2xl mx-auto">
            <h2 className="text-3xl font-light tracking-tight lexus-heading mb-6">
              Experience the {model.name}
            </h2>
            <p className="text-muted-foreground mb-8">
              Nothing compares to getting behind the wheel. Schedule your test drive today
              and discover the Lexus difference.
            </p>
            <Link
              href={`/testdrive?model=${model.id}`}
              className="lexus-btn lexus-btn-primary"
            >
              Book Your Test Drive
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
