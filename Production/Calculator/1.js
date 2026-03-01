/* اسم الملف: 1.js
  الوظيفة: إضافة قسم "تقارير المبيعات" كقسم رئيسي جديد
*/

registerModule({
    title: "Sales Dashboard Module", // اسم تعريفي
    viewId: "view-sales", // ID فريد للواجهة
    
    // 1. إعدادات القائمة الجانبية
    menu: {
        parentId: "root", // root تعني قسم رئيسي جديد
        sectionTitle: "Sales & Finance", // عنوان الزر الرئيسي
        label: "Weekly Reports", // عنوان الرابط الفرعي
        icon: "fas fa-chart-line" // أيقونة FontAwesome
    },

    // 2. كود HTML
    html: `
        <div class="container-fluid">
            <div class="row">
                <div class="col-12">
                   <div class="card shadow-sm border-0">
                        <div class="card-body p-5 text-center">
                            <h2 class="text-primary mb-3">Weekly Sales Report</h2>
                            <p class="text-muted">This content is loaded dynamically from 1.js</p>
                            <button class="btn btn-success" onclick="alert('Hello from Module 1!')">
                                <i class="fas fa-print me-2"></i> Print Report
                            </button>
                        </div>
                   </div>
                </div>
            </div>
        </div>
    `,

    // 3. كود CSS (اختياري)
    css: `
        #view-sales .card { background-color: #f0f9ff; }
        #view-sales h2 { font-weight: 900; }
    `,

    // 4. كود JavaScript التشغيلي (init)
    init: function() {
        console.log("Sales Module Loaded Successfully!");
        // يمكنك هنا كتابة أي كود jQuery أو Firebase خاص بهذا الموديل
    }
});