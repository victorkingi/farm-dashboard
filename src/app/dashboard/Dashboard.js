import React, {useEffect, useMemo, useState} from 'react';
import {connect} from 'react-redux';
import {compose} from 'redux';
import {firestoreConnect} from 'react-redux-firebase';
import { Doughnut } from 'react-chartjs-2';
import numeral from 'numeral';
import moment from 'moment';
import Snackbar from "@material-ui/core/Snackbar";
import {Alert} from '../form-elements/InputEggs';
import {sanitize_string} from "../../services/actions/utilAction";
import {Redirect} from "react-router-dom";
import {isMobile} from 'react-device-detect';
import {Offline, Online} from "react-detect-offline";
import CountUp from 'react-countup';
import {firestore} from "../../services/api/fbConfig";

let __user__ = localStorage.getItem('name');
__user__ = __user__ !== null ? __user__.toUpperCase() : '';


function getLastSunday(d) {
  const t = new Date(d);
  t.setDate(t.getDate() - t.getDay());
  return t;
}
let itemCount = -1;
function truncate(str, length) {
  if (str.substring(0, 6) === 'VICTOR') {
    let name = str.substring(0, 6);
    name = sanitize_string(name);
    str = name+str.slice(6);
  } else if (str.substring(0, 6) === 'PURITY') {
    let name = str.substring(0, 6);
    name = sanitize_string(name);
    str = name+str.slice(6);
  } else if (str.substring(0, 4) === 'JEFF') {
    let name = str.substring(0, 4);
    name = sanitize_string(name);
    str = name+str.slice(6);
  } else if (str.substring(0, 5) === 'BABRA') {
    let name = str.substring(0, 5);
    name = sanitize_string(name);
    str = name+str.slice(6);
  }
  if (str?.length > length) return str?.substring(0, length-3)+'...';
  else return str;
}

export function getRanColor() {
  const randomColor = Math.floor(Math.random()*16777215).toString(16);
  return "#"+randomColor;
}

function getRevenue(sales, buys) {
  return sales - buys;
}

function getTotal(stats) {
  if (stats) {
    let sales;
    let buys;
    let prevMonthSale;
    let prevAmountSale;
    let prevAmountBuy;
    let prevMonthBuy;
    for (let i = 0; i < stats.length; i++) {
      if (stats[i].id === 'data_buys') {
        buys = stats[i].totalAmountSpent;
        prevMonthBuy = stats[i].prevMonth;
        prevAmountBuy = stats[i].prevAmount;
      }
      else if (stats[i].id === 'data_sales') {
        sales = stats[i].totalAmountEarned;
        prevMonthSale = stats[i].prevMonth;
        prevAmountSale = stats[i].prevAmount;
      }
    }
    if (typeof sales === 'number'
        && typeof buys === 'number') return {
      sales,
      prevMonthSale,
      prevAmountSale,
      buys,
      prevMonthBuy,
      prevAmountBuy
    }
    else console.error("Sales or Buys returned undefined", sales, buys);
  }
  return { sales: 0, buys: 0 }
}

function getUser() {
  if (__user__ === 'BANK') return 0;
  else if (__user__ === 'JEFF') return 1;
  else if (__user__ === 'VICTOR') return 2;
  else if (__user__ === 'BABRA') return 3;
  else return 3;
}

function Dashboard(props) {
  const {
    notifications, pend, forProfit,
    profit, chick, trays,
    block, current, stats
  } = props;
  const [open, setOpen] = useState(false);
  const [trans, setTrans] = useState({});
  const [done, setDone] = useState(false);
  const [done1, setDone1] = useState(false);
  const [done3, setDone3] = useState(false);
  const [done4, setDone4] = useState(false);
  const [error, setError] = useState(false);
  const [errM, setErrM] = useState('');
  const [disable, setDisable] = useState(false);
  const [name, setName] = useState('');
  const [allChecked, setAllChecked] = useState(false);
  const [pendChecked, setPendChecked] = useState({});

  const transactionHistoryData =  {
    labels: JSON.stringify(trans) !== '{}'
        ? trans.labels : ["Bank", "Victor","Jeff"],
    datasets: [{
      data: JSON.stringify(trans) !== '{}' ? trans.data : [55, 25, 20],
      backgroundColor: JSON.stringify(trans) !== '{}' ? trans.color : [
        "#111111","#00d25b","#ffab00"
      ]
    }
    ]
  };

  function truncateMap(mobileMax, desktopMax, vals) {
    //truncate everything except total
    let labels = isMobile ? vals.labels.slice(0, mobileMax)
        : vals.labels.slice(0, desktopMax);
    let data = isMobile ? vals.sent.slice(0, mobileMax)
        : vals.sent.slice(0, desktopMax);
    let time = isMobile ? vals.time.slice(0, mobileMax)
        : vals.time.slice(0, desktopMax);
    let key = isMobile ? vals.key.slice(0, mobileMax)
        : vals.key.slice(0, desktopMax);
    let sent = data;
    let total = data.reduce((a, b) => a + b, 0);
    data = data.map(x => Math.round((x/total) * 100));
    let color = new Array(data.length).fill('');
    color = color.map(_ => getRanColor());
    return  {
      labels,
      data,
      color,
      sent,
      time,
      key,
      total
    }
  }

  useEffect(() => {
    setName(__user__);
    if (block) {
      let temp = block[0];
      const time = temp.time.map(x => x.toDate());
      temp = {
        ...temp,
        time
      }
      temp = {
        data: temp.data,
        key: temp.key,
        labels: temp.labels,
        time: temp.time,
        sent: temp.sent,
        total: temp.total,
        color: temp.color
      }
      let finalTemp = truncateMap(3, 4, temp);
      setTrans(finalTemp);
    }
    if (pend) {
      if (pend.length > 0) {
        let allDisable  = false;
        for (let k = 0; k < pend.length; k++) {
          //if we come across the first one where name isn't name break loop
          if (pend[k].id === 'cleared') continue;
          if (pend[k].values?.name) {
            if (pend[k].values?.name !== name
                && pend[k].values?.name !== "ANNE") {
              allDisable = true;
              break;
            }
          }
          if (pend[k].values?.from) {
            if (pend[k].values?.from !== name) {
              allDisable = true;
              break;
            }
          }
        }
        setDisable(allDisable);
      }
    }
  }, [name, block, pend]);

  // undo write events to database
  const rollBack = () => {
    for (const [key, value] of Object.entries(pendChecked)) {
      if (value) {
        firestore.collection("pending_transactions").doc(key)
            .get().then(async (doc) => {
          if (doc.exists) {
            await doc.ref.delete();
          } else {
            const err = new Error("Invalid data!");
            setOpen(false);
            setErrM("The reference no longer exists, it probably didn't have a clean EXIT_DEL instruction");
            setError(true);
            throw err;
          }
        });
      }
    }
  }

  const transactionHistoryOptions = {
    responsive: true,
    maintainAspectRatio: true,
    segmentShowStroke: false,
    cutoutPercentage: 70,
    elements: {
      arc: {
        borderWidth: 0
      }
    },
    legend: {
      display: false
    },
    tooltips: {
      enabled: true
    }
  }

  const user = useMemo(() => {
    const __user = localStorage.getItem('user') || false;

    return {__user};
  }, []);

  if (!user.__user) {
    return (
        <Redirect to="/user-pages/login-1"/>
    )
  }

  const handleClose = (event, reason) => {
    if (reason === 'clickaway') {
      return;
    }
    setOpen(false);
  };

  const getEggs = (tray, eggs) => {
     return (parseInt(tray) * 30) + parseInt(eggs);
   }
  const decodeTrayEgg = (obj) => {
     obj = obj?.toString();
     return obj?.split(',');
   }

  const getAmount = (item) => {
     if (item?.values?.trayNo)
       return parseInt(item?.values?.trayNo)
           * parseFloat(item?.values?.trayPrice);
     else if (item?.values?.objectNo)
       return  parseInt(item?.values?.objectNo)
           * parseFloat(item?.values?.objectPrice);
     else if (item?.values?.amount) return item?.values?.amount;
   }

  const display = (e) => {
     e.preventDefault();
     const submit = document.getElementById(`rewind`);
     submit.disabled = true;
     rollBack();
     setOpen(true);
   }

  const isRejected = (date) => {
     if (date) {
       const today = new Date().getTime();
       let toMine = new Date(date);
       toMine.setHours(3, 0, 0, 0);
       // if mine time is < submittedOn then choose next date, else choose today
       if (toMine.getTime() < date.getTime()) {
         toMine.setDate(toMine.getDate()+1);
       }
       return toMine.getTime() < today;
     } else {
       return false;
     }
   }

  const getLatestWeekProfit = () => {
     if (profit) {
       const curDate = profit[0].submittedOn.toDate();
       curDate.setHours(0, 0, 0, 0);
       let sun = getLastSunday(curDate);
       const prevSun = getLastSunday(curDate);
       sun.setDate(sun.getDate() - 1);
       sun = getLastSunday(sun);
       let vals = {};
       for (let i = 0; i < profit.length; i++) {
         const dateClean = new Date(profit[i].docId);
         dateClean.setHours(0, 0, 0, 0);
         if (dateClean.getTime() === sun.getTime()) {
           vals = {
             ...vals,
             sun2: profit[i].profit
           }
         } else if (dateClean.getTime() === prevSun.getTime()) {
           vals = {
             ...vals,
             sun1: profit[i].profit
           }
         }
       }
       return vals;
     }
     return 0;
   }

  const getIcon = (identifier, big) => {
     if (identifier === "sell") {
       if (big === true) return "cash-multiple";
       else return "cash";
     } else if (identifier === "mine") return "server-network";
     else if (identifier === "buy") return "basket";
     else if (identifier === "egg") return "basket-fill";
     else if (identifier === "sick") return "yelp";
     else if (identifier === "dead") return "biohazard";
   }

  const riseDrop = (current, prev) => {
     const change = parseFloat(current) - parseFloat(prev);
     const divideByZero = change / parseFloat(prev);
     if (!isFinite(divideByZero) && change !== 0) return 100.0;
     if (current < 0 && prev < 0) return (change / parseFloat(prev)) * 100.0 * -1;
     return (change / parseFloat(prev)) * 100.0;
   }

  const availToWithdraw = () => {
     if (profit) {
       let myProfit = '0,0';
       for (let i = 0; i < profit.length; i++) {
         if (profit[i].id === 'available') myProfit = profit[i];
       }
       if (myProfit === '0,0') return myProfit;
       return myProfit[__user__]?.toString()+','+myProfit['prev'+__user__];
     }
    return '0,0'
   }

   const addAllEntries = (all) => {
    if (!pend) return 0;
    const allPend = {};
    for (let i = 0; i < pend.length; i++) {
      if (pend[i].id === 'cleared') continue;
      allPend[pend[i].id] = all;
    }
    setPendChecked(allPend);
   }

  return (
      <div>
          <div className="row">
            {current && parseFloat(availToWithdraw().split(',')[0]) > 0
            && <div className="col-xl-3 col-sm-6 grid-margin stretch-card">
              <div className="card">
                <div className="card-body">
                  {profit &&
                  <div className="row">
                    <div className="col-9">
                      <div className="d-flex align-items-center align-self-start">
                        <h3 className="mb-0">Ksh {!done &&
                        <CountUp
                            start={Math.abs(parseFloat(availToWithdraw().split(',')[0]) - 1000)}
                            end={parseFloat(availToWithdraw().split(',')[0])}
                            duration={2.75}
                            delay={1}
                            onEnd={() => setDone(true)}
                        />}{done && numeral(availToWithdraw().split(',')[0]).format("0,0")}</h3>
                        <p className={`text-${riseDrop(availToWithdraw().split(',')[0], availToWithdraw().split(',')[1])
                        < 0 ? 'danger' : 'success'} ml-2 mb-0 font-weight-medium`}>
                          {riseDrop(availToWithdraw().split(',')[0], availToWithdraw().split(',')[1]) < 0
                              ? numeral(riseDrop(availToWithdraw().split(',')[0], availToWithdraw().split(',')[1])).format("0,0.0")
                              : '+'.concat(numeral(riseDrop(availToWithdraw().split(',')[0], availToWithdraw().split(',')[1])).format("0,0.0"))}%
                        </p>
                      </div>

                    </div>
                    <div className="col-3">
                      <div
                          className={`icon icon-box-${riseDrop(availToWithdraw().split(',')[0], availToWithdraw().split(',')[1]) < 0 ? 'danger' : 'success'}`}>
                        <span
                            className={`mdi mdi-arrow-${riseDrop(availToWithdraw().split(',')[0], availToWithdraw().split(',')[1]) < 0 ? 'bottom-left' : 'top-right'} icon-item`}/>
                      </div>
                    </div>
                  </div>}
                  <h6 className="text-muted font-weight-normal">Amount Available to Withdraw</h6>
                </div>
              </div>
            </div>}
            {current && parseFloat(availToWithdraw().split(',')[0]) <= 0
            && !isMobile
            && <div className="col-xl-3 col-sm-6 grid-margin stretch-card">
              <div className="card">
                <div className="card-body">
                  {profit &&
                  <div className="row">
                    <div className="col-9">
                      <div className="d-flex align-items-center align-self-start">
                        <h3 className="mb-0">Ksh {!done &&
                        <CountUp
                            start={Math.abs(parseFloat(availToWithdraw().split(',')[0]) - 1000)}
                            end={parseFloat(availToWithdraw().split(',')[0])}
                            duration={2.75}
                            delay={1}
                            onEnd={() => setDone(true)}
                        />}{done && numeral(availToWithdraw().split(',')[0]).format("0,0")}</h3>
                        <p className={`text-${riseDrop(availToWithdraw().split(',')[0], availToWithdraw().split(',')[1])
                        < 0 ? 'danger' : 'success'} ml-2 mb-0 font-weight-medium`}>
                          {riseDrop(availToWithdraw().split(',')[0], availToWithdraw().split(',')[1]) < 0
                              ? numeral(riseDrop(availToWithdraw().split(',')[0], availToWithdraw().split(',')[1])).format("0,0.0")
                              : '+'.concat(numeral(riseDrop(availToWithdraw().split(',')[0], availToWithdraw().split(',')[1])).format("0,0.0"))}%
                        </p>
                      </div>

                    </div>
                    <div className="col-3">
                      <div
                          className={`icon icon-box-${riseDrop(availToWithdraw().split(',')[0], availToWithdraw().split(',')[1]) < 0 ? 'danger' : 'success'}`}>
                        <span
                            className={`mdi mdi-arrow-${riseDrop(availToWithdraw().split(',')[0], availToWithdraw().split(',')[1]) < 0 ? 'bottom-left' : 'top-right'} icon-item`}/>
                      </div>
                    </div>
                  </div>}
                  <h6 className="text-muted font-weight-normal">Amount Available to Withdraw</h6>
                </div>
              </div>
            </div>}
            {current && parseFloat(current[getUser()]?.balance) > 0
            && <div className="col-xl-3 col-sm-6 grid-margin stretch-card">
              <div className="card">
                <div className="card-body">
                  {current &&
                  <div className="row">
                    <div className="col-9">
                      <div className="d-flex align-items-center align-self-start">
                        <h3 className="mb-0">Ksh {!done4 &&
                        <CountUp
                            start={Math.abs(parseFloat(current[getUser()]?.balance) - 1000)}
                            end={parseFloat(current[getUser()]?.balance)}
                            duration={2.75}
                            delay={1}
                            onEnd={() => setDone4(true)}
                        />}{done4 && numeral(parseFloat(current[getUser()]?.balance)).format("0,0")}</h3>
                        <p className={`text-${riseDrop(parseFloat(current[getUser()]?.balance),
                            parseFloat(current[4][__user__]))
                        < 0 ? 'success' : 'danger'} ml-2 mb-0 font-weight-medium`}>
                          {riseDrop(parseFloat(current[getUser()]?.balance),
                              parseFloat(current[4][__user__])) < 0
                              ? numeral(riseDrop(parseFloat(current[getUser()]?.balance),
                                  parseFloat(current[4][__user__]))).format("0,0.0")
                              : '+'.concat(numeral(riseDrop(parseFloat(current[getUser()]?.balance),
                                  parseFloat(current[4][__user__]))).format("0,0.0"))}%
                        </p>
                      </div>
                    </div>
                    <div className="col-3">
                      <div
                          className={`icon icon-box-${riseDrop(parseFloat(current[getUser()]?.balance),
                              parseFloat(current[4][__user__])) < 0 ? 'success' : 'danger'}`}>
                        <span
                            className={`mdi mdi-arrow-${riseDrop(parseFloat(current[getUser()]?.balance),
                                parseFloat(current[4][__user__])) < 0 ? 'bottom-left' : 'top-right'} icon-item`}/>
                      </div>
                    </div>
                  </div>}
                  <h6 className="text-muted font-weight-normal">Current Debt</h6>
                </div>
              </div>
            </div>}
            {current && parseFloat(current[getUser()]?.balance) <= 0
            && !isMobile
            && <div className="col-xl-3 col-sm-6 grid-margin stretch-card">
              <div className="card">
                <div className="card-body">
                  {current &&
                  <div className="row">
                    <div className="col-9">
                      <div className="d-flex align-items-center align-self-start">
                        <h3 className="mb-0">Ksh {!done4 &&
                        <CountUp
                            start={Math.abs(parseFloat(current[getUser()]?.balance) - 1000)}
                            end={parseFloat(current[getUser()]?.balance)}
                            duration={2.75}
                            delay={1}
                            onEnd={() => setDone4(true)}
                        />}{done4 && numeral(parseFloat(current[getUser()]?.balance)).format("0,0")}</h3>
                        <p className={`text-${riseDrop(parseFloat(current[getUser()]?.balance),
                            parseFloat(current[4][__user__]))
                        < 0 ? 'success' : 'danger'} ml-2 mb-0 font-weight-medium`}>
                          {riseDrop(parseFloat(current[getUser()]?.balance),
                              parseFloat(current[4][__user__])) < 0
                              ? numeral(riseDrop(parseFloat(current[getUser()]?.balance),
                                  parseFloat(current[4][__user__]))).format("0,0.0")
                              : '+'.concat(numeral(riseDrop(parseFloat(current[getUser()]?.balance),
                                  parseFloat(current[4][__user__]))).format("0,0.0"))}%
                        </p>
                      </div>
                    </div>
                    <div className="col-3">
                      <div
                          className={`icon icon-box-${riseDrop(parseFloat(current[getUser()]?.balance),
                              parseFloat(current[4][__user__])) < 0 ? 'success' : 'danger'}`}>
                        <span
                            className={`mdi mdi-arrow-${riseDrop(parseFloat(current[getUser()]?.balance),
                                parseFloat(current[4][__user__])) < 0 ? 'bottom-left' : 'top-right'} icon-item`}/>
                      </div>
                    </div>
                  </div>}
                  <h6 className="text-muted font-weight-normal">Current Debt</h6>
                </div>
              </div>
            </div>}
            <div className="col-xl-3 col-sm-6 grid-margin stretch-card">
              <div className="card">
                <div className="card-body">
                  {chick &&
                  <div className="row">
                    <div className="col-9">
                      <div className="d-flex align-items-center align-self-start">
                        <h3 className="mb-0">{!done1 &&
                        <CountUp
                            start={0}
                            end={parseFloat(chick[0].weekPercent)}
                            duration={2.75}
                            delay={1}
                            onEnd={() => setDone1(true)}
                        />}{done1 && numeral(chick[0].weekPercent).format("0.00")}%</h3>
                        <p className={`text-${riseDrop(chick[0].weekPercent, chick[0].prevWeekPercent)
                        < 0 ? 'danger' : 'success'} ml-2 mb-0 font-weight-medium`}>
                          {riseDrop(chick[0].weekPercent, chick[0].prevWeekPercent) < 0
                              ? numeral(riseDrop(chick[0].weekPercent, chick[0].prevWeekPercent)).format("0,0.0")
                              : '+'.concat(numeral(riseDrop(chick[0].weekPercent, chick[0].prevWeekPercent)).format("0,0.0"))}%
                        </p>
                      </div>

                    </div>
                    <div className="col-3">
                      <div
                          className={`icon icon-box-${riseDrop(chick[0].weekPercent, chick[0].prevWeekPercent) < 0 ? 'danger' : 'success'}`}>
                        <span
    className={`mdi mdi-arrow-${riseDrop(chick[0].weekPercent, chick[0].prevWeekPercent) < 0 ? 'bottom-left' : 'top-right'} icon-item`}/>
                      </div>
                    </div>
                  </div>}
                  <h6 className="text-muted font-weight-normal">Last Week Laying Percentage</h6>
                </div>
              </div>
            </div>
            <div className="col-xl-3 col-sm-6 grid-margin stretch-card">
              <div className="card">
                <div className="card-body">
                  {current &&
                  <div className="row">
                    <div className="col-9">
                      <div className="d-flex align-items-center align-self-start">
                        <h3 className="mb-0">Ksh {numeral(current[0].balance).format("0,0.00")}</h3>
                        <p className={`text-${riseDrop(parseFloat(current[0]?.balance),
                            parseFloat(current[4]['BANK']))
                        < 0 ? 'danger' : 'success'} ml-2 mb-0 font-weight-medium`}>
                          {riseDrop(parseFloat(current[0]?.balance),
                              parseFloat(current[4]['BANK'])) < 0
                              ? numeral(riseDrop(parseFloat(current[0]?.balance),
                                  parseFloat(current[4]['BANK']))).format("0,0.0")
                              : '+'.concat(numeral(riseDrop(parseFloat(current[0]?.balance),
                                  parseFloat(current[4]['BANK']))).format("0,0.0"))}%
                        </p>
                      </div>

                    </div>
                    <div className="col-3">
                      <div
                          className={`icon icon-box-${riseDrop(parseFloat(current[0]?.balance),
                              parseFloat(current[4]['BANK'])) < 0 ? 'danger' : 'success'}`}>
                        <span
                            className={`mdi mdi-arrow-${riseDrop(parseFloat(current[0]?.balance),
                                parseFloat(current[4]['BANK'])) < 0 ? 'bottom-left' : 'top-right'} icon-item`}/>
                      </div>
                    </div>
                  </div>}
                  <h6 className="text-muted font-weight-normal">Bank Balance</h6>
                </div>
              </div>
            </div>
            {isMobile && <div className="col-xl-3 col-sm-6 grid-margin stretch-card">
              <div className="card">
                <div className="card-body">
                  {current &&
                  <div className="row">
                    <div className="col-9">
                      <div className="d-flex align-items-center align-self-start">
                        <h3 className="mb-0">Ksh {numeral(current[6].balance - current[5].balance).format("0,0.00")}</h3>
                        <p className={`text-${riseDrop(current[6].balance - current[5].balance, current[4]['FEEDS'] - current[4]['THIKA_FARMERS'])
                        > 0 ? 'danger' : 'success'} ml-2 mb-0 font-weight-medium`}>
                          {riseDrop(current[6].balance - current[5].balance, current[4]['FEEDS'] - current[4]['THIKA_FARMERS']) < 0
                              ? numeral(riseDrop(current[6].balance - current[5].balance, current[4]['FEEDS'] - current[4]['THIKA_FARMERS'])).format("0,0.0")
                              : '+'.concat(numeral(riseDrop(current[6].balance - current[5].balance), current[4]['FEEDS'] - current[4]['THIKA_FARMERS']).format("0,0.0"))}%
                        </p>
                      </div>

                    </div>
                    <div className="col-3">
                      <div
                          className={`icon icon-box-${riseDrop(current[6].balance - current[5].balance, current[4]['FEEDS'] - current[4]['THIKA_FARMERS']) > 0 ? 'danger' : 'success'}`}>
                        <span
                            className={`mdi mdi-arrow-${riseDrop(current[6].balance - current[5].balance, current[4]['FEEDS'] - current[4]['THIKA_FARMERS']) < 0 ? 'bottom-left' : 'top-right'} icon-item`}/>
                      </div>
                    </div>
                  </div>}
                  <h6 className="text-muted font-weight-normal">Thika Farmers Debt</h6>
                </div>
              </div>
            </div>}
            {!isMobile &&
            <div className="col-xl-3 col-sm-6 grid-margin stretch-card">
              <div className="card">
                <div className="card-body">
                  {(forProfit && profit) && <div className="row">
                    <div className="col-9">
                      <div className="d-flex align-items-center align-self-start">
                        <h3 className="mb-0">KSh {numeral(parseFloat(forProfit[1].profit))
                            .format("0,0.00")}</h3>
                        <p className={`text-${riseDrop(forProfit[1].profit, getLatestWeekProfit().sun1)
                        < 0 ? 'danger' : 'success'} ml-2 mb-0 font-weight-medium`}>
                          {riseDrop(forProfit[1].profit, getLatestWeekProfit().sun1) < 0
                              ? numeral(riseDrop(forProfit[1].profit, getLatestWeekProfit().sun1)).format("0,0.0")
                              : '+'.concat(numeral(riseDrop(forProfit[1].profit, getLatestWeekProfit().sun1)).format("0,0.0"))}%
                        </p>
                      </div>
                    </div>
                    <div className="col-3">
                      <div
                          className={`icon icon-box-${riseDrop(forProfit[1].profit, getLatestWeekProfit().sun1) < 0 ? 'danger' : 'success'}`}>
                        <span
    className={`mdi mdi-arrow-${riseDrop(forProfit[1].profit, getLatestWeekProfit().sun1) < 0 ? 'bottom-left' : 'top-right'} icon-item`}/>
                      </div>
                    </div>
                  </div>}
                  <h6 className="text-muted font-weight-normal">Forecasted Next Week Profit</h6>
                </div>
              </div>
            </div>
            }
            {!isMobile &&
            <div className="col-xl-3 col-sm-6 grid-margin stretch-card">
              <div className="card">
                <div className="card-body">
                  {(forProfit && profit) && <div className="row">
                    <div className="col-9">
                      <div className="d-flex align-items-center align-self-start">
                        <h3 className="mb-0">KSh {numeral(parseFloat(forProfit[0].profit))
                            .format("0,0.00")}</h3>
                        <p className={`text-${riseDrop(forProfit[0].profit, forProfit[1].profit)
                        < 0 ? 'danger' : 'success'} ml-2 mb-0 font-weight-medium`}>
                          {riseDrop(forProfit[0].profit, forProfit[1].profit) < 0
                              ? numeral(riseDrop(forProfit[0].profit, forProfit[1].profit)).format("0,0.0")
                              : '+'.concat(numeral(riseDrop(forProfit[0].profit, forProfit[1].profit)).format("0,0.0"))}%
                        </p>
                      </div>
                    </div>
                    <div className="col-3">
                      <div
                          className={`icon icon-box-${riseDrop(forProfit[0].profit, forProfit[1].profit) < 0 ? 'danger' : 'success'}`}>
                        <span
                            className={`mdi mdi-arrow-${riseDrop(forProfit[0].profit, forProfit[1].profit) < 0 ? 'bottom-left' : 'top-right'} icon-item`}/>
                      </div>
                    </div>
                  </div>}
                  <h6 className="text-muted font-weight-normal">Forecasted 2 Weeks After Profit</h6>
                </div>
              </div>
            </div>
            }
            {!isMobile &&
            <div className="col-xl-3 col-sm-6 grid-margin stretch-card">
              <div className="card">
                <div className="card-body">
                  {trays && <div className="row">
                    <div className="col-9">
                      <div className="d-flex align-items-center align-self-start">
                        <h3 className="mb-0">
                          {!done3 && <CountUp
                              start={0}
                              end={parseFloat(decodeTrayEgg(trays[0].current)[0])}
                              duration={2.75}
                              delay={1}
                              onEnd={() => setDone3(true)}
                          />}{done3 && <div>
                          {decodeTrayEgg(trays[0].current)[0]},
                          {decodeTrayEgg(trays[0].current)[1]}
                        </div>}
                        </h3>
                        <p className={`text-${riseDrop(getEggs(decodeTrayEgg(trays[0].current)[0],
                            decodeTrayEgg(trays[0].current)[1]),
                            getEggs(decodeTrayEgg(trays[0].prev)[0],
                                decodeTrayEgg(trays[0].prev)[1]))
                        < 0 ? 'danger' : 'success'} ml-2 mb-0 font-weight-medium`}>
                          {riseDrop(getEggs(decodeTrayEgg(trays[0].current)[0],
                              decodeTrayEgg(trays[0].current)[1]),
                              getEggs(decodeTrayEgg(trays[0].prev)[0],
                                  decodeTrayEgg(trays[0].prev)[1])) < 0
                              ? numeral(riseDrop(getEggs(decodeTrayEgg(trays[0].current)[0],
                                  decodeTrayEgg(trays[0].current)[1]),
                                  getEggs(decodeTrayEgg(trays[0].prev)[0],
                                      decodeTrayEgg(trays[0].prev)[1]))).format("0,0.0")
                              : '+'.concat(numeral(riseDrop(getEggs(decodeTrayEgg(trays[0].current)[0],
                                  decodeTrayEgg(trays[0].current)[1]),
                                  getEggs(decodeTrayEgg(trays[0].prev)[0],
                                      decodeTrayEgg(trays[0].prev)[1]))).format("0,0.0"))}%
                        </p>
                      </div>
                    </div>
                    <div className="col-3">
                      <div className={`icon icon-box-${riseDrop(getEggs(decodeTrayEgg(trays[0].current)[0],
                          decodeTrayEgg(trays[0].current)[1]),
                          getEggs(decodeTrayEgg(trays[0].prev)[0],
                              decodeTrayEgg(trays[0].prev)[1])) < 0 ? 'danger' : 'success'}`}>
                        <span className={`mdi mdi-arrow-${riseDrop(getEggs(decodeTrayEgg(trays[0].current)[0],
    decodeTrayEgg(trays[0].current)[1]),
    getEggs(decodeTrayEgg(trays[0].prev)[0],
        decodeTrayEgg(trays[0].prev)[1])) < 0 ? 'bottom-left' : 'top-right'} icon-item`}/>
                      </div>
                    </div>
                  </div>}
                  <h6 className="text-muted font-weight-normal">Trays and Eggs in Store</h6>
                </div>
              </div>
            </div>
            }
            {!isMobile &&
            <div className="col-xl-3 col-sm-6 grid-margin stretch-card">
              <div className="card">
                <div className="card-body">
                  {chick && <div className="row">
                    <div className="col-9">
                      <div className="d-flex align-items-center align-self-start">
                        <h3 className="mb-0">KSh {numeral(getLatestWeekProfit().sun2).format("0,0.00")}</h3>
                        <p className={`text-${riseDrop(getLatestWeekProfit().sun1, getLatestWeekProfit().sun2)
                        < 0 ? 'danger' : 'success'} ml-2 mb-0 font-weight-medium`}>
                          {riseDrop(getLatestWeekProfit().sun1, getLatestWeekProfit().sun2) < 0
                              ? numeral(riseDrop(getLatestWeekProfit().sun1, getLatestWeekProfit().sun2)).format("0,0.0")
                              : '+'.concat(numeral(riseDrop(getLatestWeekProfit().sun1, getLatestWeekProfit().sun2)).format("0,0.0"))}%
                        </p>
                      </div>
                    </div>
                    <div className="col-3">
                      <div
                          className={`icon icon-box-${riseDrop(getLatestWeekProfit().sun1, getLatestWeekProfit().sun2) < 0 ? 'danger' : 'success'}`}>
                        <span
    className={`mdi mdi-arrow-${riseDrop(getLatestWeekProfit().sun1, getLatestWeekProfit().sun2) < 0 ? 'bottom-left' : 'top-right'} icon-item`}/>
                      </div>
                    </div>
                  </div>}
                  <h6 className="text-muted font-weight-normal">Last Week Profit</h6>
                </div>
              </div>
            </div>
            }
          </div>
          <div className="row">
            <div className="col-md-4 grid-margin stretch-card">
              <div className="card">
                <div className="card-body">
                  <h4 className="card-title">Transaction History</h4>
                  <div className="aligner-wrapper">
                    <Doughnut data={transactionHistoryData} options={transactionHistoryOptions} />
                    <div className="absolute center-content">
                      <h5 className="font-weight-normal text-white text-center mb-2 text-white">{numeral(parseFloat(trans.total)).format('0,0')}</h5>
                      <p className="text-small text-muted text-center mb-0">Total</p>
                    </div>
                  </div>
                  {JSON.stringify(trans) !== '{}' &&
                  <div>
                    { trans.time.map((item) => {
                      if (trans.time.length-1 > itemCount) itemCount++;
                      else itemCount = 0;

                      return (
                          <div key={itemCount}
                              className="bg-gray-dark d-flex d-md-block d-xl-flex flex-row py-3 px-4 px-md-3 px-xl-4 rounded mt-3">
                            <div className="text-md-center text-xl-left">
                              <h6 className="mb-1">Transfer to {trans.labels[itemCount]}</h6>
                              <p className="text-muted mb-0">{moment(item).fromNow()}</p>
                            </div>
                            <div
                                className="align-self-center flex-grow text-right text-md-center text-xl-right py-md-2 py-xl-0">
                              <h6 className="font-weight-bold mb-0">KSh {numeral(trans.sent[itemCount]).format("0,0")}</h6>
                            </div>
                          </div>
                      )
                    })}
                  </div>
                  }
                </div>
              </div>
            </div>
            <div className="col-md-8 grid-margin stretch-card">
              <div className="card">
                <div className="card-body">
                  <div className="d-flex flex-row justify-content-between">
                    <h4 className="card-title mb-1">Notifications</h4>
                    {!isMobile && <p className="text-muted mb-1">Time</p>}
                  </div>
                  <div className="row">
                    <div className="col-12">
                      <div className="preview-list">
                        {notifications
                        && !isMobile && notifications.map(item => {
                          const icon = getIcon(item.identifier, item.big);
                          return (
                              <div key={item.id} className="preview-item border-bottom">
                                <div className="preview-thumbnail">
                                  <div className="preview-icon bg-primary">
                                    <i className={`mdi mdi-${icon}`}/>
                                  </div>
                                </div>
                                <div className="preview-item-content d-sm-flex flex-grow">
                                  <div className="flex-grow">
                                    <h6 className="preview-subject">{item.content}</h6>
                                    <p className="text-muted mb-0">{`${truncate(item?.extraContent, 34)}`}</p>
                                  </div>
                                  <div className="mr-auto text-sm-right pt-2 pt-sm-0">
                                    <p className="text-muted"/>
                                    <p className="text-muted mb-0">On {moment(item.time.toDate()).format("MMM Do YY")}</p>
                                  </div>
                                </div>
                              </div>
                          )
                        })}
                        {notifications
                        && isMobile && notifications.slice(0, 3).map(item => {
                          const icon = getIcon(item.identifier, item.big);
                          return (
                              <div key={item.id} className="preview-item border-bottom">
                                <div className="preview-thumbnail">
                                  <div className="preview-icon bg-primary">
                                    <i className={`mdi mdi-${icon}`}/>
                                  </div>
                                </div>
                                <div className="preview-item-content d-sm-flex flex-grow">
                                  <div className="flex-grow">
                                    <h6 className="preview-subject">{item.content}</h6>
                                    <p className="text-muted mb-0">{`${truncate(item?.extraContent, 25)}`}</p>
                                  </div>
                                  <div className="mr-auto text-sm-right pt-2 pt-sm-0">
                                    <p className="text-muted"/>
                                    <p className="text-muted mb-0">On {moment(item.time.toDate()).format("MMM Do YY")}</p>
                                  </div>
                                </div>
                              </div>
                          )
                        })}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="row">
            <div className="col-sm-4 grid-margin">
              <div className="card">
                <div className="card-body">
                  <h5>Revenue</h5>
                  <div className="row">
                    <div className="col-8 col-sm-12 col-xl-8 my-auto">
                      <div className="d-flex d-sm-block d-md-flex align-items-center">
                        <h2 className="mb-0">KSh {
                          numeral(getRevenue(getTotal(stats).sales,
                                getTotal(stats).buys)).format('0,0')
                        }</h2>
                        <p className={`text-${riseDrop(
                            getRevenue(getTotal(stats).sales,
                                getTotal(stats).buys), getRevenue(getTotal(stats).prevAmountSale,
                                getTotal(stats).prevAmountBuy)) < 0 ? 'danger' : 'success'} ml-2 mb-0 font-weight-medium`}>
                          {riseDrop(
                            getRevenue(getTotal(stats).sales,
                            getTotal(stats).buys), getRevenue(getTotal(stats).prevAmountSale,
                                getTotal(stats).prevAmountBuy)) < 0
                            ? numeral(riseDrop(
                                getRevenue(getTotal(stats).sales,
                                    getTotal(stats).buys), getRevenue(getTotal(stats).prevAmountSale,
                                    getTotal(stats).prevAmountBuy))).format("0,0.0")
                            : '+'.concat(numeral(riseDrop(
                                getRevenue(getTotal(stats).sales,
                                    getTotal(stats).buys), getRevenue(getTotal(stats).prevAmountSale,
                                    getTotal(stats).prevAmountBuy))).format("0,0.0"))}%
                        </p>
                      </div>
                      <h6 className="text-muted font-weight-normal">{riseDrop(
                          getRevenue(getTotal(stats).sales,
                              getTotal(stats).buys), getRevenue(getTotal(stats).prevMonthSale,
                              getTotal(stats).prevMonthBuy)) < 0
                          ? numeral(riseDrop(
                              getRevenue(getTotal(stats).sales,
                                  getTotal(stats).buys), getRevenue(getTotal(stats).prevMonthSale,
                                  getTotal(stats).prevMonthBuy))).format("0,0.0")
                          : '+'.concat(numeral(riseDrop(
                              getRevenue(getTotal(stats).sales,
                                  getTotal(stats).buys), getRevenue(getTotal(stats).prevMonthSale,
                                  getTotal(stats).prevMonthBuy))).format("0,0.0"))}% Since last month</h6>
                    </div>
                    <div className="col-4 col-sm-12 col-xl-4 text-center text-xl-right">
                      <i className="icon-md mdi mdi-codepen text-primary ml-auto"/>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="col-sm-4 grid-margin">
              <div className="card">
                <div className="card-body">
                  <h5>Sales</h5>
                  <div className="row">
                    <div className="col-8 col-sm-12 col-xl-8 my-auto">
                      <div className="d-flex d-sm-block d-md-flex align-items-center">
                        <h2 className="mb-0">KSh {numeral(getTotal(stats).sales).format('0,0')}</h2>
                        <p className={`text-${riseDrop( 
                            getTotal(stats).sales,
                            getTotal(stats).prevAmountSale) < 0 ? 'danger' : 'success'} ml-2 mb-0 font-weight-medium`}>{riseDrop(
                            getTotal(stats).sales,
                                getTotal(stats).prevAmountSale) < 0
                            ? numeral(riseDrop(
                                getTotal(stats).sales,
                                getTotal(stats).prevAmountSale)).format("0,0.0")
                            : '+'.concat(numeral(riseDrop(
                                getTotal(stats).sales,
                                getTotal(stats).prevAmountSale)).format("0,0.0"))}%</p>
                      </div>
                      <h6 className="text-muted font-weight-normal">{riseDrop(
                          getTotal(stats).sales,
                          getTotal(stats).prevMonthSale) < 0
                          ? numeral(riseDrop(
                              getTotal(stats).sales,
                              getTotal(stats).prevMonthSale)).format("0,0.0")
                          : '+'.concat(numeral(riseDrop(
                              getTotal(stats).sales,
                              getTotal(stats).prevMonthSale)).format("0,0.0"))}% Since last month</h6>
                    </div>
                    <div className="col-4 col-sm-12 col-xl-4 text-center text-xl-right">
                      <i className={`icon-md mdi mdi-wallet-travel text-${riseDrop(
                          getTotal(stats).sales,
                          getTotal(stats).prevAmountSale) < 0 ? 'danger' : 'success'} ml-auto`}/>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="col-sm-4 grid-margin">
              <div className="card">
                <div className="card-body">
                  <h5>Purchases</h5>
                  <div className="row">
                    <div className="col-8 col-sm-12 col-xl-8 my-auto">
                      <div className="d-flex d-sm-block d-md-flex align-items-center">
                        <h2 className="mb-0">KSh {numeral(getTotal(stats).buys).format('0,0')}</h2>
                        <p className={`text-${riseDrop(
                            getTotal(stats).buys,
                            getTotal(stats).prevAmountBuy) < 0 ? 'success' : 'danger'} ml-2 mb-0 font-weight-medium`}>{riseDrop(
                            getTotal(stats).buys,
                            getTotal(stats).prevAmountBuy) < 0
                            ? numeral(riseDrop(
                                getTotal(stats).buys,
                                getTotal(stats).prevAmountBuy)).format("0,0.0")
                            : '+'.concat(numeral(riseDrop(
                                getTotal(stats).buys,
                                getTotal(stats).prevAmountBuy)).format("0,0.0"))}%</p>
                      </div>
                      <h6 className="text-muted font-weight-normal">{riseDrop(
                          getTotal(stats).buys,
                          getTotal(stats).prevMonthBuy) < 0
                          ? numeral(riseDrop(
                              getTotal(stats).buys,
                              getTotal(stats).prevMonthBuy)).format("0,0.0")
                          : '+'.concat(numeral(riseDrop(
                              getTotal(stats).buys,
                              getTotal(stats).prevMonthBuy)).format("0,0.0"))}% Since last month</h6>
                    </div>
                    <div className="col-4 col-sm-12 col-xl-4 text-center text-xl-right">
                      <i className={`icon-md mdi mdi-monitor text-${riseDrop(
                          getTotal(stats).buys,
                          getTotal(stats).prevAmountBuy) < 0 ? 'success' : 'danger'} ml-auto`}/>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="row ">
            <div className="col-12 grid-margin">
              <div className="card">
                <div className="card-body">
                  <h4 className="card-title">Pending Transactions</h4>
                  <div className="table-responsive">
                    <table className="table">
                      <thead>
                      <tr>
                        <th>
                          <div className="form-check form-check-muted m-0">
                            <label className="form-check-label">
                              <input
                                  disabled={disable}
                                  type="checkbox"
                                  className="form-check-input"
                                  defaultValue={0}
                                  onChange={() => {
                                    setAllChecked(!allChecked);
                                    addAllEntries(!allChecked);
                                  }}
                                  checked={allChecked}
                                  id="pending"
                                  name="pending"
                              />
                              <i className="input-helper"/>
                            </label>
                          </div>
                        </th>
                        <th> From </th>
                        <th> To </th>
                        <th> Amount </th>
                        <th> Category </th>
                        <th> Section </th>
                        <th> Date </th>
                        <th> Mining Status </th>
                      </tr>
                      </thead>
                      <tbody>
                      {pend && pend.map((item) => {
                        let disCheckBox = name !== (item.values?.name
                            || item.values?.from)
                            && item.values?.name !== "ANNE";
                        if (item.id === "cleared") return null;

                        return (
                              <tr key={item.id}>
                                <td>
                                  <div className="form-check form-check-muted m-0">
                                    <label className="form-check-label">
                                      <input disabled={disCheckBox} type="checkbox"
                                             className="form-check-input" defaultValue={0}
                                             checked={pendChecked[item.id]}
                                             onChange={() => setPendChecked({...pendChecked,
                                               [item.id]: !pendChecked[item.id]})}
                                             id={item.id} name={item.id}
                                      />
                                      <i className="input-helper"/>
                                    </label>
                                  </div>
                                </td>
                                <td>
                                  <div className="d-flex">
                                    <span className="pl-2">
                                      {item.values.category !== "send" && item.values.category !== "borrow" && 'Miner'}
                                      {item.values.category === "send" && item?.values?.name && sanitize_string(item?.values?.name)}
                                      {item.values.category === "borrow" && sanitize_string(item?.values?.borrower)}
                                    </span>
                                  </div>
                                </td>
                                <td>
                                  {item.values.category !== "send" && item.values.category !== "buys" && item.values.category !== "borrow"
                                  && item.values.section !== "THIKA_FARMERS" && item.values.section !== "DUKA"
                                  && sanitize_string(item?.values?.name)}
                                  {item.values.section === "THIKA_FARMERS" && "Thika Farmers"}
                                  {item.values.section === "DUKA" && "Jeff Duka"}
                                  {item.values.category === "send" && item?.values?.receiver && sanitize_string(item?.values?.receiver)}
                                  {item.values.category === "borrow" && sanitize_string(item?.values?.get_from)}
                                  {item.values.category === "buys" && sanitize_string(item?.values?.section)}
                                </td>
                                <td> {numeral(parseFloat(getAmount(item))).format("0,0")} </td>
                                <td> {sanitize_string(item.values?.category)} </td>
                                <td> {sanitize_string(item.values?.section || item.values?.category)} </td>
                                <td> {moment(item.values?.date?.toDate() || item?.submittedOn?.toDate()).format("MMM Do YY")} </td>
                                <td>
                                  {isRejected(item?.submittedOn?.toDate()) && !item?.rejected && <div className="badge badge-outline-danger">Rejected</div>}
                                  {isRejected(item?.submittedOn?.toDate()) && item?.rejected && <div className="badge badge-outline-info">Rejected</div>}
                                  {!isRejected(item?.submittedOn?.toDate()) && !item?.rejected && <div className="badge badge-outline-warning">Pending</div>}
                                </td>
                              </tr>
                            )
                      })}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
            <button type="button" disabled={false} className="btn btn-primary" onClick={display} id='rewind'>
              Rewind
            </button>
            <Online>
              <Snackbar open={open} autoHideDuration={5000} onClose={handleClose}>
                <Alert onClose={handleClose} severity="success">
                  Accepted. Pending Transactions will be rewinded
                </Alert>
              </Snackbar>
              <Snackbar open={error} autoHideDuration={5000} onClose={handleClose}>
                <Alert onClose={handleClose} severity="danger">
                  {errM}
                </Alert>
              </Snackbar>
            </Online>
            <Offline>
              <Snackbar open={open} autoHideDuration={5000} onClose={handleClose}>
                <Alert onClose={handleClose} severity="warning">
                  Accepted. Rewinding will happen when back online
                </Alert>
              </Snackbar>
            </Offline>
          </div>
        </div>
  );
}

const mapStateToProps = function(state) {
  return {
    notifications: state.firestore.ordered.notifications,
    pend: state.firestore.ordered.pending_transactions,
    forProfit: state.firestore.ordered.predict_week,
    profit: state.firestore.ordered.profit,
    chick: state.firestore.ordered.chicken_details,
    trays: state.firestore.ordered.trays,
    block: state.firestore.ordered.transactions,
    current: state.firestore.ordered.current,
    stats: state.firestore.ordered.stats
  }
}

export default compose(
    connect(mapStateToProps),
    firestoreConnect([
      {collection: 'notifications', limit: 8, orderBy: ['time', 'desc']},
      {collection: 'pending_transactions' },
      {collection: 'predict_week', orderBy: ['date', 'desc']},
      {collection: 'profit', limit: 3, orderBy: ['date', 'desc']},
      {collection: 'chicken_details'},
      {collection: 'trays'},
      {collection: 'current', orderBy: ['important', 'asc'] },
      {collection: 'transactions', limit: 1},
      {collection: 'stats'}
    ])
)(Dashboard);
