class IdleManager
{
    constructor(config, overlayUI, onTimeout)
	{
        this.config = config;
        this.overlayUI = overlayUI;
        this.onTimeout = onTimeout;
        
        this.lastActivity = Date.now();
        this.countdownTick = null;
        this.overlayActive = false;

        this.initListeners();
        this.startPolling();
    }

    initListeners()
	{
        const events = ['mousedown', 'mousemove', 'touchstart', 'touchmove', 'keydown', 'wheel', 'pointerdown'];
        events.forEach(evt => {
            document.addEventListener(evt, () => this.resetIdle(), { passive: true });
        });

        this.overlayUI.addPointerDownListener(() => this.resetIdle());

        const frame = document.getElementById('frame');
        if (frame) {
            frame.addEventListener('load', () => {
                try {
                    const fdoc = frame.contentDocument || frame.contentWindow.document;
                    events.forEach(evt => {
                        fdoc.addEventListener(evt, () => this.resetIdle(), { passive: true });
                    });
                } catch (_) { /* cross-origin - ignore */ }
            });
        }
    }

    resetIdle()
	{
        this.lastActivity = Date.now();
        if (this.overlayActive) {
            this.hideOverlay();
        }
    }

    showOverlay(secsLeft)
	{
        this.overlayActive = true;
        this.overlayUI.show(secsLeft);
    }

    hideOverlay()
	{
        this.overlayActive = false;
        this.overlayUI.hide();
        if (this.countdownTick)
		{
            clearInterval(this.countdownTick);
            this.countdownTick = null;
        }
    }

    startCountdown(secsLeft)
	{
        if (this.countdownTick) return;
        this.showOverlay(secsLeft);
        this.countdownTick = setInterval(() => {
            secsLeft--;
            if (secsLeft <= 0)
			{
                this.hideOverlay();
                this.onTimeout();
            }
			else
			{
                this.overlayUI.update(secsLeft);
            }
        }, 1000);
    }

    startPolling()
	{
        setInterval(() => {
            const elapsed = (Date.now() - this.lastActivity) / 1000;
            const remaining = this.config.idleTimeout - elapsed;

            if (remaining <= 0) return;

            if (remaining <= this.config.warnAt && this.config.showOverlay && !this.overlayActive)
                this.startCountdown(Math.ceil(remaining));

        }, 500);
    }
}
