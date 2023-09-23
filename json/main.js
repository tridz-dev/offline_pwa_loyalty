// Load JSON model from an external file
fetch("model.json")
  .then((response) => response.json())
  .then((jsonModel) => {
    // Create a new Dexie database instance
    const db = new Dexie("appDB");

    // Define the schema for the IndexedDB database
    const schema = {};
    jsonModel.tables.forEach((table) => {
      const columns = table.columns
        .map((col) => (col.autoIncrement ? `++${col.name}` : col.name))
        .join(",");
      schema[table.name] = columns;
    });
    db.version(1).stores(schema);

    // Update createForm to handle editing
    const createForm = (tableName, columns, id = null) => {
      const form = document.createElement("form");
      form.id = `${tableName}-form`;

      columns.forEach((column) => {
        if (column.autoIncrement) return;

        const input = document.createElement("input");
        input.name = column.name;
        input.type = column.type === "boolean" ? "checkbox" : "text";
        form.appendChild(input);
      });

      const submitButton = document.createElement("input");
      submitButton.type = "submit";
      form.appendChild(submitButton);

      // Pre-fill form if id is provided
      if (id !== null) {
        db[tableName].get(id).then((item) => {
          for (const [key, value] of Object.entries(item)) {
            const input = form[key];
            if (input.type === "checkbox") {
              input.checked = value;
            } else {
              input.value = value;
            }
          }
        });
      }

      form.addEventListener("submit", (e) => {
        e.preventDefault();
        
        const formData = new FormData(form);
        const data = {};  
      
        columns.forEach((column) => {
          if (column.autoIncrement) return;
          data[column.name] = column.type === "boolean" ? formData.get(column.name) === "on" : formData.get(column.name);
        });
      
        if (id !== null) {
          db[tableName].update(id, data);
        } else {
          db[tableName].add(data);
        }
      
        updateList(tableName);
        form.reset();
      });
      

      return form;
    };

    // Function to switch form views and optionally pre-fill data for editing
    const switchFormView = (tableName, id = null) => {
      currentViewDiv.innerHTML = "";
      const form = createForm(
        tableName,
        jsonModel.tables.find((t) => t.name === tableName).columns,
        id
      );
      currentViewDiv.appendChild(form);
    };

    // Separate updateList function
    const updateList = (tableName) => {
      const list = document.getElementById(`${tableName}-list`);
      db[tableName].toArray().then((items) => {
        const list = document.getElementById(`${tableName}-list`);
        if (list === null) {
          console.warn(`List element for table ${tableName} not found.`);
          return;
        }

        items.forEach((item) => {
          const listItem = document.createElement("li");
          listItem.textContent = JSON.stringify(item);

          // Add Edit and Delete links
          const editLink = document.createElement("a");
          editLink.textContent = "Edit";
          editLink.href = "#";
          editLink.addEventListener("click", () => {
            switchFormView(tableName, item.id);
          });

          const deleteLink = document.createElement("a");
          deleteLink.textContent = "Delete";
          deleteLink.href = "#";
          deleteLink.addEventListener("click", () => {
            db[tableName].delete(item.id);
            updateList(tableName);
          });

          listItem.appendChild(editLink);
          listItem.appendChild(deleteLink);
          list.appendChild(listItem);
        });
      });
    };

    // Modify createList to use updateList
    const createList = (tableName) => {
      const list = document.createElement("ul");
      list.id = `${tableName}-list`;

      db[tableName].hook("creating", () => updateList(tableName));
      db[tableName].hook("updating", () => updateList(tableName));
      db[tableName].hook("deleting", () => updateList(tableName));

      updateList(tableName);

      return list;
    };

    // Create buttons for routing and a div to hold the current view
    const routeButtonsDiv = document.createElement("div");
    const currentViewDiv = document.createElement("div");

    // Generic function to switch views
    const switchView = (tableName) => {
      currentViewDiv.innerHTML = "";
      const form = createForm(
        tableName,
        jsonModel.tables.find((t) => t.name === tableName).columns
      );
      const list = createList(tableName);
      currentViewDiv.appendChild(list);
      currentViewDiv.appendChild(form);
    };

    // Create buttons for each table and set up click handlers
    jsonModel.tables.forEach((table) => {
      const button = document.createElement("button");
      button.textContent = `Go to ${table.name}`;
      button.addEventListener("click", () => {
        switchView(table.name);
      });
      routeButtonsDiv.appendChild(button);
    });

    // Append routing buttons and current view to the body
    document.body.appendChild(routeButtonsDiv);
    document.body.appendChild(currentViewDiv);

    // Initialize with the first table view
    switchView(jsonModel.tables[0].name);

    // Add buttons to switch between list views
    jsonModel.tables.forEach((table) => {
      const button = document.createElement("button");
      button.textContent = `Show ${table.name} List`;
      button.addEventListener("click", () => {
        switchListView(table.name);
      });
      routeButtonsDiv.appendChild(button);
    });

    // Function to switch list views
    const switchListView = (tableName) => {
      currentViewDiv.innerHTML = "";
      const list = createList(tableName);
      currentViewDiv.appendChild(list);
    };

    // Append routing buttons and current view to the body
    document.body.appendChild(routeButtonsDiv);
    document.body.appendChild(currentViewDiv);

    // Initialize with the first table view
    switchListView(jsonModel.tables[0].name);
  });
