import { Head, Link } from '@inertiajs/react'
import { useState } from 'react'

interface Props {
  isAuthenticated: boolean
}

export default function Home({ isAuthenticated }: Props) {
  const [openFaq, setOpenFaq] = useState<number | null>(null)

  const toggleFaq = (index: number) => {
    setOpenFaq(openFaq === index ? null : index)
  }

  const faqs = [
    {
      question: "Je n'ai vraiment pas le temps, même 5 minutes...",
      answer:
        "On a conçu Le Phare pour les restaurateurs débordés. La mission du jour s'affiche instantanément. Vous prenez une photo, l'IA écrit le texte, vous postez. Nos utilisateurs y passent en moyenne 4 minutes. C'est moins qu'un café.",
    },
    {
      question: 'Je ne suis pas doué avec la technologie',
      answer:
        "Pas de problème. L'app est aussi simple que WhatsApp. Si vous savez prendre une photo et appuyer sur un bouton, vous savez utiliser Le Phare. Et on a des tutos vidéo pour tout vous expliquer.",
    },
    {
      question: 'Est-ce que ça marche vraiment ?',
      answer:
        "Notre méthode est basée sur 7 ans d'accompagnement de restaurateurs. Les mêmes conseils qu'une agence facture 500€/mois, dans une app à 29€. Nos utilisateurs voient en moyenne +47% d'engagement après 30 jours.",
    },
    {
      question: 'Je peux poster sans Le Phare, pourquoi payer ?',
      answer:
        "Vous pouvez. Mais vous le faites ? Le problème n'est pas technique, c'est la régularité et les idées. Le Phare vous donne la structure, les idées et la motivation pour poster chaque jour. C'est un coach, pas un outil.",
    },
    {
      question: 'Et si ça ne me plaît pas ?',
      answer:
        "Essai gratuit de 14 jours, sans carte bancaire. Et garantie satisfait ou remboursé 30 jours après l'abonnement. Vous ne risquez rien.",
    },
    {
      question: "C'est compatible avec mon type de restaurant ?",
      answer:
        "Brasserie, gastro, fast-food, bar, food truck... Le Phare s'adapte. À l'inscription, vous indiquez votre type d'établissement et vos objectifs. Les missions sont personnalisées.",
    },
  ]

  return (
    <>
      <Head title="Le Phare - Instagram facile pour restaurateurs" />

      <div className="min-h-screen bg-bg font-sans text-text">
        {/* Navbar */}
        <nav className="fixed top-0 left-0 right-0 z-50 bg-bg/90 backdrop-blur-md border-b border-border/50">
          <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
            <Link href="/" className="flex items-center">
              <img src="/logo-rectangle.png" alt="Le Phare" className="h-8 brightness-0 invert" />
            </Link>

            <div className="flex items-center gap-4">
              {isAuthenticated ? (
                <Link
                  href="/dashboard"
                  className="px-6 py-2 bg-primary text-white font-bold uppercase tracking-wide rounded-full hover:brightness-110 transition-all active:scale-[0.97] text-sm"
                >
                  Accès app
                </Link>
              ) : (
                <>
                  <Link
                    href="/login"
                    className="text-text-secondary hover:text-text transition-colors font-medium text-sm"
                  >
                    Connexion
                  </Link>
                  <Link
                    href="/register"
                    className="px-6 py-2 bg-primary text-white font-bold uppercase tracking-wide rounded-full hover:brightness-110 transition-all active:scale-[0.97] text-sm"
                  >
                    Essai gratuit
                  </Link>
                </>
              )}
            </div>
          </div>
        </nav>

        {/* Hero Section */}
        <section className="pt-28 pb-16 px-6 relative overflow-hidden">
          {/* Background glow */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-primary/5 rounded-full blur-3xl pointer-events-none" />

          <div className="max-w-5xl mx-auto relative z-10">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <div>
                <p className="text-primary font-bold uppercase tracking-wide text-sm mb-4">
                  Pour les restaurateurs qui n'ont pas le temps
                </p>
                <h1 className="text-3xl md:text-4xl lg:text-5xl font-extrabold text-text leading-tight mb-6">
                  Instagram pourrait remplir votre salle.
                  <br />
                  <span className="text-primary">En 5 min par jour.</span>
                </h1>
                <p className="text-lg text-text-secondary mb-8">
                  Le Phare vous dit quoi poster. Chaque jour. Sans prise de tête.
                  Comme un community manager dans votre poche.
                </p>

                <div className="flex flex-col sm:flex-row gap-4 mb-6">
                  <Link
                    href="/register"
                    className="px-8 py-4 bg-primary text-white font-bold uppercase tracking-wide rounded-full hover:brightness-110 transition-all active:scale-[0.97] text-center"
                  >
                    Essayer 14 jours gratuit
                  </Link>
                </div>
                <p className="text-sm text-text-muted">
                  Sans carte bancaire -- Annulable à tout moment
                </p>
              </div>

              <div className="flex justify-center">
                <div className="relative">
                  {/* Phone mockup */}
                  <div className="w-64 h-[500px] bg-bg-card rounded-[2.5rem] border-2 border-border overflow-hidden relative shadow-2xl shadow-black/20">
                    {/* Notch */}
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-24 h-6 bg-bg rounded-b-2xl"></div>

                    {/* Screen content */}
                    <div className="pt-10 px-4 pb-4 h-full bg-bg">
                      {/* Mini header */}
                      <div className="flex items-center justify-center mb-4">
                        <img src="/logo-rectangle.png" alt="Le Phare" className="h-5 brightness-0 invert" />
                      </div>

                      {/* Streak */}
                      <div className="bg-bg-card border border-border rounded-2xl p-3 mb-4">
                        <div className="flex items-center gap-2">
                          <span className="text-2xl">🔥</span>
                          <div>
                            <p className="font-bold text-sm text-text">12 jours</p>
                            <p className="text-xs text-text-muted">Ta série continue !</p>
                          </div>
                        </div>
                      </div>

                      {/* Mission card */}
                      <div className="bg-bg-card border border-border rounded-2xl p-4">
                        <div className="flex items-center gap-2 mb-3">
                          <span className="text-xl">📸</span>
                          <span className="text-xs font-bold text-primary uppercase">Post</span>
                        </div>
                        <h3 className="font-bold text-sm mb-2 text-text">Poste ton plat du jour</h3>
                        <p className="text-xs text-text-secondary mb-4">
                          Montre ce qui sort de tes cuisines aujourd'hui !
                        </p>
                        <button className="w-full py-2.5 bg-primary text-white font-bold uppercase text-xs rounded-full">
                          C'est parti !
                        </button>
                      </div>

                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Social proof */}
            <div className="flex flex-wrap justify-center gap-8 mt-12 text-sm text-text-secondary">
              <span className="flex items-center gap-2">
                <span className="text-primary font-bold">✓</span> +100 restaurateurs
              </span>
              <span className="flex items-center gap-2">
                <span className="text-primary font-bold">✓</span> 7 ans d'expertise
              </span>
              <span className="flex items-center gap-2">
                <span className="text-primary font-bold">✓</span> Made in France
              </span>
            </div>
          </div>
        </section>

        {/* Pain Points */}
        <section className="py-16 px-6 bg-bg-card border-y border-border/50">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-2xl md:text-3xl font-extrabold text-text text-center mb-12 uppercase">
              Vous aussi, vous avez déjà pensé...
            </h2>

            <div className="space-y-4">
              {[
                { emoji: '🕐', text: '"J\'ai pas le temps pour les réseaux"' },
                { emoji: '🤷', text: '"Je sais jamais quoi poster"' },
                { emoji: '💸', text: '"Une agence, c\'est trop cher"' },
                { emoji: '😤', text: '"J\'ai essayé, ça sert à rien"' },
              ].map((pain, i) => (
                <div
                  key={i}
                  className="bg-white/5 border border-border rounded-2xl p-5 flex items-center gap-4"
                >
                  <span className="text-3xl">{pain.emoji}</span>
                  <p className="text-lg font-medium text-text">{pain.text}</p>
                </div>
              ))}
            </div>

            <p className="text-center text-text-muted italic mt-8">
              Pendant ce temps, le resto d'à côté cartonne sur Instagram...
            </p>
          </div>
        </section>

        {/* Solution - 3 piliers */}
        <section className="py-16 px-6">
          <div className="max-w-5xl mx-auto">
            <h2 className="text-2xl md:text-3xl font-extrabold text-text text-center mb-4 uppercase">
              La solution ? Le Phare.
            </h2>
            <p className="text-center text-text-secondary mb-12 text-lg">
              1 mission par jour. 5 minutes. Zéro prise de tête.
            </p>

            <div className="grid md:grid-cols-3 gap-6">
              {[
                {
                  emoji: '📋',
                  title: 'On vous dit quoi poster',
                  desc: 'Chaque matin, une mission adaptée à votre resto. Vous exécutez, on réfléchit pour vous.',
                },
                {
                  emoji: '✨',
                  title: "L'IA écrit le texte",
                  desc: 'Plus besoin de chercher vos mots. Description parfaite en 3 secondes.',
                },
                {
                  emoji: '🔥',
                  title: 'Vous progressez',
                  desc: 'Streaks, badges, stats. Vous voyez que ça marche. Et ça motive.',
                },
              ].map((pillar, i) => (
                <div key={i} className="bg-bg-card border border-border rounded-2xl p-6 text-center">
                  <span className="text-4xl mb-4 block">{pillar.emoji}</span>
                  <h3 className="font-bold text-lg text-text mb-2">{pillar.title}</h3>
                  <p className="text-text-secondary text-sm">{pillar.desc}</p>
                </div>
              ))}
            </div>

            <p className="text-center text-primary font-bold text-lg mt-10">
              Comme un CM dans la poche. Pour le prix d'un plat du jour.
            </p>
          </div>
        </section>

        {/* Comment ça marche */}
        <section className="py-16 px-6 bg-bg-card border-y border-border/50">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-2xl md:text-3xl font-extrabold text-text text-center mb-12 uppercase">
              Simple comme bonjour
            </h2>

            <div className="space-y-6">
              {[
                { num: '1', text: 'Vous ouvrez l\'app', sub: 'Votre mission du jour vous attend' },
                { num: '2', text: 'Vous prenez la photo', sub: 'De votre plat, votre équipe, vos coulisses' },
                { num: '3', text: 'L\'IA écrit le texte', sub: 'Vous ajustez si vous voulez' },
                { num: '4', text: 'Vous publiez', sub: 'Direct sur Instagram, en un tap' },
                { num: '5', text: 'Bravo !', sub: '+1 dans votre série 🔥' },
              ].map((step) => (
                <div key={step.num} className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center text-white font-bold shrink-0">
                    {step.num}
                  </div>
                  <div>
                    <p className="font-bold text-text">{step.text}</p>
                    <p className="text-text-secondary text-sm">{step.sub}</p>
                  </div>
                </div>
              ))}
            </div>

            <p className="text-center text-text-muted mt-8">
              ⏱️ Temps total : ~4 minutes
            </p>
          </div>
        </section>

        {/* Features */}
        <section className="py-16 px-6">
          <div className="max-w-5xl mx-auto">
            <h2 className="text-2xl md:text-3xl font-extrabold text-text text-center mb-12 uppercase">
              Tout ce qu'il vous faut
            </h2>

            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {[
                { emoji: '📸', title: 'Missions quotidiennes', desc: 'Adaptées à votre type de resto' },
                { emoji: '💡', title: '100+ idées de contenu', desc: 'Testées sur de vrais restaurants' },
                { emoji: '✍️', title: 'Textes générés par IA', desc: 'Engageants et personnalisés' },
                { emoji: '🎮', title: 'Gamification', desc: 'Streaks, badges, niveaux' },
                { emoji: '📚', title: 'Tutos vidéo', desc: 'Formations courtes et pratiques' },
                { emoji: '📊', title: 'Bilan hebdo', desc: 'Votre progression en un coup d\'œil' },
              ].map((feature, i) => (
                <div key={i} className="bg-bg-card border border-border rounded-2xl p-5 flex items-start gap-3">
                  <span className="text-2xl">{feature.emoji}</span>
                  <div>
                    <h3 className="font-bold text-text text-sm">{feature.title}</h3>
                    <p className="text-text-secondary text-xs">{feature.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Testimonials */}
        <section className="py-16 px-6 bg-bg-card border-y border-border/50">
          <div className="max-w-5xl mx-auto">
            <h2 className="text-2xl md:text-3xl font-extrabold text-text text-center mb-12 uppercase">
              Ils adorent
            </h2>

            <div className="grid md:grid-cols-3 gap-6 mb-10">
              {[
                {
                  quote: 'En 3 semaines, j\'ai plus posté qu\'en 6 mois.',
                  name: 'Marc D.',
                  place: 'Brasserie, Meaux',
                },
                {
                  quote: 'Enfin une app qui comprend notre quotidien.',
                  name: 'Sophie L.',
                  place: 'Bistrot, Fontainebleau',
                },
                {
                  quote: '500 abonnés avant l\'ouverture de mon resto !',
                  name: 'Léa M.',
                  place: 'Restaurant, Melun',
                },
              ].map((testimonial, i) => (
                <div key={i} className="bg-white/5 border border-border rounded-2xl p-5">
                  <p className="text-text mb-4 italic">"{testimonial.quote}"</p>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center text-white font-bold text-sm">
                      {testimonial.name.split(' ').map(n => n[0]).join('')}
                    </div>
                    <div>
                      <p className="font-bold text-sm text-text">{testimonial.name}</p>
                      <p className="text-xs text-text-muted">{testimonial.place}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex flex-wrap justify-center gap-8 text-center">
              <div>
                <p className="text-2xl font-extrabold text-primary">+47%</p>
                <p className="text-sm text-text-secondary">engagement</p>
              </div>
              <div>
                <p className="text-2xl font-extrabold text-primary">12 jours</p>
                <p className="text-sm text-text-secondary">streak moyen</p>
              </div>
              <div>
                <p className="text-2xl font-extrabold text-primary">4.8/5</p>
                <p className="text-sm text-text-secondary">satisfaction</p>
              </div>
            </div>
          </div>
        </section>

        {/* Pricing */}
        <section className="py-16 px-6">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-2xl md:text-3xl font-extrabold text-text text-center mb-4 uppercase">
              Moins cher qu'un plat du jour
            </h2>
            <p className="text-center text-text-secondary mb-10">Par jour.</p>

            {/* Comparison */}
            <div className="grid sm:grid-cols-2 gap-4 mb-8">
              <div className="bg-bg-card border border-border rounded-2xl p-5 opacity-50">
                <p className="font-bold text-text-muted mb-2">Agence / CM</p>
                <p className="text-2xl font-extrabold text-text mb-4">500-2000€<span className="text-sm font-normal">/mois</span></p>
                <ul className="text-sm text-text-muted space-y-1">
                  <li>❌ Jamais dispo</li>
                  <li>❌ Résultats flous</li>
                  <li>❌ Vous êtes passif</li>
                </ul>
              </div>
              <div className="bg-bg-card rounded-2xl p-5 border-2 border-primary relative">
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-white text-xs font-bold px-3 py-1 rounded-full uppercase">
                  Recommandé
                </span>
                <p className="font-bold text-primary mb-2">Le Phare</p>
                <p className="text-2xl font-extrabold text-text mb-4">29€<span className="text-sm font-normal">/mois</span></p>
                <ul className="text-sm text-text space-y-1">
                  <li>✓ Dispo 24h/24</li>
                  <li>✓ Stats temps réel</li>
                  <li>✓ Vous progressez</li>
                </ul>
              </div>
            </div>

            {/* Pricing card */}
            <div className="bg-bg-card border border-border rounded-2xl p-8 text-center max-w-md mx-auto">
              <p className="text-4xl font-extrabold text-text mb-1">29€<span className="text-lg font-normal text-text-muted">/mois</span></p>
              <p className="text-sm text-text-muted mb-6">Soit moins d'1€ par jour</p>

              <ul className="text-left text-sm space-y-2 mb-6">
                {[
                  'Missions quotidiennes personnalisées',
                  '100+ idées de contenu',
                  'Textes générés par IA',
                  'Streak & badges gamification',
                  'Tutos vidéo exclusifs',
                  'Bilan IA hebdomadaire',
                  'Support prioritaire',
                ].map((feature, i) => (
                  <li key={i} className="flex items-center gap-2 text-text-secondary">
                    <span className="text-primary">✓</span> {feature}
                  </li>
                ))}
              </ul>

              <Link
                href="/register"
                className="block w-full py-4 bg-primary text-white font-bold uppercase tracking-wide rounded-full hover:brightness-110 transition-all active:scale-[0.97]"
              >
                Essayer 14 jours gratuit
              </Link>
              <p className="text-xs text-text-muted mt-3">Sans engagement -- Annulable en 1 clic</p>
            </div>

            <div className="flex items-center justify-center gap-3 mt-8 text-text-secondary text-sm">
              <span className="text-xl">🛡️</span>
              <p>Garantie 30 jours satisfait ou remboursé</p>
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section className="py-16 px-6 bg-bg-card border-y border-border/50">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-2xl md:text-3xl font-extrabold text-text text-center mb-12 uppercase">
              Questions fréquentes
            </h2>

            <div className="space-y-3">
              {faqs.map((faq, index) => (
                <div key={index} className="bg-white/5 border border-border rounded-2xl overflow-hidden">
                  <button
                    onClick={() => toggleFaq(index)}
                    className="w-full p-5 text-left flex items-center justify-between font-bold text-text min-h-11"
                  >
                    <span>{faq.question}</span>
                    <svg
                      className={`w-5 h-5 transition-transform text-primary ${openFaq === index ? 'rotate-180' : ''}`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                  {openFaq === index && (
                    <div className="px-5 pb-5 text-text-secondary text-sm">{faq.answer}</div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Final CTA */}
        <section className="py-16 px-6 relative overflow-hidden">
          {/* Background glow */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="w-[600px] h-[400px] bg-primary/5 rounded-full blur-3xl" />
          </div>

          <div className="max-w-3xl mx-auto text-center relative z-10">
            <div className="bg-bg-card border border-border rounded-3xl p-10">
              <h2 className="text-2xl md:text-3xl font-extrabold text-text mb-4 uppercase">
                Prêt à remplir votre salle ?
              </h2>
              <p className="text-text-secondary mb-8">
                Rejoignez les restaurateurs qui ont repris le contrôle d'Instagram.
              </p>

              <Link
                href="/register"
                className="inline-block px-10 py-4 bg-primary text-white font-bold uppercase tracking-wide rounded-full hover:brightness-110 transition-all active:scale-[0.97]"
              >
                Démarrer mon essai gratuit
              </Link>

              <p className="text-xs text-text-muted mt-4">
                14 jours gratuits -- Sans carte bancaire -- Setup en 2 min
              </p>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="py-10 px-6 bg-bg-card border-t border-border/50">
          <div className="max-w-5xl mx-auto">
            <div className="flex flex-col md:flex-row items-center justify-between gap-6 mb-8">
              <img src="/logo-rectangle.png" alt="Le Phare" className="h-8 brightness-0 invert" />
              <p className="text-sm text-text-muted">
                La com' Instagram pour les restaurateurs.
              </p>
            </div>

            <div className="grid sm:grid-cols-3 gap-8 text-sm mb-8">
              <div>
                <p className="font-bold text-text mb-3">Produit</p>
                <ul className="space-y-2 text-text-secondary">
                  <li><a href="#" className="hover:text-primary transition-colors">Fonctionnalités</a></li>
                  <li><a href="#" className="hover:text-primary transition-colors">Tarifs</a></li>
                  <li><a href="#" className="hover:text-primary transition-colors">Témoignages</a></li>
                </ul>
              </div>
              <div>
                <p className="font-bold text-text mb-3">Ressources</p>
                <ul className="space-y-2 text-text-secondary">
                  <li><a href="#" className="hover:text-primary transition-colors">Blog</a></li>
                  <li><a href="#" className="hover:text-primary transition-colors">Contact</a></li>
                </ul>
              </div>
              <div>
                <p className="font-bold text-text mb-3">Légal</p>
                <ul className="space-y-2 text-text-secondary">
                  <li><a href="#" className="hover:text-primary transition-colors">Mentions légales</a></li>
                  <li><a href="#" className="hover:text-primary transition-colors">Confidentialité</a></li>
                  <li><a href="#" className="hover:text-primary transition-colors">CGV</a></li>
                </ul>
              </div>
            </div>

            <div className="border-t border-border pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-text-muted">
              <p>© 2026 Le Phare -- Fait avec ❤️ en France</p>
              <div className="flex items-center gap-4">
                <a href="#" className="hover:text-primary transition-colors">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
                  </svg>
                </a>
              </div>
            </div>
          </div>
        </footer>
      </div>
    </>
  )
}
