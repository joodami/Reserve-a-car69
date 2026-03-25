// =====================================================
// แสดง/ซ่อนฟอร์ม
// =====================================================
const showFormBtn = document.getElementById("showFormBtn");
const formSection = document.getElementById("formSection");
const cancelBtn = document.getElementById("cancelBookingBtn");

showFormBtn.addEventListener("click", () => {
  formSection.style.display = "block";
  showFormBtn.style.display = "none";
  formSection.scrollIntoView({ behavior: "smooth" });
});

cancelBtn.addEventListener("click", () => {
  document.getElementById("carForm").reset();
  formSection.style.display = "none";
  showFormBtn.style.display = "inline-block";
  updatePassengerFields();
});

// =====================================================
// ผู้ร่วมเดินทาง
// =====================================================
const passengerCount = document.querySelector('input[name="passengerCount"]');
const passengerInputs = document.querySelectorAll('#passengerInputs input');
const fileUploadSection = document.getElementById("fileUploadSection");

function updatePassengerFields() {
  let count = Number(passengerCount.value);
  passengerInputs.forEach((input, index) => {
    if (count === 0) input.style.display = "none";
    else if (count <= 6) {
      input.style.display = (index < count) ? "block" : "none";
      input.value = "";
    } else input.style.display = "none";
  });
  fileUploadSection.style.display = count > 6 ? "block" : "none";
}

passengerCount.addEventListener("input", updatePassengerFields);
updatePassengerFields();

// =====================================================
// ส่งฟอร์ม
// =====================================================
const form = document.getElementById('carForm');
const submitModal = new bootstrap.Modal(document.getElementById('submitModal'));
let isSubmitting = false;

form.addEventListener('submit', async (e) => {
  e.preventDefault();

  if (isSubmitting) return;
  isSubmitting = true;

  // ตรวจฟิลด์ required
  const requiredFields = form.querySelectorAll('[required]');
  for (const field of requiredFields) {
    if (!field.value.trim()) {
      alert(`กรุณากรอกช่อง: ${field.previousElementSibling.textContent}`);
      field.focus();
      isSubmitting = false;
      return;
    }
  }

  const count = Number(form.querySelector('input[name="passengerCount"]').value);
  const fileInput = form.querySelector('[name="passengerFile"]');
  let passengerFile = null;

  if (count > 6) {
    if (fileInput.files.length === 0) {
      alert("กรุณาแนบไฟล์ PDF รายชื่อผู้ร่วมเดินทาง");
      fileInput.focus();
      isSubmitting = false;
      return;
    }
    const file = fileInput.files[0];
    if (file.type !== "application/pdf") {
      alert("กรุณาอัปโหลดไฟล์ PDF เท่านั้น");
      fileInput.focus();
      isSubmitting = false;
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      alert("ไฟล์ต้องเล็กกว่า 5 MB");
      fileInput.focus();
      isSubmitting = false;
      return;
    }
    passengerFile = file;
  }

  // แสดง modal
  document.getElementById('modalText').innerHTML = "กำลังส่งข้อมูล กรุณารอสักครู่...";
  document.getElementById('loadingIcon').style.display = "block";
  document.getElementById('modalFooter').style.display = "none";
  submitModal.show();

  try {
    const formData = Object.fromEntries(new FormData(form).entries());
    formData.passengerCount = count;

    if (passengerFile) {
      formData.passengerFile = await fileToBase64(passengerFile);
      formData.passengerFileName = passengerFile.name;
    } else {
      formData.passengerFile = null;
      formData.passengerFileName = "-";
    }

    // ✅ เพิ่ม timeout กันค้าง
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 60000);

    const result = await sendToGAS(formData, controller.signal);

    clearTimeout(timeout);

    document.getElementById('loadingIcon').style.display = "none";
    document.getElementById('modalFooter').style.display = "block";

    // ===== แสดงผล =====
    if (result.status === "success") {
      document.getElementById('modalText').innerHTML =
        "✅ ส่งข้อมูลเรียบร้อยแล้ว";

    } else if (result.status === "partial") {
      const errors = (result.result && result.result.errors)
        ? result.result.errors.join("<br>")
        : "ไม่ทราบสาเหตุ";
      document.getElementById('modalText').innerHTML =
        "⚠️ ทำงานไม่ครบ:<br>" + errors;

    } else {
      document.getElementById('modalText').innerHTML =
        "❌ เกิดข้อผิดพลาด: " + (result.message || "ไม่ทราบสาเหตุ");
    }

    // ===== เคลียร์ฟอร์ม หลัง success หรือ partial =====
    if (result.status === "success" || result.status === "partial") {
      form.reset();
      updatePassengerFields();
      formSection.style.display = "none";
      showFormBtn.style.display = "inline-block";
    }

  } catch (err) {
    document.getElementById('loadingIcon').style.display = "none";
    document.getElementById('modalFooter').style.display = "block";

    if (err.name === "AbortError") {
      document.getElementById('modalText').innerHTML =
        "❌ ใช้เวลานานเกินไป (timeout)";
    } else {
      document.getElementById('modalText').innerHTML =
        "❌ ระบบเชื่อมต่อไม่สำเร็จ";
    }

  } finally {
    isSubmitting = false;
  }
});

// =====================================================
// Base64
// =====================================================
function fileToBase64(file){
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result.split(',')[1]);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

// =====================================================
// ส่งข้อมูลไป GAS
// =====================================================
async function sendToGAS(data, signal){
  const res = await fetch("https://script.google.com/macros/s/AKfycbwnYqEKc9wreoIdwLR0W8fY1mHz3Gx0O44Iv1k_llgROJuqrjIXz6gYuWwwjzO3myK0/exec", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded"
    },
    body: "data=" + encodeURIComponent(JSON.stringify(data)),
    signal: signal
  });

  if (!res.ok) throw new Error("HTTP " + res.status);

  // ✅ รอผลจาก GAS, LINE ส่งจาก GAS แล้ว
  const json = await res.json();
  return json;
}

// =====================================================
// ไม่มี fetchLine() อีกแล้ว
// =====================================================
