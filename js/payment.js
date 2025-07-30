// Razorpay Configuration
const RAZORPAY_KEY = 'rzp_test_1234567890'; // Replace with your actual Razorpay key
const SHOP_DETAILS = {
    name: "Jugnu Soda's & More",
    description: "Sparkling Varieties of Digestive Sodas",
    image: "images/logo.png",
    prefill: {
        contact: "9869151040",
        email: "bharatbhojane@gmail.com"
    },
    theme: {
        color: "#DAA520"
    }
};

function processPayment() {
    if (!currentPaymentMethod) {
        alert('Please select a payment method! 💳');
        return;
    }
    
    const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    
    if (currentPaymentMethod === 'cash') {
        processCashOrder();
    } else if (currentPaymentMethod === 'online') {
        processOnlinePayment(total);
    }
}

function processCashOrder() {
    const orderId = generateOrderId();
    const orderDate = new Date();
    const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    
    const order = {
        id: orderId,
        customerName: customerName,
        date: orderDate.toLocaleDateString('en-IN'),
        time: orderDate.toLocaleTimeString('en-IN'),
        items: [...cart],
        total: total,
        paymentMethod: 'Cash on Delivery',
        status: 'pending'
    };
    
    saveOrder(order);
    document.getElementById('successCustomerName').textContent = customerName;
    showPage('successPage');
    window.currentOrder = order;
    cart = [];
    updateCartSummary();
}

function processOnlinePayment(amount) {
    const options = {
        key: RAZORPAY_KEY,
        amount: amount * 100, // Razorpay expects amount in paise
        currency: 'INR',
        name: SHOP_DETAILS.name,
        description: SHOP_DETAILS.description,
        image: SHOP_DETAILS.image,
        order_id: '', // This should be generated from your server
        handler: function (response) {
            // Payment successful
            handlePaymentSuccess(response);
        },
        prefill: {
            name: customerName,
            email: SHOP_DETAILS.prefill.email,
            contact: SHOP_DETAILS.prefill.contact
        },
        notes: {
            customer_name: customerName,
            order_items: JSON.stringify(cart)
        },
        theme: SHOP_DETAILS.theme,
        modal: {
            ondismiss: function() {
                // Payment cancelled
                alert('Payment cancelled! You can try again. 😊');
            }
        }
    };
    
    const rzp = new Razorpay(options);
    rzp.open();
}

function handlePaymentSuccess(response) {
    const orderId = generateOrderId();
    const orderDate = new Date();
    const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    
    const order = {
        id: orderId,
        customerName: customerName,
        date: orderDate.toLocaleDateString('en-IN'),
        time: orderDate.toLocaleTimeString('en-IN'),
        items: [...cart],
        total: total,
        paymentMethod: 'Online Payment',
        status: 'paid',
        razorpay_payment_id: response.razorpay_payment_id,
        razorpay_order_id: response.razorpay_order_id,
        razorpay_signature: response.razorpay_signature
    };
    
    saveOrder(order);
    document.getElementById('successCustomerName').textContent = customerName;
    showPage('successPage');
    window.currentOrder = order;
    cart = [];
    updateCartSummary();
    
    // Verify payment on server
    verifyPayment(response);
}

function verifyPayment(response) {
    fetch('/api/verify-payment', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(response)
    }).then(res => res.json())
    .then(data => {
        if (data.success) {
            console.log('Payment verified successfully');
        } else {
            console.log('Payment verification failed');
        }
    }).catch(err => {
        console.log('Payment verification error:', err);
    });
}