// script.js
// ===============================================
// CocoBill - Complete Vanilla JS Billing System
// For Coconut & Coconut Oil Shop
// Built exclusively with HTML, CSS & JavaScript
// Production-ready, modular, commented
// ===============================================

let products = [];
let bills = [];
let currentBillItems = [];
let shopDetails = {
    name: "CocoFresh",
    address: "123 Coconut Market Road, Dindigul, Tamil Nadu - 624001",
    phone: "9876543210"
};
let currentEditingBill = null;   // For modal invoice
let editingProductId = null;     // For product modal

const STORAGE_KEYS = {
    PRODUCTS: 'cocobill_products',
    BILLS: 'cocobill_bills',
    SHOP: 'cocobill_shop'
};

// Default products for a coconut & oil shop
const DEFAULT_PRODUCTS = [
    { id: 1, name: "Tender Coconut", unit: "pcs", price: 35 },
    { id: 2, name: "Mature Coconut", unit: "pcs", price: 22 },
    { id: 3, name: "Coconut Oil 1L", unit: "bottle", price: 180 },
    { id: 4, name: "Coconut Oil 500ml", unit: "bottle", price: 98 },
    { id: 5, name: "Coconut Oil Bulk", unit: "L", price: 165 }
];

// Initialize the entire app
function initializeApp() {
    loadFromLocalStorage();
    renderProductsTable();
    populateProductSelect();
    updateBillNumber();
    updateCurrentDate();
    showSection('billing');
    
    // Keyboard shortcuts
    document.addEventListener('keydown', handleKeyboardShortcuts);
    
    console.log('%c🚀 CocoBill initialized successfully for coconut shop!', 'color:#15803d; font-weight:700');
}

// Load data from localStorage
function loadFromLocalStorage() {
    const savedProducts = localStorage.getItem(STORAGE_KEYS.PRODUCTS);
    products = savedProducts ? JSON.parse(savedProducts) : [...DEFAULT_PRODUCTS];
    
    const savedBills = localStorage.getItem(STORAGE_KEYS.BILLS);
    bills = savedBills ? JSON.parse(savedBills) : [];
    
    const savedShop = localStorage.getItem(STORAGE_KEYS.SHOP);
    if (savedShop) shopDetails = JSON.parse(savedShop);
}

// Save everything
function saveToLocalStorage() {
    localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(products));
    localStorage.setItem(STORAGE_KEYS.BILLS, JSON.stringify(bills));
    localStorage.setItem(STORAGE_KEYS.SHOP, JSON.stringify(shopDetails));
}

// Render products table in Product Management
function renderProductsTable() {
    const tbody = document.getElementById('products-body');
    tbody.innerHTML = '';
    
    products.forEach(product => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td><strong>${product.name}</strong></td>
            <td>${product.unit}</td>
            <td>₹${product.price}</td>
            <td>
                <button onclick="editProduct(${product.id})" class="btn-secondary" style="padding:4px 12px;font-size:0.8rem">Edit</button>
                <button onclick="deleteProduct(${product.id})" class="btn-danger" style="padding:4px 12px;font-size:0.8rem;margin-left:4px">Delete</button>
            </td>
        `;
        tbody.appendChild(row);
    });
}

// Populate dropdown in billing
function populateProductSelect() {
    const select = document.getElementById('product-select');
    select.innerHTML = `<option value="">Select product...</option>`;
    
    products.forEach(p => {
        const option = document.createElement('option');
        option.value = p.id;
        option.textContent = `${p.name} - ₹${p.price} / ${p.unit}`;
        select.appendChild(option);
    });
    
    // Custom option
    const customOpt = document.createElement('option');
    customOpt.value = 'custom';
    customOpt.textContent = '➕ Custom Product';
    select.appendChild(customOpt);
}

// Handle product selection in billing
function handleProductSelect() {
    const select = document.getElementById('product-select');
    const value = select.value;
    const customDiv = document.getElementById('custom-fields');
    
    if (value === 'custom') {
        customDiv.classList.remove('hidden');
        document.getElementById('item-price').readOnly = false;
        document.getElementById('item-price').value = '';
    } else if (value) {
        customDiv.classList.add('hidden');
        const product = products.find(p => p.id == value);
        if (product) {
            document.getElementById('item-price').readOnly = true;
            document.getElementById('item-price').value = product.price;
        }
    }
}

// Add item to current bill
function addItemToCurrentBill() {
    const select = document.getElementById('product-select');
    const qty = parseFloat(document.getElementById('item-qty').value) || 0;
    let name, unit, price;
    
    if (!qty || qty <= 0) {
        showToast('❌ Quantity must be greater than 0', true);
        return;
    }
    
    if (select.value === 'custom') {
        name = document.getElementById('custom-name').value.trim();
        unit = document.getElementById('custom-unit').value.trim() || 'pcs';
        price = parseFloat(document.getElementById('custom-price').value) || 0;
        if (!name || price <= 0) {
            showToast('❌ Fill custom product details', true);
            return;
        }
    } else if (select.value) {
        const product = products.find(p => p.id == select.value);
        if (!product) return;
        name = product.name;
        unit = product.unit;
        price = parseFloat(document.getElementById('item-price').value);
    } else {
        showToast('❌ Select a product', true);
        return;
    }
    
    const lineTotal = qty * price;
    
    currentBillItems.push({
        name: name,
        qty: qty,
        unit: unit,
        price: price,
        lineTotal: lineTotal
    });
    
    renderCurrentBillTable();
    calculateCurrentBill();
    
    // Clear inputs for next item
    document.getElementById('item-qty').value = 1;
    document.getElementById('product-select').value = '';
    document.getElementById('custom-fields').classList.add('hidden');
    
    showToast(`✅ ${name} added`);
}

// Render the live bill table
function renderCurrentBillTable() {
    const tbody = document.getElementById('bill-items-body');
    tbody.innerHTML = '';
    
    currentBillItems.forEach((item, index) => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${item.name}</td>
            <td>${item.qty}</td>
            <td>${item.unit}</td>
            <td>₹${item.price}</td>
            <td>₹${item.lineTotal.toFixed(2)}</td>
            <td><button onclick="removeBillItem(${index})" style="color:#b91c1c;font-size:1.3rem">×</button></td>
        `;
        tbody.appendChild(row);
    });
    
    if (currentBillItems.length === 0) {
        tbody.innerHTML = `<tr><td colspan="6" style="text-align:center;padding:2rem;color:#64748b">No items yet. Add products above 👆</td></tr>`;
    }
}

// Remove item from current bill
function removeBillItem(index) {
    currentBillItems.splice(index, 1);
    renderCurrentBillTable();
    calculateCurrentBill();
}

// Calculate subtotal, discount, grand total
function calculateCurrentBill() {
    let subtotal = currentBillItems.reduce((sum, item) => sum + item.lineTotal, 0);
    
    const discountType = document.getElementById('discount-type').value;
    const discountValue = parseFloat(document.getElementById('discount-value').value) || 0;
    
    let discountAmount = 0;
    if (discountType === 'percent') {
        discountAmount = subtotal * (discountValue / 100);
    } else {
        discountAmount = discountValue;
    }
    
    // Prevent negative total
    if (discountAmount > subtotal) discountAmount = subtotal;
    
    const grandTotal = Math.max(0, subtotal - discountAmount);
    
    // Update UI
    document.getElementById('subtotal-display').textContent = `₹${subtotal.toFixed(2)}`;
    document.getElementById('discount-amount-display').textContent = `- ₹${discountAmount.toFixed(2)}`;
    document.getElementById('grand-total-display').textContent = `₹${grandTotal.toFixed(2)}`;
    
    return { subtotal, discountAmount, grandTotal, discountType, discountValue };
}

// Generate full bill object and show invoice
function generateAndShowInvoice() {
    if (currentBillItems.length === 0) {
        showToast('❌ Add at least one item!', true);
        return;
    }
    
    const customerName = document.getElementById('customer-name').value.trim() || 'Walk-in';
    let customerMobile = document.getElementById('customer-mobile').value.trim();
    
    // Simple validation for WhatsApp
    if (customerMobile && customerMobile.length === 10) {
        customerMobile = '91' + customerMobile;
    }
    
    const totals = calculateCurrentBill();
    
    // Generate unique bill number
    const dateStr = new Date().toISOString().slice(0,10).replace(/-/g, '');
    const billCounter = bills.length + 1;
    const billNo = `CF${dateStr}-${String(billCounter).padStart(3, '0')}`;
    
    const newBill = {
        id: Date.now(),
        billNo: billNo,
        date: new Date().toISOString(),
        customerName: customerName,
        customerMobile: customerMobile,
        items: [...currentBillItems],
        subtotal: totals.subtotal,
        discountType: totals.discountType,
        discountValue: totals.discountValue,
        discountAmount: totals.discountAmount,
        grandTotal: totals.grandTotal
    };
    
    bills.unshift(newBill); // newest first
    saveToLocalStorage();
    
    // Show invoice
    currentEditingBill = newBill;
    showInvoiceModal(newBill);
    
    // Reset current bill
    clearCurrentBill(false);
    
    showToast(`🎟️ Bill #${billNo} generated!`);
}

// Show full professional invoice in modal
function showInvoiceModal(bill) {
    currentEditingBill = bill;
    
    document.getElementById('modal-bill-no').textContent = bill.billNo;
    document.getElementById('modal-date').textContent = new Date(bill.date).toLocaleString('en-IN', { 
        day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' 
    });
    document.getElementById('modal-customer-name').textContent = bill.customerName;
    document.getElementById('modal-customer-mobile').textContent = bill.customerMobile ? '+' + bill.customerMobile : '—';
    
    // Shop info
    document.getElementById('invoice-shop-name').textContent = shopDetails.name;
    document.getElementById('invoice-shop-address').innerHTML = shopDetails.address + `<br>📞 ${shopDetails.phone}`;
    
    // Items
    const tbody = document.getElementById('modal-items-body');
    tbody.innerHTML = '';
    
    bill.items.forEach(item => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${item.name}</td>
            <td class="text-right">${item.qty} ${item.unit}</td>
            <td class="text-right">₹${item.price}</td>
            <td class="text-right">₹${item.lineTotal.toFixed(2)}</td>
        `;
        tbody.appendChild(tr);
    });
    
    document.getElementById('modal-subtotal').textContent = `₹${bill.subtotal.toFixed(2)}`;
    document.getElementById('modal-discount').textContent = `- ₹${bill.discountAmount.toFixed(2)}`;
    document.getElementById('modal-grand-total').innerHTML = `<strong>₹${bill.grandTotal.toFixed(2)}</strong>`;
    
    // Show modal
    document.getElementById('invoice-modal').style.display = 'flex';
}

// Close modal
function closeModal() {
    document.getElementById('invoice-modal').style.display = 'none';
    currentEditingBill = null;
}

// Print invoice
function printInvoice() {
    const originalContent = document.body.innerHTML;
    const modalContent = document.querySelector('.invoice-paper').outerHTML;
    
    document.body.innerHTML = `
        <style>
            @media print {
                body { margin:0; padding:20px; font-family:Inter,sans-serif; }
            }
        </style>
        ${modalContent}
    `;
    window.print();
    // Restore
    document.body.innerHTML = originalContent;
    location.reload(); // quick restore of JS state
}

// Download PDF using jsPDF
function downloadCurrentPDF() {
    if (!currentEditingBill) return;
    
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
    });
    
    const bill = currentEditingBill;
    let y = 20;
    
    // Header
    doc.setFontSize(24);
    doc.text('🥥', 20, y);
    doc.setFontSize(22);
    doc.text(shopDetails.name.toUpperCase(), 45, y);
    y += 12;
    
    doc.setFontSize(11);
    doc.text(shopDetails.address, 20, y);
    y += 6;
    doc.text(`Phone: ${shopDetails.phone}`, 20, y);
    y += 12;
    
    // Bill info
    doc.setFontSize(13);
    doc.text(`Bill No: ${bill.billNo}`, 20, y);
    doc.text(`Date: ${new Date(bill.date).toLocaleDateString('en-IN')}`, 120, y);
    y += 10;
    
    doc.text(`Customer: ${bill.customerName}`, 20, y);
    if (bill.customerMobile) doc.text(`Mobile: +${bill.customerMobile}`, 120, y);
    y += 15;
    
    // Table header
    doc.setFillColor(21, 128, 61);
    doc.rect(20, y, 170, 8, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(10);
    doc.text('ITEM', 25, y + 6);
    doc.text('QTY', 95, y + 6);
    doc.text('RATE', 125, y + 6);
    doc.text('AMOUNT', 165, y + 6);
    y += 12;
    
    doc.setTextColor(0, 0, 0);
    
    // Items
    bill.items.forEach(item => {
        if (y > 240) {
            doc.addPage();
            y = 20;
        }
        doc.text(item.name.substring(0, 28), 25, y);
        doc.text(`${item.qty} ${item.unit}`, 95, y);
        doc.text(`₹${item.price}`, 125, y);
        doc.text(`₹${item.lineTotal.toFixed(2)}`, 165, y);
        y += 8;
    });
    
    y += 8;
    doc.line(20, y, 190, y);
    y += 8;
    
    // Totals
    doc.text('SUBTOTAL', 120, y);
    doc.text(`₹${bill.subtotal.toFixed(2)}`, 165, y);
    y += 8;
    
    doc.text('DISCOUNT', 120, y);
    doc.text(`- ₹${bill.discountAmount.toFixed(2)}`, 165, y);
    y += 8;
    
    doc.setFontSize(16);
    doc.text('GRAND TOTAL', 120, y);
    doc.text(`₹${bill.grandTotal.toFixed(2)}`, 165, y);
    
    // Footer
    doc.setFontSize(10);
    y = 270;
    doc.text('Thank you for shopping with CocoFresh! 🥥', 20, y);
    doc.text('No GST applied', 20, y + 6);
    
    doc.save(`${bill.billNo}.pdf`);
    showToast('📄 PDF downloaded');
}

// Send bill via WhatsApp
function sendViaWhatsApp() {
    if (!currentEditingBill) return;
    const bill = currentEditingBill;
    
    let message = `Hello ${bill.customerName},\n\n`;
    message += `Your bill from *${shopDetails.name}* is *₹${bill.grandTotal.toFixed(2)}*\n`;
    message += `Bill No: ${bill.billNo}\n`;
    message += `Date: ${new Date(bill.date).toLocaleDateString('en-IN')}\n\n`;
    
    message += `Items:\n`;
    bill.items.forEach(item => {
        message += `• ${item.name} × ${item.qty} ${item.unit} = ₹${item.lineTotal.toFixed(2)}\n`;
    });
    
    message += `\nThank you! Visit again 🥥\nCocoFresh, Dindigul`;
    
    const encodedMsg = encodeURIComponent(message);
    const waUrl = `https://wa.me/${bill.customerMobile}?text=${encodedMsg}`;
    
    window.open(waUrl, '_blank');
    closeModal();
}

// Clear current bill
function clearCurrentBill(showToastMsg = true) {
    currentBillItems = [];
    renderCurrentBillTable();
    calculateCurrentBill();
    document.getElementById('customer-name').value = '';
    document.getElementById('customer-mobile').value = '';
    if (showToastMsg) showToast('🧹 Current bill cleared');
    updateBillNumber();
}

// Update displayed bill number (preview)
function updateBillNumber() {
    const dateStr = new Date().toISOString().slice(0,10).replace(/-/g, '');
    const nextCounter = bills.length + 1;
    document.getElementById('current-bill-no').textContent = `CF${dateStr}-${String(nextCounter).padStart(3, '0')}`;
}

function updateCurrentDate() {
    const el = document.getElementById('current-date');
    el.textContent = new Date().toLocaleDateString('en-IN', {
        weekday: 'short', day: 'numeric', month: 'short', year: 'numeric'
    });
}

// ============== PRODUCT MANAGEMENT ==============
function showAddProductModal() {
    editingProductId = null;
    document.getElementById('product-modal-title').textContent = 'Add New Product';
    document.getElementById('modal-product-name').value = '';
    document.getElementById('modal-product-unit').value = 'pcs';
    document.getElementById('modal-product-price').value = '';
    document.getElementById('product-modal').style.display = 'flex';
}

function editProduct(id) {
    const product = products.find(p => p.id === id);
    if (!product) return;
    
    editingProductId = id;
    document.getElementById('product-modal-title').textContent = 'Edit Product';
    document.getElementById('modal-product-name').value = product.name;
    document.getElementById('modal-product-unit').value = product.unit;
    document.getElementById('modal-product-price').value = product.price;
    document.getElementById('product-modal').style.display = 'flex';
}

function saveProductModal() {
    const name = document.getElementById('modal-product-name').value.trim();
    const unit = document.getElementById('modal-product-unit').value.trim();
    const price = parseFloat(document.getElementById('modal-product-price').value);
    
    if (!name || !unit || isNaN(price) || price <= 0) {
        showToast('❌ All fields are required', true);
        return;
    }
    
    if (editingProductId) {
        // Edit
        const product = products.find(p => p.id === editingProductId);
        if (product) {
            product.name = name;
            product.unit = unit;
            product.price = price;
        }
    } else {
        // Add new
        const newId = products.length ? Math.max(...products.map(p => p.id)) + 1 : 1;
        products.push({
            id: newId,
            name: name,
            unit: unit,
            price: price
        });
    }
    
    saveToLocalStorage();
    renderProductsTable();
    populateProductSelect();
    closeProductModal();
    showToast('✅ Product saved');
}

function closeProductModal() {
    document.getElementById('product-modal').style.display = 'none';
}

function deleteProduct(id) {
    if (confirm('Delete this product permanently?')) {
        products = products.filter(p => p.id !== id);
        saveToLocalStorage();
        renderProductsTable();
        populateProductSelect();
        showToast('🗑️ Product removed');
    }
}

// ============== BILL HISTORY ==============
function showHistory() {
    renderHistoryTable(bills);
}

function renderHistoryTable(filteredBills) {
    const tbody = document.getElementById('history-body');
    tbody.innerHTML = '';
    
    filteredBills.forEach(bill => {
        const date = new Date(bill.date);
        const row = document.createElement('tr');
        row.innerHTML = `
            <td><strong>${bill.billNo}</strong></td>
            <td>${date.toLocaleDateString('en-IN')}</td>
            <td>${bill.customerName}</td>
            <td>${bill.customerMobile ? '+' + bill.customerMobile : '—'}</td>
            <td><strong>₹${bill.grandTotal.toFixed(2)}</strong></td>
            <td>
                <button onclick="viewOldBill(${bill.id})" class="btn-primary" style="padding:6px 14px;font-size:0.85rem">View</button>
            </td>
        `;
        tbody.appendChild(row);
    });
    
    if (filteredBills.length === 0) {
        tbody.innerHTML = `<tr><td colspan="6" style="text-align:center;padding:3rem;color:#64748b">No bills found</td></tr>`;
    }
}

function filterHistory() {
    const search = document.getElementById('history-search').value.toLowerCase().trim();
    if (!search) {
        renderHistoryTable(bills);
        return;
    }
    
    const filtered = bills.filter(bill => 
        (bill.customerMobile && bill.customerMobile.includes(search)) ||
        bill.customerName.toLowerCase().includes(search) ||
        bill.billNo.toLowerCase().includes(search)
    );
    renderHistoryTable(filtered);
}

function viewOldBill(id) {
    const bill = bills.find(b => b.id === id);
    if (bill) showInvoiceModal(bill);
}

// ============== REPORTS ==============
function renderReports() {
    // Today's revenue
    const today = new Date().toDateString();
    const todayBills = bills.filter(b => new Date(b.date).toDateString() === today);
    
    const todayRevenue = todayBills.reduce((sum, b) => sum + b.grandTotal, 0);
    document.getElementById('today-revenue').textContent = `₹${todayRevenue.toFixed(2)}`;
    document.getElementById('today-bills-count').textContent = `${todayBills.length} bills today`;
    
    // All-time
    const totalRevenue = bills.reduce((sum, b) => sum + b.grandTotal, 0);
    document.getElementById('total-revenue').textContent = `₹${totalRevenue.toFixed(2)}`;
    document.getElementById('total-bills-count').textContent = `${bills.length} total bills`;
    
    // Average
    const avg = bills.length ? (totalRevenue / bills.length) : 0;
    document.getElementById('avg-bill').textContent = `₹${avg.toFixed(2)}`;
    
    // Last 5 bills
    const last5 = bills.slice(0, 5);
    const container = document.getElementById('last-bills-list');
    container.innerHTML = '';
    
    last5.forEach(bill => {
        const div = document.createElement('div');
        div.className = 'last-bill-item';
        div.innerHTML = `
            <div>
                <strong>${bill.billNo}</strong><br>
                <small>${new Date(bill.date).toLocaleDateString('en-IN')}</small> • ${bill.customerName}
            </div>
            <div style="text-align:right">
                <span style="font-size:1.4rem;font-weight:700">₹${bill.grandTotal.toFixed(2)}</span>
                <button onclick="viewOldBill(${bill.id});" class="btn-secondary" style="margin-left:12px;padding:4px 12px">View</button>
            </div>
        `;
        container.appendChild(div);
    });
}

// Export all data as JSON
function exportAllData() {
    const data = {
        exportedOn: new Date().toISOString(),
        shop: shopDetails,
        products: products,
        bills: bills
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `cocobill-full-backup-${new Date().toISOString().slice(0,10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    
    showToast('📤 Full data exported');
}

// Reset everything (danger)
function resetAllData() {
    if (confirm('⚠️ This will DELETE ALL bills and reset products to default.\n\nAre you sure?')) {
        localStorage.clear();
        location.reload();
    }
}

// Settings modal
function showSettingsModal() {
    document.getElementById('settings-shop-name').value = shopDetails.name;
    document.getElementById('settings-shop-address').value = shopDetails.address;
    document.getElementById('settings-shop-phone').value = shopDetails.phone;
    document.getElementById('settings-modal').style.display = 'flex';
}

function saveShopSettings() {
    shopDetails.name = document.getElementById('settings-shop-name').value;
    shopDetails.address = document.getElementById('settings-shop-address').value;
    shopDetails.phone = document.getElementById('settings-shop-phone').value;
    saveToLocalStorage();
    closeSettingsModal();
    showToast('✅ Shop settings saved');
}

function closeSettingsModal() {
    document.getElementById('settings-modal').style.display = 'none';
}

// Dark mode
function toggleDarkMode() {
    document.documentElement.classList.toggle('dark');
    const icon = document.getElementById('dark-icon');
    icon.textContent = document.documentElement.classList.contains('dark') ? '☀️' : '🌙';
    localStorage.setItem('cocobill_darkmode', document.documentElement.classList.contains('dark'));
}

// Section navigation
function showSection(section) {
    // Remove active from all
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    document.querySelectorAll('.section').forEach(sec => sec.classList.remove('active'));
    
    // Activate
    document.getElementById('tab-' + section).classList.add('active');
    document.getElementById(section + '-section').classList.add('active');
    
    // Extra refresh for reports & history
    if (section === 'reports') renderReports();
    if (section === 'history') renderHistoryTable(bills);
}

// Keyboard shortcuts
function handleKeyboardShortcuts(e) {
    if (e.ctrlKey && e.key === 'k') {
        e.preventDefault();
        showSection('billing');
        document.getElementById('customer-name').focus();
    }
    
    // In billing section only
    if (document.getElementById('billing-section').classList.contains('active')) {
        if (e.key === 'Enter' && document.activeElement.id === 'item-qty') {
            e.preventDefault();
            addItemToCurrentBill();
        }
    }
}

// Simple toast notification
function showToast(message, isError = false) {
    const toast = document.getElementById('toast');
    toast.textContent = message;
    toast.style.background = isError ? '#b91c1c' : '#15803d';
    toast.classList.remove('hidden');
    toast.style.display = 'flex';
    
    setTimeout(() => {
        toast.style.display = 'none';
        toast.classList.add('hidden');
    }, 2800);
}

// ============== START THE APP ==============
window.onload = initializeApp;