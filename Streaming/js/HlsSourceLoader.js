/**
 * Loads an HLS (.m3u8) stream into a media element, using
 * native support where available and falling back to hls.js
 * for browsers without native HLS playback (e.g. Chrome, Firefox, Edge).
 */
export default class HlsSourceLoader
{
    /**
     * @param {HTMLMediaElement} mediaElement - The target media element.
     * @param {string} streamUrl - URL of the HLS stream.
     */
    constructor(mediaElement, streamUrl)
    {
        this.mediaElement = mediaElement;
        this.streamUrl = streamUrl;
    }

    /**
     * Checks whether the given URL points to an HLS manifest.
     * @param {string} streamUrl - URL to check.
     * @returns {boolean} True if the URL ends with .m3u8.
     */
    static isHlsStream(streamUrl)
    {
        return streamUrl.toLowerCase().includes('.m3u8');
    }

    /**
     * Attaches the stream to the media element, preferring native
     * HLS support and falling back to hls.js if needed.
     * @returns {void}
     */
    load()
    {
        if (this.mediaElement.canPlayType('application/vnd.apple.mpegurl'))
        {
            this.mediaElement.src = this.streamUrl;
            return;
        }

        if (window.Hls && window.Hls.isSupported())
        {
            const hls = new window.Hls();
            hls.loadSource(this.streamUrl);
            hls.attachMedia(this.mediaElement);
            return;
        }

        console.error('HLS playback is not supported in this browser.');
    }
}
