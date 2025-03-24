let transactions = JSON.parse(localStorage.getItem("transactions")) || [];
let budget = JSON.parse(localStorage.getItem("budget")) || {};
let savingsGoal = JSON.parse(localStorage.getItem("savingsGoal")) || { goal: 0, saved: 0 };

function calculateBalance() {
    let totalIncome = transactions.filter(txn => txn.type === "income").reduce((sum, txn) => sum + txn.amount, 0);
    let totalExpenses = transactions.filter(txn => txn.type === "expense").reduce((sum, txn) => sum + txn.amount, 0);
    return { totalIncome, totalExpenses, totalBalance: totalIncome - totalExpenses };
}

function addTransaction() {
    const amount = parseFloat(document.getElementById("transaction-amount").value);
    const type = document.getElementById("transaction-type").value;
    const category = document.getElementById("transaction-category").value || "Misc";

    if (isNaN(amount) || amount <= 0) {
        alert("Please enter a valid amount.");
        return;
    }

    let { totalIncome, totalExpenses, totalBalance } = calculateBalance();

    if (type === "expense" && totalBalance - amount < 0) {
        alert("Insufficient balance! You cannot spend more than you have.");
        return;
    }

    const transaction = { amount, type, category, id: Date.now() };
    transactions.push(transaction);
    localStorage.setItem("transactions", JSON.stringify(transactions));

    updateUI();
    document.getElementById("transaction-amount").value = "";
}

function resetTransactions() {
    if (!confirm("Are you sure you want to reset all transactions and start fresh?")) {
        return;
    }

    transactions = [];
    budget = {};
    savingsGoal = { goal: 0, saved: 0 };

    localStorage.removeItem("transactions");
    localStorage.removeItem("budget");
    localStorage.removeItem("savingsGoal");

    updateUI(0, 0, 0);
}

document.addEventListener("DOMContentLoaded", function() {
    document.getElementById("undo-transaction-btn").addEventListener("click", resetTransactions);
});

function updateUI(totalIncome = null, totalExpenses = null, totalBalance = null) {
    let { totalIncome: inc, totalExpenses: exp, totalBalance: bal } = calculateBalance();

    document.getElementById("total-balance").textContent = `Rs. ${totalBalance !== null ? totalBalance : bal}`;
    document.getElementById("total-expenses").textContent = `Rs. ${totalExpenses !== null ? totalExpenses : exp}`;
    document.getElementById("total-income").textContent = `Rs. ${totalIncome !== null ? totalIncome : inc}`;

    const transactionList = document.getElementById("transaction-list");
    if (transactionList) {
        transactionList.innerHTML = "";
        transactions.forEach(txn => {
            const txnElement = document.createElement("li");
            txnElement.innerHTML = `
                ${txn.category}: ${txn.type === "income" ? "+" : "-"}Rs. ${txn.amount}
                <button onclick="deleteTransaction(${txn.id})">X</button>
            `;
            transactionList.appendChild(txnElement);
        });
    }

    updateBudgetProgress();
    updateSavingsGoalProgress();
}

function deleteTransaction(id) {
    transactions = transactions.filter(txn => txn.id !== id);
    localStorage.setItem("transactions", JSON.stringify(transactions));
    updateUI();
}

function setBudget() {
    const category = document.getElementById("budget-category").value;
    const amount = parseFloat(document.getElementById("budget-amount").value);

    if (!category || isNaN(amount) || amount <= 0) {
        alert("Please enter a valid category and amount.");
        return;
    }

    budget[category] = { total: amount, spent: 0 };
    localStorage.setItem("budget", JSON.stringify(budget));
    updateBudgetProgress();
}

function updateBudgetProgress() {
    const budgetProgress = document.getElementById("budget-progress");
    if (!budgetProgress) return;
    budgetProgress.innerHTML = "";

    for (let category in budget) {
        const spent = transactions
            .filter(txn => txn.category === category && txn.type === "expense")
            .reduce((sum, txn) => sum + txn.amount, 0);

        budget[category].spent = spent;
        const percentage = Math.min((spent / budget[category].total) * 100, 100);
        const isOverBudget = spent > budget[category].total;

        const progressBar = `
            <div style="color: ${isOverBudget ? 'red' : 'black'};">
                ${category}: Rs. ${spent} / Rs. ${budget[category].total}
            </div>
            <progress value="${percentage}" max="100" style="accent-color: ${isOverBudget ? 'red' : 'green'};"></progress>
        `;

        budgetProgress.innerHTML += progressBar;
    }

    localStorage.setItem("budget", JSON.stringify(budget));
}

function setSavingsGoal() {
    const goal = parseFloat(document.getElementById("goal-amount").value);
    if (isNaN(goal) || goal <= 0) {
        alert("Please enter a valid goal amount.");
        return;
    }

    savingsGoal.goal = goal;
    savingsGoal.saved = transactions
        .filter(txn => txn.category === "Savings" && txn.type === "income")
        .reduce((sum, txn) => sum + txn.amount, 0);

    localStorage.setItem("savingsGoal", JSON.stringify(savingsGoal));
    updateSavingsGoalProgress();
}

document.getElementById("add-transaction-btn").addEventListener("click", addTransaction);
document.getElementById("set-budget-btn").addEventListener("click", setBudget);
document.getElementById("set-goal-btn").addEventListener("click", setSavingsGoal);
document.getElementById("undo-transaction-btn").addEventListener("click", resetTransactions);
document.getElementById("undo-transaction-btn").click();

// Initialize UI
updateUI();
