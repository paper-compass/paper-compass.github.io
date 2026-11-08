"use strict";
document.documentElement.classList.add('js');
var RM=matchMedia('(prefers-reduced-motion: reduce)').matches;
var $=function(s,r){return (r||document).querySelector(s)}, $$=function(s,r){return [].slice.call((r||document).querySelectorAll(s))};
var clamp=function(v,a,b){return Math.max(a,Math.min(b,v))}, lerp=function(a,b,t){return a+(b-a)*t};
var ease=function(t){return t<.5?2*t*t:1-Math.pow(-2*t+2,2)/2};
function el(h){var t=document.createElement('template');t.innerHTML=h.trim();return t.content.firstChild}
/* герои — цветные кадры в img/h; старые имена поз ведут на новые картинки */
var PA={'tyuk-sly':'tyuk-oops','tyuk-slate':'tyuk-stand','tyuk-walk':'tyuk-stand','gosha-thumb':'gosha-thumbs-up','gosha-shrug':'gosha-stand','gosha-boxes':'gosha-stand',
 'nav-cheer':'nav-back','nav-walk':'nav-back','nav-point':'nav-map','nav-sit':'nav-map','maya-write':'maya-stand','maya-phones':'maya-headphones',
 'asya-water':'asya-sprouts','asya-tray':'asya-sprouts','asya-think':'asya-stand','tim-box':'tim-tools','tim-think':'tim-stand','lev-run':'lev-stand',
 'miron-run':'miron-point','rumb-show':'rumb-point','rumb-wet':'rumb-doubt','rumb-34':'rumb-turn-2','rumb-edge':'rumb-turn-3','rumb-back':'rumb-turn-4','varya-hand':'hand-door'};
var FR={};('asya-sprouts asya-stand gosha-stand gosha-thumbs-up grach-lens grach-mug grach-stand korn-mug korn-read korn-stand lev-point lev-stand maya-headphones maya-stand '+
 'miron-book miron-point miron-think rumb-doubt rumb-front rumb-point tim-stand tim-tools tyuk-oops tyuk-proud tyuk-stand').split(' ').forEach(function(n){FR[n]=1});
var IMG=function(n){return 'img/'+n+'.webp'}, POSE=function(n){return 'h/'+(PA[n]||n)+'.webp'};
/* поза: строка-имя или {src, blink, talk, s}; кадры моргания и речи подхватываются сами, если они есть */
function pdef(d){if(typeof d!=='string')return d;var n=PA[d]||d;return FR[n]?{src:n,blink:n+'-blink',talk:n+'-talk'}:{src:n}}
var cache={};function pic(src){if(!cache[src]){var i=new Image();i.decoding='async';i.src=src;cache[src]=i}return cache[src]}
/* «бумажная наклейка»: белый контур и мягкая тень вокруг вырезанного героя (готовится один раз на позу) */
function sticker(im){if(!im||!im.complete||!im.naturalWidth)return null;if(im._s)return im._s;
 var w=im.naturalWidth,h=im.naturalHeight,r=Math.max(3,Math.round(h*.012)),p=r*2+2,c=document.createElement('canvas');c.width=w+2*p;c.height=h+2*p;var x=c.getContext('2d');
 var s=document.createElement('canvas');s.width=w;s.height=h;var sx=s.getContext('2d');sx.drawImage(im,0,0);sx.globalCompositeOperation='source-in';sx.fillStyle='#fff';sx.fillRect(0,0,w,h);
 var k=document.createElement('canvas');k.width=w;k.height=h;var kx=k.getContext('2d');kx.drawImage(im,0,0);kx.globalCompositeOperation='source-in';kx.fillStyle='#000';kx.fillRect(0,0,w,h);
 var a,i;x.globalAlpha=.18;for(i=0;i<12;i++){a=i/12*6.283;x.drawImage(k,p+Math.cos(a)*r+r*.5,p+Math.sin(a)*r+r*.9)}
 x.globalAlpha=1;for(i=0;i<20;i++){a=i/20*6.283;x.drawImage(s,p+Math.cos(a)*r,p+Math.sin(a)*r)}x.drawImage(s,p,p);x.drawImage(im,p,p);im._s=c;return c}
/* поза может быть строкой или набором кадров {src, blink, talk} — моргание и речь подхватятся сами */
function poseFiles(d){d=pdef(d);return [d.src,d.blink,d.talk].filter(Boolean)}

/* ================== ГЕРОИ: позы и реплики из книг ================== */
var CAST={
 rumb:{name:'Румб',h:.27,idle:'front',poses:{front:'rumb-front',q:'rumb-34',edge:'rumb-edge',back:'rumb-back',point:'rumb-point',show:'rumb-show',doubt:'rumb-doubt',wet:'rumb-wet'},special:'spin',
   acts:[{pose:'point',say:'Знак × значит: по столько-то взять столько-то раз.'},{pose:'show',say:'Два моста — два удвоения. Не пропусти второй!'},{pose:'doubt',say:'Осторожно: камни-ловушки с ответами «+».'},{spin:1,say:'Строго на север!'}]},
 tyuk:{name:'Тюк',h:.40,idle:'stand',walk:'walk',poses:{stand:'tyuk-stand',walk:'tyuk-stand',fly:{src:'tyuk-fly-1',s:.86},fly2:{src:'tyuk-fly-2',s:.86},fly3:{src:'tyuk-fly-3',s:.86},proud:'tyuk-proud',sly:'tyuk-oops',slate:'tyuk-stand'},special:'fly',
   acts:[{pose:'slate',say:'Крестики-нолики с примерами? Чур, я крестики!'},{pose:'proud',say:'Вхожу с 8 бочками, выхожу с 32. Мост работает!'},{fly:1,say:'Последний переход. А можно побыстрее?'},{pose:'sly',say:'Пишу: восемью восемь — 63. Стоп, 63 — это 7 × 9.'}]},
 nav:{name:'Штурман',h:.40,idle:'back',walk:'walk',poses:{back:'nav-back',walk:'nav-walk',point:'nav-point',cheer:'nav-cheer',map:'nav-map',sit:'nav-sit'},
   acts:[{pose:'map',say:'Это ты: штурман-стажёр. Расчёты экспедиции — твои.'},{pose:'point',say:'Отдать швартовы!'},{pose:'cheer',say:'Туман уходит с клетки, когда в неё вписан верный ответ.'}]},
 grach:{name:'Грач',h:.66,idle:'stand',poses:{stand:'grach-stand',lens:'grach-lens',mug:'grach-mug'},
   acts:[{pose:'lens',say:'Тихо. Сколько яблок? Шестьдесят. Сколько вас? Трое. Делим.'},{pose:'stand',say:'Делится. Тридцать на троих и двенадцать на троих. По частям.'}]},
 miron:{name:'Мирон',h:.58,idle:'point',walk:'run',poses:{point:'miron-point',run:'miron-point',think:'miron-think',book:'miron-book'},
   acts:[{pose:'run',say:'Пачки по десять? Тут и считать нечего! Двадцать на три — это двадцать три!'},{pose:'think',say:'Двоих… Двух воров? Две улики? Двух…'}]},
 delitel:{name:'Делитель',h:.66,idle:'door',walk:'walk',cycle:['w1','w2','w3','w4'],poses:{walk:'delitel-walk',door:'delitel-door',w1:'delitel-walk-1',w2:'delitel-walk-2',w3:'delitel-walk-3',w4:'delitel-walk-4'},dark:true,
   acts:[{say:'Делить поровну умеют все. Делить честно — единицы. — Д.'}]},
 korn:{name:'Корн',h:.64,idle:'stand',poses:{stand:'korn-stand',read:'korn-read',mug:'korn-mug'},
   acts:[{pose:'read',say:'Сначала прикинь. Потом считай. Потом проверь.'},{pose:'stand',say:'Ноль. Он тоже цифра. Его не пропускают.'},{pose:'mug',say:'Пять в уме. Ум для того и выдан.'}]},
 lev:{name:'Лев',h:.52,idle:'point',walk:'run',poses:{point:'lev-point',run:'lev-run'},
   acts:[{pose:'run',say:'Делю 816 на 8, получаю 12. Быстро же?'},{pose:'point',say:'Скорость знаю, время знаю. А расстояние — это на глаз.'}]},
 maya:{name:'Майя',h:.52,idle:'phones',poses:{phones:'maya-phones',write:'maya-write'},
   acts:[{pose:'write',say:'Делю 52 на 5. А два на пять не делится. Что писать?'},{pose:'phones',say:'Связь с «Церерой-4» — через сорок минут.'}]},
 tim:{name:'Тим',h:.54,idle:'box',poses:{box:'tim-box',think:'tim-think'},
   acts:[{pose:'think',say:'4920 на 60. Я бы сказал — штук восемьдесят, плюс-минус.'},{pose:'box',say:'Насос в порядке. Это я проверил.'}]},
 asya:{name:'Ася',h:.52,idle:'tray',poses:{tray:'asya-tray',water:'asya-water',think:'asya-think'},
   acts:[{pose:'water',say:'Тридцать лотков по сорок ростков. Это же надо столбик рисовать.'},{pose:'think',say:'Ростки кто-то трогал ночью.'}]},
 gosha:{name:'Гоша',h:.53,idle:'thumb',poses:{thumb:'gosha-thumb',shrug:'gosha-shrug',boxes:'gosha-boxes'},
   acts:[{pose:'boxes',say:'Сто ящиков по десять пайков. Я до утра буду складывать.'},{pose:'shrug',say:'Семь на восемь — пятьдесят шесть, пишу шесть… а пять куда?'},{pose:'thumb',say:'Вчера на полке было ровно сто.'}]}
};
/* фразы, которыми отвечает другой герой (диалоги из книг) */
var REPLY={'Сто ящиков по десять пайков. Я до утра буду складывать.':['korn','Допиши нуль. И ложись спать.'],
 'Делю 816 на 8, получаю 12. Быстро же?':['korn','Быстро. Прикинь: 8 · 100 уже 800. Сколько цифр должно быть в частном?'],
 '4920 на 60. Я бы сказал — штук восемьдесят, плюс-минус.':['korn','Плюс-минус шлюз не откроет. Убери нули и раздели.'],
 'Тридцать лотков по сорок ростков. Это же надо столбик рисовать.':['korn','Три на четыре. Потом нули. Столбик отдохнёт.']};

/* ================== КНИГИ И ИХ ИСТОРИИ ================== */
var AUTHOR='https://www.litres.ru/author/a-elarin-34117204/',HOME_BOOKS=4;
var BOOKS=[
{id:'archipelago',short:'Архипелаг Сто',title:'Экспедиция по Архипелагу Сто',topic:'Таблица умножения',grade:'2–3 класс',grades:[2,3],needs:['table'],c:'#1f5fb8',d:'#081a3a',
 cover:'cover-b1',pop:'tyuk-proud',url:'https://www.litres.ru/book/a-elarin-34117204/tablitsa-umnozheniia-ekspeditsiia-po-arkhipelagu-sto-74669324/',
 meta:['2–3 класс','60 занятий по 15 минут','7–9 лет'],sound:'sea',
 facts:['Таблица умножения и деления без зубрёжки — через хитрости','Пароли, лабиринты и рисунки складываются из верных ответов','«Найди ошибку Тюка», задачи капитана, мини-проверка после каждой главы','Ответы на отрезной полоске и в конце'],
 chapters:[
  {kind:'scroll',scene:'bg/bg-harbor',fg:'bg/fg-harbor',fx:'sea',cam:[[1.05,0,0],[1.22,-5,2]],title:true,blur:1.2,br:.72,
   caps:[{at:.05,t:'<b>Гавань Сборов.</b> Штурман-стажёр, тебе поручены расчёты экспедиции.'},{at:.35,t:'Перед тобой Архипелаг Сто — сто клеток моря под Туманом-Забывакой.'},{at:.62,t:'Твой наставник — Румб, компас, вырезанный из старой морской карты. Он точен и не выносит сырости. С тобой юнга Тюк, пеликан. Он торопится и часто ошибается.'}],
   cast:[{id:'nav',x:.72,at:0,face:1},{id:'rumb',x:.5,at:.55,enter:'left'},{id:'tyuk',x:.88,at:.68,enter:'right',face:-1}],
   say:[{at:.78,id:'tyuk',i:0},{at:.9,id:'rumb',i:0}]},
  {kind:'game',game:'fog',scene:'bg/bg-sea-map',fx:'sea',blur:3,br:.7,num:'Глава 2',name:'Туман-Забывака',
   cast:[{id:'rumb',x:.66,face:-1,h:.30},{id:'tyuk',x:.86,face:-1,h:.42}]},
  {kind:'scroll',scene:'bg/bg-harbor',fx:'sea',num:'Глава 3',name:'Остров за островом',cam:[[1.35,-6,6],[1.05,-2,0]],blur:1.5,br:.8,
   caps:[{at:.05,t:'На каждом острове — одна хитрость. <b>×4</b> — дважды удвоить. <b>×9</b> — это ×10 без одной группы.'},{at:.4,t:'Восьмёрка — «пять рук и ещё три». Новые ответы выводятся из уже известных, поэтому запоминать приходится меньше.'},{at:.7,t:'А ошибки Тюка ловишь ты.'}],
   cast:[{id:'nav',x:.24,at:0,pose:'point'},{id:'rumb',x:.44,at:.2,enter:'left'},{id:'tyuk',x:.78,at:.45,enter:'fly',face:-1}],
   say:[{at:.55,id:'tyuk',i:3},{at:.8,id:'rumb',i:1}]}
 ]},
{id:'bureau',short:'Бюро нерешённых дел',title:'Бюро нерешённых дел',topic:'Внетабличное умножение и деление',grade:'3 класс',grades:[3],needs:['div','rem'],c:'#c8281e',d:'#120807',
 cover:'cover-b2',pop:'miron-point',url:'https://www.litres.ru/book/a-elarin-34117204/vnetablichnoe-umnozhenie-i-delenie-biuro-nereshionnykh-del-74689524/',
 meta:['3 класс','15 дел, 60 занятий','8–10 лет'],sound:'noir',
 facts:['Внетабличное умножение и деление в пределах 100','Деление с остатком, столбик и уголок','Шифры, слежка по карте, проявка улик','В последнем деле — настоящее имя Делителя'],
 chapters:[
  {kind:'scroll',scene:'bg/bg-bureau',fg:'bg/fg-bureau',fx:'dust',cam:[[1.04,0,0],[1.22,3,-2]],title:true,br:.68,blur:1.2,
   caps:[{at:.05,t:'<b>Город Делинск.</b> Подвал старой библиотеки. На двери — табличка «Бюро нерешённых дел».'},{at:.35,t:'Инспектор Грач не верит словам без доказательств. Напарник Мирон торопится с версиями. А ты — новый сотрудник.'}],
   cast:[{id:'grach',x:.78,at:0,face:-1},{id:'miron',x:.52,at:.3,enter:'left',face:1}],
   say:[{at:.55,id:'miron',i:0},{at:.75,id:'grach',i:0}]},
  {kind:'scroll',scene:'b2-note',fx:'dust',num:'Улика',name:'Записка',cam:[[1.2,0,4],[1.45,-6,6]],br:.9,
   caps:[{at:.05,t:'Уважаемое Бюро! Поздравляю с новым сотрудником.',note:1},{at:.25,t:'Карточки сосчитаны, яблоки поделены — мило. Но это была разминка.',note:1},{at:.45,t:'Подсказка, раз уж вы так стараетесь: ИЩИ ДВОИХ.<br>— Д.',note:1},{at:.7,t:'Грач перечитывает записку дважды и молча отставляет кружку.'}],
   cast:[{id:'grach',x:.8,at:.66,enter:'right',pose:'lens',face:-1,h:.62}],
   say:[{at:.82,id:'grach',text:'Вот и двое. Пошли.'}]},
  {kind:'game',game:'hunt',scene:'bg/bg-archive-night',fx:'dust',num:'Дело',name:'Тень в архиве',br:.85,blur:1,
   cast:[{id:'delitel',x:.2,h:.6}]}
 ]},
{id:'borey',short:'Самозванец на борту',title:'Самозванец на борту',topic:'Умножение и деление столбиком',grade:'4 класс',grades:[4],needs:['col','div2'],c:'#e26812',d:'#0b0a10',
 cover:'cover-b3',pop:'lev-point',url:AUTHOR,meta:['4 класс','60 вахт по 20 минут','9–11 лет'],sound:'space',
 facts:['Столбик и уголок на одно- и двузначное, нули в частном, остаток','Радиограммы, кодовые замки, аварийные вахты с контрольной суммой','Задачи на движение и порядок действий','Ответы на отрезной полоске и в конце'],
 chapters:[
  {kind:'scroll',scene:'bg/bg-cargo',fx:'dust',cam:[[1.05,0,0],[1.25,0,3]],title:true,blur:1.2,br:.7,
   caps:[{at:.05,t:'<b>«Борей» стоит у лунной станции</b> с открытыми люками. До старта — двое суток, и каждый ящик должен пройти через твой планшет.'},{at:.45,t:'Шестьдесят суток пути. Шестеро кадетов, один наставник — так написано в бортовом журнале.'}],
   cast:[{id:'korn',x:.76,at:0,face:-1},{id:'gosha',x:.5,at:.3,enter:'left',face:1,pose:'boxes'}],
   say:[{at:.6,id:'gosha',i:0},{at:.85,id:'korn',i:0}]},
  {kind:'scroll',scene:'bg/bg-bridge',fg:'bg/fg-bridge',fx:'warp',num:'Сутки 1–9',name:'Старт',cam:[[1.22,0,0],[1.05,0,-2]],hud:1,blur:1.2,br:.72,
   caps:[{at:.05,t:'«Борей» отходит от станции. Утром Гоша пересчитывает пайки на полке лавки и хмурится: «Вчера было ровно сто».'},{at:.45,t:'В журнале появляются исправленные цифры. Люки открываются ночью. На складе тают пайки.'}],
   cast:[{id:'lev',x:.18,at:0,face:1,pose:'run'},{id:'maya',x:.38,at:.15,enter:'left'},{id:'asya',x:.6,at:.3,enter:'right',face:-1},{id:'tim',x:.8,at:.45,enter:'right',face:-1}],
   say:[{at:.3,id:'lev',i:0},{at:.55,id:'maya',i:0},{at:.8,id:'tim',i:0}]},
  {kind:'game',game:'rations',scene:'bg/bg-mess',fx:'dust',num:'Аварийная вахта',name:'Девятые сутки',alert:1,blur:2.5,br:.72,
   cast:[{id:'korn',x:.08,face:1,h:.6},{id:'gosha',x:.22,face:1,h:.5},{id:'lev',x:.36,face:1,h:.5,pose:'point'}]}
 ]},
{id:'logic',short:'Логика тихого города',title:'Логика тихого города',topic:'100 логических задач',grade:'12+',grades:[5],needs:['hard'],c:'#d6232a',d:'#111',
 cover:'cover-lg',pop:null,url:AUTHOR,meta:['от 12 лет и взрослым','100 задач','подсказки и решения'],sound:'clock',light:1,
 facts:['100 задач с подсказками и подробными решениями','Логика, числа, геометрия, вероятность, стратегия','От быстрых разминок до задач на целый вечер','Для подростков от 12 лет и взрослых'],
 chapters:[
  {kind:'scroll',scene:'lg-map',fx:'beam',cam:[[1.1,0,6],[1.6,-4,-8]],title:true,ta:.55,
   caps:[{at:.05,t:'<b>Тихий город.</b> Расписание дежурств, маршрут до библиотеки, ящики на складе.'},{at:.4,t:'За спокойными сюжетами прячутся задачи на логику, числа, геометрию, вероятность и стратегию.'},{at:.7,t:'К каждой — отдельная подсказка: можно подсмотреть намёк, не открывая ответ.'}],cast:[]},
  {kind:'game',game:'lighthouse',scene:'lg-map',fx:'beam',num:'Задача 01',name:'Очередь у маяка',ta:.55,cast:[]}
 ]}
];
var NEEDS=[{k:'table',t:'Таблица умножения'},{k:'div',t:'Внетабличное: 23 × 4, 78 : 3'},{k:'rem',t:'Деление с остатком'},{k:'col',t:'Столбик'},{k:'div2',t:'Деление на двузначное'},{k:'hard',t:'Хочется задач посложнее'}];
var GRADES=[{k:2,t:'2 класс'},{k:3,t:'3 класс'},{k:4,t:'4 класс'},{k:5,t:'5 и старше'}];

/* ================== ЗВУК (синтез, без файлов) ================== */
var Snd=(function(){var ac=null,on=false,master,amb=null,cur=null;
 function noise(sec){var b=ac.createBuffer(1,ac.sampleRate*sec,ac.sampleRate),d=b.getChannelData(0),last=0;for(var i=0;i<d.length;i++){var w=Math.random()*2-1;last=(last+.02*w)/1.02;d[i]=last*3.5}return b}
 function white(sec){var b=ac.createBuffer(1,ac.sampleRate*sec,ac.sampleRate),d=b.getChannelData(0);for(var i=0;i<d.length;i++)d[i]=Math.random()*2-1;return b}
 function loop(buf){var s=ac.createBufferSource();s.buffer=buf;s.loop=true;s.start();return s}
 function build(kind){var g=ac.createGain();g.gain.value=0;g.connect(master);var nodes=[g],timer=null;
  if(kind==='sea'){var s=loop(noise(4)),f=ac.createBiquadFilter();f.type='lowpass';f.frequency.value=600;var lg=ac.createGain();lg.gain.value=.5;
    var lfo=ac.createOscillator();lfo.frequency.value=.12;var la=ac.createGain();la.gain.value=.45;lfo.connect(la);la.connect(lg.gain);lfo.start();s.connect(f);f.connect(lg);lg.connect(g);nodes.push(s,lfo)}
  if(kind==='noir'){var r=loop(white(3)),hf=ac.createBiquadFilter();hf.type='bandpass';hf.frequency.value=3000;hf.Q.value=.6;var rg=ac.createGain();rg.gain.value=.08;r.connect(hf);hf.connect(rg);rg.connect(g);
    var o=ac.createOscillator();o.type='sawtooth';o.frequency.value=55;var of=ac.createBiquadFilter();of.type='lowpass';of.frequency.value=180;var og=ac.createGain();og.gain.value=.12;o.connect(of);of.connect(og);og.connect(g);o.start();nodes.push(r,o)}
  if(kind==='space'){[48,48.4,72.2].forEach(function(fq){var o=ac.createOscillator();o.frequency.value=fq;var og=ac.createGain();og.gain.value=.12;o.connect(og);og.connect(g);o.start();nodes.push(o)});
    timer=setInterval(function(){if(!on)return;blip(1320,.05,.03)},4200)}
  if(kind==='clock'||kind==='home'){var notes=[392,440,523.25,587.33,659.25,783.99];timer=setInterval(function(){if(!on)return;var n=notes[Math.floor(Math.random()*notes.length)];blip(n*(kind==='clock'?1:.5),1.6,.06)},kind==='clock'?1000:1400)}
  g.gain.setTargetAtTime(1,ac.currentTime,.8);return {g:g,nodes:nodes,timer:timer}}
 function blip(f,dur,vol){if(!ac||!on)return;var o=ac.createOscillator(),g=ac.createGain();o.type='sine';o.frequency.value=f;g.gain.value=0;g.gain.setTargetAtTime(vol,ac.currentTime,.005);g.gain.setTargetAtTime(0,ac.currentTime+.02,dur/4);o.connect(g);g.connect(master);o.start();o.stop(ac.currentTime+dur+.2)}
 function stopAmb(){if(!amb)return;var a=amb;a.g.gain.setTargetAtTime(0,ac.currentTime,.3);clearInterval(a.timer);setTimeout(function(){a.nodes.forEach(function(n){try{n.stop&&n.stop();n.disconnect()}catch(e){}})},1500);amb=null}
 return {toggle:function(){if(!ac){try{ac=new (window.AudioContext||window.webkitAudioContext)();master=ac.createGain();master.gain.value=.35;master.connect(ac.destination)}catch(e){return false}}
   on=!on;if(on){ac.resume();if(cur)amb=build(cur)}else stopAmb();return on},
  world:function(k){if(k===cur)return;cur=k;if(on){stopAmb();amb=build(k)}},
  pop:function(){blip(660,.25,.12);setTimeout(function(){blip(990,.2,.08)},60)},
  tick:function(){blip(2400+Math.random()*400,.03,.02)},
  ok:function(){[523,659,784,1046].forEach(function(f,i){setTimeout(function(){blip(f,.5,.1)},i*90)})},
  no:function(){blip(180,.4,.15)},
  alarm:function(){[0,1,2].forEach(function(i){setTimeout(function(){blip(880,.3,.12);setTimeout(function(){blip(660,.3,.12)},180)},i*420)})}}})();
$('#snd').addEventListener('click',function(){var o=Snd.toggle();this.setAttribute('aria-pressed',o);$('span',this).textContent=o?'Звук вкл.':'Звук'});

/* ================== УКАЗАТЕЛЬ ================== */
var ptr={x:-9999,y:-9999,vx:0,vy:0,lx:0,ly:0,t:0};
addEventListener('pointerdown',function(e){ptr.mouse=e.pointerType==='mouse'},{passive:true});
addEventListener('pointermove',function(e){ptr.mouse=e.pointerType==='mouse';ptr.vx=e.clientX-ptr.x;ptr.vy=e.clientY-ptr.y;ptr.x=e.clientX;ptr.y=e.clientY;ptr.t=performance.now()},{passive:true});
var mate=$('.mate'),mx=0,my=0,mang=0;
function mateTick(){if(ptr.x<-1000)return;if(!ptr.mouse){mate.style.opacity=0;return}mate.style.opacity=1;mx=lerp(mx,ptr.x,.25);my=lerp(my,ptr.y,.25);var sp=Math.hypot(ptr.vx,ptr.vy);if(sp>2)mang=lerp(mang,Math.atan2(ptr.vx,-ptr.vy)*180/Math.PI,.15);
 mate.style.transform='translate('+mx+'px,'+my+'px)';$('#mateN').setAttribute('transform','rotate('+mang+')');
 var t=document.elementFromPoint(ptr.x,ptr.y);mate.classList.toggle('big',!!(t&&t.closest&&t.closest('a,button,.door'))||hoverPup);
 mate.style.color=getComputedStyle(t&&t.closest&&t.closest('.stage')?t.closest('.stage'):document.body).color}
var hoverPup=false;

/* ================== МАРИОНЕТКА: изгиб, дыхание, пружины, прыжки, смена поз ================== */
function Puppet(stage,o){var c=CAST[o.id];this.st=stage;this.c=c;this.id=o.id;this.hx=o.x;this.x=o.x;this.y=o.y||.985;this.h=(o.h||c.h);this.face=o.face||1;this.baseFace=this.face;
 this.pose=o.pose||c.idle;this.basePose=this.pose;this.lean=0;this.leanV=0;this.sq=1;this.sqV=0;this.oy=0;this.vy=0;this.ph=Math.random()*9;this.alpha=1;this.act=0;this.dark=!!c.dark;
 this.tx=null;this.speed=.35;this.frames=null;this.fly=null;this.visible=!o.at;this.enterAt=o.at||0;this.enter=o.enter;
 for(var k in c.poses)poseFiles(c.poses[k]).forEach(function(f){pic(POSE(f))});}
Puppet.prototype.pd=function(){return pdef(this.c.poses[this.pose]||this.c.poses[this.c.idle])};
Puppet.prototype.img=function(){var d=this.pd(),t=performance.now()/1000,f=(this.talking&&d.talk&&Math.floor(t*7)%2)?d.talk:(d.blink&&((t+this.ph)%4.3)<.13)?d.blink:d.src;
 var im=pic(POSE(f));if(this.dark)return im;return sticker(im)||im};
function dimW(im){return im.naturalWidth||im.width||0}function dimH(im){return im.naturalHeight||im.height||0}
Puppet.prototype.setPose=function(p){if(!this.c.poses[p]||p===this.pose)return;this.pose=p;this.sq=.84;this.sqV=0;};
Puppet.prototype.jump=function(v){if(this.oy<0)return;this.vy=-(v||1.25);this.sq=.82;};
Puppet.prototype.walkTo=function(x,sp){this.tx=x;this.speed=sp||.35};
Puppet.prototype.show=function(){if(this.visible)return;this.visible=true;var e=this.enter;
 if(e==='left'){this.x=-.15;this.walkTo(this.hx,.45)}else if(e==='right'){this.x=1.15;this.walkTo(this.hx,.45)}
 else if(e==='fly'){this.startFly(-.2,this.hx)}else{this.oy=-.25;this.vy=0}};
Puppet.prototype.startFly=function(from,to){this.fly={t:0,from:from,to:to,dur:2.4};this.face=to>from?1:-1};
Puppet.prototype.spin=function(){var f=['q','edge','back','edge','q','front'],fc=[1,1,1,-1,-1,1],self=this;this.frames={list:f,faces:fc,i:0,t:0}};
Puppet.prototype.update=function(dt,t,W,H,rect){var c=this.c;
 // взгляд на указатель
 var px=ptr.x-rect.left,py=ptr.y-rect.top,inside=px>=0&&px<=W&&py>=0&&py<=H;
 var tl=inside?clamp((px-this.x*W)/W*1.6,-.7,.7):Math.sin(t*.4+this.ph)*.08;
 if(inside&&performance.now()-ptr.t<120)tl+=clamp(ptr.vx*.01,-.5,.5);
 tl+=clamp(scrollV*.004,-.6,.6);
 var k=38,d=5.2;this.leanV+=((tl-this.lean)*k-this.leanV*d)*dt;this.lean+=this.leanV*dt;
 this.sqV+=((1-this.sq)*160-this.sqV*11)*dt;this.sq+=this.sqV*dt;
 if(this.oy<0||this.vy<0){this.vy+=4.2*dt;this.oy+=this.vy*dt;if(this.oy>=0){this.oy=0;this.vy=0;this.sq=.8;this.sqV=-1}}
 if(this.tx!==null){var dx=this.tx-this.x,st=this.speed*dt;if(Math.abs(dx)<=st){this.x=this.tx;this.tx=null;this.face=this.baseFace;this.walking=false;if(c.walk&&this.pose===c.walk)this.pose=this.basePose}else{this.x+=Math.sign(dx)*st;this.face=Math.sign(dx);this.walking=true;if(c.walk&&c.poses[c.walk])this.pose=c.cycle?c.cycle[Math.floor(t*7)%c.cycle.length]:c.walk}}
 if(this.fly){var f=this.fly;f.t+=dt;var u=Math.min(1,f.t/f.dur);this.x=lerp(f.from,f.to,ease(u));this.flyY=-Math.sin(u*Math.PI)*.35;
   this.pose=['fly','fly2','fly3','fly2'][Math.floor(f.t*11)%4];if(u>=1){this.fly=null;this.flyY=0;this.pose=this.basePose;this.face=this.baseFace;this.sq=.78}}
 if(this.frames){var fr=this.frames;fr.t+=dt;if(fr.t>.085){fr.t=0;fr.i++;if(fr.i>=fr.list.length){this.frames=null;this.pose=this.basePose;this.face=this.baseFace}else{this.pose=fr.list[fr.i];this.face=this.baseFace*fr.faces[fr.i]}}}
};
Puppet.prototype.box=function(W,H){var im=this.img();if(!dimW(im))return null;var ph=this.h*H*(this.pd().s||1)*this.st.k,pw=ph*dimW(im)/dimH(im);
 var fx=this.x*W,fy=this.y*H+(this.oy+(this.flyY||0))*H*.5;return {x:fx-pw/2,y:fy-ph,w:pw,h:ph,fx:fx,fy:fy}};
Puppet.prototype.draw=function(ctx,t,W,H){if(!this.visible)return;var im=this.img();if(!dimW(im)||(im.complete===false))return;
 var ph=this.h*H*(this.pd().s||1)*this.st.k,pw=ph*dimW(im)/dimH(im),b=this.box(W,H);
 var bob=this.walking?-Math.abs(Math.sin(t*9))*ph*.025:0,sy=this.sq,sx=1/Math.sqrt(sy);
 ctx.save();ctx.translate(b.fx,b.fy+bob);
 // тень
 var air=clamp(-(this.oy+(this.flyY||0))*2,0,1);ctx.globalAlpha=.28*(1-air)*this.alpha;ctx.fillStyle='#000';ctx.beginPath();ctx.ellipse(0,-(this.oy+(this.flyY||0))*H*.5-bob,pw*.32*(1-air*.5),ph*.025,0,0,6.283);ctx.fill();
 ctx.globalAlpha=this.alpha;ctx.scale(this.face,1);
 if(this.dark)ctx.filter='brightness(0.18)';
 var S=26,iw=dimW(im),ih=dimH(im),breath=Math.sin(t*1.9+this.ph),lean=this.lean*this.face;
 for(var k=0;k<S;k++){var u=1-(k+.5)/S,bump=Math.exp(-Math.pow((u-.62)/.16,2));
  var dx=lean*ph*.11*Math.pow(u,1.7)+Math.sin(t*1.1+this.ph)*ph*.006*u*u;
  var wk=pw*sx*(1+.018*breath*bump),hk=ph*sy/S;
  var srcY=k*ih/S,srcH=Math.min(ih-srcY,ih/S+1);
  ctx.drawImage(im,0,srcY,iw,srcH,-wk/2+dx,-ph*sy*(1+.006*breath)+k*hk,wk,hk+1);}
 ctx.restore()};
Puppet.prototype.say=function(text,who){this.st.bubble(this,text,who)};
Puppet.prototype.poke=function(){var c=this.c,a=c.acts[this.act%c.acts.length];this.act++;Snd.pop();
 if(a.spin){this.spin()}else if(a.fly){this.startFly(this.x,this.x>.5?this.x-.45:this.x+.45);var hx=this.x;var self=this;setTimeout(function(){self.startFly(self.x,hx)},2700)}else{if(a.pose){this.setPose(a.pose);this.basePose=a.pose}this.jump(1.1)}
 if(a.say){this.say(a.say);var r=REPLY[a.say],st=this.st;if(r){var other=st.pups.filter(function(p){return p.id===r[0]&&p.visible})[0];if(other)setTimeout(function(){other.jump(.9);other.say(r[1])},1700)}}};

/* ================== СЦЕНА ================== */
var STAGES=[],scrollV=0,lastScroll=scrollY;
function Stage(root,opts){this.root=root;this.cv=$('canvas.pup',root);this.ctx=this.cv.getContext('2d');this.fxc=$('canvas.fx',root);this.fx=this.fxc?this.fxc.getContext('2d'):null;
 this.kind=opts.fx||'';this.pups=[];this.bubs=$('.bubbles',root);this.ch=opts.ch||null;this.sec=opts.sec||root;this.active=false;this.parts=[];this.t=0;this.onFrame=opts.onFrame||null;this.p=0;this.c=opts.c||'#e26812';this.fit=!!opts.fit;this.k=1;
 var self=this;(opts.cast||[]).forEach(function(o){self.pups.push(new Puppet(self,o))});
 this.io=new IntersectionObserver(function(es){self.active=es[0].isIntersecting},{rootMargin:'100px'});this.io.observe(this.sec);
 this.resize();STAGES.push(this)}
Stage.prototype.resize=function(){var r=this.root.getBoundingClientRect(),d=Math.min(devicePixelRatio||1,2);this.W=r.width;this.H=r.height;this.d=d;
 this.k=this.fit&&r.height?clamp((r.width/r.height)/.95,.58,1):1;
 [this.cv,this.fxc].forEach(function(c){if(!c)return;c.width=r.width*d;c.height=r.height*d});this.parts=[]};
Stage.prototype.bubble=function(p,text,who){var b=el('<div class="bub"><small>'+(who||p.c.name)+'</small><span></span></div>');this.bubs.appendChild(b);p._bub&&p._bub.remove();p._bub=b;
 if(this.W<640)this.pups.forEach(function(q){if(q!==p&&q._bub){q._bub.remove();q._bub=null}});
 var sp=$('span',b),i=0;requestAnimationFrame(function(){b.classList.add('on')});
 p.talking=true;(function type(){if(i<=text.length){sp.textContent=text.slice(0,i);if(i%3===0)Snd.tick();i+=RM?text.length:1;setTimeout(type,RM?0:22)}else p.talking=false})();
 setTimeout(function(){b.classList.remove('on');setTimeout(function(){b.remove()},400);if(p._bub===b)p._bub=null},2600+text.length*45)};
Stage.prototype.hit=function(cx,cy){var r=this.root.getBoundingClientRect(),x=cx-r.left,y=cy-r.top,best=null;
 for(var i=this.pups.length-1;i>=0;i--){var p=this.pups[i];if(!p.visible)continue;var b=p.box(this.W,this.H);if(b&&x>b.x+b.w*.12&&x<b.x+b.w*.88&&y>b.y&&y<b.fy){best=p;break}}return best};
Stage.prototype.frame=function(dt){if(!this.active)return;this.t+=dt;var t=this.t,W=this.W,H=this.H,r=this.root.getBoundingClientRect(),ctx=this.ctx,d=this.d;
 if(this.onFrame)this.onFrame(dt,t,r);
 ctx.setTransform(d,0,0,d,0,0);ctx.clearRect(0,0,W,H);
 var self=this;this.pups.slice().sort(function(a,b){return a.h-b.h}).forEach(function(p){p.update(dt,t,W,H,r);p.draw(ctx,t,W,H);
   if(p._bub){var b=p.box(W,H);if(b){p._bub.style.left=clamp(b.fx,150,W-150)+'px';p._bub.style.top=Math.max(90,b.y+b.h*.06)+'px'}}});
 if(this.fx)FX[this.kind]&&FX[this.kind](this,dt,t)};

/* ================== ЭФФЕКТЫ ================== */
var FX={
 sea:function(s,dt,t){var c=s.fx,W=s.W,H=s.H;c.setTransform(s.d,0,0,s.d,0,0);c.clearRect(0,0,W,H);
  for(var L=0;L<4;L++){c.beginPath();var y0=H*(.86+L*.035),amp=6+L*3,len=180+L*60;c.moveTo(0,H);for(var x=0;x<=W+20;x+=16)c.lineTo(x,y0+Math.sin(x/len*6.283+t*(.9+L*.3)+L)*amp);c.lineTo(W,H);c.closePath();c.fillStyle='rgba(255,255,255,'+(.05+L*.035)+')';c.fill()}
  if(s.parts.length<70)s.parts.push({x:Math.random()*W,y:H*(.85+Math.random()*.15),v:20+Math.random()*30,l:0,m:1+Math.random()*2});
  c.fillStyle='#fff';s.parts.forEach(function(p){p.l+=dt;p.y-=p.v*dt;p.x+=Math.sin(p.l*3)*.3;c.globalAlpha=Math.max(0,.6-p.l*.4);c.fillRect(p.x,p.y,p.m,p.m)});c.globalAlpha=1;s.parts=s.parts.filter(function(p){return p.l<1.5})},
 rain:function(s,dt,t){var c=s.fx,W=s.W,H=s.H;c.setTransform(s.d,0,0,s.d,0,0);c.clearRect(0,0,W,H);while(s.parts.length<160)s.parts.push({x:Math.random()*W*1.2,y:Math.random()*H,v:700+Math.random()*500,l:10+Math.random()*18});
  c.strokeStyle='rgba(220,230,255,.22)';c.lineWidth=1;c.beginPath();s.parts.forEach(function(p){p.y+=p.v*dt;p.x-=p.v*dt*.18;if(p.y>H){p.y=-20;p.x=Math.random()*W*1.2}c.moveTo(p.x,p.y);c.lineTo(p.x+p.l*.18,p.y-p.l)});c.stroke()},
 dust:function(s,dt,t){var c=s.fx,W=s.W,H=s.H;c.setTransform(s.d,0,0,s.d,0,0);c.clearRect(0,0,W,H);while(s.parts.length<90)s.parts.push({x:Math.random()*W,y:Math.random()*H,r:Math.random()*2+.4,a:Math.random()*6});
  s.parts.forEach(function(p){p.a+=dt*.4;p.x+=Math.cos(p.a)*.15;p.y+=Math.sin(p.a*.7)*.12-.05;if(p.y<0)p.y=H;c.globalAlpha=.25+.25*Math.sin(p.a*2);c.fillStyle='#ffe9c8';c.beginPath();c.arc(p.x,p.y,p.r,0,6.283);c.fill()});c.globalAlpha=1},
 stars:function(s,dt,t){var c=s.fx,W=s.W,H=s.H;c.setTransform(s.d,0,0,s.d,0,0);c.clearRect(0,0,W,H);while(s.parts.length<220)s.parts.push({x:Math.random()*W,y:Math.random()*H,z:Math.random()});
  s.parts.forEach(function(p,i){p.x-=(p.z*30+Math.abs(scrollV)*p.z*2)*dt;if(p.x<0){p.x=W;p.y=Math.random()*H}c.globalAlpha=.25+.75*p.z*(.7+.3*Math.sin(t*3+i));c.fillStyle=i%11?'#fff':'#ffb27a';c.fillRect(p.x,p.y,1+p.z*2,1+p.z*2)});c.globalAlpha=1},
 warp:function(s,dt,t){var c=s.fx,W=s.W,H=s.H,cx=W*.5,cy=H*.42;c.setTransform(s.d,0,0,s.d,0,0);c.fillStyle='rgba(0,0,0,.35)';c.clearRect(0,0,W,H);while(s.parts.length<260)s.parts.push({a:Math.random()*6.283,r:Math.random()*40,v:.2+Math.random()});
  var sp=.6+s.p*3.2+Math.abs(scrollV)*.02;c.lineWidth=1.4;s.parts.forEach(function(p,i){var r0=p.r;p.r+=p.v*sp*(20+p.r*1.4)*dt;var x0=cx+Math.cos(p.a)*r0,y0=cy+Math.sin(p.a)*r0,x1=cx+Math.cos(p.a)*p.r,y1=cy+Math.sin(p.a)*p.r;
   c.strokeStyle=i%9?'rgba(255,255,255,'+clamp(p.r/400,0,.9)+')':'rgba(255,178,122,.9)';c.beginPath();c.moveTo(x0,y0);c.lineTo(x1,y1);c.stroke();if(p.r>Math.hypot(W,H)){p.r=Math.random()*30;p.a=Math.random()*6.283}})},
 beam:function(s,dt,t){var c=s.fx,W=s.W,H=s.H,cx=W*.62,cy=H*.38,a=t*.6;c.setTransform(s.d,0,0,s.d,0,0);c.clearRect(0,0,W,H);
  var g=c.createRadialGradient(cx,cy,0,cx,cy,Math.max(W,H));g.addColorStop(0,'rgba(255,240,200,.55)');g.addColorStop(1,'rgba(255,240,200,0)');c.fillStyle=g;c.beginPath();c.moveTo(cx,cy);c.arc(cx,cy,Math.max(W,H),a-.18,a+.18);c.closePath();c.fill();
  c.fillStyle='#fff6d8';c.beginPath();c.arc(cx,cy,9+Math.sin(t*6)*2,0,6.283);c.fill()},
 embers:function(s,dt,t){var c=s.fx,W=s.W,H=s.H;c.setTransform(s.d,0,0,s.d,0,0);c.clearRect(0,0,W,H);while(s.parts.length<70)s.parts.push({x:Math.random()*W,y:H+Math.random()*H*.3,v:15+Math.random()*35,a:Math.random()*6,r:Math.random()*2+.6});
  s.parts.forEach(function(p){p.y-=p.v*dt;p.a+=dt;p.x+=Math.sin(p.a)*.4;if(p.y<-10){p.y=H+10;p.x=Math.random()*W}c.globalAlpha=clamp(p.y/H,0,1)*.7;c.fillStyle='#ffb27a';c.beginPath();c.arc(p.x,p.y,p.r,0,6.283);c.fill()});c.globalAlpha=1}
};

/* общий цикл */
var lastT=performance.now();
function loop(now){var dt=Math.min(.05,(now-lastT)/1000);lastT=now;
 var sy=scrollY;scrollV=lerp(scrollV,(sy-lastScroll)/Math.max(dt,.001)*.02,.2);lastScroll=sy;
 hoverPup=false;STAGES.forEach(function(s){if(!s.root.isConnected)return;s.frame(dt);if(s.active&&s.hit(ptr.x,ptr.y))hoverPup=true});
 STAGES=STAGES.filter(function(s){if(!s.root.isConnected){s.io.disconnect();return false}return true});
 mateTick();scrollStory();requestAnimationFrame(loop)}
addEventListener('resize',function(){STAGES.forEach(function(s){s.resize()})});
document.addEventListener('click',function(e){if(e.target.closest('a,button,input,label,.panel,.board,.dropnote'))return;
 for(var i=0;i<STAGES.length;i++){var s=STAGES[i];if(!s.active)continue;var p=s.hit(e.clientX,e.clientY);if(p){p.poke();return}}});

/* ================== ГЛАВНАЯ ================== */
(function(){var g=$('#ticks'),s='';for(var i=0;i<72;i++){var a=i*5*Math.PI/180,r1=i%6?458:438;s+='<line x1="'+(500+r1*Math.sin(a))+'" y1="'+(500-r1*Math.cos(a))+'" x2="'+(500+480*Math.sin(a))+'" y2="'+(500-480*Math.cos(a))+'" stroke-width="'+(i%6?1:3)+'"/>'}g.innerHTML=s})();
(function(){var h=$('#kinetic'),k=0;function wrap(n){[].slice.call(n.childNodes).forEach(function(c){if(c.nodeType===3){var f=document.createDocumentFragment();c.textContent.split('').forEach(function(ch){var s=document.createElement('span');s.className='l';s.textContent=ch;s.style.animationDelay=(k++*55)+'ms';f.appendChild(s)});c.replaceWith(f)}else wrap(c)})}wrap(h);h.setAttribute('aria-label','Бумажный компас')})();
var homeCast=innerWidth<760?
 [{id:'rumb',x:.1,h:.13},{id:'tyuk',x:.28,face:-1,h:.2},{id:'grach',x:.48,h:.3},{id:'korn',x:.68,face:-1,h:.3},{id:'gosha',x:.87,face:-1,h:.26}]:
 [{id:'rumb',x:.05,h:.2},{id:'nav',x:.12,pose:'cheer',h:.29},{id:'tyuk',x:.2,face:-1,h:.3},{id:'grach',x:.29,h:.46},{id:'miron',x:.37,face:-1,h:.4},{id:'delitel',x:.47,h:.44,pose:'door'},
  {id:'korn',x:.58,h:.45},{id:'lev',x:.66,face:-1,h:.37},{id:'maya',x:.735,h:.36},{id:'asya',x:.805,h:.36},{id:'tim',x:.875,face:-1,h:.37},{id:'gosha',x:.95,face:-1,h:.37}];
var home=new Stage($('#homeStage'),{fx:'embers',cast:homeCast,onFrame:function(dt,t,r){
  var cx=r.left+r.width/2,cy=r.top+r.height*.44;if(ptr.x>-1000)$('#needle').style.transform='rotate('+(Math.atan2(ptr.x-cx,-(ptr.y-cy))*180/Math.PI)+'deg)';
  if(!this._fly)this._fly=6;this._fly-=dt;if(this._fly<0){this._fly=14;var ty=this.pups.filter(function(p){return p.id==='tyuk'})[0];if(ty&&!ty.fly){var hx=ty.x;ty.startFly(hx,hx<.5?hx+.5:hx-.5);setTimeout(function(){ty.startFly(ty.x,hx)},3200)}}
  if(!this._spin)this._spin=9;this._spin-=dt;if(this._spin<0){this._spin=11;var ru=this.pups[0];if(ru&&ru.id==='rumb')ru.spin()}}});
home.pups.forEach(function(p,i){p.oy=-.4-i*.05;p.vy=0});
$('#doors').innerHTML=BOOKS.slice(0,HOME_BOOKS).map(function(b){return '<a class="door" href="#story-'+b.id+'" style="--c:'+b.c+'"><div class="cv"><img src="'+IMG(b.cover)+'" alt="Обложка: '+b.title+'" width="700" height="990" loading="lazy"></div>'+
  (b.pop?'<img class="pop stk" src="'+POSE(b.pop)+'" alt="">':'')+'<div class="lbl"><small>'+b.grade+' · '+b.topic+'</small><b>'+b.short+'</b><span>Открыть историю →</span></div></a>'}).join('')+
  '<a class="door soon" href="#library"><div class="cv"><div style="text-align:center;padding:20px"><div class="eyebrow">Вся серия</div><b style="font:900 30px/1 var(--display);display:block;margin-top:10px;text-transform:uppercase">Библиотека</b><span style="display:block;margin-top:10px;font-weight:700">Поиск по классу и теме →</span></div></div></a>';
var sel={grade:null,need:null};
function opts(id,list,key){$(id).innerHTML=list.map(function(o){return '<button type="button" aria-pressed="false" data-k="'+o.k+'">'+o.t+'</button>'}).join('');
 $(id).addEventListener('click',function(e){var b=e.target.closest('button');if(!b)return;sel[key]=b.dataset.k;$$('button',$(id)).forEach(function(x){x.setAttribute('aria-pressed',x===b)});recommend()})}
opts('#o-grade',GRADES,'grade');opts('#o-need',NEEDS,'need');
function recommend(){var best=null,sc=-1;BOOKS.forEach(function(b){var s=0;if(sel.grade&&b.grades.indexOf(+sel.grade)>=0)s+=2;if(sel.need&&b.needs.indexOf(sel.need)>=0)s+=3;if(s>sc){sc=s;best=b}});
 $('#answer').innerHTML='<span>Начните с истории <span style="color:'+best.c+'">«'+best.short+'»</span></span><a href="#story-'+best.id+'">Открыть →</a>'}

/* ================== ИСТОРИЯ КНИГИ ================== */
function words(t,d){return t.split(' ').map(function(w,i){return '<span class="w"><span style="animation-delay:'+((d||200)+i*120)+'ms">'+w+'</span></span>'}).join(' ')}
var storyScroll=[];
function renderStory(b){var v=$('#v-story');v.innerHTML='';storyScroll=[];v.style.setProperty('--c',b.c);
 b.chapters.forEach(function(ch,ci){var sec=el('<section class="ch '+(ch.kind==='scroll'?'scroll':'')+'"></section>');
  var color=/^bg\//.test(ch.scene);
  var st=el('<div class="stage'+(color?' color':'')+(ch.alert?' alert':'')+(ch.hud?' has-hud':'')+(ch.title?' titling':'')+'" style="--c:'+b.c+';--sbg:'+b.d+';--br:'+(ch.br||1)+';--ta:'+(ch.ta||.9)+';--bl:'+(ch.blur||0)+'px"><div class="cam"><img src="'+IMG(ch.scene)+'" alt=""></div><div class="tint"></div><div class="shade"></div><canvas class="fx"></canvas><canvas class="pup"></canvas>'+(ch.fg?'<div class="fgw"><img src="'+IMG(ch.fg)+'" alt=""></div>':'')+'<div class="caps"></div><div class="bubbles"></div></div>');
  sec.appendChild(st);v.appendChild(sec);
  if(ch.title)st.appendChild(el('<div class="title-card"><div class="eyebrow">'+b.topic+' · '+b.grade+'</div><h1>'+words(b.title)+'</h1><div class="meta">'+b.meta.map(function(m){return '<span>'+m+'</span>'}).join('')+'</div></div>'));
  else if(ch.kind==='scroll')st.appendChild(el('<div class="chnum">'+(ch.num||'')+'<b>'+ch.name+'</b></div>'));
  if(ch.kind==='scroll'&&ci===0)st.appendChild(el('<div class="hintline"><i></i>Листайте — история начнётся</div>'));
  var caps=$('.caps',st);(ch.caps||[]).forEach(function(cp,k){var c=el('<div class="cap'+(cp.note?' note':'')+(cp.at>0.06?' wait':'')+'">'+cp.t+'</div>');c._at=cp.at;caps.appendChild(c)});
  if(ch.hud)st.appendChild(el('<div class="hud" aria-hidden="true"><div>Сутки <b id="hd-d">1</b></div><div>Пайки <b id="hd-r">1080</b></div><div>Экипаж <b>6</b></div><div>Курс <b>Церера-4</b></div></div>'));
  var stage=new Stage(st,{fx:ch.fx,cast:ch.cast,sec:sec,c:b.c,fit:1});
  if(ch.kind==='scroll')storyScroll.push({sec:sec,st:st,ch:ch,stage:stage,said:{}});
  if(ch.kind==='game')GAMES[ch.game](st,stage,b);
 });
 var i=BOOKS.indexOf(b),nx=BOOKS[(i+1)%BOOKS.length];
 v.appendChild(el('<section class="finale" style="--c:'+b.c+'"><div class="wrap"><div class="book3d"><img src="'+IMG(b.cover)+'" alt="Обложка: '+b.title+'" width="700" height="990"></div><div><div class="eyebrow">Продолжение — в книге</div><h2 style="font-size:clamp(44px,6vw,92px);text-transform:uppercase;margin-top:12px">'+b.short+'</h2><ul class="facts">'+b.facts.map(function(f){return '<li>'+f+'</li>'}).join('')+'</ul><a class="buy" href="'+b.url+'">Открыть на Литрес →</a></div></div></section>'));
 v.appendChild(el('<a class="nextstory" href="#story-'+nx.id+'" style="--nc:'+nx.c+'"><div class="wrap"><div><div class="eyebrow" style="color:#bbb">Следующая история</div><h2>'+nx.short+'</h2></div>'+(nx.pop?'<img class="stk" src="'+POSE(nx.pop)+'" alt="">':'<img src="'+IMG(nx.cover)+'" alt="" style="height:200px;border:2px solid #000">')+'</div></a>'));
}
function scrollStory(){storyScroll.forEach(function(o){var r=o.sec.getBoundingClientRect(),len=o.sec.offsetHeight-innerHeight,p=clamp(-r.top/len,0,1);o.stage.p=p;if(r.bottom<0||r.top>innerHeight)return;var ch=o.ch;
  var a=ch.cam[0],b=ch.cam[1],e=ease(p);var sc=lerp(a[0],b[0],e),tx=lerp(a[1],b[1],e),ty=lerp(a[2],b[2],e);$('.cam',o.st).style.transform='scale('+sc+') translate('+tx+'%,'+ty+'%)';
  var fw=$('.fgw',o.st);if(fw)fw.style.transform='scale('+(1+(sc-1)*1.6)+') translate('+tx*1.5+'%,'+(ty*1.5+(1-e)*1.5)+'%)';
  $$('.cap',o.st).forEach(function(c){if(p>=c._at&&c.classList.contains('wait')){c.classList.remove('wait');Snd.tick()}});
  if(innerWidth<761||innerHeight<521){var vis=$$('.cap:not(.wait)',o.st);vis.forEach(function(c,i){c.classList.toggle('past',i<vis.length-2)})}
  var tc=$('.title-card',o.st);if(tc){tc.classList.toggle('gone',p>.3);o.st.classList.toggle('titling',p<=.3)}
  o.stage.pups.forEach(function(pp){if(!pp.visible&&p>=pp.enterAt)pp.show()});
  (ch.say||[]).forEach(function(s,k){if(p>=s.at&&!o.said[k]){o.said[k]=1;var pp=o.stage.pups.filter(function(x){return x.id===s.id})[0];if(pp&&pp.visible){var a=CAST[s.id].acts[s.i];var txt=s.text||(a&&a.say);if(a&&a.pose&&!s.text){pp.setPose(a.pose);pp.basePose=a.pose}pp.jump(.8);pp.say(txt)}}});
  if(ch.hud){var d=Math.round(lerp(1,9,p)),rr=Math.round(lerp(1080,891,p));var hd=$('#hd-d',o.st),hr=$('#hd-r',o.st);if(hd){hd.textContent=d;hr.textContent=rr}}
 })}

/* ================== ИГРЫ-ГЛАВЫ ================== */
var GAMES={
/* Туман-Забывака: таблица 10 × 10 под туманом */
fog:function(st,stage,b){var wrap=el('<div class="fogwrap"><div class="board" style="background-image:url('+IMG('bg/sea-grid')+')"><canvas></canvas><div class="cells"></div><div class="ask" hidden><span></span><input class="inp" inputmode="numeric" aria-label="Ответ" maxlength="3"></div></div></div>');
 st.appendChild(wrap);st.appendChild(el('<div class="panel tr" style="width:min(380px,92vw)"><h3>Туман-Забывака</h3><p class="sub">Сто клеток моря. Туман уходит с клетки, когда в неё вписан верный ответ, — и с соседней тоже. Проведите по карте — ветер разгонит дымку.</p><div style="font:900 40px var(--display)"><span id="fogN">0</span><small style="font-size:18px"> / 100 клеток</small></div><div class="verdict" id="fogV" aria-live="polite">Нажмите на любую клетку.</div></div>'));
 var board=$('.board',wrap),cv=$('canvas',board),ctx=cv.getContext('2d'),cells=$('.cells',board),ask=$('.ask',board),inp=$('input',ask),cur=null,clear=[],wind=[],n=0;
 for(var i=0;i<100;i++){var r=Math.floor(i/10)+1,c=i%10+1;cells.appendChild(el('<button type="button" data-i="'+i+'" aria-label="'+r+' × '+c+'"></button>'));clear.push(0)}
 var fog=document.createElement('canvas');fog.width=fog.height=512;var fc=fog.getContext('2d');fc.fillStyle='#cfd8e2';fc.fillRect(0,0,512,512);
 for(var k=0;k<260;k++){var x=Math.random()*512,y=Math.random()*512,rr=20+Math.random()*90,g=fc.createRadialGradient(x,y,0,x,y,rr);var sh=k%3?235+Math.floor(Math.random()*20):150+Math.floor(Math.random()*40);g.addColorStop(0,'rgba('+sh+','+(sh+4)+','+Math.min(255,sh+12)+','+(k%3?.6:.35)+')');g.addColorStop(1,'rgba(255,255,255,0)');fc.fillStyle=g;fc.fillRect(x-rr,y-rr,rr*2,rr*2)}
 function size(){var r=board.getBoundingClientRect(),d=Math.min(devicePixelRatio||1,2);cv.width=r.width*d;cv.height=r.height*d}size();addEventListener('resize',size);
 board.addEventListener('pointermove',function(e){var r=board.getBoundingClientRect();wind.push({x:(e.clientX-r.left)/r.width,y:(e.clientY-r.top)/r.height,l:1})});
 var t0=0;stage.onFrame=function(dt,t){var W=cv.width,H=cv.height;ctx.globalCompositeOperation='source-over';ctx.clearRect(0,0,W,H);
  var ox=(t*14)%512,oy=(t*6)%512;ctx.globalAlpha=1;for(var a=-1;a<=Math.ceil(W/512);a++)for(var bb=-1;bb<=Math.ceil(H/512);bb++)ctx.drawImage(fog,a*512+ox,bb*512+oy*.5);
  ctx.globalAlpha=.6;for(a=-1;a<=Math.ceil(W/512);a++)for(bb=-1;bb<=Math.ceil(H/512);bb++)ctx.drawImage(fog,a*512-ox*1.3,bb*512-oy);
  ctx.globalAlpha=1;ctx.globalCompositeOperation='destination-out';var cw=W/10,chh=H/10;
  for(var i=0;i<100;i++){if(clear[i]<=0)continue;if(clear[i]<1)clear[i]=Math.min(1,clear[i]+dt*1.6);var cx=(i%10+.5)*cw,cy=(Math.floor(i/10)+.5)*chh,rad=cw*.95*clear[i],g=ctx.createRadialGradient(cx,cy,0,cx,cy,rad);g.addColorStop(0,'rgba(0,0,0,1)');g.addColorStop(.7,'rgba(0,0,0,.95)');g.addColorStop(1,'rgba(0,0,0,0)');ctx.fillStyle=g;ctx.fillRect(cx-rad,cy-rad,rad*2,rad*2)}
  wind.forEach(function(w){w.l-=dt*.7;var rad=cw*1.3,cx=w.x*W,cy=w.y*H,g=ctx.createRadialGradient(cx,cy,0,cx,cy,rad);g.addColorStop(0,'rgba(0,0,0,'+(.55*Math.max(0,w.l))+')');g.addColorStop(1,'rgba(0,0,0,0)');ctx.fillStyle=g;ctx.fillRect(cx-rad,cy-rad,rad*2,rad*2)});wind=wind.filter(function(w){return w.l>0}).slice(-40);
  ctx.globalCompositeOperation='source-over'};
 function open(i){if(clear[i]>0)return;cur=i;var r=Math.floor(i/10)+1,c=i%10+1,bt=cells.children[i];$('span',ask).textContent=r+' × '+c+' =';ask.hidden=false;
  ask.style.left=clamp((c-.5)*10,22,78)+'%';ask.style.top=Math.max(18,(r-.5)*10)+'%';inp.value='';inp.focus()}
 function reveal(i){if(clear[i]>0)return;clear[i]=.01;var bt=cells.children[i];bt.classList.add('done');bt.textContent=(Math.floor(i/10)+1)*(i%10+1);n++;$('#fogN',st).textContent=n;if(n>=100)hook('award','fog')}
 cells.addEventListener('click',function(e){var bt=e.target.closest('button');if(bt)open(+bt.dataset.i)});
 inp.addEventListener('keydown',function(e){if(e.key!=='Enter')return;var r=Math.floor(cur/10)+1,c=cur%10+1,ok=+inp.value===r*c;var tyuk=stage.pups.filter(function(p){return p.id==='tyuk'})[0],rumb=stage.pups.filter(function(p){return p.id==='rumb'})[0];
  hook('track','story',ok);if(ok){reveal(cur);var nb=[cur-1,cur+1,cur-10,cur+10].filter(function(j){return j>=0&&j<100&&clear[j]===0&&!(Math.abs(j-cur)===1&&Math.floor(j/10)!==Math.floor(cur/10))});if(nb.length)reveal(nb[Math.floor(Math.random()*nb.length)]);
   ask.hidden=true;Snd.ok();rumb&&rumb.jump(1.2);tyuk&&tyuk.setPose('proud');$('#fogV',st).className='verdict ok';$('#fogV',st).textContent=n>=100?'Архипелаг открыт! В книге — 15 островов и хитрость на каждом.':'Туман уходит! Ещё клетку?';if(n%10<2&&n>2)tyuk&&tyuk.say('Туман уходит! А можно побыстрее?')}
  else{ask.classList.remove('shake');void ask.offsetWidth;ask.classList.add('shake');Snd.no();rumb&&rumb.setPose('doubt');rumb&&rumb.say('Строго на север! Проверь: '+r+' × '+c+' — это '+r+' раз по '+c+'.');$('#fogV',st).className='verdict no';$('#fogV',st).textContent='Туман не уходит. Ещё раз.'}});
 inp.addEventListener('blur',function(){setTimeout(function(){if(document.activeElement!==inp)ask.hidden=true},200)});
},
/* Бюро: найти Делителя фонарём */
hunt:function(st,stage,b){st.appendChild(el('<div class="dark"></div>'));
 var panel=el('<div class="panel" style="width:min(420px,92vw)"><h3>Тень в архиве</h3><p class="sub">Кто-то ходит между стеллажами. Посветите фонарём — наведите курсор (или проведите пальцем) и найдите его.</p><div class="verdict" id="hv" aria-live="polite">Свет — только там, куда вы смотрите.</div><div id="ciph"></div></div>');st.appendChild(panel);
 var dark=$('.dark',st),del=stage.pups[0],caught=false,turn=0;del.dark=true;del.y=.9;del.walkTo(.7,.08);del.baseFace=1;
 st.addEventListener('pointermove',function(e){var r=st.getBoundingClientRect();dark.style.setProperty('--fx',(e.clientX-r.left)+'px');dark.style.setProperty('--fy',(e.clientY-r.top)+'px')});
 stage.onFrame=function(dt,t,r){if(caught)return;if(del.tx===null){turn++;del.walkTo(turn%2?.18:.62,.07+Math.random()*.04)}
  var bx=del.box(stage.W,stage.H);if(!bx)return;var px=ptr.x-r.left,py=ptr.y-r.top;if(px>bx.x&&px<bx.x+bx.w&&py>bx.y&&py<bx.fy){caught=true;del.dark=false;del.say('Делить поровну умеют все. Делить честно — единицы.','Делитель');Snd.alarm();
   var note=el('<button class="dropnote" type="button" style="left:'+(bx.fx/stage.W*100)+'%;top:'+(bx.y/stage.H*100+30)+'%">Записка Д.<br><small style="font:700 13px var(--body)">открыть</small></button>');st.appendChild(note);
   setTimeout(function(){del.dark=true;del.walkTo(del.x<.5?-.3:1.3,.6)},1600);setTimeout(function(){note.classList.add('on')},500);
   $('#hv',st).className='verdict ok';$('#hv',st).textContent='Он ушёл — но выронил записку!';note.addEventListener('click',function(){cipher($('#ciph',st));note.remove()})}};
 function cipher(box){var ex=[['56 : 7',8],['9 × 6',54],['63 : 9',7],['4 × 9',36]],key=[[6,'К'],[8,'Л'],[45,'О'],[54,'У'],[9,'Р'],[7,'П'],[32,'Е'],[36,'А']];
  box.innerHTML='<p class="sub" style="margin-top:14px">Записка зашифрована. Решите примеры и найдите ответы в ключе.</p><div class="keyt">'+key.map(function(k){return '<div>'+k[0]+'</div>'}).join('')+key.map(function(k){return '<div>'+k[1]+'</div>'}).join('')+'</div><div class="ciph">'+
   ex.map(function(e,i){return '<label for="hc'+i+'">'+e[0]+' =<input class="inp" id="hc'+i+'" inputmode="numeric" maxlength="3" autocomplete="off"></label>'}).join('')+'</div><div class="word">'+ex.map(function(){return '<span>?</span>'}).join('')+'</div>';
  var sp=$$('.word span',box);$$('input',box).forEach(function(inp,i){inp.addEventListener('input',function(){var v=+inp.value,k=key.filter(function(x){return x[0]===v})[0];sp[i].textContent=k?k[1]:'?';sp[i].classList.toggle('on',v===ex[i][1]);
   if(ex.every(function(e,j){return +$('#hc'+j,box).value===e[1]})){Snd.ok();hook('award','lupa');$('#hv',st).textContent='ЛУПА. Делитель подсказывает, чем искать. Дело продолжается в книге.'}})})}
},
/* Борей: аварийная вахта — сколько ртов кормит склад */
rations:function(st,stage,b){var door=el('<div class="door17"><img src="'+POSE('varya-hand')+'" alt=""><b>№ 17</b></div>');st.appendChild(door);
 st.appendChild(el('<div class="panel tr"><h3>Девятые сутки</h3><p class="sub">В день старта было 1080 пайков — ровно на шестерых по 3 пайка в сутки на 60 суток. Сегодня на полках 891. Корн видит цифры и уходит, ничего не сказав. Посчитайте сами.</p><div class="steps">'+
  '<label for="r1">Сколько пайков съели за 9 суток? <input class="inp" id="r1" inputmode="numeric"></label><label for="r2">Сколько уходит в сутки? <input class="inp" id="r2" inputmode="numeric"></label><label for="r3">Каждый ест 3 пайка в сутки. Сколько ртов кормит склад? <input class="inp" id="r3" inputmode="numeric"></label></div><div class="verdict" id="rv" aria-live="polite"></div></div>'));
 var A=[189,21,7],done=false,P=function(id){return stage.pups.filter(function(p){return p.id===id})[0]};
 $$('input',st).forEach(function(x){x.addEventListener('input',function(){var v=A.map(function(a,i){return +$('#r'+(i+1),st).value===a}),o=$('#rv',st);
  if(v[0]&&v[1]&&v[2]&&!done){done=true;o.className='verdict ok';o.textContent='Семь. А в экипаже — шестеро… Пересчитайте экипаж.';Snd.alarm();hook('award','crew');door.classList.add('on');
   P('korn').setPose('read');P('gosha').setPose('shrug');P('lev').setPose('point');P('lev').face=1;stage.pups.forEach(function(p,i){setTimeout(function(){p.jump(1)},i*150)});setTimeout(function(){P('gosha').say('Семь?! Нас же шестеро!')},900);setTimeout(function(){P('korn').say('Пересчитай экипаж.')},2800)}
  else if(!done){o.className='verdict';o.textContent=v[0]?(v[1]?'Осталось разделить на 3.':'Теперь — 189 : 9.'):''}})})
},
/* Логика: очередь у маяка */
lighthouse:function(st,stage,b){var names=['Ася','Борис','Вера','Глеб'],ans={'Ася':11,'Борис':9,'Вера':10,'Глеб':12},pick={};
 var pn=el('<div class="panel"><h3>Очередь у маяка</h3><p class="sub">Четыре фотографа пришли на маяк в 9, 10, 11 и 12 часов — по одному в каждый час. Борис пришёл раньше Аси. Ася — ровно за час до Глеба. Вера — не первой. Глеб — не в 11:00.</p><div class="grid4" role="group" aria-label="Время каждого"><div></div><div>9</div><div>10</div><div>11</div><div>12</div></div><div class="verdict" aria-live="polite">Отметьте час для каждого.</div></div>');st.appendChild(pn);
 var g=$('.grid4',pn),v=$('.verdict',pn);names.forEach(function(n){g.appendChild(el('<div style="text-align:left">'+n+'</div>'));[9,10,11,12].forEach(function(h){var bt=el('<button type="button" aria-label="'+n+', '+h+' часов">·</button>');bt.dataset.n=n;
  bt.onclick=function(){pick[n]=h;$$('[data-n="'+n+'"]',g).forEach(function(x){x.classList.toggle('on',x===bt);x.textContent=x===bt?'✓':'·'});var k=Object.keys(pick);
   if(k.length<4){v.className='verdict';v.textContent='Отмечено '+k.length+' из 4.';return}var u={};k.forEach(function(q){u[pick[q]]=1});if(Object.keys(u).length<4){v.className='verdict no';v.textContent='Двое в один час — так нельзя.';Snd.no();return}
   var ok=k.every(function(q){return pick[q]===ans[q]});v.className='verdict '+(ok?'ok':'no');v.textContent=ok?'Верно! Ещё 99 задач — в книге.':'Какое-то условие нарушено.';ok?(Snd.ok(),hook('award','beacon')):Snd.no()};g.appendChild(bt)})})}
};

/* ================== МАРШРУТЫ И ПЕРЕЛИСТЫВАНИЕ ================== */
/* разделы-инструменты регистрирует tools.js: VIEWS[имя](контейнер, аргумент) → {title, sound} */
var VIEWS={},VIEWT={library:'Истории',train:'Тренажёры',sheets:'Листы',daily:'Задача дня',journal:'Журнал'};
function hook(name){var f=window['on_'+name];if(typeof f==='function')f.apply(null,[].slice.call(arguments,1))}
var turn=$('.turn');
function setTheme(b,light){var top=$('#top');top.classList.toggle('light',!!light);
 if(light){top.style.setProperty('--top','#111');top.style.setProperty('--topbg','#f2ede2')}
 else{top.style.setProperty('--top','#fff');top.style.setProperty('--topbg',b?b.d:'#16130f')}}
function parseHash(){var h=location.hash.replace('#',''),m=/^story-(.+)$/.exec(h);
 if(m){var b=BOOKS.filter(function(x){return x.id===m[1]})[0];if(b)return {v:'story',b:b,h:h}}
 var t=/^([a-z]+)(?:-([a-z0-9]+))?$/.exec(h);if(t&&VIEWS[t[1]])return {v:'tool',name:t[1],arg:t[2]||null,h:h};
 return {v:'home',anchor:h&&h!=='home'?h:null,h:h}}
var curView=null;
function apply(){var r=parseHash();curView=r;
 $('#v-home').hidden=r.v!=='home';$('#v-story').hidden=r.v!=='story';$('#v-tool').hidden=r.v!=='tool';setTheme(r.b,r.v==='tool');
 var sec=r.v==='story'?'library':r.v==='tool'?r.name:'';$$('[data-sec]').forEach(function(a){a.toggleAttribute('aria-current',a.dataset.sec===sec)});
 if(r.v!=='story'){$('#v-story').innerHTML='';storyScroll=[]}
 if(r.v!=='tool')$('#v-tool').innerHTML='';
 if(r.v==='story'){renderStory(r.b);document.title=r.b.short+' — Бумажный компас';scrollTo(0,0);Snd.world(r.b.sound);hook('story',r.b)}
 else if(r.v==='tool'){var v=$('#v-tool');v.innerHTML='';v.removeAttribute('style');var meta=VIEWS[r.name](v,r.arg)||{};document.title=(meta.title||VIEWT[r.name])+' — Бумажный компас';scrollTo(0,0);Snd.world(meta.sound||'home')}
 else{document.title='Бумажный компас';Snd.world('home');if(r.anchor){var t=document.getElementById(r.anchor);t&&t.scrollIntoView()}else scrollTo(0,0)}
 hook('view',r);STAGES.forEach(function(s){s.resize()})}
function route(first){var r=parseHash();
 if(first||RM){apply();return}
 if(r.v==='home'&&r.anchor&&curView&&curView.v==='home'){var t=document.getElementById(r.anchor);t&&t.scrollIntoView({behavior:'smooth'});return}
 if(r.v==='tool'&&curView&&curView.v==='tool'&&curView.name===r.name){apply();return}
 turn.style.setProperty('--tc',r.b?r.b.c:'#111');$('em',turn).textContent=r.b?r.b.short:r.v==='tool'?VIEWT[r.name]:'Бумажный компас';
 turn.className='turn';void turn.offsetWidth;turn.classList.add('close');
 setTimeout(function(){apply();turn.className='turn';void turn.offsetWidth;turn.classList.add('open');setTimeout(function(){turn.className='turn'},600)},560)}
addEventListener('hashchange',function(){route(false)});
addEventListener('scroll',function(){$('#top').classList.toggle('solid',scrollY>40)},{passive:true});
/* запуск — в конце tools.js, когда все разделы зарегистрированы */
