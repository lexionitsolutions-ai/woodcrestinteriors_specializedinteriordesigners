import { useEffect, useMemo, useState } from 'react';
import { EnquiryModal } from './components/EnquiryModal.jsx';
import { ChatApp } from './components/ChatApp.jsx';
import { Header } from './components/Header.jsx';
import { Hero } from './components/Hero.jsx';
import { Collections } from './components/Collections.jsx';
import { Gallery } from './components/Gallery.jsx';
import { Contact } from './components/Contact.jsx';
import { SECRET_TRIGGER_ID } from './config.js';

function PublicSite({ onHiddenTrigger }) {
  return (
    <>
      <Header />
      <main>
        <Hero />
        <section id="about" className="section split">
          <div>
            <p className="eyebrow">About Woodcrest</p>
            <h2>Architectural wall finishes with a warm, natural presence.</h2>
          </div>
          <div className="copy-stack">
            <p>
              Woodcrest Interiors specialises in premium wooden panels, acoustic surfaces, veneer finishes,
              WPC solutions and custom feature walls for refined residential and commercial spaces.
            </p>
            <p>
              Every project is planned around material integrity, precise detailing and quiet
              <span id={SECRET_TRIGGER_ID} className="inline-trigger" role="button" tabIndex="0" onClick={onHiddenTrigger} onKeyDown={(event) => {
                if (event.key === 'Enter' || event.key === ' ') onHiddenTrigger();
              }}> Craftsmanship</span>, so each surface feels intentional from the first sketch to final installation.
            </p>
          </div>
        </section>
        <Collections />
        <Gallery />
        <section id="why-us" className="section">
          <p className="eyebrow">Why Choose Us</p>
          <h2>Designed for spaces that need to look composed and last beautifully.</h2>
          <div className="feature-grid">
            {['Premium Materials', 'Professional Installation', 'Custom Designs', 'Durable Finishes', 'On-Time Completion', 'Design Consultation'].map((item) => (
              <article className="feature" key={item}>
                <h3>{item}</h3>
                <p>Measured planning, careful sourcing and installation standards suited to homes, offices and hospitality interiors.</p>
              </article>
            ))}
          </div>
        </section>
        <section className="section testimonials">
          <p className="eyebrow">Client Notes</p>
          <h2>Trusted by homeowners, architects and founders.</h2>
          <div className="testimonial-grid">
            {[
              ['The walnut slat wall changed the entire feeling of our living room. Calm, premium and perfectly finished.', 'Anika Mehra'],
              ['Their acoustic panels brought warmth to our meeting rooms without making the office feel heavy.', 'Rohan Shah'],
              ['Woodcrest handled drawings, samples and installation with rare attention to detail.', 'Maya Kapoor']
            ].map(([quote, name]) => (
              <blockquote key={name}>
                <p>{quote}</p>
                <cite>{name}</cite>
              </blockquote>
            ))}
          </div>
        </section>
        <Contact />
      </main>
      <footer className="footer">
        <div>
          <strong>WOODCREST INTERIORS</strong>
          <p>Premium Wall Panelling & Interior Solutions</p>
        </div>
        <nav aria-label="Footer">
          <a href="#about">About</a>
          <a href="#collections">Collections</a>
          <a href="#projects">Projects</a>
          <a href="#contact">Contact</a>
        </nav>
        <p>Studio 18, Design Avenue, Bengaluru<br />hello@woodcrest.example | +91 98765 43210</p>
        <small>Copyright 2026 Woodcrest Interiors. All rights reserved.</small>
      </footer>
    </>
  );
}

export default function App() {
  const [modalOpen, setModalOpen] = useState(false);
  const [session, setSession] = useState(null);

  useEffect(() => {
    const lock = () => setSession(null);
    window.addEventListener('popstate', lock);
    window.history.replaceState({ public: true }, '', window.location.pathname + window.location.search);
    return () => window.removeEventListener('popstate', lock);
  }, []);

  const handleAuthenticated = useMemo(() => (access) => {
    setModalOpen(false);
    setSession(access);
  }, []);

  return (
    <div className={session ? 'app chat-open' : 'app'}>
      <PublicSite onHiddenTrigger={() => setModalOpen(true)} />
      {modalOpen && <EnquiryModal onClose={() => setModalOpen(false)} onAuthenticated={handleAuthenticated} />}
      {session && <ChatApp session={session} onLock={() => setSession(null)} />}
    </div>
  );
}
