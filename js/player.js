class Player {
    constructor() {
        this.width = 24;
        this.height = 24;
        this.x = 100;
        this.y = 500;
        this.speed = 200;

        // Durma Resmi
        this.imgIdle = new Image();
        this.imgIdle.src = './assets/entity/playeridle.png';

        // Koşma Resimleri
        this.imgRun1 = new Image();
        this.imgRun1.src = './assets/entity/playerrun1.png'; 
        
        this.imgRun2 = new Image();
        this.imgRun2.src = './assets/entity/playerrun2.png'; 

        // Koşma resimleri bir listede toplandı
        this.runImages = [this.imgRun1, this.imgRun2]; 

        // Ekranda gösterilecek aktif resim (Başlangıçta durma)
        this.currentImage = this.imgIdle; 
        
        // Animasyon sayaçları
        this.frameIndex = 0; 
        this.animTimer = 0;
        this.facingRight = true;

        // Envanter sistemi
        this.inventory = {
            yellow: 0,
            blue: false,
            red: false
        };
    }
    
    // Karakter hareket ediyorsa bu fonksiyon çalışacak
    updateAnimation(isMoving, deltaTime) {
        if (isMoving) {
            this.animTimer += deltaTime;
            
            // Her 10 döngüde bir resmi değiştirir. (Koşma animasyonu)
            if (this.animTimer >= 0.15) {
                this.frameIndex = this.frameIndex === 0 ? 1 : 0; 
                this.currentImage = this.runImages[this.frameIndex]; 
                this.animTimer = 0;
            }
        } else {
            // Hareket etmiyorsa başa dön
            this.currentImage = this.imgIdle;
            this.frameIndex = 0;
            this.animTimer = 0;
        }
    }

    // Karakter Çizimi
    draw(ctx) {
        ctx.save();

        if (this.facingRight) {
            // Normal Çizim (Sağa bakarken)
            ctx.drawImage(this.currentImage, this.x, this.y, this.width, this.height);
        } else {
            // Ters çizim (Sola bakarken)
            ctx.translate(this.x + this.width, this.y); 
            
            // X eksenini ters çevir (Ayna etkisi)
            ctx.scale(-1, 1);

            ctx.drawImage(this.currentImage, 0, 0, this.width, this.height);
        }

        ctx.restore();
    }
}