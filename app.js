let currentUser = null;
let guides = [];
let currentEditingId = null;
let weekChart = null;
let monthChart = null;


// ===============================
// 页面加载
// ===============================

window.onload = async function () {

  showToday();
  setDefaultDate();

  await loadGuides();

  bindEvents();
  checkAutoLogin();

  calculate();
};


// ===============================
// 日期工具
// ===============================

function formatDate(date) {

  const year = date.getFullYear();

  const month = String(
    date.getMonth() + 1
  ).padStart(2, "0");

  const day = String(
    date.getDate()
  ).padStart(2, "0");

  return `${year}-${month}-${day}`;
}


// ===============================
// 今日日期显示
// ===============================

function showToday() {

  const today = new Date();

  document
    .getElementById("today")
    .innerText =
    today.getFullYear() +
    "年" +
    (today.getMonth() + 1) +
    "月" +
    today.getDate() +
    "日";
}


// ===============================
// 默认记录日期
// ===============================

function setDefaultDate() {

  document
    .getElementById("recordDate")
    .value = formatDate(new Date());
}


// ===============================
// 自动登录
// ===============================

function checkAutoLogin() {

  const saved = localStorage.getItem("museumUser");

  if (!saved) {
    return;
  }

  try {
    currentUser = JSON.parse(saved);
  } catch (error) {
    localStorage.removeItem("museumUser");
    return;
  }

  document
    .getElementById("loginCard")
    .style.display = "none";

  document
    .getElementById("mainPage")
    .style.display = "block";

  loadStatistics();
}


// ===============================
// 登录
// ===============================

async function login() {

  const username =
    document.getElementById("username").value.trim();

  const password =
    document.getElementById("password").value;

  const loginMessage =
    document.getElementById("loginMessage");

  loginMessage.innerText = "";

  if (!username || !password) {
    loginMessage.innerText = "请输入账号和密码";
    return;
  }

  const { data, error } = await db
    .from("guides")
    .select("*")
    .eq("username", username)
    .eq("password", password)
    .single();

  if (error || !data) {
    loginMessage.innerText = "账号或密码错误";
    return;
  }

  currentUser = data;

  localStorage.setItem(
    "museumUser",
    JSON.stringify(data)
  );

  document
    .getElementById("loginCard")
    .style.display = "none";

  document
    .getElementById("mainPage")
    .style.display = "block";

  loadStatistics();
}


// ===============================
// 获取讲解员
// ===============================

async function loadGuides() {

  const { data, error } = await db
    .from("guides")
    .select("*");

  if (error) {
    console.log(error);
    alert("讲解员名单加载失败：" + error.message);
    return;
  }

  guides = data || [];

  renderGuideCheckbox();
}


// ===============================
// 显示值班人员
// ===============================

function renderGuideCheckbox() {

  const box =
    document.getElementById("guideCheckboxes");

  box.innerHTML = "";

  guides.forEach(function (guide) {

    const label = document.createElement("label");

    const input = document.createElement("input");

    input.type = "checkbox";
    input.className = "dutyGuide";
    input.value = guide.name;

    input.addEventListener("change", calculate);

    label.appendChild(input);

    label.appendChild(
      document.createTextNode(" " + guide.name)
    );

    box.appendChild(label);
    box.appendChild(document.createElement("br"));
  });
}


// ===============================
// 事件绑定
// ===============================

function bindEvents() {

  document.getElementById("loginBtn").onclick = login;

  document.getElementById("addSession").onclick = addSession;

  document.getElementById("saveBtn").onclick = saveRecord;

  document.getElementById("historyBtn").onclick = loadHistory;

  document.getElementById("newBtn").onclick = newToday;

  document.getElementById("logoutBtn").onclick = logout;

  document
    .getElementById("sessionList")
    .addEventListener("input", calculate);

  document
    .getElementById("sessionList")
    .addEventListener("change", calculate);
}


// ===============================
// 自动计算人数、收入、提成
// ===============================

function calculate() {

  let count = 0;

  document
    .querySelectorAll(".sessionPeople")
    .forEach(function (input) {

      count += Number(input.value) || 0;
    });

  const income = count * 45;

  const commission = count * 1.8;

  document
    .getElementById("todayPeople")
    .innerText = count;

  document
    .getElementById("income")
    .innerText = income.toFixed(2);

  document
    .getElementById("commission")
    .innerText = commission.toFixed(2);

  calculateShare();

  generateDailySummary();
}


// ===============================
// 提成分配
// ===============================

function calculateShare() {

  const checked = [];

  document
    .querySelectorAll(".dutyGuide")
    .forEach(function (item) {

      if (item.checked) {
        checked.push(item.value);
      }
    });

  const total = Number(
    document
      .getElementById("commission")
      .innerText
  ) || 0;

  let html = "";

  guides.forEach(function (guide) {

    let money = 0;

    if (
      checked.includes(guide.name) &&
      checked.length > 0
    ) {
      money = total / checked.length;
    }

    html += `
      <p>
        ${guide.name}：
        ${money.toFixed(2)} 元
      </p>
    `;
  });

  document
    .getElementById("summary")
    .innerHTML = html;
}


// ===============================
// 添加讲解场次
// ===============================

function addSession() {

  const div = document.createElement("div");

  div.className = "session";

  const guideSelect = document.createElement("select");

  guideSelect.className = "sessionGuide";

  guides.forEach(function (guide) {

    const option = document.createElement("option");

    option.value = guide.name;
    option.innerText = guide.name;

    guideSelect.appendChild(option);
  });

  const timeInput = document.createElement("input");

  timeInput.className = "sessionTime";
  timeInput.type = "time";
  timeInput.placeholder = "时间";

  const peopleInput = document.createElement("input");

  peopleInput.className = "sessionPeople";
  peopleInput.type = "number";
  peopleInput.min = "0";
  peopleInput.placeholder = "游客人数";

  const deleteButton = document.createElement("button");

  deleteButton.type = "button";
  deleteButton.innerText = "删除";

  deleteButton.onclick = function () {
    div.remove();
    calculate();
  };

  div.appendChild(guideSelect);
  div.appendChild(timeInput);
  div.appendChild(peopleInput);
  div.appendChild(deleteButton);

  document
    .getElementById("sessionList")
    .appendChild(div);

  calculate();
}


// ===============================
// 获取讲解场次
// ===============================

function getSessions() {

  const sessions = [];

  document
    .querySelectorAll(".session")
    .forEach(function (row) {

      const guideElement =
        row.querySelector(".sessionGuide");

      const timeElement =
        row.querySelector(".sessionTime");

      const peopleElement =
        row.querySelector(".sessionPeople");

      sessions.push({
        guide: guideElement ? guideElement.value : "",
        time: timeElement ? timeElement.value : "",
        people: peopleElement
          ? Number(peopleElement.value) || 0
          : 0
      });
    });

  return sessions;
}


// ===============================
// 当日讲解汇总（老板查看）
// ===============================

function generateDailySummary() {

  const body =
    document.getElementById("dailySummaryBody");

  const totalPeopleElement =
    document.getElementById("summaryTotalPeople");

  const totalIncomeElement =
    document.getElementById("summaryTotalIncome");

  if (
    !body ||
    !totalPeopleElement ||
    !totalIncomeElement
  ) {
    return;
  }

  const sessions = getSessions();

  let totalPeople = 0;
  let totalIncome = 0;

  if (!sessions.length) {

    body.innerHTML = `
      <tr>
        <td colspan="4">暂无讲解记录</td>
      </tr>
    `;

    totalPeopleElement.innerText = "0人";
    totalIncomeElement.innerText = "0元";

    return;
  }

  let html = "";

  sessions.forEach(function (session) {

    const people = Number(session.people) || 0;

    const income = people * 45;

    totalPeople += people;
    totalIncome += income;

    html += `
      <tr>
        <td>${session.time || "-"}</td>
        <td>${session.guide || "-"}</td>
        <td>${people}人</td>
        <td>${income.toFixed(2)}元</td>
      </tr>
    `;
  });

  body.innerHTML = html;

  totalPeopleElement.innerText =
    totalPeople + "人";

  totalIncomeElement.innerText =
    totalIncome.toFixed(2) + "元";
}


// ===============================
// 保存记录
// ===============================

async function saveRecord() {

  if (!currentUser) {
    alert("请先登录");
    return;
  }

  const date =
    document.getElementById("recordDate").value;

  if (!date) {
    alert("请选择记录日期");
    return;
  }

  const sessions = getSessions();

  if (!sessions.length) {
    alert("请至少添加一场讲解记录");
    return;
  }

  const duty = [];

  document
    .querySelectorAll(".dutyGuide")
    .forEach(function (item) {

      if (item.checked) {
        duty.push(item.value);
      }
    });

  const data = {
    date: date,

    ticket_count: Number(
      document
        .getElementById("todayPeople")
        .innerText
    ) || 0,

    income: Number(
      document
        .getElementById("income")
        .innerText
    ) || 0,

    commission: Number(
      document
        .getElementById("commission")
        .innerText
    ) || 0,

    duty_guides: duty,

    sessions: sessions,

    created_by: currentUser.name
  };

  let result;

  if (currentEditingId) {

    result = await db
      .from("daily_records")
      .update(data)
      .eq("id", currentEditingId);

  } else {

    result = await db
      .from("daily_records")
      .insert(data);
  }

  if (result.error) {
    alert("保存失败：" + result.error.message);
    console.log(result.error);
    return;
  }

  alert(
    currentEditingId
      ? "修改成功！"
      : "保存成功！"
  );

  currentEditingId = null;

  generateDailySummary();

  loadStatistics();

  if (currentUser.name === "李林亚") {
    showLinyaGift();
  }
}


// ===============================
// 历史记录
// ===============================

async function loadHistory() {

  const { data, error } = await db
    .from("daily_records")
    .select("*")
    .order("date", {
      ascending: false
    });

  if (error) {
    alert("历史记录加载失败：" + error.message);
    console.log(error);
    return;
  }

  const panel =
    document.getElementById("historyPanel");

  panel.innerHTML = "";

  if (!data || !data.length) {
    panel.innerHTML = "<p>暂无历史记录</p>";
    return;
  }

  data.forEach(function (record) {

    const item = document.createElement("div");

    item.className = "history-item";

    item.innerHTML = `
      <p>📅 日期：${record.date}</p>
      <p>👥 接待人数：${record.ticket_count}人</p>
      <p>💰 收入：${Number(record.income || 0).toFixed(2)}元</p>
    `;

    const editButton =
      document.createElement("button");

    editButton.type = "button";
    editButton.innerText = "查看修改";

    editButton.onclick = function () {
      loadRecord(record);
    };

    const deleteButton =
      document.createElement("button");

    deleteButton.type = "button";
    deleteButton.innerText = "删除";

    deleteButton.onclick = function () {
      deleteRecord(record.id);
    };

    item.appendChild(editButton);
    item.appendChild(deleteButton);

    panel.appendChild(item);
  });
}


// ===============================
// 加载单条记录进行修改
// ===============================

function loadRecord(record) {

  currentEditingId = record.id;

  document
    .getElementById("recordDate")
    .value = record.date || formatDate(new Date());

  const sessionList =
    document.getElementById("sessionList");

  sessionList.innerHTML = "";

  const sessions = Array.isArray(record.sessions)
    ? record.sessions
    : [];

  sessions.forEach(function (session) {
    addSessionFromData(session);
  });

  const dutyGuides = Array.isArray(record.duty_guides)
    ? record.duty_guides
    : [];

  document
    .querySelectorAll(".dutyGuide")
    .forEach(function (item) {

      item.checked =
        dutyGuides.includes(item.value);
    });

  calculate();

  window.scrollTo({
    top: 0,
    behavior: "smooth"
  });

  alert("已加载记录，可以修改后保存");
}


// ===============================
// 恢复历史讲解场次
// ===============================

function addSessionFromData(session) {

  const div = document.createElement("div");

  div.className = "session";

  const guideSelect = document.createElement("select");

  guideSelect.className = "sessionGuide";

  guides.forEach(function (guide) {

    const option = document.createElement("option");

    option.value = guide.name;
    option.innerText = guide.name;

    if (guide.name === session.guide) {
      option.selected = true;
    }

    guideSelect.appendChild(option);
  });

  const timeInput = document.createElement("input");

  timeInput.className = "sessionTime";
  timeInput.type = "time";
  timeInput.value = session.time || "";

  const peopleInput = document.createElement("input");

  peopleInput.className = "sessionPeople";
  peopleInput.type = "number";
  peopleInput.min = "0";
  peopleInput.value = Number(session.people) || 0;

  const deleteButton = document.createElement("button");

  deleteButton.type = "button";
  deleteButton.innerText = "删除";

  deleteButton.onclick = function () {
    div.remove();
    calculate();
  };

  div.appendChild(guideSelect);
  div.appendChild(timeInput);
  div.appendChild(peopleInput);
  div.appendChild(deleteButton);

  document
    .getElementById("sessionList")
    .appendChild(div);
}


// ===============================
// 删除记录
// ===============================

async function deleteRecord(id) {

  const ok = confirm("确定删除这条记录吗？");

  if (!ok) {
    return;
  }

  const { error } = await db
    .from("daily_records")
    .delete()
    .eq("id", id);

  if (error) {
    alert("删除失败：" + error.message);
    console.log(error);
    return;
  }

  alert("删除成功！");

  loadHistory();
  loadStatistics();
}


// ===============================
// 新建记录
// ===============================

function newToday() {

  currentEditingId = null;

  document
    .getElementById("sessionList")
    .innerHTML = "";

  document
    .querySelectorAll(".dutyGuide")
    .forEach(function (item) {
      item.checked = false;
    });

  document
    .getElementById("recordDate")
    .value = formatDate(new Date());

  calculate();

  alert("已新建记录");
}


// ===============================
// 周/月统计
// ===============================

async function loadStatistics() {

  const { data, error } = await db
    .from("daily_records")
    .select("*");

  if (error) {
    console.log(error);
    return;
  }

  const records = data || [];

  const today = formatDate(new Date());

  const todayPeople = records
    .filter(function (record) {
      return record.date === today;
    })
    .reduce(function (sum, record) {
      return sum + (Number(record.ticket_count) || 0);
    }, 0);

  const statistics =
    document.getElementById("statistics");

  if (statistics) {
    statistics.innerHTML = `
      <p>今日已保存接待人数：${todayPeople}人</p>
    `;
  }

  const now = new Date();

  const monday = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate()
  );

  const day = monday.getDay() || 7;

  monday.setDate(
    monday.getDate() - day + 1
  );

  const weekLabels = [];
  const weekValues = [];

  for (let i = 0; i < 7; i++) {

    const date = new Date(monday);

    date.setDate(monday.getDate() + i);

    const dateString = formatDate(date);

    weekLabels.push(
      dateString.slice(5)
    );

    const people = records
      .filter(function (record) {
        return record.date === dateString;
      })
      .reduce(function (sum, record) {
        return sum + (Number(record.ticket_count) || 0);
      }, 0);

    weekValues.push(people);
  }

  drawWeekChart(weekLabels, weekValues);

  const monthPrefix =
    now.getFullYear() +
    "-" +
    String(now.getMonth() + 1).padStart(2, "0") +
    "-";

  const monthTotals = {};

  records.forEach(function (record) {

    if (!record.date.startsWith(monthPrefix)) {
      return;
    }

    const date = record.date.slice(8);

    monthTotals[date] =
      (monthTotals[date] || 0) +
      (Number(record.ticket_count) || 0);
  });

  const monthLabels = Object.keys(monthTotals)
    .sort(function (a, b) {
      return Number(a) - Number(b);
    });

  const monthValues = monthLabels.map(function (day) {
    return monthTotals[day];
  });

  drawMonthChart(monthLabels, monthValues);
}


// ===============================
// 周图表
// ===============================

function drawWeekChart(labels, values) {

  const canvas =
    document.getElementById("weekChart");

  if (!canvas || typeof Chart === "undefined") {
    return;
  }

  if (weekChart) {
    weekChart.destroy();
  }

  weekChart = new Chart(canvas, {
    type: "bar",

    data: {
      labels: labels,

      datasets: [
        {
          label: "游客人数",
          data: values,
          backgroundColor: "#4f8ef7"
        }
      ]
    },

    options: {
      responsive: true,
      maintainAspectRatio: true
    }
  });
}


// ===============================
// 月图表
// ===============================

function drawMonthChart(labels, values) {

  const canvas =
    document.getElementById("monthChart");

  if (!canvas || typeof Chart === "undefined") {
    return;
  }

  if (monthChart) {
    monthChart.destroy();
  }

  monthChart = new Chart(canvas, {
    type: "line",

    data: {
      labels: labels,

      datasets: [
        {
          label: "游客人数",
          data: values,
          borderColor: "#4f8ef7",
          backgroundColor: "rgba(79, 142, 247, 0.15)",
          fill: true,
          tension: 0.3
        }
      ]
    },

    options: {
      responsive: true,
      maintainAspectRatio: true
    }
  });
}


// ===============================
// 李林亚彩蛋
// ===============================

function showLinyaGift() {

  const giftBox =
    document.getElementById("giftBox");

  const giftText =
    document.getElementById("giftText");

  if (giftBox && giftText) {

    giftText.innerText =
      "🦷 小牙上线！今天也辛苦讲解啦～";

    giftBox.style.display = "block";
  }

  alert("🦷 小牙上线！\n\n今天也辛苦讲解啦～");
}


// ===============================
// 退出登录
// ===============================

function logout() {

  localStorage.removeItem("museumUser");

  currentUser = null;
  currentEditingId = null;

  document
    .getElementById("mainPage")
    .style.display = "none";

  document
    .getElementById("loginCard")
    .style.display = "block";

  document
    .getElementById("username")
    .value = "";

  document
    .getElementById("password")
    .value = "";

  document
    .getElementById("loginMessage")
    .innerText = "";

  alert("已退出登录");
}
