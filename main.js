$(document).ready(function () {
  function initDatabase() {
    const db = new Dexie("myDatabase");
    db.version(2).stores({
      customers: "++id, name, gender, location, phone",
      visits: "++id, date, amount, services, customerId, category",
      settings: "key,value",
    });
    return db;
  }

  const db = initDatabase();

  class CrudOperations {
    constructor(tableName) {
      this.table = db[tableName];
    }

    add(data) {
      return this.table.add(data);
    }

    getAll(filterFn = null) {
      return this.table.toArray().then((records) => {
        return filterFn ? records.filter(filterFn) : records;
      });
    }
  }

  function createCrudInstance(tableName) {
    return new CrudOperations(tableName);
  }

  const customerCrud = createCrudInstance("customers");
  const visitCrud = createCrudInstance("visits");

  async function setDefaultSettings() {
    const existingSetting = await db.settings.get("config");
    if (!existingSetting) {
      const defaultSettings =
        "categories: Grooming,Beautification,Massage\nServices: Hair Cut,Beard Trimming,Facial,Head Massage,Neck Massage";
      await db.settings.put({ key: "config", value: defaultSettings });
    }
  }

  async function saveSettings() {
    const settingsStr = $("#settingsEditor").val();
    await db.settings.put({ key: "config", value: settingsStr });
    alert("Settings saved successfully.");
  }

  async function loadSettings() {
    const setting = await db.settings.get("config");
    const value = setting ? setting.value : "";
    $("#settingsEditor").val(value);
  }

  function refreshList(crudInstance, renderFn, filter = null) {
    crudInstance.getAll(filter).then((records) => {
      renderFn(records);
    });
  }

  // Initialize
  setDefaultSettings().then(() => {
    loadSettings();
  });

  refreshList(customerCrud, renderCustomerList);
  refreshList(visitCrud, renderTransactionList);

  // Event Binding
  $("#saveSettings").click(saveSettings);
  $("#burgerMenu, #menuClose").click(toggleDrawerMenu);
  $(
    "#drawerShowHome, #drawerShowVisits, #drawerShowAddCustomer, #drawerShowAddTransaction",
    "#drawerShowSettings"
  ).click(drawerMenuClickHandler);

  $(document).on("click", ".btn-add-visit", function () {
    const customerId = $(this).data("id");
    $("#customerId").val(customerId);
    $("#showAddTransaction").click();
  });

  $(document).on("click", ".btn-delete", function () {
    const customerId = $(this).data("id");
    if (confirm("Are you sure you want to delete this customer?")) {
      customerCrud.table.delete(customerId).then(() => {
        showToast("Customer deleted successfully");
        refreshList(customerCrud, renderCustomerList);
      });
    }
  });

  // Form Handling
  $("#addCustomer").submit(function (e) {
    e.preventDefault();
    const formData = $(this)
      .serializeArray()
      .reduce((obj, item) => {
        obj[item.name] = item.value;
        return obj;
      }, {});
    customerCrud.add(formData).then(() => {
      showToast("Customer added successfully");
      $("#showHome").click();
      refreshList(customerCrud, renderCustomerList);
    });
  });

  $("#addTransaction").submit(function (e) {
    e.preventDefault();
    const formData = $(this)
      .serializeArray()
      .reduce((obj, item) => {
        obj[item.name] = item.value;
        return obj;
      }, {});
    formData["services"] = formData["services"].split(",");
    visitCrud.add(formData).then(() => {
      showToast("Transaction added successfully");
      $("#showVisits").click();
      refreshList(visitCrud, renderTransactionList);
    });
  });

  $("#searchCustomerForm").submit(function (e) {
    e.preventDefault();
    const query = $("#searchCustomer").val();
    refreshList(
      customerCrud,
      renderCustomerList,
      (c) => c.name.includes(query) || c.phone.includes(query)
    );
  });

  // Filter Transaction by Date
  const today = new Date().toISOString().split("T")[0];
  $("#fromDate").val(today);
  $("#toDate").val(today);
  $("#date").val(today);

  $("#filterTransactionForm").submit(function (e) {
    e.preventDefault();
    const fromDate = new Date($("#fromDate").val());
    const toDate = new Date($("#toDate").val());
    toDate.setHours(23, 59, 59, 999);
    refreshList(visitCrud, renderTransactionList, (v) => {
      const visitDate = new Date(v.date);
      return visitDate >= fromDate && visitDate <= toDate;
    });
  });

  // Routing
  $("#showHome").click(() => {
    showSection("home");
    refreshList(customerCrud, renderCustomerList);
  });

  $("#showAddCustomer").click(() => {
    showSection("addCustomer");
  });

  $("#showAddTransaction").click(async () => {
    showSection("addTransaction");
    await populateTransactionForm();
    refreshList(visitCrud, renderTransactionList);
  });

  $("#showVisits").click(() => {
    showSection("visits");
    refreshList(visitCrud, renderTransactionList);
  });

  $("#showSettings").click(() => {
    showSection("settings");
    loadSettings();
  });

  function toggleDrawerMenu() {
    $drawerMenu.toggleClass("translate-x-full translate-x-0 hidden");
  }

  function drawerMenuClickHandler() {
    const id = this.id.replace("drawerShow", "show");
    $(`#${id}`).click();
    toggleDrawerMenu();
  }

  function hideAllSections() {
    $("#home").hide();
    $("#addCustomer").hide();
    $("#addTransaction").hide();
    $("#visits").hide();
    $("#settings").hide();
  }

  function showSection(sectionId) {
    hideAllSections();
    $(`#${sectionId}`).show();
  }

  // Render and Populate Functions
  async function populateTransactionForm() {
    const setting = await db.settings.get("config");
    if (setting) {
      const lines = setting.value.split("\n");
      const categories = lines[0]
        .split(":")[1]
        .split(",")
        .map((s) => s.trim());
      const services = lines[1]
        .split(":")[1]
        .split(",")
        .map((s) => s.trim());

      let categoryOptions = "";
      categories.forEach((cat) => {
        categoryOptions += `<option value="${cat}">${cat}</option>`;
      });
      $("#category").html(categoryOptions);

      let serviceOptions = "";
      services.forEach((service) => {
        serviceOptions += `<option value="${service}">${service}</option>`;
      });
      $("#services").html(serviceOptions);
    }
  }

  function renderCustomerList(customers) {
    let html = "";
    customers.forEach((c) => {
      html += `<tr class="table-row bg-white border-b dark:bg-gray-800 dark:border-gray-700">
                        <td class="table-cell px-6 py-4">${c.id}</td>
                        <td class="table-cell px-6 py-4">${c.name}</td>
                        <td class="table-cell px-6 py-4 w-1/6">${c.gender}</td>
                        <td class="table-cell px-6 py-4">${c.phone}</td>
                        <td class="table-cell px-6 py-4">
                            <button class="btn-add-visit btn py-2.5 px-2.5 mr-2 mb-2 text-sm font-medium text-gray-900 focus:outline-none bg-white rounded-sm border border-gray-200 hover:bg-gray-100 hover:text-blue-700 focus:z-10 focus:ring-4 focus:ring-gray-200 dark:focus:ring-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-600 dark:hover:text-white dark:hover:bg-gray-700" data-id="${c.id}">Add Visit</button>
                            <button class="btn-delete" data-id="${c.id}">Delete</button>
                        </td>
                    </tr>`;
    });
    $("#customerList").html(html);
  }

  function renderTransactionList(visits) {
    visits.sort((a, b) => new Date(a.date) - new Date(b.date));
    let html = "";
    visits.forEach((v) => {
      html += `<tr class="table-row bg-white border-b dark:bg-gray-800 dark:border-gray-700">
                        <td class="table-cell px-6 py-4">${v.id}</td>
                        <td class="table-cell px-6 py-4">${v.date}</td>
                        <td class="table-cell px-6 py-4"> ₹ ${v.amount}</td>
                        <td class="table-cell px-6 py-4">${v.services.join(
                          ", "
                        )}</td>
                        <td class="table-cell px-6 py-4">${v.customerId}</td>
                        <td class="table-cell px-6 py-4">${v.category}</td>
                    </tr>`;
    });
    $("#transactionList").html(html);
  }

  // Utility Functions
  function showToast(message) {
    const toast = $(
      `<div class="toast fixed bottom-4 right-4 bg-blue-500 text-white p-4 rounded-lg">${message}</div>`
    );
    $("body").append(toast);
    setTimeout(() => {
      toast.remove();
    }, 5000);
  }
});
