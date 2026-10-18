const translations = {
  zh: {title:'幸福里',number:'3 号楼',intro:'阳台上的衣服，楼下的面馆，黄昏里回家的人。用代码搭起一座熟悉的中国居民楼。',credit:'使用 DeepSeek V4.1 Flash 1017 制作',galleryLabel:'场景档案 / 五个机位',zoomHint:'点击画面查看大图',view0:'主视角',view1:'立面细节',view2:'单元入口',view3:'街道生活',view4:'屋顶风景',detailsTitle:'把日常，搭进细节里。',details:'封阳台、防盗网、空调外机、晾衣杆；烟酒店、理发店、牛肉面馆和修车铺。屋顶有太阳能热水器和水箱，街边有梧桐、自行车、行人和一只猫。',procedural:'由 Python 程序化生成，未使用外部模型或图片贴图。本页展示五个机位的渲染图；完整三维场景可下载后在 Blender 中查看。',floors:'住宅层 + 底层商业',cameras:'预设机位',generation:'程序化建模',license:'开源许可',downloadTitle:'把这条街，带回你的 Blender。',downloadCopy:'完整工程、生成脚本与原始渲染图均已开源。',download:'下载 .blend 工程',source:'查看源码与说明'},
  en: {title:'Xingfuli',number:'No. 3',intro:'Laundry on the balcony. A noodle shop downstairs. Neighbors coming home at dusk. A familiar Chinese neighborhood, built in code.',credit:'Created with DeepSeek V4.1 Flash 1017',galleryLabel:'SCENE ARCHIVE / FIVE VIEWS',zoomHint:'Click the image to enlarge',view0:'Overview',view1:'Facade',view2:'Entrance',view3:'Street life',view4:'Rooftop',detailsTitle:'Everyday life, in the details.',details:'Enclosed balconies, window grilles, air conditioners, and drying racks. A corner shop, a barber, a noodle house, and a bicycle repair shop. Solar water heaters above; trees, bicycles, neighbors, and a cat below.',procedural:'Generated with Python, without external models or image textures. This page presents five rendered camera views. Download the complete 3D scene to explore it in Blender.',floors:'Residential floors + retail level',cameras:'Camera views',generation:'Procedural modeling',license:'Open-source license',downloadTitle:'Bring this street into your Blender.',downloadCopy:'The full scene, generation scripts, and original renders are open source.',download:'Download .blend scene',source:'Explore source & documentation'}
};
const views = [
  {file:'hero',zh:'六层住宅与底层商铺，构成一段日常的街道。',en:'Six residential floors above small shops: an ordinary street, full of life.'},
  {file:'facade',zh:'封阳台、防盗网、晾衣杆，生活在立面上留下痕迹。',en:'Enclosed balconies, window grilles, and drying racks trace daily life across the facade.'},
  {file:'entrance',zh:'单元门、信箱与社区横幅，是每天回家经过的地方。',en:'The entrance, mailboxes, and a community banner mark the way home.'},
  {file:'street',zh:'梧桐树下的自行车、旧汽车和街坊，拼出街道的温度。',en:'Trees, bicycles, old cars, and neighbors give the street its character.'},
  {file:'roof',zh:'太阳能热水器、水箱和天线，是屋顶上安静的日常。',en:'Solar water heaters, tanks, and antennas form a quiet rooftop landscape.'}
];
let language='zh';
let currentView=0;
try{language=localStorage.getItem('xingfuli-language')==='en'?'en':'zh';}catch{}
const hero=document.getElementById('hero-image');
const dialog=document.getElementById('image-dialog');
const languageButton=document.getElementById('language-toggle');
function setView(index){
  currentView=(index+views.length)%views.length;
  const view=views[currentView];
  const label=String(currentView+1).padStart(2,'0')+' / '+translations[language]['view'+currentView];
  hero.src='assets/'+view.file+'.webp';
  hero.alt=view[language];
  document.getElementById('view-tag').textContent=label;
  document.getElementById('view-description').textContent=view[language];
  document.getElementById('dialog-caption').textContent=label;
  const large=document.getElementById('dialog-image');
  if(dialog.open){large.src=hero.src;large.alt=hero.alt;}
  document.querySelectorAll('.view-button').forEach((button,i)=>{button.classList.toggle('is-active',i===currentView);button.setAttribute('aria-pressed',String(i===currentView));});
}
function setLanguage(next){
  language=next;
  document.documentElement.lang=next==='zh'?'zh-CN':'en';
  document.querySelectorAll('[data-i18n]').forEach(el=>{el.textContent=translations[next][el.dataset.i18n];});
  languageButton.innerHTML=next==='zh'?'EN <span aria-hidden="true">↗</span>':'中文 <span aria-hidden="true">↗</span>';
  languageButton.setAttribute('aria-label',next==='zh'?'Switch to English':'切换到中文');
  setView(currentView);
  try{localStorage.setItem('xingfuli-language',next);}catch{}
}
languageButton.addEventListener('click',()=>setLanguage(language==='zh'?'en':'zh'));
document.querySelectorAll('.view-button').forEach(button=>button.addEventListener('click',()=>setView(Number(button.dataset.view))));
document.getElementById('open-image').addEventListener('click',()=>{dialog.showModal();setView(currentView);});
document.getElementById('close-dialog').addEventListener('click',()=>dialog.close());
document.getElementById('previous-view').addEventListener('click',()=>setView(currentView-1));
document.getElementById('next-view').addEventListener('click',()=>setView(currentView+1));
dialog.addEventListener('click',event=>{if(event.target===dialog){const r=dialog.getBoundingClientRect();if(event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom)dialog.close();}});
document.addEventListener('keydown',event=>{if(!dialog.open)return;if(event.key==='ArrowLeft'){event.preventDefault();setView(currentView-1);}else if(event.key==='ArrowRight'){event.preventDefault();setView(currentView+1);}});
setLanguage(language);
