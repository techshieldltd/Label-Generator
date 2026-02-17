// Built-in logo as inline SVG (no external file).
// Replace this SVG with your real logo later if needed.
const BUILTIN_LOGO_SVG = `
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
    <defs>
      <style>
        .c{fill:#111;}
        .t{fill:#fff;font:700 42px Arial,Helvetica,sans-serif;}
      </style>
    </defs>
    <circle class="c" cx="50" cy="50" r="50"/>
    <text class="t" x="50" y="64" text-anchor="middle">TS</text>
  </svg>
`;

function mm(n){ return `${Number(n)}mm`; }

function clampByte(n){
  return Math.max(0, Math.min(255, Math.round(n)));
}

function rgbToHex(r, g, b){
  const toHex = (n) => clampByte(n).toString(16).padStart(2, "0");
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

function rgbToHsl(r, g, b){
  const rn = r / 255;
  const gn = g / 255;
  const bn = b / 255;
  const max = Math.max(rn, gn, bn);
  const min = Math.min(rn, gn, bn);
  const d = max - min;
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;

  if(d !== 0){
    s = d / (1 - Math.abs((2 * l) - 1));
    if(max === rn){
      h = ((gn - bn) / d) % 6;
    }else if(max === gn){
      h = ((bn - rn) / d) + 2;
    }else{
      h = ((rn - gn) / d) + 4;
    }
    h *= 60;
    if(h < 0){
      h += 360;
    }
  }

  return { h, s, l };
}

function hslToRgb(h, s, l){
  const c = (1 - Math.abs((2 * l) - 1)) * s;
  const hh = h / 60;
  const x = c * (1 - Math.abs((hh % 2) - 1));
  let r1 = 0;
  let g1 = 0;
  let b1 = 0;

  if(hh >= 0 && hh < 1){
    r1 = c; g1 = x; b1 = 0;
  }else if(hh < 2){
    r1 = x; g1 = c; b1 = 0;
  }else if(hh < 3){
    r1 = 0; g1 = c; b1 = x;
  }else if(hh < 4){
    r1 = 0; g1 = x; b1 = c;
  }else if(hh < 5){
    r1 = x; g1 = 0; b1 = c;
  }else{
    r1 = c; g1 = 0; b1 = x;
  }

  const m = l - (c / 2);
  return {
    r: clampByte((r1 + m) * 255),
    g: clampByte((g1 + m) * 255),
    b: clampByte((b1 + m) * 255)
  };
}

function extractLogoColor(imgEl){
  try{
    if(!imgEl || !imgEl.naturalWidth || !imgEl.naturalHeight){
      return null;
    }

    const canvas = document.createElement("canvas");
    const sampleSize = 28;
    canvas.width = sampleSize;
    canvas.height = sampleSize;
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    if(!ctx){
      return null;
    }
    ctx.drawImage(imgEl, 0, 0, sampleSize, sampleSize);
    const data = ctx.getImageData(0, 0, sampleSize, sampleSize).data;

    let rTotal = 0;
    let gTotal = 0;
    let bTotal = 0;
    let count = 0;

    for(let i = 0; i < data.length; i += 4){
      const a = data[i + 3];
      if(a < 120){
        continue;
      }
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      const luminance = (0.2126 * r) + (0.7152 * g) + (0.0722 * b);
      if(luminance > 246){
        continue;
      }

      rTotal += r;
      gTotal += g;
      bTotal += b;
      count += 1;
    }

    if(!count){
      return null;
    }

    return {
      r: clampByte(rTotal / count),
      g: clampByte(gTotal / count),
      b: clampByte(bTotal / count)
    };
  }catch(e){
    return null;
  }
}

function applyLogoAccentTheme(rgb){
  if(!rgb){
    return;
  }
  const root = document.documentElement;
  const hsl = rgbToHsl(rgb.r, rgb.g, rgb.b);
  const accent = hslToRgb(
    hsl.h,
    Math.max(0.45, Math.min(0.92, hsl.s + 0.08)),
    Math.max(0.35, Math.min(0.56, hsl.l))
  );
  const accentStrong = hslToRgb(
    hsl.h,
    Math.max(0.5, Math.min(0.95, hsl.s + 0.1)),
    Math.max(0.2, Math.min(0.42, hsl.l - 0.14))
  );

  root.style.setProperty("--accent-rgb", `${accent.r}, ${accent.g}, ${accent.b}`);
  root.style.setProperty("--accent", rgbToHex(accent.r, accent.g, accent.b));
  root.style.setProperty("--accent-strong", rgbToHex(accentStrong.r, accentStrong.g, accentStrong.b));
}

function initLogoAccentTheme(){
  const logo = document.querySelector(".headerLogo");
  if(!logo){
    return;
  }

  const updateTheme = () => {
    const rgb = extractLogoColor(logo);
    applyLogoAccentTheme(rgb);
  };

  if(logo.complete){
    updateTheme();
  }else{
    logo.addEventListener("load", updateTheme, { once: true });
  }
}

function applyTheme(theme){
  const normalizedTheme = theme === "dark" ? "dark" : "light";
  document.documentElement.setAttribute("data-theme", normalizedTheme);
  localStorage.setItem("theme", normalizedTheme);

  const toggleInput = document.getElementById("themeToggle");
  if(toggleInput){
    const isDark = normalizedTheme === "dark";
    toggleInput.checked = isDark;
    toggleInput.setAttribute("aria-checked", String(isDark));
  }
}

function initThemeToggle(){
  const savedTheme = localStorage.getItem("theme");
  const systemPrefersDark = window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;
  const initialTheme = savedTheme || (systemPrefersDark ? "dark" : "light");
  applyTheme(initialTheme);

  const toggleInput = document.getElementById("themeToggle");
  if(!toggleInput){
    return;
  }
  toggleInput.addEventListener("change", () => {
    const currentTheme = document.documentElement.getAttribute("data-theme");
    applyTheme(currentTheme === "dark" ? "light" : "dark");
  });
}

function parseImeis(raw){
  // Split by comma/newline; trim; keep only non-empty.
  return raw
    .split(/[\n,]+/g)
    .map(s => s.trim())
    .filter(Boolean);
}

function sanitizeImei(s){
  // IMEI usually 15 digits; keep digits only.
  const digits = (s || "").replace(/\D+/g, "");
  return digits;
}

function getPageDimensions(orientation){
  const isLandscape = orientation === "landscape";
  return {
    pageW: isLandscape ? 297 : 210,
    pageH: isLandscape ? 210 : 297
  };
}

function computeGridConfig(labelW, labelH, margin, gap, orientation){
  const { pageW, pageH } = getPageDimensions(orientation);
  const usableW = pageW - (2 * margin);
  const usableH = pageH - (2 * margin);

  const cols = Math.max(1, Math.floor((usableW + gap) / (labelW + gap)));
  const rows = Math.max(1, Math.floor((usableH + gap) / (labelH + gap)));
  const perPage = cols * rows;

  return { cols, rows, perPage, usableW, usableH };
}

function setCssVars({
  labelW,
  labelH,
  smallLabelW,
  smallLabelH,
  smallBoxW,
  smallBoxH,
  smallBorder,
  margin,
  gap,
  border,
  orientation,
  logo1Size,
  logo2Size,
  manufacturerTextScale,
  otherTextScale
}){
  const { pageW, pageH } = getPageDimensions(orientation);
  const baseScale = Math.min(labelW / 50, labelH / 30);
  const smallBaseScale = Math.min(smallLabelW / 40, smallLabelH / 22);
  // Keep label internals compact enough to avoid clipping on shorter labels.
  const labelScale = Math.max(0.35, Math.min(2.2, baseScale * 0.74));
  const smallScale = Math.max(0.4, Math.min(2.2, smallBaseScale));
  const mmScaled = (base) => mm((base * labelScale).toFixed(2));
  const mmSmallScaled = (base) => mm((base * smallScale).toFixed(2));
  const fontPx = Math.max(6.4, Math.min(14.5, 11.5 * labelScale));
  const smallFontPx = Math.max(6, Math.min(12, 8.5 * smallScale));
  const mfgScale = Math.max(0.6, Math.min(2, Number(manufacturerTextScale) || 1.3));
  const otherScale = Math.max(0.6, Math.min(2, Number(otherTextScale) || 1.2));
  const mfgFontPx = Math.max(7, Math.min(28, (fontPx + 2) * mfgScale));
  const otherFontPx = Math.max(6, Math.min(24, fontPx * otherScale));
  const otherFontSmallPx = Math.max(5, Math.min(22, (fontPx - 1) * otherScale));

  document.documentElement.style.setProperty("--page-w", mm(pageW));
  document.documentElement.style.setProperty("--page-h", mm(pageH));
  document.documentElement.style.setProperty("--label-w", mm(labelW));
  document.documentElement.style.setProperty("--label-h", mm(labelH));
  document.documentElement.style.setProperty("--small-label-w", mm(smallLabelW));
  document.documentElement.style.setProperty("--small-label-h", mm(smallLabelH));
  document.documentElement.style.setProperty("--small-box-w", mm(smallBoxW));
  document.documentElement.style.setProperty("--small-box-h", mm(smallBoxH));
  document.documentElement.style.setProperty("--page-margin", mm(margin));
  document.documentElement.style.setProperty("--gap", mm(gap));
  document.documentElement.style.setProperty("--border", mm(border));
  document.documentElement.style.setProperty("--font", `${fontPx.toFixed(2)}px`);
  document.documentElement.style.setProperty("--small-font", `${smallFontPx.toFixed(2)}px`);
  document.documentElement.style.setProperty("--mfg-font", `${mfgFontPx.toFixed(2)}px`);
  document.documentElement.style.setProperty("--other-font", `${otherFontPx.toFixed(2)}px`);
  document.documentElement.style.setProperty("--other-font-small", `${otherFontSmallPx.toFixed(2)}px`);
  document.documentElement.style.setProperty("--small-code-border", mm(smallBorder));
  document.documentElement.style.setProperty("--small-text-extra-h", mmSmallScaled(4));
  document.documentElement.style.setProperty("--combo-gap", mmScaled(1));
  document.documentElement.style.setProperty("--label-pad", mmScaled(2));
  document.documentElement.style.setProperty("--label-col-gap", mmScaled(2));
  document.documentElement.style.setProperty("--label-row-gap", mmScaled(1));
  document.documentElement.style.setProperty("--brand-gap", mmScaled(1.5));
  document.documentElement.style.setProperty("--logo-size", mmScaled(logo1Size));
  document.documentElement.style.setProperty("--qr-col-w", mmScaled(22));
  document.documentElement.style.setProperty("--qr-gap", mmScaled(0.8));
  document.documentElement.style.setProperty("--qr-pad", mmScaled(0.8));
  document.documentElement.style.setProperty("--qr-size", mmScaled(20));
  document.documentElement.style.setProperty("--meta-gap", mmScaled(0.8));
  document.documentElement.style.setProperty("--line-gap", mmScaled(1));
  document.documentElement.style.setProperty("--barcode-h", mmScaled(10));
  document.documentElement.style.setProperty("--barcode-gap", mmScaled(0.2));
  document.documentElement.style.setProperty("--install-gap", mmScaled(2));
  document.documentElement.style.setProperty("--install-pt", mmScaled(1));
  document.documentElement.style.setProperty("--blank-min", mmScaled(30));
  document.documentElement.style.setProperty("--corner-logo-size", mmScaled(logo2Size));
  document.documentElement.style.setProperty("--corner-logo-offset", mmScaled(1.5));
  document.documentElement.style.setProperty("--corner-logo-padding", mmScaled(0.2));

  return { labelScale, smallScale };
}

function applyPrintPageSize(orientation){
  const styleId = "dynamic-print-page-size";
  let styleEl = document.getElementById(styleId);
  if(!styleEl){
    styleEl = document.createElement("style");
    styleEl.id = styleId;
    document.head.appendChild(styleEl);
  }
  const pageSize = orientation === "landscape" ? "A4 landscape" : "A4 portrait";
  styleEl.textContent = `@media print{ @page{ size: ${pageSize}; margin: 0; } }`;
}

function renderFallbackLogo(logoContainer){
  logoContainer.innerHTML = BUILTIN_LOGO_SVG;
}

function getLogoFilePath(fileName){
  const safeFileName = (fileName || "").trim();
  if(!safeFileName){
    return "";
  }
  return `img/${safeFileName}`;
}

function attachLogo(logoContainer, logoFileName){
  const logoPath = getLogoFilePath(logoFileName);
  if(!logoPath){
    renderFallbackLogo(logoContainer);
    return;
  }

  const logoImg = document.createElement("img");
  logoImg.className = "logoImg";
  logoImg.alt = "Logo";
  logoImg.src = logoPath;
  logoImg.addEventListener("error", () => renderFallbackLogo(logoContainer), { once: true });
  logoContainer.appendChild(logoImg);
}

function populateLogoFileOptions(){
  const logoSelect = document.getElementById("logoFile");
  const logoSelect2 = document.getElementById("logoFile2");
  if(!logoSelect || !logoSelect2){
    return;
  }

  const manifestFiles = Array.isArray(window.LOGO_FILES) ? window.LOGO_FILES : [];
  logoSelect.innerHTML = "";
  logoSelect2.innerHTML = "";

  const defaultOption = document.createElement("option");
  defaultOption.value = "";
  defaultOption.textContent = "Default built-in logo";
  logoSelect.appendChild(defaultOption);

  const noneOption = document.createElement("option");
  noneOption.value = "";
  noneOption.textContent = "None";
  logoSelect2.appendChild(noneOption);

  const defaultOption2 = document.createElement("option");
  defaultOption2.value = "__DEFAULT__";
  defaultOption2.textContent = "Default built-in logo";
  logoSelect2.appendChild(defaultOption2);

  for(const fileName of manifestFiles){
    const name = String(fileName || "").trim();
    if(!name){
      continue;
    }
    const option = document.createElement("option");
    option.value = name;
    option.textContent = name;
    logoSelect.appendChild(option);

    const option2 = document.createElement("option");
    option2.value = name;
    option2.textContent = name;
    logoSelect2.appendChild(option2);
  }

  // Requested startup defaults
  if(manifestFiles.includes("logo.png")){
    logoSelect.value = "logo.png";
  }
  if(manifestFiles.includes("VLOCK_LOGO.png")){
    logoSelect2.value = "VLOCK_LOGO.png";
  }
}

function fitContainerContent(container, contentSelector){
  const content = container.querySelector(contentSelector);
  if(!content){
    return;
  }

  content.style.transform = "scale(1)";
  content.style.width = "100%";
  content.style.height = "100%";

  const availableW = container.clientWidth;
  const availableH = container.clientHeight;
  const requiredW = content.scrollWidth;
  const requiredH = content.scrollHeight;
  if(!availableW || !availableH || !requiredW || !requiredH){
    return;
  }

  const scaleX = availableW / requiredW;
  const scaleY = availableH / requiredH;
  const fitScale = Math.min(1, scaleX, scaleY) * 0.98;

  if(fitScale < 1){
    content.style.transform = `scale(${fitScale})`;
    content.style.width = `${100 / fitScale}%`;
    content.style.height = `${100 / fitScale}%`;
  }
}

function getElementVisibility(){
  const getChecked = (id, fallback = true) => {
    const el = document.getElementById(id);
    return el ? el.checked : fallback;
  };

  return {
    mainLogo: getChecked("showMainLogo"),
    topRightLogo: getChecked("showTopRightLogo"),
    manufacturer: getChecked("showManufacturer"),
    model: getChecked("showModel"),
    sn: getChecked("showSn"),
    website: getChecked("showWebsite"),
    madeInBd: getChecked("showMadeInBd"),
    qr: getChecked("showQr"),
    barcode: getChecked("showBarcode"),
    imeiTitle: getChecked("showImeiTitle"),
    imeiNumber: getChecked("showImeiNumber"),
    install: getChecked("showInstall"),
    warranty: getChecked("showWarranty")
  };
}

function makeLabelElement({ manufacturer, warranty, website, logoFileName, logoFileName2, modelName, imei, codeMode, labelScale, visibility }){
  const label = document.createElement("div");
  label.className = "label";
  const showBarcode = codeMode !== "qr" && visibility.barcode;
  const showQr = codeMode !== "barcode" && visibility.qr;
  const content = document.createElement("div");
  content.className = "labelContent";

  if(!showQr){
    label.classList.add("noQr");
  }

  // Brand row
  const brandRow = document.createElement("div");
  brandRow.className = "brandRow";

  if(visibility.mainLogo){
    const logo = document.createElement("div");
    logo.className = "logo";
    attachLogo(logo, logoFileName);
    brandRow.appendChild(logo);
  }

  if(visibility.manufacturer){
    const mfg = document.createElement("div");
    mfg.className = "mfg";
    mfg.textContent = manufacturer;
    brandRow.appendChild(mfg);
  }

  // QR
  if(visibility.topRightLogo && logoFileName2){
    const cornerLogo = document.createElement("div");
    cornerLogo.className = "labelCornerLogo";
    if(logoFileName2 === "__DEFAULT__"){
      renderFallbackLogo(cornerLogo);
    }else{
      attachLogo(cornerLogo, logoFileName2);
    }
    label.appendChild(cornerLogo);
  }

  const qrBox = document.createElement("div");
  qrBox.className = "qrBox";
  const qrTarget = document.createElement("div");
  qrBox.appendChild(qrTarget);

  // Meta lines
  const meta = document.createElement("div");
  meta.className = "meta";

  const serialNumber = getSerialNumber(modelName, imei);

  if(visibility.model){
    meta.appendChild(makeLine("Model:", modelName));
  }
  if(visibility.sn){
    meta.appendChild(makeLine("SN:", serialNumber));
  }
  if(visibility.website){
    meta.appendChild(makeLine("Website:", website));
  }
  if(visibility.madeInBd){
    meta.appendChild(makeLine("", "Made in Bangladesh", "madeInBd"));
  }

  // Barcode
  const barcodeRow = document.createElement("div");
  barcodeRow.className = "barcodeRow";

  if(visibility.imeiTitle){
    const barcodeTitle = document.createElement("div");
    barcodeTitle.className = "barcodeTitle";
    barcodeTitle.textContent = "IMEI";
    barcodeRow.appendChild(barcodeTitle);
  }

  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.classList.add("barcode");
  barcodeRow.appendChild(svg);

  if(visibility.imeiNumber){
    const imeiText = document.createElement("div");
    imeiText.className = "imeiText";
    imeiText.textContent = imei;
    barcodeRow.appendChild(imeiText);
  }

  // Bottom line (install/warranty)
  const install = document.createElement("div");
  install.className = "install";
  if(visibility.install){
    const left = document.createElement("div");
    left.className = "installItem";
    left.innerHTML = `<span class="k">Install:</span> <span class="blank">&nbsp;</span>`;
    install.appendChild(left);
  }
  if(visibility.warranty){
    const right = document.createElement("div");
    right.className = "warrantyItem";
    right.innerHTML = `<span class="k">Warranty:</span> <span class="v">${escapeHtml(warranty)}</span>`;
    install.appendChild(right);
  }
  if(!visibility.install && visibility.warranty){
    install.classList.add("warrantyOnly");
  }else if(visibility.install && !visibility.warranty){
    install.classList.add("installOnly");
  }

  if(brandRow.childNodes.length){
    content.appendChild(brandRow);
  }
  if(meta.childNodes.length){
    content.appendChild(meta);
  }
  if(showQr){
    content.appendChild(qrBox);
  }
  if(showBarcode){
    content.appendChild(barcodeRow);
  }
  if(visibility.install || visibility.warranty){
    content.appendChild(install);
  }
  label.appendChild(content);

  // Render QR and barcode after in DOM
  setTimeout(() => {
    if(showQr){
      const qrPx = Math.max(36, Math.round(76 * labelScale));
      // QR encodes IMEI (you can encode more fields if you want)
      new QRCode(qrTarget, {
        text: imei,
        width: qrPx, height: qrPx,
        correctLevel: QRCode.CorrectLevel.M
      });
    }

    if(showBarcode){
      const barcodePx = Math.max(14, Math.round(28 * labelScale));
      // Barcode (CODE128) for IMEI digits
      try{
        JsBarcode(svg, imei, {
          format: "CODE128",
          displayValue: false,
          margin: 0,
          height: barcodePx
        });
      }catch(e){
        // If invalid data, show fallback text
        svg.replaceWith(document.createTextNode("Barcode error"));
      }
    }

    requestAnimationFrame(() => {
      requestAnimationFrame(() => fitContainerContent(label, ".labelContent"));
    });
  }, 0);

  return label;
}

function makeSmallLabelElement({ imei, modelName, smallTextMode, smallCodeMode, smallLabelW, smallLabelH }){
  const smallLabel = document.createElement("div");
  smallLabel.className = "smallLabel";

  const content = document.createElement("div");
  content.className = "smallLabelContent";

  const codeBlock = document.createElement("div");
  codeBlock.className = "smallCodeBlock";

  const codeWrap = document.createElement("div");
  codeWrap.className = "smallCodeWrap";
  codeBlock.appendChild(codeWrap);

  const textValue = smallTextMode === "sn"
    ? getSerialNumber(modelName, imei)
    : imei;

  const text = document.createElement("div");
  text.className = "smallCodeText";
  text.textContent = textValue;

  content.appendChild(codeBlock);
  content.appendChild(text);
  smallLabel.appendChild(content);

  setTimeout(() => {
    const wrapRect = codeWrap.getBoundingClientRect();
    const wrapW = Math.max(1, wrapRect.width);
    const wrapH = Math.max(1, wrapRect.height);

    if(smallCodeMode === "qr"){
      const qrSize = Math.max(12, Math.floor(Math.min(wrapW, wrapH)));
      const qrTarget = document.createElement("div");
      qrTarget.className = "smallQr";
      codeWrap.appendChild(qrTarget);
      new QRCode(qrTarget, {
        text: textValue,
        width: qrSize,
        height: qrSize,
        correctLevel: QRCode.CorrectLevel.M
      });
    }else{
      const barcodeHeight = Math.max(8, Math.floor(wrapH));
      const estimatedModules = Math.max(60, textValue.length * 12);
      const barModuleWidth = Math.max(0.5, wrapW / estimatedModules);
      const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
      svg.classList.add("smallBarcode");
      codeWrap.appendChild(svg);
      try{
        JsBarcode(svg, textValue, {
          format: "CODE128",
          displayValue: false,
          margin: 0,
          width: barModuleWidth,
          height: barcodeHeight
        });
      }catch(e){
        svg.replaceWith(document.createTextNode("Code error"));
      }
    }
  }, 0);

  return smallLabel;
}

function makeLine(k, v, extraClass = ""){
  const line = document.createElement("div");
  line.className = "line";
  if(extraClass){
    line.classList.add(extraClass);
  }
  const kk = document.createElement("span");
  kk.className = "k";
  kk.textContent = k;
  const vv = document.createElement("span");
  vv.className = "v";
  vv.textContent = v;
  line.appendChild(kk);
  line.appendChild(vv);
  return line;
}

function getModelShortCode(modelName){
  const map = {
    "VLock": "VL",
    "VLock Pro": "VLPRO",
    "VLock Ultra": "VLULTRA"
  };
  return map[modelName] || "VL";
}

function getSerialNumber(modelName, imei){
  const serialDigits = imei.slice(-8);
  return `${getModelShortCode(modelName)}${serialDigits}`;
}

function escapeHtml(s){
  return String(s).replace(/[&<>"']/g, c => ({
    "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"
  }[c]));
}

function generate(){
  const manufacturer = document.getElementById("manufacturer").value.trim() || "Manufacturer";
  const warranty = document.getElementById("warranty").value.trim() || "6 Months";
  const website = document.getElementById("website").value.trim() || "www.techshieldbd.com";
  const labelMode = document.getElementById("labelMode").value || "big";
  const logoFileName = document.getElementById("logoFile").value || "";
  const logoFileName2 = document.getElementById("logoFile2").value || "";
  const codeMode = document.getElementById("codeMode").value || "barcode";
  const smallTextMode = document.getElementById("smallTextMode").value || "imei";
  const smallCodeMode = document.getElementById("smallCodeMode").value || "barcode";
  const orientation = document.getElementById("pageOrientation").value || "portrait";
  const modelName = document.getElementById("modelName").value.trim() || "VLock Pro";
  const visibility = getElementVisibility();

  const labelW = Number(document.getElementById("labelW").value) || 50;
  const labelH = Number(document.getElementById("labelH").value) || 30;
  const smallLabelW = Number(document.getElementById("smallLabelW").value) || 40;
  const smallLabelH = Number(document.getElementById("smallLabelH").value) || 22;
  const smallBoxW = Number(document.getElementById("smallBoxW").value) || 42;
  const smallBoxH = Number(document.getElementById("smallBoxH").value) || 24;
  const smallBorder = Number(document.getElementById("smallBorder").value) || 0.3;
  const margin = Number(document.getElementById("pageMargin").value) || 8;
  const gap = Number(document.getElementById("gap").value) || 3.5;
  const border = Number(document.getElementById("border").value) || 0.6;
  const logo1Size = Number(document.getElementById("logo1Size").value) || 12;
  const logo2Size = Number(document.getElementById("logo2Size").value) || 25;
  const manufacturerTextScale = Number(document.getElementById("manufacturerTextScale").value) || 1.3;
  const otherTextScale = Number(document.getElementById("otherTextScale").value) || 1.2;

  const imeiRaw = document.getElementById("imeis").value;
  const imeis = parseImeis(imeiRaw).map(sanitizeImei).filter(Boolean);

  const preview = document.getElementById("preview");
  preview.innerHTML = "";

  if(imeis.length === 0){
    preview.textContent = "No IMEIs found. Please input comma/newline separated IMEIs.";
    return;
  }

  const { labelScale } = setCssVars({
    labelW,
    labelH,
    smallLabelW,
    smallLabelH,
    smallBoxW,
    smallBoxH,
    smallBorder,
    margin,
    gap,
    border,
    orientation,
    logo1Size,
    logo2Size,
    manufacturerTextScale,
    otherTextScale
  });
  applyPrintPageSize(orientation);

  const comboGap = Math.max(0.5, Math.min(3, labelScale));
  const smallTextExtra = 4;
  let itemW = labelW;
  let itemH = labelH;
  if(labelMode === "small"){
    itemW = smallBoxW;
    itemH = smallBoxH + smallTextExtra;
  }else if(labelMode === "combo"){
    itemW = Math.max(labelW, smallBoxW);
    itemH = labelH + comboGap + smallBoxH + smallTextExtra;
  }

  const { cols, perPage } = computeGridConfig(itemW, itemH, margin, gap, orientation);

  // Create sheets (pages)
  let index = 0;
  while(index < imeis.length){
    const sheet = document.createElement("div");
    sheet.className = "sheet";

    const grid = document.createElement("div");
    grid.className = "grid";
    grid.style.gridTemplateColumns = `repeat(${cols}, ${mm(itemW)})`;

    const end = Math.min(index + perPage, imeis.length);
    for(let i=index; i<end; i++){
      const imei = imeis[i];
      if(labelMode === "small"){
        const smallLabel = makeSmallLabelElement({
          imei,
          modelName,
          smallTextMode,
          smallCodeMode,
          smallLabelW,
          smallLabelH
        });
        grid.appendChild(smallLabel);
      }else if(labelMode === "combo"){
        const comboItem = document.createElement("div");
        comboItem.className = "comboItem";
        const bigLabel = makeLabelElement({
          manufacturer,
          warranty,
          website,
          logoFileName,
          logoFileName2,
          modelName,
          imei,
          codeMode,
          labelScale,
          visibility
        });
        const smallLabel = makeSmallLabelElement({
          imei,
          modelName,
          smallTextMode,
          smallCodeMode,
          smallLabelW,
          smallLabelH
        });
        comboItem.appendChild(bigLabel);
        comboItem.appendChild(smallLabel);
        grid.appendChild(comboItem);
      }else{
        const label = makeLabelElement({
          manufacturer,
          warranty,
          website,
          logoFileName,
          logoFileName2,
          modelName,
          imei,
          codeMode,
          labelScale,
          visibility
        });
        grid.appendChild(label);
      }
    }

    sheet.appendChild(grid);
    preview.appendChild(sheet);
    index = end;
  }
}

document.getElementById("generateBtn").addEventListener("click", generate);
document.getElementById("printBtn").addEventListener("click", () => window.print());
document.getElementById("clearBtn").addEventListener("click", () => {
  window.location.reload();
});
document.querySelectorAll(".elementToggle").forEach((el) => {
  el.addEventListener("change", generate);
});

populateLogoFileOptions();
initLogoAccentTheme();
initThemeToggle();

// Auto-generate once on load
generate();
