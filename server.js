const http = require('http');
const fs = require('fs');
const path = require('path');
const https = require('https');

const PORT = process.env.PORT || 3000;

function fmt(n) {
  if (n >= 1000000) return (n/1000000).toFixed(1).replace('.',',') + 'M';
  if (n >= 1000) return (n/1000).toFixed(1).replace('.',',') + 'K';
  return n.toString();
}

const server = http.createServer((req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  
  // Rota / → painel
  if (req.url === '/' || req.url.startsWith('/?')) {
    fs.readFile(path.join(__dirname, 'index.html'), (err, data) => {
      if (err) {
        res.writeHead(500);
        res.end('Erro');
        return;
      }
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
      res.end(data);
    });
    return;
  }
  
  // Rota /display → barra
  if (req.url.startsWith('/display')) {
    const url = new URL('http://localhost' + req.url);
    const api = url.searchParams.get('api');
    const video = url.searchParams.get('video');
    const target = url.searchParams.get('target') || '20000';
    
    if (!api || !video) {
      res.writeHead(400);
      res.end('Faltam parâmetros: api, video, target');
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
<html>
<head>
  <meta charset="UTF-8">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { 
      background: transparent; 
      display: flex; 
      align-items: center; 
      justify-content: center; 
      height: 100vh;
      margin: 0;
    }
    .container { 
      background: linear-gradient(135deg, #0033aa 0%, #0d47a1 100%);
      border: 3px solid #c41e3a;
      border-radius: 12px;
      padding: 16px 20px;
      width: auto;
      min-width: 240px;
      text-align: center;
      box-shadow: 0 4px 16px rgba(0, 0, 0, 0.3);
    }
    .header {
      background: rgba(0, 0, 0, 0.15);
      padding: 8px 10px;
      border-radius: 6px;
      margin-bottom: 12px;
    }
    .label {
      font-size: 12px;
      color: rgba(255, 255, 255, 0.9);
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 1px;
      margin-bottom: 3px;
    }
    .target {
      font-size: 28px;
      color: #ffd700;
      font-weight: 900;
    }
    .likes {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 12px;
      padding: 10px 14px;
      background: white;
      border-radius: 8px;
      border-bottom: 3px solid #c41e3a;
    }
    .thumb { 
      font-size: 24px; 
      line-height: 1;
    }
    .number {
      font-size: 24px;
      color: #0033aa;
      font-weight: 800;
      letter-spacing: -1px;
    }
    .dot {
      display: inline-block;
      width: 8px;
      height: 8px;
      background: #c41e3a;
      border-radius: 50%;
      margin-left: 6px;
      animation: pulse 1.5s ease-in-out infinite;
    }
    @keyframes pulse {
      0%, 100% { opacity: 0.2; }
      50% { opacity: 1; }
    }
  </style>
</head>
<body>
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
</body>
</html>`;
          
          res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
          res.end(html);
        } catch (e) {
          console.error('Erro:', e);
          res.writeHead(500);
          res.end('Erro ao processar');
        }
      });
    }).on('error', (err) => {
      console.error('Erro na API:', err);
      res.writeHead(500);
      res.end('Erro na API YouTube');
    });
    return;
  }
  
  res.writeHead(404);
  res.end('Não encontrado');
});

server.listen(PORT, () => {
  console.log(`🎥 G3X Likes rodando na porta ${PORT}`);
});
