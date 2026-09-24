// mock-supabase.js
// Mock implementation of Supabase Client using LocalStorage

class MockQueryBuilder {
    constructor(tableName) {
        this.tableName = tableName;
        this.operations = [];
        this.filters = [];
        this.single = false;
        this.returnData = false;
        
        // Initialize table if it doesn't exist
        const data = localStorage.getItem(`mock_db_${this.tableName}`);
        if (!data) {
            localStorage.setItem(`mock_db_${this.tableName}`, JSON.stringify([]));
        }
    }

    _getTableData() {
        return JSON.parse(localStorage.getItem(`mock_db_${this.tableName}`)) || [];
    }

    _setTableData(data) {
        localStorage.setItem(`mock_db_${this.tableName}`, JSON.stringify(data));
    }

    select(columns = '*') {
        this.operations.push({ type: 'select', columns });
        return this;
    }

    insert(data) {
        this.operations.push({ type: 'insert', data: Array.isArray(data) ? data : [data] });
        return this;
    }

    upsert(data, options) {
        this.operations.push({ type: 'upsert', data: Array.isArray(data) ? data : [data], options });
        return this;
    }

    update(data) {
        this.operations.push({ type: 'update', data });
        return this;
    }

    delete() {
        this.operations.push({ type: 'delete' });
        return this;
    }

    eq(column, value) {
        this.filters.push({ column, value });
        return this;
    }

    maybeSingle() {
        this.single = true;
        return this;
    }
    
    single() {
        this.single = true;
        return this;
    }

    // Resolves the query builder when await is called
    async then(resolve, reject) {
        try {
            let tableData = this._getTableData();
            let resultData = null;
            let error = null;

            // Handle mutations first
            const mutation = this.operations.find(op => ['insert', 'update', 'delete', 'upsert'].includes(op.type));
            
            if (mutation) {
                if (mutation.type === 'insert') {
                    // Generate mock IDs if needed
                    const toInsert = mutation.data.map(item => ({
                        id: item.id || crypto.randomUUID(),
                        created_at: item.created_at || new Date().toISOString(),
                        ...item
                    }));
                    tableData = [...tableData, ...toInsert];
                    this._setTableData(tableData);
                    resultData = toInsert;
                } 
                else if (mutation.type === 'upsert') {
                    const conflictCol = (mutation.options && mutation.options.onConflict) ? mutation.options.onConflict : 'id';
                    const toUpsert = mutation.data;
                    const upserted = [];
                    
                    toUpsert.forEach(item => {
                        const existingIdx = tableData.findIndex(row => row[conflictCol] === item[conflictCol]);
                        if (existingIdx >= 0) {
                            tableData[existingIdx] = { ...tableData[existingIdx], ...item };
                            upserted.push(tableData[existingIdx]);
                        } else {
                            const newItem = {
                                id: item.id || crypto.randomUUID(),
                                created_at: item.created_at || new Date().toISOString(),
                                ...item
                            };
                            tableData.push(newItem);
                            upserted.push(newItem);
                        }
                    });
                    this._setTableData(tableData);
                    resultData = upserted;
                }
                else if (mutation.type === 'update') {
                    let updated = [];
                    tableData = tableData.map(row => {
                        // Check if row matches all filters
                        const matches = this.filters.every(f => row[f.column] === f.value);
                        if (matches) {
                            const newRow = { ...row, ...mutation.data };
                            updated.push(newRow);
                            return newRow;
                        }
                        return row;
                    });
                    this._setTableData(tableData);
                    resultData = updated;
                }
                else if (mutation.type === 'delete') {
                    let deleted = [];
                    tableData = tableData.filter(row => {
                        const matches = this.filters.every(f => row[f.column] === f.value);
                        if (matches) {
                            deleted.push(row);
                            return false; // remove it
                        }
                        return true; // keep it
                    });
                    this._setTableData(tableData);
                    resultData = deleted;
                }
            }

            // Handle select (can be chained after upsert/insert)
            const selectOp = this.operations.find(op => op.type === 'select');
            
            if (selectOp) {
                // If it was just a select, use the table data
                let dataToFilter = resultData || tableData;
                
                // Apply filters
                resultData = dataToFilter.filter(row => {
                    return this.filters.every(f => row[f.column] === f.value);
                });
            }

            // Handle maybeSingle
            if (this.single && resultData && Array.isArray(resultData)) {
                resultData = resultData.length > 0 ? resultData[0] : null;
            }

            resolve({ data: resultData, error });
        } catch (err) {
            console.error("Mock Supabase Error:", err);
            resolve({ data: null, error: err });
        }
    }
}

window.supabase = {
    createClient: function(url, key) {
        console.log("Mock Supabase Client Initialized");
        return {
            from: function(tableName) {
                return new MockQueryBuilder(tableName);
            },
            auth: {
                // Add dummy auth if needed by the app
                getSession: async () => ({ data: { session: null }, error: null }),
                onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
                signInWithPassword: async () => ({ data: { user: { id: "mock_user" } }, error: null })
            }
        };
    }
};
