
// Load JSON model
let model;
fetch('model.json')
  .then(response => response.json())
  .then(data => {
    model = data;

    // Initialize Dexie
    const db = new Dexie(model.database);
    const tableSchemas = {};
    model.tables.forEach(table => {
      tableSchemas[table.name] = table.schema;
    });
    db.version(model.version).stores(tableSchemas);

    // Initialize Vue
    new Vue({
      el: '#app',
      data: {
        uiComponents: model.ui
      },
      created() {
        this.loadData();
      },
      methods: {
        addData(tableName, fields) {
          const data = {};
          fields.forEach(field => {
            data[field.name] = field.value;
          });
          db.table(tableName).add(data).then(() => this.loadData());
        },
        loadData() {
          model.ui.forEach(ui => {
            db.table(ui.table).toArray().then(data => {
              this.$set(ui, 'data', data);
            });
          });
        }
      }
    });
  });
