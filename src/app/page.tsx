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
 const [authMode,setAuthMode]=useState<'login'|'register'|'onboarding'|null>(null);
 const [authLoading,setAuthLoading]=useState(false);
 const [authError,setAuthError]=useState('');
 const [user,setUser]=useState<any>(null);
 const [auth,setAuth]=useState({name:'',email:'',password:''});

 useEffect(()=>{
   try{
     const stored=localStorage.getItem('be2gen2_user');
     if(stored)setUser(JSON.parse(stored));
   }catch{}
   fetch(API+'/api/health').then(r=>r.ok?r.json():Promise.reject()).then(()=>setHealth('online')).catch(()=>setHealth('offline'));
   fetch(API+'/api/profile').then(r=>r.json()).then(x=>{setProfile(x.profile);setM(x.metrics)}).catch(()=>{});
   fetch(API+'/api/progress').then(r=>r.json()).then(setProgress).catch(()=>{});
   fetch(API+'/api/workouts').then(r=>r.json()).then(setWorkouts).catch(()=>{});
 },[]);

 const openAuth=(mode:'login'|'register'|'onboarding')=>{
   setAuthError('');
   setAuthMode(mode);
   setAuthLoading(false);
 };

 const closeAuth=()=>{
   if(!authLoading){
     setAuthMode(null);
     setAuthError('');
   }
 };

 const submitAuth=async()=>{
   setAuthError('');

   if(!auth.email.trim() || !auth.password.trim()){
     setAuthError('Email and password are required.');
     return;
   }

   if(authMode==='register' && !auth.name.trim()){
     setAuthError('Name is required.');
     return;
   }

   if(authMode==='register' && auth.password.length<6){
     setAuthError('Password must be at least 6 characters.');
     return;
   }

   setAuthLoading(true);

   try{
     const endpoint=authMode==='register'?'/api/register':'/api/login';
     const body=authMode==='register'
       ? {name:auth.name,email:auth.email,password:auth.password}
       : {email:auth.email,password:auth.password};

     const r=await fetch(API+endpoint,{
       method:'POST',
       headers:{'Content-Type':'application/json'},
       body:JSON.stringify(body)
     });

     const x=await r.json();

     if(!r.ok) throw new Error(x.detail||'Authentication failed.');

     localStorage.setItem('be2gen2_user',JSON.stringify(x.user));
     setUser(x.user);

     if(authMode==='register'){
       setAuthMode('onboarding');
       setAuth(prev=>({...prev,name:x.user.name,email:x.user.email}));
     }else{
       setAuthMode(null);
       setAuth({name:'',email:'',password:''});
     }
   }catch(e:any){
     setAuthError(e.message||'Something went wrong.');
   }finally{
     setAuthLoading(false);
   }
 };

 const submitOnboarding=async()=>{
   setAuthError('');
   setAuthLoading(true);

   try{
     const r=await fetch(API+'/api/profile',{
       method:'POST',
       headers:{'Content-Type':'application/json'},
       body:JSON.stringify(profile)
     });

     const x=await r.json();

     if(!r.ok) throw new Error(x.detail||'Could not save profile.');

     setProfile(x.profile);
     setM(x.metrics);
     setAuthMode(null);
     setAuth({name:'',email:'',password:''});
     setTab('Home');
   }catch(e:any){
     setAuthError(e.message||'Could not save profile.');
   }finally{
     setAuthLoading(false);
   }
 };

 const logout=()=>{
   localStorage.removeItem('be2gen2_user');
   setUser(null);
   setAuthMode(null);
   setAuth({name:'',email:'',password:''});
   setTab('Home');
 };

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

 return <main className="app-shell" style={{background:"radial-gradient(circle at 7% 18%, rgba(155,25,48,.48), transparent 32%), radial-gradient(circle at 92% 72%, rgba(105,20,35,.18), transparent 28%), #040506"}}>
   <header className="topbar">
    <div className="brand" onClick={()=>setTab('Home')}><div><strong style={{fontWeight:950,letterSpacing:"-0.045em",fontSize:"1.15em"}}>BE<span>2</span>GEN<span>2</span></strong><small>TRAIN • RECOVER • GROW</small></div></div>
    <nav className="desktop-nav">{nav.map(n=><button key={n.id} onClick={()=>setTab(n.id)} className={tab===n.id?'active':''}><i>{n.icon}</i>{n.id}</button>)}</nav>
    <div className="top-actions">
      <span className={`status ${health}`}>● {health==='online'?'API ONLINE':health==='offline'?'API OFFLINE':'CHECKING'}</span>
      {user ? (
        <>
          <span className="muted small">Hi, {user.name}</span>
          <button className="outline-btn" onClick={logout}>Log out</button>
        </>
      ) : (
        <>
          <button className="outline-btn" onClick={()=>openAuth('login')}>Sign in</button>
          <button className="red-btn" onClick={()=>openAuth('register')}>Get Started</button>
        </>
      )}
    </div>
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
      <div className="hero-art hero-art-premium" style={{
        position:'relative',
        minHeight:'650px',
        height:'min(78vh,790px)',
        overflow:'hidden',
        borderRadius:18,
        background:'radial-gradient(circle at 55% 55%,rgba(44, 2, 2, 0.72),transparent 45%),linear-gradient(135deg,#08090b 0%,#16080d 58%,#060708 100%)',
        border:'none',
        boxShadow:'0 26px 70px rgba(0, 0, 0, 0.95), inset 0 0 90px rgba(0, 0, 0, 0.92)',
        display:'flex',
        alignItems:'center',
        justifyContent:'center'
      }}>
        <div style={{
          position:'absolute',
          inset:0,
          pointerEvents:'none',
          background:'radial-gradient(circle at 72% 50%,rgba(205,42,68,.20),transparent 38%)'
        }}/>
        <div style={{
          position:'relative',
          width:'100%',
          height:'100%',
          display:'flex',
          alignItems:'center',
          justifyContent:'center',
          padding:'10px'
        }}>
          <img
            className="hero-mentzer-image"
            src="mike-mentzer-aesthetics.jpg"
            alt="Mike Mentzer"
            style={{
              width:'108%',
              height:'108%',
              objectFit:'contain',
              objectPosition:'center center',
              display:'block',
              margin:'0 auto',
              filter:'grayscale(.10) contrast(1.09) brightness(1.2)',
              transform:'none'
            }}
          />
        </div>
      </div>
    </section>

    <section className="wrap dashboard-preview">
      <div className="section-heading row"><div><div className="eyebrow red">YOUR NUMBERS</div><h2>Built around <span>your body.</span></h2></div><button className="text-btn" onClick={()=>setTab('Nutrition')}>Edit profile →</button></div>
      <div className="metrics-grid"><Metric label="BMI" value={m.bmi} sub="body-mass index"/><Metric label="BMR" value={m.bmr} sub="kcal / day"/><Metric label="TDEE" value={m.tdee} sub="estimated maintenance"/><Metric label="TARGET" value={m.calories} sub="daily calories"/></div>
    </section>

    <section className="wrap feature-grid">
      {[['01','Personalized Workouts','Recovery-aware Heavy Duty sessions based on your current profile.','Workout'],['02','Nutrition Engine','Calories and macros calculated from height, weight, activity and goal.','Nutrition'],['03','RAG AI Coach','Ask about training and get answers grounded in your indexed sources.','Coach'],['04','Progress Lab','Track bodyweight and see the trend instead of guessing.','Progress']].map(([n,t,d,to])=><button key={t} className="feature-card" onClick={()=>setTab(to as Tab)}><span>{n}</span><h3>{t}</h3><p>{d}</p><b>Explore →</b></button>)}
    </section>

    <section className="mentzer-archive" aria-label="Mike Mentzer visual archive">
      <div className="wrap archive-intro" style={{paddingTop:110,paddingBottom:55}}>
        <div style={{color:'#7f8993',fontSize:11,letterSpacing:3,fontWeight:700}}>THE MENTZER ARCHIVE</div>
        <h2 style={{color:'#d8dde2'}}>THE <span style={{color:'#8f969d'}}>HEAVY DUTY ERA.</span></h2>
        <p style={{color:'#727b84',maxWidth:620}}>Four archival frames. One image at a time. Deep black, graphite grey and a restrained crimson accent.</p>
      </div>

      {[['01','INTENSITY','Train with purpose.','Low volume. High effort. Deliberate execution.','/mike-mentzer-1.jpg'],['02','RECOVERY','Recovery is part of the program.','Hard training only works when recovery gets the time it needs.','/mike-mentzer-2.jpg'],['03','CONTROL','Make every rep count.','Precision over pointless volume.','/mike-mentzer-3.jpg'],['04','CONQUER','Conquer the work. Then recover.','A final visual chapter for the Be2Gen2 training philosophy.','/mike-mentzer-4.jpg']].map(([n,k,t,d,img])=><article key={n} style={{position:'relative',minHeight:'clamp(520px,78vh,820px)',height:'auto',margin:'0 0 90px',overflow:'hidden',background:'#030405',borderTop:'1px solid #181c21',borderBottom:'1px solid #181c21'}}>
        <img src={img} alt={`Mike Mentzer archive ${n}`} loading="lazy" style={{position:'absolute',inset:0,width:'100%',height:'100%',objectFit:'contain',objectPosition:'center center',filter:'grayscale(.35) contrast(1.16) brightness(.72)',transform:'none'}}/>
        <div style={{position:'absolute',inset:0,background:'linear-gradient(90deg,rgba(155,22,48,.42) 0%,rgba(80,10,25,.20) 48%,rgba(0,0,0,.35) 100%)'}}/>
        <div style={{position:'absolute',inset:0,background:'linear-gradient(180deg,rgba(0,0,0,.10),transparent 38%,rgba(0,0,0,.72))'}}/>
        <div style={{position:'absolute',left:'clamp(24px,8vw,130px)',bottom:'clamp(34px,9vh,100px)',maxWidth:520}}>
          <div style={{color:'#8f252c',fontSize:11,fontWeight:800,letterSpacing:3}}>{n} / {k}</div>
          <h3 style={{margin:'12px 0 10px',color:'#e1e4e7',fontSize:'clamp(34px,5vw,68px)',lineHeight:1.02,letterSpacing:-2}}>{t}</h3>
          <p style={{color:'#9aa1a8',fontSize:15,maxWidth:430}}>{d}</p>
        </div>
        
      </article>)}
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

   {tab==='Progress'&&<section className="wrap page-section"><SectionTitle kicker="PROGRESS LAB" title="SEE THE" accent="TREND."/><div className="progress-top"><div className="metric-card"><div className="eyebrow">CURRENT WEIGHT</div><div className="metric-value">{profile.weight_kg} kg</div><div className="muted small">profile weight</div></div><div className="metric-card"><div className="eyebrow">CHANGE</div><div className="metric-value">{progressDelta>0?'+':''}{progressDelta.toFixed(1)} kg</div><div className="muted small">first → latest log</div></div><div className="metric-card"><div className="eyebrow">API</div><div className="metric-value">{health==='online'?'LIVE':'—'}</div><div className="muted small">backend connection</div></div></div><div className="chart-card"><div className="chart-head"><div><h3>Bodyweight trend</h3><p>Data from your progress API.</p></div><span>kg</span></div>{progress.length?<ResponsiveContainer width="100%" height={360}><LineChart data={progress}><XAxis dataKey="date" stroke="#68717e"/><YAxis stroke="#68717e"/><Tooltip contentStyle={{background:'#11151b',border:'1px solid #303844',borderRadius:12}}/><Line type="monotone" dataKey="weight_kg" stroke="#c43a50" strokeWidth={4} dot={false}/></LineChart></ResponsiveContainer>:<div className="empty">No progress entries yet. Add data through the progress API.</div>}</div></section>}

   {authMode&&<div
      onClick={(e)=>{if(e.target===e.currentTarget)closeAuth()}}
      style={{
        position:'fixed',inset:0,zIndex:1000,display:'flex',alignItems:'center',
        justifyContent:'center',padding:20,background:'rgba(0,0,0,.72)',backdropFilter:'blur(10px)'
      }}
    >
      <div style={{
        width:'100%',maxWidth:520,maxHeight:'90vh',overflowY:'auto',
        background:'#11151b',border:'1px solid #303844',borderRadius:20,
        padding:28,boxShadow:'0 25px 80px rgba(0,0,0,.55)'
      }}>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:22}}>
          <div>
            <div className="eyebrow red">BE2GEN2</div>
            <h2 style={{margin:'6px 0 0'}}>
              {authMode==='login'?'WELCOME BACK':authMode==='register'?'CREATE ACCOUNT':'BUILD YOUR PROFILE'}
            </h2>
          </div>
          {authMode!=='onboarding'&&<button className="outline-btn" onClick={closeAuth}>×</button>}
        </div>

        {authMode==='login'&&<>
          <p className="muted">Sign in to continue your training journey.</p>

          <label>Email
            <input
              className="input"
              type="email"
              value={auth.email}
              onChange={e=>setAuth({...auth,email:e.target.value})}
              placeholder="you@example.com"
              autoComplete="email"
            />
          </label>

          <label style={{display:'block',marginTop:14}}>Password
            <input
              className="input"
              type="password"
              value={auth.password}
              onChange={e=>setAuth({...auth,password:e.target.value})}
              placeholder="••••••••"
              autoComplete="current-password"
              onKeyDown={e=>{if(e.key==='Enter')submitAuth()}}
            />
          </label>

          {authError&&<div style={{marginTop:14,padding:12,borderRadius:10,border:'1px solid #7f2930',background:'#32171b'}}>{authError}</div>}

          <button className="red-btn full" style={{marginTop:20}} onClick={submitAuth} disabled={authLoading}>
            {authLoading?'Signing in...':'Sign in'}
          </button>

          <p className="muted small" style={{marginTop:18,textAlign:'center'}}>
            Don't have an account?{' '}
            <button className="text-btn" onClick={()=>{setAuthError('');setAuthMode('register')}}>Create one</button>
          </p>
        </>}

        {authMode==='register'&&<>
          <p className="muted">Create your Be2Gen2 account, then we'll set up your profile.</p>

          <label>Name
            <input
              className="input"
              type="text"
              value={auth.name}
              onChange={e=>setAuth({...auth,name:e.target.value})}
              placeholder="Your name"
              autoComplete="name"
            />
          </label>

          <label style={{display:'block',marginTop:14}}>Email
            <input
              className="input"
              type="email"
              value={auth.email}
              onChange={e=>setAuth({...auth,email:e.target.value})}
              placeholder="you@example.com"
              autoComplete="email"
            />
          </label>

          <label style={{display:'block',marginTop:14}}>Password
            <input
              className="input"
              type="password"
              value={auth.password}
              onChange={e=>setAuth({...auth,password:e.target.value})}
              placeholder="At least 6 characters"
              autoComplete="new-password"
              onKeyDown={e=>{if(e.key==='Enter')submitAuth()}}
            />
          </label>

          {authError&&<div style={{marginTop:14,padding:12,borderRadius:10,border:'1px solid #7f2930',background:'#32171b'}}>{authError}</div>}

          <button className="red-btn full" style={{marginTop:20}} onClick={submitAuth} disabled={authLoading}>
            {authLoading?'Creating account...':'Create account'}
          </button>

          <p className="muted small" style={{marginTop:18,textAlign:'center'}}>
            Already have an account?{' '}
            <button className="text-btn" onClick={()=>{setAuthError('');setAuthMode('login')}}>Sign in</button>
          </p>
        </>}

        {authMode==='onboarding'&&<>
          <p className="muted">One last step. Enter your body and training details so Be2Gen2 can calculate your targets.</p>

          <div className="form-grid">
            <label>Name
              <input className="input" value={profile.name} onChange={e=>setProfile({...profile,name:e.target.value})}/>
            </label>

            <label>Age
              <input className="input" type="number" value={profile.age} onChange={e=>setProfile({...profile,age:Number(e.target.value)})}/>
            </label>

            <label>Height (cm)
              <input className="input" type="number" value={profile.height_cm} onChange={e=>setProfile({...profile,height_cm:Number(e.target.value)})}/>
            </label>

            <label>Weight (kg)
              <input className="input" type="number" value={profile.weight_kg} onChange={e=>setProfile({...profile,weight_kg:Number(e.target.value)})}/>
            </label>

            <label>Sex
              <select className="input" value={profile.sex} onChange={e=>setProfile({...profile,sex:e.target.value})}>
                <option value="male">Male</option>
                <option value="female">Female</option>
              </select>
            </label>

            <label>Activity
              <select className="input" value={profile.activity} onChange={e=>setProfile({...profile,activity:e.target.value})}>
                <option value="sedentary">Sedentary</option>
                <option value="light">Light</option>
                <option value="moderate">Moderate</option>
                <option value="active">Active</option>
                <option value="very_active">Very active</option>
              </select>
            </label>

            <label>Goal
              <select className="input" value={profile.goal} onChange={e=>setProfile({...profile,goal:e.target.value})}>
                <option value="cut">Fat loss</option>
                <option value="recomp">Recomp</option>
                <option value="maintain">Maintain</option>
                <option value="bulk">Muscle gain</option>
              </select>
            </label>
          </div>

          {authError&&<div style={{marginTop:14,padding:12,borderRadius:10,border:'1px solid #7f2930',background:'#32171b'}}>{authError}</div>}

          <button className="red-btn full" style={{marginTop:20}} onClick={submitOnboarding} disabled={authLoading}>
            {authLoading?'Saving profile...':'Finish setup →'}
          </button>
        </>}
      </div>
    </div>}

   <style jsx global>{`
      :root { color-scheme: dark; }
      html, body { background:#020304 !important; color:#d5d9dd; }
      .app-shell { background:linear-gradient(180deg,#020304 0%,#040506 48%,#020304 100%) !important; }
      .topbar { background:rgba(3,4,5,.92) !important; border-color:#171b20 !important; backdrop-filter:blur(18px); }
      .brand-mark { background:#0b0d10 !important; color:#aeb5bc !important; border:1px solid #262b31 !important; box-shadow:none !important; }
      .red, .eyebrow.red { color:#7f252b !important; }
      .red-btn { background:#111419 !important; color:#d7dbe0 !important; border:1px solid #30363d !important; box-shadow:none !important; }
      .red-btn:hover { background:#181c21 !important; border-color:#545c65 !important; }
      .outline-btn { background:#080a0c !important; color:#aeb5bc !important; border-color:#30363d !important; }
      .outline-btn:hover { background:#111419 !important; color:#e0e3e6 !important; }
      .desktop-nav button.active { color:#d4d8dc !important; background:#0c0f12 !important; }
      .desktop-nav button.active i { color:#8f252c !important; }
      .status.online { color:#9ba3aa !important; }
      .status.online::first-letter { color:#7f252b; }
      .metric-card,.feature-card,.workout-card,.form-card,.calorie-card,.chart-card,.coach-side,.chat-panel { background:#080a0d !important; border-color:#1d2228 !important; box-shadow:0 18px 50px rgba(0,0,0,.28) !important; }
      .feature-card:hover { border-color:#343b43 !important; transform:translateY(-3px); }
      .pill { background:#0d1013 !important; border-color:#292f36 !important; color:#929aa2 !important; }
      .macro-bars i { background:#4b525a !important; }
      .section-heading h2 span { color:#8f969d !important; }
      .hero-copy h1 span { color:#a4abb2 !important; }
      .hero-stats b { color:#c6cbd0 !important; }
      .text-btn { color:#929aa2 !important; }
      .text-btn:hover { color:#d7dbe0 !important; }
      .input { background:#07090b !important; border-color:#252b31 !important; color:#e1e4e7 !important; }
      .input:focus { border-color:#4a5159 !important; box-shadow:0 0 0 3px rgba(130,140,150,.08) !important; }
      .footer { border-color:#181c21 !important; }
      @media (max-width: 800px) { .hero-art-premium { min-height:560px !important; height:70vh !important; } }
   `}</style>
   <footer className="footer wrap"><div><b>BE<span>2</span>GEN<span>2</span></b><p>Train less. Train hard. Recover. Grow.</p></div><div><span>Backend: {API}</span><span>•</span><span>© Be2Gen2</span></div></footer>
 </main>
}
