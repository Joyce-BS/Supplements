const cardsEl = document.querySelector("#cards");
const statusEl = document.querySelector("#statusArea");
const searchInput = document.querySelector("#searchInput");
const clearButton = document.querySelector("#clearButton");
const resultCount = document.querySelector("#resultCount");
const installButton = document.querySelector("#installButton");
const elementsList = document.querySelector("#elementsList");

let allSupplements = [];
let installPromptEvent = null;

const detailFields = [
  ["产品名称", "names"],
  ["品牌", "brand"],
  ["功能", "function"],
  ["使用方法", "directions"],
  ["含量", "amountPerCapsule"],
  ["主要成分", "ingredients"],
  ["注意事项", "warnings"],
];

const elements = [
  {
    name: "维生素 D",
    note: "帮助身体吸收钙，是骨骼和牙齿的重要帮手。肌肉活动、神经传递和免疫系统也需要它。年纪大、晒太阳少的人，常会特别关注这一项。"
  },
  {
    name: "钙",
    note: "是骨骼和牙齿的主要材料，也参与肌肉收缩、神经传递和正常心跳。它不是只和骨头有关，身体很多日常动作都离不开钙。"
  },
  {
    name: "镁",
    note: "参与肌肉和神经功能，也参与能量产生、血糖和血压调节，以及骨骼健康。很多骨骼和肌肉类产品会把镁和钙、维生素 D 放在一起。"
  },
  {
    name: "锌",
    note: "支持免疫系统、伤口愈合、味觉嗅觉和细胞生长；也参与视力相关的维生素 A 代谢。含锌产品较多时要留意总量，不要多个补剂叠加太多。"
  },
  {
    name: "维生素 C",
    note: "帮助身体制造胶原蛋白，参与伤口愈合；也是抗氧化营养素，并帮助植物性食物中的铁吸收。它常出现在免疫、细胞保护和护眼配方里。"
  },
  {
    name: "维生素 A",
    note: "对正常视力很重要，也支持免疫系统、皮肤黏膜和身体生长发育。很多护眼产品会强调维生素 A，因为它和暗光下看东西、眼部健康有关。"
  },
  {
    name: "维生素 E",
    note: "主要作用是抗氧化，帮助保护细胞免受氧化损伤，也参与免疫功能。鱼油、护眼和 Q10 类产品里经常能看到它。"
  },
  {
    name: "B 族维生素",
    note: "帮助身体把食物转成能量，也参与红细胞形成。不同 B 族维生素还分别参与神经、皮肤和代谢功能。包装上常见的 B1、B2、B6、B12 属于这一类。"
  },
  {
    name: "Omega-3（EPA/DHA）",
    note: "EPA 和 DHA 是鱼油中常见的 Omega-3 脂肪酸。它们和心脏、血管、大脑、眼睛等功能有关。很多鱼油产品会特别标出 EPA 和 DHA 的具体含量。"
  },
  {
    name: "叶黄素 / 玉米黄质",
    note: "这两种类胡萝卜素集中在眼底黄斑区域。大型眼科研究把它们用于特定黄斑病变配方中，主要关注视网膜和黄斑健康。很多护眼补剂会把它们和维生素 A、锌一起搭配。"
  },
  {
    name: "维生素 K",
    note: "参与正常凝血，也和骨骼健康有关。补钙产品里常见的是 K2。正在服用华法林等抗凝药的人，维生素 K 摄入要保持稳定并问医生。"
  },
  {
    name: "硒",
    note: "参与抗氧化防护、甲状腺激素代谢和免疫功能。需要量不高，过量也可能有害。它常和维生素 C、维生素 E 一起出现在细胞保护相关配方里。"
  },
  {
    name: "辅酶 Q10",
    note: "身体细胞本来就有辅酶 Q10，参与细胞能量产生，也有抗氧化作用。包装常把它和“能量”“表现”“细胞”放在一起讲。补充剂的实际用途要看个人情况。"
  },
  {
    name: "透明质酸钠",
    note: "常用于人工泪液类眼药水，主要作用是保湿润滑，让眼表停留更多水分，缓解干涩摩擦感。它不是维生素，而是眼药水里常见的保湿成分。"
  }
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

function amountRows(value) {
  return text(value)
    .replace(/^每日\s*1\s*[粒片]\s*含/, "")
    .replace(/^每粒含/, "")
    .replace(/^每\s*1\s*ml\s*含/, "每 1 ml：")
    .split(/[；。]/)
    .flatMap((part) => part.split("、"))
    .map((part) => part.trim())
    .filter(Boolean);
}

function splitAmountRow(rowText) {
  const colonParts = rowText.split(/[：:]/);
  if (colonParts.length > 1) {
    return [colonParts[0].trim(), colonParts.slice(1).join("：").trim()];
  }

  const match = rowText.match(/^(.+?)\s+((?:约\s*)?\d.*)$/);
  if (match) return [match[1].trim(), match[2].trim()];

  return [rowText, ""];
}

function createAmountBlock(title, value) {
  const block = document.createElement("div");
  block.className = "info-block";

  const label = document.createElement("span");
  label.className = "info-title";
  label.textContent = title;

  const table = document.createElement("table");
  table.className = "amount-table";

  const thead = document.createElement("thead");
  const headRow = document.createElement("tr");
  ["项目", "含量或说明"].forEach((heading) => {
    const th = document.createElement("th");
    th.textContent = heading;
    headRow.append(th);
  });
  thead.append(headRow);

  const tbody = document.createElement("tbody");
  amountRows(value).forEach((rowText) => {
    const row = document.createElement("tr");
    const [name, amount] = splitAmountRow(rowText);
    const nameCell = document.createElement("td");
    nameCell.textContent = name;
    const amountCell = document.createElement("td");
    amountCell.textContent = amount || "见说明";
    row.append(nameCell, amountCell);
    tbody.append(row);
  });

  table.append(thead, tbody);
  block.append(label, table);
  return block;
}

function createDetailBlock(label, key, item) {
  if (key === "amountPerCapsule") return createAmountBlock(label, item[key]);
  if (key === "names") return createInfoBlock(label, `${text(item.chineseName)} / ${text(item.germanName)}`);
  return createInfoBlock(label, item[key]);
}

function renderElements() {
  if (!elementsList) return;
  const fragment = document.createDocumentFragment();

  elements.forEach((element) => {
    const item = document.createElement("article");
    item.className = "element-item";

    const button = document.createElement("button");
    button.type = "button";
    button.className = "element-toggle";
    button.textContent = element.name;
    button.setAttribute("aria-expanded", "false");

    const body = document.createElement("p");
    body.className = "element-note";
    body.textContent = element.note;

    button.addEventListener("click", () => {
      const isOpen = item.classList.toggle("is-open");
      button.setAttribute("aria-expanded", String(isOpen));
    });

    item.append(button, body);
    fragment.append(item);
  });

  elementsList.replaceChildren(fragment);
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
  names.className = "names card-title-only";

  const cn = document.createElement("h2");
  cn.className = "cn-name";
  cn.textContent = text(item.chineseName);

  names.append(cn);

  const button = document.createElement("button");
  button.className = "detail-toggle";
  button.type = "button";
  button.textContent = "细看说明";
  button.setAttribute("aria-expanded", "false");
  button.setAttribute("aria-controls", `details-${index}`);

  const details = document.createElement("div");
  details.id = `details-${index}`;
  details.className = "details";

  detailFields.forEach(([label, key]) => {
    const wrap = document.createElement("div");
    if (key === "warnings") wrap.className = "notice";
    wrap.append(createDetailBlock(label, key, item));
    details.append(wrap);
  });

  button.addEventListener("click", () => {
    const isOpen = details.classList.toggle("is-open");
    button.textContent = isOpen ? "收起说明" : "细看说明";
    button.setAttribute("aria-expanded", String(isOpen));
  });

  body.append(names, button, details);
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
    empty.textContent = "现在还没有清单数据。请在 supplements.json 里添加真实信息。";
    statusEl.append(empty);
    return;
  }

  resultCount.textContent = `共找到 ${items.length} 个项目`;

  if (!items.length) {
    const empty = document.createElement("div");
    empty.className = "status-card";
    empty.textContent = "没有找到匹配项目。可以换一个中文名、德文名或成分再试。";
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
renderElements();
