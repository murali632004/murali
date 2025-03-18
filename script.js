// Initialize Chart
const ctx = document.getElementById('myChart').getContext('2d');
let myChart;

// Transaction Data
let transactions = [];

// Form Submission
document.getElementById('transactionForm').addEventListener('submit', function (e) {
  e.preventDefault();

  const type = document.getElementById('type').value;
  const category = document.getElementById('category').value;
  const amount = parseFloat(document.getElementById('amount').value);
  const date = document.getElementById('date').value;

  if (!type || !category || !amount || !date) {
    alert("Please fill all fields!");
    return;
  }

  const transaction = { type, category, amount, date };
  transactions.push(transaction);

  updateTransactionTable();
  updateChart();
  updateBalance();
  this.reset();
});

// Update Transaction Table
function updateTransactionTable() {
  const tbody = document.querySelector('#transactionTable tbody');
  tbody.innerHTML = '';

  transactions.forEach((transaction, index) => {
    const row = document.createElement('tr');
    row.innerHTML = `
      <td>${transaction.type}</td>
      <td>${transaction.category}</td>
      <td>₹${transaction.amount.toFixed(2)}</td>
      <td>${transaction.date}</td>
      <td><button onclick="deleteTransaction(${index})" class="delete-btn">Delete</button></td>
    `;
    tbody.appendChild(row);
  });
}

// Delete Transaction
function deleteTransaction(index) {
  if (confirm("Are you sure you want to delete this transaction?")) {
    transactions.splice(index, 1); // Remove the transaction from the array
    updateTransactionTable(); // Update the table
    updateChart(); // Update the chart
    updateBalance(); // Update the available balance
  }
}

// Update Chart
function updateChart() {
  const groupedData = transactions.reduce((acc, transaction) => {
    const date = transaction.date;
    if (!acc[date]) {
      acc[date] = { income: 0, expense: 0 };
    }
    if (transaction.type === 'income') {
      acc[date].income += transaction.amount;
    } else {
      acc[date].expense += transaction.amount;
    }
    return acc;
  }, {});

  const labels = Object.keys(groupedData).sort();
  const incomeData = labels.map((date) => groupedData[date].income);
  const expenseData = labels.map((date) => groupedData[date].expense);

  if (myChart) {
    myChart.destroy();
  }

  myChart = new Chart(ctx, {
    type: 'line',
    data: {
      labels: labels,
      datasets: [
        {
          label: 'Income',
          data: incomeData,
          borderColor: 'rgba(75, 192, 192, 1)',
          backgroundColor: 'rgba(75, 192, 192, 0.2)',
          borderWidth: 2,
          fill: true,
          tension: 0.4,
        },
        {
          label: 'Expenses',
          data: expenseData,
          borderColor: 'rgba(255, 99, 132, 1)',
          backgroundColor: 'rgba(255, 99, 132, 0.2)',
          borderWidth: 2,
          fill: true,
          tension: 0.4,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        y: {
          beginAtZero: true,
          title: {
            display: true,
            text: 'Amount (₹)',
          },
        },
        x: {
          title: {
            display: true,
            text: 'Date',
          },
        },
      },
      plugins: {
        tooltip: {
          mode: 'index',
          intersect: false,
        },
        legend: {
          position: 'top',
        },
      },
      animation: {
        duration: 1000,
        easing: 'easeInOutQuart',
      },
    },
  });
}

// Calculate and Update Available Balance
function updateBalance() {
  const totalIncome = transactions
    .filter((t) => t.type === "income")
    .reduce((sum, t) => sum + t.amount, 0);

  const totalExpense = transactions
    .filter((t) => t.type === "expense")
    .reduce((sum, t) => sum + t.amount, 0);

  const availableBalance = totalIncome - totalExpense;
  document.getElementById("availableBalance").textContent = `₹${availableBalance.toFixed(2)}`;
}

// Download PDF
function downloadPDF() {
  if (transactions.length === 0) {
    alert("No transactions to download!");
    return;
  }

  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();

  // Add Header
  doc.setFontSize(18);
  doc.setTextColor(40);
  doc.text("Expense Tracker - Transaction History", 10, 15);

  // Add Table
  const headers = [["Type", "Category", "Amount (₹)", "Date"]];
  const data = transactions.map((t) => [t.type, t.category, `₹${t.amount.toFixed(2)}`, t.date]);

  doc.autoTable({
    head: headers,
    body: data,
    startY: 25,
    theme: "striped",
    styles: { fontSize: 10, cellPadding: 3 },
    headStyles: { fillColor: [22, 160, 133] },
  });

  // Add Summary
  const totalIncome = transactions
    .filter((t) => t.type === "income")
    .reduce((sum, t) => sum + t.amount, 0);
  const totalExpense = transactions
    .filter((t) => t.type === "expense")
    .reduce((sum, t) => sum + t.amount, 0);

  doc.setFontSize(12);
  doc.text(`Total Income: ₹${totalIncome.toFixed(2)}`, 10, doc.autoTable.previous.finalY + 10);
  doc.text(`Total Expense: ₹${totalExpense.toFixed(2)}`, 10, doc.autoTable.previous.finalY + 20);
  doc.text(`Net Balance: ₹${(totalIncome - totalExpense).toFixed(2)}`, 10, doc.autoTable.previous.finalY + 30);

  // Save PDF
  doc.save("transaction_history.pdf");
}

// Download Word
function downloadWord() {
  if (transactions.length === 0) {
    alert("No transactions to download!");
    return;
  }

  const doc = new docx.Document();
  const paragraphs = transactions.map(
    (transaction) =>
      new docx.Paragraph({
        children: [
          new docx.TextRun(
            `Type: ${transaction.type}, Category: ${transaction.category}, Amount: ₹${transaction.amount.toFixed(2)}, Date: ${transaction.date}`
          ),
        ],
      })
  );

  doc.addSection({
    children: paragraphs,
  });

  docx.Packer.toBlob(doc).then((blob) => {
    saveAs(blob, "transaction_history.docx");
  });
}

// Download Excel
function downloadExcel() {
  if (transactions.length === 0) {
    alert("No transactions to download!");
    return;
  }

  const worksheet = XLSX.utils.json_to_sheet(
    transactions.map((t) => ({
      Type: t.type,
      Category: t.category,
      "Amount (₹)": t.amount,
      Date: t.date,
    }))
  );
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Transactions");
  XLSX.writeFile(workbook, "transaction_history.xlsx");
}

// Initial Chart Render and Balance Update
updateChart();
updateBalance();