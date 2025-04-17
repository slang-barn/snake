// src/game.js

export class Game {
  ctx;
  width;
  height;
  scoreElement;

  snake;
  food;
  direction;
  score;
  gameInterval = null;
  gridSize = 20; // Size of each grid cell and snake segment
  initialSnakeLength = 3;
  gameSpeed = 150; // Milliseconds between updates
  gamePaused = false;
  isGameOver = false; // Flag to indicate game over state
  wasPausedBeforeSettings = false; // Track if game was paused before opening settings

  constructor(ctx, width, height, scoreElement) {
    this.ctx = ctx;
    this.width = width;
    this.height = height;
    this.scoreElement = scoreElement;

    this.snake = [];
    this.food = { x: 0, y: 0 };
    this.direction = { x: 1, y: 0 }; // Start moving right
    this.score = 0;
    this.showGrid = true;
    this.speedMap = {
      slow: 300,
      normal: 150,
      fast: 80,
      superfast: 40
    };
    this.gameSpeed = this.speedMap.normal;

    this.reset();
    this.setupInput();
    this.setupSettings();
  }

  reset() {
    // Initialize snake position
    this.snake = [];
    const startX = Math.floor(this.width / (2 * this.gridSize)) * this.gridSize;
    const startY = Math.floor(this.height / (2 * this.gridSize)) * this.gridSize;
    for (let i = 0; i < this.initialSnakeLength; i++) {
      this.snake.push({ x: startX - i * this.gridSize, y: startY });
    }

    this.direction = { x: 1, y: 0 }; // Reset direction to right
    this.score = 0;
    this.updateScoreDisplay();
    this.spawnFood();
  }

  setupInput() {
    document.addEventListener('keydown', (e) => {
      if (e.key === ' ') {
        if (this.isGameOver) {
          this.start(); // Start new game if game was over
        } else {
          this.togglePause(); // Otherwise, toggle pause
        }
        return;
      }
      switch (e.key) {
        case 'ArrowUp':
          if (this.direction.y === 0) this.direction = { x: 0, y: -1 };
          break;
        case 'ArrowDown':
          if (this.direction.y === 0) this.direction = { x: 0, y: 1 };
          break;
        case 'ArrowLeft':
          if (this.direction.x === 0) this.direction = { x: -1, y: 0 };
          break;
        case 'ArrowRight':
          if (this.direction.x === 0) this.direction = { x: 1, y: 0 };
          break;
      }
    });
    // 触屏按钮事件
    const btnUp = document.getElementById('btn-up');
    const btnDown = document.getElementById('btn-down');
    const btnLeft = document.getElementById('btn-left');
    const btnRight = document.getElementById('btn-right');
    if (btnUp && btnDown && btnLeft && btnRight) {
      const setDir = (dir) => {
        switch (dir) {
          case 'up':
            if (this.direction.y === 0) this.direction = { x: 0, y: -1 };
            break;
          case 'down':
            if (this.direction.y === 0) this.direction = { x: 0, y: 1 };
            break;
          case 'left':
            if (this.direction.x === 0) this.direction = { x: -1, y: 0 };
            break;
          case 'right':
            if (this.direction.x === 0) this.direction = { x: 1, y: 0 };
            break;
        }
      };
      [
        [btnUp, 'up'],
        [btnDown, 'down'],
        [btnLeft, 'left'],
        [btnRight, 'right']
      ].forEach(([btn, dir]) => {
        btn.addEventListener('click', () => setDir(dir));
        btn.addEventListener('touchstart', (e) => { e.preventDefault(); setDir(dir); }, { passive: false });
      });
    }
  }

  spawnFood() {
    const maxX = (this.width / this.gridSize) - 1;
    const maxY = (this.height / this.gridSize) - 1;
    let newFoodPosition;

    do {
      newFoodPosition = {
        x: Math.floor(Math.random() * (maxX + 1)) * this.gridSize,
        y: Math.floor(Math.random() * (maxY + 1)) * this.gridSize,
      };
    } while (this.isPositionOnSnake(newFoodPosition)); // Ensure food doesn't spawn on the snake

    this.food = newFoodPosition;
  }

  isPositionOnSnake(position) {
    return this.snake.some(segment => segment.x === position.x && segment.y === position.y);
  }

  gameLoop() {
    if (this.gamePaused) return;
    if (this.update()) {
      this.draw();
    } else {
      this.gameOver();
    }
  }

  update() {
    // Move snake
    const head = {
      x: this.snake[0].x + this.direction.x * this.gridSize,
      y: this.snake[0].y + this.direction.y * this.gridSize
    };

    // Check for collisions
    // Wall collision
    if (head.x < 0 || head.x >= this.width || head.y < 0 || head.y >= this.height) {
      return false; // Game over
    }

    // Self collision
    for (let i = 1; i < this.snake.length; i++) {
      if (head.x === this.snake[i].x && head.y === this.snake[i].y) {
        return false; // Game over
      }
    }

    this.snake.unshift(head); // Add new head

    // Check for food collision
    if (head.x === this.food.x && head.y === this.food.y) {
      this.score++;
      this.updateScoreDisplay();
      this.spawnFood();
    } else {
      this.snake.pop(); // Remove tail if no food eaten
    }

    return true; // Game continues
  }

  draw() {
    // 保证每格为正方形
    const cols = Math.floor(this.width / this.gridSize);
    const rows = Math.floor(this.height / this.gridSize);
    const cellSize = Math.min(this.width / cols, this.height / rows);
    // Clear canvas
    this.ctx.fillStyle = '#eee';
    this.ctx.fillRect(0, 0, this.width, this.height);

    // 绘制网格
    if (this.showGrid) {
      this.ctx.save();
      this.ctx.strokeStyle = '#d1d5db';
      this.ctx.lineWidth = 0.7;
      for (let i = 1; i < cols; i++) {
        const x = i * cellSize;
        this.ctx.beginPath();
        this.ctx.moveTo(x, 0);
        this.ctx.lineTo(x, this.height);
        this.ctx.stroke();
      }
      for (let j = 1; j < rows; j++) {
        const y = j * cellSize;
        this.ctx.beginPath();
        this.ctx.moveTo(0, y);
        this.ctx.lineTo(this.width, y);
        this.ctx.stroke();
      }
      this.ctx.restore();
    }

    // Draw snake
    this.snake.forEach((segment, idx) => {
      const grad = this.ctx.createLinearGradient(segment.x, segment.y, segment.x + cellSize, segment.y + cellSize);
      grad.addColorStop(0, '#a8e063');
      grad.addColorStop(1, '#56ab2f');
      this.ctx.save();
      this.ctx.shadowColor = 'rgba(80,180,80,0.35)';
      this.ctx.shadowBlur = 8;
      this.ctx.fillStyle = grad;
      this.ctx.beginPath();
      this.ctx.moveTo(segment.x + 4, segment.y);
      this.ctx.arcTo(segment.x + cellSize, segment.y, segment.x + cellSize, segment.y + cellSize, 6);
      this.ctx.arcTo(segment.x + cellSize, segment.y + cellSize, segment.x, segment.y + cellSize, 6);
      this.ctx.arcTo(segment.x, segment.y + cellSize, segment.x, segment.y, 6);
      this.ctx.arcTo(segment.x, segment.y, segment.x + cellSize, segment.y, 6);
      this.ctx.closePath();
      this.ctx.fill();
      this.ctx.shadowBlur = 0;
      this.ctx.restore();
      this.ctx.strokeStyle = 'rgba(255,255,255,0.7)';
      this.ctx.lineWidth = 1.2;
      this.ctx.stroke();
    });

    // Draw food
    this.ctx.save();
    this.ctx.shadowColor = 'rgba(200,0,40,0.35)';
    this.ctx.shadowBlur = 10;
    const foodCenterX = this.food.x + cellSize / 2;
    const foodCenterY = this.food.y + cellSize / 2;
    const foodRadius = cellSize * 0.45;
    const foodGrad = this.ctx.createRadialGradient(foodCenterX, foodCenterY, foodRadius * 0.3, foodCenterX, foodCenterY, foodRadius);
    foodGrad.addColorStop(0, '#ff6a6a');
    foodGrad.addColorStop(1, '#b31217');
    this.ctx.fillStyle = foodGrad;
    this.ctx.beginPath();
    this.ctx.arc(foodCenterX, foodCenterY, foodRadius, 0, Math.PI * 2);
    this.ctx.closePath();
    this.ctx.fill();
    this.ctx.globalAlpha = 0.5;
    this.ctx.beginPath();
    this.ctx.arc(foodCenterX - foodRadius * 0.3, foodCenterY - foodRadius * 0.3, foodRadius * 0.35, 0, Math.PI * 2);
    this.ctx.closePath();
    this.ctx.fillStyle = '#fff';
    this.ctx.fill();
    this.ctx.globalAlpha = 1;
    this.ctx.restore();
  }


  updateScoreDisplay() {
    this.scoreElement.textContent = `分数: ${this.score}`;
  }

  gameOver() {
    this.stop(); // Stop the game loop
    this.isGameOver = true; // Set game over flag
    this.showSnackbar(`游戏结束！分数：${this.score}。按空格键开始新游戏`);
    // Do not reset here anymore
  }

  showSnackbar(message) {
    const snackbar = document.getElementById('snackbar');
    if (!snackbar) return;
    snackbar.textContent = message;
    snackbar.classList.add('show');
    clearTimeout(this._snackbarTimer);
    this._snackbarTimer = setTimeout(() => {
      snackbar.classList.remove('show');
    }, 2200);
  }

  setupSettings() {
    // 设置弹窗相关
    const settingsBtn = document.getElementById('settings-btn');
    const settingsModal = document.getElementById('settings-modal');
    const closeSettingsBtn = document.getElementById('close-settings');
    const speedSelectModal = document.getElementById('speed-select-modal');
    const showGridModal = document.getElementById('show-grid-modal');
    const speedSelect = document.getElementById('speed-select');
    const gridCheckbox = document.getElementById('show-grid');

    // 兼容弹窗和主界面设置
    if (settingsBtn && settingsModal) {
      settingsBtn.onclick = () => {
        this.wasPausedBeforeSettings = this.gamePaused; // Store current pause state
        if (!this.gamePaused && !this.isGameOver) {
          this.togglePause(true); // Pause game if running, mark as settings pause
        }
        settingsModal.style.display = 'flex';
        if (speedSelectModal) speedSelectModal.value = Object.keys(this.speedMap).find(k => this.speedMap[k] === this.gameSpeed) || 'normal';
        if (showGridModal) showGridModal.checked = this.showGrid;
      };
    }

    const closeModal = () => {
        settingsModal.style.display = 'none';
        // Resume game only if it was running before opening settings
        if (!this.wasPausedBeforeSettings && this.gamePaused && !this.isGameOver) {
            this.togglePause(true); // Resume game, mark as settings resume
        }
    };

    if (closeSettingsBtn && settingsModal) {
      closeSettingsBtn.onclick = closeModal;
    }
    if (speedSelectModal) {
      speedSelectModal.onchange = (e) => {
        const val = e.target.value;
        if (this.speedMap[val]) {
          this.setSpeed(val);
        }
      };
    }
    if (showGridModal) {
      showGridModal.onchange = (e) => {
        this.setShowGrid(e.target.checked);
      };
    }
    // ESC 关闭弹窗
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && settingsModal && settingsModal.style.display !== 'none') {
        closeModal();
      }
    });
    // 点击弹窗外关闭
    if (settingsModal) {
      settingsModal.addEventListener('click', (e) => {
        if (e.target === settingsModal) {
          closeModal();
        }
      });
    }
    // 主界面设置
    if (speedSelect) {
      speedSelect.addEventListener('change', (e) => {
        this.setSpeed(e.target.value);
      });
    }
    if (gridCheckbox) {
      gridCheckbox.addEventListener('change', (e) => {
        this.setShowGrid(e.target.checked);
      });
    }
  }

  start() {
    this.reset(); // Ensure reset happens at the start
    this.isGameOver = false; // Reset game over flag
    this.gamePaused = false; // Ensure game is not paused
    // Clear any existing interval before starting a new one
    if (this.gameInterval) {
        clearInterval(this.gameInterval);
    }
    this.gameInterval = window.setInterval(() => this.gameLoop(), this.gameSpeed);
  }
  setSpeed(speedKey) {
    this.gameSpeed = this.speedMap[speedKey] || this.speedMap.normal;
    if (this.gameInterval) {
      clearInterval(this.gameInterval);
      this.gameInterval = window.setInterval(() => this.gameLoop(), this.gameSpeed);
    }
  }
  setShowGrid(show) {
    this.showGrid = show;
    this.draw();
  }

  stop() {
    if (this.gameInterval) {
      clearInterval(this.gameInterval);
      this.gameInterval = null;
    }
  }
  togglePause(isSettingsAction = false) {
    // Don't allow pause/unpause when game is over
    if (this.isGameOver) return;

    this.gamePaused = !this.gamePaused;

    // Only show snackbar for manual pause/resume (spacebar)
    if (!isSettingsAction) {
        if (this.gamePaused) {
            this.showSnackbar('已暂停，按空格键继续');
        } else {
            this.showSnackbar('已恢复，继续游戏');
        }
    }
  }
}