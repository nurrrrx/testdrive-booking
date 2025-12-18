import Link from 'next/link';
import { Facebook, Instagram, Youtube, Twitter, Linkedin } from 'lucide-react';

export function Footer() {
  return (
    <footer className="bg-[#1a1a1a] text-white">
      {/* Main Footer */}
      <div className="container mx-auto px-4 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
          {/* Buy Column */}
          <div>
            <h3 className="text-sm font-semibold tracking-wider uppercase mb-6">Buy</h3>
            <ul className="space-y-4">
              <li>
                <Link href="/models" className="text-sm text-gray-400 hover:text-white transition-colors">
                  All Models
                </Link>
              </li>
              <li>
                <Link href="/models?type=suv" className="text-sm text-gray-400 hover:text-white transition-colors">
                  SUV
                </Link>
              </li>
              <li>
                <Link href="/models?type=sedan" className="text-sm text-gray-400 hover:text-white transition-colors">
                  Sedan
                </Link>
              </li>
              <li>
                <Link href="/models?type=hybrid" className="text-sm text-gray-400 hover:text-white transition-colors">
                  Hybrid
                </Link>
              </li>
              <li>
                <Link href="/offers" className="text-sm text-gray-400 hover:text-white transition-colors">
                  Current Offers
                </Link>
              </li>
            </ul>
          </div>

          {/* Owners Column */}
          <div>
            <h3 className="text-sm font-semibold tracking-wider uppercase mb-6">Owners</h3>
            <ul className="space-y-4">
              <li>
                <Link href="/service" className="text-sm text-gray-400 hover:text-white transition-colors">
                  Book a Service
                </Link>
              </li>
              <li>
                <Link href="/warranty" className="text-sm text-gray-400 hover:text-white transition-colors">
                  Warranty Information
                </Link>
              </li>
              <li>
                <Link href="/maintenance" className="text-sm text-gray-400 hover:text-white transition-colors">
                  Maintenance Schedule
                </Link>
              </li>
              <li>
                <Link href="/roadside" className="text-sm text-gray-400 hover:text-white transition-colors">
                  Roadside Assistance
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact Us Column */}
          <div>
            <h3 className="text-sm font-semibold tracking-wider uppercase mb-6">Contact Us</h3>
            <ul className="space-y-4">
              <li>
                <Link href="/showrooms" className="text-sm text-gray-400 hover:text-white transition-colors">
                  Find a Showroom
                </Link>
              </li>
              <li>
                <Link href="/testdrive" className="text-sm text-gray-400 hover:text-white transition-colors">
                  Book a Test Drive
                </Link>
              </li>
              <li>
                <Link href="/contact" className="text-sm text-gray-400 hover:text-white transition-colors">
                  Contact Us
                </Link>
              </li>
              <li>
                <span className="text-sm text-gray-400">
                  Call: 800 LEXUS (53987)
                </span>
              </li>
            </ul>
          </div>

          {/* World of Lexus Column */}
          <div>
            <h3 className="text-sm font-semibold tracking-wider uppercase mb-6">World of Lexus</h3>
            <ul className="space-y-4">
              <li>
                <Link href="/about" className="text-sm text-gray-400 hover:text-white transition-colors">
                  About Lexus
                </Link>
              </li>
              <li>
                <Link href="/technology" className="text-sm text-gray-400 hover:text-white transition-colors">
                  Technology & Innovation
                </Link>
              </li>
              <li>
                <Link href="/sustainability" className="text-sm text-gray-400 hover:text-white transition-colors">
                  Sustainability
                </Link>
              </li>
              <li>
                <Link href="/news" className="text-sm text-gray-400 hover:text-white transition-colors">
                  News & Events
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Social Links */}
        <div className="mt-16 pt-8 border-t border-gray-800">
          <div className="flex flex-col md:flex-row items-center justify-between">
            <div className="flex items-center space-x-6 mb-6 md:mb-0">
              <a
                href="https://facebook.com/lexus"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-400 hover:text-white transition-colors"
              >
                <Facebook className="h-5 w-5" />
              </a>
              <a
                href="https://instagram.com/lexus"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-400 hover:text-white transition-colors"
              >
                <Instagram className="h-5 w-5" />
              </a>
              <a
                href="https://youtube.com/lexus"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-400 hover:text-white transition-colors"
              >
                <Youtube className="h-5 w-5" />
              </a>
              <a
                href="https://twitter.com/lexus"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-400 hover:text-white transition-colors"
              >
                <Twitter className="h-5 w-5" />
              </a>
              <a
                href="https://linkedin.com/company/lexus"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-400 hover:text-white transition-colors"
              >
                <Linkedin className="h-5 w-5" />
              </a>
            </div>

            {/* Logo */}
            <div className="text-2xl font-bold tracking-[0.3em]">LEXUS</div>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-gray-800">
        <div className="container mx-auto px-4 py-6">
          <div className="flex flex-col md:flex-row items-center justify-between text-xs text-gray-500">
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 mb-4 md:mb-0">
              <Link href="/privacy" className="hover:text-gray-300 transition-colors">
                Privacy Policy
              </Link>
              <span>|</span>
              <Link href="/terms" className="hover:text-gray-300 transition-colors">
                Terms of Use
              </Link>
              <span>|</span>
              <Link href="/cookies" className="hover:text-gray-300 transition-colors">
                Cookie Policy
              </Link>
              <span>|</span>
              <Link href="/sitemap" className="hover:text-gray-300 transition-colors">
                Sitemap
              </Link>
            </div>
            <p className="text-center md:text-right">
              &copy; {new Date().getFullYear()} Lexus UAE. All Rights Reserved.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
