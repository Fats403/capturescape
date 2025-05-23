"use client";

import { motion } from "framer-motion";
import {
  Camera,
  QrCode,
  Share2,
  Download,
  Heart,
  Shield,
  Users,
  Zap,
  Star,
  CheckCircle,
  ArrowRight,
  Sparkles,
  Globe,
  Clock,
} from "lucide-react";
import Link from "next/link";
import { useState, useEffect } from "react";

export default function CaptureScapeLanding() {
  return (
    <div className="min-h-screen overflow-x-hidden bg-white dark:bg-black">
      <Navbar />
      <HeroSection />
      <StatsSection />
      <FeaturesSection />
      <HowItWorksSection />
      <TestimonialsSection />
      <PricingSection />
      <AboutSection />
      <CTASection />
      <Footer />
    </div>
  );
}

const Navbar = () => {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <motion.nav
      className={`fixed top-0 z-50 flex w-full items-center justify-between px-4 py-4 transition-all duration-300 ${
        scrolled
          ? "border-b border-neutral-200 bg-white/95 backdrop-blur-md dark:border-neutral-800 dark:bg-black/95"
          : "bg-transparent"
      }`}
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.6 }}
    >
      <div className="flex items-center gap-2">
        <div className="relative">
          <Camera className="size-8 text-blue-500" />
          <div className="absolute -right-1 -top-1 h-3 w-3 animate-pulse rounded-full bg-gradient-to-r from-blue-400 to-purple-500" />
        </div>
        <h1 className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-xl font-bold text-transparent md:text-2xl">
          CaptureScape
        </h1>
      </div>
      <div className="hidden items-center gap-8 md:flex">
        <a
          href="#features"
          className="text-neutral-600 transition-colors hover:text-blue-600 dark:text-neutral-400 dark:hover:text-blue-400"
        >
          Features
        </a>
        <a
          href="#pricing"
          className="text-neutral-600 transition-colors hover:text-blue-600 dark:text-neutral-400 dark:hover:text-blue-400"
        >
          Pricing
        </a>
        <a
          href="#about"
          className="text-neutral-600 transition-colors hover:text-blue-600 dark:text-neutral-400 dark:hover:text-blue-400"
        >
          About
        </a>
      </div>
      <Link href="/login">
        <button className="group relative overflow-hidden rounded-xl bg-gradient-to-r from-blue-500 to-purple-600 px-6 py-2.5 font-medium text-white transition-all duration-300 hover:shadow-lg hover:shadow-blue-500/25">
          <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-blue-500 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
          <span className="relative">Login</span>
        </button>
      </Link>
    </motion.nav>
  );
};

const HeroSection = () => {
  return (
    <div className="relative mx-auto flex max-w-7xl flex-col items-center justify-center px-4 py-24 md:py-40">
      {/* Animated background elements */}
      <motion.div className="absolute inset-0 top-4 mx-0 my-16 rounded-3xl bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-blue-950/20 dark:via-indigo-950/20 dark:to-purple-950/20 md:mx-8" />

      {/* Floating elements */}
      <div className="absolute inset-0 overflow-hidden">
        <motion.div
          className="absolute left-8 top-32 h-20 w-20 rounded-full bg-gradient-to-r from-blue-400 to-purple-500 opacity-10 md:top-40"
          animate={{ y: [0, -20, 0], rotate: [0, 180, 360] }}
          transition={{ duration: 6, repeat: Infinity }}
        />
        <motion.div
          className="absolute right-20 top-[355px] h-16 w-16 rounded-full bg-gradient-to-r from-purple-400 to-pink-500 opacity-10 md:top-60"
          animate={{ y: [0, 20, 0], rotate: [360, 180, 0] }}
          transition={{ duration: 8, repeat: Infinity }}
        />
        <motion.div
          className="absolute bottom-40 left-10 h-12 w-12 rounded-full bg-gradient-to-r from-green-400 to-blue-500 opacity-10 md:left-40"
          animate={{ y: [0, -15, 0], x: [0, 10, 0] }}
          transition={{ duration: 5, repeat: Infinity }}
        />
      </div>

      <div className="relative z-10 text-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6 }}
          className="mb-6 inline-flex items-center gap-2 rounded-full bg-blue-50 px-4 py-2 text-sm font-medium text-blue-700 dark:bg-blue-950 dark:text-blue-300"
        >
          <Sparkles className="size-4" />
          <span>Now with AI-powered content moderation</span>
        </motion.div>

        <h1 className="mx-auto max-w-5xl text-4xl font-bold leading-tight text-slate-900 dark:text-slate-100 md:text-6xl lg:text-7xl">
          {"Share Your Event Photos".split(" ").map((word, index) => (
            <motion.span
              key={index}
              initial={{ opacity: 0, filter: "blur(4px)", y: 20 }}
              animate={{ opacity: 1, filter: "blur(0px)", y: 0 }}
              transition={{
                duration: 0.4,
                delay: index * 0.1,
                ease: "easeOut",
              }}
              className="mr-3 inline-block"
            >
              {word}
            </motion.span>
          ))}
          <motion.span
            initial={{ opacity: 0, filter: "blur(4px)", y: 20 }}
            animate={{ opacity: 1, filter: "blur(0px)", y: 0 }}
            transition={{
              duration: 0.4,
              delay: 0.4,
              ease: "easeOut",
            }}
            className="inline-block bg-gradient-to-r from-blue-600 via-purple-600 to-blue-800 bg-clip-text text-transparent"
          >
            In Realtime
          </motion.span>
        </h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.8 }}
          className="mx-auto max-w-2xl py-8 text-base leading-relaxed text-neutral-600 dark:text-neutral-300"
        >
          Create an event, generate a QR code, and let your guests instantly
          share photos. With AI content moderation and real-time syncing,
          everyone captures the moment together.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 1 }}
          className="mt-8 flex flex-wrap items-center justify-center gap-4"
        >
          <button className="group relative overflow-hidden rounded-xl bg-gradient-to-r from-blue-500 to-purple-600 px-8 py-4 font-semibold text-white transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-blue-500/25">
            <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-blue-500 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
            <span className="relative flex items-center gap-2">
              Start Free Event
              <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
            </span>
          </button>
          <button className="group flex items-center gap-2 rounded-xl border border-gray-300 bg-white/80 px-8 py-4 font-semibold text-gray-700 backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 hover:bg-white hover:shadow-lg dark:border-gray-700 dark:bg-black/80 dark:text-gray-300 dark:hover:bg-black">
            <div className="h-3 w-3 animate-pulse rounded-full bg-red-500" />
            Watch Demo
          </button>
        </motion.div>

        {/* Trust indicators */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4, delay: 1.2 }}
          className="mt-12 flex flex-col items-center justify-center gap-8 text-sm text-gray-500 md:flex-row"
        >
          <div className="flex items-center gap-2">
            <CheckCircle className="size-4 text-green-500" />
            <span>No app required</span>
          </div>
          <div className="flex items-center gap-2">
            <Shield className="size-4 text-blue-500" />
            <span>Privacy protected</span>
          </div>
          <div className="flex items-center gap-2">
            <Zap className="size-4 text-yellow-500" />
            <span>Instant setup</span>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

const StatsSection = () => {
  const stats = [
    {
      number: "50K+",
      label: "Events Created",
      icon: <Camera className="size-6" />,
    },
    {
      number: "2M+",
      label: "Photos Shared",
      icon: <Share2 className="size-6" />,
    },
    { number: "99.9%", label: "Uptime", icon: <Globe className="size-6" /> },
    {
      number: "<2s",
      label: "Avg Upload Time",
      icon: <Clock className="size-6" />,
    },
  ];

  return (
    <section className="">
      <div className="mx-auto max-w-7xl px-4">
        <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
          {stats.map((stat, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="text-center"
            >
              <div className="mb-3 inline-flex rounded-xl bg-white p-3 text-blue-500 shadow-lg dark:bg-gray-900">
                {stat.icon}
              </div>
              <div className="mb-1 text-3xl font-bold text-gray-900 dark:text-gray-100">
                {stat.number}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                {stat.label}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

const FeaturesSection = () => {
  const features = [
    {
      icon: <Shield className="size-8 text-white" />,
      title: "AI Content Moderation",
      description:
        "Advanced AI automatically filters inappropriate content, keeping your event photos family-friendly and professional.",
      gradient: "from-blue-500 to-cyan-500",
    },
    {
      icon: <Zap className="size-8 text-white" />,
      title: "Real-time Sharing",
      description:
        "Photos appear instantly for all guests as soon as they're uploaded. No delays, no waiting - just seamless sharing.",
      gradient: "from-green-500 to-emerald-500",
    },
    {
      icon: <Download className="size-8 text-white" />,
      title: "Bulk Download",
      description:
        "When the event ends, everyone can download all photos in high resolution with a single click.",
      gradient: "from-purple-500 to-violet-500",
    },
    {
      icon: <Heart className="size-8 text-white" />,
      title: "Like & Share",
      description:
        "Guests can like their favorite photos and share specific moments on social media platforms.",
      gradient: "from-red-500 to-pink-500",
    },
    {
      icon: <QrCode className="size-8 text-white" />,
      title: "QR Code Access",
      description:
        "Generate a unique QR code for your event. Guests simply scan to join and start sharing instantly.",
      gradient: "from-orange-500 to-amber-500",
    },
    {
      icon: <Users className="size-8 text-white" />,
      title: "Guest Management",
      description:
        "See who's participating, manage permissions, and ensure only invited guests can access your event.",
      gradient: "from-indigo-500 to-blue-500",
    },
  ];

  return (
    <section id="features" className="bg-white py-24 dark:bg-black">
      <div className="mx-auto max-w-7xl px-4">
        <div className="mb-20 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            className="mb-6 inline-flex items-center gap-2 rounded-full bg-blue-50 px-4 py-2 text-sm font-medium text-blue-700 dark:bg-blue-950 dark:text-blue-300"
          >
            <Star className="size-4" />
            <span>Powerful Features</span>
          </motion.div>
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="mb-6 text-4xl font-bold text-gray-900 dark:text-gray-100 md:text-5xl"
          >
            Everything you need for seamless
            <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              {" "}
              photo sharing
            </span>
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mx-auto max-w-3xl text-xl text-gray-600 dark:text-gray-400"
          >
            From AI-powered moderation to real-time syncing, CaptureScape has
            all the features to make your event photography effortless and
            memorable.
          </motion.p>
        </div>
        <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
          {features.map((feature, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="group relative rounded-2xl border border-gray-100 bg-white p-8 shadow-lg transition-all duration-300 hover:border-blue-200 dark:border-gray-800 dark:bg-gray-900 dark:hover:border-blue-800"
            >
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-blue-50/50 to-purple-50/50 opacity-0 transition-opacity duration-300 group-hover:opacity-100 dark:from-blue-950/20 dark:to-purple-950/20" />
              <div className="relative">
                <div
                  className={`inline-flex rounded-xl bg-gradient-to-r p-3 ${feature.gradient} mb-6 shadow-lg`}
                >
                  <div className="text-white">{feature.icon}</div>
                </div>
                <h3 className="mb-4 text-xl font-semibold text-gray-900 dark:text-gray-100">
                  {feature.title}
                </h3>
                <p className="leading-relaxed text-gray-600 dark:text-gray-400">
                  {feature.description}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

const HowItWorksSection = () => {
  const steps = [
    {
      step: "1",
      title: "Create Your Event",
      description:
        "Set up your event in seconds with a name, date, and description. Customize settings for your specific needs.",
      color: "bg-blue-500",
    },
    {
      step: "2",
      title: "Generate QR Code",
      description:
        "Get a unique QR code that you can print, display, or share digitally with all your guests.",
      color: "bg-purple-500",
    },
    {
      step: "3",
      title: "Guests Scan & Join",
      description:
        "Attendees scan the code to instantly access your event's photo sharing hub - no app required.",
      color: "bg-green-500",
    },
    {
      step: "4",
      title: "Share & Enjoy",
      description:
        "Everyone uploads photos that appear in real-time for all guests to see, like, and download.",
      color: "bg-orange-500",
    },
  ];

  return (
    <section className="bg-gradient-to-br from-gray-50 to-blue-50 py-24 dark:from-gray-950 dark:to-blue-950/20">
      <div className="mx-auto max-w-7xl px-4">
        <div className="mb-20 text-center">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            className="mb-6 text-4xl font-bold text-gray-900 dark:text-gray-100 md:text-5xl"
          >
            How it works
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-xl text-gray-600 dark:text-gray-400"
          >
            Get started in minutes with our simple 4-step process
          </motion.p>
        </div>
        <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-4">
          {steps.map((step, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.15 }}
              className="relative text-center"
            >
              {/* Connection line */}
              {index < steps.length - 1 && (
                <div className="absolute left-1/2 top-8 z-0 hidden h-0.5 w-full bg-gradient-to-r from-gray-300 to-gray-200 dark:from-gray-700 dark:to-gray-600 lg:block" />
              )}

              <div className="relative z-10">
                <div
                  className={`h-16 w-16 ${step.color} relative mx-auto mb-6 flex items-center justify-center rounded-2xl text-2xl font-bold text-white shadow-lg`}
                >
                  {step.step}
                  <div className="absolute inset-0 rounded-2xl bg-white/20" />
                </div>
                <h3 className="mb-4 text-xl font-semibold text-gray-900 dark:text-gray-100">
                  {step.title}
                </h3>
                <p className="leading-relaxed text-gray-600 dark:text-gray-400">
                  {step.description}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

const TestimonialsSection = () => {
  const testimonials = [
    {
      name: "Sarah Johnson",
      role: "Wedding Planner",
      image: "SJ",
      content:
        "CaptureScape transformed our wedding photo sharing experience. Guests loved the instant access and the AI moderation kept everything appropriate.",
      rating: 5,
    },
    {
      name: "Mike Chen",
      role: "Corporate Event Manager",
      image: "MC",
      content:
        "We used CaptureScape for our company retreat. The real-time sharing and bulk download features saved us hours of collecting photos from everyone.",
      rating: 5,
    },
    {
      name: "Emily Rodriguez",
      role: "Birthday Party Host",
      image: "ER",
      content:
        "Setting up was incredibly easy! The QR code made it simple for all our guests to join and share memories from my daughter's sweet 16.",
      rating: 4,
    },
  ];

  return (
    <section className="bg-white py-24 dark:bg-black">
      <div className="mx-auto max-w-7xl px-4">
        <div className="mb-20 text-center">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            className="mb-6 text-4xl font-bold text-gray-900 dark:text-gray-100 md:text-5xl"
          >
            Loved by event organizers
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-xl text-gray-600 dark:text-gray-400"
          >
            See what our customers are saying about CaptureScape
          </motion.p>
        </div>
        <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
          {testimonials.map((testimonial, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="rounded-2xl border border-gray-100 bg-gradient-to-br from-white to-gray-50 p-8 shadow-lg dark:border-gray-700 dark:from-gray-900 dark:to-gray-800"
            >
              <div className="mb-4 flex items-center">
                {Array.from({ length: testimonial.rating }, (_, i) => (
                  <Star
                    key={i}
                    className="size-5 fill-current text-yellow-400"
                  />
                ))}
              </div>
              <p className="mb-6 italic leading-relaxed text-gray-700 dark:text-gray-300">
                &quot;{testimonial.content}&quot;
              </p>
              <div className="flex items-center">
                <div className="mr-4 flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-r from-blue-500 to-purple-500 font-bold text-white">
                  {testimonial.image}
                </div>
                <div>
                  <div className="font-semibold text-gray-900 dark:text-gray-100">
                    {testimonial.name}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    {testimonial.role}
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

const PricingSection = () => {
  const plans = [
    {
      name: "Free",
      price: "$0",
      period: "forever",
      description: "Perfect for small gatherings",
      features: [
        "Up to 50 photos per event",
        "1 active event at a time",
        "Basic AI moderation",
        "Standard download quality",
        "7-day photo storage",
      ],
      cta: "Start Free",
      popular: false,
      gradient: "from-gray-500 to-gray-600",
    },
    {
      name: "Pro",
      price: "$19",
      period: "per event",
      description: "Great for weddings and parties",
      features: [
        "Unlimited photos per event",
        "Up to 5 simultaneous events",
        "Advanced AI moderation",
        "High-resolution downloads",
        "30-day photo storage",
        "Custom branding",
      ],
      cta: "Choose Pro",
      popular: true,
      gradient: "from-blue-500 to-purple-600",
    },
  ];

  return (
    <section
      id="pricing"
      className="bg-gradient-to-br from-gray-50 to-blue-50 py-24 dark:from-gray-950 dark:to-blue-950/20"
    >
      <div className="mx-auto max-w-7xl px-4">
        <div className="mb-20 text-center">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            className="mb-6 text-4xl font-bold text-gray-900 dark:text-gray-100 md:text-5xl"
          >
            Simple, transparent pricing
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-xl text-gray-600 dark:text-gray-400"
          >
            Choose the plan that fits your event size and needs
          </motion.p>
        </div>
        <div className="mx-4 flex w-full flex-col items-center justify-center gap-16 md:flex-row">
          {plans.map((plan, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              transition={{ duration: 0.5 }}
              className={`relative flex w-96 flex-col rounded-2xl border-2 bg-white p-8 shadow-lg transition-all duration-300 hover:shadow-2xl dark:bg-gray-900 ${
                plan.popular
                  ? "scale-105 border-blue-500 shadow-blue-500/20"
                  : "border-gray-200 hover:border-blue-300 dark:border-gray-700 dark:hover:border-blue-600"
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 transform">
                  <span className="rounded-full bg-gradient-to-r from-blue-500 to-purple-600 px-6 py-2 text-sm font-semibold text-white shadow-lg">
                    Most Popular
                  </span>
                </div>
              )}
              <div className="mb-8 text-center">
                <h3 className="mb-4 text-2xl font-bold text-gray-900 dark:text-gray-100">
                  {plan.name}
                </h3>
                <div className="mb-4">
                  <span className="text-5xl font-bold text-gray-900 dark:text-gray-100">
                    {plan.price}
                  </span>
                  <span className="ml-2 text-gray-600 dark:text-gray-400">
                    /{plan.period}
                  </span>
                </div>
                <p className="text-gray-600 dark:text-gray-400">
                  {plan.description}
                </p>
              </div>
              <ul className="mx-auto mb-8 flex w-fit flex-1 flex-col space-y-4">
                {plan.features.map((feature, featureIndex) => (
                  <li key={featureIndex} className="flex items-start">
                    <div className="mr-3 mt-0.5 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-green-500">
                      <CheckCircle className="size-4 text-white" />
                    </div>
                    <span className="text-gray-600 dark:text-gray-400">
                      {feature}
                    </span>
                  </li>
                ))}
              </ul>
              <button
                className={`w-full rounded-xl px-6 py-4 font-semibold transition-all duration-300 ${
                  plan.popular
                    ? `bg-gradient-to-r ${plan.gradient} text-white hover:-translate-y-1 hover:shadow-lg hover:shadow-blue-500/25`
                    : "bg-gray-100 text-gray-900 hover:-translate-y-1 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-100 dark:hover:bg-gray-700"
                }`}
              >
                {plan.cta}
              </button>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

const AboutSection = () => {
  return (
    <section id="about" className="bg-white py-24 dark:bg-black">
      <div className="mx-auto max-w-7xl px-4">
        <div className="grid grid-cols-1 items-center gap-16 lg:grid-cols-2">
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-blue-50 px-4 py-2 text-sm font-medium text-blue-700 dark:bg-blue-950 dark:text-blue-300">
              <span>Our Story</span>
            </div>
            <h2 className="mb-8 text-4xl font-bold text-gray-900 dark:text-gray-100 md:text-5xl">
              About CaptureScape
            </h2>
            <div className="space-y-6 text-base leading-relaxed text-gray-600 dark:text-gray-400">
              <p>
                CaptureScape was born from a simple frustration: why is it so
                hard to share photos from events with everyone who was there?
                We&apos;ve all been to weddings, parties, and gatherings where
                amazing photos were taken, but they ended up scattered across
                different phones and social media accounts.
              </p>

              <p>
                Built with privacy and safety in mind, our AI content moderation
                ensures that your shared memories remain appropriate and
                enjoyable for everyone involved.
              </p>
            </div>
            <div className="mt-8 flex flex-wrap gap-4">
              <div className="flex items-center gap-3 rounded-full bg-blue-50 px-4 py-2 dark:bg-blue-950/30">
                <Shield className="size-5 text-blue-500" />
                <span className="font-medium text-gray-700 dark:text-gray-300">
                  Privacy First
                </span>
              </div>
              <div className="flex items-center gap-3 rounded-full bg-green-50 px-4 py-2 dark:bg-green-950/30">
                <Zap className="size-5 text-green-500" />
                <span className="font-medium text-gray-700 dark:text-gray-300">
                  Lightning Fast
                </span>
              </div>
              <div className="flex items-center gap-3 rounded-full bg-purple-50 px-4 py-2 dark:bg-purple-950/30">
                <Users className="size-5 text-purple-500" />
                <span className="font-medium text-gray-700 dark:text-gray-300">
                  Community Driven
                </span>
              </div>
            </div>
          </motion.div>
          <motion.div
            className="relative"
            initial={{ opacity: 0, x: 50 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="relative h-96 overflow-hidden rounded-3xl bg-gradient-to-br from-blue-100 via-purple-50 to-indigo-100 p-12 dark:from-blue-900/20 dark:via-purple-900/20 dark:to-indigo-900/20">
              {/* Floating elements */}
              <motion.div
                className="absolute left-8 top-8 h-16 w-16 rounded-2xl bg-gradient-to-r from-blue-400 to-purple-500 opacity-80"
                animate={{ y: [0, -10, 0], rotate: [0, 5, 0] }}
                transition={{ duration: 4, repeat: Infinity }}
              />
              <motion.div
                className="absolute right-12 top-12 h-12 w-12 rounded-full bg-gradient-to-r from-green-400 to-blue-500 opacity-60"
                animate={{ y: [0, 15, 0], x: [0, -5, 0] }}
                transition={{ duration: 5, repeat: Infinity }}
              />

              {/* Center content */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <motion.div
                    animate={{ scale: [1, 1.1, 1] }}
                    transition={{ duration: 3, repeat: Infinity }}
                  >
                    <Camera className="mx-auto mb-6 size-32 text-blue-500" />
                  </motion.div>
                  <h3 className="mb-2 text-2xl font-bold text-gray-900 dark:text-gray-100">
                    Capture Every Moment
                  </h3>
                  <p className="text-lg text-gray-600 dark:text-gray-400">
                    Together
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

const CTASection = () => {
  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-blue-600 via-purple-600 to-blue-800 py-24">
      {/* Background elements */}
      <div className="absolute inset-0">
        <motion.div
          className="absolute left-10 top-20 h-32 w-32 rounded-full bg-white/10"
          animate={{ y: [0, -20, 0], opacity: [0.1, 0.2, 0.1] }}
          transition={{ duration: 8, repeat: Infinity }}
        />
        <motion.div
          className="absolute bottom-20 right-20 h-24 w-24 rounded-full bg-white/10"
          animate={{ y: [0, 20, 0], opacity: [0.1, 0.15, 0.1] }}
          transition={{ duration: 6, repeat: Infinity }}
        />
      </div>

      <div className="relative mx-auto max-w-4xl px-4 text-center">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <h2 className="mb-8 text-4xl font-bold text-white md:text-6xl">
            Ready to transform your{" "}
            <span className="bg-gradient-to-r from-yellow-300 to-orange-300 bg-clip-text text-transparent">
              event photography?
            </span>
          </h2>
          <p className="mx-auto mb-12 max-w-2xl text-xl leading-relaxed text-blue-100">
            Join thousands of event organizers who trust CaptureScape to capture
            and share their most important moments in real-time.
          </p>
          <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
            <button className="group rounded-xl bg-white px-8 py-4 text-lg font-semibold text-blue-600 transition-all duration-300 hover:-translate-y-1 hover:bg-blue-50 hover:shadow-xl">
              <span className="flex items-center gap-2">
                Start Your Free Event
                <ArrowRight className="size-5 transition-transform group-hover:translate-x-1" />
              </span>
            </button>
            <button className="group rounded-xl border-2 border-white/30 px-8 py-4 text-lg font-semibold text-white backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 hover:border-white hover:bg-white/10">
              <span className="flex items-center gap-2">
                <div className="h-3 w-3 animate-pulse rounded-full bg-red-400" />
                Watch Demo
              </span>
            </button>
          </div>
          <p className="mt-6 text-sm text-blue-200">
            No credit card required • Setup in under 2 minutes • Cancel anytime
          </p>
        </motion.div>
      </div>
    </section>
  );
};

const Footer = () => {
  return (
    <footer className="bg-gray-900 py-16 text-white">
      <div className="mx-auto max-w-7xl px-4">
        <div className="grid grid-cols-1 gap-12 md:grid-cols-4">
          <div className="col-span-1 md:col-span-2">
            <div className="mb-6 flex items-center gap-3">
              <div className="relative">
                <Camera className="size-10 text-blue-400" />
                <div className="absolute -right-1 -top-1 h-4 w-4 animate-pulse rounded-full bg-gradient-to-r from-blue-400 to-purple-500" />
              </div>
              <h3 className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-3xl font-bold text-transparent">
                CaptureScape
              </h3>
            </div>
            <p className="mb-8 max-w-md leading-relaxed text-gray-400">
              The easiest way to share event photos in real-time. Create, scan,
              share, and download all your memories in one place with AI-powered
              content moderation.
            </p>
            <div className="flex space-x-4">
              <div className="flex h-12 w-12 cursor-pointer items-center justify-center rounded-xl bg-gradient-to-r from-blue-500 to-purple-600 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:shadow-blue-500/25">
                <Share2 className="size-5 text-white" />
              </div>
              <div className="flex h-12 w-12 cursor-pointer items-center justify-center rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:shadow-purple-500/25">
                <Camera className="size-5 text-white" />
              </div>
            </div>
          </div>
          <div>
            <h4 className="mb-6 text-lg font-semibold text-gray-100">
              Product
            </h4>
            <ul className="space-y-3 text-gray-400">
              <li>
                <a
                  href="#features"
                  className="transition-colors hover:text-blue-400"
                >
                  Features
                </a>
              </li>
              <li>
                <a
                  href="#pricing"
                  className="transition-colors hover:text-blue-400"
                >
                  Pricing
                </a>
              </li>
              <li>
                <a href="#" className="transition-colors hover:text-blue-400">
                  Demo
                </a>
              </li>
              <li>
                <a href="#" className="transition-colors hover:text-blue-400">
                  API
                </a>
              </li>
              <li>
                <a href="#" className="transition-colors hover:text-blue-400">
                  Integrations
                </a>
              </li>
            </ul>
          </div>
          <div>
            <h4 className="mb-6 text-lg font-semibold text-gray-100">
              Company
            </h4>
            <ul className="space-y-3 text-gray-400">
              <li>
                <a
                  href="#about"
                  className="transition-colors hover:text-blue-400"
                >
                  About
                </a>
              </li>
              <li>
                <a href="#" className="transition-colors hover:text-blue-400">
                  Contact
                </a>
              </li>
              <li>
                <a href="#" className="transition-colors hover:text-blue-400">
                  Privacy
                </a>
              </li>
              <li>
                <a href="#" className="transition-colors hover:text-blue-400">
                  Terms
                </a>
              </li>
              <li>
                <a href="#" className="transition-colors hover:text-blue-400">
                  Support
                </a>
              </li>
            </ul>
          </div>
        </div>
        <div className="mt-16 flex flex-col items-center justify-between border-t border-gray-800 pt-8 md:flex-row">
          <p className="mb-4 text-gray-400 md:mb-0">
            &copy; 2024 CaptureScape. All rights reserved.
          </p>
          <div className="flex items-center gap-6 text-sm text-gray-400">
            <span className="flex items-center gap-2">
              <div className="h-2 w-2 animate-pulse rounded-full bg-green-400" />
              All systems operational
            </span>
            <span>Status</span>
            <span>Blog</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
