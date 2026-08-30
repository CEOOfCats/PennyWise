checkAuth(); 
//Mostly just chart bs
let categoryChartInstance = null;
let trendChartInstance = null;

async function loadDashboard(){
  try{
    const [totalRes, countRes, catRes] = await Promise.all([
      fetchTotalStats(),
      fetchCountStats(),
      fetchCategoryStats()
    ]);

    document.getElementById('totalSpending').textContent = formatCurrency(totalRes['Total Spending']);
    document.getElementById('totalCount').textContent = countRes.Count || 0;
    
    const avg = countRes.Count ? (totalRes['Total Spending'] / countRes.Count) : 0;
    document.getElementById('avgPerItem').textContent = formatCurrency(avg);
    document.getElementById('categoryCount').textContent = catRes.length;

    renderCategoryChart(catRes);
    await renderTrendChart();
    renderRecentExpenses();
  } 
  catch(e){
    showToast('Failed to load dashboard', 'error');
  }
}

function renderCategoryChart(data) {
  const ctx = document.getElementById('categoryChart').getContext('2d');
  if(categoryChartInstance) categoryChartInstance.destroy();

  const colors = ['#0d9488', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#10b981', '#6366f1'];

  categoryChartInstance = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: data.map(d => d.Category),
      datasets: [{
        data: data.map(d => d.Total),
        backgroundColor: colors,
        borderWidth: 0
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {position: 'right', labels: { usePointStyle: true, padding: 16 }}
      },
      cutout: '65%'
    }
  });
}

async function renderTrendChart(){
  const end = new Date();
  const start = new Date();
  start.setDate(start.getDate() - 30);
  
  const startStr = start.toISOString().split('T')[0];
  const endStr = end.toISOString().split('T')[0];

  try{
    const expenses = await fetchExpenses({ start_date: startStr, end_date: endStr, sort_by: 'date', order: 'asc' });
    
    const dateMap = {};
    expenses.forEach(ex => {
      const d = ex.purchase_date;
      dateMap[d] = (dateMap[d] || 0) + (ex.price * ex.amount);
    });

    const labels = Object.keys(dateMap).sort();
    const values = labels.map(d => dateMap[d]);

    const ctx = document.getElementById('trendChart').getContext('2d');
    if(trendChartInstance) trendChartInstance.destroy();

    trendChartInstance = new Chart(ctx, {
      type: 'line',
      data: {
        labels: labels.map(d => formatDate(d)),
        datasets: [{
          label: 'Spending',
          data: values,
          borderColor: '#0d9488',
          backgroundColor: 'rgba(13, 148, 136, 0.1)',
          fill: true,
          tension: 0.4,
          pointRadius: 3,
          pointBackgroundColor: '#0d9488'
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          y: { beginAtZero: true, grid: { color: '#f1f5f9' } },
          x: { grid: { display: false } }
        }
      }
    });
  }
  catch (e){
    console.error('Trend chart error:', e);
  }
}

async function renderRecentExpenses(){
  try{
    const expenses = await fetchExpenses({ sort_by: 'date', order: 'desc' });
    const recent = expenses.slice(0, 5);
    const tbody = document.getElementById('recentTable');
    
    if(recent.length === 0){
      tbody.innerHTML = `<tr><td colspan="4" class="empty-state"><p>No expenses yet</p></td></tr>`;
      return;
    }

    tbody.innerHTML = recent.map(ex => `
      <tr>
        <td>
          <div style="font-weight:600">${ex.category}</div>
          <div style="font-size:0.8rem;color:var(--text-secondary)">${ex.description}</div>
        </td>
        <td>${formatDate(ex.purchase_date)}</td>
        <td class="font-mono">${ex.amount} × ${formatCurrency(ex.price)}</td>
        <td class="font-mono" style="font-weight:600;color:var(--primary-dark)">${formatCurrency(ex.amount * ex.price)}</td>
      </tr>
    `).join('');
  }
  catch(e){
    console.error('Recent expenses error:', e);
  }
}

document.getElementById('quickAddForm').addEventListener('submit', async(e) => {
  e.preventDefault();
  const btn = e.target.querySelector('button[type="submit"]');
  btn.disabled = true;
  btn.innerHTML = '<div class="spinner"></div>';

  try{
    await addExpense({
      amount: parseInt(document.getElementById('qaAmount').value),
      price: parseFloat(document.getElementById('qaPrice').value),
      category: document.getElementById('qaCategory').value,
      description: document.getElementById('qaDesc').value,
      purchase_date: document.getElementById('qaDate').value
    });
    showToast('Expense added!', 'success');
    e.target.reset();
    document.getElementById('qaDate').valueAsDate = new Date();
    loadDashboard();
  } catch (err) {
    showToast(err.message, 'error');
  } finally {
    btn.disabled = false;
    btn.innerHTML = 'Add Expense';
  }
});

// Set default date
document.getElementById('qaDate').valueAsDate = new Date();
loadDashboard();