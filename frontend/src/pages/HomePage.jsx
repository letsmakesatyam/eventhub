import { Link } from 'react-router-dom';
import { ArrowRight, Zap, Shield, QrCode, BarChart3 } from 'lucide-react';

const features = [
  { icon: Zap, title: 'Instant Registration', desc: 'Register for events in seconds with our streamlined flow.' },
  { icon: Shield, title: 'Secure Payments', desc: 'Razorpay-powered payments with full refund support.' },
  { icon: QrCode, title: 'QR Ticketing', desc: 'Digital tickets with unique QR codes for easy check-in.' },
  { icon: BarChart3, title: 'Admin Analytics', desc: 'Real-time revenue, attendance, and registration stats.' },
];

export const HomePage = () => (
  <div className="animate-fade-in">
    {/* Hero */}
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-24 text-center">
      <div className="inline-flex items-center gap-2 bg-violet-50 border border-violet-200 text-violet-700 px-4 py-1.5 rounded-full text-sm font-medium mb-6">
        <span className="w-1.5 h-1.5 bg-violet-500 rounded-full animate-pulse" />
        Event ticketing, reimagined
      </div>
      <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold text-gray-900 leading-tight mb-6">
        Where <span className="gradient-text">Moments</span> Begin
      </h1>
      <p className="text-xl text-gray-500 max-w-2xl mx-auto mb-10 leading-relaxed">
        Discover events, register instantly, and get digital QR tickets — all in one seamless platform built for the modern world.
      </p>
      <div className="flex flex-col sm:flex-row gap-4 justify-center">
        <Link to="/events" className="btn-primary flex items-center justify-center gap-2 text-base px-8 py-3.5">
          Browse Events <ArrowRight className="w-4 h-4" />
        </Link>
        <Link to="/register" className="btn-secondary flex items-center justify-center gap-2 text-base px-8 py-3.5">
          Create Account
        </Link>
      </div>
    </section>

    {/* Features */}
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-24">
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {features.map(({ icon: Icon, title, desc }) => (
          <div key={title} className="glass-card rounded-2xl p-6">
            <div className="w-10 h-10 bg-violet-100 rounded-xl flex items-center justify-center mb-4">
              <Icon className="w-5 h-5 text-violet-600" />
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">{title}</h3>
            <p className="text-sm text-gray-500 leading-relaxed">{desc}</p>
          </div>
        ))}
      </div>
    </section>

    {/* CTA */}
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-24">
      <div className="bg-gradient-to-r from-violet-600 to-indigo-600 rounded-3xl p-12 text-center text-white">
        <h2 className="text-3xl font-bold mb-4">Ready to host your next event?</h2>
        <p className="text-violet-100 mb-8 max-w-lg mx-auto">Join thousands of organizers using EventHub to manage registrations, payments, and check-ins.</p>
        <Link to="/register-organizer" className="inline-flex items-center gap-2 bg-white text-violet-700 font-semibold px-8 py-3.5 rounded-xl hover:bg-violet-50 transition-colors">
          Get Started Free <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </section>
  </div>
);
