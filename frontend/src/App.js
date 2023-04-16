import "./App.css";
import { React, useRef, useState } from "react";
import ReactDOM from "react-dom";
import Webcam from "react-webcam";

function App() {
  const WebcamStreamCapture = () => {
    const webcamRef = useRef(null);
    const mediaRecorderRef = useRef(null);
    const [capturing, setCapturing] = useState(false);
    const recordingInterval = useRef();
    let chunks = [];
    const [startTime, setStartTime] = useState(0);

    function startRecording() {
      setCapturing(true);
      mediaRecorderRef.current = new MediaRecorder(webcamRef.current.stream, {
        mimeType: "video/webm; codecs=avc1",
        videoBitsPerSecond: 5000000,
      });

      mediaRecorderRef.current.addEventListener("dataavailable", (e) => {
        console.log("dataavailable");
        chunks.push(e.data);
      });
      mediaRecorderRef.current.addEventListener("stop", (e) =>
        sendData(chunks)
      );
      setStartTime(Date.now());
      mediaRecorderRef.current.start();

      recordingInterval.current = setInterval(() => {
        mediaRecorderRef.current.stop();
        mediaRecorderRef.current = new MediaRecorder(webcamRef.current.stream, {
          mimeType: "video/webm; codecs=avc1",
          videoBitsPerSecond: 5000000,
        });
        mediaRecorderRef.current.addEventListener("dataavailable", (e) => {
          chunks.push(e.data);
        });
        mediaRecorderRef.current.addEventListener("stop", (e) =>
          sendData(chunks)
        );
        chunks = [];
        mediaRecorderRef.current.start();
      }, 3000);
    }

    function sendData(chunks) {
      const blob = new Blob(chunks, {
        type: "video/webm",
      });

      const formData = new FormData();
      formData.append("video", blob, "video.mp4");

      fetch(`http://localhost:7070/upload`, {
        method: "POST",
        headers: {
          "Content-Type": "video/mp4",
        },
        body: formData,
        mode: "no-cors",
      }).then((res) => console.log(res));
    }

    function stopRecording() {
      const duration = Date.now() - startTime;
      const timeRemainder = duration % 3000;
      console.log("duration", duration);
      console.log("timeRemainder", timeRemainder);
      setCapturing(false);
      if (timeRemainder !== 0) {
        setTimeout(
          () => clearInterval(recordingInterval.current),
          3100 - timeRemainder
        );
      } else {
        clearInterval(recordingInterval.current);
      }
    }

    return (
      <>
        <Webcam
          audio={false}
          ref={webcamRef}
          mirrored
          videoConstraints={{
            width: 1280,
            height: 720,
            framerate: 30,
          }}
        />
        {capturing ? (
          <button onClick={stopRecording}>Stop Capture</button>
        ) : (
          <button onClick={startRecording}>Start Capture</button>
        )}
      </>
    );
  };

  ReactDOM.render(<WebcamStreamCapture />, document.getElementById("root"));
}

export default App;
