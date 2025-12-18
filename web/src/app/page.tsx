'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useState } from 'react';
import { ArrowRight, ChevronRight, Play } from 'lucide-react';
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

export default function HomePage() {
  const [activeCategory, setActiveCategory] = useState<Category>('ALL');

  const filteredModels = activeCategory === 'ALL'
    ? lexusModels
    : lexusModels.filter(m => m.category === activeCategory);

  return (
    <div className="flex min-h-screen flex-col">
      <Header />

      {/* Hero Section */}
      <section className="relative h-[80vh] min-h-[600px] bg-black">
        <div className="absolute inset-0">
          <Image
            src="/lx700-hero.jpeg"
            alt="Lexus LX 700h"
            fill
            className="object-cover opacity-80"
            priority
          />
          <div className="hero-overlay absolute inset-0" />
        </div>
        <div className="relative container mx-auto px-4 h-full flex flex-col justify-end pb-20">
          <div className="max-w-2xl text-white">
            <p className="text-sm font-medium tracking-widest uppercase mb-4 opacity-80">
              New Arrival
            </p>
            <h1 className="text-5xl md:text-7xl font-light tracking-tight mb-6 lexus-heading">
              The All-New LX 700h
            </h1>
            <p className="text-lg md:text-xl font-light opacity-90 mb-8">
              Experience the pinnacle of luxury and capability.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Link
                href="/models/lx700h"
                className="lexus-btn bg-white text-black hover:bg-gray-100"
              >
                Explore
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
              <Link
                href="/testdrive?model=lx-700h-2026"
                className="lexus-btn border border-white text-white hover:bg-white hover:text-black"
              >
                Book Test Drive
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Section */}
      <section className="py-20 bg-[#f7f7f7]">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-light tracking-tight lexus-heading mb-4">
              Featured Models
            </h2>
            <p className="text-muted-foreground">
              Discover the latest additions to the Lexus lineup
            </p>
          </div>

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

          <div className="text-center mt-12">
            <Link
              href="/models"
              className="lexus-btn lexus-btn-outline"
            >
              View All Models
              <ChevronRight className="ml-2 h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* Experience Lexus Section */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="relative aspect-video lg:aspect-square overflow-hidden">
              <Image
                src="/rcf-hero.jpeg"
                alt="Lexus Experience"
                fill
                className="object-cover"
              />
              <button className="absolute inset-0 flex items-center justify-center bg-black/30 hover:bg-black/40 transition-colors group">
                <div className="w-20 h-20 rounded-full bg-white/90 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Play className="h-8 w-8 text-primary ml-1" />
                </div>
              </button>
            </div>
            <div>
              <p className="text-sm font-medium tracking-widest uppercase text-muted-foreground mb-4">
                The Lexus Experience
              </p>
              <h2 className="text-3xl md:text-4xl font-light tracking-tight lexus-heading mb-6">
                Crafted for Those Who Demand More
              </h2>
              <p className="text-muted-foreground mb-8 leading-relaxed">
                At Lexus, we believe luxury is not just about the destination, but the journey.
                Every detail is meticulously crafted to deliver an experience that exceeds expectations.
                From the whisper-quiet cabin to the precision of our engineering, discover what makes
                Lexus the choice of discerning drivers worldwide.
              </p>
              <div className="grid grid-cols-2 gap-6 mb-8">
                <div>
                  <p className="text-3xl font-light mb-2">30+</p>
                  <p className="text-sm text-muted-foreground">Years of Excellence</p>
                </div>
                <div>
                  <p className="text-3xl font-light mb-2">90+</p>
                  <p className="text-sm text-muted-foreground">Countries Worldwide</p>
                </div>
              </div>
              <Link
                href="/about"
                className="lexus-btn lexus-btn-outline"
              >
                Discover More
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Finance Section */}
      <section className="py-20 bg-[#1a1a1a] text-white">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-3xl md:text-4xl font-light tracking-tight lexus-heading mb-6">
              Flexible Finance Solutions
            </h2>
            <p className="text-gray-400 mb-12 max-w-2xl mx-auto">
              Make your dream Lexus a reality with our tailored financing options.
              Competitive rates, flexible terms, and a seamless process.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
              <div className="text-center p-6">
                <div className="w-16 h-16 mx-auto mb-4 border border-white/20 rounded-full flex items-center justify-center">
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="text-lg font-medium mb-2">Competitive Rates</h3>
                <p className="text-sm text-gray-400">Starting from 2.99% APR with approved credit</p>
              </div>
              <div className="text-center p-6">
                <div className="w-16 h-16 mx-auto mb-4 border border-white/20 rounded-full flex items-center justify-center">
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <h3 className="text-lg font-medium mb-2">Flexible Terms</h3>
                <p className="text-sm text-gray-400">Choose from 12 to 60 month financing plans</p>
              </div>
              <div className="text-center p-6">
                <div className="w-16 h-16 mx-auto mb-4 border border-white/20 rounded-full flex items-center justify-center">
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="text-lg font-medium mb-2">Quick Approval</h3>
                <p className="text-sm text-gray-400">Get pre-approved in as little as 24 hours</p>
              </div>
            </div>
            <Link
              href="/finance"
              className="lexus-btn bg-white text-black hover:bg-gray-100"
            >
              Calculate Your Payment
            </Link>
          </div>
        </div>
      </section>

      {/* Test Drive CTA */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="relative overflow-hidden bg-[#f7f7f7] p-12 md:p-20">
            <div className="relative z-10 max-w-xl">
              <h2 className="text-3xl md:text-4xl font-light tracking-tight lexus-heading mb-6">
                Experience Lexus Today
              </h2>
              <p className="text-muted-foreground mb-8">
                Nothing compares to getting behind the wheel. Book your test drive
                and discover the Lexus difference for yourself.
              </p>
              <Link
                href="/testdrive"
                className="lexus-btn lexus-btn-primary"
              >
                Book a Test Drive
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </div>
            <div className="absolute right-0 top-1/2 -translate-y-1/2 w-1/2 hidden lg:block">
              <div className="relative aspect-[16/9]">
                <Image
                  src="/rx350-hero.jpeg"
                  alt="Book Test Drive"
                  fill
                  className="object-cover"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Newsletter Section */}
      <section className="py-16 bg-white border-t">
        <div className="container mx-auto px-4">
          <div className="max-w-2xl mx-auto text-center">
            <h3 className="text-2xl font-light tracking-tight lexus-heading mb-4">
              Stay Updated
            </h3>
            <p className="text-muted-foreground mb-8">
              Subscribe to receive the latest news, offers, and model releases from Lexus UAE.
            </p>
            <form className="flex flex-col sm:flex-row gap-4 max-w-md mx-auto">
              <input
                type="email"
                placeholder="Enter your email"
                className="lexus-input flex-1"
              />
              <button type="submit" className="lexus-btn lexus-btn-primary">
                Subscribe
              </button>
            </form>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
