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
/* версии картинок героев: после замены кадров героя увеличить его метку — иначе браузер возьмёт часть кадров из кэша и роба «мигает» старым цветом */
var HV={korn:2,lev:2,maya:2,tim:2,asya:2,gosha:2};
var IMG=function(n){return 'img/'+n+'.webp'}, POSE=function(n){var f=PA[n]||n,v=HV[f.split('-')[0]];return 'h/'+f+'.webp'+(v?'?v='+v:'')};
/* поза: строка-имя или {src, blink, talk, s}; кадры моргания и речи подхватываются сами, если они есть */
function pdef(d){if(typeof d!=='string')return d;var n=PA[d]||d;return FR[n]?{src:n,blink:n+'-blink',talk:n+'-talk'}:{src:n}}
var cache={};function pic(src){if(!cache[src]){var i=new Image();i.decoding='async';i.src=src;cache[src]=i}return cache[src]}
/* «бумажная наклейка»: белый контур и мягкая тень вокруг вырезанного героя (готовится один раз на позу) */
function sticker(im){var w=dimW(im),h=dimH(im);if(!w)return null;
 var r=Math.max(3,Math.round(h*.012)),p=r*2+2,c=document.createElement('canvas');c.width=w+2*p;c.height=h+2*p;var x=c.getContext('2d');
 var s=document.createElement('canvas');s.width=w;s.height=h;var sx=s.getContext('2d');sx.drawImage(im,0,0);sx.globalCompositeOperation='source-in';sx.fillStyle='#fff';sx.fillRect(0,0,w,h);
 var k=document.createElement('canvas');k.width=w;k.height=h;var kx=k.getContext('2d');kx.drawImage(im,0,0);kx.globalCompositeOperation='source-in';kx.fillStyle='#000';kx.fillRect(0,0,w,h);
 var a,i;x.globalAlpha=.18;for(i=0;i<12;i++){a=i/12*6.283;x.drawImage(k,p+Math.cos(a)*r+r*.5,p+Math.sin(a)*r+r*.9)}
 x.globalAlpha=1;for(i=0;i<20;i++){a=i/20*6.283;x.drawImage(s,p+Math.cos(a)*r,p+Math.sin(a)*r)}x.drawImage(s,p,p);x.drawImage(im,p,p);return c}
/* ---- картинки героев: очередь загрузки и готовые «наклейки» ----
   Сразу грузится только кадр, в котором герой стоит; остальные кадры и позы — фоном, по три за раз, после загрузки страницы.
   Картинка декодируется вне главного потока (decode), «наклейка» собирается в свободное время и сразу в нужном размере (STH). */
var HS={},HQ=[],hBusy=0,hGo=false,SQ=[];
var STH=Math.min(900,Math.ceil(Math.max(innerHeight,600)*.5*Math.min(devicePixelRatio||1,2)/50)*50);
function hero(src){return HS[src]||(HS[src]={src:src,st:0,im:null,sm:null,stk:null,dk:null})}
function hneed(src,now){var h=hero(src);if(h.st>0)return h;if(now){hload(h)}else if(!h.st){h.st=-1;HQ.push(h);hpump()}return h}
function hload(h){h.st=1;hBusy++;var im=new Image();im.decoding='async';h.im=im;
 im.onload=function(){(im.decode?im.decode():Promise.resolve()).catch(function(){}).then(function(){hBusy--;SQ.push(h);spump();hpump()})};
 im.onerror=function(){h.st=3;hBusy--;hpump()};im.src=h.src}
function hpump(){while(hGo&&hBusy<3&&HQ.length){var h=HQ.shift();if(h.st===-1)hload(h)}}
addEventListener('load',function(){setTimeout(function(){hGo=true;hpump()},800)});
var rIC=window.requestIdleCallback||function(f){return setTimeout(function(){f({timeRemaining:function(){return 6}})},30)};
function spump(){if(spump.on)return;spump.on=1;rIC(function(dl){spump.on=0;do{var h=SQ.shift();if(h)mkStk(h)}while(SQ.length&&dl.timeRemaining()>3);if(SQ.length)spump()},{timeout:150})}
function mkStk(h){var im=h.im,k=Math.min(1,STH/im.naturalHeight),w=Math.round(im.naturalWidth*k),hh=Math.round(im.naturalHeight*k);
 var b=document.createElement('canvas');b.width=w;b.height=hh;var bx=b.getContext('2d');bx.imageSmoothingQuality='high';bx.drawImage(im,0,0,w,hh);
 h.sm=b;h.stk=sticker(b);h.st=2;h.im=null}
/* силуэт (Делитель): затемнённая копия готовится один раз вместо фильтра в каждом кадре */
function darken(c){var d=document.createElement('canvas');d.width=c.width;d.height=c.height;var x=d.getContext('2d');x.drawImage(c,0,0);x.globalCompositeOperation='source-atop';x.fillStyle='rgba(0,0,0,.82)';x.fillRect(0,0,d.width,d.height);return d}
/* поза может быть строкой или набором кадров {src, blink, talk} — моргание и речь подхватятся сами */
function poseFiles(d){d=pdef(d);return [d.src,d.blink,d.talk].filter(Boolean)}

/* ================== ГЕРОИ: позы и реплики из книг ================== */
var CAST={
 rumb:{name:'Румб',h:.27,idle:'front',calm:1,poses:{front:'rumb-front',q:'rumb-34',edge:'rumb-edge',back:'rumb-back',point:'rumb-point',show:'rumb-show',doubt:'rumb-doubt',wet:'rumb-wet'},special:'spin',
   acts:[{pose:'point',say:'Знак × значит: по столько-то взять столько-то раз.'},{pose:'show',say:'Два моста — два удвоения. Не пропусти второй!'},{pose:'doubt',say:'Осторожно: камни-ловушки с ответами «+».'},{spin:1,say:'Строго на север!'}]},
 tyuk:{name:'Тюк',h:.40,idle:'stand',walk:'walk',poses:{stand:'tyuk-stand',walk:'tyuk-stand',fly:{src:'tyuk-fly-1',s:.86},fly2:{src:'tyuk-fly-2',s:.86},fly3:{src:'tyuk-fly-3',s:.86},proud:'tyuk-proud',sly:'tyuk-oops',slate:'tyuk-stand'},special:'fly',
   acts:[{pose:'slate',say:'Крестики-нолики с примерами? Чур, я крестики!'},{pose:'proud',say:'Вхожу с 8 бочками, выхожу с 32. Мост работает!'},{fly:1,say:'Ещё один остров — и финиш? Тогда полный вперёд!'},{pose:'sly',say:'Пишу: восемью восемь — 63. Стоп, 63 — это 7 × 9.'}]},
 nav:{name:'Штурман',h:.40,idle:'back',walk:'walk',poses:{back:'nav-back',walk:'nav-walk',point:'nav-point',cheer:'nav-cheer',map:'nav-map',sit:'nav-sit'},
   acts:[{pose:'map',say:'Это ты: штурман-стажёр. Расчёты экспедиции — твои.'},{pose:'point',say:'Отдать швартовы!'},{pose:'cheer',say:'Верный ответ — и над клеткой снова чистое море.'}]},
 grach:{name:'Грач',h:.66,idle:'stand',poses:{stand:'grach-stand',lens:'grach-lens',mug:'grach-mug'},
   acts:[{pose:'lens',say:'Без суеты. Яблок шестьдесят, нас трое — значит, делим на три.'},{pose:'stand',say:'Сорок два разбей на тридцать и двенадцать. Каждое делится на три.'}]},
 miron:{name:'Мирон',h:.58,idle:'point',walk:'run',poses:{point:'miron-point',run:'miron-point',think:'miron-think',book:'miron-book'},
   acts:[{pose:'run',say:'Двадцать умножить на три? Легко: двадцать три! …Ой. Погодите.'},{pose:'think',say:'Их двое? Два подозреваемых? Или две подсказки?'}]},
 delitel:{name:'Делитель',h:.66,idle:'door',walk:'walk',cycle:['w1','w2','w3','w4'],poses:{walk:'delitel-walk',door:'delitel-door',w1:'delitel-walk-1',w2:'delitel-walk-2',w3:'delitel-walk-3',w4:'delitel-walk-4'},dark:true,
   acts:[{say:'Поровну делить нетрудно. Честно — вот это редкость. — Д.'}]},
 korn:{name:'Корн',h:.64,idle:'stand',poses:{stand:'korn-stand',read:'korn-read',mug:'korn-mug'},
   acts:[{pose:'read',say:'Прикидка, расчёт, проверка. Порядок не меняем.'},{pose:'stand',say:'Ноль в частном — полноправная цифра. Потеряешь его — ответ развалится.'},{pose:'mug',say:'Держи пятёрку в голове. Голова для этого и нужна.'}]},
 lev:{name:'Лев',h:.52,idle:'point',walk:'run',poses:{point:'lev-point',run:'lev-run'},
   acts:[{pose:'run',say:'Восемьсот шестнадцать на восемь — двенадцать! Я молния?'},{pose:'point',say:'Летим столько-то, со скоростью такой-то… Расстояние угадаю.'}]},
 maya:{name:'Майя',h:.52,idle:'phones',poses:{phones:'maya-phones',write:'maya-write'},
   acts:[{pose:'write',say:'Пятьдесят два на пять. Пятёрку разделила, осталась двойка — и дальше что?'},{pose:'phones',say:'Связь с «Церерой-4» — через сорок минут.'}]},
 tim:{name:'Тим',h:.54,idle:'box',poses:{box:'tim-box',think:'tim-think'},
   acts:[{pose:'think',say:'Четыре тысячи девятьсот двадцать на шестьдесят… Около восьмидесяти. Сойдёт?'},{pose:'box',say:'Насос в порядке. Это я проверил.'}]},
 asya:{name:'Ася',h:.52,idle:'tray',poses:{tray:'asya-tray',water:'asya-water',think:'asya-think'},
   acts:[{pose:'water',say:'В каждом из тридцати лотков по сорок ростков. Опять столбиком?'},{pose:'think',say:'Ростки кто-то трогал ночью.'}]},
 gosha:{name:'Гоша',h:.53,idle:'thumb',poses:{thumb:'gosha-thumb',shrug:'gosha-shrug',boxes:'gosha-boxes'},
   acts:[{pose:'boxes',say:'Ящиков сотня, в каждом десять пайков. Складывать мне до утра!'},{pose:'shrug',say:'7 × 8 = 56. Шестёрку пишу. А пятёрку куда девать?'},{pose:'thumb',say:'Вчера пайков было больше. Я точно помню.'}]}
};
/* фразы, которыми отвечает другой герой (диалоги из книг) */
var REPLY={'Ящиков сотня, в каждом десять пайков. Складывать мне до утра!':['korn','Сто на десять — припиши ноль. Готово, иди спать.'],
 'Восемьсот шестнадцать на восемь — двенадцать! Я молния?':['korn','Молния, но мимо. 8 × 100 — уже 800, значит, в ответе три цифры.'],
 'Четыре тысячи девятьсот двадцать на шестьдесят… Около восьмидесяти. Сойдёт?':['korn','«Около» замок не откроет. Отбрось по нулю: 492 на 6.'],
 'В каждом из тридцати лотков по сорок ростков. Опять столбиком?':['korn','Три на четыре — двенадцать, и два нуля в хвост. Без столбика.']};

/* ================== КНИГИ И ИХ ИСТОРИИ ================== */
var AUTHOR='https://www.litres.ru/author/a-elarin-34117204/',HOME_BOOKS=4;
var BOOKS=[
{id:'archipelago',short:'Архипелаг Сто',title:'Экспедиция по Архипелагу Сто',topic:'Таблица умножения',grade:'2–3 класс',grades:[2,3],needs:['table'],c:'#1f5fb8',d:'#081a3a',
 cover:'cover-b1',pop:'tyuk-proud',url:'https://www.litres.ru/book/a-elarin-34117204/tablitsa-umnozheniia-ekspeditsiia-po-arkhipelagu-sto-74669324/',
 meta:['2–3 класс','60 занятий по 15 минут','7–9 лет'],sound:'sea',
 facts:['Таблица умножения и деления без зубрёжки — через хитрости','Пароли, лабиринты и рисунки складываются из верных ответов','«Найди ошибку Тюка», задачи капитана, мини-проверка после каждой главы','Ответы на отрезной полоске и в конце'],
 chapters:[
  {kind:'scroll',scene:'bg/bg-harbor',fg:'bg/fg-harbor',fx:'sea',cam:[[1.05,0,0],[1.22,-5,2]],title:true,blur:1.2,br:.72,
   caps:[{at:.05,t:'<b>Гавань Сборов.</b> Экспедиция готова к отплытию, а все расчёты в ней — твои, штурман-стажёр.'},{at:.35,t:'Впереди Архипелаг Сто: море, расчерченное на сто клеток. Над ними висит Туман-Забывака.'},{at:.62,t:'Рядом — Румб, бумажный компас из старой карты: строгий, точный и боится сырости. И юнга Тюк — пеликан, который считает быстрее, чем думает.'}],
   cast:[{id:'nav',x:.72,at:0,face:1},{id:'rumb',x:.5,at:.55,enter:'left'},{id:'tyuk',x:.88,at:.68,enter:'right',face:-1}],
   say:[{at:.78,id:'tyuk',i:0},{at:.9,id:'rumb',i:0}]},
  {kind:'game',game:'fog',scene:'bg/bg-sea-map',fx:'sea',blur:3,br:.7,num:'Глава 2',name:'Туман-Забывака',
   cast:[{id:'rumb',x:.66,face:-1,h:.30},{id:'tyuk',x:.86,face:-1,h:.42}]},
  {kind:'scroll',scene:'bg/bg-harbor',fx:'sea',num:'Глава 3',name:'Остров за островом',cam:[[1.35,-6,6],[1.05,-2,0]],blur:1.5,br:.8,
   caps:[{at:.05,t:'Каждый остров прячет свой приём. <b>×4</b>: удвой и ещё раз удвой. <b>×9</b>: умножь на 10 и убери одну группу.'},{at:.4,t:'Новое получается из знакомого — поэтому зубрить почти нечего.'},{at:.7,t:'А следить, чтобы Тюк не напутал, придётся тебе.'}],
   cast:[{id:'nav',x:.24,at:0,pose:'point'},{id:'rumb',x:.44,at:.2,enter:'left'},{id:'tyuk',x:.78,at:.45,enter:'fly',face:-1}],
   say:[{at:.55,id:'tyuk',i:3},{at:.8,id:'rumb',i:1}]}
 ]},
{id:'bureau',short:'Бюро нерешённых дел',title:'Бюро нерешённых дел',topic:'Внетабличное умножение и деление',grade:'3 класс',grades:[3],needs:['div','rem'],c:'#c8281e',d:'#120807',
 cover:'cover-b2',pop:'miron-point',url:'https://www.litres.ru/book/a-elarin-34117204/vnetablichnoe-umnozhenie-i-delenie-biuro-nereshionnykh-del-74689524/',
 meta:['3 класс','15 дел, 60 занятий','8–10 лет'],sound:'noir',
 facts:['Внетабличное умножение и деление в пределах 100','Деление с остатком, столбик и уголок','Шифры, слежка по карте, проявка улик','В последнем деле — настоящее имя Делителя'],
 chapters:[
  {kind:'scroll',scene:'bg/bg-bureau',fg:'bg/fg-bureau',fx:'dust',cam:[[1.04,0,0],[1.22,3,-2]],title:true,br:.68,blur:1.2,
   caps:[{at:.05,t:'<b>Город Делинск.</b> Под старой библиотекой есть дверь с табличкой «Бюро нерешённых дел».'},{at:.35,t:'Инспектор Грач верит только доказательствам. Мирон выдвигает версии быстрее, чем их проверяет. Ты — новенький в Бюро.'}],
   cast:[{id:'grach',x:.78,at:0,face:-1},{id:'miron',x:.52,at:.3,enter:'left',face:1}],
   say:[{at:.55,id:'miron',i:0},{at:.75,id:'grach',i:0}]},
  {kind:'scroll',scene:'bg/bg-bureau',fx:'dust',num:'Улика',name:'Записка',cam:[[1.2,0,4],[1.45,-6,6]],br:.9,
   caps:[{at:.05,t:'Бюро, примите поздравления: у вас пополнение.',note:1},{at:.25,t:'С простыми делами вы справились. Дальше будет интереснее.',note:1},{at:.45,t:'Маленькая подсказка для старательных: их двое.<br>— Д.',note:1},{at:.7,t:'Грач читает записку ещё раз и ставит кружку на стол.'}],
   cast:[{id:'grach',x:.8,at:.66,enter:'right',pose:'lens',face:-1,h:.62}],
   say:[{at:.82,id:'grach',text:'Вот и двое. Пошли.'}]},
  {kind:'game',game:'hunt',scene:'bg/bg-archive-night',fx:'dust',num:'Дело',name:'Тень в архиве',br:.85,blur:1,
   cast:[{id:'delitel',x:.2,h:.6}]}
 ]},
{id:'borey',short:'Самозванец на борту',title:'Самозванец на борту',topic:'Умножение и деление столбиком',grade:'4 класс',grades:[4],needs:['col','div2'],c:'#e26812',d:'#0b0a10',
 cover:'cover-b3',pop:'lev-point',url:'https://www.litres.ru/book/a-elarin-34117204/umnozhenie-i-delenie-stolbikom-samozvanets-na-bortu-74718994/',meta:['4 класс','60 вахт по 20 минут','9–11 лет'],sound:'space',
 facts:['Столбик и уголок на одно- и двузначное, нули в частном, остаток','Радиограммы, кодовые замки, аварийные вахты с контрольной суммой','Задачи на движение и порядок действий','Ответы на отрезной полоске и в конце'],
 chapters:[
  {kind:'scroll',scene:'bg/bg-cargo',fx:'dust',cam:[[1.05,0,0],[1.25,0,3]],title:true,blur:1.2,br:.7,
   caps:[{at:.05,t:'<b>Грузовой «Борей» пришвартован у лунной станции.</b> Через двое суток старт, а весь груз считаешь ты — ящик за ящиком.'},{at:.45,t:'Рейс — шестьдесят суток. По журналу на борту шесть кадетов и наставник.'}],
   cast:[{id:'korn',x:.76,at:0,face:-1},{id:'gosha',x:.5,at:.3,enter:'left',face:1,pose:'boxes'}],
   say:[{at:.6,id:'gosha',i:0},{at:.85,id:'korn',i:0}]},
  {kind:'scroll',scene:'bg/bg-bridge',fg:'bg/fg-bridge',fx:'warp',num:'Сутки 1–11',name:'Старт',cam:[[1.22,0,0],[1.05,0,-2]],hud:1,blur:1.2,br:.72,
   caps:[{at:.05,t:'«Борей» уходит в рейс. Наутро Гоша считает пайки на полке и хмурится: вчера их было больше.'},{at:.45,t:'Цифры в журнале кто-то правит, ночью хлопают люки, а пайков всё меньше.'}],
   cast:[{id:'lev',x:.18,at:0,face:1,pose:'run'},{id:'maya',x:.38,at:.15,enter:'left'},{id:'asya',x:.6,at:.3,enter:'right',face:-1},{id:'tim',x:.8,at:.45,enter:'right',face:-1}],
   say:[{at:.3,id:'lev',i:0},{at:.55,id:'maya',i:0},{at:.8,id:'tim',i:0}]},
  {kind:'game',game:'rations',scene:'bg/bg-mess',fx:'dust',num:'Аварийная вахта',name:'Склад тает',alert:1,blur:2.5,br:.72,
   cast:[{id:'korn',x:.08,face:1,h:.6},{id:'gosha',x:.22,face:1,h:.5},{id:'lev',x:.36,face:1,h:.5,pose:'point'}]}
 ]},
{id:'logic',short:'Логика тихого города',title:'Логика тихого города',topic:'100 логических задач',grade:'12+',grades:[5],needs:['hard'],c:'#d6232a',d:'#111',
 cover:'cover-lg',pop:null,url:'https://www.litres.ru/book/a-elarin-34117204/logika-tikhogo-goroda-74690314/',meta:['от 12 лет и взрослым','100 задач','подсказки и решения'],sound:'clock',light:1,
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
 var SB=null,SBw=[];function seaBuf(cb){if(SB!==null)return cb(SB);SBw.push(cb);if(SBw.length>1)return;
  fetch('snd/sea.mp3').then(function(r){if(!r.ok)throw 0;return r.arrayBuffer()}).then(function(a){return new Promise(function(ok,no){var p=ac.decodeAudioData(a,ok,no);if(p&&p.then)p.then(ok,no)})})
   .then(function(b){SB=b},function(){SB=false}).then(function(){var w=SBw;SBw=[];w.forEach(function(f){f(SB)})})}
 function synthSea(g,nodes){/* запасной вариант, если файл не загрузился: спокойный синтезированный берег */
     var bB=noise(8),bW=white(4);
     var bed=loop(bB),bl=ac.createBiquadFilter();bl.type='lowpass';bl.frequency.value=420;bl.Q.value=.3;var bh=ac.createBiquadFilter();bh.type='highpass';bh.frequency.value=170;
     var bg=ac.createGain();bg.gain.value=.2;bed.connect(bl);bl.connect(bh);bh.connect(bg);bg.connect(g);nodes.push(bed);
     var wt=null,N=96,live=true;
     function env(n,T,up,shape){var a=new Float32Array(n);for(var i=0;i<n;i++){var x=i/(n-1)*T;a[i]=x<up?.5-.5*Math.cos(Math.PI*x/up):Math.pow(.5+.5*Math.cos(Math.PI*Math.min(1,(x-up)/(T-up))),shape)}return a}
     (function wave(){if(!live)return;var t=ac.currentTime+.05,up=2.6+Math.random()*1.4,dn=4.5+Math.random()*2.5,T=up+dn,pk=.75+Math.random()*.4,top=700+Math.random()*500;
       var src=ac.createBufferSource();src.buffer=bB;src.loop=true;src.start(t,Math.random()*7);src.stop(t+T+.2);
       var lp=ac.createBiquadFilter();lp.type='lowpass';lp.Q.value=.3;var hp=ac.createBiquadFilter();hp.type='highpass';hp.frequency.value=180;
       var e=ac.createGain();e.gain.value=0;var pn=ac.createStereoPanner?ac.createStereoPanner():null,out=pn||g;if(pn){pn.pan.value=Math.random()*.7-.35;pn.connect(g)}
       src.connect(hp);hp.connect(lp);lp.connect(e);e.connect(out);
       var ge=env(N,T,up,1.7),fe=new Float32Array(N);for(var i=0;i<N;i++)fe[i]=300+top*ge[i];for(i=0;i<N;i++)ge[i]*=pk;
       e.gain.setValueCurveAtTime(ge,t,T);lp.frequency.setValueCurveAtTime(fe,t,T);
       var h0=t+up*.85,hT=dn*.95,hs=ac.createBufferSource();hs.buffer=bW;hs.loop=true;hs.start(h0,Math.random()*3);hs.stop(h0+hT+.2);
       var bp=ac.createBiquadFilter();bp.type='bandpass';bp.frequency.value=1700+Math.random()*700;bp.Q.value=.6;var he=ac.createGain();he.gain.value=0;
       hs.connect(bp);bp.connect(he);he.connect(out);var hv=env(N,hT,.9,2.2);for(i=0;i<N;i++)hv[i]*=.03*pk;he.gain.setValueCurveAtTime(hv,h0,hT);
       wt=setTimeout(wave,(T*.72+Math.random()*1.2)*1000)})();
     return function(){live=false;clearTimeout(wt)}}
 function build(kind){var g=ac.createGain();g.gain.value=0;g.connect(master);var nodes=[g],timer=null,kill=null;
  if(kind==='sea'){/* спокойный берег: запись волн (snd/sea.mp3, петля 90 с со склейкой 3 с; громкость подобрана под другие разделы, ≈ −32 LUFS на выходе).
       Файл грузится только когда включён звук на странице с морем; если не загрузился — синтезированный вариант */
    var sg=ac.createGain();sg.gain.value=1.48;sg.connect(g);var live=true,sk=null;
    seaBuf(function(buf){if(!live)return;if(!buf){sk=synthSea(g,nodes);return}var src=ac.createBufferSource();src.buffer=buf;src.loop=true;src.loopStart=.5;src.loopEnd=90.5;src.connect(sg);src.start(0,.5+Math.random()*80);nodes.push(src)});
    kill=function(){live=false;sk&&sk()}}
  if(kind==='noir'){var r=loop(white(3)),hf=ac.createBiquadFilter();hf.type='bandpass';hf.frequency.value=3000;hf.Q.value=.6;var rg=ac.createGain();rg.gain.value=.08;r.connect(hf);hf.connect(rg);rg.connect(g);
    var o=ac.createOscillator();o.type='sawtooth';o.frequency.value=55;var of=ac.createBiquadFilter();of.type='lowpass';of.frequency.value=180;var og=ac.createGain();og.gain.value=.12;o.connect(of);of.connect(og);og.connect(g);o.start();nodes.push(r,o)}
  if(kind==='space'){[48,48.4,72.2].forEach(function(fq){var o=ac.createOscillator();o.frequency.value=fq;var og=ac.createGain();og.gain.value=.12;o.connect(og);og.connect(g);o.start();nodes.push(o)});
    timer=setInterval(function(){if(!on)return;blip(1320,.05,.03)},4200)}
  if(kind==='clock'||kind==='home'){var notes=[392,440,523.25,587.33,659.25,783.99];timer=setInterval(function(){if(!on)return;var n=notes[Math.floor(Math.random()*notes.length)];blip(n*(kind==='clock'?1:.5),1.6,.06)},kind==='clock'?1000:1400)}
  g.gain.setTargetAtTime(1,ac.currentTime,.8);return {g:g,nodes:nodes,timer:timer,kill:kill}}
 function blip(f,dur,vol){if(!ac||!on)return;var o=ac.createOscillator(),g=ac.createGain();o.type='sine';o.frequency.value=f;g.gain.value=0;g.gain.setTargetAtTime(vol,ac.currentTime,.005);g.gain.setTargetAtTime(0,ac.currentTime+.02,dur/4);o.connect(g);g.connect(master);o.start();o.stop(ac.currentTime+dur+.2)}
 function stopAmb(){if(!amb)return;var a=amb;a.g.gain.setTargetAtTime(0,ac.currentTime,.3);clearInterval(a.timer);a.kill&&a.kill();setTimeout(function(){a.nodes.forEach(function(n){try{n.stop&&n.stop();n.disconnect()}catch(e){}})},1500);amb=null}
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

/* ================== МАРИОНЕТКА: изгиб, дыхание, пружины, прыжки, смена поз ================== */
function Puppet(stage,o){var c=CAST[o.id];this.st=stage;this.c=c;this.id=o.id;this.hx=o.x;this.x=o.x;this.y=o.y||.985;this.h=(o.h||c.h);this.face=o.face||1;this.baseFace=this.face;
 this.pose=o.pose||c.idle;this.basePose=this.pose;this.lean=0;this.leanV=0;this.hs=1;this.hsV=0;this.hov=false;this.sq=1;this.sqV=0;this.oy=0;this.vy=0;this.ph=Math.random()*9;this.alpha=1;this.act=0;this.dark=!!c.dark;
 this.tx=null;this.speed=.35;this.frames=null;this.fly=null;this.visible=!o.at;this.enterAt=o.at||0;this.enter=o.enter;
 var id=pdef(c.poses[this.pose]||c.poses[c.idle]);hneed(POSE(id.src),true);[id.blink,id.talk].forEach(function(f){f&&hneed(POSE(f))});
 for(var k in c.poses)poseFiles(c.poses[k]).forEach(function(f){hneed(POSE(f))});}
Puppet.prototype.pd=function(){return pdef(this.c.poses[this.pose]||this.c.poses[this.c.idle])};
Puppet.prototype.img=function(){var d=this.pd(),t=performance.now()/1000,f=(this.talking&&d.talk&&Math.floor(t*7)%2)?d.talk:(d.blink&&((t+this.ph)%4.3)<.13)?d.blink:d.src;
 var h=hneed(POSE(f),true);if(h.st!==2&&f!==d.src)h=hneed(POSE(d.src),true);
 if(h.st===2){var c=this.dark?(h.dk||(h.dk=darken(h.sm))):h.stk;this._last=c;return c}
 return this._last||null};
Puppet.prototype.want=function(p){var d=this.c.poses[p];if(d)poseFiles(d).forEach(function(f){hneed(POSE(f),true)})};
function dimW(im){return im.naturalWidth||im.width||0}function dimH(im){return im.naturalHeight||im.height||0}
Puppet.prototype.setPose=function(p){if(!this.c.poses[p]||p===this.pose)return;this.want(p);this.pose=p;this.sq=.84;this.sqV=0;};
Puppet.prototype.jump=function(v){if(this.oy<0)return;this.vy=-(v||1.25);this.sq=.82;};
Puppet.prototype.walkTo=function(x,sp){this.tx=x;this.speed=sp||.35};
Puppet.prototype.show=function(){if(this.visible)return;this.visible=true;var e=this.enter;
 if(e==='left'){this.x=-.15;this.walkTo(this.hx,.45)}else if(e==='right'){this.x=1.15;this.walkTo(this.hx,.45)}
 else if(e==='fly'){this.startFly(-.2,this.hx)}else{this.oy=-.25;this.vy=0}};
Puppet.prototype.startFly=function(from,to,o){o=o||{};var me=this;['fly','fly2','fly3'].forEach(function(k){me.want(k)});var z0=o.z0!=null?o.z0:(this.zs||1);
 if(o.a1)to=o.a1().x;
 this.fly={t:0,from:from,to:to,dur:o.dur||2.4,y0:o.y0||0,y1:o.y1||0,arc:o.arc==null?.35:o.arc,z0:z0,z1:o.z1!=null?o.z1:z0,a0:o.a0,a1:o.a1,sit:o.sit,hide:o.hide,face:o.face,next:o.next||null};this.face=to>from?1:to<from?-1:this.face};
Puppet.prototype.spin=function(){var me=this;['q','edge','back'].forEach(function(k){me.want(k)});var f=['q','edge','back','edge','q','front'],fc=[1,1,1,-1,-1,1],self=this;this.frames={list:f,faces:fc,i:0,t:0}};
Puppet.prototype.update=function(dt,t,W,H,rect){var c=this.c;
 // лёгкое покачивание на месте (за указателем не наклоняется); при наведении — чуть крупнее
 var tl=c.calm?0:Math.sin(t*.4+this.ph)*.25;
 var k=38,d=5.2;this.leanV+=((tl-this.lean)*k-this.leanV*d)*dt;this.lean+=this.leanV*dt;
 this.hsV+=(((this.hov?1.06:1)-this.hs)*180-this.hsV*18)*dt;this.hs+=this.hsV*dt;
 this.sqV+=((1-this.sq)*160-this.sqV*11)*dt;this.sq+=this.sqV*dt;
 if(this.oy<0||this.vy<0){this.vy+=4.2*dt;this.oy+=this.vy*dt;if(this.oy>=0){this.oy=0;this.vy=0;this.sq=.8;this.sqV=-1}}
 if(this.tx!==null){var dx=this.tx-this.x,st=this.speed*dt;if(Math.abs(dx)<=st){this.x=this.tx;this.tx=null;this.face=this.baseFace;this.walking=false;if(c.walk&&this.pose===c.walk)this.pose=this.basePose}else{this.x+=Math.sign(dx)*st;this.face=Math.sign(dx);this.walking=true;if(c.walk&&c.poses[c.walk])this.pose=c.cycle?c.cycle[Math.floor(t*7)%c.cycle.length]:c.walk}}
 if(this.fly){var f=this.fly;f.t+=dt;var u=Math.min(1,f.t/f.dur),e=ease(u),A0=f.a0&&f.a0(),A1=f.a1&&f.a1();
   this.x=lerp(A0?A0.x:f.from,A1?A1.x:f.to,e);this.flyY=-(lerp(A0?A0.up:f.y0,A1?A1.up:f.y1,e)+Math.sin(u*Math.PI)*f.arc);
   this.zs=lerp(A0?A0.z:f.z0,A1?A1.z:f.z1,e);this.alpha=f.hide?0:1;if(f.sit)this.face=(A1&&A1.f)||f.face||this.face;
   this.pose=f.sit?this.basePose:['fly','fly2','fly3','fly2'][Math.floor(f.t*11)%4];
   if(u>=1){var nx=f.next;this.fly=null;if(nx)this.startFly(this.x,nx.to,nx);else{this.flyY=0;this.zs=1;this.alpha=1;this.pose=this.basePose;this.face=this.baseFace;this.sq=.78}}}
 if(this.frames){var fr=this.frames;fr.t+=dt;if(fr.t>.085){fr.t=0;fr.i++;if(fr.i>=fr.list.length){this.frames=null;this.pose=this.basePose;this.face=this.baseFace}else{this.pose=fr.list[fr.i];this.face=this.baseFace*fr.faces[fr.i]}}}
};
Puppet.prototype.box=function(W,H){var im=this.img();if(!im||!dimW(im))return null;var ph=this.h*H*(this.pd().s||1)*this.st.k*(this.zs||1),pw=ph*dimW(im)/dimH(im);
 var fx=this.x*W,fy=this.y*H+(this.oy+(this.flyY||0))*H*.5;return {x:fx-pw/2,y:fy-ph,w:pw,h:ph,fx:fx,fy:fy}};
Puppet.prototype.draw=function(ctx,t,W,H){if(!this.visible)return;var im=this.img();if(!im||!dimW(im))return;
 var ph=this.h*H*(this.pd().s||1)*this.st.k*(this.zs||1),pw=ph*dimW(im)/dimH(im),b=this.box(W,H);
 var bob=this.walking?-Math.abs(Math.sin(t*9))*ph*.025:0,sy=this.sq,sx=1/Math.sqrt(sy);
 var tx0=b.fx,ty0=b.fy+bob;if(this.c.calm){var dd=this.st.d||1;tx0=Math.round(tx0*dd)/dd;ty0=Math.round(ty0*dd)/dd}
 ctx.save();ctx.translate(tx0,ty0);
 // тень
 var air=clamp(-(this.oy+(this.flyY||0))*2,0,1);ctx.globalAlpha=.28*(1-air)*this.alpha;ctx.fillStyle='#000';ctx.beginPath();ctx.ellipse(0,-(this.oy+(this.flyY||0))*H*.5-bob,pw*.32*(1-air*.5),ph*.025,0,0,6.283);ctx.fill();
 ctx.globalAlpha=this.alpha;ctx.scale(this.face,1);
 var breath=this.c.calm?0:Math.sin(t*1.9+this.ph);ctx.imageSmoothingQuality='high';
 ctx.rotate(this.lean*this.face*.035);ctx.scale(sx*this.hs,sy*this.hs*(1+.006*breath));
 ctx.drawImage(im,-pw/2,-ph,pw,ph);
 ctx.restore()};
Puppet.prototype.say=function(text,who,now){this.st.bubble(this,text,who,now)};
Puppet.prototype.poke=function(){var c=this.c,a=c.acts[this.act%c.acts.length];this.act++;Snd.pop();
 if(this.fly){}else if(a.spin){this.spin()}else if(a.fly){var hx=this.x,gx=hx>.5?hx-.45:hx+.45;this.startFly(hx,gx,{next:{to:gx,dur:.3,arc:0,sit:1,next:{to:hx}}})}else{if(a.pose){this.setPose(a.pose);this.basePose=a.pose}this.jump(1.1)}
 if(a.say){this.say(a.say,0,1);var r=REPLY[a.say],st=this.st;if(r){var other=st.pups.filter(function(p){return p.id===r[0]&&p.visible})[0];if(other)setTimeout(function(){other.jump(.9);other.say(r[1])},1700)}}};

/* ================== СЦЕНА ================== */
var STAGES=[],scrollV=0,lastScroll=scrollY;
function Stage(root,opts){this.root=root;this.cv=$('canvas.pup',root);this.ctx=this.cv.getContext('2d');this.fxc=$('canvas.fx',root);this.fx=this.fxc?this.fxc.getContext('2d'):null;
 this.kind=opts.fx||'';this.pups=[];this.ready=false;this.t0=performance.now();this.bubs=$('.bubbles',root);this.ch=opts.ch||null;this.sec=opts.sec||root;this.active=false;this.parts=[];this.t=0;this.onFrame=opts.onFrame||null;this.p=0;this.c=opts.c||'#e26812';this.fit=!!opts.fit;this.k=1;
 var self=this;(opts.cast||[]).forEach(function(o){self.pups.push(new Puppet(self,o))});
 this.io=new IntersectionObserver(function(es){self.active=es[0].isIntersecting},{rootMargin:'100px'});this.io.observe(this.sec);
 this.resize();STAGES.push(this)}
Stage.prototype.resize=function(){var r=this.root.getBoundingClientRect(),d=Math.min(devicePixelRatio||1,2);this.W=r.width;this.H=r.height;this.d=d;
 this.k=this.fit&&r.height?clamp((r.width/r.height)/.95,.58,1):1;
 [this.cv,this.fxc].forEach(function(c){if(!c)return;c.width=r.width*d;c.height=r.height*d});this.parts=[]};
/* реплики: по очереди, каждая держится столько, чтобы успеть прочитать; размер облачка сразу под весь текст */
/* реплики идут по очереди и не перебивают друг друга, пока предыдущую не успели прочитать; now — ответ на действие ребёнка, показываем сразу */
Stage.prototype.bubble=function(p,text,who,now){if(!text)return;var q=this.bq||(this.bq=[]);if(now){q.length=0;clearTimeout(this._bt);this._bt=null;this.showBub(p,text,who);return}if(q.length>=4)return;q.push([p,text,who]);this.bpump()};
Stage.prototype.bpump=function(){var self=this;if(this._bt)return;var wait=(this.busy||0)-performance.now();
 if(wait>0){this._bt=setTimeout(function(){self._bt=null;self.bpump()},wait);return}
 var it=(this.bq||[]).shift();if(!it)return;if(!this.active){this.bq.length=0;return}
 this.showBub(it[0],it[1],it[2]);if(this.bq.length)this.bpump()};
Stage.prototype.showBub=function(p,text,who){var b=el('<div class="bub"><small>'+(who||p.c.name)+'</small><span><i></i><u></u></span></div>');this.bubs.appendChild(b);p._bub&&p._bub.remove();p._bub=b;
 if(this.W<640)this.pups.forEach(function(q){if(q!==p&&q._bub){q._bub.remove();q._bub=null}});
 var seen=$('i',b),rest=$('u',b),n=text.length,i=0,tms=RM?0:28,typeT=n*tms;rest.textContent=text;b._w=b.offsetWidth;b._h=b.offsetHeight;this.placeBub(p);
 requestAnimationFrame(function(){b.classList.add('on')});
 p.talking=true;(function type(){if(i<=n){seen.textContent=text.slice(0,i);rest.textContent=text.slice(i);if(i%3===0)Snd.tick();i+=RM?n:1;setTimeout(type,tms)}else p.talking=false})();
 this.busy=performance.now()+typeT+Math.max(2200,n*80);
 setTimeout(function(){b.classList.remove('on');setTimeout(function(){b.remove()},400);if(p._bub===b)p._bub=null},typeT+Math.max(3200,1400+n*90))};
/* облачко — над головами: не закрывает ни говорящего, ни соседей; если над головами нет места — ниже голов, хвостик вверх */
Stage.prototype.placeBub=function(p){var b=p._bub;if(!b)return;var W=this.W,H=this.H,B=p.box(W,H);if(!B)return;
 var bw=b._w||b.offsetWidth,bh=b._h||b.offsetHeight,m=8,top0=H>=innerHeight*.9?(($('.top')||{}).offsetHeight||60)+6:m,pups=this.pups,now=performance.now(),up=false;
 /* подписи и табло — тоже препятствия: реплика не должна их закрывать (список обновляем раз в 300 мс) */
 if(!this._obsT||now-this._obsT>300){this._obsT=now;var R=this.root.getBoundingClientRect(),obs=this._obs=[];
  $$('.cap:not(.wait),.hud',this.root).forEach(function(e){var o=e.getBoundingClientRect();if(o.width&&o.height&&+getComputedStyle(e).opacity>.2)obs.push([o.left-R.left,o.right-R.left,o.bottom-R.top])})}
 function at(cx,dy){var x0=cx-bw/2,x1=cx+bw/2,hd=[],bot=B.y+B.h*dy,lim=top0;
  pups.forEach(function(q){if(!q.visible)return;var r=q.box(W,H);if(r&&r.x+r.w*.82>x0&&r.x+r.w*.18<x1)hd.push([r,q===p])});
  hd.forEach(function(h){bot=Math.min(bot,h[1]?B.y+B.h*dy:h[0].y-6)});
  (this_obs||[]).forEach(function(o){if(o[1]>x0-6&&o[0]<x1+6)lim=Math.max(lim,o[2]+8)});
  return {cx:cx,bot:bot,lim:lim,hd:hd,ok:bot-bh>=lim}}
 var this_obs=this._obs,c0=clamp(B.fx,bw/2+m,W-bw/2-m),sh=bw/2-30,P=null;
 /* 1) над головой; 2) сдвиг вбок, пока хвостик достаёт до говорящего; 3) чуть ниже, на макушку; 4) под лицом */
 [[c0,-.012],[clamp(B.fx+sh,bw/2+m,W-bw/2-m),-.012],[clamp(B.fx-sh,bw/2+m,W-bw/2-m),-.012],[c0,.05]].some(function(v){var r=at(v[0],v[1]);if(r.ok)P=r;return r.ok});
 if(!P){P=at(c0,-.012);var t=P.lim;P.hd.forEach(function(h){t=Math.max(t,h[0].y+h[0].h*.22+14)});P.bot=Math.min(t,H-m-bh)+bh;up=true}
 if(b._up!==up){b._up=up;b.classList.toggle('up',up)}
 b.style.left=P.cx+'px';b.style.top=P.bot+'px';b.style.setProperty('--tx',clamp(B.fx-P.cx,-bw/2+24,bw/2-24)+'px')};
Stage.prototype.hit=function(cx,cy){var r=this.root.getBoundingClientRect(),x=cx-r.left,y=cy-r.top,best=null;
 for(var i=this.pups.length-1;i>=0;i--){var p=this.pups[i];if(!p.visible)continue;var b=p.box(this.W,this.H);if(b&&x>b.x+b.w*.12&&x<b.x+b.w*.88&&y>b.y&&y<b.fy){best=p;break}}return best};
Stage.prototype.frame=function(dt){if(!this.active)return;this.t+=dt;var t=this.t,W=this.W,H=this.H,r=this.root.getBoundingClientRect(),ctx=this.ctx,d=this.d;
 if(this.onFrame)this.onFrame(dt,t,r);
 ctx.setTransform(d,0,0,d,0,0);ctx.clearRect(0,0,W,H);
 if(!this.ready)this.ready=performance.now()-this.t0>4000||this.pups.every(function(p){return !p.visible||!!p.img()});
 if(this.ready){
 var hv=ptr.mouse?this.hit(ptr.x,ptr.y):null;this.pups.forEach(function(p){p.hov=p===hv});this.root.style.cursor=hv?'pointer':'';
 var self=this;this.pups.slice().sort(function(a,b){return (a.fly?1:0)-(b.fly?1:0)||a.h-b.h}).forEach(function(p){p.update(dt,t,W,H,r);p.draw(ctx,t,W,H);
   if(p._bub)self.placeBub(p)});}
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
 STAGES.forEach(function(s){if(!s.root.isConnected)return;s.frame(dt)});
 STAGES=STAGES.filter(function(s){if(!s.root.isConnected){s.io.disconnect();return false}return true});
 scrollStory();requestAnimationFrame(loop)}
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
/* где пеликан может сесть на фоне главной: точки в пикселях bg-home.webp (1920×1080; object-fit: cover, прижат к низу) —
   верх лампы, плечо абажура, стопка книг слева; f — куда смотрит. Пересчитываются в доли сцены каждый кадр,
   поэтому при изменении окна пеликан остаётся на месте. Размер сидящего — в масштабе фона. */
var PERCH=[{x:1604,y:399,f:-1},{x:1545,y:449,f:-1},{x:300,y:624,f:1}];
function perchAt(st,ty,i){var W=st.W,H=st.H,s=Math.max(W/1920,H/1080),ox=(W-1920*s)/2,oy=H-1080*s,p=PERCH[i],y=(oy+p.y*s)/H,z=clamp(.5*s*1080/H,.4,.85),
  ph=ty.h*H*st.k*z; /* высота картинки сидящего; ноги — на 2,7 % выше её низа (прозрачный край и белый контур) */
 return {x:(ox+p.x*s)/W,y:y,ph:ph,up:(ty.y-y-ph*.027/H)*2,z:z,f:p.f}}
function okPerch(st,ty,i){var P=perchAt(st,ty,i),top=($('.top')||{}).offsetHeight||64;return P.x>.07&&P.x<.93&&P.y<.62&&P.y*st.H-P.ph*.95>top+6}
function pickPerch(st,ty){for(var i=0;i<PERCH.length;i++)if(okPerch(st,ty,i))return i;return -1}
var home=new Stage($('#homeStage'),{fx:'embers',cast:homeCast,onFrame:function(dt,t,r){
  var cx=r.left+r.width/2,cy=r.top+r.height*.44;if(ptr.x>-1000)$('#needle').style.transform='rotate('+(Math.atan2(ptr.x-cx,-(ptr.y-cy))*180/Math.PI)+'deg)';
  var tf=this.pups.filter(function(p){return p.id==='tyuk'})[0];if(tf&&tf.fly&&tf.fly.sit&&tf.fly.a1&&tf.fly.a1.pi!=null&&(this._pk=(this._pk||0)+dt)>.4){this._pk=0;if(!okPerch(this,tf,tf.fly.a1.pi))tf.fly.t=tf.fly.dur}
  if(this._fly==null)this._fly=14;this._fly-=dt;if(this._fly<0){this._fly=48;var ty=this.pups.filter(function(p){return p.id==='tyuk'})[0];if(ty&&!ty.fly&&ty.oy>=0){var hx=ty.x,st=this,pi=pickPerch(this,ty);
    if(pi>=0){var A=function(){return perchAt(st,ty,pi)};A.pi=pi;ty.startFly(hx,0,{a1:A,arc:.25,dur:3,next:{a0:A,a1:A,arc:0,dur:12,sit:1,next:{a0:A,to:hx,y1:0,arc:.25,dur:3,z1:1}}})}
    else ty.startFly(hx,1.25,{y1:.9,arc:.1,dur:2.4,next:{to:-.25,y0:.9,y1:.9,arc:0,dur:9,hide:1,next:{to:hx,y0:.9,y1:0,arc:.1,dur:2.6}}})}}
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
  if(ch.kind==='game'){GAMES[ch.game](st,stage,b);if(matchMedia('(max-width:760px)').matches){$$('.panel',st).forEach(function(pn){pn.classList.add('flow');sec.appendChild(pn)});sec.classList.add('flowsec')}}
 });
 var i=BOOKS.indexOf(b),nx=BOOKS[(i+1)%BOOKS.length];
 v.appendChild(el('<section class="finale" style="--c:'+b.c+'"><div class="wrap"><div class="book3d"><img src="'+IMG(b.cover)+'" alt="Обложка: '+b.title+'" width="700" height="990"></div><div><div class="eyebrow">Продолжение — в книге</div><h2 style="font-size:clamp(44px,6vw,92px);text-transform:uppercase;margin-top:12px">'+b.short+'</h2><ul class="facts">'+b.facts.map(function(f){return '<li>'+f+'</li>'}).join('')+'</ul><a class="buy" href="'+b.url+'">Открыть на Литрес →</a></div></div></section>'));
 v.appendChild(el('<a class="nextstory" href="#story-'+nx.id+'" style="--nc:'+nx.c+'"><div class="wrap"><div><div class="eyebrow" style="color:#bbb">Следующая история</div><h2>'+nx.short+'</h2></div>'+(nx.pop?'<img class="stk" src="'+POSE(nx.pop)+'" alt="">':'<img src="'+IMG(nx.cover)+'" alt="" style="height:200px;border:2px solid #000">')+'</div></a>'));
}
function scrollStory(){if(!storyScroll.length)return;var vh=innerHeight,small=innerWidth<761||vh<521;
 /* сначала читаем размеры всех глав, потом пишем стили — без повторных пересчётов раскладки в одном кадре */
 var R=storyScroll.map(function(o){return [o.sec.getBoundingClientRect(),o.sec.offsetHeight]});
 storyScroll.forEach(function(o,k){var r=R[k][0],len=R[k][1]-vh,p=clamp(-r.top/len,0,1);o.stage.p=p;if(r.bottom<0||r.top>vh)return;if(o.lp===p)return;o.lp=p;var ch=o.ch;
  var E=o.el||(o.el={cam:$('.cam',o.st),fw:$('.fgw',o.st),caps:$$('.cap',o.st),tc:$('.title-card',o.st),hd:$('#hd-d',o.st),hr:$('#hd-r',o.st)});
  var a=ch.cam[0],b=ch.cam[1],e=ease(p);var sc=lerp(a[0],b[0],e),tx=lerp(a[1],b[1],e),ty=lerp(a[2],b[2],e);E.cam.style.transform='scale('+sc+') translate('+tx+'%,'+ty+'%)';
  if(E.fw){var fk=innerWidth<innerHeight*.8?.5:1.6;E.fw.style.transform='scale('+(1+(sc-1)*fk)+') translate('+tx*1.5+'%,'+(ty*(fk<1?.5:1.5)+(1-e)*1.5)+'%)'}
  E.caps.forEach(function(c){if(p>=c._at&&c.classList.contains('wait')){c.classList.remove('wait');Snd.tick()}});
  if(small){var vis=E.caps.filter(function(c){return !c.classList.contains('wait')});vis.forEach(function(c,i){c.classList.toggle('past',i<vis.length-2)})}
  if(E.tc){E.tc.classList.toggle('gone',p>.3);o.st.classList.toggle('titling',p<=.3)}
  o.stage.pups.forEach(function(pp){if(!pp.visible&&p>=pp.enterAt)pp.show()});
  (ch.say||[]).forEach(function(s,k){if(p>=s.at&&!o.said[k]){o.said[k]=1;var pp=o.stage.pups.filter(function(x){return x.id===s.id})[0];if(pp&&pp.visible){var a=CAST[s.id].acts[s.i];var txt=s.text||(a&&a.say);if(a&&a.pose&&!s.text){pp.setPose(a.pose);pp.basePose=a.pose}pp.jump(.8);pp.say(txt)}}});
  if(ch.hud&&E.hd){E.hd.textContent=Math.round(lerp(1,11,p));E.hr.textContent=Math.round(lerp(1080,849,p))}
 })}

/* ================== ИГРЫ-ГЛАВЫ ================== */
var GAMES={
/* Туман-Забывака: таблица 10 × 10 под туманом */
fog:function(st,stage,b){var wrap=el('<div class="fogwrap"><div class="board" style="background-image:url('+IMG('bg/sea-grid')+')"><canvas></canvas><div class="cells"></div><div class="ask" hidden><span></span><input class="inp" inputmode="numeric" aria-label="Ответ" maxlength="3"></div></div></div>');
 st.appendChild(wrap);st.appendChild(el('<div class="panel tr" style="width:min(380px,92vw)"><h3>Туман-Забывака</h3><p class="sub">Море поделено на сто клеток. Впишите верный ответ — и туман рассеется над клеткой и её соседями. Проведите по карте — ветер разгонит дымку.</p><div style="font:900 40px var(--display)"><span id="fogN">0</span><small style="font-size:18px"> / 100 клеток</small></div><div class="verdict" id="fogV" aria-live="polite">Нажмите на любую клетку.</div></div>'));
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
 function reveal(i){if(clear[i]>0)return;clear[i]=.01;var bt=cells.children[i];bt.classList.add('done');bt.textContent=(Math.floor(i/10)+1)*(i%10+1);n++;$('#fogN',st.parentNode).textContent=n;if(n>=100)hook('award','fog')}
 cells.addEventListener('click',function(e){var bt=e.target.closest('button');if(bt)open(+bt.dataset.i)});
 inp.addEventListener('keydown',function(e){if(e.key!=='Enter')return;var r=Math.floor(cur/10)+1,c=cur%10+1,ok=+inp.value===r*c;var tyuk=stage.pups.filter(function(p){return p.id==='tyuk'})[0],rumb=stage.pups.filter(function(p){return p.id==='rumb'})[0];
  hook('track','story',ok);if(ok){reveal(cur);var nb=[cur-1,cur+1,cur-10,cur+10].filter(function(j){return j>=0&&j<100&&clear[j]===0&&!(Math.abs(j-cur)===1&&Math.floor(j/10)!==Math.floor(cur/10))});if(nb.length)reveal(nb[Math.floor(Math.random()*nb.length)]);
   ask.hidden=true;Snd.ok();rumb&&rumb.jump(1.2);tyuk&&tyuk.setPose('proud');$('#fogV',st.parentNode).className='verdict ok';$('#fogV',st.parentNode).textContent=n>=100?'Архипелаг открыт! В книге — 15 островов и хитрость на каждом.':'Туман уходит! Ещё клетку?';if(n%10<2&&n>2)tyuk&&tyuk.say('Туман уходит! А можно побыстрее?',0,1)}
  else{ask.classList.remove('shake');void ask.offsetWidth;ask.classList.add('shake');Snd.no();rumb&&rumb.setPose('doubt');rumb&&rumb.say('Строго на север! Проверь: '+r+' × '+c+' — это '+r+' раз по '+c+'.',0,1);$('#fogV',st.parentNode).className='verdict no';$('#fogV',st.parentNode).textContent='Туман не уходит. Ещё раз.'}});
 inp.addEventListener('blur',function(){setTimeout(function(){if(document.activeElement!==inp)ask.hidden=true},200)});
},
/* Бюро: найти Делителя фонарём */
hunt:function(st,stage,b){st.appendChild(el('<div class="dark"></div>'));
 var panel=el('<div class="panel" style="width:min(420px,92vw)"><h3>Тень в архиве</h3><p class="sub">Кто-то ходит между стеллажами. Посветите фонарём — наведите курсор (или проведите пальцем) и найдите его.</p><div class="verdict" id="hv" aria-live="polite">Свет — только там, куда вы смотрите.</div><div id="ciph"></div></div>');st.appendChild(panel);
 var dark=$('.dark',st),del=stage.pups[0],caught=false,turn=0;del.dark=true;del.y=.9;del.walkTo(.7,.08);del.baseFace=1;
 st.addEventListener('pointermove',function(e){var r=st.getBoundingClientRect();dark.style.setProperty('--fx',(e.clientX-r.left)+'px');dark.style.setProperty('--fy',(e.clientY-r.top)+'px')});
 stage.onFrame=function(dt,t,r){if(caught)return;if(del.tx===null){turn++;del.walkTo(turn%2?.18:.62,.07+Math.random()*.04)}
  var bx=del.box(stage.W,stage.H);if(!bx)return;var px=ptr.x-r.left,py=ptr.y-r.top;if(px>bx.x&&px<bx.x+bx.w&&py>bx.y&&py<bx.fy){caught=true;del.dark=false;del.say('Делить поровну умеют все. Делить честно — единицы.','Делитель',1);Snd.alarm();
   var note=el('<button class="dropnote" type="button" style="left:'+(bx.fx/stage.W*100)+'%;top:'+(bx.y/stage.H*100+30)+'%">Записка Д.<br><small style="font:700 13px var(--body)">открыть</small></button>');st.appendChild(note);
   setTimeout(function(){del.dark=true;del.walkTo(del.x<.5?-.3:1.3,.6)},1600);setTimeout(function(){note.classList.add('on')},500);
   $('#hv',st.parentNode).className='verdict ok';$('#hv',st.parentNode).textContent='Он ушёл — но выронил записку!';note.addEventListener('click',function(){cipher($('#ciph',st.parentNode));note.remove()})}};
 function cipher(box){var ex=[['56 : 7',8],['9 × 6',54],['63 : 9',7],['4 × 9',36]],key=[[6,'К'],[8,'Л'],[45,'О'],[54,'У'],[9,'Р'],[7,'П'],[32,'Е'],[36,'А']];
  box.innerHTML='<p class="sub" style="margin-top:14px">Записка зашифрована. Решите примеры и найдите ответы в ключе.</p><div class="keyt">'+key.map(function(k){return '<div>'+k[0]+'</div>'}).join('')+key.map(function(k){return '<div>'+k[1]+'</div>'}).join('')+'</div><div class="ciph">'+
   ex.map(function(e,i){return '<label for="hc'+i+'">'+e[0]+' =<input class="inp" id="hc'+i+'" inputmode="numeric" maxlength="3" autocomplete="off"></label>'}).join('')+'</div><div class="word">'+ex.map(function(){return '<span>?</span>'}).join('')+'</div>';
  var sp=$$('.word span',box);$$('input',box).forEach(function(inp,i){inp.addEventListener('input',function(){var v=+inp.value,k=key.filter(function(x){return x[0]===v})[0];sp[i].textContent=k?k[1]:'?';sp[i].classList.toggle('on',v===ex[i][1]);
   if(ex.every(function(e,j){return +$('#hc'+j,box).value===e[1]})){Snd.ok();hook('award','lupa');$('#hv',st.parentNode).textContent='ЛУПА. Делитель подсказывает, чем искать. Дело продолжается в книге.'}})})}
},
/* Борей: аварийная вахта — сколько ртов кормит склад */
rations:function(st,stage,b){var door=el('<div class="door17"><img src="'+POSE('varya-hand')+'" alt=""><b>№ 17</b></div>');st.appendChild(door);
 st.appendChild(el('<div class="panel tr"><h3>Одиннадцатые сутки</h3><p class="sub">При старте запас был 1080 пайков: шесть человек, по 3 пайка в день, 60 суток. Прошло одиннадцать суток, на полках осталось 849. Корн молча смотрит на цифры. Проверьте сами.</p><div class="steps">'+
  '<label for="r1">Сколько пайков ушло за одиннадцать суток? <input class="inp" id="r1" inputmode="numeric"></label><label for="r2">Сколько это в среднем за сутки? <input class="inp" id="r2" inputmode="numeric"></label><label for="r3">Каждому положено 3 пайка в сутки. На скольких человек уходит запас? <input class="inp" id="r3" inputmode="numeric"></label></div><div class="verdict" id="rv" aria-live="polite"></div></div>'));
 var A=[231,21,7],done=false,P=function(id){return stage.pups.filter(function(p){return p.id===id})[0]};
 $$('input',st).forEach(function(x){x.addEventListener('input',function(){var v=A.map(function(a,i){return +$('#r'+(i+1),st.parentNode).value===a}),o=$('#rv',st.parentNode);
  if(v[0]&&v[1]&&v[2]&&!done){done=true;o.className='verdict ok';o.textContent='Выходит семь. А по журналу на борту шестеро…';Snd.alarm();hook('award','crew');door.classList.add('on');
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
$('.brand').addEventListener('click',function(e){if(!curView||curView.v!=='home')return;e.preventDefault();
 if(location.hash&&location.hash!=='#home'){history.replaceState(null,'','#home');curView=parseHash()}scrollTo({top:0,behavior:RM?'auto':'smooth'})});
/* ---- пеликан-спутник: летит рядом, пока листаете, по всем разделам; нажатие — наверх ---- */
function buddy(){var fr=['img/totop-1.webp','img/totop-2.webp','img/totop-3.webp','img/totop-2.webp'],RM=matchMedia('(prefers-reduced-motion: reduce)').matches;
 /* на сенсорных экранах — слева: справа внизу многие мобильные браузеры показывают свою кнопку «наверх» */
 var L=matchMedia('(pointer:coarse)').matches,sd=L?-1:1;
 var w=document.createElement('div');w.className='buddy'+(L?' l':'');w.innerHTML='<button class="bd" type="button" aria-label="Наверх" style="visibility:hidden"><span class="fl"><img src="'+fr[1]+'" alt="" width="250" height="227"></span><span class="tag">Наверх</span></button>';document.body.appendChild(w);
 var b=w.firstChild,fl=b.firstChild,im=fl.firstChild;fr.forEach(function(f){var x=new Image();x.src=f});
 var on=false,ox=170,oy=0,rr=0,fi=1,ft=0,sv=0,ly=scrollY,lt=0,sw=0,idle=0,last='',lastB='';
 function C(v,a,c){return v<a?a:v>c?c:v}
 b.onclick=function(){scrollTo({top:0,behavior:RM?'auto':'smooth'});sw=1.2};
 function tick(now){var dt=lt?Math.min(.05,(now-lt)/1000):.016;lt=now;var y=scrollY;sv+=((y-ly)/dt-sv)*.12;ly=y;
  var want=y>innerHeight*.6;if(want!==on){on=want;w.classList.toggle('on',on);if(on){sw=1;b.style.visibility=''}}
  if(!on&&ox>=168&&!b.style.visibility)b.style.visibility='hidden';
  if(on||ox<168){sw=Math.max(0,sw-dt);var swp=sw>0?Math.sin((1-sw/1.4)*Math.PI):0;
   /* пеликан поднимается над подписью, но никогда не опускается ниже места покоя — подпись не обрезается */
   var tx=on?-36*swp:170,ty=-C(Math.abs(sv)*.025,0,28)-14*swp-(RM?0:(1+Math.sin(now/700))*3),tr=C(-sv*.016,-11,11),k=RM?1:Math.min(1,dt*6);
   ox+=(tx-ox)*k;oy+=(ty-oy)*k;rr+=(tr-rr)*k;
   var tb='translateX('+(ox*sd).toFixed(1)+'px)';if(tb!==lastB){lastB=tb;b.style.transform=tb}
   var tf='translateY('+oy.toFixed(1)+'px) rotate('+(rr*sd).toFixed(1)+'deg)'+(L?' scaleX(-1)':'');if(tf!==last){last=tf;fl.style.transform=tf}
   var fly;if(Math.abs(sv)>70||sw>0||Math.abs(tx-ox)>16){idle=0;fly=1}else{idle+=dt;fly=idle%8>7.5}
   ft+=dt;if(ft>.085){ft=0;var n=fly&&!RM?(fi+1)%4:1;if(n!==fi){fi=n;im.src=fr[n]}}}
  requestAnimationFrame(tick)}
 requestAnimationFrame(tick)}
buddy();
addEventListener('scroll',function(){$('#top').classList.toggle('solid',scrollY>40)},{passive:true});
/* запуск — в конце tools.js, когда все разделы зарегистрированы */
