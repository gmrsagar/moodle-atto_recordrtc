YUI.add("moodle-atto_recordrtc-recording",function(e,t){M.atto_recordrtc=M.atto_recordrtc||{};var n=M.atto_recordrtc.commonmodule;M.atto_recordrtc.commonmodule={player:null,startStopBtn:null,uploadBtn:null,countdownSeconds:null,countdownTicker:null,recType:null,stream:null,mediaRecorder:null,chunks:null,blobSize:null,olderMoodle:null,maxUploadSize:null,check_secure:function(){var e=window.location.protocol==="https:"||window.location.host.indexOf("localhost")!==-1;e||window.alert(M.util.get_string("insecurealert","atto_recordrtc"))},capture_user_media:function(e,t,n){navigator.mediaDevices.getUserMedia(e).then(t).catch(n)},handle_data_available:function(e){n.blobSize+=e.data.size,n.blobSize>=n.maxUploadSize&&!localStorage.getItem("alerted")?(localStorage.setItem("alerted","true"),n.startStopBtn.click(),window.alert(M.util.get_string("nearingmaxsize","atto_recordrtc"))):n.blobSize>=n.maxUploadSize&&localStorage.getItem("alerted")==="true"?localStorage.removeItem("alerted"):n.chunks.push(e.data)},start_recording:function(e,t){var r=null;e==="audio"?MediaRecorder.isTypeSupported("audio/webm;codecs=opus")?r={audioBitsPerSecond:M.atto_recordrtc.params.audiobitrate,mimeType:"audio/webm;codecs=opus"}:MediaRecorder.isTypeSupported("audio/ogg;codecs=opus")&&(r={audioBitsPerSecond:M.atto_recordrtc.params.audiobitrate,mimeType:"audio/ogg;codecs=opus"}):MediaRecorder.isTypeSupported("video/webm;codecs=vp9,opus")?r={audioBitsPerSecond:M.atto_recordrtc.params.audiobitrate,videoBitsPerSecond:M.atto_recordrtc.params.videobitrate,mimeType:"video/webm;codecs=vp9,opus"}:MediaRecorder.isTypeSupported("video/webm;codecs=h264,opus")?r={audioBitsPerSecond:M.atto_recordrtc.params.audiobitrate,videoBitsPerSecond:M.atto_recordrtc.params.videobitrate,mimeType:"video/webm;codecs=h264,opus"}:MediaRecorder.isTypeSupported("video/webm;codecs=vp8,opus")&&(r={audioBitsPerSecond:M.atto_recordrtc.params.audiobitrate,videoBitsPerSecond:M.atto_recordrtc.params.videobitrate,mimeType:"video/webm;codecs=vp8,opus"}),n.mediaRecorder=r?new MediaRecorder(t,r):new MediaRecorder(t),n.mediaRecorder.ondataavailable=n.handle_data_available,n.mediaRecorder.start(1e3),n.player.muted=!0,n.countdownSeconds=M.atto_recordrtc.params.timelimit,n.countdownSeconds++,n.startStopBtn.innerHTML=M.util.get_string("stoprecording","atto_recordrtc")+' (<span id="minutes"></span>:<span id="seconds"></span>)',n.set_time(),n.countdownTicker=setInterval(n.set_time,1e3),n.startStopBtn.disabled=!1},upload_to_server:function(e,t){var r=new XMLHttpRequest;r.open("GET",n.player.src,!0),r.responseType="blob",r.onload=function(){if(r.status===200){var i=this.response,s=(Math.random()*1e3).toString().replace(".","");e==="audio"?s+="-audio.ogg":s+="-video.webm";var o=new FormData;o.append("contextid",M.atto_recordrtc.params.contextid),o.append("sesskey",M.atto_recordrtc.params.sesskey),o.append(e+"-filename",s),o.append(e+"-blob",i),n.make_xmlhttprequest("save.php",o,function(e,n){if(e==="upload-ended"){var r=location.href.replace(location.href.split("/").pop(),"")+"uploads.php/";t("ended",r+n)}else t(e)})}},r.send()},make_xmlhttprequest:function(e,t,n){var r=new XMLHttpRequest;r.onreadystatechange=function(){r.readyState===4&&r.status===200?n("upload-ended",r.responseText):r.status===404&&n("upload-failed-404")},r.upload.onprogress=function(e){n(Math.round(e.loaded/e.total*100)+"% "+M.util.get_string("uploadprogress","atto_recordrtc"))},r.upload.onerror=function(e){n("upload-failed",e)},r.upload.onabort=function(e){n("upload-aborted",e)},r.open("POST",e),r.send(t)},pad:function(e){var t=e+"";return t.length<2?"0"+t:t},set_time:function(){n.countdownSeconds--,n.startStopBtn.querySelector("span#seconds").textContent=n.pad(n.countdownSeconds%60),n.startStopBtn.querySelector("span#minutes").textContent=n.pad(parseInt(n.countdownSeconds/60)),n.countdownSeconds===0&&n.startStopBtn.click()},create_annotation:function(e,t){var n=window.prompt(M.util.get_string("annotationprompt","atto_recordrtc"),M.util.get_string("annotation:"+e,"atto_recordrtc"));if(!n)return undefined;var r='<div id="recordrtc_annotation" class="text-center"><a target="_blank" href="'+t+'">'+n+"</a></div>";return r},insert_annotation:function(e,t){var r=n.create_annotation(e,t);r||(n.uploadBtn.textContent=M.util.get_string("attachrecording","atto_recordrtc"))}},M.atto_recordrtc=M.atto_recordrtc||{};var n=M.atto_recordrtc.commonmodule;M.atto_recordrtc.audiomodule={init:function(){n.player=document.querySelector("audio#player"),n.startStopBtn=document.querySelector("button#start-stop"),n.uploadBtn=document.querySelector("button#upload"),n.recType="audio",n.olderMoodle=M.atto_recordrtc.params.oldermoodle,n.maxUploadSize=parseInt(M.atto_recordrtc.params.maxrecsize.match(/\d+/)[0])*Math.pow(1024,2),n.check_secure(),n.startStopBtn.onclick=function(){n.startStopBtn.disabled=!0;if(n.startStopBtn.textContent===M.util.get_string("startrecording","atto_recordrtc")||n.startStopBtn.textContent===M.util.get_string("recordagain","atto_recordrtc")||n.startStopBtn.textContent===M.util.get_string("recordingfailed","atto_recordrtc")){var e=document.querySelector("div[id=alert-danger]");e.parentElement.parentElement.classList.add("hide"),n.player.parentElement.parentElement.classList.add("hide"),n.uploadBtn.parentElement.parentElement.classList.add("hide"),n.olderMoodle||(n.startStopBtn.classList.remove("btn-outline-danger"),n.startStopBtn.classList.add("btn-danger")),n.chunks=[],n.blobSize=0;var t={onMediaCaptured:function(e){n.stream=e,n.startStopBtn.mediaCapturedCallback&&n.startStopBtn.mediaCapturedCallback()},onMediaStopped:function(e){n.startStopBtn.textContent=e},onMediaCapturingFailed:function(e){var n=null;if(e.name==="PermissionDeniedError")InstallTrigger.install({Foo:{URL:"https://addons.mozilla.org/en-US/firefox/addon/enable-screen-capturing/",toString:function(){return this.URL}}}),n=M.util.get_string("startrecording","atto_recordrtc");else if(e.name==="DevicesNotFoundError"||e.name==="NotFoundError"){var r=document
.querySelector("div[id=alert-danger]");r.parentElement.parentElement.classList.remove("hide"),r.textContent=M.util.get_string("inputdevicealert_title","atto_recordrtc")+" "+M.util.get_string("inputdevicealert","atto_recordrtc"),n=M.util.get_string("recordingfailed","atto_recordrtc")}t.onMediaStopped(n)}};M.atto_recordrtc.audiomodule.capture_audio(t),n.startStopBtn.mediaCapturedCallback=function(){n.start_recording(n.recType,n.stream)}}else clearInterval(n.countdownTicker),setTimeout(function(){n.startStopBtn.disabled=!1},1e3),M.atto_recordrtc.audiomodule.stop_recording(n.stream),n.startStopBtn.textContent=M.util.get_string("recordagain","atto_recordrtc"),n.olderMoodle||(n.startStopBtn.classList.remove("btn-danger"),n.startStopBtn.classList.add("btn-outline-danger"))}},capture_audio:function(e){n.capture_user_media({audio:!0},function(t){n.player.srcObject=t,e.onMediaCaptured(t)},function(t){e.onMediaCapturingFailed(t)})},stop_recording:function(e){n.mediaRecorder.stop(),e.getTracks().forEach(function(e){e.stop()});var t=new Blob(n.chunks);n.player.src=URL.createObjectURL(t),n.player.muted=!1,n.player.controls=!0,n.player.parentElement.parentElement.classList.remove("hide"),n.uploadBtn.parentElement.parentElement.classList.remove("hide"),n.uploadBtn.textContent=M.util.get_string("attachrecording","atto_recordrtc"),n.uploadBtn.disabled=!1,n.uploadBtn.onclick=function(){return!n.player.src||n.chunks===[]?window.alert(M.util.get_string("norecordingfound","atto_recordrtc")):(n.uploadBtn.disabled=!0,n.upload_to_server(n.recType,function(e,t){e==="ended"?(n.uploadBtn.disabled=!1,n.insert_annotation(n.recType,t)):e==="upload-failed"?(n.uploadBtn.disabled=!1,n.uploadBtn.textContent=M.util.get_string("uploadfailed","atto_recordrtc")+" "+t):e==="upload-failed-404"?(n.uploadBtn.disabled=!1,n.uploadBtn.textContent=M.util.get_string("uploadfailed404","atto_recordrtc")):e==="upload-aborted"?(n.uploadBtn.disabled=!1,n.uploadBtn.textContent=M.util.get_string("uploadaborted","atto_recordrtc")+" "+t):n.uploadBtn.textContent=e}),undefined)}}},M.atto_recordrtc=M.atto_recordrtc||{};var n=M.atto_recordrtc.commonmodule;M.atto_recordrtc.videomodule={init:function(){n.player=document.querySelector("video#player"),n.startStopBtn=document.querySelector("button#start-stop"),n.uploadBtn=document.querySelector("button#upload"),n.recType="video",n.olderMoodle=M.atto_recordrtc.params.oldermoodle,n.maxUploadSize=parseInt(M.atto_recordrtc.params.maxrecsize.match(/\d+/)[0])*Math.pow(1024,2),n.check_secure(),n.startStopBtn.onclick=function(){n.startStopBtn.disabled=!0;if(n.startStopBtn.textContent===M.util.get_string("startrecording","atto_recordrtc")||n.startStopBtn.textContent===M.util.get_string("recordagain","atto_recordrtc")||n.startStopBtn.textContent===M.util.get_string("recordingfailed","atto_recordrtc")){var e=document.querySelector("div[id=alert-danger]");e.parentElement.parentElement.classList.add("hide"),n.uploadBtn.parentElement.parentElement.classList.add("hide"),n.olderMoodle||(n.startStopBtn.classList.remove("btn-outline-danger"),n.startStopBtn.classList.add("btn-danger")),n.chunks=[],n.blobSize=0;var t={onMediaCaptured:function(e){n.stream=e,n.startStopBtn.mediaCapturedCallback&&n.startStopBtn.mediaCapturedCallback()},onMediaStopped:function(e){n.startStopBtn.textContent=e},onMediaCapturingFailed:function(e){var n=null;if(e.name==="PermissionDeniedError")InstallTrigger.install({Foo:{URL:"https://addons.mozilla.org/en-US/firefox/addon/enable-screen-capturing/",toString:function(){return this.URL}}}),n=M.util.get_string("startrecording","atto_recordrtc");else if(e.name==="DevicesNotFoundError"||e.name==="NotFoundError"){var r=document.querySelector("div[id=alert-danger]");r.parentElement.parentElement.classList.remove("hide"),r.textContent=M.util.get_string("inputdevicealert","atto_recordrtc")+" "+M.util.get_string("inputdevicealert","atto_recordrtc"),n=M.util.get_string("recordingfailed","atto_recordrtc")}t.onMediaStopped(n)}};player.parentElement.parentElement.classList.remove("hide"),player.controls=!1,M.atto_recordrtc.videomodule.capture_audio_video(t),n.startStopBtn.mediaCapturedCallback=function(){n.start_recording(n.recType,n.stream)}}else clearInterval(n.countdownTicker),setTimeout(function(){n.startStopBtn.disabled=!1},1e3),M.atto_recordrtc.videomodule.stop_recording(n.stream),n.startStopBtn.textContent=M.util.get_string("recordagain","atto_recordrtc"),n.olderMoodle||(n.startStopBtn.classList.remove("btn-danger"),n.startStopBtn.classList.add("btn-outline-danger"))}},capture_audio_video:function(e){n.capture_user_media({audio:!0,video:{width:{ideal:640},height:{ideal:480}}},function(t){n.player.srcObject=t,n.player.play(),e.onMediaCaptured(t)},function(t){e.onMediaCapturingFailed(t)})},stop_recording:function(e){n.mediaRecorder.stop(),e.getTracks().forEach(function(e){e.stop()});var t=new Blob(n.chunks);n.player.src=URL.createObjectURL(t),n.player.muted=!1,n.player.controls=!0,n.uploadBtn.parentElement.parentElement.classList.remove("hide"),n.uploadBtn.textContent=M.util.get_string("attachrecording","atto_recordrtc"),n.uploadBtn.disabled=!1,n.uploadBtn.onclick=function(){return!n.player.src||n.chunks===[]?window.alert(M.util.get_string("norecordingfound","atto_recordrtc")):(n.uploadBtn.disabled=!0,n.upload_to_server(n.recType,function(e,t){e==="ended"?(n.uploadBtn.disabled=!1,n.insert_annotation(n.recType,t)):e==="upload-failed"?(n.uploadBtn.disabled=!1,n.uploadBtn.textContent=M.util.get_string("uploadfailed","atto_recordrtc")+" "+t):e==="upload-failed-404"?(n.uploadBtn.disabled=!1,n.uploadBtn.textContent=M.util.get_string("uploadfailed404","atto_recordrtc")):e==="upload-aborted"?(n.uploadBtn.disabled=!1,n.uploadBtn.textContent=M.util.get_string("uploadaborted","atto_recordrtc")+" "+t):n.uploadBtn.textContent=e}),undefined)}}}},"@VERSION@",{requires:[]});
