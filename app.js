let currentUser = null;

let guides = [];

let currentEditingId = null;

let weekChart = null;

let monthChart = null;


// 固定提成
let currentCommission = 1.8;



// ===============================
// 页面加载
// ===============================

window.onload = async function(){


  showToday();


  setDefaultDate();


  await loadGuides();


  bindEvents();


  checkAutoLogin();


  calculate();


};




// ===============================
// 日期格式
// ===============================


function formatDate(date){


  const year =
    date.getFullYear();


  const month =
    String(
      date.getMonth()+1
    ).padStart(2,"0");


  const day =
    String(
      date.getDate()
    ).padStart(2,"0");


  return `${year}-${month}-${day}`;

}




// ===============================
// 显示今天日期
// ===============================


function showToday(){


  const today =
    new Date();


  document
  .getElementById("today")
  .innerText =

  today.getFullYear()
  +"年"
  +(today.getMonth()+1)
  +"月"
  +today.getDate()
  +"日";


}





// ===============================
// 默认记录日期
// ===============================


function setDefaultDate(){


  document
  .getElementById("recordDate")
  .value =
  formatDate(new Date());


}






// ===============================
// 自动登录
// ===============================


function checkAutoLogin(){


  const saved =
  localStorage.getItem(
    "museumUser"
  );


  if(!saved){

    return;

  }



  try{


    currentUser =
    JSON.parse(saved);



  }catch(error){


    localStorage.removeItem(
      "museumUser"
    );


    return;

  }



  document
  .getElementById("loginCard")
  .style.display =
  "none";



  document
  .getElementById("mainPage")
  .style.display =
  "block";



  loadStatistics();


}







// ===============================
// 登录
// ===============================


async function login(){



  const username =
  document
  .getElementById("username")
  .value
  .trim();



  const password =
  document
  .getElementById("password")
  .value;



  const message =
  document
  .getElementById("loginMessage");



  message.innerText="";



  if(!username || !password){


    message.innerText =
    "请输入账号和密码";


    return;

  }





  const {

    data,

    error

  } = await db


  .from("guides")


  .select("*")


  .eq(
    "username",
    username
  )


  .eq(
    "password",
    password
  )


  .single();





  if(error || !data){


    message.innerText =
    "账号或密码错误";


    return;

  }





  currentUser=data;



  localStorage.setItem(

    "museumUser",

    JSON.stringify(data)

  );




  document
  .getElementById("loginCard")
  .style.display="none";



  document
  .getElementById("mainPage")
  .style.display="block";



  loadStatistics();


}








// ===============================
// 获取讲解员
// ===============================


async function loadGuides(){



  const {

    data,

    error

  } = await db


  .from("guides")


  .select("*");




  if(error){


    alert(
      "讲解员名单加载失败："
      +
      error.message
    );


    return;

  }



  guides =
  data || [];



  renderGuideCheckbox();



}






// ===============================
// 渲染值班人员
// ===============================


function renderGuideCheckbox(){


  const box =
  document
  .getElementById(
    "guideCheckboxes"
  );


  box.innerHTML="";



  guides.forEach(function(guide){



    const label =
    document.createElement(
      "label"
    );



    const input =
    document.createElement(
      "input"
    );



    input.type="checkbox";


    input.className=
    "dutyGuide";


    input.value=
    guide.name;



    input.addEventListener(
      "change",
      calculate
    );



    label.appendChild(input);



    label.appendChild(
      document.createTextNode(
        " "+guide.name
      )
    );



    box.appendChild(label);



    box.appendChild(
      document.createElement("br")
    );


  });



}







// ===============================
// 事件绑定
// ===============================


function bindEvents(){



document
.getElementById("loginBtn")
.onclick =
login;




document
.getElementById("addSession")
.onclick =
addSession;




document
.getElementById("saveBtn")
.onclick =
saveRecord;




document
.getElementById("historyBtn")
.onclick =
loadHistory;




document
.getElementById("newBtn")
.onclick =
newToday;




document
.getElementById("logoutBtn")
.onclick =
logout;




document
.getElementById("summaryBtn")
.onclick =
loadRangeSummary;





document
.getElementById("sessionList")
.addEventListener(
"input",
calculate
);



document
.getElementById("sessionList")
.addEventListener(
"change",
calculate
);



}






// ===============================
// 自动计算
// ===============================


function calculate(){


let count=0;



document
.querySelectorAll(
".sessionPeople"
)
.forEach(function(input){



count +=
Number(input.value)||0;



});





const income =
count*45;



const commission =
count*currentCommission;





document
.getElementById("todayPeople")
.innerText =
count;



document
.getElementById("income")
.innerText =
income.toFixed(2);



document
.getElementById("commission")
.innerText =
commission.toFixed(2);



calculateShare();



generateDailySummary();



}
// ===============================
// 提成分配
// ===============================


function calculateShare(){


const checked=[];



document
.querySelectorAll(".dutyGuide")
.forEach(function(item){


if(item.checked){

checked.push(item.value);

}


});




const total =

Number(
document
.getElementById("commission")
.innerText
)
||0;




let html="";




guides.forEach(function(guide){



let money=0;



if(
checked.includes(guide.name)
&&
checked.length>0
){


money =
total /
checked.length;


}




html += `

<p>

${guide.name}：

${money.toFixed(2)}

元

</p>

`;



});




document
.getElementById("summary")
.innerHTML =
html;



}









// ===============================
// 添加讲解场次
// ===============================


function addSession(){



const div =
document.createElement("div");



div.className="session";





const guideSelect =
document.createElement("select");



guideSelect.className =
"sessionGuide";




guides.forEach(function(guide){



const option =
document.createElement("option");



option.value =
guide.name;



option.innerText =
guide.name;



guideSelect.appendChild(option);



});







const timeInput =
document.createElement("input");



timeInput.className =
"sessionTime";



timeInput.type="time";






const peopleInput =
document.createElement("input");



peopleInput.className =
"sessionPeople";



peopleInput.type="number";



peopleInput.min="0";



peopleInput.placeholder=
"游客人数";







const deleteButton =
document.createElement("button");



deleteButton.type="button";



deleteButton.innerText=
"删除";




deleteButton.onclick=function(){


div.remove();


calculate();


};





div.appendChild(
guideSelect
);



div.appendChild(
timeInput
);



div.appendChild(
peopleInput
);



div.appendChild(
deleteButton
);




document
.getElementById("sessionList")
.appendChild(div);



calculate();



}









// ===============================
// 获取讲解场次
// ===============================


function getSessions(){



const sessions=[];




document
.querySelectorAll(".session")
.forEach(function(row){



const guide =
row.querySelector(
".sessionGuide"
);



const time =
row.querySelector(
".sessionTime"
);



const people =
row.querySelector(
".sessionPeople"
);





sessions.push({

guide:
guide.value,

time:
time.value,

people:
Number(people.value)||0


});



});



return sessions;



}









// ===============================
// 当日汇总
// ===============================


function generateDailySummary(){



const body =
document.getElementById(
"dailySummaryBody"
);



const totalPeople =
document.getElementById(
"summaryTotalPeople"
);



const totalIncome =
document.getElementById(
"summaryTotalIncome"
);




if(
!body ||
!totalPeople ||
!totalIncome
){

return;

}





const sessions =
getSessions();





if(!sessions.length){


body.innerHTML=`

<tr>

<td colspan="4">

暂无讲解记录

</td>

</tr>

`;



totalPeople.innerText=
"0人";


totalIncome.innerText=
"0元";


return;


}





let html="";

let peopleTotal=0;

let incomeTotal=0;





sessions.forEach(function(session){



const people =
Number(session.people)||0;



const income =
people*45;




peopleTotal += people;



incomeTotal += income;





html += `

<tr>

<td>
${session.time || "-"}
</td>


<td>
${session.guide}
</td>


<td>
${people}人
</td>


<td>
${income.toFixed(2)}元
</td>


</tr>

`;



});




body.innerHTML =
html;



totalPeople.innerText =
peopleTotal+"人";



totalIncome.innerText =
incomeTotal.toFixed(2)+"元";



}









// ===============================
// 保存记录
// ===============================


async function saveRecord(){



if(!currentUser){


alert("请先登录");


return;


}





const date =
document
.getElementById("recordDate")
.value;




const sessions =
getSessions();





if(!sessions.length){


alert(
"请至少添加一场讲解记录"
);


return;


}






const duty=[];



document
.querySelectorAll(".dutyGuide")
.forEach(function(item){


if(item.checked){


duty.push(item.value);


}


});







const data={


date:date,



ticket_count:
Number(
document
.getElementById("todayPeople")
.innerText
)
||0,



income:
Number(
document
.getElementById("income")
.innerText
)
||0,



commission:
Number(
document
.getElementById("commission")
.innerText
)
||0,



duty_guides:
duty,



sessions:
sessions,



created_by:
currentUser.name



};







let result;





if(currentEditingId){



result =
await db
.from("daily_records")
.update(data)
.eq(
"id",
currentEditingId
);



}else{



result =
await db
.from("daily_records")
.insert(data);



}





if(result.error){



alert(
"保存失败："
+
result.error.message
);



return;


}




alert(
currentEditingId
?
"修改成功！"
:
"保存成功！"
);




currentEditingId=null;



loadStatistics();



}








// ===============================
// 历史记录
// ===============================


async function loadHistory(){



const {

data,

error

}=await db

.from("daily_records")

.select("*")

.order(
"date",
{
ascending:false
}
);





if(error){


alert(
"加载失败："
+
error.message
);


return;


}




const panel =
document.getElementById(
"historyPanel"
);



panel.innerHTML="";





data.forEach(function(record){



const div =
document.createElement("div");



div.className=
"history-item";



div.innerHTML=`


<p>
📅 ${record.date}
</p>


<p>
👥 ${record.ticket_count}人
</p>


<p>
💰 ${record.income}元
</p>


`;





const edit =
document.createElement("button");



edit.innerText=
"查看修改";



edit.onclick=function(){

loadRecord(record);

};





const del =
document.createElement("button");



del.innerText=
"删除";



del.onclick=function(){

deleteRecord(record.id);

};





div.appendChild(edit);

div.appendChild(del);



panel.appendChild(div);



});



}
// ===============================
// 加载记录修改
// ===============================


function loadRecord(record){



currentEditingId =
record.id;




document
.getElementById("recordDate")
.value =
record.date;




const list =
document.getElementById(
"sessionList"
);



list.innerHTML="";




const sessions =
Array.isArray(record.sessions)
?
record.sessions
:
[];




sessions.forEach(function(session){


addSessionFromData(session);


});






document
.querySelectorAll(".dutyGuide")
.forEach(function(item){



item.checked =
record.duty_guides.includes(
item.value
);



});




calculate();



window.scrollTo({

top:0,

behavior:"smooth"

});



alert(
"已加载记录，可以修改后保存"
);



}







// ===============================
// 恢复讲解场次
// ===============================


function addSessionFromData(session){



const div =
document.createElement("div");



div.className="session";





const select =
document.createElement("select");



select.className=
"sessionGuide";




guides.forEach(function(guide){



const option =
document.createElement("option");



option.value =
guide.name;



option.innerText =
guide.name;



if(
guide.name === session.guide
){

option.selected=true;

}



select.appendChild(option);



});







const time =
document.createElement("input");



time.className=
"sessionTime";



time.type="time";



time.value =
session.time || "";






const people =
document.createElement("input");



people.className=
"sessionPeople";



people.type="number";



people.min="0";



people.value =
session.people || 0;








const del =
document.createElement("button");



del.innerText=
"删除";



del.onclick=function(){


div.remove();


calculate();


};







div.appendChild(select);

div.appendChild(time);

div.appendChild(people);

div.appendChild(del);






document
.getElementById("sessionList")
.appendChild(div);



}









// ===============================
// 删除记录
// ===============================


async function deleteRecord(id){



const ok =
confirm(
"确定删除这条记录吗？"
);



if(!ok){

return;

}





const {

error

}=await db


.from("daily_records")


.delete()


.eq(
"id",
id
);





if(error){


alert(
"删除失败："
+
error.message
);


return;


}




alert(
"删除成功"
);



loadHistory();



loadStatistics();



}









// ===============================
// 新建记录
// ===============================


function newToday(){



currentEditingId=null;




document
.getElementById("sessionList")
.innerHTML="";





document
.querySelectorAll(".dutyGuide")
.forEach(function(item){



item.checked=false;



});





document
.getElementById("recordDate")
.value =
formatDate(new Date());





calculate();



alert(
"已新建记录"
);



}









// ===============================
// 周/月统计
// ===============================


async function loadStatistics(){



const {

data,

error

}=await db


.from("daily_records")


.select("*");





if(error){

console.log(error);

return;

}





const records =
data || [];






const now =
new Date();





const monday =
new Date(
now
);



const day =
monday.getDay()
||
7;




monday.setDate(
monday.getDate()
-
day
+
1
);







const weekLabels=[];

const weekValues=[];





for(let i=0;i<7;i++){



const date =
new Date(monday);



date.setDate(
monday.getDate()+i
);



const str =
formatDate(date);



weekLabels.push(
str.slice(5)
);




const people =
records

.filter(function(r){

return r.date===str;

})

.reduce(function(sum,r){

return sum+
(Number(r.ticket_count)||0);

},0);




weekValues.push(people);



}





drawWeekChart(
weekLabels,
weekValues
);








const monthPrefix =

now.getFullYear()
+
"-"
+
String(
now.getMonth()+1
)
.padStart(2,"0")
+
"-";




const month={};





records.forEach(function(r){



if(
!r.date.startsWith(
monthPrefix
)
){

return;

}




const d =
r.date.slice(8);




month[d]=
(month[d]||0)
+
(Number(r.ticket_count)||0);



});






const labels =
Object.keys(month);



const values =
labels.map(function(d){

return month[d];

});





drawMonthChart(
labels,
values
);



}









// ===============================
// 周图表
// ===============================


function drawWeekChart(labels,values){



const canvas =
document.getElementById(
"weekChart"
);



if(
!canvas ||
typeof Chart==="undefined"
){

return;

}





if(weekChart){

weekChart.destroy();

}




weekChart =
new Chart(canvas,{


type:"bar",


data:{


labels:labels,


datasets:[{

label:"游客人数",

data:values

}]


},


options:{


responsive:true

}


});



}









// ===============================
// 月图表
// ===============================


function drawMonthChart(labels,values){



const canvas =
document.getElementById(
"monthChart"
);



if(
!canvas ||
typeof Chart==="undefined"
){

return;

}




if(monthChart){

monthChart.destroy();

}





monthChart =
new Chart(canvas,{



type:"line",



data:{


labels:labels,


datasets:[{

label:"游客人数",

data:values,

fill:true,

tension:0.3

}]


},



options:{


responsive:true


}



});



}









// ===============================
// 日期范围汇总
// ===============================


async function loadRangeSummary(){



const start =
document
.getElementById(
"summaryStartDate"
)
.value;



const end =
document
.getElementById(
"summaryEndDate"
)
.value;





if(!start || !end){


alert(
"请选择开始和结束日期"
);


return;


}





const {

data,

error

}=await db


.from("daily_records")


.select("*")


.gte(
"date",
start
)


.lte(
"date",
end
);






if(error){

alert(
error.message
);

return;

}






let people=0;

let income=0;



data.forEach(function(r){


people +=
Number(r.ticket_count)||0;



income +=
Number(r.income)||0;



});






document
.getElementById(
"rangeSummary"
)
.innerHTML=`

<p>
👥 接待人数：
${people}人
</p>


<p>
💰 总收入：
${income.toFixed(2)}元
</p>

`;



}









// ===============================
// 李林亚彩蛋
// ===============================


function showLinyaGift(){



const box =
document.getElementById(
"giftBox"
);



const text =
document.getElementById(
"giftText"
);




if(box && text){



text.innerText=
"🦷 小牙上线！今天也辛苦讲解啦～";



box.style.display=
"block";



}




}









// ===============================
// 退出登录
// ===============================


function logout(){



localStorage.removeItem(
"museumUser"
);



currentUser=null;



currentEditingId=null;





document
.getElementById("mainPage")
.style.display=
"none";




document
.getElementById("loginCard")
.style.display=
"block";




document
.getElementById("username")
.value="";



document
.getElementById("password")
.value="";




alert(
"已退出登录"
);



}
