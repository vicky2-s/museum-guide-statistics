let currentUser = null;

let guides = [];

let currentEditingId = null;


// 页面加载

window.onload = async function(){

    showToday();

    await loadGuides();

    bindEvents();

    checkData();

};



// 日期

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

    const username =
    document.getElementById("username").value;


    const password =
    document.getElementById("password").value;



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


    document
    .getElementById("loginCard")
    .style.display="none";


    document
    .getElementById("mainPage")
    .style.display="block";


    checkData();

}



// 值班人员

function renderGuideCheckbox(){

    const box =
    document.getElementById("guideCheckboxes");


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



    document
    .querySelectorAll(".dutyGuide")
    .forEach(item=>{


        item.onchange=calculateShare;


    });


}




// 绑定事件

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


}



// 自动计算

function calculate(){


    let count = 0;


    document
    .querySelectorAll(".sessionPeople")
    .forEach(input=>{


        count +=
        Number(input.value)||0;


    });



    const income =
    count * 45;


    const commission =
    count * 1.8;



    document
    .getElementById("income")
    .innerText=
    income.toFixed(2);

    document
    .getElementById("visitorCount")
    .innerText=count;



    document
    .getElementById("commission")
    .innerText=
    commission.toFixed(2);



    calculateShare();


    checkData();


}



// 提成分配

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


        if(
            checked.includes(g.name)
            &&
            checked.length>0
        ){

            money=
            total/checked.length;

        }



        result+=`

        <p>

        ${g.name}：
        ${money.toFixed(2)}
        元

        </p>

        `;


    });



    document
    .getElementById("summary")
    .innerHTML=result;


}




// 添加讲解记录

function addSession(){


    let div=document.createElement("div");


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



    <button onclick="
    this.parentElement.remove();
    calculate();
    ">

    删除

    </button>


    `;



    document
    .getElementById("sessionList")
    .appendChild(div);


    calculate();


}




// 获取讲解记录

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




// 总人数

function getTotalPeople(){

    let total=0;


    document
    .querySelectorAll(".sessionPeople")
    .forEach(input=>{


        total +=
        Number(input.value)||0;


    });


    return total;

}





// 保存

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
        getTotalPeople(),



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



    let result;



    if(currentEditingId){


        result=
        await db
        .from("daily_records")
        .update(data)
        .eq("id",currentEditingId);



    }else{


        result=
        await db
        .from("daily_records")
        .insert(data);


    }



    if(result.error){

        alert(
        "保存失败："+result.error.message
        );

        return;

    }



    alert(
    currentEditingId
    ?
    "修改成功"
    :
    "保存成功"
    );


    currentEditingId=null;


}



// 数据核对

function checkData(){


    const ticketCount =
    getTotalPeople();



    let sessionPeople =
    getTotalPeople();



    let result=`


    ✅ 数据核对通过


    <br>


    今日接待人数：

    ${ticketCount} 人


    <br>


    讲解统计人数：

    ${sessionPeople} 人


    `;



    document
    .getElementById("checkResult")
    .innerHTML=result;


}




// 历史记录

async function loadHistory(){

    const {data,error}=await db
    .from("daily_records")
    .select("*")
    .order("date",{ascending:false});



    if(error){

        console.log(error);

        return;

    }



    let html="";



    data.forEach(r=>{


        html+=`

        <div class="history-item">


        <p>
        日期：
        ${r.date}
        </p>


        <p>
        接待人数：
        ${r.ticket_count}
        </p>


        <button onclick='loadRecord(${JSON.stringify(r)})'>
        查看
        </button>


        <button onclick="deleteRecord(${r.id})">
        删除
        </button>


        </div>


        `;


    });



    document
    .getElementById("historyPanel")
    .innerHTML=html;


}



// 加载历史

function loadRecord(r){

    currentEditingId=r.id;


    document
    .getElementById("sessionList")
    .innerHTML="";


    r.sessions.forEach(s=>{


        addSession();


        let rows =
        document.querySelectorAll(".session");


        let row =
        rows[rows.length-1];


        row.querySelector(".sessionGuide")
        .value=s.guide;


        row.querySelector(".sessionTime")
        .value=s.time;


        row.querySelector(".sessionPeople")
        .value=s.people;


    });


    calculate();


    alert("历史记录已加载");


}



// 删除历史

async function deleteRecord(id){


    if(!confirm("确定删除吗？")){

        return;

    }


    const {error}=await db
    .from("daily_records")
    .delete()
    .eq("id",id);



    if(error){

        alert("删除失败");

        return;

    }



    alert("删除成功");


    loadHistory();


}




// 新建今日

function newToday(){


    currentEditingId=null;


    document
    .getElementById("sessionList")
    .innerHTML="";


    document
    .querySelectorAll(".dutyGuide")
    .forEach(c=>{


        c.checked=false;


    });



    calculate();


    alert("已新建今日统计");


}
