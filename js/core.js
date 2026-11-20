/* ===== UTILS ===== */
const Utils = {
  shuffle: a => { const b=[...a]; for(let i=b.length-1;i>0;i--){ const j=0|Math.random()*(i+1); [b[i],b[j]]=[b[j],b[i]]; } return b; },
  today: () => new Date().toISOString().slice(0,10),
};

/* ===== STORAGE (Data Manager) ===== */
const Store = {
  LS_KEY: 'derdiedas_v2', SP_KEY: 'derdiedas_spell_v1', PR_KEY: 'derdiedas_prep_v1', SET_KEY: 'derdiedas_settings',
  load: k => { try { return JSON.parse(localStorage.getItem(k))||{}; } catch { return {}; } },
  save: (k, d) => localStorage.setItem(k, JSON.stringify(d)),
  getWD: (data, w) => {
    const x = data[w];
    if(!x) return {correct:0, total:0, lastSeen:null, nextReview:null, interval:1, ef:2.5};
    x.interval = x.interval||1; x.ef = x.ef||2.5; return x;
  },
  updateSR: (wd, ok, imp) => {
    wd.total++; wd.lastSeen = Utils.today();
    const efMin = imp ? 1.1 : 1.3;
    if(ok){
      wd.correct++; wd.ef = Math.max(efMin, wd.ef + 0.1);
      wd.interval = imp
        ? (wd.total<=1 ? 1 : wd.total<=2 ? 2 : wd.total<=3 ? 4 : Math.round(wd.interval * Math.min(wd.ef, 1.8)))
        : (wd.total<=2 ? (wd.interval===1 ? 3 : 7) : Math.round(wd.interval * wd.ef));
    }else{
      wd.interval = 1; wd.ef = Math.max(efMin, wd.ef - 0.2);
    }
    if(isNaN(wd.interval)||wd.interval<1) wd.interval=1;
    if(isNaN(wd.ef)||wd.ef<efMin) wd.ef=2.5;
    const n = new Date(); n.setDate(n.getDate()+wd.interval);
    wd.nextReview = n.toISOString().slice(0,10);
    return wd;
  },
  getShowTrans: () => Store.load(Store.SET_KEY).showTrans!==false,
  setShowTrans: v => { const s = Store.load(Store.SET_KEY); s.showTrans = v; Store.save(Store.SET_KEY, s); }
};

/* ===== GLOBAL STATE ===== */
const State = {
  tab: 'gender', mode: 'all', filter: 'all',
  deck: [], cur: 0, score: 0, streak: 0, evaluating: false, timer: null,
  // Spelling Specific
  sp: { input:'', copy:false, target:'', waiting:false, parts:null, phase:0, allCorrect:true },
  // Swipe cleanup reference
  activeDragCleanup: null
};

/* ===== DRAG HANDLER ===== */
class DragHandler {
  constructor(elId, onResult, options) {
    this.el = document.getElementById(elId);
    this.onResult = onResult;
    this.opts = options;
    this.init();
  }
  init() {
    if(State.activeDragCleanup) State.activeDragCleanup();
    const fresh = this.el.cloneNode(true);
    this.el.parentNode.replaceChild(fresh, this.el);
    this.el = document.getElementById(this.el.opts ? this.el.id : fresh.id);
    
    let sx=0, sy=0, cx=0, cy=0, drag=false, cw=0;
    const gdir = (dx,dy) => {
      const ax=Math.abs(dx), ay=Math.abs(dy);
      if(ax<22&&ay<22) return null;
      return ax>ay ? (dx<0?'left':'right') : (dy<0?'up':'down');
    };
    const onS = (ex,ey) => {
      if(State.cur>=State.deck.length || State.timer || State.evaluating) return;
      drag=true; sx=ex; sy=ey; cx=0; cy=0; cw=this.el.getBoundingClientRect().width; this.el.style.transition='none';
    };
    const onM = (ex,ey) => {
      if(!drag) return; cx=ex-sx; cy=ey-sy;
      const dy2 = (this.opts.isGerman && cy>0) ? cy*0.18 : cy;
      this.el.style.transform = `translate(${cx}px,${dy2}px) rotate(${cx/cw*15}deg)`;
      const dir = gdir(cx,cy);
      const adir = (this.opts.isGerman && dir==='down') ? null : dir;
      const dist = Math.max(Math.abs(cx),Math.abs(cy)), str = Math.min(dist/60,1);
      
      this.opts.getLabels().forEach(lbl => {
        if(lbl.el) lbl.el.style.opacity = (lbl.dir===adir ? str : 0);
      });
      
      const bg = document.getElementById(this.opts.bgId);
      const bgc = adir ? this.opts.getBg(adir) : null;
      if(bgc){ bg.style.background=bgc; bg.style.opacity=str*0.4; } else bg.style.opacity=0;
    };
    const onE = () => {
      if(!drag) return; drag=false;
      const dir = gdir(cx,cy);
      const adir = (this.opts.isGerman && dir==='down') ? null : dir;
      const dist = Math.max(Math.abs(cx),Math.abs(cy));
      
      if(adir && dist>58){
        this.onResult(adir);
        const tx = adir==='left' ? -440 : adir==='right' ? 440 : 0;
        const ty = adir==='up' ? -480 : adir==='down' ? 480 : 0;
        this.el.style.transition = 'transform 0.28s ease,opacity 0.28s ease';
        this.el.style.transform = `translate(${tx}px,${ty}px) rotate(${tx/5}deg)`;
        this.el.style.opacity = '0';
      } else {
        this.el.style.transition = 'transform 0.38s cubic-bezier(.22,.61,.36,1)';
        this.el.style.transform = '';
        setTimeout(() => { this.el.style.transition=''; }, 400);
        this.opts.getLabels().forEach(lbl => { if(lbl.el) lbl.el.style.opacity=0; });
        document.getElementById(this.opts.bgId).style.opacity=0;
      }
    };
    
    const wMM=e=>{if(drag)onM(e.clientX,e.clientY);};
    const wTM=e=>{if(drag){const t=e.touches[0];onM(t.clientX,t.clientY);}};
    const wMU=e=>{if(drag)onM(e.clientX,e.clientY);onE();};
    const wTE=e=>{if(drag){const t=e.changedTouches&&e.changedTouches[0];if(t)onM(t.clientX,t.clientY);}onE();};
    const wTC=()=>{ if(!drag)return; drag=false; this.el.style.transition='transform 0.38s cubic-bezier(.22,.61,.36,1)'; this.el.style.transform=''; setTimeout(()=>{this.el.style.transition='';},400); this.opts.getLabels().forEach(lbl=>{if(lbl.el)lbl.el.style.opacity=0;}); document.getElementById(this.opts.bgId).style.opacity=0;};
    
    this.el.addEventListener('mousedown',e=>onS(e.clientX,e.clientY));
    window.addEventListener('mousemove',wMM); window.addEventListener('mouseup',wMU);
    this.el.addEventListener('touchstart',e=>{onS(e.touches[0].clientX,e.touches[0].clientY);},{passive:true});
    window.addEventListener('touchmove',wTM,{passive:true}); window.addEventListener('touchend',wTE); window.addEventListener('touchcancel',wTC);
    
    State.activeDragCleanup = () => {
      window.removeEventListener('mousemove',wMM); window.removeEventListener('mouseup',wMU);
      window.removeEventListener('touchmove',wTM); window.removeEventListener('touchend',wTE); window.removeEventListener('touchcancel',wTC);
    };
  }
}