/* ═══════════════════════════════════════════════════════════════
   SHARED ERUDA SIDEBAR  v4
   – Tab-close confirmation ON by default
   – Persists across main, godmode, proxy pages
   ═══════════════════════════════════════════════════════════════ */
(function () {
  const depth = (window.location.pathname.match(/\//g) || []).length;
  const root  = depth >= 2 ? '../' : '';

  /* ══ TAB-CLOSE CONFIRMATION — ON immediately, before anything else ══ */
  var _lockHandler = function(e){ e.preventDefault(); e.returnValue = ''; return ''; };
  window.addEventListener('beforeunload', _lockHandler);
  var _locked = true;

  /* ══ CSS ══ */
  const style = document.createElement('style');
  style.textContent = `
  #eruda-sidebar {
    position:fixed; top:50%; left:0;
    transform:translateY(-50%) translateX(calc(-100% + 14px));
    width:232px; background:#1e272e;
    border-radius:0 12px 12px 0;
    box-shadow:4px 0 24px rgba(0,0,0,.6);
    z-index:2147483647;
    transition:transform .28s cubic-bezier(.4,0,.2,1);
    display:flex; flex-direction:row; overflow:visible;
    font-family:'Segoe UI',system-ui,sans-serif;
  }
  #eruda-sidebar:hover,#eruda-sidebar:focus-within {
    transform:translateY(-50%) translateX(0);
  }
  #esb-handle {
    width:14px; min-height:110px; background:#007bff;
    border-radius:0 6px 6px 0; display:flex;
    align-items:center; justify-content:center;
    writing-mode:vertical-rl; font-size:9px; color:#fff;
    letter-spacing:1px; text-transform:uppercase;
    cursor:pointer; flex-shrink:0; order:999; user-select:none;
  }
  #esb-inner {
    padding:16px 13px; display:flex; flex-direction:column;
    gap:9px; width:100%; overflow-y:auto; max-height:92vh;
    scrollbar-width:thin; scrollbar-color:#2f3542 transparent;
  }
  #esb-inner h3 {
    margin:4px 0 2px; color:#ecf0f1; font-size:11px;
    text-transform:uppercase; letter-spacing:1px;
    border-bottom:1px solid #2f3542; padding-bottom:5px;
  }
  .esb-btn {
    width:100%; padding:9px 11px; font-size:12px; font-weight:600;
    border:none; border-radius:7px; cursor:pointer; text-align:left;
    transition:filter .15s,transform .1s; background:#2f3542;
    color:#ecf0f1; text-decoration:none; display:block; box-sizing:border-box;
    line-height:1.3;
  }
  .esb-btn:hover  { filter:brightness(1.25); transform:translateX(2px); }
  .esb-btn:active { transform:translateX(0) scale(.97); }
  .esb-btn.blue   { background:#007bff; color:#fff; }
  .esb-btn.teal   { background:#00b894; color:#fff; }
  .esb-btn.orange { background:#e67e22; color:#fff; }
  .esb-btn.purple { background:#8e44ad; color:#fff; }
  .esb-btn.red    { background:#e74c3c; color:#fff; }
  .esb-btn.green  { background:#27ae60; color:#fff; }
  .esb-btn.godmode {
    background:linear-gradient(135deg,#003b00,#005500);
    border:1px solid #00ff41; color:#00ff41;
    text-shadow:0 0 8px #00ff41; letter-spacing:1px;
  }
  .esb-btn.proxy {
    background:linear-gradient(135deg,#0a0a2e,#1a1a4e);
    border:1px solid #6c63ff; color:#a29bfe; letter-spacing:1px;
  }
  .esb-btn.claude {
    background:linear-gradient(135deg,#2a1408,#3a1a0e);
    border:1px solid #D97757; color:#E89170;
    text-shadow:0 0 6px rgba(232,145,112,0.4); letter-spacing:1px;
  }
  .esb-btn.home { background:#2c3e50; border:1px solid #7f8c8d; color:#bdc3c7; }
  #esb-tab-select {
    width:100%; padding:8px 10px; border-radius:6px; border:none;
    background:#2f3542; color:#ecf0f1; font-size:12px; cursor:pointer;
  }
  `;
  document.head.appendChild(style);

  /* ══ HTML ══ */
  const nav = document.createElement('nav');
  nav.id = 'eruda-sidebar';
  nav.setAttribute('aria-label','Tools sidebar');
  nav.innerHTML = `
    <div id="esb-inner">
      <h3>🛠 Tools</h3>
      <a  class="esb-btn home"   href="${root}index.html">🏠 Main Page</a>
      <a  class="esb-btn"        href="javascript:void(0)" id="esb-eruda-btn">🔧 Load Eruda</a>
      <button class="esb-btn purple" id="esb-piano-btn">🎹 Chromatic Piano</button>
      <button class="esb-btn teal"   id="esb-url-btn">🌐 URL Frame</button>
      <button class="esb-btn orange" id="esb-flood-btn">📚 Flood History</button>
      <button class="esb-btn red"    id="esb-lock-btn">🔓 Disable Close Confirm</button>
      <a  class="esb-btn godmode"    href="${root}godmode/index.html">⛓️‍💥 G0DM0D3 AI</a>
      <a  class="esb-btn proxy"      href="${root}proxy/index.html">🌀 Web Proxy</a>
      <a  class="esb-btn claude"     href="${root}claude-cli/index.html">🧠 Claude CLI</a>

      <h3>🔔 Notifications</h3>
      <button class="esb-btn blue" id="esb-notify-btn">Send Notifications</button>

      <h3>🏷 Tab Disguise</h3>
      <select id="esb-tab-select" aria-label="Choose tab preset">
        <option value="">— pick a preset —</option>
        <option value="0">🔵 Google Docs</option>
        <option value="1">🟢 Google Classroom</option>
        <option value="2">🔴 Google Slides</option>
        <option value="3">🟡 Google Sheets</option>
        <option value="4">⚫ Google Drive</option>
      </select>
    </div>
    <div id="esb-handle" aria-hidden="true">⟩ TOOLS</div>
  `;
  document.body.appendChild(nav);

  /* ══ LOCK BUTTON — starts showing "Disable" since lock is ON ══ */
  var lockBtn = document.getElementById('esb-lock-btn');
  lockBtn.style.background = '#e74c3c';

  lockBtn.addEventListener('click', function(){
    _locked = !_locked;
    if(_locked){
      window.addEventListener('beforeunload', _lockHandler);
      this.textContent = '🔓 Disable Close Confirm';
      this.style.background = '#e74c3c';
      this.classList.remove('green');
    } else {
      window.removeEventListener('beforeunload', _lockHandler);
      this.textContent = '🔒 Enable Close Confirm';
      this.style.background = '#27ae60';
    }
  });

  /* ══ ERUDA ══ */
  document.getElementById('esb-eruda-btn').addEventListener('click', function(){
    if(window.eruda){ eruda.init(); return; }
    var s = document.createElement('script');
    s.src = 'https://cdn.jsdelivr.net/npm/eruda';
    s.onload = function(){ eruda.init(); };
    document.body.appendChild(s);
  });

  /* ══ FLOOD HISTORY ══ */
  document.getElementById('esb-flood-btn').addEventListener('click', function(){
    var url = prompt('URL to flood into history:');
    if(!url) return;
    var n = parseInt(prompt('How many times?'), 10);
    if(isNaN(n)||n<=0){ alert('Enter a valid number > 0'); return; }
    for(var i=1;i<=n;i++){
      try{ history.pushState(null,'',url+(url.includes('?')? '&':'?')+'h='+i); }
      catch(e){ alert('Security Error: URL must share this page\'s domain.'); return; }
    }
    alert('Done! '+url+' pushed '+n+' times.');
  });

  /* ══ NOTIFICATIONS ══ */
  document.getElementById('esb-notify-btn').addEventListener('click', function(){
    var n = parseInt(prompt('How many notifications?'), 10);
    if(isNaN(n)||n<=0){ alert('Enter a valid number > 0'); return; }
    Notification.requestPermission().then(function(p){
      if(p!=='granted'){ alert('Notifications denied.'); return; }
      for(var i=1;i<=n;i++){
        (function(i){ setTimeout(function(){
          new Notification('Notification '+i+' of '+n,{body:'Sent from your page!'});
        },i*800); })(i);
      }
    });
  });

  /* ══ TAB DISGUISE ══ */
  var TAB_PRESETS=[
    {title:'Document - Google Docs',       favicon:'https://ssl.gstatic.com/docs/documents/images/kix-favicon7.ico'},
    {title:'Classes - Google Classroom',   favicon:'https://ssl.gstatic.com/classroom/favicon.png'},
    {title:'Presentation - Google Slides', favicon:'https://ssl.gstatic.com/docs/presentations/images/favicon5.ico'},
    {title:'Spreadsheet - Google Sheets',  favicon:'https://ssl.gstatic.com/docs/spreadsheets/images/favicon3.ico'},
    {title:'My Drive - Google Drive',      favicon:'https://ssl.gstatic.com/images/branding/product/1x/drive_2020q4_32dp.png'}
  ];
  document.getElementById('esb-tab-select').addEventListener('change', function(){
    var p=TAB_PRESETS[this.value]; if(!p) return;
    document.title=p.title;
    var link=document.querySelector("link[rel~='icon']");
    if(!link){link=document.createElement('link');link.rel='icon';document.head.appendChild(link);}
    link.href=p.favicon;
  });

  /* ══ URL FRAME ══ */
  document.getElementById('esb-url-btn').addEventListener('click', function(){
    var url=prompt('Enter the URL to load:','https://example.com');
    if(!url) return;
    if(!/^https?:\/\//i.test(url)) url='https://'+url;
    var iframe=document.createElement('iframe');
    iframe.src=url;
    Object.assign(iframe.style,{position:'fixed',top:'0',left:'0',border:'4px solid Aquamarine',width:'100%',height:'100%',zIndex:'2147483640'});
    var btn=document.createElement('button');
    btn.textContent='✕ Close Frame';
    Object.assign(btn.style,{position:'fixed',top:'10px',right:'10px',fontSize:'13px',color:'#333',backgroundColor:'Aquamarine',border:'none',borderRadius:'6px',padding:'6px 12px',cursor:'pointer',zIndex:'2147483641',fontWeight:'bold'});
    btn.addEventListener('click',function(){iframe.remove();btn.remove();});
    document.body.appendChild(iframe);
    document.body.appendChild(btn);
  });

  /* ══ CHROMATIC PIANO ══ */
  document.getElementById('esb-piano-btn').addEventListener('click', function(){
    if(document.getElementById('p-ui')) return;
    var piano={
      css:document.createElement('style'),
      ui:document.createElement('div'),
      keyboard:document.createElement('div'),
      audio:new (window.AudioContext||window.webkitAudioContext)(),
      keymap:[
        {key:'`',hz:220.00,b:0},{key:'1',hz:233.08,b:1},{key:'q',hz:246.94,b:0},
        {key:'2',hz:261.63,b:0},{key:'w',hz:277.18,b:1},{key:'3',hz:293.66,b:0},
        {key:'e',hz:311.13,b:1},{key:'r',hz:329.63,b:0},{key:'5',hz:349.23,b:0},
        {key:'t',hz:369.99,b:1},{key:'6',hz:392.00,b:0},{key:'y',hz:415.30,b:1},
        {key:'u',hz:440.00,b:0},{key:'8',hz:466.16,b:1},{key:'i',hz:493.88,b:0},
        {key:'9',hz:523.25,b:0},{key:'o',hz:554.37,b:1},{key:'0',hz:587.33,b:0},
        {key:'p',hz:622.25,b:1},{key:'[',hz:659.25,b:0},{key:'=',hz:698.46,b:0},
        {key:']',hz:739.99,b:1},{key:'\\',hz:783.99,b:0},{key:'a',hz:830.61,b:1},
        {key:'z',hz:880.00,b:0},{key:'s',hz:932.33,b:1},{key:'x',hz:987.77,b:0},
        {key:'d',hz:1046.50,b:0}
      ].map(function(k){k.dom=document.createElement('div');k.pressed=0;return k;})
    };
    piano.css.textContent='#p-ui{position:fixed;bottom:20px;left:50%;transform:translateX(-50%);background:#1e272e;padding:15px;border-radius:12px;box-shadow:0 15px 35px rgba(0,0,0,.7);z-index:2147483646;font-family:sans-serif;width:600px;text-align:center}#p-keys{display:flex;position:relative;background:#050709;padding:8px 4px;border-radius:6px;margin-top:10px;height:130px}.pk{flex:1;height:110px;background:#fff;margin:1px;border-radius:0 0 4px 4px;cursor:pointer;display:flex;align-items:flex-end;justify-content:center;font-size:11px;font-weight:bold;color:#57606f;user-select:none;transition:background .05s}.pk.black{background:#2f3542;color:#fff;height:70px;z-index:2}.pk.pressed{background:#ff4757!important;color:#fff!important}.p-banner{display:flex;justify-content:space-between;color:#fff;padding:0 5px;align-items:center}.p-btn{background:#ffa502;border:none;color:#000;font-weight:bold;padding:6px 14px;border-radius:4px;cursor:pointer;font-size:13px}';
    document.head.appendChild(piano.css);
    piano.ui.id='p-ui';
    piano.ui.innerHTML='<div class="p-banner"><span>🎼 Chromatic Piano</span><button class="p-btn" style="background:#e74c3c;color:#fff" id="p-close">✕</button></div>';
    piano.keyboard.id='p-keys';
    function startNote(item){if(item.pressed)return;if(piano.audio.state==='suspended')piano.audio.resume();item.pressed=true;item.dom.classList.add('pressed');var o=piano.audio.createOscillator(),g=piano.audio.createGain();o.type='triangle';o.frequency.setValueAtTime(item.hz,piano.audio.currentTime);g.gain.setValueAtTime(0.2,piano.audio.currentTime);o.connect(g);g.connect(piano.audio.destination);o.start();item.osc=o;item.gain=g;}
    function endNote(item){if(!item.pressed)return;item.pressed=false;item.dom.classList.remove('pressed');if(item.osc){item.gain.gain.exponentialRampToValueAtTime(0.001,piano.audio.currentTime+0.08);item.osc.stop(piano.audio.currentTime+0.08);}}
    piano.keymap.forEach(function(k){k.dom.className='pk'+(k.b?' black':'');k.dom.textContent=k.key;piano.keyboard.appendChild(k.dom);k.dom.addEventListener('mousedown',function(){startNote(k);});k.dom.addEventListener('mouseup',function(){endNote(k);});k.dom.addEventListener('mouseleave',function(){endNote(k);});});
    piano.ui.appendChild(piano.keyboard);
    document.body.appendChild(piano.ui);
    document.getElementById('p-close').addEventListener('click',function(){piano.ui.remove();piano.css.remove();});
    window.addEventListener('keydown',function(e){var m=piano.keymap.find(function(k){return k.key.toLowerCase()===e.key.toLowerCase();});if(m)startNote(m);});
    window.addEventListener('keyup',function(e){var m=piano.keymap.find(function(k){return k.key.toLowerCase()===e.key.toLowerCase();});if(m)endNote(m);});
  });

})();
