import { useEffect, useState, type ReactNode } from 'react'
import {
  ArrowLeft,
  ArrowRight,
  Banknote,
  BookOpen,
  Box,
  CalendarDays,
  Camera,
  Check,
  ChevronDown,
  ChevronRight,
  CircleUserRound,
  Clock3,
  Copy,
  FileUp,
  GraduationCap,
  Hand,
  Headphones,
  Home,
  Image,
  Layers3,
  Menu,
  MessageCircle,
  Mic,
  MicOff,
  Minus,
  PackageCheck,
  Palette,
  Phone,
  Play,
  Plus,
  Radio,
  Search,
  ShieldCheck,
  ShoppingBag,
  ShoppingCart,
  Sparkles,
  Store,
  Users,
  Video,
  X,
} from 'lucide-react'

type Screen = 'home' | 'products' | 'design' | 'academy' | 'checkout' | 'live' | 'admin'

const heroImage =
  'https://images.unsplash.com/photo-1616429368325-d5d7542b0ec3?auto=format&fit=crop&w=1000&q=88'
const craftImage =
  'https://images.unsplash.com/photo-1643372672636-34d776a7e032?auto=format&fit=crop&w=900&q=85'
const coffeeImage =
  'https://images.unsplash.com/photo-1712402832925-d41c446883d3?auto=format&fit=crop&w=900&q=85'
const retailImage =
  'https://images.unsplash.com/photo-1637903921530-f1135c99b8d5?auto=format&fit=crop&w=900&q=85'
const bagImage =
  'https://images.unsplash.com/photo-1644015040594-8924d3ecc0dd?auto=format&fit=crop&w=900&q=85'

function Button({
  children,
  variant = 'primary',
  className = '',
  onClick,
  disabled = false,
}: {
  children: ReactNode
  variant?: 'primary' | 'outline' | 'ghost' | 'danger'
  className?: string
  onClick?: () => void
  disabled?: boolean
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={`button button-${variant} ${className}`}
    >
      {children}
    </button>
  )
}

function IconButton({
  label,
  children,
  onClick,
  active = false,
}: {
  label: string
  children: ReactNode
  onClick?: () => void
  active?: boolean
}) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      className={`icon-button ${active ? 'icon-button-active' : ''}`}
    >
      {children}
    </button>
  )
}

function Brand() {
  return (
    <div className="brand">
      <div className="brand-mark" aria-hidden="true">
        <span>አ</span>
      </div>
      <div className="brand-copy">
        <strong>Arenguade</strong>
        <span>Paper Product</span>
      </div>
    </div>
  )
}

function Header({
  language,
  onLanguage,
  onCart,
}: {
  language: 'EN' | 'አማ'
  onLanguage: () => void
  onCart: () => void
}) {
  return (
    <header className="topbar">
      <Brand />
      <div className="topbar-actions">
        <button type="button" className="language-toggle" onClick={onLanguage}>
          <span className={language === 'EN' ? 'active' : ''}>EN</span>
          <span className={language === 'አማ' ? 'active' : ''}>አማ</span>
        </button>
        <IconButton label="View cart" onClick={onCart}>
          <ShoppingBag size={20} strokeWidth={1.8} />
          <span className="cart-dot">2</span>
        </IconButton>
      </div>
    </header>
  )
}

function Eyebrow({ children }: { children: ReactNode }) {
  return <div className="eyebrow">{children}</div>
}

function SectionTitle({
  eyebrow,
  title,
  action,
}: {
  eyebrow?: string
  title: string
  action?: ReactNode
}) {
  return (
    <div className="section-heading">
      <div>
        {eyebrow && <Eyebrow>{eyebrow}</Eyebrow>}
        <h2>{title}</h2>
      </div>
      {action}
    </div>
  )
}

function BottomNav({
  screen,
  navigate,
}: {
  screen: Screen
  navigate: (screen: Screen) => void
}) {
  const items: Array<{ screen: Screen; label: string; icon: ReactNode }> = [
    { screen: 'home', label: 'Home', icon: <Home size={20} /> },
    { screen: 'products', label: 'Bags', icon: <ShoppingBag size={20} /> },
    { screen: 'design', label: 'Studio', icon: <Palette size={20} /> },
    { screen: 'academy', label: 'Academy', icon: <GraduationCap size={20} /> },
    { screen: 'admin', label: 'Portal', icon: <CircleUserRound size={20} /> },
  ]
  return (
    <nav className="bottom-nav" aria-label="Primary navigation">
      {items.map((item) => (
        <button
          type="button"
          key={item.screen}
          onClick={() => navigate(item.screen)}
          className={screen === item.screen ? 'active' : ''}
        >
          {item.icon}
          <span>{item.label}</span>
        </button>
      ))}
    </nav>
  )
}

function HomeScreen({ navigate }: { navigate: (screen: Screen) => void }) {
  return (
    <>
      <main className="page">
        <section className="hero">
          <div className="hero-visual">
            <img src={heroImage} alt="Unbleached kraft paper shopping bag in a warm studio setting" />
            <div className="craft-seal">
              <span>HANDCRAFTED</span>
              <strong>AA</strong>
              <span>ADDIS ABABA</span>
            </div>
            <div className="image-caption">
              <span className="status-dot" />
              Made to order in Addis
            </div>
          </div>
          <div className="hero-copy">
            <Eyebrow>Packaging with provenance</Eyebrow>
            <h1>Made by hand.<br />Built for your brand.</h1>
            <p>
              Biodegradable paper packaging, shaped by Ethiopian craft and engineered for modern
              retail.
            </p>
            <div className="hero-actions">
              <Button onClick={() => navigate('products')}>
                Explore catalog <ArrowRight size={18} />
              </Button>
              <Button variant="outline" onClick={() => navigate('academy')}>
                Book workshop
              </Button>
            </div>
          </div>
        </section>

        <div className="trust-strip hide-scrollbar">
          {[
            ['1.2M+', 'Bags produced'],
            ['50+', 'Enterprise clients'],
            ['100%', 'Recyclable'],
          ].map(([value, label]) => (
            <div className="trust-chip" key={label}>
              <strong>{value}</strong>
              <span>{label}</span>
            </div>
          ))}
        </div>

        <section className="section">
          <SectionTitle
            eyebrow="Selected work"
            title="Made for Ethiopia’s originals"
            action={
              <Button variant="ghost" onClick={() => navigate('products')} className="text-button">
                View all <ChevronRight size={17} />
              </Button>
            }
          />
          <div className="case-carousel hide-scrollbar">
            <article className="case-card">
              <img src={coffeeImage} alt="Premium coffee pouch and cup" />
              <div className="case-copy">
                <span>Specialty coffee</span>
                <h3>Rare Coffee Roasters</h3>
                <p>Valve-sealed pouches, screen printed in two earthy tones.</p>
              </div>
            </article>
            <article className="case-card">
              <img src={retailImage} alt="Premium paper shopping bags on a display plinth" />
              <div className="case-copy">
                <span>Luxury retail</span>
                <h3>Richo Boutique</h3>
                <p>Cotton handles and a Tibeb-inspired border for a tactile finish.</p>
              </div>
            </article>
          </div>
        </section>

        <section className="section process-section">
          <SectionTitle eyebrow="Our process" title="From your sketch to the street" />
          <div className="process-list">
            {[
              ['01', 'Share your vision', 'Choose a form, material and print finish.'],
              ['02', 'Prototype in Addis', 'Our makers test structure, ink and handle load.'],
              ['03', 'Approve & produce', 'Track your batch from press to delivery.'],
            ].map(([number, title, copy]) => (
              <article className="process-item" key={number}>
                <span>{number}</span>
                <div>
                  <h3>{title}</h3>
                  <p>{copy}</p>
                </div>
              </article>
            ))}
          </div>
          <Button onClick={() => navigate('design')} className="full-width">
            Start a custom project <ArrowRight size={18} />
          </Button>
        </section>

        <section className="academy-banner">
          <img src={craftImage} alt="Handmade Ethiopian pottery and artisan forms" />
          <div className="academy-overlay">
            <Eyebrow>Arenguade craft academy</Eyebrow>
            <h2>Learn the craft.<br />Build a livelihood.</h2>
            <p>Hands-on studio courses and live masterclasses led by working makers.</p>
            <Button variant="outline" onClick={() => navigate('academy')}>
              Explore classes <ArrowRight size={18} />
            </Button>
          </div>
        </section>
      </main>
      <footer className="mobile-footer">
        <Brand />
        <p>Responsibly made in Addis Ababa, Ethiopia.</p>
      </footer>
    </>
  )
}

const products = [
  {
    name: 'Heritage Boutique Tote',
    category: 'Shopping bags',
    spec: '240 GSM Kraft',
    price: 'from 46 ETB',
    image: retailImage,
  },
  {
    name: 'Roaster Gusset Pouch',
    category: 'Coffee',
    spec: 'Barrier Kraft',
    price: 'from 28 ETB',
    image: coffeeImage,
  },
  {
    name: 'Everyday Retail Carry',
    category: 'Shopping bags',
    spec: '180 GSM Kraft',
    price: 'from 22 ETB',
    image: heroImage,
  },
  {
    name: 'Fold-Lock Bakery Box',
    category: 'Food service',
    spec: '320 GSM Board',
    price: 'from 35 ETB',
    image: bagImage,
  },
]

function ProductsScreen({ navigate }: { navigate: (screen: Screen) => void }) {
  const [filter, setFilter] = useState('All')
  const [selected, setSelected] = useState<(typeof products)[0] | null>(null)
  const visible = filter === 'All' ? products : products.filter((product) => product.category === filter)
  return (
    <main className="page page-padded">
      <div className="page-intro">
        <Eyebrow>Custom manufacturing</Eyebrow>
        <h1>The packaging collection</h1>
        <p>Proven forms, ready to be made unmistakably yours.</p>
      </div>
      <div className="catalog-tools">
        <div className="filter-row hide-scrollbar">
          {['All', 'Shopping bags', 'Coffee', 'Food service'].map((item) => (
            <button
              type="button"
              className={`filter-chip ${filter === item ? 'active' : ''}`}
              key={item}
              onClick={() => setFilter(item)}
            >
              {item}
            </button>
          ))}
        </div>
        <IconButton label="Search products">
          <Search size={19} />
        </IconButton>
      </div>
      <div className="product-grid">
        {visible.map((product) => (
          <button type="button" className="product-card" key={product.name} onClick={() => setSelected(product)}>
            <div className="product-image">
              <img src={product.image} alt={product.name} />
              <span>{product.spec}</span>
            </div>
            <div className="product-copy">
              <span>{product.category}</span>
              <h3>{product.name}</h3>
              <div>
                <strong>{product.price}</strong>
                <ArrowRight size={18} />
              </div>
            </div>
          </button>
        ))}
      </div>
      <section className="custom-callout">
        <div className="callout-icon">
          <Sparkles size={22} />
        </div>
        <div>
          <span>Need a different form?</span>
          <h2>We engineer beyond the catalog.</h2>
          <p>Share your dimensions and our structural team will make a production-ready dieline.</p>
        </div>
        <Button onClick={() => navigate('design')} className="full-width">
          Open design studio <ArrowRight size={18} />
        </Button>
      </section>

      {selected && (
        <div className="sheet-backdrop" onClick={() => setSelected(null)}>
          <section className="bottom-sheet detail-sheet" onClick={(event) => event.stopPropagation()}>
            <div className="sheet-handle" />
            <div className="detail-image">
              <img src={selected.image} alt={selected.name} />
              <button type="button" aria-label="Close details" onClick={() => setSelected(null)}>
                <X size={20} />
              </button>
              <span><Image size={16} /> 1 / 3</span>
            </div>
            <Eyebrow>{selected.category}</Eyebrow>
            <h2>{selected.name}</h2>
            <p>
              A production-tested silhouette customized with your dimensions, colors, artwork and
              handle architecture.
            </p>
            <div className="case-notice">
              <ShieldCheck size={20} />
              <span><strong>Client case study.</strong> Final artwork shown belongs to its brand. Your batch is made uniquely for you.</span>
            </div>
            <div className="spec-grid">
              {[
                ['Material', selected.spec],
                ['Handle', 'Cotton rope'],
                ['Origin', 'Addis Ababa'],
                ['Minimum', '500 units'],
              ].map(([label, value]) => (
                <div key={label}><span>{label}</span><strong>{value}</strong></div>
              ))}
            </div>
            <div className="sheet-action">
              <div><span>500 unit batch</span><strong>23,000 ETB</strong></div>
              <Button onClick={() => navigate('design')}>Commission batch</Button>
            </div>
          </section>
        </div>
      )}
    </main>
  )
}

function BagSketch({ type = 'bag' }: { type?: 'bag' | 'pouch' | 'box' }) {
  if (type === 'box') {
    return <Box size={42} strokeWidth={1.25} />
  }
  return (
    <svg viewBox="0 0 72 64" aria-hidden="true">
      <path d={type === 'pouch' ? 'M17 12h38l5 46H12l5-46Z' : 'M14 21h44l-3 38H17l-3-38Z'} />
      <path d="M24 23c0-12 4-17 12-17s12 5 12 17" />
      {type === 'pouch' && <path d="M16 18h41" />}
    </svg>
  )
}

function DesignScreen({ navigate }: { navigate: (screen: Screen) => void }) {
  const [step, setStep] = useState(1)
  const [size, setSize] = useState('Medium Retail')
  const [handle, setHandle] = useState('Woven Cotton Rope')
  const [material, setMaterial] = useState('Natural kraft')
  const [uploaded, setUploaded] = useState(false)
  const selections = [
    ['Small Boutique', '18 × 8 × 22 cm', 'bag'],
    ['Medium Retail', '30 × 12 × 38 cm', 'bag'],
    ['Coffee Gusset', '500 g / valve', 'pouch'],
    ['Bakery Box', '28 × 20 × 10 cm', 'box'],
  ] as const
  return (
    <main className="page page-padded studio-page">
      <div className="page-intro compact">
        <Eyebrow>Custom design studio</Eyebrow>
        <h1>Build your packaging</h1>
        <p>Four simple decisions. A production-ready brief.</p>
      </div>
      <div className="stepper">
        {[1, 2, 3, 4].map((item) => (
          <button
            type="button"
            key={item}
            className={step === item ? 'active' : step > item ? 'complete' : ''}
            onClick={() => setStep(item)}
          >
            {step > item ? <Check size={15} /> : item}
          </button>
        ))}
        <span style={{ width: `${((step - 1) / 3) * 100}%` }} />
      </div>

      {step === 1 && (
        <section className="config-section">
          <span className="step-label">Step 1 of 4</span>
          <h2>Choose a starting size</h2>
          <p>We can refine every dimension after your quotation.</p>
          <div className="selection-grid">
            {selections.map(([title, detail, type]) => (
              <button
                type="button"
                key={title}
                className={`selection-card ${size === title ? 'active' : ''}`}
                onClick={() => setSize(title)}
              >
                <div className="sketch-wrap"><BagSketch type={type} /></div>
                <span>{title}</span>
                <small>{detail}</small>
                {size === title && <div className="selection-check"><Check size={14} /></div>}
              </button>
            ))}
          </div>
        </section>
      )}

      {step === 2 && (
        <section className="config-section">
          <span className="step-label">Step 2 of 4</span>
          <h2>Select handle architecture</h2>
          <p>Matched to the weight and feel of your product.</p>
          <div className="handle-list">
            {[
              ['Twisted Kraft Cord', 'Up to 8 kg', 'Natural, recyclable'],
              ['Woven Cotton Rope', 'Up to 12 kg', 'Soft premium feel'],
              ['Flat-Fold Handle', 'Up to 6 kg', 'Efficient & practical'],
              ['Satin Ribbon', 'Up to 5 kg', 'Luxury presentation'],
            ].map(([title, load, copy]) => (
              <button
                type="button"
                key={title}
                className={`handle-card ${handle === title ? 'active' : ''}`}
                onClick={() => setHandle(title)}
              >
                <div className="handle-illustration">
                  <span className={title.includes('Ribbon') ? 'ribbon' : title.includes('Flat') ? 'flat' : ''} />
                </div>
                <div><strong>{title}</strong><span>{copy}</span></div>
                <small>{load}</small>
                <div className="radio-mark">{handle === title && <span />}</div>
              </button>
            ))}
          </div>
        </section>
      )}

      {step === 3 && (
        <section className="config-section">
          <span className="step-label">Step 3 of 4</span>
          <h2>Paper & print finish</h2>
          <p>Materials selected for a tactile, responsible result.</p>
          <div className="option-group">
            <h3>Paper stock</h3>
            <div className="swatch-row">
              {[
                ['Natural kraft', 'kraft'],
                ['White coated', 'white'],
                ['Forest dyed', 'green'],
              ].map(([title, swatch]) => (
                <button
                  type="button"
                  key={title}
                  className={material === title ? 'active' : ''}
                  onClick={() => setMaterial(title)}
                >
                  <span className={`material-swatch ${swatch}`} />
                  <strong>{title}</strong>
                  <small>{title === 'Natural kraft' ? 'Unbleached' : title === 'White coated' ? 'FSC certified' : 'Custom stock'}</small>
                </button>
              ))}
            </div>
          </div>
          <div className="option-group">
            <h3>Print process</h3>
            <label className="radio-row">
              <input type="radio" name="print" defaultChecked />
              <span><strong>Soy screenprint</strong><small>Rich color, low environmental impact</small></span>
              <em>+ 6 ETB</em>
            </label>
            <label className="radio-row">
              <input type="radio" name="print" />
              <span><strong>Spot UV detail</strong><small>Gloss accent over matte paper</small></span>
              <em>+ 11 ETB</em>
            </label>
          </div>
        </section>
      )}

      {step === 4 && (
        <section className="config-section">
          <span className="step-label">Step 4 of 4</span>
          <h2>Add your artwork</h2>
          <p>Upload a logo, dieline or even a clear phone photo of your sketch.</p>
          <button type="button" className={`upload-zone ${uploaded ? 'uploaded' : ''}`} onClick={() => setUploaded(true)}>
            {uploaded ? <Check size={28} /> : <FileUp size={28} />}
            <strong>{uploaded ? 'arenguade_wordmark.pdf' : 'Tap to upload artwork'}</strong>
            <span>{uploaded ? '2.4 MB · Ready for review' : 'PDF, AI, PNG or JPG · up to 20 MB'}</span>
          </button>
          <Button variant="outline" className="full-width" onClick={() => setUploaded(true)}>
            <Camera size={18} /> Use phone camera
          </Button>
          <div className="review-card">
            <h3>Your production brief</h3>
            <dl>
              <div><dt>Format</dt><dd>{size}</dd></div>
              <div><dt>Handle</dt><dd>{handle}</dd></div>
              <div><dt>Material</dt><dd>{material}</dd></div>
              <div><dt>Quantity</dt><dd>1,000 units</dd></div>
            </dl>
          </div>
        </section>
      )}

      <div className="estimate-bar">
        <div>
          <span>Estimated unit price</span>
          <strong>{step === 4 ? '38.50' : '34.00'} ETB</strong>
          <small>1,000 units · 8% volume saving</small>
        </div>
        <Button onClick={() => (step < 4 ? setStep(step + 1) : navigate('checkout'))}>
          {step < 4 ? 'Continue' : 'Request quote'} <ArrowRight size={17} />
        </Button>
      </div>
    </main>
  )
}

function AcademyScreen({ navigate }: { navigate: (screen: Screen) => void }) {
  const [filter, setFilter] = useState('All')
  const [booking, setBooking] = useState<string | null>(null)
  const workshops = [
    { title: 'Paper Bag Making Foundations', type: 'In-Person Studio', date: 'Sat, 18 Apr', time: '9:00–15:00', teacher: 'Bethlehem Assefa', seats: '3 seats left', price: '1,850 ETB', image: heroImage },
    { title: 'Packaging Design for Coffee', type: 'Live Online', date: 'Wed, 22 Apr', time: '18:30–20:30', teacher: 'Mekdes Girma', seats: '8 seats left', price: '950 ETB', image: coffeeImage },
    { title: 'Structural Box Craft', type: 'In-Person Studio', date: 'Sat, 02 May', time: '10:00–16:00', teacher: 'Hana Kebede', seats: '5 seats left', price: '2,100 ETB', image: craftImage },
  ]
  const visible = filter === 'All' ? workshops : workshops.filter((item) => item.type === filter)
  return (
    <main className="page page-padded">
      <div className="page-intro">
        <Eyebrow>Arenguade craft academy</Eyebrow>
        <h1>Learn by making</h1>
        <p>Practical skills from working Ethiopian paper craft professionals.</p>
      </div>
      <div className="segmented">
        {['All', 'In-Person Studio', 'Live Online'].map((item) => (
          <button type="button" key={item} className={filter === item ? 'active' : ''} onClick={() => setFilter(item)}>
            {item === 'In-Person Studio' ? 'Studio' : item === 'Live Online' ? 'Online' : item}
          </button>
        ))}
      </div>
      <div className="workshop-list">
        {visible.map((workshop) => (
          <article className="workshop-card" key={workshop.title}>
            <div className="workshop-image">
              <img src={workshop.image} alt="" />
              <span>{workshop.type === 'Live Online' ? <Radio size={14} /> : <Store size={14} />} {workshop.type}</span>
            </div>
            <div className="workshop-copy">
              <div className="date-line"><CalendarDays size={16} /><strong>{workshop.date}</strong><span>·</span><Clock3 size={16} /><span>{workshop.time}</span></div>
              <h2>{workshop.title}</h2>
              <div className="instructor"><div>{workshop.teacher.split(' ').map((n) => n[0]).join('')}</div><span>Led by <strong>{workshop.teacher}</strong></span></div>
              <div className="workshop-meta">
                <div><span>Tuition</span><strong>{workshop.price}</strong></div>
                <span className="seats-badge">{workshop.seats}</span>
              </div>
              <Button className="full-width" onClick={() => setBooking(workshop.title)}>Book your seat</Button>
            </div>
          </article>
        ))}
      </div>
      <button type="button" className="live-preview" onClick={() => navigate('live')}>
        <div><Play size={21} fill="currentColor" /></div>
        <span><small>Preview the classroom</small><strong>See how live learning works</strong></span>
        <ChevronRight size={20} />
      </button>

      {booking && (
        <div className="sheet-backdrop" onClick={() => setBooking(null)}>
          <section className="bottom-sheet booking-sheet" onClick={(event) => event.stopPropagation()}>
            <div className="sheet-handle" />
            <div className="sheet-title-row">
              <div><Eyebrow>Reserve a seat</Eyebrow><h2>{booking}</h2></div>
              <IconButton label="Close booking" onClick={() => setBooking(null)}><X size={19} /></IconButton>
            </div>
            <label className="field"><span>Student name</span><input defaultValue="Liya Bekele" /></label>
            <label className="field"><span>Phone number</span><input defaultValue="+251 91 234 5678" /></label>
            <button type="button" className="mini-upload"><FileUp size={20} /><span><strong>Attach payment slip</strong><small>CBE, Telebirr or Awash receipt</small></span><Plus size={19} /></button>
            <Button className="full-width" onClick={() => navigate('checkout')}>Continue to payment <ArrowRight size={18} /></Button>
          </section>
        </div>
      )}
    </main>
  )
}

function CheckoutScreen({ navigate }: { navigate: (screen: Screen) => void }) {
  const [bank, setBank] = useState('CBE')
  const [copied, setCopied] = useState('')
  const [uploaded, setUploaded] = useState(false)
  const copy = (value: string) => {
    setCopied(value)
    window.setTimeout(() => setCopied(''), 1400)
  }
  return (
    <main className="page page-padded checkout-page">
      <button type="button" className="back-link" onClick={() => navigate('design')}><ArrowLeft size={18} /> Back to brief</button>
      <div className="page-intro compact">
        <Eyebrow>Secure settlement</Eyebrow>
        <h1>Complete your request</h1>
        <p>Transfer through your preferred Ethiopian bank, then attach the receipt.</p>
      </div>
      <details className="summary-card">
        <summary><span><PackageCheck size={20} /> Order summary</span><strong>38,500 ETB</strong><ChevronDown size={18} /></summary>
        <div><span>Custom medium retail bag × 1,000</span><strong>38,500 ETB</strong></div>
      </details>
      <section className="checkout-section">
        <span className="step-label">1 · Choose settlement account</span>
        <div className="bank-list">
          {[
            ['CBE', 'Commercial Bank of Ethiopia', '1000 2849 5731'],
            ['Telebirr', 'Telebirr Business', '0941 220 884'],
            ['Awash', 'Awash Bank', '0132 9088 7710'],
          ].map(([id, name, number]) => (
            <div
              role="radio"
              aria-checked={bank === id}
              tabIndex={0}
              className={`bank-card ${bank === id ? 'active' : ''}`}
              key={id}
              onClick={() => setBank(id)}
              onKeyDown={(event) => {
                if (event.key === 'Enter' || event.key === ' ') setBank(id)
              }}
            >
              <div className={`bank-logo bank-${id.toLowerCase()}`}>{id === 'Telebirr' ? 'T' : id[0]}</div>
              <div><strong>{name}</strong><span>{number}</span></div>
              <div className="radio-mark">{bank === id && <span />}</div>
              <button type="button" onClick={(event) => { event.stopPropagation(); copy(number) }} className="copy-account">
                {copied === number ? <Check size={15} /> : <Copy size={15} />} {copied === number ? 'Copied' : 'Copy'}
              </button>
            </div>
          ))}
        </div>
      </section>
      <section className="checkout-section">
        <span className="step-label">2 · Use this order reference</span>
        <div className="reference-card">
          <span>Payment reference</span>
          <strong>ARN-2026-0042</strong>
          <button type="button" onClick={() => copy('reference')}><Copy size={17} /> {copied === 'reference' ? 'Copied' : 'Copy code'}</button>
        </div>
        <p className="helper"><ShieldCheck size={16} /> Include this code in your bank transfer note so we can verify faster.</p>
      </section>
      <section className="checkout-section">
        <span className="step-label">3 · Attach transfer receipt</span>
        <button type="button" className={`receipt-upload ${uploaded ? 'uploaded' : ''}`} onClick={() => setUploaded(true)}>
          {uploaded ? <Check size={24} /> : <Camera size={24} />}
          <span><strong>{uploaded ? 'CBE_transfer_0042.jpg' : 'Upload or photograph receipt'}</strong><small>{uploaded ? '1.1 MB · Image ready' : 'JPG, PNG or PDF · Max 10 MB'}</small></span>
        </button>
      </section>
      <div className="secure-note"><ShieldCheck size={19} /><span><strong>Manually verified.</strong> Your order enters production only after our finance team confirms the transfer.</span></div>
      <Button className="full-width" onClick={() => navigate('admin')} disabled={!uploaded}>Submit for verification <ArrowRight size={18} /></Button>
    </main>
  )
}

function LiveScreen({ navigate }: { navigate: (screen: Screen) => void }) {
  const [tab, setTab] = useState<'chat' | 'materials'>('chat')
  const [mic, setMic] = useState(false)
  const [hand, setHand] = useState(false)
  return (
    <main className="live-page">
      <div className="live-video">
        <img src={craftImage} alt="Live instructor demonstration" />
        <div className="live-topbar">
          <IconButton label="Leave classroom" onClick={() => navigate('academy')}><ArrowLeft size={20} /></IconButton>
          <span className="live-pill"><span /> LIVE</span>
          <span className="viewer-pill"><Users size={14} /> 24</span>
        </div>
        <div className="instructor-label"><span>Instructor</span><strong>Bethlehem Assefa</strong></div>
      </div>
      <section className="interaction-panel">
        <div className="classroom-title"><div><span>Paper Bag Foundations</span><strong>Module 3 · Folding the base</strong></div><Headphones size={20} /></div>
        <div className="class-tabs">
          <button type="button" className={tab === 'chat' ? 'active' : ''} onClick={() => setTab('chat')}>Q&A <span>8</span></button>
          <button type="button" className={tab === 'materials' ? 'active' : ''} onClick={() => setTab('materials')}>Attendance & materials</button>
        </div>
        {tab === 'chat' ? (
          <div className="chat-zone">
            <div className="messages">
              <div className="message"><div>MA</div><p><strong>Mimi A.</strong><span>Should the corner folds meet exactly at the center line?</span></p><small>10:42</small></div>
              <div className="message teacher"><div>BA</div><p><strong>Bethlehem · Instructor</strong><span>Yes, exactly. I’ll hold mine closer to the camera so you can see.</span></p><small>10:43</small></div>
              <div className="message"><div>YK</div><p><strong>Yonas K.</strong><span>That helped, thank you.</span></p><small>10:43</small></div>
            </div>
            <label className="chat-input"><input placeholder="Ask the instructor…" /><button type="button"><ArrowRight size={18} /></button></label>
          </div>
        ) : (
          <div className="materials-zone">
            <div className="attendance"><Check size={20} /><span><strong>Attendance confirmed</strong><small>You joined at 10:01 EAT</small></span></div>
            <button type="button"><FileUp size={20} /><span><strong>Module 3 folding guide</strong><small>PDF · 2.8 MB</small></span><ChevronRight size={19} /></button>
            <button type="button"><FileUp size={20} /><span><strong>Standard retail dieline</strong><small>PDF · 1.6 MB</small></span><ChevronRight size={19} /></button>
          </div>
        )}
      </section>
      <div className="class-controls">
        <button type="button" className={!mic ? 'muted' : ''} onClick={() => setMic(!mic)}>{mic ? <Mic size={20} /> : <MicOff size={20} />}<span>{mic ? 'Mute' : 'Mic off'}</span></button>
        <button type="button"><Video size={20} /><span>Camera</span></button>
        <button type="button" className={hand ? 'hand-active' : ''} onClick={() => setHand(!hand)}><Hand size={20} /><span>{hand ? 'Raised' : 'Raise hand'}</span></button>
      </div>
    </main>
  )
}

function AdminScreen({ navigate }: { navigate: (screen: Screen) => void }) {
  const [tab, setTab] = useState<'payments' | 'orders'>('payments')
  const [review, setReview] = useState(false)
  const [approved, setApproved] = useState(false)
  return (
    <main className="page page-padded admin-page">
      <div className="admin-header">
        <div><Eyebrow>Executive portal</Eyebrow><h1>Good morning, Selam</h1></div>
        <button type="button" className="avatar">ST<span /></button>
      </div>
      <button type="button" className="attention-card">
        <div><span>Needs attention now</span><strong>4 pending payments</strong><small>Oldest waiting for 2h 18m</small></div>
        <div>4</div>
        <ChevronRight size={20} />
      </button>
      <div className="metrics-grid">
        <article><span>Today’s orders</span><strong>12</strong><small>+18% this week</small></article>
        <article><span>In production</span><strong>28</strong><small>6 due today</small></article>
      </div>
      <div className="admin-tabs">
        <button type="button" onClick={() => setTab('payments')} className={tab === 'payments' ? 'active' : ''}><Banknote size={18} /> Payments</button>
        <button type="button" onClick={() => setTab('orders')} className={tab === 'orders' ? 'active' : ''}><Layers3 size={18} /> Orders</button>
      </div>
      {tab === 'payments' ? (
        <section className="queue-section">
          <SectionTitle eyebrow="Verification queue" title="Pending settlements" action={<span className="queue-count">4</span>} />
          {approved && <div className="success-banner"><Check size={18} /><span>ARN-2026-0042 approved and moved to production.</span></div>}
          <article className="payment-card">
            <div className="payment-top"><div className="customer-avatar">LB</div><div><strong>Liya Bekele</strong><span className="mono">ARN-2026-0042</span></div><span className="pending-badge">Pending</span></div>
            <div className="payment-data"><div><span>Amount</span><strong>38,500 ETB</strong></div><div><span>Bank</span><strong>CBE</strong></div><div><span>Submitted</span><strong>12 min ago</strong></div></div>
            <button type="button" className="receipt-thumb" onClick={() => setReview(true)}><div><Banknote size={28} /></div><span><strong>Transfer receipt</strong><small>Tap to inspect full screen</small></span><ChevronRight size={18} /></button>
            <Button className="full-width" onClick={() => setReview(true)}>Review settlement <ArrowRight size={18} /></Button>
          </article>
          <article className="payment-card faded">
            <div className="payment-top"><div className="customer-avatar ochre">YA</div><div><strong>Yared Alemu</strong><span className="mono">ARN-2026-0039</span></div><span className="pending-badge">Pending</span></div>
            <div className="payment-data"><div><span>Amount</span><strong>16,800 ETB</strong></div><div><span>Bank</span><strong>Telebirr</strong></div></div>
          </article>
        </section>
      ) : (
        <section className="queue-section">
          <SectionTitle eyebrow="Factory floor" title="Orders pipeline" action={<span className="queue-count">28</span>} />
          {[
            ['Rare Coffee Roasters', 'ARN-2026-0036', 'In production', '2,500 coffee pouches'],
            ['Richo Boutique', 'ARN-2026-0031', 'Ready', '800 boutique totes'],
            ['Liya Bekele', 'ARN-2026-0042', 'New', '1,000 retail bags'],
          ].map(([name, code, status, item]) => (
            <article className="order-card" key={code}>
              <div><span className={`order-status ${status.toLowerCase().replace(' ', '-')}`}>{status}</span><span className="mono">{code}</span></div>
              <h3>{name}</h3><p>{item}</p>
              <div className="order-actions"><a href="tel:+251911234567"><Phone size={17} /> Call</a><Button variant="outline">Update status <ChevronDown size={16} /></Button></div>
            </article>
          ))}
        </section>
      )}
      <button type="button" className="admin-shortcut" onClick={() => navigate('checkout')}><ShoppingCart size={19} /><span>Preview customer checkout</span><ChevronRight size={19} /></button>
      {review && (
        <div className="review-viewer">
          <div className="viewer-header"><button type="button" onClick={() => setReview(false)}><X size={21} /></button><div><strong>Transfer receipt</strong><span className="mono">ARN-2026-0042</span></div><button type="button"><Minus size={18} /><Plus size={18} /></button></div>
          <div className="receipt-paper">
            <div className="receipt-bank"><span>CBE</span><strong>Commercial Bank of Ethiopia</strong></div>
            <p>Transfer confirmation</p>
            <dl><div><dt>Amount</dt><dd>38,500.00 ETB</dd></div><div><dt>Reference</dt><dd>ARN-2026-0042</dd></div><div><dt>From</dt><dd>Liya Bekele</dd></div><div><dt>Date</dt><dd>14 April 2026 · 08:43</dd></div></dl>
            <div className="receipt-check"><Check size={22} /></div>
          </div>
          <div className="review-actions"><Button variant="danger" onClick={() => setReview(false)}>Reject</Button><Button onClick={() => { setApproved(true); setReview(false) }}><Check size={18} /> Approve settlement</Button></div>
        </div>
      )}
    </main>
  )
}

export default function App() {
  const [screen, setScreen] = useState<Screen>('home')
  const [language, setLanguage] = useState<'EN' | 'አማ'>('EN')
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' })
  }, [screen])

  const navigate = (next: Screen) => {
    setScreen(next)
    setMenuOpen(false)
  }

  return (
    <div className={`app-shell ${screen === 'live' ? 'live-shell' : ''}`}>
      {screen !== 'live' && (
        <>
          <Header language={language} onLanguage={() => setLanguage(language === 'EN' ? 'አማ' : 'EN')} onCart={() => navigate('checkout')} />
          <button type="button" className="desktop-menu" onClick={() => setMenuOpen(!menuOpen)}><Menu size={20} /> Menu</button>
        </>
      )}
      {screen === 'home' && <HomeScreen navigate={navigate} />}
      {screen === 'products' && <ProductsScreen navigate={navigate} />}
      {screen === 'design' && <DesignScreen navigate={navigate} />}
      {screen === 'academy' && <AcademyScreen navigate={navigate} />}
      {screen === 'checkout' && <CheckoutScreen navigate={navigate} />}
      {screen === 'live' && <LiveScreen navigate={navigate} />}
      {screen === 'admin' && <AdminScreen navigate={navigate} />}
      {screen !== 'live' && <BottomNav screen={screen} navigate={navigate} />}
    </div>
  )
}
