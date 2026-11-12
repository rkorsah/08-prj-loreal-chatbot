const chatForm = document.getElementById("chatForm");
const userInput = document.getElementById("userInput");
const chatWindow = document.getElementById("chatWindow");
const sendBtn = document.getElementById("sendBtn");

// Replace this example with the Cloudflare Worker URL provided by your class.
const WORKER_URL = "https://loreal-chatbot.your-subdomain.workers.dev/";

// Keep the full conversation so the advisor can remember earlier details.
const conversation = [
  {
    role: "system",
    content:
      "You are a friendly L’Oréal beauty advisor. Only answer questions about L’Oréal products, skincare, makeup, haircare, fragrance, and beauty routines. If asked about anything unrelated, politely say you can only help with L’Oréal beauty products and routines, then invite a relevant question. Be honest when you do not know a product detail. Do not diagnose skin or medical conditions; suggest consulting a qualified professional for medical concerns.",
  },
];

// Add messages as text so user input is displayed safely.
function addMessage(text, sender) {
  const message = document.createElement("p");
  message.className = `message ${sender}`;
  message.textContent = text;
  chatWindow.appendChild(message);
  chatWindow.scrollTop = chatWindow.scrollHeight;
  return message;
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
    replyMessage.textContent =
      "Add your class Cloudflare Worker URL to WORKER_URL in script.js to start chatting.";
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
