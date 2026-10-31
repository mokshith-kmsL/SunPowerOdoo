import { useEffect, useState } from 'react';

// Subtle parallax on mouse move
function useParallax() {
  useEffect(() => {
    const handler = (e) => {
      const cx = window.innerWidth / 2;
      const cy = window.innerHeight / 2;
      document.querySelectorAll('[data-parallax]').forEach((el) => {
        const s = parseFloat(el.dataset.parallax) || 1;
        const dx = (e.clientX - cx) * 0.016 * s;
        const dy = (e.clientY - cy) * 0.016 * s;
        el.style.transform = `translate(${dx}px, ${dy}px)`;
      });
    };
    window.addEventListener('mousemove', handler);
    return () => window.removeEventListener('mousemove', handler);
  }, []);
}

// Reusable blob with real grayscale photo
function PhotoBlob({ src, clipPath, viewBox, className, parallax }) {
  const id = `clip-${Math.abs(src.charCodeAt(30) ?? 0)}${className}`;
  return (
    <div className={`l-blob ${className}`} data-parallax={parallax}>
      <svg viewBox={viewBox} xmlns="http://www.w3.org/2000/svg" style={{ display: 'block', width: '100%' }}>
        <defs>
          <clipPath id={id}><path d={clipPath}/></clipPath>
          <filter id={`f${id}`}>
            <feColorMatrix type="saturate" values="0"/>
            <feComponentTransfer>
              <feFuncR type="linear" slope="1.05" intercept="-0.02"/>
              <feFuncG type="linear" slope="1.05" intercept="-0.02"/>
              <feFuncB type="linear" slope="1.05" intercept="-0.02"/>
            </feComponentTransfer>
          </filter>
        </defs>
        <image href={src} x="0" y="0" width="100%" height="100%"
          clipPath={`url(#${id})`} filter={`url(#f${id})`}
          preserveAspectRatio="xMidYMid slice"/>
        <path d={clipPath} fill="none" stroke="#18181b" strokeWidth="1.5"/>
      </svg>
    </div>
  );
}

export default function Landing({ onGetStarted, onSignIn }) {
  useParallax();
  const [form, setForm] = useState({ name: '', phone: '', email: '', message: '' });
  const [sent, setSent] = useState(false);

  function handleForm(e) { setForm({ ...form, [e.target.name]: e.target.value }); }
  function handleSubmit(e) {
    e.preventDefault();
    setSent(true);
    setForm({ name: '', phone: '', email: '', message: '' });
  }

  return (
    <div className="landing">

      {/* ── Top bar ─────────────────────────────────── */}
      <div className="l-topbar">
        <div className="l-topbar-inner">
          <span>📞 +91 98765 43210</span>
          <span>✉️ info@sunpowersolutions.in</span>
          <span>⏰ Mon–Sat, 9am–6pm</span>
        </div>
      </div>

      {/* ── Nav ─────────────────────────────────────── */}
      <header className="landing-nav">
        <span className="landing-logo">SunPower Solutions</span>
        <nav className="l-nav-links">
          <a href="#about"    className="l-nav-link">About</a>
          <a href="#services" className="l-nav-link">Services</a>
          <a href="#systems"  className="l-nav-link">Systems</a>
          <a href="#contact"  className="l-nav-link">Contact</a>
        </nav>
        <div className="landing-nav-actions">
          <button className="lbtn lbtn-ghost" onClick={onSignIn}>Sign In</button>
          <button className="lbtn lbtn-dark"  onClick={onGetStarted}>Get Started</button>
        </div>
      </header>

      {/* ── Hero ────────────────────────────────────── */}
      <section className="l-hero-new">
        {/* Floating images */}
        <PhotoBlob
          src="https://images.unsplash.com/photo-1508514177221-188b1cf16e9d?w=500&q=80&auto=format&fit=crop"
          viewBox="0 0 230 230" className="l-blob-tl" parallax="1.3"
          clipPath="M115,8 C160,6 210,44 218,92 C226,146 190,198 140,210 C88,224 32,196 14,152 C-4,106 16,48 60,20 C78,10 96,9 115,8Z"
        />
        <PhotoBlob
          src="https://images.unsplash.com/photo-1466611653911-95081537e5b7?w=340&q=80&auto=format&fit=crop"
          viewBox="0 0 170 170" className="l-blob-tr" parallax="0.9"
          clipPath="M85,6 C122,6 162,36 164,78 C166,124 132,162 88,164 C42,166 6,128 6,84 C6,38 48,6 85,6Z"
        />
        <PhotoBlob
          src="https://images.unsplash.com/photo-1509391366360-2e959784a276?w=400&q=80&auto=format&fit=crop"
          viewBox="0 0 200 200" className="l-blob-br" parallax="1.5"
          clipPath="M100,8 C146,6 188,44 192,90 C196,140 160,182 112,186 C62,190 10,152 8,102 C6,50 50,10 100,8Z"
        />
        <PhotoBlob
          src="https://images.unsplash.com/photo-1521618755572-156ae0cdd74d?w=480&q=80&auto=format&fit=crop"
          viewBox="0 0 220 220" className="l-blob-bl" parallax="0.8"
          clipPath="M108,10 C154,8 202,42 210,88 C218,140 182,192 132,204 C80,218 24,190 10,146 C-4,100 18,46 62,20 C80,11 94,11 108,10Z"
        />
        {/* Grid dots */}
        <div className="l-dots" data-parallax="0.4">
          {[...Array(18)].map((_,i) => <div key={i} className="l-dot"/>)}
        </div>
        {/* Content */}
        <div className="l-hero-center">
          <div className="l-tag">EPC Solar Company — End-to-End Execution</div>
          <h1 className="l-h1-big">
            Clean Energy.<br />
            <span className="l-h1-outline">End to End.</span>
          </h1>
          <p className="l-hero-sub">
            Design, procurement, installation and commissioning —<br />
            fully managed under one roof.
          </p>
          <div className="l-hero-cta">
            <button className="lbtn lbtn-dark lbtn-lg" onClick={onGetStarted}>Get a Free Quote</button>
            <button className="lbtn lbtn-outline lbtn-lg" onClick={onSignIn}>Customer Portal</button>
          </div>
        </div>
        {/* Stat strip */}
        <div className="l-hero-stats">
          <div className="l-hero-stat"><span className="l-hs-val">500+</span><span className="l-hs-lbl">Installations</span></div>
          <div className="l-hero-stat-div"/>
          <div className="l-hero-stat"><span className="l-hs-val">20yr</span><span className="l-hs-lbl">Panel Warranty</span></div>
          <div className="l-hero-stat-div"/>
          <div className="l-hero-stat"><span className="l-hs-val">KSEB</span><span className="l-hs-lbl">Certified</span></div>
          <div className="l-hero-stat-div"/>
          <div className="l-hero-stat"><span className="l-hs-val">MNRE</span><span className="l-hs-lbl">Approved</span></div>
        </div>
      </section>

      {/* ── Marquee ─────────────────────────────────── */}
      <div className="l-marquee-wrap">
        <div className="l-marquee">
          {['On-Grid Systems','Off-Grid Systems','Hybrid Systems','Site Assessment','Engineering & Design','Equipment Procurement','Installation','Commissioning','O&M Services','KSEB Net Metering','MNRE Subsidies','20-Year Warranty',
            'On-Grid Systems','Off-Grid Systems','Hybrid Systems','Site Assessment','Engineering & Design','Equipment Procurement','Installation','Commissioning','O&M Services','KSEB Net Metering','MNRE Subsidies','20-Year Warranty',
          ].map((t,i) => <span key={i} className="l-marquee-item">{t}</span>)}
        </div>
      </div>

      {/* ── About ───────────────────────────────────── */}
      <section className="l-section" id="about">
        <div className="l-inner l-about">
          <div className="l-about-text">
            <div className="l-section-label">About Us</div>
            <h2 className="l-h2">An EPC Solar Company You Can Trust</h2>
            <p className="l-about-body">
              SunPower Solutions is an EPC (Engineering, Procurement, and Construction) company responsible for the end-to-end execution of solar power projects. We handle design, equipment procurement, installation, and commissioning — ensuring every system is fully functional from day one.
            </p>
            <p className="l-about-body" style={{ marginTop: 12 }}>
              From residential rooftops to commercial installations, our certified team delivers on-grid, off-grid, and hybrid systems built to last. Every project is backed by manufacturer warranties, KSEB certification, and MNRE subsidy assistance.
            </p>
            <div className="l-about-badges">
              <span className="l-about-badge">KSEB Certified</span>
              <span className="l-about-badge">MNRE Empanelled</span>
              <span className="l-about-badge">ISO Compliant</span>
              <span className="l-about-badge">Tier-1 Equipment</span>
            </div>
          </div>
          <div className="l-about-img-wrap">
            <img
              src="https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&q=80&auto=format&fit=crop"
              alt="Solar installation"
              className="l-about-img"
              style={{ filter: 'grayscale(100%)' }}
            />
          </div>
        </div>
      </section>

      {/* ── Services ────────────────────────────────── */}
      <section className="l-section l-section-gray" id="services">
        <div className="l-inner">
          <div className="l-section-label">What We Do</div>
          <h2 className="l-h2">Our Services</h2>
          <p className="l-sub">End-to-end solar project execution for residential, commercial and industrial clients</p>
          <div className="l-services-grid">
            {[
              { n:'01', title:'Site Assessment',        desc:'A thorough survey of your site — roof orientation, shading analysis, structural load, grid proximity, and energy consumption audit.' },
              { n:'02', title:'Engineering & Design',   desc:'Custom system design, single-line diagrams, load calculations, and optimal panel layout using the latest design software.' },
              { n:'03', title:'Equipment Procurement',  desc:'Strategic sourcing of Tier-1 panels, inverters, batteries and mounting structures at competitive prices from verified manufacturers.' },
              { n:'04', title:'Installation',           desc:'Certified crew handling safe and precise mounting, wiring, earthing, and inverter installation with strict quality checks.' },
              { n:'05', title:'Commissioning',          desc:'System testing, grid synchronisation, net meter installation, and full handover documentation before handing over to you.' },
              { n:'06', title:'Operations & Maintenance', desc:'AMC packages with periodic inspection, cleaning, performance monitoring, and rapid fault resolution to maximise uptime.' },
            ].map((s) => (
              <div key={s.n} className="l-service-card">
                <div className="l-service-n">{s.n}</div>
                <h3 className="l-service-title">{s.title}</h3>
                <p className="l-service-desc">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Systems ─────────────────────────────────── */}
      <section className="l-section" id="systems">
        <div className="l-inner">
          <div className="l-section-label">Product Range</div>
          <h2 className="l-h2">Types of Solar Systems</h2>
          <p className="l-sub">Choose the right system based on your energy needs and location</p>
          <div className="l-systems-grid">
            {[
              {
                title:'On-Grid System',
                price:'From ₹1,85,000',
                tag:'Best for urban homes & offices',
                features:['Connected to utility grid','Net metering — sell surplus power','No battery required','Lowest upfront cost','KSEB approved setup'],
                desc:'Ideal for locations with reliable grid supply. Generate your own power and export surplus back to the grid.',
              },
              {
                title:'Off-Grid System',
                price:'From ₹2,40,000',
                tag:'Best for remote locations',
                features:['100% energy independence','Battery backup included','No grid connection needed','Reliable in load-shedding areas','Scales easily'],
                desc:'Perfect for farms, remote homes and areas with frequent power cuts. Completely self-sufficient.',
                hi: true,
              },
              {
                title:'Hybrid System',
                price:'From ₹3,20,000',
                tag:'Best of both worlds',
                features:['On-grid + battery backup','Power during grid outages','Smart energy management','Future-ready with EV charging','Maximum savings'],
                desc:'Combines grid connection with battery storage. Powers your home even during outages.',
              },
            ].map((s) => (
              <div key={s.title} className={`l-system-card${s.hi?' l-system-hi':''}`}>
                <div className="l-system-tag">{s.tag}</div>
                <h3 className="l-system-title">{s.title}</h3>
                <div className="l-system-price">{s.price}</div>
                <p className="l-system-desc">{s.desc}</p>
                <ul className="l-system-features">
                  {s.features.map(f => <li key={f}>{f}</li>)}
                </ul>
                <button className={`lbtn ${s.hi?'lbtn-white':'lbtn-dark'} l-card-btn`} onClick={onGetStarted}>
                  Get a Quote
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── How it works ────────────────────────────── */}
      <section className="l-section l-section-gray">
        <div className="l-inner">
          <div className="l-section-label">The Process</div>
          <h2 className="l-h2">How It Works</h2>
          <p className="l-sub">From enquiry to grid-export in six steps</p>
          <div className="l-steps">
            {[
              { n:'01', title:'Request a Quote',   desc:'Share your monthly bill and roof details. We recommend the right system.' },
              { n:'02', title:'Site Survey',        desc:'Our certified technician visits your site for a full assessment.' },
              { n:'03', title:'Quotation',          desc:'Detailed BOM, live prices, GST breakdown, and subsidy calculation.' },
              { n:'04', title:'Confirm & Pay',      desc:'Approve the quote and pay in advance or convenient instalments.' },
              { n:'05', title:'Install & Commission', desc:'Equipment serialised, delivered, installed and commissioned by our crew.' },
              { n:'06', title:'Warranty Active',    desc:'20yr panel warranty and 2yr inverter warranty auto-activated on dispatch.' },
            ].map((s) => (
              <div key={s.n} className="l-step">
                <div className="l-step-n">{s.n}</div>
                <h3 className="l-step-title">{s.title}</h3>
                <p className="l-step-desc">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Why us ──────────────────────────────────── */}
      <section className="l-section">
        <div className="l-inner">
          <div className="l-section-label">Why Us</div>
          <h2 className="l-h2">Why SunPower Solutions</h2>
          <p className="l-sub">What sets us apart from the competition</p>
          <div className="l-features-grid">
            {[
              { title:'KSEB & MNRE Certified',   desc:'All installations are certified for grid connection and eligible for government subsidies.' },
              { title:'Tier-1 Equipment',         desc:'Waaree panels, Growatt inverters, Luminous batteries — sourced from verified manufacturers.' },
              { title:'Custom-Tailored Design',   desc:'Every system is designed for your specific roof, energy consumption and budget.' },
              { title:'End-to-End Execution',     desc:'One team handles everything — no subcontracting, no gaps, full accountability.' },
              { title:'20-Year Warranty',         desc:'Panel and inverter warranties auto-activated on dispatch. No paperwork from your side.' },
              { title:'Transparent Pricing',      desc:'Itemised bill of materials with live prices. What you see in the quote is what you pay.' },
            ].map((f) => (
              <div key={f.title} className="l-feature-card">
                <h3 className="l-feature-card-title">{f.title}</h3>
                <p className="l-feature-card-desc">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Contact ─────────────────────────────────── */}
      <section className="l-section l-section-gray" id="contact">
        <div className="l-inner l-contact-grid">
          {/* Left: form */}
          <div className="l-contact-form-col">
            <div className="l-section-label">Get In Touch</div>
            <h2 className="l-h2">Request a Free Consultation</h2>
            <p className="l-sub" style={{ marginBottom: 28 }}>
              Tell us about your energy needs and we'll get back to you within 24 hours.
            </p>
            {sent ? (
              <div className="l-contact-success">
                Thank you! We've received your request and will contact you within 24 hours.
              </div>
            ) : (
              <form className="l-contact-form" onSubmit={handleSubmit}>
                <div className="l-cform-row">
                  <div className="l-cform-group">
                    <label>Full Name *</label>
                    <input name="name" value={form.name} onChange={handleForm} required placeholder="Your name"/>
                  </div>
                  <div className="l-cform-group">
                    <label>Phone *</label>
                    <input name="phone" value={form.phone} onChange={handleForm} required placeholder="+91 XXXXX XXXXX"/>
                  </div>
                </div>
                <div className="l-cform-group">
                  <label>Email</label>
                  <input name="email" type="email" value={form.email} onChange={handleForm} placeholder="your@email.com"/>
                </div>
                <div className="l-cform-group">
                  <label>Message</label>
                  <textarea name="message" value={form.message} onChange={handleForm} rows={4}
                    placeholder="Tell us your monthly electricity bill, roof size, system type preference…"/>
                </div>
                <button type="submit" className="lbtn lbtn-dark" style={{ width:'100%', padding:'13px' }}>
                  Send Request
                </button>
              </form>
            )}
          </div>
          {/* Right: contact info */}
          <div className="l-contact-info-col">
            <div className="l-contact-info-card">
              <h3 className="l-contact-info-title">Contact Information</h3>
              <div className="l-contact-items">
                <div className="l-contact-item">
                  <div className="l-ci-icon">📞</div>
                  <div>
                    <div className="l-ci-label">Phone</div>
                    <div className="l-ci-value">+91 98765 43210</div>
                    <div className="l-ci-value">+91 98765 43211</div>
                  </div>
                </div>
                <div className="l-contact-item">
                  <div className="l-ci-icon">✉️</div>
                  <div>
                    <div className="l-ci-label">Email</div>
                    <div className="l-ci-value">info@sunpowersolutions.in</div>
                    <div className="l-ci-value">sales@sunpowersolutions.in</div>
                  </div>
                </div>
                <div className="l-contact-item">
                  <div className="l-ci-icon">📍</div>
                  <div>
                    <div className="l-ci-label">Office</div>
                    <div className="l-ci-value">12, Solar Avenue, Tech Park</div>
                    <div className="l-ci-value">Kochi, Kerala — 682 030</div>
                  </div>
                </div>
                <div className="l-contact-item">
                  <div className="l-ci-icon">⏰</div>
                  <div>
                    <div className="l-ci-label">Working Hours</div>
                    <div className="l-ci-value">Monday – Saturday</div>
                    <div className="l-ci-value">9:00 AM – 6:00 PM</div>
                  </div>
                </div>
              </div>
            </div>
            <div className="l-contact-note">
              We serve across all of Kerala and major cities in Tamil Nadu, Karnataka, and Andhra Pradesh. On-site assessments are free of charge.
            </div>
          </div>
        </div>
      </section>

      {/* ── CTA banner ──────────────────────────────── */}
      <section className="l-cta">
        <h2 className="l-h2" style={{ color:'#fff' }}>Switch to Solar Today</h2>
        <p className="l-cta-sub">
          Cut your electricity bill by up to 90%. Get a free site assessment with no obligation.
        </p>
        <button className="lbtn lbtn-white lbtn-lg" onClick={onGetStarted}>Get Started — It's Free</button>
      </section>

      {/* ── Footer ──────────────────────────────────── */}
      <footer className="l-footer-full">
        <div className="l-footer-grid">
          <div className="l-footer-col">
            <div className="landing-logo" style={{ marginBottom: 12 }}>SunPower Solutions</div>
            <p className="l-footer-about">
              An EPC solar company delivering end-to-end solar power solutions for homes, offices and industries across India.
            </p>
            <div className="l-footer-social">
              <a href="#" className="l-social-btn">FB</a>
              <a href="#" className="l-social-btn">IG</a>
              <a href="#" className="l-social-btn">LI</a>
              <a href="#" className="l-social-btn">YT</a>
            </div>
          </div>
          <div className="l-footer-col">
            <h4 className="l-footer-heading">Services</h4>
            <ul className="l-footer-links">
              <li>Site Assessment</li>
              <li>Engineering & Design</li>
              <li>Equipment Procurement</li>
              <li>Installation</li>
              <li>Commissioning</li>
              <li>Operations & Maintenance</li>
            </ul>
          </div>
          <div className="l-footer-col">
            <h4 className="l-footer-heading">Systems</h4>
            <ul className="l-footer-links">
              <li>On-Grid Solar System</li>
              <li>Off-Grid Solar System</li>
              <li>Hybrid Solar System</li>
              <li>Commercial Rooftop</li>
              <li>Industrial Solar</li>
            </ul>
          </div>
          <div className="l-footer-col">
            <h4 className="l-footer-heading">Contact</h4>
            <ul className="l-footer-links">
              <li>+91 98765 43210</li>
              <li>info@sunpowersolutions.in</li>
              <li>12, Solar Avenue, Kochi</li>
              <li>Kerala — 682 030</li>
              <li style={{ marginTop: 8, color: '#71717a', fontSize: '0.8rem' }}>Mon–Sat, 9am–6pm</li>
            </ul>
          </div>
        </div>
        <div className="l-footer-bottom">
          <span>© 2026 SunPower Solutions. All rights reserved.</span>
          <span>KSEB Certified · MNRE Approved · Tier-1 Equipment</span>
        </div>
      </footer>

    </div>
  );
}
