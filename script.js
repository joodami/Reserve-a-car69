// ===== แสดง/ซ่อนฟอร์ม =====
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

// ===== ผู้ร่วมเดินทาง =====
const passengerCount = document.querySelector('input[name="passengerCount"]');
const passengerInputs = document.querySelectorAll('#passengerInputs input');
const fileUploadSection = document.getElementById("fileUploadSection");

function updatePassengerFields() {
  let count = Number(passengerCount.value);
  passengerInputs.forEach((input, index) => {
    if(count === 0) input.style.display = "none";
    else if(count <=6) {
      input.style.display = (index < count) ? "block" : "none";
      input.value = "";
    } else input.style.display = "none";
  });
  fileUploadSection.style.display = count > 6 ? "block" : "none";
}

passengerCount.addEventListener("input", updatePassengerFields);
updatePassengerFields();

// ===== FullCalendar =====
let calendar;
document.addEventListener('DOMContentLoaded', () => {
  const calendarEl = document.getElementById('calendar');
  const eventModal = new bootstrap.Modal(document.getElementById('eventModal'));

  calendar = new FullCalendar.Calendar(calendarEl, {
    locale: 'th',
    initialView: 'dayGridMonth',
    height: 'auto',   // <-- ใช้ 'auto' หรือ 'parent' แทน '100%'
    contentHeight: 600,
    headerToolbar: { left: 'prev,next today', center: 'title', right: 'dayGridMonth,timeGridWeek,timeGridDay' },
    buttonText: { today: "วันนี้", month: "เดือน", week: "สัปดาห์", day: "วัน" },
    events: async (info, success, failure) => {
      try {
        const res = await fetch('https://script.google.com/macros/s/AKfycbzSqzDA2RdY2AnUo1SgGH8WoVMdUpTXFCwIfRPhkJMNoHCIljTsl1_94bYgVpEh-hk8/exec?mode=events');
        success(await res.json());
      } catch (e) { failure(e); }
    },
    eventClick: function(info) {
      const e = info.event.extendedProps;
      document.getElementById('eventModalTitle').textContent = `🚗 ${e.car} | ${e.name}`;
      document.getElementById('eventModalBody').innerHTML =
        `<p><strong>ผู้ขอใช้รถ:</strong> ${e.name}</p>` +
        `<p><strong>รถ:</strong> ${e.car}</p>` +
        `<p><strong>สถานที่:</strong> ${e.location}</p>` +
        `<p><strong>วัตถุประสงค์:</strong> ${e.purpose}</p>` +
        `<p><strong>เวลา:</strong> ${info.event.start.toLocaleString('th-TH')} - ${info.event.end.toLocaleString('th-TH')}</p>`;
      eventModal.show();
    }
  });
  calendar.render();
});

// ===== ส่งฟอร์ม =====
const form = document.getElementById('carForm');
const submitModal = new bootstrap.Modal(document.getElementById('submitModal'));

form.addEventListener('submit', async (e) => {
  e.preventDefault();

  const requiredFields = form.querySelectorAll('[required]');
  for (const field of requiredFields) {
    if (!field.value.trim()) {
      alert(`กรุณากรอกช่อง: ${field.previousElementSibling.textContent}`);
      field.focus();
      return;
    }
  }

  const count = Number(form.querySelector('input[name="passengerCount"]').value);
  const fileInput = form.querySelector('[name="passengerFile"]');
  let passengerFile = null;

  if(count > 6){
    if(fileInput.files.length === 0){
      alert("กรุณาแนบไฟล์ PDF รายชื่อผู้ร่วมเดินทาง");
      fileInput.focus();
      return;
    }
    const file = fileInput.files[0];
    if(file.type !== "application/pdf"){ alert("กรุณาอัปโหลดไฟล์ PDF เท่านั้น"); fileInput.focus(); return; }
    if(file.size > 5*1024*1024){ alert("ไฟล์ต้องเล็กกว่า 5 MB"); fileInput.focus(); return; }
    passengerFile = file;
  }

  document.getElementById('modalText').innerHTML = "กำลังส่งข้อมูล กรุณารอสักครู่...";
  document.getElementById('loadingIcon').style.display = "block";
  document.getElementById('modalFooter').style.display = "none";
  submitModal.show();

  const formData = Object.fromEntries(new FormData(form).entries());
  formData.passengerCount = count;

  if(passengerFile){
    formData.passengerFile = await fileToBase64(passengerFile);
    formData.passengerFileName = passengerFile.name;
  } else {
    formData.passengerFile = null;
    formData.passengerFileName = "-";
  }

  sendToGAS(formData);
});

function fileToBase64(file){
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result.split(',')[1]);
    reader.onerror = error => reject(error);
    reader.readAsDataURL(file);
  });
}

function sendToGAS(data){
  fetch("https://script.google.com/macros/s/AKfycbzSqzDA2RdY2AnUo1SgGH8WoVMdUpTXFCwIfRPhkJMNoHCIljTsl1_94bYgVpEh-hk8/exec", {
    method: "POST",
    mode: "no-cors",
    body: JSON.stringify(data)
  });

  setTimeout(() => {
    document.getElementById('modalText').innerHTML = "ส่งข้อมูลเรียบร้อยแล้ว ✅";
    document.getElementById('loadingIcon').style.display = "none";
    document.getElementById('modalFooter').style.display = "block";

    form.reset();
    updatePassengerFields();
    formSection.style.display = "none";
    showFormBtn.style.display = "inline-block";

    // Refresh ปฏิทินอัตโนมัติ
    if(calendar) calendar.refetchEvents();
  }, 800);
}
