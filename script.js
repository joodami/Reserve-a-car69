document.addEventListener('DOMContentLoaded', function() {
    const carForm = document.getElementById("carForm");
    const passengerCountInput = document.querySelector('input[name="passengerCount"]');
    const passengerInputsContainer = document.getElementById("passengerInputs");
    const fileUploadSection = document.getElementById("fileUploadSection");
    const submitModal = new bootstrap.Modal(document.getElementById('submitModal'));

    // --- 1. จัดการ Dynamic Fields (ผู้ร่วมเดินทาง) ---
    function updatePassengerFields() {
        const count = Number(passengerCountInput.value) || 0;
        passengerInputsContainer.innerHTML = ""; 
        if (count > 0 && count <= 6) {
            for (let i = 1; i <= count; i++) {
                const input = document.createElement("input");
                input.type = "text";
                input.name = `passenger${i}`;
                input.placeholder = `ชื่อผู้ร่วมเดินทางคนที่ ${i}`;
                input.className = "form-control mb-2 rounded-3";
                input.required = true;
                passengerInputsContainer.appendChild(input);
            }
            fileUploadSection.style.display = "none";
        } else {
            fileUploadSection.style.display = count > 6 ? "block" : "none";
        }
    }
    passengerCountInput.addEventListener("input", updatePassengerFields);

    // --- 2. การส่งข้อมูล (หัวใจหลักที่แก้ไข) ---
    carForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        // แสดง Modal Loading
        const modalText = document.getElementById('modalText');
        const modalFooter = document.getElementById('modalFooter');
        const loadingIcon = document.getElementById('loadingIcon');
        
        modalText.innerHTML = "⏳ กำลังบันทึกข้อมูลและสร้างไฟล์ PDF... <br><small class='text-muted'>ขั้นตอนนี้อาจใช้เวลา 10-15 วินาทีค่ะ</small>";
        loadingIcon.style.display = "block";
        modalFooter.style.display = "none";
        submitModal.show();

        try {
            const formData = new FormData(carForm);
            const formDataObj = Object.fromEntries(formData.entries());
            
            // แปลงไฟล์ PDF รายชื่อ (ถ้ามี)
            const fileInput = carForm.querySelector('[name="passengerFile"]');
            if (fileInput && fileInput.files.length > 0) {
                formDataObj.passengerFile = await fileToBase64(fileInput.files[0]);
                formDataObj.passengerFileName = fileInput.files[0].name;
            }

            // *** URL ของ Web App (ต้องเป็นตัวล่าสุด) ***
            const GAS_URL = "https://script.google.com/macros/s/AKfycbwnYqEKc9wreoIdwLR0W8fY1mHz3Gx0O44Iv1k_llgROJuqrjIXz6gYuWwwjzO3myK0/exec";
            
            // ส่งแบบใช้จังหวะดึงข้อมูลกลับ (ลบ no-cors ออกเพื่อให้ได้รับ JSON กลับมา)
            const response = await fetch(GAS_URL, {
                method: "POST",
                body: new URLSearchParams({ "data": JSON.stringify(formDataObj) })
            });

            const resData = await response.json();

            if (resData.status === "success" && resData.result.isComplete) {
                const pdfUrl = resData.result.pdfUrl;
                
                // แสดงสถานะสำเร็จพร้อมปุ่มดู PDF
                loadingIcon.style.display = "none";
                modalFooter.style.display = "block";
                modalText.innerHTML = `
                    <div class="text-center">
                        <i class="bi bi-check-circle-fill text-success" style="font-size: 3.5rem;"></i>
                        <h4 class="text-success fw-bold mt-3">จองรถเรียบร้อยแล้วค่ะ!</h4>
                        <p class="text-muted">ระบบบันทึกข้อมูลและส่งแจ้งเตือน LINE แล้ว</p>
                        <div class="d-grid gap-2 mt-4">
                            <a href="${pdfUrl}" target="_blank" class="btn btn-primary rounded-pill py-2 shadow">
                                <i class="bi bi-file-earmark-pdf-fill me-2"></i> เปิดดูไฟล์คำขอจอง (PDF)
                            </a>
                        </div>
                    </div>
                `;
                carForm.reset();
                updatePassengerFields();
            } else {
                throw new Error(resData.message || "ระบบปลายทางขัดข้อง");
            }

        } catch (err) {
            console.error(err);
            loadingIcon.style.display = "none";
            modalFooter.style.display = "block";
            modalText.innerHTML = `
                <div class="text-center text-danger">
                    <i class="bi bi-x-circle-fill" style="font-size: 3rem;"></i>
                    <h5 class="mt-3">เกิดข้อผิดพลาด</h5>
                    <p class="small">${err.message || "ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้"}</p>
                </div>
            `;
        }
    });

    function fileToBase64(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result.split(',')[1]);
            reader.onerror = (error) => reject(error);
            reader.readAsDataURL(file);
        });
    }

    // ปุ่มสำหรับเปิด-ปิดฟอร์มหน้าเว็บ
    document.getElementById("showFormBtn").onclick = function() {
        document.getElementById("formSection").style.display = "block";
        this.parentElement.style.display = "none";
    };
    document.getElementById("cancelBookingBtn").onclick = function() {
        carForm.reset();
        document.getElementById("formSection").style.display = "none";
        document.getElementById("showFormBtn").parentElement.style.display = "block";
        window.scrollTo({top: 0, behavior: 'smooth'});
    };
});
