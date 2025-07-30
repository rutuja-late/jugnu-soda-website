let orderHistory = [];
let currentFilter = 'all';

// Admin password - Change this to your desired password
const ADMIN_PASSWORD = 'jugnu2024';

window.onload = function() {
    loadOrderHistory();
    
    document.getElementById('adminPassword').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            verifyAdmin();
        }
    });
};

function verifyAdmin() {
    const password = document.getElementById('adminPassword').value;
    if (password === ADMIN_PASSWORD) {
        document.getElementById('loginSection').style.display = 'none';
        document.getElementById('adminContent').style.display = 'block';
        loadOrderHistory();
        updateStats();
    } else {
        alert('Invalid password! Access denied. 🚫');
        document.getElementById('adminPassword').value = '';
    }
}

function logout() {
    document.getElementById('loginSection').style.display = 'block';
    document.getElementById('adminContent').style.display = 'none';
    document.getElementById('adminPassword').value = '';
}

function loadOrderHistory() {
    // Load from localStorage
    const localOrders = JSON.parse(localStorage.getItem('jugnu_orders') || '[]');
    
    // Load from server if available
    fetch('/api/orders')
        .then(response => response.json())
        .then(serverOrders => {
            orderHistory = [...localOrders, ...serverOrders];
            // Remove duplicates based on order ID
            orderHistory = orderHistory.filter((order, index, self) => 
                index === self.findIndex(o => o.id === order.id)
            );
            displayOrders();
            updateStats();
        })
        .catch(err => {
            // Server not available, use local storage
            orderHistory = localOrders;
            displayOrders();
            updateStats();
        });
}

function displayOrders() {
    const historyContainer = document.getElementById('orderHistory');
    
    let filteredOrders = orderHistory;
    
    // Apply filters
    if (currentFilter === 'paid') {
        filteredOrders = orderHistory.filter(order => order.status === 'paid');
    } else if (currentFilter === 'pending') {
        filteredOrders = orderHistory.filter(order => order.status === 'pending');
    } else if (currentFilter === 'today') {
        const today = new Date().toLocaleDateString('en-IN');
        filteredOrders = orderHistory.filter(order => order.date === today);
    }
    
    if (filteredOrders.length === 0) {
        historyContainer.innerHTML = '<p style="text-align: center; color: #8B7355; font-size: 1.2em;">No orders found for the selected filter.</p>';
        return;
    }
    
    let historyHTML = '';
    filteredOrders.reverse().forEach(order => {
        const statusClass = order.status === 'paid' ? 'status-paid' : 'status-pending';
        const statusText = order.status === 'paid' ? 'Paid ✅' : 'Pending ⏳';
        
        historyHTML += `
            <div class="order-card">
                <div class="order-header">
                    <div>
                        <div class="order-id">Order #${order.id}</div>
                        <div style="color: #666; font-size: 0.9em; margin-top: 5px;">
                            👤 ${order.customerName} | 📅 ${order.date} ⏰ ${order.time}
                        </div>
                    </div>
                                        <div class="order-status ${statusClass}">${statusText}</div>
                </div>
                
                <div class="order-items">
                    <strong style="color: #DAA520;">📦 Items:</strong>
                    ${order.items.map(item => `
                        <div style="margin: 5px 0; padding-left: 20px; color: #666;">
                            • ${item.name} x ${item.quantity} = ₹${item.price * item.quantity}
                        </div>
                    `).join('')}
                </div>
                
                <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 15px;">
                    <div class="order-total">💰 Total: ₹${order.total}</div>
                    <div style="color: #8B7355; font-size: 0.9em;">
                        💳 Payment: ${order.paymentMethod}
                    </div>
                </div>
                
                ${order.razorpay_payment_id ? `
                    <div style="margin-top: 10px; font-size: 0.8em; color: #666;">
                        🔗 Payment ID: ${order.razorpay_payment_id}
                    </div>
                ` : ''}
            </div>
        `;
    });
    
    historyContainer.innerHTML = historyHTML;
}

function updateStats() {
    const totalOrders = orderHistory.length;
    const totalRevenue = orderHistory.reduce((sum, order) => sum + order.total, 0);
    const paidOrders = orderHistory.filter(order => order.status === 'paid').length;
    const pendingOrders = orderHistory.filter(order => order.status === 'pending').length;
    
    document.getElementById('totalOrders').textContent = totalOrders;
    document.getElementById('totalRevenue').textContent = `₹${totalRevenue}`;
    document.getElementById('paidOrders').textContent = paidOrders;
    document.getElementById('pendingOrders').textContent = pendingOrders;
}

function filterOrders(filter) {
    currentFilter = filter;
    
    // Update filter button styles
    document.querySelectorAll('.filter-btn').forEach(btn => btn.classList.remove('active'));
    event.target.classList.add('active');
    
    displayOrders();
}

// Auto-refresh orders every 30 seconds
setInterval(loadOrderHistory, 30000);