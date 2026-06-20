// State
let menuData = [];
let currentOrder = [];
const TAX_RATE = 0.10; // 10% tax

// DOM Elements
const menuItemsContainer = document.getElementById('menu-items');
const orderListContainer = document.getElementById('order-list');
const subtotalEl = document.getElementById('subtotal');
const taxEl = document.getElementById('tax');
const totalEl = document.getElementById('total');
const checkoutBtn = document.getElementById('checkout-btn');
const receiptModal = document.getElementById('receipt-modal');
const closeModalBtn = document.getElementById('close-modal');
const receiptDetailsEl = document.getElementById('receipt-details');
const newOrderBtn = document.getElementById('new-order-btn');

// Initialize App
async function init() {
    await fetchMenu();
    renderMenu();
    updateOrderDisplay();
}

// Fetch Menu Data from Backend
async function fetchMenu() {
    try {
        const response = await fetch('/api/menu');
        menuData = await response.json();
    } catch (error) {
        console.error('Error fetching menu:', error);
        menuItemsContainer.innerHTML = '<p class="error">Failed to load menu items.</p>';
    }
}

// Render Menu Items
function renderMenu() {
    menuItemsContainer.innerHTML = '';

    menuData.forEach(item => {
        const card = document.createElement('div');
        card.className = 'menu-card';
        card.innerHTML = `
            <h3>${item.name}</h3>
            <p class="price">$${item.price.toFixed(2)}</p>
            <button class="add-btn" onclick="addToOrder(${item.id})">Add to Order</button>
        `;
        menuItemsContainer.appendChild(card);
    });
}

// Add Item to Order
function addToOrder(itemId) {
    const item = menuData.find(m => m.id === itemId);
    if (!item) return;

    const existingItem = currentOrder.find(o => o.id === itemId);

    if (existingItem) {
        existingItem.quantity += 1;
    } else {
        currentOrder.push({ ...item, quantity: 1 });
    }

    updateOrderDisplay();
}

// Change Quantity
function changeQuantity(itemId, delta) {
    const itemIndex = currentOrder.findIndex(o => o.id === itemId);
    if (itemIndex > -1) {
        currentOrder[itemIndex].quantity += delta;

        if (currentOrder[itemIndex].quantity <= 0) {
            currentOrder.splice(itemIndex, 1);
        }

        updateOrderDisplay();
    }
}

// Remove Item from Order
function removeItem(itemId) {
    currentOrder = currentOrder.filter(o => o.id !== itemId);
    updateOrderDisplay();
}

// Update Order Sidebar and Totals
function updateOrderDisplay() {
    orderListContainer.innerHTML = '';

    if (currentOrder.length === 0) {
        orderListContainer.innerHTML = '<li class="empty-state">No items in order.</li>';
        checkoutBtn.disabled = true;
        subtotalEl.textContent = '$0.00';
        taxEl.textContent = '$0.00';
        totalEl.textContent = '$0.00';
        return;
    }

    checkoutBtn.disabled = false;
    let subtotal = 0;

    currentOrder.forEach(item => {
        const itemTotal = item.price * item.quantity;
        subtotal += itemTotal;

        const li = document.createElement('li');
        li.className = 'order-item';
        li.innerHTML = `
            <div class="item-info">
                <span class="item-name">${item.name}</span>
                <span class="item-price-calc">$${item.price.toFixed(2)} x ${item.quantity}</span>
            </div>
            <div class="item-actions">
                <button class="qty-btn" onclick="changeQuantity(${item.id}, -1)">-</button>
                <span>${item.quantity}</span>
                <button class="qty-btn" onclick="changeQuantity(${item.id}, 1)">+</button>
                <button class="remove-btn" onclick="removeItem(${item.id})">X</button>
            </div>
        `;
        orderListContainer.appendChild(li);
    });

    const tax = subtotal * TAX_RATE;
    const total = subtotal + tax;

    subtotalEl.textContent = `$${subtotal.toFixed(2)}`;
    taxEl.textContent = `$${tax.toFixed(2)}`;
    totalEl.textContent = `$${total.toFixed(2)}`;
}

// Generate Receipt
async function generateReceipt() {
    if (currentOrder.length === 0) return;

    // Send order to backend
    checkoutBtn.disabled = true;
    checkoutBtn.textContent = 'Processing...';

    try {
        const response = await fetch('/api/orders', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ order: currentOrder })
        });
        if (!response.ok) throw new Error('Order failed');
    } catch (error) {
        console.error('Checkout error:', error);
        alert('Failed to process order. Please try again.');
        checkoutBtn.disabled = false;
        checkoutBtn.textContent = 'Proceed to Checkout';
        return;
    }

    checkoutBtn.textContent = 'Proceed to Checkout';

    let subtotal = 0;
    let receiptHTML = '';

    currentOrder.forEach(item => {
        const itemTotal = item.price * item.quantity;
        subtotal += itemTotal;

        receiptHTML += `
            <div class="receipt-item">
                <span>${item.quantity}x ${item.name}</span>
                <span>$${itemTotal.toFixed(2)}</span>
            </div>
        `;
    });

    const tax = subtotal * TAX_RATE;
    const total = subtotal + tax;

    receiptHTML += `
        <div class="receipt-item receipt-total" style="margin-top: 10px; padding-top: 5px;">
            <span>Subtotal</span>
            <span>$${subtotal.toFixed(2)}</span>
        </div>
        <div class="receipt-item">
            <span>Tax (10%)</span>
            <span>$${tax.toFixed(2)}</span>
        </div>
        <div class="receipt-item receipt-total">
            <span><strong>Total</strong></span>
            <span><strong>$${total.toFixed(2)}</strong></span>
        </div>
    `;

    receiptDetailsEl.innerHTML = receiptHTML;
    receiptModal.classList.remove('hidden');
}

// Reset Order
function resetOrder() {
    currentOrder = [];
    updateOrderDisplay();
    receiptModal.classList.add('hidden');
}

// Event Listeners
checkoutBtn.addEventListener('click', generateReceipt);
closeModalBtn.addEventListener('click', () => receiptModal.classList.add('hidden'));
newOrderBtn.addEventListener('click', resetOrder);

// Run initialization
init();

// --- Chatbot Logic ---
const chatbotHeader = document.getElementById('chatbot-header');
const chatbotBody = document.getElementById('chatbot-body');
const chatbotToggleBtn = document.getElementById('chatbot-toggle-btn');
const chatInput = document.getElementById('chat-input');
const chatSendBtn = document.getElementById('chat-send-btn');
const chatMessagesContainer = document.getElementById('chat-messages');

// Toggle Chatbot Visibility
chatbotHeader.addEventListener('click', toggleChatbot);

function toggleChatbot() {
    chatbotBody.classList.toggle('minimized');
    chatbotToggleBtn.textContent = chatbotBody.classList.contains('minimized') ? '+' : '_';
}

// Send Message
chatSendBtn.addEventListener('click', sendMessage);
chatInput.addEventListener('keypress', function (e) {
    if (e.key === 'Enter') {
        sendMessage();
    }
});

async function sendMessage() {
    const text = chatInput.value.trim();
    if (!text) return;

    // Display user message
    appendMessage(text, 'user-message');
    chatInput.value = '';

    // Show loading indicator
    const loadingId = appendMessage('...', 'bot-message');

    // Call Backend API
    try {
        const responseText = await callGeminiAPI(text);
        updateMessage(loadingId, responseText);
    } catch (error) {
        console.error('Error calling Chat API:', error);
        updateMessage(loadingId, 'Sorry, I encountered an error connecting to the server.');
    }
}

function appendMessage(text, className) {
    const messageEl = document.createElement('div');
    messageEl.className = `message ${className}`;
    messageEl.textContent = text;

    // Generate a unique ID if it's the bot loading so we can update it later
    const id = 'msg-' + Date.now();
    messageEl.id = id;

    chatMessagesContainer.appendChild(messageEl);
    chatMessagesContainer.scrollTop = chatMessagesContainer.scrollHeight;

    return id;
}

function updateMessage(id, text) {
    const messageEl = document.getElementById(id);
    if (messageEl) {
        messageEl.textContent = text;
        chatMessagesContainer.scrollTop = chatMessagesContainer.scrollHeight;
    }
}

async function callGeminiAPI(prompt) {
    const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ prompt })
    });

    const data = await response.json();

    if (!response.ok) {
        throw new Error(data.error || `HTTP error! status: ${response.status}`);
    }

    if (data.reply) {
         return data.reply;
    } else {
         throw new Error("Unexpected API response format");
    }
}
