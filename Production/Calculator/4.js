/**
 * Module: Advanced Material & Production Tracker (In-Page Version)
 * Author: Senior Frontend Developer
 */

registerModule({
    title: "متابعة الإنتاج والاستهلاك",
    viewId: "view-material-tracker-pro",
    menu: {
        parentId: "root",
        title: "متابعة الإنتاج",
        icon: "fas fa-industry"
    },
    html: `
    <style>
        .compact-table td, .compact-table th { padding: 0.4rem !important; font-size: 0.85rem; }
        .addition-row { background: #f1f5f9; border-radius: 4px; margin-bottom: 2px; padding: 2px 5px; }
        #list-section, #editor-section { transition: all 0.3s ease; }
        .hidden { display: none !important; }
        .form-label-sm { font-size: 0.75rem; font-weight: bold; color: #64748b; margin-bottom: 2px; }
        .btn-xs { padding: 0.1rem 0.4rem; font-size: 0.7rem; }
    </style>

    <div class="container-fluid p-2" style="background-color: #f8fafc; min-height: 100vh; direction: rtl; text-align: right;">
        
        <div id="list-section">
            <div class="d-flex justify-content-between align-items-center mb-2">
                <h5 class="fw-bold text-primary m-0"><i class="fas fa-boxes-stacked me-2"></i>سجل الاستهلاك والإنتاج</h5>
                <button id="btn-create-new" class="btn btn-primary btn-sm shadow-sm">
                    <i class="fas fa-plus me-1"></i> إضافة حساب جديد
                </button>
            </div>

            <div class="bg-white rounded border shadow-sm">
                <table class="table table-sm table-hover align-middle mb-0 compact-table">
                    <thead class="bg-light text-muted">
                        <tr>
                            <th>التاريخ</th>
                            <th>المنتج</th>
                            <th>الإنتاج (قطعة)</th>
                            <th class="text-center">الإجراءات</th>
                        </tr>
                    </thead>
                    <tbody id="main-history-body">
                        </tbody>
                </table>
            </div>
        </div>

        <div id="editor-section" class="hidden">
            <div class="d-flex justify-content-between align-items-center mb-2 border-bottom pb-2">
                <h5 class="fw-bold text-primary m-0" id="editor-title">تحرير البيانات</h5>
                <div>
                    <button id="btn-cancel" class="btn btn-outline-secondary btn-sm me-2">إلغاء</button>
                    <button id="btn-save-data" class="btn btn-primary btn-sm px-3">حفظ البيانات</button>
                </div>
            </div>

            <div class="row g-2 mb-3">
                <div class="col-md-3">
                    <label class="form-label-sm">التاريخ</label>
                    <input type="date" id="field-date" class="form-control form-control-sm">
                </div>
                <div class="col-md-5">
                    <label class="form-label-sm">الخلطة / المنتج</label>
                    <select id="field-recipe" class="form-select form-select-sm">
                        <option value="">-- اختر خلطة (اختياري) --</option>
                    </select>
                </div>
                <div class="col-md-4">
                    <label class="form-label-sm">عدد القطع المنتجة</label>
                    <input type="number" id="field-produced" class="form-control form-control-sm" placeholder="0">
                </div>
            </div>

            <div class="bg-white rounded border shadow-sm p-2">
                <div class="d-flex justify-content-between align-items-center mb-2">
                    <h6 class="fw-bold text-secondary m-0 small">تفاصيل المواد والاستهلاك</h6>
                    <button id="btn-add-mat-row" class="btn btn-outline-primary btn-xs">
                        <i class="fas fa-plus me-1"></i> إضافة مادة يدوياً
                    </button>
                </div>
                
                <div class="table-responsive">
                    <table class="table table-sm border compact-table">
                        <thead class="bg-light">
                            <tr>
                                <th style="width:15%">المادة</th>
                                <th style="width:10%">البداية</th>
                                <th style="width:30%">الإضافات (الكمية | التاريخ)</th>
                                <th style="width:10%">المتبقي</th>
                                <th style="width:12%">الاستهلاك الفعلي</th>
                                <th style="width:12%">الاستهلاك (BOM)</th>
                                <th style="width:5%"></th>
                            </tr>
                        </thead>
                        <tbody id="editor-materials-body">
                            </tbody>
                    </table>
                </div>
            </div>
        </div>
    </div>
    `,
    init: function() {
        const DB_PATH = 'production_logs_v2'; // مستقل عن الحسابات الأخرى
        const RECIPE_PATH = 'bom_database';
        
        let recipes = {};
        let editingId = null;

        // --- Core Functions ---

        const toggleView = (view) => {
            if (view === 'list') {
                $('#list-section').removeClass('hidden');
                $('#editor-section').addClass('hidden');
            } else {
                $('#list-section').addClass('hidden');
                $('#editor-section').removeClass('hidden');
            }
        };

        const loadRecipes = () => {
            db.ref(RECIPE_PATH).on('value', snap => {
                recipes = snap.val() || {};
                const select = $('#field-recipe');
                select.find('option:not(:first)').remove();
                Object.keys(recipes).forEach(k => {
                    select.append(`<option value="${k}">${recipes[k].name}</option>`);
                });
            });
        };

        const loadHistory = () => {
            db.ref(DB_PATH).on('value', snap => {
                const data = snap.val() || {};
                const tbody = $('#main-history-body');
                tbody.empty();

                Object.keys(data).reverse().forEach(id => {
                    const item = data[id];
                    tbody.append(`
                        <tr>
                            <td>${item.date || '---'}</td>
                            <td class="fw-bold">${item.recipeName || 'يدوي'}</td>
                            <td><span class="badge bg-light text-dark border">${item.totalPcs || 0}</span></td>
                            <td class="text-center">
                                <button class="btn btn-outline-primary btn-xs btn-edit" data-id="${id}"><i class="fas fa-edit"></i></button>
                                <button class="btn btn-outline-danger btn-xs btn-delete" data-id="${id}"><i class="fas fa-trash"></i></button>
                            </td>
                        </tr>
                    `);
                });
            });
        };

        const addMaterialRow = (data = {}) => {
            const rowId = 'mat_' + Math.random().toString(36).substr(2, 9);
            const additionsHtml = (data.additions || []).map(add => renderAdditionInput(add.qty, add.date)).join('');
            
            const tr = $(`
                <tr class="mat-row" id="${rowId}">
                    <td><input type="text" class="form-control form-control-sm in-mat-name" value="${data.name || ''}" placeholder="المادة"></td>
                    <td><input type="number" class="form-control form-control-sm in-mat-start calc-trigger" value="${data.start || 0}"></td>
                    <td>
                        <div class="additions-container">
                            ${additionsHtml}
                        </div>
                        <button class="btn btn-link btn-xs p-0 mt-1 btn-add-sub-addition text-decoration-none">
                            <i class="fas fa-plus-circle"></i> إضافة كمية...
                        </button>
                    </td>
                    <td><input type="number" class="form-control form-control-sm in-mat-rem calc-trigger" value="${data.remaining || 0}"></td>
                    <td><input type="number" class="form-control form-control-sm bg-light fw-bold in-mat-actual" readonly value="0"></td>
                    <td><input type="number" class="form-control form-control-sm bg-light in-mat-theo" readonly value="0"></td>
                    <td><button class="btn btn-link text-danger p-0 btn-remove-mat"><i class="fas fa-times"></i></button></td>
                </tr>
            `);
            $('#editor-materials-body').append(tr);
            runCalculations();
        };

        const renderAdditionInput = (qty = '', date = '') => {
            const today = new Date().toISOString().split('T')[0];
            return `
                <div class="d-flex gap-1 mb-1 addition-entry">
                    <input type="number" class="form-control form-control-sm sub-qty calc-trigger" style="width: 70px" placeholder="كمية" value="${qty}">
                    <input type="date" class="form-control form-control-sm sub-date" value="${date || today}">
                    <button class="btn btn-xs text-danger btn-remove-sub"><i class="fas fa-minus"></i></button>
                </div>
            `;
        };

        const runCalculations = () => {
            const prodQty = parseFloat($('#field-produced').val()) || 0;
            const recipeId = $('#field-recipe').val();
            const currentRecipe = recipes[recipeId];

            $('.mat-row').each(function() {
                const $row = $(this);
                const name = $row.find('.in-mat-name').val().toLowerCase();
                const start = parseFloat($row.find('.in-mat-start').val()) || 0;
                const rem = parseFloat($row.find('.in-mat-rem').val()) || 0;
                
                let addedTotal = 0;
                $row.find('.sub-qty').each(function() {
                    addedTotal += parseFloat($(this).val()) || 0;
                });

                const actual = (start + addedTotal) - rem;
                $row.find('.in-mat-actual').val(actual.toFixed(2));

                // Theoretical check
                if (currentRecipe && currentRecipe.materials) {
                    const bomMat = currentRecipe.materials.find(m => m.name.toLowerCase() === name);
                    if (bomMat) {
                        const yieldMix = parseFloat(currentRecipe.yieldPerMix) || 1;
                        const theo = (prodQty / yieldMix) * (parseFloat(bomMat.qty) || 0);
                        $row.find('.in-mat-theo').val(theo.toFixed(2));
                    }
                }
            });
        };

        // --- Event Handlers ---

        $('#btn-create-new').on('click', () => {
            editingId = null;
            $('#editor-title').text('إضافة حساب جديد');
            $('#field-date').val(new Date().toISOString().split('T')[0]);
            $('#field-produced').val('');
            $('#field-recipe').val('');
            $('#editor-materials-body').empty();
            toggleView('editor');
        });

        $('#btn-cancel').on('click', () => toggleView('list'));

        $('#btn-add-mat-row').on('click', () => addMaterialRow());

        $(document).on('click', '.btn-add-sub-addition', function() {
            $(this).siblings('.additions-container').append(renderAdditionInput());
        });

        $(document).on('click', '.btn-remove-sub', function() {
            $(this).closest('.addition-entry').remove();
            runCalculations();
        });

        $(document).on('click', '.btn-remove-mat', function() {
            $(this).closest('tr').remove();
        });

        $(document).on('input', '.calc-trigger, #field-produced', runCalculations);

        $('#field-recipe').on('change', function() {
            const recipe = recipes[$(this).val()];
            if (recipe && !editingId) {
                $('#editor-materials-body').empty();
                recipe.materials.forEach(m => addMaterialRow({ name: m.name }));
            }
            runCalculations();
        });

        $('#btn-save-data').on('click', () => {
            const materials = [];
            $('.mat-row').each(function() {
                const $row = $(this);
                const additions = [];
                $row.find('.addition-entry').each(function() {
                    additions.push({
                        qty: $(this).find('.sub-qty').val(),
                        date: $(this).find('.sub-date').val()
                    });
                });

                materials.push({
                    name: $row.find('.in-mat-name').val(),
                    start: $row.find('.in-mat-start').val(),
                    remaining: $row.find('.in-mat-rem').val(),
                    actual: $row.find('.in-mat-actual').val(),
                    theoretical: $row.find('.in-mat-theo').val(),
                    additions: additions
                });
            });

            const data = {
                date: $('#field-date').val(),
                recipeId: $('#field-recipe').val(),
                recipeName: $('#field-recipe option:selected').text(),
                totalPcs: $('#field-produced').val(),
                materials: materials,
                lastUpdated: Date.now()
            };

            const ref = editingId ? db.ref(`${DB_PATH}/${editingId}`) : db.ref(DB_PATH).push();
            ref.set(data).then(() => toggleView('list'));
        });

        $(document).on('click', '.btn-edit', function() {
            const id = $(this).data('id');
            editingId = id;
            db.ref(`${DB_PATH}/${id}`).once('value', snap => {
                const val = snap.val();
                $('#editor-title').text('تعديل البيانات');
                $('#field-date').val(val.date);
                $('#field-recipe').val(val.recipeId);
                $('#field-produced').val(val.totalPcs);
                $('#editor-materials-body').empty();
                if (val.materials) val.materials.forEach(m => addMaterialRow(m));
                toggleView('editor');
            });
        });

        $(document).on('click', '.btn-delete', function() {
            if (confirm('هل أنت متأكد من الحذف؟')) {
                db.ref(`${DB_PATH}/${$(this).data('id')}`).remove();
            }
        });

        // Initialize
        loadRecipes();
        loadHistory();
    }
});