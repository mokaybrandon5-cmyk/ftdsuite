import React, { useState, useRef, useCallback, useEffect, useMemo, createContext, useContext } from "react";
import { supabase, SCHOOL_ID } from "./supabaseClient";

// ╔══════════════════════════════════════════════════════════════════════════════╗
// ║          TDSuite v4.0 — Felipe's Truck Driving School                      ║
// ║          Sistema de Gestión Empresarial                                     ║
// ║          Director: Jahaziel Mokay                                           ║
// ╚══════════════════════════════════════════════════════════════════════════════╝

const SCHOOL_LOGO = "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNjAgNTYiPjxyZWN0IHdpZHRoPSI1NiIgaGVpZ2h0PSI1NiIgcng9IjEyIiBmaWxsPSIjMGYyNTQ0Ii8+PHBhdGggZD0iTTE1IDQ5IEwzMSA3IiBzdHJva2U9IiNmZmZmZmYiIHN0cm9rZS13aWR0aD0iOSIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBmaWxsPSJub25lIi8+PHBhdGggZD0iTTI4IDQ5IEw0NCA3IiBzdHJva2U9IiNmZmZmZmYiIHN0cm9rZS13aWR0aD0iNCIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBmaWxsPSJub25lIiBvcGFjaXR5PSIwLjMyIi8+PHRleHQgeD0iNjgiIHk9IjM4IiBmb250LWZhbWlseT0iLWFwcGxlLXN5c3RlbSxCbGlua01hY1N5c3RlbUZvbnQsJ1NGIFBybyBEaXNwbGF5JywnU2Vnb2UgVUknLHN5c3RlbS11aSxzYW5zLXNlcmlmIiBmb250LXNpemU9IjM2IiBmb250LXdlaWdodD0iOTAwIiBmaWxsPSIjMGEwYTBhIiBsZXR0ZXItc3BhY2luZz0iLTIiPlREU3VpdGU8L3RleHQ+PC9zdmc+";
const SCHOOL_LOGO_NEG = "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNjAgNTYiPjxyZWN0IHdpZHRoPSI1NiIgaGVpZ2h0PSI1NiIgcng9IjEyIiBmaWxsPSIjZmZmZmZmIi8+PHBhdGggZD0iTTE1IDQ5IEwzMSA3IiBzdHJva2U9IiMwZjI1NDQiIHN0cm9rZS13aWR0aD0iOSIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBmaWxsPSJub25lIi8+PHBhdGggZD0iTTI4IDQ5IEw0NCA3IiBzdHJva2U9IiMwZjI1NDQiIHN0cm9rZS13aWR0aD0iNCIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBmaWxsPSJub25lIiBvcGFjaXR5PSIwLjQiLz48dGV4dCB4PSI2OCIgeT0iMzgiIGZvbnQtZmFtaWx5PSItYXBwbGUtc3lzdGVtLEJsaW5rTWFjU3lzdGVtRm9udCwnU0YgUHJvIERpc3BsYXknLCdTZWdvZSBVSScsc3lzdGVtLXVpLHNhbnMtc2VyaWYiIGZvbnQtc2l6ZT0iMzYiIGZvbnQtd2VpZ2h0PSI5MDAiIGZpbGw9IiNmZmZmZmYiIGxldHRlci1zcGFjaW5nPSItMiI+VERTdWl0ZTwvdGV4dD48L3N2Zz4=";

// ─── CONTEXT GLOBAL (tema + idioma) ─────────────────────────────────────────
const AppContext = createContext({dark:true, lang:'es', t:k=>k, setDark:()=>{}, setLang:()=>{}});
const useApp = () => useContext(AppContext);


// ─── PERSISTENCIA LOCAL (localStorage) ───────────────────────────────────────
const LS = {
  get: (key, def) => { try { const v = localStorage.getItem(key); return v ? JSON.parse(v) : def; } catch { return def; } },
  set: (key, val) => { try { localStorage.setItem(key, JSON.stringify(val)); } catch {} },
  del: (key) => { try { localStorage.removeItem(key); } catch {} },
};

// ─── ROLES & PERMISOS ─────────────────────────────────────────────────────────
const ROLE_PERMS = {
  admin:      { label:"Director",      color:"#7c3aed", canPay:true,  canProg:true,  canUsers:true,  canReports:true,  canDMV:true,  canDocs:true, canMessages:true,  canDelete:true  },
  manager:    { label:"Administrador", color:"#2563eb", canPay:true,  canProg:true,  canUsers:false, canReports:true,  canDMV:true,  canDocs:true, canMessages:true,  canDelete:false },
  instructor: { label:"Instructor",    color:"#0e7490", canPay:false, canProg:true,  canUsers:false, canReports:true,  canDMV:true,  canDocs:true, canMessages:true,  canDelete:false },
  employee:   { label:"Empleado",      color:"#16a34a", canPay:true,  canProg:false, canUsers:false, canReports:false, canDMV:false, canDocs:true, canMessages:true,  canDelete:false },
  readonly:   { label:"Solo Lectura",  color:"#64748b", canPay:false, canProg:false, canUsers:false, canReports:false, canDMV:false, canDocs:false,canMessages:false, canDelete:false },
};

const INITIAL_USERS = [
  {id:1, username:"admin", password:"ftds2024", name:"Jahaziel Mokay", role:"admin", avatar:"JM", title:"Director", active:true, createdAt:"2025-01-01", lastLogin:null, pin:"1234"},
];

// ─── INTERNACIONALIZACIÓN (ES / EN) ──────────────────────────────────────────
const T = {
  es: {
    // Nav
    dashboard:"Dashboard", students:"Estudiantes", kanban:"Vista Kanban",
    payments:"Pagos", messages:"Mensajes", dmv:"Gestión DMV",
    calendar:"Calendario", reports:"Reportes", ai:"Asistente IA",
    users:"Usuarios", notifications:"Notificaciones", search:"Búsqueda Global",
    logout:"Cerrar Sesión",
    // Acciones
    newStudent:"Nuevo Estudiante", save:"Guardar", cancel:"Cancelar",
    edit:"Editar", delete:"Eliminar", archive:"Archivar", back:"Estudiantes",
    export:"Exportar CSV", register:"Registrar Pago", generate:"Generar PDF",
    contract:"Contrato PDF", send:"Enviar", copy:"Copiar",
    // Estados
    active:"Activos", graduated:"Graduados", balance:"Balance Due",
    pending:"Pendiente", delivered:"Entregado", missing:"Faltantes",
    // Campos
    name:"Nombre Completo", phone:"Teléfono", email:"Email",
    dob:"Fecha de Nacimiento", address:"Dirección", license:"Licencia #",
    course:"Clase CDL", transmission:"Transmisión", schedule:"Modalidad",
    startDate:"Fecha de Inicio", totalPrice:"Precio Total",
    downPayment:"Pago Inicial", balanceDue:"Balance Due",
    completion:"Fecha de Completación",
    // Tabs
    overview:"Resumen", progress:"Progreso", documents:"Documentos",
    attendance:"Asistencia", notes:"Notas", report:"Reporte",
    // Dashboard
    activeStudents:"Estudiantes Activos", pendingBalance:"Balance Pendiente",
    dmvThisWeek:"DMV Esta Semana", monthRevenue:"Ingresos del Mes",
    recentStudents:"Estudiantes Recientes", urgentAlerts:"Alertas Urgentes",
    dmvCandidates:"Candidatos DMV",
    // DMV
    dmvReady:"Candidato para examen DMV", dmvScheduled:"Cita Programada",
    passed:"Aprobado", failed:"Reprobado", retest:"Re-Test",
    scheduleAppt:"Programar Cita", passBtn:"Aprobado", failBtn:"Reprobado",
    // Mensajes
    paymentReminder:"Recordatorio de Pago", dmvReminder:"Recordatorio DMV",
    missingDocs:"Docs Faltantes", payConfirmed:"Pago Confirmado",
    congrats:"¡Felicitaciones!", preDmv:"Checklist Pre-DMV",
    custom:"Personalizado",
    // Login
    welcome:"Bienvenido de vuelta", loginSubtitle:"Ingresa tus credenciales",
    username:'Usuario', password:'Contraseña', signIn:'Iniciar Sesión',
    checking:'Verificando...', wrongCreds:"Credenciales incorrectas",
    // Settings
    language:"Idioma", theme:"Tema", dark:"Oscuro", light:"Claro",
    // Misc
    noData:"Sin datos", noResults:"Sin resultados", loading:"Cargando...",
    confirmArchive:"¿Archivar este estudiante?",
    archiveWarning:"Sus datos se eliminarán del sistema activo.",
    sessionExpired:"Sesión cerrada por inactividad.",
    paymentRegistered:"Pago registrado", notifCreated:"Estudiante registrado",
    searchPlaceholder:"Buscar estudiante, teléfono, licencia...",
    allStatuses:"Todos los estados", allClasses:"Todas las clases",
    allTransmissions:"Transmisión",
  },
  en: {
    // Nav
    dashboard:"Dashboard", students:"Students", kanban:"Kanban View",
    payments:"Payments", messages:"Messages", dmv:"DMV Management",
    calendar:"Calendar", reports:"Reports", ai:"AI Assistant",
    users:"Users", notifications:"Notifications", search:"Global Search",
    logout:"Sign Out",
    // Actions
    newStudent:"New Student", save:"Save", cancel:"Cancel",
    edit:"Edit", delete:"Delete", archive:"Archive", back:"Students",
    export:"Export CSV", register:"Register Payment", generate:"Generate PDF",
    contract:"Contract PDF", send:"Send", copy:"Copy",
    // Status
    active:"Active", graduated:"Graduated", balance:"Balance Due",
    pending:"Pending", delivered:"Submitted", missing:"Missing",
    // Fields
    name:"Full Name", phone:"Phone", email:"Email",
    dob:"Date of Birth", address:"Address", license:"License #",
    course:"CDL Class", transmission:"Transmission", schedule:"Schedule",
    startDate:"Start Date", totalPrice:"Total Price",
    downPayment:"Down Payment", balanceDue:"Balance Due",
    completion:"Completion Date",
    // Tabs
    overview:"Overview", progress:"Progress", documents:"Documents",
    attendance:"Attendance", notes:"Notes", report:"Report",
    // Dashboard
    activeStudents:"Active Students", pendingBalance:"Pending Balance",
    dmvThisWeek:"DMV This Week", monthRevenue:"Monthly Revenue",
    recentStudents:"Recent Students", urgentAlerts:"Urgent Alerts",
    dmvCandidates:"DMV Candidates",
    // DMV
    dmvReady:"DMV exam candidate", dmvScheduled:"Appointment Scheduled",
    passed:"Passed", failed:"Failed", retest:"Re-Test",
    scheduleAppt:"Schedule Appointment", passBtn:"Passed", failBtn:"Failed",
    // Messages
    paymentReminder:"Payment Reminder", dmvReminder:"DMV Reminder",
    missingDocs:"Missing Docs", payConfirmed:"Payment Confirmed",
    congrats:"Congratulations!", preDmv:"Pre-DMV Checklist",
    custom:"Custom",
    // Login
    welcome:"Welcome back", loginSubtitle:"Enter your credentials to continue",
    username:"Username", password:"Password", signIn:"Sign In",
    checking:"Verifying...", wrongCreds:"Invalid credentials or inactive account",
    // Settings
    language:"Language", theme:"Theme", dark:"Dark", light:"Light",
    // Misc
    noData:"No data", noResults:"No results", loading:"Loading...",
    confirmArchive:"Archive this student?",
    archiveWarning:"Their data will be removed from the active system.",
    sessionExpired:"Session closed due to inactivity.",
    paymentRegistered:"Payment registered", notifCreated:"Student registered",
    searchPlaceholder:"Search student, phone, license...",
    allStatuses:"All statuses", allClasses:"All classes",
    allTransmissions:"Transmission",
  }
};

// Hook para traducción
const useT = (lang) => (key, fallback="") => T[lang]?.[key] ?? T.es[key] ?? fallback;



const STATUS_META = {
  "Contract Signed":    { color:"#1a3a6b", bg:"#dbeafe",  label:"Contrato Firmado",  icon:"", order:0 },
  "Pending Documents":  { color:"#b45309", bg:"#fef3c7",  label:"Docs Pendientes",   icon:"", order:1 },
  "Active Training":    { color:"#16a34a", bg:"#dcfce7",  label:"En Entrenamiento",  icon:"", order:2 },
  "Pending Payment":    { color:"#dc2626", bg:"#fee2e2",  label:"Pago Pendiente",    icon:"", order:3 },
  "DMV Candidate":      { color:"#7c3aed", bg:"#ede9fe",  label:"Candidato DMV",     icon:"", order:4 },
  "DMV Scheduled":      { color:"#0e7490", bg:"#cffafe",  label:"DMV Programado",    icon:"", order:5 },
  "Passed / Graduated": { color:"#166534", bg:"#dcfce7",  label:"Graduado",          icon:"", order:6 },
  "Requires Re-Test":   { color:"#ea580c", bg:"#ffedd5",  label:"Re-Test",           icon:"", order:7 },
  "Inactive":           { color:"#475569", bg:"#f1f5f9",  label:"Inactivo",          icon:"", order:8 },
};

const DOC_LABELS = {
  contract:"Contrato", license:"Licencia CDL", clp:"CLP",
  medicalCard:"Medical Card", drugTest:"Drug Test", eldt:"ELDT/LTC"
};

const PRETRIP_CATS = [
  {id:"safeStart",     label:"Safe Start",       weight:15},
  {id:"brakesAir",     label:"Brakes / Air",     weight:15},
  {id:"inCab",         label:"In-Cab",            weight:5 },
  {id:"externalLights",label:"External Lights",  weight:5 },
  {id:"frontVehicle",  label:"Front of Vehicle", weight:10},
  {id:"steeringAxle",  label:"Steering Axle",    weight:20},
  {id:"sideVehicle",   label:"Side of Vehicle",  weight:10},
  {id:"combination",   label:"Combination",      weight:15},
  {id:"trailer",       label:"Trailer",          weight:5 },
];

const MANEUVER_CATS = [
  {id:"maneuver1",label:"Straight Line Backing",   weight:20},
  {id:"maneuver2",label:"Offset Backing",          weight:30},
  {id:"maneuver3",label:"Parallel Park (Conv.)",   weight:25},
  {id:"maneuver4",label:"Alley Dock / 90° Backing",weight:25},
];

const WA_TMPL = {
  payment_reminder: (s,bal) =>
    `Estimado/a ${s.fullName},\n\nLe recordamos que tiene un saldo pendiente de *${fmtCur(bal)}* con Felipe's Truck Driving School.\n\nPuede realizar su pago por:\n• *Square:* [enlace de pago]\n• *Zelle:* [número]\n• *Efectivo* en nuestra oficina\n\nGracias por su preferencia.\n_Felipe's Truck Driving School_`,
  dmv_reminder: (s) =>
    `Estimado/a ${s.fullName},\n\nLe confirmamos su cita para el examen DMV:\n\n📅 *Fecha:* ${fmtDate(s.dmv.actualDate)}\n🕗 *Hora:* ${s.dmv.time||"8:00 AM"}\n📍 *Oficina:* ${s.dmv.location||"DMV Hialeah"}\n🚛 *Camión:* ${s.dmv.truckAssigned}\n\n✅ Llegue 30 minutos antes.\n✅ Traiga todos sus documentos.\n\n¡Mucho éxito!\n_Felipe's Truck Driving School_`,
  doc_missing: (s, docs) =>
    `Estimado/a ${s.fullName},\n\nNecesitamos que nos entregue los siguientes documentos para completar su expediente:\n\n${docs.map(d=>`📌 *${d}*`).join("\n")}\n\nPor favor preséntalos a la brevedad posible en nuestra oficina.\n\nGracias,\n_Felipe's Truck Driving School_`,
  payment_confirmed: (s, amount) =>
    `Estimado/a ${s.fullName},\n\n✅ Hemos recibido su pago de *${fmtCur(amount)}* exitosamente.\n\nGracias por su puntualidad.\n_Felipe's Truck Driving School_`,
  congratulations: (s) =>
    `🎉 ¡FELICITACIONES ${s.fullName.toUpperCase()}!\n\nNos complace informarle que ha *APROBADO* su examen CDL del DMV.\n\n¡Ha logrado su meta! Mucho éxito en su nueva carrera como conductor profesional.\n\n🚛 _Felipe's Truck Driving School_\n_¡Gracias por confiar en nosotros!_`,
  pre_dmv_checklist: (s) =>
    `Estimado/a ${s.fullName},\n\n*CHECKLIST PRE-EXAMEN DMV* 📋\n\nPor favor confirme que tiene todo listo:\n\n✅ Licencia vigente\n✅ CLP en mano\n✅ Medical Card\n✅ Uniforme/ropa apropiada\n✅ Llegar 30 min antes\n\n📅 Su cita: *${fmtDate(s.dmv.actualDate)} a las ${s.dmv.time||"8:00 AM"}*\n\n¡Usted puede! 💪\n_Felipe's Truck Driving School_`,
};


// ─── HELPERS ──────────────────────────────────────────────────────────────────
const totalPaid   = s => (s.payments||[]).reduce((a,p)=>a+(p.amount||0),0);
const balance     = s => (s.totalPrice||0) - totalPaid(s);
const calcPT      = cats => Math.round(PRETRIP_CATS.reduce((sum,c)=>sum+((cats[c.id]||0)*c.weight/100),0));
const calcMan     = cats => Math.round(MANEUVER_CATS.reduce((sum,c)=>sum+((cats[c.id]||0)*c.weight/100),0));
const isDMVReady  = s => (s.progress.preTrip>=75) && (s.progress.maneuvers>=75) && (s.progress.roadDriving>=75);
const missingDocs = s => Object.entries(s.documents||{}).filter(([,v])=>!v).map(([k])=>DOC_LABELS[k]||k);
const today       = new Date().toISOString().split("T")[0];
const fmtDate     = d => d ? new Date(d+"T12:00:00").toLocaleDateString("es-US",{month:"short",day:"numeric",year:"numeric"}) : "—";
const fmtDateLong = d => d ? new Date(d+"T12:00:00").toLocaleDateString("es-US",{weekday:"long",month:"long",day:"numeric",year:"numeric"}) : "—";
const fmtCur      = n => new Intl.NumberFormat("en-US",{style:"currency",currency:"USD",maximumFractionDigits:0}).format(n||0);
const avgProg     = s => Math.round(((s.progress.preTrip||0)+(s.progress.maneuvers||0)+(s.progress.roadDriving||0))/3);
const getInit     = name => (name||"?").split(" ").map(w=>w[0]).join("").slice(0,2).toUpperCase();
const fileToB64   = f => new Promise((res,rej)=>{const r=new FileReader();r.onload=()=>res(r.result.split(",")[1]);r.onerror=rej;r.readAsDataURL(f);});
const initPT      = () => { const o={}; PRETRIP_CATS.forEach(c=>{o[c.id]=0;}); return o; };
const initMan     = () => { const o={}; MANEUVER_CATS.forEach(c=>{o[c.id]=0;}); return o; };
const openWA      = (phone,msg) => { const c=(phone||"").replace(/\D/g,""); window.open(`https://wa.me/1${c}?text=${encodeURIComponent(msg)}`,"_blank"); };
const timeAgo     = iso => { if(!iso) return ""; const s=Math.floor((Date.now()-new Date(iso))/1000); if(s<60) return "justo ahora"; if(s<3600) return `hace ${Math.floor(s/60)} min`; if(s<86400) return `hace ${Math.floor(s/3600)}h`; return `hace ${Math.floor(s/86400)}d`; };

const addBizDays = (ds, days) => {
  const d = new Date(ds+"T12:00:00"); let a=0;
  while(a<days){d.setDate(d.getDate()+1);const w=d.getDay();if(w!==0&&w!==3&&w!==6)a++;}
  return d.toISOString().split("T")[0];
};

async function callAI(system, messages) {
  const key = process.env.REACT_APP_ANTHROPIC_API_KEY;
  if(!key) throw new Error("Configura REACT_APP_ANTHROPIC_API_KEY en el archivo .env");
  const res = await fetch("https://api.anthropic.com/v1/messages",{
    method:"POST",
    headers:{"Content-Type":"application/json","x-api-key":key,"anthropic-version":"2023-06-01","anthropic-dangerous-direct-browser-access":"true"},
    body:JSON.stringify({model:"claude-sonnet-4-20250514",max_tokens:1500,system,messages})
  });
  if(!res.ok){const e=await res.json().catch(()=>({}));throw new Error(e.error?.message||`Error ${res.status}`);}
  const d = await res.json();
  return d.content?.map(c=>c.text||"").join("")||"";
}

async function ocrExtract(b64, docType, mime) {
  const prompts = {
    license:    `Analiza esta licencia de conducir. Devuelve JSON exacto sin markdown: {"fullName":"","licenseNumber":"","dob":"YYYY-MM-DD","address":"","licenseExpiry":"YYYY-MM-DD","state":""}`,
    contract:   `Analiza este contrato de escuela de manejo CDL. Devuelve JSON exacto sin markdown: {"fullName":"","contractDate":"YYYY-MM-DD","courseStartDate":"YYYY-MM-DD","totalPrice":0,"courseType":"Class A","transmission":"Manual","schedule":"Regular","downPayment":0}`,
    clp:        `Analiza este CLP/Commercial Learner Permit. Devuelve JSON exacto sin markdown: {"fullName":"","clpNumber":"","dob":"YYYY-MM-DD","clpExpiry":"YYYY-MM-DD"}`,
    medicalCard:`Analiza esta Medical Card DOT. Devuelve JSON exacto sin markdown: {"fullName":"","issueDate":"YYYY-MM-DD","expiryDate":"YYYY-MM-DD","provider":""}`,
    drugTest:   `Analiza este resultado de Drug Test. Devuelve JSON exacto sin markdown: {"fullName":"","testDate":"YYYY-MM-DD","result":"Negative","labName":""}`,
    eldt:       `Analiza este certificado ELDT/LTC. Devuelve JSON exacto sin markdown: {"fullName":"","completionDate":"YYYY-MM-DD","status":"Completed"}`,
  };
  try {
    const t = await callAI("",[{role:"user",content:[
      {type:"image",source:{type:"base64",media_type:mime,data:b64}},
      {type:"text",text:prompts[docType]||prompts.license}
    ]}]);
    return JSON.parse(t.replace(/```json|```/g,"").trim());
  } catch { return {}; }
}

const DEMO_STUDENTS = [
  {
    id:9001,
    fullName:"Carlos Mendoza",
    phone:"(786) 555-0198",
    email:"carlos.mendoza@email.com",
    dob:"1992-03-15",
    address:"1234 SW 8th St, Miami, FL 33135",
    licenseNumber:"M123-456-78-910",
    licenseExpiry:"2027-03-15",
    clpNumber:"CLP-2024-0042",
    clpExpiry:"2025-06-30",
    contractDate:"2025-01-10",
    courseStartDate:"2025-01-15",
    completionDate:"2025-04-30",
    courseType:"Class A",
    transmission:"Manual",
    schedule:"Regular",
    totalPrice:5500,
    downPayment:1500,
    profilePhoto:"",
    representativeName:"Jahaziel Mokay",
    representativeDate:"2025-01-10",
    dmvScheduled:false,
    status:"DMV Candidate",
    paymentSchedule:[
      {id:1,dueDate:"2025-02-01",amount:1000,method:"Zelle",notes:"Segunda cuota"},
      {id:2,dueDate:"2025-03-01",amount:1000,method:"Zelle",notes:"Tercera cuota"},
      {id:3,dueDate:"2025-04-01",amount:2000,method:"Cash",notes:"Cuota final"},
    ],
    progress:{
      preTrip:82,
      maneuvers:78,
      roadDriving:85,
      pretripCats:{safeStart:85,brakesAir:80,inCab:90,externalLights:88,frontVehicle:82,steeringAxle:78,sideVehicle:80,combination:76,trailer:88},
      maneuverCats:{maneuver1:82,maneuver2:76,maneuver3:78,maneuver4:80},
      pretripItems:[],
      pretripSessions:[],
      history:[
        {date:"2025-02-01",by:"Jahaziel Mokay",ptScore:65,manScore:60,rdScore:70},
        {date:"2025-03-01",by:"Jahaziel Mokay",ptScore:75,manScore:70,rdScore:80},
        {date:"2025-04-01",by:"Jahaziel Mokay",ptScore:82,manScore:78,rdScore:85},
      ],
    },
    documents:{contract:true,license:true,clp:true,medicalCard:true,drugTest:true,eldt:false},
    docFiles:{profilePhoto:null,license:null,permit:null,medicalCard:null,drugTest:null,additional:[]},
    payments:[
      {id:1,date:"2025-01-10",amount:1500,method:"Cash",registeredBy:"Jahaziel Mokay",note:"Pago inicial"},
      {id:2,date:"2025-02-03",amount:1000,method:"Zelle",registeredBy:"Jahaziel Mokay",note:"Segunda cuota"},
      {id:3,date:"2025-03-05",amount:1000,method:"Zelle",registeredBy:"Jahaziel Mokay",note:"Tercera cuota"},
    ],
    attendance:[
      {id:1,date:"2025-01-16",hours:4},
      {id:2,date:"2025-01-18",hours:4},
      {id:3,date:"2025-01-23",hours:4},
      {id:4,date:"2025-01-25",hours:4},
      {id:5,date:"2025-02-06",hours:4},
      {id:6,date:"2025-02-08",hours:4},
      {id:7,date:"2025-02-13",hours:4},
      {id:8,date:"2025-02-15",hours:4},
      {id:9,date:"2025-03-06",hours:4},
      {id:10,date:"2025-03-08",hours:4},
      {id:11,date:"2025-03-20",hours:4},
      {id:12,date:"2025-03-22",hours:4},
    ],
    notes:[
      {id:1,text:"Estudiante muy comprometido. Excelente actitud en campo.",date:"2025-02-01",by:"Jahaziel Mokay"},
      {id:2,text:"Mejoró significativamente en maniobras de reversa. Listo para DMV en abril.",date:"2025-04-01",by:"Jahaziel Mokay"},
    ],
    dmv:{
      truckAssigned:"Brown Truck (Manual)",
      actualDate:"2025-05-08",
      time:"08:00",
      location:"DMV Hialeah — 1865 W 49th St",
      result:"Scheduled",
      attempt:1,
      failedArea:"",
      reTestDate:"",
    },
    studentSignature:null,
    signatureDate:"2025-01-10",
  }
];

// ─── GENERADORES PDF ──────────────────────────────────────────────────────────
function genStudentPDF(s) {
  const bal=balance(s), paid=totalPaid(s), prog=avgProg(s);
  const sm = STATUS_META[s.status]||STATUS_META["Inactive"];
  const now = new Date().toLocaleDateString("es-US",{year:"numeric",month:"long",day:"numeric"});
  const html = `<!DOCTYPE html><html lang="es"><head><meta charset="UTF-8"/><title>Reporte ${s.fullName}</title>
<style>
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:'Inter',sans-serif;background:#fff;color:#0f172a;padding:36px;font-size:12.5px;line-height:1.5}
.hdr{display:flex;justify-content:space-between;align-items:center;padding-bottom:18px;border-bottom:3px solid #0a1628;margin-bottom:22px}
.logo-wrap{display:flex;align-items:center;gap:14px}
.logo-img{width:56px;height:56px;object-fit:contain;border-radius:10px}
.school{font-size:18px;font-weight:900;color:#0a1628;letter-spacing:-.01em}
.school-sub{font-size:10px;color:#64748b;letter-spacing:.08em;text-transform:uppercase;margin-top:2px}
.rpt-meta{text-align:right}
.rpt-title{font-size:14px;font-weight:800;color:#2563eb}
.rpt-date{font-size:10px;color:#94a3b8;margin-top:2px}
.banner{background:linear-gradient(135deg,#0a1628 0%,#1e3a6b 60%,#2563eb 100%);color:#fff;border-radius:14px;padding:20px 24px;margin-bottom:18px;display:flex;justify-content:space-between;align-items:center}
.name{font-size:22px;font-weight:900;letter-spacing:-.02em}
.meta{font-size:11.5px;color:#93c5fd;margin-top:5px}
.pill{background:rgba(255,255,255,.15);border:1px solid rgba(255,255,255,.3);border-radius:20px;padding:6px 16px;font-size:11.5px;font-weight:700}
.kpis{display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin-bottom:18px}
.kpi{background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;padding:14px;text-align:center}
.kpi-v{font-size:28px;font-weight:900}
.kpi-l{font-size:9px;color:#94a3b8;text-transform:uppercase;letter-spacing:.08em;margin-top:3px}
.g2{display:grid;grid-template-columns:1fr 1fr;gap:14px;margin-bottom:14px}
.section{border:1px solid #e2e8f0;border-radius:12px;padding:15px;break-inside:avoid}
.sec-t{font-size:9.5px;font-weight:800;color:#2563eb;text-transform:uppercase;letter-spacing:.1em;margin-bottom:11px;padding-bottom:6px;border-bottom:2px solid #eff6ff}
.row{display:flex;justify-content:space-between;padding:5px 0;border-bottom:1px solid #f8fafc;font-size:12px}
.row:last-child{border-bottom:none}.rk{color:#64748b}.rv{font-weight:700;text-align:right;max-width:55%}
.pb-w{margin-bottom:10px}.pb-l{display:flex;justify-content:space-between;font-size:11px;font-weight:600;margin-bottom:4px}
.pb{height:9px;background:#e8edf2;border-radius:5px;overflow:hidden}.pbf{height:100%;border-radius:5px}
.doc-g{display:grid;grid-template-columns:1fr 1fr;gap:5px}
.doc-item{padding:5px 10px;border-radius:7px;font-size:11px;font-weight:600}
.pay-row{display:flex;justify-content:space-between;padding:6px 0;border-bottom:1px solid #f1f5f9;font-size:11.5px}
.badge-g{background:#dcfce7;color:#166534;padding:2px 8px;border-radius:20px;font-size:10.5px;font-weight:700}
.sig-area{margin-top:32px;padding-top:18px;border-top:2px solid #e2e8f0;display:grid;grid-template-columns:1fr 1fr;gap:48px}
.sig-line{border-top:2px solid #0a1628;margin-top:44px;padding-top:7px;text-align:center}
.footer{margin-top:18px;padding-top:10px;border-top:1px solid #e2e8f0;display:flex;justify-content:space-between;font-size:9.5px;color:#94a3b8}
.dmv-ok{background:#f0fdf4;border:1px solid #bbf7d0;border-radius:8px;padding:9px 13px;color:#166534;font-weight:700;font-size:11.5px;margin-top:10px}
.dmv-no{background:#fff7ed;border:1px solid #fed7aa;border-radius:8px;padding:9px 13px;color:#92400e;font-weight:700;font-size:11.5px;margin-top:10px}
@media print{@page{margin:1.4cm}body{padding:0}}
</style></head><body>
<div class="hdr">
  <div class="logo-wrap">
    <img src="${SCHOOL_LOGO}" class="logo-img" alt="Logo"/>
    <div><div class="school">Felipe's Truck Driving School</div><div class="school-sub">CDL Training Center · Hialeah, FL</div></div>
  </div>
  <div class="rpt-meta"><div class="rpt-title">INFORME DE PROGRESO</div><div class="rpt-date">TDSuite v4.0 · ${now}</div></div>
</div>
<div class="banner">
  <div>
    <div class="name">${s.fullName}</div>
    <div class="meta">${s.courseType} · ${s.transmission} · Horario: ${s.schedule||"Regular"} · Tel: ${s.phone||"—"}</div>
  </div>
  <div class="pill">${sm.icon} ${sm.label}</div>
</div>
<div class="kpis">
  <div class="kpi"><div class="kpi-v" style="color:#2563eb">${s.progress.preTrip}%</div><div class="kpi-l">Pre-Trip</div></div>
  <div class="kpi"><div class="kpi-v" style="color:#7c3aed">${s.progress.maneuvers}%</div><div class="kpi-l">Maniobras</div></div>
  <div class="kpi"><div class="kpi-v" style="color:#0e7490">${s.progress.roadDriving}%</div><div class="kpi-l">Road Driving</div></div>
</div>
<div class="section" style="margin-bottom:14px">
  <div class="sec-t">Progreso Detallado</div>
  ${[["Pre-Trip Inspection",s.progress.preTrip,"#2563eb"],["Maniobras / Backing",s.progress.maneuvers,"#7c3aed"],["Manejo en Ruta",s.progress.roadDriving,"#0e7490"]].map(([k,v,c])=>`
    <div class="pb-w"><div class="pb-l"><span>${k}</span><span style="color:${v>=75?"#166534":"#92400e"}">${v}%</span></div>
    <div class="pb"><div class="pbf" style="width:${v}%;background:${v>=75?"#16a34a":"#ea580c"}"></div></div></div>`).join("")}
  <div class="${prog>=75?"dmv-ok":"dmv-no"}">${prog>=75?"✓ CANDIDATO PARA EXAMEN DMV":"⚠ En Proceso — Requiere ≥75% en todas las áreas"} · Promedio General: ${prog}%</div>
</div>
<div class="g2">
  <div class="section"><div class="sec-t">Datos Personales</div>
    ${[["Nombre",s.fullName],["Teléfono",s.phone||"—"],["Email",s.email||"—"],["Fecha Nac.",fmtDate(s.dob)],["Dirección",s.address||"—"],["Licencia #",s.licenseNumber||"—"],["Vence Lic.",fmtDate(s.licenseExpiry)]].map(([k,v])=>`<div class="row"><span class="rk">${k}</span><span class="rv">${v}</span></div>`).join("")}
  </div>
  <div class="section"><div class="sec-t">Información del Curso</div>
    ${[["Clase CDL",s.courseType],["Transmisión",s.transmission],["Modalidad",s.schedule||"Regular"],["Inicio",fmtDate(s.courseStartDate)],s.completionDate&&["Completación",fmtDate(s.completionDate)],["Precio Total",fmtCur(s.totalPrice)],["Total Pagado",fmtCur(paid)],["Balance",fmtCur(bal)]].filter(Boolean).map(([k,v])=>`<div class="row"><span class="rk">${k}</span><span class="rv" style="${k==="Balance"&&bal>0?"color:#dc2626":k==="Balance"?"color:#16a34a":""}">${v}</span></div>`).join("")}
  </div>
</div>
<div class="g2">
  <div class="section"><div class="sec-t">Documentos</div>
    <div class="doc-g">${Object.entries(s.documents||{}).map(([k,v])=>`<div class="doc-item" style="background:${v?"#f0fdf4":"#fff7ed"};color:${v?"#166534":"#ea580c"};border:1px solid ${v?"#bbf7d0":"#fed7aa"}">${v?"✓":"✗"} ${DOC_LABELS[k]||k}</div>`).join("")}</div>
  </div>
  <div class="section"><div class="sec-t">DMV</div>
    ${[["Fecha Cita",s.dmv?.actualDate?fmtDate(s.dmv.actualDate):"No programada"],["Resultado",s.dmv?.result||"Pendiente"],["Camión",s.dmv?.truckAssigned||"—"],["Intento #",s.dmv?.attempt||1]].map(([k,v])=>`<div class="row"><span class="rk">${k}</span><span class="rv" style="${v==="Passed"?"color:#166534":v==="Failed"?"color:#dc2626":""}">${v}</span></div>`).join("")}
  </div>
</div>
${(s.payments||[]).length>0?`<div class="section" style="margin-bottom:14px"><div class="sec-t">Historial de Pagos</div>${[...s.payments].reverse().map(p=>`<div class="pay-row"><span>${fmtDate(p.date)} · ${p.method}${p.note?" · "+p.note:""}</span><span class="badge-g">${fmtCur(p.amount)}</span></div>`).join("")}<div style="display:flex;justify-content:space-between;margin-top:10px;padding-top:10px;border-top:2px solid #e2e8f0;font-weight:700"><span>Balance Pendiente</span><span style="font-size:15px;color:${bal>0?"#dc2626":"#16a34a"}">${fmtCur(bal)}</span></div></div>`:""}
<div class="sig-area">
  <div><div class="sig-line"><div style="font-weight:800;font-size:13px">Jahaziel Mokay</div><div style="font-size:11px;color:#64748b">Director — Felipe's Truck Driving School</div></div></div>
  <div><div class="sig-line"><div style="font-weight:800;font-size:13px">${s.fullName}</div><div style="font-size:11px;color:#64748b">Estudiante</div></div></div>
</div>
<div class="footer"><span>Felipe's Truck Driving School · CDL Training Center · Hialeah, FL</span><span>TDSuite v4.0 · ${now} · Documento Oficial</span></div>
</body></html>`;
  const w = window.open("","_blank"); w.document.write(html); w.document.close(); setTimeout(()=>w.print(),800);
}

function genReceiptPDF(s, payment) {
  const now = new Date().toLocaleDateString("es-US",{year:"numeric",month:"long",day:"numeric"});
  const rNum = `FTDS-${s.id}-${payment.id}`;
  const bal = balance({...s, payments: s.payments});
  const html = `<!DOCTYPE html><html><head><meta charset="UTF-8"/><title>Recibo ${rNum}</title>
<style>
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800;900&display=swap');
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:'Inter',sans-serif;background:#fff;color:#0f172a;padding:50px;max-width:560px;margin:0 auto}
.top{text-align:center;margin-bottom:30px}
.logo-img{width:70px;height:70px;object-fit:contain;border-radius:16px;margin-bottom:12px}
.school{font-size:17px;font-weight:900;color:#0a1628}
.sub{font-size:10px;color:#94a3b8;margin-top:3px;text-transform:uppercase;letter-spacing:.06em}
.receipt-box{border:2px solid #e2e8f0;border-radius:16px;overflow:hidden;margin-bottom:24px}
.rh{background:linear-gradient(135deg,#0a1628,#1e3a6b);color:#fff;padding:18px 24px;display:flex;justify-content:space-between;align-items:center}
.rt{font-size:16px;font-weight:800}.rn{font-size:10.5px;color:#93c5fd;margin-top:2px}
.rb{padding:22px 24px}
.amt{text-align:center;padding:20px 0;border-bottom:2px dashed #e2e8f0;margin-bottom:18px}
.amt-v{font-size:48px;font-weight:900;color:#16a34a;letter-spacing:-.03em}
.amt-l{font-size:11px;color:#94a3b8;text-transform:uppercase;letter-spacing:.08em;margin-top:4px}
.row{display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid #f8fafc;font-size:12.5px}
.row:last-child{border-bottom:none}.rk{color:#64748b}.rv{font-weight:700}
.stamp{text-align:center;margin-top:22px;padding-top:18px;border-top:2px solid #e2e8f0}
.sc{width:88px;height:88px;border:3px solid #16a34a;border-radius:50%;display:flex;flex-direction:column;align-items:center;justify-content:center;margin:0 auto 10px;color:#16a34a}
.sp{font-size:13.5px;font-weight:900;letter-spacing:.1em}.sd{font-size:9px;color:#64748b;margin-top:2px}
.sig-area{margin-top:28px;display:grid;grid-template-columns:1fr 1fr;gap:32px}
.sig-box{text-align:center}.sig-line{border-top:1.5px solid #0a1628;margin-top:38px;padding-top:7px}
.footer{margin-top:22px;text-align:center;font-size:9.5px;color:#94a3b8}
@media print{@page{margin:1cm}body{padding:20px}}
</style></head><body>
<div class="top">
  <img src="${SCHOOL_LOGO}" class="logo-img" alt="Logo"/>
  <div class="school">Felipe's Truck Driving School</div>
  <div class="sub">Recibo Oficial de Pago</div>
</div>
<div class="receipt-box">
  <div class="rh">
    <div><div class="rt">Recibo de Pago</div><div class="rn">No. ${rNum} · ${now}</div></div>
    <div style="font-size:22px">✅</div>
  </div>
  <div class="rb">
    <div class="amt"><div class="amt-v">${fmtCur(payment.amount)}</div><div class="amt-l">Pago Recibido</div></div>
    ${[["Estudiante",s.fullName],["Teléfono",s.phone||"—"],["Fecha de Pago",fmtDateLong(payment.date)],["Método",payment.method],["Clase CDL",s.courseType+" · "+s.transmission],["Precio Total",fmtCur(s.totalPrice)],["Total Pagado",fmtCur(totalPaid(s))],["Balance Restante",fmtCur(bal)]].map(([k,v])=>`<div class="row"><span class="rk">${k}</span><span class="rv" style="${k==="Balance Restante"&&bal>0?"color:#dc2626":k==="Balance Restante"?"color:#16a34a":""}">${v}</span></div>`).join("")}
    ${payment.note?`<div style="margin-top:10px;padding:9px 12px;background:#f8fafc;border-radius:8px;font-size:11.5px;color:#475569"><b>Nota:</b> ${payment.note}</div>`:""}
    <div class="stamp">
      <div class="sc"><div class="sp">PAGADO</div><div class="sd">${now}</div></div>
      <div style="font-size:11px;color:#64748b">Pago verificado y registrado · TDSuite v4.0</div>
    </div>
  </div>
</div>
<div class="sig-area">
  <div class="sig-box"><div class="sig-line"><div style="font-weight:800;font-size:12.5px">Jahaziel Mokay</div><div style="font-size:10.5px;color:#64748b">Director — FTDS</div></div></div>
  <div class="sig-box"><div class="sig-line"><div style="font-weight:800;font-size:12.5px">${s.fullName}</div><div style="font-size:10.5px;color:#64748b">Estudiante</div></div></div>
</div>
<div class="footer">Felipe's Truck Driving School · TDSuite v4.0 · ${now}<br/>Este documento es comprobante oficial de pago</div>
</body></html>`;
  const w = window.open("","_blank"); w.document.write(html); w.document.close(); setTimeout(()=>w.print(),800);
}

function genContractPDF(s) {
  const now = new Date().toLocaleDateString("es-US",{year:"numeric",month:"long",day:"numeric"});
  const html = `<!DOCTYPE html><html><head><meta charset="UTF-8"/><title>Contrato ${s.fullName}</title>
<style>
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:'Inter',sans-serif;background:#fff;color:#0f172a;padding:48px;font-size:12.5px;line-height:1.7}
.hdr{display:flex;justify-content:space-between;align-items:center;padding-bottom:16px;border-bottom:3px solid #0a1628;margin-bottom:28px}
.logo-img{width:54px;height:54px;object-fit:contain;border-radius:10px}
.title{font-size:20px;font-weight:900;color:#0a1628;text-align:center;margin-bottom:24px;text-transform:uppercase;letter-spacing:.04em}
.section{margin-bottom:22px}
.sec-t{font-size:13px;font-weight:800;color:#2563eb;border-bottom:2px solid #eff6ff;padding-bottom:6px;margin-bottom:12px;text-transform:uppercase;letter-spacing:.05em}
.clause{margin-bottom:10px;text-align:justify}
.field-row{display:flex;gap:20px;margin-bottom:10px}
.field{flex:1;border-bottom:1.5px solid #0a1628;padding-bottom:3px;min-height:22px}
.field-label{font-size:10px;color:#64748b;text-transform:uppercase;letter-spacing:.06em;margin-bottom:2px}
.field-value{font-weight:700}
.sig-area{margin-top:40px;display:grid;grid-template-columns:1fr 1fr;gap:60px}
.sig-line{border-top:2px solid #0a1628;margin-top:60px;padding-top:8px;text-align:center}
.footer{margin-top:28px;padding-top:12px;border-top:1px solid #e2e8f0;font-size:9.5px;color:#94a3b8;text-align:center}
@media print{@page{margin:1.5cm}body{padding:0}}
</style></head><body>
<div class="hdr">
  <div style="display:flex;align-items:center;gap:12px">
    <img src="${SCHOOL_LOGO}" class="logo-img" alt="Logo"/>
    <div><div style="font-size:16px;font-weight:900;color:#0a1628">Felipe's Truck Driving School</div><div style="font-size:10px;color:#64748b;letter-spacing:.06em">CDL Training Center · Hialeah, FL</div></div>
  </div>
  <div style="text-align:right;font-size:10.5px;color:#64748b">Fecha: ${now}<br/>Contrato #FTDS-${s.id}</div>
</div>
<div class="title">Contrato de Matrícula CDL</div>
<div class="section">
  <div class="sec-t">1. Datos del Estudiante</div>
  <div class="field-row">
    <div><div class="field-label">Nombre Completo</div><div class="field"><div class="field-value">${s.fullName}</div></div></div>
    <div><div class="field-label">Teléfono</div><div class="field"><div class="field-value">${s.phone||"_______________"}</div></div></div>
  </div>
  <div class="field-row">
    <div><div class="field-label">Email</div><div class="field"><div class="field-value">${s.email||"_______________"}</div></div></div>
    <div><div class="field-label">Fecha de Nacimiento</div><div class="field"><div class="field-value">${fmtDate(s.dob)}</div></div></div>
  </div>
  <div class="field-row">
    <div style="flex:2"><div class="field-label">Dirección</div><div class="field"><div class="field-value">${s.address||"_______________"}</div></div></div>
    <div><div class="field-label">Número de Licencia</div><div class="field"><div class="field-value">${s.licenseNumber||"_______________"}</div></div></div>
  </div>
</div>
<div class="section">
  <div class="sec-t">2. Programa y Condiciones Financieras</div>
  <div class="field-row">
    <div><div class="field-label">Clase CDL</div><div class="field"><div class="field-value">${s.courseType}</div></div></div>
    <div><div class="field-label">Transmisión</div><div class="field"><div class="field-value">${s.transmission}</div></div></div>
    <div><div class="field-label">Horario</div><div class="field"><div class="field-value">${s.schedule||"Regular"}</div></div></div>
  </div>
  <div class="field-row">
    <div><div class="field-label">Fecha de Inicio</div><div class="field"><div class="field-value">${fmtDate(s.courseStartDate)}</div></div></div>
    <div><div class="field-label">Precio Total del Programa</div><div class="field"><div class="field-value" style="color:#0a1628;font-size:15px">${fmtCur(s.totalPrice)}</div></div></div>
    <div><div class="field-label">Pago Inicial</div><div class="field"><div class="field-value">${fmtCur(totalPaid(s))}</div></div></div>
  </div>
</div>
<div class="section">
  <div class="sec-t">3. Términos y Condiciones</div>
  <div class="clause"><b>Pago:</b> El estudiante se compromete a pagar el saldo pendiente de ${fmtCur(balance(s))} según el plan acordado. El saldo total debe estar liquidado mínimo 7 días antes del examen DMV.</div>
  <div class="clause"><b>Asistencia:</b> El estudiante deberá asistir puntualmente a todas las sesiones de entrenamiento programadas. Las faltas injustificadas pueden resultar en reprogramación con cargo adicional.</div>
  <div class="clause"><b>Documentos:</b> El estudiante es responsable de entregar todos los documentos requeridos (CLP vigente, Medical Card, Drug Test, ELDT) en los plazos establecidos.</div>
  <div class="clause"><b>Examen DMV:</b> Felipe's Truck Driving School se compromete a preparar al estudiante para el examen CDL del DMV. El costo del examen gubernamental no está incluido en el precio del programa.</div>
  <div class="clause"><b>Cancelaciones:</b> Cancelaciones realizadas después de 72 horas del inicio del programa no son reembolsables. Cancelaciones antes de iniciar tienen derecho a reembolso del 80% del pago realizado.</div>
  <div class="clause"><b>Vehículo:</b> El camión asignado para este estudiante es: <b>${s.transmission==="Automatic"?"White Truck (Automático)":"Brown Truck (Manual)"}</b>.</div>
</div>
${(s.paymentSchedule||[]).length>0?`<div class="section">
  <div class="sec-t">Plan de Pagos</div>
  <table style="width:100%;border-collapse:collapse;font-size:12px">
    <tr style="background:#f8fafc"><th style="padding:7px 10px;text-align:left;border:1px solid #e2e8f0;color:#64748b">Fecha</th><th style="padding:7px 10px;text-align:left;border:1px solid #e2e8f0;color:#64748b">Monto</th><th style="padding:7px 10px;text-align:left;border:1px solid #e2e8f0;color:#64748b">Método</th><th style="padding:7px 10px;text-align:left;border:1px solid #e2e8f0;color:#64748b">Notas</th></tr>
    ${(s.paymentSchedule||[]).map(r=>`<tr><td style="padding:7px 10px;border:1px solid #e2e8f0">${fmtDate(r.dueDate)}</td><td style="padding:7px 10px;border:1px solid #e2e8f0;font-weight:700">${fmtCur(r.amount)}</td><td style="padding:7px 10px;border:1px solid #e2e8f0">${r.method}</td><td style="padding:7px 10px;border:1px solid #e2e8f0;color:#64748b">${r.notes||""}</td></tr>`).join("")}
  </table>
</div>`:""}
<div class="sig-area">
  <div>
    <div style="font-size:11px;color:#64748b;margin-bottom:4px">Firma del Estudiante · ${fmtDate(s.signatureDate||s.contractDate||today)}</div>
    ${s.studentSignature?`<img src="${s.studentSignature}" style="height:56px;display:block;margin-bottom:4px;border-bottom:2px solid #0a1628"/>`:`<div style="height:56px;border-bottom:2px solid #0a1628;margin-bottom:6px"></div>`}
    <div style="font-weight:800;font-size:12.5px">${s.fullName}</div>
    <div style="font-size:10.5px;color:#64748b">Estudiante</div>
  </div>
  <div>
    <div style="font-size:11px;color:#64748b;margin-bottom:4px">Representante Escolar · ${fmtDate(s.representativeDate||today)}</div>
    <div style="height:56px;border-bottom:2px solid #0a1628;margin-bottom:6px"></div>
    <div style="font-weight:800;font-size:12.5px">${s.representativeName||"Jahaziel Mokay"}</div>
    <div style="font-size:10.5px;color:#64748b">Director — Felipe's Truck Driving School</div>
  </div>
</div>
<div class="footer">Felipe's Truck Driving School · Hialeah, FL · Tel: [teléfono de la escuela] · TDSuite v4.0 · ${now}</div>
</body></html>`;
  const w = window.open("","_blank"); w.document.write(html); w.document.close(); setTimeout(()=>w.print(),800);
}


// ─── CSS PROFESIONAL v4.0 ────────────────────────────────────────────────────
const getCSS = (dark) => `
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
:root{
  --bg:${dark?"#060c18":"#f8fafc"};
  --bg2:${dark?"#0a1424":"#f1f5f9"};
  --surface:${dark?"#0d1a2e":"#ffffff"};
  --surface2:${dark?"#111f35":"#f8fafc"};
  --border:${dark?"rgba(255,255,255,.07)":"#e2e8f0"};
  --border2:${dark?"rgba(255,255,255,.04)":"#f1f5f9"};
  --text:${dark?"#e2eaf6":"#0f172a"};
  --text2:${dark?"#8eaac8":"#475569"};
  --text3:${dark?"#4a6a8a":"#94a3b8"};
  --accent:#0f2544;
  --accent-light:#1e4d8c;
  --green:#16a34a;
  --red:#dc2626;
  --yellow:#b45309;
  --purple:#7c3aed;
  --teal:#0e7490;
  --navy:#0f2544;
}
body{
  font-family:'Plus Jakarta Sans',sans-serif;
  background:var(--bg);
  color:var(--text);
  -webkit-font-smoothing:antialiased;
}
input,select,textarea,button{font-family:inherit}
::-webkit-scrollbar{width:5px;height:5px}
::-webkit-scrollbar-track{background:transparent}
::-webkit-scrollbar-thumb{background:${dark?"rgba(255,255,255,.1)":"rgba(0,0,0,.12)"};border-radius:4px}

/* SIDEBAR */
.sb{width:256px;background:#0a1525;position:fixed;height:100vh;display:flex;flex-direction:column;z-index:100}
.sb-logo{padding:20px 16px 16px;border-bottom:1px solid rgba(255,255,255,.06)}
.sb-logo-inner{display:flex;align-items:center}
.ni{display:flex;align-items:center;gap:10px;padding:9px 12px;margin:1px 8px;border-radius:10px;cursor:pointer;color:rgba(255,255,255,.4);font-size:13px;font-weight:500;transition:all .15s;border:none;background:none;width:calc(100% - 16px);text-align:left;position:relative;outline:none}
.ni:hover{background:rgba(255,255,255,.06);color:rgba(255,255,255,.75)}
.ni.active{background:linear-gradient(135deg,rgba(15,37,68,.95),rgba(30,77,140,.9));color:#fff;font-weight:600;box-shadow:0 4px 16px rgba(15,37,68,.4)}
.ni-icon{width:18px;height:18px;display:flex;align-items:center;justify-content:center;flex-shrink:0}
.ni-badge{margin-left:auto;background:#dc2626;color:#fff;border-radius:20px;padding:1px 7px;font-size:10.5px;font-weight:700}
.sb-section{font-size:9px;font-weight:700;color:rgba(255,255,255,.18);letter-spacing:.14em;text-transform:uppercase;padding:10px 20px 5px}
.sb-nav{flex:1;padding:10px 0;overflow-y:auto}
.sb-user{padding:12px 14px 16px;border-top:1px solid rgba(255,255,255,.06)}
.notif-dot{position:absolute;top:7px;right:10px;width:7px;height:7px;border-radius:50%;background:#dc2626;animation:blink 2s infinite}

/* MAIN */
.mn{margin-left:256px;min-height:100vh;background:var(--bg);transition:background .4s}
.pg{padding:30px 34px;animation:pgIn .25s ease}

/* CARDS */
.card{background:var(--surface);border-radius:14px;border:1px solid var(--border)}
.card-hover{transition:all .2s}.card-hover:hover{transform:translateY(-2px);box-shadow:0 8px 30px rgba(0,0,0,${dark?".35":".08"})}
.cp{padding:22px}.cs{padding:14px 18px}
.sh{box-shadow:${dark?"0 1px 4px rgba(0,0,0,.4)":"0 1px 4px rgba(0,0,0,.06)"}}
.shm{box-shadow:${dark?"0 6px 24px rgba(0,0,0,.5)":"0 6px 24px rgba(0,0,0,.1)"}}

/* KPI CARDS */
.kpi{background:var(--surface);border-radius:16px;border:1px solid var(--border);padding:20px;position:relative;overflow:hidden;transition:all .2s}
.kpi:hover{transform:translateY(-3px);box-shadow:0 12px 36px rgba(0,0,0,${dark?".4":".1"})}
.kpi::before{content:'';position:absolute;top:0;left:0;right:0;height:3px;background:var(--kpi-clr,var(--accent))}

/* BUTTONS */
.btn{padding:8px 18px;border-radius:10px;border:none;cursor:pointer;font-weight:600;font-size:13px;transition:all .15s;display:inline-flex;align-items:center;gap:7px;white-space:nowrap;outline:none;font-family:inherit}
.bp{background:#0f2544;color:#fff;box-shadow:0 2px 8px rgba(15,37,68,.35)}.bp:hover{background:#1a3a6b;transform:translateY(-1px);box-shadow:0 4px 16px rgba(15,37,68,.45)}.bp:active{transform:translateY(0)}.bp:disabled{background:#94a3b8;cursor:not-allowed;transform:none;box-shadow:none}
.bo{background:var(--surface);color:var(--text2);border:1.5px solid var(--border)}.bo:hover{border-color:var(--accent);color:var(--accent);background:${dark?"rgba(15,37,68,.15)":"#eff6ff"}}
.bgg{background:linear-gradient(135deg,#16a34a,#15803d);color:#fff}.bgg:hover{transform:translateY(-1px)}
.br{background:linear-gradient(135deg,#dc2626,#b91c1c);color:#fff}.br:hover{transform:translateY(-1px)}
.bgh{background:transparent;color:var(--text3);border:none}.bgh:hover{color:var(--accent);background:${dark?"rgba(15,37,68,.15)":"#eff6ff"}}
.bsm{padding:5px 12px;font-size:12px;border-radius:8px}
.blg{padding:12px 28px;font-size:14.5px;border-radius:12px}
.wa-btn{background:linear-gradient(135deg,#25d366,#1da851);color:#fff;border:none;border-radius:10px;padding:8px 16px;font-weight:600;font-size:12.5px;cursor:pointer;display:inline-flex;align-items:center;gap:7px;transition:all .15s;font-family:inherit}
.wa-btn:hover{transform:translateY(-1px)}

/* FORMS */
.inp{width:100%;background:var(--surface2);border:1.5px solid var(--border);border-radius:10px;padding:10px 14px;color:var(--text);font-size:13.5px;outline:none;transition:all .15s;font-family:inherit}
.inp:focus{border-color:var(--accent);box-shadow:0 0 0 3px rgba(15,37,68,.1);background:var(--surface)}
.sel{width:100%;background:var(--surface2);border:1.5px solid var(--border);border-radius:10px;padding:10px 14px;color:var(--text);font-size:13.5px;outline:none;cursor:pointer;font-family:inherit}
.sel:focus{border-color:var(--accent);box-shadow:0 0 0 3px rgba(15,37,68,.1)}
.lbl{font-size:11px;font-weight:700;color:var(--text3);letter-spacing:.05em;text-transform:uppercase;display:block;margin-bottom:5px}
.sw{position:relative}.sw svg{position:absolute;left:12px;top:50%;transform:translateY(-50%);color:var(--text3);pointer-events:none}
.si{padding-left:38px !important}

/* TABLES */
.tbl{width:100%;border-collapse:collapse}
.tbl th{padding:10px 16px;text-align:left;font-size:10.5px;font-weight:700;color:var(--text3);text-transform:uppercase;letter-spacing:.07em;background:var(--surface2);border-bottom:1px solid var(--border);white-space:nowrap}
.tbl td{padding:12px 16px;border-bottom:1px solid var(--border2);font-size:13.5px;color:var(--text)}
.tbl tr:last-child td{border-bottom:none}
.tbl tbody tr{transition:background .1s;cursor:pointer}
.tbl tbody tr:hover td{background:${dark?"rgba(15,37,68,.1)":"rgba(15,37,68,.03)"}}

/* TABS */
.tabs{display:flex;gap:2px;background:var(--surface2);border-radius:12px;padding:3px;flex-wrap:wrap}
.tab{padding:7px 16px;border-radius:9px;font-size:13px;font-weight:600;color:var(--text3);border:none;background:none;cursor:pointer;transition:all .15s;white-space:nowrap;font-family:inherit}
.tab.on{background:var(--surface);color:var(--accent);box-shadow:0 1px 4px rgba(0,0,0,.12)}

/* PROGRESS */
.pt{height:7px;background:var(--border);border-radius:4px;overflow:hidden}
.pf{height:100%;border-radius:4px;transition:width .6s cubic-bezier(.4,0,.2,1)}
.ptlg{height:11px}

/* ALERTS */
.al{border-radius:10px;padding:11px 16px;display:flex;align-items:flex-start;gap:10px;font-size:13px;line-height:1.5}
.ar{background:${dark?"rgba(220,38,38,.1)":"#fef2f2"};border:1px solid ${dark?"rgba(220,38,38,.2)":"#fecaca"};color:${dark?"#fca5a5":"#991b1b"}}
.ay{background:${dark?"rgba(180,83,9,.1)":"#fffbeb"};border:1px solid ${dark?"rgba(180,83,9,.2)":"#fde68a"};color:${dark?"#fcd34d":"#92400e"}}
.agr{background:${dark?"rgba(22,163,74,.08)":"#f0fdf4"};border:1px solid ${dark?"rgba(22,163,74,.18)":"#bbf7d0"};color:${dark?"#86efac":"#14532d"}}
.ab{background:${dark?"rgba(15,37,68,.15)":"#eff6ff"};border:1px solid ${dark?"rgba(15,37,68,.25)":"#bfdbfe"};color:${dark?"#93c5fd":"#1e3a6b"}}

/* MODALS */
.ov{position:fixed;inset:0;background:rgba(0,0,0,${dark?".75":".5"});backdrop-filter:blur(10px);display:flex;align-items:center;justify-content:center;z-index:1000;padding:20px;animation:ovIn .2s ease}
.md{background:var(--surface);border-radius:20px;padding:28px;width:100%;max-width:600px;max-height:92vh;overflow-y:auto;box-shadow:0 40px 100px rgba(0,0,0,${dark?".6":".2"});border:1px solid var(--border);animation:mdIn .25s cubic-bezier(.34,1.56,.64,1)}
.md-sm{max-width:420px}
.md-lg{max-width:800px}

/* AVATARS */
.av{border-radius:50%;background:linear-gradient(135deg,#0f2544,#1e4d8c);display:flex;align-items:center;justify-content:center;font-weight:700;color:#fff;flex-shrink:0;font-family:'Inter',sans-serif}

/* BADGES */
.badge{display:inline-flex;align-items:center;gap:4px;padding:3px 10px;border-radius:20px;font-size:11px;font-weight:700}

/* KANBAN */
.kanban-card{background:var(--surface);border-radius:12px;padding:13px;margin-bottom:8px;border:1px solid var(--border);cursor:grab;transition:all .15s;user-select:none}
.kanban-card:hover{border-color:var(--accent);box-shadow:0 4px 16px rgba(15,37,68,.2);transform:translateY(-2px)}

/* GRIDS */
.g2{display:grid;grid-template-columns:1fr 1fr;gap:14px}
.g3{display:grid;grid-template-columns:1fr 1fr 1fr;gap:14px}
.g4{display:grid;grid-template-columns:repeat(4,1fr);gap:14px}

/* SECTION TITLE */
.sec{font-size:10.5px;font-weight:700;color:var(--accent);text-transform:uppercase;letter-spacing:.08em;padding-bottom:8px;border-bottom:2px solid ${dark?"rgba(15,37,68,.2)":"#e8f0fa"};margin-bottom:16px}

/* MISC */
.sticker{display:inline-flex;align-items:center;gap:5px;padding:4px 12px;border-radius:20px;font-size:11.5px;font-weight:700}
.cal-day{min-height:72px;border-radius:10px;padding:7px;border:1px solid var(--border);font-size:11px;transition:background .15s}
.tl-dot{width:10px;height:10px;border-radius:50%;flex-shrink:0;margin-top:5px}

@media(max-width:900px){.g3,.g4{grid-template-columns:1fr 1fr}.sb{transform:translateX(-100%)}.mn{margin-left:0}.pg{padding:16px}}
@media(max-width:600px){.g2,.g3,.g4{grid-template-columns:1fr}}
@keyframes pgIn{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}
@keyframes ovIn{from{opacity:0}to{opacity:1}}
@keyframes mdIn{from{opacity:0;transform:scale(.94) translateY(10px)}to{opacity:1;transform:scale(1) translateY(0)}}
@keyframes blink{0%,100%{opacity:1}50%{opacity:.3}}
@keyframes slideIn{from{transform:translateX(110%);opacity:0}to{transform:translateX(0);opacity:1}}
@keyframes spin{to{transform:rotate(360deg)}}
@keyframes fadeUp{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:translateY(0)}}
`;


// ─── ICONS ────────────────────────────────────────────────────────────────────
const Ico = ({n,s=16,c="currentColor",sw=2}) => {
  const p={width:s,height:s,fill:"none",stroke:c,strokeWidth:sw,viewBox:"0 0 24 24",strokeLinecap:"round",strokeLinejoin:"round"};
  const icons={
    grid:<svg {...p}><rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/></svg>,
    users:<svg {...p}><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
    card:<svg {...p}><rect x="2" y="5" width="20" height="14" rx="2"/><path d="M2 10h20"/></svg>,
    truck:<svg {...p}><rect x="1" y="3" width="15" height="13" rx="1"/><path d="M16 8h4l3 5v3h-7V8z"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></svg>,
    bot:<svg {...p}><rect x="3" y="11" width="18" height="10" rx="2"/><circle cx="12" cy="5" r="2"/><path d="M12 7v4"/><path d="M8 15h.01M12 15h.01M16 15h.01"/></svg>,
    search:<svg {...p}><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>,
    plus:<svg {...p}><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>,
    back:<svg {...p}><polyline points="15 18 9 12 15 6"/></svg>,
    next:<svg {...p}><polyline points="9 18 15 12 9 6"/></svg>,
    edit:<svg {...p}><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>,
    warn:<svg {...p}><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>,
    check:<svg {...p}><polyline points="20 6 9 17 4 12"/></svg>,
    logout:<svg {...p}><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>,
    send:<svg {...p}><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>,
    bell:<svg {...p}><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>,
    chart:<svg {...p}><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>,
    cal:<svg {...p}><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>,
    msg:<svg {...p}><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>,
    userplus:<svg {...p}><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="8.5" cy="7" r="4"/><line x1="20" y1="8" x2="20" y2="14"/><line x1="23" y1="11" x2="17" y2="11"/></svg>,
    download:<svg {...p}><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>,
    x:<svg {...p}><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>,
    eye:<svg {...p}><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>,
    eyeoff:<svg {...p}><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></svg>,
    sun:<svg {...p}><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>,
    moon:<svg {...p}><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>,
    kanban:<svg {...p}><rect x="3" y="3" width="5" height="18" rx="1"/><rect x="10" y="3" width="5" height="12" rx="1"/><rect x="17" y="3" width="5" height="15" rx="1"/></svg>,
    pdf:<svg {...p}><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>,
    receipt:<svg {...p}><path d="M4 2v20l2-1 2 1 2-1 2 1 2-1 2 1 2-1 2 1V2l-2 1-2-1-2 1-2-1-2 1-2-1-2 1z"/><line x1="16" y1="8" x2="8" y2="8"/><line x1="16" y1="12" x2="8" y2="12"/><line x1="11" y1="16" x2="8" y2="16"/></svg>,
    tag:<svg {...p}><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/></svg>,
    star:<svg {...p}><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>,
    trending:<svg {...p}><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>,
    contract:<svg {...p}><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>,
    copy:<svg {...p}><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>,
    trash:<svg {...p}><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>,
    refresh:<svg {...p}><polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/></svg>,
    lock:<svg {...p}><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>,
    settings:<svg {...p}><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>,
    info:<svg {...p}><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>,
    mail:<svg {...p}><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>,
    phone:<svg {...p}><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 13a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.56 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/></svg>,
    award:<svg {...p}><circle cx="12" cy="8" r="7"/><polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88"/></svg>,
  };
  return icons[n]||null;
};

const WaIcon = ({s=13}) => <svg width={s} height={s} viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>;
// ─── AVATAR CON FOTO ─────────────────────────────────────────────────────────
const AvatarImg = ({s,size=36,fontSize=12}) => s.profilePhoto ? (
  <img src={s.profilePhoto} alt={s.fullName} style={{width:size,height:size,borderRadius:"50%",objectFit:"cover",border:"2px solid var(--border)",flexShrink:0}}/>
) : (
  <div className="av" style={{width:size,height:size,fontSize}}>{getInit(s.fullName)}</div>
);



// ─── TOAST ────────────────────────────────────────────────────────────────────
function Toast({msg,type="info",onClose,dark}) {
  useEffect(()=>{const t=setTimeout(onClose,4500);return()=>clearTimeout(t);},[]);
  const cfg={success:["#16a34a","#dcfce7","#bbf7d0"],error:["#dc2626","#fee2e2","#fecaca"],warning:["#b45309","#fef3c7","#fde68a"],info:["#2563eb","#eff6ff","#bfdbfe"]};
  const [col,bg,border]=cfg[type]||cfg.info;
  return(
    <div style={{position:"fixed",top:20,right:20,zIndex:9999,animation:"slideIn .35s cubic-bezier(.34,1.56,.64,1)",background:dark?"#0d1a2e":bg,borderRadius:14,padding:"13px 18px",maxWidth:360,minWidth:260,boxShadow:`0 8px 32px rgba(0,0,0,${dark?".5":".12"})`,display:"flex",alignItems:"flex-start",gap:11,border:`1.5px solid ${dark?col+"40":border}`}}>
      <div style={{width:8,height:8,borderRadius:"50%",background:col,flexShrink:0,marginTop:5}}/>
      <div style={{flex:1,fontSize:13.5,fontWeight:500,lineHeight:1.45,color:dark?"#e2eaf6":col}}>{msg}</div>
      <button onClick={onClose} style={{background:"none",border:"none",color:dark?"rgba(255,255,255,.3)":col,cursor:"pointer",padding:2,flexShrink:0,opacity:.7}}><Ico n="x" s={13}/></button>
    </div>
  );
}


// ─── APP ROOT con PERSISTENCIA ────────────────────────────────────────────────
export default function App() {
  const [user,    setUser]    = useState(()=>LS.get("tds_session",null));
  const [sysUsers,setSysUsers]= useState(()=>LS.get("tds_users",INITIAL_USERS));
  const [students,setStudents]= useState(()=>LS.get("tds_students",DEMO_STUDENTS));
  const [view,    setView]    = useState("dashboard");
  const [sel,     setSel]     = useState(null);
  const [sTab,    setSTab]    = useState("overview");
  const [wizard,  setWizard]  = useState(false);
  const [toasts,  setToasts]  = useState([]);
  const [notifs,  setNotifs]  = useState(()=>LS.get("tds_notifs",[]));
  const [unreadN, setUnreadN] = useState(()=>LS.get("tds_notifs",[]).filter(n=>!n.read).length);
  const [dark,    setDark]    = useState(()=>LS.get("tds_dark",true));
  const [lang,    setLang]    = useState(()=>LS.get("tds_lang","es"));
  const [cmdK,    setCmdK]    = useState(false);
  const [sortCol, setSortCol] = useState({col:"fullName",dir:"asc"});
  const [tick,    setTick]    = useState(0);
  const [autoRef, setAutoRef] = useState(false);
  const [lastRef, setLastRef] = useState(null);
  const sbLoadedRef = useRef(false);

  // Auto-refresh cada 1.2 segundos
  useEffect(()=>{
    if(!autoRef) return;
    const id = setInterval(()=>setTick(t=>t+1), 1200);
    return ()=>clearInterval(id);
  },[autoRef]);

  // Forzar re-render en tick (los datos ya son reactivos, esto actualiza timestamps)
  const manualRefresh = useCallback(()=>{
    setTick(t=>t+1);
    setLastRef(new Date());
    addToast(lang==="es"?"Sistema actualizado":"System refreshed","success");
  },[lang]);
  const t = useT(lang);

  // Persistir todo en localStorage automáticamente
  useEffect(()=>LS.set("tds_dark",dark),[dark]);
  useEffect(()=>LS.set("tds_lang",lang),[lang]);
  useEffect(()=>LS.set("tds_users",sysUsers),[sysUsers]);
  useEffect(()=>LS.set("tds_students",students),[students]);
  // SUPABASE: guardar estudiantes en la nube (ademas del local)
  useEffect(()=>{
    if(!sbLoadedRef.current) return; // no guardar durante la carga inicial
    const t=setTimeout(async ()=>{
      try{
        const filas=students.map(s=>({
          student_key: s.id ? String(s.id) : String(Date.now()+Math.random()),
          school_id: SCHOOL_ID,
          data: s
        }));
        if(filas.length===0) return;
        const { error } = await supabase.from("students").upsert(filas, { onConflict: "student_key" });
        if(error){ console.warn("Supabase guardado:", error.message); }
      }catch(e){ console.warn("Supabase guardado (exc):", e?.message||e); }
    }, 1500);
    return ()=>clearTimeout(t);
  },[students]);
  useEffect(()=>LS.set("tds_notifs",notifs),[notifs]);
  useEffect(()=>{ if(user) LS.set("tds_session",user); else LS.del("tds_session"); },[user]);

  // ====== SUPABASE: login automatico + carga inicial desde la nube ======
  useEffect(()=>{
    let cancelado=false;
    async function arrancarNube(){
      try{
        const { data: sesion } = await supabase.auth.getSession();
        if(!sesion?.session){
          const email=process.env.REACT_APP_SB_EMAIL;
          const password=process.env.REACT_APP_SB_PASSWORD;
          if(email&&password){
            const { error: errLogin } = await supabase.auth.signInWithPassword({ email, password });
            if(errLogin){ console.warn("Supabase login:", errLogin.message); }
          }
        }
        const { data, error } = await supabase
          .from("students")
          .select("data")
          .eq("school_id", SCHOOL_ID);
        if(cancelado) return;
        if(error){
          console.warn("Supabase carga:", error.message);
        } else if(data && data.length>0){
          const lista=data.map(f=>f.data).filter(Boolean);
          if(lista.length>0){ setStudents(lista); }
        }
      }catch(e){
        console.warn("Supabase arranque:", e?.message||e);
      }finally{
        if(!cancelado){ sbLoadedRef.current=true; }
      }
    }
    arrancarNube();
    return ()=>{ cancelado=true; };
  },[]);
  // ======================================================================

  // Cmd+K global search
  useEffect(()=>{
    const h=e=>{if((e.metaKey||e.ctrlKey)&&e.key==="k"){e.preventDefault();setCmdK(v=>!v);}};
    window.addEventListener("keydown",h);return()=>window.removeEventListener("keydown",h);
  },[]);

  // Session timeout 30min
  useEffect(()=>{
    if(!user)return;
    const events=["mousedown","keydown","scroll","touchstart"];
    let timer;
    const reset=()=>{
      clearTimeout(timer);
      timer=setTimeout(()=>{addToast("Sesión cerrada por inactividad.","warning");handleLogout();},(30*60*1000));
    };
    reset();
    events.forEach(e=>window.addEventListener(e,reset));
    return()=>{clearTimeout(timer);events.forEach(e=>window.removeEventListener(e,reset));};
  },[user]);

  const addToast=(msg,type="info")=>setToasts(p=>[...p,{id:Date.now()+Math.random(),msg,type}]);
  const removeToast=id=>setToasts(p=>p.filter(t=>t.id!==id));

  const addNotif=(title,body,type="info")=>{
    const n={id:Date.now(),title,body,type,time:new Date().toISOString(),read:false};
    setNotifs(p=>[n,...p.slice(0,49)]);
    setUnreadN(x=>x+1);
    addToast(`${title}: ${body}`,type);
  };
  const markNotifsRead=()=>{setNotifs(p=>p.map(n=>({...n,read:true})));setUnreadN(0);};

  const updateStudent=u=>{
    u.progress={...u.progress,preTrip:calcPT(u.progress.pretripCats),maneuvers:calcMan(u.progress.maneuverCats)};
    setStudents(p=>p.map(s=>s.id===u.id?u:s));
    setSel({...u});
  };

  const addStudent=ns=>{
    ns.progress={...ns.progress,preTrip:calcPT(ns.progress.pretripCats),maneuvers:calcMan(ns.progress.maneuverCats)};
    const newS={...ns,id:Date.now()};
    setStudents(p=>[...p,newS]);
    setWizard(false);setView("students");
    addNotif("Estudiante Registrado",`${ns.fullName} ingresado al sistema.`,"success");
  };

  const openStudent=s=>{setSel(s);setSTab("overview");setView("student");};

  const deleteStudent=id=>{
    setStudents(p=>p.filter(s=>s.id!==id));
    setView("students");setSel(null);
    addToast("Estudiante archivado.","info");
  };

  const handleLogout=()=>{setUser(null);setView("dashboard");setSel(null);LS.del("tds_session");};

  const handleLogin=u=>{
    const upd={...u,lastLogin:new Date().toISOString()};
    setSysUsers(p=>p.map(x=>x.id===u.id?upd:x));
    setUser(upd);
  };

  const perms = user ? (user.perms||ROLE_PERMS[user.role]||ROLE_PERMS.readonly) : {};

  const dmvCandidates = useMemo(()=>students.filter(s=>isDMVReady(s)&&!["Passed / Graduated","DMV Scheduled"].includes(s.status)),[students]);
  const totalBalance  = useMemo(()=>students.reduce((a,s)=>a+balance(s),0),[students]);
  const dmvSoon       = useMemo(()=>students.filter(s=>{if(!s.dmv?.actualDate)return false;const d=(new Date(s.dmv.actualDate)-new Date(today))/86400000;return d>=0&&d<=7;}),[students]);
  const activeCount   = useMemo(()=>students.filter(s=>!["Inactive","Passed / Graduated"].includes(s.status)).length,[students]);
  const activityLog   = useMemo(()=>students.flatMap(s=>(s.payments||[]).map(p=>({type:"payment",student:s.fullName,amount:p.amount,date:p.date,id:p.id+s.id}))).sort((a,b)=>b.date?.localeCompare(a.date||"")||0).slice(0,8),[students]);

  // Actualizar CSS variables directamente en el DOM (funciona al instante)
  useEffect(()=>{
    const r = document.documentElement;
    if(dark){
      r.style.setProperty('--bg',       '#060c18');
      r.style.setProperty('--bg2',      '#0a1424');
      r.style.setProperty('--surface',  '#0d1a2e');
      r.style.setProperty('--surface2', '#111f35');
      r.style.setProperty('--border',   'rgba(255,255,255,.07)');
      r.style.setProperty('--border2',  'rgba(255,255,255,.04)');
      r.style.setProperty('--text',     '#e2eaf6');
      r.style.setProperty('--text2',    '#8eaac8');
      r.style.setProperty('--text3',    '#4a6a8a');
      r.style.setProperty('--navy',     '#030a14');
      r.style.setProperty('--navy2',    '#060c18');
      r.style.setProperty('--scrollbar','rgba(255,255,255,.1)');
    } else {
      r.style.setProperty('--bg',       '#f0f4f8');
      r.style.setProperty('--bg2',      '#e8edf4');
      r.style.setProperty('--surface',  '#ffffff');
      r.style.setProperty('--surface2', '#f8fafc');
      r.style.setProperty('--border',   '#e2e8f0');
      r.style.setProperty('--border2',  '#f1f5f9');
      r.style.setProperty('--text',     '#0f172a');
      r.style.setProperty('--text2',    '#475569');
      r.style.setProperty('--text3',    '#94a3b8');
      r.style.setProperty('--navy',     '#0f2544');
      r.style.setProperty('--navy2',    '#0a1e38');
      r.style.setProperty('--scrollbar','rgba(0,0,0,.15)');
    }
    // Colores fijos que no cambian con el tema
    r.style.setProperty('--accent',  '#2563eb');
    r.style.setProperty('--accent2', '#1d4ed8');
    r.style.setProperty('--green',   '#16a34a');
    r.style.setProperty('--red',     '#dc2626');
    r.style.setProperty('--yellow',  '#b45309');
    r.style.setProperty('--purple',  '#7c3aed');
    r.style.setProperty('--teal',    '#0e7490');
    r.style.setProperty('--orange',  '#ea580c');
    document.body.style.background = dark ? '#060c18' : '#f0f4f8';
    document.body.style.color      = dark ? '#e2eaf6' : '#0f172a';
    document.body.style.transition = 'background .3s,color .3s';
  },[dark]);

  const CSS=getCSS(dark);
  if(!user) return <LoginPage
 users={sysUsers} onLogin={handleLogin} dark={dark} setDark={setDark} lang={lang} setLang={setLang}/>;
  if(wizard) return <Wizard onSave={addStudent} onCancel={()=>setWizard(false)} dark={dark} lang={lang}/>;

  const NAV=[
    {id:"dashboard",label:t("dashboard"),icon:"grid",always:true},
    {id:"students",label:t("students"),icon:"users",always:true},
    {id:"kanban",label:t("kanban"),icon:"kanban",always:true},
    {id:"payments",label:t("payments"),icon:"card",perm:"canPay"},
    {id:"messages",label:t("messages"),icon:"msg",perm:"canMessages"},
    {id:"dmv",label:t("dmv"),icon:"truck",always:true},
    {id:"calendar",label:t("calendar"),icon:"cal",always:true},
    {id:"reports",label:t("reports"),icon:"chart",perm:"canReports"},
    {id:"ai",label:t("ai"),icon:"bot",always:true},
    {id:"users",label:t("users"),icon:"userplus",perm:"canUsers"},
    {id:"settings",label:lang==="es"?"Configuración":"Settings",icon:"settings",always:true},
  ].filter(n=>n.always||perms[n.perm]);



  return(
    <AppContext.Provider value={{dark, lang, t, setDark, setLang}}>
    <div style={{fontFamily:"'Plus Jakarta Sans',sans-serif"}}>
      <style>{CSS}</style>
      {toasts.map(t=><Toast key={t.id} msg={t.msg} type={t.type} onClose={()=>removeToast(t.id)}/>)}
      {cmdK && <GlobalSearch students={students} openStudent={openStudent} onClose={()=>setCmdK(false)}/>}

      {/* ── SIDEBAR ── */}
      <aside className="sb">
        <div className="sb-logo">
          <div className="sb-logo-inner" style={{padding:"4px 0 8px",flexDirection:"column",alignItems:"flex-start",gap:3}}>
            <img src={SCHOOL_LOGO_NEG} alt="TDSuite" style={{width:160,height:46,objectFit:"contain",display:"block"}}/>
            <span style={{fontSize:8,fontWeight:500,color:"rgba(255,255,255,.18)",letterSpacing:".2em",textTransform:"uppercase",paddingLeft:2,display:"block"}}>
              {lang==="es"?"Gestión Escolar CDL":"CDL School Management"}
            </span>
          </div>
        </div>

        <nav className="sb-nav">
          <div className="sb-section">Principal</div>
          {NAV.map(({id,label,icon})=>(
            <button key={id} className={`ni${view===id||(view==="student"&&id==="students")?" active":""}`}
              onClick={()=>{setView(id);if(id!=="students")setSel(null);}}>
              <span className="ni-icon"><Ico n={icon} s={15}/></span>
              {label}
              {id==="users"&&unreadN>0&&<span className="notif-dot"/>}
            </button>
          ))}
          <div className="sb-section" style={{marginTop:6}}>Sistema</div>
          <button className="ni" onClick={()=>{setView("notifications");markNotifsRead();}}>
            <span className="ni-icon"><Ico n="bell" s={15}/></span>
            {t("notifications")}
            {unreadN>0&&<span className="ni-badge">{unreadN}</span>}
          </button>
          <button className="ni" onClick={()=>setCmdK(true)}>
            <span className="ni-icon"><Ico n="search" s={15}/></span>
            {t("search")}
            <span style={{marginLeft:"auto",fontSize:10,opacity:.4,fontFamily:"monospace"}}>⌘K</span>
          </button>

          {/* ── REFRESH CONTROLS ── */}
          <div style={{margin:"6px 8px 2px",padding:"10px 12px",background:"rgba(255,255,255,.03)",borderRadius:11,border:"1px solid rgba(255,255,255,.05)"}}>
            <div style={{fontSize:9.5,fontWeight:700,color:"rgba(255,255,255,.2)",letterSpacing:".1em",textTransform:"uppercase",marginBottom:8}}>
              {lang==="es"?"Actualización":"Refresh"}
            </div>
            {/* Botón manual */}
            <button onClick={manualRefresh}
              style={{width:"100%",padding:"8px 0",borderRadius:8,border:"1px solid rgba(255,255,255,.08)",
                background:"rgba(255,255,255,.04)",color:"rgba(255,255,255,.5)",fontSize:12.5,
                fontWeight:600,cursor:"pointer",fontFamily:"inherit",display:"flex",alignItems:"center",
                justifyContent:"center",gap:7,marginBottom:8,transition:"all .15s"}}
              onMouseOver={e=>{e.currentTarget.style.background="rgba(255,255,255,.08)";e.currentTarget.style.color="rgba(255,255,255,.8)";}}
              onMouseOut={e=>{e.currentTarget.style.background="rgba(255,255,255,.04)";e.currentTarget.style.color="rgba(255,255,255,.5)";}}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/></svg>
              {lang==="es"?"Actualizar ahora":"Refresh now"}
            </button>
            {/* Toggle auto-refresh */}
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between"}}>
              <span style={{fontSize:11.5,color:"rgba(255,255,255,.3)",fontWeight:500}}>
                {lang==="es"?"Auto (1.2s)":"Auto (1.2s)"}
              </span>
              <div onClick={()=>setAutoRef(v=>!v)}
                style={{width:38,height:20,borderRadius:10,background:autoRef?"#16a34a":"rgba(255,255,255,.1)",
                  cursor:"pointer",position:"relative",transition:"background .2s",border:"1px solid rgba(255,255,255,.08)"}}>
                <div style={{position:"absolute",top:3,left:autoRef?19:3,width:12,height:12,borderRadius:"50%",
                  background:"#fff",transition:"left .2s cubic-bezier(.4,0,.2,1)"}}/>
              </div>
            </div>
            {lastRef&&<div style={{fontSize:9.5,color:"rgba(255,255,255,.18)",marginTop:6,textAlign:"center"}}>
              {lang==="es"?"Hace":"Last"}: {timeAgo(lastRef.toISOString())}
            </div>}
          </div>
        </nav>

        <div className="sb-user">
          {/* Theme toggle + Language */}
          <div style={{padding:"10px 14px 8px",borderTop:"1px solid rgba(255,255,255,.06)"}}>
            {/* Toggle iOS de tema */}
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:8}}>
              <span style={{fontSize:11,color:"rgba(255,255,255,.3)",fontWeight:600,letterSpacing:".04em"}}>
                {dark?(lang==="es"?"Modo oscuro":"Dark mode"):(lang==="es"?"Modo claro":"Light mode")}
              </span>
              <div onClick={()=>setDark(d=>!d)} style={{
                width:42,height:23,borderRadius:12,
                background:dark?"#0f2544":"rgba(255,255,255,.15)",
                cursor:"pointer",position:"relative",transition:"background .3s",
                border:"1px solid rgba(255,255,255,.1)",flexShrink:0
              }}>
                <div style={{
                  position:"absolute",top:3,left:dark?20:3,
                  width:15,height:15,borderRadius:"50%",
                  background:"#fff",transition:"left .3s cubic-bezier(.4,0,.2,1)",
                  boxShadow:"0 1px 4px rgba(0,0,0,.3)"
                }}/>
              </div>
            </div>
            {/* Selector de idioma */}
            <div style={{display:"flex",gap:3,background:"rgba(255,255,255,.04)",borderRadius:8,padding:3}}>
              {["es","en"].map(l=>(
                <button key={l} onClick={()=>setLang(l)} style={{
                  flex:1,padding:"5px 0",borderRadius:6,border:"none",
                  background:lang===l?"rgba(255,255,255,.12)":"transparent",
                  color:lang===l?"#fff":"rgba(255,255,255,.28)",
                  fontSize:11.5,fontWeight:lang===l?700:500,cursor:"pointer",
                  fontFamily:"inherit",transition:"all .2s",letterSpacing:".04em"
                }}>
                  {l==="es"?"ES":"EN"}
                </button>
              ))}
            </div>
          </div>
          {/* User info */}
          <div style={{display:"flex",alignItems:"center",gap:10,padding:"8px 14px 4px"}}>
            <div className="av" style={{width:32,height:32,fontSize:11,flexShrink:0}}>{user.avatar}</div>
            <div style={{flex:1,minWidth:0}}>
              <div style={{fontSize:12,fontWeight:700,color:"#e2eaf4",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{user.name}</div>
              <div style={{fontSize:10,color:ROLE_PERMS[user.role]?.color||"#64748b",fontWeight:600}}>{ROLE_PERMS[user.role]?.label}</div>
            </div>
          </div>
          <button className="ni" style={{justifyContent:"center",color:"rgba(255,255,255,.3)",fontSize:12,padding:"7px",margin:"2px 8px 10px"}} onClick={handleLogout}>
            <Ico n="logout" s={13}/>{lang==="es"?"Cerrar Sesión":"Sign Out"}
          </button>
        </div>
      </aside>

      {/* ── MAIN CONTENT ── */}
      <main className="mn">
        {view==="dashboard"    && <DashPage students={students} openStudent={openStudent} setWizard={setWizard} dmvCandidates={dmvCandidates} totalBalance={totalBalance} dmvSoon={dmvSoon} activeCount={activeCount} activityLog={activityLog} tick={tick}/>}
        {view==="students"     && !sel && <StudentsPage students={students} openStudent={openStudent} setWizard={setWizard} sortCol={sortCol} setSortCol={setSortCol}/>}
        {view==="student"      && sel  && <DetailPage s={sel} updateStudent={updateStudent} deleteStudent={deleteStudent} goBack={()=>{setView("students");setSel(null);}} sTab={sTab} setSTab={setSTab} perms={perms} addToast={addToast} addNotif={addNotif}/>}
        {view==="kanban"       && <KanbanPage students={students} openStudent={openStudent} updateStudent={updateStudent}/>}
        {view==="payments"     && perms.canPay && <PaymentsPage students={students} openStudent={openStudent} totalBalance={totalBalance}/>}
        {view==="messages"     && perms.canMessages && <MessagesPage students={students}/>}
        {view==="dmv"          && <DmvPage students={students} openStudent={openStudent}/>}
        {view==="calendar"     && <CalendarPage students={students} openStudent={openStudent}/>}
        {view==="reports"      && perms.canReports && <ReportsPage students={students}/>}
        {view==="ai"           && <AIPage students={students}/>}
        {view==="settings" && <SettingsPage/>}
        {view==="users"        && perms.canUsers && <UsersPage sysUsers={sysUsers} currentUser={user} onCreateUser={u=>{setSysUsers(p=>[...p,{...u,id:Date.now(),createdAt:today,lastLogin:null,active:true}]);addNotif(t("users"),`${u.name} agregado.`,"success");}} onUpdateUser={u=>setSysUsers(p=>p.map(x=>x.id===u.id?u:x))} onDeleteUser={id=>setSysUsers(p=>p.filter(u=>u.id!==id))} notifs={notifs}/>}
        {view==="notifications"&& <NotifsPage notifs={notifs} markRead={markNotifsRead}/>}
      </main>
    </div>
    </AppContext.Provider>
  );
}


// ─── GLOBAL SEARCH (Cmd+K) ────────────────────────────────────────────────────
function GlobalSearch({students,openStudent,onClose}) {
  const {dark,lang,t} = useApp();
  const [q,setQ]=useState("");
  const results=useMemo(()=>{
    if(!q.trim())return[];
    const lq=q.toLowerCase();
    return students.filter(s=>s.fullName.toLowerCase().includes(lq)||s.phone?.includes(lq)||s.licenseNumber?.toLowerCase().includes(lq)||(s.email||"").toLowerCase().includes(lq)).slice(0,8);
  },[q,students]);
  const inputRef=useRef();
  useEffect(()=>{inputRef.current?.focus();},[]);
  useEffect(()=>{const h=e=>{if(e.key==="Escape")onClose();};window.addEventListener("keydown",h);return()=>window.removeEventListener("keydown",h);},[]);
  return(
    <div className="ov" onClick={onClose}>
      <div className="md md-sm" style={{padding:0,overflow:"hidden"}} onClick={e=>e.stopPropagation()}>
        <div style={{display:"flex",alignItems:"center",gap:12,padding:"14px 18px",borderBottom:`1px solid var(--border)`}}>
          <Ico n="search" s={16} c="var(--text3)"/>
          <input ref={inputRef} className="inp" style={{border:"none",padding:"0",fontSize:15,background:"transparent",flex:1}} placeholder="Buscar estudiante, teléfono, licencia..." value={q} onChange={e=>setQ(e.target.value)} autoFocus/>
          <button onClick={onClose} style={{background:"var(--surface2)",border:"1px solid var(--border)",borderRadius:6,padding:"4px 8px",fontSize:10.5,color:"var(--text3)",cursor:"pointer",fontFamily:"monospace"}}>ESC</button>
        </div>
        {results.length>0?(
          <div style={{maxHeight:360,overflowY:"auto"}}>
            {results.map(s=>{const sm=STATUS_META[s.status]||STATUS_META["Inactive"];const bal=balance(s);return(
              <div key={s.id} style={{padding:"12px 18px",borderBottom:`1px solid var(--border2)`,cursor:"pointer",display:"flex",alignItems:"center",gap:12,transition:"background .1s"}} onClick={()=>{openStudent(s);onClose();}}
                onMouseOver={e=>e.currentTarget.style.background=dark?"rgba(255,255,255,.04)":"#f8fafc"}
                onMouseOut={e=>e.currentTarget.style.background="transparent"}>
                <div className="av" style={{width:38,height:38,fontSize:13}}>{getInit(s.fullName)}</div>
                <div style={{flex:1}}>
                  <div style={{fontWeight:700,fontSize:14,color:"var(--text)"}}>{s.fullName}</div>
                  <div style={{fontSize:11.5,color:"var(--text3)",marginTop:1}}>{s.phone} · {s.courseType} · {s.transmission}</div>
                </div>
                <div style={{textAlign:"right"}}>
                  <span className="badge" style={{background:sm.bg,color:sm.color,fontSize:10}}>{sm.icon} {sm.label}</span>
                  {bal>0&&<div style={{fontSize:11,color:"var(--red)",marginTop:3,fontWeight:600}}>{fmtCur(bal)}</div>}
                </div>
              </div>
            );})}
          </div>
        ):q.trim()?(
          <div style={{padding:"32px",textAlign:"center",color:"var(--text3)",fontSize:13.5}}>Sin resultados para "{q}"</div>
        ):(
          <div style={{padding:"32px",textAlign:"center",color:"var(--text3)",fontSize:13}}>
            <div style={{fontSize:32,marginBottom:10}}>🔍</div>
            Escribe para buscar estudiantes
          </div>
        )}
      </div>
    </div>
  );
}

// ─── LOGIN PAGE ───────────────────────────────────────────────────────────────
function LoginPage({users,onLogin,dark,setDark,lang,setLang}) {
  const {t} = useApp();
  const [u,setU]       = useState("");
  const [p,setP]       = useState("");
  const [err,setErr]   = useState("");
  const [loading,setLoading] = useState(false);
  const [showP,setShowP]     = useState(false);

  const doLogin = () => {
    if(!u||!p){setErr(lang==="es"?"Ingresa tus credenciales.":"Enter your credentials.");return;}
    setLoading(true);
    setTimeout(()=>{
      const found = users.find(x=>x.username.toLowerCase()===u.toLowerCase()&&x.password===p&&x.active);
      if(found){onLogin(found);}
      else{setErr(lang==="es"?"Usuario o contraseña incorrectos.":"Invalid username or password.");setLoading(false);}
    },500);
  };

  // Tema: variables de color según modo
  const bg      = dark ? "#060c18" : "#f0f4f8";
  const surface = dark ? "rgba(255,255,255,.04)" : "rgba(255,255,255,.9)";
  const border  = dark ? "rgba(255,255,255,.08)" : "rgba(0,0,0,.08)";
  const textPri = dark ? "#ffffff" : "#0f172a";
  const textSec = dark ? "rgba(255,255,255,.45)" : "#64748b";
  const textMut = dark ? "rgba(255,255,255,.2)" : "#94a3b8";
  const inputBg = dark ? "rgba(255,255,255,.06)" : "#ffffff";
  const inputBorder = dark ? "rgba(255,255,255,.1)" : "#e2e8f0";
  const inputFocus  = dark ? "#3b82f6" : "#0f2544";
  const accentColor = "#0f2544";
  const panelBg = dark
    ? "linear-gradient(150deg,#030a14 0%,#060f20 40%,#0a1830 100%)"
    : "linear-gradient(150deg,#0f2544 0%,#1e3a6b 50%,#2952a3 100%)";

  return(
    <div style={{minHeight:"100vh",display:"flex",background:bg,transition:"background .4s",fontFamily:"'Plus Jakarta Sans',sans-serif",position:"relative",overflow:"hidden"}}>

      {/* ── LEFT PANEL ── */}
      <div style={{flex:"0 0 48%",background:panelBg,display:"flex",flexDirection:"column",justifyContent:"space-between",padding:"48px 56px",position:"relative",overflow:"hidden"}}>
        {/* Dot grid */}
        <div style={{position:"absolute",inset:0,backgroundImage:"radial-gradient(rgba(255,255,255,.04) 1px,transparent 1px)",backgroundSize:"32px 32px",pointerEvents:"none"}}/>
        {/* Glow */}
        <div style={{position:"absolute",top:-100,right:-80,width:400,height:400,background:"radial-gradient(circle,rgba(59,130,246,.15) 0%,transparent 65%)",pointerEvents:"none"}}/>
        <div style={{position:"absolute",bottom:-80,left:-60,width:300,height:300,background:"radial-gradient(circle,rgba(255,255,255,.04) 0%,transparent 65%)",pointerEvents:"none"}}/>

        {/* Logo */}
        <div style={{position:"relative"}}>
          <img src={SCHOOL_LOGO_NEG} alt="TDSuite" style={{width:180,height:52,display:"block",objectFit:"contain",objectPosition:"left center"}}/>
        </div>

        {/* Hero text */}
        <div style={{position:"relative"}}>
          <div style={{fontSize:40,fontWeight:900,color:"#ffffff",lineHeight:1.1,letterSpacing:"-.02em",marginBottom:16,fontFamily:"'Inter',sans-serif"}}>
            {lang==="es"?"La plataforma de tu":"The platform for your"}<br/>
            <span style={{background:"linear-gradient(135deg,#93c5fd,#818cf8)",WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent",backgroundClip:"text"}}>
              {lang==="es"?"escuela CDL.":"CDL school."}
            </span>
          </div>
          <p style={{fontSize:15,color:"rgba(255,255,255,.45)",lineHeight:1.7,maxWidth:340,marginBottom:40}}>
            {lang==="es"
              ?"Gestiona estudiantes, pagos, exámenes DMV y más — todo en un solo lugar."
              :"Manage students, payments, DMV exams and more — all in one place."}
          </p>
          <div style={{display:"flex",flexDirection:"column",gap:12}}>
            {(lang==="es"
              ?[["","Wizard OCR con IA","Registra escaneando documentos"],
                ["🚛","Gestión DMV","Candidatos y citas en tiempo real"],
                ["","Control de Pagos","Recibos PDF automáticos"],
                ["🤖","Asistente IA","Consultas en lenguaje natural"]]
              :[["","AI OCR Wizard","Register by scanning documents"],
                ["🚛","DMV Management","Candidates and appointments in real time"],
                ["","Payment Control","Automatic PDF receipts"],
                ["🤖","AI Assistant","Natural language queries"]]
            ).map(([icon,title,desc])=>(
              <div key={title} style={{display:"flex",alignItems:"center",gap:12}}>
                <div style={{width:36,height:36,borderRadius:9,background:"rgba(255,255,255,.07)",border:"1px solid rgba(255,255,255,.1)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:16,flexShrink:0}}>{icon}</div>
                <div>
                  <div style={{fontSize:13.5,fontWeight:700,color:"rgba(255,255,255,.85)"}}>{title}</div>
                  <div style={{fontSize:12,color:"rgba(255,255,255,.35)",marginTop:1}}>{desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer panel */}
        <div style={{position:"relative",fontSize:11,color:"rgba(255,255,255,.2)",display:"flex",justifyContent:"space-between"}}>
          <span>TDSuite v4.0</span>
          <span>Felipe's Truck Driving School</span>
        </div>
      </div>

      {/* ── RIGHT PANEL ── */}
      <div style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:"40px 48px",position:"relative"}}>

        {/* Theme + Lang controls — top right */}
        <div style={{position:"absolute",top:24,right:28,display:"flex",gap:8,alignItems:"center"}}>
          {/* Lang toggle */}
          <div style={{display:"flex",background:dark?"rgba(255,255,255,.06)":surface,border:`1px solid ${border}`,borderRadius:10,padding:3,gap:2}}>
            {["es","en"].map(l=>(
              <button key={l} onClick={()=>setLang(l)} style={{
                padding:"5px 14px",borderRadius:7,border:"none",
                background:lang===l?(dark?"rgba(255,255,255,.14)":accentColor):"transparent",
                color:lang===l?"#fff":(dark?"rgba(255,255,255,.35)":textSec),
                fontSize:12,fontWeight:lang===l?700:500,cursor:"pointer",
                fontFamily:"inherit",transition:"all .2s",letterSpacing:".03em"
              }}>
                {l==="es"?"ES":"EN"}
              </button>
            ))}
          </div>
          {/* Dark/Light toggle — estilo iPhone */}
          <div onClick={()=>setDark(d=>!d)} style={{
            display:"flex",alignItems:"center",gap:8,
            background:dark?"rgba(255,255,255,.06)":surface,
            border:`1px solid ${border}`,borderRadius:10,
            padding:"6px 12px",cursor:"pointer",transition:"all .2s",userSelect:"none"
          }}>
            <div style={{width:36,height:20,borderRadius:10,
              background:dark?"#0f2544":"#e2e8f0",
              position:"relative",transition:"background .3s",
              border:`1px solid ${dark?"rgba(255,255,255,.1)":"rgba(0,0,0,.08)"}`}}>
              <div style={{
                position:"absolute",top:2,
                left:dark?17:2,
                width:14,height:14,borderRadius:"50%",
                background:dark?"#ffffff":"#0f2544",
                transition:"left .3s cubic-bezier(.4,0,.2,1)",
                boxShadow:"0 1px 4px rgba(0,0,0,.25)"
              }}/>
            </div>
            <span style={{fontSize:12,fontWeight:600,color:textSec,whiteSpace:"nowrap"}}>
              {dark?(lang==="es"?"Oscuro":"Dark"):(lang==="es"?"Claro":"Light")}
            </span>
          </div>
        </div>

        {/* Form card */}
        <div style={{width:"100%",maxWidth:380}}>
          <div style={{marginBottom:32}}>
            <h1 style={{fontSize:26,fontWeight:800,color:textPri,letterSpacing:"-.02em",marginBottom:6,fontFamily:"'Inter',sans-serif"}}>
              {lang==="es"?"Bienvenido de vuelta":"Welcome back"}
            </h1>
            <p style={{fontSize:14,color:textSec}}>
              {lang==="es"?"Inicia sesión para continuar":"Sign in to continue"}
            </p>
          </div>

          <div style={{display:"flex",flexDirection:"column",gap:16}}>
            <div>
              <label style={{fontSize:12,fontWeight:600,color:textSec,letterSpacing:".04em",textTransform:"uppercase",display:"block",marginBottom:6}}>
                {lang==="es"?"Usuario":"Username"}
              </label>
              <input
                className="inp"
                placeholder={lang==="es"?"Nombre de usuario":"Username"}
                value={u}
                onChange={e=>setU(e.target.value)}
                onKeyDown={e=>e.key==="Enter"&&doLogin()}
                autoFocus
                style={{
                  background:inputBg,
                  border:`1.5px solid ${inputBorder}`,
                  color:textPri,
                  fontSize:14,padding:"11px 14px",borderRadius:11,
                  outline:"none",width:"100%",fontFamily:"inherit",
                  transition:"border .2s",boxSizing:"border-box"
                }}
                onFocus={e=>e.target.style.borderColor=inputFocus}
                onBlur={e=>e.target.style.borderColor=inputBorder}
              />
            </div>

            <div>
              <label style={{fontSize:12,fontWeight:600,color:textSec,letterSpacing:".04em",textTransform:"uppercase",display:"block",marginBottom:6}}>
                {lang==="es"?"Contraseña":"Password"}
              </label>
              <div style={{position:"relative"}}>
                <input
                  type={showP?"text":"password"}
                  className="inp"
                  placeholder="••••••••••"
                  value={p}
                  onChange={e=>setP(e.target.value)}
                  onKeyDown={e=>e.key==="Enter"&&doLogin()}
                  style={{
                    background:inputBg,
                    border:`1.5px solid ${inputBorder}`,
                    color:textPri,
                    fontSize:14,padding:"11px 44px 11px 14px",borderRadius:11,
                    outline:"none",width:"100%",fontFamily:"inherit",
                    transition:"border .2s",boxSizing:"border-box"
                  }}
                  onFocus={e=>e.target.style.borderColor=inputFocus}
                  onBlur={e=>e.target.style.borderColor=inputBorder}
                />
                <button onClick={()=>setShowP(v=>!v)} style={{
                  position:"absolute",right:12,top:"50%",transform:"translateY(-50%)",
                  background:"none",border:"none",color:textMut,cursor:"pointer",padding:4,
                  display:"flex",alignItems:"center"
                }}>
                  <Ico n={showP?"eyeoff":"eye"} s={16} c={textMut}/>
                </button>
              </div>
            </div>

            {err&&(
              <div style={{
                background:dark?"rgba(220,38,38,.1)":"#fef2f2",
                border:`1px solid ${dark?"rgba(220,38,38,.25)":"#fecaca"}`,
                borderRadius:10,padding:"10px 14px",
                fontSize:13,color:dark?"#fca5a5":"#991b1b",
                display:"flex",alignItems:"center",gap:8
              }}>
                <Ico n="warn" s={13} c={dark?"#fca5a5":"#991b1b"}/>{err}
              </div>
            )}

            <button
              onClick={doLogin}
              disabled={loading}
              style={{
                padding:"13px",borderRadius:12,border:"none",
                background:loading?"#94a3b8":"#0f2544",
                color:"#ffffff",fontSize:15,fontWeight:700,
                cursor:loading?"not-allowed":"pointer",
                fontFamily:"inherit",transition:"all .2s",
                display:"flex",alignItems:"center",justifyContent:"center",gap:8,
                boxShadow:loading?"none":"0 4px 20px rgba(15,37,68,.35)",
                marginTop:4
              }}
              onMouseOver={e=>{if(!loading)e.currentTarget.style.background="#1a3a6b";}}
              onMouseOut={e=>{if(!loading)e.currentTarget.style.background="#0f2544";}}
            >
              {loading?(
                <><div style={{width:16,height:16,border:"2px solid rgba(255,255,255,.3)",borderTopColor:"#fff",borderRadius:"50%",animation:"spin 1s linear infinite"}}/>{lang==="es"?"Verificando...":"Verifying..."}</>
              ):(lang==="es"?"Iniciar Sesión":"Sign In")}
            </button>
          </div>


        </div>
      </div>
    </div>
  );
}


// ─── KANBAN ───────────────────────────────────────────────────────────────────
function SettingsPage(){
  const {dark,lang} = useApp();
  return (
    <div style={{padding:"32px 40px",maxWidth:900}}>
      <h1 style={{fontSize:26,fontWeight:900,letterSpacing:"-.02em",color:dark?"#fff":"#0f2544",marginBottom:6}}>
        {lang==="es"?"Configuración":"Settings"}
      </h1>
      <p style={{color:dark?"rgba(255,255,255,.5)":"#64748b",fontSize:14,marginBottom:24}}>
        {lang==="es"?"Pesos de evaluación, sedes y perfil de la escuela.":"Evaluation weights, locations and school profile."}
      </p>
      <div style={{padding:"40px",borderRadius:16,border:`1px dashed ${dark?"rgba(255,255,255,.15)":"#cbd5e1"}`,textAlign:"center",color:dark?"rgba(255,255,255,.4)":"#94a3b8",fontSize:14,fontWeight:700}}>
        {lang==="es"?"🚧 En construcción — Paso 1 completado.":"🚧 Under construction — Step 1 done."}
      </div>
    </div>
  );
}
function KanbanPage({students,openStudent,updateStudent}) {
  const {dark,lang,t} = useApp();
  const COLS=Object.entries(STATUS_META).sort((a,b)=>a[1].order-b[1].order).map(([k,v])=>({key:k,...v}));
  const [dragId,setDragId]=useState(null);const [overCol,setOverCol]=useState(null);
  const handleDrop=status=>{
    if(!dragId)return;
    const s=students.find(x=>x.id===dragId);
    if(s&&s.status!==status) updateStudent({...s,status});
    setDragId(null);setOverCol(null);
  };
  return(
    <div className="pg">
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:24}}>
        <div>
          <h1 style={{fontSize:26,fontWeight:800,color:"var(--text)",fontFamily:"'Inter',sans-serif",letterSpacing:"-.02em"}}>Vista Kanban</h1>
          <p style={{color:"var(--text3)",fontSize:13.5,marginTop:3}}>Arrastra estudiantes para cambiar su estado — {students.length} total</p>
        </div>
      </div>
      <div style={{display:"flex",gap:12,overflowX:"auto",paddingBottom:16,alignItems:"flex-start"}}>
        {COLS.map(col=>{
          const colStudents=students.filter(s=>s.status===col.key);
          const isOver=overCol===col.key;
          return(
            <div key={col.key} style={{minWidth:215,flex:"0 0 215px"}}
              onDragOver={e=>{e.preventDefault();setOverCol(col.key);}}
              onDragLeave={()=>setOverCol(null)}
              onDrop={()=>handleDrop(col.key)}>
              <div style={{background:isOver?(dark?"rgba(37,99,235,.12)":"#eff6ff"):(dark?"rgba(255,255,255,.02)":"#f8fafc"),border:`2px solid ${isOver?"var(--accent)":"var(--border)"}`,borderRadius:14,padding:12,minHeight:180,transition:"all .2s"}}>
                <div style={{display:"flex",alignItems:"center",gap:7,marginBottom:12,padding:"0 2px"}}>
                  <span style={{fontSize:15}}>{col.icon}</span>
                  <span style={{fontSize:11.5,fontWeight:700,color:col.color,flex:1,lineHeight:1.3}}>{col.label}</span>
                  <span style={{background:col.bg,color:col.color,borderRadius:20,padding:"2px 8px",fontSize:11,fontWeight:800}}>{colStudents.length}</span>
                </div>
                {colStudents.map(s=>{const prog=avgProg(s);const bal=balance(s);return(
                  <div key={s.id} className="kanban-card" draggable
                    onDragStart={e=>{setDragId(s.id);e.dataTransfer.effectAllowed="move";}}
                    onDragEnd={()=>{setDragId(null);setOverCol(null);}}
                    onClick={()=>openStudent(s)}
                    style={{opacity:dragId===s.id?.5:1}}>
                    <div style={{display:"flex",alignItems:"center",gap:9,marginBottom:7}}>
                      <AvatarImg s={s} size={30} fontSize={10}/>
                      <div style={{flex:1,minWidth:0}}>
                        <div style={{fontWeight:700,fontSize:12.5,color:"var(--text)",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{s.fullName}</div>
                        <div style={{fontSize:10.5,color:"var(--text3)",marginTop:1}}>{s.courseType} · {s.transmission}</div>
                      </div>
                    </div>
                    {bal>0&&<div style={{fontSize:11,color:"var(--red)",fontWeight:700,marginBottom:4}}>💰 {fmtCur(bal)}</div>}
                    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginTop:4}}>
                      <span style={{fontSize:10.5,fontWeight:700,color:prog>=75?"var(--green)":"var(--yellow)"}}>{prog}%</span>
                      <div style={{width:64,height:4,background:"var(--border)",borderRadius:2,overflow:"hidden"}}>
                        <div style={{height:"100%",background:prog>=75?"var(--green)":"var(--yellow)",width:`${prog}%`,borderRadius:2}}/>
                      </div>
                    </div>
                  </div>
                );})}
                {colStudents.length===0&&(
                  <div style={{textAlign:"center",color:"var(--text3)",fontSize:12,padding:"24px 0",opacity:.4,border:`2px dashed var(--border)`,borderRadius:10,margin:"4px 0"}}>
                    Sin estudiantes
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── DASHBOARD ────────────────────────────────────────────────────────────────
function DashPage({students,openStudent,setWizard,dmvCandidates,totalBalance,dmvSoon,activeCount,activityLog}) {
  const {dark,lang,t} = useApp();
  const graduated=students.filter(s=>s.status==="Passed / Graduated").length;
  const retests=students.filter(s=>s.status==="Requires Re-Test").length;
  const docsP=students.filter(s=>missingDocs(s).length>0&&s.status!=="Passed / Graduated").length;
  const monthRev=students.reduce((a,s)=>a+(s.payments||[]).filter(p=>p.date?.startsWith(today.slice(0,7))).reduce((x,p)=>x+p.amount,0),0);
  const totalRev=students.reduce((a,s)=>a+totalPaid(s),0);
  const dmvRate=(()=>{const pass=students.filter(s=>s.dmv?.result==="Passed").length;const fail=students.filter(s=>s.dmv?.result==="Failed").length;return pass+fail>0?Math.round(pass/(pass+fail)*100):0;})();
  const byStatus=Object.entries(STATUS_META).map(([k,v])=>({label:v.label,n:students.filter(s=>s.status===k).length,color:v.color,icon:v.icon})).filter(x=>x.n>0);
  const maxN=Math.max(...byStatus.map(x=>x.n),1);

  return(
    <div className="pg">
      {/* HEADER */}
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:28,flexWrap:"wrap",gap:12}}>
        <div>
          <h1 style={{fontSize:28,fontWeight:800,color:"var(--text)",fontFamily:"'Inter',sans-serif",letterSpacing:"-.02em"}}>Dashboard</h1>
          <p style={{color:"var(--text3)",fontSize:13.5,marginTop:3,textTransform:"capitalize"}}>{new Date().toLocaleDateString("es-US",{weekday:"long",year:"numeric",month:"long",day:"numeric"})}</p>
        </div>
        <button className="btn bp blg" onClick={()=>setWizard(true)}><Ico n="plus" s={15}/>{lang==="es"?"Nuevo Estudiante":"New Student"}</button>
      </div>

      {/* KPI CARDS */}
      <div className="g4" style={{marginBottom:20}}>
        {[
          {l:"Estudiantes Activos", v:activeCount, sub:`${students.length} total`, clr:"#2563eb", icon:""},
          {l:"Balance Pendiente",   v:fmtCur(totalBalance), sub:`${students.filter(s=>balance(s)>0).length} con deuda`, clr:"#dc2626", icon:""},
          {l:"DMV Esta Semana",     v:dmvSoon.length, sub:dmvSoon[0]?fmtDate(dmvSoon[0].dmv.actualDate):"Sin citas", clr:"#0e7490", icon:""},
          {l:"Ingresos del Mes",    v:fmtCur(monthRev), sub:`Total: ${fmtCur(totalRev)}`, clr:"#16a34a", icon:""},
        ].map(({l,v,sub,clr,icon},i)=>(
          <div key={i} className="kpi" style={{"--kpi-clr":clr}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:12}}>
              <div style={{fontSize:10.5,fontWeight:700,color:"var(--text3)",textTransform:"uppercase",letterSpacing:".06em"}}>{l}</div>
              <div style={{fontSize:22,lineHeight:1}}>{icon}</div>
            </div>
            <div style={{fontSize:26,fontWeight:900,color:clr,fontFamily:"'Inter',sans-serif",letterSpacing:"-.02em",marginBottom:5}}>{v}</div>
            <div style={{fontSize:12,color:"var(--text3)"}}>{sub}</div>
          </div>
        ))}
      </div>

      {/* SECONDARY STATS */}
      <div className="g3" style={{marginBottom:20}}>
        {[["Graduados",graduated,"var(--green)",""],["Tasa DMV",`${dmvRate}%`,"var(--purple)",""],["Docs Pendientes",docsP,"var(--yellow)",""]].map(([l,v,c,icon],i)=>(
          <div key={i} className="card cs sh" style={{display:"flex",alignItems:"center",gap:16}}>
            <div style={{fontSize:34,lineHeight:1}}>{icon}</div>
            <div>
              <div style={{fontSize:10.5,fontWeight:700,color:"var(--text3)",textTransform:"uppercase",letterSpacing:".06em",marginBottom:4}}>{l}</div>
              <div style={{fontSize:28,fontWeight:900,color:c,fontFamily:"'Inter',sans-serif",letterSpacing:"-.02em"}}>{v}</div>
            </div>
          </div>
        ))}
      </div>

      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:20,marginBottom:20}}>
        {/* BAR CHART */}
        <div className="card cp sh">
          <div style={{fontWeight:700,fontSize:14,color:"var(--text)",marginBottom:16,display:"flex",alignItems:"center",gap:8}}><Ico n="chart" s={14} c="var(--accent)"/>Distribución por Estado</div>
          {byStatus.length===0?<div style={{color:"var(--text3)",fontSize:13,textAlign:"center",padding:"20px"}}>Sin datos</div>:byStatus.map(({label,n,color,icon})=>(
            <div key={label} style={{marginBottom:9}}>
              <div style={{display:"flex",justifyContent:"space-between",marginBottom:4,fontSize:12.5}}><span style={{color:"var(--text2)",fontWeight:500}}>{icon} {label}</span><span style={{fontWeight:700,color}}>{n}</span></div>
              <div style={{height:7,background:"var(--border)",borderRadius:4,overflow:"hidden"}}><div style={{height:"100%",background:color,borderRadius:4,width:`${(n/maxN)*100}%`,transition:"width .7s ease"}}/></div>
            </div>
          ))}
        </div>

        {/* ALERTS + ACTIVITY */}
        <div style={{display:"flex",flexDirection:"column",gap:14}}>
          <div className="card cp sh" style={{flex:1}}>
            <div style={{fontWeight:700,fontSize:13.5,color:"var(--text)",marginBottom:12,display:"flex",alignItems:"center",gap:7}}><Ico n="warn" s={13} c="var(--red)"/>Alertas Urgentes</div>
            <div style={{maxHeight:180,overflowY:"auto",display:"flex",flexDirection:"column",gap:5}}>
              {[...dmvSoon.filter(s=>balance(s)>0).map(s=>(
                <div key={s.id} className="al ar" style={{cursor:"pointer",padding:"8px 12px",fontSize:12.5}} onClick={()=>openStudent(s)}>
                  <Ico n="warn" s={11}/><span><b>{s.fullName}</b> · DMV {fmtDate(s.dmv.actualDate)} · Debe {fmtCur(balance(s))}</span>
                </div>
              )),
              ...dmvSoon.filter(s=>balance(s)===0).map(s=>(
                <div key={s.id} className="al ab" style={{cursor:"pointer",padding:"8px 12px",fontSize:12.5}} onClick={()=>openStudent(s)}>
                  <Ico n="cal" s={11}/><span><b>{s.fullName}</b> · DMV {fmtDate(s.dmv.actualDate)}</span>
                </div>
              )),
              ...dmvCandidates.slice(0,3).map(s=>(
                <div key={s.id} className="al agr" style={{cursor:"pointer",padding:"8px 12px",fontSize:12.5}} onClick={()=>openStudent(s)}>
                  <Ico n="check" s={11}/><span><b>{s.fullName}</b> · Listo para DMV</span>
                </div>
              ))]}
              {dmvSoon.length===0&&dmvCandidates.length===0&&<div style={{color:"var(--text3)",fontSize:13,textAlign:"center",padding:"16px 0"}}>✓ Sin alertas activas</div>}
            </div>
          </div>
        </div>
      </div>

      {/* RECENT STUDENTS TABLE */}
      <div className="card sh">
        <div style={{padding:"13px 20px",borderBottom:"1px solid var(--border2)",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
          <div style={{fontWeight:700,fontSize:13.5,color:"var(--text)"}}>Estudiantes Recientes</div>
          <span style={{fontSize:12,color:"var(--text3)"}}>{students.length} registros</span>
        </div>
        <table className="tbl">
          <thead><tr><th>Estudiante</th><th>Clase</th><th>Estado</th><th>Progreso</th><th>Balance</th><th>DMV</th></tr></thead>
          <tbody>
            {students.length===0?(
              <tr><td colSpan={6} style={{textAlign:"center",color:"var(--text3)",padding:"40px"}}>
                <div style={{fontSize:40,marginBottom:10}}>🚛</div>
                <div style={{fontWeight:600,marginBottom:6}}>{lang==="es"?"Sin estudiantes registrados":"No students registered"}</div>
                <button className="btn bp bsm" onClick={()=>setWizard(true)}>Registrar primer estudiante</button>
              </td></tr>
            ):students.slice(0,8).map(s=>{const bal=balance(s);const sm=STATUS_META[s.status]||STATUS_META["Inactive"];const prog=avgProg(s);return(
              <tr key={s.id} onClick={()=>openStudent(s)}>
                <td><div style={{display:"flex",alignItems:"center",gap:10}}><AvatarImg s={s} size={34} fontSize={12}/><div><div style={{fontWeight:600,color:"var(--text)",fontSize:13.5}}>{s.fullName}</div><div style={{fontSize:11.5,color:"var(--text3)"}}>{s.phone}</div></div></div></td>
                <td style={{fontSize:12.5,color:"var(--text2)"}}>{s.courseType}<br/><span style={{fontSize:11,color:"var(--text3)"}}>{s.transmission}</span></td>
                <td><span className="badge" style={{background:sm.bg,color:sm.color}}>{sm.icon} {sm.label}</span></td>
                <td style={{minWidth:110}}><div style={{fontSize:11,color:"var(--text3)",marginBottom:3,fontWeight:600}}>{prog}%</div><div className="pt" style={{width:88}}><div className="pf" style={{width:`${prog}%`,background:prog>=75?"var(--green)":"var(--yellow)"}}/></div></td>
                <td style={{fontWeight:700,color:bal>0?"var(--red)":"var(--green)",fontFamily:"'Inter',sans-serif",fontSize:13}}>{fmtCur(bal)}</td>
                <td style={{fontSize:12,color:"var(--text3)"}}>{s.dmv?.actualDate?fmtDate(s.dmv.actualDate):"—"}</td>
              </tr>
            );})}
          </tbody>
        </table>
      </div>
    </div>
  );
}


// ─── STUDENTS PAGE ────────────────────────────────────────────────────────────
function StudentsPage({students,openStudent,setWizard,sortCol,setSortCol}) {
  const {dark,lang,t} = useApp();
  const [search,setSearch]=useState(""); const [stF,setStF]=useState("all"); const [clF,setClF]=useState("all"); const [trF,setTrF]=useState("all"); const [page,setPage]=useState(1); const PER=25;

  const doSort=(col)=>{setSortCol(p=>p.col===col?{col,dir:p.dir==="asc"?"desc":"asc"}:{col,dir:"asc"});};

  const filtered=useMemo(()=>{
    let r=students.filter(s=>{
      const q=search.toLowerCase();
      return(!q||s.fullName.toLowerCase().includes(q)||(s.phone||"").includes(q)||(s.licenseNumber||"").toLowerCase().includes(q)||(s.email||"").toLowerCase().includes(q))&&
        (stF==="all"||s.status===stF)&&(clF==="all"||s.courseType===clF)&&(trF==="all"||s.transmission===trF);
    });
    r=[...r].sort((a,b)=>{
      let av=a[sortCol.col]||"", bv=b[sortCol.col]||"";
      if(sortCol.col==="balance"){av=balance(a);bv=balance(b);}
      if(sortCol.col==="avgProg"){av=avgProg(a);bv=avgProg(b);}
      if(typeof av==="number") return sortCol.dir==="asc"?av-bv:bv-av;
      return sortCol.dir==="asc"?String(av).localeCompare(String(bv)):String(bv).localeCompare(String(av));
    });
    return r;
  },[students,search,stF,clF,trF,sortCol]);

  const pages=Math.ceil(filtered.length/PER);
  const paged=filtered.slice((page-1)*PER,page*PER);

  const SortTh=({col,label})=>(
    <th onClick={()=>doSort(col)} style={{cursor:"pointer",userSelect:"none"}}>
      <span style={{display:"flex",alignItems:"center",gap:4}}>
        {label}
        {sortCol.col===col&&<span style={{fontSize:9}}>{sortCol.dir==="asc"?"▲":"▼"}</span>}
      </span>
    </th>
  );

  const exportCSV=()=>{
    const h=["Nombre","Teléfono","Email","Clase","Transmisión","Estado","Pre-Trip","Maniobras","Manejo","Precio","Pagado","Balance","DMV Fecha","DMV Resultado"];
    const rows=filtered.map(s=>[s.fullName,s.phone||"",s.email||"",s.courseType,s.transmission,s.status,s.progress.preTrip,s.progress.maneuvers,s.progress.roadDriving,s.totalPrice,totalPaid(s),balance(s),s.dmv?.actualDate||"",s.dmv?.result||""].join(","));
    const a=document.createElement("a");a.href=URL.createObjectURL(new Blob([[h.join(","),...rows].join("\n")],{type:"text/csv"}));a.download=`FTDS_Estudiantes_${today}.csv`;a.click();
  };

  return(
    <div className="pg">
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20}}>
        <div>
          <h1 style={{fontSize:26,fontWeight:800,color:"var(--text)",fontFamily:"'Inter',sans-serif",letterSpacing:"-.02em"}}>Estudiantes</h1>
          <p style={{color:"var(--text3)",fontSize:13.5,marginTop:3}}>{filtered.length} de {students.length} registros</p>
        </div>
        <div style={{display:"flex",gap:8}}>
          <button className="btn bo" onClick={exportCSV}><Ico n="download" s={13}/>CSV</button>
          <button className="btn bp blg" onClick={()=>setWizard(true)}><Ico n="plus" s={15}/>{lang==="es"?"Nuevo Estudiante":"New Student"}</button>
        </div>
      </div>

      {/* FILTERS */}
      <div className="card cs sh" style={{marginBottom:12}}>
        <div style={{display:"flex",gap:10,flexWrap:"wrap",alignItems:"center"}}>
          <div className="sw" style={{flex:1,minWidth:200}}>
            <Ico n="search" s={14}/>
            <input className="inp si" placeholder="Buscar por nombre, teléfono, licencia, email..." value={search} onChange={e=>{setSearch(e.target.value);setPage(1);}}/>
          </div>
          <select className="sel" style={{width:195}} value={stF} onChange={e=>{setStF(e.target.value);setPage(1);}}>
            <option value="all">Todos los estados</option>
            {Object.entries(STATUS_META).map(([k,v])=><option key={k} value={k}>{v.icon} {v.label}</option>)}
          </select>
          <select className="sel" style={{width:130}} value={clF} onChange={e=>{setClF(e.target.value);setPage(1);}}>
            <option value="all">Todas las clases</option>
            <option>Class A</option><option>Class B</option><option>Class C Passenger</option>
          </select>
          <select className="sel" style={{width:140}} value={trF} onChange={e=>{setTrF(e.target.value);setPage(1);}}>
            <option value="all">Transmisión</option>
            <option>Manual</option><option>Automatic</option>
          </select>
          {(search||stF!=="all"||clF!=="all"||trF!=="all")&&<button className="btn bo bsm" onClick={()=>{setSearch("");setStF("all");setClF("all");setTrF("all");setPage(1);}}>✕ Limpiar</button>}
        </div>
      </div>

      <div className="card sh" style={{marginBottom:12}}>
        <table className="tbl">
          <thead><tr>
            <SortTh col="fullName" label="Estudiante"/>
            <th>Clase</th>
            <SortTh col="status" label="Estado"/>
            <SortTh col="avgProg" label="Pre-trip"/>
            <th>Maniobras</th><th>Manejo</th>
            <SortTh col="balance" label="Balance"/>
            <th>DMV</th><th>Docs</th>
          </tr></thead>
          <tbody>
            {paged.length===0?(
              <tr><td colSpan={9} style={{textAlign:"center",color:"var(--text3)",padding:"36px"}}>
                {students.length===0?"Sin estudiantes registrados.":"Sin resultados para esta búsqueda."}
              </td></tr>
            ):paged.map(s=>{
              const bal=balance(s);const sm=STATUS_META[s.status]||STATUS_META["Inactive"];const md=missingDocs(s);
              return(
                <tr key={s.id} onClick={()=>openStudent(s)}>
                  <td><div style={{display:"flex",alignItems:"center",gap:10}}><AvatarImg s={s} size={36} fontSize={12}/><div><div style={{fontWeight:600,color:"var(--text)",fontSize:13.5}}>{s.fullName}</div><div style={{fontSize:11.5,color:"var(--text3)"}}>{s.phone}</div></div></div></td>
                  <td style={{fontSize:12.5,color:"var(--text2)"}}>{s.courseType}<br/><span style={{fontSize:11,color:"var(--text3)"}}>{s.transmission}</span></td>
                  <td><span className="badge" style={{background:sm.bg,color:sm.color,whiteSpace:"nowrap"}}>{sm.icon} {sm.label}</span></td>
                  {[s.progress.preTrip,s.progress.maneuvers,s.progress.roadDriving].map((v,i)=>(
                    <td key={i}><div style={{fontSize:12,fontWeight:700,color:v>=75?"var(--green)":"var(--yellow)",marginBottom:3}}>{v}%</div><div className="pt" style={{width:68}}><div className="pf" style={{width:`${v}%`,background:v>=75?"var(--green)":"var(--yellow)"}}/></div></td>
                  ))}
                  <td style={{fontWeight:700,color:bal>0?"var(--red)":"var(--green)",fontFamily:"'Inter',sans-serif",fontSize:13.5}}>{fmtCur(bal)}</td>
                  <td style={{fontSize:12,color:"var(--text3)",whiteSpace:"nowrap"}}>{s.dmv?.actualDate?fmtDate(s.dmv.actualDate):"—"}</td>
                  <td>{md.length===0?<span style={{color:"var(--green)",fontSize:14}}>✓</span>:<span style={{color:"var(--yellow)",fontSize:12,fontWeight:700}}>{md.length} falt.</span>}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {pages>1&&<div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
        <div style={{fontSize:13,color:"var(--text3)"}}>Mostrando {(page-1)*PER+1}–{Math.min(page*PER,filtered.length)} de {filtered.length}</div>
        <div style={{display:"flex",gap:6}}>
          <button className="btn bo bsm" disabled={page===1} onClick={()=>setPage(p=>p-1)}><Ico n="back" s={12}/> Ant.</button>
          {Array.from({length:Math.min(pages,7)},(_,i)=>{const pg=page>4&&pages>7?page-3+i:i+1;if(pg>pages)return null;return<button key={pg} className={`btn bsm ${pg===page?"bp":"bo"}`} onClick={()=>setPage(pg)}>{pg}</button>;}).filter(Boolean)}
          <button className="btn bo bsm" disabled={page===pages} onClick={()=>setPage(p=>p+1)}>Sig. <Ico n="next" s={12}/></button>
        </div>
      </div>}
    </div>
  );
}


// ─── DETAIL PAGE ──────────────────────────────────────────────────────────────
function DetailPage({s,updateStudent,deleteStudent,goBack,sTab,setSTab,perms,addToast,addNotif}) {
  const {dark,lang,t} = useApp();
  const bal=balance(s); const md=missingDocs(s); const cand=isDMVReady(s);
  const sm=STATUS_META[s.status]||STATUS_META["Inactive"];
  const [editName,setEditName]=useState(false); const [nameVal,setNameVal]=useState(s.fullName);
  const [editStatus,setEditStatus]=useState(false);
  const [confirmDelete,setConfirmDelete]=useState(false);

  const saveName=()=>{if(nameVal.trim()){updateStudent({...s,fullName:nameVal.trim()});}setEditName(false);};
  const tabs=[
    ["overview",lang==="es"?"Resumen":"Overview"],["progress",lang==="es"?"Progreso":"Progress"],["documents",lang==="es"?"Documentos":"Documents"],
    ["dmv","DMV"],["attendance",lang==="es"?"Asistencia":"Attendance"],["notes",lang==="es"?"Notas":"Notes"],
    ...(perms.canPay?[["payments",lang==="es"?"Pagos":"Payments"]]:[] ),
    ["report",lang==="es"?"Reporte":"Report"],
  ];

  return(
    <div className="pg">
      {/* HEADER */}
      <div style={{display:"flex",alignItems:"flex-start",gap:16,marginBottom:20,flexWrap:"wrap"}}>
        <button className="btn bo bsm" onClick={goBack}><Ico n="back" s={13}/>Estudiantes</button>
        <div style={{flex:1,display:"flex",alignItems:"center",gap:16}}>
          {s.profilePhoto?(
            <img src={s.profilePhoto} alt="Perfil" style={{width:56,height:56,borderRadius:"50%",objectFit:"cover",border:"2px solid var(--accent)",flexShrink:0}}/>
          ):(
            <div className="av" style={{width:56,height:56,fontSize:19}}>{getInit(s.fullName)}</div>
          )}
          <div style={{flex:1}}>
            {editName?(
              <div style={{display:"flex",alignItems:"center",gap:8}}>
                <input className="inp" style={{fontSize:18,fontWeight:700,padding:"7px 13px",maxWidth:300}} value={nameVal} onChange={e=>setNameVal(e.target.value)} onKeyDown={e=>{if(e.key==="Enter")saveName();if(e.key==="Escape")setEditName(false);}} autoFocus/>
                <button className="btn bp bsm" onClick={saveName}>✓</button>
                <button className="btn bo bsm" onClick={()=>setEditName(false)}>✕</button>
              </div>
            ):(
              <div style={{display:"flex",alignItems:"center",gap:8}}>
                <h1 style={{fontSize:22,fontWeight:800,color:"var(--text)",fontFamily:"'Inter',sans-serif"}}>{s.fullName}</h1>
                <button className="btn bgh" style={{padding:"5px 8px"}} onClick={()=>{setNameVal(s.fullName);setEditName(true);}}><Ico n="edit" s={14}/></button>
              </div>
            )}
            <div style={{display:"flex",gap:8,alignItems:"center",marginTop:5,flexWrap:"wrap"}}>
              {editStatus?(
                <select className="sel" style={{width:210,fontSize:12}} value={s.status} onChange={e=>{updateStudent({...s,status:e.target.value});setEditStatus(false);}}>
                  {Object.entries(STATUS_META).map(([k,v])=><option key={k} value={k}>{v.icon} {v.label}</option>)}
                </select>
              ):(
                <span className="badge" style={{background:sm.bg,color:sm.color,cursor:"pointer"}} onClick={()=>setEditStatus(true)}>{sm.icon} {sm.label} ✎</span>
              )}
              <span style={{fontSize:12.5,color:"var(--text3)"}}>{s.courseType} · {s.transmission} · {s.schedule||"Regular"}</span>
            </div>
          </div>
        </div>
        <div style={{display:"flex",gap:8,alignItems:"center",flexWrap:"wrap"}}>
          <button className="btn bo bsm" style={{color:"var(--accent)",borderColor:"var(--accent)"}} onClick={()=>genStudentPDF(s)}><Ico n="pdf" s={13}/>PDF</button>
          <button className="btn bo bsm" style={{color:"#7c3aed",borderColor:"#7c3aed"}} onClick={()=>genContractPDF(s)}><Ico n="contract" s={13}/>Contrato</button>
          {s.phone&&perms.canMessages&&<button className="wa-btn" style={{padding:"7px 14px"}} onClick={()=>openWA(s.phone,WA_TMPL.payment_reminder(s,bal))}><WaIcon/>WhatsApp</button>}
          {perms.canDelete&&<button className="btn bsm" style={{background:"var(--red)",color:"#fff",border:"none"}} onClick={()=>setConfirmDelete(true)}><Ico n="trash" s={12}/>Archivar</button>}
          <div style={{textAlign:"right",background:bal>0?"rgba(220,38,38,.1)":"rgba(22,163,74,.1)",padding:"10px 16px",borderRadius:12,border:`1px solid ${bal>0?"rgba(220,38,38,.2)":"rgba(22,163,74,.2)"}`}}>
            <div style={{fontSize:20,fontWeight:800,color:bal>0?"var(--red)":"var(--green)",fontFamily:"'Inter',sans-serif"}}>{fmtCur(bal)}</div>
            <div style={{fontSize:10.5,color:"var(--text3)"}}>balance</div>
          </div>
        </div>
      </div>

      {/* ALERTS */}
      {bal>0&&s.dmv?.actualDate&&(new Date(s.dmv.actualDate)-new Date(today))/86400000<=7&&<div className="al ar" style={{marginBottom:10}}><Ico n="warn" s={14}/><span><b>URGENTE:</b> Examen DMV el {fmtDate(s.dmv.actualDate)} con balance pendiente de {fmtCur(bal)}.</span></div>}
      {md.length>0&&<div className="al ay" style={{marginBottom:10}}><Ico n="warn" s={13}/><span><b>Documentos faltantes:</b> {md.join(", ")}</span></div>}
      {cand&&md.length===0&&bal===0&&!["DMV Scheduled","Passed / Graduated"].includes(s.status)&&<div className="al agr" style={{marginBottom:10}}><Ico n="check" s={13}/><span><b>✓ Listo para DMV.</b> Fecha sugerida: {fmtDate(addBizDays(today,13))}</span></div>}

      {/* TABS */}
      <div className="tabs" style={{marginBottom:18}}>
        {tabs.map(([id,lbl])=><button key={id} className={`tab${sTab===id?" on":""}`} onClick={()=>setSTab(id)}>{lbl}</button>)}
      </div>

      {sTab==="overview"   && <OverviewTab   s={s}/>}
      {sTab==="progress"   && <ProgressTab   s={s} updateStudent={updateStudent} canEdit={perms.canProg}/>}
      {sTab==="documents"  && <DocsTab       s={s} updateStudent={updateStudent} perms={perms}/>}
      {sTab==="dmv"        && <DmvTab        s={s} updateStudent={updateStudent} addToast={addToast} addNotif={addNotif} perms={perms}/>}
      {sTab==="attendance" && <AttTab        s={s} updateStudent={updateStudent}/>}
      {sTab==="notes"      && <NotesTab      s={s} updateStudent={updateStudent}/>}
      {sTab==="payments"   && perms.canPay && <PayTab s={s} updateStudent={updateStudent} addToast={addToast} addNotif={addNotif} perms={perms}/>}
      {sTab==="report"     && <ReportTab     s={s}/>}

      {confirmDelete&&<div className="ov"><div className="md md-sm" style={{textAlign:"center"}}>
        <div style={{fontSize:44,marginBottom:12}}>⚠️</div>
        <div style={{fontWeight:800,fontSize:19,color:"var(--text)",marginBottom:8}}>Archivar Estudiante</div>
        <div style={{color:"var(--text3)",fontSize:13.5,marginBottom:22,lineHeight:1.6}}>¿Seguro que deseas archivar a <b>{s.fullName}</b>?<br/>Sus datos se eliminarán del sistema activo.</div>
        <div style={{display:"flex",gap:10}}>
          <button className="btn bo" style={{flex:1}} onClick={()=>setConfirmDelete(false)}>{lang==="es"?"Cancelar":"Cancel"}</button>
          <button className="btn br" style={{flex:1}} onClick={()=>deleteStudent(s.id)}>Sí, Archivar</button>
        </div>
      </div></div>}
    </div>
  );
}

// ─── OVERVIEW TAB ─────────────────────────────────────────────────────────────
function OverviewTab({s}) {
  const {dark,lang,t} = useApp();
  const bal=balance(s); const prog=avgProg(s);
  const docs=s.documents||{}; const allDocs=Object.values(docs).every(Boolean);
  const steps=[
    {label:"Contrato",    date:s.contractDate,    done:!!s.contractDate,   icon:"📋"},
    {label:"Inicio",      date:s.courseStartDate,  done:!!s.courseStartDate,icon:""},
    {label:"Documentos",  date:"",                done:allDocs,            icon:""},
    {label:"Candidato",   date:"",                done:isDMVReady(s),      icon:""},
    {label:"Cita DMV",    date:s.dmv?.actualDate,  done:!!s.dmv?.actualDate,icon:""},
    {label:"Graduado",    date:"",                done:s.status==="Passed / Graduated",icon:""},
  ];

  return(<div>
    {/* TIMELINE */}
    <div className="card cp sh" style={{marginBottom:14}}>
      <div className="sec">Línea de Tiempo</div>
      <div style={{display:"flex",alignItems:"center",overflowX:"auto",padding:"8px 0"}}>
        {steps.map(({label,date,done,icon},i)=>(
          <div key={label} style={{display:"flex",alignItems:"center",flex:1,minWidth:90}}>
            <div style={{textAlign:"center",flex:1}}>
              <div style={{width:40,height:40,borderRadius:"50%",background:done?"linear-gradient(135deg,#16a34a,#15803d)":"var(--surface2)",border:`2px solid ${done?"#16a34a":"var(--border)"}`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:17,margin:"0 auto 7px",boxShadow:done?"0 3px 12px rgba(22,163,74,.3)":"none"}}>{icon}</div>
              <div style={{fontSize:11,fontWeight:600,color:done?"var(--green)":"var(--text3)",lineHeight:1.25}}>{label}</div>
              {date&&<div style={{fontSize:9.5,color:"var(--text3)",marginTop:2}}>{fmtDate(date)}</div>}
            </div>
            {i<steps.length-1&&<div style={{height:2,flex:1,background:done&&steps[i+1]?.done?"var(--green)":"var(--border)",minWidth:20,margin:"0 6px",marginBottom:22}}/>}
          </div>
        ))}
      </div>
    </div>

    <div className="g2">
      <div className="card cp sh">
        <div className="sec">Datos Personales</div>
        {s.profilePhoto&&<div style={{textAlign:"center",marginBottom:14}}>
          <img src={s.profilePhoto} alt="Perfil" style={{width:80,height:80,borderRadius:"50%",objectFit:"cover",border:"3px solid var(--accent)",boxShadow:"0 4px 16px rgba(37,99,235,.25)"}}/>
        </div>}
        {[["Nombre",s.fullName||"—"],["Teléfono",s.phone||"—"],["Email",s.email||"—"],["Fecha Nac.",fmtDate(s.dob)],["Dirección",s.address||"—"],["Licencia #",s.licenseNumber||"—"],["Vence Licencia",fmtDate(s.licenseExpiry)]].map(([k,v])=>(
          <div key={k} style={{display:"flex",justifyContent:"space-between",padding:"8px 0",borderBottom:"1px solid var(--border2)",fontSize:13.5}}>
            <span style={{color:"var(--text3)",fontWeight:500}}>{k}</span>
            <span style={{fontWeight:600,color:"var(--text)",maxWidth:"58%",textAlign:"right"}}>{v}</span>
          </div>
        ))}
      </div>
      <div style={{display:"flex",flexDirection:"column",gap:14}}>
        <div className="card cp sh">
          <div className="sec">Curso & Finanzas</div>
          {[["Clase CDL",s.courseType],["Transmisión",s.transmission],["Horario",s.schedule||"Regular"],["Inicio",fmtDate(s.courseStartDate)],["Precio Total",fmtCur(s.totalPrice)],["Pagado",fmtCur(totalPaid(s))],["Balance",fmtCur(bal)]].map(([k,v])=>(
            <div key={k} style={{display:"flex",justifyContent:"space-between",padding:"7px 0",borderBottom:"1px solid var(--border2)",fontSize:13.5}}>
              <span style={{color:"var(--text3)",fontWeight:500}}>{k}</span>
              <span style={{fontWeight:700,color:k==="Balance"?(bal>0?"var(--red)":"var(--green)"):"var(--text)"}}>{v}</span>
            </div>
          ))}
        </div>
        <div className="card cp sh">
          <div className="sec">Progreso General</div>
          {[["Pre-Trip",s.progress.preTrip,"#2563eb"],["Maniobras",s.progress.maneuvers,"#7c3aed"],["Manejo en Ruta",s.progress.roadDriving,"#0e7490"]].map(([k,v,c])=>(
            <div key={k} style={{marginBottom:12}}>
              <div style={{display:"flex",justifyContent:"space-between",fontSize:13,marginBottom:5}}><span style={{color:"var(--text2)",fontWeight:500}}>{k}</span><span style={{fontWeight:700,color:v>=75?"var(--green)":"var(--yellow)"}}>{v}%</span></div>
              <div className="pt ptlg"><div className="pf" style={{width:`${v}%`,background:v>=75?"var(--green)":"var(--yellow)"}}/></div>
            </div>
          ))}
          <div style={{marginTop:8,padding:"9px 13px",background:prog>=75?"rgba(22,163,74,.1)":"rgba(180,83,9,.1)",borderRadius:9,border:`1px solid ${prog>=75?"rgba(22,163,74,.2)":"rgba(180,83,9,.2)"}`,fontSize:12.5,fontWeight:700,color:prog>=75?"var(--green)":"var(--yellow)"}}>
            {prog>=75?"Candidato para examen DMV":"En entrenamiento"} · Promedio: {prog}%
          </div>
        </div>
      </div>
    </div>
  </div>);
}


// ─── PROGRESS TAB ─────────────────────────────────────────────────────────────
function ProgressTab({s,updateStudent,canEdit}) {
  const {dark,lang,t} = useApp();
  const [editing,setEditing]=useState(false);
  const [ptV,setPtV]=useState({...s.progress.pretripCats});
  const [manV,setManV]=useState({...s.progress.maneuverCats});
  const [rdV,setRdV]=useState(s.progress.roadDriving);
  const [showRegister,setShowRegister]=useState(false);
  const ptScore=calcPT(ptV); const manScore=calcMan(manV);

  const save=()=>{
    updateStudent({...s,progress:{...s.progress,pretripCats:{...ptV},maneuverCats:{...manV},roadDriving:rdV,
      history:[...(s.progress.history||[]),{date:today,by:"Admin",ptScore,manScore,rdScore:rdV}]}});
    setEditing(false);
  };

  return(<div>
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20,flexWrap:"wrap",gap:10}}>
      <h2 style={{fontSize:18,fontWeight:800,color:"var(--text)",fontFamily:"'Inter',sans-serif"}}>Progreso de Entrenamiento</h2>
      <div style={{display:"flex",gap:8}}>
        <button className="btn bo" style={{color:"var(--purple)",borderColor:"var(--purple)"}} onClick={()=>setShowRegister(true)}><Ico n="check" s={14}/>Pre-Trip Register</button>
        {canEdit&&(!editing?<button className="btn bo" onClick={()=>setEditing(true)}><Ico n="edit" s={14}/>Editar %</button>:<div style={{display:"flex",gap:8}}><button className="btn bo" onClick={()=>setEditing(false)}>{lang==="es"?"Cancelar":"Cancel"}</button><button className="btn bp" onClick={save}><Ico n="check" s={13}/>{lang==="es"?"Guardar":"Save"}</button></div>)}
      </div>
    </div>
    {[{title:"Pre-Trip Inspection",cats:PRETRIP_CATS,vals:ptV,setVals:setPtV,score:editing?ptScore:s.progress.preTrip,color:"#2563eb"},
      {title:"Maniobras / Backing",cats:MANEUVER_CATS,vals:manV,setVals:setManV,score:editing?manScore:s.progress.maneuvers,color:"#7c3aed"}].map(({title,cats,vals,setVals,score,color})=>(
      <div key={title} className="card cp sh" style={{marginBottom:14}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
          <div style={{fontWeight:700,fontSize:16,color:"var(--text)"}}>{title}</div>
          <div style={{fontFamily:"'Inter',sans-serif",fontSize:30,fontWeight:900,color:score>=75?"var(--green)":"var(--yellow)"}}>{score}%</div>
        </div>
        <div className="pt ptlg" style={{marginBottom:16}}><div className="pf" style={{width:`${score}%`,background:score>=75?"var(--green)":"var(--yellow)"}}/></div>
        {cats.map(cat=>{const v=vals[cat.id]||0;return(
          <div key={cat.id} className="cat-row">
            <div style={{width:185,fontSize:13,fontWeight:600,color:"var(--text)",flexShrink:0}}>{cat.label}</div>
            <div style={{fontSize:11,color:"var(--text3)",width:32,flexShrink:0,textAlign:"right",fontWeight:700}}>{cat.weight}%</div>
            {editing?<input type="range" min="0" max="100" value={v} onChange={e=>setVals(p=>({...p,[cat.id]:+e.target.value}))} style={{flex:1,accentColor:color,cursor:"pointer"}}/>:<div className="pt" style={{flex:1}}><div className="pf" style={{width:`${v}%`,background:v>=75?"var(--green)":"var(--yellow)"}}/></div>}
            {editing?<input type="number" min="0" max="100" value={v} onChange={e=>setVals(p=>({...p,[cat.id]:Math.min(100,Math.max(0,+e.target.value))}))} style={{width:54,background:"var(--surface2)",border:"1.5px solid var(--border)",borderRadius:7,padding:"4px 7px",fontSize:12.5,textAlign:"center",color:"var(--text)",fontFamily:"inherit"}}/>:<span style={{fontSize:12.5,fontWeight:700,color:v>=75?"var(--green)":"var(--yellow)",minWidth:36,textAlign:"right"}}>{v}%</span>}
          </div>
        );})}
      </div>
    ))}
    <div className="card cp sh" style={{marginBottom:14}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
        <div style={{fontWeight:700,fontSize:16,color:"var(--text)"}}>Manejo en Ruta</div>
        <div style={{fontFamily:"'Inter',sans-serif",fontSize:30,fontWeight:900,color:(editing?rdV:s.progress.roadDriving)>=75?"var(--green)":"var(--yellow)"}}>{editing?rdV:s.progress.roadDriving}%</div>
      </div>
      <div className="pt ptlg" style={{marginBottom:12}}><div className="pf" style={{width:`${editing?rdV:s.progress.roadDriving}%`,background:(editing?rdV:s.progress.roadDriving)>=75?"var(--green)":"var(--yellow)"}}/></div>
      {editing&&<input type="range" min="0" max="100" value={rdV} onChange={e=>setRdV(+e.target.value)} style={{width:"100%",accentColor:"#0e7490",cursor:"pointer"}}/>}
    </div>
    {isDMVReady(s)&&<div className="al agr"><Ico n="award" s={14}/><span><b>¡Candidato para examen DMV!</b> Pre-trip {s.progress.preTrip}% · Maniobras {s.progress.maneuvers}% · Manejo {s.progress.roadDriving}% — todos ≥75%.</span></div>}
    {showRegister&&<PreTripSessionModal s={s} updateStudent={u=>{updateStudent(u);setShowRegister(false);}} onClose={()=>setShowRegister(false)}/>}
    {(s.progress.history||[]).length>0&&<div className="card cp sh" style={{marginTop:14}}>
      <div className="sec">Historial de Sesiones</div>
      <table className="tbl">
        <thead><tr><th>Fecha</th><th>Instructor</th><th>Pre-Trip</th><th>Maniobras</th><th>Manejo</th></tr></thead>
        <tbody>
          {[...(s.progress.history||[])].reverse().map((h,i)=>(
            <tr key={i}>
              <td style={{fontSize:12.5}}>{fmtDate(h.date)}</td>
              <td style={{fontSize:12.5,color:"var(--text3)"}}>{h.by||"Admin"}</td>
              {[h.ptScore,h.manScore,h.rdScore].map((v,j)=>(
                <td key={j}><span style={{fontWeight:700,color:v>=75?"var(--green)":"var(--yellow)",fontSize:13}}>{v}%</span></td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>}
  </div>);
}

// ─── PAY TAB ──────────────────────────────────────────────────────────────────
function PayTab({s,updateStudent,addToast,addNotif,perms}) {
  const {dark,lang,t} = useApp();
  const [showAdd,setShowAdd]=useState(false);
  const [form,setForm]=useState({date:today,amount:"",method:"Cash",note:""});
  const [activeSection,setActiveSection]=useState("history");
  const bal=balance(s);

  const addPayment=()=>{
    if(!form.amount||+form.amount<=0){addToast("Ingresa un monto válido.","warning");return;}
    const payment={id:Date.now(),date:form.date,amount:+form.amount,method:form.method,registeredBy:"Admin",note:form.note};
    const updated={...s,payments:[...(s.payments||[]),payment]};
    updateStudent(updated);
    addToast(`Pago de ${fmtCur(+form.amount)} registrado.`,"success");
    addNotif("Pago Registrado",`${s.fullName} · ${fmtCur(+form.amount)} · ${form.method}`,"success");
    setTimeout(()=>genReceiptPDF(updated,payment),400);
    setShowAdd(false); setForm({date:today,amount:"",method:"Cash",note:""});
  };

  return(<div>
    <div className="card cp sh">
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
        <div className="tabs" style={{padding:2}}>
          <button className={`tab${activeSection==="history"?" on":""}`} onClick={()=>setActiveSection("history")}>💰 Historial</button>
          <button className={`tab${activeSection==="schedule"?" on":""}`} onClick={()=>setActiveSection("schedule")}>📅 Plan de Pagos</button>
        </div>
        <div style={{display:"flex",gap:8}}>
          {perms.canMessages&&s.phone&&<button className="wa-btn" style={{padding:"7px 14px",fontSize:12}} onClick={()=>openWA(s.phone,WA_TMPL.payment_reminder(s,bal))}><WaIcon/>Recordatorio</button>}
          {activeSection==="history"&&<button className="btn bp bsm" onClick={()=>setShowAdd(true)}><Ico n="plus" s={13}/>{lang==="es"?"Registrar Pago":"Register Payment"}</button>}
        </div>
      </div>
      {/* RESUMEN FINANCIERO SIEMPRE VISIBLE */}
      <div className="g3" style={{background:"var(--surface2)",borderRadius:12,padding:16,marginBottom:18,border:"1px solid var(--border)"}}>
        {[["Precio Total",fmtCur(s.totalPrice),"var(--text)"],["Total Pagado",fmtCur(totalPaid(s)),"var(--green)"],["Balance Due",fmtCur(bal),bal>0?"var(--red)":"var(--green)"]].map(([k,v,col])=>(
          <div key={k}><div style={{fontSize:10.5,fontWeight:700,color:"var(--text3)",textTransform:"uppercase",letterSpacing:".06em",marginBottom:6}}>{k}</div><div style={{fontSize:24,fontWeight:900,color:col,fontFamily:"'Inter',sans-serif",letterSpacing:"-.02em"}}>{v}</div></div>
        ))}
      </div>
      {/* PLAN DE PAGOS */}
      {activeSection==="schedule"&&<PaymentScheduleEditor
        schedule={s.paymentSchedule||[]}
        onChange={sched=>updateStudent({...s,paymentSchedule:sched})}
        totalPrice={s.totalPrice}
        paid={totalPaid(s)}
      />}
      {activeSection==="history"&&(
        (s.payments||[]).length===0?(
          <div style={{color:"var(--text3)",fontSize:13,textAlign:"center",padding:"24px",background:"var(--surface2)",borderRadius:12}}>{lang==="es"?"Sin pagos registrados":"No payments registered"}</div>
        ):<div>{[...(s.payments||[])].reverse().map(p=>(
          <div key={p.id} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"13px 0",borderBottom:"1px solid var(--border2)"}}>
            <div>
              <div style={{fontWeight:800,color:"var(--green)",fontSize:16,fontFamily:"'Inter',sans-serif"}}>{fmtCur(p.amount)}</div>
              <div style={{fontSize:11.5,color:"var(--text3)",marginTop:2}}>{fmtDate(p.date)} · {p.method} · {p.registeredBy}</div>
              {p.note&&<div style={{fontSize:11,color:"var(--text3)",fontStyle:"italic",marginTop:1}}>{p.note}</div>}
            </div>
            <div style={{display:"flex",gap:8}}>
              <button className="btn bo bsm" onClick={()=>genReceiptPDF(s,p)}><Ico n="receipt" s={12}/>Recibo</button>
              <span style={{background:"rgba(22,163,74,.1)",color:"var(--green)",padding:"4px 12px",borderRadius:20,fontSize:11,fontWeight:700,border:"1px solid rgba(22,163,74,.2)"}}>✓ Pagado</span>
            </div>
          </div>
        ))}</div>
      )}
    </div>
    {showAdd&&<div className="ov"><div className="md">
      <div style={{fontWeight:800,fontSize:20,color:"var(--text)",marginBottom:20}}>{lang==="es"?"Registrar Pago":"Register Payment"}</div>
      <div style={{display:"grid",gap:14}}>
        <div><label className="lbl">Fecha</label><input type="date" className="inp" value={form.date} onChange={e=>setForm(p=>({...p,date:e.target.value}))}/></div>
        <div><label className="lbl">Monto ($) *</label><input type="number" className="inp" value={form.amount} onChange={e=>setForm(p=>({...p,amount:e.target.value}))} placeholder="0.00" autoFocus/></div>
        <div><label className="lbl">Método de Pago</label><select className="sel" value={form.method} onChange={e=>setForm(p=>({...p,method:e.target.value}))}><option>Cash</option><option>Zelle</option><option>Square</option><option>Check</option><option>Money Order</option></select></div>
        <div><label className="lbl">Nota (opcional)</label><input className="inp" value={form.note} onChange={e=>setForm(p=>({...p,note:e.target.value}))} placeholder="Ej: Pago inicial, cuota mensual..."/></div>
      </div>
      <div className="al ab" style={{marginTop:14}}><Ico n="receipt" s={13}/><span style={{fontSize:12.5}}>Se generará automáticamente un recibo PDF al guardar.</span></div>
      <div style={{display:"flex",gap:10,marginTop:22}}><button className="btn bo" style={{flex:1}} onClick={()=>setShowAdd(false)}>{lang==="es"?"Cancelar":"Cancel"}</button><button className="btn bp" style={{flex:2}} onClick={addPayment}><Ico n="receipt" s={14}/>Guardar y Generar Recibo</button></div>
    </div></div>}
  </div>);
}

// ─── DOCS TAB ─────────────────────────────────────────────────────────────────
function DocsTab({s,updateStudent,perms}) {
  const {dark,lang,t} = useApp();
  const [sigPad,setSigPad]=useState(false);
  const [showSignatureView,setShowSignatureView]=useState(false);

  const toggle=key=>{
    const nd={...s.documents,[key]:!s.documents[key]};
    let ns={...s,documents:nd};
    if(ns.status==="Pending Documents"&&Object.values(nd).every(Boolean)) ns.status="Active Training";
    updateStudent(ns);
  };

  const handlePhotoUpload=async(e)=>{
    const file=e.target.files[0]; if(!file)return;
    const b64=await fileToB64(file);
    const dataUrl=`data:${file.type};base64,${b64}`;
    updateStudent({...s,profilePhoto:dataUrl});
  };

  const handleDocUpload=async(docKey,e)=>{
    const file=e.target.files[0]; if(!file)return;
    const b64=await fileToB64(file);
    const dataUrl=`data:${file.type};base64,${b64}`;
    const newDocFiles={...s.docFiles,[docKey]:{name:file.name,data:dataUrl,type:file.type,date:today}};
    const nd={...s.documents,[docKey]:true};
    let ns={...s,docFiles:newDocFiles,documents:nd};
    if(ns.status==="Pending Documents"&&Object.values(nd).every(Boolean)) ns.status="Active Training";
    updateStudent(ns);
  };

  const count=Object.values(s.documents||{}).filter(Boolean).length;
  const total=Object.keys(s.documents||{}).length;

  const DOC_ITEMS=[
    {key:"contract",  label:"Contrato",    icon:"📋", waKey:true},
    {key:"license",   label:"Licencia CDL",icon:"🪪",  waKey:true},
    {key:"clp",       label:"CLP / Permit",icon:"",  waKey:true},
    {key:"medicalCard",label:"Medical Card",icon:"🏥", waKey:true},
    {key:"drugTest",  label:"Drug Test",   icon:"🧪",  waKey:true},
    {key:"eldt",      label:"ELDT/LTC",    icon:"",  waKey:true},
  ];

  return(<div style={{display:"flex",flexDirection:"column",gap:14}}>
    {/* FOTO DE PERFIL */}
    <div className="card cp sh">
      <div className="sec">Foto de Perfil</div>
      <div style={{display:"flex",alignItems:"center",gap:20}}>
        <div style={{position:"relative"}}>
          {s.profilePhoto?(
            <img src={s.profilePhoto} alt="Perfil" style={{width:96,height:96,borderRadius:"50%",objectFit:"cover",border:"3px solid var(--accent)",boxShadow:"0 4px 16px rgba(37,99,235,.3)"}}/>
          ):(
            <div className="av" style={{width:96,height:96,fontSize:30,border:"3px solid var(--border)"}}>{getInit(s.fullName)}</div>
          )}
          <label style={{position:"absolute",bottom:0,right:0,width:28,height:28,borderRadius:"50%",background:"var(--accent)",display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",border:"2px solid var(--surface)",boxShadow:"0 2px 8px rgba(37,99,235,.4)"}}>
            <Ico n="edit" s={13} c="#fff"/>
            <input type="file" accept="image/*" style={{display:"none"}} onChange={handlePhotoUpload}/>
          </label>
        </div>
        <div>
          <div style={{fontWeight:700,fontSize:16,color:"var(--text)"}}>{s.fullName}</div>
          <div style={{fontSize:13,color:"var(--text3)",marginTop:3}}>{s.courseType} · {s.transmission}</div>
          <div style={{fontSize:12,color:"var(--text3)",marginTop:2}}>
            {s.profilePhoto?"✅ Foto cargada":"📷 Sin foto de perfil"}
          </div>
          {s.profilePhoto&&<button className="btn bo bsm" style={{marginTop:8,color:"var(--red)"}} onClick={()=>updateStudent({...s,profilePhoto:""})}>Eliminar foto</button>}
        </div>
      </div>
    </div>

    {/* FIRMA DIGITAL */}
    <div className="card cp sh">
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
        <div className="sec" style={{margin:0}}>Firma Digital del Estudiante</div>
        <div style={{display:"flex",gap:8}}>
          {s.studentSignature&&<button className="btn bo bsm" onClick={()=>setShowSignatureView(true)}><Ico n="eye" s={12}/>Ver</button>}
          <button className="btn bp bsm" onClick={()=>setSigPad(true)}><Ico n="edit" s={12}/>{s.studentSignature?"Refirmar":"Capturar Firma"}</button>
          {s.studentSignature&&<button className="btn bo bsm" style={{color:"var(--red)"}} onClick={()=>updateStudent({...s,studentSignature:null})}>Borrar</button>}
        </div>
      </div>
      {s.studentSignature?(
        <div style={{background:"var(--surface2)",borderRadius:12,padding:16,border:"1px solid var(--border)",textAlign:"center"}}>
          <div style={{display:"flex",gap:14,alignItems:"flex-start",flexWrap:"wrap"}}>
            <img src={s.studentSignature} alt="Firma" style={{maxHeight:72,border:"1px solid var(--border)",borderRadius:8,background:"#fff"}}/>
            <div>
              <label className="lbl">Fecha de Firma del Estudiante</label>
              <input type="date" className="inp" style={{fontSize:12.5,padding:"7px 10px"}} value={s.signatureDate||today} onChange={e=>updateStudent({...s,signatureDate:e.target.value})}/>
            </div>
          </div>
          <div style={{fontSize:11.5,color:"var(--green)",marginTop:10,fontWeight:600}}>✅ Firma capturada — aparece en contrato PDF</div>
        </div>
      ):(
        <div className="al ay"><Ico n="warn" s={13}/><span>Sin firma digital. El contrato PDF mostrará línea en blanco.</span></div>
      )}
    </div>

    {/* DOCUMENTOS */}
    <div className="card cp sh">
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
        <div className="sec" style={{margin:0}}>Documentos del Enrollment</div>
        <span style={{background:count===total?"rgba(22,163,74,.1)":"rgba(180,83,9,.1)",color:count===total?"var(--green)":"var(--yellow)",padding:"5px 14px",borderRadius:20,fontSize:12,fontWeight:700,border:`1px solid ${count===total?"rgba(22,163,74,.2)":"rgba(180,83,9,.2)"}`}}>{count}/{total} completos</span>
      </div>
      <div style={{display:"flex",flexDirection:"column",gap:8}}>
        {DOC_ITEMS.map(({key,label,icon,waKey})=>{
          const val=s.documents?.[key]; const docFile=s.docFiles?.[key];
          return(
            <div key={key} style={{display:"flex",alignItems:"center",gap:12,padding:"12px 16px",background:val?"rgba(22,163,74,.04)":"rgba(234,88,12,.03)",borderRadius:12,border:`1px solid ${val?"rgba(22,163,74,.18)":"rgba(234,88,12,.15)"}`}}>
              <div style={{width:42,height:42,borderRadius:10,background:val?"rgba(22,163,74,.1)":"rgba(234,88,12,.08)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:21,flexShrink:0}}>{icon}</div>
              <div style={{flex:1,minWidth:0}}>
                <div style={{fontWeight:700,fontSize:13.5,color:"var(--text)"}}>{label}</div>
                <div style={{fontSize:11.5,color:val?"var(--green)":"var(--orange)",fontWeight:600,marginTop:1}}>
                  {docFile?`📎 ${docFile.name}`:val?"✓ Marcado como entregado":"Pendiente"}
                </div>
              </div>
              <div style={{display:"flex",gap:7,flexShrink:0}}>
                {!val&&s.phone&&perms.canMessages&&<button className="wa-btn" style={{padding:"5px 10px",fontSize:11}} onClick={()=>openWA(s.phone,WA_TMPL.doc_missing(s,[label]))}><WaIcon/>WA</button>}
                {docFile&&<><button className="btn bo bsm" onClick={()=>{const w=window.open("","_blank");if(docFile.type?.includes("image")){w.document.write(`<img src="${docFile.data}" style="max-width:100%;height:auto;display:block;margin:auto;padding:20px;background:#fff"/>`);}else{w.location.href=docFile.data;}}}><Ico n="eye" s={11}/>Ver</button>
                <a href={docFile.data} download={docFile.name} className="btn bo bsm" style={{textDecoration:"none"}}><Ico n="download" s={11}/>Bajar</a></>}
                <label className="btn bo bsm" style={{cursor:"pointer"}}>
                  <Ico n="pdf" s={11}/>{docFile?"Cambiar":"Subir"}
                  <input type="file" accept="image/*,application/pdf" style={{display:"none"}} onChange={e=>handleDocUpload(key,e)}/>
                </label>
                <button className={`btn bsm ${val?"bo":"bp"}`} style={{fontSize:11}} onClick={()=>toggle(key)}>{val?"✗ Pendiente":"✓ Entregado"}</button>
              </div>
            </div>
          );
        })}
      </div>
    </div>

    {/* DOCUMENTOS ADICIONALES */}
    <div className="card cp sh">
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
        <div className="sec" style={{margin:0}}>Documentos Adicionales</div>
        <label className="btn bp bsm" style={{cursor:"pointer"}}>
          <Ico n="plus" s={13}/>Subir Adicional
          <input type="file" accept="image/*,application/pdf" multiple style={{display:"none"}} onChange={async e=>{
            const files=Array.from(e.target.files);
            const added=await Promise.all(files.map(async f=>{
              const b64=await fileToB64(f);
              return {id:Date.now()+Math.random(),name:f.name,data:`data:${f.type};base64,${b64}`,type:f.type,date:today};
            }));
            updateStudent({...s,docFiles:{...s.docFiles||{},additional:[...(s.docFiles?.additional||[]),...added]}});
          }}/>
        </label>
      </div>
      {(s.docFiles?.additional||[]).length===0?(
        <div style={{textAlign:"center",color:"var(--text3)",fontSize:13,padding:"16px",background:"var(--surface2)",borderRadius:10,border:"1px dashed var(--border)"}}>
          Sin documentos adicionales. Agrega cualquier documento extra aquí.
        </div>
      ):(
        <div style={{display:"flex",flexDirection:"column",gap:8}}>
          {(s.docFiles?.additional||[]).map((doc,i)=>(
            <div key={doc.id||i} style={{display:"flex",alignItems:"center",gap:12,padding:"10px 14px",background:"var(--surface2)",borderRadius:10,border:"1px solid var(--border)"}}>
              <div style={{fontSize:22,flexShrink:0}}>{doc.type?.includes("pdf")?"📑":"🖼️"}</div>
              <div style={{flex:1,minWidth:0}}>
                <div style={{fontWeight:600,fontSize:13,color:"var(--text)",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{doc.name}</div>
                <div style={{fontSize:11,color:"var(--text3)",marginTop:1}}>Subido {fmtDate(doc.date)}</div>
              </div>
              <div style={{display:"flex",gap:7}}>
                <button className="btn bo bsm" onClick={()=>{
                  const w=window.open("","_blank");
                  if(doc.type?.includes("image")){w.document.write(`<img src="${doc.data}" style="max-width:100%;"/>`)}
                  else{w.location.href=doc.data;}
                }}><Ico n="eye" s={11}/>Ver</button>
                <a href={doc.data} download={doc.name} className="btn bo bsm" style={{textDecoration:"none"}}><Ico n="download" s={11}/>Bajar</a>
                <button className="btn bgh bsm" style={{color:"var(--red)"}} onClick={()=>updateStudent({...s,docFiles:{...s.docFiles,additional:(s.docFiles?.additional||[]).filter((_,j)=>j!==i)}})}><Ico n="trash" s={11}/></button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>

    {sigPad&&<SignaturePad onCancel={()=>setSigPad(false)} onSave={sig=>{updateStudent({...s,studentSignature:sig,signatureDate:s.signatureDate||today});setSigPad(false);}}/>}
    {showSignatureView&&s.studentSignature&&(
      <div className="ov" onClick={()=>setShowSignatureView(false)}>
        <div className="md md-sm" style={{textAlign:"center"}} onClick={e=>e.stopPropagation()}>
          <div style={{fontWeight:700,fontSize:16,color:"var(--text)",marginBottom:14}}>Firma de {s.fullName}</div>
          <img src={s.studentSignature} alt="Firma" style={{width:"100%",borderRadius:10,border:"1px solid var(--border)",background:"#fff"}}/>
          <button className="btn bo" style={{marginTop:14,width:"100%"}} onClick={()=>setShowSignatureView(false)}>Cerrar</button>
        </div>
      </div>
    )}
  </div>);
}

// ─── ATTENDANCE TAB ───────────────────────────────────────────────────────────
function AttTab({s,updateStudent}) {
  const {dark,lang,t} = useApp();
  const [showAdd,setShowAdd]=useState(false); const [form,setForm]=useState({date:today,hours:""});
  const totalH=(s.attendance||[]).reduce((a,r)=>a+r.hours,0);
  return(<div className="card cp sh">
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
      <div>
        <div style={{fontWeight:700,fontSize:15,color:"var(--text)"}}>Asistencia</div>
        <div style={{fontSize:12.5,color:"var(--text3)",marginTop:2}}>{(s.attendance||[]).length} sesiones · {totalH} horas totales</div>
      </div>
      <button className="btn bp bsm" onClick={()=>setShowAdd(true)}><Ico n="plus" s={13}/>Agregar</button>
    </div>
    {s.status==="Requires Re-Test"&&<div className="al ay" style={{marginBottom:12}}><Ico n="warn" s={13}/><span>Re-test: {(s.attendance||[]).filter(a=>s.dmv?.actualDate&&a.date>s.dmv.actualDate).length}/2 días de práctica post-falla completados</span></div>}
    {(s.attendance||[]).length===0?(
      <div style={{color:"var(--text3)",fontSize:13,textAlign:"center",padding:"24px",background:"var(--surface2)",borderRadius:12}}>Sin asistencia registrada</div>
    ):[...(s.attendance||[])].reverse().map(a=>(
      <div key={a.id} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"11px 0",borderBottom:"1px solid var(--border2)",fontSize:13.5}}>
        <span style={{color:"var(--text2)"}}>{fmtDate(a.date)}</span>
        <span style={{fontWeight:800,color:"var(--accent)",background:"rgba(37,99,235,.1)",padding:"5px 14px",borderRadius:20,fontFamily:"'Inter',sans-serif",fontSize:13,border:"1px solid rgba(37,99,235,.15)"}}>{a.hours}h</span>
      </div>
    ))}
    {showAdd&&<div className="ov"><div className="md md-sm">
      <div style={{fontWeight:800,fontSize:20,color:"var(--text)",marginBottom:20}}>Registrar Asistencia</div>
      <div className="g2">
        <div><label className="lbl">Fecha</label><input type="date" className="inp" value={form.date} onChange={e=>setForm(p=>({...p,date:e.target.value}))}/></div>
        <div><label className="lbl">Horas</label><input type="number" className="inp" min="0.5" step="0.5" max="12" value={form.hours} onChange={e=>setForm(p=>({...p,hours:e.target.value}))} autoFocus placeholder="0.0"/></div>
      </div>
      <div style={{display:"flex",gap:10,marginTop:22}}>
        <button className="btn bo" style={{flex:1}} onClick={()=>setShowAdd(false)}>{lang==="es"?"Cancelar":"Cancel"}</button>
        <button className="btn bp" style={{flex:2}} onClick={()=>{if(!form.hours||+form.hours<=0)return;updateStudent({...s,attendance:[...(s.attendance||[]),{id:Date.now(),date:form.date,hours:+form.hours}]});setShowAdd(false);setForm({date:today,hours:""});}}>{lang==="es"?"Guardar":"Save"}</button>
      </div>
    </div></div>}
  </div>);
}

// ─── NOTES TAB ────────────────────────────────────────────────────────────────
function NotesTab({s,updateStudent}) {
  const {dark,lang,t} = useApp();
  const [note,setNote]=useState(""); const [editId,setEditId]=useState(null); const [editText,setEditText]=useState("");
  const addNote=()=>{if(!note.trim())return;updateStudent({...s,notes:[...(s.notes||[]),{id:Date.now(),text:note,date:today,by:"Admin"}]});setNote("");};
  const deleteNote=id=>updateStudent({...s,notes:(s.notes||[]).filter(n=>n.id!==id)});
  const saveEdit=()=>{if(!editText.trim())return;updateStudent({...s,notes:(s.notes||[]).map(n=>n.id===editId?{...n,text:editText}:n)});setEditId(null);};
  return(<div className="card cp sh">
    <div className="sec">Notas Internas</div>
    <div style={{marginBottom:18}}>
      <textarea className="inp" rows={3} placeholder="Escribe una nota sobre este estudiante..." value={note} onChange={e=>setNote(e.target.value)} style={{resize:"vertical",marginBottom:8}}/>
      <button className="btn bp bsm" onClick={addNote} disabled={!note.trim()}><Ico n="plus" s={13}/>Agregar Nota</button>
    </div>
    {(s.notes||[]).length===0?(
      <div style={{color:"var(--text3)",fontSize:13,textAlign:"center",padding:"16px",background:"var(--surface2)",borderRadius:12}}>Sin notas internas</div>
    ):[...(s.notes||[])].reverse().map(n=>(
      <div key={n.id} style={{padding:"12px 15px",background:"var(--surface2)",borderRadius:11,marginBottom:8,border:"1px solid var(--border)",borderLeft:"3px solid var(--accent)"}}>
        {editId===n.id?(
          <div>
            <textarea className="inp" rows={2} value={editText} onChange={e=>setEditText(e.target.value)} style={{resize:"vertical",marginBottom:8}} autoFocus/>
            <div style={{display:"flex",gap:7}}><button className="btn bp bsm" onClick={saveEdit}>{lang==="es"?"Guardar":"Save"}</button><button className="btn bo bsm" onClick={()=>setEditId(null)}>{lang==="es"?"Cancelar":"Cancel"}</button></div>
          </div>
        ):(
          <>
            <div style={{fontSize:13.5,color:"var(--text)",marginBottom:7,lineHeight:1.55}}>{n.text}</div>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
              <div style={{fontSize:11.5,color:"var(--text3)"}}>{fmtDate(n.date)} · {n.by}</div>
              <div style={{display:"flex",gap:5}}>
                <button className="btn bgh bsm" onClick={()=>{setEditId(n.id);setEditText(n.text);}}><Ico n="edit" s={11}/></button>
                <button className="btn bgh bsm" style={{color:"var(--red)"}} onClick={()=>deleteNote(n.id)}><Ico n="trash" s={11}/></button>
              </div>
            </div>
          </>
        )}
      </div>
    ))}
  </div>);
}


// ─── DMV TAB ──────────────────────────────────────────────────────────────────
function DmvTab({s,updateStudent,addToast,addNotif,perms}) {
  const {dark,lang,t} = useApp();
  const [showSched,setShowSched]=useState(false); const [showFail,setShowFail]=useState(false);
  const [schedForm,setSchedForm]=useState({date:s.dmv?.actualDate||addBizDays(today,13),time:"08:00",location:"DMV Hialeah"});
  const [failForm,setFailForm]=useState({area:"",reTestDate:addBizDays(today,7)});
  const cand=isDMVReady(s); const md=missingDocs(s); const bal=balance(s);

  const confirmSched=()=>{
    const d=new Date(schedForm.date); if(d.getDay()===3){addToast("No se permiten citas los miércoles.","warning");return;}
    updateStudent({...s,status:"DMV Scheduled",dmv:{...s.dmv,actualDate:schedForm.date,time:schedForm.time,location:schedForm.location,result:"Scheduled"}});
    addNotif("Cita DMV Programada",`${s.fullName} · ${fmtDate(schedForm.date)} ${schedForm.time}`,"success");
    if(s.phone&&perms.canMessages) openWA(s.phone,WA_TMPL.dmv_reminder({...s,dmv:{...s.dmv,actualDate:schedForm.date,time:schedForm.time,location:schedForm.location}}));
    setShowSched(false);
  };

  const confirmPass=()=>{
    updateStudent({...s,status:"Passed / Graduated",dmv:{...s.dmv,result:"Passed"}});
    addNotif("¡Graduado!",`${s.fullName} APROBÓ el examen DMV.`,"success");
    if(s.phone) openWA(s.phone,WA_TMPL.congratulations(s));
  };

  const confirmFail=()=>{
    updateStudent({...s,status:"Requires Re-Test",dmv:{...s.dmv,result:"Failed",failedArea:failForm.area,reTestDate:failForm.reTestDate,attempt:(s.dmv?.attempt||1)+1}});
    addNotif("Re-Test Requerido",`${s.fullName} · Área: ${failForm.area||"No especificada"}`,"warning");
    setShowFail(false);
  };

  return(<div>
    <div className="card cp sh" style={{marginBottom:14}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
        <div className="sec" style={{margin:0}}>Estado para Examen DMV</div>
        <div style={{display:"flex",gap:8}}>
          {s.status==="DMV Scheduled"&&perms.canMessages&&s.phone&&<button className="wa-btn" style={{padding:"7px 14px",fontSize:12}} onClick={()=>openWA(s.phone,WA_TMPL.dmv_reminder(s))}><WaIcon/>Recordatorio</button>}
          {s.status==="DMV Scheduled"&&perms.canMessages&&s.phone&&<button className="wa-btn" style={{padding:"7px 14px",fontSize:12,background:"linear-gradient(135deg,#7c3aed,#6d28d9)"}} onClick={()=>openWA(s.phone,WA_TMPL.pre_dmv_checklist(s))}><WaIcon/>Checklist</button>}
        </div>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:10,marginBottom:16}}>
        {[["Pre-Trip",s.progress.preTrip],["Maniobras",s.progress.maneuvers],["Manejo en Ruta",s.progress.roadDriving]].map(([k,v])=>(
          <div key={k} style={{textAlign:"center",padding:"12px 8px",background:v>=75?"rgba(22,163,74,.08)":"rgba(180,83,9,.08)",borderRadius:10,border:`1px solid ${v>=75?"rgba(22,163,74,.2)":"rgba(180,83,9,.2)"}`}}>
            <div style={{fontSize:24,fontWeight:900,color:v>=75?"var(--green)":"var(--yellow)",fontFamily:"'Inter',sans-serif"}}>{v}%</div>
            <div style={{fontSize:11,color:"var(--text3)",marginTop:2}}>{k}</div>
            <div style={{fontSize:10,fontWeight:700,color:v>=75?"var(--green)":"var(--yellow)",marginTop:2}}>{v>=75?"✓ OK":"✗ Falta"}</div>
          </div>
        ))}
      </div>
      {!cand&&<div className="al ay" style={{marginBottom:10}}><Ico n="warn" s={13}/><span>Requiere ≥75% en Pre-Trip, Maniobras y Manejo en Ruta.</span></div>}
      {cand&&md.length>0&&<div className="al ay" style={{marginBottom:10}}><Ico n="warn" s={13}/><span>Documentos faltantes: {md.join(", ")}</span></div>}
      {cand&&bal>0&&<div className="al ar" style={{marginBottom:10}}><Ico n="warn" s={13}/><span>Balance pendiente {fmtCur(bal)}. Debe liquidarse antes del examen.</span></div>}
      {cand&&md.length===0&&bal===0&&<div className="al agr" style={{marginBottom:10}}><Ico n="check" s={13}/><span>✓ Todo listo para programar el examen. Fecha sugerida: <b>{fmtDate(addBizDays(today,13))}</b></span></div>}
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"0 24px",marginTop:8}}>
        {[["Fecha Cita",s.dmv?.actualDate?fmtDate(s.dmv.actualDate):"No programada"],["Hora",s.dmv?.time||"—"],["Oficina",s.dmv?.location||"—"],["Camión",s.dmv?.truckAssigned||"—"],["Intento #",s.dmv?.attempt||1],["Resultado",s.dmv?.result||"Pendiente"],s.dmv?.failedArea&&["Área Fallida",s.dmv.failedArea],s.dmv?.reTestDate&&["Fecha Re-Test",fmtDate(s.dmv.reTestDate)]].filter(Boolean).map(([k,v])=>(
          <div key={k} style={{display:"flex",justifyContent:"space-between",padding:"9px 0",borderBottom:"1px solid var(--border2)",fontSize:13.5}}>
            <span style={{color:"var(--text3)",fontWeight:500}}>{k}</span>
            <span style={{fontWeight:700,color:v==="Passed"?"var(--green)":v==="Failed"?"var(--red)":"var(--text)"}}>{v}</span>
          </div>
        ))}
      </div>
      <div style={{display:"flex",gap:10,marginTop:16,flexWrap:"wrap"}}>
        {s.status!=="Passed / Graduated"&&<button className="btn bp" onClick={()=>setShowSched(true)}>📅 Programar Cita</button>}
        {s.status==="DMV Scheduled"&&perms.canDMV&&<>
          <button className="btn bgg" onClick={confirmPass}>🏆 Aprobado — Enviar Felicitaciones WA</button>
          <button className="btn br" onClick={()=>setShowFail(true)}>✗ Reprobado</button>
        </>}
      </div>
    </div>
    {showSched&&<div className="ov"><div className="md">
      <div style={{fontWeight:800,fontSize:20,color:"var(--text)",marginBottom:5}}>Programar Cita DMV</div>
      <div style={{fontSize:12.5,color:"var(--text3)",marginBottom:18}}>⚠ No se permiten miércoles · Camión: <b>{s.dmv?.truckAssigned}</b></div>
      <div style={{display:"grid",gap:14}}>
        <div><label className="lbl">Fecha del Examen</label><input type="date" className="inp" value={schedForm.date} onChange={e=>setSchedForm(p=>({...p,date:e.target.value}))}/></div>
        <div><label className="lbl">Hora (mínimo 8:00 AM)</label><input type="time" className="inp" value={schedForm.time} min="08:00" onChange={e=>setSchedForm(p=>({...p,time:e.target.value}))}/></div>
        <div><label className="lbl">Oficina DMV</label><input className="inp" value={schedForm.location} onChange={e=>setSchedForm(p=>({...p,location:e.target.value}))}/></div>
      </div>
      <div className="al ab" style={{marginTop:14}}><Ico n="info" s={13}/><span style={{fontSize:12.5}}>Se enviará automáticamente un recordatorio por WhatsApp al confirmar.</span></div>
      <div style={{display:"flex",gap:10,marginTop:22}}>
        <button className="btn bo" style={{flex:1}} onClick={()=>setShowSched(false)}>{lang==="es"?"Cancelar":"Cancel"}</button>
        <button className="btn bp" style={{flex:2}} onClick={confirmSched}>✓ Confirmar y Notificar por WA</button>
      </div>
    </div></div>}
    {showFail&&<div className="ov"><div className="md">
      <div style={{fontWeight:800,fontSize:20,color:"var(--text)",marginBottom:20}}>Registrar: Examen Reprobado</div>
      <div style={{display:"grid",gap:14}}>
        <div><label className="lbl">Área que Falló</label><select className="sel" value={failForm.area} onChange={e=>setFailForm(p=>({...p,area:e.target.value}))}><option value="">No especificada</option><option>Pre-Trip Inspection</option><option>Maniobras / Backing</option><option>Manejo en Ruta</option></select></div>
        <div><label className="lbl">Fecha de Re-Test</label><input type="date" className="inp" value={failForm.reTestDate} onChange={e=>setFailForm(p=>({...p,reTestDate:e.target.value}))}/></div>
      </div>
      <div className="al ay" style={{marginTop:14}}><Ico n="warn" s={13}/><span>Se requieren mínimo 2 días de práctica adicional antes del re-test.</span></div>
      <div style={{display:"flex",gap:10,marginTop:22}}>
        <button className="btn bo" style={{flex:1}} onClick={()=>setShowFail(false)}>{lang==="es"?"Cancelar":"Cancel"}</button>
        <button className="btn br" style={{flex:2}} onClick={confirmFail}>Registrar Reprobado</button>
      </div>
    </div></div>}
  </div>);
}

// ─── REPORT TAB ───────────────────────────────────────────────────────────────
function ReportTab({s}) {
  const {dark,lang,t} = useApp();
  const bal=balance(s); const prog=avgProg(s); const sm=STATUS_META[s.status]||STATUS_META["Inactive"];
  return(<div>
    <div className="card cp sh" style={{marginBottom:14}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
        <div>
          <div className="sec" style={{margin:0,marginBottom:4}}>Vista Previa del Reporte</div>
          <div style={{fontSize:12.5,color:"var(--text3)"}}>Firmado por Jahaziel Mokay, Director FTDS</div>
        </div>
        <div style={{display:"flex",gap:8}}>
          <button className="btn bo bsm" style={{color:"#7c3aed",borderColor:"#7c3aed"}} onClick={()=>genContractPDF(s)}><Ico n="contract" s={12}/>Contrato PDF</button>
          <button className="btn bp blg" onClick={()=>genStudentPDF(s)}><Ico n="pdf" s={15}/>Generar Reporte PDF</button>
        </div>
      </div>
      <div style={{border:"2px solid var(--border)",borderRadius:16,overflow:"hidden"}}>
        <div style={{background:"linear-gradient(135deg,#060f20,#1e3a6b,#2563eb)",padding:"18px 22px",display:"flex",alignItems:"center",gap:14}}>
          <img src={SCHOOL_LOGO_NEG} alt="TDSuite" style={{width:44,height:44,borderRadius:10,objectFit:"contain",background:"rgba(255,255,255,.1)",padding:3}}/>
          <div style={{flex:1}}>
            <div style={{fontWeight:900,fontSize:15,color:"#fff"}}>Felipe's Truck Driving School</div>
            <div style={{fontSize:10.5,color:"#93c5fd",marginTop:2}}>CDL Training Center · Hialeah, FL</div>
          </div>
          <span style={{background:"rgba(255,255,255,.15)",border:"1px solid rgba(255,255,255,.25)",borderRadius:20,padding:"6px 16px",fontSize:12,fontWeight:700,color:"#fff"}}>{sm.icon} {sm.label}</span>
        </div>
        <div style={{padding:20}}>
          <div style={{fontWeight:800,fontSize:18,color:"var(--text)",marginBottom:3}}>{s.fullName}</div>
          <div style={{fontSize:12.5,color:"var(--text3)",marginBottom:16}}>{s.courseType} · {s.transmission} · {s.phone||"—"}</div>
          <div className="g3" style={{marginBottom:16}}>
            {[["Pre-Trip",s.progress.preTrip,"#2563eb"],["Maniobras",s.progress.maneuvers,"#7c3aed"],["Manejo",s.progress.roadDriving,"#0e7490"]].map(([k,v,c])=>(
              <div key={k} style={{textAlign:"center",background:"var(--surface2)",border:"1px solid var(--border)",borderRadius:10,padding:"12px 8px"}}>
                <div style={{fontSize:24,fontWeight:900,color:c,fontFamily:"'Inter',sans-serif"}}>{v}%</div>
                <div style={{fontSize:10.5,color:"var(--text3)",marginTop:2,textTransform:"uppercase",letterSpacing:".06em"}}>{k}</div>
                <div style={{fontSize:10,fontWeight:700,color:v>=75?"var(--green)":"var(--yellow)",marginTop:2}}>{v>=75?"✓ OK":"Falta"}</div>
              </div>
            ))}
          </div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:16}}>
            <div style={{padding:"10px 14px",background:"rgba(22,163,74,.08)",borderRadius:10,border:"1px solid rgba(22,163,74,.15)"}}>
              <div style={{fontSize:10.5,color:"var(--text3)",marginBottom:3}}>Total Pagado</div>
              <div style={{fontSize:18,fontWeight:800,color:"var(--green)",fontFamily:"'Inter',sans-serif"}}>{fmtCur(totalPaid(s))}</div>
            </div>
            <div style={{padding:"10px 14px",background:bal>0?"rgba(220,38,38,.08)":"rgba(22,163,74,.08)",borderRadius:10,border:`1px solid ${bal>0?"rgba(220,38,38,.15)":"rgba(22,163,74,.15)"}`}}>
              <div style={{fontSize:10.5,color:"var(--text3)",marginBottom:3}}>Balance</div>
              <div style={{fontSize:18,fontWeight:800,color:bal>0?"var(--red)":"var(--green)",fontFamily:"'Inter',sans-serif"}}>{fmtCur(bal)}</div>
            </div>
          </div>
          <div style={{borderTop:"2px solid var(--border)",paddingTop:16,display:"grid",gridTemplateColumns:"1fr 1fr",gap:40}}>
            {[["Jahaziel Mokay","Director — FTDS"],[s.fullName,"Estudiante"]].map(([name,title])=>(
              <div key={name} style={{textAlign:"center"}}>
                <div style={{height:38,borderBottom:`2px solid ${dark?"rgba(255,255,255,.25)":"#0a1628"}`,marginBottom:8}}/>
                <div style={{fontWeight:800,fontSize:12.5,color:"var(--text)"}}>{name}</div>
                <div style={{fontSize:11,color:"var(--text3)"}}>{title}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
      <div className="al ab" style={{marginTop:14}}><Ico n="info" s={13}/><span style={{fontSize:12.5}}>El PDF incluirá el logo oficial, historial de pagos, documentos y todos los detalles del estudiante.</span></div>
    </div>
  </div>);
}


// ─── PAYMENTS PAGE ────────────────────────────────────────────────────────────
function PaymentsPage({students,openStudent,totalBalance}) {
  const {dark,lang,t} = useApp();
  const withBal=students.filter(s=>balance(s)>0);
  const exportCSV=()=>{const rows=withBal.map(s=>[s.fullName,s.phone,s.totalPrice,totalPaid(s),balance(s),s.courseType].join(","));const a=document.createElement("a");a.href=URL.createObjectURL(new Blob([["Nombre,Teléfono,Precio,Pagado,Balance,Clase",...rows].join("\n")],{type:"text/csv"}));a.download=`FTDS_Balances_${today}.csv`;a.click();};
  const totalCobrado=students.reduce((a,s)=>a+totalPaid(s),0);
  return(<div className="pg">
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:22}}>
      <div><h1 style={{fontSize:26,fontWeight:800,color:"var(--text)",fontFamily:"'Inter',sans-serif",letterSpacing:"-.02em"}}>Pagos & Finanzas</h1><p style={{color:"var(--text3)",fontSize:13.5,marginTop:3}}>Control financiero completo</p></div>
      <button className="btn bo" onClick={exportCSV}><Ico n="download" s={14}/>{lang==="es"?"Exportar CSV":"Export CSV"}</button>
    </div>
    <div className="g3" style={{marginBottom:22}}>
      {[["Total Cobrado",fmtCur(totalCobrado),"var(--green)","💵"],["Balance Pendiente",fmtCur(totalBalance),"var(--red)","⚠️"],["Con Balance",`${withBal.length} estudiantes`,"var(--yellow)","👤"]].map(([l,v,c,icon],i)=>(
        <div key={i} className="kpi" style={{"--kpi-clr":c}}>
          <div style={{display:"flex",justifyContent:"space-between",marginBottom:8}}><div style={{fontSize:10.5,fontWeight:700,color:"var(--text3)",textTransform:"uppercase",letterSpacing:".06em"}}>{l}</div><div style={{fontSize:24,lineHeight:1}}>{icon}</div></div>
          <div style={{fontSize:26,fontWeight:900,color:c,fontFamily:"'Inter',sans-serif"}}>{v}</div>
        </div>
      ))}
    </div>
    <div className="card sh">
      {withBal.length===0?(
        <div style={{textAlign:"center",color:"var(--text3)",padding:"48px"}}>
          <div style={{fontSize:40,marginBottom:10}}></div>
          <div style={{fontWeight:700,fontSize:15}}>Todos los estudiantes están al día</div>
        </div>
      ):withBal.map(s=>(
        <div key={s.id} style={{padding:"18px 20px",borderBottom:"1px solid var(--border2)"}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
            <div style={{display:"flex",alignItems:"center",gap:12,cursor:"pointer"}} onClick={()=>openStudent(s)}>
              <div className="av" style={{width:42,height:42,fontSize:14}}>{getInit(s.fullName)}</div>
              <div>
                <div style={{fontWeight:700,color:"var(--text)",fontSize:14}}>{s.fullName}</div>
                <div style={{fontSize:12,color:"var(--text3)",marginTop:1}}>{s.courseType} · {s.transmission} · {s.phone}</div>
              </div>
            </div>
            <div style={{textAlign:"right"}}>
              <div style={{fontWeight:800,color:"var(--red)",fontSize:19,fontFamily:"'Inter',sans-serif"}}>{fmtCur(balance(s))}</div>
              <div style={{fontSize:11,color:"var(--text3)"}}>de {fmtCur(s.totalPrice)}</div>
            </div>
          </div>
          <div style={{display:"flex",gap:6,flexWrap:"wrap",marginBottom:10}}>
            {(s.payments||[]).map(p=><span key={p.id} style={{background:"rgba(22,163,74,.08)",border:"1px solid rgba(22,163,74,.15)",padding:"3px 10px",borderRadius:7,fontSize:11.5,color:"var(--green)",fontWeight:600}}>{fmtDate(p.date)} · {fmtCur(p.amount)} · {p.method}</span>)}
            {(s.payments||[]).length===0&&<span style={{color:"var(--text3)",fontSize:12}}>{lang==="es"?"Sin pagos registrados":"No payments registered"}</span>}
          </div>
          {s.phone&&<button className="wa-btn" style={{padding:"7px 14px",fontSize:12}} onClick={()=>openWA(s.phone,WA_TMPL.payment_reminder(s,balance(s)))}><WaIcon/>Enviar Recordatorio de Pago</button>}
        </div>
      ))}
    </div>
  </div>);
}

// ─── MESSAGES PAGE ────────────────────────────────────────────────────────────
function MessagesPage({students}) {
  const {dark,lang,t} = useApp();
  const [selStudent,setSelStudent]=useState(students[0]||null);
  const [template,setTemplate]=useState("payment_reminder");
  const [customMsg,setCustomMsg]=useState("");
  const [preview,setPreview]=useState("");
  const [search,setSearch]=useState("");
  const filtered=students.filter(s=>!search||s.fullName.toLowerCase().includes(search.toLowerCase()));
  const TMPL_NAMES={payment_reminder:"Recordatorio de Pago",dmv_reminder:"Recordatorio DMV",doc_missing:"Docs Faltantes",payment_confirmed:"Pago Confirmado",congratulations:"¡Felicitaciones!",pre_dmv_checklist:"Checklist Pre-DMV",custom:"Mensaje Personalizado"};
  useEffect(()=>{
    if(!selStudent)return;
    const bal=balance(selStudent);
    const msgs={
      payment_reminder:WA_TMPL.payment_reminder(selStudent,bal),
      dmv_reminder:WA_TMPL.dmv_reminder(selStudent),
      doc_missing:WA_TMPL.doc_missing(selStudent,missingDocs(selStudent).length?missingDocs(selStudent):["Documento pendiente"]),
      payment_confirmed:WA_TMPL.payment_confirmed(selStudent,totalPaid(selStudent)),
      congratulations:WA_TMPL.congratulations(selStudent),
      pre_dmv_checklist:WA_TMPL.pre_dmv_checklist(selStudent),
      custom:customMsg,
    };
    setPreview(msgs[template]||"");
  },[selStudent,template,customMsg]);

  return(<div className="pg">
    <h1 style={{fontSize:26,fontWeight:800,color:"var(--text)",fontFamily:"'Inter',sans-serif",marginBottom:4}}>Centro de Mensajes</h1>
    <p style={{color:"var(--text3)",fontSize:13.5,marginBottom:22}}>Genera mensajes WhatsApp profesionales personalizados</p>
    <div style={{display:"grid",gridTemplateColumns:"290px 1fr",gap:20}}>
      {/* LEFT: Student list */}
      <div className="card cp sh">
        <div className="sec">Seleccionar Estudiante</div>
        <div className="sw" style={{marginBottom:12}}><Ico n="search" s={13}/><input className="inp si" style={{fontSize:13}} placeholder="Buscar..." value={search} onChange={e=>setSearch(e.target.value)}/></div>
        <div style={{maxHeight:520,overflowY:"auto",display:"flex",flexDirection:"column",gap:3}}>
          {filtered.length===0?<div style={{color:"var(--text3)",fontSize:13,textAlign:"center",padding:"20px"}}>Sin estudiantes</div>:
          filtered.map(s=>(
            <div key={s.id} onClick={()=>setSelStudent(s)} style={{padding:"10px 12px",borderRadius:10,cursor:"pointer",background:selStudent?.id===s.id?"rgba(37,99,235,.1)":"transparent",border:selStudent?.id===s.id?"1px solid rgba(37,99,235,.25)":"1px solid transparent",transition:"all .15s"}}>
              <div style={{fontWeight:600,fontSize:13,color:"var(--text)"}}>{s.fullName}</div>
              <div style={{fontSize:11.5,color:"var(--text3)",marginTop:2}}>{s.phone||"Sin teléfono"} · {balance(s)>0?`Debe ${fmtCur(balance(s))}`:"Al día"}</div>
            </div>
          ))}
        </div>
      </div>
      {/* RIGHT: Template + preview */}
      <div style={{display:"flex",flexDirection:"column",gap:14}}>
        <div className="card cp sh">
          <div className="sec">Seleccionar Plantilla</div>
          <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:8,marginBottom:16}}>
            {Object.entries(TMPL_NAMES).map(([k,v])=>(
              <button key={k} onClick={()=>setTemplate(k)} style={{padding:"10px 12px",borderRadius:11,border:`1.5px solid ${template===k?"var(--accent)":"var(--border)"}`,background:template===k?(dark?"rgba(37,99,235,.12)":"#eff6ff"):"transparent",color:template===k?"var(--accent)":"var(--text3)",fontSize:12.5,fontWeight:600,cursor:"pointer",textAlign:"center",transition:"all .15s",fontFamily:"inherit"}}>
                {v}
              </button>
            ))}
          </div>
          {template==="custom"&&<textarea className="inp" rows={4} value={customMsg} onChange={e=>setCustomMsg(e.target.value)} placeholder="Escribe tu mensaje personalizado..." style={{resize:"vertical"}}/>}
        </div>
        {selStudent&&<div className="card cp sh">
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
            <div className="sec" style={{margin:0}}>Vista Previa · {selStudent.fullName}</div>
            <span style={{fontSize:12,color:"var(--text3)"}}>{selStudent.phone}</span>
          </div>
          <div style={{background:"rgba(22,163,74,.06)",border:"1px solid rgba(22,163,74,.15)",borderRadius:14,padding:16,marginBottom:16,fontFamily:"'Courier New',monospace",fontSize:13,lineHeight:1.7,whiteSpace:"pre-wrap",color:dark?"#86efac":"#166534",minHeight:120}}>
            {preview||"Selecciona una plantilla..."}
          </div>
          <div style={{display:"flex",gap:10}}>
            <button className="wa-btn" style={{flex:1,justifyContent:"center"}} onClick={()=>selStudent.phone&&openWA(selStudent.phone,preview)} disabled={!selStudent.phone||!preview}>
              <WaIcon s={14}/>Abrir en WhatsApp
            </button>
            <button className="btn bo" style={{flex:1,justifyContent:"center"}} onClick={()=>{navigator.clipboard.writeText(preview).then(()=>alert("¡Copiado al portapapeles!"));}} disabled={!preview}>
              <Ico n="copy" s={13}/>Copiar Mensaje
            </button>
          </div>
          {!selStudent.phone&&<div className="al ay" style={{marginTop:10}}><Ico n="warn" s={12}/><span style={{fontSize:12}}>Este estudiante no tiene teléfono registrado.</span></div>}
        </div>}
      </div>
    </div>
  </div>);
}


// ─── DMV PAGE ─────────────────────────────────────────────────────────────────
function DmvPage({students,openStudent}) {
  const {dark,lang,t} = useApp();
  const candidates=students.filter(s=>isDMVReady(s)&&!["Passed / Graduated","DMV Scheduled"].includes(s.status));
  const scheduled=students.filter(s=>s.status==="DMV Scheduled");
  const passed=students.filter(s=>s.dmv?.result==="Passed");
  const failed=students.filter(s=>s.dmv?.result==="Failed");
  const rate=passed.length+failed.length>0?Math.round(passed.length/(passed.length+failed.length)*100):0;

  return(<div className="pg">
    <div style={{marginBottom:22}}>
      <h1 style={{fontSize:26,fontWeight:800,color:"var(--text)",fontFamily:"'Inter',sans-serif",letterSpacing:"-.02em"}}>Gestión DMV</h1>
      <p style={{color:"var(--text3)",fontSize:13.5,marginTop:3}}>Panel de control para exámenes CDL</p>
    </div>
    <div className="g4" style={{marginBottom:22}}>
      {[["Candidatos",candidates.length,"var(--purple)",""],["Programados",scheduled.length,"var(--teal)",""],["Graduados",passed.length,"var(--green)",""],["Tasa Aprobación",`${rate}%`,"var(--accent)",""]].map(([l,v,c,icon],i)=>(
        <div key={i} className="kpi" style={{"--kpi-clr":c}}>
          <div style={{display:"flex",justifyContent:"space-between",marginBottom:8}}><div style={{fontSize:10.5,fontWeight:700,color:"var(--text3)",textTransform:"uppercase",letterSpacing:".06em"}}>{l}</div><div style={{fontSize:24}}>{icon}</div></div>
          <div style={{fontSize:30,fontWeight:900,color:c,fontFamily:"'Inter',sans-serif"}}>{v}</div>
        </div>
      ))}
    </div>
    <div className="g2">
      <div className="card cp sh">
        <div className="sec">Candidatos Listos para DMV ({candidates.length})</div>
        {candidates.length===0?<div style={{color:"var(--text3)",fontSize:13,textAlign:"center",padding:"20px",background:"var(--surface2)",borderRadius:10}}>Sin candidatos por ahora</div>:
        candidates.map(s=>{const md=missingDocs(s);const bal=balance(s);return(
          <div key={s.id} onClick={()=>openStudent(s)} style={{padding:"12px 0",borderBottom:"1px solid var(--border2)",cursor:"pointer"}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
              <div style={{display:"flex",alignItems:"center",gap:10}}>
                <div className="av" style={{width:36,height:36,fontSize:12}}>{getInit(s.fullName)}</div>
                <div><div style={{fontWeight:700,color:"var(--text)",fontSize:13.5}}>{s.fullName}</div><div style={{fontSize:11.5,color:"var(--text3)"}}>{s.courseType} · {s.transmission}</div></div>
              </div>
              <div style={{textAlign:"right"}}>
                <div style={{fontSize:12,fontWeight:700,color:"var(--green)"}}>PT:{s.progress.preTrip}% M:{s.progress.maneuvers}% RD:{s.progress.roadDriving}%</div>
                {bal>0&&<div style={{fontSize:11.5,color:"var(--red)",fontWeight:600}}>💰 {fmtCur(bal)}</div>}
                {md.length>0&&<div style={{fontSize:11,color:"var(--yellow)"}}>📄 {md.length} doc</div>}
              </div>
            </div>
          </div>
        );})}
      </div>
      <div className="card cp sh">
        <div className="sec">Citas Programadas ({scheduled.length})</div>
        {scheduled.length===0?<div style={{color:"var(--text3)",fontSize:13,textAlign:"center",padding:"20px",background:"var(--surface2)",borderRadius:10}}>Sin citas programadas</div>:
        [...scheduled].sort((a,b)=>(a.dmv?.actualDate||"").localeCompare(b.dmv?.actualDate||"")).map(s=>{
          const daysUntil=s.dmv?.actualDate?Math.round((new Date(s.dmv.actualDate)-new Date(today))/86400000):null;
          return(
            <div key={s.id} onClick={()=>openStudent(s)} style={{padding:"12px 0",borderBottom:"1px solid var(--border2)",cursor:"pointer"}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                <div style={{display:"flex",alignItems:"center",gap:10}}>
                  <div className="av" style={{width:36,height:36,fontSize:12}}>{getInit(s.fullName)}</div>
                  <div><div style={{fontWeight:700,color:"var(--text)",fontSize:13.5}}>{s.fullName}</div><div style={{fontSize:11.5,color:"var(--text3)"}}>{fmtDate(s.dmv?.actualDate)} · {s.dmv?.time} · {s.dmv?.location}</div></div>
                </div>
                <div style={{textAlign:"right"}}>
                  {daysUntil!==null&&<div style={{fontSize:12,fontWeight:800,color:daysUntil<=2?"var(--red)":daysUntil<=7?"var(--yellow)":"var(--green)"}}>{daysUntil===0?"HOY":daysUntil===1?"Mañana":`${daysUntil} días`}</div>}
                  <div style={{fontSize:11,color:"var(--text3)"}}>{s.dmv?.truckAssigned}</div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
    <div className="card cp sh" style={{marginTop:20}}>
      <div className="sec">Historial de Resultados</div>
      <table className="tbl">
        <thead><tr><th>Estudiante</th><th>Fecha</th><th>Resultado</th><th>Intento</th><th>Área Fallida</th></tr></thead>
        <tbody>
          {students.filter(s=>s.dmv?.result&&s.dmv.result!=="Scheduled").length===0?(
            <tr><td colSpan={5} style={{textAlign:"center",color:"var(--text3)",padding:"24px"}}>Sin resultados registrados</td></tr>
          ):students.filter(s=>s.dmv?.result&&s.dmv.result!=="Scheduled").map(s=>(
            <tr key={s.id} onClick={()=>openStudent(s)}>
              <td><div style={{display:"flex",alignItems:"center",gap:10}}><div className="av" style={{width:30,height:30,fontSize:10}}>{getInit(s.fullName)}</div><span style={{fontWeight:600}}>{s.fullName}</span></div></td>
              <td style={{fontSize:13}}>{fmtDate(s.dmv?.actualDate)}</td>
              <td><span style={{background:s.dmv?.result==="Passed"?"rgba(22,163,74,.1)":"rgba(220,38,38,.1)",color:s.dmv?.result==="Passed"?"var(--green)":"var(--red)",padding:"3px 10px",borderRadius:7,fontSize:12,fontWeight:700}}>{s.dmv?.result==="Passed"?"🏆 Aprobó":"✗ Reprobó"}</span></td>
              <td style={{fontSize:13,color:"var(--text2)"}}>#{s.dmv?.attempt||1}</td>
              <td style={{fontSize:12.5,color:"var(--text3)"}}>{s.dmv?.failedArea||"—"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </div>);
}

// ─── CALENDAR PAGE ────────────────────────────────────────────────────────────
function CalendarPage({students,openStudent}) {
  const {dark,lang,t} = useApp();
  const [offset,setOffset]=useState(0);
  const d=new Date(); d.setDate(1); d.setMonth(d.getMonth()+offset);
  const year=d.getFullYear(), month=d.getMonth();
  const firstDay=(new Date(year,month,1).getDay()+6)%7;
  const daysInMonth=new Date(year,month+1,0).getDate();
  const monthLabel=d.toLocaleDateString("es-US",{month:"long",year:"numeric"});
  const DAYS=["Lun","Mar","Mié","Jue","Vie","Sáb","Dom"];
  const dmvMap={};
  students.filter(s=>s.dmv?.actualDate&&s.dmv.actualDate.startsWith(`${year}-${String(month+1).padStart(2,"0")}`)).forEach(s=>{const day=+s.dmv.actualDate.split("-")[2];if(!dmvMap[day])dmvMap[day]=[];dmvMap[day].push(s);});
  const todayDay=new Date().getDate(), todayMonth=new Date().getMonth(), todayYear=new Date().getFullYear();
  const isToday=(d)=>d===todayDay&&month===todayMonth&&year===todayYear;

  return(<div className="pg">
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:22}}>
      <div>
        <h1 style={{fontSize:26,fontWeight:800,color:"var(--text)",fontFamily:"'Inter',sans-serif",letterSpacing:"-.02em",textTransform:"capitalize"}}>{monthLabel}</h1>
        <p style={{color:"var(--text3)",fontSize:13.5,marginTop:3}}>Citas DMV programadas · Miércoles bloqueados</p>
      </div>
      <div style={{display:"flex",gap:8,alignItems:"center"}}>
        <button className="btn bo bsm" onClick={()=>setOffset(p=>p-1)}><Ico n="back" s={13}/> Anterior</button>
        <button className="btn bo bsm" onClick={()=>setOffset(0)}>Hoy</button>
        <button className="btn bo bsm" onClick={()=>setOffset(p=>p+1)}>Siguiente <Ico n="next" s={13}/></button>
      </div>
    </div>
    <div className="card sh" style={{overflow:"hidden"}}>
      <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)"}}>
        {DAYS.map((d,i)=><div key={d} style={{textAlign:"center",padding:"10px 4px",fontSize:11,fontWeight:700,color:i===2?"var(--red)":"var(--text3)",letterSpacing:".06em",background:"var(--surface2)",borderBottom:"1px solid var(--border)"}}>{d}{i===2&&" 🚫"}</div>)}
        {Array.from({length:firstDay}).map((_,i)=><div key={`e${i}`} style={{minHeight:80,background:"var(--surface2)",borderRight:"1px solid var(--border2)",borderBottom:"1px solid var(--border2)"}}/>)}
        {Array.from({length:daysInMonth}).map((_,i)=>{
          const day=i+1;
          const dow=(new Date(year,month,day).getDay()+6)%7;
          const isWed=dow===2;
          const isT=isToday(day);
          const events=dmvMap[day]||[];
          return(
            <div key={day} style={{minHeight:80,padding:7,background:isWed?"rgba(220,38,38,.04)":isT?"rgba(37,99,235,.06)":"var(--surface)",borderRight:"1px solid var(--border2)",borderBottom:"1px solid var(--border2)",position:"relative"}}>
              <div style={{fontSize:13,fontWeight:700,color:isWed?"var(--red)":isT?"var(--accent)":"var(--text)",marginBottom:3,display:"flex",alignItems:"center",gap:4}}>
                {isT?<span style={{background:"var(--accent)",color:"#fff",borderRadius:"50%",width:22,height:22,display:"flex",alignItems:"center",justifyContent:"center",fontSize:12}}>{day}</span>:<span>{day}</span>}
                {isWed&&<span style={{fontSize:9,color:"var(--red)",fontWeight:700}}>BLOQ</span>}
              </div>
              {events.map(s=>(
                <div key={s.id} onClick={()=>openStudent(s)} style={{background:"linear-gradient(135deg,rgba(37,99,235,.85),rgba(29,78,216,.9))",borderRadius:6,padding:"3px 7px",fontSize:10.5,fontWeight:600,color:"#fff",marginBottom:3,cursor:"pointer",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>
                  🚛 {s.fullName.split(" ")[0]} {s.dmv?.time}
                </div>
              ))}
            </div>
          );
        })}
      </div>
    </div>
    <div style={{display:"flex",gap:12,marginTop:14,flexWrap:"wrap"}}>
      {[["Cita DMV","linear-gradient(135deg,rgba(37,99,235,.85),rgba(29,78,216,.9))","#fff"],["Hoy","rgba(37,99,235,.06)","var(--accent)"],["Miércoles Bloqueado","rgba(220,38,38,.04)","var(--red)"]].map(([label,bg,color])=>(
        <div key={label} style={{display:"flex",alignItems:"center",gap:7,fontSize:12.5,color:"var(--text3)"}}>
          <div style={{width:14,height:14,borderRadius:3,background:bg,border:`1px solid ${color}30`}}/>
          {label}
        </div>
      ))}
    </div>
  </div>);
}


// ─── REPORTS PAGE ─────────────────────────────────────────────────────────────
function ReportsPage({students}) {
  const {dark,lang,t} = useApp();
  const total=students.length;
  const active=students.filter(s=>!["Inactive","Passed / Graduated"].includes(s.status)).length;
  const graduated=students.filter(s=>s.status==="Passed / Graduated").length;
  const totalRev=students.reduce((a,s)=>a+totalPaid(s),0);
  const totalBal=students.reduce((a,s)=>a+balance(s),0);
  const byClass=["Class A","Class B","Class C Passenger"].map(c=>({label:c,n:students.filter(s=>s.courseType===c).length}));
  const byTrans=["Manual","Automatic"].map(t=>({label:t,n:students.filter(s=>s.transmission===t).length}));
  const avgProgress=total?Math.round(students.reduce((a,s)=>a+avgProg(s),0)/total):0;
  const dmvStats={pass:students.filter(s=>s.dmv?.result==="Passed").length,fail:students.filter(s=>s.dmv?.result==="Failed").length};
  const dmvRate=dmvStats.pass+dmvStats.fail>0?Math.round(dmvStats.pass/(dmvStats.pass+dmvStats.fail)*100):0;
  const months=Array.from({length:6},(_,i)=>{const d=new Date();d.setMonth(d.getMonth()-5+i);const key=`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}`;const rev=students.reduce((a,s)=>a+(s.payments||[]).filter(p=>(p.date||"").startsWith(key)).reduce((x,p)=>x+p.amount,0),0);return{label:d.toLocaleDateString("es-US",{month:"short"}),rev};});
  const maxRev=Math.max(...months.map(m=>m.rev),1);

  const exportFull=()=>{
    const rows=students.map(s=>[s.fullName,s.phone||"",s.email||"",s.courseType,s.transmission,s.status,s.progress.preTrip,s.progress.maneuvers,s.progress.roadDriving,avgProg(s),s.totalPrice,totalPaid(s),balance(s),s.dmv?.result||"Pendiente",fmtDate(s.dmv?.actualDate)].join(","));
    const h="Nombre,Teléfono,Email,Clase,Transmisión,Estado,Pre-trip,Maniobras,Manejo,Promedio,Precio,Pagado,Balance,DMV Resultado,DMV Fecha";
    const a=document.createElement("a");a.href=URL.createObjectURL(new Blob([[h,...rows].join("\n")],{type:"text/csv"}));a.download=`FTDS_Reporte_Completo_${today}.csv`;a.click();
  };

  return(<div className="pg">
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:22}}>
      <div><h1 style={{fontSize:26,fontWeight:800,color:"var(--text)",fontFamily:"'Inter',sans-serif",letterSpacing:"-.02em"}}>Reportes & Analytics</h1><p style={{color:"var(--text3)",fontSize:13.5,marginTop:3}}>Análisis completo del desempeño escolar</p></div>
      <button className="btn bp" onClick={exportFull}><Ico n="download" s={14}/>Exportar Reporte Completo CSV</button>
    </div>
    <div className="g4" style={{marginBottom:20}}>
      {[["Total Estudiantes",total,"var(--accent)",""],["Activos",active,"var(--teal)",""],["Graduados",graduated,"var(--green)",""],["Tasa DMV",`${dmvRate}%`,"var(--purple)",""]].map(([l,v,c,icon],i)=>(
        <div key={i} className="kpi" style={{"--kpi-clr":c}}>
          <div style={{display:"flex",justifyContent:"space-between",marginBottom:8}}><div style={{fontSize:10.5,fontWeight:700,color:"var(--text3)",textTransform:"uppercase",letterSpacing:".06em"}}>{l}</div><div style={{fontSize:22}}>{icon}</div></div>
          <div style={{fontSize:28,fontWeight:900,color:c,fontFamily:"'Inter',sans-serif"}}>{v}</div>
        </div>
      ))}
    </div>

    {/* INGRESOS MENSUALES — BARRA CHART */}
    <div className="card cp sh" style={{marginBottom:20}}>
      <div style={{fontWeight:700,fontSize:15,color:"var(--text)",marginBottom:16,display:"flex",alignItems:"center",gap:8}}><Ico n="trending" s={15} c="var(--green)"/>Ingresos por Mes (últimos 6 meses)</div>
      <div style={{display:"flex",alignItems:"flex-end",gap:8,height:140,padding:"0 4px"}}>
        {months.map(m=>(
          <div key={m.label} style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",gap:5}}>
            <div style={{fontSize:11,fontWeight:700,color:"var(--text2)"}}>{m.rev>0?fmtCur(m.rev):""}</div>
            <div style={{width:"100%",background:`linear-gradient(180deg,var(--green),rgba(22,163,74,.7))`,borderRadius:"6px 6px 0 0",height:`${(m.rev/maxRev)*100}%`,minHeight:4,transition:"height .7s ease",boxShadow:"0 4px 12px rgba(22,163,74,.3)"}}/>
            <div style={{fontSize:11,color:"var(--text3)",fontWeight:600,textTransform:"capitalize"}}>{m.label}</div>
          </div>
        ))}
      </div>
    </div>

    <div className="g2" style={{marginBottom:20}}>
      <div className="card cp sh">
        <div style={{fontWeight:700,fontSize:14.5,color:"var(--text)",marginBottom:14,display:"flex",alignItems:"center",gap:8}}><Ico n="chart" s={13} c="var(--accent)"/>Distribución por Clase CDL</div>
        {byClass.filter(c=>c.n>0).map(c=>(
          <div key={c.label} style={{marginBottom:12}}>
            <div style={{display:"flex",justifyContent:"space-between",marginBottom:5,fontSize:13}}><span style={{color:"var(--text2)",fontWeight:600}}>{c.label}</span><span style={{fontWeight:700,color:"var(--accent)"}}>{c.n} ({total?Math.round(c.n/total*100):0}%)</span></div>
            <div className="pt ptlg"><div className="pf" style={{width:`${total?(c.n/total*100):0}%`,background:"linear-gradient(135deg,var(--accent),#1d4ed8)"}}/></div>
          </div>
        ))}
        {byTrans.filter(t=>t.n>0).map(t=>(
          <div key={t.label} style={{marginBottom:12}}>
            <div style={{display:"flex",justifyContent:"space-between",marginBottom:5,fontSize:13}}><span style={{color:"var(--text2)",fontWeight:600}}>{t.label}</span><span style={{fontWeight:700,color:"var(--purple)"}}>{t.n} ({total?Math.round(t.n/total*100):0}%)</span></div>
            <div className="pt ptlg"><div className="pf" style={{width:`${total?(t.n/total*100):0}%`,background:"linear-gradient(135deg,var(--purple),#6d28d9)"}}/></div>
          </div>
        ))}
      </div>
      <div className="card cp sh">
        <div style={{fontWeight:700,fontSize:14.5,color:"var(--text)",marginBottom:14,display:"flex",alignItems:"center",gap:8}}><Ico n="receipt" s={13} c="var(--green)"/>Resumen Financiero</div>
        {[["Ingresos Totales",fmtCur(totalRev),"var(--green)"],["Balance Pendiente",fmtCur(totalBal),"var(--red)"],["Progreso Promedio",`${avgProgress}%`,"var(--accent)"],["Tasa Graduación",total?`${Math.round(graduated/total*100)}%`:"0%","var(--teal)"],["Exámenes DMV",`${dmvStats.pass}✓ / ${dmvStats.fail}✗`,"var(--text2)"]].map(([k,v,c])=>(
          <div key={k} style={{display:"flex",justifyContent:"space-between",padding:"10px 0",borderBottom:"1px solid var(--border2)",fontSize:13.5}}>
            <span style={{color:"var(--text3)",fontWeight:500}}>{k}</span>
            <span style={{fontWeight:800,color:c,fontFamily:"'Inter',sans-serif"}}>{v}</span>
          </div>
        ))}
        <div style={{marginTop:16,padding:14,background:"rgba(37,99,235,.06)",borderRadius:12,border:"1px solid rgba(37,99,235,.12)"}}>
          <div style={{fontSize:10.5,fontWeight:700,color:"var(--accent)",textTransform:"uppercase",letterSpacing:".07em",marginBottom:8}}>Estados Activos</div>
          {Object.entries(STATUS_META).map(([k,v])=>{const n=students.filter(s=>s.status===k).length;if(!n)return null;return(
            <div key={k} style={{display:"flex",justifyContent:"space-between",fontSize:12.5,marginBottom:5}}>
              <span style={{color:"var(--text2)"}}>{v.icon} {v.label}</span>
              <span style={{fontWeight:700,color:v.color,background:v.bg,padding:"1px 8px",borderRadius:7,fontSize:11}}>{n}</span>
            </div>
          );})}
        </div>
      </div>
    </div>
  </div>);
}


// ─── AI PAGE ──────────────────────────────────────────────────────────────────
function AIPage({students}) {
  const {dark,lang,t} = useApp();
  const [msgs,setMsgs]=useState([{role:"assistant",text:`¡Hola! Soy el asistente IA de TDSuite. Actualmente hay **${students.length} estudiantes** registrados.\n\nPuedo ayudarte con:\n• 📊 Análisis de progreso y estadísticas\n• 💰 Consultas de pagos y balances\n• 🚛 Estado de candidatos para DMV\n• 📋 Resúmenes de estudiantes individuales\n• 🎯 Recomendaciones y alertas\n\n¿En qué puedo ayudarte hoy?`}]);
  const [input,setInput]=useState(""); const [loading,setLoading]=useState(false); const bottomRef=useRef(); const inputRef=useRef();
  useEffect(()=>{bottomRef.current?.scrollIntoView({behavior:"smooth"});},[msgs]);

  const getContext=()=>{
    const stats={total:students.length,active:students.filter(s=>!["Inactive","Passed / Graduated"].includes(s.status)).length,graduated:students.filter(s=>s.status==="Passed / Graduated").length,dmvCandidates:students.filter(s=>isDMVReady(s)).length,totalBalance:students.reduce((a,s)=>a+balance(s),0),avgProg:students.length?Math.round(students.reduce((a,s)=>a+avgProg(s),0)/students.length):0};
    const list=students.slice(0,30).map(s=>`${s.fullName}|${s.courseType}|${s.transmission}|${s.status}|PT:${s.progress.preTrip}%|Man:${s.progress.maneuvers}%|RD:${s.progress.roadDriving}%|Bal:$${balance(s)}`).join("\n");
    return `Eres el asistente de TDSuite para Felipe's Truck Driving School (Director: Jahaziel Mokay, Hialeah FL). Responde siempre en español de manera profesional y concisa.\n\nESTADÍSTICAS GLOBALES:\n- Total: ${stats.total} | Activos: ${stats.active} | Graduados: ${stats.graduated}\n- Candidatos DMV: ${stats.dmvCandidates} | Balance pendiente total: $${stats.totalBalance} | Progreso promedio: ${stats.avgProg}%\n\nESTUDIANTES (primeros 30):\n${list||"Sin estudiantes"}`;
  };

  const send=async()=>{
    if(!input.trim()||loading)return;
    const userMsg=input.trim(); setInput("");
    setMsgs(p=>[...p,{role:"user",text:userMsg}]);
    setLoading(true);
    try {
      const history=msgs.filter(m=>m.role!=="assistant"||msgs.indexOf(m)>0).slice(-10).map(m=>({role:m.role==="assistant"?"assistant":"user",content:m.text}));
      const text=await callAI(getContext(),[...history,{role:"user",content:userMsg}]);
      setMsgs(p=>[...p,{role:"assistant",text}]);
    } catch(e) {
      setMsgs(p=>[...p,{role:"assistant",text:`❌ Error: ${e.message}\n\nVerifica que REACT_APP_ANTHROPIC_API_KEY esté en el archivo .env`}]);
    }
    setLoading(false);
    inputRef.current?.focus();
  };

  const quickBtns=[["¿Quiénes están listos para el DMV?"],["Resumen de balances pendientes"],["¿Quién tiene documentos faltantes?"],["Estadísticas generales del sistema"],["¿Quién necesita más práctica?"]];

  return(<div className="pg" style={{height:"calc(100vh - 40px)",display:"flex",flexDirection:"column"}}>
    <div style={{marginBottom:16,flexShrink:0}}>
      <h1 style={{fontSize:26,fontWeight:800,color:"var(--text)",fontFamily:"'Inter',sans-serif"}}>Asistente IA</h1>
      <p style={{color:"var(--text3)",fontSize:13.5,marginTop:3}}>Consultas inteligentes sobre tu escuela — {students.length} estudiantes en contexto</p>
    </div>
    <div className="card sh" style={{flex:1,display:"flex",flexDirection:"column",overflow:"hidden"}}>
      <div style={{flex:1,overflowY:"auto",padding:20,display:"flex",flexDirection:"column",gap:14}}>
        {msgs.map((m,i)=>(
          <div key={i} style={{display:"flex",gap:12,justifyContent:m.role==="user"?"flex-end":"flex-start",animation:"fadeUp .3s ease"}}>
            {m.role==="assistant"&&<div style={{width:38,height:38,borderRadius:"50%",background:"linear-gradient(135deg,#2563eb,#7c3aed)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:15,flexShrink:0}}>🤖</div>}
            <div style={{maxWidth:"78%",padding:"13px 16px",borderRadius:m.role==="user"?"18px 18px 4px 18px":"18px 18px 18px 4px",background:m.role==="user"?"linear-gradient(135deg,#2563eb,#1d4ed8)":"var(--surface2)",color:m.role==="user"?"#fff":"var(--text)",boxShadow:"0 2px 10px rgba(0,0,0,.1)",border:m.role==="user"?"none":`1px solid var(--border)`,fontSize:13.5,lineHeight:1.65,whiteSpace:"pre-wrap"}}>
              {m.text}
            </div>
            {m.role==="user"&&<div style={{width:38,height:38,borderRadius:"50%",background:"linear-gradient(135deg,#1a3a6b,#2563eb)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:16,flexShrink:0}}>👤</div>}
          </div>
        ))}
        {loading&&(
          <div style={{display:"flex",gap:12}}>
            <div style={{width:38,height:38,borderRadius:"50%",background:"linear-gradient(135deg,#2563eb,#7c3aed)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:15}}>🤖</div>
            <div style={{padding:"13px 18px",background:"var(--surface2)",border:"1px solid var(--border)",borderRadius:"18px 18px 18px 4px",display:"flex",gap:5,alignItems:"center"}}>
              {[0,1,2].map(i=><div key={i} style={{width:8,height:8,borderRadius:"50%",background:"var(--accent)",animation:`blink 1.4s ${i*.2}s infinite`}}/>)}
            </div>
          </div>
        )}
        <div ref={bottomRef}/>
      </div>
      {/* Quick buttons */}
      <div style={{padding:"10px 20px",borderTop:"1px solid var(--border2)",display:"flex",gap:7,flexWrap:"wrap",background:dark?"rgba(0,0,0,.15)":"var(--surface2)"}}>
        {quickBtns.map(([q])=>(
          <button key={q} onClick={()=>setInput(q)} style={{background:dark?"rgba(37,99,235,.12)":"#eff6ff",border:"1px solid rgba(37,99,235,.2)",borderRadius:20,padding:"5px 13px",fontSize:12,color:"var(--accent)",fontWeight:600,cursor:"pointer",fontFamily:"inherit",whiteSpace:"nowrap"}}>
            {q}
          </button>
        ))}
      </div>
      <div style={{padding:"12px 16px",borderTop:"1px solid var(--border)",display:"flex",gap:10}}>
        <input ref={inputRef} className="inp" value={input} onChange={e=>setInput(e.target.value)} onKeyDown={e=>{if(e.key==="Enter"&&!e.shiftKey){e.preventDefault();send();}}} placeholder="Pregunta sobre tus estudiantes, pagos, estadísticas..." style={{flex:1}} disabled={loading}/>
        <button className="btn bp" onClick={send} disabled={loading||!input.trim()} style={{padding:"10px 18px"}}><Ico n="send" s={15}/>Enviar</button>
      </div>
    </div>
  </div>);
}

// ─── NOTIFICATIONS PAGE ───────────────────────────────────────────────────────
function NotifsPage({notifs,markRead}) {
  const {dark,lang,t} = useApp();
  const typeIcon={success:"✅",error:"❌",warning:"⚠️",info:"ℹ️"};
  return(<div className="pg">
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:22}}>
      <div><h1 style={{fontSize:26,fontWeight:800,color:"var(--text)",fontFamily:"'Inter',sans-serif"}}>Notificaciones</h1><p style={{color:"var(--text3)",fontSize:13.5,marginTop:3}}>{notifs.filter(n=>!n.read).length} sin leer · {notifs.length} total</p></div>
      {notifs.filter(n=>!n.read).length>0&&<button className="btn bo" onClick={markRead}><Ico n="check" s={13}/>Marcar todas leídas</button>}
    </div>
    <div className="card sh">
      {notifs.length===0?(
        <div style={{textAlign:"center",color:"var(--text3)",padding:"48px"}}>
          <div style={{fontSize:40,marginBottom:10}}>🔔</div>
          <div style={{fontWeight:600,fontSize:14}}>Sin notificaciones</div>
        </div>
      ):notifs.map(n=>(
        <div key={n.id} style={{padding:"16px 20px",borderBottom:"1px solid var(--border2)",background:n.read?"transparent":(dark?"rgba(37,99,235,.04)":"rgba(37,99,235,.03)"),display:"flex",gap:14,alignItems:"flex-start",transition:"background .2s"}}>
          <div style={{fontSize:20,flexShrink:0,marginTop:2}}>{typeIcon[n.type]||"ℹ️"}</div>
          <div style={{flex:1}}>
            <div style={{fontWeight:700,color:"var(--text)",fontSize:14,marginBottom:3}}>{n.title}</div>
            <div style={{fontSize:13,color:"var(--text2)",lineHeight:1.5}}>{n.body}</div>
            <div style={{fontSize:11,color:"var(--text3)",marginTop:5}}>{timeAgo(n.time)}</div>
          </div>
          {!n.read&&<div style={{width:8,height:8,borderRadius:"50%",background:"var(--accent)",flexShrink:0,marginTop:6}}/>}
        </div>
      ))}
    </div>
  </div>);
}


// ─── SIGNATURE PAD ────────────────────────────────────────────────────────────

// ─── PAYMENT SCHEDULE EDITOR ─────────────────────────────────────────────────

// ─── PRE-TRIP SESSION REGISTER (estilo CDLCore) ───────────────────────────────
// Registro individual de sesión de pre-trip con items evaluados uno por uno

const BLANK_STUDENT=()=>({
  fullName:"", phone:"", email:"", dob:"", address:"",
  licenseNumber:"", licenseExpiry:"", clpNumber:"", clpExpiry:"",
  contractDate:today, courseStartDate:today, completionDate:"", courseType:"Class A",
  transmission:"Manual", schedule:"Regular", totalPrice:0, downPayment:0,
  profilePhoto:"", representativeName:"Jahaziel Mokay", representativeDate:today,
  status:"Contract Signed",
  paymentSchedule:[],
  progress:{preTrip:0,maneuvers:0,roadDriving:0,pretripCats:initPT(),maneuverCats:initMan(),pretripItems:[],pretripSessions:[],history:[]},
  documents:{contract:false,license:false,clp:false,medicalCard:false,drugTest:false,eldt:false},
  docFiles:{profilePhoto:null,license:null,permit:null,medicalCard:null,drugTest:null,additional:[]},
  payments:[], attendance:[], notes:[],
  dmv:{truckAssigned:"White Truck (Automatic)",actualDate:"",time:"",location:"",result:"",attempt:1,failedArea:"",reTestDate:""},
});

// ─── WIZARD (REGISTRO CON OCR) ────────────────────────────────────────────────
const OCR_STEPS=[
  {id:"contract",   label:"Contrato",    docKey:"contract",    emoji:"📋"},
  {id:"license",    label:"Licencia",    docKey:"license",     emoji:"🪪"},
  {id:"clp",        label:"CLP",         docKey:"clp",         emoji:""},
  {id:"medicalCard",label:"Medical Card",docKey:"medicalCard", emoji:"🏥"},
  {id:"drugTest",   label:"Drug Test",   docKey:"drugTest",    emoji:"🧪"},
  {id:"eldt",       label:"ELDT/LTC",    docKey:"eldt",        emoji:""},
];






// ─── SIGNATUREPAD ───
function SignaturePad({onSave,onCancel}) {
  const {dark,lang,t} = useApp();
  const canvasRef=useRef(); const drawing=useRef(false); const lastPos=useRef(null);
  const [hasStrokes,setHasStrokes]=useState(false);

  useEffect(()=>{
    const canvas=canvasRef.current; if(!canvas) return;
    const ctx=canvas.getContext("2d");
    ctx.fillStyle=dark?"#111f35":"#ffffff"; ctx.fillRect(0,0,canvas.width,canvas.height);
    ctx.strokeStyle=dark?"#e2eaf6":"#0a1628"; ctx.lineWidth=2.5; ctx.lineCap="round"; ctx.lineJoin="round";
  },[dark]);

  const getPos=(e,canvas)=>{
    const rect=canvas.getBoundingClientRect();
    const t=e.touches?e.touches[0]:e;
    return{x:(t.clientX-rect.left)*(canvas.width/rect.width),y:(t.clientY-rect.top)*(canvas.height/rect.height)};
  };
  const start=(e)=>{e.preventDefault();drawing.current=true;lastPos.current=getPos(e,canvasRef.current);setHasStrokes(true);};
  const move=(e)=>{
    e.preventDefault(); if(!drawing.current)return;
    const canvas=canvasRef.current; const ctx=canvas.getContext("2d");
    const pos=getPos(e,canvas);
    ctx.beginPath(); ctx.moveTo(lastPos.current.x,lastPos.current.y); ctx.lineTo(pos.x,pos.y); ctx.stroke();
    lastPos.current=pos;
  };
  const end=(e)=>{e.preventDefault();drawing.current=false;};
  const clear=()=>{
    const canvas=canvasRef.current; const ctx=canvas.getContext("2d");
    ctx.fillStyle=dark?"#111f35":"#ffffff"; ctx.fillRect(0,0,canvas.width,canvas.height);
    setHasStrokes(false);
  };
  const save=()=>{
    const dataUrl=canvasRef.current.toDataURL("image/png");
    onSave(dataUrl);
  };

  return(
    <div className="ov"><div className="md md-sm" style={{textAlign:"center"}}>
      <div style={{fontWeight:800,fontSize:20,color:"var(--text)",marginBottom:5}}>Firma Digital</div>
      <div style={{fontSize:12.5,color:"var(--text3)",marginBottom:14}}>Firma con el dedo o el mouse</div>
      <div style={{border:`2px solid ${hasStrokes?"var(--accent)":"var(--border)"}`,borderRadius:12,overflow:"hidden",cursor:"crosshair",background:dark?"#111f35":"#fff",marginBottom:12,touchAction:"none"}}>
        <canvas ref={canvasRef} width={460} height={160} style={{display:"block",width:"100%",height:160}}
          onMouseDown={start} onMouseMove={move} onMouseUp={end} onMouseLeave={end}
          onTouchStart={start} onTouchMove={move} onTouchEnd={end}/>
      </div>
      <div style={{display:"flex",gap:10}}>
        <button className="btn bo" style={{flex:1}} onClick={onCancel}>{lang==="es"?"Cancelar":"Cancel"}</button>
        <button className="btn bo" style={{flex:1}} onClick={clear}>Borrar</button>
        <button className="btn bp" style={{flex:2}} onClick={save} disabled={!hasStrokes}>Guardar Firma</button>
      </div>
    </div></div>
  );
}


// ─── PAYMENTSCHEDULEEDITOR ───
function PaymentScheduleEditor({schedule,onChange,totalPrice,paid}) {
  const {dark,lang,t} = useApp();
  const addRow=()=>onChange([...schedule,{id:Date.now(),dueDate:"",amount:"",method:"Zelle",notes:""}]);
  const updateRow=(id,field,val)=>onChange(schedule.map(r=>r.id===id?{...r,[field]:val}:r));
  const removeRow=(id)=>onChange(schedule.filter(r=>r.id!==id));
  const schedTotal=schedule.reduce((a,r)=>a+(+r.amount||0),0);
  const remaining=(totalPrice||0)-paid-schedTotal;

  return(
    <div>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
        <div className="sec" style={{margin:0}}>Plan de Pagos</div>
        <button className="btn bp bsm" onClick={addRow}><Ico n="plus" s={12}/>Agregar Cuota</button>
      </div>
      {schedule.length===0?(
        <div style={{textAlign:"center",color:"var(--text3)",fontSize:13,padding:"18px",background:"var(--surface2)",borderRadius:10,border:"1px dashed var(--border)",marginBottom:10}}>
          Sin plan de pagos. Agrega cuotas programadas.
        </div>
      ):(
        <div style={{overflowX:"auto",marginBottom:10}}>
          <table style={{width:"100%",borderCollapse:"collapse",fontSize:12.5}}>
            <thead>
              <tr style={{background:"var(--surface2)"}}>
                {["Fecha Vencimiento","Monto","Método","Notas",""].map(h=>(
                  <th key={h} style={{padding:"8px 10px",textAlign:"left",fontSize:10.5,fontWeight:700,color:"var(--text3)",textTransform:"uppercase",letterSpacing:".06em",borderBottom:"2px solid var(--border)",whiteSpace:"nowrap"}}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {schedule.map((r,i)=>(
                <tr key={r.id} style={{borderBottom:"1px solid var(--border2)"}}>
                  <td style={{padding:"7px 8px"}}><input type="date" className="inp" style={{padding:"5px 8px",fontSize:12}} value={r.dueDate} onChange={e=>updateRow(r.id,"dueDate",e.target.value)}/></td>
                  <td style={{padding:"7px 8px"}}><input type="number" className="inp" style={{padding:"5px 8px",fontSize:12,width:90}} placeholder="$0" value={r.amount} onChange={e=>updateRow(r.id,"amount",e.target.value)}/></td>
                  <td style={{padding:"7px 8px"}}>
                    <select className="sel" style={{padding:"5px 8px",fontSize:12,width:90}} value={r.method} onChange={e=>updateRow(r.id,"method",e.target.value)}>
                      <option>Zelle</option><option>Check</option><option>Cash</option><option>Card</option><option>Square</option>
                    </select>
                  </td>
                  <td style={{padding:"7px 8px"}}><input className="inp" style={{padding:"5px 8px",fontSize:12,width:130}} placeholder="Nota opcional..." value={r.notes} onChange={e=>updateRow(r.id,"notes",e.target.value)}/></td>
                  <td style={{padding:"7px 8px"}}><button className="btn bgh bsm" style={{color:"var(--red)",padding:"4px 7px"}} onClick={()=>removeRow(r.id)}><Ico n="trash" s={11}/></button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <div style={{display:"flex",gap:16,fontSize:13,padding:"10px 14px",background:"var(--surface2)",borderRadius:10,border:"1px solid var(--border)"}}>
        <span style={{color:"var(--text3)"}}>En plan: <b style={{color:"var(--accent)"}}>{fmtCur(schedTotal)}</b></span>
        <span style={{color:"var(--text3)"}}>Pagado: <b style={{color:"var(--green)"}}>{fmtCur(paid)}</b></span>
        <span style={{color:"var(--text3)"}}>Restante: <b style={{color:remaining>0?"var(--red)":"var(--green)"}}>{fmtCur(remaining)}</b></span>
      </div>
    </div>
  );
}


// ─── PRETRIPSESSIONMODAL ───
function PreTripSessionModal({s,updateStudent,onClose}) {
  const {dark,lang,t} = useApp();
  const DEFAULT_ITEMS = [
    "Engine compartment / fluids",
    "Steering / suspension",
    "Brakes / air pressure",
    "Lights / reflectors",
    "Tires / wheels / rims",
    "Fuel / exhaust",
    "Cab / interior",
    "Coupling / fifth wheel",
    "Trailer brakes",
    "Emergency equipment",
  ];

  const [items, setItems] = useState(()=>{
    const prev = (s.progress.pretripItems||[]);
    if(prev.length > 0) return prev.map(it=>({...it, checked:false}));
    return DEFAULT_ITEMS.map((label,i)=>({id:i+1, label, checked:false}));
  });
  const [newItem, setNewItem] = useState("");
  const [instructor, setInstructor] = useState("Admin");
  const [date, setDate] = useState(today);
  const [note, setNote] = useState("");

  const checked = items.filter(it=>it.checked).length;
  const score = items.length > 0 ? Math.round((checked/items.length)*100) : 0;

  const addItem = () => {
    if(!newItem.trim()) return;
    setItems(p=>[...p,{id:Date.now(),label:newItem.trim(),checked:false}]);
    setNewItem("");
  };

  const saveSession = () => {
    const session = {
      id: Date.now(),
      date, instructor, note,
      score,
      itemsTotal: items.length,
      itemsChecked: checked,
      items: items.map(it=>({...it})),
    };
    // Guardar el estado de items para futuras sesiones y actualizar score
    const newHistory = [...(s.progress.history||[]), {date, by:instructor, ptScore:score, manScore:s.progress.maneuvers, rdScore:s.progress.roadDriving}];
    const newSessions = [...(s.progress.pretripSessions||[]), session];
    updateStudent({
      ...s,
      progress:{
        ...s.progress,
        preTrip: score,
        pretripItems: items.map(it=>({...it, checked:false})),
        pretripSessions: newSessions,
        history: newHistory,
      }
    });
    onClose();
  };

  return(
    <div className="ov">
      <div className="md md-lg" style={{maxHeight:"90vh",overflow:"auto"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20}}>
          <div>
            <div style={{fontWeight:800,fontSize:20,color:"var(--text)",fontFamily:"'Inter',sans-serif"}}>Pre-Trip Register</div>
            <div style={{fontSize:12.5,color:"var(--text3)",marginTop:3}}>{s.fullName} — Sesión individual</div>
          </div>
          <div style={{textAlign:"center",background:score>=75?"rgba(22,163,74,.1)":"rgba(37,99,235,.1)",borderRadius:14,padding:"10px 20px",border:`1.5px solid ${score>=75?"rgba(22,163,74,.25)":"rgba(37,99,235,.2)"}`}}>
            <div style={{fontSize:36,fontWeight:900,color:score>=75?"var(--green)":"var(--accent)",fontFamily:"'Inter',sans-serif",lineHeight:1}}>{score}%</div>
            <div style={{fontSize:10.5,color:"var(--text3)",marginTop:2}}>{checked}/{items.length} items</div>
          </div>
        </div>

        {/* Progress bar */}
        <div style={{marginBottom:18}}>
          <div className="pt" style={{height:10,borderRadius:6,marginBottom:6}}>
            <div className="pf" style={{width:`${score}%`,background:score>=75?"var(--green)":"var(--accent)",transition:"width .3s"}}/>
          </div>
          {score>=75&&<div style={{fontSize:12,color:"var(--green)",fontWeight:700,textAlign:"center"}}>Pre-trip completado</div>}
        </div>

        {/* Session info */}
        <div className="g3" style={{marginBottom:16,gap:10}}>
          <div><label className="lbl">Fecha</label><input type="date" className="inp" value={date} onChange={e=>setDate(e.target.value)}/></div>
          <div><label className="lbl">Instructor</label><input className="inp" value={instructor} onChange={e=>setInstructor(e.target.value)} placeholder="Nombre del instructor"/></div>
          <div><label className="lbl">Nota</label><input className="inp" value={note} onChange={e=>setNote(e.target.value)} placeholder="Observaciones..."/></div>
        </div>

        {/* Items list */}
        <div className="card" style={{padding:14,marginBottom:14}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
            <div style={{fontSize:12,fontWeight:700,color:"var(--text3)",textTransform:"uppercase",letterSpacing:".07em"}}>Items de Inspección</div>
            <button className="btn bgh bsm" onClick={()=>setItems(DEFAULT_ITEMS.map((l,i)=>({id:i+1,label:l,checked:false})))}>
              <Ico n="refresh" s={11}/>Resetear
            </button>
          </div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:6}}>
            {items.map(item=>(
              <label key={item.id} style={{display:"flex",alignItems:"center",gap:10,padding:"9px 12px",borderRadius:9,border:`1.5px solid ${item.checked?"var(--green)":"var(--border)"}`,background:item.checked?"rgba(22,163,74,.06)":"transparent",cursor:"pointer",transition:"all .15s"}}>
                <input type="checkbox" checked={item.checked} onChange={e=>setItems(p=>p.map(it=>it.id===item.id?{...it,checked:e.target.checked}:it))} style={{accentColor:"var(--green)",width:16,height:16,cursor:"pointer",flexShrink:0}}/>
                <span style={{fontSize:13,color:item.checked?"var(--green)":"var(--text2)",fontWeight:item.checked?600:400,flex:1}}>{item.label}</span>
                <button onClick={e=>{e.preventDefault();e.stopPropagation();setItems(p=>p.filter(it=>it.id!==item.id));}} style={{background:"none",border:"none",color:"var(--text3)",cursor:"pointer",padding:2,opacity:.5,flexShrink:0}}><Ico n="x" s={10}/></button>
              </label>
            ))}
          </div>

          {/* Add custom item */}
          <div style={{display:"flex",gap:8,marginTop:12,paddingTop:12,borderTop:"1px solid var(--border2)"}}>
            <input className="inp" value={newItem} onChange={e=>setNewItem(e.target.value)} onKeyDown={e=>e.key==="Enter"&&addItem()} placeholder="Agregar item personalizado..." style={{flex:1}}/>
            <button className="btn bp bsm" onClick={addItem} disabled={!newItem.trim()}><Ico n="plus" s={13}/>Add Item</button>
          </div>
        </div>

        {/* Historial de sesiones anteriores */}
        {(s.progress.pretripSessions||[]).length>0&&(
          <div style={{marginBottom:14}}>
            <div style={{fontSize:11,fontWeight:700,color:"var(--text3)",textTransform:"uppercase",letterSpacing:".07em",marginBottom:8}}>Sesiones Anteriores</div>
            <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
              {[...(s.progress.pretripSessions||[])].reverse().slice(0,6).map(sess=>(
                <div key={sess.id} style={{padding:"6px 12px",background:"var(--surface2)",border:"1px solid var(--border)",borderRadius:8,fontSize:12}}>
                  <span style={{color:"var(--text3)"}}>{fmtDate(sess.date)}</span>
                  <span style={{fontWeight:700,color:sess.score>=75?"var(--green)":"var(--yellow)",marginLeft:8}}>{sess.score}%</span>
                </div>
              ))}
            </div>
          </div>
        )}

        <div style={{display:"flex",gap:10}}>
          <button className="btn bo" style={{flex:1}} onClick={onClose}>{lang==="es"?"Cancelar":"Cancel"}</button>
          <button className="btn bp" style={{flex:2}} onClick={saveSession}>
            <Ico n="check" s={14}/>Guardar Sesión ({score}% — {checked}/{items.length} items)
          </button>
        </div>
      </div>
    </div>
  );
}


// ─── WIZARD ───
function Wizard({onSave,onCancel,dark:darkProp,lang:langProp}) {
  const ctx = useApp();
  const dark = darkProp !== undefined ? darkProp : ctx.dark;
  const lang = langProp !== undefined ? langProp : ctx.lang;
  const t = ctx.t;
  const [step,setStep]=useState(-1); // -1 = manual, -2 = choose
  const [data,setData]=useState(BLANK_STUDENT());
  const [uploads,setUploads]=useState({});
  const [loading,setLoading]=useState(false);
  const [useOCR,setUseOCR]=useState(null);

  const CSS=getCSS(dark);

  const mergeExtracted=(extracted)=>{
    setData(prev=>{
      const n={...prev};
      if(extracted.fullName&&!n.fullName) n.fullName=extracted.fullName;
      if(extracted.dob&&!n.dob) n.dob=extracted.dob;
      if(extracted.address&&!n.address) n.address=extracted.address;
      if(extracted.licenseNumber&&!n.licenseNumber) n.licenseNumber=extracted.licenseNumber;
      if(extracted.licenseExpiry&&!n.licenseExpiry) n.licenseExpiry=extracted.licenseExpiry;
      if(extracted.clpNumber&&!n.clpNumber) n.clpNumber=extracted.clpNumber;
      if(extracted.clpExpiry&&!n.clpExpiry) n.clpExpiry=extracted.clpExpiry;
      if(extracted.contractDate&&!n.contractDate) n.contractDate=extracted.contractDate;
      if(extracted.courseStartDate&&!n.courseStartDate) n.courseStartDate=extracted.courseStartDate;
      if(extracted.totalPrice&&!n.totalPrice) n.totalPrice=extracted.totalPrice;
      if(extracted.courseType) n.courseType=extracted.courseType;
      if(extracted.transmission) n.transmission=extracted.transmission;
      if(extracted.downPayment&&extracted.downPayment>0) n.downPayment=extracted.downPayment;
      return n;
    });
  };

  const handleFile=async(stepId,docKey,file)=>{
    const mime=file.type||"image/jpeg";
    setUploads(p=>({...p,[stepId]:{loading:true}}));
    setLoading(true);
    try {
      const b64=await fileToB64(file);
      const extracted=await ocrExtract(b64,docKey,mime);
      setData(prev=>{
        const nd={...prev,documents:{...prev.documents,[docKey]:true}};
        return nd;
      });
      mergeExtracted(extracted);
      setUploads(p=>({...p,[stepId]:{done:true,extracted}}));
    } catch(e) {
      setUploads(p=>({...p,[stepId]:{error:true}}));
    }
    setLoading(false);
  };

  const canSave=()=>data.fullName.trim().length>2&&data.totalPrice>0;

  const finalSave=()=>{
    let ns={...data};
    if(ns.downPayment>0&&ns.payments.length===0){
      ns.payments=[{id:Date.now(),date:ns.contractDate||today,amount:ns.downPayment,method:"Cash",registeredBy:"Admin",note:"Pago inicial al registro"}];
    }
    // Si DMV ya estaba programado en el wizard
    if(ns.dmvScheduled&&ns.dmv?.actualDate) {
      ns.status="DMV Scheduled";
      ns.dmv={...ns.dmv,result:"Scheduled"};
    }
    const docsComplete=Object.values(ns.documents).every(Boolean);
    if(!ns.dmvScheduled) {
      if(docsComplete&&ns.status==="Contract Signed") ns.status="Active Training";
      else if(!docsComplete) ns.status="Pending Documents";
    }
    onSave(ns);
  };

  // CHOOSE MODE
  if(useOCR===null) return(
    <div style={{minHeight:"100vh",background:"var(--bg)",display:"flex",alignItems:"center",justifyContent:"center",padding:24,fontFamily:"'Plus Jakarta Sans',sans-serif"}}>
      <style>{CSS}</style>
      <div style={{width:"100%",maxWidth:560}}>
        <div style={{textAlign:"center",marginBottom:32}}>
          <div style={{display:"flex",alignItems:"center",justifyContent:"center",gap:12,marginBottom:16}}>
            <img src={SCHOOL_LOGO} alt="" style={{width:44,height:44,borderRadius:12,objectFit:"contain"}}/>
            <div style={{fontSize:20,fontWeight:900,color:"var(--text)",fontFamily:"'Inter',sans-serif"}}>TDSuite</div>
          </div>
          <h1 style={{fontSize:26,fontWeight:800,color:"var(--text)",fontFamily:"'Inter',sans-serif",marginBottom:8}}>Registrar Nuevo Estudiante</h1>
          <p style={{color:"var(--text3)",fontSize:14}}>¿Cómo deseas ingresar los datos?</p>
        </div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14}}>
          {[[true,"📸 Escanear con IA","Sube fotos de los documentos y la IA extrae los datos automáticamente","Requiere API Key"],
            [false,"✏️ Ingresar Manual","Escribe los datos del estudiante directamente en el formulario","Rápido y siempre disponible"]
          ].map(([mode,title,desc,note])=>(
            <button key={String(mode)} onClick={()=>{setUseOCR(mode);if(!mode)setStep(-1);else setStep(0);}} style={{padding:24,border:"1.5px solid var(--border)",borderRadius:16,background:"var(--surface)",cursor:"pointer",textAlign:"left",transition:"all .2s",fontFamily:"inherit"}}
              onMouseOver={e=>{e.currentTarget.style.borderColor="var(--accent)";e.currentTarget.style.background=dark?"rgba(37,99,235,.06)":"#eff6ff";}}
              onMouseOut={e=>{e.currentTarget.style.borderColor="var(--border)";e.currentTarget.style.background="var(--surface)";}}>
              <div style={{fontSize:32,marginBottom:10}}>{title.split(" ")[0]}</div>
              <div style={{fontSize:15,fontWeight:700,color:"var(--text)",marginBottom:6}}>{title.slice(2)}</div>
              <div style={{fontSize:12.5,color:"var(--text3)",lineHeight:1.5,marginBottom:8}}>{desc}</div>
              <div style={{fontSize:11,color:"var(--accent)",fontWeight:600,background:dark?"rgba(37,99,235,.1)":"#eff6ff",padding:"4px 10px",borderRadius:6,border:"1px solid rgba(37,99,235,.2)",display:"inline-block"}}>{note}</div>
            </button>
          ))}
        </div>
        <button className="btn bo" style={{width:"100%",justifyContent:"center",marginTop:14}} onClick={onCancel}>{lang==="es"?"Cancelar":"Cancel"}</button>
      </div>
    </div>
  );

  // OCR STEPS
  if(useOCR&&step>=0&&step<OCR_STEPS.length) {
    const s=OCR_STEPS[step];
    const up=uploads[s.id];
    return(
      <div style={{minHeight:"100vh",background:"var(--bg)",display:"flex",flexDirection:"column",alignItems:"center",padding:32,fontFamily:"'Plus Jakarta Sans',sans-serif"}}>
        <style>{CSS}</style>
        <div style={{width:"100%",maxWidth:520}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:24}}>
            <div style={{display:"flex",gap:8}}>
              {OCR_STEPS.map((os,i)=><div key={i} style={{width:8,height:8,borderRadius:"50%",background:i===step?"var(--accent)":i<step?"var(--green)":"var(--border)",transition:"background .3s"}}/>)}
            </div>
            <div style={{fontSize:13,color:"var(--text3)"}}>Paso {step+1}/{OCR_STEPS.length}</div>
          </div>
          <div className="card cp sh" style={{marginBottom:14}}>
            <div style={{textAlign:"center",marginBottom:20}}>
              <div style={{fontSize:48,marginBottom:10}}>{s.emoji}</div>
              <div style={{fontWeight:800,fontSize:20,color:"var(--text)",marginBottom:5}}>Subir {s.label}</div>
              <div style={{fontSize:13,color:"var(--text3)"}}>Sube una foto clara del documento</div>
            </div>
            <label style={{display:"block",border:`2px dashed ${up?.done?"var(--green)":"var(--border)"}`,borderRadius:14,padding:"32px 20px",textAlign:"center",cursor:"pointer",background:up?.done?"rgba(22,163,74,.04)":"var(--surface2)",transition:"all .2s"}}>
              <input type="file" accept="image/*,application/pdf" style={{display:"none"}} onChange={async e=>{if(e.target.files[0]) await handleFile(s.id,s.docKey,e.target.files[0]);}}/>
              {up?.loading?<div style={{color:"var(--accent)",fontSize:13.5}}>⏳ Analizando con IA...</div>:
               up?.done?<div style={{color:"var(--green)",fontSize:13.5}}>✅ {Object.values(up.extracted||{}).filter(Boolean).length} campos extraídos</div>:
               up?.error?<div style={{color:"var(--red)",fontSize:13.5}}>❌ No se pudo leer — intenta con otra foto</div>:
               <div><div style={{fontSize:36,marginBottom:8}}>📎</div><div style={{fontSize:14,color:"var(--text3)"}}>Toca para seleccionar imagen o PDF</div></div>}
            </label>
            {up?.done&&up?.extracted&&<div style={{marginTop:14,padding:14,background:"var(--surface2)",borderRadius:10,border:"1px solid var(--border)"}}>
              <div style={{fontSize:11,fontWeight:700,color:"var(--accent)",textTransform:"uppercase",letterSpacing:".07em",marginBottom:8}}>Datos extraídos</div>
              {Object.entries(up.extracted).filter(([,v])=>v).map(([k,v])=>(
                <div key={k} style={{display:"flex",justifyContent:"space-between",fontSize:12.5,padding:"4px 0",borderBottom:"1px solid var(--border2)"}}>
                  <span style={{color:"var(--text3)"}}>{k}</span><span style={{fontWeight:600,color:"var(--text)"}}>{String(v)}</span>
                </div>
              ))}
            </div>}
          </div>
          <div style={{display:"flex",gap:10}}>
            {step>0&&<button className="btn bo" style={{flex:1}} onClick={()=>setStep(p=>p-1)}>← Anterior</button>}
            <button className="btn bp" style={{flex:2}} onClick={()=>{if(step===OCR_STEPS.length-1){setStep(-1);setUseOCR(false);}else setStep(p=>p+1);}} disabled={loading}>
              {step===OCR_STEPS.length-1?"✓ Ver y confirmar datos →":`Siguiente: ${OCR_STEPS[step+1]?.label} →`}
            </button>
          </div>
          <button onClick={()=>{setUseOCR(false);setStep(-1);}} style={{marginTop:12,background:"none",border:"none",color:"var(--text3)",fontSize:12.5,cursor:"pointer",width:"100%",fontFamily:"inherit"}}>Saltar OCR — ingresar manualmente</button>
        </div>
      </div>
    );
  }

  // MANUAL FORM
  const f=(key)=>e=>setData(p=>({...p,[key]:e.target.value}));
  return(
    <div className="pg" style={{maxWidth:820,margin:"0 auto",fontFamily:"'Plus Jakarta Sans',sans-serif"}}>
      <style>{CSS}</style>
      <div style={{display:"flex",alignItems:"center",gap:14,marginBottom:24}}>
        <button className="btn bo bsm" onClick={onCancel}><Ico n="back" s={13}/>{lang==="es"?"Cancelar":"Cancel"}</button>
        <div>
          <h1 style={{fontSize:24,fontWeight:800,color:"var(--text)",fontFamily:"'Inter',sans-serif"}}>{lang==="es"?"Nuevo Estudiante":"New Student"}</h1>
          <p style={{color:"var(--text3)",fontSize:13,marginTop:2}}>Complete todos los campos marcados con *</p>
        </div>
      </div>

      <div className="card cp sh" style={{marginBottom:16}}>
        <div className="sec">Datos Personales</div>
        <div className="g2" style={{gap:14}}>
          <div><label className="lbl">Nombre Completo *</label><input className="inp" value={data.fullName} onChange={f("fullName")} placeholder="Nombre completo" autoFocus/></div>
          <div><label className="lbl">Teléfono</label><input className="inp" value={data.phone} onChange={f("phone")} placeholder="(786) 000-0000"/></div>
          <div><label className="lbl">Email</label><input type="email" className="inp" value={data.email} onChange={f("email")} placeholder="correo@email.com"/></div>
          <div><label className="lbl">Fecha de Nacimiento</label><input type="date" className="inp" value={data.dob} onChange={f("dob")}/></div>
          <div style={{gridColumn:"1/-1"}}><label className="lbl">Dirección</label><input className="inp" value={data.address} onChange={f("address")} placeholder="Dirección completa"/></div>
        </div>
      </div>

      <div className="card cp sh" style={{marginBottom:16}}>
        <div className="sec">Documentos de Licencia</div>
        <div className="g2" style={{gap:14}}>
          <div><label className="lbl">Número de Licencia</label><input className="inp" value={data.licenseNumber} onChange={f("licenseNumber")} placeholder="A123456789"/></div>
          <div><label className="lbl">Vencimiento Licencia</label><input type="date" className="inp" value={data.licenseExpiry} onChange={f("licenseExpiry")}/></div>
          <div><label className="lbl">Número de CLP</label><input className="inp" value={data.clpNumber} onChange={f("clpNumber")} placeholder="CLP-000000"/></div>
          <div><label className="lbl">Vencimiento CLP</label><input type="date" className="inp" value={data.clpExpiry} onChange={f("clpExpiry")}/></div>
        </div>
      </div>

      <div className="card cp sh" style={{marginBottom:16}}>
        <div className="sec">Programa de Entrenamiento</div>
        <div className="g2" style={{gap:14}}>
          <div><label className="lbl">Fecha del Contrato</label><input type="date" className="inp" value={data.contractDate} onChange={f("contractDate")}/></div>
          <div><label className="lbl">Fecha de Inicio</label><input type="date" className="inp" value={data.courseStartDate} onChange={f("courseStartDate")}/></div>
          <div><label className="lbl">Clase CDL *</label><select className="sel" value={data.courseType} onChange={f("courseType")}><option>Class A</option><option>Class B</option><option>Class C Passenger</option></select></div>
          <div><label className="lbl">Transmisión</label><select className="sel" value={data.transmission} onChange={f("transmission")}><option>Manual</option><option>Automatic</option></select></div>
          <div><label className="lbl">Modalidad</label><select className="sel" value={data.schedule} onChange={f("schedule")}><option>Regular</option><option>Saturday</option><option>Intensivo</option><option>Nocturno</option></select></div>
          <div><label className="lbl">Fecha de Completación</label><input type="date" className="inp" value={data.completionDate||""} onChange={e=>setData(p=>({...p,completionDate:e.target.value}))}/></div>
          <div style={{gridColumn:"1/-1"}}>
            <label className="lbl">¿Examen DMV ya programado?</label>
            <div style={{display:"flex",gap:10,marginTop:4}}>
              {["No","Sí"].map(opt=>(
                <button key={opt} type="button" onClick={()=>setData(p=>({...p,dmvScheduled:opt==="Sí"}))}
                  style={{flex:1,padding:"9px",borderRadius:10,border:"1.5px solid "+(data.dmvScheduled===(opt==="Sí")?"var(--accent)":"var(--border)"),background:data.dmvScheduled===(opt==="Sí")?"rgba(37,99,235,.1)":"transparent",color:data.dmvScheduled===(opt==="Sí")?"var(--accent)":"var(--text3)",fontWeight:700,fontSize:14,cursor:"pointer",fontFamily:"inherit",transition:"all .15s"}}>
                  {opt==="Sí"?"📅 Sí":"✗ No"}
                </button>
              ))}
            </div>
            {data.dmvScheduled&&<div className="g2" style={{marginTop:10,gap:10}}>
              <div><label className="lbl">Fecha del Examen</label><input type="date" className="inp" value={data.dmv?.actualDate||""} onChange={e=>setData(p=>({...p,dmv:{...p.dmv,actualDate:e.target.value}}))}/></div>
              <div><label className="lbl">Hora</label><input type="time" className="inp" min="08:00" value={data.dmv?.time||"08:00"} onChange={e=>setData(p=>({...p,dmv:{...p.dmv,time:e.target.value}}))}/></div>
            </div>}
          </div>
          <div><label className="lbl">Camión Asignado</label><select className="sel" value={data.dmv.truckAssigned} onChange={e=>setData(p=>({...p,dmv:{...p.dmv,truckAssigned:e.target.value}}))}>
            <option>White Truck (Automatic)</option><option>Brown Truck (Manual)</option>
          </select></div>
          <div><label className="lbl">Representante Escolar</label><input className="inp" value={data.representativeName||"Jahaziel Mokay"} onChange={e=>setData(p=>({...p,representativeName:e.target.value}))} placeholder="Jahaziel Mokay"/></div>
          <div><label className="lbl">Fecha de Firma Representante</label><input type="date" className="inp" value={data.representativeDate||today} onChange={e=>setData(p=>({...p,representativeDate:e.target.value}))}/></div>
        </div>
      </div>

      <div className="card cp sh" style={{marginBottom:16}}>
        <div className="sec">Información Financiera</div>
        <div className="g3" style={{gap:14}}>
          <div><label className="lbl">Precio Total ($) *</label><input type="number" className="inp" value={data.totalPrice||""} onChange={e=>setData(p=>({...p,totalPrice:+e.target.value}))} placeholder="0"/></div>
          <div><label className="lbl">Pago Inicial ($)</label><input type="number" className="inp" value={data.downPayment||""} onChange={e=>setData(p=>({...p,downPayment:+e.target.value}))} placeholder="0"/></div>
          <div><label className="lbl">Balance Due</label>
            <div style={{padding:"10px 14px",background:(data.totalPrice||0)-(data.downPayment||0)>0?"rgba(220,38,38,.08)":"rgba(22,163,74,.08)",border:"1.5px solid "+(((data.totalPrice||0)-(data.downPayment||0))>0?"rgba(220,38,38,.2)":"rgba(22,163,74,.2)"),borderRadius:10,fontSize:20,fontWeight:900,color:(data.totalPrice||0)-(data.downPayment||0)>0?"var(--red)":"var(--green)",fontFamily:"'Inter',sans-serif"}}>
              {fmtCur(Math.max(0,(data.totalPrice||0)-(data.downPayment||0)))}
            </div>
          </div>
        </div>
        {data.downPayment>0&&<div className="al agr" style={{marginTop:10}}><Ico n="receipt" s={13}/><span>Pago inicial: {fmtCur(data.downPayment)} · Balance: {fmtCur(Math.max(0,(data.totalPrice||0)-(data.downPayment||0)))}</span></div>}
      </div>

      <div className="card cp sh" style={{marginBottom:16}}>
        <div className="sec">Estado de Documentos</div>
        <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:10}}>
          {Object.entries(DOC_LABELS).map(([key,lbl])=>(
            <label key={key} style={{display:"flex",alignItems:"center",gap:10,padding:"11px 14px",borderRadius:10,border:`1.5px solid ${data.documents[key]?"var(--green)":"var(--border)"}`,background:data.documents[key]?"rgba(22,163,74,.06)":"var(--surface2)",cursor:"pointer",transition:"all .15s"}}>
              <input type="checkbox" checked={data.documents[key]} onChange={e=>setData(p=>({...p,documents:{...p.documents,[key]:e.target.checked}}))} style={{accentColor:"var(--green)",width:15,height:15,cursor:"pointer"}}/>
              <span style={{fontSize:13,fontWeight:600,color:data.documents[key]?"var(--green)":"var(--text2)"}}>{lbl}</span>
            </label>
          ))}
        </div>
      </div>

      <div style={{display:"flex",gap:12,justifyContent:"flex-end"}}>
        <button className="btn bo" onClick={onCancel}>{lang==="es"?"Cancelar":"Cancel"}</button>
        <button className="btn bp blg" onClick={finalSave} disabled={!canSave()} style={{opacity:canSave()?1:.5}}>
          <Ico n="userplus" s={16}/>Registrar Estudiante
        </button>
      </div>
      {!canSave()&&<div style={{fontSize:12,color:"var(--text3)",textAlign:"right",marginTop:7}}>* Nombre y precio total son requeridos</div>}
    </div>
  );
}


// ─── USERS PAGE ─────────────────────────────────────────────────────────────────
function UsersPage({sysUsers,currentUser,onCreateUser,onUpdateUser,onDeleteUser}) {
  const {dark,lang,t} = useApp();
  const BLANK = {name:"",username:"",password:"",confirmPassword:"",role:"instructor",title:"",pin:"1234",active:true,
    perms:{canPay:false,canProg:true,canUsers:false,canReports:false,canDMV:true,canDocs:true,canMessages:true,canDelete:false}};
  const [showCreate,setShowCreate] = useState(false);
  const [editUser,setEditUser]     = useState(null);
  const [confirmDel,setConfirmDel] = useState(null);
  const [form,setForm]             = useState({...BLANK,perms:{...BLANK.perms}});
  const [err,setErr]               = useState("");
  const [showPwd,setShowPwd]       = useState(false);

  const PERM_LABELS = {
    canPay:      lang==="es"?"Registrar pagos":"Register payments",
    canProg:     lang==="es"?"Editar progreso":"Edit progress",
    canUsers:    lang==="es"?"Gestionar usuarios":"Manage users",
    canReports:  lang==="es"?"Ver reportes":"View reports",
    canDMV:      lang==="es"?"Gestionar DMV":"Manage DMV",
    canDocs:     lang==="es"?"Gestionar documentos":"Manage documents",
    canMessages: lang==="es"?"Enviar mensajes":"Send messages",
    canDelete:   lang==="es"?"Archivar estudiantes":"Archive students",
  };

  const ROLE_PRESET = {
    admin:      {canPay:true,canProg:true,canUsers:true,canReports:true,canDMV:true,canDocs:true,canMessages:true,canDelete:true},
    manager:    {canPay:true,canProg:true,canUsers:false,canReports:true,canDMV:true,canDocs:true,canMessages:true,canDelete:false},
    instructor: {canPay:false,canProg:true,canUsers:false,canReports:true,canDMV:true,canDocs:true,canMessages:true,canDelete:false},
    employee:   {canPay:true,canProg:false,canUsers:false,canReports:false,canDMV:false,canDocs:true,canMessages:true,canDelete:false},
    readonly:   {canPay:false,canProg:false,canUsers:false,canReports:false,canDMV:false,canDocs:false,canMessages:false,canDelete:false},
  };

  const applyPreset = (role,setter) => setter(p=>({...p,role,perms:{...ROLE_PRESET[role]||ROLE_PRESET.readonly}}));

  const validateForm = (f) => {
    if(!f.name.trim())               return lang==="es"?"El nombre es requerido.":"Name is required.";
    if(!f.username.trim())           return lang==="es"?"El usuario es requerido.":"Username is required.";
    if(f.username.includes(" "))     return lang==="es"?"El usuario no puede tener espacios.":"Username cannot have spaces.";
    if(!f.password)                  return lang==="es"?"La contraseña es requerida.":"Password is required.";
    if(f.password.length < 6)        return lang==="es"?"Mínimo 6 caracteres.":"Minimum 6 characters.";
    if(f.password !== f.confirmPassword) return lang==="es"?"Las contraseñas no coinciden.":"Passwords do not match.";
    if(sysUsers.find(u=>u.username.toLowerCase()===f.username.toLowerCase()))
                                     return lang==="es"?"Ese usuario ya existe.":"Username already taken.";
    return "";
  };

  const saveCreate = () => {
    const e = validateForm(form);
    if(e){setErr(e);return;}
    onCreateUser({...form,avatar:form.name.split(" ").map(w=>w[0]).join("").slice(0,2).toUpperCase()});
    setShowCreate(false);setForm({...BLANK,perms:{...BLANK.perms}});setErr("");
  };

  const saveEdit = () => {
    if(!editUser.name.trim()){setErr(lang==="es"?"Nombre requerido.":"Name required.");return;}
    if(editUser.newPassword && editUser.newPassword !== editUser.confirmPassword){setErr(lang==="es"?"Las contraseñas no coinciden.":"Passwords do not match.");return;}
    const upd = {...editUser};
    if(upd.newPassword) upd.password = upd.newPassword;
    delete upd.newPassword; delete upd.confirmPassword;
    onUpdateUser(upd);setEditUser(null);setErr("");
  };

  const UserForm = ({data,setData,isEdit}) => (
    <div style={{display:"flex",flexDirection:"column",gap:16}}>
      {/* Info básica */}
      <div>
        <div className="sec">
          {lang==="es"?"Información Básica":"Basic Information"}
        </div>
        <div className="g2" style={{gap:12}}>
          <div>
            <label className="lbl">{lang==="es"?"Nombre Completo *":"Full Name *"}</label>
            <input className="inp" value={data.name} onChange={e=>setData(p=>({...p,name:e.target.value}))} placeholder={lang==="es"?"Nombre completo":"Full name"} autoFocus/>
          </div>
          <div>
            <label className="lbl">{lang==="es"?"Título / Cargo":"Title / Position"}</label>
            <input className="inp" value={data.title||""} onChange={e=>setData(p=>({...p,title:e.target.value}))} placeholder={lang==="es"?"Ej: Instructor CDL":"e.g. CDL Instructor"}/>
          </div>
          <div>
            <label className="lbl">{lang==="es"?"Usuario *":"Username *"}</label>
            <input className="inp" value={data.username} onChange={e=>setData(p=>({...p,username:e.target.value.toLowerCase().replace(/\s/g,"")}))} placeholder="nombre.usuario" disabled={isEdit}
              style={{opacity:isEdit?.6:1}}/>
          </div>
          <div>
            <label className="lbl">PIN ({lang==="es"?"confirmación de acciones":"action confirmation"})</label>
            <input className="inp" maxLength={6} value={data.pin||"1234"} onChange={e=>setData(p=>({...p,pin:e.target.value.replace(/\D/g,"")}))} placeholder="1234"/>
          </div>
          {isEdit?(
            <>
              <div>
                <label className="lbl">{lang==="es"?"Nueva contraseña (vacío = sin cambio)":"New password (empty = no change)"}</label>
                <div style={{position:"relative"}}>
                  <input type={showPwd?"text":"password"} className="inp" value={data.newPassword||""} onChange={e=>setData(p=>({...p,newPassword:e.target.value}))} placeholder="••••••••" style={{paddingRight:40}}/>
                  <button onClick={()=>setShowPwd(v=>!v)} style={{position:"absolute",right:10,top:"50%",transform:"translateY(-50%)",background:"none",border:"none",color:"var(--text3)",cursor:"pointer"}}><Ico n={showPwd?"eyeoff":"eye"} s={14}/></button>
                </div>
              </div>
              <div>
                <label className="lbl">{lang==="es"?"Confirmar contraseña":"Confirm password"}</label>
                <input type={showPwd?"text":"password"} className="inp" value={data.confirmPassword||""} onChange={e=>setData(p=>({...p,confirmPassword:e.target.value}))} placeholder="••••••••"/>
              </div>
            </>
          ):(
            <>
              <div>
                <label className="lbl">{lang==="es"?"Contraseña *":"Password *"}</label>
                <div style={{position:"relative"}}>
                  <input type={showPwd?"text":"password"} className="inp" value={data.password||""} onChange={e=>setData(p=>({...p,password:e.target.value}))} placeholder="••••••••" style={{paddingRight:40}}/>
                  <button onClick={()=>setShowPwd(v=>!v)} style={{position:"absolute",right:10,top:"50%",transform:"translateY(-50%)",background:"none",border:"none",color:"var(--text3)",cursor:"pointer"}}><Ico n={showPwd?"eyeoff":"eye"} s={14}/></button>
                </div>
              </div>
              <div>
                <label className="lbl">{lang==="es"?"Confirmar contraseña *":"Confirm password *"}</label>
                <input type={showPwd?"text":"password"} className="inp" value={data.confirmPassword||""} onChange={e=>setData(p=>({...p,confirmPassword:e.target.value}))} placeholder="••••••••"/>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Rol y permisos */}
      <div>
        <div className="sec">{lang==="es"?"Rol & Permisos":"Role & Permissions"}</div>
        <div style={{marginBottom:14}}>
          <label className="lbl">{lang==="es"?"Rol base (aplica permisos predefinidos)":"Base role (applies preset permissions)"}</label>
          <div style={{display:"flex",gap:6,flexWrap:"wrap",marginTop:6}}>
            {Object.entries(ROLE_PERMS).map(([k,v])=>(
              <button key={k} onClick={()=>applyPreset(k,setData)}
                style={{padding:"7px 14px",borderRadius:20,border:`1.5px solid ${data.role===k?"var(--accent)":"var(--border)"}`,
                  background:data.role===k?(dark?"rgba(37,99,235,.12)":"#eff6ff"):"transparent",
                  color:data.role===k?"var(--accent)":"var(--text3)",fontSize:12.5,fontWeight:data.role===k?700:500,
                  cursor:"pointer",fontFamily:"inherit",transition:"all .15s"}}>
                {v.label}
              </button>
            ))}
          </div>
        </div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
          {Object.entries(PERM_LABELS).map(([key,label])=>(
            <label key={key} style={{display:"flex",alignItems:"center",gap:10,padding:"10px 14px",borderRadius:10,
              border:`1.5px solid ${data.perms?.[key]?"var(--green)":"var(--border)"}`,
              background:data.perms?.[key]?"rgba(22,163,74,.05)":"transparent",cursor:"pointer",transition:"all .15s"}}>
              <input type="checkbox" checked={!!data.perms?.[key]}
                onChange={e=>setData(p=>({...p,perms:{...p.perms,[key]:e.target.checked}}))}
                style={{accentColor:"var(--green)",width:16,height:16,cursor:"pointer",flexShrink:0}}/>
              <span style={{fontSize:13,color:data.perms?.[key]?"var(--green)":"var(--text2)",fontWeight:data.perms?.[key]?600:400}}>
                {label}
              </span>
            </label>
          ))}
        </div>
      </div>

      {/* Estado */}
      <div>
        <label style={{display:"flex",alignItems:"center",gap:12,cursor:"pointer",padding:"12px 16px",
          background:"var(--surface2)",borderRadius:12,border:"1px solid var(--border)"}}>
          <input type="checkbox" checked={!!data.active} onChange={e=>setData(p=>({...p,active:e.target.checked}))}
            style={{accentColor:"var(--green)",width:18,height:18,cursor:"pointer"}}/>
          <div>
            <div style={{fontWeight:700,fontSize:14,color:"var(--text)"}}>{lang==="es"?"Usuario activo":"Active user"}</div>
            <div style={{fontSize:12,color:"var(--text3)",marginTop:1}}>
              {lang==="es"?"Los usuarios inactivos no pueden iniciar sesión":"Inactive users cannot log in"}
            </div>
          </div>
        </label>
      </div>
    </div>
  );

  return(<div className="pg">
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:22}}>
      <div>
        <h1 style={{fontSize:26,fontWeight:800,color:"var(--text)",fontFamily:"'Inter',sans-serif",letterSpacing:"-.02em"}}>
          {lang==="es"?"Usuarios del Sistema":"System Users"}
        </h1>
        <p style={{color:"var(--text3)",fontSize:13.5,marginTop:3}}>
          {sysUsers.filter(u=>u.active).length} {lang==="es"?"activos":"active"} · {sysUsers.length} {lang==="es"?"total":"total"}
        </p>
      </div>
      <button className="btn bp" onClick={()=>{setForm({...BLANK,perms:{...BLANK.perms}});setErr("");setShowPwd(false);setShowCreate(true);}}>
        <Ico n="userplus" s={14}/>{lang==="es"?"Crear Usuario":"Create User"}
      </button>
    </div>

    {/* Lista de usuarios */}
    <div style={{display:"grid",gap:10}}>
      {sysUsers.map(u=>(
        <div key={u.id} className="card cp sh" style={{display:"flex",alignItems:"center",gap:16,flexWrap:"wrap",opacity:u.active?1:.5,transition:"opacity .2s"}}>
          <div className="av" style={{width:52,height:52,fontSize:17,background:u.active?"linear-gradient(135deg,#0f2544,#1e4d8c)":"#94a3b8",flexShrink:0}}>
            {u.avatar||getInit(u.name)}
          </div>
          <div style={{flex:1,minWidth:0}}>
            <div style={{display:"flex",alignItems:"center",gap:10,flexWrap:"wrap",marginBottom:4}}>
              <div style={{fontWeight:800,fontSize:15,color:"var(--text)"}}>{u.name}</div>
              <span style={{background:ROLE_PERMS[u.role]?.color||"#64748b",color:"#fff",padding:"3px 11px",borderRadius:20,fontSize:11,fontWeight:700}}>
                {ROLE_PERMS[u.role]?.label||u.role}
              </span>
              {!u.active&&<span style={{background:"rgba(220,38,38,.1)",color:"var(--red)",padding:"3px 10px",borderRadius:20,fontSize:11,fontWeight:700,border:"1px solid rgba(220,38,38,.15)"}}>
                {lang==="es"?"Inactivo":"Inactive"}
              </span>}
              {u.id===currentUser.id&&<span style={{background:"rgba(22,163,74,.1)",color:"var(--green)",padding:"3px 10px",borderRadius:20,fontSize:11,fontWeight:700,border:"1px solid rgba(22,163,74,.15)"}}>
                {lang==="es"?"Tú":"You"}
              </span>}
            </div>
            <div style={{fontSize:12.5,color:"var(--text3)",display:"flex",gap:14,flexWrap:"wrap",marginBottom:8}}>
              <span>@{u.username}</span>
              {u.title&&<span>{u.title}</span>}
              <span>{lang==="es"?"Creado:":"Created:"} {fmtDate(u.createdAt)}</span>
              {u.lastLogin&&<span>{lang==="es"?"Último acceso:":"Last login:"} {timeAgo(u.lastLogin)}</span>}
            </div>
            {/* Permisos activos como chips */}
            <div style={{display:"flex",gap:5,flexWrap:"wrap"}}>
              {Object.entries(u.perms||ROLE_PERMS[u.role]||{}).filter(([k,v])=>k.startsWith("can")&&v).map(([k])=>(
                <span key={k} style={{fontSize:10.5,padding:"2px 9px",background:dark?"rgba(37,99,235,.1)":"#eff6ff",color:"var(--accent)",borderRadius:6,fontWeight:600,border:"1px solid rgba(37,99,235,.12)"}}>
                  {k.replace("can","")}
                </span>
              ))}
            </div>
          </div>
          {/* Acciones */}
          <div style={{display:"flex",gap:8,flexShrink:0}}>
            <button className="btn bo bsm" onClick={()=>{setEditUser({...u,perms:u.perms||{...ROLE_PRESET[u.role]||ROLE_PRESET.readonly},newPassword:"",confirmPassword:""});setErr("");setShowPwd(false);}}>
              <Ico n="edit" s={13}/>{lang==="es"?"Editar":"Edit"}
            </button>
            {u.id!==currentUser.id&&(
              <>
                <button className="btn bo bsm" onClick={()=>onUpdateUser({...u,active:!u.active})}
                  style={{color:u.active?"var(--yellow)":"var(--green)",borderColor:u.active?"var(--yellow)":"var(--green)"}}>
                  {u.active?(lang==="es"?"Desactivar":"Deactivate"):(lang==="es"?"Activar":"Activate")}
                </button>
                <button className="btn bsm" onClick={()=>setConfirmDel(u)}
                  style={{background:"rgba(220,38,38,.08)",color:"var(--red)",border:"1px solid rgba(220,38,38,.2)"}}>
                  <Ico n="trash" s={12}/>{lang==="es"?"Eliminar":"Delete"}
                </button>
              </>
            )}
          </div>
        </div>
      ))}
    </div>

    {/* MODAL CREAR */}
    {showCreate&&<div className="ov"><div className="md md-lg" style={{maxHeight:"90vh",overflowY:"auto"}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:22}}>
        <div style={{fontWeight:800,fontSize:20,color:"var(--text)"}}>{lang==="es"?"Crear Usuario":"Create User"}</div>
        <button className="btn bgh" onClick={()=>setShowCreate(false)}><Ico n="x" s={16}/></button>
      </div>
      <UserForm data={form} setData={setForm} isEdit={false}/>
      {err&&<div className="al ar" style={{marginTop:14}}><Ico n="warn" s={13}/>{err}</div>}
      <div style={{display:"flex",gap:10,marginTop:22}}>
        <button className="btn bo" style={{flex:1}} onClick={()=>setShowCreate(false)}>{lang==="es"?"Cancelar":"Cancel"}</button>
        <button className="btn bp" style={{flex:2}} onClick={saveCreate}>
          <Ico n="userplus" s={14}/>{lang==="es"?"Crear Usuario":"Create User"}
        </button>
      </div>
    </div></div>}

    {/* MODAL EDITAR */}
    {editUser&&<div className="ov"><div className="md md-lg" style={{maxHeight:"90vh",overflowY:"auto"}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:22}}>
        <div style={{fontWeight:800,fontSize:20,color:"var(--text)"}}>{lang==="es"?"Editar Usuario":"Edit User"}: {editUser.name}</div>
        <button className="btn bgh" onClick={()=>setEditUser(null)}><Ico n="x" s={16}/></button>
      </div>
      <UserForm data={editUser} setData={setEditUser} isEdit={true}/>
      {err&&<div className="al ar" style={{marginTop:14}}><Ico n="warn" s={13}/>{err}</div>}
      <div style={{display:"flex",gap:10,marginTop:22}}>
        <button className="btn bo" style={{flex:1}} onClick={()=>setEditUser(null)}>{lang==="es"?"Cancelar":"Cancel"}</button>
        <button className="btn bp" style={{flex:2}} onClick={saveEdit}>
          <Ico n="check" s={14}/>{lang==="es"?"Guardar Cambios":"Save Changes"}
        </button>
      </div>
    </div></div>}

    {/* CONFIRMAR ELIMINAR */}
    {confirmDel&&<div className="ov"><div className="md md-sm" style={{textAlign:"center"}}>
      <div style={{fontSize:44,marginBottom:12}}>⚠️</div>
      <div style={{fontWeight:800,fontSize:19,color:"var(--text)",marginBottom:8}}>
        {lang==="es"?"¿Eliminar usuario?":"Delete user?"}
      </div>
      <div style={{color:"var(--text3)",fontSize:13.5,marginBottom:22,lineHeight:1.6}}>
        <b>{confirmDel.name}</b> ({confirmDel.username})<br/>
        {lang==="es"?"Esta acción no se puede deshacer.":"This action cannot be undone."}
      </div>
      <div style={{display:"flex",gap:10}}>
        <button className="btn bo" style={{flex:1}} onClick={()=>setConfirmDel(null)}>
          {lang==="es"?"Cancelar":"Cancel"}
        </button>
        <button className="btn br" style={{flex:1}} onClick={()=>{onDeleteUser(confirmDel.id);setConfirmDel(null);}}>
          <Ico n="trash" s={13}/>{lang==="es"?"Eliminar":"Delete"}
        </button>
      </div>
    </div></div>}
  </div>);
}
