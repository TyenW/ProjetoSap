/**
 * Configuração opcional do endpoint de leaderboard (API externa).
 *
 * Caso você hospede o site estático (HTML/CSS/JS) em um lugar
 * e a API do placar (Top 10) em outro (ex.: Vercel), defina abaixo:
 *
 * Exemplo:
 *   window.LEADERBOARD_API = 'https://seu-projeto.vercel.app/api/leaderboard';
 *
 * Também é possível configurar via:
 * - Querystring: ?lbApi=https://.../api/leaderboard
 * - Meta tag: <meta name="leaderboard-api" content="https://.../api/leaderboard" />
 * - localStorage: key 'sap_quiz_leaderboard_api'
 */
// Defina explicitamente a API pública do Apps Script para o leaderboard
// (GET retorna Top 10; POST recebe {name, score})
window.LEADERBOARD_API = window.LEADERBOARD_API || 'https://script.google.com/macros/s/AKfycbwNFOo7vdeMmjn5IimQjghcJb0RyhygPJv4DfGNf1ypiX0AV4uPgkINB8pOTIylTku6WQ/exec';
