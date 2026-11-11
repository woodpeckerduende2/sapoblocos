// Presentation-only localization: never translate saved data, Japanese IDs or answers.
// Remember original text per node so switching languages is reversible without rerendering a mission.
(()=>{
const supported=['pt-BR','en'];
let locale='pt-BR';
try{const saved=localStorage.getItem('sapoblocos-language');if(supported.includes(saved))locale=saved}catch{}
const messages=new Map();
for(const [pt,en] of Object.entries(englishMessages)){
  messages.set(pt,en);
  messages.set(pt[0].toUpperCase()+pt.slice(1),en ? en[0].toUpperCase()+en.slice(1) : '');
  messages.set(pt.toLocaleLowerCase('pt-BR'),en.toLowerCase().replace(/\bi\b/g,'I'));
  messages.set(pt.toLocaleUpperCase('pt-BR'),en.toUpperCase());
  if(pt.endsWith('.')){
    messages.set(pt.slice(0,-1),en.replace(/\.$/,''));
    messages.set(pt.slice(0,-1).toLowerCase(),en.replace(/\.$/,'').toLowerCase().replace(/\bi\b/g,'I'));
  }
}
const escape=s=>s.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
const pattern=new RegExp('(?<![\\p{L}\\p{N}])(?:'+[...messages.keys()].sort((a,b)=>b.length-a.length).map(escape).join('|')+')(?![\\p{L}\\p{N}])','gu');
const months=['janeiro','fevereiro','março','abril','maio','junho','julho','agosto','setembro','outubro','novembro','dezembro'];
const englishMonths=['January','February','March','April','May','June','July','August','September','October','November','December'];
function translate(text){
  if(locale!=='en'||!text)return text;
  if(messages.has(text))return messages.get(text);
  // Dates are formatted from the original local calendar, keeping the same day and season.
  text=text.replace(new RegExp('(?:(\\d{1,2}) de )?('+months.join('|')+') de (\\d{4})','g'),(_,day,month,year)=>englishMonths[months.indexOf(month)]+(day?' '+day+',':'')+' '+year);
  text=text.replace(/Uma pista: são (\d+) bloquinhos\./g,'A hint: use $1 blocks.').replace(/(\d+) de (\d+)/g,'$1 of $2');
  return text.replace(pattern,match=>messages.get(match)).replace(/\b1 missions\b/g,'1 mission').replace(/\b1 discoveries\b/g,'1 discovery');
}
const originals=new WeakMap();
const skip='script,style,[data-no-translate],.brand,[lang="ja"],.tile > small,.visitor-word span,.visitor-word-option span,.memory-list small,.discovery small';
const attributes=['aria-label','title','alt','placeholder'];
function updateValue(node,key,current,write){
  let record=originals.get(node);if(!record){record={};originals.set(node,record)}
  const old=record[key];
  const source=old&&current===old.output?old.source:current;
  const output=translate(source);
  record[key]={source,output};
  if(output!==current)write(output);
}
function visit(root){
  if(root.nodeType===3){if(root.parentElement&&!root.parentElement.closest(skip))updateValue(root,'text',root.nodeValue,value=>{root.nodeValue=value});return}
  if(root.nodeType!==1||root.matches(skip))return;
  for(const attr of attributes){if(root.hasAttribute(attr))updateValue(root,attr,root.getAttribute(attr),value=>root.setAttribute(attr,value))}
  for(const child of root.childNodes)visit(child);
}
const observer=new MutationObserver(records=>{
  observer.disconnect();
  for(const record of records){if(record.type==='childList')record.addedNodes.forEach(visit);else visit(record.target)}
  observe();
});
function observe(){observer.observe(document.documentElement,{subtree:true,childList:true,characterData:true,attributes:true,attributeFilter:attributes})}
function refresh(){
  observer.disconnect();visit(document.documentElement);
  document.documentElement.lang=locale;
  document.querySelectorAll('[data-locale]').forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.locale===locale)));
  observe();
}
function setLocale(value){if(!supported.includes(value))return;locale=value;try{localStorage.setItem('sapoblocos-language',locale)}catch{}refresh()}
document.querySelectorAll('[data-locale]').forEach(button=>button.addEventListener('click',()=>setLocale(button.dataset.locale)));
window.sapoblocosI18n={translate,setLocale,get locale(){return locale}};
refresh();
})();
