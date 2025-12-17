// --- Cài đặt Canvas ---
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const CANVAS_WIDTH = canvas.width;
const CANVAS_HEIGHT = canvas.height;

// --- Biến Trạng thái & Game ---
let ngCount = 10;
let gameRunning = false;
let animationFrameId;

// --- Cấu hình Đối tượng ---
const ballRadius = 8;
let ballX, ballY, ballSpeedX, ballSpeedY; // Vị trí và Tốc độ bóng

const paddleHeight = 10;
const paddleWidth = 75;
let paddleX; // Vị trí thanh đỡ

const brickRowCount = 5;
const brickColumnCount = 8;
const brickWidth = 60;
const brickHeight = 15;
const brickPadding = 10;
const brickOffsetTop = 30;
const brickOffsetLeft = 30;
let bricks = []; // Mảng chứa trạng thái gạch

// --- Điều khiển ---
let rightPressed = false;
let leftPressed = false;

// --- DOM Elements ---
const ngCountDisplay = document.getElementById('ng-count');
const startButton = document.getElementById('start-button');
const speedSelect = document.getElementById('speed-select');
const statusMessage = document.getElementById('status-message');


// --- Hàm Khởi tạo/Reset ---
function resetBall() {
    ballX = CANVAS_WIDTH / 2;
    ballY = CANVAS_HEIGHT - 30;
    
    // Thiết lập tốc độ dựa trên lựa chọn (Chậm: 2, Trung Bình: 4, Nhanh: 6)
    const speed = speedSelect.value;
    let baseSpeed = 4;
    
    if (speed === 'fast') baseSpeed = 6;
    else if (speed === 'slow') baseSpeed = 2;
    
    ballSpeedX = baseSpeed * (Math.random() > 0.5 ? 1 : -1);
    ballSpeedY = -baseSpeed;
}

function initBricks() {
    bricks = [];
    for (let c = 0; c < brickColumnCount; c++) {
        bricks[c] = [];
        for (let r = 0; r < brickRowCount; r++) {
            // status: 1 = còn gạch, 0 = gạch đã vỡ
            bricks[c][r] = { x: 0, y: 0, status: 1 };
        }
    }
}

function initGame() {
    paddleX = (CANVAS_WIDTH - paddleWidth) / 2;
    resetBall();
    initBricks();

    ngCount = 10;
    ngCountDisplay.textContent = ngCount;
    statusMessage.classList.add('hidden');
    startButton.textContent = 'BẮT ĐẦU (START)';
    startButton.disabled = false;
}

// --- Hàm Vẽ (Draw) ---
function drawBall() {
    ctx.beginPath();
    ctx.arc(ballX, ballY, ballRadius, 0, Math.PI * 2);
    ctx.fillStyle = "#2ecc71";
    ctx.fill();
    ctx.closePath();
}

function drawPaddle() {
    ctx.beginPath();
    ctx.rect(paddleX, CANVAS_HEIGHT - paddleHeight, paddleWidth, paddleHeight);
    ctx.fillStyle = "#3498db";
    ctx.fill();
    ctx.closePath();
}

function drawBricks() {
    let allBricksBroken = true;
    for (let c = 0; c < brickColumnCount; c++) {
        for (let r = 0; r < brickRowCount; r++) {
            const b = bricks[c][r];
            if (b.status === 1) {
                allBricksBroken = false;
                const brickX = (c * (brickWidth + brickPadding)) + brickOffsetLeft;
                const brickY = (r * (brickHeight + brickPadding)) + brickOffsetTop;
                
                b.x = brickX;
                b.y = brickY;
                
                ctx.beginPath();
                ctx.rect(brickX, brickY, brickWidth, brickHeight);
                ctx.fillStyle = "#e67e22";
                ctx.fill();
                ctx.closePath();
            }
        }
    }
    // Kiểm tra Chiến thắng sau khi vẽ
    if (allBricksBroken && gameRunning) {
        endGame(true);
    }
}

// --- Xử lý Va chạm ---
function collisionDetection() {
    for (let c = 0; c < brickColumnCount; c++) {
        for (let r = 0; r < brickRowCount; r++) {
            const b = bricks[c][r];
            if (b.status === 1) {
                // Kiểm tra bóng có đang nằm trong phạm vi gạch không
                if (ballX > b.x && ballX < b.x + brickWidth && ballY > b.y && ballY < b.y + brickHeight) {
                    ballSpeedY = -ballSpeedY; // Đảo hướng
                    b.status = 0; // Gạch vỡ
                }
            }
        }
    }
}

// --- Vòng lặp Game Chính ---
function updateGame() {
    // 1. Clear Canvas
    ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // 2. Vẽ các đối tượng
    drawBricks();
    drawBall();
    drawPaddle();
    
    // 3. Logic Va chạm
    collisionDetection();
    
    // Va chạm với Tường (Trái/Phải/Trên)
    if (ballX + ballSpeedX > CANVAS_WIDTH - ballRadius || ballX + ballSpeedX < ballRadius) {
        ballSpeedX = -ballSpeedX;
    }
    if (ballY + ballSpeedY < ballRadius) {
        ballSpeedY = -ballSpeedY;
    } 
    
    // Va chạm với Đáy hoặc Thanh đỡ
    else if (ballY + ballSpeedY > CANVAS_HEIGHT - ballRadius - paddleHeight) {
        if (ballX > paddleX && ballX < paddleX + paddleWidth) {
            // Va chạm với Thanh đỡ (Đỡ được bóng)
            ballSpeedY = -ballSpeedY; 
        } else if (ballY + ballSpeedY > CANVAS_HEIGHT - ballRadius) {
            // Bóng rơi khỏi màn hình (NG)
            ngCount--;
            ngCountDisplay.textContent = ngCount;
            
            if (ngCount <= 0) {
                endGame(false); // Thua cuộc
                return;
            } else {
                // Reset vị trí bóng sau mỗi lần NG
                resetBall();
                paddleX = (CANVAS_WIDTH - paddleWidth) / 2;
            }
        }
    }
    
    // 4. Cập nhật vị trí
    ballX += ballSpeedX;
    ballY += ballSpeedY;
    
    // 5. Cập nhật vị trí Thanh đỡ (Điều khiển)
    const paddleSpeed = 7;
    if (rightPressed && paddleX < CANVAS_WIDTH - paddleWidth) {
        paddleX += paddleSpeed;
    } else if (leftPressed && paddleX > 0) {
        paddleX -= paddleSpeed;
    }

    // 6. Lặp lại vòng lặp game
    if (gameRunning) {
        animationFrameId = requestAnimationFrame(updateGame);
    }
}

// --- Quản lý Trạng thái Game ---
function startGame() {
    if (gameRunning) {
        cancelAnimationFrame(animationFrameId);
    }
    
    initGame();
    gameRunning = true;
    startButton.textContent = 'ĐANG CHƠI...';
    startButton.disabled = true;
    updateGame();
}

function endGame(isWin) {
    gameRunning = false;
    startButton.disabled = false;
    startButton.textContent = 'CHƠI LẠI (RESTART)';
    
    cancelAnimationFrame(animationFrameId);
    
    if (isWin) {
        statusMessage.textContent = '🎉 CHÚC MỪNG! BẠN ĐÃ CHIẾN THẮNG! 🎉';
    } else {
        statusMessage.textContent = `😭 TRÒ CHƠI KẾT THÚC! Bạn đã bị ${ngCountDisplay.textContent} lần NG. 😭`;
    }
    statusMessage.classList.remove('hidden');
}


// --- Xử lý Sự kiện Điều khiển ---
document.addEventListener("keydown", (e) => {
    if (e.key === "Right" || e.key === "ArrowRight") {
        rightPressed = true;
    } else if (e.key === "Left" || e.key === "ArrowLeft") {
        leftPressed = true;
    }
}, false);

document.addEventListener("keyup", (e) => {
    if (e.key === "Right" || e.key === "ArrowRight") {
        rightPressed = false;
    } else if (e.key === "Left" || e.key === "ArrowLeft") {
        leftPressed = false;
    }
}, false);

// --- Khởi động ---
document.addEventListener('DOMContentLoaded', () => {
    initGame();
    startButton.addEventListener('click', startGame);
    
    // Vẽ trạng thái ban đầu lên Canvas trước khi game bắt đầu
    drawBricks();
    drawBall();
    drawPaddle();
});