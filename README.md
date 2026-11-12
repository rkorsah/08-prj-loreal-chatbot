# Project 8: L'Oréal Chatbot

L’Oréal is exploring the power of AI, and your job is to showcase what's possible. Your task is to build a chatbot that helps users discover and understand L’Oréal’s extensive range of products—makeup, skincare, haircare, and fragrances—as well as provide personalized routines and recommendations.

## 🚀 Launch via GitHub Codespaces

1. In the GitHub repo, click the **Code** button and select **Open with Codespaces → New codespace**.
2. Once your codespace is ready, open the `index.html` file via the live preview.

## ☁️ Cloudflare Note

The chatbot sends its conversation to a Cloudflare Worker; the OpenAI API key must stay in the Worker secret and must never be added to the frontend.

1. Deploy the class-provided Worker and set its `OPENAI_API_KEY` secret in Cloudflare.
2. In `script.js`, replace the example `WORKER_URL` with your class Worker URL.
3. The frontend sends a `messages` array and displays the reply from `data.choices[0].message.content`.

The chatbot keeps the conversation in the browser so follow-up questions can use earlier context. Its system prompt limits replies to L’Oréal beauty products and routines.

Enjoy building your L’Oréal beauty assistant! 💄
