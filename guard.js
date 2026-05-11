// guard.js
class Guard {
    constructor(x, y) {
        // Boyutlar (TILE_SIZE 40 iken karakterler 32x32)
        this.width = 24;
        this.height = 24;
        
        // Spawn konumunu hücrenin ortasına ayarla
        this.x = x + (32 - this.width) / 2; 
        this.y = y + (32 - this.height) / 2;

        this.speed = 120; // Oyuncudan yavaş
        this.visionRange = 160; // Görüş alanı (yarıçap)
        this.facingRight = true;
        this.state = "WANDER"; // WANDER, CHASE

        // Rastgele dolaşma ayarları
        this.dirX = 0;
        this.dirY = 0;
        this.wanderTimer = 0;

        // --- ASSET YÜKLEME (Player.js ile aynı mantık) ---
        this.imgIdle = new Image();
        this.imgIdle.src = "./assets/entity/copidle.png";

        this.imgK1 = new Image();
        this.imgK1.src = "./assets/entity/coprun1.png";

        this.imgK2 = new Image();
        this.imgK2.src = "./assets/entity/coprun2.png";

        // Koşma resimlerini bir dizide tut
        this.kosmaResimleri = [this.imgK1, this.imgK2];
        this.currentImage = this.imgIdle; // Başlangıçta idle

        // Animasyon sayaçları
        this.frameIndex = 0;
        this.animTimer = 0;
    }

    update(deltaTime, player, walls) {
        // 1. OYUNCU İLE MESAFEYİ ÖLÇ (Pisagor)
        let dx = player.x - this.x;
        let dy = player.y - this.y;
        let distance = Math.sqrt(dx * dx + dy * dy);

        // 2. YAPAY ZEKA DURUM GEÇİŞLERİ
        if (distance < this.visionRange) {
            this.state = "CHASE"; // Alanına girerse kovala
        } else if (this.state === "CHASE" && distance > this.visionRange * 1.5) {
            this.state = "WANDER"; // Çok uzaklaşırsa kovalamayı bırak
            this.wanderTimer = 0; // Hemen yeni yön seçmesi için
        }

        let nextX = this.x;
        let nextY = this.y;
        let moveAmount = this.speed * deltaTime;
        let moving = false;

        // 3. HAREKET MANTIĞI
        if (this.state === "CHASE") {
            // Oyuncuya doğru yönel (Vektörü normalize et)
            if (distance > 5) { // Titremeyi önlemek için çok yakınsa dur
                nextX += (dx / distance) * moveAmount;
                nextY += (dy / distance) * moveAmount;
                moving = true;
            }
        } else {
            // WANDER: Rastgele dolaş
            this.wanderTimer -= deltaTime;
            if (this.wanderTimer <= 0) {
                // Rastgele yön seç (Sağ, Sol, Yukarı, Aşağı)
                let directions = [ {x:1, y:0}, {x:-1, y:0}, {x:0, y:1}, {x:0, y:-1} ];
                let randomDir = directions[Math.floor(Math.random() * directions.length)];
                this.dirX = randomDir.x;
                this.dirY = randomDir.y;
                
                // 1 ile 3 saniye arasında bu yönde git
                this.wanderTimer = 1 + Math.random() * 2; 
            }
            nextX += this.dirX * moveAmount;
            nextY += this.dirY * moveAmount;
            moving = true;
        }

        // 4. YÖNÜ AYARLA (Aynalama için)
        // Kovalamada oyuncunun yönüne, dolaşmada hareket yönüne bak
        let directionCheck = (this.state === "CHASE") ? dx : this.dirX;
        
        if (directionCheck > 0) this.facingRight = true;
        else if (directionCheck < 0) this.facingRight = false;

        // 5. DUVAR ÇARPIŞMALARI (main'deki checkCollision'ı kullanır)
        let canMoveX = true;
        let canMoveY = true;

        for (let wall of walls) {
            // X Çarpışması
            if (checkCollision({ x: nextX, y: this.y, width: this.width, height: this.height }, wall)) {
                canMoveX = false;
                if (this.state === "WANDER") this.wanderTimer = 0; // Duvara çarparsa yön değiştir
            }
            // Y Çarpışması
            if (checkCollision({ x: this.x, y: nextY, width: this.width, height: this.height }, wall)) {
                canMoveY = false;
                if (this.state === "WANDER") this.wanderTimer = 0;
            }
        }

        if (canMoveX) this.x = nextX;
        if (canMoveY) this.y = nextY;

        // 6. ANİMASYON GÜNCELLEME (kosuyorSA)
        if (moving) {
            this.animTimer++;
            // Her 12 frame'de bir resmi değiştir (yavaş yürüme)
            if (this.animTimer % 12 === 0) {
                this.frameIndex = (this.frameIndex + 1) % this.kosmaResimleri.length;
                this.currentImage = this.kosmaResimleri[this.frameIndex];
            }
        } else {
            this.currentImage = this.imgIdle; // Duruyorsa idle
        }

        // 7. OYUNCUYU YAKALADI MI?
        return checkCollision(this, player);
    }

    draw(ctx) {
        // (İsteğe bağlı) Görüş alanını şeffaf kırmızı çiz (debug için)
        /*
        ctx.beginPath();
        ctx.arc(this.x + this.width/2, this.y + this.height/2, this.visionRange, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(255, 0, 0, 0.1)";
        ctx.fill();
        */

        ctx.save();

        if (this.facingRight) {
            // Sağ (Normal çizim)
            ctx.drawImage(this.currentImage, this.x, this.y, this.width, this.height);
        } else {
            // Sol (Aynalama)
            ctx.translate(this.x + this.width, this.y); 
            ctx.scale(-1, 1); 
            ctx.drawImage(this.currentImage, 0, 0, this.width, this.height);
        }

        ctx.restore();
    }
}