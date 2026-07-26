const base_url = "http://127.0.0.1:8000";

function togglePassword(inputId, imgId){
    const input = document.getElementById(inputId);
    const img = document.getElementById(imgId);
    if(input.type === "password"){
        input.type = "text";
        img.src = "close.png";
    } else{
        input.type = "password";
        img.src = "open.png";
    }
}

const login_form = document.getElementById("Login_Form");
const register_form = document.getElementById("Register_Form");
const error_box = document.getElementById("Auth_Error");

function showRegister(){
    login_form.style.display = "none";
    register_form.style.display = "flex";
    error_box.textContent = "";
}

function showLogin(){
    register_form.style.display = "none";
    login_form.style.display = "flex";
    error_box.textContent = "";
}

login_form.addEventListener("submit", async (event) => {
    event.preventDefault();
    error_box.textContent = "";

    const username = document.getElementById("Login_Username").value;
    const password = document.getElementById("Login_Password").value;

    // OAuth2PasswordRequestForm expects form-urlencoded data, not JSON
    const body = new URLSearchParams();
    body.append("username", username);
    body.append("password", password);

    const response = await fetch(`${base_url}/login`, {
        method: "POST",
        headers: {
            "Content-Type": "application/x-www-form-urlencoded"
        },
        body: body
    });

    if(response.ok){
        const data = await response.json();
        sessionStorage.setItem("access_token", data.access_token);
        window.location.href = "index.html";
    } else {
        error_box.textContent = "Incorrect username or password.";
    }
});

register_form.addEventListener("submit", async (event) => {
    event.preventDefault();
    error_box.textContent = "";

    const username = document.getElementById("Register_Username").value;
    const password = document.getElementById("Register_Password").value;

    const response = await fetch(`${base_url}/users`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({ username, password })
    });

    if(response.ok){
        register_form.reset();
        showLogin();
        error_box.textContent = "Account created. Please log in.";
    } else {
        const data = await response.json();
        error_box.textContent = data.detail || "Registration failed.";
    }
});