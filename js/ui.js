/* ===== STATS ===== */
const Stats = {
  setFilter: (f, btn) => { State.filter = f; document.querySelectorAll('.sf-btn').forEach(b=>b.classList.remove('active')); btn.classList.add('active'); Stats.render(); },
  render: () => {
    const isPrep = State.tab==='prep', isSpell = State.tab==='spell';
    document.querySelector('.sf-important').style.display = (isPrep||isSpell)?'none':'';
    document.querySelector('.sf-unstudied').style.display = isPrep?'none':'';
    
    if(isPrep) Stats.renderPrep(); else if(isSpell) Stats.renderSpell(); else Stats.renderWord();
  },
  
  renderWord: () => {
    const d=Store.load(Store.LS_KEY), td=Utils.today();
    const pool = ALL_WORDS;
    const studied = pool.filter(w=>Store.getWD(d,w.word).total>0);
    
    document.getElementById('sv-studied').textContent = studied.length;
    document.getElementById('sv-acc').textContent = studied.length>0 ? Math.round(studied.reduce((s,w)=>s+Store.getWD(d,w.word).correct,0)/studied.reduce((s,w)=>s+Store.getWD(d,w.word).total,0)*100)+'%' : '—';
    document.getElementById('sv-today').textContent = Object.values(d).reduce((s,wd)=>s+(wd.lastSeen===td?wd.correct:0),0);
    
    let list = [...pool];
    if(State.filter==='studied') list = list.filter(w=>Store.getWD(d,w.word).total>0);
    else if(State.filter==='weak') list = list.filter(w=>{const wd=Store.getWD(d,w.word);return wd.total>0&&wd.correct/wd.total<0.5;});
    else if(State.filter==='important') list = list.filter(w=>w.important);
    else if(State.filter==='unstudied') list = list.filter(w=>Store.getWD(d,w.word).total===0);
    
    list.sort((a,b)=>{ const wa=Store.getWD(d,a.word), wb=Store.getWD(d,b.word); return (wa.total>0?wa.correct/wa.total:1.1) - (wb.total>0?wb.correct/wb.total:1.1); });
    
    const el = document.getElementById('word-list');
    if(!list.length){ el.innerHTML='<div class="empty-state">該当する単語がありません</div>'; return; }
    
    el.innerHTML = list.map(w => {
      const wd=Store.getWD(d,w.word), pct = wd.total>0 ? Math.round(wd.correct/wd.total*100) : null;
      const col = pct===null ? 'var(--border)' : pct>=70 ? 'var(--ok)' : pct>=40 ? '#e0a020' : 'var(--ng)';
      return `<div class="word-row">
        <span class="wr-article art-${w.art||'none'}">${w.art||'—'}</span>${w.important?'<span class="wr-imp">⭐</span>':''}
        <span class="wr-word">${w.word}</span><span class="wr-trans">${w.trans}</span>
        <div class="wr-bar-wrap"><div class="wr-bar-track"><div class="wr-bar-fill" style="width:${pct??0}%;background:${col}"></div></div><div class="wr-pct">${pct!==null?pct+'%':'未学習'}</div></div></div>`;
    }).join('');
  },
  
  renderSpell: () => {
    const sd=Store.load(Store.SP_KEY), td=Utils.today();
    const studied = ALL_SPELL.filter(w=>sd[w.word]&&sd[w.word].total>0);
    document.getElementById('sv-studied').textContent = `${studied.length}/${ALL_SPELL.length}`;
    document.getElementById('sv-acc').textContent = studied.length>0 ? Math.round(studied.reduce((s,w)=>s+sd[w.word].correct,0)/studied.reduce((s,w)=>s+sd[w.word].total,0)*100)+'%' : '—';
    document.getElementById('sv-today').textContent = Object.values(sd).reduce((s,wd)=>s+(wd.lastSeen===td?wd.correct:0),0);
    
    let list = (State.filter==='weak') ? studied.filter(w=>sd[w.word].correct/sd[w.word].total<0.5) : (State.filter==='unstudied') ? ALL_SPELL.filter(w=>!sd[w.word]||sd[w.word].total===0) : studied;
    list.sort((a,b)=>{ const wa=sd[a.word]||{correct:0,total:0}, wb=sd[b.word]||{correct:0,total:0}; return (wa.total>0?wa.correct/wa.total:1.1) - (wb.total>0?wb.correct/wb.total:1.1); });
    
    const el = document.getElementById('word-list');
    if(!list.length){ el.innerHTML=`<div class="empty-state">${State.filter==='unstudied'?'すべて学習済みです！':'記録がありません'}</div>`; return; }
    
    el.innerHTML = list.map(w => {
      const wd=sd[w.word]||{correct:0,total:0}, pct = wd.total>0 ? Math.round(wd.correct/wd.total*100) : null;
      const col = pct===null ? 'var(--border)' : pct>=70 ? 'var(--ok)' : pct>=40 ? '#e0a020' : 'var(--ng)';
      return `<div class="word-row">
        <span class="wr-article art-none" style="font-size:9px;padding:1px 4px;min-width:40px;text-align:center;">${w.type||'—'}</span>
        <span class="wr-word">${w.word}</span><span class="wr-trans">${w.trans}</span>
        <div class="wr-bar-wrap"><div class="wr-bar-track"><div class="wr-bar-fill" style="width:${pct??0}%;background:${col}"></div></div><div class="wr-pct">${pct!==null?pct+'%':'未学習'}</div></div></div>`;
    }).join('');
  },
  
  renderPrep: () => {
    const pd=Store.load(Store.PR_KEY), td=Utils.today();
    const studied = PREPOSITIONS.filter(w=>pd[w.word]&&pd[w.word].total>0);
    document.getElementById('sv-studied').textContent = `${studied.length}/${PREPOSITIONS.length}`;
    document.getElementById('sv-acc').textContent = studied.length>0 ? Math.round(studied.reduce((s,w)=>s+pd[w.word].correct,0)/studied.reduce((s,w)=>s+pd[w.word].total,0)*100)+'%' : '—';
    document.getElementById('sv-today').textContent = Object.values(pd).reduce((s,wd)=>s+(wd.lastSeen===td?wd.correct:0),0);
    
    let list = [...PREPOSITIONS];
    if(State.filter==='studied') list = list.filter(w=>pd[w.word]&&pd[w.word].total>0);
    else if(State.filter==='weak') list = list.filter(w=>pd[w.word]&&pd[w.word].total>0&&pd[w.word].correct/pd[w.word].total<0.5);
    
    const caseOrder = {'2格':0,'3格':1,'4格':2,'3・4格':3};
    list.sort((a,b)=>{ const co=(caseOrder[a.case]??9)-(caseOrder[b.case]??9); if(co!==0)return co; const wa=pd[a.word]||{correct:0,total:0}, wb=pd[b.word]||{correct:0,total:0}; return (wa.total>0?wa.correct/wa.total:1.1) - (wb.total>0?wb.correct/wb.total:1.1); });
    
    const el = document.getElementById('word-list');
    if(!list.length){ el.innerHTML='<div class="empty-state">該当する前置詞がありません</div>'; return; }
    
    let lastCase = '';
    el.innerHTML = list.map(w => {
      const wd=pd[w.word]||{correct:0,total:0}, pct = wd.total>0 ? Math.round(wd.correct/wd.total*100) : null;
      const col = pct===null ? 'var(--border)' : pct>=70 ? 'var(--ok)' : pct>=40 ? '#e0a020' : 'var(--ng)';
      let header = '';
      if(w.case!==lastCase){ lastCase=w.case; header=`<div style="font-size:10px;letter-spacing:0.08em;text-transform:uppercase;color:var(--text3);padding:0.6rem 0 0.2rem;border-top:1px solid var(--border);margin-top:0.3rem">${w.case==='3・4格'?'3格・4格支配（場所 / 方向）':w.case+'支配'}</div>`; }
      return `${header}<div class="word-row">
        <span class="wr-article prep-btn ${PrepMode.CASE_CLS[w.case]}" style="font-size:10px;padding:2px 6px;border-radius:6px;">${w.case}</span>
        <span class="wr-word">${w.word}</span><span class="wr-trans">${w.trans}</span>
        <div class="wr-bar-wrap"><div class="wr-bar-track"><div class="wr-bar-fill" style="width:${pct??0}%;background:${col}"></div></div><div class="wr-pct">${pct!==null?pct+'%':'未学習'}</div></div></div>`;
    }).join('');
  }
};

/* ===== UI LOGIC ===== */
const UI = {
  mc: (icon,em,title,sub,action,badge='') => `<div class="menu-card" onclick="${action}"><div class="menu-card-inner"><div class="menu-icon ${icon}">${em}</div><div class="menu-card-text"><h3>${title}</h3><p>${sub}</p>${badge}</div><div class="menu-arrow">›</div></div></div>`,
  
  switchTab: (t) => {
    State.tab = t;
    State.subMenu = null; // タブ切り替え時にサブメニューをリセット
    ['gender','spell','prep'].forEach(x => document.getElementById('tab-'+x).classList.toggle('active',x===t));
    UI.updateStats(); UI.renderMenu();
  },
  
  setSubMenu: (m) => {
    State.subMenu = m;
    UI.renderMenu();
  },
  
  updateStats: () => {
    const d=Store.load(Store.LS_KEY), sd=Store.load(Store.SP_KEY), pd=Store.load(Store.PR_KEY), td=Utils.today(), t=State.tab;
    const tog = document.getElementById('gender-toggle-area');
    if(tog){ tog.style.display = t==='gender'?'':'none'; const cb=document.getElementById('tg-trans'); if(cb)cb.checked=Store.getShowTrans(); }
    
    let s1,s2,s3, l1='学習済み', l2='正答率', l3='今日の正解';
    if(t==='prep'){
      s1 = PREPOSITIONS.filter(w=>pd[w.word]&&pd[w.word].total>0).length;
      let c=0, q=0; PREPOSITIONS.forEach(w=>{if(pd[w.word]){c+=pd[w.word].correct;q+=pd[w.word].total;}});
      s2 = q>0?Math.round(c/q*100)+'%':'—';
      s3 = Object.values(pd).reduce((a,wd)=>a+(wd.lastSeen===td?wd.correct:0),0);
    } else if(t==='spell'){
      s1 = ALL_SPELL.filter(w=>sd[w.word]&&sd[w.word].total>0).length;
      let c=0, q=0; ALL_SPELL.forEach(w=>{if(sd[w.word]){c+=sd[w.word].correct;q+=sd[w.word].total;}});
      s2 = q>0?Math.round(c/q*100)+'%':'—';
      s3 = Object.values(sd).reduce((a,wd)=>a+(wd.lastSeen===td?wd.correct:0),0);
    } else {
      const pool = ALL_WORDS;
      const studied = pool.filter(w=>Store.getWD(d,w.word).total>0);
      s1 = studied.length;
      s2 = studied.reduce((a,w)=>a+Store.getWD(d,w.word).total,0)>0 ? Math.round(studied.reduce((a,w)=>a+Store.getWD(d,w.word).correct,0)/studied.reduce((a,w)=>a+Store.getWD(d,w.word).total,0)*100)+'%' : '—';
      s3 = Object.values(d).reduce((a,wd)=>a+(wd.lastSeen===td?wd.correct:0),0);
    }
    document.getElementById('m-studied').textContent=s1; document.getElementById('m-today-ok').textContent=s2; document.getElementById('m-acc').textContent=s3;
    ['m-lbl-studied','m-lbl-today','m-lbl-acc'].forEach((id,i) => { const el=document.getElementById(id); if(el) el.textContent=[l1,l2,l3][i]; });
  },
  
  renderMenu: () => {
    const t = State.tab, d = Store.load(Store.LS_KEY); let html = '';
    const backBtn = `<div onclick="UI.setSubMenu(null)" style="cursor:pointer;font-size:22px;line-height:1;padding:0 8px 0 0;margin-top:-2px;color:var(--text3);">‹</div>`;
    
    /* -------------------------------------
       各モードのメニュー作成
    --------------------------------------*/
    if(t==='spell'){
      const sd=Store.load(Store.SP_KEY), weakSp = ALL_SPELL.filter(w=>{const s=sd[w.word];return s&&s.total>=2&&s.correct/s.total<0.5;}).length;
      
      if (!State.subMenu) {
        html += `<div class="menu-section"><div class="menu-section-title">スペリングモード</div>`
          +UI.mc('spell-icon','🔠','総合・ランダム','全単語や出題数指定での練習',"UI.setSubMenu('general')")
          +UI.mc('spell-icon','🏷️','品詞・テーマ別','助動詞、不規則動詞、接続詞など',"UI.setSubMenu('theme')")
          +UI.mc('weak-icon','📉','復習と記録','苦手特訓と成績表',"UI.setSubMenu('review')", weakSp>0?`<span class="badge badge-warn">${weakSp} 語</span>`:'')
          +`</div>`;
      } else if (State.subMenu === 'general') {
        html += `<div class="menu-section"><div class="menu-section-title" style="display:flex;align-items:center;">${backBtn} 総合・ランダム</div>`
          +UI.mc('spell-icon','✏️','全単語',`名詞・動詞・接続詞など全${ALL_SPELL.length}語`,"SpellMode.start('all')")
          +UI.mc('spell-icon','🔠','20語ランダム','短時間練習',"SpellMode.start('random20')")
          +UI.mc('spell-icon','💯','100語ランダム','じっくり練習',"SpellMode.start('random100')")
          +`</div>`;
      } else if (State.subMenu === 'theme') {
        html += `<div class="menu-section"><div class="menu-section-title" style="display:flex;align-items:center;">${backBtn} 品詞・テーマ別</div>`
          +UI.mc('spell-icon','⭐','重要語','語彙力トレーニング',"SpellMode.start('important')")
          +UI.mc('spell-icon','🔄','不規則変化動詞','kommen, gehenなどの不規則動詞',"SpellMode.start('irregular')")
          +UI.mc('spell-icon','✂','分離動詞&熟語','動詞+前置詞など',"SpellMode.start('separate')")
          +UI.mc('spell-icon','🗣️','話法の助動詞','dürfen・könnenなど',"SpellMode.start('modal')")
          +UI.mc('spell-icon','🔗','接続詞',`und・weil・dass など接続詞`,"SpellMode.start('conjunctions')")
          +UI.mc('spell-icon','📋','前置詞','nach・und など前置詞',"SpellMode.start('preposition')")
          +UI.mc('spell-icon','📅','時間を表す単語','時期・曜日など',"SpellMode.start('time_words')")
          +UI.mc('spell-icon','🔢','数詞のみ','1〜100の練習',"SpellMode.start('numbers')")
          +`</div>`;
      } else if (State.subMenu === 'review') {
        html += `<div class="menu-section"><div class="menu-section-title" style="display:flex;align-items:center;">${backBtn} 復習と記録</div>`
          +UI.mc('weak-icon','📉','苦手な単語','正答率50%未満を特訓',"SpellMode.start('weak')", weakSp>0?`<span class="badge badge-warn">${weakSp} 語</span>`:'')
          +UI.mc('stats-icon','📊','成績を見る','スペリングの正答率と履歴',"UI.showStats()")
          +`</div>`;
      }
      
    } else if(t==='prep'){
      const pd=Store.load(Store.PR_KEY), weakPr = PREPOSITIONS.filter(w=>{const wd=pd[w.word];return wd&&wd.total>=2&&wd.correct/wd.total<0.5;}).length;
      html += `<div class="menu-section"><div class="menu-section-title">前置詞モード</div>`
        +UI.mc('all-icon','📋','全前置詞',`2格・3格・4格・3/4格支配 全${PREPOSITIONS.length}語`,"PrepMode.start('all')")
        +UI.mc('weak-icon','📉','苦手な前置詞','正答率50%未満を集中特訓',"PrepMode.start('weak')", weakPr>0?`<span class="badge badge-warn">${weakPr} 語</span>`:'')
        +UI.mc('stats-icon','📊','成績を見る','前置詞ごとの正答率',"UI.showStats()")+'</div>';
    } else {
      const pool = ALL_WORDS.filter(w=>!w.plural&&w.art);
      const td=Utils.today(), due = pool.filter(w=>{const wd=Store.getWD(d,w.word);return !wd.lastSeen||wd.nextReview<=td;});
      const wk = ALL_WORDS.filter(w=>{const wd=Store.getWD(d,w.word);return wd.total>=2&&wd.correct/wd.total<0.5;}).length;
      html += `<div class="menu-section"><div class="menu-section-title">今日</div><div class="menu-card today-card" onclick="CoreMode.start('today')"><div class="menu-card-inner"><div class="menu-icon today-icon">📅</div><div class="menu-card-text"><h3>今日の単語</h3><p>間隔反復・重要語優先</p><span class="badge badge-new">${due.length>0?`本日 ${due.length} 問`:'今日は完了！'}</span></div><div class="menu-arrow">›</div></div></div></div>`
        +`<div class="menu-section"><div class="menu-section-title">復習モード — 冠詞を当てる</div>`
        +UI.mc('all-icon','📚','全単語',`全${pool.length}語をランダムに出題`,"CoreMode.start('all')")
        +UI.mc('imp-icon','⭐','重要語のみ','家族語など優先反復単語',"CoreMode.start('important')",'<span class="badge badge-imp">優先反復</span>')
        +UI.mc('weak-icon','📉','苦手な単語','正答率50%未満を集中特訓',"CoreMode.start('weak')", wk>0?`<span class="badge badge-warn">${wk} 語</span>`:'')
        +'</div><div class="menu-section"><div class="menu-section-title">記録</div>'+UI.mc('stats-icon','📊','成績を見る','単語ごとの正答率と履歴',"UI.showStats()")+'</div>';
    }
    
    /* -------------------------------------
       共通設定セクションの追加
    --------------------------------------*/
    // サブメニュー展開時は画面をスッキリさせるため設定を非表示にする
    if (!State.subMenu) {
      const kb = Store.getKeyboardType();
      const hc = Store.getHighContrast() ? 'checked' : '';
      html += `<div class="menu-section"><div class="menu-section-title">設定</div>`
        + `
        <div class="toggle-row">
          <div><div class="toggle-label">キーボード</div><div class="toggle-sub">スペル入力のレイアウト</div></div>
          <select onchange="Store.updateSetting('keyboard', this.value); UI.updateStats();" style="padding:4px 6px;border-radius:8px;background:var(--bg2);color:var(--text);border:1px solid var(--border);font-family:var(--sans);font-size:12px;outline:none;">
            <option value="qwertz" ${kb==='qwertz'?'selected':''}>QWERTZ (PC風)</option>
            <option value="flick" ${kb==='flick'?'selected':''}>フリック入力</option>
          </select>
        </div>
        <div class="toggle-row">
          <div><div class="toggle-label">ハイコントラスト</div><div class="toggle-sub">画面の視認性を高める</div></div>
          <label class="toggle"><input type="checkbox" ${hc} onchange="Store.updateSetting('highContrast', this.checked); document.body.classList.toggle('high-contrast', this.checked);">
          <div class="toggle-track"></div><div class="toggle-thumb"></div></label>
        </div>
        <div class="toggle-row" style="cursor:pointer;justify-content:center;background:var(--ng-bg);border:1px solid var(--ng);margin-top:10px;" onclick="Store.resetProgress()">
          <div style="color:var(--ng);font-weight:500;font-size:13px;">学習記録をすべて削除</div>
        </div>
        `
        + `</div>`;
    }

    document.getElementById('menu-cards').innerHTML = html;
  },
  
  showScreen: (id) => {
    document.querySelectorAll('.screen').forEach(s=>s.classList.remove('active'));
    document.getElementById(id).classList.add('active');
    if(id==='study'){ document.querySelector('#study .card-area').style.display=''; document.getElementById('choice-area').style.display=''; document.getElementById('study-footer').innerHTML=''; document.getElementById('last-result').className='last-result'; }
    if(id==='prep-screen'){ document.getElementById('prep-card-area').style.display=''; document.getElementById('prep-footer').innerHTML=''; document.getElementById('prep-last-result').className='last-result'; }
  },
  
  goMenu: () => {
    if(State.timer){ clearTimeout(State.timer); State.timer=null; }
    State.evaluating = false;
    if(State.activeDragCleanup){ State.activeDragCleanup(); State.activeDragCleanup=null; }
    UI.showScreen('menu'); UI.updateStats(); UI.renderMenu(); State.filter='all';
  },
  
  showStats: () => { UI.showScreen('stats'); Stats.render(); },
  
  showLR: (ok, ans, sub, elId) => {
    const el = document.getElementById(elId);
    document.getElementById(elId.replace('last-result', 'lr-icon')).textContent = ok?'✓':'✗';
    document.getElementById(elId.replace('last-result', 'lr-answer')).textContent = ans;
    document.getElementById(elId.replace('last-result', 'lr-sub')).textContent = sub||'';
    el.className = `last-result show ${ok?'ok':'ng'}`;
  },
  
  flashCard: (ok) => { const c = document.getElementById('active-card'); c.classList.remove('flash-ok','flash-ng'); void c.offsetWidth; c.classList.add(ok?'flash-ok':'flash-ng'); },
  
  showFinish: (total, score, streak, retryFunc, footerId='study-footer', areaId='.card-area', choicesId='choice-area', extraId=null) => {
    const pct = total>0 ? Math.round(score/total*100) : 0, em = pct>=80?'🎉':pct>=50?'👍':'📚';
    if(areaId.startsWith('.')) document.querySelector(`#${footerId.split('-')[0]} ${areaId}`).style.display='none';
    else if(document.getElementById(areaId)) document.getElementById(areaId).style.display='none';
    if(choicesId && document.getElementById(choicesId)) document.getElementById(choicesId).style.display='none';
    if(extraId && document.getElementById(extraId)) document.getElementById(extraId).style.opacity='0';
    
    window._retryCallback = retryFunc;
    document.getElementById(footerId).innerHTML = `<div class="finish-wrap">
      <div class="finish-title">完了！ ${em}</div><div class="finish-score">${score}<span style="font-size:1.8rem;color:var(--text2)"> / ${total}</span></div>
      <div style="font-size:14px;color:var(--text2)">正解率 ${pct}%</div>
      <div class="finish-breakdown"><div class="fb-item"><div class="fv">${total-score}</div><div class="fl">不正解</div></div><div class="fb-item"><div class="fv">${streak}</div><div class="fl">最終連続</div></div></div>
      <button class="finish-btn" onclick="window._retryCallback()">もう一度</button>
      <button class="finish-btn" onclick="UI.goMenu()" style="margin-top:0">メニューへ</button></div>`;
  }
};

/* ===== APP INIT ===== */
if(Store.getHighContrast()) {
  document.body.classList.add('high-contrast');
}

UI.updateStats();
UI.renderMenu();
