import { useState, useCallback } from "react";
import './App.css';

const fmt = (v: number) => Math.max(v,0).toLocaleString("tr-TR",{style:"currency",currency:"TRY",minimumFractionDigits:2});
const fmtNum = (v: number) => Math.max(v,0).toLocaleString("tr-TR",{minimumFractionDigits:2,maximumFractionDigits:2});

function parseTRY(str: string | number) {
  const clean = String(str||"").replace(/[₺\s.]/g,"").replace(",",".");
  return parseFloat(clean)||0;
}

function useCurrencyInput(init: string) {
  const [raw,setRaw]=useState(init);
  const [display,setDisplay]=useState(()=>fmtNum(parseTRY(init)));
  
  const handleChange=useCallback((v: string)=>{
    const s=v.replace(/[^0-9,]/g,"");
    setRaw(s);
    setDisplay(s);
  },[]);
  
  const handleBlur=useCallback(()=>setDisplay(fmtNum(parseTRY(raw))),[raw]);
  const handleFocus=useCallback(()=>setDisplay(raw.replace(/\./g,"")),[raw]);
  
  return {display,value:parseTRY(raw),handleChange,handleBlur,handleFocus};
}

interface InputRowProps {
  label: string;
  inp?: any;
  readonly?: boolean;
  readonlyVal?: number;
  pct?: boolean;
}

function InputRow({ label, inp, readonly, readonlyVal, pct }: InputRowProps) {
  if (readonly) return (
    <div className="input-card-row readonly">
      <span className="row-label">{label}</span>
      <div className="row-sep"/>
      <div className="row-right">
        {!pct && <span className="sym">₺</span>}
        <span className="row-val">{pct ? fmtNum(Math.max(readonlyVal||0,0))+"%" : fmtNum(Math.max(readonlyVal||0,0))}</span>
        <span className="auto-tag">otomatik</span>
      </div>
    </div>
  );
  if (pct) return (
    <div className="input-card-row">
      <span className="row-label">{label}</span>
      <div className="row-sep"/>
      <div className="row-right">
        <input className="pct-input" inputMode="decimal" value={inp.display}
          onChange={e=>inp.handleChange(e.target.value)}
          onFocus={inp.handleFocus} onBlur={inp.handleBlur}
          placeholder="0"/>
        <span className="sym">%</span>
      </div>
    </div>
  );
  return (
    <div className="input-card-row">
      <span className="row-label">{label}</span>
      <div className="row-sep"/>
      <div className="row-right">
        <span className="sym">₺</span>
        <input className="row-input" inputMode="decimal" value={inp.display}
          onChange={e=>inp.handleChange(e.target.value)}
          onFocus={inp.handleFocus}
          onBlur={inp.handleBlur}
          placeholder="0,00"/>
      </div>
    </div>
  );
}

function SenaryoPage({ mode, evFiyati, kiraOrani, katilimOrani }: { mode: string, evFiyati: number, kiraOrani: number, katilimOrani: number }) {
  const pesinatInp = useCurrencyInput("400000");
  const taksit1Inp = useCurrencyInput("20000");
  const taksit7Inp = useCurrencyInput("40000");
  const [sonAdet, setSonAdet] = useState(3);

  const toplamKatilim = evFiyati * katilimOrani;
  const kiraGetirisi = evFiyati * kiraOrani;
  let pesinat, taksit1;
  if (mode==="s1") { pesinat=pesinatInp.value; taksit1=toplamKatilim>pesinat?(toplamKatilim-pesinat)/6:0; }
  else { taksit1=taksit1Inp.value; pesinat=toplamKatilim-taksit1*6; }

  const taksit7 = taksit7Inp.value;
  const sonBaslangic = 25 - sonAdet;
  const ortaTaksitAdet = sonBaslangic - 7;
  const kalan = Math.max(evFiyati * 0.6 - taksit7 * ortaTaksitAdet, 0);
  const sonTaksit = kalan / sonAdet;

  const taksitler = [];
  for (let i=1; i<=24; i++) {
    if (i<=6) taksitler.push({no:i, val:taksit1});
    else if (i < sonBaslangic) taksitler.push({no:i, val:taksit7});
    else taksitler.push({no:i, val:sonTaksit});
  }
  const toplamOdeme = Math.max(pesinat,0) + taksitler.reduce((s,t)=>s+t.val,0);

  const g1 = taksitler.slice(0,6);
  const g2 = taksitler.slice(6, sonBaslangic-1);
  const g3 = taksitler.slice(sonBaslangic-1);
  const groups = [g1, g2, g3].filter(g=>g.length>0);

  const s1rows = [
    { label:"Peşinat", inp:pesinatInp },
    { label:"7. Taksit (7–"+(sonBaslangic-1)+" arası)", inp:taksit7Inp },
    { label:"1–6 arası taksit", readonly:true, readonlyVal:taksit1 },
    { label:(sonBaslangic)+"–24 arası taksit", readonly:true, readonlyVal:sonTaksit },
  ];
  const s2rows = [
    { label:"1. Taksit", inp:taksit1Inp },
    { label:"7. Taksit (7–"+(sonBaslangic-1)+" arası)", inp:taksit7Inp },
    { label:"Peşinat", readonly:true, readonlyVal:Math.max(pesinat,0) },
    { label:(sonBaslangic)+"–24 arası taksit", readonly:true, readonlyVal:sonTaksit },
  ];

  return (
    <div className="page-content">
      <div className="hint">{mode==="s1"?"Peşinat elle girilir, 1–6 taksitler otomatik hesaplanır.":"1. taksit elle girilir, peşinat otomatik hesaplanır."}</div>

      <div className="metric-grid">
        {[
          {l:"Katılım payı", v:fmt(kiraGetirisi)},
          {l:"İlk 6 ayda ödenecek taksitler", v:fmt(toplamKatilim)},
          {l:"Peşinat", v:fmt(Math.max(pesinat,0))},
          {l:"Toplam ödeme", v:fmt(Math.max(toplamOdeme,0))},
        ].map(m=>(
          <div className="metric" key={m.l}>
            <div className="metric-label">{m.l}</div>
            <div className="metric-val">{m.v}</div>
          </div>
        ))}
      </div>

      <div className="section-label">Veri girişi</div>
      <div className="input-card">
        {(mode==="s1" ? s1rows : s2rows).map((r,i)=><InputRow key={i} {...r}/>)}
      </div>

      <hr className="divider"/>

      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:12}}>
        <div className="section-label" style={{margin:0}}>Son taksit sayısı</div>
      </div>
      <div className="son-taksit-bar" style={{marginBottom:20}}>
        {[3,4,5,6].map(n=>(
          <button key={n} className={`st-btn${sonAdet===n?" active":""}`} onClick={()=>setSonAdet(n)}>
            {n} taksit
          </button>
        ))}
      </div>

      <div className="section-label">Taksit planı</div>
      
      <div className="taksit-summary-mini">
        <div className="taksit-row-summary">
          <span className="taksit-no">Katılım Payı</span>
          <span className="taksit-val-bold">{fmt(kiraGetirisi)}</span>
        </div>
        <div className="taksit-row-summary">
          <span className="taksit-no">Peşinat</span>
          <span className="taksit-val-bold">{fmt(Math.max(pesinat,0))}</span>
        </div>
      </div>

      {groups.map((g,gi)=>(
        <div className="taksit-group" key={gi}>
          {g.map(t=>(
            <div className="taksit-row" key={t.no}>
              <span className="taksit-no">{t.no}. taksit</span>
              <span className="taksit-val">{fmt(t.val)}</span>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

function OrtakPage({ evInp, kiraInp, katilimInp }: any) {
  return (
    <div className="page-content">
      <div className="section-label">Talep bilgileri</div>
      <div className="input-card">
        <InputRow label="Talep tutarı" inp={evInp} />
        <InputRow label="Katılım payı oranı" inp={kiraInp} pct />
        <InputRow label="Teslimat oranı" inp={katilimInp} pct />
      </div>

      <hr className="divider"/>
      <div className="section-label">Özet</div>
      {[
        ["Katılım payı", fmt(evInp.value * kiraInp.value / 100)],
        ["İlk 6 ayda ödenecek taksitler", fmt(evInp.value * katilimInp.value / 100)],
        ["Toplam fiyat", fmt(evInp.value * kiraInp.value / 100 + evInp.value * katilimInp.value / 100)],
      ].map(([l,v],i,arr)=>(
        <div className="summary-row" key={l} style={i===arr.length-1?{borderTop:"1px solid var(--color-border-secondary)",marginTop:4,paddingTop:12}:{}}>
          <span className="summary-key" style={i===arr.length-1?{fontWeight:500,color:"var(--color-text-primary)"}:{}}>{l}</span>
          <span className="summary-val" style={i===arr.length-1?{fontSize:15}:{}}>{v}</span>
        </div>
      ))}
    </div>
  );
}

const TABS = [{key:"ortak",label:"Parametreler"},{key:"s1",label:"Senaryo 1"},{key:"s2",label:"Senaryo 2"}];

export default function App() {
  const [tab, setTab] = useState("ortak");
  const evInp = useCurrencyInput("2000000");
  const kiraInp = useCurrencyInput("7");
  const katilimInp = useCurrencyInput("40");
  
  return (
    <div className="app-main">
      <div className="app-container">
        <div className="title">Katılım Ev</div>
        <div className="sub">Senaryo karşılaştırma paneli</div>
        <div className="tabs">
          {TABS.map(t=>(
            <button key={t.key} className={`tab${tab===t.key?" active":""}`} onClick={()=>setTab(t.key)}>{t.label}</button>
          ))}
        </div>
        {tab==="ortak" && <div className="page-anim"><OrtakPage evInp={evInp} kiraInp={kiraInp} katilimInp={katilimInp}/></div>}
        {tab==="s1" && <div className="page-anim"><SenaryoPage mode="s1" evFiyati={evInp.value} kiraOrani={kiraInp.value/100} katilimOrani={katilimInp.value/100}/></div>}
        {tab==="s2" && <div className="page-anim"><SenaryoPage mode="s2" evFiyati={evInp.value} kiraOrani={kiraInp.value/100} katilimOrani={katilimInp.value/100}/></div>}
      </div>
    </div>
  );
}
