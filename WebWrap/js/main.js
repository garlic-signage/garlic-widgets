// SPDX-License-Identifier: MIT
// Copyright (c) 2026 sagiadinos
'use strict';

import {WebWrapConfig} from "./WebWrapConfig.js";
import {PlayerClient} from "./PlayerClient.js";
import {OverlayUI} from "./OverlayUI.js";
import {IdleManager} from "./IdleManager.js";

export class WebWrapApp
{
	#config;
	#playerClient;
	#overlayUI;
	#idleManager;

    constructor()
	{
        this.#config       = new WebWrapConfig();
        this.#playerClient = new PlayerClient(this.#config);
        this.#overlayUI    = new OverlayUI(this.#config);
        this.#idleManager  = new IdleManager(this.#config, this.#overlayUI, () => this.#onIdleTimeout());

    }

    init()
	{
        const frame = document.getElementById('frame');
        if (frame)
            frame.src = this.#config.url;

        console.log('[GarlicFrame] Loaded. URL:', this.#config.url, '| Idle timeout:', this.#config.idleTimeout, 's');
    }

    #onIdleTimeout()
	{
        this.#playerClient.resumePlaylist();
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const app = new WebWrapApp();
	app.init();
});
