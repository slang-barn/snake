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
  snakeColor = '#2ecc71'; // Default snake color
  colorPalette = {
    '经典绿': '#2ecc71',
    '皓月白': '#F5F5F7',
    '土豪金': '#DAA520',
    '深空灰': '#5A5A5A',
    '远峰蓝': '#A7C7E7',
    '星光色': '#F0EBE3'
  };

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

    this.loadSettings(); // Load settings first
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
    // Apply loaded color on reset
    // this.ctx.fillStyle = this.snakeColor; // Color applied during draw
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
    // Clear canvas with a slightly off-white color
    this.ctx.fillStyle = '#f9f9f9'; // Use a light background that contrasts well with white/starlight
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
    // Use the selected snake color
    this.snake.forEach((segment, index) => {
      const isHead = index === 0;
      const segmentColor = isHead ? this.adjustColor(this.snakeColor, -20) : this.snakeColor;

      this.ctx.fillStyle = segmentColor;
      this.ctx.fillRect(segment.x, segment.y, this.gridSize, this.gridSize);

      // Optional: Add a subtle border to snake segments for better visibility on similar backgrounds
      // Adjust border based on snake color brightness for contrast
      const brightness = this.getColorBrightness(segmentColor);
      this.ctx.strokeStyle = brightness > 128 ? '#555' : '#ccc'; // Dark border for light colors, light for dark
      this.ctx.lineWidth = 0.5;
      this.ctx.strokeRect(segment.x, segment.y, this.gridSize, this.gridSize);
    });

    // Draw food
    this.ctx.fillStyle = '#e74c3c'; // Food color
    this.ctx.beginPath();
    this.ctx.arc(this.food.x + this.gridSize / 2, this.food.y + this.gridSize / 2, this.gridSize / 2.2, 0, Math.PI * 2);
    this.ctx.fill();
    // Optional: Add a small highlight to the food
    this.ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
    this.ctx.beginPath();
    this.ctx.arc(this.food.x + this.gridSize / 3, this.food.y + this.gridSize / 3, this.gridSize / 5, 0, Math.PI * 2);
    this.ctx.fill();

  }

  // Helper function to adjust color brightness (simple version)
  adjustColor(hex, lum) {
    // Validate hex string
    hex = String(hex).replace(/[^0-9a-f]/gi, '');
    if (hex.length < 6) {
      hex = hex[0]+hex[0]+hex[1]+hex[1]+hex[2]+hex[2];
    }
    lum = lum || 0;

    // Convert to decimal and change luminosity
    let rgb = "#", c, i;
    for (i = 0; i < 3; i++) {
      c = parseInt(hex.substr(i*2,2), 16);
      c = Math.round(Math.min(Math.max(0, c + (c * lum / 100)), 255)).toString(16);
      rgb += ("00"+c).substr(c.length);
    }

    // A simple way to darken/lighten: add lum to each component
    let rgbAdjusted = "#";
    for (i = 0; i < 3; i++) {
      c = parseInt(hex.substr(i*2, 2), 16);
      c = Math.round(Math.min(Math.max(0, c + lum), 255)).toString(16); // Add lum directly
      rgbAdjusted += ("00" + c).substr(c.length);
    }
    return rgbAdjusted;
  }

  // Helper function to get color brightness (0-255)
  getColorBrightness(hex) {
    hex = String(hex).replace(/[^0-9a-f]/gi, '');
    if (hex.length < 6) {
      hex = hex[0]+hex[0]+hex[1]+hex[1]+hex[2]+hex[2];
    }
    const r = parseInt(hex.substr(0, 2), 16);
    const g = parseInt(hex.substr(2, 2), 16);
    const b = parseInt(hex.substr(4, 2), 16);
    // Using standard luminance calculation
    return (r * 299 + g * 587 + b * 114) / 1000;
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
    const colorOptionsContainer = document.getElementById('color-options'); // Added
    const speedSelect = document.getElementById('speed-select');
    const gridCheckbox = document.getElementById('show-grid');

    // Populate color options
    if (colorOptionsContainer) {
        colorOptionsContainer.innerHTML = ''; // Clear existing options
        Object.entries(this.colorPalette).forEach(([name, color]) => {
          const colorDiv = document.createElement('div');
          colorDiv.classList.add('color-option');
          colorDiv.style.backgroundColor = color;
          colorDiv.dataset.color = color;
          colorDiv.title = name; // Show color name on hover
          if (color === this.snakeColor) {
            colorDiv.classList.add('selected');
          }
          colorDiv.addEventListener('click', () => {
            this.snakeColor = color;
            // Update selection state visually
            document.querySelectorAll('.color-option').forEach(el => el.classList.remove('selected'));
            colorDiv.classList.add('selected');
            // No need to apply immediately, will be applied on modal close or game restart
          });
          colorOptionsContainer.appendChild(colorDiv);
        });
    }

    // 兼容弹窗和主界面设置
    if (settingsBtn && settingsModal) {
      settingsBtn.onclick = () => {
        this.openSettings(); // Call dedicated open settings method
      };
    }

    const closeModal = () => {
        this.closeSettings(); // Call dedicated close settings method
    };

    if (closeSettingsBtn && settingsModal) {
      closeSettingsBtn.onclick = closeModal;
    }

  }

  // Separate methods for managing settings modal
  openSettings() {
    this.wasPausedBeforeSettings = this.gamePaused;
    if (!this.gamePaused && !this.isGameOver) {
      this.togglePause(true); // Pause game if running, mark as settings pause
    }
    const settingsModal = document.getElementById('settings-modal');
    const speedSelectModal = document.getElementById('speed-select-modal');
    const showGridModal = document.getElementById('show-grid-modal');
    const colorOptionsContainer = document.getElementById('color-options');

    // Reflect current settings in the modal
    if (speedSelectModal) {
        const currentSpeedKey = Object.keys(this.speedMap).find(key => this.speedMap[key] === this.gameSpeed) || 'normal';
        speedSelectModal.value = currentSpeedKey;
    }
    if (showGridModal) {
        showGridModal.checked = this.showGrid;
    }
    // Update color selection UI based on current snakeColor
    if (colorOptionsContainer) {
        document.querySelectorAll('.color-option').forEach(el => {
            el.classList.toggle('selected', el.dataset.color === this.snakeColor);
        });
    }

    if (settingsModal) settingsModal.style.display = 'flex';
  }

  closeSettings() {
    const settingsModal = document.getElementById('settings-modal');
    this.applySettings(); // Apply and save settings first
    if (settingsModal) settingsModal.style.display = 'none';
    // Resume game only if it was running before opening settings
    if (!this.wasPausedBeforeSettings && this.gamePaused && !this.isGameOver) {
      this.togglePause(true); // Resume game, mark as settings resume
    }
    // Redraw needed to show color/grid changes if game is paused or over
    if (this.gamePaused || this.isGameOver) {
        this.draw();
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
    // 主界面设置 (These might be redundant if modal settings are preferred)
    if (speedSelect) {
      speedSelect.addEventListener('change', (e) => {
        this.setSpeed(e.target.value);
        // Optionally update modal select if visible
        if (speedSelectModal) speedSelectModal.value = e.target.value;
        localStorage.setItem('snakeGameSpeed', e.target.value);
        this.showSnackbar('速度已更改');
      });
    }
    if (gridCheckbox) {
      gridCheckbox.addEventListener('change', (e) => {
        this.setShowGrid(e.target.checked);
        // Optionally update modal checkbox if visible
        if (showGridModal) showGridModal.checked = e.target.checked;
        localStorage.setItem('snakeShowGrid', e.target.checked);
        this.showSnackbar(`网格已${e.target.checked ? '显示' : '隐藏'}`);
      });
    }
  }

  loadSettings() {
    const savedSpeed = localStorage.getItem('snakeGameSpeed');
    const savedShowGrid = localStorage.getItem('snakeShowGrid');
    const savedColor = localStorage.getItem('snakeColor');

    if (savedSpeed && this.speedMap[savedSpeed]) {
      this.gameSpeed = this.speedMap[savedSpeed];
      // Update UI elements if they exist
      const speedSelect = document.getElementById('speed-select');
      const speedSelectModal = document.getElementById('speed-select-modal');
      if (speedSelect) speedSelect.value = savedSpeed;
      if (speedSelectModal) speedSelectModal.value = savedSpeed;
    }
    // Default to true if not set
    this.showGrid = savedShowGrid === null ? true : savedShowGrid === 'true';
    // Update UI elements if they exist
    const gridCheckbox = document.getElementById('show-grid');
    const showGridModal = document.getElementById('show-grid-modal');
    if (gridCheckbox) gridCheckbox.checked = this.showGrid;
    if (showGridModal) showGridModal.checked = this.showGrid;

    if (savedColor && Object.values(this.colorPalette).includes(savedColor)) {
      this.snakeColor = savedColor;
      // Update color selection UI in modal if it exists
      const colorOptionsContainer = document.getElementById('color-options');
      if (colorOptionsContainer) {
          document.querySelectorAll('.color-option').forEach(el => {
              el.classList.toggle('selected', el.dataset.color === this.snakeColor);
          });
      }
    }
  }

  applySettings() {
    const speedSelectModal = document.getElementById('speed-select-modal');
    const showGridModal = document.getElementById('show-grid-modal');

    // Apply speed from modal
    if (speedSelectModal) {
        const selectedSpeed = speedSelectModal.value;
        if (this.speedMap[selectedSpeed]) {
          this.gameSpeed = this.speedMap[selectedSpeed];
          localStorage.setItem('snakeGameSpeed', selectedSpeed);
          // Update main UI select as well
          const speedSelect = document.getElementById('speed-select');
          if (speedSelect) speedSelect.value = selectedSpeed;
          // Restart interval with new speed if game is running
          if (this.gameInterval && !this.gamePaused && !this.isGameOver) {
            clearInterval(this.gameInterval);
            this.gameInterval = setInterval(() => this.gameLoop(), this.gameSpeed);
          }
        }
    }

    // Apply grid visibility from modal
    if (showGridModal) {
        this.showGrid = showGridModal.checked;
        localStorage.setItem('snakeShowGrid', this.showGrid);
        // Update main UI checkbox as well
        const gridCheckbox = document.getElementById('show-grid');
        if (gridCheckbox) gridCheckbox.checked = this.showGrid;
    }

    // Apply color (already updated via click, just save)
    localStorage.setItem('snakeColor', this.snakeColor);

    // Redraw immediately to reflect grid changes
    if (!this.isGameOver) {
        this.draw();
    }

    this.showSnackbar('设置已保存');
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