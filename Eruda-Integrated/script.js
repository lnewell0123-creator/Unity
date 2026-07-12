// ─── AI GEMINI HANDLER ───────────────────────────────────────────────────────
const script = document.createElement('script');
script.src = "https://esm.run";
script.type = "text/javascript";
document.head.appendChild(script);

// PASTE YOUR KEY INSIDE THE QUOTES
const API_KEY = "AIzaSyCaxtPt6gbh5ns2JVwoiejObgzDxXUcUJ0";

script.onload = function() {
  const btn = document.getElementById('ai-button');
  const input = document.getElementById('ai-input');

  // Fix #3 — trigger on button click OR Enter key
  btn.addEventListener('click', handleAiRequest);
  input.addEventListener('keydown', function(e) {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAiRequest();
    }
  });
};

async function handleAiRequest() {
  const inputField = document.getElementById('ai-input');
  const button    = document.getElementById('ai-button');
  const responseBox = document.getElementById('ai-response');

  const prompt = inputField.value.trim();
  if (!prompt) { alert('Please enter a prompt first!'); return; }

  button.disabled   = true;
  button.innerText  = 'Thinking...';
  responseBox.innerText = 'Loading response...';

  try {
    const { GoogleGenAI } = window["https://esm.run"];
    const ai = new GoogleGenAI({ apiKey: API_KEY });
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });
    responseBox.innerText = response.text;
  } catch (error) {
    console.error('Error details:', error);
    responseBox.innerText = 'Error connecting to Gemini. Check your API key!';
  } finally {
    button.disabled  = false;
    button.innerText = 'Ask AI';
  }
}


// ─── FEATURE 1: WEB NOTIFICATIONS ────────────────────────────────────────────
function triggerNotifications() {
  const countStr = prompt('How many times would you like to be notified?');
  const count = parseInt(countStr, 10);
  if (isNaN(count) || count <= 0) { alert('Please enter a valid number greater than 0.'); return; }

  Notification.requestPermission().then(permission => {
    if (permission !== 'granted') {
      alert('Notification permission was denied. Please allow notifications in your browser settings.');
      return;
    }
    for (let i = 1; i <= count; i++) {
      setTimeout(() => {
        new Notification(`Notification ${i} of ${count}`, {
          body: `This is notification #${i}. Sent from your page!`,
          icon: getFaviconUrl()   // reuse current favicon if set
        });
      }, i * 800);   // stagger 800ms apart so Chrome doesn't collapse them
    }
  });
}

function getFaviconUrl() {
  const link = document.querySelector("link[rel~='icon']");
  return link ? link.href : '';
}


// ─── FEATURE 2: TAB CUSTOMISATION (Title + Favicon) ──────────────────────────
const TAB_PRESETS = [
  {
    label: '🔵 Google Docs',
    title: 'Document - Google Docs',
    favicon: 'https://ssl.gstatic.com/docs/documents/images/kix-favicon7.ico'
  },
  {
    label: '🟢 Google Classroom',
    title: 'Classes - Google Classroom',
    favicon: 'https://ssl.gstatic.com/classroom/favicon.png'
  },
  {
    label: '🔴 Google Slides',
    title: 'Presentation - Google Slides',
    favicon: 'https://ssl.gstatic.com/docs/presentations/images/favicon5.ico'
  },
  {
    label: '🟡 Google Sheets',
    title: 'Spreadsheet - Google Sheets',
    favicon: 'https://ssl.gstatic.com/docs/spreadsheets/images/favicon3.ico'
  },
  {
    label: '⚫ Google Drive',
    title: 'My Drive - Google Drive',
    favicon: 'https://ssl.gstatic.com/images/branding/product/1x/drive_2020q4_32dp.png'
  }
];

function applyTabPreset(index) {
  const preset = TAB_PRESETS[index];
  if (!preset) return;

  // Change title
  document.title = preset.title;

  // Change (or create) favicon
  let link = document.querySelector("link[rel~='icon']");
  if (!link) {
    link = document.createElement('link');
    link.rel = 'icon';
    document.head.appendChild(link);
  }
  link.href = preset.favicon;
}


// ─── FEATURE 5: PANIC REDIRECT KEY ───────────────────────────────────────────
let panicKey   = localStorage.getItem('panicKey')   || '';
let panicUrl   = localStorage.getItem('panicUrl')   || 'https://classroom.google.com';

// Show current settings in the UI once DOM is ready
document.addEventListener('DOMContentLoaded', syncPanicUI);

function syncPanicUI() {
  const keyDisplay = document.getElementById('panic-key-display');
  const urlDisplay = document.getElementById('panic-url-display');
  if (keyDisplay) keyDisplay.textContent = panicKey || '(none)';
  if (urlDisplay) urlDisplay.textContent = panicUrl;
}

function savePanicSettings() {
  const keyInput = document.getElementById('panic-key-input');
  const urlInput = document.getElementById('panic-url-input');
  const newKey   = keyInput ? keyInput.value.trim() : '';
  const newUrl   = urlInput ? urlInput.value.trim() : '';

  if (newKey) { panicKey = newKey; localStorage.setItem('panicKey', panicKey); }
  if (newUrl) { panicUrl = newUrl; localStorage.setItem('panicUrl', panicUrl); }

  syncPanicUI();
  alert(`Panic key set to: "${panicKey}"\nRedirect URL: ${panicUrl}`);
}

// Global keydown listener — fires the panic redirect from anywhere on the page
document.addEventListener('keydown', function(e) {
  // Skip if typing inside an input/textarea to avoid false triggers
  const tag = document.activeElement.tagName;
  if ((tag === 'INPUT' || tag === 'TEXTAREA') && e.key !== 'Escape') return;

  if (panicKey && e.key === panicKey) {
    window.location.href = panicUrl;
  }
});
