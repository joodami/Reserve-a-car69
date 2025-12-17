document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("carForm");
  const passengerCountInput = form.querySelector('input[name="passengerCount"]');
  const fileUploadSection = document.getElementById("fileUploadSection");
  const passengerFileInput = fileUploadSection.querySelector('input[name="passengerFile"]');

  // ฟังก์ชันแสดง/ซ่อนไฟล์อัปโหลด
  function toggleFileUpload(count) {
    if (count >= 7) {
      fileUploadSection.style.display = "block";
    } else {
      fileUploadSection.style.display = "none";
      passengerFileInput.value = "";
    }
  }

  passengerCountInput.addEventListener("input", (e) => {
    const count = parseInt(e.target.value, 10) || 0;
    toggleFileUpload(count);
  });

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const modalText = document.getElementById("modalText");
    const modalFooter = document.getElementById("modalFooter");
    const submitModal = new bootstrap.Modal(document.getElementById("submitModal"));
    modalText.textContent = "กำลังส่งข้อมูล...";
    modalFooter.style.display = "none";
    submitModal.show();

    const formData = {
      bookDate: form.bookDate.value,
      name: form.name.value,
      tel: form.tel.value,
      position: form.position.value,
      car: form.car.value,
      location: form.location.value,
      purpose: form.purpose.value,
      startDate: form.startDate.value,
      startTime: form.startTime.value,
      endDate: form.endDate.value,
      endTime: form.endTime.value,
      passengerCount: Number(passengerCountInput.value) || 0
    };

    for (let i = 1; i <= 6; i++) {
      const el = form.querySelector(`input[name="passenger${i}"]`);
      formData[`passenger${i}`] = el ? el.value : "";
    }

    if (formData.passengerCount >= 7 && passengerFileInput.files.length > 0) {
      const file = passengerFileInput.files[0];
      formData.passengerFileName = file.name;
      formData.passengerFile = await toBase64(file);
    }

    try {
      const res = await fetch("https://script.google.com/macros/s/AKfycbzSqzDA2RdY2AnUo1SgGH8WoVMdUpTXFCwIfRPhkJMNoHCIljTsl1_94bYgVpEh-hk8/exec", {
        method: "POST",
        body: JSON.stringify(formData),
        headers: { "Content-Type": "application/json" }
      });
      const data = await res.json();

      modalText.innerHTML = `ส่งข้อมูลสำเร็จ!<br>PDF: <a href="${data.pdfUrl}" target="_blank">เปิด PDF</a>` +
        (data.passengerFileUrl ? `<br>ไฟล์ผู้ร่วมเดินทาง: <a href="${data.passengerFileUrl}" target="_blank">เปิดไฟล์</a>` : "");
      modalFooter.style.display = "block";

      form.reset();
      toggleFileUpload(0);
    } catch (err) {
      console.error(err);
      modalText.textContent = "เกิดข้อผิดพลาดในการส่งข้อมูล!";
      modalFooter.style.display = "block";
    }
  });

  // ฟังก์ชันแปลงไฟล์เป็น Base64
  function toBase64(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result.split(",")[1]);
      reader.onerror = error => reject(error);
      reader.readAsDataURL(file);
    });
  }

  // ปุ่มแสดง/ซ่อนฟอร์ม
  const showFormBtn = document.getElementById("showFormBtn");
  const formSection = document.getElementById("formSection");
  const cancelBookingBtn = document.getElementById("cancelBookingBtn");

  showFormBtn.addEventListener("click", () => {
    formSection.style.display = "block";
    showFormBtn.scrollIntoView({ behavior: "smooth" });
  });

  cancelBookingBtn.addEventListener("click", () => {
    form.reset();
    formSection.style.display = "none";
    toggleFileUpload(0);
  });
});
