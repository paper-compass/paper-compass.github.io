"use strict";
/* =====================================================================
   Разделы сайта: библиотека, тренажёры, листы, задача дня, журнал.
   Всё описано данными: новая книга — запись в BOOKS, новый тренажёр — в TRAINERS.
   ===================================================================== */
var MC=MathCore;
var BK=function(id){return BOOKS.filter(function(b){return b.id===id})[0]};
var esc=function(t){return String(t).replace(/[&<>"]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]})};
var STAR='<svg viewBox="0 0 40 40" aria-hidden="true"><use href="#star"/></svg>';
function ico(pose,alt){return pose?'<img class="stk" src="'+POSE(pose)+'" alt="'+(alt||'')+'">':'<span class="ico-star">'+STAR+'</span>'}

/* ================== ЖУРНАЛ: прогресс хранится только в этом браузере ================== */
var J=(function(){var KEY='paper-compass-v1',m=null;
 function get(){if(m)return m;try{m=JSON.parse(localStorage.getItem(KEY))}catch(e){m=null}
  if(!m||typeof m!=='object')m={};['stats','badges','daily','seen','best','prefs'].forEach(function(k){if(!m[k]||typeof m[k]!=='object')m[k]={}});
  if(!Array.isArray(m.table)||m.table.length!==100){m.table=[];for(var i=0;i<100;i++)m.table.push(0)}return m}
 function save(){try{localStorage.setItem(KEY,JSON.stringify(m))}catch(e){}}
 function wipe(){m=null;try{localStorage.removeItem(KEY)}catch(e){}return get()}
 return {get:get,save:save,wipe:wipe}})();
function dkey(d){d=d||new Date();return ''+d.getFullYear()+String(d.getMonth()+1).padStart(2,'0')+String(d.getDate()).padStart(2,'0')}
function kdate(k){return new Date(+k.slice(0,4),+k.slice(4,6)-1,+k.slice(6,8))}
function dindex(k){return Math.round(Date.UTC(+k.slice(0,4),+k.slice(4,6)-1,+k.slice(6,8))/864e5)}
function shiftKey(k,n){var d=kdate(k);d.setDate(d.getDate()+n);return dkey(d)}

var BADGES=[
 {id:'first',t:'Первый расчёт',d:'Первый верный ответ',ic:'rumb-point',c:'#1f5fb8'},
 {id:'fog',t:'Туман рассеян',d:'Все 100 клеток в главе «Туман-Забывака»',ic:'nav-cheer',c:'#1f5fb8'},
 {id:'table100',t:'Сто из ста',d:'Вся карта таблицы светится в тренажёре',ic:'tyuk-proud',c:'#1f5fb8'},
 {id:'tyuk10',t:'Глаз-алмаз',d:'Поймано 10 ошибок Тюка',ic:'tyuk-sly',c:'#1f5fb8'},
 {id:'lupa',t:'Лупа',d:'Расшифрована записка Д.',ic:'grach-lens',c:'#c8281e'},
 {id:'rem20',t:'Остаток не потерян',d:'20 верных делений с остатком',ic:'miron-think',c:'#c8281e'},
 {id:'crew',t:'Пересчитай экипаж',d:'Решена аварийная вахта на «Борее»',ic:'korn-read',c:'#e26812'},
 {id:'col5',t:'Столбист',d:'5 примеров столбиком без единой ошибки',ic:'gosha-thumb',c:'#e26812'},
 {id:'corner5',t:'Мастер уголка',d:'5 делений уголком без единой ошибки',ic:'lev-point',c:'#e26812'},
 {id:'beacon',t:'Смотритель маяка',d:'Решена «Очередь у маяка» в истории',ic:null,c:'#d6232a'},
 {id:'queue5',t:'Логик',d:'5 задач на очередь',ic:null,c:'#d6232a'},
 {id:'day3',t:'Три дня подряд',d:'Задача дня — 3 дня без пропуска',ic:'maya-write',c:'#c9971c'},
 {id:'day7',t:'Неделя штурмана',d:'Задача дня — 7 дней подряд',ic:'nav-map',c:'#c9971c'},
 {id:'sheet',t:'Шифровальщик',d:'Составлен лист с секретным словом',ic:'tyuk-slate',c:'#c9971c'},
 {id:'stories',t:'Читатель серии',d:'Открыты все истории',ic:'asya-water',c:'#c9971c'}
];
function award(id){var d=J.get();if(d.badges[id])return;var b=BADGES.filter(function(x){return x.id===id})[0];if(!b)return;d.badges[id]=dkey();J.save();toast(b);navCount()}
function track(k,ok){var d=J.get(),s=d.stats[k]||(d.stats[k]={n:0,ok:0});s.n++;if(ok)s.ok++;J.save();if(ok)award('first')}
function bump(k,n){var d=J.get();d.stats[k]=d.stats[k]||{n:0,ok:0};d.stats[k][n]=(d.stats[k][n]||0)+1;J.save();return d.stats[k][n]}
window.on_award=award;window.on_track=track;
window.on_story=function(b){var d=J.get();d.seen[b.id]=1;J.save();if(BOOKS.every(function(x){return d.seen[x.id]}))award('stories')};
window.on_view=function(){closeMenu()};
function toast(b){var t=el('<div class="toast" role="status" style="--c:'+b.c+'"><div class="bdg on">'+ico(b.ic)+'</div><div><small>Новый значок</small><b>'+b.t+'</b></div></div>');document.body.appendChild(t);Snd.ok();
 requestAnimationFrame(function(){t.classList.add('on')});setTimeout(function(){t.classList.remove('on');setTimeout(function(){t.remove()},600)},3800)}
function navCount(){var n=Object.keys(J.get().badges).length,e=$('#nbBadges');if(e){e.textContent=n||'';e.hidden=!n}}

/* ================== ШАПКА: разделы вместо списка книг ================== */
var SECTIONS=[{k:'library',t:'Истории'},{k:'train',t:'Тренажёры'},{k:'sheets',t:'Листы'},{k:'topics',t:'Темы'},{k:'daily',t:'Задача дня'},{k:'journal',t:'Журнал'}];
function cover(b,cls){return '<img'+(cls?' class="'+cls+'"':'')+' src="'+IMG(b.cover)+'" alt="Обложка: '+esc(b.title)+'" width="700" height="990" loading="lazy">'}
(function(){var nav=$('#nav');
 nav.innerHTML=SECTIONS.map(function(s){
  if(s.k==='library')return '<div class="dd"><a href="#library" data-sec="library">'+s.t+' <i aria-hidden="true">▾</i></a><div class="ddp"><div class="in" style="--n:'+Math.min(4,BOOKS.length)+'">'+
   BOOKS.slice(0,6).map(function(b){return '<a class="b" href="#story-'+b.id+'" style="--c:'+b.c+'">'+cover(b)+'<span>'+b.short+'</span><small>'+b.grade+'</small></a>'}).join('')+
   '<a class="all" href="#library">Вся библиотека · '+BOOKS.length+' '+MC.pl(BOOKS.length,'история','истории','историй')+' →</a></div></div></div>';
  return '<a href="#'+s.k+'" data-sec="'+s.k+'">'+s.t+(s.k==='journal'?'<span class="nb" id="nbBadges" hidden></span>':'')+'</a>'}).join('');
 var menu=$('#menu');
 menu.innerHTML='<div class="menu-in"><nav class="mlinks" aria-label="Разделы">'+SECTIONS.map(function(s,i){return '<a href="#'+s.k+'" data-sec="'+s.k+'"><small>0'+(i+1)+'</small>'+s.t+'</a>'}).join('')+'</nav>'+
  '<div class="mbooks"><div class="eyebrow">Истории</div>'+BOOKS.map(function(b){return '<a href="#story-'+b.id+'" style="--c:'+b.c+'"><i></i>'+b.short+'<small>'+b.grade+'</small></a>'}).join('')+'</div></div>';
 var dd=$('.dd',nav);dd.addEventListener('click',function(e){if(e.target.closest('a'))dd.classList.add('shut')});dd.addEventListener('mouseleave',function(){dd.classList.remove('shut')});
 $('#burger').addEventListener('click',function(){menu.hidden?openMenu():closeMenu()});
 menu.addEventListener('click',function(e){if(e.target.closest('a'))closeMenu()});
 addEventListener('keydown',function(e){if(e.key==='Escape')closeMenu()});
 navCount()})();
function openMenu(){var m=$('#menu');m.hidden=false;requestAnimationFrame(function(){m.classList.add('on')});$('#burger').setAttribute('aria-expanded','true');document.body.classList.add('menu-open')}
function closeMenu(){var m=$('#menu');if(!m||m.hidden)return;m.classList.remove('on');$('#burger').setAttribute('aria-expanded','false');document.body.classList.remove('menu-open');setTimeout(function(){m.hidden=true},300)}

/* общий заголовок раздела */
function head(eyebrow,title,lead,extra){return '<div class="tool-head"><div><div class="eyebrow">'+eyebrow+'</div><h1>'+title+'</h1>'+(lead?'<p class="lead">'+lead+'</p>':'')+'</div>'+(extra||'')+'</div>'}
function chips(id,list,cur){return '<div class="chips" id="'+id+'">'+list.map(function(o){return '<button type="button" data-k="'+o.k+'" aria-pressed="'+(String(o.k)===String(cur))+'">'+o.t+'</button>'}).join('')+'</div>'}
function onChips(box,fn){box.addEventListener('click',function(e){var b=e.target.closest('button[data-k]');if(!b)return;$$('button',box).forEach(function(x){x.setAttribute('aria-pressed',x===b)});fn(b.dataset.k)})}

/* ================== БИБЛИОТЕКА: поиск и фильтры, сетка растёт сама ================== */
var LIB_TOPICS=[{k:'all',t:'Все темы'},{k:'table',t:'Таблица',n:['table']},{k:'out',t:'Внетабличное',n:['div']},{k:'rem',t:'Остаток',n:['rem']},{k:'col',t:'Столбик и уголок',n:['col','div2']},{k:'hard',t:'Логика',n:['hard']}];
var LIB_GRADES=[{k:'all',t:'Любой класс'},{k:'2',t:'2 класс'},{k:'3',t:'3 класс'},{k:'4',t:'4 класс'},{k:'5',t:'5+ и взрослые'}];
function heroesOf(b){var s={};b.chapters.forEach(function(ch){(ch.cast||[]).forEach(function(c){s[CAST[c.id].name]=1})});return Object.keys(s)}
VIEWS.library=function(v){var f={g:'all',t:'all',q:''};
 v.innerHTML='<div class="wrap">'+head('Библиотека · '+BOOKS.length+' '+MC.pl(BOOKS.length,'история','истории','историй'),'Истории','Каждая тетрадь — приключение с героями. Найдите свою по классу, теме или имени героя.')+
  '<div class="filters"><label class="search"><span class="sr">Поиск</span><input type="search" id="libq" placeholder="Тема, герой или класс: «уголок», «Тюк», «3 класс»…" autocomplete="off"></label>'+
  chips('libg',LIB_GRADES,'all')+chips('libt',LIB_TOPICS,'all')+'</div><div class="libcount" id="libn" aria-live="polite"></div><div class="bkgrid" id="libgrid"></div></div>';
 var grid=$('#libgrid',v);
 function draw(){var words=f.q.toLowerCase().split(/\s+/).filter(Boolean),tp=LIB_TOPICS.filter(function(x){return x.k===f.t})[0];
  var list=BOOKS.filter(function(b){if(f.g!=='all'&&b.grades.indexOf(+f.g)<0)return false;if(tp.n&&!tp.n.some(function(n){return b.needs.indexOf(n)>=0}))return false;
   var hay=(b.title+' '+b.short+' '+b.topic+' '+b.grade+' '+b.meta.join(' ')+' '+b.facts.join(' ')+' '+heroesOf(b).join(' ')).toLowerCase();return words.every(function(w){return hay.indexOf(w)>=0})});
  $('#libn',v).textContent=list.length?'Найдено: '+list.length:'';
  grid.innerHTML=list.map(function(b){var hs=heroesOf(b);return '<article class="bk" style="--c:'+b.c+'"><a class="cv" href="#story-'+b.id+'" aria-label="История «'+esc(b.short)+'»">'+cover(b)+(b.pop?'<img class="pop stk" src="'+POSE(b.pop)+'" alt="">':'')+'</a>'+
   '<div class="lbl"><small>'+b.grade+' · '+b.topic+'</small><h3>'+b.short+'</h3>'+(hs.length?'<p>Герои: '+hs.join(', ')+'</p>':'<p>'+b.meta.join(' · ')+'</p>')+
   '<div class="acts"><a class="btn" href="#story-'+b.id+'">История</a><a class="btn ghost" href="'+b.url+'">Литрес ↗</a></div></div></article>'}).join('')+
   (list.length?'':'<div class="empty">'+ico('tyuk-sly')+'<p><b>Ничего не нашлось.</b><br>Тюк уверяет, что такая книга есть. Попробуйте другое слово или снимите фильтр.</p></div>')}
 $('#libq',v).addEventListener('input',function(){f.q=this.value;draw()});
 onChips($('#libg',v),function(k){f.g=k;draw()});onChips($('#libt',v),function(k){f.t=k;draw()});draw();
 return {title:'Истории'}};

/* ================== ТРЕНАЖЁРЫ ================== */
var TRAINERS=[
 {id:'table',name:'Туман-Забывака',sub:'Таблица умножения и деления',book:'archipelago',grade:'2–3 класс',icon:'tyuk-proud',scene:'bg/bg-sea-map',fx:'sea',
  lead:'Раунд из 20 примеров. Тренажёр запоминает каждую клетку таблицы и чаще спрашивает те, что ещё в тумане.',levels:['Умножение','Деление','Вперемешку'],
  cast:[{id:'tyuk',x:.3,h:.6,face:1},{id:'rumb',x:.74,h:.36,face:-1}],run:trTable},
 {id:'tyuk',name:'Ошибка Тюка',sub:'Верно или нет? Поймайте ошибку',book:'archipelago',grade:'2–4 класс',icon:'tyuk-sly',scene:'bg/bg-harbor',fx:'sea',
  lead:'Тюк считает быстро — и иногда ошибается. Решите, верна ли его запись, а если нет — исправьте.',levels:['Таблица','Внетабличное','Столбик'],
  cast:[{id:'tyuk',x:.5,h:.68,pose:'slate'}],run:trTyuk},
 {id:'rem',name:'Остаток',sub:'Деление с остатком',book:'bureau',grade:'3 класс',icon:'grach-lens',scene:'bg/bg-bureau',fx:'dust',
  lead:'Грач делит улики, Мирон торопится. Найдите частное и остаток — и не дайте остатку оказаться больше делителя.',levels:['Частное до 9','Двузначное частное'],
  cast:[{id:'grach',x:.3,h:.74},{id:'miron',x:.74,h:.64,face:-1}],run:trRem},
 {id:'column',name:'Столбик',sub:'Умножение столбиком',book:'borey',grade:'4 класс',icon:'gosha-thumb',scene:'bg/bg-bridge',fx:'stars',
  lead:'Заполняйте клетки справа налево, как на бумаге. Каждая цифра проверяется сразу, а Корн подскажет, что держать в уме.',levels:['3 цифры × 1','4 цифры × 1','3 цифры × 2'],
  cast:[{id:'korn',x:.3,h:.74},{id:'gosha',x:.74,h:.62,face:-1}],run:trColumn},
 {id:'corner',name:'Уголок',sub:'Деление уголком',book:'borey',grade:'4 класс',icon:'lev-point',scene:'bg/bg-mess',fx:'stars',
  lead:'Сначала — сколько цифр будет в частном. Потом шаг за шагом: цифра частного, произведение, разность. Снесённые цифры появятся сами.',levels:['На однозначное','Нули в частном','С остатком','На двузначное'],
  cast:[{id:'korn',x:.3,h:.74,pose:'read'},{id:'lev',x:.74,h:.6,face:-1}],run:trCorner},
 {id:'queue',name:'Очередь у маяка',sub:'Логика: кто когда пришёл',book:'logic',grade:'от 9 лет',icon:null,scene:'lg-grid',fx:'beam',
  lead:'Каждая задача собирается заново и имеет ровно одно решение. Условия сами подсвечиваются, если их нарушить.',levels:['3 человека','4 человека','5 человек'],
  cast:[],run:trQueue}
];
function tile(T){var b=BK(T.book),s=J.get().stats[T.id];return '<a class="tile" href="#train-'+T.id+'" style="--c:'+b.c+'"><small>'+T.grade+'</small><h3>'+T.name+'</h3><p>'+T.sub+'</p>'+ico(T.icon)+
 '<span class="best">'+(s&&s.ok?'Верных ответов: '+s.ok:'Начать →')+'</span></a>'}
function trainHub(v){v.innerHTML='<div class="wrap">'+head('Бесплатно · без регистрации','Тренажёры','Короткие тренировки с героями книг. Прогресс сохраняется в этом браузере — смотрите его в «Журнале».')+
 '<div class="tiles">'+TRAINERS.map(tile).join('')+'</div></div>';return {title:'Тренажёры'}}

/* маленькая сцена с героями внутри тренажёра */
function host(box,o){var h=el('<div class="host'+(/^bg\//.test(o.scene)?' color':'')+'" style="--c:'+o.c+';--sbg:'+o.d+';--bl:3px;--br:.8;--ta:.85"><div class="hbg"><div class="cam"><img src="'+IMG(o.scene)+'" alt=""></div><div class="tint"></div><div class="shade"></div></div><canvas class="fx"></canvas><canvas class="pup"></canvas><div class="hcap" hidden></div><div class="bubbles"></div></div>');
 box.appendChild(h);var s=new Stage(h,{fx:o.fx,cast:o.cast,c:o.c});s.pups.forEach(function(p,i){p.oy=-.35-i*.08;p.vy=0});return s}

VIEWS.train=function(v,arg){var T=TRAINERS.filter(function(t){return t.id===arg})[0];if(!T)return trainHub(v);var b=BK(T.book),d=J.get();
 v.style.setProperty('--c',b.c);var lv=+(d.prefs['lv-'+T.id]||0);if(!(lv<T.levels.length))lv=0;
 v.innerHTML='<div class="wrap"><a class="crumb" href="#train">← Все тренажёры</a>'+head(T.grade+' · по книге «'+b.short+'»',T.name,T.lead,chips('lv',T.levels.map(function(t,i){return {k:i,t:t}}),lv))+
  '<div class="trainer"><div class="hostbox"></div><div class="work"><div class="scorebar"><span>Верно<b id="sOk">0</b></span><span>Ошибок<b id="sNo">0</b></span><span>Серия<b id="sSt">0</b></span><span>Рекорд серии<b id="sBest">'+(d.best[T.id]||0)+'</b></span></div><div class="wk"></div></div></div>'+
  '<div class="more"><div class="eyebrow">Другие тренажёры</div><div class="minitiles">'+TRAINERS.filter(function(t){return t!==T}).map(function(t){var bb=BK(t.book);return '<a href="#train-'+t.id+'" style="--c:'+bb.c+'"><i></i>'+t.name+'<small>'+t.sub+'</small></a>'}).join('')+'</div></div></div>';
 var x={v:v,b:b,T:T,wk:$('.wk',v),level:lv,ok:0,no:0,st:0,
  stage:host($('.hostbox',v),{scene:T.scene,c:b.c,d:b.d,fx:T.fx,cast:T.cast}),
  P:function(id){return this.stage.pups.filter(function(p){return p.id===id})[0]},
  say:function(id,text,pose,box){var p=id&&this.P(id);if(p){if(pose){p.setPose(pose)}p.jump(.8);p.say(text)}else{var c=$('.hcap',this.stage.root);c.hidden=false;c.textContent=text;c.classList.remove('pop');void c.offsetWidth;c.classList.add('pop')}
   var hb=$('.hintbox',this.wk);if(hb&&box){hb.innerHTML='<b>'+(p?p.c.name:'Подсказка')+':</b> '+esc(text);hb.hidden=false}},
  mark:function(ok){if(ok){this.ok++;this.st++;var dd=J.get();if(this.st>(dd.best[T.id]||0)){dd.best[T.id]=this.st;J.save();$('#sBest',v).textContent=this.st}}else{this.no++;this.st=0}
   $('#sOk',v).textContent=this.ok;$('#sNo',v).textContent=this.no;$('#sSt',v).textContent=this.st;track(T.id,ok)}};
 onChips($('#lv',v),function(k){x.level=+k;var dd=J.get();dd.prefs['lv-'+T.id]=x.level;J.save();T.run(x)});
 T.run(x);return {title:T.name,sound:b.sound}};

function numInput(cls,max){return '<input class="inp '+(cls||'')+'" inputmode="numeric" pattern="[0-9]*" autocomplete="off" maxlength="'+(max||4)+'" aria-label="Ответ">'}
function enter(inp,fn){inp.addEventListener('keydown',function(e){if(e.key==='Enter'){e.preventDefault();fn()}})}
function shake(n){n.classList.remove('shake2');void n.offsetWidth;n.classList.add('shake2')}

/* ---- 1. Туман-Забывака: таблица с картой знаний ---- */
function trTable(x){var d=J.get(),mode=x.level,R=20,i=0,res=[],forced=null,retry=[],last=-1,cell=null;
 x.wk.innerHTML='<div class="dots" id="dots"></div><div class="q" id="q"></div><div class="verdict" id="vd" aria-live="polite"></div><div class="hintbox" hidden></div>'+
  '<div class="heatwrap"><div class="eyebrow">Карта моря · выученные клетки светлеют</div><div class="heat" id="heat"></div><p class="small">Нажмите на клетку, чтобы потренировать именно её. Клетка светится полностью после трёх верных ответов подряд.</p></div>';
 var heat=$('#heat',x.wk);var hh='<span></span>';for(var c=1;c<=10;c++)hh+='<span>'+c+'</span>';
 for(var r=1;r<=10;r++){hh+='<span>'+r+'</span>';for(c=1;c<=10;c++)hh+='<button type="button" data-i="'+((r-1)*10+c-1)+'" aria-label="'+r+' × '+c+'"></button>'}heat.innerHTML=hh;
 function paint(){$$('button',heat).forEach(function(b){var m=d.table[+b.dataset.i];b.style.setProperty('--m',m);b.textContent=m>=3?(Math.floor(b.dataset.i/10)+1)*(b.dataset.i%10+1):''})}
 heat.addEventListener('click',function(e){var b=e.target.closest('button');if(!b)return;forced=+b.dataset.i;ask()});
 function choose(){if(forced!==null){var f=forced;forced=null;return f}if(retry.length&&retry[0].at<=i)return retry.shift().c;
  var tot=0,w=d.table.map(function(m,k){var a=Math.floor(k/10)+1,b=k%10+1,base=(a===1||b===1||a===10||b===10)?.25:1;var ww=k===last?0:Math.pow(4-m,2)*base;tot+=ww;return ww});
  var u=Math.random()*tot;for(var k=0;k<100;k++){u-=w[k];if(u<=0)return k}return 0}
 function dots(){$('#dots',x.wk).innerHTML=Array.from({length:R},function(_,k){return '<i class="'+(res[k]===true?'ok':res[k]===false?'no':k===i?'cur':'')+'"></i>'}).join('')}
 function ask(){if(i>=R)return done();cell=choose();last=cell;var a=Math.floor(cell/10)+1,b=cell%10+1,dv=mode===1||(mode===2&&Math.random()<.5);cell={k:cell,a:a,b:b,dv:dv,ans:dv?b:a*b,miss:false};
  $('#q',x.wk).innerHTML='<span>'+(dv?a*b+' : '+a:a+' × '+b)+' =</span>'+numInput('',3)+'<button class="btn" type="button">Проверить</button>';
  $('#vd',x.wk).className='verdict';$('#vd',x.wk).textContent='';$('.hintbox',x.wk).hidden=true;var inp=$('#q input',x.wk);inp.focus({preventScroll:true});
  enter(inp,check);$('#q .btn',x.wk).onclick=check;dots()}
 function check(){var inp=$('#q input',x.wk);if(inp.value==='')return;var ok=+inp.value===cell.ans,vd=$('#vd',x.wk);
  if(ok){if(!cell.miss){d.table[cell.k]=Math.min(3,d.table[cell.k]+1);res[i]=true;x.mark(true)}J.save();paint();Snd.ok();vd.className='verdict ok';vd.textContent=cell.miss?'Теперь верно. Эту клетку спросим ещё раз.':['Туман уходит!','Верно!','Клетка открыта!','Точно в цель!'][Math.floor(Math.random()*4)];
   var ty=x.P('tyuk');ty&&ty.jump(1.1);if(!cell.miss&&d.table[cell.k]===3&&Math.random()<.5)x.say('tyuk','Эта клетка теперь светится. А можно побыстрее?','proud');
   if(d.table.every(function(m){return m>=3}))award('table100');i++;setTimeout(ask,cell.miss?900:650)}
  else{Snd.no();shake(inp);if(!cell.miss){cell.miss=true;res[i]=false;x.mark(false);d.table[cell.k]=0;J.save();paint();retry.push({c:cell.k,at:i+3})}
   vd.className='verdict no';vd.textContent='Не то. Впишите правильный ответ, чтобы плыть дальше.';
   x.say('rumb',cell.dv?cell.a*cell.b+' : '+cell.a+' — ищем, сколько раз по '+cell.a+' помещается в '+cell.a*cell.b+'. '+MC.trick(cell.a,cell.b):MC.trick(cell.a,cell.b),'doubt',1);inp.value='';inp.focus({preventScroll:true})}}
 function done(){var n=res.filter(Boolean).length;dots();$('#q',x.wk).innerHTML='<div class="sum"><b>'+n+' из '+R+'</b><span>'+(n===R?'Без единой ошибки!':n>=15?'Отличный рейс.':'Туман отступает — ещё раунд?')+'</span><button class="btn" type="button">Ещё раунд</button></div>';
  $('#vd',x.wk).textContent='';x.say('tyuk',n===R?'Двадцать из двадцати! Я бы тоже так смог. Наверное.':'Раунд окончен. Карта стала светлее!','proud');
  $('#q .btn',x.wk).onclick=function(){i=0;res=[];retry=[];ask()}}
 paint();ask();if(!x._greet){x._greet=1;setTimeout(function(){x.say('tyuk','Туман сгустился над морем. Начнём с самых тёмных клеток!')},700)}}

/* ---- 2. Ошибка Тюка ---- */
function trTyuk(x){var r=MC.rng(Date.now()%1e9),c=null,phase=0;
 x.wk.innerHTML='<div class="claim" id="cl"></div><div class="choices2" id="ch"><button class="btn" type="button" data-a="1">Верно</button><button class="btn ghost" type="button" data-a="0">Ошибка!</button></div><div class="fix" id="fx" hidden></div><div class="verdict" id="vd" aria-live="polite"></div><div class="hintbox" hidden></div><p class="small">Поймано ошибок за всё время: <b id="tf">'+((J.get().stats.tyuk||{}).found||0)+'</b> · значок «Глаз-алмаз» — за 10.</p>';
 function next(){c=MC.tyuk(r,x.level);phase=0;$('#cl',x.wk).innerHTML='<small>Тюк пишет на грифельной доске:</small><b>'+c.e+' = '+c.claim+'</b>';$('#ch',x.wk).hidden=false;$('#fx',x.wk).hidden=true;
  $('#vd',x.wk).className='verdict';$('#vd',x.wk).textContent='';$('.hintbox',x.wk).hidden=true;x.say('tyuk',c.e+' = '+c.claim+'. Верно же?',Math.random()<.5?'slate':'sly')}
 $('#ch',x.wk).addEventListener('click',function(e){var bt=e.target.closest('button');if(!bt||phase)return;var said=bt.dataset.a==='1',vd=$('#vd',x.wk);phase=1;
  if(said&&c.ok){x.mark(true);Snd.ok();vd.className='verdict ok';vd.textContent='Да, тут всё верно: '+c.e+' = '+c.res+'.';x.say('tyuk','Вот видите! Я всегда прав. Почти.','proud');setTimeout(next,1500)}
  else if(!said&&!c.ok){Snd.pop();$('#ch',x.wk).hidden=true;var f=$('#fx',x.wk);f.hidden=false;f.innerHTML='<span>Как правильно? '+c.e+' =</span>'+numInput('',6)+'<button class="btn" type="button">Исправить</button>';
   var inp=$('input',f);inp.focus({preventScroll:true});var go=function(){if(inp.value==='')return;if(+inp.value===c.res){x.mark(true);Snd.ok();var n=bump('tyuk','found');$('#tf',x.wk).textContent=n;if(n>=10)award('tyuk10');
     vd.className='verdict ok';vd.textContent='Поймали! '+c.why+' Правильно: '+c.e+' = '+c.res+'.';x.say('tyuk','Ой. Это я проверял, внимательны ли вы.','sly');f.hidden=true;setTimeout(next,2200)}
    else{Snd.no();shake(inp);vd.className='verdict no';vd.textContent='Ошибку вы заметили, но и этот ответ неверный. Посчитайте ещё раз.';inp.value=''}};enter(inp,go);$('.btn',f).onclick=go}
  else if(said&&!c.ok){x.mark(false);Snd.no();vd.className='verdict no';vd.textContent='Попались! '+c.why+' Правильно: '+c.e+' = '+c.res+'.';x.say('tyuk','Хе-хе. Проверять надо всегда — даже меня.','sly');setTimeout(next,2600)}
  else{x.mark(false);Snd.no();vd.className='verdict no';vd.textContent='Тут как раз всё верно: '+c.e+' = '+c.res+'. Проверить — правильно, но не спешите с выводом.';x.say('tyuk','Обидно! А я старался.','stand');setTimeout(next,2600)}});
 next()}

/* ---- 3. Остаток ---- */
function trRem(x){var r=MC.rng(Date.now()%1e9),c=null,miss=false;
 x.wk.innerHTML='<div class="q rem" id="q"></div><div class="verdict" id="vd" aria-live="polite"></div><div class="hintbox" hidden></div><div class="row2"><button class="btn ghost" type="button" id="hint">Подсказка Грача</button></div>';
 function next(){var d=MC.rnd(r,2,9),q=x.level?MC.rnd(r,10,30):MC.rnd(r,1,9),k=MC.rnd(r,0,d-1);if(Math.random()<.85&&k===0)k=MC.rnd(r,1,d-1);c={n:d*q+k,d:d,q:q,k:k};miss=false;
  $('#q',x.wk).innerHTML='<span>'+c.n+' : '+c.d+' =</span>'+numInput('q1',2)+'<span class="ost">ост.</span>'+numInput('q2',1)+'<button class="btn" type="button">Проверить</button>';
  var a=$('.q1',x.wk),b=$('.q2',x.wk);a.setAttribute('aria-label','Частное');b.setAttribute('aria-label','Остаток');a.focus({preventScroll:true});enter(a,function(){b.focus()});enter(b,check);$('#q .btn',x.wk).onclick=check;
  $('#vd',x.wk).className='verdict';$('#vd',x.wk).textContent='';$('.hintbox',x.wk).hidden=true}
 function check(){var a=$('.q1',x.wk),b=$('.q2',x.wk),vd=$('#vd',x.wk);if(a.value===''||b.value==='')return;var q=+a.value,k=+b.value;
  if(q===c.q&&k===c.k){if(!miss){x.mark(true);var n=(J.get().stats.rem||{}).ok||0;if(n>=20)award('rem20')}Snd.ok();vd.className='verdict ok';vd.textContent='Верно: '+c.n+' : '+c.d+' = '+c.q+' (ост. '+c.k+'). Проверка: '+c.q+' × '+c.d+' + '+c.k+' = '+c.n+'.';
   x.say('grach',['Делится. Доказательство есть.','Верно. Остаток меньше делителя — как и положено.','Записываю в дело.'][Math.floor(Math.random()*3)],'stand');setTimeout(next,2200);return}
  if(!miss){miss=true;x.mark(false)}Snd.no();shake($('#q',x.wk));vd.className='verdict no';
  if(k>=c.d){vd.textContent='Остаток '+k+' не меньше делителя '+c.d+' — значит, в частном можно взять ещё.';x.say('miron','Остаток не может быть больше делителя или равен ему. Я так тоже ошибался…','think',1)}
  else if(q*c.d>c.n){vd.textContent='Перебор: '+q+' × '+c.d+' = '+q*c.d+' — это больше, чем '+c.n+'.';x.say('grach','Перебор. Возьми частное поменьше.','lens',1)}
  else if(q*c.d+k!==c.n){vd.textContent='Проверка не сходится: '+q+' × '+c.d+' + '+k+' = '+(q*c.d+k)+', а нужно '+c.n+'.';x.say('grach','Частное × делитель + остаток должно дать делимое. Проверь.','lens',1)}}
 $('#hint',x.wk).onclick=function(){if(!c)return;x.say('grach','Ищи самое большое число, не больше '+c.n+', которое делится на '+c.d+' без остатка. Это '+c.q*c.d+' = '+c.d+' × '+c.q+'. А остаток — сколько не хватило до '+c.n+'.','lens',1)};
 next()}

/* ---- клетки столбика и уголка: общая логика ввода ---- */
function cellsFlow(x,seq,onDone){var cur=0,mistakes=0;
 seq.forEach(function(s,k){s.el.dataset.k=k;s.el.addEventListener('focus',function(){if(!s.done){cur=k;mark()}});
  s.el.addEventListener('input',function(){var v=s.el.value.replace(/\D/g,'').slice(-1);s.el.value=v;if(v==='')return;
   if(v===s.ch){s.done=true;s.el.classList.remove('no');s.el.classList.add('ok');s.el.readOnly=true;Snd.tick();var nx=seq.findIndex(function(t){return !t.done});if(nx<0){mark();onDone(mistakes);return}cur=nx;mark();seq[nx].el.focus({preventScroll:true})}
   else{mistakes++;s.el.classList.add('no');Snd.no();shake(s.el);setTimeout(function(){s.el.select()},20);if(s.wrong)s.wrong()}});
  s.el.addEventListener('keydown',function(e){if(e.key==='Backspace'&&!s.el.value&&k>0){var pv=seq.slice(0,k).reverse().find(function(t){return !t.done});if(pv){e.preventDefault();pv.el.focus()}}})});
 function mark(){seq.forEach(function(s,k){s.el.classList.toggle('cur',k===cur&&!s.done)});if(x.onStep)x.onStep(cur)}
 return {start:function(){mark();seq[0]&&seq[0].el.focus({preventScroll:true})},cur:function(){return seq[cur]},mistakes:function(){return mistakes}}}
function cellInput(ch,cls){return '<input class="c'+(cls?' '+cls:'')+'" inputmode="numeric" pattern="[0-9]*" maxlength="1" autocomplete="off" aria-label="Цифра">'}
function round1(n){var s=String(n),p=Math.pow(10,s.length-1);return Math.round(n/p)*p}

/* ---- 4. Столбик ---- */
function trColumn(x){var r=MC.rng(Date.now()%1e9),flow=null,L=null,H=null;
 x.wk.innerHTML='<div class="colwrap"><div class="colgrid" id="cg"></div></div><div class="verdict" id="vd" aria-live="polite"></div><div class="hintbox" hidden></div><div class="row2"><button class="btn ghost" type="button" id="hint">Подсказка Корна</button><button class="btn ghost" type="button" id="skip">Другой пример</button></div><p class="small">Пишите справа налево. Снизу — то, что держите в уме, Корн подскажет по кнопке.</p>';
 function gen(){var a,b;if(x.level===0){a=MC.rnd(r,112,989);b=MC.rnd(r,3,9)}else if(x.level===1){a=MC.rnd(r,1012,9989);b=MC.rnd(r,3,9)}else{a=MC.rnd(r,112,989);do{b=MC.rnd(r,12,98)}while(b%10===0||b%11===0)}return [a,b]}
 function next(){var ab=gen(),a=ab[0],b=ab[1];L=MC.mulLayout(a,b);H=MC.mulHints(a,b);var W=Math.max(String(a).length,String(b).length,String(a*b).length,(L.rows.filter(function(q){return q.kind==='ans'}).reduce(function(m,q){return Math.max(m,q.text.length+q.shift)},0)))+0,g=$('#cg',x.wk),html='',seq=[],ai=0;
  g.style.gridTemplateColumns='32px repeat('+W+',var(--cw))';
  L.rows.forEach(function(row,ri){var gr=ri+1,len=row.text.length;if(row.sign)html+='<div class="c sg" style="grid-row:'+gr+';grid-column:1">'+row.sign+'</div>';
   for(var k=0;k<len;k++){var col=2+W-row.shift-len+k,ch=row.text[k],ln=row.line?' ln':'';
    if(row.kind==='given')html+='<div class="c'+ln+'" style="grid-row:'+gr+';grid-column:'+col+'">'+ch+'</div>';
    else html+='<div class="c'+ln+'" style="grid-row:'+gr+';grid-column:'+col+'" data-r="'+ai+'" data-p="'+(len-1-k)+'">'+cellInput(ch)+'</div>'}
   if(row.line){for(var c2=2;c2<2+W;c2++){var occ=c2>=2+W-row.shift-len&&c2<2+W-row.shift;if(!occ)html+='<div class="c ln" style="grid-row:'+gr+';grid-column:'+c2+'"></div>'}}
   if(row.kind==='ans')ai++});
  g.innerHTML=html;
  var ansRows=L.rows.filter(function(q){return q.kind==='ans'});ansRows.forEach(function(row,ri){for(var p=0;p<row.text.length;p++){var cell=$('[data-r="'+ri+'"][data-p="'+p+'"] input',g);seq.push({el:cell,ch:String(H[ri][p].d),t:H[ri][p].t})}});
  flow=cellsFlow(x,seq,function(m){Snd.ok();var vd=$('#vd',x.wk);vd.className='verdict ok';vd.textContent='Готово: '+a+' × '+b+' = '+a*b+(m?'. Ошибок по дороге: '+m+'.':'. Без единой ошибки!');x.mark(!m);
   if(!m){var n=bump('column','clean');if(n>=5)award('col5')}x.say('korn',m?'Сходится. В следующий раз — без помарок.':'Чисто. Ни одной помарки.','stand');setTimeout(function(){$('#skip',x.wk).textContent='Следующий пример →'},300)});
  $('#vd',x.wk).className='verdict';$('#vd',x.wk).textContent='';$('.hintbox',x.wk).hidden=true;$('#skip',x.wk).textContent='Другой пример';
  x.say('korn','Сначала прикинь: '+a+' × '+b+' — это около '+round1(a)+' × '+round1(b)+' = '+round1(a)*round1(b)+'. Потом считай.','read',1);flow.start()}
 $('#hint',x.wk).onclick=function(){var s=flow&&flow.cur();if(s&&!s.done)x.say('korn',s.t,'mug',1)};
 $('#skip',x.wk).onclick=next;next()}

/* ---- 5. Уголок ---- */
function trCorner(x){var r=MC.rng(Date.now()%1e9),flow=null,plan=null;
 x.wk.innerHTML='<div class="digq" id="dq"></div><div class="colwrap"><div class="colgrid div" id="cg"></div></div><div class="verdict" id="vd" aria-live="polite"></div><div class="hintbox" hidden></div><div class="row2"><button class="btn ghost" type="button" id="hint">Подсказка Корна</button><button class="btn ghost" type="button" id="skip">Другой пример</button></div>';
 function gen(){var d,q,k=0;
  if(x.level===0){d=MC.rnd(r,2,9);q=MC.rnd(r,112,1999)}
  else if(x.level===1){d=MC.rnd(r,2,9);q=MC.pick(r,[MC.rnd(r,1,9)*100+MC.rnd(r,1,9),MC.rnd(r,1,9)*1000+MC.rnd(r,1,9)*10+MC.rnd(r,1,9),MC.rnd(r,1,9)*100+MC.rnd(r,1,9)*10,MC.rnd(r,1,9)*1000+MC.rnd(r,1,9)])}
  else if(x.level===2){d=MC.rnd(r,3,9);q=MC.rnd(r,112,999);k=MC.rnd(r,1,d-1)}
  else{d=MC.rnd(r,12,48);q=MC.rnd(r,12,199)}
  return [d*q+k,d]}
 function next(){var nd=gen(),n=nd[0],d=nd[1];plan=MC.divPlan(n,d);var Lq=plan.L,ns=String(n),N=ns.length,R=Math.max(String(d).length,Lq.q.length),g=$('#cg',x.wk),html='',seq=[];
  g.style.gridTemplateColumns='26px repeat('+N+',var(--cw)) repeat('+R+',var(--cw))';
  for(var i=0;i<N;i++)html+='<div class="c" style="grid-row:1;grid-column:'+(2+i)+'">'+ns[i]+'</div>';
  for(i=0;i<R;i++){var ch=String(d)[i];html+='<div class="c rb'+(i===0?' vl':'')+'" style="grid-row:1;grid-column:'+(2+N+i)+'">'+(ch||'')+'</div>';
   html+='<div class="c rq hl'+(i===0?' vl':'')+'" style="grid-row:2;grid-column:'+(2+N+i)+'" data-q="'+i+'">'+(i<Lq.q.length?cellInput(Lq.q[i]):'')+'</div>'}
  Lq.rows.forEach(function(row,ri){var gr=2+ri,len=row.cells.length,s0=2+row.end-len+1;
   html+='<div class="rowg" data-row="'+ri+'" style="display:contents">';
   if(row.kind==='prod')html+='<div class="c sg" style="grid-row:'+gr+';grid-column:'+(s0-1)+'">−</div>';
   row.cells.forEach(function(c,ci){var cls=row.kind==='prod'?' ln':'';html+='<div class="c'+cls+(c.given?' gv':'')+'" style="grid-row:'+gr+';grid-column:'+(s0+ci)+'" data-row="'+ri+'" data-i="'+ci+'">'+(c.given?'<span>'+c.ch+'</span>':cellInput(c.ch))+'</div>'});
   html+='</div>'});
  g.innerHTML=html;
  plan.seq.forEach(function(s){var e=s.row==='q'?$('[data-q="'+s.i+'"] input',g):$('div[data-row="'+s.row+'"][data-i="'+s.i+'"] input',g);seq.push({el:e,ch:s.ch,t:s.t})});
  function reveal(c){Lq.rows.forEach(function(row,ri){var on=c>=plan.start[ri];$$('div[data-row="'+ri+'"]',g).forEach(function(e){if(on&&!e.classList.contains('show')){e.classList.add('show')}})})}
  $$('div[data-row]',g).forEach(function(e){e.classList.remove('show')});$$('.rq',g).forEach(function(e){e.classList.add('wait')});
  x.onStep=function(c){reveal(c)};
  flow=cellsFlow(x,seq,function(m){reveal(1e9);Snd.ok();var vd=$('#vd',x.wk);vd.className='verdict ok';vd.textContent='Готово: '+n+' : '+d+' = '+Lq.q.replace(/^0+(?=\d)/,'')+(Lq.r?' (ост. '+Lq.r+')':'')+(m?'. Ошибок по дороге: '+m+'.':'. Без единой ошибки!');x.mark(!m);
   if(!m){var k=bump('corner','clean');if(k>=5)award('corner5')}x.say(m?'korn':'lev',m?'Сходится. Проверь умножением: частное × делитель'+(Lq.r?' + остаток':'')+'.':'Быстро и правильно. Так тоже можно!',m?'stand':'point');$('#skip',x.wk).textContent='Следующий пример →'});
  var dq=$('#dq',x.wk),need=Lq.q.length;dq.hidden=false;
  dq.innerHTML='<span>Сколько цифр будет в частном?</span><div class="chips">'+[1,2,3,4,5].map(function(k){return '<button type="button" data-k="'+k+'">'+k+'</button>'}).join('')+'</div>';
  var tried=false;dq.onclick=function(e){var b=e.target.closest('button');if(!b)return;var k=+b.dataset.k;
   if(k===need){Snd.pop();dq.hidden=true;if(!tried)track('corner-digits',true);$$('.rq',g).forEach(function(e){e.classList.remove('wait')});flow.start()}
   else{tried=true;Snd.no();shake(b);x.say('korn','Первое неполное делимое — '+Lq.qc[0]+': в нём '+d+' помещается. Это первая цифра частного, и каждая следующая цифра делимого добавляет ещё одну: всего '+need+'.','read',1)}};
  $('#vd',x.wk).className='verdict';$('#vd',x.wk).textContent='';$('.hintbox',x.wk).hidden=true;$('#skip',x.wk).textContent='Другой пример';
  x.say('korn','Делим '+n+' на '+d+'. Сначала — сколько цифр будет в частном?','read')}
 $('#hint',x.wk).onclick=function(){if($('#dq',x.wk).hidden===false){x.say('korn','Найди первое неполное делимое: возьми столько первых цифр, чтобы получилось число не меньше '+plan.L.d+'.','read',1);return}var s=flow&&flow.cur();if(s&&!s.done)x.say('korn',s.t,'mug',1)};
 $('#skip',x.wk).onclick=next;next()}

/* ---- 6. Очередь у маяка ---- */
function queueBoard(box,Q,onSolved){var n=Q.names.length,pick={};
 box.innerHTML='<ol class="clues">'+Q.clues.map(function(c,i){return '<li data-c="'+i+'">'+c.t+'</li>'}).join('')+'</ol>'+
  '<div class="qgrid" style="grid-template-columns:auto repeat('+n+',1fr)" role="group" aria-label="Кто в какой час"><div></div>'+Q.hours.map(function(h){return '<div>'+h+':00</div>'}).join('')+
  Q.names.map(function(nm,i){return '<div class="nm">'+nm+'</div>'+Q.hours.map(function(h,hi){return '<button type="button" data-i="'+i+'" data-h="'+hi+'" aria-label="'+nm+', '+h+':00">·</button>'}).join('')}).join('')+'</div>';
 var solved=false;box.querySelector('.qgrid').addEventListener('click',function(e){var b=e.target.closest('button');if(!b||solved)return;var i=+b.dataset.i,h=+b.dataset.h;
  if(pick[i]===h)delete pick[i];else{Object.keys(pick).forEach(function(j){if(pick[j]===h)delete pick[j]});pick[i]=h}Snd.tick();
  $$('button',box).forEach(function(x){var on=pick[+x.dataset.i]===+x.dataset.h;x.classList.toggle('on',on);x.textContent=on?'✓':'·'});
  var p=[];for(var k=0;k<n;k++)p[k]=pick[k]===undefined?null:pick[k];var all=true;
  Q.clues.forEach(function(c,ci){var v=MC.evalClue(c,p),li=$('[data-c="'+ci+'"]',box);li.className=v===true?'ok':v===false?'no':'';if(v!==true)all=false});
  if(Object.keys(pick).length===n&&all){solved=true;onSolved(true)}else if(Object.keys(pick).length===n)onSolved(false)});}
function trQueue(x){var n=x.level+3;
 x.wk.innerHTML='<p class="task" id="qt"></p><div id="qb"></div><div class="verdict" id="vd" aria-live="polite"></div><div class="row2"><button class="btn ghost" type="button" id="skip">Новая задача</button></div>';
 function next(){var Q=MC.queue(MC.rng(Date.now()%1e9),n),word=['Три','Четыре','Пять'][n-3];
  $('#qt',x.wk).innerHTML=word+' фотографа пришли на маяк в '+Q.hours.slice(0,-1).join(', ')+' и '+Q.hours[n-1]+' часов — по одному в каждый час. Кто когда пришёл?';
  $('#vd',x.wk).className='verdict';$('#vd',x.wk).textContent='Нажимайте на клетки. Условия загораются зелёным, когда выполнены.';var miss=false;
  queueBoard($('#qb',x.wk),Q,function(ok){var vd=$('#vd',x.wk);if(ok){Snd.ok();x.mark(!miss);vd.className='verdict ok';vd.textContent='Верно — и это единственное решение.';var k=bump('queue','solved');if(k>=5)award('queue5');x.say(null,'Маяк мигнул трижды: задача решена.')}
   else{if(!miss){miss=true;x.mark(false)}Snd.no();vd.className='verdict no';vd.textContent='Все расставлены, но какое-то условие красное.'}})}
 $('#skip',x.wk).onclick=next;next()}

/* ================== ЛИСТЫ ДЛЯ ПЕЧАТИ И ШИФРОВКИ ================== */
var SHEET_T=['table','tablediv','mix','out2','outdiv','rem','mul1','mul2','div1','div2','round','order','g3','g4'];
VIEWS.sheets=function(v,arg){var d=J.get(),o={t:arg&&SHEET_T.indexOf(arg)>=0?arg:SHEET_T.indexOf(d.prefs.st)>=0?d.prefs.st:'mix',n:+(d.prefs.sn||20),w:'',who:d.prefs.name||'',seed:Date.now()%1e9,ans:true};
 v.innerHTML='<div class="wrap">'+head('Для печати и для друзей','Листы','Соберите лист примеров за секунду: тема, количество, секретное слово. Каждое нажатие «Новый вариант» даёт новые примеры.')+
  '<div class="sheets"><form class="ctl" id="ctl" onsubmit="return false">'+
  '<label>Тема<select id="st">'+SHEET_T.map(function(k){return '<option value="'+k+'"'+(k===o.t?' selected':'')+'>'+MC.TOPICS[k]+'</option>'}).join('')+'</select></label>'+
  '<fieldset><legend>Примеров</legend>'+chips('sn',[{k:12,t:'12'},{k:20,t:'20'},{k:30,t:'30'}],o.n)+'</fieldset>'+
  '<label>Секретное слово <small>— ответы сложатся в него</small><input id="sw" maxlength="14" placeholder="например, КОМПАС" autocomplete="off"></label>'+
  '<label>Для кого <small>— необязательно</small><input id="sname" maxlength="30" value="'+esc(o.who)+'" autocomplete="off"></label>'+
  '<label class="ck"><input type="checkbox" id="sa" checked> Ответы внизу листа, вверх ногами</label>'+
  '<div class="row2"><button class="btn" type="button" id="snew">Новый вариант</button><button class="btn ghost" type="button" id="sprint">Печать</button><button class="btn ghost" type="button" id="scopy">Скопировать как шифровку</button></div>'+
  '<p class="small" id="snote">Печать открывает системное окно — там же лист можно сохранить в PDF.</p><textarea id="sout" class="sout" hidden readonly></textarea></form>'+
  '<div><p class="zoomhint">Нажмите на лист, чтобы рассмотреть его в полный размер.</p><div class="paper"><div class="sheet" id="sheet"></div></div></div></div></div>';
 var sheet=$('#sheet',v),data=null;
 function build(){var w=$('#sw',v).value.trim(),wd=w?MC.cipher(w,o.t,o.seed):null;$('#sw',v).classList.toggle('bad',!!w&&!wd);
  if(w&&!wd&&o.t==='rem'){$('#snote',v).textContent='Для деления с остатком шифр не подходит — ответ состоит из двух чисел.'}
  var items=wd?wd.items:MC.sheet(o.t,o.n,o.seed),extra=[];
  if(wd&&o.n>items.length){var used={};items.forEach(function(it){used[it.q]=1});extra=MC.sheet(o.t,o.n,o.seed+7).filter(function(it){return !used[it.q]}).slice(0,o.n-items.length)}
  data={items:items,wd:wd};var all=items.concat(extra);var who=$('#sname',v).value.trim(),cols=items.length>16||o.t==='table'||o.t==='tablediv'||o.t==='mix'?3:2;if(['order','mul1','mul2','div1','div2','round','g3','g4'].indexOf(o.t)>=0)cols=2;
  sheet.innerHTML='<header><div class="sb">'+STAR+'<span>Бумажный компас</span></div><div class="sl">Лист-тренажёр</div></header>'+
   '<h2>'+(wd?'Шифровка':MC.TOPICS[o.t])+'</h2>'+(wd?'<p class="sub">'+MC.TOPICS[o.t]+'. Решите примеры, найдите ответы в ключе и прочитайте слово.</p>':'')+
   '<div class="fill"><span>Имя: <i>'+(who?esc(who):'')+'</i></span><span>Дата: <i></i></span><span>Верно: <i></i> из '+all.length+'</span></div>'+
   '<ol class="ex" style="columns:'+cols+'">'+items.map(function(it){return '<li><span>'+it.q+' = </span><i></i></li>'}).join('')+'</ol>'+
   (wd?'<div class="keyb"><div class="kt">Ключ</div><div class="keyt2">'+wd.key.map(function(k){return '<div><b>'+k[0]+'</b><span>'+k[1]+'</span></div>'}).join('')+'</div><div class="kt">Слово</div><div class="slots">'+wd.items.map(function(_,i){return '<span><small>'+(i+1)+'</small></span>'}).join('')+'</div></div>'+
    (extra.length?'<div class="kt" style="margin-top:1em">Ещё примеры</div><ol class="ex" start="'+(items.length+1)+'" style="columns:'+cols+'">'+extra.map(function(it){return '<li><span>'+it.q+' = </span><i></i></li>'}).join('')+'</ol>':''):'')+
   (o.ans?'<div class="answers"><b>Ответы:</b> '+all.map(function(it,i){return (i+1)+') '+it.a}).join('; ')+(wd?'. Слово: '+wd.word:'')+'</div>':'')+
   '<footer>Бумажный компас · тетради-приключения по математике</footer>';
  if(wd)award('sheet');fit()}
 /* лист всегда собирается в размере A4 (794 × 1123) и уменьшается под экран; если не влезает — мельчим шрифт */
 function fit(){var box=$('.paper',v);if(!box||!box.isConnected)return;var fs=17;sheet.style.fontSize=fs+'px';
  while(sheet.scrollHeight>sheet.clientHeight+1&&fs>11){fs-=.5;sheet.style.fontSize=fs+'px'}
  var z=box.classList.contains('zoom'),k=z?1:Math.min(1,box.clientWidth/794);sheet.style.transform='scale('+k+')';box.style.height=Math.ceil(1123*k)+'px'}
 addEventListener('resize',fit);
 $('.paper',v).addEventListener('click',function(){if(innerWidth>800)return;this.classList.toggle('zoom');fit();this.scrollLeft=0});
 $('#st',v).onchange=function(){o.t=this.value;d.prefs.st=o.t;J.save();build()};
 onChips($('#sn',v),function(k){o.n=+k;d.prefs.sn=o.n;J.save();build()});
 $('#sw',v).addEventListener('input',function(){this.value=this.value.toUpperCase();build()});
 $('#sname',v).addEventListener('input',function(){d.prefs.name=this.value;J.save();build()});
 $('#sa',v).onchange=function(){o.ans=this.checked;build()};
 $('#snew',v).onclick=function(){o.seed=(o.seed*48271+11)%2147483647;var pp=$('.paper',v);pp.classList.remove('flip');void pp.offsetWidth;pp.classList.add('flip');Snd.pop();build()};
 var printed=false;addEventListener('beforeprint',function(){printed=true});
 $('#sprint',v).onclick=function(){printed=false;try{window.print()}catch(e){}setTimeout(function(){if(!printed)$('#snote',v).textContent='Окно печати не открылось. Откройте сайт в обычной вкладке браузера — там печать работает.'},900)};
 $('#scopy',v).onclick=function(){var it=data.items,wd=data.wd,txt=(wd?'Шифровка! Реши примеры и найди ответы в ключе — получится слово.\n':'Примеры: '+MC.TOPICS[o.t]+'\n')+it.map(function(x,i){return (i+1)+') '+x.q+' = ?'}).join('\n')+(wd?'\nКлюч: '+wd.key.map(function(k){return k[0]+' — '+k[1]}).join(', '):'');
  var ta=$('#sout',v);ta.value=txt;var okc=function(){$('#snote',v).textContent='Скопировано — можно вставить в сообщение.';Snd.ok()},fail=function(){ta.hidden=false;ta.focus();ta.select();$('#snote',v).textContent='Выделите текст ниже и скопируйте его.'};
  try{navigator.clipboard.writeText(txt).then(okc,fail)}catch(e){fail()}};
 build();return {title:'Листы'}};

/* ================== ЗАДАЧА ДНЯ ================== */
function streak(){var d=J.get().daily,k=dkey(),n=0;if(!(d[k]&&d[k].on))k=shiftKey(k,-1);while(d[k]&&d[k].on){n++;k=shiftKey(k,-1)}return n}
var WD=['вс','пн','вт','ср','чт','пт','сб'],MON=['января','февраля','марта','апреля','мая','июня','июля','августа','сентября','октября','ноября','декабря'];
VIEWS.daily=function(v,arg){var today=dkey(),key=arg&&/^\d{8}$/.test(arg)&&arg<=today&&arg>=shiftKey(today,-6)?arg:today,P=MC.daily(dindex(key)),b=BK(P.book),dt=kdate(key),D=J.get(),st=D.daily[key]||{},tries=0;
 v.style.setProperty('--c',b.c);
 var days='';for(var i=6;i>=0;i--){var k=shiftKey(today,-i),s=D.daily[k],dd=kdate(k);days+='<a href="#daily-'+k+'" class="'+(k===key?'cur ':'')+(s&&s.ok?(s.on?'ok':'late'):'')+'"><small>'+WD[dd.getDay()]+'</small><b>'+dd.getDate()+'</b><i>'+(s&&s.ok?'✓':'')+'</i></a>'}
 v.innerHTML='<div class="wrap">'+head('Каждый день — новая','Задача дня','Одна задача в день от героев серии. Решайте без пропусков — растёт серия и открываются значки.','<div class="streak"><b id="stk">'+streak()+'</b><span>'+MC.pl(streak(),'день','дня','дней')+' подряд</span></div>')+
  '<div class="days">'+days+'</div><article class="daily" style="--c:'+b.c+'"><div class="dhero">'+ico(P.hero)+'<div><small>'+WD[dt.getDay()]+', '+dt.getDate()+' '+MON[dt.getMonth()]+'</small><b>'+(P.who==='Маяк'?'Из «Логики тихого города»':P.who+' спрашивает')+'</b></div></div>'+
  '<p class="dtext">'+P.text+'</p><div id="dw"></div><div class="verdict" id="vd" aria-live="polite"></div><div class="hintbox" hidden></div><div class="row2"><button class="btn ghost" type="button" id="dh">Подсказка</button><button class="btn ghost" type="button" id="ds" hidden>Показать решение</button></div>'+
  (key!==today?'<p class="small">Это задача прошлого дня: её можно решить, но в серию идут только задачи, решённые в свой день.</p>':'')+'</article></div>';
 var vd=$('#vd',v),hb=$('.hintbox',v);
 function win(){var was=D.daily[key]&&D.daily[key].ok;D.daily[key]={ok:true,on:(D.daily[key]&&D.daily[key].on)||(!was&&key===today)};J.save();Snd.ok();vd.className='verdict ok';vd.textContent='Верно! '+P.sol;
  if(!was)track('daily',true);var s=streak();$('#stk',v).textContent=s;if(s>=3)award('day3');if(s>=7)award('day7');var a=$('.days a.cur',v);a.className='cur '+(D.daily[key].on?'ok':'late');$('i',a).textContent='✓'}
 function miss(){tries++;Snd.no();vd.className='verdict no';vd.textContent=tries<2?'Пока не то. Попробуйте ещё раз.':'Не сходится. Загляните в подсказку.';if(tries>=3)$('#ds',v).hidden=false}
 if(P.queue){queueBoard($('#dw',v),P.queue,function(ok){ok?win():miss()})}
 else{$('#dw',v).innerHTML='<div class="q"><span>Ответ:</span>'+numInput('',5)+'<button class="btn" type="button">Проверить</button></div>';var inp=$('#dw input',v),go=function(){if(inp.value==='')return;+inp.value===P.ans?win():(miss(),shake(inp))};enter(inp,go);$('#dw .btn',v).onclick=go;
  if(st.ok){inp.value=P.ans;vd.className='verdict ok';vd.textContent='Решено. '+P.sol}}
 if(st.ok&&P.queue){vd.className='verdict ok';vd.textContent='Решено. '+P.sol}
 $('#dh',v).onclick=function(){hb.hidden=false;hb.innerHTML='<b>Подсказка:</b> '+esc(P.hint)};
 $('#ds',v).onclick=function(){hb.hidden=false;hb.innerHTML='<b>Решение:</b> '+esc(P.sol)};
 return {title:'Задача дня',sound:b.sound}};

/* ================== ЖУРНАЛ ================== */
VIEWS.journal=function(v){var D=J.get(),got=Object.keys(D.badges).length,S=D.stats,tot=0,ok=0;Object.keys(S).forEach(function(k){tot+=S[k].n||0;ok+=S[k].ok||0});
 var lit=D.table.filter(function(m){return m>=3}).length;
 v.innerHTML='<div class="wrap">'+head('Только в этом браузере','Журнал штурмана','Значки, серии и карта таблицы. Ничего не отправляется в интернет — прогресс хранится на этом устройстве.')+
  '<div class="jgrid"><div class="jcol"><div class="stats"><div><b>'+ok+'</b><span>верных ответов</span></div><div><b>'+(tot?Math.round(ok/tot*100):0)+'%</b><span>точность</span></div><div><b>'+streak()+'</b><span>'+MC.pl(streak(),'день','дня','дней')+' подряд</span></div><div><b>'+got+'/'+BADGES.length+'</b><span>значков</span></div></div>'+
  '<div class="card"><div class="eyebrow">Карта таблицы · светится '+lit+' из 100</div><div class="heat mini" style="--c:#1f5fb8">'+(function(){var h='<span></span>';for(var c=1;c<=10;c++)h+='<span>'+c+'</span>';for(var r=1;r<=10;r++){h+='<span>'+r+'</span>';for(c=1;c<=10;c++){var m=D.table[(r-1)*10+c-1];h+='<button type="button" tabindex="-1" style="--m:'+m+'" aria-label="'+r+' × '+c+'">'+(m>=3?r*c:'')+'</button>'}}return h})()+'</div><a class="btn" href="#train-table">Тренировать таблицу</a></div>'+
  '<div class="card"><div class="eyebrow">Тренажёры</div><ul class="tlist">'+TRAINERS.map(function(t){var s=S[t.id]||{n:0,ok:0};return '<li><a href="#train-'+t.id+'">'+t.name+'</a><span>'+s.ok+' из '+s.n+'</span><span>рекорд серии: '+(D.best[t.id]||0)+'</span></li>'}).join('')+'</ul></div>'+
  '<div class="card"><button class="btn ghost" type="button" id="wipe">Стереть прогресс</button></div></div>'+
  '<div class="jcol"><div class="eyebrow">Значки</div><div class="badges">'+BADGES.map(function(b){var on=D.badges[b.id];return '<div class="bdgw'+(on?' on':'')+'" style="--c:'+b.c+'"><div class="bdg'+(on?' on':'')+'">'+ico(b.ic)+'</div><b>'+b.t+'</b><small>'+b.d+'</small></div>'}).join('')+'</div></div></div></div>';
 var w=$('#wipe',v),armed=false;w.onclick=function(){if(!armed){armed=true;w.textContent='Точно стереть? Нажмите ещё раз';setTimeout(function(){armed=false;w.textContent='Стереть прогресс'},4000);return}J.wipe();navCount();apply()};
 return {title:'Журнал'}};

/* ================== ГЛАВНАЯ: блок «Играть с героями» ================== */
(function(){var box=$('#homeTiles');if(!box)return;var P=MC.daily(dindex(dkey())),b=BK(P.book);
 box.innerHTML=TRAINERS.map(tile).join('')+
  '<a class="tile wide daily-t" href="#daily" style="--c:'+b.c+'"><small>Задача дня · '+new Date().getDate()+' '+MON[new Date().getMonth()]+'</small><h3>Задача дня</h3><p>'+P.text.slice(0,110).replace(/\s\S*$/,'')+'…</p>'+ico(P.hero)+'<span class="best">Решить →</span></a>'+
  '<a class="tile wide sheets-t" href="#sheets" style="--c:#111"><small>Для печати</small><h3>Листы и шифровки</h3><p>Лист примеров по любой теме за секунду. С секретным словом — для друга или для урока.</p>'+ico('tyuk-slate')+'<span class="best">Собрать лист →</span></a>'})();

/* ================== ЗАПУСК ================== */
route(true);
requestAnimationFrame(loop);
