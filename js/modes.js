/* ===== CORE GAME MODES (Gender Only) ===== */
const CoreMode = {
  start: (mode) => {
    State.mode = mode; State.cur = 0; State.score = 0; State.streak = 0;
    const d = Store.load(Store.LS_KEY);
    const pool = ALL_WORDS.filter(w => !w.plural && w.art);
    
    let words = [];
    if(mode==='all') words = Utils.shuffle(pool);
    else if(mode==='today') {
      const td = Utils.today();
      const due = pool.filter(w => { const wd = Store.getWD(d,w.word); return !wd.lastSeen || wd.nextReview<=td; });
      words = [...Utils.shuffle(due.filter(w=>w.important)), ...Utils.shuffle(due.filter(w=>!w.important))].slice(0, Math.min(20, Math.max(10, due.length)));
      if(!words.length){ alert('今日の単語はすべて完了！'); return; }
    }
    else if(mode==='weak'){
      words = Utils.shuffle(pool.filter(w => { const wd = Store.getWD(d,w.word); return wd.total>=2 && wd.correct/wd.total<0.5; }));
      if(!words.length){ alert('苦手な単語がありません！'); return; }
    }
    else if(mode==='important') words = Utils.shuffle(pool.filter(w=>w.important));
    
    State.deck = words;
    document.getElementById('study-title').textContent = {all:'全単語',today:'今日の単語',weak:'苦手な単語',important:'重要語'}[mode]||mode;
    document.getElementById('st-streak').textContent = '0';
    document.getElementById('st-score-lbl').textContent = '正解 0';
    UI.showScreen('study');
    CoreMode.renderCard();
  },
  
  renderCard: () => {
    State.evaluating = false;
    if(State.cur >= State.deck.length){ UI.showFinish(State.deck.length, State.score, State.streak, ()=>CoreMode.start(State.mode)); return; }
    const w = State.deck[State.cur], d = Store.load(Store.LS_KEY), wd = Store.getWD(d, w.word);
    
    document.getElementById('st-progress').style.width = (State.cur/State.deck.length*100)+'%';
    document.getElementById('st-count').textContent = `${State.cur}/${State.deck.length}`;
    document.getElementById('st-hist').textContent = wd.total>0 ? `${Math.round(wd.correct/wd.total*100)}%(${wd.correct}/${wd.total})` : '初回';
    document.getElementById('card-imp').textContent = w.important ? '⭐' : '';
    
    const nxt = State.deck[State.cur+1];
    if(nxt){
      document.getElementById('next-label').textContent='次の単語';
      document.getElementById('next-word').textContent=nxt.word;
      document.getElementById('next-word').className='card-word';
    } else {
      document.getElementById('next-label').textContent='';
      document.getElementById('next-word').textContent='';
    }
    
    const ac = document.getElementById('active-card');
    ac.style.transform=''; ac.style.opacity=''; ac.style.transition='none';
    setTimeout(()=>{ac.style.transition='';},30);
    
    CoreMode.renderGender(w);
  },
  
  renderGender: (w) => {
    document.getElementById('card-q-label').textContent = '冠詞は？';
    document.getElementById('st-word').textContent = w.word; document.getElementById('st-word').className = 'card-word';
    document.getElementById('st-trans').textContent = Store.getShowTrans() ? w.trans : '';
    
    const dirs = ['left','up','right'];
    dirs.forEach(d => { document.getElementById('lbl-'+d).style.opacity=0; });
    document.getElementById('lbl-down').style.opacity=0;
    
    document.getElementById('lbl-left').textContent='← der'; document.getElementById('lbl-left').className='card-lbl lbl-left lbl-der';
    document.getElementById('lbl-up').textContent='↑ das'; document.getElementById('lbl-up').className='card-lbl lbl-up lbl-das';
    document.getElementById('lbl-right').textContent='die →'; document.getElementById('lbl-right').className='card-lbl lbl-right lbl-die';
    
    document.getElementById('choice-area').innerHTML = `<div class="hint-row">
      <button class="hint-btn hb-der" onclick="CoreMode.eval('der')"><span class="h-dir">←</span><span class="h-art">der</span><span class="h-lbl">男性</span></button>
      <button class="hint-btn hb-das" onclick="CoreMode.eval('das')"><span class="h-dir">↑</span><span class="h-art">das</span><span class="h-lbl">中性</span></button>
      <button class="hint-btn hb-die" onclick="CoreMode.eval('die')"><span class="h-dir">→</span><span class="h-art">die</span><span class="h-lbl">女性</span></button>
    </div>`;
    
    new DragHandler('active-card', (dir) => {
      CoreMode.eval({left:'der',up:'das',right:'die'}[dir], true);
    }, {
      bgId: 'card-bg', isGerman: true,
      getBg: (dir) => ({left:'var(--der-bg)',up:'var(--das-bg)',right:'var(--die-bg)'}[dir]),
      getLabels: () => ['left','up','right','down'].map(d => ({dir:d, el:document.getElementById('lbl-'+d)}))
    });
  },
  
  eval: (chosen, fromSwipe=false) => {
    if(State.evaluating) return; State.evaluating = true;
    const w = State.deck[State.cur], ok = chosen===w.art;
    CoreMode.record(w, ok);
    const sub = (!Store.getShowTrans()||!ok) ? w.trans : '';
    UI.showLR(ok, ok?`${w.art} ${w.word}`:`正解： ${w.art} ${w.word}`, sub, 'last-result');
    if(!fromSwipe){ UI.flashCard(ok); State.timer=setTimeout(()=>{State.cur++;State.timer=null;CoreMode.renderCard();},520); }
    else { setTimeout(()=>{State.cur++;CoreMode.renderCard();}, 280); }
  },
  
  record: (w, ok) => {
    if(ok){ State.score++; State.streak++; } else { State.streak=0; }
    document.getElementById('st-streak').textContent = State.streak;
    document.getElementById('st-score-lbl').textContent = `正解 ${State.score}`;
    const d = Store.load(Store.LS_KEY);
    d[w.word] = Store.updateSR(Store.getWD(d,w.word), ok, w.important||false);
    Store.save(Store.LS_KEY, d);
  }
};

/* ===== PREP MODE ===== */
const PrepMode = {
  CASE_LABELS: {'2格':'2格支配','3格':'3格支配','4格':'4格支配','3・4格':'3・4格支配'},
  CASE_CLS: {'2格':'p2','3格':'p3','4格':'p4','3・4格':'p34'},
  PREP_DIR_MAP: {up:'2格',left:'3格',right:'4格',down:'3・4格'},
  
  start: (mode) => {
    State.mode = mode; State.cur = 0; State.score = 0; State.streak = 0;
    const pd = Store.load(Store.PR_KEY);
    let words = [];
    if(mode==='all') words = Utils.shuffle(PREPOSITIONS);
    else if(mode==='weak'){
      words = Utils.shuffle(PREPOSITIONS.filter(w=>{const wd=pd[w.word];return wd&&wd.total>=2&&wd.correct/wd.total<0.5;}));
      if(!words.length){alert('苦手な前置詞がありません！');return;}
    }
    State.deck = words;
    document.getElementById('prep-title').textContent = mode==='weak'?'苦手な前置詞':'前置詞 全問';
    document.getElementById('prep-streak').textContent='0'; document.getElementById('prep-score-lbl').textContent='正解 0';
    UI.showScreen('prep-screen');
    PrepMode.renderCard();
  },
  
  renderCard: () => {
    State.evaluating = false;
    if(State.cur >= State.deck.length){ UI.showFinish(State.deck.length, State.score, State.streak, ()=>PrepMode.start(State.mode), 'prep-footer', 'prep-card-area', 'prep-choices', 'prep-example'); return; }
    
    const cardEl = document.getElementById('prep-card');
    if(cardEl){cardEl.style.transition='none';cardEl.style.transform='';cardEl.style.opacity='1';}
    
    const w = State.deck[State.cur], pd = Store.load(Store.PR_KEY), wd = pd[w.word]||{correct:0,total:0};
    document.getElementById('prep-progress').style.width = (State.cur/State.deck.length*100)+'%';
    document.getElementById('prep-count').textContent = `${State.cur}/${State.deck.length}`;
    document.getElementById('prep-word').textContent = w.word;
    document.getElementById('prep-trans').textContent = w.trans;
    document.getElementById('prep-hist').textContent = wd.total>0?`${Math.round(wd.correct/wd.total*100)}%(${wd.correct}/${wd.total})`:'初回';
    document.getElementById('prep-example').style.opacity = '0';
    
    const prepDirLabels = {left:'←',up:'↑',right:'→',down:'↓'};
    ['left','up','right','down'].forEach(dir => {
      const c = PrepMode.PREP_DIR_MAP[dir];
      const lbl = document.getElementById('prep-lbl-'+dir);
      if(lbl){lbl.textContent=prepDirLabels[dir]+' '+PrepMode.CASE_LABELS[c]; lbl.className='card-lbl lbl-'+dir+' '+PrepMode.CASE_CLS[c]+'lbl'; lbl.style.opacity='0';}
    });
    
    const nxt = State.deck[State.cur+1];
    document.getElementById('prep-next-label').textContent = nxt ? '次の前置詞' : '';
    document.getElementById('prep-next-word').textContent = nxt ? nxt.word : '';
    
    const dirCls = {left:'c3 qc-left',up:'c1 qc-up',right:'c4 qc-right',down:'c2 qc-down'};
    document.getElementById('prep-choices').innerHTML = ['left','up','right','down'].map(dir => {
      const c = PrepMode.PREP_DIR_MAP[dir];
      return `<button class="qc-btn ${dirCls[dir]}" data-case="${c}" onclick="PrepMode.eval('${c}', false)"><span class="qc-dir">${prepDirLabels[dir]}</span><span class="qc-txt">${PrepMode.CASE_LABELS[c]}</span></button>`;
    }).join('');
    
    new DragHandler('prep-card', (dir) => { PrepMode.eval(PrepMode.PREP_DIR_MAP[dir], true); }, {
      bgId: 'prep-card-bg', isGerman: false,
      getBg: (dir) => ({'2格':'#fff8ee','3格':'var(--der-bg)','4格':'var(--das-bg)','3・4格':'var(--die-bg)'}[PrepMode.CASE_CLS[PrepMode.PREP_DIR_MAP[dir]]] || 'var(--bg3)'),
      getLabels: () => ['left','up','right','down'].map(d => ({dir:d, el:document.getElementById('prep-lbl-'+d)}))
    });
  },
  
  eval: (chosen, fromSwipe=false) => {
    if(State.evaluating) return; State.evaluating = true;
    const w = State.deck[State.cur], isCorrect = chosen===w.case;
    if(isCorrect){State.score++;State.streak++;}else{State.streak=0;}
    
    document.getElementById('prep-streak').textContent = State.streak;
    document.getElementById('prep-score-lbl').textContent = `正解 ${State.score}`;
    
    const pd = Store.load(Store.PR_KEY);
    if(!pd[w.word]) pd[w.word]={correct:0,total:0,lastSeen:null};
    pd[w.word].total++; if(isCorrect) pd[w.word].correct++;
    pd[w.word].lastSeen = Utils.today(); Store.save(Store.PR_KEY, pd);
    
    UI.showLR(isCorrect, isCorrect?`✓ ${PrepMode.CASE_LABELS[w.case]}`:`正解： ${PrepMode.CASE_LABELS[w.case]}`, w.ex, 'prep-last-result');
    
    document.querySelectorAll('#prep-choices .qc-btn').forEach(btn => {
      if(btn.dataset.case === w.case) btn.style.cssText = 'background:var(--ok-bg);border-color:var(--ok);color:var(--ok);';
      else if(btn.dataset.case === chosen && !isCorrect) btn.style.cssText = 'background:var(--ng-bg);border-color:var(--ng);color:var(--ng);';
      btn.disabled = true;
    });
    
    const exEl = document.getElementById('prep-example');
    exEl.textContent = w.ex; exEl.style.background = isCorrect?'var(--ok-bg)':'var(--ng-bg)'; exEl.style.color = isCorrect?'var(--ok)':'var(--ng)'; exEl.style.opacity = '1';
    
    if(!fromSwipe) State.timer = setTimeout(()=>{State.timer=null; State.cur++; PrepMode.renderCard();}, 520);
    else setTimeout(()=>{State.cur++;PrepMode.renderCard();}, 280);
  }
};

/* ===== SPELL MODE ===== */
const SpellMode = {
  KB: [['q','w','e','r','t','z','u','i','o','p','ü'],['a','s','d','f','g','h','j','k','l','ö','ä'],['y','x','c','v','b','n','m','ß','⌫']],
  
  start: (mode) => {
    State.mode = mode; const sd = Store.load(Store.SP_KEY); let words = [];
    if(mode==='all') words=Utils.shuffle(ALL_SPELL);
    else if(mode==='random20') words=Utils.shuffle(ALL_SPELL).slice(0,20);
    else if(mode==='random100') words=Utils.shuffle(ALL_SPELL).slice(0,100);
    else if(mode==='modal'){ words=Utils.shuffle(ALL_SPELL.filter(w=>w.type==='話法の助動詞')); if(!words.length)return; }
    else if(mode==='important'){ words=Utils.shuffle(ALL_SPELL.filter(w=>w.important)); if(!words.length)return; }
    else if(mode==='separate'){ words=Utils.shuffle(ALL_SPELL.filter(w=>w.separate)); if(!words.length)return; }
    else if(mode==='time_words'){ words=Utils.shuffle(ALL_SPELL.filter(w=>w.type==='時間')); if(!words.length)return; }
    else if(mode==='conjunctions'){ words=Utils.shuffle(ALL_SPELL.filter(w=>w.type==='接続詞')); if(!words.length)return; }
    else if(mode==='preposition'){ words=Utils.shuffle(ALL_SPELL.filter(w=>w.type==='前置詞')); if(!words.length)return; }
    else if(mode==='numbers') words=Utils.shuffle(ALL_SPELL.filter(w=>w.type==='数詞'));
    else if(mode==='weak'){ words=Utils.shuffle(ALL_SPELL.filter(w=>{const s=sd[w.word];return s&&s.total>=2&&s.correct/s.total<0.5;})); if(!words.length){alert('苦手な単語がありません');return;} }
    
    State.deck=words; State.cur=0; State.score=0; State.streak=0;
    const titles = {all:'スペリング全単語',important:'重要語',random20:'20語ランダム',random100:'100語ランダム',modal:'話法の助動詞',separate:'分離動詞',time_words:'時間を表す単語',preposition:'前置詞',conjunctions:'接続詞',numbers:'数詞スペリング',weak:'苦手な単語'};
    document.getElementById('sp-title').textContent = titles[mode]||'スペリング';
    document.getElementById('sp-streak').textContent='0'; document.getElementById('sp-score-lbl').textContent='正解 0';
    
    document.getElementById('sp-main').style.display='';
    document.getElementById('sp-footer').innerHTML='';
    document.getElementById('sp-keyboard').innerHTML = SpellMode.KB.map(row=>`<div class="kb-row">${row.map(k=>`<button class="kb-key${k==='⌫'?' special':''}" ontouchstart="SpellMode.kp('${k}');event.preventDefault();" onclick="SpellMode.kp('${k}')">${k}</button>`).join('')}</div>`).join('');
    
    UI.showScreen('spelling'); SpellMode.renderCard();
  },
  
  renderCard: () => {
    const w = State.deck[State.cur];
    State.sp = { input:'', copy:false, waiting:false, phase:0, allCorrect:true, parts: w.parts ? w.parts.map(p=>p.toLowerCase()) : null };
    State.sp.target = State.sp.parts ? State.sp.parts[0] : w.word.toLowerCase();
    
    document.getElementById('sp-progress').style.width = (State.cur/State.deck.length*100)+'%';
    document.getElementById('sp-count').textContent = `${State.cur}/${State.deck.length}`;
    document.getElementById('sp-prompt').textContent = w.trans;
    document.getElementById('sp-prompt').className = 'sp-prompt'+(w.word.length>12?' small':'');
    document.getElementById('sp-type').textContent = w.type ? `[${w.type}]` : '';
    document.getElementById('sp-feedback').textContent = ''; document.getElementById('sp-feedback').className = 'sp-feedback';
    document.getElementById('sp-copy-hint').style.display = 'none';
    document.getElementById('sp-skip-btn').classList.remove('hidden');
    SpellMode.renderDisp();
  },
  
  renderDisp: () => {
    const el = document.getElementById('sp-display'), s = State.sp;
    if(s.parts){
      const buildBox = (t,i,act,cpy) => {
        let h='';
        for(let j=0; j<i.length; j++) h+=`<span class="sp-char ${(!cpy||i[j]===t[j])?'':'wrong'}">${i[j]}</span>`;
        if(act && (i.length===0 || i.length<t.length)) h+='<span class="sp-char cursor"> </span>';
        return h;
      };
      let h='<div class="sp-two-box">';
      if(s.phase===0) { h+=`<div class="sp-part-box active">${buildBox(s.parts[0],s.input,true,s.copy)}</div><span class="sp-part-sep">+</span><div class="sp-part-box" style="opacity:0.25;border-style:dashed"></div>`; }
      else { h+=`<div class="sp-part-box done">${s.parts[0].split('').map(c=>`<span class="sp-char">${c}</span>`).join('')}</div><span class="sp-part-sep">+</span><div class="sp-part-box active">${buildBox(s.parts[1],s.input,true,s.copy)}</div>`; }
      el.innerHTML = h+'</div>';
    } else {
      let h='';
      for(let i=0;i<s.input.length;i++) h+=`<span class="sp-char ${(!s.copy||s.input[i]===s.target[i])?'':'wrong'}">${s.input[i]}</span>`;
      if(s.input.length===0 || s.input.length<s.target.length) h+='<span class="sp-char cursor"> </span>';
      el.innerHTML = h||'<span class="sp-char cursor"> </span>';
    }
  },
  
  kp: (k) => {
    if(State.sp.waiting) return;
    if(k==='⌫'){ State.sp.input=State.sp.input.slice(0,-1); SpellMode.renderDisp(); if(!State.sp.copy)SpellMode.check(); return; }
    State.sp.input += k; SpellMode.renderDisp();
    if(State.sp.copy){
      if(State.sp.input === State.sp.target){
        if(State.sp.parts && State.sp.phase===0){
          State.sp.phase=1; State.sp.target=State.sp.parts[1]; State.sp.input=''; State.sp.copy=false;
          document.getElementById('sp-copy-hint').style.display='none';
          document.getElementById('sp-feedback').textContent='次は前置詞を入力してください'; document.getElementById('sp-feedback').className='sp-feedback ng';
          document.getElementById('sp-skip-btn').classList.remove('hidden'); SpellMode.renderDisp();
        } else {
          document.getElementById('sp-feedback').textContent='✓ 写せました！次へ…'; document.getElementById('sp-feedback').className='sp-feedback ok';
          State.sp.waiting=true; setTimeout(SpellMode.next,800);
        }
      }
      return;
    }
    SpellMode.check();
  },
  
  check: () => {
    const s = State.sp; if(s.input.length < s.target.length) return;
    if(s.input === s.target){
      if(s.parts && s.phase===0){
        s.phase=1; s.target=s.parts[1]; s.input=''; s.copy=false;
        document.getElementById('sp-feedback').textContent=`✓ ${s.parts[0]}！次は前置詞`; document.getElementById('sp-feedback').className='sp-feedback ok';
        document.getElementById('sp-skip-btn').classList.remove('hidden'); SpellMode.renderDisp();
      } else {
        if(s.allCorrect){
          State.score++; State.streak++;
          document.getElementById('sp-score-lbl').textContent = `正解 ${State.score}`;
          document.getElementById('sp-streak').textContent = State.streak;
          document.getElementById('sp-feedback').textContent='✓ 正解！'; document.getElementById('sp-feedback').className='sp-feedback ok';
          const sd=Store.load(Store.SP_KEY), w=State.deck[State.cur]; if(!sd[w.word])sd[w.word]={correct:0,total:0}; sd[w.word].correct++; sd[w.word].total++; Store.save(Store.SP_KEY, sd);
        } else {
          document.getElementById('sp-feedback').textContent='✓ 写せました！'; document.getElementById('sp-feedback').className='sp-feedback ok';
        }
        s.waiting=true; setTimeout(SpellMode.next, 700);
      }
    } else {
      s.allCorrect = false; State.streak = 0; document.getElementById('sp-streak').textContent = '0';
      const sd=Store.load(Store.SP_KEY), w=State.deck[State.cur]; if(!sd[w.word])sd[w.word]={correct:0,total:0}; sd[w.word].total++; Store.save(Store.SP_KEY, sd);
      s.input=''; s.copy=true;
      document.getElementById('sp-copy-hint').style.display='';
      document.getElementById('sp-feedback').textContent = `正解: ${s.parts ? s.parts[s.phase] : w.word} … 写して次へ`;
      document.getElementById('sp-feedback').className = 'sp-feedback ng';
      document.getElementById('sp-skip-btn').classList.add('hidden');
      SpellMode.renderDisp();
    }
  },
  
  skip: () => {
    if(State.sp.copy) return;
    State.sp.allCorrect = false; State.streak = 0; document.getElementById('sp-streak').textContent = '0';
    const sd=Store.load(Store.SP_KEY), w=State.deck[State.cur]; if(!sd[w.word])sd[w.word]={correct:0,total:0}; sd[w.word].total++; Store.save(Store.SP_KEY, sd);
    State.sp.input=''; State.sp.copy=true;
    document.getElementById('sp-copy-hint').style.display=''; document.getElementById('sp-copy-hint').textContent='答えを確認 — 正しいスペルを写してください';
    document.getElementById('sp-feedback').textContent = `正解: ${State.sp.parts ? State.sp.parts[State.sp.phase] : w.word}`;
    document.getElementById('sp-feedback').className = 'sp-feedback ng';
    document.getElementById('sp-skip-btn').classList.add('hidden'); SpellMode.renderDisp();
  },
  
  next: () => {
    State.cur++;
    if(State.cur >= State.deck.length){ UI.showFinish(State.deck.length, State.score, State.streak, ()=>SpellMode.start(State.mode), 'sp-footer', 'sp-main'); return; }
    SpellMode.renderCard();
  }
};