

$(document).ready(function () {
    // Add this code in your main.js or directly in your HTML inside a <script> tag
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('/service-worker.js')
        .then((registration) => {
            console.log('Service Worker registered with scope:', registration.scope);
        })
        .catch((error) => {
            console.log('Service Worker registration failed:', error);
        });
    }
  
    $('#showHome').click();
    // Initialize Dexie
    const db = new Dexie("myDatabase");
    db.version(1).stores({
        customers: '++id, name, gender, location, phone',
        visits: '++id, date, amount, services, customerId, category'
    });

    // Generic CRUD Operations
    class CrudOperations {
        constructor(tableName) {
            this.table = db[tableName];
        }

        add(data) {
            return this.table.add(data);
        }

        getAll(filterFn = null) {
            return this.table.toArray().then(records => {
                return filterFn ? records.filter(filterFn) : records;
            });
        }
    }

    // Instantiate CRUD for customers and visits
    const customerCrud = new CrudOperations('customers');
    const visitCrud = new CrudOperations('visits');

    function refreshList(crudInstance, renderFn, filter = null) {
        crudInstance.getAll(filter).then(records => {
            renderFn(records);
        });
    }

    function renderCustomerList(customers) {
        let html = "";
        console.log("customers: ", customers);
        customers.forEach(c => {
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
    


    $('#addCustomer').submit(function (e) {
        e.preventDefault();
        const formData = $(this).serializeArray().reduce((obj, item) => {
            obj[item.name] = item.value;
            return obj;
        }, {});
        customerCrud.add(formData).then(() => {
            showToast("Customer added successfully");
            $('#showHome').click();
            refreshList(customerCrud, renderCustomerList);
        });
    });
    

    $('#addTransaction').submit(function (e) {
        e.preventDefault();
        const formData = $(this).serializeArray().reduce((obj, item) => {
            obj[item.name] = item.value;
            return obj;
        }, {});
        formData['services'] = formData['services'].split(',');
        visitCrud.add(formData).then(() => {
            showToast("Transaction added successfully");
            $('#showVisits').click();
            refreshList(visitCrud, renderTransactionList);
        });
    });
    

    // Search and Filter Handlers
    $('#searchCustomerForm').submit(function (e) {
        e.preventDefault();
        const query = $('#searchCustomer').val();
        refreshList(customerCrud, renderCustomerList, c => c.name.includes(query) || c.phone.includes(query));
    });

    $('#searchTransactionForm').submit(function (e) {
        e.preventDefault();
        const date = $('#filterTransactionDate').val();
        refreshList(visitCrud, renderTransactionList, v => v.date === date);
    });

    // Page Switch and Initial Load
    $('#showHome').click(() => {
        $('#home').show();
        $('#addCustomer').hide();
        $('#addTransaction').hide();
        $('#visits').hide();
        refreshList(customerCrud, renderCustomerList);
    });

    $('#showAddCustomer').click(() => {
        $('#home').hide();
        $('#addCustomer').show();
        $('#addTransaction').hide();
        $('#visits').hide();

    });

    $('#showAddTransaction').click(() => {
        $('#home').hide();
        $('#addCustomer').hide();
        $('#addTransaction').show();
        $('#visits').hide();
        refreshList(visitCrud, renderTransactionList);
    });

    // Function to render the transaction list
    function renderTransactionList(visits) {
        visits.sort((a, b) => new Date(a.date) - new Date(b.date));  // Sort by date
        let html = "";
        visits.forEach(v => {
            html += `<tr class="table-row bg-white border-b dark:bg-gray-800 dark:border-gray-700">
                        <td class="table-cell px-6 py-4">${v.id}</td>
                        <td class="table-cell px-6 py-4">${v.date}</td>
                        <td class="table-cell px-6 py-4"> ₹ ${v.amount}</td>
                        <td class="table-cell px-6 py-4">${v.services.join(', ')}</td>
                        // <td class="table-cell px-6 py-4">${v.customerId}</td>
                        <td class="table-cell px-6 py-4">${v.category}</td>
                    </tr>`;
        });
        $("#transactionList").html(html);
    }

    // Click event for the Visits button
    $('#showVisits').click(() => {
        $('#home').hide();
        $('#addCustomer').hide();
        $('#addTransaction').hide();
        $('#visits').show();
        
        refreshList(visitCrud, renderTransactionList);
    });

    // Function to show toast message
    function showToast(message) {
        const toast = $(`<div class="toast fixed bottom-4 right-4 bg-blue-500 text-white p-4 rounded-lg">${message}</div>`);
        $('body').append(toast);
        setTimeout(() => {
            toast.remove();
        }, 5000);
    }
    



    // Event listener for "Add Visit" button
    $(document).on('click', '.btn-add-visit', function() {
        const customerId = $(this).data('id');
        $('#customerId').val(customerId);
        $('#showAddTransaction').click();
    });

    // Event listener for "Delete" button
    $(document).on('click', '.btn-delete', function() {
        const customerId = $(this).data('id');
        if (confirm("Are you sure you want to delete this customer?")) {
            customerCrud.table.delete(customerId).then(() => {
                showToast("Customer deleted successfully");
                refreshList(customerCrud, renderCustomerList);
            });
        }
    });

    // Load initial data
    refreshList(customerCrud, renderCustomerList);
    refreshList(visitCrud, renderTransactionList); 


    // Cache jQuery selectors
    const $drawerMenu = $('#drawerMenu');

    // Toggle Drawer Menu
    function toggleDrawerMenu() {
        $drawerMenu.toggleClass('translate-x-full translate-x-0 hidden');
    }

    // Drawer Menu Click Handlers
    function drawerMenuClickHandler() {
        const id = this.id.replace('drawerShow', 'show');
        $(`#${id}`).click();
        toggleDrawerMenu();
    }

    // Initialize event handlers
    $('#burgerMenu, #menuClose').click(toggleDrawerMenu);
    $('#drawerShowHome, #drawerShowVisits, #drawerShowAddCustomer, #drawerShowAddTransaction').click(drawerMenuClickHandler);

        
  
    
});
