/**
 * ========================================================
 *  নিখাঁদ শপ বিডি - অর্ডার ম্যানেজমেন্ট স্ক্রিপ্ট
 *  Version: 2.0 (Google Sheets Integration)
 * ========================================================
 */

// ============================================================
//  কনফিগারেশন (আপনার তথ্য অনুযায়ী পরিবর্তন করুন)
// ============================================================

const CONFIG = {
  // আপনার Google Apps Script Web App URL
  SCRIPT_URL: 'https://script.google.com/macros/s/AKfycbzU2xu-7NFg1lAO7q2rJqacDWOvKfW2lzNw3f2wkvc_UZVJwFBoAoV3KGEDlc8qAwB6/exec',
  
  // ডেলিভারি চার্জ (ঢাকার ভিতরে/বাইরে)
  DELIVERY_CHARGE_DHAKA: 70,
  DELIVERY_CHARGE_OUTSIDE: 100,
  
  // কোম্পানির নাম (Order ID এর জন্য)
  COMPANY_PREFIX: 'NSB'
};

// ============================================================
//  ১. পণ্যের দাম + ডেলিভারি চার্জ ক্যালকুলেশন
// ============================================================

function calculateTotal() {
  const productSelect = document.getElementById('userProduct');
  const productPrice = parseInt(productSelect.value);
  
  const deliveryRadio = document.querySelector('input[name="delivery"]:checked');
  const deliveryCharge = deliveryRadio ? parseInt(deliveryRadio.value) : 0;
  
  const total = productPrice + deliveryCharge;
  
  document.getElementById('totalPrice').textContent = '৳ ' + total.toLocaleString();
  
  // ডেলিভারি চার্জ আলাদাভাবে দেখানোর জন্য (ঐচ্ছিক)
  const deliveryDisplay = document.getElementById('deliveryChargeDisplay');
  if (deliveryDisplay) {
    deliveryDisplay.textContent = '৳ ' + deliveryCharge.toLocaleString();
  }
}

// ============================================================
//  ২. পণ্য কার্ড থেকে "অর্ডার করুন" ক্লিক করলে
// ============================================================

function goToOrder(productName) {
  document.getElementById('orderSection').scrollIntoView({ behavior: 'smooth' });
  
  const select = document.getElementById('userProduct');
  for (let i = 0; i < select.options.length; i++) {
    const optionText = select.options[i].text;
    const productNameClean = productName.split('(')[0].trim();
    if (optionText.includes(productNameClean)) {
      select.selectedIndex = i;
      break;
    }
  }
  
  calculateTotal();
}

// ============================================================
//  ৩. অর্ডার সাবমিট (Google Sheets-এ পাঠানো)
// ============================================================

function submitOrder() {
  // ফর্মের ডাটা সংগ্রহ
  const name = document.getElementById('userName').value.trim();
  const phone = document.getElementById('userPhone').value.trim();
  const product = document.getElementById('userProduct');
  const productText = product.options[product.selectedIndex].text;
  const address = document.getElementById('userAddress').value.trim();
  const totalPrice = document.getElementById('totalPrice').textContent;
  
  // ডেলিভারি চার্জ সংগ্রহ
  const deliveryRadio = document.querySelector('input[name="delivery"]:checked');
  const deliveryCharge = deliveryRadio ? parseInt(deliveryRadio.value) : 0;
  const deliveryArea = deliveryRadio ? 
    (deliveryRadio.value == CONFIG.DELIVERY_CHARGE_DHAKA ? 'ঢাকার ভিতরে' : 'ঢাকার বাইরে') : 
    'নির্ধারিত নয়';

  // ভ্যালিডেশন
  if (name === '' || phone === '' || address === '') {
    alert('⚠️ দয়া করে আপনার নাম, মোবাইল নম্বর এবং ঠিকানা সঠিকভাবে পূরণ করুন।');
    return;
  }

  // ফোন নম্বর ভ্যালিডেশন (বাংলাদেশি নম্বর)
  const phoneRegex = /^01[3-9]\d{8}$/;
  if (!phoneRegex.test(phone)) {
    alert('⚠️ দয়া করে সঠিক মোবাইল নম্বর দিন (যেমন: 017XXXXXXXX)');
    return;
  }

  // ডাটা JSON আকারে তৈরি
  const orderData = {
    name: name,
    phone: phone,
    product: productText,
    address: address,
    totalPrice: totalPrice,
    deliveryCharge: deliveryCharge,
    deliveryArea: deliveryArea,
    paymentStatus: 'Pending',  // ডিফল্ট
    orderStatus: 'Pending'     // ডিফল্ট
  };

  // বাটন ডিজেবল ও লোডিং ইন্ডিকেটর
  const btn = document.querySelector('.order-box .order-btn');
  const originalText = btn.textContent;
  btn.textContent = '⏳ প্রক্রিয়াকরণ...';
  btn.disabled = true;
  btn.style.opacity = '0.7';

  // POST রিকোয়েস্ট পাঠানো
  fetch(CONFIG.SCRIPT_URL, {
    method: 'POST',
    mode: 'no-cors', // CORS সমস্যা এড়াতে
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(orderData)
  })
  .then(() => {
    // no-cors মোডে response পাওয়া যায় না, তাই সাফল্য ধরে নিচ্ছি
    // আসলে ডাটা শিটে সেভ হয়েছে কিনা চেক করতে Apps Script-এর লগ দেখতে হবে
    
    // সাফল্যের মেসেজ
    const orderId = 'NSB-' + String(Math.floor(Math.random() * 9000) + 1000);
    showSuccessModal(orderId, orderData);
    
    // ফর্ম রিসেট
    document.getElementById('userName').value = '';
    document.getElementById('userPhone').value = '';
    document.getElementById('userAddress').value = '';
    document.getElementById('userProduct').selectedIndex = 0;
    calculateTotal();
    
    // বাটন রিস্টোর
    setTimeout(() => {
      btn.textContent = originalText;
      btn.disabled = false;
      btn.style.opacity = '1';
    }, 3000);
    
  })
  .catch((error) => {
    console.error('Error:', error);
    alert('❌ অর্ডার নেওয়ার সময় সমস্যা হয়েছে। দয়া করে আবার চেষ্টা করুন।');
    btn.textContent = originalText;
    btn.disabled = false;
    btn.style.opacity = '1';
  });
}

// ============================================================
//  ৪. সাফল্যের মেসেজ (প্রফেশনাল মোডাল)
// ============================================================

function showSuccessModal(orderId, orderData) {
  // মোডাল HTML তৈরি
  const modalHTML = `
    <div id="orderSuccessModal" style="
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0,0,0,0.6);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 9999;
      animation: fadeIn 0.3s ease;
    ">
      <div style="
        background: #fff;
        max-width: 420px;
        width: 90%;
        padding: 30px 28px;
        border-radius: 16px;
        box-shadow: 0 20px 60px rgba(0,0,0,0.3);
        text-align: center;
        position: relative;
        animation: slideUp 0.4s ease;
      ">
        <!-- সাফল্যের আইকন -->
        <div style="
          width: 72px;
          height: 72px;
          background: #28a745;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto 16px;
          font-size: 36px;
          color: #fff;
        ">✓</div>
        
        <h2 style="
          font-size: 22px;
          font-weight: 600;
          color: #2c1a00;
          margin-bottom: 4px;
        ">অর্ডার সফল হয়েছে! 🎉</h2>
        
        <p style="
          font-size: 13px;
          color: #8a755a;
          margin-bottom: 16px;
        ">আপনার অর্ডারটি গ্রহণ করা হয়েছে।</p>
        
        <!-- অর্ডার আইডি -->
        <div style="
          background: #f9f3ea;
          padding: 10px;
          border-radius: 8px;
          margin-bottom: 16px;
        ">
          <span style="font-size: 12px; color: #8a755a;">অর্ডার আইডি</span>
          <div style="font-size: 20px; font-weight: 700; color: #B87333; letter-spacing: 1px;">${orderId}</div>
        </div>
        
        <!-- অর্ডার সারাংশ -->
        <div style="
          text-align: left;
          font-size: 13px;
          color: #5a4020;
          line-height: 1.8;
          background: #faf6f0;
          padding: 12px 16px;
          border-radius: 8px;
          margin-bottom: 20px;
        ">
          <div><strong>📦 পণ্য:</strong> ${orderData.product}</div>
          <div><strong>👤 নাম:</strong> ${orderData.name}</div>
          <div><strong>📞 ফোন:</strong> ${orderData.phone}</div>
          <div><strong>📍 ঠিকানা:</strong> ${orderData.address}</div>
          <div><strong>💰 মোট মূল্য:</strong> ${orderData.totalPrice}</div>
          <div><strong>🚚 ডেলিভারি চার্জ:</strong> ৳ ${orderData.deliveryCharge}</div>
        </div>
        
        <button onclick="closeSuccessModal()" style="
          width: 100%;
          padding: 12px;
          background: #B87333;
          color: #fff;
          border: none;
          border-radius: 8px;
          font-size: 15px;
          font-weight: 500;
          cursor: pointer;
          transition: background 0.2s;
        " onmouseover="this.style.background='#a0622a'" onmouseout="this.style.background='#B87333'">
          ঠিক আছে
        </button>
      </div>
    </div>
    
    <style>
      @keyframes fadeIn {
        from { opacity: 0; }
        to { opacity: 1; }
      }
      @keyframes slideUp {
        from { transform: translateY(30px); opacity: 0; }
        to { transform: translateY(0); opacity: 1; }
      }
    </style>
  `;
  
  // মোডাল যোগ করা
  const modalContainer = document.createElement('div');
  modalContainer.innerHTML = modalHTML;
  document.body.appendChild(modalContainer.firstElementChild);
}

function closeSuccessModal() {
  const modal = document.getElementById('orderSuccessModal');
  if (modal) {
    modal.style.opacity = '0';
    modal.style.transition = 'opacity 0.3s ease';
    setTimeout(() => {
      modal.remove();
    }, 300);
  }
}

// ============================================================
//  ৫. হোয়াটসঅ্যাপে অর্ডার পাঠানো
// ============================================================

function whatsappOrder() {
  const name = document.getElementById('userName').value.trim() || 'নাম দেওয়া হয়নি';
  const phone = document.getElementById('userPhone').value.trim() || 'ফোন দেওয়া হয়নি';
  const product = document.getElementById('userProduct');
  const productText = product.options[product.selectedIndex].text;
  const address = document.getElementById('userAddress').value.trim() || 'ঠিকানা দেওয়া হয়নি';
  const totalPrice = document.getElementById('totalPrice').textContent;
  
  // ডেলিভারি চার্জ
  const deliveryRadio = document.querySelector('input[name="delivery"]:checked');
  const deliveryCharge = deliveryRadio ? parseInt(deliveryRadio.value) : 0;

  const shopNumber = '8801714931451'; // ← আপনার নম্বর দিন

  const message = `আসসালামু আলাইকুম! আমি অর্ডার করতে চাই। 🙏

📦 পণ্য: ${productText}
👤 নাম: ${name}
📞 ফোন: ${phone}
📍 ঠিকানা: ${address}
💰 মোট মূল্য: ${totalPrice}
🚚 ডেলিভারি চার্জ: ৳ ${deliveryCharge}

দয়া করে অর্ডার কনফার্ম করুন।`;

  const whatsappURL = `https://wa.me/${shopNumber}?text=${encodeURIComponent(message)}`;
  window.open(whatsappURL, '_blank');
}

// ============================================================
//  ৬. পেজ লোড হলে প্রথমবার মোট দাম দেখান
// ============================================================

window.onload = function() {
  calculateTotal();
};

// ESC কী প্রেস করলে মোডাল বন্ধ হবে
document.addEventListener('keydown', function(event) {
  if (event.key === 'Escape') {
    closeSuccessModal();
  }
});

// মোডালের বাইরে ক্লিক করলে বন্ধ হবে
document.addEventListener('click', function(event) {
  const modal = document.getElementById('orderSuccessModal');
  if (modal && event.target === modal) {
    closeSuccessModal();
  }
});
