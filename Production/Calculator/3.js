// 102.js - Recipes Count Chart Module (Sales & Finance)

registerModule({
    title: "إحصائيات الوصفات",
    viewId: "view-recipes-chart",
    menu: {
        label: "إحصائيات الوصفات",
        icon: "fas fa-chart-bar",
        parentId: "menu-view-recipes-explorer" // أو 'root' لإنشاء قسم جديد باسم Sales & Finance
    },
    // إضافة مكتبة Chart.js ديناميكياً إذا لم تكن موجودة
    css: `
        .chart-container { position: relative; height: 300px; width: 100%; }
        .stat-card { transition: all 0.3s ease; }
        .stat-card:hover { transform: translateY(-5).js; }
    `,
    html: `
        <div class="container-fluid py-3">
            <div class="bg-white rounded border shadow-sm p-4">
                <div class="d-flex justify-content-between align-items-center mb-4 border-bottom pb-2">
                    <h4 class="fw-bold text-gray-700 m-0">
                        <i class="fas fa-chart-pie text-primary me-2"></i>تحليل توزيع الوصفات
                    </h4>
                    <span class="badge bg-blue-50 text-primary border border-primary-subtle px-3 py-2">Sales & Finance Dept</span>
                </div>

                <div class="row g-4">
                    <div class="col-md-3">
                        <div class="bg-light rounded p-4 text-center border stat-card h-100 d-flex flex-column justify-content-center">
                            <div class="small fw-bold text-secondary text-uppercase mb-2">إجمالي الوصفات</div>
                            <div id="recipes-total" class="display-5 fw-bold text-primary">0</div>
                            <div class="mt-3 small text-muted">وصفة مسجلة في النظام</div>
                        </div>
                    </div>
                    
                    <div class="col-md-9">
                        <div class="border rounded p-3 bg-gray-50">
                            <canvas id="recipesChart" style="max-height: 350px;"></canvas>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `,
    init: function () {
        // التأكد من تحميل مكتبة Chart.js أولاً
        if (typeof Chart === 'undefined') {
            $.getScript('https://cdn.jsdelivr.net/npm/chart.js', () => this.loadData());
        } else {
            this.loadData();
        }
    },
    
    // دالة منفصلة لتحميل البيانات ومعالجتها
    loadData: function() {
        let chartInstance = null;
        const $total = $("#recipes-total");
        const ctx = document.getElementById("recipesChart").getContext("2d");

        // نحتاج لجلب أسماء المنتجات بدلاً من الـ IDs فقط لجمالية الرسم
        let productNames = {};
        db.ref("products_database").once("value", pSnap => {
            const pData = pSnap.val();
            if(pData) {
                Object.keys(pData).forEach(id => productNames[id] = pData[id].name);
            }

            // الاستماع للوصفات
            db.ref("bom_database").on("value", snap => {
                let totalRecipes = 0;
                let byProduct = {};

                snap.forEach(child => {
                    totalRecipes++;
                    const r = child.val();
                    const pid = r.productId || "غير مرتبط";
                    const pName = productNames[pid] || "منتج غير معروف";
                    byProduct[pName] = (byProduct[pName] || 0) + 1;
                });

                $total.text(totalRecipes);

                const labels = Object.keys(byProduct);
                const data = Object.values(byProduct);

                if (chartInstance) chartInstance.destroy();

                chartInstance = new Chart(ctx, {
                    type: "bar",
                    data: {
                        labels: labels,
                        datasets: [{
                            label: "عدد الوصفات لكل منتج",
                            data: data,
                            backgroundColor: "rgba(37, 99, 235, 0.8)",
                            borderColor: "#2563eb",
                            borderWidth: 1,
                            borderRadius: 5,
                            barThickness: 30
                        }]
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                            legend: { display: false }
                        },
                        scales: {
                            y: { 
                                beginAtZero: true, 
                                grid: { color: "#f1f5f9" },
                                ticks: { precision: 0 }
                            },
                            x: { grid: { display: false } }
                        }
                    }
                });
            });
        });
    }
});