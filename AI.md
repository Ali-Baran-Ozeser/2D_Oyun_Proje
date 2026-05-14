# Yapay Zeka Kullanım Raporu
**Kullanılan Araç:** Google Gemini

**Model:** Gemini 3.1 Pro

## Sohbet Kayıtları

**Prompt:** Web tabanlı oyunların çalışma mantığı nasıl ?


**Cevap:** Web tabanlı oyunlar, standart bir web sitesiyle aynı dilleri kullanır ancak tarayıcının işlem gücünü sınırlarına kadar zorlar. Temelde her şey tarayıcı (Chrome, Safari vb.) içinde gerçekleşir.

Sistemin üç ana ayağı vardır:

HTML (Sahne): Oyunun oynanacağı alanı tanımlar. Modern oyunlarda genellikle grafiklerin çizildiği <canvas> (tuval) etiketi kullanılır.

CSS (Dekor): Oyunun arayüzü, menüleri ve dış görünümleri tasarlanır.

JavaScript (Motor): Oyunun beynidir. Fiziği, kuralları, kontrolleri ve mantığı JavaScript yönetir.

Sıradan bir web sitesi sadece sen tıkladığında veya sayfayı kaydırdığında tepki verirken, oyunlar Oyun Döngüsü (Game Loop) sayesinde sürekli aktiftir. Tarayıcı, saniyede ortalama 60 kez (60 FPS) şu üç adımı hiç durmadan tekrarlar:

Girdi (Input): Klavyeden, fareden veya dokunmatik ekrandan gelen komutları algılar.

Güncelleme (Update): Karakterin hızını, yerçekimini, çarpışmaları (örneğin kurşunun duvara sekmesini) veya gardiyanın görüş alanını hesaplar.

Çizim (Render/Draw): Eski kareyi ekrandan siler ve hesaplanan yeni durumları HTML tuvaline (Canvas) çizer. Oyuncu bu hızlı resim değişimini akıcı bir animasyon olarak görür.

İstemci ve Sunucu İlişkisi:

Tek Oyunculu (Singleplayer): Tüm kodlar ve görseller (assetler) oyuncunun cihazına bir kez indirilir. Oyun tamamen kullanıcının cihazının işlemcisi (CPU/GPU) ile çalışır. İnternet kopsa bile oyun devam edebilir.

Çok Oyunculu (Multiplayer): Tarayıcı sadece çizim ve girdi alma işlemlerini yapar. Vuruldun mu, nereye hareket ettin gibi kritik hesaplamalar hile yapılmaması için uzaktaki bir Sunucuda (Server) hesaplanır ve anlık olarak (WebSockets ile) oyuncunun tarayıcısına iletilir.


---


**Prompt:** oyun içinde bir kamera sistemi yapmak istiyorum. bu kamera belli açıda alanı taraması gerekiyor. bunun için kullanmam gereken matematiği açıklayabilir misin?


**Cevap:** Bir gizlilik oyununda (örneğin yukarıdan bakışlı bir hırsızlık veya sızma oyununda) güvenlik kameralarının veya devriye gezen düşmanların görüş alanını (Field of View - FOV) hesaplamak için vektör matematiği ve trigonometri kullanman gerekir.

Bu sistemi koda dökerken temelde 3 adımlı bir matematiksel kontrol yaparsın: **Tarama (Hareket)**, **Mesafe Kontrolü** ve **Açı Kontrolü**.

### 1. Kameranın Tarama Hareketi (Sinüs Fonksiyonu)

Kameranın sabit bir noktada sağa ve sola yumuşak bir şekilde dönmesi (taraması) için en iyi yöntem bir **Sinüs ($sin$)** fonksiyonu kullanmaktır. Sinüs dalgası -1 ile +1 arasında değerler ürettiği için, zamana bağlı mükemmel bir salınım sağlar.

Kameranın o anki bakış açısını şu formülle hesaplayabilirsin:


$$ \text{Güncel Açı} = \text{Merkez Açı} + \sin(\text{Zaman} \times \text{Tarama Hızı}) \times \text{Tarama Genişliği} $$

* *Zaman:* Oyundaki geçen süre (örneğin `Time.time` veya milisaniye).
* *Tarama Genişliği:* Kameranın merkezden ne kadar sağa/sola sapacağı (örneğin 45 derece).

### 2. Mesafe Kontrolü (Pisagor Teoremi)

Karakterin kameranın görüş açısında olup olmadığını kontrol etmeden önce, kameranın menzili içinde olup olmadığına bakmak performansı artırır. İki nokta (Kamera $C$ ve Oyuncu $P$) arasındaki mesafeyi Öklid uzaklığı ile bulursun:

$$ \text{Mesafe} = \sqrt{(P_x - C_x)^2 + (P_y - C_y)^2} $$

Eğer $\text{Mesafe} \le \text{Kamera Menzili}$ şartı sağlanıyorsa, karakter kameraya yeterince yakındır ve bir sonraki adım olan açı kontrolüne geçilir.

### 3. Açı Kontrolü (Dot Product veya Atan2)

Karakterin, kameranın "görüş konisi" içinde kalıp kalmadığını anlamanın iki yaygın yolu vardır. 2D oyunlar (özellikle JavaScript Canvas projeleri) için **Atan2** çok pratikken, oyun motorlarında vektörlerin **Nokta Çarpımı (Dot Product)** daha sık kullanılır.

**Yöntem A: Yön Vektörleri ve Nokta Çarpım (Dot Product)**
Kameranın baktığı yönü belirten bir ileri vektörü ($\vec{F}$) ve kameradan oyuncuya doğru çizilen bir hedef vektörü ($\vec{D}$) olduğunu varsayalım. Bu iki vektör arasındaki açıyı ($\theta$) bulmak için Nokta Çarpım kuralı kullanılır:

$$ \vec{F} \cdot \vec{D} = |\vec{F}| |\vec{D}| \cos(\theta) $$

Vektörleri birim vektör (uzunluğu 1 olan normalize edilmiş vektör) haline getirirsen, nokta çarpım sana doğrudan aralarındaki açının kosinüsünü verir. Buradan açıyı bulup, kameranın toplam Görüş Açısının (FOV) yarısından küçük olup olmadığını kontrol edersin:


$$ \theta = \arccos(\vec{F_{norm}} \cdot \vec{D_{norm}}) $$

$$ \text{Şart: } \theta \le \frac{\text{FOV}}{2} $$

**Yöntem B: Trigonometrik Açı (Math.atan2)**
2D bir düzlemde çalışıyorsan, X ve Y koordinat farklarından yola çıkarak karakterin kameraya göre mutlak açısını bulabilirsin:

$$ \text{Hedef Açısı} = \text{atan2}(P_y - C_y, P_x - C_x) $$

Sonrasında kameranın baktığı açı ile hedefin açısı arasındaki mutlak farkı alırsın. Eğer bu fark $\frac{\text{FOV}}{2}$ değerinden küçükse, karakter kameranın görüş alanındadır.

Bu kavramların birbiriyle nasıl etkileşime girdiğini ve parametrelerin tarama alanını nasıl değiştirdiğini görmek için aşağıdaki simülasyonu inceleyebilirsin:


---


**Prompt:** oyun benim bilgisayarımda ve arkadaşımın bilgisayarında farklı hızda çalışıyor. Bu problemi nasıl çözebiliriz?


**Cevap:** Bu, oyun geliştirmeye başlayan herkesin karşılaştığı en klasik ve en önemli sorunlardan biridir! Oyun dünyasına hoş geldin. :)

Oyununun iki farklı bilgisayarda farklı hızlarda çalışmasının sebebi, hareket ve fizik hesaplamalarını **karelere (frame)** bağlı olarak yapmış olmandır.

Eğer oyun döngünde (muhtemelen `requestAnimationFrame` kullanıyorsun) karakterin pozisyonunu her karede sabit bir miktar artırıyorsan (örneğin `x += 5`), 60Hz monitörü olan ve saniyede 60 kare (FPS) çizen bir bilgisayarda karakterin saniyede **300 piksel** hareket eder. Ancak arkadaşının 144Hz oyuncu monitörü varsa veya bilgisayarı çok daha güçlüyse, saniyede 144 kare çizer ve karakteri **720 piksel** hareket eder! Arkadaşının bilgisayarında oyun adeta "ileri sarılmış" gibi görünür.

Bu problemi çözmenin altın kuralı **Delta Time (Zaman Farkı)** kullanmaktır.

### Çözüm: Delta Time Nedir ve Nasıl Kullanılır?

Oyununu *kareye bağlı* olmaktan çıkarıp *zamana bağlı* hale getirmelisin. Karakterin "her karede 5 piksel" değil, "her **saniyede** 300 piksel" hareket etmesini söylemelisin.

Bunun için son çizilen kare ile şu anki kare arasında geçen süreyi (Delta Time) hesaplayıp, hareket hızınla çarpman gerekir.

İşte JavaScript'te bunu nasıl yapacağının basit bir örneği:

```javascript
let sonKareZamani = 0;
let karakterX = 50;
let hizSaniyede = 300; // Karakter saniyede 300 piksel gitsin

function oyunDongusu(suAnkiZaman) {
    // 1. Delta Time'ı hesapla (milisaniye cinsinden geldiği için saniyeye çeviriyoruz)
    // İlk çalışmada suAnkiZaman undefined gelebilir, onu kontrol ediyoruz
    if (!suAnkiZaman) suAnkiZaman = performance.now();
    
    let deltaTime = (suAnkiZaman - sonKareZamani) / 1000; 
    sonKareZamani = suAnkiZaman;

    // Güvenlik: Eğer sekme arkada kalırsa deltaTime çok büyür, onu sınırla
    if (deltaTime > 0.1) deltaTime = 0.1;

    // 2. Hareketi Delta Time ile çarp (HIZ x ZAMAN = YOL)
    karakterX += hizSaniyede * deltaTime;

    // Çizim işlemleri...
    // c.clearRect(...)
    // c.fillRect(karakterX, y, genislik, yukseklik)

    requestAnimationFrame(oyunDongusu);
}

// Oyunu başlat
requestAnimationFrame(oyunDongusu);

```

Aşağıdaki simülasyonda bu mantığın nasıl çalıştığını FPS ayarını değiştirerek kendi gözlerinle görebilirsin:

Bu mantığı sadece oyuncunun yürümesine değil; düşman devriyelerine, mermi hızlarına, zıplama yerçekimine ve zamanla değişen her şeye (örneğin kameranın dönme hızına) uygulamalısın. Böylece oyunun ister hesap makinesinde ister NASA bilgisayarında çalışsın, herkes için aynı adil hızda oynanacaktır!

---


**Prompt:** Haritam Canvas'tan büyük. Karakter hareket ettikçe Canvas'ın karakteri ortalayarak takip etmesi için ne yapmalıyım?


**Cevap:** Canvas `ctx.translate()` metodunu kullanmalısın. Oyun döngüsünde her çizimden (render) önce ekranı temizleyip `ctx.save()` de. Ardından `ctx.translate(-player.x + canvas.width/2, -player.y + canvas.height/2)` işlemi ile odak noktasını oyuncuya kaydır. Çizimler bittikten sonra `ctx.restore()` ile kamerayı sıfırla.


**Prompt:** bir düşmanın bizi algılayıp bize doğru koşmasını nasıl yapabilirim? mantığını açıklar mısın? 

**Cevap:** Harika bir konuya geldik. Düşman yapay zekasının (AI) temellerine giriş yapıyoruz. Bir düşmanın karakterimizi algılayıp üzerine koşması, arka planda tamamen geometri ve vektör matematiğine dayanır.

Bunu adım adım, işin mutfağındaki matematiği inceleyerek anlatalım. İki temel aşamamız var: **Algılama (Mesafe Kontrolü)** ve **Yönelme (Vektör Normalizasyonu)**.

### 1. Aşama: Algılama (Düşman bizi nasıl görür?)

Düşmanın bizi fark etmesi için aramızdaki mesafenin belirli bir eşik değerinden (örneğin düşmanın görüş yarıçapından) küçük olması gerekir.

Bunun için lise yıllarından hatırlayacağın **Pisagor Teoremi**'ni, yani iki nokta arasındaki uzaklık formülünü (Euclidean Distance) kullanırız.

Düşmanın koordinatları $(E_x, E_y)$ ve oyuncunun koordinatları $(P_x, P_y)$ olsun.

Önce X ve Y eksenlerindeki farkları (delta) buluruz:


$$dx = P_x - E_x$$

$$dy = P_y - E_y$$

Sonra aradaki hipotenüsü, yani gerçek mesafeyi hesaplarız:


$$Mesafe = \sqrt{dx^2 + dy^2}$$

Eğer bu `Mesafe` değeri, düşmanın görüş menzilinden (örneğin 200 piksel) küçükse, düşman bizi algılamış demektir ve takip durumuna (Chase State) geçer.

### 2. Aşama: Yönelme ve Koşma (Nasıl takip eder?)

İşte işin en kritik ve genellikle hata yapılan kısmı burasıdır. Sadece $dx$ ve $dy$ değerlerini düşmanın hızına eklersen, oyuncu ne kadar uzaktaysa düşman o kadar hızlı koşmaya başlar (ışınlanıyormuş gibi görünür).

Düşmanın her yöne sabit bir hızla gitmesini sağlamak için elimizdeki yön vektörünü **Birim Vektöre (Normalized Vector)** çevirmemiz, yani uzunluğunu 1 yapmamız gerekir.

**Nasıl Normalizasyon Yaparız?**
Bulduğumuz X ve Y farklarını, az önce hesapladığımız toplam mesafeye böleriz. Böylece sadece "yönü" ifade eden, büyüklüğü 1 olan saf bir yön oku elde ederiz:

$$Y\ddot{o}n_x = \frac{dx}{Mesafe}$$

$$Y\ddot{o}n_y = \frac{dy}{Mesafe}$$

Artık elimizde saf yön bilgisi olduğuna göre, düşmanı hareket ettirmek için bunu düşmanın kendi hızıyla çarpmamız yeterlidir:

$$Yeni E_x = E_x + (Y\ddot{o}n_x \times H\imath z)$$

$$Yeni E_y = E_y + (Y\ddot{o}n_y \times H\imath z)$$

---

### Koda Dökülmüş Hali

Bu anlattığımız mantığı JavaScript ile oyun döngümüzün (`loop`) içine şu şekilde entegre ederiz:

```javascript
// Düşman nesnemiz
const enemy = {
    x: 700,
    y: 275,
    width: 50,
    height: 50,
    speed: 2,         // Karakterimizden biraz daha yavaş olsun
    visionRange: 300  // Görüş menzili (piksel)
};

function loop() {
    // ... (Önceki hareket ve çizim kodların burada duruyor) ...

    // 1. ADIM: Matematiksel Farkları Bul
    let dx = player.x - enemy.x;
    let dy = player.y - enemy.y;

    // 2. ADIM: Pisagor ile Mesafeyi Hesapla
    // JS'de Math.hypot(dx, dy) kısayolu da aynı işi yapar ama formülü açık yazalım:
    let distance = Math.sqrt(dx * dx + dy * dy);

    // 3. ADIM: Algılama Kontrolü
    if (distance < enemy.visionRange) {
        
        // 4. ADIM: Vektörü Normalize Et (Sıfıra bölme hatasından kaçınmak için mesafe 0'dan büyükse)
        if (distance > 0) {
            let dirX = dx / distance;
            let dirY = dy / distance;

            // 5. ADIM: Düşmanı Oyuncuya Doğru Hareket Ettir
            enemy.x += dirX * enemy.speed;
            enemy.y += dirY * enemy.speed;
        }
    }

    // Düşmanı Ekrana Çiz (Kırmızı renkli olsun)
    ctx.fillStyle = "red";
    ctx.fillRect(enemy.x, enemy.y, enemy.width, enemy.height);

    // ... (requestAnimationFrame vs.) ...
}

```

Bu temel "noktadan noktaya" takip etme mantığıdır. Bu sayede düşman, aranızdaki açı ne olursa olsun çapraz, düz veya kavisli bir şekilde seni dümdüz takip edecektir.
