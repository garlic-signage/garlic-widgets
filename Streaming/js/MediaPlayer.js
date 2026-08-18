import HlsSourceLoader from './HlsSourceLoader.js';

/**
 * Creates and controls the media element used for playback,
 * covering both video and audio streams, including HLS.
 */
export default class MediaPlayer
{
    /**
     * @param {string} containerId - ID of the DOM element to mount into.
     * @param {string} streamUrl - URL of the video or audio stream.
     * @param {string} mediaType - Either "video" or "audio".
     * @param {boolean} showControls - Whether native controls are visible.
     */
    constructor(containerId, streamUrl, mediaType, showControls)
    {
        this.container = document.getElementById(containerId);
        this.streamUrl = streamUrl;
        this.mediaType = mediaType;
        this.showControls = showControls;
        this.element = null;
    }

    /**
     * Creates the media element, applies its attributes, loads the
     * source (HLS-aware), and appends it to the container.
     * @returns {HTMLVideoElement} The created media element.
     */
    create()
    {
        this.element = document.createElement('video');
        this.element.autoplay = true;
        this.element.muted = true;
        this.element.playsInline = true;
        this.element.controls = this.showControls;
        this.element.classList.add('media-player');

        if (this.mediaType === 'audio')
        {
            this.element.classList.add('audio-mode');
        }

        this.loadSource();

        this.container.appendChild(this.element);
        return this.element;
    }

    /**
     * Loads the stream source into the media element, delegating
     * to HlsSourceLoader for .m3u8 streams.
     * @returns {void}
     */
    loadSource()
    {
        if (HlsSourceLoader.isHlsStream(this.streamUrl))
        {
            const hlsLoader = new HlsSourceLoader(this.element, this.streamUrl);
            hlsLoader.load();
            return;
        }

        this.element.src = this.streamUrl;
    }

    /**
     * Starts playback and logs an error if it fails.
     * @returns {void}
     */
    play()
    {
        this.element.play().catch((err) =>
        {
            console.error('Playback failed:', err);
        });
    }
}
