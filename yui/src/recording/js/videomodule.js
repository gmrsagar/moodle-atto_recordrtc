// Atto recordrtc library functions.
// @package    atto_recordrtc.
// @author     Jesus Federico (jesus [at] blindsidenetworks [dt] com).
// @copyright  2016 to present, Blindside Networks Inc.
// @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later.

/** global: M */

M.atto_recordrtc = M.atto_recordrtc || {};

M.atto_recordrtc.videomodule = {
    init: function() {
        // Assignment of global variables.
        M.atto_recordrtc.commonmodule.player = document.querySelector('video#player');
        M.atto_recordrtc.commonmodule.startStopBtn = document.querySelector('button#start-stop');
        M.atto_recordrtc.commonmodule.uploadBtn = document.querySelector('button#upload');
        M.atto_recordrtc.commonmodule.recType = 'video';
        // Extract the numbers from the string, and convert to bytes.
        M.atto_recordrtc.commonmodule.olderMoodle = M.atto_recordrtc.params['oldermoodle'];
        M.atto_recordrtc.commonmodule.maxUploadSize = parseInt(M.atto_recordrtc.params['maxrecsize'].match(/\d+/)[0]) * Math.pow(1024, 2);

        // Show alert and redirect user if connection is not secure.
        M.atto_recordrtc.commonmodule.check_secure();
        // Show alert if using non-ideal browser.
        M.atto_recordrtc.commonmodule.check_browser();

        // Run when user clicks on "record" button.
        M.atto_recordrtc.commonmodule.startStopBtn.onclick = function() {
            var btn = this;
            btn.disabled = true;

            // If button is displaying "Start Recording" or "Record Again".
            if ((btn.textContent === M.util.get_string('startrecording', 'atto_recordrtc')) ||
                (btn.textContent === M.util.get_string('recordagain', 'atto_recordrtc')) ||
                (btn.textContent === M.util.get_string('recordingfailed', 'atto_recordrtc'))) {
                // Hide alert-danger if it is shown.
                var alert = document.querySelector('div[id=alert-danger]');
                alert.parentElement.parentElement.classList.add('hide');

                // Make sure the upload button is not shown.
                M.atto_recordrtc.commonmodule.uploadBtn.parentElement.parentElement.classList.add('hide');

                // Change look of recording button.
                if (!M.atto_recordrtc.commonmodule.olderMoodle) {
                    M.atto_recordrtc.commonmodule.startStopBtn.classList.remove('btn-outline-danger');
                    M.atto_recordrtc.commonmodule.startStopBtn.classList.add('btn-danger');
                }

                // Empty the array containing the previously recorded chunks.
                M.atto_recordrtc.commonmodule.chunks = [];
                M.atto_recordrtc.commonmodule.blobSize = 0;

                // Initialize common configurations.
                var commonConfig = {
                    // When the stream is captured from the microphone/webcam.
                    onMediaCaptured: function(stream) {
                        // Make video stream available at a higher level by making it a property of btn.
                        btn.stream = stream;

                        if (btn.mediaCapturedCallback) {
                            btn.mediaCapturedCallback();
                        }
                    },

                    // Revert button to "Record Again" when recording is stopped.
                    onMediaStopped: function(btnLabel) {
                        btn.textContent = btnLabel;
                    },

                    // Handle recording errors.
                    onMediaCapturingFailed: function(error) {
                        var btnLabel = null;

                        // If Firefox and Permission Denied error.
                        if ((error.name === 'PermissionDeniedError') && bowser.firefox) {
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
                btn.mediaCapturedCallback = function() {
                    M.atto_recordrtc.commonmodule.start_recording(M.atto_recordrtc.commonmodule.recType, btn.stream);
                };
            } else { // If button is displaying "Stop Recording".
                // First of all clears the countdownTicker.
                clearInterval(M.atto_recordrtc.commonmodule.countdownTicker);

                // Disable "Record Again" button for 1s to allow background processing (closing streams).
                setTimeout(function() {
                    btn.disabled = false;
                }, 1000);

                // Stop recording.
                M.atto_recordrtc.videomodule.stop_recording(btn.stream);

                // Change button to offer to record again.
                btn.textContent = M.util.get_string('recordagain', 'atto_recordrtc');
                if (!M.atto_recordrtc.commonmodule.olderMoodle) {
                    M.atto_recordrtc.commonmodule.startStopBtn.classList.remove('btn-danger');
                    M.atto_recordrtc.commonmodule.startStopBtn.classList.add('btn-outline-danger');
                }
            }
        };
    },

    // Setup to get audio+video stream from microphone/webcam.
    capture_audio_video: function(config) {
        M.atto_recordrtc.commonmodule.capture_user_media(
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
                player.srcObject = audioVideoStream;
                player.play();

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
        M.atto_recordrtc.commonmodule.mediaRecorder.stop();

        // Stop each individual MediaTrack.
        stream.getTracks().forEach(function(track) {
            track.stop();
        });

        // Set source of video player.
        var blob = new Blob(M.atto_recordrtc.commonmodule.chunks);
        player.src = URL.createObjectURL(blob);

        // Enable controls for video player, and unmute.
        player.muted = false;
        player.controls = true;

        // Show upload button.
        M.atto_recordrtc.commonmodule.uploadBtn.parentElement.parentElement.classList.remove('hide');
        M.atto_recordrtc.commonmodule.uploadBtn.textContent = M.util.get_string('attachrecording', 'atto_recordrtc');
        M.atto_recordrtc.commonmodule.uploadBtn.disabled = false;

        // Handle when upload button is clicked.
        M.atto_recordrtc.commonmodule.uploadBtn.onclick = function() {
            // Trigger error if no recording has been made.
            if (!M.atto_recordrtc.commonmodule.player.src || M.atto_recordrtc.commonmodule.chunks === []) {
                return window.alert(M.util.get_string('norecordingfound', 'atto_recordrtc'));
            } else {
                var btn = M.atto_recordrtc.commonmodule.uploadBtn;
                btn.disabled = true;

                // Upload recording to server.
                M.atto_recordrtc.commonmodule.upload_to_server(M.atto_recordrtc.commonmodule.recType, function(progress, fileURLOrError) {
                    if (progress === 'ended') { // Insert annotation in text.
                        btn.disabled = false;
                        M.atto_recordrtc.commonmodule.insert_annotation(M.atto_recordrtc.commonmodule.recType, fileURLOrError);
                    } else if (progress === 'upload-failed') { // Show error message in upload button.
                        btn.disabled = false;
                        btn.textContent = M.util.get_string('uploadfailed', 'atto_recordrtc') + ' ' + fileURLOrError;
                    } else if (progress === 'upload-failed-404') { // 404 error = File too large in Moodle.
                        btn.disabled = false;
                        btn.textContent = M.util.get_string('uploadfailed404', 'atto_recordrtc');
                    } else if (progress === 'upload-aborted') {
                        btn.disabled = false;
                        btn.textContent = M.util.get_string('uploadaborted', 'atto_recordrtc') + ' ' + fileURLOrError;
                    } else {
                        btn.textContent = progress;
                    }
                });

                return undefined;
            }
        };
    }
};
