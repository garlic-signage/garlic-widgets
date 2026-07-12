class OverlayUI {
    constructor(config) {
        this.config = config;
        this.overlay = document.getElementById('idle-overlay');
        this.countdown = document.getElementById('idle-countdown');
        this.idleMsg = document.getElementById('idle-message');
        this.idleBar = document.getElementById('idle-bar');

        if (this.idleMsg) {
            this.idleMsg.textContent = this.config.overlayMsg;
        }
    }

    show(secsLeft) {
        if (this.overlay) {
            this.overlay.classList.add('visible');
            this.update(secsLeft);
        }
    }

    hide() {
        if (this.overlay) {
            this.overlay.classList.remove('visible');
        }
    }

    update(secsLeft) {
        if (this.countdown) {
            this.countdown.textContent = secsLeft;
        }
        if (this.idleBar) {
            this.idleBar.style.width = ((secsLeft / this.config.warnAt) * 100) + '%';
        }
    }

    addPointerDownListener(callback) {
        if (this.overlay) {
            this.overlay.addEventListener('pointerdown', (e) => {
                e.stopPropagation();
                callback();
            });
        }
    }
}
