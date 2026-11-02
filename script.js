// SpendWise — beginner-friendly expense tracker
// Transactions are saved in this browser using LocalStorage.

const STORAGE_KEY = "spendwise-transactions";
const categories = {
  expense: ["Food", "Travel", "Shopping", "Education", "Bills", "Health", "Entertainment", "Other"],
  income: ["Salary", "Allowance", "Freelance", "Gift", "Other"]
};
const categoryColors = {
  Food: "#8d7cf0", Travel: "#55b8a4", Shopping: "#f0a66d",
  Education: "#6f9ee8", Bills: "#e47e9a", Health: "#83b7d8",
  Entertainment: "#b18ad9", Other: "#a5a5b7"
};
const categoryIcons = {
  Food: "🍜", Travel: "🚌", Shopping: "🛍️", Education: "📚",
  Bills: "🧾", Health: "💊", Entertainment: "🎬", Other: "✦",
  Salary: "💼", Allowance: "💵", Freelance: "💻", Gift: "🎁"
};

const form = document.getElementById("transaction-form");
const modal = document.getElementById("modal-backdrop");
const categorySelect = document.getElementById("category");
let transactions = loadTransactions();

function loadTransactions() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
    return Array.isArray(saved) ? saved : [];
  } catch (error) {
    return [];
  }
}

function saveTransactions() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(transactions));
}

function formatMoney(value) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency", currency: "INR", maximumFractionDigits: 2
  }).format(value);
}

function formatDate(dateString) {
  const date = new Date(dateString + "T00:00:00");
  return date.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

function showModal() {
  modal.classList.add("show");
  modal.setAttribute("aria-hidden", "false");
  document.getElementById("title").focus();
}
function hideModal() {
  modal.classList.remove("show");
  modal.setAttribute("aria-hidden", "true");
  form.reset();
  document.getElementById("date").value = new Date().toISOString().slice(0, 10);
  document.getElementById("form-error").textContent = "";
  updateCategoryOptions();
}

function updateCategoryOptions() {
  const type = document.querySelector('input[name="type"]:checked').value;
  categorySelect.innerHTML = "";
  categories[type].forEach(category => {
    const option = document.createElement("option");
    option.value = category;
    option.textContent = category;
    categorySelect.appendChild(option);
  });
}

function renderSummary() {
  const income = transactions.filter(item => item.type === "income").reduce((sum, item) => sum + item.amount, 0);
  const expenses = transactions.filter(item => item.type === "expense").reduce((sum, item) => sum + item.amount, 0);
  document.getElementById("income-total").textContent = formatMoney(income);
  document.getElementById("expense-total").textContent = formatMoney(expenses);
  document.getElementById("balance-total").textContent = formatMoney(income - expenses);
  document.getElementById("transaction-count").textContent = transactions.length;
  const insightTitle = document.getElementById("insight-title");
  const insightCopy = document.getElementById("insight-copy");
  if (transactions.length === 0) {
    insightTitle.textContent = "Your journey starts here";
    insightCopy.textContent = "Add your first transaction to get a simple snapshot of your finances.";
  } else if (income - expenses >= 0) {
    insightTitle.textContent = "You're in a positive balance!";
    insightCopy.textContent = `You have ${formatMoney(income - expenses)} left after recorded expenses. Keep tracking your money habits.`;
  } else {
    insightTitle.textContent = "Your expenses are higher";
    insightCopy.textContent = `Recorded spending is ${formatMoney(expenses - income)} more than your income. Review your transactions to understand where it goes.`;
  }
}

function renderChart() {
  const totals = {};
  transactions.filter(item => item.type === "expense").forEach(item => {
    totals[item.category] = (totals[item.category] || 0) + item.amount;
  });
  const entries = Object.entries(totals).sort((a, b) => b[1] - a[1]);
  const chart = document.getElementById("category-chart");
  const legend = document.getElementById("category-legend");
  chart.innerHTML = "";
  legend.innerHTML = "";
  if (entries.length === 0) {
    chart.innerHTML = '<div class="empty-chart">Add an expense to see your spending breakdown.</div>';
    return;
  }
  const max = entries[0][1];
  entries.slice(0, 5).forEach(([category, amount]) => {
    const row = document.createElement("div");
    row.className = "chart-row";
    const name = document.createElement("span");
    name.className = "chart-name";
    name.textContent = category;
    const track = document.createElement("div");
    track.className = "bar-track";
    const fill = document.createElement("div");
    fill.className = "bar-fill";
    fill.style.width = `${(amount / max) * 100}%`;
    fill.style.background = categoryColors[category] || categoryColors.Other;
    track.appendChild(fill);
    const value = document.createElement("span");
    value.className = "chart-value";
    value.textContent = formatMoney(amount);
    row.append(name, track, value);
    chart.appendChild(row);
    const legendItem = document.createElement("span");
    legendItem.className = "legend-item";
    const dot = document.createElement("i");
    dot.className = "legend-dot";
    dot.style.background = categoryColors[category] || categoryColors.Other;
    legendItem.append(dot, document.createTextNode(category));
    legend.appendChild(legendItem);
  });
}

function renderTransactions() {
  const list = document.getElementById("transaction-list");
  const search = document.getElementById("search-input").value.toLowerCase().trim();
  const filter = document.getElementById("type-filter").value;
  const filtered = transactions.filter(item => {
    const matchesSearch = item.title.toLowerCase().includes(search) || item.category.toLowerCase().includes(search);
    return matchesSearch && (filter === "all" || item.type === filter);
  }).sort((a, b) => b.date.localeCompare(a.date) || b.id - a.id);

  list.innerHTML = "";
  if (filtered.length === 0) {
    const row = document.createElement("tr");
    row.className = "empty-row";
    const cell = document.createElement("td");
    cell.colSpan = 5;
    cell.innerHTML = '<div class="empty-state"><span>✧</span><strong>No transactions found</strong><p>Try another search or add a transaction.</p></div>';
    row.appendChild(cell);
    list.appendChild(row);
    return;
  }

  filtered.forEach(item => {
    const row = document.createElement("tr");
    const titleCell = document.createElement("td");
    const titleWrap = document.createElement("div");
    titleWrap.className = "transaction-title";
    const icon = document.createElement("span");
    icon.className = "transaction-icon";
    icon.textContent = categoryIcons[item.category] || "✦";
    const title = document.createElement("span");
    title.textContent = item.title;
    titleWrap.append(icon, title);
    titleCell.appendChild(titleWrap);

    const categoryCell = document.createElement("td");
    const tag = document.createElement("span");
    tag.className = "category-tag";
    tag.textContent = item.category;
    categoryCell.appendChild(tag);

    const dateCell = document.createElement("td");
    dateCell.textContent = formatDate(item.date);
    const amountCell = document.createElement("td");
    amountCell.className = item.type === "income" ? "amount-positive" : "amount-negative";
    amountCell.textContent = `${item.type === "income" ? "+" : "−"}${formatMoney(item.amount)}`;
    const actionCell = document.createElement("td");
    const deleteButton = document.createElement("button");
    deleteButton.className = "delete-btn";
    deleteButton.type = "button";
    deleteButton.textContent = "×";
    deleteButton.setAttribute("aria-label", `Delete ${item.title}`);
    deleteButton.addEventListener("click", () => deleteTransaction(item.id));
    actionCell.appendChild(deleteButton);
    row.append(titleCell, categoryCell, dateCell, amountCell, actionCell);
    list.appendChild(row);
  });
}

function renderApp() {
  renderSummary();
  renderChart();
  renderTransactions();
}

function deleteTransaction(id) {
  transactions = transactions.filter(item => item.id !== id);
  saveTransactions();
  renderApp();
}

document.getElementById("open-form-btn").addEventListener("click", showModal);
document.getElementById("close-form-btn").addEventListener("click", hideModal);
modal.addEventListener("click", event => {
  if (event.target === modal) hideModal();
});
document.addEventListener("keydown", event => {
  if (event.key === "Escape" && modal.classList.contains("show")) hideModal();
});
document.querySelectorAll('input[name="type"]').forEach(radio => {
  radio.addEventListener("change", updateCategoryOptions);
});
document.getElementById("search-input").addEventListener("input", renderTransactions);
document.getElementById("type-filter").addEventListener("change", renderTransactions);

form.addEventListener("submit", event => {
  event.preventDefault();
  const formData = new FormData(form);
  const title = formData.get("title").trim();
  const amount = Number(formData.get("amount"));
  const error = document.getElementById("form-error");
  if (!title || !Number.isFinite(amount) || amount <= 0) {
    error.textContent = "Please enter a description and an amount greater than zero.";
    return;
  }
  transactions.push({
    id: Date.now(),
    title,
    amount,
    type: formData.get("type"),
    category: formData.get("category"),
    date: formData.get("date")
  });
  saveTransactions();
  renderApp();
  hideModal();
});

document.getElementById("current-date").textContent = new Date().toLocaleDateString("en-IN", {
  weekday: "short", day: "numeric", month: "short", year: "numeric"
});
document.getElementById("date").value = new Date().toISOString().slice(0, 10);
updateCategoryOptions();
renderApp();
