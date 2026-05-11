class securityCamera{
    constructor(x, y, startAngle = Math.PI / 2){ // direkt aşağı bakacak şekilde başlayacak.
        this.x = x;
        this.y = y;
        this.range = 150;
        this.fov = Math.PI / 3; // 60 derece olarak bakacak.
        this.angle = startAngle;

        // sağa sola dönmeyi ayarlayacak.
        this.minAngle = startAngle - (Math.PI / 4) // sola max dönüş için
        this.maxAngle = startAngle + (Math.PI / 4) // sağa max dönüş için
        this.rotationSpeed = 0.5; // dönüş hızı
        this.turnDirection = 1; // 1 -> sağa -1-> sola dönüş

        this.isAlert = false; // oyuncuyu görürse true olacak.
    }

    update(deltaTime,player){
        this.angle += this.rotationSpeed * this.turnDirection * deltaTime;

        if(this.angle >= this.maxAngle){
            this.angle = this.maxAngle;
            this.turnDirection = -1;
        }else if(this.angle <= this.minAngle){
            this.angle = this.minAngle;
            this.turnDirection = 1;
        }

        this.isAlert = this.checkPlayerInView(player);

        if(this.isAlert)
            globalAlarmTriggered = true;
    }

    checkPlayerInView(player){
        // kamera ve oyuncunun orta noktalarını bulup farklarına bakıyoruz. Aradaki mesafeyi buluyoruz ve bu mesafeyi kontrol ediyoruz.
        let cx = this.x + TILE_SIZE / 2;
        let cy = this.y + TILE_SIZE / 2;
        let px = player.x + player.width / 2;
        let py = player.y + player.height / 2;

        let dx = px - cx;
        let dy = py - cy;

        let distance = Math.sqrt(dx*dx + dy*dy);
        if(distance > this.range) return false;
        // kamera ile player arasındaki açıyı buluyoruz.
        let angleToPlayer = Math.atan2(dy, dx);
        let angleDifference = angleToPlayer - this.angle;
        while(angleDifference <= -Math.PI)
            angleDifference += Math.PI * 2;
        while(angleDifference > Math.PI)
            angleDifference -= Math.PI * 2;

        if(Math.abs(angleDifference) < this.fov / 2)
            return true;
        return false;
    }

    draw(ctx){
        let cx = this.x + TILE_SIZE / 2;
        let cy = this.y + TILE_SIZE / 2;

        // görüş alanı ve ışığı çiziyoruz. (alarmda ise kırmızı, değilse sarı yanacak)
        ctx.fillStyle = this.isAlert ? 'rgba(231, 76, 60, 0.4)' : 'rgba(234, 193, 30, 0.3)';

        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.arc(cx, cy, this.range, this.angle - this.fov / 2, this.angle + this.fov / 2);
        ctx.lineTo(cx, cy);
        ctx.fill();

        ctx.fillStyle = '#2c3e50';
        ctx.beginPath();
        ctx.arc(cx, cy, 8, 0, Math.PI * 2);
        ctx.fill();

        

    }
}