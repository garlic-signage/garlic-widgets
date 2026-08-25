/**
 * Entry point of the widget. Reads config parameters,
 * creates the media player and attaches error handling.
 */
import ConfigParams from './ConfigParams.js';
import MediaPlayer from './MediaPlayer.js';
import ErrorHandler from './ErrorHandler.js';

const CONTAINER_ID = 'player-container';

const config = new ConfigParams();

const player = new MediaPlayer(
    CONTAINER_ID,
    config.getStreamUrl(),
    config.getMediaType(),
    config.getShowControls()
);

const mediaElement = player.create();

const errorHandler = new ErrorHandler(CONTAINER_ID, mediaElement);
errorHandler.attach();

player.play();
