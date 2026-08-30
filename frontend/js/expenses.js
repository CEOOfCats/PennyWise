checkAuth();

let allExpenses = [];
let currentFilters = {};

async function loadExpenses(){
  const tbody = document.getElementById('expensesTable');
  tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;padding:40px"><div class="spinner" style="width:32px;height:32px;margin:0 auto"></div></td></tr>';

  try{
    const params = { ...currentFilters };
    const data = await fetchExpenses(params);
    allExpenses = data;
    renderTable(data);
    updateSummary(data);
  }
  catch(e){
    tbody.innerHTML = `<tr><td colspan="6" class="empty-state"><p>${e.message}</p></td></tr>`;
  }
}

function renderTable(data){
  const tbody = document.getElementById('expensesTable');
  
  if(data.length === 0){
    tbody.innerHTML = `
      <tr><td colspan="6">
        <div class="empty-state">
          <svg fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/><path stroke-linecap="round" stroke-linejoin="round" d="M9 10h.01M15 10h.01M9.75 15.25a3.75 3.75 0 117.5 0"/></svg>
          <h3>No expenses found</h3>
          <p>Try adjusting your filters or add a new expense.</p>
        </div>
      </td></tr>`;
    return;
  }

  //For each expense.. and then join
  tbody.innerHTML = data.map(ex => `
    <tr data-id="${ex.id}">
      <td><span class="badge badge-teal">${ex.category}</span></td>
      <td>${ex.description}</td>
      <td class="font-mono">${formatDate(ex.purchase_date)}</td>
      <td class="font-mono">${ex.amount} × ${formatCurrency(ex.price)}</td>
      <td class="font-mono" style="font-weight:600">${formatCurrency(ex.amount * ex.price)}</td>
      <td>
        <div class="actions">
          <button class="icon-btn" onclick="openEditModal(${ex.id})" title="Edit">
            <svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/></svg>
          </button>
          <button class="icon-btn danger" onclick="confirmDelete(${ex.id})" title="Delete">
            <svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
          </button>
        </div>
      </td>
    </tr>
  `).join('');
}

function updateSummary(data){
  const total = data.reduce((sum, ex) => sum + (ex.price * ex.amount), 0);
  const count = data.reduce((sum, ex) => sum + ex.amount, 0);
  document.getElementById('filteredTotal').textContent = formatCurrency(total);
  document.getElementById('filteredCount').textContent = count;
  document.getElementById('resultCount').textContent = `${data.length} result${data.length !== 1 ? 's' : ''}`;
}

function applyFilters(){
  currentFilters = {};
  
  const category = document.getElementById('filterCategory').value;
  const minPrice = document.getElementById('filterMinPrice').value;
  const maxPrice = document.getElementById('filterMaxPrice').value;
  const startDate = document.getElementById('filterStart').value;
  const endDate = document.getElementById('filterEnd').value;
  const sortBy = document.getElementById('sortBy').value;
  const order = document.getElementById('sortOrder').value;

  if(category) currentFilters.category = category;
  if(minPrice) currentFilters.min_price = minPrice;
  if(maxPrice) currentFilters.max_price = maxPrice;
  if(startDate) currentFilters.start_date = startDate;
  if(endDate) currentFilters.end_date = endDate;
  if(sortBy){
    currentFilters.sort_by = sortBy;
    currentFilters.order = order;
  }

  loadExpenses();
}

function clearFilters(){
  document.getElementById('filterCategory').value = '';
  document.getElementById('filterMinPrice').value = '';
  document.getElementById('filterMaxPrice').value = '';
  document.getElementById('filterStart').value = '';
  document.getElementById('filterEnd').value = '';
  document.getElementById('sortBy').value = '';
  document.getElementById('sortOrder').value = 'asc';
  currentFilters = {};
  loadExpenses();
}

function searchTable(){
  const term = document.getElementById('searchInput').value.toLowerCase();
  if(!term){
    renderTable(allExpenses);
    updateSummary(allExpenses);
    return;
  }
  const filtered = allExpenses.filter(ex => 
    ex.description.toLowerCase().includes(term) ||
    ex.category.toLowerCase().includes(term)
  );
  renderTable(filtered);
  updateSummary(filtered);
}

//Hnadling Modal (Popup form)
function openModal(title, expense = null) {
  document.getElementById('modalTitle').textContent = title;
  document.getElementById('expenseForm').reset();
  document.getElementById('expenseId').value = expense ? expense.id : '';
  
  if(expense){
    document.getElementById('fAmount').value = expense.amount;
    document.getElementById('fPrice').value = expense.price;
    document.getElementById('fCategory').value = expense.category;
    document.getElementById('fDesc').value = expense.description;
    document.getElementById('fDate').value = expense.purchase_date;
  }
  else document.getElementById('fDate').valueAsDate = new Date();
  
  document.getElementById('expenseModal').classList.add('active');
}

function closeModal(){
  document.getElementById('expenseModal').classList.remove('active');
}

async function openEditModal(id){
  try{
    const expense = allExpenses.find(e => e.id === id);
    if(!expense) return;
    openModal('Edit Expense', expense);
  }
  catch(e){
    showToast('Could not load expense', 'error');
  }
}

document.getElementById('expenseForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const btn = e.target.querySelector('button[type="submit"]');
  btn.disabled = true;
  btn.innerHTML = '<div class="spinner"></div> Saving...';

  const payload = {
    amount: parseInt(document.getElementById('fAmount').value),
    price: parseFloat(document.getElementById('fPrice').value),
    category: document.getElementById('fCategory').value,
    description: document.getElementById('fDesc').value,
    purchase_date: document.getElementById('fDate').value
  };

  const id = document.getElementById('expenseId').value;

  try{
    if(id){
      await editExpense(id, payload);
      showToast('Expense updated!', 'success');
    }
    else{
      await addExpense(payload);
      showToast('Expense added!', 'success');
    }
    closeModal();
    loadExpenses();
  }
  catch(e){
    showToast(e.message, 'error');
  }
  finally{
    btn.disabled = false;
    btn.innerHTML = 'Save Expense';
  }
});

function confirmDelete(id){
  if(!confirm('Are you sure you want to delete this expense?')) return;
  removeExpense(id)
    .then(() => {
      showToast('Expense deleted', 'success');
      loadExpenses();
    })
    .catch(e => showToast(e.message, 'error'));
}

function exportCSV(){
  if(allExpenses.length === 0){
    showToast('No data to export', 'warning');
    return;
  }
  
  const headers = ['ID', 'Category', 'Description', 'Date', 'Amount', 'Unit Price', 'Total'];
  const rows = allExpenses.map(ex => [
    ex.id,
    `"${ex.category}"`,
    `"${ex.description}"`,
    ex.purchase_date,
    ex.amount,
    ex.price,
    ex.amount * ex.price
  ]);
  
  const csv = [headers, ...rows].map(r => r.join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `pennywise_export_${new Date().toISOString().split('T')[0]}.csv`;
  a.click();
  URL.revokeObjectURL(url);
  showToast('CSV exported!', 'success');
}

//Event listeners
document.getElementById('applyFilters').addEventListener('click', applyFilters);
document.getElementById('clearFilters').addEventListener('click', clearFilters);
document.getElementById('searchInput').addEventListener('input', searchTable);
document.getElementById('exportBtn').addEventListener('click', exportCSV);

//Close modal
document.getElementById('expenseModal').addEventListener('click', (e) => {
  if(e.target === document.getElementById('expenseModal')) closeModal();
});

loadExpenses();