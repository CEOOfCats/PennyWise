function checkAuth(){
  const token = getToken();
  const publicPages = ['index.html', '', '/'];
  const page = window.location.pathname.split('/').pop();

  if(!token && !publicPages.includes(page)){ //Get back bro
    window.location.href = 'index.html';
    return false;
  }
  if(token && publicPages.includes(page)){ //You alr in man
    window.location.href = 'dashboard.html';
    return false;
  }
  return true;
}

function logout(){
  removeToken();
  window.location.href = 'index.html';
}

function formatCurrency(value){
  if(value == null) return '$0.00';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD'
  }).format(value);
}

function formatDate(dateStr){
  if(!dateStr) return '-';
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function showToast(message, type = 'success'){ //Just a noti
  let container = document.querySelector('.toast-container');
  if(!container){
    container = document.createElement('div');
    container.className = 'toast-container';
    document.body.appendChild(container);
  }

  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  
  const icons = {
    success: '<svg width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"/></svg>',
    error: '<svg width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>',
    warning: '<svg width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg>'
  };

  toast.innerHTML = `${icons[type] || icons.success}<span>${message}</span>`;
  container.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(20px)';
    setTimeout(() => toast.remove(), 200);
  }, 3500);
}

function toggleSidebar(){
  document.querySelector('.sidebar').classList.toggle('open');
}

// Close sidebar when clicking outside on mobile
document.addEventListener('click', (e) => {
  const sidebar = document.querySelector('.sidebar');
  const toggle = document.querySelector('.menu-toggle');
  if(!sidebar || !toggle) return;
  if(window.innerWidth > 768) return;
  if(!sidebar.contains(e.target) && !toggle.contains(e.target)){
    sidebar.classList.remove('open');
  }
});