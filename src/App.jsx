import { useState, useEffect, useRef, useCallback } from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from "recharts";

// ─── FONTS ────────────────────────────────────────────────────────────────────
function useFonts() {
  useEffect(() => {
    const l = document.createElement("link");
    l.href = "https://fonts.googleapis.com/css2?family=Syne:wght@600;700;800&family=DM+Mono:wght@400;500&family=DM+Sans:wght@400;500;600&display=swap";
    l.rel = "stylesheet";
    document.head.appendChild(l);
  }, []);
}

// ─── DESIGN TOKENS ────────────────────────────────────────────────────────────
const T = {
  bg:      "#050710",
  surface: "#0a0c1a",
  card:    "#0f1224",
  border:  "#1a1d35",
  borderL: "#242850",
  us:      "#3b82f6",     // electric blue — US market
  in:      "#f59e0b",     // saffron amber — India market
  green:   "#10b981",
  red:     "#f43f5e",
  text:    "#e8eaf6",
  muted:   "#4a5080",
  faint:   "#151830",
  mono:    '"DM Mono", monospace',
  sans:    '"DM Sans", sans-serif',
  display: '"Syne", sans-serif',
};

// ─── STOCK UNIVERSES ─────────────────────────────────────────────────────────
const US_STOCKS = [
  { sym:"CRWD", name:"CrowdStrike",      sector:"Cybersecurity",    cap:"mid",   start:178, mu:0.0006, sig:0.022 },
  { sym:"CELH", name:"Celsius Holdings", sector:"Consumer",         cap:"mid",   start:52,  mu:0.0004, sig:0.028 },
  { sym:"AXON", name:"Axon Enterprise",  sector:"Defense Tech",     cap:"mid",   start:210, mu:0.0005, sig:0.020 },
  { sym:"IONQ", name:"IonQ Inc",         sector:"Quantum",          cap:"small", start:9,   mu:0.0004, sig:0.040 },
  { sym:"SOUN", name:"SoundHound AI",    sector:"AI/Voice",         cap:"small", start:5,   mu:0.0005, sig:0.045 },
  { sym:"ASTS", name:"AST SpaceMobile",  sector:"Satellite",        cap:"small", start:7,   mu:0.0006, sig:0.042 },
  { sym:"HIMS", name:"Hims & Hers",      sector:"Telehealth",       cap:"small", start:11,  mu:0.0004, sig:0.035 },
  { sym:"LUNR", name:"Intuitive Machines",sector:"Space",           cap:"small", start:6.5, mu:0.0005, sig:0.048 },
  { sym:"APLD", name:"Applied Digital",  sector:"Data Centers",     cap:"small", start:7.8, mu:0.0005, sig:0.045 },
  { sym:"RGTI", name:"Rigetti Computing",sector:"Quantum",          cap:"small", start:1.9, mu:0.0003, sig:0.050 },
  { sym:"LIDR", name:"AEye Inc",         sector:"LiDAR",            cap:"penny", start:1.8, mu:-0.0001,sig:0.055 },
  { sym:"MULN", name:"Mullen Auto",      sector:"EV",               cap:"penny", start:0.45,mu:-0.0003,sig:0.065 },
  { sym:"GFAI", name:"Guardforce AI",    sector:"Security AI",      cap:"penny", start:1.2, mu:0.0001, sig:0.058 },
  { sym:"CIFR", name:"Cipher Mining",    sector:"Crypto Mining",    cap:"small", start:4.2, mu:0.0004, sig:0.055 },
  { sym:"OPEN", name:"Opendoor Tech",    sector:"PropTech",         cap:"small", start:3.5, mu:-0.0002,sig:0.040 },
];

const IN_STOCKS = [
  { sym:"RELIANCE", name:"Reliance Industries", sector:"Conglomerate",   cap:"large", start:2850, mu:0.0004, sig:0.015, exch:"NSE" },
  { sym:"TCS",      name:"Tata Consultancy",    sector:"IT Services",    cap:"large", start:3900, mu:0.0003, sig:0.013, exch:"NSE" },
  { sym:"INFY",     name:"Infosys",             sector:"IT Services",    cap:"large", start:1620, mu:0.0003, sig:0.014, exch:"NSE" },
  { sym:"HDFCBANK", name:"HDFC Bank",           sector:"Banking",        cap:"large", start:1680, mu:0.0003, sig:0.012, exch:"NSE" },
  { sym:"ICICIBANK",name:"ICICI Bank",          sector:"Banking",        cap:"large", start:1100, mu:0.0004, sig:0.013, exch:"NSE" },
  { sym:"BAJFINANCE",name:"Bajaj Finance",      sector:"NBFC",           cap:"large", start:7200, mu:0.0003, sig:0.018, exch:"NSE" },
  { sym:"WIPRO",    name:"Wipro Ltd",           sector:"IT Services",    cap:"large", start:480,  mu:0.0002, sig:0.015, exch:"NSE" },
  { sym:"PERSISTENT",name:"Persistent Systems", sector:"IT Services",   cap:"mid",   start:5400, mu:0.0005, sig:0.022, exch:"NSE" },
  { sym:"COFORGE",  name:"Coforge Ltd",         sector:"IT Services",   cap:"mid",   start:7200, mu:0.0005, sig:0.024, exch:"NSE" },
  { sym:"MUTHOOTFIN",name:"Muthoot Finance",    sector:"Gold Finance",  cap:"mid",   start:1950, mu:0.0004, sig:0.020, exch:"NSE" },
  { sym:"ABCAPITAL",name:"Aditya Birla Capital",sector:"NBFC",          cap:"mid",   start:195,  mu:0.0003, sig:0.022, exch:"NSE" },
  { sym:"LTTS",     name:"L&T Technology",      sector:"Engineering",   cap:"mid",   start:4800, mu:0.0004, sig:0.021, exch:"NSE" },
  { sym:"FINEORG",  name:"Fine Organics",       sector:"Chemicals",     cap:"small", start:5200, mu:0.0003, sig:0.025, exch:"NSE" },
  { sym:"DEEPAKNTR",name:"Deepak Nitrite",      sector:"Chemicals",     cap:"small", start:2400, mu:0.0002, sig:0.026, exch:"NSE" },
  { sym:"CLEAN",    name:"Clean Science",       sector:"Specialty Chem",cap:"small", start:1550, mu:0.0002, sig:0.027, exch:"NSE" },
];

// ─── MATH / SIMULATION ────────────────────────────────────────────────────────
function genPrices(n, start, mu, sig, seed = 1) {
  let p = start, s = seed;
  const lcg = () => { s = (s * 1664525 + 1013904223) & 0xffffffff; return (s >>> 0) / 0xffffffff; };
  const gr  = () => { const u = lcg()||1e-10, v = lcg()||1e-10; return Math.sqrt(-2*Math.log(u))*Math.cos(2*Math.PI*v); };
  return Array.from({ length: n }, () => { p *= Math.exp(mu + sig * gr()); return +p.toFixed(2); });
}
function smaArr(arr, n) {
  return arr.map((_, i) => i < n-1 ? null : arr.slice(i-n+1,i+1).reduce((a,b)=>a+b,0)/n);
}
function rsiOf(arr, n = 14) {
  if (arr.length < n+1) return null;
  let ag = 0, al = 0;
  for (let i = 1; i <= n; i++) { const d = arr[i]-arr[i-1]; if(d>0) ag+=d; else al-=d; }
  ag/=n; al/=n;
  for (let i = n+1; i < arr.length; i++) {
    const d = arr[i]-arr[i-1];
    ag = (ag*(n-1)+Math.max(d,0))/n;
    al = (al*(n-1)+Math.max(-d,0))/n;
  }
  return +(100 - 100/(1+ag/(al||0.001))).toFixed(1);
}
function bbOf(arr, n = 20, k = 2) {
  if (arr.length < n) return null;
  const sl = arr.slice(-n), m = sl.reduce((a,b)=>a+b,0)/n;
  const std = Math.sqrt(sl.reduce((s,v)=>s+(v-m)**2,0)/n);
  return { upper:+(m+k*std).toFixed(2), mid:+m.toFixed(2), lower:+(m-k*std).toFixed(2) };
}

function scoreStock(closes, last, prev) {
  const rsi = rsiOf(closes);
  const bb  = bbOf(closes);
  const sm20 = smaArr(closes,20).at(-1);
  const sm50 = smaArr(closes,Math.min(50,closes.length)).at(-1);
  const chg  = +((last-prev)/prev*100).toFixed(2);
  const chg5 = closes.length >= 6 ? +((last-closes.at(-6))/closes.at(-6)*100).toFixed(2) : 0;
  let score = 0, signals = [];
  if (rsi !== null) {
    if (rsi < 35)         { signals.push({label:"RSI Oversold",  type:"bull"}); score+=25; }
    else if (rsi > 65)    { signals.push({label:"RSI Overbought",type:"bear"}); score-=10; }
    else if (rsi > 45)    { signals.push({label:"RSI Healthy",   type:"neutral"}); score+=10; }
  }
  if (bb) {
    if (last <= bb.lower) { signals.push({label:"At BB Lower",   type:"bull"}); score+=20; }
    else if (last >= bb.upper){ signals.push({label:"At BB Upper",type:"bear"}); score-=8; }
    else if (last > bb.mid)   { signals.push({label:"Above BB Mid",type:"bull"}); score+=8; }
  }
  if (sm20 && sm50) {
    if (sm20 > sm50) { signals.push({label:"SMA Bullish",type:"bull"}); score+=20; }
    else             { signals.push({label:"SMA Bearish",type:"bear"}); score-=10; }
  }
  if (chg5 > 5)  { signals.push({label:"5d Momentum",   type:"bull"}); score+=15; }
  if (chg5 < -5) { signals.push({label:"Selling Pressure",type:"bear"}); score-=10; }
  return { rsi, bb, sm20, sm50, chg, chg5, score, signals };
}

// ─── PRE-BUILD SIMULATED DATA ─────────────────────────────────────────────────
const SIM_US = US_STOCKS.map((s,i) => {
  const closes = genPrices(60, s.start, s.mu, s.sig, (i+1)*77);
  const last = closes.at(-1), prev = closes.at(-2);
  return { ...s, closes, last, prev, currency:"$", ...scoreStock(closes,last,prev), spark:closes.slice(-15) };
});
const SIM_IN = IN_STOCKS.map((s,i) => {
  const closes = genPrices(60, s.start, s.mu, s.sig, (i+1)*113);
  const last = closes.at(-1), prev = closes.at(-2);
  return { ...s, closes, last, prev, currency:"₹", ...scoreStock(closes,last,prev), spark:closes.slice(-15) };
});

// ─── TWELVE DATA API ──────────────────────────────────────────────────────────
const TD_BASE = "https://api.twelvedata.com";

async function tdFetch(endpoint, params, apiKey) {
  const url = new URL(`${TD_BASE}/${endpoint}`);
  Object.entries({ ...params, apikey: apiKey }).forEach(([k,v]) => url.searchParams.set(k,v));
  const r = await fetch(url.toString());
  return r.json();
}

async function fetchRealStock(sym, exch, apiKey) {
  const symbol = exch === "NSE" ? `${sym}:NSE` : sym;
  try {
    const [quote, rsiD, bbD, smaD] = await Promise.all([
      tdFetch("quote",  { symbol }, apiKey),
      tdFetch("rsi",    { symbol, interval:"1day", time_period:14, outputsize:5 }, apiKey),
      tdFetch("bbands", { symbol, interval:"1day", time_period:20, outputsize:5 }, apiKey),
      tdFetch("sma",    { symbol, interval:"1day", time_period:20, outputsize:5 }, apiKey),
    ]);
    if (quote.status === "error" || !quote.close) return null;
    const last  = +parseFloat(quote.close).toFixed(2);
    const prev  = +parseFloat(quote.previous_close).toFixed(2);
    const chg   = +parseFloat(quote.percent_change).toFixed(2);
    const rsi   = rsiD?.values?.[0]?.rsi  ? +parseFloat(rsiD.values[0].rsi).toFixed(1)  : null;
    const upper = bbD?.values?.[0]?.upper_band  ? +parseFloat(bbD.values[0].upper_band).toFixed(2)  : null;
    const mid   = bbD?.values?.[0]?.middle_band ? +parseFloat(bbD.values[0].middle_band).toFixed(2) : null;
    const lower = bbD?.values?.[0]?.lower_band  ? +parseFloat(bbD.values[0].lower_band).toFixed(2)  : null;
    const sm20  = smaD?.values?.[0]?.sma ? +parseFloat(smaD.values[0].sma).toFixed(2) : null;
    const bb = upper ? { upper, mid, lower } : null;
    let score = 0, signals = [];
    if (rsi !== null) {
      if (rsi < 35)      { signals.push({label:"RSI Oversold",  type:"bull"}); score+=25; }
      else if (rsi > 65) { signals.push({label:"RSI Overbought",type:"bear"}); score-=10; }
      else if (rsi > 45) { signals.push({label:"RSI Healthy",   type:"neutral"}); score+=10; }
    }
    if (bb) {
      if (last <= bb.lower) { signals.push({label:"At BB Lower",type:"bull"}); score+=20; }
      else if (last >= bb.upper){ signals.push({label:"At BB Upper",type:"bear"}); score-=8;}
      else if (last > bb.mid)   { signals.push({label:"Above BB Mid",type:"bull"}); score+=8;}
    }
    if (chg > 1) { signals.push({label:"Positive Day",type:"bull"}); score+=10; }
    if (chg < -1){ signals.push({label:"Selling Today",type:"bear"}); score-=10; }
    return { last, prev, chg, chg5:chg, rsi, bb, sm20, score, signals, live:true };
  } catch { return null; }
}

// ─── CLAUDE AI ────────────────────────────────────────────────────────────────
async function callClaude(messages, system = "", pdfB64 = null) {
  const content = pdfB64
    ? [{ type:"document", source:{ type:"base64", media_type:"application/pdf", data:pdfB64 } }, { type:"text", text:messages[0].content }]
    : messages[0].content;
  const ms = [{ role:"user", content }, ...messages.slice(1)];
  const r = await fetch("https://api.anthropic.com/v1/messages", {
    method:"POST",
    headers: {
  "Content-Type": "application/json",
  "x-api-key": import.meta.env.VITE_ANTHROPIC_KEY,
  "anthropic-version": "2023-06-01",
},
    body: JSON.stringify({ model:"claude-sonnet-4-5-20250929", max_tokens:1000, system, messages:ms }),
  });
  const d = await r.json();
  return d.content?.[0]?.text || "Error connecting to AI.";
}

// ─── DEFAULTS ─────────────────────────────────────────────────────────────────
const DEFAULT_VAULT = [
  { id:1, title:"RSI Oversold Bounce",   category:"Strategy", source:"Built-in", date:"2024-01-01", content:"Buy when RSI < 30 AND price at/below Bollinger lower band. Exit when RSI crosses 50 or price hits BB mid. Works best on small/mid cap with strong fundamentals. Stop loss: 4% below entry." },
  { id:2, title:"SMA Golden Cross",      category:"Strategy", source:"Built-in", date:"2024-01-01", content:"Buy when 20-SMA crosses above 50-SMA. Strong signal with volume confirmation. Best on trending markets. Avoid penny stocks. Stop: below the 20-SMA." },
  { id:3, title:"Bollinger Band Squeeze",category:"Indicator",source:"Built-in", date:"2024-01-01", content:"When bands narrow (low volatility), a big move is coming soon. Wait for the breakout direction before entering. Volume confirmation is essential." },
  { id:4, title:"1% Risk Rule",          category:"Rule",     source:"Built-in", date:"2024-01-01", content:"Never risk more than 1-2% of capital on one trade. Position Size = (Account × 0.01) ÷ (Entry − Stop Loss)." },
  { id:5, title:"India: Nifty Midcap Momentum", category:"Strategy", source:"Built-in", date:"2024-01-01", content:"Nifty Midcap 150 stocks with RSI 50-65, price above 20-SMA, 5-day return > 3%. Enter on morning dip. Target 8-10% in 2-3 weeks. Stop at 20-SMA." },
];

const CAT_C = { Strategy:"#10b981", Indicator:"#06b6d4", Rule:"#f59e0b", Concept:"#8b5cf6", Pattern:"#ec4899", Idea:"#f97316", "PDF Extract":"#a78bfa" };

// ─── SPARKLINE ────────────────────────────────────────────────────────────────
function Spark({ data, color }) {
  const mn=Math.min(...data), mx=Math.max(...data), rng=mx-mn||1;
  const W=72,H=26;
  const pts = data.map((v,i)=>`${(i/(data.length-1))*W},${H-((v-mn)/rng)*H}`).join(" ");
  return <svg width={W} height={H}><polyline points={pts} fill="none" stroke={color} strokeWidth="1.8"/></svg>;
}

// ─── STYLES ────────────────────────────────────────────────────────────────────
const S = {
  app:    { background:T.bg, minHeight:"100vh", color:T.text, fontFamily:T.sans, fontSize:"13px" },
  header: { background:T.surface, borderBottom:`1px solid ${T.border}`, padding:"8px 16px", display:"flex", alignItems:"center", gap:"8px", position:"sticky", top:0, zIndex:20 },
  logo:   { fontFamily:T.display, fontSize:"16px", fontWeight:"800", letterSpacing:"-0.5px", marginRight:"6px" },
  tab: a => ({ padding:"5px 11px", borderRadius:"6px", cursor:"pointer", fontFamily:T.sans, fontWeight:"600", fontSize:"11px", border:"none", background: a?"rgba(255,255,255,0.08)":"transparent", color: a?T.text:T.muted, transition:"all 0.15s" }),
  panel:  { padding:"14px 18px", maxWidth:"920px", margin:"0 auto" },
  card: x => ({ background:T.card, border:`1px solid ${T.border}`, borderRadius:"10px", padding:"13px 15px", marginBottom:"9px", ...x }),
  input:  { background:T.surface, border:`1px solid ${T.border}`, borderRadius:"7px", color:T.text, padding:"8px 11px", fontFamily:T.sans, fontSize:"13px", outline:"none", width:"100%", boxSizing:"border-box" },
  btn:  c => ({ background:"transparent", border:`1px solid ${c||T.muted}`, color:c||T.muted, padding:"6px 13px", borderRadius:"7px", cursor:"pointer", fontFamily:T.sans, fontSize:"11px", fontWeight:"600" }),
  fill: c => ({ background:c||T.us, border:"none", color:"#fff", padding:"8px 16px", borderRadius:"7px", cursor:"pointer", fontFamily:T.sans, fontSize:"12px", fontWeight:"700" }),
  label:  { fontSize:"10px", color:T.muted, letterSpacing:"0.8px", marginBottom:"4px", display:"block", textTransform:"uppercase" },
  badge: c => ({ background:`${c}18`, color:c, border:`1px solid ${c}35`, borderRadius:"4px", padding:"2px 7px", fontSize:"10px", fontWeight:"600", display:"inline-block", fontFamily:T.mono }),
  select: { background:T.surface, border:`1px solid ${T.border}`, borderRadius:"7px", color:T.text, padding:"7px 9px", fontFamily:T.sans, fontSize:"12px", outline:"none", width:"100%" },
  section:{ fontSize:"10px", color:T.muted, letterSpacing:"1.5px", marginBottom:"10px", textTransform:"uppercase" },
  metric: { background:T.surface, border:`1px solid ${T.faint}`, borderRadius:"8px", padding:"10px 12px", textAlign:"center" },
};

// ─── SCREENER CARD ────────────────────────────────────────────────────────────
function StockCard({ s, accent, onExpand, expanded, onSave, onBacktest }) {
  return (
    <div style={{ ...S.card(), cursor:"pointer", borderColor: expanded ? accent : T.border, transition:"border-color 0.2s" }} onClick={onExpand}>
      <div style={{ display:"flex", alignItems:"center", gap:"10px", flexWrap:"wrap" }}>
        {/* Symbol */}
        <div style={{ minWidth:"70px" }}>
          <div style={{ fontFamily:T.mono, fontWeight:"600", fontSize:"13px", color:T.text }}>{s.sym}</div>
          <div style={{ fontSize:"10px", color:T.muted, marginTop:"1px" }}>{s.cap?.toUpperCase()}</div>
        </div>
        {/* Name + sector */}
        <div style={{ flex:1, minWidth:"100px" }}>
          <div style={{ fontSize:"12px", fontWeight:"500", color:T.text }}>{s.name}</div>
          <div style={{ fontSize:"10px", color:T.muted }}>{s.sector}</div>
        </div>
        {/* Live badge */}
        {s.live && <span style={S.badge(T.green)}>LIVE</span>}
        {!s.live && <span style={S.badge(T.muted)}>DEMO</span>}
        {/* Sparkline */}
        <Spark data={s.spark || s.closes?.slice(-15) || []} color={s.chg >= 0 ? T.green : T.red} />
        {/* Price */}
        <div style={{ textAlign:"right", minWidth:"70px" }}>
          <div style={{ fontFamily:T.mono, fontSize:"14px", fontWeight:"600" }}>{s.currency}{s.last?.toLocaleString()}</div>
          <div style={{ fontFamily:T.mono, fontSize:"11px", color: s.chg >= 0 ? T.green : T.red }}>{s.chg >= 0 ? "+" : ""}{s.chg}%</div>
        </div>
        {/* RSI */}
        <div style={{ textAlign:"center", minWidth:"36px" }}>
          <div style={S.label}>RSI</div>
          <div style={{ fontFamily:T.mono, fontSize:"13px", color: s.rsi < 35 ? T.green : s.rsi > 65 ? T.red : T.in }}>{s.rsi ?? "—"}</div>
        </div>
        {/* Score */}
        <div style={{ textAlign:"center", minWidth:"44px" }}>
          <div style={S.label}>SCORE</div>
          <div style={{ fontFamily:T.display, fontSize:"20px", fontWeight:"800", color: s.score >= 50 ? T.green : s.score >= 25 ? T.in : T.muted }}>{s.score}</div>
        </div>
      </div>

      {expanded && (
        <div style={{ marginTop:"12px", paddingTop:"12px", borderTop:`1px solid ${T.border}` }}>
          <div style={{ display:"flex", gap:"6px", flexWrap:"wrap", marginBottom:"10px" }}>
            {s.signals?.map((sg,i) => <span key={i} style={S.badge(sg.type==="bull"?T.green:sg.type==="bear"?T.red:T.in)}>{sg.label}</span>)}
          </div>
          <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:"7px", marginBottom:"10px" }}>
            {[["BB Upper", s.bb?.upper ? `${s.currency}${s.bb.upper}` : "—"],
              ["BB Mid",   s.bb?.mid   ? `${s.currency}${s.bb.mid}`   : "—"],
              ["BB Lower", s.bb?.lower ? `${s.currency}${s.bb.lower}` : "—"],
            ].map(([l,v]) => <div key={l} style={S.metric}><div style={S.label}>{l}</div><div style={{fontFamily:T.mono,fontSize:"12px"}}>{v}</div></div>)}
          </div>
          <div style={{ display:"flex", gap:"8px", flexWrap:"wrap" }}>
            <button style={S.fill(accent)} onClick={e=>{e.stopPropagation();onBacktest();}}>📊 Backtest</button>
            <button style={S.btn(T.green)} onClick={e=>{e.stopPropagation();onSave();}}>💾 Save to Vault</button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── MAIN APP ─────────────────────────────────────────────────────────────────
export default function TradeVaultPro() {
  useFonts();
  const [tab, setTab]       = useState("us");
  const [apiKeys, setApiKeys] = useState({ td:"", claude:"" });
  const [showSettings, setShowSettings] = useState(false);
  const [keysInput, setKeysInput] = useState({ td:"", claude:"" });

  // ── Stock data states ──
  const [usData, setUsData]   = useState(SIM_US);
  const [inData, setInData]   = useState(SIM_IN);
  const [usLoading, setUsLoading] = useState(false);
  const [inLoading, setInLoading] = useState(false);
  const [fetchedUs, setFetchedUs] = useState(false);
  const [fetchedIn, setFetchedIn] = useState(false);
  const [expandedSym, setExpandedSym] = useState(null);

  // ── Filters ──
  const [usCapFilter, setUsCapFilter] = useState("all");
  const [inCapFilter, setInCapFilter] = useState("all");
  const [usSortBy,    setUsSortBy]    = useState("score");
  const [inSortBy,    setInSortBy]    = useState("score");
  const [minScore,    setMinScore]    = useState(20);

  // ── Vault ──
  const [vault, setVault]     = useState(DEFAULT_VAULT);
  const [vSearch, setVSearch] = useState("");
  const [vCat,    setVCat]    = useState("All");
  const [showVF,  setShowVF]  = useState(false);
  const [newV,    setNewV]    = useState({ title:"", category:"Concept", content:"" });
  const [stOk,    setStOk]    = useState(false);

  // ── Tutor ──
  const [msgs, setMsgs]       = useState([{ role:"assistant", content:"Welcome to TradeVault Pro!\n\nI cover both 🇺🇸 US markets (NYSE/NASDAQ) and 🇮🇳 Indian markets (NSE/BSE).\n\nAsk me anything:\n• 'What are the best small cap Indian IT stocks to watch?'\n• 'Explain how RSI works differently in Indian vs US markets'\n• 'What is Nifty 50?'\n• 'How do penny stocks differ between US and India?'" }]);
  const [tin,   setTin]       = useState("");
  const [tload, setTload]     = useState(false);
  const msgEnd = useRef(null);

  // ── PDF ──
  const [pdfB64,   setPdfB64]   = useState(null);
  const [pdfName,  setPdfName]  = useState("");
  const [pdfLoad,  setPdfLoad]  = useState(false);
  const [pdfRes,   setPdfRes]   = useState(null);
  const [pdfPr,    setPdfPr]    = useState("Extract all trading strategies, indicators, entry/exit rules, and key concepts. Format each as: TITLE | CATEGORY (Strategy/Indicator/Rule/Pattern) | DESCRIPTION");
  const fileRef = useRef(null);

  // ── Ideas ──
  const [idea,     setIdea]     = useState("");
  const [ideaSrc,  setIdeaSrc]  = useState("Social Media");
  const [ideaLoad, setIdeaLoad] = useState(false);
  const [ideaRes,  setIdeaRes]  = useState(null);

  // ── Daily Picks ──
  const [picks,    setPicks]    = useState(null);
  const [picksLoad,setPicksLoad]= useState(false);
  const today = new Date().toDateString();

  // ── Backtest ──
  const [btSym,    setBtSym]    = useState("CRWD");
  const [btMkt,    setBtMkt]    = useState("us");
  const [btStrat,  setBtStrat]  = useState("rsi");
  const [btP,      setBtP]      = useState({ oversold:30, overbought:70, fast:10, slow:30 });
  const [btRes,    setBtRes]    = useState(null);

  // ── Load/save vault ──
  useEffect(() => {
    (async()=>{ try{ const r=await window.storage.get("tvp3-vault"); if(r) setVault(JSON.parse(r.value)); }catch{} setStOk(true); })();
  },[]);
 useEffect(() => {
  if (!stOk) return;

  try {
    localStorage.setItem("tvp3-vault", JSON.stringify(vault));
  } catch (err) {
    console.error("Storage failed:", err);
  }
}, [vault, stOk]);


  useEffect(() => { msgEnd.current?.scrollIntoView({behavior:"smooth"}); },[msgs]);

  // ── Load API keys from storage ──
  useEffect(() => {
    (async()=>{
      try{ const r=await window.storage.get("tvp3-keys"); if(r){ const k=JSON.parse(r.value); setApiKeys(k); setKeysInput(k); } }catch{}
    })();
  },[]);

  const saveKeys = () => {
    setApiKeys(keysInput);
    window.storage.set("tvp3-keys",JSON.stringify(keysInput)).catch(()=>{});
    setShowSettings(false);
    setFetchedUs(false);
    setFetchedIn(false);
  };

  // ── Fetch real US data ──
  const fetchUsData = useCallback(async () => {
    if (!apiKeys.td || usLoading) return;
    setUsLoading(true);
    const results = await Promise.all(
      US_STOCKS.slice(0,8).map(s => fetchRealStock(s.sym, null, apiKeys.td))
    );
    setUsData(prev => prev.map((s,i) => {
      const r = results[i];
      if (!r) return s;
      return { ...s, ...r, spark: [...(s.spark||[]).slice(-14), r.last] };
    }));
    setFetchedUs(true);
    setUsLoading(false);
  }, [apiKeys.td, usLoading]);

  // ── Fetch real India data ──
  const fetchInData = useCallback(async () => {
    if (!apiKeys.td || inLoading) return;
    setInLoading(true);
    const results = await Promise.all(
      IN_STOCKS.slice(0,8).map(s => fetchRealStock(s.sym, s.exch, apiKeys.td))
    );
    setInData(prev => prev.map((s,i) => {
      const r = results[i];
      if (!r) return s;
      return { ...s, ...r, spark: [...(s.spark||[]).slice(-14), r.last] };
    }));
    setFetchedIn(true);
    setInLoading(false);
  }, [apiKeys.td, inLoading]);

  // ── Auto-fetch when switching to market tabs ──
  useEffect(() => {
    if (tab === "us" && apiKeys.td && !fetchedUs)  fetchUsData();
    if (tab === "in" && apiKeys.td && !fetchedIn)  fetchInData();
  }, [tab, apiKeys.td]);

  // ── Filtered + sorted stocks ──
  const filterSort = (data, capF, sortF) =>
    data.filter(s => capF==="all" || s.cap===capF)
        .filter(s => s.score >= minScore)
        .sort((a,b) => sortF==="score" ? b.score-a.score : sortF==="chg" ? b.chg-a.chg : a.rsi-b.rsi);

  const usFiltered = filterSort(usData, usCapFilter, usSortBy);
  const inFiltered = filterSort(inData, inCapFilter, inSortBy);

  const saveStock = (s) => setVault(p => [{
    id:Date.now(), title:`${s.sym} – ${s.name}`, category:"Idea",
    content:`Price: ${s.currency}${s.last} | Score: ${s.score} | RSI: ${s.rsi}\nChg: ${s.chg}% | Signals: ${s.signals?.map(x=>x.label).join(", ")}\nBB Upper: ${s.currency}${s.bb?.upper} | Mid: ${s.currency}${s.bb?.mid} | Lower: ${s.currency}${s.bb?.lower}`,
    source:"Screener", date:new Date().toISOString().slice(0,10)
  }, ...p]);

  // ── Backtest ──
  const runBt = () => {
    const pool = btMkt === "us" ? SIM_US : SIM_IN;
    const stock = pool.find(s => s.sym === btSym);
    if (!stock) return;
    const closes = stock.closes;
    let signals = new Array(closes.length).fill(0);
    if (btStrat === "rsi") {
      const r = closes.map((_,i)=>i<15?null:rsiOf(closes.slice(0,i+1)));
      r.forEach((v,i)=>{
        if(!v||!r[i-1]) return;
        if(v<btP.oversold&&r[i-1]>=btP.oversold) signals[i]=1;
        else if(v>btP.overbought&&r[i-1]<=btP.overbought) signals[i]=-1;
      });
    } else {
      const fast=smaArr(closes,btP.fast), slow=smaArr(closes,btP.slow);
      closes.forEach((_,i)=>{
        if(!fast[i]||!slow[i]||i===0) return;
        if(fast[i]>slow[i]&&fast[i-1]<=slow[i-1]) signals[i]=1;
        else if(fast[i]<slow[i]&&fast[i-1]>=slow[i-1]) signals[i]=-1;
      });
    }
    let cash=10000, shares=0, inT=false, entry=0, trades=[], equity=[];
    closes.forEach((p,i)=>{
      if(signals[i]===1&&!inT){ shares=Math.floor(cash/p); cash-=shares*p; inT=true; entry=p; }
      else if(signals[i]===-1&&inT){ trades.push({pnl:+(shares*(p-entry)).toFixed(2),win:shares*(p-entry)>0}); cash+=shares*p; shares=0; inT=false; }
      equity.push(+(cash+shares*p).toFixed(2));
    });
    if(inT) cash+=shares*closes.at(-1);
    let peak=equity[0], mdd=0;
    for(const v of equity){ if(v>peak)peak=v; mdd=Math.max(mdd,(peak-v)/peak*100); }
    const wins=trades.filter(t=>t.win);
    const currency = btMkt === "in" ? "₹" : "$";
    setBtRes({
      equity: equity.map((v,i)=>({i,v})),
      metrics:{ ret:+((cash-10000)/100).toFixed(2), trades:trades.length, winRate:trades.length?+(wins.length/trades.length*100).toFixed(1):0, mdd:+mdd.toFixed(2), final:+cash.toFixed(2) }
    });
  };

  // ── Tutor ──
  const sendTutor = async () => {
    if(!tin.trim()||tload) return;
    const um={role:"user",content:tin};
    const history=[...msgs,um];
    setMsgs(history); setTin(""); setTload(true);
    const vCtx=vault.slice(0,8).map(e=>`${e.title}(${e.category}):${e.content.slice(0,100)}`).join("\n");
    try{
      const reply=await callClaude(history.map(m=>({role:m.role,content:m.content})),
        `You are an expert stock trading tutor covering both US markets (NYSE/NASDAQ) and Indian markets (NSE/BSE). The user is a beginner.
User's saved strategies:\n${vCtx}
Guidelines: explain simply with analogies, mention both markets where relevant, 3-4 paragraphs, suggest saving insights to vault, no specific buy/sell recommendations.`);
      setMsgs(p=>[...p,{role:"assistant",content:reply}]);
    }catch{ setMsgs(p=>[...p,{role:"assistant",content:"Connection error."}]); }
    setTload(false);
  };

  // ── PDF ──
  const analyzePdf = async () => {
    if(!pdfB64||pdfLoad) return;
    setPdfLoad(true); setPdfRes(null);
    try{ const r=await callClaude([{role:"user",content:pdfPr}],"You are a trading strategy extraction expert. Extract actionable knowledge.",pdfB64); setPdfRes(r); }
    catch{ setPdfRes("Error analyzing PDF."); }
    setPdfLoad(false);
  };

  const savePdfToVault = () => {
    if(!pdfRes) return;
    const lines=pdfRes.split("\n").filter(l=>l.includes("|"));
    const entries=lines.map(l=>{ const[t,c,co]=l.split("|").map(s=>s.trim()); return{id:Date.now()+Math.random(),title:t||"PDF Extract",category:["Strategy","Indicator","Rule","Pattern"].includes(c)?c:"PDF Extract",content:co||l,source:pdfName,date:new Date().toISOString().slice(0,10)}; }).filter(e=>e.content?.length>10);
    setVault(p=>[...(entries.length?entries:[{id:Date.now(),title:`From ${pdfName}`,category:"PDF Extract",content:pdfRes.slice(0,500),source:pdfName,date:new Date().toISOString().slice(0,10)}]),...p]);
    alert(`✅ Saved ${entries.length||1} entries!`);
  };

  // ── Ideas ──
  const analyzeIdea = async () => {
    if(!idea.trim()||ideaLoad) return;
    setIdeaLoad(true); setIdeaRes(null);
    try{
      const r=await callClaude([{role:"user",content:`Analyze this trading idea from ${ideaSrc}:\n\n"${idea}"\n\nProvide: 1)Title 2)Category 3)Cleaned strategy 4)Entry/exit rules 5)Risk level 6)Verdict — valid or not?`}],
        "You are a professional trading analyst. Evaluate strategies critically. Be concise and honest.");
      setIdeaRes(r);
    }catch{ setIdeaRes("Error analyzing idea."); }
    setIdeaLoad(false);
  };

  // ── Daily Picks ──
  const genPicks = async () => {
    setPicksLoad(true); setPicks(null);
    const topUs=usData.sort((a,b)=>b.score-a.score).slice(0,6).map(s=>`[US] ${s.sym}(${s.name}):$${s.last} RSI:${s.rsi} ${s.chg}%/day Score:${s.score} Signals:${s.signals?.map(x=>x.label).join(",")}`).join("\n");
    const topIn=inData.sort((a,b)=>b.score-a.score).slice(0,6).map(s=>`[IN] ${s.sym}(${s.name}):₹${s.last} RSI:${s.rsi} ${s.chg}%/day Score:${s.score} Signals:${s.signals?.map(x=>x.label).join(",")}`).join("\n");
    const vCtx=vault.slice(0,8).map(e=>`${e.title}(${e.category}):${e.content.slice(0,150)}`).join("\n");
    try{
      const r=await callClaude([{role:"user",content:`Date: ${today}\n\nMY STRATEGY VAULT:\n${vCtx}\n\nUS STOCK SIGNALS:\n${topUs}\n\nINDIAN STOCK SIGNALS:\n${topIn}\n\nGive me TOP 3 picks (mix of US and India based on signals). For each:\n1. Symbol + market flag 🇺🇸/🇮🇳\n2. Why it matches my vault strategies\n3. Entry zone\n4. Stop loss\n5. Target\n6. Confidence (1-10)\n7. Key risk`}],
        "You are a dual-market analyst covering US and Indian stocks. Match signals to the user's strategies. Always note that this is educational/simulation only.");
      setPicks(r);
    }catch{ setPicks("Error generating picks."); }
    setPicksLoad(false);
  };

  // ─── RENDER ──────────────────────────────────────────────────────────────────
  const TABS = [["us","🇺🇸 US"], ["in","🇮🇳 India"], ["picks","🎯 Picks"], ["pdf","📄 PDF"], ["ideas","💡 Ideas"], ["vault","🗄 Vault"], ["backtest","📊 Backtest"], ["tutor","🤖 Tutor"]];

  return (
    <div style={S.app}>
      {/* ── HEADER ── */}
      <div style={S.header}>
        <span style={{...S.logo, background:"linear-gradient(90deg,#3b82f6,#f59e0b)", WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent"}}>TradeVault</span>
        <div style={{width:"1px",height:"18px",background:T.border,margin:"0 2px"}}/>
        <div style={{display:"flex",gap:"3px",flexWrap:"wrap"}}>
          {TABS.map(([id,label])=><button key={id} style={S.tab(tab===id)} onClick={()=>setTab(id)}>{label}</button>)}
        </div>
        <button style={{...S.btn(T.muted),marginLeft:"auto",fontSize:"10px",padding:"4px 10px"}} onClick={()=>setShowSettings(!showSettings)}>⚙ Keys</button>
        <span style={{fontFamily:T.mono,fontSize:"9px",color:T.muted,marginLeft:"6px"}}>{vault.length} saved</span>
      </div>

      {/* ── SETTINGS PANEL ── */}
      {showSettings && (
        <div style={{background:T.surface,borderBottom:`1px solid ${T.border}`,padding:"14px 20px",maxWidth:"920px",margin:"0 auto"}}>
          <div style={{...S.section,marginBottom:"12px"}}>API Keys — stored locally, never shared</div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"12px",marginBottom:"12px"}}>
            <div>
              <label style={S.label}>Twelve Data API Key (US + India stocks)</label>
              <input style={S.input} type="password" placeholder="Get free at twelvedata.com" value={keysInput.td} onChange={e=>setKeysInput(p=>({...p,td:e.target.value}))} />
              <div style={{fontSize:"10px",color:T.muted,marginTop:"4px"}}>Free tier: 800 calls/day · Covers NYSE, NASDAQ, NSE, BSE</div>
            </div>
            <div>
              <label style={S.label}>Anthropic API Key (AI Tutor + Picks)</label>
              <input style={S.input} type="password" placeholder="Get at console.anthropic.com" value={keysInput.claude} onChange={e=>setKeysInput(p=>({...p,claude:e.target.value}))} />
              <div style={{fontSize:"10px",color:T.muted,marginTop:"4px"}}>Used for Tutor, PDF analysis, Daily Picks, Idea validation</div>
            </div>
          </div>
          <div style={{display:"flex",gap:"8px",alignItems:"center"}}>
            <button style={S.fill(T.us)} onClick={saveKeys}>Save Keys</button>
            <button style={S.btn(T.muted)} onClick={()=>setShowSettings(false)}>Cancel</button>
            {apiKeys.td && <span style={{...S.badge(T.green),marginLeft:"4px"}}>Twelve Data: Active</span>}
            {!apiKeys.td && <span style={{...S.badge(T.muted),marginLeft:"4px"}}>Demo Mode — no keys set</span>}
          </div>
        </div>
      )}

      {/* ─────────────── US SCREENER ─────────────── */}
      {tab === "us" && (
        <div style={S.panel}>
          <div style={{display:"flex",gap:"10px",flexWrap:"wrap",marginBottom:"12px",marginTop:"10px",alignItems:"flex-end"}}>
            <div><label style={S.label}>Cap Type</label>
              <select style={{...S.select,width:"130px"}} value={usCapFilter} onChange={e=>setUsCapFilter(e.target.value)}>
                <option value="all">All</option><option value="mid">Mid Cap</option><option value="small">Small Cap</option><option value="penny">Penny</option>
              </select>
            </div>
            <div><label style={S.label}>Sort By</label>
              <select style={{...S.select,width:"130px"}} value={usSortBy} onChange={e=>setUsSortBy(e.target.value)}>
                <option value="score">Signal Score</option><option value="chg">Day Change</option><option value="rsi">RSI Lowest</option>
              </select>
            </div>
            <div><label style={S.label}>Min Score: {minScore}</label>
              <input type="range" min={0} max={50} value={minScore} onChange={e=>setMinScore(+e.target.value)} style={{width:"100px",accentColor:T.us,display:"block"}}/>
            </div>
            <div style={{marginLeft:"auto",display:"flex",gap:"8px",alignItems:"flex-end"}}>
              {!apiKeys.td && <span style={S.badge(T.in)}>DEMO DATA</span>}
              {apiKeys.td && !fetchedUs && <button style={S.fill(T.us)} onClick={fetchUsData} disabled={usLoading}>{usLoading?"Loading…":"🔄 Load Live Data"}</button>}
              {fetchedUs && <span style={S.badge(T.green)}>LIVE ✓</span>}
            </div>
          </div>
          {!apiKeys.td && (
            <div style={{...S.card({borderColor:`${T.in}40`,background:`${T.in}08`}),fontSize:"12px",color:T.in,marginBottom:"10px",lineHeight:"1.7"}}>
              ⚡ <strong>Demo Mode</strong> — prices are simulated. Add your free Twelve Data key via ⚙ Keys to get real NYSE/NASDAQ data. Sign up free at <strong>twelvedata.com</strong>
            </div>
          )}
          <div style={{...S.section}}>🇺🇸 US Stocks — {usFiltered.length} showing</div>
          {usFiltered.map(s=>(
            <StockCard key={s.sym} s={s} accent={T.us}
              expanded={expandedSym===s.sym} onExpand={()=>setExpandedSym(expandedSym===s.sym?null:s.sym)}
              onSave={()=>saveStock(s)} onBacktest={()=>{setBtSym(s.sym);setBtMkt("us");setTab("backtest");}}/>
          ))}
        </div>
      )}

      {/* ─────────────── INDIA SCREENER ─────────────── */}
      {tab === "in" && (
        <div style={S.panel}>
          <div style={{display:"flex",gap:"10px",flexWrap:"wrap",marginBottom:"12px",marginTop:"10px",alignItems:"flex-end"}}>
            <div><label style={S.label}>Cap Type</label>
              <select style={{...S.select,width:"130px"}} value={inCapFilter} onChange={e=>setInCapFilter(e.target.value)}>
                <option value="all">All</option><option value="large">Large Cap</option><option value="mid">Mid Cap</option><option value="small">Small Cap</option>
              </select>
            </div>
            <div><label style={S.label}>Sort By</label>
              <select style={{...S.select,width:"130px"}} value={inSortBy} onChange={e=>setInSortBy(e.target.value)}>
                <option value="score">Signal Score</option><option value="chg">Day Change</option><option value="rsi">RSI Lowest</option>
              </select>
            </div>
            <div><label style={S.label}>Min Score: {minScore}</label>
              <input type="range" min={0} max={50} value={minScore} onChange={e=>setMinScore(+e.target.value)} style={{width:"100px",accentColor:T.in,display:"block"}}/>
            </div>
            <div style={{marginLeft:"auto",display:"flex",gap:"8px",alignItems:"flex-end"}}>
              {!apiKeys.td && <span style={S.badge(T.in)}>DEMO DATA</span>}
              {apiKeys.td && !fetchedIn && <button style={S.fill(T.in)} onClick={fetchInData} disabled={inLoading}>{inLoading?"Loading…":"🔄 Load Live NSE Data"}</button>}
              {fetchedIn && <span style={S.badge(T.green)}>LIVE ✓</span>}
            </div>
          </div>
          {!apiKeys.td && (
            <div style={{...S.card({borderColor:`${T.in}40`,background:`${T.in}08`}),fontSize:"12px",color:T.in,marginBottom:"10px",lineHeight:"1.7"}}>
              ⚡ <strong>Demo Mode</strong> — prices are simulated. Add your Twelve Data key to get real NSE data for RELIANCE, TCS, INFY and more. Free at <strong>twelvedata.com</strong>
            </div>
          )}
          <div style={S.section}>🇮🇳 NSE/BSE Stocks — {inFiltered.length} showing</div>
          {inFiltered.map(s=>(
            <StockCard key={s.sym} s={s} accent={T.in}
              expanded={expandedSym===s.sym} onExpand={()=>setExpandedSym(expandedSym===s.sym?null:s.sym)}
              onSave={()=>saveStock(s)} onBacktest={()=>{setBtSym(s.sym);setBtMkt("in");setTab("backtest");}}/>
          ))}
        </div>
      )}

      {/* ─────────────── DAILY PICKS ─────────────── */}
      {tab === "picks" && (
        <div style={S.panel}>
          <div style={{...S.card({borderColor:`${T.us}40`,background:`linear-gradient(135deg,${T.us}08,${T.in}08)`}),marginTop:"10px"}}>
            <div style={{fontFamily:T.display,fontSize:"15px",fontWeight:"800",marginBottom:"8px"}}>🎯 Dual-Market Daily Picks</div>
            <div style={{fontSize:"12px",color:T.muted,lineHeight:"1.7",marginBottom:"14px"}}>
              Claude reads your vault ({vault.length} entries) and cross-references with signals from <strong style={{color:T.us}}>🇺🇸 {usData.length} US stocks</strong> + <strong style={{color:T.in}}>🇮🇳 {inData.length} Indian stocks</strong> to find today's best opportunities matching your strategies.
            </div>
            <div style={{display:"flex",gap:"10px",alignItems:"center",flexWrap:"wrap"}}>
              <button style={S.fill()} onClick={genPicks} disabled={picksLoad}>{picksLoad?"⏳ Analysing both markets...":"⚡ Generate Today's Picks"}</button>
              <span style={{fontFamily:T.mono,fontSize:"10px",color:T.muted}}>📅 {today}</span>
            </div>
          </div>
          {picksLoad && (
            <div style={{...S.card(),textAlign:"center",padding:"40px"}}>
              <div style={{fontSize:"28px",marginBottom:"10px"}}>🧠</div>
              <div style={{color:T.muted,fontSize:"12px",lineHeight:"1.8"}}>Reading your vault strategies...<br/>Scanning US signals...<br/>Scanning NSE signals...<br/>Matching to your strategies...</div>
            </div>
          )}
          {picks && (
            <div style={S.card({borderColor:`${T.green}30`})}>
              <div style={{...S.section,color:T.green}}>TODAY'S AI PICKS — {today}</div>
              <div style={{fontSize:"12px",lineHeight:"1.85",whiteSpace:"pre-wrap",color:T.text,marginBottom:"12px"}}>{picks}</div>
              <div style={{padding:"10px 12px",background:`${T.in}08`,border:`1px solid ${T.in}25`,borderRadius:"7px",fontSize:"11px",color:T.in,lineHeight:"1.6",marginBottom:"10px"}}>
                ⚠️ Educational only. Based on {apiKeys.td?"live":"simulated"} data and your saved notes. Paper trade first. Not financial advice.
              </div>
              <button style={S.btn(T.green)} onClick={()=>setVault(p=>[{id:Date.now(),title:`Daily Picks — ${today}`,category:"Idea",content:picks,source:"AI Picks",date:new Date().toISOString().slice(0,10)},...p])}>💾 Save to Vault</button>
            </div>
          )}
        </div>
      )}

      {/* ─────────────── PDF ANALYZER ─────────────── */}
      {tab === "pdf" && (
        <div style={S.panel}>
          <div style={{...S.section,marginTop:"10px"}}>📄 Upload Trading Books & Course PDFs</div>
          <div style={S.card()}>
            <input ref={fileRef} type="file" accept=".pdf" style={{display:"none"}} onChange={e=>{
              const f=e.target.files[0]; if(!f) return;
              setPdfName(f.name);
              const r=new FileReader();
              r.onload=ev=>{ setPdfB64(ev.target.result.split(",")[1]); setPdfRes(null); };
              r.readAsDataURL(f);
            }}/>
            {!pdfB64 ? (
              <div style={{textAlign:"center",padding:"30px",cursor:"pointer"}} onClick={()=>fileRef.current.click()}>
                <div style={{fontSize:"36px",marginBottom:"10px"}}>📚</div>
                <div style={{fontSize:"14px",fontWeight:"600",marginBottom:"6px"}}>Click to upload PDF</div>
                <div style={{fontSize:"12px",color:T.muted}}>Trading books, eBooks, course notes, strategy guides</div>
              </div>
            ):(
              <div>
                <div style={{display:"flex",alignItems:"center",gap:"10px",marginBottom:"12px"}}>
                  <span style={{fontSize:"18px"}}>📄</span>
                  <div><div style={{fontSize:"13px"}}>{pdfName}</div><div style={{fontSize:"11px",color:T.green}}>✅ Ready</div></div>
                  <button style={{...S.btn(T.muted),marginLeft:"auto",fontSize:"10px"}} onClick={()=>{setPdfB64(null);setPdfName("");setPdfRes(null);}}>Remove</button>
                </div>
                <label style={S.label}>Extraction prompt</label>
                <textarea style={{...S.input,height:"65px",resize:"none",marginBottom:"10px",fontFamily:T.mono,fontSize:"11px"}} value={pdfPr} onChange={e=>setPdfPr(e.target.value)}/>
                <button style={S.fill()} onClick={analyzePdf} disabled={pdfLoad}>{pdfLoad?"⏳ Reading...":"🔍 Analyze PDF"}</button>
              </div>
            )}
          </div>
          {pdfRes && (
            <div style={S.card()}>
              <div style={{...S.section,color:T.us}}>Extracted Knowledge</div>
              <div style={{fontSize:"12px",lineHeight:"1.8",whiteSpace:"pre-wrap",color:T.text,marginBottom:"12px",maxHeight:"320px",overflowY:"auto"}}>{pdfRes}</div>
              <div style={{display:"flex",gap:"8px"}}>
                <button style={S.fill(T.green)} onClick={savePdfToVault}>💾 Save All to Vault</button>
                <button style={S.btn(T.muted)} onClick={()=>setPdfRes(null)}>Clear</button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ─────────────── IDEAS ─────────────── */}
      {tab === "ideas" && (
        <div style={S.panel}>
          <div style={{...S.section,marginTop:"10px"}}>💡 Capture Ideas from Anywhere</div>
          <div style={S.card()}>
            <div style={{display:"flex",gap:"6px",flexWrap:"wrap",marginBottom:"10px"}}>
              {["Social Media","YouTube","Trading Course","News","My Idea","Podcast","WhatsApp Group"].map(s=>(
                <button key={s} style={{...S.btn(ideaSrc===s?T.us:T.muted),fontSize:"10px",padding:"3px 9px",background:ideaSrc===s?`${T.us}18`:"transparent"}} onClick={()=>setIdeaSrc(s)}>{s}</button>
              ))}
            </div>
            <label style={S.label}>Paste the idea / strategy ({ideaSrc})</label>
            <textarea style={{...S.input,height:"110px",resize:"vertical",marginBottom:"10px",fontFamily:T.mono,fontSize:"11px"}}
              placeholder={"Paste anything — tweet, tip from YouTube, course strategy, your own idea...\n\nExample: 'Buy Nifty midcap stocks when RSI < 30 and price near 52-week low. Exit at 15% gain.'"}
              value={idea} onChange={e=>setIdea(e.target.value)}/>
            <button style={S.fill()} onClick={analyzeIdea} disabled={ideaLoad||!idea.trim()}>{ideaLoad?"⏳ Analysing...":"🔬 Validate & Analyse"}</button>
          </div>
          {ideaRes && (
            <div style={S.card({borderColor:`${T.green}30`})}>
              <div style={{...S.section,color:T.green}}>AI Analysis</div>
              <div style={{fontSize:"12px",lineHeight:"1.8",whiteSpace:"pre-wrap",color:T.text,marginBottom:"12px"}}>{ideaRes}</div>
              <button style={S.fill(T.green)} onClick={()=>{
                setVault(p=>[{id:Date.now(),title:idea.slice(0,60),category:"Idea",content:`SOURCE: ${ideaSrc}\n\nORIGINAL:\n${idea}\n\nAI ANALYSIS:\n${ideaRes}`,source:ideaSrc,date:new Date().toISOString().slice(0,10)},...p]);
                setIdea(""); setIdeaRes(null); alert("✅ Saved!");
              }}>💾 Save to Vault</button>
            </div>
          )}
        </div>
      )}

      {/* ─────────────── VAULT ─────────────── */}
      {tab === "vault" && (
        <div style={S.panel}>
          <div style={{display:"flex",gap:"8px",flexWrap:"wrap",marginTop:"10px",marginBottom:"12px",alignItems:"center"}}>
            <input style={{...S.input,maxWidth:"180px"}} placeholder="Search..." value={vSearch} onChange={e=>setVSearch(e.target.value)}/>
            {["All","Strategy","Indicator","Rule","PDF Extract","Idea"].map(c=>(
              <button key={c} style={{...S.btn(vCat===c?T.us:T.muted),fontSize:"10px",padding:"3px 9px",background:vCat===c?`${T.us}18`:"transparent"}} onClick={()=>setVCat(c)}>{c}</button>
            ))}
            <button style={{...S.fill(),marginLeft:"auto"}} onClick={()=>setShowVF(!showVF)}>{showVF?"Cancel":"+ Add"}</button>
          </div>
          {showVF && (
            <div style={{...S.card({borderColor:`${T.green}30`}),marginBottom:"12px"}}>
              <div style={{display:"grid",gridTemplateColumns:"1fr auto",gap:"8px",marginBottom:"8px"}}>
                <input style={S.input} placeholder="Title" value={newV.title} onChange={e=>setNewV(p=>({...p,title:e.target.value}))}/>
                <select style={{...S.select,width:"140px"}} value={newV.category} onChange={e=>setNewV(p=>({...p,category:e.target.value}))}>
                  {["Strategy","Indicator","Rule","Concept","Pattern","Idea"].map(c=><option key={c}>{c}</option>)}
                </select>
              </div>
              <textarea style={{...S.input,height:"75px",resize:"vertical",marginBottom:"8px",fontFamily:T.mono,fontSize:"11px"}} placeholder="Your notes..." value={newV.content} onChange={e=>setNewV(p=>({...p,content:e.target.value}))}/>
              <button style={S.fill()} onClick={()=>{if(!newV.title||!newV.content)return;setVault(p=>[{id:Date.now(),...newV,source:"Manual",date:new Date().toISOString().slice(0,10)},...p]);setNewV({title:"",category:"Concept",content:""});setShowVF(false);}}>Save</button>
            </div>
          )}
          <div style={{fontFamily:T.mono,fontSize:"9px",color:T.muted,marginBottom:"8px"}}>{vault.filter(e=>{const q=vSearch.toLowerCase();return(!q||e.title.toLowerCase().includes(q)||e.content.toLowerCase().includes(q))&&(vCat==="All"||e.category===vCat)}).length} ENTRIES</div>
          {vault.filter(e=>{const q=vSearch.toLowerCase();return(!q||e.title.toLowerCase().includes(q)||e.content.toLowerCase().includes(q))&&(vCat==="All"||e.category===vCat)}).map(e=>(
            <div key={e.id} style={S.card()}>
              <div style={{display:"flex",alignItems:"center",gap:"8px",marginBottom:"6px"}}>
                <span style={S.badge(CAT_C[e.category]||T.us)}>{e.category}</span>
                <span style={{fontWeight:"600",fontSize:"13px"}}>{e.title}</span>
                {e.source&&<span style={{fontSize:"10px",color:T.muted}}>· {e.source}</span>}
                <span style={{marginLeft:"auto",fontSize:"10px",color:T.muted}}>{e.date}</span>
                <button onClick={()=>setVault(p=>p.filter(x=>x.id!==e.id))} style={{background:"none",border:"none",color:T.red,cursor:"pointer",fontSize:"16px",padding:"0 2px"}}>×</button>
              </div>
              <div style={{fontSize:"12px",color:T.muted,lineHeight:"1.65",whiteSpace:"pre-wrap"}}>{e.content.slice(0,280)}{e.content.length>280?"...":""}</div>
            </div>
          ))}
        </div>
      )}

      {/* ─────────────── BACKTEST ─────────────── */}
      {tab === "backtest" && (
        <div style={S.panel}>
          <div style={{...S.card(),marginTop:"10px"}}>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:"10px",marginBottom:"12px"}}>
              <div><label style={S.label}>Market</label>
                <select style={S.select} value={btMkt} onChange={e=>{setBtMkt(e.target.value);setBtRes(null);setBtSym(e.target.value==="us"?"CRWD":"RELIANCE");}}>
                  <option value="us">🇺🇸 US Market</option>
                  <option value="in">🇮🇳 Indian Market</option>
                </select>
              </div>
              <div><label style={S.label}>Stock</label>
                <select style={S.select} value={btSym} onChange={e=>{setBtSym(e.target.value);setBtRes(null);}}>
                  {(btMkt==="us"?SIM_US:SIM_IN).map(s=><option key={s.sym} value={s.sym}>{s.sym} — {s.name}</option>)}
                </select>
              </div>
              <div><label style={S.label}>Strategy</label>
                <select style={S.select} value={btStrat} onChange={e=>{setBtStrat(e.target.value);setBtRes(null);}}>
                  <option value="rsi">RSI Reversal</option>
                  <option value="sma">SMA Crossover</option>
                </select>
              </div>
            </div>
            {btStrat==="rsi" && (
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"12px",marginBottom:"12px"}}>
                <div><label style={S.label}>Oversold: {btP.oversold}</label><input type="range" min={15} max={40} value={btP.oversold} onChange={e=>setBtP(p=>({...p,oversold:+e.target.value}))} style={{width:"100%",accentColor:T.green}}/></div>
                <div><label style={S.label}>Overbought: {btP.overbought}</label><input type="range" min={60} max={85} value={btP.overbought} onChange={e=>setBtP(p=>({...p,overbought:+e.target.value}))} style={{width:"100%",accentColor:T.red}}/></div>
              </div>
            )}
            {btStrat==="sma" && (
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"12px",marginBottom:"12px"}}>
                <div><label style={S.label}>Fast: {btP.fast}d</label><input type="range" min={3} max={15} value={btP.fast} onChange={e=>setBtP(p=>({...p,fast:+e.target.value}))} style={{width:"100%",accentColor:T.us}}/></div>
                <div><label style={S.label}>Slow: {btP.slow}d</label><input type="range" min={15} max={50} value={btP.slow} onChange={e=>setBtP(p=>({...p,slow:+e.target.value}))} style={{width:"100%",accentColor:T.in}}/></div>
              </div>
            )}
            <button style={S.fill(btMkt==="us"?T.us:T.in)} onClick={runBt}>▶ Run Backtest</button>
          </div>
          {btRes && (
            <>
              <div style={{display:"grid",gridTemplateColumns:"repeat(5,1fr)",gap:"7px",marginBottom:"8px"}}>
                {[["Return",`${btRes.metrics.ret>=0?"+":""}${btRes.metrics.ret}%`,btRes.metrics.ret>=0?T.green:T.red],
                  ["Win Rate",`${btRes.metrics.winRate}%`,btRes.metrics.winRate>=50?T.green:T.in],
                  ["Max DD",`-${btRes.metrics.mdd}%`,T.red],
                  ["Trades",btRes.metrics.trades,T.us],
                  ["Final",`$${btRes.metrics.final.toLocaleString()}`,btRes.metrics.final>=10000?T.green:T.red]
                ].map(([l,v,c])=>(
                  <div key={l} style={S.metric}><div style={S.label}>{l}</div><div style={{fontFamily:T.mono,fontSize:"14px",fontWeight:"600",color:c}}>{v}</div></div>
                ))}
              </div>
              <div style={S.card()}>
                <div style={S.section}>Equity Curve · $10,000 Start</div>
                <ResponsiveContainer width="100%" height={150}>
                  <LineChart data={btRes.equity}>
                    <CartesianGrid strokeDasharray="3 3" stroke={T.faint}/>
                    <XAxis dataKey="i" tick={{fill:T.muted,fontSize:9}} tickLine={false}/>
                    <YAxis tick={{fill:T.muted,fontSize:9}} tickLine={false} width={50} tickFormatter={v=>`$${v.toFixed(0)}`}/>
                    <Tooltip contentStyle={{background:T.card,border:`1px solid ${T.border}`,fontSize:"11px"}} formatter={v=>[`$${Number(v).toFixed(2)}`,"Portfolio"]}/>
                    <ReferenceLine y={10000} stroke={T.muted} strokeDasharray="5 3"/>
                    <Line type="monotone" dataKey="v" stroke={btMkt==="us"?T.us:T.in} strokeWidth={2} dot={false} isAnimationActive={false}/>
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </>
          )}
        </div>
      )}

      {/* ─────────────── TUTOR ─────────────── */}
      {tab === "tutor" && (
        <div style={{...S.panel,display:"flex",flexDirection:"column",height:"calc(100vh - 55px)"}}>
          <div style={{flex:1,overflowY:"auto",marginBottom:"10px"}}>
            {msgs.map((m,i)=>(
              <div key={i} style={{display:"flex",justifyContent:m.role==="user"?"flex-end":"flex-start",marginBottom:"10px"}}>
                <div style={{maxWidth:"80%",padding:"11px 14px",borderRadius:"10px",fontSize:"12px",lineHeight:"1.7",
                  background:m.role==="user"?`${T.us}18`:T.card,
                  border:`1px solid ${m.role==="user"?`${T.us}35`:T.border}`,
                  color:T.text,whiteSpace:"pre-wrap"}}>
                  {m.role==="assistant"&&<div style={{fontSize:"9px",color:T.us,marginBottom:"5px",letterSpacing:"1.5px",fontFamily:T.mono}}>TRADEVAULT AI ◆</div>}
                  {m.content}
                </div>
              </div>
            ))}
            {tload&&<div style={{padding:"10px 14px",borderRadius:"10px",background:T.card,border:`1px solid ${T.border}`,display:"inline-block",color:T.us}}>▋</div>}
            <div ref={msgEnd}/>
          </div>
          <div style={{display:"flex",gap:"6px",flexWrap:"wrap",marginBottom:"8px"}}>
            {["What is Nifty 50?","Explain RSI for Indian stocks","Small cap vs mid cap India","Best US penny stock indicators","How to read candlesticks?"].map(q=>(
              <button key={q} style={{...S.btn(T.muted),fontSize:"10px",padding:"3px 9px"}} onClick={()=>setTin(q)}>{q}</button>
            ))}
          </div>
          <div style={{display:"flex",gap:"8px",paddingBottom:"10px"}}>
            <input style={{...S.input,flex:1}} placeholder="Ask about US or Indian markets..." value={tin} onChange={e=>setTin(e.target.value)} onKeyDown={e=>e.key==="Enter"&&sendTutor()}/>
            <button style={S.fill()} onClick={sendTutor} disabled={tload}>Send →</button>
          </div>
        </div>
      )}
    </div>
  );
}
