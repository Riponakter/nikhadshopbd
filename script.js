/**
 * ========================================================
 *  নিখাঁদ শপ বিডি - অর্ডার ম্যানেজমেন্ট স্ক্রিপ্ট
 * ========================================================
 */

/**
 * ১. পণ্যের দাম + ডেলিভারি চার্জ ক্যালকুলেশন
 *    - পণ্য সিলেক্ট বা ডেলিভারি এলাকা পরিবর্তন হলে স্বয়ংক্রিয়ভাবে কল হবে
 */
function calculateTotal() {
  // পণ্যের দাম নিচ্ছি (select-এর value থেকে)
  const productSelect = document.getElementById('userProduct');
  const productPrice = parseInt(productSelect.value);
  
  // ডেলিভারি চার্জ নিচ্ছি (যে রেডিও বাটন চেক করা আছে)
  const deliveryRadio = document.querySelector('input[name="delivery"]:checked');
  const deliveryCharge = deliveryRadio ? parseInt(deliveryRadio.value) : 0;
  
  // মোট দাম
  const total = productPrice + deliveryCharge;
  
  // মোট দাম দেখানোর জায়গায় আপডেট
  document.getElementById('totalPrice').textContent = '৳ ' + total.toLocaleString();
}

/**
 * ২. পণ্য কার্ড থেকে "অর্ডার করুন" ক্লিক করলে অর্ডার ফর্মে নিয়ে যাবে
 *    - অর্ডার সেকশনে স্ক্রল করবে
 *    - সঠিক পণ্যটি সিলেক্ট করবে
 *    - মোট দাম আপডেট করবে
 */
function goToOrder(productName) {
  // অর্ডার সেকশনে স্ক্রল
  document.getElementById('orderSection').scrollIntoView({ behavior: 'smooth' });
  
  // সিলেক্ট বক্সে পণ্যটি খুঁজে সেট করা (পণ্যের নামের সাথে মিলিয়ে)
  const select = document.getElementById('userProduct');
  for (let i = 0; i < select.options.length; i++) {
    // যেহেতু productName-এ শুধু পণ্যের নাম আছে (ব্র্যাকেটের আগের অংশ), তাই তুলনা করছি
    const optionText = select.options[i].text;
    const productNameClean = productName.split('(')[0].trim();
    if (optionText.includes(productNameClean)) {
      select.selectedIndex = i;
      break;
    }
  }
  
  // ক্যালকুলেশন আপডেট
  calculateTotal();
}

/**
 * ৩. অর্ডার কনফার্ম করুন বাটনে ক্লিক করলে
 *    - ফর্ম ভ্যালিডেশন (নাম, ফোন, ঠিকানা)
 *    - সব ঠিক থাকলে কনফার্মেশন মেসেজ দেখায় (মোট দাম সহ)
 */
function placeOrder() {
  const name = document.getElementById('userName').value.trim();
  const phone = document.getElementById('userPhone').value.trim();
  const product = document.getElementById('userProduct');
  const productText = product.options[product.selectedIndex].text;
  const address = document.getElementById('userAddress').value.trim();
  const totalPrice = document.getElementById('totalPrice').textContent;

  // ভ্যালিডেশন
  if (name === '' || phone === '' || address === '') {
    alert('⚠️ দয়া করে আপনার নাম, মোবাইল নম্বর এবং ঠিকানা সঠিকভাবে পূরণ করুন।');
    return;
  }

  // কনফার্মেশন
  alert('🎉 আপনার অর্ডার কনফার্ম করা হয়েছে! \n\n' +
        '📦 পণ্য: ' + productText + '\n' +
        '👤 নাম: ' + name + '\n' +
        '📞 ফোন: ' + phone + '\n' +
        '📍 ঠিকানা: ' + address + '\n' +
        '💰 মোট মূল্য: ' + totalPrice + '\n\n' +
        'আমরা খুব শীঘ্রই আপনার সাথে যোগাযোগ করব। ধন্যবাদ!');
}

/**
 * ৪. হোয়াটসঅ্যাপে অর্ডার পাঠানোর ফাংশন
 *    - ফর্মের সব তথ্য (মোট দাম সহ) নিয়ে একটি মেসেজ তৈরি করে
 *    - হোয়াটসঅ্যাপ লিংক ওপেন করে
 */
function whatsappOrder() {
  const name = document.getElementById('userName').value.trim() || 'নাম দেওয়া হয়নি';
  const phone = document.getElementById('userPhone').value.trim() || 'ফোন দেওয়া হয়নি';
  const product = document.getElementById('userProduct');
  const productText = product.options[product.selectedIndex].text;
  const address = document.getElementById('userAddress').value.trim() || 'ঠিকানা দেওয়া হয়নি';
  const totalPrice = document.getElementById('totalPrice').textContent;

  // আপনার হোয়াটসঅ্যাপ নম্বর (বাংলাদেশের কোড 880 + ১১ ডিজিটের নম্বর)
  const shopNumber = '8801714931451'; // ← এখানে আপনার নম্বর দিন

  // মেসেজ তৈরি
  const message = `আসসালামু আলাইকুম! আমি অর্ডার করতে চাই। 🙏

📦 পণ্য: ${productText}
👤 নাম: ${name}
📞 ফোন: ${phone}
📍 ঠিকানা: ${address}
💰 মোট মূল্য: ${totalPrice}

দয়া করে অর্ডার কনফার্ম করুন।`;

  // হোয়াটসঅ্যাপ ইউআরএল তৈরি (URL এনকোড করা)
  const whatsappURL = `https://wa.me/${shopNumber}?text=${encodeURIComponent(message)}`;
  
  // নতুন ট্যাবে খোলা
  window.open(whatsappURL, '_blank');
}

/**
 * ৫. পেজ লোড হলে প্রথমবার মোট দাম দেখান
 *    - ডিফল্ট পণ্য (প্রথম অপশন) ও ডিফল্ট ডেলিভারি (ঢাকার ভিতরে) অনুযায়ী
 */
window.onload = function() {
  calculateTotal();
};