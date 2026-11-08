/* Страницы тем: лист для печати, разбор по шагам, печать блоков.
   sheetHTML используется и при сборке страниц (node), и в браузере — разметка совпадает. */
var Topic=(function(){
var STAR='<svg viewBox="0 0 40 40" aria-hidden="true"><g transform="translate(20 20)"><polygon points="0,-19 4,-4 0,0 -4,-4" fill="#d6232a"/><polygon points="0,19 4,4 0,0 -4,4" fill="#1f5fb8"/><polygon points="19,0 4,4 0,0 4,-4" fill="#111"/><polygon points="-19,0 -4,4 0,0 -4,-4" fill="#111"/></g></svg>';
function esc(s){return String(s).replace(/[&<>"]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]})}
var WIDE=['order','mul1','mul2','div1','div2','round','g3','g4'];
/* o: {t: тема, n: сколько, w: секретное слово, who, seed, ans} */
function sheetData(MC,o){var wd=o.w?MC.cipher(o.w,o.t,o.seed):null,items=wd?wd.items:MC.sheet(o.t,o.n,o.seed),extra=[];
 if(wd&&o.n>items.length){var used={};items.forEach(function(it){used[it.q]=1});extra=MC.sheet(o.t,o.n,o.seed+7).filter(function(it){return !used[it.q]}).slice(0,o.n-items.length)}
 return {items:items,extra:extra,wd:wd}}
function sheetHTML(MC,o,data){data=data||sheetData(MC,o);var items=data.items,extra=data.extra,wd=data.wd,all=items.concat(extra);
 var cols=items.length>16||o.t==='table'||o.t==='tablediv'||o.t==='mix'?3:2;if(WIDE.indexOf(o.t)>=0)cols=2;
 var li=function(it){return '<li><span>'+it.q+' = </span><i></i></li>'};
 return '<header><div class="sb">'+STAR+'<span>Бумажный компас</span></div><div class="sl">Лист-тренажёр</div></header>'+
  '<h2>'+(wd?'Шифровка':MC.TOPICS[o.t])+'</h2>'+(wd?'<p class="sub">'+MC.TOPICS[o.t]+'. Решите примеры, найдите ответы в ключе и прочитайте слово.</p>':'')+
  '<div class="fill"><span>Имя: <i>'+(o.who?esc(o.who):'')+'</i></span><span>Дата: <i></i></span><span>Верно: <i></i> из '+all.length+'</span></div>'+
  '<ol class="ex" style="columns:'+cols+'">'+items.map(li).join('')+'</ol>'+
  (wd?'<div class="keyb"><div class="kt">Ключ</div><div class="keyt2">'+wd.key.map(function(k){return '<div><b>'+k[0]+'</b><span>'+k[1]+'</span></div>'}).join('')+'</div><div class="kt">Слово</div><div class="slots">'+wd.items.map(function(_,i){return '<span><small>'+(i+1)+'</small></span>'}).join('')+'</div></div>'+
   (extra.length?'<div class="kt" style="margin-top:1em">Ещё примеры</div><ol class="ex" start="'+(items.length+1)+'" style="columns:'+cols+'">'+extra.map(li).join('')+'</ol>':''):'')+
  (o.ans?'<div class="answers"><b>Ответы:</b> '+all.map(function(it,i){return (i+1)+') '+it.a}).join('; ')+(wd?'. Слово: '+wd.word:'')+'</div>':'')+
  '<footer>Бумажный компас · тетради-приключения по математике</footer>'}

if(typeof document==='undefined')return {sheetHTML:sheetHTML,sheetData:sheetData,STAR:STAR,esc:esc};

var $=function(s,r){return (r||document).querySelector(s)},$$=function(s,r){return [].slice.call((r||document).querySelectorAll(s))};
function goal(name){try{if(window.PC_GOAL)window.PC_GOAL(name)}catch(e){}}

/* печать одного блока страницы: лист, таблица или задачи */
function printEl(el){$$('.pr-path,.printing').forEach(function(e){e.classList.remove('pr-path','printing')});var path=[];for(var p=el.parentElement;p;p=p.parentElement){p.classList.add('pr-path');path.push(p)}
 el.classList.add('printing');document.body.classList.add('pr-one');var done=false;
 var off=function(){if(done)return;done=true;el.classList.remove('printing');document.body.classList.remove('pr-one');path.forEach(function(p){p.classList.remove('pr-path')})};
 addEventListener('afterprint',off,{once:true});try{window.print()}catch(e){}}

/* разбор примера по шагам: клетки с data-s появляются, когда шаг дошёл до них */
function stepper(box){var cells=$$('.vis [data-s]',box),items=$$('.steps li[data-s]',box),max=0,cur=-1;
 cells.concat(items).forEach(function(e){max=Math.max(max,+e.dataset.s)});
 var bar=box.querySelector('.stepbar');if(!bar)return;bar.hidden=false;
 var prev=$('[data-a="prev"]',bar),next=$('[data-a="next"]',bar),all=$('[data-a="all"]',bar),cnt=$('.cnt',bar);
 function show(s){cur=s;box.classList.toggle('stepping',s>=0&&s<max);
  cells.forEach(function(e){var k=+e.dataset.s;e.classList.toggle('hid',s>=0&&k>s);e.classList.toggle('now',s>=0&&s<max&&k===s)});
  items.forEach(function(e){var k=+e.dataset.s;e.classList.toggle('now',s>=0&&s<max&&k===s);e.classList.toggle('dim',s>=0&&s<max&&k>s)});
  prev.disabled=s<=0;next.textContent=s<0?'Показать по шагам':s>=max?'Сначала':'Дальше →';cnt.textContent=s>=0&&s<max?'Шаг '+(s+1)+' из '+(max+1):'';all.hidden=!(s>=0&&s<max)}
 next.onclick=function(){show(cur<0||cur>=max?0:cur+1)};prev.onclick=function(){if(cur>0)show(cur-1)};all.onclick=function(){show(max)};
 show(-1)}

/* лист для печати прямо на странице темы */
function sheetBox(box){var MC=window.MathCore,topics=box.dataset.topics.split(','),o={t:box.dataset.topic,n:+box.dataset.n||20,w:'',who:'',seed:+box.dataset.seed||1,ans:true};
 var sheet=$('.sheet',box),paper=$('.paper',box),sel=$('#st',box),note=$('#snote',box);
 function build(){var data=sheetData(MC,o);$('#sw',box).classList.toggle('bad',!!o.w&&!data.wd);
  if(o.w&&!data.wd)note.textContent=o.t==='rem'?'Для деления с остатком шифр не подходит — ответ состоит из двух чисел.':'Из этого слова шифровка не складывается — попробуйте другое.';
  else note.textContent='Печать открывает системное окно — там же лист можно сохранить в PDF.';
  sheet.innerHTML=sheetHTML(MC,o,data);fit()}
 function fit(){if(!paper.isConnected)return;var fs=17;sheet.style.fontSize=fs+'px';
  while(sheet.scrollHeight>sheet.clientHeight+1&&fs>11){fs-=.5;sheet.style.fontSize=fs+'px'}
  var z=paper.classList.contains('zoom'),k=z?1:Math.min(1,paper.clientWidth/794);sheet.style.transform='scale('+k+')';paper.style.height=Math.ceil(1123*k)+'px'}
 addEventListener('resize',fit);
 paper.addEventListener('click',function(){if(innerWidth>800)return;this.classList.toggle('zoom');fit();this.scrollLeft=0});
 if(sel)sel.onchange=function(){o.t=this.value;build()};
 $$('.chips button',box).forEach(function(b){b.onclick=function(){$$('.chips button',box).forEach(function(x){x.setAttribute('aria-pressed',x===b)});o.n=+b.dataset.k;build()}});
 $('#sw',box).addEventListener('input',function(){this.value=this.value.toUpperCase();o.w=this.value.trim();build()});
 $('#sname',box).addEventListener('input',function(){o.who=this.value.trim();build()});
 $('#sa',box).onchange=function(){o.ans=this.checked;build()};
 $('#snew',box).onclick=function(){o.seed=(o.seed*48271+11)%2147483647;paper.classList.remove('flip');void paper.offsetWidth;paper.classList.add('flip');build()};
 $('#sprint',box).onclick=function(){goal('print');var z=paper.classList.contains('zoom');paper.classList.remove('zoom');printEl(sheet);if(z)paper.classList.add('zoom');fit()};
 fit();if(document.fonts&&document.fonts.ready)document.fonts.ready.then(fit)}

function buddy(){var fr=['img/totop-1.webp','img/totop-2.webp','img/totop-3.webp','img/totop-2.webp'],RM=matchMedia('(prefers-reduced-motion: reduce)').matches;
 var w=document.createElement('div');w.className='buddy';w.innerHTML='<button class="bd" type="button" aria-label="Наверх" style="visibility:hidden"><img src="'+fr[1]+'" alt="" width="250" height="227"><span class="tag">Наверх</span></button>';document.body.appendChild(w);
 var b=w.firstChild,bd=b,im=b.firstChild;fr.forEach(function(f){var x=new Image();x.src=f});
 var on=false,ox=170,oy=0,rr=0,fi=1,ft=0,sv=0,ly=scrollY,lt=0,sw=0,idle=0,last='';
 function C(v,a,c){return v<a?a:v>c?c:v}
 b.onclick=function(){scrollTo({top:0,behavior:RM?'auto':'smooth'});sw=1.2};
 function tick(now){var dt=lt?Math.min(.05,(now-lt)/1000):.016;lt=now;var y=scrollY;sv+=((y-ly)/dt-sv)*.12;ly=y;
  var want=y>innerHeight*.6;if(want!==on){on=want;w.classList.toggle('on',on);if(on){sw=1;b.style.visibility=''}}
  if(!on&&ox>=168&&!b.style.visibility)b.style.visibility='hidden';
  if(on||ox<168){sw=Math.max(0,sw-dt);var swp=sw>0?Math.sin((1-sw/1.4)*Math.PI):0;
   var tx=on?-40*swp:170,ty=C(sv*.03,-40,40)-16*swp+(RM?0:Math.sin(now/700)*4),tr=C(-sv*.016,-11,11),k=RM?1:Math.min(1,dt*6);
   ox+=(tx-ox)*k;oy+=(ty-oy)*k;rr+=(tr-rr)*k;var tf='translate('+ox.toFixed(1)+'px,'+oy.toFixed(1)+'px) rotate('+rr.toFixed(1)+'deg)';if(tf!==last){last=tf;bd.style.transform=tf}
   var fl;if(Math.abs(sv)>70||sw>0||Math.abs(tx-ox)>16){idle=0;fl=1}else{idle+=dt;fl=idle%8>7.5}
   ft+=dt;if(ft>.085){ft=0;var n=fl&&!RM?(fi+1)%4:1;if(n!==fi){fi=n;im.src=fr[n]}}}
  requestAnimationFrame(tick)}
 requestAnimationFrame(tick)}
function init(){$$('.example').forEach(stepper);$$('.sheetbox').forEach(sheetBox);buddy();
 $$('[data-print]').forEach(function(b){b.onclick=function(){goal('print');printEl(document.getElementById(b.dataset.print))}});
 $$('[data-goal]').forEach(function(a){a.addEventListener('click',function(){goal(a.dataset.goal)})})}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
return {sheetHTML:sheetHTML};
})();
if(typeof module!=='undefined')module.exports=Topic;
