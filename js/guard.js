class Guard {
    constructor(x, y) {
        this.width = 24;
        this.height = 24;
        this.x = x + (32 - this.width) / 2; 
        this.y = y + (32 - this.height) / 2;

        this.speed = 120; 
        this.visionRange = 160; 
        this.visionAngle = Math.PI / 3; // Görüş açısı pasta dilimi şeklinde. (Her iki yöne 60 derece)
        this.state = "WANDER"; 
        
        // Varsayılan bakış yönü 
        this.dirX = 1; 
        this.dirY = 0;
        this.facingRight = true;
        this.wanderTimer = 0;

        // Guardların siyahi ya da beyaz olması
        this.type = Math.random() > 0.5 ? 'cop' : 'cop2';

        // Durma Resmi
        this.imgIdle = new Image();
        this.imgIdle.src = `./assets/entity/${this.type}idle.png`;

        // Koşma Resimleri
        this.imgK1 = new Image();
        this.imgK1.src = `./assets/entity/${this.type}run1.png`;

        this.imgK2 = new Image();
        this.imgK2.src = `./assets/entity/${this.type}run2.png`;

        // Koşma resimleri bir listede toplandı
        this.kosmaResimleri = [this.imgK1, this.imgK2];
        this.currentImage = this.imgIdle; 

        this.frameIndex = 0;
        this.animTimer = 0;
    }

    // Işın izleme ile duvar kontrolü
    hasLineOfSight(player, walls, cellDoors) {
        let x1 = this.x + this.width / 2;
        let y1 = this.y + this.height / 2;
        let x2 = player.x + player.width / 2;
        let y2 = player.y + player.height / 2;

        let obstacles = [...walls];
        for (let door of cellDoors) if (!door.isOpen) obstacles.push(door);

        let dist = Math.hypot(x2 - x1, y2 - y1);
        let steps = dist / 10; 

        for (let i = 0; i <= steps; i++) {
            let px = x1 + (x2 - x1) * (i / steps);
            let py = y1 + (y2 - y1) * (i / steps);

            for (let obs of obstacles) {
                if (px > obs.x && px < obs.x + obs.width && py > obs.y && py < obs.y + obs.height) {
                    return false; 
                }
            }
        }
        return true; 
    }

    // Gardiyan Davranışı
    update(deltaTime, player, walls, cellDoors) {
        let dx = player.x - this.x;
        let dy = player.y - this.y;
        let distance = Math.sqrt(dx * dx + dy * dy);

        // Pasta Dilimi Görüş Alanı
        let angleToPlayer = Math.atan2(dy, dx);
        let guardAngle = Math.atan2(this.dirY, this.dirX);
        
        // İki açı arasındaki farkı bul ve 0-180 derece arasına sabitle
        let angleDiff = Math.abs(angleToPlayer - guardAngle);
        if (angleDiff > Math.PI) angleDiff = 2 * Math.PI - angleDiff;

        // Oyuncu menzildeyse, bakış açısındaysa ve arada duvar yoksa kovala
        if (distance < this.visionRange && angleDiff < this.visionAngle && this.hasLineOfSight(player, walls, cellDoors)){
            this.state = "CHASE";
        } else if (this.state === "CHASE" && distance > this.visionRange * 1.5) {
            this.state = "WANDER";
            this.wanderTimer = 0;
        }

        // Duruma göre gardiyanların hızının ayarlanması
        if (globalAlarmTriggered) {
            this.speed = 220; 
        } else if (this.state === "CHASE") {
            this.speed = 160; 
        } else {
            this.speed = 100; 
        }

        let moveX = 0;
        let moveY = 0;
        let moveAmount = this.speed * deltaTime;
        let moving = false;

        // Hareket ve Hücrelere Giriş Mantığı
        if (this.state === "CHASE") {
            let targetDX = dx;
            let targetDY = dy;
            let targetDist = distance;

            /*Eğer oyuncu bir hücreye (açık kapıya) yakınsa, 
            duvarı zorlamak yerine önce açık kapıyı hedef al! */
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
            // Wander (Dolaşma)
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

        // Duvara Takılmayı Önleme
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

        // Sadece boş olan eksende kaymaya devam et (Duvara yapışıp kalmasın diye)
        if (canMoveX) this.x = nextX;
        if (canMoveY) this.y = nextY;

        // Yön ve Animasyon Güncellemesi
        if (moveX !== 0 || moveY !== 0) {
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
            this.animTimer += deltaTime;
            if (this.animTimer >= 0.15) {
                this.frameIndex = (this.frameIndex + 1) % this.kosmaResimleri.length;
                this.currentImage = this.kosmaResimleri[this.frameIndex];
                this.animTimer = 0;
            }
        } else {
            this.currentImage = this.imgIdle;
            this.animTimer = 0;
        }

        return checkCollision(this, player);
    }

    draw(ctx) { // Gardiyanların çizimi
        ctx.save();
        if (this.facingRight) {
            ctx.drawImage(this.currentImage, this.x, this.y, this.width, this.height);
        } else {
            ctx.translate(this.x + this.width, this.y); 
            ctx.scale(-1, 1); 
            ctx.drawImage(this.currentImage, 0, 0, this.width, this.height);
        }
        ctx.restore();

        if (this.state === "CHASE") { // Kovalama durumunda ünlem işareti çıkacak
            ctx.save();
            ctx.fillStyle = "red";
            ctx.font = '12px "Press Start 2P"';
            ctx.textAlign = "center";
            ctx.fillText("!", this.x + this.width / 2, this.y - 10);
            ctx.restore();
        }
    }
}