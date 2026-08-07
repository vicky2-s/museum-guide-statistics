let currentUser = null;

let guides = [];
let sessions = [];


// 页面加载

window.onload = async function(){

    showToday();

    await loadGuides();

    bindEvents();

};


// 显示日期

function showToday(){

    const today = new Date();

    const text =
    today.getFullYear()
    +"年"
    +(today.getMonth()+1)
    +"月"
    +today.getDate()
    +"日";

    document.getElementById("today").innerText=text;

}



// 获取讲解员

async function loadGuides(){

    const {data,error}=await db
    .from("guides")
    .select("*");


    if(error){

        console.log(error);
        return;

    }


    guides=data;


    renderGuideCheckbox();


}




// 登录

async function login(){

    const username=
    document.getElementById("username").value;


    const password=
    document.getElementById("password").value;



    const {data,error}=await db
    .from("guides")
    .select("*")
    .eq("username",username)
    .eq("password",password)
    .single();



    if(error || !data){

        document.getElementById("loginMessage")
        .innerText="账号或密码错误";

        return;

    }


    currentUser=data;


    document.getElementById("loginCard")
    .style.display="none";


    document.getElementById("mainPage")
    .style.display="block";


}




// 显示值班人员

function renderGuideCheckbox(){

    const box=
    document.getElementById(
        "guideCheckboxes"
    );


    box.innerHTML="";


    guides.forEach(g=>{


        box.innerHTML+=`

        <label>

        <input 
        type="checkbox"
        class="dutyGuide"
        value="${g.name}">

        ${g.name}

        </label>

        <br>

        `;


    });


}



// 绑定按钮

function bindEvents(){
    document
.getElementById("historyBtn")
.onclick=
loadHistory;


document
.getElementById("loginBtn")
.onclick=login;



document
.getElementById("ticketCount")
.oninput=calculate;


document
.getElementById("addSession")
.onclick=addSession;


document
.getElementById("saveBtn")
.onclick=saveRecord;



}



// 计算收入提成

function calculate(){

const count =
Number(
document.getElementById("ticketCount").value
)||0;


const income=count*45;

const commission=count*1.8;


document
.getElementById("income")
.innerText=
income.toFixed(2);


document
.getElementById("commission")
.innerText=
commission.toFixed(2);


calculateShare();

}
function calculateShare(){


let checked=[];


document
.querySelectorAll(".dutyGuide")
.forEach(item=>{

if(item.checked){

checked.push(item.value);

}

});


let total =
Number(
document.getElementById("commission").innerText
);



let result="";


guides.forEach(g=>{


let money=0;


if(checked.includes(g.name)
&& checked.length>0){

money=
total/checked.length;

}


result+=`

<p>
${g.name}：
${money.toFixed(2)} 元
</p>

`;


});


document.getElementById("summary")
.innerHTML=result;


}
function addSession(){


let div=document.createElement("div");

div.className="session";


div.innerHTML=`

<select class="sessionGuide">

${guides.map(g=>
`
<option>
${g.name}
</option>
`
).join("")}

</select>


<input 
class="sessionTime"
placeholder="时间">


<input
class="sessionPeople"
type="number"
placeholder="人数">


<button onclick="this.parentElement.remove();updateSummary()">

删除

</button>

`;



document
.getElementById("sessionList")
.appendChild(div);


}
function updateSummary(){

let stats={};


guides.forEach(g=>{

stats[g.name]={
count:0,
people:0
};

});



document
.querySelectorAll(".session")
.forEach(row=>{


let name=
row.querySelector(".sessionGuide").value;


let people=
Number(
row.querySelector(".sessionPeople").value
)||0;


stats[name].count++;

stats[name].people+=people;


});



let html="";


guides.forEach(g=>{

html+=`

<p>
<b>${g.name}</b><br>

讲解：
${stats[g.name].count}
场

游客：
${stats[g.name].people}
人

</p>

`;

});


document.getElementById("summary")
.innerHTML=html;


}

async function saveRecord(){


let duty=[];


document
.querySelectorAll(".dutyGuide")
.forEach(item=>{

if(item.checked){

duty.push(item.value);

}

});



let data={

date:
new Date()
.toISOString()
.slice(0,10),


ticket_count:
Number(
document.getElementById("ticketCount").value
)||0,


income:
Number(
document.getElementById("income").innerText
),


commission:
Number(
document.getElementById("commission").innerText
),


duty_guides:duty,


sessions:getSessions(),


created_by:
currentUser.name

};



const {error}=await db
.from("daily_records")
.insert(data);



if(error){

alert("保存失败");

console.log(error);

return;

}



alert("今日记录保存成功！");


}
function getSessions(){

let arr=[];


document
.querySelectorAll(".session")
.forEach(row=>{


arr.push({

guide:
row.querySelector(".sessionGuide").value,


time:
row.querySelector(".sessionTime").value,


people:
Number(
row.querySelector(".sessionPeople").value
)||0


});


});


return arr;

}
async function loadHistory(){


const {data,error}=await db
.from("daily_records")
.select("*")
.order("date",{ascending:false});



if(error){

console.log(error);
return;

}



let html="<h3>历史记录</h3>";



data.forEach(r=>{


html+=`

<div class="historyItem">

<p>
日期：
${r.date}
</p>

<p>
游客：
${r.ticket_count} 人
</p>

<p>
收入：
${r.income} 元
</p>

<p>
提成：
${r.commission} 元
</p>

<button onclick='loadRecord(${JSON.stringify(r)})'>

编辑

</button>


</div>


`;


});



document
.getElementById("historyPanel")
.innerHTML=html;


}
function loadRecord(r){


document
.getElementById("ticketCount")
.value=
r.ticket_count;



calculate();



document
.querySelectorAll(".dutyGuide")
.forEach(c=>{

c.checked=
r.duty_guides.includes(c.value);

});



document
.getElementById("sessionList")
.innerHTML="";


r.sessions.forEach(s=>{


addSession();


let rows=
document.querySelectorAll(".session");


let row=
rows[rows.length-1];


row.querySelector(".sessionGuide").value=s.guide;

row.querySelector(".sessionTime").value=s.time;

row.querySelector(".sessionPeople").value=s.people;


});


alert("已加载历史记录");

}