document.addEventListener('DOMContentLoaded', function() {
    const showFormBtn = document.getElementById("showFormBtn");
    const formSection = document.getElementById("formSection");
    const cancelBtn = document.getElementById("cancelBookingBtn");
    const carForm = document.getElementById("carForm");
    const passengerCountInput = document.querySelector('input[name="passengerCount"]');
    const passengerInputsContainer = document.getElementById("passengerInputs");
    const fileUploadSection = document.getElementById("fileUploadSection");
    const submitModal = new bootstrap.Modal(document.getElementById('submitModal'));

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
        } else if (count > 6) {
            fileUploadSection.style.display = "block";
        } else {
            fileUploadSection.style.display = "none";
        }
    }
    passengerCountInput.addEventListener("input", updatePassengerFields);

    showFormBtn.addEventListener("click", () => {
        formSection.style.display = "block";
        showFormBtn.parentElement.style.display = "none";
        formSection.scrollIntoView({ behavior: "smooth" });
    });

    cancelBtn.addEventListener("click", () => {
        carForm.reset();
        formSection.style.display = "none";
        showFormBtn.parentElement.style.display = "block";
        updatePassengerFields();
        window.scrollTo({ top: 0, behavior: "smooth" });
    });

    carForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        document.getElementById('modalText').innerHTML = "⏳ กำลังดำเนินการส่งข้อมูล...";
        document.getElementById('loadingIcon').style.display = "block";
        document.getElementById('modalFooter').style.display = "none";
        submitModal.show();

        try {
            const formData = new FormData(carForm);
            const formDataObj = Object.fromEntries(formData.entries());
            
            // ตรวจสอบไฟล์แนบ
            const fileInput = carForm.querySelector('[name="passengerFile"]');
            if (fileInput && fileInput.files.length > 0) {
                formDataObj.passengerFile = await fileToBase64(fileInput.files[0]);
                formDataObj.passengerFileName = fileInput.files[0].name;
            }

            // *** ส่วนที่แก้ไข: เปลี่ยนวิธีการส่งเพื่อให้ GAS อ่านข้อมูลได้ ***
            const GAS_URL = "https://script.google.com/macros/s/AKfycbwnYqEKc9wreoIdwLR0W8fY1mHz3Gx0O44Iv1k_llgROJuqrjIXz6gYuWwwjzO3myK0/exec";
            
            // สร้าง URLSearchParams เพื่อส่งแบบ Form POST ธรรมดา (หลีกเลี่ยง CORS error)
            const formBody = new URLSearchParams();
            formBody.append("data", JSON.stringify(formDataObj));

            const response = await fetch(GAS_URL, {
                method: "POST",
                mode: "no-cors", // จำเป็นสำหรับ GAS แต่ต้องมั่นใจว่าส่งเป็น Parameter ชื่อ 'data'
                body: formBody,
                headers: {
                    "Content-Type": "application/x-www-form-urlencoded"
                }
            });

            // ปรับการแสดงผล Modal: ให้ค้างไว้เพื่อให้คนกดปิดเอง
            document.getElementById('loadingIcon').style.display = "none";
            document.getElementById('modalFooter').style.display = "block"; // แสดงปุ่มปิด
            document.getElementById('modalText').innerHTML = `
                <div class="text-center">
                    <h4 class="text-success fw-bold mb-3">✅ ส่งข้อมูลเรียบร้อยแล้ว</h4>
                    <p class="text-muted">ระบบกำลังบันทึกข้อมูลและสร้างไฟล์ PDF... <br>กรุณารอตรวจสอบในกลุ่ม LINE และปฏิทินในสักครู่ค่ะ</p>
                </div>
            `;
            
            carForm.reset();
            updatePassengerFields();
            // ไม่ใช้ setTimeout สั่งปิด เพื่อให้ผู้ใช้กดปุ่ม "ปิดหน้าต่าง" เอง

        } catch (err) {
            console.error(err);
            document.getElementById('loadingIcon').style.display = "none";
            document.getElementById('modalFooter').style.display = "block";
            document.getElementById('modalText').innerHTML = `<span class="text-danger">❌ เกิดข้อผิดพลาด: ${err.message}</span>`;
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
});
