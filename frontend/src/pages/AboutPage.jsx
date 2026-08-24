/**
 * AboutPage.jsx — Project info, tech stack, how it works
 */

const TECH_STACK = [
  {
    category: 'ML / AI',
    emoji:    '🤖',
    items: [
      { name: 'DistilBERT',   desc: 'Context-aware text classification' },
      { name: 'XGBoost',      desc: 'Gradient boosting for text + URLs'  },
      { name: 'SHAP',         desc: 'Word-level AI explainability'       },
      { name: 'EasyOCR',      desc: 'Screenshot text extraction'         },
      { name: 'Whisper',      desc: 'Voice-to-text transcription'        },
    ],
  },
  {
    category: 'Backend',
    emoji:    '⚙️',
    items: [
      { name: 'FastAPI',      desc: 'High-performance Python API'    },
      { name: 'SQLAlchemy',   desc: 'Database ORM'                   },
      { name: 'PostgreSQL',   desc: 'Production database'            },
      { name: 'Pydantic',     desc: 'Data validation'                },
    ],
  },
  {
    category: 'Frontend',
    emoji:    '🎨',
    items: [
      { name: 'React 18',     desc: 'Component-based UI'             },
      { name: 'Tailwind CSS', desc: 'Utility-first styling'          },
      { name: 'Recharts',     desc: 'Dashboard visualizations'       },
      { name: 'Framer Motion',desc: 'Smooth animations'              },
    ],
  },
  {
    category: 'DevOps',
    emoji:    '🚀',
    items: [
      { name: 'Docker',         desc: 'Containerization'             },
      { name: 'GitHub Actions', desc: 'CI/CD pipeline'               },
      { name: 'Railway',        desc: 'Backend deployment'           },
      { name: 'Vercel',         desc: 'Frontend deployment'          },
    ],
  },
]

const HOW_IT_WORKS = [
  {
    step: '01',
    title: 'You provide input',
    desc:  'Paste SMS, email, URL, screenshot, or speak the message',
    emoji: '📥',
  },
  {
    step: '02',
    title: 'AI analyzes it',
    desc:  'DistilBERT, XGBoost, and URL classifiers run simultaneously',
    emoji: '🤖',
  },
  {
    step: '03',
    title: 'Ensemble scoring',
    desc:  'All model outputs combine into a single 0-100 risk score',
    emoji: '📊',
  },
  {
    step: '04',
    title: 'SHAP explains WHY',
    desc:  'Word-level attribution shows exactly what triggered the alert',
    emoji: '🔍',
  },
  {
    step: '05',
    title: 'You get clear advice',
    desc:  'Specific steps to take based on the scam type detected',
    emoji: '💡',
  },
]

const SCAM_TYPES = [
  { emoji: '🔑', name: 'OTP Theft',       desc: 'Stealing one-time passwords'       },
  { emoji: '💸', name: 'UPI Fraud',        desc: 'PayTm, PhonePe, GPay scams'        },
  { emoji: '🎰', name: 'Lottery Scam',     desc: 'Fake prize and KBC scams'          },
  { emoji: '🎣', name: 'Phishing',         desc: 'Fake bank and service websites'    },
  { emoji: '🎭', name: 'Impersonation',    desc: 'Fake SBI, HDFC, Amazon messages'   },
  { emoji: '📋', name: 'Data Theft',       desc: 'Aadhaar, PAN card fraud'           },
]


export default function AboutPage() {
  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-12">

      {/* ── Hero ───────────────────────────────────────── */}
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-black text-gray-900
                       dark:text-white">
          About ScamShield AI
        </h1>
        <p className="text-gray-500 dark:text-gray-400
                      max-w-2xl mx-auto leading-relaxed">
          A multimodal, explainable AI system built to protect
          Indian users from SMS scams, phishing emails, UPI fraud,
          and fraudulent URLs. Built as a final-year AI/ML project.
        </p>
        <div className="flex flex-wrap justify-center gap-3">
          <a
            href="https://github.com/yourusername/scamshield-ai"
            target="_blank"
            rel="noopener noreferrer"
            className="btn-primary text-sm flex items-center gap-2"
          >
            ⭐ Star on GitHub
          </a>
          <a
            href="http://localhost:8000/docs"
            target="_blank"
            rel="noopener noreferrer"
            className="px-5 py-2.5 rounded-xl text-sm font-semibold
                       border-2 border-gray-300 dark:border-gray-600
                       text-gray-700 dark:text-gray-300
                       hover:border-indigo-400 transition-colors"
          >
            📖 API Docs
          </a>
        </div>
      </div>

      {/* ── How it works ────────────────────────────────── */}
      <div className="space-y-6">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white
                       text-center">
          How it works
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-5 gap-4">
          {HOW_IT_WORKS.map(({ step, title, desc, emoji }, idx) => (
            <div key={step} className="relative">
              {/* Connector line between steps */}
              {idx < HOW_IT_WORKS.length - 1 && (
                <div className="hidden sm:block absolute top-8
                                left-full w-full h-0.5
                                bg-gradient-to-r from-indigo-300
                                to-indigo-100 dark:from-indigo-700
                                dark:to-indigo-900 z-0" />
              )}
              <div className="card p-4 text-center space-y-2
                              relative z-10">
                <p className="text-3xl">{emoji}</p>
                <p className="text-xs font-black text-indigo-500
                              dark:text-indigo-400">
                  STEP {step}
                </p>
                <p className="text-sm font-bold text-gray-800
                              dark:text-white leading-tight">
                  {title}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400
                              leading-relaxed">
                  {desc}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Scam types we detect ────────────────────────── */}
      <div className="space-y-6">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white
                       text-center">
          Scam types we detect
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          {SCAM_TYPES.map(({ emoji, name, desc }) => (
            <div key={name} className="card p-4 space-y-2">
              <p className="text-3xl">{emoji}</p>
              <p className="font-semibold text-gray-800
                            dark:text-white text-sm">
                {name}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {desc}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* ── Tech stack ──────────────────────────────────── */}
      <div className="space-y-6">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white
                       text-center">
          Tech Stack
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2
                        lg:grid-cols-4 gap-4">
          {TECH_STACK.map(({ category, emoji, items }) => (
            <div key={category} className="card p-5 space-y-3">
              <div className="flex items-center gap-2">
                <span className="text-xl">{emoji}</span>
                <p className="font-bold text-gray-800
                              dark:text-white text-sm">
                  {category}
                </p>
              </div>
              <ul className="space-y-2">
                {items.map(({ name, desc }) => (
                  <li key={name} className="space-y-0.5">
                    <p className="text-xs font-semibold
                                  text-indigo-600 dark:text-indigo-400">
                      {name}
                    </p>
                    <p className="text-xs text-gray-500
                                  dark:text-gray-400">
                      {desc}
                    </p>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      {/* ── Emergency resources ─────────────────────────── */}
      <div className="card p-6 bg-red-50 dark:bg-red-900/10
                      border-2 border-red-200 dark:border-red-800
                      space-y-4">
        <h3 className="font-bold text-red-700 dark:text-red-300
                       flex items-center gap-2">
          <span>🚨</span>
          <span>Indian Cybercrime Resources</span>
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            { label: 'Helpline',      value: '1930',                    icon: '📞' },
            { label: 'Report Online', value: 'cybercrime.gov.in',        icon: '🌐' },
            { label: 'SMS Spam',      value: 'Forward to 7726',          icon: '📱' },
          ].map(({ label, value, icon }) => (
            <div key={label}
                 className="p-3 bg-white dark:bg-gray-800
                            rounded-xl text-center space-y-1">
              <p className="text-2xl">{icon}</p>
              <p className="text-xs font-bold text-gray-500
                            dark:text-gray-400 uppercase">
                {label}
              </p>
              <p className="text-sm font-bold text-red-700
                            dark:text-red-300">
                {value}
              </p>
            </div>
          ))}
        </div>
      </div>

    </div>
  )
}