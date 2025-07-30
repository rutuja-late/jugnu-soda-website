const express = require('express');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '..')));

// Razorpay configuration
const RAZORPAY_KEY_SECRET = 'YOUR_RAZORPAY_KEY_SECRET'; // Replace with your actual secret

// Orders file path
const ORDERS_FILE = path.join(__dirname, 'orders.json');

// Initialize orders file if it doesn't exist
if (!fs.existsSync(ORDERS_FILE)) {
    fs.writeFileSync(ORDERS_FILE, JSON.stringify([]));
}

// Helper function to read orders
function readOrders() {
    try {
        const data = fs.readFileSync(ORDERS_FILE, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        console.error('Error reading orders:', error);
        return [];
    }
}

// Helper function to write orders
function writeOrders(orders) {
    try {
        fs.writeFileSync(ORDERS_FILE, JSON.stringify(orders, null, 2));
        return true;
    } catch (error) {
        console.error('Error writing orders:', error);
        return false;
    }
}

// Routes

// Get all orders
app.get('/api/orders', (req, res) => {
    const orders = readOrders();
    res.json(orders);
});

// Create new order
app.post('/api/orders', (req, res) => {
    const order = req.body;
    const orders = readOrders();
    
    // Add timestamp
    order.createdAt = new Date().toISOString();
    
    orders.push(order);
    
    if (writeOrders(orders)) {
        res.json({ success: true, orderId: order.id });
    } else {
        res.status(500).json({ success: false, error: 'Failed to save order' });
    }
});

// Verify Razorpay payment
app.post('/api/verify-payment', (req, res) => {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;
    
    // Create signature
    const body = razorpay_order_id + "|" + razorpay_payment_id;
    const expectedSignature = crypto
        .createHmac('sha256', RAZORPAY_KEY_SECRET)
        .update(body.toString())
        .digest('hex');
    
    const isAuthentic = expectedSignature === razorpay_signature;
    
    if (isAuthentic) {
        // Payment is verified
        res.json({ success: true, message: 'Payment verified successfully' });
    } else {
        // Payment verification failed
        res.status(400).json({ success: false, message: 'Payment verification failed' });
    }
});

// Get order by ID
app.get('/api/orders/:id', (req, res) => {
    const orders = readOrders();
    const order = orders.find(o => o.id === req.params.id);
    
    if (order) {
        res.json(order);
    } else {
        res.status(404).json({ error: 'Order not found' });
    }
});

// Update order status
app.put('/api/orders/:id', (req, res) => {
    const orders = readOrders();
    const orderIndex = orders.findIndex(o => o.id === req.params.id);
    
    if (orderIndex !== -1) {
        orders[orderIndex] = { ...orders[orderIndex], ...req.body };
        
        if (writeOrders(orders)) {
            res.json({ success: true, order: orders[orderIndex] });
        } else {
            res.status(500).json({ success: false, error: 'Failed to update order' });
        }
    } else {
        res.status(404).json({ error: 'Order not found' });
    }
});

// Serve main page
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'index.html'));
});

// Serve admin page
app.get('/admin', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'admin.html'));
});

// Start server
app.listen(PORT, () => {
    console.log(`🚀 Jugnu Soda's server running on http://localhost:${PORT}`);
    console.log(`📊 Admin panel: http://localhost:${PORT}/admin`);
});

module.exports = app;