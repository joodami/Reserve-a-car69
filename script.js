/*************************************************
 * CONFIG
 *************************************************/
const GAS_URL = "https://script.google.com/macros/s/AKfycbzSqzDA2RdY2AnUo1SgGH8WoVMdUpTXFCwIfRPhkJMNoHCIljTsl1_94bYgVpEh-hk8/exec";

/*************************************************
 * BANNER
 *************************************************/
const bannerUrl =
  "https://firebasestorage.googleapis.com/v0/b/banner-web-app.appspot.com/o/banner%20%E0%B8%88%E0%B8%AD%E0%B8%87%E0%B8%A3%E0%B8%9669.jpg?alt=media";

const banner = document.getElementById("banner");
if (banner) banner.style.backgroundImage = `url('${bannerUrl}')`;

/*************************************************
 * SHOW / HIDE FORM
 *************************************************/
const showFormBtn = document.getElementById("showFormBtn");
const formSection = document.getElementById("formSection");
const cancelBtn = document.getElementById("cancelBookingBtn");
const form = document.getElementById("carForm");

showFormBtn.addEventListener("click", () => {
  formSection.style.display = "block";
  showFormBtn.style.display = "none";
  formSection.scrollIntoView({ behavior: "smooth" });
});

cancelBtn.addEventListener("click", () => {
  form.reset();
  updatePassengerFields();
  formSection.style.display = "none";
  showFormBtn.style.display = "inline-block";
  showFormBtn.scrollIntoView({ behavior: "smooth" });
});

/*************************************************
 * PASSENGER LOGIC
 *************************************************/
const passengerCountInput = form.querySelector('input[name="passengerCount"]');
const passengerInputs = document.querySelectorAll("#passengerInputs input");
const fileUploadSection = document.getElementById("fileUploadSection");

function updatePassengerFields() {
  const count = Number(passengerCountInput.value) || 0;

  passengerInputs.forEach((input, index) => {
    if (count >= index + 1 && count <= 6) {
      input.style.display = "block";
    } else {
      input.style.display = "none";
      input.value = "";
    }
  });

  // แสดงอัปโหลดไฟล์เมื่อเกิน 6 คน
  fileUploadSection.style.display = count > 6 ? "block" : "none";
}

passengerCountInput.addEventListener("input", updatePassengerFields);
updatePassengerFields();

/*************************************************
 * MODAL
 *************************************************/
const submitModal = new bootstrap.Modal(
  document.getElementById("submitModal")
);

function showLoadingModal() {
  document.getElementById("modalText").innerText =
    "กำลังส่งข้อมูล กรุณารอสักครู่...";
  document.getElementById("loadingIcon").style.display = "block";
  document.getElementById("modalFooter").style.display = "none";
  submitModal.show();
}

function showSuccessModal() {
  document.getElementById("modalText").innerText =
    "ส่งข้อมูลเรียบร้อยแล้ว";
  document.getElementById("loadingIcon").style.display = "none";
  document.getElementById("modalFooter").style.display = "block";
}

/*************************************************
 * SUBMIT FORM
 *************************************************/
form.addEventListener("submit", (e) => {
  e.preventDefault();

  // ตรวจ required
  const requiredFields = form.querySelectorAll("[required]");
  for (const field of requiredFields) {
    if (!field.value.trim()) {
      alert(`กรุณากรอกช่อง: ${field.previousElementSibling?.textContent || ""}`);
      field.focus();
      return;
    }
  }

  const passengerCount = Number(passengerCountInput.value);
  const fileInput = form.querySelector('input[name="passengerFile"]');
  let passengerFile = null;

  // ตรวจไฟล์กรณี > 6 คน
  if (passengerCount > 6) {
    if (fileInput.files.length === 0) {
      alert("กรุณาแนบไฟล์ PDF รายชื่อผู้ร่วมเดินทาง");
      return;
    }
    const file = fileInput.files[0];
    if (file.type !== "application/pdf") {
      alert("อนุญาตเฉพาะไฟล์ PDF");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      alert("ไฟล์ต้องไม่เกิน 5MB");
      return;
    }
    passengerFile = file;
  }

  showLoadingModal();

  const data = Object.fromEntries(new FormData(form).entries());
  data.passengerCount = passengerCount;

  if (passengerFile) {
    const reader = new FileReader();
    reader.onload = () => {
      data.passengerFile = reader.result.split(",")[1];
      data.passengerFileName = passengerFile.name;
      sendToGAS(data);
    };
    reader.readAsDataURL(passengerFile);
  } else {
    data.passengerFile = null;
    data.passengerFileName = "-";
    sendToGAS(data);
  }
});

/*************************************************
 * SEND TO GOOGLE APPS SCRIPT
 *************************************************/
function sendToGAS(data) {
  fetch(GAS_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  })
    .then((res) => res.json())
    .then(() => {
      showSuccessModal();
      form.reset();
      updatePassengerFields();
      formSection.style.display = "none";
      showFormBtn.style.display = "inline-block";
    })
    .catch((err) => {
      alert("เกิดข้อผิดพลาด: " + err);
    });
}
