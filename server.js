const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Ensure the API key is loaded from the environment
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

if (!GEMINI_API_KEY) {
    console.warn("WARNING: GEMINI_API_KEY is not set in the environment.");
}

// Sample Menu Data
const menuData = [
    { id: 1, name: 'Espresso', price: 3.50, category: 'coffee' },
    { id: 2, name: 'Cappuccino', price: 4.50, category: 'coffee' },
    { id: 3, name: 'Latte', price: 4.75, category: 'coffee' },
    { id: 4, name: 'Mocha', price: 5.00, category: 'coffee' },
    { id: 5, name: 'Iced Tea', price: 3.00, category: 'cold' },
    { id: 6, name: 'Lemonade', price: 3.50, category: 'cold' },
    { id: 7, name: 'Croissant', price: 2.75, category: 'food' },
    { id: 8, name: 'Muffin', price: 3.25, category: 'food' },
    { id: 9, name: 'Sandwich', price: 6.50, category: 'food' }
];

// --- API Endpoints ---

// Get Menu
app.get('/api/menu', (req, res) => {
    res.json(menuData);
});

// Submit Order
app.post('/api/orders', (req, res) => {
    const { order } = req.body;
    if (!order || !Array.isArray(order) || order.length === 0) {
        return res.status(400).json({ error: 'Invalid order data' });
    }

    // In a real app, we'd save this to a database
    console.log('Received order:', order);
    res.status(201).json({ message: 'Order placed successfully', orderId: Date.now() });
});

// Chatbot Proxy
app.post('/api/chat', async (req, res) => {
    const { prompt } = req.body;

    if (!prompt) {
        return res.status(400).json({ error: 'Prompt is required' });
    }

    try {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`;

        const requestBody = {
            contents: [{
                parts: [{
                    text: `You are a helpful assistant for a cafe called Food Delicacy. Keep your answers brief and helpful. Customer says: ${prompt}`
                }]
            }]
        };

        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(requestBody)
        });

        const data = await response.json();

        if (!response.ok) {
            console.error("Gemini API Error Response:", data);
            // Pass the specific error back if we can
            if (data.error && data.error.message) {
                 return res.status(response.status).json({ error: data.error.message });
            }
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        if (data.candidates && data.candidates.length > 0 && data.candidates[0].content && data.candidates[0].content.parts.length > 0) {
             res.json({ reply: data.candidates[0].content.parts[0].text });
        } else {
             throw new Error("Unexpected API response format");
        }
    } catch (error) {
        console.error('Chat API Error:', error);
        res.status(500).json({ error: 'Failed to communicate with AI service', details: error.message });
    }
});

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
