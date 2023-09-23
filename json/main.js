// Import Dexie.js (you would do this if using modules)
// import Dexie from 'dexie';

// JSON model for the application
const jsonModel = {
  "tables": [
    {
      "name": "todos",
      "columns": [
        { "name": "id", "type": "int", "autoIncrement": true },
        { "name": "title", "type": "string" },
        { "name": "completed", "type": "boolean" }
      ]
    },
    {
      "name": "notes",
      "columns": [
        { "name": "id", "type": "int", "autoIncrement": true },
        { "name": "content", "type": "string" }
      ]
    }
  ]
};

// Create a new Dexie database instance
const db = new Dexie('appDB');

// Define the schema for the IndexedDB database
const schema = {};
jsonModel.tables.forEach(table => {
  const columns = table.columns.map(col => col.autoIncrement ? `++${col.name}` : col.name).join(',');
  schema[table.name] = columns;
});
db.version(1).stores(schema);

// Generic function to create a form for a table
const createForm = (tableName, columns) => {
  const form = document.createElement('form');
  form.id = `${tableName}-form`;

  columns.forEach(column => {
    if (column.autoIncrement) return;

    const input = document.createElement('input');
    input.name = column.name;
    input.type = column.type === 'boolean' ? 'checkbox' : 'text';
    form.appendChild(input);
  });

  const submitButton = document.createElement('input');
  submitButton.type = 'submit';
  form.appendChild(submitButton);

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const formData = new FormData(form);
    const data = {};

    columns.forEach(column => {
      if (column.autoIncrement) return;
      data[column.name] = column.type === 'boolean' ? formData.get(column.name) === 'on' : formData.get(column.name);
    });

    db[tableName].add(data).then(() => {
      updateList(tableName);
    });
    form.reset();
  });

  return form;
};

const updateList = (tableName) => {
  const list = document.getElementById(`${tableName}-list`);
  db[tableName].toArray().then(items => {
    list.innerHTML = '';
    items.forEach(item => {
      const listItem = document.createElement('li');
      listItem.textContent = JSON.stringify(item);
      list.appendChild(listItem);
    });
  });
};

// Generic function to create a list for a table
const createList = (tableName) => {
  const list = document.createElement('ul');
  list.id = `${tableName}-list`;
  updateList(tableName);
  return list;
};

// Create buttons for routing and a div to hold the current view
const routeButtonsDiv = document.createElement('div');
const currentViewDiv = document.createElement('div');

// Generic function to switch views
const switchView = (tableName) => {
  currentViewDiv.innerHTML = '';
  const form = createForm(tableName, jsonModel.tables.find(t => t.name === tableName).columns);
  const list = createList(tableName);
  currentViewDiv.appendChild(list);
  currentViewDiv.appendChild(form);
};

// Create buttons for each table and set up click handlers
jsonModel.tables.forEach(table => {
  const button = document.createElement('button');
  button.textContent = `Go to ${table.name}`;
  button.addEventListener('click', () => {
    switchView(table.name);
  });
  routeButtonsDiv.appendChild(button);
});

// Append routing buttons and current view to the body
document.body.appendChild(routeButtonsDiv);
document.body.appendChild(currentViewDiv);

// Initialize with the first table view
switchView(jsonModel.tables[0].name);
