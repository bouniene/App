registerModule({
    title: "Recipes Explorer",
    viewId: "view-recipes-explorer",
    menu: {
        label: "Recipes Explorer",
        sectionTitle: "Sales & Finance",
        icon: "fas fa-file-invoice-dollar",
        parentId: "root"
    },
    html: `
    <div class="container-fluid p-0">
        <div class="bg-white rounded border shadow-sm p-4 mb-4">
            <div class="d-flex justify-content-between align-items-center mb-4">
                <h4 class="fw-bold text-gray-700 m-0">
                    <i class="fas fa-scroll text-primary me-2"></i>Recipes Master List
                </h4>
                <div class="badge bg-light text-primary border px-3 py-2" id="recipe-count-badge">Total: 0 Recipes</div>
            </div>

            <div class="row g-3 mb-4">
                <div class="col-md-4">
                    <label class="small fw-bold text-secondary mb-1">Search Recipe Name</label>
                    <div class="input-group input-group-sm">
                        <span class="input-group-text bg-white border-end-0"><i class="fas fa-search text-muted"></i></span>
                        <input type="text" id="recipe-search-input" class="form-control form-control-sm border-start-0 rounded-end" placeholder="Filter by name...">
                    </div>
                </div>
                <div class="col-md-4">
                    <label class="small fw-bold text-secondary mb-1">Filter by Product</label>
                    <select id="recipe-product-filter" class="form-select form-select-sm rounded">
                        <option value="all">All Products</option>
                    </select>
                </div>
                <div class="col-md-4">
                    <label class="small fw-bold text-secondary mb-1">Sort By</label>
                    <select id="recipe-sort-select" class="form-select form-select-sm rounded">
                        <option value="name-asc">Name (A-Z)</option>
                        <option value="name-desc">Name (Z-A)</option>
                        <option value="yield-high">Highest Yield</option>
                        <option value="yield-low">Lowest Yield</option>
                    </select>
                </div>
            </div>

            <div class="table-responsive rounded border">
                <table class="table table-hover align-middle mb-0" id="recipes-master-table">
                    <thead class="bg-light text-uppercase small fw-bold text-muted">
                        <tr>
                            <th class="ps-3">Recipe Name</th>
                            <th>Parent Product</th>
                            <th class="text-center">Yield / Mix</th>
                            <th>Ingredients Count</th>
                            <th class="text-end pe-3">Actions</th>
                        </tr>
                    </thead>
                    <tbody id="recipes-explorer-body">
                        <tr>
                            <td colspan="5" class="text-center py-5">
                                <div class="spinner-border spinner-border-sm text-primary me-2"></div>
                                <span class="text-muted">Fetching recipes from database...</span>
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>
    </div>

    <div class="modal fade" id="recipe-info-modal" tabindex="-1" aria-hidden="true">
        <div class="modal-dialog modal-dialog-centered">
            <div class="modal-content border-0 shadow-lg">
                <div class="modal-header bg-light border-0">
                    <h5 class="modal-title fw-bold" id="info-recipe-name">Recipe Details</h5>
                    <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                </div>
                <div class="modal-body p-4" id="info-recipe-content">
                    </div>
            </div>
        </div>
    </div>
    `,
    init: function() {
        let allRecipes = [];
        let allProducts = {};

        // 1. Fetch Products for mapping and filtering
        db.ref('products_database').on('value', snap => {
            const data = snap.val();
            if (data) {
                allProducts = data;
                const filterSelect = $('#recipe-product-filter');
                filterSelect.find('option:not([value="all"])').remove();
                Object.keys(data).forEach(id => {
                    filterSelect.append(`<option value="${id}">${data[id].name}</option>`);
                });
            }
        });

        // 2. Fetch Recipes and Listen for Changes
        db.ref('bom_database').on('value', snap => {
            const data = snap.val();
            allRecipes = [];
            if (data) {
                Object.keys(data).forEach(id => {
                    allRecipes.push({ id, ...data[id] });
                });
            }
            applyFilters();
        });

        // 3. Filter and Render Logic
        function applyFilters() {
            const searchTerm = $('#recipe-search-input').val().toLowerCase();
            const productFilter = $('#recipe-product-filter').val();
            const sortBy = $('#recipe-sort-select').val();

            let filtered = allRecipes.filter(r => {
                const matchesSearch = r.name.toLowerCase().includes(searchTerm);
                const matchesProduct = productFilter === 'all' || r.productId === productFilter;
                return matchesSearch && matchesProduct;
            });

            // Sorting
            filtered.sort((a, b) => {
                if (sortBy === 'name-asc') return a.name.localeCompare(b.name);
                if (sortBy === 'name-desc') return b.name.localeCompare(a.name);
                if (sortBy === 'yield-high') return (b.yieldPerMix || 0) - (a.yieldPerMix || 0);
                if (sortBy === 'yield-low') return (a.yieldPerMix || 0) - (b.yieldPerMix || 0);
                return 0;
            });

            renderTable(filtered);
        }

        function renderTable(data) {
            const tbody = $('#recipes-explorer-body').empty();
            $('#recipe-count-badge').text(`Total: ${data.length} Recipes`);

            if (data.length === 0) {
                tbody.append('<tr><td colspan="5" class="text-center py-5 text-muted">No recipes found matching your filters.</td></tr>');
                return;
            }

            data.forEach(r => {
                const productName = allProducts[r.productId] ? allProducts[r.productId].name : '<span class="text-danger small">Linked Product Missing</span>';
                const matCount = r.materials ? r.materials.length : 0;

                tbody.append(`
                    <tr class="border-bottom">
                        <td class="ps-3 fw-bold text-dark">${r.name}</td>
                        <td class="text-secondary">${productName}</td>
                        <td class="text-center"><span class="badge bg-blue-50 text-primary border border-primary-subtle">${r.yieldPerMix || 0}</span></td>
                        <td><small class="text-muted"><i class="fas fa-layer-group me-1"></i> ${matCount} Ingredients</small></td>
                        <td class="text-end pe-3">
                            <button class="btn btn-outline-secondary btn-sm rounded-pill px-3 view-recipe-btn" data-id="${r.id}">
                                <i class="fas fa-eye me-1"></i> View
                            </button>
                        </td>
                    </tr>
                `);
            });
        }

        // 4. Modal Details Logic
        $(document).on('click', '.view-recipe-btn', function() {
            const id = $(this).data('id');
            const recipe = allRecipes.find(r => r.id === id);
            if (!recipe) return;

            $('#info-recipe-name').text(recipe.name);
            let matHtml = '<ul class="list-group list-group-flush">';
            if (recipe.materials) {
                recipe.materials.forEach(m => {
                    matHtml += `
                        <li class="list-group-item d-flex justify-content-between align-items-center px-0">
                            <span class="text-gray-700 font-monospace small">${m.name}</span>
                            <span class="fw-bold text-primary">${m.qty} <small class="text-muted">kg</small></span>
                        </li>`;
                });
            } else {
                matHtml += '<li class="list-group-item text-center text-muted">No materials listed</li>';
            }
            matHtml += '</ul>';

            $('#info-recipe-content').html(`
                <div class="mb-3 pb-2 border-bottom">
                    <label class="small fw-bold text-muted text-uppercase d-block mb-1">Description</label>
                    <p class="text-dark mb-0">${recipe.description || 'No description available.'}</p>
                </div>
                <div>
                    <label class="small fw-bold text-muted text-uppercase d-block mb-2">Ingredients List</label>
                    ${matHtml}
                </div>
            `);

            const modal = new bootstrap.Modal(document.getElementById('recipe-info-modal'));
            modal.show();
        });

        // 5. Event Listeners for Filtering
        $('#recipe-search-input').on('input', applyFilters);
        $('#recipe-product-filter, #recipe-sort-select').on('change', applyFilters);
    }
});