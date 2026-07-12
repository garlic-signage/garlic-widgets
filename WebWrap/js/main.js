class WebWrapApp
{
    constructor()
	{
        this.config = new WebWrapConfig();
        this.playerClient = new PlayerClient(this.config);
        this.overlayUI = new OverlayUI(this.config);
        this.idleManager = new IdleManager(this.config, this.overlayUI, () => this.onIdleTimeout());

        this.init();
    }

    init()
	{
        const frame = document.getElementById('frame');
        if (frame)
            frame.src = this.config.url;

        console.log('[GarlicFrame] Loaded. URL:', this.config.url, '| Idle timeout:', this.config.idleTimeout, 's');
    }

    onIdleTimeout()
	{
        this.playerClient.resumePlaylist();
    }
}

// Instantiate the app
document.addEventListener('DOMContentLoaded', () => {
    window.app = new WebWrapApp();
});
