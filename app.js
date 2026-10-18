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
const tourText={zh:{pause:'暂停运镜',play:'继续运镜',playing:'缓慢运镜 · 自动巡览',paused:'运镜已暂停 · 可手动切换机位',reduced:'已按系统偏好关闭动态效果',failed:'图片加载失败，请重试'},en:{pause:'Pause motion',play:'Resume motion',playing:'Slow camera motion · Auto tour',paused:'Motion paused · Choose a view',reduced:'Motion disabled by system preference',failed:'Image could not load. Please retry.'}};
const cameraMoves=[
  ['scale(1.01) translate(0%, 0%)','scale(1.10) translate(-0.7%, 0.5%)'],
  ['scale(1.14) translate(-0.7%, 0.5%)','scale(1.02) translate(0%, 0%)'],
  ['scale(1.02) translate(0%, 0%)','scale(1.12) translate(0.5%, -0.4%)'],
  ['scale(1.12) translate(0.7%, 0%)','scale(1.02) translate(0%, 0%)'],
  ['scale(1.02) translate(0%, 0%)','scale(1.10) translate(-0.5%, 0.4%)']
];
const reducedMotion=matchMedia('(prefers-reduced-motion: reduce)');
const shotDuration=8000;
let motionEnabled=!reducedMotion.matches;
let galleryVisible=true;
let imageReady=false;
let requestId=0;
let tourTimer;
let cameraAnimation;
let progressAnimation;
let fadeAnimation;
let language='zh';
let currentView=0;
try{language=localStorage.getItem('xingfuli-language')==='en'?'en':'zh';}catch{}
const hero=document.getElementById('hero-image');
const dialog=document.getElementById('image-dialog');
const languageButton=document.getElementById('language-toggle');
const previousImage=document.getElementById('hero-previous');
const motionButton=document.getElementById('motion-toggle');
const progress=document.getElementById('tour-progress-bar');
function canPlay(){return motionEnabled&&!reducedMotion.matches&&!document.hidden&&galleryVisible&&!dialog.open&&imageReady;}
function pausePlayback(){
  clearTimeout(tourTimer);
  for(const animation of [cameraAnimation,progressAnimation,fadeAnimation]){
    if(!animation)continue;
    const time=animation.currentTime;
    animation.pause();
    if(time!==null)animation.currentTime=time;
  }
}
function updateMotionControl(){
  const text=tourText[language];
  motionButton.disabled=reducedMotion.matches;
  motionButton.setAttribute('aria-pressed',String(motionEnabled&&!reducedMotion.matches));
  document.getElementById('motion-label').textContent=motionEnabled?text.pause:text.play;
  document.getElementById('motion-icon').textContent=motionEnabled?'Ⅱ':'▶';
  document.getElementById('tour-status').textContent=reducedMotion.matches?text.reduced:(motionEnabled?text.playing:text.paused);
}
function syncPlayback(){
  pausePlayback();
  updateMotionControl();
  if(!canPlay())return;
  if(!cameraAnimation){
    cameraAnimation=hero.animate(cameraMoves[currentView].map(transform=>({transform})),{duration:shotDuration,easing:'linear',fill:'forwards'});
    progressAnimation=progress.animate([{transform:'scaleX(0)'},{transform:'scaleX(1)'}],{duration:shotDuration,easing:'linear',fill:'forwards'});
  }
  cameraAnimation.play();progressAnimation.play();fadeAnimation?.play();
  const remaining=Math.max(0,shotDuration-Number(cameraAnimation.currentTime||0));
  tourTimer=setTimeout(()=>{if(canPlay())setView(currentView+1);},remaining);
}
function updateViewLabels(){
  const view=views[currentView];
  const label=String(currentView+1).padStart(2,'0')+' / '+translations[language]['view'+currentView];
  hero.alt=view[language];
  document.getElementById('view-tag').textContent=label;
  document.getElementById('view-description').textContent=view[language];
  document.getElementById('dialog-caption').textContent=label;
  const large=document.getElementById('dialog-image');
  if(dialog.open){large.src=hero.src;large.alt=hero.alt;}
  document.querySelectorAll('.view-button').forEach((button,i)=>{button.classList.toggle('is-active',i===currentView);button.setAttribute('aria-pressed',String(i===currentView));});
}
async function setView(index){
  const next=(index+views.length)%views.length;
  const id=++requestId;
  imageReady=false;pausePlayback();
  const image=new Image();image.src='assets/'+views[next].file+'.webp';
  try{await image.decode();}catch{
    if(id===requestId){imageReady=true;syncPlayback();clearTimeout(tourTimer);document.getElementById('tour-status').textContent=tourText[language].failed;}
    return;
  }
  if(id!==requestId)return;
  const oldTransform=getComputedStyle(hero).transform;
  previousImage.src=hero.currentSrc||hero.src;
  previousImage.style.transform=oldTransform;
  fadeAnimation?.cancel();fadeAnimation=undefined;
  cameraAnimation?.cancel();progressAnimation?.cancel();
  cameraAnimation=undefined;progressAnimation=undefined;
  currentView=next;hero.src=image.src;imageReady=true;
  updateViewLabels();
  if(motionEnabled&&!reducedMotion.matches){
    fadeAnimation=previousImage.animate([{opacity:1},{opacity:0}],{duration:650,fill:'forwards'});
    const fade=fadeAnimation;
    fade.onfinish=()=>{if(fadeAnimation===fade){fade.cancel();fadeAnimation=undefined;}};
  }
  syncPlayback();
}
function setLanguage(next){
  language=next;
  document.documentElement.lang=next==='zh'?'zh-CN':'en';
  document.querySelectorAll('[data-i18n]').forEach(el=>{el.textContent=translations[next][el.dataset.i18n];});
  languageButton.innerHTML=next==='zh'?'EN <span aria-hidden="true">↗</span>':'中文 <span aria-hidden="true">↗</span>';
  languageButton.setAttribute('aria-label',next==='zh'?'Switch to English':'切换到中文');
  updateViewLabels();updateMotionControl();
  try{localStorage.setItem('xingfuli-language',next);}catch{}
}
languageButton.addEventListener('click',()=>setLanguage(language==='zh'?'en':'zh'));
document.querySelectorAll('.view-button').forEach(button=>button.addEventListener('click',()=>setView(Number(button.dataset.view))));
document.getElementById('open-image').addEventListener('click',()=>{++requestId;imageReady=true;dialog.showModal();pausePlayback();updateViewLabels();});
dialog.addEventListener('close',syncPlayback);
motionButton.addEventListener('click',()=>{++requestId;imageReady=true;motionEnabled=!motionEnabled;syncPlayback();});
document.addEventListener('visibilitychange',syncPlayback);
new IntersectionObserver(entries=>{galleryVisible=entries[0].intersectionRatio>=0.1;syncPlayback();},{threshold:0.1}).observe(document.getElementById('open-image'));
reducedMotion.addEventListener('change',()=>{
  motionEnabled=!reducedMotion.matches;
  if(reducedMotion.matches){cameraAnimation?.cancel();progressAnimation?.cancel();fadeAnimation?.cancel();cameraAnimation=undefined;progressAnimation=undefined;fadeAnimation=undefined;}
  syncPlayback();
});
document.getElementById('close-dialog').addEventListener('click',()=>dialog.close());
document.getElementById('previous-view').addEventListener('click',()=>setView(currentView-1));
document.getElementById('next-view').addEventListener('click',()=>setView(currentView+1));
dialog.addEventListener('click',event=>{if(event.target===dialog){const r=dialog.getBoundingClientRect();if(event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom)dialog.close();}});
document.addEventListener('keydown',event=>{if(!dialog.open)return;if(event.key==='ArrowLeft'){event.preventDefault();setView(currentView-1);}else if(event.key==='ArrowRight'){event.preventDefault();setView(currentView+1);}});
setLanguage(language);
setView(0);
