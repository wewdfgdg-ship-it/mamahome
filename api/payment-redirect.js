// Vercel Function - 페이앱 POST 결제 완료 처리
// /api/payment-redirect

export default async function handler(req, res) {
  // POST 데이터 받기
  const { state, orderid, goodname, price, buyer, message } = req.body || req.query;

  // GET 파라미터로 변환
  const params = new URLSearchParams();
  if (state) params.append('state', state);
  if (orderid) params.append('orderid', orderid);
  if (goodname) params.append('goodname', goodname);
  if (price) params.append('price', price);
  if (buyer) params.append('buyer', buyer);
  if (message) params.append('message', message);

  // GitHub Pages의 payment-complete.html로 리다이렉트
  const redirectUrl = `https://wewdfgdg-ship-it.github.io/mamahome/pages/payment-complete.html?${params.toString()}`;

  // HTML로 자동 리다이렉트 (POST를 GET으로 변환)
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>결제 완료 처리 중...</title>
      <meta http-equiv="refresh" content="0; url=${redirectUrl}">
      <style>
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          display: flex;
          align-items: center;
          justify-content: center;
          height: 100vh;
          margin: 0;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        }
        .container {
          background: white;
          padding: 40px;
          border-radius: 20px;
          box-shadow: 0 20px 60px rgba(0,0,0,0.3);
          text-align: center;
        }
        .spinner {
          width: 50px;
          height: 50px;
          margin: 0 auto 20px;
          border: 4px solid #f3f3f3;
          border-top: 4px solid #667eea;
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="spinner"></div>
        <h2>결제를 완료하고 있습니다</h2>
        <p>잠시만 기다려주세요...</p>
      </div>
      <script>
        // 자동 리다이렉트
        setTimeout(() => {
          window.location.href = '${redirectUrl}';
        }, 500);
      </script>
    </body>
    </html>
  `;

  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.status(200).send(html);
}