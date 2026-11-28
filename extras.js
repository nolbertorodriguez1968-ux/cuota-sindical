const cargar=s=>new Promise((r,j)=>{const e=document.createElement("script");e.src=s;e.onload=r;e.onerror=j;document.head.append(e)});
const CUILRE=/\b(?:20|23|24|25|26|27|30|33|34)[-\s]?\d{8}[-\s]?\d\b/g;
const cuilOk=c=>{if(c.length!=11)return false;const w=[5,4,3,2,7,6,5,4,3,2];let s=0;for(let i=0;i<10;i++)s+=w[i]*+c[i];let d=11-s%11;if(d==11)d=0;return d==+c[10]};
async function leer(f){
 const n=f.name.toLowerCase();
 if(/\.(xlsx|xls|csv)$/.test(n)){await cargar("https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js");const wb=XLSX.read(await f.arrayBuffer());return wb.SheetNames.flatMap(s=>XLSX.utils.sheet_to_json(wb.Sheets[s],{header:1,defval:""}).map(r=>r.join(" ")))}
 if(n.endsWith(".pdf")){await cargar("https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js");pdfjsLib.GlobalWorkerOptions.workerSrc="https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";const d=await pdfjsLib.getDocument({data:await f.arrayBuffer()}).promise,L=[];
  for(let i=1;i<=d.numPages;i++){const t=await(await d.getPage(i)).getTextContent(),m={};t.items.forEach(x=>{(m[Math.round(x.transform[5]/3)]??=[]).push(x)});Object.keys(m).sort((a,b)=>b-a).forEach(y=>L.push(m[y].sort((a,b)=>a.transform[4]-b.transform[4]).map(x=>x.str).join(" ")))}return L}
 if(f.type.startsWith("image/")){await cargar("https://cdn.jsdelivr.net/npm/tesseract.js@5.1.0/dist/tesseract.min.js");aviso("Leyendo la imagen, puede tardar un momento…");return(await Tesseract.recognize(f,"spa")).data.text.split("\n")}
 throw new Error("Formato no admitido")}
function parsear(L){const m={};L.forEach(l=>(l.match(CUILRE)||[]).forEach(x=>{const c=solo(x);m[c]??={cuil:c,nombre:l.replace(CUILRE,"").replace(/[^A-Za-zÁÉÍÓÚÑáéíóúñ ,.']/g," ").replace(/\s+/g," ").trim()}}));return Object.values(m)}
const clave=()=>{const a="abcdefghjkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789";return[...crypto.getRandomValues(new Uint8Array(10))].map(n=>a[n%a.length]).join("")};
const FA="accept='.xlsx,.xls,.csv,.pdf,image/*'";
let UID=null;

function login(){app.innerHTML=`<div class="card" style="max-width:360px;margin:40px auto;text-align:center"><div class="login-logo"><b>SOETRA</b><small>FATREFU</small></div><h2 style="margin:0">SOETRA FATREFU</h2><p class="mut">Cuotas sindicales</p><div style="text-align:left"><label>Correo</label><input id="em" type="email" autocomplete="username"><label style="margin-top:8px">Contraseña</label><input id="pw" type="password" autocomplete="current-password"></div><p><button id="go" style="width:100%">Ingresar</button></p><button class="sec" id="sol" style="width:100%">Solicitar acceso (RRHH / Contador)</button></div>`;
 const entrar=async()=>{const {error}=await sb.auth.signInWithPassword({email:$("#em").value.trim(),password:$("#pw").value});if(error)return aviso("No se pudo ingresar: "+error.message);boot()};
 $("#go").onclick=entrar;$("#pw").onkeydown=e=>{if(e.key=="Enter")entrar()};$("#sol").onclick=solicitud}
function solicitud(){app.innerHTML=`<div class="card" style="max-width:380px;margin:30px auto"><h2 style="margin-top:0">Solicitar acceso</h2><label>Nombre y apellido</label><input id="sn"><label style="margin-top:8px">Correo</label><input id="se" type="email"><label style="margin-top:8px">Función</label><select id="sf"><option>RRHH</option><option>CONTADOR</option></select><label style="margin-top:8px">WhatsApp (con código de área, sin 0 ni 15)</label><input id="st" inputmode="tel" placeholder="3512345678"><p><button id="ss" style="width:100%">Enviar solicitud</button></p><button class="sec" id="sv" style="width:100%">Volver</button></div>`;
 $("#sv").onclick=login;$("#ss").onclick=async()=>{const x={nombre:$("#sn").value.trim(),email:$("#se").value.trim().toLowerCase(),funcion:$("#sf").value,telefono:solo($("#st").value)};
  if(!x.nombre||!/^\S+@\S+\.\S+$/.test(x.email)||x.telefono.length<8)return aviso("Completá nombre, correo válido y WhatsApp");
  const {error}=await sb.from("solicitudes").insert(x);if(error)return aviso("Error: "+error.message);
  app.innerHTML='<div class="card" style="max-width:380px;margin:40px auto">Solicitud enviada. El administrador te enviará tu clave por correo o WhatsApp.<p><button id="sv">Volver</button></p></div>';$("#sv").onclick=login}}

async function boot(){
 const {data:{session}}=await sb.auth.getSession();if(!session)return login();
 UID=session.user.id;SUPER=(session.user.email||"").toLowerCase()===ADMIN_EMAIL.toLowerCase();
 $("#salir").hidden=false;$("#quien").textContent=session.user.email;
 if(SUPER){ENTS=await ok(sb.from("entidades").select("*").order("id"));E=ENTS.find(x=>x.id===(E&&E.id))||ENTS[0];
  $("#rolBadge").innerHTML='<span class="tag">★ ADMINISTRADOR</span>';
  $("#entSel").innerHTML='<select id="selE" aria-label="Entidad">'+ENTS.map(x=>`<option value="${x.id}" ${x.id===E.id?"selected":""}>${esc(x.nombre)}</option>`).join("")+"</select>";
  $("#selE").onchange=e=>{E=ENTS.find(x=>x.id==e.target.value);staff()};return staff()}
 const {data:p,error}=await sb.from("perfiles").select("*").eq("id",UID).maybeSingle();
 if(error)return aviso("Error: "+error.message);
 if(!p){app.innerHTML='<div class="card">Tu usuario todavía no tiene acceso asignado. Pedíselo al administrador.</div>';return}
 P=p;$("#rolBadge").innerHTML=`<span class="tag">${esc(p.rol)}</span>`;
 if(p.rol=="rrhh"||p.rol=="contador"){ENTS=await ok(sb.from("entidades").select("*").order("id"));$("#tit").textContent="Declaración de cuotas";tab="emp";return empresaUI()}
 E=await ok(sb.from("entidades").select("*").eq("id",p.entidad_id).single());$("#tit").textContent=E.nombre;
 p.rol=="afiliado"?portal():staff()}

function navegar(t,fn){if(!t.some(x=>x[0]==tab))tab=t[0][0];app.innerHTML=`<nav>${t.map(([k,n])=>`<button class="${tab==k?"on":"sec"}" data-t="${k}">${n}</button>`).join("")}</nav><div id="vista"></div>`;app.querySelectorAll("nav button").forEach(b=>b.onclick=()=>{tab=b.dataset.t;fn()})}
function staff(){$("#tit").textContent=SUPER?"Panel Administrador":E.nombre;
 const t=[["cuotas","Cuotas y morosos"],["afiliados","Afiliados"],["pagos","Pagos"]];if(SUPER)t.push(["solic","Solicitudes"],["cobro","CBU y %"],["admin","★ Administración"]);
 navegar(t,staff);({cuotas:vCuotas,afiliados:vAfiliados,pagos:vPagos,solic:vSolic,cobro:vCobro,admin:vAdmin})[tab]()}
function empresaUI(){navegar([["emp","Mi empresa"],["decl","Declaración mensual"]],empresaUI);(tab=="emp"?vEmp:vDecl)()}

// ---- Admin: padrón por Excel / PDF / foto ----
const _vA=vAfiliados;
vAfiliados=async()=>{await _vA();
 $("#vista").insertAdjacentHTML("afterbegin",`<div class="card"><b>Cargar padrón desde Excel, PDF o foto</b> <span class="mut">(se carga en ${esc(E.nombre)})</span><div class="row"><input id="pf1" type="file" ${FA}><button id="pl">Leer archivo</button></div><div id="pv"></div></div>`);
 $("#pl").onclick=async()=>{const f=$("#pf1").files[0];if(!f)return aviso("Elegí un archivo");
  try{const r=parsear(await leer(f));
   $("#pv").innerHTML=r.length?`<div class="wrap"><table><tr><th></th><th>CUIL</th><th>Nombre (editable)</th></tr>${r.map((x,i)=>`<tr><td><input type="checkbox" data-i="${i}" ${cuilOk(x.cuil)?"checked":""}></td><td class="${cuilOk(x.cuil)?"":"bad"}">${x.cuil}</td><td><input data-n="${i}" value="${esc(x.nombre)}"></td></tr>`).join("")}</table></div><p class="mut">En rojo: CUIL inválido (sin marcar). Revisá antes de importar.</p><p><button id="pi">Importar seleccionados</button></p>`:"No se encontraron CUIL en el archivo.";
   if($("#pi"))$("#pi").onclick=async()=>{const rows=[...$("#pv").querySelectorAll("[data-i]:checked")].map(c=>({entidad_id:E.id,cuil:r[c.dataset.i].cuil,nombre:$(`#pv [data-n="${c.dataset.i}"]`).value.trim()||"Sin nombre"}));
    await ok(sb.from("afiliados").upsert(rows,{onConflict:"entidad_id,cuil"}));aviso(rows.length+" afiliados importados");vAfiliados()}
  }catch(e){aviso("No se pudo leer el archivo: "+e.message)}}};

// ---- Admin: solicitudes ----
function credenciales(x,pw){const u=location.href.split("#")[0].replace(/[^/]*$/,""),m=`Hola ${x.nombre||""}, tu acceso a Cuotas Sindicales SOETRA / FATREFU está habilitado.\nIngresá en: ${u}\nUsuario: ${x.email}\nClave: ${pw}`;let t=solo(x.telefono).replace(/^0/,"");t=t.startsWith("54")?t:"549"+t;
 $("#cred").innerHTML=`<div class="card"><b>Acceso creado</b><p>Usuario: <b>${esc(x.email)}</b> · Clave: <b>${pw}</b></p><a href="https://wa.me/${t}?text=${encodeURIComponent(m)}" target="_blank"><button>Enviar por WhatsApp</button></a> <a href="mailto:${esc(x.email)}?subject=${encodeURIComponent("Acceso a Cuotas Sindicales")}&body=${encodeURIComponent(m)}"><button class="sec">Enviar por correo</button></a><p class="mut">Anotá la clave: no se vuelve a mostrar.</p></div>`}
async function vSolic(cr){const s=await ok(sb.from("solicitudes").select("*").order("creado",{ascending:false}));
 $("#vista").innerHTML=`<div id="cred"></div><div class="card wrap"><b>Solicitudes de acceso</b><table><tr><th>Fecha</th><th>Nombre</th><th>Correo</th><th>Función</th><th>WhatsApp</th><th>Estado</th><th></th></tr>${s.map(x=>`<tr><td>${x.creado.slice(0,10)}</td><td>${esc(x.nombre)}</td><td>${esc(x.email)}</td><td>${x.funcion}</td><td>${esc(x.telefono)}</td><td>${x.estado}</td><td>${x.estado=="pendiente"?`<button data-a="${x.id}">Aprobar y crear clave</button> <button class="sec" data-r="${x.id}">Rechazar</button>`:""}</td></tr>`).join("")||"<tr><td colspan=7>Sin solicitudes.</td></tr>"}</table></div>`;
 if(cr)credenciales(cr[0],cr[1]);
 $("#vista").querySelectorAll("[data-a]").forEach(b=>b.onclick=async()=>{const x=s.find(q=>q.id==b.dataset.a),pw=clave();
  const {data,error}=await sb.functions.invoke("crear-usuario",{body:{email:x.email,password:pw,rol:x.funcion.toLowerCase(),telefono:x.telefono,solicitud_id:x.id}});
  if(error||data?.error)return aviso("Error: "+(data?.error||error.message));vSolic([x,pw])});
 $("#vista").querySelectorAll("[data-r]").forEach(b=>b.onclick=async()=>{await ok(sb.from("solicitudes").update({estado:"rechazada"}).eq("id",b.dataset.r));vSolic()})}

async function vCobro(){ENTS=await ok(sb.from("entidades").select("*").order("id"));
 $("#vista").innerHTML=`<div class="card"><b>CBU de depósito y porcentaje de cada entidad</b>${ENTS.map(x=>`<div class="row" style="margin-top:8px"><div><label>${esc(x.nombre)} · CBU (22 dígitos)</label><input data-c="${x.id}" inputmode="numeric" value="${esc(x.cbu||"")}"></div><div><label>% sobre remuneración bruta</label><input data-p="${x.id}" type="number" step="0.01" value="${x.porcentaje??""}"></div><button data-g="${x.id}">Guardar</button></div>`).join("")}</div>`;
 $("#vista").querySelectorAll("[data-g]").forEach(b=>b.onclick=async()=>{const id=b.dataset.g,c=solo($(`[data-c="${id}"]`).value);if(c&&c.length!=22)return aviso("El CBU debe tener 22 dígitos");
  await ok(sb.from("entidades").update({cbu:c||null,porcentaje:$(`[data-p="${id}"]`).value||null}).eq("id",id));aviso("Guardado")})}

// ---- RRHH / Contador ----
async function vEmp(){const em=await ok(sb.from("empresas").select("*").order("razon_social"));
 $("#vista").innerHTML=`<div class="card"><b>Datos de la empresa</b><div class="row"><div><label>Razón social</label><input id="er"></div><div><label>CUIT</label><input id="ec" inputmode="numeric"></div><div><label>CBU de la cuenta de origen</label><input id="eb" inputmode="numeric"></div><button id="eg">Guardar</button></div></div><div class="card wrap"><table><tr><th>Empresa</th><th>CUIT</th><th>CBU origen</th><th></th></tr>${em.map(x=>`<tr><td>${esc(x.razon_social)}</td><td>${x.cuit}</td><td>${x.cbu_origen}</td><td><button class="sec" data-e="${x.id}">Editar</button></td></tr>`).join("")||"<tr><td colspan=4>Cargá tu primera empresa.</td></tr>"}</table></div>`;
 let id=null;
 $("#vista").querySelectorAll("[data-e]").forEach(b=>b.onclick=()=>{const x=em.find(q=>q.id==b.dataset.e);id=x.id;$("#er").value=x.razon_social;$("#ec").value=x.cuit;$("#eb").value=x.cbu_origen;scrollTo(0,0)});
 $("#eg").onclick=async()=>{const d={razon_social:$("#er").value.trim(),cuit:solo($("#ec").value),cbu_origen:solo($("#eb").value)};
  if(!d.razon_social||d.cuit.length!=11||d.cbu_origen.length!=22)return aviso("Revisá: razón social, CUIT (11 dígitos) y CBU (22 dígitos)");
  await ok(id?sb.from("empresas").update(d).eq("id",id):sb.from("empresas").insert(d));aviso("Empresa guardada");vEmp()}}

const r2=n=>Math.round(n*100)/100;
function boleta(en,emp,per,it){const p=+en.porcentaje||0,r=it.filter(x=>+x.rem>0).map(x=>({...x,c:Math.round(x.rem*p)/100})),t=r2(r.reduce((s,x)=>s+x.c,0)),w=window.open("","_blank");
 w.document.write(`<html><head><title>Boleta ${esc(en.nombre)}</title><style>body{font:14px system-ui,sans-serif;margin:30px;color:#14213d}table{width:100%;border-collapse:collapse}td,th{border-bottom:1px solid #ccc;padding:5px;text-align:left}.t{font-size:22px;font-weight:700}</style></head><body><h1>BOLETA DE DEPÓSITO · ${esc(en.nombre)}</h1><p>Cuota sindical ${p}% sobre remuneración bruta · Período ${esc(per)}</p><p><b>Empresa:</b> ${esc(emp.razon_social)} · CUIT ${emp.cuit}<br><b>CBU de origen:</b> ${emp.cbu_origen}<br><b>Depositar en CBU de ${esc(en.nombre)}:</b> ${esc(en.cbu||"(no informado: consultar al sindicato)")}<br><b>Referencia:</b> ${emp.cuit}-${per.replace("-","")}-${esc(en.nombre)}</p><table><tr><th>CUIL</th><th>Afiliado</th><th>Remuneración bruta</th><th>Cuota</th></tr>${r.map(x=>`<tr><td>${x.cuil}</td><td>${esc(x.nombre)}</td><td>${$$(x.rem)}</td><td>${$$(x.c)}</td></tr>`).join("")}</table><p class="t">TOTAL A DEPOSITAR: ${$$(t)}</p></body></html>`);w.document.close();setTimeout(()=>w.print(),400)}

async function vDecl(){const em=await ok(sb.from("empresas").select("*").order("razon_social"));
 if(!em.length){$("#vista").innerHTML='<div class="card">Primero cargá tu empresa en la pestaña "Mi empresa".</div>';return}
 $("#vista").innerHTML=`<div class="card"><div class="row"><div><label>Empresa</label><select id="de">${em.map(x=>`<option value="${x.id}">${esc(x.razon_social)}</option>`).join("")}</select></div><div><label>Período</label><input id="dp" type="month" value="${new Date().toISOString().slice(0,7)}"></div><div><label>Nómina (PDF, Excel o foto)</label><input id="df" type="file" ${FA}></div><button id="di">Identificar afiliados</button></div></div><div id="dl"></div>`;
 let it=[];
 const tot=()=>{$("#tt").innerHTML=ENTS.map(en=>{const p=+en.porcentaje||0;return`<p>${esc(en.nombre)} ${p}%: <b>${$$(r2(it.reduce((s,x)=>s+(+x.rem>0?Math.round(x.rem*p)/100:0),0)))}</b></p>`}).join("")};
 const pintar=()=>{$("#dl").innerHTML=`<div class="card wrap"><b>${it.length} afiliados identificados</b><table><tr><th>CUIL</th><th>Afiliado</th><th>Remuneración bruta</th></tr>${it.map((x,i)=>`<tr><td>${x.cuil}</td><td>${esc(x.nombre)}</td><td><input type="number" step="0.01" data-r="${i}" value="${x.rem}" placeholder="0,00"></td></tr>`).join("")}</table>
  <div class="row" style="margin-top:10px"><div><label>Agregar afiliado por CUIL</label><input id="ac" inputmode="numeric"></div><button class="sec" id="aa">Agregar</button></div><div id="tt" style="margin-top:10px"></div><p><button id="dg">Guardar y generar boletas</button></p><div id="bo"></div></div>`;
  $("#dl").querySelectorAll("[data-r]").forEach(i=>i.oninput=()=>{it[i.dataset.r].rem=i.value;tot()});tot();
  $("#aa").onclick=async()=>{const c=solo($("#ac").value),a=await ok(sb.rpc("identificar_afiliados",{p_cuils:[c]}));if(!a.length)return aviso("Ese CUIL no figura como afiliado");if(!it.some(x=>x.cuil==c))it.push({cuil:c,nombre:a[0].nombre,rem:""});pintar()};
  $("#dg").onclick=async()=>{const emp=em.find(x=>x.id==$("#de").value),per=$("#dp").value,v=it.filter(x=>+x.rem>0);if(!v.length)return aviso("Cargá al menos una remuneración bruta");
   const montos={};ENTS.forEach(en=>montos[en.nombre]=r2(v.reduce((s,x)=>s+Math.round(x.rem*(+en.porcentaje||0))/100,0)));
   await ok(sb.from("declaraciones").insert({empresa_id:emp.id,periodo:per+"-01",items:v,total_bruto:r2(v.reduce((s,x)=>s+ +x.rem,0)),montos}));
   $("#bo").innerHTML="<p class='ok'>Declaración guardada.</p>"+ENTS.map(en=>`<button data-b="${en.id}">Boleta ${esc(en.nombre)} ${+en.porcentaje||0}%</button> `).join("");
   $("#bo").querySelectorAll("[data-b]").forEach(b=>b.onclick=()=>boleta(ENTS.find(x=>x.id==b.dataset.b),emp,per,it))}};
 $("#di").onclick=async()=>{const f=$("#df").files[0];if(!f)return aviso("Elegí el archivo de la nómina");
  try{const c=parsear(await leer(f)).filter(x=>cuilOk(x.cuil)).map(x=>x.cuil),a=c.length?await ok(sb.rpc("identificar_afiliados",{p_cuils:c})):[];
   it=a.map(x=>({cuil:x.cuil,nombre:x.nombre,rem:""}));it.length?pintar():($("#dl").innerHTML='<div class="card">No se encontraron afiliados en el archivo.</div>')}catch(e){aviso("No se pudo leer el archivo: "+e.message)}}}

boot();
