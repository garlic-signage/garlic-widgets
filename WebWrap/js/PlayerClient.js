// SPDX-License-Identifier: MIT
// Copyright (c) 2026 sagiadinos
'use strict';

export class PlayerClient
{
    constructor(config)
	{
        this.config = config;
        this.cachedToken = null;
        this.tokenExpiry = 0;
    }

    async getToken()
	{
        if (this.cachedToken && Date.now() < this.tokenExpiry) {
            return this.cachedToken;
        }

        const res = await fetch(`${this.config.playerBase}/v2/oauth2/token`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
            body: JSON.stringify({
                grant_type: 'password',
                username: this.config.playerUser,
                password: this.config.playerPass
            })
        });

        if (!res.ok) throw new Error(`Token request failed: ${res.status}`);

        const data = await res.json();
        this.cachedToken = data.access_token;
        // expires_in is ISO datetime string - parse it
        this.tokenExpiry = new Date(data.expires_in).getTime() - 30000; // 30s safety margin
        return this.cachedToken;
    }

    async resumePlaylist()
	{
        try {
            const token = await this.getToken();
            const res = await fetch(`${this.config.playerBase}/v2/app/switch?access_token=${token}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
                body: JSON.stringify({ mode: 'start' })
            });
            if (!res.ok)
                console.warn('[GarlicFrame] switch failed:', res.status);

        }
		catch (e)
		{
            console.error('[GarlicFrame] resumePlaylist error:', e);
        }
    }
}
