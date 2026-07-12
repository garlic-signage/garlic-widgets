class WebWrapConfig {
    constructor() {
        const params = new URLSearchParams(window.location.search);

        this.url = params.get('url') || 'https://en.wikipedia.org/wiki/Digital_signage';
        this.idleTimeout = Number(params.get('idle_timeout')) || 20; // seconds
        this.warnAt = Number(params.get('warn_at')) || 10; // seconds before timeout show overlay
        this.playerHost = params.get('player_host') || 'localhost';
        this.playerPort = Number(params.get('player_port')) || 8080;
        this.playerUser = params.get('player_user') || 'admin';
        this.playerPass = params.get('player_pass') || '';
        this.overlayMsg = params.get('overlay_msg') || 'Tap to continue';
        this.showOverlay = (params.get('show_overlay') || 'true') === 'true';
    }

    get playerBase() {
        return `http://${this.playerHost}:${this.playerPort}`;
    }
}
