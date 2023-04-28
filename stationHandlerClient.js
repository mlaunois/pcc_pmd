let selectMenu = document.getElementById('stationSelect');
let selectValue = false

let quaiTitle = document.getElementById('quaiTitle')

//voyants
let doorsOpened = document.getElementById('doorsOpened')
let doorsClosed = document.getElementById('doorsClosed')
let doorsOpenedPV = document.getElementById('doorsOpenedPV')
let doorsClosedPV = document.getElementById('doorsClosedPV')
let trainPresent = document.getElementById('trainPresent')
let trainNumber = document.getElementById('trainNumber')
let doorsOpenedPAS = document.getElementById('doorsOpenedPAS')
let doorsClosedPAS = document.getElementById('doorsClosedPAS')

//btnAnomalies
let btnPartialPPOpeningInc = document.getElementById('btnPartialPPOpeningInc')
let btnPartialPPClosingInc = document.getElementById('btnPartialPPClosingInc')
let btnTotalPPOpeningInc = document.getElementById('btnTotalPPOpeningInc')
let btnTotalPPClosingInc = document.getElementById('btnTotalPPClosingInc')
let ckbObs = document.getElementById('ckbObs')
let btnReset = document.getElementById('btnReset')

//btn actions
let btnOpenPV = document.getElementById('btnOpenPV')
let btnClosePV = document.getElementById('btnClosePV')
let btnOpenPP = document.getElementById('btnOpenPP')
let btnClosePP = document.getElementById('btnClosePP')
let trainOrderAffect = document.getElementById('trainOrderAffect')
let ckbZopp = document.getElementById('ckbZopp')
let ckbUnlockPMS = document.getElementById('ckbUnlockPMS')
let ckbManualExploit = document.getElementById('ckbManualExploit')
let ckbMaintenance = document.getElementById('ckbMaintenance')

let btnAcquitStation = document.getElementById('btnAcquitStation')

quaiTitle.innerHTML=selectMenu.value

let ws = new WebSocket('ws://localhost:8081')
let data=false

import sm from './sm.js'
sm.init()

sm.registerSound('gong', './src/formats/gong.mp3')

ws.addEventListener('open', ()=> {
    console.log('Connecté au WS')
    ws.send(JSON.stringify({
        op: 1,
        from: "STATION"
    }));

    ws.addEventListener('message', msg =>{
        data = JSON.parse(msg.data);
        console.log(data);

        if(!(data.op)){
            let sections = []
            let inflationDuPrixDuCarburant = 0
            for (let sec of data.SEC){
                sections.push({sec : 'SECTION '+sec.id, quais: []})
                let gr = document.createElement('OPTGROUP')
                gr.label='SECTION '+sec.id
                selectMenu.appendChild(gr)
                for (let ctns of sec.cantons){
                    if(!(ctns.hasOwnProperty('type'))) continue;
                    console.log(ctns.type+' canton '+ctns.cid+' appelée '+ctns.name)
                    sections[inflationDuPrixDuCarburant].quais.push({sname: ctns.name})
                    let opt = document.createElement('OPTION')
                    opt.innerHTML=ctns.name
                    opt.value=ctns.name
                    gr.appendChild(opt)
                }
                inflationDuPrixDuCarburant++
            }
            console.log(sections)
        } else if (data.op===300){
            data=data.content
            let station = getStationsInfo(selectMenu.value)
            updateVoy(station)
        }
    })
})

function getStationsInfo(id){
    let reponse={name: false, id: false, states: false, trains: [], secIndex: false, cIndex: false}
    console.log(data.SEC)
    for (let sec of data.SEC){
        for (let ctns of sec.cantons){
            if(!(ctns.hasOwnProperty('type'))) continue;
            if(!(ctns.name === id)) continue;
            console.log(ctns.type+' canton '+ctns.cid+' appelée '+ctns.name)
            reponse.id=ctns.cid;

            reponse.name=ctns.name;

            reponse.states=ctns.states
            for (let train of ctns.trains){
                console.log(train)
                reponse.trains.push(train)
            }
        }
    }
    let complementALaReponseParcequeOnEnAJamaisAssez = getStationProperties(id)
    reponse.secIndex=complementALaReponseParcequeOnEnAJamaisAssez.secIndex;
    reponse.cIndex=complementALaReponseParcequeOnEnAJamaisAssez.cIndex;
    return reponse;
}

function getStationProperties(id){
    let reponse={name: false, id: false, secIndex: false, cIndex: false}
    for (let sec in data.SEC){
        for (let ctns in data.SEC[sec].cantons){
            if(typeof data.SEC[sec].cantons[ctns].type === 'undefined') continue;
            if(!(data.SEC[sec].cantons[ctns].name === id)) continue;
            reponse.id=data.SEC[sec].cantons[ctns].cid;
            reponse.name=data.SEC[sec].cantons[ctns].name;
            reponse.secIndex=sec;
            reponse.cIndex=ctns;
        }
    }
    return reponse;
}

selectMenu.addEventListener('input', () => {
    selectValue = selectMenu.value
    let station = getStationsInfo(selectMenu.value)
    quaiTitle.innerHTML=selectMenu.value
    console.log(station)
    updateVoy(station)
})

const blinkIntervalId = new Map()

let beepIntervalId = false

let blinkIdReturn = 0

function updateVoy(s){
    for(let i = 1; i<10000; i++){
        if(i===beepIntervalId) continue;
        clearInterval(i)
    }
    
    for (let voy of document.getElementsByClassName('voyStationState')){
        let elemid = voy.id
        let elem=document.getElementById(elemid)

        switch(s.states[elemid]){
            case false:
                console.log(elemid+' faux.')
                voy.classList.remove('ok')
                voy.classList.remove('alarm')
                blinkIdReturn = blinkIntervalId.get(elemid)
                clearInterval(blinkIdReturn)
                clearInterval(blinkIdReturn-1)
                blinkIntervalId.delete(elemid)
                break;
            case true:
                console.log(elemid+' true.')
                voy.classList.toggle('ok', true)
                voy.classList.remove('alarm')
                blinkIdReturn = blinkIntervalId.get(elemid)
                clearInterval(blinkIdReturn)
                clearInterval(blinkIdReturn-1)
                blinkIntervalId.delete(elemid)
                break;
            case 1:
                console.log(elemid+' Alarme')
                voy.classList.remove('ok')
                voy.classList.toggle('alarm', true)
                blinkIdReturn = blinkIntervalId.get(elemid)
                clearInterval(blinkIdReturn)
                clearInterval(blinkIdReturn-1)
                blinkIntervalId.delete(elemid)
                break;
            case 2:
                console.log(elemid+' Anomalie')
                voy.classList.remove('ok')
                let blinkId = setInterval(async function() {
                    voy.classList.toggle('alarm')
                }, 500)
                if(blinkId>=10000) alert('blinkId>=10000, relancer la page!')
                console.log(blinkId)
                blinkIntervalId.set(elemid, blinkId)
                console.log(blinkIntervalId)
                break;
        }
    }
    if(s.trains[0]){
        trainPresent.classList.toggle('ok', true)
        trainNumber.value=s.trains[0].tid
        for (let voy of document.getElementsByClassName('voyStationTrain')){
            let elemid = voy.id
    
            switch(s.trains[0].states[elemid]){
                case false:
                    console.log(elemid+' faux.')
                    voy.classList.remove('ok')
                    break;
                case true:
                    console.log(elemid+' true.')
                    voy.classList.toggle('ok', true)
                    break;
            }
        }
    } else {
        trainPresent.classList.remove('ok')
        for(let voy of document.getElementsByClassName('voyStationTrain')){
            voy.classList.remove('ok')
        }
        trainNumber.value='NON'
    }
    console.log(blinkIntervalId)
    if (blinkIntervalId.size >= 1) {
        console.log(blinkIntervalId+blinkIntervalId.size)
        sm.playSound('gong', 2)
        if(beepIntervalId!=false) return;
        beepIntervalId = setInterval(async () => {
            sm.playSound('gong', 2)
            //sm.stopFreq(2959)
        }, 1000)
    } else {
        console.log('stop')
        clearInterval(beepIntervalId)
        beepIntervalId=false
        sm.stopSound('gong')
    }
}

btnClosePP.addEventListener('click', ()=>{
    ws.send(JSON.stringify({
        op: 204,
        execute: "CLOSEPP-BTN",
        target: getStationsInfo(selectMenu.value)
    }));
})

btnOpenPP.addEventListener('click', ()=>{
    ws.send(JSON.stringify({
        op: 204,
        execute: "OPENPP-BTN",
        target: getStationsInfo(selectMenu.value)
    }));
})

btnOpenPV.addEventListener('click', ()=>{
    let trainId = parseFloat(trainOrderAffect.value)
    if(!trainId){
        trainOrderAffect.style.backgroundColor='#EC2020'
        return;
    }
    ws.send(JSON.stringify({
        op: 204,
        execute: "OPENPV-BTN",
        target: trainId
    }));
    trainOrderAffect.style.backgroundColor='white'
})

btnClosePV.addEventListener('click', ()=>{
    let trainId = parseFloat(trainOrderAffect.value)
    if(!trainId){
        trainOrderAffect.style.backgroundColor='#EC2020'
        return;
    }
    ws.send(JSON.stringify({
        op: 204,
        execute: "CLOSEPV-BTN",
        target: trainId
    }));
    trainOrderAffect.style.backgroundColor='white'
})

btnPartialPPOpeningInc.addEventListener('click', ()=>{
    ws.send(JSON.stringify({
        op: 204,
        execute: "GENRATEINC-PARTIALPPOPEN-BTN",
        target: getStationsInfo(selectMenu.value)
    }));
})

btnPartialPPClosingInc.addEventListener('click', ()=>{
    ws.send(JSON.stringify({
        op: 204,
        execute: "GENRATEINC-PARTIALPPCLOSE-BTN",
        target: getStationsInfo(selectMenu.value)
    }));
})

btnTotalPPOpeningInc.addEventListener('click', ()=>{
    ws.send(JSON.stringify({
        op: 204,
        execute: "GENRATEINC-TOTALPPOPEN-BTN",
        target: getStationsInfo(selectMenu.value)
    }));
})

btnTotalPPClosingInc.addEventListener('click', ()=>{
    ws.send(JSON.stringify({
        op: 204,
        execute: "GENRATEINC-TOTALPPCLOSE-BTN",
        target: getStationsInfo(selectMenu.value)
    }));
})

btnReset.addEventListener('click', ()=>{
    ws.send(JSON.stringify({
        op: 204,
        execute: "GENRATEINC-RESET-BTN",
        target: getStationsInfo(selectMenu.value)
    }));
})

btnAcquitStation.addEventListener('click', ()=>{
    ws.send(JSON.stringify({
        op: 204,
        execute: "AQC-BTN",
        target: getStationsInfo(selectMenu.value)
    }));
})

ckbZopp.addEventListener('input', ()=>{
    let trainId = parseFloat(trainOrderAffect.value)
    if(!trainId){
        trainOrderAffect.style.backgroundColor='#EC2020'
        return;
    }
    if(ckbZopp.checked){
        ws.send(JSON.stringify({
            op: 204,
            execute: "ZOPP-ON-COM",
            target: trainId
        }));
    } else {
        ws.send(JSON.stringify({
            op: 204,
            execute: "ZOPP-OFF-COM",
            target: trainId
        }));
    }
})

ckbObs.addEventListener('input', ()=>{
    if(ckbObs.checked){
        ws.send(JSON.stringify({
            op: 204,
            execute: "OBS-ON-COM",
            target: getStationsInfo(selectMenu.value)
        }));
    } else {
        ws.send(JSON.stringify({
            op: 204,
            execute: "OBS-OFF-COM",
            target: getStationsInfo(selectMenu.value)
        }));
    }
})

ckbUnlockPMS.addEventListener('input', ()=>{
    if(ckbUnlockPMS.checked){
        ws.send(JSON.stringify({
            op: 204,
            execute: "PMSUNLOCK-ON-COM",
            target: getStationsInfo(selectMenu.value)
        }));
    } else {
        ws.send(JSON.stringify({
            op: 204,
            execute: "PMSUNLOCK-OFF-COM",
            target: getStationsInfo(selectMenu.value)
        }));
    }
})

ckbManualExploit.addEventListener('input', ()=>{
    if(ckbManualExploit.checked){
        ws.send(JSON.stringify({
            op: 204,
            execute: "PMSMANUAL-ON-COM",
            target: getStationsInfo(selectMenu.value)
        }));
    } else {
        ws.send(JSON.stringify({
            op: 204,
            execute: "PMSMANUAL-OFF-COM",
            target: getStationsInfo(selectMenu.value)
        }));
    }
})

ckbMaintenance.addEventListener('input', ()=>{
    if(ckbMaintenance.checked){
        ws.send(JSON.stringify({
            op: 204,
            execute: "PMSMAINT-ON-COM",
            target: getStationsInfo(selectMenu.value)
        }));
    } else {
        ws.send(JSON.stringify({
            op: 204,
            execute: "PMSMAINT-OFF-COM",
            target: getStationsInfo(selectMenu.value)
        }));
    }
})