/**
 * Listens for playback errors on the media element and
 * displays a fallback message instead of a stuck player.
 */
export default class ErrorHandler {
    /**
     * @param {string} containerId - ID of the DOM element to render the message into.
     * @param {HTMLMediaElement} mediaElement - The media element to observe.
     */
    constructor(containerId, mediaElement) {
        this.container = document.getElementById(containerId);
        this.mediaElement = mediaElement;
    }

    /**
     * Registers the error event listener on the media element.
     * @returns {void}
     */
    attach() {
        this.mediaElement.addEventListener('error', () => {
            this.showMessage('Stream unavailable.');
        });
    }

    /**
     * Replaces the container content with an error message.
     * @param {string} text - The message to display.
     * @returns {void}
     */
    showMessage(text) {
        const msg = document.createElement('div');
        msg.classList.add('error-message');
        msg.textContent = text;
        this.container.innerHTML = '';
        this.container.appendChild(msg);
    }
}
