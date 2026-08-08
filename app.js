let currentUser = null;

let guides = [];

let currentEditingId = null;


let weekChart = null;

let monthChart = null;



// ===============================
// 页面加载
// ===============================


window.onload = async function(){


    showToday();


    setDefaultDate();


    await loadGuides();


    bindEvents();


    checkAutoLogin();


    checkData();


};




// ===============================
// 今日日期显示
// ===============================


function showToday(){


    const today = new Date();


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


    let today =
    new Date()
    .toISOString()
    .slice(0,10);



    document
    .getElementById("recordDate")
    .value=today;


}





// ===============================
// 自动登录
// ===============================


function checkAutoLogin(){



    let saved =
    localStorage.getItem(
        "museumUser"
    );



    if(saved){


        currentUser =
        JSON.parse(saved);



        document
        .getElementById("loginCard")
        .style.display="none";



        document
        .getElementById("mainPage")
        .style.display="block";



        loadStatistics();


    }


}






// ===============================
// 登录
// ===============================


async function login(){



    const username =
    document
    .getElementById("username")
    .value;



    const password =
    document
    .getElementById("password")
    .value;




    const {data,error}=await db
    .from("guides")
    .select("*")
    .eq("username",username)
    .eq("password",password)
    .single();





    if(error || !data){


        document
        .getElementById("loginMessage")
        .innerText="账号或密码错误";


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
// ===============================
// 显示值班人员
// ===============================


function renderGuideCheckbox(){


    const box =
    document
    .getElementById("guideCheckboxes");



    box.innerHTML="";



    guides.forEach(g=>{


        box.innerHTML += `


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




    document
    .querySelectorAll(".dutyGuide")
    .forEach(item=>{


        item.onchange =
        calculateShare;


    });



}








// ===============================
// 事件绑定
// ===============================


function bindEvents(){



    document
    .getElementById("loginBtn")
    .onclick=login;



    document
    .getElementById("addSession")
    .onclick=addSession;



    document
    .getElementById("saveBtn")
    .onclick=saveRecord;



    document
    .getElementById("historyBtn")
    .onclick=loadHistory;



    document
    .getElementById("newBtn")
    .onclick=newToday;



    document
    .getElementById("logoutBtn")
    .onclick=logout;



}









// ===============================
// 自动计算人数 收入
// ===============================


function calculate(){



    let count=0;



    document
    .querySelectorAll(".sessionPeople")
    .forEach(input=>{


        count +=
        Number(input.value)||0;


    });





    document
    .getElementById("todayPeople")
    .innerText=count;




    let income =
    count * 45;



    let commission =
    count * 1.8;




    document
    .getElementById("income")
    .innerText =
    income.toFixed(2);




    document
    .getElementById("commission")
    .innerText =
    commission.toFixed(2);




    calculateShare();



    checkData();



}









// ===============================
// 提成分配
// ===============================


function calculateShare(){



    let checked=[];




    document
    .querySelectorAll(".dutyGuide")
    .forEach(item=>{


        if(item.checked){


            checked.push(
                item.value
            );


        }


    });





    let total =

    Number(

        document
        .getElementById("commission")
        .innerText

    );





    let html="";





    guides.forEach(g=>{



        let money=0;




        if(

            checked.includes(g.name)

            &&

            checked.length>0

        ){


            money =
            total / checked.length;


        }





        html += `


        <p>

        ${g.name}

       ：

        ${money.toFixed(2)}

        元


        </p>


        `;



    });






    document
    .getElementById("summary")
    .innerHTML=html;



}









// ===============================
// 添加讲解场次
// ===============================


function addSession(){



    let div =
    document.createElement("div");



    div.className="session";





    div.innerHTML=`



<select class="sessionGuide">


${guides.map(g=>`


<option value="${g.name}">

${g.name}

</option>


`).join("")}



</select>




<input

class="sessionTime"

placeholder="时间">






<input

class="sessionPeople"

type="number"

placeholder="游客人数"

oninput="calculate()">






<button

onclick="this.parentElement.remove();calculate();">


删除


</button>




`;





    document
    .getElementById("sessionList")
    .appendChild(div);



}
// ===============================
// 获取讲解记录
// ===============================


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
            ) || 0


        });


    });



    return arr;


}








// ===============================
// 保存记录
// ===============================


async function saveRecord(){



    let duty=[];



    document
    .querySelectorAll(".dutyGuide")
    .forEach(item=>{


        if(item.checked){


            duty.push(item.value);


        }


    });






    // 关键修复：
    // 使用选择日期，而不是系统今天日期


    let date =

    document
    .getElementById("recordDate")
    .value;




    if(!date){


        alert("请选择记录日期");


        return;


    }







    let data={



        date:date,



        ticket_count:

        Number(

            document
            .getElementById("todayPeople")
            .innerText

        ),



        income:

        Number(

            document
            .getElementById("income")
            .innerText

        ),



        commission:

        Number(

            document
            .getElementById("commission")
            .innerText

        ),



        duty_guides:duty,



        sessions:getSessions(),



        created_by:

        currentUser.name



    };









    let result;





    if(currentEditingId){



        result=

        await db

        .from("daily_records")

        .update(data)

        .eq(
            "id",
            currentEditingId
        );




    }

    else{



        result=

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


        console.log(result.error);


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





    // 李林亚彩蛋


    if(

        currentUser.name==="李林亚"

    ){


        showLinyaGift();


    }





}









// ===============================
// 历史记录
// ===============================


async function loadHistory(){



    const {data,error}=await db

    .from("daily_records")

    .select("*")

    .order(
        "date",
        {
            ascending:false
        }
    );





    if(error){


        console.log(error);


        return;


    }






    let html="";





    data.forEach(r=>{



        html +=`



        <div class="history-item">



        <p>

        📅 日期：

        ${r.date}

        </p>





        <p>

        👥 接待人数：

        ${r.ticket_count}

        人

        </p>





        <p>

        💰 收入：

        ${r.income}

        元

        </p>






        <button

        onclick='loadRecord(${JSON.stringify(r)})'>


        查看修改


        </button>






        <button

        onclick="deleteRecord(${r.id})">


        删除


        </button>





        </div>



        `;




    });







    document

    .getElementById("historyPanel")

    .innerHTML=html;




}
// ===============================
// 加载单条记录进行修改
// ===============================

function loadRecord(record){


currentEditingId = record.id;



document
.getElementById("recordDate")
.value = record.date;



// 清空当前场次

document
.getElementById("sessionList")
.innerHTML="";



// 恢复场次

if(record.sessions){


record.sessions.forEach(s=>{


let div =
document.createElement("div");


div.className="session";



div.innerHTML=`


<select class="sessionGuide">

${guides.map(g=>`

<option

value="${g.name}"

${g.name===s.guide?"selected":""}

>

${g.name}

</option>

`).join("")}


</select>



<input

class="sessionTime"

value="${s.time || ""}"

placeholder="时间"



>



<input

class="sessionPeople"

type="number"

value="${s.people || 0}"

oninput="calculate()"



>



<button

onclick="this.parentElement.remove();calculate();">

删除

</button>


`;



document
.getElementById("sessionList")
.appendChild(div);



});



}




// 恢复值班人员

document
.querySelectorAll(".dutyGuide")
.forEach(item=>{


item.checked =
record.duty_guides.includes(
item.value
);



});




calculate();



alert(
"已加载记录，可以修改后保存"
);


}





// ===============================
// 删除记录
// ===============================

async function deleteRecord(id){



let ok =
confirm(
"确定删除这条记录吗？"
);



if(!ok){

return;

}





const {error}=await db

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


console.log(error);


return;


}





alert(
"删除成功！"
);



loadHistory();


loadStatistics();



}





// ===============================
// 新建今日记录
// ===============================

function newToday(){



currentEditingId=null;



document
.getElementById("sessionList")
.innerHTML="";




document
.querySelectorAll(".dutyGuide")
.forEach(item=>{


item.checked=false;


});




document
.getElementById("recordDate")
.value =
new Date()
.toISOString()
.slice(0,10);




document
.getElementById("todayPeople")
.innerText="0";



document
.getElementById("income")
.innerText="0.00";



document
.getElementById("commission")
.innerText="0.00";



document
.getElementById("summary")
.innerHTML="";



alert(
"已新建记录"
);


}






// ===============================
// 数据核对
// ===============================

function checkData(){



let people =
Number(
document
.getElementById("todayPeople")
?.innerText
)
||0;



let income =
Number(
document
.getElementById("income")
?.innerText
)
||0;



let commission =
Number(
document
.getElementById("commission")
?.innerText
)
||0;



console.log(
"数据核对:",
{
游客人数:people,
收入:income,
提成:commission
}
);



}





// ===============================
// 统计
// ===============================

async function loadStatistics(){



const {data,error}=await db

.from("daily_records")

.select("*");





if(error){

console.log(error);

return;

}




// 今日

let today =
new Date()
.toISOString()
.slice(0,10);




let todayData =
data.filter(
r=>r.date===today
);




let todayPeople =
todayData.reduce(
(sum,r)=>
sum+r.ticket_count
,0);



document
.getElementById("todayPeople")
.innerText =
todayPeople;






// ===============================
// 周统计
// ===============================



let now =
new Date();



// 修复 monday 顺序 bug

let monday =
new Date(now);



let day =
monday.getDay();



if(day===0){

day=7;

}



monday.setDate(
monday.getDate()-day+1
);



monday.setHours(
0,0,0,0
);



let weekData =
data.filter(r=>{


let d =
new Date(r.date);



return d>=monday
&&
d<=now;



});







let weekLabels=[];

let weekValues=[];



for(
let i=0;
i<7;
i++
){


let d =
new Date(monday);



d.setDate(
monday.getDate()+i
);



let str =
d.toISOString()
.slice(0,10);



weekLabels.push(
str.slice(5)
);



weekValues.push(

weekData
.filter(
r=>r.date===str
)
.reduce(
(sum,r)=>
sum+r.ticket_count
,0)

);



}





drawWeekChart(
weekLabels,
weekValues
);






// ===============================
// 月统计
// ===============================


let year =
now.getFullYear();



let month =
now.getMonth();



let monthData =
data.filter(r=>{


let d =
new Date(r.date);


return (

d.getFullYear()
===year

&&

d.getMonth()
===month

);


});




let monthLabels=[];

let monthValues=[];




monthData.forEach(r=>{


monthLabels.push(
r.date.slice(8)
);


monthValues.push(
r.ticket_count
);


});




drawMonthChart(
monthLabels,
monthValues
);



}





// ===============================
// 周图表
// ===============================

function drawWeekChart(
labels,
values
){



let ctx =
document
.getElementById("weekChart");



if(!ctx){

return;

}



if(weekChart){

weekChart.destroy();

}




weekChart =
new Chart(
ctx,
{


type:"bar",


data:{


labels:labels,


datasets:[{


label:"游客人数",


data:values


}]


}



}

);



}







// ===============================
// 月图表
// ===============================

function drawMonthChart(
labels,
values
){



let ctx =
document
.getElementById("monthChart");



if(!ctx){

return;

}




if(monthChart){

monthChart.destroy();

}



monthChart =
new Chart(
ctx,
{


type:"line",


data:{


labels:labels,


datasets:[{


label:"游客人数",


data:values


}]


}



}

);



}






// ===============================
// 李林亚彩蛋
// ===============================

function showLinyaGift(){



alert(
"🦷 小牙上线！\n\n今天也辛苦讲解啦～"
);



}






// ===============================
// 退出登录
// ===============================

function logout(){



localStorage
.removeItem(
"museumUser"
);



currentUser=null;



document
.getElementById("mainPage")
.style.display="none";



document
.getElementById("loginCard")
.style.display="block";



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
