const micButton = document.getElementById("micButton");
const statusEl = document.getElementById("status");
const userTextEl = document.getElementById("userText");
const botTextEl = document.getElementById("botText");

const SpeechRecognition =
  window.SpeechRecognition || window.webkitSpeechRecognition;
let recognition = null;

if (!SpeechRecognition) {
  statusEl.textContent =
    "Your browser does not support speech recognition. Try Chrome or Edge.";
  micButton.disabled = true;
} else {
  recognition = new SpeechRecognition();
  recognition.lang = "en-US";
  recognition.interimResults = false;
  recognition.maxAlternatives = 1;

  recognition.onstart = () => {
    statusEl.textContent = "Listening... speak now.";
    micButton.classList.add("listening");
  };

  recognition.onend = () => {
    micButton.classList.remove("listening");
    if (!micButton.disabled) {
      statusEl.textContent = "Processing or idle.";
    }
  };

  recognition.onerror = (event) => {
    console.error("Speech recognition error:", event.error);
    statusEl.textContent = "Speech recognition error: " + event.error;
    micButton.classList.remove("listening");
  };

  recognition.onresult = async (event) => {
    const transcript = event.results[0][0].transcript;
    userTextEl.textContent = transcript;
    statusEl.textContent = "Sending to server...";
    micButton.disabled = true;

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: transcript }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Server error");
      }

      const data = await res.json();
      const reply = data.reply || "Sorry, I couldn't generate a reply.";
      botTextEl.textContent = reply;
      statusEl.textContent = "Answer ready.";
      speakText(reply);
    } catch (err) {
      console.error(err);
      statusEl.textContent = "Error: " + err.message;
    } finally {
      micButton.disabled = false;
    }
  };
}

function speakText(text) {
  if (!window.speechSynthesis) return;
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.rate = 1;
  utterance.pitch = 1;
  window.speechSynthesis.cancel();
  window.speechSynthesis.speak(utterance);
}

micButton.addEventListener("click", () => {
  if (!recognition) return;
  try {
    window.speechSynthesis.cancel();
    recognition.start();
  } catch (e) {
    console.error("Recognition start error:", e);
  }
});
