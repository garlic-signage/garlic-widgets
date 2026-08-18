/**
 * Reads and provides widget parameters from the URL query string,
 * as passed in by the player based on config.xml preferences.
 */
export default class ConfigParams
{
    /**
     * Initializes the parser with the current window location.
     */
    constructor()
    {
        this.params = new URLSearchParams(window.location.search);
    }

    /**
     * Default stream URL used when no streamUrl parameter is set.
     * @type {string}
     */
    static DEFAULT_STREAM_URL = 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8';

    /**
     * Returns the configured stream URL.
     * @returns {string} The stream URL, or the default test stream if not set.
     */
    getStreamUrl()
    {
        return this.params.get('streamUrl') || ConfigParams.DEFAULT_STREAM_URL;
    }

    /**
     * Returns the configured media type.
     * @returns {string} Either "video" or "audio". Defaults to "video".
     */
    getMediaType()
    {
        const type = this.params.get('mediaType');
        return type === 'audio' ? 'audio' : 'video';
    }

    /**
     * Returns whether playback controls should be shown.
     * @returns {boolean} True if controls should be visible.
     */
    getShowControls()
    {
        return this.params.get('showControls') === 'true';
    }
}
