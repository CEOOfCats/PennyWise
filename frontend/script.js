const base_url = "https://pennywise-jigf.onrender.com";

let editing_id = null;
let curr_filters = {};
let curr_sort = {};
let catalog = [];
let authToken = sessionStorage.getItem("access_token");

function logout(){
    sessionStorage.removeItem("access_token");
    window.location.href = "login.html";
}

async function popup(mode, msg){
    const popup_box = document.getElementById("popup-box");
    const popup_msg = document.getElementById("popup-msg");
    const confirmBtn = document.getElementById("confirm");
    const cancelBtn = document.getElementById("cancel");

    popup_msg.textContent = msg;
    popup_box.style.display = "flex";

    return new Promise((resolve) => {
        confirmBtn.onclick = null;
        cancelBtn.onclick = null;

        if(mode === "alert"){
            confirmBtn.textContent = "OK";
            confirmBtn.style.display = "inline-block";
            cancelBtn.style.display = "none";

            confirmBtn.onclick = () => {
                popup_box.style.display = "none";
                resolve(true);
            };

        } else{
            confirmBtn.textContent = "Confirm";
            confirmBtn.style.display = "inline-block";
            cancelBtn.textContent = "Cancel";
            cancelBtn.style.display = "inline-block";

            confirmBtn.onclick = () => {
                popup_box.style.display = "none";
                resolve(true);
            };

            cancelBtn.onclick = () => {
                popup_box.style.display = "none";
                resolve(false);
            };
        }
    });
}

// ONLY FOR START OF SESSION NOT IN BETWEEN
if(authToken === null){ 
    window.location.href = "login.html";
} else{
    loadCatalog(curr_filters, curr_sort);
    loadSummary();
}

async function authFetch(url, options = {}) {
    const headers = {
        ...(options.headers || {}),
        "Authorization": `Bearer ${authToken}`
    };

    const response = await fetch(url, { ...options, headers });

    if(response.status === 401){
        sessionStorage.removeItem("access_token");
        window.location.href = "login.html";
        return;
    }

    return response;
}

function generateQuery(filters, sortBy) {
    const params = new URLSearchParams();

    for(const key in filters){
        if(filters[key]){
            params.append(key, filters[key]);
        }
    }

    for(const key in sortBy){
        if(sortBy[key]){
            params.append(key, sortBy[key]);
        }
    }

    return params.toString();
}

async function loadCatalog(filters = {}, sortBy = {}) {
    const query = generateQuery(filters, sortBy);
    const url = query ? `${base_url}/expenses?${query}` : `${base_url}/expenses`;
    
    const response = await authFetch(url);
    if(!response) return;
    catalog = await response.json();
    // console.log(catalog);

    const table = document.getElementById("Catalog_table");
    table.innerHTML ="";

    catalog.forEach(item => {
        table.insertAdjacentHTML("beforeend", renderItem(item));
    });
}

function renderItem(item){
    return `
        <tr>
            <td title="${item.id}">${item.id}</td>
            <td title="${item.amount}">${item.amount}</td>
            <td title="${item.price}">${item.price}</td>
            <td title="${item.category}">${item.category}</td>
            <td title="${item.description}">${item.description}</td>
            <td title="${item.purchase_date}">${item.purchase_date}</td>
            <td> 
                <button class="btn-delete" onclick="delete_item(${item.id})" title="Delete">&times;</button>
                <button class="btn-edit" onclick="start_edit(${item.id})">Edit</button>
            </td>
        </tr>
    `;
}

const add_form = document.getElementById("Add_Form");

add_form.addEventListener('submit', async (event) => {
    event.preventDefault();

    const item = {
        amount: document.getElementById("Amount").value,
        price: document.getElementById("Price").value,
        category: document.getElementById("Category").value,
        description: document.getElementById("Description").value,
        purchase_date: document.getElementById("Purchase_Date").value,
    };

    if(editing_id === null){
        await add_item(item);
    }else{
        // console.log(editing_id);
        await update_item(editing_id, item);
        editing_id = null;
        document.getElementById("method").textContent = "Add an Item";
        document.getElementById("Submit_Btn").textContent = "Add Expense";
    }

    add_form.reset();
});

// async function apiRequest(url, options){
//     const response = await fetch(url, options);

//     if(!response.ok){
//         throw new Error("Request failed");
//     }

//     return response;
// }

function start_edit(id){
    const item = catalog.find(i => i.id === id);
    if(!item) return;

    editing_id = id;
    document.getElementById("Amount").value = item.amount;
    document.getElementById("Price").value = item.price;
    document.getElementById("Category").value = item.category;
    document.getElementById("Description").value = item.description;
    document.getElementById("Purchase_Date").value = item.purchase_date;

    document.getElementById("method").textContent = "Editing Expense";
    document.getElementById("Submit_Btn").textContent = "Confirm Edit";
    document.getElementById("Add_Form").scrollIntoView({ behavior: "smooth", block: "center" });
}

function cancelEdit(){
    editing_id = null;
    add_form.reset();
    document.getElementById("method").textContent = "Add an Item";
    document.getElementById("Submit_Btn").textContent = "Add Expense";
}

async function add_item(item){
    const response = await authFetch(`${base_url}/expenses`, {
        method:"POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify(item)
    }); 
    if(!response) return;

    if(response.ok){
        await loadCatalog(curr_filters, curr_sort);
        await loadSummary();
    } else{
        await popup("alert", "Failed to add expense");
    } 
}

async function delete_item(id){
    if(!(await popup("confirm", "Delete this expense?"))) return;

    const response = await authFetch(`${base_url}/expenses/${id}`, {
        method:"DELETE"
    });
    if(!response) return;

    if(response.ok){
        await loadCatalog(curr_filters, curr_sort);
        await loadSummary();
    }else{
        await popup("alert", "Failed to delete expense");
    }     
}

async function update_item(id, item){
    const response = await authFetch(`${base_url}/expenses/${id}`, {
        method:"PUT",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify(item)
    });
    if(!response) return;

    if(response.ok){
        await loadCatalog(curr_filters, curr_sort);
        await loadSummary();
    } else{
        await popup("alert", "Failed to update expense");
    } 
}

const filter_item = document.getElementById('Filter_Form');
filter_item.addEventListener('submit', async (event) => {
    event.preventDefault();

    const filters = {
        category: document.getElementById("Filter_Category").value,
        min_price: document.getElementById("Filter_Min_Price").value,
        max_price: document.getElementById("Filter_Max_Price").value,
        start_date: document.getElementById("Filter_Start_Date").value,
        end_date: document.getElementById("Filter_End_Date").value,
    };

    curr_filters = filters;

    await loadCatalog(curr_filters, curr_sort);
});

async function clearFilters(){
    curr_filters = {};
    filter_item.reset();
    await loadCatalog(curr_filters, curr_sort);
}

const sort_item = document.getElementById('Sort_Form');
sort_item.addEventListener('submit', async (event) => {
    event.preventDefault();

    const sort = {
        sort_by: document.getElementById("Sort_By").value,
        order: document.getElementById("Sort_Order").value
    };

    curr_sort = sort;

    await loadCatalog(curr_filters, curr_sort);
});

async function loadSummary(){
    const [totalRes, countRes] = await Promise.all([
        authFetch(`${base_url}/expenses/stats/total`),
        authFetch(`${base_url}/expenses/stats/count`)
    ]);
    if(!totalRes || !countRes) return;

    const total = await totalRes.json();
    const count = await countRes.json();

    document.getElementById("Total_Spending").innerText = total["Total Spending"] ?? 0;
    document.getElementById("Expense_Count").innerText = count["Count"];
}

async function searchCategoryTotal(){
    const category = document.getElementById("Stats_Category").value;
    const query = generateQuery({category}, {});
    const url = query ? `${base_url}/expenses/stats/category?${query}` : `${base_url}/expenses/stats/category`;

    const response = await authFetch(url);
    if(!response) return;
    const data = await response.json();

    document.getElementById("Category_Total_Result").textContent = data.length > 0 ? `${data[0].Category}: ${data[0].Total}` : "No results";
}

async function searchDateTotal(){
    const start_date = document.getElementById("Stats_Start_Date").value;
    const end_date = document.getElementById("Stats_End_Date").value;
    const query = generateQuery({start_date, end_date}, {});
    const url = query ? `${base_url}/expenses/stats/date?${query}` : `${base_url}/expenses/stats/date`;

    const response = await authFetch(url);
    if(!response) return;
    const data = await response.json();

    const total = data["Total Spending"];
    document.getElementById("Date_Total_Result").textContent = `Total Spending: ${data["Total Spending"] ?? 0}`;
}