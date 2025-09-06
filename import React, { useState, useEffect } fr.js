import React, { useState, useEffect } from "react";
import { BrowserRouter, Routes, Route, useParams, Link } from "react-router-dom";

/* ------------------ Logger (mandatory) ------------------ */
class Logger {
  constructor(ns = "URLShortener") {
    this.ns = ns;
    this.key = `logs_${ns}`;
  }
  _now() {
    return new Date().toISOString();
  }
  _read() {
    return JSON.parse(localStorage.getItem(this.key) || "[]");
  }
  _write(arr) {
    localStorage.setItem(this.key, JSON.stringify(arr));
  }
  log(type, event, payload = {}) {
    const entry = { ts: this._now(), type, event, payload };
    const arr = this._read();
    arr.push(entry);
    this._write(arr);
  }
  all() {
    return this._read();
  }
  clear() {
    localStorage.removeItem(this.key);
  }
}
const logger = new Logger();

/* ------------------ Shortcode generator ------------------ */
const ALPH = "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";
function randomShort(len = 6) {
  const arr = new Uint8Array(len);
  crypto.getRandomValues(arr);
  return Array.from(arr).map(n => ALPH[n % ALPH.length]).join("");
}
function generateUnique(getKeys, len = 6, tries = 50) {
  for (let i = 0; i < tries; i++) {
    const cand = randomShort(len);
    if (!getKeys().includes(cand)) return cand;
  }
  return randomShort(len + 2);
}

/* ------------------ Storage (localStorage + logger) ------------------ */
const STORE_KEY = "url_mappings_v1";
function readStore() {
  return JSON.parse(localStorage.getItem(STORE_KEY) || "{}");
}
function writeStore(obj) {
  localStorage.setItem(STORE_KEY, JSON.stringify(obj));
}
function getAllKeys() {
  return Object.keys(readStore());
}
function createMapping(shortcode, { longUrl, validMinutes = 30 }) {
  const m = readStore();
  if (m[shortcode]) throw new Error("SHORTCODE_EXISTS");
  m[shortcode] = {
    longUrl,
    createdAt: Date.now(),
    validMinutes,
    clicks: 0,
  };
  writeStore(m);
  logger.log("CREATE", "mapping", { shortcode, longUrl, validMinutes });
  return m[shortcode];
}
function getMapping(shortcode) {
  return readStore()[shortcode] || null;
}
function incrementClick(shortcode) {
  const m = readStore();
  if (!m[shortcode]) return false;
  m[shortcode].clicks = (m[shortcode].clicks || 0) + 1;
  writeStore(m);
  logger.log("CLICK", "increment", { shortcode, clicks: m[shortcode].clicks });
  return true;
}
function listMappings() {
  return readStore();
}

/* ------------------ Utils ------------------ */
function isExpired(mapping) {
  if (!mapping) return true;
  const elapsed = (Date.now() - mapping.createdAt) / (60 * 1000);
  return elapsed > (mapping.validMinutes ?? 30);
}

/* ------------------ Components ------------------ */
function ShortenForm() {
  const [url, setUrl] = useState("");
  const [custom, setCustom] = useState("");
  const [valid, setValid] = useState(30);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");

  function validUrl(u) {
    try { new URL(u); return true; } catch { return false; }
  }

  const submit = e => {
    e.preventDefault();
    setError("");
    if (!validUrl(url)) {
      setError("Invalid URL");
      logger.log("ERROR", "invalid_url", { url });
      return;
    }
    let sc = custom.trim();
    const keys = getAllKeys();
    if (sc) {
      if (!/^[A-Za-z0-9_-]{4,12}$/.test(sc)) {
        setError("Custom shortcode must be 4–12 chars [A-Za-z0-9_-]");
        return;
      }
      if (keys.includes(sc)) {
        setError("Shortcode already exists");
        return;
      }
    } else {
      sc = generateUnique(() => keys, 6);
    }
    createMapping(sc, { longUrl: url, validMinutes: Number(valid) || 30 });
    const shortUrl = `${window.location.origin}/${sc}`;
    setResult({ shortcode: sc, shortUrl });
    logger.log("CREATE_UI", "user_created", { shortcode: sc, url, valid });
  };

  return (
    <div>
      <h2>Create Short URL</h2>
      <form onSubmit={submit}>
        <input value={url} onChange={e => setUrl(e.target.value)} placeholder="https://..." />
        <input value={custom} onChange={e => setCustom(e.target.value)} placeholder="Custom shortcode (optional)" />
        <input type="number" value={valid} onChange={e => setValid(e.target.value)} min="1" />
        <button type="submit">Shorten</button>
      </form>
      {error && <div style={{color:"red"}}>{error}</div>}
      {result && (
        <div>
          Short URL: <a href={result.shortUrl}>{result.shortUrl}</a>
        </div>
      )}
    </div>
  );
}

function RedirectHandler() {
  const { code } = useParams();
  const [msg, setMsg] = useState("Redirecting...");

  useEffect(() => {
    const m = getMapping(code);
    if (!m) {
      setMsg("Not found");
      logger.log("REDIRECT_FAIL", "not_found", { code });
      return;
    }
    if (isExpired(m)) {
      setMsg("Expired");
      logger.log("REDIRECT_FAIL", "expired", { code });
      return;
    }
    incrementClick(code);
    logger.log("REDIRECT", "to_long_url", { code, to: m.longUrl });
    window.location.assign(m.longUrl);
  }, [code]);

  return <div>{msg}</div>;
}

function StatsPage() {
  const { code } = useParams();
  const m = getMapping(code);
  if (!m) return <div>Not found</div>;
  return (
    <div>
      <h2>Stats for {code}</h2>
      <p>URL: <a href={m.longUrl}>{m.longUrl}</a></p>
      <p>Clicks: {m.clicks}</p>
      <p>Created: {new Date(m.createdAt).toLocaleString()}</p>
      <p>Valid (min): {m.validMinutes}</p>
    </div>
  );
}

function ListLinks() {
  const [all, setAll] = useState(listMappings());
  useEffect(() => { setAll(listMappings()); }, []);
  return (
    <div>
      <h2>All Short Links</h2>
      <ul>
        {Object.entries(all).map(([sc, m]) => (
          <li key={sc}>
            <a href={`/${sc}`}>{window.location.origin}/{sc}</a> → {m.longUrl} | Clicks: {m.clicks} | 
            <Link to={`/stats/${sc}`}> Stats</Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

function LogViewer() {
  const logs = logger.all();
  return (
    <div>
      <h2>Logs</h2>
      <ul>
        {logs.map((l, i) => (
          <li key={i}>{l.ts} [{l.type}] {l.event} {JSON.stringify(l.payload)}</li>
        ))}
      </ul>
    </div>
  );
}

/* ------------------ App Root ------------------ */
export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={
          <div>
            <h1>React URL Shortener</h1>
            <ShortenForm />
            <ListLinks />
            <LogViewer />
          </div>
        } />
        <Route path="/stats/:code" element={<StatsPage />} />
        <Route path="/:code" element={<RedirectHandler />} />
      </Routes>
    </BrowserRouter>
  );
}
