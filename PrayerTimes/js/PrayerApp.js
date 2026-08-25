export class PrayerApp {
    constructor(config, dataService, calculator, renderer) {
        this.config = config;
        this.dataService = dataService;
        this.calculator = calculator;
        this.renderer = renderer;

        this.lastFormat = null;
        this.lastNextKey = null;
        this.appElement = document.getElementById("app");
    }

    async boot() {
        if (!this.config.latitude && !this.config.longitude && !this.config.city) {
            this.appElement.innerHTML = '<div class="fatal">No location configured.<br>Set latitude/longitude or city/country.</div>';
            return;
        }

        try {
            await this.dataService.ensureData();
            this.render();
        } catch (e) {
            this.appElement.innerHTML = '<div class="fatal">Could not load prayer times.<br>No cached data and network unavailable.</div>';
        }

        setInterval(() => this.tick(), 1000);

        let rt;
        window.addEventListener("resize", () => {
            clearTimeout(rt);
            rt = setTimeout(() => this.render(), 200);
        });

        setInterval(() => {
            const n = new Date();
            if (n.getHours() === 0 && n.getMinutes() < 5) {
                this.dataService.ensureData().then(() => this.render());
            }
        }, 60000);
    }

    render() {
        const c = this.calculator.compute();
        this.lastFormat = this.renderer.render(c, this.appElement);
        if (c) {
            this.lastNextKey = c.nextKey;
        }
        this.renderer.updateStatus(this.dataService.stale);
    }

    tick() {
        if (!this.dataService.monthData) return;
        const c = this.calculator.compute();
        if (!c) return;

        if (this.renderer.pickFormat() !== this.lastFormat || c.nextKey !== this.lastNextKey) {
            this.render();
            return;
        }

        this.renderer.updateClockAndCountdown(c);
    }
}
