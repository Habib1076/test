const imageInput = document.getElementById("image-input");
const dropzone = document.getElementById("dropzone");
const removeBgBtn = document.getElementById("remove-bg-btn");
const downloadBtn = document.getElementById("download-btn");

const originalImg = document.getElementById("original-img");
const originalPreview = document.getElementById("original-preview");
const resultCanvas = document.getElementById("result-canvas");
const resultPreview = document.getElementById("result-preview");

const thresholdInput = document.getElementById("threshold");
const thresholdValueLabel = document.getElementById("threshold-value");

let loadedImage = null;

// ===== تحديث قيمة السلايدر =====
thresholdInput.addEventListener("input", () => {
  thresholdValueLabel.textContent = thresholdInput.value;
});

// ===== التعامل مع اختيار ملف =====
imageInput.addEventListener("change", (e) => {
  const file = e.target.files[0];
  if (!file) return;
  handleFile(file);
});

// ===== السحب والإفلات =====
["dragenter", "dragover"].forEach((eventName) => {
  dropzone.addEventListener(eventName, (e) => {
    e.preventDefault();
    e.stopPropagation();
    dropzone.classList.add("drag-over");
  });
});

["dragleave", "drop"].forEach((eventName) => {
  dropzone.addEventListener(eventName, (e) => {
    e.preventDefault();
    e.stopPropagation();
    dropzone.classList.remove("drag-over");
  });
});

dropzone.addEventListener("drop", (e) => {
  const file = e.dataTransfer.files[0];
  if (!file) return;
  handleFile(file);
});

// عند الضغط على الدروب زون
dropzone.addEventListener("click", () => {
  imageInput.click();
});

// ===== دالة معالجة الملف =====
function handleFile(file) {
  if (!file.type.startsWith("image/")) {
    alert("من فضلك اختر ملف صورة فقط.");
    return;
  }

  const reader = new FileReader();
  reader.onload = (event) => {
    const img = new Image();
    img.onload = () => {
      loadedImage = img;
      showOriginalImage(img);
      clearResult();
      removeBgBtn.disabled = false;
    };
    img.src = event.target.result;
  };
  reader.readAsDataURL(file);
}

// عرض الصورة الأصلية
function showOriginalImage(img) {
  hidePlaceholders();
  originalImg.src = img.src;
  originalImg.style.display = "block";
}

// إخفاء النصوص البديلة
function hidePlaceholders() {
  originalPreview
    .querySelectorAll(".placeholder-text")
    .forEach((el) => (el.style.display = "none"));
  resultPreview
    .querySelectorAll(".placeholder-text")
    .forEach((el) => (el.style.display = "none"));
}

// إعادة تعيين النتيجة
function clearResult() {
  const ctx = resultCanvas.getContext("2d");
  ctx.clearRect(0, 0, resultCanvas.width, resultCanvas.height);
  resultCanvas.style.display = "none";
  downloadBtn.disabled = true;
}

// ===== زر تفريغ الخلفية =====
removeBgBtn.addEventListener("click", () => {
  if (!loadedImage) return;
  const threshold = parseInt(thresholdInput.value, 10);
  removeBackground(loadedImage, threshold);
});

// ===== خوارزمية بسيطة لإزالة الخلفية =====
function removeBackground(img, threshold) {
  const canvas = resultCanvas;
  const ctx = canvas.getContext("2d");

  // ضبط حجم الكانفس
  const maxWidth = 700;
  const scale = img.width > maxWidth ? maxWidth / img.width : 1;

  canvas.width = img.width * scale;
  canvas.height = img.height * scale;

  ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = imageData.data;

  // حساب متوسط لون الخلفية من زوايا الصورة
  const bgColor = estimateBackgroundColor(imageData);

  // إزالة الخلفية بحسب الحساسية
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];

    const distance = colorDistance({ r, g, b }, bgColor);

    if (distance < threshold) {
      // اجعل البكسل شفاف
      data[i + 3] = 0;
    }
  }

  ctx.putImageData(imageData, 0, 0);
  resultCanvas.style.display = "block";
  downloadBtn.disabled = false;
}

// تقدير لون الخلفية من زوايا الصورة
function estimateBackgroundColor(imageData) {
  const { width, height, data } = imageData;

  const samplePoints = [
    { x: 0, y: 0 },
    { x: width - 1, y: 0 },
    { x: 0, y: height - 1 },
    { x: width - 1, y: height - 1 },
    { x: Math.floor(width / 2), y: 0 },
    { x: Math.floor(width / 2), y: height - 1 },
  ];

  let totalR = 0,
    totalG = 0,
    totalB = 0;

  samplePoints.forEach((p) => {
    const idx = (p.y * width + p.x) * 4;
    totalR += data[idx];
    totalG += data[idx + 1];
    totalB += data[idx + 2];
  });

  const count = samplePoints.length;

  return {
    r: totalR / count,
    g: totalG / count,
    b: totalB / count,
  };
}

// مسافة اللون (إقليدية في فضاء RGB)
function colorDistance(c1, c2) {
  const dr = c1.r - c2.r;
  const dg = c1.g - c2.g;
  const db = c1.b - c2.b;
  return Math.sqrt(dr * dr + dg * dg + db * db);
}

// ===== تحميل الصورة الناتجة =====
downloadBtn.addEventListener("click", () => {
  const link = document.createElement("a");
  link.download = "image-no-bg.png";
  link.href = resultCanvas.toDataURL("image/png");
  link.click();
});


