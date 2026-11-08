/* Математическое ядро тренажёров: раскладка столбика и уголка. Без DOM — проверяется в node. */
var MathCore=(function(){
/* Умножение столбиком: a × b (b — одно- или двузначное).
   Возвращает строки клеток. Колонки считаются справа: 0 — единицы. */
function mulLayout(a,b){
  var bs=String(b).split('').map(Number).reverse(), rows=[], parts=[];
  bs.forEach(function(bd,i){var p=a*bd;parts.push({val:p,shift:i})});
  var sum=a*b;
  var width=Math.max(String(a).length,String(b).length+1,String(sum).length)+1;
  rows.push({kind:'given',text:String(a),shift:0});
  rows.push({kind:'given',text:String(b),shift:0,sign:'×',line:true});
  if(bs.length===1){rows.push({kind:'ans',text:String(sum),shift:0})}
  else{parts.forEach(function(p,i){rows.push({kind:'ans',text:String(p.val),shift:p.shift,sign:i===0?'':'+',line:i===parts.length-1&&false})});
    rows[rows.length-1].line=true;rows.push({kind:'ans',text:String(sum),shift:0})}
  return {a:a,b:b,sum:sum,rows:rows,width:width}
}
/* Деление уголком n : d. Строки: произведение (вычитаем) и разность с снесёнными цифрами.
   end — индекс последней цифры делимого, под которой стоит запись. given — снесённые цифры (подсказаны). */
function divLayout(n,d){
  var D=String(n).split('').map(Number),last=D.length-1,i=0,cur=0;
  while(i<=last&&(cur<d||i===0)){cur=cur*10+D[i];i++;if(cur>=d)break}
  if(cur<d&&i>last){return {n:n,d:d,q:'0',r:n,rows:[],first:last}}
  var end=i-1,q='',rows=[],first=end,qc=[];
  while(true){
    var qd=Math.floor(cur/d),prod=qd*d,rem=cur-prod;qc.push(cur);q+=qd;
    rows.push({kind:'prod',cells:String(prod).split('').map(function(c){return {ch:c,given:false}}),end:end,cur:cur,qi:q.length-1});
    if(end===last){rows.push({kind:'diff',cells:String(rem).split('').map(function(c){return {ch:c,given:false}}),end:end});break}
    var cells=rem?String(rem).split('').map(function(c){return {ch:c,given:false}}):[];
    end++;cur=rem*10+D[end];cells.push({ch:String(D[end]),given:true});
    while(cur<d&&end<last){qc.push(cur);q+='0';end++;cur=cur*10+D[end];cells.push({ch:String(D[end]),given:true})}
    if(cur<d){qc.push(cur);q+='0';rows.push({kind:'diff',cells:cells,end:end,final:true});break}
    rows.push({kind:'diff',cells:cells,end:end})
  }
  return {n:n,d:d,q:q,r:n%d,rows:rows,first:first,qc:qc}
}
/* проверка раскладки: числа в строках действительно дают частное и остаток */
function checkDiv(L){
  if(Number(L.q)!==Math.floor(L.n/L.d))return 'q';
  var last=L.rows[L.rows.length-1];var rem=Number(last.cells.map(function(c){return c.ch}).join('')||'0');
  if(rem!==L.n%L.d)return 'r';
  for(var k=0;k<L.rows.length;k++){var r=L.rows[k];if(r.end<0||r.end>=String(L.n).length)return 'end'}
  return null
}
/* случайные задания с проверкой */
function rnd(r,a,b){return a+Math.floor(r()*(b-a+1))}
function rng(seed){var s=seed>>>0||1;return function(){s^=s<<13;s^=s>>>17;s^=s<<5;return ((s>>>0)%100000)/100000}}
var GEN={
 table:function(r){var a=rnd(r,2,9),b=rnd(r,2,9);return {q:a+' × '+b,a:a*b}},
 tablediv:function(r){var a=rnd(r,2,9),b=rnd(r,2,9);return {q:a*b+' : '+a,a:b}},
 out2:function(r){var a=rnd(r,11,29),b=rnd(r,2,4);if(a*b>100)b=2;return {q:a+' × '+b,a:a*b}},
 outdiv:function(r){var b=rnd(r,2,6),q=rnd(r,11,Math.floor(99/b));return {q:b*q+' : '+b,a:q}},
 rem:function(r){var b=rnd(r,3,9),q=rnd(r,2,9),k=rnd(r,1,b-1);return {q:(b*q+k)+' : '+b,a:q+' ост. '+k,ans:[q,k]}},
 mul1:function(r){var a=rnd(r,112,4987),b=rnd(r,3,9);return {q:a+' × '+b,a:a*b}},
 div1:function(r){var b=rnd(r,3,9),q=rnd(r,104,2999);return {q:b*q+' : '+b,a:q}},
 mul2:function(r){var a=rnd(r,112,989),b;do{b=rnd(r,12,98)}while(b%10===0||b%11===0);return {q:a+' × '+b,a:a*b}},
 div2:function(r){var b;do{b=rnd(r,12,89)}while(b%10===0);var q=rnd(r,12,Math.min(299,Math.floor(29999/b)));return {q:b*q+' : '+b,a:q}},
 round:function(r){var t=rnd(r,0,3);
  if(t===0){var a=rnd(r,12,99)*10,b=rnd(r,2,9)*10;return {q:a+' × '+b,a:a*b}}
  if(t===1){var d=rnd(r,2,9),q=rnd(r,12,99),m=pick(r,[10,100]);return {q:d*q*m+' : '+d*m,a:q}}
  if(t===2){var a2=rnd(r,13,97),k=pick(r,[10,100,1000]);return {q:a2*k+' : '+k,a:a2}}
  var a3=rnd(r,2,9)*100,b3=rnd(r,2,9)*10;return {q:a3+' × '+b3,a:a3*b3}},
 order:function(r){var t=rnd(r,0,8),a,b,c,d,q;
  switch(t){
  case 0:b=rnd(r,2,9);c=rnd(r,2,9);a=rnd(r,11,80);return {q:a+' + '+b+' × '+c,a:a+b*c};
  case 1:b=rnd(r,2,9);c=rnd(r,2,9);a=b*c+rnd(r,3,60);return {q:a+' − '+b+' × '+c,a:a-b*c};
  case 2:a=rnd(r,11,40);b=rnd(r,2,30);c=rnd(r,2,6);return {q:'('+a+' + '+b+') × '+c,a:(a+b)*c};
  case 3:c=rnd(r,2,9);q=rnd(r,2,12);b=rnd(r,5,40);a=c*q+b;return {q:'('+a+' − '+b+') : '+c,a:q};
  case 4:a=rnd(r,3,9);b=rnd(r,6,12);d=rnd(r,2,9);q=rnd(r,2,9);c=d*q;return {q:a+' × '+b+' − '+c+' : '+d,a:a*b-q};
  case 5:d=rnd(r,3,9);q=rnd(r,6,30);a=rnd(r,2,9);b=rnd(r,11,40);return {q:d*q+' : '+d+' + '+a+' × '+b,a:q+a*b};
  case 6:c=rnd(r,2,9);q=rnd(r,3,15);var s1=c*q;a=rnd(r,1,s1-1);b=s1-a;d=rnd(r,2,6);return {q:'('+a+' + '+b+') : '+c+' × '+d,a:q*d};
  case 7:a=rnd(r,2,9);c=rnd(r,2,20);b=c+rnd(r,2,12);d=rnd(r,5,60);return {q:a+' × ('+b+' − '+c+') + '+d,a:a*(b-c)+d};
  default:c=rnd(r,2,9);d=rnd(r,2,6);b=rnd(r,5,30);a=(b+c)*d+rnd(r,10,90);return {q:a+' − ('+b+' + '+c+') × '+d,a:a-(b+c)*d}}}
};

/* ===== русские окончания ===== */
function pl(n,a,b,c){var m=n%100,k=n%10;if(m>=11&&m<=14)return c;if(k===1)return a;if(k>=2&&k<=4)return b;return c}
function pick(r,arr){return arr[Math.floor(r()*arr.length)]}
function shuffle(r,a){a=a.slice();for(var i=a.length-1;i>0;i--){var j=Math.floor(r()*(i+1)),t=a[i];a[i]=a[j];a[j]=t}return a}

/* ===== общий способ для a × b (по a взять b раз) — подсказка Румба ===== */
var PREF=[10,1,2,5,9,4,3,8,6,7];
function trick(a,b){var pre='';if(PREF.indexOf(a)<PREF.indexOf(b)){pre='Поменяем множители местами: '+a+' × '+b+' = '+b+' × '+a+'. ';var t=a;a=b;b=t}
 var x;
 if(b===1)x=a+' × 1 — одна группа: '+a+'.';
 else if(b===10)x=a+' × 10 — допиши к '+a+' ноль: '+a*10+'.';
 else if(b===2)x='×2 — удвоение: '+a+' + '+a+' = '+a*2+'.';
 else if(b===4)x='×4 — дважды удвоить: '+a+' → '+a*2+' → '+a*4+'.';
 else if(b===8)x='×8 — трижды удвоить: '+a+' → '+a*2+' → '+a*4+' → '+a*8+'.';
 else if(b===5)x='×5 — половина от ×10: '+a*10+' : 2 = '+a*5+'.';
 else if(b===9)x='×9 — это ×10 без одной группы: '+a*10+' − '+a+' = '+a*9+'.';
 else if(b===3)x='×3 — удвоить и добавить ещё одну группу: '+a*2+' + '+a+' = '+a*3+'.';
 else if(b===6)x='×6 — это ×5 и ещё одна группа: '+a*5+' + '+a+' = '+a*6+'.';
 else x='×7 — это ×5 и ещё две группы: '+a*5+' + '+a*2+' = '+a*7+'.';
 return pre+x}

/* ===== подсказки к клеткам столбика: по строке-ответу, справа налево ===== */
function mulHints(a,b){var A=String(a).split('').map(Number).reverse(),B=String(b).split('').map(Number).reverse(),out=[];
 B.forEach(function(bd){var c=0,h=[];
  for(var k=0;k<A.length;k++){var p=A[k]*bd,s=p+c,dg=s%10,nc=Math.floor(s/10);
   h.push({d:dg,t:A[k]+' × '+bd+' = '+p+(c?', и ещё '+c+' в уме — '+s:'')+'. Пишем '+dg+(nc?', '+nc+' в уме':'')+'.'});c=nc}
  if(c)h.push({d:c,t:'Цифры кончились — записываем то, что было в уме: '+c+'.'});out.push(h)});
 if(B.length>1){var P=out.map(function(h){return h.map(function(x){return x.d})}),S=String(a*b).split('').map(Number).reverse(),c=0,h=[];
  for(var k=0;k<S.length;k++){var terms=[];P.forEach(function(pd,j){var i=k-j;if(i>=0&&i<pd.length)terms.push(pd[i])});
   var s=terms.reduce(function(x,y){return x+y},0)+c,dg=s%10,nc=Math.floor(s/10),t;
   if(!terms.length)t='Записываем то, что было в уме: '+c+'.';
   else if(terms.length===1&&!c)t='Складывать не с чем — сносим: '+terms[0]+'.';
   else t=terms.join(' + ')+(c?' + '+c+' в уме':'')+' = '+s+'. Пишем '+dg+(nc?', '+nc+' в уме':'')+'.';
   h.push({d:dg,t:t});c=nc}
  out.push(h)}
 return out}

/* ===== порядок ввода в уголке и подсказки Корна ===== */
function divPlan(n,d){var L=divLayout(n,d),seq=[],qd=0,start=[];
 function pushQ(upto){while(qd<=upto){var dig=+L.q[qd],cur=L.qc[qd],t;
   if(dig===0)t=cur+' меньше, чем '+d+', — в частном пишем 0'+(qd<L.q.length-1?' и сносим следующую цифру.':'.');
   else t=(qd===0?'Первое неполное делимое — '+cur+'. ':'')+'Сколько раз по '+d+' помещается в '+cur+'? '+d+' × '+dig+' = '+dig*d+(dig<9?', а '+d+' × '+(dig+1)+' = '+(dig+1)*d+' — уже больше':'')+'. Пишем '+dig+'.';
   seq.push({row:'q',i:qd,ch:String(dig),t:t});qd++}}
 L.rows.forEach(function(r,ri){
  if(r.kind==='prod'){pushQ(r.qi);start[ri]=seq.length;var dig=+L.q[r.qi],pr=dig*d;
   r.cells.forEach(function(c,ci){seq.push({row:ri,i:ci,ch:c.ch,t:dig+' × '+d+' = '+pr+'. Пишем под '+r.cur+'.'})})}
  else{start[ri]=seq.length;var pv=L.rows[ri-1],pr2=(+L.q[pv.qi])*d,rem=pv.cur-pr2;
   r.cells.forEach(function(c,ci){if(!c.given)seq.push({row:ri,i:ci,ch:c.ch,t:pv.cur+' − '+pr2+' = '+rem+'.'+(r.final||ri===L.rows.length-1?(rem?' Это остаток.':''):'')})})}
 });
 pushQ(L.q.length-1);
 return {L:L,seq:seq,start:start}}

/* ===== «Найди ошибку Тюка» ===== */
function carryless(a,b,drop){var A=String(a).split('').map(Number).reverse(),c=0,out=[],cs=[];
 for(var k=0;k<A.length;k++){var s=A[k]*b+c;out.push(s%10);c=Math.floor(s/10);cs.push(c)}
 if(drop<0)return null;
 c=0;var o2=[];for(k=0;k<A.length;k++){var s2=A[k]*b+(k===drop+1?0:c);o2.push(s2%10);c=Math.floor(s2/10)}if(c)o2.push(c);
 return +o2.reverse().join('')}
function tyuk(r,lv){var e,res,why,ops=[];
 if(lv===0){var a=rnd(r,2,9),b=rnd(r,2,9);
  if(r()<.35){e=a*b+' : '+a;res=b;ops=[[b+1,'Тюк ошибся на единицу.'],[b-1,'Тюк ошибся на единицу.']]}
  else{e=a+' × '+b;res=a*b;ops=[[a*(b+1),'Тюк взял на одну группу больше.'],[a*(b-1),'Тюк взял на одну группу меньше.'],[(a+1)*b,'Тюк перепутал соседнее число.']];
   var sw=+String(res).split('').reverse().join('');if(res>9&&res%10)ops.push([sw,'Тюк переставил цифры.'])}}
 else if(lv===1){if(r()<.55){var a1=rnd(r,12,49),b1=rnd(r,2,4);if(a1*b1>=100)b1=2;e=a1+' × '+b1;res=a1*b1;var t=Math.floor(a1/10),u=a1%10;
   if(u*b1>=10)ops.push([t*b1*10+(u*b1)%10,'Тюк забыл то, что было «в уме».']);ops.push([t*10*b1+u,'Тюк умножил только десятки, а единицы забыл.'],[a1*(b1+1),'Тюк взял на одну группу больше.'])}
  else{var d1=rnd(r,2,6),q1=rnd(r,11,Math.floor(99/d1));e=d1*q1+' : '+d1;res=q1;var s1=+String(q1).split('').reverse().join('');
   if(q1%10&&s1!==q1)ops.push([s1,'Тюк переставил цифры.']);ops.push([q1+1,'Тюк ошибся на единицу.'],[q1-1,'Тюк ошибся на единицу.'])}}
 else{if(r()<.5){var a2=rnd(r,112,989),b2=rnd(r,3,9);e=a2+' × '+b2;res=a2*b2;var A=String(a2).split('').map(Number).reverse(),c=0,cp=[];
   for(var k=0;k<A.length;k++){var s=A[k]*b2+c;c=Math.floor(s/10);if(c&&k<A.length-1)cp.push(k)}
   if(cp.length)ops.push([carryless(a2,b2,pick(r,cp)),'Тюк забыл то, что было «в уме».']);ops.push([a2*(b2-1),'Тюк взял на одну группу меньше.'])}
  else{var d2=rnd(r,3,9),q2;if(r()<.75){q2=rnd(r,1,9)*100+rnd(r,1,9)}else q2=rnd(r,1,9)*100+rnd(r,1,9)*10;
   e=d2*q2+' : '+d2;res=q2;var z=+String(q2).replace(/0/g,'');if(z!==q2)ops.push([z,'Тюк пропустил ноль в частном.']);ops.push([q2+1,'Тюк ошибся на единицу.'])}}
 ops=ops.filter(function(o){return o[0]>0&&o[0]!==res});
 var ok=r()<.45||!ops.length,o=ok?null:pick(r,ops);
 return {e:e,res:res,claim:ok?res:o[0],ok:ok,why:ok?'':o[1]}}

/* ===== логика: очередь (уникальное решение проверяется перебором) ===== */
var NAMES=[['Ася','f'],['Борис','m'],['Вера','f'],['Глеб','m'],['Дина','f'],['Егор','m'],['Зоя','f'],['Илья','m'],['Кира','f'],['Марк','m'],['Нина','f'],['Олег','m']];
function perms(n){var out=[];(function go(a,used){if(a.length===n){out.push(a.slice());return}for(var i=0;i<n;i++)if(!used[i]){used[i]=1;a.push(i);go(a,used);a.pop();used[i]=0}})([],{});return out}
function evalClue(c,p){var x=p[c.i],y=c.j!==undefined?p[c.j]:0;if(x===undefined||x===null||y===undefined||y===null)return null;
 switch(c.k){case 'bef':return x<y;case 'just':return y-x===1;case 'gap2':return Math.abs(x-y)===2;case 'nadj':return Math.abs(x-y)>1;
  case 'nat':return x!==c.h;case 'nfirst':return x!==0;case 'nlast':return x!==c.n-1}}
function queue(r,n){for(var tries=0;tries<60;tries++){var who=shuffle(r,NAMES).slice(0,n),sol=shuffle(r,perms(n)[0]),H=[];for(var h=0;h<n;h++)H.push(9+h);
  var N=who.map(function(w){return w[0]}),v=function(i){return who[i][1]==='f'?'пришла':'пришёл'},g=function(i,m,f){return who[i][1]==='f'?f:m},pool=[];
  for(var i=0;i<n;i++)for(var j=0;j<n;j++){if(i===j)continue;
   if(sol[i]<sol[j]&&sol[j]-sol[i]>1)pool.push({k:'bef',i:i,j:j,t:N[i]+' '+v(i)+' раньше, чем '+N[j]+'.',w:1.2});
   if(sol[i]<sol[j]&&sol[j]-sol[i]===1)pool.push({k:'bef',i:i,j:j,t:N[i]+' '+v(i)+' раньше, чем '+N[j]+'.',w:.8});
   if(sol[j]-sol[i]===1)pool.push({k:'just',i:i,j:j,t:N[i]+' '+v(i)+' ровно на час раньше, чем '+N[j]+'.',w:1.4});
   if(i<j&&Math.abs(sol[i]-sol[j])===2)pool.push({k:'gap2',i:i,j:j,t:N[i]+' и '+N[j]+' пришли с разницей ровно в два часа.',w:1});
   if(i<j&&Math.abs(sol[i]-sol[j])>1&&n>3)pool.push({k:'nadj',i:i,j:j,t:N[i]+' и '+N[j]+' пришли не друг за другом.',w:1})}
  for(i=0;i<n;i++){for(var q=0;q<n;q++)if(q!==sol[i])pool.push({k:'nat',i:i,h:q,t:N[i]+' '+v(i)+' не в '+H[q]+':00.',w:.7});
   if(sol[i]!==0)pool.push({k:'nfirst',i:i,t:N[i]+' '+v(i)+' не '+g(i,'первым','первой')+'.',w:1});
   if(sol[i]!==n-1)pool.push({k:'nlast',i:i,n:n,t:N[i]+' '+v(i)+' не '+g(i,'последним','последней')+'.',w:1})}
  pool.forEach(function(c){c.n=n;c.z=c.w*(.4+r()*1.6)});
  pool=shuffle(r,pool).sort(function(a,b){return b.z-a.z});
  var cap={bef:n-2,just:n>3?2:1,gap2:1,nadj:1,nat:2,nfirst:1,nlast:1},used={};
  var P=perms(n),ch=[],live=P;
  for(var k=0;k<pool.length&&live.length>1;k++){var c=pool[k];if((used[c.k]||0)>=cap[c.k])continue;var nl=live.filter(function(p){return evalClue(c,p)});if(nl.length<live.length){ch.push(c);live=nl;used[c.k]=(used[c.k]||0)+1}}
  if(live.length!==1)continue;
  for(k=ch.length-1;k>=0;k--){var rest=ch.slice(0,k).concat(ch.slice(k+1));if(P.filter(function(p){return rest.every(function(c){return evalClue(c,p)})}).length===1)ch=rest}
  var cnt=P.filter(function(p){return ch.every(function(c){return evalClue(c,p)})}).length;if(cnt!==1)continue;
  var lo={3:2,4:4,5:5}[n]||n,hi={3:3,4:5,5:7}[n]||n+2;if((ch.length<lo||ch.length>hi)&&tries<55)continue;
  ch=shuffle(r,ch);return {names:N,hours:H,sol:sol,clues:ch.map(function(c){return {k:c.k,i:c.i,j:c.j,h:c.h,n:n,t:c.t}})}}
 return null}

/* ===== задача дня: 7 видов, ответ строится вместе с условием ===== */
function gcd(a,b){return b?gcd(b,a%b):a}
var DAILY=[
 function(r){var a=rnd(r,2,9),x=rnd(r,3,12),b=rnd(r,1,19),c=a*x+b;return {hero:'tyuk-sly',who:'Тюк',book:'archipelago',
  text:'Тюк задумал число, умножил его на '+a+' и прибавил '+b+'. Получилось '+c+'. Какое число задумал Тюк?',ans:x,
  hint:'Иди с конца: сначала отними '+b+', потом раздели на '+a+'.',sol:c+' − '+b+' = '+(c-b)+'; '+(c-b)+' : '+a+' = '+x+'.'}},
 function(r){var H=rnd(r,8,16),t=rnd(r,2,H-2),L=2*H+2*t;return {hero:'rumb-point',who:'Румб',book:'archipelago',
  text:'На острове гуляют чайки и черепахи. Румб пересчитал всех: голов — '+H+', лап — '+L+'. Сколько на острове черепах?',ans:t,
  hint:'Представь, что все — чайки. Сколько тогда было бы лап? Откуда взялись остальные?',sol:'Если бы все были чайками, лап было бы '+H+' × 2 = '+2*H+'. Остальные '+(L-2*H)+' — по две лишние лапы у каждой черепахи: '+(L-2*H)+' : 2 = '+t+'.'}},
 function(r){var K,N;do{K=rnd(r,4,12);N=rnd(r,30,150)}while(N%K===0);var q=Math.floor(N/K),m=N%K;return {hero:'grach-lens',who:'Грач',book:'bureau',
  text:'В архиве Бюро — '+N+' '+pl(N,'папка','папки','папок')+' с делами. На одну полку помещается '+K+' '+pl(K,'папка','папки','папок')+'. Сколько полок нужно, чтобы поставить все папки?',ans:q+1,
  hint:'Раздели с остатком. А куда деть остаток?',sol:N+' : '+K+' = '+q+' (ост. '+m+'). Остаток — это папки, которым не хватило места; для них нужна ещё одна полка: '+q+' + 1 = '+(q+1)+'.'}},
 function(r){var A=r()<.5?rnd(r,12,98):rnd(r,102,987),b=rnd(r,3,9),P=A*b,s=String(A),k=rnd(r,0,s.length-1),dg=+s[k];return {hero:'miron-think',who:'Мирон',book:'bureau',
  text:'Мирон посадил кляксу на запись расчёта: '+s.slice(0,k)+'■'+s.slice(k+1)+' × '+b+' = '+P+'. Какая цифра под кляксой?',ans:dg,
  hint:'Неизвестный множитель находят делением: произведение раздели на известный множитель.',sol:P+' : '+b+' = '+A+', значит, под кляксой — '+dg+'.'}},
 function(r){var K,Pp,D,M,T,N;do{K=pick(r,[4,5,6,8]);Pp=pick(r,[2,3]);D=rnd(r,10,40);T=K*Pp*D;M=pick(r,[10,12,15,20,24,25,30]);N=T/M}while(N%1||N<3||N>200);
  return {hero:'korn-read',who:'Корн',book:'borey',
  text:'Корн проверяет склад. Ящиков с пайками: '+N+', в каждом — '+M+' '+pl(M,'паёк','пайка','пайков')+'. В экипаже '+K+' '+pl(K,'человек','человека','человек')+', каждый съедает '+Pp+' пайка в сутки. На сколько суток хватит запаса?',ans:D,
  hint:'Сначала узнай, сколько всего пайков, потом — сколько уходит за сутки.',sol:N+' × '+M+' = '+T+' — всего; '+K+' × '+Pp+' = '+K*Pp+' — за сутки; '+T+' : '+K*Pp+' = '+D+'.'}},
 function(r){var a,b;do{a=pick(r,[4,5,6,8,9,10,12,15]);b=pick(r,[4,5,6,8,9,10,12,15])}while(a>=b||b%a===0);var L=a*b/gcd(a,b),la=[],lb=[];for(var x=a;x<=L;x+=a)la.push(x);for(x=b;x<=L;x+=b)lb.push(x);
  return {hero:null,who:'Маяк',book:'logic',
  text:'Маяк вспыхивает каждые '+a+' '+pl(a,'секунду','секунды','секунд')+', а бакен у входа в гавань — каждые '+b+' '+pl(b,'секунду','секунды','секунд')+'. Только что они вспыхнули одновременно. Через сколько секунд это случится снова?',ans:L,
  hint:'Выпиши, когда вспыхивает маяк: '+a+', '+2*a+', '+3*a+'… и когда бакен: '+b+', '+2*b+'… Найди первое общее число.',sol:'Маяк: '+la.join(', ')+'. Бакен: '+lb.join(', ')+'. Первое общее — '+L+'.'}},
 function(r){var Q=queue(r,4);return {hero:null,who:'Маяк',book:'logic',queue:Q,
  text:'Четыре фотографа пришли на маяк в 9, 10, 11 и 12 часов — по одному в каждый час. Кто когда пришёл?',
  hint:'Начни с условия, которое отсекает больше всего вариантов. Отмечай, кто точно не может прийти в какой-то час.',
  sol:Q.names.map(function(nm,i){return nm+' — '+Q.hours[Q.sol[i]]+':00'}).join(', ')+'.'}}
];
function daily(di){var r=rng(di*7919+104729);r();r();var k=((di%7)+7)%7;return DAILY[k](r)}

/* ===== листы и шифровки ===== */
var TOPICS={table:'Таблица умножения',tablediv:'Табличное деление',mix:'Таблица: умножение и деление',out2:'Внетабличное умножение',outdiv:'Внетабличное деление',rem:'Деление с остатком',mul1:'Умножение столбиком',mul2:'Умножение на двузначное',div1:'Деление уголком',div2:'Деление на двузначное',round:'Круглые числа',order:'Порядок действий',g3:'Примеры: 3 класс',g4:'Примеры: 4 класс'};
GEN.mix=function(r){return r()<.5?GEN.table(r):GEN.tablediv(r)};
function mixOf(parts){return function(r){var x=r(),acc=0;for(var i=0;i<parts.length;i++){acc+=parts[i][1];if(x<acc||i===parts.length-1)return GEN[parts[i][0]](r)}}}
GEN.g3=mixOf([['table',.25],['tablediv',.2],['out2',.2],['outdiv',.2],['order',.15]]);
GEN.g4=mixOf([['mul1',.2],['div1',.2],['mul2',.15],['div2',.15],['round',.15],['order',.15]]);
function sheet(topic,count,seed){var r=rng(seed),seen={},out=[],g=GEN[topic];for(var t=0;out.length<count&&t<count*60;t++){var x=g(r);if(seen[x.q])continue;seen[x.q]=1;out.push(x)}return out}
var ABC='АБВГДЕЖЗИКЛМНОПРСТУФХЦЧШЩЭЮЯ';
/* другие примеры с тем же ответом — для повторной буквы в шифровке */
function altQ(q,v,r,topic){var out=[],m=/^(\d+) × (\d+)$/.exec(q);if(m)out.push(m[2]+' × '+m[1]);
 if(typeof v!=='number')return out;
 if(topic==='table'||topic==='tablediv'||topic==='mix'||topic==='g3'){for(var a=2;a<=9;a++){if(v%a===0&&v/a>=2&&v/a<=9)out.push(a+' × '+v/a);if(v<=9&&topic!=='table')out.push(v*a+' : '+a)}if(topic!=='g3')return out}
 m=/^(\d+) : (\d+)$/.exec(q);if(m&&(topic==='round'||topic==='g4'))out.push((+m[1]*10)+' : '+(+m[2]*10));
 for(var t=0;t<12&&v>=4;t++){var d=rnd(r,2,9),c=rnd(r,1,Math.max(1,Math.floor(v/d)));if(c*d<v)out.push(c+' × '+d+' + '+(v-c*d))}
 return out}
function cipher(word,topic,seed){var r=rng(seed),g=GEN[topic],W=word.toUpperCase().replace(/Ё/g,'Е').replace(/[^А-Я]/g,'').slice(0,14);if(!W||topic==='rem')return null;
 var val={},vq={},used={},seen={},items=[];
 W.split('').forEach(function(ch){if(val[ch]!==undefined)return;var occ=W.split(ch).length-1;for(var t=0;t<400;t++){var x=g(r);if(used[x.a]||seen[x.q])continue;if(occ>1&&t<300&&new Set(altQ(x.q,x.a,r,topic).concat([x.q])).size<occ)continue;val[ch]=x.a;vq[ch]=x.q;used[x.a]=ch;seen[x.q]=1;break}});
 if(Object.keys(val).length!==new Set(W.split('')).size)return null;
 var first={};W.split('').forEach(function(ch){var it=null;if(!first[ch]){first[ch]=1;it={q:vq[ch]}}else{for(var t=0;t<300;t++){var x=g(r);if(x.a===val[ch]&&!seen[x.q]){it=x;seen[x.q]=1;break}}}
  if(!it&&(topic==='div1'||topic==='div2'||topic==='outdiv'||topic==='tablediv')){var q0=val[ch];for(t=0;t<60&&!it;t++){var dd=topic==='div2'?rnd(r,12,48):rnd(r,2,9),qq=dd*q0+' : '+dd;if(!seen[qq]&&(topic!=='tablediv'||q0<=9)&&(topic!=='outdiv'||dd*q0<100)){it={q:qq};seen[qq]=1}}}
  if(!it){var al=altQ(vq[ch],val[ch],r,topic).filter(function(z){return !seen[z]})[0];if(al){it={q:al};seen[al]=1}}
  if(!it)it={q:vq[ch]};
  items.push({q:it?it.q:'',a:val[ch],ch:ch})});
 var key=Object.keys(val).map(function(ch){return [val[ch],ch]}),other=ABC.split('').filter(function(c){return W.indexOf(c)<0});
 var want=Math.max(8,key.length+3);for(var t2=0;key.length<want&&t2<500;t2++){var x2=g(r);if(used[x2.a])continue;used[x2.a]='?';key.push([x2.a,pick(r,other)])}
 key.sort(function(a,b){return a[0]-b[0]});return {word:W,items:items,key:key}}
return {mulLayout:mulLayout,divLayout:divLayout,checkDiv:checkDiv,GEN:GEN,rng:rng,rnd:rnd,pl:pl,pick:pick,shuffle:shuffle,trick:trick,mulHints:mulHints,divPlan:divPlan,tyuk:tyuk,queue:queue,evalClue:evalClue,perms:perms,daily:daily,DAILY:DAILY,sheet:sheet,cipher:cipher,TOPICS:TOPICS}
})();
if(typeof module!=='undefined')module.exports=MathCore;
