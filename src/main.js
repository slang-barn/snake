// import './style.css'; // Styles are linked in HTML
import { Game } from './game.js'; // Import from .js file now

document.addEventListener('DOMContentLoaded', () => {
  const canvas = document.getElementById('gameCanvas');
  const scoreElement = document.getElementById('score');

  function getResponsiveCanvasSize() {
    // 以屏幕宽高为基准，优先保证宽度适配，允许高度更长
    const maxWidth = Math.min(window.innerWidth, 480);
    const maxHeight = window.innerHeight - 220; // 预留顶部标题和底部按钮空间
    // 允许宽:高为 5:7 或 4:5，适配更多屏幕
    let width = Math.floor(maxWidth / 20) * 20;
    let height = Math.floor(Math.min(maxHeight, width * 1.3) / 20) * 20;
    // 最小尺寸限制
    width = Math.max(width, 180);
    height = Math.max(height, 240);
    return { width, height };
  }

  function resizeCanvasAndGame(game) {
    const { width, height } = getResponsiveCanvasSize();
    canvas.width = width;
    canvas.height = height;
    canvas.style.width = width + 'px';
    canvas.style.height = height + 'px';
    if (game) {
      game.width = width;
      game.height = height;
      game.reset();
      game.draw();
    }
  }

  let game;

  window.addEventListener('DOMContentLoaded', () => {
    resizeCanvasAndGame();
    game = new Game(canvas.getContext('2d'), canvas.width, canvas.height, scoreElement);
    game.start();
  });

  window.addEventListener('resize', () => {
    if (game) {
      resizeCanvasAndGame(game);
    }
  });
});