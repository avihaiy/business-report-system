import { useState, useEffect, useCallback, useMemo } from "react";
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, RadarChart, Radar, PolarGrid, PolarAngleAxis } from "recharts";

import { createClient } from '@supabase/supabase-js';

// ════════════════════════════════════════════════════════════
// STORAGE — Supabase Database (with Realtime Sync)
// ════════════════════════════════════════════════════════════
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

// ── localStorage helpers (fallback/optimistic sync) ──
const _storageKey = (key) => `brs:${key}`;
function readLocal(key) {
  try {
    const raw = localStorage.getItem(_storageKey(key));
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}
function writeLocal(key, value) {
  try { localStorage.setItem(_storageKey(key), JSON.stringify(value)); } catch {}
}

async function dbSet(k, d) {
  try {
    if (supabaseUrl) {
      await supabase.from('kv_store').upsert({ key: k, value: d });
    }
  } catch (err) {
    console.error('Supabase write error:', err);
  }
}
async function dbReset() {
  try {
    if (supabaseUrl) {
      await supabase.from('kv_store').upsert([
        { key: 'users', value: SEED_USERS },
        { key: 'businesses', value: SEED_BUSINESSES },
        { key: 'reports', value: SEED_REPORTS },
        { key: 'notifs', value: SEED_NOTIFS },
        { key: 'tasks', value: SEED_TASKS }
      ]);
      return true;
    }
  } catch { return false; }
  return false;
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
  {id:1,type:"warning",text:"ביקורת דחופה נדרשת: ברביקיו אורן",date:"2025-05-20",read:false,audience:"admin"},
  {id:2,type:"info",text:"מפקח דוד לוי סיים 3 ביקורות החודש",date:"2025-05-19",read:false,audience:"admin"},
  {id:3,type:"success",text:"בית מרקחת כרמל קיבל ציון מושלם 94",date:"2025-05-18",read:true,audience:"admin"},
];
const SEED_TASKS=[];
const CATEGORIES=["היגיינה","בטיחות","תיעוד","שירות"];

// ════════════════════════════════════════════════════════════
// DB HOOK — Supabase sync with localStorage fallback
// ════════════════════════════════════════════════════════════
function useDB(){
  // ── Initialise from localStorage; fall back to SEED ──
  const[users,setU]=useState(()=> readLocal('users') || SEED_USERS);
  const[businesses,setB]=useState(()=> readLocal('businesses') || SEED_BUSINESSES);
  const[reports,setR]=useState(()=> readLocal('reports') || SEED_REPORTS);
  const[notifs,setN]=useState(()=> readLocal('notifs') || SEED_NOTIFS);
  const[tasks,setT]=useState(()=> readLocal('tasks') || SEED_TASKS);

  // ── Sync from Supabase and listen for realtime changes ──
  useEffect(()=>{
    let active=true;
    let channel;
    const initSupabase=async()=>{
      try {
        if(!supabaseUrl) return;

        // Fetch initial data
        const { data, error } = await supabase.from('kv_store').select('key, value');
        if (error) throw error;
        
        if (!active) return;
        
        // If empty, initialize seed data on Supabase
        if (!data || data.length === 0) {
           await dbReset();
           return;
        }

        const kv = {};
        data.forEach(row => kv[row.key] = row.value);

        if(kv['users'] && Array.isArray(kv['users'])) { setU(kv['users']); writeLocal('users', kv['users']); }
        if(kv['businesses'] && Array.isArray(kv['businesses'])) { setB(kv['businesses']); writeLocal('businesses', kv['businesses']); }
        if(kv['reports'] && Array.isArray(kv['reports'])) { setR(kv['reports']); writeLocal('reports', kv['reports']); }
        if(kv['notifs'] && Array.isArray(kv['notifs'])) { setN(kv['notifs']); writeLocal('notifs', kv['notifs']); }
        if(kv['tasks'] && Array.isArray(kv['tasks'])) { setT(kv['tasks']); writeLocal('tasks', kv['tasks']); }

        // Subscribe to real-time changes
        channel = supabase.channel('kv_sync')
          .on('postgres_changes', { event: '*', schema: 'public', table: 'kv_store' }, payload => {
              if(payload.new && payload.new.key && payload.new.value) {
                const val = payload.new.value;
                if(payload.new.key === 'users') { setU(val); writeLocal('users', val); }
                if(payload.new.key === 'businesses') { setB(val); writeLocal('businesses', val); }
                if(payload.new.key === 'reports') { setR(val); writeLocal('reports', val); }
                if(payload.new.key === 'notifs') { setN(val); writeLocal('notifs', val); }
                if(payload.new.key === 'tasks') { setT(val); writeLocal('tasks', val); }
              }
          })
          .subscribe();

      } catch (err) {
        console.error('Supabase load/sync error:', err);
      }
    };
    initSupabase();
    return ()=>{
      active=false;
      if(channel) supabase.removeChannel(channel);
    };
  },[]);

  // ── Wrapped setters: update local state & sync to Supabase ──
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
  const setTasks=mk(setT,'tasks');

  // ── Reset to seed data ──
  const resetDatabase=useCallback(async()=>{
    await dbReset();
    setU(SEED_USERS);  writeLocal('users',SEED_USERS);
    setB(SEED_BUSINESSES); writeLocal('businesses',SEED_BUSINESSES);
    setR(SEED_REPORTS); writeLocal('reports',SEED_REPORTS);
    setN(SEED_NOTIFS);  writeLocal('notifs',SEED_NOTIFS);
    setT(SEED_TASKS);  writeLocal('tasks',SEED_TASKS);
  },[]);

  return{users,setUsers,businesses,setBusinesses,reports,setReports,notifs,setNotifs,tasks,setTasks,resetDatabase};
}

// ════════════════════════════════════════════════════════════
// DESIGN TOKENS & UTILITIES — Classic municipal / colorful
// ════════════════════════════════════════════════════════════
const FONT = "'Heebo', 'Segoe UI', Tahoma, Arial, sans-serif";
const C = {
  bg: "#eef4fb",
  bgAlt: "#e3edf7",
  sidebar: "#1e3a5f",
  sidebarDark: "#152a45",
  sidebarText: "#ffffff",
  sidebarMuted: "rgba(255,255,255,0.72)",
  card: "#ffffff",
  cardBorder: "#dce4ef",
  cardShadow: "0 4px 20px rgba(30, 58, 95, 0.08)",
  primary: "#1565c0",
  primaryLight: "#e3f2fd",
  blue: "#1976d2",
  blueD: "#0d47a1",
  teal: "#00897b",
  tealLight: "#e0f2f1",
  accent: "#5e35b1",
  accentLight: "#ede7f6",
  green: "#2e7d32",
  greenLight: "#e8f5e9",
  amber: "#ef6c00",
  amberLight: "#fff3e0",
  red: "#c62828",
  redLight: "#ffebee",
  purple: "#6a1b9a",
  purpleLight: "#f3e5f5",
  gold: "#f9a825",
  text: "#1e293b",
  textMuted: "#64748b",
  textDim: "#94a3b8",
};
const inp = {
  width: "100%",
  padding: "11px 14px",
  background: "#f8fafc",
  border: "1px solid #cbd5e1",
  borderRadius: 10,
  color: C.text,
  fontSize: 14,
  outline: "none",
  boxSizing: "border-box",
  direction: "rtl",
  fontFamily: "inherit",
  transition: "border-color 0.2s, box-shadow 0.2s",
};
const cardStyle = {
  background: C.card,
  border: `1px solid ${C.cardBorder}`,
  borderRadius: 14,
  padding: "20px 22px",
  boxShadow: C.cardShadow,
};
const pageHeaderStyle = {
  background: C.card,
  borderBottom: `3px solid ${C.primary}`,
  boxShadow: "0 2px 12px rgba(30,58,95,0.06)",
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

function filterNotifsForUser(notifs, user, businesses) {
  if (user.role === "admin") {
    return notifs.filter(n => !n.userId || n.audience === "admin");
  }
  return notifs.filter(n => {
    if (n.userId) return n.userId === user.id;
    if (n.audience === "admin") return false;
    const myAssignedBiz = businesses.filter(b => user.assignedBusinesses.includes(b.id));
    return myAssignedBiz.some(b => n.text.includes(b.name)) || n.text.includes(user.name);
  });
}

function getPendingTasksForUser(tasks, user) {
  const pending = tasks.filter(t => t.status === "pending");
  if (user.role === "admin") return pending;
  return pending.filter(t => t.inspectorId === user.id);
}

function completeTasksForReport(setTasks, businessId, inspectorId, reportId) {
  const today = new Date().toISOString().split("T")[0];
  setTasks(prev => prev.map(t =>
    t.status === "pending" && t.businessId === businessId && t.inspectorId === inspectorId
      ? { ...t, status: "completed", completedAt: today, reportId }
      : t
  ));
}

// ════════════════════════════════════════════════════════════
// SMALL COMPONENTS
// ════════════════════════════════════════════════════════════
function Avatar({name,size=36,role}){
  const bg=role==="admin"?"linear-gradient(135deg,#c62828,#8e0000)":role==="inspector"?"linear-gradient(135deg,#1565c0,#00897b)":"linear-gradient(135deg,#2e7d32,#1b5e20)";
  return<div style={{width:size,height:size,borderRadius:size/3,background:bg,display:"flex",alignItems:"center",justifyContent:"center",color:"#fff",fontWeight:700,fontSize:size*0.38,flexShrink:0,boxShadow:"0 2px 8px rgba(0,0,0,0.15)"}}>{name?.[0]||"?"}</div>;
}

function ScoreBadge({score,large}){
  const col=score>=85?C.green:score>=70?C.amber:C.red;
  const bg=score>=85?C.greenLight:score>=70?C.amberLight:C.redLight;
  return<span style={{background:bg,color:col,border:`2px solid ${col}30`,borderRadius:large?10:8,padding:large?"8px 16px":"4px 12px",fontWeight:800,fontSize:large?18:13,display:"inline-block"}}>{score}</span>;
}

function RiskBadge({risk}){
  const map={high:["סיכון גבוה",C.red,C.redLight],medium:["סיכון בינוני",C.amber,C.amberLight],low:["תקין",C.green,C.greenLight]};
  const[l,col,bg]=map[risk]||map.low;
  return<span style={{background:bg,color:col,borderRadius:20,padding:"3px 10px",fontSize:11,fontWeight:700,border:`1px solid ${col}35`}}>{l}</span>;
}

function Tag({children,color=C.primary,bg=C.primaryLight}){
  return<span style={{background:bg,color,borderRadius:20,padding:"3px 10px",fontSize:12,fontWeight:600,border:`1px solid ${color}25`}}>{children}</span>;
}

function Pill({children,active,onClick}){
  return<button onClick={onClick} className="pill-btn" style={{padding:"7px 16px",border:`2px solid ${active?C.primary:"#cbd5e1"}`,borderRadius:20,background:active?C.primaryLight:"#fff",color:active?C.primary:C.textMuted,cursor:"pointer",fontSize:13,fontWeight:active?700:500,transition:"all .15s",fontFamily:"inherit"}}>{children}</button>;
}

function Stat({icon,value,label,color,delta}){
  const accent=color||C.primary;
  const tint=color===C.amber?C.amberLight:color===C.red?C.redLight:color===C.purple?C.purpleLight:color===C.teal?C.tealLight:C.primaryLight;
  return(
    <div style={{...cardStyle,position:"relative",overflow:"hidden",borderTop:`4px solid ${accent}`,background:`linear-gradient(145deg, ${tint} 0%, #fff 55%)`}}>
      <div style={{position:"absolute",top:-8,left:-8,fontSize:56,opacity:.12}}>{icon}</div>
      <div style={{fontSize:26,marginBottom:8,lineHeight:1}}>{icon}</div>
      <div style={{color:accent,fontSize:30,fontWeight:800,lineHeight:1}}>{value}</div>
      {delta!=null&&<div style={{color:delta>=0?C.green:C.red,fontSize:11,marginTop:4,fontWeight:600}}>{delta>=0?"↑":"↓"} {Math.abs(delta)}% מהחודש שעבר</div>}
      <div style={{color:C.textMuted,fontSize:13,marginTop:8,fontWeight:600}}>{label}</div>
    </div>
  );
}

function Modal({onClose,children,width=600}){
  const isMobile = useIsMobile();
  return(
    <div style={{position:"fixed",inset:0,background:"rgba(15,23,42,0.45)",display:"flex",alignItems:isMobile?"flex-end":"center",justifyContent:"center",zIndex:300,direction:"rtl",padding:isMobile?0:16}} onClick={e=>{if(e.target===e.currentTarget)onClose();}}>
      <div className="modal-inner" style={{background:"#fff",border:`1px solid ${C.cardBorder}`,borderRadius:isMobile?"20px 20px 0 0":16,width:isMobile?"100%":width,maxWidth:"100vw",maxHeight:isMobile?"90vh":"92vh",overflowY:"auto",padding:isMobile?"24px 20px 40px":"28px 32px",boxShadow:"0 24px 48px rgba(30,58,95,0.18)"}}>
        {children}
      </div>
    </div>
  );
}

function ModalHead({title,sub,onClose}){
  return(
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:26}}>
      <div><h2 style={{color:C.text,margin:"0 0 4px",fontSize:20,fontWeight:700}}>{title}</h2>{sub&&<p style={{color:C.textMuted,margin:0,fontSize:13}}>{sub}</p>}</div>
      <button onClick={onClose} style={{background:C.bg,border:`1px solid ${C.cardBorder}`,borderRadius:8,width:34,height:34,color:C.textMuted,cursor:"pointer",fontSize:18,flexShrink:0,fontFamily:"inherit"}}>✕</button>
    </div>
  );
}

function PrimaryBtn({onClick,disabled,children,style={},icon}){
  const isMobile = useIsMobile();
  const fullWidth = isMobile && style && style.fullwidth!==false;
  const baseStyle = {padding:"11px 22px",background:disabled?"#94a3b8":"linear-gradient(135deg,#1565c0,#00897b)",border:"none",borderRadius:10,color:"#fff",fontSize:14,fontWeight:700,cursor:disabled?"default":"pointer",display:"flex",alignItems:"center",gap:6,boxShadow:disabled?"none":"0 4px 14px rgba(21,101,192,0.28)",fontFamily:"inherit",transition:"transform 0.15s, box-shadow 0.15s"};
  return<button onClick={onClick} disabled={disabled} className="primary-btn" style={{...baseStyle, ...(fullWidth?{width:"100%"}:{}), ...style}}>{icon&&<span>{icon}</span>}{children}</button>;
}
function GhostBtn({onClick,children,style={},danger}){
  const isMobile = useIsMobile();
  const baseStyle = {padding:"11px 18px",background:danger?C.redLight:"#fff",border:`2px solid ${danger?C.red+"50":C.cardBorder}`,borderRadius:10,color:danger?C.red:C.textMuted,cursor:"pointer",fontSize:14,fontFamily:"inherit",fontWeight:600};
  return<button onClick={onClick} style={{...baseStyle, ...(isMobile?{width:"100%"}:{}), ...style}}>{children}</button>;
}

function SectionTitle({children}){
  return<p style={{color:C.primary,fontSize:12,fontWeight:800,margin:"0 0 12px",textTransform:"uppercase",letterSpacing:1.2}}>{children}</p>;
}

function ScoreBar({value,max=5,color=C.primary}){
  return(
    <div style={{display:"flex",gap:4,alignItems:"center"}}>
      {Array.from({length:max},(_,i)=>(
        <div key={i} style={{height:8,flex:1,borderRadius:4,background:i<value?color:"#e2e8f0"}} />
      ))}
    </div>
  );
}

function EmptyState({icon,title,sub}){
  return<div style={{textAlign:"center",padding:"48px 16px",color:C.textDim}}><div style={{fontSize:52,marginBottom:12}}>{icon}</div><div style={{fontSize:17,color:C.text,fontWeight:700,marginBottom:6}}>{title}</div>{sub&&<div style={{fontSize:14,color:C.textMuted}}>{sub}</div>}</div>;
}

const CT={
  tooltip:{background:"#fff",border:`1px solid ${C.cardBorder}`,borderRadius:10,color:C.text,fontSize:12,direction:"rtl",boxShadow:C.cardShadow},
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
    <div style={{minHeight:"100vh",background:`linear-gradient(145deg, ${C.bg} 0%, #dbeafe 40%, ${C.bgAlt} 100%)`,display:"flex",alignItems:"center",justifyContent:"center",fontFamily:FONT,direction:"rtl",padding:16}}>
      <div style={{width:"100%",maxWidth:440}}>
        <div style={{textAlign:"center",marginBottom:28}}>
          <div style={{width:80,height:80,borderRadius:20,background:"linear-gradient(135deg,#1565c0,#00897b)",display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 18px",fontSize:36,boxShadow:"0 8px 28px rgba(21,101,192,0.35)",border:"3px solid #fff"}}>🏛️</div>
          <h1 style={{color:C.sidebar,fontSize:28,fontWeight:800,margin:"0 0 8px",letterSpacing:-.5}}>מערכת ביקורת עסקים</h1>
          <p style={{color:C.textMuted,fontSize:15,margin:0,fontWeight:500}}>פלטפורמה עירונית לניהול ביקורות ופיקוח</p>
        </div>
        <div style={{background:"#fff",border:`1px solid ${C.cardBorder}`,borderRadius:20,padding:"32px 28px",boxShadow:"0 12px 40px rgba(30,58,95,0.12)",borderTop:`5px solid ${C.gold}`}}>
          {[["שם משתמש",u,setU,"text","👤"],["סיסמה",p,setP,"password","🔑"]].map(([l,v,fn,t,ic])=>(
            <div key={l} style={{marginBottom:16}}>
              <label style={{color:C.textMuted,fontSize:12,fontWeight:700,display:"block",marginBottom:6}}>{l}</label>
              <div style={{position:"relative"}}>
                <span style={{position:"absolute",right:13,top:"50%",transform:"translateY(-50%)",fontSize:16}}>{ic}</span>
                <input type={t} value={v} onChange={e=>fn(e.target.value)} onKeyDown={e=>e.key==="Enter"&&go()} placeholder={`הכנס ${l}`} style={{...inp,paddingRight:40,fontSize:15}} />
              </div>
            </div>
          ))}
          {err&&<div style={{background:C.redLight,border:`1px solid ${C.red}40`,borderRadius:10,padding:"10px 14px",color:C.red,fontSize:13,marginBottom:14,textAlign:"center",fontWeight:600}}>⚠ {err}</div>}
          <PrimaryBtn onClick={go} disabled={loading} style={{width:"100%",justifyContent:"center",padding:14,fontSize:16,marginTop:4,borderRadius:12}}>{loading?"מתחבר...":"כניסה למערכת →"}</PrimaryBtn>
        </div>
      </div>
        <div style={{position:"fixed",left:0,right:0,bottom:0,background:C.sidebar,color:C.sidebarMuted,fontSize:12,padding:"10px 12px",textAlign:"center",zIndex:1100}}>
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
    <div style={{width:240,background:`linear-gradient(180deg, ${C.sidebar} 0%, ${C.sidebarDark} 100%)`,display:"flex",flexDirection:"column",flexShrink:0,height:"100vh",position:"sticky",top:0,boxShadow:"4px 0 24px rgba(30,58,95,0.15)"}}>
      <div style={{padding:"22px 18px 18px",borderBottom:"1px solid rgba(255,255,255,0.1)"}}>
        <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:18}}>
          <div style={{width:40,height:40,borderRadius:12,background:"linear-gradient(135deg,#ffc107,#ef6c00)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:20,boxShadow:"0 4px 12px rgba(0,0,0,0.2)"}}>🏛️</div>
          <div style={{lineHeight:1.2}}>
            <div style={{color:C.sidebarText,fontWeight:800,fontSize:15,letterSpacing:-0.3}}>ביקורת עסקים</div>
            <div style={{color:C.sidebarMuted,fontSize:11}}>מערכת עירונית</div>
          </div>
        </div>
        <div style={{display:"flex",alignItems:"center",gap:10,background:"rgba(255,255,255,0.08)",border:"1px solid rgba(255,255,255,0.12)",borderRadius:12,padding:"10px 12px"}}>
          <Avatar name={user.name} size={34} role={user.role} />
          <div style={{flex:1,minWidth:0}}>
            <div style={{color:C.sidebarText,fontSize:13,fontWeight:700,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{user.name}</div>
            <div style={{color:C.sidebarMuted,fontSize:11}}>{user.role==="admin"?"מנהל מערכת":"מפקח"}</div>
          </div>
        </div>
      </div>
      <nav style={{flex:1,padding:"14px 10px",display:"flex",flexDirection:"column",gap:4}}>
        {nav.map(n=>(
          <button key={n.key} onClick={()=>setPage(n.key)}
            style={{display:"flex",alignItems:"center",gap:10,padding:"12px 14px",borderRadius:10,border:"none",background:page===n.key?"rgba(255,255,255,0.14)":"transparent",color:page===n.key?C.sidebarText:C.sidebarMuted,cursor:"pointer",fontSize:14,fontWeight:page===n.key?700:500,textAlign:"right",transition:"all .15s",position:"relative",fontFamily:"inherit"}}>
            <span style={{fontSize:18}}>{n.icon}</span>
            <span style={{flex:1}}>{n.label}</span>
            {n.badge>0&&<span style={{background:C.red,color:"#fff",borderRadius:10,minWidth:20,height:20,display:"flex",alignItems:"center",justifyContent:"center",fontSize:10,fontWeight:800,padding:"0 6px"}}>{n.badge}</span>}
            {page===n.key&&<div style={{position:"absolute",left:0,top:"18%",bottom:"18%",width:4,background:C.gold,borderRadius:2}} />}
          </button>
        ))}
      </nav>
      <div style={{padding:"14px 10px",borderTop:"1px solid rgba(255,255,255,0.1)"}}>
        <button onClick={onLogout} style={{width:"100%",display:"flex",alignItems:"center",gap:10,padding:"11px 14px",borderRadius:10,border:"1px solid rgba(255,255,255,0.15)",background:"rgba(255,255,255,0.06)",color:"#ffcdd2",cursor:"pointer",fontSize:13,fontFamily:"inherit",fontWeight:600}}>
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
  const isMobile = useIsMobile();
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
        <Tag color={C.accent} bg={C.accentLight}>{biz?.license}</Tag>
        <span style={{background:`${urgCol}15`,color:urgCol,borderRadius:6,padding:"2px 10px",fontSize:12,fontWeight:600,display:"flex",alignItems:"center",gap:4}}>{urg} {urgLbl}</span>
        {report.followUp&&<Tag color={C.amber} bg="rgba(245,158,11,0.1)">מעקב: {report.followUp}</Tag>}
      </div>

      <div style={{display:"grid",gridTemplateColumns:isMobile?"1fr":"1fr 1fr",gap:16,marginBottom:22}}>
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
              <PolarGrid stroke="#e2e8f0" />
              <PolarAngleAxis dataKey="cat" tick={{fill:C.textMuted,fontSize:11}} />
              <Radar dataKey="value" stroke={C.blue} fill={C.blue} fillOpacity={0.25} />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {report.observations&&(
        <div style={{marginBottom:18}}>
          <SectionTitle>👁 תצפיות המפקח</SectionTitle>
          <div style={{background:C.primaryLight,border:`1px solid ${C.primary}30`,borderRadius:12,padding:"16px 18px",color:C.text,fontSize:14,lineHeight:1.75}}>{report.observations}</div>
        </div>
      )}

      {report.photo&&(
        <div style={{marginBottom:18}}>
          <SectionTitle>📷 תמונה מהשטח</SectionTitle>
          <img src={report.photo} alt="תמונה מהשטח" style={{width:"100%", borderRadius:12, maxHeight: 300, objectFit:"cover", border:"1px solid rgba(255,255,255,0.1)"}} />
        </div>
      )}

      {report.violations.length>0&&(
        <div style={{marginBottom:18}}>
          <SectionTitle>⚠ ממצאים והפרות ({report.violations.length})</SectionTitle>
          <div style={{display:"grid",gap:8}}>
            {report.violations.map((v,i)=>(
              <div key={i} style={{display:"flex",alignItems:"center",gap:12,background:"rgba(239,68,68,0.07)",border:"1px solid rgba(239,68,68,0.16)",borderRadius:10,padding:"10px 14px"}}>
                <span style={{color:C.red,fontSize:18,flexShrink:0}}>⚠</span>
                <span style={{color:"#c62828",fontSize:14}}>{v}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {report.violations.length===0&&(
          <div style={{marginBottom:18,background:C.greenLight,border:`1px solid ${C.green}30`,borderRadius:10,padding:"12px 16px",display:"flex",alignItems:"center",gap:10}}>
          <span style={{fontSize:20}}>✅</span>
          <span style={{color:C.green,fontSize:14,fontWeight:600}}>לא נמצאו ממצאים — הביקורת עברה בהצלחה</span>
        </div>
      )}

      {report.notes&&(
        <div>
          <SectionTitle>📝 הערות מסכמות</SectionTitle>
          <div style={{background:"#f8fafc",border:`1px solid ${C.cardBorder}`,borderRadius:10,padding:"14px 16px",color:C.textMuted,fontSize:14,lineHeight:1.7}}>{report.notes}</div>
        </div>
      )}
    </Modal>
  );
}

// ════════════════════════════════════════════════════════════
// NEW REPORT MODAL
// ════════════════════════════════════════════════════════════
function NewReportModal({business,user,onSave,onClose}){
  const isMobile = useIsMobile();
  const[cats,setCats]=useState({היגיינה:3,בטיחות:3,תיעוד:3,שירות:3});
  const[violations,setViolations]=useState([""]);
  const[observations,setObs]=useState("");
  const[notes,setNotes]=useState("");
  const[urgency,setUrgency]=useState("low");
  const[followUp,setFollowUp]=useState("");
  const[photo,setPhoto]=useState(null);
  const[saving,setSaving]=useState(false);
  const score=Math.round(Object.values(cats).reduce((a,b)=>a+b,0)/CATEGORIES.length*20);

  const catColor=v=>v>=4?C.green:v>=3?C.amber:C.red;

  const handlePhotoCapture = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => setPhoto(reader.result);
    reader.readAsDataURL(file);
  };

  const go=()=>{
    setSaving(true);
    setTimeout(()=>onSave({businessId:business.id,inspectorId:user.id,date:new Date().toISOString().split("T")[0],score,status:"הושלם",urgency,violations:violations.filter(v=>v.trim()),observations,notes,categories:cats,followUp:followUp||null,photo}),400);
  };

  return(
    <Modal onClose={onClose}>
      <ModalHead title="דיווח ביקורת חדשה" sub={`${business.name} · ${business.type}`} onClose={onClose} />
      <div style={{display:"flex",gap:12,marginBottom:24,padding:"14px 18px",background:"rgba(255,255,255,0.04)",borderRadius:14,alignItems:isMobile?"flex-start":"center",flexDirection:isMobile?"column":"row"}}>
        <div style={{flex:1}}>
          <div style={{color:C.textDim,fontSize:11,marginBottom:4}}>ציון כולל מחושב</div>
          <ScoreBadge score={score} large />
        </div>
        <div style={{width:isMobile?"100%":"auto"}}>
          <div style={{color:C.textDim,fontSize:11,marginBottom:6}}>רמת דחיפות</div>
          <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
            {[["low","🟢","רגיל"],["medium","🟡","בינוני"],["high","🔴","דחוף"]].map(([k,ic,l])=>(
              <button key={k} onClick={()=>setUrgency(k)} style={{flex:isMobile?1:"none",padding:"5px 11px",border:`1px solid ${urgency===k?"rgba(255,255,255,0.3)":"rgba(255,255,255,0.1)"}`,borderRadius:8,background:urgency===k?"rgba(255,255,255,0.12)":"transparent",color:urgency===k?C.text:C.textMuted,cursor:"pointer",fontSize:12,fontFamily:"inherit"}}>{ic} {l}</button>
            ))}
          </div>
        </div>
      </div>

      <div style={{marginBottom:22}}>
        <SectionTitle>ציון לפי קטגוריה (1–5)</SectionTitle>
        <div style={{display:"grid",gridTemplateColumns:isMobile?"1fr":"1fr 1fr",gap:12}}>
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
        <SectionTitle>📷 צילום מהשטח (אופציונלי)</SectionTitle>
        {photo ? (
          <div style={{position:"relative"}}>
            <img src={photo} alt="תמונה מצורפת" style={{width:"100%", borderRadius:12, maxHeight: 300, objectFit:"cover"}} />
            <button onClick={() => setPhoto(null)} style={{position:"absolute", top:10, right:10, background:"rgba(0,0,0,0.6)", border:"1px solid rgba(255,255,255,0.2)", borderRadius:"50%", width:36, height:36, color:"#fff", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center"}}>✕</button>
          </div>
        ) : (
          <label style={{display:"block", width:"100%", padding:"24px", background:"rgba(255,255,255,0.03)", border:"1px dashed rgba(255,255,255,0.15)", borderRadius:12, textAlign:"center", cursor:"pointer", color:C.textMuted, transition:"all 0.2s"}}>
            <span style={{fontSize:28, display:"block", marginBottom:8}}>📸</span>
            <span style={{fontSize:14}}>לחץ כאן כדי לצלם או לבחור תמונה מהנייד</span>
            <input type="file" accept="image/*" capture="environment" onChange={handlePhotoCapture} style={{display:"none"}} />
          </label>
        )}
      </div>

      <div style={{marginBottom:18}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
          <SectionTitle>⚠ ממצאים / הפרות</SectionTitle>
          <button onClick={()=>setViolations([...violations,""])} style={{background:"rgba(59,130,246,0.1)",border:"1px solid rgba(59,130,246,0.22)",borderRadius:6,padding:"4px 10px",color:"#1565c0",cursor:"pointer",fontSize:12,fontFamily:"inherit"}}>+ הוסף ממצא</button>
        </div>
        {violations.map((v,i)=>(
          <div key={i} style={{display:"flex",gap:8,marginBottom:8}}>
            <input value={v} onChange={e=>{const a=[...violations];a[i]=e.target.value;setViolations(a);}} placeholder={`ממצא ${i+1}...`} style={inp} />
            {violations.length>1&&<button onClick={()=>setViolations(violations.filter((_,j)=>j!==i))} style={{background:"rgba(239,68,68,0.1)",border:"none",borderRadius:8,width:38,color:"#f87171",cursor:"pointer",fontFamily:"inherit",flexShrink:0}}>✕</button>}
          </div>
        ))}
      </div>

      <div style={{display:"grid",gridTemplateColumns:isMobile?"1fr":"1fr 1fr",gap:12,marginBottom:18}}>
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
function Dashboard({user,reports,businesses,users,setPage,tasks}){
  const isMobile = useIsMobile();
  const myReports=user.role==="admin"?reports:reports.filter(r=>r.inspectorId===user.id);
  const avg=myReports.length?Math.round(myReports.reduce((a,b)=>a+b.score,0)/myReports.length):0;
  const low=myReports.filter(r=>r.score<70).length;
  const violations=myReports.reduce((a,r)=>a+r.violations.length,0);

  const pending = useMemo(() => getPendingInspections(user, businesses, reports), [user, businesses, reports]);
  const urgentPending = pending.filter(p => p.urgency === "high");
  const assignedTasks = useMemo(() => getPendingTasksForUser(tasks || [], user), [tasks, user]);

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

  const COLORS=[C.blue,C.teal,C.accent,C.green,C.amber,C.red,"#00838f","#4527a0"];
  const recent=[...myReports].sort((a,b)=>b.id-a.id).slice(0,5);

  return(
    <div className="page-dashboard">
      {user.role === "inspector" && assignedTasks.length > 0 && (
        <div onClick={() => setPage("alerts")} className="pulse-urgent" style={{
          background: C.purpleLight,
          border: `2px solid ${C.purple}40`,
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
            <span style={{ fontSize: 24 }}>🎯</span>
            <div>
              <div style={{ color: C.purple, fontWeight: 700, fontSize: 15 }}>משימות ביקורת הפתעה מהמנהל!</div>
              <div style={{ color: C.textMuted, fontSize: 13 }}>יש לך {assignedTasks.length} משימות שהוקצו לך. לחץ כאן לצפייה וביצוע.</div>
            </div>
          </div>
          <span style={{ color: C.purple, fontSize: 18, marginRight: "auto" }}>←</span>
        </div>
      )}

      {urgentPending.length > 0 && (
        <div onClick={() => setPage("alerts")} className="pulse-urgent" style={{
          background: C.redLight,
          border: `2px solid ${C.red}35`,
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
              <div style={{ color: "#c62828", fontWeight: 700, fontSize: 15 }}>נדרשות ביקורות דחופות!</div>
              <div style={{ color: C.textMuted, fontSize: 13 }}>יש לך {urgentPending.length} משימות ביקורת דחופות הממתינות לביצוע. לחץ כאן לצפייה בפרטים.</div>
            </div>
          </div>
          <span style={{ color: "#c62828", fontSize: 18, marginRight: "auto" }}>←</span>
        </div>
      )}

      <div style={{display:"grid",gridTemplateColumns: isMobile ? "repeat(2,1fr)" : "repeat(4,1fr)",gap:14,marginBottom:24}}>
        <Stat icon="📋" value={myReports.length} label="סה״כ דיווחים" color={C.blue} delta={12} />
        <Stat icon="⭐" value={avg} label="ציון ממוצע" color={C.amber} delta={3} />
        <Stat icon="⚠️" value={low} label="עסקים בסיכון" color={C.red} delta={-5} />
        <Stat icon="🔍" value={violations} label="סה״כ ממצאים" color={C.teal} delta={-8} />
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
  const isMobile = useIsMobile();
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
      <div style={{display:"flex",gap:10,marginBottom:20,flexDirection: isMobile ? "column" : "row", flexWrap:"wrap"}}>
        <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="🔍 חיפוש חופשי..." style={{...inp,flex:1,minWidth:200}} />
        <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
          {[["all","הכל"],["high","גבוה 85+"],["mid","בינוני"],["low","נמוך"]].map(([k,l])=><Pill key={k} active={scoreFilter===k} onClick={()=>setScoreFilter(k)}>{l}</Pill>)}
        </div>
        <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
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
              <div key={r.id} style={{...cardStyle,display:"flex",gap:14,alignItems:isMobile ? "stretch" : "flex-start", flexDirection: isMobile ? "column" : "row", cursor:"pointer",transition:"border-color .15s"}}
                   onClick={()=>setViewing(r)}
                   onMouseEnter={e=>e.currentTarget.style.borderColor="rgba(59,130,246,0.4)"}
                   onMouseLeave={e=>e.currentTarget.style.borderColor=C.cardBorder}>
                <div style={{width:isMobile ? "100%" : 4, height: isMobile ? 4 : "auto", borderRadius:4, alignSelf:"stretch", flexShrink:0, background:urgCol}} />
                <div style={{flex:1,minWidth:0}}>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:6, flexDirection: isMobile ? "column" : "row", gap: isMobile ? 8 : 0}}>
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
                    {r.violations.length>0&&<span style={{background:"rgba(239,68,68,0.1)",color:"#c62828",borderRadius:5,padding:"1px 8px",fontSize:11}}>{r.violations.length} ממצאים</span>}
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
function BusinessesPage({businesses,setBusinesses,reports,users,setUsers,setReports,user,onSaveReport,onAssignTask}){
  const isMobile = useIsMobile();
  const[search,setSearch]=useState("");
  const[typeFilter,setTypeFilter]=useState("all");
  const[riskFilter,setRiskFilter]=useState("all");
  const[modal,setModal]=useState(null);
  const[reportingBiz,setReportingBiz]=useState(null);
  const[assignBiz,setAssignBiz]=useState(null);
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
      <div style={{display:"flex",justifyContent:"space-between",alignItems:isMobile?"stretch":"center",marginBottom:18,gap:12,flexDirection: isMobile?"column":"row"}}>
        <div style={{display:"flex",gap:8,flex:1,flexDirection: isMobile?"column":"row",flexWrap:"wrap"}}>
          <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="🔍 חפש עסק..." style={{...inp,flex:isMobile?"none":"0 1 240px", width:"100%"}} />
          <div style={{display:"flex",gap:5,flexWrap:"wrap"}}>
            <Pill active={typeFilter==="all"} onClick={()=>setTypeFilter("all")}>הכל</Pill>
            {types.map(t=><Pill key={t} active={typeFilter===t} onClick={()=>setTypeFilter(t)}>{t}</Pill>)}
          </div>
          <div style={{display:"flex",gap:5,flexWrap:"wrap"}}>
            {[["all","כל סיכון"],["high","🔴 גבוה"],["medium","🟡 בינוני"],["low","🟢 תקין"]].map(([k,l])=><Pill key={k} active={riskFilter===k} onClick={()=>setRiskFilter(k)}>{l}</Pill>)}
          </div>
        </div>
        <PrimaryBtn onClick={openNew} icon="🏢" style={{width: isMobile?"100%":"auto", justifyContent:"center"}}>עסק חדש</PrimaryBtn>
      </div>

      <div style={{display:"grid",gridTemplateColumns:isMobile?"1fr":"repeat(auto-fill,minmax(300px,1fr))",gap:14}}>
        {filtered.map(biz=>{
          const bizReports=reports.filter(r=>r.businessId===biz.id);
          const last=[...bizReports].sort((a,b)=>b.id-a.id)[0];
          const avg=bizReports.length?Math.round(bizReports.reduce((a,b)=>a+b.score,0)/bizReports.length):null;
          return(
            <div key={biz.id} style={{...cardStyle,opacity:biz.active?1:.6,transition:"transform .15s,border-color .15s",cursor:"default"}}
                 onMouseEnter={e=>{e.currentTarget.style.transform=isMobile?"none":"translateY(-2px)";e.currentTarget.style.borderColor="rgba(59,130,246,0.3)";}}
                 onMouseLeave={e=>{e.currentTarget.style.transform="none";e.currentTarget.style.borderColor=C.cardBorder;}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:10,flexDirection:isMobile?"column":"row",gap:isMobile?10:0}}>
                <div>
                  <div style={{color:C.text,fontWeight:700,fontSize:15,marginBottom:4}}>{biz.name}</div>
                  <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
                    <Tag>{biz.type}</Tag>
                    <RiskBadge risk={biz.risk} />
                    {!biz.active&&<Tag color="#6b7280" bg="rgba(107,114,128,0.1)">מושבת</Tag>}
                  </div>
                </div>
                <div style={{display:"flex",gap:8,width:isMobile?"100%":"auto",justifyContent:isMobile?"flex-end":"flex-start", flexWrap:"wrap"}}>
                  <button onClick={()=>setReportingBiz(biz)} style={{background:"rgba(56,189,248,0.12)",border:"1px solid rgba(56,189,248,0.25)",borderRadius:7,padding:"5px 10px",color:"#1976d2",cursor:"pointer",fontSize:12,fontFamily:"inherit"}}>📋 דווח</button>
                  {user.role==="admin"&&onAssignTask&&<button onClick={()=>setAssignBiz(biz)} style={{background:"rgba(168,85,247,0.12)",border:"1px solid rgba(168,85,247,0.25)",borderRadius:7,padding:"5px 10px",color:C.purple,cursor:"pointer",fontSize:12,fontFamily:"inherit"}}>🎯 משימה</button>}
                  <button onClick={()=>openEdit(biz)} style={{background:"rgba(255,255,255,0.07)",border:"none",borderRadius:7,padding:"5px 10px",color:C.textMuted,cursor:"pointer",fontSize:12,fontFamily:"inherit"}}>עריכה</button>
                  <button onClick={()=>deleteBiz(biz)} style={{background:"rgba(239,68,68,0.08)",border:"none",borderRadius:7,padding:"5px 10px",color:"#c62828",cursor:"pointer",fontSize:12,fontFamily:"inherit"}}>🗑 מחק</button>
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
              <select value={form.type} onChange={e=>setForm({...form,type:e.target.value})} style={{...inp,background:"#f8fafc"}}>
                {BIZ_TYPES.map(t=><option key={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label style={{color:C.textMuted,fontSize:12,display:"block",marginBottom:5}}>רמת סיכון</label>
              <select value={form.risk} onChange={e=>setForm({...form,risk:e.target.value})} style={{...inp,background:"#f8fafc"}}>
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

      {reportingBiz&&(
        <NewReportModal business={reportingBiz} user={user} onSave={(d)=>{onSaveReport(d);setReportingBiz(null);}} onClose={()=>setReportingBiz(null)} />
      )}

      {assignBiz&&onAssignTask&&(
        <AssignTaskModal
          businesses={businesses}
          users={users}
          preselectedBusinessId={assignBiz.id}
          onAssign={(data)=>{onAssignTask(data);setAssignBiz(null);}}
          onClose={()=>setAssignBiz(null)}
        />
      )}
    </div>
  );
}

// ════════════════════════════════════════════════════════════
// USERS PAGE
// ════════════════════════════════════════════════════════════
function UsersPage({users,setUsers,businesses,reports,user,setUser}){
  const isMobile = useIsMobile();
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
      <div style={{display:"flex",justifyContent:"space-between",marginBottom:20,flexDirection:isMobile?"column":"row",alignItems:isMobile?"flex-start":"center",gap:10}}>
        <p style={{color:C.textDim,fontSize:13,margin:0}}>{users.length} משתמשים · {users.filter(u=>u.role==="inspector").length} מפקחים</p>
        <PrimaryBtn onClick={openNew} icon="👤" style={{width:isMobile?"100%":"auto",justifyContent:"center"}}>משתמש חדש</PrimaryBtn>
      </div>
      <div style={{display:"grid",gap:10}}>
        {users.map(u=>{
          const userReports=reports.filter(r=>r.inspectorId===u.id);
          return(
            <div key={u.id} style={{...cardStyle,display:"flex",gap:14,alignItems:isMobile?"flex-start":"center",opacity:u.active?1:.55,flexDirection:isMobile?"column":"row"}}>
              <Avatar name={u.name} size={44} role={u.role} />
              <div style={{flex:1,minWidth:0,width:"100%"}}>
                <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:3,flexWrap:"wrap"}}>
                  <span style={{color:C.text,fontWeight:700}}>{u.name}</span>
                  <Tag color={u.role==="admin"?C.red:C.primary} bg={u.role==="admin"?C.redLight:C.primaryLight}>{u.role==="admin"?"👑 מנהל":"🔍 מפקח"}</Tag>
                  {!u.active&&<Tag color="#6b7280" bg="rgba(107,114,128,0.1)">מושהה</Tag>}
                </div>
                <div style={{display:"flex",gap:12,flexWrap:"wrap"}}>
                  <span style={{color:C.textDim,fontSize:12}}>@{u.username}</span>
                  {u.email&&<span style={{color:C.textDim,fontSize:12}}>✉ {u.email}</span>}
                  {u.role==="inspector"&&<span style={{color:C.textDim,fontSize:12}}>🏢 {u.assignedBusinesses.length} עסקים · 📋 {userReports.length} דיווחים</span>}
                  {u.joinDate&&<span style={{color:C.textDim,fontSize:12}}>📅 הצטרף {u.joinDate}</span>}
                </div>
              </div>
              <div style={{display:"flex",gap:6,flexWrap:"wrap",justifyContent:isMobile?"flex-start":"flex-end",width:isMobile?"100%":"auto"}}>
                {u.role==="inspector"&&<button onClick={()=>setPermModal(u)} style={{background:C.tealLight,border:`1px solid ${C.teal}40`,borderRadius:8,padding:"7px 12px",color:C.teal,cursor:"pointer",fontSize:12,fontFamily:"inherit",fontWeight:600}}>🔐 הרשאות</button>}
                <button onClick={()=>openEdit(u)} style={{background:C.primaryLight,border:`1px solid ${C.primary}40`,borderRadius:8,padding:"7px 12px",color:C.primary,cursor:"pointer",fontSize:12,fontFamily:"inherit",fontWeight:600}}>✏️ עריכה</button>
                {u.role!=="admin"&&<button onClick={()=>toggle(u)} style={{background:u.active?"rgba(245,158,11,0.08)":"rgba(34,197,94,0.08)",border:`1px solid ${u.active?"rgba(245,158,11,0.2)":"rgba(34,197,94,0.2)"}`,borderRadius:8,padding:"7px 12px",color:u.active?C.amber:C.green,cursor:"pointer",fontSize:12,fontFamily:"inherit"}}>{u.active?"השהה":"הפעל"}</button>}
                {u.role!=="admin"&&<button onClick={()=>del(u)} style={{background:C.redLight,border:`1px solid ${C.red}40`,borderRadius:8,padding:"7px 12px",color:C.red,cursor:"pointer",fontSize:12,fontFamily:"inherit",fontWeight:600}}>🗑</button>}
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
              <select value={form.role} onChange={e=>setForm({...form,role:e.target.value})} style={{...inp,background:"#f8fafc"}}>
                <option value="inspector">מפקח</option>
                <option value="admin">מנהל</option>
              </select>
            </div>
            <div style={{display:"flex",alignItems:"center",gap:8}}>
              <input type="checkbox" id="ua" checked={form.active} onChange={e=>setForm({...form,active:e.target.checked})} />
              <label htmlFor="ua" style={{color:C.textMuted,fontSize:13,cursor:"pointer"}}>משתמש פעיל</label>
            </div>
          </div>
          {err&&<div style={{background:"rgba(239,68,68,0.1)",border:"1px solid rgba(239,68,68,0.22)",borderRadius:8,padding:"9px 14px",color:"#c62828",fontSize:13,marginTop:12}}>{err}</div>}
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
            <button onClick={()=>{const u={...permModal,assignedBusinesses:businesses.map(b=>b.id)};setPermModal(u);setUsers(prev=>prev.map(x=>x.id===u.id?u:x));}} style={{background:"rgba(59,130,246,0.1)",border:"1px solid rgba(59,130,246,0.2)",borderRadius:7,padding:"5px 12px",color:"#1565c0",cursor:"pointer",fontSize:12,fontFamily:"inherit"}}>בחר הכל</button>
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
// ASSIGN SURPRISE INSPECTION TASK MODAL
// ════════════════════════════════════════════════════════════
function AssignTaskModal({ businesses, users, preselectedBusinessId, onAssign, onClose }) {
  const isMobile = useIsMobile();
  const inspectors = users.filter(u => u.role === "inspector" && u.active);
  const [businessId, setBusinessId] = useState(preselectedBusinessId || businesses[0]?.id || "");
  const [inspectorId, setInspectorId] = useState(inspectors[0]?.id || "");
  const [notes, setNotes] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");

  const submit = () => {
    if (!businessId || !inspectorId) {
      setErr("יש לבחור עסק ומפקח");
      return;
    }
    setSaving(true);
    setTimeout(() => {
      onAssign({
        businessId: +businessId,
        inspectorId: +inspectorId,
        notes: notes.trim(),
        dueDate: dueDate || null,
      });
      setSaving(false);
      onClose();
    }, 300);
  };

  return (
    <Modal onClose={onClose} width={520}>
      <ModalHead
        title="🎯 שליחת משימת ביקורת הפתעה"
        sub="המפקח יקבל התראה מיידית ומשימה בדף ההתראות"
        onClose={onClose}
      />
      <div style={{ display: "grid", gap: 14 }}>
        <div>
          <label style={{ color: C.textMuted, fontSize: 12, display: "block", marginBottom: 5 }}>עסק לביקורת</label>
          <select value={businessId} onChange={e => setBusinessId(e.target.value)} style={{ ...inp, background: "#f8fafc" }}>
            {businesses.filter(b => b.active).map(b => (
              <option key={b.id} value={b.id}>{b.name} · {b.type}</option>
            ))}
          </select>
        </div>
        <div>
          <label style={{ color: C.textMuted, fontSize: 12, display: "block", marginBottom: 5 }}>מפקח אחראי</label>
          <select value={inspectorId} onChange={e => setInspectorId(e.target.value)} style={{ ...inp, background: "#f8fafc" }}>
            {inspectors.map(u => (
              <option key={u.id} value={u.id}>{u.name} (@{u.username})</option>
            ))}
          </select>
        </div>
        <div>
          <label style={{ color: C.textMuted, fontSize: 12, display: "block", marginBottom: 5 }}>הוראות למפקח (אופציונלי)</label>
          <textarea
            value={notes}
            onChange={e => setNotes(e.target.value)}
            rows={3}
            placeholder="למשל: ביקורת הפתעה בשעות הערב, לבדוק ניקיון מטבח..."
            style={{ ...inp, resize: "vertical", lineHeight: 1.6 }}
          />
        </div>
        <div>
          <label style={{ color: C.textMuted, fontSize: 12, display: "block", marginBottom: 5 }}>מועד יעד (אופציונלי)</label>
          <input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} style={{ ...inp, colorScheme: "dark" }} />
        </div>
      </div>
      {err && (
        <div style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.22)", borderRadius: 8, padding: "9px 14px", color: "#c62828", fontSize: 13, marginTop: 12 }}>
          {err}
        </div>
      )}
      <div style={{ display: "flex", gap: 10, marginTop: 22, flexDirection: isMobile ? "column" : "row" }}>
        <PrimaryBtn onClick={submit} disabled={saving || inspectors.length === 0} style={{ flex: 1, justifyContent: "center", padding: 12 }}>
          {saving ? "שולח..." : "📤 שלח משימה למפקח"}
        </PrimaryBtn>
        <GhostBtn onClick={onClose}>ביטול</GhostBtn>
      </div>
    </Modal>
  );
}

// ════════════════════════════════════════════════════════════
// ALERTS PAGE
// ════════════════════════════════════════════════════════════
function AlertsPage({ notifs, setNotifs, tasks, setTasks, reports, setReports, businesses, users, user }) {
  const [reportingBiz, setReportingBiz] = useState(null);
  const [assignOpen, setAssignOpen] = useState(false);
  const isMobile = useIsMobile();
  const markAll = () => setNotifs(prev => prev.map(n => {
    const isMine = filterNotifsForUser([n], user, businesses).length > 0;
    return isMine ? { ...n, read: true } : n;
  }));
  const dismiss = id => setNotifs(prev => prev.filter(n => n.id !== id));

  const typeIcon = { warning: "⚠️", info: "💡", success: "✅", error: "🔴", task: "🎯" };
  const typeColor = { warning: C.amber, info: C.blue, success: C.green, error: C.red, task: C.purple };

  const pendingInspections = useMemo(() => {
    return getPendingInspections(user, businesses, reports);
  }, [user, businesses, reports]);

  const pendingTasks = useMemo(() => getPendingTasksForUser(tasks, user), [tasks, user]);

  const relevantNotifs = useMemo(() => {
    return filterNotifsForUser(notifs, user, businesses);
  }, [notifs, user, businesses]);

  const assignTask = ({ businessId, inspectorId, notes, dueDate }) => {
    const biz = businesses.find(b => b.id === businessId);
    const insp = users.find(u => u.id === inspectorId);
    const today = new Date().toISOString().split("T")[0];
    const taskId = Date.now();
    const task = {
      id: taskId,
      businessId,
      inspectorId,
      assignedBy: user.id,
      type: "surprise_inspection",
      status: "pending",
      notes,
      dueDate,
      createdAt: today,
      completedAt: null,
      reportId: null,
    };
    setTasks(prev => [...prev, task]);
    setNotifs(prev => [
      ...prev,
      {
        id: taskId + 1,
        type: "task",
        text: `🎯 משימת ביקורת הפתעה: עליך לבצע ביקורת הפתעה ב"${biz?.name || "עסק"}"${notes ? ` — ${notes}` : ""}${dueDate ? ` (עד ${dueDate})` : ""}`,
        date: today,
        read: false,
        userId: inspectorId,
        taskId,
      },
      {
        id: taskId + 2,
        type: "info",
        text: `נשלחה משימת ביקורת הפתעה ל${insp?.name || "מפקח"} עבור "${biz?.name || "עסק"}"`,
        date: today,
        read: false,
        audience: "admin",
      },
    ]);
  };

  const cancelTask = (taskId) => {
    if (!window.confirm("לבטל את המשימה?")) return;
    setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status: "cancelled" } : t));
  };

  const saveReport = (data) => {
    const newReport = { ...data, id: Date.now() };
    setReports(prev => [...prev, newReport]);
    completeTasksForReport(setTasks, data.businessId, user.id, newReport.id);

    const biz = businesses.find(b => b.id === data.businessId);
    const bizName = biz?.name || "עסק";
    const notifText = `התקבל דיווח חדש עבור "${bizName}" על ידי ${user.name} בציון ${data.score}`;
    const notifType = data.score < 70 ? "warning" : data.score >= 85 ? "success" : "info";

    setNotifs(prev => [...prev, {
      id: Date.now() + 1,
      type: notifType,
      text: notifText,
      date: new Date().toISOString().split("T")[0],
      read: false,
      audience: "admin",
    }]);
    setReportingBiz(null);
  };

  return (
    <div className="page-alerts">
      {user.role === "admin" && (
        <div style={{ marginBottom: 32 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16, flexWrap: "wrap", gap: 12 }}>
            <div>
              <h2 style={{ color: C.text, margin: "0 0 4px", fontSize: 18, fontWeight: 700 }}>🎯 משימות ביקורת הפתעה</h2>
              <p style={{ color: C.textDim, fontSize: 13, margin: 0 }}>שלח למפקח משימה לבצע ביקורת הפתעה בעסק — הוא יקבל התראה מיידית</p>
            </div>
            <PrimaryBtn onClick={() => setAssignOpen(true)} icon="➕" style={{ width: isMobile ? "100%" : "auto", justifyContent: "center" }}>
              שלח משימה חדשה
            </PrimaryBtn>
          </div>

          {pendingTasks.length === 0 ? (
            <div style={{ ...cardStyle, background: "rgba(99,102,241,0.04)", borderColor: "rgba(99,102,241,0.15)" }}>
              <EmptyState icon="📭" title="אין משימות פתוחות" sub='לחץ על "שלח משימה חדשה" כדי להקצות ביקורת הפתעה למפקח.' />
            </div>
          ) : (
            <div style={{ display: "grid", gap: 12 }}>
              {pendingTasks.map(task => {
                const biz = businesses.find(b => b.id === task.businessId);
                const insp = users.find(u => u.id === task.inspectorId);
                const admin = users.find(u => u.id === task.assignedBy);
                return (
                  <div key={task.id} style={{ ...cardStyle, borderRight: `5px solid ${C.purple}`, display: "flex", flexDirection: isMobile ? "column" : "row", gap: 14, alignItems: isMobile ? "stretch" : "center" }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6, flexWrap: "wrap" }}>
                        <span style={{ color: C.text, fontWeight: 700, fontSize: 15 }}>{biz?.name || "עסק"}</span>
                        <Tag color={C.purple} bg="rgba(168,85,247,0.12)">ביקורת הפתעה</Tag>
                        {task.dueDate && <Tag color={C.amber} bg="rgba(245,158,11,0.1)">עד {task.dueDate}</Tag>}
                      </div>
                      <div style={{ color: C.textMuted, fontSize: 13, marginBottom: 4 }}>👤 מפקח: {insp?.name || "—"} · נשלח {task.createdAt}{admin ? ` על ידי ${admin.name}` : ""}</div>
                      {task.notes && <div style={{ color: C.textDim, fontSize: 12, lineHeight: 1.5 }}>📝 {task.notes}</div>}
                    </div>
                    <GhostBtn onClick={() => cancelTask(task.id)} danger style={{ width: isMobile ? "100%" : "auto" }}>בטל משימה</GhostBtn>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {user.role === "inspector" && pendingTasks.length > 0 && (
        <div style={{ marginBottom: 32 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <div>
              <h2 style={{ color: C.text, margin: "0 0 4px", fontSize: 18, fontWeight: 700 }}>🎯 משימות שהוקצו לך</h2>
              <p style={{ color: C.textDim, fontSize: 13, margin: 0 }}>ביקורות הפתעה שהמנהל הקצה לך — יש לבצע בהקדם</p>
            </div>
            <span style={{ background: "rgba(168,85,247,0.12)", color: C.purple, borderRadius: 10, padding: "4px 12px", fontSize: 12, fontWeight: 700 }}>
              {pendingTasks.length} משימות
            </span>
          </div>
          <div style={{ display: "grid", gap: 12 }}>
            {pendingTasks.map(task => {
              const biz = businesses.find(b => b.id === task.businessId);
              return (
                <div key={task.id} className="pulse-urgent" style={{
                  ...cardStyle,
                  display: "flex",
                  flexDirection: isMobile ? "column" : "row",
                  gap: 16,
                  alignItems: isMobile ? "stretch" : "center",
                  borderRight: `5px solid ${C.purple}`,
                  background: "rgba(168,85,247,0.06)",
                  borderColor: "rgba(168,85,247,0.25)",
                }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6, flexWrap: "wrap" }}>
                      <span style={{ color: C.text, fontWeight: 700, fontSize: 15 }}>{biz?.name || "עסק"}</span>
                      <Tag color={C.purple} bg="rgba(168,85,247,0.15)">ביקורת הפתעה</Tag>
                      {task.dueDate && <span style={{ color: C.amber, fontSize: 12 }}>⏰ עד {task.dueDate}</span>}
                    </div>
                    <div style={{ color: C.textMuted, fontSize: 13, lineHeight: 1.5 }}>
                      {task.notes || `המנהל הקצה לך לבצע ביקורת הפתעה ב"${biz?.name}".`}
                    </div>
                    <div style={{ color: C.textDim, fontSize: 11, marginTop: 4 }}>📅 התקבלה: {task.createdAt}</div>
                  </div>
                  <button
                    onClick={() => setReportingBiz(biz)}
                    style={{
                      padding: "10px 18px",
                      background: "linear-gradient(135deg, #a855f7, #6366f1)",
                      border: "none",
                      borderRadius: 10,
                      color: "#fff",
                      fontSize: 13,
                      fontWeight: 600,
                      cursor: "pointer",
                      whiteSpace: "nowrap",
                      boxShadow: "0 4px 14px rgba(168,85,247,0.25)",
                    }}
                  >
                    🎯 בצע ביקורת הפתעה
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

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
                        background: "linear-gradient(135deg, #1976d2, #6366f1)",
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
                background: n.read ? "#f8fafc" : "#fff",
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
                      style={{ background: "rgba(56,189,248,0.12)", border: "1px solid rgba(56,189,248,0.25)", borderRadius: 8, padding: "6px 12px", color: "#1976d2", cursor: "pointer", fontSize: 12, fontWeight: 600, fontFamily: "inherit" }}>
                      קרא
                    </button>
                  )}
                  <button onClick={() => dismiss(n.id)}
                    style={{ background: "rgba(244, 63, 94, 0.08)", border: "1px solid rgba(244, 63, 94, 0.25)", borderRadius: 8, padding: "6px 10px", color: "#c62828", cursor: "pointer", fontSize: 12, fontFamily: "inherit" }}>
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
      {assignOpen && (
        <AssignTaskModal
          businesses={businesses}
          users={users}
          onAssign={assignTask}
          onClose={() => setAssignOpen(false)}
        />
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
                  style={{width:"100%",padding:10,background:"rgba(56,189,248,0.12)",border:"1px solid rgba(56,189,248,0.25)",borderRadius:10,color:"#1976d2",cursor:"pointer",fontSize:14,fontWeight:600,fontFamily:"inherit",transition:"all 0.2s"}}>
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
  const{users,setUsers,businesses,setBusinesses,reports,setReports,notifs,setNotifs,tasks,setTasks,resetDatabase}=useDB();
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

  const pendingAssignedTasks = useMemo(() => {
    if (!user) return 0;
    return getPendingTasksForUser(tasks, user).length;
  }, [user, tasks]);

  const unreadNotifs = user ? filterNotifsForUser(notifs, user, businesses).filter(n => !n.read).length : 0;
  const inspectorBadgeCount = unreadNotifs + pendingInspections.length;
  const adminBadgeCount = unreadNotifs + pendingAssignedTasks;

  const handleAssignTask = ({ businessId, inspectorId, notes, dueDate }) => {
    const biz = businesses.find(b => b.id === businessId);
    const insp = users.find(u => u.id === inspectorId);
    const today = new Date().toISOString().split("T")[0];
    const taskId = Date.now();
    const task = {
      id: taskId,
      businessId,
      inspectorId,
      assignedBy: user.id,
      type: "surprise_inspection",
      status: "pending",
      notes,
      dueDate,
      createdAt: today,
      completedAt: null,
      reportId: null,
    };
    setTasks(prev => [...prev, task]);
    setNotifs(prev => [
      ...prev,
      {
        id: taskId + 1,
        type: "task",
        text: `🎯 משימת ביקורת הפתעה: עליך לבצע ביקורת הפתעה ב"${biz?.name || "עסק"}"${notes ? ` — ${notes}` : ""}${dueDate ? ` (עד ${dueDate})` : ""}`,
        date: today,
        read: false,
        userId: inspectorId,
        taskId,
      },
      {
        id: taskId + 2,
        type: "info",
        text: `נשלחה משימת ביקורת הפתעה ל${insp?.name || "מפקח"} עבור "${biz?.name || "עסק"}"`,
        date: today,
        read: false,
        audience: "admin",
      },
    ]);
  };

  const handleAddReport = (reportData) => {
    const newReport = { ...reportData, id: Date.now() };
    setReports(prev => [...prev, newReport]);
    completeTasksForReport(setTasks, reportData.businessId, reportData.inspectorId, newReport.id);

    const biz = businesses.find(b => b.id === reportData.businessId);
    const insp = users.find(u => u.id === reportData.inspectorId);
    const bizName = biz?.name || "עסק";
    const inspName = insp?.name || "מפקח";

    const notifText = `התקבל דיווח חדש עבור "${bizName}" על ידי ${inspName} בציון ${reportData.score}`;
    const notifType = reportData.score < 70 ? "warning" : reportData.score >= 85 ? "success" : "info";

    setNotifs(prev => [...prev, {
      id: Date.now() + 1,
      type: notifType,
      text: notifText,
      date: new Date().toISOString().split("T")[0],
      read: false,
      audience: "admin",
    }]);
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
    <div className="app-shell" style={{display:"flex",minHeight:"100vh",background:`linear-gradient(160deg, ${C.bg} 0%, #dbeafe 45%, ${C.bgAlt} 100%)`,fontFamily:FONT,direction:"rtl",color:C.text,paddingTop: isMobile ? 64 : 0}}>
      <style>{`
        .app-shell input:focus, .app-shell textarea:focus, .app-shell select:focus {
          border-color: ${C.primary} !important;
          box-shadow: 0 0 0 3px ${C.primaryLight} !important;
        }
        .primary-btn:not(:disabled):hover { transform: translateY(-1px); box-shadow: 0 6px 18px rgba(21,101,192,0.35) !important; }
        .pill-btn:hover { border-color: ${C.primary} !important; color: ${C.primary} !important; }

        ::-webkit-scrollbar { width: 8px; height: 8px; }
        ::-webkit-scrollbar-track { background: ${C.bgAlt}; }
        ::-webkit-scrollbar-thumb { background: #94a3b8; border-radius: 4px; }
        ::-webkit-scrollbar-thumb:hover { background: #64748b; }

        .glass-card {
          background: #fff !important;
          border: 1px solid ${C.cardBorder} !important;
          box-shadow: ${C.cardShadow} !important;
          transition: transform 0.2s, box-shadow 0.2s, border-color 0.2s !important;
        }
        .glass-card:hover {
          transform: translateY(-3px) !important;
          border-color: ${C.primary}50 !important;
          box-shadow: 0 8px 28px rgba(21,101,192,0.12) !important;
        }

        .sidebar-drawer { animation: slideInRight 0.3s forwards; }

        @keyframes slideInRight {
          from { transform: translateX(100%); }
          to { transform: translateX(0); }
        }

        @keyframes pulse-glow {
          0%, 100% { box-shadow: 0 0 0 0 rgba(198,40,40,0.25); }
          50% { box-shadow: 0 0 0 8px rgba(198,40,40,0.08); }
        }
        .pulse-urgent { animation: pulse-glow 2s infinite; border-radius: 14px; }

        .mobile-nav-btn { transition: color 0.15s; }
        .mobile-nav-btn.active { color: ${C.primary} !important; font-weight: 700 !important; }
        .mobile-nav-btn.active .nav-dot { background: ${C.primary}; }

        @media (max-width: 768px) {
          input, textarea, select { width: 100% !important; box-sizing: border-box; font-size: 16px !important; }
          button { min-width: 0 !important; box-sizing: border-box; font-family: inherit; }
          button.fullwidth { width: 100% !important; }
          .glass-card { padding: 16px !important; border-radius: 12px !important; }
          .sidebar-drawer { width: 100% !important; right: 0 !important; left: 0 !important; }
          .sidebar-drawer nav button { text-align: right !important; }
          h1 { font-size: 20px !important; }
          .modal-inner { width: 100% !important; padding: 20px !important; border-radius: 16px 16px 0 0 !important; max-height: 94vh !important; }
          .page-header-bar { padding: 14px 16px 12px !important; margin-bottom: 16px !important; }
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
          height: 64,
          background: `linear-gradient(90deg, ${C.sidebar} 0%, ${C.sidebarDark} 100%)`,
          borderBottom: `3px solid ${C.gold}`,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0 16px",
          zIndex: 100,
          direction: "rtl",
          boxShadow: "0 2px 16px rgba(30,58,95,0.2)",
        }}>
          <button onClick={() => setMenuOpen(true)} style={{ background: "rgba(255,255,255,0.1)", border: "none", borderRadius: 10, color: C.sidebarText, fontSize: 22, cursor: "pointer", display: "flex", alignItems: "center", width: 40, height: 40, justifyContent: "center" }}>☰</button>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{ width: 32, height: 32, borderRadius: 10, background: "linear-gradient(135deg,#ffc107,#ef6c00)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16 }}>🏛️</div>
            <span style={{ color: C.sidebarText, fontWeight: 800, fontSize: 16, letterSpacing: -0.2 }}>ביקורת עסקים</span>
          </div>
          <Avatar name={user.name} size={32} role={user.role} />
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
            width: 280,
            background: `linear-gradient(180deg, ${C.sidebar} 0%, ${C.sidebarDark} 100%)`,
            borderLeft: "1px solid rgba(255,255,255,0.1)",
            boxShadow: "-4px 0 32px rgba(30,58,95,0.3)",
            display: "flex",
            flexDirection: "column",
            zIndex: 160
          }}>
            <div style={{ padding: "20px 16px", borderBottom: "1px solid rgba(255,255,255,0.1)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <Avatar name={user.name} size={36} role={user.role} />
                <div style={{ lineHeight: 1.2 }}>
                  <div style={{ color: C.sidebarText, fontWeight: 700, fontSize: 14 }}>{user.name}</div>
                  <div style={{ color: C.sidebarMuted, fontSize: 11 }}>{user.role === "admin" ? "מנהל מערכת" : "מפקח"}</div>
                </div>
              </div>
              <button onClick={() => setMenuOpen(false)} style={{ background: "rgba(255,255,255,0.1)", border: "none", borderRadius: 8, color: C.sidebarText, fontSize: 18, cursor: "pointer", width: 36, height: 36 }}>✕</button>
            </div>
            <nav style={{ flex: 1, padding: "16px 12px", display: "flex", flexDirection: "column", gap: 6 }}>
              {nav.map(n => (
                <button key={n.key} onClick={() => { setPage(n.key); setMenuOpen(false); }}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    padding: "14px 16px",
                    borderRadius: 10,
                    border: "none",
                    background: page === n.key ? "rgba(255,255,255,0.14)" : "transparent",
                    color: page === n.key ? C.sidebarText : C.sidebarMuted,
                    cursor: "pointer",
                    fontSize: 15,
                    fontWeight: page === n.key ? 700 : 500,
                    textAlign: "right",
                    fontFamily: "inherit",
                    position: "relative"
                  }}>
                  <span style={{ fontSize: 20 }}>{n.icon}</span>
                  <span style={{ flex: 1 }}>{n.label}</span>
                  {n.badge > 0 && <span style={{ background: C.red, color: "#fff", borderRadius: 10, minWidth: 20, height: 20, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 800, padding: "0 6px" }}>{n.badge}</span>}
                  {page === n.key && <div style={{ position: "absolute", left: 0, top: "18%", bottom: "18%", width: 4, background: C.gold, borderRadius: 2 }} />}
                </button>
              ))}
            </nav>
            <div style={{ padding: "16px 12px", borderTop: "1px solid rgba(255,255,255,0.1)" }}>
              <button onClick={() => { setUser(null); setMenuOpen(false); }} style={{ width: "100%", display: "flex", alignItems: "center", gap: 10, padding: "12px 14px", borderRadius: 10, border: "1px solid rgba(255,255,255,0.15)", background: "rgba(255,255,255,0.06)", color: "#ffcdd2", cursor: "pointer", fontSize: 14, fontFamily: "inherit", fontWeight: 600 }}>
                <span>🚪</span><span>התנתק</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Container */}
      <div style={{flex:1,display:"flex",flexDirection:"column",minWidth:0,overflowX:"hidden"}}>
        {/* Top Header Bar */}
        <div className="page-header-bar" style={{
          ...pageHeaderStyle,
          padding: isMobile ? "16px 16px 12px" : "20px 28px 16px",
          marginBottom: isMobile ? 18 : 24,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: 12
        }}>
          <div>
            <h1 style={{color:C.sidebar,margin:"0 0 4px",fontSize: isMobile ? 20 : 24,fontWeight:800,letterSpacing: -0.3}}>{pageTitle[page]||page}</h1>
            <p style={{color:C.textMuted,margin:0,fontSize:13,fontWeight:500}}>
              {user.role==="admin"?`${reports.length} דיווחים · ${businesses.length} עסקים · ${users.filter(u=>u.role==="inspector").length} מפקחים`:`${user.assignedBusinesses?.length||0} עסקים מוקצים · ${reports.filter(r=>r.inspectorId===user.id).length} דיווחים`}
            </p>
          </div>
          <div style={{display:"flex",alignItems:"center",gap:10}}>
            {unreadNotifs > 0 && <div style={{background:C.redLight,border:`2px solid ${C.red}40`,borderRadius:10,padding:"8px 14px",color:C.red,fontSize:12,fontWeight: 700,cursor:"pointer"}} onClick={()=>setPage("alerts")}>🔔 {unreadNotifs} התראות חדשות</div>}
            <button onClick={()=>{if(window.confirm("לאפס את מסד הנתונים?")){resetDatabase();}}} style={{background:"#fff",border:`1px solid ${C.cardBorder}`,borderRadius:8,color:C.textMuted,cursor:"pointer",fontSize:12,fontFamily:"inherit",padding:"6px 12px",fontWeight:600}}>⚙ איפוס</button>
          </div>
        </div>

        {/* Content Body */}
        <div style={{padding: isMobile ? "0 16px 100px" : "0 28px 32px",flex:1}}>
          {page==="dashboard"&&<Dashboard user={user} reports={reports} businesses={businesses} users={users} setPage={setPage} tasks={tasks} />}
          {page==="reports"&&user.role==="admin"&&<ReportsPage reports={reports} businesses={businesses} users={users} />}
          {page==="businesses"&&user.role==="admin"&&<BusinessesPage businesses={businesses} setBusinesses={setBusinesses} reports={reports} users={users} setUsers={setUsers} setReports={setReports} user={user} onSaveReport={handleAddReport} onAssignTask={handleAssignTask} />}
          {page==="users"&&user.role==="admin"&&<UsersPage users={users} setUsers={setUsers} businesses={businesses} reports={reports} user={user} setUser={setUser} />}
          {page==="alerts"&&<AlertsPage notifs={notifs} setNotifs={setNotifs} tasks={tasks} setTasks={setTasks} reports={reports} setReports={setReports} businesses={businesses} users={users} user={user} />}
          {page==="myBusinesses"&&user.role==="inspector"&&<MyBusinesses user={user} businesses={businesses} reports={reports} onSaveReport={handleAddReport} />}
          {page==="myReports"&&user.role==="inspector"&&<ReportsPage reports={reports} businesses={businesses} users={users} filterInspectorId={user.id} />}
        </div>
        {/* Footer */}
        <div style={{padding:12,textAlign:"center",borderTop:`1px solid ${C.cardBorder}`,color:C.textMuted,fontSize:12,background:"rgba(255,255,255,0.6)"}}>
          © {new Date().getFullYear()} Avihai Yosipovich — כל הזכויות שמורות
        </div>
        {isMobile && (
          <div style={{position:"fixed",left:0,right:0,bottom:0,height:68,background:"#fff",display:"flex",justifyContent:"space-around",alignItems:"center",borderTop:`1px solid ${C.cardBorder}`,zIndex:220,boxShadow:"0 -4px 20px rgba(30,58,95,0.08)",paddingBottom:"env(safe-area-inset-bottom)"}}>
            {nav.map(n=> (
              <button key={n.key} onClick={()=>setPage(n.key)} className={`mobile-nav-btn${page===n.key?" active":""}`} style={{background:"transparent",border:"none",color:page===n.key?C.primary:C.textDim,display:"flex",flexDirection:"column",alignItems:"center",gap:2,fontSize:11,cursor:"pointer",padding:"6px 8px",minWidth:56}}>
                <div style={{fontSize:22,position:"relative"}}>
                  {n.icon}
                  {n.badge>0&&<span style={{position:"absolute",top:-4,left:-8,background:C.red,color:"#fff",borderRadius:8,minWidth:16,height:16,display:"flex",alignItems:"center",justifyContent:"center",fontSize:9,fontWeight:800}}>{n.badge}</span>}
                </div>
                <div style={{fontSize:10,fontWeight:page===n.key?700:500}}>{n.label}</div>
                <div className="nav-dot" style={{width:4,height:4,borderRadius:2,background:page===n.key?C.primary:"transparent",marginTop:2}} />
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
