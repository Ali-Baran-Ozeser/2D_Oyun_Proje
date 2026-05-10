class InputHandler {
    constructor() {
        // Tuşların durumunu tutacak boş bir obje
        this.keys = {}; 

        // Tuşa basıldığında o tuşun değerini true (doğru/aktif) yap
        window.addEventListener('keydown', e => this.keys[e.code] = true);
        
        // Tuştan el çekildiğinde o tuşun değerini false (yanlış/pasif) yap
        window.addEventListener('keyup', e => this.keys[e.code] = false);
    }
}