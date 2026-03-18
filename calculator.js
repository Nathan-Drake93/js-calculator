"use strict";

// calculator display
const calcDisplay = document.querySelector(".calculator-display");

// calculator buttons
const numberBtns = Object.fromEntries([...document.querySelectorAll(".key.number")].map(el => [el.dataset.key, el]));
Object.values(numberBtns).forEach(btn => {
    btn.addEventListener("click", numberBtnClick);
});
const operatorBtns = Object.fromEntries([...document.querySelectorAll(".key.math")].map(el => [el.dataset.key, el]));
Object.values(operatorBtns).forEach(btn => {
    btn.addEventListener("click", operatorBtnClick);
});
const systemBtns = Object.fromEntries([...document.querySelectorAll(".system")].map(el => [el.dataset.key, el]));
Object.values(systemBtns).forEach(btn => {
    btn.addEventListener("click", clearBtnClick);
});
const memoryBtns = Object.fromEntries([...document.querySelectorAll(".memory")].map(el => [el.dataset.key, el]));
Object.values(memoryBtns).forEach(btn => {
    btn.addEventListener("click", memoryBtnClick);
});
const equalBtn = document.querySelector(".key.equal");
equalBtn.addEventListener("click", equalBtnClick);
const signBtn = document.querySelector(".key.sign-toggle");
signBtn.addEventListener("click", signBtnClick);

// window handles
window.addEventListener("DOMContentLoaded", pageLoad);
window.addEventListener("keydown", keyboardHandle);
window.addEventListener("resize", pageResize);

// defaults
const DEFAULT_STATE = {
    operator: null,
    lastPressed: null,
    chained: false,
    y: 0,
    total: 0
};

const DEFAULT_MEMORY = 0;
let MAX_DISPLAY_DIGITS;

// current calculator state
let currentState = {...DEFAULT_STATE};
let memory = DEFAULT_MEMORY;

// keyboard mapping
const keyLookup = new Map();
document.querySelectorAll("[data-map]").forEach(btn => {
    const keys = btn.dataset.map.split(" ");
    keys.forEach((key) => {
        keyLookup.set(key, btn);
    });
});

function keyboardHandle(e) {
    const btn = keyLookup.get(e.key);
    if(btn){
        btn.click();
    }
}

// on page load
function pageLoad() {
    calcDisplay.textContent = currentState.total;
    MAX_DISPLAY_DIGITS = getMaxDisplayDigits();
}

function getMaxDisplayDigits() {
    if( calcDisplay.clientWidth >= 600){return 15}
    else if(calcDisplay.clientWidth >= 455){return 11}
    else return 8;
}

function pageResize(){
    MAX_DISPLAY_DIGITS = getMaxDisplayDigits();
}

// displaying
function display(mem = false){
    let num;
    if (mem){
        num = memory;
    }
    else{
        num = currentState.total;
    }
    if (!Number.isInteger(num)){
        num = decimalFormat(num);
    }
    else num = integerFormat(num);

    calcDisplay.textContent = num.toString();
}

function integerFormat(value){
    let numStr = value.toString();
    if (numStr.length > MAX_DISPLAY_DIGITS){
        if (value < 0){
            value = value.toPrecision(MAX_DISPLAY_DIGITS - 1);
        }
        else value = value.toPrecision(MAX_DISPLAY_DIGITS);
    }
    return value;
}

function decimalFormat(value){
    let numStr = value.toString();
    if(numStr.length > MAX_DISPLAY_DIGITS){
        if (value < 0){
            value = value.toPrecision(MAX_DISPLAY_DIGITS - 2);
        }
        else value = value.toPrecision(MAX_DISPLAY_DIGITS - 1);
    }

    return value;
}

function divByZero(){
    allClear();
    calcDisplay.textContent = "Error Div By 0";
}

// clearing handling
function clearBtnClick(e){
    const key = e.target.dataset.key;
    if (currentState.lastPressed === null) {return}
    if (currentState.lastPressed.dataset.type !== "binary-op" && currentState.lastPressed.dataset.type !== "memory") {
        if (key === "aclear" || currentState.lastPressed.dataset.key === "equal" || currentState.lastPressed.dataset.type === "unary-op"){
            allClear();
        }
        else if (key === "clear"){
            backspace();
        }
    }
}

function allClear(){
    if (currentState.operator !== null){
        unHighlightOperator();
    }
    currentState = {...DEFAULT_STATE};
    numberBtns.decimal.disabled = false;
    display();
}

function backspace(){
    let displayStr = calcDisplay.textContent.slice(0, -1);
    if (displayStr.length === 0){
        displayStr = "0";
    }
    calcDisplay.textContent = displayStr;
    if (!calcDisplay.textContent.includes(".")){
        numberBtns.decimal.disabled = false;
    }
}

// memory handling
function memoryBtnClick(e) {
    const key = e.target.dataset.key;
    switch (key) {
        case "mc": memClear(); break;
        case "mr": memRecall(); break;
        case "madd": memAdd(); break;
        case "msub": memSub(); break;
    }
}

function memClear() {
    memory = DEFAULT_MEMORY;
}

function memRecall(){
    display(true);
}

function memAdd(){
    const num = Number(calcDisplay.textContent);
    memory += num;
}

function memSub(){
    const num = Number(calcDisplay.textContent);
    memory -= num;
}

// number button handling
function numberBtnClick(e){
    if (currentState.lastPressed === null || currentState.lastPressed.dataset.key === "equal" || currentState.lastPressed.dataset.type === "binary-op"){
        calcDisplay.textContent = "0"
    }
    if (calcDisplay.textContent.length === MAX_DISPLAY_DIGITS){return;}
    const key = e.target.dataset.key;
    if (key === "decimal"){
        calcDisplay.textContent += ".";
        numberBtns.decimal.disabled = true;
    }
    else{
        if (calcDisplay.textContent === "0" || currentState.lastPressed === null || currentState.lastPressed.dataset.key === "equal" || currentState.lastPressed.dataset.type === "binary-op"){
            calcDisplay.textContent = key;
        }
        else calcDisplay.textContent += key;
    }
    currentState.lastPressed = e.target;
}

// sign toggle handle
function signBtnClick(e){
    currentState.lastPressed = e.target;
    let num = Number(calcDisplay.textContent);
    if (num !== 0) {
        num *= -1;
    }
    calcDisplay.textContent = String(num);
}

// operator buttons handling
function operatorBtnClick(e){
    const keyPressed = e.target;
    if (currentState.chained){
        if (currentState.lastPressed.dataset.type !== "binary-op"){
        chainedOperators();
        }
    }
    currentState.total = Number(calcDisplay.textContent);
    if (keyPressed.dataset.type === "binary-op"){
        highlightOperator(keyPressed);
        currentState.lastPressed = keyPressed;
        currentState.operator = keyPressed;
        currentState.chained = true;
    }
    else if (keyPressed.dataset.type === "unary-op"){
        if (currentState.operator !== null){
            unHighlightOperator();
        }
        currentState.operator = keyPressed;
        currentState.lastPressed = equalBtn;
        equalBtnClick();
    }
}

function chainedOperators(){
    currentState.y = Number(calcDisplay.textContent);
    if (currentState.y === 0 && currentState.operator.dataset.key === "div"){
        divByZero();
    }
    else{
        currentState.total = runOperations();
        display();
    }
}

function highlightOperator(key){
    if (currentState.operator !== null){
        unHighlightOperator();
    }
    key.classList.add("selected");
}

function unHighlightOperator(){
    currentState.operator.classList.remove("selected");
}

// Operator Logic
function add(x, y){ return x + y; }

function sub(x, y){ return x - y; }

function multiply(x, y){ return x * y; }

function div(x, y){ return x / y; }

function modulo(x, y){ return x % y; }

function power(x, y){ return Math.pow(x, y); }

function root(x){ return Math.sqrt(x)}


// equal button handling
function equalBtnClick(){
    if (currentState.lastPressed === null || currentState.operator === null || currentState.lastPressed.dataset.type === "binary-op"){
        return;
    }
    if (currentState.operator.dataset.type !== "unary-op" && currentState.lastPressed.dataset.key !== "equal"){
        currentState.y = Number(calcDisplay.textContent);
    }
    if (currentState.y === 0 && currentState.operator.dataset.key === "div"){
        divByZero();
    }
    else{
        currentState.total = runOperations();
        currentState.lastPressed = equalBtn;
        display();
        unHighlightOperator();
        currentState.chained = false;
    }
}

function runOperations(){
    const operator = currentState.operator.dataset.key;
    let total = currentState.total;
    let y = currentState.y;

   switch(operator){
        case "add": total = add(total, y);break;
        case "sub": total = sub(total, y);break;
        case "mult": total = multiply(total, y);break;
        case "div": total = div(total, y);break;
        case "mod": total = modulo(total, y);break;
        case "pow": total = power(total, y);break;
        case "root": total = root(total);break;
    }
    return total;
}
