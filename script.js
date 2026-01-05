const balance = document.getElementById('balance');
const money_plus = document.getElementById('money-plus');
const money_minus = document.getElementById('money-minus');
const list = document.getElementById('list');
const form = document.getElementById('form');
const text = document.getElementById('text');
const amount = document.getElementById('amount');
const category = document.getElementById('category');
const budgetChartEl = document.getElementById('budgetChart');
const emptyState = document.getElementById('empty-state');

// Toggle Elements
const typeExpBtn = document.getElementById('type-exp');
const typeIncBtn = document.getElementById('type-inc');
const transTypeInput = document.getElementById('trans-type');

// Local Storage Support
const localStorageTransactions = JSON.parse(
  localStorage.getItem('transactions')
);

// State
let transactions =
  localStorage.getItem('transactions') !== null ? localStorageTransactions : [];

// Chart Instance
let chart;

// Toggle Event Listeners
typeExpBtn.addEventListener('click', () => {
  transTypeInput.value = 'expense';
  typeExpBtn.classList.add('active');
  typeIncBtn.classList.remove('active');
  updateCategoryOptions('expense');
});

typeIncBtn.addEventListener('click', () => {
  transTypeInput.value = 'income';
  typeIncBtn.classList.add('active');
  typeExpBtn.classList.remove('active');
  updateCategoryOptions('income');
});

// Category Options Data
const expenseCategories = `
    <option value="food">Food 🍔</option>
    <option value="transport">Transport 🚕</option>
    <option value="shopping">Shopping 🛍️</option>
    <option value="entertainment">Entertainment 🎬</option>
    <option value="bills">Bills 🧾</option>
    <option value="other">Other 📦</option>
`;

const incomeCategories = `
    <option value="income">Salary/Income 💰</option>
    <option value="other">Other Income 💵</option>
`;

function updateCategoryOptions(type) {
  if (type === 'income') {
    category.innerHTML = incomeCategories;
  } else {
    category.innerHTML = expenseCategories;
  }
}

// Initialize with default options (Expense)
updateCategoryOptions('expense');

// Add transaction
function addTransaction(e) {
  e.preventDefault();

  if (text.value.trim() === '' || amount.value.trim() === '') {
    alert('Please add a text and amount');
  } else {
    // Determine sign based on toggle
    const type = transTypeInput.value;
    let finalAmount = +amount.value;

    if (type === 'expense') {
      finalAmount = -Math.abs(finalAmount); // Ensure it's negative
    } else {
      finalAmount = Math.abs(finalAmount); // Ensure it's positive
    }

    const transaction = {
      id: generateID(),
      text: text.value,
      amount: finalAmount,
      category: category.value || 'other'
    };

    transactions.push(transaction);

    addTransactionDOM(transaction);
    updateValues();

    updateLocalStorage();
    checkEmptyState();

    text.value = '';
    amount.value = '';
  }
}

// Generate random ID
function generateID() {
  return Math.floor(Math.random() * 100000000);
}

// Get Category Details
const categoryDetails = {
  income: { icon: '💰', label: 'Income' },
  food: { icon: '🍔', label: 'Food' },
  transport: { icon: '🚕', label: 'Transport' },
  shopping: { icon: '🛍️', label: 'Shopping' },
  entertainment: { icon: '🎬', label: 'Entertainment' },
  bills: { icon: '🧾', label: 'Bills' },
  other: { icon: '📦', label: 'Other' }
};

// Add transactions to DOM list
function addTransactionDOM(transaction) {
  // Get sign
  const sign = transaction.amount < 0 ? '-' : '+';

  // Get Category info (fallback to other if missing)
  const catKey = transaction.category || 'other';
  const cat = categoryDetails[catKey] || categoryDetails['other'];

  const item = document.createElement('li');

  // Add class based on value
  item.classList.add(transaction.amount < 0 ? 'minus' : 'plus');

  item.innerHTML = `
    <div class="list-info">
        <span>${transaction.text}</span>
        <small class="list-category">${cat.icon} ${cat.label}</small>
    </div>
    <span>${sign}${Math.abs(transaction.amount)}</span>
    <button class="delete-btn" onclick="removeTransaction(${transaction.id})">
        <i class="fas fa-trash"></i>
    </button>
  `;

  list.appendChild(item);
}

// Update the balance, income, expense and charts
function updateValues() {
  const amounts = transactions.map(transaction => transaction.amount);

  const total = amounts.reduce((acc, item) => (acc += item), 0).toFixed(2);

  const income = amounts
    .filter(item => item > 0)
    .reduce((acc, item) => (acc += item), 0)
    .toFixed(2);

  const expense = (
    amounts.filter(item => item < 0).reduce((acc, item) => (acc += item), 0) *
    -1
  ).toFixed(2);

  balance.innerText = `$${total}`;
  money_plus.innerText = `+$${income}`;
  money_minus.innerText = `-$${expense}`;

  updateChart();
}

// Remove transaction by ID
function removeTransaction(id) {
  transactions = transactions.filter(transaction => transaction.id !== id);

  updateLocalStorage();

  init();
}

// Update local storage transactions
function updateLocalStorage() {
  localStorage.setItem('transactions', JSON.stringify(transactions));
}

// Check Empty State
function checkEmptyState() {
  if (transactions.length === 0) {
    emptyState.classList.remove('hidden');
    list.classList.add('hidden');
  } else {
    emptyState.classList.add('hidden');
    list.classList.remove('hidden');
  }
}

// Chart.js Configuration
function initChart() {
  const ctx = budgetChartEl.getContext('2d');

  chart = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: [], // Populated dynamically
      datasets: [{
        data: [],
        backgroundColor: [
          '#ffadad', // Pastel Red
          '#ffd6a5', // Pastel Orange
          '#fdffb6', // Pastel Yellow
          '#caffbf', // Pastel Green
          '#9bf6ff', // Pastel Cyan
          '#a0c4ff', // Pastel Blue
          '#bdb2ff'  // Pastel Purple
        ],
        borderWidth: 0, // Cleaner without border
        hoverOffset: 10
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      cutout: '75%',
      plugins: {
        legend: {
          position: 'bottom',
          labels: {
            color: '#555',
            usePointStyle: true,
            font: { family: 'Inter', size: 12 },
            padding: 20
          }
        },
        tooltip: {
          backgroundColor: '#fff',
          titleColor: '#333',
          bodyColor: '#666',
          bodyFont: { family: 'Inter' },
          borderColor: '#eee',
          borderWidth: 1,
          padding: 10,
          callbacks: {
            label: function (context) {
              return ' $' + context.parsed;
            }
          }
        }
      }
    }
  });
}

function updateChart() {
  if (!chart) return;

  // Calculate Expense by Category (ignore Income for this chart usually, or separate)
  // We will show Expenses Breakdown by default as it's more useful
  const expenseTransactions = transactions.filter(t => t.amount < 0);

  if (expenseTransactions.length === 0) {
    // If no expenses, maybe show transparent or placeholder? 
    // For now, let's clear it
    chart.data.labels = ['No Expenses'];
    chart.data.datasets[0].data = [1];
    chart.data.datasets[0].backgroundColor = ['rgba(255,255,255,0.1)'];
    chart.update();
    return;
  }

  const categories = {};

  expenseTransactions.forEach(t => {
    const cat = t.category || 'other';
    const label = categoryDetails[cat].label; // Use pretty label
    const amount = Math.abs(t.amount);

    if (categories[label]) {
      categories[label] += amount;
    } else {
      categories[label] = amount;
    }
  });

  const labels = Object.keys(categories);
  const data = Object.values(categories);

  // Reset colors if coming from empty state
  // Top 7 Neon Colors for Dark Theme
  const colors = [
    '#f72585', // Neon Pink
    '#7209b7', // Purple
    '#3a0ca3', // Deep Blue
    '#4361ee', // Blue
    '#4cc9f0', // Cyan
    '#2ecc71', // Neon Green
    '#f39c12'  // Orange
  ];

  chart.data.labels = labels;
  chart.data.datasets[0].data = data;
  chart.data.datasets[0].backgroundColor = colors.slice(0, labels.length);
  chart.data.datasets[0].borderWidth = 0;
  chart.data.datasets[0].hoverOffset = 15;

  // Update Chart Options for Dark Mode
  chart.options.plugins.legend.labels.color = '#fff';
  chart.options.plugins.tooltip.backgroundColor = 'rgba(0, 0, 0, 0.8)';
  chart.options.plugins.tooltip.titleColor = '#fff';
  chart.options.plugins.tooltip.bodyColor = '#fff';

  chart.update();
}

// Init app
function init() {
  list.innerHTML = '';
  checkEmptyState();

  transactions.forEach(addTransactionDOM);
  updateValues();
}

initChart();
init();

form.addEventListener('submit', addTransaction);
