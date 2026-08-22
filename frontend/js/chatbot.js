// =======================================================
// CampusResolve - AI Chatbot Component (ResolveAI)
// =======================================================

(function () {
    // Prevent duplicate injection
    if (window.ResolveAIInitialized) return;
    window.ResolveAIInitialized = true;

    // Determine Backend API Endpoint
    const isLocal = window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1";
    const CHATBOT_API_URL = isLocal
        ? "http://localhost:5002/api/ai/chat"
        : ((window.API_URL ? `${window.API_URL}/ai/chat` : "https://campus-resolve-backend.vercel.app/api/ai/chat"));

    // State
    let conversationHistory = [];
    const STORAGE_KEY = "cr_ai_chat_history";

    // Load College & User Info for Context
    function getContext() {
        let collegeName = "Campus";
        let studentName = "Student";

        try {
            const collegeData = localStorage.getItem("selectedCollege");
            if (collegeData) {
                const college = JSON.parse(collegeData);
                collegeName = college.name || collegeName;
            }

            const userData = localStorage.getItem("user") || localStorage.getItem("demoUser");
            if (userData) {
                const user = JSON.parse(userData);
                studentName = user.name || user.fullName || user.email?.split("@")[0] || studentName;
            }
        } catch (e) {
            console.error("Error reading context:", e);
        }

        return { collegeName, studentName };
    }

    // Markdown / Rich Text Formatter
    function formatMessage(text) {
        if (!text) return "";
        let formatted = text
            // Escape HTML
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            // Bold
            .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
            // Italic
            .replace(/\*(.*?)\*/g, "<em>$1</em>")
            // Links
            .replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>')
            // Bullet points
            .replace(/^\s*[-*•]\s+(.*)$/gm, "<li>$1</li>")
            // Newlines to <br>
            .replace(/\n/g, "<br>");

        // Wrap consecutive <li> into <ul>
        formatted = formatted.replace(/(<li>.*?<\/li>(\s*<br>\s*)*)+/g, (match) => {
            const cleaned = match.replace(/<br\s*[\/]?>/gi, "");
            return `<ul>${cleaned}</ul>`;
        });

        return formatted;
    }

    // Inject HTML Structure
    function injectChatbotDOM() {
        const wrapper = document.createElement("div");
        wrapper.id = "campusresolve-ai-widget";
        wrapper.innerHTML = `
            <!-- Chat Window -->
            <div class="cr-chat-window" id="crChatWindow" aria-hidden="true">
                <!-- Header -->
                <div class="cr-chat-header">
                    <div class="cr-header-info">
                        <div class="cr-header-avatar">🤖</div>
                        <div class="cr-header-title">
                            <h4>ResolveAI <span class="cr-header-badge">AI Assistant</span></h4>
                            <span class="cr-header-subtitle">Online • Grievance Helper</span>
                        </div>
                    </div>
                    <div class="cr-header-actions">
                        <button class="cr-action-btn" id="crClearChatBtn" title="Clear Conversation" type="button">🗑️</button>
                        <button class="cr-action-btn" id="crCloseChatBtn" title="Close Chat" type="button">✕</button>
                    </div>
                </div>

                <!-- Messages Body -->
                <div class="cr-chat-body" id="crChatBody">
                    <!-- Initial Welcome Message -->
                </div>

                <!-- Suggestions / Quick Pills -->
                <div class="cr-suggestions-wrapper">
                    <div class="cr-suggestions-title">Quick Topics</div>
                    <div class="cr-suggestions">
                        <button class="cr-pill" data-query="Complaint kaise report karein?">📝 Report Issue</button>
                        <button class="cr-pill" data-query="Meri complaint ka status kya hai aur kaise track karein?">🔍 Track Status</button>
                        <button class="cr-pill" data-query="Escalation policy aur timeline kya hai?">⚡ Escalation Rules</button>
                        <button class="cr-pill" data-query="Campus Wi-Fi / Internet problem kaise fix karein?">📶 Wi-Fi Support</button>
                        <button class="cr-pill" data-query="Hostel aur Mess complaints ke baare mein batayein">🏢 Hostel & Mess</button>
                    </div>
                </div>

                <!-- Input Footer -->
                <form class="cr-chat-footer" id="crChatForm">
                    <input
                        type="text"
                        class="cr-input-box"
                        id="crChatInput"
                        placeholder="Type in Hindi, English, Hinglish..."
                        autocomplete="off"
                        required
                    />
                    <button type="submit" class="cr-send-btn" id="crSendBtn" aria-label="Send message">
                        <span>➤</span>
                    </button>
                </form>
            </div>

            <!-- Floating Toggle Button -->
            <button class="cr-chat-toggle" id="crChatToggle" aria-label="Open AI Chatbot" type="button">
                <span class="cr-toggle-icon">💬</span>
                <span class="cr-toggle-badge"></span>
                <div class="cr-chat-tooltip" id="crTooltip">Ask ResolveAI 🤖</div>
            </button>
        `;

        document.body.appendChild(wrapper);
    }

    // Initialize Widget Logic
    function initWidget() {
        injectChatbotDOM();

        const chatToggle = document.getElementById("crChatToggle");
        const chatWindow = document.getElementById("crChatWindow");
        const closeBtn = document.getElementById("crCloseChatBtn");
        const clearBtn = document.getElementById("crClearChatBtn");
        const chatForm = document.getElementById("crChatForm");
        const chatInput = document.getElementById("crChatInput");
        const chatBody = document.getElementById("crChatBody");
        const sendBtn = document.getElementById("crSendBtn");
        const pills = document.querySelectorAll(".cr-pill");

        const context = getContext();

        // Load History from localStorage
        try {
            const savedHistory = localStorage.getItem(STORAGE_KEY);
            if (savedHistory) {
                conversationHistory = JSON.parse(savedHistory);
            }
        } catch (e) {
            conversationHistory = [];
        }

        // Render Conversation
        function renderMessages() {
            chatBody.innerHTML = "";

            // Welcome Message
            const welcomeElem = document.createElement("div");
            welcomeElem.className = "cr-message bot";
            welcomeElem.innerHTML = `
                <div class="cr-message-avatar">🤖</div>
                <div class="cr-message-content">
                    <p>Namaste <strong>${context.studentName}</strong>! 👋</p>
                    <p>Main <strong>ResolveAI</strong> hoon — <strong>${context.collegeName}</strong> ka AI Student Grievance Assistant.</p>
                    <p>Aap mujhse complaints, status tracking, Wi-Fi, hostel, mess, ya escalation rules ke baare mein kuch bhi pooch sakte hain!</p>
                </div>
            `;
            chatBody.appendChild(welcomeElem);

            // Render previous messages
            conversationHistory.forEach((msg) => {
                appendMessageToDOM(msg.role, msg.text, false);
            });

            scrollToBottom();
        }

        function scrollToBottom() {
            setTimeout(() => {
                chatBody.scrollTop = chatBody.scrollHeight;
            }, 50);
        }

        function appendMessageToDOM(role, text, save = true) {
            const msgElem = document.createElement("div");
            msgElem.className = `cr-message ${role === "user" ? "user" : "bot"}`;

            const formatted = formatMessage(text);
            const time = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

            if (role === "user") {
                msgElem.innerHTML = `
                    <div class="cr-message-content">
                        ${formatted}
                        <div class="cr-message-time">${time}</div>
                    </div>
                `;
            } else {
                msgElem.innerHTML = `
                    <div class="cr-message-avatar">🤖</div>
                    <div class="cr-message-content">
                        ${formatted}
                        <div class="cr-message-time">${time}</div>
                    </div>
                `;
            }

            chatBody.appendChild(msgElem);
            scrollToBottom();

            if (save) {
                conversationHistory.push({ role, text });
                if (conversationHistory.length > 20) {
                    conversationHistory = conversationHistory.slice(-20);
                }
                try {
                    localStorage.setItem(STORAGE_KEY, JSON.stringify(conversationHistory));
                } catch (e) {}
            }
        }

        function showTypingIndicator() {
            const typingElem = document.createElement("div");
            typingElem.id = "crTypingIndicator";
            typingElem.className = "cr-message bot";
            typingElem.innerHTML = `
                <div class="cr-message-avatar">🤖</div>
                <div class="cr-typing">
                    <div class="cr-typing-dot"></div>
                    <div class="cr-typing-dot"></div>
                    <div class="cr-typing-dot"></div>
                </div>
            `;
            chatBody.appendChild(typingElem);
            scrollToBottom();
        }

        function hideTypingIndicator() {
            const typingElem = document.getElementById("crTypingIndicator");
            if (typingElem) {
                typingElem.remove();
            }
        }

        // Send Message
        async function sendMessage(text) {
            if (!text || !text.trim()) return;
            const message = text.trim();

            appendMessageToDOM("user", message, true);
            chatInput.value = "";
            chatInput.disabled = true;
            sendBtn.disabled = true;

            showTypingIndicator();

            try {
                const response = await fetch(CHATBOT_API_URL, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({
                        message: message,
                        history: conversationHistory.slice(-6),
                        context: getContext()
                    })
                });

                hideTypingIndicator();

                if (!response.ok) {
                    throw new Error("Network response was not ok");
                }

                const data = await response.json();
                if (data && data.reply) {
                    appendMessageToDOM("bot", data.reply, true);
                } else {
                    appendMessageToDOM("bot", "Kshama karein, main abhi answer generate nahi kar paya. Kripya punah prayas karein.", true);
                }
            } catch (err) {
                console.error("Chatbot API request failed:", err);
                hideTypingIndicator();
                
                // Fallback client-side response if server is unreachable
                const fallbackReply = `Main aapki query samajh gaya! 🤝\n\nAgar aapko issue report karna hai toh **Report Issue** page par jaiye, ya apni filed complaints track karne ke liye **My Complaints** check karein.`;
                appendMessageToDOM("bot", fallbackReply, true);
            } finally {
                chatInput.disabled = false;
                sendBtn.disabled = false;
                chatInput.focus();
            }
        }

        // Event Listeners
        chatToggle.addEventListener("click", () => {
            const isOpen = chatWindow.classList.toggle("open");
            chatToggle.classList.toggle("active", isOpen);
            if (isOpen) {
                chatWindow.setAttribute("aria-hidden", "false");
                chatInput.focus();
            } else {
                chatWindow.setAttribute("aria-hidden", "true");
            }
        });

        closeBtn.addEventListener("click", () => {
            chatWindow.classList.remove("open");
            chatToggle.classList.remove("active");
            chatWindow.setAttribute("aria-hidden", "true");
        });

        clearBtn.addEventListener("click", () => {
            if (confirm("Clear conversation history?")) {
                conversationHistory = [];
                localStorage.removeItem(STORAGE_KEY);
                renderMessages();
            }
        });

        chatForm.addEventListener("submit", (e) => {
            e.preventDefault();
            sendMessage(chatInput.value);
        });

        // Quick Suggestion Pills
        pills.forEach((pill) => {
            pill.addEventListener("click", () => {
                const query = pill.getAttribute("data-query");
                if (query) {
                    sendMessage(query);
                }
            });
        });

        // Initial render
        renderMessages();
    }

    // Start on DOM ready
    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", initWidget);
    } else {
        initWidget();
    }
})();
