const canvas = document.createElement('canvas');
const ctx = canvas.getContext('2d');

canvas.width = 1280;
canvas.height = 720;
document.body.appendChild(canvas);

ctx.imageSmoothingEnabled = false;

// --- OYUN AYARLARI ---
const TILE_SIZE = 40; // 1280/40 = 32 kolon, 720/40 = 18 satır
let currentLevel = 0;
let gameState = "PLAYING"; // PLAYING, FINISHED

// Tuş Kontrolleri
const keys = { w: false, a: false, s: false, d: false, ArrowUp: false, ArrowLeft: false, ArrowDown: false, ArrowRight: false };

window.addEventListener('keydown', (e) => { if(keys.hasOwnProperty(e.key)) keys[e.key] = true; });
window.addEventListener('keyup', (e) => { if(keys.hasOwnProperty(e.key)) keys[e.key] = false; });

// Oyuncu Objesi
const player = {
    x: 0, y: 0, 
    width: 32, height: 32, // Tile boyutundan biraz küçük olması hareket kolaylığı sağlar
    speed: 5,
    color: '#e74c3c' // Kendi karakter asset'ini ekleyene kadar kırmızı bir kare
};

// duvar
const imgWall = new Image();
imgWall.src = './assets/environment/wallblue.png';

// Harita Elemanları
let walls = [];
let door = null;

// Haritayı oku ve duvarları/kapıları oluştur
function loadLevel(levelIndex) {
    walls = [];
    door = null;
    const map = levels[levelIndex];

    for (let row = 0; row < map.length; row++) {
        for (let col = 0; col < map[row].length; col++) {
            const tileId = map[row][col];
            const x = col * TILE_SIZE;
            const y = row * TILE_SIZE;

            if (tileId === 1) {
                walls.push({ x: x, y: y, width: TILE_SIZE, height: TILE_SIZE });
            } else if (tileId === 2) {
                door = { x: x, y: y, width: TILE_SIZE, height: TILE_SIZE };
            } else if (tileId === 3) {
                // Oyuncuyu ortalayarak başlat (32x32 boyutlarında olduğu için)
                player.x = x + (TILE_SIZE - player.width) / 2;
                player.y = y + (TILE_SIZE - player.height) / 2;
            }
        }
    }
}

// Basit Kutu Çarpışma Testi (AABB Collision)
function checkCollision(rect1, rect2) {
    return (
        rect1.x < rect2.x + rect2.width &&
        rect1.x + rect1.width > rect2.x &&
        rect1.y < rect2.y + rect2.height &&
        rect1.y + rect1.height > rect2.y
    );
}

// Oyun İçi Hesaplamalar
function update() {
    if (gameState !== "PLAYING") return;

    let nextX = player.x;
    let nextY = player.y;

    if (keys.w || keys.ArrowUp) nextY -= player.speed;
    if (keys.s || keys.ArrowDown) nextY += player.speed;
    if (keys.a || keys.ArrowLeft) nextX -= player.speed;
    if (keys.d || keys.ArrowRight) nextX += player.speed;

    // Duvar Çarpışma Kontrolü (X ve Y ekseni ayrı ayrı kontrol edilir ki duvara sürtünerek kayabilelim)
    let canMoveX = true;
    let canMoveY = true;

    for (let wall of walls) {
        if (checkCollision({ x: nextX, y: player.y, width: player.width, height: player.height }, wall)) {
            canMoveX = false;
        }
        if (checkCollision({ x: player.x, y: nextY, width: player.width, height: player.height }, wall)) {
            canMoveY = false;
        }
    }

    if (canMoveX) player.x = nextX;
    if (canMoveY) player.y = nextY;

    // Kapıya ulaşma kontrolü
    if (door && checkCollision(player, door)) {
        currentLevel++;
        if (currentLevel < levels.length) {
            loadLevel(currentLevel);
        } else {
            gameState = "FINISHED";
        }
    }
}

// Ekrana Çizim Yapma
function draw() {
    // Arka planı temizle
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (gameState === "PLAYING") {
        
        for (let wall of walls) {
            // ctx.fillRect yerine drawImage kullanıyoruz
            ctx.drawImage(imgWall, wall.x, wall.y, wall.width, wall.height);
        }

        // Kapıyı Çiz (Kendi kapı sprite'ını buraya ekleyebilirsin)
        if (door) {
            ctx.fillStyle = '#d35400';
            ctx.fillRect(door.x, door.y, door.width, door.height);
        }

        // Oyuncuyu Çiz (Kendi karakter sprite'ını buraya ekleyebilirsin)
        ctx.fillStyle = player.color;
        ctx.fillRect(player.x, player.y, player.width, player.height);
        
    } else if (gameState === "FINISHED") {
        // Oyun Bitiş Ekranı
        ctx.fillStyle = '#f1c40f';
        ctx.font = '64px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('KAÇIŞ BAŞARILI!', canvas.width / 2, canvas.height / 2);
    }
}

// Oyun Döngüsü
function gameLoop() {
    update();
    draw();
    requestAnimationFrame(gameLoop);
}

// Oyunu Başlat
loadLevel(currentLevel);
gameLoop();