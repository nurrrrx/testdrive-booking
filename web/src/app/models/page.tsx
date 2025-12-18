'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useState } from 'react';
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { lexusModels, formatPrice, LexusModel } from '@/lib/lexus-models';
import { cn } from '@/lib/utils';

type Category = 'ALL' | 'SUV' | 'SEDAN' | 'HYBRID' | 'PERFORMANCE';

const categories: { label: string; value: Category }[] = [
  { label: 'All Models', value: 'ALL' },
  { label: 'SUV', value: 'SUV' },
  { label: 'Sedan', value: 'SEDAN' },
  { label: 'Hybrid', value: 'HYBRID' },
  { label: 'Performance', value: 'PERFORMANCE' },
];

function ModelCard({ model }: { model: LexusModel }) {
  return (
    <div className="model-card group bg-white">
      <div className="relative aspect-[16/10] overflow-hidden bg-gray-100">
        <Image
          src={model.heroImage}
          alt={`${model.name} ${model.year}`}
          fill
          className="model-image object-cover transition-transform duration-700"
          style={{ objectPosition: model.imagePosition || 'center center' }}
        />
      </div>
      <div className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="text-xl font-semibold tracking-tight">
              {model.name}
            </h3>
            <p className="text-sm text-muted-foreground mt-1">{model.year}</p>
          </div>
          <span className="text-xs font-medium tracking-wider uppercase px-3 py-1 bg-secondary text-secondary-foreground">
            {model.category}
          </span>
        </div>
        <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
          {model.tagline}
        </p>
        <div className="border-t pt-4">
          <div className="flex items-baseline gap-1 mb-1">
            <span className="text-sm text-muted-foreground">From</span>
            <span className="text-lg font-semibold">{formatPrice(model.startingPrice)}</span>
          </div>
          {model.monthlyPrice && (
            <p className="text-xs text-muted-foreground">
              or {formatPrice(model.monthlyPrice)}/month
            </p>
          )}
        </div>
        <div className="mt-6 flex gap-3">
          <Link
            href={`/models/${model.slug}`}
            className="flex-1 lexus-btn lexus-btn-outline text-xs"
          >
            View Model
          </Link>
          <Link
            href={`/testdrive?model=${model.id}`}
            className="flex-1 lexus-btn lexus-btn-primary text-xs"
          >
            Test Drive
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function ModelsPage() {
  const [activeCategory, setActiveCategory] = useState<Category>('ALL');

  const filteredModels = activeCategory === 'ALL'
    ? lexusModels
    : lexusModels.filter(m => m.category === activeCategory);

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
            <span className="text-foreground">Models</span>
          </nav>
        </div>
      </div>

      {/* Hero */}
      <section className="py-16 bg-[#f7f7f7]">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-5xl font-light tracking-tight lexus-heading mb-4">
            Explore Our Models
          </h1>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Discover the complete Lexus lineup. From luxurious sedans to powerful SUVs,
            find the perfect vehicle that matches your lifestyle.
          </p>
        </div>
      </section>

      {/* Filter and Models */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          {/* Category Filter */}
          <div className="flex flex-wrap justify-center gap-2 mb-12">
            {categories.map((cat) => (
              <button
                key={cat.value}
                onClick={() => setActiveCategory(cat.value)}
                className={cn(
                  'category-pill',
                  activeCategory === cat.value ? 'active text-foreground' : 'text-muted-foreground'
                )}
              >
                {cat.label}
              </button>
            ))}
          </div>

          {/* Models Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredModels.map((model) => (
              <ModelCard key={model.id} model={model} />
            ))}
          </div>

          {filteredModels.length === 0 && (
            <div className="text-center py-16">
              <p className="text-muted-foreground">
                No models found in this category.
              </p>
            </div>
          )}
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-[#f7f7f7]">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-2xl mx-auto">
            <h2 className="text-3xl font-light tracking-tight lexus-heading mb-6">
              Need Help Choosing?
            </h2>
            <p className="text-muted-foreground mb-8">
              Our expert consultants are here to help you find the perfect Lexus
              for your needs. Contact us today.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/contact"
                className="lexus-btn lexus-btn-outline"
              >
                Contact Us
              </Link>
              <Link
                href="/testdrive"
                className="lexus-btn lexus-btn-primary"
              >
                Book a Test Drive
              </Link>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
