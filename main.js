const canvas = document.createElement('canvas');
const ctx = canvas.getContext('2d');

canvas.width = 1280;
canvas.height = 720;
document.body.appendChild(canvas);

ctx.imageSmoothingEnabled = false;

// --- OYUN AYARLARI ---
const TILE_SIZE = 32; // 1280/40 = 32 kolon, 720/40 = 18 satır
let currentLevel = 0;
let gameState = "PLAYING"; // PLAYING, FINISHED

const player = new Player();
const input = new InputHandler(); // HATA 1 ÇÖZÜMÜ: Input'u başlattık

// duvar
const imgWall = new Image();
imgWall.src = './assets/environment/wallgrey.png';

// hücre kapısı
const imgCellDoor = new Image();
imgCellDoor.src = './assets/environment/celldoor2.png';

// zemin
const imgGround = new Image();
imgGround.src = './assets/environment/ground.png';

let walls = [];
let cellDoors = [];
let door = null;

function loadLevel(levelIndex) {
    walls = [];
    cellDoors = [];
    door = null;
    const map = levels[levelIndex];

    for (let row = 0; row < map.length; row++) {
        for (let col = 0; col < map[row].length; col++) {
            const tileId = map[row][col];
            const x = col * TILE_SIZE;
            const y = row * TILE_SIZE;

            if (tileId === 1) walls.push({ x: x, y: y, width: TILE_SIZE, height: TILE_SIZE });
            else if (tileId === 2) door = { x: x, y: y, width: TILE_SIZE, height: TILE_SIZE };
            else if (tileId === 3) {
                player.x = x + (TILE_SIZE - player.width) / 2;
                player.y = y + (TILE_SIZE - player.height) / 2;
            }
            else if (tileId === 4) {
                cellDoors.push({x: x, y: y, width: TILE_SIZE, height: TILE_SIZE});
            }
        }
    }
}

function checkCollision(rect1, rect2) {
    return (
        rect1.x < rect2.x + rect2.width &&
        rect1.x + rect1.width > rect2.x &&
        rect1.y < rect2.y + rect2.height &&
        rect1.y + rect1.height > rect2.y
    );
}

function update() {
    if (gameState !== "PLAYING") return;

    let nextX = player.x;
    let nextY = player.y;
    let isMoving = false; // Başlangıçta hareket yok kabul ediyoruz

    if (input.keys['KeyW'] || input.keys['ArrowUp']) { nextY -= player.speed; isMoving = true; }
    if (input.keys['KeyS'] || input.keys['ArrowDown']) { nextY += player.speed; isMoving = true; }
    if (input.keys['KeyA'] || input.keys['ArrowLeft']) { nextX -= player.speed; isMoving = true; player.facingRight = false;}
    if (input.keys['KeyD'] || input.keys['ArrowRight']) { nextX += player.speed; isMoving = true; player.facingRight = true;}

    // Animasyonu güncelle
    player.updateAnimation(isMoving);

    // kapıların açılıp kapanmasını kontrol ediyoruz
    for(let i = 0; i < cellDoors.length; i++){
        let currentCellDoor = cellDoors[i];
        if(checkCollision(player,currentCellDoor)){
            currentCellDoor.isOpen = true;
        }else{
            currentCellDoor.isOpen = false;
        }
    }

    let canMoveX = true;
    let canMoveY = true;

    for (let wall of walls) {
        if (checkCollision({ x: nextX, y: player.y, width: player.width, height: player.height }, wall)) canMoveX = false;
        if (checkCollision({ x: player.x, y: nextY, width: player.width, height: player.height }, wall)) canMoveY = false;
    }

    if (canMoveX) player.x = nextX;
    if (canMoveY) player.y = nextY;

    if (door && checkCollision(player, door)) {
        currentLevel++;
        if (currentLevel < levels.length) loadLevel(currentLevel);
        else gameState = "FINISHED";
    }
}

// Ne kadar yakınlaşacağımızı belirliyoruz (Örn: 2 kat)
const zoom = 2; 

function draw() {
    // 1. Ekranı temizle
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (gameState === "PLAYING") {
        
        ctx.save(); // KAMERA BAŞLANGICI: Çizim ayarlarını kaydet

        // 2. Kameranın bakacağı X ve Y koordinatlarını hesapla (Oyuncunun tam ortası)
        let camX = player.x + (player.width / 2) - (canvas.width / 2) / zoom;
        let camY = player.y + (player.height / 2) - (canvas.height / 2) / zoom;

        // 3. Ekranı yakınlaştır ve dünyayı oyuncunun tersine kaydır
        ctx.scale(zoom, zoom); 
        ctx.translate(-camX, -camY); 

        // --- DÜNYA ÇİZİMLERİ (Kameradan etkilenen her şey bu araya yazılır) ---

        // zemini çiziyoruz
        const currentMap = levels[currentLevel];
        for(let row = 0; row < currentMap.length; row++){
            for(let col = 0; col < currentMap[row].length; col++){
                const x = col * TILE_SIZE;
                const y = row * TILE_SIZE;
                ctx.drawImage(imgGround, x, y, TILE_SIZE, TILE_SIZE);
            }
        }
        
        for (let wall of walls) {
            ctx.drawImage(imgWall, wall.x, wall.y, wall.width, wall.height);
        }

        if (door) {
            ctx.fillStyle = '#d35400';
            ctx.fillRect(door.x, door.y, door.width, door.height);
        }

        // hücre kapılarını çiziyoruz
        for(let cDoor of cellDoors){
            if(!cDoor.isOpen){
                ctx.drawImage(imgCellDoor, cDoor.x, cDoor.y, cDoor.width, cDoor.height);
            }
        }

        player.draw(ctx);
        
        // ----------------------------------------------------------------------

        ctx.restore(); // KAMERA BİTİŞİ: Ayarları sıfırla

        // Not: ctx.restore() yapmazsak, ekrana yazdıracağımız skor veya 
        // menü yazıları da oyuncuyla beraber hareket eder ve dev gibi olur.

    } else if (gameState === "FINISHED") {
        // Oyun bitiş yazısı (Kameradan bağımsız, hep ortada durur)
        ctx.fillStyle = '#f1c40f';
        ctx.font = '64px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('KAÇIŞ BAŞARILI!', canvas.width / 2, canvas.height / 2);
    }
}

function gameLoop() {
    update();
    draw();
    requestAnimationFrame(gameLoop);
}

loadLevel(currentLevel);
gameLoop();