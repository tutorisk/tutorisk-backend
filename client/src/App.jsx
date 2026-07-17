import { useState, useEffect, useRef, useMemo } from "react";

// ═══════════════════════════════════════════════
//  TUTORISK LCMS — Charte rouge #CC1515 & blanc
// ═══════════════════════════════════════════════

const MODULES = [
  // ── Sécurité au travail ──────────────────────────────────────
  { id:"m1", title:"Sensibilisation à la sécurité incendie", cat:"Sécurité", dur:90, level:"Fondamental", color:"#CC1515", bg:"#FDEAEA", chapters:4, price:29, desc:"Prévention des risques incendie, moyens de lutte et procédures d'évacuation.", chs:[{id:"c1",title:"Causes et types d'incendie",content:["video","doc","qcm"]},{id:"c2",title:"Prévention et équipements",content:["video","doc"]},{id:"c3",title:"Procédures d'évacuation",content:["video","qcm"]},{id:"c4",title:"Réglementation",content:["doc","qcm","link"]}]},
  { id:"m2", title:"Sensibilisation au risque chimique", cat:"Sécurité", dur:120, level:"Fondamental", color:"#CC1515", bg:"#FDEAEA", chapters:5, price:35, desc:"Identifier et prévenir les risques liés aux agents chimiques.", chs:[{id:"c1",title:"Classification des produits",content:["video","doc"]},{id:"c2",title:"Fiches de sécurité (FDS)",content:["doc","qcm"]},{id:"c3",title:"Équipements de protection",content:["video","qcm"]},{id:"c4",title:"Stockage et manipulation",content:["video","doc"]},{id:"c5",title:"Conduite en cas d'accident",content:["video","qcm","link"]}]},
  { id:"m3", title:"Sensibilisation au risque routier", cat:"Sécurité", dur:60, level:"Fondamental", color:"#CC1515", bg:"#FDEAEA", chapters:3, price:25, desc:"Réduire les accidents de trajet et de mission.", chs:[{id:"c1",title:"Statistiques et enjeux",content:["video","doc"]},{id:"c2",title:"Facteurs de risque",content:["video","qcm"]},{id:"c3",title:"Bonnes pratiques",content:["video","doc","qcm"]}]},
  { id:"m7", title:"Habilitation électrique H0B0 – Non-électricien", cat:"Sécurité", dur:180, level:"Certifiant", color:"#CC1515", bg:"#FDEAEA", chapters:7, price:59, desc:"Formation préalable à l'habilitation électrique pour le personnel non-électricien.", chs:[{id:"c1",title:"Principes de l'électricité",content:["video","doc"]},{id:"c2",title:"Risques et effets sur le corps",content:["video","qcm"]},{id:"c3",title:"Zones de sécurité",content:["video","doc"]},{id:"c4",title:"Équipements de protection",content:["video","qcm"]},{id:"c5",title:"Consignation",content:["video","doc"]},{id:"c6",title:"Procédures B0H0",content:["video","qcm"]},{id:"c7",title:"Évaluation finale",content:["doc","qcm","link"]}]},
  // ── Aléas naturels ───────────────────────────────────────────
  { id:"an1", title:"Sensibilisation aux aléas naturels", cat:"Aléas naturels", dur:90, level:"Fondamental", color:"#1565C0", bg:"#E3F2FD", chapters:4, price:29, desc:"Comprendre et anticiper les risques naturels majeurs : cyclones, séismes, inondations, submersions et mouvements de terrain.", chs:[{id:"c1",title:"Typologies des aléas naturels",content:["video","doc","qcm"]},{id:"c2",title:"Phénomènes cycloniques et météorologiques",content:["video","doc"]},{id:"c3",title:"Séismes, inondations et submersions",content:["video","qcm"]},{id:"c4",title:"Comportements à adopter et chaîne d'alerte",content:["video","doc","qcm","link"]}]},
  { id:"an2", title:"Obligations PCS et DICRIM", cat:"Aléas naturels", dur:120, level:"Intermédiaire", color:"#1565C0", bg:"#E3F2FD", chapters:5, price:49, desc:"Maîtriser le cadre réglementaire du Plan Communal de Sauvegarde et du Document d'Information Communal sur les Risques Majeurs.", chs:[{id:"c1",title:"Cadre législatif : loi du 13 août 2004",content:["video","doc"]},{id:"c2",title:"Élaboration et contenu du PCS",content:["video","doc","qcm"]},{id:"c3",title:"Le DICRIM : contenu et diffusion",content:["video","qcm"]},{id:"c4",title:"Mise en œuvre opérationnelle",content:["video","doc"]},{id:"c5",title:"Exercices de simulation et retours d'expérience",content:["doc","qcm","link"]}]},
  { id:"an3", title:"Rédaction des PPMS", cat:"Aléas naturels", dur:150, level:"Avancé", color:"#1565C0", bg:"#E3F2FD", chapters:6, price:59, desc:"Former les personnels à la rédaction et à la mise en œuvre du Plan Particulier de Mise en Sûreté dans les établissements recevant du public.", chs:[{id:"c1",title:"Cadre réglementaire des PPMS",content:["video","doc"]},{id:"c2",title:"Identification des risques et scénarios",content:["video","qcm"]},{id:"c3",title:"Rédaction des fiches réflexes",content:["doc","qcm"]},{id:"c4",title:"Organisation des exercices PPMS",content:["video","doc"]},{id:"c5",title:"Confinement et évacuation",content:["video","qcm"]},{id:"c6",title:"Mise à jour et validation du PPMS",content:["doc","qcm","link"]}]},
  // ── Risques technologiques ───────────────────────────────────
  { id:"rt1", title:"Classification des ICPE", cat:"Risques technologiques", dur:120, level:"Intermédiaire", color:"#4A148C", bg:"#EDE7F6", chapters:5, price:49, desc:"Comprendre le régime juridique des Installations Classées pour la Protection de l'Environnement, leurs obligations et leur surveillance.", chs:[{id:"c1",title:"Définition et enjeux des ICPE",content:["video","doc"]},{id:"c2",title:"Nomenclature et régimes (déclaration, enregistrement, autorisation)",content:["video","doc","qcm"]},{id:"c3",title:"Obligations de l'exploitant",content:["video","qcm"]},{id:"c4",title:"Inspection et contrôle des ICPE",content:["doc","qcm"]},{id:"c5",title:"Études de dangers et PPRT",content:["video","doc","link"]}]},
  { id:"rt2", title:"Formation ADR 1.3 – Transport de matières dangereuses", cat:"Risques technologiques", dur:180, level:"Certifiant", color:"#4A148C", bg:"#EDE7F6", chapters:7, price:69, desc:"Formation réglementaire ADR 1.3 pour le personnel intervenant dans le transport ou la manutention de matières dangereuses.", chs:[{id:"c1",title:"Réglementation ADR et classification des marchandises",content:["video","doc"]},{id:"c2",title:"Emballages, étiquetage et marquage",content:["video","doc","qcm"]},{id:"c3",title:"Documents de transport",content:["doc","qcm"]},{id:"c4",title:"Consignes de sécurité et fiche de sécurité",content:["video","qcm"]},{id:"c5",title:"Obligations du transporteur et de l'expéditeur",content:["video","doc"]},{id:"c6",title:"Conduite à tenir en cas d'accident",content:["video","qcm"]},{id:"c7",title:"Évaluation certifiante ADR 1.3",content:["doc","qcm","link"]}]},
  { id:"rt3", title:"Sensibilisation aux accès des établissements classés", cat:"Risques technologiques", dur:60, level:"Fondamental", color:"#4A148C", bg:"#EDE7F6", chapters:3, price:25, desc:"Sensibiliser les personnels et intervenants extérieurs aux règles de sécurité spécifiques aux sites industriels classés ICPE.", chs:[{id:"c1",title:"Risques spécifiques des sites classés",content:["video","doc","qcm"]},{id:"c2",title:"Procédures d'accès et plan de prévention",content:["video","doc"]},{id:"c3",title:"Conduite à tenir en cas d'alerte sur site",content:["video","qcm","link"]}]},
  // ── RH & Bien-être ───────────────────────────────────────────
  { id:"m4a", title:"Prévention du harcèlement – Employé", cat:"RH & Bien-être", dur:75, level:"Fondamental", color:"#512DA8", bg:"#EDE7F6", chapters:4, price:29, desc:"Reconnaître et signaler les situations de harcèlement au travail.", chs:[{id:"c1",title:"Définitions et cadre juridique",content:["video","doc"]},{id:"c2",title:"Reconnaître le harcèlement",content:["video","qcm"]},{id:"c3",title:"Réagir et se protéger",content:["video","doc"]},{id:"c4",title:"Dispositifs de signalement",content:["doc","qcm","link"]}]},
  { id:"m4b", title:"Prévention du harcèlement – Manager", cat:"RH & Bien-être", dur:90, level:"Avancé", color:"#512DA8", bg:"#EDE7F6", chapters:5, price:39, desc:"Former les managers à prévenir et gérer le harcèlement dans leurs équipes.", chs:[{id:"c1",title:"Responsabilités légales",content:["video","doc"]},{id:"c2",title:"Signaux d'alerte",content:["video","qcm"]},{id:"c3",title:"Conduire un entretien",content:["video","doc"]},{id:"c4",title:"Actions correctives",content:["video","qcm"]},{id:"c5",title:"Culture de prévention",content:["doc","link"]}]},
  // ── Instances représentatives ────────────────────────────────
  { id:"m5", title:"Fonctionnement du CSE – Entreprise privée", cat:"Instances représentatives", dur:150, level:"Intermédiaire", color:"#E65100", bg:"#FFF8E1", chapters:6, price:49, desc:"Rôle, missions et fonctionnement du Comité Social et Économique.", chs:[{id:"c1",title:"Mise en place et élections",content:["video","doc"]},{id:"c2",title:"Attributions économiques",content:["video","qcm"]},{id:"c3",title:"Santé et sécurité",content:["video","doc"]},{id:"c4",title:"Attributions sociales",content:["doc","qcm"]},{id:"c5",title:"Réunions",content:["video","doc"]},{id:"c6",title:"Droits des élus",content:["video","qcm","link"]}]},
  { id:"m6", title:"Fonctionnement du CST – Fonction publique", cat:"Instances représentatives", dur:150, level:"Intermédiaire", color:"#E65100", bg:"#FFF8E1", chapters:6, price:49, desc:"Spécificités du Comité Social Territorial dans la fonction publique.", chs:[{id:"c1",title:"Cadre réglementaire FPT",content:["video","doc"]},{id:"c2",title:"Composition et élections",content:["video","qcm"]},{id:"c3",title:"Missions et compétences",content:["video","doc"]},{id:"c4",title:"Relations avec l'employeur",content:["doc","qcm"]},{id:"c5",title:"CHSCT et formation",content:["video","doc"]},{id:"c6",title:"Droits syndicaux",content:["video","qcm","link"]}]},
  // ── Évaluation des risques ───────────────────────────────────
  { id:"m8", title:"Rédaction du Document Unique (DUERP)", cat:"Évaluation des risques", dur:210, level:"Expert", color:"#CC1515", bg:"#FDEAEA", chapters:8, price:79, desc:"Méthode complète pour réaliser l'évaluation des risques et rédiger un DUERP conforme.", chs:[{id:"c1",title:"Cadre réglementaire",content:["video","doc"]},{id:"c2",title:"Unités de travail",content:["video","qcm"]},{id:"c3",title:"Inventaire des risques",content:["video","doc"]},{id:"c4",title:"Cotation et hiérarchisation",content:["video","qcm"]},{id:"c5",title:"Plan d'action",content:["video","doc"]},{id:"c6",title:"Mise à jour et suivi",content:["doc","qcm"]},{id:"c7",title:"Implication des salariés",content:["video","doc"]},{id:"c8",title:"Cas pratique",content:["doc","qcm","link"]}]},
];

const USERS = {
  admin: { id:"admin", name:"Sophie Martin", role:"admin", email:"s.martin@tutorisk.com", avatar:"SM" },
  pedagogue: { id:"ped1", name:"Marc Dubois", role:"pedagogue", email:"m.dubois@tutorisk.com", avatar:"MD", modules:["m1","m2","m7","m8"] },
  formateur: { id:"form1", name:"Claire Leroy", role:"formateur", email:"c.leroy@tutorisk.com", avatar:"CL" },
  charge: { id:"chg1", name:"Bruno Dupont", role:"charge", email:"b.dupont@acmegroup.fr", avatar:"BD", entreprises:["Acme Group","SAS Dupont"], forfait:500 },
  apprenant: { id:"app1", name:"Julie Bernard", role:"apprenant", email:"j.bernard@acmegroup.fr", avatar:"JB", formations_assigned:["m1","m3"], formations_progress:{m1:65,m3:20} },
};

const SESSIONS = [
  {id:"s1",mid:"m1",titre:"Incendie – Juin 2025",date:"2025-06-20",nb:12,statut:"En cours",form:"Claire Leroy"},
  {id:"s2",mid:"m3",titre:"Routier – Juillet 2025",date:"2025-07-05",nb:8,statut:"Planifiée",form:"Claire Leroy"},
  {id:"s3",mid:"m4a",titre:"Harcèlement – Mai 2025",date:"2025-05-15",nb:24,statut:"Terminée",form:"Claire Leroy"},
];

const LEARNERS = [
  {name:"Alice Moreau",module:"Sécurité incendie",progress:85,statut:"En cours",derniere:"12/06/2025"},
  {name:"Paul Renaud",module:"Sécurité incendie",progress:100,statut:"Terminé",derniere:"10/06/2025"},
  {name:"Lucie Simon",module:"Risque routier",progress:30,statut:"En cours",derniere:"14/06/2025"},
  {name:"Tom Garnier",module:"Risque routier",progress:0,statut:"Non commencé",derniere:"—"},
  {name:"Emma Blanc",module:"Harcèlement",progress:100,statut:"Terminé",derniere:"08/06/2025"},
  {name:"Marc Perez",module:"Harcèlement",progress:60,statut:"En cours",derniere:"13/06/2025"},
];

const CT = {
  video:{icon:"🎬",label:"Vidéo",bg:"#E3F2FD",color:"#0277BD"},
  doc:{icon:"📄",label:"Document",bg:"#F5F5F5",color:"#555"},
  qcm:{icon:"✅",label:"QCM",bg:"#E8F5E9",color:"#2E7D32"},
  link:{icon:"🔗",label:"Ressource externe",bg:"#FFF8E1",color:"#E65100"},
};

const LVL = {Fondamental:["#FDEAEA","#CC1515"],Intermédiaire:["#E3F2FD","#0277BD"],Avancé:["#EDE7F6","#512DA8"],Expert:["#FCE4EC","#C2185B"],Certifiant:["#FFF8E1","#E65100"]};
const CAT_COLORS = {
  "Sécurité":["#CC1515","#FDEAEA"],
  "Aléas naturels":["#1565C0","#E3F2FD"],
  "Risques technologiques":["#4A148C","#EDE7F6"],
  "RH & Bien-être":["#512DA8","#EDE7F6"],
  "Instances représentatives":["#E65100","#FFF8E1"],
  "Évaluation des risques":["#CC1515","#FDEAEA"],
};

// ═══════════════════════════════════════════════
//  CLIENT API — backend réel (auth, modules, paiement, vidéo)
// ═══════════════════════════════════════════════
// L'URL du backend peut être surchargée en définissant window.TUTORISK_API_BASE
// avant le chargement de l'app (utile en production derrière un autre domaine).
const API_BASE = (typeof window!=="undefined" && window.TUTORISK_API_BASE) || "http://localhost:4000";

// tokenRef est une référence mutable (useRef) créée dans App et partagée ici,
// pour toujours lire le jeton d'accès le plus récent au moment de chaque requête,
// y compris après un rafraîchissement silencieux.
function createApiClient(tokenRef){
  async function request(method, path, body, _retried){
    const headers={ "Content-Type":"application/json" };
    if(tokenRef.current) headers.Authorization=`Bearer ${tokenRef.current}`;
    const res=await fetch(`${API_BASE}${path}`,{
      method,
      headers,
      credentials:"include", // nécessaire pour le cookie httpOnly de rafraîchissement
      body: body!==undefined ? JSON.stringify(body) : undefined,
    });

    if(res.status===401 && !_retried && path!=="/api/auth/refresh" && path!=="/api/auth/login"){
      // Tentative silencieuse de rafraîchissement du jeton d'accès via le cookie httpOnly
      try{
        const r=await fetch(`${API_BASE}/api/auth/refresh`,{method:"POST",credentials:"include"});
        if(r.ok){
          const data=await r.json();
          tokenRef.current=data.accessToken;
          return request(method,path,body,true);
        }
      }catch{/* session définitivement expirée */}
    }

    let data=null;
    try{ data=await res.json(); }catch{ /* réponse sans corps, ex: 204 */ }
    if(!res.ok){
      const message=(data&&data.error)||`Erreur ${res.status}`;
      throw new Error(message);
    }
    return data;
  }
  // Téléchargement binaire authentifié (ex: attestation PDF) — retourne un Blob
  // au lieu de tenter un parsing JSON, et profite du même rafraîchissement de
  // jeton silencieux que les autres requêtes en cas de 401.
  async function requestBlob(path,_retried){
    const headers={};
    if(tokenRef.current) headers.Authorization=`Bearer ${tokenRef.current}`;
    const res=await fetch(`${API_BASE}${path}`,{ headers, credentials:"include" });
    if(res.status===401 && !_retried){
      try{
        const r=await fetch(`${API_BASE}/api/auth/refresh`,{method:"POST",credentials:"include"});
        if(r.ok){
          const data=await r.json();
          tokenRef.current=data.accessToken;
          return requestBlob(path,true);
        }
      }catch{/* session définitivement expirée */}
    }
    if(!res.ok){
      let message=`Erreur ${res.status}`;
      try{ const data=await res.json(); if(data?.error) message=data.error; }catch{/* corps non-JSON */}
      throw new Error(message);
    }
    return res.blob();
  }
  // Envoi multipart (upload de fichier, ex: tampon/signature d'attestation) —
  // ne pas fixer Content-Type manuellement, le navigateur ajoute la bonne
  // valeur avec la boundary multipart automatiquement pour un FormData.
  async function requestForm(path,formData,_retried){
    const headers={};
    if(tokenRef.current) headers.Authorization=`Bearer ${tokenRef.current}`;
    const res=await fetch(`${API_BASE}${path}`,{ method:"POST", headers, credentials:"include", body:formData });
    if(res.status===401 && !_retried){
      try{
        const r=await fetch(`${API_BASE}/api/auth/refresh`,{method:"POST",credentials:"include"});
        if(r.ok){
          const data=await r.json();
          tokenRef.current=data.accessToken;
          return requestForm(path,formData,true);
        }
      }catch{/* session définitivement expirée */}
    }
    let data=null;
    try{ data=await res.json(); }catch{/* réponse sans corps */}
    if(!res.ok){
      const message=(data&&data.error)||`Erreur ${res.status}`;
      throw new Error(message);
    }
    return data;
  }
  return {
    get:(path)=>request("GET",path),
    post:(path,body)=>request("POST",path,body??{}),
    put:(path,body)=>request("PUT",path,body??{}),
    del:(path)=>request("DELETE",path),
    getBlob:(path)=>requestBlob(path),
    postForm:(path,formData)=>requestForm(path,formData),
  };
}

// Calcule en direct le taux de TVA applicable à un code postal (avec un léger
// anti-rebond pour éviter une requête à chaque frappe), utilisé pour afficher
// un prix TTC à jour dans les modales d'achat avant confirmation.
function useVatRate(api,postalCode,fallbackRate){
  const [vat,setVat]=useState({ratePercent:fallbackRate??20,label:"France",loading:false});
  useEffect(()=>{
    let active=true;
    setVat(v=>({...v,loading:true}));
    const t=setTimeout(()=>{
      api.get(`/api/vat/rate?postalCode=${encodeURIComponent(postalCode||"")}`)
        .then(d=>{ if(active) setVat({ratePercent:d.ratePercent,label:d.label,loading:false}); })
        .catch(()=>{ if(active) setVat(v=>({...v,loading:false})); });
    },350);
    return ()=>{ active=false; clearTimeout(t); };
  },[postalCode]); // eslint-disable-line react-hooks/exhaustive-deps
  return vat;
}

function ttcFromHt(htCents,ratePercent){
  return Math.round(htCents*(1+(ratePercent||0)/100));
}

// Détecte un viewport mobile (≤768px) pour basculer les mises en page à
// colonne fixe (barres latérales, panneaux côte à côte) en empilement
// vertical, afin que les écrans téléphone/tablette restent utilisables.
function useIsMobile(breakpoint=768){
  const [isMobile,setIsMobile]=useState(typeof window!=="undefined"?window.innerWidth<=breakpoint:false);
  useEffect(()=>{
    function onResize(){ setIsMobile(window.innerWidth<=breakpoint); }
    window.addEventListener("resize",onResize);
    return ()=>window.removeEventListener("resize",onResize);
  },[breakpoint]);
  return isMobile;
}

// Marque seule (le rond au T) — pour les espaces contraints
function Logo({size=36}){
  return <img src="/logo-mark.png" width={size} height={size} alt="TutoRisk"
    style={{flexShrink:0,display:"block",objectFit:"contain"}}/>;
}

// Lockup horizontal (rond + mot) — navigation
function LogoLockup({height=38}){
  return <img src="/logo-horizontal.png" alt="TutoRisk"
    style={{height,width:"auto",flexShrink:0,display:"block",objectFit:"contain"}}/>;
}

// Logo complet empilé (rond + mot dessous) — hero
function LogoStacked({width=120}){
  return <img src="/logo-tutorisk.png" alt="TutoRisk"
    style={{width,height:"auto",display:"block",objectFit:"contain"}}/>;
}

function PB({value,color="#CC1515"}){
  return <div style={{height:5,background:"#F0F0F0",borderRadius:3,overflow:"hidden"}}>
    <div style={{height:"100%",width:`${value}%`,background:color,borderRadius:3,transition:"width .4s"}}/>
  </div>;
}

function St({s}){
  const m={"Terminé":["#E8F5E9","#2E7D32"],"Terminée":["#E8F5E9","#2E7D32"],"En cours":["#FDEAEA","#CC1515"],"Non commencé":["#F5F5F5","#757575"],"Planifiée":["#FFF8E1","#E65100"]};
  const [bg,color]=m[s]||["#F5F5F5","#757575"];
  return <span style={{fontSize:10,padding:"2px 9px",borderRadius:20,fontWeight:700,background:bg,color}}>{s}</span>;
}

function Rb({role}){
  const m={admin:["#FDEAEA","#CC1515"],pedagogue:["#EDE7F6","#512DA8"],formateur:["#E1F5FE","#0277BD"],charge:["#E8F5E9","#2E7D32"],apprenant:["#FFF8E1","#E65100"]};
  const l={admin:"Administrateur",pedagogue:"Pédagogue",formateur:"Formateur",charge:"Chargé",apprenant:"Apprenant"};
  const [bg,color]=m[role]||["#F5F5F5","#555"];
  return <span style={{fontSize:10,padding:"2px 8px",borderRadius:20,fontWeight:700,background:bg,color}}>{l[role]}</span>;
}

function BtnR({children,onClick,style={}}){
  const [hov,setHov]=useState(false);
  return <button onClick={onClick} onMouseEnter={()=>setHov(true)} onMouseLeave={()=>setHov(false)}
    style={{background:hov?"#A50F0F":"#CC1515",color:"#fff",border:"none",borderRadius:7,padding:"7px 14px",fontSize:13,fontWeight:700,cursor:"pointer",...style}}>{children}</button>;
}

function BtnG({children,onClick,style={}}){
  return <button onClick={onClick} style={{background:"#fff",color:"#333",border:"1px solid #DDD",borderRadius:7,padding:"6px 12px",fontSize:12,fontWeight:600,cursor:"pointer",...style}}>{children}</button>;
}

function Input({label,...props}){
  return <div style={{marginBottom:10}}>
    {label&&<label style={{fontSize:12,color:"#444",fontWeight:700,display:"block",marginBottom:4}}>{label}</label>}
    <input style={{width:"100%",border:"1.5px solid #D0D0D0",borderRadius:8,padding:"9px 12px",fontSize:14,background:"#ffffff",color:"#1a1a1a",outline:"none",display:"block"}} {...props}/>
  </div>;
}

function LoginModal({onLogin,onClose,api}){
  const [tab,setTab]=useState("login");
  const [sel,setSel]=useState("apprenant");
  const [name,setName]=useState("");
  const [email,setEmail]=useState("");
  const [password,setPassword]=useState("");
  const [referralCode,setReferralCode]=useState("");
  const [referralCheck,setReferralCheck]=useState(null);
  const [consentAccepted,setConsentAccepted]=useState(false);
  const [error,setError]=useState("");
  const [loading,setLoading]=useState(false);
  const roles=[{k:"apprenant",l:"Apprenant",d:"Accéder à mes formations"},{k:"charge",l:"Chargé de formation",d:"Suivre mes collaborateurs"},{k:"formateur",l:"Formateur",d:"Gérer mes sessions"},{k:"pedagogue",l:"Pédagogue",d:"Créer des modules"}];

  useEffect(()=>{
    if(!referralCode.trim()){ setReferralCheck(null); return; }
    let active=true;
    const t=setTimeout(()=>{
      api.get(`/api/referral/validate?code=${encodeURIComponent(referralCode.trim())}`)
        .then(d=>{ if(active) setReferralCheck(d); })
        .catch(()=>{ if(active) setReferralCheck({valid:false}); });
    },400);
    return ()=>{ active=false; clearTimeout(t); };
  },[referralCode]); // eslint-disable-line react-hooks/exhaustive-deps

  async function submit(){
    setError(""); setLoading(true);
    try{
      if(tab==="login"){
        const data=await api.post("/api/auth/login",{email,password});
        onLogin(data.user,data.accessToken);
      } else {
        if(!name.trim()) throw new Error("Merci de renseigner votre nom.");
        const data=await api.post("/api/auth/register",{name,email,password,role:sel,referralCode:referralCode.trim()||undefined,consentAccepted:true});
        onLogin(data.user,data.accessToken);
      }
      onClose();
    } catch(err){
      setError(err.message||"Une erreur est survenue.");
    } finally {
      setLoading(false);
    }
  }

  return <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,.55)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:9999}} onClick={onClose}>
    <div style={{background:"#ffffff",borderRadius:14,padding:"2rem",width:420,maxWidth:"96vw",boxShadow:"0 8px 40px rgba(0,0,0,.2)",color:"#1a1a1a"}} onClick={e=>e.stopPropagation()}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:"1.25rem"}}>
        <div style={{display:"flex",alignItems:"center",gap:10}}>
          <Logo size={42}/>
          <div>
            <div style={{fontSize:19,fontWeight:800,color:"#1a1a1a"}}>{tab==="login"?"Connexion":"Créer un compte"}</div>
            <div style={{fontSize:13,color:"#666",marginTop:2}}>Votre espace TutoRisk</div>
          </div>
        </div>
        <button onClick={onClose} style={{background:"none",border:"none",cursor:"pointer",fontSize:20,color:"#999",lineHeight:1,padding:0}}>✕</button>
      </div>
      <div style={{display:"flex",borderBottom:"1.5px solid #E8E8E8",marginBottom:"1.25rem"}}>
        {["login","register"].map(t=><button key={t} onClick={()=>{setTab(t);setError("");}} style={{padding:"9px 18px",fontSize:13,cursor:"pointer",color:tab===t?"#CC1515":"#888",marginBottom:-1.5,fontWeight:700,background:"none",border:"none",borderBottom:`2.5px solid ${tab===t?"#CC1515":"transparent"}`}}>
          {t==="login"?"Connexion":"Créer un compte"}
        </button>)}
      </div>
      {tab==="register"&&<>
        <div style={{fontSize:12,color:"#444",fontWeight:700,marginBottom:6}}>Sélectionnez votre profil</div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:6,marginBottom:12}}>
          {roles.map(r=><div key={r.k} onClick={()=>setSel(r.k)} style={{border:`1.5px solid ${sel===r.k?"#CC1515":"#E0E0E0"}`,borderRadius:8,padding:9,cursor:"pointer",textAlign:"center",background:sel===r.k?"#FDEAEA":"#FAFAFA"}}>
            <div style={{fontSize:12,fontWeight:700,color:"#1a1a1a"}}>{r.l}</div>
            <div style={{fontSize:10,color:"#888",marginTop:2}}>{r.d}</div>
          </div>)}
        </div>
        <Input label="Nom complet" placeholder="Jean Dupont" value={name} onChange={e=>setName(e.target.value)}/>
      </>}
      <Input label="Adresse e-mail" placeholder="vous@exemple.fr" type="email" value={email} onChange={e=>setEmail(e.target.value)}/>
      <Input label="Mot de passe" type="password" placeholder="••••••••" value={password} onChange={e=>setPassword(e.target.value)}/>
      {tab==="register"&&<>
        <Input label="Code ambassadeur (facultatif)" placeholder="ex : DFTXA69M" value={referralCode} onChange={e=>setReferralCode(e.target.value.toUpperCase())}/>
        {referralCode.trim()&&referralCheck?.valid&&<div style={{background:"#E8F5E9",color:"#2E7D32",borderRadius:7,padding:"7px 12px",fontSize:12,marginTop:-6,marginBottom:12,fontWeight:600}}>✅ Code de {referralCheck.ownerName} — {referralCheck.discountPercent}% de réduction sur vos achats</div>}
        {referralCode.trim()&&referralCheck&&!referralCheck.valid&&<div style={{background:"#FDEAEA",color:"#CC1515",borderRadius:7,padding:"7px 12px",fontSize:12,marginTop:-6,marginBottom:12,fontWeight:600}}>Code ambassadeur invalide</div>}
        {/* RGPD Art. 7 — consentement explicite obligatoire */}
        <label style={{display:"flex",alignItems:"flex-start",gap:9,fontSize:12,lineHeight:1.5,cursor:"pointer",marginTop:4,marginBottom:4,padding:10,background:consentAccepted?"#F0FFF4":"#FFF8F8",borderRadius:8,border:`1.5px solid ${consentAccepted?"#A5D6A7":"#F5C6C6"}`}}>
          <input type="checkbox" checked={consentAccepted} onChange={e=>setConsentAccepted(e.target.checked)} style={{marginTop:2,flexShrink:0,accentColor:"#CC1515"}}/>
          <span>J'ai lu et j'accepte la <span onClick={e=>{e.preventDefault();e.stopPropagation();window.open('/politique-confidentialite','_blank');}} style={{color:"#CC1515",fontWeight:700,cursor:"pointer",textDecoration:"underline"}}>politique de confidentialité</span> et les <span onClick={e=>{e.preventDefault();e.stopPropagation();window.open('/politique-confidentialite','_blank');}} style={{color:"#CC1515",fontWeight:700,cursor:"pointer",textDecoration:"underline"}}>CGU</span> de TutoRisk. <span style={{color:"#CC1515",fontWeight:700}}>*</span></span>
        </label>
      </>}
      {tab==="login"&&<div style={{textAlign:"right",marginBottom:14}}><span style={{fontSize:12,color:"#CC1515",cursor:"pointer",fontWeight:600}}>Mot de passe oublié ?</span></div>}
      {error&&<div style={{background:"#FDEAEA",color:"#CC1515",borderRadius:7,padding:"8px 12px",fontSize:12,marginBottom:12,fontWeight:600}}>{error}</div>}
      <BtnR onClick={submit} style={{width:"100%",padding:11,fontSize:14,borderRadius:8,opacity:(loading||(tab==="register"&&!consentAccepted))?.6:1}} disabled={tab==="register"&&!consentAccepted}>
        {loading?"Veuillez patienter…":tab==="login"?"Se connecter →":"Créer mon compte →"}
      </BtnR>
    </div>
  </div>;
}

function Navbar({page,setPage,user,onLogin,onLogout}){
  const [menu,setMenu]=useState(false);
  const [activitesOpen,setActivitesOpen]=useState(false);
  const isMobile=useIsMobile(900);
  const dropRef=useRef(null);

  // Ferme le dropdown si on clique ailleurs
  useEffect(()=>{
    const h=e=>{ if(dropRef.current&&!dropRef.current.contains(e.target)) setActivitesOpen(false); };
    document.addEventListener("mousedown",h);
    return ()=>document.removeEventListener("mousedown",h);
  },[]);

  const NAV_LINKS=[
    {id:"home",label:"Accueil"},
    {id:"a-propos",label:"À propos"},
    {id:"contact",label:"Contact"},
  ];

  const ACTIVITES=[
    {id:"activite-sst",label:"Santé & sécurité au travail",ic:"👷"},
    {id:"activite-aleas",label:"Aléas naturels",ic:"🌊"},
    {id:"activite-risques",label:"Risques technologiques",ic:"🏭"},
    {id:"activite-collectivites",label:"Collectivités (PCS/PICS)",ic:"🏛️"},
  ];

  function nav(id){ setPage(id); setMenu(false); setActivitesOpen(false); }

  return <nav style={{background:"#fff",position:"sticky",top:0,zIndex:200,boxShadow:"0 1px 12px rgba(0,0,0,.08)",borderBottom:"1px solid #E2E8F0"}}>
    {/* Bandeau supérieur — très fin, contacts rapides */}
    {!isMobile&&<div style={{background:"#fff",color:"#64748B",fontSize:11,padding:"5px 2rem",display:"flex",justifyContent:"space-between",alignItems:"center",borderBottom:"1px solid #E2E8F0"}}>
      <span>Le spécialiste de la formation en gestion des risques · Depuis 2002</span>
      <div style={{display:"flex",gap:"1.5rem"}}>
        <a href="mailto:contact@tutorisk.com" style={{color:"#64748B",textDecoration:"none"}}>✉ contact@tutorisk.com</a>
        <a href="https://linkedin.com/company/tutorisk" target="_blank" rel="noreferrer" style={{color:"#64748B",textDecoration:"none"}}>LinkedIn</a>
      </div>
    </div>}

    {/* Barre principale */}
    <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:isMobile?"0 .875rem":"0 2rem",height:62,maxWidth:1300,margin:"0 auto",width:"100%"}}>
      {/* Logo */}
      <div style={{display:"flex",alignItems:"center",cursor:"pointer",flexShrink:0}} onClick={()=>nav("home")}>
        <LogoLockup height={isMobile?30:38}/>
      </div>

      {/* Nav desktop */}
      {!isMobile&&<div style={{display:"flex",alignItems:"center",gap:"1.75rem"}}>
        {NAV_LINKS.map(l=><button key={l.id} onClick={()=>nav(l.id)}
          style={{background:"none",border:"none",cursor:"pointer",fontSize:14,fontWeight:600,color:page===l.id?"#CC1515":"#374151",padding:0,borderBottom:page===l.id?"2px solid #CC1515":"2px solid transparent",paddingBottom:2,transition:"color .15s"}}>
          {l.label}
        </button>)}

        {/* Dropdown Nos activités */}
        <div ref={dropRef} style={{position:"relative"}}>
          <button onClick={()=>setActivitesOpen(o=>!o)}
            style={{background:"none",border:"none",cursor:"pointer",fontSize:14,fontWeight:600,color:["activite-sst","activite-aleas","activite-risques","activite-collectivites","nos-activites"].includes(page)?"#CC1515":"#374151",padding:0,display:"flex",alignItems:"center",gap:4,borderBottom:["activite-sst","activite-aleas","activite-risques","activite-collectivites"].includes(page)?"2px solid #CC1515":"2px solid transparent",paddingBottom:2}}>
            Nos activités <span style={{fontSize:10,transition:"transform .2s",display:"inline-block",transform:activitesOpen?"rotate(180deg)":"none"}}>▼</span>
          </button>
          {activitesOpen&&<div style={{position:"absolute",top:"calc(100% + 12px)",left:"50%",transform:"translateX(-50%)",background:"#fff",border:"1px solid #E8ECF0",borderRadius:12,boxShadow:"0 12px 40px rgba(0,0,0,.12)",minWidth:240,overflow:"hidden",zIndex:300}}>
            <div style={{padding:".375rem"}}>
              {ACTIVITES.map(a=><button key={a.id} onClick={()=>nav(a.id)}
                style={{display:"flex",alignItems:"center",gap:10,width:"100%",background:page===a.id?"#FFF5F5":"transparent",border:"none",borderRadius:8,padding:"10px 12px",cursor:"pointer",fontSize:13,fontWeight:page===a.id?700:500,color:page===a.id?"#CC1515":"#374151",textAlign:"left"}}>
                <span style={{fontSize:16}}>{a.ic}</span>{a.label}
              </button>)}
              <div style={{margin:"4px 8px",borderTop:"1px solid #F0F0F0"}}/>
              <button onClick={()=>nav("nos-activites")}
                style={{display:"flex",alignItems:"center",gap:8,width:"100%",background:"transparent",border:"none",borderRadius:8,padding:"8px 12px",cursor:"pointer",fontSize:12,fontWeight:600,color:"#CC1515",textAlign:"left"}}>
                Voir toutes nos activités →
              </button>
            </div>
          </div>}
        </div>

        {/* Formation en ligne — bouton CTA */}
        <button onClick={()=>nav("catalog")}
          style={{background:"#CC1515",color:"#fff",border:"none",borderRadius:8,padding:"8px 16px",fontSize:13,fontWeight:700,cursor:"pointer",display:"flex",alignItems:"center",gap:6}}>
          🎓 Formations en ligne
        </button>

        {/* Espace utilisateur */}
        {user
          ?<div style={{display:"flex",gap:8,alignItems:"center"}}>
            <button onClick={()=>nav("dashboard")} style={{background:page==="dashboard"?"#FDEAEA":"#F8F8F8",border:"1px solid #E8E8E8",borderRadius:8,padding:"6px 12px",fontSize:12,fontWeight:700,cursor:"pointer",color:"#374151"}}>Mon espace</button>
            <button onClick={()=>nav("account")} style={{background:"none",border:"none",cursor:"pointer",padding:0}}>
              <div style={{width:32,height:32,borderRadius:"50%",background:"#CC1515",color:"#fff",display:"flex",alignItems:"center",justifyContent:"center",fontSize:13,fontWeight:800}}>{user.name?.[0]?.toUpperCase()||"U"}</div>
            </button>
          </div>
          :<button onClick={onLogin} style={{background:"#F8F8F8",color:"#374151",border:"1px solid #E8E8E8",borderRadius:8,padding:"7px 14px",fontSize:13,fontWeight:600,cursor:"pointer"}}>
            Connexion
          </button>}
      </div>}

      {/* Burger mobile */}
      {isMobile&&<div style={{display:"flex",gap:8,alignItems:"center"}}>
        {user&&<button onClick={()=>nav("dashboard")} style={{background:"#CC1515",color:"#fff",border:"none",borderRadius:7,padding:"6px 10px",fontSize:11,fontWeight:700,cursor:"pointer"}}>Espace</button>}
        {!user&&<button onClick={onLogin} style={{background:"#CC1515",color:"#fff",border:"none",borderRadius:7,padding:"6px 12px",fontSize:12,fontWeight:700,cursor:"pointer"}}>Connexion</button>}
        <button onClick={()=>setMenu(m=>!m)} style={{background:"none",border:"none",cursor:"pointer",fontSize:22,color:"#374151",padding:4}}>
          {menu?"✕":"☰"}
        </button>
      </div>}
    </div>

    {/* Menu mobile */}
    {isMobile&&menu&&<div style={{background:"#fff",borderTop:"1px solid #F0F0F0",padding:".75rem 1rem"}}>
      {[...NAV_LINKS,...ACTIVITES,{id:"catalog",label:"🎓 Formations en ligne"},{id:"nos-activites",label:"Toutes nos activités"}].map(l=>
        <button key={l.id} onClick={()=>nav(l.id)} style={{display:"block",width:"100%",background:"none",border:"none",textAlign:"left",padding:"10px 0",fontSize:14,fontWeight:600,color:page===l.id?"#CC1515":"#374151",borderBottom:"1px solid #F5F5F5",cursor:"pointer"}}>
          {l.label}
        </button>)}
      {user&&<><button onClick={()=>nav("account")} style={{display:"block",width:"100%",background:"none",border:"none",textAlign:"left",padding:"10px 0",fontSize:14,fontWeight:600,color:"#374151",borderBottom:"1px solid #F5F5F5",cursor:"pointer"}}>Mon compte</button>
      <button onClick={()=>{onLogout();setMenu(false);}} style={{display:"block",width:"100%",background:"none",border:"none",textAlign:"left",padding:"10px 0",fontSize:14,fontWeight:600,color:"#CC1515",cursor:"pointer"}}>Déconnexion</button></>}
    </div>}
  </nav>;
}

function HeroCarousel(){
  const HEADER_IMG = "data:image/jpeg;base64,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";
  const IMG_ELECTRIQUE = "data:image/jpeg;base64,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";
  const IMG_EXTINCTEUR = "data:image/jpeg;base64,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";
  const IMG_INDUSTRIE = "data:image/jpeg;base64,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";
  const IMG_ORDIDOS = "data:image/jpeg;base64,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";
  const IMG_SANTE = "data:image/jpeg;base64,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";
  const slides = [
    { type:"img", src:HEADER_IMG, label:"Sécurité sur chantier", ic:"👷" },
    { type:"img", src:IMG_ELECTRIQUE, label:"Habilitation électrique", ic:"⚡" },
    { type:"img", src:IMG_EXTINCTEUR, label:"Sécurité incendie", ic:"🔥" },
    { type:"img", src:IMG_INDUSTRIE, label:"Risques industriels", ic:"🏭" },
    { type:"img", src:IMG_ORDIDOS, label:"Risques psychosociaux & TMS", ic:"💻" },
    { type:"img", src:IMG_SANTE, label:"Aide et accompagnement", ic:"🩺" },
  ];
  const [idx,setIdx]=useState(0);
  useEffect(()=>{
    const t=setInterval(()=>setIdx(i=>(i+1)%slides.length),3500);
    return ()=>clearInterval(t);
  },[]);
  return <div style={{position:"absolute",inset:0,overflow:"hidden"}}>
    {slides.map((s,i)=>(
      <div key={i} style={{position:"absolute",inset:0,opacity:i===idx?1:0,transition:"opacity 1.1s ease-in-out"}}>
        {s.type==="img"
          ? <div style={{position:"absolute",inset:0,backgroundImage:`url(${s.src})`,backgroundSize:"cover",backgroundPosition:"center",transform:i===idx?"scale(1.06)":"scale(1)",transition:"transform 4.5s ease-out"}}/>
          : <div style={{position:"absolute",inset:0,transform:i===idx?"scale(1.05)":"scale(1)",transition:"transform 4.5s ease-out"}}>
              <SceneArt type={s.art}/>
            </div>
        }
        {/* red brand overlay so all slides feel cohesive — duotone effect */}
        <div style={{position:"absolute",inset:0,background:"linear-gradient(120deg,rgba(204,21,21,.92) 0%,rgba(204,21,21,.62) 45%,rgba(122,10,10,.55) 100%)"}}/>
      </div>
    ))}
    {/* slide label bottom-right */}
    <div style={{position:"absolute",bottom:18,right:24,display:"flex",alignItems:"center",gap:8,background:"rgba(0,0,0,.28)",backdropFilter:"blur(4px)",borderRadius:20,padding:"5px 14px",zIndex:3}}>
      <span style={{fontSize:16}}>{slides[idx].ic}</span>
      <span style={{fontSize:12,color:"#fff",fontWeight:600}}>{slides[idx].label}</span>
    </div>
    {/* dots */}
    <div style={{position:"absolute",bottom:20,left:"50%",transform:"translateX(-50%)",display:"flex",gap:7,zIndex:3}}>
      {slides.map((_,i)=>(
        <div key={i} onClick={()=>setIdx(i)} style={{width:i===idx?22:8,height:8,borderRadius:20,background:i===idx?"#fff":"rgba(255,255,255,.45)",cursor:"pointer",transition:"all .3s"}}/>
      ))}
    </div>
  </div>;
}

// Illustrations en niveaux de gris — le filtre rouge appliqué par-dessus crée l'effet duotone
function SceneArt({type}){
  const wrap={width:"100%",height:"100%",display:"block"};
  if(type==="fire") return (
    <svg viewBox="0 0 800 450" style={wrap} preserveAspectRatio="xMidYMid slice">
      <rect width="800" height="450" fill="#161616"/>
      <path d="M480,450 Q500,360 470,320 Q520,340 530,260 Q560,300 580,230 Q610,290 630,220 Q650,300 680,260 Q700,350 730,310 Q745,380 770,450 Z" fill="#fff" opacity="0.16"/>
      <path d="M520,450 Q540,380 515,345 Q555,365 565,300 Q590,335 605,280 Q625,330 645,290 Q662,350 685,320 Q700,390 720,450 Z" fill="#fff" opacity="0.28"/>
      <path d="M560,450 Q575,400 558,375 Q585,388 595,340 Q612,365 625,330 Q640,365 655,340 Q665,390 680,450 Z" fill="#fff" opacity="0.4"/>
      <g transform="translate(150,130)">
        <path d="M8,8 a45,36 0 0 1 90,0 Z" fill="#eee"/>
        <rect x="0" y="0" width="106" height="10" rx="5" fill="#eee"/>
        <circle cx="53" cy="46" r="26" fill="#ddd"/>
        <rect x="20" y="72" width="66" height="100" rx="16" fill="#bbb"/>
        <rect x="78" y="90" width="92" height="18" rx="9" fill="#bbb" transform="rotate(-8 78 99)"/>
        <rect x="26" y="168" width="22" height="80" rx="9" fill="#999"/>
        <rect x="58" y="168" width="22" height="80" rx="9" fill="#999"/>
      </g>
      <path d="M260,230 Q315,210 375,230 Q425,247 455,222" stroke="#eee" strokeWidth="8" fill="none" opacity="0.85"/>
      <circle cx="455" cy="222" r="6" fill="#eee"/>
    </svg>
  );
  if(type==="chemical") return (
    <svg viewBox="0 0 800 450" style={wrap} preserveAspectRatio="xMidYMid slice">
      <rect width="800" height="450" fill="#161616"/>
      <g transform="translate(440,140)">
        <ellipse cx="60" cy="0" rx="55" ry="14" fill="#999"/>
        <rect x="5" y="0" width="110" height="165" fill="#bbb"/>
        <ellipse cx="60" cy="165" rx="55" ry="14" fill="#888"/>
        <rect x="5" y="42" width="110" height="20" fill="#666"/>
        <rect x="5" y="100" width="110" height="20" fill="#666"/>
      </g>
      <g transform="translate(175,115)">
        <circle cx="50" cy="32" r="26" fill="#ddd"/>
        <rect x="36" y="50" width="28" height="16" rx="6" fill="#999"/>
        <rect x="12" y="84" width="76" height="112" rx="18" fill="#bbb"/>
        <rect x="-22" y="98" width="42" height="16" rx="8" fill="#bbb"/>
        <rect x="82" y="98" width="42" height="16" rx="8" fill="#bbb"/>
        <rect x="18" y="196" width="22" height="80" rx="9" fill="#999"/>
        <rect x="58" y="196" width="22" height="80" rx="9" fill="#999"/>
      </g>
      <g transform="translate(575,55)">
        <path d="M30,0 L62,58 L-2,58 Z" fill="none" stroke="#eee" strokeWidth="5"/>
        <text x="30" y="48" textAnchor="middle" fill="#eee" fontSize="36" fontWeight="800">!</text>
      </g>
    </svg>
  );
  if(type==="electric") return (
    <svg viewBox="0 0 800 450" style={wrap} preserveAspectRatio="xMidYMid slice">
      <rect width="800" height="450" fill="#161616"/>
      <g transform="translate(480,85)">
        <rect x="0" y="0" width="170" height="250" rx="6" fill="#999"/>
        <rect x="10" y="10" width="150" height="230" rx="4" fill="#2b2b2b"/>
        <rect x="24" y="28" width="46" height="28" rx="3" fill="#777"/>
        <rect x="88" y="28" width="46" height="28" rx="3" fill="#777"/>
        <rect x="24" y="76" width="46" height="28" rx="3" fill="#777"/>
        <rect x="88" y="76" width="46" height="28" rx="3" fill="#777"/>
        <rect x="24" y="124" width="46" height="28" rx="3" fill="#777"/>
        <rect x="88" y="124" width="46" height="28" rx="3" fill="#777"/>
        <rect x="24" y="172" width="46" height="28" rx="3" fill="#777"/>
        <rect x="88" y="172" width="46" height="28" rx="3" fill="#777"/>
      </g>
      <g transform="translate(180,125)">
        <circle cx="50" cy="30" r="24" fill="#ddd"/>
        <rect x="16" y="54" width="68" height="100" rx="16" fill="#bbb"/>
        <rect x="78" y="64" width="120" height="16" rx="8" fill="#bbb" transform="rotate(-4 78 72)"/>
        <rect x="22" y="154" width="22" height="78" rx="9" fill="#999"/>
        <rect x="58" y="154" width="22" height="78" rx="9" fill="#999"/>
      </g>
      <path d="M400,140 L432,195 L406,200 L444,260 L410,233 L380,260 L396,205 L364,200 Z" fill="#fff" opacity="0.85"/>
    </svg>
  );
  if(type==="natural") return (
    <svg viewBox="0 0 800 450" style={wrap} preserveAspectRatio="xMidYMid slice">
      <rect width="800" height="450" fill="#161616"/>
      <g transform="translate(330,150)">
        <polygon points="70,0 150,70 -10,70" fill="#999"/>
        <rect x="0" y="70" width="140" height="115" fill="#bbb"/>
        <rect x="55" y="120" width="30" height="65" fill="#666"/>
        <rect x="20" y="95" width="24" height="24" fill="#888"/>
        <rect x="96" y="95" width="24" height="24" fill="#888"/>
      </g>
      <g stroke="#eee" strokeWidth="4" fill="none" opacity="0.65">
        <path d="M150,55 Q300,-5 450,35 Q550,65 600,25"/>
        <path d="M130,85 Q280,25 430,65 Q540,95 590,55"/>
        <path d="M120,115 Q260,55 410,95 Q520,125 580,85"/>
        <path d="M115,145 Q250,90 400,125 Q505,150 565,115"/>
      </g>
      <g stroke="#fff" strokeWidth="6" fill="none" opacity="0.5">
        <path d="M0,395 Q50,375 100,395 Q150,415 200,395 Q250,375 300,395 Q350,415 400,395 Q450,375 500,395 Q550,415 600,395 Q650,375 700,395 Q750,415 800,395"/>
        <path d="M0,415 Q50,400 100,415 Q150,430 200,415 Q250,400 300,415 Q350,430 400,415 Q450,400 500,415 Q550,430 600,415 Q650,400 700,415 Q750,430 800,415"/>
      </g>
    </svg>
  );
  return null;
}

// Affiche les bandeaux d'annonce actifs ciblant une page donnée
// ("home" | "catalog" | "dashboard"), configurés par l'admin.
function BannerStrip({api,page}){
  const [banners,setBanners]=useState([]);
  useEffect(()=>{
    let active=true;
    api.get(`/api/banners?page=${page}`).then(d=>{ if(active) setBanners(d.banners); }).catch(()=>{});
    return ()=>{ active=false; };
  },[page]); // eslint-disable-line react-hooks/exhaustive-deps

  if(banners.length===0) return null;
  return <>
    {banners.map(b=>
      <div key={b.id} style={{background:b.backgroundColor,color:b.textColor,padding:"12px 1.5rem",display:"flex",alignItems:"center",justifyContent:"center",gap:14,flexWrap:"wrap",textAlign:"center"}}>
        {b.hasImage&&<img src={`${API_BASE}/api/banners/${b.id}/image`} alt="" style={{height:36,maxWidth:120,objectFit:"contain"}}/>}
        {b.text&&<span style={{fontSize:14,fontWeight:700}}>{b.text}</span>}
      </div>
    )}
  </>;
}

function HomePage({onCatalog,onLogin,user,api,setPage}){
  const [count,setCount]=useState({apprenants:0,modules:0,conformite:0,satisfaction:0});
  const counted=useRef(false);
  useEffect(()=>{
    if(counted.current) return; counted.current=true;
    const targets={apprenants:500,modules:15,conformite:100,satisfaction:98};
    const dur=1800,steps=60;
    let frame=0;
    const t=setInterval(()=>{
      frame++;
      const pct=frame/steps;
      const ease=1-Math.pow(1-pct,3);
      setCount({apprenants:Math.round(targets.apprenants*ease),modules:Math.round(targets.modules*ease),conformite:Math.round(targets.conformite*ease),satisfaction:Math.round(targets.satisfaction*ease)});
      if(frame>=steps) clearInterval(t);
    },dur/steps);
    return ()=>clearInterval(t);
  },[]);

  useEffect(()=>{
    const id="tr-home-css";
    if(document.getElementById(id)) return;
    const s=document.createElement("style");
    s.id=id;
    s.textContent=`
      .tr-card-lift{transition:transform .2s ease,box-shadow .2s ease;}
      .tr-card-lift:hover{transform:translateY(-4px);box-shadow:0 16px 40px rgba(0,0,0,.12)!important;}
      .tr-domain-card{transition:all .2s ease;cursor:pointer;}
      .tr-domain-card:hover{transform:translateY(-3px);box-shadow:0 8px 24px rgba(0,0,0,.1)!important;}
      .tr-domain-card:hover .tr-domain-cta{opacity:1!important;}
      .tr-step-num{transition:background .2s,color .2s;}
      .tr-hero-tag{animation:tr-fade-in .6s ease forwards;}
      .tr-hero-title{animation:tr-slide-up .7s .1s ease both;}
      .tr-hero-sub{animation:tr-slide-up .7s .2s ease both;}
      .tr-hero-ctas{animation:tr-slide-up .7s .3s ease both;}
      @keyframes tr-fade-in{from{opacity:0}to{opacity:1}}
      @keyframes tr-slide-up{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:none}}
      .tr-btn-white{transition:all .18s;background:#fff;color:#CC1515;border:none;border-radius:8px;padding:13px 28px;font-size:15px;font-weight:800;cursor:pointer;box-shadow:0 4px 14px rgba(0,0,0,.2);}
      .tr-btn-white:hover{background:#FFF5F5;transform:translateY(-1px);box-shadow:0 6px 20px rgba(0,0,0,.25);}
      .tr-btn-outline{transition:all .18s;background:rgba(255,255,255,.1);color:#fff;border:1.5px solid rgba(255,255,255,.55);border-radius:8px;padding:13px 28px;font-size:15px;font-weight:700;cursor:pointer;backdrop-filter:blur(6px);}
      .tr-btn-outline:hover{background:rgba(255,255,255,.2);border-color:#fff;}
      .tr-btn-red{transition:all .18s;background:#CC1515;color:#fff;border:none;border-radius:8px;padding:13px 28px;font-size:15px;font-weight:800;cursor:pointer;}
      .tr-btn-ghost{transition:all .18s;background:transparent;color:#374151;border:1.5px solid #E2E8F0;border-radius:8px;padding:13px 28px;font-size:15px;font-weight:700;cursor:pointer;}
      .tr-btn-ghost:hover{background:#F8FAFC;border-color:#CC1515;color:#CC1515;}
      .tr-btn-red:hover{background:#B01010;transform:translateY(-1px);box-shadow:0 6px 20px rgba(204,21,21,.3);}
      .tr-nav-link{transition:color .15s;}
      .tr-nav-link:hover{color:#CC1515!important;}
    `;
    document.head.appendChild(s);
  },[]);

  const isMobile=useIsMobile();

  const DOMAINS=[
    {ic:"🔥",color:"#CC1515",light:"#FFF5F5",cat:"Sécurité incendie",items:["Évacuation & plan de sécurité","Maniement des extincteurs","Rôle d'agent de première intervention"]},
    {ic:"⚡",color:"#0277BD",light:"#EFF8FF",cat:"Risques professionnels",items:["Habilitation électrique H0B0","Risque chimique & ATEX","Travail en hauteur & chutes"]},
    {ic:"🌊",color:"#0D47A1",light:"#EBF2FF",cat:"Aléas naturels",items:["Submersion & inondation","Séisme & effondrement","Plan communal de sauvegarde"]},
    {ic:"🏭",color:"#5E35B1",light:"#F3EFFF",cat:"Risques technologiques",items:["Sites ICPE & Seveso","Transport de matières dangereuses","Plan d'opération interne (POI)"]},
    {ic:"👥",color:"#E65100",light:"#FFF8F0",cat:"RH & bien-être au travail",items:["Harcèlement & RPS","Gestes et postures (PRAP)","Management bienveillant"]},
    {ic:"📋",color:"#2E7D32",light:"#EFFFF2",cat:"Réglementation & conformité",items:["Document Unique (DUERP)","CSE / CHSCT","Obligations Code du travail"]},
  ];

  const STEPS=[
    {n:"01",ic:"📋",title:"Inscrivez-vous ou invitez vos équipes",desc:"Créez votre espace en 2 minutes. Invitez vos collaborateurs par email ou importez une liste. Chaque apprenant reçoit son accès personnalisé."},
    {n:"02",ic:"🎓",title:"Suivez les modules à votre rythme",desc:"Vidéos, documents, QCM — chaque formation est découpée en séquences courtes, adaptées aux écrans mobiles et à la reprise d'une session en cours."},
    {n:"03",ic:"🏆",title:"Obtenez vos attestations",desc:"À la completion d'un module, l'attestation est générée automatiquement, horodatée et traçable. Exportez le registre de formation en un clic."},
  ];

  const AVANTAGES=[
    {ic:"📱",color:"#CC1515",title:"100 % en ligne, 100 % mobile",desc:"Accédez à toutes vos formations depuis n'importe quel appareil — smartphone, tablette ou ordinateur — sans installation ni contrainte horaire."},
    {ic:"📊",color:"#0277BD",title:"Suivi en temps réel",desc:"Tableaux de bord pour les responsables : taux de complétion, scores aux QCM, apprenants en retard, temps de formation par collaborateur."},
    {ic:"🏛️",color:"#2E7D32",title:"Conformité réglementaire garantie",desc:"Contenus actualisés selon les évolutions du Code du travail. Attestations valides pour les contrôles Inspection du travail et CARSAT."},
  ];

  return <>
    <BannerStrip api={api} page="home"/>

    {/* ── HERO ───────────────────────────────────── */}
    <section style={{background:"#fff",color:"#374151",position:"relative",overflow:"hidden",minHeight:isMobile?500:560,display:"flex",alignItems:"center",borderBottom:"1px solid #E2E8F0"}}>
      {/* Motif géométrique SVG */}
      <svg aria-hidden="true" style={{position:"absolute",inset:0,width:"100%",height:"100%",opacity:.04,pointerEvents:"none"}} xmlns="http://www.w3.org/2000/svg">
        <defs><pattern id="grid" width="60" height="60" patternUnits="userSpaceOnUse"><path d="M60 0L0 60M30 0L0 30M60 30L30 60" stroke="#CC1515" strokeWidth="1" fill="none"/></pattern></defs>
        <rect width="100%" height="100%" fill="url(#grid)"/>
      </svg>
      <div style={{maxWidth:1100,margin:"0 auto",width:"100%",padding:isMobile?"2.5rem 1.25rem":"4rem 2rem",display:"grid",gridTemplateColumns:isMobile?"1fr":"1fr 1fr",gap:"2.5rem",alignItems:"center",position:"relative",zIndex:2}}>
        <div>
          <div style={{marginBottom:"1.5rem"}}><LogoStacked width={isMobile?88:120}/></div>
          <div className="tr-hero-tag" style={{display:"inline-flex",alignItems:"center",gap:6,background:"#FFF5F5",border:"1px solid rgba(204,21,21,.25)",borderRadius:20,fontSize:11,padding:"4px 14px",marginBottom:"1.5rem",color:"#CC1515",letterSpacing:".8px",textTransform:"uppercase",fontWeight:700}}>
            ⚡ Formation Santé &amp; Sécurité au Travail
          </div>
          <h1 className="tr-hero-title" style={{fontSize:isMobile?32:48,fontWeight:900,lineHeight:1.12,marginBottom:"1.25rem",color:"#0F1923",letterSpacing:"-.5px"}}>
            Formez vos équipes à la{" "}
            <span style={{color:"#CC1515",position:"relative"}}>prévention des risques</span>
            <br/>en toute conformité
          </h1>
          <p className="tr-hero-sub" style={{fontSize:16,color:"#64748B",maxWidth:480,lineHeight:1.7,marginBottom:"2rem"}}>
            La plateforme e-learning dédiée aux professionnels de la sécurité, du droit du travail et de la gestion des risques naturels et industriels.
          </p>
          <div className="tr-hero-ctas" style={{display:"flex",gap:".875rem",flexWrap:"wrap"}}>
            <button className="tr-btn-red" onClick={onCatalog}>Découvrir le catalogue →</button>
            {!user&&<button className="tr-btn-ghost" onClick={onLogin}>Créer un compte gratuit</button>}
          </div>
          <div style={{display:"flex",gap:"1.5rem",marginTop:"2rem",paddingTop:"1.5rem",borderTop:"1px solid #E2E8F0",flexWrap:"wrap"}}>
            {[["✅","Attestations valides CARSAT"],["⚡","Accès immédiat"],["🔒","Données hébergées en France"]].map(([ic,t])=>
              <div key={t} style={{fontSize:12,color:"#64748B",display:"flex",alignItems:"center",gap:5}}><span>{ic}</span>{t}</div>)}
          </div>
        </div>
        {!isMobile&&<div style={{display:"flex",justifyContent:"center"}}>
          {/* Fausse carte "module en cours" */}
          <div style={{background:"#fff",border:"1px solid #E2E8F0",borderRadius:16,padding:"1.5rem",width:320,boxShadow:"0 20px 50px rgba(15,25,35,.12)"}}>
            <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:"1rem"}}>
              <div style={{width:38,height:38,borderRadius:9,background:"linear-gradient(135deg,#CC1515,#FF6B6B)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:18}}>🔥</div>
              <div><div style={{fontSize:13,fontWeight:700,color:"#0F1923"}}>Sécurité incendie — Niv. 1</div><div style={{fontSize:11,color:"#94A3B8"}}>Chapitre 2 sur 4</div></div>
            </div>
            <div style={{background:"#F8FAFC",border:"1px solid #E2E8F0",borderRadius:8,padding:".875rem",marginBottom:"1rem"}}>
              <div style={{fontSize:11,color:"#94A3B8",marginBottom:6,textTransform:"uppercase",letterSpacing:".5px",fontWeight:600}}>Progression globale</div>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:6}}><span style={{fontSize:13,color:"#0F1923",fontWeight:700}}>52%</span><span style={{fontSize:11,color:"#94A3B8"}}>4 / 8 contenus</span></div>
              <div style={{height:6,background:"#E2E8F0",borderRadius:3,overflow:"hidden"}}><div style={{width:"52%",height:"100%",background:"linear-gradient(90deg,#CC1515,#FF6B6B)",borderRadius:3}}/></div>
            </div>
            {[["🎬","Vidéo : causes d'incendie","✅"],["📄","Fiche prévention PDF","✅"],["✅","QCM — connaissances","⏳"],["🔒","Procédures d'évacuation","🔒"]].map(([ic,t,s])=>
              <div key={t} style={{display:"flex",alignItems:"center",gap:8,padding:"7px 0",borderBottom:"1px solid #F1F5F9"}}>
                <span style={{fontSize:13}}>{ic}</span>
                <span style={{fontSize:12,flex:1,color:s==="🔒"?"#CBD5E1":"#475569"}}>{t}</span>
                <span style={{fontSize:12}}>{s}</span>
              </div>)}
            <button onClick={onCatalog} style={{marginTop:"1rem",width:"100%",background:"#CC1515",color:"#fff",border:"none",borderRadius:8,padding:"10px",fontSize:12,fontWeight:700,cursor:"pointer"}}>
              Continuer la formation →
            </button>
          </div>
        </div>}
      </div>
    </section>

    {/* ── CHIFFRES ────────────────────────────────── */}
    <section style={{background:"#CC1515",padding:"1.25rem 2rem"}}>
      <div style={{maxWidth:960,margin:"0 auto",display:"grid",gridTemplateColumns:`repeat(${isMobile?2:4},1fr)`,gap:"1rem"}}>
        {[
          [count.apprenants+"+"  ,"Apprenants formés"],
          [count.modules         ,"Modules disponibles"],
          [count.conformite+"%"  ,"Contenus conformes"],
          [count.satisfaction+"%","Taux de satisfaction"],
        ].map(([n,l])=><div key={l} style={{textAlign:"center",padding:".75rem 0"}}>
          <div style={{fontSize:isMobile?24:30,fontWeight:900,color:"#fff",lineHeight:1}}>{n}</div>
          <div style={{fontSize:11,color:"rgba(255,255,255,.75)",marginTop:4,fontWeight:500}}>{l}</div>
        </div>)}
      </div>
    </section>

    <div style={{maxWidth:1100,margin:"0 auto",width:"100%",padding:isMobile?"2rem .875rem":"0 2rem"}}>

      {/* ── AVANTAGES ────────────────────────────────── */}
      <section style={{padding:"4rem 0 2rem"}}>
        <div style={{textAlign:"center",marginBottom:"2.5rem"}}>
          <div style={{fontSize:11,color:"#CC1515",fontWeight:700,letterSpacing:1.2,textTransform:"uppercase",marginBottom:".5rem"}}>Pourquoi TutoRisk</div>
          <h2 style={{fontSize:isMobile?26:34,fontWeight:900,color:"#0F1923",letterSpacing:"-.3px",marginBottom:".75rem"}}>La formation professionnelle,<br/>réinventée</h2>
          <p style={{fontSize:15,color:"#64748B",maxWidth:520,margin:"0 auto",lineHeight:1.7}}>Conçue pour les responsables HSE, les directeurs RH et les équipes de formateurs qui font de la conformité une priorité.</p>
        </div>
        <div style={{display:"grid",gridTemplateColumns:isMobile?"1fr":"repeat(3,1fr)",gap:"1.25rem"}}>
          {AVANTAGES.map(a=><div key={a.title} className="tr-card-lift" style={{background:"#fff",border:"1px solid #E8ECF0",borderRadius:14,padding:"1.75rem",boxShadow:"0 2px 8px rgba(0,0,0,.04)"}}>
            <div style={{width:48,height:48,borderRadius:12,background:a.color+"18",display:"flex",alignItems:"center",justifyContent:"center",fontSize:22,marginBottom:"1.125rem"}}>{a.ic}</div>
            <div style={{fontSize:16,fontWeight:800,color:"#0F1923",marginBottom:".625rem"}}>{a.title}</div>
            <p style={{fontSize:13.5,color:"#64748B",lineHeight:1.65,margin:0}}>{a.desc}</p>
          </div>)}
        </div>
      </section>

      {/* ── DOMAINES ─────────────────────────────────── */}
      <section style={{padding:"2rem 0 4rem"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-end",marginBottom:"2rem",flexWrap:"wrap",gap:12}}>
          <div>
            <div style={{fontSize:11,color:"#CC1515",fontWeight:700,letterSpacing:1.2,textTransform:"uppercase",marginBottom:".5rem"}}>Notre catalogue</div>
            <h2 style={{fontSize:isMobile?24:30,fontWeight:900,color:"#0F1923",letterSpacing:"-.3px",marginBottom:".375rem"}}>6 domaines de formation</h2>
            <p style={{fontSize:14,color:"#64748B",maxWidth:420,margin:0,lineHeight:1.6}}>De la sécurité incendie aux risques industriels, en passant par le droit du travail.</p>
          </div>
          <button className="tr-btn-red" onClick={onCatalog}>Voir tout le catalogue →</button>
        </div>
        <div style={{display:"grid",gridTemplateColumns:isMobile?"1fr":"repeat(3,1fr)",gap:"1rem"}}>
          {DOMAINS.map(d=><div key={d.cat} className="tr-domain-card" style={{background:"#fff",border:`1px solid #E8ECF0`,borderTop:`3px solid ${d.color}`,borderRadius:12,padding:"1.375rem",boxShadow:"0 2px 6px rgba(0,0,0,.04)",position:"relative"}}>
            <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:".875rem"}}>
              <div style={{width:40,height:40,borderRadius:10,background:d.light,display:"flex",alignItems:"center",justifyContent:"center",fontSize:20}}>{d.ic}</div>
              <div style={{fontSize:14,fontWeight:800,color:"#0F1923"}}>{d.cat}</div>
            </div>
            {d.items.map(i=><div key={i} style={{fontSize:12.5,color:"#64748B",padding:"4px 0",borderBottom:"1px solid #F1F5F9",display:"flex",alignItems:"center",gap:6}}>
              <span style={{width:5,height:5,borderRadius:"50%",background:d.color,display:"inline-block",flexShrink:0}}/>
              {i}
            </div>)}
            <button className="tr-domain-cta" onClick={onCatalog} style={{opacity:0,marginTop:".875rem",width:"100%",background:d.color+"18",color:d.color,border:`1px solid ${d.color}40`,borderRadius:7,padding:"7px",fontSize:12,fontWeight:700,cursor:"pointer",transition:"opacity .2s"}}>
              Explorer ce domaine →
            </button>
          </div>)}
        </div>
      </section>
    </div>

    {/* ── COMMENT ÇA MARCHE ───────────────────────── */}
    <section style={{background:"#F8FAFC",padding:"4rem 2rem"}}>
      <div style={{maxWidth:1100,margin:"0 auto"}}>
        <div style={{textAlign:"center",marginBottom:"2.75rem"}}>
          <div style={{fontSize:11,color:"#CC1515",fontWeight:700,letterSpacing:1.2,textTransform:"uppercase",marginBottom:".5rem"}}>Prise en main</div>
          <h2 style={{fontSize:isMobile?26:32,fontWeight:900,color:"#0F1923",letterSpacing:"-.3px"}}>Opérationnel en 3 étapes</h2>
        </div>
        <div style={{display:"grid",gridTemplateColumns:isMobile?"1fr":"repeat(3,1fr)",gap:"1.5rem",position:"relative"}}>
          {!isMobile&&<div style={{position:"absolute",top:28,left:"16.5%",right:"16.5%",height:2,background:"linear-gradient(90deg,#CC1515 30%,#E8ECF0 30%)",pointerEvents:"none"}}/>}
          {STEPS.map((s,i)=><div key={s.n} className="tr-card-lift" style={{background:"#fff",border:"1px solid #E8ECF0",borderRadius:14,padding:"2rem 1.5rem",boxShadow:"0 2px 8px rgba(0,0,0,.04)",textAlign:"center",position:"relative"}}>
            <div style={{width:54,height:54,borderRadius:"50%",background:i===0?"#CC1515":"#F1F5F9",border:i===0?"none":"2px solid #E2E8F0",display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 1.25rem",fontSize:i===0?22:20,color:i===0?"#fff":"#94A3B8",fontWeight:800}}>
              {i===0?s.ic:s.n}
            </div>
            <div style={{fontSize:15,fontWeight:800,color:"#0F1923",marginBottom:".75rem",lineHeight:1.3}}>{s.title}</div>
            <p style={{fontSize:13,color:"#64748B",lineHeight:1.65,margin:0}}>{s.desc}</p>
          </div>)}
        </div>
      </div>
    </section>

    {/* ── CTA FINALE ──────────────────────────────── */}
    <section style={{background:"#0F1923",padding:"4.5rem 2rem",position:"relative",overflow:"hidden"}}>
      <div aria-hidden style={{position:"absolute",inset:0,background:"radial-gradient(ellipse at 60% 50%,rgba(204,21,21,.15) 0%,transparent 65%)",pointerEvents:"none"}}/>
      <div style={{maxWidth:720,margin:"0 auto",textAlign:"center",position:"relative",zIndex:1}}>
        <div style={{fontSize:11,color:"#CC1515",fontWeight:700,letterSpacing:1.2,textTransform:"uppercase",marginBottom:"1rem"}}>Prêt à former vos équipes ?</div>
        <h2 style={{fontSize:isMobile?28:38,fontWeight:900,color:"#F8FAFC",letterSpacing:"-.4px",marginBottom:"1.25rem",lineHeight:1.15}}>
          Commencez dès aujourd'hui,<br/><span style={{color:"#FF6B6B"}}>gratuitement</span>
        </h2>
        <p style={{fontSize:15,color:"#94A3B8",marginBottom:"2rem",lineHeight:1.7}}>
          Créez un compte, ajoutez vos collaborateurs et accédez immédiatement aux formations. Aucune carte bancaire requise pour démarrer.
        </p>
        <div style={{display:"flex",gap:".875rem",justifyContent:"center",flexWrap:"wrap"}}>
          <button className="tr-btn-white" onClick={onLogin}>Créer un compte gratuit →</button>
          <button className="tr-btn-outline" onClick={onCatalog}>Explorer le catalogue</button>
        </div>
        <div style={{display:"flex",gap:"1.5rem",justifyContent:"center",marginTop:"2rem",flexWrap:"wrap"}}>
          {["✅ Sans engagement","⚡ Accès immédiat","📜 Attestations incluses"].map(t=><span key={t} style={{fontSize:12,color:"#64748B"}}>{t}</span>)}
        </div>
      </div>
    </section>
  </>;
}

// ═══════════════════════════════════════════════════════════
//  PAGES SITE CORPORATE
// ═══════════════════════════════════════════════════════════

// ── Bannière d'en-tête réutilisable ──────────────────────────
function PageHero({title,subtitle,breadcrumb,bg="#0F1923",onBack,backLabel}){
  const isMobile=useIsMobile();
  return <div style={{background:bg,color:"#fff",padding:isMobile?"2.5rem 1.25rem":"3.5rem 2rem",position:"relative",overflow:"hidden"}}>
    <svg aria-hidden style={{position:"absolute",inset:0,width:"100%",height:"100%",opacity:.05,pointerEvents:"none"}} xmlns="http://www.w3.org/2000/svg">
      <defs><pattern id="ph-grid" width="50" height="50" patternUnits="userSpaceOnUse"><path d="M50 0L0 50M25 0L0 25M50 25L25 50" stroke="#CC1515" strokeWidth=".8" fill="none"/></pattern></defs>
      <rect width="100%" height="100%" fill="url(#ph-grid)"/>
    </svg>
    <div style={{maxWidth:1100,margin:"0 auto",position:"relative",zIndex:1}}>
      {breadcrumb&&<div style={{fontSize:11,color:"rgba(255,255,255,.55)",marginBottom:".75rem",display:"flex",gap:6,alignItems:"center"}}>
        <span style={{cursor:"pointer"}} onClick={onBack}>Accueil</span>
        <span>›</span><span style={{color:"rgba(255,255,255,.8)"}}>{breadcrumb}</span>
      </div>}
      <h1 style={{fontSize:isMobile?26:38,fontWeight:900,lineHeight:1.15,marginBottom:".75rem",letterSpacing:"-.3px"}}>{title}</h1>
      {subtitle&&<p style={{fontSize:15,color:"rgba(255,255,255,.78)",maxWidth:620,lineHeight:1.65,margin:0}}>{subtitle}</p>}
    </div>
  </div>;
}

// ── À propos ─────────────────────────────────────────────────
function AProposPage({setPage}){
  const isMobile=useIsMobile();
  const section={maxWidth:1100,margin:"0 auto",width:"100%",padding:isMobile?"2rem 1.25rem":"3rem 2rem"};
  const TIMELINE=[
    {year:"2002",title:"Création d'ABC Sécurité",desc:"Jérôme Loiseau fonde ABC Sécurité, spécialisé en formation sur les risques naturels, la sécurité incendie et le secourisme."},
    {year:"2004",title:"Extension aux risques professionnels",desc:"Développement de formations à l'évaluation des risques professionnels et à la représentation du personnel (CHSCT). La gamme s'élargit chaque année."},
    {year:"2017",title:"Virage numérique — naissance de TutoRisk",desc:"Lancement de la plateforme de formation en ligne TutoRisk. L'offre s'ouvre aux formations présentielles, hybrides et distancielles synchrones et asynchrones."},
    {year:"2024",title:"Accompagnement des collectivités",desc:"Développement d'un pôle dédié aux collectivités territoriales pour la mise en place des Plans Communaux et Intercommunaux de Sauvegarde (PCS et PICS)."},
  ];
  return <>
    <PageHero title="À propos de TutoRisk" subtitle="Le spécialiste de la formation en gestion des risques depuis 2002 — pour les entreprises privées, publiques et les collectivités territoriales." breadcrumb="À propos" onBack={()=>setPage("home")}/>
    <div style={section}>
      {/* Mission */}
      <div style={{display:"grid",gridTemplateColumns:isMobile?"1fr":"1fr 1fr",gap:"3rem",alignItems:"center",paddingBottom:"3rem",borderBottom:"1px solid #E8ECF0"}}>
        <div>
          <div style={{fontSize:11,color:"#CC1515",fontWeight:700,letterSpacing:1,textTransform:"uppercase",marginBottom:".5rem"}}>Notre mission</div>
          <h2 style={{fontSize:isMobile?24:30,fontWeight:900,color:"#0F1923",lineHeight:1.2,marginBottom:"1.25rem"}}>Prévenir les risques,<br/>protéger les personnes</h2>
          <p style={{fontSize:14.5,color:"#475569",lineHeight:1.75,marginBottom:"1rem"}}>Chez TutoRisk, nous sommes convaincus que la prévention est le meilleur investissement. Notre approche combine l'expertise technique de terrain, des contenus pédagogiques actualisés et des outils numériques performants pour former vos équipes efficacement.</p>
          <p style={{fontSize:14.5,color:"#475569",lineHeight:1.75}}>Qu'il s'agisse d'une PME industrielle, d'une collectivité territoriale ou d'un grand groupe, nous adaptons nos interventions à vos contraintes réelles.</p>
        </div>
        <div style={{background:"#F8FAFC",borderRadius:16,padding:"2rem",border:"1px solid #E2E8F0"}}>
          {[["20+","Années d'expérience"],["500+","Apprenants formés"],["3","Domaines d'expertise"],["100%","Satisfaction client"]].map(([n,l])=>
            <div key={l} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:".875rem 0",borderBottom:"1px solid #E2E8F0",lastChild:{borderBottom:"none"}}}>
              <span style={{fontSize:14,color:"#475569",fontWeight:500}}>{l}</span>
              <span style={{fontSize:22,fontWeight:900,color:"#CC1515"}}>{n}</span>
            </div>)}
        </div>
      </div>

      {/* Fondateur */}
      <div style={{padding:"3rem 0",borderBottom:"1px solid #E8ECF0"}}>
        <div style={{fontSize:11,color:"#CC1515",fontWeight:700,letterSpacing:1,textTransform:"uppercase",marginBottom:"1.5rem"}}>Le fondateur</div>
        <div style={{display:"flex",gap:"2rem",alignItems:"flex-start",flexWrap:"wrap"}}>
          <div style={{width:80,height:80,borderRadius:"50%",background:"linear-gradient(135deg,#CC1515,#FF6B6B)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:28,flexShrink:0,fontWeight:800,color:"#fff"}}>JL</div>
          <div style={{flex:1,minWidth:250}}>
            <div style={{fontSize:20,fontWeight:800,color:"#0F1923",marginBottom:4}}>Jérôme Loiseau</div>
            <div style={{fontSize:13,color:"#CC1515",fontWeight:700,marginBottom:"1rem"}}>Expert en gestion des risques · Fondateur</div>
            <p style={{fontSize:14,color:"#475569",lineHeight:1.75,margin:0}}>Fort de plus de 20 ans d'expérience sur le terrain, Jérôme Loiseau a accompagné des centaines d'entreprises et de collectivités dans la structuration de leur politique de prévention des risques. Sa double compétence — expertise technique et pédagogie — est au cœur de l'ADN TutoRisk.</p>
            <a href="https://linkedin.com/company/tutorisk" target="_blank" rel="noreferrer" style={{display:"inline-flex",alignItems:"center",gap:6,marginTop:"1rem",color:"#0077B5",fontSize:13,fontWeight:600,textDecoration:"none"}}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="#0077B5"><path d="M16 8a6 6 0 016 6v7h-4v-7a2 2 0 00-2-2 2 2 0 00-2 2v7h-4v-7a6 6 0 016-6zM2 9h4v12H2z"/><circle cx="4" cy="4" r="2"/></svg>
              LinkedIn
            </a>
          </div>
        </div>
      </div>

      {/* Timeline */}
      <div style={{padding:"3rem 0"}}>
        <div style={{fontSize:11,color:"#CC1515",fontWeight:700,letterSpacing:1,textTransform:"uppercase",marginBottom:"2rem"}}>Notre histoire</div>
        <div style={{position:"relative"}}>
          {!isMobile&&<div style={{position:"absolute",left:48,top:0,bottom:0,width:2,background:"linear-gradient(180deg,#CC1515 0%,#E2E8F0 100%)"}}/>}
          {TIMELINE.map((t,i)=><div key={t.year} style={{display:"flex",gap:"1.5rem",marginBottom:"2rem",alignItems:"flex-start"}}>
            <div style={{width:96,flexShrink:0,display:"flex",flexDirection:"column",alignItems:"center",gap:6}}>
              <div style={{width:24,height:24,borderRadius:"50%",background:i===TIMELINE.length-1?"#CC1515":"#fff",border:`3px solid ${i===TIMELINE.length-1?"#CC1515":"#CC151540"}`,zIndex:1,flexShrink:0}}/>
              <div style={{fontSize:16,fontWeight:900,color:"#CC1515"}}>{t.year}</div>
            </div>
            <div style={{background:"#F8FAFC",borderRadius:10,padding:"1.125rem 1.25rem",flex:1,border:"1px solid #E2E8F0"}}>
              <div style={{fontSize:15,fontWeight:700,color:"#0F1923",marginBottom:".5rem"}}>{t.title}</div>
              <p style={{fontSize:13.5,color:"#475569",lineHeight:1.65,margin:0}}>{t.desc}</p>
            </div>
          </div>)}
        </div>
      </div>

      {/* CTA */}
      <div style={{background:"#0F1923",borderRadius:16,padding:"2.5rem",textAlign:"center",color:"#fff"}}>
        <div style={{fontSize:22,fontWeight:900,marginBottom:".75rem"}}>Travaillons ensemble</div>
        <p style={{fontSize:14,color:"rgba(255,255,255,.75)",marginBottom:"1.5rem"}}>Vous avez un projet de formation ou d'accompagnement ? Parlons-en.</p>
        <div style={{display:"flex",gap:".875rem",justifyContent:"center",flexWrap:"wrap"}}>
          <button onClick={()=>setPage("contact")} style={{background:"#CC1515",color:"#fff",border:"none",borderRadius:8,padding:"11px 24px",fontSize:14,fontWeight:700,cursor:"pointer"}}>Nous contacter</button>
          <button onClick={()=>setPage("catalog")} style={{background:"rgba(255,255,255,.1)",color:"#fff",border:"1.5px solid rgba(255,255,255,.4)",borderRadius:8,padding:"11px 24px",fontSize:14,fontWeight:600,cursor:"pointer"}}>Voir les formations en ligne</button>
        </div>
      </div>
    </div>
  </>;
}

// ── Nos activités — vue d'ensemble ───────────────────────────
function NosActivitesPage({setPage}){
  const isMobile=useIsMobile();
  const section={maxWidth:1100,margin:"0 auto",width:"100%",padding:isMobile?"2rem 1.25rem":"3rem 2rem"};
  const ACTIVITES=[
    {id:"activite-sst",ic:"👷",color:"#CC1515",light:"#FFF5F5",title:"Santé & sécurité au travail",desc:"Répondez à vos obligations légales et protégez vos collaborateurs grâce à des formations pratiques : incendie, risques chimiques, habilitation électrique, PRAP, RPS, DUERP…",items:["Sécurité incendie & évacuation","Habilitation électrique H0B0","Risque chimique & ATEX","Gestes et postures (PRAP)","Risques psychosociaux","Rédaction du DUERP"],article:"L'employeur prend les mesures nécessaires pour assurer la sécurité et protéger la santé physique et mentale des travailleurs. (Art. L4121-1 du Code du travail)"},
    {id:"activite-aleas",ic:"🌊",color:"#1565C0",light:"#EFF8FF",title:"Aléas naturels majeurs",desc:"Chaque territoire est exposé à des risques naturels spécifiques. Nous vous aidons à anticiper, à vous organiser et à protéger vos équipes et vos populations avant, pendant et après un événement.",items:["Sensibilisation aux aléas naturels","Plans communaux de sauvegarde (PCS)","Plans intercommunaux (PICS)","DICRIM & obligations réglementaires","Submersion & inondation","Séisme & mouvement de terrain"],article:"La prévention des risques naturels est une obligation réglementaire pour les collectivités et une démarche responsable pour les entreprises implantées en zones exposées."},
    {id:"activite-risques",ic:"🏭",color:"#5E35B1",light:"#F3EFFF",title:"Risques technologiques",desc:"Les activités industrielles sont sources de risques pour leur environnement. Nous accompagnons les sites ICPE, les opérateurs ADR et les établissements soumis à des obligations réglementaires spécifiques.",items:["Sites ICPE & Seveso","Transport de matières dangereuses (ADR 1.3)","Plan d'opération interne (POI)","Accès aux établissements classés","Risques industriels majeurs","Obligations réglementaires DREAL"],article:"La maîtrise des risques technologiques est une exigence légale pour les établissements industriels et un enjeu de responsabilité civile et environnementale."},
    {id:"activite-collectivites",ic:"🏛️",color:"#0D47A1",light:"#E8F0FE",title:"Collectivités territoriales",desc:"Depuis 2024, TutoRisk accompagne les communes et intercommunalités dans la mise en place de leur dispositif de gestion de crise, de leurs plans de sauvegarde et dans la sensibilisation de leurs agents.",items:["Plans communaux de sauvegarde (PCS)","Plans intercommunaux (PICS)","Formation des élus & agents","Exercices de simulation de crise","PPMS pour établissements scolaires","Risques spécifiques DOM-TOM"],article:"La loi du 13 août 2004 de modernisation de la sécurité civile rend obligatoire l'élaboration d'un Plan Communal de Sauvegarde pour les communes dotées d'un Plan de Prévention des Risques (PPR)."},
  ];
  return <>
    <PageHero title="Nos activités" subtitle="Trois domaines d'expertise complémentaires pour une politique de prévention globale et cohérente." breadcrumb="Nos activités" onBack={()=>setPage("home")}/>
    <div style={section}>
      <div style={{display:"grid",gridTemplateColumns:isMobile?"1fr":"repeat(2,1fr)",gap:"1.25rem",marginBottom:"3rem"}}>
        {ACTIVITES.map(a=><div key={a.id} className="tr-card-lift" onClick={()=>setPage(a.id)} style={{background:"#fff",border:`1px solid #E8ECF0`,borderTop:`3px solid ${a.color}`,borderRadius:12,padding:"1.5rem",boxShadow:"0 2px 8px rgba(0,0,0,.05)",cursor:"pointer"}}>
          <div style={{display:"flex",gap:12,alignItems:"center",marginBottom:"1rem"}}>
            <div style={{width:46,height:46,borderRadius:12,background:a.light,display:"flex",alignItems:"center",justifyContent:"center",fontSize:22,flexShrink:0}}>{a.ic}</div>
            <div style={{fontSize:16,fontWeight:800,color:"#0F1923",lineHeight:1.25}}>{a.title}</div>
          </div>
          <p style={{fontSize:13.5,color:"#475569",lineHeight:1.65,marginBottom:"1rem"}}>{a.desc}</p>
          <div style={{color:a.color,fontSize:13,fontWeight:700}}>Découvrir →</div>
        </div>)}
      </div>

      {/* Nos 2 modes d'intervention */}
      <div style={{borderTop:"1px solid #E8ECF0",paddingTop:"3rem"}}>
        <div style={{fontSize:11,color:"#CC1515",fontWeight:700,letterSpacing:1,textTransform:"uppercase",marginBottom:"1.5rem"}}>Nos modalités d'intervention</div>
        <div style={{display:"grid",gridTemplateColumns:isMobile?"1fr":"repeat(3,1fr)",gap:"1rem"}}>
          {[
            {ic:"👥",color:"#CC1515",title:"Formation présentielle",desc:"Nos formateurs certifiés se déplacent dans vos locaux ou animent des sessions en centre agréé. Idéal pour les formations pratiques (incendie, gestes d'urgence) et les petits groupes.",cta:"En savoir plus",page:"formation-presentielle"},
            {ic:"💻",color:"#0277BD",title:"Formation en ligne (LCMS)",desc:"Accédez à notre plateforme e-learning 24h/24 avec des modules vidéo, des QCM et des attestations automatiques. Compatible mobile, PC et tablette.",cta:"Accéder aux formations",page:"catalog"},
            {ic:"🔍",color:"#2E7D32",title:"Conseil & audit",desc:"Diagnostic de vos risques, rédaction du DUERP, accompagnement dans la mise en conformité et conseil en organisation de la prévention.",cta:"Découvrir l'offre",page:"conseil-audit"},
          ].map(m=><div key={m.title} style={{background:"#F8FAFC",borderRadius:10,padding:"1.375rem",border:"1px solid #E2E8F0"}}>
            <div style={{width:40,height:40,borderRadius:10,background:m.color+"18",display:"flex",alignItems:"center",justifyContent:"center",fontSize:18,marginBottom:".875rem"}}>{m.ic}</div>
            <div style={{fontSize:14,fontWeight:700,color:"#0F1923",marginBottom:".5rem"}}>{m.title}</div>
            <p style={{fontSize:12.5,color:"#64748B",lineHeight:1.65,marginBottom:".875rem"}}>{m.desc}</p>
            <button onClick={()=>setPage(m.page)} style={{background:"none",border:`1px solid ${m.color}`,color:m.color,borderRadius:7,padding:"6px 12px",fontSize:12,fontWeight:700,cursor:"pointer"}}>{m.cta} →</button>
          </div>)}
        </div>
      </div>
    </div>
  </>;
}

// ── Page détail par activité ──────────────────────────────────
const ACTIVITE_DATA={
  "activite-sst":{
    ic:"👷",color:"#CC1515",light:"#FFF5F5",
    title:"Santé & sécurité au travail",
    subtitle:"Protégez vos collaborateurs et respectez vos obligations légales",
    article:"L'Art. L4121-1 du Code du travail impose à tout employeur de prendre les mesures nécessaires pour assurer la sécurité et protéger la santé physique et mentale des travailleurs. TutoRisk vous accompagne dans la mise en place d'une politique de prévention efficace et durable.",
    prestations:[
      {title:"Sécurité incendie",items:["Évacuation & rôle des guides-file","Maniement des extincteurs","Agent de première intervention (API)","Sensibilisation des équipes"]},
      {title:"Risques professionnels",items:["Habilitation électrique H0B0","Risque chimique & FDS","Travail en hauteur","Risques routiers professionnels"]},
      {title:"Bien-être au travail",items:["Prévention des risques psychosociaux","Gestes et postures (PRAP)","Harcèlement moral & sexuel","Management bienveillant"]},
      {title:"Obligations réglementaires",items:["Rédaction du DUERP","Formation des membres du CSE","Habilitations obligatoires","Veille réglementaire Code du travail"]},
    ],
    faq:[
      {q:"Qui est concerné par le DUERP ?",r:"Toutes les entreprises, quelle que soit leur taille, ont l'obligation de rédiger et mettre à jour leur Document Unique d'Évaluation des Risques Professionnels (DUERP)."},
      {q:"Les formations sont-elles éligibles au CPF ?",r:"Certaines de nos formations sont éligibles au Compte Personnel de Formation. Contactez-nous pour vérifier l'éligibilité de la formation souhaitée."},
      {q:"Pouvez-vous intervenir dans les DOM-TOM ?",r:"Oui, TutoRisk intervient en métropole et dans les DOM-TOM, avec une expertise particulière sur les risques naturels spécifiques aux territoires ultramarins."},
    ],
  },
  "activite-aleas":{
    ic:"🌊",color:"#1565C0",light:"#EFF8FF",
    title:"Aléas naturels majeurs",
    subtitle:"Anticiper, s'organiser et protéger face aux événements naturels extrêmes",
    article:"La loi de modernisation de la sécurité civile et le Code général des collectivités territoriales imposent des obligations spécifiques aux communes exposées aux risques naturels. Inondations, séismes, submersions, glissements de terrain — chaque territoire doit être préparé.",
    prestations:[
      {title:"Plans de sauvegarde",items:["Plan Communal de Sauvegarde (PCS)","Plan Intercommunal de Sauvegarde (PICS)","Plan Particulier de Mise en Sûreté (PPMS)","Document d'Information Communal (DICRIM)"]},
      {title:"Formation & sensibilisation",items:["Formation des élus et agents","Exercices de simulation de crise","Sensibilisation de la population","Réserve communale de sécurité civile"]},
      {title:"Risques spécifiques",items:["Inondation & submersion marine","Séisme & tsunami","Mouvement de terrain","Éruption volcanique (DOM-TOM)"]},
      {title:"Accompagnement réglementaire",items:["Mise en conformité réglementaire","Relation avec les services préfectoraux","Articulation avec le SDIS","Coordination intercommunale"]},
    ],
    faq:[
      {q:"Quelles communes sont obligées d'avoir un PCS ?",r:"Toute commune couverte par un Plan de Prévention des Risques (PPR) approuvé ou soumise à un Plan Particulier d'Intervention (PPI) doit élaborer un PCS."},
      {q:"Combien de temps prend l'élaboration d'un PCS ?",r:"En moyenne 3 à 6 mois selon la taille de la commune et la complexité des risques. Nous vous accompagnons de bout en bout."},
      {q:"Le PCS doit-il être mis à jour ?",r:"Oui, le PCS doit être révisé à chaque modification des risques sur le territoire ou au minimum tous les 5 ans."},
    ],
  },
  "activite-risques":{
    ic:"🏭",color:"#5E35B1",light:"#F3EFFF",
    title:"Risques technologiques",
    subtitle:"Maîtriser les risques industriels et satisfaire vos obligations réglementaires",
    article:"Les établissements industriels sont soumis à de nombreuses obligations réglementaires en matière de maîtrise des risques technologiques. Classements ICPE, réglementation SEVESO, transport de matières dangereuses — TutoRisk vous aide à structurer votre démarche de prévention.",
    prestations:[
      {title:"Sites industriels",items:["Classement ICPE (déclaration, autorisation)","Sites SEVESO seuil bas et haut","Plan d'Opération Interne (POI)","Plan de Prévention des Risques Technologiques (PPRT)"]},
      {title:"Transport de matières dangereuses",items:["Formation ADR 1.3 (conseillers & conducteurs)","Signalisation & conditionnement","Plans de transport","Déclaration d'accidents TMD"]},
      {title:"Formation opérationnelle",items:["Accès aux établissements classés","Formation des équipes d'intervention","Exercices POI / PPI","Gestion de crise industrielle"]},
      {title:"Accompagnement réglementaire",items:["Audit de conformité ICPE","Relations DREAL & inspection","Mise en place du SMSP","Analyse de risques HAZOP"]},
    ],
    faq:[
      {q:"Qu'est-ce que la réglementation ADR 1.3 ?",r:"L'ADR est l'accord européen relatif au transport de marchandises dangereuses par route. La section 1.3 impose une formation obligatoire à toute personne impliquée dans ce transport."},
      {q:"Mon entreprise est-elle concernée par la réglementation ICPE ?",r:"Si votre activité figure dans la nomenclature ICPE et dépasse les seuils fixés, vous êtes soumis à déclaration ou autorisation préfectorale. Un audit permet de clarifier votre situation."},
      {q:"Quelle est la différence entre POI et PPI ?",r:"Le Plan d'Opération Interne (POI) concerne la gestion interne de l'accident par l'exploitant. Le Plan Particulier d'Intervention (PPI) est déclenché par le préfet lorsque l'accident dépasse les limites du site."},
    ],
  },
  "activite-collectivites":{
    ic:"🏛️",color:"#0D47A1",light:"#E8F0FE",
    title:"Collectivités territoriales",
    subtitle:"Accompagnement sur-mesure des communes et intercommunalités",
    article:"Depuis 2024, TutoRisk développe un pôle spécifiquement dédié aux collectivités territoriales. Notre expertise couvre l'ensemble du cycle de la gestion des risques : diagnostic territorial, élaboration des plans de sauvegarde, formation des équipes et exercices de simulation.",
    prestations:[
      {title:"Plans de sauvegarde",items:["Plan Communal de Sauvegarde (PCS)","Plan Intercommunal de Sauvegarde (PICS)","Articulation PCS / ORSEC","Mise à jour réglementaire"]},
      {title:"Formation des acteurs locaux",items:["Formation des élus","Formation des agents communaux","Formation de la réserve communale","Exercices cadres & exercices terrain"]},
      {title:"Communication & sensibilisation",items:["Document d'information communal (DICRIM)","Campagnes de sensibilisation","Ateliers citoyens","Supports pédagogiques personnalisés"]},
      {title:"Risques spécifiques DOM-TOM",items:["Cyclone & tempête tropicale","Risque volcanique","Séisme & tsunami (Antilles)","Sécheresse & feux de forêt"]},
    ],
    faq:[
      {q:"Votre offre est-elle disponible dans les DOM-TOM ?",r:"Oui. TutoRisk dispose d'une expertise spécifique sur les risques naturels des territoires ultramarins (cyclone, séisme, tsunami, volcanisme) et intervient en Guadeloupe, Martinique, Guyane et à La Réunion."},
      {q:"L'intercommunalité peut-elle mutualiser l'élaboration des PCS ?",r:"Oui, les communes peuvent coordonner leur démarche au niveau intercommunal (PICS) tout en conservant leur propre PCS. Nous accompagnons les deux niveaux simultanément."},
      {q:"Pouvez-vous animer des exercices grandeur nature ?",r:"Tout à fait. Nous concevons et animons des exercices de simulation de crise adaptés à chaque territoire, du bureau de crise à l'exercice terrain avec le SDIS."},
    ],
  },
};

function ActiviteDetailPage({actId,setPage}){
  const d=ACTIVITE_DATA[actId];
  const isMobile=useIsMobile();
  if(!d) return null;
  const section={maxWidth:1100,margin:"0 auto",width:"100%",padding:isMobile?"2rem 1.25rem":"3rem 2rem"};
  return <>
    <PageHero title={d.title} subtitle={d.subtitle} breadcrumb={d.title} bg={d.color} onBack={()=>setPage("nos-activites")}/>
    <div style={section}>
      {/* Article réglementaire */}
      <div style={{background:"#F8FAFC",borderLeft:`4px solid ${d.color}`,borderRadius:"0 10px 10px 0",padding:"1.25rem 1.5rem",marginBottom:"2.5rem"}}>
        <div style={{fontSize:11,color:d.color,fontWeight:700,letterSpacing:1,textTransform:"uppercase",marginBottom:".5rem"}}>Contexte réglementaire</div>
        <p style={{fontSize:14,color:"#374151",lineHeight:1.7,margin:0,fontStyle:"italic"}}>{d.article}</p>
      </div>

      {/* Prestations */}
      <div style={{marginBottom:"2.5rem"}}>
        <h2 style={{fontSize:isMobile?20:26,fontWeight:900,color:"#0F1923",marginBottom:"1.5rem"}}>Nos prestations</h2>
        <div style={{display:"grid",gridTemplateColumns:isMobile?"1fr":"repeat(2,1fr)",gap:"1rem"}}>
          {d.prestations.map(p=><div key={p.title} style={{background:"#fff",border:"1px solid #E8ECF0",borderRadius:10,padding:"1.25rem"}}>
            <div style={{fontSize:14,fontWeight:700,color:"#0F1923",marginBottom:".75rem",display:"flex",alignItems:"center",gap:8}}>
              <div style={{width:8,height:8,borderRadius:"50%",background:d.color,flexShrink:0}}/>{p.title}
            </div>
            {p.items.map(i=><div key={i} style={{fontSize:13,color:"#475569",padding:"4px 0",display:"flex",gap:8,alignItems:"flex-start"}}>
              <span style={{color:d.color,flexShrink:0,marginTop:1}}>✓</span>{i}
            </div>)}
          </div>)}
        </div>
      </div>

      {/* FAQ */}
      <div style={{borderTop:"1px solid #E8ECF0",paddingTop:"2.5rem",marginBottom:"2.5rem"}}>
        <h2 style={{fontSize:isMobile?20:24,fontWeight:900,color:"#0F1923",marginBottom:"1.5rem"}}>Questions fréquentes</h2>
        {d.faq.map((f,i)=><div key={i} style={{background:"#F8FAFC",borderRadius:10,padding:"1.125rem",marginBottom:".75rem",border:"1px solid #E2E8F0"}}>
          <div style={{fontSize:14,fontWeight:700,color:"#0F1923",marginBottom:".5rem"}}>❓ {f.q}</div>
          <p style={{fontSize:13.5,color:"#475569",lineHeight:1.65,margin:0}}>{f.r}</p>
        </div>)}
      </div>

      {/* CTA */}
      <div style={{background:`linear-gradient(135deg,${d.color},${d.color}CC)`,borderRadius:14,padding:"2rem",color:"#fff",display:"flex",justifyContent:"space-between",alignItems:"center",flexWrap:"wrap",gap:"1rem"}}>
        <div>
          <div style={{fontSize:18,fontWeight:800,marginBottom:4}}>Intéressé par cette offre ?</div>
          <div style={{fontSize:14,opacity:.85}}>Contactez-nous pour un devis personnalisé.</div>
        </div>
        <div style={{display:"flex",gap:.875+"rem",flexWrap:"wrap"}}>
          <button onClick={()=>setPage("contact")} style={{background:"#fff",color:d.color,border:"none",borderRadius:8,padding:"10px 20px",fontSize:13,fontWeight:800,cursor:"pointer"}}>Nous contacter</button>
          <button onClick={()=>setPage("catalog")} style={{background:"rgba(255,255,255,.15)",color:"#fff",border:"1.5px solid rgba(255,255,255,.5)",borderRadius:8,padding:"10px 20px",fontSize:13,fontWeight:600,cursor:"pointer"}}>Formations en ligne →</button>
        </div>
      </div>
    </div>
  </>;
}

// ── Formation présentielle ────────────────────────────────────
function FormationPresentielPage({setPage}){
  const isMobile=useIsMobile();
  const section={maxWidth:1100,margin:"0 auto",width:"100%",padding:isMobile?"2rem 1.25rem":"3rem 2rem"};
  return <>
    <PageHero title="Formation présentielle" subtitle="Nos formateurs certifiés interviennent directement dans vos locaux ou dans un centre agréé." breadcrumb="Formation présentielle" onBack={()=>setPage("nos-activites")}/>
    <div style={section}>
      <div style={{display:"grid",gridTemplateColumns:isMobile?"1fr":"1fr 1fr",gap:"3rem",marginBottom:"3rem"}}>
        <div>
          <h2 style={{fontSize:24,fontWeight:900,color:"#0F1923",marginBottom:"1.25rem"}}>Pourquoi choisir la formation présentielle ?</h2>
          {[["🎯","Sur-mesure","Chaque programme est adapté à vos risques spécifiques, votre secteur d'activité et vos effectifs."],["👨‍🏫","Formateurs certifiés","Nos intervenants sont des experts certifiés disposant d'une expérience terrain significative."],["📝","Évaluation intégrée","QCM, mises en situation et exercices pratiques garantissent l'acquisition réelle des compétences."],["📜","Attestations conformes","Les attestations de formation sont valides pour les contrôles CARSAT, DREAL et Inspection du travail."]].map(([ic,t,d])=>
            <div key={t} style={{display:"flex",gap:12,marginBottom:"1.25rem"}}>
              <div style={{width:40,height:40,borderRadius:10,background:"#FFF5F5",display:"flex",alignItems:"center",justifyContent:"center",fontSize:18,flexShrink:0}}>{ic}</div>
              <div><div style={{fontSize:14,fontWeight:700,color:"#0F1923",marginBottom:4}}>{t}</div><p style={{fontSize:13.5,color:"#475569",lineHeight:1.6,margin:0}}>{d}</p></div>
            </div>)}
        </div>
        <div>
          <div style={{background:"#F8FAFC",borderRadius:14,padding:"1.75rem",border:"1px solid #E2E8F0"}}>
            <div style={{fontSize:14,fontWeight:700,color:"#0F1923",marginBottom:"1rem"}}>Comment ça fonctionne ?</div>
            {[["1","Analyse de vos besoins","Audit préalable de vos risques et identification des formations prioritaires."],["2","Conception du programme","Programme personnalisé avec objectifs pédagogiques clairs et évaluables."],["3","Animation de la session","Intervention dans vos locaux ou en salle agréée, en groupe de 6 à 15 participants."],["4","Évaluation & attestations","Évaluation des acquis, remise des attestations de présence et de compétences."]].map(([n,t,d])=>
              <div key={n} style={{display:"flex",gap:12,marginBottom:"1rem",alignItems:"flex-start"}}>
                <div style={{width:26,height:26,borderRadius:"50%",background:"#CC1515",color:"#fff",display:"flex",alignItems:"center",justifyContent:"center",fontSize:12,fontWeight:800,flexShrink:0}}>{n}</div>
                <div><div style={{fontSize:13,fontWeight:700,color:"#0F1923",marginBottom:2}}>{t}</div><p style={{fontSize:12.5,color:"#64748B",lineHeight:1.6,margin:0}}>{d}</p></div>
              </div>)}
          </div>
        </div>
      </div>
      <div style={{borderTop:"1px solid #E8ECF0",paddingTop:"2rem",display:"flex",justifyContent:"center"}}>
        <button onClick={()=>setPage("contact")} style={{background:"#CC1515",color:"#fff",border:"none",borderRadius:10,padding:"13px 32px",fontSize:15,fontWeight:800,cursor:"pointer"}}>Demander un devis →</button>
      </div>
    </div>
  </>;
}

// ── Conseil & Audit ───────────────────────────────────────────
function ConseilAuditPage({setPage}){
  const isMobile=useIsMobile();
  const section={maxWidth:1100,margin:"0 auto",width:"100%",padding:isMobile?"2rem 1.25rem":"3rem 2rem"};
  return <>
    <PageHero title="Conseil & Audit en gestion des risques" subtitle="Un regard externe expert pour identifier, évaluer et réduire vos risques." breadcrumb="Conseil & Audit" onBack={()=>setPage("nos-activites")}/>
    <div style={section}>
      <div style={{display:"grid",gridTemplateColumns:isMobile?"1fr":"repeat(3,1fr)",gap:"1rem",marginBottom:"3rem"}}>
        {[
          {ic:"🔍",title:"Audit des risques",desc:"Diagnostic complet de vos risques professionnels, naturels et technologiques. Identification des points de vulnérabilité et des non-conformités réglementaires.",color:"#CC1515"},
          {ic:"📋",title:"DUERP & documentation",desc:"Rédaction ou mise à jour de votre Document Unique d'Évaluation des Risques Professionnels. Mise en place du registre de sécurité et des procédures obligatoires.",color:"#0277BD"},
          {ic:"🏗️",title:"Accompagnement à la mise en conformité",desc:"Plan d'action priorisé, suivi de la mise en œuvre et accompagnement dans les démarches réglementaires auprès des autorités compétentes.",color:"#2E7D32"},
        ].map(s=><div key={s.title} style={{background:"#fff",border:"1px solid #E8ECF0",borderTop:`3px solid ${s.color}`,borderRadius:12,padding:"1.5rem"}}>
          <div style={{fontSize:24,marginBottom:".875rem"}}>{s.ic}</div>
          <div style={{fontSize:15,fontWeight:800,color:"#0F1923",marginBottom:".75rem"}}>{s.title}</div>
          <p style={{fontSize:13.5,color:"#475569",lineHeight:1.65,margin:0}}>{s.desc}</p>
        </div>)}
      </div>
      <div style={{background:"#0F1923",borderRadius:14,padding:"2rem",textAlign:"center",color:"#fff"}}>
        <div style={{fontSize:20,fontWeight:900,marginBottom:".75rem"}}>Besoin d'un audit ?</div>
        <p style={{fontSize:14,color:"rgba(255,255,255,.75)",marginBottom:"1.5rem"}}>Contactez-nous pour un premier échange sans engagement.</p>
        <button onClick={()=>setPage("contact")} style={{background:"#CC1515",color:"#fff",border:"none",borderRadius:8,padding:"11px 24px",fontSize:14,fontWeight:700,cursor:"pointer"}}>Demander un audit →</button>
      </div>
    </div>
  </>;
}

// ── Contact ───────────────────────────────────────────────────
function ContactPage({api}){
  const isMobile=useIsMobile();
  const [form,setForm]=useState({name:"",email:"",phone:"",subject:"formation-presentielle",message:""});
  const [sending,setSending]=useState(false);
  const [done,setDone]=useState(null);
  const [error,setError]=useState("");

  async function submit(){
    if(!form.name.trim()||!form.email.trim()||!form.message.trim()){ setError("Veuillez remplir les champs obligatoires."); return; }
    setSending(true); setError("");
    try{
      const res=await api.post("/api/contact",form);
      setDone(res.message);
    }catch(err){ setError(err.message||"Erreur lors de l'envoi. Veuillez réessayer."); }
    finally{ setSending(false); }
  }

  const section={maxWidth:900,margin:"0 auto",width:"100%",padding:isMobile?"2rem 1.25rem":"3rem 2rem"};
  return <>
    <PageHero title="Nous contacter" subtitle="Une question, un devis, un projet ? Notre équipe vous répond sous 48 heures ouvrées." breadcrumb="Contact"/>
    <div style={section}>
      <div style={{display:"grid",gridTemplateColumns:isMobile?"1fr":"1fr 2fr",gap:"2.5rem"}}>
        {/* Infos */}
        <div>
          <div style={{fontSize:11,color:"#CC1515",fontWeight:700,letterSpacing:1,textTransform:"uppercase",marginBottom:"1.25rem"}}>Informations</div>
          {[
            {ic:"✉️",label:"Email",val:"contact@tutorisk.com",href:"mailto:contact@tutorisk.com"},
            {ic:"💼",label:"LinkedIn",val:"linkedin.com/company/tutorisk",href:"https://linkedin.com/company/tutorisk"},
            {ic:"⏱",label:"Délai de réponse",val:"Sous 48h ouvrées",href:null},
          ].map(c=><div key={c.label} style={{display:"flex",gap:12,marginBottom:"1.25rem",alignItems:"flex-start"}}>
            <div style={{width:36,height:36,borderRadius:8,background:"#FFF5F5",display:"flex",alignItems:"center",justifyContent:"center",fontSize:16,flexShrink:0}}>{c.ic}</div>
            <div>
              <div style={{fontSize:11,color:"#94A3B8",fontWeight:600,textTransform:"uppercase",letterSpacing:.5}}>{c.label}</div>
              {c.href?<a href={c.href} target={c.href.startsWith("http")?"_blank":"_self"} rel="noreferrer" style={{fontSize:14,color:"#CC1515",fontWeight:600,textDecoration:"none"}}>{c.val}</a>
                :<div style={{fontSize:14,color:"#374151",fontWeight:500}}>{c.val}</div>}
            </div>
          </div>)}
          <div style={{background:"#F8FAFC",borderRadius:10,padding:"1.125rem",border:"1px solid #E2E8F0",marginTop:"1.5rem"}}>
            <div style={{fontSize:13,fontWeight:700,color:"#0F1923",marginBottom:".5rem"}}>Formations en ligne disponibles maintenant</div>
            <p style={{fontSize:12.5,color:"#64748B",lineHeight:1.6,margin:0}}>Accédez immédiatement à notre catalogue de formations e-learning. Pas d'attente, pas de rendez-vous.</p>
          </div>
        </div>

        {/* Formulaire */}
        <div style={{background:"#fff",border:"1px solid #E8ECF0",borderRadius:14,padding:"2rem",boxShadow:"0 4px 20px rgba(0,0,0,.06)"}}>
          {done
            ?<div style={{textAlign:"center",padding:"2rem 0"}}>
              <div style={{fontSize:48,marginBottom:"1rem"}}>✅</div>
              <div style={{fontSize:18,fontWeight:800,color:"#0F1923",marginBottom:".75rem"}}>Message envoyé !</div>
              <p style={{fontSize:14,color:"#475569",lineHeight:1.65}}>{done}</p>
              <button onClick={()=>setDone(null)} style={{marginTop:"1.5rem",background:"none",border:"1px solid #E8ECF0",borderRadius:8,padding:"9px 18px",fontSize:13,cursor:"pointer",color:"#374151"}}>Envoyer un autre message</button>
            </div>
            :<>
              <div style={{display:"grid",gridTemplateColumns:isMobile?"1fr":"1fr 1fr",gap:"1rem",marginBottom:"1rem"}}>
                <div>
                  <label style={{fontSize:12,color:"#374151",fontWeight:600,display:"block",marginBottom:4}}>Nom complet *</label>
                  <input value={form.name} onChange={e=>setForm(s=>({...s,name:e.target.value}))} placeholder="Jérôme Dupont" style={{width:"100%",border:"1.5px solid #D1D5DB",borderRadius:8,padding:"9px 12px",fontSize:13,outline:"none",boxSizing:"border-box"}}/>
                </div>
                <div>
                  <label style={{fontSize:12,color:"#374151",fontWeight:600,display:"block",marginBottom:4}}>Email *</label>
                  <input type="email" value={form.email} onChange={e=>setForm(s=>({...s,email:e.target.value}))} placeholder="jerome@entreprise.com" style={{width:"100%",border:"1.5px solid #D1D5DB",borderRadius:8,padding:"9px 12px",fontSize:13,outline:"none",boxSizing:"border-box"}}/>
                </div>
              </div>
              <div style={{display:"grid",gridTemplateColumns:isMobile?"1fr":"1fr 1fr",gap:"1rem",marginBottom:"1rem"}}>
                <div>
                  <label style={{fontSize:12,color:"#374151",fontWeight:600,display:"block",marginBottom:4}}>Téléphone</label>
                  <input value={form.phone} onChange={e=>setForm(s=>({...s,phone:e.target.value}))} placeholder="+33 6 00 00 00 00" style={{width:"100%",border:"1.5px solid #D1D5DB",borderRadius:8,padding:"9px 12px",fontSize:13,outline:"none",boxSizing:"border-box"}}/>
                </div>
                <div>
                  <label style={{fontSize:12,color:"#374151",fontWeight:600,display:"block",marginBottom:4}}>Sujet</label>
                  <select value={form.subject} onChange={e=>setForm(s=>({...s,subject:e.target.value}))} style={{width:"100%",border:"1.5px solid #D1D5DB",borderRadius:8,padding:"9px 12px",fontSize:13,background:"#fff",outline:"none",boxSizing:"border-box"}}>
                    <option value="formation-presentielle">Formation présentielle</option>
                    <option value="conseil-audit">Conseil & audit</option>
                    <option value="formation-enligne">Formation en ligne</option>
                    <option value="pcs-pics">PCS / PICS collectivités</option>
                    <option value="autre">Autre demande</option>
                  </select>
                </div>
              </div>
              <div style={{marginBottom:"1.25rem"}}>
                <label style={{fontSize:12,color:"#374151",fontWeight:600,display:"block",marginBottom:4}}>Message *</label>
                <textarea value={form.message} onChange={e=>setForm(s=>({...s,message:e.target.value}))} placeholder="Décrivez votre besoin, le nombre de participants, le délai souhaité…" rows={5} style={{width:"100%",border:"1.5px solid #D1D5DB",borderRadius:8,padding:"9px 12px",fontSize:13,resize:"vertical",fontFamily:"inherit",outline:"none",boxSizing:"border-box"}}/>
              </div>
              {error&&<div style={{background:"#FFF5F5",color:"#CC1515",borderRadius:8,padding:"8px 12px",fontSize:13,marginBottom:"1rem",fontWeight:600}}>{error}</div>}
              <button onClick={submit} disabled={sending} style={{width:"100%",background:"#CC1515",color:"#fff",border:"none",borderRadius:9,padding:"12px",fontSize:14,fontWeight:800,cursor:"pointer",opacity:sending?.6:1}}>
                {sending?"Envoi en cours…":"Envoyer le message →"}
              </button>
              <p style={{fontSize:11,color:"#94A3B8",textAlign:"center",marginTop:".75rem"}}>En soumettant ce formulaire, vous acceptez que vos données soient utilisées pour vous recontacter.</p>
            </>}
        </div>
      </div>
    </div>
  </>;
}

// ═══════════════════════════════════════════════════════════
function CatalogPage({onModule,user,api}){
  const [cat,setCat]=useState("Tous");
  const [query,setQuery]=useState("");
  const [tagFilter,setTagFilter]=useState(null);
  const [allTags,setAllTags]=useState([]);
  const [modules,setModules]=useState([]);
  const [loading,setLoading]=useState(true);
  const [error,setError]=useState("");

  useEffect(()=>{
    let active=true;
    setLoading(true);
    Promise.all([
      api.get("/api/modules"),
      api.get("/api/tags"),
      api.get("/api/paths"),
    ]).then(([mData,tData,pData])=>{
      if(active){ setModules(mData.modules); setAllTags(tData.tags.map(t=>t.tag)); setPaths(pData.paths); setError(""); }
    }).catch(err=>{ if(active) setError(err.message||"Impossible de charger le catalogue."); })
    .finally(()=>{ if(active) setLoading(false); });
    return ()=>{ active=false; };
  },[user]);

  const [paths,setPaths]=useState([]);
  const cats=["Tous",...Array.from(new Set(modules.map(m=>m.category)))];
  const q=query.trim().toLowerCase();
  const filtered=modules
    .filter(m=>cat==="Tous"||m.category===cat)
    .filter(m=>!tagFilter||(m.tags||[]).includes(tagFilter))
    .filter(m=>!q||m.title.toLowerCase().includes(q)||(m.description||"").toLowerCase().includes(q));

  return <div style={{maxWidth:1100,margin:"0 auto",width:"100%",padding:"1.75rem 1.25rem"}}>
    <div style={{margin:"-1.75rem -1.25rem 1.25rem"}}><BannerStrip api={api} page="catalog"/></div>
    <div style={{marginBottom:"1.25rem"}}><div style={{fontSize:22,fontWeight:800,color:"#1a1a1a"}}>Catalogue de formations</div><div style={{fontSize:13,color:"#888",marginTop:3}}>{modules.length} modules · Santé & sécurité, aléas naturels, instances représentatives</div></div>
    {error&&<div style={{background:"#FDEAEA",color:"#CC1515",borderRadius:8,padding:"10px 14px",fontSize:13,marginBottom:"1rem",fontWeight:600}}>{error} — vérifiez que le backend tourne sur {API_BASE}.</div>}
    {loading?<div style={{color:"#aaa",fontSize:13,padding:"2rem 0",textAlign:"center"}}>Chargement du catalogue…</div>:<>
    <div style={{position:"relative",marginBottom:".875rem"}}>
      <span style={{position:"absolute",left:13,top:"50%",transform:"translateY(-50%)",fontSize:14,color:"#aaa"}}>🔍</span>
      <input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Rechercher une formation par titre ou mot-clé…"
        style={{width:"100%",border:"1.5px solid #E0E0E0",borderRadius:9,padding:"10px 14px 10px 36px",fontSize:13,background:"#fff",color:"#1a1a1a",outline:"none"}}/>
      {query&&<button onClick={()=>setQuery("")} style={{position:"absolute",right:10,top:"50%",transform:"translateY(-50%)",background:"none",border:"none",color:"#aaa",cursor:"pointer",fontSize:14}}>✕</button>}
    </div>
    <div style={{display:"flex",gap:".375rem",flexWrap:"wrap",marginBottom:"1.25rem"}}>
      {cats.map(c=><button key={c} onClick={()=>setCat(c)} style={{border:`1px solid ${cat===c?"#CC1515":"#E0E0E0"}`,background:cat===c?"#CC1515":"#fff",borderRadius:20,padding:"5px 14px",fontSize:12,cursor:"pointer",color:cat===c?"#fff":"#555",fontWeight:600}}>{c}</button>)}
    </div>
    {allTags.length>0&&<div style={{display:"flex",gap:".375rem",flexWrap:"wrap",marginBottom:"1rem"}}>
      <span style={{fontSize:11,color:"#aaa",alignSelf:"center"}}>🏷️</span>
      {tagFilter&&<button onClick={()=>setTagFilter(null)} style={{border:"1px solid #CC1515",background:"#FDEAEA",borderRadius:20,padding:"3px 10px",fontSize:11,cursor:"pointer",color:"#CC1515",fontWeight:700}}>✕ {tagFilter}</button>}
      {allTags.filter(t=>t!==tagFilter).map(t=><button key={t} onClick={()=>setTagFilter(t)} style={{border:"1px solid #E8E8E8",background:"#F5F5F5",borderRadius:20,padding:"3px 10px",fontSize:11,cursor:"pointer",color:"#555",fontWeight:500}}>{t}</button>)}
    </div>}
    {filtered.length===0&&<div style={{textAlign:"center",color:"#aaa",fontSize:13,padding:"2rem 0"}}>Aucune formation ne correspond à votre recherche.</div>}
    <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(270px,1fr))",gap:"1rem"}}>
      {filtered.map(m=>{
        const [levelBg,levelColor]=LVL[m.level]||["#F5F5F5","#555"];
        const [catColor,catBg]=CAT_COLORS[m.category]||["#555","#F5F5F5"];
        return <div key={m.id} onClick={()=>onModule(m.id)} style={{background:"#fff",border:`1px solid ${m.promotion?"#FFD5D5":"#EBEBEB"}`,borderRadius:10,overflow:"hidden",cursor:"pointer",transition:"transform .15s,box-shadow .15s",position:"relative"}}
          onMouseEnter={e=>{e.currentTarget.style.transform="translateY(-2px)";e.currentTarget.style.boxShadow="0 6px 20px rgba(204,21,21,.12)"}}
          onMouseLeave={e=>{e.currentTarget.style.transform="none";e.currentTarget.style.boxShadow="none"}}>
          <div style={{padding:"1.125rem",borderBottom:"1px solid #EBEBEB"}}>
            <div style={{display:"flex",justifyContent:"space-between",marginBottom:".5rem",gap:6,flexWrap:"wrap"}}>
              <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
                <span style={{fontSize:10,fontWeight:700,padding:"2px 9px",borderRadius:20,background:catBg,color:catColor}}>{m.category}</span>
                {m.promotion&&<span style={{fontSize:10,fontWeight:800,padding:"2px 9px",borderRadius:20,background:"#CC1515",color:"#fff"}}>🏷️ -{m.promotion.discountPercent}%</span>}
                {!m.published&&<span style={{fontSize:10,fontWeight:800,padding:"2px 9px",borderRadius:20,background:"#FFF8E1",color:"#E65100"}}>✏️ Brouillon</span>}
              </div>
              <span style={{fontSize:10,fontWeight:700,padding:"2px 9px",borderRadius:20,background:levelBg,color:levelColor}}>{m.level}</span>
            </div>
            <div style={{fontSize:14,fontWeight:700,lineHeight:1.4,marginBottom:".375rem",color:"#1a1a1a"}}>{m.title}</div>
            {m.tags?.length>0&&<div style={{display:"flex",gap:4,flexWrap:"wrap",marginBottom:".375rem"}}>
              {m.tags.map(t=><span key={t} onClick={e=>{e.stopPropagation();setTagFilter(t);}} style={{fontSize:9,fontWeight:700,padding:"1px 7px",borderRadius:20,background:"#EEF2FF",color:"#3B5BDB",cursor:"pointer",border:"1px solid #C5CFF5"}}>{t}</span>)}
            </div>}
            <div style={{fontSize:12,color:"#666",lineHeight:1.5}}>{m.description}</div>
          </div>
          <div style={{padding:".875rem 1.125rem",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
            <div style={{display:"flex",gap:".75rem"}}><span style={{fontSize:11,color:"#888"}}>⏱ {m.durationMin} min</span><span style={{fontSize:11,color:"#888"}}>📚 {m.chaptersCount} chap.</span></div>
            {m.isEnrolled?<BtnR style={{fontSize:11,padding:"5px 12px"}}>Continuer</BtnR>
              :m.priceCentsHt===0?<span style={{fontSize:14,fontWeight:800,color:"#2E7D32",background:"#E8F5E9",padding:"4px 10px",borderRadius:20}}>Gratuit</span>
              :m.promotion?<div style={{textAlign:"right"}}>
                <div style={{fontSize:11,color:"#aaa",textDecoration:"line-through"}}>{(m.priceCentsTtc/100).toFixed(2)} €</div>
                <div style={{fontSize:17,fontWeight:800,color:"#CC1515"}}>{(m.promotion.priceCentsTtc/100).toFixed(2)} € <span style={{fontSize:10,fontWeight:600,color:"#aaa"}}>TTC</span></div>
              </div>
              :<span style={{fontSize:17,fontWeight:800,color:"#CC1515"}}>{(m.priceCentsTtc/100).toFixed(2)} € <span style={{fontSize:10,fontWeight:600,color:"#aaa"}}>TTC</span></span>}
          </div>
        </div>;
      })}
    </div>

    {paths.filter(p=>p.published).length>0&&<>
      <div style={{marginTop:"2rem",marginBottom:"1rem"}}><div style={{fontSize:18,fontWeight:800,color:"#1a1a1a"}}>🗺️ Parcours de formation</div><div style={{fontSize:13,color:"#888",marginTop:2}}>Des formations groupées, dans le bon ordre</div></div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(280px,1fr))",gap:"1rem"}}>
        {paths.filter(p=>p.published).map(p=><div key={p.id}
          style={{background:"#fff",border:"1.5px solid #EEF2FF",borderRadius:12,overflow:"hidden",cursor:"pointer",transition:"box-shadow .15s"}}
          onClick={()=>alert("Parcours "+p.title+" — intégration page détail à venir")}>
          <div style={{background:"linear-gradient(135deg,#3B5BDB,#5C7CFA)",padding:"1.25rem",color:"#fff"}}>
            <div style={{fontSize:16,fontWeight:800,lineHeight:1.3,marginBottom:4}}>{p.title}</div>
            {p.description&&<div style={{fontSize:12,opacity:.85,lineHeight:1.5}}>{p.description}</div>}
          </div>
          <div style={{padding:".875rem 1.125rem",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
            <div style={{fontSize:11,color:"#888"}}>📚 {p.moduleCount} module{p.moduleCount>1?"s":""}</div>
            <div style={{display:"flex",alignItems:"center",gap:8}}>
              {p.isEnrolled&&<span style={{fontSize:10,fontWeight:700,background:"#E8F5E9",color:"#2E7D32",borderRadius:20,padding:"2px 8px"}}>Inscrit</span>}
              {p.priceCents===0
                ?<span style={{fontSize:13,fontWeight:800,color:"#2E7D32"}}>Gratuit</span>
                :<span style={{fontSize:13,fontWeight:800,color:"#CC1515"}}>{(p.priceCents/100).toFixed(0)} €</span>}
            </div>
          </div>
        </div>)}
      </div>
    </>}
    </>}
  </div>;
}

// Lecteur vidéo protégé par jeton signé (sans DRM) : récupère une URL temporaire
// auprès du backend, désactive le menu contextuel et le téléchargement direct,
// et sauvegarde la progression de visionnage périodiquement.
function ProtectedVideoPlayer({contentId,api,onProgress,initialSeconds}){
  const [url,setUrl]=useState(null);
  const [error,setError]=useState("");
  const [loading,setLoading]=useState(true);
  const lastSavedRef=useRef(0);
  const resumedRef=useRef(false);

  async function loadUrl(){
    setLoading(true); setError("");
    try{
      const data=await api.post(`/api/videos/${contentId}/url`);
      setUrl(`${API_BASE}${data.url}`);
    }catch(err){
      setError(err.message||"Impossible de charger la vidéo.");
    }finally{
      setLoading(false);
    }
  }

  useEffect(()=>{ loadUrl(); },[contentId]); // eslint-disable-line react-hooks/exhaustive-deps

  function handleTimeUpdate(e){
    const t=Math.floor(e.target.currentTime);
    if(t-lastSavedRef.current>=10){
      lastSavedRef.current=t;
      onProgress?.(t,false);
    }
  }

  // Reprend la lecture là où l'apprenant s'était arrêté, une seule fois au
  // chargement des métadonnées (pas à chaque re-render).
  function handleLoadedMetadata(e){
    if(!resumedRef.current && initialSeconds>5){
      e.target.currentTime=initialSeconds;
      resumedRef.current=true;
    }
  }

  return <div style={{background:"#111",borderRadius:10,overflow:"hidden",position:"relative",marginBottom:".75rem"}}>
    <div style={{position:"absolute",top:8,right:8,background:"rgba(0,0,0,.65)",borderRadius:5,padding:"2px 8px",fontSize:10,color:"#fff",zIndex:2}}>🔒 Lecture protégée</div>
    {loading&&<div style={{aspectRatio:"16/9",display:"flex",alignItems:"center",justifyContent:"center",color:"#888",fontSize:13}}>Chargement de la vidéo…</div>}
    {!loading&&error&&<div style={{aspectRatio:"16/9",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",color:"#FFCDD2",fontSize:13,gap:10,padding:"1rem",textAlign:"center"}}>
      {error}
      <BtnG onClick={loadUrl} style={{fontSize:11}}>Réessayer</BtnG>
    </div>}
    {!loading&&!error&&url&&<>
      {initialSeconds>5&&<div style={{background:"#1a1a1a",color:"#FFD5D5",fontSize:11,padding:"6px 10px",textAlign:"center"}}>▶ Reprise à {Math.floor(initialSeconds/60)}:{String(initialSeconds%60).padStart(2,"0")}</div>}
      <video
        key={url}
        src={url}
        controls
        controlsList="nodownload noremoteplayback"
        disablePictureInPicture
        onContextMenu={e=>e.preventDefault()}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onEnded={()=>onProgress?.(null,true)}
        onError={()=>setError("Le lien de lecture a expiré. Cliquez sur réessayer.")}
        style={{width:"100%",aspectRatio:"16/9",display:"block",background:"#000"}}
      />
    </>}
  </div>;
}

function ModuleDetail({moduleId,onBack,user,api}){
  const [openCh,setOpenCh]=useState(null);
  const [data,setData]=useState(null);
  const [loading,setLoading]=useState(true);
  const [error,setError]=useState("");
  // État QCM multi-questions :
  // qcmState[contentId] = {
  //   answers: { [questionId]: selectedOptionId },  ← en cours de remplissage
  //   submitted: bool,                              ← soumis
  //   result: { scorePercent, passed, passScore, results: [{questionId, isCorrect, explanationText, correctOptionIds, selectedOptionId}] }
  // }
  const [qcmState,setQcmState]=useState({});
  const [checkoutLoading,setCheckoutLoading]=useState(false);
  const [showPayMethod,setShowPayMethod]=useState(false);
  const [transferDetails,setTransferDetails]=useState(null);
  const [postalCode,setPostalCode]=useState(user?.postalCode||"");
  const [certLoading,setCertLoading]=useState(false);
  const [enrollFreeLoading,setEnrollFreeLoading]=useState(false);
  const isMobile=useIsMobile();
  const scard={background:"#fff",border:"1px solid #EBEBEB",borderRadius:10,padding:"1.125rem"};
  const vat=useVatRate(api,postalCode,20);

  useEffect(()=>{
    let active=true;
    setLoading(true);
    api.get(`/api/modules/${moduleId}`)
      .then(d=>{ if(active){ setData(d); setError(""); } })
      .catch(err=>{ if(active) setError(err.message||"Impossible de charger ce module."); })
      .finally(()=>{ if(active) setLoading(false); });
    return ()=>{ active=false; };
  },[moduleId]);

  if(loading) return <div style={{padding:"3rem 1rem",textAlign:"center",color:"#aaa",fontSize:13}}>Chargement du module…</div>;
  if(error||!data) return <div style={{padding:"3rem 1rem",textAlign:"center",color:"#CC1515",fontSize:13}}>{error||"Module introuvable."} <div style={{marginTop:10}}><BtnG onClick={onBack}>← Retour au catalogue</BtnG></div></div>;

  const {module:m,chapters}=data;
  const isA=m.isEnrolled;
  const effectiveHt=m.promotion?m.promotion.priceCentsHt:m.priceCentsHt;
  const liveTtc=ttcFromHt(effectiveHt,vat.ratePercent);
  const originalLiveTtc=ttcFromHt(m.priceCentsHt,vat.ratePercent);

  const allContents=chapters.flatMap(ch=>ch.contents);
  const completedCount=allContents.filter(c=>c.completed).length;
  const progressPercent=allContents.length>0?Math.round((completedCount/allContents.length)*100):0;
  const isFullyCompleted=isA&&allContents.length>0&&completedCount===allContents.length;

  // Sélectionner une option (stockage local, pas encore envoyé au serveur)
  function selectAnswer(contentId,questionId,optionId){
    setQcmState(s=>({...s,[contentId]:{
      ...s[contentId],
      answers:{...(s[contentId]?.answers||{}),[questionId]:optionId},
      submitted:false,
      result:null,
    }}));
  }

  // Soumettre toutes les réponses d'un bloc QCM
  async function submitQcm(contentId,questions){
    const st=qcmState[contentId]||{};
    const answers=Object.entries(st.answers||{}).map(([questionId,selectedOptionId])=>({questionId,selectedOptionId}));
    if(answers.length===0) return;
    // Mesurer le temps passé sur ce QCM avant de réinitialiser le timer
    const openedAt=Date.now();
    try{
      const res=await api.post(`/api/modules/qcm/${contentId}/submit`,{answers});
      setQcmState(s=>({...s,[contentId]:{...s[contentId],submitted:true,result:res}}));
      const elapsed=Math.round((Date.now()-openedAt)/1000);
      if(res.passed){
        await saveProgress(contentId,undefined,true,elapsed>0?elapsed:undefined);
      } else {
        // Enregistrer le temps même si échoué (utile pour les analytics)
        await api.post("/api/progress",{contentId,completed:false,timeSpentSeconds:elapsed>0?elapsed:undefined}).catch(()=>{});
      }
    }catch(err){
      setQcmState(s=>({...s,[contentId]:{...s[contentId],error:err.message||"Erreur lors de la soumission."}}));
    }
  }

  async function saveProgress(contentId,watchedSeconds,completed,timeSpentSeconds){
    try{
      await api.post("/api/progress",{
        contentId,
        completed,
        watchedSeconds:watchedSeconds??undefined,
        timeSpentSeconds:timeSpentSeconds??undefined,
      });
      const fresh=await api.get(`/api/modules/${moduleId}`);
      setData(fresh);
    }catch{/* non bloquant */}
  }

  // Crée un hook de suivi du temps : retourne une fonction openTimer()
  // à appeler à l'ouverture d'un contenu, qui retourne une fonction
  // closeTimer(contentId, completed) à appeler à la fermeture.
  function useContentTimer(){
    const openedAt=useRef({});
    function startTimer(contentId){ openedAt.current[contentId]=Date.now(); }
    async function stopTimer(contentId,completed=true){
      const start=openedAt.current[contentId];
      const elapsed=start?Math.round((Date.now()-start)/1000):0;
      delete openedAt.current[contentId];
      await saveProgress(contentId,undefined,completed,elapsed>0?elapsed:undefined);
    }
    return {startTimer,stopTimer};
  }
  const {startTimer,stopTimer}=useContentTimer();

  async function enrollForFree(){
    setEnrollFreeLoading(true);
    try{
      await api.post("/api/enrollments/free",{moduleId:m.id});
      const fresh=await api.get(`/api/modules/${moduleId}`);
      setData(fresh);
    }catch(err){
      alert(err.message||"Impossible de s'inscrire à cette formation.");
    }finally{
      setEnrollFreeLoading(false);
    }
  }

  async function downloadCertificate(){
    setCertLoading(true);
    try{
      const blob=await api.getBlob(`/api/modules/${moduleId}/certificate`);
      const url=window.URL.createObjectURL(blob);
      const a=document.createElement("a");
      a.href=url; a.download=`attestation-${moduleId}.pdf`;
      document.body.appendChild(a); a.click(); a.remove();
      window.URL.revokeObjectURL(url);
    }catch(err){
      alert(err.message||"Impossible de télécharger l'attestation.");
    }finally{
      setCertLoading(false);
    }
  }

  async function buyModule(method){
    setCheckoutLoading(true);
    try{
      const res=await api.post("/api/checkout/create-session",{moduleId:m.id,paymentMethod:method,postalCode:postalCode||undefined});
      if(res.paymentMethod==="card"){
        window.location.href=res.url; // redirection vers la page de paiement Stripe Checkout
      } else {
        setShowPayMethod(false);
        setTransferDetails(res);
      }
    }catch(err){
      alert(err.message||"Impossible de lancer le paiement.");
    }finally{
      setCheckoutLoading(false);
    }
  }

  const allTypes=Array.from(new Set(chapters.flatMap(c=>c.contents.map(x=>x.type))));

  return <div style={{maxWidth:1100,margin:"0 auto",width:"100%",padding:"1.75rem 1.25rem"}}>
    <div style={{fontSize:12,color:"#aaa",marginBottom:".875rem",display:"flex",gap:5,alignItems:"center"}}>
      <span onClick={onBack} style={{cursor:"pointer",color:"#CC1515",fontWeight:600}}>Catalogue</span><span>›</span><span>{m.title}</span>
    </div>
    <div style={{background:"#CC1515",color:"#fff",padding:"2rem",borderRadius:14,marginBottom:"1.25rem"}}>
      <span style={{background:"rgba(255,255,255,.2)",color:"#fff",fontSize:11,padding:"2px 10px",borderRadius:20,fontWeight:700}}>{m.category}</span>
      <h1 style={{fontSize:24,fontWeight:800,margin:".625rem 0 .375rem",lineHeight:1.3,color:"#fff"}}>{m.title}</h1>
      <p style={{color:"rgba(255,255,255,.85)",fontSize:14,lineHeight:1.6,maxWidth:580}}>{m.description}</p>
      <div style={{display:"flex",gap:"1.25rem",marginTop:"1rem"}}>
        {[["⏱",`${m.durationMin} min`],["📚",`${chapters.length} chapitres`],["🏅",m.level]].map(([ic,l])=><span key={l} style={{fontSize:12,color:"rgba(255,255,255,.8)",display:"flex",gap:5,alignItems:"center"}}>{ic} {l}</span>)}
      </div>
    </div>
    {m.isEnrolled&&m.isExpired&&<div style={{background:"#FDEAEA",border:"1px solid #F5C6C6",borderRadius:10,padding:"1.125rem",marginBottom:"1.25rem",display:"flex",alignItems:"flex-start",gap:12}}>
      <span style={{fontSize:22}}>⏳</span>
      <div>
        <div style={{fontWeight:800,color:"#CC1515",fontSize:14,marginBottom:4}}>Cette formation est périmée</div>
        <div style={{fontSize:13,color:"#7A0A0A",lineHeight:1.6}}>Votre accès à cette formation a expiré le {new Date(m.expiresAt).toLocaleDateString("fr-FR")} (l'accès est limité à 3 mois après l'achat). Le contenu n'est plus consultable. Contactez votre administrateur ou votre chargé de formation si vous souhaitez qu'il prolonge votre accès.</div>
      </div>
    </div>}
    {m.isEnrolled&&!m.isExpired&&m.expiresAt&&<div style={{fontSize:11,color:"#999",marginBottom:"1.25rem",marginTop:-12}}>Accès valable jusqu'au {new Date(m.expiresAt).toLocaleDateString("fr-FR")}</div>}
    <div style={{display:"grid",gridTemplateColumns:isMobile?"1fr":"1fr 295px",gap:"1.25rem"}}>
      <div>
        <div style={{fontSize:17,fontWeight:800,marginBottom:".875rem",color:"#1a1a1a"}}>Contenu de la formation</div>
        {chapters.map((ch,chIdx)=>{
          // Progression par chapitre : bloquer si le précédent n'est pas terminé à 100%
          const prevDone=chIdx===0||chapters[chIdx-1].completionPercent===100;
          const chapterLocked=m.chapterOrderEnforced&&!prevDone;
          return <div key={ch.id} style={{marginBottom:".375rem"}}>
          <div onClick={()=>!chapterLocked&&setOpenCh(openCh===chIdx?null:chIdx)}
            style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"10px 14px",background:chapterLocked?"#F5F5F5":"#fff",border:`1px solid ${chapterLocked?"#DDD":"#EBEBEB"}`,borderRadius:openCh===chIdx?"8px 8px 0 0":8,cursor:chapterLocked?"not-allowed":"pointer"}}>
            <div style={{display:"flex",alignItems:"center",gap:8}}>
              <span style={{width:24,height:24,borderRadius:5,background:chapterLocked?"#E0E0E0":openCh===chIdx?"#CC1515":"#F0F0F0",color:chapterLocked?"#aaa":openCh===chIdx?"#fff":"#555",display:"flex",alignItems:"center",justifyContent:"center",fontSize:12,fontWeight:800,flexShrink:0}}>
                {chapterLocked?"🔒":chIdx+1}
              </span>
              <div>
                <div style={{fontSize:13,fontWeight:700,color:chapterLocked?"#aaa":"#1a1a1a"}}>{ch.title}</div>
                <div style={{display:"flex",gap:8,alignItems:"center",marginTop:2}}>
                  <div style={{fontSize:11,color:"#aaa"}}>{ch.contents.map(c=>CT[c.type]?.label||c.type).join(" · ")}</div>
                  {ch.completionPercent>0&&<div style={{fontSize:10,fontWeight:700,color:ch.completionPercent===100?"#2E7D32":"#CC1515"}}>{ch.completionPercent}%</div>}
                  {chapterLocked&&<div style={{fontSize:10,color:"#aaa",fontStyle:"italic"}}>Terminez le chapitre précédent d'abord</div>}
                </div>
              </div>
            </div>
            {!chapterLocked&&<span style={{color:"#bbb"}}>{openCh===chIdx?"▲":"▼"}</span>}
          </div>
          {openCh===chIdx&&!chapterLocked&&<div style={{background:"#fff",border:"1px solid #EBEBEB",borderTop:"none",borderRadius:"0 0 8px 8px",padding:"1rem"}}>
            {ch.contents.map(content=>{
              const ci=CT[content.type]||{icon:"📄",label:content.type,bg:"#F5F5F5"};

              if(content.locked) return <div key={content.id} style={{display:"flex",alignItems:"center",gap:8,padding:"10px 0",borderBottom:"1px solid #F0F0F0",fontSize:13,color:"#999"}}>
                <div style={{width:28,height:28,borderRadius:6,background:"#F5F5F5",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>🔒</div>
                <span>{ci.label} — {m.isExpired?"formation périmée":"accès réservé aux inscrits"}</span>
              </div>;

              if(content.type==="video") return <div key={content.id}>
                <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:".625rem"}}><div style={{width:28,height:28,borderRadius:6,background:ci.bg,display:"flex",alignItems:"center",justifyContent:"center"}}>{ci.icon}</div><span style={{fontSize:13,fontWeight:700,color:"#1a1a1a"}}>{content.title||"Vidéo"}</span></div>
                <ProtectedVideoPlayer contentId={content.id} api={api} initialSeconds={content.watchedSeconds||0} onProgress={(t,done)=>saveProgress(content.id,t,done)}/>
              </div>;

              if(content.type==="qcm"){
                const questions=Array.isArray(content.question)?content.question:content.question?[content.question]:[];
                if(questions.length===0) return null;
                const st=qcmState[content.id]||{};
                const allAnswered=questions.every(q=>st.answers?.[q.id]);
                const passScore=content.passScorePercent||0;

                return <div key={content.id} style={{marginBottom:".875rem",border:"1px solid #EBEBEB",borderRadius:10,overflow:"hidden"}}
                  onMouseEnter={()=>!st.submitted&&startTimer(content.id)}>
                  {/* En-tête du bloc QCM */}
                  <div style={{background:"#FFF8E1",padding:".75rem 1rem",borderBottom:"1px solid #FFE082",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                    <div>
                      <span style={{fontWeight:700,fontSize:13,color:"#1a1a1a"}}>✅ {content.title||"QCM"}</span>
                      <span style={{fontSize:11,color:"#888",marginLeft:8}}>{questions.length} question{questions.length>1?"s":""}</span>
                    </div>
                    {passScore>0&&<span style={{fontSize:11,color:"#E65100",fontWeight:700}}>Seuil : {passScore}%</span>}
                  </div>

                  <div style={{padding:"1rem"}}>
                    {/* Questions */}
                    {questions.map((q,qi)=>{
                      const selected=st.answers?.[q.id];
                      const qResult=st.result?.results?.find(r=>r.questionId===q.id);
                      const isSubmitted=st.submitted;

                      return <div key={q.id} style={{marginBottom:qi<questions.length-1?"1.25rem":0}}>
                        <div style={{fontSize:13,fontWeight:700,color:"#1a1a1a",marginBottom:".625rem"}}>
                          {questions.length>1&&<span style={{background:"#F0F0F0",borderRadius:5,padding:"1px 7px",fontSize:11,marginRight:8}}>{qi+1}/{questions.length}</span>}
                          {q.text}
                        </div>
                        {q.options.map(o=>{
                          const isSelected=selected===o.id;
                          let bg="#fff",border="#E8E8E8",color="#1a1a1a";
                          if(isSubmitted&&qResult){
                            const isCorrectOpt=qResult.correctOptionIds?.includes(o.id);
                            const isWrong=isSelected&&!qResult.isCorrect;
                            if(isCorrectOpt){ bg="#E8F5E9"; border="#2E7D32"; }
                            else if(isWrong){ bg="#FDEAEA"; border="#CC1515"; }
                          } else if(isSelected){ bg="#FFF8E1"; border="#CC1515"; }

                          return <div key={o.id}
                            onClick={()=>!isSubmitted&&selectAnswer(content.id,q.id,o.id)}
                            style={{border:`1.5px solid ${border}`,borderRadius:8,padding:"10px 14px",marginBottom:".375rem",cursor:isSubmitted?"default":"pointer",fontSize:13,display:"flex",alignItems:"center",gap:10,color,background:bg,transition:"all .1s"}}>
                            <span style={{width:20,height:20,borderRadius:"50%",border:`2px solid ${isSelected?"#CC1515":"#ccc"}`,background:isSelected?"#CC1515":"transparent",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
                              {isSelected&&<span style={{width:8,height:8,borderRadius:"50%",background:"#fff",display:"block"}}/>}
                            </span>
                            {o.text}
                          </div>;
                        })}

                        {/* Explication après soumission */}
                        {isSubmitted&&qResult?.explanationText&&<div style={{marginTop:".625rem",padding:".75rem",borderRadius:8,fontSize:13,lineHeight:1.6,background:qResult.isCorrect?"#E8F5E9":"#FFF8E1",color:qResult.isCorrect?"#2E7D32":"#E65100",border:`1px solid ${qResult.isCorrect?"#A5D6A7":"#FFE082"}`}}>
                          <div style={{fontWeight:700,marginBottom:4}}>{qResult.isCorrect?"✅ Bonne réponse":"❌ Réponse incorrecte"}</div>
                          {qResult.explanationText}
                        </div>}
                      </div>;
                    })}

                    {/* Résultat global + bouton soumettre */}
                    {st.error&&<div style={{marginTop:8,fontSize:12,color:"#CC1515",fontWeight:600}}>{st.error}</div>}
                    {!st.submitted&&<div style={{marginTop:"1rem",borderTop:"1px solid #F0F0F0",paddingTop:".875rem",display:"flex",alignItems:"center",justifyContent:"space-between",flexWrap:"wrap",gap:8}}>
                      <span style={{fontSize:12,color:"#888"}}>{Object.keys(st.answers||{}).length}/{questions.length} réponse{questions.length>1?"s":""} saisie{questions.length>1?"s":""}</span>
                      <BtnR onClick={()=>submitQcm(content.id,questions)} style={{fontSize:12,padding:"8px 18px",opacity:allAnswered?1:.45}} disabled={!allAnswered}>
                        Valider le QCM →
                      </BtnR>
                    </div>}
                    {st.submitted&&st.result&&<div style={{marginTop:"1rem",padding:"1rem",borderRadius:8,background:st.result.passed?"#E8F5E9":"#FDEAEA",border:`1px solid ${st.result.passed?"#A5D6A7":"#F5C6C6"}`}}>
                      <div style={{fontWeight:800,fontSize:15,color:st.result.passed?"#2E7D32":"#CC1515",marginBottom:4}}>
                        {st.result.passed?"🏆 QCM réussi !":"😔 QCM non validé"}
                      </div>
                      <div style={{fontSize:13,color:st.result.passed?"#2E7D32":"#CC1515"}}>
                        Score : {st.result.scorePercent}% ({st.result.correctCount}/{st.result.totalCount} bonne{st.result.totalCount>1?"s":""})
                        {passScore>0&&` — seuil requis : ${passScore}%`}
                      </div>
                      {!st.result.passed&&<BtnG onClick={()=>setQcmState(s=>({...s,[content.id]:{answers:{},submitted:false,result:null}}))} style={{marginTop:".625rem",fontSize:12}}>↺ Recommencer</BtnG>}
                    </div>}
                  </div>
                </div>;
              }

              if(content.type==="video_ext"){
                const embed=content.embed;
                if(!embed) return <div key={content.id} style={{fontSize:13,color:"#CC1515",marginBottom:8}}>⚠️ URL vidéo externe invalide.</div>;
                const platformLabel={youtube:"YouTube",vimeo:"Vimeo",dailymotion:"Dailymotion",direct:"Vidéo directe"}[embed.platform]||embed.platform;
                return <div key={content.id} style={{marginBottom:".875rem"}}>
                  <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:".625rem"}}>
                    <div style={{width:28,height:28,borderRadius:6,background:"#FCE4EC",display:"flex",alignItems:"center",justifyContent:"center"}}>📺</div>
                    <span style={{fontSize:13,fontWeight:700,color:"#1a1a1a"}}>{content.title||"Vidéo externe"}</span>
                    <span style={{fontSize:10,fontWeight:700,background:"#FCE4EC",color:"#C2185B",borderRadius:20,padding:"2px 8px"}}>{platformLabel}</span>
                  </div>
                  {embed.platform==="direct"
                    ?<video src={embed.embedUrl} controls style={{width:"100%",borderRadius:10,aspectRatio:"16/9",background:"#000",display:"block"}}
                        onEnded={()=>saveProgress(content.id,undefined,true)}/>
                    :<div style={{position:"relative",paddingBottom:"56.25%",height:0,borderRadius:10,overflow:"hidden",background:"#000"}}>
                      <iframe src={embed.embedUrl} title={content.title||"Vidéo externe"} allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen
                        onLoad={()=>saveProgress(content.id,undefined,true)}
                        style={{position:"absolute",top:0,left:0,width:"100%",height:"100%",border:0}}/>
                    </div>}
                </div>;
              }

              if(content.type==="text"){
                return <div key={content.id} style={{marginBottom:"1rem",padding:"1rem",background:"#FAFAFA",borderRadius:8,border:"1px solid #EBEBEB"}}
                  onMouseEnter={()=>startTimer(content.id)}
                  onMouseLeave={()=>stopTimer(content.id,true)}>
                  {content.title&&<div style={{fontWeight:700,fontSize:13,color:"#1a1a1a",marginBottom:8,display:"flex",gap:7,alignItems:"center"}}><span>📝</span>{content.title}</div>}
                  {content.contentText
                    ?<div className="tr-text" style={{fontSize:14,lineHeight:1.75,color:"#333"}}
                        dangerouslySetInnerHTML={{__html:content.contentText}}/>
                    :<div style={{fontSize:13,color:"#aaa",fontStyle:"italic"}}>Contenu texte non disponible.</div>}
                </div>;
              }

              return <div key={content.id} style={{display:"flex",alignItems:"center",gap:8,padding:"8px 0",borderBottom:"1px solid #F0F0F0",fontSize:13,color:"#1a1a1a"}}>
                <div style={{width:28,height:28,borderRadius:6,background:ci.bg,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>{ci.icon}</div>
                <span>{content.title||ci.label}</span>
                {content.type==="doc"&&<BtnG onClick={()=>{startTimer(content.id);setTimeout(()=>stopTimer(content.id,true),500);}} style={{marginLeft:"auto",fontSize:11}}>⬇ Télécharger</BtnG>}
                {content.type==="link"&&<a href={content.externalUrl||"https://www.tutorisk.com"} target="_blank" rel="noreferrer" onClick={()=>{startTimer(content.id);setTimeout(()=>stopTimer(content.id,true),500);}} style={{marginLeft:"auto",color:"#CC1515",fontSize:12,fontWeight:700}}>Ouvrir ↗</a>}
              </div>;
            })}
          </div>}
        </div>;
        })}
      </div>
      <div>
        <div style={{...scard,marginBottom:".875rem"}}>
          {!isA&&m.priceCentsHt===0?<>
            <div style={{fontSize:24,fontWeight:800,color:"#2E7D32",marginBottom:8}}>Gratuit</div>
            {user
              ?<BtnR onClick={enrollForFree} style={{width:"100%",padding:10,fontSize:13,borderRadius:8,marginBottom:10,background:"#2E7D32",opacity:enrollFreeLoading?.6:1}}>{enrollFreeLoading?"Inscription…":"🎓 S'inscrire gratuitement"}</BtnR>
              :<div style={{background:"#FFF8E1",color:"#E65100",border:"1px solid #FFE082",borderRadius:7,padding:".75rem",fontSize:12,marginBottom:10}}>Connectez-vous pour accéder à cette formation gratuite.</div>}
          </>:<>
          {!isA&&m.promotion&&<div style={{display:"inline-block",background:"#CC1515",color:"#fff",fontSize:11,fontWeight:800,padding:"3px 10px",borderRadius:20,marginBottom:8}}>🏷️ Promotion -{m.promotion.discountPercent}%</div>}
          {!isA&&m.promotion&&<div style={{fontSize:14,color:"#aaa",textDecoration:"line-through"}}>{(originalLiveTtc/100).toFixed(2)} €</div>}
          <div style={{fontSize:28,fontWeight:800,color:"#CC1515",marginBottom:2}}>{isA?"Inclus":`${(liveTtc/100).toFixed(2)} €`}{!isA&&<span style={{fontSize:14,fontWeight:400,color:"#aaa",marginLeft:4}}>TTC</span>}</div>
          {!isA&&<div style={{fontSize:11,color:"#999",marginBottom:8}}>{(effectiveHt/100).toFixed(2)} € HT · TVA {vat.loading?"…":`${vat.ratePercent}%`}{vat.label?` (${vat.label})`:""}</div>}
          {isA?<>
            {m.isExpired
              ?<div style={{background:"#FDEAEA",color:"#CC1515",border:"1px solid #F5C6C6",borderRadius:7,padding:".75rem",fontSize:13,marginBottom:".75rem",marginTop:8,fontWeight:600}}>⏳ Accès expiré le {new Date(m.expiresAt).toLocaleDateString("fr-FR")}</div>
              :<div style={{background:"#E8F5E9",color:"#2E7D32",border:"1px solid #A5D6A7",borderRadius:7,padding:".75rem",fontSize:13,marginBottom:".75rem",marginTop:8}}>✅ Formation incluse dans votre parcours</div>}
            <div style={{marginBottom:".875rem"}}>
              <div style={{display:"flex",justifyContent:"space-between",fontSize:11,color:"#888",marginBottom:4}}><span>Progression</span><span style={{fontWeight:700,color:isFullyCompleted?"#2E7D32":"#CC1515"}}>{progressPercent}%</span></div>
              <PB value={progressPercent} color={isFullyCompleted?"#2E7D32":"#CC1515"}/>
            </div>
            {isFullyCompleted&&<BtnR onClick={downloadCertificate} style={{width:"100%",padding:10,fontSize:13,borderRadius:8,marginBottom:10,background:"#2E7D32",opacity:certLoading?.6:1}}>{certLoading?"Génération…":"🏆 Télécharger mon attestation"}</BtnR>}
          </>
            :user?<BtnR onClick={()=>setShowPayMethod(true)} style={{width:"100%",padding:10,fontSize:13,borderRadius:8,marginBottom:10,opacity:checkoutLoading?.6:1}}>{checkoutLoading?"Veuillez patienter…":"Acheter ce module →"}</BtnR>
            :<div style={{background:"#FFF8E1",color:"#E65100",border:"1px solid #FFE082",borderRadius:7,padding:".75rem",fontSize:12,marginBottom:10}}>Connectez-vous pour acheter ce module.</div>}
          </>}
          <div style={{borderTop:"1px solid #F0F0F0",paddingTop:".75rem"}}>
            {[["⏱",`Durée : ${m.durationMin} min`],["📚",`${chapters.length} chapitres`],["💻","Accès illimité"],["🏆",isFullyCompleted?"Attestation disponible":"Attestation à la fin du module"],["🔒","Lecture vidéo protégée par jeton signé"]].map(([ic,l])=><div key={l} style={{display:"flex",gap:8,alignItems:"center",fontSize:12,marginBottom:8,color:"#444"}}>{ic} {l}</div>)}
          </div>
        </div>
        <div style={scard}>
          <div style={{fontWeight:700,fontSize:13,marginBottom:".625rem",color:"#1a1a1a"}}>Ce module contient</div>
          {allTypes.map(t=>{const ci=CT[t];return <div key={t} style={{display:"flex",gap:8,alignItems:"center",fontSize:13,marginBottom:8,color:"#444"}}>{ci.icon} {ci.label}</div>;})}
        </div>
      </div>
    </div>
    {showPayMethod&&<div style={{position:"fixed",inset:0,background:"rgba(0,0,0,.55)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:9999}} onClick={()=>setShowPayMethod(false)}>
      <div style={{background:"#fff",borderRadius:14,padding:"1.75rem",width:400,maxWidth:"94vw",boxShadow:"0 8px 40px rgba(0,0,0,.2)",color:"#1a1a1a"}} onClick={e=>e.stopPropagation()}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:"1rem"}}>
          <div style={{fontSize:18,fontWeight:800}}>Choisir un mode de paiement</div>
          <button onClick={()=>setShowPayMethod(false)} style={{background:"none",border:"none",cursor:"pointer",fontSize:20,color:"#999",padding:0}}>✕</button>
        </div>
        <div style={{fontSize:13,color:"#666",marginBottom:"1rem"}}>{m.title}</div>
        <div style={{marginBottom:14}}>
          <label style={{fontSize:12,color:"#444",fontWeight:700,display:"block",marginBottom:4}}>Code postal (pour calculer la TVA applicable)</label>
          <input value={postalCode} onChange={e=>setPostalCode(e.target.value)} placeholder="ex : 75001, 97100, 97133…" style={{width:"100%",border:"1.5px solid #D0D0D0",borderRadius:8,padding:"8px 10px",fontSize:13,background:"#fff",color:"#1a1a1a",outline:"none"}}/>
        </div>
        <div style={{background:"#F9F9F9",borderRadius:8,padding:".75rem",marginBottom:"1rem"}}>
          <div style={{display:"flex",justifyContent:"space-between",fontSize:12,color:"#666",marginBottom:4}}><span>Prix HT</span><span>{(m.priceCentsHt/100).toFixed(2)} €</span></div>
          {m.promotion&&<div style={{display:"flex",justifyContent:"space-between",fontSize:12,color:"#CC1515",marginBottom:4}}><span>Promotion -{m.promotion.discountPercent}%</span><span>-{((m.priceCentsHt-effectiveHt)/100).toFixed(2)} €</span></div>}
          <div style={{display:"flex",justifyContent:"space-between",fontSize:12,color:"#666",marginBottom:4}}><span>TVA {vat.loading?"…":`${vat.ratePercent}%`}{vat.label?` (${vat.label})`:""}</span><span>{((liveTtc-effectiveHt)/100).toFixed(2)} €</span></div>
          <div style={{display:"flex",justifyContent:"space-between",fontSize:16,fontWeight:800,color:"#CC1515",marginTop:6,paddingTop:6,borderTop:"1px solid #EBEBEB"}}><span>Total TTC</span><span>{(liveTtc/100).toFixed(2)} €</span></div>
        </div>
        <div style={{display:"flex",flexDirection:"column",gap:8}}>
          <button onClick={()=>buyModule("card")} disabled={checkoutLoading} style={{display:"flex",alignItems:"center",gap:10,border:"1.5px solid #E0E0E0",borderRadius:8,padding:"12px 14px",cursor:"pointer",background:"#FAFAFA",textAlign:"left"}}>
            <span style={{fontSize:20}}>💳</span>
            <span><div style={{fontSize:13,fontWeight:700,color:"#1a1a1a"}}>Carte bancaire</div><div style={{fontSize:11,color:"#888"}}>Paiement immédiat et sécurisé via Stripe</div></span>
          </button>
          <button onClick={()=>buyModule("transfer")} disabled={checkoutLoading} style={{display:"flex",alignItems:"center",gap:10,border:"1.5px solid #E0E0E0",borderRadius:8,padding:"12px 14px",cursor:"pointer",background:"#FAFAFA",textAlign:"left"}}>
            <span style={{fontSize:20}}>🏦</span>
            <span><div style={{fontSize:13,fontWeight:700,color:"#1a1a1a"}}>Virement bancaire</div><div style={{fontSize:11,color:"#888"}}>Accès activé sous 2-3 jours ouvrés après validation</div></span>
          </button>
        </div>

      </div>
    </div>}
    {transferDetails&&<BankTransferInstructions details={transferDetails} onClose={()=>setTransferDetails(null)}/>}
  </div>;
}

function Metric({label,value,sub,icon}){
  return <div style={{background:"#F7F7F7",borderRadius:8,padding:".875rem"}}>
    <div style={{display:"flex",justifyContent:"space-between"}}><div style={{fontSize:11,color:"#888",fontWeight:600,marginBottom:".375rem"}}>{label}</div><span style={{fontSize:17}}>{icon}</span></div>
    <div style={{fontSize:24,fontWeight:800,color:"#1a1a1a"}}>{value}</div>
    {sub&&<div style={{fontSize:11,color:"#aaa",marginTop:2}}>{sub}</div>}
  </div>;
}

function Sidebar({items,active,setActive}){
  const isMobile=useIsMobile();
  if(isMobile) return <div style={{display:"flex",gap:6,overflowX:"auto",paddingBottom:6,marginBottom:".5rem",WebkitOverflowScrolling:"touch"}}>
    {items.map(t=><div key={t.k} onClick={()=>setActive(t.k)} style={{flexShrink:0,display:"flex",alignItems:"center",gap:6,padding:"7px 12px",borderRadius:20,fontSize:12,cursor:"pointer",color:active===t.k?"#fff":"#555",background:active===t.k?"#CC1515":"#fff",border:`1px solid ${active===t.k?"#CC1515":"#E0E0E0"}`,fontWeight:active===t.k?700:500,whiteSpace:"nowrap"}}><span>{t.ic}</span>{t.l}</div>)}
  </div>;
  return <div style={{background:"#fff",border:"1px solid #EBEBEB",borderRadius:10,padding:".875rem",height:"fit-content",position:"sticky",top:66}}>
    <div style={{fontSize:10,color:"#aaa",textTransform:"uppercase",letterSpacing:".5px",padding:".375rem .625rem",fontWeight:700}}>Navigation</div>
    {items.map(t=><div key={t.k} onClick={()=>setActive(t.k)} style={{display:"flex",alignItems:"center",gap:8,padding:"8px 10px",borderRadius:7,fontSize:13,cursor:"pointer",color:active===t.k?"#CC1515":"#555",background:active===t.k?"#FDEAEA":"transparent",fontWeight:active===t.k?700:500,marginBottom:2}}><span>{t.ic}</span>{t.l}</div>)}
  </div>;
}

function CreditPackAdmin({api}){
  const [packs,setPacks]=useState([]);
  const [loading,setLoading]=useState(true);
  const [editing,setEditing]=useState(null); // pack en cours d'édition ou {} pour création

  function load(){
    setLoading(true);
    api.get("/api/credit-packs?all=true").then(d=>setPacks(d.packs)).finally(()=>setLoading(false));
  }
  useEffect(()=>{ load(); },[]);

  async function save(form){
    try{
      if(form.id) await api.put(`/api/credit-packs/${form.id}`,form);
      else await api.post("/api/credit-packs",form);
      setEditing(null);
      load();
    }catch(err){ alert(err.message||"Erreur lors de l'enregistrement."); }
  }
  async function remove(id){
    if(!confirm("Supprimer ce lot de crédits ?")) return;
    try{ await api.del(`/api/credit-packs/${id}`); load(); }
    catch(err){ alert(err.message||"Erreur lors de la suppression."); }
  }

  return <div style={{background:"#fff",border:"1px solid #EBEBEB",borderRadius:10,padding:"1.125rem"}}>
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:".875rem"}}>
      <div style={{fontWeight:700,color:"#1a1a1a"}}>Lots de crédits</div>
      <BtnR onClick={()=>setEditing({name:"",credits:100,priceCents:9500,discountPercent:5,active:true,position:packs.length})} style={{fontSize:11,padding:"5px 12px"}}>+ Nouveau lot</BtnR>
    </div>
    {loading?<div style={{color:"#aaa",fontSize:13}}>Chargement…</div>:
    <table style={{width:"100%",borderCollapse:"collapse",fontSize:13}}>
      <thead><tr>{["Nom","Crédits","Prix HT","Remise","Actif","Actions"].map(h=><th key={h} style={{textAlign:"left",fontSize:11,color:"#aaa",fontWeight:700,padding:"7px 10px",borderBottom:"1px solid #EBEBEB"}}>{h}</th>)}</tr></thead>
      <tbody>{packs.map(p=><tr key={p.id}>
        <td style={{padding:"9px 10px",borderBottom:"1px solid #EBEBEB",fontWeight:600}}>{p.name}</td>
        <td style={{padding:"9px 10px",borderBottom:"1px solid #EBEBEB"}}>{p.credits.toLocaleString("fr-FR")}</td>
        <td style={{padding:"9px 10px",borderBottom:"1px solid #EBEBEB",fontWeight:800,color:"#CC1515"}}>{(p.priceCents/100).toFixed(0)} €</td>
        <td style={{padding:"9px 10px",borderBottom:"1px solid #EBEBEB"}}>{p.discountPercent}%</td>
        <td style={{padding:"9px 10px",borderBottom:"1px solid #EBEBEB"}}>{p.active?"✅":"—"}</td>
        <td style={{padding:"9px 10px",borderBottom:"1px solid #EBEBEB"}}><div style={{display:"flex",gap:4}}><BtnG onClick={()=>setEditing(p)} style={{fontSize:11}}>✏️</BtnG><BtnG onClick={()=>remove(p.id)} style={{fontSize:11,color:"#CC1515",borderColor:"#FDEAEA"}}>🗑</BtnG></div></td>
      </tr>)}</tbody>
    </table>}
    {editing&&<div style={{position:"fixed",inset:0,background:"rgba(0,0,0,.55)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:9999}} onClick={()=>setEditing(null)}>
      <div style={{background:"#fff",borderRadius:14,padding:"1.75rem",width:380,maxWidth:"94vw",color:"#1a1a1a"}} onClick={e=>e.stopPropagation()}>
        <div style={{fontSize:17,fontWeight:800,marginBottom:"1rem"}}>{editing.id?"Modifier le lot":"Nouveau lot de crédits"}</div>
        <Input label="Nom" defaultValue={editing.name} onChange={e=>editing.name=e.target.value}/>
        <Input label="Nombre de crédits" type="number" defaultValue={editing.credits} onChange={e=>editing.credits=Number(e.target.value)}/>
        <Input label="Prix HT (en euros)" type="number" step="0.01" defaultValue={(editing.priceCents/100)} onChange={e=>editing.priceCents=Math.round(Number(e.target.value)*100)}/>
        <Input label="Remise (%)" type="number" defaultValue={editing.discountPercent} onChange={e=>editing.discountPercent=Number(e.target.value)}/>
        <label style={{display:"flex",alignItems:"center",gap:8,fontSize:13,marginBottom:14,cursor:"pointer"}}>
          <input type="checkbox" defaultChecked={editing.active!==false} onChange={e=>editing.active=e.target.checked}/> Lot actif (visible à l'achat)
        </label>
        <div style={{display:"flex",gap:8}}>
          <BtnG onClick={()=>setEditing(null)} style={{flex:1}}>Annuler</BtnG>
          <BtnR onClick={()=>save(editing)} style={{flex:1}}>Enregistrer</BtnR>
        </div>
      </div>
    </div>}
  </div>;
}

function PendingTransfersAdmin({api}){
  const [data,setData]=useState({modulePayments:[],creditPurchases:[]});
  const [loading,setLoading]=useState(true);

  function load(){
    setLoading(true);
    api.get("/api/admin/pending-transfers").then(setData).finally(()=>setLoading(false));
  }
  useEffect(()=>{ load(); },[]);

  async function validate(type,id){
    try{ await api.post(`/api/admin/pending-transfers/${type}/${id}/validate`); load(); }
    catch(err){ alert(err.message||"Erreur lors de la validation."); }
  }
  async function reject(type,id){
    if(!confirm("Rejeter cette commande ?")) return;
    try{ await api.post(`/api/admin/pending-transfers/${type}/${id}/reject`); load(); }
    catch(err){ alert(err.message||"Erreur lors du rejet."); }
  }

  if(loading) return <div style={{color:"#aaa",fontSize:13}}>Chargement…</div>;
  const total=data.modulePayments.length+data.creditPurchases.length;

  return <div style={{display:"flex",flexDirection:"column",gap:"1rem"}}>
    {total===0&&<div style={{background:"#E8F5E9",color:"#2E7D32",border:"1px solid #A5D6A7",borderRadius:8,padding:".875rem",fontSize:13}}>✅ Aucun virement en attente de validation.</div>}
    {data.modulePayments.length>0&&<div style={{background:"#fff",border:"1px solid #EBEBEB",borderRadius:10,padding:"1.125rem"}}>
      <div style={{fontWeight:700,marginBottom:".75rem",color:"#1a1a1a"}}>Achats de modules par virement</div>
      <table style={{width:"100%",borderCollapse:"collapse",fontSize:13}}>
        <thead><tr>{["Utilisateur","Module","HT","TVA","TTC à recevoir","Référence","Actions"].map(h=><th key={h} style={{textAlign:"left",fontSize:11,color:"#aaa",fontWeight:700,padding:"7px 10px",borderBottom:"1px solid #EBEBEB"}}>{h}</th>)}</tr></thead>
        <tbody>{data.modulePayments.map(p=><tr key={p.id}>
          <td style={{padding:"9px 10px",borderBottom:"1px solid #EBEBEB"}}><div style={{fontWeight:600}}>{p.userName}</div><div style={{fontSize:11,color:"#aaa"}}>{p.userEmail}</div></td>
          <td style={{padding:"9px 10px",borderBottom:"1px solid #EBEBEB",fontSize:12}}>{p.moduleTitle}</td>
          <td style={{padding:"9px 10px",borderBottom:"1px solid #EBEBEB",fontSize:12,color:"#888"}}>{(p.amountCentsHt/100).toFixed(2)} €</td>
          <td style={{padding:"9px 10px",borderBottom:"1px solid #EBEBEB",fontSize:12,color:"#888"}}>{p.vatRatePercent}%</td>
          <td style={{padding:"9px 10px",borderBottom:"1px solid #EBEBEB",fontWeight:800,color:"#CC1515"}}>{(p.amountCentsTtc/100).toFixed(2)} €</td>
          <td style={{padding:"9px 10px",borderBottom:"1px solid #EBEBEB",fontFamily:"monospace",fontSize:12}}>{p.transferReference}</td>
          <td style={{padding:"9px 10px",borderBottom:"1px solid #EBEBEB"}}><div style={{display:"flex",gap:4}}><BtnR onClick={()=>validate("module",p.id)} style={{fontSize:11,padding:"5px 10px"}}>✓ Valider</BtnR><BtnG onClick={()=>reject("module",p.id)} style={{fontSize:11,color:"#CC1515",borderColor:"#FDEAEA"}}>✕</BtnG></div></td>
        </tr>)}</tbody>
      </table>
    </div>}
    {data.creditPurchases.length>0&&<div style={{background:"#fff",border:"1px solid #EBEBEB",borderRadius:10,padding:"1.125rem"}}>
      <div style={{fontWeight:700,marginBottom:".75rem",color:"#1a1a1a"}}>Achats de lots de crédits par virement</div>
      <table style={{width:"100%",borderCollapse:"collapse",fontSize:13}}>
        <thead><tr>{["Utilisateur","Crédits","HT","TVA","TTC à recevoir","Référence","Actions"].map(h=><th key={h} style={{textAlign:"left",fontSize:11,color:"#aaa",fontWeight:700,padding:"7px 10px",borderBottom:"1px solid #EBEBEB"}}>{h}</th>)}</tr></thead>
        <tbody>{data.creditPurchases.map(p=><tr key={p.id}>
          <td style={{padding:"9px 10px",borderBottom:"1px solid #EBEBEB"}}><div style={{fontWeight:600}}>{p.userName}</div><div style={{fontSize:11,color:"#aaa"}}>{p.userEmail}</div></td>
          <td style={{padding:"9px 10px",borderBottom:"1px solid #EBEBEB",fontSize:12}}>{p.credits.toLocaleString("fr-FR")} crédits</td>
          <td style={{padding:"9px 10px",borderBottom:"1px solid #EBEBEB",fontSize:12,color:"#888"}}>{(p.amountCentsHt/100).toFixed(2)} €</td>
          <td style={{padding:"9px 10px",borderBottom:"1px solid #EBEBEB",fontSize:12,color:"#888"}}>{p.vatRatePercent}%</td>
          <td style={{padding:"9px 10px",borderBottom:"1px solid #EBEBEB",fontWeight:800,color:"#CC1515"}}>{(p.amountCentsTtc/100).toFixed(2)} €</td>
          <td style={{padding:"9px 10px",borderBottom:"1px solid #EBEBEB",fontFamily:"monospace",fontSize:12}}>{p.transferReference}</td>
          <td style={{padding:"9px 10px",borderBottom:"1px solid #EBEBEB"}}><div style={{display:"flex",gap:4}}><BtnR onClick={()=>validate("credit",p.id)} style={{fontSize:11,padding:"5px 10px"}}>✓ Valider</BtnR><BtnG onClick={()=>reject("credit",p.id)} style={{fontSize:11,color:"#CC1515",borderColor:"#FDEAEA"}}>✕</BtnG></div></td>
        </tr>)}</tbody>
      </table>
    </div>}
  </div>;
}

// ── Configuration de la TVA (admin) ──────────────────────────
function UserFormModal({initial,entreprises,onClose,onSave,onCreateEntreprise}){
  const isEdit=!!initial?.id;
  const [form,setForm]=useState({
    name:initial?.name||"",
    email:initial?.email||"",
    password:"",
    role:initial?.role||"apprenant",
    entrepriseId:initial?.entrepriseId||"",
    forfaitCredits:initial?.forfaitCredits??"",
    postalCode:initial?.postalCode||"",
  });
  const [newEntreprise,setNewEntreprise]=useState("");
  const [error,setError]=useState("");
  const [loading,setLoading]=useState(false);
  const needsEntreprise=form.role==="charge"||form.role==="apprenant";
  const isCharge=form.role==="charge";

  async function submit(){
    setError("");
    if(!form.name.trim()||!form.email.trim()) return setError("Le nom et l'email sont obligatoires.");
    if(!isEdit&&form.password.length<8) return setError("Le mot de passe doit contenir au moins 8 caractères.");
    setLoading(true);
    try{
      const payload={
        name:form.name,
        email:form.email,
        role:form.role,
        entrepriseId:form.entrepriseId||null,
        forfaitCredits:form.forfaitCredits===""?null:Number(form.forfaitCredits),
        postalCode:form.postalCode||null,
      };
      if(form.password) payload.password=form.password;
      await onSave(isEdit?initial.id:null,payload);
    }catch(err){
      setError(err.message||"Erreur lors de l'enregistrement.");
    }finally{
      setLoading(false);
    }
  }

  async function addEntreprise(){
    if(!newEntreprise.trim()) return;
    try{
      const created=await onCreateEntreprise(newEntreprise.trim());
      setForm(f=>({...f,entrepriseId:created.id}));
      setNewEntreprise("");
    }catch(err){ setError(err.message||"Erreur lors de la création de l'entreprise."); }
  }

  return <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,.55)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:9999}} onClick={onClose}>
    <div style={{background:"#fff",borderRadius:14,padding:"1.75rem",width:420,maxWidth:"94vw",maxHeight:"88vh",overflowY:"auto",color:"#1a1a1a"}} onClick={e=>e.stopPropagation()}>
      <div style={{fontSize:18,fontWeight:800,marginBottom:"1rem"}}>{isEdit?"Modifier l'utilisateur":"Nouvel utilisateur"}</div>
      <Input label="Nom complet" value={form.name} onChange={e=>setForm(f=>({...f,name:e.target.value}))}/>
      <Input label="Adresse e-mail" type="email" value={form.email} onChange={e=>setForm(f=>({...f,email:e.target.value}))}/>
      <Input label={isEdit?"Nouveau mot de passe (laisser vide pour ne pas changer)":"Mot de passe"} type="password" value={form.password} onChange={e=>setForm(f=>({...f,password:e.target.value}))}/>
      <div style={{marginBottom:10}}>
        <label style={{fontSize:12,color:"#444",fontWeight:700,display:"block",marginBottom:4}}>Rôle</label>
        <select value={form.role} onChange={e=>setForm(f=>({...f,role:e.target.value}))} style={{width:"100%",border:"1.5px solid #D0D0D0",borderRadius:8,padding:"8px 10px",fontSize:13,background:"#fff",color:"#1a1a1a",outline:"none"}}>
          <option value="apprenant">Apprenant</option>
          <option value="charge">Chargé de formation</option>
          <option value="formateur">Formateur</option>
          <option value="pedagogue">Pédagogue</option>
          <option value="admin">Administrateur</option>
        </select>
      </div>
      {needsEntreprise&&<div style={{marginBottom:10}}>
        <label style={{fontSize:12,color:"#444",fontWeight:700,display:"block",marginBottom:4}}>Entreprise</label>
        <select value={form.entrepriseId} onChange={e=>setForm(f=>({...f,entrepriseId:e.target.value}))} style={{width:"100%",border:"1.5px solid #D0D0D0",borderRadius:8,padding:"8px 10px",fontSize:13,background:"#fff",color:"#1a1a1a",outline:"none",marginBottom:6}}>
          <option value="">— Aucune —</option>
          {entreprises.map(e=><option key={e.id} value={e.id}>{e.name}</option>)}
        </select>
        <div style={{display:"flex",gap:6}}>
          <input value={newEntreprise} onChange={e=>setNewEntreprise(e.target.value)} placeholder="Nouvelle entreprise…" style={{flex:1,border:"1px solid #E0E0E0",borderRadius:7,padding:"6px 10px",fontSize:12,background:"#fff",color:"#1a1a1a",outline:"none"}}/>
          <BtnG onClick={addEntreprise} style={{fontSize:11}}>+ Créer</BtnG>
        </div>
      </div>}
      {isCharge&&<Input label="Crédits initiaux" type="number" value={form.forfaitCredits} onChange={e=>setForm(f=>({...f,forfaitCredits:e.target.value}))}/>}
      <Input label="Code postal (pour le calcul de TVA)" value={form.postalCode} onChange={e=>setForm(f=>({...f,postalCode:e.target.value}))}/>
      {error&&<div style={{background:"#FDEAEA",color:"#CC1515",borderRadius:7,padding:"8px 12px",fontSize:12,marginBottom:12,fontWeight:600}}>{error}</div>}
      <div style={{display:"flex",gap:8,marginTop:8}}>
        <BtnG onClick={onClose} style={{flex:1}}>Annuler</BtnG>
        <BtnR onClick={submit} style={{flex:1,opacity:loading?.6:1}}>{loading?"Enregistrement…":"Enregistrer"}</BtnR>
      </div>
    </div>
  </div>;
}

function UsersAdmin({api,currentUserId}){
  const [users,setUsers]=useState([]);
  const [entreprises,setEntreprises]=useState([]);
  const [loading,setLoading]=useState(true);
  const [editing,setEditing]=useState(null); // null = fermé, {} = création, {...} = édition
  const [error,setError]=useState("");

  function load(){
    setLoading(true);
    Promise.all([api.get("/api/admin/users"),api.get("/api/admin/entreprises")])
      .then(([u,e])=>{ setUsers(u.users); setEntreprises(e.entreprises); setError(""); })
      .catch(err=>setError(err.message||"Impossible de charger les utilisateurs."))
      .finally(()=>setLoading(false));
  }
  useEffect(()=>{ load(); },[]);

  async function handleSave(id,payload){
    if(id) await api.put(`/api/admin/users/${id}`,payload);
    else await api.post("/api/admin/users",payload);
    setEditing(null);
    load();
  }
  async function handleCreateEntreprise(name){
    const res=await api.post("/api/admin/entreprises",{name});
    setEntreprises(prev=>[...prev,res.entreprise]);
    return res.entreprise;
  }
  async function handleDelete(u){
    if(u.id===currentUserId) return alert("Vous ne pouvez pas supprimer votre propre compte.");
    if(!confirm(`Supprimer le compte de ${u.name} ?`)) return;
    try{ await api.del(`/api/admin/users/${u.id}`); load(); }
    catch(err){ alert(err.message||"Erreur lors de la suppression."); }
  }

  const card={background:"#fff",border:"1px solid #EBEBEB",borderRadius:10,padding:"1.125rem"};

  return <div style={card}>
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:".875rem"}}>
      <div style={{fontWeight:700,color:"#1a1a1a"}}>Gestion des utilisateurs</div>
      <BtnR onClick={()=>setEditing({})} style={{fontSize:11,padding:"5px 12px"}}>+ Nouvel utilisateur</BtnR>
    </div>
    {error&&<div style={{background:"#FDEAEA",color:"#CC1515",borderRadius:8,padding:"10px 14px",fontSize:13,marginBottom:"1rem",fontWeight:600}}>{error}</div>}
    {loading?<div style={{color:"#aaa",fontSize:13}}>Chargement…</div>:
    <table style={{width:"100%",borderCollapse:"collapse",fontSize:13}}>
      <thead><tr>{["Utilisateur","Rôle","Email","Entreprise","Crédits","Actions"].map(h=><th key={h} style={{textAlign:"left",fontSize:11,color:"#aaa",fontWeight:700,padding:"7px 10px",borderBottom:"1px solid #EBEBEB"}}>{h}</th>)}</tr></thead>
      <tbody>{users.map(u=><tr key={u.id}>
        <td style={{padding:"9px 10px",borderBottom:"1px solid #EBEBEB"}}><div style={{display:"flex",alignItems:"center",gap:7}}><div style={{width:26,height:26,background:"#CC1515",color:"#fff",borderRadius:"50%",display:"flex",alignItems:"center",justifyContent:"center",fontSize:10,fontWeight:800,flexShrink:0}}>{u.avatar}</div>{u.name}</div></td>
        <td style={{padding:"9px 10px",borderBottom:"1px solid #EBEBEB"}}><Rb role={u.role}/></td>
        <td style={{padding:"9px 10px",borderBottom:"1px solid #EBEBEB",fontSize:12,color:"#aaa"}}>{u.email}</td>
        <td style={{padding:"9px 10px",borderBottom:"1px solid #EBEBEB",fontSize:12,color:"#666"}}>{u.entrepriseName||"—"}</td>
        <td style={{padding:"9px 10px",borderBottom:"1px solid #EBEBEB",fontSize:12,color:"#666"}}>{u.forfaitCredits??"—"}</td>
        <td style={{padding:"9px 10px",borderBottom:"1px solid #EBEBEB"}}><div style={{display:"flex",gap:4}}>
          <BtnG onClick={()=>setEditing(u)} style={{fontSize:11}}>✏️</BtnG>
          <BtnG onClick={()=>handleDelete(u)} style={{fontSize:11,color:"#CC1515",borderColor:"#FDEAEA"}}>🗑</BtnG>
        </div></td>
      </tr>)}</tbody>
    </table>}
    {editing!==null&&<UserFormModal initial={editing} entreprises={entreprises} onClose={()=>setEditing(null)} onSave={handleSave} onCreateEntreprise={handleCreateEntreprise}/>}
  </div>;
}

function VatAdmin({api}){
  const [countries,setCountries]=useState([]);
  const [rules,setRules]=useState([]);
  const [loading,setLoading]=useState(true);
  const [editingCountry,setEditingCountry]=useState(null);
  const [editingRule,setEditingRule]=useState(null);

  function load(){
    setLoading(true);
    Promise.all([api.get("/api/vat/countries"),api.get("/api/vat/postal-rules")])
      .then(([c,r])=>{ setCountries(c.countries); setRules(r.rules); })
      .finally(()=>setLoading(false));
  }
  useEffect(()=>{ load(); },[]);

  async function saveCountry(form){
    try{ await api.put("/api/vat/countries",form); setEditingCountry(null); load(); }
    catch(err){ alert(err.message||"Erreur lors de l'enregistrement."); }
  }
  async function deleteCountry(code){
    if(!confirm("Supprimer ce pays ? Les règles de code postal associées seront aussi supprimées.")) return;
    try{ await api.del(`/api/vat/countries/${code}`); load(); }
    catch(err){ alert(err.message||"Erreur lors de la suppression."); }
  }
  async function saveRule(form){
    try{
      if(form.id) await api.put(`/api/vat/postal-rules/${form.id}`,form);
      else await api.post("/api/vat/postal-rules",form);
      setEditingRule(null);
      load();
    }catch(err){ alert(err.message||"Erreur lors de l'enregistrement."); }
  }
  async function deleteRule(id){
    if(!confirm("Supprimer cette règle de code postal ?")) return;
    try{ await api.del(`/api/vat/postal-rules/${id}`); load(); }
    catch(err){ alert(err.message||"Erreur lors de la suppression."); }
  }

  if(loading) return <div style={{color:"#aaa",fontSize:13}}>Chargement…</div>;

  return <div style={{display:"flex",flexDirection:"column",gap:"1rem"}}>
    <div style={{background:"#fff",border:"1px solid #EBEBEB",borderRadius:10,padding:"1.125rem"}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:".875rem"}}>
        <div style={{fontWeight:700,color:"#1a1a1a"}}>Taux de TVA par défaut, par pays</div>
        <BtnR onClick={()=>setEditingCountry({countryCode:"",countryName:"",defaultRatePercent:20})} style={{fontSize:11,padding:"5px 12px"}}>+ Nouveau pays</BtnR>
      </div>
      <table style={{width:"100%",borderCollapse:"collapse",fontSize:13}}>
        <thead><tr>{["Code","Pays","Taux par défaut","Actions"].map(h=><th key={h} style={{textAlign:"left",fontSize:11,color:"#aaa",fontWeight:700,padding:"7px 10px",borderBottom:"1px solid #EBEBEB"}}>{h}</th>)}</tr></thead>
        <tbody>{countries.map(c=><tr key={c.countryCode}>
          <td style={{padding:"9px 10px",borderBottom:"1px solid #EBEBEB",fontFamily:"monospace"}}>{c.countryCode}</td>
          <td style={{padding:"9px 10px",borderBottom:"1px solid #EBEBEB",fontWeight:600}}>{c.countryName}</td>
          <td style={{padding:"9px 10px",borderBottom:"1px solid #EBEBEB",fontWeight:800,color:"#CC1515"}}>{c.defaultRatePercent}%</td>
          <td style={{padding:"9px 10px",borderBottom:"1px solid #EBEBEB"}}><div style={{display:"flex",gap:4}}><BtnG onClick={()=>setEditingCountry(c)} style={{fontSize:11}}>✏️</BtnG><BtnG onClick={()=>deleteCountry(c.countryCode)} style={{fontSize:11,color:"#CC1515",borderColor:"#FDEAEA"}}>🗑</BtnG></div></td>
        </tr>)}</tbody>
      </table>
    </div>

    <div style={{background:"#fff",border:"1px solid #EBEBEB",borderRadius:10,padding:"1.125rem"}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:".875rem"}}>
        <div style={{fontWeight:700,color:"#1a1a1a"}}>Exceptions par code postal</div>
        <BtnR onClick={()=>setEditingRule({countryCode:countries[0]?.countryCode||"FR",postalPrefix:"",ratePercent:0,label:""})} style={{fontSize:11,padding:"5px 12px"}}>+ Nouvelle règle</BtnR>
      </div>
      <div style={{fontSize:11,color:"#888",marginBottom:".75rem"}}>S'applique à tout code postal commençant par le préfixe indiqué (la règle la plus précise/longue l'emporte). Exemple : préfixe « 971 » = Guadeloupe, préfixe « 97133 » = Saint-Barthélemy (plus spécifique, prioritaire sur 971).</div>
      <table style={{width:"100%",borderCollapse:"collapse",fontSize:13}}>
        <thead><tr>{["Pays","Préfixe","Libellé","Taux","Actions"].map(h=><th key={h} style={{textAlign:"left",fontSize:11,color:"#aaa",fontWeight:700,padding:"7px 10px",borderBottom:"1px solid #EBEBEB"}}>{h}</th>)}</tr></thead>
        <tbody>{rules.map(r=><tr key={r.id}>
          <td style={{padding:"9px 10px",borderBottom:"1px solid #EBEBEB",fontFamily:"monospace"}}>{r.countryCode}</td>
          <td style={{padding:"9px 10px",borderBottom:"1px solid #EBEBEB",fontFamily:"monospace"}}>{r.postalPrefix}</td>
          <td style={{padding:"9px 10px",borderBottom:"1px solid #EBEBEB"}}>{r.label}</td>
          <td style={{padding:"9px 10px",borderBottom:"1px solid #EBEBEB",fontWeight:800,color:"#CC1515"}}>{r.ratePercent}%</td>
          <td style={{padding:"9px 10px",borderBottom:"1px solid #EBEBEB"}}><div style={{display:"flex",gap:4}}><BtnG onClick={()=>setEditingRule(r)} style={{fontSize:11}}>✏️</BtnG><BtnG onClick={()=>deleteRule(r.id)} style={{fontSize:11,color:"#CC1515",borderColor:"#FDEAEA"}}>🗑</BtnG></div></td>
        </tr>)}</tbody>
      </table>
    </div>

    {editingCountry&&<div style={{position:"fixed",inset:0,background:"rgba(0,0,0,.55)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:9999}} onClick={()=>setEditingCountry(null)}>
      <div style={{background:"#fff",borderRadius:14,padding:"1.75rem",width:360,maxWidth:"94vw",color:"#1a1a1a"}} onClick={e=>e.stopPropagation()}>
        <div style={{fontSize:17,fontWeight:800,marginBottom:"1rem"}}>{countries.find(c=>c.countryCode===editingCountry.countryCode)?"Modifier le pays":"Nouveau pays"}</div>
        <Input label="Code pays (2 lettres, ex : FR)" defaultValue={editingCountry.countryCode} onChange={e=>editingCountry.countryCode=e.target.value.toUpperCase()} maxLength={2}/>
        <Input label="Nom du pays" defaultValue={editingCountry.countryName} onChange={e=>editingCountry.countryName=e.target.value}/>
        <Input label="Taux de TVA par défaut (%)" type="number" step="0.1" defaultValue={editingCountry.defaultRatePercent} onChange={e=>editingCountry.defaultRatePercent=Number(e.target.value)}/>
        <div style={{display:"flex",gap:8,marginTop:8}}>
          <BtnG onClick={()=>setEditingCountry(null)} style={{flex:1}}>Annuler</BtnG>
          <BtnR onClick={()=>saveCountry(editingCountry)} style={{flex:1}}>Enregistrer</BtnR>
        </div>
      </div>
    </div>}

    {editingRule&&<div style={{position:"fixed",inset:0,background:"rgba(0,0,0,.55)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:9999}} onClick={()=>setEditingRule(null)}>
      <div style={{background:"#fff",borderRadius:14,padding:"1.75rem",width:360,maxWidth:"94vw",color:"#1a1a1a"}} onClick={e=>e.stopPropagation()}>
        <div style={{fontSize:17,fontWeight:800,marginBottom:"1rem"}}>{editingRule.id?"Modifier la règle":"Nouvelle règle de code postal"}</div>
        <div style={{marginBottom:10}}>
          <label style={{fontSize:12,color:"#444",fontWeight:700,display:"block",marginBottom:4}}>Pays</label>
          <select defaultValue={editingRule.countryCode} onChange={e=>editingRule.countryCode=e.target.value} style={{width:"100%",border:"1.5px solid #D0D0D0",borderRadius:8,padding:"8px 10px",fontSize:13,background:"#fff",color:"#1a1a1a",outline:"none"}}>
            {countries.map(c=><option key={c.countryCode} value={c.countryCode}>{c.countryName} ({c.countryCode})</option>)}
          </select>
        </div>
        <Input label="Préfixe de code postal (ex : 971, 97133)" defaultValue={editingRule.postalPrefix} onChange={e=>editingRule.postalPrefix=e.target.value}/>
        <Input label="Libellé (ex : Guadeloupe)" defaultValue={editingRule.label} onChange={e=>editingRule.label=e.target.value}/>
        <Input label="Taux de TVA applicable (%)" type="number" step="0.1" defaultValue={editingRule.ratePercent} onChange={e=>editingRule.ratePercent=Number(e.target.value)}/>
        <div style={{display:"flex",gap:8,marginTop:8}}>
          <BtnG onClick={()=>setEditingRule(null)} style={{flex:1}}>Annuler</BtnG>
          <BtnR onClick={()=>saveRule(editingRule)} style={{flex:1}}>Enregistrer</BtnR>
        </div>
      </div>
    </div>}
  </div>;
}

function AccessAdmin({api}){
  const [query,setQuery]=useState("");
  const [results,setResults]=useState([]);
  const [searching,setSearching]=useState(false);
  const [selectedUser,setSelectedUser]=useState(null);
  const [enrollments,setEnrollments]=useState([]);
  const [loadingEnrollments,setLoadingEnrollments]=useState(false);
  const [extending,setExtending]=useState(null);

  useEffect(()=>{
    if(!query.trim()){ setResults([]); return; }
    let active=true;
    const t=setTimeout(()=>{
      setSearching(true);
      api.get(`/api/admin/users/search?email=${encodeURIComponent(query.trim())}`)
        .then(d=>{ if(active) setResults(d.users); })
        .catch(()=>{ if(active) setResults([]); })
        .finally(()=>{ if(active) setSearching(false); });
    },350);
    return ()=>{ active=false; clearTimeout(t); };
  },[query]); // eslint-disable-line react-hooks/exhaustive-deps

  function selectUser(u){
    setSelectedUser(u);
    setResults([]);
    setQuery("");
    setLoadingEnrollments(true);
    api.get(`/api/admin/users/${u.id}/enrollments`).then(d=>setEnrollments(d.enrollments)).catch(()=>setEnrollments([])).finally(()=>setLoadingEnrollments(false));
  }

  async function extend(enrollmentId,months){
    setExtending(enrollmentId);
    try{
      const expiresAt=months===null?null:new Date(Date.now()+months*30*86400000).toISOString();
      await api.put(`/api/admin/enrollments/${enrollmentId}/extend`,{expiresAt});
      const d=await api.get(`/api/admin/users/${selectedUser.id}/enrollments`);
      setEnrollments(d.enrollments);
    }catch(err){
      alert(err.message||"Erreur lors de la prolongation.");
    }finally{
      setExtending(null);
    }
  }

  const card={background:"#fff",border:"1px solid #EBEBEB",borderRadius:10,padding:"1.125rem"};

  return <div style={{display:"flex",flexDirection:"column",gap:"1rem"}}>
    <div style={card}>
      <div style={{fontWeight:700,marginBottom:".875rem",color:"#1a1a1a"}}>Gérer l'accès aux formations</div>
      <p style={{fontSize:12,color:"#666",lineHeight:1.6,marginBottom:"1rem"}}>L'accès à une formation est limité à 3 mois après l'achat ou l'affectation. Recherchez un apprenant pour consulter ses inscriptions et, si besoin, prolonger ou rendre illimité son accès à une formation précise — même après expiration.</p>
      <div style={{position:"relative",maxWidth:380}}>
        <input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Rechercher un apprenant par email…" style={{width:"100%",border:"1.5px solid #D0D0D0",borderRadius:8,padding:"9px 12px",fontSize:13,background:"#fff",color:"#1a1a1a",outline:"none"}}/>
        {(searching||results.length>0)&&<div style={{position:"absolute",top:"calc(100% + 4px)",left:0,right:0,background:"#fff",border:"1px solid #E8E8E8",borderRadius:8,boxShadow:"0 4px 16px rgba(0,0,0,.1)",zIndex:10,maxHeight:220,overflowY:"auto"}}>
          {searching&&<div style={{padding:"10px 12px",fontSize:12,color:"#aaa"}}>Recherche…</div>}
          {!searching&&results.map(u=>
            <div key={u.id} onClick={()=>selectUser(u)} style={{padding:"9px 12px",cursor:"pointer",borderBottom:"1px solid #F0F0F0"}}
              onMouseEnter={e=>e.currentTarget.style.background="#FFF8F8"} onMouseLeave={e=>e.currentTarget.style.background="#fff"}>
              <div style={{fontSize:13,fontWeight:700,color:"#1a1a1a"}}>{u.name}</div>
              <div style={{fontSize:11,color:"#888"}}>{u.email} · <Rb role={u.role}/></div>
            </div>
          )}
        </div>}
      </div>
    </div>

    {selectedUser&&<div style={card}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:".875rem"}}>
        <div>
          <div style={{fontWeight:700,color:"#1a1a1a"}}>{selectedUser.name}</div>
          <div style={{fontSize:12,color:"#888"}}>{selectedUser.email}</div>
        </div>
        <BtnG onClick={()=>{setSelectedUser(null);setEnrollments([]);}} style={{fontSize:11}}>✕ Fermer</BtnG>
      </div>
      {loadingEnrollments?<div style={{color:"#aaa",fontSize:13}}>Chargement…</div>:
      enrollments.length===0?<div style={{color:"#aaa",fontSize:13}}>Aucune inscription pour cet utilisateur.</div>:
      <table style={{width:"100%",borderCollapse:"collapse",fontSize:13}}>
        <thead><tr>{["Module","Inscrit le","Expire le","Statut","Actions"].map(h=><th key={h} style={{textAlign:"left",fontSize:11,color:"#aaa",fontWeight:700,padding:"7px 10px",borderBottom:"1px solid #EBEBEB"}}>{h}</th>)}</tr></thead>
        <tbody>{enrollments.map(e=>
          <tr key={e.id}>
            <td style={{padding:"9px 10px",borderBottom:"1px solid #EBEBEB",fontWeight:600,fontSize:12}}>{e.title}</td>
            <td style={{padding:"9px 10px",borderBottom:"1px solid #EBEBEB",fontSize:12,color:"#888"}}>{new Date(e.createdAt).toLocaleDateString("fr-FR")}</td>
            <td style={{padding:"9px 10px",borderBottom:"1px solid #EBEBEB",fontSize:12,color:"#888"}}>{e.expiresAt?new Date(e.expiresAt).toLocaleDateString("fr-FR"):"Illimité"}</td>
            <td style={{padding:"9px 10px",borderBottom:"1px solid #EBEBEB"}}>
              {e.isExpired?<span style={{fontSize:10,fontWeight:700,padding:"2px 9px",borderRadius:20,background:"#FDEAEA",color:"#CC1515"}}>Expiré</span>
                :e.expiresAt===null?<span style={{fontSize:10,fontWeight:700,padding:"2px 9px",borderRadius:20,background:"#E8F5E9",color:"#2E7D32"}}>Illimité</span>
                :<span style={{fontSize:10,fontWeight:700,padding:"2px 9px",borderRadius:20,background:"#E3F2FD",color:"#0277BD"}}>Actif</span>}
            </td>
            <td style={{padding:"9px 10px",borderBottom:"1px solid #EBEBEB"}}>
              <div style={{display:"flex",gap:4,flexWrap:"wrap"}}>
                <BtnG onClick={()=>extend(e.id,3)} disabled={extending===e.id} style={{fontSize:10}}>+3 mois</BtnG>
                <BtnG onClick={()=>extend(e.id,null)} disabled={extending===e.id} style={{fontSize:10}}>Illimité</BtnG>
              </div>
            </td>
          </tr>
        )}</tbody>
      </table>}
    </div>}
  </div>;
}

function ReferralAdmin({api}){
  const [settings,setSettings]=useState(null);
  const [loading,setLoading]=useState(true);
  const [saving,setSaving]=useState(false);
  const [saved,setSaved]=useState(false);

  useEffect(()=>{
    api.get("/api/referral/settings").then(setSettings).catch(()=>{}).finally(()=>setLoading(false));
  },[]);

  async function save(){
    setSaving(true); setSaved(false);
    try{
      const updated=await api.put("/api/referral/settings",{
        discountPercent:Number(settings.discountPercent),
        commissionPercent:Number(settings.commissionPercent),
        reimbursementThresholdCents:Math.round(Number(settings.reimbursementThresholdEuros)*100),
      });
      setSettings(s=>({...s,...updated}));
      setSaved(true);
      setTimeout(()=>setSaved(false),2000);
    }catch(err){
      alert(err.message||"Erreur lors de l'enregistrement.");
    }finally{
      setSaving(false);
    }
  }

  const card={background:"#fff",border:"1px solid #EBEBEB",borderRadius:10,padding:"1.125rem"};

  return <div style={{display:"flex",flexDirection:"column",gap:"1rem"}}>
    <div style={card}>
      <div style={{fontWeight:700,marginBottom:".875rem",color:"#1a1a1a"}}>Programme ambassadeur</div>
      <p style={{fontSize:13,color:"#666",lineHeight:1.6,marginBottom:"1rem"}}>Chaque utilisateur dispose d'un code ambassadeur unique généré automatiquement. Toute personne qui saisit ce code à son inscription bénéficie d'une réduction permanente sur ses achats. En retour, l'émetteur du code touche une commission sur chaque achat réalisé par ses filleuls, remboursable par virement à partir d'un certain seuil.</p>
      {loading||!settings?<div style={{color:"#aaa",fontSize:13}}>Chargement…</div>:<>
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(200px,1fr))",gap:10,maxWidth:640}}>
          <Input label="Réduction accordée au filleul (%)" type="number" step="0.5" min="0" max="100" value={settings.discountPercent} onChange={e=>setSettings(s=>({...s,discountPercent:e.target.value}))}/>
          <Input label="Commission accordée à l'ambassadeur (%)" type="number" step="0.5" min="0" max="100" value={settings.commissionPercent} onChange={e=>setSettings(s=>({...s,commissionPercent:e.target.value}))}/>
          <Input label="Seuil de remboursement (€)" type="number" step="1" min="0" value={settings.reimbursementThresholdEuros??(settings.reimbursementThresholdCents/100)} onChange={e=>setSettings(s=>({...s,reimbursementThresholdEuros:e.target.value}))}/>
        </div>
        <div style={{display:"flex",alignItems:"center",gap:10,marginTop:10}}>
          <BtnR onClick={save} style={{fontSize:12,padding:"8px 16px",opacity:saving?.6:1}}>{saving?"Enregistrement…":"Enregistrer"}</BtnR>
          {saved&&<span style={{fontSize:12,color:"#2E7D32",fontWeight:600}}>✅ Enregistré</span>}
        </div>
      </>}
    </div>
    <ReimbursementsAdmin api={api}/>
  </div>;
}

function ReimbursementsAdmin({api}){
  const [list,setList]=useState([]);
  const [loading,setLoading]=useState(true);
  const [busyId,setBusyId]=useState(null);

  function load(){
    setLoading(true);
    api.get("/api/admin/reimbursements").then(d=>setList(d.reimbursements)).catch(()=>{}).finally(()=>setLoading(false));
  }
  useEffect(()=>{ load(); },[]);

  async function validate(id){
    setBusyId(id);
    try{ await api.post(`/api/admin/reimbursements/${id}/validate`); load(); }
    catch(err){ alert(err.message||"Erreur."); }
    finally{ setBusyId(null); }
  }
  async function markPaid(id){
    if(!confirm("Confirmer que le virement bancaire a bien été réalisé ? Cette action débite le solde de l'ambassadeur et lui envoie une notification.")) return;
    setBusyId(id);
    try{ await api.post(`/api/admin/reimbursements/${id}/mark-paid`); load(); }
    catch(err){ alert(err.message||"Erreur."); }
    finally{ setBusyId(null); }
  }
  async function reject(id){
    if(!confirm("Refuser cette demande de remboursement ?")) return;
    setBusyId(id);
    try{ await api.post(`/api/admin/reimbursements/${id}/reject`); load(); }
    catch(err){ alert(err.message||"Erreur."); }
    finally{ setBusyId(null); }
  }

  const statusInfo={
    pending:["À valider","#FFF8E1","#E65100"],
    validated:["Validée — virement à faire","#E3F2FD","#0277BD"],
    paid:["Payée","#E8F5E9","#2E7D32"],
    rejected:["Refusée","#F5F5F5","#888"],
  };

  const card={background:"#fff",border:"1px solid #EBEBEB",borderRadius:10,padding:"1.125rem"};
  const active=list.filter(r=>r.status==="pending"||r.status==="validated");

  return <div style={card}>
    <div style={{fontWeight:700,marginBottom:".875rem",color:"#1a1a1a"}}>Demandes de remboursement ambassadeur</div>
    {loading?<div style={{color:"#aaa",fontSize:13}}>Chargement…</div>:
    active.length===0?<div style={{background:"#E8F5E9",color:"#2E7D32",border:"1px solid #A5D6A7",borderRadius:8,padding:".875rem",fontSize:13}}>✅ Aucune demande en attente.</div>:
    <table style={{width:"100%",borderCollapse:"collapse",fontSize:13}}>
      <thead><tr>{["Ambassadeur","Facture","Montant","IBAN","Statut","Échéance","Actions"].map(h=><th key={h} style={{textAlign:"left",fontSize:11,color:"#aaa",fontWeight:700,padding:"7px 10px",borderBottom:"1px solid #EBEBEB"}}>{h}</th>)}</tr></thead>
      <tbody>{active.map(r=>{
        const [label,bg,color]=statusInfo[r.status];
        return <tr key={r.id}>
          <td style={{padding:"9px 10px",borderBottom:"1px solid #EBEBEB"}}><div style={{fontWeight:600,fontSize:12}}>{r.userName}</div><div style={{fontSize:11,color:"#aaa"}}>{r.userEmail}</div></td>
          <td style={{padding:"9px 10px",borderBottom:"1px solid #EBEBEB",fontSize:11,color:"#888"}}>{r.invoiceNumber}</td>
          <td style={{padding:"9px 10px",borderBottom:"1px solid #EBEBEB",fontWeight:800,color:"#CC1515"}}>{(r.amountCents/100).toFixed(2)} €</td>
          <td style={{padding:"9px 10px",borderBottom:"1px solid #EBEBEB",fontSize:11,color:"#888",fontFamily:"monospace"}}>{r.iban}</td>
          <td style={{padding:"9px 10px",borderBottom:"1px solid #EBEBEB"}}><span style={{fontSize:10,fontWeight:700,padding:"2px 9px",borderRadius:20,background:bg,color}}>{label}</span></td>
          <td style={{padding:"9px 10px",borderBottom:"1px solid #EBEBEB",fontSize:11,color:"#888"}}>{r.deadlineAt?new Date(r.deadlineAt).toLocaleDateString("fr-FR"):"—"}</td>
          <td style={{padding:"9px 10px",borderBottom:"1px solid #EBEBEB"}}>
            <div style={{display:"flex",gap:4,flexWrap:"wrap"}}>
              {r.status==="pending"&&<BtnR onClick={()=>validate(r.id)} disabled={busyId===r.id} style={{fontSize:10,padding:"5px 10px"}}>Valider</BtnR>}
              {r.status==="validated"&&<BtnR onClick={()=>markPaid(r.id)} disabled={busyId===r.id} style={{fontSize:10,padding:"5px 10px",background:"#2E7D32"}}>Virement fait</BtnR>}
              <BtnG onClick={()=>reject(r.id)} disabled={busyId===r.id} style={{fontSize:10,color:"#CC1515",borderColor:"#FDEAEA"}}>Refuser</BtnG>
            </div>
          </td>
        </tr>;
      })}</tbody>
    </table>}
  </div>;
}

function CertificateAdmin({api}){
  const [settings,setSettings]=useState(null);
  const [loading,setLoading]=useState(true);
  const [saving,setSaving]=useState(false);
  const [saved,setSaved]=useState(false);
  const [error,setError]=useState("");
  const [uploading,setUploading]=useState(null); // "stamp" | "signature" | null

  function load(){
    setLoading(true);
    api.get("/api/admin/certificate-settings").then(setSettings).catch(()=>{}).finally(()=>setLoading(false));
  }
  useEffect(()=>{ load(); },[]);

  async function save(){
    setSaving(true); setSaved(false); setError("");
    try{
      const updated=await api.put("/api/admin/certificate-settings",settings);
      setSettings(updated);
      setSaved(true);
      setTimeout(()=>setSaved(false),2000);
    }catch(err){
      setError(err.message||"Erreur lors de l'enregistrement.");
    }finally{
      setSaving(false);
    }
  }

  // Upload direct via fetch (pas le client JSON habituel : il faut envoyer un
  // FormData multipart, pas du JSON, pour transmettre le fichier image).
  async function uploadImage(type,file){
    if(!file) return;
    setUploading(type); setError("");
    try{
      const form=new FormData();
      form.append("file",file);
      const data=await api.postForm(`/api/admin/certificate-settings/${type}`,form);
      if(data.warning) setError(data.warning);
      load();
    }catch(err){
      setError(err.message||"Échec de l'envoi de l'image.");
    }finally{
      setUploading(null);
    }
  }

  async function removeImage(type){
    if(!confirm("Retirer cette image de l'attestation ?")) return;
    try{ await api.del(`/api/admin/certificate-settings/${type}`); load(); }
    catch(err){ alert(err.message||"Erreur lors de la suppression."); }
  }

  const card={background:"#fff",border:"1px solid #EBEBEB",borderRadius:10,padding:"1.125rem"};
  if(loading||!settings) return <div style={{color:"#aaa",fontSize:13}}>Chargement…</div>;

  return <div style={{display:"flex",flexDirection:"column",gap:"1rem"}}>
    <div style={card}>
      <div style={{fontWeight:700,marginBottom:".875rem",color:"#1a1a1a"}}>Textes de l'attestation</div>
      <Input label="Titre" value={settings.titleText} onChange={e=>setSettings(s=>({...s,titleText:e.target.value}))}/>
      <Input label="Phrase d'introduction" value={settings.introText} onChange={e=>setSettings(s=>({...s,introText:e.target.value}))}/>
      <Input label="Phrase descriptive (sous le nom)" value={settings.subtitleText} onChange={e=>setSettings(s=>({...s,subtitleText:e.target.value}))}/>
      <Input label="Texte de pied de page" value={settings.footerText} onChange={e=>setSettings(s=>({...s,footerText:e.target.value}))}/>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
        <Input label="Nom du signataire" value={settings.signatoryName} onChange={e=>setSettings(s=>({...s,signatoryName:e.target.value}))}/>
        <Input label="Fonction du signataire" value={settings.signatoryTitle} onChange={e=>setSettings(s=>({...s,signatoryTitle:e.target.value}))}/>
      </div>
      {error&&<div style={{background:"#FDEAEA",color:"#CC1515",borderRadius:7,padding:"8px 12px",fontSize:12,marginBottom:10,fontWeight:600}}>{error}</div>}
      <div style={{display:"flex",alignItems:"center",gap:10}}>
        <BtnR onClick={save} style={{fontSize:12,padding:"8px 16px",opacity:saving?.6:1}}>{saving?"Enregistrement…":"Enregistrer"}</BtnR>
        {saved&&<span style={{fontSize:12,color:"#2E7D32",fontWeight:600}}>✅ Enregistré</span>}
      </div>
    </div>

    <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(260px,1fr))",gap:"1rem"}}>
      {[{type:"stamp",label:"Tampon",has:settings.hasStamp,embeddable:settings.stampEmbeddable},{type:"signature",label:"Signature du directeur",has:settings.hasSignature,embeddable:settings.signatureEmbeddable}].map(img=>
        <div key={img.type} style={card}>
          <div style={{fontWeight:700,fontSize:13,marginBottom:".625rem",color:"#1a1a1a"}}>{img.label}</div>
          <div style={{fontSize:12,color:"#666",marginBottom:".75rem"}}>
            {img.has
              ? (img.embeddable?"✅ Image configurée et intégrée sur les attestations.":"⚠️ Fichier conservé, mais le format SVG ne peut pas être intégré dans le PDF — utilisez un PNG ou JPEG.")
              : "Aucune image configurée pour le moment."}
          </div>
          <input type="file" accept="image/png,image/jpeg,image/svg+xml" onChange={e=>uploadImage(img.type,e.target.files?.[0])} disabled={uploading===img.type} style={{fontSize:12,marginBottom:8,display:"block"}}/>
          {uploading===img.type&&<div style={{fontSize:11,color:"#aaa"}}>Envoi en cours…</div>}
          {img.has&&<BtnG onClick={()=>removeImage(img.type)} style={{fontSize:11,color:"#CC1515",borderColor:"#FDEAEA"}}>🗑 Retirer l'image</BtnG>}
        </div>
      )}
    </div>
  </div>;
}

function PathsAdmin({api,user}){
  const [paths,setPaths]=useState([]);
  const [modules,setModules]=useState([]);
  const [loading,setLoading]=useState(true);
  const [editing,setEditing]=useState(null); // null|{}|{id,...}
  const [savingPath,setSavingPath]=useState(false);
  const card={background:"#fff",border:"1px solid #EBEBEB",borderRadius:10,padding:"1.125rem"};

  function load(){
    setLoading(true);
    Promise.all([api.get("/api/paths"),api.get("/api/modules")])
      .then(([p,m])=>{ setPaths(p.paths); setModules(m.modules); })
      .catch(()=>{}).finally(()=>setLoading(false));
  }
  useEffect(()=>{ load(); },[]);

  async function savePath(){
    if(!editing) return;
    setSavingPath(true);
    try{
      const payload={title:editing.title,description:editing.description||"",priceCents:Number(editing.priceCents||0),published:editing.published||false};
      let id=editing.id;
      if(id){
        await api.put(`/api/paths/${id}`,payload);
      }else{
        const res=await api.post("/api/paths",payload);
        id=res.path.id;
      }
      if(editing.moduleIds?.length>0){
        await api.put(`/api/paths/${id}/modules`,{moduleIds:editing.moduleIds});
      }
      setEditing(null); load();
    }catch(err){ alert(err.message||"Erreur."); }
    finally{ setSavingPath(false); }
  }

  async function deletePath(id){
    if(!confirm("Supprimer ce parcours ?")) return;
    try{ await api.del(`/api/paths/${id}`); load(); }
    catch(err){ alert(err.message||"Erreur."); }
  }

  async function togglePublish(p){
    try{ await api.put(`/api/paths/${p.id}`,{published:!p.published}); load(); }
    catch(err){ alert(err.message||"Erreur."); }
  }

  return <div style={{display:"flex",flexDirection:"column",gap:"1rem"}}>
    <div style={card}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:".875rem"}}>
        <div>
          <div style={{fontWeight:700,color:"#1a1a1a",fontSize:15}}>Parcours de formation</div>
          <div style={{fontSize:12,color:"#888",marginTop:2}}>Groupez plusieurs modules en un parcours ordonné avec un seul point d'entrée.</div>
        </div>
        <BtnR onClick={()=>setEditing({title:"",description:"",priceCents:0,published:false,moduleIds:[]})} style={{fontSize:11}}>+ Nouveau parcours</BtnR>
      </div>
      {loading?<div style={{color:"#aaa",fontSize:13}}>Chargement…</div>:
      paths.length===0?<div style={{color:"#aaa",fontSize:13}}>Aucun parcours. Créez le premier ci-dessus.</div>:
      <div style={{display:"flex",flexDirection:"column",gap:8}}>
        {paths.map(p=><div key={p.id} style={{border:"1px solid #EBEBEB",borderRadius:9,padding:".875rem",display:"flex",justifyContent:"space-between",alignItems:"center",flexWrap:"wrap",gap:8}}>
          <div>
            <div style={{display:"flex",gap:8,alignItems:"center"}}>
              <div style={{fontWeight:700,fontSize:13,color:"#1a1a1a"}}>{p.title}</div>
              {p.published
                ?<span style={{fontSize:9,fontWeight:800,background:"#E8F5E9",color:"#2E7D32",borderRadius:20,padding:"2px 7px"}}>PUBLIÉ</span>
                :<span style={{fontSize:9,fontWeight:800,background:"#FFF8E1",color:"#E65100",borderRadius:20,padding:"2px 7px"}}>BROUILLON</span>}
            </div>
            <div style={{fontSize:11,color:"#888",marginTop:2}}>{p.moduleCount} module(s) · {p.priceCents===0?"Gratuit":`${(p.priceCents/100).toFixed(0)} €`}</div>
          </div>
          <div style={{display:"flex",gap:5}}>
            <BtnG onClick={()=>togglePublish(p)} style={{fontSize:10}}>{p.published?"Dépublier":"Publier"}</BtnG>
            <BtnG onClick={async()=>{
              const mRes=await api.get(`/api/paths/${p.id}`);
              setEditing({...p,moduleIds:mRes.modules.map(m=>m.id)});
            }} style={{fontSize:10}}>✏️</BtnG>
            <BtnG onClick={()=>deletePath(p.id)} style={{fontSize:10,color:"#CC1515",borderColor:"#FDEAEA"}}>🗑</BtnG>
          </div>
        </div>)}
      </div>}
    </div>

    {editing&&<div style={{position:"fixed",inset:0,background:"rgba(0,0,0,.55)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:9999}} onClick={()=>setEditing(null)}>
      <div style={{background:"#fff",borderRadius:14,padding:"1.75rem",width:500,maxWidth:"94vw",color:"#1a1a1a",maxHeight:"90vh",overflowY:"auto"}} onClick={e=>e.stopPropagation()}>
        <div style={{fontSize:17,fontWeight:800,marginBottom:"1rem"}}>{editing.id?"Modifier le parcours":"Nouveau parcours"}</div>
        <Input label="Titre" value={editing.title||""} onChange={e=>setEditing(s=>({...s,title:e.target.value}))} placeholder="Parcours Sécurité au travail"/>
        <div style={{marginBottom:10}}>
          <label style={{fontSize:12,color:"#444",fontWeight:700,display:"block",marginBottom:4}}>Description</label>
          <textarea value={editing.description||""} onChange={e=>setEditing(s=>({...s,description:e.target.value}))} rows={2}
            style={{width:"100%",border:"1.5px solid #D0D0D0",borderRadius:8,padding:"7px 10px",fontSize:13,background:"#fff",resize:"vertical",fontFamily:"inherit",outline:"none"}}/>
        </div>
        <Input label="Prix HT (centimes, 0 = gratuit)" type="number" min="0" value={editing.priceCents??0} onChange={e=>setEditing(s=>({...s,priceCents:e.target.value}))}/>
        <label style={{display:"flex",alignItems:"center",gap:8,fontSize:13,marginBottom:14,cursor:"pointer"}}>
          <input type="checkbox" checked={editing.published||false} onChange={e=>setEditing(s=>({...s,published:e.target.checked}))} style={{accentColor:"#CC1515"}}/>
          Parcours publié (visible dans le catalogue)
        </label>
        <div style={{marginBottom:"1rem"}}>
          <div style={{fontSize:12,fontWeight:700,color:"#444",marginBottom:8}}>Modules du parcours <span style={{color:"#aaa",fontWeight:400}}>(cliquez pour sélectionner, dans l'ordre)</span></div>
          <div style={{display:"flex",flexDirection:"column",gap:4,maxHeight:220,overflowY:"auto",border:"1px solid #EBEBEB",borderRadius:8,padding:".5rem"}}>
            {modules.filter(m=>m.published).map(m=>{
              const sel=(editing.moduleIds||[]).includes(m.id);
              const pos=sel?(editing.moduleIds||[]).indexOf(m.id)+1:null;
              return <div key={m.id} onClick={()=>setEditing(s=>{
                const ids=s.moduleIds||[];
                return {...s,moduleIds:sel?ids.filter(id=>id!==m.id):[...ids,m.id]};
              })} style={{display:"flex",alignItems:"center",gap:8,padding:"6px 10px",borderRadius:7,cursor:"pointer",background:sel?"#EEF2FF":"#fff",border:`1px solid ${sel?"#C5CFF5":"transparent"}`}}>
                <span style={{width:20,height:20,borderRadius:5,background:sel?"#3B5BDB":"#E8E8E8",color:sel?"#fff":"#aaa",display:"flex",alignItems:"center",justifyContent:"center",fontSize:10,fontWeight:800,flexShrink:0}}>{sel?pos:"·"}</span>
                <span style={{fontSize:12,flex:1}}>{m.title.slice(0,50)}</span>
                <span style={{fontSize:10,color:"#aaa"}}>{m.category}</span>
              </div>;
            })}
          </div>
          {(editing.moduleIds||[]).length>0&&<div style={{fontSize:11,color:"#3B5BDB",marginTop:6}}>
            {(editing.moduleIds||[]).length} module(s) sélectionné(s)
          </div>}
        </div>
        <div style={{display:"flex",gap:8}}>
          <BtnG onClick={()=>setEditing(null)} style={{flex:1}}>Annuler</BtnG>
          <BtnR onClick={savePath} style={{flex:2,opacity:savingPath?.6:1}}>{savingPath?"Enregistrement…":"Enregistrer"}</BtnR>
        </div>
      </div>
    </div>}
  </div>;
}

function BannersAdmin({api}){
  const [banners,setBanners]=useState([]);
  const [loading,setLoading]=useState(true);
  const [editing,setEditing]=useState(null); // {} = création, objet = édition
  const [uploadingId,setUploadingId]=useState(null);

  function load(){
    setLoading(true);
    api.get("/api/banners/admin/all").then(d=>setBanners(d.banners)).catch(()=>{}).finally(()=>setLoading(false));
  }
  useEffect(()=>{ load(); },[]);

  async function save(form){
    try{
      if(form.id) await api.put(`/api/banners/admin/${form.id}`,form);
      else await api.post("/api/banners/admin",form);
      setEditing(null);
      load();
    }catch(err){ alert(err.message||"Erreur lors de l'enregistrement."); }
  }
  async function remove(id){
    if(!confirm("Supprimer cette bannière ?")) return;
    try{ await api.del(`/api/banners/admin/${id}`); load(); }
    catch(err){ alert(err.message||"Erreur lors de la suppression."); }
  }
  async function uploadImage(id,file){
    if(!file) return;
    setUploadingId(id);
    try{
      const form=new FormData();
      form.append("file",file);
      await api.postForm(`/api/banners/admin/${id}/image`,form);
      load();
    }catch(err){ alert(err.message||"Échec de l'envoi de l'image."); }
    finally{ setUploadingId(null); }
  }
  async function removeImage(id){
    try{ await api.del(`/api/banners/admin/${id}/image`); load(); }
    catch(err){ alert(err.message||"Erreur."); }
  }
  async function toggleActive(b){
    try{ await api.put(`/api/banners/admin/${b.id}`,{active:!b.active}); load(); }
    catch(err){ alert(err.message||"Erreur."); }
  }

  const card={background:"#fff",border:"1px solid #EBEBEB",borderRadius:10,padding:"1.125rem"};

  return <div style={{display:"flex",flexDirection:"column",gap:"1rem"}}>
    <div style={card}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:".875rem"}}>
        <div style={{fontWeight:700,color:"#1a1a1a"}}>Bandeaux d'annonce</div>
        <BtnR onClick={()=>setEditing({text:"",backgroundColor:"#CC1515",textColor:"#FFFFFF",showOnHome:true,showOnCatalog:false,showOnDashboard:false,active:true})} style={{fontSize:11,padding:"5px 12px"}}>+ Nouveau bandeau</BtnR>
      </div>
      <p style={{fontSize:12,color:"#666",lineHeight:1.6,marginBottom:"1rem"}}>Affichez un message ou une promo en haut de l'accueil, du catalogue et/ou de l'espace personnel des utilisateurs. Plusieurs bandeaux actifs ciblant la même page s'affichent les uns sous les autres.</p>
      {loading?<div style={{color:"#aaa",fontSize:13}}>Chargement…</div>:
      banners.length===0?<div style={{color:"#aaa",fontSize:13}}>Aucun bandeau configuré.</div>:
      <div style={{display:"flex",flexDirection:"column",gap:8}}>
        {banners.map(b=>
          <div key={b.id} style={{border:"1px solid #EBEBEB",borderRadius:8,padding:".875rem"}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",gap:10,flexWrap:"wrap"}}>
              <div style={{display:"flex",alignItems:"center",gap:10}}>
                <div style={{width:60,height:30,borderRadius:6,background:b.backgroundColor,color:b.textColor,display:"flex",alignItems:"center",justifyContent:"center",fontSize:9,fontWeight:700,overflow:"hidden",flexShrink:0}}>Aa</div>
                <div>
                  <div style={{fontSize:13,fontWeight:700,color:"#1a1a1a"}}>{b.text||"(sans texte)"}</div>
                  <div style={{fontSize:11,color:"#888",marginTop:2}}>
                    {[b.showOnHome&&"Accueil",b.showOnCatalog&&"Catalogue",b.showOnDashboard&&"Mon espace"].filter(Boolean).join(" · ")||"Aucune page ciblée"}
                    {!b.active&&" · désactivé"}
                  </div>
                </div>
              </div>
              <div style={{display:"flex",gap:4,alignItems:"center",flexWrap:"wrap"}}>
                <label style={{fontSize:10,color:"#666",cursor:"pointer",border:"1px solid #DDD",borderRadius:6,padding:"5px 8px"}}>
                  {uploadingId===b.id?"Envoi…":b.hasImage?"Changer image":"+ Image"}
                  <input type="file" accept="image/png,image/jpeg,image/webp,image/svg+xml" onChange={e=>uploadImage(b.id,e.target.files?.[0])} style={{display:"none"}}/>
                </label>
                {b.hasImage&&<BtnG onClick={()=>removeImage(b.id)} style={{fontSize:10}}>Retirer image</BtnG>}
                <BtnG onClick={()=>toggleActive(b)} style={{fontSize:10}}>{b.active?"Désactiver":"Activer"}</BtnG>
                <BtnG onClick={()=>setEditing(b)} style={{fontSize:10}}>✏️</BtnG>
                <BtnG onClick={()=>remove(b.id)} style={{fontSize:10,color:"#CC1515",borderColor:"#FDEAEA"}}>🗑</BtnG>
              </div>
            </div>
          </div>
        )}
      </div>}
    </div>

    {editing&&<div style={{position:"fixed",inset:0,background:"rgba(0,0,0,.55)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:9999}} onClick={()=>setEditing(null)}>
      <div style={{background:"#fff",borderRadius:14,padding:"1.75rem",width:420,maxWidth:"94vw",color:"#1a1a1a",maxHeight:"90vh",overflowY:"auto"}} onClick={e=>e.stopPropagation()}>
        <div style={{fontSize:17,fontWeight:800,marginBottom:"1rem"}}>{editing.id?"Modifier le bandeau":"Nouveau bandeau"}</div>
        <Input label="Texte du message" defaultValue={editing.text} onChange={e=>editing.text=e.target.value}/>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
          <div style={{marginBottom:10}}>
            <label style={{fontSize:12,color:"#444",fontWeight:700,display:"block",marginBottom:4}}>Couleur de fond</label>
            <input type="color" defaultValue={editing.backgroundColor} onChange={e=>editing.backgroundColor=e.target.value} style={{width:"100%",height:38,border:"1.5px solid #D0D0D0",borderRadius:8,cursor:"pointer"}}/>
          </div>
          <div style={{marginBottom:10}}>
            <label style={{fontSize:12,color:"#444",fontWeight:700,display:"block",marginBottom:4}}>Couleur du texte</label>
            <input type="color" defaultValue={editing.textColor} onChange={e=>editing.textColor=e.target.value} style={{width:"100%",height:38,border:"1.5px solid #D0D0D0",borderRadius:8,cursor:"pointer"}}/>
          </div>
        </div>
        <div style={{fontSize:12,color:"#444",fontWeight:700,marginBottom:8}}>Pages d'affichage</div>
        {[["showOnHome","Accueil"],["showOnCatalog","Catalogue"],["showOnDashboard","Mon espace"]].map(([key,label])=>
          <label key={key} style={{display:"flex",alignItems:"center",gap:8,fontSize:13,marginBottom:8,cursor:"pointer"}}>
            <input type="checkbox" defaultChecked={editing[key]} onChange={e=>editing[key]=e.target.checked}/> {label}
          </label>
        )}
        <label style={{display:"flex",alignItems:"center",gap:8,fontSize:13,marginBottom:14,marginTop:6,cursor:"pointer"}}>
          <input type="checkbox" defaultChecked={editing.active!==false} onChange={e=>editing.active=e.target.checked}/> Bandeau actif
        </label>
        <div style={{display:"flex",gap:8}}>
          <BtnG onClick={()=>setEditing(null)} style={{flex:1}}>Annuler</BtnG>
          <BtnR onClick={()=>save(editing)} style={{flex:1}}>Enregistrer</BtnR>
        </div>
      </div>
    </div>}
  </div>;
}

function PromotionsAdmin({api}){
  const [promotions,setPromotions]=useState([]);
  const [modules,setModules]=useState([]);
  const [loading,setLoading]=useState(true);
  const [editing,setEditing]=useState(null);

  function load(){
    setLoading(true);
    Promise.all([api.get("/api/admin/promotions"),api.get("/api/modules")])
      .then(([p,m])=>{ setPromotions(p.promotions); setModules(m.modules); })
      .catch(()=>{}).finally(()=>setLoading(false));
  }
  useEffect(()=>{ load(); },[]);

  function toLocalInput(iso){
    const d=new Date(iso);
    const pad=n=>String(n).padStart(2,"0");
    return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  }

  async function save(form){
    try{
      const payload={moduleId:form.moduleId,discountPercent:Number(form.discountPercent),startsAt:new Date(form.startsAt).toISOString(),endsAt:new Date(form.endsAt).toISOString()};
      if(form.id) await api.put(`/api/admin/promotions/${form.id}`,payload);
      else await api.post("/api/admin/promotions",payload);
      setEditing(null);
      load();
    }catch(err){ alert(err.message||"Erreur lors de l'enregistrement."); }
  }
  async function remove(id){
    if(!confirm("Supprimer cette promotion ?")) return;
    try{ await api.del(`/api/admin/promotions/${id}`); load(); }
    catch(err){ alert(err.message||"Erreur lors de la suppression."); }
  }
  async function toggleActive(p){
    try{ await api.put(`/api/admin/promotions/${p.id}`,{active:!p.active}); load(); }
    catch(err){ alert(err.message||"Erreur."); }
  }

  const statusInfo={
    live:["En cours","#E8F5E9","#2E7D32"],
    scheduled:["Programmée","#FFF8E1","#E65100"],
    expired:["Terminée","#F5F5F5","#888"],
    disabled:["Désactivée","#F5F5F5","#888"],
  };

  const card={background:"#fff",border:"1px solid #EBEBEB",borderRadius:10,padding:"1.125rem"};
  const now=new Date();
  const defaultStart=toLocalInput(now.toISOString());
  const defaultEnd=toLocalInput(new Date(now.getTime()+7*86400000).toISOString());

  return <div style={card}>
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:".875rem"}}>
      <div style={{fontWeight:700,color:"#1a1a1a"}}>Promotions temporaires</div>
      <BtnR onClick={()=>setEditing({moduleId:modules[0]?.id||"",discountPercent:10,startsAt:defaultStart,endsAt:defaultEnd})} style={{fontSize:11,padding:"5px 12px"}}>+ Nouvelle promotion</BtnR>
    </div>
    <p style={{fontSize:12,color:"#666",lineHeight:1.6,marginBottom:"1rem"}}>Pendant la période définie, le module affiche son prix barré et son prix remisé dans le catalogue et sur sa page, et la remise s'applique automatiquement à l'achat (cumulable avec une éventuelle réduction ambassadeur).</p>
    {loading?<div style={{color:"#aaa",fontSize:13}}>Chargement…</div>:
    promotions.length===0?<div style={{color:"#aaa",fontSize:13}}>Aucune promotion configurée.</div>:
    <table style={{width:"100%",borderCollapse:"collapse",fontSize:13}}>
      <thead><tr>{["Module","Remise","Début","Fin","Statut","Actions"].map(h=><th key={h} style={{textAlign:"left",fontSize:11,color:"#aaa",fontWeight:700,padding:"7px 10px",borderBottom:"1px solid #EBEBEB"}}>{h}</th>)}</tr></thead>
      <tbody>{promotions.map(p=>{
        const [label,bg,color]=statusInfo[p.status];
        return <tr key={p.id}>
          <td style={{padding:"9px 10px",borderBottom:"1px solid #EBEBEB",fontWeight:600,fontSize:12}}>{p.moduleTitle}</td>
          <td style={{padding:"9px 10px",borderBottom:"1px solid #EBEBEB",fontWeight:800,color:"#CC1515"}}>-{p.discountPercent}%</td>
          <td style={{padding:"9px 10px",borderBottom:"1px solid #EBEBEB",fontSize:12,color:"#888"}}>{new Date(p.startsAt).toLocaleString("fr-FR",{dateStyle:"short",timeStyle:"short"})}</td>
          <td style={{padding:"9px 10px",borderBottom:"1px solid #EBEBEB",fontSize:12,color:"#888"}}>{new Date(p.endsAt).toLocaleString("fr-FR",{dateStyle:"short",timeStyle:"short"})}</td>
          <td style={{padding:"9px 10px",borderBottom:"1px solid #EBEBEB"}}><span style={{fontSize:10,fontWeight:700,padding:"2px 9px",borderRadius:20,background:bg,color}}>{label}</span></td>
          <td style={{padding:"9px 10px",borderBottom:"1px solid #EBEBEB"}}><div style={{display:"flex",gap:4}}>
            <BtnG onClick={()=>toggleActive(p)} style={{fontSize:10}}>{p.active?"Désactiver":"Activer"}</BtnG>
            <BtnG onClick={()=>setEditing({id:p.id,moduleId:p.moduleId,discountPercent:p.discountPercent,startsAt:toLocalInput(p.startsAt),endsAt:toLocalInput(p.endsAt)})} style={{fontSize:10}}>✏️</BtnG>
            <BtnG onClick={()=>remove(p.id)} style={{fontSize:10,color:"#CC1515",borderColor:"#FDEAEA"}}>🗑</BtnG>
          </div></td>
        </tr>;
      })}</tbody>
    </table>}

    {editing&&<div style={{position:"fixed",inset:0,background:"rgba(0,0,0,.55)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:9999}} onClick={()=>setEditing(null)}>
      <div style={{background:"#fff",borderRadius:14,padding:"1.75rem",width:380,maxWidth:"94vw",color:"#1a1a1a"}} onClick={e=>e.stopPropagation()}>
        <div style={{fontSize:17,fontWeight:800,marginBottom:"1rem"}}>{editing.id?"Modifier la promotion":"Nouvelle promotion"}</div>
        <div style={{marginBottom:10}}>
          <label style={{fontSize:12,color:"#444",fontWeight:700,display:"block",marginBottom:4}}>Module</label>
          <select defaultValue={editing.moduleId} onChange={e=>editing.moduleId=e.target.value} style={{width:"100%",border:"1.5px solid #D0D0D0",borderRadius:8,padding:"8px 10px",fontSize:13,background:"#fff",color:"#1a1a1a",outline:"none"}}>
            {modules.map(m=><option key={m.id} value={m.id}>{m.title.substring(0,50)}</option>)}
          </select>
        </div>
        <Input label="Remise (%)" type="number" step="0.5" min="0.5" max="95" defaultValue={editing.discountPercent} onChange={e=>editing.discountPercent=e.target.value}/>
        <Input label="Début" type="datetime-local" defaultValue={editing.startsAt} onChange={e=>editing.startsAt=e.target.value}/>
        <Input label="Fin" type="datetime-local" defaultValue={editing.endsAt} onChange={e=>editing.endsAt=e.target.value}/>
        <div style={{display:"flex",gap:8,marginTop:6}}>
          <BtnG onClick={()=>setEditing(null)} style={{flex:1}}>Annuler</BtnG>
          <BtnR onClick={()=>save(editing)} style={{flex:1}}>Enregistrer</BtnR>
        </div>
      </div>
    </div>}
  </div>;
}

// Formate un nombre de secondes en durée lisible (mm:ss ou h:mm:ss)
function fmtSec(s){
  if(!s&&s!==0) return "—";
  const h=Math.floor(s/3600),m=Math.floor((s%3600)/60),sec=s%60;
  if(h>0) return `${h}h ${m.toString().padStart(2,"0")}m`;
  if(m>0) return `${m}m ${sec.toString().padStart(2,"0")}s`;
  return `${sec}s`;
}

// Barre de progression colorée avec seuil
function ProgressBar({value,max=100,color="#CC1515",height=6}){
  const pct=max>0?Math.min(100,Math.round((value/max)*100)):0;
  return <div style={{background:"#F0F0F0",borderRadius:4,height,overflow:"hidden"}}>
    <div style={{width:pct+"%",background:color,height:"100%",borderRadius:4,transition:"width .3s"}}/>
  </div>;
}

// Pastille colorée selon la valeur (vert > 75%, orange 50-75%, rouge < 50%)
function RateBadge({rate}){
  const bg=rate>=75?"#E8F5E9":rate>=50?"#FFF8E1":"#FDEAEA";
  const co=rate>=75?"#2E7D32":rate>=50?"#E65100":"#CC1515";
  return <span style={{background:bg,color:co,fontSize:10,fontWeight:800,padding:"2px 8px",borderRadius:20}}>{rate}%</span>;
}

function PedagogicalDashboard({api,user}){
  const [overview,setOverview]=useState(null);
  const [allMods,setAllMods]=useState([]);
  const [selModId,setSelModId]=useState(null);
  const [modAnalytics,setModAnalytics]=useState(null);
  const [loadingOverview,setLoadingOverview]=useState(true);
  const [loadingMod,setLoadingMod]=useState(false);
  const [applyingDuration,setApplyingDuration]=useState(false);
  const [appliedMsg,setAppliedMsg]=useState("");
  const isMobile=useIsMobile();
  const card={background:"#fff",border:"1px solid #EBEBEB",borderRadius:10,padding:"1.125rem",marginBottom:"1rem"};

  useEffect(()=>{
    setLoadingOverview(true);
    Promise.all([api.get("/api/analytics/overview"),api.get("/api/analytics/modules")])
      .then(([ov,mods])=>{ setOverview(ov); setAllMods(mods.modules); })
      .catch(()=>{})
      .finally(()=>setLoadingOverview(false));
  },[]);

  useEffect(()=>{
    if(!selModId){ setModAnalytics(null); return; }
    setLoadingMod(true);
    api.get(`/api/analytics/modules/${selModId}`)
      .then(setModAnalytics).catch(()=>{}).finally(()=>setLoadingMod(false));
  },[selModId]);

  async function applyDuration(){
    if(!modAnalytics||!selModId) return;
    const mins=modAnalytics.suggestedDurationMin;
    setApplyingDuration(true);
    try{
      await api.put(`/api/modules/${selModId}`,{durationMin:mins});
      setAppliedMsg(`✅ Durée mise à jour : ${mins} min`);
      setTimeout(()=>setAppliedMsg(""),3000);
    }catch(err){ setAppliedMsg("⚠️ "+err.message); }
    finally{ setApplyingDuration(false); }
  }

  const TYPE_COLORS={video:"#2E7D32",video_ext:"#C2185B",doc:"#0277BD",qcm:"#E65100",text:"#7B1FA2",link:"#555"};
  const TYPE_ICONS={video:"🎬",video_ext:"📺",doc:"📄",qcm:"✅",text:"📝",link:"🔗"};

  return <div>
    {/* ── KPIs plateforme ── */}
    {loadingOverview?<div style={{color:"#aaa",fontSize:13,padding:"2rem",textAlign:"center"}}>Chargement des statistiques…</div>:
    overview&&<div style={{display:"grid",gridTemplateColumns:`repeat(${isMobile?2:4},1fr)`,gap:".75rem",marginBottom:"1.25rem"}}>
      {[
        {ic:"👥",v:overview.learners,l:"Apprenants",s:`${overview.activeLast30d} actifs ce mois`},
        {ic:"📚",v:overview.publishedModules,l:"Modules publiés",s:`${overview.totalEnrollments} inscriptions`},
        {ic:"📈",v:overview.completionRate+"%",l:"Taux de complétion",s:`${overview.completedEnrollments} / ${overview.totalEnrollments}`},
        {ic:"⏱",v:fmtSec(overview.avgTimePerContentSec),l:"Temps moyen / contenu",s:"Toutes formations"},
      ].map(k=><div key={k.l} style={{background:"#fff",border:"1px solid #EBEBEB",borderRadius:10,padding:".875rem"}}>
        <div style={{fontSize:22,marginBottom:4}}>{k.ic}</div>
        <div style={{fontWeight:800,fontSize:isMobile?18:22,color:"#1a1a1a"}}>{k.v}</div>
        <div style={{fontSize:11,fontWeight:700,color:"#555"}}>{k.l}</div>
        <div style={{fontSize:10,color:"#aaa",marginTop:2}}>{k.s}</div>
      </div>)}
    </div>}

    {/* ── Vue d'ensemble tous modules ── */}
    <div style={card}>
      <div style={{fontWeight:700,fontSize:15,color:"#1a1a1a",marginBottom:".875rem"}}>Vue d'ensemble par module</div>
      {allMods.length===0?<div style={{color:"#aaa",fontSize:13}}>Aucune donnée disponible — les analytics apparaîtront dès qu'il y aura des apprenants inscrits.</div>:
      <div style={{overflowX:"auto"}}>
        <table style={{width:"100%",borderCollapse:"collapse",fontSize:12}}>
          <thead><tr>
            {["Module","Inscrits","Taux complétion","Tps moy/contenu","Contenu","Analyser"].map(h=>
              <th key={h} style={{textAlign:"left",fontSize:10,color:"#aaa",fontWeight:700,padding:"6px 8px",borderBottom:"1px solid #EBEBEB",whiteSpace:"nowrap"}}>{h}</th>)}
          </tr></thead>
          <tbody>{allMods.map(m=><tr key={m.id} style={{background:selModId===m.id?"#FDEAEA":"transparent"}}>
            <td style={{padding:"8px",borderBottom:"1px solid #F5F5F5",fontWeight:600,maxWidth:180}}>
              <div style={{overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{m.title}</div>
              <div style={{fontSize:10,color:"#aaa"}}>{m.category}</div>
            </td>
            <td style={{padding:"8px",borderBottom:"1px solid #F5F5F5",textAlign:"center"}}>{m.enrolled}</td>
            <td style={{padding:"8px",borderBottom:"1px solid #F5F5F5"}}>
              <div style={{display:"flex",alignItems:"center",gap:6}}>
                <ProgressBar value={m.completionRate} color={m.completionRate>=75?"#2E7D32":m.completionRate>=50?"#E65100":"#CC1515"}/>
                <span style={{fontSize:11,fontWeight:700,color:"#555",flexShrink:0}}>{m.completionRate}%</span>
              </div>
            </td>
            <td style={{padding:"8px",borderBottom:"1px solid #F5F5F5",color:"#555",whiteSpace:"nowrap"}}>
              {m.avgContentSec?fmtSec(m.avgContentSec):"—"}
            </td>
            <td style={{padding:"8px",borderBottom:"1px solid #F5F5F5",color:"#aaa"}}>{m.contentCount}</td>
            <td style={{padding:"8px",borderBottom:"1px solid #F5F5F5"}}>
              <button onClick={()=>setSelModId(s=>s===m.id?null:m.id)}
                style={{border:"1px solid #CC1515",background:selModId===m.id?"#CC1515":"#fff",color:selModId===m.id?"#fff":"#CC1515",borderRadius:6,padding:"4px 10px",fontSize:11,cursor:"pointer",fontWeight:700}}>
                {selModId===m.id?"Masquer":"📊 Détail"}
              </button>
            </td>
          </tr>)}</tbody>
        </table>
      </div>}
    </div>

    {/* ── Analyse détaillée d'un module ── */}
    {selModId&&<div style={card}>
      {loadingMod?<div style={{color:"#aaa",fontSize:13,padding:"1rem",textAlign:"center"}}>Chargement de l'analyse…</div>:
      modAnalytics&&<>
        {/* En-tête avec KPIs du module */}
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",flexWrap:"wrap",gap:12,marginBottom:"1.25rem"}}>
          <div>
            <div style={{fontWeight:800,fontSize:16,color:"#1a1a1a",marginBottom:4}}>
              Analyse pédagogique — {allMods.find(m=>m.id===selModId)?.title}
            </div>
            <div style={{display:"flex",gap:"1.5rem",flexWrap:"wrap"}}>
              {[
                ["👥","Inscrits",modAnalytics.enrolled],
                ["🏆","Terminé",`${modAnalytics.completed} (${modAnalytics.completionRate}%)`],
                ["⏱","Temps estimé",fmtSec(modAnalytics.totalEstimatedSec)],
              ].map(([ic,l,v])=><div key={l}><div style={{fontSize:10,color:"#aaa",fontWeight:700}}>{ic} {l}</div><div style={{fontSize:14,fontWeight:800,color:"#1a1a1a"}}>{v}</div></div>)}
            </div>
          </div>
          <div style={{background:"#FFF8E1",border:"1px solid #FFE082",borderRadius:10,padding:".875rem",minWidth:200}}>
            <div style={{fontSize:11,color:"#E65100",fontWeight:700,marginBottom:4}}>💡 Durée suggérée</div>
            <div style={{fontSize:22,fontWeight:800,color:"#1a1a1a"}}>{modAnalytics.suggestedDurationMin} min</div>
            <div style={{fontSize:10,color:"#888",marginBottom:8}}>Basée sur les temps réels mesurés</div>
            <div style={{fontSize:10,color:"#555",marginBottom:8}}>
              Durée actuelle : <strong>{allMods.find(m=>m.id===selModId)?.durationMin} min</strong>
              {modAnalytics.suggestedDurationMin!==allMods.find(m=>m.id===selModId)?.durationMin&&
                <span style={{color:"#CC1515",marginLeft:4}}>⚠ différente</span>}
            </div>
            <button onClick={applyDuration} disabled={applyingDuration}
              style={{background:"#CC1515",color:"#fff",border:"none",borderRadius:7,padding:"7px 14px",fontSize:12,cursor:"pointer",fontWeight:700,width:"100%",opacity:applyingDuration?.6:1}}>
              {applyingDuration?"Application…":"Appliquer cette durée"}
            </button>
            {appliedMsg&&<div style={{fontSize:11,marginTop:6,color:"#2E7D32",fontWeight:600}}>{appliedMsg}</div>}
          </div>
        </div>

        {/* Taux de décrochage par chapitre */}
        {modAnalytics.enrolled>0&&modAnalytics.chapters.some(c=>c.dropOffPercent>0)&&<div style={{background:"#FFF8F8",border:"1px solid #FDEAEA",borderRadius:9,padding:".875rem",marginBottom:"1.25rem"}}>
          <div style={{fontWeight:700,fontSize:13,color:"#CC1515",marginBottom:8}}>⚠️ Points de décrochage détectés</div>
          {modAnalytics.chapters.filter(c=>c.dropOffPercent>20).map(ch=><div key={ch.title} style={{display:"flex",alignItems:"center",gap:10,marginBottom:6}}>
            <div style={{flex:1,fontSize:12,color:"#555"}}>{ch.title}</div>
            <div style={{fontSize:11,fontWeight:700,color:"#CC1515"}}>{ch.dropOffPercent}% d'abandon</div>
            <ProgressBar value={ch.dropOffPercent} color="#CC1515"/>
          </div>)}
        </div>}

        {/* Tableau détaillé par contenu */}
        <div style={{fontWeight:700,fontSize:14,color:"#1a1a1a",marginBottom:".875rem"}}>
          Temps passé par contenu
          {modAnalytics.enrolled===0&&<span style={{fontSize:11,fontWeight:400,color:"#aaa",marginLeft:8}}>— Aucune donnée (aucun apprenant inscrit)</span>}
        </div>
        <div style={{overflowX:"auto"}}>
          <table style={{width:"100%",borderCollapse:"collapse",fontSize:12}}>
            <thead><tr>
              {["Type","Contenu","Chapitre","Vues","Complétion","Temps moyen","Min","Max","Médiane"].map(h=>
                <th key={h} style={{textAlign:"left",fontSize:10,color:"#aaa",fontWeight:700,padding:"6px 8px",borderBottom:"2px solid #EBEBEB",whiteSpace:"nowrap"}}>{h}</th>)}
            </tr></thead>
            <tbody>
              {modAnalytics.contents.map((c,i)=>{
                // Coloration : rouge si temps moyen >> médiane (apprenants bloqués)
                const isAnomaly=c.avgSec&&c.medianSec&&c.avgSec>c.medianSec*2;
                const isNeverOpened=c.views===0;
                return <tr key={c.id} style={{background:i%2===0?"#FAFAFA":"#fff",opacity:isNeverOpened?.5:1}}>
                  <td style={{padding:"8px",borderBottom:"1px solid #F0F0F0"}}>
                    <span style={{background:TYPE_COLORS[c.type]+"22",color:TYPE_COLORS[c.type],borderRadius:20,padding:"2px 8px",fontSize:10,fontWeight:700}}>
                      {TYPE_ICONS[c.type]} {c.type}
                    </span>
                  </td>
                  <td style={{padding:"8px",borderBottom:"1px solid #F0F0F0",fontWeight:600,maxWidth:160}}>
                    <div style={{overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{c.title||"(sans titre)"}</div>
                  </td>
                  <td style={{padding:"8px",borderBottom:"1px solid #F0F0F0",color:"#888",maxWidth:120}}>
                    <div style={{overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",fontSize:11}}>{c.chapterTitle}</div>
                  </td>
                  <td style={{padding:"8px",borderBottom:"1px solid #F0F0F0",textAlign:"center"}}>{c.views}</td>
                  <td style={{padding:"8px",borderBottom:"1px solid #F0F0F0"}}>
                    {modAnalytics.enrolled>0?<RateBadge rate={c.completionRate}/>:<span style={{color:"#ddd"}}>—</span>}
                  </td>
                  <td style={{padding:"8px",borderBottom:"1px solid #F0F0F0",fontWeight:700,color:isAnomaly?"#CC1515":"#1a1a1a"}}>
                    {fmtSec(c.avgSec)}
                    {isAnomaly&&<span title="Temps anormalement élevé — certains apprenants pourraient être bloqués" style={{marginLeft:4,cursor:"help"}}>⚠️</span>}
                  </td>
                  <td style={{padding:"8px",borderBottom:"1px solid #F0F0F0",color:"#2E7D32"}}>{fmtSec(c.minSec)}</td>
                  <td style={{padding:"8px",borderBottom:"1px solid #F0F0F0",color:"#CC1515"}}>{fmtSec(c.maxSec)}</td>
                  <td style={{padding:"8px",borderBottom:"1px solid #F0F0F0",color:"#555"}}>{fmtSec(c.medianSec)}</td>
                </tr>;
              })}
            </tbody>
            <tfoot><tr>
              <td colSpan={5} style={{padding:"10px 8px",fontSize:12,fontWeight:700,color:"#555",borderTop:"2px solid #EBEBEB"}}>TOTAL</td>
              <td style={{padding:"10px 8px",fontWeight:800,color:"#1a1a1a",borderTop:"2px solid #EBEBEB"}}>
                {fmtSec(modAnalytics.contents.reduce((a,c)=>a+(c.avgSec||0),0))}
              </td>
              <td colSpan={3} style={{padding:"10px 8px",fontSize:11,color:"#888",borderTop:"2px solid #EBEBEB"}}>
                → Soit {modAnalytics.suggestedDurationMin} min estimées
              </td>
            </tr></tfoot>
          </table>
        </div>

        {/* Légende */}
        <div style={{marginTop:"1rem",padding:".75rem",background:"#F8F8F8",borderRadius:8,fontSize:11,color:"#777",lineHeight:1.8}}>
          <strong>Guide de lecture :</strong> Le <em>temps moyen</em> inclut toutes les sessions. La <em>médiane</em> est moins sensible aux valeurs extrêmes — préférez-la pour estimer la durée réelle. Une icône ⚠️ signale qu'un contenu a un temps moyen {'>'} 2× la médiane (apprenants potentiellement bloqués ou distraits). La durée suggérée est la somme des médianes (ou moyennes si médiane absente) de chaque contenu.
        </div>
      </>}
    </div>}
  </div>;
}

function AdminDash({api,user}){
  const [st,setSt]=useState("dashboard");
  const isMobile=useIsMobile();
  const tabs=[{k:"dashboard",l:"Tableau de bord",ic:"🏠"},{k:"users",l:"Utilisateurs",ic:"👥"},{k:"access",l:"Accès formations",ic:"⏳"},{k:"modules",l:"Modules",ic:"📚"},{k:"paths",l:"Parcours",ic:"🗺️"},{k:"promotions",l:"Promotions",ic:"🔥"},{k:"banners",l:"Bandeaux",ic:"📣"},{k:"credits",l:"Lots de crédits",ic:"💳"},{k:"vat",l:"TVA",ic:"🧾"},{k:"referral",l:"Ambassadeur",ic:"🎁"},{k:"certificate",l:"Attestations",ic:"🏆"},{k:"transfers",l:"Paiements à valider",ic:"🏦"},{k:"sessions",l:"Sessions",ic:"📅"},{k:"stats",l:"Statistiques",ic:"📊"},{k:"settings",l:"Paramètres",ic:"⚙️"}];
  const card={background:"#fff",border:"1px solid #EBEBEB",borderRadius:10,padding:"1.125rem"};
  return <div style={{maxWidth:1100,margin:"0 auto",width:"100%",padding:isMobile?"1.25rem .75rem":"1.75rem 1.25rem"}}>
    <div style={{marginBottom:"1.25rem"}}><div style={{fontSize:22,fontWeight:800,color:"#1a1a1a"}}>Espace Administrateur</div><div style={{fontSize:13,color:"#888",marginTop:3}}>Gestion complète de la plateforme TutoRisk LCMS</div></div>
    <div style={{display:"grid",gridTemplateColumns:isMobile?"1fr":"200px 1fr",gap:"1.25rem"}}>
      <Sidebar items={tabs} active={st} setActive={setSt}/>
      <div>
        {st==="dashboard"&&<PedagogicalDashboard api={api} user={user}/>}
        {st==="users"&&<UsersAdmin api={api} currentUserId={user.id}/>}
        {st==="access"&&<AccessAdmin api={api}/>}
        {st==="modules"&&<ModuleEditor api={api} user={user}/>}
        {st==="credits"&&<CreditPackAdmin api={api}/>}
        {st==="vat"&&<VatAdmin api={api}/>}
        {st==="referral"&&<ReferralAdmin api={api}/>}
        {st==="paths"&&<PathsAdmin api={api} user={user}/>}
        {st==="promotions"&&<PromotionsAdmin api={api}/>}
        {st==="banners"&&<BannersAdmin api={api}/>}
        {st==="certificate"&&<CertificateAdmin api={api}/>}
        {st==="transfers"&&<PendingTransfersAdmin api={api}/>}
        {st==="stats"&&<>
          <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(130px,1fr))",gap:".875rem",marginBottom:"1.25rem"}}>
            <Metric icon="💰" label="CA mensuel" value="12 480 €" sub="Ce mois"/>
            <Metric icon="📈" label="Taux complétion" value="76%" sub="Tous modules"/>
            <Metric icon="⏱" label="Temps moyen" value="82 min" sub="vs 90 min prévu"/>
            <Metric icon="⭐" label="NPS Apprenant" value="72" sub="Excellent"/>
          </div>
          <div style={card}>
            <div style={{fontWeight:700,marginBottom:".875rem",color:"#1a1a1a"}}>Progression par module</div>
            {MODULES.slice(0,6).map((m,i)=>{const p=[78,65,82,71,69,88][i];return <div key={m.id} style={{marginBottom:".875rem"}}><div style={{display:"flex",justifyContent:"space-between",fontSize:12,marginBottom:4,color:"#333"}}><span>{m.title.substring(0,44)}…</span><span style={{color:"#CC1515",fontWeight:700}}>{p}%</span></div><PB value={p}/></div>;})}
          </div>
        </>}
        {(st==="sessions"||st==="settings")&&<div style={card}><div style={{background:"#E3F2FD",color:"#0277BD",border:"1px solid #90CAF9",borderRadius:7,padding:".75rem",fontSize:13,marginBottom:".875rem"}}>ℹ️ Section disponible dans la version de production.</div><p style={{fontSize:13,color:"#555",lineHeight:1.7}}>{st==="sessions"?"Planifiez des sessions, affectez des formateurs, inscrivez des apprenants et suivez l'avancement en temps réel.":"Personnalisez l'identité visuelle, configurez Stripe, gérez les forfaits et administrez les intégrations SIRH."}</p></div>}
      </div>
    </div>
  </div>;
}

// ─────────────────────────────────────────────────────────────
// ModuleEditor — éditeur complet de module de formation
// Utilisé par PedagogueDash et l'onglet "Modules" d'AdminDash.
// Gère : métadonnées, chapitres, contenus (vidéo/doc/lien/QCM),
// upload de fichiers, réordonnancement — entièrement mobile-first.
// ─────────────────────────────────────────────────────────────

const CONTENT_TYPE_META={
  video:     {icon:"🎬",label:"Vidéo (upload)",bg:"#E8F5E9",color:"#2E7D32",accept:"video/mp4,video/webm,video/ogg,video/quicktime"},
  video_ext: {icon:"📺",label:"Vidéo externe",bg:"#FCE4EC",color:"#C2185B",accept:null},
  doc:       {icon:"📄",label:"Document / PDF",bg:"#E3F2FD",color:"#0277BD",accept:"application/pdf,.doc,.docx,.txt"},
  text:      {icon:"📝",label:"Texte enrichi",bg:"#F3E5F5",color:"#7B1FA2",accept:null},
  qcm:       {icon:"✅",label:"QCM",bg:"#FFF8E1",color:"#E65100",accept:null},
  link:      {icon:"🔗",label:"Lien externe",bg:"#F3E5F5",color:"#7B1FA2",accept:null},
};

// ─── Éditeur de texte enrichi (WYSIWYG) ──────────────────────
// Barre d'outils : Titres H2/H3, gras, italique, souligné,
// liste à puces, liste numérotée, séparateur horizontal.
// Stocké en HTML (innerHTML du div contentEditable), sauvegardé sur le
// serveur via PUT /api/modules/contents/:id/text.
function RichTextEditor({contentId,api,initialHtml,onSaved}){
  const editorRef=useRef(null);
  const [saving,setSaving]=useState(false);
  const [saved,setSaved]=useState(false);
  const [error,setError]=useState("");

  useEffect(()=>{
    if(editorRef.current&&initialHtml!==undefined){
      editorRef.current.innerHTML=initialHtml||"";
    }
  },[]);

  async function save(){
    const html=editorRef.current?.innerHTML||"";
    setSaving(true); setError(""); setSaved(false);
    try{
      await api.put(`/api/modules/contents/${contentId}/text`,{contentText:html});
      setSaved(true);
      setTimeout(()=>setSaved(false),2000);
      onSaved?.();
    }catch(err){ setError(err.message||"Erreur lors de l'enregistrement."); }
    finally{ setSaving(false); }
  }

  const ToolBar=()=>{
    const btn=(label,cmd,val,title)=><button
      key={label}
      title={title||label}
      onMouseDown={e=>{e.preventDefault(); document.execCommand(cmd,false,val||null);}}
      style={{border:"1px solid #E0E0E0",background:"#fff",borderRadius:5,padding:"4px 9px",fontSize:12,cursor:"pointer",fontWeight:600,color:"#444",lineHeight:1}}>
      {label}
    </button>;
    return <div style={{display:"flex",gap:3,padding:"6px 8px",background:"#F8F8F8",borderBottom:"1px solid #E8E8E8",flexWrap:"wrap",alignItems:"center"}}>
      {btn("H2","formatBlock","h2","Titre 2")}
      {btn("H3","formatBlock","h3","Titre 3")}
      {btn("¶","formatBlock","p","Paragraphe")}
      <div style={{width:1,background:"#DDD",margin:"2px 3px",alignSelf:"stretch"}}/>
      {btn("G","bold",null,"Gras (Ctrl+B)")}
      {btn("I","italic",null,"Italique (Ctrl+I)")}
      {btn("S","underline",null,"Souligné (Ctrl+U)")}
      <div style={{width:1,background:"#DDD",margin:"2px 3px",alignSelf:"stretch"}}/>
      {btn("• Liste","insertUnorderedList",null,"Liste à puces")}
      {btn("1. Liste","insertOrderedList",null,"Liste numérotée")}
      {btn("—","insertHorizontalRule",null,"Séparateur")}
    </div>;
  };

  return <div style={{border:"1.5px solid #D0D0D0",borderRadius:8,overflow:"hidden",background:"#fff"}}>
    <ToolBar/>
    <div ref={editorRef} contentEditable suppressContentEditableWarning
      style={{minHeight:160,padding:"12px 14px",fontSize:14,lineHeight:1.75,color:"#1a1a1a",outline:"none"}}/>
    {error&&<div style={{fontSize:11,color:"#CC1515",padding:"4px 14px",fontWeight:600}}>{error}</div>}
    <div style={{padding:"8px 12px",borderTop:"1px solid #F0F0F0",display:"flex",alignItems:"center",gap:10}}>
      <BtnR onClick={save} style={{fontSize:12,padding:"7px 14px",opacity:saving?.6:1}}>{saving?"Enregistrement…":"💾 Enregistrer le texte"}</BtnR>
      {saved&&<span style={{fontSize:12,color:"#2E7D32",fontWeight:600}}>✅ Enregistré</span>}
    </div>
  </div>;
}

function QcmEditor({contentId,api,initialQuestion,onSaved}){
  const [q,setQ]=useState(initialQuestion?.question_text||initialQuestion?.text||"");
  const [explanation,setExplanation]=useState(initialQuestion?.explanation_text||initialQuestion?.explanationText||"");
  const [opts,setOpts]=useState(
    initialQuestion?.options?.map(o=>({text:o.option_text||o.text,isCorrect:o.is_correct||o.isCorrect}))
    ||[{text:"",isCorrect:true},{text:"",isCorrect:false}]
  );
  const [saving,setSaving]=useState(false);
  const [error,setError]=useState("");

  function setOpt(i,key,val){ setOpts(o=>o.map((x,j)=>j===i?{...x,[key]:val}:key==="isCorrect"?{...x,isCorrect:false}:x)); }
  function addOpt(){ if(opts.length<6) setOpts(o=>[...o,{text:"",isCorrect:false}]); }
  function removeOpt(i){ if(opts.length>2) setOpts(o=>o.filter((_,j)=>j!==i)); }

  async function save(){
    if(!q.trim()){ setError("La question ne peut pas être vide."); return; }
    if(!opts.some(o=>o.isCorrect)){ setError("Cochez au moins une bonne réponse."); return; }
    if(opts.some(o=>!o.text.trim())){ setError("Toutes les options doivent avoir un texte."); return; }
    setSaving(true); setError("");
    try{
      const payload={questionText:q.trim(),explanationText:explanation.trim()||null,options:opts.map(o=>({optionText:o.text.trim(),isCorrect:o.isCorrect}))};
      const data=initialQuestion
        ?await api.put(`/api/modules/qcm/questions/${initialQuestion.id}`,payload)
        :await api.post(`/api/modules/contents/${contentId}/qcm`,payload);
      onSaved?.(data.question);
    }catch(err){ setError(err.message||"Erreur lors de l'enregistrement."); }
    finally{ setSaving(false); }
  }

  return <div style={{padding:".875rem",background:"#FFFDF0",borderRadius:8,border:"1px solid #FFE082"}}>
    <div style={{fontWeight:700,fontSize:12,color:"#E65100",marginBottom:8}}>✅ Éditeur de question QCM</div>
    <Input label="Question" value={q} onChange={e=>setQ(e.target.value)} placeholder="Ex : Quel équipement est obligatoire ?"/>
    <div style={{marginBottom:10}}>
      <label style={{fontSize:12,color:"#444",fontWeight:700,display:"block",marginBottom:4}}>Explication (affichée après réponse) <span style={{color:"#aaa",fontWeight:400}}>facultatif</span></label>
      <textarea value={explanation} onChange={e=>setExplanation(e.target.value)} placeholder="Ex : Le port du casque est obligatoire car il protège des chutes d'objets." rows={2}
        style={{width:"100%",border:"1.5px solid #D0D0D0",borderRadius:8,padding:"7px 10px",fontSize:12,background:"#fff",color:"#1a1a1a",outline:"none",resize:"vertical",fontFamily:"inherit"}}/>
    </div>
    <div style={{fontSize:12,fontWeight:700,color:"#444",marginBottom:6}}>Options de réponse <span style={{fontWeight:400,color:"#aaa"}}>(cochez la ou les bonnes réponses)</span></div>
    {opts.map((o,i)=><div key={i} style={{display:"flex",gap:6,alignItems:"center",marginBottom:6}}>
      <input type="checkbox" checked={o.isCorrect} onChange={e=>setOpt(i,"isCorrect",e.target.checked)} style={{accentColor:"#CC1515",flexShrink:0,width:16,height:16}}/>
      <input value={o.text} onChange={e=>setOpt(i,"text",e.target.value)} placeholder={`Option ${i+1}`}
        style={{flex:1,border:"1.5px solid #E0E0E0",borderRadius:7,padding:"7px 10px",fontSize:13,background:"#fff",color:"#1a1a1a",outline:"none"}}/>
      {opts.length>2&&<button onClick={()=>removeOpt(i)} style={{background:"none",border:"none",color:"#aaa",cursor:"pointer",fontSize:16,padding:"0 2px"}}>✕</button>}
    </div>)}
    {opts.length<6&&<BtnG onClick={addOpt} style={{fontSize:11,marginBottom:8}}>+ Ajouter une option</BtnG>}
    {error&&<div style={{fontSize:11,color:"#CC1515",marginBottom:6,fontWeight:600}}>{error}</div>}
    <BtnR onClick={save} style={{fontSize:12,padding:"7px 14px",opacity:saving?.6:1}}>{saving?"Enregistrement…":"💾 Enregistrer le QCM"}</BtnR>
  </div>;
}

function ContentItem({content,chapterId,api,onRefresh,isMobile}){
  const [uploading,setUploading]=useState(false);
  const [uploadProgress,setUploadProgress]=useState(null);
  const [editingLink,setEditingLink]=useState(false);
  const [linkVal,setLinkVal]=useState(content.externalUrl||"");
  const [editingTitle,setEditingTitle]=useState(false);
  const [titleVal,setTitleVal]=useState(content.title||"");
  const [showQcm,setShowQcm]=useState(false);
  const [qcmData,setQcmData]=useState(null);
  const meta=CONTENT_TYPE_META[content.type];

  async function loadQcm(){
    if(content.type!=="qcm"||qcmData) return;
    try{
      const res=await fetch(`${API_BASE}/api/modules/${encodeURIComponent(content.chapterId||"")}`,{credentials:"include"});
    }catch{/* ignore */}
  }

  async function uploadFile(file){
    if(!file) return;
    setUploading(true); setUploadProgress("Envoi en cours…");
    try{
      const form=new FormData(); form.append("file",file);
      const data=await api.postForm(`/api/modules/contents/${content.id}/upload`,form);
      setUploadProgress(`✅ Fichier chargé (${(data.sizeBytes/1024).toFixed(0)} Ko)`);
      onRefresh?.();
    }catch(err){ setUploadProgress(`⚠️ ${err.message}`); }
    finally{ setUploading(false); }
  }

  async function saveTitle(){
    try{ await api.put(`/api/modules/contents/${content.id}`,{title:titleVal}); setEditingTitle(false); onRefresh?.(); }
    catch(err){ alert(err.message||"Erreur."); }
  }
  async function saveLink(){
    try{ await api.put(`/api/modules/contents/${content.id}`,{externalUrl:linkVal}); setEditingLink(false); onRefresh?.(); }
    catch(err){ alert(err.message||"Erreur."); }
  }
  async function del(){
    if(!confirm("Supprimer ce contenu ?")) return;
    try{ await api.del(`/api/modules/contents/${content.id}`); onRefresh?.(); }
    catch(err){ alert(err.message||"Erreur."); }
  }

  return <div style={{border:"1px solid #EBEBEB",borderRadius:10,padding:".875rem",background:"#fff",marginBottom:6}}>
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",gap:8,flexWrap:"wrap"}}>
      <div style={{display:"flex",gap:8,alignItems:"center",flex:1,minWidth:0}}>
        <div style={{width:32,height:32,borderRadius:7,background:meta.bg,color:meta.color,display:"flex",alignItems:"center",justifyContent:"center",fontSize:16,flexShrink:0}}>{meta.icon}</div>
        {editingTitle
          ?<div style={{display:"flex",gap:6,flex:1}}><input value={titleVal} onChange={e=>setTitleVal(e.target.value)} style={{flex:1,border:"1.5px solid #CC1515",borderRadius:7,padding:"5px 8px",fontSize:13,background:"#fff",outline:"none"}}/><BtnG onClick={saveTitle} style={{fontSize:11}}>✓</BtnG><BtnG onClick={()=>setEditingTitle(false)} style={{fontSize:11}}>✕</BtnG></div>
          :<span style={{fontSize:13,fontWeight:600,color:"#1a1a1a",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",flex:1,cursor:"pointer"}} onClick={()=>setEditingTitle(true)}>{content.title||meta.label} <span style={{fontSize:10,color:"#aaa"}}>✏️</span></span>}
      </div>
      <BtnG onClick={del} style={{fontSize:11,color:"#CC1515",borderColor:"#FDEAEA",flexShrink:0}}>🗑</BtnG>
    </div>
    <div style={{marginTop:8}}>
      {(content.type==="video"||content.type==="doc")&&<>
        {content.hasFile
          ?<div style={{fontSize:11,color:"#2E7D32",fontWeight:600,marginBottom:6}}>✅ Fichier chargé</div>
          :<div style={{fontSize:11,color:"#E65100",marginBottom:6}}>⚠️ Aucun fichier — importez un fichier ci-dessous</div>}
        <label style={{display:"flex",alignItems:"center",gap:8,cursor:"pointer",border:"2px dashed #D0D0D0",borderRadius:8,padding:"10px 14px",background:"#FAFAFA",fontSize:12}}>
          <span>{uploading?"⏳ Envoi…":"⬆️ Sélectionner un fichier"}</span>
          <input type="file" accept={meta.accept} disabled={uploading} onChange={e=>uploadFile(e.target.files?.[0])} style={{display:"none"}}/>
        </label>
        {uploadProgress&&<div style={{fontSize:11,marginTop:4,color:"#555"}}>{uploadProgress}</div>}
      </>}
      {content.type==="video_ext"&&<>
        {editingLink
          ?<div style={{display:"flex",gap:6}}>
            <input value={linkVal} onChange={e=>setLinkVal(e.target.value)} placeholder="https://youtu.be/… ou https://vimeo.com/…"
              style={{flex:1,border:"1.5px solid #CC1515",borderRadius:7,padding:"6px 8px",fontSize:12,background:"#fff",outline:"none"}}/>
            <BtnG onClick={saveLink} style={{fontSize:11}}>✓</BtnG>
          </div>
          :<div style={{display:"flex",gap:6,alignItems:"center",flexWrap:"wrap"}}>
            <span style={{fontSize:11,color:"#888",flex:1,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{content.externalUrl||"(URL non définie)"}</span>
            <span style={{fontSize:10,background:"#FCE4EC",color:"#C2185B",borderRadius:20,padding:"2px 7px",fontWeight:700,flexShrink:0}}>
              {content.embed?.platform||"vidéo ext."}
            </span>
            <BtnG onClick={()=>setEditingLink(true)} style={{fontSize:11,flexShrink:0}}>✏️ Modifier</BtnG>
          </div>}
        <div style={{fontSize:11,color:"#888",marginTop:4}}>Accepte : YouTube, youtu.be, Vimeo, Dailymotion, ou URL directe .mp4/.webm</div>
      </>}
      {content.type==="link"&&<>
        {editingLink
          ?<div style={{display:"flex",gap:6}}><input value={linkVal} onChange={e=>setLinkVal(e.target.value)} placeholder="https://…" style={{flex:1,border:"1.5px solid #CC1515",borderRadius:7,padding:"6px 8px",fontSize:12,background:"#fff",outline:"none"}}/><BtnG onClick={saveLink} style={{fontSize:11}}>✓</BtnG></div>
          :<div style={{display:"flex",gap:6,alignItems:"center"}}><span style={{fontSize:12,color:"#888",flex:1,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{content.externalUrl||"(URL non définie)"}</span><BtnG onClick={()=>setEditingLink(true)} style={{fontSize:11}}>✏️ Modifier</BtnG></div>}
      </>}
      {content.type==="qcm"&&<>
        <BtnG onClick={()=>setShowQcm(s=>!s)} style={{fontSize:11,marginBottom:showQcm?8:0}}>
          {showQcm?"Masquer l'éditeur QCM":"✅ Ajouter / modifier une question"}
        </BtnG>
        <div style={{display:"flex",gap:8,alignItems:"center",marginTop:showQcm?0:6}}>
          <label style={{fontSize:11,color:"#444",fontWeight:700,whiteSpace:"nowrap"}}>Seuil de réussite (%)</label>
          <input type="number" min="0" max="100" defaultValue={content.passScorePercent||0}
            onBlur={e=>api.put(`/api/modules/contents/${content.id}`,{passScorePercent:Number(e.target.value)}).then(onRefresh).catch(()=>{})}
            style={{width:60,border:"1.5px solid #D0D0D0",borderRadius:6,padding:"4px 8px",fontSize:12,background:"#fff",outline:"none"}}/>
          <span style={{fontSize:11,color:"#aaa"}}>0 = toujours validé</span>
        </div>
        {showQcm&&<QcmEditor contentId={content.id} api={api} initialQuestion={content.question?.[0]} onSaved={()=>{ setShowQcm(false); onRefresh?.(); }}/>}
      </>}
      {content.type==="text"&&<RichTextEditor contentId={content.id} api={api} initialHtml={content.contentText||""} onSaved={onRefresh}/>}
    </div>
  </div>;
}

function ChapterEditor({chapter,moduleId,api,onRefresh,isActive,onSelect,isMobile}){
  const [editTitle,setEditTitle]=useState(false);
  const [titleVal,setTitleVal]=useState(chapter.title);
  const [addingType,setAddingType]=useState(null);
  const [addingTitle,setAddingTitle]=useState("");
  const [addingUrl,setAddingUrl]=useState("");

  async function saveTitle(){
    try{ await api.put(`/api/modules/chapters/${chapter.id}`,{title:titleVal}); setEditTitle(false); onRefresh?.(); }
    catch(err){ alert(err.message||"Erreur."); }
  }
  async function deleteChapter(){
    if(!confirm(`Supprimer le chapitre "${chapter.title}" et tout son contenu ?`)) return;
    try{ await api.del(`/api/modules/chapters/${chapter.id}`); onRefresh?.(); }
    catch(err){ alert(err.message||"Erreur."); }
  }
  async function addContent(){
    if(!addingType) return;
    const payload={type:addingType,title:addingTitle.trim()||CONTENT_TYPE_META[addingType].label,position:(chapter.contents||[]).length};
    if((addingType==="video_ext"||addingType==="link")&&addingUrl.trim()) payload.externalUrl=addingUrl.trim();
    try{
      await api.post(`/api/modules/chapters/${chapter.id}/contents`,payload);
      setAddingType(null); setAddingTitle(""); setAddingUrl(""); onRefresh?.();
    }catch(err){ alert(err.message||"Erreur."); }
  }

  const card={background:"#fff",border:`1.5px solid ${isActive?"#CC1515":"#EBEBEB"}`,borderRadius:10,padding:"1rem"};

  return <div style={card}>
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:isActive?".875rem":0}}>
      <div style={{display:"flex",gap:8,alignItems:"center",flex:1,minWidth:0,cursor:"pointer"}} onClick={onSelect}>
        {editTitle
          ?<input value={titleVal} onChange={e=>setTitleVal(e.target.value)} onClick={e=>e.stopPropagation()} style={{flex:1,border:"1.5px solid #CC1515",borderRadius:7,padding:"5px 8px",fontSize:13,background:"#fff",outline:"none"}}/>
          :<div style={{fontWeight:700,fontSize:13,color:"#1a1a1a",flex:1,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{chapter.title} <span style={{fontSize:10,color:"#aaa",fontWeight:400}}>({(chapter.contents||[]).length} contenus)</span></div>}
      </div>
      <div style={{display:"flex",gap:4,flexShrink:0}}>
        {editTitle
          ?<><BtnG onClick={saveTitle} style={{fontSize:10}}>✓</BtnG><BtnG onClick={()=>setEditTitle(false)} style={{fontSize:10}}>✕</BtnG></>
          :<BtnG onClick={e=>{e.stopPropagation();setEditTitle(true);}} style={{fontSize:10}}>✏️</BtnG>}
        <BtnG onClick={e=>{e.stopPropagation();deleteChapter();}} style={{fontSize:10,color:"#CC1515",borderColor:"#FDEAEA"}}>🗑</BtnG>
      </div>
    </div>

    {isActive&&<>
      {(chapter.contents||[]).map(c=><ContentItem key={c.id} content={c} chapterId={chapter.id} api={api} onRefresh={onRefresh} isMobile={isMobile}/>)}

      {addingType
        ?<div style={{border:"1.5px solid #CC1515",borderRadius:8,padding:".75rem",background:"#FFF8F8",marginTop:4}}>
          <div style={{fontSize:12,fontWeight:700,color:"#CC1515",marginBottom:6}}>+ Ajouter : {CONTENT_TYPE_META[addingType].label}</div>
          <Input label="Titre (facultatif)" value={addingTitle} onChange={e=>setAddingTitle(e.target.value)} placeholder={CONTENT_TYPE_META[addingType].label}/>
          {(addingType==="video_ext"||addingType==="link")&&<Input label={addingType==="video_ext"?"URL de la vidéo (YouTube, Vimeo, Dailymotion…)":"URL du lien"} value={addingUrl} onChange={e=>setAddingUrl(e.target.value)} placeholder={addingType==="video_ext"?"https://youtu.be/…":"https://…"}/>}
          <div style={{display:"flex",gap:6}}>
            <BtnR onClick={addContent} style={{fontSize:12,flex:1}}>Ajouter</BtnR>
            <BtnG onClick={()=>{setAddingType(null);setAddingUrl("");}} style={{fontSize:12,flex:1}}>Annuler</BtnG>
          </div>
        </div>
        :<div style={{display:"flex",gap:5,flexWrap:"wrap",marginTop:4}}>
          <span style={{fontSize:11,color:"#888",alignSelf:"center"}}>+ Ajouter :</span>
          {Object.entries(CONTENT_TYPE_META).map(([type,meta])=>
            <button key={type} onClick={()=>setAddingType(type)}
              style={{border:`1px solid ${meta.bg}`,background:meta.bg,color:meta.color,borderRadius:20,padding:"4px 10px",fontSize:11,cursor:"pointer",fontWeight:600}}>
              {meta.icon} {meta.label}
            </button>
          )}
        </div>}
    </>}
  </div>;
}

// Bouton + modale d'import CSV dans l'éditeur de module
function CsvImportBtn({moduleId,api,onImported}){
  const [open,setOpen]=useState(false);
  const [preview,setPreview]=useState(null);
  const [loading,setLoading]=useState(false);
  const [importing,setImporting]=useState(false);
  const [done,setDone]=useState(null);

  async function handleFile(file){
    if(!file) return;
    setLoading(true); setPreview(null); setDone(null);
    try{
      const form=new FormData(); form.append("file",file);
      const res=await api.postForm(`/api/modules/${moduleId}/import-csv?dry_run=true`,form);
      setPreview(res);
    }catch(err){ alert(err.message||"Erreur lors de l'analyse du fichier."); }
    finally{ setLoading(false); }
  }

  async function confirmImport(){
    if(!preview) return;
    setImporting(true);
    try{
      const input=document.getElementById("csv-file-input");
      const file=input?.files?.[0];
      if(!file){ alert("Fichier perdu, veuillez re-sélectionner."); return; }
      const form=new FormData(); form.append("file",file);
      const res=await api.postForm(`/api/modules/${moduleId}/import-csv?dry_run=false`,form);
      setDone(res);
      onImported?.();
    }catch(err){ alert(err.message||"Erreur lors de l'import."); }
    finally{ setImporting(false); }
  }

  return <>
    <BtnG onClick={()=>setOpen(true)} style={{fontSize:11}}>⬆ Import CSV</BtnG>
    {open&&<div style={{position:"fixed",inset:0,background:"rgba(0,0,0,.55)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:9999}} onClick={()=>setOpen(false)}>
      <div style={{background:"#fff",borderRadius:14,padding:"1.75rem",width:480,maxWidth:"94vw",color:"#1a1a1a",maxHeight:"88vh",overflowY:"auto"}} onClick={e=>e.stopPropagation()}>
        <div style={{fontWeight:800,fontSize:16,marginBottom:4}}>Import CSV de structure</div>
        <div style={{fontSize:12,color:"#666",lineHeight:1.7,marginBottom:"1rem"}}>
          Importez un fichier CSV pour créer automatiquement les chapitres et contenus de ce module.
          <div style={{background:"#F8F8F8",borderRadius:7,padding:".75rem",marginTop:8,fontFamily:"monospace",fontSize:11}}>
            Chapitre;Type;Titre<br/>
            Introduction;video;Présentation<br/>
            Introduction;doc;Support PDF<br/>
            Risques;qcm;Quiz sécurité<br/>
            Risques;text;Réglementation
          </div>
          <div style={{marginTop:6,fontSize:11,color:"#888"}}>Types acceptés : video, doc, qcm, link, video_ext, text · Séparateur : ; ou ,</div>
        </div>
        {!done&&<>
          <label style={{display:"flex",alignItems:"center",gap:10,border:"2px dashed #D0D0D0",borderRadius:8,padding:"1rem",cursor:"pointer",background:"#FAFAFA",marginBottom:"1rem"}}>
            <span style={{fontSize:20}}>📂</span>
            <span style={{fontSize:13,color:"#555"}}>{loading?"Analyse en cours…":"Sélectionner un fichier CSV"}</span>
            <input id="csv-file-input" type="file" accept=".csv,.txt" onChange={e=>handleFile(e.target.files?.[0])} style={{display:"none"}}/>
          </label>
          {preview&&<div style={{marginBottom:"1rem"}}>
            <div style={{fontWeight:700,fontSize:13,color:"#1a1a1a",marginBottom:8}}>
              Aperçu — {preview.chaptersToCreate} chapitre(s), {preview.contentsToCreate} contenu(s) à créer
            </div>
            <div style={{maxHeight:220,overflowY:"auto",border:"1px solid #EBEBEB",borderRadius:8,padding:".75rem"}}>
              {preview.preview.map((ch,i)=><div key={i} style={{marginBottom:8}}>
                <div style={{fontWeight:700,fontSize:12,color:"#1a1a1a"}}>📁 {ch.chapter}</div>
                {ch.contents.map((c,j)=><div key={j} style={{fontSize:11,color:"#666",paddingLeft:16,marginTop:2}}>
                  {CONTENT_TYPE_META[c.type]?.icon||"📄"} {c.title} <span style={{color:"#aaa"}}>({c.type})</span>
                </div>)}
              </div>)}
            </div>
          </div>}
          <div style={{display:"flex",gap:8}}>
            <BtnG onClick={()=>setOpen(false)} style={{flex:1}}>Annuler</BtnG>
            {preview&&<BtnR onClick={confirmImport} style={{flex:2,opacity:importing?.6:1}}>{importing?"Import en cours…":"✅ Importer maintenant"}</BtnR>}
          </div>
        </>}
        {done&&<div>
          <div style={{background:"#E8F5E9",border:"1px solid #A5D6A7",borderRadius:8,padding:"1rem",marginBottom:"1rem",textAlign:"center"}}>
            <div style={{fontSize:20,marginBottom:4}}>✅</div>
            <div style={{fontWeight:700,color:"#2E7D32"}}>{done.chapters} chapitre(s) et {done.contents} contenu(s) créés</div>
          </div>
          <BtnR onClick={()=>{setOpen(false);setPreview(null);setDone(null);}} style={{width:"100%"}}>Fermer</BtnR>
        </div>}
      </div>
    </div>}
  </>;
}

function ModuleEditor({moduleId:initialModuleId,api,onBack,user}){
  const [modules,setModules]=useState([]);
  const [selectedId,setSelectedId]=useState(initialModuleId||null);
  const [data,setData]=useState(null);
  const [loading,setLoading]=useState(false);
  const [activeChapterId,setActiveChapterId]=useState(null);
  const [showModuleForm,setShowModuleForm]=useState(false);
  const [modForm,setModForm]=useState({id:"",title:"",category:"Santé & sécurité",level:"Débutant",durationMin:60,priceCents:0,description:""});
  const [savingMod,setSavingMod]=useState(false);
  const [addingChapter,setAddingChapter]=useState(false);
  const [chTitle,setChTitle]=useState("");
  const isMobile=useIsMobile();

  const CATEGORIES=["Santé & sécurité","Aléas naturels","Risques technologiques","Instances représentatives","Réglementation","Autre"];
  const LEVELS=["Débutant","Intermédiaire","Avancé"];

  function loadModules(){
    api.get("/api/modules").then(d=>setModules(d.modules)).catch(()=>{});
  }
  function loadDetail(id){
    if(!id) return;
    setLoading(true);
    api.get(`/api/modules/${id}`).then(d=>{ setData(d); if(d.chapters?.length&&!activeChapterId) setActiveChapterId(d.chapters[0]?.id); }).catch(()=>{}).finally(()=>setLoading(false));
  }

  useEffect(()=>{ loadModules(); api.get("/api/tags").then(d=>setAllSuggestedTags(d.tags.map(t=>t.tag))).catch(()=>{}); },[]);
  useEffect(()=>{ if(selectedId){ loadDetail(selectedId); api.get(`/api/tags/${selectedId}`).then(d=>setModuleTags(d.tags)).catch(()=>{}); } },[selectedId]);

  async function createModule(){
    if(!modForm.id.trim()||!modForm.title.trim()){ alert("L'identifiant et le titre sont obligatoires."); return; }
    setSavingMod(true);
    try{
      await api.post("/api/modules",{id:modForm.id.trim().toLowerCase().replace(/\s+/g,"-"),title:modForm.title,category:modForm.category,level:modForm.level,durationMin:Number(modForm.durationMin),priceCents:Number(modForm.priceCents),description:modForm.description});
      setShowModuleForm(false);
      loadModules();
      setSelectedId(modForm.id.trim().toLowerCase().replace(/\s+/g,"-"));
    }catch(err){ alert(err.message||"Erreur lors de la création."); }
    finally{ setSavingMod(false); }
  }

  async function addChapter(){
    if(!chTitle.trim()) return;
    const id=`ch-${Date.now()}`;
    try{
      await api.post(`/api/modules/${selectedId}/chapters`,{id,title:chTitle.trim(),position:(data?.chapters||[]).length});
      setChTitle(""); setAddingChapter(false);
      setActiveChapterId(id);
      loadDetail(selectedId);
    }catch(err){ alert(err.message||"Erreur."); }
  }

  const myModules=modules.filter(m=>user.role==="admin"||m.pedagogueId===user.id);
  const activeMod=data?.module;
  const chapters=data?.chapters||[];
  const [moduleTags,setModuleTags]=useState([]);
  const [tagInput,setTagInput]=useState("");
  const [allSuggestedTags,setAllSuggestedTags]=useState([]);
  const [previewMode,setPreviewMode]=useState(false);
  const [togglingPublish,setTogglingPublish]=useState(false);
  const [duplicating,setDuplicating]=useState(false);

  async function addTag(){
    const tag=tagInput.trim().toLowerCase();
    if(!tag||moduleTags.includes(tag)) return;
    try{
      const res=await api.post(`/api/tags/${selectedId}`,{tag});
      setModuleTags(res.tags);
      setTagInput("");
      setAllSuggestedTags(t=>[...new Set([...t,tag])]);
    }catch(err){ alert(err.message||"Erreur."); }
  }

  async function addTagDirect(tag){
    if(!tag||moduleTags.includes(tag)) return;
    try{
      const res=await api.post(`/api/tags/${selectedId}`,{tag});
      setModuleTags(res.tags);
    }catch(err){ alert(err.message||"Erreur."); }
  }

  async function removeTag(tag){
    try{
      const res=await api.del(`/api/tags/${selectedId}/${encodeURIComponent(tag)}`);
      setModuleTags(res.tags);
    }catch(err){ alert(err.message||"Erreur."); }
  }

  async function togglePublish(){
    if(!selectedId) return;
    setTogglingPublish(true);
    try{
      await api.post(`/api/modules/${selectedId}/publish`);
      loadModules();
      loadDetail(selectedId);
    }catch(err){ alert(err.message||"Erreur."); }
    finally{ setTogglingPublish(false); }
  }

  async function duplicate(){
    if(!selectedId) return;
    setDuplicating(true);
    try{
      const res=await api.post(`/api/modules/${selectedId}/duplicate`);
      loadModules();
      setSelectedId(res.id);
    }catch(err){ alert(err.message||"Erreur lors de la duplication."); }
    finally{ setDuplicating(false); }
  }

  return <div style={{maxWidth:1100,margin:"0 auto",width:"100%",padding:isMobile?"1rem .75rem":"1.75rem 1.25rem"}}>
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"1.25rem",flexWrap:"wrap",gap:8}}>
      <div>
        <div style={{fontSize:22,fontWeight:800,color:"#1a1a1a"}}>Éditeur de modules</div>
        <div style={{fontSize:13,color:"#888",marginTop:2}}>Créez et modifiez les modules de formation</div>
      </div>
      <div style={{display:"flex",gap:8}}>
        {onBack&&<BtnG onClick={onBack} style={{fontSize:12}}>← Retour</BtnG>}
        <BtnR onClick={()=>setShowModuleForm(true)} style={{fontSize:12,padding:"8px 14px"}}>+ Nouveau module</BtnR>
      </div>
    </div>

    {showModuleForm&&<div style={{background:"#fff",border:"1px solid #EBEBEB",borderRadius:10,padding:"1.125rem",marginBottom:"1.25rem"}}>
      <div style={{fontWeight:700,fontSize:15,marginBottom:".875rem",color:"#1a1a1a"}}>Nouveau module</div>
      <div style={{display:"grid",gridTemplateColumns:isMobile?"1fr":"1fr 1fr",gap:10}}>
        <Input label="Identifiant unique (slug)" placeholder="securite-incendie" value={modForm.id} onChange={e=>setModForm(s=>({...s,id:e.target.value.toLowerCase().replace(/\s+/g,"-")}))}/>
        <Input label="Titre" placeholder="Sécurité incendie — Niveau 1" value={modForm.title} onChange={e=>setModForm(s=>({...s,title:e.target.value}))}/>
        <div style={{marginBottom:10}}><label style={{fontSize:12,color:"#444",fontWeight:700,display:"block",marginBottom:4}}>Catégorie</label>
          <select value={modForm.category} onChange={e=>setModForm(s=>({...s,category:e.target.value}))} style={{width:"100%",border:"1.5px solid #D0D0D0",borderRadius:8,padding:"8px 10px",fontSize:13,background:"#fff",color:"#1a1a1a",outline:"none"}}>
            {CATEGORIES.map(c=><option key={c}>{c}</option>)}
          </select></div>
        <div style={{marginBottom:10}}><label style={{fontSize:12,color:"#444",fontWeight:700,display:"block",marginBottom:4}}>Niveau</label>
          <select value={modForm.level} onChange={e=>setModForm(s=>({...s,level:e.target.value}))} style={{width:"100%",border:"1.5px solid #D0D0D0",borderRadius:8,padding:"8px 10px",fontSize:13,background:"#fff",color:"#1a1a1a",outline:"none"}}>
            {LEVELS.map(l=><option key={l}>{l}</option>)}
          </select></div>
        <Input label="Durée (minutes)" type="number" min="1" value={modForm.durationMin} onChange={e=>setModForm(s=>({...s,durationMin:e.target.value}))}/>
        <Input label="Prix HT (centimes, 0 = gratuit)" type="number" min="0" value={modForm.priceCents} onChange={e=>setModForm(s=>({...s,priceCents:e.target.value}))}/>
      </div>
      <Input label="Description" value={modForm.description} onChange={e=>setModForm(s=>({...s,description:e.target.value}))} placeholder="Courte description visible dans le catalogue…"/>
      <div style={{display:"flex",gap:8}}>
        <BtnG onClick={()=>setShowModuleForm(false)} style={{flex:1}}>Annuler</BtnG>
        <BtnR onClick={createModule} style={{flex:2,opacity:savingMod?.6:1}}>{savingMod?"Création…":"Créer le module"}</BtnR>
      </div>
    </div>}

    <div style={{display:"grid",gridTemplateColumns:isMobile?"1fr":myModules.length?"200px 1fr":"1fr",gap:"1.25rem"}}>
      {myModules.length>0&&<div>
        <div style={{fontWeight:700,fontSize:12,color:"#aaa",textTransform:"uppercase",letterSpacing:".5px",marginBottom:8}}>Mes modules</div>
        {myModules.map(m=><div key={m.id} onClick={()=>setSelectedId(m.id)}
          style={{background:selectedId===m.id?"#CC1515":"#fff",border:`1px solid ${selectedId===m.id?"#CC1515":"#EBEBEB"}`,borderRadius:8,padding:"9px 12px",marginBottom:5,cursor:"pointer",fontSize:12,fontWeight:selectedId===m.id?700:400,color:selectedId===m.id?"#fff":"#1a1a1a"}}>
          <div style={{display:"flex",alignItems:"center",gap:5,flexWrap:"wrap"}}>
            <span style={{flex:1,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{m.title.length>28?m.title.slice(0,28)+"…":m.title}</span>
            {!m.published&&<span style={{fontSize:9,fontWeight:800,padding:"1px 5px",borderRadius:20,background:selectedId===m.id?"rgba(255,255,255,.3)":"#FFF8E1",color:selectedId===m.id?"#fff":"#E65100",flexShrink:0}}>BROUILLON</span>}
          </div>
          <div style={{fontSize:10,color:selectedId===m.id?"rgba(255,255,255,.7)":"#aaa",marginTop:1}}>{m.category} · {m.priceCentsHt===0?"Gratuit":`${(m.priceCentsHt/100).toFixed(0)} €`}</div>
        </div>)}
      </div>}

      <div>
        {!selectedId&&<div style={{background:"#fff",border:"1px solid #EBEBEB",borderRadius:10,padding:"2rem",textAlign:"center",color:"#aaa",fontSize:13}}>Sélectionnez ou créez un module pour commencer.</div>}
        {selectedId&&loading&&<div style={{color:"#aaa",fontSize:13,textAlign:"center",padding:"2rem"}}>Chargement…</div>}
        {selectedId&&!loading&&data&&<>
          {previewMode&&<div>
            <div style={{display:"flex",alignItems:"center",gap:10,background:"#FFF8E1",border:"1px solid #FFE082",borderRadius:10,padding:"10px 14px",marginBottom:"1rem"}}>
              <span style={{fontSize:12,color:"#E65100",fontWeight:700}}>👁 Mode aperçu apprenant — c'est ce que verra l'apprenant</span>
              <BtnG onClick={()=>setPreviewMode(false)} style={{marginLeft:"auto",fontSize:11}}>✕ Quitter l'aperçu</BtnG>
            </div>
            <ModuleDetail moduleId={selectedId} onBack={()=>setPreviewMode(false)} user={{...activeMod,role:"apprenant",isEnrolled:true,hasFullAccess:true}} api={api}/>
          </div>}
          {!previewMode&&<>
          <div style={{background:"#fff",border:"1px solid #EBEBEB",borderRadius:10,padding:"1rem",marginBottom:"1rem"}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",flexWrap:"wrap",gap:8}}>
              <div>
                <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:4}}>
                  <div style={{fontWeight:700,fontSize:15,color:"#1a1a1a"}}>{activeMod?.title}</div>
                  {activeMod?.published
                    ?<span style={{fontSize:10,fontWeight:800,padding:"2px 8px",borderRadius:20,background:"#E8F5E9",color:"#2E7D32"}}>✅ PUBLIÉ</span>
                    :<span style={{fontSize:10,fontWeight:800,padding:"2px 8px",borderRadius:20,background:"#FFF8E1",color:"#E65100"}}>✏️ BROUILLON</span>}
                </div>
                <div style={{fontSize:11,color:"#888"}}>{activeMod?.category} · {activeMod?.level} · {activeMod?.durationMin} min · {activeMod?.priceCentsHt===0?"Gratuit":`${(activeMod.priceCentsHt/100).toFixed(0)} € HT`} · <label style={{cursor:"pointer",fontWeight:600,color:activeMod?.chapterOrderEnforced?"#2E7D32":"#aaa"}}>
                  <input type="checkbox" checked={activeMod?.chapterOrderEnforced||false} onChange={async e=>{ await api.put(`/api/modules/${selectedId}`,{chapterOrderEnforced:e.target.checked}); loadDetail(selectedId); }} style={{marginRight:4,accentColor:"#2E7D32"}}/>
                  Ordre chapitres obligatoire
                </label></div>
              </div>
              <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
                <BtnG onClick={()=>setPreviewMode(true)} style={{fontSize:11}}>👁 Aperçu</BtnG>
                <BtnG onClick={duplicate} style={{fontSize:11,opacity:duplicating?.6:1}}>{duplicating?"…":"📋 Dupliquer"}</BtnG>
                <button onClick={togglePublish} disabled={togglingPublish} style={{border:"none",borderRadius:8,padding:"7px 12px",fontSize:11,cursor:"pointer",fontWeight:700,background:activeMod?.published?"#FFF8E1":"#E8F5E9",color:activeMod?.published?"#E65100":"#2E7D32",opacity:togglingPublish?.6:1}}>
                  {togglingPublish?"…":activeMod?.published?"🔒 Dépublier":"🚀 Publier"}
                </button>
              </div>
            </div>
          </div>
          <div style={{background:"#fff",border:"1px solid #EBEBEB",borderRadius:10,padding:"1rem",marginBottom:"1rem"}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:".75rem"}}>
              <div style={{fontWeight:700,fontSize:15,color:"#1a1a1a"}}>{activeMod?.title}</div>
              <div style={{display:"flex",gap:6,alignItems:"center"}}>
                <span style={{fontSize:11,color:"#888"}}>{activeMod?.priceCentsHt===0?"Gratuit":`${(activeMod.priceCentsHt/100).toFixed(0)} € HT`}</span>
                <span style={{fontSize:11,color:"#aaa"}}>·</span>
                <span style={{fontSize:11,color:"#888"}}>{activeMod?.durationMin} min</span>
              </div>
            </div>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",flexWrap:"wrap",gap:6}}>
              <div style={{fontSize:12,color:"#888"}}>{chapters.length} chapitre(s) · {chapters.reduce((a,c)=>a+(c.contents||[]).length,0)} contenu(s)</div>
              <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
                {addingChapter
                  ?<div style={{display:"flex",gap:6,flex:1,maxWidth:360}}>
                    <input value={chTitle} onChange={e=>setChTitle(e.target.value)} placeholder="Titre du nouveau chapitre" onKeyDown={e=>e.key==="Enter"&&addChapter()}
                      style={{flex:1,border:"1.5px solid #CC1515",borderRadius:8,padding:"6px 10px",fontSize:13,background:"#fff",outline:"none"}}/>
                    <BtnR onClick={addChapter} style={{fontSize:12,padding:"6px 12px"}}>Ajouter</BtnR>
                    <BtnG onClick={()=>setAddingChapter(false)} style={{fontSize:12}}>✕</BtnG>
                  </div>
                  :<BtnR onClick={()=>setAddingChapter(true)} style={{fontSize:12,padding:"7px 12px"}}>+ Chapitre</BtnR>}
                <CsvImportBtn moduleId={selectedId} api={api} onImported={()=>loadDetail(selectedId)}/>
              </div>
            </div>

            {/* Tags */}
            <div style={{borderTop:"1px solid #F5F5F5",marginTop:".875rem",paddingTop:".875rem"}}>
              <div style={{fontSize:12,fontWeight:700,color:"#555",marginBottom:6}}>🏷️ Mots-clés</div>
              <div style={{display:"flex",gap:5,flexWrap:"wrap",marginBottom:6}}>
                {moduleTags.map(t=><span key={t} style={{background:"#EEF2FF",color:"#3B5BDB",borderRadius:20,padding:"2px 10px",fontSize:11,fontWeight:700,display:"flex",alignItems:"center",gap:4}}>
                  {t}<button onClick={()=>removeTag(t)} style={{background:"none",border:"none",color:"#3B5BDB",cursor:"pointer",fontSize:13,lineHeight:1,padding:"0 1px"}}>×</button>
                </span>)}
                {moduleTags.length===0&&<span style={{fontSize:11,color:"#aaa"}}>Aucun tag — ajoutez des mots-clés pour améliorer la recherche</span>}
              </div>
              <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
                <input value={tagInput} onChange={e=>setTagInput(e.target.value)} onKeyDown={e=>e.key==="Enter"&&addTag()}
                  placeholder="Ajouter un tag… (Entrée)" list="tag-suggestions"
                  style={{flex:1,minWidth:160,border:"1.5px solid #D0D0D0",borderRadius:20,padding:"4px 12px",fontSize:12,background:"#fff",outline:"none"}}/>
                <datalist id="tag-suggestions">{allSuggestedTags.filter(t=>!moduleTags.includes(t)).map(t=><option key={t} value={t}/>)}</datalist>
                <BtnG onClick={addTag} style={{fontSize:11}}>+ Ajouter</BtnG>
                {allSuggestedTags.filter(t=>!moduleTags.includes(t)&&t.includes(tagInput.toLowerCase())).slice(0,5).map(t=>
                  <button key={t} onClick={()=>{setTagInput("");addTagDirect(t);}} style={{border:"1px solid #C5CFF5",background:"#EEF2FF",borderRadius:20,padding:"3px 10px",fontSize:11,cursor:"pointer",color:"#3B5BDB"}}>+{t}</button>
                )}
              </div>
            </div>
          </div>

          {chapters.length===0&&<div style={{background:"#FFF8E1",border:"1px solid #FFE082",borderRadius:10,padding:"1.5rem",textAlign:"center",color:"#E65100",fontSize:13}}>Ce module n'a pas encore de chapitre. Commencez par en ajouter un ci-dessus.</div>}

          {chapters.map(ch=><div key={ch.id} style={{marginBottom:".75rem"}}>
            <ChapterEditor
              chapter={ch} moduleId={selectedId} api={api}
              onRefresh={()=>loadDetail(selectedId)}
              isActive={activeChapterId===ch.id}
              onSelect={()=>setActiveChapterId(id=>id===ch.id?null:ch.id)}
              isMobile={isMobile}/>
          </div>)}
          </>}
        </>}
      </div>
    </div>
  </div>;
}

function PedagogueDash({user,api}){
  const isMobile=useIsMobile();
  return <ModuleEditor api={api} user={user}/>;
}

function FormateurDash(){
  const card={background:"#fff",border:"1px solid #EBEBEB",borderRadius:10,padding:"1.125rem"};
  return <div style={{maxWidth:1100,margin:"0 auto",width:"100%",padding:"1.75rem 1.25rem"}}>
    <div style={{marginBottom:"1.25rem"}}><div style={{fontSize:22,fontWeight:800,color:"#1a1a1a"}}>Espace Formateur</div><div style={{fontSize:13,color:"#888",marginTop:3}}>Suivez vos sessions et accompagnez vos apprenants</div></div>
    <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(130px,1fr))",gap:".875rem",marginBottom:"1.25rem"}}>
      <Metric icon="📅" label="Sessions actives" value="2"/><Metric icon="👥" label="Apprenants suivis" value="20"/><Metric icon="📈" label="Taux complétion" value="68%"/><Metric icon="💬" label="Messages non lus" value="3"/>
    </div>
    <div style={{...card,marginBottom:"1rem"}}>
      <div style={{fontWeight:700,marginBottom:".75rem",color:"#1a1a1a"}}>Mes sessions</div>
      <table style={{width:"100%",borderCollapse:"collapse",fontSize:13}}>
        <thead><tr>{["Module","Date","Apprenants","Statut",""].map(h=><th key={h} style={{textAlign:"left",fontSize:11,color:"#aaa",fontWeight:700,padding:"7px 10px",borderBottom:"1px solid #EBEBEB"}}>{h}</th>)}</tr></thead>
        <tbody>{SESSIONS.map(s=>{const mod=MODULES.find(x=>x.id===s.mid);return <tr key={s.id}><td style={{padding:"9px 10px",borderBottom:"1px solid #EBEBEB"}}><div style={{fontWeight:600,fontSize:12}}>{mod?.title.substring(0,30)}…</div><div style={{fontSize:11,color:"#bbb"}}>{s.titre}</div></td><td style={{padding:"9px 10px",borderBottom:"1px solid #EBEBEB",fontSize:12}}>{s.date}</td><td style={{padding:"9px 10px",borderBottom:"1px solid #EBEBEB"}}>{s.nb}</td><td style={{padding:"9px 10px",borderBottom:"1px solid #EBEBEB"}}><St s={s.statut}/></td><td style={{padding:"9px 10px",borderBottom:"1px solid #EBEBEB"}}><BtnR style={{fontSize:11,padding:"5px 10px"}}>👁 Gérer</BtnR></td></tr>;})}</tbody>
      </table>
    </div>
    <div style={card}>
      <div style={{fontWeight:700,marginBottom:".75rem",color:"#1a1a1a"}}>Progression des apprenants</div>
      <table style={{width:"100%",borderCollapse:"collapse",fontSize:13}}>
        <thead><tr>{["Apprenant","Formation","Progression","Statut","Dernière activité"].map(h=><th key={h} style={{textAlign:"left",fontSize:11,color:"#aaa",fontWeight:700,padding:"7px 10px",borderBottom:"1px solid #EBEBEB"}}>{h}</th>)}</tr></thead>
        <tbody>{LEARNERS.map(l=><tr key={l.name}><td style={{padding:"9px 10px",borderBottom:"1px solid #EBEBEB"}}><div style={{display:"flex",alignItems:"center",gap:7}}><div style={{width:26,height:26,background:"#512DA8",color:"#fff",borderRadius:"50%",display:"flex",alignItems:"center",justifyContent:"center",fontSize:10,fontWeight:800,flexShrink:0}}>{l.name.split(" ").map(w=>w[0]).join("")}</div>{l.name}</div></td><td style={{padding:"9px 10px",borderBottom:"1px solid #EBEBEB",fontSize:12}}>{l.module}</td><td style={{padding:"9px 10px",borderBottom:"1px solid #EBEBEB"}}><div style={{display:"flex",alignItems:"center",gap:7,minWidth:110}}><div style={{flex:1}}><PB value={l.progress}/></div><span style={{fontSize:11,minWidth:28,color:"#CC1515",fontWeight:700}}>{l.progress}%</span></div></td><td style={{padding:"9px 10px",borderBottom:"1px solid #EBEBEB"}}><St s={l.statut}/></td><td style={{padding:"9px 10px",borderBottom:"1px solid #EBEBEB",fontSize:12,color:"#aaa"}}>{l.derniere}</td></tr>)}</tbody>
      </table>
    </div>
  </div>;
}

// Affiche les coordonnées bancaires et la référence à utiliser après le choix
// du virement comme mode de paiement (module ou lot de crédits).
function BankTransferInstructions({details,onClose}){
  const rows=[
    ["Bénéficiaire",details.bankDetails.accountHolder],
    ["IBAN",details.bankDetails.iban],
    ["BIC",details.bankDetails.bic],
    ["Banque",details.bankDetails.bankName],
  ];
  if(details.amountCentsHt!==undefined){
    rows.push(["Montant HT",`${(details.amountCentsHt/100).toFixed(2)} €`]);
    rows.push(["TVA",`${details.vatRatePercent}%`]);
  }
  rows.push(["Montant TTC à virer",`${((details.amountCentsTtc??details.amountCents)/100).toFixed(2)} €`]);
  rows.push(["Référence à indiquer",details.transferReference]);

  return <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,.55)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:9999}} onClick={onClose}>
    <div style={{background:"#fff",borderRadius:14,padding:"1.75rem",width:440,maxWidth:"94vw",boxShadow:"0 8px 40px rgba(0,0,0,.2)",color:"#1a1a1a"}} onClick={e=>e.stopPropagation()}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:"1rem"}}>
        <div>
          <div style={{fontSize:18,fontWeight:800}}>Virement bancaire</div>
          <div style={{fontSize:13,color:"#666",marginTop:2}}>Commande enregistrée — en attente de réception</div>
        </div>
        <button onClick={onClose} style={{background:"none",border:"none",cursor:"pointer",fontSize:20,color:"#999",padding:0}}>✕</button>
      </div>
      <div style={{background:"#FFF8E1",border:"1px solid #FFE082",borderRadius:8,padding:".75rem",fontSize:12,color:"#E65100",marginBottom:"1rem",fontWeight:600}}>
        ⚠️ Indiquez impérativement la référence ci-dessous sur votre virement, sinon nous ne pourrons pas l'associer à votre commande.
      </div>
      <div style={{background:"#F7F7F7",borderRadius:8,padding:"1rem",marginBottom:"1rem"}}>
        {rows.map(([l,v])=>
          <div key={l} style={{display:"flex",justifyContent:"space-between",padding:"6px 0",borderBottom:"1px solid #EBEBEB",fontSize:13}}>
            <span style={{color:"#888"}}>{l}</span>
            <span style={{fontWeight:700,color:l==="Référence à indiquer"||l==="Montant TTC à virer"?"#CC1515":"#1a1a1a"}}>{v}</span>
          </div>
        )}
      </div>
      <p style={{fontSize:12,color:"#666",lineHeight:1.6,marginBottom:"1rem"}}>{details.instructions}</p>
      <BtnR onClick={onClose} style={{width:"100%",padding:10,fontSize:13,borderRadius:8}}>J'ai compris</BtnR>
    </div>
  </div>;
}

// Modale de choix du mode de paiement (carte / virement) — utilisée pour
// l'achat d'un lot de crédits par le chargé de formation.
function CreditPurchaseModal({pack,api,user,onClose,onPurchased}){
  const [method,setMethod]=useState("card");
  const [postalCode,setPostalCode]=useState(user?.postalCode||"");
  const [loading,setLoading]=useState(false);
  const [error,setError]=useState("");
  const [transferDetails,setTransferDetails]=useState(null);
  const vat=useVatRate(api,postalCode,20);
  const ttcCents=ttcFromHt(pack.priceCents,vat.ratePercent);

  const unitPrice=pack.priceCents/pack.credits/100;

  async function confirm(){
    setLoading(true); setError("");
    try{
      const res=await api.post("/api/credits/purchase",{packId:pack.id,paymentMethod:method,postalCode:postalCode||undefined});
      if(res.paymentMethod==="card"){
        window.location.href=res.url;
      } else {
        setTransferDetails(res);
        onPurchased?.();
      }
    }catch(err){
      setError(err.message||"Impossible de lancer l'achat.");
    }finally{
      setLoading(false);
    }
  }

  if(transferDetails) return <BankTransferInstructions details={transferDetails} onClose={onClose}/>;

  return <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,.55)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:9999}} onClick={onClose}>
    <div style={{background:"#fff",borderRadius:14,padding:"1.75rem",width:420,maxWidth:"94vw",boxShadow:"0 8px 40px rgba(0,0,0,.2)",color:"#1a1a1a"}} onClick={e=>e.stopPropagation()}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:"1rem"}}>
        <div>
          <div style={{fontSize:18,fontWeight:800}}>{pack.name}</div>
          <div style={{fontSize:13,color:"#666",marginTop:2}}>{pack.credits.toLocaleString("fr-FR")} crédits · {(unitPrice).toFixed(2)} € HT / crédit</div>
        </div>
        <button onClick={onClose} style={{background:"none",border:"none",cursor:"pointer",fontSize:20,color:"#999",padding:0}}>✕</button>
      </div>

      <div style={{marginBottom:14}}>
        <label style={{fontSize:12,color:"#444",fontWeight:700,display:"block",marginBottom:4}}>Code postal (pour calculer la TVA applicable)</label>
        <input value={postalCode} onChange={e=>setPostalCode(e.target.value)} placeholder="ex : 75001, 97100, 97133…" style={{width:"100%",border:"1.5px solid #D0D0D0",borderRadius:8,padding:"8px 10px",fontSize:13,background:"#fff",color:"#1a1a1a",outline:"none"}}/>
      </div>

      <div style={{background:"#F9F9F9",borderRadius:8,padding:".75rem",marginBottom:"1rem"}}>
        <div style={{display:"flex",justifyContent:"space-between",fontSize:12,color:"#666",marginBottom:4}}><span>Prix HT</span><span>{(pack.priceCents/100).toFixed(2)} €</span></div>
        <div style={{display:"flex",justifyContent:"space-between",fontSize:12,color:"#666",marginBottom:4}}><span>TVA {vat.loading?"…":`${vat.ratePercent}%`}{vat.label?` (${vat.label})`:""}</span><span>{((ttcCents-pack.priceCents)/100).toFixed(2)} €</span></div>
        <div style={{display:"flex",justifyContent:"space-between",fontSize:16,fontWeight:800,color:"#CC1515",marginTop:6,paddingTop:6,borderTop:"1px solid #EBEBEB"}}><span>Total TTC</span><span>{(ttcCents/100).toFixed(2)} €</span></div>
      </div>
      {pack.discountPercent>0&&<div style={{fontSize:12,color:"#2E7D32",fontWeight:700,marginBottom:"1rem"}}>Remise de {pack.discountPercent}% déjà incluse dans ce prix</div>}

      <div style={{fontSize:12,color:"#444",fontWeight:700,marginBottom:8}}>Mode de paiement</div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:"1.25rem"}}>
        <div onClick={()=>setMethod("card")} style={{border:`1.5px solid ${method==="card"?"#CC1515":"#E0E0E0"}`,borderRadius:8,padding:"10px",cursor:"pointer",textAlign:"center",background:method==="card"?"#FDEAEA":"#FAFAFA"}}>
          <div style={{fontSize:18,marginBottom:4}}>💳</div>
          <div style={{fontSize:12,fontWeight:700,color:"#1a1a1a"}}>Carte bancaire</div>
          <div style={{fontSize:10,color:"#888",marginTop:2}}>Paiement immédiat via Stripe</div>
        </div>
        <div onClick={()=>setMethod("transfer")} style={{border:`1.5px solid ${method==="transfer"?"#CC1515":"#E0E0E0"}`,borderRadius:8,padding:"10px",cursor:"pointer",textAlign:"center",background:method==="transfer"?"#FDEAEA":"#FAFAFA"}}>
          <div style={{fontSize:18,marginBottom:4}}>🏦</div>
          <div style={{fontSize:12,fontWeight:700,color:"#1a1a1a"}}>Virement bancaire</div>
          <div style={{fontSize:10,color:"#888",marginTop:2}}>Activation sous 2-3 jours ouvrés</div>
        </div>
      </div>

      {error&&<div style={{background:"#FDEAEA",color:"#CC1515",borderRadius:7,padding:"8px 12px",fontSize:12,marginBottom:12,fontWeight:600}}>{error}</div>}
      <BtnR onClick={confirm} style={{width:"100%",padding:11,fontSize:14,borderRadius:8,opacity:loading?.6:1}}>
        {loading?"Veuillez patienter…":method==="card"?`Payer ${(ttcCents/100).toFixed(2)} € par carte →`:"Obtenir les coordonnées bancaires →"}
      </BtnR>
    </div>
  </div>;
}

// Carte "Code ambassadeur" — affiche le code personnel de l'utilisateur (à
// partager) et, s'il n'a pas encore profité d'un parrainage, un champ pour en
// saisir un (réduction immuable une fois appliquée, comme imposé côté serveur).
function ReferralCard({user,api,onApplied}){
  const [code,setCode]=useState("");
  const [check,setCheck]=useState(null);
  const [applying,setApplying]=useState(false);
  const [error,setError]=useState("");
  const [copied,setCopied]=useState(false);

  useEffect(()=>{
    if(!code.trim()){ setCheck(null); return; }
    let active=true;
    const t=setTimeout(()=>{
      api.get(`/api/referral/validate?code=${encodeURIComponent(code.trim())}`)
        .then(d=>{ if(active) setCheck(d); }).catch(()=>{ if(active) setCheck({valid:false}); });
    },400);
    return ()=>{ active=false; clearTimeout(t); };
  },[code]); // eslint-disable-line react-hooks/exhaustive-deps

  function copyCode(){
    navigator.clipboard?.writeText(user.referralCode||"");
    setCopied(true);
    setTimeout(()=>setCopied(false),1500);
  }

  async function applyCode(){
    setError(""); setApplying(true);
    try{
      await api.post("/api/auth/referral-code",{referralCode:code.trim()});
      onApplied?.(code.trim());
    }catch(err){
      setError(err.message||"Impossible d'appliquer ce code.");
    }finally{
      setApplying(false);
    }
  }

  const card={background:"#fff",border:"1px solid #EBEBEB",borderRadius:10,padding:"1.125rem"};

  return <div style={card}>
    <div style={{fontWeight:700,fontSize:13,marginBottom:".625rem",color:"#1a1a1a"}}>🎁 Code ambassadeur</div>
    <div style={{fontSize:12,color:"#666",marginBottom:".75rem",lineHeight:1.5}}>Partagez votre code : toute personne qui l'utilise à son inscription bénéficie d'une réduction de 5% sur ses achats.</div>
    <div style={{display:"flex",gap:8,marginBottom:user.referredByCode?0:"1rem"}}>
      <div style={{flex:1,background:"#F7F7F7",border:"1px dashed #CC1515",borderRadius:8,padding:"9px 12px",fontSize:15,fontWeight:800,color:"#CC1515",letterSpacing:1,textAlign:"center"}}>{user.referralCode||"—"}</div>
      <BtnG onClick={copyCode} style={{fontSize:12}}>{copied?"Copié ✓":"Copier"}</BtnG>
    </div>
    {!user.referredByCode&&<div style={{borderTop:"1px solid #F0F0F0",paddingTop:".875rem"}}>
      <div style={{fontSize:12,color:"#444",fontWeight:700,marginBottom:6}}>Vous avez un code ambassadeur ?</div>
      <div style={{display:"flex",gap:8}}>
        <input value={code} onChange={e=>setCode(e.target.value.toUpperCase())} placeholder="ex : DFTXA69M" style={{flex:1,border:"1.5px solid #D0D0D0",borderRadius:8,padding:"8px 10px",fontSize:13,background:"#fff",color:"#1a1a1a",outline:"none"}}/>
        <BtnR onClick={applyCode} disabled={!check?.valid||applying} style={{fontSize:12,padding:"8px 14px",opacity:(!check?.valid||applying)?.5:1}}>{applying?"…":"Appliquer"}</BtnR>
      </div>
      {code.trim()&&check?.valid&&<div style={{fontSize:11,color:"#2E7D32",marginTop:6,fontWeight:600}}>✅ Code de {check.ownerName} — {check.discountPercent}% de réduction</div>}
      {code.trim()&&check&&!check.valid&&<div style={{fontSize:11,color:"#CC1515",marginTop:6,fontWeight:600}}>Code invalide</div>}
      {error&&<div style={{fontSize:11,color:"#CC1515",marginTop:6,fontWeight:600}}>{error}</div>}
    </div>}
    {user.referredByCode&&<div style={{background:"#E8F5E9",color:"#2E7D32",borderRadius:7,padding:"8px 12px",fontSize:12,fontWeight:600,marginTop:".75rem"}}>✅ Réduction ambassadeur active sur vos achats (code {user.referredByCode})</div>}
  </div>;
}

// Suivi des gains de commission ambassadeur (15% par filleul par défaut),
// avec demande de remboursement à partir du seuil configuré (100 € par défaut).
function AmbassadorEarnings({api}){
  const [balance,setBalance]=useState(null);
  const [loading,setLoading]=useState(true);
  const [showRequest,setShowRequest]=useState(false);
  const [accountHolder,setAccountHolder]=useState("");
  const [iban,setIban]=useState("");
  const [submitting,setSubmitting]=useState(false);
  const [error,setError]=useState("");
  const [history,setHistory]=useState([]);
  const [showHistory,setShowHistory]=useState(false);

  function load(){
    setLoading(true);
    api.get("/api/referral/balance").then(setBalance).catch(()=>{}).finally(()=>setLoading(false));
  }
  useEffect(()=>{ load(); },[]); // eslint-disable-line react-hooks/exhaustive-deps

  function loadHistory(){
    api.get("/api/referral/reimbursements").then(d=>setHistory(d.reimbursements)).catch(()=>{});
  }

  async function downloadPreview(){
    try{
      const blob=await api.getBlob(`/api/referral/invoice?accountHolder=${encodeURIComponent(accountHolder||"")}&iban=${encodeURIComponent(iban||"")}`);
      const url=window.URL.createObjectURL(blob);
      window.open(url,"_blank");
    }catch(err){
      alert(err.message||"Impossible de générer l'aperçu de la facture.");
    }
  }

  async function submitRequest(){
    if(!accountHolder.trim()||iban.trim().length<10){ setError("Merci de renseigner le titulaire et l'IBAN complets."); return; }
    setSubmitting(true); setError("");
    try{
      await api.post("/api/referral/reimbursement",{accountHolder:accountHolder.trim(),iban:iban.trim()});
      setShowRequest(false);
      setAccountHolder(""); setIban("");
      load();
    }catch(err){
      setError(err.message||"Impossible de soumettre la demande.");
    }finally{
      setSubmitting(false);
    }
  }

  const statusInfo={
    pending:["Demande envoyée — en attente de validation","#FFF8E1","#E65100"],
    validated:["Validée — virement à venir sous 45 jours","#E3F2FD","#0277BD"],
    paid:["Virement effectué ✅","#E8F5E9","#2E7D32"],
    rejected:["Demande refusée","#FDEAEA","#CC1515"],
  };

  const card={background:"#fff",border:"1px solid #EBEBEB",borderRadius:10,padding:"1.125rem"};

  if(loading||!balance) return null;
  if(balance.balanceCents===0&&!balance.activeRequest&&history.length===0) return null;

  return <div style={{...card,marginTop:"1rem"}}>
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:".625rem"}}>
      <div style={{fontWeight:700,fontSize:13,color:"#1a1a1a"}}>💰 Commission ambassadeur</div>
      <BtnG onClick={()=>{setShowHistory(s=>!s);if(!showHistory)loadHistory();}} style={{fontSize:11}}>{showHistory?"Masquer l'historique":"Historique"}</BtnG>
    </div>
    <div style={{fontSize:24,fontWeight:800,color:"#CC1515",marginBottom:4}}>{(balance.balanceCents/100).toFixed(2)} €</div>
    <div style={{fontSize:11,color:"#888",marginBottom:".75rem"}}>15% du montant payé par chaque filleul parrainé. Remboursable à partir de {(balance.thresholdCents/100).toFixed(0)} €.</div>

    {balance.activeRequest
      ?<div style={{background:statusInfo[balance.activeRequest.status][1],color:statusInfo[balance.activeRequest.status][2],borderRadius:7,padding:".75rem",fontSize:12,fontWeight:600}}>
        {statusInfo[balance.activeRequest.status][0]} — {(balance.activeRequest.amountCents/100).toFixed(2)} €
        {balance.activeRequest.deadlineAt&&<div style={{fontWeight:400,marginTop:4,fontSize:11}}>Échéance au plus tard le {new Date(balance.activeRequest.deadlineAt).toLocaleDateString("fr-FR")}</div>}
      </div>
      :balance.canRequestReimbursement
        ?<BtnR onClick={()=>setShowRequest(true)} style={{width:"100%",padding:9,fontSize:13,borderRadius:8}}>Demander le remboursement →</BtnR>
        :<div style={{fontSize:11,color:"#aaa"}}>Plus que {((balance.thresholdCents-balance.balanceCents)/100).toFixed(2)} € avant de pouvoir demander un remboursement.</div>
    }

    {showHistory&&<div style={{marginTop:".875rem",borderTop:"1px solid #F0F0F0",paddingTop:".75rem"}}>
      {history.length===0?<div style={{fontSize:12,color:"#aaa"}}>Aucune demande passée.</div>:
      history.map(h=>
        <div key={h.id} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"6px 0",borderBottom:"1px solid #F5F5F5",fontSize:12}}>
          <div>
            <div style={{fontWeight:600,color:"#1a1a1a"}}>{h.invoiceNumber}</div>
            <div style={{color:"#aaa",fontSize:10}}>{new Date(h.requestedAt).toLocaleDateString("fr-FR")}</div>
          </div>
          <div style={{textAlign:"right"}}>
            <div style={{fontWeight:700,color:"#CC1515"}}>{(h.amountCents/100).toFixed(2)} €</div>
            <span style={{fontSize:9,fontWeight:700,padding:"1px 7px",borderRadius:20,background:statusInfo[h.status][1],color:statusInfo[h.status][2]}}>{h.status}</span>
          </div>
        </div>
      )}
    </div>}

    {showRequest&&<div style={{position:"fixed",inset:0,background:"rgba(0,0,0,.55)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:9999}} onClick={()=>setShowRequest(false)}>
      <div style={{background:"#fff",borderRadius:14,padding:"1.75rem",width:420,maxWidth:"94vw",color:"#1a1a1a"}} onClick={e=>e.stopPropagation()}>
        <div style={{fontSize:17,fontWeight:800,marginBottom:6}}>Demande de remboursement</div>
        <div style={{fontSize:13,color:"#666",marginBottom:"1rem"}}>Montant : <strong style={{color:"#CC1515"}}>{(balance.balanceCents/100).toFixed(2)} €</strong></div>
        <Input label="Titulaire du compte bancaire" value={accountHolder} onChange={e=>setAccountHolder(e.target.value)} placeholder="Nom complet"/>
        <Input label="IBAN" value={iban} onChange={e=>setIban(e.target.value.toUpperCase())} placeholder="FR76 ..."/>
        {error&&<div style={{background:"#FDEAEA",color:"#CC1515",borderRadius:7,padding:"8px 12px",fontSize:12,marginBottom:10,fontWeight:600}}>{error}</div>}
        <BtnG onClick={downloadPreview} style={{width:"100%",marginBottom:10,fontSize:12}}>📄 Aperçu de la facture (PDF)</BtnG>
        <div style={{display:"flex",gap:8}}>
          <BtnG onClick={()=>setShowRequest(false)} style={{flex:1}}>Annuler</BtnG>
          <BtnR onClick={submitRequest} style={{flex:1,opacity:submitting?.6:1}}>{submitting?"Envoi…":"Valider la demande"}</BtnR>
        </div>
      </div>
    </div>}
  </div>;
}

function ChargeDash({user,api}){
  const [packs,setPacks]=useState([]);
  const [selectedPack,setSelectedPack]=useState(null);
  const [loadingPacks,setLoadingPacks]=useState(true);
  const [credits,setCredits]=useState(user.forfaitCredits ?? 0);
  const [modules,setModules]=useState([]);
  const [selectedModuleId,setSelectedModuleId]=useState("");
  const [bulkEmails,setBulkEmails]=useState("");
  const [assignMsg,setAssignMsg]=useState(null);
  const [assigning,setAssigning]=useState(false);
  const [collaborators,setCollaborators]=useState([]);
  const [loadingCollabs,setLoadingCollabs]=useState(true);
  const card={background:"#fff",border:"1px solid #EBEBEB",borderRadius:10,padding:"1.125rem"};
  const vat=useVatRate(api,user?.postalCode||"",20);
  const LOW_CREDIT_THRESHOLD=50;

  function loadCollaborators(){
    setLoadingCollabs(true);
    api.get("/api/charge/collaborators").then(d=>setCollaborators(d.collaborators)).catch(()=>{}).finally(()=>setLoadingCollabs(false));
  }

  useEffect(()=>{
    let active=true;
    api.get("/api/credit-packs").then(d=>{ if(active) setPacks(d.packs); }).catch(()=>{}).finally(()=>{ if(active) setLoadingPacks(false); });
    api.get("/api/modules").then(d=>{ if(active){ setModules(d.modules); if(d.modules[0]) setSelectedModuleId(d.modules[0].id); } }).catch(()=>{});
    api.get("/api/auth/me").then(d=>{ if(active) setCredits(d.user.forfaitCredits ?? 0); }).catch(()=>{});
    loadCollaborators();
    return ()=>{ active=false; };
  },[]);

  const selectedModule=modules.find(m=>m.id===selectedModuleId);
  const isFreeModule=selectedModule?.priceCentsHt===0;
  const requiredCreditsPerPerson=isFreeModule?0:selectedModule?Math.ceil(selectedModule.priceCentsHt/100):0;
  const emailList=bulkEmails.split(/[\n,;]+/).map(e=>e.trim()).filter(Boolean);
  const totalRequiredCredits=requiredCreditsPerPerson*emailList.length;

  async function assignBulk(){
    if(!selectedModuleId||emailList.length===0) return;
    setAssigning(true); setAssignMsg(null);
    try{
      const res=await api.post("/api/charge/bulk-assign",{emails:emailList,moduleId:selectedModuleId});
      const parts=[];
      if(res.succeeded.length) parts.push(`✅ ${res.succeeded.length} inscription(s) réussie(s)`);
      if(res.failed.length) parts.push(`⚠️ ${res.failed.length} échec(s) : ${res.failed.map(f=>`${f.email} (${f.reason})`).join(", ")}`);
      setAssignMsg({type:res.failed.length&&!res.succeeded.length?"error":"success",text:parts.join(" — ")});
      setBulkEmails("");
      api.get("/api/auth/me").then(d=>setCredits(d.user.forfaitCredits??0)).catch(()=>{});
      loadCollaborators();
    }catch(err){
      setAssignMsg({type:"error",text:err.message||"Impossible d'inscrire ces collaborateurs."});
    }finally{
      setAssigning(false);
    }
  }

  function exportCsv(){
    window.open(`${API_BASE}/api/charge/export-csv`,"_blank");
  }

  return <div style={{maxWidth:1100,margin:"0 auto",width:"100%",padding:"1.75rem 1.25rem"}}>
    {selectedPack&&<CreditPurchaseModal pack={selectedPack} api={api} user={user} onClose={()=>setSelectedPack(null)} onPurchased={()=>api.get("/api/auth/me").then(d=>setCredits(d.user.forfaitCredits??0)).catch(()=>{})}/>}
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"start",marginBottom:"1.25rem"}}>
      <div><div style={{fontSize:22,fontWeight:800,color:"#1a1a1a"}}>Espace Chargé de formation</div><div style={{fontSize:13,color:"#888",marginTop:3}}>Suivi des formations de vos collaborateurs</div></div>
      <BtnG onClick={exportCsv} style={{fontSize:12}}>⬇ Export CSV</BtnG>
    </div>

    {credits<LOW_CREDIT_THRESHOLD&&<div style={{background:"#FFF8E1",border:"1px solid #FFE082",color:"#E65100",borderRadius:8,padding:"10px 14px",fontSize:13,marginBottom:"1.25rem",fontWeight:600}}>
      ⚠️ Solde de crédits bas ({credits} restants) — pensez à recharger votre forfait pour continuer à inscrire vos collaborateurs.
    </div>}

    <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(130px,1fr))",gap:".875rem",marginBottom:"1.25rem"}}>
      <Metric icon="👥" label="Collaborateurs" value={""+collaborators.length}/>
      <Metric icon="📚" label="Inscriptions actives" value={""+collaborators.reduce((a,c)=>a+c.enrollmentCount,0)}/>
      <Metric icon="🏆" label="Formations terminées" value={""+collaborators.reduce((a,c)=>a+c.completedCount,0)}/>
      <Metric icon="💳" label="Crédits disponibles" value={credits.toLocaleString("fr-FR")}/>
    </div>

    <div style={{marginBottom:"1.25rem"}}><ReferralCard user={user} api={api} onApplied={()=>window.location.reload()}/><AmbassadorEarnings api={api}/></div>

    <div style={{...card,marginBottom:"1.25rem"}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:".875rem"}}>
        <div style={{fontWeight:700,fontSize:15,color:"#1a1a1a"}}>Acheter des crédits</div>
        <span style={{fontSize:12,color:"#888"}}>Solde actuel : <strong style={{color:"#CC1515"}}>{credits.toLocaleString("fr-FR")} crédits</strong></span>
      </div>
      <div style={{fontSize:11,color:"#aaa",marginBottom:".75rem"}}>1 crédit = 1 € HT de formation · prix affichés TTC ({vat.loading?"…":`TVA ${vat.ratePercent}%`}{vat.label?`, ${vat.label}`:""})</div>
      {loadingPacks?<div style={{color:"#aaa",fontSize:13}}>Chargement des lots…</div>:
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(220px,1fr))",gap:".875rem"}}>
        {packs.map(p=>{
          const ttc=ttcFromHt(p.priceCents,vat.ratePercent);
          const unitPrice=(p.priceCents/p.credits/100).toFixed(2);
          return <div key={p.id} style={{border:"1px solid #EBEBEB",borderRadius:10,padding:"1rem",position:"relative"}}>
            {p.discountPercent>0&&<span style={{position:"absolute",top:10,right:10,background:"#FDEAEA",color:"#CC1515",fontSize:10,fontWeight:800,padding:"2px 8px",borderRadius:20}}>-{p.discountPercent}%</span>}
            <div style={{fontSize:13,fontWeight:700,color:"#1a1a1a",marginBottom:4}}>{p.name}</div>
            <div style={{fontSize:24,fontWeight:800,color:"#CC1515"}}>{(ttc/100).toFixed(2)} €<span style={{fontSize:12,fontWeight:400,color:"#aaa"}}> TTC</span></div>
            <div style={{fontSize:11,color:"#888",marginBottom:".75rem"}}>{p.credits.toLocaleString("fr-FR")} crédits · {unitPrice} €HT/crédit</div>
            <BtnR onClick={()=>setSelectedPack(p)} style={{width:"100%",padding:8,fontSize:12,borderRadius:7}}>Acheter ce lot</BtnR>
          </div>;
        })}
      </div>}
    </div>

    <div style={{...card,marginBottom:"1.25rem"}}>
      <div style={{fontWeight:700,fontSize:13,marginBottom:".625rem",color:"#1a1a1a"}}>Inscrire des collaborateurs (en masse)</div>
      <div style={{marginBottom:10}}>
        <label style={{fontSize:12,color:"#444",fontWeight:700,display:"block",marginBottom:4}}>Module</label>
        <select value={selectedModuleId} onChange={e=>setSelectedModuleId(e.target.value)} style={{width:"100%",border:"1.5px solid #D0D0D0",borderRadius:8,padding:"8px 10px",fontSize:12,background:"#fff",color:"#1a1a1a",outline:"none"}}>
          {modules.map(m=><option key={m.id} value={m.id}>{m.title.substring(0,40)} — {Math.ceil(m.priceCentsHt/100)} crédits/pers.</option>)}
        </select>
      </div>
      <div style={{marginBottom:10}}>
        <label style={{fontSize:12,color:"#444",fontWeight:700,display:"block",marginBottom:4}}>Emails des collaborateurs (un par ligne, ou séparés par virgule)</label>
        <textarea value={bulkEmails} onChange={e=>setBulkEmails(e.target.value)} placeholder={"j.bernard@acmegroup.fr\nautre.collegue@acmegroup.fr"} rows={4}
          style={{width:"100%",border:"1.5px solid #D0D0D0",borderRadius:8,padding:"9px 12px",fontSize:13,background:"#fff",color:"#1a1a1a",outline:"none",fontFamily:"inherit",resize:"vertical"}}/>
      </div>
      {selectedModule&&emailList.length>0&&<div style={{fontSize:11,color:"#888",marginBottom:10}}>
        {isFreeModule
          ?<span style={{color:"#2E7D32",fontWeight:700}}>Formation gratuite — 0 crédit consommé</span>
          :<>{emailList.length} collaborateur(s) × {requiredCreditsPerPerson} crédits = <strong style={{color:"#CC1515"}}>{totalRequiredCredits} crédits</strong> {credits<totalRequiredCredits&&<span style={{color:"#CC1515"}}>— solde insuffisant</span>}</>}
      </div>}
      {assignMsg&&<div style={{background:assignMsg.type==="success"?"#E8F5E9":"#FDEAEA",color:assignMsg.type==="success"?"#2E7D32":"#CC1515",borderRadius:7,padding:"7px 10px",fontSize:12,marginBottom:10,fontWeight:600}}>{assignMsg.text}</div>}
      <BtnR onClick={assignBulk} style={{width:"100%",padding:9,fontSize:13,borderRadius:8,opacity:(assigning||emailList.length===0||(!isFreeModule&&credits<totalRequiredCredits))?.6:1}} disabled={assigning||emailList.length===0||(!isFreeModule&&credits<totalRequiredCredits)}>
        {assigning?"Inscription en cours…":isFreeModule?`Inscrire ${emailList.length||""} collaborateur(s) gratuitement`:`Inscrire ${emailList.length||""} collaborateur(s) (${totalRequiredCredits} crédits)`}
      </BtnR>
    </div>

    <div style={card}>
      <div style={{fontWeight:700,marginBottom:".75rem",color:"#1a1a1a"}}>Mes collaborateurs</div>
      {loadingCollabs?<div style={{color:"#aaa",fontSize:13}}>Chargement…</div>:
      collaborators.length===0?<div style={{color:"#aaa",fontSize:13}}>Aucun collaborateur rattaché à votre entreprise pour le moment.</div>:
      <table style={{width:"100%",borderCollapse:"collapse",fontSize:13}}>
        <thead><tr>{["Collaborateur","Email","Inscriptions","Terminées","Dernière activité"].map(h=><th key={h} style={{textAlign:"left",fontSize:11,color:"#aaa",fontWeight:700,padding:"7px 10px",borderBottom:"1px solid #EBEBEB"}}>{h}</th>)}</tr></thead>
        <tbody>{collaborators.map(c=><tr key={c.id}>
          <td style={{padding:"9px 10px",borderBottom:"1px solid #EBEBEB"}}><div style={{display:"flex",alignItems:"center",gap:7}}><div style={{width:26,height:26,background:"#2E7D32",color:"#fff",borderRadius:"50%",display:"flex",alignItems:"center",justifyContent:"center",fontSize:10,fontWeight:800,flexShrink:0}}>{c.name.split(" ").map(w=>w[0]).join("")}</div>{c.name}</div></td>
          <td style={{padding:"9px 10px",borderBottom:"1px solid #EBEBEB",fontSize:12,color:"#888"}}>{c.email}</td>
          <td style={{padding:"9px 10px",borderBottom:"1px solid #EBEBEB"}}>{c.enrollmentCount}</td>
          <td style={{padding:"9px 10px",borderBottom:"1px solid #EBEBEB"}}>{c.completedCount}</td>
          <td style={{padding:"9px 10px",borderBottom:"1px solid #EBEBEB",fontSize:12,color:"#aaa"}}>{c.lastActivity?new Date(c.lastActivity).toLocaleDateString("fr-FR"):"—"}</td>
        </tr>)}</tbody>
      </table>}
    </div>
  </div>;
}


function ApprenantDash({user,onModule,api}){
  const [enrollments,setEnrollments]=useState([]);
  const [loading,setLoading]=useState(true);
  const [error,setError]=useState("");

  useEffect(()=>{
    let active=true;
    api.get("/api/enrollments/me")
      .then(d=>{ if(active){ setEnrollments(d.enrollments); setError(""); } })
      .catch(err=>{ if(active) setError(err.message||"Impossible de charger vos formations."); })
      .finally(()=>{ if(active) setLoading(false); });
    return ()=>{ active=false; };
  },[]);

  const avg=enrollments.length?Math.round(enrollments.reduce((a,e)=>a+e.progressPercent,0)/enrollments.length):0;

  return <div style={{maxWidth:1100,margin:"0 auto",width:"100%",padding:"1.75rem 1.25rem"}}>
    <div style={{marginBottom:"1.25rem"}}><div style={{fontSize:22,fontWeight:800,color:"#1a1a1a"}}>Mon espace formation</div><div style={{fontSize:13,color:"#888",marginTop:3}}>Bonjour {user.name.split(" ")[0]} — continuez votre parcours TutoRisk</div></div>
    {error&&<div style={{background:"#FDEAEA",color:"#CC1515",borderRadius:8,padding:"10px 14px",fontSize:13,marginBottom:"1rem",fontWeight:600}}>{error}</div>}
    <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(130px,1fr))",gap:".875rem",marginBottom:"1.25rem"}}>
      <Metric icon="📚" label="Formations en cours" value={""+enrollments.length}/><Metric icon="🏆" label="Attestations" value="0"/><Metric icon="📈" label="Progression globale" value={avg+"%"}/>
    </div>
    <div style={{marginBottom:"1.25rem"}}><ReferralCard user={user} api={api} onApplied={()=>window.location.reload()}/><AmbassadorEarnings api={api}/></div>
    <div style={{fontWeight:700,marginBottom:".875rem",fontSize:15,color:"#1a1a1a"}}>Mes formations</div>
    {loading?<div style={{color:"#aaa",fontSize:13,padding:"1rem 0"}}>Chargement…</div>:
    <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(270px,1fr))",gap:"1rem"}}>
      {enrollments.map(e=>{
        const [catColor,catBg]=CAT_COLORS[e.category]||["#555","#F5F5F5"];
        return <div key={e.moduleId} onClick={()=>onModule(e.moduleId)} style={{background:"#fff",border:`1px solid ${e.isExpired?"#F5C6C6":"#EBEBEB"}`,borderRadius:10,overflow:"hidden",cursor:"pointer",opacity:e.isExpired?.75:1}}
        onMouseEnter={ev=>{ev.currentTarget.style.transform="translateY(-2px)";ev.currentTarget.style.boxShadow="0 6px 20px rgba(204,21,21,.12)"}}
        onMouseLeave={ev=>{ev.currentTarget.style.transform="none";ev.currentTarget.style.boxShadow="none"}}>
        <div style={{padding:"1.125rem",borderBottom:"1px solid #EBEBEB"}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",gap:6}}>
            <span style={{fontSize:10,fontWeight:700,padding:"2px 9px",borderRadius:20,background:catBg,color:catColor}}>{e.category}</span>
            {e.isExpired&&<span style={{fontSize:10,fontWeight:800,padding:"2px 9px",borderRadius:20,background:"#FDEAEA",color:"#CC1515",whiteSpace:"nowrap"}}>⏳ Périmée</span>}
          </div>
          <div style={{fontSize:14,fontWeight:700,lineHeight:1.4,margin:".5rem 0 .375rem",color:"#1a1a1a"}}>{e.title}</div>
          <div style={{marginTop:".625rem"}}><div style={{display:"flex",justifyContent:"space-between",fontSize:11,color:"#aaa",marginBottom:4}}><span>Progression</span><span style={{color:"#CC1515",fontWeight:700}}>{e.progressPercent}%</span></div><PB value={e.progressPercent} color={e.isExpired?"#bbb":"#CC1515"}/></div>
          {!e.isExpired&&e.expiresAt&&<div style={{fontSize:10,color:"#aaa",marginTop:6}}>Accès jusqu'au {new Date(e.expiresAt).toLocaleDateString("fr-FR")}</div>}
        </div>
        <div style={{padding:".875rem 1.125rem",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
          <div style={{display:"flex",gap:".75rem"}}><span style={{fontSize:11,color:"#888"}}>⏱ {e.durationMin} min</span></div>
          <BtnR style={{fontSize:11,padding:"5px 12px",opacity:e.isExpired?.6:1}}>{e.isExpired?"Voir le détail":e.progressPercent>0?"Continuer":"Commencer"}</BtnR>
        </div>
      </div>;})}
      <div style={{background:"#fff",border:"2px dashed #FDEAEA",borderRadius:10,cursor:"pointer"}}>
        <div style={{padding:"1.125rem",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",textAlign:"center",minHeight:145}}>
          <div style={{width:42,height:42,borderRadius:"50%",background:"#FDEAEA",display:"flex",alignItems:"center",justifyContent:"center",marginBottom:".625rem",fontSize:22,color:"#CC1515",fontWeight:800}}>+</div>
          <div style={{fontSize:14,fontWeight:700,color:"#1a1a1a"}}>Explorer le catalogue</div>
          <div style={{fontSize:12,color:"#666",lineHeight:1.5,marginTop:".375rem"}}>Découvrez d'autres modules et élargissez vos compétences.</div>
        </div>
      </div>
    </div>}
  </div>;
}

function AccountPage({user,api,onUserUpdated,onLogout}){
  const [tab,setTab]=useState("profile");
  const [name,setName]=useState(user.name);
  const [postalCode,setPostalCode]=useState(user.postalCode||"");
  const [currentPassword,setCurrentPassword]=useState("");
  const [newPassword,setNewPassword]=useState("");
  const [saving,setSaving]=useState(false);
  const [saved,setSaved]=useState(false);
  const [error,setError]=useState("");
  const [payments,setPayments]=useState([]);
  const [loadingPayments,setLoadingPayments]=useState(true);
  const [downloadingId,setDownloadingId]=useState(null);
  const [exportingData,setExportingData]=useState(false);
  const [deletingAccount,setDeletingAccount]=useState(false);
  const [confirmDelete,setConfirmDelete]=useState(false);
  const [privacyPolicy,setPrivacyPolicy]=useState(null);
  const isMobile=useIsMobile();
  const card={background:"#fff",border:"1px solid #EBEBEB",borderRadius:10,padding:"1.125rem"};

  useEffect(()=>{
    api.get("/api/payments/me").then(d=>setPayments(d.payments)).catch(()=>{}).finally(()=>setLoadingPayments(false));
    api.get("/api/legal/privacy-policy").then(setPrivacyPolicy).catch(()=>{});
  },[]);

  async function save(){
    setSaving(true); setSaved(false); setError("");
    try{
      const payload={name,postalCode};
      if(newPassword){
        if(!currentPassword){ setError("Renseignez votre mot de passe actuel pour le modifier."); setSaving(false); return; }
        payload.currentPassword=currentPassword;
        payload.newPassword=newPassword;
      }
      const data=await api.put("/api/auth/me",payload);
      onUserUpdated?.(data.user);
      setCurrentPassword(""); setNewPassword("");
      setSaved(true);
      setTimeout(()=>setSaved(false),2000);
    }catch(err){
      setError(err.message||"Erreur lors de l'enregistrement.");
    }finally{
      setSaving(false);
    }
  }

  async function downloadReceipt(p){
    setDownloadingId(p.id);
    try{
      const blob=await api.getBlob(`/api/payments/${p.type}/${p.id}/receipt`);
      const url=window.URL.createObjectURL(blob);
      const a=document.createElement("a");
      a.href=url; a.download=`recu-${p.id.slice(0,8)}.pdf`;
      document.body.appendChild(a); a.click(); a.remove();
      window.URL.revokeObjectURL(url);
    }catch(err){
      alert(err.message||"Impossible de télécharger le reçu.");
    }finally{
      setDownloadingId(null);
    }
  }

  async function exportData(){
    setExportingData(true);
    try{
      const blob=await api.getBlob("/api/auth/me/export");
      const url=window.URL.createObjectURL(blob);
      const a=document.createElement("a");
      a.href=url; a.download=`mes-donnees-tutorisk-${new Date().toISOString().slice(0,10)}.json`;
      document.body.appendChild(a); a.click(); a.remove();
      window.URL.revokeObjectURL(url);
    }catch(err){ alert(err.message||"Impossible d'exporter les données."); }
    finally{ setExportingData(false); }
  }

  async function deleteAccount(){
    setDeletingAccount(true);
    try{
      await api.del("/api/auth/me");
      onLogout?.();
    }catch(err){ alert(err.message||"Impossible de supprimer le compte."); setDeletingAccount(false); setConfirmDelete(false); }
  }

  return <div style={{maxWidth:760,margin:"0 auto",width:"100%",padding:isMobile?"1.25rem .75rem":"1.75rem 1.25rem"}}>
    <div style={{marginBottom:"1.25rem"}}><div style={{fontSize:22,fontWeight:800,color:"#1a1a1a"}}>Mon compte</div><div style={{fontSize:13,color:"#888",marginTop:3}}>Gérez vos informations personnelles et vos droits RGPD</div></div>

    <div style={{display:"flex",gap:6,marginBottom:"1.25rem",flexWrap:"wrap"}}>
      {[["profile","👤 Profil"],["payments","🧾 Paiements"],["gdpr","🔒 Mes droits RGPD"]].map(([k,l])=>
        <button key={k} onClick={()=>setTab(k)} style={{border:`1px solid ${tab===k?"#CC1515":"#E0E0E0"}`,background:tab===k?"#CC1515":"#fff",borderRadius:20,padding:"6px 14px",fontSize:12,cursor:"pointer",color:tab===k?"#fff":"#555",fontWeight:tab===k?700:500}}>{l}</button>
      )}
    </div>

    {tab==="profile"&&<>
    <div style={{...card,marginBottom:"1.25rem"}}>
      <div style={{fontWeight:700,fontSize:15,marginBottom:".875rem",color:"#1a1a1a"}}>Informations personnelles</div>
      <Input label="Nom complet" value={name} onChange={e=>setName(e.target.value)}/>
      <Input label="Adresse e-mail" value={user.email} disabled/>
      <Input label="Code postal (utilisé pour le calcul de la TVA)" value={postalCode} onChange={e=>setPostalCode(e.target.value)} placeholder="ex : 75001, 97100, 97133…"/>
      <div style={{borderTop:"1px solid #F0F0F0",margin:"1rem 0",paddingTop:"1rem"}}>
        <div style={{fontSize:13,fontWeight:700,color:"#1a1a1a",marginBottom:8}}>Changer de mot de passe</div>
        <Input label="Mot de passe actuel" type="password" value={currentPassword} onChange={e=>setCurrentPassword(e.target.value)} placeholder="Laisser vide pour ne pas changer"/>
        <Input label="Nouveau mot de passe" type="password" value={newPassword} onChange={e=>setNewPassword(e.target.value)} placeholder="Au moins 8 caractères"/>
      </div>
      {error&&<div style={{background:"#FDEAEA",color:"#CC1515",borderRadius:7,padding:"8px 12px",fontSize:12,marginBottom:10,fontWeight:600}}>{error}</div>}
      <div style={{display:"flex",alignItems:"center",gap:10}}>
        <BtnR onClick={save} style={{fontSize:13,padding:"9px 18px",opacity:saving?.6:1}}>{saving?"Enregistrement…":"Enregistrer"}</BtnR>
        {saved&&<span style={{fontSize:12,color:"#2E7D32",fontWeight:600}}>✅ Enregistré</span>}
      </div>
    </div>
    </>}

    {tab==="payments"&&<div style={card}>
      <div style={{fontWeight:700,fontSize:15,marginBottom:".875rem",color:"#1a1a1a"}}>Historique des paiements</div>
      {loadingPayments?<div style={{color:"#aaa",fontSize:13}}>Chargement…</div>:
      payments.length===0?<div style={{color:"#aaa",fontSize:13}}>Aucun paiement pour le moment.</div>:
      <div style={{display:"flex",flexDirection:"column",gap:8}}>
        {payments.map(p=>
          <div key={p.type+p.id} style={{display:"flex",justifyContent:"space-between",alignItems:"center",border:"1px solid #EBEBEB",borderRadius:8,padding:"10px 14px",flexWrap:"wrap",gap:8}}>
            <div>
              <div style={{fontSize:13,fontWeight:700,color:"#1a1a1a"}}>{p.label}</div>
              <div style={{fontSize:11,color:"#888",marginTop:2}}>{new Date(p.createdAt).toLocaleDateString("fr-FR")} · {p.paymentMethod==="card"?"Carte":"Virement"} · <St s={p.status==="paid"?"Terminé":p.status==="pending"?"En cours":"Non commencé"}/></div>
            </div>
            <div style={{display:"flex",alignItems:"center",gap:10}}>
              <div style={{textAlign:"right"}}>
                <div style={{fontSize:14,fontWeight:800,color:"#CC1515"}}>{(p.amountCentsTtc/100).toFixed(2)} €</div>
                <div style={{fontSize:10,color:"#aaa"}}>TTC · TVA {p.vatRatePercent}%{p.referralDiscountPercent>0?` · -${p.referralDiscountPercent}% ambassadeur`:""}</div>
              </div>
              {p.status==="paid"&&<BtnG onClick={()=>downloadReceipt(p)} style={{fontSize:11,opacity:downloadingId===p.id?.6:1}}>{downloadingId===p.id?"…":"⬇ Reçu"}</BtnG>}
            </div>
          </div>
        )}
      </div>}
    </div>}

    {tab==="gdpr"&&<div style={{display:"flex",flexDirection:"column",gap:"1rem"}}>
      <div style={card}>
        <div style={{fontWeight:700,fontSize:15,marginBottom:".875rem",color:"#1a1a1a"}}>🔒 Vos droits RGPD</div>
        <div style={{fontSize:13,color:"#666",lineHeight:1.7,marginBottom:"1rem"}}>
          Conformément au Règlement Général sur la Protection des Données (RGPD), vous disposez des droits suivants sur vos données personnelles.
          <br/>Pour toute question : <a href="mailto:privacy@tutorisk.com" style={{color:"#CC1515",fontWeight:700}}>privacy@tutorisk.com</a>
          {user.consentAcceptedAt&&<div style={{fontSize:11,color:"#888",marginTop:8}}>Consentement accepté le {new Date(user.consentAcceptedAt).toLocaleDateString("fr-FR")} (version CGU {user.termsVersion||"1.0"})</div>}
        </div>

        <div style={{display:"flex",flexDirection:"column",gap:10}}>
          <div style={{border:"1px solid #EBEBEB",borderRadius:9,padding:"1rem"}}>
            <div style={{fontWeight:700,fontSize:13,marginBottom:6,color:"#1a1a1a"}}>📤 Droit à la portabilité (Art. 20 RGPD)</div>
            <div style={{fontSize:12,color:"#666",marginBottom:10}}>Téléchargez l'ensemble de vos données personnelles dans un fichier JSON lisible par machine : profil, inscriptions, paiements, progression.</div>
            <BtnR onClick={exportData} style={{fontSize:12,padding:"8px 16px",opacity:exportingData?.6:1}}>{exportingData?"Préparation…":"⬇ Exporter mes données"}</BtnR>
          </div>

          <div style={{border:"1px solid #EBEBEB",borderRadius:9,padding:"1rem"}}>
            <div style={{fontWeight:700,fontSize:13,marginBottom:6,color:"#1a1a1a"}}>✏️ Droit de rectification (Art. 16 RGPD)</div>
            <div style={{fontSize:12,color:"#666"}}>Modifiez vos informations personnelles à tout moment depuis l'onglet <strong>Profil</strong>.</div>
          </div>

          <div style={{border:"1px solid #FDEAEA",borderRadius:9,padding:"1rem",background:"#FFFAFA"}}>
            <div style={{fontWeight:700,fontSize:13,marginBottom:6,color:"#CC1515"}}>🗑 Droit à l'effacement (Art. 17 RGPD)</div>
            <div style={{fontSize:12,color:"#666",marginBottom:10}}>Supprimez votre compte et pseudonymisez vos données personnelles. Vos données de facturation sont conservées 10 ans conformément à l'obligation légale (Art. L123-22 Code de commerce). Vos attestations obtenues restent disponibles sur demande à privacy@tutorisk.com.</div>
            {!confirmDelete
              ?<BtnG onClick={()=>setConfirmDelete(true)} style={{fontSize:12,color:"#CC1515",borderColor:"#FDEAEA"}}>Supprimer mon compte</BtnG>
              :<div style={{background:"#FDEAEA",borderRadius:8,padding:"1rem"}}>
                <div style={{fontWeight:700,fontSize:13,color:"#CC1515",marginBottom:8}}>⚠️ Cette action est irréversible</div>
                <div style={{fontSize:12,color:"#7A0A0A",marginBottom:12}}>Votre compte sera immédiatement pseudonymisé et vous serez déconnecté. Vos formations et votre progression seront perdues.</div>
                <div style={{display:"flex",gap:8}}>
                  <BtnG onClick={()=>setConfirmDelete(false)} style={{flex:1}}>Annuler</BtnG>
                  <button onClick={deleteAccount} disabled={deletingAccount} style={{flex:1,background:"#CC1515",color:"#fff",border:"none",borderRadius:8,padding:"9px",fontSize:12,cursor:"pointer",fontWeight:700,opacity:deletingAccount?.6:1}}>{deletingAccount?"Suppression…":"Confirmer la suppression"}</button>
                </div>
              </div>}
          </div>
        </div>
      </div>

      {privacyPolicy&&<div style={card}>
        <div style={{fontWeight:700,fontSize:15,marginBottom:".875rem",color:"#1a1a1a"}}>📄 Politique de confidentialité</div>
        <div style={{fontSize:11,color:"#aaa",marginBottom:"1rem"}}>Version {privacyPolicy.version} — mise à jour le {privacyPolicy.last_updated}</div>
        {privacyPolicy.content.sections.map(s=><div key={s.id} style={{marginBottom:"1rem"}}>
          <div style={{fontWeight:700,fontSize:13,color:"#1a1a1a",marginBottom:6}}>{s.title}</div>
          <div style={{fontSize:12,color:"#555",lineHeight:1.7,whiteSpace:"pre-line"}}>{s.text}</div>
        </div>)}
      </div>}
    </div>}
  </div>;
}

export default function App(){
  const [page,setPage]=useState("home");
  const [user,setUser]=useState(null);
  const [showLogin,setShowLogin]=useState(false);
  const [selModId,setSelModId]=useState(null);
  const [authChecked,setAuthChecked]=useState(false);

  const tokenRef=useRef(null);
  const api=useMemo(()=>createApiClient(tokenRef),[]);

  // Styles globaux pour le rendu du texte enrichi (H2, H3, listes…)
  if(typeof document!=="undefined"&&!document.getElementById("tutorisk-richtext-css")){
    const s=document.createElement("style");
    s.id="tutorisk-richtext-css";
    s.textContent=`
      .tr-text h2{font-size:1.2rem;font-weight:800;margin:.75rem 0 .375rem;color:#1a1a1a}
      .tr-text h3{font-size:1rem;font-weight:700;margin:.625rem 0 .25rem;color:#1a1a1a}
      .tr-text ul{padding-left:1.5rem;margin:.5rem 0;list-style:disc}
      .tr-text ol{padding-left:1.5rem;margin:.5rem 0;list-style:decimal}
      .tr-text li{margin-bottom:.25rem}
      .tr-text hr{border:none;border-top:1px solid #E8E8E8;margin:1rem 0}
      .tr-text strong,.tr-text b{font-weight:700}
      .tr-text em,.tr-text i{font-style:italic}
      .tr-text u{text-decoration:underline}
      .tr-text p{margin:.375rem 0}
    `;
    document.head.appendChild(s);
  }

  // Au chargement de l'app, on tente de restaurer la session via le cookie httpOnly
  // de rafraîchissement (l'access token n'est jamais conservé entre les rechargements de page).
  useEffect(()=>{
    (async()=>{
      try{
        const res=await fetch(`${API_BASE}/api/auth/refresh`,{method:"POST",credentials:"include"});
        if(res.ok){
          const data=await res.json();
          tokenRef.current=data.accessToken;
          setUser(data.user);
        }
      }catch{/* pas de session active */}
      finally{ setAuthChecked(true); }
    })();
  },[]);

  const handleLogin=(u,accessToken)=>{
    tokenRef.current=accessToken;
    setUser(u);
    setPage("dashboard");
  };
  const handleLogout=async()=>{
    try{ await api.post("/api/auth/logout"); }catch{/* déjà déconnecté côté serveur */}
    tokenRef.current=null;
    setUser(null);
    setPage("home");
  };
  const handleModule=id=>{setSelModId(id);setPage("module");};

  if(!authChecked) return <div style={{minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",color:"#aaa",fontSize:13}}>Chargement…</div>;

  // Pages corporate (visibles sans être connecté)
  const CORPORATE_PAGES=["home","a-propos","nos-activites","activite-sst","activite-aleas","activite-risques","activite-collectivites","formation-presentielle","conseil-audit","contact"];
  const isCorporate=CORPORATE_PAGES.includes(page);

  return <div style={{minHeight:"100vh",display:"flex",flexDirection:"column",background:isCorporate?"#fff":"#F7F7F7"}}>
    <Navbar page={page} setPage={setPage} user={user} onLogin={()=>setShowLogin(true)} onLogout={handleLogout}/>
    {showLogin&&<LoginModal onLogin={handleLogin} onClose={()=>setShowLogin(false)} api={api}/>}

    {/* ── Pages corporate ── */}
    {page==="home"&&<HomePage onCatalog={()=>setPage("catalog")} onLogin={()=>setShowLogin(true)} user={user} api={api} setPage={setPage}/>}
    {page==="a-propos"&&<AProposPage setPage={setPage}/>}
    {page==="nos-activites"&&<NosActivitesPage setPage={setPage}/>}
    {["activite-sst","activite-aleas","activite-risques","activite-collectivites"].includes(page)&&<ActiviteDetailPage actId={page} setPage={setPage}/>}
    {page==="formation-presentielle"&&<FormationPresentielPage setPage={setPage}/>}
    {page==="conseil-audit"&&<ConseilAuditPage setPage={setPage}/>}
    {page==="contact"&&<ContactPage api={api}/>}

    {/* ── LCMS ── */}
    {page==="catalog"&&<CatalogPage onModule={handleModule} user={user} api={api}/>}
    {page==="module"&&selModId&&<ModuleDetail moduleId={selModId} onBack={()=>setPage("catalog")} user={user} api={api}/>}
    {page==="account"&&user&&<AccountPage user={user} api={api} onUserUpdated={setUser} onLogout={handleLogout}/>}
    {page==="dashboard"&&user&&<>
      <BannerStrip api={api} page="dashboard"/>
      {user.role==="admin"&&<AdminDash api={api} user={user}/>}
      {user.role==="pedagogue"&&<PedagogueDash user={user} api={api}/>}
      {user.role==="formateur"&&<FormateurDash/>}
      {user.role==="charge"&&<ChargeDash user={user} api={api}/>}
      {user.role==="apprenant"&&<ApprenantDash user={user} onModule={handleModule} api={api}/>}
    </>}

    {/* ── Footer ── */}
    <footer style={{background:"#0F1923",color:"rgba(255,255,255,.55)",marginTop:"auto"}}>
      <div style={{maxWidth:1300,margin:"0 auto",padding:"3rem 2rem",display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(200px,1fr))",gap:"2rem"}}>
        {/* Colonne marque */}
        <div>
          <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:"1rem"}}>
            <div style={{background:"#fff",borderRadius:10,padding:"8px 12px",display:"inline-flex",alignItems:"center"}}><LogoLockup height={30}/></div>
          </div>
          <p style={{fontSize:12.5,lineHeight:1.7,marginBottom:"1rem"}}>Le spécialiste de la formation en gestion des risques depuis 2002.</p>
          <a href="https://linkedin.com/company/tutorisk" target="_blank" rel="noreferrer" style={{display:"inline-flex",alignItems:"center",gap:6,color:"rgba(255,255,255,.65)",fontSize:12,textDecoration:"none"}}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M16 8a6 6 0 016 6v7h-4v-7a2 2 0 00-2-2 2 2 0 00-2 2v7h-4v-7a6 6 0 016-6zM2 9h4v12H2z"/><circle cx="4" cy="4" r="2"/></svg>
            LinkedIn
          </a>
        </div>
        {/* Colonne activités */}
        <div>
          <div style={{fontSize:11,color:"rgba(255,255,255,.4)",fontWeight:700,letterSpacing:1,textTransform:"uppercase",marginBottom:"1rem"}}>Nos activités</div>
          {[["nos-activites","Vue d'ensemble"],["activite-sst","Santé & sécurité au travail"],["activite-aleas","Aléas naturels"],["activite-risques","Risques technologiques"],["activite-collectivites","Collectivités (PCS/PICS)"]].map(([p,l])=>
            <button key={p} onClick={()=>setPage(p)} style={{display:"block",background:"none",border:"none",color:"rgba(255,255,255,.55)",fontSize:12.5,cursor:"pointer",padding:"3px 0",textAlign:"left",transition:"color .15s"}} onMouseEnter={e=>e.target.style.color="#fff"} onMouseLeave={e=>e.target.style.color="rgba(255,255,255,.55)"}>{l}</button>)}
        </div>
        {/* Colonne services */}
        <div>
          <div style={{fontSize:11,color:"rgba(255,255,255,.4)",fontWeight:700,letterSpacing:1,textTransform:"uppercase",marginBottom:"1rem"}}>Nos services</div>
          {[["formation-presentielle","Formation présentielle"],["conseil-audit","Conseil & audit"],["catalog","Formation en ligne 🎓"],["contact","Demander un devis"]].map(([p,l])=>
            <button key={p} onClick={()=>setPage(p)} style={{display:"block",background:"none",border:"none",color:"rgba(255,255,255,.55)",fontSize:12.5,cursor:"pointer",padding:"3px 0",textAlign:"left"}} onMouseEnter={e=>e.target.style.color="#fff"} onMouseLeave={e=>e.target.style.color="rgba(255,255,255,.55)"}>{l}</button>)}
        </div>
        {/* Colonne contact */}
        <div>
          <div style={{fontSize:11,color:"rgba(255,255,255,.4)",fontWeight:700,letterSpacing:1,textTransform:"uppercase",marginBottom:"1rem"}}>Contact</div>
          <div style={{fontSize:12.5,lineHeight:2}}>
            <div><a href="mailto:contact@tutorisk.com" style={{color:"rgba(255,255,255,.65)",textDecoration:"none"}}>✉ contact@tutorisk.com</a></div>
            <div><a href="https://www.tutorisk.fr" target="_blank" rel="noreferrer" style={{color:"rgba(255,255,255,.65)",textDecoration:"none"}}>🌐 www.tutorisk.fr</a></div>
          </div>
          <div style={{marginTop:"1.25rem"}}>
            <button onClick={()=>setPage("contact")} style={{background:"#CC1515",color:"#fff",border:"none",borderRadius:7,padding:"8px 16px",fontSize:12,fontWeight:700,cursor:"pointer"}}>Nous contacter</button>
          </div>
        </div>
      </div>
      <div style={{borderTop:"1px solid rgba(255,255,255,.08)",padding:"1.25rem 2rem",display:"flex",justifyContent:"space-between",alignItems:"center",flexWrap:"wrap",gap:8,maxWidth:1300,margin:"0 auto"}}>
        <p style={{fontSize:11,margin:0}}>© 2026 TutoRisk (ABC Sécurité) · Tous droits réservés</p>
        <div style={{display:"flex",gap:"1.5rem"}}>
          {[["account","Politique de confidentialité"],["account","Mentions légales"]].map(([p,l])=>
            <span key={l} onClick={()=>user?setPage(p):setShowLogin(true)} style={{fontSize:11,cursor:"pointer",textDecoration:"underline"}}>{l}</span>)}
        </div>
      </div>
    </footer>
  </div>;
}
