const cardsEl = document.querySelector("#cards");
const statusEl = document.querySelector("#statusArea");
const searchInput = document.querySelector("#searchInput");
const clearButton = document.querySelector("#clearButton");
const resultCount = document.querySelector("#resultCount");
const installButton = document.querySelector("#installButton");

let allSupplements = [];
let installPromptEvent = null;

const fields = [
  ["主要成分", "ingredients"],
  ["每粒含量", "amountPerCapsule"],
  ["功能", "function"],
  ["服用方法", "directions"],
  ["注意事项", "warnings"],
];

function text(value) {
  if (Array.isArray(value)) return value.filter(Boolean).join("；");
  return value || "未填写";
}

function makeSearchText(item) {
  return [
    item.chineseName,
    item.germanName,
    item.brand,
    text(item.ingredients),
  ]
    .join(" ")
    .toLocaleLowerCase("zh-CN");
}

function createInfoBlock(title, value) {
  const block = document.createElement("div");
  block.className = "info-block";

  const label = document.createElement("span");
  label.className = "info-title";
  label.textContent = title;

  const body = document.createElement("span");
  body.className = "info-text";
  body.textContent = text(value);

  block.append(label, body);
  return block;
}

function createCard(item, index) {
  const card = document.createElement("article");
  card.className = "supplement-card";

  const photoWrap = document.createElement("div");
  photoWrap.className = "photo-wrap";

  const photo = document.createElement("img");
  photo.alt = `${text(item.chineseName)} 照片`;
  photo.loading = "lazy";
  photo.src = item.photo || "icons/placeholder.svg";
  photoWrap.append(photo);

  const body = document.createElement("div");
  body.className = "card-body";

  const names = document.createElement("div");
  names.className = "names";

  const cn = document.createElement("h2");
  cn.className = "cn-name";
  cn.textContent = text(item.chineseName);

  const de = document.createElement("p");
  de.className = "de-name";
  de.textContent = text(item.germanName);

  names.append(cn, de);

  const brand = document.createElement("div");
  brand.className = "brand";
  brand.textContent = `品牌：${text(item.brand)}`;

  const important = document.createElement("div");
  important.className = "important";
  important.append(
    createInfoBlock("每粒含量", item.amountPerCapsule),
    createInfoBlock("服用方法", item.directions)
  );

  const button = document.createElement("button");
  button.className = "detail-toggle";
  button.type = "button";
  button.textContent = "查看全部信息";
  button.setAttribute("aria-expanded", "false");
  button.setAttribute("aria-controls", `details-${index}`);

  const details = document.createElement("div");
  details.id = `details-${index}`;
  details.className = "details";

  fields.forEach(([label, key]) => {
    const wrap = document.createElement("div");
    if (key === "warnings") wrap.className = "notice";
    wrap.append(createInfoBlock(label, item[key]));
    details.append(wrap);
  });

  button.addEventListener("click", () => {
    const isOpen = details.classList.toggle("is-open");
    button.textContent = isOpen ? "收起信息" : "查看全部信息";
    button.setAttribute("aria-expanded", String(isOpen));
  });

  body.append(names, brand, important, button, details);
  card.append(photoWrap, body);
  return card;
}

function render(items) {
  cardsEl.replaceChildren();
  statusEl.replaceChildren();

  if (!allSupplements.length) {
    resultCount.textContent = "";
    const empty = document.createElement("div");
    empty.className = "status-card";
    empty.textContent = "现在还没有补剂数据。请在 supplements.json 里添加真实补剂信息。";
    statusEl.append(empty);
    return;
  }

  resultCount.textContent = `共找到 ${items.length} 个补剂`;

  if (!items.length) {
    const empty = document.createElement("div");
    empty.className = "status-card";
    empty.textContent = "没有找到匹配的补剂。可以换一个中文名、德文名或成分再试。";
    statusEl.append(empty);
    return;
  }

  const fragment = document.createDocumentFragment();
  items.forEach((item, index) => fragment.append(createCard(item, index)));
  cardsEl.append(fragment);
}

function applySearch() {
  const query = searchInput.value.trim().toLocaleLowerCase("zh-CN");
  if (!query) {
    render(allSupplements);
    return;
  }
  render(allSupplements.filter((item) => makeSearchText(item).includes(query)));
}

async function loadSupplements() {
  if (window.location.protocol === "file:") {
    const warning = document.createElement("div");
    warning.className = "status-card";
    warning.textContent =
      "现在是用本地文件方式打开网页，浏览器通常会拦截读取 supplements.json，所以这里可能看不到补剂内容。请部署成 https 链接，或用本地预览服务打开。";
    statusEl.replaceChildren(warning);
    resultCount.textContent = "";
    return;
  }

  try {
    const response = await fetch("supplements.json", { cache: "no-store" });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const data = await response.json();
    allSupplements = Array.isArray(data) ? data : data.supplements || [];
    render(allSupplements);
  } catch (error) {
    const warning = document.createElement("div");
    warning.className = "status-card";
    warning.textContent = "无法读取 supplements.json。请检查文件是否存在、格式是否正确。";
    statusEl.replaceChildren(warning);
    resultCount.textContent = "";
  }
}

searchInput.addEventListener("input", applySearch);
clearButton.addEventListener("click", () => {
  searchInput.value = "";
  searchInput.focus();
  render(allSupplements);
});

window.addEventListener("beforeinstallprompt", (event) => {
  event.preventDefault();
  installPromptEvent = event;
  installButton.hidden = false;
});

installButton.addEventListener("click", async () => {
  if (!installPromptEvent) return;
  installPromptEvent.prompt();
  await installPromptEvent.userChoice;
  installPromptEvent = null;
  installButton.hidden = true;
});

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("sw.js");
  });
}

loadSupplements();
