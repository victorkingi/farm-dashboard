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
import {firestore, firebase} from "../../services/api/fbConfig";

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

function removeA(arr) {
  let what, a = arguments, L = a.length, ax;
  while (L > 1 && arr.length) {
    what = a[--L];
    while ((ax= arr.indexOf(what)) !== -1) {
      arr.splice(ax, 1);
    }
  }
  return arr;
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
    if (sales && buys) return {
      sales,
      prevMonthSale,
      prevAmountSale,
      buys,
      prevMonthBuy,
      prevAmountBuy
    }
    else console.error("Sales or Buys returned undefined", stats);
  }
  return { sales: 0, buys: 0 }
}

function getUser() {
  let user = localStorage.getItem('name');
  user = user !== null ? user.toUpperCase() : '';
  if (user === 'BANK') return 0;
  else if (user === 'JEFF') return 1;
  else if (user === 'VICTOR') return 2;
  else if (user === 'BABRA') return 3;
  else return 3;
}

function Dashboard(props) {
  const { notifications, pend, forProfit,
      profit, bags, chick, trays,
      block, current, stats
  } = props;

  const [state, setState] = useState({arr: []});
  const [open, setOpen] = useState(false);
  const [trans, setTrans] = useState({});
  const [done, setDone] = useState(false);
  const [done1, setDone1] = useState(false);
  const [done2, setDone2] = useState(false);
  const [done3, setDone3] = useState(false);
  const [done4, setDone4] = useState(false);
  const [error, setError] = useState(false);
  const [errM, setErrM] = useState('');
  const [disable, setDisable] = useState(false);
  const [name, setName] = useState('');

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
    let name = firebase.auth().currentUser?.displayName;
    name = name?.substring(0, name?.lastIndexOf(' '))?.toUpperCase();
    setName(name);
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
        for (let k = 0; k < pend.length; k++) {
          if (pend[k].values?.name !== name
              && pend[k].values?.name !== "ANNE") {
            setDisable(true);
          }
        }
      }
    }
  }, [block, pend]);

  // undo write events to database
  const rollBack = (state_) => {
      for (let i = 0; i < state_.length; i++) {
        firestore.collection("pending_transactions").doc(state_[i])
            .get().then((doc) => {
          if (doc.exists) {
            doc.ref.delete();
          } else {
            const err = new Error("Invalid data!");
            setOpen(false);
            setErrM("The reference no longer exists, it probably didn't have a clean exit delete instruction");
            setError(true);
            throw err;
          }
        })
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

  const sanitize_string = (str) => {
     if (!str) return;
     let str_1 = str.toUpperCase().charAt(0).concat(str.toLowerCase().slice(1));
     str_1 = str_1.includes('_')
         ? str_1.replace('_', ' ') : str_1;
     let str_2 = str_1.includes(' ')
         ? str_1.substring(str_1.lastIndexOf(' ')+1) : null;
     str_2 = str_2 !== null ? str_2.toUpperCase().charAt(0)
         .concat(str_2.toLowerCase().slice(1)) : null;
     if (str_2 !== null) {
       str_1 = str_1.substring(0, str_1.lastIndexOf(" "))
           .concat(" ").concat(str_2);
     }
     return str_1
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

  const handleSelect = (e) => {
     e.preventDefault();
     let arr = state.arr;
     if (e.target.id === "pending" && e.target.checked) {
       for (let i = 0; i < pend.length; i++) {
         if (pend[i].id === "cleared") continue;
         const me  = document.getElementById(pend[i].id);
         me.checked = true;
         arr.push(pend[i].id);
       }
     } else if (e.target.id === "pending" && !e.target.checked) {
       for (let i = 0; i < pend.length; i++) {
         if (pend[i].id === "cleared") continue;
         const me  = document.getElementById(pend[i].id);
         me.checked = false;
         arr = removeA(arr, pend[i].id);
       }
     } else if (!e.target.checked) {
       arr = removeA(arr, e.target.id);
     } else {
       arr.push(e.target.id);
     }
     setState({arr});
   }

  const display = (e) => {
     e.preventDefault();
     const submit = document.getElementById(`rewind`);
     submit.disabled = true;
     rollBack(state.arr);
     setOpen(true);
   }

  const isRejected = (date) => {
     if (date) {
       let today = new Date().getTime();
       const mineTime = date;
       mineTime.setDate(mineTime.getDate()+1);
       mineTime.setHours(3, 0, 0, 0);
       return mineTime.getTime() < today; //if expected mining date is long ago then it failed
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
       let user = localStorage.getItem('name');
       user = user !== null ? user.toUpperCase() : '';
       return myProfit[user]?.toString()+','+myProfit['prev'+user];
     }
    return '0,0'
   }

  return (
      <div>
          <div className="row">
            <div className="col-xl-3 col-sm-6 grid-margin stretch-card">
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
                              ? numeral(riseDrop(availToWithdraw().split(',')[0], availToWithdraw().split(',')[1])).format("0.0")
                              : '+'.concat(numeral(riseDrop(availToWithdraw().split(',')[0], availToWithdraw().split(',')[1])).format("0.0"))}%
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
            </div>
            <div className="col-xl-3 col-sm-6 grid-margin stretch-card">
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
                        <p className={`text-success ml-2 mb-0 font-weight-medium`}>
                          {'+'.concat(numeral().format("0.0"))}%
                        </p>
                      </div>
                    </div>
                    <div className="col-3">
                      <div
                          className={`icon icon-box-success`}>
                        <span
                            className={`mdi mdi-arrow-top-right icon-item`}/>
                      </div>
                    </div>
                  </div>}
                  <h6 className="text-muted font-weight-normal">Current Debt</h6>
                </div>
              </div>
            </div>
            <div id="laying" className="col-xl-3 col-sm-6 grid-margin stretch-card">
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
                              ? numeral(riseDrop(chick[0].weekPercent, chick[0].prevWeekPercent)).format("0.0")
                              : '+'.concat(numeral(riseDrop(chick[0].weekPercent, chick[0].prevWeekPercent)).format("0.0"))}%
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
            <div id="feeds" className="col-xl-3 col-sm-6 grid-margin stretch-card">
              <div className="card">
                <div className="card-body">
                  {bags && <div className="row">
                    <div className="col-9">
                      <div className="d-flex align-items-center align-self-start">
                        <h3 className="mb-0">{!done2 &&
                        <CountUp
                            start={0}
                            end={parseFloat(bags[1].number || bags[0].number)}
                            duration={2.75}
                            delay={1}
                            onEnd={() => setDone2(true)}
                        />}{done2 && (bags[1].number || bags[0].number)}</h3>
                        <p className={`text-${riseDrop(bags[1].number || bags[0].number, bags[0].nextDay || bags[1].nextDay)
                        < 0 ? 'danger' : 'success'} ml-2 mb-0 font-weight-medium`}>
                          {riseDrop(bags[1].number || bags[0].number, bags[0].nextDay || bags[1].nextDay) < 0
                              ? numeral(riseDrop(bags[1].number || bags[0].number, bags[0].nextDay || bags[1].nextDay)).format("0.0")
                              : '+'.concat(numeral(riseDrop(bags[1].number || bags[0].number, bags[0].nextDay || bags[1].nextDay)).format("0.0"))}%
                        </p></div>
                    </div>
                    <div className="col-3">
                      <div
                          className={`icon icon-box-${riseDrop(bags[1].number || bags[0].number, bags[0].nextDay || bags[1].nextDay) < 0 ? 'danger' : 'success'}`}>
                        <span
    className={`mdi mdi-arrow-${riseDrop(bags[1].number || bags[0].number, bags[0].nextDay || bags[1].nextDay) < 0 ? 'bottom-left' : 'top-right'} icon-item`}/>
                      </div>
                    </div>
                  </div>}
                  <h6 className="text-muted font-weight-normal">Next Day Feeds in Store</h6>
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
                        <p className={`text-${riseDrop(current[0].balance, current[0].balance)
                        < 0 ? 'danger' : 'success'} ml-2 mb-0 font-weight-medium`}>
                          {riseDrop(current[0].balance, current[0].balance) < 0
                              ? numeral(riseDrop(current[0].balance, current[0].balance)).format("0.0")
                              : '+'.concat(numeral(riseDrop(current[0].balance, current[0].balance)).format("0.0"))}%
                        </p>
                      </div>

                    </div>
                    <div className="col-3">
                      <div
                          className={`icon icon-box-${riseDrop(current[0].balance, current[0].balance) < 0 ? 'danger' : 'success'}`}>
                        <span
                            className={`mdi mdi-arrow-${riseDrop(riseDrop(current[0].balance, current[0].balance)) < 0 ? 'bottom-left' : 'top-right'} icon-item`}/>
                      </div>
                    </div>
                  </div>}
                  <h6 className="text-muted font-weight-normal">Bank Balance</h6>
                </div>
              </div>
            </div>
            {!isMobile &&
            <div className="col-xl-3 col-sm-6 grid-margin stretch-card">
              <div className="card">
                <div className="card-body">
                  {(forProfit && profit) && <div className="row">
                    <div className="col-9">
                      <div className="d-flex align-items-center align-self-start">
                        <h3 className="mb-0">KSh {numeral(parseFloat(forProfit[1].profit))
                            .format("0,0.00")}</h3>
                        <p className={`text-${riseDrop(forProfit[1].profit, profit[0].profit)
                        < 0 ? 'danger' : 'success'} ml-2 mb-0 font-weight-medium`}>
                          {riseDrop(forProfit[1].profit, profit[0].profit) < 0
                              ? numeral(riseDrop(forProfit[1].profit, profit[0].profit)).format("0.0")
                              : '+'.concat(numeral(riseDrop(forProfit[1].profit, profit[0].profit)).format("0.0"))}%
                        </p>
                      </div>
                    </div>
                    <div className="col-3">
                      <div
                          className={`icon icon-box-${riseDrop(forProfit[1].profit, profit[0].profit) < 0 ? 'danger' : 'success'}`}>
                        <span
    className={`mdi mdi-arrow-${riseDrop(forProfit[1].profit, profit[0].profit) < 0 ? 'bottom-left' : 'top-right'} icon-item`}/>
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
                                      decodeTrayEgg(trays[0].prev)[1]))).format("0.0")
                              : '+'.concat(numeral(riseDrop(getEggs(decodeTrayEgg(trays[0].current)[0],
                                  decodeTrayEgg(trays[0].current)[1]),
                                  getEggs(decodeTrayEgg(trays[0].prev)[0],
                                      decodeTrayEgg(trays[0].prev)[1]))).format("0.0"))}%
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
                              ? numeral(riseDrop(getLatestWeekProfit().sun1, getLatestWeekProfit().sun2)).format("0.0")
                              : '+'.concat(numeral(riseDrop(getLatestWeekProfit().sun1, getLatestWeekProfit().sun2)).format("0.0"))}%
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
                                    getTotal(stats).prevAmountBuy))).format("0.0")
                            : '+'.concat(numeral(riseDrop(
                                getRevenue(getTotal(stats).sales,
                                    getTotal(stats).buys), getRevenue(getTotal(stats).prevAmountSale,
                                    getTotal(stats).prevAmountBuy))).format("0.0"))}%
                        </p>
                      </div>
                      <h6 className="text-muted font-weight-normal">{riseDrop(
                          getRevenue(getTotal(stats).sales,
                              getTotal(stats).buys), getRevenue(getTotal(stats).prevMonthSale,
                              getTotal(stats).prevMonthBuy)) < 0
                          ? numeral(riseDrop(
                              getRevenue(getTotal(stats).sales,
                                  getTotal(stats).buys), getRevenue(getTotal(stats).prevMonthSale,
                                  getTotal(stats).prevMonthBuy))).format("0.0")
                          : '+'.concat(numeral(riseDrop(
                              getRevenue(getTotal(stats).sales,
                                  getTotal(stats).buys), getRevenue(getTotal(stats).prevMonthSale,
                                  getTotal(stats).prevMonthBuy))).format("0.0"))}% Since last month</h6>
                    </div>
                    <div className="col-4 col-sm-12 col-xl-4 text-center text-xl-right">
                      <i className="icon-lg mdi mdi-codepen text-primary ml-auto"/>
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
                                getTotal(stats).prevAmountSale)).format("0.0")
                            : '+'.concat(numeral(riseDrop(
                                getTotal(stats).sales,
                                getTotal(stats).prevAmountSale)).format("0.0"))}%</p>
                      </div>
                      <h6 className="text-muted font-weight-normal">{riseDrop(
                          getTotal(stats).sales,
                          getTotal(stats).prevMonthSale) < 0
                          ? numeral(riseDrop(
                              getTotal(stats).sales,
                              getTotal(stats).prevMonthSale)).format("0.0")
                          : '+'.concat(numeral(riseDrop(
                              getTotal(stats).sales,
                              getTotal(stats).prevMonthSale)).format("0.0"))}% Since last month</h6>
                    </div>
                    <div className="col-4 col-sm-12 col-xl-4 text-center text-xl-right">
                      <i className={`icon-lg mdi mdi-wallet-travel text-${riseDrop(
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
                                getTotal(stats).prevAmountBuy)).format("0.0")
                            : '+'.concat(numeral(riseDrop(
                                getTotal(stats).buys,
                                getTotal(stats).prevAmountBuy)).format("0.0"))}%</p>
                      </div>
                      <h6 className="text-muted font-weight-normal">{riseDrop(
                          getTotal(stats).buys,
                          getTotal(stats).prevMonthBuy) < 0
                          ? numeral(riseDrop(
                              getTotal(stats).buys,
                              getTotal(stats).prevMonthBuy)).format("0.0")
                          : '+'.concat(numeral(riseDrop(
                              getTotal(stats).buys,
                              getTotal(stats).prevMonthBuy)).format("0.0"))}% Since last month</h6>
                    </div>
                    <div className="col-4 col-sm-12 col-xl-4 text-center text-xl-right">
                      <i className={`icon-lg mdi mdi-monitor text-${riseDrop(
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
                              <input disabled={disable} type="checkbox" className="form-check-input" defaultValue={0} onChange={handleSelect} id="pending" name="pending" />
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
                        let disCheckBox = name !== item.values?.name
                            && item.values?.name !== "ANNE";
                        if (item.id === "cleared") return null;

                        return (
                              <tr key={item.id}>
                                <td>
                                  <div className="form-check form-check-muted m-0">
                                    <label className="form-check-label">
                                      <input disabled={disCheckBox} type="checkbox" className="form-check-input" defaultValue={0} onChange={(e) => handleSelect(e, item?.id)} id={item.id} name={item.id}  />
                                      <i className="input-helper"/>
                                    </label>
                                  </div>
                                </td>
                                <td>
                                  <div className="d-flex">
                                    <span className="pl-2">
                                      {item.values.category !== "send" && item.values.category !== "borrow" && 'Miner'}
                                      {item.values.category === "send" && sanitize_string(item?.values?.name)}
                                      {item.values.category === "borrow" && sanitize_string(item?.values?.borrower)}
                                    </span>
                                  </div>
                                </td>
                                <td>
                                  {item.values.category !== "send" && item.values.category !== "borrow"
                                  && item.values.section !== "THIKA_FARMERS" && item.values.section !== "DUKA"
                                  && sanitize_string(item?.values?.name)}
                                  {item.values.section === "THIKA_FARMERS" && "Thika Farmers"}
                                  {item.values.section === "DUKA" && "Jeff Duka"}
                                  {item.values.category === "send" && sanitize_string(item?.values?.receiver)}
                                  {item.values.category === "borrow" && sanitize_string(item?.values?.get_from)}
                                </td>
                                <td> {numeral(parseFloat(getAmount(item))).format("0,0")} </td>
                                <td> {sanitize_string(item.values?.category)} </td>
                                <td> {sanitize_string(item.values?.section || item.values?.category)} </td>
                                <td> {moment(item.values?.date?.toDate() || item?.submittedOn?.toDate()).format("MMM Do YY")} </td>
                                <td>
                                  {isRejected(item?.submittedOn?.toDate()) ? <div className="badge badge-outline-danger">Rejected</div>
                                      : <div className="badge badge-outline-warning">Pending</div>
                                  }

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
    bags: state.firestore.ordered.bags,
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
      {collection: 'bags', orderBy: ['submittedOn', 'desc']},
      {collection: 'chicken_details'},
      {collection: 'trays'},
      {collection: 'current', orderBy: ['important', 'asc'] },
      {collection: 'transactions', limit: 1},
      {collection: 'stats'}
    ])
)(Dashboard);
