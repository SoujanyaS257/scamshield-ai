/**
 * InputTabs.jsx — Multi-mode input component
 *
 * Handles all 4 input types:
 *   text  → Paste SMS or email text
 *   url   → Paste a suspicious URL
 *   image → Upload a screenshot
 *   voice → Speak the message
 *
 * HOW IT CONNECTS TO THE REST OF THE APP:
 *   Parent (HomePage) passes: onAnalyze, loading
 *   When user clicks Analyze, we call:
 *     onAnalyze({ type: 'text', data: 'the text' })
 *     onAnalyze({ type: 'url',  data: 'the url'  })
 *     onAnalyze({ type: 'image', data: File })
 *     onAnalyze({ type: 'voice', data: 'transcript' })
 *   HomePage then calls the correct api.js function.
 *
 * WHY THIS PATTERN?
 *   InputTabs doesn't know about axios or the backend.
 *   It just collects input and passes it up.
 *   This makes each component independently testable.
 */

import { useState, useRef, useCallback } from 'react'
import { useDropzone }                   from 'react-dropzone'

// ── Tab definitions ───────────────────────────────────────────
const TABS = [
  {
    id:          'text',
    label:       'Text / SMS',
    mobileLabel: 'Text',
    icon:        '📝',
    placeholder: 'Paste suspicious SMS or email here...',
    hint:        'Works with SMS, WhatsApp messages, emails',
  },
  {
    id:          'url',
    label:       'URL',
    mobileLabel: 'URL',
    icon:        '🔗',
    placeholder: 'Paste suspicious URL here...',
    hint:        'Works with any web link',
  },
  {
    id:          'image',
    label:       'Screenshot',
    mobileLabel: 'Image',
    icon:        '🖼️',
    placeholder: '',
    hint:        'Upload screenshot of suspicious message',
  },
  {
    id:          'voice',
    label:       'Voice',
    mobileLabel: 'Voice',
    icon:        '🎤',
    placeholder: '',
    hint:        'Speak the suspicious message aloud',
  },
]

// ── Example scam inputs for quick testing ─────────────────────
const EXAMPLES = {
  text: [
    'URGENT: Your SBI account blocked! Verify OTP now: http://sbi-kyc.xyz',
    'Congratulations! You won Rs 50,000 in KBC Lucky Draw. Call 9876543210',
    'Your Amazon order #12345 has been shipped. Delivery by Jan 20.',
  ],
  url: [
    'http://sbi-secure-verify.xyz/login',
    'http://paytm-kyc-update.tk/verify',
    'https://www.sbi.co.in/web/personal-banking',
  ],
}


// ════════════════════════════════════════════════════════════════
// SUB-COMPONENTS — one per tab
// ════════════════════════════════════════════════════════════════

// ── Text Input Tab ────────────────────────────────────────────
function TextInput({ onSubmit, loading }) {
  const [value, setValue] = useState('')
  const MAX_CHARS = 5000

  const handleSubmit = () => {
    if (value.trim() && !loading) onSubmit(value.trim())
  }

  return (
    <div className="space-y-4">

      {/* Main textarea */}
      <textarea
        value={value}
        onChange={(e) => setValue(e.target.value.slice(0, MAX_CHARS))}
        placeholder={`Paste suspicious SMS, WhatsApp message, or email here...\n\nExample:\n"URGENT: Your SBI account will be blocked! Click http://sbi-verify.xyz to verify OTP now!"`}
        rows={6}
        disabled={loading}
        className="input-field resize-none text-sm leading-relaxed"
        onKeyDown={(e) => {
          // Ctrl+Enter submits
          if (e.key === 'Enter' && e.ctrlKey) handleSubmit()
        }}
      />

      {/* Bottom row: char count + examples + submit */}
      <div className="flex flex-wrap items-center justify-between gap-3">

        {/* Character counter */}
        <span className={`text-xs ${
          value.length > MAX_CHARS * 0.9
            ? 'text-orange-500'
            : 'text-gray-400'
        }`}>
          {value.length} / {MAX_CHARS}
        </span>

        {/* Right side: clear + submit */}
        <div className="flex items-center gap-2">
          {value && (
            <button
              onClick={() => setValue('')}
              className="px-3 py-2 text-sm text-gray-400
                         hover:text-red-500 transition-colors"
            >
              Clear
            </button>
          )}
          <button
            onClick={handleSubmit}
            disabled={!value.trim() || loading}
            className="btn-primary flex items-center gap-2 text-sm"
          >
            {loading
              ? <><span className="animate-spin inline-block">⚙️</span> Analyzing...</>
              : <><span>🔍</span> Analyze</>
            }
          </button>
        </div>
      </div>

      {/* Quick example buttons */}
      <div className="space-y-2">
        <p className="text-xs text-gray-400 font-medium">
          Quick examples:
        </p>
        <div className="flex flex-col gap-1.5">
          {EXAMPLES.text.map((ex, i) => (
            <button
              key={i}
              onClick={() => setValue(ex)}
              className="text-left text-xs px-3 py-2 rounded-lg
                         bg-gray-100 dark:bg-gray-700
                         text-gray-600 dark:text-gray-300
                         hover:bg-indigo-50 dark:hover:bg-indigo-900/30
                         hover:text-indigo-700 dark:hover:text-indigo-300
                         transition-colors duration-150
                         truncate"
            >
              {i === 2 ? '✅' : '🚨'} {ex}
            </button>
          ))}
        </div>
      </div>

    </div>
  )
}


// ── URL Input Tab ─────────────────────────────────────────────
function URLInput({ onSubmit, loading }) {
  const [value, setValue] = useState('')

  const handleSubmit = () => {
    if (value.trim() && !loading) onSubmit(value.trim())
  }

  return (
    <div className="space-y-4">

      {/* URL input field */}
      <div className="relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2
                         text-gray-400 text-sm select-none">
          🔗
        </span>
        <input
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="https://example.com/suspicious-link"
          disabled={loading}
          className="input-field pl-9 font-mono text-sm"
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleSubmit()
          }}
        />
      </div>

      {/* What we check info box */}
      <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-xl
                      border border-blue-200 dark:border-blue-800">
        <p className="text-xs font-semibold text-blue-700
                      dark:text-blue-300 mb-1.5">
          🔍 What we analyze in URLs:
        </p>
        <div className="grid grid-cols-2 gap-x-4 gap-y-1">
          {[
            'Domain legitimacy',
            'HTTPS vs HTTP',
            'Suspicious TLDs (.xyz .tk)',
            'IP address as domain',
            'Brand impersonation',
            'Urgency words in URL',
            'Excessive subdomains',
            'URL shorteners',
          ].map(item => (
            <span key={item}
                  className="text-xs text-blue-600 dark:text-blue-400
                             flex items-center gap-1">
              <span className="text-blue-400">·</span> {item}
            </span>
          ))}
        </div>
      </div>

      {/* Submit + examples */}
      <div className="flex flex-wrap items-center justify-between gap-3">

        {/* Example URLs */}
        <div className="flex flex-wrap gap-1.5">
          {EXAMPLES.url.map((url, i) => (
            <button
              key={i}
              onClick={() => setValue(url)}
              className="text-xs px-2.5 py-1 rounded-lg
                         bg-gray-100 dark:bg-gray-700
                         text-gray-500 dark:text-gray-400
                         hover:bg-indigo-50 dark:hover:bg-indigo-900/30
                         hover:text-indigo-600 dark:hover:text-indigo-300
                         transition-colors font-mono truncate max-w-[200px]"
            >
              {i < 2 ? '🚨' : '✅'} {url.replace('https://', '').replace('http://', '')}
            </button>
          ))}
        </div>

        <button
          onClick={handleSubmit}
          disabled={!value.trim() || loading}
          className="btn-primary flex items-center gap-2 text-sm"
        >
          {loading
            ? <><span className="animate-spin inline-block">⚙️</span> Checking...</>
            : <><span>🔍</span> Check URL</>
          }
        </button>
      </div>

    </div>
  )
}


// ── Image Drop Tab ────────────────────────────────────────────
function ImageInput({ onSubmit, loading }) {
  const [preview,  setPreview]  = useState(null)   // object URL for img tag
  const [file,     setFile]     = useState(null)   // actual File object
  const [fileInfo, setFileInfo] = useState(null)   // name + size string

  // Called by react-dropzone when user drops or selects a file
  const onDrop = useCallback((acceptedFiles) => {
    if (acceptedFiles.length === 0) return

    const f = acceptedFiles[0]

    // Revoke old preview URL to prevent memory leak
    if (preview) URL.revokeObjectURL(preview)

    setFile(f)
    setPreview(URL.createObjectURL(f))
    setFileInfo(`${f.name} — ${(f.size / 1024).toFixed(1)} KB`)
  }, [preview])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    // Only accept image files
    accept: {
      'image/jpeg': ['.jpg', '.jpeg'],
      'image/png':  ['.png'],
      'image/webp': ['.webp'],
    },
    maxFiles: 1,
    disabled: loading,
  })

  const handleRemove = () => {
    if (preview) URL.revokeObjectURL(preview)
    setFile(null)
    setPreview(null)
    setFileInfo(null)
  }

  return (
    <div className="space-y-4">

      {/* Drop zone */}
      <div
        {...getRootProps()}
        className={`
          relative border-2 border-dashed rounded-2xl
          p-8 text-center cursor-pointer
          transition-all duration-200
          ${isDragActive
            ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20 scale-[1.01]'
            : 'border-gray-300 dark:border-gray-600 hover:border-indigo-400 hover:bg-gray-50 dark:hover:bg-gray-800/50'
          }
          ${loading ? 'opacity-60 cursor-not-allowed pointer-events-none' : ''}
        `}
      >
        <input {...getInputProps()} />

        {preview ? (
          /* Show image preview when file is selected */
          <div className="space-y-3">
            <img
              src={preview}
              alt="Selected screenshot"
              className="max-h-52 mx-auto rounded-xl object-contain
                         shadow-md"
            />
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {fileInfo}
            </p>
            <p className="text-xs text-indigo-500">
              Click or drag to replace
            </p>
          </div>
        ) : (
          /* Empty drop zone */
          <div className="space-y-3">
            <div className="text-5xl">
              {isDragActive ? '📂' : '🖼️'}
            </div>
            <div>
              <p className="font-semibold text-gray-700
                            dark:text-gray-300">
                {isDragActive
                  ? 'Drop the screenshot here!'
                  : 'Drag & drop screenshot here'
                }
              </p>
              <p className="text-sm text-gray-400 mt-1">
                or <span className="text-indigo-500 font-medium">
                  click to browse
                </span>
              </p>
            </div>
            <p className="text-xs text-gray-400">
              PNG, JPG, WebP — max 10 MB
            </p>
          </div>
        )}
      </div>

      {/* How OCR works — info box */}
      {!preview && (
        <div className="p-3 bg-purple-50 dark:bg-purple-900/20
                        rounded-xl border border-purple-200
                        dark:border-purple-800">
          <p className="text-xs font-semibold text-purple-700
                        dark:text-purple-300 mb-1">
            🤖 How screenshot analysis works:
          </p>
          <p className="text-xs text-purple-600 dark:text-purple-400
                        leading-relaxed">
            Our AI extracts text from your screenshot using OCR
            (EasyOCR), then analyzes the extracted text for scam
            patterns. Works with SMS screenshots, WhatsApp forwards,
            and email screenshots.
          </p>
        </div>
      )}

      {/* Action buttons — shown after file selected */}
      {file && (
        <div className="flex items-center justify-between gap-3">
          <button
            onClick={handleRemove}
            className="px-4 py-2 text-sm text-gray-400
                       hover:text-red-500 transition-colors
                       flex items-center gap-1.5"
          >
            <span>🗑️</span> Remove
          </button>
          <button
            onClick={() => onSubmit(file)}
            disabled={loading}
            className="btn-primary flex items-center gap-2 text-sm"
          >
            {loading
              ? <><span className="animate-spin inline-block">⚙️</span> Scanning...</>
              : <><span>🔍</span> Scan Image</>
            }
          </button>
        </div>
      )}

    </div>
  )
}


// ── Voice Input Tab ───────────────────────────────────────────
function VoiceInput({ onSubmit, loading }) {
  const [recording,    setRecording]    = useState(false)
  const [transcript,   setTranscript]   = useState('')
  const [interimText,  setInterimText]  = useState('')
  const [supported,    setSupported]    = useState(true)
  const [error,        setError]        = useState(null)
  const recognitionRef = useRef(null)

  const startRecording = () => {
    // Check browser support for Web Speech API
    const SpeechRecognition =
      window.SpeechRecognition ||
      window.webkitSpeechRecognition

    if (!SpeechRecognition) {
      setSupported(false)
      return
    }

    setError(null)
    setTranscript('')
    setInterimText('')

    const recognition          = new SpeechRecognition()
    recognition.lang           = 'en-IN'  // Indian English accent
    recognition.interimResults = true     // Show partial results while speaking
    recognition.maxAlternatives = 1
    recognition.continuous     = false    // Stop after pause

    recognition.onresult = (event) => {
      let interim = ''
      let final   = ''

      // Loop through all results
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const text = event.results[i][0].transcript
        if (event.results[i].isFinal) {
          final += text
        } else {
          interim += text
        }
      }

      if (final)   setTranscript(prev => prev + ' ' + final)
      if (interim) setInterimText(interim)
    }

    recognition.onend = () => {
      setRecording(false)
      setInterimText('')
    }

    recognition.onerror = (e) => {
      setRecording(false)
      setInterimText('')
      if (e.error === 'no-speech') {
        setError('No speech detected. Please try again.')
      } else if (e.error === 'not-allowed') {
        setError('Microphone access denied. Please allow microphone in browser settings.')
      } else {
        setError(`Error: ${e.error}. Please try again.`)
      }
    }

    recognitionRef.current = recognition
    recognition.start()
    setRecording(true)
  }

  const stopRecording = () => {
    recognitionRef.current?.stop()
    setRecording(false)
  }

  const handleClear = () => {
    setTranscript('')
    setInterimText('')
    setError(null)
  }

  // Browser doesn't support Web Speech API
  if (!supported) {
    return (
      <div className="space-y-4 text-center py-6">
        <p className="text-5xl">😔</p>
        <div className="space-y-2">
          <p className="font-semibold text-gray-700 dark:text-gray-300">
            Voice input not supported in this browser
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Please use <strong>Google Chrome</strong> or{' '}
            <strong>Microsoft Edge</strong> for voice input.
          </p>
        </div>
        <p className="text-sm text-gray-400">
          Alternatively, type the message in the{' '}
          <span className="text-indigo-500 font-medium">Text tab</span>
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4">

      {/* Record button + status */}
      <div className="flex flex-col items-center gap-4 py-4">

        {/* Big record button */}
        <button
          onClick={recording ? stopRecording : startRecording}
          disabled={loading}
          className={`
            w-24 h-24 rounded-full text-4xl
            transition-all duration-200 shadow-lg
            focus:outline-none focus:ring-4
            disabled:opacity-50 disabled:cursor-not-allowed
            ${recording
              ? 'bg-red-500 hover:bg-red-600 animate-pulse scale-110 focus:ring-red-300'
              : 'bg-indigo-600 hover:bg-indigo-700 hover:scale-105 focus:ring-indigo-300'
            }
          `}
          title={recording ? 'Click to stop recording' : 'Click to start recording'}
        >
          {recording ? '⏹️' : '🎤'}
        </button>

        {/* Status text */}
        <div className="text-center space-y-1">
          <p className={`text-sm font-semibold ${
            recording
              ? 'text-red-500 dark:text-red-400'
              : 'text-gray-500 dark:text-gray-400'
          }`}>
            {recording
              ? '🔴 Recording — speak now, click ⏹ to stop'
              : transcript
                ? '✅ Recording complete'
                : 'Click 🎤 to start recording'
            }
          </p>
          {!recording && !transcript && (
            <p className="text-xs text-gray-400">
              Speak the suspicious message clearly
            </p>
          )}
        </div>

        {/* Recording animation bars */}
        {recording && (
          <div className="flex items-end gap-1 h-8">
            {[0,1,2,3,4].map(i => (
              <div
                key={i}
                className="w-1.5 bg-red-400 rounded-full animate-bounce"
                style={{
                  animationDelay:    `${i * 0.1}s`,
                  animationDuration: '0.6s',
                  height: `${20 + Math.random() * 12}px`,
                }}
              />
            ))}
          </div>
        )}
      </div>

      {/* Error display */}
      {error && (
        <div className="p-3 bg-red-50 dark:bg-red-900/20 rounded-xl
                        border border-red-200 dark:border-red-700
                        text-sm text-red-600 dark:text-red-400">
          ⚠️ {error}
        </div>
      )}

      {/* Transcript display */}
      {(transcript || interimText) && (
        <div className="p-4 bg-gray-50 dark:bg-gray-900/50 rounded-xl
                        border border-gray-200 dark:border-gray-700
                        space-y-2 min-h-[80px]">
          <p className="text-xs font-semibold text-gray-400 uppercase
                        tracking-wider">
            Transcribed text:
          </p>
          <p className="text-sm text-gray-800 dark:text-gray-200
                        leading-relaxed">
            {transcript}
            {/* Interim text shown in gray while still speaking */}
            {interimText && (
              <span className="text-gray-400 italic ml-1">
                {interimText}
              </span>
            )}
          </p>
        </div>
      )}

      {/* Action buttons */}
      {transcript && !recording && (
        <div className="flex items-center justify-between gap-3">
          <button
            onClick={handleClear}
            className="px-4 py-2 text-sm text-gray-400
                       hover:text-red-500 transition-colors
                       flex items-center gap-1.5"
          >
            <span>🗑️</span> Clear
          </button>
          <div className="flex gap-2">
            <button
              onClick={startRecording}
              className="px-4 py-2 text-sm rounded-xl font-medium
                         border-2 border-indigo-300 dark:border-indigo-700
                         text-indigo-600 dark:text-indigo-400
                         hover:bg-indigo-50 dark:hover:bg-indigo-900/30
                         transition-colors"
            >
              🎤 Re-record
            </button>
            <button
              onClick={() => onSubmit(transcript.trim())}
              disabled={loading}
              className="btn-primary flex items-center gap-2 text-sm"
            >
              {loading
                ? <><span className="animate-spin inline-block">⚙️</span> Analyzing...</>
                : <><span>🔍</span> Analyze</>
              }
            </button>
          </div>
        </div>
      )}

      {/* Tips */}
      {!recording && !transcript && (
        <div className="p-3 bg-gray-50 dark:bg-gray-800/50 rounded-xl
                        border border-gray-200 dark:border-gray-700">
          <p className="text-xs font-semibold text-gray-500
                        dark:text-gray-400 mb-1.5">
            💡 Tips for best results:
          </p>
          <ul className="space-y-1">
            {[
              'Speak clearly and at normal speed',
              'Works in English and Hindi',
              'Read out the suspicious message word by word',
              'Chrome and Edge work best for voice',
            ].map(tip => (
              <li key={tip}
                  className="text-xs text-gray-500 dark:text-gray-400
                             flex items-start gap-1.5">
                <span className="text-indigo-400 shrink-0">·</span>
                {tip}
              </li>
            ))}
          </ul>
        </div>
      )}

    </div>
  )
}


// ════════════════════════════════════════════════════════════════
// MAIN COMPONENT — exported and used by HomePage
// ════════════════════════════════════════════════════════════════

export default function InputTabs({ onAnalyze, loading }) {
  const [activeTab, setActiveTab] = useState('text')

  // Called by each sub-component when user clicks Analyze
  // Packages the data with its type and passes to parent
  const handleSubmit = (data) => {
    if (loading) return
    onAnalyze({ type: activeTab, data })
  }

  return (
    <div className="card overflow-hidden">

      {/* ── Tab header bar ───────────────────────────────── */}
      <div className="flex border-b border-gray-200 dark:border-gray-700
                      bg-gray-50 dark:bg-gray-800/50">
        {TABS.map((tab) => {
          const isActive = activeTab === tab.id
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`
                flex-1 flex flex-col sm:flex-row
                items-center justify-center gap-1 sm:gap-2
                py-3.5 px-2
                text-xs sm:text-sm font-medium
                border-b-2 transition-all duration-150
                focus:outline-none
                ${isActive
                  ? 'border-indigo-600 text-indigo-700 dark:text-indigo-300 bg-white dark:bg-gray-800'
                  : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-white/50 dark:hover:bg-gray-800/30'
                }
              `}
              title={tab.hint}
            >
              <span className="text-lg sm:text-base leading-none">
                {tab.icon}
              </span>
              {/* Full label on desktop, short on mobile */}
              <span className="hidden sm:inline">{tab.label}</span>
              <span className="sm:hidden">{tab.mobileLabel}</span>
            </button>
          )
        })}
      </div>

      {/* ── Active tab hint ──────────────────────────────── */}
      <div className="px-6 pt-4 pb-0">
        <p className="text-xs text-gray-400 dark:text-gray-500 italic">
          {TABS.find(t => t.id === activeTab)?.hint}
        </p>
      </div>

      {/* ── Tab content area ─────────────────────────────── */}
      <div className="p-6">
        {activeTab === 'text' && (
          <TextInput onSubmit={handleSubmit} loading={loading} />
        )}
        {activeTab === 'url' && (
          <URLInput onSubmit={handleSubmit} loading={loading} />
        )}
        {activeTab === 'image' && (
          <ImageInput onSubmit={handleSubmit} loading={loading} />
        )}
        {activeTab === 'voice' && (
          <VoiceInput onSubmit={handleSubmit} loading={loading} />
        )}
      </div>

    </div>
  )
}