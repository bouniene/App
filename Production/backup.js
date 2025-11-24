// =================================================================
// backup.js - ملف منفصل لإدارة النسخ الاحتياطي والاستعادة
// =================================================================

const backupHandler = (() => {

    // --- 1. وظيفة تصدير البيانات (لا تغيير هنا) ---
    const exportData = async (dbRef) => {
        try {
            alert('جاري تجهيز النسخة الاحتياطية... قد يستغرق الأمر بضع لحظات.');

            const snapshot = await dbRef.once('value');
            const data = snapshot.val();

            if (!data) {
                alert('لا توجد بيانات لتصديرها.');
                return;
            }

            const jsonString = JSON.stringify(data, null, 2);
            const blob = new Blob([jsonString], { type: 'application/json' });
            const url = URL.createObjectURL(blob);

            const a = document.createElement('a');
            a.href = url;
            const date = new Date().toISOString().slice(0, 10);
            a.download = `backup-${date}.json`;
            document.body.appendChild(a);
            a.click();

            document.body.removeChild(a);
            URL.revokeObjectURL(url);

        } catch (error) {
            console.error('فشل تصدير البيانات:', error);
            alert('حدث خطأ أثناء تصدير البيانات. يرجى مراجعة الكونسول.');
        }
    };


    // --- 2. وظيفة استعادة البيانات (تم تعديلها) ---
    const importData = (dbRef, fileInputSelector) => {
        const fileInput = document.querySelector(fileInputSelector);
        if (!fileInput) {
            console.error('لم يتم العثور على حقل رفع الملفات.');
            return;
        }

        fileInput.onchange = (e) => {
            const file = e.target.files[0];
            if (!file) return;

            const reader = new FileReader();

            reader.onload = (event) => {
                try {
                    const jsonData = JSON.parse(event.target.result);

                    if (typeof jsonData !== 'object' || jsonData === null || !jsonData.productionOrders) {
                         alert('ملف غير صالح. تأكد من أن الملف يحتوي على البيانات الصحيحة للتطبيق.');
                         return;
                    }
                    
                    // ---> START: إضافة التحقق من كلمة المرور
                    const password = prompt("للمتابعة، الرجاء إدخال كلمة المرور لاستعادة البيانات:");

                    // إذا ألغى المستخدم الإدخال أو كانت كلمة المرور خاطئة
                    if (password !== "2000") {
                        alert("❌ كلمة المرور غير صحيحة. تم إلغاء عملية الاستعادة.");
                        return; // إيقاف التنفيذ هنا
                    }
                    // ---> END: إضافة التحقق من كلمة المرور

                    const confirmation = confirm(
                        '⚠️ تحذير خطير! \n\n' +
                        'أنت على وشك استبدال جميع البيانات الحالية بالبيانات الموجودة في هذا الملف. ' +
                        'سيتم حذف كل شيء موجود حالياً بشكل نهائي. \n\n' +
                        'هل أنت متأكد أنك تريد المتابعة؟'
                    );

                    if (confirmation) {
                        dbRef.set(jsonData)
                            .then(() => {
                                alert('✅ تم استعادة البيانات بنجاح! سيتم إعادة تحميل الصفحة الآن.');
                                location.reload();
                            })
                            .catch(error => {
                                console.error('فشل استعادة البيانات:', error);
                                alert('حدث خطأ أثناء حفظ البيانات الجديدة.');
                            });
                    } else {
                        alert('تم إلغاء عملية الاستعادة.');
                    }

                } catch (error) {
                    console.error('خطأ في قراءة ملف JSON:', error);
                    alert('فشل في قراءة الملف. تأكد من أنه ملف JSON صالح.');
                } finally {
                    fileInput.value = '';
                }
            };
            
            reader.readAsText(file);
        };
        
        fileInput.click();
    };

    return {
        exportData,
        importData
    };

})();