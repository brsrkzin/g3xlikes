const http = require('http');
const https = require('https');

const PORT = process.env.PORT || 3000;

function fmt(n) {
  if (n >= 1000000) return (n/1000000).toFixed(1).replace('.',',') + 'M';
  if (n >= 1000) return (n/1000).toFixed(1).replace('.',',') + 'K';
  return n.toString();
}

const painel = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>G3X Likes</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { 
      background: linear-gradient(135deg, #0033aa 0%, #0d47a1 100%);
      font-family: Arial, sans-serif;
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 20px;
    }
    .container {
      background: white;
      border-radius: 12px;
      padding: 30px;
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
      max-width: 500px;
      width: 100%;
    }
    h1 { color: #0033aa; margin-bottom: 20px; text-align: center; }
    .form-group {
      margin-bottom: 15px;
    }
    label {
      display: block;
      color: #333;
      font-weight: bold;
      margin-bottom: 5px;
    }
    input, textarea {
      width: 100%;
      padding: 10px;
      border: 2px solid #ddd;
      border-radius: 6px;
      font-size: 14px;
      font-family: monospace;
    }
    input:focus, textarea:focus {
      outline: none;
      border-color: #0033aa;
      box-shadow: 0 0 8px rgba(0, 51, 170, 0.2);
    }
    button {
      width: 100%;
      padding: 12px;
      background: linear-gradient(135deg, #0033aa, #0d47a1);
      color: white;
      border: none;
      border-radius: 6px;
      font-weight: bold;
      cursor: pointer;
      font-size: 16px;
      margin-top: 10px;
    }
    button:hover { opacity: 0.9; }
    .display-url {
      margin-top: 20px;
      padding: 15px;
      background: #f5f5f5;
      border-radius: 6px;
      border-left: 4px solid #c41e3a;
    }
    .display-url label { margin-bottom: 8px; }
    .display-url textarea {
      min-height: 80px;
      background: white;
      border: 1px solid #ddd;
    }
    .copy-btn {
      padding: 8px 16px;
      background: #c41e3a;
      color: white;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      font-size: 12px;
      margin-top: 8px;
    }
    .copy-btn:hover { opacity: 0.9; }
    .footer { text-align: center; color: #999; font-size: 12px; margin-top: 20px; }
  </style>
</head>
<body>
<div class="container">
  <h1>🎥 G3X Likes</h1>
  
  <div class="form-group">
    <label>YouTube Video ID:</label>
    <input type="text" id="videoId" placeholder="ex: CluxDoi_Bjw" value="CluxDoi_Bjw">
  </div>
  
  <div class="form-group">
    <label>API Key:</label>
    <input type="text" id="apiKey" placeholder="ex: AIzaSy..." value="AIzaSyAyVlsBocP6YogYpM3-A143hO0N6JfE9g4">
  </div>
  
  <div class="form-group">
    <label>Meta de Likes:</label>
    <input type="number" id="target" placeholder="ex: 20000" value="20000">
  </div>
  
  <button onclick="updateDisplay()">Gerar URL</button>
  
  <div class="display-url">
    <label>Display URL (copiar para Flowics):</label>
    <textarea id="displayUrl" readonly></textarea>
    <button class="copy-btn" onclick="copiarURL()">📋 Copiar</button>
  </div>
  
  <div class="footer">
    <p>Deploy em: <strong>Railway</strong></p>
    <p>Status: <span style="color: #4CAF50;">✅ Online</span></p>
  </div>
</div>

<script>
function updateDisplay() {
  const videoId = document.getElementById('videoId').value;
  const apiKey = document.getElementById('apiKey').value;
  const target = document.getElementById('target').value;
  
  if (!videoId || !apiKey || !target) {
    alert('Preencha todos os campos!');
    return;
  }
  
  const baseUrl = window.location.origin;
  const displayUrl = baseUrl + '/display?api=' + apiKey + '&video=' + videoId + '&target=' + target;
  
  document.getElementById('displayUrl').value = displayUrl;
  document.getElementById('displayUrl').select();
}

function copiarURL() {
  const url = document.getElementById('displayUrl');
  url.select();
  document.execCommand('copy');
  alert('URL copiada!');
}

window.onload = function() {
  updateDisplay();
};
</script>
</body>
</html>`;

const server = http.createServer((req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST');
  
  // Rota /
  if (req.url === '/' || req.url === '' || req.url.startsWith('/?')) {
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(painel);
    return;
  }
  
  // Rota /display
  if (req.url.startsWith('/display')) {
    const url = new URL('http://localhost' + req.url);
    const api = url.searchParams.get('api');
    const video = url.searchParams.get('video');
    const target = url.searchParams.get('target') || '20000';
    
    if (!api || !video) {
      res.writeHead(400);
      res.end('Faltam: api, video, target');
      return;
    }
    
    const ytUrl = `https://www.googleapis.com/youtube/v3/videos?id=${video}&key=${api}&part=statistics`;
    
    https.get(ytUrl, (ytRes) => {
      let data = '';
      ytRes.on('data', chunk => data += chunk);
      ytRes.on('end', () => {
        try {
          const json = JSON.parse(data);
          let likes = 0;
          
          if (json.items && json.items[0] && json.items[0].statistics) {
            likes = parseInt(json.items[0].statistics.likeCount) || 0;
          }
          
          const html = `<!DOCTYPE html>
<html><head><meta charset="UTF-8"><style>
* { margin: 0; padding: 0; box-sizing: border-box; }
body { background: transparent; display: flex; align-items: center; justify-content: center; height: 100vh; }
.container { background: linear-gradient(135deg, #0033aa 0%, #0d47a1 100%); border: 3px solid #c41e3a; border-radius: 12px; padding: 16px 20px; text-align: center; box-shadow: 0 4px 16px rgba(0, 0, 0, 0.3); }
.header { background: rgba(0,0,0,0.15); padding: 8px; border-radius: 6px; margin-bottom: 12px; }
.label { font-size: 12px; color: rgba(255,255,255,0.9); font-weight: 700; text-transform: uppercase; letter-spacing: 1px; }
.target { font-size: 28px; color: #ffd700; font-weight: 900; margin-top: 4px; }
.likes { display: flex; align-items: center; justify-content: center; gap: 12px; padding: 10px 14px; background: white; border-radius: 8px; border-bottom: 3px solid #c41e3a; }
.thumb { font-size: 24px; }
.number { font-size: 24px; color: #0033aa; font-weight: 800; }
.dot { width: 8px; height: 8px; background: #c41e3a; border-radius: 50%; display: inline-block; margin-left: 6px; animation: pulse 1.5s infinite; }
@keyframes pulse { 0%, 100% { opacity: 0.2; } 50% { opacity: 1; } }
</style></head><body>
<div class="container">
  <div class="header">
    <div class="label">Meta de Likes</div>
    <div class="target">${fmt(parseInt(target))}</div>
  </div>
  <div class="likes">
    <div class="thumb">👍</div>
    <div class="number">${fmt(likes)}<span class="dot"></span></div>
  </div>
</div>
</body></html>`;
          
          res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
          res.end(html);
        } catch (e) {
          res.writeHead(500);
          res.end('Erro ao processar');
        }
      });
    }).on('error', () => {
      res.writeHead(500);
      res.end('Erro na API');
    });
    return;
  }
  
  res.writeHead(404);
  res.end('Não encontrado');
});

server.listen(PORT, () => {
  console.log('🎥 G3X Likes rodando na porta ' + PORT);
});
