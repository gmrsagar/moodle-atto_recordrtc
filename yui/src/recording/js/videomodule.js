// Atto recordrtc library functions.
// @package    atto_recordrtc.
// @author     Jesus Federico (jesus [at] blindsidenetworks [dt] com).
// @copyright  2016 to present, Blindside Networks Inc.
// @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later.

/** global: M */

M.atto_recordrtc = M.atto_recordrtc || {};

var cm = M.atto_recordrtc.commonmodule;

M.atto_recordrtc.videomodule = {
    init: function() {
        // Assignment of global variables.
        cm.player = document.querySelector('video#player');
        cm.startStopBtn = document.querySelector('button#start-stop');
        cm.uploadBtn = document.querySelector('button#upload');
        cm.recType = 'video';
        cm.olderMoodle = M.atto_recordrtc.params['oldermoodle'];
        // Extract the numbers from the string, and convert to bytes.
        cm.maxUploadSize = parseInt(M.atto_recordrtc.params['maxrecsize'].match(/\d+/)[0]) * Math.pow(1024, 2);

        // Show alert and redirect user if connection is not secure.
        cm.check_secure();
        // Show alert if using non-ideal browser.
        //cm.check_browser();

        // Run when user clicks on "record" button.
        cm.startStopBtn.onclick = function() {
            cm.startStopBtn.disabled = true;

            // If button is displaying "Start Recording" or "Record Again".
            if ((cm.startStopBtn.textContent === M.util.get_string('startrecording', 'atto_recordrtc')) ||
                (cm.startStopBtn.textContent === M.util.get_string('recordagain', 'atto_recordrtc')) ||
                (cm.startStopBtn.textContent === M.util.get_string('recordingfailed', 'atto_recordrtc'))) {
                // Hide alert-danger if it is shown.
                var alert = document.querySelector('div[id=alert-danger]');
                alert.parentElement.parentElement.classList.add('hide');

                // Make sure the upload button is not shown.
                cm.uploadBtn.parentElement.parentElement.classList.add('hide');

                // Change look of recording button.
                if (!cm.olderMoodle) {
                    cm.startStopBtn.classList.remove('btn-outline-danger');
                    cm.startStopBtn.classList.add('btn-danger');
                }

                // Empty the array containing the previously recorded chunks.
                cm.chunks = [];
                cm.blobSize = 0;

                // Initialize common configurations.
                var commonConfig = {
                    // When the stream is captured from the microphone/webcam.
                    onMediaCaptured: function(stream) {
                        // Make video stream available at a higher level by making it a property of the common module.
                        cm.stream = stream;

                        if (cm.startStopBtn.mediaCapturedCallback) {
                            cm.startStopBtn.mediaCapturedCallback();
                        }
                    },

                    // Revert button to "Record Again" when recording is stopped.
                    onMediaStopped: function(btnLabel) {
                        cm.startStopBtn.textContent = btnLabel;
                    },

                    // Handle recording errors.
                    onMediaCapturingFailed: function(error) {
                        var btnLabel = null;

                        // If Firefox and Permission Denied error.
                        if ((error.name === 'PermissionDeniedError')) {// && bowser.firefox) {
                            InstallTrigger.install({
                                'Foo': {
                                    // Link: https://addons.mozilla.org/firefox/downloads/latest/655146/addon-655146...
                                    // ...-latest.xpi?src=dp-btn-primary.
                                    URL: 'https://addons.mozilla.org/en-US/firefox/addon/enable-screen-capturing/',
                                    toString: function() {
                                        return this.URL;
                                    }
                                }
                            });

                            btnLabel = M.util.get_string('startrecording', 'atto_recordrtc');
                        } else if ((error.name === 'DevicesNotFoundError') ||
                                   (error.name === 'NotFoundError')) { // If Device Not Found error.
                            var alert = document.querySelector('div[id=alert-danger]');
                            alert.parentElement.parentElement.classList.remove('hide');
                            alert.textContent = M.util.get_string('inputdevicealert', 'atto_recordrtc') + ' ' + M.util.get_string('inputdevicealert', 'atto_recordrtc');

                            btnLabel = M.util.get_string('recordingfailed', 'atto_recordrtc');
                        }

                        // Proceed to treat as a stopped recording.
                        commonConfig.onMediaStopped(btnLabel);
                    }
                };

                // Show video tag without controls to view webcam stream.
                player.parentElement.parentElement.classList.remove('hide');
                player.controls = false;

                // Capture audio+video stream from webcam/microphone.
                M.atto_recordrtc.videomodule.capture_audio_video(commonConfig);

                // When audio+video stream is successfully captured, start recording.
                cm.startStopBtn.mediaCapturedCallback = function() {
                    cm.start_recording(cm.recType, cm.stream);
                };
            } else { // If button is displaying "Stop Recording".
                // First of all clears the countdownTicker.
                clearInterval(cm.countdownTicker);

                // Disable "Record Again" button for 1s to allow background processing (closing streams).
                setTimeout(function() {
                    cm.startStopBtn.disabled = false;
                }, 1000);

                // Stop recording.
                M.atto_recordrtc.videomodule.stop_recording(cm.stream);

                // Change button to offer to record again.
                cm.startStopBtn.textContent = M.util.get_string('recordagain', 'atto_recordrtc');
                if (!cm.olderMoodle) {
                    cm.startStopBtn.classList.remove('btn-danger');
                    cm.startStopBtn.classList.add('btn-outline-danger');
                }
            }
        };
    },

    // Setup to get audio+video stream from microphone/webcam.
    capture_audio_video: function(config) {
        cm.capture_user_media(
            // Media constraints.
            {
                audio: true,
                video: {
                    width: {ideal: 640},
                    height: {ideal: 480}
                }
            },

            // Success callback.
            function(audioVideoStream) {
                // Set video player source to microphone+webcam stream, and play it back as it's recording.
                cm.player.srcObject = audioVideoStream;
                cm.player.play();

                config.onMediaCaptured(audioVideoStream);
            },

            // Error callback.
            function(error) {
                config.onMediaCapturingFailed(error);
            }
        );
    },

    stop_recording: function(stream) {
        // Stop recording microphone stream.
        cm.mediaRecorder.stop();

        // Stop each individual MediaTrack.
        stream.getTracks().forEach(function(track) {
            track.stop();
        });

        // Set source of video player.
        var blob = new Blob(cm.chunks);
        cm.player.src = URL.createObjectURL(blob);

        // Enable controls for video player, and unmute.
        cm.player.muted = false;
        cm.player.controls = true;

        // Show upload button.
        cm.uploadBtn.parentElement.parentElement.classList.remove('hide');
        cm.uploadBtn.textContent = M.util.get_string('attachrecording', 'atto_recordrtc');
        cm.uploadBtn.disabled = false;

        // Handle when upload button is clicked.
        cm.uploadBtn.onclick = function() {
            // Trigger error if no recording has been made.
            if (!cm.player.src || cm.chunks === []) {
                return window.alert(M.util.get_string('norecordingfound', 'atto_recordrtc'));
            } else {
                cm.uploadBtn.disabled = true;

                // Upload recording to server.
                cm.upload_to_server(cm.recType, function(progress, fileURLOrError) {
                    if (progress === 'ended') { // Insert annotation in text.
                        cm.uploadBtn.disabled = false;
                        cm.insert_annotation(cm.recType, fileURLOrError);
                    } else if (progress === 'upload-failed') { // Show error message in upload button.
                        cm.uploadBtn.disabled = false;
                        cm.uploadBtn.textContent = M.util.get_string('uploadfailed', 'atto_recordrtc') + ' ' + fileURLOrError;
                    } else if (progress === 'upload-failed-404') { // 404 error = File too large in Moodle.
                        cm.uploadBtn.disabled = false;
                        cm.uploadBtn.textContent = M.util.get_string('uploadfailed404', 'atto_recordrtc');
                    } else if (progress === 'upload-aborted') {
                        cm.uploadBtn.disabled = false;
                        cm.uploadBtn.textContent = M.util.get_string('uploadaborted', 'atto_recordrtc') + ' ' + fileURLOrError;
                    } else {
                        cm.uploadBtn.textContent = progress;
                    }
                });

                return undefined;
            }
        };
    }
};
