import React, { useState, useEffect } from 'react';
import { 
  Users, UserPlus, HeartPulse, Microscope, Cpu, ShieldCheck, 
  ExternalLink, Github, Linkedin, Mail, Edit3, Trash2, Plus, 
  Check, X, Sparkles, Award, Layers, Terminal, Activity, Waves,
  Radio, Gauge, ShieldAlert, Wifi, Zap, CheckCircle2, ArrowRight, BookOpen
} from 'lucide-react';
import clsx from 'clsx';

interface TeamMember {
  id: string;
  name: string;
  role: string;
  specialization: string;
  bio: string;
  github?: string;
  linkedin?: string;
  email?: string;
  avatarColor: string;
}

const DEFAULT_MEMBERS: TeamMember[] = [
  {
    id: 'mem-1',
    name: 'Aman Nasim Khan',
    role: 'Team Lead & IoT Systems Architect',
    specialization: 'IoT Firmware, LoRa Protocols, Sensor Transducers & Hardware Integration',
    bio: 'Specializes in edge computing, embedded sensor networks, low-power telemetry protocols, and real-time geotechnical instrumentation systems.',
    github: 'https://github.com',
    linkedin: 'https://linkedin.com',
    email: 'amannasim@example.com',
    avatarColor: 'from-orange-500 to-rose-600',
  },
  {
    id: 'mem-2',
    name: 'Divyshreshth Vishwakarma',
    role: 'Full Stack & Machine Learning Lead',
    specialization: 'XGBoost Ensembles, Physics-Informed ML, SHAP Explainability & Time-Series Analytics',
    bio: 'Focused on developing gray-box hybrid models coupling limit equilibrium geotechnical mechanics with gradient boosted decision trees for real-time hazard forecasting.',
    github: 'https://github.com',
    linkedin: 'https://linkedin.com',
    email: 'divyshreshth@example.com',
    avatarColor: 'from-amber-500 to-orange-600',
  },
  {
    id: 'mem-3',
    name: 'Team Member 3',
    role: 'Full-Stack Systems & Cloud Architect',
    specialization: 'FastAPI Backend, SQLite WAL Ingestion, Real-Time WebSockets & React Control Room',
    bio: 'Designs high-concurrency offline-first edge software architectures, telemetry visualization dashboards, and mission control user interfaces.',
    github: 'https://github.com',
    linkedin: 'https://linkedin.com',
    email: 'member3@example.com',
    avatarColor: 'from-emerald-500 to-teal-600',
  },
  {
    id: 'mem-4',
    name: 'Team Member 4',
    role: 'Research Analyst & Geotechnical Specialist',
    specialization: 'Soil Mechanics, Slope Stability Verification & Sensor Calibration',
    bio: 'Directs physical laboratory simulation modeling, Bishop/Fellenius mathematical safety validation, and emergency response workflows.',
    github: 'https://github.com',
    linkedin: 'https://linkedin.com',
    email: 'member4@example.com',
    avatarColor: 'from-purple-500 to-indigo-600',
  },
];

const PREVIOUS_PROJECTS = [
  {
    id: 'proj-ecg',
    title: 'IoT-Enabled Real-Time ECG Monitoring & Arrhythmia Detection System',
    category: 'Biomedical Telemetry & Electrophysiology Signal Processing',
    icon: HeartPulse,
    color: 'from-rose-500/20 to-red-600/20 border-rose-500/40 text-rose-400',
    badgeColor: 'bg-rose-950/80 text-rose-300 border-rose-700/50',
    tag: 'BIOMEDICAL EMBEDDED',
    summary: 'A portable, low-power telemetry device for continuous multi-lead cardiac electrophysiology monitoring with automated edge arrhythmia classification.',
    highlights: [
      'Engineered analog front-end with AD8232 biopotential transducer & driven-right-leg (DRL) circuit for 50Hz/60Hz powerline noise suppression.',
      'Implemented Pan-Tompkins real-time QRS complex detection and Wavelet Transform (DWT) baseline wander removal directly on ESP32 microcontrollers.',
      'Built a high-precision live cardiac waveform streaming dashboard with automated tachycardia, bradycardia, and PVC event alerts.',
      'Bluetooth Low Energy (BLE) and Wi-Fi dual-link telemetry with offline local buffering during emergency transport.',
    ],
    stack: ['ESP32', 'AD8232 ECG Transducer', 'Pan-Tompkins Algorithm', 'FastAPI', 'WebSockets', 'React Recharts'],
    metrics: [
      { label: 'Sampling Rate', val: '250 Hz' },
      { label: 'QRS Detection Accuracy', val: '98.4%' },
      { label: 'Telemetry Latency', val: '< 15 ms' },
      { label: 'Battery Runtime', val: '18+ Hours' },
    ],
  },
  {
    id: 'proj-microplastics',
    title: 'AI & Optical Microplastics Detection & Spectroscopic Classification System',
    category: 'Environmental AI & Microscopic Computer Vision',
    icon: Microscope,
    color: 'from-cyan-500/20 to-teal-600/20 border-cyan-500/40 text-cyan-400',
    badgeColor: 'bg-cyan-950/80 text-cyan-300 border-cyan-700/50',
    tag: 'COMPUTER VISION & SPECTROSCOPY',
    summary: 'An automated microscopic imaging and deep learning pipeline for rapid identification, sizing, and polymer categorization of microplastics in aquatic environments.',
    highlights: [
      'Designed a multi-wavelength darkfield optical imaging chamber with motorized XYZ stage for automated focal stacking of microscopic water samples.',
      'Trained a high-accuracy convolutional neural network (U-Net + ResNet-50) for particle segmentation and morphological characterization (fibers, pellets, films, fragments).',
      'Developed spectroscopic feature extraction classifying key polymeric compositions including Polyethylene (PE), Polypropylene (PP), Polystyrene (PS), and PET.',
      'Automated particle count density calculation (particles/m³) and hazard index mapping for freshwater and marine ecological monitoring.',
    ],
    stack: ['PyTorch', 'OpenCV', 'Darkfield Microscopy', 'ResNet-50 / U-Net', 'Python', 'Spectroscopic Feature Analysis'],
    metrics: [
      { label: 'Classification Accuracy', val: '96.2%' },
      { label: 'Particle Sizing Range', val: '20µm – 5mm' },
      { label: 'Inference Speed', val: '45 ms / frame' },
      { label: 'Polymer Classes', val: '6 Major Types' },
    ],
  },
];

const ARCHITECTURE_PILLARS = [
  {
    title: '1. Multi-Transducer Edge Ingestion',
    desc: 'Corrosion-resistant Capacitive Soil Moisture V2.0, FC-37 Rain Gauge, and MPU6050 6-Axis IMU calculating 3D spatial dip (β) and angular creep velocity (Δβ/Δt).',
    icon: Radio,
    color: 'text-orange-400 border-orange-500/40 bg-orange-950/30',
  },
  {
    title: '2. 433MHz LoRa Binary Protocol',
    desc: '32-Byte packed binary telemetry frames with CCITT-16 CRC, monotonic sequence watermarking, and stop-and-wait ACK delivering ~12ms airtime efficiency.',
    icon: Wifi,
    color: 'text-rose-400 border-rose-500/40 bg-rose-950/30',
  },
  {
    title: '3. Geotechnical Infinite Slope Physics',
    desc: 'Computes real-time Bishop/Fellenius Factor of Safety (FoS) coupling dynamic pore-water pressure with effective shear strength parameters.',
    icon: Gauge,
    color: 'text-amber-400 border-amber-500/40 bg-amber-950/30',
  },
  {
    title: '4. XGBoost AI & Local TreeSHAP',
    desc: 'Gradient Boosted Decision Tree ensemble enforcing strict physical boundary conditions (FoS < 1.0 => Risk >= 75%) with transparent causal feature attributions.',
    icon: Cpu,
    color: 'text-purple-400 border-purple-500/40 bg-purple-950/30',
  },
];

export default function AboutPage() {
  const [members, setMembers] = useState<TeamMember[]>(() => {
    try {
      const saved = localStorage.getItem('landguard_team_members');
      return saved ? JSON.parse(saved) : DEFAULT_MEMBERS;
    } catch {
      return DEFAULT_MEMBERS;
    }
  });

  const [isEditing, setIsEditing] = useState(false);
  const [editingMember, setEditingMember] = useState<TeamMember | null>(null);
  const [isNewMember, setIsNewMember] = useState(false);

  // Form state
  const [formName, setFormName] = useState('');
  const [formRole, setFormRole] = useState('');
  const [formSpecialization, setFormSpecialization] = useState('');
  const [formBio, setFormBio] = useState('');
  const [formGithub, setFormGithub] = useState('');
  const [formLinkedin, setFormLinkedin] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formAvatarColor, setFormAvatarColor] = useState('from-orange-500 to-rose-600');

  useEffect(() => {
    localStorage.setItem('landguard_team_members', JSON.stringify(members));
  }, [members]);

  const handleOpenAdd = () => {
    setEditingMember(null);
    setIsNewMember(true);
    setFormName('');
    setFormRole('');
    setFormSpecialization('');
    setFormBio('');
    setFormGithub('');
    setFormLinkedin('');
    setFormEmail('');
    setFormAvatarColor('from-orange-500 to-rose-600');
    setIsEditing(true);
  };

  const handleOpenEdit = (m: TeamMember) => {
    setEditingMember(m);
    setIsNewMember(false);
    setFormName(m.name);
    setFormRole(m.role);
    setFormSpecialization(m.specialization);
    setFormBio(m.bio);
    setFormGithub(m.github || '');
    setFormLinkedin(m.linkedin || '');
    setFormEmail(m.email || '');
    setFormAvatarColor(m.avatarColor);
    setIsEditing(true);
  };

  const handleDeleteMember = (id: string) => {
    if (confirm('Are you sure you want to remove this team member?')) {
      setMembers((prev) => prev.filter((m) => m.id !== id));
    }
  };

  const handleSaveMember = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim() || !formRole.trim()) {
      alert('Please provide at least a Name and Role.');
      return;
    }

    if (isNewMember) {
      const newMember: TeamMember = {
        id: `mem-${Date.now()}`,
        name: formName.trim(),
        role: formRole.trim(),
        specialization: formSpecialization.trim() || 'Engineering & Research',
        bio: formBio.trim() || 'Dedicated contributor to IoT hardware, AI algorithms, and early warning systems.',
        github: formGithub.trim(),
        linkedin: formLinkedin.trim(),
        email: formEmail.trim(),
        avatarColor: formAvatarColor,
      };
      setMembers((prev) => [...prev, newMember]);
    } else if (editingMember) {
      setMembers((prev) =>
        prev.map((m) =>
          m.id === editingMember.id
            ? {
                ...m,
                name: formName.trim(),
                role: formRole.trim(),
                specialization: formSpecialization.trim(),
                bio: formBio.trim(),
                github: formGithub.trim(),
                linkedin: formLinkedin.trim(),
                email: formEmail.trim(),
                avatarColor: formAvatarColor,
              }
            : m
        )
      );
    }

    setIsEditing(false);
  };

  const handleResetToDefault = () => {
    if (confirm('Reset team members list to default?')) {
      setMembers(DEFAULT_MEMBERS);
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-9 pb-16 font-sans">
      {/* ── Top Hero: About LANDGUARD AI (Ellipsus-Style Editorial Header) ── */}
      <div className="card p-7 sm:p-10 relative overflow-hidden bg-gradient-to-br from-[#0e1220] via-[#0a0d18] to-[#090b14] border border-white/10 shadow-2xl">
        <div className="absolute top-0 right-0 p-10 opacity-10 pointer-events-none">
          <ShieldCheck className="w-80 h-80 text-orange-400" />
        </div>

        <div className="relative z-10 space-y-5">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-orange-950/60 border border-orange-500/30 text-orange-300 text-xs font-mono font-bold tracking-wider">
            <Sparkles className="w-3.5 h-3.5 text-orange-400" />
            <span>EARLY WARNING SYSTEM & GEOTECHNICAL INTELLIGENCE</span>
          </div>

          <div className="space-y-2">
            <h1 className="font-serif italic text-4xl sm:text-5xl text-white tracking-tight leading-tight">
              About LANDGUARD AI
            </h1>
            <p className="text-sm sm:text-base font-mono text-orange-300/90 font-medium">
              Edge IoT & Gray-Box Physics-Informed AI for Rainfall-Induced Landslide Early Warning
            </p>
          </div>

          <p className="text-sm sm:text-base text-slate-300 leading-relaxed max-w-4xl font-sans font-light">
            LANDGUARD AI is a ruggedized, low-cost ($18 BOM per node), 100% offline-first early warning system designed to protect critical transportation corridors (such as the Western Ghats, Konkan Railway, and Himalayan NH highways) and hillside communities. It bridges the critical gap between high-latency satellite radar passes and multi-crore imported borehole inclinometers by delivering real-time, explainable hazard predictions directly on the edge.
          </p>

          {/* Key Differentiators Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3 font-mono text-xs">
            <div className="p-3.5 rounded-2xl bg-black/40 border border-white/10 shadow-sm">
              <div className="text-slate-400 text-[10px] uppercase font-bold tracking-wider">Hardware BOM</div>
              <div className="text-base font-bold text-emerald-400 mt-1">~$18 / Node</div>
              <div className="text-[10px] text-slate-400 font-sans mt-0.5">vs ₹2,00,000+ commercial stations</div>
            </div>

            <div className="p-3.5 rounded-2xl bg-black/40 border border-white/10 shadow-sm">
              <div className="text-slate-400 text-[10px] uppercase font-bold tracking-wider">Connectivity</div>
              <div className="text-base font-bold text-orange-400 mt-1">100% Offline</div>
              <div className="text-[10px] text-slate-400 font-sans mt-0.5">Zero internet / cloud dependency</div>
            </div>

            <div className="p-3.5 rounded-2xl bg-black/40 border border-white/10 shadow-sm">
              <div className="text-slate-400 text-[10px] uppercase font-bold tracking-wider">AI Architecture</div>
              <div className="text-base font-bold text-purple-400 mt-1">Gray-Box Hybrid</div>
              <div className="text-[10px] text-slate-400 font-sans mt-0.5">Bishop Slope FoS + XGBoost + SHAP</div>
            </div>

            <div className="p-3.5 rounded-2xl bg-black/40 border border-white/10 shadow-sm">
              <div className="text-slate-400 text-[10px] uppercase font-bold tracking-wider">Wireless Range</div>
              <div className="text-base font-bold text-amber-400 mt-1">LoRa 433MHz</div>
              <div className="text-[10px] text-slate-400 font-sans mt-0.5">5km+ line-of-sight propagation</div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Section: System Architecture & Technical Pillars ──── */}
      <div className="space-y-4">
        <div className="border-b border-white/10 pb-3">
          <div className="flex items-center gap-2">
            <Layers className="w-5 h-5 text-orange-400" />
            <h2 className="font-serif italic text-2xl text-white tracking-tight">
              How LANDGUARD AI Works
            </h2>
          </div>
          <p className="text-xs text-slate-400 font-sans mt-0.5">
            End-to-end edge pipeline from physical soil transducers to limit equilibrium geotechnical physics and explainable AI.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {ARCHITECTURE_PILLARS.map((p, idx) => {
            const Icon = p.icon;
            return (
              <div key={idx} className="card p-5 space-y-3 border border-white/10 flex flex-col justify-between hover:border-orange-500/40 transition-all rounded-2xl">
                <div className="space-y-2.5">
                  <div className={clsx('w-11 h-11 rounded-2xl border flex items-center justify-center shadow-md', p.color)}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <h3 className="text-sm font-bold font-mono text-slate-100">{p.title}</h3>
                  <p className="text-xs text-slate-300 font-sans leading-relaxed">{p.desc}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Section: Core Team (Editable) ──────────────────────── */}
      <div className="space-y-4 pt-2">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/10 pb-3">
          <div>
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-orange-400" />
              <h2 className="font-serif italic text-2xl text-white tracking-tight">
                Core Project Team & Contributors
              </h2>
            </div>
            <p className="text-xs text-slate-400 font-sans mt-0.5">
              Click "Add Team Member" or "Edit" on any card to customize names, roles, and profiles.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleOpenAdd}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-orange-500 via-rose-500 to-amber-500 hover:opacity-90 text-slate-950 font-mono text-xs font-bold shadow-md shadow-orange-950 transition-all"
            >
              <UserPlus className="w-4 h-4" />
              <span>Add Team Member</span>
            </button>
            <button
              onClick={handleResetToDefault}
              className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-slate-200 text-xs font-mono transition-colors"
              title="Reset to default team"
            >
              Reset
            </button>
          </div>
        </div>

        {/* Team Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {members.map((m) => {
            const initials = m.name
              .split(' ')
              .map((n) => n[0])
              .join('')
              .toUpperCase()
              .slice(0, 2);

            return (
              <div
                key={m.id}
                className="card p-5 flex flex-col justify-between group hover:border-orange-500/40 transition-all relative overflow-hidden rounded-2xl"
              >
                <div>
                  {/* Top Bar: Avatar & Action Buttons */}
                  <div className="flex items-start justify-between mb-3.5">
                    <div
                      className={clsx(
                        'w-12 h-12 rounded-2xl bg-gradient-to-br flex items-center justify-center font-mono font-black text-base text-white shadow-md',
                        m.avatarColor
                      )}
                    >
                      {initials || 'LG'}
                    </div>

                    <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => handleOpenEdit(m)}
                        className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-orange-400 transition-colors"
                        title="Edit Member"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDeleteMember(m.id)}
                        className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-rose-400 transition-colors"
                        title="Delete Member"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Name & Role */}
                  <h3 className="font-mono font-bold text-sm text-slate-100 group-hover:text-orange-300 transition-colors">
                    {m.name}
                  </h3>
                  <div className="text-xs font-mono font-semibold text-orange-400/90 mt-0.5">
                    {m.role}
                  </div>

                  {/* Specialization Badge */}
                  <div className="mt-2 text-[10px] font-mono px-2.5 py-1 rounded-lg bg-black/40 border border-white/5 text-slate-400 line-clamp-2">
                    {m.specialization}
                  </div>

                  {/* Bio */}
                  <p className="mt-2.5 text-xs text-slate-300 font-sans leading-relaxed line-clamp-3">
                    {m.bio}
                  </p>
                </div>

                {/* Social & Contact Links */}
                <div className="mt-4 pt-3 border-t border-white/10 flex items-center gap-2 text-slate-400">
                  {m.github && (
                    <a
                      href={m.github}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-1 rounded-lg hover:bg-slate-800 hover:text-slate-200 transition-colors"
                      title="GitHub Profile"
                    >
                      <Github className="w-4 h-4" />
                    </a>
                  )}
                  {m.linkedin && (
                    <a
                      href={m.linkedin}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-1 rounded-lg hover:bg-slate-800 hover:text-orange-400 transition-colors"
                      title="LinkedIn Profile"
                    >
                      <Linkedin className="w-4 h-4" />
                    </a>
                  )}
                  {m.email && (
                    <a
                      href={`mailto:${m.email}`}
                      className="p-1 rounded-lg hover:bg-slate-800 hover:text-amber-400 transition-colors"
                      title={`Email ${m.name}`}
                    >
                      <Mail className="w-4 h-4" />
                    </a>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Section: Previous Works & Research Portfolio ──────── */}
      <div className="space-y-4 pt-4">
        <div className="border-b border-white/10 pb-3">
          <div className="flex items-center gap-2">
            <Award className="w-5 h-5 text-orange-400" />
            <h2 className="font-serif italic text-2xl text-white tracking-tight">
              Previous Works & Engineering Portfolio
            </h2>
          </div>
          <p className="text-xs text-slate-400 font-sans mt-0.5">
            Key research systems and engineering projects developed by our team prior to LANDGUARD AI.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {PREVIOUS_PROJECTS.map((proj) => {
            const Icon = proj.icon;
            return (
              <div
                key={proj.id}
                className="card p-6 space-y-4 border border-white/10 flex flex-col justify-between hover:border-orange-500/40 transition-all shadow-xl rounded-2xl"
              >
                <div className="space-y-3.5">
                  {/* Card Header */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3.5">
                      <div className={clsx('p-3.5 rounded-2xl border flex items-center justify-center shrink-0 shadow-md', proj.color)}>
                        <Icon className="w-6 h-6" />
                      </div>
                      <div>
                        <span className={clsx('text-[9px] font-mono font-bold px-2.5 py-0.5 rounded-full border uppercase', proj.badgeColor)}>
                          {proj.tag}
                        </span>
                        <h3 className="font-serif italic text-xl text-white mt-1 leading-snug">
                          {proj.title}
                        </h3>
                        <div className="text-xs text-slate-400 font-mono mt-0.5">
                          {proj.category}
                        </div>
                      </div>
                    </div>
                  </div>

                  <p className="text-xs text-slate-300 font-sans leading-relaxed">
                    {proj.summary}
                  </p>

                  {/* Highlights Bullet List */}
                  <div className="space-y-1.5 pt-1">
                    <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-orange-400/90 block">
                      Key Technical Contributions:
                    </span>
                    <ul className="space-y-1.5 text-xs text-slate-300 font-sans">
                      {proj.highlights.map((h, i) => (
                        <li key={i} className="flex items-start gap-2">
                          <span className="text-orange-400 font-bold mt-0.5">•</span>
                          <span>{h}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                <div className="space-y-3 pt-3 border-t border-white/10">
                  {/* Key Performance Metrics */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 font-mono text-center">
                    {proj.metrics.map((m, idx) => (
                      <div key={idx} className="p-2.5 rounded-xl bg-black/40 border border-white/10">
                        <div className="text-[9px] text-slate-400 uppercase">{m.label}</div>
                        <div className="text-xs font-bold text-slate-100 mt-0.5">{m.val}</div>
                      </div>
                    ))}
                  </div>

                  {/* Technology Stack Pills */}
                  <div className="flex flex-wrap items-center gap-1.5 pt-1">
                    {proj.stack.map((s, idx) => (
                      <span
                        key={idx}
                        className="px-2.5 py-0.5 rounded-lg bg-slate-900 border border-white/5 text-[10px] font-mono text-slate-300"
                      >
                        {s}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Modal / Form: Add / Edit Team Member ─────────────── */}
      {isEditing && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-[#0e1220] border border-white/10 rounded-3xl max-w-lg w-full p-7 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-orange-400" />
                <h3 className="font-serif italic text-xl text-white">
                  {isNewMember ? 'Add Team Member' : 'Edit Team Member Profile'}
                </h3>
              </div>
              <button
                onClick={() => setIsEditing(false)}
                className="p-1.5 rounded-xl hover:bg-slate-800 text-slate-400 hover:text-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveMember} className="space-y-3 font-mono text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] text-slate-400 uppercase font-bold mb-1">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Aman Nasim Khan"
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2 text-slate-100 focus:outline-none focus:ring-1 focus:ring-orange-500 font-sans"
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-slate-400 uppercase font-bold mb-1">
                    Role / Position *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Team Lead / IoT Architect"
                    value={formRole}
                    onChange={(e) => setFormRole(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2 text-slate-100 focus:outline-none focus:ring-1 focus:ring-orange-500 font-sans"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] text-slate-400 uppercase font-bold mb-1">
                  Core Specialization
                </label>
                <input
                  type="text"
                  placeholder="e.g. Embedded C++, LoRa, Edge AI, Geotechnical Physics"
                  value={formSpecialization}
                  onChange={(e) => setFormSpecialization(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2 text-slate-100 focus:outline-none focus:ring-1 focus:ring-orange-500 font-sans"
                />
              </div>

              <div>
                <label className="block text-[10px] text-slate-400 uppercase font-bold mb-1">
                  Short Bio / Background
                </label>
                <textarea
                  rows={3}
                  placeholder="Brief description of research focus, technical background, and achievements..."
                  value={formBio}
                  onChange={(e) => setFormBio(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2 text-slate-100 focus:outline-none focus:ring-1 focus:ring-orange-500 font-sans"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <div>
                  <label className="block text-[10px] text-slate-400 uppercase font-bold mb-1">
                    GitHub URL
                  </label>
                  <input
                    type="url"
                    placeholder="https://github.com/username"
                    value={formGithub}
                    onChange={(e) => setFormGithub(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-1.5 text-slate-100 focus:outline-none focus:ring-1 focus:ring-orange-500 font-sans text-xs"
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-slate-400 uppercase font-bold mb-1">
                    LinkedIn URL
                  </label>
                  <input
                    type="url"
                    placeholder="https://linkedin.com/in/username"
                    value={formLinkedin}
                    onChange={(e) => setFormLinkedin(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-1.5 text-slate-100 focus:outline-none focus:ring-1 focus:ring-orange-500 font-sans text-xs"
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-slate-400 uppercase font-bold mb-1">
                    Email Address
                  </label>
                  <input
                    type="email"
                    placeholder="name@example.com"
                    value={formEmail}
                    onChange={(e) => setFormEmail(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-1.5 text-slate-100 focus:outline-none focus:ring-1 focus:ring-orange-500 font-sans text-xs"
                  />
                </div>
              </div>

              {/* Avatar Color Theme */}
              <div>
                <label className="block text-[10px] text-slate-400 uppercase font-bold mb-1">
                  Avatar Accent Color
                </label>
                <div className="flex gap-2">
                  {[
                    { id: 'from-orange-500 to-rose-600', label: 'Coral / Rose' },
                    { id: 'from-amber-500 to-orange-600', label: 'Gold / Amber' },
                    { id: 'from-emerald-500 to-teal-600', label: 'Sage / Emerald' },
                    { id: 'from-purple-500 to-indigo-600', label: 'Lavender / Purple' },
                    { id: 'from-cyan-500 to-blue-600', label: 'Cyan / Blue' },
                  ].map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => setFormAvatarColor(c.id)}
                      className={clsx(
                        'w-8 h-8 rounded-xl bg-gradient-to-br border transition-transform',
                        c.id,
                        formAvatarColor === c.id ? 'scale-110 ring-2 ring-white border-white' : 'border-transparent opacity-70 hover:opacity-100'
                      )}
                      title={c.label}
                    />
                  ))}
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="pt-3 border-t border-white/10 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-mono"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-orange-500 to-rose-500 hover:opacity-95 text-slate-950 font-mono font-bold text-xs shadow-md shadow-orange-950"
                >
                  {isNewMember ? 'Add Member' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
