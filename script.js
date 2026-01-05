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


const typeExpBtn = document.getElementById('type-exp');
const typeIncBtn = document.getElementById('type-inc');
const transTypeInput = document.getElementById('trans-type');


const localStorageTransactions = JSON.parse(
  localStorage.getItem('transactions')
);


let transactions =
  localStorage.getItem('transactions') !== null ? localStorageTransactions : [];


let chart;


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


const expenseCategories = `
    <option value="food">Food 🍔</option>
    <option value="transport">Transport 🚕</option>
    <option value="shopping">Shopping 🛍️</option>
    <option value="entertainment">Entertainment 🎬</option>
    <option value="bills">Bills 🧾</option>
    <option value="other">Other 📦</option>
`;

const incomeCategories = `
    <option value="income">Salary/Income </option>
    <option value="other">Other Income </option>
`;

function updateCategoryOptions(type) {
  if (type === 'income') {
    category.innerHTML = incomeCategories;
  } else {
    category.innerHTML = expenseCategories;
  }
}


updateCategoryOptions('expense');


function addTransaction(e) {
  e.preventDefault();

  if (text.value.trim() === '' || amount.value.trim() === '') {
    alert('Please add a text and amount');
  } else {
    const type = transTypeInput.value;
    let finalAmount = +amount.value;

    if (type === 'expense') {
      finalAmount = -Math.abs(finalAmount);
    } else {
      finalAmount = Math.abs(finalAmount);
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


function generateID() {
  return Math.floor(Math.random() * 100000000);
}


const categoryDetails = {
  income: { icon: '💰', label: 'Income' },
  food: { icon: '🍔', label: 'Food' },
  transport: { icon: '🚕', label: 'Transport' },
  shopping: { icon: '🛍️', label: 'Shopping' },
  entertainment: { icon: '🎬', label: 'Entertainment' },
  bills: { icon: '🧾', label: 'Bills' },
  other: { icon: '📦', label: 'Other' }
};


function addTransactionDOM(transaction) {
  const sign = transaction.amount < 0 ? '-' : '+';

  const catKey = transaction.category || 'other';
  const cat = categoryDetails[catKey] || categoryDetails['other'];

  const item = document.createElement('li');

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


function removeTransaction(id) {
  transactions = transactions.filter(transaction => transaction.id !== id);

  updateLocalStorage();

  init();
}


function updateLocalStorage() {
  localStorage.setItem('transactions', JSON.stringify(transactions));
}


function checkEmptyState() {
  if (transactions.length === 0) {
    emptyState.classList.remove('hidden');
    list.classList.add('hidden');
  } else {
    emptyState.classList.add('hidden');
    list.classList.remove('hidden');
  }
}


function initChart() {
  const ctx = budgetChartEl.getContext('2d');

  chart = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: [],
      datasets: [{
        data: [],
        backgroundColor: [
          '#ffadad',
          '#ffd6a5',
          '#fdffb6',
          '#caffbf',
          '#9bf6ff',
          '#a0c4ff',
          '#bdb2ff'
        ],
        borderWidth: 0,
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

  const expenseTransactions = transactions.filter(t => t.amount < 0);

  if (expenseTransactions.length === 0) {
    chart.data.labels = ['No Expenses'];
    chart.data.datasets[0].data = [1];
    chart.data.datasets[0].backgroundColor = ['rgba(255,255,255,0.1)'];
    chart.update();
    return;
  }

  const categories = {};

  expenseTransactions.forEach(t => {
    const cat = t.category || 'other';
    const label = categoryDetails[cat].label;
    const amount = Math.abs(t.amount);

    if (categories[label]) {
      categories[label] += amount;
    } else {
      categories[label] = amount;
    }
  });

  const labels = Object.keys(categories);
  const data = Object.values(categories);

  const colors = [
    '#f72585',
    '#7209b7',
    '#3a0ca3',
    '#4361ee',
    '#4cc9f0',
    '#2ecc71',
    '#f39c12'
  ];

  chart.data.labels = labels;
  chart.data.datasets[0].data = data;
  chart.data.datasets[0].backgroundColor = colors.slice(0, labels.length);
  chart.data.datasets[0].borderWidth = 0;
  chart.data.datasets[0].hoverOffset = 15;

  chart.options.plugins.legend.labels.color = '#fff';
  chart.options.plugins.tooltip.backgroundColor = 'rgba(0, 0, 0, 0.8)';
  chart.options.plugins.tooltip.titleColor = '#fff';
  chart.options.plugins.tooltip.bodyColor = '#fff';

  chart.update();
}


function init() {
  list.innerHTML = '';
  checkEmptyState();

  transactions.forEach(addTransactionDOM);
  updateValues();
}

initChart();
init();

form.addEventListener('submit', addTransaction);
