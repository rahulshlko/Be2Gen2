'use client';
import { useEffect, useMemo, useState } from 'react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

type Metrics={bmi:number;bmr:number;tdee:number;calories:number;protein_g:number;carbs_g:number;fat_g:number};
type Profile={name:string;age:number;sex:string;height_cm:number;weight_kg:number;activity:string;goal:string};

type Tab='Home'|'Workout'|'Nutrition'|'Coach'|'Progress';

const nav: {id:Tab; icon:string}[] = [
  {id:'Home',icon:'⌂'}, {id:'Workout',icon:'◈'}, {id:'Nutrition',icon:'◉'}, {id:'Coach',icon:'✦'}, {id:'Progress',icon:'↗'}
];

export default function Home(){
 const [profile,setProfile]=useState<Profile>({name:'Athlete',age:25,sex:'male',height_cm:175,weight_kg:70,activity:'moderate',goal:'recomp'});
 const [m,setM]=useState<Metrics>({bmi:22.9,bmr:1684,tdee:2610,calories:2510,protein_g:112,carbs_g:286,fat_g:49});
 const [tab,setTab]=useState<Tab>('Home');
 const [q,setQ]=useState('');
 const [chat,setChat]=useState<any[]>([]);
 const [progress,setProgress]=useState<any[]>([]);
 const [workouts,setWorkouts]=useState<any>({});
 const [health,setHealth]=useState<'checking'|'online'|'offline'>('checking');
 const [mobileOpen,setMobileOpen]=useState(false);

 useEffect(()=>{
   fetch(API+'/api/health').then(r=>r.ok?r.json():Promise.reject()).then(()=>setHealth('online')).catch(()=>setHealth('offline'));
   fetch(API+'/api/profile').then(r=>r.json()).then(x=>{setProfile(x.profile);setM(x.metrics)}).catch(()=>{});
   fetch(API+'/api/progress').then(r=>r.json()).then(setProgress).catch(()=>{});
   fetch(API+'/api/workouts').then(r=>r.json()).then(setWorkouts).catch(()=>{});
 },[]);

 const save=async()=>{
   const r=await fetch(API+'/api/profile',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(profile)});
   if(r.ok){const x=await r.json();setM(x.metrics)}
 };
 const ask=async()=>{
   if(!q.trim())return;
   const question=q;setQ('');setChat(c=>[...c,{role:'user',text:question}]);
   try{
    const r=await fetch(API+'/api/ai/chat',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({message:question})});
    const x=await r.json();setChat(c=>[...c,{role:'ai',text:x.answer||'No answer returned.',sources:x.sources}]);
   }catch{setChat(c=>[...c,{role:'ai',text:'Backend is offline. Start FastAPI on port 8000 and try again.'}]);}
 };
 const currentWorkout=workouts.day1;
 const progressDelta=useMemo(()=>progress.length>1?Number(progress[progress.length-1].weight_kg)-Number(progress[0].weight_kg):0,[progress]);

 const Metric=({label,value,sub}:any)=><div className="metric-card"><div className="eyebrow">{label}</div><div className="metric-value">{value}</div><div className="muted small">{sub}</div></div>;
 const SectionTitle=({kicker,title,accent}:{kicker:string;title:string;accent:string})=><div className="section-heading"><div className="eyebrow red">{kicker}</div><h2>{title} <span>{accent}</span></h2></div>;

 return <main className="app-shell">
   <header className="topbar">
    <div className="brand" onClick={()=>setTab('Home')}><div className="brand-mark">↯</div><div><strong>BE<span>2</span>GEN<span>2</span></strong><small>TRAIN • RECOVER • GROW</small></div></div>
    <nav className="desktop-nav">{nav.map(n=><button key={n.id} onClick={()=>setTab(n.id)} className={tab===n.id?'active':''}><i>{n.icon}</i>{n.id}</button>)}</nav>
    <div className="top-actions"><span className={`status ${health}`}>● {health==='online'?'API ONLINE':health==='offline'?'API OFFLINE':'CHECKING'}</span><button className="outline-btn">Sign in</button><button className="red-btn">Get Started</button></div>
    <button className="mobile-menu" onClick={()=>setMobileOpen(!mobileOpen)}>☰</button>
   </header>
   {mobileOpen&&<div className="mobile-nav">{nav.map(n=><button key={n.id} onClick={()=>{setTab(n.id);setMobileOpen(false)}}>{n.icon} {n.id}</button>)}</div>}

   {tab==='Home'&&<>
    <section className="hero wrap">
      <div className="hero-copy">
        <div className="eyebrow red">INTELLIGENT HIGH-INTENSITY TRAINING</div>
        <h1>MORE MUSCLE.<br/><span>LESS WASTED TIME.</span></h1>
        <p>Be2Gen2 combines your body metrics, recovery, nutrition and a Mentzer-focused knowledge base into one serious training system.</p>
        <div className="hero-actions"><button className="red-btn big" onClick={()=>setTab('Workout')}>Start Training <b>→</b></button><button className="outline-btn big" onClick={()=>setTab('Coach')}>Ask AI Coach</button></div>
        <div className="hero-stats"><div><b>4</b><span>workout days</span></div><div><b>1000+</b><span>exercise ideas</span></div><div><b>RAG</b><span>source-grounded coach</span></div></div>
      </div>
      <div className="hero-art"><div className="art-glow"/><img src="Mike mentzer aesthetics.jpg" alt="Mike Mentzer inspired training artwork"/></div>
    </section>

    <section className="wrap dashboard-preview">
      <div className="section-heading row"><div><div className="eyebrow red">YOUR NUMBERS</div><h2>Built around <span>your body.</span></h2></div><button className="text-btn" onClick={()=>setTab('Nutrition')}>Edit profile →</button></div>
      <div className="metrics-grid"><Metric label="BMI" value={m.bmi} sub="body-mass index"/><Metric label="BMR" value={m.bmr} sub="kcal / day"/><Metric label="TDEE" value={m.tdee} sub="estimated maintenance"/><Metric label="TARGET" value={m.calories} sub="daily calories"/></div>
    </section>

    <section className="wrap feature-grid">
      {[['01','Personalized Workouts','Recovery-aware Heavy Duty sessions based on your current profile.','Workout'],['02','Nutrition Engine','Calories and macros calculated from height, weight, activity and goal.','Nutrition'],['03','RAG AI Coach','Ask about training and get answers grounded in your indexed sources.','Coach'],['04','Progress Lab','Track bodyweight and see the trend instead of guessing.','Progress']].map(([n,t,d,to])=><button key={t} className="feature-card" onClick={()=>setTab(to as Tab)}><span>{n}</span><h3>{t}</h3><p>{d}</p><b>Explore →</b></button>)}
    </section>
   </>}

   {tab==='Workout'&&<section className="wrap page-section">
      <SectionTitle kicker="HEAVY DUTY SYSTEM" title="TRAIN" accent="HARD."/>
      <p className="lead">High intensity, low volume and deliberate recovery. The schedule below is driven by the workout data in your backend.</p>
      <div className="workout-grid">{Object.values(workouts).map((w:any,i)=><article className="workout-card" key={w.name||i}><div className="workout-head"><div><span className="pill">DAY {i+1}</span><h3>{w.name}</h3></div><strong>{w.recovery_days}D <small>RECOVERY</small></strong></div><div className="exercise-list">{(w.exercises||[]).map((e:any)=><div className="exercise-row" key={e.name}><div><b>{e.name}</b><small>{e.method}</small></div><strong>{e.sets} × {e.reps}</strong></div>)}</div><button className="red-btn full">Log this workout</button></article>)}</div>
      {!Object.keys(workouts).length&&<div className="empty">Backend workout data is not available yet.</div>}
   </section>}

   {tab==='Nutrition'&&<section className="wrap page-section"><SectionTitle kicker="NUTRITION ENGINE" title="FUEL YOUR" accent="RECOVERY."/><div className="nutrition-grid"><div className="calorie-card"><span className="eyebrow">DAILY TARGET</span><strong>{m.calories}</strong><small>kcal / day</small><div className="macro-bars"><div><span>Protein <b>{m.protein_g}g</b></span><i style={{width:`${Math.min(100,Number(m.protein_g)/2)}%`}}/></div><div><span>Carbs <b>{m.carbs_g}g</b></span><i style={{width:`${Math.min(100,Number(m.carbs_g)/3)}%`}}/></div><div><span>Fat <b>{m.fat_g}g</b></span><i style={{width:`${Math.min(100,Number(m.fat_g)*1.4)}%`}}/></div></div></div><div className="form-card"><h3>Profile calculator</h3><div className="form-grid"><label>Age<input className="input" type="number" value={profile.age} onChange={e=>setProfile({...profile,age:Number(e.target.value)})}/></label><label>Height (cm)<input className="input" type="number" value={profile.height_cm} onChange={e=>setProfile({...profile,height_cm:Number(e.target.value)})}/></label><label>Weight (kg)<input className="input" type="number" value={profile.weight_kg} onChange={e=>setProfile({...profile,weight_kg:Number(e.target.value)})}/></label><label>Goal<select className="input" value={profile.goal} onChange={e=>setProfile({...profile,goal:e.target.value})}><option value="cut">Fat loss</option><option value="recomp">Recomp</option><option value="maintain">Maintain</option><option value="bulk">Muscle gain</option></select></label></div><button className="red-btn" onClick={save}>Update targets</button></div></div></section>}

   {tab==='Coach'&&<section className="wrap page-section"><SectionTitle kicker="SOURCE-GROUNDED COACH" title="ASK" accent="BE2GEN2."/><div className="coach-layout"><aside className="coach-side"><div className="coach-badge">✦</div><h3>Heavy Duty Coach</h3><p>Ask about training, recovery, nutrition or the Mentzer material indexed in your RAG system.</p><div className="suggestions">{['Why is recovery important?','How should I approach Day 1?','How do I calculate my calories?'].map(s=><button onClick={()=>setQ(s)} key={s}>{s} ↗</button>)}</div></aside><div className="chat-panel"><div className="chat-messages">{chat.length===0?<div className="empty-chat"><div>✦</div><h3>Your coach is ready.</h3><p>Ask a question to start.</p></div>:chat.map((c:any,i)=><div className={c.role==='user'?'msg user':'msg'} key={i}><span>{c.role==='user'?'YOU':'BE2GEN2'}</span><p>{c.text}</p>{c.sources?.length>0&&<small>Sources: {c.sources.map((s:any)=>`${s.source} p.${s.page}`).join(' • ')}</small>}</div>)}</div><div className="chat-input"><input className="input" value={q} onChange={e=>setQ(e.target.value)} onKeyDown={e=>e.key==='Enter'&&ask()} placeholder="Ask about training, recovery, nutrition..."/><button className="red-btn" onClick={ask}>Send</button></div></div></div></section>}

   {tab==='Progress'&&<section className="wrap page-section"><SectionTitle kicker="PROGRESS LAB" title="SEE THE" accent="TREND."/><div className="progress-top"><div className="metric-card"><div className="eyebrow">CURRENT WEIGHT</div><div className="metric-value">{profile.weight_kg} kg</div><div className="muted small">profile weight</div></div><div className="metric-card"><div className="eyebrow">CHANGE</div><div className="metric-value">{progressDelta>0?'+':''}{progressDelta.toFixed(1)} kg</div><div className="muted small">first → latest log</div></div><div className="metric-card"><div className="eyebrow">API</div><div className="metric-value">{health==='online'?'LIVE':'—'}</div><div className="muted small">backend connection</div></div></div><div className="chart-card"><div className="chart-head"><div><h3>Bodyweight trend</h3><p>Data from your progress API.</p></div><span>kg</span></div>{progress.length?<ResponsiveContainer width="100%" height={360}><LineChart data={progress}><XAxis dataKey="date" stroke="#68717e"/><YAxis stroke="#68717e"/><Tooltip contentStyle={{background:'#11151b',border:'1px solid #303844',borderRadius:12}}/><Line type="monotone" dataKey="weight_kg" stroke="#ff343f" strokeWidth={4} dot={false}/></LineChart></ResponsiveContainer>:<div className="empty">No progress entries yet. Add data through the progress API.</div>}</div></section>}

   <footer className="footer wrap"><div><b>BE<span>2</span>GEN<span>2</span></b><p>Train less. Train hard. Recover. Grow.</p></div><div><span>Backend: {API}</span><span>•</span><span>© Be2Gen2</span></div></footer>
 </main>
}
