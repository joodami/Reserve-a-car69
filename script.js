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

            const GAS_URL = "https://script.google.com/macros/s/AKfycbwnYqEKc9wreoIdwLR0W8fY1mHz3Gx0O44Iv1k_llgROJuqrjIXz6gYuWwwjzO3myK0/exec";
            
            const response = await fetch(GAS_URL, {
                method: "POST",
                mode: "no-cors", // ใช้ no-cors เพื่อเลี่ยงปัญหาข้ามโดเมนในบาง Browser
                body: new URLSearchParams({ "data": JSON.stringify(formDataObj) })
            });

            // เนื่องด้วย no-cors เราจะไม่เห็น response body 
            // จึงใช้วิธีหน่วงเวลารอระบบหลังบ้านทำงานแล้วแสดงสถานะสำเร็จ
            setTimeout(() => {
                document.getElementById('loadingIcon').style.display = "none";
                document.getElementById('modalFooter').style.display = "block";
                document.getElementById('modalText').innerHTML = `
                    <h4 class="text-success">✅ ส่งข้อมูลเรียบร้อยแล้ว</h4>
                    <p>ระบบกำลังดำเนินการสร้าง PDF และแจ้งเตือนทาง LINE<br>กรุณาตรวจสอบในกลุ่ม LINE ของท่านค่ะ</p>
                `;
                carForm.reset();
                setTimeout(() => { submitModal.hide(); cancelBtn.click(); }, 3000);
            }, 2500);

        } catch (err) {
            console.error(err);
            document.getElementById('loadingIcon').style.display = "none";
            document.getElementById('modalFooter').style.display = "block";
            document.getElementById('modalText').innerText = "❌ เกิดข้อผิดพลาด: " + err.message;
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
