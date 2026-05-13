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
const imgCellDoorOpened = new Image();
imgCellDoorOpened.src = './assets/environment/celldoor2_open.png';

const imgCellDoorClosed = new Image();
imgCellDoorClosed.src = './assets/environment/celldoor2.png';

// zemin
const imgGround = new Image();
imgGround.src = './assets/environment/ground.png';

// mavi kapı
const imgBlueDoor = new Image();
imgBlueDoor.src = './assets/environment/officedoorblue.png';

// kırmızı kapı
const imgRedDoor = new Image();
imgRedDoor.src = './assets/environment/officedoorred.png';

// sarı kapı
const imgYellowDoor = new Image();
imgYellowDoor.src = './assets/environment/officedooryellow.png';

// mavi anahtar
const imgKeyBlue = new Image();
imgKeyBlue.src = './assets/environment/keyblue.png';

// kırmızı anahtar
const imgKeyRed = new Image();
imgKeyRed.src = './assets/environment/keyred.png';

// sarı anahtar (ana kapıyı açacak anahtar)
const imgKeyYellow = new Image();
imgKeyYellow.src = './assets/environment/key.png';

const imgBed = new Image();
imgBed.src = './assets/environment/bed.png';


let walls = [];
let cellDoors = [];
let cameras = [];
let guards = [];
let door = null;
let globalAlarmTriggered = false;
let collectibleKeys = []; // anahtarla açılabilecek kapıları tutacak.
let coloredDoors = []; // kilitli kapıları tutacak.
let beds = [];

function loadLevel(levelIndex) {
    walls = [];
    cellDoors = [];
    cameras = [];
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
                player.inventory = {yellow: false, blue: false, red: false};
            }
            else if (tileId === 4) {
                cellDoors.push({x: x, y: y, width: TILE_SIZE, height: TILE_SIZE});
            }
            else if (tileId === 5) {
                guards.push(new Guard(x, y));
            }
            else if (tileId === 6){
                cameras.push(new securityCamera(x, y));
            }
            else if(tileId === 7){
                collectibleKeys.push({x: x + 8, y: y + 8, width: 16, height: 16, color: 'yellow'});
            }
            else if(tileId === 8){
                collectibleKeys.push({x: x + 8, y: y + 8, width: 16, height: 16, color: 'blue'});
            }
            else if(tileId === 9){
                collectibleKeys.push({x: x + 8, y: y + 8, width: 16, height: 16, color: 'red'});
            }
            else if(tileId === 10){
                coloredDoors.push({x: x, y: y, width: TILE_SIZE, height: TILE_SIZE, color: 'blue', isOpen: false});
            }
            else if(tileId === 11){
                coloredDoors.push({x: x, y: y, width: TILE_SIZE, height: TILE_SIZE, color: 'red', isOpen: false});
            }
            else if(tileId === 12){
                beds.push({x: x, y: y, width: 28, height: 28});
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

let lastTime = 0;

function update(deltaTime) {
    if (gameState !== "PLAYING") return;

    let nextX = player.x;
    let nextY = player.y;
    let isMoving = false; // Başlangıçta hareket yok kabul ediyoruz

    let moveAmount = player.speed * deltaTime;

    // alarmı ayarlıyoruz.
    globalAlarmTriggered = false;

    // kameraları güncelliyoruz.
    for(let cam of cameras){
        cam.update(deltaTime, player);
    }

    player.isHidden = false;
    for (let bed of beds) {
        if (checkCollision(player, bed)) {
            player.isHidden = true;
            break;
        }
    }

    // Karakter saklanıyorsa gardiyanlara çok uzakta sahte bir hedef göster (kovalamayı bırakıp son konumu araştırırlar)
    let targetPlayer = player.isHidden ? { x: -9999, y: -9999, width: 0, height: 0 } : player;

    for (let guard of guards) {
        // Hedef olarak targetPlayer'ı gönderiyoruz
        let isCaught = guard.update(deltaTime, targetPlayer, walls, cellDoors);
        
        // Sadece saklanmıyorken yakalanabilir
        if (isCaught && !player.isHidden) {
            gameState = "GAMEOVER";
        }
    }

    if (input.keys['KeyW'] || input.keys['ArrowUp']) { nextY -= moveAmount; isMoving = true; }
    if (input.keys['KeyS'] || input.keys['ArrowDown']) { nextY += moveAmount; isMoving = true; }
    if (input.keys['KeyA'] || input.keys['ArrowLeft']) { nextX -= moveAmount; isMoving = true; player.facingRight = false;}
    if (input.keys['KeyD'] || input.keys['ArrowRight']) { nextX += moveAmount; isMoving = true; player.facingRight = true;}

    // kapıya "e" basıldığında kapının açılması için 
    // karakterin etrafında bir hitbox oluşturup onun kapıya temas edip etmediğini kontrol edeceğiz.
    let interactArea = {
        x: player.x - 5,
        y: player.y - 5,
        width: player.width + 10,
        height: player.height + 10
    };

    // anahtarları topluyoruz.
    for(let i = collectibleKeys.length - 1; i >= 0; i--){
        if(checkCollision(player, collectibleKeys[i])){
            player.inventory[collectibleKeys[i].color] = true; // renge göre inventory'e ekliyoruz.
            collectibleKeys.splice(i, 1) // anahtar toplandığı için haritadan siliyoruz.
        }
    }

    // kilitli kapıları açıp açamadığımızı kontrol ediyoruz. (yine "e"ye basıp açıyoruz.)
    for(let cDoor of coloredDoors){
        let isNear = checkCollision(interactArea, cDoor);
        if(isNear && (input.keys['KeyE'] || input.keys['e'])){
            if(cDoor.color === 'blue' && player.inventory.blue)
                cDoor.isOpen = true;
            if(cDoor.color === 'red' && player.inventory.red)
                cDoor.isOpen = true;
        }
    }

    for(let i = 0; i < cellDoors.length; i++){
        let currentCellDoor = cellDoors[i];

        let isNear = checkCollision(interactArea, currentCellDoor);

        if(isNear){
            if(input.keys['KeyE'] || input.keys['e'])
                currentCellDoor.isOpen = true;
        }else{
            currentCellDoor.isOpen = false;
        }
    }

    // Animasyonu güncelle
    player.updateAnimation(isMoving);
/*
    // kapıların açılıp kapanmasını kontrol ediyoruz
    for(let i = 0; i < cellDoors.length; i++){
        let currentCellDoor = cellDoors[i];
        if(checkCollision(player,currentCellDoor)){
            currentCellDoor.isOpen = true;
        }else{
            currentCellDoor.isOpen = false;
        }
    }
*/
    let canMoveX = true;
    let canMoveY = true;

    for (let wall of walls) {
        if (checkCollision({ x: nextX, y: player.y, width: player.width, height: player.height }, wall)) canMoveX = false;
        if (checkCollision({ x: player.x, y: nextY, width: player.width, height: player.height }, wall)) canMoveY = false;
    }

    for(let cDoor of coloredDoors){
        if(!cDoor.isOpen){
            if(checkCollision({x: nextX, y: player.y, width: player.width, height: player.height},cDoor))
                canMoveX = false;
            if(checkCollision({x: player.x, y: nextY, width: player.width, height: player.height}, cDoor))
                canMoveY = false;
        }
    }

    if(door){
        if(checkCollision({x: nextX, y: player.y, width: player.width, height: player.height},door))
            canMoveX = false;
        if(checkCollision({x: player.x, y: nextY, width: player.width, height: player.height},door))
            canMoveY = false;
    }

    // kapı kapalıysa duvar gibi davransın.
    for(let cDoor of cellDoors){
        if(!cDoor.isOpen){
            if(checkCollision({x: nextX, y: player.y, width: player.width, height: player.height}, cDoor))
                canMoveX = false;
            if(checkCollision({x: player.x, y: nextY, width: player.width, height: player.height}, cDoor))
                canMoveY = false;
        }
    }

    if (canMoveX) player.x = nextX;
    if (canMoveY) player.y = nextY;
/*
    if (door && checkCollision(player, door)) {
        currentLevel++;
        if (currentLevel < levels.length) loadLevel(currentLevel);
        else gameState = "FINISHED";
    }
*/

    if(door){
        let isNearDoor = checkCollision(interactArea, door);
        if(isNearDoor && (input.keys['KeyE'] || input.keys['e']) && player.inventory.yellow){
            currentLevel++;
            if(currentLevel < levels.length)
                loadLevel(currentLevel);
            else
                gameState = "FINISHED";
        }
    }
}

// Ne kadar yakınlaşacağımızı belirliyoruz (Örn: 2 kat)
const zoom = 3; 

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

        // ana çıkış kapısı burada
        if (door) {
            ctx.drawImage(imgYellowDoor, door.x, door.y, door.width, door.height);
        }

        // anahtarların çizimi burada
        for(let key of collectibleKeys){
            if(key.color === 'yellow')
                ctx.drawImage(imgKeyYellow, key.x, key.y, key.width, key.height);
            else if(key.color === 'blue')
                ctx.drawImage(imgKeyBlue, key.x, key.y, key.width, key.height);
            else if(key.color === 'red')
                ctx.drawImage(imgKeyRed, key.x, key.y, key.width, key.height);
        }

        // kapıların çizimi burada
        for(let cDoor of coloredDoors){
            if(!cDoor.isOpen){
                if(cDoor.color === 'blue')
                    ctx.drawImage(imgBlueDoor, cDoor.x, cDoor.y, cDoor.width, cDoor.height);
                else if(cDoor.color === 'red')
                    ctx.drawImage(imgRedDoor, cDoor.x, cDoor.y, cDoor.width, cDoor.height);
            }
        }

        // hücre kapılarını çiziyoruz
        for(let cDoor of cellDoors){
            if(cDoor.isOpen){
                ctx.drawImage(imgCellDoorOpened,cDoor.x, cDoor.y, cDoor.width, cDoor.height);
            }else{
                ctx.drawImage(imgCellDoorClosed,cDoor.x, cDoor.y, cDoor.width, cDoor.height);
            }
        }

        // kameraları çiziyoruz
        for(let cam of cameras){
            cam.draw(ctx);
        }

        player.draw(ctx);

        for (let guard of guards) {
            guard.draw(ctx);
        }       
        
        // ----------------------------------------------------------------------
        for (let bed of beds) {
            ctx.drawImage(imgBed, bed.x, bed.y, bed.width, bed.height);
        }

        ctx.restore(); // KAMERA BİTİŞİ: Ayarları sıfırla

        // bir UI ile ekranın alt tarafında kameranın aktif olduğunu belirtiyoruz
        if(globalAlarmTriggered){
            ctx.fillStyle = 'red';
            ctx.font = '40px Arial';
            ctx.textAlign = 'center';
            ctx.fillText('ALERT!', canvas.width / 2, canvas.height - 50);
        }

        // Not: ctx.restore() yapmazsak, ekrana yazdıracağımız skor veya 
        // menü yazıları da oyuncuyla beraber hareket eder ve dev gibi olur.

    } else if (gameState === "FINISHED") {
        // Oyun bitiş yazısı (Kameradan bağımsız, hep ortada durur)
        ctx.fillStyle = '#f1c40f';
        ctx.font = '64px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('KAÇIŞ BAŞARILI!', canvas.width / 2, canvas.height / 2);
    } else if (gameState === "GAMEOVER") {
        ctx.fillStyle = '#e74c3c';
        ctx.font = '64px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('YAKALANDIN!', canvas.width / 2, canvas.height / 2);
    }
}

function gameLoop(timestamp) {
    let deltaTime = (timestamp - lastTime) / 1000;
    lastTime = timestamp;

    // Eğer deltaTime çok büyükse (örneğin sekme alta alındıysa) hataları önlemek için sınırla
    if (deltaTime > 0.1) deltaTime = 0.1;

    update(deltaTime);
    draw();
    
    requestAnimationFrame(gameLoop);
}

loadLevel(currentLevel);

requestAnimationFrame((timestamp) => {
    lastTime = timestamp;
    gameLoop(timestamp);
});