let currentUser = null;

let guides = [];


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
.getElementById("loginBtn")
.onclick=login;



document
.getElementById("ticketCount")
.oninput=calculate;



}



// 计算收入提成

function calculate(){


const count=
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



}