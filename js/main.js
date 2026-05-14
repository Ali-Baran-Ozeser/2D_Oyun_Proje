const canvas = document.createElement('canvas'); // Canvas dinamik şekilde oluşturuldu
const ctx = canvas.getContext('2d');

canvas.width = 1280;
canvas.height = 720;
document.body.appendChild(canvas);

ctx.imageSmoothingEnabled = false; // Bulanıklaştırma kapalı

const player = new Player();
const input = new InputHandler(); 

// Oluşturulmuş leveli haritaya yüklüyoruz
function loadLevel(levelIndex) {
    walls = [];
    cellDoors = [];
    cameras = [];
    guards = [];
    beds = [];
    collectibleKeys = [];
    coloredDoors = [];   
    door = null;

    const map = levels[levelIndex];

    // Levele göre listeleri dolduruyoruz
    for (let row = 0; row < map.length; row++) {
        for (let col = 0; col < map[row].length; col++) {
            const tileId = map[row][col];
            const x = col * TILE_SIZE;
            const y = row * TILE_SIZE;

            if (tileId === 1){ 
                walls.push({ x: x, y: y, width: TILE_SIZE, height: TILE_SIZE });
            }    
            else if (tileId === 2){
                 door = { x: x, y: y, width: TILE_SIZE, height: TILE_SIZE };
            }     
            else if (tileId === 3) {
                player.x = x + (TILE_SIZE - player.width) / 2;
                player.y = y + (TILE_SIZE - player.height) / 2;
                player.inventory = {yellow: 0, blue: false, red: false};
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

// Çarpışma kontrolü
function checkCollision(rect1, rect2) {
    return (
        rect1.x < rect2.x + rect2.width &&
        rect1.x + rect1.width > rect2.x &&
        rect1.y < rect2.y + rect2.height &&
        rect1.y + rect1.height > rect2.y
    );
}

let lastTime = 0;


function update(deltaTime) { // Her frame çalışır. Gizlilik, hareket ve çarpışmaları kontrol eder
    if (gameState !== "PLAYING") return;

    let nextX = player.x;
    let nextY = player.y;
    let isMoving = false; 

    let moveAmount = player.speed * deltaTime;

    globalAlarmTriggered = false;

    // Karakter yatağın altına girdiğinde gizlenir
    player.isHidden = false;
    for (let bed of beds) {
        if (checkCollision(player, bed)) {
            player.isHidden = true;
            break;
        }
    }

    // Karakter saklanıyorsa gardiyanlara çok uzakta sahte bir hedef göster
    let targetPlayer = player.isHidden ? { x: -9999, y: -9999, width: 0, height: 0 } : player;

    // Kamera ve Guard Güncellemeleri
    for(let cam of cameras){
        cam.update(deltaTime, targetPlayer);
    }

    for (let guard of guards) {
        let isCaught = guard.update(deltaTime, targetPlayer, walls, cellDoors);
        
        if (isCaught && !player.isHidden) {
            if (gameState !== "GAMEOVER") {
                gameState = "GAMEOVER";
                audioBGM.pause();
                audioLose.currentTime = 0;
                audioLose.volume = volSFX;
                audioLose.play();
            }
        }
    }

    // Karakter Hareketi
    if (input.keys['KeyW'] || input.keys['ArrowUp']) { nextY -= moveAmount; isMoving = true; }
    if (input.keys['KeyS'] || input.keys['ArrowDown']) { nextY += moveAmount; isMoving = true; }
    if (input.keys['KeyA'] || input.keys['ArrowLeft']) { nextX -= moveAmount; isMoving = true; player.facingRight = false;}
    if (input.keys['KeyD'] || input.keys['ArrowRight']) { nextX += moveAmount; isMoving = true; player.facingRight = true;}

    // Kapı ve Karakter Etkileşimi
    let interactArea = {
        x: player.x - 5,
        y: player.y - 5,
        width: player.width + 10,
        height: player.height + 10
    };

    // Anahtarları topluyoruz.
    for(let i = collectibleKeys.length - 1; i >= 0; i--){
        if(checkCollision(player, collectibleKeys[i])){
            let color = collectibleKeys[i].color;
            if (color === 'yellow') player.inventory.yellow++;
            else player.inventory[color] = true;
            
            audioKey.currentTime = 0;
            audioKey.volume = volSFX;
            audioKey.play();

            collectibleKeys.splice(i, 1);
        }
    }

    // Kilitli kapıları açıp açamadığımızı kontrol ediyoruz
    for(let cDoor of coloredDoors){
        let isNear = checkCollision(interactArea, cDoor);
        if(isNear && (input.keys['KeyE'] || input.keys['e'])){
            if(cDoor.color === 'blue' && player.inventory.blue)
                cDoor.isOpen = true;
            if(cDoor.color === 'red' && player.inventory.red)
                cDoor.isOpen = true;
        }
    }

    // Hücre kapılarını açıp açamadığımızı kontrol ediyoruz
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
    player.updateAnimation(isMoving, deltaTime);


    // Kapılar ve Duvarların Çarpışma Kontrolleri
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

    // Oyun Sonu Kontrolü
    if(door){
        let isNearDoor = checkCollision(interactArea, door);
        if(isNearDoor && (input.keys['KeyE'] || input.keys['e']) && player.inventory.yellow >= 5){
            if (gameState !== "FINISHED") {
                gameState = "FINISHED";
                audioBGM.pause();
                audioWin.currentTime = 0;
                audioWin.volume = volSFX;
                audioWin.play();
            }
        }
    }
}

const zoom = 3; 

// Oyundaki Bütün Çizimler
function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height); // Her defasında önce ekranı temizliyoruz

    if (gameState === "PLAYING") {
        ctx.save(); 

        // Kamera Hizalama
        let camX = player.x + (player.width / 2) - (canvas.width / 2) / zoom;
        let camY = player.y + (player.height / 2) - (canvas.height / 2) / zoom;

        ctx.scale(zoom, zoom); 
        ctx.translate(-camX, -camY); 

        // Zemin Çizimi
        const currentMap = levels[currentLevel];
        for(let row = 0; row < currentMap.length; row++){
            for(let col = 0; col < currentMap[row].length; col++){
                const x = col * TILE_SIZE;
                const y = row * TILE_SIZE;
                ctx.drawImage(imgGround, x, y, TILE_SIZE, TILE_SIZE);
            }
        }

        ctx.save();
        
        // Başlangıçta Sol Taraftaki Yazılar
        ctx.fillStyle = "rgba(255, 255, 255, 0.8)"; 
        ctx.font = '5px "Press Start 2P"';

        
        let baslangicX = -150; 
        let baslangicY = 20; 

        ctx.fillText("HAREKET: WASD | YÖN TUŞLARI ", baslangicX, baslangicY);
        ctx.fillText("ETKİLEŞİM: E", baslangicX, baslangicY + 20);

        ctx.fillText("ANAHTARLARI TOPLA VE ", baslangicX + 20, baslangicY + 60);
        ctx.fillText("HAPİSHANEDEN KAÇ!", baslangicX + 30, baslangicY + 70);
        ctx.restore();
        
        // Duvarlar
        for (let wall of walls) {
            ctx.drawImage(imgWall, wall.x, wall.y, wall.width, wall.height);
        }

        // Ana Çıkış Kapısı
        if (door) {
            ctx.drawImage(imgYellowDoor, door.x, door.y, door.width, door.height);
        }

        // Anahtarlar
        for(let key of collectibleKeys){
            if(key.color === 'yellow')
                ctx.drawImage(imgKeyYellow, key.x, key.y, key.width, key.height);
            else if(key.color === 'blue')
                ctx.drawImage(imgKeyBlue, key.x, key.y, key.width, key.height);
            else if(key.color === 'red')
                ctx.drawImage(imgKeyRed, key.x, key.y, key.width, key.height);
        }

        // Renkli Kapılar
        for(let cDoor of coloredDoors){
            if(!cDoor.isOpen){
                if(cDoor.color === 'blue')
                    ctx.drawImage(imgBlueDoor, cDoor.x, cDoor.y, cDoor.width, cDoor.height);
                else if(cDoor.color === 'red')
                    ctx.drawImage(imgRedDoor, cDoor.x, cDoor.y, cDoor.width, cDoor.height);
            }
        }

        // Hücre Kapıları
        for(let cDoor of cellDoors){
            if(cDoor.isOpen){
                ctx.drawImage(imgCellDoorOpened,cDoor.x, cDoor.y, cDoor.width, cDoor.height);
            }else{
                ctx.drawImage(imgCellDoorClosed,cDoor.x, cDoor.y, cDoor.width, cDoor.height);
            }
        }

        // Kameralar
        for(let cam of cameras){
            cam.draw(ctx);
        }

        player.draw(ctx); // Karakter

        // Yataklar (Karakterden sonra gardiyanlardan önce çiziyoruz ki gizlenmiş gibi olsun)
        for (let bed of beds) {
            ctx.drawImage(imgBed, bed.x, bed.y, bed.width, bed.height);
        }

        // Gardiyanlar
        for (let guard of guards) {
            guard.draw(ctx);
        }       
        
        ctx.restore(); // Kamera Bitişi: Ayarları sıfırla

        // Sağ üstte bulunan anahtar sayacı
        const iconSize = 32; 
        const posX = canvas.width - 100;
        const posY = 15;

        ctx.drawImage(imgKeyYellow, posX, posY, iconSize, iconSize);

        ctx.fillStyle = 'white';
        ctx.font = '16px "Press Start 2P"';
        ctx.textAlign = 'left';
        ctx.fillText(`x ${player.inventory.yellow}`, posX + iconSize + 5, posY + 26);
        
        // Menü
    } else if (gameState === "MENU") {
        ctx.fillStyle = 'white'; ctx.font = '48px "Press Start 2P"'; ctx.textAlign = 'center';
        ctx.fillText('HAPİSHANEDEN KAÇIŞ', canvas.width/2, 200);

        ctx.fillStyle = input.isHover(540, 300, 200, 50) ? '#e67e22' : '#d35400';
        ctx.fillRect(540, 300, 200, 50);
        ctx.fillStyle = 'white'; ctx.font = '16px "Press Start 2P"'; ctx.fillText('Oyunu Başlat', canvas.width/2, 335);

        ctx.fillStyle = input.isHover(540, 380, 200, 50) ? '#7f8c8d' : '#95a5a6';
        ctx.fillRect(540, 380, 200, 50);
        ctx.fillStyle = 'white'; ctx.fillText('Ayarlar', canvas.width/2, 415);

    } else if (gameState === "SETTINGS") {
        ctx.fillStyle = 'white'; ctx.font = '16px "Press Start 2P"'; ctx.textAlign = 'center';
        ctx.fillText('AYARLAR', canvas.width/2, 150);

        // Müzik Barı
        ctx.font = '16px "Press Start 2P"'; ctx.fillText('Müzik Sesi', canvas.width/2, 250);
        ctx.fillStyle = '#555'; ctx.fillRect(440, 280, 400, 20);
        ctx.fillStyle = '#2ecc71'; ctx.fillRect(440, 280, 400 * volBGM, 20); 

        // Efekt Barı
        ctx.fillStyle = 'white'; ctx.fillText('Efekt Sesi', canvas.width/2, 360);
        ctx.fillStyle = '#555'; ctx.fillRect(440, 390, 400, 20); 
        ctx.fillStyle = '#3498db'; ctx.fillRect(440, 390, 400 * volSFX, 20); 

        ctx.fillStyle = input.isHover(540, 500, 200, 50) ? '#c0392b' : '#e74c3c';
        ctx.fillRect(540, 500, 200, 50);
        ctx.fillStyle = 'white'; ctx.fillText('Geri', canvas.width/2, 535);

    } else if (gameState === "FINISHED" || gameState === "GAMEOVER") {
        ctx.fillStyle = gameState === "FINISHED" ? '#f1c40f' : '#e74c3c';
        ctx.font = '48px "Press Start 2P"'; ctx.textAlign = 'center';
        ctx.fillText(gameState === "FINISHED" ? 'KAÇIŞ BAŞARILI!' : 'YAKALANDIN!', canvas.width/2, 250);

        ctx.fillStyle = input.isHover(540, 350, 200, 50) ? '#27ae60' : '#2ecc71';
        ctx.fillRect(540, 350, 200, 50);
        ctx.fillStyle = 'white'; ctx.font = '16px "Press Start 2P"'; ctx.fillText('Tekrar Oyna', canvas.width/2, 385);
    }
}

// Oyun Döngüsü (Her bilgisayarda aynı şekilde gözükmesi için DeltaTime kullanıldı)
function gameLoop(timestamp) {
    let deltaTime = (timestamp - lastTime) / 1000;
    lastTime = timestamp;

    // Eğer deltaTime çok büyükse sınırla
    if (deltaTime > 0.1) deltaTime = 0.1;

    if (gameState === "MENU") {
        if (input.isClicked(540, 300, 200, 50)) { gameState = "PLAYING"; audioBGM.play(); }
        if (input.isClicked(540, 380, 200, 50)) { gameState = "SETTINGS"; }
    } else if (gameState === "SETTINGS") {
        if (input.isDragging(440, 270, 400, 40)) { volBGM = (input.mouse.x - 440) / 400; volBGM = Math.max(0, Math.min(1, volBGM)); audioBGM.volume = volBGM; }
        if (input.isDragging(440, 380, 400, 40)) { volSFX = (input.mouse.x - 440) / 400; volSFX = Math.max(0, Math.min(1, volSFX)); }
        if (input.isClicked(540, 500, 200, 50)) { gameState = "MENU"; }
    } else if (gameState === "FINISHED" || gameState === "GAMEOVER") {
        if (input.isClicked(540, 350, 200, 50)) { 
            loadLevel(currentLevel); // Oyunu sıfırla
            gameState = "PLAYING";
            audioWin.pause(); 
            audioLose.pause();
            audioBGM.play(); 
        }
    }

    input.mouse.click = false; // Tıklama durumu her zaman true kalmasın diye

    update(deltaTime);
    draw();
    
    requestAnimationFrame(gameLoop);
}

loadLevel(currentLevel); // Leveli yükler

// Oyun döngüsünü tetikler
requestAnimationFrame((timestamp) => {
    lastTime = timestamp;
    gameLoop(timestamp);
});