checkAuth();

const loginForm = document.getElementById('loginForm');
const registerForm = document.getElementById('registerForm');
const authToggle = document.getElementById('authToggle');
const errorMsg = document.getElementById('errorMsg');
let isLogin = true;

function toggleAuthMode(){ //Register and Login bs
  isLogin = !isLogin;
  if(isLogin){ //Login
    loginForm.classList.remove('hidden');
    registerForm.classList.add('hidden');
    authToggle.innerHTML = `Don't have an account? <a onclick="toggleAuthMode()">Register</a>`;
  } 
  else{ //Register
    loginForm.classList.add('hidden');
    registerForm.classList.remove('hidden');
    authToggle.innerHTML = `Already have an account? <a onclick="toggleAuthMode()">Login</a>`;
  }
  errorMsg.style.display = 'none';
}

loginForm.addEventListener('submit', async(e) => {
  e.preventDefault(); //learnt the hard way
  const btn = loginForm.querySelector('button[type="submit"]');
  const originalText = btn.innerHTML;
  btn.disabled = true;
  btn.innerHTML = '<div class="spinner"></div>';

  try{
    const data = await loginUser(
      document.getElementById('loginUsername').value,
      document.getElementById('loginPassword').value
    );
    setToken(data.access_token);
    window.location.href = 'dashboard.html';
  } 
  catch(e){
    errorMsg.textContent = e.message;
    errorMsg.style.display = 'flex';
    btn.disabled = false;
    btn.innerHTML = originalText;
  }
});

registerForm.addEventListener('submit', async(e) => {
  e.preventDefault();
  const password = document.getElementById('regPassword').value;
  const confirm = document.getElementById('regConfirm').value;

  if(password !== confirm){
    errorMsg.textContent = 'Passwords do not match';
    errorMsg.style.display = 'flex';
    return;
  }
  if(password.length < 8){
    errorMsg.textContent = 'Password must be at least 8 characters';
    errorMsg.style.display = 'flex';
    return;
  }

  const btn = registerForm.querySelector('button[type="submit"]');
  const originalText = btn.innerHTML;
  btn.disabled = true;
  btn.innerHTML = '<div class="spinner"></div>';

  try{
    await registerUser(
      document.getElementById('regUsername').value,
      password
    );
    showToast('Account created! Please log in.', 'success');
    toggleAuthMode();
    errorMsg.style.display = 'none';
  }
  catch(e){
    errorMsg.textContent = e.message;
    errorMsg.style.display = 'flex';
  }
  finally{
    btn.disabled = false;
    btn.innerHTML = originalText;
  }
});