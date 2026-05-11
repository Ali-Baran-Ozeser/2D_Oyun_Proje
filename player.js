class Player {
    constructor() {
        this.width = 24;
        this.height = 24;
        this.x = 100;
        this.y = 500;
        this.speed = 200;

        // 1. DURMA RESMİ
        this.imgIdle = new Image();
        this.imgIdle.src = './assets/entity/playeridle.png';

        // 2. KOŞMA RESİMLERİ (Kendi dosya adlarını buraya yaz)
        this.imgRun1 = new Image();
        this.imgRun1.src = './assets/entity/playerrun1.png'; 
        
        this.imgRun2 = new Image();
        this.imgRun2.src = './assets/entity/playerrun2.png'; 

        // Koşma resimlerini bir listede topladık
        this.runImages = [this.imgRun1, this.imgRun2]; 

        // Ekranda gösterilecek aktif resim (Başlangıçta durma)
        this.currentImage = this.imgIdle; 
        
        // Animasyon sayaçları
        this.frameIndex = 0; // 0 veya 1 (Hangi koşma resmi)
        this.animTimer = 0;  // Hız ayarlayıcı
        this.facingRight = true;
    }

    // Karakter hareket ediyorsa (isMoving = true) bu fonksiyon çalışacak
    updateAnimation(isMoving) {
        if (isMoving) {
            this.animTimer++;
            
            // Her 10 döngüde bir resmi değiştir (Sayıyı büyüterek yavaşlatabilirsin)
            if (this.animTimer % 10 === 0) {
                // frameIndex 0 ise 1 yap, 1 ise 0 yap
                this.frameIndex = this.frameIndex === 0 ? 1 : 0; 
                this.currentImage = this.runImages[this.frameIndex]; // Yeni resmi ekrana ver
            }
        } else {
            // Hareket etmiyorsa başa dön
            this.currentImage = this.imgIdle;
            this.frameIndex = 0;
        }
    }

    draw(ctx) {
        ctx.save(); // Ayarları kaydet (Diğer çizimler bozulmasın diye)

        if (this.facingRight) {
            // NORMAL ÇİZİM (Sağa bakarken)
            ctx.drawImage(this.currentImage, this.x, this.y, this.width, this.height);
        } else {
            // TERS ÇİZİM (Sola bakarken)
            
            // 1. Çizim noktasını karakterin sağ üst köşesine taşı
            ctx.translate(this.x + this.width, this.y); 
            
            // 2. X eksenini ters çevir (Ayna etkisi)
            ctx.scale(-1, 1); 
            
            // 3. Karakteri yeni sıfır noktasına (0,0) çiz
            ctx.drawImage(this.currentImage, 0, 0, this.width, this.height);
        }

        ctx.restore(); // Ayarları eski haline döndür
    }
}