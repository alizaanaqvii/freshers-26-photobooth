// ========================================
// SUPABASE CONFIGURATION
// ========================================

const SUPABASE_URL =
  "https://idarclntygsgwpgxsudc.supabase.co";

const SUPABASE_KEY =
  "sb_publishable_5zMR5NMbIW_fd8y39I26UQ_hsYNiO6v";


const supabaseClient =
  window.supabase.createClient(
    SUPABASE_URL,
    SUPABASE_KEY
  );

const video = document.getElementById("webcam");
const canvas = document.getElementById("canvas");
const snapButton = document.getElementById("snapStrip");
const downloadButton = document.getElementById("downloadStrip");
const filmContainer = document.getElementById("filmStripContainer");
const filterButtons = document.querySelectorAll(".filter-btn");
const countdown = document.getElementById("countdown");
const qrSection = document.getElementById("qrSection");
const qrCanvas = document.getElementById("qrCanvas");
const uploadStatus =  document.getElementById("uploadStatus");

let currentFilter = "none";


// ========================================
// FILTERS
// ========================================

filterButtons.forEach(btn => {

  btn.addEventListener("click", () => {

    filterButtons.forEach(b =>
      b.classList.remove("active")
    );

    btn.classList.add("active");

    currentFilter = btn.dataset.filter;

    applyFilter(video, currentFilter);

  });

});


function applyFilter(element, filter) {

  switch (filter) {

    case "bw":
      element.style.filter = "grayscale(1)";
      break;

    case "warm":
      element.style.filter =
        "contrast(1.1) sepia(0.3) saturate(1.3)";
      break;

    default:
      element.style.filter = "none";
  }

}


// ========================================
// CAMERA ACCESS
// ========================================

if (
  navigator.mediaDevices &&
  navigator.mediaDevices.getUserMedia
) {

  navigator.mediaDevices
    .getUserMedia({
      video: true,
      audio: false
    })

    .then(stream => {

      video.srcObject = stream;
      video.style.transform = "scaleX(-1)";

      video.play();

    })

    .catch(err => {

      console.error(
        "Camera access error:",
        err
      );

      alert(
        "Camera access error. Please allow camera access and refresh the page."
      );

    });

} else {

  alert(
    "Camera access is not supported by this browser."
  );

}


// ========================================
// COUNTDOWN
// ========================================

function showCountdown(seconds) {

  return new Promise(resolve => {

    let count = seconds;

    countdown.style.opacity = 1;

    const interval =
      setInterval(() => {

        if (count > 0) {

          countdown.textContent = count;

          countdown.classList.remove("pop");

          void countdown.offsetWidth;

          countdown.classList.add("pop");

          count--;

        } else {

          clearInterval(interval);

          countdown.textContent = "";

          countdown.style.opacity = 0;

          resolve();

        }

      }, 1000);

  });

}


// ========================================
// ROUNDED RECTANGLE
// ========================================

function drawRoundedRect(
  ctx,
  x,
  y,
  width,
  height,
  radius
) {

  ctx.beginPath();

  ctx.moveTo(
    x + radius,
    y
  );

  ctx.lineTo(
    x + width - radius,
    y
  );

  ctx.quadraticCurveTo(
    x + width,
    y,
    x + width,
    y + radius
  );

  ctx.lineTo(
    x + width,
    y + height - radius
  );

  ctx.quadraticCurveTo(
    x + width,
    y + height,
    x + width - radius,
    y + height
  );

  ctx.lineTo(
    x + radius,
    y + height
  );

  ctx.quadraticCurveTo(
    x,
    y + height,
    x,
    y + height - radius
  );

  ctx.lineTo(
    x,
    y + radius
  );

  ctx.quadraticCurveTo(
    x,
    y,
    x + radius,
    y
  );

  ctx.closePath();

}


// ========================================
// STAR
// ========================================

function drawStar(
  ctx,
  x,
  y,
  size,
  color
) {

  ctx.save();

  ctx.fillStyle = color;

  ctx.beginPath();

  for (let i = 0; i < 8; i++) {

    const angle =
      (Math.PI / 4) * i;

    const radius =
      i % 2 === 0
        ? size
        : size * 0.3;

    const px =
      x + Math.cos(angle) * radius;

    const py =
      y + Math.sin(angle) * radius;

    if (i === 0) {

      ctx.moveTo(px, py);

    } else {

      ctx.lineTo(px, py);

    }

  }

  ctx.closePath();

  ctx.fill();

  ctx.restore();

}

// ========================================
// UPLOAD PHOTO + GENERATE QR
// ========================================

async function uploadPhotoAndGenerateQR(
  stripCanvas
) {

  try {

    qrSection.style.display =
      "block";

    uploadStatus.textContent =
      "UPLOADING YOUR PHOTO...";


    // Convert canvas to PNG blob

    const blob =
      await new Promise(resolve => {

        stripCanvas.toBlob(
          resolve,
          "image/png"
        );

      });


    if (!blob) {

      throw new Error(
        "Could not create image blob."
      );

    }


    // ====================================
    // UNIQUE PHOTO ID
    // ====================================

    const photoId =
      "F26-" +
      crypto.randomUUID()
        .replace(/-/g, "")
        .substring(0, 10)
        .toUpperCase();


    const filePath =
      `${photoId}.png`;


    // ====================================
    // UPLOAD TO SUPABASE
    // ====================================

    const {
      data,
      error
    } =
      await supabaseClient
        .storage
        .from("freshers-photos")
        .upload(
          filePath,
          blob,
          {
            contentType: "image/png",

            cacheControl: "3600",

            upsert: false
          }
        );


    if (error) {

      console.error(
        "Supabase upload error:",
        error
      );

      throw error;

    }


    // ====================================
    // PHOTO PAGE URL
    // ====================================

    const photoPageUrl =
      `${window.location.origin}/photo.html?id=${photoId}`;


    console.log(
      "Photo URL:",
      photoPageUrl
    );


    // ====================================
    // GENERATE QR CODE
    // ====================================

    qrCanvas.innerHTML = "";

new QRCode(qrCanvas, {
  text: photoPageUrl,
  width: 200,
  height: 200,
  colorDark: "#000000",
  colorLight: "#ffffff",
  correctLevel: QRCode.CorrectLevel.H
});


    uploadStatus.textContent =
      "SCAN THE QR CODE TO SAVE YOUR PHOTO";


    console.log(
      "Upload successful:",
      filePath
    );

  }


  catch (error) {

    console.error(
      "Photo delivery failed:",
      error
    );


    qrSection.style.display =
      "block";


    uploadStatus.textContent =
      "UPLOAD FAILED — PLEASE TRY AGAIN.";

  }

}

// ========================================
// TAKE 4-CUT PHOTO
// ========================================

snapButton.addEventListener(
  "click",
  async () => {

    // Prevent multiple clicks
    snapButton.disabled = true;

    snapButton.innerText =
      "📸 TAKING PHOTOS...";

    // Clear previous previews
    filmContainer.innerHTML = "";

    downloadButton.style.display = "none";


    // ====================================
    // PHOTO SETTINGS
    // ====================================

    const photoCount = 4;

    const padding = 25;

    const photoGap = 22;

    const headerHeight = 80;

    const footerHeight = 100;


    // ====================================
    // CAMERA RATIO
    // ====================================

    const videoRatio =
      video.videoWidth &&
      video.videoHeight
        ? video.videoWidth /
          video.videoHeight
        : 16 / 9;


    const photoHeight = 235;

    const photoWidth =
      Math.round(
        photoHeight * videoRatio
      );


    // ====================================
    // STRIP DIMENSIONS
    // ====================================

    const stripWidth =
      photoWidth +
      padding * 2;

    const stripHeight =
      headerHeight +
      (photoCount * photoHeight) +
      ((photoCount - 1) * photoGap) +
      footerHeight +
      padding * 2;


    const stripCanvas =
      document.createElement("canvas");

    stripCanvas.width =
      stripWidth;

    stripCanvas.height =
      stripHeight;

    const ctx =
      stripCanvas.getContext("2d");


    // ====================================
    // BACKGROUND
    // ====================================

    const backgroundGradient =
      ctx.createLinearGradient(
        0,
        0,
        stripWidth,
        stripHeight
      );

    backgroundGradient.addColorStop(
      0,
      "#120b2d"
    );

    backgroundGradient.addColorStop(
      0.45,
      "#21104a"
    );

    backgroundGradient.addColorStop(
      1,
      "#090617"
    );

    ctx.fillStyle =
      backgroundGradient;

    ctx.fillRect(
      0,
      0,
      stripWidth,
      stripHeight
    );


    // ====================================
    // BACKGROUND STARS
    // ====================================

    drawStar(
      ctx,
      20,
      25,
      8,
      "#ec4899"
    );

    drawStar(
      ctx,
      stripWidth - 20,
      25,
      8,
      "#38bdf8"
    );


    drawStar(
      ctx,
      18,
      stripHeight - 25,
      6,
      "#bef264"
    );

    drawStar(
      ctx,
      stripWidth - 18,
      stripHeight - 25,
      7,
      "#c084fc"
    );


    // ====================================
    // HEADER
    // ====================================

    ctx.textAlign = "center";

    ctx.textBaseline = "middle";


    // University
    ctx.fillStyle =
      "#b9b2c9";

    ctx.font =
      "600 10px Arial";

    ctx.fillText(
      "HERIOT-WATT UNIVERSITY DUBAI",
      stripWidth / 2,
      25
    );


    // Title
    const titleGradient =
      ctx.createLinearGradient(
        0,
        40,
        stripWidth,
        40
      );

    titleGradient.addColorStop(
      0,
      "#c084fc"
    );

    titleGradient.addColorStop(
      0.5,
      "#f472b6"
    );

    titleGradient.addColorStop(
      1,
      "#38bdf8"
    );

    ctx.fillStyle =
      titleGradient;

    ctx.font =
      "bold 30px Arial";

    ctx.fillText(
      "FRESHERS '26",
      stripWidth / 2,
      62
    );



    // ====================================
    // TAKE FOUR PHOTOS
    // ====================================

    for (
      let i = 0;
      i < photoCount;
      i++
    ) {

      // 3 second countdown
      await showCountdown(3);


      // ==================================
      // CAPTURE PHOTO
      // ==================================

      canvas.width =
        photoWidth;

      canvas.height =
        photoHeight;

      const tempCtx =
        canvas.getContext("2d");

      tempCtx.filter =
        video.style.filter ||
        "none";

tempCtx.save();

tempCtx.translate(
  canvas.width,
  0
);

tempCtx.scale(
  -1,
  1
);

tempCtx.drawImage(
  video,
  0,
  0,
  canvas.width,
  canvas.height
);

tempCtx.restore();


      // ==================================
      // CAMERA FLASH
      // ==================================

      const flash =
        document.querySelector(
          ".camera-flash"
        );

      if (flash) {

        flash.style.opacity = "1";

        setTimeout(() => {

          flash.style.opacity = "0";

        }, 120);

      }


      // ==================================
      // PHOTO POSITION
      // ==================================

      const photoX =
        padding;

      const photoY =
        padding +
        headerHeight +
        i *
          (photoHeight + photoGap);


      // ==================================
      // WHITE PHOTO FRAME
      // ==================================

      ctx.save();

      ctx.shadowColor =
        "rgba(0,0,0,0.45)";

      ctx.shadowBlur = 15;

      ctx.shadowOffsetY = 6;

      ctx.fillStyle =
        "#ffffff";


      drawRoundedRect(
        ctx,
        photoX - 5,
        photoY - 5,
        photoWidth + 10,
        photoHeight + 10,
        8
      );

      ctx.fill();

      ctx.restore();


      // ==================================
      // PHOTO
      // ==================================

      ctx.save();

      drawRoundedRect(
        ctx,
        photoX,
        photoY,
        photoWidth,
        photoHeight,
        5
      );

      ctx.clip();


      ctx.drawImage(
        canvas,
        photoX,
        photoY,
        photoWidth,
        photoHeight
      );

      ctx.restore();

      // ==================================
      // LIVE PREVIEW
      // ==================================

      const preview =
        document.createElement("img");

      preview.src =
        canvas.toDataURL(
          "image/png"
        );

      filmContainer.appendChild(
        preview
      );

    }


// ====================================
// FOOTER
// ====================================

const lastPhotoBottom =
  padding +
  headerHeight +
  (photoCount - 1) * (photoHeight + photoGap) +
  photoHeight;

// Footer area
const footerTop = lastPhotoBottom;
const footerBottom = stripHeight - padding;

// Centre the footer content vertically
const footerCenter =
  footerTop + (footerBottom - footerTop) / 2;

ctx.textAlign = "center";
ctx.textBaseline = "middle";

// Location
ctx.fillStyle = "#ffffff";

ctx.font = "bold 15px Arial";

ctx.fillText(
  "📍 The Fridge, Alserkal Avenue",
  stripWidth / 2,
  footerCenter - 4
);

// Date
ctx.fillStyle = "#b9b2c9";

ctx.font = "12px Arial";

ctx.fillText(
  "📅 08 OCTOBER 2026",
  stripWidth / 2,
  footerCenter + 20
);

    // ====================================
    // FINAL STRIP PREVIEW
    // ====================================

    const stripImg =
      document.createElement("img");

    stripImg.src =
      stripCanvas.toDataURL(
        "image/png"
      );

    filmContainer.appendChild(
      stripImg
    );


    // ====================================
    // SAVE DOWNLOAD
    // ====================================

    downloadButton.dataset.stripData =
      stripCanvas.toDataURL(
        "image/png"
      );


    downloadButton.style.display =
      "inline-block";

    await uploadPhotoAndGenerateQR(
      stripCanvas
    );


    // ====================================
    // RESET BUTTON
    // ====================================

    snapButton.disabled = false;

    snapButton.innerText =
      "📸 TAKE 4-CUT";

  }
);


// ========================================
// DOWNLOAD
// ========================================

downloadButton.addEventListener(
  "click",
  () => {

    const a =
      document.createElement("a");

    a.href =
      downloadButton.dataset.stripData;

    a.download =
      "freshers_26_photobooth.png";

    a.click();


    downloadButton.innerText =
      "✓ PHOTO SAVED";


    setTimeout(() => {

      downloadButton.innerText =
        "↓ SAVE PHOTO";

    }, 2500);

  }
);