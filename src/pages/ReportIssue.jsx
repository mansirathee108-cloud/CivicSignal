import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Mic, Camera, Sparkles, X, CheckCircle2, MapPin, Copy, AlertTriangle, Loader2 } from 'lucide-react';
import LocationPicker, { nearestArea } from '../components/LocationPicker';
import { AiTag, ConfidenceBar, SeverityBadge } from '../components/ui';
import { useToast } from '../components/Toast';
import { CATEGORY_NAMES, SEVERITIES } from '../data/taxonomy';
import { createComplaint } from '../services/api';
import { classify, findDuplicateCandidates } from '../utils/mockAI';
import { addCivicPoints, getActiveUser } from '../utils/authStorage';
import { useComplaints } from '../utils/hooks';

async function shrinkImage(file, max = 800) {
  const url = await new Promise((res, rej) => {
    const r = new FileReader();
    r.onload = () => res(r.result);
    r.onerror = rej;
    r.readAsDataURL(file);
  });
  const img = await new Promise((res, rej) => {
    const i = new Image();
    i.onload = () => res(i);
    i.onerror = rej;
    i.src = url;
  });
  const scale = Math.min(1, max / Math.max(img.width, img.height));
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(img.width * scale);
  canvas.height = Math.round(img.height * scale);
  canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);
  return canvas.toDataURL('image/jpeg', 0.72);
}

const EMPTY = { title: '', description: '', category: '', severity: '', landmark: '' };

export default function ReportIssue() {
  const toast = useToast();
  const { complaints, refresh } = useComplaints();
  const [form, setForm] = useState(EMPTY);
  const [coords, setCoords] = useState(null);
  const [photo, setPhoto] = useState(null);
  const [ai, setAi] = useState(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [listening, setListening] = useState(false);
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(null);
  const recRef = useRef(null);
  const fileRef = useRef(null);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  // "Live" AI suggestion after the citizen has typed enough text
  useEffect(() => {
    if (form.description.trim().length < 15) { setAi(null); setAnalyzing(false); return undefined; }
    setAnalyzing(true);
    const t = setTimeout(() => { setAi(classify(form.title, form.description)); setAnalyzing(false); }, 700);
    return () => clearTimeout(t);
  }, [form.title, form.description]);

  useEffect(() => () => recRef.current?.stop(), []);

  const dupes = useMemo(
    () => (ai && !ai.unable && coords ? findDuplicateCandidates(complaints, { subcategory: ai.subcategory, ...coords }) : []),
    [ai, coords, complaints]
  );

  const toggleListening = () => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) { toast('Voice input is not supported in this browser. Try Chrome.', 'error'); return; }
    if (listening) { recRef.current?.stop(); return; }
    const rec = new SR();
    rec.lang = 'en-IN';
    rec.continuous = true;
    rec.interimResults = false;
    rec.onresult = (e) => {
      let text = '';
      for (let i = e.resultIndex; i < e.results.length; i++) if (e.results[i].isFinal) text += e.results[i][0].transcript;
      if (text) setForm((f) => ({ ...f, description: `${f.description} ${text}`.trim() }));
    };
    rec.onend = () => setListening(false);
    rec.onerror = () => setListening(false);
    recRef.current = rec;
    rec.start();
    setListening(true);
  };

  const onPhoto = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) { toast('Please choose an image file.', 'error'); return; }
    if (file.size > 10 * 1024 * 1024) { toast('Image is larger than 10 MB.', 'error'); return; }
    try { setPhoto(await shrinkImage(file)); } catch { toast('Could not read that image.', 'error'); }
  };

  const validate = () => {
    const er = {};
    if (form.title.trim().length < 5) er.title = 'Please enter a short title (at least 5 characters).';
    if (form.description.trim().length < 15) er.description = 'Please describe the issue in a little more detail (at least 15 characters).';
    if (!coords) er.location = 'Please mark the location on the map.';
    setErrors(er);
    return Object.keys(er).length === 0;
  };

  const submit = async (e) => {
    e.preventDefault();
    if (!validate()) { toast('Please fix the highlighted fields.', 'error'); return; }
    setSubmitting(true);
    try {
      const area = nearestArea(coords.lat, coords.lng);
      const user = getActiveUser();
      const created = await createComplaint({
        title: form.title.trim(),
        description: form.description.trim(),
        location: { ...coords, address: `${form.landmark.trim() ? `${form.landmark.trim()}, ` : ''}${area.name}`, area: area.name, zone: area.zone },
        photoUrl: photo,
        citizenCategory: form.category || null,
        citizenSeverity: form.severity || null,
        user,
      });
      const updated = addCivicPoints(5);
      await refresh();
      setDone({ id: created.id, points: updated ? 5 : 0 });
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
      toast(err.message || 'Could not submit the complaint.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const reset = () => { setForm(EMPTY); setCoords(null); setPhoto(null); setAi(null); setErrors({}); setDone(null); };

  if (done) {
    return (
      <div className="max-w-xl mx-auto px-4 py-16">
        <div className="card p-8 text-center">
          <CheckCircle2 className="h-14 w-14 text-emerald-500 mx-auto" />
          <h1 className="text-2xl font-extrabold text-ink mt-4">Complaint submitted</h1>
          <p className="text-muted mt-1 text-sm">Save this ID to follow your complaint.</p>
          <div className="mt-5 inline-flex items-center gap-2 rounded-xl bg-soft px-5 py-3">
            <span className="text-2xl font-extrabold tracking-wide text-navy-900 dark:text-white">{done.id}</span>
            <button onClick={() => { navigator.clipboard?.writeText(done.id); toast('ID copied'); }} className="p-1.5 rounded-lg text-muted hover:bg-surface" aria-label="Copy complaint ID"><Copy className="h-4 w-4" /></button>
          </div>
          {done.points > 0 && <p className="text-sm text-brand-600 font-semibold mt-3">+{done.points} Civic Score for reporting</p>}
          <div className="flex flex-wrap justify-center gap-3 mt-7">
            <Link to={`/track?id=${done.id}`} className="btn-primary">Track this complaint</Link>
            <button onClick={reset} className="btn-outline">Report another issue</button>
          </div>
        </div>
      </div>
    );
  }

  const field = (name) => errors[name] && <p className="text-xs text-red-600 mt-1.5" role="alert">{errors[name]}</p>;

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10">
      <h1 className="text-3xl font-extrabold text-ink">Report an Issue</h1>
      <p className="text-muted mt-1">Tell us what is wrong and where. Our assistant will suggest the details; city staff review everything.</p>

      <form onSubmit={submit} noValidate className="grid lg:grid-cols-[1fr_340px] gap-6 mt-8 items-start">
        <div className="space-y-6">
          <section className="card p-6 space-y-5">
            <h2 className="font-bold text-ink">1. What is the problem?</h2>
            <div>
              <label htmlFor="title" className="label">Title</label>
              <input id="title" className="input" value={form.title} onChange={(e) => set('title', e.target.value)} placeholder="e.g., Deep pothole on MG Road" aria-invalid={!!errors.title} />
              {field('title')}
            </div>
            <div>
              <label htmlFor="desc" className="label">Description (you can also use your voice)</label>
              <div className="relative">
                <textarea id="desc" rows={5} className="input !pr-12" value={form.description} onChange={(e) => set('description', e.target.value)} placeholder="What is happening, how long has it been like this, is anyone at risk?" aria-invalid={!!errors.description} />
                <button type="button" onClick={toggleListening} aria-pressed={listening} aria-label={listening ? 'Stop dictation' : 'Start dictation'}
                  className={`absolute right-3 bottom-3 h-9 w-9 rounded-full flex items-center justify-center ${listening ? 'bg-red-500 text-white animate-pulse' : 'bg-soft text-muted hover:text-ink'}`}>
                  <Mic className="h-4 w-4" />
                </button>
              </div>
              {field('description')}
            </div>

            {(analyzing || ai) && (
              <div className="rounded-xl border border-brand-200 dark:border-brand-500/30 bg-brand-50/60 dark:bg-brand-500/10 p-4">
                {analyzing ? (
                  <p className="flex items-center gap-2 text-sm text-brand-700 dark:text-brand-200"><Loader2 className="h-4 w-4 animate-spin" /> Analysing your description...</p>
                ) : ai.unable ? (
                  <div className="flex gap-3">
                    <AlertTriangle className="h-5 w-5 text-amber-500 shrink-0" />
                    <div>
                      <p className="text-sm font-semibold text-ink">We could not classify this confidently</p>
                      <p className="text-xs text-muted mt-0.5">{ai.reviewReason} A staff member will review it, but more detail helps us route it faster.</p>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <AiTag />
                      <button type="button" className="text-xs font-semibold text-brand-700 dark:text-brand-200 hover:underline"
                        onClick={() => setForm((f) => ({ ...f, category: ai.category, severity: ai.severity }))}>Use these suggestions</button>
                    </div>
                    <div className="grid sm:grid-cols-3 gap-3 mt-3 text-sm">
                      <div><p className="text-xs text-muted">Category</p><p className="font-semibold text-ink">{ai.category}</p></div>
                      <div><p className="text-xs text-muted">Issue type</p><p className="font-semibold text-ink">{ai.subcategory}</p></div>
                      <div><p className="text-xs text-muted">Urgency</p><SeverityBadge severity={ai.severity} /></div>
                    </div>
                    <div className="grid sm:grid-cols-3 gap-3 mt-3">
                      <ConfidenceBar value={ai.confidence.category} label="Category confidence" />
                      <ConfidenceBar value={ai.confidence.subcategory} label="Type confidence" />
                      <ConfidenceBar value={ai.confidence.severity} label="Urgency confidence" />
                    </div>
                    <p className="text-[11px] text-muted mt-3">Simulated suggestion for the prototype. Staff may change it, and it never overrides what you choose below.</p>
                  </>
                )}
              </div>
            )}

            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="cat" className="label">Category (optional)</label>
                <select id="cat" className="input" value={form.category} onChange={(e) => set('category', e.target.value)}>
                  <option value="">Not sure - let AI suggest</option>
                  {CATEGORY_NAMES.map((c) => <option key={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label htmlFor="sev" className="label">How urgent is it? (optional)</label>
                <select id="sev" className="input" value={form.severity} onChange={(e) => set('severity', e.target.value)}>
                  <option value="">Not sure - let AI suggest</option>
                  {SEVERITIES.map((s) => <option key={s}>{s}</option>)}
                </select>
              </div>
            </div>
            {form.severity === 'Critical' && (
              <p className="text-xs rounded-lg bg-red-50 dark:bg-red-500/10 text-red-700 dark:text-red-300 p-3">
                If someone is in immediate danger, call the emergency number (112) first. CivicSignal is not an emergency response service.
              </p>
            )}
          </section>

          <section className="card p-6 space-y-4">
            <h2 className="font-bold text-ink">2. Where is it?</h2>
            <LocationPicker value={coords} onChange={(c) => { setCoords(c); setErrors((er) => ({ ...er, location: undefined })); }} />
            {coords && <p className="text-xs text-muted flex items-center gap-1.5"><MapPin className="h-3.5 w-3.5" /> Near {nearestArea(coords.lat, coords.lng).name} ({coords.lat}, {coords.lng})</p>}
            {field('location')}
            <div>
              <label htmlFor="lm" className="label">Landmark or street (optional)</label>
              <input id="lm" className="input" value={form.landmark} onChange={(e) => set('landmark', e.target.value)} placeholder="e.g., Opposite the metro pillar 45" />
            </div>
          </section>

          <section className="card p-6">
            <h2 className="font-bold text-ink mb-4">3. Add a photo (optional)</h2>
            <input ref={fileRef} type="file" accept="image/*" className="sr-only" onChange={onPhoto} aria-label="Upload photo" />
            {photo ? (
              <div className="relative inline-block">
                <img src={photo} alt="Attached complaint" className="h-40 rounded-xl border border-line object-cover" />
                <button type="button" onClick={() => { setPhoto(null); if (fileRef.current) fileRef.current.value = ''; }} aria-label="Remove photo"
                  className="absolute -top-2 -right-2 h-7 w-7 rounded-full bg-red-600 text-white flex items-center justify-center"><X className="h-4 w-4" /></button>
              </div>
            ) : (
              <button type="button" onClick={() => fileRef.current?.click()}
                className="w-full rounded-xl border-2 border-dashed border-line hover:border-brand-500 py-8 text-center text-muted hover:text-brand-600 transition-colors">
                <Camera className="h-7 w-7 mx-auto" />
                <span className="block text-sm font-medium mt-2">Tap to upload or take a photo</span>
                <span className="block text-xs mt-0.5">Avoid faces and number plates where possible</span>
              </button>
            )}
          </section>

          <button type="submit" disabled={submitting} className="btn-primary w-full !py-3.5 text-base">
            {submitting ? <><Loader2 className="h-4 w-4 animate-spin" /> Submitting...</> : 'Submit complaint'}
          </button>
        </div>

        <aside className="space-y-4 lg:sticky lg:top-24">
          {dupes.length > 0 && (
            <div className="card p-5 border-amber-300 dark:border-amber-500/40">
              <h3 className="font-bold text-ink flex items-center gap-2 text-sm"><AlertTriangle className="h-4 w-4 text-amber-500" /> Similar issue nearby</h3>
              <p className="text-xs text-muted mt-1">Someone may have already reported this. You can still submit yours - extra reports help prioritise it.</p>
              <ul className="mt-3 space-y-2">
                {dupes.map((d) => (
                  <li key={d.id} className="text-xs rounded-lg bg-soft p-2.5">
                    <Link to={`/track?id=${d.id}`} target="_blank" className="font-semibold text-brand-700 dark:text-brand-200 hover:underline">{d.id}</Link>
                    <span className="text-muted"> - {d.distance} m away</span>
                    <p className="text-ink mt-0.5 line-clamp-2">{d.title}</p>
                  </li>
                ))}
              </ul>
            </div>
          )}
          <div className="card p-5">
            <h3 className="font-bold text-ink text-sm flex items-center gap-2"><Sparkles className="h-4 w-4 text-brand-600" /> Tips for a faster fix</h3>
            <ul className="text-xs text-muted mt-3 space-y-2 list-disc pl-4">
              <li>Say exactly where it is and how big or serious it looks.</li>
              <li>Mention if it is near a school, hospital or main road.</li>
              <li>Add a photo taken from a safe distance.</li>
              <li>You can write in your own words - no need to pick a category.</li>
            </ul>
          </div>
          <p className="text-[11px] text-muted px-1">AI suggestions may be reviewed or corrected by municipal staff. Your original text is always kept.</p>
        </aside>
      </form>
    </div>
  );
}
