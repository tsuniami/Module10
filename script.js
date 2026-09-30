/* ============================================================
   SneakerPapi — Module 10: Create New Order
   ============================================================ */

// Product inventory (Net Available Stock)

var INVENTORY = [
    { code: "NK-DUNK-41",    name: "Nike Dunk Low Panda",      size: "41", price: 7500, netAvailableStock: 5  },
    { code: "NK-AF1-44",     name: "Nike Air Force 1 '07",     size: "44", price: 6995, netAvailableStock: 4  },
    { code: "AD-SAMBA-42",   name: "Adidas Samba OG",          size: "42", price: 6200, netAvailableStock: 3  },
    { code: "NB-550-43",     name: "New Balance 550 Green",    size: "43", price: 8900, netAvailableStock: 2  },
    { code: "VN-OLDSK-39",   name: "Vans Old Skool Black",     size: "39", price: 3800, netAvailableStock: 6  },
    { code: "CROCS-CLOG-40", name: "Crocs Classic Clog White", size: "40", price: 2500, netAvailableStock: 10 }
];

// Manual search: walk through the inventory with a loop
function findProductByCode(code) {
    for (var i = 0; i < INVENTORY.length; i++) {
        if (INVENTORY[i].code === code) {
            return INVENTORY[i];
        }
    }
    return null;
}

class CartNode {
    constructor(item) {
        this.item = item;   // { code, name, size, price, quantity } 
        this.next = null;   // pointer to the next node 
    }
}

class Cart {
    constructor() {
        this.head = null;   /* first node */
        this.length = 0;    /* manual counter */
    }

    // Traverse the list looking for a matching Item CODE 
    findByCode(code) {
        var current = this.head;
        while (current !== null) {
            if (current.item.code === code) {
                return current.item;
            }
            current = current.next;
        }
        return null;
    }

    addItem(code, quantity) {
        var existing = this.findByCode(code);
        if (existing !== null) {
            existing.quantity = existing.quantity + quantity;
            return;
        }

        var product = findProductByCode(code);
        var newNode = new CartNode({
            code: product.code,
            name: product.name,
            size: product.size,
            price: product.price,
            quantity: quantity
        });

        if (this.head === null) {
            this.head = newNode;
        } else {
            var last = this.head;
            while (last.next !== null) {
                last = last.next;
            }
            last.next = newNode;
        }
        this.length = this.length + 1;
    }

    // Traverse with current + previous, then reconnect the nodes
    removeByCode(code) {
        var current = this.head;
        var previous = null;
        while (current !== null) {
            if (current.item.code === code) {
                if (previous === null) {
                    this.head = current.next;
                } else {
                    previous.next = current.next;
                }
                this.length = this.length - 1;
                return true;
            }
            previous = current;
            current = current.next;
        }
        return false;
    }

    clear() {
        this.head = null;
        this.length = 0;
    }
}

var cart = new Cart();

var MAX_QUANTITY_PER_LINE = 99;
var MAX_NAME_LENGTH = 60;

// Order registry (manual array position + counter)

var ORDERS = [];
var orderCount = 0;
var orderSequence = 901;   //next unique order number 


function twoDigits(value) {
    if (value < 10) {
        return "0" + value;
    }
    return "" + value;
}

function buildTimestamp(now) {
    return now.getFullYear() + "-" + twoDigits(now.getMonth() + 1) + "-" + twoDigits(now.getDate()) +
           " " + twoDigits(now.getHours()) + ":" + twoDigits(now.getMinutes()) + ":" + twoDigits(now.getSeconds());
}

// Whole-peso amounts only: builds "7,500" digit by digit 
function formatWithCommas(amount) {
    if (amount === 0) {
        return "0";
    }
    var result = "";
    var digitCount = 0;
    while (amount > 0) {
        var digit = amount % 10;
        if (digitCount === 3) {
            result = "," + result;
            digitCount = 0;
        }
        result = digit + result;
        amount = Math.floor(amount / 10);
        digitCount = digitCount + 1;
    }
    return result;
}

function peso(amount) {
    return "\u20B1" + formatWithCommas(amount) + ".00";
}

function pad(text, width) {
    var result = "" + text;
    while (result.length < width) {
        result = result + " ";
    }
    return result;
}

function isBlank(text) {
    for (var i = 0; i < text.length; i++) {
        if (text[i] !== " ") {
            return false;
        }
    }
    return true;
}

// Removes leading/trailing spaces (manual, no built-ins)
function trimText(text) {
    var start = 0;
    var end = text.length - 1;
    while (start <= end && (text[start] === " " || text[start] === "\t")) { start++; }
    while (end >= start && (text[end] === " " || text[end] === "\t")) { end--; }
    var result = "";
    for (var i = start; i <= end; i++) {
        result = result + text[i];
    }
    return result;
}

// Customer name: letters, spaces, period, hyphen, apostrophe only (must contain a letter)
function isValidName(text) {
    var letters = 0;
    for (var i = 0; i < text.length; i++) {
        var ch = text[i];
        var isLetter = (ch >= "A" && ch <= "Z") || (ch >= "a" && ch <= "z") || (ch >= "\u00C0" && ch <= "\u024F");
        if (isLetter) {
            letters = letters + 1;
        } else if (ch !== " " && ch !== "." && ch !== "-" && ch !== "'") {
            return false;
        }
    }
    return letters > 0;
}

// Keeps typed text from breaking the page 
function escapeHtml(text) {
    var result = "";
    for (var i = 0; i < text.length; i++) {
        var ch = text[i];
        if (ch === "&") { result = result + "&amp;"; }
        else if (ch === "<") { result = result + "&lt;"; }
        else if (ch === ">") { result = result + "&gt;"; }
        else if (ch === '"') { result = result + "&quot;"; }
        else { result = result + ch; }
    }
    return result;
}

// DOM references

var form          = document.getElementById("orderForm");
var itemCodeSel   = document.getElementById("itemCode");
var quantityInput = document.getElementById("quantity");
var cartPanel     = document.getElementById("cartPanel");
var outputBox     = document.getElementById("outputContainer");

// Fill the Item CODE dropdown 
for (var p = 0; p < INVENTORY.length; p++) {
    var option = document.createElement("option");
    option.value = INVENTORY[p].code;
    option.textContent = INVENTORY[p].code + " \u2014 " + INVENTORY[p].name +
                         " (Size " + INVENTORY[p].size + ") \u2014 " + peso(INVENTORY[p].price);
    itemCodeSel.appendChild(option);
}

// Cart display 

function renderCart() {
    if (cart.head === null) {
        cartPanel.innerHTML =
            "<h3>Cart Contents</h3>" +
            '<p class="empty-note">Cart is empty. Add at least one item before creating the order.</p>';
        return;
    }

    var rows = "";
    var gross = 0;
    var number = 1;
    var current = cart.head;

    while (current !== null) {
        var item = current.item;
        var product = findProductByCode(item.code);
        var subtotal = item.price * item.quantity;
        gross = gross + subtotal;

        rows += "<tr>" +
            '<td class="num">' + number + "</td>" +
            '<td class="code">' + item.code + "</td>" +
            "<td>" + item.name + " (Size " + item.size + ")</td>" +
            '<td class="num">' + item.quantity + "</td>" +
            '<td class="num">' + product.netAvailableStock + "</td>" +
            '<td class="num">' + peso(item.price) + "</td>" +
            '<td class="num">' + peso(subtotal) + "</td>" +
            '<td><button type="button" class="mini ghost" data-remove="' + item.code + '">Remove</button></td>' +
            "</tr>";

        current = current.next;
        number = number + 1;
    }

    cartPanel.innerHTML =
        "<h3>Cart Contents</h3>" +
        '<table class="grid-table">' +
            "<tr><th>#</th><th>CODE</th><th>Product</th><th>Qty</th><th>Net Available</th><th>Unit Price</th><th>Subtotal</th><th>Action</th></tr>" +
            rows +
            '<tr class="totals"><td colspan="6">GROSS TOTAL (Pre-Order)</td><td class="num">' + peso(gross) + "</td><td></td></tr>" +
        "</table>" +
        '<div class="btn-row"><button type="button" id="createOrderBtn">Create Order</button></div>';
}

// One click listener handles both Remove and Create Order buttons 
cartPanel.addEventListener("click", function (event) {
    var target = event.target;
    var removeCode = target.getAttribute("data-remove");
    if (removeCode !== null) {
        cart.removeByCode(removeCode);
        renderCart();
        return;
    }
    if (target.id === "createOrderBtn") {
        createOrder();
    }
});

// Add Item to Cart

form.addEventListener("submit", function (event) {
    event.preventDefault();

    var code = itemCodeSel.value;
    var quantityText = trimText(quantityInput.value);
    var quantity = Number(quantityText);

    if (code === "" || findProductByCode(code) === null) {
        alert("Please select a valid item.");
        return;
    }
    if (quantityText === "" || isNaN(quantity)) {
        alert("Please enter a quantity.");
        quantityInput.focus();
        return;
    }
    if (Math.floor(quantity) !== quantity || quantity < 1) {
        alert("Quantity must be a whole number of at least 1.");
        quantityInput.focus();
        return;
    }
    var already = cart.findByCode(code);
    var combined = quantity;
    if (already !== null) {
        combined = already.quantity + quantity;
    }
    if (combined > MAX_QUANTITY_PER_LINE) {
        alert("Quantity for a single item cannot exceed " + MAX_QUANTITY_PER_LINE + ".");
        quantityInput.focus();
        return;
    }

    /* Stock is verified when the order is created (Step 2), not here */
    cart.addItem(code, quantity);
    quantityInput.value = 1;
    renderCart();
});

document.getElementById("clearCartBtn").addEventListener("click", function () {
    cart.clear();
    renderCart();
});


function createOrder() {
    var customerName = trimText(document.getElementById("customerName").value);
    var orderType    = document.getElementById("orderType").value;

    if (customerName === "") {
        alert("Customer Name is required before creating an order.");
        document.getElementById("customerName").focus();
        return;
    }
    if (customerName.length < 2) {
        alert("Customer Name must be at least 2 characters long.");
        document.getElementById("customerName").focus();
        return;
    }
    if (customerName.length > MAX_NAME_LENGTH) {
        alert("Customer Name cannot exceed " + MAX_NAME_LENGTH + " characters.");
        document.getElementById("customerName").focus();
        return;
    }
    if (!isValidName(customerName)) {
        alert("Customer Name may only contain letters, spaces, periods, hyphens and apostrophes.");
        document.getElementById("customerName").focus();
        return;
    }
    if (orderType !== "Walk-In" && orderType !== "Online") {
        alert("Please select a valid Order Type.");
        return;
    }
    if (cart.head === null) {
        alert("Cart is empty. Add at least one item first.");
        return;
    }

    // Verify stock first (check only, never change stock)
    var current = cart.head;
    while (current !== null) {
        var product = findProductByCode(current.item.code);
        if (product === null) {
            alert("Item " + current.item.code + " no longer exists in the inventory. Remove it from the cart.");
            return;
        }
        if (current.item.quantity > product.netAvailableStock) {
            alert("Insufficient stock for " + current.item.code + ".\nRequested: " + current.item.quantity +
                  " | Net Available Stock: " + product.netAvailableStock + "\nPlease reduce the quantity or remove the item.");
            return;
        }
        current = current.next;
    }

    var now = new Date();
    var orderId = "ORD-" + now.getFullYear() + "-" + orderSequence;

    var order = {
        orderId: orderId,
        timestamp: buildTimestamp(now),
        customerName: customerName,
        orderType: orderType,
        items: [],
        itemCount: 0,
        totalQuantity: 0,
        grossTotal: 0,
        paidAmount: 0,        /* Module 11 will add the down payment */
        status: "UNPAID"      /* Module 11 changes this to RESERVED */
    };

    // Subtotals and gross total 
    current = cart.head;

    while (current !== null) {
        var subtotal = current.item.price * current.item.quantity;

        order.items[order.itemCount] = {
            code: current.item.code,
            name: current.item.name,
            size: current.item.size,
            price: current.item.price,
            quantity: current.item.quantity,
            subtotal: subtotal
        };
        order.itemCount = order.itemCount + 1;
        order.totalQuantity = order.totalQuantity + current.item.quantity;
        order.grossTotal = order.grossTotal + subtotal;

        current = current.next;
    }

    // Save the order record 
    ORDERS[orderCount] = order;
    orderCount = orderCount + 1;
    orderSequence = orderSequence + 1;

    cart.clear();
    renderCart();
    renderOutput(order);
    renderDirectory();
    document.getElementById("customerName").value = "";
}

// Output: created order record 

function renderOutput(order) {
    var safeName = escapeHtml(order.customerName);

    var html = '<h3>Order Record</h3><table>' +
        "<tr><td>Order ID</td><td>" + order.orderId + "</td></tr>" +
        "<tr><td>Timestamp</td><td>" + order.timestamp + "</td></tr>" +
        "<tr><td>Customer Name</td><td>" + safeName + "</td></tr>" +
        "<tr><td>Order Type</td><td>" + escapeHtml(order.orderType) + "</td></tr>" +
        "<tr><td>Total Quantity</td><td>" + order.totalQuantity + "</td></tr>" +
        "<tr><td>Gross Total</td><td>" + peso(order.grossTotal) + "</td></tr>" +
        "<tr><td>Paid Amount</td><td>" + peso(order.paidAmount) + "</td></tr>" +
        '<tr><td>Status</td><td><span class="tag">' + order.status + "</span></td></tr></table>";

    html += '<h3 class="spaced">Ordered Items</h3><table class="grid-table">' +
            "<tr><th>CODE</th><th>Product</th><th>Size</th><th>Qty</th><th>Unit Price</th><th>Subtotal</th></tr>";
    for (var i = 0; i < order.itemCount; i++) {
        var it = order.items[i];
        html += "<tr>" +
            '<td class="code">' + it.code + "</td>" +
            "<td>" + it.name + "</td>" +
            "<td>" + it.size + "</td>" +
            '<td class="num">' + it.quantity + "</td>" +
            '<td class="num">' + peso(it.price) + "</td>" +
            '<td class="num">' + peso(it.subtotal) + "</td></tr>";
    }
    html += '<tr class="totals"><td colspan="5">GROSS TOTAL</td><td class="num">' + peso(order.grossTotal) + "</td></tr></table>";

    html += "<p><strong>Stock verified successfully.</strong><br>" +
            "Order " + order.orderId + " created successfully. Status: UNPAID.</p>";

    outputBox.innerHTML = html;
}

// Order Directory & Stock Reference

function renderDirectory() {
    var out = "ORDER DIRECTORY (created by Module 10)\n";

    if (orderCount === 0) {
        out += "`-- (no orders created yet)\n";
    } else {
        for (var i = 0; i < orderCount; i++) {
            var order = ORDERS[i];
            var isLast = (i === orderCount - 1);
            var branch = "|-- ";
            var indent = "|   ";
            if (isLast) {
                branch = "`-- ";
                indent = "    ";
            }

            out += branch + order.orderId + "  [" + order.status + "]  " + order.customerName + "\n";
            out += indent + "|-- Order Type  : " + order.orderType + "\n";
            out += indent + "|-- Created     : " + order.timestamp + "\n";
            out += indent + "|-- Items (" + order.itemCount + ")\n";
            for (var j = 0; j < order.itemCount; j++) {
                var it = order.items[j];
                var itemBranch = "|-- ";
                if (j === order.itemCount - 1) {
                    itemBranch = "`-- ";
                }
                out += indent + "|   " + itemBranch + pad(it.code, 16) + " x" + pad(it.quantity, 3) +
                       pad(it.name, 28) + peso(it.subtotal) + "\n";
            }
            out += indent + "`-- Gross Total : " + peso(order.grossTotal) + "\n";
        }
    }

    out += "\nNET AVAILABLE STOCK REFERENCE (not changed by Module 10)\n";
    for (var k = 0; k < INVENTORY.length; k++) {
        var stockBranch = "|-- ";
        if (k === INVENTORY.length - 1) {
            stockBranch = "`-- ";
        }
        out += stockBranch + pad(INVENTORY[k].code, 16) + pad(INVENTORY[k].name, 28) +
               pad(peso(INVENTORY[k].price), 14) + "Stock: " + INVENTORY[k].netAvailableStock + "\n";
    }
}

// Logo fallback (only if Logo.png is missing)

var logoImg = document.querySelector(".top-logo");
if (logoImg !== null) {
    var showBadge = function () {
        if (logoImg.parentNode === null) { return; }
        var badge = document.createElement("div");
        badge.className = "logo-fallback";
        badge.textContent = "SNEAKERPAPI";
        logoImg.parentNode.replaceChild(badge, logoImg);
    };
    logoImg.addEventListener("error", showBadge);
    if (logoImg.complete && logoImg.naturalWidth === 0) { showBadge(); }
}

// Initial screen

renderCart();
outputBox.innerHTML =
    '<p class="empty-note">No order created yet. Fill in the customer details, add items to the cart, then press <strong>Create Order</strong>.</p>';
renderDirectory();
