const API_BASE_URL = 'https://pennywise-jigf.onrender.com'; 

function getToken(){ //GET TOKEN
  return sessionStorage.getItem('pennywise_token');
}
function setToken(token){ //SET TOKEN
  sessionStorage.setItem('pennywise_token', token);
}
function removeToken(){ //REMOVE TOKEN
  sessionStorage.removeItem('pennywise_token');
}

function authHeaders(isForm = false){
  const token = getToken();
  const headers = {};
  if(!isForm) headers['Content-Type'] = 'application/json';
  if(token) headers['Authorization'] = `Bearer ${token}`;

  return headers;
}

async function apiRequest(endpoint, options = {}){
  const url = `${API_BASE_URL}${endpoint}`;
  const isForm = options.body instanceof FormData;
  
  try{
    const response = await fetch(url, { 
      ...options,
      headers: {
        ...authHeaders(isForm),
        ...(options.headers || {})
      }
    });

    if(response.status === 401){ //Bad
      removeToken();
      window.location.href = 'index.html';
      return;
    }

    if(!response.ok){
      const err = await response.json().catch(() => ({ detail: 'Request failed' }));
      throw new Error(err.detail || `Error ${response.status}`);
    }

    if(response.status === 204) return null; //No content lmao
    return await response.json();
  } 
  catch(e){
    console.error('API Error:', e);
    throw e;
  }
}

//USER AUTH
function loginUser(username, password){
  const formData = new FormData();
  formData.append('username', username);
  formData.append('password', password);
  return apiRequest('/login', { method: 'POST', body: formData });
}

function registerUser(username, password) {
  return apiRequest('/users', {
    method: 'POST',
    body: JSON.stringify({ username, password })
  });
}

//EXPENSES
function fetchExpenses(params = {}){
  const qs = new URLSearchParams(params).toString();
  return apiRequest(`/expenses?${qs}`);
}

function fetchExpense(id){ //GET
  return apiRequest(`/expenses/${id}`);
}

function addExpense(expense){ //CREATE
  return apiRequest('/expenses', {
    method: 'POST',
    body: JSON.stringify(expense)
  });
}

function editExpense(id, expense){ //UPDATE
  return apiRequest(`/expenses/${id}`, {
    method: 'PUT',
    body: JSON.stringify(expense)
  });
}

function removeExpense(id){ //DELETE
  return apiRequest(`/expenses/${id}`, { method: 'DELETE' });
}

//STATS
function fetchTotalStats(){
  return apiRequest('/expenses/stats/total');
}

function fetchCategoryStats(category){
  const qs = category ? `?category=${encodeURIComponent(category)}` : '';
  return apiRequest(`/expenses/stats/category${qs}`);
}

function fetchDateStats(start, end){
  const p = new URLSearchParams();
  if (start) p.append('start_date', start);
  if (end) p.append('end_date', end);
  return apiRequest(`/expenses/stats/date?${p}`);
}

function fetchCountStats(){
  return apiRequest('/expenses/stats/count');
}
