const chatForm = document.getElementById("chatForm");
const userInput = document.getElementById("userInput");
const chatWindow = document.getElementById("chatWindow");
const sendBtn = document.getElementById("sendBtn");
const musicToggle = document.getElementById("musicToggle");

// Replace this example with the Cloudflare Worker URL provided by your class.
const WORKER_URL = "https://loreal-chatbot.your-subdomain.workers.dev/";

// Keep the full conversation so the advisor can remember earlier details.
const conversation = [
  {
    role: "system",
    content:
      "You are a friendly L’Oréal beauty advisor. Help customers with L’Oréal products, skincare, makeup, haircare, fragrance, beauty services, routines, and recommendations. If details like product availability, pricing, or local services depend on location, ask for the customer’s country or city and do not guess. Be honest when you do not know a product detail. If asked about something unrelated to beauty or L’Oréal, politely redirect to a relevant topic. Do not diagnose skin or medical conditions; suggest consulting a qualified professional for medical concerns. Use earlier messages to keep your answers relevant to the conversation.",
  },
];

let musicContext;
let musicGain;
let musicTimer;
let musicStep = 0;
let nextMusicNoteTime = 0;
const jazzChords = [
  [60, 64, 67, 71],
  [57, 60, 64, 67],
  [62, 65, 69, 72],
  [55, 59, 62, 65],
];

// Play a softly plucked note using the browser's built-in audio.
function playJazzNote(note, startTime, duration, volume, sound) {
  const oscillator = musicContext.createOscillator();
  const noteVolume = musicContext.createGain();

  oscillator.type = sound;
  oscillator.frequency.value = 440 * 2 ** ((note - 69) / 12);
  noteVolume.gain.setValueAtTime(0.0001, startTime);
  noteVolume.gain.exponentialRampToValueAtTime(volume, startTime + 0.02);
  noteVolume.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);

  oscillator.connect(noteVolume);
  noteVolume.connect(musicGain);
  oscillator.start(startTime);
  oscillator.stop(startTime + duration);
}

// Schedule a repeating, gentle chord progression and melody.
function scheduleJazz() {
  while (nextMusicNoteTime < musicContext.currentTime + 0.2) {
    const chordNumber = Math.floor(musicStep / 8) % jazzChords.length;
    const stepInBar = musicStep % 8;
    const chord = jazzChords[chordNumber];

    if (stepInBar === 0) {
      chord.forEach((note) =>
        playJazzNote(note, nextMusicNoteTime, 1.8, 0.012, "triangle"),
      );
    }

    if (stepInBar === 0 || stepInBar === 4) {
      playJazzNote(chord[0] - 24, nextMusicNoteTime, 0.7, 0.07, "sine");
    }

    if (stepInBar % 2 === 0) {
      const melodyNote = chord[stepInBar / 2] + 12;
      playJazzNote(melodyNote, nextMusicNoteTime, 0.35, 0.035, "triangle");
    }

    musicStep += 1;
    nextMusicNoteTime += 0.3;
  }
}

musicToggle.addEventListener("click", async () => {
  if (!musicTimer) {
    if (!window.AudioContext) {
      musicToggle.textContent = "Background music unavailable";
      musicToggle.disabled = true;
      return;
    }

    musicContext ??= new window.AudioContext();
    if (!musicGain) {
      musicGain = musicContext.createGain();
      musicGain.gain.value = 0.4;
      musicGain.connect(musicContext.destination);
    }

    await musicContext.resume();
    musicStep = 0;
    nextMusicNoteTime = musicContext.currentTime + 0.05;
    musicGain.gain.setTargetAtTime(0.4, musicContext.currentTime, 0.08);
    musicTimer = window.setInterval(scheduleJazz, 100);
    musicToggle.textContent = "Pause soft jazz";
    musicToggle.setAttribute("aria-pressed", "true");
    return;
  }

  window.clearInterval(musicTimer);
  musicTimer = undefined;
  musicGain.gain.setTargetAtTime(0.0001, musicContext.currentTime, 0.05);
  musicToggle.textContent = "Play soft jazz";
  musicToggle.setAttribute("aria-pressed", "false");
});

// Add messages as text so user input is displayed safely.
function addMessage(text, sender) {
  const message = document.createElement("p");
  message.className = `message ${sender}`;
  message.textContent = text;
  chatWindow.appendChild(message);
  chatWindow.scrollTop = chatWindow.scrollHeight;
  return message;
}

// Give a helpful sample answer until the deployed Worker URL is added.
function getSampleReply(question) {
  const text = question.toLowerCase();

  if (
    !/(l['’]?or[eé]al|beauty|skin|skincare|makeup|hair|haircare|fragrance|perfume|routine|lipstick|mascara|shampoo|moisturizer|moisturiser|cleanser|service|salon|consultation|appointment)/i.test(
      text,
    )
  ) {
    return "I can help with L’Oréal beauty products, skincare, makeup, haircare, fragrance, and routines. What beauty question can I help with?";
  }

  if (/(dark spot|dark mark|hyperpigmentation|uneven tone)/i.test(text) && /(irritat|sensitive|burn|stinging|redness)/i.test(text)) {
    return "For dark spots with irritated skin, keep your routine gentle for now: pause new brightening or exfoliating products, use a mild cleanser and a fragrance-free moisturizer, and wear broad-spectrum SPF 30+ each morning. Once your skin feels calm, introduce any dark-spot product one at a time, following its label and patch-testing first. If irritation is severe or doesn’t settle, ask a dermatologist or other qualified healthcare professional. I can help you explore L’Oréal options once you share your skin type and country.";
  }

  if (/(skin|skincare|cleanser|moistur|routine|acne)/i.test(text)) {
    return "A simple skincare routine is: gentle cleanser, moisturizer, and broad-spectrum sunscreen in the morning. Introduce new products one at a time and follow their labels. Tell me your skin type and what you’d like help with for more tailored L’Oréal product suggestions.";
  }

  if (/(makeup|lipstick|mascara|foundation|concealer)/i.test(text)) {
    return "I can help you explore L’Oréal makeup. What product are you looking for, and what finish or shade do you prefer? For foundation or concealer, comparing shades in natural light can help you find a closer match.";
  }

  if (/(hair|haircare|shampoo|conditioner|frizz|curl)/i.test(text)) {
    return "For a hair routine, choose shampoo and conditioner based on your hair and scalp needs, and consider a heat protectant if you use hot tools. What is your hair type and what would you like to address?";
  }

  if (/(fragrance|perfume|scent)/i.test(text)) {
    return "I can help you explore fragrance. Do you prefer fresh, floral, warm, or woody scents? If you can, try a fragrance on skin and give it time to develop before deciding.";
  }

  if (/(service|salon|consultation|appointment|in.store|store)/i.test(text)) {
    return "I can help with questions about L’Oréal beauty services, but availability can vary by location. What country or city are you in, and what service are you looking for? Check your local L’Oréal website or store for current service details.";
  }

  return "I can help you explore L’Oréal beauty products and routines. Tell me which category you’re interested in—skincare, makeup, haircare, or fragrance—and what you’re looking for.";
}

chatForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  if (sendBtn.disabled) {
    return;
  }

  const question = userInput.value.trim();
  if (!question) {
    return;
  }

  addMessage(question, "user");
  userInput.value = "";
  sendBtn.disabled = true;

  const replyMessage = addMessage("Thinking…", "ai");

  if (WORKER_URL.includes("your-subdomain")) {
    replyMessage.textContent = getSampleReply(question);
    sendBtn.disabled = false;
    userInput.focus();
    return;
  }

  conversation.push({ role: "user", content: question });

  try {
    const response = await fetch(WORKER_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messages: conversation }),
    });

    if (!response.ok) {
      throw new Error(`Worker request failed (${response.status}).`);
    }

    const data = await response.json();
    const reply = data.choices?.[0]?.message?.content;
    if (typeof reply !== "string" || !reply.trim()) {
      throw new Error("The Worker returned an empty or invalid reply.");
    }

    replyMessage.textContent = reply;
    conversation.push({ role: "assistant", content: reply });
  } catch (error) {
    console.error("Could not get a chatbot response:", error);
    conversation.pop();
    replyMessage.textContent =
      "Sorry, I couldn’t get a response. Please check the Worker URL and try again.";
  } finally {
    sendBtn.disabled = false;
    userInput.focus();
  }
});
