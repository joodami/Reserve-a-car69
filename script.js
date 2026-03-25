document.addEventListener('DOMContentLoaded', function() {
    const carForm = document.getElementById("carForm");
    const passengerCountInput = document.querySelector('input[name="passengerCount"]');
    const passengerInputsContainer = document.getElementById("passengerInputs");
    const fileUploadSection = document.getElementById("fileUploadSection");
    const submitModal = new bootstrap.Modal(document.getElementById('submitModal'));

    // 1. จัดการช่องกรอกผู้ร่วมเดินทาง
    passengerCountInput.addEventListener("input", function() {
        const count = Number(this.value) || 0;
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
    });

    // 2. ฟังก์ชันหลักในการส่งข้อมูล
    carForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const modalText = document.getElementById('modalText');
        const modalFooter = document.getElementById('modalFooter');
        const loadingIcon = document.getElementById('loadingIcon');

        modalText.innerHTML = "⏳ ระบบกำลังบันทึกข้อมูลและสร้างไฟล์ PDF... <br>กรุณารอสักครู่ประมาณ 10-15 วินาทีนะคะ";
        loadingIcon.style.display = "block";
        modalFooter.style.display = "none";
        submitModal.show();

        try {
            const formData = new FormData(carForm);
            const formDataObj = Object.fromEntries(formData.entries());
            
            // แปลงไฟล์ PDF (ถ้ามี)
            const fileInput = carForm.querySelector('[name="passengerFile"]');
            if (fileInput && fileInput.files.length > 0) {
                formDataObj.passengerFile = await fileToBase64(fileInput.files[0]);
                formDataObj.passengerFileName = fileInput.files[0].name;
            }

            // *** สำคัญ: ตรวจสอบ URL ของคุณให้ถูกต้อง ***
            const GAS_URL = "https://script.google.com/macros/s/AKfycbwnYqEKc9wreoIdwLR0W8fY1mHz3Gx0O44Iv1k_llgROJuqrjIXz6gYuWwwjzO3myK0/exec";
            
            // ส่งข้อมูลด้วยวิธี Bypass CORS (ใช้ text/plain)
            const response = await fetch(GAS_URL, {
                method: "POST",
                mode: "cors", // ต้องเปิดเป็น cors เพื่อให้อ่าน response ได้
                headers: {
                    "Content-Type": "text/plain;charset=utf-8",
                },
                body: JSON.stringify(formDataObj)
            });

            const resData = await response.json();

            if (resData.status === "success" && resData.result.isComplete) {
                loadingIcon.style.display = "none";
                modalFooter.style.display = "block";
                modalText.innerHTML = `
                    <div class="text-center">
                        <i class="bi bi-check-circle-fill text-success" style="font-size: 3.5rem;"></i>
                        <h4 class="text-success fw-bold mt-3">จองรถสำเร็จเรียบร้อย!</h4>
                        <p class="text-muted">ระบบแจ้งเตือนเข้า LINE และบันทึกปฏิทินแล้วค่ะ</p>
                        <a href="${resData.result.pdfUrl}" target="_blank" class="btn btn-primary rounded-pill w-100 mt-4 py-2 shadow-sm">
                            <i class="bi bi-file-earmark-pdf-fill me-2"></i> เปิดดูไฟล์คำขอจอง (PDF)
                        </a>
                    </div>
                `;
                carForm.reset();
                passengerInputsContainer.innerHTML = "";
            } else {
                throw new Error(resData.result?.error || "ระบบประมวลผลไม่สำเร็จ");
            }

        } catch (err) {
            console.error("Submission Error:", err);
            loadingIcon.style.display = "none";
            modalFooter.style.display = "block";
            modalText.innerHTML = `
                <div class="text-center text-danger">
                    <i class="bi bi-exclamation-triangle-fill" style="font-size: 3rem;"></i>
                    <h5 class="mt-3">เกิดข้อผิดพลาด</h5>
                    <p class="small">กรุณาลองใหม่อีกครั้ง หรือติดต่อผู้ดูแลระบบ <br> (${err.message})</p>
                </div>
            `;
        }
    });

    function fileToBase64(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result.split(',')[1]);
            reader.onerror = reject;
            reader.readAsDataURL(file);
        });
    }

    // ปุ่ม UI เปิด-ปิดฟอร์ม
    document.getElementById("showFormBtn").onclick = () => {
        document.getElementById("formSection").style.display = "block";
        document.getElementById("showFormBtn").parentElement.style.display = "none";
    };
    document.getElementById("cancelBookingBtn").onclick = () => {
        carForm.reset();
        document.getElementById("formSection").style.display = "none";
        document.getElementById("showFormBtn").parentElement.style.display = "block";
        window.scrollTo({top: 0, behavior: 'smooth'});
    };
});
