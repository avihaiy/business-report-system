import { useState, useEffect, useCallback, useMemo } from "react";
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, RadarChart, Radar, PolarGrid, PolarAngleAxis } from "recharts";

// ════════════════════════════════════════════════════════════
// STORAGE
// ════════════════════════════════════════════════════════════
// API base is configurable via Vite env `VITE_API_BASE` or a global
// `window.__API_BASE__` (useful when hosting frontend and backend separately).
const API_BASE = (typeof window !== 'undefined' && window.__API_BASE__) || import.meta.env.VITE_API_BASE || '/api';

async function dbSet(k,d){
  try{
    await fetch(`${API_BASE}/${k}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(d)
    });
  }catch{}
}

async function dbReset(){
  try{
    const res = await fetch(`${API_BASE}/reset`, { method: 'POST' });
    return res.ok;
  }catch{return false;}
}

// ════════════════════════════════════════════════════════════
// SEED DATA
// ════════════════════════════════════════════════════════════
const SEED_USERS=[
  {id:1,username:"inspector1",password:"pass123",name:"דוד לוי",role:"inspector",active:true,assignedBusinesses:[1,2,3],avatar:"ד",phone:"050-1234567",email:"david@city.gov.il",joinDate:"2023-01-15"},
  {id:2,username:"inspector2",password:"pass123",name:"רחל כהן",role:"inspector",active:true,assignedBusinesses:[2,4,5],avatar:"ר",phone:"052-7654321",email:"rachel@city.gov.il",joinDate:"2022-08-20"},
  {id:3,username:"admin",password:"admin123",name:"מנהל מערכת",role:"admin",active:true,assignedBusinesses:[],avatar:"מ",phone:"03-9876543",email:"admin@city.gov.il",joinDate:"2021-01-01"},
  {id:4,username:"avihai",password:"avihai123",name:"אביחי סער",role:"admin",active:true,assignedBusinesses:[],avatar:"א",phone:"050-9876543",email:"avihai@city.gov.il",joinDate:"2024-06-01"},
];
const BIZ_TYPES=["מסעדה","מרכול","מכבסה","בית מרקחת","ספרות","קפה","מאפייה","פארמה","קוסמטיקה","ספורט"];
const SEED_BUSINESSES=[
  {id:1,name:"מסעדת הים הכחול",type:"מסעדה",address:"רחוב הרצל 12, תל אביב",license:"TLV-2024-001",phone:"03-5551234",active:true,risk:"low"},
  {id:2,name:"סופרמרקט מגה",type:"מרכול",address:"שדרות רוטשילד 45, תל אביב",license:"TLV-2024-002",phone:"03-5559876",active:true,risk:"medium"},
  {id:3,name:"מכבסה נקי",type:"מכבסה",address:"רחוב דיזנגוף 78, תל אביב",license:"TLV-2024-003",phone:"03-5554567",active:true,risk:"low"},
  {id:4,name:"ברביקיו אורן",type:"מסעדה",address:"רחוב אלנבי 22, תל אביב",license:"TLV-2024-004",phone:"03-5558888",active:true,risk:"high"},
  {id:5,name:"בית מרקחת כרמל",type:"בית מרקחת",address:"רחוב הכרמל 9, חיפה",license:"HFA-2024-005",phone:"04-5553333",active:true,risk:"low"},
];
const SEED_REPORTS=[
  {id:1,businessId:2,inspectorId:1,date:"2025-04-10",score:72,status:"הושלם",urgency:"medium",violations:["תאריך תפוגה על מוצרים","חוסר ניקיון בפינת קופה"],observations:"המחסן מסודר. שלטי מחירים תקינים. פינות ניקיון דרושות שיפור. עובדי הקופה ענו בנימוס.",notes:"נדרש מעקב תוך 30 יום",categories:{היגיינה:3,בטיחות:4,תיעוד:2,שירות:4},followUp:"2025-05-10"},
  {id:2,businessId:1,inspectorId:1,date:"2025-04-20",score:91,status:"הושלם",urgency:"low",violations:[],observations:"מטבח נקי ומסודר. כל העובדים עם כיסוי ראש. טמפרטורת המקררים תקינה. תפריט עדכני עם הצהרות אלרגנים.",notes:"ביקורת תקינה לחלוטין",categories:{היגיינה:5,בטיחות:5,תיעוד:4,שירות:5},followUp:null},
  {id:3,businessId:4,inspectorId:2,date:"2025-05-01",score:54,status:"הושלם",urgency:"high",violations:["אוכל לא מכוסה","חיות בחצר","ציוד ישן"],observations:"מצב המקום קריטי. יש לנקוט בפעולה מיידית.",notes:"נדרש סגירה זמנית",categories:{היגיינה:2,בטיחות:2,תיעוד:3,שירות:3},followUp:"2025-05-15"},
  {id:4,businessId:3,inspectorId:1,date:"2025-05-12",score:85,status:"הושלם",urgency:"low",violations:["שלט רישיון חסר"],observations:"מתקן נקי. ציוד עובד תקין. צוות מקצועי.",notes:"יש לתלות שלט רישיון",categories:{היגיינה:4,בטיחות:5,תיעוד:3,שירות:5},followUp:null},
  {id:5,businessId:5,inspectorId:2,date:"2025-05-18",score:94,status:"הושלם",urgency:"low",violations:[],observations:"תרופות מאורגנות לפי תקן. הכל בסדר מושלם.",notes:"מצוין",categories:{היגיינה:5,בטיחות:5,תיעוד:5,שירות:4},followUp:null},
];
const SEED_NOTIFS=[
  {id:1,type:"warning",text:"ביקורת דחופה נדרשת: ברביקיו אורן",date:"2025-05-20",read:false},
  {id:2,type:"info",text:"מפקח דוד לוי סיים 3 ביקורות החודש",date:"2025-05-19",read:false},
  {id:3,type:"success",text:"בית מרקחת כרמל קיבל ציון מושלם 94",date:"2025-05-18",read:true},
];
const CATEGORIES=["היגיינה","בטיחות","תיעוד","שירות"];

// ════════════════════════════════════════════════════════════
// DB HOOK
// ════════════════════════════════════════════════════════════
function useDB(){
  const[users,setU]=useState(SEED_USERS);
  const[businesses,setB]=useState(SEED_BUSINESSES);
  const[reports,setR]=useState(SEED_REPORTS);
  const[notifs,setN]=useState(SEED_NOTIFS);

  const storageKey=(key)=>`brs:${key}`;
  const readLocal=(key)=>{
    try{
      const raw=localStorage.getItem(storageKey(key));
      return raw?JSON.parse(raw):null;
    }catch{return null;}
  };
  const writeLocal=(key,value)=>{
    try{localStorage.setItem(storageKey(key),JSON.stringify(value));}catch{}
  };

  useEffect(()=>{
    let active=true;
    const loadData=async()=>{
      try{
        const [u,b,r,n]=await Promise.all([
          fetch(`${API_BASE}/users`),
          fetch(`${API_BASE}/businesses`),
          fetch(`${API_BASE}/reports`),
          fetch(`${API_BASE}/notifs`)
        ]);

        if(!active) return;

        const [usersData,businessesData,reportsData,notifsData]=await Promise.all([
          u.ok?u.json():Promise.resolve(null),
          b.ok?b.json():Promise.resolve(null),
          r.ok?r.json():Promise.resolve(null),
          n.ok?n.json():Promise.resolve(null)
        ]);

        setU(Array.isArray(usersData)?usersData:readLocal('users')||SEED_USERS);
        setB(Array.isArray(businessesData)?businessesData:readLocal('businesses')||SEED_BUSINESSES);
        setR(Array.isArray(reportsData)?reportsData:readLocal('reports')||SEED_REPORTS);
        setN(Array.isArray(notifsData)?notifsData:readLocal('notifs')||SEED_NOTIFS);
      }catch(e){
        console.warn('Failed to load server data', e);
        setU(readLocal('users')||SEED_USERS);
        setB(readLocal('businesses')||SEED_BUSINESSES);
        setR(readLocal('reports')||SEED_REPORTS);
        setN(readLocal('notifs')||SEED_NOTIFS);
      }
    };
    loadData();
    return ()=>{active=false;};
  },[]);

  const mk=(setter,key)=>useCallback(fn=>{
    setter(prev=>{
      const next=typeof fn==='function'?fn(prev):fn;
      writeLocal(key,next);
      dbSet(key,next);
      return next;
    });
  },[]);

  const setUsers=mk(setU,'users');
  const setBusinesses=mk(setB,'businesses');
  const setReports=mk(setR,'reports');
  const setNotifs=mk(setN,'notifs');

  const resetDatabase=useCallback(async()=>{
    const success=await dbReset();
    if(success){
      const [u,b,r,n]=await Promise.all([
        fetch(`${API_BASE}/users`),
        fetch(`${API_BASE}/businesses`),
        fetch(`${API_BASE}/reports`),
        fetch(`${API_BASE}/notifs`)
      ]);
      if(u.ok&&b.ok&&r.ok&&n.ok){
        setU(await u.json());
        setB(await b.json());
        setR(await r.json());
        setN(await n.json());
      }
    }
  },[]);

  return{users,setUsers,businesses,setBusinesses,reports,setReports,notifs,setNotifs,resetDatabase};
}

// ════════════════════════════════════════════════════════════
// DESIGN TOKENS & UTILITIES
// ════════════════════════════════════════════════════════════
const C = {
  bg: "#060a13",
  sidebar: "rgba(13, 20, 40, 0.85)",
  card: "rgba(17, 24, 39, 0.45)",
  cardBorder: "rgba(255, 255, 255, 0.08)",
  blue: "#38bdf8",
  blueD: "#0284c7",
  accent: "#6366f1",
  green: "#10b981",
  amber: "#f59e0b",
  red: "#f43f5e",
  purple: "#a855f7",
  text: "#f8fafc",
  textMuted: "rgba(248, 250, 252, 0.65)",
  textDim: "rgba(248, 250, 252, 0.4)"
};
const inp = {
  width: "100%",
  padding: "11px 14px",
  background: "rgba(255, 255, 255, 0.04)",
  border: "1px solid rgba(255, 255, 255, 0.08)",
  borderRadius: 12,
  color: C.text,
  fontSize: 14,
  outline: "none",
  boxSizing: "border-box",
  direction: "rtl",
  fontFamily: "inherit",
  transition: "all 0.2s"
};
const cardStyle = {
  background: C.card,
  backdropFilter: "blur(16px)",
  WebkitBackdropFilter: "blur(16px)",
  border: `1px solid ${C.cardBorder}`,
  borderRadius: 18,
  padding: "22px 24px"
};

function useIsMobile() {
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);
  return isMobile;
}

function getPendingInspections(user, businesses, reports) {
  if (!user) return [];
  const myBiz = businesses.filter(b => b.active && (user.role === "admin" || user.assignedBusinesses.includes(b.id)));
  const pending = [];
  myBiz.forEach(biz => {
    const bizReports = reports.filter(r => r.businessId === biz.id);
    const sortedReports = [...bizReports].sort((a, b) => new Date(b.date) - new Date(a.date));
    const lastReport = sortedReports[0];
    
    if (bizReports.length === 0) {
      pending.push({
        id: `no-report-${biz.id}`,
        businessId: biz.id,
        businessName: biz.name,
        type: "never_inspected",
        text: `העסק "${biz.name}" טרם עבר ביקורת. יש לבצע ביקורת ראשונית בהקדם.`,
        urgency: biz.risk === "high" ? "high" : "medium",
        dateLabel: "טרם בוצעה ביקורת"
      });
      return;
    }
    
    const reportsWithFollowUp = bizReports.filter(r => r.followUp);
    reportsWithFollowUp.forEach(r => {
      const followUpDate = new Date(r.followUp);
      const today = new Date();
      const subsequentReport = bizReports.some(sr => new Date(sr.date) > new Date(r.date) && sr.id !== r.id);
      
      if (!subsequentReport && (followUpDate <= today || (followUpDate - today) / (1000 * 60 * 60 * 24) <= 3)) {
        pending.push({
          id: `followup-${r.id}`,
          businessId: biz.id,
          businessName: biz.name,
          type: "followup_due",
          text: `נדרשת ביקורת מעקב עבור "${biz.name}" בעקבות ציון נמוך של ${r.score} (מועד המעקב: ${r.followUp}).`,
          urgency: "high",
          dateLabel: `מעקב דחוף: ${r.followUp}`
        });
      }
    });
    
    if (lastReport) {
      const lastDate = new Date(lastReport.date);
      const today = new Date();
      const diffDays = Math.floor((today - lastDate) / (1000 * 60 * 60 * 24));
      if (diffDays >= 30) {
        pending.push({
          id: `overdue-${biz.id}`,
          businessId: biz.id,
          businessName: biz.name,
          type: "overdue",
          text: `עברו ${diffDays} ימים מאז הביקורת האחרונה בעסק "${biz.name}". יש לבצע ביקורת חודשית תקינה.`,
          urgency: biz.risk === "high" ? "high" : "medium",
          dateLabel: `בוקר לאחרונה לפני ${diffDays} ימים`
        });
      }
    }
  });
  return pending;
}

// ════════════════════════════════════════════════════════════
// SMALL COMPONENTS
// ════════════════════════════════════════════════════════════
function Avatar({name,size=36,role}){
  const bg=role==="admin"?"linear-gradient(135deg,#ef4444,#b91c1c)":role==="inspector"?"linear-gradient(135deg,#3b82f6,#6366f1)":"linear-gradient(135deg,#10b981,#059669)";
  return<div style={{width:size,height:size,borderRadius:size/3,background:bg,display:"flex",alignItems:"center",justifyContent:"center",color:"#fff",fontWeight:700,fontSize:size*0.38,flexShrink:0}}>{name?.[0]||"?"}</div>;
}

function ScoreBadge({score,large}){
  const col=score>=85?C.green:score>=70?C.amber:C.red;
  const bg=score>=85?"rgba(34,197,94,0.12)":score>=70?"rgba(245,158,11,0.12)":"rgba(239,68,68,0.12)";
  return<span style={{background:bg,color:col,border:`1px solid ${col}25`,borderRadius:large?10:7,padding:large?"8px 16px":"3px 11px",fontWeight:700,fontSize:large?18:13,display:"inline-block"}}>{score}</span>;
}

function RiskBadge({risk}){
  const map={high:["סיכון גבוה",C.red,"rgba(239,68,68,0.1)"],medium:["סיכון בינוני",C.amber,"rgba(245,158,11,0.1)"],low:["תקין",C.green,"rgba(34,197,94,0.1)"]};
  const[l,col,bg]=map[risk]||map.low;
  return<span style={{background:bg,color:col,borderRadius:6,padding:"2px 9px",fontSize:11,fontWeight:600}}>{l}</span>;
}

function Tag({children,color=C.accent,bg="rgba(99,102,241,0.12)"}){
  return<span style={{background:bg,color,borderRadius:6,padding:"2px 9px",fontSize:12}}>{children}</span>;
}

function Pill({children,active,onClick}){
  return<button onClick={onClick} style={{padding:"7px 16px",border:`1px solid ${active?C.blue:"rgba(255,255,255,0.1)"}`,borderRadius:20,background:active?"rgba(59,130,246,0.15)":"transparent",color:active?"#93c5fd":C.textMuted,cursor:"pointer",fontSize:13,fontWeight:active?600:400,transition:"all .15s"}}>{children}</button>;
}

function Stat({icon,value,label,color,delta}){
  return(
    <div style={{...cardStyle,position:"relative",overflow:"hidden"}}>
      <div style={{position:"absolute",top:-10,left:-10,fontSize:60,opacity:.04}}>{icon}</div>
      <div style={{color:color||C.textMuted,fontSize:22,marginBottom:6}}>{icon}</div>
      <div style={{color:color||C.text,fontSize:28,fontWeight:800,lineHeight:1}}>{value}</div>
      {delta!=null&&<div style={{color:delta>=0?C.green:C.red,fontSize:11,marginTop:3}}>{delta>=0?"↑":"↓"} {Math.abs(delta)}% מהחודש שעבר</div>}
      <div style={{color:C.textDim,fontSize:12,marginTop:6}}>{label}</div>
    </div>
  );
}

function Modal({onClose,children,width=600}){
  return(
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.8)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:300,direction:"rtl",padding:16}} onClick={e=>{if(e.target===e.currentTarget)onClose();}}>
      <div className="modal-inner" style={{background:"#131f38",border:"1px solid rgba(255,255,255,0.1)",borderRadius:22,width,maxWidth:"96vw",maxHeight:"92vh",overflowY:"auto",padding:"32px 36px"}}>
        {children}
      </div>
    </div>
  );
}

function ModalHead({title,sub,onClose}){
  return(
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:26}}>
      <div><h2 style={{color:C.text,margin:"0 0 4px",fontSize:20,fontWeight:700}}>{title}</h2>{sub&&<p style={{color:C.textMuted,margin:0,fontSize:13}}>{sub}</p>}</div>
      <button onClick={onClose} style={{background:"rgba(255,255,255,0.07)",border:"none",borderRadius:8,width:34,height:34,color:C.textMuted,cursor:"pointer",fontSize:18,flexShrink:0,fontFamily:"inherit"}}>✕</button>
    </div>
  );
}

function PrimaryBtn({onClick,disabled,children,style={},icon}){
  const isMobile = useIsMobile();
  const fullWidth = isMobile && style && style.fullwidth!==false;
  const baseStyle = {padding:"11px 22px",background:disabled?"rgba(59,130,246,0.3)":"linear-gradient(135deg,#3b82f6,#4f46e5)",border:"none",borderRadius:10,color:"#fff",fontSize:14,fontWeight:600,cursor:disabled?"default":"pointer",display:"flex",alignItems:"center",gap:6};
  return<button onClick={onClick} disabled={disabled} style={{...baseStyle, ...(fullWidth?{width:"100%"}:{}), ...style}}>{icon&&<span>{icon}</span>}{children}</button>;
}
function GhostBtn({onClick,children,style={},danger}){
  const isMobile = useIsMobile();
  const baseStyle = {padding:"11px 18px",background:danger?"rgba(239,68,68,0.07)":"rgba(255,255,255,0.05)",border:`1px solid ${danger?"rgba(239,68,68,0.22)":"rgba(255,255,255,0.1)"}`,borderRadius:10,color:danger?"#fca5a5":C.textMuted,cursor:"pointer",fontSize:14,fontFamily:"inherit"};
  return<button onClick={onClick} style={{...baseStyle, ...(isMobile?{width:"100%"}:{}), ...style}}>{children}</button>;
}

function SectionTitle({children}){
  return<p style={{color:C.textMuted,fontSize:11,fontWeight:700,margin:"0 0 12px",textTransform:"uppercase",letterSpacing:1.5}}>{children}</p>;
}

function ScoreBar({value,max=5,color=C.blue}){
  return(
    <div style={{display:"flex",gap:3,alignItems:"center"}}>
      {Array.from({length:max},(_,i)=>(
        <div key={i} style={{height:6,flex:1,borderRadius:3,background:i<value?color:"rgba(255,255,255,0.08)"}} />
      ))}
    </div>
  );
}

function EmptyState({icon,title,sub}){
  return<div style={{textAlign:"center",padding:"64px 0",color:C.textDim}}><div style={{fontSize:48,marginBottom:12}}>{icon}</div><div style={{fontSize:16,color:C.textMuted,marginBottom:6}}>{title}</div>{sub&&<div style={{fontSize:13}}>{sub}</div>}</div>;
}

const CT={
  tooltip:{background:"#1a2744",border:"1px solid rgba(255,255,255,0.1)",borderRadius:8,color:C.text,fontSize:12,direction:"rtl"},
};

// ════════════════════════════════════════════════════════════
// LOGIN
// ════════════════════════════════════════════════════════════
function LoginPage({users,onLogin}){
  const[u,setU]=useState("");const[p,setP]=useState("");const[err,setErr]=useState("");const[loading,setL]=useState(false);
  const go=()=>{
    setL(true);setErr("");
    setTimeout(()=>{
      const found=users.find(x=>x.username===u&&x.password===p&&x.active);
      if(found)onLogin(found);
      else{setErr(users.find(x=>x.username===u)?"סיסמה שגויה":"שם משתמש לא נמצא");setL(false);}
    },500);
  };
  return(
    <div style={{minHeight:"100vh",background:`radial-gradient(ellipse at 30% 20%, rgba(56,189,248,0.15) 0%, transparent 50%), radial-gradient(ellipse at 80% 80%, rgba(99,102,241,0.12) 0%, transparent 50%), ${C.bg}`,display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"'Segoe UI',Tahoma,Arial,sans-serif",direction:"rtl",padding:16}}>
      <div style={{width:"100%",maxWidth:420}}>
        <div style={{textAlign:"center",marginBottom:30}}>
          <div style={{width:72,height:72,borderRadius:22,background:"linear-gradient(135deg,#38bdf8,#6366f1)",display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 20px",fontSize:32,boxShadow:"0 8px 30px rgba(56,189,248,0.25)"}}>🏛️</div>
          <h1 style={{color:C.text,fontSize:26,fontWeight:800,margin:"0 0 6px",letterSpacing:-.5}}>מערכת ביקורת עסקים</h1>
          <p style={{color:C.textMuted,fontSize:14,margin:0}}>פלטפורמה מתקדמת לניהול ביקורות עירוניות</p>
        </div>
        <div style={{background:"rgba(17,24,39,0.6)",backdropFilter:"blur(20px)",WebkitBackdropFilter:"blur(20px)",border:"1px solid rgba(255,255,255,0.08)",borderRadius:24,padding:"36px 32px",boxShadow:"0 12px 40px rgba(0,0,0,0.4)"}}>
          {[["שם משתמש",u,setU,"text","👤"],["סיסמה",p,setP,"password","🔑"]].map(([l,v,fn,t,ic])=>(
            <div key={l} style={{marginBottom:16}}>
              <label style={{color:C.textMuted,fontSize:12,fontWeight:600,display:"block",marginBottom:6,textTransform:"uppercase",letterSpacing:.8}}>{l}</label>
              <div style={{position:"relative"}}>
                <span style={{position:"absolute",right:13,top:"50%",transform:"translateY(-50%)",fontSize:16}}>{ic}</span>
                <input type={t} value={v} onChange={e=>fn(e.target.value)} onKeyDown={e=>e.key==="Enter"&&go()} placeholder={`הכנס ${l}`} style={{...inp,paddingRight:40,fontSize:15}} />
              </div>
            </div>
          ))}
          {err&&<div style={{background:"rgba(244,63,94,0.1)",border:"1px solid rgba(244,63,94,0.25)",borderRadius:10,padding:"10px 14px",color:"#fca5a5",fontSize:13,marginBottom:14,textAlign:"center"}}>⚠ {err}</div>}
          <PrimaryBtn onClick={go} disabled={loading} style={{width:"100%",justifyContent:"center",padding:14,fontSize:16,marginTop:4,borderRadius:12}}>{loading?"מתחבר...":"כניסה למערכת →"}</PrimaryBtn>
        </div>
      </div>
        {/* Login footer */}
        <div style={{position:"fixed",left:0,right:0,bottom:0,background:"rgba(6,10,19,0.95)",color:"rgba(248,250,252,0.9)",fontSize:12,padding:"10px 12px",textAlign:"center",borderTop:"1px solid rgba(255,255,255,0.04)",zIndex:1100}}>
          © {new Date().getFullYear()} Avihai Yosipovich — כל הזכויות שמורות
        </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════
// SIDEBAR
// ════════════════════════════════════════════════════════════
function Sidebar({user,page,setPage,notifCount,onLogout}){
  const adminNav=[
    {key:"dashboard",icon:"📊",label:"דשבורד"},
    {key:"reports",icon:"📋",label:"דיווחים"},
    {key:"businesses",icon:"🏢",label:"עסקים"},
    {key:"users",icon:"👥",label:"משתמשים"},
    {key:"alerts",icon:"🔔",label:"התראות",badge:notifCount},
  ];
  const inspNav=[
    {key:"dashboard",icon:"📊",label:"דשבורד"},
    {key:"myBusinesses",icon:"🏢",label:"העסקים שלי"},
    {key:"myReports",icon:"📋",label:"הדיווחים שלי"},
    {key:"alerts",icon:"🔔",label:"התראות",badge:notifCount},
  ];
  const nav=user.role==="admin"?adminNav:inspNav;
  return(
    <div style={{width:220,background:C.sidebar,backdropFilter:"blur(20px)",WebkitBackdropFilter:"blur(20px)",borderLeft:"1px solid rgba(255,255,255,0.06)",display:"flex",flexDirection:"column",flexShrink:0,height:"100vh",position:"sticky",top:0}}>
      <div style={{padding:"24px 20px 20px",borderBottom:"1px solid rgba(255,255,255,0.06)"}}>
        <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:20}}>
          <div style={{width:36,height:36,borderRadius:10,background:"linear-gradient(135deg,#38bdf8,#6366f1)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:18,boxShadow:"0 4px 12px rgba(56,189,248,0.2)"}}>🏛️</div>
          <div style={{lineHeight:1.2}}>
            <div style={{color:C.text,fontWeight:800,fontSize:14,letterSpacing:-0.3}}>ביקורת עסקים</div>
            <div style={{color:C.textDim,fontSize:10}}>מערכת עירונית</div>
          </div>
        </div>
        <div style={{display:"flex",alignItems:"center",gap:10,background:"rgba(255,255,255,0.03)",border:"1px solid rgba(255,255,255,0.04)",borderRadius:12,padding:"10px 12px"}}>
          <Avatar name={user.name} size={32} role={user.role} />
          <div style={{flex:1,minWidth:0}}>
            <div style={{color:C.text,fontSize:12,fontWeight:600,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{user.name}</div>
            <div style={{color:C.textDim,fontSize:10}}>{user.role==="admin"?"מנהל מערכת":"מפקח"}</div>
          </div>
        </div>
      </div>
      <nav style={{flex:1,padding:"16px 12px",display:"flex",flexDirection:"column",gap:4}}>
        {nav.map(n=>(
          <button key={n.key} onClick={()=>setPage(n.key)}
            style={{display:"flex",alignItems:"center",gap:10,padding:"11px 14px",borderRadius:12,border:"none",background:page===n.key?"rgba(56,189,248,0.1)":"transparent",color:page===n.key?C.text:C.textMuted,cursor:"pointer",fontSize:14,fontWeight:page===n.key?600:400,textAlign:"right",transition:"all .15s",position:"relative",fontFamily:"inherit"}}>
            <span style={{fontSize:18}}>{n.icon}</span>
            <span style={{flex:1}}>{n.label}</span>
            {n.badge>0&&<span style={{background:C.red,color:"#fff",borderRadius:10,minWidth:18,height:18,display:"flex",alignItems:"center",justifyContent:"center",fontSize:10,fontWeight:700,padding:"0 5px",boxShadow:"0 2px 8px rgba(244,63,94,0.3)"}}>{n.badge}</span>}
            {page===n.key&&<div style={{position:"absolute",left:0,top:"20%",bottom:"20%",width:3,background:C.blue,borderRadius:2}} />}
          </button>
        ))}
      </nav>
      <div style={{padding:"16px 12px",borderTop:"1px solid rgba(255,255,255,0.06)"}}>
        <button onClick={onLogout} style={{width:"100%",display:"flex",alignItems:"center",gap:10,padding:"10px 12px",borderRadius:10,border:"none",background:"transparent",color:"#fca5a5",cursor:"pointer",fontSize:13,fontFamily:"inherit"}}>
          <span>🚪</span><span>התנתק</span>
        </button>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════
// REPORT DETAIL MODAL
// ════════════════════════════════════════════════════════════
function ReportDetailModal({report,businesses,users,onClose}){
  const biz=businesses.find(b=>b.id===report.businessId);
  const insp=users.find(u=>u.id===report.inspectorId);
  const radarData=CATEGORIES.map(c=>({cat:c,value:report.categories?.[c]||0}));
  const urgencyMap={high:["🔴","דחוף",C.red],medium:["🟡","בינוני",C.amber],low:["🟢","רגיל",C.green]};
  const[urg,urgLbl,urgCol]=urgencyMap[report.urgency||"low"];
  return(
    <Modal onClose={onClose} width={680}>
      <ModalHead title={`דוח ביקורת — ${biz?.name}`} sub={`מפקח: ${insp?.name||"—"} · תאריך: ${report.date}`} onClose={onClose} />
      <div style={{display:"flex",flexWrap:"wrap",gap:8,marginBottom:24}}>
        <ScoreBadge score={report.score} large />
        <Tag>{biz?.type}</Tag>
        <Tag color="#a5b4fc" bg="rgba(99,102,241,0.1)">{biz?.license}</Tag>
        <span style={{background:`${urgCol}15`,color:urgCol,borderRadius:6,padding:"2px 10px",fontSize:12,fontWeight:600,display:"flex",alignItems:"center",gap:4}}>{urg} {urgLbl}</span>
        {report.followUp&&<Tag color={C.amber} bg="rgba(245,158,11,0.1)">מעקב: {report.followUp}</Tag>}
      </div>

      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16,marginBottom:22}}>
        <div style={{...cardStyle,padding:16}}>
          <SectionTitle>ציונים לפי קטגוריה</SectionTitle>
          {CATEGORIES.map(c=>(
            <div key={c} style={{marginBottom:12}}>
              <div style={{display:"flex",justifyContent:"space-between",marginBottom:5}}>
                <span style={{color:C.textMuted,fontSize:12}}>{c}</span>
                <span style={{color:C.blue,fontSize:12,fontWeight:700}}>{report.categories?.[c]||0}/5</span>
              </div>
              <ScoreBar value={report.categories?.[c]||0} color={report.categories?.[c]>=4?C.green:report.categories?.[c]>=3?C.amber:C.red} />
            </div>
          ))}
        </div>
        <div style={{...cardStyle,padding:16,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center"}}>
          <ResponsiveContainer width="100%" height={160}>
            <RadarChart data={radarData}>
              <PolarGrid stroke="rgba(255,255,255,0.1)" />
              <PolarAngleAxis dataKey="cat" tick={{fill:C.textMuted,fontSize:11}} />
              <Radar dataKey="value" stroke={C.blue} fill={C.blue} fillOpacity={0.25} />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {report.observations&&(
        <div style={{marginBottom:18}}>
          <SectionTitle>👁 תצפיות המפקח</SectionTitle>
          <div style={{background:"rgba(59,130,246,0.06)",border:"1px solid rgba(59,130,246,0.15)",borderRadius:12,padding:"16px 18px",color:"rgba(255,255,255,0.8)",fontSize:14,lineHeight:1.75}}>{report.observations}</div>
        </div>
      )}

      {report.violations.length>0&&(
        <div style={{marginBottom:18}}>
          <SectionTitle>⚠ ממצאים והפרות ({report.violations.length})</SectionTitle>
          <div style={{display:"grid",gap:8}}>
            {report.violations.map((v,i)=>(
              <div key={i} style={{display:"flex",alignItems:"center",gap:12,background:"rgba(239,68,68,0.07)",border:"1px solid rgba(239,68,68,0.16)",borderRadius:10,padding:"10px 14px"}}>
                <span style={{color:C.red,fontSize:18,flexShrink:0}}>⚠</span>
                <span style={{color:"#fca5a5",fontSize:14}}>{v}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {report.violations.length===0&&(
        <div style={{marginBottom:18,background:"rgba(34,197,94,0.06)",border:"1px solid rgba(34,197,94,0.15)",borderRadius:10,padding:"12px 16px",display:"flex",alignItems:"center",gap:10}}>
          <span style={{fontSize:20}}>✅</span>
          <span style={{color:"#86efac",fontSize:14}}>לא נמצאו ממצאים — הביקורת עברה בהצלחה</span>
        </div>
      )}

      {report.notes&&(
        <div>
          <SectionTitle>📝 הערות מסכמות</SectionTitle>
          <div style={{background:"rgba(255,255,255,0.04)",borderRadius:10,padding:"14px 16px",color:C.textMuted,fontSize:14,lineHeight:1.7}}>{report.notes}</div>
        </div>
      )}
    </Modal>
  );
}

// ════════════════════════════════════════════════════════════
// NEW REPORT MODAL
// ════════════════════════════════════════════════════════════
function NewReportModal({business,user,onSave,onClose}){
  const[cats,setCats]=useState({היגיינה:3,בטיחות:3,תיעוד:3,שירות:3});
  const[violations,setViolations]=useState([""]);
  const[observations,setObs]=useState("");
  const[notes,setNotes]=useState("");
  const[urgency,setUrgency]=useState("low");
  const[followUp,setFollowUp]=useState("");
  const[saving,setSaving]=useState(false);
  const score=Math.round(Object.values(cats).reduce((a,b)=>a+b,0)/CATEGORIES.length*20);

  const catColor=v=>v>=4?C.green:v>=3?C.amber:C.red;

  const go=()=>{
    setSaving(true);
    setTimeout(()=>onSave({businessId:business.id,inspectorId:user.id,date:new Date().toISOString().split("T")[0],score,status:"הושלם",urgency,violations:violations.filter(v=>v.trim()),observations,notes,categories:cats,followUp:followUp||null}),400);
  };

  return(
    <Modal onClose={onClose}>
      <ModalHead title="דיווח ביקורת חדשה" sub={`${business.name} · ${business.type}`} onClose={onClose} />
      <div style={{display:"flex",gap:12,marginBottom:24,padding:"14px 18px",background:"rgba(255,255,255,0.04)",borderRadius:14,alignItems:"center"}}>
        <div style={{flex:1}}>
          <div style={{color:C.textDim,fontSize:11,marginBottom:4}}>ציון כולל מחושב</div>
          <ScoreBadge score={score} large />
        </div>
        <div>
          <div style={{color:C.textDim,fontSize:11,marginBottom:6}}>רמת דחיפות</div>
          <div style={{display:"flex",gap:6}}>
            {[["low","🟢","רגיל"],["medium","🟡","בינוני"],["high","🔴","דחוף"]].map(([k,ic,l])=>(
              <button key={k} onClick={()=>setUrgency(k)} style={{padding:"5px 11px",border:`1px solid ${urgency===k?"rgba(255,255,255,0.3)":"rgba(255,255,255,0.1)"}`,borderRadius:8,background:urgency===k?"rgba(255,255,255,0.12)":"transparent",color:urgency===k?C.text:C.textMuted,cursor:"pointer",fontSize:12,fontFamily:"inherit"}}>{ic} {l}</button>
            ))}
          </div>
        </div>
      </div>

      <div style={{marginBottom:22}}>
        <SectionTitle>ציון לפי קטגוריה (1–5)</SectionTitle>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
          {CATEGORIES.map(c=>(
            <div key={c} style={{background:"rgba(255,255,255,0.04)",borderRadius:10,padding:"14px 16px"}}>
              <div style={{display:"flex",justifyContent:"space-between",marginBottom:8}}>
                <span style={{color:C.textMuted,fontSize:13}}>{c}</span>
                <span style={{color:catColor(cats[c]),fontWeight:700,fontSize:15}}>{cats[c]}</span>
              </div>
              <input type="range" min={1} max={5} step={1} value={cats[c]} onChange={e=>setCats({...cats,[c]:+e.target.value})} style={{width:"100%",accentColor:catColor(cats[c])}} />
              <ScoreBar value={cats[c]} color={catColor(cats[c])} />
            </div>
          ))}
        </div>
      </div>

      <div style={{marginBottom:18}}>
        <SectionTitle>👁 מה ראית במהלך הביקורת</SectionTitle>
        <textarea value={observations} onChange={e=>setObs(e.target.value)} rows={4}
          placeholder="תאר בפירוט את מה שראית: מצב המקום, התנהגות העובדים, מצב ניקיון, ציוד, שלטים, מחסנים..."
          style={{...inp,resize:"vertical",lineHeight:1.7}} />
      </div>

      <div style={{marginBottom:18}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
          <SectionTitle>⚠ ממצאים / הפרות</SectionTitle>
          <button onClick={()=>setViolations([...violations,""])} style={{background:"rgba(59,130,246,0.1)",border:"1px solid rgba(59,130,246,0.22)",borderRadius:6,padding:"4px 10px",color:"#93c5fd",cursor:"pointer",fontSize:12,fontFamily:"inherit"}}>+ הוסף ממצא</button>
        </div>
        {violations.map((v,i)=>(
          <div key={i} style={{display:"flex",gap:8,marginBottom:8}}>
            <input value={v} onChange={e=>{const a=[...violations];a[i]=e.target.value;setViolations(a);}} placeholder={`ממצא ${i+1}...`} style={inp} />
            {violations.length>1&&<button onClick={()=>setViolations(violations.filter((_,j)=>j!==i))} style={{background:"rgba(239,68,68,0.1)",border:"none",borderRadius:8,width:38,color:"#f87171",cursor:"pointer",fontFamily:"inherit",flexShrink:0}}>✕</button>}
          </div>
        ))}
      </div>

      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:18}}>
        <div>
          <SectionTitle>📅 תאריך מעקב</SectionTitle>
          <input type="date" value={followUp} onChange={e=>setFollowUp(e.target.value)} style={{...inp,colorScheme:"dark"}} />
        </div>
        <div>
          <SectionTitle>📝 הערות מסכמות</SectionTitle>
          <textarea value={notes} onChange={e=>setNotes(e.target.value)} rows={3} style={{...inp,resize:"vertical"}} placeholder="סיכום, המלצות..." />
        </div>
      </div>

      <div style={{display:"flex",gap:10}}>
        <PrimaryBtn onClick={go} disabled={saving} style={{flex:1,justifyContent:"center",padding:13}}>{saving?"שומר...":"💾 שמור דיווח"}</PrimaryBtn>
        <GhostBtn onClick={onClose}>ביטול</GhostBtn>
      </div>
    </Modal>
  );
}

// ════════════════════════════════════════════════════════════
// DASHBOARD
// ════════════════════════════════════════════════════════════
function Dashboard({user,reports,businesses,users,setPage}){
  const isMobile = useIsMobile();
  const myReports=user.role==="admin"?reports:reports.filter(r=>r.inspectorId===user.id);
  const avg=myReports.length?Math.round(myReports.reduce((a,b)=>a+b.score,0)/myReports.length):0;
  const low=myReports.filter(r=>r.score<70).length;
  const violations=myReports.reduce((a,r)=>a+r.violations.length,0);

  const pending = useMemo(() => getPendingInspections(user, businesses, reports), [user, businesses, reports]);
  const urgentPending = pending.filter(p => p.urgency === "high");

  const byMonth=useMemo(()=>{
    const m={};
    myReports.forEach(r=>{const mon=r.date?.slice(0,7);if(mon){if(!m[mon])m[mon]={mon,count:0,avgScore:0,scores:[]};m[mon].count++;m[mon].scores.push(r.score);}});
    return Object.values(m).map(x=>({...x,avgScore:Math.round(x.scores.reduce((a,b)=>a+b,0)/x.scores.length)})).sort((a,b)=>a.mon.localeCompare(b.mon)).slice(-6);
  },[myReports]);

  const byType=useMemo(()=>{
    const m={};
    myReports.forEach(r=>{const biz=businesses.find(b=>b.id===r.businessId);if(biz){if(!m[biz.type])m[biz.type]={type:biz.type,count:0,scores:[]};m[biz.type].count++;m[biz.type].scores.push(r.score);}});
    return Object.values(m).map(x=>({...x,avg:Math.round(x.scores.reduce((a,b)=>a+b,0)/x.scores.length)}));
  },[myReports,businesses]);

  const COLORS=[C.blue,"#6366f1","#8b5cf6",C.green,C.amber,C.red,"#ec4899","#14b8a6"];
  const recent=[...myReports].sort((a,b)=>b.id-a.id).slice(0,5);

  return(
    <div className="page-dashboard">
      {urgentPending.length > 0 && (
        <div onClick={() => setPage("alerts")} className="pulse-urgent" style={{
          background: "rgba(244, 63, 94, 0.08)",
          border: "1px solid rgba(244, 63, 94, 0.25)",
          borderRadius: 16,
          padding: "16px 20px",
          marginBottom: 20,
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 12
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <span style={{ fontSize: 24 }}>⏰</span>
            <div>
              <div style={{ color: "#fca5a5", fontWeight: 700, fontSize: 15 }}>נדרשות ביקורות דחופות!</div>
              <div style={{ color: C.textMuted, fontSize: 13 }}>יש לך {urgentPending.length} משימות ביקורת דחופות הממתינות לביצוע. לחץ כאן לצפייה בפרטים.</div>
            </div>
          </div>
          <span style={{ color: "#fca5a5", fontSize: 18, marginRight: "auto" }}>←</span>
        </div>
      )}

      <div style={{display:"grid",gridTemplateColumns: isMobile ? "repeat(2,1fr)" : "repeat(4,1fr)",gap:14,marginBottom:24}}>
        <Stat icon="📋" value={myReports.length} label="סה״כ דיווחים" color={C.blue} delta={12} />
        <Stat icon="⭐" value={avg} label="ציון ממוצע" color={C.amber} delta={3} />
        <Stat icon="⚠️" value={low} label="עסקים בסיכון" color={C.red} delta={-5} />
        <Stat icon="🔍" value={violations} label="סה״כ ממצאים" color={C.purple} delta={-8} />
      </div>

      <div style={{display:"grid",gridTemplateColumns: isMobile ? "1fr" : "2fr 1fr",gap:16,marginBottom:16}}>
        <div style={cardStyle}>
          <SectionTitle>📈 ציון ממוצע לפי חודש</SectionTitle>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={byMonth}>
              <XAxis dataKey="mon" tick={{fill:C.textDim,fontSize:11}} />
              <YAxis domain={[0,100]} tick={{fill:C.textDim,fontSize:11}} />
              <Tooltip contentStyle={CT.tooltip} formatter={v=>[v,"ציון ממוצע"]} />
              <Line type="monotone" dataKey="avgScore" stroke={C.blue} strokeWidth={2.5} dot={{fill:C.blue,r:4}} />
            </LineChart>
          </ResponsiveContainer>
        </div>
        <div style={cardStyle}>
          <SectionTitle>🥧 ביקורות לפי סוג עסק</SectionTitle>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie data={byType} dataKey="count" nameKey="type" cx="50%" cy="50%" outerRadius={75} label={({type,percent})=>`${type} ${Math.round(percent*100)}%`} labelLine={false} fontSize={10}>
                {byType.map((_,i)=><Cell key={i} fill={COLORS[i%COLORS.length]} />)}
              </Pie>
              <Tooltip contentStyle={CT.tooltip} formatter={(v,n)=>[v,n]} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div style={{display:"grid",gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr",gap:16}}>
        <div style={cardStyle}>
          <SectionTitle>🏆 ציון ממוצע לפי סוג עסק</SectionTitle>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={byType} layout="vertical">
              <XAxis type="number" domain={[0,100]} tick={{fill:C.textDim,fontSize:10}} />
              <YAxis type="category" dataKey="type" tick={{fill:C.textMuted,fontSize:11}} width={70} />
              <Tooltip contentStyle={CT.tooltip} formatter={v=>[v,"ציון"]} />
              <Bar dataKey="avg" radius={[0,6,6,0]}>
                {byType.map((e,i)=><Cell key={i} fill={e.avg>=85?C.green:e.avg>=70?C.amber:C.red} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div style={cardStyle}>
          <SectionTitle>🕐 ביקורות אחרונות</SectionTitle>
          <div style={{display:"flex",flexDirection:"column",gap:8}}>
            {recent.map(r=>{
              const biz=businesses.find(b=>b.id===r.businessId);
              const insp=users.find(u=>u.id===r.inspectorId);
              return(
                <div key={r.id} style={{display:"flex",alignItems:"center",gap:10,padding:"10px 12px",background:"rgba(255,255,255,0.04)",borderRadius:10}}>
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{color:C.text,fontSize:13,fontWeight:500,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{biz?.name}</div>
                    <div style={{color:C.textDim,fontSize:11}}>{insp?.name} · {r.date}</div>
                  </div>
                  <ScoreBadge score={r.score} />
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════
// REPORTS PAGE
// ════════════════════════════════════════════════════════════
function ReportsPage({reports,businesses,users,filterInspectorId}){
  const[search,setSearch]=useState("");
  const[scoreFilter,setScoreFilter]=useState("all");
  const[urgFilter,setUrgFilter]=useState("all");
  const[viewing,setViewing]=useState(null);

  const pool=filterInspectorId?reports.filter(r=>r.inspectorId===filterInspectorId):reports;
  const filtered=pool.filter(r=>{
    const biz=businesses.find(b=>b.id===r.businessId);
    const insp=users.find(u=>u.id===r.inspectorId);
    const ms=s=>s?.toLowerCase().includes(search.toLowerCase());
    return(!search||ms(biz?.name)||ms(insp?.name)||ms(r.observations)||ms(r.notes))
      &&(scoreFilter==="all"||(scoreFilter==="high"&&r.score>=85)||(scoreFilter==="mid"&&r.score>=70&&r.score<85)||(scoreFilter==="low"&&r.score<70))
      &&(urgFilter==="all"||r.urgency===urgFilter);
  });

  return(
    <div className="page-reports">
      <div style={{display:"flex",gap:10,marginBottom:20,flexWrap:"wrap"}}>
        <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="🔍 חיפוש חופשי..." style={{...inp,flex:1,minWidth:200}} />
        <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
          {[["all","הכל"],["high","גבוה 85+"],["mid","בינוני"],["low","נמוך"]].map(([k,l])=><Pill key={k} active={scoreFilter===k} onClick={()=>setScoreFilter(k)}>{l}</Pill>)}
        </div>
        <div style={{display:"flex",gap:6}}>
          {[["all","כל דחיפות"],["high","🔴 דחוף"],["medium","🟡 בינוני"],["low","🟢 רגיל"]].map(([k,l])=><Pill key={k} active={urgFilter===k} onClick={()=>setUrgFilter(k)}>{l}</Pill>)}
        </div>
      </div>
      <div style={{color:C.textDim,fontSize:12,marginBottom:12}}>{filtered.length} דיווחים</div>
      <div style={{display:"grid",gap:10}}>
        {filtered.length===0?<EmptyState icon="📋" title="לא נמצאו דיווחים" sub="נסה לשנות את הסינון" />:
          [...filtered].sort((a,b)=>b.id-a.id).map(r=>{
            const biz=businesses.find(b=>b.id===r.businessId);
            const insp=users.find(u=>u.id===r.inspectorId);
            const urgMap={high:[C.red,"🔴"],medium:[C.amber,"🟡"],low:[C.green,"🟢"]};
            const[urgCol,urgIc]=urgMap[r.urgency||"low"];
            return(
              <div key={r.id} style={{...cardStyle,display:"flex",gap:14,alignItems:"flex-start",cursor:"pointer",transition:"border-color .15s"}}
                   onClick={()=>setViewing(r)}
                   onMouseEnter={e=>e.currentTarget.style.borderColor="rgba(59,130,246,0.4)"}
                   onMouseLeave={e=>e.currentTarget.style.borderColor=C.cardBorder}>
                <div style={{width:4,borderRadius:4,alignSelf:"stretch",flexShrink:0,background:urgCol}} />
                <div style={{flex:1,minWidth:0}}>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:6}}>
                    <div>
                      <span style={{color:C.text,fontWeight:600,fontSize:15}}>{biz?.name}</span>
                      <span style={{color:C.textDim,fontSize:11,marginRight:8}}>· {biz?.type}</span>
                    </div>
                    <ScoreBadge score={r.score} />
                  </div>
                  <div style={{display:"flex",gap:10,alignItems:"center",marginBottom:r.observations?8:0,flexWrap:"wrap"}}>
                    <span style={{color:C.textDim,fontSize:12}}>👤 {insp?.name}</span>
                    <span style={{color:C.textDim,fontSize:12}}>📅 {r.date}</span>
                    <span style={{color:urgCol,fontSize:12}}>{urgIc} {r.urgency==="high"?"דחוף":r.urgency==="medium"?"בינוני":"רגיל"}</span>
                    {r.violations.length>0&&<span style={{background:"rgba(239,68,68,0.1)",color:"#fca5a5",borderRadius:5,padding:"1px 8px",fontSize:11}}>{r.violations.length} ממצאים</span>}
                    {r.followUp&&<span style={{background:"rgba(245,158,11,0.1)",color:C.amber,borderRadius:5,padding:"1px 8px",fontSize:11}}>מעקב {r.followUp}</span>}
                  </div>
                  {r.observations&&<p style={{color:C.textDim,fontSize:12,margin:0,lineHeight:1.5,overflow:"hidden",textOverflow:"ellipsis",display:"-webkit-box",WebkitLineClamp:2,WebkitBoxOrient:"vertical"}}>{r.observations}</p>}
                </div>
              </div>
            );
          })}
      </div>
      {viewing&&<ReportDetailModal report={viewing} businesses={businesses} users={users} onClose={()=>setViewing(null)} />}
    </div>
  );
}

// ════════════════════════════════════════════════════════════
// BUSINESSES PAGE
// ════════════════════════════════════════════════════════════
function BusinessesPage({businesses,setBusinesses,reports,users,setUsers,setReports}){
  const[search,setSearch]=useState("");
  const[typeFilter,setTypeFilter]=useState("all");
  const[riskFilter,setRiskFilter]=useState("all");
  const[modal,setModal]=useState(null);
  const[form,setForm]=useState({name:"",type:"מסעדה",address:"",license:"",phone:"",active:true,risk:"low"});
  const[saving,setSaving]=useState(false);

  const openNew=()=>{setForm({name:"",type:"מסעדה",address:"",license:"",phone:"",active:true,risk:"low"});setModal("new");};
  const openEdit=b=>{setForm({...b});setModal(b);};

  const deleteBiz=biz=>{
    if(!window.confirm(`למחוק את העסק "${biz.name}"? פעולה זו לא ניתנת לביטול.`))return;
    setBusinesses(prev=>prev.filter(x=>x.id!==biz.id));
    setUsers(prev=>prev.map(u=>({
      ...u,
      assignedBusinesses:u.assignedBusinesses?.filter(id=>id!==biz.id) || []
    })));
    setReports(prev=>prev.filter(r=>r.businessId!==biz.id));
    if(modal&&modal.id===biz.id) setModal(null);
  };

  const saveBiz=()=>{
    setSaving(true);
    setTimeout(()=>{
      if(modal==="new")setBusinesses(prev=>[...prev,{...form,id:Date.now()}]);
      else setBusinesses(prev=>prev.map(b=>b.id===form.id?{...b,...form}:b));
      setSaving(false);setModal(null);
    },350);
  };

  const types=[...new Set(businesses.map(b=>b.type))];
  const filtered=businesses.filter(b=>{
    const ms=s=>s?.toLowerCase().includes(search.toLowerCase());
    return(!search||ms(b.name)||ms(b.address)||ms(b.license))
      &&(typeFilter==="all"||b.type===typeFilter)
      &&(riskFilter==="all"||b.risk===riskFilter);
  });

  return(
    <div className="page-businesses">
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:18,gap:12,flexWrap:"wrap"}}>
        <div style={{display:"flex",gap:8,flex:1,flexWrap:"wrap"}}>
          <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="🔍 חפש עסק..." style={{...inp,flex:"0 1 240px"}} />
          <div style={{display:"flex",gap:5,flexWrap:"wrap"}}>
            <Pill active={typeFilter==="all"} onClick={()=>setTypeFilter("all")}>הכל</Pill>
            {types.map(t=><Pill key={t} active={typeFilter===t} onClick={()=>setTypeFilter(t)}>{t}</Pill>)}
          </div>
          <div style={{display:"flex",gap:5}}>
            {[["all","כל סיכון"],["high","🔴 גבוה"],["medium","🟡 בינוני"],["low","🟢 תקין"]].map(([k,l])=><Pill key={k} active={riskFilter===k} onClick={()=>setRiskFilter(k)}>{l}</Pill>)}
          </div>
        </div>
        <PrimaryBtn onClick={openNew} icon="🏢">עסק חדש</PrimaryBtn>
      </div>

      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(300px,1fr))",gap:14}}>
        {filtered.map(biz=>{
          const bizReports=reports.filter(r=>r.businessId===biz.id);
          const last=[...bizReports].sort((a,b)=>b.id-a.id)[0];
          const avg=bizReports.length?Math.round(bizReports.reduce((a,b)=>a+b.score,0)/bizReports.length):null;
          return(
            <div key={biz.id} style={{...cardStyle,opacity:biz.active?1:.6,transition:"transform .15s,border-color .15s",cursor:"default"}}
                 onMouseEnter={e=>{e.currentTarget.style.transform="translateY(-2px)";e.currentTarget.style.borderColor="rgba(59,130,246,0.3)";}}
                 onMouseLeave={e=>{e.currentTarget.style.transform="none";e.currentTarget.style.borderColor=C.cardBorder;}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:10}}>
                <div>
                  <div style={{color:C.text,fontWeight:700,fontSize:15,marginBottom:4}}>{biz.name}</div>
                  <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
                    <Tag>{biz.type}</Tag>
                    <RiskBadge risk={biz.risk} />
                    {!biz.active&&<Tag color="#6b7280" bg="rgba(107,114,128,0.1)">מושבת</Tag>}
                  </div>
                </div>
                <div style={{display:"flex",gap:8}}>
                  <button onClick={()=>openEdit(biz)} style={{background:"rgba(255,255,255,0.07)",border:"none",borderRadius:7,padding:"5px 10px",color:C.textMuted,cursor:"pointer",fontSize:12,fontFamily:"inherit"}}>עריכה</button>
                  <button onClick={()=>deleteBiz(biz)} style={{background:"rgba(239,68,68,0.08)",border:"none",borderRadius:7,padding:"5px 10px",color:"#fca5a5",cursor:"pointer",fontSize:12,fontFamily:"inherit"}}>🗑 מחק</button>
                </div>
              </div>
              <div style={{color:C.textDim,fontSize:12,marginBottom:4}}>📍 {biz.address}</div>
              <div style={{color:C.textDim,fontSize:12,marginBottom:4}}>📞 {biz.phone}</div>
              <div style={{color:C.textDim,fontSize:12,marginBottom:12}}>📜 {biz.license}</div>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",paddingTop:10,borderTop:"1px solid rgba(255,255,255,0.06)"}}>
                <span style={{color:C.textDim,fontSize:12}}>{bizReports.length} ביקורות</span>
                {avg!==null?<ScoreBadge score={avg} />:<span style={{color:C.amber,fontSize:12}}>טרם נבדק</span>}
              </div>
              {last&&<div style={{color:C.textDim,fontSize:11,marginTop:4}}>ביקורת אחרונה: {last.date}</div>}
            </div>
          );
        })}
      </div>

      {modal!==null&&(
        <Modal onClose={()=>setModal(null)} width={500}>
          <ModalHead title={modal==="new"?"עסק חדש":"עריכת עסק"} onClose={()=>setModal(null)} />
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
            {[["שם העסק","name","text",2],["כתובת","address","text",2],["מספר רישיון","license","text",1],["טלפון","phone","tel",1]].map(([l,k,t,cols])=>(
              <div key={k} style={{gridColumn:`span ${cols}`}}>
                <label style={{color:C.textMuted,fontSize:12,display:"block",marginBottom:5}}>{l}</label>
                <input type={t} value={form[k]||""} onChange={e=>setForm({...form,[k]:e.target.value})} style={inp} />
              </div>
            ))}
            <div>
              <label style={{color:C.textMuted,fontSize:12,display:"block",marginBottom:5}}>סוג עסק</label>
              <select value={form.type} onChange={e=>setForm({...form,type:e.target.value})} style={{...inp,background:"#131f38"}}>
                {BIZ_TYPES.map(t=><option key={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label style={{color:C.textMuted,fontSize:12,display:"block",marginBottom:5}}>רמת סיכון</label>
              <select value={form.risk} onChange={e=>setForm({...form,risk:e.target.value})} style={{...inp,background:"#131f38"}}>
                <option value="low">תקין</option>
                <option value="medium">בינוני</option>
                <option value="high">גבוה</option>
              </select>
            </div>
            <div style={{gridColumn:"span 2",display:"flex",alignItems:"center",gap:10}}>
              <input type="checkbox" id="bizActive" checked={form.active} onChange={e=>setForm({...form,active:e.target.checked})} />
              <label htmlFor="bizActive" style={{color:C.textMuted,fontSize:13,cursor:"pointer"}}>עסק פעיל</label>
            </div>
          </div>
          <div style={{display:"flex",gap:10,marginTop:22}}>
            <PrimaryBtn onClick={saveBiz} disabled={saving} style={{flex:1,justifyContent:"center",padding:12}}>{saving?"שומר...":"שמור"}</PrimaryBtn>
            <GhostBtn onClick={()=>setModal(null)}>ביטול</GhostBtn>
          </div>
        </Modal>
      )}
    </div>
  );
}

// ════════════════════════════════════════════════════════════
// USERS PAGE
// ════════════════════════════════════════════════════════════
function UsersPage({users,setUsers,businesses,reports,user,setUser}){
  const[modal,setModal]=useState(null);
  const[permModal,setPermModal]=useState(null);
  const[form,setForm]=useState({username:"",password:"",name:"",role:"inspector",email:"",phone:"",active:true});
  const[saving,setSaving]=useState(false);const[err,setErr]=useState("");

  const openNew=()=>{setForm({username:"",password:"",name:"",role:"inspector",email:"",phone:"",active:true});setErr("");setModal("new");};
  const openEdit=u=>{setForm({...u});setErr("");setModal(u);};

  const save=()=>{
    if(!form.username.trim()||!form.password.trim()||!form.name.trim()){setErr("שם, שם משתמש וסיסמה הם שדות חובה");return;}
    if(modal==="new"&&users.find(u=>u.username===form.username)){setErr("שם משתמש כבר קיים");return;}
    setSaving(true);
    setTimeout(()=>{
      if(modal==="new"){
        setUsers(prev=>[...prev,{...form,id:Date.now(),assignedBusinesses:[],joinDate:new Date().toISOString().split("T")[0]}]);
      } else {
        setUsers(prev=>prev.map(u=>u.id===form.id?{...u,...form}:u));
        if(user?.id===form.id){
          setUser(prev=>({...prev,...form}));
        }
      }
      setSaving(false);setModal(null);
    },350);
  };

  const toggle=u=>setUsers(prev=>prev.map(x=>x.id===u.id?{...x,active:!x.active}:x));
  const del=u=>{ if(window.confirm(`למחוק את ${u.name}?`))setUsers(prev=>prev.filter(x=>x.id!==u.id));};

  return(
    <div className="page-users">
      <div style={{display:"flex",justifyContent:"space-between",marginBottom:20}}>
        <p style={{color:C.textDim,fontSize:13,margin:0}}>{users.length} משתמשים · {users.filter(u=>u.role==="inspector").length} מפקחים</p>
        <PrimaryBtn onClick={openNew} icon="👤">משתמש חדש</PrimaryBtn>
      </div>
      <div style={{display:"grid",gap:10}}>
        {users.map(u=>{
          const userReports=reports.filter(r=>r.inspectorId===u.id);
          return(
            <div key={u.id} style={{...cardStyle,display:"flex",gap:14,alignItems:"center",opacity:u.active?1:.55}}>
              <Avatar name={u.name} size={44} role={u.role} />
              <div style={{flex:1,minWidth:0}}>
                <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:3,flexWrap:"wrap"}}>
                  <span style={{color:C.text,fontWeight:700}}>{u.name}</span>
                  <Tag color={u.role==="admin"?"#fca5a5":"#a5b4fc"} bg={u.role==="admin"?"rgba(239,68,68,0.1)":"rgba(99,102,241,0.1)"}>{u.role==="admin"?"👑 מנהל":"🔍 מפקח"}</Tag>
                  {!u.active&&<Tag color="#6b7280" bg="rgba(107,114,128,0.1)">מושהה</Tag>}
                </div>
                <div style={{display:"flex",gap:12,flexWrap:"wrap"}}>
                  <span style={{color:C.textDim,fontSize:12}}>@{u.username}</span>
                  {u.email&&<span style={{color:C.textDim,fontSize:12}}>✉ {u.email}</span>}
                  {u.role==="inspector"&&<span style={{color:C.textDim,fontSize:12}}>🏢 {u.assignedBusinesses.length} עסקים · 📋 {userReports.length} דיווחים</span>}
                  {u.joinDate&&<span style={{color:C.textDim,fontSize:12}}>📅 הצטרף {u.joinDate}</span>}
                </div>
              </div>
              <div style={{display:"flex",gap:6,flexWrap:"wrap",justifyContent:"flex-end"}}>
                {u.role==="inspector"&&<button onClick={()=>setPermModal(u)} style={{background:"rgba(16,185,129,0.1)",border:"1px solid rgba(16,185,129,0.2)",borderRadius:8,padding:"7px 12px",color:"#34d399",cursor:"pointer",fontSize:12,fontFamily:"inherit"}}>🔐 הרשאות</button>}
                <button onClick={()=>openEdit(u)} style={{background:"rgba(99,102,241,0.1)",border:"1px solid rgba(99,102,241,0.2)",borderRadius:8,padding:"7px 12px",color:"#a5b4fc",cursor:"pointer",fontSize:12,fontFamily:"inherit"}}>✏️ עריכה</button>
                {u.role!=="admin"&&<button onClick={()=>toggle(u)} style={{background:u.active?"rgba(245,158,11,0.08)":"rgba(34,197,94,0.08)",border:`1px solid ${u.active?"rgba(245,158,11,0.2)":"rgba(34,197,94,0.2)"}`,borderRadius:8,padding:"7px 12px",color:u.active?C.amber:C.green,cursor:"pointer",fontSize:12,fontFamily:"inherit"}}>{u.active?"השהה":"הפעל"}</button>}
                {u.role!=="admin"&&<button onClick={()=>del(u)} style={{background:"rgba(239,68,68,0.08)",border:"1px solid rgba(239,68,68,0.2)",borderRadius:8,padding:"7px 12px",color:"#f87171",cursor:"pointer",fontSize:12,fontFamily:"inherit"}}>🗑</button>}
              </div>
            </div>
          );
        })}
      </div>

      {modal!==null&&(
        <Modal onClose={()=>setModal(null)} width={520}>
          <ModalHead title={modal==="new"?"משתמש חדש":"עריכת משתמש"} onClose={()=>setModal(null)} />
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
            {[["שם מלא","name","text",2],["שם משתמש","username","text",1],["סיסמה","password","password",1],["אימייל","email","email",1],["טלפון","phone","tel",1]].map(([l,k,t,cols])=>(
              <div key={k} style={{gridColumn:`span ${cols}`}}>
                <label style={{color:C.textMuted,fontSize:12,display:"block",marginBottom:5}}>{l}</label>
                <input type={t} value={form[k]||""} onChange={e=>setForm({...form,[k]:e.target.value})} style={inp} />
              </div>
            ))}
            <div>
              <label style={{color:C.textMuted,fontSize:12,display:"block",marginBottom:5}}>תפקיד</label>
              <select value={form.role} onChange={e=>setForm({...form,role:e.target.value})} style={{...inp,background:"#131f38"}}>
                <option value="inspector">מפקח</option>
                <option value="admin">מנהל</option>
              </select>
            </div>
            <div style={{display:"flex",alignItems:"center",gap:8}}>
              <input type="checkbox" id="ua" checked={form.active} onChange={e=>setForm({...form,active:e.target.checked})} />
              <label htmlFor="ua" style={{color:C.textMuted,fontSize:13,cursor:"pointer"}}>משתמש פעיל</label>
            </div>
          </div>
          {err&&<div style={{background:"rgba(239,68,68,0.1)",border:"1px solid rgba(239,68,68,0.22)",borderRadius:8,padding:"9px 14px",color:"#fca5a5",fontSize:13,marginTop:12}}>{err}</div>}
          <div style={{display:"flex",gap:10,marginTop:20}}>
            <PrimaryBtn onClick={save} disabled={saving} style={{flex:1,justifyContent:"center",padding:12}}>{saving?"שומר...":"שמור"}</PrimaryBtn>
            <GhostBtn onClick={()=>setModal(null)}>ביטול</GhostBtn>
          </div>
        </Modal>
      )}

      {permModal&&(
        <Modal onClose={()=>setPermModal(null)} width={500}>
          <ModalHead title={`🔐 הרשאות — ${permModal.name}`} sub="סמן עסקים שהמפקח רשאי לבקר" onClose={()=>setPermModal(null)} />
          <div style={{marginBottom:12,display:"flex",gap:8}}>
            <button onClick={()=>{const u={...permModal,assignedBusinesses:businesses.map(b=>b.id)};setPermModal(u);setUsers(prev=>prev.map(x=>x.id===u.id?u:x));}} style={{background:"rgba(59,130,246,0.1)",border:"1px solid rgba(59,130,246,0.2)",borderRadius:7,padding:"5px 12px",color:"#93c5fd",cursor:"pointer",fontSize:12,fontFamily:"inherit"}}>בחר הכל</button>
            <button onClick={()=>{const u={...permModal,assignedBusinesses:[]};setPermModal(u);setUsers(prev=>prev.map(x=>x.id===u.id?u:x));}} style={{background:"rgba(255,255,255,0.05)",border:"1px solid rgba(255,255,255,0.1)",borderRadius:7,padding:"5px 12px",color:C.textMuted,cursor:"pointer",fontSize:12,fontFamily:"inherit"}}>נקה הכל</button>
          </div>
          <div style={{display:"grid",gap:8,marginBottom:22}}>
            {businesses.map(biz=>{
              const checked=permModal.assignedBusinesses.includes(biz.id);
              const toggle2=()=>{
                const next=checked?permModal.assignedBusinesses.filter(id=>id!==biz.id):[...permModal.assignedBusinesses,biz.id];
                const updated={...permModal,assignedBusinesses:next};
                setPermModal(updated);setUsers(prev=>prev.map(u=>u.id===permModal.id?updated:u));
              };
              return(
                <div key={biz.id} onClick={toggle2}
                  style={{display:"flex",alignItems:"center",gap:12,padding:"12px 16px",background:checked?"rgba(59,130,246,0.08)":"rgba(255,255,255,0.03)",border:`1px solid ${checked?"rgba(59,130,246,0.3)":"rgba(255,255,255,0.07)"}`,borderRadius:12,cursor:"pointer",transition:"all .15s"}}>
                  <div style={{width:22,height:22,borderRadius:6,border:`2px solid ${checked?C.blue:"rgba(255,255,255,0.2)"}`,background:checked?C.blue:"transparent",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,transition:"all .15s"}}>
                    {checked&&<span style={{color:"#fff",fontSize:13,fontWeight:800}}>✓</span>}
                  </div>
                  <div style={{flex:1}}>
                    <div style={{color:C.text,fontSize:14,fontWeight:500}}>{biz.name}</div>
                    <div style={{color:C.textDim,fontSize:11}}>{biz.type} · {biz.address}</div>
                  </div>
                  <RiskBadge risk={biz.risk} />
                </div>
              );
            })}
          </div>
          <PrimaryBtn onClick={()=>setPermModal(null)} style={{width:"100%",justifyContent:"center",padding:12}}>✔ שמור הרשאות</PrimaryBtn>
        </Modal>
      )}
    </div>
  );
}

// ════════════════════════════════════════════════════════════
// ALERTS PAGE
// ════════════════════════════════════════════════════════════
function AlertsPage({ notifs, setNotifs, reports, setReports, businesses, user }) {
  const [reportingBiz, setReportingBiz] = useState(null);
  const isMobile = useIsMobile();
  const markAll = () => setNotifs(prev => prev.map(n => ({ ...n, read: true })));
  const dismiss = id => setNotifs(prev => prev.filter(n => n.id !== id));
  
  const typeIcon = { warning: "⚠️", info: "💡", success: "✅", error: "🔴" };
  const typeColor = { warning: C.amber, info: C.blue, success: C.green, error: C.red };

  const pendingInspections = useMemo(() => {
    return getPendingInspections(user, businesses, reports);
  }, [user, businesses, reports]);

  const relevantNotifs = useMemo(() => {
    if (user.role === "admin") return notifs;
    return notifs.filter(n => {
      const myAssignedBiz = businesses.filter(b => user.assignedBusinesses.includes(b.id));
      return myAssignedBiz.some(b => n.text.includes(b.name)) || n.text.includes(user.name);
    });
  }, [notifs, user, businesses]);

  const saveReport = (data) => {
    const newReport = { ...data, id: Date.now() };
    setReports(prev => [...prev, newReport]);
    
    const biz = businesses.find(b => b.id === data.businessId);
    const bizName = biz?.name || "עסק";
    const notifText = `התקבל דיווח חדש עבור "${bizName}" על ידי ${user.name} בציון ${data.score}`;
    const notifType = data.score < 70 ? "warning" : data.score >= 85 ? "success" : "info";
    
    const newNotif = {
      id: Date.now() + 1,
      type: notifType,
      text: notifText,
      date: new Date().toISOString().split("T")[0],
      read: false
    };
    setNotifs(prev => [...prev, newNotif]);
    setReportingBiz(null);
  };

  return (
    <div className="page-alerts">
      <div style={{ marginBottom: 32 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <div>
            <h2 style={{ color: C.text, margin: "0 0 4px", fontSize: 18, fontWeight: 700 }}>📋 ביקורות לביצוע (משימות פתוחות)</h2>
            <p style={{ color: C.textDim, fontSize: 13, margin: 0 }}>עסקים שטרם נבדקו, דורשים מעקב, או שלא נבדקו ב-30 הימים האחרונים</p>
          </div>
          <span style={{ background: pendingInspections.length > 0 ? "rgba(244,63,94,0.12)" : "rgba(16,185,129,0.12)", color: pendingInspections.length > 0 ? C.red : C.green, borderRadius: 10, padding: "4px 12px", fontSize: 12, fontWeight: 700 }}>
            {pendingInspections.length} משימות
          </span>
        </div>

        {pendingInspections.length === 0 ? (
          <div style={{ ...cardStyle, background: "rgba(16,185,129,0.04)", borderColor: "rgba(16,185,129,0.15)" }}>
            <EmptyState icon="🎉" title="כל הכבוד! אין ביקורות ממתינות" sub="כל העסקים מבוקרים ותקינים נכון לעכשיו." />
          </div>
        ) : (
          <div style={{ display: "grid", gap: 12 }}>
            {pendingInspections.map(item => {
              const urgMap = { high: [C.red, "🔴 דחוף"], medium: [C.amber, "🟡 בינוני"], low: [C.green, "🟢 רגיל"] };
              const [urgCol, urgLbl] = urgMap[item.urgency] || urgMap.low;
              
              return (
                <div key={item.id} className="glass-card" style={{
                  ...cardStyle,
                  display: "flex",
                  flexDirection: isMobile ? "column" : "row",
                  gap: 16,
                  alignItems: isMobile ? "stretch" : "center",
                  borderLeft: `5px solid ${urgCol}`
                }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6, flexWrap: "wrap" }}>
                      <span style={{ color: C.text, fontWeight: 700, fontSize: 15 }}>{item.businessName}</span>
                      <span style={{ background: `${urgCol}15`, color: urgCol, padding: "2px 8px", borderRadius: 6, fontSize: 11, fontWeight: 600 }}>{urgLbl}</span>
                      <span style={{ color: C.textDim, fontSize: 12 }}>({item.dateLabel})</span>
                    </div>
                    <div style={{ color: C.textMuted, fontSize: 13, lineHeight: 1.5 }}>{item.text}</div>
                  </div>
                  
                  {user.role === "inspector" && (
                    <button onClick={() => setReportingBiz(businesses.find(b => b.id === item.businessId))}
                      style={{
                        padding: "10px 18px",
                        background: "linear-gradient(135deg, #38bdf8, #6366f1)",
                        border: "none",
                        borderRadius: 10,
                        color: "#fff",
                        fontSize: 13,
                        fontWeight: 600,
                        cursor: "pointer",
                        whiteSpace: "nowrap",
                        boxShadow: "0 4px 14px rgba(56,189,248,0.2)",
                        transition: "all 0.2s"
                      }}>
                      📋 בצע ביקורת כעת
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <div>
            <h2 style={{ color: C.text, margin: "0 0 4px", fontSize: 18, fontWeight: 700 }}>🔔 התראות מערכת</h2>
            <p style={{ color: C.textDim, fontSize: 13, margin: 0 }}>דיווחים שהתקבלו ועדכוני מערכת שוטפים</p>
          </div>
          <div style={{ display: "flex", gap: 10 }}>
            {relevantNotifs.some(n => !n.read) && <GhostBtn onClick={markAll} style={{ padding: "6px 12px", fontSize: 12 }}>סמן הכל כנקרא</GhostBtn>}
          </div>
        </div>

        {relevantNotifs.length === 0 ? (
          <EmptyState icon="🔔" title="אין התראות חדשות" sub="מערכת ההתראות ריקה כרגע." />
        ) : (
          <div style={{ display: "grid", gap: 10 }}>
            {[...relevantNotifs].sort((a, b) => b.id - a.id).map(n => (
              <div key={n.id} style={{
                ...cardStyle,
                display: "flex",
                gap: 12,
                alignItems: "center",
                opacity: n.read ? 0.65 : 1,
                borderColor: n.read ? C.cardBorder : `${typeColor[n.type] || C.blue}30`,
                background: n.read ? "rgba(17, 24, 39, 0.3)" : "rgba(17, 24, 39, 0.55)",
                transition: "all 0.2s"
              }}>
                <span style={{ fontSize: 22, flexShrink: 0 }}>{typeIcon[n.type] || "💬"}</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ color: n.read ? C.textMuted : C.text, fontSize: 14, fontWeight: n.read ? 400 : 600, wordBreak: "break-word" }}>{n.text}</div>
                  <div style={{ color: C.textDim, fontSize: 11, marginTop: 4 }}>📅 {n.date}</div>
                </div>
                <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
                  {!n.read && (
                    <button onClick={() => setNotifs(prev => prev.map(x => x.id === n.id ? { ...x, read: true } : x))}
                      style={{ background: "rgba(56,189,248,0.12)", border: "1px solid rgba(56,189,248,0.25)", borderRadius: 8, padding: "6px 12px", color: "#38bdf8", cursor: "pointer", fontSize: 12, fontWeight: 600, fontFamily: "inherit" }}>
                      קרא
                    </button>
                  )}
                  <button onClick={() => dismiss(n.id)}
                    style={{ background: "rgba(244, 63, 94, 0.08)", border: "1px solid rgba(244, 63, 94, 0.25)", borderRadius: 8, padding: "6px 10px", color: "#fca5a5", cursor: "pointer", fontSize: 12, fontFamily: "inherit" }}>
                    ✕
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {reportingBiz && (
        <NewReportModal business={reportingBiz} user={user} onSave={saveReport} onClose={() => setReportingBiz(null)} />
      )}
    </div>
  );
}

// ════════════════════════════════════════════════════════════
// INSPECTOR MY-BUSINESSES
// ════════════════════════════════════════════════════════════
function MyBusinesses({user,businesses,reports,onSaveReport}){
  const[selected,setSelected]=useState(null);
  const isMobile = useIsMobile();
  const myBiz=businesses.filter(b=>user.assignedBusinesses.includes(b.id));
  const myReports=reports.filter(r=>r.inspectorId===user.id);
  const save=data=>{onSaveReport(data);setSelected(null);};

  return(
    <div>
      <p style={{color:C.textDim,fontSize:13,marginBottom:18}}>{myBiz.length} עסקים מוקצים לך לביקורת</p>
      <div style={{display:"grid",gridTemplateColumns: isMobile ? "1fr" : "repeat(auto-fill,minmax(300px,1fr))",gap:14}}>
        {myBiz.length===0?<EmptyState icon="🏢" title="לא הוקצו לך עסקים" sub="פנה למנהל לקבלת הרשאות" />:
          myBiz.map(biz=>{
            const bizReports=myReports.filter(r=>r.businessId===biz.id);
            const last=[...bizReports].sort((a,b)=>b.id-a.id)[0];
            return (
              <div key={biz.id} className="glass-card" style={cardStyle}>
                <div style={{display:"flex",justifyContent:"space-between",marginBottom:10}}>
                  <div>
                    <div style={{color:C.text,fontWeight:700,fontSize:15,marginBottom:4}}>{biz.name}</div>
                    <div style={{display:"flex",gap:6}}><Tag>{biz.type}</Tag><RiskBadge risk={biz.risk} /></div>
                  </div>
                  {last?<ScoreBadge score={last.score} />:<Tag color={C.amber} bg="rgba(245,158,11,0.1)">טרם נבדק</Tag>}
                </div>
                <div style={{color:C.textDim,fontSize:12,marginBottom:3}}>📍 {biz.address}</div>
                <div style={{color:C.textDim,fontSize:12,marginBottom:10}}>📞 {biz.phone}</div>
                {last&&<div style={{color:C.textDim,fontSize:11,marginBottom:10}}>ביקורת אחרונה: {last.date} · {bizReports.length} ביקורות</div>}
                <button onClick={()=>setSelected(biz)}
                  style={{width:"100%",padding:10,background:"rgba(56,189,248,0.12)",border:"1px solid rgba(56,189,248,0.25)",borderRadius:10,color:"#38bdf8",cursor:"pointer",fontSize:14,fontWeight:600,fontFamily:"inherit",transition:"all 0.2s"}}>
                  📋 דווח ביקורת חדשה
                </button>
              </div>
            );
          })}
      </div>
      {selected&&<NewReportModal business={selected} user={user} onSave={save} onClose={()=>setSelected(null)} />}
    </div>
  );
}

// ════════════════════════════════════════════════════════════
// APP ROOT
// ════════════════════════════════════════════════════════════
export default function App(){
  const{users,setUsers,businesses,setBusinesses,reports,setReports,notifs,setNotifs,resetDatabase}=useDB();
  const[user,setUser] = useState(() => {
    try {
      const stored = localStorage.getItem('loggedUser');
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });
  const[page,setPage]=useState("dashboard");
  const [menuOpen, setMenuOpen] = useState(false);
  const isMobile = useIsMobile();

  useEffect(() => {
    try {
      if (user) {
        localStorage.setItem('loggedUser', JSON.stringify(user));
      } else {
        localStorage.removeItem('loggedUser');
      }
    } catch {
      // ignore storage failures
    }
  }, [user]);

  const pendingInspections = useMemo(() => {
    return getPendingInspections(user, businesses, reports);
  }, [user, businesses, reports]);

  const unreadNotifs = notifs.filter(n => !n.read).length;
  const inspectorBadgeCount = unreadNotifs + pendingInspections.length;
  const adminBadgeCount = unreadNotifs;

  const handleAddReport = (reportData) => {
    const newReport = { ...reportData, id: Date.now() };
    setReports(prev => [...prev, newReport]);
    
    const biz = businesses.find(b => b.id === reportData.businessId);
    const insp = users.find(u => u.id === reportData.inspectorId);
    const bizName = biz?.name || "עסק";
    const inspName = insp?.name || "מפקח";
    
    const notifText = `התקבל דיווח חדש עבור "${bizName}" על ידי ${inspName} בציון ${reportData.score}`;
    const notifType = reportData.score < 70 ? "warning" : reportData.score >= 85 ? "success" : "info";
    
    const newNotif = {
      id: Date.now() + 1,
      type: notifType,
      text: notifText,
      date: new Date().toISOString().split("T")[0],
      read: false
    };
    setNotifs(prev => [...prev, newNotif]);
  };

  if(!user)return<LoginPage users={users} onLogin={u=>{setUser(u);setPage("dashboard");}} />;

  const pageTitle={
    dashboard:"📊 דשבורד",reports:"📋 כל הדיווחים",businesses:"🏢 ניהול עסקים",
    users:"👥 ניהול משתמשים",alerts:"🔔 התראות",
    myBusinesses:"🏢 העסקים שלי",myReports:"📋 הדיווחים שלי"
  };

  const adminNav=[
    {key:"dashboard",icon:"📊",label:"דשבורד"},
    {key:"reports",icon:"📋",label:"דיווחים"},
    {key:"businesses",icon:"🏢",label:"עסקים"},
    {key:"users",icon:"👥",label:"משתמשים"},
    {key:"alerts",icon:"🔔",label:"התראות",badge:adminBadgeCount},
  ];
  const inspNav=[
    {key:"dashboard",icon:"📊",label:"דשבורד"},
    {key:"myBusinesses",icon:"🏢",label:"העסקים שלי"},
    {key:"myReports",icon:"📋",label:"הדיווחים שלי"},
    {key:"alerts",icon:"🔔",label:"התראות",badge:inspectorBadgeCount},
  ];
  const nav=user.role==="admin"?adminNav:inspNav;

  return(
    <div style={{display:"flex",minHeight:"100vh",background:`radial-gradient(circle at 50% 50%, #0c1428, #050811), ${C.bg}`,fontFamily:"'Segoe UI',Tahoma,Arial,sans-serif",direction:"rtl",color:C.text,paddingTop: isMobile ? 60 : 0}}>
      <style>{`
        ::-webkit-scrollbar {
          width: 6px;
          height: 6px;
        }
        ::-webkit-scrollbar-track {
          background: #060a13;
        }
        ::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.1);
          border-radius: 4px;
        }
        ::-webkit-scrollbar-thumb:hover {
          background: rgba(255, 255, 255, 0.2);
        }
        
        .glass-card {
          background: rgba(17, 24, 39, 0.45) !important;
          backdrop-filter: blur(16px) !important;
          -webkit-backdrop-filter: blur(16px) !important;
          border: 1px solid rgba(255, 255, 255, 0.08) !important;
          box-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.3) !important;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1) !important;
        }
        .glass-card:hover {
          transform: translateY(-4px) !important;
          border-color: rgba(56, 189, 248, 0.3) !important;
          box-shadow: 0 12px 40px 0 rgba(56, 189, 248, 0.12) !important;
        }
        
        .sidebar-drawer {
          animation: slideInRight 0.3s forwards;
        }
        
        @keyframes slideInRight {
          from { transform: translateX(100%); }
          to { transform: translateX(0); }
        }
        
        @keyframes pulse-glow {
          0%, 100% { opacity: 0.85; box-shadow: 0 0 0 0 rgba(244, 63, 94, 0.4); }
          50% { opacity: 1; box-shadow: 0 0 16px 6px rgba(244, 63, 94, 0.2); }
        }
        .pulse-urgent {
          animation: pulse-glow 2s infinite;
        }

        /* Mobile adjustments */
        @media (max-width: 768px) {
          input, textarea, select { width: 100% !important; box-sizing: border-box; font-size: 16px; padding: 12px !important; }
          /* Do not force every button to full width — allow layout-preserving buttons via .fullwidth when needed */
          button { min-width: 0 !important; box-sizing: border-box; padding: 12px 14px !important; font-size: 16px; }
          button.fullwidth { width: 100% !important; }
          .glass-card { padding: 14px !important; border-radius: 12px !important; }
          .sidebar-drawer { width: 100% !important; right: 0 !important; left: 0 !important; }
          .sidebar-drawer nav button { text-align: right !important; padding: 12px 14px !important; }
          .pulse-urgent { font-size: 14px; }
          h1 { font-size: 18px !important; }
          .modal-inner { width: 100% !important; padding: 18px !important; border-radius: 12px !important; max-height: 94vh !important; }

          /* Page-specific tweaks (simplified, avoid brittle selectors) */
          .page-dashboard .glass-card { margin-bottom: 10px; }
          .page-reports .glass-card, .page-businesses .glass-card, .page-users .glass-card, .page-alerts .glass-card { width: 100% !important; display: block !important; }
          .page-users .avatar, .page-reports .avatar { margin-bottom: 8px; }
        }
      `}</style>

      {/* Desktop Sidebar */}
      {!isMobile && (
        <Sidebar user={user} page={page} setPage={setPage} notifCount={user.role === "admin" ? adminBadgeCount : inspectorBadgeCount} onLogout={()=>setUser(null)} />
      )}

      {/* Mobile Top Bar */}
      {isMobile && (
        <div style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          height: 60,
          background: C.sidebar,
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
          borderBottom: "1px solid rgba(255, 255, 255, 0.08)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0 16px",
          zIndex: 100,
          direction: "rtl"
        }}>
          <button onClick={() => setMenuOpen(true)} style={{ background: "transparent", border: "none", color: C.text, fontSize: 24, cursor: "pointer", display: "flex", alignItems: "center" }}>☰</button>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{ width: 28, height: 28, borderRadius: 8, background: "linear-gradient(135deg,#38bdf8,#6366f1)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14 }}>🏛️</div>
            <span style={{ color: C.text, fontWeight: 800, fontSize: 15, letterSpacing: -0.2 }}>ביקורת עסקים</span>
          </div>
          <Avatar name={user.name} size={30} role={user.role} />
        </div>
      )}

      {/* Mobile Navigation Drawer */}
      {isMobile && menuOpen && (
        <div style={{ position: "fixed", inset: 0, zIndex: 150, display: "flex", direction: "rtl" }}>
          <div onClick={() => setMenuOpen(false)} style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)", WebkitBackdropFilter: "blur(4px)" }} />
          <div className="sidebar-drawer" style={{
            position: "absolute",
            top: 0,
            right: 0,
            bottom: 0,
            width: 260,
            background: "#0d1428",
            borderLeft: "1px solid rgba(255,255,255,0.06)",
            boxShadow: "-4px 0 24px rgba(0,0,0,0.5)",
            display: "flex",
            flexDirection: "column",
            zIndex: 160
          }}>
            <div style={{ padding: "20px 16px", borderBottom: "1px solid rgba(255,255,255,0.06)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <Avatar name={user.name} size={32} role={user.role} />
                <div style={{ lineHeight: 1.2 }}>
                  <div style={{ color: C.text, fontWeight: 700, fontSize: 13 }}>{user.name}</div>
                  <div style={{ color: C.textDim, fontSize: 10 }}>{user.role === "admin" ? "מנהל מערכת" : "מפקח"}</div>
                </div>
              </div>
              <button onClick={() => setMenuOpen(false)} style={{ background: "transparent", border: "none", color: C.textDim, fontSize: 18, cursor: "pointer" }}>✕</button>
            </div>
            <nav style={{ flex: 1, padding: "16px 12px", display: "flex", flexDirection: "column", gap: 4 }}>
              {nav.map(n => (
                <button key={n.key} onClick={() => { setPage(n.key); setMenuOpen(false); }}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    padding: "12px 14px",
                    borderRadius: 12,
                    border: "none",
                    background: page === n.key ? "rgba(56, 189, 248, 0.1)" : "transparent",
                    color: page === n.key ? C.text : C.textMuted,
                    cursor: "pointer",
                    fontSize: 14,
                    fontWeight: page === n.key ? 600 : 400,
                    textAlign: "right",
                    fontFamily: "inherit",
                    position: "relative"
                  }}>
                  <span style={{ fontSize: 18 }}>{n.icon}</span>
                  <span style={{ flex: 1 }}>{n.label}</span>
                  {n.badge > 0 && <span style={{ background: C.red, color: "#fff", borderRadius: 10, minWidth: 18, height: 18, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 700, padding: "0 5px", boxShadow: "0 2px 8px rgba(244,63,94,0.3)" }}>{n.badge}</span>}
                </button>
              ))}
            </nav>
            <div style={{ padding: "16px 12px", borderTop: "1px solid rgba(255,255,255,0.06)" }}>
              <button onClick={() => { setUser(null); setMenuOpen(false); }} style={{ width: "100%", display: "flex", alignItems: "center", gap: 10, padding: "12px 14px", borderRadius: 12, border: "none", background: "transparent", color: "#fca5a5", cursor: "pointer", fontSize: 13, fontFamily: "inherit" }}>
                <span>🚪</span><span>התנתק</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Container */}
      <div style={{flex:1,display:"flex",flexDirection:"column",minWidth:0,overflowX:"hidden"}}>
        {/* Top Header Bar */}
        <div style={{
          padding: isMobile ? "16px 16px 0" : "20px 28px 0",
          borderBottom: "1px solid rgba(255,255,255,0.06)",
          marginBottom: 26,
          paddingBottom: 16,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: 12
        }}>
          <div>
            <h1 style={{color:C.text,margin:"0 0 2px",fontSize: isMobile ? 18 : 22,fontWeight:800,letterSpacing: -0.3}}>{pageTitle[page]||page}</h1>
            <p style={{color:C.textDim,margin:0,fontSize:11}}>
              {user.role==="admin"?`${reports.length} דיווחים · ${businesses.length} עסקים · ${users.filter(u=>u.role==="inspector").length} מפקחים`:`${user.assignedBusinesses?.length||0} עסקים מוקצים · ${reports.filter(r=>r.inspectorId===user.id).length} דיווחים`}
            </p>
          </div>
          <div style={{display:"flex",alignItems:"center",gap:10}}>
            {unreadNotifs > 0 && <div style={{background:"rgba(244, 63, 94, 0.12)",border:"1px solid rgba(244, 63, 94, 0.2)",borderRadius:10,padding:"6px 12px",color:"#fca5a5",fontSize:12,fontWeight: 600,cursor:"pointer"}} onClick={()=>setPage("alerts")}>🔔 {unreadNotifs} התראות חדשות</div>}
            <button onClick={()=>{if(window.confirm("לאפס את מסד הנתונים?")){resetDatabase();}}} style={{background:"transparent",border:"none",color:C.textDim,cursor:"pointer",fontSize:12,fontFamily:"inherit"}}>⚙ איפוס</button>
          </div>
        </div>

        {/* Content Body */}
        <div style={{padding: isMobile ? "0 16px 100px" : "0 28px 32px",flex:1}}>
          {page==="dashboard"&&<Dashboard user={user} reports={reports} businesses={businesses} users={users} setPage={setPage} />}
          {page==="reports"&&user.role==="admin"&&<ReportsPage reports={reports} businesses={businesses} users={users} />}
          {page==="businesses"&&user.role==="admin"&&<BusinessesPage businesses={businesses} setBusinesses={setBusinesses} reports={reports} users={users} setUsers={setUsers} setReports={setReports} />}
          {page==="users"&&user.role==="admin"&&<UsersPage users={users} setUsers={setUsers} businesses={businesses} reports={reports} user={user} setUser={setUser} />}
          {page==="alerts"&&<AlertsPage notifs={notifs} setNotifs={setNotifs} reports={reports} setReports={setReports} businesses={businesses} user={user} />}
          {page==="myBusinesses"&&user.role==="inspector"&&<MyBusinesses user={user} businesses={businesses} reports={reports} onSaveReport={handleAddReport} />}
          {page==="myReports"&&user.role==="inspector"&&<ReportsPage reports={reports} businesses={businesses} users={users} filterInspectorId={user.id} />}
        </div>
        {/* Footer */}
        <div style={{padding:12,textAlign:"center",borderTop:"1px solid rgba(255,255,255,0.04)",color:C.textDim,fontSize:12}}>
          © {new Date().getFullYear()} Avihai Yosipovich — כל הזכויות שמורות
        </div>
        {/* Mobile Bottom Navigation */}
        {isMobile && (
          <div style={{position:"fixed",left:0,right:0,bottom:0,height:64,background:C.sidebar,display:"flex",justifyContent:"space-around",alignItems:"center",borderTop:"1px solid rgba(255,255,255,0.06)",zIndex:220}}>
            {nav.map(n=> (
              <button key={n.key} onClick={()=>setPage(n.key)} style={{background:"transparent",border:"none",color:page===n.key?C.blue:C.textMuted,display:"flex",flexDirection:"column",alignItems:"center",gap:4,fontSize:12,cursor:"pointer"}}>
                <div style={{fontSize:18}}>{n.icon}</div>
                <div style={{fontSize:11}}>{n.label}</div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
