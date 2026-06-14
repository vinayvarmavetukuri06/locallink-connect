import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, MessageCircle, ChevronDown } from "lucide-react";
import { useState } from "react";

export const Route = createFileRoute("/user/help")({
  component: HelpSupport,
});

const FAQS = [
  { q: "How do I book a worker?", a: "Browse a category or search by name, open a worker's profile and tap 'Book Now'. Fill in your problem, date and time." },
  { q: "How is payment handled?", a: "You pay the worker directly after the job is completed. Pricing is shown upfront on each worker's profile." },
  { q: "What if the worker doesn't show up?", a: "Open the booking and tap 'Cancel'. You can rebook another worker from the same category instantly." },
  { q: "Can I save my favourite workers?", a: "Yes — tap the heart icon on a worker card to save them. Find them under Profile → Saved Workers." },
  { q: "How do I leave a review?", a: "Once a booking is marked completed you can rate and review the worker from the booking detail screen." },
];

function HelpSupport() {
  const [open, setOpen] = useState<number | null>(0);
  return (
    <>
      <header className="bg-card px-5 pt-6 pb-3 border-b border-border sticky top-0 z-30 flex items-center gap-3">
        <Link to="/user/profile"><ArrowLeft className="size-5" /></Link>
        <h1 className="font-serif text-2xl">Help & Support</h1>
      </header>
      <section className="px-5 py-5 space-y-3">
        <h2 className="font-bold text-sm font-sans uppercase tracking-wide text-muted-foreground">FAQs</h2>
        {FAQS.map((f, i) => (
          <button
            key={i}
            onClick={() => setOpen(open === i ? null : i)}
            className="w-full text-left bg-card border border-border rounded-2xl p-4"
          >
            <div className="flex items-center justify-between gap-3">
              <p className="font-bold text-sm font-sans">{f.q}</p>
              <ChevronDown className={`size-4 shrink-0 transition-transform ${open === i ? "rotate-180" : ""}`} />
            </div>
            {open === i && <p className="text-xs text-muted-foreground mt-2 leading-relaxed">{f.a}</p>}
          </button>
        ))}
      </section>
      <section className="px-5 pb-8">
        <a
          href="https://wa.me/919876543210?text=Hi%2C%20I%20need%20help%20with%20my%20LocalConnect%20booking"
          target="_blank"
          rel="noreferrer"
          className="w-full bg-success text-success-foreground flex items-center justify-center gap-2 py-3.5 rounded-2xl font-bold text-sm"
        >
          <MessageCircle className="size-4" /> Contact us on WhatsApp
        </a>
      </section>
    </>
  );
}
