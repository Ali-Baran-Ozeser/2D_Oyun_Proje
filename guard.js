// guard.js
class Guard {
    constructor(x, y) {
        this.width = 24;
        this.height = 24;
        this.x = x + (32 - this.width) / 2; 
        this.y = y + (32 - this.height) / 2;

        this.speed = 120; 
        this.visionRange = 160; 
        this.visionAngle = Math.PI / 3; // Görüş açısı (Pasta dilimi: Her iki yöne 60 derece)
        this.state = "WANDER"; 
        
        // Varsayılan bakış yönü (Açı hesaplaması için gerekli)
        this.dirX = 1; 
        this.dirY = 0;
        this.facingRight = true;
        this.wanderTimer = 0;

        // --- SİYAHİ/BEYAZ RASTGELE SEÇİMİ ---
        this.type = Math.random() > 0.5 ? 'cop' : 'cop2';

        this.imgIdle = new Image();
        this.imgIdle.src = `./assets/entity/${this.type}idle.png`;

        this.imgK1 = new Image();
        this.imgK1.src = `./assets/entity/${this.type}run1.png`;

        this.imgK2 = new Image();
        this.imgK2.src = `./assets/entity/${this.type}run2.png`;

        this.kosmaResimleri = [this.imgK1, this.imgK2];
        this.currentImage = this.imgIdle; 

        this.frameIndex = 0;
        this.animTimer = 0;
    }

    // UPDATE FONKSİYONUNA cellDoors EKLENDİ!
    update(deltaTime, player, walls, cellDoors) {
        let dx = player.x - this.x;
        let dy = player.y - this.y;
        let distance = Math.sqrt(dx * dx + dy * dy);

        // --- 1. PASTA DİLİMİ GÖRÜŞ ALANI (VISION CONE) ---
        let angleToPlayer = Math.atan2(dy, dx);
        let guardAngle = Math.atan2(this.dirY, this.dirX); // Gardiyanın anlık baktığı açı
        
        // İki açı arasındaki farkı bul ve 0-180 derece arasına sabitle
        let angleDiff = Math.abs(angleToPlayer - guardAngle);
        if (angleDiff > Math.PI) angleDiff = 2 * Math.PI - angleDiff;

        // Oyuncu menzildeyse VE bakış açısının (pasta diliminin) içindeyse kovala
        if (distance < this.visionRange && angleDiff < this.visionAngle) {
            this.state = "CHASE";
        } else if (this.state === "CHASE" && distance > this.visionRange * 1.5) {
            this.state = "WANDER";
            this.wanderTimer = 0;
        }

        let moveX = 0;
        let moveY = 0;
        let moveAmount = this.speed * deltaTime;
        let moving = false;

        // --- 2. HAREKET VE HÜCRELERE GİRİŞ MANTIĞI ---
        if (this.state === "CHASE") {
            let targetDX = dx;
            let targetDY = dy;
            let targetDist = distance;

            // HÜCRE SORUNU ÇÖZÜMÜ: Eğer oyuncu bir hücreye (açık kapıya) yakınsa, 
            // duvarı zorlamak yerine önce açık kapıyı hedef al!
            for (let door of cellDoors) {
                if (door.isOpen) {
                    let distPlayerToDoor = Math.hypot(player.x - door.x, player.y - door.y);
                    if (distPlayerToDoor < 64) { // Oyuncu kapıya veya hücreye girdiyse
                        targetDX = door.x - this.x;
                        targetDY = door.y - this.y;
                        targetDist = Math.hypot(targetDX, targetDY);
                        break; 
                    }
                }
            }

            if (targetDist > 5) {
                moveX = (targetDX / targetDist) * moveAmount;
                moveY = (targetDY / targetDist) * moveAmount;
                moving = true;
            }
        } else {
            // WANDER (Dolaşma)
            this.wanderTimer -= deltaTime;
            if (this.wanderTimer <= 0) {
                let directions = [ {x:1, y:0}, {x:-1, y:0}, {x:0, y:1}, {x:0, y:-1} ];
                let randomDir = directions[Math.floor(Math.random() * directions.length)];
                this.dirX = randomDir.x;
                this.dirY = randomDir.y;
                this.wanderTimer = 1 + Math.random() * 2; 
            }
            moveX = this.dirX * moveAmount;
            moveY = this.dirY * moveAmount;
            moving = true;
        }

        // --- 3. DUVARA TAKILMAYI ÖNLEYEN KAYDIRMA VE ÇARPIŞMA SİSTEMİ ---
        let nextX = this.x + moveX;
        let nextY = this.y + moveY;
        let canMoveX = true;
        let canMoveY = true;

        let obstacles = [...walls];
        for (let door of cellDoors) {
            let distToDoor = Math.hypot(door.x - this.x, door.y - this.y);
            if (distToDoor < 45) {
                door.isOpen = true; // Gardiyan yaklaştığında kapı açılır
            } else if (!door.isOpen) {
                obstacles.push(door);
            }
        }

        for (let obs of obstacles) {
            if (checkCollision({ x: nextX, y: this.y, width: this.width, height: this.height }, obs)) {
                canMoveX = false;
                if (this.state === "WANDER") this.wanderTimer = 0;
            }
            if (checkCollision({ x: this.x, y: nextY, width: this.width, height: this.height }, obs)) {
                canMoveY = false;
                if (this.state === "WANDER") this.wanderTimer = 0;
            }
        }

        // Sadece boş olan eksende kaymaya devam et (Duvara yapışıp kalmayı çözer)
        if (canMoveX) this.x = nextX;
        if (canMoveY) this.y = nextY;

        // --- 4. YÖNÜ VE ANİMASYONU GÜNCELLE ---
        if (moveX !== 0 || moveY !== 0) {
            // Bakış yönünü hareket edilen vektöre göre güncelle (Görüş açısı için şart)
            if (Math.abs(moveX) > Math.abs(moveY)) {
                this.dirX = moveX > 0 ? 1 : -1;
                this.dirY = 0;
            } else {
                this.dirX = 0;
                this.dirY = moveY > 0 ? 1 : -1;
            }
            this.facingRight = this.dirX !== -1;
        }

        if (moving) {
            this.animTimer++;
            if (this.animTimer % 12 === 0) {
                this.frameIndex = (this.frameIndex + 1) % this.kosmaResimleri.length;
                this.currentImage = this.kosmaResimleri[this.frameIndex];
            }
        } else {
            this.currentImage = this.imgIdle;
        }

        return checkCollision(this, player);
    }

    draw(ctx) {
        ctx.save();
        if (this.facingRight) {
            ctx.drawImage(this.currentImage, this.x, this.y, this.width, this.height);
        } else {
            ctx.translate(this.x + this.width, this.y); 
            ctx.scale(-1, 1); 
            ctx.drawImage(this.currentImage, 0, 0, this.width, this.height);
        }
        ctx.restore();
    }
}