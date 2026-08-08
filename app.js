let currentUser = null;

let guides = [];

let currentEditingId = null;


let weekChart = null;

let monthChart = null;



// ======================
// 页面加载
// ======================

window.onload = async function(){


    showToday();


    setDefaultDate();


    await loadGuides();


    bindEvents();


    checkAutoLogin();


    checkData();


};




// ======================
// 日期
// ======================


function showToday(){


    const today=new Date();


    document
    .getElementById("today")
    .innerText=

    today.getFullYear()
    +"年"
    +(today.getMonth()+1)
    +"月"
    +today.getDate()
    +"日";


}




// 默认今天日期

function setDefaultDate(){


    let today =
    new Date()
    .toISOString()
    .slice(0,10);



    document
    .getElementById("recordDate")
    .value=today;


}







// ======================
// 自动登录
// ======================


function checkAutoLogin(){


    let saved =
    localStorage.getItem(
        "museumUser"
    );



    if(saved){


        currentUser=
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








// ======================
// 获取讲解员
// ======================


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









// ======================
// 登录
// ======================


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
        .innerText=
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










// ======================
// 退出
// ======================


function logout(){


    localStorage.removeItem(
        "museumUser"
    );


    currentUser=null;



    document
    .getElementById("mainPage")
    .style.display="none";



    document
    .getElementById("loginCard")
    .style.display="block";


}










// ======================
// 值班人员
// ======================


function renderGuideCheckbox(){


    const box =
    document
    .getElementById(
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





    document
    .querySelectorAll(".dutyGuide")
    .forEach(item=>{


        item.onchange=
        calculateShare;


    });


}









// ======================
// 事件绑定
// ======================


function bindEvents(){



    document
    .getElementById("loginBtn")
    .onclick=login;



    document
    .getElementById("saveBtn")
    .onclick=saveRecord;



    document
    .getElementById("addSession")
    .onclick=addSession;



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










// ======================
// 自动计算
// ======================


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





    let income=count*45;


    let commission=count*1.8;



    document
    .getElementById("income")
    .innerText=
    income.toFixed(2);




    document
    .getElementById("commission")
    .innerText=
    commission.toFixed(2);




    calculateShare();


    checkData();



}







// ======================
// 提成分配
// ======================


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




    let total=
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


            money=
            total/
            checked.length;


        }





        html+=`

        <p>

        ${g.name}：

        ${money.toFixed(2)}

        元

        </p>

        `;



    });




    document
    .getElementById("summary")
    .innerHTML=html;


}
// ======================
// 添加讲解场次
// ======================


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

placeholder="讲解时间">





<input

class="sessionPeople"

type="number"

placeholder="游客人数"

oninput="calculate()">





<button

onclick="
this.parentElement.remove();
calculate();
">

删除

</button>



`;




    document
    .getElementById("sessionList")
    .appendChild(div);



}










// ======================
// 获取讲解数据
// ======================


function getSessions(){


    let arr=[];



    document
    .querySelectorAll(".session")
    .forEach(row=>{


        arr.push({


            guide:
            row
            .querySelector(".sessionGuide")
            .value,


            time:
            row
            .querySelector(".sessionTime")
            .value,


            people:
            Number(
            row
            .querySelector(".sessionPeople")
            .value
            )||0



        });



    });



    return arr;


}










// ======================
// 保存记录
// ======================


async function saveRecord(){



    let duty=[];



    document
    .querySelectorAll(".dutyGuide")
    .forEach(item=>{


        if(item.checked){

            duty.push(item.value);

        }


    });






    let recordDate =
    document
    .getElementById("recordDate")
    .value;



    if(!recordDate){


        alert("请选择记录日期");


        return;


    }






    let data={



        date:recordDate,



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



        sessions:
        getSessions(),



        created_by:
        currentUser.name



    };









    // 防止同一天重复保存

    if(!currentEditingId){



        const {data:exist}=await db
        .from("daily_records")
        .select("id")
        .eq("date",recordDate)
        .single();




        if(exist){


            alert(
            "该日期已经存在记录，请使用历史记录修改"
            );


            return;


        }


    }







    let result;



    if(currentEditingId){



        result=
        await db
        .from("daily_records")
        .update(data)
        .eq("id",currentEditingId);



    }

    else{



        result=
        await db
        .from("daily_records")
        .insert(data);



    }








    if(result.error){



        alert(
        "保存失败："+result.error.message
        );


        console.log(result.error);


        return;


    }







    alert("保存成功！");




    currentEditingId=null;



    loadStatistics();




    if(currentUser.name==="李林亚"){


        showLinyaGift();


    }



}










// ======================
// 历史记录
// ======================


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


        html+=`



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









// ======================
// 加载历史记录
// ======================


function loadRecord(r){



    currentEditingId=r.id;





    document
    .getElementById("recordDate")
    .value=r.date;





    document
    .getElementById("sessionList")
    .innerHTML="";





    document
    .querySelectorAll(".dutyGuide")
    .forEach(c=>{


        c.checked=
        r.duty_guides
        .includes(c.value);



    });








    r.sessions.forEach(s=>{


        addSession();



        let rows=
        document
        .querySelectorAll(".session");



        let row=
        rows[
        rows.length-1
        ];




        row
        .querySelector(".sessionGuide")
        .value=s.guide;




        row
        .querySelector(".sessionTime")
        .value=s.time;




        row
        .querySelector(".sessionPeople")
        .value=s.people;



    });





    calculate();



    alert(
    "历史记录已加载，可以修改后保存"
    );



}










// ======================
// 删除记录
// ======================


async function deleteRecord(id){



    if(
    !confirm(
    "确定删除这条记录吗？"
    )
    ){


        return;


    }






    const {error}=await db
    .from("daily_records")
    .delete()
    .eq("id",id);






    if(error){



        alert("删除失败");


        console.log(error);


        return;


    }






    alert("删除成功");



    loadHistory();



}









// ======================
// 新建今日
// ======================


function newToday(){



    currentEditingId=null;




    setDefaultDate();




    document
    .getElementById("sessionList")
    .innerHTML="";




    document
    .querySelectorAll(".dutyGuide")
    .forEach(c=>{


        c.checked=false;


    });





    calculate();



}









// ======================
// 数据核对
// ======================


function checkData(){



    let people=0;



    document
    .querySelectorAll(".sessionPeople")
    .forEach(input=>{


        people +=
        Number(input.value)||0;


    });





    let result="";





    if(people===0){


        result=
        "等待录入……";


    }


    else{


        result=`

        ✅ 数据正常

        <br>

        讲解人数：

        ${people}

        人

        `;


    }






    document
    .getElementById("checkResult")
    .innerHTML=result;



}
// ======================
// 周/月统计
// ======================


async function loadStatistics(){



    const now =
    new Date();




    const year =
    now.getFullYear();



    const month =
    String(
        now.getMonth()+1
    )
    .padStart(2,"0");





    const start =
    `${year}-${month}-01`;



    const end =
    `${year}-${month}-31`;








    const {data,error}=await db
    .from("daily_records")
    .select("*")
    .gte("date",start)
    .lte("date",end);





    if(error){


        console.log(error);


        return;


    }






    let monthPeople=0;


    let monthIncome=0;


    let monthCommission=0;





    data.forEach(r=>{


        monthPeople +=
        r.ticket_count;


        monthIncome +=
        r.income;


        monthCommission +=
        r.commission;


    });









    // ===== 本周 =====


    let today =
    new Date();



    let day =
    today.getDay();



    let monday =
    new Date(today);



    monday.setDate(

        today.getDate()
        -
        (
        day===0
        ?
        6
        :
        day-1
        )

    );





    let weekPeople=0;


    let weekIncome=0;




    let weekLabels=[];


    let weekValues=[];






    for(let i=0;i<7;i++){



        let d =
        new Date(monday);



        d.setDate(
            monday.getDate()+i
        );



        let key =
        d.toISOString()
        .slice(0,10);




        weekLabels.push(
            key.substring(5)
        );




        let num=0;



        data.forEach(r=>{


            if(r.date===key){


                num =
                r.ticket_count;


            }


        });





        weekValues.push(num);





        data.forEach(r=>{


            if(r.date===key){


                weekPeople +=
                r.ticket_count;



                weekIncome +=
                r.income;



            }



        });



    }









    document
    .getElementById("statistics")
    .innerHTML=`



<h3>
📅 本周统计
</h3>


<p>

👥 接待人数：

${weekPeople}

人

</p>



<p>

💰 收入：

${weekIncome.toFixed(2)}

元

</p>






<h3>

📊 本月统计

</h3>




<p>

👥 接待人数：

${monthPeople}

人

</p>



<p>

💰 收入：

${monthIncome.toFixed(2)}

元

</p>



<p>

💵 提成：

${monthCommission.toFixed(2)}

元

</p>



`;









// ======================
// 月度折线图
// ======================


let monthLabels=[];

let monthValues=[];





data.forEach(r=>{


    monthLabels.push(
        r.date.substring(5)
    );



    monthValues.push(
        r.ticket_count
    );



});







if(monthChart){


    monthChart.destroy();


}







monthChart =
new Chart(


document
.getElementById(
"monthChart"
),



{


type:"line",



data:{



labels:
monthLabels,



datasets:[{


label:
"每日接待人数",


data:
monthValues



}]



}



}

);


